import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // wwwなし → wwwありへの301リダイレクト（canonical統一）
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "ai-drive-planner.com",
          },
        ],
        destination: "https://www.ai-drive-planner.com/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // /heritage と /heritage/ を /heritage/index.html にマッピング
      {
        source: "/heritage",
        destination: "/heritage/index.html",
      },
      {
        source: "/heritage/",
        destination: "/heritage/index.html",
      },
      // 言語別の記録アプリ本体（/heritage/en）。
      // scripts/heritage-build-locales.mjs が生成した静的HTMLを返す。
      // 個別ページ（/heritage/en/sites/...）と衝突しないよう言語コードを明示列挙する。
      // 言語を追加する場合はここにも同じコードを足すこと（例: (en|fr)）。
      {
        source: "/heritage/:lang(en)",
        destination: "/heritage/:lang/index.html",
      },
      {
        source: "/heritage/:lang(en)/",
        destination: "/heritage/:lang/index.html",
      },
    ];
  },
};

export default nextConfig;
