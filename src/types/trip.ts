import type { DayScheduleCheck } from "@/lib/scheduleCheck";

export type SpotMeal = "" | "lunch" | "dinner";

export interface Spot {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  isOmakase: boolean;
  /**
   * この目的地自体を昼食／夕食の場所として使う指定。
   * 「夕食を含める」設定と目的地（レストラン等）が二重にならないようにするためのもので、
   * 指定した場合は同じ食事について別の食事スポットをAIに追加させない。
   */
  meal?: SpotMeal;
}

export interface DayPlan {
  dayIndex: number;
  departure: string;
  departureTime: string;
  destinations: Spot[];
  arrival: string;
  arrivalTime: string;
  includeLunch: boolean;
  lunchLocation: string;
  lunchGenre: string;
  includeDinner: boolean;
  dinnerLocation: string;
  dinnerGenre: string;
  firstDestId?: string; // spot ID of the destination to visit first
}

export interface TravelerProfile {
  partyType: "" | "solo" | "couple" | "family" | "friends" | "senior";
  ageRange: "" | "20s" | "30s" | "40s" | "50s" | "60s" | "70plus";
  hobbies: string; // space-separated, e.g. "釣り 温泉 写真"
  hasChildren: boolean;
  childAges: string; // e.g. "3歳、7歳"
}

export interface TripConfig {
  nights: number;
  days: DayPlan[];
  withDog: boolean;
  aiOmakase: boolean;
  useHighway: boolean; // true = highways allowed (default), false = general roads only
  travelDate?: string; // "YYYY-MM-DD" format, optional
  travelerProfile?: TravelerProfile;
}

export interface GeocodedSpot {
  name: string;
  lat: number;
  lng: number;
  parking: string;
  parkingNote: string;
  type: "departure" | "destination" | "arrival";
  dayIndex: number;
  orderIndex: number;
}

export interface HighwaySegment {
  entryIC: string;
  exitIC: string;
  entryHighway: string;
  exitHighway: string;
}

export interface MealStop {
  name: string;
  type: "PA" | "SA" | "道の駅";
  features: string;
  lat: number;
  lng: number;
}

export interface ItineraryItem {
  spot: GeocodedSpot;
  arrivalTime: string;
  departureTime: string;
  stayMinutes: number;
  distanceKm: number;
  travelMinutes: number;
  highway?: HighwaySegment;
  mealStop?: MealStop;
  parkingInfo?: string;
  dogWalkStop?: boolean;
  description?: string;
  address?: string;
  isMealSpot?: "lunch" | "dinner";
  /**
   * AIが書いたマイカー規制の注意（AIの判断なので確実ではない）。
   * 登録済みの規制区域（src/data/carRestrictions.ts）に当たる地点では表示しない（リストの警告を優先）。
   */
  carRestrictionNote?: string;
}

export interface RemovedSpot {
  name: string;
  reason: string;
  /**
   * AIプランでサーバーが付ける出どころ。
   * ai: AIが理由を書いて除外したもの / unexplained: AIが理由を示さずに省略したもの
   */
  source?: "ai" | "unexplained";
}

export interface PlanCommentary {
  removedSpots: RemovedSpot[];
  highlights: string[];
  tips: string[];
  dogTips?: string[];
  overallDescription?: string;
}

export interface MealSpotInfo {
  name: string;
  description: string;
  nearSpot: string;
  alternatives?: string[];
}

export interface DayItinerary {
  dayIndex: number;
  items: ItineraryItem[];
  lunchGenre: string;
  dinnerGenre: string;
  lunchSpotInfo?: MealSpotInfo;
  dinnerSpotInfo?: MealSpotInfo;
  commentary?: PlanCommentary;
  /** AIの時刻による到着見込みの判定（/api/plan がサーバー側で計算） */
  scheduleCheck?: DayScheduleCheck;
  /** 地図の経路の所要時間による判定（/api/directions が計算）。あればこちらを優先して表示する */
  routeScheduleCheck?: DayScheduleCheck;
}

export interface SearchCandidate {
  name: string;
  address: string;
  // Autocomplete(New) の候補はplaceIdのみで座標を持たず、選択時に別途Place Detailsで解決する。
  // プリセット/Nominatim結果は最初からlat/lngを持つ。
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface RoutePolyline {
  dayIndex: number;
  path: { lat: number; lng: number }[];
  /** 経路が取れなかった日の代用（地点を直線で結んだもの） */
  straight?: boolean;
}

export interface PlanVariantData {
  planName: string;
  planDescription: string;
  spots: GeocodedSpot[];
  itineraries: DayItinerary[];
  routePolylines?: RoutePolyline[];
  /** 高速道路を使わない設定で作ったプラン（地図の経路も一般道で出す） */
  avoidHighways?: boolean;
}
