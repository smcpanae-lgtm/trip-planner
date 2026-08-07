import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

export const runtime = "nodejs";

type ShioriTone = "warm" | "simple" | "diary" | "guide";
type OutputLanguage = "ja" | "en" | "zh-CN" | "fr" | "ko" | "zh-TW" | "de";
type AuditError =
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
  | "gemini_attempt_failed"
  | "gemini_error"
  | "ok";

/**
 * 画面に出すエラー文言の識別子。クライアントがこれを見て出力言語の文面に差し替える。
 *
 * 監査ログの AuditError とは別物。AuditError は集計のための分類で、bad_input は
 * 「記録なし」「件数超過」「画像混入」「長すぎ」「例外時の総括」の5つの文面を共有している。
 * AuditError を細分化すると既存のログ集計が変わってしまうため、表示用は別フィールドにする。
 * 対応は多対一（複数の ErrorCode が同じ AuditError を指す）。
 *
 * レスポンスの error（日本語の文面）は従来どおり返す。クライアントを介さない呼び出しで
 * 文面が空にならないようにするためで、クライアントが対応していないコードを受け取ったときも
 * この文面をそのまま表示する。
 */
type ErrorCode =
  | "method_not_allowed"
  | "bad_origin"
  | "no_entries"
  | "too_many_entries"
  | "images_not_allowed"
  | "input_too_long"
  | "bad_request"
  | "turnstile_failed"
  | "rate_limit_minute"
  | "rate_limit_day"
  | "rate_limit_session_day"
  | "concurrent"
  | "duplicate";

interface ShioriSpotInput {
  id: string;
  date: string;
  place: string;
  category: string;
  memo?: string;
  prefecture?: string;
}

interface ShioriRequest {
  title: string;
  traveler?: string;
  tone: ShioriTone;
  language?: OutputLanguage;
  turnstileToken?: string;
  sessionId?: string;
  spots: ShioriSpotInput[];
}

interface GeneratedSpot {
  id: string;
  title: string;
  caption: string;
}

interface ShioriResponse {
  summary: string;
  spots: GeneratedSpot[];
}

const MODEL_NAMES = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const OUTPUT_LANGUAGES: OutputLanguage[] = ["ja", "en", "zh-CN", "fr", "ko", "zh-TW", "de"];
const MAX_SPOTS = 20;

/**
 * 出力トークン上限は記録数から算出する。
 *
 * Gemini の実トークナイザで、このプロンプトが指示している長さ（caption 80〜140字、
 * summary 120〜220字）の返却JSONを整形出力で数えると、20件で日本語 2278 / 英語 2481
 * トークンになる。以前の固定値 700 では 6件目あたりから途中で切れ、不完全なJSONが
 * JSON.parse に落ちてフォールバック文へ落ちていた。
 *
 * 1件あたり 160 は上記の実測（1件あたり最大 118 トークン）に約 1.35 倍の余裕を見た値。
 * 上限 3600 は MAX_SPOTS = 20 のときの算出値と一致するため通常は効かず、
 * MAX_SPOTS を増やしたときの歯止めとして残している。
 */
const OUTPUT_TOKENS_BASE = 400;
const OUTPUT_TOKENS_PER_SPOT = 160;
const OUTPUT_TOKENS_MIN = 900;
const OUTPUT_TOKENS_MAX = 3600;

const MAX_TOTAL_TEXT_LENGTH = 6000;
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const ipMinuteHits = new Map<string, number[]>();
const ipDayHits = new Map<string, number[]>();
const sessionDayHits = new Map<string, number[]>();
const activeIpRuns = new Map<string, number>();
const recentContent = new Map<string, number>();

function getApiKeys(): string[] {
  const candidates = process.env.GEMINI_API_KEY_FREE
    ? [process.env.GEMINI_API_KEY_FREE]
    : [process.env.GEMINI_API_KEY];
  return [...new Set(candidates.filter((key): key is string => Boolean(key && key.length > 10)))];
}

function jsonError(message: string, status: number, errorType: AuditError, errorCode: ErrorCode) {
  return NextResponse.json({ error: message, errorType, errorCode }, { status });
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

function checkRateLimit(ipHash: string, sessionId: string) {
  const now = Date.now();
  if (pruneHits(ipMinuteHits, ipHash, MINUTE_MS, now).length >= 1) {
    return { ok: false, status: 429, errorType: "rate_limit_ip_minute" as const, errorCode: "rate_limit_minute" as const, message: "短時間に複数回のAI生成が行われました。1分ほど待ってから再度お試しください。" };
  }
  if (pruneHits(ipDayHits, ipHash, DAY_MS, now).length >= 20) {
    return { ok: false, status: 429, errorType: "rate_limit_ip_day" as const, errorCode: "rate_limit_day" as const, message: "本日のAI生成回数が上限に達しました。明日以降に再度お試しください。" };
  }
  if (pruneHits(sessionDayHits, sessionId, DAY_MS, now).length >= 10) {
    return { ok: false, status: 429, errorType: "rate_limit_session_day" as const, errorCode: "rate_limit_session_day" as const, message: "このブラウザでの本日のAI生成回数が上限に達しました。明日以降に再度お試しください。" };
  }
  if ((activeIpRuns.get(ipHash) || 0) >= 1) {
    return { ok: false, status: 429, errorType: "concurrent_ip" as const, errorCode: "concurrent" as const, message: "同じ回線からAI生成が実行中です。完了してから再度お試しください。" };
  }
  return { ok: true as const };
}

function recordAcceptedRequest(ipHash: string, sessionId: string) {
  const now = Date.now();
  ipMinuteHits.set(ipHash, [...(ipMinuteHits.get(ipHash) || []), now]);
  ipDayHits.set(ipHash, [...(ipDayHits.get(ipHash) || []), now]);
  sessionDayHits.set(sessionId, [...(sessionDayHits.get(sessionId) || []), now]);
  activeIpRuns.set(ipHash, (activeIpRuns.get(ipHash) || 0) + 1);
}

function releaseIp(ipHash: string) {
  const next = Math.max(0, (activeIpRuns.get(ipHash) || 0) - 1);
  if (next === 0) activeIpRuns.delete(ipHash);
  else activeIpRuns.set(ipHash, next);
}

function maxOutputTokensFor(spotCount: number): number {
  const needed = OUTPUT_TOKENS_BASE + OUTPUT_TOKENS_PER_SPOT * spotCount;
  return Math.min(OUTPUT_TOKENS_MAX, Math.max(OUTPUT_TOKENS_MIN, needed));
}

/**
 * 思考トークンは maxOutputTokens を消費するため、本文用の枠を確定させる目的で無効化する。
 * この処理は固定スキーマへの書き換えで多段推論を必要とせず、思考を切ってもJSONの質は落ちない。
 *
 * thinkingConfig はこのSDK（@google/generative-ai）の GenerationConfig 型には無いが、
 * リクエストは JSON.stringify でそのまま送られるためAPIには届く。万一APIが受理しない場合に
 * 備えて、呼び出し側は同じモデルを thinkingConfig 無しでもう一度試す。
 */
function buildGenerationConfig(maxOutputTokens: number, disableThinking: boolean): GenerationConfig {
  const base: GenerationConfig = {
    temperature: 0.65,
    maxOutputTokens,
    responseMimeType: "application/json",
  };
  if (!disableThinking) return base;
  return { ...base, thinkingConfig: { thinkingBudget: 0 } } as GenerationConfig;
}

function isOutputLanguage(value: unknown): value is OutputLanguage {
  return typeof value === "string" && (OUTPUT_LANGUAGES as string[]).includes(value);
}

function validateAndNormalizeBody(body: ShioriRequest) {
  if (!body || !Array.isArray(body.spots) || body.spots.length === 0) {
    return { ok: false as const, errorCode: "no_entries" as const, message: "旅行記に使う記録がありません。" };
  }
  if (body.spots.length > MAX_SPOTS) {
    return { ok: false as const, errorCode: "too_many_entries" as const, message: `一度にAI生成できる記録は${MAX_SPOTS}件までです。範囲を絞ってからお試しください。` };
  }
  if (Array.isArray((body as unknown as { images?: unknown[] }).images) && (body as unknown as { images: unknown[] }).images.length > 0) {
    return { ok: false as const, errorCode: "images_not_allowed" as const, message: "写真データはAI生成APIへ送信できません。場所・日付・メモだけで作成してください。" };
  }

  const safeBody: ShioriRequest = {
    title: String(body.title || "").slice(0, 80),
    traveler: String(body.traveler || "").slice(0, 40),
    tone: ["warm", "simple", "diary", "guide"].includes(body.tone) ? body.tone : "warm",
    language: isOutputLanguage(body.language) ? body.language : "ja",
    turnstileToken: typeof body.turnstileToken === "string" ? body.turnstileToken : undefined,
    sessionId: typeof body.sessionId === "string" && body.sessionId.length <= 80 ? body.sessionId : undefined,
    spots: body.spots.map((spot) => ({
      id: String(spot.id).slice(0, 80),
      date: String(spot.date || "").slice(0, 20),
      place: String(spot.place || "場所未設定").slice(0, 80),
      category: String(spot.category || "").slice(0, 40),
      memo: spot.memo ? String(spot.memo).slice(0, 240) : undefined,
      prefecture: spot.prefecture ? String(spot.prefecture).slice(0, 40) : undefined,
    })),
  };

  const totalTextLength = JSON.stringify({
    title: safeBody.title,
    traveler: safeBody.traveler,
    spots: safeBody.spots,
  }).length;
  if (totalTextLength > MAX_TOTAL_TEXT_LENGTH) {
    return { ok: false as const, errorCode: "input_too_long" as const, message: "入力内容が長すぎます。記録数やメモを短くしてからお試しください。" };
  }
  return { ok: true as const, value: safeBody };
}

function contentHash(body: ShioriRequest): string {
  return createHash("sha256")
    .update(JSON.stringify({
      title: body.title,
      traveler: body.traveler,
      tone: body.tone,
      language: body.language,
      spots: body.spots.map((spot) => ({
        date: spot.date,
        place: spot.place,
        category: spot.category,
        memo: spot.memo || "",
        prefecture: spot.prefecture || "",
      })),
    }))
    .digest("hex");
}

function checkDuplicate(hash: string): boolean {
  const now = Date.now();
  for (const [key, timestamp] of recentContent) {
    if (now - timestamp >= DUPLICATE_WINDOW_MS) recentContent.delete(key);
  }
  const previous = recentContent.get(hash);
  if (previous && now - previous < DUPLICATE_WINDOW_MS) return false;
  recentContent.set(hash, now);
  return true;
}

function outputLanguageName(language: OutputLanguage): string {
  switch (language) {
    case "en":
      return "English";
    case "zh-CN":
      return "Simplified Chinese";
    case "fr":
      return "French";
    case "ko":
      return "Korean";
    case "zh-TW":
      return "Traditional Chinese used in Taiwan";
    case "de":
      return "German";
    case "ja":
    default:
      return "日本語";
  }
}

/**
 * 文体の指示は出力言語で書く。
 *
 * 日本語で「日記のようにあたたかく」と指示しても、英語やフランス語で書かせるときは
 * その語感が伝わらない。指示そのものを出力言語で与えれば、書かせたい語り口を
 * 指示文の書きぶりが同時に示すことになる。
 *
 * 文言は画面の文体選択肢（ShioriClient の toneWarm / toneSimple / toneDiary / toneGuide）に
 * そろえてある。利用者が選んだ選択肢の説明と、AIへの指示がずれないようにするため。
 * 日本語の4つは従来の toneLabel と同一の文字列で、日本語出力のプロンプトは変わらない。
 */
const TONE_LABELS: Record<OutputLanguage, Record<ShioriTone, string>> = {
  ja: {
    warm: "記録者の視点で、やさしく思い出を振り返る文",
    simple: "一人称で、短く素直な記録文",
    diary: "日記のようにあたたかく、記録者の余韻が残る文",
    guide: "記録者の体験を中心に、場所の魅力も少し添える文",
  },
  en: {
    warm: "First person, looking back gently on the writer's own memories",
    simple: "First person, short and plain, staying with what actually happened",
    diary: "First person, like a diary entry, warm, leaving a feeling that lingers",
    guide: "Centered on what the writer experienced, with a little of what makes the place worth seeing",
  },
  "zh-CN": {
    warm: "以第一人称，温柔地回顾自己的记忆",
    simple: "以第一人称，简短朴实地记录当时的事",
    diary: "像日记一样，以第一人称写，留下当时的余韵",
    guide: "以自己的体验为主，略微提及地点的魅力",
  },
  fr: {
    warm: "À la première personne, un retour tout en douceur sur ses propres souvenirs",
    simple: "À la première personne, un texte court et simple qui s'en tient aux faits",
    diary: "À la première personne, comme une page de journal, chaleureuse et qui laisse une résonance",
    guide: "Centré sur ce que l'auteur a vécu, avec un aperçu de ce qui fait le charme du lieu",
  },
  ko: {
    warm: "1인칭으로, 자신의 기억을 부드럽게 되돌아보는 글",
    simple: "1인칭으로, 짧고 담백하게 그때 있었던 일을 적는 글",
    diary: "일기처럼 1인칭으로, 그때의 여운이 남는 글",
    guide: "자신의 체험을 중심으로, 장소의 매력도 조금 곁들인 글",
  },
  "zh-TW": {
    warm: "以第一人稱，溫柔地回顧自己的記憶",
    simple: "以第一人稱，簡短樸實地記錄當時的事",
    diary: "像日記一樣，以第一人稱寫，留下當時的餘韻",
    guide: "以自己的體驗為主，略微提及地點的魅力",
  },
  de: {
    warm: "In der ersten Person, ein sanfter Rückblick auf die eigenen Erinnerungen",
    simple: "In der ersten Person, kurz und schlicht, nah an dem, was tatsächlich geschehen ist",
    diary: "In der ersten Person, wie ein Tagebucheintrag, warm und mit einem Nachklang",
    guide: "Auf das eigene Erleben gestützt, mit einem Hinweis auf den Reiz des Ortes",
  },
};

function toneLabel(tone: ShioriTone, language: OutputLanguage): string {
  const labels = TONE_LABELS[language] || TONE_LABELS.ja;
  return labels[tone] || labels.warm;
}

/**
 * 固有名詞と文体の追加制約。出力言語がCJK以外のときだけプロンプトに足す。
 *
 * 固有名詞: 実機の英語出力で「城前橋」が "the castle bridge" と意味で訳された。
 * 読みをローマ字にしたうえで、初出だけ括弧で原語を併記させる。誤ったローマ字は
 * 読めても検索できないが、括弧の原語表記があれば地図アプリで辿り着けるため。
 *
 * 文体: 同じ出力に "a lovely, unhurried time" のような、誰が書いても同じになる
 * 評価語が並んでいた。形容詞で言い切らせず、行動と観察で書かせる。
 *
 * 日本語・中国語では原語の表記をそのまま使えるため、韓国語は音写であって意味訳に
 * ならないため、いずれもこのブロックは渡さない（プロンプトは従来と完全に同一になる）。
 */
const CJK_LANGUAGES: OutputLanguage[] = ["ja", "zh-CN", "zh-TW", "ko"];

function extraLanguageConstraints(language: OutputLanguage): string {
  if (CJK_LANGUAGES.includes(language)) return "";
  return `- 地名・施設名・橋や川の名称などの固有名詞は、意味で訳さずに読みをそのまま出力言語の文字（英語ならローマ字）で表記する
- 元の名称がラテン文字以外で書かれている場合のみ、その名称が最初に出てくるときだけ括弧で原語表記を添える（例: Shiromae Bridge (城前橋)、Yanase River (柳瀬川)）
- 同じ名称が二度目以降に出てくるときは括弧を付けない
- 元の名称がすでにラテン文字の場合は括弧を付けない
- 「川」「橋」「公園」「駅」など種別を表す部分だけは、必要に応じて出力言語の一般名詞に置き換えてよい
- lovely / wonderful / pleasant / tranquil / truly worthwhile のような、評価を述べるだけの形容詞に頼らない（出力言語が英語以外の場合も、その言語で同じ働きをする語に頼らない）
- 感想は形容詞で言い切らず、その場でしたこと・見えたもの・気づいたことで示す
- 元メモに書かれた事実を手がかりにして、その場の実感が伝わる書き方にする
`;
}

function fallbackResponse(body: ShioriRequest): ShioriResponse {
  const places = body.spots.map((spot) => spot.place).filter(Boolean);
  const range = body.spots.length > 0 ? body.spots[0].date : "旅";
  return {
    summary: `${body.title || range}は、${places.slice(0, 3).join("、") || "思い出の場所"}をめぐった旅行記です。写真と元メモをたどりながら、そのとき感じたことや旅の流れをあとから思い出せるように残します。`,
    spots: body.spots.map((spot) => ({
      id: spot.id,
      title: spot.place || spot.category || "思い出の場所",
      caption: spot.memo ? `${spot.date}、${spot.place}で過ごした時間。${spot.memo}` : `${spot.date}、${spot.place}で過ごした時間を、写真と一緒に残しておきます。`,
    })),
  };
}

function buildPrompt(body: ShioriRequest): string {
  const language = body.language || "ja";
  const outputLanguage = outputLanguageName(language);
  const extraConstraints = extraLanguageConstraints(language);
  const spots = body.spots
    .map((spot, index) =>
      [
        `${index + 1}.`,
        `日付: ${spot.date}`,
        `場所: ${spot.place}`,
        `地域: ${spot.prefecture || "未設定"}`,
        `タグ: ${spot.category}`,
        `元メモ: ${spot.memo || "なし"}`,
      ].join("\n")
    )
    .join("\n\n");

  return `あなたは旅行記の聞き書き編集者です。写真そのものは見ていません。以下の地名・日付・元メモだけを使って、記録者があとから読み返したくなる旅行記を${outputLanguage}で作ってください。

重要な制約:
- 出力文のsummary、title、captionは必ず${outputLanguage}で書く
- 写真を見たかのような断定はしない
- 事実にない施設情報、営業時間、歴史情報、店名を作らない
- ユーザーの元メモにない感情や出来事を過度に創作しない
- できるだけ「私は」「私たちは」など記録者の視点で書く
- 外から紹介する観光案内ではなく、旅を振り返るナラティブな文章にする
- 各スポットのcaptionは80〜140文字程度
- summaryは120〜220文字程度
- spotのidは素材の番号（1〜${body.spots.length}）を整数でそのまま返す
${extraConstraints}- 必ずJSONだけを返す

旅行記タイトル: ${body.title || "未設定"}
旅行者名: ${body.traveler || "未設定"}
文体: ${toneLabel(body.tone, language)}

素材:
${spots}

返却JSON形式:
{
  "summary": "記録者の視点で旅全体を振り返る文章",
  "spots": [
    { "id": 1, "title": "短い見出し", "caption": "その場所での記憶を一人称で振り返る文章" }
  ]
}`;
}

/**
 * AIが返した id を素材の番号として解釈する。
 *
 * 数値・数字だけの文字列（"1" / "01"）のどちらでも受ける。
 * 番号ではなく入力の id をそのまま返してきた場合の保険として indexById も引く。
 * 解釈できない値は null を返し、呼び出し側で無視する。
 */
function resolveSpotIndex(value: unknown, indexById: Map<string, number>): number | null {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const byId = indexById.get(trimmed);
  if (byId !== undefined) return byId;
  return /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null;
}

/**
 * AIの返却を入力の並びへ戻す。
 *
 * id は素材の通し番号（1 始まり）で返させている。写真入口の id は `photo-<uuid>` で、
 * Gemini のトークナイザではUUIDが1件36トークンになるため、そのまま往復させると
 * 20件で 725 トークン——出力枠の大半——を id だけが占めてしまうため。
 *
 * 番号の異常はすべてここで吸収する。
 * - 範囲外・非整数・id欠損 … その要素を無視する
 * - 同じ番号の重複      … 最初の1件を採用する
 * - 番号の欠落          … その記録だけAIなしのテンプレート文で埋める（他の記録の生成文は残す）
 *
 * 返却する id は必ず入力の id に戻すため、クライアントから見た形式は変わらない。
 */
function normalizeResponse(parsed: unknown, body: ShioriRequest): ShioriResponse {
  const fallback = fallbackResponse(body);
  if (!parsed || typeof parsed !== "object") return fallback;
  const record = parsed as Record<string, unknown>;
  const rawSpots = Array.isArray(record.spots) ? record.spots : [];

  const indexById = new Map(body.spots.map((spot, index) => [spot.id, index + 1]));
  const byIndex = new Map<number, { title: string; caption: string }>();
  for (const item of rawSpots) {
    if (!item || typeof item !== "object") continue;
    const spot = item as Record<string, unknown>;
    const index = resolveSpotIndex(spot.id, indexById);
    if (index === null || index < 1 || index > body.spots.length) continue;
    if (byIndex.has(index)) continue;
    byIndex.set(index, {
      title: typeof spot.title === "string" ? spot.title.trim() : "",
      caption: typeof spot.caption === "string" ? spot.caption.trim() : "",
    });
  }

  return {
    summary: typeof record.summary === "string" && record.summary.trim() ? record.summary.trim() : fallback.summary,
    spots: body.spots.map((input, index): GeneratedSpot => {
      const template = fallback.spots[index];
      const generated = byIndex.get(index + 1);
      return {
        id: input.id,
        title: generated?.title || template.title,
        caption: generated?.caption || template.caption,
      };
    }),
  };
}

interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

function auditLog(data: {
  requestId: string;
  ipHash: string;
  userAgent: string;
  sessionId: string;
  errorType: AuditError;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  // 以下は生成の試行ごとの内訳。打ち切り（finishReason: MAX_TOKENS）を
  // 通常のAPIエラーと区別するために、成功時だけでなく失敗時にも残す。
  model?: string;
  spotCount?: number;
  maxOutputTokens?: number;
  thinkingDisabled?: boolean;
  finishReason?: string;
  reason?: string;
}) {
  console.log(JSON.stringify({ type: "shiori_generate_audit", at: new Date().toISOString(), ...data }));
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = getIp(request);
  const ipHash = hashValue(ip);
  const userAgent = request.headers.get("user-agent") || "";
  let sessionId = "unknown";
  let accepted = false;

  try {
    if (!verifyOrigin(request)) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_origin" });
      return jsonError("このサイト以外からのAI生成リクエストは受け付けていません。", 403, "bad_origin", "bad_origin");
    }

    const normalized = validateAndNormalizeBody((await request.json()) as ShioriRequest);
    if (!normalized.ok) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_input" });
      return jsonError(normalized.message, 400, "bad_input", normalized.errorCode);
    }
    const safeBody = normalized.value;
    sessionId = safeBody.sessionId || request.headers.get("x-shiori-session-id") || "unknown";

    if (!(await verifyTurnstile(safeBody.turnstileToken, ip))) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_turnstile" });
      return jsonError("認証確認に失敗しました。画面を更新してからもう一度お試しください。", 403, "bad_turnstile", "turnstile_failed");
    }

    const rateLimit = checkRateLimit(ipHash, sessionId);
    if (!rateLimit.ok) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: rateLimit.errorType });
      return jsonError(rateLimit.message, rateLimit.status, rateLimit.errorType, rateLimit.errorCode);
    }

    if (!checkDuplicate(`${ipHash}:${sessionId}:${contentHash(safeBody)}`)) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "duplicate" });
      return jsonError("同じ内容のAI生成が短時間に送信されています。少し時間を置いてから再度お試しください。", 429, "duplicate", "duplicate");
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "missing_api_key" });
      return NextResponse.json({ ...fallbackResponse(safeBody), fallback: true });
    }

    recordAcceptedRequest(ipHash, sessionId);
    accepted = true;

    const prompt = buildPrompt(safeBody);
    const spotCount = safeBody.spots.length;
    const maxOutputTokens = maxOutputTokensFor(spotCount);
    let lastError: unknown;

    for (const apiKey of apiKeys) {
      const genAI = new GoogleGenerativeAI(apiKey);
      for (const modelName of MODEL_NAMES) {
        // thinkingConfig 付きで1回、APIに拒否された場合だけ無指定でもう1回。
        for (const thinkingDisabled of [true, false]) {
          let responded = false;
          let usage: GeminiUsage | undefined;
          let finishReason: string | undefined;
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: buildGenerationConfig(maxOutputTokens, thinkingDisabled),
            });
            responded = true;
            const response = result.response as unknown as {
              candidates?: { finishReason?: string }[];
              usageMetadata?: GeminiUsage;
            };
            usage = response.usageMetadata;
            finishReason = response.candidates?.[0]?.finishReason;

            // 打ち切られた応答は不完全なJSONとしてここで例外になり、下の catch で記録される。
            const parsed = JSON.parse(result.response.text());
            auditLog({
              requestId,
              ipHash,
              userAgent,
              sessionId,
              errorType: "ok",
              inputTokens: usage?.promptTokenCount,
              outputTokens: usage?.candidatesTokenCount,
              totalTokens: usage?.totalTokenCount,
              model: modelName,
              spotCount,
              maxOutputTokens,
              thinkingDisabled,
              finishReason,
            });
            return NextResponse.json(normalizeResponse(parsed, safeBody));
          } catch (error) {
            lastError = error;
            auditLog({
              requestId,
              ipHash,
              userAgent,
              sessionId,
              errorType: "gemini_attempt_failed",
              inputTokens: usage?.promptTokenCount,
              outputTokens: usage?.candidatesTokenCount,
              totalTokens: usage?.totalTokenCount,
              model: modelName,
              spotCount,
              maxOutputTokens,
              thinkingDisabled,
              finishReason,
              reason: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
            });
          }
          // 応答が返っていれば thinkingConfig は受理されている。無指定での再試行は意味がない。
          if (responded) break;
        }
      }
    }

    console.error("Shiori AI generation failed", lastError);
    auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "gemini_error", spotCount, maxOutputTokens });
    return NextResponse.json({ ...fallbackResponse(safeBody), fallback: true });
  } catch (error) {
    console.error("Generate API error", error);
    auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_input" });
    return jsonError("AI生成リクエストを処理できませんでした。入力内容を確認してから再度お試しください。", 400, "bad_input", "bad_request");
  } finally {
    if (accepted) releaseIp(ipHash);
  }
}

export async function GET() {
  return jsonError("AI生成APIはPOSTリクエストのみ受け付けています。", 405, "bad_method", "method_not_allowed");
}
