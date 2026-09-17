import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerateContentResult,
  type GenerationConfig,
  type ObjectSchema,
  type UsageMetadata,
} from "@google/generative-ai";
import { createHash, randomUUID } from "crypto";
import {
  checkScheduleFromAiTimes,
  clockMinutes,
  windowCrossesMidnight,
  type DayScheduleCheck,
} from "@/lib/scheduleCheck";
import { matchCarRestrictionArea } from "@/lib/carRestriction";

export const runtime = "nodejs";

interface ApiKeyEntry {
  key: string;
  tier: "FREE" | "DEFAULT";
}

function getApiKeys(): ApiKeyEntry[] {
  const keys: ApiKeyEntry[] = [];
  const freeKey = process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_API_KEY;
  if (freeKey && freeKey.length > 10) {
    keys.push({ key: freeKey, tier: "FREE" });
  }
  return keys;
}

type PlanAuditError =
  | "bad_method"
  | "bad_origin"
  | "bad_turnstile"
  | "rate_limit_ip_minute"
  | "rate_limit_ip_day"
  | "rate_limit_session_day"
  | "concurrent_ip"
  | "bad_input"
  | "duplicate"
  | "missing_api_key"
  | "gemini_error"
  | "gemini_attempt_failed"
  | "ok";

/**
 * AI生成が失敗したときにクライアントへ返すエラーコード。
 * クライアントは errorCode で多言語辞書（tripPlannerDictionaries の error.*）を引く。
 * ここの日本語はその辞書の日本語と同じ文面にしている。
 * ai_busy / ai_unavailable / ai_failed は API 呼び出し自体の失敗、ai_blocked 以降は応答はあったがプランとして使えなかった場合。
 */
type PlanErrorCode =
  | "ai_busy"
  | "ai_failed"
  | "ai_unavailable"
  | "bad_request"
  | "ai_blocked"
  | "ai_empty_response"
  | "ai_truncated"
  | "ai_bad_finish"
  | "ai_invalid_json";

/** 応答の中身から判定する失敗の種類 */
type PlanResponseErrorCode = Extract<
  PlanErrorCode,
  "ai_blocked" | "ai_empty_response" | "ai_truncated" | "ai_bad_finish" | "ai_invalid_json"
>;

const PLAN_ERROR_MESSAGES: Record<PlanErrorCode, string> = {
  ai_busy: "現在AIへのアクセスが集中しています。しばらく時間をおいてから再度お試しください。",
  ai_failed:
    "AIがプランを正しく作成できませんでした。お手数ですが、もう一度お試しください。目的地の数や日数を減らすと成功しやすくなります。",
  ai_unavailable: "AIプラン作成を一時的に利用できません。しばらくしてから再度お試しください。",
  bad_request: "AIプラン作成リクエストを処理できませんでした。入力内容を確認してから再度お試しください。",
  ai_blocked: "AIが安全上の理由でプランを作成できませんでした。目的地やプロフィールの内容を見直してから再度お試しください。",
  ai_empty_response: "AIから応答が返ってきませんでした。お手数ですが、もう一度お試しください。",
  ai_truncated: "AIの応答が途中で途切れました。目的地の数や日数を減らしてから再度お試しください。",
  ai_bad_finish: "AIがプランの作成を途中で中断しました。お手数ですが、もう一度お試しください。",
  ai_invalid_json:
    "AIの応答をプランとして読み取れませんでした。お手数ですが、もう一度お試しください。目的地の数や日数を減らすと成功しやすくなります。",
};

const MAX_DAYS = 5;
const MAX_DESTINATIONS_PER_DAY = 8;
const MAX_TOTAL_TEXT_LENGTH = 8000;

/*
 * 出力トークン上限の見積もり。
 * 2026-09 に Gemini トークナイザで、プロンプトの出力形式どおりのJSON（2プラン分・改行インデントあり）を実測した値に余裕を足している。
 * 実測: 1アイテム約230〜320トークン（説明文0〜150字）、1日あたり食事情報など約150、1プランあたり総評など約650。
 * 1日×3目的地で約5,300、1日×8目的地で約9,300、5日×8目的地で約47,000トークン必要だった（旧固定値8,192では1日×8目的地で途切れる）。
 */
const OUTPUT_TOKENS_PER_ITEM = 320;
const OUTPUT_TOKENS_PER_DAY = 200;
const OUTPUT_TOKENS_PER_PLAN = 700;
/** 指定した目的地以外に1日あたり増えうるアイテム数（休憩・散歩スポットなど） */
const EXTRA_ITEMS_PER_DAY = 3;
/** AIおまかせ提案がオンのときに1日あたり追加で増えうるアイテム数 */
const EXTRA_ITEMS_PER_DAY_OMAKASE = 2;
const PLAN_COUNT = 2;
const OUTPUT_TOKENS_MIN = 8192;
/** gemini-3.5-flash-lite / gemini-2.5-flash-lite の出力上限 */
const OUTPUT_TOKENS_MAX = 65536;
/** thinking を止められなかったときに上乗せする分（thinking のトークンも出力上限に含まれるため） */
const THINKING_TOKENS_ALLOWANCE = 8192;
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const planIpMinuteHits = new Map<string, number[]>();
const planIpDayHits = new Map<string, number[]>();
const planSessionDayHits = new Map<string, number[]>();
const planActiveIpRuns = new Map<string, number>();
const planRecentContent = new Map<string, number>();

interface PlanRequest {
  turnstileToken?: string;
  sessionId?: string;
  days: {
    dayIndex: number;
    departure: string;
    departureTime: string;
    destinations: {
      name: string;
      address?: string;
      lat?: number;
      lng?: number;
      isOmakase: boolean;
      meal?: "" | "lunch" | "dinner";
    }[];
    arrival: string;
    arrivalTime: string;
    includeLunch: boolean;
    lunchLocation: string;
    lunchGenre: string;
    includeDinner: boolean;
    dinnerLocation: string;
    dinnerGenre: string;
    firstDestId?: string;
  }[];
  withDog: boolean;
  aiOmakase?: boolean;
  useHighway?: boolean; // true (default) = use highways; false = general roads only
  travelDate?: string; // "YYYY-MM-DD"
  travelerProfile?: {
    partyType: string;
    ageRange: string;
    hobbies: string;
    hasChildren: boolean;
    childAges: string;
  };
}

function planJsonError(message: string, status: number, errorType: PlanAuditError, errorCode?: PlanErrorCode) {
  return NextResponse.json(errorCode ? { error: message, errorType, errorCode } : { error: message, errorType }, { status });
}

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || forwarded || "unknown";
}

function hashValue(value: string): string {
  const salt = process.env.AUDIT_LOG_SALT || "ai-drive-planner";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 24);
}

function allowedOrigins(): string[] {
  return [
    "https://www.ai-drive-planner.com",
    "https://ai-drive-planner.com",
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((origin): origin is string => Boolean(origin));
}

function verifyOrigin(request: NextRequest): boolean {
  const allowed = allowedOrigins();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (origin) return allowed.includes(origin);
  if (!referer) return false;
  try {
    return allowed.includes(new URL(referer).origin);
  } catch {
    return false;
  }
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ip,
        idempotency_key: randomUUID(),
      }),
    });
    const result = (await response.json()) as { success?: boolean };
    return Boolean(result.success);
  } catch {
    return false;
  }
}

function pruneHits(map: Map<string, number[]>, key: string, windowMs: number, now: number): number[] {
  const hits = (map.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
  map.set(key, hits);
  return hits;
}

function checkPlanRateLimit(ipHash: string, sessionId: string) {
  const now = Date.now();
  if (pruneHits(planIpMinuteHits, ipHash, MINUTE_MS, now).length >= 1) {
    return { ok: false, status: 429, errorType: "rate_limit_ip_minute" as const, message: "短時間に複数回のAIプラン作成が行われました。1分ほど待ってから再度お試しください。" };
  }
  if (pruneHits(planIpDayHits, ipHash, DAY_MS, now).length >= 20) {
    return { ok: false, status: 429, errorType: "rate_limit_ip_day" as const, message: "本日のAIプラン作成回数が上限に達しました。明日以降に再度お試しください。" };
  }
  if (pruneHits(planSessionDayHits, sessionId, DAY_MS, now).length >= 10) {
    return { ok: false, status: 429, errorType: "rate_limit_session_day" as const, message: "このブラウザでの本日のAIプラン作成回数が上限に達しました。明日以降に再度お試しください。" };
  }
  if ((planActiveIpRuns.get(ipHash) || 0) >= 1) {
    return { ok: false, status: 429, errorType: "concurrent_ip" as const, message: "同じ回線からAIプラン作成が実行中です。完了してから再度お試しください。" };
  }
  return { ok: true as const };
}

function recordAcceptedPlanRequest(ipHash: string, sessionId: string) {
  const now = Date.now();
  planIpMinuteHits.set(ipHash, [...(planIpMinuteHits.get(ipHash) || []), now]);
  planIpDayHits.set(ipHash, [...(planIpDayHits.get(ipHash) || []), now]);
  planSessionDayHits.set(sessionId, [...(planSessionDayHits.get(sessionId) || []), now]);
  planActiveIpRuns.set(ipHash, (planActiveIpRuns.get(ipHash) || 0) + 1);
}

function releasePlanIp(ipHash: string) {
  const next = Math.max(0, (planActiveIpRuns.get(ipHash) || 0) - 1);
  if (next === 0) planActiveIpRuns.delete(ipHash);
  else planActiveIpRuns.set(ipHash, next);
}

function contentHash(body: PlanRequest): string {
  return createHash("sha256")
    .update(JSON.stringify({
      days: body.days?.map((day) => ({
        departure: day.departure,
        departureTime: day.departureTime,
        destinations: day.destinations?.map((destination) => ({
          name: destination.name,
          address: destination.address,
          lat: destination.lat,
          lng: destination.lng,
          isOmakase: destination.isOmakase,
          meal: destination.meal,
        })),
        arrival: day.arrival,
        arrivalTime: day.arrivalTime,
        includeLunch: day.includeLunch,
        lunchLocation: day.lunchLocation,
        lunchGenre: day.lunchGenre,
        includeDinner: day.includeDinner,
        dinnerLocation: day.dinnerLocation,
        dinnerGenre: day.dinnerGenre,
      })),
      withDog: body.withDog,
      aiOmakase: body.aiOmakase,
      useHighway: body.useHighway,
      travelDate: body.travelDate,
      travelerProfile: body.travelerProfile,
    }))
    .digest("hex");
}

function checkDuplicate(hash: string): boolean {
  const now = Date.now();
  for (const [key, timestamp] of planRecentContent) {
    if (now - timestamp >= DUPLICATE_WINDOW_MS) planRecentContent.delete(key);
  }
  const previous = planRecentContent.get(hash);
  if (previous && now - previous < DUPLICATE_WINDOW_MS) return false;
  planRecentContent.set(hash, now);
  return true;
}

function validatePlanInput(body: PlanRequest): { ok: true } | { ok: false; message: string } {
  if (!body || !Array.isArray(body.days) || body.days.length === 0) {
    return { ok: false, message: "プラン作成に必要な日程がありません。" };
  }
  if (body.days.length > MAX_DAYS) {
    return { ok: false, message: `一度にAI作成できる日程は${MAX_DAYS}日までです。日数を減らしてからお試しください。` };
  }
  if (Array.isArray((body as unknown as { images?: unknown[] }).images) && (body as unknown as { images: unknown[] }).images.length > 0) {
    return { ok: false, message: "画像データはAIプラン作成APIへ送信できません。" };
  }
  for (const day of body.days) {
    if (!Array.isArray(day.destinations)) {
      return { ok: false, message: "目的地の形式が正しくありません。" };
    }
    if (day.destinations.length > MAX_DESTINATIONS_PER_DAY) {
      return { ok: false, message: `1日あたりの目的地は${MAX_DESTINATIONS_PER_DAY}件までにしてください。` };
    }
  }
  if (JSON.stringify(body).length > MAX_TOTAL_TEXT_LENGTH) {
    return { ok: false, message: "入力内容が長すぎます。目的地やプロフィールの内容を短くしてからお試しください。" };
  }
  return { ok: true };
}

function auditPlanLog(data: {
  requestId: string;
  ipHash: string;
  userAgent: string;
  sessionId: string;
  errorType: PlanAuditError;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  thoughtsTokens?: number;
  model?: string;
  maxOutputTokens?: number;
  thinking?: PlanThinkingSetting;
  structuredOutput?: boolean;
  finishReason?: string;
  blockReason?: string;
  httpStatus?: number;
  errorCode?: PlanErrorCode;
  usageMetadata?: UsageMetadata;
  /** initial: 通常の生成 / parse_retry: JSON読み取り失敗後の再試行 / correction: 目的地欠落時の作り直し */
  stage?: PlanAttemptStage;
  reason?: string;
  /** 429 などで API が返した割り当ての詳細（どの枠に当たったか・上限値・再試行までの待ち時間） */
  quota?: QuotaDetails;
  /** 失敗した全試行の履歴 */
  attempts?: PlanAttemptRecord[];
  /** 返したプランを整形したときの記録（何をなぜ取り除いたか） */
  sanitized?: PlanSanitizeRecord[];
  /** 返したプランに入らなかった指定目的地の件数（explained: AIが理由を記載 / unexplained: 理由なし） */
  missingDestinations?: { explained: number; unexplained: number };
  /** 作り直し（correction）を行った場合の理由・結果・出力トークン */
  correction?: PlanCorrectionRecord;
  /** 返したプランに残った時刻の問題の日数（overnight: 日付をまたいだ / reversed: 時刻が前後した） */
  scheduleTimeIssues?: { overnight: number; reversed: number };
  /** AIの時刻で到着希望を超過した日数（全プラン合計）と最大の超過（分） */
  scheduleChecks?: { overDays: number; maxOverrunMinutes: number };
  /** マイカー規制の記録（全プラン）。listHits: 登録済みの規制区域に当たった区域のid */
  carRestriction?: { listHits: string[] };
}) {
  console.log(JSON.stringify({ type: "plan_generate_audit", at: new Date().toISOString(), ...data }));
}

// Japanese national holidays (fixed dates + Happy Monday + substitute holidays)
function getJapaneseHolidays(year: number): { date: string; name: string }[] {
  const holidays: { date: string; name: string }[] = [
    // Fixed-date holidays
    { date: `${year}-01-01`, name: "元日" },
    { date: `${year}-02-11`, name: "建国記念の日" },
    { date: `${year}-02-23`, name: "天皇誕生日" },
    { date: `${year}-04-29`, name: "昭和の日" },
    { date: `${year}-05-03`, name: "憲法記念日" },
    { date: `${year}-05-04`, name: "みどりの日" },
    { date: `${year}-05-05`, name: "こどもの日" },
    { date: `${year}-08-11`, name: "山の日" },
    { date: `${year}-11-03`, name: "文化の日" },
    { date: `${year}-11-23`, name: "勤労感謝の日" },
  ];

  // Happy Monday holidays (calculated precisely)
  holidays.push({ date: getNthMonday(year, 1, 2), name: "成人の日" });     // 1月第2月曜
  holidays.push({ date: getNthMonday(year, 7, 3), name: "海の日" });       // 7月第3月曜
  holidays.push({ date: getNthMonday(year, 9, 3), name: "敬老の日" });     // 9月第3月曜
  holidays.push({ date: getNthMonday(year, 10, 2), name: "スポーツの日" }); // 10月第2月曜

  // Equinox days (approximate - varies by year, ±1 day)
  holidays.push({ date: `${year}-03-20`, name: "春分の日" });
  holidays.push({ date: `${year}-09-23`, name: "秋分の日" });

  // Substitute holidays (振替休日): if a holiday falls on Sunday, next Monday is a holiday
  const baseHolidays = [...holidays];
  for (const h of baseHolidays) {
    const d = new Date(h.date + "T00:00:00");
    if (d.getDay() === 0) { // Sunday
      const substitute = new Date(d);
      substitute.setDate(substitute.getDate() + 1);
      // Skip consecutive holidays (e.g., GW) to find the next non-holiday weekday
      let subStr = substitute.toISOString().split("T")[0];
      while (holidays.some((hh) => hh.date === subStr)) {
        substitute.setDate(substitute.getDate() + 1);
        subStr = substitute.toISOString().split("T")[0];
      }
      holidays.push({ date: subStr, name: `振替休日（${h.name}）` });
    }
  }

  return holidays;
}

function getNthMonday(year: number, month: number, n: number): string {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 1) {
      count++;
      if (count === n) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }
  return "";
}

function analyzeTravelDate(dateStr: string, numDays: number): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"][date.getDay()];

  const holidays = getJapaneseHolidays(year);
  const dateInfos: string[] = [];

  // Check each day of the trip
  for (let i = 0; i < numDays; i++) {
    const tripDate = new Date(date);
    tripDate.setDate(tripDate.getDate() + i);
    const tripDateStr = tripDate.toISOString().split("T")[0];
    const tripDayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][tripDate.getDay()];
    const isWeekend = tripDate.getDay() === 0 || tripDate.getDay() === 6;
    const holiday = holidays.find((h) => h.date === tripDateStr);

    let dayInfo = `${i + 1}日目: ${tripDateStr}（${tripDayOfWeek}）`;
    if (holiday) {
      dayInfo += ` - 🎌 祝日「${holiday.name}」`;
    }
    if (isWeekend) {
      dayInfo += " - 休日";
    }
    dateInfos.push(dayInfo);
  }

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isHoliday = holidays.some((h) => h.date === dateStr);
  const isFriday = date.getDay() === 5;

  // Check for consecutive holidays (GW, Obon, year-end, etc.)
  let seasonalNote = "";
  if (month === 4 && day >= 28 || month === 5 && day <= 6) {
    seasonalNote = "⚠️ ゴールデンウィーク期間です。全国的に大渋滞が予想されます。早朝出発（6:00以前）を強く推奨します。";
  } else if (month === 8 && day >= 10 && day <= 16) {
    seasonalNote = "⚠️ お盆期間です。帰省ラッシュにより高速道路が大渋滞します。時間に大幅な余裕を持たせてください。";
  } else if (month === 12 && day >= 28 || month === 1 && day <= 3) {
    seasonalNote = "⚠️ 年末年始です。高速道路や観光地が混雑します。";
  } else if (month === 9 && day >= 14 && day <= 23) {
    seasonalNote = "シルバーウィーク付近です。混雑する可能性があります。";
  }

  // Season and events
  let seasonInfo = "";
  if (month >= 3 && month <= 4) {
    seasonInfo = "🌸 桜のシーズンです。花見スポットは混雑しますが、ルート上の桜名所があれば提案してください。";
  } else if (month >= 6 && month <= 7 && day <= 20) {
    seasonInfo = "☔ 梅雨の時期です。雨天時の屋内スポットの代替案も考慮してください。";
  } else if (month >= 7 && month <= 8) {
    seasonInfo = "🏖️ 夏季です。海水浴場・花火大会などの夏イベントがあれば提案してください。暑さ対策のアドバイスも入れてください。";
  } else if (month >= 10 && month <= 11) {
    seasonInfo = "🍁 紅葉のシーズンです。ルート上の紅葉名所があれば提案してください。紅葉スポットは週末に特に混雑します。";
  } else if (month === 12 || month <= 2) {
    seasonInfo = "❄️ 冬季です。路面凍結や積雪の可能性があります。スタッドレスタイヤやチェーンの準備を推奨してください。";
  }

  let trafficNote = "";
  if (isWeekend || isHoliday) {
    trafficNote = "🚗 休日・祝日のため、高速道路の渋滞が予想されます。特に都市部からの出入口付近やSA/PA周辺で混雑します。出発時間を早めに設定し、移動時間に余裕（通常の1.3〜1.5倍）を持たせてください。";
  } else if (isFriday) {
    trafficNote = "🚗 金曜日のため、夕方以降は帰宅ラッシュおよび週末旅行の出発車両で高速道路が混雑する可能性があります。";
  } else {
    trafficNote = "平日のため、通勤時間帯（7:00〜9:00, 17:00〜19:00）以外は比較的スムーズです。";
  }

  return `
## 旅行日程情報
- 出発日: ${year}年${month}月${day}日（${dayOfWeek}）
${dateInfos.map((d) => `- ${d}`).join("\n")}
${isHoliday || isWeekend ? "- ⚠️ 休日/祝日のため観光地は混雑が予想されます" : "- 平日のため観光地は比較的空いています"}

## 交通状況の予測
${trafficNote}
${seasonalNote ? `\n${seasonalNote}` : ""}

## 季節情報
${seasonInfo || "特記事項なし"}

上記の日程・交通・季節情報を踏まえて以下を考慮してください：
- 渋滞予測に基づき移動時間を適切に調整すること
- 混雑する時間帯を避けたスケジュールを提案すること
- 季節のイベントや見どころがあれば積極的に提案すること
- 当日の曜日・祝日に応じた観光地の混雑度をtipsに含めること
- 休日の場合、駐車場の混雑についても注意を促すこと`;
}

/*
 * 新しい flash-lite を先に使い、実績のある 2.5 flash-lite をフォールバックにする。
 * gemini-2.5-flash は既定で thinking が動くため生成が遅く、出力トークンも thinking に取られるので外した。
 */
const MODEL_NAMES = [
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
];

/** 必要な出力トークン数を、日数・目的地数・食事の有無から見積もる（2プラン分） */
function maxOutputTokensFor(body: PlanRequest): number {
  const extraItemsPerDay = EXTRA_ITEMS_PER_DAY + (body.aiOmakase !== false ? EXTRA_ITEMS_PER_DAY_OMAKASE : 0);
  const tokensPerPlan = body.days.reduce((sum, day) => {
    // 出発・到着の2件 + 目的地 + 食事 + 休憩・おまかせ提案の見込み
    const items = 2 + day.destinations.length + (day.includeLunch ? 1 : 0) + (day.includeDinner ? 1 : 0) + extraItemsPerDay;
    return sum + OUTPUT_TOKENS_PER_DAY + items * OUTPUT_TOKENS_PER_ITEM;
  }, OUTPUT_TOKENS_PER_PLAN);
  return Math.min(OUTPUT_TOKENS_MAX, Math.max(OUTPUT_TOKENS_MIN, tokensPerPlan * PLAN_COUNT));
}

// --- 出力JSONのスキーマ（プロンプトの「出力JSON形式」から起こしたもの） -----------------
// responseSchema で構造を固定し、形式のゆれで JSON として読めない応答を防ぐ。
// スキーマに無い項目は出力されなくなるため、プロンプトの出力形式を変えたときはここも合わせること。

const MEAL_SPOT_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    nearSpot: { type: SchemaType.STRING },
    alternatives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["name", "description", "nearSpot", "alternatives"],
};

const PLAN_ITEM_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    lat: { type: SchemaType.NUMBER },
    lng: { type: SchemaType.NUMBER },
    address: { type: SchemaType.STRING },
    // reststop は SA・PA・道の駅などの休憩地点。enum に無いと destination に丸められ、休憩地点の区別が失われる
    type: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["departure", "destination", "lunch", "dinner", "reststop", "arrival"],
    },
    arrivalTime: { type: SchemaType.STRING },
    departureTime: { type: SchemaType.STRING },
    stayMinutes: { type: SchemaType.INTEGER },
    distanceKm: { type: SchemaType.NUMBER },
    travelMinutes: { type: SchemaType.INTEGER },
    useHighway: { type: SchemaType.BOOLEAN },
    highwayEntry: { type: SchemaType.STRING },
    highwayExit: { type: SchemaType.STRING },
    highwayName: { type: SchemaType.STRING },
    parkingInfo: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    dogWalkStop: { type: SchemaType.BOOLEAN },
  },
  // 高速道路の項目は高速を使う区間だけに付くため必須にしない
  required: [
    "name",
    "lat",
    "lng",
    "address",
    "type",
    "arrivalTime",
    "departureTime",
    "stayMinutes",
    "distanceKm",
    "travelMinutes",
    "useHighway",
    "parkingInfo",
    "description",
    "dogWalkStop",
  ],
};

const PLAN_COMMENTARY_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    removedSpots: {
      type: SchemaType.ARRAY,
      description:
        "ユーザー指定の目的地のうち、物理的に訪問できずitemsに入れなかったものだけを、名前と具体的な理由とともに記載する。代わりのスポットは入れない。該当がなければ空配列",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["name", "reason"],
      },
    },
    highlights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    // 犬連れのときだけ出す項目
    dogTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    overallDescription: { type: SchemaType.STRING },
  },
  required: ["removedSpots", "highlights", "tips", "overallDescription"],
};

/**
 * プラン数（2つ）はスキーマで固定する。日数は固定しない：days に minItems/maxItems（日数）を付けると、
 * 複数日で gemini-3.5-flash-lite が 400（Request contains an invalid argument）を返し、スキーマなしの再試行に落ちる
 * （2026-09 の検証で、1日は受け付けられ、5日は thinking の指定の有無にかかわらず 400）。日の欠落は目的地の欠落検証で拾う。
 */
function buildPlanResponseSchema(): ObjectSchema {
  const daySchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      dayIndex: { type: SchemaType.INTEGER },
      items: { type: SchemaType.ARRAY, items: PLAN_ITEM_SCHEMA },
      // 食事スポットは必須＋null可にする。食事が不要な日・目的地で食べる日は null。
      // 任意項目にすると、gemini-3.5-flash-lite が dinnerSpot を省いたり、dinnerSpot だけを持つ予定0件の日を
      // 余分に作ったりした（2026-09 の検証。必須＋null可では両モデルとも正しく出た）。
      lunchSpot: { ...MEAL_SPOT_SCHEMA, nullable: true },
      dinnerSpot: { ...MEAL_SPOT_SCHEMA, nullable: true },
    },
    required: ["dayIndex", "items", "lunchSpot", "dinnerSpot"],
  };
  const planSchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      planName: { type: SchemaType.STRING },
      planDescription: { type: SchemaType.STRING },
      days: { type: SchemaType.ARRAY, items: daySchema },
      commentary: PLAN_COMMENTARY_SCHEMA,
    },
    required: ["planName", "planDescription", "days", "commentary"],
  };
  return {
    type: SchemaType.OBJECT,
    properties: {
      plans: { type: SchemaType.ARRAY, items: planSchema, minItems: PLAN_COUNT, maxItems: PLAN_COUNT },
    },
    required: ["plans"],
  };
}

/**
 * thinking の指定。thinking のトークンも maxOutputTokens に含まれるため、既定のまま動くと本文が途中で切れる
 * （2026-09 の本番障害は、gemini-2.5-flash の既定の thinking が約6,400トークンを使い、JSONが MAX_TOKENS で途切れたもの）。
 * 世代で指定方法が違う：2.5 系は thinkingBudget（0 で停止）、3 系は thinkingLevel（最小は MINIMAL。3 系に thinkingBudget: 0 を送ると 400）。
 * none は指定なし（モデルの既定の thinking が動く）。
 */
type PlanThinkingSetting = "budget_0" | "level_minimal" | "none";

function preferredThinkingFor(modelName: string): PlanThinkingSetting {
  if (modelName.startsWith("gemini-2.5")) return "budget_0";
  if (modelName.startsWith("gemini-3")) return "level_minimal";
  return "none";
}

function buildPlanGenerationConfig(options: {
  modelName: string;
  maxOutputTokens: number;
  thinking: PlanThinkingSetting;
  structuredOutput: boolean;
  temperature: number;
}): GenerationConfig {
  const base: GenerationConfig = {
    maxOutputTokens: options.maxOutputTokens,
    responseMimeType: "application/json",
    ...(options.structuredOutput ? { responseSchema: buildPlanResponseSchema() } : {}),
    // Gemini 3 系では temperature が非推奨になり、送っても無視されるため指定しない（2026-07-21 の変更。top_p・top_k も同じ）
    ...(options.modelName.startsWith("gemini-3") ? {} : { temperature: options.temperature }),
  };
  if (options.thinking === "none") return base;
  // SDK 0.24 の型に thinkingConfig が無いためキャストして渡す（フィールド名と値は後継SDK @google/genai の ThinkingConfig / ThinkingLevel と同じ）
  const thinkingConfig = options.thinking === "budget_0" ? { thinkingBudget: 0 } : { thinkingLevel: "MINIMAL" };
  return { ...base, thinkingConfig } as GenerationConfig;
}

// --- Gemini 呼び出し（1回分の試行） ------------------------------------------------

type PlanAttemptStage = "initial" | "parse_retry" | "correction";
/**
 * request: API呼び出し自体の失敗 / response: 応答はあったがプランとして使えなかった /
 * config_rejected: 生成設定（thinking・responseSchema）を 400 で拒否され、その設定を外して同じモデルで続けた
 */
type PlanFailureKind = "request" | "response" | "config_rejected";

interface PlanAttemptInfo {
  model: string;
  maxOutputTokens: number;
  thinking: PlanThinkingSetting;
  structuredOutput: boolean;
  finishReason?: string;
  blockReason?: string;
  usageMetadata?: UsageMetadata;
}

type PlanAttempt =
  | { ok: true; plan: unknown; info: PlanAttemptInfo }
  | {
      ok: false;
      kind: PlanFailureKind;
      errorCode: PlanErrorCode;
      /** API のHTTPステータス。応答はあったがプランとして使えなかった場合は 200 */
      httpStatus?: number;
      error: unknown;
      info: PlanAttemptInfo;
    };
type FailedPlanAttempt = Extract<PlanAttempt, { ok: false }>;

/** 失敗した試行1回分の記録。最終的にエラーを返すときは全件をログに残す */
interface PlanAttemptRecord {
  model: string;
  stage: PlanAttemptStage;
  kind: PlanFailureKind;
  httpStatus?: number;
  finishReason?: string;
  blockReason?: string;
  errorCode: PlanErrorCode;
  thinking: PlanThinkingSetting;
  structuredOutput: boolean;
  maxOutputTokens: number;
  outputTokens?: number;
  thoughtsTokens?: number;
  message: string;
  /** 429 などで API が返した割り当ての詳細（message は切り詰めるため、どの枠に当たったかはこちらで残す） */
  quota?: QuotaDetails;
}

/** 当たった割り当て1件分（例: quotaId "GenerateRequestsPerDayPerProjectPerModel-FreeTier"、quotaValue "20"） */
interface QuotaViolation {
  quotaId?: string;
  quotaMetric?: string;
  quotaValue?: string;
  model?: string;
}

interface QuotaDetails {
  violations: QuotaViolation[];
  /** API が示す再試行までの待ち時間（例: "9s"）。1日あたりの枠では実際のリセット時刻と一致しない */
  retryDelay?: string;
}

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** SDK の GoogleGenerativeAIFetchError は status を持つ。無ければメッセージ中の「[429 Too Many Requests]」から読む */
function httpStatusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === "number") return status;
  const match = errorMessageOf(error).match(/\[(\d{3}) /);
  return match ? Number(match[1]) : undefined;
}

const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" ? value.substring(0, 200) : undefined;

/**
 * SDK の GoogleGenerativeAIFetchError が持つ errorDetails（google.rpc の QuotaFailure・RetryInfo）から、
 * 当たった割り当ての種類・上限値・対象モデルと再試行までの待ち時間を取り出す。該当が無ければ undefined。
 * キーやプロジェクトを特定できる項目は取り出さない。
 */
function quotaDetailsOf(error: unknown): QuotaDetails | undefined {
  const details = (error as { errorDetails?: unknown } | null)?.errorDetails;
  if (!Array.isArray(details)) return undefined;
  const violations: QuotaViolation[] = [];
  let retryDelay: string | undefined;
  for (const detail of details) {
    if (!detail || typeof detail !== "object") continue;
    const record = detail as Record<string, unknown>;
    const type = stringOrUndefined(record["@type"]) ?? "";
    if (type.endsWith("QuotaFailure") && Array.isArray(record.violations)) {
      for (const violation of record.violations.slice(0, 5)) {
        if (!violation || typeof violation !== "object") continue;
        const v = violation as Record<string, unknown>;
        const dimensions = v.quotaDimensions && typeof v.quotaDimensions === "object" ? (v.quotaDimensions as Record<string, unknown>) : {};
        violations.push({
          quotaId: stringOrUndefined(v.quotaId),
          quotaMetric: stringOrUndefined(v.quotaMetric),
          quotaValue: stringOrUndefined(v.quotaValue),
          model: stringOrUndefined(dimensions.model),
        });
      }
    } else if (type.endsWith("RetryInfo")) {
      retryDelay = stringOrUndefined(record.retryDelay);
    }
  }
  return violations.length > 0 || retryDelay ? { violations, ...(retryDelay ? { retryDelay } : {}) } : undefined;
}

/** SDK 0.24 の型には無いが、API は thinking を使ったときに thoughtsTokenCount を返す */
function thoughtsTokensOf(usage: UsageMetadata | undefined): number | undefined {
  return (usage as (UsageMetadata & { thoughtsTokenCount?: number }) | undefined)?.thoughtsTokenCount;
}

/** 生成設定（thinkingConfig や responseSchema）をモデルが受け付けなかったときの 400 */
function isInvalidArgumentError(error: unknown): boolean {
  const message = errorMessageOf(error);
  return message.includes("[400 ") || message.includes("INVALID_ARGUMENT");
}

function classifyGeminiError(message: string) {
  return {
    is503: message.includes("503") || message.includes("Service Unavailable"),
    is404: message.includes("404") || message.includes("NOT_FOUND") || message.includes("not found"),
    is403: message.includes("403") || message.includes("PERMISSION_DENIED") || message.includes("API_KEY_INVALID"),
    is429: message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota"),
  };
}

/** API呼び出しの失敗から、利用者に見せる文面の種類を決める */
function requestErrorCodeFor(error: unknown, httpStatus: number | undefined): PlanErrorCode {
  const { is503, is404, is403, is429 } = classifyGeminiError(errorMessageOf(error));
  if (httpStatus === 429 || httpStatus === 503 || is429 || is503) return "ai_busy";
  if (httpStatus === 400 || httpStatus === 403 || httpStatus === 404 || is403 || is404 || isInvalidArgumentError(error)) {
    return "ai_unavailable";
  }
  return "ai_failed";
}

/** 安全性などの理由で止められたことを示す finishReason（作り直しても同じ結果になりやすいので再試行しない） */
const BLOCKED_FINISH_REASONS = new Set(["SAFETY", "RECITATION", "LANGUAGE", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY"]);

/**
 * JSON.parse に渡す前に、候補が無い・止まり方が STOP でない・本文が空の場合を判定する。問題が無ければ本文を返す。
 * （SDK の text() は候補が無いと "" を返すため、そのまま parse すると原因が「JSONとして読めない」に紛れる）
 */
function inspectPlanResponse(
  response: GenerateContentResult["response"]
): { ok: true; text: string } | { ok: false; errorCode: PlanResponseErrorCode; message: string } {
  const candidate = response.candidates?.[0];
  if (!candidate) {
    const blockReason: string | undefined = response.promptFeedback?.blockReason;
    return blockReason
      ? { ok: false, errorCode: "ai_blocked", message: `no candidates (blockReason: ${blockReason})` }
      : { ok: false, errorCode: "ai_empty_response", message: "no candidates" };
  }
  const finishReason: string | undefined = candidate.finishReason;
  if (finishReason && finishReason !== "STOP") {
    const errorCode: PlanResponseErrorCode =
      finishReason === "MAX_TOKENS" ? "ai_truncated" : BLOCKED_FINISH_REASONS.has(finishReason) ? "ai_blocked" : "ai_bad_finish";
    const detail = candidate.finishMessage ? ` (${candidate.finishMessage})` : "";
    return { ok: false, errorCode, message: `finishReason: ${finishReason}${detail}` };
  }
  const text = (candidate.content?.parts ?? []).map((part) => part.text ?? "").join("");
  if (!text.trim()) return { ok: false, errorCode: "ai_empty_response", message: "empty text" };
  return { ok: true, text };
}

/**
 * プランを1回生成して JSON として読み取る。例外は投げず、結果と finishReason / usageMetadata を返す。
 * 世代に合った thinking の指定を 400 で拒否されたら thinking の指定なしで再試行し、
 * それでも 400 なら responseSchema を外して（JSON モードのみで）再試行する。
 * 失敗した試行は、設定を外して続けた分も含めてすべて onFailure に渡す。
 */
async function requestPlan(
  genAI: GoogleGenerativeAI,
  modelName: string,
  promptText: string,
  maxOutputTokens: number,
  temperature: number,
  onFailure: (attempt: FailedPlanAttempt) => void
): Promise<PlanAttempt> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const attempt = async (thinking: PlanThinkingSetting, structuredOutput: boolean): Promise<PlanAttempt> => {
    // thinking を完全には止められない指定では、thinking のトークンも出力上限に含まれるため上乗せする
    const tokens =
      thinking === "budget_0" ? maxOutputTokens : Math.min(OUTPUT_TOKENS_MAX, maxOutputTokens + THINKING_TOKENS_ALLOWANCE);
    const info: PlanAttemptInfo = { model: modelName, maxOutputTokens: tokens, thinking, structuredOutput };
    const generationConfig = buildPlanGenerationConfig({
      modelName,
      maxOutputTokens: tokens,
      thinking,
      structuredOutput,
      temperature,
    });
    let result: GenerateContentResult;
    try {
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig,
      });
    } catch (error) {
      const httpStatus = httpStatusOf(error);
      return { ok: false, kind: "request", errorCode: requestErrorCodeFor(error, httpStatus), httpStatus, error, info };
    }
    const response = result.response;
    info.finishReason = response.candidates?.[0]?.finishReason;
    info.blockReason = response.promptFeedback?.blockReason;
    info.usageMetadata = response.usageMetadata;
    const inspected = inspectPlanResponse(response);
    if (!inspected.ok) {
      return { ok: false, kind: "response", errorCode: inspected.errorCode, httpStatus: 200, error: new Error(inspected.message), info };
    }
    try {
      return { ok: true, plan: normalizePlanItemTypes(parsePlanJson(inspected.text)), info };
    } catch (error) {
      return { ok: false, kind: "response", errorCode: "ai_invalid_json", httpStatus: 200, error, info };
    }
  };

  const isConfigRejected = (r: PlanAttempt): r is FailedPlanAttempt =>
    !r.ok && r.kind === "request" && isInvalidArgumentError(r.error);

  const preferredThinking = preferredThinkingFor(modelName);
  let result: PlanAttempt = await attempt(preferredThinking, true);
  if (preferredThinking !== "none" && isConfigRejected(result)) {
    console.warn(`[${modelName}] thinking の指定（${preferredThinking}）が受け付けられなかったため指定なしで再試行します: ${errorMessageOf(result.error).substring(0, 200)}`);
    onFailure({ ...result, kind: "config_rejected" });
    result = await attempt("none", true);
  }
  if (isConfigRejected(result)) {
    console.warn(`[${modelName}] responseSchema が受け付けられなかったためスキーマなしで再試行します: ${errorMessageOf(result.error).substring(0, 200)}`);
    onFailure({ ...result, kind: "config_rejected" });
    result = await attempt("none", false);
  }
  if (!result.ok) onFailure(result);
  return result;
}

// --- 生成結果の検証（ユーザー指定の目的地が抜けていないか） ---------------------
// プロンプトで「絶対に削除しないこと」と指示しても実際には欠落することがあるため、
// 出力を機械的に検証し、抜けていれば1回だけ作り直す。

type PlanItemLite = { name: string; address?: string; lat?: number; lng?: number };

function parsePlanJson(responseText: string): unknown {
  try {
    return JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    throw new Error("Failed to parse Gemini response as JSON");
  }
}

/** 休憩地点を表す type の表記ゆれ（大文字小文字・区切り記号を除いて比較） */
const REST_STOP_TYPE_ALIASES = new Set(["reststop", "parking", "stop"]);

/**
 * 休憩地点の type を "reststop" にそろえる。
 * responseSchema を外して再試行した場合などに、モデルが parking / restStop / stop などを返すことがあるため。
 */
function normalizePlanItemTypes(parsed: unknown): unknown {
  const plansValue = (parsed as { plans?: unknown })?.plans;
  const plans: unknown[] = Array.isArray(plansValue) ? plansValue : [parsed];
  for (const plan of plans) {
    const days = (plan as { days?: unknown })?.days;
    if (!Array.isArray(days)) continue;
    for (const day of days) {
      const items = (day as { items?: unknown })?.items;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const planItem = item as { type?: unknown } | null;
        if (
          typeof planItem?.type === "string" &&
          REST_STOP_TYPE_ALIASES.has(planItem.type.toLowerCase().replace(/[\s_-]/g, ""))
        ) {
          planItem.type = "reststop";
        }
      }
    }
  }
  return parsed;
}

type PlanSanitizeAction =
  | "empty_day_removed"
  | "excess_day_removed"
  | "lunchSpot_removed_no_lunch"
  | "lunchSpot_removed_destination_lunch"
  | "dinnerSpot_removed_no_dinner"
  | "dinnerSpot_removed_destination_dinner"
  // 以下は検出だけで、プランは書き換えない
  | "lunchSpot_missing"
  | "dinnerSpot_missing";

/** プランの整形の記録。何をなぜ取り除いたか（または何が欠けていたか）を監査ログに残す */
interface PlanSanitizeRecord {
  /** どの生成結果を整形したか（correction なら作り直し後のプランを採用した） */
  stage: PlanAttemptStage;
  planIndex: number;
  /** 整形前の days 配列内の位置 */
  position: number;
  /** モデルが返した dayIndex */
  dayIndex: number | null;
  action: PlanSanitizeAction;
  /** 取り除いたもの（食事スポット名、または日の中身の要約） */
  detail: string;
}

const SANITIZE_DETAIL_MAX = 60;

function spotNameOf(spot: unknown): string {
  const name = (spot as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name.slice(0, SANITIZE_DETAIL_MAX) : "(名前なし)";
}

function describeRemovedDay(day: unknown): string {
  const d = day as { items?: unknown; lunchSpot?: unknown; dinnerSpot?: unknown } | null;
  const parts = [`items:${Array.isArray(d?.items) ? d.items.length : "なし"}`];
  if (d?.lunchSpot) parts.push(`lunchSpot:${spotNameOf(d.lunchSpot)}`);
  if (d?.dinnerSpot) parts.push(`dinnerSpot:${spotNameOf(d.dinnerSpot)}`);
  return parts.join(" / ");
}

/**
 * 利用者の画面に出してはいけないものをプランから取り除く（その場で書き換える）。
 * - 予定が0件の日（gemini-3.5-flash-lite が、dinnerSpot だけを持つ空の日を余分に作ることがあった）
 * - 依頼した日数を超える日（後ろから切る）
 * - 食事が「不要」の日の lunchSpot/dinnerSpot、目的地で食べると指定された食事の lunchSpot/dinnerSpot（ルール15）
 * 取り除いたものは必ず記録として返す。黙って消すと、次の不具合が見えなくなるため。
 * 残した日と依頼の日は、並び順で対応させる（モデルの dayIndex は重複することがあったため使わない）。
 */
function sanitizePlan(body: PlanRequest, parsed: unknown, stage: PlanAttemptStage): PlanSanitizeRecord[] {
  const records: PlanSanitizeRecord[] = [];
  const plansValue = (parsed as { plans?: unknown })?.plans;
  const plans: unknown[] = Array.isArray(plansValue) ? plansValue : [parsed];

  plans.forEach((plan, planIndex) => {
    const p = plan as { days?: unknown } | null;
    if (!p || !Array.isArray(p.days)) return;

    const record = (day: unknown, position: number, action: PlanSanitizeAction, detail: string) => {
      const dayIndex = (day as { dayIndex?: unknown } | null)?.dayIndex;
      records.push({ stage, planIndex, position, dayIndex: typeof dayIndex === "number" ? dayIndex : null, action, detail });
    };

    const kept: { day: unknown; position: number }[] = [];
    p.days.forEach((day: unknown, position: number) => {
      const items = (day as { items?: unknown } | null)?.items;
      if (!Array.isArray(items) || items.length === 0) {
        record(day, position, "empty_day_removed", describeRemovedDay(day));
      } else if (kept.length >= body.days.length) {
        record(day, position, "excess_day_removed", describeRemovedDay(day));
      } else {
        kept.push({ day, position });
      }
    });

    kept.forEach(({ day, position }, i) => {
      const requestDay = body.days[i];
      const d = day as { lunchSpot?: unknown; dinnerSpot?: unknown };
      const hasMealDestination = (meal: "lunch" | "dinner") =>
        requestDay.destinations.some((dest) => !dest.isOmakase && dest.meal === meal && dest.name?.trim());

      // 目的地で食べる指定を先に見る（その場合、食事の「あり/不要」より目的地の指定が優先される）
      if (d.lunchSpot) {
        const action: PlanSanitizeAction | null = hasMealDestination("lunch")
          ? "lunchSpot_removed_destination_lunch"
          : !requestDay.includeLunch ? "lunchSpot_removed_no_lunch" : null;
        if (action) {
          record(day, position, action, spotNameOf(d.lunchSpot));
          d.lunchSpot = null;
        }
      } else if (requestDay.includeLunch && !hasMealDestination("lunch")) {
        record(day, position, "lunchSpot_missing", "");
      }

      if (d.dinnerSpot) {
        const action: PlanSanitizeAction | null = hasMealDestination("dinner")
          ? "dinnerSpot_removed_destination_dinner"
          : !requestDay.includeDinner ? "dinnerSpot_removed_no_dinner" : null;
        if (action) {
          record(day, position, action, spotNameOf(d.dinnerSpot));
          d.dinnerSpot = null;
        }
      } else if (requestDay.includeDinner && !hasMealDestination("dinner")) {
        record(day, position, "dinnerSpot_missing", "");
      }
    });

    p.days = kept.map(({ day }) => day);
  });
  return records;
}

function formatSanitizeRecords(records: PlanSanitizeRecord[]): string {
  return records
    .map((r) => `plan${r.planIndex}/day${r.position}: ${r.action}${r.detail ? `（${r.detail}）` : ""}`)
    .join(" / ");
}

/**
 * 全角英数字・ハイフンのゆれ・空白・カッコ・「〒」「日本、」を吸収して比較用に正規化する
 * （例:「上高地（河童橋）」と「上高地 河童橋」を同じとみなす）
 */
function normalizeForMatch(value: string): string {
  return value
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[‐‑‒–—―ー−ｰ－]/g, "-")
    .replace(/[〒\s、,。．・（）()「」『』【】[\]〈〉《》]/g, "")
    .replace(/^日本/, "")
    .toLowerCase();
}

/** 郵便番号（数字7桁）を取り出す。住所だけで指定された目的地の照合に使う */
function extractPostalCode(value: string): string {
  const matched = normalizeForMatch(value).match(/\d{3}-?\d{4}/);
  return matched ? matched[0].replace("-", "") : "";
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function collectPlanItems(plan: unknown): PlanItemLite[] {
  const items: PlanItemLite[] = [];
  const days = (plan as { days?: unknown })?.days;
  if (!Array.isArray(days)) return items;

  const pushSpot = (spot: unknown) => {
    const s = spot as { name?: unknown; address?: unknown; lat?: unknown; lng?: unknown };
    if (!s || typeof s.name !== "string") return;
    items.push({
      name: s.name,
      address: typeof s.address === "string" ? s.address : undefined,
      lat: typeof s.lat === "number" ? s.lat : undefined,
      lng: typeof s.lng === "number" ? s.lng : undefined,
    });
  };

  for (const day of days) {
    const d = day as { items?: unknown; lunchSpot?: unknown; dinnerSpot?: unknown };
    if (Array.isArray(d?.items)) d.items.forEach(pushSpot);
    pushSpot(d?.lunchSpot);
    pushSpot(d?.dinnerSpot);
  }
  return items;
}

/**
 * 指定された目的地がプランに含まれているかを判定する。
 * 名前が住所文字列の場合（Places APIが住所をnameとして返すケース）は名前一致しないため、
 * 郵便番号一致・座標の近さ（1.5km以内）でも「含まれている」とみなす。
 */
function planIncludesDestination(
  dest: { name: string; address?: string; lat?: number; lng?: number },
  items: PlanItemLite[]
): boolean {
  const destName = normalizeForMatch(dest.name);
  if (!destName) return true;
  const destPostal = extractPostalCode(`${dest.name} ${dest.address ?? ""}`);

  for (const item of items) {
    const itemName = normalizeForMatch(item.name);
    const itemText = normalizeForMatch(`${item.name}${item.address ?? ""}`);
    if (itemText.includes(destName)) return true;
    if (itemName.length >= 3 && destName.includes(itemName)) return true;
    if (destPostal && extractPostalCode(`${item.name} ${item.address ?? ""}`) === destPostal) return true;
    if (
      typeof dest.lat === "number" &&
      typeof dest.lng === "number" &&
      typeof item.lat === "number" &&
      typeof item.lng === "number" &&
      distanceKm(dest.lat, dest.lng, item.lat, item.lng) <= 1.5
    ) {
      return true;
    }
  }
  return false;
}

/** プランに入っていないユーザー指定目的地（プランごとに1件） */
interface MissingDestination {
  planIndex: number;
  planName: string;
  dayIndex: number;
  name: string;
  /** AIが commentary.removedSpots に理由付きで記載していれば true */
  explained: boolean;
}

/** 画面に出す除外目的地。ai: AIが理由を書いて除外 / unexplained: AIが理由を示さずに省略 */
interface AnnotatedRemovedSpot {
  name: string;
  reason: string;
  source: "ai" | "unexplained";
}

function plansOf(parsed: unknown): unknown[] {
  const plansValue = (parsed as { plans?: unknown })?.plans;
  return Array.isArray(plansValue) ? plansValue : [parsed];
}

function planNameOf(plan: unknown, planIdx: number): string {
  const name = (plan as { planName?: unknown })?.planName;
  if (typeof name === "string") return name;
  return planIdx === 0 ? "プランA" : "プランB";
}

function removedSpotsOf(plan: unknown): { name: string; reason: string }[] {
  const list = (plan as { commentary?: { removedSpots?: unknown } })?.commentary?.removedSpots;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    const e = entry as { name?: unknown; reason?: unknown };
    if (!e || typeof e.name !== "string" || !e.name.trim()) return [];
    return [{ name: e.name.trim(), reason: typeof e.reason === "string" ? e.reason.trim() : "" }];
  });
}

/** removedSpots の1件がユーザー指定目的地を指しているか（名前だけで照合） */
function removedSpotRefersTo(dest: { name: string }, removed: { name: string }): boolean {
  return planIncludesDestination({ name: dest.name }, [{ name: removed.name }]);
}

/** 各プランについて、抜けているユーザー指定目的地を返す */
function findMissingDestinations(body: PlanRequest, parsed: unknown): MissingDestination[] {
  const missing: MissingDestination[] = [];

  plansOf(parsed).forEach((plan, planIdx) => {
    const items = collectPlanItems(plan);
    // 想定外の形（items無し）の場合は判定できないので欠落扱いしない
    if (items.length === 0) return;
    const planName = planNameOf(plan, planIdx);
    const removed = removedSpotsOf(plan);

    for (const day of body.days) {
      for (const dest of day.destinations) {
        if (dest.isOmakase || !dest.name?.trim()) continue;
        if (planIncludesDestination(dest, items)) continue;
        missing.push({
          planIndex: planIdx,
          planName,
          dayIndex: day.dayIndex,
          name: dest.name.trim(),
          explained: removed.some((r) => r.reason !== "" && removedSpotRefersTo(dest, r)),
        });
      }
    }
  });

  return missing;
}

function describeMissing(m: MissingDestination, multiDay: boolean): string {
  return `${m.planName}に「${m.name}」${multiDay ? `（${m.dayIndex + 1}日目）` : ""}が含まれていません`;
}

/** 作り直しの結果のほうが良いか：抜けが少ないほう、同数なら理由のない抜けが少ないほう */
function hasFewerMissing(next: MissingDestination[], current: MissingDestination[]): boolean {
  if (next.length !== current.length) return next.length < current.length;
  const unexplained = (list: MissingDestination[]) => list.filter((m) => !m.explained).length;
  return unexplained(next) < unexplained(current);
}

/**
 * AIが書いた時刻の問題。各日の items を [到着, 出発] の順に並べ、前の時刻より早い時刻を探す。
 * - overnight: 日付をまたいだ（24:00以降の表記、または12時間以上の逆戻り。例: 23:30 → 00:45）
 * - reversed: 12時間未満の逆戻り（例: 14:15 の次に 12:10。項目の並びと時刻が食い違っている）
 * 利用者が日付をまたぐ時間帯（出発時刻より早い到着希望時刻）を指定した日は、overnight として扱わない。
 */
interface ScheduleTimeIssue {
  planIndex: number;
  planName: string;
  dayIndex: number;
  kind: "overnight" | "reversed";
  /** 例: 「23:30 → 00:45（富岡製糸場）」 */
  detail: string;
}

/** 日付をまたいだとみなす逆戻りの幅。実測では日付またぎが1,290〜1,410分、並びの食い違いが105〜145分だった */
const OVERNIGHT_BACKSTEP_MINUTES = 12 * 60;

/** 利用者の指定した時間帯そのものが日付をまたいでいるか（例: 20:00出発・01:00到着希望） */
function dayWindowCrossesMidnight(day: PlanRequest["days"][number] | undefined): boolean {
  return windowCrossesMidnight(day?.departureTime, day?.arrivalTime);
}

/** 各プラン・各日について、時刻の問題を種類ごとに最初の1件だけ返す */
function findScheduleTimeIssues(body: PlanRequest, parsed: unknown): ScheduleTimeIssue[] {
  const issues: ScheduleTimeIssue[] = [];

  plansOf(parsed).forEach((plan, planIdx) => {
    const days = (plan as { days?: unknown })?.days;
    if (!Array.isArray(days)) return;
    const planName = planNameOf(plan, planIdx);

    days.forEach((day, position) => {
      const items = (day as { items?: unknown } | null)?.items;
      if (!Array.isArray(items)) return;
      const requestDay = body.days[position];
      const overnightAllowed = dayWindowCrossesMidnight(requestDay);
      const found = new Set<ScheduleTimeIssue["kind"]>();
      const add = (kind: ScheduleTimeIssue["kind"], detail: string) => {
        if (found.has(kind) || (kind === "overnight" && overnightAllowed)) return;
        found.add(kind);
        issues.push({ planIndex: planIdx, planName, dayIndex: requestDay?.dayIndex ?? position, kind, detail });
      };

      let prev: { minutes: number; label: string } | null = null;
      for (const item of items) {
        const it = item as { name?: unknown; arrivalTime?: unknown; departureTime?: unknown } | null;
        const name = typeof it?.name === "string" ? it.name : "";
        for (const value of [it?.arrivalTime, it?.departureTime]) {
          const minutes = clockMinutes(value);
          if (minutes === null) continue;
          const label = String(value).trim();
          if (minutes >= 24 * 60) add("overnight", `${label}（${name}）`);
          if (prev && minutes < prev.minutes) {
            add(prev.minutes - minutes >= OVERNIGHT_BACKSTEP_MINUTES ? "overnight" : "reversed", `${prev.label} → ${label}（${name}）`);
          }
          prev = { minutes, label };
        }
      }
    });
  });

  return issues;
}

function describeTimeIssue(issue: ScheduleTimeIssue, multiDay: boolean): string {
  const where = `${issue.planName}${multiDay ? `の${issue.dayIndex + 1}日目` : ""}`;
  return issue.kind === "overnight"
    ? `${where}の行程が日付をまたいでいます（${issue.detail}）`
    : `${where}で時刻が前の項目より早くなっています（${issue.detail}）`;
}

/** 作り直し（correction）の理由と結果。adopted: 採用 / rejected: 改善しないため不採用 / failed: 生成に失敗 */
interface PlanCorrectionRecord {
  trigger: ("unexplained_missing" | "overnight")[];
  outcome: "adopted" | "rejected" | "failed";
  outputTokens?: number;
}

/**
 * 作り直しの結果のほうが良いか。日付をまたいだ日が少ないほうを優先し、同数なら目的地の抜けで比べる
 * （日付をまたぐプランは実行できないため、理由付きの除外が増えても日付をまたがないほうを採る）
 */
function isBetterPlan(
  next: { missing: MissingDestination[]; timeIssues: ScheduleTimeIssue[] },
  current: { missing: MissingDestination[]; timeIssues: ScheduleTimeIssue[] }
): boolean {
  const overnight = (list: ScheduleTimeIssue[]) => list.filter((i) => i.kind === "overnight").length;
  if (overnight(next.timeIssues) !== overnight(current.timeIssues)) {
    return overnight(next.timeIssues) < overnight(current.timeIssues);
  }
  return hasFewerMissing(next.missing, current.missing);
}

/**
 * 抜けた指定目的地を、各プランの commentary.removedSpots にまとめる（黙って落とさない）。
 * - AIが理由付きで記載したもの → source: "ai"
 * - 理由なしで抜けたもの → source: "unexplained" として追加
 * - removedSpots に書かれているのに実際はプランに入っている指定目的地 → 食い違いなので出さない
 */
function annotateRemovedSpots(body: PlanRequest, parsed: unknown, missing: MissingDestination[]): void {
  const userDests = body.days.flatMap((day) =>
    day.destinations.filter((d) => !d.isOmakase && d.name?.trim())
  );

  plansOf(parsed).forEach((plan, planIdx) => {
    if (!plan || typeof plan !== "object") return;
    const planMissing = missing.filter((m) => m.planIndex === planIdx);
    const result: AnnotatedRemovedSpot[] = [];

    for (const removed of removedSpotsOf(plan)) {
      const refersToMissing = planMissing.some((m) => removedSpotRefersTo(m, removed));
      const refersToIncluded = !refersToMissing && userDests.some((d) => removedSpotRefersTo(d, removed));
      if (refersToIncluded) continue;
      // 抜けた目的地を指していても理由が空なら、下で unexplained として出す
      if (refersToMissing && removed.reason === "") continue;
      result.push({ name: removed.name, reason: removed.reason, source: "ai" });
    }
    for (const m of planMissing) {
      if (!m.explained) result.push({ name: m.name, reason: "", source: "unexplained" });
    }

    const p = plan as { commentary?: unknown };
    if (p.commentary && typeof p.commentary === "object") {
      (p.commentary as { removedSpots?: unknown }).removedSpots = result;
    } else if (result.length > 0) {
      p.commentary = { removedSpots: result, highlights: [], tips: [] };
    }
  });
}

/**
 * 各プランの各日に、AIの時刻による到着見込みの判定（scheduleCheck）を付ける。
 * 日は並び順で利用者の指定と対応させる（findScheduleTimeIssues と同じ）。
 * 画面では、地図の経路の所要時間による判定が取れればそちらを優先し、取れなければこれを表示する。
 */
function attachScheduleChecks(body: PlanRequest, parsed: unknown): DayScheduleCheck[] {
  const checks: DayScheduleCheck[] = [];

  plansOf(parsed).forEach((plan) => {
    const days = (plan as { days?: unknown })?.days;
    if (!Array.isArray(days)) return;

    days.forEach((day, position) => {
      const items = (day as { items?: unknown } | null)?.items;
      const requestDay = body.days[position];
      if (!day || typeof day !== "object" || !Array.isArray(items) || !requestDay) return;
      const check = checkScheduleFromAiTimes(items, requestDay.departureTime, requestDay.arrivalTime);
      if (!check) return;
      (day as { scheduleCheck?: DayScheduleCheck }).scheduleCheck = check;
      checks.push(check);
    });
  });

  return checks;
}

/** 返したプランのマイカー規制の記録（監査ログ用。何も無ければ undefined） */
function collectCarRestrictions(parsed: unknown): { listHits: string[] } | undefined {
  const listHits = new Set<string>();

  plansOf(parsed).forEach((plan) => {
    const days = (plan as { days?: unknown })?.days;
    if (!Array.isArray(days)) return;
    days.forEach((day) => {
      const items = (day as { items?: unknown } | null)?.items;
      if (!Array.isArray(items)) return;
      items.forEach((raw) => {
        const item = raw as { name?: unknown; address?: unknown; lat?: unknown; lng?: unknown } | null;
        if (!item || typeof item.name !== "string") return;
        const area = matchCarRestrictionArea({
          name: item.name,
          address: typeof item.address === "string" ? item.address : undefined,
          lat: typeof item.lat === "number" ? item.lat : undefined,
          lng: typeof item.lng === "number" ? item.lng : undefined,
        });
        if (area) listHits.add(area.id);
      });
    });
  });

  if (listHits.size === 0) return undefined;
  return { listHits: [...listHits] };
}

/** 2案の観光地点を同じ地点とみなす距離（名前の表記ゆれで座標がわずかにずれる分を吸収する） */
const SAME_SPOT_KM = 0.3;

/**
 * プランAとプランBが同じ行程か。日ごとに観光地点（type="destination"）が同じ順序で1対1に対応すれば同じとみなす。
 * 名前が同じか、SAME_SPOT_KM 以内なら同じ地点。滞在時間・食事の場所やジャンル・休憩地点（PA・SA）の違いは見ない。
 * 2案の名前（定番／穴場など）が約束しているのは観光スポットの違いのため。
 * 実測では、指定目的地で日が埋まるとAIの追加が0件になり、名前と説明だけが違う同じ行程が返っていた。
 */
function plansHaveSameItinerary(parsed: unknown): boolean {
  const plans = (parsed as { plans?: unknown })?.plans;
  if (!Array.isArray(plans) || plans.length !== 2) return false;
  const daysA = (plans[0] as { days?: unknown })?.days;
  const daysB = (plans[1] as { days?: unknown })?.days;
  if (!Array.isArray(daysA) || !Array.isArray(daysB) || daysA.length !== daysB.length) return false;

  const spotsOf = (day: unknown): PlanItemLite[] | null => {
    const items = (day as { items?: unknown } | null)?.items;
    if (!Array.isArray(items)) return null;
    return items.flatMap((raw) => {
      const item = raw as { type?: unknown; name?: unknown; lat?: unknown; lng?: unknown } | null;
      if (!item || item.type !== "destination" || typeof item.name !== "string") return [];
      return [{
        name: item.name,
        lat: typeof item.lat === "number" ? item.lat : undefined,
        lng: typeof item.lng === "number" ? item.lng : undefined,
      }];
    });
  };
  const sameSpot = (a: PlanItemLite, b: PlanItemLite) =>
    normalizeForMatch(a.name) === normalizeForMatch(b.name) ||
    (typeof a.lat === "number" &&
      typeof a.lng === "number" &&
      typeof b.lat === "number" &&
      typeof b.lng === "number" &&
      // 座標0,0は未設定の扱い
      !(a.lat === 0 && a.lng === 0) &&
      !(b.lat === 0 && b.lng === 0) &&
      distanceKm(a.lat, a.lng, b.lat, b.lng) <= SAME_SPOT_KM);

  return daysA.every((dayA, i) => {
    const a = spotsOf(dayA);
    const b = spotsOf(daysB[i]);
    return a !== null && b !== null && a.length === b.length && a.every((spot, k) => sameSpot(spot, b[k]));
  });
}

/**
 * 2案が同じ行程なら、プランAだけを残して samePlans を付ける（別名を付けて違う案に見せない）。
 * 名前と説明は画面側で固定の文言に置き換える。まとめたら true。
 */
function mergeSamePlans(parsed: unknown): boolean {
  if (!plansHaveSameItinerary(parsed)) return false;
  const result = parsed as { plans: unknown[]; samePlans?: boolean };
  result.plans = [result.plans[0]];
  result.samePlans = true;
  return true;
}

function buildCorrectionPrompt(basePrompt: string, missingLines: string[], overnightLines: string[]): string {
  const sections: string[] = [];
  if (missingLines.length > 0) {
    sections.push(`## ユーザーが指定した目的地が、理由の説明なしに抜けていました
${missingLines.map((w) => `- ${w}`).join("\n")}

今回は上記の目的地を必ず該当プランの、指定された日のitemsに含めてください（プランAとプランBで分け合うこと・別の日へ移すことは禁止）。`);
  }
  if (overnightLines.length > 0) {
    sections.push(`## 行程が日付をまたいでいました（到着地への到着が翌日になっており、実行できません）
${overnightLines.map((w) => `- ${w}`).join("\n")}

今回は各日の行程をその日のうちに終えてください（到着地への到着は23:59まで。すべての時刻を00:00〜23:59の範囲で、前の項目より後の時刻で書く）。`);
  }

  return `${basePrompt}

# 【再生成の指示・最優先】
直前の出力には次の問題がありました。

${sections.join("\n\n")}

時間が足りない場合は、ルール5の順で調整すること：
1. AIが追加した観光スポットを削る
2. 滞在時間を短縮する（最低30分）
3. それでも収まらなければ、到着希望時間を超えてもプランに含め、tipsに到着の遅れ見込みを明記する（ただし日付はまたがないこと）
到着時刻は移動時間と滞在時間を積み上げて書き、時刻を詰めてつじつまを合わせないこと。
物理的に訪問できない場合（含めると日付をまたぐ場合を含む）に限り、その目的地をitemsに入れず、removedSpotsに名前と具体的な理由を書くこと（別スポットへの置き換えは禁止）。
出力は前回と同じ { "plans": [...] } のJSONのみを返すこと。`;
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = getIp(request);
  const ipHash = hashValue(ip);
  const userAgent = request.headers.get("user-agent") || "";
  let sessionId = "unknown";
  let accepted = false;

  try {
    const body: PlanRequest = await request.json();
    sessionId = body.sessionId || request.headers.get("x-plan-session-id") || "unknown";

    if (!verifyOrigin(request)) {
      auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_origin" });
      return planJsonError("このサイト以外からのAIプラン作成リクエストは受け付けていません。", 403, "bad_origin");
    }

    const inputCheck = validatePlanInput(body);
    if (!inputCheck.ok) {
      auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_input" });
      return planJsonError(inputCheck.message, 400, "bad_input");
    }

    if (!(await verifyTurnstile(body.turnstileToken, ip))) {
      auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_turnstile" });
      return planJsonError("認証確認に失敗しました。画面を更新してからもう一度お試しください。", 403, "bad_turnstile");
    }

    const rateLimit = checkPlanRateLimit(ipHash, sessionId);
    if (!rateLimit.ok) {
      auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: rateLimit.errorType });
      return planJsonError(rateLimit.message, rateLimit.status, rateLimit.errorType);
    }

    if (!checkDuplicate(`${ipHash}:${sessionId}:${contentHash(body)}`)) {
      auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "duplicate" });
      return planJsonError("同じ内容のAIプラン作成が短時間に送信されています。少し時間を置いてから再度お試しください。", 429, "duplicate");
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "missing_api_key" });
      return planJsonError("AIプラン作成の設定が完了していません。しばらくしてから再度お試しください。", 503, "missing_api_key");
    }

    recordAcceptedPlanRequest(ipHash, sessionId);
    accepted = true;

    const prompt = buildPrompt(body);
    const maxOutputTokens = maxOutputTokensFor(body);
    /** JSONとして読めなかったときの再試行は、リクエスト全体で1回だけ */
    let parseRetryUsed = false;
    /** 失敗した全試行の記録（モデル・HTTPステータス・finishReason・エラーコード）。利用者向けの文面は先頭の失敗で決める */
    const attemptHistory: PlanAttemptRecord[] = [];

    /** 失敗した試行を1件ずつ監査ログに出し、履歴にも積む */
    const recordFailure = (stage: PlanAttemptStage) => (attempt: FailedPlanAttempt) => {
      const message = errorMessageOf(attempt.error).substring(0, 300);
      const quota = quotaDetailsOf(attempt.error);
      const { usageMetadata, ...info } = attempt.info;
      attemptHistory.push({
        ...info,
        stage,
        kind: attempt.kind,
        httpStatus: attempt.httpStatus,
        errorCode: attempt.errorCode,
        outputTokens: usageMetadata?.candidatesTokenCount,
        thoughtsTokens: thoughtsTokensOf(usageMetadata),
        message,
        ...(quota ? { quota } : {}),
      });
      auditPlanLog({
        requestId,
        ipHash,
        userAgent,
        sessionId,
        errorType: "gemini_attempt_failed",
        stage,
        ...attempt.info,
        httpStatus: attempt.httpStatus,
        errorCode: attempt.errorCode,
        reason: `${attempt.kind}: ${message}`,
        ...(quota ? { quota } : {}),
      });
    };

    // キーそのもの（一部でも）はログに出さない。本数と種別だけ残す
    console.log(`[plan] API keys: ${apiKeys.length} (${apiKeys.map(k => k.tier).join(" → ")}) / Models: ${MODEL_NAMES.join(", ")} / maxOutputTokens: ${maxOutputTokens}`);

    // Outer loop: FREE key first → PAID key fallback (seamless to user)
    keyLoop: for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const { key: apiKey, tier } = apiKeys[keyIdx];
      const genAI = new GoogleGenerativeAI(apiKey);
      const keyLabel = `key${keyIdx + 1}[${tier}]`;

      // Inner loop: try each model with this key
      for (const modelName of MODEL_NAMES) {
        let retries = 0;
        const maxRetries = 1;
        let stage: PlanAttemptStage = "initial";
        let attemptTokens = maxOutputTokens;
        while (retries <= maxRetries) {
          console.log(`[${keyLabel}] Trying model: ${modelName}${retries > 0 ? ` (retry ${retries})` : ""}${stage === "parse_retry" ? " (JSON再試行)" : ""}`);
          const attempt = await requestPlan(genAI, modelName, prompt, attemptTokens, 0.7, recordFailure(stage));

          if (!attempt.ok) {
            const errMsg = errorMessageOf(attempt.error);
            console.error(`[${keyLabel}/${modelName}] FULL ERROR (${attempt.errorCode}): ${errMsg.substring(0, 500)}`);

            if (attempt.kind === "response") {
              if (attempt.errorCode === "ai_blocked") {
                // 安全性などの理由で止められた応答は、作り直しても同じ結果になりやすいので再試行しない
                console.warn(`[${keyLabel}] ${modelName} の応答がブロックされたため再試行しません (${errMsg.substring(0, 200)})`);
                break keyLoop;
              }
              if (!parseRetryUsed) {
                // 応答はあったがプランとして使えなかった（空・途中終了・JSONとして読めない） → 同じモデルで1回だけ作り直す。
                // 出力上限で途切れていた場合は上限を倍にする。
                parseRetryUsed = true;
                stage = "parse_retry";
                if (attempt.errorCode === "ai_truncated") {
                  attemptTokens = Math.min(OUTPUT_TOKENS_MAX, attemptTokens * 2);
                }
                console.warn(`[${keyLabel}] ${modelName} の応答をプランとして使えなかったため1回だけ再試行します (${attempt.errorCode}, finishReason: ${attempt.info.finishReason ?? "unknown"}, maxOutputTokens: ${attemptTokens})`);
                continue;
              }
              // 再試行でも使えなければ打ち切る（別モデルで続けると待ち時間とAPI利用量が膨らむため）
              break keyLoop;
            }

            const { is503, is404, is403, is429 } = classifyGeminiError(errMsg);

            if (is503 && retries < maxRetries) {
              console.warn(`[${keyLabel}] ${modelName} 503, retrying once...`);
              retries++;
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            if (is429) {
              // Quota exhausted → try next model, then fallback to next key (FREE→PAID)
              const nextKeyInfo = keyIdx + 1 < apiKeys.length ? ` → next: ${apiKeys[keyIdx + 1].tier}` : " (last key)";
              console.warn(`[${keyLabel}] ${modelName} 429 quota — trying next model${nextKeyInfo}`);
              break;
            }
            if (is403) {
              // Auth/key error → switch key immediately
              console.warn(`[${keyLabel}] ${modelName} 403 auth — switching to next key`);
              continue keyLoop;
            }
            if (is503) {
              // Server error after retry → try next model on same key first
              console.warn(`[${keyLabel}] ${modelName} 503 after retry — trying next model`);
              break;
            }
            if (is404) {
              console.warn(`[${keyLabel}] ${modelName} 404, trying next model`);
            } else {
              console.warn(`[${keyLabel}] ${modelName} failed:`, errMsg.substring(0, 200));
            }
            break;
          }

          let plan = attempt.plan;

          // 空の日・余分な日・不要な食事スポットを取り除く。欠落の判定より先に行う
          // （取り除いた食事スポットの名前で目的地が見つかったことにしないため）
          let sanitized = sanitizePlan(body, plan, stage);
          if (sanitized.length > 0) {
            console.warn(`[${keyLabel}/${modelName}] プランを整形しました (${stage}): ${formatSanitizeRecords(sanitized)}`);
          }

          // 次のどちらかがあれば、指摘を添えて1回だけ作り直す
          // - ユーザー指定の目的地が理由なしに抜けている（AIが理由付きで除外したものは方針どおりなので対象外）
          // - 行程が日付をまたいでいる（到着地への到着が翌日になるプランは実行できない）
          // 時刻の前後（reversed）だけでは作り直さない（記録のみ）
          const multiDay = body.days.length > 1;
          let missing = findMissingDestinations(body, plan);
          let timeIssues = findScheduleTimeIssues(body, plan);
          let correctionRecord: PlanCorrectionRecord | undefined;
          const unexplained = missing.filter((m) => !m.explained);
          const overnight = timeIssues.filter((i) => i.kind === "overnight");
          if (unexplained.length > 0 || overnight.length > 0) {
            const missingLines = unexplained.map((m) => describeMissing(m, multiDay));
            const overnightLines = overnight.map((i) => describeTimeIssue(i, multiDay));
            const trigger: PlanCorrectionRecord["trigger"] = [
              ...(unexplained.length > 0 ? (["unexplained_missing"] as const) : []),
              ...(overnight.length > 0 ? (["overnight"] as const) : []),
            ];
            console.warn(`[${keyLabel}/${modelName}] 作り直しの対象を検出: ${[...missingLines, ...overnightLines].join(" / ")} — 1回だけ再生成します`);
            const correction = await requestPlan(genAI, modelName, buildCorrectionPrompt(prompt, missingLines, overnightLines), attemptTokens, 0.4, recordFailure("correction"));
            if (correction.ok) {
              const correctionSanitized = sanitizePlan(body, correction.plan, "correction");
              if (correctionSanitized.length > 0) {
                console.warn(`[${keyLabel}/${modelName}] プランを整形しました (correction): ${formatSanitizeRecords(correctionSanitized)}`);
              }
              const retryMissing = findMissingDestinations(body, correction.plan);
              const retryTimeIssues = findScheduleTimeIssues(body, correction.plan);
              // 改善した場合のみ採用する（悪化した再生成結果は使わない）
              const adopted = isBetterPlan({ missing: retryMissing, timeIssues: retryTimeIssues }, { missing, timeIssues });
              if (adopted) {
                plan = correction.plan;
                missing = retryMissing;
                timeIssues = retryTimeIssues;
                sanitized = correctionSanitized;
              }
              correctionRecord = { trigger, outcome: adopted ? "adopted" : "rejected", outputTokens: correction.info.usageMetadata?.candidatesTokenCount };
            } else {
              console.warn(`[${keyLabel}/${modelName}] 再生成に失敗: ${errorMessageOf(correction.error).substring(0, 200)}`);
              correctionRecord = { trigger, outcome: "failed" };
            }
          }

          if (timeIssues.length > 0) {
            console.warn(`[${keyLabel}/${modelName}] 時刻の問題が残りました: ${timeIssues.map((i) => describeTimeIssue(i, multiDay)).join(" / ")}`);
          }

          // 残った欠落は removedSpots にまとめて利用者に示す（黙って落とさない）
          if (missing.length > 0) {
            console.warn(
              `[${keyLabel}/${modelName}] 指定目的地の欠落が残りました: ${missing
                .map((m) => `${describeMissing(m, multiDay)}${m.explained ? "（AIの理由あり）" : "（理由なし）"}`)
                .join(" / ")}`
            );
          }
          annotateRemovedSpots(body, plan, missing);
          const samePlans = mergeSamePlans(plan);
          const explainedCount = missing.filter((m) => m.explained).length;
          const overDays = attachScheduleChecks(body, plan).filter((c) => c.overrunMinutes > 0);
          const carRestriction = collectCarRestrictions(plan);

          console.log(`[${keyLabel}] Success with model: ${modelName}`);
          const usage = attempt.info.usageMetadata;
          auditPlanLog({
            requestId,
            ipHash,
            userAgent,
            sessionId,
            errorType: "ok",
            inputTokens: usage?.promptTokenCount,
            outputTokens: usage?.candidatesTokenCount,
            thoughtsTokens: thoughtsTokensOf(usage),
            totalTokens: usage?.totalTokenCount,
            stage,
            ...attempt.info,
            // 再試行やフォールバックの末に成功した場合も、先に失敗した試行の理由を残す
            ...(attemptHistory.length > 0 ? { attempts: attemptHistory } : {}),
            // 返したプランから取り除いたもの（黙って消さない）
            ...(sanitized.length > 0 ? { sanitized } : {}),
            // 返したプランに入らなかった指定目的地の件数（AIの理由あり／なし）
            ...(missing.length > 0
              ? { missingDestinations: { explained: explainedCount, unexplained: missing.length - explainedCount } }
              : {}),
            ...(correctionRecord ? { correction: correctionRecord } : {}),
            ...(timeIssues.length > 0
              ? {
                  scheduleTimeIssues: {
                    overnight: timeIssues.filter((i) => i.kind === "overnight").length,
                    reversed: timeIssues.filter((i) => i.kind === "reversed").length,
                  },
                }
              : {}),
            ...(overDays.length > 0
              ? {
                  scheduleChecks: {
                    overDays: overDays.length,
                    maxOverrunMinutes: Math.max(...overDays.map((c) => c.overrunMinutes)),
                  },
                }
              : {}),
            ...(carRestriction ? { carRestriction } : {}),
            // 2案が同じ行程で、プランAだけを返した
            ...(samePlans ? { samePlans: true } : {}),
          });
          return NextResponse.json(plan);
        }
      }
    }

    // All models failed — 詳細はサーバーログにだけ残し、利用者には errorCode に応じた定型文を返す。
    // 文面は最後ではなく最初の失敗で決める（後段のモデルは1段目の失敗を受けて呼んだ代替で、根本原因は1段目にあるため）。
    // 生成設定を 400 で拒否されて設定を外して続けた分（config_rejected）は、利用者向けの判定からは除く。
    const firstFailure = attemptHistory.find((record) => record.kind !== "config_rejected");
    const errorCode: PlanErrorCode = firstFailure?.errorCode ?? "ai_failed";
    console.error("All Gemini models failed. Attempts:", JSON.stringify(attemptHistory));
    auditPlanLog({
      requestId,
      ipHash,
      userAgent,
      sessionId,
      errorType: "gemini_error",
      errorCode,
      reason: firstFailure
        ? `first failure: ${firstFailure.model} ${firstFailure.kind} ${firstFailure.message.substring(0, 200)}`
        : "no failed attempt recorded",
      attempts: attemptHistory,
    });
    const status = errorCode === "ai_busy" || errorCode === "ai_unavailable" ? 503 : 500;
    return planJsonError(PLAN_ERROR_MESSAGES[errorCode], status, "gemini_error", errorCode);
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    auditPlanLog({
      requestId,
      ipHash,
      userAgent,
      sessionId,
      errorType: "bad_input",
      reason: errorMessageOf(error).substring(0, 300),
    });
    return planJsonError(PLAN_ERROR_MESSAGES.bad_request, 400, "bad_input", "bad_request");
  } finally {
    if (accepted) releasePlanIp(ipHash);
  }
}

export async function GET() {
  return planJsonError("AIプラン作成APIはPOSTリクエストのみ受け付けています。", 405, "bad_method");
}

function buildPrompt(body: PlanRequest): string {
  // Detect if any input is in English
  const allText = body.days.map(d => `${d.departure} ${d.arrival} ${d.destinations.map(dd => dd.name).join(" ")}`).join(" ");
  const hasEnglish = /[a-zA-Z]{3,}/.test(allText);

  // Check if omakase is used
  const hasOmakase = body.days.some(d => d.destinations.some(dd => dd.isOmakase));

  // 日付をまたぐ行程は禁止する。利用者が日付をまたぐ時間帯（出発より早い到着希望時刻）を指定した日だけは例外
  const userCrossesMidnight = body.days.some((d) => dayWindowCrossesMidnight(d));
  const sameDayRule = `各日の行程は出発した日のうちに終えること（到着地への到着は23:59まで。すべての時刻を00:00〜23:59の範囲で、前の項目より後の時刻で書く${
    userCrossesMidnight ? "。ただし、出発時刻より早い到着希望時刻が指定された日は、その到着希望時刻までの日付またぎを認める" : ""
  }）`;

  const daysDescription = body.days
    .map((day) => {
      // Build destination list; mark the first destination with 【最初に行く】 if firstDestId is set
      const destLines = day.destinations
        .map((d, idx) => {
          if (d.isOmakase) return "  - 【おまかせ（AIが提案）】";
          if (!d.name?.trim()) return "";
          const marks: string[] = [];
          if (idx === 0 && day.firstDestId) marks.push("【最初に行く】");
          if (d.meal === "lunch") marks.push("【この場所で昼食】");
          if (d.meal === "dinner") marks.push("【この場所で夕食】");
          const detail: string[] = [];
          if (d.address && d.address.trim() && d.address.trim() !== d.name.trim()) {
            detail.push(`住所: ${d.address.trim()}`);
          }
          if (typeof d.lat === "number" && typeof d.lng === "number") {
            detail.push(`座標: ${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`);
          }
          return `  - ${marks.join("")}${d.name.trim()}${detail.length > 0 ? `（${detail.join(" / ")}）` : ""}`;
        })
        .filter(Boolean)
        .join("\n");

      const lunchDest = day.destinations.find((d) => !d.isOmakase && d.meal === "lunch" && d.name?.trim());
      const dinnerDest = day.destinations.find((d) => !d.isOmakase && d.meal === "dinner" && d.name?.trim());

      const lunchDesc = lunchDest
        ? `あり（目的地「${lunchDest.name.trim()}」で食べる。この目的地自体を昼食スポットとして扱い、別の昼食スポットは追加しないこと）`
        : day.includeLunch
          ? `あり${day.lunchLocation ? `（希望場所: ${day.lunchLocation}）` : ""}${day.lunchGenre ? `（ジャンル: ${day.lunchGenre}）` : ""}`
          : "不要";
      const dinnerDesc = dinnerDest
        ? `あり（目的地「${dinnerDest.name.trim()}」で食べる。この目的地自体を夕食スポットとして扱い、別の夕食スポットは追加しないこと）`
        : day.includeDinner
          ? `あり${day.dinnerLocation ? `（希望場所: ${day.dinnerLocation}）` : ""}${day.dinnerGenre ? `（ジャンル: ${day.dinnerGenre}）` : ""}`
          : "不要";

      const aiOmakaseNote = body.aiOmakase !== false
        ? "\n- 【おまかせ】目的地はルート上で最適な観光地をAIが追加提案してください"
        : "";

      return `
## ${day.dayIndex + 1}日目
- 出発地: ${day.departure}（${day.departureTime}出発）
- 希望目的地:
${destLines || "  - なし（AIが提案）"}${aiOmakaseNote}
- 終着地: ${day.arrival}（${day.arrivalTime}までに到着希望）
- 昼食: ${lunchDesc}
- 夕食: ${dinnerDesc}`;
    })
    .join("\n");

  // 各プランに必ず含めなければならないユーザー指定目的地の一覧。
  // 「絶対に削除しないこと」と書くだけでは実際に欠落することがあるため、
  // プロンプト末尾にもチェックリストとして再掲する。
  const mustIncludeNames = body.days.flatMap((day) =>
    day.destinations
      .filter((d) => !d.isOmakase && d.name?.trim())
      .map((d) => `${body.days.length > 1 ? `${day.dayIndex + 1}日目: ` : ""}${d.name.trim()}`)
  );
  const mustIncludeBlock =
    mustIncludeNames.length > 0
      ? `
- **【最重要】以下のユーザー指定目的地は、プランA・プランBの両方のitemsに、指定された日に必ず1回ずつ含めること。省略・統合・別スポットへの置き換え・プランAとプランBでの分け合い・別の日への移し替えはすべて禁止。時間が足りない場合はルール5の順（AIが追加したスポットを削る→滞在時間を短縮→到着の遅れを明記して含める）で調整し、物理的に訪問できない場合に限り、itemsに入れずremovedSpotsに具体的な理由を書くこと:**
${mustIncludeNames.map((n) => `  - ${n}`).join("\n")}`
      : "";

  const dogContext = body.withDog
    ? `
## 犬連れ旅行の条件
- 犬を連れた旅行です
- 2時間以上の連続運転では犬の散歩休憩（15分）を入れてください（dogWalkStop: true を設定）
- 犬同伴可能な施設・飲食店を優先してください
- 屋内施設はペット不可の可能性を注記してください
- ドッグラン併設の休憩スポットがあれば提案してください
- **【おまかせ】での動物園・水族館・サファリパーク・テーマパークの提案禁止（最重要）**:
  - 動物園・水族館・サファリパーク・テーマパーク・遊園地・動物ふれあい施設は、**明示的にペット同伴可能と分かっている施設を除き、ペット同伴不可と判断すること**
  - 【おまかせ】の追加提案候補としては、これらの施設を**原則として提案しないこと**（ユーザーが目的地として明示的に指定した場合のみ、下の「犬が入場できない可能性がある施設」のルールに従って扱う）
  - 例外的に【おまかせ】候補として提案してよいのは、ペット同伴可能と確認されている以下の施設に限る:
    ・動物園・牧場等: 那須どうぶつ王国、白樺リゾート池の平ファミリーランド（わくわくどうぶつ王国）、伊豆アニマルキングダム、伊豆シャボテン動物公園、IPCわんわん動物園、しろとり動物園、ふれあい動物園ピクニカ共和国、阿蘇カドリー・ドミニオン、くじゅう自然動物園、ノーザンホースパーク、サファリリゾート姫路セントラルパーク、榎本牧場、悠久山公園（悠久山小動物園）、海の中道海浜公園（動物の森）、淡路カントリーガーデン、道の駅 丹後王国「食のみやこ」
    ・水族館: 男鹿水族館GAO、かすみがうら水族館、箱根園水族館、かつうら海中公園・海中展望塔、蓼科アミューズメント水族館、伊豆・三津シーパラダイス、下田海中水族館、南知多ビーチランド＆南知多おもちゃ王国、鳥羽水族館、イルカ島、海遊館、串本海中公園、京都大学白浜水族館、太地町立くじらの博物館、新屋島水族館、桂浜水族館、高知県立足摺海洋館SATOUMI、海中水族館シードーナツ
    ・テーマパーク・遊園地: 那須ハイランドパーク、江戸ワンダーランド（日光江戸村）、那須高原りんどう湖ファミリー牧場、東武ワールドスクエア、つくばわんわんランド、こもれび森のイバライド、いばらきフラワーパーク、ロックハート城、ムーミンバレーパーク・メッツァビレッジ、東京ドームシティラクーア、KISARAPIA（キサラピア）、東京ドイツ村 わんちゃんランド、マザー牧場（わくわくランド）、成田ゆめ牧場、さがみ湖MORIMORI、世界の名犬牧場、富士急ハイランド、伊豆ぐらんぱる公園、遊園地ぐりんぱ-Grinpa-、野外民族博物館リトルワールド
  - 上記リストにない動物園・水族館・サファリパーク・テーマパーク（例: 群馬サファリパーク、上野動物園、多くの公営動物園・水族館・遊園地）は、ユーザーが目的地として明示的に指定していない限り、おまかせの追加候補として絶対に提案しないこと
- **【特定施設の重要情報・誤情報に注意】**:
  - **群馬サファリパーク**: 「犬を車内に入れたままサファリゾーンを走行できる」という情報は**誤りです**。群馬サファリパークは犬を車内に乗せたままでの入場は一切できません。ペットを連れた場合は、必ず施設のペット預かりサービスに預けてから入場する必要があります（ペット預かりサービスの事前予約・確認が必須）。descriptionとtipsに「⚠️ 群馬サファリパークは犬を車に乗せたままでの入場はできません。施設のペット預かりサービスに預けてからご入場ください。事前に施設へご確認・ご予約ください」と必ず明記すること
- **犬が入場できない可能性がある施設**（神社仏閣の境内、動物園・水族館、一部テーマパーク等）がユーザー指定の目的地に含まれる場合:
  - **犬が入場できない可能性があることを理由に、ユーザー指定の目的地をルートから除外しないこと。プランA・プランBともに必ず含めること。**
  - 理由: 施設内に犬が入れなくても、周辺の散歩・外観見学・駐車場での休憩など部分的に楽しめる場合があるため
  - プランA・プランBともに: descriptionに「⚠️ 施設内はペット入場不可の場合があります。周辺の散歩や外観見学は可能なことが多いですが、事前に施設へご確認ください。入場できない場合は車内待機または近隣のペット預かり施設をご利用ください」と明記する
  - プランBでは追加で: 同じ目的地を含めた上で、近隣に犬同伴可能なスポット（ドッグラン・ペットOK公園・テラス席OKカフェ・店内ペットOKカフェ等）があればルートに**追加**して提案する（代替ではなく追加）
  - tipsに犬が入場不可の可能性がある施設についての注意事項と対策を含める
  - 犬の入場可否を理由に、removedSpotsへユーザー指定の目的地を記載することは禁止（犬と関係のない理由で物理的に訪問できない場合の扱いはルール5に従う）`
    : "";

  const dateContext = body.travelDate
    ? analyzeTravelDate(body.travelDate, body.days.length)
    : "";

  // Traveler profile context
  let travelerContext = "";
  if (body.travelerProfile) {
    const p = body.travelerProfile;
    const parts: string[] = [];

    const partyLabels: Record<string, string> = {
      solo: "一人旅",
      couple: "カップル・夫婦旅行",
      family: "家族旅行",
      friends: "友人・グループ旅行",
      senior: "シニア旅行",
    };
    if (p.partyType && partyLabels[p.partyType]) {
      parts.push(`- 旅行スタイル: ${partyLabels[p.partyType]}`);
    }

    const ageLabels: Record<string, string> = {
      "20s": "20代", "30s": "30代", "40s": "40代",
      "50s": "50代", "60s": "60代", "70plus": "70代以上",
    };
    if (p.ageRange && ageLabels[p.ageRange]) {
      parts.push(`- 年代: ${ageLabels[p.ageRange]}`);
    }

    if (p.hobbies && p.hobbies.trim()) {
      parts.push(`- 趣味・興味: ${p.hobbies.trim()}`);
    }

    if (p.hasChildren) {
      parts.push(`- 子供連れ: あり${p.childAges ? `（${p.childAges}）` : ""}`);
    }

    if (parts.length > 0) {
      travelerContext = `
## 旅行者の情報
${parts.join("\n")}

上記の旅行者情報を踏まえて以下を考慮してください：
${p.partyType === "solo" ? "- 一人でも楽しめるスポット（絶景、温泉、カフェ、写真映えスポット）を優先\n- 一人で入りやすい飲食店を提案" : ""}
${p.partyType === "couple" ? "- ロマンチックなスポット、雰囲気の良いレストラン、景色の美しい場所を優先\n- カップル向けの体験（工芸体験、ワイナリーなど）も提案" : ""}
${p.partyType === "family" ? "- 家族全員が楽しめる体験型スポット、公園、テーマパークを優先\n- 子供の年齢に合った施設を選定\n- ベビー設備や授乳室の有無にも配慮" : ""}
${p.partyType === "friends" ? "- アクティブな体験、フォトジェニックなスポット、グルメスポットを優先\n- グループで盛り上がれるアクティビティを提案" : ""}
${p.partyType === "senior" ? "- バリアフリー対応や歩行距離の少ないスポットを優先\n- ゆったりしたスケジュールで無理のないプラン\n- 休憩時間を多めに確保\n- 歴史・文化系のスポットを重視" : ""}
${p.hobbies ? `- 趣味「${p.hobbies.trim()}」に関連するスポットやアクティビティを積極的に提案すること\n- おまかせの目的地選定では趣味との関連性を重視すること` : ""}
${p.hasChildren ? `- 子供（${p.childAges || "年齢不明"}）が楽しめるスポットを必ず含める\n- 長時間の移動を避け、こまめに休憩を入れる\n- トイレ休憩のタイミングに配慮\n- 子供向けメニューのある飲食店を優先` : ""}
${p.ageRange === "20s" || p.ageRange === "30s" ? "- SNS映えするスポットやトレンドの飲食店も考慮" : ""}
${p.ageRange === "60s" || p.ageRange === "70plus" ? "- 歩行距離を最小限に抑え、ゆとりのあるスケジュールにする\n- 温泉や日本庭園など落ち着いたスポットを重視" : ""}`;
    }
  }

  const englishContext = hasEnglish
    ? `
## 多言語対応
- 入力に英語が含まれています。場所名が英語で入力されていても正しく日本国内の場所を特定してください
- 例: "Tokyo Station" → 東京駅, "Kamakura" → 鎌倉, "Mt. Fuji" → 富士山
- 出力のスポット名は日本語で統一してください（英語入力でも日本語名で出力）
- ただし、descriptionやtipsには必要に応じて英語名も併記してください`
    : "";

  // Plan variation strategy — use body.aiOmakase flag (not the legacy isOmakase per-spot flag)
  let planVariationInstruction: string;
  if (body.aiOmakase !== false) {
    planVariationInstruction = `
## 2プラン作成（おまかせONモード）
「目的地以外はお任せ」がONになっています。**プランA・プランBともに、まずユーザー指定の目的地をすべて含め、そのうえで出発〜到着の時間がなお余る場合に限り、AIがおすすめ観光スポットを追加してください。**
2プランは追加するおすすめスポットのテーマを変えて差別化してください：
- **プランA「定番プラン」**: ユーザー指定の目的地 + 定番・王道の観光スポットをAIが追加
- **プランB「穴場プラン」**: ユーザー指定の目的地 + 穴場・体験型・ユニークなスポットをAIが追加
**重要:**
- 両プランとも、ユーザー指定の目的地をすべて含めてもなお時間に余裕がある場合は、積極的にスポットを追加すること
- AIが追加するスポットのために、指定目的地の滞在時間を削ったり到着希望時間を超えたりしないこと（時間が足りない場合はAIの追加スポットを減らす。ルール5）
- 時間に余裕がある場合は、PAのみで終わらせず、観光地・道の駅・景勝地など魅力的なスポットを追加すること
- planNameとplanDescriptionでテーマの違いを明確に説明すること`;
  } else {
    planVariationInstruction = `
## 2プラン作成（おまかせOFFモード）
「目的地以外はお任せ」がOFFです。ユーザーが指定した目的地を中心にプランを作成します。
**重要: プランA・プランBの両方に、ユーザーが指定した目的地をすべて必ず含めてください。**
- **プランA「直行プラン」**: ユーザー指定の目的地のみで構成。最短・最効率なルート
- **プランB「余裕プラン」**: ユーザー指定の目的地をすべて含めた上で、ルート上で自然に立ち寄れる休憩スポット・道の駅・景色の良いスポットをAIが厳選して数か所追加
planNameとplanDescriptionでプランの違いを明確に説明してください。`;
  }

  return `あなたは日本の車旅行の専門プランナーです。以下の条件で**2つの旅行プラン**をJSON形式で作成してください。

# 旅行条件
${daysDescription}
${dogContext}
${travelerContext}
${dateContext}
${englishContext}
${planVariationInstruction}

# ルール
1. 出発時間と到着希望時間の間に収めるよう努めること。ただし、ユーザー指定の目的地をすべて含めることのほうを優先する（収まらない場合の扱いはルール5に従う）
   - **${sameDayRule}**。日付をまたがないと回れない場合は、ルール5の除外（理由付き）で対応すること
2. 移動時間の計算:${body.useHighway === false ? `
   - **高速道路は使用しないこと（ユーザー設定）。すべて一般道でルートを組むこと**
   - 一般道の速度: 45km/h で計算
   - useHighway は常に false、highwayEntry/highwayExit/highwayName はすべて空文字列にすること` : `
   - **高速道路を積極的に使用すること（ユーザー設定：高速ON）**
   - 距離20km以上の区間は原則として高速道路を使用すること（useHighway: true、IC情報を必ず記載）
   - 高速道路の速度: 90km/h（実勢速度）、一般道: 40km/h（信号・渋滞考慮）
   - 高速道路を使わない場合は必ず理由をdescriptionに記載すること
   - 休日・祝日は高速道路および都市部の一般道で渋滞が発生しやすいため、移動時間を1.3〜1.5倍に見積もること（ただし深夜21時〜翌朝5時は渋滞なしとして通常の移動時間で計算すること）
   - 朝7〜9時・夕方17〜19時の通勤ラッシュ時間帯も移動時間を1.2倍に見積もること（深夜21時〜翌朝5時は除く）`}
3. 各目的地の滞在時間は観光地の規模に応じて設定すること:
   - **動物園・水族館・テーマパーク・遊園地・大型アミューズメント施設: 最低120分（2時間）以上**
   - 大型自然公園・植物園・道の駅（大型）: 60〜90分
   - 一般的な観光地・寺社仏閣・博物館・美術館: 30〜60分
   - SA/PA・小規模スポット: 15〜30分
   - 時間が足りない場合でも動物園・水族館・テーマパーク等は最低90分を確保すること
4. 「おまかせ」の目的地はルート上で魅力的な観光地をAIが提案すること
5. **ユーザーが指定した目的地はすべてプランに含めること（基本方針：全部入れる。どうしても無理なら置き換えずに除外し、理由を書く）**。時間が厳しい場合は、次の順で調整すること：
   （1）AIが追加したスポット（おまかせ・時間調整のための追加スポット）を減らす
   （2）ユーザー指定の目的地の滞在時間を短縮する（最低30分。動物園・水族館・テーマパーク等はルール3の最低90分）
   （3）それでも収まらない場合は、到着希望時間を超えてもプランに含め、tipsで「到着が○○時頃に遅れる見込みです」と注記する（ただし日付はまたがないこと。ルール1）
   - 長距離移動では途中にSA/PA・道の駅での休憩を挟み、実現可能なプランにすること
   - 各itemの到着時刻は、直前の出発時刻に実際の移動時間（ルール2の目安）と滞在時間を積み上げて書くこと。到着希望時間に合わせるために移動時間を短く書くことは禁止
   - 物理的に訪問できない場合（例：移動だけで1日の行程に収まらない、含めると到着地への到着が日付をまたぐ）に限り、その目的地はitemsに入れず、commentaryのremovedSpotsに名前と具体的な理由（例：「○○から片道約4時間かかり、1日の行程に収まらないため」）を書くこと
   - 除外した目的地の代わりに別のスポットを入れることは禁止。removedSpotsには、実際にitemsに入れなかったユーザー指定の目的地だけを書くこと
   - プランAとプランBで指定目的地を分け合うこと、指定された日から別の日へ移すことは禁止
6. ルート最適化（**ジグザグ厳禁・最重要**）:
   - 帰りのドライブが楽になるよう、可能な限り遠い目的地から先に訪問し、帰りながら近い目的地を回るルートにすること（アウトアンドバック方式）
   - ただし最初に行く目的地が指定されている場合はその制約を優先すること
   - 効率的なルート順序に最適化すること（往復の総距離を最小化）
   - **絶対に避けるべき悪い例**: 出発地→軽井沢（遠方）→群馬サファリパーク（軽井沢から見て別方向に大きく外れた場所）→小諸（出発地寄り、軽井沢より手前）のように、一度遠方へ行った後に別方向へ大きく迂回し、その後でまた出発地寄りの場所へ戻るような「行ったり来たり」のジグザグルートは絶対に作らないこと
   - **判定方法**: 目的地を訪問順に並べたとき、出発地からの距離または方角がなめらかに変化しているかを確認すること。ある目的地から次の目的地へ向かった後、その次に「直前より出発地に近く、かつ移動方向が逆または大きく異なる」目的地へ向かう順序（往復のムダが生じる順序）は禁止
   - 良いルートは、同じ方角・沿線上を一方向に進み、最後に帰着地へ向けて戻ってくる「一筆書き」の形になること
7. 各スポットの見どころや楽しみ方を簡潔に解説すること
8. 各itemにaddress（住所）を必ず含めること（「東京都千代田区丸の内1丁目」のような形式）
9. 昼食・夕食について:
   - 昼食が「あり」の場合: 11:30〜13:30の時間帯にitemsの中にtype="lunch"の食事スポットを**必ず1件**追加すること
   - 夕食が「あり」の場合: 17:30〜19:30の時間帯にitemsの中にtype="dinner"の食事スポットを**必ず1件**追加すること
   - 希望場所が「PA」または「パーキングエリア」と指定されている場合（**最重要ルール**）:
     ・**昼食の場合**: 出発地から最初の目的地へ向かう高速道路上のSA（サービスエリア）を食事場所として設定すること。最初の目的地に到着した後に高速を戻ってSAに行くようなルートは絶対に作らないこと
     ・**夕食の場合**: 最後の目的地から帰着地へ向かう高速道路上のSA（サービスエリア）を食事場所として設定すること
     ・nameは「○○SA（サービスエリア）で昼食」「○○SA（サービスエリア）で夕食」の形式にすること
     ・時間帯が早くなる場合は「早めの昼食」、遅くなる場合は「遅めの夕食」とdescriptionに説明すること
     ・高速道路を使用しない場合（useHighway=false）は、ルート上の道の駅を食事場所として設定すること
   - 希望場所が指定されている場合（PA以外）: **必ずその指定場所の周辺エリアで食事スポットを設定すること。指定場所が出発地や帰着地付近の場合を除き、出発地・帰着地の近くではなく指定された場所の近くで探すこと**
   - ジャンルが指定されている場合: そのジャンルの食事エリアとして提案すること
   - 食事スポットのnameは「○○エリアで昼食（ジャンル名）」の形式にすること（例: 「秩父駅周辺で昼食（蕎麦）」「箱根湯本周辺で夕食（和食）」）
   - ジャンル未指定の場合は「○○エリアで昼食」のようにジャンル省略も可
   - **具体的な店名は提案しないこと**（AIが提案する店名は不正確な場合があるため）
   - 食事スポットには必ずlat/lng/addressを含めること（食事エリアの中心地点の座標を使用）
   - descriptionには「このエリアで○○のお店をGoogle Mapsで検索してお選びください」と記載すること
   - 犬連れの場合はdescriptionに「犬同伴可のお店（テラス席OK or 店内ペットOK）を検索条件に加えてください」と追記すること
   - **犬連れで食事場所が指定されている場合**: 「○○周辺で犬同伴可のお店（テラス席OK or 店内ペットOK）をGoogle Mapsで検索してお選びください」のようにdescriptionに明記すること
   - 昼食・夕食が「不要」の場合: itemsへの食事スポット追加は不要
10. 食事スポットの注意:
   - 滞在時間は60分で設定すること
   - 希望場所が「PA」「パーキングエリア」の場合は、上記ルール9の「PA指定時の特別ルール」に従うこと（目的地の前後で高速を戻る逆走ルートは絶対禁止）
   - **希望場所が指定されていれば必ずその場所の周辺で食事スポットを設定すること（例: 「軽井沢周辺」なら軽井沢駅付近の座標を使用）。指定場所が出発地・帰着地付近の場合を除き、出発地や帰着地の近くではなく指定場所の近くで探すこと**
   - 希望場所が未指定の場合はルート上の目的地に近い場所を選ぶこと
   - lunchSpot/dinnerSpotのnameには「○○エリア（ジャンル名）」、descriptionには「○○周辺には○○のお店が多数あります」、nearSpotには「○○（目的地名）から車で約○分」と記載すること
   - lunchSpot/dinnerSpotのalternativesは不要（空配列でよい）
11. 時間の有効活用:
   - 出発時刻から終着地の希望時刻まで、できるだけ時間を有効に使うこと
   - 最後の目的地から終着地まで時間が2時間以上余る場合は、ルート上にさらなる観光スポットや食事スポットを追加すること
   - それでも追加スポットがない場合は、commentaryのtipsに「○○時頃に終着地に到着見込み。時間に余裕があります」と明記すること
   - 終着地には希望到着時刻ちょうど（または少し前）に到着するようスケジュールを組むこと（ただし、ユーザー指定の目的地を含めると間に合わない場合はルール5に従い、遅れを明記すること）
12. **営業時間・閉館時間の厳守（最重要）**:
   - 観光スポットへの到着時間が閉館時間に間に合うかを必ず確認すること
   - 日本の主な観光施設の一般的な閉館時間の目安：
     ・寺社仏閣（拝観）: 通常16:00〜17:00閉門（夕方以降は境内のみ入れる場合あり）
     ・有料の寺院・博物館・美術館: 通常16:30〜17:30（最終入場は30〜60分前）
     ・城・歴史的建造物: 通常16:00〜17:00
     ・動物園・水族館・テーマパーク: 施設により異なるが通常17:00〜18:00
     ・道の駅・SA/PA: 24時間〜営業（一部施設は18:00閉店）
     ・飲食店・カフェ: 施設による
   - **到着時間が16:00以降になる観光スポット（寺社・博物館・城等）は、閉館の可能性があるため以下を必ず実施する：**
     ・descriptionに「⚠️ 閉館時間にご注意ください。事前に営業時間をご確認の上、ご訪問ください（多くの寺社・観光施設は16:00〜17:00頃閉館）」と明記する
     ・tipsにも「○○は閉館時間が早いため、○○時頃の到着では入場できない可能性があります。事前に公式サイトで確認してください」と注記する
   - **到着時間が17:00以降になる有料観光施設（寺社・博物館・城等）のうち、AIが追加したスポットは原則スケジュールから除外し、代わりに夜間でも楽しめるスポット（夜景・ライトアップ・温泉街の散策・飲食エリア等）を提案すること**
   - ユーザーが指定した目的地でも閉館後になる場合は、tipsで「○○は閉館後の到着見込みです。翌日の訪問または日程の見直しをご検討ください」と警告すること
13. **高速道路の上り/下り判定（最重要・絶対厳守）**:
   - 日本の高速道路はPA・SAが上り線と下り線で物理的に完全に分離されており、反対方向のPA・SAには絶対にアクセスできません。誤った方向のPA・SAを提案すると致命的なミスとなります
   - **上り・下りの定義**: 東京（または各高速道路の起点となる主要都市）に**向かう方向が「上り」**、東京から**離れる方向が「下り」**
   - **主要高速道路の上り・下り方向**:
     ・東名高速・新東名: 東京方面=上り / 名古屋方面=下り
     ・中央道: 東京（高井戸）方面=上り / 長野・名古屋方面=下り
     ・関越道: 東京（練馬）方面=上り / 新潟方面=下り
     ・東北道: 東京（川口）方面=上り / 仙台・青森方面=下り
     ・常磐道: 東京（三郷）方面=上り / いわき・仙台方面=下り
     ・上信越道: 藤岡JCT方面=上り / 長野・上越方面=下り
     ・北陸道: 米原JCT方面=上り / 新潟方面=下り
     ・名神高速: 東京方面（小牧JCT経由）=上り / 大阪方面=下り
     ・新名神: 東京方面=上り / 大阪方面=下り
     ・東関東道: 東京方面=上り / 成田・潮来方面=下り
     ・館山道: 東京（木更津JCT）方面=上り / 館山方面=下り
     ・東水戸道路・北関東道: 起点JCT方面=上り / 終点方面=下り
     ・中国道・山陽道: 大阪方面=上り / 山口・九州方面=下り
     ・九州道: 北九州方面=上り / 鹿児島方面=下り
     ・道央道: 札幌方面=上り / 旭川・函館方面=下り
   - **判定ルール（必ず適用）**:
     ・出発地→目的地の移動方向（地理的に東京から離れる方向か、東京に近づく方向か）で上り・下りを判定すること
     ・往路（行き）と復路（帰り）でPA・SAの方向は逆になります。同じPA・SA名でも上り線と下り線は別施設です
     ・PA・SAをitemsまたはmealStopとして提案する際は、必ず「○○SA（上り）」「○○PA（下り）」のように方向を**name に明記**すること
     ・descriptionにも「上り線（東京方面）」または「下り線（○○方面）」の情報を含めること
   - **走行ルートと方向の整合性チェック**:
     ・出発地から目的地に向かう途中のPA・SAを提案する場合、その走行方向と一致する方向のPA・SAを選ぶこと
     ・例: 東京→軽井沢の場合は「下り」のPA・SAを使用、軽井沢→東京の場合は「上り」のPA・SAを使用
     ・1日の旅程で同じ高速道路を往復する場合、行きと帰りで異なる方向のPAを使い分けること
   - **誤った方向のPA・SAを提案することは絶対に禁止**。判断に迷う場合は、PA・SAではなく一般道沿いの道の駅や、目的地周辺のスポットを提案すること
14. 目的地がレストラン・食事処の場合の特別ルール（**重要**）:
   - 目的地の名前に「レストラン」「食事処」「ダイニング」「レストハウス」「食堂」「居酒屋」「割烹」「懐石」「焼肉」「寿司」「うどん屋」「蕎麦屋」「ラーメン」「カフェ」「ビストロ」「炉端」「鉄板焼き」「ファミリーレストラン」「焼き鳥」「天ぷら」「しゃぶしゃぶ」「すき焼き」「中華料理」「イタリアン」「フレンチ」等の飲食店を示すキーワードが含まれる場合:
   a. **その目的地自体を食事スポットとして扱うこと**。その目的地のtypeを到着予定時刻によって"lunch"または"dinner"に設定し、滞在時間は60分にすること
   b. 到着予定時刻による自動判定（昼食・夕食の設定がない場合でも同様）:
      ・11:00〜14:30到着予定 → type="lunch"、lunchInserted=true として扱う
      ・17:00〜20:30到着予定 → type="dinner"、dinnerInserted=true として扱う
      ・それ以外の時刻の場合は、より近い食事時間帯を選択すること（例: 15:00到着ならdinner）
   c. **重複禁止**: レストラン目的地がある場合、そのスポットが担当する食事（lunch/dinner）について別途の食事スポットを追加しないこと。例えば夕食目的地にレストランがある場合、別途type="dinner"のアイテムを追加しないこと
   d. ユーザーが昼食または夕食の設定をした場合も、そのレストラン目的地が該当する食事に充てること（設定した食事とレストランの時間帯が一致する場合は必ずそのレストランを食事スポットとして使用すること）
   e. descriptionにはレストランの料理ジャンルや雰囲気など見どころを記載し、「このレストランでの食事をお楽しみください」と記載すること
15. 目的地に【この場所で昼食】【この場所で夕食】が付いている場合（**14より優先する最重要ルール**）:
   - その目的地自体を食事スポットとして扱い、typeを"lunch"（昼食）または"dinner"（夕食）にすること
   - 滞在時間は60〜90分とし、昼食なら11:30〜13:30、夕食なら17:30〜19:30に到着するようスケジュールを組むこと
   - **その食事について別の食事スポットを追加してはならない**（別のtype="lunch"/"dinner"アイテムも、lunchSpot/dinnerSpotの追加提案も禁止）
   - 名前が住所のみで飲食店と判別できない場合でも、この指定がある以上その場所を食事スポットとして扱うこと
   - **到着時刻の調整を優先すること**: 他の目的地の訪問順序やスケジュールを調整してでも、この目的地への到着が昼食なら11:30〜13:30、夕食なら17:30〜19:30に収まるようにすること
   - **時間帯の絶対厳守（例外なし）**: ルート上どうしても上記の時間帯に収まらない場合でも、typeは"lunch"または"dinner"のまま変更しないこと（"destination"に変えたり、type未設定のまま出力したりすることは絶対禁止）。その場合はdescriptionに「本来の食事時間からずれた到着になります」と明記すること
   - **プランA・プランBで扱いを一致させること**: この指定がある目的地は、プランA・プランBの両方で同じくtype="lunch"/"dinner"として扱うこと。片方のプランだけ食事スポット扱いにして、もう片方は通常のdestinationのまま、という食い違いは絶対に禁止
16. 住所だけで指定された目的地（「〒」や番地を含む文字列）について:
   - **住所であることを理由に省略・除外してはならない**。必ずプランに含めること
   - その住所にある施設名が分かる場合は name に施設名、address に指定された住所を入れること
   - 分からない場合は name に指定された文字列をそのまま使い、address にも同じ住所を入れること
   - 座標が併記されている場合は、その座標をそのまま lat / lng に使うこと

# 出力JSON形式
**必ず以下の形式で出力すること。最外層は必ず { "plans": [...] } とすること。plans配列には必ず2つのプランを含めること。**

{
  "plans": [
    {
      "planName": "プランA: 定番プラン",
      "planDescription": "プランの概要と特徴（100文字程度）",
      "days": [
        {
          "dayIndex": 0,
          "items": [
            {
              "name": "自宅",
              "lat": 35.6812,
              "lng": 139.7671,
              "address": "出発地の住所",
              "type": "departure",
              "arrivalTime": "09:00",
              "departureTime": "09:00",
              "stayMinutes": 0,
              "distanceKm": 0,
              "travelMinutes": 0,
              "useHighway": false,
              "parkingInfo": "",
              "description": "",
              "dogWalkStop": false
            },
            {
              "name": "観光スポット名",
              "lat": 35.123,
              "lng": 139.456,
              "address": "東京都○○区○○1丁目",
              "type": "destination",
              "arrivalTime": "10:30",
              "departureTime": "11:30",
              "stayMinutes": 60,
              "distanceKm": 50,
              "travelMinutes": 45,
              "useHighway": true,
              "highwayEntry": "○○IC",
              "highwayExit": "○○IC",
              "highwayName": "○○自動車道",
              "parkingInfo": "駐車場あり（無料・50台）",
              "description": "見どころの説明",
              "dogWalkStop": false
            },
            {
              "name": "○○エリアで昼食（蕎麦）",
              "lat": 35.234,
              "lng": 139.567,
              "address": "○○県○○市○○町付近",
              "type": "lunch",
              "arrivalTime": "12:00",
              "departureTime": "13:00",
              "stayMinutes": 60,
              "distanceKm": 5,
              "travelMinutes": 10,
              "useHighway": false,
              "parkingInfo": "周辺に駐車場あり",
              "description": "このエリアで蕎麦のお店をGoogle Mapsで検索してお選びください",
              "dogWalkStop": false
            },
            {
              "name": "○○エリアで夕食（和食）",
              "lat": 35.345,
              "lng": 139.678,
              "address": "○○県○○市○○町付近",
              "type": "dinner",
              "arrivalTime": "18:00",
              "departureTime": "19:00",
              "stayMinutes": 60,
              "distanceKm": 10,
              "travelMinutes": 15,
              "useHighway": false,
              "parkingInfo": "周辺に駐車場あり",
              "description": "このエリアで和食のお店をGoogle Mapsで検索してお選びください",
              "dogWalkStop": false
            },
            {
              "name": "到着地",
              "lat": 35.456,
              "lng": 139.789,
              "address": "到着地の住所",
              "type": "arrival",
              "arrivalTime": "20:00",
              "departureTime": "20:00",
              "stayMinutes": 0,
              "distanceKm": 30,
              "travelMinutes": 40,
              "useHighway": false,
              "parkingInfo": "",
              "description": "",
              "dogWalkStop": false
            }
          ],
          "lunchSpot": {
            "name": "○○エリア（蕎麦）",
            "description": "○○周辺には蕎麦のお店が多数あります",
            "nearSpot": "○○（目的地名）から車で約10分",
            "alternatives": []
          },
          "dinnerSpot": {
            "name": "○○エリア（和食）",
            "description": "○○周辺には和食のお店が多数あります",
            "nearSpot": "○○（目的地名）から車で約15分",
            "alternatives": []
          }
        }
      ],
      "commentary": {
        "removedSpots": [],
        "highlights": ["プランの見どころ1", "プランの見どころ2"],
        "tips": ["旅行のアドバイス1"],
        "dogTips": ["犬連れアドバイス（犬連れ時のみ）"],
        "overallDescription": "プラン全体の概要（100文字程度）"
      }
    },
    {
      "planName": "プランB: 穴場プラン",
      "planDescription": "プランBの概要と特徴",
      "days": [{"dayIndex": 0, "items": [...], "lunchSpot": {...}, "dinnerSpot": {...}}],
      "commentary": {"removedSpots": [], "highlights": [...], "tips": [...], "overallDescription": "..."}
    }
  ]
}

**絶対に守るべきルール:**
- 最外層は必ず { "plans": [...] } にすること。days配列を直接返さないこと
- plans配列には必ず2つのプランを含めること（プランAとプランB）
- **犬連れ旅行ではない場合（withDog=false）: dogWalkStop は必ず false にすること。犬の散歩休憩をプランに含めないこと**
- itemsのtypeは "departure" / "destination" / "lunch" / "dinner" / "reststop" / "arrival" のいずれかにすること。SA・PA・道の駅などに休憩（トイレ・運転の休憩・犬の散歩）のために立ち寄る地点は type="reststop" とすること。観光や買い物そのものが目的のスポット（大型の道の駅を含む）は "destination" とすること
- 【最初に行く】と指定された目的地がある場合、その目的地を最初に訪れること。ただしPAなどの休憩が必要な場合は休憩後に向かうこと。
- 昼食ジャンルが指定されている場合、itemsの中にtype="lunch"のアイテムを**必ず追加**すること（省略禁止）
- 夕食ジャンルが指定されている場合、itemsの中にtype="dinner"のアイテムを**必ず追加**すること（省略禁止）
- 【この場所で昼食】【この場所で夕食】が指定された目的地は、到着時刻が想定の食事時間帯からずれてもtype="lunch"/"dinner"のままにし、プランA・プランBの両方で同じ扱いにすること（ルール15）
- ルート順序がジグザグ（遠方へ行った後に別方向へ大きく迂回し、それから出発地寄りの場所へ戻る）にならないこと（ルール6）
- 食事アイテムにはlat, lng, addressを必ず含めること
- 緯度経度は正確な値を使用してください。日本国内の実在する場所のみを提案してください
- 2つのプランは必ず異なる内容にしてください（同じプランの重複は不可）
- 各プランのplanNameとplanDescriptionは必須です${mustIncludeBlock}`;
}
