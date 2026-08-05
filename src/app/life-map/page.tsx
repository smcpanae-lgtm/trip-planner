import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import LifeMapClient from "@/components/lifemap/LifeMapClient";
import SiteFooter from "@/components/SiteFooter";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-lifemap",
  display: "swap",
});

export const metadata: Metadata = {
  title: "人生体験マップ｜行った場所を記録する地図アプリ・人生でやりたいことリストの実績版",
  description:
    "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できる非公開のライフログ。人生でやりたいことリストの達成記録としても使え、記録は端末内にのみ保存、県別・時系列で振り返れます。",
  keywords:
    "人生でやりたいことリスト 地図,行った場所 記録 マップ,人生体験マップ,ライフログ 地図,旅行記録 アプリ,思い出 地図 記録",
  openGraph: {
    title: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できるライフログ。人生でやりたいことリストの達成記録としても使えます。",
    type: "website",
    locale: "ja_JP",
    siteName: "AI ドライブプランナー",
    url: "https://www.ai-drive-planner.com/life-map",
    images: [
      {
        url: "https://www.ai-drive-planner.com/ogp-lifemap.jpg?v=2",
        secureUrl: "https://www.ai-drive-planner.com/ogp-lifemap.jpg?v=2",
        type: "image/jpeg",
        width: 1200,
        height: 675,
        alt: "人生体験マップ｜行った場所を記録する地図アプリ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できるライフログ。県別・時系列で思い出を振り返れます。",
    images: ["https://www.ai-drive-planner.com/ogp-lifemap.jpg?v=2"],
  },
  alternates: {
    canonical: "https://www.ai-drive-planner.com/life-map",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "人生体験マップ｜行った場所を記録する地図アプリ",
    description:
      "旅行・釣り・食事・犬連れ・温泉・お城など、行った場所を写真つきで地図に記録できる非公開のライフログ。",
    url: "https://www.ai-drive-planner.com/life-map",
    isPartOf: {
      "@type": "WebSite",
      name: "AI ドライブプランナー",
      url: "https://www.ai-drive-planner.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AI ドライブプランナー",
        item: "https://www.ai-drive-planner.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "人生体験マップ",
        item: "https://www.ai-drive-planner.com/life-map",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    // ページ下部の「よくある質問」セクション（LifeMapGuide）と同一内容
    mainEntity: [
      {
        "@type": "Question",
        name: "記録したデータはどこに保存されますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "お使いの端末のブラウザ内（IndexedDB）にのみ保存されます。写真・メモ・位置情報を当サイトのサーバーへ送ることはなく、他の人に公開されることもありません。",
        },
      },
      {
        "@type": "Question",
        name: "会員登録は必要ですか？ 料金はかかりますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "どちらも不要です。登録なし・無料でそのままお使いいただけます。",
        },
      },
      {
        "@type": "Question",
        name: "機種変更やブラウザを変えるとデータはどうなりますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "端末やブラウザが変わると引き継がれません。ブラウザの「閲覧データの削除」でも消えてしまいます。「バックアップ書き出し」でファイルを保存し、新しい端末の同じページで「バックアップ復元」から読み込んでください。",
        },
      },
      {
        "@type": "Question",
        name: "写真に位置情報が入っていないときはどうすればいいですか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "地図をタップして場所を指定するか、都道府県だけを選んで登録できます。場所を残したくない場合は「場所情報なしで保存する」も選べます。",
        },
      },
      {
        "@type": "Question",
        name: "シェア画像に写真やメモは入りますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "入りません。画像に描かれるのは記録件数・カテゴリ別の件数・訪問した都道府県の塗りつぶしだけです。写真・メモ・場所の名前・座標は一切含まれません。画像の生成もすべてブラウザ内で完結します。",
        },
      },
      {
        "@type": "Question",
        name: "シェア画像はどうやってXに投稿しますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "「画像を保存」でPNGを保存し、「Xでシェア」で開いた投稿画面に添付してください。スマートフォンでは「画像ごとシェア」から、画像を付けたまま共有メニューに渡せます。",
        },
      },
      {
        "@type": "Question",
        name: "日本以外に住んでいますが使えますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "使えます。地図は世界中に対応し、表示言語は7言語から選べます。都道府県制覇マップは日本国内の記録があるときだけ表示され、ないときは体験統計カードをお使いいただけます。",
        },
      },
      {
        "@type": "Question",
        name: "記録は何件まで保存できますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "上限は端末の空き容量によります。写真は保存時に自動で圧縮されるため1件あたりの容量は抑えられていますが、容量が不足すると保存できなくなるため、こまめなバックアップをおすすめします。",
        },
      },
    ],
  },
];

export default function LifeMapPage() {
  return (
    <div className={notoSansJP.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LifeMapClient />
      <SiteFooter />
    </div>
  );
}
