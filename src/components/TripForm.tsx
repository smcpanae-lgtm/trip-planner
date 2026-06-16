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
  Search,
  Dog,
  X,
  Home,
  Save,
  Check,
  Route,
} from "lucide-react";
import { searchPlaces } from "@/lib/geocoding";
import { Users, Baby } from "lucide-react";
import type { TripConfig, DayPlan, Spot, SearchCandidate, TravelerProfile } from "@/types/trip";
import { useTripLang } from "@/lib/i18n/TripPlannerLanguageContext";

interface TripFormProps {
  onSubmit: (config: TripConfig) => void;
  isLoading: boolean;
  initialConfig?: TripConfig | null;
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
    includeLunch: false,
    lunchLocation: "",
    lunchGenre: "",
    includeDinner: false,
    dinnerLocation: "",
    dinnerGenre: "",
  };
}

// --- Time selector (select-based, mobile-friendly) ---
function TimeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const parts = value.split(":");
  const hour = parseInt(parts[0] || "0", 10);
  const rawMinute = parseInt(parts[1] || "0", 10);
  // Snap to nearest 15-min
  const minute = Math.round(rawMinute / 15) * 15 % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <select
        value={pad(hour)}
        onChange={(e) => onChange(`${e.target.value}:${pad(minute)}`)}
        className="py-2 pl-1 pr-0.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={pad(i)}>{pad(i)}</option>
        ))}
      </select>
      <span className="text-slate-400 font-bold text-sm">:</span>
      <select
        value={pad(minute)}
        onChange={(e) => onChange(`${pad(hour)}:${e.target.value}`)}
        className="py-2 pl-1 pr-0.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
      >
        {["00", "15", "30", "45"].map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
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

  const { t } = useTripLang();
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
                {t.form.search.noResults}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t.form.search.noResultsHint}
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
export default function TripForm({ onSubmit, isLoading, initialConfig }: TripFormProps) {
  const { t } = useTripLang();
  const [nights, setNights] = useState(initialConfig?.nights ?? 0);
  const [days, setDays] = useState<DayPlan[]>(initialConfig?.days ?? [createEmptyDay(0)]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [withDog, setWithDog] = useState(initialConfig?.withDog ?? false);
  const [aiOmakase, setAiOmakase] = useState(initialConfig?.aiOmakase ?? true);
  const [useHighway, setUseHighway] = useState(initialConfig?.useHighway ?? true);
  const [travelDate, setTravelDate] = useState(initialConfig?.travelDate ?? "");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeEditMode, setHomeEditMode] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfile>(
    initialConfig?.travelerProfile ?? {
      partyType: "",
      ageRange: "",
      hobbies: "",
      hasChildren: false,
      childAges: "",
    }
  );

  // Restore form data when initialConfig changes (returning from result view)
  useEffect(() => {
    if (initialConfig) {
      setNights(initialConfig.nights);
      setDays(initialConfig.days);
      setWithDog(initialConfig.withDog);
      setAiOmakase(initialConfig.aiOmakase ?? true);
      setUseHighway(initialConfig.useHighway ?? true);
      setTravelDate(initialConfig.travelDate ?? "");
      if (initialConfig.travelerProfile) {
        setTravelerProfile(initialConfig.travelerProfile);
      }
    }
  }, [initialConfig]);

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

  // Returns true if the string looks like multiple entries
  // (comma/読点-separated, or space-separated multiple tokens)
  const hasMultipleValues = (str: string): boolean => {
    if (!str.trim()) return false;
    // Check comma / 読点
    if (/[,、，]/.test(str)) return true;
    // Check space-separated (half-width or full-width space)
    const parts = str.trim().split(/[\s　]+/).filter(Boolean);
    return parts.length >= 2;
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    days.forEach((day, dayIdx) => {
      if (!day.departure.trim())
        newErrors[`day${dayIdx}_departure`] = t.form.errors.departure;
      if (!day.arrival.trim())
        newErrors[`day${dayIdx}_arrival`] = t.form.errors.arrival;
      const firstDest = day.destinations[0];
      if (firstDest && !firstDest.name.trim() && !firstDest.isOmakase)
        newErrors[`day${dayIdx}_dest0`] = t.form.errors.dest0;
      // Meal field validation: only 1 value allowed
      if (day.includeLunch) {
        if (hasMultipleValues(day.lunchLocation))
          newErrors[`day${dayIdx}_lunchLocation`] = t.form.errors.mealMultiple;
        if (hasMultipleValues(day.lunchGenre))
          newErrors[`day${dayIdx}_lunchGenre`] = t.form.errors.genreMultiple;
      }
      if (day.includeDinner) {
        if (hasMultipleValues(day.dinnerLocation))
          newErrors[`day${dayIdx}_dinnerLocation`] = t.form.errors.mealMultiple;
        if (hasMultipleValues(day.dinnerGenre))
          newErrors[`day${dayIdx}_dinnerGenre`] = t.form.errors.genreMultiple;
      }
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
      aiOmakase,
      useHighway,
      travelDate: travelDate || undefined,
      travelerProfile: hasProfile ? travelerProfile : undefined,
    });
  };

  const nightOptions = t.form.tripDuration.options.map((label, i) => ({ value: i, label }));

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      {/* App Description for SEO and first-time users */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl p-5 shadow-sm border border-blue-100">
        <h2 className="font-bold text-lg text-blue-800 mb-2">
          🚗 {t.form.appTitle}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t.form.appDescription}
        </p>
        <p className="text-xs text-slate-400 mt-1">Since 2026年5月</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {t.form.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-1 bg-white rounded-full text-blue-600 border border-blue-200 font-medium">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-blue-100">
          <a
            href="https://x.com/AIDRIVEPLAN"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {t.form.xFollow}
          </a>
        </div>
      </div>

      {/* Trip Duration */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg">{t.form.tripDuration.title}</h2>
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
            {t.form.departureDate.label}
            <span className="text-xs text-slate-400 font-normal ml-1">{t.form.departureDate.optional}</span>
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

                    // Check Japanese holidays
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1;
                    const day = d.getDate();
                    const pad = (n: number) => String(n).padStart(2, "0");
                    const dateStr = `${year}-${pad(month)}-${pad(day)}`;

                    // getNthMonday helper
                    const getNthMon = (y: number, m: number, n: number) => {
                      let count = 0;
                      for (let dd = 1; dd <= 31; dd++) {
                        const dt = new Date(y, m - 1, dd);
                        if (dt.getMonth() !== m - 1) break;
                        if (dt.getDay() === 1) {
                          count++;
                          if (count === n) return `${y}-${pad(m)}-${pad(dd)}`;
                        }
                      }
                      return "";
                    };

                    const fixedHolidays = [
                      `${year}-01-01`, `${year}-02-11`, `${year}-02-23`,
                      `${year}-03-20`, `${year}-04-29`,
                      `${year}-05-03`, `${year}-05-04`, `${year}-05-05`,
                      `${year}-08-11`, `${year}-09-23`,
                      `${year}-11-03`, `${year}-11-23`,
                    ];
                    const happyMondays = [
                      getNthMon(year, 1, 2),  // 成人の日
                      getNthMon(year, 7, 3),  // 海の日
                      getNthMon(year, 9, 3),  // 敬老の日
                      getNthMon(year, 10, 2), // スポーツの日
                    ];
                    const allHolidays = [...fixedHolidays, ...happyMondays];
                    const isHoliday = allHolidays.includes(dateStr);

                    // GW check
                    const isGW = (month === 4 && day >= 28) || (month === 5 && day <= 6);

                    const isCrowded = isWeekend || isHoliday || isGW;

                    return (
                      <span className={isCrowded ? "font-bold text-red-500" : ""}>
                        （{dayOfWeek}曜日
                        {isHoliday ? " 🎌祝日" : ""}
                        {isGW && !isHoliday ? " 🎌GW" : ""}
                        {isCrowded ? " 🚗混雑予想" : ""}）
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
            {t.form.departureDate.hint}
          </p>
        </div>
      </div>

      {/* AI Omakase + Dog-friendly toggles */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
        {/* AI Omakase toggle */}
        <button
          onClick={() => setAiOmakase(!aiOmakase)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            aiOmakase
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
        >
          <Sparkles
            className={`w-6 h-6 ${aiOmakase ? "text-blue-600" : "text-slate-400"}`}
          />
          <div className="text-left flex-1">
            <div
              className={`font-medium text-sm ${
                aiOmakase ? "text-blue-800" : "text-slate-600"
              }`}
            >
              {t.form.omakase.label}
            </div>
            <div className="text-xs text-slate-400">
              {t.form.omakase.description}
            </div>
          </div>
          <div
            className={`w-10 h-6 rounded-full transition-all relative ${
              aiOmakase ? "bg-blue-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                aiOmakase ? "right-1" : "left-1"
              }`}
            />
          </div>
        </button>

        {/* Dog-friendly toggle */}
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
              {t.form.dog.label}
            </div>
            <div className="text-xs text-slate-400">
              {t.form.dog.description}
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

        {/* Highway toggle */}
        <button
          onClick={() => setUseHighway(!useHighway)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
            useHighway
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
        >
          <Route
            className={`w-6 h-6 ${useHighway ? "text-emerald-600" : "text-slate-400"}`}
          />
          <div className="text-left flex-1">
            <div
              className={`font-medium text-sm ${
                useHighway ? "text-emerald-800" : "text-slate-600"
              }`}
            >
              {t.form.highway.label}
            </div>
            <div className="text-xs text-slate-400">
              {useHighway ? t.form.highway.on : t.form.highway.off}
            </div>
          </div>
          <div
            className={`w-10 h-6 rounded-full transition-all relative ${
              useHighway ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                useHighway ? "right-1" : "left-1"
              }`}
            />
          </div>
        </button>
      </div>  {/* end AI Omakase + Dog-friendly + Highway toggles */}

      {/* Traveler Profile */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-lg">{t.form.traveler.title}</h2>
          <span className="text-xs text-slate-400 font-normal">{t.form.traveler.optional}</span>
        </div>

        {/* Party type */}
        <div className="mb-3">
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t.form.traveler.partyType.label}</label>
          <div className="flex flex-wrap gap-2">
            {(["", "solo", "couple", "family", "friends", "senior"] as const).map((val, i) => ({
              value: val,
              label: t.form.traveler.partyType.options[i] ?? val,
            })).map((opt) => (
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
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t.form.traveler.ageRange.label}</label>
          <div className="flex flex-wrap gap-2">
            {(["", "20s", "30s", "40s", "50s", "60s", "70plus"] as const).map((val, i) => ({
              value: val,
              label: t.form.traveler.ageRange.options[i] ?? val,
            })).map((opt) => (
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
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t.form.traveler.hobbies.label}</label>
          <input
            type="text"
            value={travelerProfile.hobbies}
            onChange={(e) => setTravelerProfile((p) => ({ ...p, hobbies: e.target.value }))}
            placeholder={t.form.traveler.hobbies.placeholder}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">{t.form.traveler.hobbies.hint}</p>
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
            <span className="font-medium">{t.form.traveler.children.label}</span>
          </button>
          {travelerProfile.hasChildren && (
            <div className="mt-2 ml-1">
              <input
                type="text"
                value={travelerProfile.childAges}
                onChange={(e) => setTravelerProfile((p) => ({ ...p, childAges: e.target.value }))}
                placeholder={t.form.traveler.children.agePlaceholder}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm w-full"
              />
              <p className="mt-1 text-xs text-slate-400">{t.form.traveler.children.ageHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Home Address Registration */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-sm">{t.form.homeAddress.title}</h2>
          </div>
          {homeAddress && !homeEditMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHomeEditMode(true)}
                className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                {t.form.homeAddress.edit}
              </button>
              <button
                onClick={() => {
                  clearHomeAddress();
                  setHomeAddress("");
                }}
                className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              >
                {t.form.homeAddress.delete}
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
              {t.form.homeAddress.privacySaved}
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder={t.form.homeAddress.placeholder}
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
                {t.form.homeAddress.register}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {t.form.homeAddress.hint}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {t.form.homeAddress.privacy2}
            </p>
          </div>
        )}
        {homeSaved && (
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {t.form.homeAddress.saved}
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
              {t.form.day.title.replace("{n}", String(dayIdx + 1))}
              {dayIdx === 0 && nights === 0 ? t.form.day.dayTrip : ""}
            </h2>
          </div>

          {/* Departure */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
              <Navigation className="w-4 h-4 text-green-600" />
              {t.form.departure.label}
              <span className="text-red-500 text-xs">{t.form.departure.required}</span>
            </label>
            <div className="flex gap-2">
              {homeAddress && !day.departure && dayIdx === 0 && (
                <button
                  onClick={() => updateDay(dayIdx, { departure: homeAddress })}
                  className="shrink-0 px-2.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                  title={t.form.departure.homeButton}
                >
                  <Home className="w-3.5 h-3.5" />
                  {t.form.departure.homeButton}
                </button>
              )}
              <SearchInput
                value={day.departure}
                placeholder={
                  dayIdx > 0
                    ? t.form.departure.placeholder1
                    : t.form.departure.placeholder0
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
              <TimeSelector
                value={day.departureTime}
                onChange={(val) => updateDay(dayIdx, { departureTime: val })}
              />
            </div>
            {dayIdx > 0 && day.departure && (
              <p className="mt-1 text-xs text-slate-400">
                {t.form.departure.prevDayNote}
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
              {t.form.destination.label}
              <span className="text-red-500 text-xs">{t.form.destination.required}</span>
            </label>
            {day.destinations.map((spot, spotIdx) => (
              <div
                key={spot.id}
                className={`p-3 rounded-lg border space-y-1 bg-slate-50 border-slate-100 ${
                  spotIdx === 0 && errors[`day${dayIdx}_dest0`]
                    ? "border-red-300 bg-red-50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded text-blue-600 bg-blue-50">
                    #{spotIdx + 1}
                  </span>
                  <SearchInput
                    value={spot.name}
                    placeholder={t.form.destination.searchPlaceholder}
                    onChange={(val) =>
                      updateSpot(dayIdx, spot.id, { name: val })
                    }
                    onSelect={(c) => handleSpotSelect(dayIdx, spot.id, c)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                  {day.destinations.length > 1 && (
                    <button
                      onClick={() => removeDestination(dayIdx, spot.id)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {spot.address && (
                  <p className="text-xs text-slate-400 ml-10 truncate">
                    {spot.address}
                  </p>
                )}
                {/* "最初に行く" toggle - only for first destination */}
                {spotIdx === 0 && (
                  <div className="ml-10 mt-1.5">
                    <button
                      type="button"
                      onClick={() => updateDay(dayIdx, { firstDestId: day.firstDestId === spot.id ? undefined : spot.id })}
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {/* Toggle switch */}
                      <div className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${day.firstDestId === spot.id ? "bg-blue-500" : "bg-slate-300"}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${day.firstDestId === spot.id ? "right-0.5" : "left-0.5"}`} />
                      </div>
                      <span className={`font-medium ${day.firstDestId === spot.id ? "text-blue-600" : "text-slate-400"}`}>
                        {t.form.destination.firstToggle}
                      </span>
                    </button>
                  </div>
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
                {t.form.destination.add}
              </button>
            </div>
          </div>

          {/* Arrival */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
              <Navigation className="w-4 h-4 text-red-500" />
              {t.form.arrival.label}
              <span className="text-red-500 text-xs">{t.form.arrival.required}</span>
            </label>
            <div className="flex gap-2">
              {homeAddress && !day.arrival && (
                <button
                  onClick={() => updateDay(dayIdx, { arrival: homeAddress })}
                  className="shrink-0 px-2.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                  title={t.form.departure.homeButton}
                >
                  <Home className="w-3.5 h-3.5" />
                  自宅
                </button>
              )}
              <SearchInput
                value={day.arrival}
                placeholder={t.form.arrival.placeholder}
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
              <TimeSelector
                value={day.arrivalTime}
                onChange={(val) => updateDay(dayIdx, { arrivalTime: val })}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {t.form.arrival.timeHint}
            </p>
            {errors[`day${dayIdx}_arrival`] && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors[`day${dayIdx}_arrival`]}
              </p>
            )}
          </div>

          {/* Meals */}
          <div className="space-y-3">
            {/* Lunch */}
            <div className={`rounded-lg border-2 transition-all ${day.includeLunch ? "border-orange-300 bg-orange-50/50" : "border-slate-200 bg-slate-50"}`}>
              <button
                type="button"
                onClick={() => updateDay(dayIdx, { includeLunch: !day.includeLunch })}
                className="w-full flex items-center gap-2.5 px-3 py-2.5"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${day.includeLunch ? "bg-orange-500 border-orange-500" : "border-slate-300 bg-white"}`}>
                  {day.includeLunch && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <Utensils className={`w-4 h-4 ${day.includeLunch ? "text-orange-600" : "text-slate-400"}`} />
                <span className={`text-sm font-medium ${day.includeLunch ? "text-orange-800" : "text-slate-500"}`}>{t.form.lunch.toggle}</span>
              </button>
              {day.includeLunch && (
                <div className="px-3 pb-3 space-y-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t.form.lunch.locationLabel}</label>
                    <input
                      type="text"
                      placeholder={t.form.lunch.locationPlaceholder}
                      value={day.lunchLocation}
                      onChange={(e) => {
                        updateDay(dayIdx, { lunchLocation: e.target.value });
                        setErrors((prev) => { const n = { ...prev }; delete n[`day${dayIdx}_lunchLocation`]; return n; });
                      }}
                      className={`w-full px-3 py-2 rounded-lg border outline-none transition-all text-sm ${errors[`day${dayIdx}_lunchLocation`] ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"}`}
                    />
                    {errors[`day${dayIdx}_lunchLocation`] && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors[`day${dayIdx}_lunchLocation`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t.form.lunch.genreLabel}</label>
                    <input
                      type="text"
                      placeholder={t.form.lunch.genrePlaceholder}
                      value={day.lunchGenre}
                      onChange={(e) => {
                        updateDay(dayIdx, { lunchGenre: e.target.value });
                        setErrors((prev) => { const n = { ...prev }; delete n[`day${dayIdx}_lunchGenre`]; return n; });
                      }}
                      className={`w-full px-3 py-2 rounded-lg border outline-none transition-all text-sm ${errors[`day${dayIdx}_lunchGenre`] ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"}`}
                    />
                    {errors[`day${dayIdx}_lunchGenre`] && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors[`day${dayIdx}_lunchGenre`]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dinner */}
            <div className={`rounded-lg border-2 transition-all ${day.includeDinner ? "border-purple-300 bg-purple-50/50" : "border-slate-200 bg-slate-50"}`}>
              <button
                type="button"
                onClick={() => updateDay(dayIdx, { includeDinner: !day.includeDinner })}
                className="w-full flex items-center gap-2.5 px-3 py-2.5"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${day.includeDinner ? "bg-purple-500 border-purple-500" : "border-slate-300 bg-white"}`}>
                  {day.includeDinner && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <Utensils className={`w-4 h-4 ${day.includeDinner ? "text-purple-600" : "text-slate-400"}`} />
                <span className={`text-sm font-medium ${day.includeDinner ? "text-purple-800" : "text-slate-500"}`}>{t.form.dinner.toggle}</span>
              </button>
              {day.includeDinner && (
                <div className="px-3 pb-3 space-y-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t.form.dinner.locationLabel}</label>
                    <input
                      type="text"
                      placeholder={t.form.dinner.locationPlaceholder}
                      value={day.dinnerLocation}
                      onChange={(e) => {
                        updateDay(dayIdx, { dinnerLocation: e.target.value });
                        setErrors((prev) => { const n = { ...prev }; delete n[`day${dayIdx}_dinnerLocation`]; return n; });
                      }}
                      className={`w-full px-3 py-2 rounded-lg border outline-none transition-all text-sm ${errors[`day${dayIdx}_dinnerLocation`] ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"}`}
                    />
                    {errors[`day${dayIdx}_dinnerLocation`] && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors[`day${dayIdx}_dinnerLocation`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t.form.dinner.genreLabel}</label>
                    <input
                      type="text"
                      placeholder={t.form.dinner.genrePlaceholder}
                      value={day.dinnerGenre}
                      onChange={(e) => {
                        updateDay(dayIdx, { dinnerGenre: e.target.value });
                        setErrors((prev) => { const n = { ...prev }; delete n[`day${dayIdx}_dinnerGenre`]; return n; });
                      }}
                      className={`w-full px-3 py-2 rounded-lg border outline-none transition-all text-sm ${errors[`day${dayIdx}_dinnerGenre`] ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"}`}
                    />
                    {errors[`day${dayIdx}_dinnerGenre`] && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors[`day${dayIdx}_dinnerGenre`]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Error summary */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">{t.form.errorSummary.title}</p>
            <p className="text-xs text-red-500 mt-1">
              {t.form.errorSummary.desc}
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
            {t.form.submitting}
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            {t.form.submit}
          </>
        )}
      </button>

      {/* Disclaimer & Terms */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-1">{t.form.disclaimer.title}</h3>
          <ul className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
            {t.form.disclaimer.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-1">{t.form.terms.title}</h3>
          <ul className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
            {t.form.terms.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
        <p className="text-[10px] text-slate-300 text-center">
          {t.form.copyright.replace("{year}", String(new Date().getFullYear()))}
        </p>
      </div>
    </div>
  );
}
