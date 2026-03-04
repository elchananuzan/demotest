"use client";

import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/lib/hooks";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
  color?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  suffix = "",
  icon,
  color = "#ff3333",
  delay = 0,
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
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <p className="text-text-secondary text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono text-3xl font-bold text-text-primary">
        {animatedValue.toLocaleString()}
        {suffix && <span className="text-lg text-text-secondary ml-1">{suffix}</span>}
      </p>
    </motion.div>
  );
}
