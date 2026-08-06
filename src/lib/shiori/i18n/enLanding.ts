/**
 * /en/shiori 専用のランディング文言（英語のみ）。
 * アプリ本体のUI文言は ShioriClient の uiLabel(en) をそのまま使うため二重管理にはしない。
 * ここに置くのは英語圏の検索流入を狙った、JSレンダリング前から見えるヒーロー文言のみ
 * （/en/life-map の lib/lifemap/i18n/enLanding.ts と同方式）。
 */
export const EN_LANDING = {
  eyebrow: "AI Travel Diary Maker",
  headline: "Turn photos and notes into an AI travel journal, free.",
  tagline: "No dedicated travel-log app required.",
  intro:
    "Using places, dates, and notes you've saved in Life Map — or photos you upload directly — AI writes a travel journal from the recorder's point of view. Save it as an SNS post caption, a blog eye-catch image, or a one-page A4 PDF. This is a tool for organizing memories after a trip, not for planning one.",
  differentiators: [
    {
      title: "No app, no account",
      body: "Open the page and start — nothing to install, nothing to sign up for.",
    },
    {
      title: "Your photos stay on your device",
      body: "Photos are processed locally. Only place names, dates, and your notes are sent to the AI.",
    },
    {
      title: "Free to use",
      body: "Journal generation, SNS captions, the eye-catch image, and PDF export are all free.",
    },
    {
      title: "Works with your existing records",
      body: "Pulls straight from Life Map or World Heritage Passport entries you've already saved.",
    },
  ],
} as const;
