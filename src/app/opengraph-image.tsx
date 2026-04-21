import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI ドライブプランナー｜車旅行プランを自動作成";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f766e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* 車アイコン風の装飾 */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 32,
          }}
        >
          🚗
        </div>

        {/* メインタイトル */}
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          AI ドライブプランナー
        </div>

        {/* サブタイトル */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          車旅行プランを自動作成
        </div>

        {/* 特徴バッジ */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["高速道路ルート対応", "SA/PA食事提案", "犬連れ対応", "無料"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: 24,
                  padding: "8px 20px",
                  color: "white",
                  fontSize: 24,
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
