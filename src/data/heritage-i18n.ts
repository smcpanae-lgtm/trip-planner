import { Converter } from "opencc-js/cn2t";
import {
  HERITAGE_SITES_PATH,
  HERITAGE_APP_PATH,
  SITE_ORIGIN,
  type HeritageCategory,
  type HeritageRegion,
  type HeritageSite,
} from "./heritage";

/**
 * 世界遺産の個別ページ／一覧ページを多言語化するための辞書。
 *
 * 辞書自体は遺産名データ（nameJa / nameEn / nameFr / nameEs / nameZh）が
 * そろっている 5 言語ぶん用意してあるが、独立URLとして実際に静的生成するのは
 * 今のところ ja（既存URL）・en・zh-hant（繁体字）のみ。韓国語・仏語・西語は
 * 中身が英語のままの薄いページになるため対象外。
 *
 * 仏語・西語は HERITAGE_LOCALES に追加するだけで独立URL化を再開できる
 * （辞書は既にできているため）。あわせて scripts/heritage-build-locales.mjs の
 * LOCALES と next.config.ts の rewrites の言語コード一覧、
 * public/heritage/app.js の localeSegments にも同じ言語コードを追加する必要がある。
 * さらに src/app 配下に、その言語専用のルートレイアウトグループ（(fr) など）と
 * 個別ページ・一覧ページの literal フォルダ（heritage/fr/sites/...）を追加する
 * （(en)・(zh-hant) と同じ構成。<html lang> を静的に出し分けるため、
 * 共有の動的ルートではなく言語ごとに専用グループを持たせている）。
 */

export type HeritageLocale = "ja" | "en" | "fr" | "es" | "zh" | "zh-hant";

/** 日本語は既存URL（/heritage/sites/...）を維持するため、URLセグメントを持たない */
export const DEFAULT_LOCALE: HeritageLocale = "ja";

/**
 * hreflang の x-default に指定する言語。海外からの検索流入を主目的に
 * 独立URL化するため、言語不明のユーザーには英語版を案内する。
 * （x-default ≠ DEFAULT_LOCALE。DEFAULT_LOCALE はURL構造上の既定値、
 * 　こちらはSEO上の既定値で、意味が異なる）
 */
export const X_DEFAULT_LOCALE: HeritageLocale = "en";

export const HERITAGE_LOCALES: HeritageLocale[] = ["ja", "en", "zh-hant"];

export function isHeritageLocale(value: string): value is HeritageLocale {
  return (HERITAGE_LOCALES as string[]).includes(value);
}

type Dict = {
  /** <html lang> と hreflang に使う言語コード */
  htmlLang: string;
  /** OGP の og:locale */
  ogLocale: string;
  /** 数値・日付整形に使うロケール */
  numberLocale: string;

  siteName: string;
  regions: Record<HeritageRegion, string>;
  categories: Record<HeritageCategory, string>;

  /** パンくず・見出し */
  breadcrumbList: string;
  indexHeading: string;
  indexIntro: string;
  indexJapanHeading: string;
  indexBrowseHeading: string;
  countriesSuffix: string;
  sitesSuffix: string;

  /** CTA */
  cta: string;
  ctaNote: string;
  /** AI旅行記メーカーへの誘導CTA */
  shioriCta: string;
  shioriCtaNote: string;

  /** 危機遺産 */
  dangerTitle: string;
  dangerBody: string;
  dangerSince: string;

  /** 基本情報テーブル */
  basicInfo: string;
  factNameJa: string;
  factNameEn: string;
  factNameFr: string;
  factNameEs: string;
  factNameZh: string;
  factCountry: string;
  factRegion: string;
  factYear: string;
  factCategory: string;
  factCriteria: string;
  factArea: string;
  factComponents: string;
  factTransboundary: string;
  factCoords: string;
  factId: string;
  yes: string;
  namesHeading: string;

  /** 関連リンク・注記 */
  relatedHeading: string;
  aboutHeading: string;
  aboutBody: string;
  seeList: string;
  unescoLink: string;
  sourceNote: string;
  indexSourceNote: string;
  disclaimer: string;
  imageCaption: string;
  imageAlt: string;

  /** 本文・メタ情報のテンプレート */
  intro: string;
  introNoYear: string;
  detailTitle: string;
  detailTitleNoYear: string;
  detailDescription: string;
  detailKeywords: string;
  /** detailDescription の {inscription} / {criteria} に差し込む文 */
  inscriptionSentence: string;
  criteriaSentence: string;
  indexTitle: string;
  indexDescription: string;
  indexKeywords: string;

  /** 単位・書式 */
  yearFormat: string;
  areaKm2: string;
  areaHa: string;
  componentsFormat: string;
  relatedYear: string;
  listMeta: string;
};

/**
 * テンプレート内の {key} を置き換える。
 * 空文字の値が入った場合は前後の句読点が残らないよう、呼び出し側で分岐する。
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** OpenCC による簡体字→繁体字の変換（cn2t）が汎用フォールバックで
 * 誤った字を選んでしまう固有名詞のみの例外表（語→語の単純な対応表）。
 * OpenCCの語彙辞書に無い/稀な複合語は文字単位の既定変換になり、
 * 「冲之岛」→「衝之島」（正しくは沖之島）、「制丝厂」→「制絲廠」
 * （正しくは製絲廠）のように、文脈上不自然な異体字が選ばれることがある。
 * ここに追加する語は、他の遺産名と衝突しないことを
 * scripts の検証（変換結果の全件diff）で確認したうえで追加すること。
 */
const CN2TW_EXCEPTIONS: Record<string, string> = {
  "衝之島": "沖之島",
  "制絲廠": "製絲廠",
};

/** OpenCC による簡体字→繁体字の文字変換（地域語彙の言い換えは行わない） */
const baseToTraditionalChar = Converter({ from: "cn", to: "tw" });
const toTraditionalChar = (value: string): string => {
  const converted = baseToTraditionalChar(value);
  return Object.entries(CN2TW_EXCEPTIONS).reduce(
    (acc, [wrong, right]) => acc.split(wrong).join(right),
    converted
  );
};

/** Dict の全文字列フィールド（ネストした regions/categories を含む）を繁体字に変換する */
function convertDictToTraditional(source: Dict): Dict {
  const result = { ...source };
  for (const key of Object.keys(result) as (keyof Dict)[]) {
    const value = result[key];
    if (typeof value === "string") {
      (result[key] as string) = toTraditionalChar(value);
    } else if (value && typeof value === "object") {
      const converted = Object.fromEntries(
        Object.entries(value as Record<string, string>).map(([k, v]) => [k, toTraditionalChar(v)])
      );
      (result[key] as unknown) = converted;
    }
  }
  return result;
}

const BASE_DICTS: Record<"ja" | "en" | "fr" | "es" | "zh", Dict> = {
  ja: {
    htmlLang: "ja",
    ogLocale: "ja_JP",
    numberLocale: "ja-JP",
    siteName: "世界遺産パスポート",
    regions: {
      africa: "アフリカ",
      arab: "アラブ諸国",
      asia: "アジア・太平洋",
      europe: "ヨーロッパ・北米",
      latin: "ラテンアメリカ・カリブ",
      unknown: "その他",
    },
    categories: { cultural: "文化遺産", natural: "自然遺産", mixed: "複合遺産" },
    breadcrumbList: "世界遺産一覧",
    indexHeading: "世界遺産一覧（全{total}件）｜国別インデックス",
    indexIntro:
      "ユネスコに登録されている世界遺産 全{total}件を、地域・国別にまとめたインデックスです。名称をクリックすると、登録年・種別・所在国などの基本情報ページを開きます。",
    indexJapanHeading: "日本の世界遺産（{count}件）",
    indexBrowseHeading: "地域・国から探す",
    countriesSuffix: "（{count}カ国・地域）",
    sitesSuffix: "{count}件",
    cta: "このサイトで訪問記録をつける",
    ctaNote: "記録はお使いのブラウザ内だけに保存されます。会員登録は不要です。",
    shioriCta: "この訪問記録から旅行記を作る → AI旅行記メーカー",
    shioriCtaNote: "訪問記録・写真・メモをもとに、AIが旅行記を無料で作成します。",
    dangerTitle: "危機遺産リストに掲載",
    dangerBody:
      "この物件は「危機にさらされている世界遺産リスト」に掲載されています{since}。最新の状況は公式ページをご確認ください。",
    dangerSince: "（掲載記録: {value}）",
    basicInfo: "基本情報",
    factNameJa: "遺産名（日本語）",
    factNameEn: "遺産名（英語）",
    factNameFr: "フランス語",
    factNameEs: "スペイン語",
    factNameZh: "中国語",
    factCountry: "所在国",
    factRegion: "地域区分",
    factYear: "登録年",
    factCategory: "種別",
    factCriteria: "登録基準",
    factArea: "資産面積",
    factComponents: "構成資産数",
    factTransboundary: "複数国にまたがる登録",
    factCoords: "代表座標",
    factId: "ユネスコID",
    yes: "はい",
    namesHeading: "各言語での名称",
    relatedHeading: "{country}の他の世界遺産",
    aboutHeading: "世界遺産パスポートについて",
    aboutBody:
      "世界遺産パスポートは、訪問した世界遺産を写真つきのスタンプとして記録できる無料の個人用トラベル記録サイトです。全{total}件の世界遺産に対応し、訪問記録・写真・メモはすべてお使いのブラウザ内にのみ保存されます。",
    seeList: "世界遺産の一覧を見る",
    unescoLink: "ユネスコ公式ページ（英語）で詳細を見る",
    sourceNote:
      "出典: UNESCO DataHub（whc001 / CC BY-SA 4.0）の事実情報。当サイトは名称・国・登録年・種別などの事実情報のみを扱い、UNESCO/WHC公式の説明文・写真・ロゴは使用していません。",
    indexSourceNote:
      "出典: UNESCO DataHub（whc001 / CC BY-SA 4.0）の事実情報。当サイトはUNESCO/WHCの公式サイトではなく、名称・国・登録年・種別などの事実情報のみを扱い、公式の説明文・写真・ロゴは使用していません。掲載情報は最新性・完全性を保証するものではありません。",
    disclaimer:
      "このサイトはUNESCO/WHCの公式サイトではありません。掲載情報は公開データをもとにしていますが、最新性・完全性を保証するものではありません。旅行計画や公式確認には各公式ページを参照してください。",
    imageCaption:
      "※当サイトが独自に生成したイメージ画像です。現地の実際の風景や公式写真ではありません。",
    imageAlt: "{name}のイメージ画像",
    intro:
      "{country}にある世界遺産。{year}年に{category}として登録されました。このページでは登録年・種別・所在国などの基本情報をまとめています。",
    introNoYear:
      "{country}にある世界遺産。このページでは登録年・種別・所在国などの基本情報をまとめています。",
    detailTitle: "{name}｜{country}の世界遺産（{year}年登録・{category}）",
    detailTitleNoYear: "{name}｜{country}の世界遺産（{category}）",
    detailDescription:
      "{name}は{country}にある世界遺産です。{inscription}{criteria}登録年・種別・所在国などの基本情報をまとめています。世界遺産パスポートでは、訪問した世界遺産をブラウザ内だけに保存して記録できます。",
    detailKeywords: "{name},{name} 世界遺産,{country} 世界遺産,世界遺産 訪問記録",
    inscriptionSentence: "{year}年に{category}として登録されました。",
    criteriaSentence: "登録基準は{criteria}。",
    indexTitle: "世界遺産一覧（全{total}件）｜国別インデックス - 世界遺産パスポート",
    indexDescription:
      "ユネスコ世界遺産 全{total}件を国・地域別に一覧できるインデックスです。各世界遺産の登録年・種別・所在国などの基本情報ページへリンクしています。訪問記録はブラウザ内だけに保存できます。",
    indexKeywords: "世界遺産 一覧,世界遺産 国別,世界遺産 リスト,世界遺産 全件,世界遺産 訪問記録",
    yearFormat: "{year}年",
    areaKm2: "約{km2}km²（{ha}ha）",
    areaHa: "約{ha}ha",
    componentsFormat: "{count}件",
    relatedYear: "（{year}年）",
    listMeta: "（{year}年・{category}）",
  },

  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    numberLocale: "en-US",
    siteName: "World Heritage Passport",
    regions: {
      africa: "Africa",
      arab: "Arab States",
      asia: "Asia and the Pacific",
      europe: "Europe and North America",
      latin: "Latin America and the Caribbean",
      unknown: "Other",
    },
    categories: { cultural: "Cultural Site", natural: "Natural Site", mixed: "Mixed Site" },
    breadcrumbList: "All World Heritage Sites",
    indexHeading: "All {total} World Heritage Sites — Index by Country",
    indexIntro:
      "An index of all {total} UNESCO World Heritage Sites, grouped by region and country. Select a name to open its page with the inscription year, category and location.",
    indexJapanHeading: "World Heritage Sites in Japan ({count})",
    indexBrowseHeading: "Browse by region and country",
    countriesSuffix: " ({count} countries and territories)",
    sitesSuffix: "{count} sites",
    cta: "Log your visit on this site",
    ctaNote: "Your records are saved only inside your own browser. No sign-up required.",
    shioriCta: "Create a travel diary from this visit record → AI Travel Diary Maker",
    shioriCtaNote: "AI creates a free travel diary from your visit records, photos and notes.",
    dangerTitle: "On the List of World Heritage in Danger",
    dangerBody:
      "This property is on the List of World Heritage in Danger{since}. Please check the official page for the latest status.",
    dangerSince: " (recorded: {value})",
    basicInfo: "Key facts",
    factNameJa: "Name (Japanese)",
    factNameEn: "Name (English)",
    factNameFr: "French",
    factNameEs: "Spanish",
    factNameZh: "Chinese",
    factCountry: "Country",
    factRegion: "Region",
    factYear: "Inscribed",
    factCategory: "Category",
    factCriteria: "Criteria",
    factArea: "Property area",
    factComponents: "Component parts",
    factTransboundary: "Transboundary property",
    factCoords: "Coordinates",
    factId: "UNESCO ID",
    yes: "Yes",
    namesHeading: "Names in other languages",
    relatedHeading: "Other World Heritage Sites in {country}",
    aboutHeading: "About World Heritage Passport",
    aboutBody:
      "World Heritage Passport is a free personal travel log where you can record the World Heritage Sites you have visited as photo stamps. It covers all {total} sites, and every visit, photo and note is stored only inside your own browser.",
    seeList: "See the full list of World Heritage Sites",
    unescoLink: "View details on the official UNESCO page",
    sourceNote:
      "Source: factual data from UNESCO DataHub (whc001 / CC BY-SA 4.0). This site uses only factual information such as names, countries, inscription years and categories. No official UNESCO/WHC descriptions, photographs or logos are used.",
    indexSourceNote:
      "Source: factual data from UNESCO DataHub (whc001 / CC BY-SA 4.0). This is not an official UNESCO/WHC website. It uses only factual information such as names, countries, inscription years and categories, and does not use official descriptions, photographs or logos. Completeness and currency are not guaranteed.",
    disclaimer:
      "This is not an official UNESCO/WHC website. The information here is based on public data but is not guaranteed to be complete or current. Please refer to the official pages when planning travel or confirming details.",
    imageCaption:
      "This is an illustrative image generated by this site. It is not an actual photograph of the location or an official photo.",
    imageAlt: "Illustrative image of {name}",
    intro:
      "A World Heritage Site in {country}, inscribed in {year} as a {category}. This page summarises the key facts: inscription year, category and location.",
    introNoYear:
      "A World Heritage Site in {country}. This page summarises the key facts: inscription year, category and location.",
    detailTitle: "{name} — World Heritage Site in {country} (inscribed {year}, {category})",
    detailTitleNoYear: "{name} — World Heritage Site in {country} ({category})",
    detailDescription:
      "{name} is a UNESCO World Heritage Site in {country}. {inscription}{criteria}This page summarises the inscription year, category and location. With World Heritage Passport you can log the sites you have visited, stored only in your own browser.",
    detailKeywords:
      "{name},{name} World Heritage,{country} World Heritage Sites,UNESCO World Heritage,visit log",
    inscriptionSentence: "Inscribed in {year} as a {category}. ",
    criteriaSentence: "Criteria: {criteria}. ",
    indexTitle: "All {total} UNESCO World Heritage Sites by Country - World Heritage Passport",
    indexDescription:
      "A complete index of all {total} UNESCO World Heritage Sites by country and region, each linking to a page with its inscription year, category and location. Log your visits privately in your own browser.",
    indexKeywords:
      "World Heritage list,UNESCO World Heritage Sites,World Heritage by country,complete list,visit log",
    yearFormat: "{year}",
    areaKm2: "approx. {km2} km² ({ha} ha)",
    areaHa: "approx. {ha} ha",
    componentsFormat: "{count}",
    relatedYear: " ({year})",
    listMeta: " ({year}, {category})",
  },

  fr: {
    htmlLang: "fr",
    ogLocale: "fr_FR",
    numberLocale: "fr-FR",
    siteName: "Passeport du patrimoine mondial",
    regions: {
      africa: "Afrique",
      arab: "États arabes",
      asia: "Asie et Pacifique",
      europe: "Europe et Amérique du Nord",
      latin: "Amérique latine et Caraïbes",
      unknown: "Autre",
    },
    categories: { cultural: "bien culturel", natural: "bien naturel", mixed: "bien mixte" },
    breadcrumbList: "Liste des sites du patrimoine mondial",
    indexHeading: "Les {total} sites du patrimoine mondial — index par pays",
    indexIntro:
      "Un index des {total} sites du patrimoine mondial de l'UNESCO, regroupés par région et par pays. Cliquez sur un nom pour ouvrir sa page avec l'année d'inscription, la catégorie et le pays.",
    indexJapanHeading: "Sites du patrimoine mondial au Japon ({count})",
    indexBrowseHeading: "Parcourir par région et par pays",
    countriesSuffix: " ({count} pays et territoires)",
    sitesSuffix: "{count} sites",
    cta: "Enregistrer votre visite sur ce site",
    ctaNote:
      "Vos données sont enregistrées uniquement dans votre navigateur. Aucune inscription nécessaire.",
    shioriCta:
      "Créer un carnet de voyage à partir de cette visite → AI Travel Diary Maker (en anglais)",
    shioriCtaNote:
      "L'IA crée gratuitement un carnet de voyage à partir de vos visites, photos et notes.",
    dangerTitle: "Inscrit sur la Liste du patrimoine mondial en péril",
    dangerBody:
      "Ce bien figure sur la Liste du patrimoine mondial en péril{since}. Consultez la page officielle pour connaître la situation actuelle.",
    dangerSince: " (enregistré : {value})",
    basicInfo: "Informations essentielles",
    factNameJa: "Nom (japonais)",
    factNameEn: "Nom (anglais)",
    factNameFr: "Français",
    factNameEs: "Espagnol",
    factNameZh: "Chinois",
    factCountry: "Pays",
    factRegion: "Région",
    factYear: "Année d'inscription",
    factCategory: "Catégorie",
    factCriteria: "Critères",
    factArea: "Superficie du bien",
    factComponents: "Éléments constitutifs",
    factTransboundary: "Bien transfrontalier",
    factCoords: "Coordonnées",
    factId: "Identifiant UNESCO",
    yes: "Oui",
    namesHeading: "Noms dans d'autres langues",
    relatedHeading: "Autres sites du patrimoine mondial — {country}",
    aboutHeading: "À propos du Passeport du patrimoine mondial",
    aboutBody:
      "Le Passeport du patrimoine mondial est un carnet de voyage personnel et gratuit qui permet d'enregistrer les sites visités sous forme de tampons photo. Il couvre les {total} sites, et chaque visite, photo et note reste enregistrée uniquement dans votre navigateur.",
    seeList: "Voir la liste complète des sites",
    unescoLink: "Voir les détails sur la page officielle de l'UNESCO (en anglais)",
    sourceNote:
      "Source : données factuelles de l'UNESCO DataHub (whc001 / CC BY-SA 4.0). Ce site n'utilise que des informations factuelles telles que les noms, pays, années d'inscription et catégories. Aucun texte, photographie ou logo officiel de l'UNESCO/WHC n'est utilisé.",
    indexSourceNote:
      "Source : données factuelles de l'UNESCO DataHub (whc001 / CC BY-SA 4.0). Ce site n'est pas un site officiel de l'UNESCO/WHC. Il n'utilise que des informations factuelles et n'emploie ni textes, ni photographies, ni logos officiels. L'exactitude et l'actualité ne sont pas garanties.",
    disclaimer:
      "Ce site n'est pas un site officiel de l'UNESCO/WHC. Les informations proviennent de données publiques mais leur exhaustivité et leur actualité ne sont pas garanties. Consultez les pages officielles pour préparer un voyage ou vérifier une information.",
    imageCaption:
      "Image d'illustration générée par ce site. Il ne s'agit pas d'une photographie réelle du lieu ni d'une photo officielle.",
    imageAlt: "Image d'illustration de {name}",
    intro:
      "Site du patrimoine mondial — {country}. Inscrit en {year} en tant que {category}. Cette page rassemble les informations essentielles : année d'inscription, catégorie et pays.",
    introNoYear:
      "Site du patrimoine mondial — {country}. Cette page rassemble les informations essentielles : année d'inscription, catégorie et pays.",
    detailTitle: "{name} — patrimoine mondial, {country} (inscrit en {year}, {category})",
    detailTitleNoYear: "{name} — patrimoine mondial, {country} ({category})",
    detailDescription:
      "{name} est un site du patrimoine mondial situé dans ce pays : {country}. {inscription}{criteria}Cette page rassemble l'année d'inscription, la catégorie et le pays. Avec le Passeport du patrimoine mondial, enregistrez les sites visités uniquement dans votre navigateur.",
    detailKeywords:
      "{name},{name} patrimoine mondial,patrimoine mondial {country},UNESCO patrimoine mondial,carnet de visite",
    inscriptionSentence: "Inscrit en {year} en tant que {category}. ",
    criteriaSentence: "Critères : {criteria}. ",
    indexTitle:
      "Les {total} sites du patrimoine mondial de l'UNESCO par pays - Passeport du patrimoine mondial",
    indexDescription:
      "Index complet des {total} sites du patrimoine mondial de l'UNESCO par pays et par région, chacun renvoyant à une page indiquant l'année d'inscription, la catégorie et le pays. Enregistrez vos visites dans votre navigateur.",
    indexKeywords:
      "liste patrimoine mondial,sites UNESCO,patrimoine mondial par pays,liste complète,carnet de visite",
    yearFormat: "{year}",
    areaKm2: "env. {km2} km² ({ha} ha)",
    areaHa: "env. {ha} ha",
    componentsFormat: "{count}",
    relatedYear: " ({year})",
    listMeta: " ({year}, {category})",
  },

  es: {
    htmlLang: "es",
    ogLocale: "es_ES",
    numberLocale: "es-ES",
    siteName: "Pasaporte del Patrimonio Mundial",
    regions: {
      africa: "África",
      arab: "Estados Árabes",
      asia: "Asia y el Pacífico",
      europe: "Europa y América del Norte",
      latin: "América Latina y el Caribe",
      unknown: "Otros",
    },
    categories: { cultural: "bien cultural", natural: "bien natural", mixed: "bien mixto" },
    breadcrumbList: "Lista de sitios del Patrimonio Mundial",
    indexHeading: "Los {total} sitios del Patrimonio Mundial — índice por país",
    indexIntro:
      "Un índice de los {total} sitios del Patrimonio Mundial de la UNESCO, agrupados por región y país. Haz clic en un nombre para abrir su página con el año de inscripción, la categoría y el país.",
    indexJapanHeading: "Sitios del Patrimonio Mundial en Japón ({count})",
    indexBrowseHeading: "Explorar por región y país",
    countriesSuffix: " ({count} países y territorios)",
    sitesSuffix: "{count} sitios",
    cta: "Registra tu visita en este sitio",
    ctaNote:
      "Tus registros se guardan únicamente en tu propio navegador. No hace falta registrarse.",
    shioriCta:
      "Crea un diario de viaje a partir de este registro → AI Travel Diary Maker (en inglés)",
    shioriCtaNote:
      "La IA crea gratis un diario de viaje a partir de tus registros, fotos y notas.",
    dangerTitle: "En la Lista del Patrimonio Mundial en Peligro",
    dangerBody:
      "Este bien figura en la Lista del Patrimonio Mundial en Peligro{since}. Consulta la página oficial para conocer la situación actual.",
    dangerSince: " (registrado: {value})",
    basicInfo: "Datos básicos",
    factNameJa: "Nombre (japonés)",
    factNameEn: "Nombre (inglés)",
    factNameFr: "Francés",
    factNameEs: "Español",
    factNameZh: "Chino",
    factCountry: "País",
    factRegion: "Región",
    factYear: "Año de inscripción",
    factCategory: "Categoría",
    factCriteria: "Criterios",
    factArea: "Superficie del bien",
    factComponents: "Elementos constitutivos",
    factTransboundary: "Bien transfronterizo",
    factCoords: "Coordenadas",
    factId: "Identificador UNESCO",
    yes: "Sí",
    namesHeading: "Nombres en otros idiomas",
    relatedHeading: "Otros sitios del Patrimonio Mundial en {country}",
    aboutHeading: "Sobre el Pasaporte del Patrimonio Mundial",
    aboutBody:
      "El Pasaporte del Patrimonio Mundial es un diario de viaje personal y gratuito donde puedes registrar como sellos con foto los sitios que has visitado. Cubre los {total} sitios, y cada visita, foto y nota se guarda solo dentro de tu propio navegador.",
    seeList: "Ver la lista completa de sitios",
    unescoLink: "Ver detalles en la página oficial de la UNESCO (en inglés)",
    sourceNote:
      "Fuente: datos factuales de UNESCO DataHub (whc001 / CC BY-SA 4.0). Este sitio solo utiliza información factual como nombres, países, años de inscripción y categorías. No se utilizan textos, fotografías ni logotipos oficiales de la UNESCO/WHC.",
    indexSourceNote:
      "Fuente: datos factuales de UNESCO DataHub (whc001 / CC BY-SA 4.0). Este no es un sitio oficial de la UNESCO/WHC. Solo utiliza información factual y no emplea textos, fotografías ni logotipos oficiales. No se garantiza la exactitud ni la actualidad.",
    disclaimer:
      "Este no es un sitio oficial de la UNESCO/WHC. La información procede de datos públicos, pero no se garantiza su exhaustividad ni su actualidad. Consulta las páginas oficiales para planificar viajes o verificar datos.",
    imageCaption:
      "Imagen ilustrativa generada por este sitio. No es una fotografía real del lugar ni una foto oficial.",
    imageAlt: "Imagen ilustrativa de {name}",
    intro:
      "Un sitio del Patrimonio Mundial en {country}, inscrito en {year} como {category}. Esta página reúne los datos básicos: año de inscripción, categoría y país.",
    introNoYear:
      "Un sitio del Patrimonio Mundial en {country}. Esta página reúne los datos básicos: año de inscripción, categoría y país.",
    detailTitle: "{name} — Patrimonio Mundial en {country} (inscrito en {year}, {category})",
    detailTitleNoYear: "{name} — Patrimonio Mundial en {country} ({category})",
    detailDescription:
      "{name} es un sitio del Patrimonio Mundial situado en {country}. {inscription}{criteria}Esta página reúne el año de inscripción, la categoría y el país. Con el Pasaporte del Patrimonio Mundial puedes registrar los sitios visitados, guardados solo en tu navegador.",
    detailKeywords:
      "{name},{name} Patrimonio Mundial,Patrimonio Mundial {country},UNESCO Patrimonio Mundial,registro de visitas",
    inscriptionSentence: "Inscrito en {year} como {category}. ",
    criteriaSentence: "Criterios: {criteria}. ",
    indexTitle:
      "Los {total} sitios del Patrimonio Mundial de la UNESCO por país - Pasaporte del Patrimonio Mundial",
    indexDescription:
      "Índice completo de los {total} sitios del Patrimonio Mundial de la UNESCO por país y región, cada uno con enlace a su página de año de inscripción, categoría y país. Registra tus visitas en tu propio navegador.",
    indexKeywords:
      "lista Patrimonio Mundial,sitios UNESCO,Patrimonio Mundial por país,lista completa,registro de visitas",
    yearFormat: "{year}",
    areaKm2: "aprox. {km2} km² ({ha} ha)",
    areaHa: "aprox. {ha} ha",
    componentsFormat: "{count}",
    relatedYear: " ({year})",
    listMeta: " ({year}, {category})",
  },

  zh: {
    htmlLang: "zh-Hans",
    ogLocale: "zh_CN",
    numberLocale: "zh-CN",
    siteName: "世界遗产护照",
    regions: {
      africa: "非洲",
      arab: "阿拉伯国家",
      asia: "亚洲和太平洋",
      europe: "欧洲和北美洲",
      latin: "拉丁美洲和加勒比",
      unknown: "其他",
    },
    categories: { cultural: "文化遗产", natural: "自然遗产", mixed: "复合遗产" },
    breadcrumbList: "世界遗产名录",
    indexHeading: "世界遗产名录（共{total}项）｜按国家索引",
    indexIntro:
      "这是联合国教科文组织世界遗产共{total}项的索引，按地区和国家分类。点击名称即可打开该遗产的页面，查看登录年份、类别和所在国等基本信息。",
    indexJapanHeading: "日本的世界遗产（{count}项）",
    indexBrowseHeading: "按地区和国家浏览",
    countriesSuffix: "（{count}个国家和地区）",
    sitesSuffix: "{count}项",
    cta: "在本站记录访问",
    ctaNote: "记录仅保存在您自己的浏览器中，无需注册。",
    shioriCta: "根据此访问记录制作旅行日记 → AI Travel Diary Maker（英文）",
    shioriCtaNote: "AI 会根据您的访问记录、照片和备注免费生成旅行日记。",
    dangerTitle: "列入濒危世界遗产名录",
    dangerBody: "该遗产已列入《濒危世界遗产名录》{since}。最新情况请查阅官方页面。",
    dangerSince: "（记录：{value}）",
    basicInfo: "基本信息",
    factNameJa: "名称（日语）",
    factNameEn: "名称（英语）",
    factNameFr: "法语",
    factNameEs: "西班牙语",
    factNameZh: "中文",
    factCountry: "所在国",
    factRegion: "地区",
    factYear: "登录年份",
    factCategory: "类别",
    factCriteria: "登录标准",
    factArea: "遗产面积",
    factComponents: "组成部分数量",
    factTransboundary: "跨国遗产",
    factCoords: "代表坐标",
    factId: "教科文组织编号",
    yes: "是",
    namesHeading: "其他语言名称",
    relatedHeading: "{country}的其他世界遗产",
    aboutHeading: "关于世界遗产护照",
    aboutBody:
      "世界遗产护照是一个免费的个人旅行记录网站，可将访问过的世界遗产记录为带照片的印章。支持全部{total}项世界遗产，访问记录、照片和备注均仅保存在您自己的浏览器中。",
    seeList: "查看世界遗产完整名录",
    unescoLink: "在教科文组织官方页面查看详情（英语）",
    sourceNote:
      "来源：UNESCO DataHub（whc001 / CC BY-SA 4.0）的事实信息。本站仅使用名称、国家、登录年份、类别等事实信息，不使用教科文组织/世界遗产中心官方的说明文字、照片或标志。",
    indexSourceNote:
      "来源：UNESCO DataHub（whc001 / CC BY-SA 4.0）的事实信息。本站并非教科文组织/世界遗产中心官方网站，仅使用事实信息，不使用官方说明文字、照片或标志。不保证信息的完整性和时效性。",
    disclaimer:
      "本站并非教科文组织/世界遗产中心的官方网站。所载信息基于公开数据，但不保证其完整性和时效性。制定旅行计划或核实信息时，请参阅各官方页面。",
    imageCaption: "※本站自行生成的示意图，并非当地实景或官方照片。",
    imageAlt: "{name}的示意图",
    intro:
      "位于{country}的世界遗产，于{year}年作为{category}列入名录。本页整理了登录年份、类别、所在国等基本信息。",
    introNoYear: "位于{country}的世界遗产。本页整理了登录年份、类别、所在国等基本信息。",
    detailTitle: "{name}｜{country}的世界遗产（{year}年登录·{category}）",
    detailTitleNoYear: "{name}｜{country}的世界遗产（{category}）",
    detailDescription:
      "{name}是位于{country}的世界遗产。{inscription}{criteria}本页整理了登录年份、类别、所在国等基本信息。使用世界遗产护照，可将访问记录仅保存在您的浏览器中。",
    detailKeywords: "{name},{name} 世界遗产,{country} 世界遗产,联合国教科文组织世界遗产,访问记录",
    inscriptionSentence: "于{year}年作为{category}列入名录。",
    criteriaSentence: "登录标准：{criteria}。",
    indexTitle: "联合国教科文组织世界遗产名录 全{total}项 按国家索引 - 世界遗产护照",
    indexDescription:
      "按国家和地区排列的联合国教科文组织世界遗产全{total}项完整索引，每一项均链接至载有登录年份、类别和所在国的页面。访问记录可仅保存在您的浏览器中。",
    indexKeywords: "世界遗产名录,教科文组织世界遗产,按国家分类世界遗产,完整名单,访问记录",
    yearFormat: "{year}年",
    areaKm2: "约{km2}平方公里（{ha}公顷）",
    areaHa: "约{ha}公顷",
    componentsFormat: "{count}处",
    relatedYear: "（{year}年）",
    listMeta: "（{year}年·{category}）",
  },
};

/**
 * 繁体字（zh-hant）辞書は、既存の簡体字辞書（zh）を OpenCC で文字変換して作る。
 * 地域名・言語コードなど繁体字圏（台湾）向けに変えるべき値だけ上書きする。
 * これにより約60項目を手作業で翻訳せずに、既存の簡体字訳を再利用できる。
 */
const ZH_HANT_DICT: Dict = {
  ...convertDictToTraditional(BASE_DICTS.zh),
  htmlLang: "zh-Hant",
  ogLocale: "zh_TW",
  numberLocale: "zh-TW",
};

const DICTS: Record<HeritageLocale, Dict> = {
  ...BASE_DICTS,
  "zh-hant": ZH_HANT_DICT,
};

export function dict(locale: HeritageLocale): Dict {
  return DICTS[locale];
}

/* ---------------------------------------------------------------- URL 生成 */

/** 一覧ページのパス。日本語は既存URLを維持する */
export function localeIndexPath(locale: HeritageLocale): string {
  return locale === DEFAULT_LOCALE ? HERITAGE_SITES_PATH : `/heritage/${locale}/sites`;
}

/** 個別ページのパス。日本語は既存URLを維持する */
export function localeSitePath(site: HeritageSite, locale: HeritageLocale): string {
  return `${localeIndexPath(locale)}/${site.slug}`;
}

export function localeIndexUrl(locale: HeritageLocale): string {
  return `${SITE_ORIGIN}${localeIndexPath(locale)}`;
}

export function localeSiteUrl(site: HeritageSite, locale: HeritageLocale): string {
  return `${SITE_ORIGIN}${localeSitePath(site, locale)}`;
}

/** 記録アプリ本体のパス。日本語は /heritage、他は /heritage/en など */
export function localeAppPath(locale: HeritageLocale): string {
  return locale === DEFAULT_LOCALE ? HERITAGE_APP_PATH : `${HERITAGE_APP_PATH}/${locale}`;
}

/**
 * hreflang 用の言語別URL一覧。
 * x-default は X_DEFAULT_LOCALE（英語）に向ける。
 * zh-TW / zh-HK は繁体字版（zh-hant）と同じURLを指すエイリアスとして加える
 * （台湾・香港からの検索流入を取りこぼさないため。ページ自体は増えない）。
 */
export function languageAlternates(
  build: (locale: HeritageLocale) => string
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of HERITAGE_LOCALES) {
    languages[DICTS[locale].htmlLang] = build(locale);
  }
  languages["zh-TW"] = build("zh-hant");
  languages["zh-HK"] = build("zh-hant");
  languages["x-default"] = build(X_DEFAULT_LOCALE);
  return languages;
}

/* -------------------------------------------------------- 言語別の表示文字列 */

/** 表示用の遺産名。その言語の名称が無ければ英語名にフォールバックする */
export function localeName(site: HeritageSite, locale: HeritageLocale): string {
  switch (locale) {
    case "ja":
      return site.nameJa || site.nameEn;
    case "fr":
      return site.nameFr || site.nameEn;
    case "es":
      return site.nameEs || site.nameEn;
    case "zh":
      return site.nameZh || site.nameEn;
    case "zh-hant":
      return site.nameZh ? toTraditionalChar(site.nameZh) : site.nameEn;
    default:
      return site.nameEn;
  }
}

/**
 * 国名。
 * 日本語は既存の和名データをそのまま使い、他言語は ISO 国コードから
 * Intl.DisplayNames で各言語の正式表記に変換する（例: DE → Allemagne / Alemania / 德国）。
 * 変換できないコードは英語表記にフォールバックする。
 */
const displayNamesCache = new Map<HeritageLocale, Intl.DisplayNames>();

function regionNames(locale: HeritageLocale): Intl.DisplayNames {
  const cached = displayNamesCache.get(locale);
  if (cached) return cached;
  const created = new Intl.DisplayNames([DICTS[locale].numberLocale], {
    type: "region",
    fallback: "none",
  });
  displayNamesCache.set(locale, created);
  return created;
}

/**
 * 国名（言語別・単一サイト分の配列）。
 * 個別ページの表示（localeCountry）と、一覧ページの国別グルーピング
 * （groupByRegionAndCountryForLocale）の両方から使う共通ロジック。
 * 以前は一覧ページ側だけ日本語以外は countriesEn 固定になっており、
 * zh-hant の国見出しが英語のまま出るバグがあった。
 */
function localeCountryLabels(site: HeritageSite, locale: HeritageLocale): string[] {
  if (locale === "ja") {
    return site.countriesJa.length ? site.countriesJa : site.countriesEn;
  }

  const names = regionNames(locale);
  const labels = site.isoCodes
    .map((code, index) => names.of(code) || site.countriesEn[index] || code)
    .filter(Boolean);
  return labels.length ? labels : site.countriesEn;
}

export function localeCountry(site: HeritageSite, locale: HeritageLocale): string {
  const separator = locale === "ja" ? "・" : locale === "zh" || locale === "zh-hant" ? "、" : " / ";
  return localeCountryLabels(site, locale).join(separator);
}

export function localeYear(site: HeritageSite, locale: HeritageLocale): string | null {
  if (!site.year) return null;
  return fill(DICTS[locale].yearFormat, { year: site.year });
}

export function localeArea(site: HeritageSite, locale: HeritageLocale): string | null {
  if (site.areaHectares === null || site.areaHectares <= 0) return null;
  const d = DICTS[locale];
  const ha = site.areaHectares;
  const num = (value: number, digits: number) =>
    value.toLocaleString(d.numberLocale, { maximumFractionDigits: digits });
  if (ha >= 10000) {
    return fill(d.areaKm2, { km2: num(ha / 100, 0), ha: num(ha, 0) });
  }
  return fill(d.areaHa, { ha: num(ha, 1) });
}

export function localeNumber(value: number, locale: HeritageLocale): string {
  return value.toLocaleString(DICTS[locale].numberLocale);
}

/** 地域 → 国 のインデックス（一覧ページ用）を言語別に組み立てる */
export type LocaleCountryGroup = {
  key: string;
  label: string;
  region: HeritageRegion;
  sites: HeritageSite[];
};

export function groupByRegionAndCountryForLocale(
  locale: HeritageLocale,
  sites: HeritageSite[],
  regionOrder: HeritageRegion[]
): { region: HeritageRegion; countries: LocaleCountryGroup[] }[] {
  const groups = new Map<string, LocaleCountryGroup>();

  for (const site of sites) {
    const labels = localeCountryLabels(site, locale);
    labels.forEach((label, index) => {
      const key = site.isoCodes[index] || label;
      const existing = groups.get(key);
      if (existing) {
        existing.sites.push(site);
        return;
      }
      groups.set(key, { key, label, region: site.region, sites: [site] });
    });
  }

  const collator = DICTS[locale].numberLocale;
  return regionOrder
    .map((region) => ({
      region,
      countries: [...groups.values()]
        .filter((group) => group.region === region)
        .sort((a, b) => b.sites.length - a.sites.length || a.label.localeCompare(b.label, collator)),
    }))
    .filter((entry) => entry.countries.length > 0);
}
