"use client";

import { useRef } from "react";
import { Camera, Image as ImageIcon, Plus, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";

// 写真アップロード。1枚選択・カメラ撮影・複数枚一括追加の3導線を用意。
export default function PhotoUploader({
  onSelect,
  onSelectMultiple,
  previewUrl,
  processing,
}: {
  onSelect: (file: File) => void;
  onSelectMultiple?: (files: File[]) => void;
  previewUrl: string | null;
  processing: boolean;
}) {
  const { t } = useTranslation();
  const libRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const bulkRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  };

  const handleBulkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onSelectMultiple) {
      onSelectMultiple(Array.from(files));
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => libRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[14px] bg-[#2B2721] hover:opacity-90 text-white font-bold shadow-[0_6px_16px_rgba(43,39,33,.16)] transition-all"
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-sm">{t("photo.selectBtn")}</span>
        </button>
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[14px] bg-[#F6F1E8] hover:bg-[#F1EADA] text-[#4A443B] border border-[#E4DCCC] font-bold transition-all"
        >
          <Camera className="w-6 h-6" />
          <span className="text-sm">{t("photo.cameraBtn")}</span>
        </button>
      </div>

      {onSelectMultiple && (
        <>
          <button
            type="button"
            onClick={() => bulkRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[13px] border-2 border-dashed border-[#DDD4C3] hover:border-[#C9BEA6] bg-white text-[#6B6357] font-semibold text-sm transition-all"
          >
            <Plus className="w-[18px] h-[18px]" />
            {t("photo.bulkBtn")}
          </button>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-[#7A6535] bg-[#FBF3E4] border border-[#F0E2C6] rounded-xl px-3.5 py-3">
            <AlertTriangle className="w-[17px] h-[17px] mt-0.5 shrink-0 text-[#B8791E]" />
            {t("photo.bulkHint")}
          </p>
          <input
            ref={bulkRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulkChange}
            className="hidden"
          />
        </>
      )}

      <input
        ref={libRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {processing && (
        <div className="flex items-center gap-2 text-sm text-[#6B6357]">
          <div className="w-4 h-4 border-2 border-[#C9BEA6] border-t-transparent rounded-full animate-spin" />
          {t("photo.loading")}
        </div>
      )}

      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-[#E4DCCC]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t("photo.previewAlt")}
            className="w-full max-h-72 object-contain bg-[#F6F1E8]"
          />
        </div>
      )}
    </div>
  );
}
