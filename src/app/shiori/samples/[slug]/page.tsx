import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { SITE_ORIGIN } from "@/lib/shiori/seo";
import { SHIORI_SAMPLES, sampleImagePath, shioriSample } from "@/data/shiori-samples";

/** 5本すべてをビルド時に静的生成する */
export function generateStaticParams() {
  return SHIORI_SAMPLES.map((sample) => ({ slug: sample.slug }));
}

/** 未知のスラッグは静的な404にする */
export const dynamicParams = false;

function sampleUrl(slug: string): string {
  return `${SITE_ORIGIN}/shiori/samples/${slug}`;
}

function sampleTitle(destination: string): string {
  return `${destination}の旅行記サンプル｜AI旅行記メーカー`;
}

function sampleDescription(listingIntro: string): string {
  return `${listingIntro}｜AI旅行記メーカーで作成した旅行記のサンプルです。`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sample = shioriSample(slug);
  if (!sample) return {};

  const title = sampleTitle(sample.destination);
  const description = sampleDescription(sample.listingIntro);
  const url = sampleUrl(sample.slug);
  // OGPは共通画像ではなく、そのサンプル自身のアイキャッチを指す
  const ogImage = `${SITE_ORIGIN}${sampleImagePath(sample.slug)}`;

  return {
    title,
    description,
    keywords: sample.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: "ja_JP",
      siteName: "AI ドライブプランナー",
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: sample.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShioriSamplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sample = shioriSample(slug);
  if (!sample) notFound();

  const title = sampleTitle(sample.destination);
  const description = sampleDescription(sample.listingIntro);
  const url = sampleUrl(sample.slug);
  const others = SHIORI_SAMPLES.filter((s) => s.slug !== sample.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: sample.title,
      description,
      url,
      image: `${SITE_ORIGIN}${sampleImagePath(sample.slug)}`,
      datePublished: "2026-08-06",
      dateModified: "2026-08-06",
      inLanguage: "ja",
      author: {
        "@type": "Organization",
        name: "AI ドライブプランナー",
        url: "https://www.ai-drive-planner.com",
      },
      publisher: {
        "@type": "Organization",
        name: "AI ドライブプランナー",
        url: "https://www.ai-drive-planner.com",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
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
          item: `${SITE_ORIGIN}/shiori/samples`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: sample.title,
          item: url,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-[900px] mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-xs font-bold tracking-wide text-rose-900 uppercase">
            {sample.destination}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
            {sample.title}
          </h1>
        </div>

        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sampleImagePath(sample.slug)}
            alt={sample.imageAlt}
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl border border-slate-200 bg-slate-50"
          />
          <figcaption className="mt-2 text-xs text-slate-500">
            イラストはイメージです。実際の風景写真ではありません。
          </figcaption>
        </figure>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-bold text-amber-900">
          これはAI旅行記メーカーで生成した文章の例です。実在の旅行記ではありません。
        </div>

        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-3">入力メモ</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 py-2 font-bold text-slate-600 whitespace-nowrap">日付</th>
                  <th className="px-3 py-2 font-bold text-slate-600 whitespace-nowrap">場所</th>
                  <th className="px-3 py-2 font-bold text-slate-600">メモ</th>
                </tr>
              </thead>
              <tbody>
                {sample.memo.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-2 font-medium text-stone-900 whitespace-nowrap">
                      {row.place}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-3">完成した旅行記</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <p className="font-bold text-stone-900">{sample.title}</p>
            {sample.body.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-3">SNS投稿文</h2>
          <blockquote className="border-l-4 border-rose-200 bg-rose-50/50 rounded-r-xl px-4 py-3 text-sm leading-relaxed text-slate-700">
            {sample.sns}
          </blockquote>
        </section>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-700">あなたの旅行記も無料で作れます</p>
          <Link
            href="/shiori"
            className="mt-3 inline-flex items-center gap-2 bg-rose-800 hover:bg-rose-900 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            AI旅行記メーカー
          </Link>
        </div>

        <section>
          <h2 className="text-sm font-bold text-slate-500 mb-3">他のサンプルを見る</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/shiori/samples/${other.slug}`}
                  className="block h-full bg-white rounded-xl border border-slate-200 p-4 hover:border-rose-300 hover:bg-rose-50/30 transition-colors"
                >
                  <p className="text-xs font-bold text-rose-800">{other.destination}</p>
                  <p className="mt-1 text-sm font-bold text-stone-900">{other.title}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/shiori/samples"
            className="mt-4 inline-block text-sm text-rose-800 underline hover:text-rose-900"
          >
            サンプル一覧に戻る
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
