import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  | "gemini_error"
  | "ok";

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
const MAX_OUTPUT_TOKENS = 700;
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

function jsonError(message: string, status: number, errorType: AuditError) {
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

function checkRateLimit(ipHash: string, sessionId: string) {
  const now = Date.now();
  if (pruneHits(ipMinuteHits, ipHash, MINUTE_MS, now).length >= 1) {
    return { ok: false, status: 429, errorType: "rate_limit_ip_minute" as const, message: "短時間に複数回のAI生成が行われました。1分ほど待ってから再度お試しください。" };
  }
  if (pruneHits(ipDayHits, ipHash, DAY_MS, now).length >= 20) {
    return { ok: false, status: 429, errorType: "rate_limit_ip_day" as const, message: "本日のAI生成回数が上限に達しました。明日以降に再度お試しください。" };
  }
  if (pruneHits(sessionDayHits, sessionId, DAY_MS, now).length >= 10) {
    return { ok: false, status: 429, errorType: "rate_limit_session_day" as const, message: "このブラウザでの本日のAI生成回数が上限に達しました。明日以降に再度お試しください。" };
  }
  if ((activeIpRuns.get(ipHash) || 0) >= 1) {
    return { ok: false, status: 429, errorType: "concurrent_ip" as const, message: "同じ回線からAI生成が実行中です。完了してから再度お試しください。" };
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

function isOutputLanguage(value: unknown): value is OutputLanguage {
  return typeof value === "string" && (OUTPUT_LANGUAGES as string[]).includes(value);
}

function validateAndNormalizeBody(body: ShioriRequest) {
  if (!body || !Array.isArray(body.spots) || body.spots.length === 0) {
    return { ok: false as const, message: "旅行記に使う記録がありません。" };
  }
  if (body.spots.length > MAX_SPOTS) {
    return { ok: false as const, message: `一度にAI生成できる記録は${MAX_SPOTS}件までです。範囲を絞ってからお試しください。` };
  }
  if (Array.isArray((body as unknown as { images?: unknown[] }).images) && (body as unknown as { images: unknown[] }).images.length > 0) {
    return { ok: false as const, message: "写真データはAI生成APIへ送信できません。場所・日付・メモだけで作成してください。" };
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
    return { ok: false as const, message: "入力内容が長すぎます。記録数やメモを短くしてからお試しください。" };
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

function toneLabel(tone: ShioriTone): string {
  switch (tone) {
    case "simple":
      return "一人称で、短く素直な記録文";
    case "diary":
      return "日記のようにあたたかく、記録者の余韻が残る文";
    case "guide":
      return "記録者の体験を中心に、場所の魅力も少し添える文";
    case "warm":
    default:
      return "記録者の視点で、やさしく思い出を振り返る文";
  }
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
  const outputLanguage = outputLanguageName(body.language || "ja");
  const spots = body.spots
    .map((spot, index) =>
      [
        `${index + 1}. id=${spot.id}`,
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
- spotのidは入力と完全一致させる
- 必ずJSONだけを返す

旅行記タイトル: ${body.title || "未設定"}
旅行者名: ${body.traveler || "未設定"}
文体: ${toneLabel(body.tone)}

素材:
${spots}

返却JSON形式:
{
  "summary": "記録者の視点で旅全体を振り返る文章",
  "spots": [
    { "id": "入力id", "title": "短い見出し", "caption": "その場所での記憶を一人称で振り返る文章" }
  ]
}`;
}

function normalizeResponse(parsed: unknown, body: ShioriRequest): ShioriResponse {
  const fallback = fallbackResponse(body);
  if (!parsed || typeof parsed !== "object") return fallback;
  const record = parsed as Record<string, unknown>;
  const rawSpots = Array.isArray(record.spots) ? record.spots : [];
  const spotsById = new Map<string, GeneratedSpot>();
  for (const item of rawSpots) {
    if (!item || typeof item !== "object") continue;
    const spot = item as Record<string, unknown>;
    const id = typeof spot.id === "string" ? spot.id : "";
    if (!id) continue;
    spotsById.set(id, {
      id,
      title: typeof spot.title === "string" && spot.title.trim() ? spot.title.trim() : fallback.spots.find((s) => s.id === id)?.title || "思い出の場所",
      caption: typeof spot.caption === "string" && spot.caption.trim() ? spot.caption.trim() : fallback.spots.find((s) => s.id === id)?.caption || "",
    });
  }
  return {
    summary: typeof record.summary === "string" && record.summary.trim() ? record.summary.trim() : fallback.summary,
    spots: body.spots.map((input) => spotsById.get(input.id) || fallback.spots.find((spot) => spot.id === input.id)!),
  };
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
      return jsonError("このサイト以外からのAI生成リクエストは受け付けていません。", 403, "bad_origin");
    }

    const normalized = validateAndNormalizeBody((await request.json()) as ShioriRequest);
    if (!normalized.ok) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_input" });
      return jsonError(normalized.message, 400, "bad_input");
    }
    const safeBody = normalized.value;
    sessionId = safeBody.sessionId || request.headers.get("x-shiori-session-id") || "unknown";

    if (!(await verifyTurnstile(safeBody.turnstileToken, ip))) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_turnstile" });
      return jsonError("認証確認に失敗しました。画面を更新してからもう一度お試しください。", 403, "bad_turnstile");
    }

    const rateLimit = checkRateLimit(ipHash, sessionId);
    if (!rateLimit.ok) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: rateLimit.errorType });
      return jsonError(rateLimit.message, rateLimit.status, rateLimit.errorType);
    }

    if (!checkDuplicate(`${ipHash}:${sessionId}:${contentHash(safeBody)}`)) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "duplicate" });
      return jsonError("同じ内容のAI生成が短時間に送信されています。少し時間を置いてから再度お試しください。", 429, "duplicate");
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "missing_api_key" });
      return NextResponse.json({ ...fallbackResponse(safeBody), fallback: true });
    }

    recordAcceptedRequest(ipHash, sessionId);
    accepted = true;

    const prompt = buildPrompt(safeBody);
    let lastError: unknown;
    for (const apiKey of apiKeys) {
      const genAI = new GoogleGenerativeAI(apiKey);
      for (const modelName of MODEL_NAMES) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              responseMimeType: "application/json",
            },
          });
          const parsed = JSON.parse(result.response.text());
          const usage = (result.response as unknown as {
            usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
          }).usageMetadata;
          auditLog({
            requestId,
            ipHash,
            userAgent,
            sessionId,
            errorType: "ok",
            inputTokens: usage?.promptTokenCount,
            outputTokens: usage?.candidatesTokenCount,
            totalTokens: usage?.totalTokenCount,
          });
          return NextResponse.json(normalizeResponse(parsed, safeBody));
        } catch (error) {
          lastError = error;
        }
      }
    }

    console.error("Shiori AI generation failed", lastError);
    auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "gemini_error" });
    return NextResponse.json({ ...fallbackResponse(safeBody), fallback: true });
  } catch (error) {
    console.error("Generate API error", error);
    auditLog({ requestId, ipHash, userAgent, sessionId, errorType: "bad_input" });
    return jsonError("AI生成リクエストを処理できませんでした。入力内容を確認してから再度お試しください。", 400, "bad_input");
  } finally {
    if (accepted) releaseIp(ipHash);
  }
}

export async function GET() {
  return jsonError("AI生成APIはPOSTリクエストのみ受け付けています。", 405, "bad_method");
}
