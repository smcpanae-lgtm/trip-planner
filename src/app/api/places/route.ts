import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

// Places API (New) は用途ごとに別メソッド（別クォータ）になっている。
// 用途を分けることで、片方の日次割り当てが枯渇してももう片方は影響を受けない。
//   - autocomplete/details: 目的地入力欄の候補表示（TripForm）
//   - textsearch: AIが生成した地名を座標に変換する一括ジオコーディング（page.tsx の geocode()）
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: unknown) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const mode = request.nextUrl.searchParams.get("mode") || "textsearch";
  if (mode === "autocomplete") return handleAutocomplete(request);
  if (mode === "details") return handleDetails(request);
  return handleTextSearch(request);
}

interface PlacePrediction {
  placeId: string;
  structuredFormat?: {
    mainText?: { text: string };
    secondaryText?: { text: string };
  };
  text?: { text: string };
}

async function handleAutocomplete(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const sessionToken = request.nextUrl.searchParams.get("sessiontoken") || undefined;
  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const cacheKey = `ac:${query.trim().toLowerCase()}`;
  const cached = getCached<unknown[]>(cacheKey);
  if (cached) return NextResponse.json({ results: cached });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
      },
      body: JSON.stringify({
        input: query,
        languageCode: "ja",
        regionCode: "JP",
        ...(sessionToken ? { sessionToken } : {}),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error("Autocomplete API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "autocomplete failed" },
        { status: 500 }
      );
    }

    const suggestions: { placePrediction?: PlacePrediction }[] = data.suggestions || [];
    const results = suggestions
      .map((s) => s.placePrediction)
      .filter((p): p is PlacePrediction => Boolean(p))
      .slice(0, 5)
      .map((p) => ({
        placeId: p.placeId,
        name: p.structuredFormat?.mainText?.text || p.text?.text || "",
        address: p.structuredFormat?.secondaryText?.text || "",
      }));

    setCached(cacheKey, results);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Autocomplete fetch error:", error);
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 });
  }
}

async function handleDetails(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  const sessionToken = request.nextUrl.searchParams.get("sessiontoken") || undefined;
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const cacheKey = `pd:${placeId}`;
  const cached = getCached<{ name: string; address: string; lat: number; lng: number }>(cacheKey);
  if (cached) return NextResponse.json({ result: cached });

  try {
    const params = new URLSearchParams();
    if (sessionToken) params.set("sessionToken", sessionToken);
    const qs = params.toString();
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${qs ? `?${qs}` : ""}`,
      {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "displayName,formattedAddress,location",
        },
      }
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("Place Details API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "details failed" },
        { status: 500 }
      );
    }

    if (typeof data.location?.latitude !== "number" || typeof data.location?.longitude !== "number") {
      return NextResponse.json({ error: "no location in details response" }, { status: 500 });
    }

    const result = {
      name: data.displayName?.text || "",
      address: data.formattedAddress || "",
      lat: data.location.latitude,
      lng: data.location.longitude,
    };
    setCached(cacheKey, result);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Place Details fetch error:", error);
    return NextResponse.json({ error: "Failed to get place details" }, { status: 500 });
  }
}

async function handleTextSearch(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const cacheKey = `ts:${query.trim().toLowerCase()}`;
  const cached = getCached<unknown[]>(cacheKey);
  if (cached) return NextResponse.json({ results: cached });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.types",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "ja",
        regionCode: "JP",
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error("Text Search API error:", data);
      return NextResponse.json(
        { error: data.error?.message || "text search failed" },
        { status: 500 }
      );
    }

    interface PlaceResult {
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      types?: string[];
    }
    const places: PlaceResult[] = data.places || [];
    const results = places.slice(0, 5).map((place) => ({
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      types: place.types || [],
    }));

    setCached(cacheKey, results);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Text Search fetch error:", error);
    return NextResponse.json({ error: "Failed to search places" }, { status: 500 });
  }
}
