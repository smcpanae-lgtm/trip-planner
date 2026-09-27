import { NextRequest, NextResponse } from "next/server";
import { RADIUS_DEFAULT_KM, RADIUS_MAX_KM, RADIUS_MIN_KM } from "@/lib/hare/constants";
import { searchSunnySpots } from "@/lib/hare/search";
import type { HareSearchResponse } from "@/lib/hare/types";

// 晴れ探しドライブの検索API。
// GET /api/hare?lat=35.68&lng=139.76&radius=200&departure=2026-09-27T09:00:00%2B09:00
//
// Open-Meteo への問い合わせは lib/hare/weather.ts の fetch（next.revalidate）でデータキャッシュされる。
// このルート自体の応答は利用者ごとに異なるためキャッシュしない。

const HOUR_MS = 60 * 60 * 1000;
/** 出発時刻として受け付ける範囲（今日・明日の出発のみ。予報日数 FORECAST_DAYS に収まる範囲） */
const MAX_DEPARTURE_AHEAD_MS = 48 * HOUR_MS;

function parseNumber(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = parseNumber(params.get("lat"));
  const lng = parseNumber(params.get("lng"));
  if (lat == null || lng == null || lat < 20 || lat > 46 || lng < 122 || lng > 154) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 400 });
  }

  const radiusParam = parseNumber(params.get("radius")) ?? RADIUS_DEFAULT_KM;
  const radiusKm = Math.min(RADIUS_MAX_KM, Math.max(RADIUS_MIN_KM, radiusParam));

  const now = Date.now();
  const departureParam = params.get("departure");
  let departureMs = departureParam ? Date.parse(departureParam) : now;
  if (!Number.isFinite(departureMs) || departureMs > now + MAX_DEPARTURE_AHEAD_MS) {
    return NextResponse.json({ error: "invalid_departure" }, { status: 400 });
  }
  // 過去の時刻が来たら「今すぐ」とみなす
  if (departureMs < now) departureMs = now;

  const result = await searchSunnySpots(lat, lng, radiusKm, departureMs);
  if (result.allFailed) {
    return NextResponse.json(
      { error: result.rateLimited ? "rate_limited" : "forecast_failed" },
      { status: result.rateLimited ? 429 : 502 }
    );
  }

  const body: HareSearchResponse = {
    origin: { lat, lng, land: result.land },
    radiusKm,
    departureAt: new Date(departureMs).toISOString(),
    spots: result.spots,
    unavailableCount: result.unavailableCount,
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
