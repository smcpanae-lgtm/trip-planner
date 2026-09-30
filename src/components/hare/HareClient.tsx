"use client";

import { useMemo, useState } from "react";
import { Crosshair, Search, Sun, Cloud, CloudRain, Car, Loader2 } from "lucide-react";
import HareMap, { WEATHER_COLORS } from "./HareMap";
import { geocode } from "@/lib/geocoding";
import { hareJa } from "@/lib/hare/i18n";
import {
  AVERAGE_SPEED_KMH,
  RADIUS_DEFAULT_KM,
  RADIUS_MAX_KM,
  RADIUS_MIN_KM,
  RADIUS_STEP_KM,
  RAIN_MIN_PRECIP_PROBABILITY,
  ROAD_DISTANCE_FACTOR,
  SUNNY_MAX_PRECIP_PROBABILITY,
  WEATHER_WINDOW_HOURS,
} from "@/lib/hare/constants";
import type { HarePlaceMatch, HareSearchResponse, HareSpot, HareWeather } from "@/lib/hare/types";

const dict = hareJa;
const PAGE_SIZE = 30;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

type DepartureMode = "now" | "today" | "tomorrow";

interface Origin {
  lat: number;
  lng: number;
  name: string;
}

/** 日本時間の日付（YYYY-MM-DD）。dayOffset=1 で明日 */
function jstDate(dayOffset = 0): string {
  return new Date(Date.now() + JST_OFFSET_MS + dayOffset * 86400000).toISOString().slice(0, 10);
}

function defaultTime(): string {
  // 次の正時（日本時間）
  const d = new Date(Date.now() + JST_OFFSET_MS + 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

/**
 * 「今日」で選べる最も早い時刻（日本時間・15分単位で切り上げ）。
 * 今日の残りに15分刻みの時刻がなければ null。
 */
function earliestTodayTime(): string | null {
  const d = new Date(Date.now() + JST_OFFSET_MS);
  const minutes = Math.ceil((d.getUTCHours() * 60 + d.getUTCMinutes() + 1) / 15) * 15;
  if (minutes >= 24 * 60) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** 判定に使った出発時刻（ISO）→ 日本時間の月・日・時・分 */
function jstParts(iso: string) {
  const d = new Date(Date.parse(iso) + JST_OFFSET_MS);
  return {
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

function buildPlannerLink(spot: HareSpot): string {
  const params = new URLSearchParams();
  params.set("destination", `${spot.pref}${spot.name}`);
  params.set("lat", spot.lat.toFixed(6));
  params.set("lng", spot.lng.toFixed(6));
  params.set("source", "hare");
  return `/?${params.toString()}`;
}

function formatArrival(iso: string): string {
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  if (date === jstDate(0)) return time;
  if (date === jstDate(1)) return dict.arrivalTomorrow(time);
  return dict.arrivalOnDate(Number(date.slice(5, 7)), Number(date.slice(8, 10)), time);
}

const WEATHER_ICONS: Record<HareWeather, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
};

export default function HareClient() {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [originInput, setOriginInput] = useState("");
  const [originBusy, setOriginBusy] = useState(false);
  const [radiusKm, setRadiusKm] = useState(RADIUS_DEFAULT_KM);
  const [departureMode, setDepartureMode] = useState<DepartureMode>("now");
  const [departureTime, setDepartureTime] = useState(defaultTime);
  /** 「今日」を選んだ時点で選べる最も早い時刻（それより前は選べない） */
  const [todayMinTime, setTodayMinTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HareSearchResponse | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(dict.errors.geolocationUnsupported);
      return;
    }
    setOriginBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: dict.currentLocationName,
        });
        setOriginInput("");
        setOriginBusy(false);
      },
      () => {
        setError(dict.errors.geolocationDenied);
        setOriginBusy(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  /** 地名 → 座標。市区町村名はローカル検索（無料）、それ以外は既存の geocode() */
  const resolveOriginName = async (query: string): Promise<Origin | null> => {
    try {
      const res = await fetch(`/api/hare/place?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data: { results: HarePlaceMatch[] } = await res.json();
        const best = data.results[0];
        if (best) return { lat: best.lat, lng: best.lng, name: `${best.pref}${best.name}` };
      }
    } catch (e) {
      console.warn("[hare] municipality search failed:", e);
    }
    const geo = await geocode(query);
    return geo ? { lat: geo.lat, lng: geo.lng, name: query } : null;
  };

  const applyOriginInput = async (): Promise<Origin | null> => {
    const query = originInput.trim();
    if (!query) return origin;
    setOriginBusy(true);
    setError(null);
    const resolved = await resolveOriginName(query);
    setOriginBusy(false);
    if (!resolved) {
      setError(dict.errors.originNotFound);
      return null;
    }
    setOrigin(resolved);
    setOriginInput("");
    return resolved;
  };

  const selectDepartureMode = (mode: DepartureMode) => {
    if (mode === "today") {
      const min = earliestTodayTime();
      if (!min) return;
      setTodayMinTime(min);
      if (departureTime < min) setDepartureTime(min);
    }
    setDepartureMode(mode);
  };

  const handleDepartureTimeChange = (value: string) => {
    if (!value) return;
    if (departureMode === "today") {
      // 入力中に時間が過ぎた場合も含め、今より前の時刻にはしない
      const min = earliestTodayTime() ?? todayMinTime;
      if (min && value < min) {
        setTodayMinTime(min);
        setDepartureTime(min);
        return;
      }
    }
    setDepartureTime(value);
  };

  const search = async () => {
    const from = originInput.trim() ? await applyOriginInput() : origin;
    if (!from) {
      if (!originInput.trim()) setError(dict.errors.originRequired);
      return;
    }
    const params = new URLSearchParams({
      lat: from.lat.toFixed(5),
      lng: from.lng.toFixed(5),
      radius: String(radiusKm),
    });
    if (departureMode !== "now") {
      const date = jstDate(departureMode === "tomorrow" ? 1 : 0);
      params.set("departure", `${date}T${departureTime}:00+09:00`);
    }

    setLoading(true);
    setError(null);
    setSelectedCode(null);
    setVisibleCount(PAGE_SIZE);
    try {
      const res = await fetch(`/api/hare?${params.toString()}`);
      if (!res.ok) {
        setResult(null);
        setError(res.status === 429 ? dict.errors.rateLimited : dict.errors.failed);
        return;
      }
      setResult(await res.json());
    } catch {
      setResult(null);
      setError(dict.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const spots = result?.spots ?? [];
    return {
      sunny: spots.filter((s) => s.weather === "sunny"),
      cloudy: spots.filter((s) => s.weather === "cloudy"),
      rain: spots.filter((s) => s.weather === "rain"),
    };
  }, [result]);

  const listMode: "sunny" | "cloudy" | "none" =
    grouped.sunny.length > 0 ? "sunny" : grouped.cloudy.length > 0 ? "cloudy" : "none";
  const listSpots = listMode === "sunny" ? grouped.sunny : listMode === "cloudy" ? grouped.cloudy : [];

  return (
    <div className="space-y-5">
      {/* 検索条件 */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="hare-origin" className="block text-sm font-bold text-slate-700 mb-2">
            {dict.originLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={originBusy}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm font-bold disabled:opacity-60 shrink-0"
            >
              <Crosshair className="w-4 h-4" />
              {originBusy ? dict.locating : dict.useCurrentLocation}
            </button>
            <div className="flex gap-2 flex-1">
              <input
                id="hare-origin"
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void applyOriginInput();
                  }
                }}
                placeholder={dict.originPlaceholder}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => void applyOriginInput()}
                disabled={originBusy || !originInput.trim()}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 disabled:opacity-50 shrink-0"
              >
                {dict.originSearch}
              </button>
            </div>
          </div>
          {origin && (
            <p className="mt-2 text-sm text-green-700 font-bold">{dict.originSet(origin.name)}</p>
          )}
        </div>

        <div>
          <label htmlFor="hare-radius" className="block text-sm font-bold text-slate-700 mb-2">
            {dict.radiusLabel(radiusKm)}
          </label>
          <input
            id="hare-radius"
            type="range"
            min={RADIUS_MIN_KM}
            max={RADIUS_MAX_KM}
            step={RADIUS_STEP_KM}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{RADIUS_MIN_KM}km</span>
            <span>{RADIUS_MAX_KM}km</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">{dict.departureLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            {(["now", "today", "tomorrow"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => selectDepartureMode(mode)}
                aria-pressed={departureMode === mode}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                  departureMode === mode
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {mode === "now"
                  ? dict.departureNow
                  : mode === "today"
                    ? dict.departureToday
                    : dict.departureTomorrow}
              </button>
            ))}
            {departureMode !== "now" && (
              <input
                type="time"
                aria-label={dict.departureTime}
                value={departureTime}
                step={900}
                min={departureMode === "today" ? (todayMinTime ?? undefined) : undefined}
                onChange={(e) => handleDepartureTimeChange(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm"
              />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void search()}
          disabled={loading || originBusy}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {loading ? dict.searching : dict.searchButton}
        </button>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </section>

      {/* 地図 */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-[360px] sm:h-[460px]">
          <HareMap
            origin={result ? result.origin : origin}
            radiusKm={result ? result.radiusKm : radiusKm}
            spots={result?.spots ?? []}
            selectedCode={selectedCode}
            onSelect={setSelectedCode}
            dict={dict}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs text-slate-600 border-t border-slate-100">
          <span className="font-bold">{dict.legendTitle}</span>
          {(["sunny", "cloudy", "rain"] as const).map((w) => (
            <span key={w} className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: WEATHER_COLORS[w] }} />
              {dict.weatherLabel[w]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-600" />
            {dict.originMarker}
          </span>
          <p className="basis-full text-slate-500">{dict.legendNote(WEATHER_WINDOW_HOURS)}</p>
        </div>
      </section>

      {/* 結果一覧 */}
      {result && (
        <section className="space-y-3">
          <p className="text-sm font-bold text-slate-700">
            {(() => {
              const d = jstParts(result.departureAt);
              return dict.judgedDeparture(d.month, d.day, d.hour, d.minute);
            })()}
          </p>
          <p className="text-sm text-slate-600">
            {dict.summary(grouped.sunny.length, grouped.cloudy.length, grouped.rain.length)}
          </p>
          <p className="text-xs text-slate-500">{dict.landNotice(dict.landLabel(result.origin.land))}</p>
          {result.unavailableCount > 0 && (
            <p className="text-xs text-amber-700">{dict.unavailableNotice(result.unavailableCount)}</p>
          )}

          {listMode === "cloudy" && (
            <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
              {dict.noSunnyNotice}
            </p>
          )}
          {listMode === "none" && (
            <p className="text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
              {dict.noResultNotice}
            </p>
          )}

          {listMode !== "none" && (
            <>
              <h2 className="text-base font-bold text-slate-800">
                {listMode === "sunny"
                  ? dict.resultSunnyTitle(listSpots.length)
                  : dict.resultCloudyTitle(listSpots.length)}
              </h2>
              <ul className="space-y-2">
                {listSpots.slice(0, visibleCount).map((spot) => {
                  const Icon = WEATHER_ICONS[spot.weather];
                  return (
                    <li
                      key={spot.code}
                      className={`bg-white rounded-lg border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                        selectedCode === spot.code ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCode(spot.code)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        <Icon
                          className="w-6 h-6 shrink-0 mt-0.5"
                          style={{ color: WEATHER_COLORS[spot.weather] }}
                          aria-label={dict.weatherLabel[spot.weather]}
                        />
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-800">
                            {spot.name}
                            <span className="ml-1.5 text-xs font-normal text-slate-500">{spot.pref}</span>
                          </span>
                          <span className="block text-xs text-slate-600 mt-0.5">
                            {dict.distance(spot.distanceKm)}・{dict.arrival(formatArrival(spot.arrivalAt))}・
                            {dict.weatherLabel[spot.weather]}・{dict.precipProbability(spot.maxPrecipProbability)}
                          </span>
                        </span>
                      </button>
                      <a
                        href={buildPlannerLink(spot)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shrink-0"
                      >
                        <Car className="w-4 h-4" />
                        {dict.makePlan}
                      </a>
                    </li>
                  );
                })}
              </ul>
              {listSpots.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="w-full py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-600"
                >
                  {dict.showMore(listSpots.length - visibleCount)}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {/* 判定方法と出典 */}
      <section className="text-xs text-slate-500 leading-relaxed space-y-1.5 border-t border-slate-200 pt-4">
        <p>{dict.assumptionNote(ROAD_DISTANCE_FACTOR, AVERAGE_SPEED_KMH)}</p>
        <p>{dict.judgeNote(SUNNY_MAX_PRECIP_PROBABILITY, RAIN_MIN_PRECIP_PROBABILITY)}</p>
        <p className="pt-1 font-bold text-slate-600">{dict.attributionTitle}</p>
        <p>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            {dict.attributionWeather}
          </a>
        </p>
        <p>
          <a
            href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            {dict.attributionBoundary}
          </a>
        </p>
      </section>
    </div>
  );
}
