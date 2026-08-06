import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { SITE_ORIGIN } from "@/lib/shiori/seo";
import { SHIORI_SAMPLES } from "@/data/shiori-samples";

const title = "旅行記のサンプル・例文5選｜AIが作った旅行日記の実例";
const description =
  "AI旅行記メーカーで実際に作成した旅行記のサンプルを5本掲載。京都・北海道・沖縄・金沢・しまなみ海道、入力メモから完成した文章までの流れが確認できます。";
const url = `${SITE_ORIGIN}/shiori/samples`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url,
    images: [
      {
        url: `${SITE_ORIGIN}/ogp-shiori.jpg`,
        width: 1200,
        height: 630,
        alt: "AI旅行記メーカー｜旅行記のサンプル",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${SITE_ORIGIN}/ogp-shiori.jpg`],
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
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
        name: "AI旅行記メーカー",
        item: `${SITE_ORIGIN}/shiori`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "旅行記のサンプル",
        item: url,
      },
    ],
  },
];

export default function ShioriSamplesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-xs font-bold tracking-wide text-rose-900 uppercase">Sample</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
            旅行記のサンプル・例文5選
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-[70ch]">
            AI旅行記メーカーで実際に作成した旅行記の例です。入力メモから、どのような文章に仕上がるかを確認できます。
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
          {SHIORI_SAMPLES.map((sample) => (
            <li key={sample.slug}>
              <Link
                href={`/shiori/samples/${sample.slug}`}
                className="block h-full bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
              >
                <p className="text-xs font-bold text-rose-800">{sample.destination}</p>
                <p className="mt-1.5 text-base font-bold text-stone-900">{sample.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{sample.listingIntro}</p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-700">あなたの旅行記も無料で作れます</p>
          <Link
            href="/shiori"
            className="mt-3 inline-flex items-center gap-2 bg-rose-800 hover:bg-rose-900 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            AI旅行記メーカーを使ってみる
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
