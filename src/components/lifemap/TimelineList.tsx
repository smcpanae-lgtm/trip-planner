"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import LifeMapEntryCard from "./LifeMapEntryCard";

// 時系列一覧（新しい順／古い順の切替）
export default function TimelineList({
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
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const sorted = useMemo(() => {
    const arr = [...entries];
    arr.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return order === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [entries, order]);

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400 py-10">
        {t("timeline.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOrder("desc")}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            order === "desc"
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ArrowDownWideNarrow className="w-3.5 h-3.5" />
          {t("timeline.newest")}
        </button>
        <button
          type="button"
          onClick={() => setOrder("asc")}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            order === "asc"
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ArrowUpWideNarrow className="w-3.5 h-3.5" />
          {t("timeline.oldest")}
        </button>
      </div>

      {sorted.map((entry) => (
        <LifeMapEntryCard
          key={entry.id}
          entry={entry}
          onShowOnMap={onShowOnMap}
          onDelete={onDelete}
          selected={selectedIds?.has(entry.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
