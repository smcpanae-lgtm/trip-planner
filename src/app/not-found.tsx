import Script from "next/script";
import "./globals.css";

/**
 * ルートグループ (ja)/(en) のどちらにも一致しないURLの404ページ。
 *
 * ルートレイアウトが複数ある構成では、この not-found はどのルートレイアウトにも
 * 包まれない。何も置かないと共通CSSとGAタグが失われ、単一ルートレイアウト時から
 * 挙動が変わってしまうため、ここで最低限のシェル（CSS・GA）を明示的に読み込む。
 *
 * ここで <html>/<body> を描画するとNext.jsが用意する外側のそれと二重になるため描画しない。
 * その結果、この404ページのみ <html> に lang 属性が付かない（本文は言語非依存の
 * Next.js既定404表示のため実害は無い）。
 *
 * 中身はNext.js組み込みの既定404と同じ見た目・同じ文言に揃えている。
 */
export default function NotFound() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-HHWEKHRG56"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HHWEKHRG56');
          `}
      </Script>
      <div
        style={{
          fontFamily:
            'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
          height: "100vh",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>
          <style>{`body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}`}</style>
          <h1
            className="next-error-h1"
            style={{
              display: "inline-block",
              margin: "0 20px 0 0",
              padding: "0 23px 0 0",
              fontSize: 24,
              fontWeight: 500,
              verticalAlign: "top",
              lineHeight: "49px",
            }}
          >
            404
          </h1>
          <div style={{ display: "inline-block" }}>
            <h2 style={{ fontSize: 14, fontWeight: 400, lineHeight: "49px", margin: 0 }}>
              This page could not be found.
            </h2>
          </div>
        </div>
      </div>
    </>
  );
}
