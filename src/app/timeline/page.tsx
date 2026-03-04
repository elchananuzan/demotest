"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAlerts } from "@/lib/hooks";
import { getCategoryInfo, ALERT_CATEGORIES } from "@/lib/oref";
import { cities } from "@/lib/cities";
import { CATEGORY_ICONS, IconSearch } from "@/components/Icons";

const REGIONS = [
  { key: "all", en: "All Regions", he: "כל האזורים" },
  { key: "north", en: "North", he: "צפון" },
  { key: "center", en: "Center", he: "מרכז" },
  { key: "south", en: "South", he: "דרום" },
  { key: "jerusalem", en: "Jerusalem", he: "ירושלים" },
];

export default function TimelinePage() {
  const { locale, t } = useApp();
  const { alerts } = useAlerts();
  const [regionFilter, setRegionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [exportFeedback, setExportFeedback] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (regionFilter !== "all") {
        const matchesRegion = alert.cities.some((c) => cities[c]?.region === regionFilter);
        if (!matchesRegion) return false;
      }
      if (categoryFilter !== null && alert.category !== categoryFilter) return false;
      return true;
    });
  }, [alerts, regionFilter, categoryFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [regionFilter, categoryFilter]);

  const visibleAlerts = filteredAlerts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAlerts.length;

  const isMajorBarrage = (alert: typeof alerts[0]) => alert.cities.length >= 5;

  const exportCsv = () => {
    const header = "Time,Category,Cities\n";
    const rows = filteredAlerts
      .map((a) => {
        const time = new Date(a.timestamp).toISOString();
        const cat = getCategoryInfo(a.category);
        const cityList = a.cities
          .map((c) => cities[c]?.name_en || c)
          .join("; ");
        return `"${time}","${cat.en}","${cityList}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lionfury-alerts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">{t.timeline.title}</h1>
            <p className="text-text-secondary">{t.timeline.subtitle}</p>
          </div>
          <button
            onClick={exportCsv}
            className={`shrink-0 px-4 py-2 text-xs font-medium border rounded-xl transition-all ${
              exportFeedback
                ? "bg-alert-safe/10 border-alert-safe/30 text-alert-safe"
                : "bg-bg-card border-border text-text-secondary hover:text-text-primary hover:border-alert-red/20"
            }`}
          >
            {exportFeedback
              ? locale === "he" ? "הורד!" : "Downloaded!"
              : t.timeline.exportCsv}
          </button>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Region filter */}
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRegionFilter(r.key)}
              className={`px-4 py-2 text-xs rounded-full border transition-all ${
                regionFilter === r.key
                  ? "bg-alert-red/10 border-alert-red/30 text-alert-red"
                  : "bg-bg-card border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {locale === "he" ? r.he : r.en}
            </button>
          ))}

          <div className="w-px h-6 bg-border self-center mx-1" />

          {/* Category filter */}
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-4 py-2 text-xs rounded-full border transition-all ${
              categoryFilter === null
                ? "bg-alert-red/10 border-alert-red/30 text-alert-red"
                : "bg-bg-card border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {locale === "he" ? "הכל" : "All"}
          </button>
          {Object.entries(ALERT_CATEGORIES).map(([cat, info]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(parseInt(cat))}
              className={`px-4 py-2 text-xs rounded-full border transition-all ${
                categoryFilter === parseInt(cat)
                  ? "bg-alert-red/10 border-alert-red/30 text-alert-red"
                  : "bg-bg-card border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {(() => { const Icon = CATEGORY_ICONS[parseInt(cat)]; return Icon ? <Icon size={12} className="inline-block me-1" /> : null; })()}
              {locale === "he" ? info.he : info.en}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-text-secondary text-xs mb-4">
          {filteredAlerts.length} {locale === "he" ? "התרעות" : "alerts"}
        </p>

        {/* Timeline */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleAlerts.map((alert, i) => {
              const catInfo = getCategoryInfo(alert.category);
              const time = new Date(alert.timestamp).toLocaleTimeString(
                locale === "he" ? "he-IL" : "en-US",
                { hour: "2-digit", minute: "2-digit" }
              );
              const date = new Date(alert.timestamp).toLocaleDateString(
                locale === "he" ? "he-IL" : "en-US",
                { month: "short", day: "numeric" }
              );
              const major = isMajorBarrage(alert);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.02 }}
                  className={`bg-bg-card border rounded-xl p-4 hover:border-alert-red/20 transition-all ${
                    major ? "border-alert-warning/30 glow-red" : "border-border"
                  }`}
                >
                  {major && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-alert-warning">
                        {t.timeline.majorBarrage}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        ({alert.cities.length} {locale === "he" ? "ערים" : "cities"})
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-text-primary">{time}</span>
                        <span className="text-text-secondary text-xs">{date}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {alert.cities.slice(0, 8).map((city) => (
                          <span
                            key={city}
                            className="px-2 py-0.5 bg-bg border border-border rounded-md text-xs text-text-primary"
                          >
                            {locale === "he" ? city : cities[city]?.name_en || city}
                          </span>
                        ))}
                        {alert.cities.length > 8 && (
                          <span className="px-2 py-0.5 text-xs text-text-secondary">
                            +{alert.cities.length - 8}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${catInfo.color}15`,
                        color: catInfo.color,
                      }}
                    >
                      {(() => { const Icon = CATEGORY_ICONS[alert.category]; return Icon ? <Icon size={12} className="inline-block me-1" /> : null; })()}
                      {locale === "he" ? catInfo.he : catInfo.en}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={() => setVisibleCount((c) => c + 20)}
              className="px-6 py-2.5 text-xs font-medium bg-bg-card border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-alert-red/20 transition-all"
            >
              {locale === "he" ? `טען עוד (${filteredAlerts.length - visibleCount} נותרו)` : `Load more (${filteredAlerts.length - visibleCount} remaining)`}
            </button>
          </div>
        )}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4"><IconSearch size={48} className="text-text-secondary" /></div>
            <p className="text-text-secondary text-lg">
              {locale === "he" ? "אין התרעות מתאימות" : "No matching alerts"}
            </p>
            <p className="text-text-secondary text-sm mt-2">
              {locale === "he" ? "נסה לשנות את המסננים" : "Try adjusting the filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
