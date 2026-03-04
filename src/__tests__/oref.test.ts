import { describe, it, expect } from "vitest";
import {
  getCategoryInfo,
  calculateThreatLevel,
  generateDemoAlerts,
  ALERT_CATEGORIES,
  WHERE_WERE_YOU_OPTIONS,
} from "@/lib/oref";

describe("getCategoryInfo", () => {
  it("returns correct info for known categories", () => {
    const rockets = getCategoryInfo(1);
    expect(rockets.en).toBe("Rockets & Missiles");
    expect(rockets.color).toBe("#ff3333");

    const infiltration = getCategoryInfo(13);
    expect(infiltration.en).toBe("Terrorist Infiltration");
    expect(infiltration.he).toBe("חדירת מחבלים");
  });

  it("returns unknown for unrecognized categories", () => {
    const unknown = getCategoryInfo(999);
    expect(unknown.en).toBe("Unknown");
    expect(unknown.he).toBe("לא ידוע");
  });
});

describe("calculateThreatLevel", () => {
  it("returns red/CRITICAL when active alerts exist", () => {
    const result = calculateThreatLevel(5, true);
    expect(result.level).toBe("red");
    expect(result.label_en).toBe("CRITICAL");
  });

  it("returns orange/HIGH when >50 alerts in 24h", () => {
    const result = calculateThreatLevel(51, false);
    expect(result.level).toBe("orange");
    expect(result.label_en).toBe("HIGH");
  });

  it("returns yellow/ELEVATED when >10 alerts in 24h", () => {
    const result = calculateThreatLevel(15, false);
    expect(result.level).toBe("yellow");
    expect(result.label_en).toBe("ELEVATED");
  });

  it("returns green/LOW when <=10 alerts and no active", () => {
    const result = calculateThreatLevel(5, false);
    expect(result.level).toBe("green");
    expect(result.label_en).toBe("LOW");
  });
});

describe("generateDemoAlerts", () => {
  it("generates the requested number of alerts", () => {
    const alerts = generateDemoAlerts(10);
    expect(alerts).toHaveLength(10);
  });

  it("generates alerts with valid structure", () => {
    const alerts = generateDemoAlerts(5);
    alerts.forEach((alert) => {
      expect(alert.id).toBeTruthy();
      expect(alert.timestamp).toBeTruthy();
      expect(alert.category).toBeGreaterThan(0);
      expect(alert.cities.length).toBeGreaterThan(0);
      expect(new Date(alert.timestamp).getTime()).not.toBeNaN();
    });
  });

  it("returns alerts sorted by timestamp descending", () => {
    const alerts = generateDemoAlerts(20);
    for (let i = 1; i < alerts.length; i++) {
      expect(new Date(alerts[i - 1].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(alerts[i].timestamp).getTime()
      );
    }
  });

  it("defaults to 80 alerts", () => {
    const alerts = generateDemoAlerts();
    expect(alerts).toHaveLength(80);
  });
});

describe("ALERT_CATEGORIES", () => {
  it("has required category entries", () => {
    expect(ALERT_CATEGORIES[1]).toBeDefined();
    expect(ALERT_CATEGORIES[2]).toBeDefined();
    expect(ALERT_CATEGORIES[13]).toBeDefined();
  });

  it("each category has en, he, color", () => {
    Object.values(ALERT_CATEGORIES).forEach((cat) => {
      expect(cat.en).toBeTruthy();
      expect(cat.he).toBeTruthy();
      expect(cat.color).toMatch(/^#/);
    });
  });
});

describe("WHERE_WERE_YOU_OPTIONS", () => {
  it("has 8 options", () => {
    expect(WHERE_WERE_YOU_OPTIONS).toHaveLength(8);
  });

  it("each option has key, en, he", () => {
    WHERE_WERE_YOU_OPTIONS.forEach((opt) => {
      expect(opt.key).toBeTruthy();
      expect(opt.en).toBeTruthy();
      expect(opt.he).toBeTruthy();
    });
  });
});
