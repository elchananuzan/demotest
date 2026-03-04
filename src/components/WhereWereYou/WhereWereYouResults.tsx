"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { useAnimatedNumber } from "@/lib/hooks";
import { WHERE_WERE_YOU_OPTIONS } from "@/lib/oref";

interface WhereWereYouResultsProps {
  stats: Record<string, number>;
  total: number;
  alertTime?: string;
  compact?: boolean;
}

export default function WhereWereYouResults({
  stats,
  total,
  alertTime,
  compact = false,
}: WhereWereYouResultsProps) {
  const { locale, t } = useApp();
  const animatedTotal = useAnimatedNumber(total);

  const sortedActivities = WHERE_WERE_YOU_OPTIONS
    .map((opt) => ({
      ...opt,
      count: stats[opt.key] || 0,
      percentage: total > 0 ? ((stats[opt.key] || 0) / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topActivity = sortedActivities[0];

  if (compact) {
    return (
      <div className="space-y-2">
        {sortedActivities.slice(0, 4).map((activity) => (
          <div key={activity.key} className="flex items-center gap-2 text-sm">
            <span>{activity.emoji}</span>
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activity.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-alert-red/70 rounded-full"
              />
            </div>
            <span className="font-mono text-xs text-text-secondary w-10 text-right">
              {Math.round(activity.percentage)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-alert-red/5 blur-3xl pointer-events-none" />

      {/* Hero stat */}
      {topActivity && (
        <div className="text-center mb-6">
          {alertTime && (
            <p className="text-text-secondary text-sm mb-2">
              {locale === "he"
                ? t.stories.lastNight.replace("{time}", alertTime)
                : t.stories.lastNight.replace("{time}", alertTime)}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-4xl">{topActivity.emoji}</span>
            <span className="font-mono text-4xl font-bold text-text-primary">
              {animatedTotal.toLocaleString()}
            </span>
          </div>
          <p className="text-text-secondary">
            {t.whereWereYou.peopleReported}
          </p>
        </div>
      )}

      {/* Results breakdown */}
      <div className="space-y-3">
        <p className="text-xs text-text-secondary uppercase tracking-wider">
          {t.stories.ofReported.replace("{count}", animatedTotal.toLocaleString())}
        </p>

        {sortedActivities.map((activity, i) => (
          <motion.div
            key={activity.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <span className="text-xl">{activity.emoji}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-text-primary">
                  {locale === "he" ? activity.he : activity.en}
                </span>
                <span className="font-mono text-sm text-text-secondary">
                  {Math.round(activity.percentage)}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activity.percentage}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #ff3333, ${i === 0 ? "#ff3333" : "#ff333380"})`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
