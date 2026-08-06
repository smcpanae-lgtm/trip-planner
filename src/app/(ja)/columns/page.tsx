import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { COLUMNS } from "@/data/columns";
import SiteFooter from "@/components/SiteFooter";

const title = "ドライブ旅行コラム一覧｜持ち物・渋滞対策・お得情報";
const description =
  "ドライブ旅行に役立つ持ち物リスト、渋滞回避のコツ、犬連れ・子連れ旅行の準備、高速道路のお得な使い方などをまとめたコラム記事一覧です。";
const url = "https://www.ai-drive-planner.com/columns";

export const metadata: Metadata = {
  title,
  description,
  keywords: "ドライブ 持ち物,ドライブ 渋滞対策,犬連れ旅行,子連れドライブ,ETC割引,SA PA 使い方",
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
        name: "コラム一覧",
        item: url,
      },
    ],
  },
];

export default function ColumnsIndexPage() {
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
          <span className="text-slate-500">コラム一覧</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          ドライブ旅行コラム一覧｜持ち物・渋滞対策・お得情報
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          持ち物リストや渋滞回避のコツ、犬連れ・子連れ旅行の準備、高速道路のお得な使い方など、ドライブ旅行をより快適にするための情報をまとめました。
        </p>

        <ul className="mt-8 space-y-3">
          {COLUMNS.map((column) => (
            <li key={column.slug}>
              <Link
                href={`/columns/${column.slug}`}
                className="flex items-center justify-between h-full p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <div>
                  <p className="text-[11px] font-bold text-blue-500">{column.category}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{column.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {column.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 ml-3" />
              </Link>
            </li>
          ))}
        </ul>

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
