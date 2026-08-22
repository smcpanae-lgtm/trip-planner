import SitesIndex, { buildIndexMetadata } from "@/components/heritage/SitesIndex";

/** 繁体字版の一覧ページ（/heritage/zh-hant/sites）。ルートグループ (zh-hant) 配下の固定フォルダなので locale は常に "zh-hant"。 */

export function generateMetadata() {
  return buildIndexMetadata("zh-hant");
}

export default function HeritageZhHantSitesIndexPage() {
  return <SitesIndex locale="zh-hant" />;
}
