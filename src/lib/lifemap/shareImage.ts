// 人生体験マップのシェア用画像生成（1200×630 / X投稿向け比率）。
//
// 重要な前提：
// - 描画はすべてブラウザ内の Canvas で完結し、外部サーバーへの送信は一切行わない。
// - 画像に含めるのは「件数」と「都道府県の塗り分け」だけ。
//   写真・メモ・地名・座標など個人が特定される情報は一切描画しない。
// - 既存の記録データ（IndexedDB）は読み取るだけで、書き換えない。

import type { LifeMapCategory, LifeMapEntry } from "@/types/lifemap";
import { CATEGORIES, getCategory } from "./categories";
import {
  PREFECTURE_TILES,
  TILE_COLS,
  TILE_ROWS,
  normalizePrefectureName,
} from "./japanTileMap";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const SITE_LABEL = "www.ai-drive-planner.com/life-map";
const SITE_URL = "https://www.ai-drive-planner.com/life-map";

// 配色（サイトのカラーパレットに合わせる）
const COLOR = {
  bgFrom: "#FDFBF6",
  bgTo: "#EFE6D4",
  ink: "#2B2721",
  inkSub: "#6B6357",
  inkMuted: "#8A8172",
  accent: "#1C7A66",
  accentSoft: "#DCEBE5",
  tileEmpty: "#FFFFFF",
  tileEmptyBorder: "#E2DAC8",
  tileEmptyText: "#C3BAA9",
  line: "#E4DCCC",
} as const;

const EMOJI_FALLBACK =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

/** Canvas に渡すフォントスタック。next/font の CSS 変数が取れれば先頭に足す。 */
export function buildFontStack(scope?: HTMLElement | null): string {
  let injected = "";
  try {
    const el = scope ?? document.body;
    injected = getComputedStyle(el).getPropertyValue("--font-lifemap").trim();
  } catch {
    injected = "";
  }
  const base =
    '"Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif';
  return `${injected ? `${injected}, ` : ""}${base}, ${EMOJI_FALLBACK}`;
}

export type ShareRange = "all" | "year";
export type ShareCardKind = "prefecture" | "stats";

export interface CategoryCount {
  value: LifeMapCategory;
  count: number;
}

export interface ShareStats {
  /** 対象期間の総記録数 */
  total: number;
  /** 対象期間に記録がある47都道府県の正式名称 */
  visitedPrefectures: Set<string>;
  /** 件数の多い順のカテゴリ内訳（0件は含まない） */
  categories: CategoryCount[];
  /** 対象期間で最も古い記録日（YYYY-MM-DD）。記録がなければ null */
  firstDate: string | null;
}

/** 記録から画像用の統計を作る。日付が不正な記録は期間フィルタで除外しない（全期間扱い）。 */
export function computeShareStats(
  entries: LifeMapEntry[],
  range: ShareRange,
  now: Date = new Date()
): ShareStats {
  const yearPrefix = `${now.getFullYear()}-`;
  const target =
    range === "year"
      ? entries.filter((e) => (e.date ?? "").startsWith(yearPrefix))
      : entries;

  const visitedPrefectures = new Set<string>();
  const counts = new Map<LifeMapCategory, number>();
  let firstDate: string | null = null;

  for (const entry of target) {
    const pref = normalizePrefectureName(entry.prefecture);
    if (pref) visitedPrefectures.add(pref);

    const cat = entry.category;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);

    if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "")) {
      if (!firstDate || entry.date < firstDate) firstDate = entry.date;
    }
  }

  // CATEGORIES の並びを二次キーにして、同数でも描画順がぶれないようにする
  const order = new Map(CATEGORIES.map((c, i) => [c.value, i]));
  const categories = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        (order.get(a.value) ?? 99) - (order.get(b.value) ?? 99)
    );

  return { total: target.length, visitedPrefectures, categories, firstDate };
}

/** 記録開始日からの経過を年・月に分解する */
export function elapsedSince(
  firstDate: string | null,
  now: Date = new Date()
): { years: number; months: number } | null {
  if (!firstDate) return null;
  const [y, m, d] = firstDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  let months =
    (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < d ? 1 : 0);
  if (months < 0) months = 0;
  return { years: Math.floor(months / 12), months: months % 12 };
}

// ---------------------------------------------------------------------------
// 描画ヘルパー
// ---------------------------------------------------------------------------

type Translate = (key: string, vars?: Record<string, string | number>) => string;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  // Safari 15 以前に roundRect がないため自前で描く
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/** 指定幅に収まるまでフォントサイズを落として1行で描く */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "left"
): number {
  let current = size;
  ctx.font = `${weight} ${current}px ${font}`;
  while (ctx.measureText(text).width > maxWidth && current > 10) {
    current -= 1;
    ctx.font = `${weight} ${current}px ${font}`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
  return ctx.measureText(text).width;
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bg.addColorStop(0, COLOR.bgFrom);
  bg.addColorStop(1, COLOR.bgTo);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 右上の淡い円（既存シェア画像と同じトーンの装飾）
  ctx.fillStyle = "rgba(28,122,102,0.06)";
  ctx.beginPath();
  ctx.arc(1090, 70, 230, 0, Math.PI * 2);
  ctx.fill();
}

function drawChrome(
  ctx: CanvasRenderingContext2D,
  font: string,
  brandLabel: string
) {
  ctx.textBaseline = "alphabetic";
  fitText(ctx, `🗺️ ${brandLabel}`, 56, 66, 620, 26, 700, font, COLOR.inkSub);
  fitText(
    ctx,
    SITE_LABEL,
    CARD_WIDTH - 56,
    CARD_HEIGHT - 34,
    620,
    21,
    600,
    font,
    COLOR.inkMuted,
    "right"
  );
}

/** 「記録開始 2023-04-12 ・ 1年3か月」形式の1行を組み立てる */
function buildSinceLine(
  t: Translate,
  firstDate: string | null,
  now: Date
): string | null {
  if (!firstDate) return null;
  const elapsed = elapsedSince(firstDate, now);
  const label = `${t("share.cardSinceLabel")} ${firstDate}`;
  if (!elapsed) return label;
  const duration =
    elapsed.years > 0
      ? t("share.cardDurationYM", { years: elapsed.years, months: elapsed.months })
      : t("share.cardDurationM", { months: elapsed.months });
  return `${label}  ・  ${duration}`;
}

// ---------------------------------------------------------------------------
// 1. 都道府県制覇マップ
// ---------------------------------------------------------------------------

export interface RenderOptions {
  stats: ShareStats;
  range: ShareRange;
  t: Translate;
  /** 日本語以外はタイル内をローマ字略号にする */
  useRoman: boolean;
  font: string;
  now?: Date;
}

export function renderPrefectureCard(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): void {
  const { stats, t, useRoman, font, now = new Date() } = options;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  drawBackground(ctx);
  drawChrome(ctx, font, t("app.title"));

  // --- 左：タイル地図 ---
  const cell = 40;
  const pad = 3;
  const originX = 56;
  const originY = 104;

  ctx.textBaseline = "middle";
  for (const tile of PREFECTURE_TILES) {
    const x = originX + tile.col * cell;
    const y = originY + tile.row * cell;
    const visited = stats.visitedPrefectures.has(tile.name);

    roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, 7);
    if (visited) {
      ctx.fillStyle = COLOR.accent;
      ctx.fill();
    } else {
      ctx.fillStyle = COLOR.tileEmpty;
      ctx.fill();
      ctx.strokeStyle = COLOR.tileEmptyBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const label = useRoman ? tile.roman : tile.short;
    const size = label.length >= 3 ? 11 : 13;
    ctx.font = `700 ${size}px ${font}`;
    ctx.fillStyle = visited ? "#FFFFFF" : COLOR.tileEmptyText;
    ctx.textAlign = "center";
    ctx.fillText(label, x + cell / 2, y + cell / 2 + 1);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // --- 右：数値パネル ---
  const panelX = originX + TILE_COLS * cell + 60;
  const panelRight = CARD_WIDTH - 56;
  const panelWidth = panelRight - panelX;

  fitText(
    ctx,
    t("share.cardMapTitle"),
    panelX,
    158,
    panelWidth,
    32,
    800,
    font,
    COLOR.ink
  );

  const visitedCount = stats.visitedPrefectures.size;
  ctx.font = `800 108px ${font}`;
  ctx.fillStyle = COLOR.accent;
  const bigText = String(visitedCount);
  ctx.fillText(bigText, panelX, 296);
  const bigWidth = ctx.measureText(bigText).width;
  ctx.font = `700 42px ${font}`;
  ctx.fillStyle = COLOR.inkSub;
  ctx.fillText(` / ${PREFECTURE_TILES.length}`, panelX + bigWidth, 296);

  fitText(
    ctx,
    t("share.cardPrefLabel"),
    panelX,
    340,
    panelWidth,
    25,
    600,
    font,
    COLOR.inkSub
  );

  // 進捗バー
  const barY = 372;
  const barH = 12;
  roundRect(ctx, panelX, barY, panelWidth, barH, barH / 2);
  ctx.fillStyle = COLOR.accentSoft;
  ctx.fill();
  const ratio = visitedCount / PREFECTURE_TILES.length;
  if (ratio > 0) {
    roundRect(ctx, panelX, barY, Math.max(barH, panelWidth * ratio), barH, barH / 2);
    ctx.fillStyle = COLOR.accent;
    ctx.fill();
  }

  // 区切り線
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX, 424);
  ctx.lineTo(panelRight, 424);
  ctx.stroke();

  // 総記録数
  fitText(ctx, t("share.cardTotalLabel"), panelX, 466, panelWidth * 0.55, 21, 600, font, COLOR.inkMuted);
  fitText(
    ctx,
    t("share.cardCountValue", { count: stats.total }),
    panelRight,
    468,
    panelWidth * 0.4,
    28,
    800,
    font,
    COLOR.ink,
    "right"
  );

  // 記録期間
  const since = buildSinceLine(t, stats.firstDate, now);
  if (since) {
    fitText(ctx, since, panelX, 516, panelWidth, 20, 500, font, COLOR.inkSub);
  }
}

// ---------------------------------------------------------------------------
// 2. 体験統計カード
// ---------------------------------------------------------------------------

const STATS_MAX_ROWS = 5;

export function renderStatsCard(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): void {
  const { stats, range, t, font, now = new Date() } = options;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  drawBackground(ctx);
  drawChrome(ctx, font, t("app.title"));

  ctx.textBaseline = "alphabetic";

  // タイトル + 期間バッジ
  const titleWidth = fitText(
    ctx,
    t("share.cardStatsTitle"),
    56,
    142,
    620,
    40,
    800,
    font,
    COLOR.ink
  );
  const badgeText = t(range === "year" ? "share.cardRangeYear" : "share.cardRangeAll");
  ctx.font = `700 20px ${font}`;
  const badgeW = ctx.measureText(badgeText).width + 30;
  roundRect(ctx, 56 + titleWidth + 20, 116, badgeW, 34, 17);
  ctx.fillStyle = COLOR.accentSoft;
  ctx.fill();
  ctx.fillStyle = COLOR.accent;
  ctx.textAlign = "center";
  ctx.fillText(badgeText, 56 + titleWidth + 20 + badgeW / 2, 139);
  ctx.textAlign = "left";

  // 総記録数
  fitText(ctx, t("share.cardTotalLabel"), 56, 190, 400, 21, 600, font, COLOR.inkMuted);
  ctx.font = `800 84px ${font}`;
  ctx.fillStyle = COLOR.accent;
  const totalText = String(stats.total);
  ctx.fillText(totalText, 56, 268);
  const totalWidth = ctx.measureText(totalText).width;
  ctx.font = `700 28px ${font}`;
  ctx.fillStyle = COLOR.inkSub;
  ctx.fillText(t("share.cardCountUnit"), 56 + totalWidth + 10, 268);

  // 都道府県数（日本の記録がある場合のみ）
  if (stats.visitedPrefectures.size > 0) {
    fitText(ctx, t("share.cardPrefLabel"), 640, 190, 500, 21, 600, font, COLOR.inkMuted);
    ctx.font = `800 84px ${font}`;
    ctx.fillStyle = COLOR.ink;
    const prefText = String(stats.visitedPrefectures.size);
    ctx.fillText(prefText, 640, 268);
    const prefWidth = ctx.measureText(prefText).width;
    ctx.font = `700 28px ${font}`;
    ctx.fillStyle = COLOR.inkSub;
    ctx.fillText(` / ${PREFECTURE_TILES.length}`, 640 + prefWidth + 6, 268);
  }

  // 記録期間
  const since = buildSinceLine(t, stats.firstDate, now);
  if (since) {
    fitText(ctx, since, 56, 310, 1088, 21, 500, font, COLOR.inkSub);
  }

  // 区切り線
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 340);
  ctx.lineTo(CARD_WIDTH - 56, 340);
  ctx.stroke();

  fitText(ctx, t("share.cardCategoryLabel"), 56, 376, 400, 20, 600, font, COLOR.inkMuted);

  // カテゴリ内訳（2列 × 5行）
  const shown = stats.categories.slice(0, STATS_MAX_ROWS * 2);
  const hidden = stats.categories.slice(STATS_MAX_ROWS * 2);
  const colWidth = 520;
  const rowHeight = 38;
  const startY = 414;

  shown.forEach((item, index) => {
    const col = Math.floor(index / STATS_MAX_ROWS);
    const row = index % STATS_MAX_ROWS;
    const x = 56 + col * (colWidth + 48);
    const y = startY + row * rowHeight;
    const def = getCategory(item.value);

    // 絵文字（合成絵文字が分解される環境でも崩れないよう実測幅で送る）
    ctx.font = `400 26px ${font}`;
    ctx.fillStyle = COLOR.ink;
    ctx.fillText(def.emoji, x, y);
    const emojiWidth = Math.min(ctx.measureText(def.emoji).width, 46);

    // カテゴリ色のドット
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x + emojiWidth + 16, y - 9, 5, 0, Math.PI * 2);
    ctx.fill();

    const labelX = x + emojiWidth + 32;
    const countText = t("share.cardCountValue", { count: item.count });
    ctx.font = `700 24px ${font}`;
    const countWidth = ctx.measureText(countText).width;

    fitText(
      ctx,
      t(`categories.${item.value}`),
      labelX,
      y,
      colWidth - (labelX - x) - countWidth - 20,
      24,
      600,
      font,
      COLOR.inkSub
    );
    fitText(ctx, countText, x + colWidth, y, 160, 24, 800, font, COLOR.ink, "right");
  });

  if (hidden.length > 0) {
    const rest = hidden.reduce((sum, item) => sum + item.count, 0);
    // 最終行の下。カード外に出ないよう下端で止め、右下のURLとは左右に分ける
    const overflowY = Math.min(
      startY + STATS_MAX_ROWS * rowHeight + 30,
      CARD_HEIGHT - 34
    );
    fitText(
      ctx,
      t("share.cardOthers", { count: rest }),
      56,
      overflowY,
      520,
      20,
      500,
      font,
      COLOR.inkMuted
    );
  }
}

// ---------------------------------------------------------------------------
// 出力（保存 / シェア）
// ---------------------------------------------------------------------------

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("failed to encode image"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari が読み終わる前に revoke すると保存に失敗するため遅延させる
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Web Share API で画像そのものを共有できる端末か */
export function canShareImageFile(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function" || typeof File === "undefined") {
    return false;
  }
  try {
    const probe = new File([new Blob([""], { type: "image/png" })], "probe.png", {
      type: "image/png",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** 画像付きでシェアシートを開く。ユーザーが閉じた場合も成功扱いにする。 */
export async function shareImageFile(
  blob: Blob,
  filename: string,
  text: string
): Promise<boolean> {
  if (!canShareImageFile()) return false;
  const file = new File([blob], filename, { type: "image/png" });
  try {
    await navigator.share({ files: [file], text, url: SITE_URL });
    return true;
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return true;
    return false;
  }
}

export function buildLifeMapXShareUrl(text: string, hashtags: string): string {
  const params = new URLSearchParams({ text, url: SITE_URL });
  const tags = hashtags
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
  if (tags.length > 0) params.set("hashtags", tags.join(","));
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export const SHARE_FILENAME: Record<ShareCardKind, string> = {
  prefecture: "life-map-prefectures.png",
  stats: "life-map-stats.png",
};
