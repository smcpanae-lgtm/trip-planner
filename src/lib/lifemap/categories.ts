import type { LifeMapCategory } from "@/types/lifemap";

// カテゴリ定義（内部値・日本語表示名・絵文字アイコン・色）
// 色はグレー基調のデザインに馴染む、彩度を抑えたトーンで統一
export interface CategoryDef {
  value: LifeMapCategory;
  label: string;
  emoji: string;
  color: string; // ピン・バッジの基調色
}

export const CATEGORIES: CategoryDef[] = [
  { value: "travel", label: "旅行", emoji: "🧳", color: "#475569" },
  { value: "fishing", label: "釣り", emoji: "🎣", color: "#0e7490" },
  { value: "food", label: "食事", emoji: "🍽️", color: "#b45309" },
  { value: "dog", label: "犬連れ", emoji: "🐕", color: "#92722f" },
  { value: "onsen", label: "温泉", emoji: "♨️", color: "#be7c4d" },
  { value: "castle", label: "お城", emoji: "🏯", color: "#6b6256" },
  { value: "friends", label: "お友達と", emoji: "👫", color: "#7c6b9e" },
  { value: "family", label: "家族", emoji: "👨‍👩‍👧", color: "#2e7d5e" },
  { value: "other", label: "その他", emoji: "📍", color: "#64748b" },
];

const CATEGORY_MAP: Record<LifeMapCategory, CategoryDef> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.value] = c;
    return acc;
  },
  {} as Record<LifeMapCategory, CategoryDef>
);

export function getCategory(value: LifeMapCategory): CategoryDef {
  return CATEGORY_MAP[value] ?? CATEGORY_MAP.other;
}
