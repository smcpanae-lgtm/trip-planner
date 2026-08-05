#!/usr/bin/env node
/**
 * 世界遺産パスポート: 個別ページ用データスナップショットの生成
 *
 * UNESCO DataHub (whc001) から「事実情報のみ」を取得し、
 *   - src/data/heritage-sites.json          … 静的ページ生成のもとになるスナップショット
 *   - public/heritage/assets/heritage/slugs.json … 既存の一覧アプリ(app.js)から詳細ページへリンクするための対応表
 * を書き出す。
 *
 * 方針（現サイトの方針を維持）:
 *   - 使うのは 名称 / 国 / 登録年 / 種別 / 登録基準記号 / 面積 / 構成資産数 / 危機遺産の有無 / 座標 のみ。
 *   - UNESCO公式の説明文(description/justification/short_description)・写真URL・ロゴは一切保存しない。
 *
 * 使い方:
 *   node scripts/heritage-build-data.mjs
 *   npm run heritage:data
 *
 * 終了コード: 0 = 成功 / 1 = 失敗
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const appJsPath = path.join(repoRoot, "public", "heritage", "app.js");
const assetsDir = path.join(repoRoot, "public", "heritage", "assets", "heritage");
const imageManifestPath = path.join(assetsDir, "manifest.json");
const slugMapPath = path.join(assetsDir, "slugs.json");
const dataOutPath = path.join(repoRoot, "src", "data", "heritage-sites.json");

const UNESCO_ENDPOINT =
  "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records";
const PAGE_SIZE = 100;
const SLUG_MAX_LENGTH = 70;

const regionJaDisplay = new Intl.DisplayNames(["ja"], { type: "region" });

/** UNESCOの地域区分 → サイト内キー */
const REGION_KEYS = {
  Africa: "africa",
  "Arab States": "arab",
  "Asia and the Pacific": "asia",
  "Europe and North America": "europe",
  "Latin America and the Caribbean": "latin",
};

/** UNESCOの種別 → サイト内キー */
const CATEGORY_KEYS = {
  Cultural: "cultural",
  Natural: "natural",
  Mixed: "mixed",
};

/** Intl.DisplayNamesの表記が一般的な日本語表記と異なる国の上書き */
const COUNTRY_JA_OVERRIDES = {
  CD: "コンゴ民主共和国",
  CG: "コンゴ共和国",
  GB: "イギリス",
  US: "アメリカ合衆国",
  KR: "韓国",
  KP: "北朝鮮",
  VA: "バチカン市国",
  TZ: "タンザニア",
  SY: "シリア",
  IR: "イラン",
  LA: "ラオス",
  BO: "ボリビア",
  VE: "ベネズエラ",
  MD: "モルドバ",
  FM: "ミクロネシア連邦",
  CV: "カーボベルデ",
  CI: "コートジボワール",
  MK: "北マケドニア",
  XK: "コソボ",
  JE: "ジャージー島",
};

const HTML_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * DataHubの名称にはまれに <i> や <br /> などのHTMLタグが混ざるため、
 * app.js の cleanDataText と同じ方針でタグを除去し実体参照を戻す。
 */
function text(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      }
      if (entity.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      }
      return HTML_ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUnescoSites() {
  const all = [];
  let offset = 0;
  let total = Infinity;

  while (all.length < total) {
    const response = await fetch(`${UNESCO_ENDPOINT}?limit=${PAGE_SIZE}&offset=${offset}`);
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

/** app.js の日本語名テーブルを唯一の情報源として読み込む（二重管理を避けるため） */
async function readJapanNamesJa() {
  const source = await fs.readFile(appJsPath, "utf8");
  const start = source.indexOf("const japanHeritageNamesJa");
  if (start === -1) return {};
  const end = source.indexOf("\n};", start);
  const body = source.slice(start, end === -1 ? undefined : end);
  const names = {};
  for (const match of body.matchAll(/"(\d+)"\s*:\s*"([^"]+)"/g)) {
    names[match[1]] = match[2];
  }
  return names;
}

async function readImageManifest() {
  try {
    const raw = await fs.readFile(imageManifestPath, "utf8");
    const manifest = JSON.parse(raw.replace(/^﻿/, ""));
    return manifest?.images && typeof manifest.images === "object" ? manifest.images : {};
  } catch {
    return {};
  }
}

/** 既に公開済みのURLを壊さないよう、前回のスラッグを引き継ぐ */
async function readPreviousSlugs() {
  try {
    const previous = JSON.parse(await fs.readFile(dataOutPath, "utf8"));
    const map = new Map();
    for (const site of previous.sites ?? []) {
      if (site.id && site.slug) map.set(String(site.id), String(site.slug));
    }
    return map;
  } catch {
    return new Map();
  }
}

function slugify(value) {
  const base = String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’'`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return "";
  if (base.length <= SLUG_MAX_LENGTH) return base;
  const cut = base.slice(0, SLUG_MAX_LENGTH);
  const lastHyphen = cut.lastIndexOf("-");
  return (lastHyphen > 20 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

function isoCodesOf(record) {
  return text(record.iso_codes)
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

/** ISOコードを持たない特殊な登録主体（DataHubの表記をそのまま訳したもの） */
const COUNTRY_JA_BY_NAME = {
  "Jerusalem (Site proposed by Jordan)": "エルサレム（ヨルダンによる申請物件）",
};

function countryJaOf(isoCode, fallbackEn) {
  if (COUNTRY_JA_BY_NAME[fallbackEn]) return COUNTRY_JA_BY_NAME[fallbackEn];
  if (COUNTRY_JA_OVERRIDES[isoCode]) return COUNTRY_JA_OVERRIDES[isoCode];
  try {
    const ja = regionJaDisplay.of(isoCode);
    if (ja && ja !== isoCode) return ja;
  } catch {
    /* 未知のコードは英語名にフォールバック */
  }
  return fallbackEn;
}

function statesOf(record) {
  const names = Array.isArray(record.states_names) ? record.states_names : [record.states_names];
  return names.map(text).filter(Boolean);
}

function buildSite(record, { japanNamesJa, imageManifest }) {
  const id = text(record.id_no);
  const countriesEn = statesOf(record);
  const isoCodes = isoCodesOf(record);
  const countriesJa = countriesEn.map((nameEn, index) => countryJaOf(isoCodes[index] ?? "", nameEn));
  const year = record.date_inscribed ? Number(record.date_inscribed) : null;

  return {
    id,
    slug: "", // あとでまとめて確定する
    nameEn: text(record.name_en),
    nameJa: japanNamesJa[id] ?? null,
    nameFr: text(record.name_fr) || null,
    nameEs: text(record.name_es) || null,
    nameZh: text(record.name_zh) || null,
    countriesEn,
    countriesJa,
    isoCodes,
    region: REGION_KEYS[text(record.region)] ?? "unknown",
    category: CATEGORY_KEYS[text(record.category)] ?? "mixed",
    year: Number.isFinite(year) ? year : null,
    criteria: text(record.criteria_txt) || null,
    areaHectares: typeof record.area_hectares === "number" ? record.area_hectares : null,
    componentsCount:
      typeof record.components_count === "number" ? record.components_count : null,
    transboundary: text(record.transboundary).toLowerCase() === "true",
    danger: text(record.danger).toLowerCase() === "true",
    dangerSince: text(record.danger_list) || null,
    lat: typeof record.coordinates?.lat === "number" ? record.coordinates.lat : null,
    lon: typeof record.coordinates?.lon === "number" ? record.coordinates.lon : null,
    image: imageManifest[id] ?? null,
    unescoUrl: `https://whc.unesco.org/en/list/${id}`,
  };
}

function assignSlugs(sites, previousSlugs) {
  const used = new Set();

  // 1. 前回と同じIDには前回のスラッグをそのまま使う（公開済みURLの維持）
  for (const site of sites) {
    const previous = previousSlugs.get(site.id);
    if (previous && !used.has(previous)) {
      site.slug = previous;
      used.add(previous);
    }
  }

  // 2. 残りに新規スラッグを割り当てる（重複時はユネスコIDを付けて一意化）
  for (const site of sites) {
    if (site.slug) continue;
    const base = slugify(site.nameEn) || `site-${site.id}`;
    let candidate = base;
    if (used.has(candidate)) candidate = `${base}-${site.id}`;
    let counter = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${site.id}-${counter}`;
      counter += 1;
    }
    site.slug = candidate;
    used.add(candidate);
  }

  return sites;
}

async function main() {
  console.log("UNESCO DataHub (whc001) から事実情報を取得中...");
  const [records, japanNamesJa, imageManifest, previousSlugs] = await Promise.all([
    fetchUnescoSites(),
    readJapanNamesJa(),
    readImageManifest(),
    readPreviousSlugs(),
  ]);
  console.log(`  取得完了: ${records.length} 件`);

  const sites = assignSlugs(
    records
      .map((record) => buildSite(record, { japanNamesJa, imageManifest }))
      .filter((site) => site.id && site.nameEn)
      .sort((a, b) => a.nameEn.localeCompare(b.nameEn, "en")),
    previousSlugs
  );

  const withImage = sites.filter((site) => site.image).length;
  const changedSlugs = sites.filter(
    (site) => previousSlugs.has(site.id) && previousSlugs.get(site.id) !== site.slug
  );
  const newSlugs = sites.filter((site) => !previousSlugs.has(site.id));

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: "UNESCO DataHub whc001",
    sourceUrl: "https://data.unesco.org/explore/dataset/whc001/",
    license: "CC BY-SA 4.0",
    note: "名称・国・登録年・種別などの事実情報のみを保持し、UNESCO公式の説明文・写真・ロゴは含まない。",
    total: sites.length,
    sites,
  };

  await fs.mkdir(path.dirname(dataOutPath), { recursive: true });
  await fs.writeFile(dataOutPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  const slugMap = {
    generatedAt: snapshot.generatedAt,
    slugs: Object.fromEntries(sites.map((site) => [site.id, site.slug])),
  };
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(slugMapPath, `${JSON.stringify(slugMap)}\n`, "utf8");

  const line = "-".repeat(60);
  console.log(`\n${line}`);
  console.log("世界遺産 個別ページ用データを書き出しました");
  console.log(line);
  console.log(`件数            : ${sites.length} 件`);
  console.log(`画像ありの件数  : ${withImage} 件`);
  console.log(`新規スラッグ    : ${newSlugs.length} 件`);
  console.log(`スラッグ変更    : ${changedSlugs.length} 件`);
  if (changedSlugs.length) {
    for (const site of changedSlugs.slice(0, 20)) {
      console.log(`  - ${site.id}: ${previousSlugs.get(site.id)} → ${site.slug}`);
    }
  }
  console.log(`\n出力: src/data/heritage-sites.json`);
  console.log(`出力: public/heritage/assets/heritage/slugs.json`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("データ生成に失敗しました:", error.message);
    process.exit(1);
  });
