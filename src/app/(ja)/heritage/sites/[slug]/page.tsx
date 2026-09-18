import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { getHeritageSiteBySlug, prerenderedHeritageSlugs } from "@/data/heritage";

/**
 * 日本語版の個別ページ。
 * 既に検索エンジンに登録済みのURLなので /heritage/sites/{slug} のまま維持し、
 * 他言語だけを /heritage/{lang}/sites/{slug} に置く。
 */

/** 日本の27件だけをビルド時に生成し、残りはオンデマンド生成に任せる */
export function generateStaticParams() {
  return prerenderedHeritageSlugs();
}

/** 事前生成していないスラッグは初回アクセス時にオンデマンド生成する（ISR） */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site) return {};
  return buildSiteMetadata(site, "ja");
}

export default async function HeritageSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site) notFound();
  return <SiteDetail site={site} locale="ja" />;
}
