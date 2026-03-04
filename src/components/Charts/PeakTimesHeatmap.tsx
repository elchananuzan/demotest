"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert } from "@/lib/oref";

interface PeakTimesHeatmapProps {
  alerts: ProcessedAlert[];
}

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function PeakTimesHeatmap({ alerts }: PeakTimesHeatmapProps) {
  const { locale, t } = useApp();
  const days = locale === "he" ? DAYS_HE : DAYS_EN;
  const [tooltip, setTooltip] = useState<{ day: string; hour: number; count: number } | null>(null);

  const data = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    alerts.forEach((a) => {
      const d = new Date(a.timestamp);
      grid[d.getDay()][d.getHours()]++;
    });
    return grid;
  }, [alerts]);

  const maxVal = Math.max(...data.flat(), 1);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">{t.stats.peakTimes}</h3>

      {/* Mobile touch tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 px-3 py-1.5 bg-bg border border-border rounded-lg text-xs text-text-primary inline-block"
          >
            <span className="font-medium">{tooltip.day}</span>
            <span className="text-text-secondary mx-1">{tooltip.hour}:00</span>
            <span className="text-text-secondary mx-1">—</span>
            <span className="text-alert-red font-medium">{tooltip.count}</span> alerts
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <div className="min-w-[360px] sm:min-w-[500px]">
          {/* Hour labels */}
          <div className="flex gap-[2px] mb-1 ms-8">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 text-center text-[8px] text-text-secondary">
                {h % 3 === 0 ? `${h}` : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          {data.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-[2px] mb-[2px]">
              <span className="text-[10px] text-text-secondary w-8 text-end pe-2">
                {days[dayIdx]}
              </span>
              {row.map((val, hourIdx) => {
                const intensity = val / maxVal;
                const r = Math.round(255 * intensity);
                const g = Math.round(51 * intensity);
                const b = Math.round(51 * intensity);
                const isSelected = tooltip?.day === days[dayIdx] && tooltip?.hour === hourIdx;
                return (
                  <motion.div
                    key={hourIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (dayIdx * 24 + hourIdx) * 0.001 }}
                    className={`flex-1 h-4 rounded-[2px] cursor-pointer hover:ring-1 hover:ring-text-secondary ${
                      isSelected ? "ring-1 ring-text-primary" : ""
                    }`}
                    style={{
                      backgroundColor: val === 0 ? "#12121a" : `rgb(${r}, ${g}, ${b})`,
                    }}
                    title={`${days[dayIdx]} ${hourIdx}:00 — ${val} alerts`}
                    onClick={() =>
                      setTooltip(isSelected ? null : { day: days[dayIdx], hour: hourIdx, count: val })
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
