"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import type { GeocodedSpot } from "@/types/trip";

interface TripMapProps {
  spots: GeocodedSpot[];
  highlightedSpot: { dayIndex: number; orderIndex: number } | null;
  routePolylines?: { dayIndex: number; path: { lat: number; lng: number }[] }[];
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 36.2, lng: 138.2 };
const defaultZoom = 6;

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const DAY_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#8b5cf6"];

function getMarkerIcon(
  label: string,
  type: "departure" | "destination" | "arrival"
): google.maps.Symbol | google.maps.Icon {
  const bgColor =
    type === "departure"
      ? "#16a34a"
      : type === "arrival"
      ? "#dc2626"
      : "#2563eb";

  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 16,
    fillColor: bgColor,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
    labelOrigin: new google.maps.Point(0, 0),
  };
}

// Decode Google Maps encoded polyline
function decodePolyline(
  encoded: string
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export { decodePolyline };

export default function TripMap({
  spots,
  highlightedSpot,
  routePolylines,
}: TripMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<GeocodedSpot | null>(null);

  const mapOptions: google.maps.MapOptions | undefined = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
    };
  }, [isLoaded]);

  const fitToSpots = useCallback((map: google.maps.Map, spotsList: GeocodedSpot[]) => {
    if (spotsList.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    spotsList.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    // Don't zoom in too much
    google.maps.event.addListenerOnce(map, "bounds_changed", () => {
      const zoom = map.getZoom();
      if (zoom && zoom > 15) {
        map.setZoom(15);
      }
    });
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Fit bounds immediately if spots are already available
    if (spots.length > 0) {
      fitToSpots(map, spots);
    }
  }, [spots, fitToSpots]);

  // Fit bounds when spots change
  useEffect(() => {
    if (!mapRef.current || spots.length === 0) return;
    fitToSpots(mapRef.current, spots);
  }, [spots, fitToSpots]);

  // Pan to highlighted spot
  useEffect(() => {
    if (!mapRef.current || !highlightedSpot) return;
    const found = spots.find(
      (s) =>
        s.dayIndex === highlightedSpot.dayIndex &&
        s.orderIndex === highlightedSpot.orderIndex
    );
    if (found) {
      mapRef.current.panTo({ lat: found.lat, lng: found.lng });
      mapRef.current.setZoom(14);
    }
  }, [highlightedSpot, spots]);

  // Group spots by day for fallback polylines
  const dayGroups = new Map<number, GeocodedSpot[]>();
  spots.forEach((s) => {
    const group = dayGroups.get(s.dayIndex) || [];
    group.push(s);
    dayGroups.set(s.dayIndex, group);
  });

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="text-center text-red-500 p-4">
          <p className="font-bold">地図の読み込みに失敗しました</p>
          <p className="text-sm mt-1">Google Maps APIキーを確認してください</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="text-center text-slate-400">
          <div className="w-10 h-10 mx-auto mb-2 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p>地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={spots.length > 0 ? { lat: spots[0].lat, lng: spots[0].lng } : defaultCenter}
      zoom={spots.length > 0 ? 10 : defaultZoom}
      onLoad={onLoad}
      options={mapOptions}
    >
      {/* Markers */}
      {spots.map((spot, idx) => {
        const label =
          spot.type === "departure"
            ? "出"
            : spot.type === "arrival"
            ? "着"
            : String(spot.orderIndex);

        return (
          <Marker
            key={`${spot.dayIndex}-${spot.orderIndex}-${idx}`}
            position={{ lat: spot.lat, lng: spot.lng }}
            icon={getMarkerIcon(label, spot.type)}
            label={{
              text: label,
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "12px",
            }}
            onClick={() => setSelectedSpot(spot)}
          />
        );
      })}

      {/* Info window on click */}
      {selectedSpot && (
        <InfoWindow
          position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
          onCloseClick={() => setSelectedSpot(null)}
        >
          <div className="p-1">
            <h3 className="font-bold text-sm">{selectedSpot.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {selectedSpot.type === "departure"
                ? "出発地"
                : selectedSpot.type === "arrival"
                ? "終着地"
                : "目的地"}
            </p>
          </div>
        </InfoWindow>
      )}

      {/* Route polylines from Directions API */}
      {routePolylines &&
        routePolylines.map((rp, idx) => (
          <Polyline
            key={`route-${rp.dayIndex}-${idx}`}
            path={rp.path}
            options={{
              strokeColor: DAY_COLORS[rp.dayIndex % DAY_COLORS.length],
              strokeWeight: 5,
              strokeOpacity: 0.7,
            }}
          />
        ))}

      {/* Fallback: straight-line polylines if no route data */}
      {!routePolylines &&
        Array.from(dayGroups.entries()).map(([dayIdx, daySpots]) => {
          const path = daySpots
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((s) => ({ lat: s.lat, lng: s.lng }));

          return (
            <Polyline
              key={`fallback-${dayIdx}`}
              path={path}
              options={{
                strokeColor: DAY_COLORS[dayIdx % DAY_COLORS.length],
                strokeWeight: 4,
                strokeOpacity: 0.6,
                icons: [
                  {
                    icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                    offset: "0",
                    repeat: "15px",
                  },
                ],
              }}
            />
          );
        })}
    </GoogleMap>
  );
}
