"use client";

import { useState } from "react";
import {
  MapPin,
  Calendar,
  Save,
  AlertCircle,
  Map as MapIcon,
  Building2,
  Ban,
  ShieldCheck,
  Pencil,
  Navigation,
  X,
} from "lucide-react";
import PhotoUploader from "./PhotoUploader";
import { CATEGORIES, CUSTOM_CAT_VALUES, type CustomCatKey } from "@/lib/lifemap/categories";
import { PREFECTURES } from "@/lib/lifemap/prefectures";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import type {
  LifeMapCategory,
  LocationPrecision,
  ExifLocationResult,
} from "@/types/lifemap";

// 記録追加フォームの下書き状態
export type LocationMode = "gps" | "map" | "prefecture" | "coords" | "none";

export interface Draft {
  imageDataUrl: string;
  thumbnailDataUrl: string;
  processing: boolean;
  exif: ExifLocationResult | null;
  category: LifeMapCategory;
  date: string;
  memo: string;
  prefecture: string;
  locationName: string;
  precision: LocationPrecision;
  lat?: number;
  lng?: number;
  locationMode: LocationMode;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function createEmptyDraft(): Draft {
  return {
    imageDataUrl: "",
    thumbnailDataUrl: "",
    processing: false,
    exif: null,
    category: "travel",
    date: todayStr(),
    memo: "",
    prefecture: "",
    locationName: "",
    precision: "exact",
    lat: undefined,
    lng: undefined,
    locationMode: "none",
  };
}

interface Props {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onPhotoSelect: (file: File) => void;
  onSelectMultiple?: (files: File[]) => void;
  pickMode: boolean;
  onTogglePick: (on: boolean) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}

export default function LifeMapEntryForm({
  draft,
  onChange,
  onPhotoSelect,
  onSelectMultiple,
  pickMode,
  onTogglePick,
  onSave,
  saving,
  error,
}: Props) {
  const { t, homeCountry, updateCustomCatLabel } = useTranslation();
  const [editingCatKey, setEditingCatKey] = useState<CustomCatKey | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const hasImage = !!draft.imageDataUrl;
  const hasGps = draft.exif?.hasGps;

  const precisionOptions: { value: LocationPrecision; label: string }[] = [
    { value: "exact", label: t("form.precisionExact") },
    { value: "approximate", label: t("form.precisionApprox") },
  ];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 space-y-5">
      <h2 className="font-bold text-lg flex items-center gap-2">
        <MapPin className="w-5 h-5 text-slate-600" />
        {t("form.sectionTitle")}
      </h2>

      <PhotoUploader
        onSelect={onPhotoSelect}
        onSelectMultiple={onSelectMultiple}
        previewUrl={draft.imageDataUrl || null}
        processing={draft.processing}
      />

      {hasImage && (
        <>
          {/* 位置情報の状態表示 */}
          {hasGps ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {t("form.gpsSuccess")}
                <br />
                <span className="text-xs text-emerald-600">
                  {t("form.gpsSuccessHint")}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-sm text-amber-700">{t("form.noGps")}</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange({ locationMode: "map", prefecture: "" });
                    onTogglePick(true);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    draft.locationMode === "map"
                      ? "border-slate-500 bg-slate-50 text-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  {t("form.mapMode")}
                </button>
                {homeCountry.isJapan && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        locationMode: "prefecture",
                        lat: undefined,
                        lng: undefined,
                        precision: "prefecture",
                      });
                      onTogglePick(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      draft.locationMode === "prefecture"
                        ? "border-slate-500 bg-slate-50 text-slate-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {t("form.prefMode")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      locationMode: "coords",
                      lat: undefined,
                      lng: undefined,
                      prefecture: "",
                      precision: "exact",
                    });
                    onTogglePick(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    draft.locationMode === "coords"
                      ? "border-slate-500 bg-slate-50 text-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  {t("form.coordsMode")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      locationMode: "none",
                      lat: undefined,
                      lng: undefined,
                      prefecture: "",
                    });
                    onTogglePick(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    draft.locationMode === "none"
                      ? "border-slate-500 bg-slate-50 text-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  {t("form.noneMode")}
                </button>
              </div>

              {draft.locationMode === "map" && (
                <p className="text-xs text-slate-500">
                  {pickMode
                    ? t("form.mapTapHint")
                    : draft.lat != null
                    ? t("form.mapTapDone")
                    : ""}
                </p>
              )}

              {draft.locationMode === "coords" && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-500">{t("form.coordsHint")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t("form.coordsLatLabel")}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="35.6762"
                        value={draft.lat ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onChange({ lat: isNaN(val) ? undefined : val });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t("form.coordsLngLabel")}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="139.6503"
                        value={draft.lng ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onChange({ lng: isNaN(val) ? undefined : val });
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm"
                      />
                    </div>
                  </div>
                  {draft.lat != null && draft.lng != null && (
                    <p className="text-xs text-emerald-600">✅ {t("form.mapTapDone")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 都道府県プルダウン（都道府県登録時） */}
          {draft.locationMode === "prefecture" && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                {t("form.prefLabel")}
              </label>
              <select
                value={draft.prefecture}
                onChange={(e) => onChange({ prefecture: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm bg-white"
              >
                <option value="">{t("form.prefSelect")}</option>
                {PREFECTURES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* カテゴリ（必須） */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              {t("form.catLabel")}{" "}
              <span className="text-red-500 text-xs">{t("form.catRequired")}</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((c) => {
                const isCustom = (CUSTOM_CAT_VALUES as readonly string[]).includes(c.value);
                return (
                  <div key={c.value} className="relative">
                    <button
                      type="button"
                      onClick={() => onChange({ category: c.value })}
                      className={`w-full flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                        draft.category === c.value
                          ? "border-slate-600 bg-slate-50 text-slate-800"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg leading-none">{c.emoji}</span>
                      {t(`categories.${c.value}`)}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCatKey(c.value as CustomCatKey);
                          setEditDraft(t(`categories.${c.value}`));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-400 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title={t("form.editCategoryBtn")}
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* カテゴリ名インライン編集 */}
            {editingCatKey && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-slate-600">{t("form.editCategoryBtn")}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    placeholder="🏕️ キャンプ"
                    maxLength={20}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editDraft.trim()) updateCustomCatLabel(editingCatKey, editDraft.trim());
                      setEditingCatKey(null);
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCatKey(null)}
                    className="px-2 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 日付 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
              <Calendar className="w-4 h-4" />
              {t("form.dateLabel")}
            </label>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              {t("form.memoLabel")}{" "}
              <span className="text-slate-400 text-xs font-normal">
                {t("form.memoOptional")}
              </span>
            </label>
            <textarea
              value={draft.memo}
              onChange={(e) => onChange({ memo: e.target.value })}
              placeholder={t("form.memoPlaceholder")}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm resize-y"
            />
          </div>

          {/* 場所名（任意） */}
          {draft.locationMode !== "none" && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                {t("form.locationNameLabel")}{" "}
                <span className="text-slate-400 text-xs font-normal">
                  {t("form.locationNameOptional")}
                </span>
              </label>
              <input
                type="text"
                value={draft.locationName}
                onChange={(e) => onChange({ locationName: e.target.value })}
                placeholder={t("form.locationNamePlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 outline-none text-sm"
              />
            </div>
          )}

          {/* 場所ぼかし（保存精度） */}
          {draft.locationMode !== "none" && draft.locationMode !== "prefecture" && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                {t("form.precisionLabel")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {precisionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ precision: opt.value })}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      draft.precision === opt.value
                        ? "border-slate-600 bg-slate-50 text-slate-800"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                {t("form.precisionHint")}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={saving || draft.processing}
            className="w-full py-3.5 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition-all text-base flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("form.saving")}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t("form.saveBtn")}
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
