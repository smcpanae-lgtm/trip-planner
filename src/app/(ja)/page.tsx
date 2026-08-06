"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Map, X, Sparkles, Printer, Copy, Check, Globe, Share2, ImageDown } from "lucide-react";
import { buildSharePostText, buildXShareUrl, generatePlanShareCard, downloadDataUrl } from "@/lib/shareCard";
import { trackEvent } from "@/lib/analytics";
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
  DayPlan,
  TravelerProfile,
} from "@/types/trip";

import SiteFooter from "@/components/SiteFooter";
import TripMap from "@/components/TripMap";
import { decodePolyline } from "@/components/TripMap";
import {
  TripPlannerLanguageProvider,
  useTripLang,
} from "@/lib/i18n/TripPlannerLanguageContext";

type ViewMode = "form" | "result";
const PLAN_SESSION_STORAGE_KEY = "plan-anonymous-session-id";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

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

    const extractGenre = (spotName: string): string => {
      const match = spotName.match(/[（(]([^）)]+)[）)]/);
      return match ? match[1] : spotName;
    };

    const lunchGenre = day.lunchSpot ? extractGenre(day.lunchSpot.name) : "";
    const dinnerGenre = day.dinnerSpot ? extractGenre(day.dinnerSpot.name) : "";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeminiResponse(data: any): PlanVariantData[] {
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

  if (data.days) {
    console.warn("Gemini returned single plan format instead of plans array");
    const { spots, itineraries } = parseGeminiPlan(data);
    return [{ planName: "プランA", planDescription: "", spots, itineraries }];
  }

  console.error("Failed to parse Gemini response:", JSON.stringify(data).substring(0, 500));
  return [];
}

async function fetchRoutePolylines(
  spots: GeocodedSpot[]
): Promise<{ dayIndex: number; path: { lat: number; lng: number }[] }[]> {
  const dayGroups: globalThis.Map<number, GeocodedSpot[]> = new globalThis.Map();
  spots.forEach((s) => {
    const group = dayGroups.get(s.dayIndex) || [];
    group.push(s);
    dayGroups.set(s.dayIndex, group);
  });

  const polylines: { dayIndex: number; path: { lat: number; lng: number }[] }[] = [];

  for (const [dayIndex, daySpots] of dayGroups.entries()) {
    const sorted = daySpots.sort((a, b) => a.orderIndex - b.orderIndex);
    if (sorted.length < 2) continue;

    const origin = sorted[0];
    const destination = sorted[sorted.length - 1];
    const waypoints = sorted.slice(1, -1).map((s) => ({ lat: s.lat, lng: s.lng }));

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

function buildDemoPlanVariant(): PlanVariantData {
  const spots: GeocodedSpot[] = [
    { name: "東京駅", lat: 35.6812, lng: 139.7671, parking: "", parkingNote: "", type: "departure", dayIndex: 0, orderIndex: 0 },
    { name: "大涌谷", lat: 35.2436, lng: 139.0197, parking: "大涌谷駐車場", parkingNote: "土日は混雑するため午前中がおすすめ", type: "destination", dayIndex: 0, orderIndex: 1 },
    { name: "箱根神社（芦ノ湖）", lat: 35.2018, lng: 139.0257, parking: "箱根神社第1駐車場", parkingNote: "", type: "destination", dayIndex: 0, orderIndex: 2 },
    { name: "箱根園レストラン", lat: 35.2065, lng: 139.0234, parking: "箱根園駐車場", parkingNote: "", type: "destination", dayIndex: 0, orderIndex: 3 },
    { name: "箱根湯本", lat: 35.2323, lng: 139.1069, parking: "", parkingNote: "", type: "arrival", dayIndex: 0, orderIndex: 4 },
  ];

  const items = [
    {
      spot: spots[0],
      arrivalTime: "09:00",
      departureTime: "09:00",
      stayMinutes: 0,
      distanceKm: 0,
      travelMinutes: 0,
    },
    {
      spot: spots[1],
      arrivalTime: "10:40",
      departureTime: "11:40",
      stayMinutes: 60,
      distanceKm: 95,
      travelMinutes: 100,
      highway: { entryIC: "東京IC", exitIC: "御殿場IC", entryHighway: "東名高速", exitHighway: "東名高速" },
      description: "黒たまごで有名な活火山地帯。ロープウェイからの噴煙と富士山の眺めが見どころ。",
      parkingInfo: "大涌谷駐車場（有料）",
    },
    {
      spot: spots[2],
      arrivalTime: "12:20",
      departureTime: "13:20",
      stayMinutes: 60,
      distanceKm: 12,
      travelMinutes: 30,
      description: "芦ノ湖畔に佇む古社。湖上の平和鳥居は箱根屈指の撮影スポット。",
      parkingInfo: "箱根神社第1駐車場",
    },
    {
      spot: spots[3],
      arrivalTime: "13:30",
      departureTime: "14:30",
      stayMinutes: 60,
      distanceKm: 3,
      travelMinutes: 10,
      isMealSpot: "lunch" as const,
      description: "芦ノ湖を望むレストランで、地元食材を使ったランチを提供。",
    },
    {
      spot: spots[4],
      arrivalTime: "15:10",
      departureTime: "15:10",
      stayMinutes: 0,
      distanceKm: 20,
      travelMinutes: 40,
      description: "箱根の玄関口。土産物店や日帰り温泉も充実。",
    },
  ];

  const itineraries: DayItinerary[] = [
    {
      dayIndex: 0,
      items,
      lunchGenre: "ランチ",
      dinnerGenre: "",
      lunchSpotInfo: {
        name: "箱根園レストラン",
        description: "芦ノ湖と富士山を眺めながら食事ができる、ドライブ休憩にぴったりのレストラン。",
        nearSpot: "箱根園",
        alternatives: ["成蔵", "はつ花そば 本店"],
      },
      commentary: {
        removedSpots: [],
        highlights: [
          "大涌谷で名物の黒たまごを堪能",
          "芦ノ湖畔の絶景ドライブ",
          "箱根神社の平和鳥居で記念撮影",
        ],
        tips: [
          "紅葉シーズンは大涌谷ロープウェイが混雑するため午前中の訪問がおすすめ",
          "帰りの東名高速は夕方から渋滞しやすいので15時台の出発が安心",
        ],
        overallDescription: "東京から日帰りで楽しむ、箱根の定番スポットを効率よく巡るプランです。",
      },
    },
  ];

  return {
    planName: "サンプルプラン",
    planDescription: "東京→箱根 日帰りドライブ",
    spots,
    itineraries,
  };
}

type ScenarioKey = "daytrip" | "dog" | "senior" | "rainy";

const SCENARIO_TAGS: { key: ScenarioKey; emoji: string; label: string }[] = [
  { key: "daytrip", emoji: "☀️", label: "日帰り" },
  { key: "dog", emoji: "🐶", label: "犬連れ" },
  { key: "senior", emoji: "👴", label: "シニア旅" },
  { key: "rainy", emoji: "☔", label: "雨の日" },
];

function buildScenarioConfig(scenario: ScenarioKey, base: TripConfig | null): TripConfig {
  const baseDay: DayPlan = base?.days?.[0]
    ? { ...base.days[0] }
    : {
        dayIndex: 0,
        departure: "",
        departureTime: "09:00",
        destinations: [{ id: crypto.randomUUID(), name: "", address: "", isOmakase: false }],
        arrival: "",
        arrivalTime: "20:00",
        includeLunch: false,
        lunchLocation: "",
        lunchGenre: "",
        includeDinner: false,
        dinnerLocation: "",
        dinnerGenre: "",
      };

  const travelerProfile: TravelerProfile = base?.travelerProfile
    ? { ...base.travelerProfile }
    : { partyType: "", ageRange: "", hobbies: "", hasChildren: false, childAges: "" };

  let withDog = base?.withDog ?? false;

  switch (scenario) {
    case "dog":
      withDog = true;
      break;
    case "senior":
      travelerProfile.partyType = "senior";
      travelerProfile.ageRange = "60s";
      break;
    case "rainy": {
      const rainHint = "雨の日でも楽しめる屋内スポット";
      travelerProfile.hobbies = travelerProfile.hobbies.includes(rainHint)
        ? travelerProfile.hobbies
        : travelerProfile.hobbies
        ? `${travelerProfile.hobbies} ${rainHint}`
        : rainHint;
      break;
    }
    case "daytrip":
    default:
      break;
  }

  return {
    nights: 0,
    days: [{ ...baseDay, dayIndex: 0 }],
    withDog,
    aiOmakase: base?.aiOmakase ?? true,
    useHighway: base?.useHighway ?? true,
    travelDate: base?.travelDate,
    travelerProfile,
  };
}

function HomeContent() {
  const { t, lang, setLang, languages } = useTripLang();

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
  const [isDemoPlan, setIsDemoPlan] = useState(false);
  const [mobileShowMap, setMobileShowMap] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [lastConfig, setLastConfig] = useState<TripConfig | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileStatus, setTurnstileStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sessionId, setSessionId] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let anonymousSessionId = localStorage.getItem(PLAN_SESSION_STORAGE_KEY);
    if (!anonymousSessionId) {
      anonymousSessionId = crypto.randomUUID();
      localStorage.setItem(PLAN_SESSION_STORAGE_KEY, anonymousSessionId);
    }
    setSessionId(anonymousSessionId);

    const sp = new URLSearchParams(window.location.search);

    const destinationsStr = sp.get("destinations");
    if (destinationsStr) {
      const names = destinationsStr.split("|").filter(Boolean);
      if (names.length >= 2) {
        const latsArr = (sp.get("lats") ?? "").split("|");
        const lngsArr = (sp.get("lngs") ?? "").split("|");
        const destinations = names.map((name, i) => {
          const latNum = parseFloat(latsArr[i] ?? "");
          const lngNum = parseFloat(lngsArr[i] ?? "");
          return {
            id: crypto.randomUUID(),
            name,
            address: "",
            isOmakase: false,
            ...(!Number.isNaN(latNum) && !Number.isNaN(lngNum)
              ? { lat: latNum, lng: lngNum }
              : {}),
          };
        });
        const config: TripConfig = {
          nights: 0,
          days: [{
            dayIndex: 0,
            departure: "",
            departureTime: "09:00",
            destinations,
            arrival: "",
            arrivalTime: "20:00",
            includeLunch: false,
            lunchLocation: "",
            lunchGenre: "",
            includeDinner: false,
            dinnerLocation: "",
            dinnerGenre: "",
          }],
          withDog: false,
          aiOmakase: true,
          useHighway: true,
        };
        setLastConfig(config);
        return;
      }
    }

    const fromParam = sp.get("from");
    const toParam = sp.get("to");
    if (fromParam && toParam) {
      const config: TripConfig = {
        nights: 0,
        days: [{
          dayIndex: 0,
          departure: fromParam,
          departureTime: "09:00",
          destinations: [{
            id: crypto.randomUUID(),
            name: "お任せ",
            address: "",
            isOmakase: true,
          }],
          arrival: toParam,
          arrivalTime: "20:00",
          includeLunch: false,
          lunchLocation: "",
          lunchGenre: "",
          includeDinner: false,
          dinnerLocation: "",
          dinnerGenre: "",
        }],
        withDog: false,
        aiOmakase: true,
        useHighway: true,
      };
      setLastConfig(config);
      return;
    }

    const destination = sp.get("destination");
    if (!destination) return;

    const latNum = parseFloat(sp.get("lat") ?? "");
    const lngNum = parseFloat(sp.get("lng") ?? "");
    const hasLatLng = !Number.isNaN(latNum) && !Number.isNaN(lngNum);

    const config: TripConfig = {
      nights: 0,
      days: [{
        dayIndex: 0,
        departure: "",
        departureTime: "09:00",
        destinations: [{
          id: crypto.randomUUID(),
          name: destination,
          address: "",
          isOmakase: false,
          ...(hasLatLng ? { lat: latNum, lng: lngNum } : {}),
        }],
        arrival: "",
        arrivalTime: "20:00",
        includeLunch: false,
        lunchLocation: "",
        lunchGenre: "",
        includeDinner: false,
        dinnerLocation: "",
        dinnerGenre: "",
      }],
      withDog: false,
      aiOmakase: true,
      useHighway: true,
    };
    setLastConfig(config);
  }, []);

  useEffect(() => {
    if (turnstileSiteKey) return;
    fetch("/api/turnstile-site-key")
      .then((response) => response.json())
      .then((data: { siteKey?: string }) => {
        if (data.siteKey) setTurnstileSiteKey(data.siteKey);
        else setTurnstileStatus("error");
      })
      .catch(() => setTurnstileStatus("error"));
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (!turnstileSiteKey || turnstileWidgetIdRef.current) return;
    setTurnstileStatus("loading");

    const renderTurnstile = () => {
      if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileStatus("ready");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileStatus("loading");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileStatus("error");
        },
      });
    };

    if (window.turnstile) {
      renderTurnstile();
      return;
    }

    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onerror = () => setTurnstileStatus("error");
      document.head.appendChild(script);
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.turnstile && turnstileContainerRef.current) {
        window.clearInterval(timer);
        renderTurnstile();
      } else if (Date.now() - startedAt > 10000) {
        window.clearInterval(timer);
        setTurnstileStatus("error");
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [turnstileSiteKey, viewMode]);

  const activeVariant = planVariants[activePlanIndex];
  const allSpots = activeVariant?.spots || [];
  const itineraries = activeVariant?.itineraries || [];
  const routePolylines = activeVariant?.routePolylines;
  const planVerificationReady = Boolean(turnstileSiteKey && turnstileToken && sessionId);

  const handlePlanSwitch = useCallback(
    (index: number) => {
      setActivePlanIndex(index);
      const variant = planVariants[index];
      if (variant && !variant.routePolylines) {
        fetchRoutePolylines(variant.spots).then((polylines) => {
          if (polylines.length > 0) {
            setPlanVariants((prev) =>
              prev.map((v, i) => i === index ? { ...v, routePolylines: polylines } : v)
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
    if (!planVerificationReady) {
      setPlanError("AIプラン作成の認証確認が完了していません。しばらく待ってから再度お試しください。");
      return;
    }
    setIsLoading(true);
    setLoadingMessage(t.loading.message);
    trackEvent("plan_start", { nights: config.nights, withDog: config.withDog });

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
        turnstileToken,
        sessionId,
      };

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-plan-session-id": sessionId,
        },
        body: JSON.stringify(apiPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && !data.error) {
        const variants = parseGeminiResponse(data);
        if (variants.length > 0) {
          setPlanVariants(variants);
          setActivePlanIndex(0);
          setViewMode("result");
          trackEvent("plan_created", { nights: config.nights, withDog: config.withDog });

          setLoadingMessage(t.loading.messageRoute);
          fetchRoutePolylines(variants[0].spots).then((polylines) => {
            if (polylines.length > 0) {
              setPlanVariants((prev) =>
                prev.map((v, i) => i === 0 ? { ...v, routePolylines: polylines } : v)
              );
            }
          });
          return;
        }
      }

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
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setTurnstileToken("");
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, [planVerificationReady, sessionId, t, turnstileToken]);

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

  const handleTryDemo = useCallback(() => {
    const demo = buildDemoPlanVariant();
    setPlanError(null);
    setPlanVariants([demo]);
    setActivePlanIndex(0);
    setIsDemoPlan(true);
    setViewMode("result");
    leftPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBackToFormFromDemo = useCallback(() => {
    setIsDemoPlan(false);
    setViewMode("form");
    leftPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleScenarioTag = useCallback((scenario: ScenarioKey) => {
    setIsDemoPlan(false);
    setViewMode("form");
    setLastConfig((prev) => buildScenarioConfig(scenario, prev));
    setTimeout(() => {
      document.getElementById("trip-day-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

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
      const dayLabel = t.itinerary.day.replace("{n}", String(dayItin.dayIndex + 1));
      lines.push(`■ ${dayLabel}`);
      lines.push(`${"─".repeat(30)}`);

      for (const item of dayItin.items) {
        const typeLabel =
          item.spot.type === "departure" ? `🚗 ${t.itinerary.meal.lunch.replace("昼食", "出発") || "出発"}` :
          item.spot.type === "arrival" ? "🏁" :
          item.isMealSpot === "lunch" ? `🍽️ ${t.itinerary.meal.lunch}` :
          item.isMealSpot === "dinner" ? `🍽️ ${t.itinerary.meal.dinner}` :
          "📍";

        const timeStr = item.stayMinutes > 0
          ? `${item.arrivalTime}〜${item.departureTime}（${item.stayMinutes}分）`
          : item.arrivalTime;

        lines.push(`  ${typeLabel}  ${item.spot.name}`);
        lines.push(`    ⏰ ${timeStr}`);

        if (item.address) lines.push(`    📍 ${item.address}`);
        if (item.description) lines.push(`    💡 ${item.description}`);
        if (item.parkingInfo) lines.push(`    🅿️ ${item.parkingInfo}`);
        if (item.highway) {
          lines.push(`    🛣️ ${item.highway.entryIC} → ${item.highway.exitIC}（${item.highway.entryHighway}）`);
        }
        if (item.distanceKm > 0) {
          lines.push(`    🚗 約${item.distanceKm}km・${item.travelMinutes}分${item.highway ? "（高速）" : "（一般道）"}`);
        }
        lines.push("");
      }

      const c = dayItin.commentary;
      if (c) {
        if (c.highlights && c.highlights.length > 0) {
          lines.push(`  ⭐ ${t.itinerary.highlights.title}`);
          c.highlights.forEach((h) => lines.push(`    ・${h}`));
          lines.push("");
        }
        if (c.tips && c.tips.length > 0) {
          lines.push(`  💡 ${t.itinerary.tips.title}`);
          c.tips.forEach((tip) => lines.push(`    ・${tip}`));
          lines.push("");
        }
        if (c.dogTips && c.dogTips.length > 0) {
          lines.push(`  🐕 ${t.itinerary.dogTips.title}`);
          c.dogTips.forEach((tip) => lines.push(`    ・${tip}`));
          lines.push("");
        }
      }
    }

    return lines.join("\n");
  }

  function getExportText(): string {
    const header = `🚗 ${t.header.title}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (planVariants.length <= 1) {
      return header + variantToText(planVariants[0]);
    }
    if (printSelection === "a") return header + variantToText(planVariants[0]);
    if (printSelection === "b") return header + variantToText(planVariants[1]);
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
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${t.header.title}</title><style>
        body { font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif; white-space: pre-wrap; line-height: 1.8; padding: 20px; font-size: 14px; }
        @media print { body { padding: 0; } }
      </style></head><body>${text.replace(/\n/g, "<br>")}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  }

  function getShareRoute(): { from: string; to: string; daysLabel: string; spotNames: string[] } {
    const days = lastConfig?.days || [];
    const from = days[0]?.departure || "";
    const to = days[days.length - 1]?.arrival || "";
    const nights = lastConfig?.nights ?? 0;
    const daysLabel = nights === 0 ? "日帰り" : `${nights}泊${nights + 1}日`;
    const spotNames = (activeVariant?.spots || [])
      .filter((s) => s.type === "destination")
      .map((s) => s.name)
      .filter((name) => name && name !== "お任せ");
    return { from, to, daysLabel, spotNames };
  }

  function handleXShare() {
    const { from, to } = getShareRoute();
    const text = buildSharePostText(from, to);
    window.open(buildXShareUrl(text), "_blank", "noopener,noreferrer");
    trackEvent("share_clicked", { method: "x", from, to });
  }

  function handleShareImageDownload() {
    const { from, to, daysLabel, spotNames } = getShareRoute();
    const dataUrl = generatePlanShareCard({ from, to, daysLabel, spotNames });
    downloadDataUrl(dataUrl, `${from}-${to}-ドライブプラン.png`);
    trackEvent("share_clicked", { method: "image", from, to });
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
                {t.header.title}
              </h1>
              <p className="text-xs text-slate-400">
                {t.header.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language selector */}
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Parameters<typeof setLang>[0])}
                className="text-xs text-slate-600 bg-transparent border-none outline-none cursor-pointer pr-1"
                aria-label="Language"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <a
              href="/heritage/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all whitespace-nowrap"
            >
              {t.header.heritageLink}
            </a>
            <a
              href="/life-map"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all whitespace-nowrap"
            >
              {t.header.lifeMapLink}
            </a>
            {viewMode === "result" && (
              <button
                onClick={() => { setViewMode("form"); setPlanError(null); setIsDemoPlan(false); }}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all"
              >
                {t.header.editPlan}
              </button>
            )}
            <button
              onClick={() => setMobileShowMap(!mobileShowMap)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              {mobileShowMap ? <X className="w-5 h-5" /> : <Map className="w-5 h-5" />}
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
            <p className="font-bold text-lg mb-1">{t.loading.title}</p>
            <p className="text-sm text-slate-500">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Print/Copy modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center" onClick={() => setShowPrintModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{t.printModal.title}</h3>
            <div className="space-y-2 mb-5">
              {[
                { value: "a" as const, label: planVariants[0]?.planName || t.printModal.planA },
                { value: "b" as const, label: planVariants[1]?.planName || t.printModal.planB },
                { value: "both" as const, label: t.printModal.both },
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
                {t.printModal.print}
              </button>
              <button
                onClick={() => { handleCopyText(); setShowPrintModal(false); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all"
              >
                <Copy className="w-4 h-4" />
                {t.printModal.copy}
              </button>
            </div>
            <button
              onClick={() => setShowPrintModal(false)}
              className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t.printModal.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:h-[calc(100vh-60px)] lg:overflow-hidden">
        <div
          ref={leftPanelRef}
          className={`w-full lg:w-[440px] xl:w-[480px] shrink-0 lg:overflow-y-auto itinerary-scroll p-4 ${
            mobileShowMap ? "hidden lg:block" : ""
          }`}
        >
          {viewMode === "form" ? (
            <div>
              {planError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                  <div className="text-red-500 shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-700">{t.error.title}</p>
                    <p className="text-xs text-red-500 mt-1">{planError}</p>
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-blue-900 mb-1">まずは完成イメージを見てみる</p>
                <p className="text-xs text-blue-700 mb-3">入力不要で「東京→箱根 日帰り」のサンプルプランをすぐ表示します</p>
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  サンプルを見る
                </button>
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 mb-2">シーンから選んでかんたん設定</p>
                <div className="flex flex-wrap gap-2">
                  {SCENARIO_TAGS.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={() => handleScenarioTag(tag.key)}
                      className="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-sm font-medium text-slate-700 transition-all"
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
                {turnstileSiteKey ? (
                  <>
                    <div ref={turnstileContainerRef} className="min-h-[65px]" />
                    {!turnstileToken && turnstileStatus === "loading" && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        自動送信対策を読み込んでいます。数秒お待ちください。
                      </p>
                    )}
                    {turnstileStatus === "error" && (
                      <p className="text-xs text-amber-700 leading-relaxed">
                        自動送信対策を読み込めませんでした。ページを再読み込みしてください。改善しない場合は、Cloudflare Turnstileのドメイン設定をご確認ください。
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-amber-700 leading-relaxed">
                    AIプラン作成の不正利用対策が未設定です。Cloudflare Turnstile のサイトキーを設定するとAI生成を使えます。
                  </p>
                )}
              </div>
              <TripForm onSubmit={handleSubmit} isLoading={isLoading} initialConfig={lastConfig} />
            </div>
          ) : (
            <div className="space-y-4">
              {planError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="text-red-500 shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-700">{t.error.title}</p>
                    <p className="text-xs text-red-500 mt-1">{planError}</p>
                  </div>
                </div>
              )}

              {/* Plan selector tabs */}
              {planVariants.length > 1 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 shadow-md border-2 border-red-200">
                  <p className="text-center text-xs font-bold text-red-600 mb-3 tracking-wider">
                    {t.planCompare.hint}
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

              {isDemoPlan ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-900 mb-1">これはサンプルプランです</p>
                  <p className="text-xs text-amber-700 mb-3">出発地や条件を入力すれば、AIがあなただけのオリジナルプランを作成します</p>
                  <button
                    type="button"
                    onClick={handleBackToFormFromDemo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-all"
                  >
                    あなたの条件で作る
                  </button>
                </div>
              ) : (
                <>
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
                      {t.buttons.print}
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
                      {copied ? t.buttons.copied : t.buttons.copy}
                    </button>
                  </div>

                  {/* Share buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleXShare}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-medium transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      Xでシェア
                    </button>
                    <button
                      onClick={handleShareImageDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
                    >
                      <ImageDown className="w-4 h-4" />
                      画像を保存
                    </button>
                  </div>
                </>
              )}

              <Itinerary
                itineraries={itineraries}
                onSpotHover={handleSpotHover}
                withDog={lastConfig?.withDog ?? false}
              />
            </div>
          )}
        </div>

        <div
          className={`lg:flex-1 h-[calc(100vh-60px)] lg:h-auto p-4 pt-0 lg:pt-4 ${
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

      <SiteFooter />
    </div>
  );
}

export default function Home() {
  return (
    <TripPlannerLanguageProvider>
      <HomeContent />
    </TripPlannerLanguageProvider>
  );
}
