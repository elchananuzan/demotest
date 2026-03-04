"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert, getCategoryInfo } from "@/lib/oref";
import { cities } from "@/lib/cities";

interface AlertTickerProps {
  alerts: ProcessedAlert[];
}

export default function AlertTicker({ alerts }: AlertTickerProps) {
  const { locale } = useApp();
  const [isPaused, setIsPaused] = useState(false);
  const recentAlerts = alerts.slice(0, 15);

  if (recentAlerts.length === 0) return null;

  return (
    <div
      className="fixed top-14 left-0 right-0 z-40 bg-bg-card/90 backdrop-blur border-b border-border overflow-hidden h-9"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role="marquee"
      aria-label={locale === "he" ? "עדכוני התרעות אחרונים" : "Recent alert updates"}
    >
      <motion.div
        className="flex items-center gap-8 h-full whitespace-nowrap"
        animate={{ x: locale === "he" ? ["100%", "-100%"] : ["-100%", "100%"] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ animationPlayState: isPaused ? "paused" : "running" }}
      >
        {recentAlerts.map((alert, i) => {
          const catInfo = getCategoryInfo(alert.category);
          const time = new Date(alert.timestamp).toLocaleTimeString(locale === "he" ? "he-IL" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const cityNames = alert.cities
            .map((c) => {
              const city = cities[c];
              return locale === "he" ? c : city?.name_en || c;
            })
            .join(", ");

          return (
            <span key={`${alert.id}-${i}`} className="flex items-center gap-2 text-sm">
              <span>{catInfo.icon}</span>
              <span className="text-text-secondary">{time}</span>
              <span className="text-text-primary font-medium">{cityNames}</span>
              <span className="text-text-secondary">·</span>
              <span style={{ color: catInfo.color }} className="font-medium">
                {locale === "he" ? catInfo.he : catInfo.en}
              </span>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}
