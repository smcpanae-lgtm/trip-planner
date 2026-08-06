import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { HERITAGE_SITES, getHeritageSiteBySlug } from "@/data/heritage";

/**
 * 日本語版の個別ページ。
 * 既に検索エンジンに登録済みのURLなので /heritage/sites/{slug} のまま維持し、
 * 他言語だけを /heritage/{lang}/sites/{slug} に置く。
 */

/** 1,273件すべてをビルド時に静的生成する（実行時のサーバー処理を発生させない） */
export function generateStaticParams() {
  return HERITAGE_SITES.map((site) => ({ slug: site.slug }));
}

/** 未知のスラッグは静的な404にする（動的レンダリングを行わない） */
export const dynamicParams = false;

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
