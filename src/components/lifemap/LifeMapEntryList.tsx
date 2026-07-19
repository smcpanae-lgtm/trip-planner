"use client";

import { useState } from "react";
import { Building2, Clock } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import PrefectureSummary from "./PrefectureSummary";
import TimelineList from "./TimelineList";

// 一覧エリア。県別／時系列をタブで切り替える。
export default function LifeMapEntryList({
  entries,
  onShowOnMap,
  onDelete,
  onEdit,
  selectedIds,
  onToggleSelect,
}: {
  entries: LifeMapEntry[];
  onShowOnMap: (entry: LifeMapEntry) => void;
  onDelete: (entry: LifeMapEntry) => void;
  onEdit?: (entry: LifeMapEntry) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (entry: LifeMapEntry) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"prefecture" | "timeline">("timeline");

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 bg-[#F1ECE1] rounded-[13px] p-[5px]">
        <button
          type="button"
          onClick={() => setTab("timeline")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[9px] text-[12.5px] font-bold transition-all ${
            tab === "timeline"
              ? "bg-white text-[#2B2721] shadow-[0_1px_4px_rgba(43,39,33,.1)]"
              : "bg-transparent text-[#8A8172]"
          }`}
        >
          <Clock className="w-[15px] h-[15px]" />
          {t("list.timeline")}
        </button>
        <button
          type="button"
          onClick={() => setTab("prefecture")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[9px] text-[12.5px] font-bold transition-all ${
            tab === "prefecture"
              ? "bg-white text-[#2B2721] shadow-[0_1px_4px_rgba(43,39,33,.1)]"
              : "bg-transparent text-[#8A8172]"
          }`}
        >
          <Building2 className="w-[15px] h-[15px]" />
          {t("list.prefecture")}
        </button>
      </div>

      {tab === "timeline" ? (
        <TimelineList
          entries={entries}
          onShowOnMap={onShowOnMap}
          onDelete={onDelete}
          onEdit={onEdit}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <PrefectureSummary
          entries={entries}
          onShowOnMap={onShowOnMap}
          onDelete={onDelete}
          onEdit={onEdit}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      )}
    </div>
  );
}
