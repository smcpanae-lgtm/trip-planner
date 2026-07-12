import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Ticket, AlertTriangle, CalendarDays, Dog } from "lucide-react";
import { ROUTES, getRouteBySlug } from "@/data/routes";
import SiteFooter from "@/components/SiteFooter";

export function generateStaticParams() {
  return ROUTES.map((route) => ({ slug: route.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = getRouteBySlug(slug);
  if (!route) return {};

  const title = `${route.from}から${route.to}へのドライブプラン｜所要時間・立ち寄りスポット`;
  const description = `${route.from}から${route.to}まで車で行くドライブルートを紹介。距離${route.distanceKm}・所要時間${route.driveTime}の目安、モデルコース、渋滞回避のポイント、犬連れ旅行のヒントまで、AIドライブプランナーが自動でプラン作成もできます。`;
  const url = `https://www.ai-drive-planner.com/routes/${route.slug}`;

  return {
    title,
    description,
    keywords: `${route.from} ${route.to} ドライブ,${route.from} ${route.to} 車,${route.to} ドライブプラン,${route.from}発 ${route.to}`,
    openGraph: {
      title,
      description,
      type: "article",
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
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);
  if (!route) notFound();

  const url = `https://www.ai-drive-planner.com/routes/${route.slug}`;
  const ctaHref = `/?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${route.from}から${route.to}へのドライブプラン｜所要時間・立ち寄りスポット`,
      description: route.summary,
      url,
      author: {
        "@type": "Organization",
        name: "AI ドライブプランナー",
      },
      publisher: {
        "@type": "Organization",
        name: "AI ドライブプランナー",
      },
      mainEntityOfPage: url,
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
          item: "https://www.ai-drive-planner.com/routes",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${route.from}から${route.to}へのドライブプラン`,
          item: url,
        },
      ],
    },
  ];

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
          <Link href="/routes" className="hover:text-blue-500">
            ドライブルート一覧
          </Link>
          <span>/</span>
          <span className="text-slate-500">
            {route.from}から{route.to}
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug">
          {route.from}から{route.to}へのドライブプラン｜所要時間・立ち寄りスポット
        </h1>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{route.summary}</p>

        <a
          href={ctaHref}
          className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <MapPin className="w-5 h-5" />
          このルートでAIプランを自動作成する
        </a>

        {/* Overview */}
        <section className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-3">ルート概要（目安）</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-slate-400">走行距離</dt>
                <dd className="font-bold text-slate-700">{route.distanceKm}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-slate-400">所要時間</dt>
                <dd className="font-bold text-slate-700">{route.driveTime}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ticket className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-slate-400">高速料金</dt>
                <dd className="font-bold text-slate-700">{route.tollYen}</dd>
              </div>
            </div>
          </dl>
          <p className="text-[11px] text-slate-400 mt-4">
            ※距離・時間・料金は目安です。実際の道路状況・出発地点により異なります。詳細は
            <a href="/#disclaimer" className="underline hover:text-blue-500">
              免責事項
            </a>
            をご確認ください。
          </p>
        </section>

        {/* Model course */}
        <section className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4">日帰りモデルコース</h2>
          <ol className="space-y-4">
            {route.modelCourse.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="shrink-0 w-14 text-xs font-bold text-blue-500 pt-0.5">
                  {item.time}
                </div>
                <div className="border-l-2 border-blue-100 pl-3 pb-1">
                  <p className="text-sm font-bold text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Congestion & season */}
        <section className="mt-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">渋滞・混雑の目安</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{route.congestionNote}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">おすすめシーズン</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{route.seasonNote}</p>
            </div>
          </div>
        </section>

        {/* Dog tip */}
        <section className="mt-6 bg-blue-50 rounded-xl border border-blue-100 p-5">
          <div className="flex items-start gap-2">
            <Dog className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">犬連れドライブのヒント</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{route.dogTip}</p>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center">
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <MapPin className="w-5 h-5" />
            {route.from}から{route.to}のプランをAIで作る
          </a>
        </div>

        <div className="mt-6 text-center">
          <Link href="/routes" className="text-xs text-slate-400 hover:text-blue-500 underline">
            他のドライブルートを見る
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
