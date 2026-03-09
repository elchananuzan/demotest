"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts, useMyCity, useAnimatedNumber, useAlertSettings } from "@/lib/hooks";
import { INFORMATIONAL_CATEGORIES } from "@/lib/oref";
import { ShieldLogo, IconAlert, IconStats, IconClock } from "@/components/Icons";
import { Shield, Search, Clock, Target, AlertTriangle, TrendingUp, TrendingDown, MapPin, BarChart3, X, Calendar, Settings } from "lucide-react";
import SirenSound from "@/components/SirenSound";
import AlertSettingsPanel from "@/components/AlertSettingsPanel";
import StatCard from "@/components/Charts/StatCard";
import CategoryChart from "@/components/Charts/CategoryChart";
import HourlyChart from "@/components/Charts/HourlyChart";
import TopCitiesChart from "@/components/Charts/TopCitiesChart";
import AlertHeatmap from "@/components/Charts/AlertHeatmap";
import RegionChart from "@/components/Charts/RegionChart";
import {
  avgAlertsPerDay, peakHourAnalysis, multiCityAttackPct,
  weekOverWeekTrend, predictNextAttackWindow, quietPeriodAnalysis,
  cityRiskProfile, allCityNames, alertsForCity, uniqueCitiesHit,
} from "@/lib/stats";

const WAR_START = new Date("2026-02-28T00:00:00+03:00");

const RISK_COLORS = {
  low: "#22c55e",
  moderate: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const RISK_LABELS = {
  low: { en: "Low Risk", he: "סיכון נמוך" },
  moderate: { en: "Moderate Risk", he: "סיכון בינוני" },
  high: { en: "High Risk", he: "סיכון גבוה" },
  critical: { en: "Critical Risk", he: "סיכון קריטי" },
};

export default function DashboardPage() {
  const { locale } = useApp();
  const { alerts: rawAlerts, activeAlerts, activeInfoAlerts, threatLevel, isLoading } = useAlerts();
  const { city, setCity } = useMyCity();
  const { settings: alertSettings, setSettings: setAlertSettings } = useAlertSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const isHe = locale === "he";

  // Date range filter — from first day of data collection onward
  const [fromDate, setFromDate] = useState("2026-03-08");
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Filter alerts by date range and exclude informational categories (event ended, alerts expected)
  const alerts = useMemo(() => {
    const from = new Date(fromDate + "T00:00:00").getTime();
    const to = new Date(toDate + "T23:59:59").getTime();
    return rawAlerts.filter((a) => {
      if (INFORMATIONAL_CATEGORIES.has(a.category)) return false;
      // Also catch by title keywords (Oref sometimes keeps original cat number)
      const title = (a.title || "").toLowerCase();
      if (title.includes("הסתיים") || title.includes("הוסר") || title.includes("בדקות הקרובות") || title.includes("צפויות")) return false;
      const t = new Date(a.timestamp).getTime();
      return t >= from && t <= to;
    });
  }, [rawAlerts, fromDate, toDate]);

  const daysSinceWar = Math.floor((Date.now() - WAR_START.getTime()) / (24 * 3600000));

  const cityNames = useMemo(() => allCityNames(alerts), [alerts]);

  // City-filtered alerts — when a city is selected, everything uses this
  const cityAlerts = useMemo(
    () => city ? alertsForCity(alerts, city) : [],
    [alerts, city]
  );
  const displayAlerts = city ? cityAlerts : alerts;

  const totalAlerts = useAnimatedNumber(displayAlerts.length);
  const uniqueCities = useMemo(() => uniqueCitiesHit(displayAlerts), [displayAlerts]);

  // Stats adapt to selected city
  const overallStats = useMemo(() => ({
    avg7: avgAlertsPerDay(displayAlerts, 7),
    peak: peakHourAnalysis(displayAlerts),
    multiCity: multiCityAttackPct(displayAlerts),
    wow: weekOverWeekTrend(displayAlerts),
    prediction: predictNextAttackWindow(displayAlerts),
    quiet: quietPeriodAnalysis(displayAlerts),
  }), [displayAlerts]);

  // City-specific profile (for risk card)
  const cityProfile = useMemo(
    () => city ? cityRiskProfile(alerts, city) : null,
    [alerts, city]
  );

  // Filter active alerts by selected zones when zone filter is enabled
  const filteredActiveAlerts = useMemo(() => {
    const zones = alertSettings.alertZones;
    if (!alertSettings.cityFilterEnabled || zones.length === 0) return activeAlerts;
    return activeAlerts.filter((a) => a.cities.some((c) => zones.some((z) => c.includes(z) || z.includes(c))));
  }, [activeAlerts, alertSettings.cityFilterEnabled, alertSettings.alertZones]);

  const filteredInfoAlerts = useMemo(() => {
    const zones = alertSettings.alertZones;
    if (!alertSettings.cityFilterEnabled || zones.length === 0) return activeInfoAlerts;
    return activeInfoAlerts.filter((a) => a.cities.some((c) => zones.some((z) => c.includes(z) || z.includes(c))));
  }, [activeInfoAlerts, alertSettings.cityFilterEnabled, alertSettings.alertZones]);

  // Banner keys for dismiss tracking — changes when alert set changes
  const threatBannerKey = useMemo(() => filteredActiveAlerts.map((a) => a.id).sort().join(","), [filteredActiveAlerts]);
  const infoBannerKey = useMemo(() => filteredInfoAlerts.map((a) => a.id).sort().join(","), [filteredInfoAlerts]);

  // Reset dismiss when new alerts arrive
  useEffect(() => {
    if (threatBannerKey) setDismissedBanners((prev) => { const next = new Set(prev); next.delete("threat"); return next; });
  }, [threatBannerKey]);
  useEffect(() => {
    if (infoBannerKey) setDismissedBanners((prev) => { const next = new Set(prev); next.delete("info"); return next; });
  }, [infoBannerKey]);

  const showThreatBanner = filteredActiveAlerts.length > 0 && !dismissedBanners.has("threat");
  const showInfoBanner = filteredInfoAlerts.length > 0 && !dismissedBanners.has("info");

  return (
    <div className="min-h-screen bg-bg pt-16 pb-8">
      <SirenSound active={showThreatBanner} activeAlerts={filteredActiveAlerts} settings={alertSettings} />

      {/* Active alert overlay + live banner */}
      <AnimatePresence>
        {showThreatBanner && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-alert-red/10 pointer-events-none"
            >
              <div className="absolute inset-0 border-[3px] border-alert-red/40 animate-pulse" />
            </motion.div>

            {/* Live threat banner with cities */}
            <motion.div
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              className="fixed top-14 left-0 right-0 z-40 bg-alert-red text-white shadow-lg"
            >
              <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {isHe ? "התרעה פעילה" : "LIVE ALERT"}
                  </span>
                  <span className="text-xs opacity-80">
                    — {filteredActiveAlerts[0].title || filteredActiveAlerts[0].category_name}
                  </span>
                  <button
                    onClick={() => setDismissedBanners((prev) => new Set(prev).add("threat"))}
                    className="ms-auto p-1 rounded-md hover:bg-white/20 transition-colors"
                    title={isHe ? "סגור" : "Dismiss"}
                  >
                    <X size={14} />
                  </button>
                </div>
                {(() => {
                  const allCities = Array.from(new Set(filteredActiveAlerts.flatMap((a) => a.cities)));
                  return (
                    <>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {allCities.slice(0, 30).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      {allCities.length > 30 && (
                        <span className="text-xs opacity-70 mt-1">
                          {isHe ? `ועוד ${allCities.length - 30} יישובים` : `+${allCities.length - 30} more locations`}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Informational live banners — one compact banner per type (ended / expected) */}
      <AnimatePresence>
        {showInfoBanner && (() => {
          const ended = filteredInfoAlerts.filter((a) => a.category === 13 || (a.title || "").includes("הסתיים") || (a.title || "").includes("הוסר"));
          const expected = filteredInfoAlerts.filter((a) => !ended.includes(a));
          const groups = [
            { key: "ended", alerts: ended, isEnded: true },
            { key: "expected", alerts: expected, isEnded: false },
          ].filter((g) => g.alerts.length > 0);

          let offsetIdx = 0;
          return groups.map((group) => {
            const allCities = Array.from(new Set(group.alerts.flatMap((a) => a.cities)));
            const idx = offsetIdx++;
            return (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className={`fixed left-0 right-0 z-30 shadow-lg ${
                  group.isEnded ? "bg-green-600 text-white" : "bg-amber-500 text-black"
                }`}
                style={{ top: `calc(3.5rem + ${(showThreatBanner ? 72 : 0) + idx * 36}px)` }}
              >
                <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${group.isEnded ? "bg-white" : "bg-black/30"}`} />
                  <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                    {group.isEnded
                      ? (isHe ? "האירוע הסתיים" : "EVENT ENDED")
                      : (isHe ? "צפויות התרעות" : "ALERTS EXPECTED")}
                  </span>
                  <span className={`text-xs ${group.isEnded ? "opacity-80" : "opacity-70"}`}>
                    — {allCities.length} {isHe ? "יישובים" : "locations"}
                  </span>
                  <button
                    onClick={() => setDismissedBanners((prev) => new Set(prev).add("info"))}
                    className={`ms-auto p-1 rounded-md transition-colors ${
                      group.isEnded ? "hover:bg-white/20" : "hover:bg-black/10"
                    }`}
                    title={isHe ? "סגור" : "Dismiss"}
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            );
          });
        })()}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4">
        {/* War header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{
                borderColor: `${threatLevel.color}30`,
                backgroundColor: `${threatLevel.color}10`,
              }}
              animate={{ scale: activeAlerts.length > 0 ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: activeAlerts.length > 0 ? Infinity : 0, duration: 1 }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: threatLevel.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: threatLevel.color }}>
                {isHe ? "רמת איום" : "THREAT"}: {isHe ? threatLevel.label_he : threatLevel.label_en}
              </span>
            </motion.div>
            <span className="text-xs text-text-secondary">
              {isHe ? `יום ${daysSinceWar} למלחמה` : `Day ${daysSinceWar} of war`}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-1">
            {isHe ? "סטטיסטיקות מלחמה" : "War Statistics"}
          </h1>
          <p className="text-text-secondary text-sm">
            {isHe ? "נתוני התרעות בזמן אמת מפיקוד העורף" : "Real-time alert data from Pikud HaOref"}
          </p>
        </motion.div>

        {/* Date range filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-bg-card border border-border rounded-xl"
        >
          <Calendar size={16} className="text-text-secondary" />
          <span className="text-xs text-text-secondary">{isHe ? "טווח תאריכים:" : "Date range:"}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={toDate}
            className="px-2 py-1 text-xs bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:border-alert-red/50"
          />
          <span className="text-xs text-text-secondary">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate}
            max={new Date().toISOString().split("T")[0]}
            className="px-2 py-1 text-xs bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:border-alert-red/50"
          />
          <span className="text-[10px] text-text-secondary/60">
            ({displayAlerts.length} {isHe ? "התרעות" : "alerts"}{city ? ` — ${city}` : ""})
          </span>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`ms-auto p-1.5 rounded-lg transition-colors ${
              showSettings ? "bg-alert-red/10 text-alert-red" : "text-text-secondary hover:text-text-primary hover:bg-bg"
            }`}
            title={isHe ? "הגדרות התרעות" : "Alert settings"}
          >
            <Settings size={16} />
          </button>
        </motion.div>

        {/* Alert settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Settings size={14} />
                  {isHe ? "הגדרות התרעות" : "Alert Settings"}
                </h3>
                <AlertSettingsPanel
                  settings={alertSettings}
                  onChange={setAlertSettings}
                  isHe={isHe}
                  allCityNames={cityNames}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key numbers row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label={isHe ? "סה״כ התרעות" : "Total Alerts"}
            value={totalAlerts}
            icon={<IconAlert size={18} />}
            delay={0}
          />
          <StatCard
            label={isHe ? "התרעות היום" : "Today"}
            value={displayAlerts.filter((a) => {
              const today = new Date(); today.setHours(0, 0, 0, 0);
              return new Date(a.timestamp) >= today;
            }).length}
            icon={<IconStats size={18} />}
            delay={0.1}
          />
          <StatCard
            label={isHe ? "ערים מותקפות" : "Cities Hit"}
            value={uniqueCities}
            icon={<MapPin size={18} />}
            delay={0.2}
          />
          <StatCard
            label={isHe ? "שעת שיא" : "Peak Hour"}
            value={overallStats.peak.count}
            suffix={` (${overallStats.peak.label})`}
            icon={<IconClock size={18} />}
            delay={0.3}
          />
        </div>

        {/* Trend cards */}
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-xs text-text-secondary">
              {isHe ? "מגמה שבועית" : "Week Trend"}
            </span>
            <div className={`flex items-center gap-1 text-sm font-bold ${
              overallStats.wow.direction === "up" ? "text-alert-red"
                : overallStats.wow.direction === "down" ? "text-alert-safe"
                  : "text-text-secondary"
            }`}>
              {overallStats.wow.direction === "up" && <TrendingUp size={14} />}
              {overallStats.wow.direction === "down" && <TrendingDown size={14} />}
              {overallStats.wow.direction === "up" ? "+" : overallStats.wow.direction === "down" ? "-" : ""}
              {overallStats.wow.pctChange}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-bg-card border border-alert-red/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">
                {isHe ? "תקיפה צפויה" : "Next Attack"}
              </span>
              <span className="text-[10px] text-text-secondary">
                {overallStats.prediction.confidence}%
              </span>
            </div>
            <p className="font-mono text-sm font-bold text-alert-red">
              {isHe ? overallStats.prediction.label_he : overallStats.prediction.label}
            </p>
          </motion.div>

          {overallStats.quiet.currentGapHours > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
            >
              <span className="text-xs text-text-secondary">
                {isHe ? "מאז התרעה אחרונה" : "Since Last Alert"}
              </span>
              <span className="font-mono text-sm font-bold text-text-primary">
                {overallStats.quiet.currentGapHours < 1
                  ? `${Math.round(overallStats.quiet.currentGapHours * 60)}m`
                  : `${overallStats.quiet.currentGapHours.toFixed(1)}h`}
              </span>
            </motion.div>
          )}
        </div>

        {/* ──── CITY SEARCH ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Search size={18} />
            {isHe ? "סטטיסטיקה לפי עיר" : "City Statistics"}
          </h2>
          <CitySearchBar
            cityNames={cityNames}
            value={city}
            onChange={setCity}
            placeholder={isHe ? "חפש עיר..." : "Search city..."}
          />
        </motion.div>

        {/* ──── CITY PROFILE ──── */}
        <AnimatePresence mode="wait">
          {city && cityProfile && (
            <motion.div
              key={city}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <CityProfileSection
                city={city}
                profile={cityProfile}
                cityAlerts={cityAlerts}
                isHe={isHe}
                onClear={() => setCity("")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──── CHARTS ──── */}
        {displayAlerts.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {city
                ? (isHe ? `ניתוח — ${city}` : `Analysis — ${city}`)
                : (isHe ? "ניתוח כללי" : "Overall Analysis")}
            </h2>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <TopCitiesChart alerts={displayAlerts} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <CategoryChart alerts={displayAlerts} />
              </motion.div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <HourlyChart alerts={displayAlerts} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <RegionChart alerts={displayAlerts} />
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
              <AlertHeatmap alerts={displayAlerts} />
            </motion.div>
          </>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
          <div className="text-center">
            <div className="mb-4 animate-pulse flex justify-center"><ShieldLogo size={48} className="text-alert-red" /></div>
            <p className="text-text-secondary text-sm animate-pulse">{isHe ? "טוען..." : "Loading..."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// City Profile Section
// ──────────────────────────────────────────

function CityProfileSection({
  city, profile, cityAlerts, isHe, onClear,
}: {
  city: string;
  profile: ReturnType<typeof cityRiskProfile>;
  cityAlerts: ReturnType<typeof alertsForCity>;
  isHe: boolean;
  onClear: () => void;
}) {
  const riskColor = RISK_COLORS[profile.riskLevel];
  const riskLabel = RISK_LABELS[profile.riskLevel][isHe ? "he" : "en"];

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
      {/* Risk glow */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15"
        style={{ background: riskColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Shield size={22} style={{ color: riskColor }} />
          <div>
            <h3 className="text-xl font-bold text-text-primary">{city}</h3>
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{ color: riskColor, backgroundColor: `${riskColor}15`, border: `1px solid ${riskColor}30` }}
            >
              {riskLabel}
            </span>
          </div>
        </div>
        <button
          onClick={onClear}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg transition-colors text-text-secondary hover:text-text-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* Probability bars */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <ProbabilityBar label={isHe ? "6 שעות הבאות" : "Next 6h"} value={profile.probabilityNext6h} />
        <ProbabilityBar label={isHe ? "24 שעות הבאות" : "Next 24h"} value={profile.probabilityNext24h} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MiniStat
          icon={<AlertTriangle size={14} />}
          label={isHe ? "סה״כ התרעות" : "Total"}
          value={String(profile.totalAlerts)}
        />
        <MiniStat
          icon={<Clock size={14} />}
          label={isHe ? "ב-24 שעות" : "24h"}
          value={String(profile.alertsLast24h)}
        />
        <MiniStat
          icon={<BarChart3 size={14} />}
          label={isHe ? "ממוצע יומי" : "Daily avg"}
          value={String(profile.avgAlertsPerDay)}
        />
        <MiniStat
          icon={<Target size={14} />}
          label={isHe ? "שעת שיא" : "Peak"}
          value={profile.peakHour.label}
        />
      </div>

      {/* Last alert + avg gap */}
      {profile.lastAlertTime && (
        <div className="flex items-center gap-2 text-xs text-text-secondary border-t border-border pt-3 mb-3">
          <Clock size={12} />
          <span>
            {isHe ? "התרעה אחרונה:" : "Last alert:"}{" "}
            {profile.hoursSinceLastAlert !== null
              ? profile.hoursSinceLastAlert < 1
                ? isHe ? "פחות משעה" : "< 1 hour ago"
                : `${Math.round(profile.hoursSinceLastAlert)}${isHe ? " שעות" : "h ago"}`
              : "—"}
          </span>
          {profile.avgGapHours > 0 && (
            <span className="text-text-secondary/60">
              ({isHe ? "ממוצע:" : "avg:"} {Math.round(profile.avgGapHours)}{isHe ? " שעות" : "h"})
            </span>
          )}
        </div>
      )}

      {/* Category breakdown */}
      {profile.topCategories.length > 0 && (
        <div className="border-t border-border pt-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-2">
            {isHe ? "סוגי איומים" : "Threat Types"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.topCategories.map((cat) => (
              <span
                key={cat.category}
                className="text-[10px] px-2 py-0.5 rounded-full bg-bg border border-border text-text-secondary"
              >
                {cat.name} ({cat.pct}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Day patterns */}
      {profile.dangerousDays.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-2">
            {isHe ? "ימים מסוכנים" : "Most Dangerous Days"}
          </p>
          <div className="flex gap-1.5">
            {profile.dangerousDays.slice(0, 4).map((d) => (
              <span
                key={d.day}
                className="text-[10px] px-2 py-0.5 rounded-full bg-bg border border-border text-text-secondary"
              >
                {d.day} ({d.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* City-specific charts */}
      {cityAlerts.length > 5 && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-medium text-text-primary mb-3">
            {isHe ? `ניתוח התרעות עבור ${city}` : `Alert analysis for ${city}`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <HourlyChart alerts={cityAlerts} />
            <CategoryChart alerts={cityAlerts} />
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Shared components
// ──────────────────────────────────────────

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "#ef4444" : value >= 40 ? "#f59e0b" : "#22c55e";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 bg-bg rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center p-2.5 rounded-xl bg-bg border border-border">
      <div className="flex justify-center text-text-secondary mb-1">{icon}</div>
      <p className="font-mono text-sm font-bold text-text-primary">{value}</p>
      <p className="text-[9px] text-text-secondary">{label}</p>
    </div>
  );
}

// ──────────────────────────────────────────
// City Search Bar
// ──────────────────────────────────────────

function CitySearchBar({
  cityNames, value, onChange, placeholder,
}: {
  cityNames: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    return cityNames.filter((c) => c.includes(q));
  }, [cityNames, search]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={open ? search : value || ""}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setSearch(""); }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full ps-10 pe-10 py-3 text-sm bg-bg-card border border-border rounded-xl text-text-primary focus:outline-none focus:border-alert-red/50 transition-colors"
          autoComplete="off"
        />
        {value && !open && (
          <button
            onClick={() => { onChange(""); setSearch(""); }}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-bg-card border border-border rounded-xl shadow-lg">
          {search.trim() === "" ? (
            <div className="px-4 py-3 text-xs text-text-secondary text-center">
              {cityNames.length} cities available — type to search
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-text-secondary text-center">No results</div>
          ) : (
            filtered.slice(0, 50).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => { onChange(name); setSearch(""); setOpen(false); }}
                className={`w-full text-start px-4 py-2 text-sm hover:bg-alert-red/10 transition-colors ${
                  name === value ? "text-alert-red font-medium" : "text-text-primary"
                }`}
              >
                {name}
              </button>
            ))
          )}
          {filtered.length > 50 && (
            <div className="px-4 py-2 text-[10px] text-text-secondary text-center border-t border-border">
              +{filtered.length - 50} more — keep typing
            </div>
          )}
        </div>
      )}
    </div>
  );
}
