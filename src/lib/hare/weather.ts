// Open-Meteo 予報の取得（サーバー専用）。
// OPEN_METEO_API_KEY があれば有料版（customer-api）、無ければ無料版を使う。

import { FORECAST_DAYS, FORECAST_TIMEZONE, WEATHER_CACHE_SECONDS } from "./constants";
import type { HourlyForecast } from "./classify";
import type { WeatherCell } from "./grid";

const FREE_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const CUSTOMER_ENDPOINT = "https://customer-api.open-meteo.com/v1/forecast";

interface OpenMeteoLocation {
  hourly?: {
    time?: string[];
    weather_code?: (number | null)[];
    precipitation_probability?: (number | null)[];
  };
}

/** 時刻文字列（例 "2026-09-27T10:00"、日本時間）→ 1時間分の予報 */
export type CellForecast = Map<string, HourlyForecast>;

export class OpenMeteoError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function buildUrl(cells: WeatherCell[]): string {
  const apiKey = process.env.OPEN_METEO_API_KEY;
  const params = new URLSearchParams({
    latitude: cells.map((c) => c.lat.toFixed(3)).join(","),
    longitude: cells.map((c) => c.lng.toFixed(3)).join(","),
    hourly: "weather_code,precipitation_probability",
    timezone: FORECAST_TIMEZONE,
    forecast_days: String(FORECAST_DAYS),
  });
  if (apiKey) params.set("apikey", apiKey);
  return `${apiKey ? CUSTOMER_ENDPOINT : FREE_ENDPOINT}?${params.toString()}`;
}

/**
 * セル群の予報をまとめて取得する。
 * `next.revalidate` を指定しているため、応答（ステータス200のみ）は Next.js のデータキャッシュに
 * WEATHER_CACHE_SECONDS 秒保存される。Vercel ではこのキャッシュが全インスタンスで共有される。
 */
export async function fetchCellForecasts(
  cells: WeatherCell[]
): Promise<Map<string, CellForecast>> {
  const res = await fetch(buildUrl(cells), {
    next: { revalidate: WEATHER_CACHE_SECONDS },
  });
  if (!res.ok) {
    throw new OpenMeteoError(`Open-Meteo responded ${res.status}`, res.status);
  }
  const json: unknown = await res.json();
  // 地点が1つのときはオブジェクト、複数のときは配列で返る
  const locations = (Array.isArray(json) ? json : [json]) as OpenMeteoLocation[];
  if (locations.length !== cells.length) {
    throw new OpenMeteoError("Open-Meteo returned an unexpected number of locations", 502);
  }

  const result = new Map<string, CellForecast>();
  cells.forEach((cell, i) => {
    const hourly = locations[i].hourly;
    const forecast: CellForecast = new Map();
    hourly?.time?.forEach((time, h) => {
      forecast.set(time, {
        weatherCode: hourly.weather_code?.[h] ?? null,
        precipProbability: hourly.precipitation_probability?.[h] ?? null,
      });
    });
    result.set(cell.key, forecast);
  });
  return result;
}
