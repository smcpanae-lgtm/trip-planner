// Parking Areas (PA/SA) and Michi-no-Eki data
export interface RestStop {
  name: string;
  type: "PA" | "SA" | "道の駅";
  highway?: string;
  lat: number;
  lng: number;
  features: string; // food, view, etc.
}

export const parkingAreas: RestStop[] = [
  // 東名高速
  { name: "海老名SA", type: "SA", highway: "東名高速", lat: 35.4490, lng: 139.3960, features: "グルメ充実・ショッピング" },
  { name: "足柄SA", type: "SA", highway: "東名高速", lat: 35.3240, lng: 139.0040, features: "富士山の眺望・温泉" },
  { name: "富士川SA", type: "SA", highway: "東名高速", lat: 35.1310, lng: 138.6120, features: "観覧車・富士山パノラマ" },
  { name: "牧之原SA", type: "SA", highway: "東名高速", lat: 34.8060, lng: 138.1150, features: "お茶スイーツ" },
  { name: "浜名湖SA", type: "SA", highway: "東名高速", lat: 34.7490, lng: 137.5870, features: "うなぎ・浜名湖の景色" },
  { name: "刈谷PA", type: "PA", highway: "東名高速", lat: 34.9990, lng: 137.0070, features: "観覧車・天然温泉" },

  // 新東名高速
  { name: "駿河湾沼津SA", type: "SA", highway: "新東名高速", lat: 35.1650, lng: 138.8220, features: "駿河湾一望・海鮮" },
  { name: "NEOPASA静岡", type: "SA", highway: "新東名高速", lat: 35.0140, lng: 138.2870, features: "最先端グルメ" },
  { name: "NEOPASA浜松", type: "SA", highway: "新東名高速", lat: 34.8290, lng: 137.7260, features: "ピアノモチーフ" },

  // 中央自動車道
  { name: "談合坂SA", type: "SA", highway: "中央道", lat: 35.6310, lng: 139.0890, features: "ほうとう・甲州グルメ" },
  { name: "双葉SA", type: "SA", highway: "中央道", lat: 35.6780, lng: 138.5040, features: "富士山ビュー" },
  { name: "諏訪湖SA", type: "SA", highway: "中央道", lat: 36.0310, lng: 138.0850, features: "諏訪湖パノラマ・温泉" },
  { name: "駒ヶ岳SA", type: "SA", highway: "中央道", lat: 35.7390, lng: 137.9270, features: "中央アルプスの眺望" },

  // 関越自動車道
  { name: "三芳PA", type: "PA", highway: "関越道", lat: 35.8150, lng: 139.5310, features: "焼き芋・地元グルメ" },
  { name: "高坂SA", type: "SA", highway: "関越道", lat: 35.9800, lng: 139.3640, features: "広場・ドッグラン" },
  { name: "赤城高原SA", type: "SA", highway: "関越道", lat: 36.5660, lng: 139.0610, features: "赤城山の景色" },

  // 東北自動車道
  { name: "蓮田SA", type: "SA", highway: "東北道", lat: 35.9470, lng: 139.6500, features: "充実フードコート" },
  { name: "佐野SA", type: "SA", highway: "東北道", lat: 36.3280, lng: 139.6200, features: "佐野ラーメン" },
  { name: "那須高原SA", type: "SA", highway: "東北道", lat: 36.9870, lng: 140.0100, features: "那須御用邸チーズ" },
  { name: "安達太良SA", type: "SA", highway: "東北道", lat: 37.5940, lng: 140.3590, features: "福島名物" },
  { name: "菅生PA", type: "PA", highway: "東北道", lat: 38.2150, lng: 140.7500, features: "牛タン" },

  // 名神高速
  { name: "養老SA", type: "SA", highway: "名神高速", lat: 35.3020, lng: 136.5320, features: "飛騨牛グルメ" },
  { name: "多賀SA", type: "SA", highway: "名神高速", lat: 35.2190, lng: 136.2940, features: "近江牛・琵琶湖" },
  { name: "草津PA", type: "PA", highway: "名神高速", lat: 35.0040, lng: 135.9480, features: "滋賀グルメ" },
  { name: "桂川PA", type: "PA", highway: "名神高速", lat: 34.9530, lng: 135.6810, features: "京都グルメ" },

  // 山陽自動車道
  { name: "三木SA", type: "SA", highway: "山陽道", lat: 34.7870, lng: 134.9770, features: "明石焼き" },
  { name: "福山SA", type: "SA", highway: "山陽道", lat: 34.5150, lng: 133.3680, features: "尾道ラーメン" },

  // 九州自動車道
  { name: "古賀SA", type: "SA", highway: "九州道", lat: 33.7220, lng: 130.4920, features: "明太子・博多グルメ" },
  { name: "広川SA", type: "SA", highway: "九州道", lat: 33.2140, lng: 130.5500, features: "筑後うどん" },
  { name: "北熊本SA", type: "SA", highway: "九州道", lat: 32.8660, lng: 130.7340, features: "馬刺し" },
];

export const michiNoEkis: RestStop[] = [
  // 関東
  { name: "道の駅 川場田園プラザ", type: "道の駅", lat: 36.6910, lng: 139.1100, features: "関東人気No.1・地ビール" },
  { name: "道の駅 八王子滝山", type: "道の駅", lat: 35.6880, lng: 139.3510, features: "東京唯一の道の駅" },
  { name: "道の駅 箱根峠", type: "道の駅", lat: 35.1960, lng: 139.0230, features: "芦ノ湖ビュー" },
  { name: "道の駅 富楽里とみやま", type: "道の駅", lat: 35.0780, lng: 139.8620, features: "海鮮・房総グルメ" },

  // 中部
  { name: "道の駅 富士吉田", type: "道の駅", lat: 35.4870, lng: 138.7790, features: "富士山の湧水・吉田うどん" },
  { name: "道の駅 白州", type: "道の駅", lat: 35.7920, lng: 138.3130, features: "南アルプスの天然水" },
  { name: "道の駅 伊東マリンタウン", type: "道の駅", lat: 34.9700, lng: 139.1070, features: "温泉・海鮮" },

  // 東北
  { name: "道の駅 あ・ら・伊達な道の駅", type: "道の駅", lat: 38.6890, lng: 140.7320, features: "東北人気No.1" },
  { name: "道の駅 喜多の郷", type: "道の駅", lat: 37.6490, lng: 139.8620, features: "ラーメン・温泉" },
  { name: "道の駅 象潟", type: "道の駅", lat: 39.2010, lng: 139.9030, features: "日本海の眺望・海鮮" },

  // 関西
  { name: "道の駅 神戸フルーツ・フラワーパーク大沢", type: "道の駅", lat: 34.8430, lng: 135.1540, features: "遊園地・BBQ" },
  { name: "道の駅 針テラス", type: "道の駅", lat: 34.5680, lng: 135.8760, features: "関西最大級・温泉" },
  { name: "道の駅 京丹波 味夢の里", type: "道の駅", lat: 35.1720, lng: 135.4400, features: "京野菜グルメ" },

  // 九州
  { name: "道の駅 阿蘇", type: "道の駅", lat: 32.9500, lng: 131.0890, features: "阿蘇の絶景・あか牛" },
  { name: "道の駅 いとまん", type: "道の駅", lat: 26.1320, lng: 127.6640, features: "沖縄最大級・海鮮" },

  // 北海道
  { name: "道の駅 ニセコビュープラザ", type: "道の駅", lat: 42.8680, lng: 140.6810, features: "羊蹄山ビュー・野菜" },
  { name: "道の駅 うとろ・シリエトク", type: "道の駅", lat: 44.0720, lng: 144.9950, features: "知床の玄関口" },
];

// Find nearest rest stop between two points
export function findNearestRestStop(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  type: "PA" | "道の駅" | "both" = "both"
): RestStop | null {
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;

  let candidates: RestStop[] = [];
  if (type === "PA" || type === "both") {
    candidates = [...candidates, ...parkingAreas];
  }
  if (type === "道の駅" || type === "both") {
    candidates = [...candidates, ...michiNoEkis];
  }

  let nearest: RestStop | null = null;
  let minDist = Infinity;

  for (const stop of candidates) {
    const dLat = stop.lat - midLat;
    const dLng = stop.lng - midLng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111;

    // Must be roughly between the two points (not way off route)
    const minRouteLatRange = Math.min(fromLat, toLat) - 0.3;
    const maxRouteLatRange = Math.max(fromLat, toLat) + 0.3;
    const minRouteLngRange = Math.min(fromLng, toLng) - 0.3;
    const maxRouteLngRange = Math.max(fromLng, toLng) + 0.3;

    if (
      stop.lat >= minRouteLatRange &&
      stop.lat <= maxRouteLatRange &&
      stop.lng >= minRouteLngRange &&
      stop.lng <= maxRouteLngRange &&
      dist < minDist
    ) {
      minDist = dist;
      nearest = stop;
    }
  }

  return nearest;
}
