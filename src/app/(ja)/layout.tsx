import "../globals.css";
import RootShell, { SITE_METADATA } from "@/components/RootShell";

// 日本語ページ用のルートレイアウト。(ja) はルートグループのためURLには現れない。
// head・metadata・JSON-LDの実体は RootShell 側で一元管理する。
export const metadata = SITE_METADATA;

export default function JaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootShell lang="ja">{children}</RootShell>;
}
