"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts, useAnimatedNumber } from "@/lib/hooks";
import AlertMap from "@/components/Map/AlertMap";
import AlertTicker from "@/components/AlertTicker/AlertTicker";
import WhereWereYouModal from "@/components/WhereWereYou/WhereWereYouModal";
import StatCard from "@/components/Charts/StatCard";

export default function LivePage() {
  const { locale, t } = useApp();
  const { alerts, activeAlerts, alerts24h, alertsToday, threatLevel, isLoading } = useAlerts();
  const [showWhereWereYou, setShowWhereWereYou] = useState(false);
  const alertCount24h = useAnimatedNumber(alerts24h.length);

  // Trigger "Where Were You" modal 15 minutes after an active alert (simulated for demo)
  useEffect(() => {
    if (activeAlerts.length > 0) {
      const timer = setTimeout(() => {
        setShowWhereWereYou(true);
      }, 15 * 60 * 1000); // 15 minutes
      return () => clearTimeout(timer);
    }
  }, [activeAlerts]);

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Alert Ticker */}
      <AlertTicker alerts={alerts} />

      {/* Full screen active alert overlay */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-alert-red/10 pointer-events-none"
          >
            <div className="absolute inset-0 border-[3px] border-alert-red/40 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <div className="fixed top-[5.5rem] left-0 right-0 z-30 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Threat level badge */}
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-xl"
            style={{
              borderColor: `${threatLevel.color}30`,
              backgroundColor: `${threatLevel.color}10`,
            }}
            animate={{ scale: activeAlerts.length > 0 ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: activeAlerts.length > 0 ? Infinity : 0, duration: 1 }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: threatLevel.color }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: threatLevel.color }}>
              {t.live.threatLevel}: {locale === "he" ? threatLevel.label_he : threatLevel.label_en}
            </span>
          </motion.div>

          {/* Alert counter */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span className="font-mono text-text-primary font-bold">{alertsToday.length}</span>
              <span>{t.live.alertsToday}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span className="font-mono text-text-primary font-bold">{alertCount24h}</span>
              <span>{t.live.alerts24h}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="pt-8">
        <AlertMap alerts={alerts} activeAlerts={activeAlerts} />
      </div>

      {/* Bottom stat cards */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-bg via-bg/90 to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 pointer-events-auto">
          <StatCard
            label={t.live.alertsToday}
            value={alertsToday.length}
            icon="🚨"
            delay={0}
          />
          <StatCard
            label={t.live.alerts24h}
            value={alerts24h.length}
            icon="📊"
            delay={0.1}
          />
          <StatCard
            label={locale === "he" ? "ערים מותקפות" : "Cities Targeted"}
            value={new Set(alerts24h.flatMap((a) => a.cities)).size}
            icon="🏙️"
            delay={0.2}
          />
          <StatCard
            label={locale === "he" ? "רקטות" : "Rockets"}
            value={alerts24h.filter((a) => a.category === 1).length}
            icon="🚀"
            color="#ff6600"
            delay={0.3}
          />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">🦁</div>
            <p className="text-text-secondary text-sm animate-pulse">{t.common.loading}</p>
          </div>
        </div>
      )}

      {/* Where Were You modal */}
      <WhereWereYouModal
        alertId={activeAlerts[0]?.id || "demo"}
        isOpen={showWhereWereYou}
        onClose={() => setShowWhereWereYou(false)}
      />
    </div>
  );
}
