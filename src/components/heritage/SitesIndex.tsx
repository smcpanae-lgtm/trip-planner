import type { Metadata } from "next";
import Link from "next/link";
import { Stamp } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import {
  HERITAGE_SITES,
  HERITAGE_TOTAL,
  REGION_ORDER,
  SITE_ORIGIN,
  type HeritageSite,
} from "@/data/heritage";
import {
  dict,
  fill,
  groupByRegionAndCountryForLocale,
  languageAlternates,
  localeAppPath,
  localeIndexPath,
  localeIndexUrl,
  localeName,
  localeNumber,
  localeSitePath,
  type HeritageLocale,
} from "@/data/heritage-i18n";
import LanguageSwitcher from "./LanguageSwitcher";

/** 一覧ページの <head>。全言語版へ hreflang を張る */
export function buildIndexMetadata(locale: HeritageLocale): Metadata {
  const d = dict(locale);
  const total = localeNumber(HERITAGE_TOTAL, locale);
  const title = fill(d.indexTitle, { total });
  const description = fill(d.indexDescription, { total });
  const url = localeIndexUrl(locale);
  const card = `${SITE_ORIGIN}/heritage/assets/social-card.png`;

  return {
    title,
    description,
    keywords: d.indexKeywords,
    openGraph: {
      title,
      description,
      type: "website",
      locale: d.ogLocale,
      siteName: d.siteName,
      url,
      images: [{ url: card, width: 1200, height: 630, alt: d.siteName }],
    },
    twitter: { card: "summary_large_image", title, description, images: [card] },
    alternates: {
      canonical: url,
      languages: languageAlternates((target) => localeIndexUrl(target)),
    },
    robots: { index: true, follow: true },
  };
}

const japanSites = HERITAGE_SITES.filter((site) => site.isoCodes.includes("JP")).sort(
  (a, b) => (a.year ?? 0) - (b.year ?? 0)
);

function SiteLink({ site, locale }: { site: HeritageSite; locale: HeritageLocale }) {
  const d = dict(locale);
  return (
    <Link
      href={localeSitePath(site, locale)}
      className="block text-sm text-slate-600 hover:text-emerald-700 underline decoration-slate-200 hover:decoration-emerald-400 py-1 leading-snug"
    >
      {localeName(site, locale)}
      <span className="text-xs text-slate-400">
        {site.year
          ? fill(d.listMeta, { year: site.year, category: d.categories[site.category] })
          : ""}
      </span>
    </Link>
  );
}

export default function SitesIndex({ locale }: { locale: HeritageLocale }) {
  const d = dict(locale);
  const total = localeNumber(HERITAGE_TOTAL, locale);
  const groups = groupByRegionAndCountryForLocale(locale, HERITAGE_SITES, REGION_ORDER);
  const url = localeIndexUrl(locale);
  const appPath = localeAppPath(locale);
  const footerLocale = locale === "ja" || locale === "zh-hant" ? locale : "en";
  const title = fill(d.indexTitle, { total });
  const description = fill(d.indexDescription, { total });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      inLanguage: d.htmlLang,
      isPartOf: { "@type": "WebSite", name: d.siteName, url: `${SITE_ORIGIN}${appPath}` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: d.siteName, item: `${SITE_ORIGIN}${appPath}` },
        { "@type": "ListItem", position: 2, name: d.breadcrumbList, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50" lang={d.htmlLang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <nav className="text-xs text-slate-400 mb-4 space-x-1">
          <a href={appPath} className="hover:text-emerald-600">
            {d.siteName}
          </a>
          <span>/</span>
          <span className="text-slate-500">{d.breadcrumbList}</span>
        </nav>

        <LanguageSwitcher current={locale} build={(target) => localeIndexPath(target)} />

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug">
          {fill(d.indexHeading, { total })}
        </h1>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {fill(d.indexIntro, { total })}
        </p>

        <a
          href={`${appPath}?source=sites-index`}
          className="mt-6 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <Stamp className="w-5 h-5" />
          {d.cta}
        </a>
        <p className="mt-2 text-xs text-slate-400">{d.ctaNote}</p>

        {locale === "ja" ? (
          <section className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-800">
              {fill(d.indexJapanHeading, { count: japanSites.length })}
            </h2>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {japanSites.map((site) => (
                <li key={site.id}>
                  <SiteLink site={site} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-base font-bold text-slate-800 mb-3">{d.indexBrowseHeading}</h2>
          <div className="space-y-3">
            {groups.map((group, groupIndex) => (
              <details
                key={group.region}
                open={groupIndex === 0}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <summary className="cursor-pointer text-sm font-bold text-slate-800">
                  {d.regions[group.region]}
                  {fill(d.countriesSuffix, { count: group.countries.length })}
                </summary>
                <div className="mt-4 space-y-6">
                  {group.countries.map((country) => (
                    <div key={country.key}>
                      <h3 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-1">
                        {country.label}
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {fill(d.sitesSuffix, { count: country.sites.length })}
                        </span>
                      </h3>
                      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                        {country.sites.map((site) => (
                          <li key={`${country.key}-${site.id}`}>
                            <SiteLink site={site} locale={locale} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-[11px] text-slate-400 leading-relaxed">{d.indexSourceNote}</p>
      </div>

      <SiteFooter locale={footerLocale} />
    </div>
  );
}
