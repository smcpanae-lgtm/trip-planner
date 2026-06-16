"use client";

import { useRef } from "react";
import { Camera, ImagePlus, Images } from "lucide-react";
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
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => libRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold shadow-md transition-all"
        >
          <ImagePlus className="w-7 h-7" />
          <span className="text-sm">{t("photo.selectBtn")}</span>
        </button>
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold transition-all"
        >
          <Camera className="w-7 h-7" />
          <span className="text-sm">{t("photo.cameraBtn")}</span>
        </button>
      </div>

      {onSelectMultiple && (
        <>
          <button
            type="button"
            onClick={() => bulkRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white text-slate-600 hover:text-slate-800 font-medium text-sm transition-all"
          >
            <Images className="w-5 h-5" />
            {t("photo.bulkBtn")}
          </button>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            ⚠️ {t("photo.bulkHint")}
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
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          {t("photo.loading")}
        </div>
      )}

      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t("photo.previewAlt")}
            className="w-full max-h-72 object-contain bg-slate-50"
          />
        </div>
      )}
    </div>
  );
}
