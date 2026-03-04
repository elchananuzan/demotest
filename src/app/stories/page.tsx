"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts, useAnimatedNumber } from "@/lib/hooks";
import { WHERE_WERE_YOU_OPTIONS } from "@/lib/oref";
import WhereWereYouResults from "@/components/WhereWereYou/WhereWereYouResults";
import ShareCard from "@/components/ShareCard/ShareCard";
import { cities } from "@/lib/cities";
import { ACTIVITY_ICONS, IconMoon, IconSun } from "@/components/Icons";

// Generate demo "where were you" data
function generateDemoStats() {
  const stats: Record<string, number> = {};
  let total = 0;
  WHERE_WERE_YOU_OPTIONS.forEach((opt) => {
    const count = Math.floor(Math.random() * 3000) + 100;
    stats[opt.key] = count;
    total += count;
  });
  return { stats, total };
}

export default function StoriesPage() {
  const { locale, t } = useApp();
  const { alerts } = useAlerts();
  const [visibleCount, setVisibleCount] = useState(10);

  const demoData = useMemo(() => generateDemoStats(), []);
  const animatedTotal = useAnimatedNumber(demoData.total);

  // Find the most impactful alert (night-time, many cities)
  const heroAlert = useMemo(() => {
    const nightAlerts = alerts.filter((a) => {
      const hour = new Date(a.timestamp).getHours();
      return hour >= 22 || hour <= 6;
    });
    return nightAlerts[0] || alerts[0];
  }, [alerts]);

  const heroTime = heroAlert
    ? new Date(heroAlert.timestamp).toLocaleTimeString(locale === "he" ? "he-IL" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "3:47 AM";

  // Top activity
  const topActivity = WHERE_WERE_YOU_OPTIONS.reduce((max, opt) => {
    return (demoData.stats[opt.key] || 0) > (demoData.stats[max.key] || 0) ? opt : max;
  }, WHERE_WERE_YOU_OPTIONS[0]);

  return (
    <div className="min-h-screen bg-bg pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-3">
            {t.stories.title}
          </h1>
          <p className="text-text-secondary text-lg">{t.stories.subtitle}</p>
        </motion.div>

        {/* Hero cinematic card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-gradient-to-b from-alert-red/10 to-bg-card border border-alert-red/20 rounded-3xl p-8 sm:p-12 mb-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,51,51,0.1),transparent_70%)]" />

          <div className="relative text-center">
            <p className="text-alert-red/80 text-sm uppercase tracking-widest mb-4">
              {t.stories.lastNight.replace("{time}", heroTime)}
            </p>

            <h2 className="text-3xl sm:text-5xl font-bold text-text-primary mb-4">
              {t.stories.sirensWoke.replace("{count}", animatedTotal.toLocaleString())}
            </h2>

            {/* Sleeping figures animation */}
            <div className="flex items-center justify-center gap-1.5 my-8">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{
                    delay: i * 0.1,
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-xl text-alert-red"
                >
                  {(() => { const Icon = ACTIVITY_ICONS[topActivity.key]; return Icon ? <Icon size={20} /> : null; })()}
                </motion.div>
              ))}
            </div>

            <p className="text-2xl font-bold text-text-primary">
              <span className="font-mono text-alert-red">{demoData.stats[topActivity.key]?.toLocaleString()}</span>{" "}
              {t.stories.heroStat}
            </p>
          </div>
        </motion.div>

        {/* Aggregated results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <WhereWereYouResults
            stats={demoData.stats}
            total={demoData.total}
            alertTime={heroTime}
          />
        </motion.div>

        {/* Timeline of alerts with human context */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary mb-4">
            {locale === "he" ? "ציר זמן עם הקשר אנושי" : "Timeline with Human Context"}
          </h3>

          {alerts.slice(0, visibleCount).map((alert, i) => {
            const time = new Date(alert.timestamp).toLocaleTimeString(
              locale === "he" ? "he-IL" : "en-US",
              { hour: "2-digit", minute: "2-digit" }
            );
            const hour = new Date(alert.timestamp).getHours();
            const isNight = hour >= 22 || hour <= 6;
            const context = isNight
              ? locale === "he"
                ? "רוב האנשים ישנו"
                : "Most people were sleeping"
              : hour >= 7 && hour <= 9
              ? locale === "he"
                ? "שעת בוקר — ילדים בדרך לבית ספר"
                : "Morning rush — kids heading to school"
              : locale === "he"
              ? "אנשים בעבודה ובשגרה"
              : "People at work and daily routines";

            const cityName = locale === "he"
              ? alert.cities[0]
              : cities[alert.cities[0]]?.name_en || alert.cities[0];

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex gap-4"
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-alert-red/60 shrink-0 mt-1.5" />
                  {i < visibleCount - 1 && <div className="w-px flex-1 bg-border" />}
                </div>

                {/* Card */}
                <div className="flex-1 pb-6">
                  <div className="bg-bg-card border border-border rounded-xl p-4 hover:border-alert-red/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-mono text-sm text-alert-red">{time}</span>
                        <span className="text-text-secondary text-sm mx-2">•</span>
                        <span className="text-sm text-text-primary font-medium">{cityName}</span>
                        {alert.cities.length > 1 && (
                          <span className="text-text-secondary text-xs ms-1">
                            +{alert.cities.length - 1}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm italic flex items-center gap-1.5">
                      {isNight ? <IconMoon size={14} /> : <IconSun size={14} />} {context}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {visibleCount < alerts.length && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount((c) => c + 10)}
                className="px-6 py-2.5 text-xs font-medium bg-bg-card border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-alert-red/20 transition-all"
              >
                {locale === "he" ? `טען עוד (${alerts.length - visibleCount} נותרו)` : `Load more (${alerts.length - visibleCount} remaining)`}
              </button>
            </div>
          )}
        </div>

        {/* Share section */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-text-primary mb-4">{t.stories.shareCard}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {alerts.slice(0, 2).map((alert) => (
              <ShareCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
