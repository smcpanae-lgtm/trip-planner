"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Play, Pause } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import type { LifeMapCategory } from "@/types/lifemap";
import { CATEGORIES, getCategory } from "@/lib/lifemap/categories";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";

type Period = "all" | "1y" | "2y" | "3y";
type CategoryFilter = LifeMapCategory | "all";

const SLIDE_SECONDS = 4;

export default function MemoryReplay({
  entries,
  onClose,
}: {
  entries: LifeMapEntry[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [animKey, setAnimKey] = useState(0);

  const periodOptions: { value: Period; label: string }[] = [
    { value: "all", label: t("replay.all") },
    { value: "1y", label: t("replay.period1y") },
    { value: "2y", label: t("replay.period2y") },
    { value: "3y", label: t("replay.period3y") },
  ];

  const filtered = useMemo(() => {
    if (!period) return [];
    let cutoff: Date | null = null;
    if (period !== "all") {
      const years = { "1y": 1, "2y": 2, "3y": 3 }[period];
      cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - years);
    }
    return entries
      .filter((e) => !cutoff || new Date(e.date) >= cutoff)
      .filter((e) => category === "all" || e.category === category)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, period, category]);

  // 期間・カテゴリが変わったら最初から再生
  useEffect(() => {
    setIndex(0);
    setAnimKey((k) => k + 1);
    setPlaying(true);
  }, [period, category]);

  // 一定時間ごとに次の写真へ
  useEffect(() => {
    if (!period || filtered.length === 0 || !playing) return;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % filtered.length);
      setAnimKey((k) => k + 1);
    }, SLIDE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [period, filtered, playing, index]);

  const current = filtered[index];

  const handleReset = () => {
    setPeriod(null);
    setCategory("all");
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-bold text-lg text-white">{t("replay.title")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-white hover:bg-white/10 transition-all"
          aria-label={t("replay.closeAria")}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {!period ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 overflow-y-auto py-4">
          {/* 期間選択 */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <p className="text-white text-sm">{t("replay.choosePeriod")}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリ絞り込み */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <p className="text-white/70 text-xs">{t("replay.chooseCategory")}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === "all"
                    ? "bg-white text-slate-800"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {t("replay.allCategories")}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === c.value
                      ? "bg-white text-slate-800"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {c.emoji} {t(`categories.${c.value}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-white text-sm">{t("replay.noEntries")}</p>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
          >
            {t("replay.changePeriodBtn")}
          </button>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-4">
          {current && (
            <div
              key={animKey}
              className="memory-slide flex flex-col items-center gap-3"
              style={{ animationPlayState: playing ? "running" : "paused" }}
            >
              <img
                src={current.imageDataUrl}
                alt=""
                className="max-h-[60vh] max-w-[80vw] rounded-lg shadow-2xl object-contain"
              />
              <div className="text-white text-center text-sm">
                <p className="font-bold">{current.date}</p>
                <p className="text-white/70">
                  {getCategory(current.category).emoji}{" "}
                  {t(`categories.${current.category}`)}
                  {current.prefecture ? ` ・ ${current.prefecture}` : ""}
                </p>
                {current.memo && (
                  <p className="mt-1 text-white/80 max-w-[60vw] truncate">
                    {current.memo}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              aria-label={playing ? t("replay.pauseAria") : t("replay.playAria")}
            >
              {playing ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <span className="text-white/60 text-xs">
              {index + 1} / {filtered.length}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-all"
            >
              {t("replay.changePeriod")}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes memory-slide-anim {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          20% {
            transform: translateX(0);
            opacity: 1;
          }
          80% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .memory-slide {
          animation: memory-slide-anim ${SLIDE_SECONDS}s linear;
        }
      `}</style>
    </div>
  );
}
