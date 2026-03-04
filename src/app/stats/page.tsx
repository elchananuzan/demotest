"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts } from "@/lib/hooks";
import StatCard from "@/components/Charts/StatCard";
import CategoryChart from "@/components/Charts/CategoryChart";
import HourlyChart from "@/components/Charts/HourlyChart";
import TopCitiesChart from "@/components/Charts/TopCitiesChart";
import AlertHeatmap from "@/components/Charts/AlertHeatmap";
import PeakTimesHeatmap from "@/components/Charts/PeakTimesHeatmap";
import RegionChart from "@/components/Charts/RegionChart";

export default function StatsPage() {
  const { t, locale } = useApp();
  const { alerts, alertsToday, alerts24h } = useAlerts();

  // Since Oct 7 estimate
  const sinceOct7 = alerts.length * 15; // Rough multiplier for demo

  return (
    <div className="min-h-screen bg-bg pt-8 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-2">{t.stats.title}</h1>
          <p className="text-text-secondary">{t.stats.subtitle}</p>
        </motion.div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label={t.stats.today} value={alertsToday.length} icon="📅" delay={0} />
          <StatCard label={t.stats.thisWeek} value={alerts24h.length * 3} icon="📆" delay={0.1} />
          <StatCard label={t.stats.totalAlerts} value={alerts.length} icon="🚨" delay={0.2} />
          <StatCard label={t.stats.sinceOct7} value={sinceOct7} icon="📊" color="#ff6600" delay={0.3} />
        </div>

        {/* Charts grid */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">{locale === "he" ? "ניתוח" : "Analysis"}</h2>
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <CategoryChart alerts={alerts} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <RegionChart alerts={alerts} />
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <TopCitiesChart alerts={alerts} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <HourlyChart alerts={alerts} />
          </motion.div>
        </div>

        {/* Full width charts */}
        <h2 className="text-lg font-semibold text-text-primary mb-4">{locale === "he" ? "מפות חום" : "Heatmaps"}</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
          <AlertHeatmap alerts={alerts} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <PeakTimesHeatmap alerts={alerts} />
        </motion.div>
      </div>
    </div>
  );
}
