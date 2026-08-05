"use client";

import type { LifeMapCategory, LifeMapEntry } from "@/types/lifemap";
import {
  CUSTOM_CAT_VALUES,
  getCategory,
} from "@/lib/lifemap/categories";

function getCategoryLabel(
  category: LifeMapCategory,
  customLabels: Record<string, string>
): string {
  if ((CUSTOM_CAT_VALUES as readonly string[]).includes(category) && customLabels[category]) {
    return customLabels[category];
  }
  return getCategory(category).label;
}

function getDisplayPlace(entry: LifeMapEntry): string {
  return entry.locationName || entry.prefecture || "場所未設定";
}

function formatRange(entries: LifeMapEntry[]): string {
  if (entries.length === 0) return "範囲未選択";
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0]?.date;
  const last = sorted[sorted.length - 1]?.date;
  return first === last ? first : `${first} - ${last}`;
}

type OutputLanguage = "ja" | "en" | "zh-CN" | "fr" | "ko" | "zh-TW" | "de";

function langText(language: OutputLanguage, key: "brand" | "tripSuffix" | "traveler" | "created" | "noPhoto" | "repPhoto" | "singleFallback" | "noteFallback" | "entryFallback"): string {
  const texts: Record<OutputLanguage, Record<typeof key, string>> = {
    ja: {
      brand: "AI旅行記メーカー",
      tripSuffix: "の旅",
      traveler: "旅行者",
      created: "作成日",
      noPhoto: "写真なし",
      repPhoto: "旅の代表写真",
      singleFallback: "この旅で残しておきたい記録です。",
      noteFallback: "この旅で見た場所や感じたことを、あとから1枚で見返せる旅行記として残します。",
      entryFallback: "この場所での記録です。",
    },
    en: {
      brand: "AI Travel Journal Maker",
      tripSuffix: "Trip",
      traveler: "Traveler",
      created: "Created",
      noPhoto: "No photo",
      repPhoto: "Representative trip photo",
      singleFallback: "A memory kept from this trip.",
      noteFallback: "I gathered this trip into a one-page record so it can be revisited at a glance.",
      entryFallback: "A memory kept from this stop.",
    },
    "zh-CN": {
      brand: "AI旅行记生成器",
      tripSuffix: "的旅行",
      traveler: "旅行者",
      created: "创建日",
      noPhoto: "无照片",
      repPhoto: "旅行代表照片",
      singleFallback: "这是这段旅程中想要留下的记录。",
      noteFallback: "把旅途中看到的地方和感受整理成一页，方便以后回看。",
      entryFallback: "这是在这个地点留下的记录。",
    },
    fr: {
      brand: "Générateur de carnet de voyage IA",
      tripSuffix: "Voyage",
      traveler: "Voyageur",
      created: "Créé le",
      noPhoto: "Aucune photo",
      repPhoto: "Photo principale du voyage",
      singleFallback: "Un souvenir à garder de ce voyage.",
      noteFallback: "Ce voyage est rassemblé sur une page pour pouvoir le relire facilement.",
      entryFallback: "Un souvenir gardé de cette étape.",
    },
    ko: {
      brand: "AI 여행기 메이커",
      tripSuffix: "여행",
      traveler: "여행자",
      created: "작성일",
      noPhoto: "사진 없음",
      repPhoto: "여행 대표 사진",
      singleFallback: "이 여행에서 남겨 두고 싶은 기록입니다.",
      noteFallback: "이 여행에서 본 장소와 느낀 점을 한 장으로 다시 볼 수 있게 정리합니다.",
      entryFallback: "이 장소에서 남긴 기록입니다.",
    },
    "zh-TW": {
      brand: "AI旅行記產生器",
      tripSuffix: "的旅行",
      traveler: "旅行者",
      created: "建立日",
      noPhoto: "無照片",
      repPhoto: "旅行代表照片",
      singleFallback: "這是這段旅程中想要留下的紀錄。",
      noteFallback: "把旅途中看到的地方和感受整理成一頁，方便以後回看。",
      entryFallback: "這是在這個地點留下的紀錄。",
    },
    de: {
      brand: "KI-Reisebericht-Generator",
      tripSuffix: "Reise",
      traveler: "Reisende",
      created: "Erstellt",
      noPhoto: "Kein Foto",
      repPhoto: "Repräsentatives Reisefoto",
      singleFallback: "Eine Erinnerung, die ich von dieser Reise behalten möchte.",
      noteFallback: "Diese Reise wird auf einer Seite festgehalten, damit sie später schnell wieder betrachtet werden kann.",
      entryFallback: "Eine Erinnerung an diesen Ort.",
    },
  };
  return texts[language][key];
}

function tripTitle(range: string, language: OutputLanguage): string {
  switch (language) {
    case "en":
      return `${range} ${langText(language, "tripSuffix")}`;
    case "fr":
      return `${langText(language, "tripSuffix")} ${range}`;
    case "de":
      return `${langText(language, "tripSuffix")} ${range}`;
    default:
      return `${range} ${langText(language, "tripSuffix")}`;
  }
}

function hiddenEntryNote(language: OutputLanguage, count: number): string {
  switch (language) {
    case "en":
      return `${count} additional records are omitted to keep this PDF to one page.`;
    case "zh-CN":
      return `为了将PDF控制在1页内，另有${count}条记录已省略。`;
    case "fr":
      return `${count} enregistrements supplémentaires sont omis pour garder ce PDF sur une page.`;
    case "ko":
      return `PDF를 1장으로 정리하기 위해 추가 기록 ${count}건은 생략했습니다.`;
    case "zh-TW":
      return `為了將PDF控制在1頁內，另有${count}筆紀錄已省略。`;
    case "de":
      return `${count} weitere Einträge werden ausgelassen, damit das PDF auf eine Seite passt.`;
    case "ja":
    default:
      return `PDFを1枚に収めるため、追加の${count}件の記録は省略しています。`;
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function ShioriPrintDocument({
  entries,
  title,
  traveler,
  summary,
  generatedSpots,
  customLabels,
  language = "ja",
}: {
  entries: LifeMapEntry[];
  title: string;
  traveler: string;
  summary: string;
  generatedSpots: Record<string, { title: string; caption: string }>;
  customLabels: Record<string, string>;
  language?: OutputLanguage;
}) {
  const range = formatRange(entries);
  const locale = language === "en" ? "en-US" : language === "fr" ? "fr-FR" : language === "ko" ? "ko-KR" : language === "de" ? "de-DE" : language === "zh-CN" ? "zh-CN" : language === "zh-TW" ? "zh-TW" : "ja-JP";
  const photos = entries.filter((entry) => entry.imageDataUrl || entry.thumbnailDataUrl);
  const firstImage = photos[0];
  const compactPhotos = photos.length <= 4 ? photos.slice(0, 4) : photos.slice(0, 1);
  const compactEntries = entries.slice(0, 6);
  const hiddenEntryCount = Math.max(0, entries.length - compactEntries.length);
  const singleEntry = entries.length === 1 ? entries[0] : null;
  const singleGenerated = singleEntry ? generatedSpots[singleEntry.id] : null;
  const singleStory = singleEntry
    ? singleGenerated?.caption || summary || singleEntry.memo || langText(language, "singleFallback")
    : "";
  const photoNote = photos.length > 4
    ? language === "en"
      ? `This one-page PDF uses the first photo as the representative image. ${photos.length - 1} additional photos are omitted.`
      : language === "zh-CN"
      ? `为了将PDF控制在1页内，仅使用第1张照片作为代表照片。其余${photos.length - 1}张照片已省略。`
      : language === "fr"
      ? `Pour tenir sur une page, le PDF utilise la première photo comme image principale. ${photos.length - 1} photos supplémentaires sont omises.`
      : language === "ko"
      ? `PDF를 1장으로 정리하기 위해 첫 번째 사진만 대표 사진으로 사용합니다. 나머지 ${photos.length - 1}장은 생략했습니다.`
      : language === "zh-TW"
      ? `為了將PDF控制在1頁內，僅使用第1張照片作為代表照片。其餘${photos.length - 1}張照片已省略。`
      : language === "de"
      ? `Damit das PDF auf eine Seite passt, wird das erste Foto als Hauptbild verwendet. ${photos.length - 1} weitere Fotos werden ausgelassen.`
      : `PDFを1枚に収めるため、写真は1枚目を代表写真として掲載しています。2枚目以降の${photos.length - 1}枚は省略しています。`
    : photos.length > 1
    ? language === "en"
      ? "Photos are reduced and placed in a small strip to keep the PDF to one page."
      : language === "zh-CN"
      ? "为了将PDF控制在1页内，照片已缩小后排列。"
      : language === "fr"
      ? "Les photos sont réduites pour garder le PDF sur une seule page."
      : language === "ko"
      ? "PDF를 1장으로 정리하기 위해 사진을 축소해 배치합니다."
      : language === "zh-TW"
      ? "為了將PDF控制在1頁內，照片已縮小後排列。"
      : language === "de"
      ? "Die Fotos werden verkleinert, damit das PDF auf eine Seite passt."
      : "PDFを1枚に収めるため、写真は縮小して掲載しています。"
    : "";

  return (
    <section className="shiori-print-document bg-white text-slate-900">
      <div className="shiori-print-sheet">
        <div className="shiori-print-hero">
          <div className="shiori-print-hero-text">
            <p className="shiori-print-kicker">{langText(language, "brand")}</p>
            <h1>{title || tripTitle(range, language)}</h1>
            <p>{range}</p>
            {traveler && <p>{langText(language, "traveler")}: {traveler}</p>}
          </div>
          <div className="shiori-print-hero-image">
            {firstImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstImage.imageDataUrl || firstImage.thumbnailDataUrl}
                alt={title || langText(language, "repPhoto")}
              />
            ) : (
              <span>{langText(language, "noPhoto")}</span>
            )}
          </div>
        </div>

        <div className="shiori-print-meta-line">
          <span>{range}</span>
          <span>{langText(language, "created")}: {new Date().toLocaleDateString(locale)}</span>
        </div>

        {!singleEntry && (
          <div className="shiori-print-note">
            {summary || langText(language, "noteFallback")}
          </div>
        )}
        {compactPhotos.length > 1 && (
          <div className="shiori-print-photo-strip">
            {compactPhotos.map((entry) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={entry.id} src={entry.thumbnailDataUrl || entry.imageDataUrl} alt={getDisplayPlace(entry)} />
            ))}
          </div>
        )}

        {photoNote && <p className="shiori-print-photo-note">{photoNote}</p>}

        {singleEntry ? (
          <article className="shiori-print-single-story">
            <div className="shiori-print-compact-meta">
              <span>{singleEntry.date}</span>
              <span>{getCategoryLabel(singleEntry.category, customLabels)}</span>
              {singleEntry.prefecture && <span>{singleEntry.prefecture}</span>}
            </div>
            <h2>{singleGenerated?.title || getDisplayPlace(singleEntry)}</h2>
            <p>{truncateText(singleStory, 260)}</p>
          </article>
        ) : (
          <div className="shiori-print-compact-timeline">
            {compactEntries.map((entry, index) => {
              const categoryLabel = getCategoryLabel(entry.category, customLabels);
              const generated = generatedSpots[entry.id];
              const place = generated?.title || getDisplayPlace(entry);
              const caption = generated?.caption || entry.memo || langText(language, "entryFallback");
              return (
                <article key={entry.id} className="shiori-print-compact-entry">
                  <div className="shiori-print-compact-number">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <div className="shiori-print-compact-meta">
                      <span>{entry.date}</span>
                      <span>{categoryLabel}</span>
                      {entry.prefecture && <span>{entry.prefecture}</span>}
                    </div>
                    <h2>{place}</h2>
                    <p>{truncateText(caption, 95)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {hiddenEntryCount > 0 && (
          <p className="shiori-print-hidden-note">
            {hiddenEntryNote(language, hiddenEntryCount)}
          </p>
        )}
      </div>
    </section>
  );
}










