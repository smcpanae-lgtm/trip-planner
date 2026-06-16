import type { Metadata } from "next";
import LifeMapClient from "@/components/lifemap/LifeMapClient";

export const metadata: Metadata = {
  title: "人生体験マップ｜写真で残す、あなたの思い出日本地図",
  description:
    "旅行・釣り・食事・犬連れ・温泉・お城など、人生の体験を写真と場所で記録できる非公開のライフログ。記録は端末内にのみ保存され、県別・時系列で振り返れます。",
  robots: {
    // 個人の非公開ライフログ機能のため検索エンジンには登録しない
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://www.ai-drive-planner.com/life-map",
  },
};

export default function LifeMapPage() {
  return <LifeMapClient />;
}
