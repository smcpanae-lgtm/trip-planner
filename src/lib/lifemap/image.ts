// 画像圧縮（ブラウザ内・canvas使用）
// オリジナルは保存せず、表示用（長辺最大1600px）とサムネイル（長辺最大320px）を生成する。

const MAX_LONG_EDGE = 1600;
const THUMB_LONG_EDGE = 320;
const JPEG_QUALITY = 0.82;
const THUMB_QUALITY = 0.7;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

// 指定した長辺に収まるようにリサイズしてJPEG DataURLを返す
function drawResized(
  img: HTMLImageElement,
  maxLongEdge: number,
  quality: number
): string {
  const { width, height } = img;
  const longEdge = Math.max(width, height);
  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の処理に失敗しました");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function compressImage(file: File): Promise<{
  imageDataUrl: string;
  thumbnailDataUrl: string;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const imageDataUrl = drawResized(img, MAX_LONG_EDGE, JPEG_QUALITY);
    const thumbnailDataUrl = drawResized(img, THUMB_LONG_EDGE, THUMB_QUALITY);
    return { imageDataUrl, thumbnailDataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
