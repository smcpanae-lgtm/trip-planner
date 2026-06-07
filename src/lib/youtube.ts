// Generates YouTube search links (no YouTube Data API) so users can preview
// AI-generated drive plans on YouTube before their trip.
//
// Only search-result URLs are produced — no thumbnails, video metadata, or
// embeds. If YouTube Data API integration is added later, a new function
// (e.g. fetchYouTubeVideosForPlan) can reuse `generateYouTubeSearchLinks`
// to derive the queries to search for.

export type YouTubeSearchLink = {
  label: string;
  query: string;
  url: string;
};

const MAX_LINKS = 5;

function buildYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// Finds a representative area name (city/ward/town/prefecture) inside free text.
function extractAreaName(text: string): string | undefined {
  const cityMatch = text.match(/[一-龥ぁ-んァ-ヶーA-Za-z0-9]{2,8}(?:市|区|町|村)/);
  if (cityMatch) return cityMatch[0];
  const prefMatch = text.match(/[一-龥ぁ-んァ-ヶーA-Za-z0-9]{2,8}(?:都|道|府|県)/);
  if (prefMatch) return prefMatch[0];
  return undefined;
}

function extractMichinoekiNames(text: string): string[] {
  const matches = text.match(/道の駅[一-龥ぁ-んァ-ヶーA-Za-z0-9・]{1,12}/g) || [];
  return Array.from(new Set(matches));
}

export function generateYouTubeSearchLinks(params: {
  userInput?: string;
  planText: string;
  destination?: string;
  region?: string;
}): YouTubeSearchLink[] {
  const { userInput = "", planText, destination, region } = params;
  const combinedText = `${userInput}\n${planText}`;
  const area = region || destination || extractAreaName(combinedText);

  const hasAny = (...keywords: string[]) => keywords.some((k) => combinedText.includes(k));

  const links: YouTubeSearchLink[] = [];
  const seenQueries = new Set<string>();

  const addLink = (label: string, query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || seenQueries.has(trimmedQuery)) return;
    seenQueries.add(trimmedQuery);
    links.push({ label, query: trimmedQuery, url: buildYouTubeSearchUrl(trimmedQuery) });
  };

  // 1. Destination / region + day-trip drive
  if (area) {
    addLink(`${area}の日帰りドライブ動画を見る`, `${area} 日帰り ドライブ`);
    addLink(`${area}の観光ドライブ動画を見る`, `${area} 観光 ドライブ`);
  }

  // 2. Meals (lunch / seafood / gourmet)
  if (area && hasAny("ランチ", "昼食", "夕食", "ディナー", "グルメ", "海鮮", "食事")) {
    if (hasAny("海鮮")) addLink(`${area}の海鮮ランチ動画を見る`, `${area} 海鮮ランチ`);
    addLink(`${area}のランチ動画を見る`, `${area} ランチ`);
    addLink(`${area}のグルメ動画を見る`, `${area} グルメ`);
  }

  // 3. Roadside stations / SA / PA
  const michinoekiNames = extractMichinoekiNames(combinedText);
  for (const name of michinoekiNames) {
    addLink(`${name}の動画を見る`, name);
  }
  if (area && (michinoekiNames.length > 0 || hasAny("道の駅"))) {
    addLink(`${area}の道の駅ドライブ動画を見る`, `${area} 道の駅 ドライブ`);
  }

  // 4. Themes based on input conditions (dog / fishing)
  if (area && hasAny("犬", "愛犬", "ペット", "犬連れ")) {
    addLink(`${area}の犬連れドライブ動画を見る`, `${area} 犬連れ ドライブ`);
    addLink(`${area}の犬連れカフェ動画を見る`, `${area} 犬連れ カフェ`);
    addLink(`${area}のペット可観光動画を見る`, `${area} ペット可 観光`);
  }
  if (area && hasAny("釣り", "釣行", "アジング", "堤防", "漁港")) {
    addLink(`${area}の釣り場動画を見る`, `${area} 釣り場`);
    addLink(`${area}の釣りドライブ動画を見る`, `${area} 釣り ドライブ`);
    addLink(`${area}の釣り・海鮮・温泉動画を見る`, `${area} 釣り 海鮮 温泉`);
  }

  // 5. Supplementary themes (hot springs / rainy day / scenic views)
  if (area && hasAny("温泉")) {
    addLink(`${area}の日帰り温泉動画を見る`, `${area} 日帰り温泉`);
    addLink(`${area}の温泉ドライブ動画を見る`, `${area} 温泉 ドライブ`);
  }
  if (area && hasAny("雨の日", "屋内", "悪天候", "雨天")) {
    addLink(`${area}の雨の日観光動画を見る`, `${area} 雨の日 観光`);
    addLink(`${area}の屋内観光動画を見る`, `${area} 屋内 観光`);
  }
  if (area && hasAny("絶景")) {
    addLink(`${area}の絶景スポット動画を見る`, `${area} 絶景 ドライブ`);
  }

  return links.slice(0, MAX_LINKS);
}
