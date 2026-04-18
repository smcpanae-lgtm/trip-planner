export interface Spot {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  isOmakase: boolean;
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
}

export interface RemovedSpot {
  name: string;
  reason: string;
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
}

export interface SearchCandidate {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PlanVariantData {
  planName: string;
  planDescription: string;
  spots: GeocodedSpot[];
  itineraries: DayItinerary[];
  routePolylines?: { dayIndex: number; path: { lat: number; lng: number }[] }[];
}
