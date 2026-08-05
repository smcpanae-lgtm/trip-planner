import type { MetadataRoute } from "next";
import { ROUTES } from "@/data/routes";
import { COLUMNS } from "@/data/columns";
import { HERITAGE_SITES } from "@/data/heritage";
import {
  HERITAGE_LOCALES,
  localeAppPath,
  localeIndexUrl,
  localeSiteUrl,
} from "@/data/heritage-i18n";

/**
 * 世界遺産まわりのURL。
 * hreflang は各ページの <head> に出力済みのため、
 * サイトマップ側は URL の列挙だけにしてファイルサイズを抑える。
 */
const heritageEntries: MetadataRoute.Sitemap = [
  // 記録アプリ本体（言語別）
  ...HERITAGE_LOCALES.map((locale) => ({
    url: `https://www.ai-drive-planner.com${localeAppPath(locale)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: locale === "ja" ? 0.9 : 0.8,
  })),
  // 一覧ページ（言語別）
  ...HERITAGE_LOCALES.map((locale) => ({
    url: localeIndexUrl(locale),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: locale === "ja" ? 0.8 : 0.7,
  })),
  // 世界遺産1,273件の個別ページ（言語別）
  ...HERITAGE_LOCALES.flatMap((locale) =>
    HERITAGE_SITES.map((site) => ({
      url: localeSiteUrl(site, locale),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: locale === "ja" ? 0.6 : 0.5,
    }))
  ),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.ai-drive-planner.com/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...heritageEntries,
    {
      url: "https://www.ai-drive-planner.com/shiori",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.ai-drive-planner.com/life-map/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.ai-drive-planner.com/routes",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...ROUTES.map((route) => ({
      url: `https://www.ai-drive-planner.com/routes/${route.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: "https://www.ai-drive-planner.com/columns",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...COLUMNS.map((column) => ({
      url: `https://www.ai-drive-planner.com/columns/${column.slug}`,
      lastModified: new Date(column.updatedDate),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

