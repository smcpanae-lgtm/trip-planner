import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI ドライブプランナー｜車旅行プランを自動作成";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    }
  ).then((res) => res.text());

  const fontUrl = css.match(/url\((https:\/\/[^)]+)\)/)?.[1];
  if (!fontUrl) return null;

  return await fetch(fontUrl).then((res) => res.arrayBuffer());
}

const badges = [
  { icon: "🛣️", label: "高速道路ルート" },
  { icon: "🍽️", label: "SA/PA食事提案" },
  { icon: "🐕", label: "犬連れ対応" },
  { icon: "🎥", label: "関連動画も紹介" },
];

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 8px 26px rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ fontSize: 25, fontWeight: 900, color: "#F59E0B", lineHeight: 1 }}>
        {icon}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#F8FAFC", whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
}

function RouteVisual() {
  return (
    <div
      style={{
        position: "absolute",
        right: 58,
        top: 74,
        width: 390,
        height: 470,
        borderRadius: 42,
        background:
          "linear-gradient(145deg, rgba(248,250,252,0.18), rgba(255,255,255,0.06))",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow:
          "0 28px 80px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.22)",
        transform: "rotate(-3deg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 18,
          borderRadius: 32,
          background:
            "linear-gradient(180deg, rgba(241,245,249,0.95), rgba(226,232,240,0.92))",
          display: "flex",
          flexDirection: "column",
          padding: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#0F172A",
            fontWeight: 900,
            fontSize: 24,
          }}
        >
          <span>AI Route</span>
          <span style={{ fontSize: 30 }}>🚗</span>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 24,
            flex: 1,
            borderRadius: 26,
            background:
              "linear-gradient(135deg, #E0F2FE 0%, #F8FAFC 42%, #ECFDF5 100%)",
            border: "1px solid rgba(15,23,42,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 54,
              width: 280,
              height: 180,
              borderTop: "8px dashed #38BDF8",
              borderRadius: "55% 45% 40% 60%",
              transform: "rotate(18deg)",
              opacity: 0.8,
            }}
          />
          <div style={{ position: "absolute", left: 44, top: 68, fontSize: 38 }}>📍</div>
          <div style={{ position: "absolute", right: 54, bottom: 86, fontSize: 40 }}>🏁</div>
          <div
            style={{
              position: "absolute",
              left: 150,
              top: 130,
              fontSize: 46,
              filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.22))",
            }}
          >
            🚗
          </div>

          <div
            style={{
              position: "absolute",
              left: 28,
              bottom: 26,
              display: "flex",
              gap: 10,
            }}
          >
            {["SA/PA", "食事", "犬OK"].map((text) => (
              <div
                key={text}
                style={{
                  padding: "9px 13px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.82)",
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "space-between",
            color: "#334155",
            fontSize: 19,
            fontWeight: 700,
          }}
        >
          <span>渋滞予測</span>
          <span>Google Maps連携</span>
        </div>
      </div>
    </div>
  );
}

export default async function Image() {
  const fontData = await loadGoogleFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #111827 0%, #1F2937 47%, #334155 100%)",
          color: "#F8FAFC",
          fontFamily: "NotoSansJP",
        }}
      >
        {/* 背景グロー */}
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -90,
            width: 360,
            height: 360,
            borderRadius: 999,
            background: "rgba(245,158,11,0.18)",
            filter: "blur(48px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 430,
            bottom: -120,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(56,189,248,0.14)",
            filter: "blur(58px)",
          }}
        />

        {/* 背景の道路ライン */}
        <div
          style={{
            position: "absolute",
            left: -90,
            bottom: -88,
            width: 720,
            height: 260,
            borderRadius: "50%",
            borderTop: "26px solid rgba(255,255,255,0.10)",
            transform: "rotate(-8deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 60,
            bottom: 70,
            fontSize: 28,
            color: "rgba(255,255,255,0.22)",
            letterSpacing: 12,
          }}
        >
          - - - - - - - - - -
        </div>

        {/* 左側テキストエリア */}
        <div
          style={{
            position: "absolute",
            left: 64,
            top: 56,
            width: 650,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#CBD5E1",
              letterSpacing: 2,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: "#F59E0B" }}>✦</span>
            AIドライブプランナー公式
          </div>

          <div
            style={{
              marginTop: 34,
              fontSize: 72,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: -2,
              color: "#FFFFFF",
              textShadow: "0 8px 28px rgba(0,0,0,0.32)",
            }}
          >
            AI ドライブ
            <br />
            プランナー
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              fontWeight: 800,
              color: "#E2E8F0",
            }}
          >
            AIが車旅行プランを自動作成
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 25,
              fontWeight: 600,
              color: "#CBD5E1",
            }}
          >
            出発地・目的地・時刻を入れるだけで、旅程づくりをまるごとサポート。
          </div>

          <div
            style={{
              marginTop: 34,
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              width: 650,
            }}
          >
            {badges.map((badge) => (
              <Badge key={badge.label} icon={badge.icon} label={badge.label} />
            ))}
          </div>

          <div
            style={{
              marginTop: 38,
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: 455,
              padding: "15px 22px",
              borderRadius: 999,
              background: "rgba(15,23,42,0.54)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: 24,
              fontWeight: 800,
              color: "#FFFFFF",
            }}
          >
            <span>🌐</span>
            ai-drive-planner.com
          </div>
        </div>

        {/* 右側ビジュアル */}
        <RouteVisual />

        {/* 右下コピー */}
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 58,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 22px",
            borderRadius: 22,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "#F8FAFC",
            fontSize: 26,
            fontWeight: 900,
            boxShadow: "0 18px 38px rgba(0,0,0,0.24)",
          }}
        >
          <span style={{ fontSize: 34 }}>✨</span>
          旅の計画をAIに丸投げ
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoSansJP", data: fontData, style: "normal", weight: 700 }]
        : [],
    }
  );
}
