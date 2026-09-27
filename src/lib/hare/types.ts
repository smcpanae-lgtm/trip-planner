export type HareWeather = "sunny" | "cloudy" | "rain";

/** /api/hare が返す1地点の結果 */
export interface HareSpot {
  code: string;
  pref: string;
  name: string;
  lat: number;
  lng: number;
  /** 出発地からの直線距離（km、小数1桁） */
  distanceKm: number;
  /** 到着予定時刻（ISO 8601、+09:00） */
  arrivalAt: string;
  weather: HareWeather;
  /** 判定時間帯の最大降水確率（%）。予報が無い時間帯のみなら null */
  maxPrecipProbability: number | null;
  /** 判定時間帯で最も悪い天気コード（WMO） */
  worstWeatherCode: number | null;
}

export interface HareSearchResponse {
  origin: { lat: number; lng: number; /** 出発地の陸地ID（honshu・hokkaido・okinawa・island:島名） */ land: string };
  radiusKm: number;
  departureAt: string;
  spots: HareSpot[];
  /** 予報を取得できなかった地点数（429 等） */
  unavailableCount: number;
}

export interface HarePlaceMatch {
  name: string;
  pref: string;
  lat: number;
  lng: number;
}
