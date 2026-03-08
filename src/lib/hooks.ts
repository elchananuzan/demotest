"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { type ProcessedAlert, calculateThreatLevel, INFORMATIONAL_CATEGORIES } from "./oref";
import type { Locale } from "./i18n";

// Locale hook with localStorage persistence
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("iron-wall-locale") as Locale;
    if (saved === "en" || saved === "he") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("iron-wall-locale", l);
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);

  return { locale, setLocale };
}

// Animated counter
export function useAnimatedNumber(target: number, duration = 1000) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = current;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(Math.round(startValueRef.current + (target - startValueRef.current) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}

// Alert polling with SWR
const alertFetcher = async (): Promise<ProcessedAlert[]> => {
  const res = await fetch("/api/alerts");
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
};

export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR<ProcessedAlert[]>(
    "alerts",
    alertFetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  const alerts = data || [];

  const isRealtimeAndRecent = (a: ProcessedAlert) => {
    if (a.id.startsWith("hist-") || a.id.startsWith("oref-")) return false;
    return Date.now() - new Date(a.timestamp).getTime() < 5 * 60 * 1000;
  };

  // Real threat alerts (rockets, drones, etc.)
  const activeAlerts = alerts.filter((a) => {
    if (INFORMATIONAL_CATEGORIES.has(a.category)) return false;
    return isRealtimeAndRecent(a);
  });

  // Informational live alerts (event ended = cat 13, alerts expected = cat 14)
  const activeInfoAlerts = alerts.filter((a) => {
    if (!INFORMATIONAL_CATEGORIES.has(a.category)) return false;
    return isRealtimeAndRecent(a);
  });

  const alerts24h = alerts.filter((a) => {
    return Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000;
  });

  const alertsToday = alerts.filter((a) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(a.timestamp) >= today;
  });

  const threatLevel = calculateThreatLevel(alerts24h.length, activeAlerts.length > 0);

  return {
    alerts,
    activeAlerts,
    activeInfoAlerts,
    alerts24h,
    alertsToday,
    threatLevel,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Time ago formatter
export function useTimeAgo(timestamp: string, locale: Locale) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(timestamp).getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (locale === "he") {
        if (days > 0) setTimeAgo(`לפני ${days} ימים`);
        else if (hours > 0) setTimeAgo(`לפני ${hours} שעות`);
        else if (minutes > 0) setTimeAgo(`לפני ${minutes} דקות`);
        else setTimeAgo("עכשיו");
      } else {
        if (days > 0) setTimeAgo(`${days}d ago`);
        else if (hours > 0) setTimeAgo(`${hours}h ago`);
        else if (minutes > 0) setTimeAgo(`${minutes}m ago`);
        else setTimeAgo("just now");
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timestamp, locale]);

  return timeAgo;
}

// Install PWA prompt
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === "accepted";
  };

  return { isInstallable, install };
}

// City selection with localStorage persistence
export function useMyCity() {
  const [city, setCityState] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("iron-wall-my-city");
    if (saved) setCityState(saved);
  }, []);

  const setCity = useCallback((c: string) => {
    setCityState(c);
    if (c) {
      localStorage.setItem("iron-wall-my-city", c);
    } else {
      localStorage.removeItem("iron-wall-my-city");
    }
  }, []);

  return { city, setCity };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
