import type { Metadata } from "next";
import Link from "next/link";
import HareClient from "@/components/hare/HareClient";
import SiteFooter from "@/components/SiteFooter";
import { hareJa } from "@/lib/hare/i18n";

const title = "晴れ探しドライブ｜雨の日に車で行ける晴れの場所を探す";
const description =
  "現在地から半径50〜300kmの市区町村の天気予報を調べ、到着する頃に晴れていそうな場所を地図と一覧で表示。見つけた場所へのドライブプランもそのまま作成できます。";
const url = "https://www.ai-drive-planner.com/hare";

const shareTitle = "晴れ探しドライブ｜AIドライブプランナー";
const shareDescription =
  "雨続きの日に。現在地から半径50〜300km以内で晴れている地域を探して、そのままドライブプランを作れます。";
const ogImage = "https://www.ai-drive-planner.com/ogp-hare.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: "雨の日 ドライブ,晴れている場所 探す,ドライブ 天気,晴れ 行き先,雨 回避 ドライブ",
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "晴れ探しドライブ｜雨の日は、晴れの場所へ。",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [ogImage],
  },
  alternates: {
    canonical: url,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: hareJa.pageTitle,
    description,
    url,
    applicationCategory: "TravelApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
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
        name: hareJa.pageTitle,
        item: url,
      },
    ],
  },
];

export default function HarePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <nav className="text-xs text-slate-400 mb-4 space-x-1">
          <Link href="/" className="hover:text-blue-500">
            {hareJa.breadcrumbHome}
          </Link>
          <span>/</span>
          <span className="text-slate-500">{hareJa.pageTitle}</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{hareJa.pageTitle}</h1>
        <p className="mt-3 mb-6 text-sm text-slate-600 leading-relaxed">{hareJa.lead}</p>

        <HareClient />
      </div>

      <SiteFooter />
    </div>
  );
}
