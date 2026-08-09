import type { LangCode } from "./i18n/dictionaries";

/**
 * 人生体験マップからAI旅行記メーカーへ渡すリンクを組み立てる。
 *
 * source=lifemap が無いと /shiori 側は人生体験マップの記録を読み込まず、ids も読み捨てるため
 * 必ず付ける（パース処理は ShioriClient の URLSearchParams を読むこと）。
 *
 * 英語表示のときだけ専用URLの /en/shiori へ送る。それ以外の言語は専用URLを持たないため、
 * 日本語URLのままページ内で言語を切り替える従来どおりの挙動になる。
 * 末尾スラッシュは付けない。
 *
 * @param ids 渡す記録のID。省略・空配列なら ids は付けず、/shiori 側の既定選択に任せる。
 */
export function buildJournalLink(lang: LangCode, ids?: string[]): string {
  const base = lang === "en" ? "/en/shiori" : "/shiori";
  if (!ids || ids.length === 0) return `${base}?source=lifemap`;
  return `${base}?source=lifemap&ids=${encodeURIComponent(ids.join(","))}`;
}
