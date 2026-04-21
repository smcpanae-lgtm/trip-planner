import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "AI ドライブプランナー｜車旅行プランを自動作成",
    description:
      "出発地・目的地・時刻を入力するだけでAIが車旅行プランを自動作成。高速道路ルート・SA/PA食事・犬連れ対応。",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://trip-planner-rho-five.vercel.app",
  },
  metadataBase: new URL("https://trip-planner-rho-five.vercel.app"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI ドライブプランナー",
  description:
    "出発地・目的地・時刻を入力するだけでAIが車旅行プランを自動作成。高速道路ルート・SA/PA食事・犬連れ対応。",
  url: "https://trip-planner-rho-five.vercel.app",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
