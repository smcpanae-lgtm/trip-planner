import type { Metadata } from "next";
import ShioriClient from "@/components/shiori/ShioriClient";
import SiteFooter from "@/components/SiteFooter";

const title = "AI旅行記メーカー｜旅行日記を無料で作成、旅の記録アプリ不要";
const description = "写真・場所・日付・メモから、AIが旅行日記を無料で作成。旅の思い出をA4 PDF、SNS投稿文、ブログ用アイキャッチ画像として保存できます。写真そのものはAIに送信せず、専用の旅の記録アプリは不要で、旅行後の思い出整理にすぐ使える無料ツールです。";
const ogImage = "https://www.ai-drive-planner.com/ogp-shiori.jpg";

export const metadata: Metadata = {
  title,
  description,
  keywords:
    "旅行日記 作成 無料,旅の記録 アプリ 不要,AI旅行記,旅行記 メーカー,旅の思い出 PDF,旅行日記 AI 無料",
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url: "https://www.ai-drive-planner.com/shiori",
    images: [
      {
        url: ogImage,
        secureUrl: ogImage,
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: "AI旅行記メーカー｜写真とメモから旅の思い出をAI旅行記に",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [
      {
        url: ogImage,
        alt: "AI旅行記メーカー｜写真とメモから旅の思い出をAI旅行記に",
      },
    ],
  },
  alternates: {
    canonical: "https://www.ai-drive-planner.com/shiori",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: "https://www.ai-drive-planner.com/shiori",
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
        item: "https://www.ai-drive-planner.com/shiori",
      },
    ],
  },
];

export default function ShioriPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShioriClient />
      <SiteFooter />
    </>
  );
}
