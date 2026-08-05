"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Download, Share2, ImageDown, ShieldCheck } from "lucide-react";
import type { LifeMapEntry } from "@/types/lifemap";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SHARE_FILENAME,
  buildFontStack,
  buildLifeMapXShareUrl,
  canShareImageFile,
  canvasToBlob,
  computeShareStats,
  downloadBlob,
  renderPrefectureCard,
  renderStatsCard,
  shareImageFile,
  type ShareCardKind,
  type ShareRange,
} from "@/lib/lifemap/shareImage";

// シェア用画像の生成モーダル。
// 生成から保存・シェアまでブラウザ内で完結し、外部サーバーへの送信は行わない。
// 画像に描くのは件数と都道府県の塗り分けのみで、写真・メモ・地名は一切含めない。
export default function ShareImageModal({
  entries,
  onClose,
}: {
  entries: LifeMapEntry[];
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [kind, setKind] = useState<ShareCardKind>("prefecture");
  const [range, setRange] = useState<ShareRange>("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webShareAvailable, setWebShareAvailable] = useState(false);

  useEffect(() => {
    setWebShareAvailable(canShareImageFile());
  }, []);

  const stats = useMemo(
    () => computeShareStats(entries, range),
    [entries, range]
  );

  // 日本国内の記録がない期間では都道府県マップを出さない（海外在住ユーザー向け）
  const japanAvailable = stats.visitedPrefectures.size > 0;
  const effectiveKind: ShareCardKind = japanAvailable ? kind : "stats";

  // 画像を生成してプレビュー用の Blob URL を作る
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setMessage(null);

    const draw = async () => {
      try {
        if (typeof document !== "undefined" && document.fonts?.ready) {
          await document.fonts.ready;
        }
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const options = {
          stats,
          range,
          t,
          useRoman: lang !== "ja",
          font: buildFontStack(rootRef.current),
        };
        if (effectiveKind === "prefecture") renderPrefectureCard(canvas, options);
        else renderStatsCard(canvas, options);

        const blob = await canvasToBlob(canvas);
        if (cancelled) return;
        blobRef.current = blob;
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = URL.createObjectURL(blob);
        setPreviewUrl(previewUrlRef.current);
      } catch {
        if (!cancelled) setError(t("share.saveError"));
      }
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [stats, range, effectiveKind, lang, t]);

  // モーダルを閉じるときに Blob URL を解放する
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const postText = t("share.postText", { count: stats.total });

  const handleSave = useCallback(() => {
    const blob = blobRef.current;
    if (!blob) {
      setError(t("share.saveError"));
      return;
    }
    try {
      downloadBlob(blob, SHARE_FILENAME[effectiveKind]);
      setError(null);
      setMessage(t("share.savedMsg"));
    } catch {
      setError(t("share.saveError"));
    }
  }, [effectiveKind, t]);

  const handleWebShare = useCallback(async () => {
    const blob = blobRef.current;
    if (!blob) {
      setError(t("share.saveError"));
      return;
    }
    const ok = await shareImageFile(blob, SHARE_FILENAME[effectiveKind], postText);
    if (!ok) {
      // シェアシートが使えなかった場合は保存にフォールバック
      downloadBlob(blob, SHARE_FILENAME[effectiveKind]);
      setMessage(t("share.savedMsg"));
    }
  }, [effectiveKind, postText, t]);

  const handleXShare = useCallback(() => {
    const url = buildLifeMapXShareUrl(postText, t("share.hashtags"));
    window.open(url, "_blank", "noopener,noreferrer");
  }, [postText, t]);

  const tabClass = (active: boolean) =>
    `px-3 py-2 rounded-[10px] text-xs font-bold transition-all ${
      active
        ? "bg-[#2B2721] text-white"
        : "bg-[#F6F1E8] text-[#6B6357] hover:bg-[#F1EADA]"
    }`;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={rootRef}
        className="bg-white rounded-[18px] w-full max-w-[720px] my-auto shadow-[0_16px_34px_rgba(43,39,33,.24)] border border-[#EEE7DA]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-[#EEE7DA]">
          <h2 className="font-extrabold text-base text-[#2B2721]">
            {t("share.modalTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("share.closeAria")}
            className="p-1.5 rounded-lg text-[#8A8172] hover:bg-[#F6F1E8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-[22px] py-5 space-y-4">
          {/* 種類・期間の切り替え */}
          <div className="flex flex-wrap items-center gap-2">
            {japanAvailable && (
              <>
                <button
                  type="button"
                  onClick={() => setKind("prefecture")}
                  className={tabClass(effectiveKind === "prefecture")}
                >
                  {t("share.tabMap")}
                </button>
                <button
                  type="button"
                  onClick={() => setKind("stats")}
                  className={tabClass(effectiveKind === "stats")}
                >
                  {t("share.tabStats")}
                </button>
                <span className="w-px h-5 bg-[#E4DCCC] mx-1" />
              </>
            )}
            <button
              type="button"
              onClick={() => setRange("all")}
              className={tabClass(range === "all")}
            >
              {t("share.rangeAll")}
            </button>
            <button
              type="button"
              onClick={() => setRange("year")}
              className={tabClass(range === "year")}
            >
              {t("share.rangeYear")}
            </button>
          </div>

          {!japanAvailable && (
            <p className="text-[11.5px] leading-relaxed text-[#8A8172]">
              {t("share.noJapanNote")}
            </p>
          )}

          {/* プレビュー */}
          <div
            className="rounded-[14px] overflow-hidden border border-[#EEE7DA] bg-[#F6F1E8]"
            style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}
          >
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={t("share.modalTitle")}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[#8A8172]">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {t("share.privacyNote")}
          </p>

          {/* 操作 */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!previewUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[11px] bg-[#F6F1E8] hover:bg-[#F1EADA] disabled:opacity-50 border border-[#E4DCCC] text-[#4A443B] text-[12.5px] font-semibold transition-all"
            >
              <Download className="w-4 h-4" />
              {t("share.saveBtn")}
            </button>
            {webShareAvailable && (
              <button
                type="button"
                onClick={handleWebShare}
                disabled={!previewUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[11px] bg-[#F6F1E8] hover:bg-[#F1EADA] disabled:opacity-50 border border-[#E4DCCC] text-[#4A443B] text-[12.5px] font-semibold transition-all"
              >
                <ImageDown className="w-4 h-4" />
                {t("share.shareImageBtn")}
              </button>
            )}
            <button
              type="button"
              onClick={handleXShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[11px] bg-[#2B2721] hover:opacity-90 text-white text-[12.5px] font-semibold transition-all"
            >
              <Share2 className="w-4 h-4" />
              {t("share.xBtn")}
            </button>
          </div>

          <p className="text-[11.5px] leading-relaxed text-[#8A8172]">
            {t("share.longPressHint")}
          </p>

          {message && <p className="text-xs text-[#1C7A66]">{message}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>

      {/* 描画用（画面には出さない） */}
      <canvas ref={canvasRef} width={CARD_WIDTH} height={CARD_HEIGHT} className="hidden" />
    </div>
  );
}
