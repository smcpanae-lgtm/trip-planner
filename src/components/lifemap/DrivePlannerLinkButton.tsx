"use client";

import { Navigation } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import {
  buildPlannerLink,
  resolveEntryLatLng,
  isJapanCoord,
} from "@/lib/lifemap/plannerLink";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";

// 各記録から「この場所へ再訪プラン作成」リンクを生成するボタン（日本のみ表示）
export default function DrivePlannerLinkButton({
  entry,
  compact = false,
}: {
  entry: LifeMapEntry;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const pos = resolveEntryLatLng(entry);
  if (!pos || !isJapanCoord(pos.lat, pos.lng)) return null;

  return (
    <a
      href={buildPlannerLink(entry)}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold transition-all ${
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm w-full"
      }`}
    >
      <Navigation className="w-4 h-4" />
      {t("card.revisitLink")}
    </a>
  );
}
