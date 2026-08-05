// 47都道府県のタイル型日本地図データ。
// 都道府県を等サイズの角丸タイルで表し、日本の地理配置に近い形でグリッドに並べる。
// シェア画像（Canvas）で「制覇マップ」を描くために使用する。
// 外部データやライブラリは使わず、この配置表だけで完結する。

export interface PrefectureTile {
  /** prefectures.ts / entry.prefecture と同じ正式名称（例: 長野県） */
  name: string;
  /** 列（0が西寄り・最大12） */
  col: number;
  /** 行（0が北・最大10） */
  row: number;
  /** タイル内に描く日本語の短縮名（2〜3文字） */
  short: string;
  /** 日本語以外の言語で使うローマ字略号（3文字） */
  roman: string;
}

export const TILE_COLS = 13;
export const TILE_ROWS = 11;

// 配置イメージ（行=北から南、列=西から東）
//
//  row0                                              北海道
//  row1                                          青森
//  row2                                      秋田 岩手
//  row3                                      山形 宮城
//  row4                                      新潟 福島
//  row5                          石川 富山 群馬 栃木 茨城
//  row6                島根 鳥取 兵庫 京都 福井 岐阜 長野 埼玉 千葉
//  row7      長崎 佐賀 福岡 広島 岡山 大阪 奈良 滋賀 愛知 山梨 東京
//  row8           熊本 大分 山口 愛媛 香川 和歌 三重 静岡 神奈
//  row9           鹿児 宮崎      高知 徳島
//  row10 沖縄
export const PREFECTURE_TILES: PrefectureTile[] = [
  { name: "北海道", col: 12, row: 0, short: "北海道", roman: "HKD" },

  { name: "青森県", col: 11, row: 1, short: "青森", roman: "AOM" },

  { name: "秋田県", col: 10, row: 2, short: "秋田", roman: "AKT" },
  { name: "岩手県", col: 11, row: 2, short: "岩手", roman: "IWT" },

  { name: "山形県", col: 10, row: 3, short: "山形", roman: "YGT" },
  { name: "宮城県", col: 11, row: 3, short: "宮城", roman: "MYG" },

  { name: "新潟県", col: 10, row: 4, short: "新潟", roman: "NGT" },
  { name: "福島県", col: 11, row: 4, short: "福島", roman: "FKS" },

  { name: "石川県", col: 7, row: 5, short: "石川", roman: "ISK" },
  { name: "富山県", col: 8, row: 5, short: "富山", roman: "TYM" },
  { name: "群馬県", col: 9, row: 5, short: "群馬", roman: "GNM" },
  { name: "栃木県", col: 10, row: 5, short: "栃木", roman: "TCG" },
  { name: "茨城県", col: 11, row: 5, short: "茨城", roman: "IBR" },

  { name: "島根県", col: 4, row: 6, short: "島根", roman: "SMN" },
  { name: "鳥取県", col: 5, row: 6, short: "鳥取", roman: "TTR" },
  { name: "兵庫県", col: 6, row: 6, short: "兵庫", roman: "HYG" },
  { name: "京都府", col: 7, row: 6, short: "京都", roman: "KYT" },
  { name: "福井県", col: 8, row: 6, short: "福井", roman: "FKI" },
  { name: "岐阜県", col: 9, row: 6, short: "岐阜", roman: "GIF" },
  { name: "長野県", col: 10, row: 6, short: "長野", roman: "NGN" },
  { name: "埼玉県", col: 11, row: 6, short: "埼玉", roman: "STM" },
  { name: "千葉県", col: 12, row: 6, short: "千葉", roman: "CHB" },

  { name: "長崎県", col: 1, row: 7, short: "長崎", roman: "NGS" },
  { name: "佐賀県", col: 2, row: 7, short: "佐賀", roman: "SAG" },
  { name: "福岡県", col: 3, row: 7, short: "福岡", roman: "FKO" },
  { name: "広島県", col: 4, row: 7, short: "広島", roman: "HRS" },
  { name: "岡山県", col: 5, row: 7, short: "岡山", roman: "OKY" },
  { name: "大阪府", col: 6, row: 7, short: "大阪", roman: "OSK" },
  { name: "奈良県", col: 7, row: 7, short: "奈良", roman: "NAR" },
  { name: "滋賀県", col: 8, row: 7, short: "滋賀", roman: "SIG" },
  { name: "愛知県", col: 9, row: 7, short: "愛知", roman: "AIC" },
  { name: "山梨県", col: 10, row: 7, short: "山梨", roman: "YMN" },
  { name: "東京都", col: 11, row: 7, short: "東京", roman: "TKY" },

  { name: "熊本県", col: 2, row: 8, short: "熊本", roman: "KMM" },
  { name: "大分県", col: 3, row: 8, short: "大分", roman: "OIT" },
  { name: "山口県", col: 4, row: 8, short: "山口", roman: "YMG" },
  { name: "愛媛県", col: 5, row: 8, short: "愛媛", roman: "EHM" },
  { name: "香川県", col: 6, row: 8, short: "香川", roman: "KGW" },
  { name: "和歌山県", col: 7, row: 8, short: "和歌", roman: "WKY" },
  { name: "三重県", col: 8, row: 8, short: "三重", roman: "MIE" },
  { name: "静岡県", col: 9, row: 8, short: "静岡", roman: "SZK" },
  { name: "神奈川県", col: 10, row: 8, short: "神奈", roman: "KNG" },

  { name: "鹿児島県", col: 2, row: 9, short: "鹿児", roman: "KGS" },
  { name: "宮崎県", col: 3, row: 9, short: "宮崎", roman: "MYZ" },
  { name: "高知県", col: 5, row: 9, short: "高知", roman: "KOC" },
  { name: "徳島県", col: 6, row: 9, short: "徳島", roman: "TKS" },

  { name: "沖縄県", col: 0, row: 10, short: "沖縄", roman: "OKN" },
];

/** 47都道府県の正式名称セット（海外の州・省名を除外する判定に使う） */
export const PREFECTURE_NAME_SET: ReadonlySet<string> = new Set(
  PREFECTURE_TILES.map((tile) => tile.name)
);

/**
 * 記録に入っている地域名を47都道府県の正式名称に正規化する。
 * Nominatim は accept-language=ja で「長野県」形式を返すが、
 * 手入力・旧データで「長野」のような接尾辞なしが混ざる場合に備える。
 * 47都道府県に該当しない場合（海外の州名など）は null を返す。
 */
export function normalizePrefectureName(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (PREFECTURE_NAME_SET.has(value)) return value;
  for (const suffix of ["都", "道", "府", "県"]) {
    if (PREFECTURE_NAME_SET.has(value + suffix)) return value + suffix;
  }
  return null;
}
