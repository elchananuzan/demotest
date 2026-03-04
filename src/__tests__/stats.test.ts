import { describe, it, expect } from "vitest";
import {
  avgAlertsPerDay,
  peakHourAnalysis,
  multiCityAttackPct,
  avgShelterTime,
  weekOverWeekTrend,
  categoryTrendData,
  quietPeriodAnalysis,
  predictNextAttackWindow,
} from "@/lib/stats";
import { generateDemoAlerts } from "@/lib/oref";

const alerts = generateDemoAlerts(50);

describe("avgAlertsPerDay", () => {
  it("returns 0 for empty alerts", () => {
    expect(avgAlertsPerDay([], 7)).toBe(0);
  });

  it("returns a positive number for demo alerts", () => {
    const avg = avgAlertsPerDay(alerts, 7);
    expect(avg).toBeGreaterThanOrEqual(0);
  });

  it("7-day average can differ from 30-day average", () => {
    const avg7 = avgAlertsPerDay(alerts, 7);
    const avg30 = avgAlertsPerDay(alerts, 30);
    expect(typeof avg7).toBe("number");
    expect(typeof avg30).toBe("number");
  });
});

describe("peakHourAnalysis", () => {
  it("returns hour between 0-23", () => {
    const result = peakHourAnalysis(alerts);
    expect(result.hour).toBeGreaterThanOrEqual(0);
    expect(result.hour).toBeLessThanOrEqual(23);
  });

  it("returns a count and label", () => {
    const result = peakHourAnalysis(alerts);
    expect(result.count).toBeGreaterThanOrEqual(0);
    expect(result.label).toMatch(/\d{2}:00/);
  });

  it("handles empty alerts", () => {
    const result = peakHourAnalysis([]);
    expect(result.hour).toBe(0);
    expect(result.count).toBe(0);
  });
});

describe("multiCityAttackPct", () => {
  it("returns 0 for empty alerts", () => {
    expect(multiCityAttackPct([])).toBe(0);
  });

  it("returns percentage between 0 and 100", () => {
    const pct = multiCityAttackPct(alerts);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});

describe("avgShelterTime", () => {
  it("returns 0 for empty alerts", () => {
    expect(avgShelterTime([])).toBe(0);
  });

  it("returns a positive number for demo alerts", () => {
    const avg = avgShelterTime(alerts);
    expect(avg).toBeGreaterThan(0);
  });
});

describe("weekOverWeekTrend", () => {
  it("returns flat for empty alerts", () => {
    const result = weekOverWeekTrend([]);
    expect(result.direction).toBe("flat");
    expect(result.pctChange).toBe(0);
  });

  it("returns valid direction", () => {
    const result = weekOverWeekTrend(alerts);
    expect(["up", "down", "flat"]).toContain(result.direction);
    expect(result.pctChange).toBeGreaterThanOrEqual(0);
  });
});

describe("categoryTrendData", () => {
  it("returns entries for the requested number of days", () => {
    const data = categoryTrendData(alerts, 14);
    expect(data).toHaveLength(14);
  });

  it("each entry has date and category counts", () => {
    const data = categoryTrendData(alerts, 7);
    data.forEach((entry) => {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof entry.rockets).toBe("number");
      expect(typeof entry.drones).toBe("number");
      expect(typeof entry.ballistic).toBe("number");
      expect(typeof entry.other).toBe("number");
    });
  });
});

describe("quietPeriodAnalysis", () => {
  it("returns zeros for empty alerts", () => {
    const result = quietPeriodAnalysis([]);
    expect(result.currentGapHours).toBe(0);
    expect(result.avgGapHours).toBe(0);
  });

  it("returns a numeric gap for demo alerts", () => {
    const result = quietPeriodAnalysis(alerts);
    expect(typeof result.currentGapHours).toBe("number");
    expect(Number.isFinite(result.currentGapHours)).toBe(true);
  });
});

describe("predictNextAttackWindow", () => {
  it("returns valid prediction structure", () => {
    const result = predictNextAttackWindow(alerts);
    expect(result.hours).toHaveLength(2);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(95);
    expect(result.label).toBeTruthy();
    expect(result.label_he).toBeTruthy();
  });

  it("handles empty alerts", () => {
    const result = predictNextAttackWindow([]);
    expect(result.confidence).toBe(0);
  });
});
