"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Clock, Target, ChevronDown, AlertTriangle, MapPin } from "lucide-react";
import { useApp } from "@/lib/context";
import { useMyCity } from "@/lib/hooks";
import { type ProcessedAlert } from "@/lib/oref";
import { cityRiskProfile, allCityNames } from "@/lib/stats";

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

export default function CityRiskCard({ alerts }: { alerts: ProcessedAlert[] }) {
  const { locale } = useApp();
  const { city, setCity } = useMyCity();
  const isHe = locale === "he";

  const cityNames = useMemo(() => allCityNames(alerts), [alerts]);
  const profile = useMemo(
    () => (city ? cityRiskProfile(alerts, city) : null),
    [alerts, city]
  );

  // No city selected — show picker prompt
  if (!city) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-text-secondary" />
          <p className="text-sm font-medium text-text-primary">
            {isHe ? "בחר את העיר שלך" : "Select Your City"}
          </p>
        </div>
        <p className="text-xs text-text-secondary mb-3">
          {isHe
            ? "קבל סטטיסטיקות מותאמות אישית והערכת סיכון עבור המיקום שלך"
            : "Get personalized stats and risk assessment for your location"}
        </p>
        <CitySelect
          cityNames={cityNames}
          value={city}
          onChange={setCity}
          placeholder={isHe ? "בחר עיר..." : "Choose a city..."}
        />
      </motion.div>
    );
  }

  if (!profile) return null;

  const riskColor = RISK_COLORS[profile.riskLevel];
  const riskLabel = RISK_LABELS[profile.riskLevel][isHe ? "he" : "en"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border rounded-2xl p-5 relative overflow-hidden"
    >
      {/* Risk glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-15"
        style={{ background: riskColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} style={{ color: riskColor }} />
          <span className="font-bold text-text-primary">{city}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ color: riskColor, backgroundColor: `${riskColor}15`, border: `1px solid ${riskColor}30` }}
          >
            {riskLabel}
          </span>
          <button
            onClick={() => setCity("")}
            className="text-[10px] text-text-secondary hover:text-text-primary transition-colors"
          >
            {isHe ? "שנה" : "change"}
          </button>
        </div>
      </div>

      {/* Probability bars */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ProbabilityBar
          label={isHe ? "6 שעות הבאות" : "Next 6h"}
          value={profile.probabilityNext6h}
        />
        <ProbabilityBar
          label={isHe ? "24 שעות הבאות" : "Next 24h"}
          value={profile.probabilityNext24h}
        />
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MiniStat
          icon={<AlertTriangle size={12} />}
          label={isHe ? "ב-24 שעות" : "24h"}
          value={String(profile.alertsLast24h)}
        />
        <MiniStat
          icon={<Clock size={12} />}
          label={isHe ? "ממוצע יומי" : "Daily avg"}
          value={String(profile.avgAlertsPerDay)}
        />
        <MiniStat
          icon={<Target size={12} />}
          label={isHe ? "שעת שיא" : "Peak"}
          value={profile.peakHour.label}
        />
      </div>

      {/* Last alert */}
      {profile.lastAlertTime && (
        <div className="flex items-center gap-2 text-xs text-text-secondary border-t border-border pt-3">
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
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-2">
            {isHe ? "סוגי איומים" : "Threat Types"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.topCategories.slice(0, 3).map((cat) => (
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

      {/* City selector (collapsed) */}
      <details className="mt-3 pt-3 border-t border-border">
        <summary className="text-[10px] text-text-secondary cursor-pointer flex items-center gap-1 hover:text-text-primary transition-colors">
          <ChevronDown size={10} />
          {isHe ? "שנה עיר" : "Change city"}
        </summary>
        <div className="mt-2">
          <CitySelect
            cityNames={cityNames}
            value={city}
            onChange={setCity}
            placeholder={isHe ? "בחר עיר..." : "Choose a city..."}
          />
        </div>
      </details>
    </motion.div>
  );
}

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "#ef4444" : value >= 40 ? "#f59e0b" : "#22c55e";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
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
    <div className="text-center p-2 rounded-xl bg-bg border border-border">
      <div className="flex justify-center text-text-secondary mb-1">{icon}</div>
      <p className="font-mono text-sm font-bold text-text-primary">{value}</p>
      <p className="text-[9px] text-text-secondary">{label}</p>
    </div>
  );
}

function CitySelect({
  cityNames,
  value,
  onChange,
  placeholder,
}: {
  cityNames: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-xl text-text-primary focus:outline-none focus:border-alert-red/50 transition-colors appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {cityNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
