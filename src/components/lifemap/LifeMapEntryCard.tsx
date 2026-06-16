"use client";

import { MapPinned, Trash2, CheckCircle2, Circle } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { getCategory } from "@/lib/lifemap/categories";
import { resolveEntryLatLng, isJapanCoord } from "@/lib/lifemap/plannerLink";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import DrivePlannerLinkButton from "./DrivePlannerLinkButton";

// 一覧で使う記録カード（写真サムネ・日付・カテゴリ・都道府県・メモ・各種ボタン）
export default function LifeMapEntryCard({
  entry,
  onShowOnMap,
  onDelete,
  selected,
  onToggleSelect,
}: {
  entry: LifeMapEntry;
  onShowOnMap: (entry: LifeMapEntry) => void;
  onDelete: (entry: LifeMapEntry) => void;
  selected?: boolean;
  onToggleSelect?: (entry: LifeMapEntry) => void;
}) {
  const { t } = useTranslation();
  const cat = getCategory(entry.category);
  const pos = resolveEntryLatLng(entry);
  const hasMapLocation = pos !== null;
  const canSelect = onToggleSelect && pos && isJapanCoord(pos.lat, pos.lng);

  const precisionNote =
    entry.locationPrecision === "approximate"
      ? t("card.approxLocation")
      : entry.locationPrecision === "prefecture"
      ? t("card.prefectureOnly")
      : null;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden flex transition-all ${
        selected ? "border-slate-500 ring-2 ring-slate-300" : "border-slate-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.thumbnailDataUrl}
        alt={t(`categories.${entry.category}`)}
        className="w-24 h-24 sm:w-28 sm:h-28 object-cover shrink-0 bg-slate-50"
      />
      <div className="flex-1 min-w-0 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: cat.color }}
          >
            {cat.emoji} {t(`categories.${entry.category}`)}
          </span>
          <span className="text-xs text-slate-500">{entry.date}</span>
          {entry.prefecture && (
            <span className="text-xs text-slate-400">{entry.prefecture}</span>
          )}
        </div>

        {(entry.locationName || precisionNote) && (
          <div className="mt-1 text-xs text-slate-400 truncate">
            {entry.locationName}
            {entry.locationName && precisionNote ? "・" : ""}
            {precisionNote}
          </div>
        )}

        {entry.memo && (
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{entry.memo}</p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {hasMapLocation && (
            <button
              type="button"
              onClick={() => onShowOnMap(entry)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all"
            >
              <MapPinned className="w-3.5 h-3.5" />
              {t("card.showOnMap")}
            </button>
          )}
          <DrivePlannerLinkButton entry={entry} compact />
          {canSelect && (
            <button
              type="button"
              onClick={() => onToggleSelect!(entry)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                selected
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {selected ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 text-xs font-medium transition-all ml-auto"
            aria-label={t("card.deleteAria")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
