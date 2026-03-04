"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "@/lib/context";
import { type ProcessedAlert, getCategoryInfo } from "@/lib/oref";

interface CategoryChartProps {
  alerts: ProcessedAlert[];
}

export default function CategoryChart({ alerts }: CategoryChartProps) {
  const { locale, t } = useApp();

  const data = useMemo(() => {
    const counts: Record<number, number> = {};
    alerts.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([cat, count]) => {
        const catNum = parseInt(cat);
        const info = getCategoryInfo(catNum);
        return {
          name: locale === "he" ? info.he : info.en,
          value: count,
          color: info.color,
          icon: info.icon,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [alerts, locale]);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">{t.stats.byCategory}</h3>

      <div className="flex items-center gap-6">
        <div className="w-40 h-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: "12px",
                  color: "#e8e8e8",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-text-secondary flex-1 truncate">{item.icon} {item.name}</span>
              <span className="font-mono text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
