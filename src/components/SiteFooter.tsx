const TOOLS = [
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
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 py-10">
        <nav aria-label="関連ツール">
          <h2 className="text-sm font-bold text-slate-500 mb-4">関連ツール</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
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
        <p className="text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} AI ドライブプランナー
        </p>
      </div>
    </footer>
  );
}
