"use client";

import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { LifeMapEntry, LifeMapCategory } from "@/types/lifemap";
import { CATEGORIES, getCategory } from "@/lib/lifemap/categories";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import LifeMapEntryCard from "./LifeMapEntryCard";

// 県別一覧。都道府県ごとの記録件数を表示し、選択するとその県の記録を表示。
// カテゴリでの絞り込みも可能。
export default function PrefectureSummary({
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
  const [selected, setSelected] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<LifeMapCategory | "all">("all");

  // 都道府県ごとの件数（未登録は「未設定」にまとめる）
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const key = e.prefecture || t("prefecture.noEntries");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries, t]);

  const filtered = useMemo(() => {
    if (!selected) return [];
    return entries.filter((e) => {
      const key = e.prefecture || t("prefecture.noEntries");
      if (key !== selected) return false;
      if (catFilter !== "all" && e.category !== catFilter) return false;
      return true;
    });
  }, [entries, selected, catFilter, t]);

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-[#8A8172] py-10">
        {t("prefecture.noEntries")}
      </p>
    );
  }

  // 県の記録一覧表示
  if (selected) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 text-sm text-[#4A443B] hover:text-[#2B2721] font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("prefecture.backLink")}
        </button>

        <h3 className="font-bold text-base text-[#2B2721]">
          {selected}
          <span className="text-sm text-[#A79E8C] font-normal ml-2">
            {t("prefecture.countTemplate", { count: filtered.length })}
          </span>
        </h3>

        {/* カテゴリ絞り込み */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCatFilter("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              catFilter === "all"
                ? "bg-[#2B2721] text-white"
                : "bg-[#F6F1E8] text-[#6B6357] hover:bg-[#F1EADA]"
            }`}
          >
            {t("prefecture.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCatFilter(c.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                catFilter === c.value
                  ? "bg-[#2B2721] text-white"
                  : "bg-[#F6F1E8] text-[#6B6357] hover:bg-[#F1EADA]"
              }`}
            >
              {c.emoji} {t(`categories.${c.value}`)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-[#8A8172] py-6">
            {t("prefecture.noFiltered")}
          </p>
        ) : (
          filtered.map((entry) => (
            <LifeMapEntryCard
              key={entry.id}
              entry={entry}
              onShowOnMap={onShowOnMap}
              onDelete={onDelete}
              onEdit={onEdit}
              selected={selectedIds?.has(entry.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>
    );
  }

  // 都道府県別の件数グリッド
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {counts.map(([name, count]) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            setSelected(name);
            setCatFilter("all");
          }}
          className="flex items-center justify-between px-3 py-3 rounded-xl bg-white border border-[#EEE7DA] shadow-[0_4px_22px_rgba(43,39,33,.05)] hover:border-[#C9BEA6] transition-all text-left"
        >
          <span className="text-sm font-medium text-[#4A443B] truncate">
            {name}
          </span>
          <span className="text-xs font-bold text-white bg-[#1C7A66] rounded-full px-2 py-0.5 shrink-0 ml-2">
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ピン色凡例（カテゴリ）を表示する補助コンポーネント
export function CategoryLegend() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const cat = getCategory(c.value);
        return (
          <span
            key={c.value}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6B6357] bg-[#F6F1E8] border border-[#EDE5D6] rounded-full px-2.5 py-1"
          >
            {cat.emoji} {t(`categories.${c.value}`)}
          </span>
        );
      })}
    </div>
  );
}
