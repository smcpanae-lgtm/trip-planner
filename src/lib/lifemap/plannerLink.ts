import type { LifeMapEntry } from "@/types/lifemap";
import { getCategory } from "./categories";
import { getPrefecture } from "./prefectures";

// 記録の表示用の代表座標を返す（GPSがあればそれ、無ければ都道府県代表点）
export function resolveEntryLatLng(
  entry: LifeMapEntry
): { lat: number; lng: number } | null {
  if (entry.lat != null && entry.lng != null) {
    return { lat: entry.lat, lng: entry.lng };
  }
  if (entry.prefecture) {
    const pref = getPrefecture(entry.prefecture);
    if (pref) return { lat: pref.lat, lng: pref.lng };
  }
  return null;
}

// 目的地名（場所名 > 都道府県名 > カテゴリ表示名）
export function resolveDestinationName(entry: LifeMapEntry): string {
  if (entry.locationName) return entry.locationName;
  if (entry.prefecture) return entry.prefecture;
  return getCategory(entry.category).label;
}

// 座標が日本国内かどうかを判定
export function isJapanCoord(lat: number, lng: number): boolean {
  return lat >= 24 && lat <= 46 && lng >= 122 && lng <= 146;
}

// Google Maps リンクを生成（海外エントリー用）
export function buildGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// 複数記録からドライブプランリンクを生成（?destinations=A|B&lats=...&lngs=...）
export function buildMultiPlannerLink(entries: LifeMapEntry[]): string {
  const names: string[] = [];
  const lats: string[] = [];
  const lngs: string[] = [];
  for (const entry of entries) {
    const pos = resolveEntryLatLng(entry);
    if (!pos) continue;
    names.push(resolveDestinationName(entry));
    lats.push(pos.lat.toFixed(6));
    lngs.push(pos.lng.toFixed(6));
  }
  const params = new URLSearchParams();
  params.set("destinations", names.join("|"));
  params.set("lats", lats.join("|"));
  params.set("lngs", lngs.join("|"));
  params.set("source", "life-map-drive");
  return `/?${params.toString()}`;
}

// AIドライブプランナー（メインページ）への再訪プラン作成リンクを生成
export function buildPlannerLink(entry: LifeMapEntry): string {
  const params = new URLSearchParams();
  params.set("destination", resolveDestinationName(entry));
  const latlng = resolveEntryLatLng(entry);
  if (latlng) {
    params.set("lat", latlng.lat.toFixed(6));
    params.set("lng", latlng.lng.toFixed(6));
  }
  params.set("source", "life-map");
  params.set("category", entry.category);
  return `/?${params.toString()}`;
}
