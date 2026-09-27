// 晴れ探しドライブ（/hare）の判定・検索パラメータ。
// 値を調整するときはここだけを変更する。

/** 直線距離 → 道のり距離の補正係数（道路の曲がりを見込む） */
export const ROAD_DISTANCE_FACTOR = 1.3;
/** 到着時刻の計算に使う平均速度（km/h） */
export const AVERAGE_SPEED_KMH = 50;
/** 到着後、天気を判定する時間帯の長さ（時間） */
export const WEATHER_WINDOW_HOURS = 3;

/** 晴れ判定：降水確率がこの値未満（%） */
export const SUNNY_MAX_PRECIP_PROBABILITY = 30;
/** 雨判定：降水確率がこの値以上（%） */
export const RAIN_MIN_PRECIP_PROBABILITY = 50;
/** 晴れとみなす WMO 天気コード（0 快晴・1 晴れ・2 薄曇り） */
export const SUNNY_WEATHER_CODES: readonly number[] = [0, 1, 2];
/**
 * 降水とみなす WMO 天気コードの範囲（両端を含む）。
 * 霧雨・雨・着氷性の雨・雪・にわか雨・にわか雪・雷雨。霧（45・48）は含めない（くもり扱い）。
 */
export const RAIN_WEATHER_CODE_RANGES: readonly (readonly [number, number])[] = [
  [51, 67],
  [71, 77],
  [80, 86],
  [95, 99],
];

/** 検索半径（km） */
export const RADIUS_MIN_KM = 50;
export const RADIUS_MAX_KM = 300;
export const RADIUS_DEFAULT_KM = 200;
export const RADIUS_STEP_KM = 10;

/**
 * 天気セルの一辺（度）。同じセルに入る市町村は1地点の予報を共有する。
 * 0.2° ≒ 南北22km・東西18km。キャッシュ単位（WEATHER_TILE_DEG）を割り切れる値にすること。
 */
export const WEATHER_CELL_DEG = 0.2;
/** 予報取得とキャッシュ共有の単位（度）。タイルごとにURLが決まるので、利用者間でキャッシュが共有される */
export const WEATHER_TILE_DEG = 1;
/** Open-Meteo の応答をキャッシュする秒数 */
export const WEATHER_CACHE_SECONDS = 3600;
/** 取得する予報日数（今日・明日の出発＋移動時間を賄う） */
export const FORECAST_DAYS = 3;
/** 1回の Open-Meteo リクエストに含める地点数の上限（URL長の安全策） */
export const MAX_LOCATIONS_PER_REQUEST = 100;

/** Open-Meteo へ同時に送るリクエスト数の上限（無料版で短時間に集中すると 429 になりやすい） */
export const MAX_CONCURRENT_REQUESTS = 4;
/** 429 を受けたときに1回だけ再試行するまでの待ち時間（ミリ秒） */
export const RATE_LIMIT_RETRY_DELAY_MS = 1500;

/** 予報のタイムゾーン */
export const FORECAST_TIMEZONE = "Asia/Tokyo";
