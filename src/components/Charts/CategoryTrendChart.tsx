"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useApp } from "@/lib/context";
import { type ProcessedAlert } from "@/lib/oref";
import { categoryTrendData } from "@/lib/stats";

interface CategoryTrendChartProps {
  alerts: ProcessedAlert[];
}

export default function CategoryTrendChart({ alerts }: CategoryTrendChartProps) {
  const { locale } = useApp();
  const data = useMemo(() => categoryTrendData(alerts, 14), [alerts]);

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h3 className="text-sm font-medium text-text-primary mb-4">
        {locale === "he" ? "מגמת קטגוריות (14 יום)" : "Category Trend (14 days)"}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#9999aa", fontSize: 10 }}
              tickFormatter={(v) => v.slice(5)}
              stroke="#1e1e2e"
            />
            <YAxis tick={{ fill: "#9999aa", fontSize: 10 }} stroke="#1e1e2e" width={30} />
            <Tooltip
              contentStyle={{
                background: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: "12px",
                color: "#e8e8e8",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#9999aa" }}
            />
            <Line
              type="monotone"
              dataKey="rockets"
              stroke="#ff3333"
              strokeWidth={2}
              dot={false}
              name={locale === "he" ? "רקטות" : "Rockets"}
            />
            <Line
              type="monotone"
              dataKey="drones"
              stroke="#ff6600"
              strokeWidth={2}
              dot={false}
              name={locale === "he" ? "כטב\"מ" : "UAV/Drones"}
            />
            <Line
              type="monotone"
              dataKey="ballistic"
              stroke="#ff0000"
              strokeWidth={2}
              dot={false}
              name={locale === "he" ? "בליסטי" : "Ballistic"}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
