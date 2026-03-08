// Pikud HaOref API types and polling

// Real-time alert format (alerts.json)
export interface OrefAlert {
  id: string;
  cat: string;
  title: string;
  data: string[];
  desc: string;
}

// History alert format (GetAlarmsHistory.aspx)
export interface OrefHistoryAlert {
  data: string;           // single city name, e.g. "מטולה"
  date: string;           // "04.03.2026"
  time: string;           // "20:42:04"
  alertDate: string;      // "2026-03-04T20:42:00"
  category: number;       // numeric category
  category_desc: string;  // Hebrew description
  matrix_id: number;
  rid: number;            // unique record id
}

export interface ProcessedAlert {
  id: string;
  timestamp: string;
  category: number;
  category_name: string;
  cities: string[];
  title: string;
  description: string;
  raw_data: OrefAlert;
}

export const ALERT_CATEGORIES: Record<number, { en: string; he: string; color: string }> = {
  1: { en: "Rockets & Missiles", he: "ירי רקטות וטילים", color: "#ff3333" },
  2: { en: "UAV (Drone)", he: "כלי טיס עוין (כטב\"מ)", color: "#ff6600" },
  3: { en: "Radiological", he: "חדירת רדיולוגית", color: "#ff00ff" },
  4: { en: "Earthquake", he: "רעידת אדמה", color: "#ffaa00" },
  5: { en: "Tsunami", he: "צונאמי", color: "#0088ff" },
  6: { en: "Hostile Aircraft", he: "חדירת כלי טיס עוין", color: "#ff6600" },
  7: { en: "Hazardous Materials", he: "אירוע חומ\"ס", color: "#ffcc00" },
  13: { en: "Terrorist Infiltration", he: "חדירת מחבלים", color: "#ff0000" },
};

export function getCategoryInfo(cat: number) {
  return ALERT_CATEGORIES[cat] || { en: "Unknown", he: "לא ידוע", color: "#888899" };
}

/** Process a real-time alert (alerts.json) — these are currently active */
export function processOrefAlert(alert: OrefAlert): ProcessedAlert {
  const category = parseInt(alert.cat, 10);
  const catInfo = getCategoryInfo(category);
  return {
    id: alert.id || `alert-${Date.now()}`,
    timestamp: new Date().toISOString(), // real-time alerts are happening NOW
    category,
    category_name: catInfo.en,
    cities: alert.data || [],
    title: alert.title,
    description: alert.desc,
    raw_data: alert,
  };
}

/**
 * Group history records into alerts.
 * The API returns one record per city — records sharing the same alertDate + category
 * represent a single alert targeting multiple locations.
 */
export function groupHistoryAlerts(records: OrefHistoryAlert[]): ProcessedAlert[] {
  // Include all categories — cat 13 (early warning/event ended) and cat 14
  // (alerts expected) are real alerts that targeted these cities
  const meaningful = records;

  // Group by alertDate + category
  const groups = new Map<string, OrefHistoryAlert[]>();
  for (const record of meaningful) {
    const key = `${record.alertDate}|${record.category}`;
    const group = groups.get(key);
    if (group) {
      group.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  // Convert each group into a single ProcessedAlert with all cities
  const alerts: ProcessedAlert[] = [];
  groups.forEach((group) => {
    const first = group[0];
    const category = mapHistoryCategory(first.category);
    const catInfo = getCategoryInfo(category);
    const cities = group
      .map((r: OrefHistoryAlert) => r.data?.trim())
      .filter((c: string | undefined): c is string => Boolean(c));
    // Deduplicate cities within the same alert
    const seen = new Set<string>();
    const uniqueCities = cities.filter((c: string) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
    const timestamp = first.alertDate
      ? new Date(first.alertDate + "+03:00").toISOString()
      : new Date().toISOString();

    alerts.push({
      id: `hist-${first.rid}`,
      timestamp,
      category,
      category_name: catInfo.en,
      cities: uniqueCities,
      title: first.category_desc || catInfo.he,
      description: catInfo.he,
      raw_data: {
        id: String(first.rid),
        cat: String(category),
        title: first.category_desc || catInfo.he,
        data: uniqueCities,
        desc: catInfo.he,
      },
    });
  });

  return alerts;
}

/** Map history API category numbers to our category system */
function mapHistoryCategory(historyCat: number): number {
  switch (historyCat) {
    case 1: return 1;   // Rockets & Mortars
    case 2: return 6;   // Hostile Aircraft Intrusion
    case 3: case 4: case 5: case 6: return 7; // General / Hazardous
    case 7: case 8: return 4;   // Earthquake
    case 9: return 3;   // Radiological
    case 10: return 13; // Terrorist Infiltration → Ballistic
    case 11: return 5;  // Tsunami
    case 12: return 7;  // Hazardous Materials
    case 13: return 13; // Event ended (rockets/ballistic)
    case 14: return 1;  // "Alerts expected in your area" → Rockets
    default: return 1;  // Default to rockets
  }
}

// Threat level calculation
export type ThreatLevel = "green" | "yellow" | "orange" | "red";

export function calculateThreatLevel(alertsLast24h: number, activeAlerts: boolean): {
  level: ThreatLevel;
  label_en: string;
  label_he: string;
  color: string;
} {
  if (activeAlerts) {
    return { level: "red", label_en: "CRITICAL", label_he: "קריטי", color: "#ff3333" };
  }
  if (alertsLast24h > 50) {
    return { level: "orange", label_en: "HIGH", label_he: "גבוה", color: "#ff6600" };
  }
  if (alertsLast24h > 10) {
    return { level: "yellow", label_en: "ELEVATED", label_he: "מוגבר", color: "#ffcc00" };
  }
  return { level: "green", label_en: "LOW", label_he: "נמוך", color: "#00ff88" };
}

// Demo data for development — generates 30 days of alerts for meaningful stats
export function generateDemoAlerts(count: number = 80): ProcessedAlert[] {
  const demoAlerts: ProcessedAlert[] = [];
  const cityNames = [
    "תל אביב", "חיפה", "ירושלים", "באר שבע", "אשדוד", "אשקלון",
    "שדרות", "קריית שמונה", "נהריה", "עכו", "צפת", "נתניה",
    "רחובות", "פתח תקווה", "ראשון לציון", "חולון", "אילת",
  ];
  const categories = [1, 1, 1, 1, 2, 6, 13]; // weighted toward rockets

  for (let i = 0; i < count; i++) {
    // Weight recent days more heavily: 30% today, 20% yesterday, 50% spread over remaining 28 days
    const roll = Math.random();
    const daysAgo = roll < 0.3
      ? Math.random() * 0.8 // today (within last ~19 hours)
      : roll < 0.5
        ? 1 + Math.random() * 0.8 // yesterday
        : 2 + Math.random() * 28; // older
    const baseHour = Math.random();
    // 40% chance of night attack (02-05), 30% morning (06-10), 30% other
    const hour = baseHour < 0.4
      ? 2 + Math.random() * 3
      : baseHour < 0.7
        ? 6 + Math.random() * 4
        : Math.random() * 24;
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    timestamp.setHours(Math.floor(hour), Math.floor(Math.random() * 60));

    const cat = categories[Math.floor(Math.random() * categories.length)];
    const numCities = Math.floor(Math.random() * 7) + 1;
    const alertCities: string[] = [];
    for (let j = 0; j < numCities; j++) {
      const city = cityNames[Math.floor(Math.random() * cityNames.length)];
      if (!alertCities.includes(city)) alertCities.push(city);
    }
    const catInfo = getCategoryInfo(cat);

    demoAlerts.push({
      id: `demo-${i}-${timestamp.getTime()}`,
      timestamp: timestamp.toISOString(),
      category: cat,
      category_name: catInfo.en,
      cities: alertCities,
      title: catInfo.he,
      description: "היכנס למרחב מוגן",
      raw_data: {
        id: `demo-${i}`,
        cat: String(cat),
        title: catInfo.he,
        data: alertCities,
        desc: "היכנס למרחב מוגן",
      },
    });
  }

  return demoAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Activity options for "Where Were You"
export const WHERE_WERE_YOU_OPTIONS = [
  { key: "sleeping", en: "Sleeping", he: "ישנתי" },
  { key: "eating", en: "Eating", he: "אכלתי" },
  { key: "shower", en: "In the shower", he: "במקלחת" },
  { key: "driving", en: "Driving", he: "נהגתי" },
  { key: "working", en: "Working", he: "עבדתי" },
  { key: "family", en: "With family", he: "עם המשפחה" },
  { key: "school", en: "At school", he: "בבית ספר" },
  { key: "kids", en: "With the kids", he: "עם הילדים" },
] as const;
