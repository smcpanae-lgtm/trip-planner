import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import LifeMapClient from "@/components/lifemap/LifeMapClient";
import SiteFooter from "@/components/SiteFooter";
import {
  buildLifeMapMetadata,
  buildLifeMapFaqJsonLd,
  buildLifeMapWebApplicationJsonLd,
  lifeMapUrl,
} from "@/lib/lifemap/seo";
import { EN_LANDING } from "@/lib/lifemap/i18n/enLanding";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-lifemap",
  display: "swap",
});

export const metadata: Metadata = buildLifeMapMetadata("en");

const jsonLd = [
  buildLifeMapWebApplicationJsonLd("en"),
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Places I've Been Map | Private Travel Log & Bucket List Tracker",
    description:
      "A private map of places you've visited — trips, hikes, meals, and more. No account needed, completely free, and your data never leaves your device.",
    url: lifeMapUrl("en"),
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
        name: "Life Experience Map",
        item: lifeMapUrl("en"),
      },
    ],
  },
  // ページ下部の「よくある質問」セクション（LifeMapGuide, lang=en）と同一内容を辞書から生成
  buildLifeMapFaqJsonLd("en"),
];

// JavaScript実行前(＝クローラーやJS無効ブラウザ)でも英語の本文が見えるよう、
// ヒーロー部分は静的なサーバーコンポーネントとして描画する。
function LifeMapEnHero() {
  return (
    <section className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] pt-10 pb-2">
      <p className="text-[12px] font-bold tracking-wide text-[#1C7A66] uppercase">
        {EN_LANDING.eyebrow}
      </p>
      <h1 className="mt-2 text-[26px] sm:text-[32px] font-extrabold text-[#2B2721] leading-tight">
        {EN_LANDING.headline}
      </h1>
      <p className="mt-1.5 text-[14px] font-semibold text-[#6B6357]">
        {EN_LANDING.tagline}
      </p>
      <p className="mt-3 text-[13.5px] leading-relaxed text-[#6B6357] max-w-[62ch]">
        {EN_LANDING.intro}
      </p>
      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
        {EN_LANDING.differentiators.map((item) => (
          <li
            key={item.title}
            className="bg-white rounded-[14px] border border-[#EEE7DA] px-4 py-3"
          >
            <p className="text-[13px] font-extrabold text-[#2B2721]">{item.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6B6357]">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LifeMapEnPage() {
  return (
    <div className={notoSansJP.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LifeMapEnHero />
      <LifeMapClient initialLang="en" respectStoredLang={false} />
      <SiteFooter locale="en" />
    </div>
  );
}
