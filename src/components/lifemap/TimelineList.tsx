"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, BookOpen } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import { buildTripJournalLink, groupEntriesIntoTrips, type TripGroup } from "@/lib/lifemap/tripGroups";
import { hasSavedPhoto } from "@/lib/lifemap/entryPhoto";
import { MAX_AI_SPOTS } from "@/lib/shiori/tripSelection";
import LifeMapEntryCard from "./LifeMapEntryCard";

/** 一覧に並べる単位。group が null のときは日付未入力の記録（旅行にまとめられない）。 */
type Section = {
  key: string;
  group: TripGroup | null;
  entries: LifeMapEntry[];
};

/**
 * 旅行グループの見出しに「この旅行を旅行記にする」を出すか。
 *
 * 記録が1件で写真もあるグループでは、そのカードの「この記録を旅行記にする」と渡すidも遷移先も同一になり、
 * 同じ動作のボタンが上下に並ぶだけなので出さない。
 * 写真が無い1件はカード側のボタンが押せないため、こちらが唯一の入口になる（出す）。
 * 写真の判定はカード側と必ず同じ関数を使うこと。ズレると両方消える。
 */
function showTripLink(group: TripGroup): boolean {
  return !(group.entries.length === 1 && hasSavedPhoto(group.entries[0]));
}

// 時系列一覧（新しい順／古い順の切替）。記録は旅行ごとに区切って並べる。
export default function TimelineList({
  entries,
  onShowOnMap,
  onDelete,
  onEdit,
}: {
  entries: LifeMapEntry[];
  onShowOnMap: (entry: LifeMapEntry) => void;
  onDelete: (entry: LifeMapEntry) => void;
  onEdit?: (entry: LifeMapEntry) => void;
}) {
  const { t, lang } = useTranslation();
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const sections = useMemo<Section[]>(() => {
    const groups = groupEntriesIntoTrips(entries);
    const tripSections: Section[] = groups.map((group) => ({
      // 日付だけでは同日に始まる旅行を区別できないため、先頭の記録のidを混ぜる。
      key: `${group.from}_${group.entries[0].id}`,
      group,
      entries: order === "desc" ? [...group.entries].reverse() : group.entries,
    }));
    if (order === "desc") tripSections.reverse();

    // グループ化から外れた記録（日付未入力）も必ず一覧に出す。
    // 日付順に並べたときの位置に合わせ、古い順なら先頭、新しい順なら末尾に置く。
    const undated = entries.filter((entry) => !entry.date);
    if (undated.length === 0) return tripSections;
    const undatedSection: Section = { key: "undated", group: null, entries: undated };
    return order === "desc" ? [...tripSections, undatedSection] : [undatedSection, ...tripSections];
  }, [entries, order]);

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-[#8A8172] py-10">
        {t("timeline.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setOrder("desc")}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E4DCCC] text-[11.5px] font-semibold transition-all ${
            order === "desc"
              ? "bg-[#2B2721] text-white"
              : "bg-white text-[#8A8172]"
          }`}
        >
          <ArrowDownWideNarrow className="w-3.5 h-3.5" />
          {t("timeline.newest")}
        </button>
        <button
          type="button"
          onClick={() => setOrder("asc")}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E4DCCC] text-[11.5px] font-semibold transition-all ${
            order === "asc"
              ? "bg-[#2B2721] text-white"
              : "bg-white text-[#8A8172]"
          }`}
        >
          <ArrowUpWideNarrow className="w-3.5 h-3.5" />
          {t("timeline.oldest")}
        </button>
      </div>

      {sections.map((section, index) => (
        <div
          key={section.key}
          className={`space-y-3 ${index === 0 ? "" : "pt-3 border-t border-[#EEE7DA]"}`}
        >
          {section.group && (
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap px-0.5">
              <span className="text-[11px] text-[#A79E8C]">
                {section.group.from === section.group.to
                  ? section.group.from
                  : `${section.group.from} – ${section.group.to}`}
              </span>
              {showTripLink(section.group) && (
                <Link
                  href={buildTripJournalLink(section.group, lang)}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#1C7A66] hover:underline"
                >
                  <BookOpen className="w-3 h-3" />
                  {t("timeline.tripJournalBtn")}
                  {` (${t("prefecture.countTemplate", { count: section.group.entries.length })})`}
                </Link>
              )}
              {section.group.entries.length > MAX_AI_SPOTS && (
                <span className="w-full text-[10.5px] text-[#A79E8C]">
                  {t("timeline.tripLimitNote", { max: MAX_AI_SPOTS })}
                </span>
              )}
            </div>
          )}

          {section.entries.map((entry) => (
            <LifeMapEntryCard
              key={entry.id}
              entry={entry}
              onShowOnMap={onShowOnMap}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
