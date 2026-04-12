import {
  GeocodedSpot,
  DayItinerary,
  ItineraryItem,
  HighwaySegment,
  MealStop,
  PlanCommentary,
  RemovedSpot,
} from "@/types/trip";
import { calcDistance, estimateTravelMinutes } from "./geocoding";
import { findICsForRoute } from "./highway";
import { findNearestRestStop } from "./rest-stops";

const DEFAULT_STAY_MINUTES = 60;
const DOG_WALK_INTERVAL_MINUTES = 120; // Dog walk every 2 hours of driving

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Determine parking info based on spot name/type
function inferParking(name: string): string {
  const parkingDedicated = [
    "城", "神宮", "大社", "テーマパーク", "SA", "PA", "道の駅",
    "IC", "アウトレット", "モール", "公園", "動物園", "水族館",
    "美術館", "博物館", "温泉", "スキー", "ゴルフ",
  ];
  const parkingNearby = [
    "神社", "寺", "商店街", "中華街", "温泉街", "渓谷", "滝",
  ];
  const parkingNone = [
    "駅", "空港",
  ];

  for (const kw of parkingDedicated) {
    if (name.includes(kw)) return "専用駐車場あり";
  }
  for (const kw of parkingNearby) {
    if (name.includes(kw)) return "周辺に駐車場あり";
  }
  for (const kw of parkingNone) {
    if (name.includes(kw)) return "駅周辺の有料駐車場を利用";
  }
  return "周辺の駐車場を確認してください";
}

// Check if meal genre suggests PA or michi-no-eki
function parseMealType(genre: string): "PA" | "道の駅" | "both" | null {
  if (!genre) return null;
  const lower = genre.toLowerCase();
  if (
    lower.includes("パーキング") ||
    lower.includes("pa") ||
    lower.includes("sa") ||
    lower.includes("サービスエリア")
  ) {
    return "PA";
  }
  if (lower.includes("道の駅") || lower.includes("みちのえき")) {
    return "道の駅";
  }
  if (
    lower.includes("休憩") ||
    lower.includes("パーキングエリア") ||
    lower.includes("道の駅")
  ) {
    return "both";
  }
  return null;
}

// Generate highlights based on spot names
function generateHighlights(spots: GeocodedSpot[]): string[] {
  const highlights: string[] = [];
  const destinations = spots.filter((s) => s.type === "destination");

  if (destinations.length === 0) return highlights;

  // Scenic/nature spots
  const natureKeywords = ["公園", "渓谷", "滝", "湖", "山", "海", "岬", "島", "森", "高原"];
  const natureSpots = destinations.filter((s) =>
    natureKeywords.some((kw) => s.name.includes(kw))
  );
  if (natureSpots.length > 0) {
    highlights.push(`自然スポット: ${natureSpots.map((s) => s.name).join("、")}で絶景を楽しめます`);
  }

  // Cultural spots
  const cultureKeywords = ["城", "神社", "寺", "神宮", "大社", "美術館", "博物館"];
  const cultureSpots = destinations.filter((s) =>
    cultureKeywords.some((kw) => s.name.includes(kw))
  );
  if (cultureSpots.length > 0) {
    highlights.push(`歴史・文化: ${cultureSpots.map((s) => s.name).join("、")}を巡ります`);
  }

  // Fun/leisure spots
  const leisureKeywords = ["テーマパーク", "水族館", "動物園", "アウトレット", "温泉"];
  const leisureSpots = destinations.filter((s) =>
    leisureKeywords.some((kw) => s.name.includes(kw))
  );
  if (leisureSpots.length > 0) {
    highlights.push(`レジャー: ${leisureSpots.map((s) => s.name).join("、")}で楽しい時間を`);
  }

  // If no specific category matched, generic highlight
  if (highlights.length === 0) {
    highlights.push(`${destinations.length}箇所の目的地を効率的に巡るルートです`);
  }

  return highlights;
}

// Generate tips based on itinerary
function generateTips(items: ItineraryItem[], spots: GeocodedSpot[]): string[] {
  const tips: string[] = [];

  // Long drive warning
  const longDrives = items.filter((item) => item.travelMinutes > 90);
  if (longDrives.length > 0) {
    tips.push("90分以上の長距離運転区間があります。途中で休憩を取りましょう");
  }

  // Highway usage tip
  const hasHighway = items.some((item) => item.highway);
  if (hasHighway) {
    tips.push("高速道路を利用する区間があります。ETC カードの準備をお忘れなく");
  }

  // Early departure tip
  if (items.length > 0 && timeToMinutes(items[0].arrivalTime) < 480) {
    tips.push("早朝の出発です。前日は早めに休みましょう");
  }

  // Many destinations
  const destinations = spots.filter((s) => s.type === "destination");
  if (destinations.length >= 4) {
    tips.push("目的地が多いため、各地での滞在時間にご注意ください");
  }

  return tips;
}

// Generate dog-specific tips
function generateDogTips(items: ItineraryItem[], spots: GeocodedSpot[]): string[] {
  const tips: string[] = [];

  tips.push("各目的地でのペット同伴可否を事前に確認してください");
  tips.push("車内の温度管理にご注意ください（夏場はエアコン必須）");

  const longDrives = items.filter((item) => item.travelMinutes > 60);
  if (longDrives.length > 0) {
    tips.push("長距離移動中は水分補給とトイレ休憩をこまめに取りましょう");
  }

  // Check for indoor spots that might not allow dogs
  const indoorKeywords = ["美術館", "博物館", "水族館", "テーマパーク", "アウトレット"];
  const indoorSpots = spots.filter(
    (s) => s.type === "destination" && indoorKeywords.some((kw) => s.name.includes(kw))
  );
  if (indoorSpots.length > 0) {
    tips.push(
      `${indoorSpots.map((s) => s.name).join("、")}は屋内施設のためペット不可の可能性があります`
    );
  }

  return tips;
}

// Estimate total time for a set of spots
function estimateTotalMinutes(
  spots: GeocodedSpot[],
  startTime: string
): number {
  let totalMinutes = 0;

  for (let i = 0; i < spots.length; i++) {
    if (i > 0) {
      const prev = spots[i - 1];
      const distanceKm = calcDistance(prev.lat, prev.lng, spots[i].lat, spots[i].lng);
      const useHighway = distanceKm > 30;
      const roadDistance = distanceKm * (useHighway ? 1.1 : 1.3);
      totalMinutes += estimateTravelMinutes(roadDistance, useHighway);
    }

    // Stay time for destinations only
    if (spots[i].type === "destination") {
      totalMinutes += DEFAULT_STAY_MINUTES;
    }
  }

  return totalMinutes;
}

// Trim destinations that exceed the time budget
function trimToTimeBudget(
  spots: GeocodedSpot[],
  startTime: string,
  arrivalTime: string
): { kept: GeocodedSpot[]; removed: RemovedSpot[] } {
  const budgetMinutes = timeToMinutes(arrivalTime) - timeToMinutes(startTime);
  if (budgetMinutes <= 0) {
    return { kept: spots, removed: [] };
  }

  const departure = spots.find((s) => s.type === "departure");
  const arrival = spots.find((s) => s.type === "arrival");
  const destinations = spots.filter((s) => s.type === "destination");

  // Check if all destinations fit
  const allSpots = [
    ...(departure ? [departure] : []),
    ...destinations,
    ...(arrival ? [arrival] : []),
  ];
  const totalTime = estimateTotalMinutes(allSpots, startTime);

  if (totalTime <= budgetMinutes) {
    return { kept: spots, removed: [] };
  }

  // Need to trim - remove destinations from the end (farthest in the route) until within budget
  const removed: RemovedSpot[] = [];
  let currentDests = [...destinations];

  while (currentDests.length > 0) {
    const testSpots = [
      ...(departure ? [departure] : []),
      ...currentDests,
      ...(arrival ? [arrival] : []),
    ];
    const testTime = estimateTotalMinutes(testSpots, startTime);

    if (testTime <= budgetMinutes) {
      break;
    }

    // Remove the last destination (farthest from start after optimization)
    const removedDest = currentDests.pop()!;
    removed.push({
      name: removedDest.name,
      reason: `時間オーバーのため削除（出発〜到着の${Math.floor(budgetMinutes / 60)}時間${budgetMinutes % 60}分に収まりません）`,
    });
  }

  // Reassign order indices
  const kept: GeocodedSpot[] = [];
  if (departure) kept.push({ ...departure, orderIndex: 0 });
  currentDests.forEach((d, i) => {
    kept.push({ ...d, orderIndex: i + 1 });
  });
  if (arrival) kept.push({ ...arrival, orderIndex: currentDests.length + 1 });

  return { kept, removed };
}

export function buildDayItinerary(
  spots: GeocodedSpot[],
  lunchGenre: string,
  dinnerGenre: string,
  dayIndex: number,
  startTime: string = "09:00",
  desiredArrivalTime?: string,
  withDog: boolean = false
): DayItinerary {
  if (spots.length === 0) {
    return { dayIndex, items: [], lunchGenre, dinnerGenre };
  }

  // Time-based trimming if arrival time is specified
  let activeSpots = spots;
  let removedSpots: RemovedSpot[] = [];

  if (desiredArrivalTime) {
    const result = trimToTimeBudget(spots, startTime, desiredArrivalTime);
    activeSpots = result.kept;
    removedSpots = result.removed;
  }

  const items: ItineraryItem[] = [];
  let currentTime = startTime;
  let lunchInserted = false;
  let dinnerInserted = false;
  let drivingSinceLastBreak = 0; // minutes of driving since last break (for dog walks)

  const lunchMealType = parseMealType(lunchGenre);
  const dinnerMealType = parseMealType(dinnerGenre);

  for (let i = 0; i < activeSpots.length; i++) {
    const spot = activeSpots[i];
    let distanceKm = 0;
    let travelMinutes = 0;
    let highway: HighwaySegment | undefined;
    let mealStop: MealStop | undefined;
    let dogWalkStop = false;

    if (i > 0) {
      const prev = activeSpots[i - 1];
      distanceKm =
        Math.round(
          calcDistance(prev.lat, prev.lng, spot.lat, spot.lng) * 10
        ) / 10;

      // Determine if highway is likely (distance > 30km)
      const useHighway = distanceKm > 30;
      const roadDistance = distanceKm * (useHighway ? 1.1 : 1.3);
      travelMinutes = estimateTravelMinutes(roadDistance, useHighway);

      // Find highway ICs for long distances
      if (useHighway) {
        const ics = findICsForRoute(prev.lat, prev.lng, spot.lat, spot.lng);
        if (ics.entryIC && ics.exitIC) {
          highway = {
            entryIC: ics.entryIC.name,
            exitIC: ics.exitIC.name,
            entryHighway: ics.entryIC.highway,
            exitHighway: ics.exitIC.highway,
          };
        }
      }

      // Track driving time for dog walk breaks
      if (withDog) {
        drivingSinceLastBreak += travelMinutes;
        if (drivingSinceLastBreak >= DOG_WALK_INTERVAL_MINUTES) {
          dogWalkStop = true;
          drivingSinceLastBreak = 0;
          // Add 15 min for dog walk break
          travelMinutes += 15;
        }
      }

      currentTime = addMinutes(currentTime, travelMinutes);

      // Check if it's meal time and insert meal stop
      const currentMinutes = timeToMinutes(currentTime);

      // Lunch: 11:30-13:30
      if (
        !lunchInserted &&
        lunchMealType &&
        currentMinutes >= 690 &&
        currentMinutes <= 810
      ) {
        const restStop = findNearestRestStop(
          prev.lat,
          prev.lng,
          spot.lat,
          spot.lng,
          lunchMealType
        );
        if (restStop) {
          mealStop = {
            name: restStop.name,
            type: restStop.type,
            features: restStop.features,
            lat: restStop.lat,
            lng: restStop.lng,
          };
          lunchInserted = true;
        }
      }

      // Dinner: 17:30-19:30
      if (
        !dinnerInserted &&
        dinnerMealType &&
        currentMinutes >= 1050 &&
        currentMinutes <= 1170
      ) {
        const restStop = findNearestRestStop(
          prev.lat,
          prev.lng,
          spot.lat,
          spot.lng,
          dinnerMealType
        );
        if (restStop) {
          mealStop = {
            name: restStop.name,
            type: restStop.type,
            features: restStop.features,
            lat: restStop.lat,
            lng: restStop.lng,
          };
          dinnerInserted = true;
        }
      }
    } else {
      // Reset driving counter at departure
      drivingSinceLastBreak = 0;
    }

    const arrivalTime = currentTime;
    const stayMinutes =
      spot.type === "departure" || spot.type === "arrival"
        ? 0
        : DEFAULT_STAY_MINUTES;
    const departureTime = addMinutes(arrivalTime, stayMinutes);

    // Reset driving counter when stopping at a destination
    if (stayMinutes > 0) {
      drivingSinceLastBreak = 0;
    }

    // Infer parking info for destinations
    const parkingInfo =
      spot.type === "destination" ? inferParking(spot.name) : undefined;

    items.push({
      spot,
      arrivalTime,
      departureTime,
      stayMinutes,
      distanceKm,
      travelMinutes,
      highway,
      mealStop,
      parkingInfo,
      dogWalkStop,
    });

    currentTime = departureTime;
  }

  // Generate commentary
  const highlights = generateHighlights(activeSpots);
  const tips = generateTips(items, activeSpots);
  const dogTips = withDog ? generateDogTips(items, activeSpots) : undefined;

  const commentary: PlanCommentary = {
    removedSpots,
    highlights,
    tips,
    dogTips,
  };

  return { dayIndex, items, lunchGenre, dinnerGenre, commentary };
}
