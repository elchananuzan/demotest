import { NextResponse } from "next/server";
import { processOrefAlert, generateDemoAlerts, type OrefAlert } from "@/lib/oref";

const OREF_ALERTS_URL = "https://www.oref.org.il/WarningMessages/alert/alerts.json";
const OREF_HISTORY_URL = "https://www.oref.org.il/WarningMessages/History/AlertsHistory.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Try fetching from Pikud HaOref
    const [alertsRes, historyRes] = await Promise.allSettled([
      fetch(OREF_ALERTS_URL, {
        headers: {
          "Referer": "https://www.oref.org.il/",
          "X-Requested-With": "XMLHttpRequest",
          "Client": "true",
        },
        next: { revalidate: 0 },
      }),
      fetch(OREF_HISTORY_URL, {
        headers: {
          "Referer": "https://www.oref.org.il/",
          "X-Requested-With": "XMLHttpRequest",
        },
        next: { revalidate: 0 },
      }),
    ]);

    const allAlerts = [];

    // Process current alerts
    if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
      const text = await alertsRes.value.text();
      if (text.trim()) {
        try {
          const data = JSON.parse(text) as OrefAlert | OrefAlert[];
          const alerts = Array.isArray(data) ? data : [data];
          allAlerts.push(...alerts.map(processOrefAlert));
        } catch {
          // Empty or invalid JSON from oref is normal when no active alerts
        }
      }
    }

    // Process history
    if (historyRes.status === "fulfilled" && historyRes.value.ok) {
      try {
        const history = await historyRes.value.json();
        if (Array.isArray(history)) {
          allAlerts.push(...history.slice(0, 100).map(processOrefAlert));
        }
      } catch {
        // History parse error
      }
    }

    // If we got real data, return it
    if (allAlerts.length > 0) {
      return NextResponse.json(allAlerts);
    }

    // Fallback to demo data
    return NextResponse.json(generateDemoAlerts(30));
  } catch {
    // On any error, return demo data
    return NextResponse.json(generateDemoAlerts(30));
  }
}
