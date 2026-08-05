#!/usr/bin/env node
/**
 * 世界遺産パスポート: ユネスコ登録資産と当サイト資産の差分チェック
 *
 * 月初のルーチン業務用。UNESCO DataHub (whc001) を取得し、
 * public/heritage 配下の画像マニフェスト・日本語名テーブル・データ版数と突き合わせる。
 *
 * 使い方:
 *   node scripts/heritage-unesco-check.mjs
 *   node scripts/heritage-unesco-check.mjs --json   (レポートJSONのみ標準出力)
 *
 * 終了コード: 0 = 差分なし / 1 = 要対応の差分あり / 2 = 取得や読み込みの失敗
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const heritageDir = path.join(repoRoot, "public", "heritage");
const assetsDir = path.join(heritageDir, "assets", "heritage");
const manifestPath = path.join(assetsDir, "manifest.json");
const appJsPath = path.join(heritageDir, "app.js");
const reportsDir = path.join(__dirname, "reports");

const UNESCO_ENDPOINT =
  "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records";
const PAGE_SIZE = 100;
const jsonOnly = process.argv.includes("--json");

function log(...args) {
  if (!jsonOnly) console.log(...args);
}

async function fetchUnescoSites() {
  const all = [];
  let offset = 0;
  let total = Infinity;

  while (all.length < total) {
    const url = `${UNESCO_ENDPOINT}?limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`UNESCO DataHub 取得失敗: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    total = payload.total_count;
    if (!Array.isArray(payload.results) || payload.results.length === 0) break;
    all.push(...payload.results);
    offset += PAGE_SIZE;
  }

  if (all.length !== total) {
    throw new Error(`取得件数が不一致: 期待 ${total} 件 / 実際 ${all.length} 件`);
  }
  return all;
}

function toId(record) {
  return String(record.id_no ?? "").trim();
}

function statesOf(record) {
  const names = Array.isArray(record.states_names)
    ? record.states_names
    : [record.states_names];
  return names.map((name) => String(name ?? "").trim()).filter(Boolean);
}

async function readJapanNameIds() {
  const source = await fs.readFile(appJsPath, "utf8");
  const start = source.indexOf("const japanHeritageNamesJa");
  if (start === -1) return { ids: new Set(), found: false };
  const end = source.indexOf("\n};", start);
  const body = source.slice(start, end === -1 ? undefined : end);
  const ids = new Set([...body.matchAll(/"(\d+)"\s*:/g)].map((m) => m[1]));
  return { ids, found: true };
}

async function readSiteDataVersion() {
  const source = await fs.readFile(appJsPath, "utf8");
  const match = source.match(/const SITE_DATA_VERSION\s*=\s*"([^"]+)"/);
  return match ? match[1] : null;
}

async function listAssetFiles() {
  const entries = await fs.readdir(assetsDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name === "manifest.json") continue;
    files.push(entry.name);
  }
  return files;
}

async function fileSizes(files) {
  const sizes = new Map();
  for (const name of files) {
    const stat = await fs.stat(path.join(assetsDir, name));
    sizes.set(name, stat.size);
  }
  return sizes;
}

function isInDanger(record) {
  // whc001 の danger は "True" / "False" の文字列で返る
  return String(record.danger ?? "").toLowerCase() === "true";
}

function formatSite(record) {
  return {
    unescoId: toId(record),
    nameEn: String(record.name_en ?? "").trim(),
    states: statesOf(record).join(" / "),
    category: String(record.category ?? "").trim(),
    year: record.date_inscribed ?? null,
    danger: isInDanger(record),
    dangerSince: record.danger_list ?? null,
    officialUrl: `https://whc.unesco.org/en/list/${toId(record)}`
  };
}

async function readPreviousReport() {
  try {
    return JSON.parse(await fs.readFile(path.join(reportsDir, "latest.json"), "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const previous = await readPreviousReport();
  log("UNESCO DataHub (whc001) を取得中...");
  const records = await fetchUnescoSites();
  const unescoById = new Map(records.map((r) => [toId(r), r]));
  log(`  取得完了: ${records.length} 件`);

  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw.replace(/^﻿/, ""));
  const manifestImages = manifest.images ?? {};
  const manifestIds = new Set(Object.keys(manifestImages));

  const { ids: japanNameIds, found: japanTableFound } = await readJapanNameIds();
  const siteDataVersion = await readSiteDataVersion();

  const assetFiles = await listAssetFiles();
  const assetFileSet = new Set(assetFiles);
  const sizes = await fileSizes(assetFiles);
  const totalBytes = [...sizes.values()].reduce((sum, n) => sum + n, 0);
  const totalMb = Number((totalBytes / 1024 / 1024).toFixed(2));
  const averageKb = assetFiles.length
    ? Number((totalBytes / assetFiles.length / 1024).toFixed(1))
    : 0;

  // 1. ユネスコにあってサイトに画像がない資産（新規登録など）
  const missingOnSite = [...unescoById.keys()]
    .filter((id) => !manifestIds.has(id))
    .map((id) => formatSite(unescoById.get(id)));

  // 2. サイトにあってユネスコにない資産（登録抹消・ID変更など）
  const removedFromUnesco = [...manifestIds]
    .filter((id) => !unescoById.has(id))
    .map((id) => ({ unescoId: id, image: manifestImages[id] }));

  // 3. マニフェスト参照先のファイルが存在しない
  const brokenReferences = Object.entries(manifestImages)
    .filter(([, rel]) => !assetFileSet.has(path.basename(String(rel))))
    .map(([id, rel]) => ({ unescoId: id, image: rel }));

  // 4. マニフェストから参照されていない孤立ファイル
  const referencedFiles = new Set(
    Object.values(manifestImages).map((rel) => path.basename(String(rel)))
  );
  const orphanFiles = assetFiles.filter((name) => !referencedFiles.has(name));

  // 5. 日本の資産で日本語名テーブル未登録のもの
  const japanMissingNames = records
    .filter((r) => statesOf(r).includes("Japan"))
    .filter((r) => !japanNameIds.has(toId(r)))
    .map(formatSite);

  // 6. SITE_DATA_VERSION の件数部分が実件数とずれていないか
  const versionCount = siteDataVersion
    ? Number(String(siteDataVersion).split("-").pop())
    : null;
  const versionStale =
    Number.isFinite(versionCount) && versionCount !== records.length;

  // 7. マニフェスト stats と実測値のずれ
  const statsStale =
    manifest.stats?.files !== assetFiles.length ||
    manifest.stats?.mappedImages !== manifestIds.size;

  // 8. 容量ポリシー
  const policy = manifest.policy ?? {};
  const sizeStatus =
    totalMb > (policy.hardTotalMb ?? Infinity)
      ? "hard-over"
      : totalMb > (policy.warningTotalMb ?? Infinity)
        ? "warning"
        : totalMb > (policy.targetTotalMb ?? Infinity)
          ? "over-target"
          : "ok";

  // 9. 危機遺産リストの現況（参考情報）
  const dangerSites = records.filter(isInDanger).map(formatSite);

  // 10. 前回チェックからの推移
  const prevUnescoIds = new Set(
    Array.isArray(previous?.unescoIds) ? previous.unescoIds : []
  );
  const prevDangerIds = new Set(
    Array.isArray(previous?.dangerSites) ? previous.dangerSites.map((s) => s.unescoId) : []
  );
  const dangerIds = new Set(dangerSites.map((s) => s.unescoId));
  const sinceLast = previous
    ? {
        previousCheckedAt: previous.checkedAt ?? null,
        totalDelta: records.length - (previous.unescoTotal ?? records.length),
        inscribed: prevUnescoIds.size
          ? [...unescoById.keys()].filter((id) => !prevUnescoIds.has(id)).map((id) => formatSite(unescoById.get(id)))
          : [],
        delisted: prevUnescoIds.size
          ? [...prevUnescoIds].filter((id) => !unescoById.has(id))
          : [],
        dangerAdded: [...dangerIds].filter((id) => !prevDangerIds.has(id)),
        dangerRemoved: [...prevDangerIds].filter((id) => !dangerIds.has(id))
      }
    : null;

  const actionRequired =
    missingOnSite.length > 0 ||
    removedFromUnesco.length > 0 ||
    brokenReferences.length > 0 ||
    japanMissingNames.length > 0 ||
    versionStale ||
    statsStale ||
    sizeStatus === "hard-over";

  const report = {
    checkedAt: new Date().toISOString(),
    unescoTotal: records.length,
    siteImageTotal: manifestIds.size,
    assetFileTotal: assetFiles.length,
    siteDataVersion,
    versionStale,
    statsStale,
    manifestStats: manifest.stats ?? null,
    measured: { files: assetFiles.length, totalMb, averageKb },
    sizeStatus,
    actionRequired,
    missingOnSite,
    removedFromUnesco,
    brokenReferences,
    orphanFiles,
    japanTableFound,
    japanMissingNames,
    dangerSiteCount: dangerSites.length,
    dangerSites,
    sinceLast,
    unescoIds: [...unescoById.keys()]
  };

  await fs.mkdir(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  await fs.writeFile(
    path.join(reportsDir, `heritage-unesco-${stamp}.json`),
    JSON.stringify(report, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(reportsDir, "latest.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(report, null, 2));
    return actionRequired ? 1 : 0;
  }

  const line = "-".repeat(60);
  log(`\n${line}`);
  log("世界遺産パスポート 月次差分チェック");
  log(line);
  log(`ユネスコ登録資産      : ${records.length} 件`);
  log(`サイト画像マニフェスト: ${manifestIds.size} 件`);
  log(`実ファイル数          : ${assetFiles.length} 件 / ${totalMb} MB (平均 ${averageKb} KB)`);
  log(`SITE_DATA_VERSION     : ${siteDataVersion ?? "(未検出)"}${versionStale ? "  ← 要更新" : ""}`);
  log(`容量ステータス        : ${sizeStatus}`);
  log(line);

  const section = (title, items, renderer) => {
    if (items.length === 0) {
      log(`\n[OK] ${title}: なし`);
      return;
    }
    log(`\n[要対応] ${title}: ${items.length} 件`);
    for (const item of items.slice(0, 50)) log(`  - ${renderer(item)}`);
    if (items.length > 50) log(`  ... ほか ${items.length - 50} 件`);
  };

  section(
    "ユネスコにあり画像未登録の資産",
    missingOnSite,
    (s) => `${s.unescoId} ${s.nameEn} (${s.states}, ${s.year ?? "?"}) ${s.officialUrl}`
  );
  section(
    "ユネスコに存在しないマニフェスト項目（抹消・ID変更疑い）",
    removedFromUnesco,
    (s) => `${s.unescoId} → ${s.image}`
  );
  section("マニフェスト参照先の画像が欠落", brokenReferences, (s) => `${s.unescoId} → ${s.image}`);
  section("日本語名テーブル未登録の日本の資産", japanMissingNames, (s) => `${s.unescoId} ${s.nameEn}`);
  section("マニフェスト未参照の孤立ファイル", orphanFiles, (name) => name);

  if (statsStale) {
    log(
      `\n[要対応] manifest.stats がずれています: 記載 files=${manifest.stats?.files} / mappedImages=${manifest.stats?.mappedImages}`
    );
  }
  log(`\n[参考] 危機遺産リスト掲載: ${dangerSites.length} 件`);
  if (sinceLast) {
    const brief = (items, max = 20) =>
      items.length === 0
        ? ""
        : ` → ${items.slice(0, max).join(", ")}${items.length > max ? ` ... ほか ${items.length - max} 件` : ""}`;
    log(`\n[前回比] 前回チェック: ${sinceLast.previousCheckedAt ?? "不明"}`);
    log(`  総数増減      : ${sinceLast.totalDelta >= 0 ? "+" : ""}${sinceLast.totalDelta}`);
    log(`  新規登録      : ${sinceLast.inscribed.length} 件${brief(sinceLast.inscribed.map((s) => `${s.unescoId} ${s.nameEn}`))}`);
    log(`  登録抹消      : ${sinceLast.delisted.length} 件${brief(sinceLast.delisted)}`);
    log(`  危機遺産入り  : ${sinceLast.dangerAdded.length} 件${brief(sinceLast.dangerAdded)}`);
    log(`  危機遺産解除  : ${sinceLast.dangerRemoved.length} 件${brief(sinceLast.dangerRemoved)}`);
  } else {
    log("\n[前回比] 前回レポートなし（今回が基準となります）");
  }
  log(`\nレポート: scripts/reports/heritage-unesco-${stamp}.json`);
  log(actionRequired ? "\n結論: 要対応の差分があります。" : "\n結論: 差分なし。対応不要です。");

  return actionRequired ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("チェックに失敗しました:", error.message);
    process.exit(2);
  });
