import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpen, Globe2, MapPin, Stamp } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import {
  HERITAGE_TOTAL,
  heritageImageAbsoluteUrl,
  heritageImagePath,
  relatedSitesInSameCountry,
  type HeritageSite,
} from "@/data/heritage";
import {
  dict,
  fill,
  languageAlternates,
  localeAppPath,
  localeArea,
  localeCountry,
  localeIndexPath,
  localeIndexUrl,
  localeName,
  localeNumber,
  localeSitePath,
  localeSiteUrl,
  localeYear,
  type HeritageLocale,
} from "@/data/heritage-i18n";
import LanguageSwitcher from "./LanguageSwitcher";

/** 検索結果に出る説明文。UNESCO公式の説明文は使わず、事実情報だけで組み立てる */
function metaDescription(site: HeritageSite, locale: HeritageLocale): string {
  const d = dict(locale);
  const year = site.year;
  const category = d.categories[site.category];
  return fill(d.detailDescription, {
    name: localeName(site, locale),
    country: localeCountry(site, locale),
    inscription: year ? fill(d.inscriptionSentence, { year, category }) : "",
    criteria: site.criteria ? fill(d.criteriaSentence, { criteria: site.criteria }) : "",
  });
}

function pageTitle(site: HeritageSite, locale: HeritageLocale): string {
  const d = dict(locale);
  const values = {
    name: localeName(site, locale),
    country: localeCountry(site, locale),
    category: d.categories[site.category],
    year: site.year ?? "",
  };
  return fill(site.year ? d.detailTitle : d.detailTitleNoYear, values);
}

/** 個別ページの <head>。全言語版へ hreflang を張る */
export function buildSiteMetadata(site: HeritageSite, locale: HeritageLocale): Metadata {
  const d = dict(locale);
  const title = pageTitle(site, locale);
  const description = metaDescription(site, locale);
  const url = localeSiteUrl(site, locale);
  const image = heritageImageAbsoluteUrl(site);
  const name = localeName(site, locale);
  const alt = fill(d.imageAlt, { name });

  return {
    title,
    description,
    keywords: fill(d.detailKeywords, { name, country: localeCountry(site, locale) }),
    openGraph: {
      title,
      description,
      type: "article",
      locale: d.ogLocale,
      siteName: d.siteName,
      url,
      images: image ? [{ url: image, alt, type: "image/webp" }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: image ? [{ url: image, alt }] : undefined,
    },
    alternates: {
      canonical: url,
      languages: languageAlternates((target) => localeSiteUrl(site, target)),
    },
    robots: { index: true, follow: true },
  };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-b-0 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-bold text-slate-400">{label}</dt>
      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-sm text-slate-700 break-words">{children}</dd>
    </div>
  );
}

export default function SiteDetail({
  site,
  locale,
}: {
  site: HeritageSite;
  locale: HeritageLocale;
}) {
  const d = dict(locale);
  const name = localeName(site, locale);
  const country = localeCountry(site, locale);
  const category = d.categories[site.category];
  const url = localeSiteUrl(site, locale);
  const imagePath = heritageImagePath(site);
  const imageUrl = heritageImageAbsoluteUrl(site);
  const related = relatedSitesInSameCountry(site);
  const area = localeArea(site, locale);
  const year = localeYear(site, locale);
  const appPath = localeAppPath(locale);
  const indexPath = localeIndexPath(locale);
  const ctaHref = `${appPath}?source=sites&open=${encodeURIComponent(site.id)}`;
  // AI旅行記メーカーは ja/en のみ独立URLを持つため、それ以外の言語は英語版に誘導する
  const shioriBasePath = locale === "ja" ? "/shiori" : "/en/shiori";
  const shioriHref = `${shioriBasePath}?source=heritage&ids=${encodeURIComponent(site.id)}`;

  /** h1 の名称と、その下に出す英語名は「各言語での名称」から除いて重複を避ける */
  const showsEnglishSubtitle = name !== site.nameEn;
  const otherNames = (
    [
      ["ja", d.factNameJa, site.nameJa],
      ["en", d.factNameEn, site.nameEn],
      ["fr", d.factNameFr, site.nameFr],
      ["es", d.factNameEs, site.nameEs],
      ["zh", d.factNameZh, site.nameZh],
    ] as const
  ).filter(([code, , value]) => {
    if (!value || code === locale || value === name) return false;
    return !(code === "en" && showsEnglishSubtitle);
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name,
      alternateName: name !== site.nameEn ? site.nameEn : undefined,
      description: metaDescription(site, locale),
      url,
      image: imageUrl ?? undefined,
      address: {
        "@type": "PostalAddress",
        addressCountry: site.isoCodes[0] ?? undefined,
        addressLocality: country,
      },
      geo:
        site.lat !== null && site.lon !== null
          ? { "@type": "GeoCoordinates", latitude: site.lat, longitude: site.lon }
          : undefined,
      additionalProperty: [
        site.year ? { "@type": "PropertyValue", name: d.factYear, value: String(site.year) } : null,
        { "@type": "PropertyValue", name: d.factCategory, value: category },
        site.criteria
          ? { "@type": "PropertyValue", name: d.factCriteria, value: site.criteria }
          : null,
        { "@type": "PropertyValue", name: d.factRegion, value: d.regions[site.region] },
      ].filter(Boolean),
      isPartOf: {
        "@type": "WebSite",
        name: d.siteName,
        url: `${localeIndexUrl(locale).replace(/\/sites$/, "")}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: d.siteName,
          item: `${localeIndexUrl(locale).replace(/\/sites$/, "")}`,
        },
        { "@type": "ListItem", position: 2, name: d.breadcrumbList, item: localeIndexUrl(locale) },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50" lang={d.htmlLang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-xs text-slate-400 mb-4 space-x-1">
          <a href={appPath} className="hover:text-emerald-600">
            {d.siteName}
          </a>
          <span>/</span>
          <Link href={indexPath} className="hover:text-emerald-600">
            {d.breadcrumbList}
          </Link>
          <span>/</span>
          <span className="text-slate-500">{name}</span>
        </nav>

        <LanguageSwitcher current={locale} build={(target) => localeSitePath(site, target)} />

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug">{name}</h1>
        {name !== site.nameEn ? (
          <p className="mt-2 text-sm text-slate-500">{site.nameEn}</p>
        ) : null}

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {fill(site.year ? d.intro : d.introNoYear, {
            country,
            year: site.year ?? "",
            category,
          })}
        </p>

        {imagePath ? (
          <figure className="mt-6">
            {/* サイト内で独自生成したイメージ画像。UNESCO公式の写真は使用していない */}
            <img
              src={imagePath}
              alt={fill(d.imageAlt, { name })}
              width={680}
              height={453}
              loading="eager"
              decoding="async"
              className="w-full aspect-[3/2] object-cover rounded-xl border border-slate-200 bg-slate-100"
            />
            <figcaption className="mt-2 text-[11px] text-slate-400">{d.imageCaption}</figcaption>
          </figure>
        ) : null}

        <a
          href={ctaHref}
          className="mt-6 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <Stamp className="w-5 h-5" />
          {d.cta}
        </a>
        <p className="mt-2 text-xs text-slate-400">{d.ctaNote}</p>

        <a
          href={shioriHref}
          className="mt-3 inline-flex items-center gap-2 border border-emerald-700 text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-3 rounded-xl transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          {d.shioriCta}
        </a>
        <p className="mt-2 text-xs text-slate-400">{d.shioriCtaNote}</p>

        {site.danger ? (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">{d.dangerTitle}</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {fill(d.dangerBody, {
                  since: site.dangerSince ? fill(d.dangerSince, { value: site.dangerSince }) : "",
                })}
              </p>
            </div>
          </div>
        ) : null}

        <section className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-2">{d.basicInfo}</h2>
          <dl>
            <Fact label={d.factCountry}>{country}</Fact>
            <Fact label={d.factRegion}>{d.regions[site.region]}</Fact>
            <Fact label={d.factYear}>{year ?? "—"}</Fact>
            <Fact label={d.factCategory}>{category}</Fact>
            <Fact label={d.factCriteria}>{site.criteria ?? "—"}</Fact>
            {area ? <Fact label={d.factArea}>{area}</Fact> : null}
            {site.componentsCount ? (
              <Fact label={d.factComponents}>
                {fill(d.componentsFormat, { count: site.componentsCount })}
              </Fact>
            ) : null}
            {site.transboundary ? <Fact label={d.factTransboundary}>{d.yes}</Fact> : null}
            {site.lat !== null && site.lon !== null ? (
              <Fact label={d.factCoords}>
                {site.lat.toFixed(4)}, {site.lon.toFixed(4)}
              </Fact>
            ) : null}
            <Fact label={d.factId}>{site.id}</Fact>
          </dl>
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">{d.sourceNote}</p>
        </section>

        {otherNames.length > 0 ? (
          <section className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-2">{d.namesHeading}</h2>
            <dl>
              {otherNames.map(([code, label, value]) => (
                <Fact key={code} label={label}>
                  {value}
                </Fact>
              ))}
            </dl>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-600" />
              {fill(d.relatedHeading, { country })}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((other) => (
                <li key={other.id}>
                  <Link
                    href={localeSitePath(other, locale)}
                    className="block text-sm text-slate-600 hover:text-emerald-700 underline decoration-slate-200 hover:decoration-emerald-400 py-1"
                  >
                    {localeName(other, locale)}
                    <span className="text-xs text-slate-400">
                      {other.year ? fill(d.relatedYear, { year: other.year }) : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            {d.aboutHeading}
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {fill(d.aboutBody, { total: localeNumber(HERITAGE_TOTAL, locale) })}
          </p>
        </section>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
          <Link href={indexPath} className="hover:text-emerald-600 underline">
            {d.seeList}
          </Link>
          <a
            href={site.unescoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 underline"
          >
            {d.unescoLink}
          </a>
        </div>

        <p className="mt-6 text-[11px] text-slate-400 leading-relaxed">{d.disclaimer}</p>
      </div>

      <SiteFooter />
    </div>
  );
}
