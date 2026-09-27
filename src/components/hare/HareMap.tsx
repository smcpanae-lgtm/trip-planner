"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from "@react-google-maps/api";
import type { HareSpot, HareWeather } from "@/lib/hare/types";
import type { HareDict } from "@/lib/hare/i18n";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 36.2, lng: 138.2 };
const defaultZoom = 5;

export const WEATHER_COLORS: Record<HareWeather, string> = {
  sunny: "#f59e0b",
  cloudy: "#94a3b8",
  rain: "#3b82f6",
};

interface HareMapProps {
  origin: { lat: number; lng: number } | null;
  radiusKm: number;
  spots: HareSpot[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  dict: HareDict;
}

function spotIcon(weather: HareWeather, selected: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: selected ? 10 : weather === "sunny" ? 7 : 5,
    fillColor: WEATHER_COLORS[weather],
    fillOpacity: weather === "rain" ? 0.6 : 0.95,
    strokeColor: "#ffffff",
    strokeWeight: selected ? 3 : 1.5,
  };
}

export default function HareMap({
  origin,
  radiusKm,
  spots,
  selectedCode,
  onSelect,
  dict,
}: HareMapProps) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // 出発地と半径が変わったら、探す範囲全体が見えるように合わせる
  useEffect(() => {
    if (!map || !origin) return;
    const circle = new google.maps.Circle({ center: origin, radius: radiusKm * 1000 });
    const bounds = circle.getBounds();
    if (bounds) map.fitBounds(bounds, 8);
  }, [map, origin, radiusKm]);

  const selected = spots.find((s) => s.code === selectedCode) ?? null;

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-sm text-slate-500">
        {dict.mapLoading}
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={defaultZoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {origin && (
        <>
          <Circle
            center={origin}
            radius={radiusKm * 1000}
            options={{
              strokeColor: "#2563eb",
              strokeOpacity: 0.6,
              strokeWeight: 1.5,
              fillColor: "#2563eb",
              fillOpacity: 0.04,
              clickable: false,
            }}
          />
          <Marker
            position={origin}
            title={dict.originMarker}
            zIndex={1000}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        </>
      )}
      {spots.map((s) => (
        <Marker
          key={s.code}
          position={{ lat: s.lat, lng: s.lng }}
          title={`${s.name}（${dict.weatherLabel[s.weather]}）`}
          icon={spotIcon(s.weather, s.code === selectedCode)}
          zIndex={s.code === selectedCode ? 999 : s.weather === "sunny" ? 3 : s.weather === "cloudy" ? 2 : 1}
          onClick={() => onSelect(s.code)}
        />
      ))}
      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => onSelect(null)}
        >
          <div className="text-xs text-slate-700">
            <p className="font-bold">
              {selected.pref}
              {selected.name}
            </p>
            <p>
              {dict.weatherLabel[selected.weather]}・{dict.precipProbability(selected.maxPrecipProbability)}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
