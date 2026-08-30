import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

// Places APIの1日あたりの割り当てが逼迫しやすいため、同じクエリを短時間に何度も
// Google へ投げないようウォームインスタンス内でメモリキャッシュする（インスタンス間では共有されない簡易的なもの）。
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const placesCache = new Map<string, { results: unknown[]; expiresAt: number }>();

function getCached(key: string): unknown[] | null {
  const entry = placesCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    placesCache.delete(key);
    return null;
  }
  return entry.results;
}

function setCached(key: string, results: unknown[]) {
  if (placesCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = placesCache.keys().next().value;
    if (oldestKey !== undefined) placesCache.delete(oldestKey);
  }
  placesCache.set(key, { results, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const cacheKey = query.trim().toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  try {
    // Use Google Places Text Search API
    // Don't append "日本" for queries that already contain Japanese characters
    const hasJapanese = /[　-〿぀-ゟ゠-ヿ一-龯]/.test(query);
    const searchQuery = hasJapanese ? query : query + " Japan";
    const encoded = encodeURIComponent(searchQuery);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encoded}&language=ja&region=jp&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || data.status },
        { status: 500 }
      );
    }

    const results = (data.results || []).slice(0, 5).map(
      (place: {
        name: string;
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        types?: string[];
      }) => ({
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        types: place.types || [],
      })
    );

    setCached(cacheKey, results);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Places API fetch error:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
