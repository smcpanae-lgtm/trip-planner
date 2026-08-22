/**
 * 世界遺産パスポート（記録アプリ本体）の言語別HTMLを生成する。
 *
 *   public/heritage/index.html     … 日本語（既存URL /heritage を維持）
 *   public/heritage/en/index.html  … 英語版（/heritage/en）
 *
 * 本文は app.js の translations 辞書を data-i18n 属性に流し込んで
 * ビルド時に翻訳済みの状態にする。<head> は言語別の文言に差し替え、
 * 全ページに hreflang を入れて相互リンクさせる（x-default は英語）。
 *
 *   node scripts/heritage-build-locales.mjs
 *
 * 言語を追加したいときは LOCALES と HREFLANG に1行足し、HEAD_TEXT に
 * その言語の文言を追加する。あわせて src/data/heritage-i18n.ts の
 * HERITAGE_LOCALES / LOCALIZED_SEGMENTS、next.config.ts の rewrites、
 * public/heritage/app.js の localeSegments にも同じ言語コードを追加する。
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const heritageDir = join(root, "public", "heritage");
const ORIGIN = "https://www.ai-drive-planner.com";

/** URLセグメント → app.js の translations のキー */
const LOCALES = [
  { segment: "en", dictKey: "en", htmlLang: "en", ogLocale: "en_US" },
  { segment: "zh-hant", dictKey: "zh-TW", htmlLang: "zh-Hant", ogLocale: "zh_TW" },
];

/**
 * hreflang に載せる全言語（日本語は既存URLのまま）。
 * x-default は英語版（海外からの検索流入を主目的にしているため）。
 * zh-TW / zh-HK は繁体字版（zh-hant）と同じURLを指すエイリアス
 * （台湾・香港からの検索流入向け。ページ自体は増えない）。
 */
const HREFLANG = [
  ["ja", `${ORIGIN}/heritage`],
  ["en", `${ORIGIN}/heritage/en`],
  ["zh-Hant", `${ORIGIN}/heritage/zh-hant`],
  ["zh-TW", `${ORIGIN}/heritage/zh-hant`],
  ["zh-HK", `${ORIGIN}/heritage/zh-hant`],
  ["x-default", `${ORIGIN}/heritage/en`],
];

/** 置換元になる日本語の文字列（index.html の <head> に実在するもの） */
const JA = {
  title: "世界遺産パスポート｜世界遺産の訪問記録・スタンプラリー",
  metaDescription:
    "世界遺産の訪問記録をブラウザ内だけに保存できる、写真付きスタンプ形式の世界遺産スタンプラリーサイト。達成率や制覇状況を確認できる個人用トラベル記録サイトです。",
  ogDescription:
    "世界遺産の訪問記録をブラウザ内だけに保存できる、写真付きスタンプ形式の世界遺産スタンプラリーサイトです。",
  keywords:
    "世界遺産 訪問記録,世界遺産 スタンプラリー,世界遺産 記録アプリ,世界遺産 制覇,世界遺産 一覧 訪問済み",
  imageAlt: "世界遺産パスポートのカード画像",
  siteName: "世界遺産パスポート",
  // OGP / X カード画像。日本語版は日本語表記、英語版は英語表記の別画像を使う。
  socialImage: "assets/social-card-ja.png",
};

/** 言語別の <head> 文言 */
const HEAD_TEXT = {
  en: {
    title: "World Heritage Passport | Track and Stamp Your UNESCO World Heritage Visits",
    metaDescription:
      "A free stamp-rally style travel log for UNESCO World Heritage Sites. Record the sites you have visited with photos, stored only inside your own browser, and watch your completion rate grow.",
    ogDescription:
      "A free stamp-rally style travel log for UNESCO World Heritage Sites. Your visits and photos are stored only inside your own browser.",
    keywords:
      "World Heritage visit log,UNESCO stamp rally,World Heritage tracker,World Heritage checklist,travel log",
    imageAlt: "World Heritage Passport card image",
    siteName: "World Heritage Passport",
    socialImage: "assets/social-card.png",
    sitesIndexLink: "All World Heritage Sites (1,273 fact pages)",
  },
  "zh-hant": {
    title: "世界遺產護照｜世界遺產參觀記錄與集章",
    metaDescription:
      "可將世界遺產的參觀記錄僅保存在您的瀏覽器內，附照片印章形式的世界遺產集章護照網站。可查看達成率與參觀狀況的個人旅行記錄網站。",
    ogDescription:
      "可將世界遺產的參觀記錄僅保存在您的瀏覽器內，附照片印章形式的世界遺產集章護照網站。",
    keywords:
      "世界遺產 參觀記錄,世界遺產 集章,世界遺產 記錄APP,世界遺產 清單,世界遺產 已訪問",
    imageAlt: "世界遺產護照的卡片圖像",
    siteName: "世界遺產護照",
    socialImage: "assets/social-card.png",
    sitesIndexLink: "世界遺產完整名錄（全1,273件基本資訊頁面）",
  },
  // 仏語・西語を復活させたい場合はここに追記する（辞書は
  // src/data/heritage-i18n.ts に既にあるので、ここは <head> の文言だけでよい）。
};

/** app.js の先頭にある translations オブジェクトを取り出す */
function loadTranslations() {
  const source = readFileSync(join(heritageDir, "app.js"), "utf8");
  const start = source.indexOf("const translations = {");
  if (start === -1) throw new Error("app.js の translations 定義が見つかりません");
  const open = source.indexOf("{", start);

  let depth = 0;
  let inString = null;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inString = ch;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        // 自分たちで書いた静的なオブジェクトリテラルのみを評価する
        return new Function(`return ${source.slice(open, i + 1)}`)();
      }
    }
  }
  throw new Error("translations の終端が見つかりません");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const hreflangBlock = HREFLANG.map(
  ([lang, href]) => `    <link rel="alternate" hreflang="${lang}" href="${href}">`
).join("\n");

/** <head> に hreflang を差し込む（既に入っていれば入れ替える） */
function withHreflang(head) {
  const cleaned = head.replace(/^[ \t]*<link rel="alternate" hreflang="[^"]*"[^>]*>\r?\n/gm, "");
  return cleaned.replace(/([ \t]*<\/head>)/, `${hreflangBlock}\n$1`);
}

function buildLocale(html, locale, translations) {
  const text = HEAD_TEXT[locale.segment];
  const dict = { ...translations.en, ...translations[locale.dictKey] };
  const url = `${ORIGIN}/heritage/${locale.segment}`;

  const headEnd = html.indexOf("</head>") + "</head>".length;
  let head = html.slice(0, headEnd);
  let body = html.slice(headEnd);

  /* ---- <head> を言語別に差し替える ---- */
  head = head.replace(/<html lang="ja">/, `<html lang="${locale.htmlLang}">`);
  // 長い文字列から順に置換する（短い siteName が部分一致で壊さないように）
  head = head.split(JA.title).join(escapeHtml(text.title));
  head = head.split(JA.metaDescription).join(escapeHtml(text.metaDescription));
  head = head.split(JA.ogDescription).join(escapeHtml(text.ogDescription));
  head = head.split(JA.keywords).join(escapeHtml(text.keywords));
  head = head.split(JA.imageAlt).join(escapeHtml(text.imageAlt));
  head = head.split(JA.siteName).join(escapeHtml(text.siteName));
  // og:image / twitter:image を言語別の画像に差し替える
  head = head.split(JA.socialImage).join(text.socialImage);
  // canonical / og:url / パンくずのURL（画像URLは /heritage/assets/... なので影響しない）
  head = head.split(`${ORIGIN}/heritage"`).join(`${url}"`);
  head = head.replace(/content="ja_JP"/, `content="${locale.ogLocale}"`);
  head = withHreflang(head);

  /* ---- 本文の data-i18n をビルド時に翻訳する ---- */
  let applied = 0;
  let missed = 0;
  body = body.replace(
    /(<(\w+)\b[^>]*\sdata-i18n="([\w.-]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (match, openTag, _tag, key, _inner, closeTag) => {
      const value = dict[key];
      if (!value) {
        missed += 1;
        return match;
      }
      applied += 1;
      return `${openTag}${escapeHtml(value)}${closeTag}`;
    }
  );
  // 一覧ページへのリンクは data-i18n が無いので個別に言語版へ差し替える
  body = body
    .split('<a href="/heritage/sites">世界遺産一覧（全1,273件の基本情報ページ）</a>')
    .join(
      `<a href="/heritage/${locale.segment}/sites">${escapeHtml(text.sitesIndexLink)}</a>`
    );
  // 「サイトについて」「よくある質問」は言語別ページ（public/heritage/<lang>/about.html 等）を
  // 用意しているので、リンク先も言語別に差し替える。プライバシー/Cookieポリシーは
  // 日本語版ページを共通で参照するため、ここでは差し替えない。
  body = body.split('href="/heritage/about.html"').join(`href="/heritage/${locale.segment}/about.html"`);
  body = body.split('href="/heritage/faq.html"').join(`href="/heritage/${locale.segment}/faq.html"`);

  body = body.replace(/<[^>]*\sdata-i18n-placeholder="([\w.-]+)"[^>]*>/g, (match, key) => {
    const value = dict[key];
    if (!value) {
      missed += 1;
      return match;
    }
    applied += 1;
    // 注意: 単純に /placeholder="[^"]*"/ で置換すると、直前にある
    // data-i18n-placeholder="..." の末尾（"-placeholder=..." の部分）に
    // 誤ってマッチしてしまう。属性名の先頭であることを示すため
    // 直前が空白であることを (?<=\s) で確認する。
    return match.replace(/(?<=\s)placeholder="[^"]*"/, `placeholder="${escapeHtml(value)}"`);
  });

  const outDir = join(heritageDir, locale.segment);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), head + body, "utf8");
  return { applied, missed };
}

function main() {
  const translations = loadTranslations();
  const html = readFileSync(join(heritageDir, "index.html"), "utf8");

  for (const locale of LOCALES) {
    const { applied, missed } = buildLocale(html, locale, translations);
    console.log(
      `  /heritage/${locale.segment}/index.html  翻訳適用 ${applied} 件` +
        (missed ? ` / 辞書に無いキー ${missed} 件` : "")
    );
  }

  // 日本語版（既存ファイル）にも hreflang を入れて相互リンクさせる
  const headEnd = html.indexOf("</head>") + "</head>".length;
  const updated = withHreflang(html.slice(0, headEnd)) + html.slice(headEnd);
  if (updated !== html) {
    writeFileSync(join(heritageDir, "index.html"), updated, "utf8");
    console.log("  /heritage/index.html  hreflang を更新");
  }

  console.log(`言語別ページを生成しました（${LOCALES.length} 言語）`);
}

main();
