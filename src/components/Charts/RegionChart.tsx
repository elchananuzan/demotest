"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert } from "@/lib/oref";
import { cities } from "@/lib/cities";

interface RegionChartProps {
  alerts: ProcessedAlert[];
}

const REGIONS = [
  { key: "north", color: "#ff6600" },
  { key: "center", color: "#ff3333" },
  { key: "south", color: "#ff0066" },
  { key: "jerusalem", color: "#cc33ff" },
] as const;

export default function RegionChart({ alerts }: RegionChartProps) {
  const { t } = useApp();

  const data = useMemo(() => {
    const regionCounts: Record<string, number> = {
      north: 0,
      center: 0,
      south: 0,
      jerusalem: 0,
    };

    alerts.forEach((a) => {
      a.cities.forEach((cityName) => {
        const city = cities[cityName];
        if (city) {
          regionCounts[city.region] = (regionCounts[city.region] || 0) + 1;
        }
      });
    });

    const total = Object.values(regionCounts).reduce((s, v) => s + v, 0) || 1;

    return REGIONS.map((r) => ({
      ...r,
      count: regionCounts[r.key],
      percentage: (regionCounts[r.key] / total) * 100,
      label: t.stats[r.key as keyof typeof t.stats] as string,
    }));
  }, [alerts, t]);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">{t.stats.byRegion}</h3>

      <div className="space-y-3">
        {data.map((region, i) => (
          <div key={region.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-primary">{region.label}</span>
              <span className="font-mono text-text-secondary">
                {region.count} ({Math.round(region.percentage)}%)
              </span>
            </div>
            <div className="h-3 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${region.percentage}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: region.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
