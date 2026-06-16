"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  tripTranslations,
  type TripLangCode,
  type TripPlannerDict,
  TRIP_LANGUAGES,
} from "./tripPlannerDictionaries";

const STORAGE_KEY = "lifemap-lang"; // Life Map と同じキーで言語設定を共有

interface TripPlannerLangContextValue {
  lang: TripLangCode;
  setLang: (lang: TripLangCode) => void;
  t: TripPlannerDict;
  languages: typeof TRIP_LANGUAGES;
}

const TripPlannerLangContext = createContext<TripPlannerLangContextValue | null>(null);

export function TripPlannerLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<TripLangCode>("ja");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as TripLangCode | null;
      if (stored && tripTranslations[stored]) {
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setLang = useCallback((next: TripLangCode) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return (
    <TripPlannerLangContext.Provider
      value={{ lang, setLang, t: tripTranslations[lang], languages: TRIP_LANGUAGES }}
    >
      {children}
    </TripPlannerLangContext.Provider>
  );
}

export function useTripLang() {
  const ctx = useContext(TripPlannerLangContext);
  if (!ctx) throw new Error("useTripLang must be used within TripPlannerLanguageProvider");
  return ctx;
}
