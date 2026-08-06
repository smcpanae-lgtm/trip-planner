import type { Metadata } from "next";

/**
 * AI旅行記メーカー（/shiori, /en/shiori）まわりのSEO用ヘルパー。
 * 日本語版・英語版で canonical・hreflang・OGP等を同じロジックから組み立て、
 * メタ情報の二重管理を避ける（/life-map の lib/lifemap/seo.ts と同方式）。
 */

export const SITE_ORIGIN = "https://www.ai-drive-planner.com";

export type ShioriLocale = "ja" | "en";

const PATH: Record<ShioriLocale, string> = {
  ja: "/shiori",
  en: "/en/shiori",
};

export function shioriPath(locale: ShioriLocale): string {
  return PATH[locale];
}

/**
 * 常にクエリパラメータを含まない固定URLを返す。
 * 世界遺産パスポートの各遺産ページから ?source=heritage&ids=... 付きでアクセスされても、
 * canonical・hreflang・sitemapはこの固定URLのみを指す（重複コンテンツ扱いを避けるため）。
 */
export function shioriUrl(locale: ShioriLocale): string {
  return `${SITE_ORIGIN}${PATH[locale]}`;
}

const OGP_IMAGE: Record<ShioriLocale, { url: string; width: number; height: number }> = {
  ja: {
    url: `${SITE_ORIGIN}/ogp-shiori.jpg`,
    width: 1200,
    height: 630,
  },
  // 画像ファイルは未用意（後日差し替え予定）。参照設定のみ先に用意する。
  // Next.jsはOG画像のURL文字列をビルド時に検証しないため、ファイルが無くてもビルドは通る。
  en: {
    url: `${SITE_ORIGIN}/ogp-shiori-en.jpg`,
    width: 1200,
    height: 630,
  },
};

interface LocaleCopy {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  twitterDescription: string;
  keywords: string;
  ogLocale: string;
  ogImageAlt: string;
}

const COPY: Record<ShioriLocale, LocaleCopy> = {
  ja: {
    title: "AI旅行記メーカー｜旅行日記を無料で作成、旅の記録アプリ不要",
    description:
      "写真・場所・日付・メモから、AIが旅行日記を無料で作成。旅の思い出をA4 PDF、SNS投稿文、ブログ用アイキャッチ画像として保存できます。写真そのものはAIに送信せず、専用の旅の記録アプリは不要で、旅行後の思い出整理にすぐ使える無料ツールです。",
    ogTitle: "AI旅行記メーカー｜旅行日記を無料で作成",
    ogDescription:
      "写真・場所・日付・メモから、AIが旅行日記を無料で作成。旅の思い出をPDF・SNS投稿文・アイキャッチ画像として保存できます。",
    twitterDescription:
      "写真・場所・日付・メモから、AIが旅行日記を無料で作成。専用アプリ不要で、旅行後の思い出整理にすぐ使えます。",
    keywords:
      "旅行日記 作成 無料,旅の記録 アプリ 不要,AI旅行記,旅行記 メーカー,旅の思い出 PDF,旅行日記 AI 無料",
    ogLocale: "ja_JP",
    ogImageAlt: "AI旅行記メーカー｜写真とメモから旅の思い出をAI旅行記に",
  },
  en: {
    title: "AI Travel Diary Maker – Free Travel Journal from Photos & Notes (No App)",
    description:
      "Create a free travel journal with AI from your photos, places, dates, and notes. Save your trip memories as an A4 PDF, a social media caption, or a blog cover image. Your photos themselves are never sent to the AI, no dedicated travel-log app is required, and it's ready to use right after your trip to organize memories.",
    ogTitle: "AI Travel Diary Maker – Create a Free Travel Journal",
    ogDescription:
      "Create a free travel journal with AI from your photos, places, dates, and notes. Save it as a PDF, a social media caption, or a blog cover image.",
    twitterDescription:
      "Create a free AI travel journal from your photos, places, dates, and notes. No app required — perfect for organizing memories after a trip.",
    keywords:
      "free travel journal maker,AI travel diary,travel diary generator,no app travel journal,travel memories PDF,AI travel journal free",
    ogLocale: "en_US",
    ogImageAlt: "AI Travel Diary Maker | Turn photos and notes into an AI travel journal",
  },
};

export function buildShioriMetadata(locale: ShioriLocale): Metadata {
  const c = COPY[locale];
  const url = shioriUrl(locale);
  const image = OGP_IMAGE[locale];

  return {
    title: c.title,
    description: c.description,
    keywords: c.keywords,
    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      type: "website",
      locale: c.ogLocale,
      siteName: locale === "en" ? "AI Drive Planner" : "AI ドライブプランナー",
      url,
      images: [
        {
          url: image.url,
          secureUrl: image.url,
          type: "image/jpeg",
          width: image.width,
          height: image.height,
          alt: c.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.twitterDescription,
      images: [image.url],
    },
    alternates: {
      // 遺産ページからのCTAで ?source=heritage&ids=... 付きのURLが1,273通り生まれるが、
      // ここは常にクエリなしの固定URLを返す（重複コンテンツ化を避ける）。
      canonical: url,
      languages: {
        ja: shioriUrl("ja"),
        en: shioriUrl("en"),
        // 依頼どおり x-default は日本語版（/shiori）を指す（/life-map はen既定だが、こちらは仕様として明示指定）。
        "x-default": shioriUrl("ja"),
      },
    },
  };
}

type ShioriFaq = { q: string; a: string };

const FAQS: Record<ShioriLocale, ShioriFaq[]> = {
  ja: [
    {
      q: "専用の旅行記録アプリは必要ですか？",
      a: "いいえ、不要です。写真とメモ、または人生体験マップ・世界遺産パスポートに保存した記録があれば、このページだけで旅行日記を作成できます。会員登録も不要です。",
    },
    {
      q: "写真はAIに送信されますか？",
      a: "写真そのものは端末内で扱い、AIには送信されません。送信するのは、地名・日付・メモ・タイトル・記録者名・設定などの文字情報だけです。",
    },
    {
      q: "作成したデータはどこに保存されますか？",
      a: "下書き保存を押した場合、写真・場所・メモ等のデータはお使いのブラウザ内のlocalStorageにのみ保存されます。サーバー送信やクラウドへの自動バックアップは行いません。",
    },
    {
      q: "料金はかかりますか？",
      a: "無料です。旅行日記の作成、SNS投稿文の作成、アイキャッチ画像の保存、PDF保存まですべて無料でご利用いただけます。",
    },
  ],
  en: [
    {
      q: "Do I need a dedicated travel-log app?",
      a: "No. You only need photos and notes — or records already saved in Life Experience Map or World Heritage Passport — to create a travel journal on this page alone. No account or sign-up is required.",
    },
    {
      q: "Are my photos sent to the AI?",
      a: "Your photos themselves are handled on your device and are never sent to the AI. Only text — place names, dates, your notes, and the title and settings you enter — is sent to generate your journal.",
    },
    {
      q: "Where is my data stored?",
      a: "If you save a draft, your photos, places, and notes are stored only in your browser's localStorage. Nothing is sent to a server or automatically backed up to the cloud.",
    },
    {
      q: "Is there a fee?",
      a: "It's completely free — creating the journal, generating a social media caption, saving the cover image, and saving a PDF are all free to use.",
    },
  ],
};

export function buildShioriFaqJsonLd(locale: ShioriLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS[locale].map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

/**
 * SoftwareApplication構造化データ。
 * 実際のレビューが存在しないため、aggregateRating/ratingValue/reviewCountは
 * 意図的に含めない（虚偽のレビュー情報になるため）。
 */
export function buildShioriSoftwareApplicationJsonLd(locale: ShioriLocale) {
  const c = COPY[locale];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: locale === "en" ? "AI Travel Diary Maker" : "AI旅行記メーカー",
    description: c.description,
    url: shioriUrl(locale),
    applicationCategory: "TravelApplication",
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
