"use client";

import { useState, useCallback, useRef } from "react";
import { Map, X, Sparkles, Printer, Copy, Check } from "lucide-react";
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

    // Extract genre from lunchSpot name like "○○エリアで昼食（蕎麦）" → "蕎麦"
    const extractGenre = (spotName: string): string => {
      const match = spotName.match(/[（(]([^）)]+)[）)]/);
      return match ? match[1] : spotName;
    };

    const lunchGenre = day.lunchSpot
      ? extractGenre(day.lunchSpot.name)
      : "";
    const dinnerGenre = day.dinnerSpot
      ? extractGenre(day.dinnerSpot.name)
      : "";

    itineraries.push({
      dayIndex: day.dayIndex,
      items,
      lunchGenre,
      dinnerGenre,
      lunchSpotInfo: day.lunchSpot ? {
        name: day.lunchSpot.name,
        description: day.lunchSpot.description,
        nearSpot: day.lunchSpot.nearSpot || "",
        alternatives: day.lunchSpot.alternatives || [],
      } : undefined,
      dinnerSpotInfo: day.dinnerSpot ? {
        name: day.dinnerSpot.name,
        description: day.dinnerSpot.description,
        nearSpot: day.dinnerSpot.nearSpot || "",
        alternatives: day.dinnerSpot.alternatives || [],
      } : undefined,
      commentary,
    });
  }

  return { spots: allSpots, itineraries };
}

// Parse Gemini response into plan variants (supports both old and new format)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeminiResponse(data: any): PlanVariantData[] {
  // New format: { plans: [...] }
  if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
    console.log(`Parsed ${data.plans.length} plan variants from Gemini response`);
    return data.plans.map((plan: { planName?: string; planDescription?: string; days?: unknown[]; commentary?: unknown }, idx: number) => {
      const { spots, itineraries } = parseGeminiPlan(plan);
      return {
        planName: plan.planName || (idx === 0 ? "プランA" : "プランB"),
        planDescription: plan.planDescription || "",
        spots,
        itineraries,
      };
    });
  }

  // Fallback: look for plans array nested inside other keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findPlans = (obj: any): any[] | null => {
    if (!obj || typeof obj !== "object") return null;
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0]?.days) {
        return obj[key];
      }
    }
    return null;
  };

  const nestedPlans = findPlans(data);
  if (nestedPlans && nestedPlans.length > 0) {
    console.log(`Found ${nestedPlans.length} plans in nested structure`);
    return nestedPlans.map((plan: { planName?: string; planDescription?: string }, idx: number) => {
      const { spots, itineraries } = parseGeminiPlan(plan);
      return {
        planName: plan.planName || (idx === 0 ? "プランA" : "プランB"),
        planDescription: plan.planDescription || "",
        spots,
        itineraries,
      };
    });
  }

  // Old format: { days: [...] } (single plan)
  if (data.days) {
    console.warn("Gemini returned single plan format instead of plans array");
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

  console.error("Failed to parse Gemini response:", JSON.stringify(data).substring(0, 500));
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
  const [planError, setPlanError] = useState<string | null>(null);
  const [highlightedSpot, setHighlightedSpot] = useState<{
    dayIndex: number;
    orderIndex: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [mobileShowMap, setMobileShowMap] = useState(false);
  const [lastConfig, setLastConfig] = useState<TripConfig | null>(null);

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
    setPlanError(null);
    setLastConfig(config);
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
          includeLunch: day.includeLunch,
          lunchLocation: day.lunchLocation,
          lunchGenre: day.lunchGenre,
          includeDinner: day.includeDinner,
          dinnerLocation: day.dinnerLocation,
          dinnerGenre: day.dinnerGenre,
          firstDestId: day.firstDestId,
        })),
        withDog: config.withDog,
        aiOmakase: config.aiOmakase,
        useHighway: config.useHighway ?? true,
        travelDate: config.travelDate,
        travelerProfile: config.travelerProfile,
      };

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && !data.error) {
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

      // Show actual error message from API (not hardcoded)
      const apiError: string = data.error || `HTTPエラー ${res.status}`;
      console.warn("Gemini API error:", apiError);
      setPlanError(apiError);
      setIsLoading(false);
      setLoadingMessage("");
      return;
    } catch (e) {
      console.error("Error building plan:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setPlanError(`通信エラー: ${msg}`);
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
        day.includeLunch ? day.lunchGenre || "ランチ" : "",
        day.includeDinner ? day.dinnerGenre || "ディナー" : "",
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

  // --- Print / Copy functionality ---
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSelection, setPrintSelection] = useState<"a" | "b" | "both">("both");
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  function variantToText(variant: PlanVariantData): string {
    const lines: string[] = [];
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📋 ${variant.planName}`);
    if (variant.planDescription) {
      lines.push(`   ${variant.planDescription}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push("");

    for (const dayItin of variant.itineraries) {
      lines.push(`■ ${dayItin.dayIndex + 1}日目`);
      lines.push(`${"─".repeat(30)}`);

      for (const item of dayItin.items) {
        const typeLabel =
          item.spot.type === "departure" ? "🚗 出発" :
          item.spot.type === "arrival" ? "🏁 到着" :
          item.isMealSpot === "lunch" ? "🍽️ 昼食" :
          item.isMealSpot === "dinner" ? "🍽️ 夕食" :
          "📍 観光";

        const timeStr = item.stayMinutes > 0
          ? `${item.arrivalTime}〜${item.departureTime}（${item.stayMinutes}分）`
          : item.arrivalTime;

        lines.push(`  ${typeLabel}  ${item.spot.name}`);
        lines.push(`    ⏰ ${timeStr}`);

        if (item.address) {
          lines.push(`    📍 ${item.address}`);
        }

        if (item.description) {
          lines.push(`    💡 ${item.description}`);
        }

        if (item.parkingInfo) {
          lines.push(`    🅿️ ${item.parkingInfo}`);
        }

        if (item.highway) {
          lines.push(`    🛣️ ${item.highway.entryIC} → ${item.highway.exitIC}（${item.highway.entryHighway}）`);
        }

        if (item.distanceKm > 0) {
          lines.push(`    🚗 約${item.distanceKm}km・${item.travelMinutes}分${item.highway ? "（高速）" : "（一般道）"}`);
        }

        lines.push("");
      }

      // Commentary
      const c = dayItin.commentary;
      if (c) {
        if (c.highlights && c.highlights.length > 0) {
          lines.push(`  ⭐ ポイント`);
          c.highlights.forEach((h) => lines.push(`    ・${h}`));
          lines.push("");
        }
        if (c.tips && c.tips.length > 0) {
          lines.push(`  💡 アドバイス`);
          c.tips.forEach((t) => lines.push(`    ・${t}`));
          lines.push("");
        }
        if (c.dogTips && c.dogTips.length > 0) {
          lines.push(`  🐕 犬連れアドバイス`);
          c.dogTips.forEach((t) => lines.push(`    ・${t}`));
          lines.push("");
        }
      }
    }

    return lines.join("\n");
  }

  function getExportText(): string {
    const header = "🚗 車で旅行プラン\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    if (planVariants.length <= 1) {
      return header + variantToText(planVariants[0]);
    }
    if (printSelection === "a") {
      return header + variantToText(planVariants[0]);
    }
    if (printSelection === "b") {
      return header + variantToText(planVariants[1]);
    }
    return header + variantToText(planVariants[0]) + "\n\n" + variantToText(planVariants[1]);
  }

  function handleCopyText() {
    const text = getExportText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePrint() {
    const text = getExportText();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>車で旅行プラン</title><style>
        body { font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif; white-space: pre-wrap; line-height: 1.8; padding: 20px; font-size: 14px; }
        @media print { body { padding: 0; } }
      </style></head><body>${text.replace(/\n/g, "<br>")}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  }

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
                onClick={() => { setViewMode("form"); setPlanError(null); }}
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

      {/* Print/Copy modal for plan selection */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center" onClick={() => setShowPrintModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">出力するプランを選択</h3>
            <div className="space-y-2 mb-5">
              {[
                { value: "a" as const, label: planVariants[0]?.planName || "プランA" },
                { value: "b" as const, label: planVariants[1]?.planName || "プランB" },
                { value: "both" as const, label: "両方のプラン" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrintSelection(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    printSelection === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { handlePrint(); setShowPrintModal(false); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
              >
                <Printer className="w-4 h-4" />
                印刷
              </button>
              <button
                onClick={() => { handleCopyText(); setShowPrintModal(false); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all"
              >
                <Copy className="w-4 h-4" />
                コピー
              </button>
            </div>
            <button
              onClick={() => setShowPrintModal(false)}
              className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              キャンセル
            </button>
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
            <div>
              {planError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                  <div className="text-red-500 shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-700">エラーが発生しました</p>
                    <p className="text-xs text-red-500 mt-1">{planError}</p>
                  </div>
                </div>
              )}
              <TripForm onSubmit={handleSubmit} isLoading={isLoading} initialConfig={lastConfig} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error message */}
              {planError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="text-red-500 shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-700">エラーが発生しました</p>
                    <p className="text-xs text-red-500 mt-1">{planError}</p>
                  </div>
                </div>
              )}
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

              {/* Print / Copy buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (planVariants.length > 1) {
                      setShowPrintModal(true);
                    } else {
                      handlePrint();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
                >
                  <Printer className="w-4 h-4" />
                  印刷する
                </button>
                <button
                  onClick={() => {
                    if (planVariants.length > 1) {
                      setShowPrintModal(true);
                    } else {
                      handleCopyText();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "コピー済み！" : "テキストをコピー"}
                </button>
              </div>

              <Itinerary
                itineraries={itineraries}
                onSpotHover={handleSpotHover}
                withDog={lastConfig?.withDog ?? false}
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
