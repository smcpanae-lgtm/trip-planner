import { CAR_RESTRICTION_AREAS, type CarRestrictionArea } from "@/data/carRestrictions";
import type { TripLangCode } from "@/lib/i18n/tripPlannerDictionaries";
import type { ItineraryItem } from "@/types/trip";

/**
 * マイカー規制区域の判定（Google の経路は季節・通年のマイカー規制を考慮しないため、コードで警告する）。
 * 登録済みの区域（src/data/carRestrictions.ts）だけが対象で、外部APIは呼ばない。
 * 画面（Itinerary）・コピー／印刷の文章（variantToText）・サーバーの監査ログで同じ判定を使う。
 */

/** 判定に使う地点の情報（AIの出力そのまま。座標は欠けていたり 0,0 だったりする） */
export interface CarRestrictionPlace {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface CarRestrictionHit {
  area: CarRestrictionArea;
  /** その区域に当たった地点の名前（重複なし・行程の順） */
  spotNames: string[];
}

/**
 * キーワードが当たっても、座標がその区域の円からこれ以上離れていれば同名の別の場所とみなす。
 * 大正池・明神池・千畳敷・大観峰・広河原など、同じ名前の場所が各地にあるため。
 */
const KEYWORD_GUARD_KM = 50;

/** 表記ゆれを吸収する（ヶ／ケ／が、ノ／の、澤／沢、5合目／五合目、空白・中黒） */
function normalize(text: string): string {
  const KANJI_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s・]/g, "")
    .replace(/[ヶケヵが]/g, "ヶ")
    .replace(/ノ/g, "の")
    .replace(/澤/g, "沢")
    .replace(/([0-9])合目/g, (_, d: string) => `${KANJI_DIGITS[Number(d)]}合目`);
}

function validCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) <= 0.01 || Math.abs(lng) <= 0.01) return null;
  return { lat, lng };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * 地点が登録済みのマイカー規制区域に入るかを判定する。
 * 1. 名前に除外キーワード（乗り換え駐車場・規制の手前の地点など）があれば当たらない
 * 2. 名前か住所にキーワードがあれば当たる（ただし座標がその区域から大きく離れていれば別の場所とみなす）
 * 3. 座標が区域の円の中なら当たる
 * 除外キーワードを名前だけで見るのは、住所の市町村名（檜枝岐村など）で規制区域内の地点まで外さないため。
 */
export function matchCarRestrictionArea(
  place: CarRestrictionPlace,
  areas: readonly CarRestrictionArea[] = CAR_RESTRICTION_AREAS
): CarRestrictionArea | undefined {
  const name = normalize(place.name || "");
  const address = normalize(place.address || "");
  const coords = validCoords(place.lat, place.lng);

  for (const area of areas) {
    if (area.excludeKeywords?.some((k) => name.includes(normalize(k)))) continue;

    const keywordHit = area.keywords.some((k) => {
      const key = normalize(k);
      return name.includes(key) || address.includes(key);
    });
    if (keywordHit) {
      const nearestKm = coords
        ? Math.min(...area.zones.map((z) => haversineKm(z.lat, z.lng, coords.lat, coords.lng) - z.radiusKm))
        : 0;
      if (nearestKm <= KEYWORD_GUARD_KM) return area;
    }

    if (coords && area.zones.some((z) => haversineKm(z.lat, z.lng, coords.lat, coords.lng) <= z.radiusKm)) {
      return area;
    }
  }
  return undefined;
}

export function carRestrictionPlaceOf(item: ItineraryItem): CarRestrictionPlace {
  return { name: item.spot.name, address: item.address, lat: item.spot.lat, lng: item.spot.lng };
}

/** 1日分の地点を判定し、区域ごとにまとめる（区域は最初に当たった順） */
export function findCarRestrictions(places: CarRestrictionPlace[]): CarRestrictionHit[] {
  const hits = new Map<string, CarRestrictionHit>();
  for (const place of places) {
    const area = matchCarRestrictionArea(place);
    if (!area) continue;
    const hit = hits.get(area.id) ?? { area, spotNames: [] };
    hits.set(area.id, hit);
    if (place.name && !hit.spotNames.includes(place.name)) hit.spotNames.push(place.name);
  }
  return [...hits.values()];
}

export function findDayCarRestrictions(items: ItineraryItem[]): CarRestrictionHit[] {
  return findCarRestrictions(items.map(carRestrictionPlaceOf));
}

export interface CarRestrictionTexts {
  yearRound: string;
  seasonal: string;
  place: string;
  separator: string;
}

export function carRestrictionAreaName(area: CarRestrictionArea, lang: TripLangCode): string {
  return area.name[lang] ?? area.name.en;
}

/** 区域ごとの警告文。地点名が区域名と同じだけなら「区域名（地点名）」の括弧を省く */
export function formatCarRestrictionWarning(
  hit: CarRestrictionHit,
  texts: CarRestrictionTexts,
  lang: TripLangCode
): string {
  const areaName = carRestrictionAreaName(hit.area, lang);
  const sameAsArea = new Set([normalize(areaName), normalize(hit.area.name.ja)]);
  const spots = hit.spotNames.filter((n) => !sameAsArea.has(normalize(n)));
  const place =
    spots.length > 0
      ? texts.place.replace("{area}", () => areaName).replace("{spots}", () => spots.join(texts.separator))
      : areaName;
  const template = hit.area.period === "yearRound" ? texts.yearRound : texts.seasonal;
  return template.replace("{place}", () => place);
}
