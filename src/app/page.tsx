"use client";

import { useState, useCallback } from "react";
import { Map, X, Sparkles } from "lucide-react";
import TripForm from "@/components/TripForm";
import Itinerary from "@/components/Itinerary";
import { geocode } from "@/lib/geocoding";
import { buildDayItinerary } from "@/lib/itinerary";
import { optimizeRoute } from "@/lib/optimize";
import type {
  TripConfig,
  GeocodedSpot,
  DayItinerary,
  PlanCommentary,
  HighwaySegment,
  MealStop,
  PlanVariantData,
} from "@/types/trip";

import TripMap from "@/components/TripMap";
import { decodePolyline } from "@/components/TripMap";

type ViewMode = "form" | "result";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeminiPlan(plan: any): {
  spots: GeocodedSpot[];
  itineraries: DayItinerary[];
} {
  const allSpots: GeocodedSpot[] = [];
  const itineraries: DayItinerary[] = [];

  for (const day of plan.days) {
    const daySpots: GeocodedSpot[] = [];
    const items = [];
    let orderIdx = 0;

    for (const item of day.items) {
      const spotType =
        item.type === "lunch" || item.type === "dinner"
          ? "destination"
          : item.type;
      const spot: GeocodedSpot = {
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        parking: "",
        parkingNote: "",
        type: spotType,
        dayIndex: day.dayIndex,
        orderIndex: orderIdx,
      };
      daySpots.push(spot);
      allSpots.push(spot);

      let highway: HighwaySegment | undefined;
      if (item.useHighway && item.highwayEntry && item.highwayExit) {
        highway = {
          entryIC: item.highwayEntry,
          exitIC: item.highwayExit,
          entryHighway: item.highwayName || "",
          exitHighway: item.highwayName || "",
        };
      }

      let mealStop: MealStop | undefined;
      if (item.mealRecommendation) {
        mealStop = {
          name: item.mealRecommendation,
          type: "道の駅",
          features: "",
          lat: item.lat,
          lng: item.lng,
        };
      }

      items.push({
        spot,
        arrivalTime: item.arrivalTime || "00:00",
        departureTime: item.departureTime || "00:00",
        stayMinutes: item.stayMinutes || 0,
        distanceKm: item.distanceKm || 0,
        travelMinutes: item.travelMinutes || 0,
        highway,
        mealStop,
        parkingInfo: item.parkingInfo || undefined,
        dogWalkStop: item.dogWalkStop || false,
        description: item.description || undefined,
        address: item.address || undefined,
        isMealSpot:
          item.type === "lunch" || item.type === "dinner"
            ? item.type
            : undefined,
      });

      orderIdx++;
    }

    const commentary: PlanCommentary = {
      removedSpots: plan.commentary?.removedSpots || [],
      highlights: plan.commentary?.highlights || [],
      tips: plan.commentary?.tips || [],
      dogTips: plan.commentary?.dogTips || undefined,
      overallDescription: plan.commentary?.overallDescription || undefined,
    };

    const lunchGenre = day.lunchSpot
      ? `${day.lunchSpot.name}（${day.lunchSpot.description}）`
      : "";
    const dinnerGenre = day.dinnerSpot
      ? `${day.dinnerSpot.name}（${day.dinnerSpot.description}）`
      : "";

    itineraries.push({
      dayIndex: day.dayIndex,
      items,
      lunchGenre,
      dinnerGenre,
      commentary,
    });
  }

  return { spots: allSpots, itineraries };
}

// Parse Gemini response into plan variants (supports both old and new format)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeminiResponse(data: any): PlanVariantData[] {
  // New format: { plans: [...] }
  if (data.plans && Array.isArray(data.plans)) {
    return data.plans.map((plan: { planName?: string; planDescription?: string; days?: unknown[]; commentary?: unknown }) => {
      const { spots, itineraries } = parseGeminiPlan(plan);
      return {
        planName: plan.planName || "プラン",
        planDescription: plan.planDescription || "",
        spots,
        itineraries,
      };
    });
  }

  // Old format: { days: [...] } (single plan)
  if (data.days) {
    const { spots, itineraries } = parseGeminiPlan(data);
    return [
      {
        planName: "プランA",
        planDescription: "",
        spots,
        itineraries,
      },
    ];
  }

  return [];
}

// Fetch driving directions from Google Directions API
async function fetchRoutePolylines(
  spots: GeocodedSpot[]
): Promise<{ dayIndex: number; path: { lat: number; lng: number }[] }[]> {
  const dayGroups: globalThis.Map<number, GeocodedSpot[]> =
    new globalThis.Map();
  spots.forEach((s) => {
    const group = dayGroups.get(s.dayIndex) || [];
    group.push(s);
    dayGroups.set(s.dayIndex, group);
  });

  const polylines: {
    dayIndex: number;
    path: { lat: number; lng: number }[];
  }[] = [];

  for (const [dayIndex, daySpots] of dayGroups.entries()) {
    const sorted = daySpots.sort((a, b) => a.orderIndex - b.orderIndex);
    if (sorted.length < 2) continue;

    const origin = sorted[0];
    const destination = sorted[sorted.length - 1];
    const waypoints = sorted
      .slice(1, -1)
      .map((s) => ({ lat: s.lat, lng: s.lng }));

    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.overviewPolyline) {
          const path = decodePolyline(data.overviewPolyline);
          polylines.push({ dayIndex, path });
        }
      }
    } catch (e) {
      console.warn(`Directions API failed for day ${dayIndex}:`, e);
    }
  }

  return polylines;
}

export default function Home() {
  const [planVariants, setPlanVariants] = useState<PlanVariantData[]>([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [highlightedSpot, setHighlightedSpot] = useState<{
    dayIndex: number;
    orderIndex: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [mobileShowMap, setMobileShowMap] = useState(false);

  // Derived state from active plan
  const activeVariant = planVariants[activePlanIndex];
  const allSpots = activeVariant?.spots || [];
  const itineraries = activeVariant?.itineraries || [];
  const routePolylines = activeVariant?.routePolylines;

  const handlePlanSwitch = useCallback(
    (index: number) => {
      setActivePlanIndex(index);
      // Fetch route polylines for this plan if not yet fetched
      const variant = planVariants[index];
      if (variant && !variant.routePolylines) {
        fetchRoutePolylines(variant.spots).then((polylines) => {
          if (polylines.length > 0) {
            setPlanVariants((prev) =>
              prev.map((v, i) =>
                i === index ? { ...v, routePolylines: polylines } : v
              )
            );
          }
        });
      }
    },
    [planVariants]
  );

  const handleSubmit = useCallback(async (config: TripConfig) => {
    setIsLoading(true);
    setLoadingMessage("AIが2つの旅行プランを作成中...");

    try {
      const apiPayload = {
        days: config.days.map((day) => ({
          dayIndex: day.dayIndex,
          departure: day.departure,
          departureTime: day.departureTime || "09:00",
          destinations: day.destinations.map((d) => ({
            name: d.name,
            lat: d.lat,
            lng: d.lng,
            isOmakase: d.isOmakase,
          })),
          arrival: day.arrival,
          arrivalTime: day.arrivalTime || "20:00",
          lunchGenre: day.lunchGenre,
          dinnerGenre: day.dinnerGenre,
        })),
        withDog: config.withDog,
        travelDate: config.travelDate,
      };

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          const variants = parseGeminiResponse(data);
          if (variants.length > 0) {
            setPlanVariants(variants);
            setActivePlanIndex(0);
            setViewMode("result");

            // Fetch routes for first plan in background
            setLoadingMessage("ルートを取得中...");
            fetchRoutePolylines(variants[0].spots).then((polylines) => {
              if (polylines.length > 0) {
                setPlanVariants((prev) =>
                  prev.map((v, i) =>
                    i === 0 ? { ...v, routePolylines: polylines } : v
                  )
                );
              }
            });
            return;
          }
        }
      }

      // Fallback to local algorithm
      console.warn("Gemini API unavailable, falling back to local algorithm");
      setLoadingMessage("ローカルアルゴリズムでプラン作成中...");
      await buildLocalPlan(config);
    } catch (e) {
      console.error("Error building plan:", e);
      try {
        setLoadingMessage("ローカルアルゴリズムでプラン作成中...");
        await buildLocalPlan(config);
      } catch (e2) {
        console.error("Local plan also failed:", e2);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  const buildLocalPlan = useCallback(async (config: TripConfig) => {
    const allGeoSpots: GeocodedSpot[] = [];
    const dayItineraries: DayItinerary[] = [];

    for (const day of config.days) {
      const daySpots: GeocodedSpot[] = [];
      let orderIdx = 1;

      if (day.departure) {
        const geo = await geocode(day.departure);
        if (geo) {
          daySpots.push({
            name: geo.name,
            lat: geo.lat,
            lng: geo.lng,
            parking: "",
            parkingNote: "",
            type: "departure",
            dayIndex: day.dayIndex,
            orderIndex: 0,
          });
        }
        await new Promise((r) => setTimeout(r, 1100));
      }

      for (const dest of day.destinations) {
        if (dest.isOmakase || dest.name === "お任せ") continue;
        if (dest.name && dest.name !== "お任せ") {
          let lat = dest.lat;
          let lng = dest.lng;
          let name = dest.name;

          if (lat && lng) {
            // Already have coordinates
          } else {
            const geo = await geocode(dest.name);
            if (geo) {
              lat = geo.lat;
              lng = geo.lng;
              name = geo.name;
            }
            await new Promise((r) => setTimeout(r, 1100));
          }

          if (lat && lng) {
            daySpots.push({
              name,
              lat,
              lng,
              parking: "",
              parkingNote: "",
              type: "destination",
              dayIndex: day.dayIndex,
              orderIndex: orderIdx,
            });
            orderIdx++;
          }
        }
      }

      if (day.arrival) {
        const geo = await geocode(day.arrival);
        if (geo) {
          daySpots.push({
            name: geo.name,
            lat: geo.lat,
            lng: geo.lng,
            parking: "",
            parkingNote: "",
            type: "arrival",
            dayIndex: day.dayIndex,
            orderIndex: orderIdx,
          });
        }
      }

      const optimizedSpots = optimizeRoute(daySpots);
      allGeoSpots.push(...optimizedSpots);

      const startTime = day.departureTime || "09:00";
      const dayItin = buildDayItinerary(
        optimizedSpots,
        day.lunchGenre,
        day.dinnerGenre,
        day.dayIndex,
        startTime,
        day.arrivalTime || "20:00",
        config.withDog
      );
      dayItineraries.push(dayItin);
    }

    const variant: PlanVariantData = {
      planName: "プラン",
      planDescription: "",
      spots: allGeoSpots,
      itineraries: dayItineraries,
    };

    // Fetch driving routes
    fetchRoutePolylines(allGeoSpots).then((polylines) => {
      if (polylines.length > 0) {
        setPlanVariants([{ ...variant, routePolylines: polylines }]);
      }
    });

    setPlanVariants([variant]);
    setActivePlanIndex(0);
    setViewMode("result");
  }, []);

  const handleSpotHover = useCallback(
    (dayIndex: number, orderIndex: number) => {
      setHighlightedSpot({ dayIndex, orderIndex });
    },
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                車で旅行プラン
              </h1>
              <p className="text-xs text-slate-400">
                AI搭載・ドライブ旅行の工程表＆マップ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "result" && (
              <button
                onClick={() => setViewMode("form")}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all"
              >
                プランを再編集
              </button>
            )}
            <button
              onClick={() => setMobileShowMap(!mobileShowMap)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              {mobileShowMap ? (
                <X className="w-5 h-5" />
              ) : (
                <Map className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold text-lg mb-1">プラン作成中</p>
            <p className="text-sm text-slate-500">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row h-[calc(100vh-60px)]">
        <div
          className={`w-full lg:w-[440px] xl:w-[480px] shrink-0 overflow-y-auto itinerary-scroll p-4 ${
            mobileShowMap ? "hidden lg:block" : ""
          }`}
        >
          {viewMode === "form" ? (
            <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
          ) : (
            <div className="space-y-4">
              {/* Plan selector tabs */}
              {planVariants.length > 1 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 shadow-md border-2 border-red-200">
                  <p className="text-center text-xs font-bold text-red-600 mb-3 tracking-wider">
                    ▼ 2つのプランを比較できます ▼
                  </p>
                  <div className="flex gap-3">
                    {planVariants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => handlePlanSwitch(i)}
                        className={`flex-1 px-3 py-3 rounded-xl text-sm font-black transition-all border-2 ${
                          activePlanIndex === i
                            ? "bg-red-600 text-white shadow-lg border-red-600 scale-[1.02]"
                            : "bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                        }`}
                      >
                        {v.planName}
                      </button>
                    ))}
                  </div>
                  {/* Active plan description */}
                  {activeVariant?.planDescription && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
                      <p className="text-xs text-red-700 leading-relaxed font-medium">
                        <Sparkles className="w-3 h-3 inline mr-1 text-red-500" />
                        {activeVariant.planDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Itinerary
                itineraries={itineraries}
                onSpotHover={handleSpotHover}
              />
            </div>
          )}
        </div>

        <div
          className={`flex-1 p-4 pt-0 lg:pt-4 ${
            !mobileShowMap ? "hidden lg:block" : ""
          }`}
        >
          <div className="h-full min-h-[400px] lg:min-h-0 rounded-xl overflow-hidden shadow-lg border border-slate-200">
            <TripMap
              spots={allSpots}
              highlightedSpot={highlightedSpot}
              routePolylines={routePolylines}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
