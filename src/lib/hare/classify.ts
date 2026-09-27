import {
  RAIN_MIN_PRECIP_PROBABILITY,
  RAIN_WEATHER_CODE_RANGES,
  SUNNY_MAX_PRECIP_PROBABILITY,
  SUNNY_WEATHER_CODES,
} from "./constants";
import type { HareWeather } from "./types";

export interface HourlyForecast {
  weatherCode: number | null;
  precipProbability: number | null;
}

export function isRainCode(code: number): boolean {
  return RAIN_WEATHER_CODE_RANGES.some(([min, max]) => code >= min && code <= max);
}

/** 1時間分の判定 */
export function classifyHour(hour: HourlyForecast): HareWeather {
  const { weatherCode, precipProbability } = hour;
  if (
    (weatherCode != null && isRainCode(weatherCode)) ||
    (precipProbability != null && precipProbability >= RAIN_MIN_PRECIP_PROBABILITY)
  ) {
    return "rain";
  }
  if (
    weatherCode != null &&
    SUNNY_WEATHER_CODES.includes(weatherCode) &&
    precipProbability != null &&
    precipProbability < SUNNY_MAX_PRECIP_PROBABILITY
  ) {
    return "sunny";
  }
  return "cloudy";
}

/**
 * 判定時間帯の複数時間をまとめて判定する。
 * 1時間でも雨なら「雨」、全時間が晴れなら「晴れ」、それ以外は「くもり」。
 * 予報が1時間も無い場合は null（判定不能）。
 */
export function classifyWindow(hours: HourlyForecast[]): HareWeather | null {
  if (hours.length === 0) return null;
  const results = hours.map(classifyHour);
  if (results.includes("rain")) return "rain";
  if (results.every((r) => r === "sunny")) return "sunny";
  return "cloudy";
}

/** 表示用：時間帯で最も悪い天気コード（数値が大きいほど悪天候という WMO の並びを利用） */
export function worstWeatherCode(hours: HourlyForecast[]): number | null {
  const codes = hours.map((h) => h.weatherCode).filter((c): c is number => c != null);
  return codes.length > 0 ? Math.max(...codes) : null;
}

export function maxPrecipProbability(hours: HourlyForecast[]): number | null {
  const probs = hours
    .map((h) => h.precipProbability)
    .filter((p): p is number => p != null);
  return probs.length > 0 ? Math.max(...probs) : null;
}
