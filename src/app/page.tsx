"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts, useAnimatedNumber } from "@/lib/hooks";
import AlertMap from "@/components/Map/AlertMap";
import AlertTicker from "@/components/AlertTicker/AlertTicker";
import WhereWereYouModal from "@/components/WhereWereYou/WhereWereYouModal";
import StatCard from "@/components/Charts/StatCard";
import { ShieldLogo, IconAlert, IconStats, IconCity, IconRocket, IconLab } from "@/components/Icons";
import SirenSound from "@/components/SirenSound";
import CityRiskCard from "@/components/CityRiskCard";

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
      {/* Siren sound — plays on active alerts and push notifications */}
      <SirenSound active={activeAlerts.length > 0} activeAlerts={activeAlerts} />

      {/* Alert Ticker */}
      <AlertTicker alerts={alerts} />

      {/* Full screen active alert overlay */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-alert-red/10 pointer-events-none"
          >
            <div className="absolute inset-0 border-[3px] border-alert-red/40 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <div className="fixed top-[5.5rem] left-0 right-0 z-[35] px-4 pointer-events-none">
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

      {/* City risk card — floating panel */}
      <div className="fixed bottom-44 sm:bottom-36 left-3 sm:left-4 z-[26] w-72 sm:w-80 pointer-events-auto">
        <CityRiskCard alerts={alerts} />
      </div>

      {/* Bottom stat cards */}
      <div className="fixed bottom-0 left-0 right-0 z-[25] p-3 sm:p-4 bg-gradient-to-t from-bg via-bg/90 to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pointer-events-auto">
          <StatCard
            label={t.live.alertsToday}
            value={alertsToday.length}
            icon={<IconAlert size={18} />}
            delay={0}
          />
          <StatCard
            label={t.live.alerts24h}
            value={alerts24h.length}
            icon={<IconStats size={18} />}
            delay={0.1}
          />
          <div className="hidden sm:block">
            <StatCard
              label={locale === "he" ? "ערים מותקפות" : "Cities Targeted"}
              value={new Set(alerts24h.flatMap((a) => a.cities)).size}
              icon={<IconCity size={18} />}
              delay={0.2}
            />
          </div>
          <div className="hidden sm:block">
            <StatCard
              label={locale === "he" ? "רקטות" : "Rockets"}
              value={alerts24h.filter((a) => a.category === 1).length}
              icon={<IconRocket size={18} />}
              color="#ff6600"
              delay={0.3}
            />
          </div>
        </div>
      </div>

      {/* Demo: trigger Where Were You */}
      <button
        onClick={() => setShowWhereWereYou(true)}
        className="fixed bottom-36 sm:bottom-28 right-4 z-40 px-4 py-3 text-xs font-medium bg-bg-card/80 backdrop-blur border border-border rounded-xl text-text-secondary hover:text-alert-red hover:border-alert-red/30 transition-all"
      >
        <IconLab size={14} className="inline-block me-1" />
        {locale === "he" ? "הדגמה: איפה היית?" : "Demo: Where Were You?"}
      </button>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
          <div className="text-center">
            <div className="mb-4 animate-pulse flex justify-center"><ShieldLogo size={48} className="text-alert-red" /></div>
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
