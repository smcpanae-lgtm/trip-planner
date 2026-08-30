import { presetSpots } from "./presets";
import { highwayICs } from "./highway";
import { parkingAreas, michiNoEkis } from "./rest-stops";
import type { SearchCandidate } from "@/types/trip";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
}

interface NominatimReverseResult {
  address?: {
    state?: string;
    province?: string;
  };
}

// クエリ単位の検索結果キャッシュ。
// Places APIの1日あたりの割り当てが逼迫しやすいため、同じ語で何度も打ち直したり
// 似た目的地を連続で検索したりしたときに再度APIを叩かないようにする（ページ内のみ有効）。
const searchCache = new Map<string, SearchCandidate[]>();

export interface SearchPlacesResult {
  results: SearchCandidate[];
  // Places APIの呼び出し自体が失敗した（＝割り当て超過等）場合にtrue。
  // 「該当なし」と区別してUIに出し分けるためのフラグ。
  apiError: boolean;
}

// Search for place candidates using Google Places Autocomplete API (with Nominatim fallback)
// Autocomplete(New)はText Searchとは別クォータのため、目的地入力のたびの割り当て消費を分離できる。
// 候補はplaceIdのみを持ち、座標は選択時に getPlaceDetails() で別途解決する。
export async function searchPlaces(
  query: string,
  sessionToken?: string
): Promise<SearchPlacesResult> {
  if (!query || query.length < 2) return { results: [], apiError: false };

  const cacheKey = query.trim();
  const cached = searchCache.get(cacheKey);
  if (cached) return { results: cached, apiError: false };

  // Check presets first
  const presetMatches = presetSpots
    .filter(
      (s) =>
        s.name.includes(query) || query.includes(s.name)
    )
    .slice(0, 3)
    .map((s) => ({
      name: s.name,
      address: `${s.region}・${s.category}（${s.description}）`,
      lat: s.lat,
      lng: s.lng,
    }));

  if (presetMatches.length >= 3) {
    searchCache.set(cacheKey, presetMatches);
    return { results: presetMatches, apiError: false };
  }

  // Try Google Places Autocomplete API first
  let apiError = false;
  try {
    const params = new URLSearchParams({ mode: "autocomplete", q: query });
    if (sessionToken) params.set("sessiontoken", sessionToken);
    const res = await fetch(`/api/places?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const googleResults: SearchCandidate[] = data.results.map(
          (r: { name: string; address: string; placeId: string }) => ({
            name: r.name,
            address: r.address,
            placeId: r.placeId,
          })
        );
        const merged = [...presetMatches, ...googleResults].slice(0, 5);
        searchCache.set(cacheKey, merged);
        return { results: merged, apiError: false };
      }
    } else {
      apiError = true;
    }
  } catch (e) {
    console.warn("Google Places API failed, trying Text Search:", e);
    apiError = true;
  }

  // Autocompleteはカタカナ表記ゆれ（例: 「グロワーズキッチン」→実際は"Grower's Kitchen"表記）に弱く
  // 0件になることがあるため、その場合だけ表記ゆれに強いText Search(New)で拾い直す。
  // 通常のクエリはAutocompleteだけで完結するので、このフォールバックの呼び出し頻度は低い。
  try {
    const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const googleResults: SearchCandidate[] = data.results.map(
          (r: { name: string; address: string; lat: number; lng: number }) => ({
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
          })
        );
        const merged = [...presetMatches, ...googleResults].slice(0, 5);
        searchCache.set(cacheKey, merged);
        return { results: merged, apiError: false };
      }
      apiError = false;
    } else {
      apiError = true;
    }
  } catch (e) {
    console.warn("Google Text Search fallback failed, falling back to Nominatim:", e);
    apiError = true;
  }

  // Fallback to Nominatim
  try {
    let searchQuery = query;
    if (!/[都道府県市区町村]/.test(query) && !/日本/.test(query)) {
      searchQuery = `${query} 日本`;
    }
    const encoded = encodeURIComponent(searchQuery);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=jp&limit=5&accept-language=ja&addressdetails=1`,
      { headers: { "User-Agent": "TripPlannerApp/1.0" } }
    );
    const data: NominatimResult[] = await res.json();
    const nominatimResults: SearchCandidate[] = data.map((r) => ({
      name: extractShortName(r.display_name),
      address: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
    const merged = [...presetMatches, ...nominatimResults].slice(0, 5);
    // Nominatimでも見つからず、かつGoogle側がエラーだった場合のみ「一時的に使えません」を出す。
    // Nominatimが単に0件だった（＝本当に該当なし）場合はapiErrorを立てない。
    if (merged.length === 0 && apiError) {
      return { results: [], apiError: true };
    }
    searchCache.set(cacheKey, merged);
    return { results: merged, apiError: false };
  } catch (e) {
    console.error("Search error:", e);
    return { results: presetMatches, apiError };
  }
}

// Autocomplete候補（placeIdのみ）から緯度経度を解決する。選択時に1回だけ呼ぶ。
export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string
): Promise<{ name: string; address: string; lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ mode: "details", placeId });
    if (sessionToken) params.set("sessiontoken", sessionToken);
    const res = await fetch(`/api/places?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (
      data.result &&
      typeof data.result.lat === "number" &&
      typeof data.result.lng === "number"
    ) {
      return data.result;
    }
    return null;
  } catch (e) {
    console.error("Place details error:", e);
    return null;
  }
}

function extractShortName(displayName: string): string {
  const parts = displayName.split(",").map((s) => s.trim());
  return parts[0] || displayName;
}

// Geocode a place name
export async function geocode(
  query: string
): Promise<{ lat: number; lng: number; name: string } | null> {
  // Check preset tourist spots
  const preset = presetSpots.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (preset) {
    return { lat: preset.lat, lng: preset.lng, name: preset.name };
  }

  // Check highway ICs
  const ic = highwayICs.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (ic) {
    return { lat: ic.lat, lng: ic.lng, name: ic.name };
  }

  // Check rest stops
  const pa = parkingAreas.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (pa) {
    return { lat: pa.lat, lng: pa.lng, name: pa.name };
  }

  const eki = michiNoEkis.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (eki) {
    return { lat: eki.lat, lng: eki.lng, name: eki.name };
  }

  // Try Google Places API
  try {
    const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        return { lat: best.lat, lng: best.lng, name: best.name };
      }
    }
  } catch (e) {
    console.warn("Google geocoding failed, trying Nominatim:", e);
  }

  // Fallback to Nominatim
  try {
    let searchQuery = query;
    if (!/[都道府県市区町村]/.test(query) && !/日本/.test(query)) {
      searchQuery = `${query} 日本`;
    }

    const encoded = encodeURIComponent(searchQuery);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=jp&limit=5&accept-language=ja`,
      {
        headers: {
          "User-Agent": "TripPlannerApp/1.0",
        },
      }
    );
    const data: NominatimResult[] = await res.json();
    if (data.length > 0) {
      const best = data[0];
      return {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
        name: query,
      };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}

// 緯度経度から州・都道府県名を取得（Nominatimの逆ジオコーディング）
// 世界中の座標に対応。取得できない場合はnullを返す
export async function reverseGeocodeRegion(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja&zoom=8&addressdetails=1`,
      { headers: { "User-Agent": "TripPlannerApp/1.0" } }
    );
    if (!res.ok) return null;
    const data: NominatimReverseResult = await res.json();
    const state = data.address?.state || data.address?.province;
    return state || null;
  } catch (e) {
    console.warn("Reverse geocoding error:", e);
    return null;
  }
}

// Calculate distance between two points (Haversine formula)
export function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate travel time by car
export function estimateTravelMinutes(
  distanceKm: number,
  isHighway: boolean = false
): number {
  const avgSpeed = isHighway ? 80 : 45; // km/h
  return Math.round((distanceKm / avgSpeed) * 60);
}
