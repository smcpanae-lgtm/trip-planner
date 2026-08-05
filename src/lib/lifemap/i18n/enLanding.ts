/**
 * /en/life-map 専用のランディング文言（英語のみ）。
 * アプリ本体のUI文言は dictionaries.ts の `en` をそのまま使うため二重管理にはしない。
 * ここに置くのは英語圏の検索流入を狙った、JSレンダリング前から見えるヒーロー文言のみ。
 */
export const EN_LANDING = {
  eyebrow: "Places I've Been Map",
  headline: "A private map of everywhere you've been.",
  tagline: "The achievement log version of your bucket list.",
  intro:
    "Turn every trip, hike, meal, and outing into pins on your own map of places visited — a private travel log that also works as a bucket list map. No account, no sign-up, and your data never leaves your device.",
  differentiators: [
    {
      title: "No account, no sign-up",
      body: "Open the page and start recording — nothing to create, nothing to remember.",
    },
    {
      title: "Your data never leaves your device",
      body: "Everything is stored locally in your browser. Nothing is uploaded to any server.",
    },
    {
      title: "Completely private",
      body: "This isn't a social network. Nothing you record is ever public or shared.",
    },
    {
      title: "Free",
      body: "Every feature, including share-image generation, is free to use.",
    },
  ],
} as const;
