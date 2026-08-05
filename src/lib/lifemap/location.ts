import type { LocationPrecision } from "@/types/lifemap";

// 場所ぼかし（プライバシー保護）
// approximate: 小数点第2位程度に丸める（およそ数百m〜1km程度ずれる）
// 釣り場・自宅近くなどの正確な位置を不用意に残さないための簡易実装
export function blurLocation(
  lat: number,
  lng: number
): { lat: number; lng: number } {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return { lat: round2(lat), lng: round2(lng) };
}

// "35.796402, 139.531056" のように緯度経度が一括で貼り付けられた文字列を分解する
// Googleマップの座標表示をそのまま貼り付けられるようにするための補助
export function parseLatLngPair(
  text: string
): { lat: number; lng: number } | null {
  const matched = text
    .trim()
    .match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*[,、\s]\s*(-?\d+(?:\.\d+)?)\s*\)?$/);
  if (!matched) return null;
  const lat = parseFloat(matched[1]);
  const lng = parseFloat(matched[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// 保存精度に応じて緯度経度を加工する
// exact: そのまま / approximate: ぼかす / prefecture: 緯度経度は持たない（呼び出し側で都道府県代表点を使う）
export function applyPrecision(
  lat: number | undefined,
  lng: number | undefined,
  precision: LocationPrecision
): { lat?: number; lng?: number } {
  if (lat == null || lng == null) return {};
  if (precision === "approximate") return blurLocation(lat, lng);
  if (precision === "prefecture") return {};
  return { lat, lng };
}
