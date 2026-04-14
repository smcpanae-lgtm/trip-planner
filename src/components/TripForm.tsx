"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  MapPin,
  Utensils,
  Calendar,
  Sparkles,
  Navigation,
  Clock,
  AlertCircle,
  Keyboard,
  Search,
  Dog,
  X,
  Home,
  Save,
  Check,
} from "lucide-react";
import { searchPlaces } from "@/lib/geocoding";
import { Users, Baby } from "lucide-react";
import type { TripConfig, DayPlan, Spot, SearchCandidate, TravelerProfile } from "@/types/trip";

interface TripFormProps {
  onSubmit: (config: TripConfig) => void;
  isLoading: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

function createEmptySpot(isOmakase: boolean = false): Spot {
  return {
    id: crypto.randomUUID(),
    name: isOmakase ? "お任せ" : "",
    address: "",
    isOmakase,
  };
}

function createEmptyDay(dayIndex: number): DayPlan {
  return {
    dayIndex,
    departure: "",
    departureTime: "09:00",
    destinations: [createEmptySpot()],
    arrival: "",
    arrivalTime: "20:00",
    lunchGenre: "",
    dinnerGenre: "",
  };
}

// --- Search input component with dropdown ---
function SearchInput({
  value,
  placeholder,
  onSelect,
  onChange,
  className,
}: {
  value: string;
  placeholder: string;
  onSelect: (candidate: SearchCandidate) => void;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState(value);
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [noResults, setNoResults] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCandidates([]);
      setNoResults(false);
      return;
    }
    setIsSearching(true);
    setNoResults(false);
    try {
      const results = await searchPlaces(q);
      setCandidates(results);
      if (results.length > 0) {
        setShowDropdown(true);
      } else {
        setNoResults(true);
        setShowDropdown(true);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    onChange(val);
    // Debounce search
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => handleSearch(val), 800);
  };

  const handleSelect = (c: SearchCandidate) => {
    setQuery(c.name);
    setShowDropdown(false);
    setCandidates([]);
    onSelect(c);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => candidates.length > 0 && setShowDropdown(true)}
          className={className}
        />
        {isSearching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isSearching && query.length >= 2 && (
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {candidates.length > 0 ? (
            candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => handleSelect(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors"
              >
                <div className="text-sm font-medium text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  {c.address}
                </div>
              </button>
            ))
          ) : noResults ? (
            <div className="px-3 py-3 text-center">
              <p className="text-xs text-amber-600 font-medium">
                地図検索で候補が見つかりませんでした
              </p>
              <p className="text-xs text-slate-400 mt-1">
                このまま入力すればAIが場所を特定してプランを作成します
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// --- Home address helper ---
function getHomeAddress(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tripPlanner_homeAddress") || "";
}

function saveHomeAddress(address: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tripPlanner_homeAddress", address);
}

function clearHomeAddress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tripPlanner_homeAddress");
}

// --- Main form ---
export default function TripForm({ onSubmit, isLoading }: TripFormProps) {
  const [nights, setNights] = useState(0);
  const [days, setDays] = useState<DayPlan[]>([createEmptyDay(0)]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [withDog, setWithDog] = useState(false);
  const [travelDate, setTravelDate] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeEditMode, setHomeEditMode] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfile>({
    partyType: "",
    ageRange: "",
    hobbies: "",
    hasChildren: false,
    childAges: "",
  });

  // Load home address from localStorage on mount
  useEffect(() => {
    const saved = getHomeAddress();
    if (saved) {
      setHomeAddress(saved);
    }
  }, []);

  const handleNightsChange = (n: number) => {
    setNights(n);
    const numDays = n + 1;
    const newDays: DayPlan[] = [];
    for (let i = 0; i < numDays; i++) {
      if (days[i]) {
        newDays.push(days[i]);
      } else {
        const newDay = createEmptyDay(i);
        const prevDay = newDays[i - 1];
        if (prevDay && prevDay.arrival) {
          newDay.departure = prevDay.arrival;
        }
        newDays.push(newDay);
      }
    }
    setDays(newDays);
    setErrors({});
  };

  const updateDay = (dayIdx: number, updates: Partial<DayPlan>) => {
    setDays((prev) => {
      const next = prev.map((d, i) =>
        i === dayIdx ? { ...d, ...updates } : d
      );
      if (updates.arrival !== undefined && dayIdx < next.length - 1) {
        next[dayIdx + 1] = {
          ...next[dayIdx + 1],
          departure: updates.arrival,
        };
      }
      return next;
    });
    Object.keys(updates).forEach((key) => {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`day${dayIdx}_${key}`];
        if (key === "arrival" && dayIdx < days.length - 1) {
          delete next[`day${dayIdx + 1}_departure`];
        }
        return next;
      });
    });
  };

  const addDestination = (dayIdx: number, isOmakase: boolean) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, destinations: [...d.destinations, createEmptySpot(isOmakase)] }
          : d
      )
    );
  };

  const removeDestination = (dayIdx: number, spotId: string) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, destinations: d.destinations.filter((s) => s.id !== spotId) }
          : d
      )
    );
  };

  const updateSpot = (dayIdx: number, spotId: string, updates: Partial<Spot>) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              destinations: d.destinations.map((s) =>
                s.id === spotId ? { ...s, ...updates } : s
              ),
            }
          : d
      )
    );
    if (updates.name !== undefined) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`day${dayIdx}_dest0`];
        return next;
      });
    }
  };

  const handleSpotSelect = (
    dayIdx: number,
    spotId: string,
    candidate: SearchCandidate
  ) => {
    updateSpot(dayIdx, spotId, {
      name: candidate.name,
      address: candidate.address,
      lat: candidate.lat,
      lng: candidate.lng,
    });
  };

  const toggleOmakase = (dayIdx: number, spotId: string) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              destinations: d.destinations.map((s) =>
                s.id === spotId
                  ? { ...s, isOmakase: !s.isOmakase, name: !s.isOmakase ? "お任せ" : "", address: "" }
                  : s
              ),
            }
          : d
      )
    );
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    days.forEach((day, dayIdx) => {
      if (!day.departure.trim())
        newErrors[`day${dayIdx}_departure`] = "出発地を入力してください";
      if (!day.arrival.trim())
        newErrors[`day${dayIdx}_arrival`] = "終着地を入力してください";
      const firstDest = day.destinations[0];
      if (firstDest && !firstDest.name.trim() && !firstDest.isOmakase)
        newErrors[`day${dayIdx}_dest0`] = "目的地を1つ以上入力してください";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const hasProfile = travelerProfile.partyType || travelerProfile.ageRange || travelerProfile.hobbies.trim() || travelerProfile.hasChildren;
    onSubmit({
      nights,
      days,
      withDog,
      travelDate: travelDate || undefined,
      travelerProfile: hasProfile ? travelerProfile : undefined,
    });
  };

  const nightOptions = [
    { value: 0, label: "日帰り" },
    { value: 1, label: "1泊2日" },
    { value: 2, label: "2泊3日" },
    { value: 3, label: "3泊4日" },
    { value: 4, label: "4泊5日" },
  ];

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      {/* App Description for SEO and first-time users */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl p-5 shadow-sm border border-blue-100">
        <h2 className="font-bold text-lg text-blue-800 mb-2">
          🚗 車で旅行プラン
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          出発地と目的地を入力するだけで、<span className="font-bold text-blue-700">AIが最適なドライブ旅行プラン</span>を自動作成します。
          渋滞予測・季節イベント・おすすめ食事スポット・駐車場情報まで、すべてAIがプランニング。
          犬連れ旅行、旅行スタイル、年代にも対応しています。
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {["AI自動プラン", "渋滞予測", "2プラン比較", "Google Maps連携", "犬連れ対応", "完全無料"].map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-1 bg-white rounded-full text-blue-600 border border-blue-200 font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Trip Duration */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg">旅行期間</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {nightOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleNightsChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                nights === opt.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Travel Date */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            出発日
            <span className="text-xs text-slate-400 font-normal ml-1">（任意）</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
            />
            {travelDate && (
              <>
                <span className="text-sm text-slate-500">
                  {(() => {
                    const d = new Date(travelDate);
                    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
                    const dayOfWeek = dayNames[d.getDay()];
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <span className={isWeekend ? "font-bold text-red-500" : ""}>
                        （{dayOfWeek}曜日{isWeekend ? " 🚗混雑予想" : ""}）
                      </span>
                    );
                  })()}
                </span>
                <button
                  onClick={() => setTravelDate("")}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            入力するとAIが休日・祝日の渋滞予測やイベント情報を考慮します
          </p>
        </div>
      </div>

      {/* Dog-friendly toggle */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <button
          onClick={() => setWithDog(!withDog)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            withDog
              ? "border-amber-400 bg-amber-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
        >
          <Dog
            className={`w-6 h-6 ${withDog ? "text-amber-600" : "text-slate-400"}`}
          />
          <div className="text-left flex-1">
            <div
              className={`font-medium text-sm ${
                withDog ? "text-amber-800" : "text-slate-600"
              }`}
            >
              犬連れ旅行
            </div>
            <div className="text-xs text-slate-400">
              散歩タイム・犬同伴可の飲食店を考慮
            </div>
          </div>
          <div
            className={`w-10 h-6 rounded-full transition-all relative ${
              withDog ? "bg-amber-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                withDog ? "right-1" : "left-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Traveler Profile */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-lg">旅行者の情報</h2>
          <span className="text-xs text-slate-400 font-normal">（任意・AIの提案に反映）</span>
        </div>

        {/* Party type */}
        <div className="mb-3">
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">旅行スタイル</label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "", label: "未選択" },
              { value: "solo", label: "一人旅" },
              { value: "couple", label: "カップル・夫婦" },
              { value: "family", label: "家族旅行" },
              { value: "friends", label: "友人・グループ" },
              { value: "senior", label: "シニア旅行" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTravelerProfile((p) => ({ ...p, partyType: opt.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  travelerProfile.partyType === opt.value
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age range */}
        <div className="mb-3">
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">年代</label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: "", label: "未選択" },
              { value: "20s", label: "20代" },
              { value: "30s", label: "30代" },
              { value: "40s", label: "40代" },
              { value: "50s", label: "50代" },
              { value: "60s", label: "60代" },
              { value: "70plus", label: "70代以上" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTravelerProfile((p) => ({ ...p, ageRange: opt.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  travelerProfile.ageRange === opt.value
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hobbies */}
        <div className="mb-3">
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">趣味・興味</label>
          <input
            type="text"
            value={travelerProfile.hobbies}
            onChange={(e) => setTravelerProfile((p) => ({ ...p, hobbies: e.target.value }))}
            placeholder="例: 温泉 釣り 写真 グルメ 神社巡り"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">スペース区切りで複数入力可。お任せコースに趣味を反映します</p>
        </div>

        {/* Children */}
        <div>
          <button
            onClick={() => setTravelerProfile((p) => ({ ...p, hasChildren: !p.hasChildren, childAges: !p.hasChildren ? p.childAges : "" }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
              travelerProfile.hasChildren
                ? "border-pink-400 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
            }`}
          >
            <Baby className={`w-4 h-4 ${travelerProfile.hasChildren ? "text-pink-500" : "text-slate-400"}`} />
            <span className="font-medium">子供あり</span>
          </button>
          {travelerProfile.hasChildren && (
            <div className="mt-2 ml-1">
              <input
                type="text"
                value={travelerProfile.childAges}
                onChange={(e) => setTravelerProfile((p) => ({ ...p, childAges: e.target.value }))}
                placeholder="例: 3歳、7歳"
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm w-full"
              />
              <p className="mt-1 text-xs text-slate-400">お子様の年齢に合ったスポットをAIが提案します</p>
            </div>
          )}
        </div>
      </div>

      {/* Home Address Registration */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-sm">自宅住所の登録</h2>
          </div>
          {homeAddress && !homeEditMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHomeEditMode(true)}
                className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                変更
              </button>
              <button
                onClick={() => {
                  clearHomeAddress();
                  setHomeAddress("");
                }}
                className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              >
                削除
              </button>
            </div>
          )}
        </div>
        {homeAddress && !homeEditMode ? (
          <div className="mt-2">
            <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm text-green-700 truncate">{homeAddress}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              🔒 住所はお使いのブラウザ内にのみ保存されています。外部への送信は一切ありません。
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="例: 東京都渋谷区神宮前1-1-1"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
              <button
                onClick={() => {
                  if (homeAddress.trim()) {
                    saveHomeAddress(homeAddress.trim());
                    setHomeEditMode(false);
                    setHomeSaved(true);
                    setTimeout(() => setHomeSaved(false), 2000);
                  }
                }}
                disabled={!homeAddress.trim()}
                className="shrink-0 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                登録
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              登録すると出発地・終着地にワンタップで入力できます
            </p>
            <p className="mt-1 text-xs text-slate-400">
              🔒 住所はお使いのブラウザ内（localStorage）にのみ保存されます。サーバーへの送信や第三者への共有は一切行いません。
            </p>
          </div>
        )}
        {homeSaved && (
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            自宅住所を保存しました
          </p>
        )}
      </div>

      {/* Day Plans */}
      {days.map((day, dayIdx) => (
        <div
          key={dayIdx}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {dayIdx + 1}
            </div>
            <h2 className="font-bold text-lg">
              {dayIdx + 1}日目
              {dayIdx === 0 && nights === 0 ? "（日帰り）" : ""}
            </h2>
          </div>

          {/* Departure */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
              <Navigation className="w-4 h-4 text-green-600" />
              出発地
              <span className="text-red-500 text-xs">*必須</span>
            </label>
            <div className="flex gap-2">
              {homeAddress && !day.departure && dayIdx === 0 && (
                <button
                  onClick={() => updateDay(dayIdx, { departure: homeAddress })}
                  className="shrink-0 px-2.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                  title="自宅住所を入力"
                >
                  <Home className="w-3.5 h-3.5" />
                  自宅
                </button>
              )}
              <SearchInput
                value={day.departure}
                placeholder={
                  dayIdx > 0
                    ? "前日の終着地から自動入力（変更可）"
                    : "例: 東京駅、自宅の住所..."
                }
                onChange={(val) => updateDay(dayIdx, { departure: val })}
                onSelect={(c) =>
                  updateDay(dayIdx, { departure: c.name })
                }
                className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-sm ${
                  errors[`day${dayIdx}_departure`]
                    ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <div className="relative shrink-0">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="time"
                  value={day.departureTime}
                  onChange={(e) =>
                    updateDay(dayIdx, { departureTime: e.target.value })
                  }
                  className="pl-8 pr-2 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm w-[120px]"
                />
              </div>
            </div>
            {dayIdx > 0 && day.departure && (
              <p className="mt-1 text-xs text-slate-400">
                前日の終着地から転記済み（変更可能）
              </p>
            )}
            {errors[`day${dayIdx}_departure`] && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[`day${dayIdx}_departure`]}
              </p>
            )}
          </div>

          {/* Destinations */}
          <div className="mb-4 space-y-3">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600" />
              目的地
              <span className="text-red-500 text-xs">*1つ以上必須</span>
            </label>
            {day.destinations.map((spot, spotIdx) => (
              <div
                key={spot.id}
                className={`p-3 rounded-lg border space-y-1 ${
                  spot.isOmakase
                    ? "bg-amber-50 border-amber-200"
                    : "bg-slate-50 border-slate-100"
                } ${
                  spotIdx === 0 && errors[`day${dayIdx}_dest0`]
                    ? "border-red-300 bg-red-50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      spot.isOmakase
                        ? "text-amber-700 bg-amber-100"
                        : "text-blue-600 bg-blue-50"
                    }`}
                  >
                    {spot.isOmakase ? "✨" : `#${spotIdx + 1}`}
                  </span>
                  {spot.isOmakase ? (
                    <div className="flex-1 px-3 py-2 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium">
                      おすすめスポットをお任せ
                    </div>
                  ) : (
                    <SearchInput
                      value={spot.name}
                      placeholder="場所名を入力して検索"
                      onChange={(val) =>
                        updateSpot(dayIdx, spot.id, { name: val })
                      }
                      onSelect={(c) => handleSpotSelect(dayIdx, spot.id, c)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    />
                  )}
                  <button
                    onClick={() => toggleOmakase(dayIdx, spot.id)}
                    title={spot.isOmakase ? "手動入力に切替" : "お任せにする"}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      spot.isOmakase
                        ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                        : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                    }`}
                  >
                    {spot.isOmakase ? (
                      <Keyboard className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
                  {day.destinations.length > 1 && (
                    <button
                      onClick={() => removeDestination(dayIdx, spot.id)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {spot.address && !spot.isOmakase && (
                  <p className="text-xs text-slate-400 ml-10 truncate">
                    {spot.address}
                  </p>
                )}
              </div>
            ))}
            {!!errors[`day${dayIdx}_dest0`] && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[`day${dayIdx}_dest0`]}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => addDestination(dayIdx, false)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                目的地を追加
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => addDestination(dayIdx, true)}
                className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-medium px-3 py-2 rounded-lg hover:bg-amber-50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                お任せを追加
              </button>
            </div>
          </div>

          {/* Arrival */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
              <Navigation className="w-4 h-4 text-red-500" />
              終着地
              <span className="text-red-500 text-xs">*必須</span>
            </label>
            <div className="flex gap-2">
              {homeAddress && !day.arrival && (
                <button
                  onClick={() => updateDay(dayIdx, { arrival: homeAddress })}
                  className="shrink-0 px-2.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                  title="自宅住所を入力"
                >
                  <Home className="w-3.5 h-3.5" />
                  自宅
                </button>
              )}
              <SearchInput
                value={day.arrival}
                placeholder="例: 自宅、ホテル名..."
                onChange={(val) => updateDay(dayIdx, { arrival: val })}
                onSelect={(c) =>
                  updateDay(dayIdx, { arrival: c.name })
                }
                className={`w-full px-3 py-2.5 rounded-lg border outline-none transition-all text-sm ${
                  errors[`day${dayIdx}_arrival`]
                    ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <div className="relative shrink-0">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="time"
                  value={day.arrivalTime}
                  onChange={(e) =>
                    updateDay(dayIdx, { arrivalTime: e.target.value })
                  }
                  className="pl-8 pr-2 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm w-[120px]"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              終着地の希望到着時刻（未入力の場合は20:00）
            </p>
            {errors[`day${dayIdx}_arrival`] && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[`day${dayIdx}_arrival`]}
              </p>
            )}
          </div>

          {/* Meals */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                <Utensils className="w-3.5 h-3.5 text-orange-500" />
                昼食ジャンル
              </label>
              <input
                type="text"
                placeholder="例: 海鮮、PA、道の駅..."
                value={day.lunchGenre}
                onChange={(e) =>
                  updateDay(dayIdx, { lunchGenre: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                <Utensils className="w-3.5 h-3.5 text-purple-500" />
                夕食ジャンル
              </label>
              <input
                type="text"
                placeholder="例: 焼肉、PA、道の駅..."
                value={day.dinnerGenre}
                onChange={(e) =>
                  updateDay(dayIdx, { dinnerGenre: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Error summary */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">入力内容に不足があります</p>
            <p className="text-xs text-red-500 mt-1">
              必須項目（出発地・目的地・終着地）をすべて入力してください。
            </p>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all text-lg flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            プランを作成中...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            旅行プランを作成
          </>
        )}
      </button>

      {/* Disclaimer & Terms */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-1">⚠️ 免責事項</h3>
          <ul className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
            <li>・本サービスが生成する旅行プランはAIによる自動生成であり、実際の所要時間・距離・道路状況・営業時間・料金等と異なる場合があります。</li>
            <li>・提案されたスポットや飲食店の営業状況、ペット同伴の可否等は、必ず事前にご自身でご確認ください。</li>
            <li>・本サービスの利用により生じたいかなる損害についても、運営者は一切の責任を負いません。</li>
            <li>・交通ルール・法規を遵守し、安全運転でお出かけください。</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-1">📋 ご利用上の注意</h3>
          <ul className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
            <li>・本サイトのソースコード・デザイン・コンテンツの無断複製・転用・再配布を禁止します。</li>
            <li>・入力された情報（自宅住所を含む）はサーバーに保存されません。自宅住所はブラウザ内（localStorage）にのみ保存されます。</li>
          </ul>
        </div>
        <p className="text-[10px] text-slate-300 text-center">
          © {new Date().getFullYear()} 車で旅行プラン All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
