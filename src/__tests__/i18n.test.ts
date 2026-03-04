import { describe, it, expect } from "vitest";
import { translations, getDirection } from "@/lib/i18n";

describe("translations", () => {
  it("has both en and he locales", () => {
    expect(translations.en).toBeDefined();
    expect(translations.he).toBeDefined();
  });

  it("en and he have the same top-level keys", () => {
    const enKeys = Object.keys(translations.en).sort();
    const heKeys = Object.keys(translations.he).sort();
    expect(enKeys).toEqual(heKeys);
  });

  it("nav section has all required keys", () => {
    const requiredKeys = ["live", "stories", "stats", "timeline", "brief"];
    requiredKeys.forEach((key) => {
      expect(translations.en.nav).toHaveProperty(key);
      expect(translations.he.nav).toHaveProperty(key);
    });
  });
});

describe("getDirection", () => {
  it("returns rtl for Hebrew", () => {
    expect(getDirection("he")).toBe("rtl");
  });

  it("returns ltr for English", () => {
    expect(getDirection("en")).toBe("ltr");
  });
});
