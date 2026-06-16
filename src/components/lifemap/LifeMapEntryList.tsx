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
  selectedIds,
  onToggleSelect,
}: {
  entries: LifeMapEntry[];
  onShowOnMap: (entry: LifeMapEntry) => void;
  onDelete: (entry: LifeMapEntry) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (entry: LifeMapEntry) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"prefecture" | "timeline">("timeline");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setTab("timeline")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "timeline"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <Clock className="w-4 h-4" />
          {t("list.timeline")}
        </button>
        <button
          type="button"
          onClick={() => setTab("prefecture")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "prefecture"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t("list.prefecture")}
        </button>
      </div>

      {tab === "timeline" ? (
        <TimelineList
          entries={entries}
          onShowOnMap={onShowOnMap}
          onDelete={onDelete}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <PrefectureSummary
          entries={entries}
          onShowOnMap={onShowOnMap}
          onDelete={onDelete}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      )}
    </div>
  );
}
