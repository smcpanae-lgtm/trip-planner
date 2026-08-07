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

// ShioriPrintDocument と同じ方式で、この画面ぶんの文言だけを持つ。
// ShioriClient の uiLabel を import すると循環参照になるため、ここに置く。
// 日本語の文言は ShioriClient 側の同名キーと一字一句同じにすること。
type MapLanguage = "ja" | "en" | "zh-CN" | "fr" | "ko" | "zh-TW" | "de";

const MAP_LABELS: Record<MapLanguage, { noPoints: string; approx: string; placeUnset: string }> = {
  ja: {
    noPoints: "地図に表示できる位置情報がありません。時系列プレビューだけ確認できます。",
    approx: "おおよその位置です",
    placeUnset: "場所未設定",
  },
  en: {
    noPoints: "None of these records have a location to show on the map. You can still use the timeline preview.",
    approx: "Approximate location",
    placeUnset: "Place not set",
  },
  "zh-CN": {
    noPoints: "没有可在地图上显示的位置信息。仅可查看时间顺序预览。",
    approx: "大致位置",
    placeUnset: "未设置地点",
  },
  fr: {
    noPoints: "Aucun de ces enregistrements n'a de position à afficher sur la carte. L'aperçu chronologique reste disponible.",
    approx: "Position approximative",
    placeUnset: "Lieu non renseigné",
  },
  ko: {
    noPoints: "지도에 표시할 위치 정보가 없습니다. 시간순 미리보기만 확인할 수 있습니다.",
    approx: "대략적인 위치입니다",
    placeUnset: "장소 미설정",
  },
  "zh-TW": {
    noPoints: "沒有可在地圖上顯示的位置資訊。僅可查看時間順序預覽。",
    approx: "大致位置",
    placeUnset: "未設定地點",
  },
  de: {
    noPoints: "Für diese Einträge gibt es keine Position, die auf der Karte angezeigt werden kann. Die chronologische Vorschau ist weiterhin verfügbar.",
    approx: "Ungefähre Position",
    placeUnset: "Ort nicht angegeben",
  },
};

export default function ShioriMap({
  entries,
  language = "ja",
}: {
  entries: LifeMapEntry[];
  language?: MapLanguage;
}) {
  const labels = MAP_LABELS[language] ?? MAP_LABELS.en;

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
        {labels.noPoints}
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
        const place = entry.locationName || entry.prefecture || labels.placeUnset;
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
                    {labels.approx}
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

