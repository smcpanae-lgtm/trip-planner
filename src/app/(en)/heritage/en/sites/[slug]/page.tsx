import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { getHeritageSiteBySlug, prerenderedHeritageSlugs } from "@/data/heritage";

/** 英語版の個別ページ（/heritage/en/sites/{slug}）。ルートグループ (en) 配下の固定フォルダなので locale は常に "en"。 */

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
