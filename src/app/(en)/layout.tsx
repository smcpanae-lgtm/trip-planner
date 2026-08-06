import "../globals.css";
import RootShell, { SITE_METADATA } from "@/components/RootShell";

// 英語ページ(/en/*)用のルートレイアウト。(en) はルートグループのためURLには現れない。
// <html lang="en"> を静的HTMLに出力することだけがこのレイアウトの存在理由で、
// head・metadata・JSON-LDの内容は日本語側と共通（RootShell で一元管理）。
export const metadata = SITE_METADATA;

export default function EnRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootShell lang="en">{children}</RootShell>;
}
