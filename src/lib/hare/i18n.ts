// 晴れ探しドライブの表示文言。現状は日本語のみ。
// 多言語化するときは HareDict を満たす辞書を追加し、呼び出し側で言語を選ぶ。

import type { HareWeather } from "./types";

export interface HareDict {
  pageTitle: string;
  /** トップページ（プラン作成フォーム付近）からの導線 */
  topPageLink: string;
  /** トップページ導線カードの説明文 */
  topPageLinkDescription: string;
  lead: string;
  breadcrumbHome: string;
  originLabel: string;
  useCurrentLocation: string;
  locating: string;
  originPlaceholder: string;
  originSearch: string;
  originSet: (name: string) => string;
  currentLocationName: string;
  radiusLabel: (km: number) => string;
  departureLabel: string;
  departureNow: string;
  departureToday: string;
  departureTomorrow: string;
  departureTime: string;
  searchButton: string;
  searching: string;
  weatherLabel: Record<HareWeather, string>;
  legendTitle: string;
  originMarker: string;
  resultSunnyTitle: (count: number) => string;
  resultCloudyTitle: (count: number) => string;
  noSunnyNotice: string;
  noResultNotice: string;
  distance: (km: number) => string;
  arrival: (time: string) => string;
  arrivalTomorrow: (time: string) => string;
  arrivalOnDate: (month: number, day: number, time: string) => string;
  precipProbability: (p: number | null) => string;
  makePlan: string;
  showMore: (rest: number) => string;
  summary: (sunny: number, cloudy: number, rain: number) => string;
  landNotice: (land: string) => string;
  landLabel: (land: string) => string;
  unavailableNotice: (count: number) => string;
  assumptionNote: (factor: number, speed: number, hours: number) => string;
  judgeNote: (sunnyMax: number, rainMin: number) => string;
  errors: {
    geolocationUnsupported: string;
    geolocationDenied: string;
    originRequired: string;
    originNotFound: string;
    rateLimited: string;
    failed: string;
  };
  attributionTitle: string;
  attributionWeather: string;
  attributionBoundary: string;
  mapLoading: string;
}

export const hareJa: HareDict = {
  pageTitle: "晴れ探しドライブ",
  topPageLink: "雨の日は晴れの場所を探す",
  topPageLinkDescription: "現在地から半径50〜300km以内の晴れの地域を表示",
  lead: "雨の日でも、車で行ける範囲に晴れている場所があるかもしれません。出発地と行ける距離を選ぶと、到着する頃に晴れていそうな市町村を地図と一覧で探します。",
  breadcrumbHome: "AIドライブプランナー",
  originLabel: "出発地",
  useCurrentLocation: "現在地を使う",
  locating: "現在地を取得中…",
  originPlaceholder: "例：横浜市、軽井沢駅",
  originSearch: "設定",
  originSet: (name) => `出発地：${name}`,
  currentLocationName: "現在地",
  radiusLabel: (km) => `探す範囲：半径 ${km}km`,
  departureLabel: "出発",
  departureNow: "今すぐ",
  departureToday: "今日",
  departureTomorrow: "明日",
  departureTime: "出発時刻",
  searchButton: "晴れの場所を探す",
  searching: "天気を調べています…",
  weatherLabel: { sunny: "晴れ", cloudy: "くもり", rain: "雨" },
  legendTitle: "到着後3時間の天気",
  originMarker: "出発地",
  resultSunnyTitle: (count) => `晴れの場所（${count}か所・近い順）`,
  resultCloudyTitle: (count) => `くもりの場所（${count}か所・近い順）`,
  noSunnyNotice: "この範囲・時間に晴れの場所は見つかりませんでした。雨を避けられる「くもり」の場所を近い順に表示しています。",
  noResultNotice: "この範囲・時間は雨の予報ばかりでした。範囲を広げるか、出発時刻を変えてお試しください。",
  distance: (km) => `直線 ${Math.round(km)}km`,
  arrival: (time) => `${time}ごろ到着`,
  arrivalTomorrow: (time) => `明日 ${time}`,
  arrivalOnDate: (month, day, time) => `${month}/${day} ${time}`,
  precipProbability: (p) => (p == null ? "降水確率 -" : `降水確率 ${p}%`),
  makePlan: "ここへドライブプランを作る",
  showMore: (rest) => `さらに表示（残り${rest}件）`,
  summary: (sunny, cloudy, rain) => `晴れ ${sunny}・くもり ${cloudy}・雨 ${rain}（市区町村）`,
  landNotice: (land) =>
    `フェリーが必要な島は除き、${land}の中だけを探しています。`,
  landLabel: (land) => {
    if (land === "honshu") return "本州・九州・四国と橋やトンネルでつながる島";
    if (land === "hokkaido") return "北海道";
    if (land === "okinawa") return "沖縄本島";
    return land.startsWith("island:") ? land.slice("island:".length) : land;
  },
  unavailableNotice: (count) => `${count}か所は予報を取得できなかったため表示していません。`,
  assumptionNote: (factor, speed, hours) =>
    `到着時刻は直線距離×${factor}を道のりとし、平均時速${speed}kmで走った場合の目安です。到着から${hours}時間の予報で判定しています。`,
  judgeNote: (sunnyMax, rainMin) =>
    `晴れ：快晴・晴れ・薄曇りで降水確率${sunnyMax}%未満。雨：雨や雪の予報、または降水確率${rainMin}%以上。それ以外はくもり。各市区町村の代表地点（山間部の場合あり）の予報です。`,
  errors: {
    geolocationUnsupported: "このブラウザでは現在地を取得できません。地名を入力してください。",
    geolocationDenied: "現在地を取得できませんでした。位置情報の許可を確認するか、地名を入力してください。",
    originRequired: "出発地を設定してください。",
    originNotFound: "出発地が見つかりませんでした。別の地名でお試しください。",
    rateLimited: "天気予報の取得が混み合っています。少し時間をおいてお試しください。",
    failed: "天気予報を取得できませんでした。時間をおいてお試しください。",
  },
  attributionTitle: "出典",
  attributionWeather: "気象データ：Open-Meteo.com（CC BY 4.0）",
  attributionBoundary: "市区町村の代表地点：「国土数値情報（行政区域データ）」（国土交通省）を加工して作成",
  mapLoading: "地図を読み込み中…",
};
