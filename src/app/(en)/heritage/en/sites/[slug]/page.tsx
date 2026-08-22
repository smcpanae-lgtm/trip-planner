import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { HERITAGE_SITES, getHeritageSiteBySlug } from "@/data/heritage";

/** 英語版の個別ページ（/heritage/en/sites/{slug}）。ルートグループ (en) 配下の固定フォルダなので locale は常に "en"。 */

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
  return buildSiteMetadata(site, "en");
}

export default async function HeritageEnSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site) notFound();
  return <SiteDetail site={site} locale="en" />;
}
