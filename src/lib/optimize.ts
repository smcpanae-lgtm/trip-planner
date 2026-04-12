import { GeocodedSpot } from "@/types/trip";
import { calcDistance } from "./geocoding";

/**
 * Nearest-neighbor heuristic to optimize destination order.
 * Keeps departure (first) and arrival (last) fixed,
 * reorders only the intermediate destinations.
 */
export function optimizeRoute(spots: GeocodedSpot[]): GeocodedSpot[] {
  // Separate departure, destinations, and arrival
  const departure = spots.find((s) => s.type === "departure");
  const arrival = spots.find((s) => s.type === "arrival");
  const destinations = spots.filter((s) => s.type === "destination");

  // No optimization needed for 0-2 destinations
  if (destinations.length <= 2) {
    return spots;
  }

  // Nearest neighbor starting from departure
  const startPoint = departure || destinations[0];
  const remaining = [...destinations];
  const ordered: GeocodedSpot[] = [];
  let current = startPoint;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = calcDistance(
        current.lat,
        current.lng,
        remaining[i].lat,
        remaining[i].lng
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    current = remaining[nearestIdx];
    ordered.push(current);
    remaining.splice(nearestIdx, 1);
  }

  // If we have an arrival point, also try to improve last segment:
  // check if swapping the last two gives a shorter total
  if (arrival && ordered.length >= 2) {
    const lastIdx = ordered.length - 1;
    const secondLastIdx = lastIdx - 1;

    const currentLastToArrival =
      calcDistance(ordered[lastIdx].lat, ordered[lastIdx].lng, arrival.lat, arrival.lng) +
      calcDistance(ordered[secondLastIdx].lat, ordered[secondLastIdx].lng, ordered[lastIdx].lat, ordered[lastIdx].lng);

    const swappedLastToArrival =
      calcDistance(ordered[secondLastIdx].lat, ordered[secondLastIdx].lng, arrival.lat, arrival.lng) +
      calcDistance(ordered[lastIdx].lat, ordered[lastIdx].lng, ordered[secondLastIdx].lat, ordered[secondLastIdx].lng);

    if (swappedLastToArrival < currentLastToArrival) {
      [ordered[secondLastIdx], ordered[lastIdx]] = [ordered[lastIdx], ordered[secondLastIdx]];
    }
  }

  // Reassign order indices
  const result: GeocodedSpot[] = [];
  if (departure) result.push({ ...departure, orderIndex: 0 });

  ordered.forEach((spot, i) => {
    result.push({ ...spot, orderIndex: i + 1 });
  });

  if (arrival) {
    result.push({ ...arrival, orderIndex: ordered.length + 1 });
  }

  return result;
}
