import type { ExifLocationResult } from "@/types/lifemap";

// 写真のEXIFからGPS（緯度経度）と撮影日を読み取る自作パーサー。
// 外部ライブラリ・外部通信は一切使わず、ブラウザ内（File→ArrayBuffer）で完結する。
// 対応: JPEG（Exif APP1 / TIFF構造）。HEIC/PNG等GPS非対応形式は hasGps:false を返す。

// IFDエントリの値を読み出すための簡易リーダ
interface TiffReader {
  view: DataView;
  tiffStart: number;
  littleEndian: boolean;
}

// rational（分子/分母）を読む
function readRational(
  r: TiffReader,
  offset: number
): number {
  const num = r.view.getUint32(offset, r.littleEndian);
  const den = r.view.getUint32(offset + 4, r.littleEndian);
  return den === 0 ? 0 : num / den;
}

// 1つのIFDを読み、{tag: 値オフセット情報}のマップを返す
interface IfdEntry {
  type: number;
  count: number;
  valueOffset: number; // 値そのもの(<=4byte)、または値へのオフセット
}

function readIfd(
  r: TiffReader,
  ifdOffset: number
): Map<number, IfdEntry> {
  const entries = new Map<number, IfdEntry>();
  const { view, tiffStart, littleEndian } = r;
  const base = tiffStart + ifdOffset;
  if (base + 2 > view.byteLength) return entries;
  const count = view.getUint16(base, littleEndian);
  for (let i = 0; i < count; i++) {
    const entryOffset = base + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const valCount = view.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = entryOffset + 8; // 値領域の先頭（4byte）
    entries.set(tag, { type, count: valCount, valueOffset });
  }
  return entries;
}

// type=2(ASCII)文字列を読む
function readAscii(r: TiffReader, entry: IfdEntry): string {
  const { view, tiffStart, littleEndian } = r;
  let dataOffset = entry.valueOffset;
  if (entry.count > 4) {
    dataOffset = tiffStart + view.getUint32(entry.valueOffset, littleEndian);
  }
  let s = "";
  for (let i = 0; i < entry.count; i++) {
    const c = view.getUint8(dataOffset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

// GPS座標（度・分・秒の3つのrational）を10進度に変換
function readGpsCoord(r: TiffReader, entry: IfdEntry): number | undefined {
  const { view, tiffStart, littleEndian } = r;
  // 3つのrational = 24byte。必ずオフセット参照。
  if (entry.count < 3) return undefined;
  const dataOffset = tiffStart + view.getUint32(entry.valueOffset, littleEndian);
  const deg = readRational(r, dataOffset);
  const min = readRational(r, dataOffset + 8);
  const sec = readRational(r, dataOffset + 16);
  return deg + min / 60 + sec / 3600;
}

// "YYYY:MM:DD HH:MM:SS" → "YYYY-MM-DD"
function parseExifDate(raw: string): string | undefined {
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})/);
  if (!m) return undefined;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function parseExifBuffer(buffer: ArrayBuffer): ExifLocationResult {
  const view = new DataView(buffer);
  const result: ExifLocationResult = { hasGps: false };

  // JPEG SOIチェック
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return result;
  }

  // APP1(Exif)マーカーを探す
  let offset = 2;
  let app1Offset = -1;
  while (offset < view.byteLength - 1) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) break; // マーカー異常
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1) {
      app1Offset = offset + 4;
      break;
    }
    offset += 2 + size;
  }
  if (app1Offset < 0) return result;

  // "Exif\0\0"
  const exifHeader =
    view.getUint32(app1Offset) === 0x45786966 &&
    view.getUint16(app1Offset + 4) === 0x0000;
  if (!exifHeader) return result;

  const tiffStart = app1Offset + 6;
  if (tiffStart + 8 > view.byteLength) return result;

  // バイトオーダー
  const byteOrder = view.getUint16(tiffStart);
  const littleEndian = byteOrder === 0x4949; // "II"
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return result;

  const r: TiffReader = { view, tiffStart, littleEndian };

  // IFD0オフセット
  const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
  const ifd0 = readIfd(r, ifd0Offset);

  // 撮影日: まず ExifSubIFD(0x8769) → DateTimeOriginal(0x9003)。無ければ IFD0 DateTime(0x0132)
  const subIfdEntry = ifd0.get(0x8769);
  if (subIfdEntry) {
    const subOffset = view.getUint32(subIfdEntry.valueOffset, littleEndian);
    const subIfd = readIfd(r, subOffset);
    const dto = subIfd.get(0x9003) ?? subIfd.get(0x9004);
    if (dto && dto.type === 2) {
      result.takenAt = parseExifDate(readAscii(r, dto));
    }
  }
  if (!result.takenAt) {
    const dt = ifd0.get(0x0132);
    if (dt && dt.type === 2) {
      result.takenAt = parseExifDate(readAscii(r, dt));
    }
  }

  // GPS IFD(0x8825)
  const gpsEntry = ifd0.get(0x8825);
  if (gpsEntry) {
    const gpsOffset = view.getUint32(gpsEntry.valueOffset, littleEndian);
    const gps = readIfd(r, gpsOffset);

    const latRefEntry = gps.get(0x0001);
    const latEntry = gps.get(0x0002);
    const lngRefEntry = gps.get(0x0003);
    const lngEntry = gps.get(0x0004);

    if (latEntry && lngEntry) {
      let lat = readGpsCoord(r, latEntry);
      let lng = readGpsCoord(r, lngEntry);
      if (lat != null && lng != null) {
        const latRef = latRefEntry ? readAscii(r, latRefEntry) : "N";
        const lngRef = lngRefEntry ? readAscii(r, lngRefEntry) : "E";
        if (latRef.toUpperCase().startsWith("S")) lat = -lat;
        if (lngRef.toUpperCase().startsWith("W")) lng = -lng;
        // 妥当性チェック
        if (
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180 &&
          !(lat === 0 && lng === 0)
        ) {
          result.lat = lat;
          result.lng = lng;
          result.hasGps = true;
        }
      }
    }
  }

  return result;
}

// 公開関数: Fileを受け取りEXIFのGPS・撮影日を返す
export async function extractExifLocation(
  file: File
): Promise<ExifLocationResult> {
  try {
    // JPEG以外は解析しない（無駄な読み込みを避ける）
    if (!/jpe?g/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
      return { hasGps: false };
    }
    // 先頭部分のみ読めば十分だが、EXIFが大きい場合に備え全体を読む
    const buffer = await file.arrayBuffer();
    return parseExifBuffer(buffer);
  } catch {
    // 解析失敗時もアプリは継続できるよう、安全な結果を返す
    return { hasGps: false };
  }
}
