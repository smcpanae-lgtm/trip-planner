// Major highway interchanges (IC) across Japan
export interface HighwayIC {
  name: string;
  highway: string;
  lat: number;
  lng: number;
}

export const highwayICs: HighwayIC[] = [
  // 東名高速
  { name: "東京IC", highway: "東名高速", lat: 35.6130, lng: 139.6350 },
  { name: "東名川崎IC", highway: "東名高速", lat: 35.5740, lng: 139.5860 },
  { name: "横浜町田IC", highway: "東名高速", lat: 35.5120, lng: 139.4640 },
  { name: "海老名JCT", highway: "東名高速", lat: 35.4420, lng: 139.3910 },
  { name: "厚木IC", highway: "東名高速", lat: 35.4350, lng: 139.3630 },
  { name: "秦野中井IC", highway: "東名高速", lat: 35.3510, lng: 139.2250 },
  { name: "大井松田IC", highway: "東名高速", lat: 35.3340, lng: 139.1620 },
  { name: "御殿場IC", highway: "東名高速", lat: 35.3080, lng: 138.9320 },
  { name: "沼津IC", highway: "東名高速", lat: 35.1150, lng: 138.8750 },
  { name: "富士IC", highway: "東名高速", lat: 35.1420, lng: 138.6690 },
  { name: "清水IC", highway: "東名高速", lat: 35.0320, lng: 138.4820 },
  { name: "静岡IC", highway: "東名高速", lat: 34.9760, lng: 138.3870 },
  { name: "浜松IC", highway: "東名高速", lat: 34.7490, lng: 137.7340 },
  { name: "豊田JCT", highway: "東名高速", lat: 35.0700, lng: 137.0820 },
  { name: "名古屋IC", highway: "東名高速", lat: 35.1490, lng: 136.9890 },

  // 新東名高速
  { name: "御殿場JCT", highway: "新東名高速", lat: 35.2890, lng: 138.9560 },
  { name: "新富士IC", highway: "新東名高速", lat: 35.1890, lng: 138.6350 },
  { name: "新静岡IC", highway: "新東名高速", lat: 35.0180, lng: 138.3210 },
  { name: "浜松浜北IC", highway: "新東名高速", lat: 34.8340, lng: 137.7860 },

  // 中央自動車道
  { name: "高井戸IC", highway: "中央道", lat: 35.6830, lng: 139.6140 },
  { name: "調布IC", highway: "中央道", lat: 35.6570, lng: 139.5480 },
  { name: "八王子IC", highway: "中央道", lat: 35.6570, lng: 139.3270 },
  { name: "相模湖IC", highway: "中央道", lat: 35.6140, lng: 139.1990 },
  { name: "大月IC", highway: "中央道", lat: 35.6150, lng: 138.9430 },
  { name: "河口湖IC", highway: "中央道", lat: 35.5100, lng: 138.7660 },
  { name: "甲府昭和IC", highway: "中央道", lat: 35.6370, lng: 138.5430 },
  { name: "諏訪IC", highway: "中央道", lat: 36.0300, lng: 138.1110 },
  { name: "岡谷JCT", highway: "中央道", lat: 36.0690, lng: 138.0590 },
  { name: "伊那IC", highway: "中央道", lat: 35.8640, lng: 137.9350 },
  { name: "飯田IC", highway: "中央道", lat: 35.5150, lng: 137.8220 },

  // 関越自動車道
  { name: "練馬IC", highway: "関越道", lat: 35.7570, lng: 139.6280 },
  { name: "所沢IC", highway: "関越道", lat: 35.7990, lng: 139.4800 },
  { name: "鶴ヶ島JCT", highway: "関越道", lat: 35.9300, lng: 139.3870 },
  { name: "花園IC", highway: "関越道", lat: 36.1130, lng: 139.1770 },
  { name: "藤岡JCT", highway: "関越道", lat: 36.2350, lng: 139.0700 },
  { name: "渋川伊香保IC", highway: "関越道", lat: 36.4790, lng: 138.9920 },
  { name: "沼田IC", highway: "関越道", lat: 36.6450, lng: 139.0070 },
  { name: "湯沢IC", highway: "関越道", lat: 36.9310, lng: 138.8070 },
  { name: "長岡IC", highway: "関越道", lat: 37.4470, lng: 138.8400 },

  // 東北自動車道
  { name: "川口JCT", highway: "東北道", lat: 35.8370, lng: 139.7300 },
  { name: "浦和IC", highway: "東北道", lat: 35.8530, lng: 139.6770 },
  { name: "久喜IC", highway: "東北道", lat: 36.0750, lng: 139.6620 },
  { name: "佐野藤岡IC", highway: "東北道", lat: 36.3210, lng: 139.6490 },
  { name: "宇都宮IC", highway: "東北道", lat: 36.5680, lng: 139.8770 },
  { name: "那須IC", highway: "東北道", lat: 36.9570, lng: 140.0290 },
  { name: "郡山IC", highway: "東北道", lat: 37.3650, lng: 140.3190 },
  { name: "福島西IC", highway: "東北道", lat: 37.7600, lng: 140.3810 },
  { name: "仙台宮城IC", highway: "東北道", lat: 38.2740, lng: 140.8170 },
  { name: "盛岡IC", highway: "東北道", lat: 39.6700, lng: 141.1200 },

  // 常磐自動車道
  { name: "三郷JCT", highway: "常磐道", lat: 35.8310, lng: 139.8650 },
  { name: "柏IC", highway: "常磐道", lat: 35.8830, lng: 139.9630 },
  { name: "谷田部IC", highway: "常磐道", lat: 36.0500, lng: 140.0670 },
  { name: "水戸IC", highway: "常磐道", lat: 36.3720, lng: 140.4290 },

  // 名神高速
  { name: "一宮IC", highway: "名神高速", lat: 35.2950, lng: 136.8110 },
  { name: "大垣IC", highway: "名神高速", lat: 35.3780, lng: 136.5700 },
  { name: "関ヶ原IC", highway: "名神高速", lat: 35.3670, lng: 136.4580 },
  { name: "彦根IC", highway: "名神高速", lat: 35.2680, lng: 136.2350 },
  { name: "栗東IC", highway: "名神高速", lat: 35.0190, lng: 135.9850 },
  { name: "京都南IC", highway: "名神高速", lat: 34.9570, lng: 135.7520 },
  { name: "茨木IC", highway: "名神高速", lat: 34.8270, lng: 135.5580 },
  { name: "吹田IC", highway: "名神高速", lat: 34.7760, lng: 135.5240 },
  { name: "西宮IC", highway: "名神高速", lat: 34.7540, lng: 135.3530 },

  // 北陸自動車道
  { name: "米原JCT", highway: "北陸道", lat: 35.3300, lng: 136.3280 },
  { name: "敦賀IC", highway: "北陸道", lat: 35.6400, lng: 136.0820 },
  { name: "福井IC", highway: "北陸道", lat: 36.0440, lng: 136.2280 },
  { name: "金沢西IC", highway: "北陸道", lat: 36.5600, lng: 136.5910 },
  { name: "富山IC", highway: "北陸道", lat: 36.7130, lng: 137.2020 },

  // 山陽自動車道
  { name: "神戸JCT", highway: "山陽道", lat: 34.7220, lng: 135.1430 },
  { name: "姫路東IC", highway: "山陽道", lat: 34.8430, lng: 134.7570 },
  { name: "岡山IC", highway: "山陽道", lat: 34.6740, lng: 133.8830 },
  { name: "広島IC", highway: "山陽道", lat: 34.4360, lng: 132.4690 },

  // 九州自動車道
  { name: "門司IC", highway: "九州道", lat: 33.9410, lng: 130.9660 },
  { name: "小倉東IC", highway: "九州道", lat: 33.8640, lng: 130.9170 },
  { name: "福岡IC", highway: "九州道", lat: 33.5730, lng: 130.4470 },
  { name: "鳥栖JCT", highway: "九州道", lat: 33.3770, lng: 130.5180 },
  { name: "熊本IC", highway: "九州道", lat: 32.8140, lng: 130.7760 },
  { name: "鹿児島IC", highway: "九州道", lat: 31.6210, lng: 130.5550 },
];

// Find the nearest IC to a given coordinate
export function findNearestIC(
  lat: number,
  lng: number,
  maxDistanceKm: number = 30
): HighwayIC | null {
  let nearest: HighwayIC | null = null;
  let minDist = Infinity;

  for (const ic of highwayICs) {
    const dLat = ic.lat - lat;
    const dLng = ic.lng - lng;
    // Rough distance in km (approximate for Japan's latitude)
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    if (dist < minDist && dist <= maxDistanceKm) {
      minDist = dist;
      nearest = ic;
    }
  }
  return nearest;
}

// Find the nearest IC along the route between two points
export function findICsForRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  maxDistanceKm: number = 20
): { entryIC: HighwayIC | null; exitIC: HighwayIC | null } {
  const entryIC = findNearestIC(fromLat, fromLng, maxDistanceKm);
  const exitIC = findNearestIC(toLat, toLng, maxDistanceKm);

  // Don't return the same IC for both entry and exit
  if (entryIC && exitIC && entryIC.name === exitIC.name) {
    return { entryIC: null, exitIC: null };
  }

  return { entryIC, exitIC };
}
