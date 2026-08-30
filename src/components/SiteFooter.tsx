const TOOLS_JA = [
  {
    href: "/",
    title: "AIドライブプランナー",
    description: "出発地・目的地を入力するだけでAIが車旅行プランを自動作成",
  },
  {
    href: "/heritage/",
    title: "世界遺産パスポート",
    description: "世界遺産の訪問記録をブラウザ内に保存できるスタンプラリー",
  },
  {
    href: "/life-map",
    title: "人生体験マップ",
    description: "行った場所を地図に記録する、人生でやりたいことリストの実績版",
  },
  {
    href: "/shiori",
    title: "AI旅行記メーカー",
    description: "写真とメモから旅行日記を無料で作成、旅の記録アプリ不要",
  },
  {
    href: "/routes",
    title: "人気ドライブルート一覧",
    description: "出発地別の人気ドライブコースを距離・所要時間の目安つきで紹介",
  },
  {
    href: "/columns",
    title: "ドライブ旅行コラム",
    description: "持ち物リストや渋滞回避のコツなど、ドライブ旅行に役立つ情報をまとめて紹介",
  },
];

// /en/life-map からのリンク用。関連ツールのうち英語で案内できるものだけを掲載。
const TOOLS_EN = [
  {
    href: "/",
    title: "AI Drive Planner",
    description: "Enter your start and destination — AI builds your road trip plan.",
  },
  {
    href: "/heritage/en",
    title: "World Heritage Passport",
    description: "A private stamp rally for tracking the World Heritage Sites you've visited.",
  },
  {
    href: "/en/shiori",
    title: "AI Travel Journal Maker",
    description: "Turn your photos and notes into a travel journal, free — no app required.",
  },
];

// /heritage/zh-hant からのリンク用。TOOLS_EN と同じ考え方で、
// まだ翻訳していない自社ツールは掲載しない（CTAはEnglish fallbackにする方針のため）。
const TOOLS_ZH_HANT = [
  {
    href: "/",
    title: "AI 自駕行程規劃",
    description: "只要輸入出發地與目的地，AI就能自動產生自駕旅行行程。",
  },
  {
    href: "/heritage/zh-hant",
    title: "世界遺產護照",
    description: "可將已造訪的世界遺產記錄保存在您自己的瀏覽器內的集章護照。",
  },
  {
    href: "/en/shiori",
    title: "AI Travel Journal Maker",
    description: "Turn your photos and notes into a travel journal, free — no app required.",
  },
];

/**
 * variant:
 * - "default": カード型。記事ページなど、フッターまで読み進めてもらう前提のページ用。
 * - "compact": 中黒区切りのテキストリンク1行。トップページのように本体が画面高いっぱいを
 *   使うページでは、カード型フッター（約350px）が少しスクロールしただけで画面を占有し、
 *   プラン作成画面が見えなくなってしまうため。内部リンク自体は残す。
 */
export default function SiteFooter({
  locale = "ja",
  variant = "default",
}: {
  locale?: "ja" | "en" | "zh-hant";
  variant?: "default" | "compact";
} = {}) {
  const tools = locale === "en" ? TOOLS_EN : locale === "zh-hant" ? TOOLS_ZH_HANT : TOOLS_JA;
  const heading = locale === "en" ? "Related tools" : locale === "zh-hant" ? "相關工具" : "関連ツール";
  const copyright =
    locale === "en"
      ? `© ${new Date().getFullYear()} AI Drive Planner`
      : locale === "zh-hant"
        ? `© ${new Date().getFullYear()} AI Drive Planner`
        : `© ${new Date().getFullYear()} AI ドライブプランナー`;

  if (variant === "compact") {
    return (
      <footer className="relative z-10 border-t border-slate-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
          {/* 見出しは省き、中黒区切りの1行にすることで高さを抑えつつリンク自体を大きく見せる */}
          <nav aria-label={heading} className="min-w-0">
            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {tools.map((tool, idx) => (
                <li key={tool.href} className="flex items-center gap-2">
                  <a
                    href={tool.href}
                    title={tool.description}
                    className="text-sm sm:text-base font-bold text-slate-700 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {tool.title}
                  </a>
                  {idx < tools.length - 1 && (
                    <span className="text-slate-300" aria-hidden="true">・</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-xs text-slate-400 shrink-0">{copyright}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 py-10">
        <nav aria-label={heading}>
          <h2 className="text-sm font-bold text-slate-500 mb-4">{heading}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <li key={tool.href}>
                <a
                  href={tool.href}
                  className="block h-full p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <p className="text-sm font-bold text-slate-800">{tool.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-slate-400 mt-8">{copyright}</p>
      </div>
    </footer>
  );
}
