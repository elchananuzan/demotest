"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts } from "@/lib/hooks";
import {
  IconCalendar, IconCalendarWeek, IconAlert, IconStats,
  IconClock, IconTarget, IconShield, IconTrendUp, IconTrendDown,
} from "@/components/Icons";
import {
  avgAlertsPerDay, peakHourAnalysis, multiCityAttackPct,
  avgShelterTime, weekOverWeekTrend, predictNextAttackWindow,
  quietPeriodAnalysis,
} from "@/lib/stats";
import StatCard from "@/components/Charts/StatCard";
import CategoryChart from "@/components/Charts/CategoryChart";
import HourlyChart from "@/components/Charts/HourlyChart";
import TopCitiesChart from "@/components/Charts/TopCitiesChart";
import AlertHeatmap from "@/components/Charts/AlertHeatmap";
import PeakTimesHeatmap from "@/components/Charts/PeakTimesHeatmap";
import RegionChart from "@/components/Charts/RegionChart";
import CategoryTrendChart from "@/components/Charts/CategoryTrendChart";

export default function StatsPage() {
  const { t, locale } = useApp();
  const { alerts, alertsToday } = useAlerts();

  const stats = useMemo(() => {
    const avg7 = avgAlertsPerDay(alerts, 7);
    const avg30 = avgAlertsPerDay(alerts, 30);
    const trendValue = avg30 > 0 ? Math.round(((avg7 - avg30) / avg30) * 100) : 0;
    return {
      avg7,
      avg30,
      trendValue,
      trendDir: (avg7 > avg30 * 1.05 ? "up" : avg7 < avg30 * 0.95 ? "down" : "flat") as "up" | "down" | "flat",
      peak: peakHourAnalysis(alerts),
      multiCity: multiCityAttackPct(alerts),
      shelter: avgShelterTime(alerts),
      wow: weekOverWeekTrend(alerts),
      prediction: predictNextAttackWindow(alerts),
      quiet: quietPeriodAnalysis(alerts),
    };
  }, [alerts]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label={t.stats.today}
            value={alertsToday.length}
            icon={<IconCalendar size={20} />}
            delay={0}
          />
          <StatCard
            label={t.stats.totalAlerts}
            value={alerts.length}
            icon={<IconAlert size={20} />}
            delay={0.1}
          />
          <StatCard
            label={locale === "he" ? "ממוצע יומי (7 ימים)" : "Daily Avg (7d)"}
            value={Math.round(stats.avg7 * 10) / 10}
            icon={<IconCalendarWeek size={20} />}
            delay={0.2}
            trend={{ value: Math.abs(stats.trendValue), direction: stats.trendDir }}
          />
          <StatCard
            label={locale === "he" ? "שעת שיא" : "Peak Hour"}
            value={stats.peak.count}
            suffix={` (${stats.peak.label})`}
            icon={<IconClock size={20} />}
            delay={0.3}
          />
          <StatCard
            label={locale === "he" ? "מטחים (5+ ערים)" : "Barrages (5+ cities)"}
            value={Math.round(stats.multiCity)}
            suffix="%"
            icon={<IconTarget size={20} />}
            delay={0.4}
            color="#ff6600"
          />
          <StatCard
            label={locale === "he" ? "זמן מיגון ממוצע" : "Avg Shelter Time"}
            value={Math.round(stats.shelter)}
            suffix="s"
            icon={<IconShield size={20} />}
            delay={0.5}
          />
        </div>

        {/* Week-over-week trend + Predicted next attack */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-sm text-text-secondary">
              {locale === "he" ? "מגמה שבועית" : "Week-over-Week"}
            </span>
            <div
              className={`flex items-center gap-1 text-sm font-bold ${
                stats.wow.direction === "up"
                  ? "text-alert-red"
                  : stats.wow.direction === "down"
                    ? "text-alert-safe"
                    : "text-text-secondary"
              }`}
            >
              {stats.wow.direction === "up" && <IconTrendUp size={16} />}
              {stats.wow.direction === "down" && <IconTrendDown size={16} />}
              {stats.wow.direction === "up" ? "+" : stats.wow.direction === "down" ? "-" : ""}
              {stats.wow.pctChange}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-bg-card border border-alert-red/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-secondary">
                {locale === "he" ? "חלון תקיפה צפוי הבא" : "Predicted Next Attack Window"}
              </span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wider">
                {stats.prediction.confidence}% {locale === "he" ? "ביטחון" : "confidence"}
              </span>
            </div>
            <p className="font-mono text-lg font-bold text-alert-red">
              {locale === "he" ? stats.prediction.label_he : stats.prediction.label}
            </p>
          </motion.div>
        </div>

        {/* Time since last alert */}
        {stats.quiet.currentGapHours > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="bg-bg-card border border-border rounded-2xl p-4 mb-8 flex items-center justify-between"
          >
            <span className="text-sm text-text-secondary">
              {locale === "he" ? "זמן מאז התרעה אחרונה" : "Time Since Last Alert"}
            </span>
            <div className="text-end">
              <span className="font-mono text-lg font-bold text-text-primary">
                {stats.quiet.currentGapHours < 1
                  ? `${Math.round(stats.quiet.currentGapHours * 60)}m`
                  : `${stats.quiet.currentGapHours.toFixed(1)}h`}
              </span>
              {stats.quiet.avgGapHours > 0 && (
                <span className="text-xs text-text-secondary ms-2">
                  ({locale === "he" ? "ממוצע" : "avg"}: {stats.quiet.avgGapHours.toFixed(1)}h)
                </span>
              )}
            </div>
          </motion.div>
        )}

        {alerts.length === 0 ? (
          <div className="text-center py-20">
            <IconStats size={48} className="mx-auto mb-4 text-text-secondary" />
            <p className="text-text-secondary text-lg">
              {locale === "he" ? "אין נתונים לניתוח" : "No data to analyze"}
            </p>
            <p className="text-text-secondary text-sm mt-2">
              {locale === "he" ? "נתונים יופיעו כאשר יתקבלו התרעות" : "Data will appear when alerts are received"}
            </p>
          </div>
        ) : (
          <>
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

            {/* Category trend line chart */}
            <h2 className="text-lg font-semibold text-text-primary mb-4">{locale === "he" ? "מגמות" : "Trends"}</h2>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mb-6">
              <CategoryTrendChart alerts={alerts} />
            </motion.div>

            {/* Full width heatmaps */}
            <h2 className="text-lg font-semibold text-text-primary mb-4">{locale === "he" ? "מפות חום" : "Heatmaps"}</h2>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
              <AlertHeatmap alerts={alerts} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <PeakTimesHeatmap alerts={alerts} />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
