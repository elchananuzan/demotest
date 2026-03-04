"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "@/lib/context";
import { type ProcessedAlert } from "@/lib/oref";

interface HourlyChartProps {
  alerts: ProcessedAlert[];
}

export default function HourlyChart({ alerts }: HourlyChartProps) {
  const { t } = useApp();

  const data = useMemo(() => {
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      count: 0,
    }));

    const now = Date.now();
    alerts
      .filter((a) => now - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000)
      .forEach((a) => {
        const hour = new Date(a.timestamp).getHours();
        hourCounts[hour].count++;
      });

    return hourCounts;
  }, [alerts]);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">{t.stats.hourly}</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="hour"
              stroke="#888899"
              fontSize={10}
              tickLine={false}
              interval={2}
            />
            <YAxis stroke="#888899" fontSize={10} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{
                background: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: "12px",
                color: "#e8e8e8",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" fill="#ff3333" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
