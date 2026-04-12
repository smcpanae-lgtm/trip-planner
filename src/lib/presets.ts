// Preset tourist spots for "お任せ" feature
// Organized by region for smart suggestions

export interface PresetSpot {
  name: string;
  region: string;
  lat: number;
  lng: number;
  category: string;
  description: string;
}

export const presetSpots: PresetSpot[] = [
  // 関東
  { name: "鎌倉 鶴岡八幡宮", region: "関東", lat: 35.3258, lng: 139.5564, category: "神社", description: "鎌倉のシンボル的な神社" },
  { name: "江ノ島", region: "関東", lat: 35.3005, lng: 139.4817, category: "観光地", description: "湘南の人気スポット" },
  { name: "箱根大涌谷", region: "関東", lat: 35.2429, lng: 139.0211, category: "自然", description: "噴煙と黒たまごが名物" },
  { name: "日光東照宮", region: "関東", lat: 36.7581, lng: 139.5988, category: "神社", description: "世界遺産の荘厳な神社" },
  { name: "草津温泉 湯畑", region: "関東", lat: 36.6213, lng: 138.5960, category: "温泉", description: "日本三名泉のひとつ" },
  { name: "秩父 三峯神社", region: "関東", lat: 35.9297, lng: 138.9319, category: "神社", description: "標高1100mのパワースポット" },
  { name: "横浜中華街", region: "関東", lat: 35.4437, lng: 139.6474, category: "グルメ", description: "日本最大の中華街" },
  { name: "東京スカイツリー", region: "関東", lat: 35.7101, lng: 139.8107, category: "観光地", description: "高さ634mの電波塔" },

  // 関西
  { name: "清水寺", region: "関西", lat: 34.9949, lng: 135.7850, category: "寺", description: "京都を代表する名刹" },
  { name: "伏見稲荷大社", region: "関西", lat: 34.9671, lng: 135.7727, category: "神社", description: "千本鳥居で有名" },
  { name: "嵐山 竹林の小径", region: "関西", lat: 35.0173, lng: 135.6717, category: "自然", description: "幻想的な竹林" },
  { name: "奈良公園", region: "関西", lat: 34.6851, lng: 135.8430, category: "公園", description: "鹿と世界遺産の公園" },
  { name: "大阪城", region: "関西", lat: 34.6873, lng: 135.5262, category: "城", description: "天下人の城" },
  { name: "道頓堀", region: "関西", lat: 34.6687, lng: 135.5013, category: "グルメ", description: "大阪グルメの聖地" },
  { name: "姫路城", region: "関西", lat: 34.8394, lng: 134.6939, category: "城", description: "白鷺城とも呼ばれる世界遺産" },
  { name: "有馬温泉", region: "関西", lat: 34.7970, lng: 135.2484, category: "温泉", description: "日本三古湯のひとつ" },

  // 中部
  { name: "白川郷", region: "中部", lat: 36.2576, lng: 136.9066, category: "世界遺産", description: "合掌造りの里" },
  { name: "上高地 河童橋", region: "中部", lat: 36.2478, lng: 137.6302, category: "自然", description: "北アルプスの玄関口" },
  { name: "金沢 兼六園", region: "中部", lat: 36.5624, lng: 136.6623, category: "庭園", description: "日本三名園のひとつ" },
  { name: "富士山五合目", region: "中部", lat: 35.3400, lng: 138.7310, category: "自然", description: "日本一の山の中腹" },
  { name: "伊勢神宮", region: "中部", lat: 34.4550, lng: 136.7260, category: "神社", description: "お伊勢さん" },
  { name: "名古屋城", region: "中部", lat: 35.1855, lng: 136.8990, category: "城", description: "金のしゃちほこ" },

  // 東北
  { name: "松島", region: "東北", lat: 38.3670, lng: 141.0631, category: "自然", description: "日本三景のひとつ" },
  { name: "銀山温泉", region: "東北", lat: 38.5685, lng: 140.5327, category: "温泉", description: "大正ロマンの温泉街" },
  { name: "角館 武家屋敷通り", region: "東北", lat: 39.5968, lng: 140.5614, category: "歴史", description: "みちのくの小京都" },
  { name: "奥入瀬渓流", region: "東北", lat: 40.5392, lng: 140.8550, category: "自然", description: "美しい渓流散策路" },

  // 九州
  { name: "太宰府天満宮", region: "九州", lat: 33.5212, lng: 130.5352, category: "神社", description: "学問の神様" },
  { name: "別府温泉 地獄めぐり", region: "九州", lat: 33.3200, lng: 131.4800, category: "温泉", description: "7つの地獄を巡る" },
  { name: "阿蘇山 草千里", region: "九州", lat: 32.8840, lng: 131.0560, category: "自然", description: "雄大な草原と火山" },
  { name: "屋久島 白谷雲水峡", region: "九州", lat: 30.3788, lng: 130.5800, category: "自然", description: "もののけ姫の森" },
  { name: "高千穂峡", region: "九州", lat: 32.7130, lng: 131.3060, category: "自然", description: "神話の里の渓谷" },

  // 北海道
  { name: "小樽運河", region: "北海道", lat: 43.1975, lng: 140.9945, category: "観光地", description: "レトロな運河沿い" },
  { name: "富良野 ファーム富田", region: "北海道", lat: 43.3530, lng: 142.3830, category: "自然", description: "ラベンダー畑" },
  { name: "美瑛 青い池", region: "北海道", lat: 43.4690, lng: 142.6210, category: "自然", description: "幻想的な青い水面" },
  { name: "函館山", region: "北海道", lat: 41.7580, lng: 140.7020, category: "夜景", description: "百万ドルの夜景" },
  { name: "登別温泉 地獄谷", region: "北海道", lat: 42.4933, lng: 141.1570, category: "温泉", description: "迫力の噴気孔" },
];

export function getRandomSpots(count: number = 2): PresetSpot[] {
  const shuffled = [...presetSpots].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getSpotsByRegion(region: string, count: number = 2): PresetSpot[] {
  const regional = presetSpots.filter(s => s.region === region);
  if (regional.length === 0) return getRandomSpots(count);
  const shuffled = [...regional].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
