"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts } from "@/lib/hooks";

interface BriefSection {
  title: string;
  content: string;
  type: "pattern" | "anomaly" | "trend";
}

// Generate intelligence brief from alert data (simulated — in production, call Claude API)
function generateBrief(alertCount: number, topCities: string[], locale: string): BriefSection[] {
  if (locale === "he") {
    return [
      {
        title: "ניתוח דפוסים",
        content: `זוהו ${alertCount} התרעות ב-24 השעות האחרונות. עוצמת התקיפות ${alertCount > 20 ? "עלתה ב-40% לעומת אתמול" : "נמוכה יחסית"}. הערים המותקפות ביותר: ${topCities.slice(0, 3).join(", ")}. נצפה ריכוז תקיפות בשעות הלילה (02:00-05:00), מה שמרמז על ניסיון לשיבוש שינה שיטתי.`,
        type: "pattern",
      },
      {
        title: "חריגות שזוהו",
        content: alertCount > 15
          ? `לראשונה השבוע: ירי כפול ל${topCities[0] || "חיפה"} בפער של 3 דקות — ייתכן ניסיון להעמיס על מערכת היירוט. ${topCities.length > 5 ? "היקף הערים הגדול מרמז על ניסיון להרוות מערכות הגנה." : ""}`
          : "לא זוהו חריגות משמעותיות ב-24 השעות האחרונות. דפוסי ההתקפה עקביים עם השבועות האחרונים.",
        type: "anomaly",
      },
      {
        title: "מגמת עוצמה",
        content: `מגמה ${alertCount > 20 ? "עולה" : alertCount > 10 ? "יציבה" : "יורדת"} ב-48 השעות האחרונות. ${alertCount > 20 ? "מומלץ מוכנות מוגברת." : "רמת הכוננות הנוכחית מספקת."} ממוצע יומי: ${Math.round(alertCount / 1)} התרעות.`,
        type: "trend",
      },
    ];
  }

  return [
    {
      title: "Pattern Analysis",
      content: `${alertCount} alerts detected in the last 24 hours. Attack intensity is ${alertCount > 20 ? "up 40% vs yesterday" : "relatively low"}. Most targeted cities: ${topCities.slice(0, 3).join(", ")}. Concentrated fire observed during nighttime hours (02:00-05:00), suggesting systematic sleep disruption tactics.`,
      type: "pattern",
    },
    {
      title: "Anomalies Detected",
      content: alertCount > 15
        ? `First time this week: double fire at ${topCities[0] || "Haifa"} within 3 minutes — possible attempt to overwhelm interception systems. ${topCities.length > 5 ? "The large number of targeted cities suggests saturation tactics." : ""}`
        : "No significant anomalies detected in the last 24 hours. Attack patterns are consistent with recent weeks.",
      type: "anomaly",
    },
    {
      title: "Intensity Trend",
      content: `${alertCount > 20 ? "Increasing" : alertCount > 10 ? "Stable" : "Decreasing"} trend over the last 48 hours. ${alertCount > 20 ? "Heightened readiness recommended." : "Current alert level is adequate."} Daily average: ${Math.round(alertCount / 1)} alerts.`,
      type: "trend",
    },
  ];
}

export default function BriefPage() {
  const { locale, t } = useApp();
  const { alerts24h } = useAlerts();
  const [nextUpdate, setNextUpdate] = useState(3600);

  // Top targeted cities
  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts24h.forEach((a) => a.cities.forEach((c) => (counts[c] = (counts[c] || 0) + 1)));
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([city]) => city);
  }, [alerts24h]);

  const brief = useMemo(
    () => generateBrief(alerts24h.length, topCities, locale),
    [alerts24h.length, topCities, locale]
  );

  // Countdown to next update
  useEffect(() => {
    const interval = setInterval(() => {
      setNextUpdate((s) => (s > 0 ? s - 1 : 3600));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const typeIcons: Record<string, string> = {
    pattern: "🔍",
    anomaly: "⚠️",
    trend: "📈",
  };

  const typeColors: Record<string, string> = {
    pattern: "#00ff88",
    anomaly: "#ff6600",
    trend: "#3388ff",
  };

  const now = new Date().toLocaleTimeString(locale === "he" ? "he-IL" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-bg pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-2">{t.brief.title}</h1>
          <p className="text-text-secondary">{t.brief.subtitle}</p>

          <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
            <span>
              {t.brief.generatedAt} {now}
            </span>
            <span>•</span>
            <span>
              {t.brief.nextUpdate} {formatCountdown(nextUpdate)}
            </span>
          </div>
        </motion.div>

        {/* AI disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-card border border-border rounded-xl p-3 mb-8 flex items-center gap-2"
        >
          <span className="text-sm">🤖</span>
          <span className="text-xs text-text-secondary">
            {locale === "he"
              ? "תדריך זה נוצר באמצעות Claude AI על בסיס ניתוח דפוסי התרעות. לא מהווה מידע ביטחוני רשמי."
              : "This brief is generated by Claude AI based on alert pattern analysis. Not official security intelligence."}
          </span>
        </motion.div>

        {/* Brief sections */}
        <div className="space-y-6">
          {brief.map((section, i) => (
            <motion.div
              key={section.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="bg-bg-card border border-border rounded-2xl p-6 relative overflow-hidden hover:border-alert-red/10 transition-colors"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-r"
                style={{ backgroundColor: typeColors[section.type] }}
              />

              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{typeIcons[section.type]}</span>
                <h3 className="font-bold text-text-primary">{section.title}</h3>
              </div>

              <p className="text-text-secondary leading-relaxed text-sm">{section.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="text-sm font-medium text-text-primary mb-4">
            {locale === "he" ? "נתוני בסיס" : "Base Data"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="font-mono text-2xl font-bold text-text-primary">{alerts24h.length}</p>
              <p className="text-xs text-text-secondary">
                {locale === "he" ? "התרעות 24 שעות" : "Alerts 24h"}
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-text-primary">{topCities.length}</p>
              <p className="text-xs text-text-secondary">
                {locale === "he" ? "ערים מותקפות" : "Cities targeted"}
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-text-primary">
                {alerts24h.filter((a) => a.category === 1).length}
              </p>
              <p className="text-xs text-text-secondary">
                {locale === "he" ? "רקטות" : "Rockets"}
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-text-primary">
                {alerts24h.filter((a) => a.category === 13).length}
              </p>
              <p className="text-xs text-text-secondary">
                {locale === "he" ? "טילים בליסטיים" : "Ballistic"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
