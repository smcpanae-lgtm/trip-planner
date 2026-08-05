const SITE_URL = "https://www.ai-drive-planner.com/";
const FONT_STACK =
  '"Hiragino Kaku Gothic ProN", "Noto Sans JP", "Meiryo", sans-serif';

export function buildSharePostText(from: string, to: string): string {
  return `AIに${from}→${to}のドライブプランを作ってもらいました🚗`;
}

export function buildXShareUrl(text: string, hashtags: string[] = ["ドライブ", "AIドライブプランナー"]): string {
  const params = new URLSearchParams({
    text,
    url: SITE_URL,
    hashtags: hashtags.join(","),
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function fitLines(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const source = value.replace(/\s+/g, " ").trim();
  if (!source) return [];
  const lines: string[] = [];
  let current = "";
  for (const char of source) {
    const next = current + char;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = char;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > 0 && lines.length === maxLines && source.length > lines.join("").length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}...`;
  }
  return lines.length ? lines : [source];
}

export interface PlanCardOptions {
  from: string;
  to: string;
  daysLabel: string; // e.g. "日帰り" / "1泊2日"
  spotNames: string[]; // up to a few destination names
}

export function generatePlanShareCard(options: PlanCardOptions): string {
  const { from, to, daysLabel, spotNames } = options;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の生成に失敗しました");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#1d4ed8");
  bg.addColorStop(1, "#0f172a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(1020, 120, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 22px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("🚗 AIドライブプランナー", 60, 90);

  ctx.font = `500 24px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(daysLabel, 60, 130);

  ctx.font = `800 58px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  const routeLine = `${from} → ${to}`;
  const routeLines = fitLines(ctx, routeLine, 1080, 2);
  routeLines.forEach((line, i) => {
    ctx.fillText(line, 60, 240 + i * 68);
  });

  const spotsY = 240 + routeLines.length * 68 + 50;
  if (spotNames.length > 0) {
    ctx.font = `500 26px ${FONT_STACK}`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const spotsText = `立ち寄り: ${spotNames.slice(0, 4).join(" / ")}`;
    const spotLines = fitLines(ctx, spotsText, 1080, 2);
    spotLines.forEach((line, i) => {
      ctx.fillText(line, 60, spotsY + i * 36);
    });
  }

  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "right";
  ctx.fillText("ai-drive-planner.com", canvas.width - 40, canvas.height - 36);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export interface AchievementCardOptions {
  brandLabel: string; // e.g. "人生体験マップ"
  headline: string; // e.g. "47都道府県中 12県 訪問"
  subline?: string; // e.g. "記録数 58件"
  accentFrom: string;
  accentTo: string;
  siteLabel: string; // e.g. "ai-drive-planner.com/life-map"
}

export function generateAchievementShareCard(options: AchievementCardOptions): string {
  const { brandLabel, headline, subline, accentFrom, accentTo, siteLabel } = options;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の生成に失敗しました");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, accentFrom);
  bg.addColorStop(1, accentTo);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(1020, 120, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `700 24px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(brandLabel, 60, 90);

  ctx.font = `800 60px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  const headlineLines = fitLines(ctx, headline, 1080, 2);
  headlineLines.forEach((line, i) => {
    ctx.fillText(line, 60, 260 + i * 72);
  });

  if (subline) {
    ctx.font = `500 30px ${FONT_STACK}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const sublineY = 260 + headlineLines.length * 72 + 46;
    ctx.fillText(subline, 60, sublineY);
  }

  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "right";
  ctx.fillText(siteLabel, canvas.width - 40, canvas.height - 36);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
