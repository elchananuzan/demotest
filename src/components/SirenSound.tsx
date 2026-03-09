"use client";

import { useEffect, useRef, useCallback } from "react";
import { type ProcessedAlert } from "@/lib/oref";
import { type AlertSettings } from "@/lib/hooks";

/**
 * Multi-sound alert system with customizable sounds:
 * - Siren       → Real alert (rockets, drones, etc.) — loops while active
 * - Early chime → Informational alert (cat 13) — plays once
 * - All clear   → When alerts end — plays once
 *
 * Users can upload custom MP3s; falls back to built-in sounds.
 * Respects browser autoplay policy (requires first user interaction).
 */
export default function SirenSound({
  active,
  activeAlerts,
  settings,
}: {
  active: boolean;
  activeAlerts: ProcessedAlert[];
  settings: AlertSettings;
}) {
  const sirenRef = useRef<HTMLAudioElement | null>(null);
  const earlyRef = useRef<HTMLAudioElement | null>(null);
  const clearRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);
  const wasActiveRef = useRef(false);

  // Track user interaction (required for autoplay policy)
  useEffect(() => {
    const handler = () => { hasInteractedRef.current = true; };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  // Load / reload sounds when settings change
  useEffect(() => {
    const vol = settings.volume / 100;

    const siren = new Audio(settings.customSiren || "/siren.mp3");
    siren.loop = true;
    siren.preload = "auto";
    siren.volume = vol;
    sirenRef.current = siren;

    const early = new Audio(settings.customEarly || "/alert-early.mp3");
    early.preload = "auto";
    early.volume = Math.max(0, vol - 0.1);
    earlyRef.current = early;

    const clear = new Audio(settings.customClear || "/alert-clear.mp3");
    clear.preload = "auto";
    clear.volume = Math.max(0, vol - 0.2);
    clearRef.current = clear;

    return () => {
      [siren, early, clear].forEach((a) => { a.pause(); a.src = ""; });
    };
  }, [settings.customSiren, settings.customEarly, settings.customClear, settings.volume]);

  const playAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!hasInteractedRef.current || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const stopAll = useCallback(() => {
    [sirenRef.current, earlyRef.current].forEach((a) => {
      if (a) { a.pause(); a.currentTime = 0; }
    });
  }, []);

  // Listen for SW push messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SIREN_ALERT") {
        const category = event.data.category;
        if (category === 13) {
          playAudio(earlyRef.current);
        } else {
          playAudio(sirenRef.current);
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [playAudio]);

  // Play appropriate sound based on active alerts
  useEffect(() => {
    if (active && activeAlerts.length > 0) {
      const hasRealAlert = activeAlerts.some((a) => a.category !== 13);
      const hasEarlyWarning = activeAlerts.some((a) => a.category === 13);

      if (hasRealAlert) {
        playAudio(sirenRef.current);
      } else if (hasEarlyWarning) {
        playAudio(earlyRef.current);
      }
      wasActiveRef.current = true;
    } else {
      stopAll();
      if (wasActiveRef.current) {
        wasActiveRef.current = false;
        playAudio(clearRef.current);
      }
    }
  }, [active, activeAlerts, playAudio, stopAll]);

  return null;
}
