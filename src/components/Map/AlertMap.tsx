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

// Israel geographic bounds for projection
const MAP_BOUNDS = {
  minLng: 34.0,
  maxLng: 36.0,
  minLat: 29.4,
  maxLat: 33.4,
};

function projectToSVG(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * width;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
  return { x, y };
}

export default function AlertMap({ alerts, activeAlerts }: AlertMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { locale } = useApp();
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const ISRAEL_CENTER: [number, number] = [34.85, 31.5];

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setMapLoaded(true);
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
        maxBounds: [[33.5, 29], [36.5, 34]],
      });

      map.on("load", () => {
        mapRef.current = map;
        setMapLoaded(true);
      });

      return () => map.remove();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
  }, [alerts, mapLoaded]);

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
      <div ref={mapContainer} className="absolute inset-0 bg-bg" />

      {/* SVG fallback map */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-bg">
          <SVGMap alerts={alerts} activeAlerts={activeAlerts} locale={locale} />
        </div>
      )}

      {/* Active alert full-screen overlay */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 border-4 border-alert-red/60 animate-pulse-alert" />

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

      {/* Alert dots overlay on Mapbox */}
      {process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 pointer-events-none">
          {alerts.slice(0, 20).map((alert, i) => {
            const city = cities[alert.cities[0]];
            if (!city) return null;

            const isActive = activeAlerts.some((a) => a.id === alert.id);
            const hoursAgo = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
            const opacity = isActive ? 1 : Math.max(0.15, 1 - hoursAgo / 24);
            const x = ((city.lng - 33.5) / 3) * 100;
            const y = ((34 - city.lat) / 5) * 100;

            return (
              <div
                key={`dot-${alert.id}-${i}`}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
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
      )}
    </div>
  );
}

function ShelterCountdown({ seconds, locale }: { seconds: number; locale: string }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  if (remaining === 0) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">🛡️</span>
        <span className="font-bold text-lg text-white">
          {locale === "he" ? "הישארו במיגון!" : "Stay in shelter!"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="font-mono text-3xl sm:text-5xl font-bold text-white tabular-nums">{remaining}</span>
      <span className="text-white/70 text-sm">
        {locale === "he" ? "שניות למיגון" : "seconds to shelter"}
      </span>
    </div>
  );
}

// Full SVG map with proper Israel outline, grid, and region labels
function SVGMap({
  alerts,
  activeAlerts,
  locale,
}: {
  alerts: ProcessedAlert[];
  activeAlerts: ProcessedAlert[];
  locale: string;
}) {
  const W = 350;
  const H = 700;

  // Simplified Israel border path (projected coordinates)
  const israelBorderPoints = [
    { lat: 33.28, lng: 35.63 }, // NE corner (Hermon)
    { lat: 33.05, lng: 35.15 }, // N coast
    { lat: 32.98, lng: 35.07 }, // Rosh HaNikra
    { lat: 32.82, lng: 35.00 }, // Haifa area
    { lat: 32.60, lng: 34.90 }, // Haifa south
    { lat: 32.32, lng: 34.85 }, // Netanya
    { lat: 32.08, lng: 34.77 }, // Tel Aviv
    { lat: 31.80, lng: 34.65 }, // Ashdod
    { lat: 31.67, lng: 34.57 }, // Ashkelon
    { lat: 31.52, lng: 34.50 }, // N Gaza border
    { lat: 31.30, lng: 34.24 }, // S Gaza border
    { lat: 31.20, lng: 34.27 }, // Beer Sheva area
    { lat: 30.60, lng: 34.80 }, // Mitzpe Ramon area
    { lat: 29.90, lng: 34.90 }, // Eilat approach
    { lat: 29.55, lng: 34.95 }, // Eilat
    { lat: 29.50, lng: 35.00 }, // Eilat SE
    { lat: 30.30, lng: 35.15 }, // Arava
    { lat: 31.00, lng: 35.40 }, // Dead Sea S
    { lat: 31.50, lng: 35.50 }, // Dead Sea N
    { lat: 31.77, lng: 35.55 }, // Jericho
    { lat: 32.10, lng: 35.55 }, // Jordan Valley
    { lat: 32.50, lng: 35.60 }, // Beit She'an
    { lat: 32.75, lng: 35.65 }, // Kinneret
    { lat: 33.00, lng: 35.62 }, // Golan
    { lat: 33.28, lng: 35.63 }, // Back to Hermon
  ];

  const borderPath = israelBorderPoints
    .map((p, i) => {
      const { x, y } = projectToSVG(p.lat, p.lng, W, H);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  // Region label positions
  const regionLabels = [
    { label: locale === "he" ? "צפון" : "NORTH", lat: 32.9, lng: 35.25 },
    { label: locale === "he" ? "מרכז" : "CENTER", lat: 32.08, lng: 35.1 },
    { label: locale === "he" ? "דרום" : "SOUTH", lat: 31.2, lng: 34.7 },
    { label: locale === "he" ? "ירושלים" : "JERUSALEM", lat: 31.77, lng: 35.35 },
  ];

  // Threat origin arrows
  const threatLines = [
    { origin: threatOrigins.gaza, label: locale === "he" ? "עזה" : "GAZA", lat: 31.35, lng: 34.30 },
    { origin: threatOrigins.lebanon, label: locale === "he" ? "לבנון" : "LEBANON", lat: 33.35, lng: 35.40 },
  ];

  // De-duplicate city dots
  const cityDots = new Map<string, { city: typeof cities[string]; isActive: boolean; opacity: number; alertCount: number }>();
  alerts.slice(0, 40).forEach((alert) => {
    alert.cities.forEach((cityName) => {
      const city = cities[cityName];
      if (!city) return;
      const isActive = activeAlerts.some((a) => a.cities.includes(cityName));
      const hoursAgo = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
      const opacity = isActive ? 1 : Math.max(0.2, 1 - hoursAgo / 24);
      const existing = cityDots.get(cityName);
      if (!existing || isActive || opacity > existing.opacity) {
        cityDots.set(cityName, {
          city,
          isActive,
          opacity,
          alertCount: (existing?.alertCount || 0) + 1,
        });
      }
    });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm h-full max-h-[75vh] mx-auto">
      <defs>
        <radialGradient id="alertGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff3333" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ff3333" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[30, 31, 32, 33].map((lat) => {
        const { y } = projectToSVG(lat, MAP_BOUNDS.minLng, W, H);
        return (
          <g key={`lat-${lat}`}>
            <line x1="0" y1={y} x2={W} y2={y} stroke="#1e1e2e" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x="4" y={y - 3} fill="#555566" fontSize="8" fontFamily="JetBrains Mono, monospace">{lat}°N</text>
          </g>
        );
      })}
      {[34.5, 35.0, 35.5].map((lng) => {
        const { x } = projectToSVG(MAP_BOUNDS.maxLat, lng, W, H);
        return (
          <g key={`lng-${lng}`}>
            <line x1={x} y1="0" x2={x} y2={H} stroke="#1e1e2e" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={x + 3} y={H - 4} fill="#555566" fontSize="8" fontFamily="JetBrains Mono, monospace">{lng}°E</text>
          </g>
        );
      })}

      {/* Israel border */}
      <path d={borderPath} fill="rgba(18,18,26,0.6)" stroke="#2a2a3e" strokeWidth="1.5" />

      {/* Mediterranean Sea label */}
      {(() => {
        const { x, y } = projectToSVG(32.3, 34.3, W, H);
        return (
          <text x={x} y={y} fill="#1a1a2a" fontSize="10" fontStyle="italic" textAnchor="middle"
            transform={`rotate(-70, ${x}, ${y})`}>
            {locale === "he" ? "הים התיכון" : "Mediterranean Sea"}
          </text>
        );
      })()}

      {/* Threat origin labels */}
      {threatLines.map((t) => {
        const { x, y } = projectToSVG(t.lat, t.lng, W, H);
        return (
          <text key={t.label} x={x} y={y} fill="#444455" fontSize="9" fontWeight="bold"
            textAnchor="middle" fontFamily="JetBrains Mono, monospace">
            {t.label}
          </text>
        );
      })}

      {/* Region labels */}
      {regionLabels.map((r) => {
        const { x, y } = projectToSVG(r.lat, r.lng, W, H);
        return (
          <text key={r.label} x={x} y={y} fill="#2a2a3e" fontSize="11" fontWeight="600"
            textAnchor="middle" letterSpacing="2">
            {r.label}
          </text>
        );
      })}

      {/* City dots */}
      {Array.from(cityDots.entries()).map(([cityName, data]) => {
        const { x, y } = projectToSVG(data.city.lat, data.city.lng, W, H);
        const radius = Math.min(3 + data.alertCount * 0.5, 8);

        return (
          <g key={cityName}>
            {/* Active glow */}
            {data.isActive && (
              <>
                <circle cx={x} cy={y} r={radius * 6} fill="url(#alertGlow)" className="alert-pulse-ring" />
                <circle cx={x} cy={y} r={radius * 3} fill="rgba(255,51,51,0.15)" className="animate-pulse" />
              </>
            )}

            {/* Dot */}
            <circle
              cx={x} cy={y}
              r={data.isActive ? radius * 1.5 : radius}
              fill="#ff3333"
              opacity={data.opacity}
              filter={data.isActive ? "url(#glow)" : undefined}
            />

            {/* Label for larger/active dots */}
            {(data.isActive || data.alertCount >= 2) && (
              <text
                x={x}
                y={y - radius * (data.isActive ? 2 : 1.5) - 4}
                textAnchor="middle"
                fill={data.isActive ? "#ff3333" : "#888899"}
                fontSize={data.isActive ? "10" : "8"}
                fontWeight={data.isActive ? "bold" : "normal"}
                fontFamily="Inter, sans-serif"
              >
                {locale === "he" ? data.city.name_he : data.city.name_en}
              </text>
            )}

            {/* Alert count badge */}
            {data.alertCount > 1 && !data.isActive && (
              <g>
                <circle cx={x + radius + 6} cy={y - radius} r="6" fill="#ff3333" opacity="0.8" />
                <text x={x + radius + 6} y={y - radius + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
                  {data.alertCount}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${W - 100}, ${H - 60})`}>
        <rect x="0" y="0" width="90" height="50" rx="8" fill="#12121a" stroke="#1e1e2e" />
        <circle cx="14" cy="16" r="4" fill="#ff3333" />
        <text x="24" y="19" fill="#888899" fontSize="8">{locale === "he" ? "התרעה" : "Alert"}</text>
        <circle cx="14" cy="34" r="4" fill="#ff3333" opacity="0.3" />
        <text x="24" y="37" fill="#888899" fontSize="8">{locale === "he" ? "היסטורי" : "Historical"}</text>
      </g>
    </svg>
  );
}
