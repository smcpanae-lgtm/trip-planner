import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SitesIndex, { buildIndexMetadata } from "@/components/heritage/SitesIndex";
import { LOCALIZED_SEGMENTS, isHeritageLocale } from "@/data/heritage-i18n";

/** 英語・フランス語・スペイン語・中国語の一覧ページ（/heritage/en/sites など） */

export function generateStaticParams() {
  return LOCALIZED_SEGMENTS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isHeritageLocale(lang)) return {};
  return buildIndexMetadata(lang);
}

export default async function LocalizedHeritageSitesIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isHeritageLocale(lang)) notFound();
  return <SitesIndex locale={lang} />;
}
