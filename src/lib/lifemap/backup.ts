import type { LifeMapEntry, LifeMapCategory, LocationPrecision } from "@/types/lifemap";
import { putEntry, getAllEntries } from "./storage";

// 人生体験マップのバックアップ（書き出し）・復元（読み込み）。
// サーバーは使わず、全記録を1つのJSONファイルとして端末に保存／復元する。

const BACKUP_VERSION = 1;

interface BackupFile {
  app: "life-map";
  version: number;
  exportedAt: string;
  entries: LifeMapEntry[];
}

// 全記録をJSONファイルとしてダウンロードする
export function exportEntries(entries: LifeMapEntry[]): void {
  const payload: BackupFile = {
    app: "life-map",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  a.href = url;
  a.download = `life-map-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const CATEGORY_VALUES: LifeMapCategory[] = [
  "travel",
  "fishing",
  "food",
  "dog",
  "onsen",
  "castle",
  "other",
];
const PRECISION_VALUES: LocationPrecision[] = [
  "exact",
  "approximate",
  "prefecture",
];

// 1件分のデータが記録として妥当か検証する
function isValidEntry(x: unknown): x is LifeMapEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.imageDataUrl === "string" &&
    typeof e.thumbnailDataUrl === "string" &&
    typeof e.date === "string" &&
    CATEGORY_VALUES.includes(e.category as LifeMapCategory) &&
    PRECISION_VALUES.includes(e.locationPrecision as LocationPrecision)
  );
}

// バックアップファイルを読み込み、記録を復元する。
// 同じIDの記録は上書きし、復元後の全記録を返す。追加件数も返す。
export async function importEntries(
  file: File
): Promise<{ entries: LifeMapEntry[]; imported: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("ファイルを読み取れませんでした。バックアップ用のJSONファイルを選択してください。");
  }

  // {entries:[...]} 形式、または記録の配列そのものを許容
  let rawEntries: unknown;
  if (Array.isArray(parsed)) {
    rawEntries = parsed;
  } else if (parsed && typeof parsed === "object") {
    rawEntries = (parsed as Record<string, unknown>).entries;
  }

  if (!Array.isArray(rawEntries)) {
    throw new Error("このファイルは人生体験マップのバックアップではないようです。");
  }

  const valid = rawEntries.filter(isValidEntry);
  if (valid.length === 0) {
    throw new Error("復元できる記録が見つかりませんでした。");
  }

  for (const entry of valid) {
    await putEntry(entry);
  }

  const entries = await getAllEntries();
  return { entries, imported: valid.length };
}
