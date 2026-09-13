import { NextRequest, NextResponse } from "next/server";
import { checkScheduleFromRoute, clockMinutes } from "@/lib/scheduleCheck";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

/** 経路が見つからないのは想定内の結果（海を渡る・道がない等）。地図は直線で代用し、判定はAIの時刻に任せる */
const NO_ROUTE_STATUSES = new Set(["ZERO_RESULTS", "NOT_FOUND", "MAX_ROUTE_LENGTH_EXCEEDED"]);
/** こちらの送った内容が不正 */
const BAD_REQUEST_STATUSES = new Set(["INVALID_REQUEST", "MAX_WAYPOINTS_EXCEEDED"]);
// それ以外（OVER_QUERY_LIMIT・OVER_DAILY_LIMIT・REQUEST_DENIED・UNKNOWN_ERROR 等）は上流の失敗として 502

interface LatLng {
  lat: number;
  lng: number;
}

function isLatLng(value: unknown): value is LatLng {
  const v = value as Partial<LatLng> | null;
  return !!v && Number.isFinite(v.lat) && Number.isFinite(v.lng);
}

/**
 * 到着見込みの判定に使う入力（任意）。形が合わなければ判定だけ行わない（経路は返す）。
 * stayMinutes は出発地・経由地・到着地の順の滞在時間で、長さは地点数と同じ。
 */
interface ScheduleInput {
  startTime: string;
  desiredArrival: string;
  windowCrossesMidnight: boolean;
  stayMinutes: number[];
  /** 同じ日のAIの時刻による超過（分）。実際の所要時間との差を記録するためだけに使う */
  aiOverrunMinutes?: number;
}

function readSchedule(value: unknown, pointCount: number): ScheduleInput | null {
  const v = value as Partial<ScheduleInput> | null;
  if (!v || typeof v !== "object") return null;
  if (clockMinutes(v.startTime) === null || clockMinutes(v.desiredArrival) === null) return null;
  if (!Array.isArray(v.stayMinutes) || v.stayMinutes.length !== pointCount) return null;
  if (!v.stayMinutes.every((m) => Number.isFinite(m))) return null;
  return {
    startTime: v.startTime as string,
    desiredArrival: v.desiredArrival as string,
    windowCrossesMidnight: v.windowCrossesMidnight === true,
    stayMinutes: v.stayMinutes.map((m) => Math.min(Math.max(m, 0), 24 * 60)),
    aiOverrunMinutes: Number.isFinite(v.aiOverrunMinutes) ? v.aiOverrunMinutes : undefined,
  };
}

export async function POST(request: NextRequest) {
  let body: { origin?: unknown; destination?: unknown; waypoints?: unknown; avoidHighways?: unknown; schedule?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { origin, destination } = body;
  const waypoints = Array.isArray(body.waypoints) ? body.waypoints : [];
  if (!isLatLng(origin) || !isLatLng(destination) || !waypoints.every(isLatLng)) {
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

  const avoidHighways = body.avoidHighways === true;
  const schedule = readSchedule(body.schedule, waypoints.length + 2);

  // Build waypoints string
  let waypointsParam = "";
  if (waypoints.length > 0) {
    const wpStr = waypoints.map((wp: LatLng) => `${wp.lat},${wp.lng}`).join("|");
    waypointsParam = `&waypoints=${encodeURIComponent(wpStr)}`;
  }

  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = `${destination.lat},${destination.lng}`;
  // 高速道路を使わない設定のときは、地図の経路と所要時間も一般道で出す
  const avoidParam = avoidHighways ? "&avoid=highways" : "";
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}${waypointsParam}${avoidParam}&mode=driving&language=ja&region=jp&key=${API_KEY}`;

  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (error) {
    console.error("Directions API request failed:", error);
    return NextResponse.json({ error: "Failed to get directions" }, { status: 502 });
  }

  if (data.status !== "OK") {
    console.warn("Directions API status:", data.status, data.error_message ?? "");
    if (NO_ROUTE_STATUSES.has(data.status)) {
      return NextResponse.json({ routeFound: false, status: data.status });
    }
    return NextResponse.json(
      { error: data.status },
      { status: BAD_REQUEST_STATUSES.has(data.status) ? 400 : 502 }
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

  // 到着見込み（実際の所要時間＋滞在時間）。AIではなくここで計算し、結果を記録する
  const scheduleCheck = schedule
    ? checkScheduleFromRoute({
        startTime: schedule.startTime,
        desiredArrival: schedule.desiredArrival,
        windowCrossesMidnight: schedule.windowCrossesMidnight,
        legSeconds: legs.map((leg: { durationSeconds: number }) => leg.durationSeconds),
        stayMinutes: schedule.stayMinutes,
      })
    : null;
  if (scheduleCheck) {
    console.log(JSON.stringify({
      type: "directions_schedule_check",
      at: new Date().toISOString(),
      legs: legs.length,
      avoidHighways,
      startTime: scheduleCheck.startTime,
      desiredArrival: scheduleCheck.desiredArrival,
      estimatedArrival: scheduleCheck.estimatedArrival,
      arrivalDayOffset: scheduleCheck.arrivalDayOffset,
      overrunMinutes: scheduleCheck.overrunMinutes,
      overnight: scheduleCheck.overnight,
      ...(schedule?.aiOverrunMinutes !== undefined
        ? {
            aiOverrunMinutes: schedule.aiOverrunMinutes,
            // 実際の所要時間による到着見込みが、AIの時刻より何分遅いか
            gapMinutes: scheduleCheck.overrunMinutes - schedule.aiOverrunMinutes,
          }
        : {}),
    }));
  }

  return NextResponse.json({
    routeFound: true,
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
    ...(scheduleCheck ? { scheduleCheck } : {}),
  });
}
