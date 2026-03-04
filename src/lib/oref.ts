// Pikud HaOref API types and polling
export interface OrefAlert {
  id: string;
  cat: string;
  title: string;
  data: string[];
  desc: string;
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

export const ALERT_CATEGORIES: Record<number, { en: string; he: string; icon: string; color: string }> = {
  1: { en: "Rockets & Mortars", he: "ירי רקטות ומרגמות", icon: "🚀", color: "#ff3333" },
  2: { en: "UAV (Drone)", he: "כלי טיס עוין (כטב\"מ)", icon: "✈️", color: "#ff6600" },
  3: { en: "Radiological", he: "חדירת רדיולוגית", icon: "☢️", color: "#ff00ff" },
  4: { en: "Earthquake", he: "רעידת אדמה", icon: "🌍", color: "#ffaa00" },
  5: { en: "Tsunami", he: "צונאמי", icon: "🌊", color: "#0088ff" },
  6: { en: "Hostile Aircraft", he: "חדירת כלי טיס עוין", icon: "🛩️", color: "#ff6600" },
  7: { en: "Hazardous Materials", he: "אירוע חומ\"ס", icon: "⚠️", color: "#ffcc00" },
  13: { en: "Ballistic Missile", he: "טיל בליסטי", icon: "🎯", color: "#ff0000" },
};

export function getCategoryInfo(cat: number) {
  return ALERT_CATEGORIES[cat] || { en: "Unknown", he: "לא ידוע", icon: "⚠️", color: "#888899" };
}

export function processOrefAlert(alert: OrefAlert): ProcessedAlert {
  const category = parseInt(alert.cat, 10);
  const catInfo = getCategoryInfo(category);
  return {
    id: alert.id || `alert-${Date.now()}`,
    timestamp: new Date().toISOString(),
    category,
    category_name: catInfo.en,
    cities: alert.data || [],
    title: alert.title,
    description: alert.desc,
    raw_data: alert,
  };
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

// Demo data for development (when Oref API is unavailable)
export function generateDemoAlerts(count: number = 20): ProcessedAlert[] {
  const demoAlerts: ProcessedAlert[] = [];
  const cityNames = [
    "תל אביב", "חיפה", "ירושלים", "באר שבע", "אשדוד", "אשקלון",
    "שדרות", "קריית שמונה", "נהריה", "עכו", "צפת", "נתניה",
    "רחובות", "פתח תקווה", "ראשון לציון", "חולון", "אילת",
  ];
  const categories = [1, 1, 1, 1, 2, 6, 13]; // weighted toward rockets

  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.random() * 72;
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const numCities = Math.floor(Math.random() * 5) + 1;
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
  { key: "sleeping", emoji: "🛏️", en: "Sleeping", he: "ישנתי" },
  { key: "eating", emoji: "🍽️", en: "Eating", he: "אכלתי" },
  { key: "shower", emoji: "🚿", en: "In the shower", he: "במקלחת" },
  { key: "driving", emoji: "🚗", en: "Driving", he: "נהגתי" },
  { key: "working", emoji: "💼", en: "Working", he: "עבדתי" },
  { key: "family", emoji: "👨‍👩‍👧", en: "With family", he: "עם המשפחה" },
  { key: "school", emoji: "🏫", en: "At school", he: "בבית ספר" },
  { key: "kids", emoji: "😴", en: "With the kids", he: "עם הילדים" },
] as const;
