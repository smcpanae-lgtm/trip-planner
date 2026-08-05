import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import { COLUMNS, getColumnBySlug } from "@/data/columns";
import { getRouteBySlug } from "@/data/routes";
import SiteFooter from "@/components/SiteFooter";

export function generateStaticParams() {
  return COLUMNS.map((column) => ({ slug: column.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const column = getColumnBySlug(slug);
  if (!column) return {};

  const url = `https://www.ai-drive-planner.com/columns/${column.slug}`;

  return {
    title: column.title,
    description: column.description,
    keywords: `${column.category},ドライブ旅行,${column.title}`,
    openGraph: {
      title: column.title,
      description: column.description,
      type: "article",
      locale: "ja_JP",
      siteName: "AI ドライブプランナー",
      url,
    },
    twitter: {
      card: "summary",
      title: column.title,
      description: column.description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ColumnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const column = getColumnBySlug(slug);
  if (!column) notFound();

  const url = `https://www.ai-drive-planner.com/columns/${column.slug}`;
  const relatedRoutes = (column.relatedRouteSlugs ?? [])
    .map((s) => getRouteBySlug(s))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: column.title,
      description: column.description,
      datePublished: column.publishedDate,
      dateModified: column.updatedDate,
      url,
      author: {
        "@type": "Organization",
        name: "AI ドライブプランナー",
      },
      publisher: {
        "@type": "Organization",
        name: "AI ドライブプランナー",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "AIドライブプランナー",
          item: "https://www.ai-drive-planner.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "コラム一覧",
          item: "https://www.ai-drive-planner.com/columns",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: column.title,
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
          <Link href="/columns" className="hover:text-blue-500">
            コラム一覧
          </Link>
          <span>/</span>
          <span className="text-slate-500">{column.category}</span>
        </nav>

        <p className="text-[11px] font-bold text-blue-500">{column.category}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-800 leading-snug">
          {column.title}
        </h1>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="w-3.5 h-3.5" />
          更新日: {column.updatedDate}
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{column.summary}</p>

        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <MapPin className="w-5 h-5" />
          AIでドライブプランを自動作成する
        </a>

        <div className="mt-8 space-y-6">
          {column.sections.map((section, i) => (
            <section key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-bold text-slate-800 mb-3">{section.heading}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-6 bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">まとめ</h2>
          <ul className="space-y-1.5">
            {column.takeaways.map((point, i) => (
              <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                <span className="text-blue-500 shrink-0">・</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {relatedRoutes.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold text-slate-700 mb-3">関連するドライブルート</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedRoutes.map((route) => (
                <li key={route.slug}>
                  <Link
                    href={`/routes/${route.slug}`}
                    className="block h-full p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <p className="text-sm font-bold text-slate-800">
                      {route.from}から{route.to}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {route.distanceKm}・{route.driveTime}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <MapPin className="w-5 h-5" />
            出発地・目的地を入力してプランを作る
          </a>
        </div>

        <div className="mt-6 text-center">
          <Link href="/columns" className="text-xs text-slate-400 hover:text-blue-500 underline">
            他のコラムを見る
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
