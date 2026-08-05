"use client";

import { useEffect, useState } from "react";
import {
  X,
  Save,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Navigation,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { LifeMapEntry, LocationPrecision } from "@/types/lifemap";
import { CATEGORIES } from "@/lib/lifemap/categories";
import { PREFECTURES } from "@/lib/lifemap/prefectures";
import { applyPrecision, parseLatLngPair } from "@/lib/lifemap/location";
import { reverseGeocodeRegion } from "@/lib/geocoding";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";

// 保存済みの記録を編集するモーダル。
// 写真は差し替えず、カテゴリ・日付・メモ・場所（緯度経度／都道府県）などを修正する。
export default function LifeMapEditModal({
  entry,
  onClose,
  onSave,
  saving,
  error,
}: {
  entry: LifeMapEntry;
  onClose: () => void;
  onSave: (updated: LifeMapEntry) => void;
  saving: boolean;
  error: string | null;
}) {
  const { t } = useTranslation();

  const [category, setCategory] = useState(entry.category);
  const [date, setDate] = useState(entry.date);
  const [memo, setMemo] = useState(entry.memo ?? "");
  const [locationName, setLocationName] = useState(entry.locationName ?? "");
  const [prefecture, setPrefecture] = useState(entry.prefecture ?? "");
  const [lat, setLat] = useState<number | undefined>(entry.lat);
  const [lng, setLng] = useState<number | undefined>(entry.lng);
  const [precision, setPrecision] = useState<"exact" | "approximate">(
    entry.locationPrecision === "approximate" ? "approximate" : "exact"
  );

  // 座標から都道府県を判定した結果の表示用ステータス
  const [lookup, setLookup] = useState<
    { state: "idle" } | { state: "loading" } | { state: "done"; name: string }
  >({ state: "idle" });

  // Escキーで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 緯度・経度を変更したら都道府県を自動で判定し直す。
  // 元の座標のままなら問い合わせない。
  const coordsChanged = lat !== entry.lat || lng !== entry.lng;
  useEffect(() => {
    if (!coordsChanged) return;
    if (lat == null || lng == null) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    let cancelled = false;
    setLookup({ state: "loading" });
    const timer = setTimeout(() => {
      reverseGeocodeRegion(lat, lng).then((pref) => {
        if (cancelled) return;
        if (pref) {
          setPrefecture(pref);
          setLookup({ state: "done", name: pref });
        } else {
          setLookup({ state: "idle" });
        }
      });
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lat, lng, coordsChanged]);

  function handleSubmit() {
    const hasCoords = lat != null && lng != null;
    const trimmedPref = prefecture.trim();

    // 座標があれば選んだ精度、無ければ都道府県のみ／場所なしとして扱う
    const nextPrecision: LocationPrecision = hasCoords
      ? precision
      : trimmedPref
      ? "prefecture"
      : "exact";

    const applied = applyPrecision(lat, lng, nextPrecision);

    onSave({
      ...entry,
      category,
      date,
      memo: memo.trim() || undefined,
      locationName: locationName.trim() || undefined,
      prefecture: trimmedPref || undefined,
      lat: applied.lat,
      lng: applied.lng,
      locationPrecision: nextPrecision,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[18px] w-full max-w-[520px] my-auto shadow-[0_16px_34px_rgba(43,39,33,.24)] border border-[#EEE7DA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-[#EEE7DA]">
          <h2 className="font-extrabold text-base text-[#2B2721]">
            {t("edit.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("edit.closeAria")}
            className="p-1.5 rounded-lg text-[#8A8172] hover:bg-[#F6F1E8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-[22px] py-5 space-y-5">
          {/* 写真プレビュー（変更不可） */}
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.thumbnailDataUrl}
              alt=""
              className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#F6F1E8]"
            />
            <p className="text-[11.5px] text-[#8A8172] leading-relaxed">
              {t("edit.photoLocked")}
            </p>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="text-sm font-medium text-[#4A443B] mb-1.5 block">
              {t("form.catLabel")}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                    category === c.value
                      ? "border-[#1C7A66] bg-[#EAF3F0] text-[#145E4E]"
                      : "border-[#E4DCCC] bg-white text-[#8A8172] hover:border-[#C9BEA6]"
                  }`}
                >
                  <span className="text-lg leading-none">{c.emoji}</span>
                  {t(`categories.${c.value}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 日付 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#4A443B] mb-1.5">
              <Calendar className="w-4 h-4" />
              {t("form.dateLabel")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E4DCCC] focus:border-[#1C7A66] focus:ring-2 focus:ring-[#EAF3F0] outline-none text-sm"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="text-sm font-medium text-[#4A443B] mb-1.5 block">
              {t("form.memoLabel")}{" "}
              <span className="text-[#A79E8C] text-xs font-normal">
                {t("form.memoOptional")}
              </span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E4DCCC] focus:border-[#1C7A66] focus:ring-2 focus:ring-[#EAF3F0] outline-none text-sm resize-y"
            />
          </div>

          {/* 緯度・経度 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-[#4A443B] mb-1.5">
              <Navigation className="w-4 h-4" />
              {t("form.coordsMode")}
            </label>
            <p className="text-xs text-[#8A8172] mb-2">{t("form.coordsHint")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-[#8A8172] mb-1 block">
                  {t("form.coordsLatLabel")}
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="35.6762"
                  value={lat ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLat(isNaN(val) ? undefined : val);
                  }}
                  onPaste={(e) => {
                    const pair = parseLatLngPair(e.clipboardData.getData("text"));
                    if (!pair) return;
                    e.preventDefault();
                    setLat(pair.lat);
                    setLng(pair.lng);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DCCC] focus:border-[#1C7A66] focus:ring-2 focus:ring-[#EAF3F0] outline-none text-sm"
                />
              </div>
              <div>
                <span className="text-xs text-[#8A8172] mb-1 block">
                  {t("form.coordsLngLabel")}
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="139.6503"
                  value={lng ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLng(isNaN(val) ? undefined : val);
                  }}
                  onPaste={(e) => {
                    const pair = parseLatLngPair(e.clipboardData.getData("text"));
                    if (!pair) return;
                    e.preventDefault();
                    setLat(pair.lat);
                    setLng(pair.lng);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DCCC] focus:border-[#1C7A66] focus:ring-2 focus:ring-[#EAF3F0] outline-none text-sm"
                />
              </div>
            </div>

            {lookup.state === "loading" && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-[#8A8172]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t("edit.prefDetecting")}
              </p>
            )}
            {lookup.state === "done" && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-[#1C7A66]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("edit.prefDetected", { name: lookup.name })}
              </p>
            )}
          </div>

          {/* 都道府県（自由入力＋候補） */}
          <div>
            <label className="text-sm font-medium text-[#4A443B] mb-1.5 block">
              {t("form.prefLabel")}
            </label>
            <input
              type="text"
              list="lifemap-edit-prefectures"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              placeholder={t("form.prefSelect")}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E4DCCC] focus:border-[#1C7A66] focus:ring-2 focus:ring-[#EAF3F0] outline-none text-sm"
            />
            <datalist id="lifemap-edit-prefectures">
              {PREFECTURES.map((p) => (
                <option key={p.name} value={p.name} />
              ))}
            </datalist>
          </div>

          {/* 場所名 */}
          <div>
            <label className="text-sm font-medium text-[#4A443B] mb-1.5 block">
              {t("form.locationNameLabel")}{" "}
              <span className="text-[#A79E8C] text-xs font-normal">
                {t("form.locationNameOptional")}
              </span>
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={t("form.locationNamePlaceholder")}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E4DCCC] focus:border-[#1C7A66] focus:ring-2 focus:ring-[#EAF3F0] outline-none text-sm"
            />
          </div>

          {/* 保存精度 */}
          {lat != null && lng != null && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#4A443B] mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                {t("form.precisionLabel")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "exact", label: t("form.precisionExact") },
                    { value: "approximate", label: t("form.precisionApprox") },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrecision(opt.value)}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      precision === opt.value
                        ? "border-[#1C7A66] bg-[#EAF3F0] text-[#145E4E]"
                        : "border-[#E4DCCC] bg-white text-[#8A8172] hover:border-[#C9BEA6]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {precision === "approximate" && (
                <p className="mt-1.5 text-xs text-[#7A6535] bg-[#FBF3E4] border border-[#F0E2C6] rounded-lg px-3 py-2 leading-relaxed">
                  {t("edit.precisionWarn")}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* フッター操作 */}
        <div className="flex items-center gap-2 px-[22px] py-4 border-t border-[#EEE7DA]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] border border-[#E4DCCC] bg-white hover:bg-[#F6F1E8] text-[#6B6357] text-sm font-semibold transition-all"
          >
            {t("edit.cancelBtn")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-[2] py-3 rounded-[12px] bg-[#2B2721] hover:opacity-90 disabled:bg-[#C9BEA6] text-white text-sm font-bold shadow-[0_6px_16px_rgba(43,39,33,.16)] transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("form.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("edit.saveBtn")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
