import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "車で旅行プラン - AIが作る最適ドライブ旅行の工程表＆地図【無料】",
  description:
    "無料で使えるAI搭載ドライブ旅行プランナー。出発地・目的地を入力するだけで、AIが渋滞予測・休日混雑・季節イベントを考慮した最適な車旅プランを自動作成。Google Maps連携で実際の走行ルート表示、駐車場・食事スポット提案、犬連れ旅行にも対応。日帰りから4泊5日まで。",
  keywords:
    "車旅行,ドライブプラン,旅行計画,AI旅行,車で旅行,ドライブ旅行,旅程表,工程表,Google Maps,犬連れ旅行,旅行プランナー,車 旅行 計画,ドライブ 計画,日帰り旅行,旅行ルート",
  openGraph: {
    title: "車で旅行プラン - AIが作る最適ドライブ旅行の工程表＆地図",
    description:
      "無料AI搭載。出発地と目的地を入れるだけで最適な車旅プランを自動作成。渋滞予測・2プラン比較・食事提案・犬連れ対応。",
    type: "website",
    locale: "ja_JP",
    siteName: "車で旅行プラン",
  },
  twitter: {
    card: "summary_large_image",
    title: "車で旅行プラン - AIが作る最適ドライブ旅行プランナー【無料】",
    description:
      "出発地と目的地を入れるだけ。AIが渋滞予測・食事スポット・駐車場情報を含む最適ドライブプランを自動作成。",
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
