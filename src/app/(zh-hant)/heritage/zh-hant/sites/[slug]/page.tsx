import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { getHeritageSiteBySlug, prerenderedHeritageSlugs } from "@/data/heritage";

/** 繁体字版の個別ページ（/heritage/zh-hant/sites/{slug}）。ルートグループ (zh-hant) 配下の固定フォルダなので locale は常に "zh-hant"。 */

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
