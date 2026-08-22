import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { HERITAGE_SITES, getHeritageSiteBySlug } from "@/data/heritage";

/** 繁体字版の個別ページ（/heritage/zh-hant/sites/{slug}）。ルートグループ (zh-hant) 配下の固定フォルダなので locale は常に "zh-hant"。 */

export function generateStaticParams() {
  return HERITAGE_SITES.map((site) => ({ slug: site.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site) return {};
  return buildSiteMetadata(site, "zh-hant");
}

export default async function HeritageZhHantSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site) notFound();
  return <SiteDetail site={site} locale="zh-hant" />;
}
