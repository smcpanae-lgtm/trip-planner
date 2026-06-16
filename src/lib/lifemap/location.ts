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
