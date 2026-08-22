import SitesIndex, { buildIndexMetadata } from "@/components/heritage/SitesIndex";

/** 英語版の一覧ページ（/heritage/en/sites）。ルートグループ (en) 配下の固定フォルダなので locale は常に "en"。 */

export function generateMetadata() {
  return buildIndexMetadata("en");
}

export default function HeritageEnSitesIndexPage() {
  return <SitesIndex locale="en" />;
}
