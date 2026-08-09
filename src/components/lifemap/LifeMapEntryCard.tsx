"use client";

import Link from "next/link";
import { MapPinned, Trash2, CheckCircle2, Circle, BookOpen, Pencil } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { getCategory } from "@/lib/lifemap/categories";
import { resolveEntryLatLng, isJapanCoord } from "@/lib/lifemap/plannerLink";
import { buildJournalLink } from "@/lib/lifemap/journalLink";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import DrivePlannerLinkButton from "./DrivePlannerLinkButton";

// 一覧で使う記録カード（写真サムネ・日付・カテゴリ・都道府県・メモ・各種ボタン）
export default function LifeMapEntryCard({
  entry,
  onShowOnMap,
  onDelete,
  onEdit,
  selected,
  onToggleSelect,
}: {
  entry: LifeMapEntry;
  onShowOnMap: (entry: LifeMapEntry) => void;
  onDelete: (entry: LifeMapEntry) => void;
  onEdit?: (entry: LifeMapEntry) => void;
  selected?: boolean;
  onToggleSelect?: (entry: LifeMapEntry) => void;
}) {
  const { t, lang } = useTranslation();
  const cat = getCategory(entry.category);
  const pos = resolveEntryLatLng(entry);
  const hasMapLocation = pos !== null;
  const canSelect = onToggleSelect && pos && isJapanCoord(pos.lat, pos.lng);
  const hasSavedPhoto = Boolean(entry.imageDataUrl || entry.thumbnailDataUrl);

  const precisionNote =
    entry.locationPrecision === "approximate"
      ? t("card.approxLocation")
      : entry.locationPrecision === "prefecture"
      ? t("card.prefectureOnly")
      : null;

  return (
    <div
      className={`bg-white rounded-xl border shadow-[0_4px_22px_rgba(43,39,33,.05)] overflow-hidden flex transition-all ${
        selected ? "border-[#1C7A66] ring-2 ring-[#CDE0DA]" : "border-[#EEE7DA]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.thumbnailDataUrl}
        alt={t(`categories.${entry.category}`)}
        className="w-24 h-24 sm:w-28 sm:h-28 object-cover shrink-0 bg-[#F6F1E8]"
      />
      <div className="flex-1 min-w-0 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: cat.color }}
          >
            {cat.emoji} {t(`categories.${entry.category}`)}
          </span>
          <span className="text-xs text-[#8A8172]">{entry.date}</span>
          {entry.prefecture && (
            <span className="text-xs text-[#A79E8C]">{entry.prefecture}</span>
          )}
        </div>

        {(entry.locationName || precisionNote) && (
          <div className="mt-1 text-xs text-[#A79E8C] truncate">
            {entry.locationName}
            {entry.locationName && precisionNote ? "・" : ""}
            {precisionNote}
          </div>
        )}

        {entry.memo && (
          <p className="mt-1 text-sm text-[#4A443B] line-clamp-2">{entry.memo}</p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {hasMapLocation && (
            <button
              type="button"
              onClick={() => onShowOnMap(entry)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F6F1E8] hover:bg-[#F1EADA] text-[#4A443B] text-xs font-medium transition-all"
            >
              <MapPinned className="w-3.5 h-3.5" />
              {t("card.showOnMap")}
            </button>
          )}
          <DrivePlannerLinkButton entry={entry} compact />
          {hasSavedPhoto ? (
            <Link
              href={buildJournalLink(lang, [entry.id])}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2B2721] hover:opacity-90 text-white text-xs font-medium transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              SNS投稿
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="写真を保存するとSNS投稿を作れます。"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F1ECE1] text-[#A79E8C] text-xs font-medium cursor-not-allowed"
            >
              <BookOpen className="w-3.5 h-3.5" />
              SNS投稿
            </button>
          )}
          {canSelect && (
            <button
              type="button"
              onClick={() => onToggleSelect!(entry)}
              title={t("drive.selectHint")}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                selected
                  ? "bg-[#1C7A66] text-white border-[#1C7A66]"
                  : "bg-white text-[#8A8172] border-[#E4DCCC] hover:border-[#C9BEA6]"
              }`}
            >
              {selected ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
              {selected ? t("card.selectedBtn") : t("card.selectBtn")}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F6F1E8] hover:bg-[#F1EADA] text-[#4A443B] text-xs font-medium transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("card.editBtn")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-[#A79E8C] hover:text-red-500 border border-[#E4DCCC] text-xs font-medium transition-all ml-auto"
            aria-label={t("card.deleteAria")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
