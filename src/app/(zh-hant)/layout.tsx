import "../globals.css";
import RootShell, { SITE_METADATA } from "@/components/RootShell";

// 繁体字ページ(/zh-hant/*)用のルートレイアウト。(zh-hant) はルートグループのためURLには現れない。
// <html lang="zh-Hant"> を静的HTMLに出力することだけがこのレイアウトの存在理由で、
// head・metadata・JSON-LDの内容は他言語と共通（RootShell で一元管理）。
export const metadata = SITE_METADATA;

export default function ZhHantRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootShell lang="zh-Hant">{children}</RootShell>;
}
