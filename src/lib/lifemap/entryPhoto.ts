import type { LifeMapEntry } from "@/types/lifemap";

/**
 * その記録が写真を持っているか。
 *
 * 記録カードの「この記録で作る」ボタンの有効／無効と、
 * タイムラインで「この旅行で作る」を出すかどうかの判定に使う。
 * 片方だけ条件が変わるとボタンが両方消える／両方出るため、必ずこの関数を共有すること。
 */
export function hasSavedPhoto(entry: LifeMapEntry): boolean {
  return Boolean(entry.imageDataUrl || entry.thumbnailDataUrl);
}
