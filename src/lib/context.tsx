"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useLocale } from "./hooks";
import { translations, getDirection, type Locale } from "./i18n";

interface AppContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof translations)["en"] | (typeof translations)["he"];
  dir: "ltr" | "rtl";
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useLocale();
  const t = translations[locale];
  const dir = getDirection(locale);

  return (
    <AppContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
