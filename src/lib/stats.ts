import { type ProcessedAlert } from "./oref";
import { cities } from "./cities";
import { OREF_CITY_NAMES } from "./oref-cities";

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

// ──────────────────────────────────────────────────────────
// City-specific probability & risk analysis
// ──────────────────────────────────────────────────────────

/** Filter alerts that targeted a specific city (supports zone matching: "תל אביב" matches "תל אביב - דרום") */
export function alertsForCity(alerts: ProcessedAlert[], cityName: string): ProcessedAlert[] {
  return alerts.filter((a) =>
    a.cities.some((c) => c === cityName || c.startsWith(cityName + " ") || cityName.startsWith(c + " "))
  );
}

/** City risk profile — comprehensive stats for a single city */
export interface CityRiskProfile {
  city: string;
  totalAlerts: number;
  alertsLast24h: number;
  alertsLast7d: number;
  avgAlertsPerDay: number;
  peakHour: { hour: number; count: number; label: string };
  lastAlertTime: string | null;
  hoursSinceLastAlert: number | null;
  avgGapHours: number;
  probabilityNext24h: number; // 0-100%
  probabilityNext6h: number;  // 0-100%
  riskLevel: "low" | "moderate" | "high" | "critical";
  topCategories: { category: number; name: string; count: number; pct: number }[];
  dangerousDays: { day: string; count: number }[]; // day of week patterns
}

export function cityRiskProfile(alerts: ProcessedAlert[], cityName: string): CityRiskProfile {
  const cityAlerts = alertsForCity(alerts, cityName);
  const now = Date.now();

  // Time-based filters
  const last24h = cityAlerts.filter((a) => now - new Date(a.timestamp).getTime() < 24 * 3600000);
  const last7d = cityAlerts.filter((a) => now - new Date(a.timestamp).getTime() < 7 * 24 * 3600000);

  // Sort by time (newest first)
  const sorted = [...cityAlerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Last alert
  const lastAlertTime = sorted.length > 0 ? sorted[0].timestamp : null;
  const hoursSinceLastAlert = lastAlertTime
    ? (now - new Date(lastAlertTime).getTime()) / 3600000
    : null;

  // Average gap between alerts for this city
  let avgGapHours = 0;
  if (sorted.length >= 2) {
    let totalGap = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      totalGap += new Date(sorted[i].timestamp).getTime() - new Date(sorted[i + 1].timestamp).getTime();
    }
    avgGapHours = totalGap / (sorted.length - 1) / 3600000;
  }

  // Data time span in days (for daily average)
  const timeSpanDays = sorted.length >= 2
    ? (new Date(sorted[0].timestamp).getTime() - new Date(sorted[sorted.length - 1].timestamp).getTime()) / (24 * 3600000)
    : 1;
  const avgPerDay = cityAlerts.length / Math.max(timeSpanDays, 1);

  // Peak hour
  const hourCounts = new Array(24).fill(0);
  cityAlerts.forEach((a) => hourCounts[new Date(a.timestamp).getHours()]++);
  const maxHourCount = Math.max(...hourCounts, 0);
  const maxHour = hourCounts.indexOf(maxHourCount);
  const endHour = (maxHour + 1) % 24;

  // Probability calculation (Poisson-based)
  // P(at least 1 alert in T hours) = 1 - e^(-lambda * T)
  // lambda = alerts per hour
  const lambda = avgGapHours > 0 ? 1 / avgGapHours : 0;
  const probabilityNext24h = lambda > 0 ? Math.round((1 - Math.exp(-lambda * 24)) * 100) : 0;
  const probabilityNext6h = lambda > 0 ? Math.round((1 - Math.exp(-lambda * 6)) * 100) : 0;

  // Risk level
  let riskLevel: CityRiskProfile["riskLevel"] = "low";
  if (last24h.length >= 3 || probabilityNext6h >= 70) riskLevel = "critical";
  else if (last24h.length >= 1 || probabilityNext24h >= 60) riskLevel = "high";
  else if (last7d.length >= 3 || probabilityNext24h >= 30) riskLevel = "moderate";

  // Top categories
  const catCounts = new Map<number, { name: string; count: number }>();
  cityAlerts.forEach((a) => {
    const existing = catCounts.get(a.category);
    if (existing) existing.count++;
    else catCounts.set(a.category, { name: a.category_name, count: 1 });
  });
  const topCategories = Array.from(catCounts.entries())
    .map(([category, { name, count }]) => ({
      category,
      name,
      count,
      pct: cityAlerts.length > 0 ? Math.round((count / cityAlerts.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Day-of-week patterns
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts = new Array(7).fill(0);
  cityAlerts.forEach((a) => dayCounts[new Date(a.timestamp).getDay()]++);
  const dangerousDays = dayNames
    .map((day, i) => ({ day, count: dayCounts[i] }))
    .sort((a, b) => b.count - a.count);

  return {
    city: cityName,
    totalAlerts: cityAlerts.length,
    alertsLast24h: last24h.length,
    alertsLast7d: last7d.length,
    avgAlertsPerDay: Math.round(avgPerDay * 10) / 10,
    peakHour: {
      hour: maxHour,
      count: maxHourCount,
      label: `${String(maxHour).padStart(2, "0")}:00–${String(endHour).padStart(2, "0")}:00`,
    },
    lastAlertTime,
    hoursSinceLastAlert: hoursSinceLastAlert !== null ? Math.round(hoursSinceLastAlert * 10) / 10 : null,
    avgGapHours: Math.round(avgGapHours * 10) / 10,
    probabilityNext24h,
    probabilityNext6h,
    riskLevel,
    topCategories,
    dangerousDays,
  };
}

/** Get all unique city names — merges Oref database, hardcoded cities, and alert data */
export function allCityNames(alerts: ProcessedAlert[]): string[] {
  const names = new Set<string>(OREF_CITY_NAMES);
  // Add hardcoded cities
  Object.keys(cities).forEach((c) => names.add(c));
  // Add any cities from current alerts that aren't in the lists
  alerts.forEach((a) => a.cities.forEach((c) => names.add(c)));
  return Array.from(names).sort();
}
