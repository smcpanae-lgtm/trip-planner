"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Lock,
  Film,
  Globe,
  Navigation,
  X,
  BookOpen,
  Landmark,
  Plus,
  ShieldCheck,
  Image as ImageIcon,
  Camera,
  ArrowRight,
  ClipboardList,
  HardDrive,
  ChevronDown,
  Share2,
} from "lucide-react";
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
import ShareImageModal from "./ShareImageModal";
import LifeMapGuide from "./LifeMapGuide";
import LifeMapEditModal from "./LifeMapEditModal";
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
  'var(--font-lifemap), "Noto Sans JP", "Meiryo", "メイリオ", "Hiragino Sans", sans-serif';

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
  const [showShareImage, setShowShareImage] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LifeMapEntry | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
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

  // 複数写真の一括追加（キュー管理）
  const handleMultiplePhotoSelect = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      setQueueTotal(files.length);
      setFileQueue(files.slice(1));
      handlePhotoSelect(files[0]);
    },
    [handlePhotoSelect]
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

  // 緯度・経度を手入力した場合も都道府県を自動判定する。
  // 入力途中で何度も照会しないよう、打ち終わってから少し待って問い合わせる。
  const draftLat = draft.lat;
  const draftLng = draft.lng;
  const draftLocationMode = draft.locationMode;
  useEffect(() => {
    if (draftLocationMode !== "coords") return;
    if (draftLat == null || draftLng == null) return;
    if (!Number.isFinite(draftLat) || !Number.isFinite(draftLng)) return;
    if (Math.abs(draftLat) > 90 || Math.abs(draftLng) > 180) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      reverseGeocodeRegion(draftLat, draftLng).then((pref) => {
        if (cancelled || !pref) return;
        setDraft((prev) =>
          prev.locationMode === "coords" &&
          prev.lat === draftLat &&
          prev.lng === draftLng
            ? { ...prev, prefecture: pref }
            : prev
        );
      });
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draftLocationMode, draftLat, draftLng]);

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
    if (draft.locationMode === "coords" && (draft.lat == null || draft.lng == null)) {
      setError(t("form.errCoords"));
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

      // キューに次の写真があれば自動で読み込む
      if (fileQueue.length > 0) {
        const [nextFile, ...rest] = fileQueue;
        setFileQueue(rest);
        handlePhotoSelect(nextFile);
      } else {
        setQueueTotal(0);
      }
    } catch {
      setError(t("form.errSave"));
    } finally {
      setSaving(false);
    }
  }, [draft, t, fileQueue, handlePhotoSelect]);

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

  // 保存済み記録の編集を書き戻す（IDは変えずに上書き）
  const handleUpdateEntry = useCallback(
    async (updated: LifeMapEntry) => {
      setEditError(null);
      setEditSaving(true);
      try {
        await putEntry(updated);
        setEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
        setEditingEntry(null);

        // 編集後の位置を地図に反映する
        const pos = resolveEntryLatLng(updated);
        if (pos) setFocus(pos);
      } catch {
        setEditError(t("form.errSave"));
      } finally {
        setEditSaving(false);
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

  // 地図に渡す「新規ピン」位置（GPS取得時／地図タップ時／座標直接入力時）
  const newLocation =
    (draft.locationMode === "gps" || draft.locationMode === "map" || draft.locationMode === "coords") &&
    draft.lat != null &&
    draft.lng != null
      ? { lat: draft.lat, lng: draft.lng }
      : null;

  const heroTokens = {
    sectionBg: "linear-gradient(168deg,#E7F1EE 0%,#F2EFE7 58%,#FAF7F1 100%)",
    eyebrowBg: "#D7E8E2",
    eyebrowText: "#145E4E",
    h1: "#22332E",
    body: "#4A443B",
    ctaBg: "#1C7A66",
    ctaShadow: "rgba(28,122,102,.24)",
    secondaryBorder: "#CFE0DA",
    secondaryText: "#22332E",
    noteText: "#5B5346",
    metaText: "#8A8172",
    metaLinkText: "#5B5346",
    accent: "#1C7A66",
    cardShadow: "rgba(43,39,33,.14)",
    card1Photo: "repeating-linear-gradient(45deg,#E3EEEA,#E3EEEA 9px,#EDF4F1 9px,#EDF4F1 18px)",
    card1PhotoText: "#8FA9A1",
    card1Border: "#EFE9DD",
    card1ChipBg: "#E7F1EE",
    card1ChipText: "#145E4E",
    card2Photo: "repeating-linear-gradient(45deg,#EDE6D8,#EDE6D8 9px,#F4EEE2 9px,#F4EEE2 18px)",
    card2PhotoText: "#B0A488",
    card2Border: "#EFE9DD",
    card2ChipBg: "#F3ECDD",
    card2ChipText: "#8A6320",
  };

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-[#2B2721]" style={{ fontFamily: FONT_STACK }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-[1000] bg-[rgba(253,251,247,0.9)] backdrop-blur-[10px] border-b border-[#E9E2D6]">
        <div className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] py-[14px] pb-[12px] flex items-center justify-between gap-5 flex-wrap">
          <Link href="/life-map" className="flex items-center gap-[11px] no-underline shrink-0">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[11px] bg-[#1C7A66] text-white shrink-0">
              <MapPin className="w-[21px] h-[21px]" strokeWidth={1.9} />
            </span>
            <span className="flex flex-col leading-[1.25]">
              <span className="font-extrabold text-[18px] tracking-[0.01em] text-[#2B2721]">
                {t("app.title")}
              </span>
              <span className="text-[11.5px] text-[#7A7264] font-medium">
                {t("app.subtitle")}
              </span>
            </span>
          </Link>

          <div className="flex items-start gap-[9px] flex-wrap">
            {/* 居住国選択 */}
            <div className="flex flex-col items-start gap-[3px]">
              <span className="pl-0.5 text-[9px] font-bold tracking-wide text-[#A79E8C] uppercase">
                Residence
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#E4DCCC] rounded-[9px] bg-white text-[#6B6357]">
                <Globe className="w-[15px] h-[15px]" strokeWidth={1.75} />
                <select
                  value={homeCountry.code}
                  onChange={(e) => {
                    const found = HOME_COUNTRIES.find((c) => c.code === e.target.value);
                    if (found) setHomeCountry(found);
                  }}
                  className="border-0 bg-transparent text-[12.5px] font-semibold text-[#4A443B] outline-none cursor-pointer"
                  aria-label={t("country.label")}
                  title={t("country.label")}
                >
                  {HOME_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* 言語選択 */}
            <div className="flex flex-col items-start gap-[3px]">
              <span className="pl-0.5 text-[9px] font-bold tracking-wide text-[#A79E8C] uppercase">
                Language
              </span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangCode)}
                className="px-2.5 py-1.5 border border-[#E4DCCC] rounded-[9px] bg-white text-[12.5px] font-semibold text-[#4A443B] outline-none cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#CDE0DA] rounded-[9px] bg-[#EAF3F0] text-[#145E4E] text-[12.5px] font-bold no-underline"
            >
              <Landmark className="w-[15px] h-[15px]" strokeWidth={1.75} />
              {t("heritageLink")}
            </a>
            <a
              href="https://x.com/AIDRIVEPLAN"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[7px] px-3 py-2 rounded-[9px] bg-[#2B2721] text-white text-[12.5px] font-bold no-underline"
            >
              <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] fill-white shrink-0" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
              </svg>
              公式X（@AIDRIVEPLAN）をフォロー
            </a>
          </div>
        </div>
        <nav className="border-t border-[#EFE9DD] bg-[rgba(255,255,255,0.55)]">
          <div className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] flex items-center justify-between gap-4">
            <div className="flex items-stretch gap-1">
              <a href="#howto" className="px-3.5 py-3 text-[13.5px] font-bold text-[#2B2721] no-underline border-b-2 border-transparent">
                使い方
              </a>
              <Link href="/shiori" className="px-3.5 py-3 text-[13.5px] font-bold text-[#2B2721] no-underline border-b-2 border-transparent">
                AI旅行記メーカー
              </Link>
              <a href="#faq" className="px-3.5 py-3 text-[13.5px] font-bold text-[#2B2721] no-underline border-b-2 border-transparent">
                よくある質問
              </a>
            </div>
            <a
              href="#record"
              className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-full bg-[#1C7A66] text-white text-[12.5px] font-bold no-underline"
            >
              <Plus className="w-[15px] h-[15px]" strokeWidth={1.9} />
              体験を記録
            </a>
          </div>
        </nav>
      </header>

      {/* ヒーロー */}
      <section
        className="border-b border-[#E9E2D6]"
        style={{ background: heroTokens.sectionBg }}
      >
        <div className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] py-[52px] pb-[56px] grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-11 items-center">
          <div>
            <span
              className="inline-flex items-center gap-[7px] px-3 py-[5px] rounded-full text-[11.5px] font-bold tracking-[0.04em]"
              style={{ background: heroTokens.eyebrowBg, color: heroTokens.eyebrowText }}
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.9} />
              非公開のライフログ
            </span>
            <h1
              className="mt-[18px] mb-4 text-[42px] leading-[1.28] font-extrabold tracking-[0.01em]"
              style={{ color: heroTokens.h1 }}
            >
              写真と場所で、<br />人生の体験を残す。
            </h1>
            <p
              className="mb-[22px] text-[15.5px] max-w-[38ch]"
              style={{ color: heroTokens.body }}
            >
              {t("app.desc")}
            </p>
            <div className="flex gap-3 flex-wrap mb-5">
              <a
                href="#record"
                className="inline-flex items-center gap-[9px] px-[22px] py-[14px] rounded-xl text-white text-[15px] font-bold no-underline"
                style={{ background: heroTokens.ctaBg, boxShadow: `0 8px 20px ${heroTokens.ctaShadow}` }}
              >
                <ImageIcon className="w-[19px] h-[19px]" strokeWidth={1.8} />
                写真を選ぶ
              </a>
              <a
                href="#record"
                className="inline-flex items-center gap-[9px] px-[22px] py-[14px] rounded-xl bg-white text-[15px] font-bold no-underline border"
                style={{ color: heroTokens.secondaryText, borderColor: heroTokens.secondaryBorder }}
              >
                <Camera className="w-[19px] h-[19px]" strokeWidth={1.8} />
                カメラで撮影
              </a>
            </div>
            <div className="flex items-start gap-[9px] max-w-[44ch] text-[12.5px]" style={{ color: heroTokens.noteText }}>
              <Lock className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.85} style={{ color: heroTokens.accent }} />
              <span>{t("app.privacy")}</span>
            </div>
            <div className="mt-[18px] flex items-center gap-4 flex-wrap text-xs" style={{ color: heroTokens.metaText }}>
              <span>Since 2026年6月</span>
              <a
                href="https://x.com/AIDRIVEPLAN"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold no-underline"
                style={{ color: heroTokens.metaLinkText }}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
                </svg>
                公式X（@AIDRIVEPLAN）をフォロー
              </a>
            </div>
          </div>

          <div className="relative h-[300px] lg:h-[340px] hidden sm:block">
            <div
              className="absolute top-6 right-2 w-[230px] rotate-[4deg] bg-white rounded-2xl p-3 border"
              style={{ boxShadow: `0 16px 34px ${heroTokens.cardShadow}`, borderColor: heroTokens.card1Border }}
            >
              <div
                className="h-[132px] rounded-[10px] grid place-items-center text-[10px] font-semibold tracking-[0.08em]"
                style={{ background: heroTokens.card1Photo, color: heroTokens.card1PhotoText }}
              >
                PHOTO
              </div>
              <div className="flex items-center gap-[7px] mt-2.5">
                <span
                  className="px-[9px] py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: heroTokens.card1ChipBg, color: heroTokens.card1ChipText }}
                >
                  🎣 釣り
                </span>
                <span className="text-[11px]" style={{ color: heroTokens.metaText }}>2025-10-11</span>
              </div>
              <div className="mt-[5px] flex items-center gap-[5px] text-xs font-semibold" style={{ color: heroTokens.body }}>
                <MapPin className="w-[13px] h-[13px]" strokeWidth={1.9} style={{ color: heroTokens.accent }} />
                神奈川県
              </div>
            </div>
            <div
              className="absolute bottom-3.5 left-1 w-[214px] -rotate-[5deg] bg-white rounded-2xl p-3 border"
              style={{ boxShadow: `0 16px 34px ${heroTokens.cardShadow}`, borderColor: heroTokens.card2Border }}
            >
              <div
                className="h-[120px] rounded-[10px] grid place-items-center text-[10px] font-semibold tracking-[0.08em]"
                style={{ background: heroTokens.card2Photo, color: heroTokens.card2PhotoText }}
              >
                PHOTO
              </div>
              <div className="flex items-center gap-[7px] mt-2.5">
                <span
                  className="px-[9px] py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: heroTokens.card2ChipBg, color: heroTokens.card2ChipText }}
                >
                  🐕 犬連れ
                </span>
                <span className="text-[11px]" style={{ color: heroTokens.metaText }}>2025-05-03</span>
              </div>
              <div className="mt-[5px] flex items-center gap-[5px] text-xs font-semibold" style={{ color: heroTokens.body }}>
                <MapPin className="w-[13px] h-[13px]" strokeWidth={1.9} style={{ color: heroTokens.accent }} />
                東京都
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI旅行記バナー・免責小注記 */}
      <div className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] pt-[26px] space-y-3">
        <Link
          href="/shiori?source=lifemap"
          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl px-5 py-5 shadow-sm transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(100deg,#2B2721,#3A342B)",
          }}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#E4A857]">
              <BookOpen className="w-3.5 h-3.5" />
              AI旅行記メーカー
            </p>
            <p className="mt-1.5 text-sm font-bold text-white">
              保存した写真とメモから、SNS投稿文・アイキャッチ画像を作る
            </p>
            <p className="mt-1 text-xs text-[#C9C2B5] leading-relaxed">
              人生体験マップの記録を読み込み、旅行後の思い出整理に使えます。
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center px-4 py-2 rounded-lg bg-[#E4A857] text-[#3A2C18] text-xs font-extrabold shrink-0">
            AI旅行記へ
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* 免責事項 */}
        <p className="text-[11.5px] text-[#9A9184] leading-relaxed px-1">
          {t("disclaimer")}
        </p>
      </div>

      {loadErrorKey && (
        <div className="max-w-[1400px] mx-auto px-4 pt-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {t(loadErrorKey)}
          </div>
        </div>
      )}

      {/* ダッシュボード（記録操作 / 地図・カテゴリ） */}
      <div
        id="record"
        className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] mt-5 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start"
      >
        {/* 左：記録追加＋一覧 */}
        <div className="flex flex-col gap-5">
          {queueTotal > 1 && (
            <div className="bg-[#2B2721] text-white rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-medium">
              <span>{queueTotal - fileQueue.length} / {queueTotal} 枚目を処理中</span>
              <div className="flex-1 bg-white/20 rounded-full h-1.5">
                <div
                  className="bg-white rounded-full h-1.5 transition-all"
                  style={{ width: `${((queueTotal - fileQueue.length) / queueTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
          <LifeMapEntryForm
            draft={draft}
            onChange={patchDraft}
            onPhotoSelect={handlePhotoSelect}
            onSelectMultiple={handleMultiplePhotoSelect}
            pickMode={pickMode}
            onTogglePick={setPickMode}
            onSave={handleSave}
            saving={saving}
            error={error}
          />

          <div className="bg-white rounded-[18px] p-[22px] shadow-[0_4px_22px_rgba(43,39,33,.05)] border border-[#EEE7DA]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-extrabold text-base text-[#2B2721]">{t("entries.sectionTitle")}</h2>
              <button
                type="button"
                onClick={() => setShowReplay(true)}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#2B2721] hover:opacity-90 disabled:bg-[#F1ECE1] disabled:text-[#A79E8C] text-white text-xs font-bold transition-all"
              >
                <Film className="w-[15px] h-[15px]" />
                {t("entries.replayBtn")}
              </button>
            </div>

            {/* 思い出ドライブバナー（日本・2件以上選択時） */}
            {homeCountry.isJapan && entries.length > 0 && (
              <div className={`mb-4 rounded-xl border transition-all ${
                selectedIds.size >= 2
                  ? "bg-[#2B2721] border-[#2B2721] p-3"
                  : "bg-[#F6F1E8] border-[#E4DCCC] p-3"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#2B2721] text-xs font-bold hover:bg-[#F6F1E8] transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {t("drive.planBtn")}
                    </a>
                    <Link
                      href={`/shiori?source=lifemap&ids=${encodeURIComponent([...selectedIds].join(","))}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4A857] text-[#3A2C18] text-xs font-bold hover:opacity-90 transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      選択した記録でSNS投稿
                    </Link>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/30 text-white/70 hover:text-white text-xs transition-all"
                    >
                      <X className="w-3 h-3" />
                      {t("drive.clearBtn")}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8172]">{t("drive.selectHint")}</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <BackupButtons entries={entries} onRestored={setEntries} />
            </div>
            {/* シェア画像の生成（記録が0件のときは案内のみ） */}
            <div className="mb-4">
              {entries.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowShareImage(true)}
                  className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-[11px] bg-[#1C7A66] hover:opacity-90 text-white text-[12.5px] font-semibold transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  {t("share.buttonLabel")}
                </button>
              ) : (
                <p className="text-[11.5px] text-[#8A8172]">
                  {t("share.buttonLabel")}：{t("share.emptyHint")}
                </p>
              )}
            </div>
            <LifeMapEntryList
              entries={entries}
              onShowOnMap={handleShowOnMap}
              onDelete={handleDelete}
              onEdit={(entry) => {
                setEditError(null);
                setEditingEntry(entry);
              }}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          </div>
        </div>

        {/* 右：地図 */}
        <div className="flex-1 lg:sticky lg:top-[132px] lg:self-start space-y-3">
          <div
            ref={mapRef}
            className="h-[55vh] min-h-[360px] lg:h-[520px] rounded-[18px] overflow-hidden shadow-[0_4px_22px_rgba(43,39,33,.05)] border border-[#E6DFD1]"
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
          <div className="bg-white rounded-[18px] p-[18px] border border-[#EEE7DA] shadow-[0_4px_22px_rgba(43,39,33,.05)]">
            <p className="text-sm font-extrabold text-[#2B2721] mb-2.5">
              カテゴリ
            </p>
            <CategoryLegend />
          </div>
        </div>
      </div>

      {/* 使い方・よくある質問（ヘッダーの #howto / #faq の着地先） */}
      <LifeMapGuide />

      {/* 注意事項アコーディオン */}
      <div className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] mt-6">
        <details className="group bg-white rounded-[18px] border border-[#EEE7DA] shadow-[0_4px_22px_rgba(43,39,33,.05)] px-[18px] py-4">
          <summary className="flex items-center justify-between cursor-pointer list-none font-extrabold text-[15px] text-[#2B2721]">
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#8A8172]" />
              ご利用上の注意・データの保存について
            </span>
            <ChevronDown className="w-4 h-4 text-[#A79E8C] transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3 text-xs text-[#8A8172] leading-relaxed">
            <div>
              <p className="flex items-center gap-1.5 font-medium text-[#6B6357] mb-1">
                <ClipboardList className="w-3.5 h-3.5" />
                ご利用上の注意
              </p>
              <p>・本サイトのソースコード・デザイン・コンテンツの無断複製・転用・再配布を禁止します。</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-medium text-[#6B6357] mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                データの保存について
              </p>
              <p>・登録した写真・場所・メモ等のデータは、お使いの端末のブラウザ内（ローカルストレージ）にのみ保存されます。サーバーへの送信・クラウドへのバックアップは行われません。</p>
              <p>・ブラウザの「閲覧データ削除」「キャッシュクリア」、端末の初期化・機種変更、ブラウザの変更等により、データが消失する場合があります。</p>
              <p>・データの消失・破損に関して、当サービスは一切の責任を負いかねます。大切なデータは定期的に「バックアップ書き出し」ボタンでファイルに保存しておくことをお勧めします。</p>
            </div>
          </div>
        </details>
      </div>

      {/* フッター */}
      <footer className="mt-10 border-t border-[#E9E2D6]">
        <div className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/life-map" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[10px] bg-[#1C7A66] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </span>
            <span className="font-extrabold text-sm text-[#2B2721]">人生体験マップ</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6B6357] font-medium">
            <Link href="/" className="hover:text-[#2B2721]">AIドライブプランナー</Link>
            <Link href="/heritage" className="hover:text-[#2B2721]">世界遺産パスポート</Link>
            <Link href="/shiori" className="hover:text-[#2B2721]">AI旅行記メーカー</Link>
            <Link href="/privacy" className="hover:text-[#2B2721]">プライバシーポリシー</Link>
            <Link href="/cookie" className="hover:text-[#2B2721]">Cookieについて</Link>
          </nav>
        </div>
        <p className="text-center text-[11px] text-[#A79E8C] pb-6">
          © {new Date().getFullYear()} AIドライブプランナー
        </p>
      </footer>

      {showReplay && (
        <MemoryReplay entries={entries} onClose={() => setShowReplay(false)} />
      )}

      {showShareImage && (
        <ShareImageModal
          entries={entries}
          onClose={() => setShowShareImage(false)}
        />
      )}

      {editingEntry && (
        <LifeMapEditModal
          key={editingEntry.id}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleUpdateEntry}
          saving={editSaving}
          error={editError}
        />
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
