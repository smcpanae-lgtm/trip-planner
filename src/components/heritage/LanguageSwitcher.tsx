import Link from "next/link";
import { Languages } from "lucide-react";
import { HERITAGE_LOCALES, dict, type HeritageLocale } from "@/data/heritage-i18n";

/** 言語切替の表示名（それぞれの言語での自称） */
const NATIVE_LABELS: Record<HeritageLocale, string> = {
  ja: "日本語",
  en: "English",
  fr: "Français",
  es: "Español",
  zh: "中文",
};

/**
 * 静的ページ用の言語切替。
 * JavaScriptを使わない素のリンクにして、クローラーが全言語版を辿れるようにする。
 */
export default function LanguageSwitcher({
  current,
  build,
}: {
  current: HeritageLocale;
  build: (locale: HeritageLocale) => string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
      <Languages className="w-3.5 h-3.5 text-slate-400 mr-1" aria-hidden="true" />
      {HERITAGE_LOCALES.map((locale) =>
        locale === current ? (
          <span
            key={locale}
            aria-current="true"
            className="rounded-full bg-emerald-700 text-white px-3 py-1 font-bold"
          >
            {NATIVE_LABELS[locale]}
          </span>
        ) : (
          <Link
            key={locale}
            href={build(locale)}
            hrefLang={dict(locale).htmlLang}
            className="rounded-full border border-slate-200 bg-white text-slate-500 px-3 py-1 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          >
            {NATIVE_LABELS[locale]}
          </Link>
        )
      )}
    </div>
  );
}
