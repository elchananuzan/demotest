"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { type ProcessedAlert } from "@/lib/oref";
import { cities } from "@/lib/cities";
import { baseCityName } from "@/lib/stats";

interface TopCitiesChartProps {
  alerts: ProcessedAlert[];
}

export default function TopCitiesChart({ alerts }: TopCitiesChartProps) {
  const { locale, t } = useApp();

  const data = useMemo(() => {
    const cityCounts: Record<string, number> = {};
    alerts.forEach((a) => {
      a.cities.forEach((city) => {
        const base = baseCityName(city);
        cityCounts[base] = (cityCounts[base] || 0) + 1;
      });
    });

    return Object.entries(cityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({
        name_he: city,
        name_en: cities[city]?.name_en || city,
        count,
      }));
  }, [alerts]);

  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">{t.stats.topCities}</h3>

      <div className="space-y-2.5">
        {data.map((city, i) => (
          <div key={city.name_he} className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-secondary w-5 text-end">{i + 1}</span>
            <span className="text-sm text-text-primary w-20 sm:w-28 truncate">
              {locale === "he" ? city.name_he : city.name_en}
            </span>
            <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(city.count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className="h-full bg-gradient-to-r from-alert-red to-alert-warning rounded-full"
              />
            </div>
            <span className="font-mono text-xs text-text-secondary w-10 text-end">{city.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
