import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

/**
 * 犬連れモードの食事地点の近くで、Google の情報で「犬同伴可」とされているお店を返す。
 *
 * - 使う検索は Places API (New) の「地点のまわりを探す検索（Nearby Search）」だけ。
 *   既存のキーワード検索（/api/places の textsearch など）とは料金区分・回数の数え方が別。
 * - 犬同伴可の項目（allowsDogs）を取るため、この検索は最上位の料金区分（Enterprise + Atmosphere）になる。
 *   月の上限は Google Cloud 側の割り当てで管理する（ここでは数えない）。
 * - Google の規約により、結果は保存しない（サーバー側のキャッシュもしない）。
 * - 失敗・上限超過のときはエラーを返さず、空の一覧を返す（画面には枠を出さないだけにする）。
 */

const SEARCH_RADIUS_M = 5000;
const MAX_RETURN = 5;
const SUPPORTED_LANGS = ["ja", "en", "ko", "zh-CN", "zh-TW", "es", "ru"];

// 1つの回線からの呼び出し制限（一時的な記憶。サーバーが入れ替わると数え直しになる）
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_MINUTE = 6;
const MAX_PER_DAY = 60;
const MAX_TRACKED_IPS = 5000;
const hits = new Map<string, number[]>();

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || forwarded || "unknown";
}

/** 制限内なら呼び出しを記録して true を返す */
function allowRequest(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < DAY_MS);
  const lastMinute = recent.filter((t) => now - t < MINUTE_MS).length;
  if (lastMinute >= MAX_PER_MINUTE || recent.length >= MAX_PER_DAY) {
    hits.set(ip, recent);
    return false;
  }
  if (!hits.has(ip) && hits.size >= MAX_TRACKED_IPS) {
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }
  hits.set(ip, [...recent, now]);
  return true;
}

interface NearbyPlace {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  allowsDogs?: boolean;
  googleMapsUri?: string;
}

const empty = () => NextResponse.json({ places: [] }, { headers: { "Cache-Control": "no-store" } });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const langParam = params.get("lang") || "ja";
  const lang = SUPPORTED_LANGS.includes(langParam) ? langParam : "ja";

  // 日本国内の座標だけ受け付ける
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 20 || lat > 46 || lng < 122 || lng > 154) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  if (!API_KEY) return empty();
  if (!allowRequest(getIp(request))) return empty();

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.allowsDogs,places.googleMapsUri",
      },
      body: JSON.stringify({
        includedTypes: ["restaurant", "cafe"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        languageCode: lang,
        regionCode: "JP",
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: SEARCH_RADIUS_M },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      // 上限超過（429）・認証エラーなど。エラーの種類だけ記録する（キーは出さない）
      console.warn(`[dog-places] Google returned HTTP ${res.status}`);
      return empty();
    }
    const data = (await res.json()) as { places?: NearbyPlace[] };
    const places = (data.places || [])
      .filter(
        (p) =>
          p.allowsDogs === true &&
          p.displayName?.text &&
          p.googleMapsUri &&
          typeof p.location?.latitude === "number" &&
          typeof p.location?.longitude === "number"
      )
      .slice(0, MAX_RETURN)
      .map((p) => ({
        id: p.id ?? p.googleMapsUri!,
        name: p.displayName!.text!,
        lat: p.location!.latitude!,
        lng: p.location!.longitude!,
        mapsUrl: p.googleMapsUri!,
      }));
    return NextResponse.json({ places }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.warn(`[dog-places] request failed: ${e instanceof Error ? e.name : "unknown"}`);
    return empty();
  }
}
