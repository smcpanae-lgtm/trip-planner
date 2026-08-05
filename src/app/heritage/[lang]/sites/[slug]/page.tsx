import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteDetail, { buildSiteMetadata } from "@/components/heritage/SiteDetail";
import { HERITAGE_SITES, getHeritageSiteBySlug } from "@/data/heritage";
import { LOCALIZED_SEGMENTS, isHeritageLocale } from "@/data/heritage-i18n";

/**
 * 英語・フランス語・スペイン語・中国語の個別ページ。
 * /heritage/en/sites/{slug} のように言語セグメントを挟む。
 * 日本語は既存URLを維持するため、この配下では生成しない。
 */

export function generateStaticParams() {
  return LOCALIZED_SEGMENTS.flatMap((lang) =>
    HERITAGE_SITES.map((site) => ({ lang, slug: site.slug }))
  );
}

/** 未知の言語・スラッグは静的な404にする（動的レンダリングを行わない） */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site || !isHeritageLocale(lang)) return {};
  return buildSiteMetadata(site, lang);
}

export default async function LocalizedHeritageSitePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const site = getHeritageSiteBySlug(slug);
  if (!site || !isHeritageLocale(lang)) notFound();
  return <SiteDetail site={site} locale={lang} />;
}
