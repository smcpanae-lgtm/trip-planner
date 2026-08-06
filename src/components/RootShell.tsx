import type { Metadata } from "next";
import Script from "next/script";

/**
 * 全ページ共通の <html>/<head>/<body> シェル。
 *
 * App Router では <html> を描画できるのはルートレイアウトだけで、子レイアウトからは
 * 上書きできない。またルートレイアウトはリクエストのパスを知る手段が無い
 * （headers() を読むと動的レンダリングになりSSGが壊れる）。
 * そのため言語別の <html lang> を静的に出力する唯一の方法として、
 * ルートグループ (ja)/(en) ごとにルートレイアウトを分割している。
 *
 * head の内容・metadata・JSON-LD はこのファイルで一元管理し、
 * 各グループのレイアウトは lang を渡すだけの薄い層に留める（二重管理を避けるため）。
 */

export const SITE_METADATA: Metadata = {
  title: "AI ドライブプランナー｜車旅行プランを自動作成",
  description:
    "出発地・目的地・時刻を入力するだけでAIが車旅行プランを自動作成。高速道路ルート・SA/PA食事・犬連れ対応。",
  keywords:
    "AI ドライブプラン,車旅行 AI,ドライブプラン 自動作成,AI旅行プランナー,車で旅行,ドライブ旅行,旅行計画,高速道路ルート,SA PA 食事,犬連れ旅行,旅行プランナー,日帰り旅行,旅行ルート",
  openGraph: {
    title: "AI ドライブプランナー｜車旅行プランを自動作成",
    description:
      "出発地・目的地・時刻を入力するだけでAIが車旅行プランを自動作成。高速道路ルート・SA/PA食事・犬連れ対応。",
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url: "https://www.ai-drive-planner.com/",
    images: [
      {
        url: "https://www.ai-drive-planner.com/og-image-v2.jpg",
        secureUrl: "https://www.ai-drive-planner.com/og-image-v2.jpg",
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: "AI ドライブプランナー｜車旅行プランを自動作成",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI ドライブプランナー｜車旅行プランを自動作成",
    description:
      "出発地・目的地・時刻を入力するだけでAIが車旅行プランを自動作成。高速道路ルート・SA/PA食事・犬連れ対応。",
    images: [
      {
        url: "https://www.ai-drive-planner.com/og-image-v2.jpg",
        alt: "AI ドライブプランナー｜車旅行プランを自動作成",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.ai-drive-planner.com",
  },
  metadataBase: new URL("https://www.ai-drive-planner.com"),
};

/**
 * サイト共通の WebApplication JSON-LD（ドライブプランナー本体の説明）。
 * ページ固有の JSON-LD は各ページ側で別途出力しており、ここでは扱わない。
 * 英語ページで日本語の名前・説明・inLanguage が出るのを避けるため lang 別に持つ。
 * url は英語トップページが存在しないため両言語ともサイトルートを指す。
 */
const SITE_JSON_LD: Record<"ja" | "en", Record<string, unknown>> = {
  ja: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI ドライブプランナー",
    description:
      "出発地・目的地・時刻を入力するだけでAIが車旅行プランを自動作成。高速道路ルート・SA/PA食事・犬連れ対応。",
    url: "https://www.ai-drive-planner.com",
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    inLanguage: "ja",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    featureList: [
      "AIによる車旅行プラン自動作成",
      "高速道路ルート・IC情報",
      "SA/PAでの食事提案",
      "犬連れ旅行対応",
      "Googleマップ連携",
      "日帰り〜複数泊プラン対応",
    ],
    creator: {
      "@type": "Organization",
      name: "AI ドライブプランナー",
    },
  },
  en: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AI Drive Planner",
    description:
      "AI builds a car trip plan automatically from your departure point, destination, and times — expressway routes, meals at service areas, and dog-friendly travel.",
    url: "https://www.ai-drive-planner.com",
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    featureList: [
      "AI-generated car trip plans",
      "Expressway routes and interchange info",
      "Meal suggestions at service and parking areas",
      "Dog-friendly travel",
      "Google Maps integration",
      "Day trips to multi-night plans",
    ],
    creator: {
      "@type": "Organization",
      name: "AI Drive Planner",
    },
  },
};

export default function RootShell({
  lang,
  children,
}: {
  lang: "ja" | "en";
  children: React.ReactNode;
}) {
  return (
    <html lang={lang}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD[lang]) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HHWEKHRG56"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HHWEKHRG56');
          `}
        </Script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
