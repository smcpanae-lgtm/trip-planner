import snapshot from "./heritage-sites.json";

/**
 * 世界遺産の個別ページ用データ。
 *
 * 実データは scripts/heritage-build-data.mjs が生成した
 * src/data/heritage-sites.json（UNESCO DataHub の事実情報のスナップショット）。
 * ビルド時にこのJSONだけを読むため、ビルド中に外部APIへ接続しない。
 */

export type HeritageRegion = "africa" | "arab" | "asia" | "europe" | "latin" | "unknown";
export type HeritageCategory = "cultural" | "natural" | "mixed";

export type HeritageSite = {
  id: string;
  slug: string;
  nameEn: string;
  nameJa: string | null;
  nameFr: string | null;
  nameEs: string | null;
  nameZh: string | null;
  countriesEn: string[];
  countriesJa: string[];
  isoCodes: string[];
  region: HeritageRegion;
  category: HeritageCategory;
  year: number | null;
  criteria: string | null;
  areaHectares: number | null;
  componentsCount: number | null;
  transboundary: boolean;
  danger: boolean;
  dangerSince: string | null;
  lat: number | null;
  lon: number | null;
  image: string | null;
  unescoUrl: string;
};

export const HERITAGE_SITES = snapshot.sites as HeritageSite[];
export const HERITAGE_TOTAL = HERITAGE_SITES.length;
export const HERITAGE_GENERATED_AT = snapshot.generatedAt;

export const SITE_ORIGIN = "https://www.ai-drive-planner.com";
export const HERITAGE_APP_PATH = "/heritage";
export const HERITAGE_SITES_PATH = "/heritage/sites";

export const REGION_LABELS: Record<HeritageRegion, string> = {
  africa: "アフリカ",
  arab: "アラブ諸国",
  asia: "アジア・太平洋",
  europe: "ヨーロッパ・北米",
  latin: "ラテンアメリカ・カリブ",
  unknown: "その他",
};

export const CATEGORY_LABELS: Record<HeritageCategory, string> = {
  cultural: "文化遺産",
  natural: "自然遺産",
  mixed: "複合遺産",
};

/** 地域の表示順（既存アプリの並びに合わせる） */
export const REGION_ORDER: HeritageRegion[] = [
  "asia",
  "europe",
  "latin",
  "africa",
  "arab",
  "unknown",
];

const siteBySlug = new Map(HERITAGE_SITES.map((site) => [site.slug, site]));

export function getHeritageSiteBySlug(slug: string): HeritageSite | undefined {
  return siteBySlug.get(slug);
}

/** 表示用の遺産名（日本語名があれば優先） */
export function displayName(site: HeritageSite): string {
  return site.nameJa || site.nameEn;
}

/** 国名の表示文字列。複数国にまたがる場合は「・」でつなぐ */
export function countryLabel(site: HeritageSite): string {
  return site.countriesJa.length ? site.countriesJa.join("・") : site.countriesEn.join("・");
}

export function heritageSiteUrl(site: HeritageSite): string {
  return `${HERITAGE_SITES_PATH}/${site.slug}`;
}

export function heritageSiteAbsoluteUrl(site: HeritageSite): string {
  return `${SITE_ORIGIN}${heritageSiteUrl(site)}`;
}

/** 個別ページで使う画像の絶対パス（サイト内で独自生成したイメージ画像） */
export function heritageImagePath(site: HeritageSite): string | null {
  return site.image ? `/heritage/${site.image}` : null;
}

export function heritageImageAbsoluteUrl(site: HeritageSite): string | null {
  const path = heritageImagePath(site);
  return path ? `${SITE_ORIGIN}${path}` : null;
}

/** 面積の表示。1万ha以上はkm²に換算して読みやすくする */
export function areaLabel(site: HeritageSite): string | null {
  if (site.areaHectares === null || site.areaHectares <= 0) return null;
  const ha = site.areaHectares;
  if (ha >= 10000) {
    const km2 = ha / 100;
    return `約${km2.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}km²（${ha.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}ha）`;
  }
  return `約${ha.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}ha`;
}

/** 同じ国の他の世界遺産（内部リンク用） */
export function relatedSitesInSameCountry(site: HeritageSite, limit = 12): HeritageSite[] {
  const codes = new Set(site.isoCodes);
  const names = new Set(site.countriesEn);
  return HERITAGE_SITES.filter((other) => {
    if (other.id === site.id) return false;
    if (other.isoCodes.some((code) => codes.has(code))) return true;
    return other.countriesEn.some((name) => names.has(name));
  }).slice(0, limit);
}

export type CountryGroup = {
  key: string;
  label: string;
  region: HeritageRegion;
  sites: HeritageSite[];
};

/** 地域 → 国 の順にまとめたインデックス（一覧ページ用） */
export function groupByRegionAndCountry(): { region: HeritageRegion; countries: CountryGroup[] }[] {
  const groups = new Map<string, CountryGroup>();

  for (const site of HERITAGE_SITES) {
    const labels = site.countriesJa.length ? site.countriesJa : site.countriesEn;
    labels.forEach((label, index) => {
      const key = site.isoCodes[index] || label;
      const existing = groups.get(key);
      if (existing) {
        existing.sites.push(site);
        return;
      }
      groups.set(key, { key, label, region: site.region, sites: [site] });
    });
  }

  return REGION_ORDER.map((region) => ({
    region,
    countries: [...groups.values()]
      .filter((group) => group.region === region)
      .sort((a, b) => b.sites.length - a.sites.length || a.label.localeCompare(b.label, "ja")),
  })).filter((entry) => entry.countries.length > 0);
}
