"use client";

import { useRef } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";

// 写真アップロード。ライブラリ選択とカメラ撮影の2導線を用意。
// capture属性に非対応の環境でも、通常の写真選択は機能する。
export default function PhotoUploader({
  onSelect,
  previewUrl,
  processing,
}: {
  onSelect: (file: File) => void;
  previewUrl: string | null;
  processing: boolean;
}) {
  const { t } = useTranslation();
  const libRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
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
