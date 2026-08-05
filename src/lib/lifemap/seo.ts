import type { Metadata } from "next";
import { translations, type LangCode } from "./i18n/dictionaries";

/**
 * 人生体験マップ 英語版静的ページ（/en/life-map）まわりのSEO用ヘルパー。
 * 日本語版 /life-map と英語版で canonical・hreflang・OGP等を同じロジックから組み立て、
 * メタ情報の二重管理を避ける。
 */

export const SITE_ORIGIN = "https://www.ai-drive-planner.com";

// 末尾スラッシュなしが実際の配信形態（/life-map/ は /life-map へ308リダイレクトされる、
// next.config.tsに trailingSlash 指定なし＝Next.jsのデフォルト挙動）。
// canonical・hreflang・sitemap.ts は必ずこの形式（末尾スラッシュなし）に統一すること。
export type LifeMapLocale = "ja" | "en";

const PATH: Record<LifeMapLocale, string> = {
  ja: "/life-map",
  en: "/en/life-map",
};

export function lifeMapPath(locale: LifeMapLocale): string {
  return PATH[locale];
}

export function lifeMapUrl(locale: LifeMapLocale): string {
  return `${SITE_ORIGIN}${PATH[locale]}`;
}

// OGP画像は当面ja/en共通の既存画像を流用。英語版専用画像を用意したら
// ここを差し替えるだけで済むよう定数化しておく。
const OGP_IMAGE = {
  url: `${SITE_ORIGIN}/ogp-lifemap.jpg?v=2`,
  width: 1200,
  height: 675,
};

interface LocaleCopy {
  title: string;
  ogTitle: string;
  description: string;
  ogDescription: string;
  twitterDescription: string;
  keywords: string;
  ogLocale: string;
}

const COPY: Record<LifeMapLocale, LocaleCopy> = {
  ja: {
    title:
      "人生体験マップ｜行った場所を記録する地図アプリ・人生でやりたいことリストの実績版",
    ogTitle: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できる非公開のライフログ。人生でやりたいことリストの達成記録としても使え、記録は端末内にのみ保存、県別・時系列で振り返れます。",
    ogDescription:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できるライフログ。人生でやりたいことリストの達成記録としても使えます。",
    twitterDescription:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できるライフログ。県別・時系列で思い出を振り返れます。",
    keywords:
      "人生でやりたいことリスト 地図,行った場所 記録 マップ,人生体験マップ,ライフログ 地図,旅行記録 アプリ,思い出 地図 記録",
    ogLocale: "ja_JP",
  },
  en: {
    title:
      "Places I've Been Map — Private Travel Log & Bucket List Tracker (No Account)",
    ogTitle: "Places I've Been Map | Private Travel Log & Bucket List Tracker",
    description:
      "A private map of every place you've been — trips, hikes, meals, and more, with photos. The achievement log version of your bucket list. No account, no sign-up, 100% free, and your data never leaves your device.",
    ogDescription:
      "A private map of places you've visited — trips, hikes, meals, and more. No account needed, completely free, and your data never leaves your device.",
    twitterDescription:
      "Track every place you've been on a private map. No account, no sign-up, free — your data stays on your device.",
    keywords:
      "places I've been map,map of places visited,bucket list map,travel log map,private travel journal,no account travel map",
    ogLocale: "en_US",
  },
};

export function buildLifeMapMetadata(locale: LifeMapLocale): Metadata {
  const c = COPY[locale];
  const url = lifeMapUrl(locale);

  return {
    title: c.title,
    description: c.description,
    keywords: c.keywords,
    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      type: "website",
      locale: c.ogLocale,
      siteName: "AI ドライブプランナー",
      url,
      images: [
        {
          url: OGP_IMAGE.url,
          secureUrl: OGP_IMAGE.url,
          type: "image/jpeg",
          width: OGP_IMAGE.width,
          height: OGP_IMAGE.height,
          alt: c.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.twitterDescription,
      images: [OGP_IMAGE.url],
    },
    alternates: {
      canonical: url,
      languages: {
        ja: lifeMapUrl("ja"),
        en: lifeMapUrl("en"),
        "x-default": lifeMapUrl("en"),
      },
    },
  };
}

/**
 * guide.faqs（画面上に実際に表示されているFAQ本文）をそのままFAQPage構造化データにする。
 * 表示内容と構造化データを常に一致させるため、文言をここに複製しない。
 */
export function buildLifeMapFaqJsonLd(locale: LifeMapLocale) {
  const langCode: LangCode = locale;
  const faqs = translations[langCode].guide.faqs;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function buildLifeMapWebApplicationJsonLd(locale: LifeMapLocale) {
  const c = COPY[locale];
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: locale === "en" ? "Life Experience Map" : "人生体験マップ",
    description: c.description,
    url: lifeMapUrl(locale),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
  };
}
