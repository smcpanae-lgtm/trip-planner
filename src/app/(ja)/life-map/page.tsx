import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import LifeMapClient from "@/components/lifemap/LifeMapClient";
import SiteFooter from "@/components/SiteFooter";
import { buildLifeMapMetadata, buildLifeMapFaqJsonLd, lifeMapUrl } from "@/lib/lifemap/seo";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-lifemap",
  display: "swap",
});

export const metadata: Metadata = buildLifeMapMetadata("ja");

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できる非公開のライフログ。",
    url: lifeMapUrl("ja"),
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
        name: "人生体験マップ",
        item: lifeMapUrl("ja"),
      },
    ],
  },
  // ページ下部の「よくある質問」セクション（LifeMapGuide）と同一内容を辞書から生成
  buildLifeMapFaqJsonLd("ja"),
];

export default function LifeMapPage() {
  return (
    <div className={notoSansJP.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LifeMapClient />
      <SiteFooter />
    </div>
  );
}
