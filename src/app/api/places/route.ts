import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

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

  try {
    // Use Google Places Text Search API
    const encoded = encodeURIComponent(query + " 日本");
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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Places API fetch error:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
