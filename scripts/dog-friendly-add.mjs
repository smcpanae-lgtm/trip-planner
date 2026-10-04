#!/usr/bin/env node
/**
 * 犬連れモード: 管理人が犬連れで訪問したお店を src/data/dog-friendly-restaurants.json に登録する
 *
 * Google マップの URL（短いリンク https://maps.app.goo.gl/... も可）から店名と座標を取り出す。
 * 有料 API は使わない（短いリンクはリダイレクトをたどるだけ）。
 *
 * 使い方:
 *   npm run dog:add -- "<URL>" "<メモ>"
 *   npm run dog:add -- 2026-10 "<URL>" "<メモ>"   (先頭に訪問日。YYYY-MM または YYYY-MM-DD。省略可)
 *   npm run dog:add -- --file <path>   (1行1件。「[訪問日] URL 半角スペース メモ」。空行と # で始まる行は無視)
 *
 * 1件でも店名や座標が取れなければ、JSON は変更せずに終了コード 1 で止める。
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "..", "src", "data", "dog-friendly-restaurants.json");

const DATE_RE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;

/** 訪問日として正しい形（YYYY-MM または YYYY-MM-DD）か */
function isVisitDate(text) {
  const m = DATE_RE.exec(text);
  if (!m) return false;
  const month = Number(m[2]);
  const day = m[3] === undefined ? 1 : Number(m[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** 先頭が訪問日なら取り出す。無ければ訪問日は空文字 */
function splitDate(first, rest) {
  return isVisitDate(first) ? { visitedAt: first, args: rest } : { visitedAt: "", args: [first, ...rest] };
}

/** 引数から [{ url, note, visitedAt }] を作る */
async function readEntries(argv) {
  const fileIdx = argv.indexOf("--file");
  if (fileIdx >= 0) {
    const file = argv[fileIdx + 1];
    if (!file) throw new Error("--file の後にファイルのパスを指定してください");
    const text = await fs.readFile(file, "utf8");
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const tokens = line.split(/\s+/);
        const { visitedAt, args } = splitDate(tokens[0], tokens.slice(1));
        const [url, ...noteWords] = args;
        return { url, note: noteWords.join(" ").trim(), visitedAt };
      });
  }
  if (argv.length === 0) {
    throw new Error('使い方: npm run dog:add -- [訪問日] "<URL>" "<メモ>"  または  --file <path>');
  }
  const { visitedAt, args } = splitDate(argv[0], argv.slice(1));
  const [url, ...rest] = args;
  if (!url) {
    throw new Error("訪問日の後ろに URL を指定してください");
  }
  return [{ url, note: rest.join(" ").trim(), visitedAt }];
}

/** 短いリンクなどはリダイレクトをたどって元の URL にする */
async function resolveUrl(url) {
  if (/\/maps\/place\//.test(url)) return url;
  const res = await fetch(url, { redirect: "follow" });
  return res.url || url;
}

/** Google マップの URL から店名・座標・ID を取り出す */
function parseMapsUrl(url) {
  const nameMatch = url.match(/\/maps\/place\/([^/?#]+)/);
  if (!nameMatch) throw new Error("URL に /maps/place/<店名>/ が見つかりません");
  let name;
  try {
    name = decodeURIComponent(nameMatch[1].replace(/\+/g, " ")).trim();
  } catch {
    throw new Error("店名部分を読み取れません");
  }
  if (!name) throw new Error("店名が空です");

  const warnings = [];
  let lat;
  let lng;
  const exact = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (exact) {
    lat = Number(exact[1]);
    lng = Number(exact[2]);
  } else {
    const at = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (!at) throw new Error("座標（!3d/!4d または @緯度,経度）が見つかりません");
    lat = Number(at[1]);
    lng = Number(at[2]);
    warnings.push("お店の正確な座標が無いため、地図の表示位置（@の後ろ）を使いました");
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error("座標の値が不正です");
  }

  const idMatch = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
  const id = idMatch ? idMatch[1].toLowerCase() : `${name}@${lat.toFixed(5)},${lng.toFixed(5)}`;

  return { id, name, lat, lng, warnings };
}

async function main() {
  const entries = await readEntries(process.argv.slice(2));

  // 先に全件を読み取り、1件でも失敗したら JSON は変更しない
  const parsed = [];
  const errors = [];
  for (const { url, note, visitedAt } of entries) {
    try {
      const resolved = await resolveUrl(url);
      parsed.push({ ...parseMapsUrl(resolved), mapsUrl: url, note, visitedAt });
    } catch (e) {
      errors.push(`${url}\n    → ${e instanceof Error ? e.message : e}`);
    }
  }
  if (errors.length > 0) {
    console.error("読み取れなかった URL があるため、登録を中止しました（JSON は変更していません）:");
    for (const err of errors) console.error(`  - ${err}`);
    process.exitCode = 1;
    return;
  }

  const list = JSON.parse(await fs.readFile(dataPath, "utf8"));
  const results = [];
  for (const p of parsed) {
    const existing = list.find((r) => r.id === p.id);
    if (existing) {
      if (p.note) existing.note = p.note;
      if (p.visitedAt) existing.visitedAt = p.visitedAt;
      results.push({
        status: p.visitedAt ? "既に登録済み（メモと訪問日を更新）" : "既に登録済み（メモのみ更新）",
        item: existing,
        warnings: p.warnings,
      });
    } else {
      const item = {
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        mapsUrl: p.mapsUrl,
        note: p.note,
        visitedAt: p.visitedAt,
      };
      list.push(item);
      results.push({ status: "追加", item, warnings: p.warnings });
    }
  }
  await fs.writeFile(dataPath, JSON.stringify(list, null, 2) + "\n", "utf8");

  for (const { status, item, warnings } of results) {
    console.log(`[${status}] ${item.name}  (${item.lat}, ${item.lng})  メモ: ${item.note || "なし"}  訪問日: ${item.visitedAt || "未入力"}`);
    for (const w of warnings) console.log(`    ⚠ ${w}`);
  }
  console.log(`登録件数: ${list.length}件`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
