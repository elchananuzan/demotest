"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/lib/hooks";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  delay?: number;
  trend?: { value: number; direction: "up" | "down" | "flat" };
}

export default function StatCard({
  label,
  value,
  suffix = "",
  icon,
  color = "#ff3333",
  delay = 0,
  trend,
}: StatCardProps) {
  const animatedValue = useAnimatedNumber(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-bg-card border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-alert-red/20 transition-all"
    >
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: color }}
      />
      {icon && <div className="mb-2 text-text-secondary">{icon}</div>}
      <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono text-3xl font-bold text-text-primary">
        {animatedValue.toLocaleString()}
        {suffix && <span className="text-lg text-text-secondary ms-1">{suffix}</span>}
      </p>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            trend.direction === "up"
              ? "text-alert-red"
              : trend.direction === "down"
                ? "text-alert-safe"
                : "text-text-secondary"
          }`}
        >
          {trend.direction === "up" && <TrendingUp size={12} />}
          {trend.direction === "down" && <TrendingDown size={12} />}
          <span>
            {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
            {trend.value}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
