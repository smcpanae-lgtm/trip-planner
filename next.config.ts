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
    ];
  },
};

export default nextConfig;
