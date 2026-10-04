"use client";

import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";
import { useTripLang } from "@/lib/i18n/TripPlannerLanguageContext";
import { distanceKm, type DogFriendlyShop } from "@/lib/dogFriendlyShops";

interface GooglePlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

const MAX_PLACES = 3;
/** 管理人訪問のお店と同じ店とみなす距離（m） */
const SAME_SHOP_M = 150;

/**
 * 同じ地点を同じ画面で二度検索しないための記憶。画面を開いている間だけ（ページを読み込み直すと消える）。
 * ファイル・データベース・ブラウザの保存領域には書かない。
 */
const searched = new Map<string, Promise<GooglePlace[]>>();

function fetchPlaces(lat: number, lng: number, lang: string): Promise<GooglePlace[]> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = searched.get(key);
  if (cached) return cached;
  const promise = fetch(`/api/dog-places?lat=${lat}&lng=${lng}&lang=${encodeURIComponent(lang)}`)
    .then((r) => (r.ok ? r.json() : { places: [] }))
    .then((d) => (Array.isArray(d.places) ? (d.places as GooglePlace[]) : []))
    .catch(() => [] as GooglePlace[]);
  searched.set(key, promise);
  return promise;
}

function normalize(name: string): string {
  return name.replace(/[\s　・･\-ー]/g, "").toLowerCase();
}

/**
 * 【確認用の隠しスイッチ】URL に ?dogtest=1 が付いているときだけ、検索と表示を行う。
 * 全員に公開するときは、この定数を true にし、下の useEffect 内の dogtest の判定（isTestSwitchOn）を外す。
 */
const PUBLIC_RELEASE = false;

function isTestSwitchOn(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("dogtest") === "1";
  } catch {
    return false;
  }
}

/** 犬連れモードの食事地点で、Google の情報で犬同伴可のお店を別の囲みで表示する。何も無い・失敗したときは何も出さない */
export default function GoogleDogPlaces({
  lat,
  lng,
  visitedShops,
}: {
  lat: number;
  lng: number;
  /** 管理人訪問のお店（同じ店が両方に出ないよう、こちらを優先する） */
  visitedShops: DogFriendlyShop[];
}) {
  const { t, lang } = useTripLang();
  const [places, setPlaces] = useState<GooglePlace[]>([]);

  useEffect(() => {
    // スイッチが無いときは、Googleへの検索を一切しない
    if (!PUBLIC_RELEASE && !isTestSwitchOn()) return;
    let cancelled = false;
    fetchPlaces(lat, lng, lang).then((r) => {
      if (!cancelled) setPlaces(r);
    });
    return () => {
      cancelled = true;
    };
    // 言語を切り替えても検索し直さない（同じ地点は記憶した結果を使う）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  const shown = places
    .filter(
      (p) =>
        !visitedShops.some(
          (s) =>
            distanceKm(p.lat, p.lng, s.lat, s.lng) * 1000 < SAME_SHOP_M ||
            normalize(p.name) === normalize(s.name)
        )
    )
    .map((p) => ({ place: p, km: distanceKm(lat, lng, p.lat, p.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, MAX_PLACES);

  if (shown.length === 0) return null;

  return (
    <div className="mt-1.5 rounded border border-sky-200 bg-sky-50 px-2 py-1.5">
      <p className="text-[11px] font-bold text-sky-800">{t.itinerary.googleDogPlaces.title}</p>
      <ul className="mt-1 space-y-0.5">
        {shown.map(({ place, km }) => (
          <li key={place.id} className="text-[11px] text-slate-600 leading-relaxed">
            <a
              href={place.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:underline"
            >
              <PawPrint className="w-3 h-3 shrink-0 text-sky-600" />
              {place.name}
            </a>
            <span className="ml-1.5 text-slate-400">
              {t.itinerary.visitedDogShops.distance.replace(
                "{km}",
                km < 1 ? km.toFixed(1) : String(Math.round(km))
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">
        <span translate="no" className="whitespace-nowrap">Google Maps</span>
        {" ・ "}
        {t.itinerary.googleDogPlaces.note}
      </p>
    </div>
  );
}
