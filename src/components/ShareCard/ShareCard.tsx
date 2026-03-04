"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert, getCategoryInfo } from "@/lib/oref";
import { cities } from "@/lib/cities";

interface ShareCardProps {
  alert: ProcessedAlert;
  onShare?: () => void;
}

export default function ShareCard({ alert, onShare }: ShareCardProps) {
  const { locale, t } = useApp();
  const [copied, setCopied] = useState(false);
  const catInfo = getCategoryInfo(alert.category);
  const city = cities[alert.cities[0]];
  const time = new Date(alert.timestamp).toLocaleTimeString(locale === "he" ? "he-IL" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const cityName = locale === "he" ? alert.cities[0] : city?.name_en || alert.cities[0];
  const shelterTime = city?.shelterTime || 90;

  const handleShare = async () => {
    const text = locale === "he"
      ? `${time} ב${cityName} — ${shelterTime} שניות למצוא מקלט`
      : `${time} in ${cityName} — ${shelterTime} seconds to find shelter`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "LionFury", text, url: window.location.href });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onShare?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-bg-card to-bg border border-border rounded-2xl p-6 relative overflow-hidden hover:border-alert-red/20 transition-colors"
    >
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: catInfo.color }} />

      <div className="mb-4">
        <span className="text-xs text-text-secondary uppercase tracking-wider">
          {catInfo.icon} {locale === "he" ? catInfo.he : catInfo.en}
        </span>
      </div>

      <p className="text-lg font-bold text-text-primary mb-1">
        {time} {locale === "he" ? "ב" : "in "}{cityName}
      </p>
      <p className="text-text-secondary text-sm mb-4">
        {shelterTime} {locale === "he" ? "שניות למצוא מקלט" : "seconds to find shelter"}
      </p>

      {alert.cities.length > 1 && (
        <p className="text-text-secondary text-xs mb-4">
          +{alert.cities.length - 1} {locale === "he" ? "ערים נוספות" : "more cities"}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-secondary font-mono">LIONFURY.LIVE</span>
        <button
          onClick={handleShare}
          className={`px-5 py-2.5 text-xs font-medium rounded-full transition-colors ${
            copied
              ? "bg-alert-safe/15 text-alert-safe"
              : "bg-text-primary/10 text-text-primary hover:bg-text-primary/20"
          }`}
        >
          {copied
            ? locale === "he" ? "הועתק!" : "Copied!"
            : t.common.share}
        </button>
      </div>
    </motion.div>
  );
}
