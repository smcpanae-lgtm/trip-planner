import { presetSpots } from "./presets";
import { highwayICs } from "./highway";
import { parkingAreas, michiNoEkis } from "./rest-stops";
import type { SearchCandidate } from "@/types/trip";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
}

// Search for place candidates using Google Places API (with Nominatim fallback)
export async function searchPlaces(
  query: string
): Promise<SearchCandidate[]> {
  if (!query || query.length < 2) return [];

  // Check presets first
  const presetMatches = presetSpots
    .filter(
      (s) =>
        s.name.includes(query) || query.includes(s.name)
    )
    .slice(0, 3)
    .map((s) => ({
      name: s.name,
      address: `${s.region}・${s.category}（${s.description}）`,
      lat: s.lat,
      lng: s.lng,
    }));

  if (presetMatches.length >= 3) return presetMatches;

  // Try Google Places API first
  try {
    const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const googleResults: SearchCandidate[] = data.results.map(
          (r: { name: string; address: string; lat: number; lng: number }) => ({
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
          })
        );
        return [...presetMatches, ...googleResults].slice(0, 5);
      }
    }
  } catch (e) {
    console.warn("Google Places API failed, falling back to Nominatim:", e);
  }

  // Fallback to Nominatim
  try {
    let searchQuery = query;
    if (!/[都道府県市区町村]/.test(query) && !/日本/.test(query)) {
      searchQuery = `${query} 日本`;
    }
    const encoded = encodeURIComponent(searchQuery);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=jp&limit=5&accept-language=ja&addressdetails=1`,
      { headers: { "User-Agent": "TripPlannerApp/1.0" } }
    );
    const data: NominatimResult[] = await res.json();
    const nominatimResults: SearchCandidate[] = data.map((r) => ({
      name: extractShortName(r.display_name),
      address: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
    return [...presetMatches, ...nominatimResults].slice(0, 5);
  } catch (e) {
    console.error("Search error:", e);
    return presetMatches;
  }
}

function extractShortName(displayName: string): string {
  const parts = displayName.split(",").map((s) => s.trim());
  return parts[0] || displayName;
}

// Geocode a place name
export async function geocode(
  query: string
): Promise<{ lat: number; lng: number; name: string } | null> {
  // Check preset tourist spots
  const preset = presetSpots.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (preset) {
    return { lat: preset.lat, lng: preset.lng, name: preset.name };
  }

  // Check highway ICs
  const ic = highwayICs.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (ic) {
    return { lat: ic.lat, lng: ic.lng, name: ic.name };
  }

  // Check rest stops
  const pa = parkingAreas.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (pa) {
    return { lat: pa.lat, lng: pa.lng, name: pa.name };
  }

  const eki = michiNoEkis.find(
    (s) => s.name === query || s.name.includes(query) || query.includes(s.name)
  );
  if (eki) {
    return { lat: eki.lat, lng: eki.lng, name: eki.name };
  }

  // Try Google Places API
  try {
    const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const best = data.results[0];
        return { lat: best.lat, lng: best.lng, name: best.name };
      }
    }
  } catch (e) {
    console.warn("Google geocoding failed, trying Nominatim:", e);
  }

  // Fallback to Nominatim
  try {
    let searchQuery = query;
    if (!/[都道府県市区町村]/.test(query) && !/日本/.test(query)) {
      searchQuery = `${query} 日本`;
    }

    const encoded = encodeURIComponent(searchQuery);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=jp&limit=5&accept-language=ja`,
      {
        headers: {
          "User-Agent": "TripPlannerApp/1.0",
        },
      }
    );
    const data: NominatimResult[] = await res.json();
    if (data.length > 0) {
      const best = data[0];
      return {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
        name: query,
      };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}

// Calculate distance between two points (Haversine formula)
export function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate travel time by car
export function estimateTravelMinutes(
  distanceKm: number,
  isHighway: boolean = false
): number {
  const avgSpeed = isHighway ? 80 : 45; // km/h
  return Math.round((distanceKm / avgSpeed) * 60);
}
