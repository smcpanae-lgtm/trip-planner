"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { exportEntries, importEntries } from "@/lib/lifemap/backup";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";

// バックアップ（書き出し）・復元（読み込み）ボタン。
// 全記録を1つのJSONファイルとして端末に保存／復元する（サーバー不使用）。
export default function BackupButtons({
  entries,
  onRestored,
}: {
  entries: LifeMapEntry[];
  onRestored: (entries: LifeMapEntry[]) => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    setMessage(null);
    if (entries.length === 0) {
      setError(t("backup.exportEmpty"));
      return;
    }
    try {
      exportEntries(entries);
      setMessage(t("backup.exportSuccess"));
    } catch {
      setError(t("backup.exportError"));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setMessage(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { entries: restored, imported } = await importEntries(file);
      onRestored(restored);
      setMessage(t("backup.importSuccess", { count: imported }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("backup.importError")
      );
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[11px] bg-[#F6F1E8] hover:bg-[#F1EADA] border border-[#E4DCCC] text-[#4A443B] text-[12.5px] font-semibold transition-all"
        >
          <Download className="w-4 h-4" />
          {t("backup.exportBtn")}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[11px] bg-[#F6F1E8] hover:bg-[#F1EADA] border border-[#E4DCCC] text-[#4A443B] text-[12.5px] font-semibold transition-all"
        >
          <Upload className="w-4 h-4" />
          {t("backup.importBtn")}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        className="hidden"
      />

      <p className="text-[11.5px] leading-relaxed text-[#8A8172]">{t("backup.hint")}</p>

      {message && <p className="text-xs text-[#1C7A66]">{message}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
