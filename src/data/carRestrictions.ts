import type { TripLangCode } from "@/lib/i18n/tripPlannerDictionaries";

/**
 * マイカー規制区域（自家用車で入れない・時期により入れない場所）の登録リスト。
 * 判定は src/lib/carRestriction.ts。外部APIは使わず、ここに書いた範囲だけを判定する。
 *
 * 規制されるのは施設ではなく道路なので、円（zones）は規制区間の先にある地点だけに置く。
 * 乗り換え駐車場・規制の手前の地点は円に入れず、名前で当たりやすいものは excludeKeywords に書く。
 * 座標は OpenStreetMap（Nominatim）で確認した値。
 *
 * 追加するとき:
 * - period は、道路が開いている間ずっと規制なら "yearRound"、一部の期間だけなら "seasonal"。
 *   期間や日付は年ごとに変わるので持たない（警告文も「時期により」とだけ書く）。
 * - keywords は名前・住所に含まれていれば当たる。同名の場所が各地にあっても、
 *   座標が区域から 50km 以上離れていれば当たらない（carRestriction.ts の KEYWORD_GUARD_KM）。
 * - excludeKeywords は名前だけを見る（住所の市町村名で規制区域内の地点まで外さないため）。
 * - 表記ゆれ（ヶ／ケ／が、ノ／の、澤／沢、5合目／五合目、空白）は判定側で吸収する。
 */
export interface CarRestrictionArea {
  id: string;
  /** 警告に出す区域名。ja・en は必須、ほかの言語は無ければ en を使う */
  name: { ja: string; en: string } & Partial<Record<TripLangCode, string>>;
  period: "yearRound" | "seasonal";
  /** 規制される道路（保守用のメモ。画面には出さない） */
  roads: string;
  zones: { lat: number; lng: number; radiusKm: number; label: string }[];
  keywords: string[];
  excludeKeywords?: string[];
  /** 公式情報・座標を確認した日 */
  checkedAt: string;
}

export const CAR_RESTRICTION_AREAS: CarRestrictionArea[] = [
  {
    id: "shiretoko-kamuiwakka",
    name: { ja: "知床", en: "Shiretoko" },
    // 2026年は 8/8〜8/15 のみシャトルバス期間（それ以外の開通期間はマイカーで行ける）。知床五湖までは規制なし
    period: "seasonal",
    roads: "道道知床公園線（知床五湖〜カムイワッカ）",
    zones: [{ lat: 44.1555, lng: 145.131, radiusKm: 1.5, label: "カムイワッカ湯の滝・知床大橋" }],
    keywords: ["カムイワッカ", "知床大橋"],
    excludeKeywords: ["知床五湖", "ウトロ", "知床峠", "岩尾別"],
    checkedAt: "2026-09-13",
  },
  {
    id: "oze",
    name: { ja: "尾瀬", en: "Oze" },
    // 鳩待峠口は道路が開いている期間（2026年は 4/17〜11/5）ずっと規制。沼山峠口も規制
    period: "yearRound",
    roads: "県道260号（津奈木ゲート〜鳩待峠）・国道352号（御池〜沼山峠）",
    zones: [
      { lat: 36.8903, lng: 139.2005, radiusKm: 1.0, label: "鳩待峠" },
      { lat: 36.9161, lng: 139.1971, radiusKm: 1.0, label: "山ノ鼻" },
      { lat: 36.9398, lng: 139.2416, radiusKm: 3.0, label: "尾瀬ヶ原・見晴" },
      { lat: 36.9278, lng: 139.3053, radiusKm: 2.0, label: "尾瀬沼" },
      { lat: 36.9433, lng: 139.3306, radiusKm: 0.8, label: "沼山峠" },
    ],
    keywords: ["尾瀬ヶ原", "尾瀬沼", "鳩待峠", "沼山峠", "山ノ鼻"],
    excludeKeywords: ["戸倉", "大清水", "御池"],
    checkedAt: "2026-09-13",
  },
  {
    id: "okunikko",
    name: { ja: "奥日光", en: "Oku-Nikko" },
    period: "yearRound",
    roads: "市道1002号（赤沼〜千手ヶ浜）",
    zones: [
      { lat: 36.7484, lng: 139.4226, radiusKm: 1.0, label: "千手ヶ浜" },
      { lat: 36.7428, lng: 139.3984, radiusKm: 1.0, label: "西ノ湖" },
      // 戦場ヶ原（車で行ける）と約1.6kmしか離れていないため小さくする
      { lat: 36.776, lng: 139.4246, radiusKm: 0.7, label: "小田代原" },
    ],
    keywords: ["千手ヶ浜", "西ノ湖", "小田代原"],
    excludeKeywords: ["戦場ヶ原", "赤沼", "湯元", "竜頭"],
    checkedAt: "2026-09-13",
  },
  {
    id: "minami-alps",
    name: { ja: "南アルプス", en: "Southern Alps" },
    period: "yearRound",
    roads: "南アルプス林道（夜叉神峠〜広河原、仙流荘〜北沢峠）・県道南アルプス公園線（奈良田〜広河原）",
    zones: [
      { lat: 35.7422, lng: 138.2135, radiusKm: 1.0, label: "北沢峠" },
      { lat: 35.697, lng: 138.2711, radiusKm: 1.0, label: "広河原" },
    ],
    keywords: ["北沢峠", "広河原", "北岳", "仙丈ヶ岳"],
    excludeKeywords: ["夜叉神", "仙流荘", "奈良田", "戸台", "芦安"],
    checkedAt: "2026-09-13",
  },
  {
    id: "kamikochi",
    name: { ja: "上高地", en: "Kamikochi" },
    period: "yearRound",
    roads: "県道上高地公園線（釜トンネル〜上高地）",
    zones: [
      // 釜トンネル（ゲート）まで約1.9km、中の湯まで約2.4km
      { lat: 36.2287, lng: 137.6187, radiusKm: 1.0, label: "大正池" },
      { lat: 36.2385, lng: 137.629, radiusKm: 0.9, label: "田代池・帝国ホテル" },
      { lat: 36.2488, lng: 137.6378, radiusKm: 1.3, label: "河童橋・バスターミナル" },
      { lat: 36.254, lng: 137.664, radiusKm: 1.2, label: "明神池" },
      { lat: 36.26, lng: 137.7077, radiusKm: 1.5, label: "徳沢" },
    ],
    keywords: ["上高地", "河童橋", "大正池", "田代池", "明神池", "穂高神社奥宮", "嘉門次小屋", "徳沢", "横尾山荘", "涸沢"],
    excludeKeywords: ["沢渡", "さわんど", "平湯", "あかんだな", "新島々", "中の湯", "釜トンネル", "坂巻", "上高地線"],
    checkedAt: "2026-09-13",
  },
  {
    id: "kiso-komagatake",
    name: { ja: "木曽駒ヶ岳", en: "Mt. Kiso-Komagatake" },
    period: "yearRound",
    roads: "県道駒ヶ岳公園線（菅の台〜しらび平）",
    zones: [
      { lat: 35.7678, lng: 137.834, radiusKm: 0.8, label: "しらび平" },
      { lat: 35.7799, lng: 137.8127, radiusKm: 1.0, label: "千畳敷カール" },
      { lat: 35.7896, lng: 137.8046, radiusKm: 0.8, label: "木曽駒ヶ岳" },
    ],
    keywords: ["しらび平", "千畳敷", "木曽駒ヶ岳", "駒ヶ岳ロープウェイ"],
    excludeKeywords: ["菅の台", "駒ヶ根高原"],
    checkedAt: "2026-09-13",
  },
  {
    id: "norikura",
    name: { ja: "乗鞍", en: "Norikura" },
    period: "yearRound",
    roads: "乗鞍エコーライン（三本滝〜畳平）・乗鞍スカイライン（平湯峠〜畳平）",
    zones: [
      { lat: 36.1245, lng: 137.5536, radiusKm: 1.5, label: "畳平・大雪渓" },
      // 三本滝（車で行ける）まで約2.1km
      { lat: 36.1193, lng: 137.5709, radiusKm: 1.0, label: "位ヶ原山荘" },
    ],
    keywords: ["畳平", "乗鞍岳", "乗鞍スカイライン", "乗鞍エコーライン", "位ヶ原", "大雪渓", "肩の小屋", "鶴ヶ池", "魔王岳"],
    excludeKeywords: ["乗鞍高原", "三本滝", "ほおのき平", "観光センター", "休暇村", "平湯", "鈴蘭"],
    checkedAt: "2026-09-13",
  },
  {
    id: "tateyama",
    name: { ja: "立山黒部アルペンルート", en: "Tateyama Kurobe Alpine Route" },
    period: "yearRound",
    roads: "立山有料道路（桂台〜室堂）。黒部ダム側は扇沢から関電トンネル（電気バス）のみ",
    zones: [
      { lat: 36.5772, lng: 137.5958, radiusKm: 1.2, label: "室堂・みくりが池" },
      { lat: 36.5805, lng: 137.5792, radiusKm: 0.8, label: "天狗平" },
      { lat: 36.5672, lng: 137.5575, radiusKm: 1.5, label: "弥陀ヶ原" },
      // 立山駅（車で行ける）まで約1.2kmしか離れていないため小さくする
      { lat: 36.5833, lng: 137.4586, radiusKm: 0.5, label: "美女平" },
      { lat: 36.5696, lng: 137.6318, radiusKm: 1.0, label: "大観峰・黒部平" },
      { lat: 36.5667, lng: 137.6636, radiusKm: 1.0, label: "黒部ダム" },
    ],
    keywords: ["室堂", "弥陀ヶ原", "美女平", "みくりが池", "天狗平", "雷鳥沢", "アルペンルート", "大観峰", "黒部平", "黒部ダム", "黒部湖"],
    excludeKeywords: ["立山駅", "称名滝", "扇沢", "立山山麓"],
    checkedAt: "2026-09-13",
  },
  {
    id: "fuji-5th",
    name: { ja: "富士山五合目", en: "Mt. Fuji 5th Stations" },
    // 夏の登山シーズンなどに規制（期間は道路・年ごとに異なる）。御殿場口新五合目は規制なし
    period: "seasonal",
    roads: "富士スバルライン（吉田口）・富士山スカイライン（富士宮口）・ふじあざみライン（須走口）",
    zones: [
      { lat: 35.3939, lng: 138.7336, radiusKm: 1.5, label: "富士スバルライン五合目" },
      { lat: 35.3905, lng: 138.7037, radiusKm: 0.8, label: "奥庭" },
      { lat: 35.3368, lng: 138.733, radiusKm: 1.2, label: "富士宮口五合目" },
      // 御殿場口新五合目（規制なし）まで約3.6km
      { lat: 35.3656, lng: 138.7784, radiusKm: 1.2, label: "須走口五合目" },
    ],
    keywords: [
      "富士山五合目",
      "スバルライン五合目",
      "吉田口五合目",
      "河口湖口五合目",
      "富士宮口五合目",
      "富士宮口新五合目",
      "須走口五合目",
      "須走口新五合目",
      "須走五合目",
      "富士スバルライン",
      "富士山スカイライン",
      "ふじあざみライン",
      "奥庭駐車場",
      "奥庭荘",
      "富士山奥庭",
    ],
    excludeKeywords: ["御殿場口", "水ヶ塚", "すばしり多用途広場", "道の駅すばしり", "料金所", "富士北麓"],
    checkedAt: "2026-09-13",
  },
  {
    id: "hayachine",
    name: { ja: "早池峰山", en: "Mt. Hayachine" },
    period: "seasonal",
    roads: "県道25号紫波江繋線（河原の坊〜小田越）",
    zones: [
      { lat: 39.5408, lng: 141.4956, radiusKm: 1.0, label: "小田越" },
      { lat: 39.5408, lng: 141.4793, radiusKm: 0.8, label: "河原の坊" },
      { lat: 39.5584, lng: 141.489, radiusKm: 1.0, label: "早池峰山" },
    ],
    keywords: ["早池峰山", "小田越", "河原の坊", "河原坊"],
    excludeKeywords: ["早池峰神社", "早池峰ダム"],
    checkedAt: "2026-09-13",
  },
  {
    id: "akita-komagatake",
    name: { ja: "秋田駒ヶ岳", en: "Mt. Akita-Komagatake" },
    period: "seasonal",
    roads: "県道127号（アルパこまくさ〜八合目）",
    zones: [
      // アルパこまくさ（乗り換え地点）まで約3.8km
      { lat: 39.7681, lng: 140.8072, radiusKm: 1.0, label: "八合目" },
      { lat: 39.7531, lng: 140.7957, radiusKm: 1.2, label: "秋田駒ヶ岳" },
    ],
    keywords: ["秋田駒ヶ岳", "秋田駒", "駒ヶ岳八合目", "男女岳"],
    excludeKeywords: ["アルパこまくさ", "駒ヶ岳温泉", "田沢湖高原温泉", "水沢温泉", "乳頭温泉"],
    checkedAt: "2026-09-13",
  },
];
