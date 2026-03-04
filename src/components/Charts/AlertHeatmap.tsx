"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert } from "@/lib/oref";

interface AlertHeatmapProps {
  alerts: ProcessedAlert[];
}

export default function AlertHeatmap({ alerts }: AlertHeatmapProps) {
  const { t } = useApp();

  const heatmapData = useMemo(() => {
    // Generate 365 days of data
    const days: { date: string; count: number; level: number }[] = [];
    const alertsByDate: Record<string, number> = {};

    alerts.forEach((alert) => {
      const date = new Date(alert.timestamp).toISOString().split("T")[0];
      alertsByDate[date] = (alertsByDate[date] || 0) + 1;
    });

    const now = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = alertsByDate[dateStr] || 0;
      const level = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
      days.push({ date: dateStr, count, level });
    }

    return days;
  }, [alerts]);

  const colors = ["#12121a", "#3d1111", "#7a1a1a", "#b52222", "#ff3333"];
  const weeks = Math.ceil(heatmapData.length / 7);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">{t.stats.heatmap}</h3>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ minWidth: `${weeks * 15}px` }}>
          {Array.from({ length: weeks }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const dataIdx = weekIdx * 7 + dayIdx;
                const day = heatmapData[dataIdx];
                if (!day) return <div key={dayIdx} className="w-[11px] h-[11px]" />;

                return (
                  <motion.div
                    key={dayIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: weekIdx * 0.005 }}
                    className="w-[11px] h-[11px] rounded-[2px] cursor-pointer hover:ring-1 hover:ring-text-secondary transition-all"
                    style={{ backgroundColor: colors[day.level] }}
                    title={`${day.date}: ${day.count} alerts`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-text-secondary">
        <span>Less</span>
        {colors.map((color, i) => (
          <div key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
