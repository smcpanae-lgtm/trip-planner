"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LifeMapEntry } from "@/types/lifemap";
import { getCategory } from "@/lib/lifemap/categories";
import { resolveEntryLatLng } from "@/lib/lifemap/plannerLink";

function categoryIcon(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    className: "shiori-pin-wrapper",
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:16px;line-height:1;">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
      return;
    }
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
  }, [map, points]);

  return null;
}

export default function ShioriMap({ entries }: { entries: LifeMapEntry[] }) {
  const pins = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, pos: resolveEntryLatLng(entry) }))
        .filter(
          (item): item is { entry: LifeMapEntry; pos: { lat: number; lng: number } } =>
            item.pos !== null
        ),
    [entries]
  );

  const points = useMemo(() => pins.map(({ pos }) => pos), [pins]);

  if (pins.length === 0) {
    return (
      <div className="h-full min-h-[320px] flex items-center justify-center bg-slate-100 text-slate-500 text-sm text-center px-6">
        地図に表示できる位置情報がありません。時系列プレビューだけ確認できます。
      </div>
    );
  }

  const first = points[0];

  return (
    <MapContainer
      center={[first.lat, first.lng]}
      zoom={10}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds points={points} />
      {pins.map(({ entry, pos }) => {
        const cat = getCategory(entry.category);
        const place = entry.locationName || entry.prefecture || "場所未設定";
        const approx = entry.locationPrecision !== "exact";
        return (
          <Marker
            key={entry.id}
            position={[pos.lat, pos.lng]}
            icon={categoryIcon(cat.emoji, cat.color)}
          >
            <Popup>
              <div style={{ width: 190 }}>
                {entry.thumbnailDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.thumbnailDataUrl}
                    alt={place}
                    style={{
                      width: "100%",
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 8,
                      display: "block",
                      marginBottom: 6,
                    }}
                  />
                )}
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {cat.emoji} {place}
                </div>
                <div style={{ fontSize: 12, color: "#7f1d1d" }}>{entry.date}</div>
                {approx && (
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    おおよその位置です
                  </div>
                )}
                {entry.memo && (
                  <div style={{ fontSize: 12, marginTop: 4, color: "#14532d" }}>
                    {entry.memo}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

