import type { Metadata } from "next";
import ShioriClient from "@/components/shiori/ShioriClient";
import SiteFooter from "@/components/SiteFooter";
import {
  buildShioriMetadata,
  buildShioriFaqJsonLd,
  buildShioriSoftwareApplicationJsonLd,
  shioriUrl,
} from "@/lib/shiori/seo";
import { EN_LANDING } from "@/lib/shiori/i18n/enLanding";

export const metadata: Metadata = buildShioriMetadata("en");

const jsonLd = [
  buildShioriSoftwareApplicationJsonLd("en"),
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "AI Travel Diary Maker – Create a Free Travel Journal",
    description:
      "Create a free travel journal with AI from your photos, places, dates, and notes. Your photos are never sent to the AI, and no dedicated travel-log app is required.",
    url: shioriUrl("en"),
    isPartOf: {
      "@type": "WebSite",
      name: "AI Drive Planner",
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
        name: "AI Drive Planner",
        item: "https://www.ai-drive-planner.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AI Travel Diary Maker",
        item: shioriUrl("en"),
      },
    ],
  },
  buildShioriFaqJsonLd("en"),
];

// JavaScript実行前(＝クローラーやJS無効ブラウザ)でも英語の本文が見えるよう、
// ヒーロー部分は静的なサーバーコンポーネントとして描画する（/en/life-map と同方式）。
function ShioriEnHero() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 pt-8 pb-2">
      <p className="text-xs font-bold tracking-wide text-rose-900 uppercase">
        {EN_LANDING.eyebrow}
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
        {EN_LANDING.headline}
      </h1>
      <p className="mt-1.5 text-sm font-semibold text-slate-600">{EN_LANDING.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-[70ch]">
        {EN_LANDING.intro}
      </p>
      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
        {EN_LANDING.differentiators.map((item) => (
          <li
            key={item.title}
            className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3"
          >
            <p className="text-[13px] font-bold text-stone-900">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ShioriEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShioriEnHero />
      <ShioriClient initialOutputLanguage="en" respectStoredLang={false} />
      <SiteFooter locale="en" />
    </>
  );
}
