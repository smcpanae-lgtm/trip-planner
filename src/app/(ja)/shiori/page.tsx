import type { Metadata } from "next";
import ShioriClient from "@/components/shiori/ShioriClient";
import SiteFooter from "@/components/SiteFooter";
import {
  buildShioriMetadata,
  buildShioriFaqJsonLd,
  buildShioriSoftwareApplicationJsonLd,
  shioriUrl,
} from "@/lib/shiori/seo";

const title = "AI旅行記メーカー｜旅行日記を無料で作成、旅の記録アプリ不要";
const description = "写真・場所・日付・メモから、AIが旅行日記を無料で作成。旅の思い出をA4 PDF、SNS投稿文、ブログ用アイキャッチ画像として保存できます。写真そのものはAIに送信せず、専用の旅の記録アプリは不要で、旅行後の思い出整理にすぐ使える無料ツールです。";

export const metadata: Metadata = buildShioriMetadata("ja");

const jsonLd = [
  buildShioriSoftwareApplicationJsonLd("ja"),
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: shioriUrl("ja"),
    isPartOf: {
      "@type": "WebSite",
      name: "AI ドライブプランナー",
      url: "https://www.ai-drive-planner.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AI ドライブプランナー",
        item: "https://www.ai-drive-planner.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AI旅行記メーカー",
        item: shioriUrl("ja"),
      },
    ],
  },
  buildShioriFaqJsonLd("ja"),
];

export default function ShioriPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShioriClient showSamplesLink />
      <SiteFooter />
    </>
  );
}
