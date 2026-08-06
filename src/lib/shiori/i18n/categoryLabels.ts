import type { LifeMapCategory } from "@/types/lifemap";
import { CUSTOM_CAT_VALUES, getCategory } from "@/lib/lifemap/categories";

/**
 * AI旅行記メーカーの出力言語。ShioriClient / ShioriPrintDocument と同じ7言語。
 */
export type ShioriLanguage = "ja" | "en" | "zh-CN" | "fr" | "ko" | "zh-TW" | "de";

/**
 * カテゴリ表示名の多言語版。
 *
 * 日本語は src/lib/lifemap/categories.ts の label と同じ文言をそのまま使うため、ここには持たない
 * （getCategory().label を参照する）。ja以外だけをここで定義し、未定義の言語は英語にフォールバックする。
 *
 * en / zh-CN / ko / zh-TW は人生体験マップの辞書（src/lib/lifemap/i18n/dictionaries.ts の categories）と
 * 同じ文言に揃えてある。同辞書に無い fr / de のみ新規に用意した。
 * 辞書そのものを import すると2,000行超の辞書が旅行記メーカーのバンドルに入るため、文言だけを持つ。
 */
const CATEGORY_LABELS: Partial<Record<ShioriLanguage, Record<LifeMapCategory, string>>> = {
  en: {
    travel: "Travel",
    fishing: "Fishing",
    food: "Dining",
    dog: "Dog trip",
    onsen: "Hot spring",
    castle: "Castle",
    friends: "With friends",
    family: "Family",
    other: "Other",
    other1: "Custom 1",
    other2: "Custom 2",
    other3: "Custom 3",
  },
  "zh-CN": {
    travel: "旅行",
    fishing: "钓鱼",
    food: "美食",
    dog: "遛狗",
    onsen: "温泉",
    castle: "城堡",
    friends: "与朋友同行",
    family: "家庭",
    other: "其他",
    other1: "其他①",
    other2: "其他②",
    other3: "其他③",
  },
  fr: {
    travel: "Voyage",
    fishing: "Pêche",
    food: "Gastronomie",
    dog: "Balade avec le chien",
    onsen: "Source chaude",
    castle: "Château",
    friends: "Entre amis",
    family: "Famille",
    other: "Autre",
    other1: "Perso. 1",
    other2: "Perso. 2",
    other3: "Perso. 3",
  },
  ko: {
    travel: "여행",
    fishing: "낚시",
    food: "식사",
    dog: "반려견 동행",
    onsen: "온천",
    castle: "성",
    friends: "친구와 함께",
    family: "가족",
    other: "기타",
    other1: "기타①",
    other2: "기타②",
    other3: "기타③",
  },
  "zh-TW": {
    travel: "旅行",
    fishing: "釣魚",
    food: "美食",
    dog: "遛狗",
    onsen: "溫泉",
    castle: "城堡",
    friends: "與朋友同行",
    family: "家庭",
    other: "其他",
    other1: "其他①",
    other2: "其他②",
    other3: "其他③",
  },
  de: {
    travel: "Reise",
    fishing: "Angeln",
    food: "Essen",
    dog: "Mit Hund unterwegs",
    onsen: "Heiße Quelle",
    castle: "Burg",
    friends: "Mit Freunden",
    family: "Familie",
    other: "Sonstiges",
    other1: "Eigene 1",
    other2: "Eigene 2",
    other3: "Eigene 3",
  },
};

/**
 * 出力言語に合わせたカテゴリ表示名を返す。
 *
 * 「その他①〜③」はユーザーが人生体験マップで自由に名前を変えられるため、
 * 変更済みのラベルがある場合は言語に関係なくそのユーザーの入力をそのまま使う。
 * 日本語は categories.ts の定義をそのまま返すので、日本語表示は従来と一致する。
 */
export function shioriCategoryLabel(
  language: ShioriLanguage,
  category: LifeMapCategory,
  customLabels: Record<string, string>
): string {
  if ((CUSTOM_CAT_VALUES as readonly string[]).includes(category) && customLabels[category]) {
    return customLabels[category];
  }
  const fallback = getCategory(category);
  if (language === "ja") return fallback.label;
  const table = CATEGORY_LABELS[language] ?? CATEGORY_LABELS.en;
  return table?.[fallback.value] ?? fallback.label;
}
