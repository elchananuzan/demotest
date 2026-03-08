"use client";

import { useEffect, useRef, useCallback } from "react";
import { type ProcessedAlert } from "@/lib/oref";

/**
 * Multi-sound alert system:
 * - /siren.mp3         → Real alert (rockets, drones, etc.) — loops while active
 * - /alert-early.mp3   → Early warning (התרעה מקדימה, cat 13) — gentle chime, plays once
 * - /alert-clear.mp3   → All clear — happy sound when alerts end
 *
 * Respects browser autoplay policy (requires first user interaction).
 */
export default function SirenSound({
  active,
  activeAlerts,
}: {
  active: boolean;
  activeAlerts: ProcessedAlert[];
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

  // Pre-load all sounds
  useEffect(() => {
    const siren = new Audio("/siren.mp3");
    siren.loop = true;
    siren.preload = "auto";
    siren.volume = 0.8;
    sirenRef.current = siren;

    const early = new Audio("/alert-early.mp3");
    early.preload = "auto";
    early.volume = 0.7;
    earlyRef.current = early;

    const clear = new Audio("/alert-clear.mp3");
    clear.preload = "auto";
    clear.volume = 0.6;
    clearRef.current = clear;

    return () => {
      [siren, early, clear].forEach((a) => { a.pause(); a.src = ""; });
    };
  }, []);

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
      // Check if it's only early warning alerts
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
      // Play "all clear" when alerts end (only if there was a previous alert)
      if (wasActiveRef.current) {
        wasActiveRef.current = false;
        playAudio(clearRef.current);
      }
    }
  }, [active, activeAlerts, playAudio, stopAll]);

  return null;
}
