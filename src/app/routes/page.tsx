import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { getRoutesByRegion } from "@/data/routes";
import SiteFooter from "@/components/SiteFooter";

const title = "人気ドライブルート一覧｜出発地から探すおすすめコース";
const description =
  "東京・大阪・名古屋・福岡・札幌発の人気ドライブルートを一覧で紹介。距離・所要時間の目安やモデルコース付きで、AIドライブプランナーでそのままプラン作成もできます。";
const url = "https://www.ai-drive-planner.com/routes";

export const metadata: Metadata = {
  title,
  description,
  keywords: "ドライブルート おすすめ,日帰りドライブ コース,ドライブ 目的地 一覧,ドライブプラン 出発地別",
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  alternates: {
    canonical: url,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
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
        name: "ドライブルート一覧",
        item: url,
      },
    ],
  },
];

export default function RoutesIndexPage() {
  const grouped = getRoutesByRegion();
  const regions = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-slate-400 mb-4 space-x-1">
          <Link href="/" className="hover:text-blue-500">
            AIドライブプランナー
          </Link>
          <span>/</span>
          <span className="text-slate-500">ドライブルート一覧</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          人気ドライブルート一覧｜出発地から探すおすすめコース
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          出発地別に人気のドライブルートをまとめました。各ルートページでは距離・所要時間・高速料金の目安、モデルコース、渋滞回避のポイントを紹介しています。気になるルートが見つかったら、そのままAIドライブプランナーで詳細プランを自動作成できます。
        </p>

        {regions.map((region) => (
          <section key={region} className="mt-8">
            <h2 className="text-base font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">
              {region}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped[region].map((route) => (
                <li key={route.slug}>
                  <Link
                    href={`/routes/${route.slug}`}
                    className="flex items-center justify-between h-full p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {route.from}から{route.to}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {route.distanceKm}・{route.driveTime}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-10 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <MapPin className="w-5 h-5" />
            出発地・目的地を自由に入力してプラン作成
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
