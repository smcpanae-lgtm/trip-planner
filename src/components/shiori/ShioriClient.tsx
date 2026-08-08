"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CircleAlert,
  Download,
  Upload,
  Trash2,
  Navigation,
  FileText,
  ImageOff,
  Sparkles,
  Lock,
  MapPin,
  RotateCcw,
  Tag,
} from "lucide-react";
import type { LifeMapCategory, LifeMapEntry } from "@/types/lifemap";
import { CATEGORIES, CUSTOM_CAT_STORAGE_KEY, getCategory } from "@/lib/lifemap/categories";
import { shioriCategoryLabel } from "@/lib/shiori/i18n/categoryLabels";
import { extractExifLocation } from "@/lib/lifemap/exif";
import { compressImage } from "@/lib/lifemap/image";
import { getAllEntries } from "@/lib/lifemap/storage";
import { resolveEntryLatLng } from "@/lib/lifemap/plannerLink";
import ShioriPrintDocument from "./ShioriPrintDocument";

const ShioriMap = dynamic(() => import("./ShioriMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
      {uiLabel(mapLoadingLanguage, "mapLoading")}
    </div>
  ),
});

type EntrySource = "landing" | "lifemap" | "photo" | "heritage";

type ShioriTone = "warm" | "simple" | "diary" | "guide";
type OutputLanguage = "ja" | "en" | "zh-CN" | "fr" | "ko" | "zh-TW" | "de";

/**
 * 地図チャンク読込中のプレースホルダ用の出力言語。
 *
 * dynamic() の loading は module スコープで評価されるため、コンポーネントの state を
 * 直接参照できない。ShioriClient の描画時にここへ現在の出力言語を退避しておき、
 * loading 側はその値を読む。ShioriMap は ShioriClient の内側にしか現れないので、
 * loading が呼ばれる時点では必ず代入済みになる。
 */
let mapLoadingLanguage: OutputLanguage = "ja";

type GeneratedSpotText = {
  title: string;
  caption: string;
};

type Filters = {
  from: string;
  to: string;
  region: string;
  category: "all" | LifeMapCategory;
  keyword: string;
};

type HeritageLocalizedText = Record<string, string | undefined>;

type HeritageSite = {
  id: string;
  name?: HeritageLocalizedText;
  country?: HeritageLocalizedText;
  region?: string;
  category?: string;
  year?: number | null;
  coordinates?: { lat?: number; lon?: number } | null;
};

type HeritageRecord = {
  visited?: boolean;
  date?: string;
  memo?: string;
  updatedAt?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

// 表示名は出力言語によって変わるため、ここでは値とラベルのキーだけを持つ。
const TONE_OPTIONS: { value: ShioriTone; labelKey: "toneWarm" | "toneSimple" | "toneDiary" | "toneGuide" }[] = [
  { value: "warm", labelKey: "toneWarm" },
  { value: "simple", labelKey: "toneSimple" },
  { value: "diary", labelKey: "toneDiary" },
  { value: "guide", labelKey: "toneGuide" },
];

const OUTPUT_LANGUAGE_OPTIONS: { value: OutputLanguage; label: string }[] = [
  { value: "ja", label: "日本語(language)" },
  { value: "en", label: "English" },
  { value: "zh-CN", label: "中文（简体）" },
  { value: "fr", label: "Français" },
  { value: "ko", label: "한국어" },
  { value: "zh-TW", label: "繁體中文（台灣）" },
  { value: "de", label: "Deutsch" },
];

const OUTPUT_LANGUAGE_VALUES = OUTPUT_LANGUAGE_OPTIONS.map((option) => option.value);

const SHIORI_DRAFT_STORAGE_KEY = "shiori-draft-v1";
const SHIORI_LANG_STORAGE_KEY = "shiori-output-language";
const SHIORI_SESSION_STORAGE_KEY = "shiori-anonymous-session-id";
// 書き方の2択（AIに書いてもらう / 自分で書く）。下書きとは独立して覚えさせるため専用キーにする。
const SHIORI_WRITE_MODE_STORAGE_KEY = "shiori-write-mode";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

// 一度にAI生成できる記録の上限。サーバー側の MAX_SPOTS と同じ値。
// 超えるとサーバーが errorCode: "too_many_entries" を返す。
const MAX_AI_SPOTS = 20;

/** 旅行記の書き方。null は未選択（2択カードを出す）。 */
type WriteMode = "ai" | "manual";

function isWriteMode(value: unknown): value is WriteMode {
  return value === "ai" || value === "manual";
}

/**
 * 記録の個別選択の持ち方。
 *
 * - "all-except": 既定は全選択で、ids は「利用者が外した記録」。
 * - "only":       既定は全解除で、ids は「利用者が選んだ記録」。
 *
 * 除外セット（"all-except"）だけでは「開いた時点で全解除」を表現できない。
 * 全idを先回りで詰めると初期状態と「全部外した状態」が区別できず、
 * あとから増えた記録（写真の追加取り込み）も勝手に選択済みになってしまう。
 * モードを持たせることで、あとから増減する記録も既定側に自動で倒れる。
 */
type SelectionState = {
  mode: "all-except" | "only";
  ids: string[];
};

const ALL_SELECTED: SelectionState = { mode: "all-except", ids: [] };
const NONE_SELECTED: SelectionState = { mode: "only", ids: [] };

/** ボタンを押した結果を、そのボタン自身で返すための状態。数秒後に "idle" へ戻す。 */
type ActionFeedback = "idle" | "done" | "failed";
/** 成功は一目で分かるので短く、失敗は次の手順を読む時間が要るので長めに出す。 */
const FEEDBACK_MS: Record<Exclude<ActionFeedback, "idle">, number> = {
  done: 3000,
  failed: 5000,
};

type ShioriDraft = {
  source: EntrySource;
  entries: LifeMapEntry[];
  filters: Filters;
  shioriTitle: string;
  travelerName: string;
  tone: ShioriTone;
  outputLanguage: OutputLanguage;
  generatedSummary: string;
  generatedSpots: Record<string, GeneratedSpotText>;
  /** 記録の個別選択。このキーが無い古い下書きは全選択として復元する（従来の挙動と同じ）。 */
  selection?: SelectionState;
  savedAt: string;
};

function isSelectionState(value: unknown): value is SelectionState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { mode?: unknown; ids?: unknown };
  return (
    (candidate.mode === "all-except" || candidate.mode === "only") &&
    Array.isArray(candidate.ids) &&
    candidate.ids.every((id) => typeof id === "string")
  );
}

const emptyFilters: Filters = {
  from: "",
  to: "",
  region: "",
  category: "all",
  keyword: "",
};

const FONT_STACK =
  '"Meiryo", "メイリオ", "Hiragino Sans", "Noto Sans JP", sans-serif';

/**
 * アイキャッチ画像の行頭に置いてはいけない文字（禁則処理）。
 * 句読点や閉じ括弧が行の先頭に来ると読みづらいため、幅を超えても前の行にぶら下げる。
 * 空白で語を区切らない言語（日本語・中国語・韓国語）でのみ使う。
 */
const NO_LINE_START = "。、．，！？）」』】〉》”’ー・…";

/** 空白で語を区切る言語か。単語の途中で改行しないための判定に使う。 */
function usesSpaceSeparatedWords(language: OutputLanguage): boolean {
  return language === "en" || language === "fr" || language === "de";
}

/**
 * その位置が「文の区切り」か。読点は含めない（文として不完全になるため）。
 * 英文のピリオドは「Mr.」「3.5」のように文末でないことがあるので、
 * 直後が空白か文末のときだけ区切りとみなす。
 */
function isSentenceEnd(text: string, index: number): boolean {
  const char = text[index];
  if ("。．！？".includes(char)) return true;
  if (".!?".includes(char)) {
    const next = text[index + 1];
    return next === undefined || next === " ";
  }
  return false;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// whp.sites の name / country は世界遺産パスポート側が書き込む。
// public/heritage/app.js の transformUnescoRecord を見ると、
// name が持つキーは ja / en / zh / fr / es / ar / ru、country は ja / en だけ。
// しおりの7言語をそのデータ側のキーに対応付ける（ko と de はデータが無いので空配列）。
const HERITAGE_NAME_KEYS: Record<OutputLanguage, string[]> = {
  ja: ["ja"],
  en: ["en"],
  "zh-CN": ["zh"],
  fr: ["fr"],
  ko: [],
  "zh-TW": ["zh"],
  de: [],
};

/**
 * 出力言語に対応する遺産名・国名を返す。
 *
 * 日本語出力の挙動は従来のまま（ja → en → 最初に見つかった値）。
 * 日本語以外は「その言語 → 英語 → 日本語 → 最初に見つかった値」の順にする。
 * 英語を第2優先にする理由は、データ上 en が100%埋まっているのに対し、
 * name.ja は app.js が `japanHeritageNamesJa[idNo] || englishName` で埋めているため
 * 1,273件中1,246件が英語名そのもので、ja に倒しても得るものが無く、
 * 日本の27件でだけ日本語が混ざるという不利益しか無いため。
 */
function getHeritageLocalName(value: HeritageLocalizedText | undefined, language: OutputLanguage): string {
  if (!value) return "";
  const order =
    language === "ja" ? ["ja", "en"] : [...(HERITAGE_NAME_KEYS[language] ?? []), "en", "ja"];
  for (const key of order) {
    const hit = value[key];
    if (hit) return hit;
  }
  return Object.values(value).find((item): item is string => Boolean(item)) || "";
}

function openHeritageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("world-heritage-passport", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("世界遺産パスポートの写真DBを開けませんでした"));
  });
}

async function getHeritagePhoto(id: string): Promise<string> {
  try {
    const db = await openHeritageDb();
    return await new Promise<string>((resolve) => {
      if (!db.objectStoreNames.contains("photos")) {
        resolve("");
        return;
      }
      const tx = db.transaction("photos", "readonly");
      const request = tx.objectStore("photos").get(id);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : "");
      request.onerror = () => resolve("");
    });
  } catch {
    return "";
  }
}

async function loadHeritageEntries(
  selectedIds: string[] | null,
  language: OutputLanguage
): Promise<LifeMapEntry[]> {
  const records = safeJsonParse<Record<string, HeritageRecord>>(localStorage.getItem("whp.records"), {});
  const sites = safeJsonParse<HeritageSite[]>(localStorage.getItem("whp.sites"), []);
  const selected = selectedIds && selectedIds.length > 0 ? new Set(selectedIds) : null;
  const candidates = sites.filter((site) => {
    const record = records[site.id];
    return Boolean(record?.visited) && (!selected || selected.has(site.id));
  });

  return Promise.all(
    candidates.map(async (site) => {
      const record = records[site.id] || {};
      const photo = await getHeritagePhoto(site.id);
      const place = getHeritageLocalName(site.name, language) || uiLabel(language, "worldHeritage");
      const country = getHeritageLocalName(site.country, language) || uiLabel(language, "worldHeritage");
      const date = record.date || todayStr();
      const updatedAt = record.updatedAt || new Date().toISOString();
      const memo = record.memo?.trim() || "";

      return {
        id: `heritage-${site.id}`,
        imageDataUrl: photo,
        thumbnailDataUrl: photo,
        category: "travel",
        date,
        memo,
        lat: typeof site.coordinates?.lat === "number" ? site.coordinates.lat : undefined,
        lng: typeof site.coordinates?.lon === "number" ? site.coordinates.lon : undefined,
        prefecture: country,
        locationName: place,
        locationPrecision: site.coordinates ? "approximate" : "prefecture",
        createdAt: updatedAt,
        updatedAt,
      } satisfies LifeMapEntry;
    })
  );
}
function getCategoryLabel(
  category: LifeMapCategory,
  customLabels: Record<string, string>,
  language: OutputLanguage
): string {
  return shioriCategoryLabel(language, category, customLabels);
}

function getDisplayPlace(entry: LifeMapEntry, language: OutputLanguage): string {
  return entry.locationName || entry.prefecture || uiLabel(language, "placeUnset");
}

function safeDownloadName(value: string, language: OutputLanguage): string {
  let cleaned = value
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 48);
  // 英語出力では英数字のみに落とす。日本語などのファイル名は環境によって文字化けするため。
  // 日本語・中国語・韓国語はその言語圏の環境で問題にならないため、従来どおりそのまま使う。
  if (language === "en") {
    cleaned = cleaned
      .replace(/[^A-Za-z0-9\-_]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return cleaned || uiLabel(language, "downloadFallbackName");
}

function matchesKeyword(
  entry: LifeMapEntry,
  keyword: string,
  customLabels: Record<string, string>,
  language: OutputLanguage
): boolean {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;
  const categoryLabel = getCategoryLabel(entry.category, customLabels, language);
  const values = [
    entry.memo,
    entry.locationName,
    entry.prefecture,
    entry.date,
    categoryLabel,
  ];
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function filterEntries(
  entries: LifeMapEntry[],
  filters: Filters,
  customLabels: Record<string, string>,
  language: OutputLanguage
): LifeMapEntry[] {
  return entries
    .filter((entry) => {
      if (filters.from && entry.date < filters.from) return false;
      if (filters.to && entry.date > filters.to) return false;
      if (filters.category !== "all" && entry.category !== filters.category) {
        return false;
      }
      if (filters.region) {
        const place = getDisplayPlace(entry, language);
        if (entry.prefecture !== filters.region && place !== filters.region) {
          return false;
        }
      }
      return matchesKeyword(entry, filters.keyword, customLabels, language);
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

function formatRange(entries: LifeMapEntry[], language: OutputLanguage): string {
  if (entries.length === 0) return uiLabel(language, "rangeUnset");
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0]?.date;
  const last = sorted[sorted.length - 1]?.date;
  return first === last ? first : `${first} - ${last}`;
}

function isOutputLanguage(value: string | null | undefined): value is OutputLanguage {
  return Boolean(value && (OUTPUT_LANGUAGE_VALUES as string[]).includes(value));
}

function tripTitle(range: string, language: OutputLanguage): string {
  switch (language) {
    case "en":
      return `${range} Trip`;
    case "zh-CN":
      return `${range} 的旅行`;
    case "fr":
      return `Voyage du ${range}`;
    case "ko":
      return `${range} 여행`;
    case "zh-TW":
      return `${range} 的旅行`;
    case "de":
      return `Reise ${range}`;
    case "ja":
    default:
      return `${range} の旅`;
  }
}

// 記録者名が未入力のときに「◯◯の視点で」の◯◯に入れる語。
// 日本語・中国語・韓国語は一人称をそのまま入れても自然に読める。
// 英語・フランス語・ドイツ語は所有格や前置詞句に一人称を入れると
// "from I's point of view" のように壊れるため、fallbackSummaryText 側で
// 視点の一句を持たない文型に切り替える。よってこの関数は呼ばない。
function defaultNarrator(language: OutputLanguage): string {
  switch (language) {
    case "zh-CN":
      return "我";
    case "ko":
      return "나";
    case "zh-TW":
      return "我";
    case "ja":
    default:
      return "私たち";
  }
}

function fallbackSummaryText(
  language: OutputLanguage,
  title: string,
  range: string,
  traveler: string,
  places: string[]
): string {
  const displayTitle = title || tripTitle(range, language);
  const placeText = places.slice(0, 3).join(language === "en" || language === "fr" || language === "de" ? ", " : "、");
  const narrator = traveler || defaultNarrator(language);

  switch (language) {
    case "en":
      return traveler
        ? `${displayTitle} is a travel journal from ${traveler}'s point of view, following ${placeText || "memorable places"}. I gathered the photos, dates, places, and original notes so the feelings and small moments from the trip can be remembered later.`
        : `${displayTitle} is a travel journal following ${placeText || "memorable places"}. I gathered the photos, dates, places, and original notes so the feelings and small moments from the trip can be remembered later.`;
    case "zh-CN":
      return `${displayTitle}是以${narrator}的视角整理的旅行记，记录了${placeText || "难忘的地点"}。我把照片、日期、地点和原始备忘整理在一起，方便日后回想这段旅程的感受与细节。`;
    case "fr":
      return traveler
        ? `${displayTitle} est un carnet de voyage raconté du point de vue de ${traveler}, autour de ${placeText || "lieux mémorables"}. Les photos, dates, lieux et notes d'origine sont réunis pour retrouver plus tard les impressions du voyage.`
        : `${displayTitle} est un carnet de voyage autour de ${placeText || "lieux mémorables"}. Les photos, dates, lieux et notes d'origine sont réunis pour retrouver plus tard les impressions du voyage.`;
    case "ko":
      return `${displayTitle}은 ${placeText || "기억에 남는 장소"}를 따라 ${narrator}의 시선으로 정리한 여행기입니다. 사진, 날짜, 장소, 원래 메모를 모아 그때의 감정과 작은 순간을 나중에도 떠올릴 수 있게 남깁니다.`;
    case "zh-TW":
      return `${displayTitle}是以${narrator}的視角整理的旅行記，記錄了${placeText || "難忘的地點"}。我把照片、日期、地點和原始備忘整理在一起，方便日後回想這段旅程的感受與細節。`;
    case "de":
      return traveler
        ? `${displayTitle} ist ein Reisebericht aus der Sicht von ${traveler}, rund um ${placeText || "unvergessliche Orte"}. Fotos, Daten, Orte und ursprüngliche Notizen werden gesammelt, damit die Eindrücke der Reise später wieder lebendig werden.`
        : `${displayTitle} ist ein Reisebericht rund um ${placeText || "unvergessliche Orte"}. Fotos, Daten, Orte und ursprüngliche Notizen werden gesammelt, damit die Eindrücke der Reise später wieder lebendig werden.`;
    case "ja":
    default:
      return `${displayTitle}は、${placeText || "思い出の場所"}をめぐった${narrator}の旅行記です。写真、日付、場所、元メモをたどりながら、そのとき感じたことや旅の流れをあとから思い出せるように残します。`;
  }
}

function fallbackSpotCaption(
  language: OutputLanguage,
  date: string,
  place: string,
  categoryLabel: string,
  memo?: string
): string {
  if (memo) {
    switch (language) {
      case "en":
        return `On ${date}, I stopped at ${place}. ${memo}`;
      case "zh-CN":
        return `${date}，我来到${place}。${memo}`;
      case "fr":
        return `Le ${date}, je me suis arrêté à ${place}. ${memo}`;
      case "ko":
        return `${date}, ${place}에서 보낸 시간. ${memo}`;
      case "zh-TW":
        return `${date}，我來到${place}。${memo}`;
      case "de":
        return `Am ${date} war ich in ${place}. ${memo}`;
      case "ja":
      default:
        return `${date}、${place}で過ごした時間。${memo}`;
    }
  }

  switch (language) {
    case "en":
      return `On ${date}, I kept this ${categoryLabel} memory from ${place} together with the photo.`;
    case "zh-CN":
      return `${date}在${place}留下的${categoryLabel}记录。把这一天和照片一起保存下来。`;
    case "fr":
      return `Un souvenir ${categoryLabel} gardé à ${place} le ${date}, avec la photo de cette journée.`;
    case "ko":
      return `${date}, ${place}에서 남긴 ${categoryLabel} 기록. 사진과 함께 이 날을 간직합니다.`;
    case "zh-TW":
      return `${date}在${place}留下的${categoryLabel}紀錄。把這一天和照片一起保存下來。`;
    case "de":
      return `Eine ${categoryLabel}-Erinnerung aus ${place} vom ${date}, zusammen mit dem Foto festgehalten.`;
    case "ja":
    default:
      return `${date}、${place}で過ごした${categoryLabel}の記録。写真と一緒に、この日のことを残しておきます。`;
  }
}

function aiBrandLabel(language: OutputLanguage): string {
  switch (language) {
    case "en":
      return "AI Travel Journal";
    case "zh-CN":
      return "AI旅行记";
    case "fr":
      return "Carnet de voyage IA";
    case "ko":
      return "AI 여행기";
    case "zh-TW":
      return "AI旅行記";
    case "de":
      return "KI-Reisebericht";
    case "ja":
    default:
      return "AI旅行記";
  }
}

// コピー・画像保存の結果は uiLabel の copyDone / imageDone 系でボタン自身に出す。
// （以前ここにあった copied / copyFailed は、下書き用のメッセージ欄に相乗りしており
//   ボタンから遠すぎて反応が分からなかったため廃止した。）
function uiMessage(language: OutputLanguage, key: "aiFallback" | "aiFailed"): string {
  const messages: Record<OutputLanguage, Record<"aiFallback" | "aiFailed", string>> = {
    ja: {
      aiFallback: "AIが使えないため、AIなしの記録文で作成しました。文章はそのまま編集できます。",
      aiFailed: "AI生成に失敗したため、AIなしの記録文で作成しました。文章はそのまま編集できます。",
    },
    en: {
      aiFallback: "AI is unavailable, so a template journal was created. You can edit the text freely.",
      aiFailed: "AI generation failed, so a template journal was created. You can edit the text freely.",
    },
    "zh-CN": {
      aiFallback: "AI暂时不可用，已生成不使用AI的旅行记。文字可以继续编辑。",
      aiFailed: "AI生成失败，已生成不使用AI的旅行记。文字可以继续编辑。",
    },
    fr: {
      aiFallback: "L'IA est indisponible. Un texte modèle a été créé et peut être modifié.",
      aiFailed: "La génération par IA a échoué. Un texte modèle a été créé et peut être modifié.",
    },
    ko: {
      aiFallback: "AI를 사용할 수 없어 템플릿 여행기를 만들었습니다. 문장은 자유롭게 편집할 수 있습니다.",
      aiFailed: "AI 생성에 실패해 템플릿 여행기를 만들었습니다. 문장은 자유롭게 편집할 수 있습니다.",
    },
    "zh-TW": {
      aiFallback: "AI暫時無法使用，已產生不使用AI的旅行記。文字可繼續編輯。",
      aiFailed: "AI產生失敗，已產生不使用AI的旅行記。文字可繼續編輯。",
    },
    de: {
      aiFallback: "KI ist nicht verfügbar. Ein Vorlagentext wurde erstellt und kann bearbeitet werden.",
      aiFailed: "Die KI-Erstellung ist fehlgeschlagen. Ein Vorlagentext wurde erstellt und kann bearbeitet werden.",
    },
  };
  return messages[language][key];
}

/**
 * AI生成APIのエラー文言。サーバーが返す errorCode で引く。
 *
 * サーバーは日本語の文面（レスポンスの error）を従来どおり返しており、
 * クライアントを介さない呼び出しではそちらがそのまま使われる。画面には
 * 出力言語の文面を出したいので、コードを見てここで差し替える。
 *
 * 日本語の13件はサーバーの文面と同一文字列で、日本語表示は従来と変わらない。
 * 自動送信対策の呼び方（英語の anti-bot check など）は、同じ画面の
 * turnstileLoading / turnstileError で使っている語にそろえてある。
 */
type ApiErrorCode =
  | "method_not_allowed"
  | "bad_origin"
  | "no_entries"
  | "too_many_entries"
  | "images_not_allowed"
  | "input_too_long"
  | "bad_request"
  | "turnstile_failed"
  | "rate_limit_minute"
  | "rate_limit_day"
  | "rate_limit_session_day"
  | "concurrent"
  | "duplicate";

const API_ERROR_MESSAGES: Record<OutputLanguage, Record<ApiErrorCode, string>> = {
  ja: {
    method_not_allowed: "AI生成APIはPOSTリクエストのみ受け付けています。",
    bad_origin: "このサイト以外からのAI生成リクエストは受け付けていません。",
    no_entries: "旅行記に使う記録がありません。",
    too_many_entries: `一度にAI生成できる記録は${MAX_AI_SPOTS}件までです。範囲を絞ってからお試しください。`,
    images_not_allowed: "写真データはAI生成APIへ送信できません。場所・日付・メモだけで作成してください。",
    input_too_long: "入力内容が長すぎます。記録数やメモを短くしてからお試しください。",
    bad_request: "AI生成リクエストを処理できませんでした。入力内容を確認してから再度お試しください。",
    turnstile_failed: "認証確認に失敗しました。画面を更新してからもう一度お試しください。",
    rate_limit_minute: "短時間に複数回のAI生成が行われました。1分ほど待ってから再度お試しください。",
    rate_limit_day: "本日のAI生成回数が上限に達しました。明日以降に再度お試しください。",
    rate_limit_session_day: "このブラウザでの本日のAI生成回数が上限に達しました。明日以降に再度お試しください。",
    concurrent: "同じ回線からAI生成が実行中です。完了してから再度お試しください。",
    duplicate: "同じ内容のAI生成が短時間に送信されています。少し時間を置いてから再度お試しください。",
  },
  en: {
    method_not_allowed: "The AI generation API only accepts POST requests.",
    bad_origin: "AI generation requests from outside this site are not accepted.",
    no_entries: "There are no records to build the journal from.",
    too_many_entries: `You can generate up to ${MAX_AI_SPOTS} records at a time. Narrow the range and try again.`,
    images_not_allowed: "Photo data cannot be sent to the AI generation API. Use only places, dates, and notes.",
    input_too_long: "The input is too long. Shorten the notes or reduce the number of records and try again.",
    bad_request: "The AI generation request could not be processed. Check the input and try again.",
    turnstile_failed: "The anti-bot check failed. Reload the page and try again.",
    rate_limit_minute: "AI generation was run several times in a short period. Wait about a minute and try again.",
    rate_limit_day: "Today's AI generation limit has been reached. Please try again tomorrow.",
    rate_limit_session_day: "Today's AI generation limit for this browser has been reached. Please try again tomorrow.",
    concurrent: "AI generation is already running from the same connection. Wait for it to finish and try again.",
    duplicate: "The same content was submitted for AI generation a moment ago. Wait a little and try again.",
  },
  "zh-CN": {
    method_not_allowed: "AI生成API仅接受POST请求。",
    bad_origin: "不接受来自本站以外的AI生成请求。",
    no_entries: "没有可用于生成旅行记的记录。",
    too_many_entries: `一次最多可生成${MAX_AI_SPOTS}条记录。请缩小范围后再试。`,
    images_not_allowed: "照片数据无法发送到AI生成API。请只使用地点、日期和备忘。",
    input_too_long: "输入内容过长。请减少记录数或缩短备忘后再试。",
    bad_request: "无法处理AI生成请求。请确认输入内容后再试。",
    turnstile_failed: "自动提交防护的验证失败。请重新加载页面后再试。",
    rate_limit_minute: "短时间内多次执行了AI生成。请等待约1分钟后再试。",
    rate_limit_day: "今日的AI生成次数已达上限。请明日以后再试。",
    rate_limit_session_day: "此浏览器今日的AI生成次数已达上限。请明日以后再试。",
    concurrent: "同一线路正在执行AI生成。请等待完成后再试。",
    duplicate: "短时间内提交了相同内容的AI生成。请稍候片刻后再试。",
  },
  fr: {
    method_not_allowed: "L'API de génération par IA n'accepte que les requêtes POST.",
    bad_origin: "Les requêtes de génération par IA provenant d'un autre site ne sont pas acceptées.",
    no_entries: "Aucun enregistrement n'est disponible pour créer le carnet.",
    too_many_entries: `Vous pouvez générer jusqu'à ${MAX_AI_SPOTS} enregistrements à la fois. Réduisez la sélection et réessayez.`,
    images_not_allowed: "Les photos ne peuvent pas être envoyées à l'API de génération. Utilisez seulement les lieux, les dates et les notes.",
    input_too_long: "Le contenu saisi est trop long. Réduisez le nombre d'enregistrements ou raccourcissez les notes, puis réessayez.",
    bad_request: "La requête de génération par IA n'a pas pu être traitée. Vérifiez la saisie et réessayez.",
    turnstile_failed: "La protection anti-robot a échoué. Rechargez la page et réessayez.",
    rate_limit_minute: "La génération par IA a été lancée plusieurs fois en peu de temps. Attendez environ une minute et réessayez.",
    rate_limit_day: "La limite de générations par IA pour aujourd'hui est atteinte. Réessayez demain.",
    rate_limit_session_day: "La limite de générations par IA pour ce navigateur est atteinte pour aujourd'hui. Réessayez demain.",
    concurrent: "Une génération par IA est déjà en cours depuis la même connexion. Attendez la fin et réessayez.",
    duplicate: "Le même contenu vient d'être envoyé pour une génération par IA. Patientez un instant et réessayez.",
  },
  ko: {
    method_not_allowed: "AI 생성 API는 POST 요청만 받습니다.",
    bad_origin: "이 사이트 외부에서 보낸 AI 생성 요청은 받지 않습니다.",
    no_entries: "여행기를 만들 기록이 없습니다.",
    too_many_entries: `한 번에 AI로 생성할 수 있는 기록은 ${MAX_AI_SPOTS}건까지입니다. 범위를 좁혀서 다시 시도해 주세요.`,
    images_not_allowed: "사진 데이터는 AI 생성 API로 보낼 수 없습니다. 장소, 날짜, 메모만으로 만들어 주세요.",
    input_too_long: "입력 내용이 너무 깁니다. 기록 수를 줄이거나 메모를 짧게 한 뒤 다시 시도해 주세요.",
    bad_request: "AI 생성 요청을 처리하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.",
    turnstile_failed: "자동 전송 방지 확인에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.",
    rate_limit_minute: "짧은 시간에 AI 생성이 여러 번 실행되었습니다. 1분 정도 기다린 뒤 다시 시도해 주세요.",
    rate_limit_day: "오늘의 AI 생성 횟수가 상한에 도달했습니다. 내일 이후에 다시 시도해 주세요.",
    rate_limit_session_day: "이 브라우저의 오늘 AI 생성 횟수가 상한에 도달했습니다. 내일 이후에 다시 시도해 주세요.",
    concurrent: "같은 회선에서 AI 생성이 실행 중입니다. 완료된 뒤에 다시 시도해 주세요.",
    duplicate: "같은 내용의 AI 생성이 조금 전에 전송되었습니다. 잠시 뒤에 다시 시도해 주세요.",
  },
  "zh-TW": {
    method_not_allowed: "AI產生API僅接受POST請求。",
    bad_origin: "不接受來自本站以外的AI產生請求。",
    no_entries: "沒有可用於製作旅行記的紀錄。",
    too_many_entries: `一次最多可產生${MAX_AI_SPOTS}筆紀錄。請縮小範圍後再試。`,
    images_not_allowed: "照片資料無法傳送到AI產生API。請只使用地點、日期和備忘。",
    input_too_long: "輸入內容過長。請減少紀錄筆數或縮短備忘後再試。",
    bad_request: "無法處理AI產生請求。請確認輸入內容後再試。",
    turnstile_failed: "自動送出防護的驗證失敗。請重新載入頁面後再試。",
    rate_limit_minute: "短時間內多次執行了AI產生。請等待約1分鐘後再試。",
    rate_limit_day: "今日的AI產生次數已達上限。請明日以後再試。",
    rate_limit_session_day: "此瀏覽器今日的AI產生次數已達上限。請明日以後再試。",
    concurrent: "同一線路正在執行AI產生。請等待完成後再試。",
    duplicate: "短時間內送出了相同內容的AI產生。請稍候片刻後再試。",
  },
  de: {
    method_not_allowed: "Die KI-Erstellungs-API nimmt nur POST-Anfragen an.",
    bad_origin: "Anfragen zur KI-Erstellung von außerhalb dieser Website werden nicht angenommen.",
    no_entries: "Es sind keine Einträge vorhanden, aus denen ein Reisebericht erstellt werden kann.",
    too_many_entries: `Es können höchstens ${MAX_AI_SPOTS} Einträge auf einmal erzeugt werden. Grenzen Sie die Auswahl ein und versuchen Sie es erneut.`,
    images_not_allowed: "Fotodaten können nicht an die KI-Erstellungs-API gesendet werden. Verwenden Sie nur Orte, Daten und Notizen.",
    input_too_long: "Die Eingabe ist zu lang. Kürzen Sie die Notizen oder verringern Sie die Zahl der Einträge und versuchen Sie es erneut.",
    bad_request: "Die Anfrage zur KI-Erstellung konnte nicht verarbeitet werden. Prüfen Sie die Eingabe und versuchen Sie es erneut.",
    turnstile_failed: "Der Bot-Schutz hat die Prüfung abgelehnt. Laden Sie die Seite neu und versuchen Sie es erneut.",
    rate_limit_minute: "Die KI-Erstellung wurde in kurzer Zeit mehrfach ausgeführt. Warten Sie etwa eine Minute und versuchen Sie es erneut.",
    rate_limit_day: "Das heutige Limit für KI-Erstellungen ist erreicht. Bitte versuchen Sie es morgen erneut.",
    rate_limit_session_day: "Das heutige Limit für KI-Erstellungen in diesem Browser ist erreicht. Bitte versuchen Sie es morgen erneut.",
    concurrent: "Aus derselben Verbindung läuft bereits eine KI-Erstellung. Warten Sie, bis sie abgeschlossen ist, und versuchen Sie es erneut.",
    duplicate: "Derselbe Inhalt wurde gerade zur KI-Erstellung gesendet. Warten Sie einen Moment und versuchen Sie es erneut.",
  },
};

/**
 * サーバーのエラーレスポンスを、画面に出す1文にする。
 *
 * 対応表にないコード（サーバー側にあとから増えたものなど）はサーバーの文面を
 * そのまま出す。クライアントが知らないというだけで何も表示されない、という
 * 状態にしないため。
 */
function apiErrorMessage(
  language: OutputLanguage,
  code: string | undefined,
  serverMessage: string | undefined
): string {
  const table = API_ERROR_MESSAGES[language] || API_ERROR_MESSAGES.ja;
  const known = code && Object.prototype.hasOwnProperty.call(table, code) ? table[code as ApiErrorCode] : "";
  return known || serverMessage || uiLabel(language, "aiGenerateFailed");
}

type UiLabelKey =
  | "toneWarm"
  | "toneSimple"
  | "toneDiary"
  | "toneGuide"
  | "placeUnset"
  | "rangeUnset"
  | "worldHeritage"
  | "downloadFallbackName"
  | "coverFileSuffix"
  | "samplesTitle"
  | "samplesDesc"
  | "samplesCta"
  | "photoTitle"
  | "photoDesc"
  | "photoPick"
  | "photoPickNote"
  | "photoProcessing"
  | "filterTitle"
  | "filterClear"
  | "filterDescHeritage"
  | "filterDescLifemap"
  | "filterFrom"
  | "filterTo"
  | "filterRegion"
  | "filterRegionAll"
  | "filterTag"
  | "filterTagAll"
  | "filterKeyword"
  | "filterKeywordPlaceholder"
  | "filterKeywordNoteHeritage"
  | "filterKeywordNoteLifemap"
  | "photoEditTitle"
  | "photoEditDesc"
  | "photoPlacePlaceholder"
  | "photoDeleteLabel"
  | "photoMemoLabel"
  | "photoMemoPlaceholder"
  | "photoMemoNote"
  | "photoPrefPlaceholder"
  | "photoLatPlaceholder"
  | "photoLngPlaceholder"
  | "photoGpsYes"
  | "photoGpsNo"
  | "fieldTitle"
  | "fieldTraveler"
  | "travelerPlaceholder"
  | "fieldTone"
  | "turnstileLoading"
  | "turnstileError"
  | "turnstileMissing"
  | "aiScopeNote"
  | "aiNotReady"
  | "aiGenerateFailed"
  | "precisionPrefecture"
  | "precisionApproximate"
  | "precisionExact"
  | "mapUnset"
  | "entryMemoLabel"
  | "entryMemoPlaceholder"
  | "entryMemoNote"
  | "summaryTitle"
  | "summaryAll"
  | "summaryUsed"
  | "summaryMapped"
  | "summaryRange"
  | "loadingRecords"
  | "emptyTitle"
  | "emptyDescPhoto"
  | "emptyDescHeritage"
  | "emptyDescLifemap"
  | "emptyPickPhoto"
  | "emptyCtaHeritage"
  | "emptyCtaLifemap"
  | "noMatchTitle"
  | "noMatchDesc"
  | "previewLabel"
  | "previewCount"
  | "previewCountOne"
  | "selectionCount"
  | "selectionCountOne"
  | "entrySelectLabel"
  | "selectAll"
  | "selectNone"
  | "selectionNoneTitle"
  | "selectionNoneDesc"
  | "generateSectionTitle"
  | "currentSettingsNote"
  | "writeModeTitle"
  | "writeModeAiLabel"
  | "writeModeAiDesc"
  | "writeModeManualLabel"
  | "writeModeManualDesc"
  | "switchToManual"
  | "switchToAi"
  | "aiStepHint"
  | "sectionTextTitle"
  | "sectionTextDesc"
  | "bodyLabel"
  | "bodyPlaceholder"
  | "spotTitleLabel"
  | "spotCaptionLabel"
  | "spotCaptionPlaceholder"
  | "memoryPlace"
  | "loadErrorHeritage"
  | "loadErrorLifemap"
  | "draftSave"
  | "draftRestore"
  | "draftDelete"
  | "draftNote"
  | "draftSaved"
  | "draftSaveFailed"
  | "draftNone"
  | "draftRestored"
  | "draftRestoreFailed"
  | "draftDeleted"
  | "draftDeleteFailed"
  | "hashtags"
  | "photoHeicWarn"
  | "photoNone"
  | "photoImportFailed"
  | "pdfNote"
  | "mapLoading"
  | "serviceName"
  | "tagline"
  | "backTop"
  | "lifeMap"
  | "heritage"
  | "drivePlanner"
  | "heroTitle"
  | "heroBody"
  | "outputLanguage"
  | "settings"
  | "generateAi"
  | "generating"
  | "template"
  | "copyPost"
  | "saveImage"
  | "savePdf"
  // ボタンを押した直後、ボタン自身のラベルを一時的に差し替えるための文言。
  // ラベルは短く、次にすることは直下の Hint に分けている（独仏で1行に収めるため）。
  | "copyDone"
  | "copyDoneHint"
  | "copyFailedLabel"
  | "copyFailedHint"
  | "imageDone"
  | "imageDoneHint"
  | "imageFailedLabel"
  | "imageFailedHint"
  | "photoPrivacy"
  | "noticeTitle"
  | "noticeBody"
  | "dataTitle"
  | "dataNote1"
  | "dataNote2"
  | "dataNote3"
  | "cardLifeMapTitle"
  | "cardLifeMapBody"
  | "cardHeritageTitle"
  | "cardHeritageBody"
  | "cardPhotoTitle"
  | "cardPhotoBody"

function uiLabel(
  language: OutputLanguage,
  key: UiLabelKey
): string {
  // ja / en は全キー必須。それ以外の5言語はキーを省略でき、その場合は英語にフォールバックする。
  const labels: Partial<Record<OutputLanguage, Partial<Record<typeof key, string>>>> & {
    ja: Record<typeof key, string>;
    en: Record<typeof key, string>;
  } = {
    ja: {
      toneWarm: "自分の記憶をやさしく振り返る",
      toneSimple: "短く素直な記録文",
      toneDiary: "日記のような一人称",
      toneGuide: "場所の魅力も少し添える",
      placeUnset: "場所未設定",
      rangeUnset: "範囲未選択",
      worldHeritage: "世界遺産",
      downloadFallbackName: "旅行記",
      coverFileSuffix: "-旅行記アイキャッチ",
      samplesTitle: "AIが作った旅行記の実例を見る",
      samplesDesc: "京都・北海道・沖縄など5本のサンプルを公開しています。どんな文章になるか、作る前に確認できます。",
      samplesCta: "5本を見る →",
      photoTitle: "写真を選んで旅行記を作る",
      photoDesc: "選んだ写真はこの画面内だけでリサイズされます。JPEGのEXIFに撮影日・GPSがあれば自動で読み取ります。",
      photoPick: "写真をまとめて選択",
      photoPickNote: "スマホではカメラ撮影も選べます",
      photoProcessing: "写真を端末内で処理しています...",
      filterTitle: "旅行の日付・記録の絞り込み",
      filterClear: "条件クリア",
      filterDescHeritage: "世界遺産パスポートから読み込んだ訪問記録のうち、旅行記に使うものだけを選ぶための条件です。未入力なら読み込んだ記録をすべて使います。",
      filterDescLifemap: "人生体験マップから読み込んだ記録のうち、今回の旅行記に使うものだけを選ぶための条件です。未入力なら読み込んだ記録をすべて使います。",
      filterFrom: "旅行開始日",
      filterTo: "旅行終了日",
      filterRegion: "訪問地域",
      filterRegionAll: "すべての訪問地域",
      filterTag: "旅のタグ",
      filterTagAll: "すべての旅タグ",
      filterKeyword: "場所名・元メモで絞り込み",
      filterKeywordPlaceholder: "人生体験マップの元メモ、場所名、印象に残った言葉など",
      filterKeywordNoteHeritage: "世界遺産パスポートから読み込んだ元メモ・世界遺産名・国名を検索します。生成後の文章欄は検索対象ではありません。",
      filterKeywordNoteLifemap: "人生体験マップから読み込んだ元メモを検索します。生成後の文章欄は検索対象ではありません。",
      photoEditTitle: "写真情報の編集",
      photoEditDesc: "GPSがない写真は、場所名・都道府県・緯度経度のいずれかを入力してください。「AIに渡す元メモ」に書いた内容が旅行記文章の材料になります。",
      photoPlacePlaceholder: "場所名（例：箱根、兼六園）",
      photoDeleteLabel: "写真を削除",
      photoMemoLabel: "AIに渡す元メモ（写真の説明・その時の記録）",
      photoMemoPlaceholder: "例：海辺で釣りをした。風が強かった。家族で休憩した。",
      photoMemoNote: "メモ欄の編集内容は、AI旅行記メーカー画面内の素材として使われます。写真そのものはAIに送信しません。",
      photoPrefPlaceholder: "都道府県・訪問地域",
      photoLatPlaceholder: "緯度",
      photoLngPlaceholder: "経度",
      photoGpsYes: "位置情報あり。地図に表示できます。",
      photoGpsNo: "GPSなし。場所名や都道府県だけでも旅行記には使えます。",
      fieldTitle: "タイトル",
      fieldTraveler: "旅行者名",
      travelerPlaceholder: "例：山田家、たろう",
      fieldTone: "旅行記の語り口",
      turnstileLoading: "自動送信対策を読み込んでいます。数秒お待ちください。",
      turnstileError: "自動送信対策を読み込めませんでした。ページを再読み込みしてください。改善しない場合は、Cloudflare Turnstileのドメイン設定をご確認ください。",
      turnstileMissing: "AI生成の不正利用対策が未設定です。Cloudflare Turnstile のサイトキーを設定するとAI生成を使えます。",
      aiScopeNote: "AIは、読み込んだ各記録の「場所・都道府県・日付・タグ・元メモ」と、タイトル・記録者名・文体・出力言語などの設定だけをもとに旅行記を作ります。写真そのもの、下の編集済み文章、SNS/PDF出力内容はAIに送りません。",
      aiNotReady: "AI生成の認証確認が完了していません。しばらく待ってから再度お試しください。",
      aiGenerateFailed: "文章生成に失敗しました",
      precisionPrefecture: "都道府県単位",
      precisionApproximate: "おおよその位置",
      precisionExact: "詳細位置",
      mapUnset: "地図未設定",
      entryMemoLabel: "AIに渡す元メモ（この画面内で編集）",
      entryMemoPlaceholder: "例：その場所で感じたこと、印象に残った出来事、写真に残した理由など",
      entryMemoNote: "メモ欄の編集内容は、AI旅行記メーカー画面内の素材として使われます。人生体験マップや世界遺産パスポートに戻っても、元データには反映されません。",
      summaryTitle: "読み込んだ記録",
      summaryAll: "全記録",
      summaryUsed: "旅行記に使う記録",
      summaryMapped: "地図",
      summaryRange: "旅行記に使う期間:",
      loadingRecords: "人生体験マップの記録を読み込んでいます...",
      emptyTitle: "まだ記録がありません",
      emptyDescPhoto: "写真を選択すると、ここに旅行記の記録として表示されます。",
      emptyDescHeritage: "世界遺産パスポートの写真・訪問日・メモを読み込んで、ここに旅行記の記録として表示します。",
      emptyDescLifemap: "人生体験マップの写真・場所・日付・メモを読み込んで、ここに旅行記の記録として表示します。",
      emptyPickPhoto: "写真を選択する",
      emptyCtaHeritage: "世界遺産パスポートで記録する",
      emptyCtaLifemap: "人生体験マップで記録する",
      noMatchTitle: "条件に合う記録がありません",
      noMatchDesc: "日付・訪問地域・旅のタグの条件を広げると表示される可能性があります。",
      previewLabel: "プレビュー",
      previewCount: "{n}件の記録を時系列で表示中",
      previewCountOne: "{n}件の記録を時系列で表示中",
      selectionCount: "絞り込み後{n}件のうち{m}件を使用",
      selectionCountOne: "絞り込み後{n}件のうち{m}件を使用",
      entrySelectLabel: "この記録を使う",
      selectAll: "すべて選ぶ",
      selectNone: "すべて外す",
      selectionNoneTitle: "旅行記に使う記録を選んでください",
      selectionNoneDesc: "下に並ぶ記録のチェックを入れると、その記録が旅行記に使われます。今回の旅行の記録だけを選んでください。",
      generateSectionTitle: "旅行記を作る",
      currentSettingsNote: "トーン: {tone}／出力言語: {lang}（変更は設定パネルから）",
      writeModeTitle: "どちらで書きますか？",
      writeModeAiLabel: "AIに書いてもらう",
      writeModeAiDesc: "メモから旅行記を自動生成します",
      writeModeManualLabel: "自分で書く",
      writeModeManualDesc: "見出しや文章を直接入力します",
      switchToManual: "自分で書く方法に切り替える",
      switchToAi: "AIに書いてもらう方法に切り替える",
      aiStepHint: "まず各記録にメモを書いてから、AI生成ボタンを押してください。",
      sectionTextTitle: "旅行記文章",
      sectionTextDesc: "下に並ぶ記録のうち、チェックを入れた記録の元メモから旅行記を作ります。この欄と各記録のスポット欄はAIが書きますが、生成を待たずに自分で書くこともできます。編集した文章はSNS投稿文やアイキャッチ画像、必要に応じてPDFにも使われます。",
      bodyLabel: "旅行記本文（AIが書きます。生成前でも自分で書けます）",
      bodyPlaceholder: "ここにAIが書いた旅行記本文が入ります。生成前に自分で書いてもかまいません。",
      spotTitleLabel: "スポット見出し（AIが書きます。生成前でも自分で書けます）",
      spotCaptionLabel: "スポット別文章（AIが書きます。生成前でも自分で書けます）",
      spotCaptionPlaceholder: "ここにAIが書いたスポット別文章が入ります。生成前に自分で書いてもかまいません。編集しても、再生成するまではAIの入力にはなりません。",
      memoryPlace: "思い出の場所",
      loadErrorHeritage: "世界遺産パスポートの記録を読み込めませんでした。同じドメインの /heritage で保存した記録があるか確認してください。",
      loadErrorLifemap: "人生体験マップの記録を読み込めませんでした。ブラウザの保存機能が使える状態か確認してください。",
      draftSave: "下書き保存",
      draftRestore: "下書き復元",
      draftDelete: "下書き削除",
      draftNote: "下書きはこのブラウザだけに保存されます。写真入口の下書きは画像も含むため、枚数が多い場合は保存できないことがあります。",
      draftSaved: "下書きをこのブラウザに保存しました。",
      draftSaveFailed: "下書きを保存できませんでした。写真が多い場合はブラウザ容量を超えている可能性があります。",
      draftNone: "保存済みの下書きはありません。",
      draftRestored: "下書きを復元しました。",
      draftRestoreFailed: "下書きを復元できませんでした。",
      draftDeleted: "下書きを削除しました。",
      draftDeleteFailed: "下書きを削除できませんでした。",
      hashtags: "#AI旅行記メーカー #AITravelJournal #旅行記",
      photoHeicWarn: "HEIC写真はこのブラウザで直接表示できない場合があります。表示できない場合はiPhone側でJPEGとして共有してからお試しください。",
      photoNone: "取り込める写真がありませんでした。JPEG / PNG / WebP 形式をお試しください。",
      photoImportFailed: "写真の取り込みに失敗しました",
      pdfNote: "この画面ではSNS投稿文とブログ用アイキャッチ画像の作成を中心にしています。PDF保存は補助機能として、A4 1枚で手元に残したい場合に使えます。",
      mapLoading: "地図を読み込んでいます...",
      serviceName: "AI旅行記メーカー",
      tagline: "写真とメモから、旅の思い出をAI旅行記に。",
      backTop: "トップへ戻る",
      lifeMap: "人生体験マップへ",
      heritage: "世界遺産パスポートへ",
      drivePlanner: "AIドライブプランナーへ",
      heroTitle: "写真とメモから、旅の思い出をAI旅行記に。",
      heroBody: "人生体験マップに保存した場所・日付・メモをもとに、AIが記録者目線の旅行記を作成。SNS投稿文、ブログ用アイキャッチ画像、必要に応じてA4 1枚のPDFとして保存できます。旅行計画ではなく、旅行後の思い出整理サービスです。",
      outputLanguage: "出力言語",
      settings: "旅行記設定",
      generateAi: "読み込んだ元メモからAI旅行記を作成",
      generating: "文章を生成中...",
      template: "AIなしで記録文を作る",
      copyPost: "SNS投稿文をコピー",
      saveImage: "アイキャッチ画像を保存",
      savePdf: "PDFでも保存する",
      copyDone: "コピーしました",
      copyDoneHint: "SNSアプリを開いて貼り付けてください。",
      copyFailedLabel: "コピーできませんでした",
      copyFailedHint: "下の文章欄を選んで、手動でコピーしてください。",
      imageDone: "画像を保存しました",
      imageDoneHint: "端末のダウンロード先に保存しました。SNSの投稿に添付してください。",
      imageFailedLabel: "画像を保存できませんでした",
      imageFailedHint: "写真を読み込み直すか、少し時間をおいてもう一度お試しください。",
      photoPrivacy: "写真は端末内で扱い、送信しません。送信するのは、地名・日付・メモ・タイトル・記録者名・設定などの文字情報だけです。",
      noticeTitle: "ご利用上の注意",
      noticeBody: "本サイトのソースコード・デザイン・コンテンツの無断複製・転用・再配布を禁止します。",
      dataTitle: "データの保存について",
      dataNote1: "下書き保存を押した場合、写真・場所・メモ等のデータはこのブラウザ内のlocalStorageに保存されます。サーバー送信やクラウド自動バックアップは行いません。",
      dataNote2: "ブラウザの閲覧データ削除、キャッシュクリア、端末の初期化・機種変更、ブラウザ変更等により、下書きデータが消失する場合があります。",
      dataNote3: "データの消失・破損に関して、当サービスは責任を負いかねます。大切な旅行記は、SNS投稿文・アイキャッチ画像・PDFとして端末へ保存してください。",
      cardLifeMapTitle: "人生体験マップの記録から作る",
      cardLifeMapBody: "保存済みの写真・日付・場所・メモを読み込み、今回の旅だけに絞って、旅行記として文章と一緒に残します。",
      cardHeritageTitle: "世界遺産パスポートの記録から作る",
      cardHeritageBody: "世界遺産パスポートに保存した訪問日・写真・メモを読み込み、SNS投稿文やアイキャッチ画像にまとめます。",
      cardPhotoTitle: "写真を選んで作る",
      cardPhotoBody: "未保存の写真を選んで、撮影日・GPSを読み取りながら、旅の記録として文章と一緒に残します。",
    },
    en: {
      toneWarm: "Look back gently on your own memories",
      toneSimple: "Short, plain record",
      toneDiary: "First person, like a diary",
      toneGuide: "With a touch of what makes each place special",
      placeUnset: "Place not set",
      rangeUnset: "No period selected",
      worldHeritage: "World Heritage site",
      downloadFallbackName: "travel-journal",
      coverFileSuffix: "-travel-journal-cover",
      samplesTitle: "See example travel journals written by AI",
      samplesDesc: "Five samples are published, including Kyoto, Hokkaido and Okinawa. See what the writing looks like before you make your own.",
      samplesCta: "View all five →",
      photoTitle: "Pick photos and build a travel journal",
      photoDesc: "The photos you pick are resized on this screen only. If a JPEG has EXIF date or GPS data, it is read automatically.",
      photoPick: "Select multiple photos",
      photoPickNote: "On a phone you can also take a photo",
      photoProcessing: "Processing photos on your device...",
      filterTitle: "Trip dates and record filter",
      filterClear: "Clear filters",
      filterDescHeritage: "These filters pick which of the visit records loaded from the World Heritage Passport go into the travel journal. Leave them empty to use every record you loaded.",
      filterDescLifemap: "These filters pick which of the records loaded from the Life Experience Map go into this travel journal. Leave them empty to use every record you loaded.",
      filterFrom: "Trip start date",
      filterTo: "Trip end date",
      filterRegion: "Area visited",
      filterRegionAll: "All areas visited",
      filterTag: "Trip tag",
      filterTagAll: "All trip tags",
      filterKeyword: "Filter by place name or original note",
      filterKeywordPlaceholder: "Original notes from the Life Experience Map, place names, words that stayed with you",
      filterKeywordNoteHeritage: "Searches the original notes, World Heritage site names and country names loaded from the World Heritage Passport. The generated text fields are not searched.",
      filterKeywordNoteLifemap: "Searches the original notes loaded from the Life Experience Map. The generated text fields are not searched.",
      photoEditTitle: "Edit photo details",
      photoEditDesc: "For photos without GPS, enter a place name, a region, or latitude and longitude. What you write in \"Original note for the AI\" becomes the material for the journal text.",
      photoPlacePlaceholder: "Place name (e.g. Hakone, Kenrokuen)",
      photoDeleteLabel: "Delete photo",
      photoMemoLabel: "Original note for the AI (what the photo shows, what happened)",
      photoMemoPlaceholder: "e.g. Fished by the sea. The wind was strong. The family took a break.",
      photoMemoNote: "What you edit in the note field is used as material inside the AI Travel Journal Maker screen. The photos themselves are never sent to the AI.",
      photoPrefPlaceholder: "Region or area visited",
      photoLatPlaceholder: "Latitude",
      photoLngPlaceholder: "Longitude",
      photoGpsYes: "Location data present. It can be shown on the map.",
      photoGpsNo: "No GPS. A place name or region alone is still enough for the journal.",
      fieldTitle: "Title",
      fieldTraveler: "Traveler name",
      travelerPlaceholder: "e.g. The Yamada family, Taro",
      fieldTone: "Voice of the journal",
      turnstileLoading: "Loading the anti-bot check. This takes a few seconds.",
      turnstileError: "The anti-bot check could not be loaded. Please reload the page. If that does not help, check the domain settings for Cloudflare Turnstile.",
      turnstileMissing: "Abuse protection for AI generation is not configured. Set a Cloudflare Turnstile site key to enable AI generation.",
      aiScopeNote: "The AI writes from the place, region, date, tag and original note of each loaded record, plus your settings such as title, author name, voice and output language. The photos themselves, the edited text below and the social or PDF output are never sent to the AI.",
      aiNotReady: "The verification for AI generation has not finished yet. Please wait a moment and try again.",
      aiGenerateFailed: "The text could not be generated",
      precisionPrefecture: "Region level",
      precisionApproximate: "Approximate location",
      precisionExact: "Exact location",
      mapUnset: "Not on the map",
      entryMemoLabel: "Original note for the AI (edited on this screen)",
      entryMemoPlaceholder: "e.g. how the place felt, what stayed with you, why you took the photo",
      entryMemoNote: "What you edit in the note field is used as material inside the AI Travel Journal Maker screen. Going back to the Life Experience Map or the World Heritage Passport will not change the original data.",
      summaryTitle: "Loaded records",
      summaryAll: "All records",
      summaryUsed: "Used in the journal",
      summaryMapped: "On the map",
      summaryRange: "Period covered by the journal:",
      loadingRecords: "Loading records from the Life Experience Map...",
      emptyTitle: "No records yet",
      emptyDescPhoto: "Pick photos and they will appear here as journal records.",
      emptyDescHeritage: "Load the photos, visit dates and notes from the World Heritage Passport, and they will appear here as journal records.",
      emptyDescLifemap: "Load the photos, places, dates and notes from the Life Experience Map, and they will appear here as journal records.",
      emptyPickPhoto: "Select photos",
      emptyCtaHeritage: "Record a visit in the World Heritage Passport",
      emptyCtaLifemap: "Record a memory in the Life Experience Map",
      noMatchTitle: "No records match the filters",
      noMatchDesc: "Widening the date, area or trip tag filters may bring records back.",
      previewLabel: "Preview",
      previewCount: "Showing {n} records in date order",
      previewCountOne: "Showing {n} record in date order",
      selectionCount: "Using {m} of {n} filtered records",
      selectionCountOne: "Using {m} of {n} filtered record",
      entrySelectLabel: "Use this record",
      selectAll: "Select all",
      selectNone: "Deselect all",
      selectionNoneTitle: "Choose the records for this journal",
      selectionNoneDesc: "Tick the records below to include them in the journal. Pick only the records from this trip.",
      generateSectionTitle: "Create the journal",
      currentSettingsNote: "Tone: {tone} / Output language: {lang} (change these in the settings panel)",
      writeModeTitle: "How would you like to write it?",
      writeModeAiLabel: "Let AI write it",
      writeModeAiDesc: "Automatically generates the journal from your notes",
      writeModeManualLabel: "Write it yourself",
      writeModeManualDesc: "Enter the heading and text directly",
      switchToManual: "Switch to writing it yourself",
      switchToAi: "Switch to letting AI write it",
      aiStepHint: "Write a note for each record, then press the AI generate button.",
      sectionTextTitle: "Journal text",
      sectionTextDesc: "The journal is written from the original notes of the records you tick below. This box and the spot fields on each record are where the generated text goes, and you can write there yourself without waiting for generation. What you edit here is used for the social post, the cover image and, if you want one, the PDF.",
      bodyLabel: "Main text (AI writes this; you can also write it yourself before generating)",
      bodyPlaceholder: "The main text AI writes appears here. You can also write it yourself before generating.",
      spotTitleLabel: "Spot heading (AI writes this; you can also write it yourself before generating)",
      spotCaptionLabel: "Spot text (AI writes this; you can also write it yourself before generating)",
      spotCaptionPlaceholder: "The per-spot text AI writes appears here. You can also write it yourself before generating. Editing it here does not feed back into the AI until you generate again.",
      memoryPlace: "A place to remember",
      loadErrorHeritage: "The records from the World Heritage Passport could not be loaded. Check that you have records saved at /heritage on this same domain.",
      loadErrorLifemap: "The records from the Life Experience Map could not be loaded. Check that this browser allows local storage.",
      draftSave: "Save draft",
      draftRestore: "Restore draft",
      draftDelete: "Delete draft",
      draftNote: "Drafts are stored only in this browser. Drafts started from photos include the images themselves, so saving can fail when there are many of them.",
      draftSaved: "Draft saved in this browser.",
      draftSaveFailed: "The draft could not be saved. With many photos it may exceed this browser's storage limit.",
      draftNone: "There is no saved draft.",
      draftRestored: "Draft restored.",
      draftRestoreFailed: "The draft could not be restored.",
      draftDeleted: "Draft deleted.",
      draftDeleteFailed: "The draft could not be deleted.",
      hashtags: "#TravelJournal #TravelDiary #AITravelJournal",
      photoHeicWarn: "Some browsers cannot show HEIC photos directly. If a photo does not appear, share it as JPEG from your iPhone and try again.",
      photoNone: "No photos could be imported. Try JPEG, PNG or WebP files.",
      photoImportFailed: "The photos could not be imported",
      pdfNote: "This screen is mainly for creating the social post text and the blog cover image. Saving a PDF is a secondary option, for when you want a single A4 page to keep.",
      mapLoading: "Loading the map...",
      serviceName: "AI Travel Journal Maker",
      tagline: "Turn photos and notes into an AI travel journal.",
      backTop: "Back to top",
      lifeMap: "Life Experience Map",
      heritage: "World Heritage Passport",
      drivePlanner: "AI Drive Planner",
      heroTitle: "Turn photos and notes into an AI travel journal.",
      heroBody: "Based on places, dates, and notes saved in Life Experience Map, AI creates a travel journal from the recorder's point of view. Save it as social media post text, a blog cover image, or an A4 one-page PDF when needed. This is for organizing memories after a trip, not planning one.",
      outputLanguage: "Output language",
      settings: "Journal settings",
      generateAi: "Create an AI travel journal from source notes",
      generating: "Generating text...",
      template: "Create without AI",
      copyPost: "Copy social media post text",
      saveImage: "Save cover image",
      savePdf: "Save as PDF too",
      copyDone: "Copied",
      copyDoneHint: "Open your social media app and paste it in.",
      copyFailedLabel: "Could not copy",
      copyFailedHint: "Select the text below and copy it manually.",
      imageDone: "Image saved",
      imageDoneHint: "Saved to your downloads. Attach it to your post.",
      imageFailedLabel: "Could not save the image",
      imageFailedHint: "Reload the photo, or try again in a moment.",
      photoPrivacy: "Photos are handled on your device and are never sent. Only text — place names, dates, your notes, and the title and settings you enter — is sent to generate your journal.",
      noticeTitle: "Copyright notice",
      noticeBody: "Unauthorized copying, reuse, or redistribution of this site's source code, design, and content is prohibited.",
      dataTitle: "About saved data",
      dataNote1: "When you tap Save draft, your photos, places, notes, and other data are stored in this browser's localStorage. Nothing is sent to a server, and there is no automatic cloud backup.",
      dataNote2: "Draft data can be lost if you clear your browsing data or cache, reset or replace your device, or switch to a different browser.",
      dataNote3: "We cannot take responsibility for lost or corrupted data. Save the journals that matter to you onto your own device as social media post text, a cover image, or a PDF.",
      cardLifeMapTitle: "Create from Life Experience Map records",
      cardLifeMapBody: "Load the photos, dates, places, and notes you have already saved, narrow them down to this one trip, and keep them as a written journal.",
      cardHeritageTitle: "Create from World Heritage Passport records",
      cardHeritageBody: "Load the visit dates, photos, and notes saved in World Heritage Passport, and bring them together as social media post text and a cover image.",
      cardPhotoTitle: "Create by choosing photos",
      cardPhotoBody: "Choose photos you have not saved yet. The date taken and GPS are read automatically, and everything is kept as a written record of your trip.",
    },
    "zh-CN": {
      toneWarm: "温柔地回顾自己的记忆",
      toneSimple: "简短朴实的记录文",
      toneDiary: "日记式的第一人称",
      toneGuide: "略微介绍地点的魅力",
      placeUnset: "未设置地点",
      rangeUnset: "未选择范围",
      worldHeritage: "世界遗产",
      downloadFallbackName: "travel-journal",
      coverFileSuffix: "-旅行记封面图",
      samplesTitle: "查看AI生成的旅行记实例",
      samplesDesc: "已公开京都、北海道、冲绳等5篇范例。制作前可以先确认文章的风格。",
      samplesCta: "查看全部5篇 →",
      photoTitle: "选择照片制作旅行记",
      photoDesc: "所选照片仅在本页面内缩放。若JPEG的EXIF中含有拍摄日期或GPS信息，将自动读取。",
      photoPick: "批量选择照片",
      photoPickNote: "手机上也可以直接拍照",
      photoProcessing: "正在本机处理照片...",
      filterTitle: "旅行日期与记录筛选",
      filterClear: "清除条件",
      filterDescHeritage: "用于从世界遗产护照读取的访问记录中，挑选要用于旅行记的部分。留空则使用全部已读取的记录。",
      filterDescLifemap: "用于从人生体验地图读取的记录中，挑选本次旅行记要使用的部分。留空则使用全部已读取的记录。",
      filterFrom: "旅行开始日",
      filterTo: "旅行结束日",
      filterRegion: "到访地区",
      filterRegionAll: "全部到访地区",
      filterTag: "旅行标签",
      filterTagAll: "全部旅行标签",
      filterKeyword: "按地点名称或原始备忘筛选",
      filterKeywordPlaceholder: "人生体验地图的原始备忘、地点名称、印象深刻的词句等",
      filterKeywordNoteHeritage: "搜索从世界遗产护照读取的原始备忘、世界遗产名称与国家名称。生成后的文章栏不在搜索范围内。",
      filterKeywordNoteLifemap: "搜索从人生体验地图读取的原始备忘。生成后的文章栏不在搜索范围内。",
      photoEditTitle: "编辑照片信息",
      photoEditDesc: "没有GPS的照片，请填写地点名称、地区或经纬度中的任意一项。填写在「提供给AI的原始备忘」中的内容将成为旅行记文章的素材。",
      photoPlacePlaceholder: "地点名称（例：箱根、兼六园）",
      photoDeleteLabel: "删除照片",
      photoMemoLabel: "提供给AI的原始备忘（照片说明、当时的记录）",
      photoMemoPlaceholder: "例：在海边钓鱼。风很大。和家人一起休息了一会儿。",
      photoMemoNote: "备忘栏的编辑内容仅作为AI旅行记制作页面内的素材使用。照片本身不会发送给AI。",
      photoPrefPlaceholder: "地区・到访地区",
      photoLatPlaceholder: "纬度",
      photoLngPlaceholder: "经度",
      photoGpsYes: "含位置信息。可以在地图上显示。",
      photoGpsNo: "无GPS。仅有地点名称或地区也可以用于旅行记。",
      fieldTitle: "标题",
      fieldTraveler: "旅行者姓名",
      travelerPlaceholder: "例：山田一家、太郎",
      fieldTone: "旅行记的语气",
      turnstileLoading: "正在加载自动提交防护。请稍等几秒。",
      turnstileError: "无法加载自动提交防护。请重新加载页面。若仍未改善，请确认Cloudflare Turnstile的域名设置。",
      turnstileMissing: "尚未设置AI生成的滥用防护。设置Cloudflare Turnstile的站点密钥后即可使用AI生成。",
      aiScopeNote: "AI仅根据各条记录的地点、地区、日期、标签、原始备忘，以及标题、记录者姓名、文体、输出语言等设置来撰写旅行记。照片本身、下方已编辑的文字、SNS与PDF输出内容都不会发送给AI。",
      aiNotReady: "AI生成的验证尚未完成。请稍候再试。",
      aiGenerateFailed: "文章生成失败",
      precisionPrefecture: "地区级别",
      precisionApproximate: "大致位置",
      precisionExact: "精确位置",
      mapUnset: "未设置地图",
      entryMemoLabel: "提供给AI的原始备忘（在本页面内编辑）",
      entryMemoPlaceholder: "例：在那里的感受、印象深刻的事、拍下这张照片的理由等",
      entryMemoNote: "备忘栏的编辑内容仅作为AI旅行记生成器页面内的素材使用。返回人生体验地图或世界遗产护照后，原始数据不会被改动。",
      summaryTitle: "已读取的记录",
      summaryAll: "全部记录",
      summaryUsed: "用于旅行记",
      summaryMapped: "地图",
      summaryRange: "旅行记涵盖期间：",
      loadingRecords: "正在读取人生体验地图的记录...",
      emptyTitle: "还没有记录",
      emptyDescPhoto: "选择照片后，会在这里显示为旅行记的记录。",
      emptyDescHeritage: "读取世界遗产护照的照片、访问日期与备忘后，会在这里显示为旅行记的记录。",
      emptyDescLifemap: "读取人生体验地图的照片、地点、日期与备忘后，会在这里显示为旅行记的记录。",
      emptyPickPhoto: "选择照片",
      emptyCtaHeritage: "在世界遗产护照中记录",
      emptyCtaLifemap: "在人生体验地图中记录",
      noMatchTitle: "没有符合条件的记录",
      noMatchDesc: "放宽日期、到访地区、旅行标签的条件后，可能会重新显示。",
      previewLabel: "预览",
      previewCount: "正按时间顺序显示{n}条记录",
      previewCountOne: "正按时间顺序显示{n}条记录",
      selectionCount: "筛选后{n}条中使用{m}条",
      selectionCountOne: "筛选后{n}条中使用{m}条",
      entrySelectLabel: "使用这条记录",
      selectAll: "全选",
      selectNone: "全部取消",
      selectionNoneTitle: "请选择要用于旅行记的记录",
      selectionNoneDesc: "勾选下方的记录，即可将其用于旅行记。请只选择本次旅行的记录。",
      generateSectionTitle: "生成旅行记",
      currentSettingsNote: "语气: {tone}／输出语言: {lang}（可在设置面板中更改）",
      writeModeTitle: "要用哪种方式撰写？",
      writeModeAiLabel: "由AI撰写",
      writeModeAiDesc: "根据备忘自动生成旅行记",
      writeModeManualLabel: "自己写",
      writeModeManualDesc: "直接输入标题和文字",
      switchToManual: "切换到自己写",
      switchToAi: "切换到由AI撰写",
      aiStepHint: "先为每条记录写好备忘，再点击AI生成按钮。",
      sectionTextTitle: "旅行记正文",
      sectionTextDesc: "根据下方勾选的记录的原始备忘撰写旅行记。此栏与各记录的地点栏是AI撰写的栏位，不等生成也可以自己写。编辑后的文字会用于SNS投稿文、封面图片，以及需要时的PDF。",
      bodyLabel: "旅行记正文（由AI撰写。生成前也可以自己写）",
      bodyPlaceholder: "AI撰写的旅行记正文会显示在这里。生成前也可以自己写。",
      spotTitleLabel: "地点标题（由AI撰写。生成前也可以自己写）",
      spotCaptionLabel: "各地点文字（由AI撰写。生成前也可以自己写）",
      spotCaptionPlaceholder: "AI撰写的各地点文字会显示在这里。生成前也可以自己写。在重新生成之前，此处的编辑不会作为AI的输入。",
      memoryPlace: "难忘的地点",
      loadErrorHeritage: "无法读取世界遗产护照的记录。请确认同一域名下的 /heritage 中是否有已保存的记录。",
      loadErrorLifemap: "无法读取人生体验地图的记录。请确认本浏览器的本地存储功能是否可用。",
      draftSave: "保存草稿",
      draftRestore: "恢复草稿",
      draftDelete: "删除草稿",
      draftNote: "草稿只保存在本浏览器中。从照片入口保存的草稿包含图片，数量较多时可能无法保存。",
      draftSaved: "草稿已保存到本浏览器。",
      draftSaveFailed: "草稿保存失败。照片较多时可能超出浏览器的存储容量。",
      draftNone: "没有已保存的草稿。",
      draftRestored: "草稿已恢复。",
      draftRestoreFailed: "草稿恢复失败。",
      draftDeleted: "草稿已删除。",
      draftDeleteFailed: "草稿删除失败。",
      hashtags: "#旅行日记 #旅行记录 #AITravelJournal",
      photoHeicWarn: "HEIC照片在部分浏览器中可能无法直接显示。如果无法显示，请先在iPhone上以JPEG格式共享后再试。",
      photoNone: "没有可导入的照片。请尝试 JPEG / PNG / WebP 格式。",
      photoImportFailed: "照片导入失败",
      pdfNote: "本页面主要用于生成SNS投稿文和博客封面图。PDF保存是辅助功能，适合想以A4一页保存在手边的情况。",
      mapLoading: "正在加载地图...",
      serviceName: "AI旅行记生成器",
      tagline: "用照片和备忘，把旅行回忆整理成AI旅行记。",
      backTop: "返回顶部",
      lifeMap: "前往人生体验地图",
      heritage: "前往世界遗产护照",
      drivePlanner: "前往AI自驾规划器",
      heroTitle: "用照片和备忘，把旅行回忆整理成AI旅行记。",
      heroBody: "根据人生体验地图中保存的地点、日期和备忘，AI会以记录者视角生成旅行记。可保存为SNS投稿文、博客封面图，也可按需保存为A4一页PDF。这不是旅行计划工具，而是旅行后的回忆整理服务。",
      outputLanguage: "输出语言",
      settings: "旅行记设置",
      generateAi: "根据读取的原始备忘生成AI旅行记",
      generating: "正在生成文章...",
      template: "不使用AI生成记录文",
      copyPost: "复制SNS投稿文",
      saveImage: "保存封面图",
      savePdf: "也保存为PDF",
      copyDone: "已复制",
      copyDoneHint: "请打开SNS应用粘贴。",
      copyFailedLabel: "复制失败",
      copyFailedHint: "请选中下方文本栏，手动复制。",
      imageDone: "已保存图片",
      imageDoneHint: "已保存到下载位置，请添加到投稿中。",
      imageFailedLabel: "图片保存失败",
      imageFailedHint: "请重新载入照片，或稍后再试。",
      photoPrivacy: "照片仅在您的设备中处理，不会发送。发送的只有地点、日期、备忘、标题、记录者姓名、设置等文字信息。",
      noticeTitle: "使用须知",
      noticeBody: "禁止擅自复制、转用或再分发本站的源代码、设计和内容。",
      dataTitle: "关于数据保存",
      dataNote1: "点击保存草稿后，照片、地点、备忘等数据会保存在本浏览器的localStorage中。不会发送到服务器，也不会自动云端备份。",
      dataNote2: "清除浏览数据或缓存、重置设备、更换机型、更换浏览器等操作，都可能导致草稿数据丢失。",
      dataNote3: "对于数据丢失或损坏，本服务恕不负责。重要的旅行记请保存为SNS投稿文、封面图或PDF，存放到您的设备中。",
      cardLifeMapTitle: "从人生体验地图的记录生成",
      cardLifeMapBody: "读取已保存的照片、日期、地点和备忘，只筛选出这趟旅行的内容，连同文章一起留作旅行记。",
      cardHeritageTitle: "从世界遗产护照的记录生成",
      cardHeritageBody: "读取世界遗产护照中保存的到访日期、照片和备忘，整理成SNS投稿文和封面图。",
      cardPhotoTitle: "选择照片生成",
      cardPhotoBody: "选择尚未保存的照片，自动读取拍摄日期和GPS信息，连同文章一起留作旅行记录。",
    },
    fr: {
      toneWarm: "Revenir avec douceur sur ses souvenirs",
      toneSimple: "Un texte court et simple",
      toneDiary: "À la première personne, comme un journal",
      toneGuide: "Avec un aperçu du charme des lieux",
      placeUnset: "Lieu non renseigné",
      rangeUnset: "Aucune période sélectionnée",
      worldHeritage: "Site du patrimoine mondial",
      downloadFallbackName: "carnet-de-voyage",
      coverFileSuffix: "-couverture-carnet-de-voyage",
      samplesTitle: "Voir des exemples de carnets écrits par l'IA",
      samplesDesc: "Cinq exemples sont publiés, dont Kyoto, Hokkaido et Okinawa. Vous pouvez voir le style des textes avant de créer le vôtre.",
      samplesCta: "Voir les cinq →",
      photoTitle: "Choisir des photos et créer un carnet de voyage",
      photoDesc: "Les photos choisies sont redimensionnées uniquement sur cet écran. Si un JPEG contient une date ou des données GPS dans ses EXIF, elles sont lues automatiquement.",
      photoPick: "Sélectionner plusieurs photos",
      photoPickNote: "Sur téléphone, vous pouvez aussi prendre une photo",
      photoProcessing: "Traitement des photos sur votre appareil...",
      filterTitle: "Dates du voyage et filtre des enregistrements",
      filterClear: "Effacer les filtres",
      filterDescHeritage: "Ces filtres choisissent, parmi les visites importées du Passeport du patrimoine mondial, celles qui entreront dans le carnet. Laissez vide pour utiliser tous les enregistrements importés.",
      filterDescLifemap: "Ces filtres choisissent, parmi les enregistrements importés de la Carte des expériences de vie, ceux qui entreront dans ce carnet. Laissez vide pour utiliser tous les enregistrements importés.",
      filterFrom: "Date de début du voyage",
      filterTo: "Date de fin du voyage",
      filterRegion: "Région visitée",
      filterRegionAll: "Toutes les régions visitées",
      filterTag: "Étiquette de voyage",
      filterTagAll: "Toutes les étiquettes",
      filterKeyword: "Filtrer par lieu ou note d'origine",
      filterKeywordPlaceholder: "Notes d'origine de la Carte des expériences de vie, noms de lieux, mots qui vous sont restés",
      filterKeywordNoteHeritage: "Recherche dans les notes d'origine, les noms de sites du patrimoine mondial et les noms de pays importés du Passeport. Les textes générés ne sont pas inclus dans la recherche.",
      filterKeywordNoteLifemap: "Recherche dans les notes d'origine importées de la Carte des expériences de vie. Les textes générés ne sont pas inclus dans la recherche.",
      photoEditTitle: "Modifier les informations des photos",
      photoEditDesc: "Pour les photos sans GPS, indiquez un nom de lieu, une région, ou la latitude et la longitude. Ce que vous écrivez dans « Note d'origine pour l'IA » sert de matière au texte du carnet.",
      photoPlacePlaceholder: "Nom du lieu (ex. : Hakone, Kenrokuen)",
      photoDeleteLabel: "Supprimer la photo",
      photoMemoLabel: "Note d'origine pour l'IA (ce que montre la photo, ce qui s'est passé)",
      photoMemoPlaceholder: "ex. : Pêche au bord de la mer. Le vent était fort. Pause en famille.",
      photoMemoNote: "Ce que vous modifiez dans le champ de note sert de matière à l'intérieur de l'écran du créateur de carnet. Les photos elles-mêmes ne sont jamais envoyées à l'IA.",
      photoPrefPlaceholder: "Région ou zone visitée",
      photoLatPlaceholder: "Latitude",
      photoLngPlaceholder: "Longitude",
      photoGpsYes: "Données de localisation présentes. Affichage possible sur la carte.",
      photoGpsNo: "Pas de GPS. Un nom de lieu ou une région suffit pour le carnet.",
      fieldTitle: "Titre",
      fieldTraveler: "Nom du voyageur",
      travelerPlaceholder: "ex. : Famille Yamada, Taro",
      fieldTone: "Ton du carnet",
      turnstileLoading: "Chargement de la protection anti-robot. Cela prend quelques secondes.",
      turnstileError: "La protection anti-robot n'a pas pu être chargée. Rechargez la page. Si le problème persiste, vérifiez les réglages de domaine de Cloudflare Turnstile.",
      turnstileMissing: "La protection contre les abus de la génération par IA n'est pas configurée. Renseignez une clé de site Cloudflare Turnstile pour activer la génération par IA.",
      aiScopeNote: "L'IA rédige à partir du lieu, de la région, de la date, du tag et de la note d'origine de chaque enregistrement, ainsi que de vos réglages : titre, nom de l'auteur, ton et langue de sortie. Les photos elles-mêmes, le texte modifié ci-dessous et les sorties réseaux sociaux ou PDF ne sont jamais envoyés à l'IA.",
      aiNotReady: "La vérification de la génération par IA n'est pas terminée. Patientez un instant puis réessayez.",
      aiGenerateFailed: "Échec de la génération du texte",
      precisionPrefecture: "Au niveau de la région",
      precisionApproximate: "Position approximative",
      precisionExact: "Position exacte",
      mapUnset: "Absent de la carte",
      entryMemoLabel: "Note d'origine pour l'IA (modifiable sur cet écran)",
      entryMemoPlaceholder: "ex. ce que vous avez ressenti sur place, ce qui vous a marqué, pourquoi cette photo",
      entryMemoNote: "Ce que vous modifiez dans la note sert de matière première dans l'écran Créateur de carnet de voyage IA. Revenir à la Carte des expériences de vie ou au Passeport du patrimoine mondial ne modifie pas les données d'origine.",
      summaryTitle: "Enregistrements importés",
      summaryAll: "Tous les enregistrements",
      summaryUsed: "Utilisés dans le carnet",
      summaryMapped: "Sur la carte",
      summaryRange: "Période couverte par le carnet :",
      loadingRecords: "Chargement des enregistrements de la Carte des expériences de vie...",
      emptyTitle: "Aucun enregistrement pour l'instant",
      emptyDescPhoto: "Choisissez des photos et elles apparaîtront ici comme enregistrements du carnet.",
      emptyDescHeritage: "Importez les photos, dates de visite et notes du Passeport du patrimoine mondial : elles apparaîtront ici comme enregistrements du carnet.",
      emptyDescLifemap: "Importez les photos, lieux, dates et notes de la Carte des expériences de vie : ils apparaîtront ici comme enregistrements du carnet.",
      emptyPickPhoto: "Choisir des photos",
      emptyCtaHeritage: "Enregistrer une visite dans le Passeport du patrimoine mondial",
      emptyCtaLifemap: "Enregistrer un souvenir dans la Carte des expériences de vie",
      noMatchTitle: "Aucun enregistrement ne correspond aux filtres",
      noMatchDesc: "Élargir les filtres de date, de région ou de tag peut faire réapparaître des enregistrements.",
      previewLabel: "Aperçu",
      previewCount: "Affichage de {n} enregistrements par ordre chronologique",
      previewCountOne: "Affichage de {n} enregistrement par ordre chronologique",
      selectionCount: "Sélection : {m} sur {n} enregistrements filtrés",
      selectionCountOne: "Sélection : {m} sur {n} enregistrement filtré",
      entrySelectLabel: "Utiliser cet enregistrement",
      selectAll: "Tout sélectionner",
      selectNone: "Tout désélectionner",
      selectionNoneTitle: "Choisissez les enregistrements de ce carnet",
      selectionNoneDesc: "Cochez les enregistrements ci-dessous pour les inclure dans le carnet. Ne gardez que ceux de ce voyage.",
      generateSectionTitle: "Créer le carnet",
      currentSettingsNote: "Ton : {tone} / Langue de sortie : {lang} (modifiable dans le panneau de réglages)",
      writeModeTitle: "Comment souhaitez-vous rédiger le carnet ?",
      writeModeAiLabel: "Laisser l'IA rédiger",
      writeModeAiDesc: "Génère automatiquement le carnet à partir de vos notes",
      writeModeManualLabel: "Écrire moi-même",
      writeModeManualDesc: "Saisissez directement le titre et le texte",
      switchToManual: "Passer à l'écriture manuelle",
      switchToAi: "Passer à la rédaction par l'IA",
      aiStepHint: "Ajoutez d'abord une note à chaque enregistrement, puis appuyez sur le bouton de génération IA.",
      sectionTextTitle: "Texte du carnet",
      sectionTextDesc: "Le carnet est rédigé à partir des notes d'origine des enregistrements que vous cochez ci-dessous. Ce champ et les champs de lieu de chaque enregistrement reçoivent le texte généré, et vous pouvez y écrire vous-même sans attendre la génération. Ce que vous y modifiez sert au message pour les réseaux sociaux, à l'image de couverture et, si vous le souhaitez, au PDF.",
      bodyLabel: "Texte principal (rédigé par l'IA ; vous pouvez aussi l'écrire vous-même avant la génération)",
      bodyPlaceholder: "Le texte principal rédigé par l'IA apparaît ici. Vous pouvez aussi l'écrire vous-même avant la génération.",
      spotTitleLabel: "Titre du lieu (rédigé par l'IA ; vous pouvez aussi l'écrire vous-même avant la génération)",
      spotCaptionLabel: "Texte du lieu (rédigé par l'IA ; vous pouvez aussi l'écrire vous-même avant la génération)",
      spotCaptionPlaceholder: "Le texte par lieu rédigé par l'IA apparaît ici. Vous pouvez aussi l'écrire vous-même avant la génération. Vos modifications ne sont pas reprises par l'IA tant que vous ne relancez pas la génération.",
      memoryPlace: "Un lieu à retenir",
      loadErrorHeritage: "Les enregistrements du Passeport du patrimoine mondial n'ont pas pu être chargés. Vérifiez que des enregistrements ont bien été sauvegardés sur /heritage du même domaine.",
      loadErrorLifemap: "Les enregistrements de la Carte de vie n'ont pas pu être chargés. Vérifiez que le stockage local de ce navigateur est disponible.",
      draftSave: "Enregistrer le brouillon",
      draftRestore: "Restaurer le brouillon",
      draftDelete: "Supprimer le brouillon",
      draftNote: "Les brouillons ne sont conservés que dans ce navigateur. Ceux créés à partir de photos contiennent les images, leur enregistrement peut donc échouer s'il y en a beaucoup.",
      draftSaved: "Brouillon enregistré dans ce navigateur.",
      draftSaveFailed: "Le brouillon n'a pas pu être enregistré. Avec beaucoup de photos, la capacité du navigateur peut être dépassée.",
      draftNone: "Aucun brouillon enregistré.",
      draftRestored: "Brouillon restauré.",
      draftRestoreFailed: "Le brouillon n'a pas pu être restauré.",
      draftDeleted: "Brouillon supprimé.",
      draftDeleteFailed: "Le brouillon n'a pas pu être supprimé.",
      hashtags: "#CarnetDeVoyage #JournalDeVoyage #AITravelJournal",
      photoHeicWarn: "Certains navigateurs ne peuvent pas afficher directement les photos HEIC. Si une photo ne s'affiche pas, partagez-la en JPEG depuis votre iPhone puis réessayez.",
      photoNone: "Aucune photo n'a pu être importée. Essayez les formats JPEG, PNG ou WebP.",
      photoImportFailed: "L'importation des photos a échoué",
      pdfNote: "Cet écran sert avant tout à créer le texte pour les réseaux sociaux et l'image d'accroche du blog. L'enregistrement en PDF est une option secondaire, pour garder une page A4 sous la main.",
      mapLoading: "Chargement de la carte...",
      serviceName: "Générateur de carnet de voyage IA",
      tagline: "Transformez photos et notes en carnet de voyage IA.",
      backTop: "Retour en haut",
      lifeMap: "Carte de vie",
      heritage: "Passeport du patrimoine mondial",
      drivePlanner: "Planificateur de trajet IA",
      heroTitle: "Transformez photos et notes en carnet de voyage IA.",
      heroBody: "À partir des lieux, dates et notes enregistrés dans la Carte de vie, l'IA crée un carnet de voyage du point de vue de la personne qui l'a vécu. Enregistrez-le comme texte pour réseaux sociaux, image d'accroche de blog ou PDF A4 d'une page.",
      outputLanguage: "Langue de sortie",
      settings: "Réglages du carnet",
      generateAi: "Créer le carnet IA à partir des notes",
      generating: "Génération du texte...",
      template: "Créer sans IA",
      copyPost: "Copier le texte SNS",
      saveImage: "Enregistrer l'image d'accroche",
      savePdf: "Enregistrer aussi en PDF",
      copyDone: "Copié",
      copyDoneHint: "Ouvrez votre application et collez le texte.",
      copyFailedLabel: "Échec de la copie",
      copyFailedHint: "Sélectionnez le texte ci-dessous et copiez-le manuellement.",
      imageDone: "Image enregistrée",
      imageDoneHint: "Enregistrée dans vos téléchargements. Joignez-la à votre publication.",
      imageFailedLabel: "Échec de l'enregistrement",
      imageFailedHint: "Rechargez la photo ou réessayez dans un instant.",
      photoPrivacy: "Vos photos restent sur votre appareil et ne sont jamais envoyées. Seul du texte est transmis pour la rédaction : lieux, dates, notes, titre, nom de l'auteur et réglages.",
      noticeTitle: "Conditions d'utilisation",
      noticeBody: "Toute copie, réutilisation ou redistribution non autorisée du code source, du design et du contenu de ce site est interdite.",
      dataTitle: "À propos des données enregistrées",
      dataNote1: "Lorsque vous enregistrez un brouillon, les photos, lieux et notes sont stockés dans le localStorage de ce navigateur. Rien n'est envoyé à un serveur et aucune sauvegarde automatique dans le cloud n'est effectuée.",
      dataNote2: "Les brouillons peuvent être perdus si vous effacez les données de navigation ou le cache, réinitialisez ou changez d'appareil, ou changez de navigateur.",
      dataNote3: "Nous ne pouvons être tenus responsables de la perte ou de l'altération des données. Enregistrez les carnets auxquels vous tenez sur votre appareil, sous forme de texte pour réseaux sociaux, d'image d'accroche ou de PDF.",
      cardLifeMapTitle: "Créer à partir de la Carte de vie",
      cardLifeMapBody: "Chargez les photos, dates, lieux et notes déjà enregistrés, ne gardez que ce voyage-ci et conservez le tout sous forme de carnet rédigé.",
      cardHeritageTitle: "Créer à partir du Passeport du patrimoine mondial",
      cardHeritageBody: "Chargez les dates de visite, photos et notes enregistrées dans le Passeport du patrimoine mondial, puis réunissez-les en texte pour réseaux sociaux et image d'accroche.",
      cardPhotoTitle: "Créer en choisissant des photos",
      cardPhotoBody: "Choisissez des photos non encore enregistrées : la date de prise de vue et les données GPS sont lues automatiquement, et le tout est conservé comme récit de voyage.",
    },
    ko: {
      toneWarm: "자신의 기억을 부드럽게 되돌아보기",
      toneSimple: "짧고 담백한 기록문",
      toneDiary: "일기 같은 1인칭",
      toneGuide: "장소의 매력도 조금 곁들이기",
      placeUnset: "장소 미설정",
      rangeUnset: "기간 미선택",
      worldHeritage: "세계유산",
      downloadFallbackName: "travel-journal",
      coverFileSuffix: "-여행기-커버이미지",
      samplesTitle: "AI가 만든 여행기 예시 보기",
      samplesDesc: "교토·홋카이도·오키나와 등 5편의 샘플을 공개하고 있습니다. 어떤 문장이 되는지 만들기 전에 확인할 수 있습니다.",
      samplesCta: "5편 모두 보기 →",
      photoTitle: "사진을 골라 여행기 만들기",
      photoDesc: "선택한 사진은 이 화면 안에서만 크기가 조정됩니다. JPEG의 EXIF에 촬영일이나 GPS가 있으면 자동으로 읽어들입니다.",
      photoPick: "사진 한번에 선택",
      photoPickNote: "휴대폰에서는 카메라 촬영도 선택할 수 있습니다",
      photoProcessing: "기기 안에서 사진을 처리하고 있습니다...",
      filterTitle: "여행 날짜·기록 필터",
      filterClear: "조건 지우기",
      filterDescHeritage: "세계유산 여권에서 불러온 방문 기록 중 여행기에 사용할 것만 고르는 조건입니다. 비워 두면 불러온 기록을 모두 사용합니다.",
      filterDescLifemap: "인생 경험 지도에서 불러온 기록 중 이번 여행기에 사용할 것만 고르는 조건입니다. 비워 두면 불러온 기록을 모두 사용합니다.",
      filterFrom: "여행 시작일",
      filterTo: "여행 종료일",
      filterRegion: "방문 지역",
      filterRegionAll: "모든 방문 지역",
      filterTag: "여행 태그",
      filterTagAll: "모든 여행 태그",
      filterKeyword: "장소명·원본 메모로 필터",
      filterKeywordPlaceholder: "인생 경험 지도의 원본 메모, 장소명, 인상에 남은 말 등",
      filterKeywordNoteHeritage: "세계유산 여권에서 불러온 원본 메모·세계유산 이름·국가명을 검색합니다. 생성된 문장란은 검색 대상이 아닙니다.",
      filterKeywordNoteLifemap: "인생 경험 지도에서 불러온 원본 메모를 검색합니다. 생성된 문장란은 검색 대상이 아닙니다.",
      photoEditTitle: "사진 정보 편집",
      photoEditDesc: "GPS가 없는 사진은 장소명·지역·위도경도 중 하나를 입력해 주세요. 「AI에 전달할 원본 메모」에 쓴 내용이 여행기 문장의 재료가 됩니다.",
      photoPlacePlaceholder: "장소명(예: 하코네, 겐로쿠엔)",
      photoDeleteLabel: "사진 삭제",
      photoMemoLabel: "AI에 전달할 원본 메모(사진 설명·그때의 기록)",
      photoMemoPlaceholder: "예: 바닷가에서 낚시를 했다. 바람이 강했다. 가족과 함께 쉬었다.",
      photoMemoNote: "메모란의 편집 내용은 AI 여행기 메이커 화면 안의 재료로 사용됩니다. 사진 자체는 AI에 보내지 않습니다.",
      photoPrefPlaceholder: "지역·방문 지역",
      photoLatPlaceholder: "위도",
      photoLngPlaceholder: "경도",
      photoGpsYes: "위치 정보 있음. 지도에 표시할 수 있습니다.",
      photoGpsNo: "GPS 없음. 장소명이나 지역만으로도 여행기에 사용할 수 있습니다.",
      fieldTitle: "제목",
      fieldTraveler: "여행자 이름",
      travelerPlaceholder: "예: 야마다 가족, 타로",
      fieldTone: "여행기의 말투",
      turnstileLoading: "자동 전송 방지 기능을 불러오는 중입니다. 몇 초만 기다려 주세요.",
      turnstileError: "자동 전송 방지 기능을 불러오지 못했습니다. 페이지를 새로고침해 주세요. 그래도 해결되지 않으면 Cloudflare Turnstile의 도메인 설정을 확인해 주세요.",
      turnstileMissing: "AI 생성의 악용 방지 기능이 설정되어 있지 않습니다. Cloudflare Turnstile 사이트 키를 설정하면 AI 생성을 사용할 수 있습니다.",
      aiScopeNote: "AI는 불러온 각 기록의 장소·지역·날짜·태그·원본 메모와 제목, 기록자 이름, 문체, 출력 언어 등의 설정만으로 여행기를 만듭니다. 사진 자체, 아래의 편집된 문장, SNS·PDF 출력 내용은 AI에 보내지 않습니다.",
      aiNotReady: "AI 생성의 인증 확인이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      aiGenerateFailed: "문장 생성에 실패했습니다",
      precisionPrefecture: "지역 단위",
      precisionApproximate: "대략적인 위치",
      precisionExact: "정확한 위치",
      mapUnset: "지도 미설정",
      entryMemoLabel: "AI에 전달할 원본 메모 (이 화면에서 편집)",
      entryMemoPlaceholder: "예: 그곳에서 느낀 점, 인상에 남은 일, 사진을 남긴 이유 등",
      entryMemoNote: "메모란의 편집 내용은 AI 여행기 메이커 화면 안에서만 소재로 사용됩니다. 인생 체험 지도나 세계유산 여권으로 돌아가도 원본 데이터에는 반영되지 않습니다.",
      summaryTitle: "불러온 기록",
      summaryAll: "전체 기록",
      summaryUsed: "여행기에 사용",
      summaryMapped: "지도",
      summaryRange: "여행기에 사용할 기간:",
      loadingRecords: "인생 체험 지도의 기록을 불러오는 중입니다...",
      emptyTitle: "아직 기록이 없습니다",
      emptyDescPhoto: "사진을 선택하면 여기에 여행기의 기록으로 표시됩니다.",
      emptyDescHeritage: "세계유산 여권의 사진·방문일·메모를 불러오면 여기에 여행기의 기록으로 표시됩니다.",
      emptyDescLifemap: "인생 체험 지도의 사진·장소·날짜·메모를 불러오면 여기에 여행기의 기록으로 표시됩니다.",
      emptyPickPhoto: "사진 선택하기",
      emptyCtaHeritage: "세계유산 여권에서 기록하기",
      emptyCtaLifemap: "인생 체험 지도에서 기록하기",
      noMatchTitle: "조건에 맞는 기록이 없습니다",
      noMatchDesc: "날짜·방문 지역·여행 태그의 조건을 넓히면 다시 표시될 수 있습니다.",
      previewLabel: "미리보기",
      previewCount: "{n}건의 기록을 시간순으로 표시 중",
      previewCountOne: "{n}건의 기록을 시간순으로 표시 중",
      selectionCount: "필터 결과 {n}건 중 {m}건 사용",
      selectionCountOne: "필터 결과 {n}건 중 {m}건 사용",
      entrySelectLabel: "이 기록 사용",
      selectAll: "전체 선택",
      selectNone: "전체 해제",
      selectionNoneTitle: "여행기에 사용할 기록을 선택해 주세요",
      selectionNoneDesc: "아래 기록에 체크하면 여행기에 사용됩니다. 이번 여행의 기록만 선택해 주세요.",
      generateSectionTitle: "여행기 만들기",
      currentSettingsNote: "톤: {tone} / 출력 언어: {lang} (설정 패널에서 변경할 수 있습니다)",
      writeModeTitle: "어떻게 작성하시겠어요?",
      writeModeAiLabel: "AI에게 맡기기",
      writeModeAiDesc: "메모를 바탕으로 여행기를 자동 생성합니다",
      writeModeManualLabel: "직접 쓰기",
      writeModeManualDesc: "제목과 문장을 직접 입력합니다",
      switchToManual: "직접 쓰기로 전환",
      switchToAi: "AI에게 맡기기로 전환",
      aiStepHint: "먼저 각 기록에 메모를 작성한 뒤, AI 생성 버튼을 눌러주세요.",
      sectionTextTitle: "여행기 문장",
      sectionTextDesc: "아래에서 체크한 기록의 원본 메모로 여행기를 만듭니다. 이 칸과 각 기록의 장소 칸은 AI가 쓰지만, 생성을 기다리지 않고 직접 써도 됩니다. 편집한 문장은 SNS 게시글과 대표 이미지, 필요에 따라 PDF에도 사용됩니다.",
      bodyLabel: "여행기 본문 (AI가 씁니다. 생성 전에 직접 써도 됩니다)",
      bodyPlaceholder: "AI가 작성한 여행기 본문이 여기에 표시됩니다. 생성 전에 직접 써도 됩니다.",
      spotTitleLabel: "장소 제목 (AI가 씁니다. 생성 전에 직접 써도 됩니다)",
      spotCaptionLabel: "장소별 문장 (AI가 씁니다. 생성 전에 직접 써도 됩니다)",
      spotCaptionPlaceholder: "AI가 작성한 장소별 문장이 여기에 표시됩니다. 생성 전에 직접 써도 됩니다. 여기를 편집해도 다시 생성하기 전까지는 AI의 입력이 되지 않습니다.",
      memoryPlace: "기억에 남는 장소",
      loadErrorHeritage: "세계유산 여권의 기록을 불러오지 못했습니다. 같은 도메인의 /heritage에 저장한 기록이 있는지 확인해 주세요.",
      loadErrorLifemap: "인생 체험 지도의 기록을 불러오지 못했습니다. 이 브라우저의 저장 기능을 사용할 수 있는 상태인지 확인해 주세요.",
      draftSave: "임시저장",
      draftRestore: "임시저장 복원",
      draftDelete: "임시저장 삭제",
      draftNote: "임시저장은 이 브라우저에만 저장됩니다. 사진에서 시작한 임시저장은 이미지도 포함하므로 장수가 많으면 저장하지 못할 수 있습니다.",
      draftSaved: "임시저장을 이 브라우저에 저장했습니다.",
      draftSaveFailed: "임시저장에 실패했습니다. 사진이 많으면 브라우저 용량을 초과했을 수 있습니다.",
      draftNone: "저장된 임시저장이 없습니다.",
      draftRestored: "임시저장을 복원했습니다.",
      draftRestoreFailed: "임시저장을 복원하지 못했습니다.",
      draftDeleted: "임시저장을 삭제했습니다.",
      draftDeleteFailed: "임시저장을 삭제하지 못했습니다.",
      hashtags: "#여행기록 #여행일기 #AITravelJournal",
      photoHeicWarn: "HEIC 사진은 이 브라우저에서 바로 표시되지 않을 수 있습니다. 표시되지 않으면 iPhone에서 JPEG로 공유한 뒤 다시 시도해 주세요.",
      photoNone: "가져올 수 있는 사진이 없습니다. JPEG / PNG / WebP 형식을 사용해 주세요.",
      photoImportFailed: "사진을 가져오지 못했습니다",
      pdfNote: "이 화면은 SNS 게시글과 블로그 아이캐치 이미지 만들기를 중심으로 합니다. PDF 저장은 보조 기능으로, A4 1장으로 남기고 싶을 때 사용할 수 있습니다.",
      mapLoading: "지도를 불러오는 중입니다...",
      serviceName: "AI 여행기 메이커",
      tagline: "사진과 메모로 여행의 추억을 AI 여행기로 정리합니다.",
      backTop: "맨 위로 돌아가기",
      lifeMap: "인생 체험 지도",
      heritage: "세계유산 패스포트",
      drivePlanner: "AI 드라이브 플래너",
      heroTitle: "사진과 메모로 여행의 추억을 AI 여행기로.",
      heroBody: "인생 체험 지도에 저장한 장소, 날짜, 메모를 바탕으로 AI가 기록자의 시선에서 여행기를 만듭니다. SNS 게시글, 블로그 아이캐치 이미지, 필요하면 A4 1장 PDF로 저장할 수 있습니다.",
      outputLanguage: "출력 언어",
      settings: "여행기 설정",
      generateAi: "읽어온 원본 메모로 AI 여행기 만들기",
      generating: "문장 생성 중...",
      template: "AI 없이 기록문 만들기",
      copyPost: "SNS 게시글 복사",
      saveImage: "아이캐치 이미지 저장",
      savePdf: "PDF로도 저장",
      copyDone: "복사했습니다",
      copyDoneHint: "SNS 앱을 열고 붙여넣어 주세요.",
      copyFailedLabel: "복사하지 못했습니다",
      copyFailedHint: "아래 글 영역을 선택해 직접 복사해 주세요.",
      imageDone: "이미지를 저장했습니다",
      imageDoneHint: "다운로드 위치에 저장했습니다. 게시글에 첨부해 주세요.",
      imageFailedLabel: "이미지를 저장하지 못했습니다",
      imageFailedHint: "사진을 다시 불러오거나 잠시 후 다시 시도해 주세요.",
      photoPrivacy: "사진은 기기 안에서만 처리하며 전송하지 않습니다. 전송되는 것은 지명·날짜·메모·제목·기록자 이름·설정 등 문자 정보뿐입니다.",
      noticeTitle: "이용 시 주의사항",
      noticeBody: "본 사이트의 소스 코드·디자인·콘텐츠를 무단으로 복제·전용·재배포하는 것을 금지합니다.",
      dataTitle: "데이터 저장에 대하여",
      dataNote1: "임시저장을 누르면 사진·장소·메모 등의 데이터가 이 브라우저의 localStorage에 저장됩니다. 서버로 전송하거나 클라우드에 자동 백업하지 않습니다.",
      dataNote2: "브라우저 방문 기록 삭제, 캐시 삭제, 기기 초기화·기기 변경, 브라우저 변경 등으로 임시저장 데이터가 사라질 수 있습니다.",
      dataNote3: "데이터의 손실·손상에 대해 당 서비스는 책임지지 않습니다. 소중한 여행기는 SNS 게시글·아이캐치 이미지·PDF로 기기에 저장해 주세요.",
      cardLifeMapTitle: "인생 체험 지도의 기록으로 만들기",
      cardLifeMapBody: "저장해 둔 사진·날짜·장소·메모를 불러와 이번 여행만 골라내고, 여행기로 글과 함께 남깁니다.",
      cardHeritageTitle: "세계유산 패스포트의 기록으로 만들기",
      cardHeritageBody: "세계유산 패스포트에 저장한 방문일·사진·메모를 불러와 SNS 게시글과 아이캐치 이미지로 정리합니다.",
      cardPhotoTitle: "사진을 선택해서 만들기",
      cardPhotoBody: "아직 저장하지 않은 사진을 선택하면 촬영일과 GPS를 읽어들여, 여행의 기록으로 글과 함께 남깁니다.",
    },
    "zh-TW": {
      toneWarm: "溫柔地回顧自己的記憶",
      toneSimple: "簡短樸實的記錄文",
      toneDiary: "日記式的第一人稱",
      toneGuide: "略微介紹地點的魅力",
      placeUnset: "未設定地點",
      rangeUnset: "未選擇範圍",
      worldHeritage: "世界遺產",
      downloadFallbackName: "travel-journal",
      coverFileSuffix: "-旅行記封面圖",
      samplesTitle: "查看AI產生的旅行記實例",
      samplesDesc: "已公開京都、北海道、沖繩等5篇範例。製作前可以先確認文章的風格。",
      samplesCta: "查看全部5篇 →",
      photoTitle: "選擇照片製作旅行記",
      photoDesc: "所選照片僅在本頁面內縮放。若JPEG的EXIF中含有拍攝日期或GPS資訊，將自動讀取。",
      photoPick: "批次選擇照片",
      photoPickNote: "手機上也可以直接拍照",
      photoProcessing: "正在本機處理照片...",
      filterTitle: "旅行日期與記錄篩選",
      filterClear: "清除條件",
      filterDescHeritage: "用於從世界遺產護照讀取的造訪記錄中，挑選要用於旅行記的部分。留空則使用全部已讀取的記錄。",
      filterDescLifemap: "用於從人生體驗地圖讀取的記錄中，挑選本次旅行記要使用的部分。留空則使用全部已讀取的記錄。",
      filterFrom: "旅行開始日",
      filterTo: "旅行結束日",
      filterRegion: "造訪地區",
      filterRegionAll: "全部造訪地區",
      filterTag: "旅行標籤",
      filterTagAll: "全部旅行標籤",
      filterKeyword: "以地點名稱或原始備忘篩選",
      filterKeywordPlaceholder: "人生體驗地圖的原始備忘、地點名稱、印象深刻的詞句等",
      filterKeywordNoteHeritage: "搜尋從世界遺產護照讀取的原始備忘、世界遺產名稱與國家名稱。產生後的文章欄不在搜尋範圍內。",
      filterKeywordNoteLifemap: "搜尋從人生體驗地圖讀取的原始備忘。產生後的文章欄不在搜尋範圍內。",
      photoEditTitle: "編輯照片資訊",
      photoEditDesc: "沒有GPS的照片，請填寫地點名稱、地區或經緯度其中一項。填寫在「提供給AI的原始備忘」中的內容將成為旅行記文章的素材。",
      photoPlacePlaceholder: "地點名稱（例：箱根、兼六園）",
      photoDeleteLabel: "刪除照片",
      photoMemoLabel: "提供給AI的原始備忘（照片說明、當時的記錄）",
      photoMemoPlaceholder: "例：在海邊釣魚。風很大。和家人一起休息了一會兒。",
      photoMemoNote: "備忘欄的編輯內容僅作為AI旅行記製作頁面內的素材使用。照片本身不會傳送給AI。",
      photoPrefPlaceholder: "地區・造訪地區",
      photoLatPlaceholder: "緯度",
      photoLngPlaceholder: "經度",
      photoGpsYes: "含位置資訊。可以在地圖上顯示。",
      photoGpsNo: "無GPS。僅有地點名稱或地區也可以用於旅行記。",
      fieldTitle: "標題",
      fieldTraveler: "旅行者姓名",
      travelerPlaceholder: "例：山田一家、太郎",
      fieldTone: "旅行記的語氣",
      turnstileLoading: "正在載入自動送出防護。請稍候幾秒。",
      turnstileError: "無法載入自動送出防護。請重新載入頁面。若仍未改善，請確認Cloudflare Turnstile的網域設定。",
      turnstileMissing: "尚未設定AI產生的濫用防護。設定Cloudflare Turnstile的網站金鑰後即可使用AI產生。",
      aiScopeNote: "AI僅根據各筆記錄的地點、地區、日期、標籤、原始備忘，以及標題、記錄者姓名、文體、輸出語言等設定來撰寫旅行記。照片本身、下方已編輯的文字、SNS與PDF輸出內容都不會傳送給AI。",
      aiNotReady: "AI產生的驗證尚未完成。請稍後再試。",
      aiGenerateFailed: "文章產生失敗",
      precisionPrefecture: "地區層級",
      precisionApproximate: "大致位置",
      precisionExact: "精確位置",
      mapUnset: "未設定地圖",
      entryMemoLabel: "提供給AI的原始備忘（在本頁面內編輯）",
      entryMemoPlaceholder: "例：在那裡的感受、印象深刻的事、拍下這張照片的理由等",
      entryMemoNote: "備忘欄的編輯內容僅作為AI旅行記產生器頁面內的素材使用。返回人生體驗地圖或世界遺產護照後，原始資料不會被更動。",
      summaryTitle: "已讀取的記錄",
      summaryAll: "全部記錄",
      summaryUsed: "用於旅行記",
      summaryMapped: "地圖",
      summaryRange: "旅行記涵蓋期間：",
      loadingRecords: "正在讀取人生體驗地圖的記錄...",
      emptyTitle: "還沒有記錄",
      emptyDescPhoto: "選擇照片後，會在這裡顯示為旅行記的記錄。",
      emptyDescHeritage: "讀取世界遺產護照的照片、造訪日期與備忘後，會在這裡顯示為旅行記的記錄。",
      emptyDescLifemap: "讀取人生體驗地圖的照片、地點、日期與備忘後，會在這裡顯示為旅行記的記錄。",
      emptyPickPhoto: "選擇照片",
      emptyCtaHeritage: "在世界遺產護照中記錄",
      emptyCtaLifemap: "在人生體驗地圖中記錄",
      noMatchTitle: "沒有符合條件的記錄",
      noMatchDesc: "放寬日期、造訪地區、旅行標籤的條件後，可能會重新顯示。",
      previewLabel: "預覽",
      previewCount: "正依時間順序顯示{n}筆記錄",
      previewCountOne: "正依時間順序顯示{n}筆記錄",
      selectionCount: "篩選後{n}筆中使用{m}筆",
      selectionCountOne: "篩選後{n}筆中使用{m}筆",
      entrySelectLabel: "使用這筆記錄",
      selectAll: "全選",
      selectNone: "全部取消",
      selectionNoneTitle: "請選擇要用於旅行記的記錄",
      selectionNoneDesc: "勾選下方的記錄，即可將其用於旅行記。請只選擇本次旅行的記錄。",
      generateSectionTitle: "產生旅行記",
      currentSettingsNote: "語氣: {tone}／輸出語言: {lang}（可在設定面板中變更）",
      writeModeTitle: "要用哪種方式撰寫？",
      writeModeAiLabel: "由AI撰寫",
      writeModeAiDesc: "根據備忘自動產生旅行記",
      writeModeManualLabel: "自己寫",
      writeModeManualDesc: "直接輸入標題和文字",
      switchToManual: "切換到自己寫",
      switchToAi: "切換到由AI撰寫",
      aiStepHint: "先為每筆記錄寫好備忘，再點擊AI產生按鈕。",
      sectionTextTitle: "旅行記正文",
      sectionTextDesc: "根據下方勾選的記錄的原始備忘撰寫旅行記。此欄與各記錄的地點欄是AI撰寫的欄位，不等產生也可以自己寫。編輯後的文字會用於SNS貼文、封面圖片，以及需要時的PDF。",
      bodyLabel: "旅行記正文（由AI撰寫。產生前也可以自己寫）",
      bodyPlaceholder: "AI撰寫的旅行記正文會顯示在這裡。產生前也可以自己寫。",
      spotTitleLabel: "地點標題（由AI撰寫。產生前也可以自己寫）",
      spotCaptionLabel: "各地點文字（由AI撰寫。產生前也可以自己寫）",
      spotCaptionPlaceholder: "AI撰寫的各地點文字會顯示在這裡。產生前也可以自己寫。在重新產生之前，此處的編輯不會作為AI的輸入。",
      memoryPlace: "難忘的地點",
      loadErrorHeritage: "無法讀取世界遺產護照的紀錄。請確認同一網域下的 /heritage 中是否有已儲存的紀錄。",
      loadErrorLifemap: "無法讀取人生體驗地圖的紀錄。請確認本瀏覽器的本機儲存功能是否可用。",
      draftSave: "儲存草稿",
      draftRestore: "還原草稿",
      draftDelete: "刪除草稿",
      draftNote: "草稿只儲存在本瀏覽器中。從照片入口儲存的草稿包含圖片，數量較多時可能無法儲存。",
      draftSaved: "草稿已儲存到本瀏覽器。",
      draftSaveFailed: "草稿儲存失敗。照片較多時可能超出瀏覽器的儲存容量。",
      draftNone: "沒有已儲存的草稿。",
      draftRestored: "草稿已還原。",
      draftRestoreFailed: "草稿還原失敗。",
      draftDeleted: "草稿已刪除。",
      draftDeleteFailed: "草稿刪除失敗。",
      hashtags: "#旅行日記 #旅行記錄 #AITravelJournal",
      photoHeicWarn: "HEIC照片在部分瀏覽器中可能無法直接顯示。若無法顯示，請先在iPhone上以JPEG格式分享後再試。",
      photoNone: "沒有可匯入的照片。請嘗試 JPEG / PNG / WebP 格式。",
      photoImportFailed: "照片匯入失敗",
      pdfNote: "本頁面主要用於產生SNS貼文和部落格首圖。PDF儲存是輔助功能，適合想以A4一頁保存在手邊的情況。",
      mapLoading: "正在載入地圖...",
      serviceName: "AI旅行記產生器",
      tagline: "用照片和備忘，把旅行回憶整理成AI旅行記。",
      backTop: "返回頂部",
      lifeMap: "前往人生體驗地圖",
      heritage: "前往世界遺產護照",
      drivePlanner: "前往AI自駕規劃器",
      heroTitle: "用照片和備忘，把旅行回憶整理成AI旅行記。",
      heroBody: "根據人生體驗地圖中保存的地點、日期和備忘，AI會以記錄者視角產生旅行記。可保存為SNS貼文、部落格首圖，也可視需要保存為A4一頁PDF。這不是旅行計畫工具，而是旅行後的回憶整理服務。",
      outputLanguage: "輸出語言",
      settings: "旅行記設定",
      generateAi: "根據讀取的原始備忘產生AI旅行記",
      generating: "正在產生文章...",
      template: "不使用AI產生記錄文",
      copyPost: "複製SNS貼文",
      saveImage: "保存首圖",
      savePdf: "也保存為PDF",
      copyDone: "已複製",
      copyDoneHint: "請開啟SNS應用程式貼上。",
      copyFailedLabel: "複製失敗",
      copyFailedHint: "請選取下方文字欄，手動複製。",
      imageDone: "已保存圖片",
      imageDoneHint: "已保存至下載位置，請附加到貼文中。",
      imageFailedLabel: "圖片保存失敗",
      imageFailedHint: "請重新載入照片，或稍後再試。",
      photoPrivacy: "照片僅在您的裝置中處理，不會傳送。傳送的只有地點、日期、備忘、標題、記錄者姓名、設定等文字資訊。",
      noticeTitle: "使用須知",
      noticeBody: "禁止擅自複製、轉用或再散布本站的原始碼、設計與內容。",
      dataTitle: "關於資料保存",
      dataNote1: "按下儲存草稿後，照片、地點、備忘等資料會保存在本瀏覽器的localStorage中。不會傳送到伺服器，也不會自動雲端備份。",
      dataNote2: "清除瀏覽資料或快取、重設裝置、更換機型、更換瀏覽器等操作，都可能造成草稿資料遺失。",
      dataNote3: "對於資料遺失或損毀，本服務恕不負責。重要的旅行記請保存為SNS貼文、首圖或PDF，存放到您的裝置中。",
      cardLifeMapTitle: "從人生體驗地圖的記錄產生",
      cardLifeMapBody: "讀取已保存的照片、日期、地點與備忘，只篩選出這趟旅行的內容，連同文章一起留作旅行記。",
      cardHeritageTitle: "從世界遺產護照的記錄產生",
      cardHeritageBody: "讀取世界遺產護照中保存的造訪日期、照片與備忘，整理成SNS貼文和首圖。",
      cardPhotoTitle: "選擇照片產生",
      cardPhotoBody: "選擇尚未保存的照片，自動讀取拍攝日期與GPS資訊，連同文章一起留作旅行記錄。",
    },
    de: {
      toneWarm: "Sanft auf die eigenen Erinnerungen zurückblicken",
      toneSimple: "Kurzer, schlichter Bericht",
      toneDiary: "Erste Person, wie ein Tagebuch",
      toneGuide: "Mit einem Hinweis auf den Reiz der Orte",
      placeUnset: "Ort nicht angegeben",
      rangeUnset: "Kein Zeitraum ausgewählt",
      worldHeritage: "Welterbestätte",
      downloadFallbackName: "reisetagebuch",
      coverFileSuffix: "-reisetagebuch-titelbild",
      samplesTitle: "Beispiele von KI-Reisetagebüchern ansehen",
      samplesDesc: "Fünf Beispiele sind veröffentlicht, darunter Kyoto, Hokkaido und Okinawa. So sehen Sie den Schreibstil, bevor Sie selbst eines erstellen.",
      samplesCta: "Alle fünf ansehen →",
      photoTitle: "Fotos auswählen und ein Reisetagebuch erstellen",
      photoDesc: "Die ausgewählten Fotos werden nur auf diesem Bildschirm verkleinert. Enthält ein JPEG Aufnahmedatum oder GPS in den EXIF-Daten, werden diese automatisch gelesen.",
      photoPick: "Mehrere Fotos auswählen",
      photoPickNote: "Auf dem Handy können Sie auch direkt fotografieren",
      photoProcessing: "Fotos werden auf Ihrem Gerät verarbeitet...",
      filterTitle: "Reisedaten und Filter für Einträge",
      filterClear: "Filter zurücksetzen",
      filterDescHeritage: "Mit diesen Filtern wählen Sie aus den vom Welterbe-Pass geladenen Besuchen aus, welche ins Reisetagebuch kommen. Leer lassen, um alle geladenen Einträge zu verwenden.",
      filterDescLifemap: "Mit diesen Filtern wählen Sie aus den von der Lebenserfahrungskarte geladenen Einträgen aus, welche in dieses Reisetagebuch kommen. Leer lassen, um alle geladenen Einträge zu verwenden.",
      filterFrom: "Beginn der Reise",
      filterTo: "Ende der Reise",
      filterRegion: "Besuchte Region",
      filterRegionAll: "Alle besuchten Regionen",
      filterTag: "Reise-Tag",
      filterTagAll: "Alle Reise-Tags",
      filterKeyword: "Nach Ortsname oder Ursprungsnotiz filtern",
      filterKeywordPlaceholder: "Ursprungsnotizen der Lebenserfahrungskarte, Ortsnamen, Worte, die geblieben sind",
      filterKeywordNoteHeritage: "Durchsucht die vom Welterbe-Pass geladenen Ursprungsnotizen, Welterbe-Namen und Ländernamen. Die erzeugten Textfelder werden nicht durchsucht.",
      filterKeywordNoteLifemap: "Durchsucht die von der Lebenserfahrungskarte geladenen Ursprungsnotizen. Die erzeugten Textfelder werden nicht durchsucht.",
      photoEditTitle: "Fotoangaben bearbeiten",
      photoEditDesc: "Geben Sie für Fotos ohne GPS einen Ortsnamen, eine Region oder Breiten- und Längengrad an. Was Sie unter „Ursprungsnotiz für die KI\" schreiben, wird zum Material für den Text.",
      photoPlacePlaceholder: "Ortsname (z. B. Hakone, Kenrokuen)",
      photoDeleteLabel: "Foto löschen",
      photoMemoLabel: "Ursprungsnotiz für die KI (was das Foto zeigt, was geschehen ist)",
      photoMemoPlaceholder: "z. B. Am Meer geangelt. Der Wind war stark. Die Familie machte Pause.",
      photoMemoNote: "Was Sie im Notizfeld bearbeiten, dient als Material innerhalb des Reisetagebuch-Editors. Die Fotos selbst werden nie an die KI gesendet.",
      photoPrefPlaceholder: "Region oder besuchtes Gebiet",
      photoLatPlaceholder: "Breitengrad",
      photoLngPlaceholder: "Längengrad",
      photoGpsYes: "Standortdaten vorhanden. Anzeige auf der Karte möglich.",
      photoGpsNo: "Kein GPS. Ein Ortsname oder eine Region genügt für das Reisetagebuch.",
      fieldTitle: "Titel",
      fieldTraveler: "Name der reisenden Person",
      travelerPlaceholder: "z. B. Familie Yamada, Taro",
      fieldTone: "Ton des Reisetagebuchs",
      turnstileLoading: "Der Bot-Schutz wird geladen. Das dauert ein paar Sekunden.",
      turnstileError: "Der Bot-Schutz konnte nicht geladen werden. Bitte laden Sie die Seite neu. Hilft das nicht, prüfen Sie die Domain-Einstellungen von Cloudflare Turnstile.",
      turnstileMissing: "Der Missbrauchsschutz für die KI-Generierung ist nicht eingerichtet. Hinterlegen Sie einen Cloudflare-Turnstile-Site-Key, um die KI-Generierung zu nutzen.",
      aiScopeNote: "Die KI schreibt nur aus Ort, Region, Datum, Tag und Originalnotiz der geladenen Einträge sowie aus Ihren Einstellungen wie Titel, Name, Tonfall und Ausgabesprache. Die Fotos selbst, der bearbeitete Text unten und die Social-Media- oder PDF-Ausgabe werden nie an die KI gesendet.",
      aiNotReady: "Die Prüfung für die KI-Generierung ist noch nicht abgeschlossen. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
      aiGenerateFailed: "Der Text konnte nicht erzeugt werden",
      precisionPrefecture: "Auf Regionsebene",
      precisionApproximate: "Ungefähre Position",
      precisionExact: "Genaue Position",
      mapUnset: "Nicht auf der Karte",
      entryMemoLabel: "Originalnotiz für die KI (auf diesem Bildschirm bearbeitbar)",
      entryMemoPlaceholder: "z. B. wie sich der Ort angefühlt hat, was im Gedächtnis blieb, warum dieses Foto",
      entryMemoNote: "Was Sie im Notizfeld ändern, dient als Material im Bildschirm des KI-Reisetagebuch-Machers. Eine Rückkehr zur Lebenserfahrungskarte oder zum Welterbe-Pass ändert die Originaldaten nicht.",
      summaryTitle: "Geladene Einträge",
      summaryAll: "Alle Einträge",
      summaryUsed: "Im Tagebuch verwendet",
      summaryMapped: "Auf der Karte",
      summaryRange: "Vom Tagebuch abgedeckter Zeitraum:",
      loadingRecords: "Einträge der Lebenserfahrungskarte werden geladen...",
      emptyTitle: "Noch keine Einträge",
      emptyDescPhoto: "Wählen Sie Fotos aus, dann erscheinen sie hier als Einträge des Reisetagebuchs.",
      emptyDescHeritage: "Laden Sie Fotos, Besuchsdaten und Notizen aus dem Welterbe-Pass; sie erscheinen dann hier als Einträge des Reisetagebuchs.",
      emptyDescLifemap: "Laden Sie Fotos, Orte, Daten und Notizen aus der Lebenserfahrungskarte; sie erscheinen dann hier als Einträge des Reisetagebuchs.",
      emptyPickPhoto: "Fotos auswählen",
      emptyCtaHeritage: "Im Welterbe-Pass festhalten",
      emptyCtaLifemap: "In der Lebenserfahrungskarte festhalten",
      noMatchTitle: "Keine Einträge passen zu den Filtern",
      noMatchDesc: "Weiter gefasste Filter für Datum, Region oder Reise-Tag bringen möglicherweise wieder Einträge zum Vorschein.",
      previewLabel: "Vorschau",
      previewCount: "{n} Einträge werden chronologisch angezeigt",
      previewCountOne: "{n} Eintrag wird chronologisch angezeigt",
      selectionCount: "Ausgewählt: {m} von {n} gefilterten Einträgen",
      selectionCountOne: "Ausgewählt: {m} von {n} gefiltertem Eintrag",
      entrySelectLabel: "Diesen Eintrag verwenden",
      selectAll: "Alle auswählen",
      selectNone: "Alle abwählen",
      selectionNoneTitle: "Wählen Sie die Einträge für dieses Tagebuch",
      selectionNoneDesc: "Haken Sie die Einträge unten an, um sie in das Tagebuch aufzunehmen. Wählen Sie nur die Einträge dieser Reise.",
      generateSectionTitle: "Tagebuch erstellen",
      currentSettingsNote: "Ton: {tone} / Ausgabesprache: {lang} (im Einstellungsbereich änderbar)",
      writeModeTitle: "Wie möchten Sie schreiben?",
      writeModeAiLabel: "Von der KI schreiben lassen",
      writeModeAiDesc: "Erstellt das Reisetagebuch automatisch aus Ihren Notizen",
      writeModeManualLabel: "Selbst schreiben",
      writeModeManualDesc: "Geben Sie Überschrift und Text direkt ein",
      switchToManual: "Zu selbst schreiben wechseln",
      switchToAi: "Zur KI-Erstellung wechseln",
      aiStepHint: "Schreiben Sie zuerst zu jedem Eintrag eine Notiz und klicken Sie dann auf die KI-Generieren-Schaltfläche.",
      sectionTextTitle: "Text des Reisetagebuchs",
      sectionTextDesc: "Das Tagebuch entsteht aus den Originalnotizen der Einträge, die Sie unten ankreuzen. Dieses Feld und die Ortsfelder der einzelnen Einträge nehmen den erzeugten Text auf; Sie können dort auch selbst schreiben, ohne auf die Generierung zu warten. Was Sie hier ändern, wird für den Social-Media-Beitrag, das Titelbild und bei Bedarf für das PDF verwendet.",
      bodyLabel: "Haupttext (schreibt die KI; Sie können ihn auch selbst schreiben, schon vor der Generierung)",
      bodyPlaceholder: "Hier erscheint der von der KI geschriebene Haupttext. Sie können ihn auch selbst schreiben, schon vor der Generierung.",
      spotTitleLabel: "Überschrift des Orts (schreibt die KI; Sie können sie auch selbst schreiben, schon vor der Generierung)",
      spotCaptionLabel: "Text zum Ort (schreibt die KI; Sie können ihn auch selbst schreiben, schon vor der Generierung)",
      spotCaptionPlaceholder: "Hier erscheint der von der KI geschriebene Text pro Ort. Sie können ihn auch selbst schreiben, schon vor der Generierung. Änderungen fließen erst bei einer erneuten Generierung in die KI ein.",
      memoryPlace: "Ein Ort zum Erinnern",
      loadErrorHeritage: "Die Einträge aus dem Welterbe-Pass konnten nicht geladen werden. Prüfen Sie, ob unter /heritage derselben Domain Einträge gespeichert sind.",
      loadErrorLifemap: "Die Einträge aus der Lebenskarte konnten nicht geladen werden. Prüfen Sie, ob der lokale Speicher dieses Browsers verfügbar ist.",
      draftSave: "Entwurf speichern",
      draftRestore: "Entwurf wiederherstellen",
      draftDelete: "Entwurf löschen",
      draftNote: "Entwürfe werden nur in diesem Browser gespeichert. Entwürfe aus dem Foto-Einstieg enthalten auch die Bilder, daher kann das Speichern bei vielen Fotos fehlschlagen.",
      draftSaved: "Entwurf in diesem Browser gespeichert.",
      draftSaveFailed: "Der Entwurf konnte nicht gespeichert werden. Bei vielen Fotos kann der Speicherplatz des Browsers überschritten werden.",
      draftNone: "Es ist kein Entwurf gespeichert.",
      draftRestored: "Entwurf wiederhergestellt.",
      draftRestoreFailed: "Der Entwurf konnte nicht wiederhergestellt werden.",
      draftDeleted: "Entwurf gelöscht.",
      draftDeleteFailed: "Der Entwurf konnte nicht gelöscht werden.",
      hashtags: "#Reisetagebuch #Reisebericht #AITravelJournal",
      photoHeicWarn: "Manche Browser können HEIC-Fotos nicht direkt anzeigen. Wird ein Foto nicht angezeigt, teilen Sie es auf dem iPhone als JPEG und versuchen Sie es erneut.",
      photoNone: "Es konnten keine Fotos importiert werden. Versuchen Sie die Formate JPEG, PNG oder WebP.",
      photoImportFailed: "Die Fotos konnten nicht importiert werden",
      pdfNote: "Dieser Bildschirm dient vor allem dem SNS-Beitragstext und dem Blog-Titelbild. Das Speichern als PDF ist eine Zusatzfunktion, wenn Sie eine einseitige A4-Fassung behalten möchten.",
      mapLoading: "Karte wird geladen...",
      serviceName: "KI-Reisebericht-Generator",
      tagline: "Aus Fotos und Notizen wird ein KI-Reisebericht.",
      backTop: "Zurück nach oben",
      lifeMap: "Zur Lebenskarte",
      heritage: "Zum Welterbe-Pass",
      drivePlanner: "Zum KI-Routenplaner",
      heroTitle: "Aus Fotos und Notizen wird ein KI-Reisebericht.",
      heroBody: "Auf Grundlage der in der Lebenskarte gespeicherten Orte, Daten und Notizen erstellt die KI einen Reisebericht aus Sicht der aufzeichnenden Person. Speichern Sie ihn als SNS-Beitrag, Blog-Titelbild oder bei Bedarf als einseitiges A4-PDF.",
      outputLanguage: "Ausgabesprache",
      settings: "Reisebericht-Einstellungen",
      generateAi: "KI-Reisebericht aus Notizen erstellen",
      generating: "Text wird erstellt...",
      template: "Ohne KI erstellen",
      copyPost: "SNS-Beitrag kopieren",
      saveImage: "Titelbild speichern",
      savePdf: "Auch als PDF speichern",
      copyDone: "Kopiert",
      copyDoneHint: "Öffnen Sie Ihre App und fügen Sie den Text ein.",
      copyFailedLabel: "Kopieren fehlgeschlagen",
      copyFailedHint: "Markieren Sie den Text unten und kopieren Sie ihn manuell.",
      imageDone: "Bild gespeichert",
      imageDoneHint: "In Ihren Downloads gespeichert. Fügen Sie es Ihrem Beitrag bei.",
      imageFailedLabel: "Speichern fehlgeschlagen",
      imageFailedHint: "Laden Sie das Foto neu oder versuchen Sie es später erneut.",
      photoPrivacy: "Fotos bleiben auf Ihrem Gerät und werden nie übertragen. Übertragen wird nur Text: Ortsnamen, Daten, Notizen, Titel, Name der verfassenden Person und Einstellungen.",
      noticeTitle: "Nutzungshinweise",
      noticeBody: "Das unbefugte Kopieren, Weiterverwenden oder Weiterverbreiten von Quellcode, Design und Inhalten dieser Website ist untersagt.",
      dataTitle: "Hinweise zur Datenspeicherung",
      dataNote1: "Wenn Sie einen Entwurf speichern, werden Fotos, Orte und Notizen im localStorage dieses Browsers abgelegt. Es erfolgt keine Übertragung an einen Server und kein automatisches Cloud-Backup.",
      dataNote2: "Entwürfe können verloren gehen, wenn Sie Browserdaten oder den Cache löschen, das Gerät zurücksetzen oder wechseln oder einen anderen Browser verwenden.",
      dataNote3: "Für Verlust oder Beschädigung von Daten übernehmen wir keine Haftung. Sichern Sie wichtige Reiseberichte als SNS-Beitrag, Titelbild oder PDF auf Ihrem Gerät.",
      cardLifeMapTitle: "Aus Einträgen der Lebenskarte erstellen",
      cardLifeMapBody: "Laden Sie gespeicherte Fotos, Daten, Orte und Notizen, beschränken Sie sie auf diese eine Reise und bewahren Sie alles als geschriebenen Reisebericht.",
      cardHeritageTitle: "Aus Einträgen des Welterbe-Passes erstellen",
      cardHeritageBody: "Laden Sie Besuchsdaten, Fotos und Notizen aus dem Welterbe-Pass und fassen Sie sie als SNS-Beitrag und Titelbild zusammen.",
      cardPhotoTitle: "Mit ausgewählten Fotos erstellen",
      cardPhotoBody: "Wählen Sie noch nicht gespeicherte Fotos – Aufnahmedatum und GPS werden automatisch ausgelesen – und bewahren Sie alles als geschriebenen Reisebericht.",
    },
  };
  // ja / en 以外はキーを省略でき、その場合は英語を使う。
  // localStorage の古い値など想定外の言語コードが来た場合も同様に英語へ倒す。
  const table = labels[language] ?? labels.en;
  return table[key] ?? labels.en[key];
}

/**
 * 数値を埋め込む文言で単数形・複数形を出し分ける。
 *
 * 英語・ドイツ語は 1 のときだけ単数形、フランス語は 0 と 1 の両方が単数形（CLDR の
 * 複数形カテゴリに準拠）。日本語・中国語・韓国語は単複変化が無いため常に複数形キーを
 * 使う（単数形キーにも同じ文言を入れてあるので、どちらを引いても表示は変わらない）。
 *
 * secondCount を渡すと {m} も置き換える。単数・複数の判定は常に count（{n}）だけで行う。
 * 2つの数値それぞれで語形が変わると 4通りの文言が必要になるため、文言側を
 * 「名詞が {n} にだけ係る」語順にしてある（例: "Using {m} of {n} filtered records"）。
 * {m} 側に名詞や過去分詞を係らせる文面へ変える場合は、この前提が崩れる点に注意。
 */
function countLabel(
  language: OutputLanguage,
  key: UiLabelKey,
  oneKey: UiLabelKey,
  count: number,
  secondCount?: number
): string {
  const singular =
    language === "fr" ? count === 0 || count === 1 : language === "en" || language === "de" ? count === 1 : false;
  const text = uiLabel(language, singular ? oneKey : key).replace("{n}", String(count));
  return secondCount === undefined ? text : text.replace("{m}", String(secondCount));
}

function buildTemplateTexts(
  entries: LifeMapEntry[],
  title: string,
  traveler: string,
  customLabels: Record<string, string>,
  language: OutputLanguage
): { summary: string; spots: Record<string, GeneratedSpotText> } {
  const range = formatRange(entries, language);
  const places = entries.map((entry) => getDisplayPlace(entry, language)).filter(Boolean);
  const summary = fallbackSummaryText(language, title, range, traveler, places);
  const spots = Object.fromEntries(
    entries.map((entry) => {
      const categoryLabel = getCategoryLabel(entry.category, customLabels, language);
      const place = getDisplayPlace(entry, language);
      return [
        entry.id,
        {
          title: place,
          caption: fallbackSpotCaption(language, entry.date, place, categoryLabel, entry.memo),
        },
      ];
    })
  );
  return { summary, spots };
}

function buildAiPayload(
  entries: LifeMapEntry[],
  title: string,
  traveler: string,
  tone: ShioriTone,
  customLabels: Record<string, string>,
  language: OutputLanguage
) {
  return {
    title,
    traveler,
    tone,
    language,
    spots: entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      place: getDisplayPlace(entry, language),
      category: getCategoryLabel(entry.category, customLabels, language),
      memo: entry.memo,
      prefecture: entry.prefecture,
    })),
  };
}
function EntryCard({
  entry,
  customLabels,
  onMemoChange,
  language,
  selected,
  onToggleSelect,
  showMemoInput,
}: {
  entry: LifeMapEntry;
  customLabels: Record<string, string>;
  onMemoChange: (id: string, memo: string) => void;
  language: OutputLanguage;
  /** 旅行記に使うかどうか。 */
  selected: boolean;
  onToggleSelect: (id: string) => void;
  /**
   * 「AIに渡す元メモ」欄を表示するか。false でも entry.memo の値は保持されるので、
   * ai モードに戻せば元の内容がそのまま編集できる。
   */
  showMemoInput: boolean;
}) {
  const cat = getCategory(entry.category);
  const categoryLabel = getCategoryLabel(entry.category, customLabels, language);
  const pos = resolveEntryLatLng(entry);
  const precisionLabel = uiLabel(
    language,
    entry.locationPrecision === "prefecture"
      ? "precisionPrefecture"
      : entry.locationPrecision === "approximate"
      ? "precisionApproximate"
      : "precisionExact"
  );

  return (
    <article
      className={`bg-white rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row border transition-all ${
        selected ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-100"
      }`}
    >
      <div className="sm:w-36 h-44 sm:h-auto bg-slate-100 shrink-0">
        {entry.thumbnailDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.thumbnailDataUrl}
            alt={entry.memo || getDisplayPlace(entry, language)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <ImageOff className="w-8 h-8" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 p-4">
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(entry.id)}
            className="w-4 h-4 accent-emerald-700 cursor-pointer"
          />
          <span className={`text-xs font-bold ${selected ? "text-emerald-800" : "text-slate-400"}`}>
            {uiLabel(language, "entrySelectLabel")}
          </span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold"
            style={{ background: cat.color }}
          >
            <span>{cat.emoji}</span>
            <span>{categoryLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays className="w-3.5 h-3.5" />
            {entry.date}
          </span>
        </div>
        <h3 className="mt-2 text-base font-bold text-slate-800 truncate">
          {getDisplayPlace(entry, language)}
        </h3>
        {showMemoInput && (
          <label className="mt-2 block rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2">
            <span className="text-[11px] font-bold text-emerald-900">
              {uiLabel(language, "entryMemoLabel")}
            </span>
            <textarea
              value={entry.memo || ""}
              onChange={(event) => onMemoChange(entry.id, event.target.value)}
              placeholder={uiLabel(language, "entryMemoPlaceholder")}
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-emerald-100 bg-white/85 px-3 py-2 text-sm leading-relaxed text-slate-700 focus:outline-none focus:border-emerald-600"
            />
            <span className="mt-1 block text-[11px] text-slate-500 leading-relaxed">
              {uiLabel(language, "entryMemoNote")}
            </span>
          </label>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <MapPin className="w-3.5 h-3.5" />
            {pos ? precisionLabel : uiLabel(language, "mapUnset")}
          </span>
          {entry.prefecture && (
            <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
              {entry.prefecture}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ShioriClient({
  initialOutputLanguage,
  respectStoredLang = true,
  showSamplesLink = false,
}: {
  /** /en/shiori など、既定の出力言語を変えたいページから渡す（未指定時は "ja"） */
  initialOutputLanguage?: OutputLanguage;
  /** falseの場合、ブラウザに保存済みの出力言語設定を無視して initialOutputLanguage を優先する */
  respectStoredLang?: boolean;
  /** 日本語のサンプル一覧(/shiori/samples)への導線カードを出すか。/en/shiori では出さない */
  showSamplesLink?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [source, setSource] = useState<EntrySource>("landing");
  const [entries, setEntries] = useState<LifeMapEntry[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customCatLabels, setCustomCatLabels] = useState<Record<string, string>>({});
  const [shioriTitle, setShioriTitle] = useState("");
  const [travelerName, setTravelerName] = useState("");
  const [tone, setTone] = useState<ShioriTone>("warm");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>(initialOutputLanguage ?? "ja");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  // コピー・画像保存の結果は、ボタン自身のラベルを一時的に差し替えて返す。
  // draftMessage（下書き欄）に相乗りしていた頃は、表示位置がボタンの170〜280px下
  // （モバイルでは画面外）で、押しても反応が分からなかった。
  const [copyState, setCopyState] = useState<ActionFeedback>("idle");
  const [imageState, setImageState] = useState<ActionFeedback>("idle");
  const copyTimerRef = useRef<number | null>(null);
  const imageTimerRef = useRef<number | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[] | null>(null);
  // 記録の個別選択。null は「まだ既定を決めていない」で、読み込み直後に一度だけ決定する。
  const [selection, setSelection] = useState<SelectionState | null>(null);
  // 書き方の2択。null のあいだだけ選択カードを出す。
  const [writeMode, setWriteMode] = useState<WriteMode | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [generatedSpots, setGeneratedSpots] = useState<Record<string, GeneratedSpotText>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sessionId, setSessionId] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  // 認証ウィジェットの置き場所は記録一覧の直下（生成アクションバー）に移したため、
  // 記録が0件のあいだは描画されない。refだけではマウントされたことに気づけず、
  // あとから写真を取り込んだ場合にウィジェットが出ないままになる。
  // マウントの有無をstateで持ち、描画のトリガーにする。
  const [turnstileHostReady, setTurnstileHostReady] = useState(false);
  const setTurnstileContainer = useCallback((node: HTMLDivElement | null) => {
    turnstileContainerRef.current = node;
    if (!node) {
      // 置き場所ごと消えるとウィジェットのDOMも失われる。
      // 次にマウントされたときに描画し直せるよう、IDとトークンを捨てる。
      turnstileWidgetIdRef.current = null;
      setTurnstileToken("");
    }
    setTurnstileHostReady(node !== null);
  }, []);
  // 世界遺産パスポートの読み込み時にだけ参照する出力言語。
  // 読み込み用の useEffect の依存に outputLanguage を足すと、言語を変えるたびに記録が再読み込みされ、
  // 画面で編集した元メモが失われてしまうため、依存に含めずrefで現在値だけを渡す。
  const outputLanguageRef = useRef(outputLanguage);
  useEffect(() => {
    outputLanguageRef.current = outputLanguage;
  }, [outputLanguage]);

  // 地図チャンクの読込プレースホルダ（module スコープ）へ現在の出力言語を渡す。
  // 描画中に代入するのは、チャンクの読込が useEffect の実行より先に終わる可能性があるため。
  // 値の書き換えだけで再描画も副作用も伴わないため、二重描画されても結果は変わらない。
  mapLoadingLanguage = outputLanguage;

  // 出力言語セレクトの onChange 専用。/life-map の LifeMapClient と同じ方式で、
  // English を選んだら /en/shiori へ、/en/shiori で日本語に戻したら /shiori へ遷移する。
  // 専用URLを持たない5言語（zh-CN, fr, ko, zh-TW, de）は従来どおりページ内切替のみ。
  //
  // ここ以外（state初期化・localStorage復元・下書き復元・useEffect）からは絶対に呼ばないこと。
  // /en/shiori は初期値が "en" のため、読み込み時に呼ぶと自分自身への遷移を繰り返す。
  // 同じ理由で、保存済み言語やブラウザの言語設定による自動リダイレクトも実装しない。
  const handleOutputLanguageChange = useCallback(
    (next: OutputLanguage) => {
      setOutputLanguage(next);
      // 現在のクエリをそのまま引き継ぐ。世界遺産・人生体験マップからの導線は
      // ?source=...&ids=... 形式のため、落とすと読み込み済みの記録が消えてしまう。
      // クエリが無いときは "" になるため、余計な "?" は付かない。
      const query = window.location.search;
      if (next === "en" && pathname !== "/en/shiori") {
        router.push(`/en/shiori${query}`);
      } else if (next === "ja" && pathname === "/en/shiori") {
        router.push(`/shiori${query}`);
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_CAT_STORAGE_KEY);
      if (raw) setCustomCatLabels(JSON.parse(raw));
      let anonymousSessionId = localStorage.getItem(SHIORI_SESSION_STORAGE_KEY);
      if (!anonymousSessionId) {
        anonymousSessionId = crypto.randomUUID();
        localStorage.setItem(SHIORI_SESSION_STORAGE_KEY, anonymousSessionId);
      }
      setSessionId(anonymousSessionId);
      if (respectStoredLang) {
        const savedLanguage = localStorage.getItem(SHIORI_LANG_STORAGE_KEY);
        if (isOutputLanguage(savedLanguage)) {
          setOutputLanguage(savedLanguage);
        }
      }
      // 出力言語や下書きとは独立して覚える。2回目以降は2択カードを出さない。
      const savedWriteMode = localStorage.getItem(SHIORI_WRITE_MODE_STORAGE_KEY);
      if (isWriteMode(savedWriteMode)) {
        setWriteMode(savedWriteMode);
      }
      const params = new URLSearchParams(window.location.search);
      const incomingSource = params.get("source");
      if (incomingSource === "lifemap" || incomingSource === "heritage") {
        const ids = (params.get("ids") || "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        setSelectedEntryIds(ids.length > 0 ? ids : null);
        setSource(incomingSource);
      }
    } catch {
      setCustomCatLabels({});
    }
    // respectStoredLang は意図的に依存へ入れていない（入れ忘れではない）。
    // localStorage と URL パラメータをマウント時に一度だけ読むための効果で、
    // respectStoredLang は props として不変。依存に入れても再実行されず、
    // 「一度だけ読む」という前提だけが読みにくくなる。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (turnstileSiteKey) return;
    fetch("/api/turnstile-site-key")
      .then((response) => response.json())
      .then((data: { siteKey?: string }) => {
        if (data.siteKey) setTurnstileSiteKey(data.siteKey);
        else setTurnstileStatus("error");
      })
      .catch(() => setTurnstileStatus("error"));
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileHostReady || turnstileWidgetIdRef.current) return;
    setTurnstileStatus("loading");

    const renderTurnstile = () => {
      if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileStatus("ready");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileStatus("loading");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileStatus("error");
        },
      });
    };

    if (window.turnstile) {
      renderTurnstile();
      return;
    }

    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onerror = () => setTurnstileStatus("error");
      document.head.appendChild(script);
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.turnstile && turnstileContainerRef.current) {
        window.clearInterval(timer);
        renderTurnstile();
      } else if (Date.now() - startedAt > 10000) {
        window.clearInterval(timer);
        setTurnstileStatus("error");
      }
    }, 200);

    return () => window.clearInterval(timer);
    // turnstileHostReady を必ず依存に入れること。置き場所は記録の読み込みが
    // 終わるまでDOMに存在しないため、マウント後に再実行されないと描画されない。
  }, [turnstileSiteKey, turnstileHostReady, source]);

  useEffect(() => {
    if (source !== "lifemap" && source !== "heritage") return;
    setLoading(true);
    setLoadError(null);
    const loader = source === "lifemap"
      ? getAllEntries().then((loaded) => selectedEntryIds ? loaded.filter((entry) => selectedEntryIds.includes(entry.id)) : loaded)
      : loadHeritageEntries(selectedEntryIds, outputLanguageRef.current);

    loader
      .then((loaded) => {
        setEntries(loaded);
      })
      .catch(() =>
        setLoadError(
          uiLabel(outputLanguage, source === "heritage" ? "loadErrorHeritage" : "loadErrorLifemap")
        )
      )
      .finally(() => setLoading(false));
    // outputLanguage は意図的に依存へ入れていない（入れ忘れではない）。
    // 依存に入れると、利用者が出力言語を切り替えるたびにこの効果が再実行され、
    // 記録を丸ごと取得し直してしまう（=編集中のメモが読み込み直後の状態に戻り、
    // 世界遺産の場合は不要なfetchが走る）。ここで outputLanguage を使っているのは
    // 失敗時のエラー文言を組み立てる .catch だけなので、再取得に見合う理由がない。
    // 読み込み時点の言語が必要な箇所は outputLanguageRef.current を参照している。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, selectedEntryIds]);

  const regionOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      if (entry.prefecture) values.add(entry.prefecture);
      else if (entry.locationName) values.add(entry.locationName);
    }
    return [...values].sort((a, b) => a.localeCompare(b, "ja"));
  }, [entries]);

  const filteredEntries = useMemo(
    () => filterEntries(entries, filters, customCatLabels, outputLanguage),
    [entries, filters, customCatLabels, outputLanguage]
  );

  // 読み込み直後に既定の選択状態を一度だけ決める。
  //
  // 全選択にできるのは「上流で選び終えている」かつ「上限に収まっている」ときだけ。
  // ids= 付きで来た人・写真を自分で選んだ人に選び直させるのは二度手間だが、
  // それでも MAX_AI_SPOTS を超える件数を渡すと、開いた瞬間にAI生成ボタンが
  // 無効になってしまう。件数まで見て判定することで、どの経路から来ても
  // 「開いた瞬間にエラー状態」にはならない。
  //
  // 判定に使うのは filteredEntries ではなく entries（絞り込み前の総数）。
  // filteredEntries は絞り込み条件が変わるたびに増減するため、
  // これを見て初期値を決めると「一度絞り込むと選択が全部消える」ことになり、
  // 一度きりの既定値の決定という前提が崩れる。読み込み直後は絞り込みが
  // 未設定（emptyFilters）で両者は一致するため、初回判定の結果も変わらない。
  useEffect(() => {
    if (selection !== null) return;
    if (entries.length === 0) return;
    const cameWithSelection = source === "photo" || selectedEntryIds !== null;
    setSelection(cameWithSelection && entries.length <= MAX_AI_SPOTS ? ALL_SELECTED : NONE_SELECTED);
  }, [entries, source, selectedEntryIds, selection]);

  const isEntrySelected = useCallback(
    (id: string) => {
      if (!selection) return true;
      return selection.mode === "all-except" ? !selection.ids.includes(id) : selection.ids.includes(id);
    },
    [selection]
  );

  const toggleEntrySelection = useCallback((id: string) => {
    setSelection((prev) => {
      const current = prev ?? ALL_SELECTED;
      const listed = current.ids.includes(id);
      return {
        mode: current.mode,
        ids: listed ? current.ids.filter((value) => value !== id) : [...current.ids, id],
      };
    });
  }, []);

  // 絞り込みを通ったうえで、利用者がチェックを入れている記録。
  // 旅行記の材料・地図・SNS投稿文・画像・PDFはすべてこちらを使う。
  const selectedEntries = useMemo(
    () => filteredEntries.filter((entry) => isEntrySelected(entry.id)),
    [filteredEntries, isEntrySelected]
  );

  const mappedCount = useMemo(
    () => selectedEntries.filter((entry) => resolveEntryLatLng(entry)).length,
    [selectedEntries]
  );
  const aiVerificationReady = Boolean(turnstileSiteKey && turnstileToken && sessionId);
  // AI生成はサーバー側で MAX_SPOTS 件に制限されている。超えていればサーバーが
  // errorCode: "too_many_entries" を返すだけなので、リクエストを投げる前にここで止める。
  // テンプレート生成（handleTemplateGeneration）はサーバーを使わないため対象外。
  const aiSpotLimitExceeded = selectedEntries.length > MAX_AI_SPOTS;

  // 生成ボタンの近くに出す読み取り専用の設定表示。
  // 生成結果に効く設定（文体・出力言語）がサイドバーに離れたため、いま何が選ばれているかだけを添える。
  const currentSettingsNote = uiLabel(outputLanguage, "currentSettingsNote")
    .replace(
      "{tone}",
      uiLabel(outputLanguage, TONE_OPTIONS.find((option) => option.value === tone)?.labelKey ?? "toneWarm")
    )
    .replace(
      "{lang}",
      OUTPUT_LANGUAGE_OPTIONS.find((option) => option.value === outputLanguage)?.label ?? outputLanguage
    );

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(emptyFilters);
  const handlePrint = () => window.print();

  const handleWriteModeChange = (next: WriteMode) => {
    setWriteMode(next);
    try {
      localStorage.setItem(SHIORI_WRITE_MODE_STORAGE_KEY, next);
    } catch {
      // localStorageが使えない環境では、この画面のあいだだけ記憶します。
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(SHIORI_LANG_STORAGE_KEY, outputLanguage);
    } catch {
      // localStorageが使えない環境では、画面上の選択だけで動かします。
    }
  }, [outputLanguage]);

  const handleSaveDraft = () => {
    try {
      const draft: ShioriDraft = {
        source,
        entries,
        filters,
        shioriTitle,
        travelerName,
        tone,
        outputLanguage,
        generatedSummary,
        generatedSpots,
        // 未決定（null）のまま保存すると復元後に既定の再判定が走ってしまうため、
        // 現在の見た目どおりの選択状態を確定させて保存する。
        selection: selection ?? ALL_SELECTED,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SHIORI_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setDraftMessage(uiLabel(outputLanguage, "draftSaved"));
    } catch {
      setDraftMessage(uiLabel(outputLanguage, "draftSaveFailed"));
    }
  };

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(SHIORI_DRAFT_STORAGE_KEY);
      if (!raw) {
        setDraftMessage(uiLabel(outputLanguage, "draftNone"));
        return;
      }
      const draft = JSON.parse(raw) as Partial<ShioriDraft>;
      // 復元で画面全体が下書きの言語に切り替わるため、完了メッセージも同じ言語で出す。
      const restoredLanguage = isOutputLanguage(draft.outputLanguage) ? draft.outputLanguage : "ja";
      setSource(draft.source === "photo" || draft.source === "lifemap" || draft.source === "heritage" ? draft.source : "photo");
      setEntries(Array.isArray(draft.entries) ? draft.entries : []);
      setFilters(draft.filters || emptyFilters);
      setShioriTitle(draft.shioriTitle || "");
      setTravelerName(draft.travelerName || "");
      setTone(draft.tone || "warm");
      setOutputLanguage(restoredLanguage);
      setGeneratedSummary(draft.generatedSummary || "");
      setGeneratedSpots(draft.generatedSpots || {});
      // 記録は下書きから直接入れ直すため、URL由来の読み込みフィルタは解除する（従来どおり）。
      setSelectedEntryIds(null);
      // selection を非nullにすることで、既定を決める useEffect は何もしない。
      // selection キーが無い古い下書きは全選択＝変更前と同じ見え方で復元する。
      setSelection(isSelectionState(draft.selection) ? draft.selection : ALL_SELECTED);
      setDraftMessage(uiLabel(restoredLanguage, "draftRestored"));
    } catch {
      // ここへ来るのは JSON.parse が失敗したときだけで、下書きの言語はまだ判明していない。
      // 画面の言語も切り替わっていないため、現在の出力言語のままで正しい。
      setDraftMessage(uiLabel(outputLanguage, "draftRestoreFailed"));
    }
  };

  const handleDeleteDraft = () => {
    try {
      localStorage.removeItem(SHIORI_DRAFT_STORAGE_KEY);
      setDraftMessage(uiLabel(outputLanguage, "draftDeleted"));
    } catch {
      setDraftMessage(uiLabel(outputLanguage, "draftDeleteFailed"));
    }
  };

  /**
   * ボタンのラベルを一時的に差し替え、数秒後に元へ戻す。
   * 連打された場合は前のタイマーを破棄してから張り直す（先に張ったタイマーが
   * 後から押した分の表示を消してしまわないようにするため）。
   */
  const flashFeedback = (
    apply: (value: ActionFeedback) => void,
    timerRef: { current: number | null },
    result: Exclude<ActionFeedback, "idle">
  ) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    apply(result);
    timerRef.current = window.setTimeout(() => {
      apply("idle");
      timerRef.current = null;
    }, FEEDBACK_MS[result]);
  };

  useEffect(() => {
    // 表示を戻すタイマーが、アンマウント後に setState を呼ばないようにする。
    return () => {
      // exhaustive-deps は「ref の値は cleanup までに変わる」と警告するが、
      // ここは変わったあとの最新値こそが必要（消したいのは最後に張ったタイマー）。
      // 効果の実行時点で値を控えると null を控えることになり、何も解除できない。
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const timer of [copyTimerRef.current, imageTimerRef.current]) {
        if (timer !== null) window.clearTimeout(timer);
      }
    };
  }, []);

  const handleSocialImageDownload = async () => {
    if (selectedEntries.length === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      flashFeedback(setImageState, imageTimerRef, "failed");
      return;
    }
    const firstImage = selectedEntries.find((entry) => entry.imageDataUrl || entry.thumbnailDataUrl);

    ctx.fillStyle = "#1c1917";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (firstImage?.imageDataUrl || firstImage?.thumbnailDataUrl) {
      await new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => {
          const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
          resolve();
        };
        image.onerror = () => resolve();
        image.src = firstImage.imageDataUrl || firstImage.thumbnailDataUrl;
      });
    } else {
      const warmGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      warmGradient.addColorStop(0, "#7f1d1d");
      warmGradient.addColorStop(1, "#14532d");
      ctx.fillStyle = warmGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 下部の帯。本文を2行から3行に増やしたぶん、190px から 214px に広げている。
    const shadeTop = canvas.height - 214;

    const sampleBrightness = () => {
      try {
        const sample = ctx.getImageData(0, shadeTop, canvas.width, canvas.height - shadeTop).data;
        let total = 0;
        const step = 24;
        for (let index = 0; index < sample.length; index += step * 4) {
          total += sample[index] * 0.299 + sample[index + 1] * 0.587 + sample[index + 2] * 0.114;
        }
        return total / (sample.length / (step * 4));
      } catch {
        return 128;
      }
    };

    const brightness = sampleBrightness();
    const bottomAlpha = brightness > 176 ? 0.66 : brightness < 84 ? 0.48 : 0.58;
    const midAlpha = brightness > 176 ? 0.42 : brightness < 84 ? 0.3 : 0.36;
    const upperAlpha = brightness > 176 ? 0.2 : brightness < 84 ? 0.12 : 0.16;

    const bottomShade = ctx.createLinearGradient(0, shadeTop, 0, canvas.height);
    bottomShade.addColorStop(0, "rgba(0, 0, 0, 0)");
    bottomShade.addColorStop(0.28, `rgba(0, 0, 0, ${upperAlpha})`);
    bottomShade.addColorStop(0.58, `rgba(0, 0, 0, ${midAlpha})`);
    bottomShade.addColorStop(1, `rgba(0, 0, 0, ${bottomAlpha})`);
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, shadeTop, canvas.width, canvas.height - shadeTop);

    const range = formatRange(selectedEntries, outputLanguage);
    const title = shioriTitle || tripTitle(range, outputLanguage);
    const summary =
      generatedSummary ||
      Object.values(generatedSpots).find((spot) => spot.caption?.trim())?.caption ||
      selectedEntries.find((entry) => entry.memo?.trim())?.memo ||
      "";

    const byWord = usesSpaceSeparatedWords(outputLanguage);

    /**
     * 実際の描画幅（ctx.measureText）を測りながら折り返す。文字数の概算はしない。
     * 英語・フランス語・ドイツ語は単語境界で折り返し、単語の途中では改行しない。
     * （1語で1行に収まらないドイツ語の複合語などのときだけ、その語を文字単位で割る。）
     * 日本語・中国語・韓国語は文字単位で折り返し、禁則処理だけ行う。
     */
    const wrapLines = (source: string, maxWidth: number, maxLines: number) => {
      const lines: string[] = [];
      let current = "";
      const flush = () => {
        lines.push(current);
        current = "";
      };

      if (byWord) {
        for (const word of source.split(" ")) {
          if (ctx.measureText(current ? `${current} ${word}` : word).width <= maxWidth) {
            current = current ? `${current} ${word}` : word;
            continue;
          }
          if (current) {
            flush();
            if (lines.length === maxLines) break;
          }
          if (ctx.measureText(word).width <= maxWidth) {
            current = word;
            continue;
          }
          for (const char of word) {
            if (!current || ctx.measureText(current + char).width <= maxWidth) {
              current += char;
              continue;
            }
            flush();
            if (lines.length === maxLines) break;
            current = char;
          }
          if (lines.length === maxLines) break;
        }
      } else {
        for (const char of source) {
          if (!current || ctx.measureText(current + char).width <= maxWidth) {
            current += char;
            continue;
          }
          // 禁則: 行頭に来てはいけない文字は、幅を超えても現在行にぶら下げる。
          if (NO_LINE_START.includes(char)) {
            current += char;
            continue;
          }
          flush();
          if (lines.length === maxLines) break;
          current = char;
        }
      }
      if (lines.length < maxLines && current) flush();

      // 何文字ぶん置けたか。単語単位のときは、区切りの空白1つぶんを足して復元する
      // （source は事前に連続空白を1つへ正規化してあるので、これで元の位置と一致する）。
      const rendered = byWord ? lines.join(" ") : lines.join("");
      return { lines, placed: Math.min(rendered.length, source.length) };
    };

    /** 末尾に … を付ける。ASCIIの3点ではなく U+2026 を使う（等幅でない環境でも整うため）。 */
    const appendEllipsis = (lines: string[], maxWidth: number) => {
      if (lines.length === 0) return lines;
      let last = lines[lines.length - 1];
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      const next = [...lines];
      next[next.length - 1] = `${last}…`;
      return next;
    };

    /** 収まり切ったかどうかも返す。見出しの自動縮小の判定に使う。 */
    const fitTitle = (value: string, maxWidth: number, maxLines: number) => {
      const source = value.replace(/\s+/g, " ").trim();
      if (!source) return { lines: [] as string[], truncated: false };
      const { lines, placed } = wrapLines(source, maxWidth, maxLines);
      if (placed >= source.length) return { lines, truncated: false };
      return { lines: appendEllipsis(lines, maxWidth), truncated: true };
    };

    /**
     * 本文は、収まらない場合に「文の区切り」で終わらせる。
     * 単純に文字数で切ると文の途中で終わって中途半端に見えるため、
     * 収まった範囲の中で最後に現れる句点・ピリオドまでを採用する。
     * 文の区切りが1つも見つからないときだけ、末尾に省略記号を付けて切る。
     */
    const fitBody = (value: string, maxWidth: number, maxLines: number) => {
      const source = value.replace(/\s+/g, " ").trim();
      if (!source) return [];
      const { lines, placed } = wrapLines(source, maxWidth, maxLines);
      if (placed >= source.length) return lines;

      for (let index = placed - 1; index >= 0; index -= 1) {
        if (isSentenceEnd(source, index)) {
          return wrapLines(source.slice(0, index + 1), maxWidth, maxLines).lines;
        }
      }
      return appendEllipsis(lines, maxWidth);
    };

    let titleFont = 38;
    let titleLines: string[] = [];
    do {
      ctx.font = `700 ${titleFont}px ${FONT_STACK}`;
      const fitted = fitTitle(title, 900, 2);
      titleLines = fitted.lines;
      if (titleLines.length < 2 || titleFont <= 32) break;
      if (!fitted.truncated) break;
      titleFont -= 2;
    } while (titleFont >= 32);

    // 本文は2行22pxから3行20pxへ。22pxの2行では日本語で約69文字しか入らず、
    // AIが返す要約（120〜220文字）の半分以上が切り落とされていた。
    // 20pxの3行なら約114文字。フォントの自動縮小は採っていない。SNSのタイムラインでは
    // 画像が縮小表示されるため、全文を入れようとすると読めない大きさになるため。
    ctx.font = `400 20px ${FONT_STACK}`;
    const bodyLines = fitBody(summary, 760, 3);
    const titleLineHeight = Math.round(titleFont * 1.2);
    const bodyLineHeight = 30;
    const bodyGap = bodyLines.length > 0 ? 14 : 0;
    const totalHeight = titleLines.length * titleLineHeight + bodyGap + bodyLines.length * bodyLineHeight;
    let y = canvas.height - 28 - totalHeight + titleFont;

    ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
    ctx.shadowBlur = 12;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
    ctx.font = `700 ${titleFont}px ${FONT_STACK}`;
    titleLines.forEach((line, index) => {
      ctx.fillText(line, 36, y + index * titleLineHeight);
    });

    if (bodyLines.length > 0) {
      y += titleLines.length * titleLineHeight + bodyGap;
      ctx.shadowBlur = 8;
      ctx.font = `400 20px ${FONT_STACK}`;
      ctx.fillStyle = brightness > 176 ? "rgba(255, 255, 255, 0.94)" : "rgba(255, 255, 255, 0.90)";
      bodyLines.forEach((line, index) => {
        ctx.fillText(line, 36, y + index * bodyLineHeight);
      });
    }

    ctx.shadowBlur = 0;
    ctx.textAlign = "right";
    ctx.font = `500 14px ${FONT_STACK}`;
    ctx.fillStyle = brightness > 176 ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0.75)";
    ctx.fillText(aiBrandLabel(outputLanguage), 1164, 592);
    ctx.textAlign = "left";

    try {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${safeDownloadName(title, outputLanguage)}${uiLabel(outputLanguage, "coverFileSuffix")}.png`;
      link.click();
      flashFeedback(setImageState, imageTimerRef, "done");
    } catch {
      // toDataURL は画像の取り込みに失敗した場合などに例外を投げることがある。
      flashFeedback(setImageState, imageTimerRef, "failed");
    }
  };


  const handleSocialPostCopy = async () => {
    if (selectedEntries.length === 0) return;
    const range = formatRange(selectedEntries, outputLanguage);
    const title = shioriTitle || tripTitle(range, outputLanguage);
    const body =
      generatedSummary ||
      Object.values(generatedSpots).find((spot) => spot.caption?.trim())?.caption ||
      selectedEntries.find((entry) => entry.memo?.trim())?.memo ||
      "";
    const places = [...new Set(selectedEntries.map((entry) => getDisplayPlace(entry, outputLanguage)).filter(Boolean))].slice(0, 3);
    const tags = [
      ...uiLabel(outputLanguage, "hashtags").split(" "),
      ...places.map((place) => `#${place.replace(/\s+/g, "")}`),
    ];
    const postText = [title, body, tags.join(" ")].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(postText);
      flashFeedback(setCopyState, copyTimerRef, "done");
    } catch {
      // 非HTTPSや権限拒否で navigator.clipboard は失敗する。その場合も同じ場所で伝える。
      flashFeedback(setCopyState, copyTimerRef, "failed");
    }
  };
  const applyGeneratedTexts = (
    summary: string,
    spots: Record<string, GeneratedSpotText>
  ) => {
    setGeneratedSummary(summary);
    setGeneratedSpots(spots);
  };

  const handleTemplateGeneration = () => {
    const generated = buildTemplateTexts(selectedEntries, shioriTitle, travelerName, customCatLabels, outputLanguage);
    applyGeneratedTexts(generated.summary, generated.spots);
    setAiError(null);
  };

  const handleAiGeneration = async () => {
    if (selectedEntries.length === 0) return;
    if (aiSpotLimitExceeded) {
      setAiError(apiErrorMessage(outputLanguage, "too_many_entries", undefined));
      return;
    }
    if (!aiVerificationReady) {
      setAiError(uiLabel(outputLanguage, "aiNotReady"));
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const payload = buildAiPayload(selectedEntries, shioriTitle, travelerName, tone, customCatLabels, outputLanguage);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-shiori-session-id": sessionId,
        },
        body: JSON.stringify(
          {
            ...payload,
            turnstileToken,
            sessionId,
          }
        ),
      });
      const data = (await response.json()) as {
        summary?: string;
        spots?: { id: string; title?: string; caption?: string }[];
        fallback?: boolean;
        error?: string;
        errorCode?: string;
      };
      if (!response.ok) {
        throw new Error(apiErrorMessage(outputLanguage, data.errorCode, data.error));
      }
      const fallback = buildTemplateTexts(selectedEntries, shioriTitle, travelerName, customCatLabels, outputLanguage);
      // AIを使えなかったとき、サーバーは日本語のテンプレート文を fallback: true で返す。
      // 同じ内容の出力言語版がクライアントにあるので、サーバーの文面は採用しない。
      // （採用すると英語やフランス語を選んでいても日本語が表示されてしまう）
      if (data.fallback) {
        applyGeneratedTexts(fallback.summary, fallback.spots);
        setAiError(uiMessage(outputLanguage, "aiFallback"));
        return;
      }
      const nextSpots = { ...fallback.spots };
      for (const spot of data.spots || []) {
        if (!spot.id) continue;
        nextSpots[spot.id] = {
          title: spot.title || nextSpots[spot.id]?.title || uiLabel(outputLanguage, "memoryPlace"),
          caption: spot.caption || nextSpots[spot.id]?.caption || "",
        };
      }
      applyGeneratedTexts(data.summary || fallback.summary, nextSpots);
    } catch (error) {
      const generated = buildTemplateTexts(selectedEntries, shioriTitle, travelerName, customCatLabels, outputLanguage);
      applyGeneratedTexts(generated.summary, generated.spots);
      setAiError(error instanceof Error && error.message ? error.message : uiMessage(outputLanguage, "aiFailed"));
    } finally {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setTurnstileToken("");
      setAiLoading(false);
    }
  };

  const handlePhotoFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setPhotoProcessing(true);
    setPhotoError(null);
    try {
      const imported: LifeMapEntry[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
          continue;
        }
        if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
          setPhotoError(uiLabel(outputLanguage, "photoHeicWarn"));
        }
        const [compressed, exif] = await Promise.all([
          compressImage(file),
          extractExifLocation(file),
        ]);
        const now = new Date().toISOString();
        imported.push({
          id: `photo-${crypto.randomUUID()}`,
          imageDataUrl: compressed.imageDataUrl,
          thumbnailDataUrl: compressed.thumbnailDataUrl,
          category: "travel",
          date: exif.takenAt || todayStr(),
          memo: "",
          lat: exif.lat,
          lng: exif.lng,
          locationName: file.name.replace(/\.[^.]+$/, ""),
          locationPrecision: exif.hasGps ? "exact" : "exact",
          createdAt: now,
          updatedAt: now,
        });
      }
      setEntries((prev) => [...prev, ...imported]);
      if (imported.length === 0 && !photoError) {
        setPhotoError(uiLabel(outputLanguage, "photoNone"));
      }
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : uiLabel(outputLanguage, "photoImportFailed"));
    } finally {
      setPhotoProcessing(false);
    }
  };

  const updatePhotoEntry = (id: string, patch: Partial<LifeMapEntry>) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry
      )
    );
  };

  const removePhotoEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    setGeneratedSpots((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const updateSpotText = (id: string, patch: Partial<GeneratedSpotText>) => {
    setGeneratedSpots((prev) => ({
      ...prev,
      // ここは selectedEntries に差し替えないこと。スポット欄は選択を外した記録にも
      // 表示され続け、そこを編集するとチェックの無いidが渡ってくる。selectedEntries から
      // 探すと find が undefined になり、直後の非nullアサーションで実行時エラーになる。
      [id]: {
        title: prev[id]?.title || getDisplayPlace(filteredEntries.find((entry) => entry.id === id)!, outputLanguage),
        caption: prev[id]?.caption || "",
        ...patch,
      },
    }));
  };
  const updateEntryMemo = (id: string, memo: string) => {
    const now = new Date().toISOString();
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, memo, updatedAt: now } : entry
      )
    );
  };

  return (
    <div className="min-h-screen bg-rose-50/40 text-stone-800" style={{ fontFamily: FONT_STACK }}>
      <header className="bg-white border-b border-rose-100 sticky top-0 z-[1000]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-rose-900 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">{uiLabel(outputLanguage, "serviceName")}</h1>
              <p className="text-xs text-slate-400 truncate">
                {uiLabel(outputLanguage, "tagline")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={outputLanguage}
              onChange={(e) => handleOutputLanguageChange(e.target.value as OutputLanguage)}
              aria-label={uiLabel(outputLanguage, "outputLanguage")}
              className="px-3 py-2 rounded-lg bg-white border border-rose-100 text-slate-700 text-xs font-medium focus:outline-none focus:border-rose-400"
            >
              {OUTPUT_LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {source !== "landing" && (
              <button
                type="button"
                onClick={() => setSource("landing")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {uiLabel(outputLanguage, "backTop")}
              </button>
            )}
            <Link
              href="/life-map"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all"
            >
              {uiLabel(outputLanguage, "lifeMap")}
            </Link>
            <Link
              href="/heritage"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition-all"
            >
              {uiLabel(outputLanguage, "heritage")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-xs font-medium transition-all"
            >
              {uiLabel(outputLanguage, "drivePlanner")}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-5 space-y-5">
        <section className="bg-white border border-rose-100 shadow-sm rounded-xl p-5 sm:p-6">
          <p className="text-xs font-bold text-rose-900 tracking-wide">
            {uiLabel(outputLanguage, "serviceName")}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
            {uiLabel(outputLanguage, "heroTitle")}
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {uiLabel(outputLanguage, "heroBody")}
          </p>
          <p className="mt-3 text-xs text-slate-500 flex items-start gap-1.5">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {uiLabel(outputLanguage, "photoPrivacy")}
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-800">{uiLabel(outputLanguage, "noticeTitle")}</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              {uiLabel(outputLanguage, "noticeBody")}
            </p>
          </div>
          <div className="bg-white border border-amber-100 shadow-sm rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-800">{uiLabel(outputLanguage, "dataTitle")}</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-500 leading-relaxed list-disc pl-5">
              <li>{uiLabel(outputLanguage, "dataNote1")}</li>
              <li>{uiLabel(outputLanguage, "dataNote2")}</li>
              <li>{uiLabel(outputLanguage, "dataNote3")}</li>
            </ul>
          </div>
        </section>

        {source === "landing" && (
          <section className="grid md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setSource("lifemap");
                setEntries([]);
                // 読み込み元が変われば既定の選択状態も決め直す。
                setSelection(null);
              }}
              className="text-left bg-white border border-slate-100 hover:border-rose-200 shadow-sm rounded-xl p-5 transition-all focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              <div className="w-11 h-11 rounded-lg bg-rose-900 text-white flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {uiLabel(outputLanguage, "cardLifeMapTitle")}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {uiLabel(outputLanguage, "cardLifeMapBody")}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSource("heritage");
                setEntries([]);
                setFilters(emptyFilters);
                setGeneratedSummary("");
                setGeneratedSpots({});
                setSelection(null);
              }}
              className="text-left bg-white border border-slate-100 hover:border-rose-200 shadow-sm rounded-xl p-5 transition-all focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              <div className="w-11 h-11 rounded-lg bg-amber-700 text-white flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {uiLabel(outputLanguage, "cardHeritageTitle")}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {uiLabel(outputLanguage, "cardHeritageBody")}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setSource("photo");
                setEntries([]);
                setFilters(emptyFilters);
                setGeneratedSummary("");
                setGeneratedSpots({});
                setSelection(null);
              }}
              className="text-left bg-white border border-slate-100 hover:border-rose-200 shadow-sm rounded-xl p-5 transition-all focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              <div className="w-11 h-11 rounded-lg bg-emerald-900 text-white flex items-center justify-center mb-4">
                <Camera className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {uiLabel(outputLanguage, "cardPhotoTitle")}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {uiLabel(outputLanguage, "cardPhotoBody")}
              </p>
            </button>
          </section>
        )}

        {source === "landing" && showSamplesLink && (
          <section className="pb-10">
            <Link
              href="/shiori/samples"
              className="block bg-white border border-slate-100 hover:border-rose-200 shadow-sm rounded-xl p-5 transition-all focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              <div className="w-11 h-11 rounded-lg bg-slate-700 text-white flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {uiLabel(outputLanguage, "samplesTitle")}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {uiLabel(outputLanguage, "samplesDesc")}
              </p>
              <p className="mt-3 text-sm font-bold text-rose-800">{uiLabel(outputLanguage, "samplesCta")}</p>
            </Link>
          </section>
        )}

        {source === "photo" && (
          <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base">{uiLabel(outputLanguage, "photoTitle")}</h2>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {uiLabel(outputLanguage, "photoDesc")}
                </p>
              </div>
            </div>
            <label className="flex flex-col items-center justify-center gap-2 min-h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all px-4 py-6 text-center">
              <Upload className="w-7 h-7 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">{uiLabel(outputLanguage, "photoPick")}</span>
              <span className="text-xs text-slate-500">{uiLabel(outputLanguage, "photoPickNote")}</span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handlePhotoFiles(Array.from(e.target.files || []));
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {photoProcessing && (
              <div className="rounded-lg bg-rose-900 text-white px-4 py-3 text-sm font-medium">
                {uiLabel(outputLanguage, "photoProcessing")}
              </div>
            )}
            {photoError && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm leading-relaxed">
                {photoError}
              </div>
            )}
          </section>
        )}

        {(source === "lifemap" || source === "photo" || source === "heritage") &&
          entries.length > 0 &&
          writeMode === null && (
            <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 sm:p-5">
              <h2 className="font-bold text-base">{uiLabel(outputLanguage, "writeModeTitle")}</h2>
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleWriteModeChange("ai")}
                  className="text-left rounded-xl border border-slate-200 hover:border-emerald-600 bg-white p-4 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-800" />
                    <span className="font-bold text-sm text-slate-800">
                      {uiLabel(outputLanguage, "writeModeAiLabel")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {uiLabel(outputLanguage, "writeModeAiDesc")}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleWriteModeChange("manual")}
                  className="text-left rounded-xl border border-slate-200 hover:border-rose-400 bg-white p-4 transition-all focus:outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-800" />
                    <span className="font-bold text-sm text-slate-800">
                      {uiLabel(outputLanguage, "writeModeManualLabel")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {uiLabel(outputLanguage, "writeModeManualDesc")}
                  </p>
                </button>
              </div>
            </section>
          )}

        {(source === "lifemap" || source === "photo" || source === "heritage") && (
          <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-4 items-start">
            {/*
              モバイルでは記録の入力・選択が先に来るように、右カラムを先頭へ回す。
              設定・出力・下書きは入力を終えてから使うため後ろで良い。
              PCでは lg:order-* で従来どおり「左=サイドバー / 右=本文」に戻す。
            */}
            <aside className="order-2 lg:order-1 space-y-4 lg:sticky lg:top-[84px]">
              <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="font-bold text-base">{uiLabel(outputLanguage, "filterTitle")}</h2>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {uiLabel(outputLanguage, "filterClear")}
                  </button>
                </div>
                <p className="mb-4 text-xs text-slate-500 leading-relaxed">
                  {uiLabel(outputLanguage, source === "heritage" ? "filterDescHeritage" : "filterDescLifemap")}
                </p>

                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {uiLabel(outputLanguage, "filterFrom")}
                    </span>
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) => updateFilter("from", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {uiLabel(outputLanguage, "filterTo")}
                    </span>
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) => updateFilter("to", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {uiLabel(outputLanguage, "filterRegion")}
                    </span>
                    <select
                      value={filters.region}
                      onChange={(e) => updateFilter("region", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    >
                      <option value="">{uiLabel(outputLanguage, "filterRegionAll")}</option>
                      {regionOptions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      {uiLabel(outputLanguage, "filterTag")}
                    </span>
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        updateFilter("category", e.target.value as Filters["category"])
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    >
                      <option value="all">{uiLabel(outputLanguage, "filterTagAll")}</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.emoji} {getCategoryLabel(cat.value, customCatLabels, outputLanguage)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 mb-1 block">
                      {uiLabel(outputLanguage, "filterKeyword")}
                    </span>
                    <input
                      type="search"
                      value={filters.keyword}
                      onChange={(e) => updateFilter("keyword", e.target.value)}
                      placeholder={uiLabel(outputLanguage, "filterKeywordPlaceholder")}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                    <span className="mt-1.5 block text-[11px] text-slate-500 leading-relaxed">
                      {uiLabel(outputLanguage, source === "heritage" ? "filterKeywordNoteHeritage" : "filterKeywordNoteLifemap")}
                    </span>
                  </label>
                </div>
              </section>

              {source === "photo" && entries.length > 0 && (
                <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                  <h2 className="font-bold text-base">{uiLabel(outputLanguage, "photoEditTitle")}</h2>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {uiLabel(outputLanguage, "photoEditDesc")}
                  </p>
                  <div className="mt-4 space-y-4">
                    {entries.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
                        <div className="flex gap-3">
                          {entry.thumbnailDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.thumbnailDataUrl} alt={getDisplayPlace(entry, outputLanguage)} className="w-20 h-20 object-cover rounded-lg bg-white shrink-0" />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center text-slate-400 shrink-0">
                              <ImageOff className="w-6 h-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-2">
                            <input
                              type="text"
                              value={entry.locationName || ""}
                              onChange={(e) => updatePhotoEntry(entry.id, { locationName: e.target.value })}
                              placeholder={uiLabel(outputLanguage, "photoPlacePlaceholder")}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={entry.date}
                                onChange={(e) => updatePhotoEntry(entry.id, { date: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                              />
                              <select
                                value={entry.category}
                                onChange={(e) => updatePhotoEntry(entry.id, { category: e.target.value as LifeMapCategory })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.emoji} {getCategoryLabel(cat.value, customCatLabels, outputLanguage)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhotoEntry(entry.id)}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                            aria-label={uiLabel(outputLanguage, "photoDeleteLabel")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <label className="block">
                          <span className="text-[11px] font-bold text-emerald-900 mb-1 block">
                            {uiLabel(outputLanguage, "photoMemoLabel")}
                          </span>
                          <textarea
                            value={entry.memo || ""}
                            onChange={(e) => updatePhotoEntry(entry.id, { memo: e.target.value })}
                            placeholder={uiLabel(outputLanguage, "photoMemoPlaceholder")}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-sm leading-relaxed focus:outline-none focus:border-emerald-600"
                          />
                          <span className="mt-1 block text-[11px] text-slate-500 leading-relaxed">
                            {uiLabel(outputLanguage, "photoMemoNote")}
                          </span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={entry.prefecture || ""}
                            onChange={(e) => updatePhotoEntry(entry.id, { prefecture: e.target.value || undefined })}
                            placeholder={uiLabel(outputLanguage, "photoPrefPlaceholder")}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                          />
                          <input
                            type="number"
                            step="any"
                            value={entry.lat ?? ""}
                            onChange={(e) => updatePhotoEntry(entry.id, { lat: e.target.value === "" ? undefined : Number(e.target.value) })}
                            placeholder={uiLabel(outputLanguage, "photoLatPlaceholder")}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                          />
                          <input
                            type="number"
                            step="any"
                            value={entry.lng ?? ""}
                            onChange={(e) => updatePhotoEntry(entry.id, { lng: e.target.value === "" ? undefined : Number(e.target.value) })}
                            placeholder={uiLabel(outputLanguage, "photoLngPlaceholder")}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Navigation className="w-3 h-3" />
                          {uiLabel(outputLanguage, entry.lat != null && entry.lng != null ? "photoGpsYes" : "photoGpsNo")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                <h2 className="font-bold text-base">{uiLabel(outputLanguage, "settings")}</h2>
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "fieldTitle")}</span>
                    <input
                      type="text"
                      value={shioriTitle}
                      onChange={(e) => setShioriTitle(e.target.value)}
                      placeholder={tripTitle(formatRange(selectedEntries, outputLanguage), outputLanguage)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "fieldTraveler")}</span>
                    <input
                      type="text"
                      value={travelerName}
                      onChange={(e) => setTravelerName(e.target.value)}
                      placeholder={uiLabel(outputLanguage, "travelerPlaceholder")}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "fieldTone")}</span>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as ShioriTone)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    >
                      {TONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {uiLabel(outputLanguage, option.labelKey)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "outputLanguage")}</span>
                    <select
                      value={outputLanguage}
                      onChange={(e) => handleOutputLanguageChange(e.target.value as OutputLanguage)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    >
                      {OUTPUT_LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {/*
                    AI生成・テンプレート生成・認証ウィジェットはここから記録一覧の直下
                    （生成アクションバー）へ移設した。メモを書き終えた視線の先にボタンを置くため。
                    この設定パネルには、生成前に決める設定と生成後の出力だけを残す。
                  */}
                  {/*
                    押した結果はボタン自身のラベルで返し、次にすることは直下に出す。
                    1つのラベルに「コピーしました。SNSに貼り付けてください」まで入れると
                    独語・仏語で2〜3行に折り返してボタンの高さが動くため、2つに分けている。
                  */}
                  <div aria-live="polite">
                    <button
                      type="button"
                      onClick={handleSocialPostCopy}
                      disabled={selectedEntries.length === 0}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all ${
                        copyState === "done"
                          ? "bg-emerald-600"
                          : copyState === "failed"
                            ? "bg-red-700"
                            : "bg-emerald-900 hover:bg-emerald-800"
                      }`}
                    >
                      {copyState === "done" ? (
                        <Check className="w-4 h-4" />
                      ) : copyState === "failed" ? (
                        <CircleAlert className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {copyState === "done"
                        ? uiLabel(outputLanguage, "copyDone")
                        : copyState === "failed"
                          ? uiLabel(outputLanguage, "copyFailedLabel")
                          : uiLabel(outputLanguage, "copyPost")}
                    </button>
                    {copyState !== "idle" && (
                      <p
                        className={`mt-1.5 text-xs leading-relaxed ${
                          copyState === "failed" ? "text-red-700" : "text-emerald-800"
                        }`}
                      >
                        {copyState === "done"
                          ? uiLabel(outputLanguage, "copyDoneHint")
                          : uiLabel(outputLanguage, "copyFailedHint")}
                      </p>
                    )}
                  </div>
                  <div aria-live="polite">
                    <button
                      type="button"
                      onClick={handleSocialImageDownload}
                      disabled={selectedEntries.length === 0}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all ${
                        imageState === "done"
                          ? "bg-emerald-600"
                          : imageState === "failed"
                            ? "bg-red-700"
                            : "bg-rose-900 hover:bg-rose-800"
                      }`}
                    >
                      {imageState === "done" ? (
                        <Check className="w-4 h-4" />
                      ) : imageState === "failed" ? (
                        <CircleAlert className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {imageState === "done"
                        ? uiLabel(outputLanguage, "imageDone")
                        : imageState === "failed"
                          ? uiLabel(outputLanguage, "imageFailedLabel")
                          : uiLabel(outputLanguage, "saveImage")}
                    </button>
                    {imageState !== "idle" && (
                      <p
                        className={`mt-1.5 text-xs leading-relaxed ${
                          imageState === "failed" ? "text-red-700" : "text-emerald-800"
                        }`}
                      >
                        {imageState === "done"
                          ? uiLabel(outputLanguage, "imageDoneHint")
                          : uiLabel(outputLanguage, "imageFailedHint")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={selectedEntries.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-600 border border-slate-200 text-sm font-bold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {uiLabel(outputLanguage, "savePdf")}
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {uiLabel(outputLanguage, "pdfNote")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      {uiLabel(outputLanguage, "draftSave")}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      {uiLabel(outputLanguage, "draftRestore")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteDraft}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-red-100 text-xs font-bold transition-all"
                    >
                      {uiLabel(outputLanguage, "draftDelete")}
                    </button>
                  </div>
                  {draftMessage && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
                      {draftMessage}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {uiLabel(outputLanguage, "draftNote")}
                  </p>
                </div>
              </section>

              <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                <h2 className="font-bold text-base">{uiLabel(outputLanguage, "summaryTitle")}</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <div className="text-lg font-bold">{entries.length}</div>
                    <div className="text-[11px] text-slate-500">{uiLabel(outputLanguage, "summaryAll")}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <div className="text-lg font-bold">{selectedEntries.length}</div>
                    <div className="text-[11px] text-slate-500">{uiLabel(outputLanguage, "summaryUsed")}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <div className="text-lg font-bold">{mappedCount}</div>
                    <div className="text-[11px] text-slate-500">{uiLabel(outputLanguage, "summaryMapped")}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                  {countLabel(
                    outputLanguage,
                    "selectionCount",
                    "selectionCountOne",
                    filteredEntries.length,
                    selectedEntries.length
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {uiLabel(outputLanguage, "summaryRange")} {formatRange(selectedEntries, outputLanguage)}
                </p>
              </section>
            </aside>

            <section className="order-1 lg:order-2 space-y-4 min-w-0">
              {loading && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 text-center text-slate-500">
                  {uiLabel(outputLanguage, "loadingRecords")}
                </div>
              )}

              {loadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {loadError}
                </div>
              )}

              {!loading && !loadError && entries.length === 0 && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 text-center">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <h2 className="mt-3 text-lg font-bold">{uiLabel(outputLanguage, "emptyTitle")}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {uiLabel(
                      outputLanguage,
                      source === "photo"
                        ? "emptyDescPhoto"
                        : source === "heritage"
                        ? "emptyDescHeritage"
                        : "emptyDescLifemap"
                    )}
                  </p>
                  {source === "photo" ? (
                    <label className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-sm font-bold transition-all cursor-pointer">
                      {uiLabel(outputLanguage, "emptyPickPhoto")}
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          handlePhotoFiles(Array.from(e.target.files || []));
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  ) : (
                    <Link
                      href={source === "heritage" ? "/heritage" : "/life-map"}
                      className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-sm font-bold transition-all"
                    >
                      {uiLabel(outputLanguage, source === "heritage" ? "emptyCtaHeritage" : "emptyCtaLifemap")}
                    </Link>
                  )}
                </div>
              )}

              {!loading && entries.length > 0 && filteredEntries.length === 0 && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 text-center">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <h2 className="mt-3 text-lg font-bold">{uiLabel(outputLanguage, "noMatchTitle")}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {uiLabel(outputLanguage, "noMatchDesc")}
                  </p>
                </div>
              )}

              {filteredEntries.length > 0 && (
                <>
                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400">{uiLabel(outputLanguage, "previewLabel")}</p>
                        <h2 className="text-xl font-bold text-slate-800">
                          {shioriTitle || tripTitle(formatRange(selectedEntries, outputLanguage), outputLanguage)}
                        </h2>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm text-slate-500">
                          {countLabel(outputLanguage, "previewCount", "previewCountOne", filteredEntries.length)}
                        </p>
                        <p className="text-sm font-bold text-emerald-800">
                          {countLabel(
                            outputLanguage,
                            "selectionCount",
                            "selectionCountOne",
                            filteredEntries.length,
                            selectedEntries.length
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[360px] lg:h-[460px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                    <ShioriMap entries={selectedEntries} language={outputLanguage} />
                  </div>

                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <h2 className="font-bold text-base">{uiLabel(outputLanguage, "sectionTextTitle")}</h2>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {uiLabel(outputLanguage, "sectionTextDesc")}
                    </p>
                    <label className="mt-4 block">
                      <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "bodyLabel")}</span>
                      <textarea
                        value={generatedSummary}
                        onChange={(e) => setGeneratedSummary(e.target.value)}
                        placeholder={uiLabel(outputLanguage, "bodyPlaceholder")}
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm leading-relaxed focus:outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>

                  {selectedEntries.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h3 className="font-bold text-sm text-amber-900">
                        {uiLabel(outputLanguage, "selectionNoneTitle")}
                      </h3>
                      <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                        {uiLabel(outputLanguage, "selectionNoneDesc")}
                      </p>
                    </div>
                  )}

                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-500 mr-auto">
                      {countLabel(
                        outputLanguage,
                        "selectionCount",
                        "selectionCountOne",
                        filteredEntries.length,
                        selectedEntries.length
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelection(ALL_SELECTED)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      {uiLabel(outputLanguage, "selectAll")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelection(NONE_SELECTED)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold transition-all"
                    >
                      {uiLabel(outputLanguage, "selectNone")}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredEntries.map((entry) => {
                      const generated = generatedSpots[entry.id];
                      return (
                        <div key={entry.id} className="space-y-2">
                          <EntryCard
                            entry={entry}
                            customLabels={customCatLabels}
                            onMemoChange={updateEntryMemo}
                            language={outputLanguage}
                            selected={isEntrySelected(entry.id)}
                            onToggleSelect={toggleEntrySelection}
                            showMemoInput={writeMode !== "manual"}
                          />
                          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                            <label className="block">
                              <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "spotTitleLabel")}</span>
                              <input
                                type="text"
                                value={generated?.title || getDisplayPlace(entry, outputLanguage)}
                                onChange={(e) => updateSpotText(entry.id, { title: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                              />
                            </label>
                            <label className="mt-3 block">
                              <span className="text-xs font-bold text-slate-500 mb-1 block">{uiLabel(outputLanguage, "spotCaptionLabel")}</span>
                              <textarea
                                value={generated?.caption || ""}
                                onChange={(e) => updateSpotText(entry.id, { caption: e.target.value })}
                                placeholder={uiLabel(outputLanguage, "spotCaptionPlaceholder")}
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm leading-relaxed focus:outline-none focus:border-slate-400"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 生成アクションバー。メモを書き終えた視線の先に置くため、記録一覧の直下に配置する。 */}
                  <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-slate-500" />
                      <h2 className="font-bold text-base">{uiLabel(outputLanguage, "generateSectionTitle")}</h2>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{currentSettingsNote}</p>

                    {writeMode === "manual" ? (
                      <>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {uiLabel(outputLanguage, "writeModeManualDesc")}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleWriteModeChange("ai")}
                          className="text-sm font-bold text-emerald-800 hover:text-emerald-900 underline underline-offset-4"
                        >
                          {uiLabel(outputLanguage, "switchToAi")}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {uiLabel(outputLanguage, "aiStepHint")}
                        </p>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                          {turnstileSiteKey ? (
                            <>
                              <div ref={setTurnstileContainer} className="min-h-[65px]" />
                              {!turnstileToken && turnstileStatus === "loading" && (
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {uiLabel(outputLanguage, "turnstileLoading")}
                                </p>
                              )}
                              {turnstileStatus === "error" && (
                                <p className="text-xs text-amber-700 leading-relaxed">
                                  {uiLabel(outputLanguage, "turnstileError")}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-amber-700 leading-relaxed">
                              {uiLabel(outputLanguage, "turnstileMissing")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleAiGeneration}
                          disabled={
                            selectedEntries.length === 0 || aiLoading || !aiVerificationReady || aiSpotLimitExceeded
                          }
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all"
                        >
                          <Sparkles className="w-4 h-4" />
                          {aiLoading ? uiLabel(outputLanguage, "generating") : uiLabel(outputLanguage, "generateAi")}
                        </button>
                        {aiSpotLimitExceeded && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                            {apiErrorMessage(outputLanguage, "too_many_entries", undefined)}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {uiLabel(outputLanguage, "aiScopeNote")}
                        </p>
                        <button
                          type="button"
                          onClick={handleTemplateGeneration}
                          disabled={selectedEntries.length === 0}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 border border-slate-200 text-sm font-bold transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          {uiLabel(outputLanguage, "template")}
                        </button>
                        {aiError && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                            {aiError}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleWriteModeChange("manual")}
                          className="text-sm font-bold text-slate-500 hover:text-slate-700 underline underline-offset-4"
                        >
                          {uiLabel(outputLanguage, "switchToManual")}
                        </button>
                      </>
                    )}
                  </section>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {(source === "lifemap" || source === "photo" || source === "heritage") && selectedEntries.length > 0 && (
        <ShioriPrintDocument
          entries={selectedEntries}
          title={shioriTitle}
          traveler={travelerName}
          summary={generatedSummary}
          generatedSpots={generatedSpots}
          customLabels={customCatLabels}
          language={outputLanguage}
        />
      )}
    </div>
  );
}




































