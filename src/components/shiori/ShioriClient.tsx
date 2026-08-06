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
      地図を読み込んでいます...
    </div>
  ),
});

type EntrySource = "landing" | "lifemap" | "photo" | "heritage";

type ShioriTone = "warm" | "simple" | "diary" | "guide";
type OutputLanguage = "ja" | "en" | "zh-CN" | "fr" | "ko" | "zh-TW" | "de";

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
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

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
  savedAt: string;
};

const emptyFilters: Filters = {
  from: "",
  to: "",
  region: "",
  category: "all",
  keyword: "",
};

const FONT_STACK =
  '"Meiryo", "メイリオ", "Hiragino Sans", "Noto Sans JP", sans-serif';

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

function defaultNarrator(language: OutputLanguage): string {
  switch (language) {
    case "en":
      return "I";
    case "zh-CN":
      return "我";
    case "fr":
      return "moi";
    case "ko":
      return "나";
    case "zh-TW":
      return "我";
    case "de":
      return "ich";
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
      return `${displayTitle} is a travel journal from ${narrator}'s point of view, following ${placeText || "memorable places"}. I gathered the photos, dates, places, and original notes so the feelings and small moments from the trip can be remembered later.`;
    case "zh-CN":
      return `${displayTitle}是以${narrator}的视角整理的旅行记，记录了${placeText || "难忘的地点"}。我把照片、日期、地点和原始备忘整理在一起，方便日后回想这段旅程的感受与细节。`;
    case "fr":
      return `${displayTitle} est un carnet de voyage raconté du point de vue de ${narrator}, autour de ${placeText || "lieux mémorables"}. Les photos, dates, lieux et notes d'origine sont réunis pour retrouver plus tard les impressions du voyage.`;
    case "ko":
      return `${displayTitle}은 ${placeText || "기억에 남는 장소"}를 따라 ${narrator}의 시선으로 정리한 여행기입니다. 사진, 날짜, 장소, 원래 메모를 모아 그때의 감정과 작은 순간을 나중에도 떠올릴 수 있게 남깁니다.`;
    case "zh-TW":
      return `${displayTitle}是以${narrator}的視角整理的旅行記，記錄了${placeText || "難忘的地點"}。我把照片、日期、地點和原始備忘整理在一起，方便日後回想這段旅程的感受與細節。`;
    case "de":
      return `${displayTitle} ist ein Reisebericht aus der Sicht von ${narrator}, rund um ${placeText || "unvergessliche Orte"}. Fotos, Daten, Orte und ursprüngliche Notizen werden gesammelt, damit die Eindrücke der Reise später wieder lebendig werden.`;
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

function uiMessage(language: OutputLanguage, key: "copied" | "copyFailed" | "aiFallback" | "aiFailed"): string {
  const messages: Record<OutputLanguage, Record<"copied" | "copyFailed" | "aiFallback" | "aiFailed", string>> = {
    ja: {
      copied: "SNS投稿文をコピーしました。",
      copyFailed: "SNS投稿文をコピーできませんでした。文章欄から手動でコピーしてください。",
      aiFallback: "AIが使えないため、AIなしの記録文で作成しました。文章はそのまま編集できます。",
      aiFailed: "AI生成に失敗したため、AIなしの記録文で作成しました。文章はそのまま編集できます。",
    },
    en: {
      copied: "Social media post text copied.",
      copyFailed: "Could not copy the social media post text. Please copy it manually from the text area.",
      aiFallback: "AI is unavailable, so a template journal was created. You can edit the text freely.",
      aiFailed: "AI generation failed, so a template journal was created. You can edit the text freely.",
    },
    "zh-CN": {
      copied: "已复制SNS投稿文。",
      copyFailed: "无法复制SNS投稿文。请从文本栏手动复制。",
      aiFallback: "AI暂时不可用，已生成不使用AI的旅行记。文字可以继续编辑。",
      aiFailed: "AI生成失败，已生成不使用AI的旅行记。文字可以继续编辑。",
    },
    fr: {
      copied: "Le texte pour les réseaux sociaux a été copié.",
      copyFailed: "Impossible de copier le texte. Veuillez le copier manuellement depuis la zone de texte.",
      aiFallback: "L'IA est indisponible. Un texte modèle a été créé et peut être modifié.",
      aiFailed: "La génération par IA a échoué. Un texte modèle a été créé et peut être modifié.",
    },
    ko: {
      copied: "SNS 게시글 문장을 복사했습니다.",
      copyFailed: "SNS 게시글 문장을 복사하지 못했습니다. 글 영역에서 직접 복사해 주세요.",
      aiFallback: "AI를 사용할 수 없어 템플릿 여행기를 만들었습니다. 문장은 자유롭게 편집할 수 있습니다.",
      aiFailed: "AI 생성에 실패해 템플릿 여행기를 만들었습니다. 문장은 자유롭게 편집할 수 있습니다.",
    },
    "zh-TW": {
      copied: "已複製SNS貼文。",
      copyFailed: "無法複製SNS貼文。請從文字欄手動複製。",
      aiFallback: "AI暫時無法使用，已產生不使用AI的旅行記。文字可繼續編輯。",
      aiFailed: "AI產生失敗，已產生不使用AI的旅行記。文字可繼續編輯。",
    },
    de: {
      copied: "Der SNS-Beitragstext wurde kopiert.",
      copyFailed: "Der SNS-Beitragstext konnte nicht kopiert werden. Bitte kopieren Sie ihn manuell aus dem Textfeld.",
      aiFallback: "KI ist nicht verfügbar. Ein Vorlagentext wurde erstellt und kann bearbeitet werden.",
      aiFailed: "Die KI-Erstellung ist fehlgeschlagen. Ein Vorlagentext wurde erstellt und kann bearbeitet werden.",
    },
  };
  return messages[language][key];
}

function uiLabel(
  language: OutputLanguage,
  key:
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
}: {
  entry: LifeMapEntry;
  customLabels: Record<string, string>;
  onMemoChange: (id: string, memo: string) => void;
  language: OutputLanguage;
}) {
  const cat = getCategory(entry.category);
  const categoryLabel = getCategoryLabel(entry.category, customLabels, language);
  const pos = resolveEntryLatLng(entry);
  const precisionLabel =
    entry.locationPrecision === "prefecture"
      ? "都道府県単位"
      : entry.locationPrecision === "approximate"
      ? "おおよその位置"
      : "詳細位置";

  return (
    <article className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
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
        <label className="mt-2 block rounded-lg bg-emerald-50/70 border border-emerald-100 px-3 py-2">
          <span className="text-[11px] font-bold text-emerald-900">
            AIに渡す元メモ（この画面内で編集）
          </span>
          <textarea
            value={entry.memo || ""}
            onChange={(event) => onMemoChange(entry.id, event.target.value)}
            placeholder="例：その場所で感じたこと、印象に残った出来事、写真に残した理由など"
            rows={3}
            className="mt-1 w-full resize-y rounded-lg border border-emerald-100 bg-white/85 px-3 py-2 text-sm leading-relaxed text-slate-700 focus:outline-none focus:border-emerald-600"
          />
          <span className="mt-1 block text-[11px] text-slate-500 leading-relaxed">
            メモ欄の編集内容は、AI旅行記メーカー画面内の素材として使われます。人生体験マップや世界遺産パスポートに戻っても、元データには反映されません。
          </span>
        </label>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <MapPin className="w-3.5 h-3.5" />
            {pos ? precisionLabel : "地図未設定"}
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
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[] | null>(null);
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
  // 世界遺産パスポートの読み込み時にだけ参照する出力言語。
  // 読み込み用の useEffect の依存に outputLanguage を足すと、言語を変えるたびに記録が再読み込みされ、
  // 画面で編集した元メモが失われてしまうため、依存に含めずrefで現在値だけを渡す。
  const outputLanguageRef = useRef(outputLanguage);
  useEffect(() => {
    outputLanguageRef.current = outputLanguage;
  }, [outputLanguage]);

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
    if (!turnstileSiteKey || turnstileWidgetIdRef.current) return;
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
  }, [turnstileSiteKey, source]);

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
          source === "heritage"
            ? "世界遺産パスポートの記録を読み込めませんでした。同じドメインの /heritage で保存した記録があるか確認してください。"
            : "人生体験マップの記録を読み込めませんでした。ブラウザの保存機能が使える状態か確認してください。"
        )
      )
      .finally(() => setLoading(false));
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

  const mappedCount = useMemo(
    () => filteredEntries.filter((entry) => resolveEntryLatLng(entry)).length,
    [filteredEntries]
  );
  const aiVerificationReady = Boolean(turnstileSiteKey && turnstileToken && sessionId);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(emptyFilters);
  const handlePrint = () => window.print();

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
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SHIORI_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setDraftMessage("下書きをこのブラウザに保存しました。");
    } catch {
      setDraftMessage("下書きを保存できませんでした。写真が多い場合はブラウザ容量を超えている可能性があります。");
    }
  };

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(SHIORI_DRAFT_STORAGE_KEY);
      if (!raw) {
        setDraftMessage("保存済みの下書きはありません。");
        return;
      }
      const draft = JSON.parse(raw) as Partial<ShioriDraft>;
      setSource(draft.source === "photo" || draft.source === "lifemap" || draft.source === "heritage" ? draft.source : "photo");
      setEntries(Array.isArray(draft.entries) ? draft.entries : []);
      setFilters(draft.filters || emptyFilters);
      setShioriTitle(draft.shioriTitle || "");
      setTravelerName(draft.travelerName || "");
      setTone(draft.tone || "warm");
      setOutputLanguage(isOutputLanguage(draft.outputLanguage) ? draft.outputLanguage : "ja");
      setGeneratedSummary(draft.generatedSummary || "");
      setGeneratedSpots(draft.generatedSpots || {});
      setSelectedEntryIds(null);
      setDraftMessage("下書きを復元しました。");
    } catch {
      setDraftMessage("下書きを復元できませんでした。");
    }
  };

  const handleDeleteDraft = () => {
    try {
      localStorage.removeItem(SHIORI_DRAFT_STORAGE_KEY);
      setDraftMessage("下書きを削除しました。");
    } catch {
      setDraftMessage("下書きを削除できませんでした。");
    }
  };

  const handleSocialImageDownload = async () => {
    if (filteredEntries.length === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const firstImage = filteredEntries.find((entry) => entry.imageDataUrl || entry.thumbnailDataUrl);

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

    const sampleBrightness = () => {
      try {
        const sample = ctx.getImageData(0, 440, canvas.width, 190).data;
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

    const bottomShade = ctx.createLinearGradient(0, 440, 0, canvas.height);
    bottomShade.addColorStop(0, "rgba(0, 0, 0, 0)");
    bottomShade.addColorStop(0.28, `rgba(0, 0, 0, ${upperAlpha})`);
    bottomShade.addColorStop(0.58, `rgba(0, 0, 0, ${midAlpha})`);
    bottomShade.addColorStop(1, `rgba(0, 0, 0, ${bottomAlpha})`);
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, 440, canvas.width, 190);

    const range = formatRange(filteredEntries, outputLanguage);
    const title = shioriTitle || tripTitle(range, outputLanguage);
    const summary =
      generatedSummary ||
      Object.values(generatedSpots).find((spot) => spot.caption?.trim())?.caption ||
      filteredEntries.find((entry) => entry.memo?.trim())?.memo ||
      "";

    const fitLines = (value: string, maxWidth: number, maxLines: number) => {
      const source = value.replace(/\s+/g, " ").trim();
      if (!source) return [];
      const lines: string[] = [];
      let current = "";
      for (const char of source) {
        const next = current + char;
        if (ctx.measureText(next).width <= maxWidth || !current) {
          current = next;
        } else {
          lines.push(current);
          current = char;
          if (lines.length === maxLines) break;
        }
      }
      if (lines.length < maxLines && current) lines.push(current);
      if (lines.length > 0 && lines.length === maxLines && source.length > lines.join("").length) {
        let last = lines[lines.length - 1];
        while (last.length > 1 && ctx.measureText(`${last}...`).width > maxWidth) {
          last = last.slice(0, -1);
        }
        lines[lines.length - 1] = `${last}...`;
      }
      return lines.length ? lines : [source];
    };

    let titleFont = 38;
    let titleLines: string[] = [];
    do {
      ctx.font = `700 ${titleFont}px ${FONT_STACK}`;
      titleLines = fitLines(title, 900, 2);
      if (titleLines.length < 2 || titleFont <= 32) break;
      const joinedLength = titleLines.join("").replace(/\.\.\.$/, "").length;
      if (joinedLength >= title.length) break;
      titleFont -= 2;
    } while (titleFont >= 32);

    ctx.font = `400 22px ${FONT_STACK}`;
    const bodyLines = fitLines(summary, 760, 2);
    const titleLineHeight = Math.round(titleFont * 1.2);
    const bodyLineHeight = 33;
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
      ctx.font = `400 22px ${FONT_STACK}`;
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

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${safeDownloadName(title, outputLanguage)}${uiLabel(outputLanguage, "coverFileSuffix")}.png`;
    link.click();
  };


  const handleSocialPostCopy = async () => {
    if (filteredEntries.length === 0) return;
    const range = formatRange(filteredEntries, outputLanguage);
    const title = shioriTitle || tripTitle(range, outputLanguage);
    const body =
      generatedSummary ||
      Object.values(generatedSpots).find((spot) => spot.caption?.trim())?.caption ||
      filteredEntries.find((entry) => entry.memo?.trim())?.memo ||
      "";
    const places = [...new Set(filteredEntries.map((entry) => getDisplayPlace(entry, outputLanguage)).filter(Boolean))].slice(0, 3);
    const tags = ["#AI旅行記メーカー", "#AITravelJournal", "#旅行記", ...places.map((place) => `#${place.replace(/\s+/g, "")}`)];
    const postText = [title, body, tags.join(" ")].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(postText);
      setDraftMessage(uiMessage(outputLanguage, "copied"));
    } catch {
      setDraftMessage(uiMessage(outputLanguage, "copyFailed"));
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
    const generated = buildTemplateTexts(filteredEntries, shioriTitle, travelerName, customCatLabels, outputLanguage);
    applyGeneratedTexts(generated.summary, generated.spots);
    setAiError(null);
  };

  const handleAiGeneration = async () => {
    if (filteredEntries.length === 0) return;
    if (!aiVerificationReady) {
      setAiError("AI生成の認証確認が完了していません。しばらく待ってから再度お試しください。");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const payload = buildAiPayload(filteredEntries, shioriTitle, travelerName, tone, customCatLabels, outputLanguage);
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
      };
      if (!response.ok) {
        throw new Error(data.error || "文章生成に失敗しました");
      }
      const fallback = buildTemplateTexts(filteredEntries, shioriTitle, travelerName, customCatLabels, outputLanguage);
      const nextSpots = { ...fallback.spots };
      for (const spot of data.spots || []) {
        if (!spot.id) continue;
        nextSpots[spot.id] = {
          title: spot.title || nextSpots[spot.id]?.title || "思い出の場所",
          caption: spot.caption || nextSpots[spot.id]?.caption || "",
        };
      }
      applyGeneratedTexts(data.summary || fallback.summary, nextSpots);
      if (data.fallback) {
        setAiError(uiMessage(outputLanguage, "aiFallback"));
      }
    } catch (error) {
      const generated = buildTemplateTexts(filteredEntries, shioriTitle, travelerName, customCatLabels, outputLanguage);
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
          setPhotoError("HEIC写真はこのブラウザで直接表示できない場合があります。表示できない場合はiPhone側でJPEGとして共有してからお試しください。");
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
        setPhotoError("取り込める写真がありませんでした。JPEG / PNG / WebP 形式をお試しください。");
      }
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "写真の取り込みに失敗しました");
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

        {(source === "lifemap" || source === "photo" || source === "heritage") && (
          <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-4 items-start">
            <aside className="space-y-4 lg:sticky lg:top-[84px]">
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
                      placeholder={tripTitle(formatRange(filteredEntries, outputLanguage), outputLanguage)}
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
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                    {turnstileSiteKey ? (
                      <>
                        <div ref={turnstileContainerRef} className="min-h-[65px]" />
                        {!turnstileToken && turnstileStatus === "loading" && (
                          <p className="text-xs text-slate-500 leading-relaxed">
                            自動送信対策を読み込んでいます。数秒お待ちください。
                          </p>
                        )}
                        {turnstileStatus === "error" && (
                          <p className="text-xs text-amber-700 leading-relaxed">
                            自動送信対策を読み込めませんでした。ページを再読み込みしてください。改善しない場合は、Cloudflare Turnstileのドメイン設定をご確認ください。
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-amber-700 leading-relaxed">
                        AI生成の不正利用対策が未設定です。Cloudflare Turnstile のサイトキーを設定するとAI生成を使えます。
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAiGeneration}
                    disabled={filteredEntries.length === 0 || aiLoading || !aiVerificationReady}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiLoading ? uiLabel(outputLanguage, "generating") : uiLabel(outputLanguage, "generateAi")}
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    AIは、読み込んだ各記録の「場所・都道府県・日付・タグ・元メモ」と、タイトル・記録者名・文体・出力言語などの設定だけをもとに旅行記を作ります。写真そのもの、下の編集済み文章、SNS/PDF出力内容はAIに送りません。
                  </p>
                  <button
                    type="button"
                    onClick={handleTemplateGeneration}
                    disabled={filteredEntries.length === 0}
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
                    onClick={handleSocialPostCopy}
                    disabled={filteredEntries.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    {uiLabel(outputLanguage, "copyPost")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSocialImageDownload}
                    disabled={filteredEntries.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-rose-900 hover:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {uiLabel(outputLanguage, "saveImage")}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={filteredEntries.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-600 border border-slate-200 text-sm font-bold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {uiLabel(outputLanguage, "savePdf")}
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    この画面ではSNS投稿文とブログ用アイキャッチ画像の作成を中心にしています。PDF保存は補助機能として、A4 1枚で手元に残したい場合に使えます。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      下書き保存
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      下書き復元
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteDraft}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-red-100 text-xs font-bold transition-all"
                    >
                      下書き削除
                    </button>
                  </div>
                  {draftMessage && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
                      {draftMessage}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    下書きはこのブラウザだけに保存されます。写真入口の下書きは画像も含むため、枚数が多い場合は保存できないことがあります。
                  </p>
                </div>
              </section>

              <section className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                <h2 className="font-bold text-base">読み込んだ記録</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <div className="text-lg font-bold">{entries.length}</div>
                    <div className="text-[11px] text-slate-500">全記録</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <div className="text-lg font-bold">{filteredEntries.length}</div>
                    <div className="text-[11px] text-slate-500">旅行記に使う記録</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                    <div className="text-lg font-bold">{mappedCount}</div>
                    <div className="text-[11px] text-slate-500">地図</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                  旅行記に使う期間: {formatRange(filteredEntries, outputLanguage)}
                </p>
              </section>
            </aside>

            <section className="space-y-4 min-w-0">
              {loading && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 text-center text-slate-500">
                  人生体験マップの記録を読み込んでいます...
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
                  <h2 className="mt-3 text-lg font-bold">まだ記録がありません</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {source === "photo"
                      ? "写真を選択すると、ここに旅行記の記録として表示されます。"
                      : source === "heritage"
                      ? "世界遺産パスポートの写真・訪問日・メモを読み込んで、ここに旅行記の記録として表示します。"
                      : "人生体験マップの写真・場所・日付・メモを読み込んで、ここに旅行記の記録として表示します。"}
                  </p>
                  {source === "photo" ? (
                    <label className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white text-sm font-bold transition-all cursor-pointer">
                      写真を選択する
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
                      {source === "heritage" ? "世界遺産パスポートで記録する" : "人生体験マップで記録する"}
                    </Link>
                  )}
                </div>
              )}

              {!loading && entries.length > 0 && filteredEntries.length === 0 && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 text-center">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <h2 className="mt-3 text-lg font-bold">条件に合う記録がありません</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    日付・訪問地域・旅のタグの条件を広げると表示される可能性があります。
                  </p>
                </div>
              )}

              {filteredEntries.length > 0 && (
                <>
                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-400">プレビュー</p>
                        <h2 className="text-xl font-bold text-slate-800">
                          {shioriTitle || tripTitle(formatRange(filteredEntries, outputLanguage), outputLanguage)}
                        </h2>
                      </div>
                      <p className="text-sm text-slate-500">
                        {filteredEntries.length}件の記録を時系列で表示中
                      </p>
                    </div>
                  </div>

                  <div className="h-[360px] lg:h-[460px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                    <ShioriMap entries={filteredEntries} />
                  </div>

                  <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <h2 className="font-bold text-base">旅行記文章</h2>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      上で選ばれている記録の元メモから旅行記を作ります。ここから下は生成後の編集欄です。編集した文章はSNS投稿文やアイキャッチ画像、必要に応じてPDFにも使われます。
                    </p>
                    <label className="mt-4 block">
                      <span className="text-xs font-bold text-slate-500 mb-1 block">旅行記本文（AI生成後に編集）</span>
                      <textarea
                        value={generatedSummary}
                        onChange={(e) => setGeneratedSummary(e.target.value)}
                        placeholder="AIが元メモから作った旅行記本文がここに入ります。必要に応じて書き直せます。"
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm leading-relaxed focus:outline-none focus:border-slate-400"
                      />
                    </label>
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
                          />
                          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                            <label className="block">
                              <span className="text-xs font-bold text-slate-500 mb-1 block">スポット見出し（AI生成後に編集）</span>
                              <input
                                type="text"
                                value={generated?.title || getDisplayPlace(entry, outputLanguage)}
                                onChange={(e) => updateSpotText(entry.id, { title: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                              />
                            </label>
                            <label className="mt-3 block">
                              <span className="text-xs font-bold text-slate-500 mb-1 block">スポット別文章（AI生成後に編集）</span>
                              <textarea
                                value={generated?.caption || ""}
                                onChange={(e) => updateSpotText(entry.id, { caption: e.target.value })}
                                placeholder="AIが元メモから作ったスポット別文章が入ります。ここを編集しても、再生成するまではAIの入力にはなりません。"
                                rows={3}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm leading-relaxed focus:outline-none focus:border-slate-400"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {(source === "lifemap" || source === "photo" || source === "heritage") && filteredEntries.length > 0 && (
        <ShioriPrintDocument
          entries={filteredEntries}
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




































