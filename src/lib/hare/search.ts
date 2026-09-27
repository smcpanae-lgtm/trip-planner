// 晴れ探しの本体（サーバー専用）：候補の絞り込み → タイル単位の予報取得 → 到着時刻ごとの判定

import { calcDistance } from "@/lib/geocoding";
import {
  AVERAGE_SPEED_KMH,
  MAX_CONCURRENT_REQUESTS,
  RATE_LIMIT_RETRY_DELAY_MS,
  ROAD_DISTANCE_FACTOR,
  WEATHER_WINDOW_HOURS,
} from "./constants";
import {
  classifyWindow,
  maxPrecipProbability,
  worstWeatherCode,
  type HourlyForecast,
} from "./classify";
import {
  getCellOf,
  getTileChunks,
  municipalities,
  type Municipality,
  type WeatherCell,
} from "./grid";
import type { HareSpot } from "./types";
import { fetchCellForecasts, OpenMeteoError, type CellForecast } from "./weather";

const HOUR_MS = 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * HOUR_MS;

/** 出発地の陸地：最寄りの市町村代表点の陸地とみなす */
export function findOriginLand(lat: number, lng: number): string {
  let best: Municipality = municipalities[0];
  let bestDist = Infinity;
  for (const m of municipalities) {
    const d = calcDistance(lat, lng, m.lat, m.lng);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best.land;
}

/** 直線距離から到着時刻を見積もる（道のり＝直線×ROAD_DISTANCE_FACTOR、平均 AVERAGE_SPEED_KMH） */
export function estimateArrival(departureMs: number, distanceKm: number): number {
  const hours = (distanceKm * ROAD_DISTANCE_FACTOR) / AVERAGE_SPEED_KMH;
  return departureMs + hours * HOUR_MS;
}

/** Open-Meteo の hourly.time と同じ形式（日本時間、"YYYY-MM-DDTHH:00"） */
function jstHourKey(ms: number): string {
  return new Date(ms + JST_OFFSET_MS).toISOString().slice(0, 13) + ":00";
}

function toJstIso(ms: number): string {
  return new Date(ms + JST_OFFSET_MS).toISOString().slice(0, 16) + ":00+09:00";
}

/** 到着時刻を含む1時間から WEATHER_WINDOW_HOURS 時間分の予報 */
function windowHours(forecast: CellForecast, arrivalMs: number): HourlyForecast[] {
  const start = Math.floor(arrivalMs / HOUR_MS) * HOUR_MS;
  const hours: HourlyForecast[] = [];
  for (let i = 0; i < WEATHER_WINDOW_HOURS; i++) {
    const hour = forecast.get(jstHourKey(start + i * HOUR_MS));
    if (hour) hours.push(hour);
  }
  return hours;
}

async function fetchWithRetry(cells: WeatherCell[]) {
  try {
    return await fetchCellForecasts(cells);
  } catch (e) {
    if (!(e instanceof OpenMeteoError && e.status === 429)) throw e;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY_MS));
    return fetchCellForecasts(cells);
  }
}

/** 同時実行数を MAX_CONCURRENT_REQUESTS に抑えてタイルを取得する */
async function fetchAllChunks(chunks: WeatherCell[][]) {
  const settled: PromiseSettledResult<Map<string, CellForecast>>[] = new Array(chunks.length);
  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const i = next++;
      try {
        settled[i] = { status: "fulfilled", value: await fetchWithRetry(chunks[i]) };
      } catch (reason) {
        settled[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, chunks.length) }, worker)
  );
  return settled;
}

export interface SearchResult {
  land: string;
  spots: HareSpot[];
  unavailableCount: number;
  /** 全タイルの取得に失敗し、1地点も判定できなかった */
  allFailed: boolean;
  rateLimited: boolean;
}

export async function searchSunnySpots(
  originLat: number,
  originLng: number,
  radiusKm: number,
  departureMs: number
): Promise<SearchResult> {
  const land = findOriginLand(originLat, originLng);

  const candidates = municipalities
    .filter((m) => m.land === land)
    .map((m) => ({ m, distanceKm: calcDistance(originLat, originLng, m.lat, m.lng) }))
    .filter((c) => c.distanceKm <= radiusKm);

  // 候補が含まれるタイルだけを、タイル丸ごと取得する（URLを利用者間で共通にするため）
  const tileKeys = [...new Set(candidates.map((c) => getCellOf(c.m).tileKey))];
  const chunks = tileKeys.flatMap((key) => getTileChunks(key));
  const settled = await fetchAllChunks(chunks);

  const forecasts = new Map<string, CellForecast>();
  let rateLimited = false;
  let failedChunks = 0;
  for (const r of settled) {
    if (r.status === "fulfilled") {
      for (const [key, f] of r.value) forecasts.set(key, f);
    } else {
      failedChunks++;
      if (r.reason instanceof OpenMeteoError && r.reason.status === 429) rateLimited = true;
      else console.error("[hare] forecast fetch failed:", r.reason);
    }
  }

  const spots: HareSpot[] = [];
  let unavailableCount = 0;
  for (const { m, distanceKm } of candidates) {
    const forecast = forecasts.get(getCellOf(m).key);
    const arrivalMs = estimateArrival(departureMs, distanceKm);
    const hours = forecast ? windowHours(forecast, arrivalMs) : [];
    const weather = classifyWindow(hours);
    if (!weather) {
      unavailableCount++;
      continue;
    }
    spots.push({
      code: m.code,
      pref: m.pref,
      name: m.name,
      lat: m.lat,
      lng: m.lng,
      distanceKm: Math.round(distanceKm * 10) / 10,
      arrivalAt: toJstIso(arrivalMs),
      weather,
      maxPrecipProbability: maxPrecipProbability(hours),
      worstWeatherCode: worstWeatherCode(hours),
    });
  }
  spots.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    land,
    spots,
    unavailableCount,
    allFailed: chunks.length > 0 && failedChunks === chunks.length,
    rateLimited,
  };
}

const SUFFIX_RANK: Record<string, number> = { 市: 0, 区: 1, 町: 2, 村: 3 };

/** 市町村名での出発地検索（無料・ローカル）。前方一致を優先し、同順位なら市→区→町→村。最大 limit 件 */
export function searchMunicipalityByName(query: string, limit = 5): Municipality[] {
  const q = query.replace(/\s+/g, "");
  if (!q) return [];
  const scored: { m: Municipality; score: number }[] = [];
  for (const m of municipalities) {
    const full = `${m.pref}${m.name}`;
    let score = -1;
    if (m.name === q || full === q) score = 0;
    else if (m.name.startsWith(q)) score = 1;
    else if (full.startsWith(q)) score = 2;
    else if (m.name.includes(q)) score = 3;
    if (score >= 0) scored.push({ m, score });
  }
  const rank = (m: Municipality) => SUFFIX_RANK[m.name.slice(-1)] ?? 4;
  scored.sort((a, b) => a.score - b.score || rank(a.m) - rank(b.m));
  return scored.slice(0, limit).map((s) => s.m);
}
