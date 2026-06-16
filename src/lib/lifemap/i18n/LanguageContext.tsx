"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translations, LANGUAGES, type LangCode } from "./dictionaries";

const LANG_STORAGE_KEY = "lifemap-lang";
const COUNTRY_STORAGE_KEY = "lifemap-country";

// 居住国の定義
export type HomeCountryCode = "JP" | "US" | "GB" | "DE" | "FR" | "KR" | "CN" | "AU" | "CA";

export interface HomeCountry {
  code: HomeCountryCode;
  label: string;
  center: [number, number];
  zoom: number;
  isJapan: boolean;
}

export const HOME_COUNTRIES: HomeCountry[] = [
  { code: "JP", label: "日本",       center: [37.5, 137.5],  zoom: 5, isJapan: true  },
  { code: "US", label: "USA",        center: [37.8, -96.0],  zoom: 4, isJapan: false },
  { code: "GB", label: "UK",         center: [54.0, -2.5],   zoom: 5, isJapan: false },
  { code: "DE", label: "Deutschland",center: [51.2, 10.5],   zoom: 6, isJapan: false },
  { code: "FR", label: "France",     center: [46.8, 2.3],    zoom: 6, isJapan: false },
  { code: "KR", label: "한국",       center: [36.5, 127.8],  zoom: 7, isJapan: false },
  { code: "CN", label: "中国",       center: [35.0, 105.0],  zoom: 4, isJapan: false },
  { code: "AU", label: "Australia",  center: [-25.0, 133.0], zoom: 4, isJapan: false },
  { code: "CA", label: "Canada",     center: [56.0, -96.0],  zoom: 4, isJapan: false },
];

const DEFAULT_COUNTRY = HOME_COUNTRIES[0]; // 日本

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  homeCountry: HomeCountry;
  setHomeCountry: (country: HomeCountry) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ja",
  setLang: () => undefined,
  t: (key) => key,
  homeCountry: DEFAULT_COUNTRY,
  setHomeCountry: () => undefined,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("ja");
  const [homeCountry, setHomeCountryState] = useState<HomeCountry>(DEFAULT_COUNTRY);

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    if (savedLang && translations[savedLang]) setLangState(savedLang);

    const savedCountry = localStorage.getItem(COUNTRY_STORAGE_KEY) as HomeCountryCode | null;
    if (savedCountry) {
      const found = HOME_COUNTRIES.find((c) => c.code === savedCountry);
      if (found) setHomeCountryState(found);
    }
  }, []);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  }, []);

  const setHomeCountry = useCallback((next: HomeCountry) => {
    setHomeCountryState(next);
    localStorage.setItem(COUNTRY_STORAGE_KEY, next.code);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split(".");
      let val: unknown = translations[lang];
      for (const p of parts) {
        if (val == null || typeof val !== "object") {
          val = null;
          break;
        }
        val = (val as Record<string, unknown>)[p];
      }
      let result = typeof val === "string" ? val : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          result = result.replaceAll(`{{${k}}}`, String(v));
        }
      }
      return result;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, homeCountry, setHomeCountry }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

export { LANGUAGES };
export type { LangCode };
