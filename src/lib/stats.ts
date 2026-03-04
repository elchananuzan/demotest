import { type ProcessedAlert } from "./oref";
import { cities } from "./cities";

/** Average alerts per day over a given number of days */
export function avgAlertsPerDay(alerts: ProcessedAlert[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const inRange = alerts.filter((a) => new Date(a.timestamp).getTime() >= cutoff);
  return inRange.length / Math.max(days, 1);
}

/** Find the hour (0-23) with most alerts */
export function peakHourAnalysis(alerts: ProcessedAlert[]): {
  hour: number;
  count: number;
  label: string;
} {
  const hourCounts = new Array(24).fill(0);
  alerts.forEach((a) => {
    hourCounts[new Date(a.timestamp).getHours()]++;
  });
  const maxCount = Math.max(...hourCounts);
  const maxHour = hourCounts.indexOf(maxCount);
  const endHour = (maxHour + 1) % 24;
  return {
    hour: maxHour,
    count: maxCount,
    label: `${String(maxHour).padStart(2, "0")}:00–${String(endHour).padStart(2, "0")}:00`,
  };
}

/** Pattern-based prediction: find the most likely next attack window */
export function predictNextAttackWindow(alerts: ProcessedAlert[]): {
  hours: [number, number];
  confidence: number;
  label: string;
  label_he: string;
} {
  // Build a 7x24 grid of attack frequency (day of week x hour)
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  alerts.forEach((a) => {
    const d = new Date(a.timestamp);
    grid[d.getDay()][d.getHours()]++;
  });

  // Find the next high-probability window from current time
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  let bestScore = 0;
  let bestStart = 0;
  let bestDay = 0;

  // Check 3-hour windows across the next 48 hours
  for (let offset = 1; offset < 48; offset++) {
    const h = (currentHour + offset) % 24;
    const d = (currentDay + Math.floor((currentHour + offset) / 24)) % 7;
    const windowScore = grid[d][h] + grid[d][(h + 1) % 24] + grid[d][(h + 2) % 24];
    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestStart = h;
      bestDay = d;
    }
  }

  const totalAlerts = alerts.length || 1;
  const confidence = Math.min(Math.round((bestScore / totalAlerts) * 100 * 3), 95);
  const endHour = (bestStart + 3) % 24;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesHe = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  return {
    hours: [bestStart, endHour],
    confidence,
    label: `${dayNames[bestDay]} ${String(bestStart).padStart(2, "0")}:00–${String(endHour).padStart(2, "0")}:00`,
    label_he: `${dayNamesHe[bestDay]} ${String(bestStart).padStart(2, "0")}:00–${String(endHour).padStart(2, "0")}:00`,
  };
}

/** Percentage of attacks hitting 5+ cities (barrages) */
export function multiCityAttackPct(alerts: ProcessedAlert[]): number {
  if (alerts.length === 0) return 0;
  const multiCity = alerts.filter((a) => a.cities.length >= 5).length;
  return (multiCity / alerts.length) * 100;
}

/** Average shelter time across all targeted cities */
export function avgShelterTime(alerts: ProcessedAlert[]): number {
  const shelterTimes: number[] = [];
  alerts.forEach((a) => {
    a.cities.forEach((c) => {
      const city = cities[c];
      if (city) shelterTimes.push(city.shelterTime);
    });
  });
  if (shelterTimes.length === 0) return 0;
  return shelterTimes.reduce((sum, t) => sum + t, 0) / shelterTimes.length;
}

/** Week-over-week percentage change */
export function weekOverWeekTrend(alerts: ProcessedAlert[]): {
  pctChange: number;
  direction: "up" | "down" | "flat";
} {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const thisWeek = alerts.filter((a) => {
    const t = new Date(a.timestamp).getTime();
    return t >= oneWeekAgo && t <= now;
  }).length;

  const lastWeek = alerts.filter((a) => {
    const t = new Date(a.timestamp).getTime();
    return t >= twoWeeksAgo && t < oneWeekAgo;
  }).length;

  if (lastWeek === 0) {
    return { pctChange: thisWeek > 0 ? 100 : 0, direction: thisWeek > 0 ? "up" : "flat" };
  }
  const pctChange = ((thisWeek - lastWeek) / lastWeek) * 100;
  return {
    pctChange: Math.round(Math.abs(pctChange)),
    direction: pctChange > 5 ? "up" : pctChange < -5 ? "down" : "flat",
  };
}

/** Daily alert counts by category for the last N days */
export function categoryTrendData(
  alerts: ProcessedAlert[],
  days: number = 14
): { date: string; rockets: number; drones: number; ballistic: number; other: number }[] {
  const result: Record<string, { rockets: number; drones: number; ballistic: number; other: number }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    result[d.toISOString().split("T")[0]] = { rockets: 0, drones: 0, ballistic: 0, other: 0 };
  }

  alerts.forEach((a) => {
    const key = new Date(a.timestamp).toISOString().split("T")[0];
    if (!result[key]) return;
    if (a.category === 1) result[key].rockets++;
    else if (a.category === 2 || a.category === 6) result[key].drones++;
    else if (a.category === 13) result[key].ballistic++;
    else result[key].other++;
  });

  return Object.entries(result).map(([date, counts]) => ({ date, ...counts }));
}

/** Time since last alert vs average gap between alerts */
export function quietPeriodAnalysis(alerts: ProcessedAlert[]): {
  currentGapHours: number;
  avgGapHours: number;
} {
  if (alerts.length === 0) return { currentGapHours: 0, avgGapHours: 0 };

  const sorted = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const currentGapHours = (Date.now() - new Date(sorted[0].timestamp).getTime()) / (1000 * 60 * 60);

  if (sorted.length < 2) return { currentGapHours, avgGapHours: 0 };

  let totalGap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    totalGap += new Date(sorted[i].timestamp).getTime() - new Date(sorted[i + 1].timestamp).getTime();
  }
  const avgGapHours = totalGap / (sorted.length - 1) / (1000 * 60 * 60);

  return { currentGapHours, avgGapHours };
}
