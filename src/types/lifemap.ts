// 人生体験マップ（Life Map）の型定義

// カテゴリの内部値
export type LifeMapCategory =
  | "travel"
  | "fishing"
  | "food"
  | "dog"
  | "onsen"
  | "castle"
  | "friends"
  | "family"
  | "other"
  | "other1"
  | "other2"
  | "other3";

// 場所の保存精度（プライバシー保護）
export type LocationPrecision = "exact" | "approximate" | "prefecture";

// EXIF読取結果
export type ExifLocationResult = {
  lat?: number;
  lng?: number;
  takenAt?: string; // "YYYY-MM-DD"
  hasGps: boolean;
};

// 1件の記録
export interface LifeMapEntry {
  id: string;
  imageDataUrl: string; // 圧縮済み表示用画像
  thumbnailDataUrl: string; // サムネイル
  category: LifeMapCategory;
  date: string; // "YYYY-MM-DD"
  memo?: string;
  lat?: number;
  lng?: number;
  prefecture?: string; // 都道府県名（例: 長野県）
  locationName?: string; // 任意の場所名メモ
  locationPrecision: LocationPrecision;
  createdAt: string; // ISO文字列
  updatedAt: string; // ISO文字列
}
