import type { Metadata } from "next";
import LifeMapClient from "@/components/lifemap/LifeMapClient";

export const metadata: Metadata = {
  title: "人生体験マップ｜写真で残す、あなたの思い出と地図",
  description:
    "旅行・釣り・食事・犬連れ・温泉・お城など、人生の体験を写真と場所で記録できる非公開のライフログ。記録は端末内にのみ保存され、県別・時系列で振り返れます。",
  openGraph: {
    title: "人生体験マップ｜写真で残す、あなたの思い出と地図",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、人生の体験を写真と場所で記録できるライフログ。県別・時系列で思い出を振り返れます。",
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url: "https://www.ai-drive-planner.com/life-map",
    images: [
      {
        url: "https://www.ai-drive-planner.com/ogp-lifemap.png",
        width: 1920,
        height: 1080,
        alt: "人生体験マップ｜写真で残す、あなたの思い出と地図",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "人生体験マップ｜写真で残す、あなたの思い出と地図",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、人生の体験を写真と場所で記録できるライフログ。県別・時系列で思い出を振り返れます。",
    images: ["https://www.ai-drive-planner.com/ogp-lifemap.png"],
  },
  alternates: {
    canonical: "https://www.ai-drive-planner.com/life-map",
  },
};

export default function LifeMapPage() {
  return <LifeMapClient />;
}
