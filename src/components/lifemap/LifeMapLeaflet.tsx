"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LifeMapEntry } from "@/types/lifemap";
import { getCategory } from "@/lib/lifemap/categories";
import {
  resolveEntryLatLng,
  buildPlannerLink,
  buildGoogleMapsLink,
  isJapanCoord,
} from "@/lib/lifemap/plannerLink";

interface LifeMapLeafletProps {
  entries: LifeMapEntry[];
  pickMode: boolean;
  newLocation: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  focus: { lat: number; lng: number } | null;
  mapCenter: [number, number];
  mapZoom: number;
  // 翻訳文字列（LanguageProviderの外で動作するためpropsで受け取る）
  labels: {
    approxSuffix: string;
    revisitLink: string;
    googleMapsLink: string;
    newPin: string;
  };
}

// カテゴリごとに色・絵文字を変えた円形ピン
function categoryIcon(emoji: string, color: string, pending = false): L.DivIcon {
  return L.divIcon({
    className: "lifemap-pin-wrapper",
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
      ${pending ? "opacity:.85;outline:2px dashed #fff;" : ""}
    "><span style="transform:rotate(45deg);font-size:16px;line-height:1;">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

const NEW_PIN_ICON = L.divIcon({
  className: "lifemap-pin-wrapper",
  html: `<div style="
    width:34px;height:34px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:#dc2626;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.4);
    display:flex;align-items:center;justify-content:center;
  "><span style="transform:rotate(45deg);font-size:16px;line-height:1;">📷</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

// 地図クリックで場所登録
function ClickHandler({
  pickMode,
  onMapClick,
}: {
  pickMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (pickMode) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// 指定座標へ地図を移動
function FocusController({
  focus,
}: {
  focus: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  if (focus) {
    map.flyTo([focus.lat, focus.lng], 12, { duration: 0.8 });
  }
  return null;
}

export default function LifeMapLeaflet({
  entries,
  pickMode,
  newLocation,
  onMapClick,
  focus,
  mapCenter,
  mapZoom,
  labels,
}: LifeMapLeafletProps) {
  // 地図に表示できる（座標が解決できる）記録だけ抽出
  const pins = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, pos: resolveEntryLatLng(entry) }))
        .filter(
          (p): p is { entry: LifeMapEntry; pos: { lat: number; lng: number } } =>
            p.pos !== null
        ),
    [entries]
  );

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", cursor: pickMode ? "crosshair" : "" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler pickMode={pickMode} onMapClick={onMapClick} />
      <FocusController focus={focus} />

      {pins.map(({ entry, pos }) => {
        const cat = getCategory(entry.category);
        const approx = entry.locationPrecision !== "exact";
        const isJapan = isJapanCoord(pos.lat, pos.lng);
        const linkHref = isJapan
          ? buildPlannerLink(entry)
          : buildGoogleMapsLink(pos.lat, pos.lng);
        const linkLabel = isJapan ? labels.revisitLink : labels.googleMapsLink;
        return (
          <Marker
            key={entry.id}
            position={[pos.lat, pos.lng]}
            icon={categoryIcon(cat.emoji, cat.color)}
          >
            <Popup>
              <div style={{ width: 180 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.thumbnailDataUrl}
                  alt={cat.label}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    display: "block",
                    marginBottom: 6,
                  }}
                />
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {cat.emoji} {cat.label}
                  {approx && (
                    <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                      {labels.approxSuffix}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{entry.date}</div>
                {entry.memo && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>{entry.memo}</div>
                )}
                <a
                  href={linkHref}
                  target={isJapan ? undefined : "_blank"}
                  rel={isJapan ? undefined : "noopener noreferrer"}
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 8,
                    padding: "6px 8px",
                    background: "#334155",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {linkLabel}
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {newLocation && (
        <Marker
          position={[newLocation.lat, newLocation.lng]}
          icon={NEW_PIN_ICON}
        >
          <Popup>{labels.newPin}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
