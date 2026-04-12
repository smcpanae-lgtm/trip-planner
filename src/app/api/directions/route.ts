import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, waypoints } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Origin and destination required" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build waypoints string
    let waypointsParam = "";
    if (waypoints && waypoints.length > 0) {
      const wpStr = waypoints
        .map((wp: { lat: number; lng: number }) => `${wp.lat},${wp.lng}`)
        .join("|");
      waypointsParam = `&waypoints=${encodeURIComponent(wpStr)}`;
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}${waypointsParam}&mode=driving&language=ja&region=jp&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      console.error("Directions API error:", data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || data.status },
        { status: 500 }
      );
    }

    // Extract route info
    const route = data.routes[0];
    const legs = route.legs.map(
      (leg: {
        distance: { value: number; text: string };
        duration: { value: number; text: string };
        start_address: string;
        end_address: string;
        steps: {
          distance: { value: number };
          duration: { value: number };
          html_instructions: string;
          polyline: { points: string };
        }[];
      }) => ({
        distanceMeters: leg.distance.value,
        distanceText: leg.distance.text,
        durationSeconds: leg.duration.value,
        durationText: leg.duration.text,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
      })
    );

    // Get the encoded polyline for map display
    const overviewPolyline = route.overview_polyline?.points || "";

    return NextResponse.json({
      legs,
      overviewPolyline,
      totalDistance: legs.reduce(
        (sum: number, leg: { distanceMeters: number }) =>
          sum + leg.distanceMeters,
        0
      ),
      totalDuration: legs.reduce(
        (sum: number, leg: { durationSeconds: number }) =>
          sum + leg.durationSeconds,
        0
      ),
    });
  } catch (error) {
    console.error("Directions API error:", error);
    return NextResponse.json(
      { error: "Failed to get directions" },
      { status: 500 }
    );
  }
}
