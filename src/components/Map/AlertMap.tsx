"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert, getCategoryInfo } from "@/lib/oref";
import { cities, threatOrigins } from "@/lib/cities";

interface AlertMapProps {
  alerts: ProcessedAlert[];
  activeAlerts: ProcessedAlert[];
}

export default function AlertMap({ alerts, activeAlerts }: AlertMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { locale } = useApp();
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Israel bounds
  const ISRAEL_CENTER: [number, number] = [34.85, 31.5];

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setMapLoaded(true); // Show fallback
      return;
    }

    import("mapbox-gl").then((mapboxgl) => {
      mapboxgl.default.accessToken = token;

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: ISRAEL_CENTER,
        zoom: 7.5,
        pitch: 30,
        bearing: 0,
        maxBounds: [
          [33.5, 29],
          [36.5, 34],
        ],
      });

      map.on("load", () => {
        mapRef.current = map;
        setMapLoaded(true);
      });

      return () => map.remove();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // This would add/update markers on the real map
    // For now, we render the alert overlay with CSS
  }, [alerts, mapLoaded]);

  // Determine threat origin for active alerts
  const getOriginForAlert = (alert: ProcessedAlert) => {
    const city = alert.cities[0];
    const cityData = cities[city];
    if (!cityData) return threatOrigins.gaza;
    if (cityData.region === "north") return threatOrigins.lebanon;
    if (cityData.region === "south") return threatOrigins.gaza;
    if (alert.category === 13) return threatOrigins.iran;
    return threatOrigins.gaza;
  };

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-7rem)]">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 bg-bg" />

      {/* Fallback map (SVG) when no Mapbox token */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg">
          <SVGMap alerts={alerts} activeAlerts={activeAlerts} locale={locale} />
        </div>
      )}

      {/* Active alert overlay */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Red border pulse */}
            <div className="absolute inset-0 border-4 border-alert-red/60 animate-pulse-alert rounded-none" />

            {/* Alert info overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
              {activeAlerts.map((alert) => {
                const catInfo = getCategoryInfo(alert.category);
                const origin = getOriginForAlert(alert);
                const shelterTime = alert.cities[0] ? cities[alert.cities[0]]?.shelterTime || 90 : 90;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-alert-red/95 backdrop-blur-xl rounded-2xl px-8 py-6 text-center glow-red-intense mb-4"
                  >
                    <div className="text-white/80 text-xs uppercase tracking-widest mb-2">
                      {catInfo.icon} {locale === "he" ? catInfo.he : catInfo.en} • {locale === "he" ? `מ${origin.label_he}` : `from ${origin.label_en}`}
                    </div>
                    <div className="text-white text-2xl font-bold mb-2">
                      {alert.cities.map((c) => {
                        const city = cities[c];
                        return locale === "he" ? c : city?.name_en || c;
                      }).join(", ")}
                    </div>
                    <ShelterCountdown seconds={shelterTime} locale={locale} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent alert dots overlay (on top of map) */}
      <div className="absolute inset-0 pointer-events-none">
        {alerts.slice(0, 20).map((alert, i) => {
          const city = cities[alert.cities[0]];
          if (!city) return null;

          const isActive = activeAlerts.some((a) => a.id === alert.id);
          const hoursAgo = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
          const opacity = isActive ? 1 : Math.max(0.15, 1 - hoursAgo / 24);

          // Simple projection (good enough for Israel's small area)
          const x = ((city.lng - 33.5) / 3) * 100;
          const y = ((34 - city.lat) / 5) * 100;

          return (
            <div
              key={`dot-${alert.id}-${i}`}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {isActive && (
                <div className="absolute w-12 h-12 -inset-4 rounded-full bg-alert-red/30 alert-pulse-ring" />
              )}
              <div
                className={`w-3 h-3 rounded-full ${isActive ? "bg-alert-red animate-pulse-alert" : "bg-alert-red/70"}`}
                style={{ opacity }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Shelter countdown timer
function ShelterCountdown({ seconds, locale }: { seconds: number; locale: string }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="font-mono text-5xl font-bold text-white tabular-nums">
        {remaining}
      </span>
      <span className="text-white/70 text-sm">
        {locale === "he" ? "שניות למיגון" : "seconds to shelter"}
      </span>
    </div>
  );
}

// SVG fallback map of Israel
function SVGMap({
  alerts,
  activeAlerts,
  locale,
}: {
  alerts: ProcessedAlert[];
  activeAlerts: ProcessedAlert[];
  locale: string;
}) {
  return (
    <svg viewBox="0 0 400 600" className="w-full max-w-md h-full max-h-[70vh]">
      {/* Israel outline (simplified) */}
      <path
        d="M200,50 L230,80 L250,120 L260,180 L270,220 L250,280 L240,320 L220,380 L200,440 L180,500 L170,540 L160,560 L155,580 L170,560 L180,520 L160,480 L150,420 L140,360 L130,300 L140,250 L150,200 L160,160 L170,120 L180,80 Z"
        fill="none"
        stroke="#1e1e2e"
        strokeWidth="2"
      />

      {/* City dots */}
      {alerts.slice(0, 30).map((alert, i) => {
        const city = cities[alert.cities[0]];
        if (!city) return null;

        const isActive = activeAlerts.some((a) => a.id === alert.id);
        // Map lat/lng to SVG coords
        const x = ((city.lng - 34) * 200) + 200;
        const y = ((33.5 - city.lat) * 200) + 50;
        const hoursAgo = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
        const opacity = isActive ? 1 : Math.max(0.2, 1 - hoursAgo / 24);

        return (
          <g key={`svg-${alert.id}-${i}`}>
            {isActive && (
              <>
                <circle cx={x} cy={y} r="20" fill="rgba(255,51,51,0.2)" className="alert-pulse-ring" />
                <circle cx={x} cy={y} r="12" fill="rgba(255,51,51,0.3)" className="animate-pulse" />
              </>
            )}
            <circle cx={x} cy={y} r="4" fill="#ff3333" opacity={opacity} />
            {isActive && (
              <text x={x} y={y - 12} textAnchor="middle" fill="#ff3333" fontSize="10" fontWeight="bold">
                {locale === "he" ? city.name_he : city.name_en}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
