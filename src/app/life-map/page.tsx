import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import LifeMapClient from "@/components/lifemap/LifeMapClient";
import SiteFooter from "@/components/SiteFooter";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-lifemap",
  display: "swap",
});

export const metadata: Metadata = {
  title: "人生体験マップ｜行った場所を記録する地図アプリ・人生でやりたいことリストの実績版",
  description:
    "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できる非公開のライフログ。人生でやりたいことリストの達成記録としても使え、記録は端末内にのみ保存、県別・時系列で振り返れます。",
  keywords:
    "人生でやりたいことリスト 地図,行った場所 記録 マップ,人生体験マップ,ライフログ 地図,旅行記録 アプリ,思い出 地図 記録",
  openGraph: {
    title: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できるライフログ。人生でやりたいことリストの達成記録としても使えます。",
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url: "https://www.ai-drive-planner.com/life-map",
    images: [
      {
        url: "https://www.ai-drive-planner.com/ogp-lifemap.jpg?v=2",
        secureUrl: "https://www.ai-drive-planner.com/ogp-lifemap.jpg?v=2",
        type: "image/jpeg",
        width: 1200,
        height: 675,
        alt: "人生体験マップ｜行った場所を記録する地図アプリ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できるライフログ。県別・時系列で思い出を振り返れます。",
    images: ["https://www.ai-drive-planner.com/ogp-lifemap.jpg?v=2"],
  },
  alternates: {
    canonical: "https://www.ai-drive-planner.com/life-map",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できる非公開のライフログ。",
    url: "https://www.ai-drive-planner.com/life-map",
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
        item: "https://www.ai-drive-planner.com/life-map",
      },
    ],
  },
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
