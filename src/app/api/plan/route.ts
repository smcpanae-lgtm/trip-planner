import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash, randomUUID } from "crypto";

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
  | "ok";

const MAX_DAYS = 5;
const MAX_DESTINATIONS_PER_DAY = 8;
const MAX_TOTAL_TEXT_LENGTH = 8000;
const MAX_OUTPUT_TOKENS = 8192;
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

function planJsonError(message: string, status: number, errorType: PlanAuditError) {
  return NextResponse.json({ error: message, errorType }, { status });
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

const MODEL_NAMES = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

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

/** 全角英数字・ハイフンのゆれ・空白・「〒」「日本、」を吸収して比較用に正規化する */
function normalizeForMatch(value: string): string {
  return value
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[‐‑‒–—―ー−ｰ－]/g, "-")
    .replace(/[〒\s、,。．・]/g, "")
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

/** 各プランについて、抜けているユーザー指定目的地の警告文を返す */
function findMissingDestinationWarnings(body: PlanRequest, parsed: unknown): string[] {
  const plansValue = (parsed as { plans?: unknown })?.plans;
  const plans: unknown[] = Array.isArray(plansValue) ? plansValue : [parsed];
  const warnings: string[] = [];

  plans.forEach((plan, planIdx) => {
    const items = collectPlanItems(plan);
    // 想定外の形（items無し）の場合は判定できないので警告しない
    if (items.length === 0) return;
    const planName =
      typeof (plan as { planName?: unknown })?.planName === "string"
        ? ((plan as { planName: string }).planName)
        : planIdx === 0
          ? "プランA"
          : "プランB";

    for (const day of body.days) {
      for (const dest of day.destinations) {
        if (dest.isOmakase || !dest.name?.trim()) continue;
        if (!planIncludesDestination(dest, items)) {
          warnings.push(`${planName}に「${dest.name.trim()}」が含まれていません`);
        }
      }
    }
  });

  return warnings;
}

function buildCorrectionPrompt(basePrompt: string, warnings: string[]): string {
  return `${basePrompt}

# 【再生成の指示・最優先】
直前の出力では、ユーザーが指定した目的地が次のとおり抜けていました。

${warnings.map((w) => `- ${w}`).join("\n")}

今回は上記の目的地を必ず該当プランのitemsに含めてください。
時間が足りない場合は、AIが追加した観光スポットや休憩スポットのほうを削って調整すること。
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
    let lastError: unknown;
    const modelErrors: string[] = [];

    // Diagnostic: log key info for debugging
    console.log(`[DIAG] API keys: ${apiKeys.length} (${apiKeys.map(k => k.tier).join(" → ")})`);
    apiKeys.forEach((k, i) => {
      const last4 = k.key.slice(-4);
      console.log(`[DIAG] key${i + 1} [${k.tier}]: ...${last4}`);
    });
    console.log(`[DIAG] Models: ${MODEL_NAMES.join(", ")}`);

    // Outer loop: FREE key first → PAID key fallback (seamless to user)
    keyLoop: for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const { key: apiKey, tier } = apiKeys[keyIdx];
      const genAI = new GoogleGenerativeAI(apiKey);
      const keyLabel = `key${keyIdx + 1}[${tier}]`;

      // Inner loop: try each model with this key
      for (const modelName of MODEL_NAMES) {
        let retries = 0;
        const maxRetries = 1;
        while (retries <= maxRetries) {
          try {
            console.log(`[${keyLabel}] Trying model: ${modelName}${retries > 0 ? ` (retry ${retries})` : ""}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                responseMimeType: "application/json",
              },
            });

            const responseText = result.response.text();
            let plan = parsePlanJson(responseText);

            // ユーザー指定の目的地が抜けていたら、指摘を添えて1回だけ作り直す
            let warnings = findMissingDestinationWarnings(body, plan);
            if (warnings.length > 0) {
              console.warn(`[${keyLabel}/${modelName}] 指定目的地の欠落を検出: ${warnings.join(" / ")} — 1回だけ再生成します`);
              try {
                const retryResult = await model.generateContent({
                  contents: [{ role: "user", parts: [{ text: buildCorrectionPrompt(prompt, warnings) }] }],
                  generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                    responseMimeType: "application/json",
                  },
                });
                const retryPlan = parsePlanJson(retryResult.response.text());
                const retryWarnings = findMissingDestinationWarnings(body, retryPlan);
                // 改善した場合のみ採用する（悪化した再生成結果は使わない）
                if (retryWarnings.length < warnings.length) {
                  plan = retryPlan;
                  warnings = retryWarnings;
                }
              } catch (retryError) {
                const retryMessage = retryError instanceof Error ? retryError.message : String(retryError);
                console.warn(`[${keyLabel}/${modelName}] 再生成に失敗: ${retryMessage.substring(0, 200)}`);
              }
            }

            console.log(`[${keyLabel}] Success with model: ${modelName}`);
            const usage = (result.response as unknown as {
              usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
            }).usageMetadata;
            auditPlanLog({
              requestId,
              ipHash,
              userAgent,
              sessionId,
              errorType: "ok",
              inputTokens: usage?.promptTokenCount,
              outputTokens: usage?.candidatesTokenCount,
              totalTokens: usage?.totalTokenCount,
            });
            return NextResponse.json(
              warnings.length > 0
                ? { ...(plan as Record<string, unknown>), warnings }
                : plan
            );
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            const is503 = errMsg.includes("503") || errMsg.includes("Service Unavailable");
            const is404 = errMsg.includes("404") || errMsg.includes("NOT_FOUND") || errMsg.includes("not found");
            const is403 = errMsg.includes("403") || errMsg.includes("PERMISSION_DENIED") || errMsg.includes("API_KEY_INVALID");
            const is429 = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");

            // Log full error for diagnosis
            console.error(`[${keyLabel}/${modelName}] FULL ERROR: ${errMsg.substring(0, 500)}`);
            modelErrors.push(`[${keyLabel}/${modelName}] ${errMsg.substring(0, 150)}`);

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
              lastError = err;
              break;
            }
            if (is403) {
              // Auth/key error → switch key immediately
              console.warn(`[${keyLabel}] ${modelName} 403 auth — switching to next key`);
              lastError = err;
              continue keyLoop;
            }
            if (is503) {
              // Server error after retry → try next model on same key first
              console.warn(`[${keyLabel}] ${modelName} 503 after retry — trying next model`);
              lastError = err;
              break;
            }
            if (is404) {
              console.warn(`[${keyLabel}] ${modelName} 404, trying next model`);
            } else {
              console.warn(`[${keyLabel}] ${modelName} failed:`, errMsg.substring(0, 200));
            }
            lastError = err;
            break;
          }
        }
      }
    }

    // All models failed — return detailed error for diagnosis
    console.error("All Gemini models failed. Errors:", modelErrors);
    const diagMessage = modelErrors.length > 0
      ? `[診断] ${modelErrors.join(" / ")}`
      : "AI plan generation failed";
    const lastErrMessage = lastError instanceof Error ? lastError.message : "AI plan generation failed";

    // Check error type for user-friendly message
    const is403 = lastErrMessage.includes("403") || lastErrMessage.includes("PERMISSION_DENIED") || lastErrMessage.includes("API_KEY_INVALID");
    const is429 = lastErrMessage.includes("429") || lastErrMessage.includes("RESOURCE_EXHAUSTED");
    const is404 = lastErrMessage.includes("404") || lastErrMessage.includes("NOT_FOUND");

    let userMessage: string;
    if (is403) {
      userMessage = `APIキーエラー（403）: Gemini APIキーが無効です。管理者にお問い合わせください。[詳細: ${lastErrMessage.substring(0, 150)}]`;
    } else if (is429) {
      userMessage = `利用制限（429）: 現在アクセスが集中しています。しばらく時間をおいてから再度お試しください。`;
    } else if (is404) {
      userMessage = `モデルエラー（404）: 指定したAIモデルが見つかりません。[詳細: ${lastErrMessage.substring(0, 150)}]`;
    } else {
      userMessage = `AIサーバーエラー: ${lastErrMessage.substring(0, 200)}`;
    }

    console.error("Diagnosis:", diagMessage);
    auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "gemini_error" });
    return NextResponse.json({ error: userMessage }, { status: 500 });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const message =
      error instanceof Error ? error.message : "AI plan generation failed";
    auditPlanLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_input" });
    return NextResponse.json({ error: message }, { status: 400 });
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
- **【最重要】以下のユーザー指定目的地は、プランA・プランBの両方のitemsに必ず1回ずつ含めること。省略・統合・別スポットへの置き換えはすべて禁止。時間が足りない場合は他の（AIが追加した）スポットのほうを削ること:**
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
- **【特定施設の重要情報・誤情報に注意】**:
  - **群馬サファリパーク**: 「犬を車内に入れたままサファリゾーンを走行できる」という情報は**誤りです**。群馬サファリパークは犬を車内に乗せたままでの入場は一切できません。ペットを連れた場合は、必ず施設のペット預かりサービスに預けてから入場する必要があります（ペット預かりサービスの事前予約・確認が必須）。descriptionとtipsに「⚠️ 群馬サファリパークは犬を車に乗せたままでの入場はできません。施設のペット預かりサービスに預けてからご入場ください。事前に施設へご確認・ご予約ください」と必ず明記すること
- **犬が入場できない可能性がある施設**（神社仏閣の境内、一部テーマパーク等）がユーザー指定の目的地に含まれる場合:
  - **プランA・プランBともに、ユーザー指定の目的地は絶対にルートから除外しないこと。必ず両プランに含めること。**
  - 理由: 施設内に犬が入れなくても、周辺の散歩・外観見学・駐車場での休憩など部分的に楽しめる場合があるため
  - プランA・プランBともに: descriptionに「⚠️ 施設内はペット入場不可の場合があります。周辺の散歩や外観見学は可能なことが多いですが、事前に施設へご確認ください。入場できない場合は車内待機または近隣のペット預かり施設をご利用ください」と明記する
  - プランBでは追加で: 同じ目的地を含めた上で、近隣に犬同伴可能なスポット（ドッグラン・ペットOK公園・テラス席OKカフェ・店内ペットOKカフェ等）があればルートに**追加**して提案する（代替ではなく追加）
  - tipsに犬が入場不可の可能性がある施設についての注意事項と対策を含める
  - removedSpotsにユーザー指定の目的地を記載することは禁止`
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
「目的地以外はお任せ」がONになっています。**プランA・プランBともに、ユーザー指定の目的地をすべて含めた上で、出発〜到着の空き時間を活用してAIがおすすめ観光スポットを追加してください。**
2プランは追加するおすすめスポットのテーマを変えて差別化してください：
- **プランA「定番プラン」**: ユーザー指定の目的地 + 定番・王道の観光スポットをAIが追加
- **プランB「穴場プラン」**: ユーザー指定の目的地 + 穴場・体験型・ユニークなスポットをAIが追加
**重要:**
- 両プランとも、出発〜到着の時間に余裕がある限り積極的にスポットを追加すること
- PAのみで終わらせず、観光地・道の駅・景勝地など魅力的なスポットを必ず追加すること
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
1. 出発時間と到着希望時間の間で必ず収まるプランにすること
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
5. **ユーザーが指定した目的地は絶対に削除しないこと**。時間が厳しい場合は以下の対応をすること：
   - 到着希望時間を超えてもプランに含め、tipsで「到着時間が○○時に遅れる見込みです」と注記する
   - 途中にSA/PA・道の駅での休憩を挟み、長距離移動でも実現可能なプランにする
   - 滞在時間を短縮（最低30分）して対応する
   - それでも物理的に不可能な場合のみ、removedSpotsに理由を記載し、代わりに近隣の同ジャンルのスポットをプランに含めること
6. ルート最適化:
   - 帰りのドライブが楽になるよう、可能な限り遠い目的地から先に訪問し、帰りながら近い目的地を回るルートにすること（アウトアンドバック方式）
   - ただし最初に行く目的地が指定されている場合はその制約を優先すること
   - 効率的なルート順序に最適化すること（往復の総距離を最小化）
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
   - 終着地には希望到着時刻ちょうど（または少し前）に到着するようスケジュールを組むこと
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
   - **到着時間が17:00以降になる有料観光施設（寺社・博物館・城等）は原則スケジュールから除外し、代わりに夜間でも楽しめるスポット（夜景・ライトアップ・温泉街の散策・飲食エリア等）を提案すること**
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
- 【最初に行く】と指定された目的地がある場合、その目的地を最初に訪れること。ただしPAなどの休憩が必要な場合は休憩後に向かうこと。
- 昼食ジャンルが指定されている場合、itemsの中にtype="lunch"のアイテムを**必ず追加**すること（省略禁止）
- 夕食ジャンルが指定されている場合、itemsの中にtype="dinner"のアイテムを**必ず追加**すること（省略禁止）
- 食事アイテムにはlat, lng, addressを必ず含めること
- 緯度経度は正確な値を使用してください。日本国内の実在する場所のみを提案してください
- 2つのプランは必ず異なる内容にしてください（同じプランの重複は不可）
- 各プランのplanNameとplanDescriptionは必須です${mustIncludeBlock}`;
}
