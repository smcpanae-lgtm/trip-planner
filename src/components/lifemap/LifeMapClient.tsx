"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, Lock, ArrowLeft, Film, Globe, Navigation, X } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { extractExifLocation } from "@/lib/lifemap/exif";
import { compressImage } from "@/lib/lifemap/image";
import { applyPrecision } from "@/lib/lifemap/location";
import { reverseGeocodeRegion } from "@/lib/geocoding";
import {
  getAllEntries,
  putEntry,
  deleteEntry,
} from "@/lib/lifemap/storage";
import { resolveEntryLatLng, buildMultiPlannerLink } from "@/lib/lifemap/plannerLink";
import LifeMapEntryForm, {
  createEmptyDraft,
  type Draft,
} from "./LifeMapEntryForm";
import LifeMapEntryList from "./LifeMapEntryList";
import BackupButtons from "./BackupButtons";
import MemoryReplay from "./MemoryReplay";
import { CategoryLegend } from "./PrefectureSummary";
import {
  LanguageProvider,
  useTranslation,
  LANGUAGES,
  HOME_COUNTRIES,
  type LangCode,
  type HomeCountry,
} from "@/lib/lifemap/i18n/LanguageContext";

// Leafletはwindow依存のためSSRを無効化して動的読み込み
const LifeMapLeaflet = dynamic(() => import("./LifeMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-slate-100">
      <div className="w-10 h-10 border-4 border-slate-300 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const FONT_STACK =
  '"Meiryo", "メイリオ", "Hiragino Sans", "Noto Sans JP", sans-serif';

// 実体コンポーネント（LanguageProvider内で動作）
function LifeMapClientInner() {
  const { lang, setLang, t, homeCountry, setHomeCountry } = useTranslation();
  const [entries, setEntries] = useState<LifeMapEntry[]>([]);
  const [draft, setDraft] = useState<Draft>(createEmptyDraft());
  const [pickMode, setPickMode] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadErrorKey, setLoadErrorKey] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const mapRef = useRef<HTMLDivElement>(null);

  const toggleSelect = useCallback((entry: LifeMapEntry) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entry.id)) next.delete(entry.id);
      else next.add(entry.id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // 起動時にIndexedDBから記録を読み込む
  useEffect(() => {
    getAllEntries()
      .then(setEntries)
      .catch(() => setLoadErrorKey("errors.loadFailed"));
  }, []);

  const patchDraft = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  // 写真選択 → 圧縮 + EXIF解析
  const handlePhotoSelect = useCallback(
    async (file: File) => {
      setError(null);
      setPickMode(false);
      setDraft((prev) => ({
        ...prev,
        processing: true,
        imageDataUrl: "",
        thumbnailDataUrl: "",
        exif: null,
        lat: undefined,
        lng: undefined,
        prefecture: "",
        locationMode: "none",
        precision: "exact",
      }));

      try {
        const [compressed, exif] = await Promise.all([
          compressImage(file),
          extractExifLocation(file),
        ]);

        setDraft((prev) => ({
          ...prev,
          processing: false,
          imageDataUrl: compressed.imageDataUrl,
          thumbnailDataUrl: compressed.thumbnailDataUrl,
          exif,
          date: exif.takenAt || prev.date,
          ...(exif.hasGps
            ? {
                lat: exif.lat,
                lng: exif.lng,
                locationMode: "gps" as const,
                precision: "exact" as const,
              }
            : {}),
        }));

        if (exif.hasGps && exif.lat != null && exif.lng != null) {
          setFocus({ lat: exif.lat, lng: exif.lng });

          // GPS位置から都道府県を自動判定
          reverseGeocodeRegion(exif.lat, exif.lng).then((pref) => {
            if (pref) {
              setDraft((prev) =>
                prev.prefecture ? prev : { ...prev, prefecture: pref }
              );
            }
          });
        }
      } catch (e) {
        setDraft((prev) => ({ ...prev, processing: false }));
        setError(
          e instanceof Error ? e.message : t("errors.photoError")
        );
      }
    },
    [t]
  );

  // 地図タップで場所登録
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setDraft((prev) => ({ ...prev, lat, lng }));

    // タップした位置から都道府県を自動判定
    reverseGeocodeRegion(lat, lng).then((pref) => {
      if (pref) {
        setDraft((prev) =>
          prev.prefecture ? prev : { ...prev, prefecture: pref }
        );
      }
    });
  }, []);

  // 保存
  const handleSave = useCallback(async () => {
    setError(null);

    if (!draft.imageDataUrl) {
      setError(t("form.errPhoto"));
      return;
    }
    if (draft.locationMode === "prefecture" && !draft.prefecture) {
      setError(t("form.errPref"));
      return;
    }
    if (draft.locationMode === "map" && draft.lat == null) {
      setError(t("form.errMapTap"));
      return;
    }

    setSaving(true);
    try {
      const precision =
        draft.locationMode === "prefecture"
          ? "prefecture"
          : draft.locationMode === "none"
          ? "exact"
          : draft.precision;

      const { lat, lng } = applyPrecision(draft.lat, draft.lng, precision);

      const now = new Date().toISOString();
      const entry: LifeMapEntry = {
        id: crypto.randomUUID(),
        imageDataUrl: draft.imageDataUrl,
        thumbnailDataUrl: draft.thumbnailDataUrl,
        category: draft.category,
        date: draft.date,
        memo: draft.memo.trim() || undefined,
        lat,
        lng,
        prefecture: draft.prefecture || undefined,
        locationName: draft.locationName.trim() || undefined,
        locationPrecision: precision,
        createdAt: now,
        updatedAt: now,
      };

      await putEntry(entry);
      setEntries((prev) => [...prev, entry]);

      // フォームをリセット
      setDraft(createEmptyDraft());
      setPickMode(false);
      setFocus(null);
    } catch {
      setError(t("form.errSave"));
    } finally {
      setSaving(false);
    }
  }, [draft, t]);

  const handleDelete = useCallback(
    async (entry: LifeMapEntry) => {
      if (!window.confirm(t("confirm.delete"))) return;
      try {
        await deleteEntry(entry.id);
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      } catch {
        setError(t("errors.deleteFailed"));
      }
    },
    [t]
  );

  const handleShowOnMap = useCallback((entry: LifeMapEntry) => {
    const pos = resolveEntryLatLng(entry);
    if (pos) {
      setFocus(pos);
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // 地図に渡す「新規ピン」位置（GPS取得時／地図タップ時）
  const newLocation =
    (draft.locationMode === "gps" || draft.locationMode === "map") &&
    draft.lat != null &&
    draft.lng != null
      ? { lat: draft.lat, lng: draft.lng }
      : null;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: FONT_STACK }}>
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[1000]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight truncate">
                {t("app.title")}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {t("app.subtitle")}
              </p>
            </div>
          </div>

          {/* 居住国・言語切替 + バックリンク */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 居住国選択 */}
            <select
              value={homeCountry.code}
              onChange={(e) => {
                const found = HOME_COUNTRIES.find((c) => c.code === e.target.value);
                if (found) setHomeCountry(found);
              }}
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer hover:border-slate-300 transition-all focus:outline-none focus:border-slate-400"
              aria-label={t("country.label")}
              title={t("country.label")}
            >
              {HOME_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            {/* 言語選択 */}
            <div className="relative">
              <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangCode)}
                className="pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 appearance-none cursor-pointer hover:border-slate-300 transition-all focus:outline-none focus:border-slate-400"
                aria-label="Language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <a
              href="https://www.ai-drive-planner.com/heritage"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
            >
              <span className="text-base leading-none">🌐</span>
              {t("heritageLink")}
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("app.backLink")}
            </Link>
          </div>
        </div>
      </header>

      {/* 説明 */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4 space-y-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-600 leading-relaxed">
            {t("app.desc")}
          </p>
          <p className="text-xs text-slate-400 mt-1">Since 2026年6月</p>
          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            {t("app.privacy")}
          </p>
        </div>

        {/* 免責事項 */}
        <div className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t("disclaimer")}
          </p>
        </div>
      </div>

      {loadErrorKey && (
        <div className="max-w-[1400px] mx-auto px-4 pt-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {t(loadErrorKey)}
          </div>
        </div>
      )}

      {/* 本体 */}
      <div className="max-w-[1400px] mx-auto p-4 flex flex-col lg:flex-row gap-4">
        {/* 左：記録追加＋一覧 */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 space-y-4">
          <LifeMapEntryForm
            draft={draft}
            onChange={patchDraft}
            onPhotoSelect={handlePhotoSelect}
            pickMode={pickMode}
            onTogglePick={setPickMode}
            onSave={handleSave}
            saving={saving}
            error={error}
          />

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">{t("entries.sectionTitle")}</h2>
              <button
                type="button"
                onClick={() => setShowReplay(true)}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium transition-all"
              >
                <Film className="w-3.5 h-3.5" />
                {t("entries.replayBtn")}
              </button>
            </div>

            {/* 思い出ドライブバナー（日本・2件以上選択時） */}
            {homeCountry.isJapan && entries.length > 0 && (
              <div className={`mb-4 rounded-xl border transition-all ${
                selectedIds.size >= 2
                  ? "bg-slate-700 border-slate-600 p-3"
                  : "bg-slate-50 border-slate-200 p-3"
              }`}>
                {selectedIds.size >= 2 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-xs font-medium flex-1">
                      {t("drive.hint", { count: selectedIds.size })}
                    </span>
                    <a
                      href={buildMultiPlannerLink(
                        entries.filter((e) => selectedIds.has(e.id))
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {t("drive.planBtn")}
                    </a>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-500 text-slate-300 hover:text-white text-xs transition-all"
                    >
                      <X className="w-3 h-3" />
                      {t("drive.clearBtn")}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{t("drive.selectHint")}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <BackupButtons entries={entries} onRestored={setEntries} />
            </div>
            <LifeMapEntryList
              entries={entries}
              onShowOnMap={handleShowOnMap}
              onDelete={handleDelete}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          </div>
        </div>

        {/* 右：地図 */}
        <div className="flex-1 lg:sticky lg:top-[76px] lg:self-start space-y-2">
          <div
            ref={mapRef}
            className="h-[55vh] min-h-[360px] lg:h-[calc(100vh-160px)] rounded-xl overflow-hidden shadow-lg border border-slate-200"
          >
            <LifeMapLeaflet
              key={homeCountry.code}
              entries={entries}
              pickMode={pickMode}
              newLocation={newLocation}
              onMapClick={handleMapClick}
              focus={focus}
              mapCenter={homeCountry.center}
              mapZoom={homeCountry.zoom}
              labels={{
                approxSuffix: t("map.approxSuffix"),
                revisitLink: t("map.revisitLink"),
                googleMapsLink: t("map.googleMapsLink"),
                newPin: t("map.newPin"),
              }}
            />
          </div>
          <div className="bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
            <CategoryLegend />
          </div>
        </div>
      </div>

      {showReplay && (
        <MemoryReplay entries={entries} onClose={() => setShowReplay(false)} />
      )}
    </div>
  );
}

// LanguageProviderでラップして export
export default function LifeMapClient() {
  return (
    <LanguageProvider>
      <LifeMapClientInner />
    </LanguageProvider>
  );
}
