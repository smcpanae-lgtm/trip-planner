"use client";

import {
  Clock,
  Car,
  MapPin,
  Navigation,
  Utensils,
  ParkingCircle,
  ArrowRight,
  CircleDot,
  Coffee,
  AlertTriangle,
  Star,
  Lightbulb,
  Dog,
  PawPrint,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { DayItinerary } from "@/types/trip";

function buildGoogleMapsUrl(name: string, address?: string): string {
  const query = address ? `${name} ${address}` : name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildMealSearchUrl(areaName: string, genre: string, petFriendly?: boolean): string {
  const query = petFriendly ? `${areaName} ${genre} 犬同伴可 テラス席あり` : `${areaName} ${genre}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

interface ItineraryProps {
  itineraries: DayItinerary[];
  onSpotHover: (dayIndex: number, orderIndex: number) => void;
  withDog?: boolean;
}

export default function Itinerary({ itineraries, onSpotHover, withDog }: ItineraryProps) {
  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <MapPin className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">旅行プランを入力してください</p>
        <p className="text-sm mt-1">
          左のフォームから出発地・目的地を入力して作成ボタンを押してください
        </p>
      </div>
    );
  }

  // Commentary is plan-level (same for all days) — show it once at the end
  const planCommentary = itineraries.length > 0
    ? itineraries[itineraries.length - 1].commentary
    : undefined;

  return (
    <div className="space-y-6">
      {itineraries.map((dayItin) => (
        <div key={dayItin.dayIndex}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {dayItin.dayIndex + 1}
            </div>
            <h3 className="font-bold text-lg">
              {dayItin.dayIndex + 1}日目
            </h3>
          </div>

          <div className="relative ml-4">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-slate-200" />

            {dayItin.items.map((item, idx) => {
              const spotType = item.spot.type;
              const circleNum = item.spot.orderIndex;

              return (
                <div key={idx} className="relative">
                  {/* Travel info between spots */}
                  {idx > 0 && item.travelMinutes > 0 && (
                    <div className="ml-10 mb-2 space-y-1 py-1">
                      {/* Highway IC info */}
                      {item.highway && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-md px-2 py-1">
                          <CircleDot className="w-3 h-3" />
                          <span className="font-medium">
                            {item.highway.entryIC}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-medium">
                            {item.highway.exitIC}
                          </span>
                          <span className="text-emerald-400 ml-1">
                            ({item.highway.entryHighway})
                          </span>
                        </div>
                      )}
                      {/* Distance and time */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Car className="w-3.5 h-3.5" />
                        <span>
                          約{item.distanceKm}km・{item.travelMinutes}分
                          {item.highway ? "（高速利用）" : "（一般道）"}
                        </span>
                      </div>
                      {/* Dog walk stop indicator */}
                      {item.dogWalkStop && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-md px-2 py-1">
                          <PawPrint className="w-3 h-3" />
                          <span className="font-medium">
                            犬の散歩休憩（約15分）
                          </span>
                        </div>
                      )}
                      {/* Meal stop suggestion */}
                      {item.mealStop && (
                        <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-md px-2 py-1">
                          <Coffee className="w-3 h-3" />
                          <span className="font-medium">
                            食事おすすめ: {item.mealStop.name}
                          </span>
                          <span className="text-orange-400">
                            ({item.mealStop.type}・{item.mealStop.features})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spot card */}
                  <div
                    className="flex items-start gap-3 mb-3 group cursor-pointer"
                    onMouseEnter={() =>
                      onSpotHover(dayItin.dayIndex, item.spot.orderIndex)
                    }
                  >
                    {/* Marker circle */}
                    <div
                      className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md transition-transform group-hover:scale-110 ${
                        spotType === "departure"
                          ? "bg-green-500"
                          : spotType === "arrival"
                          ? "bg-red-500"
                          : item.isMealSpot
                          ? "bg-orange-500"
                          : "bg-blue-600"
                      }`}
                    >
                      {spotType === "departure" ? (
                        <Navigation className="w-4 h-4" />
                      ) : spotType === "arrival" ? (
                        <Navigation className="w-4 h-4 rotate-180" />
                      ) : item.isMealSpot ? (
                        <Utensils className="w-4 h-4" />
                      ) : (
                        circleNum
                      )}
                    </div>

                    {/* Info card */}
                    <div className={`flex-1 rounded-lg border p-3 shadow-sm group-hover:shadow-md transition-all ${
                      item.isMealSpot
                        ? "bg-orange-50 border-orange-200 group-hover:border-orange-300"
                        : "bg-white border-slate-100 group-hover:border-blue-200"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{item.spot.name}</h4>
                          {item.isMealSpot === "lunch" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">昼食</span>
                          )}
                          {item.isMealSpot === "dinner" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">夕食</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.arrivalTime}
                            {item.stayMinutes > 0 &&
                              ` 〜 ${item.departureTime}`}
                          </span>
                          {item.stayMinutes > 0 && (
                            <span>滞在 {item.stayMinutes}分</span>
                          )}
                        </div>
                      </div>

                      {/* Description: meal spots show static instruction; other spots show AI description */}
                      {item.isMealSpot ? (
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                          {withDog
                            ? "「Google Mapで確認」から周辺のお店をお選びください。犬連れの方は「ペットOKで探す」もご利用ください。"
                            : "「Google Mapで確認」から周辺のお店をお選びください。"}
                        </p>
                      ) : (
                        item.description && (
                          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed bg-purple-50 rounded px-2 py-1.5 border border-purple-100">
                            <Sparkles className="w-3 h-3 inline mr-1 text-purple-400" />
                            {item.description}
                          </p>
                        )
                      )}

                      {/* Address */}
                      {item.address && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-400">
                            {item.address}
                          </span>
                        </div>
                      )}

                      {/* Parking info (auto-inferred) */}
                      {item.parkingInfo && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <ParkingCircle className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs text-slate-500">
                            {item.parkingInfo}
                          </span>
                        </div>
                      )}

                      {/* Google Maps link + business hours warning for meal spots and destinations */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <a
                          href={buildGoogleMapsUrl(item.spot.name, item.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Google Mapで確認
                        </a>
                        {item.isMealSpot && withDog && (
                          <a
                            href={buildMealSearchUrl(item.spot.name, item.isMealSpot === "lunch" ? "ランチ" : "ディナー", true)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 hover:underline transition-colors font-medium"
                          >
                            <PawPrint className="w-3 h-3" />
                            ペットOKで探す
                          </a>
                        )}
                        {item.isMealSpot && (
                          <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            営業時間を事前にご確認ください
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


        </div>
      ))}

      {/* Plan Commentary — shown once after all days */}
      {planCommentary && (
        <div className="space-y-3 pt-2">
          {/* Overall AI description */}
          {planCommentary.overallDescription && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-1.5 text-sm font-medium text-purple-700 mb-2">
                <Sparkles className="w-4 h-4" />
                AIプランナーの解説
              </div>
              <p className="text-xs text-purple-600 leading-relaxed">
                {planCommentary.overallDescription}
              </p>
            </div>
          )}

          {/* Removed spots */}
          {planCommentary.removedSpots.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-700 mb-2">
                <AlertTriangle className="w-4 h-4" />
                時間の都合で除外した目的地
              </div>
              <ul className="space-y-1">
                {planCommentary.removedSpots.map((removed, idx) => (
                  <li key={idx} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>
                      <span className="font-medium">{removed.name}</span>
                      <span className="text-red-400 ml-1">— {removed.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlights */}
          {planCommentary.highlights.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700 mb-2">
                <Star className="w-4 h-4" />
                プランのポイント
              </div>
              <ul className="space-y-1">
                {planCommentary.highlights.map((highlight, idx) => (
                  <li key={idx} className="text-xs text-blue-600 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {planCommentary.tips.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-1.5 text-sm font-medium text-yellow-700 mb-2">
                <Lightbulb className="w-4 h-4" />
                アドバイス
              </div>
              <ul className="space-y-1">
                {planCommentary.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-yellow-600 flex items-start gap-1.5">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dog tips */}
          {planCommentary.dogTips && planCommentary.dogTips.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 mb-2">
                <Dog className="w-4 h-4" />
                犬連れ旅行のアドバイス
              </div>
              <ul className="space-y-1">
                {planCommentary.dogTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-amber-600 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
