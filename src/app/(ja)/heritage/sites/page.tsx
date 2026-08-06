import type { Metadata } from "next";
import SitesIndex, { buildIndexMetadata } from "@/components/heritage/SitesIndex";

/** 日本語版の一覧ページ。既存URL /heritage/sites を維持する */
export const metadata: Metadata = buildIndexMetadata("ja");

export default function HeritageSitesIndexPage() {
  return <SitesIndex locale="ja" />;
}
