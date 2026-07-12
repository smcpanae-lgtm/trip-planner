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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "AIドライブプランナーは無料で使えますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、出発地・目的地・時刻の入力からプラン作成まで無料でご利用いただけます。",
      },
    },
    {
      "@type": "Question",
      name: "犬連れドライブにも対応していますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "対応しています。犬連れ旅行を選択すると、ドッグラン併設のSA/PAや休憩ポイントを考慮したプランを作成します。",
      },
    },
    {
      "@type": "Question",
      name: "会員登録は必要ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "会員登録は不要です。出発地・目的地などの条件を入力するだけで、すぐにプランを作成できます。",
      },
    },
    {
      "@type": "Question",
      name: "プランの所要時間や料金の精度はどれくらいですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AIが提案する所要時間・距離・高速料金などは目安です。実際の道路状況や料金改定により変動するため、出発前に最新情報をご確認ください。",
      },
    },
    {
      "@type": "Question",
      name: "作成したプランは保存やシェアができますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "作成したプランは印刷やテキストコピーで保存でき、SNSでシェアすることもできます。",
      },
    },
  ],
};

const jsonLd = {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
