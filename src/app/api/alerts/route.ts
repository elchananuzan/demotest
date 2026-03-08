import { NextResponse } from "next/server";
import {
  processOrefAlert,
  groupHistoryAlerts,
  generateDemoAlerts,
  type OrefAlert,
  type OrefHistoryAlert,
  type ProcessedAlert,
} from "@/lib/oref";

const OREF_ALERTS_URL = "https://www.oref.org.il/warningMessages/alert/Alerts.json";
const OREF_HISTORY_URL = "https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&mode=1";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const PROXY_URL = process.env.OREF_PROXY_URL; // e.g. https://me-west1-xxx.cloudfunctions.net/oref-proxy
const PROXY_KEY = process.env.OREF_PROXY_KEY || "";

const OREF_HEADERS = {
  "Referer": "https://www.oref.org.il/",
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Build the fetch URLs — use proxy if configured, otherwise direct Oref */
function getUrls() {
  if (PROXY_URL) {
    const base = PROXY_URL.replace(/\/+$/, "");
    const keyParam = PROXY_KEY ? `?key=${PROXY_KEY}` : "";
    return {
      alerts: `${base}/alerts${keyParam}`,
      history: `${base}/history${keyParam}`,
      headers: {}, // proxy handles Oref headers
    };
  }
  return {
    alerts: OREF_ALERTS_URL,
    history: OREF_HISTORY_URL,
    headers: OREF_HEADERS,
  };
}

export async function GET() {
  // Explicit demo mode
  if (IS_DEMO) {
    return NextResponse.json(generateDemoAlerts(80));
  }

  try {
    const urls = getUrls();

    // Fetch from Pikud HaOref (directly or via proxy)
    const [alertsRes, historyRes] = await Promise.allSettled([
      fetch(urls.alerts, {
        headers: { ...urls.headers, ...(PROXY_URL ? {} : { "Client": "true" }) },
        next: { revalidate: 0 },
      }),
      fetch(urls.history, {
        headers: urls.headers,
        next: { revalidate: 0 },
      }),
    ]);

    const allAlerts: ProcessedAlert[] = [];

    // Process current (real-time) alerts
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

    // Process history from GetAlarmsHistory — returns one record per city,
    // group by alertDate+category to form multi-city alerts
    if (historyRes.status === "fulfilled" && historyRes.value.ok) {
      try {
        const historyText = await historyRes.value.text();
        const history = JSON.parse(historyText);
        if (Array.isArray(history)) {
          allAlerts.push(...groupHistoryAlerts(history as OrefHistoryAlert[]));
        }
      } catch {
        // History parse error — non-fatal
      }
    }

    // Deduplicate by timestamp+cities (history might overlap with current)
    const seen = new Set<string>();
    const deduped = allAlerts.filter((a) => {
      const key = `${a.timestamp}-${a.cities.join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // If we got real data, return it. Otherwise fall back to demo
    // (Oref API is geo-restricted to Israel — outside IL, both endpoints fail)
    if (deduped.length > 0) {
      return NextResponse.json(deduped);
    }

    // No data — likely geo-blocked. Fall back to demo so the site isn't empty.
    return NextResponse.json(generateDemoAlerts(80));
  } catch (err) {
    console.error("Failed to fetch from Oref API:", err);
    return NextResponse.json(generateDemoAlerts(80));
  }
}
