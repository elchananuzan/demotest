import { NextResponse } from "next/server";
import {
  processOrefAlert,
  type OrefAlert,
  type ProcessedAlert,
  ALERT_CATEGORIES,
} from "@/lib/oref";

const PROXY_URL = process.env.OREF_PROXY_URL;
const PROXY_KEY = process.env.OREF_PROXY_KEY || "";
const PUSH_API_KEY = process.env.PUSH_API_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

const OREF_ALERTS_URL = "https://www.oref.org.il/warningMessages/alert/Alerts.json";
const OREF_HEADERS = {
  Referer: "https://www.oref.org.il/",
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
};

// In-memory store for recently seen alert IDs (resets on cold start)
// For production at scale, use KV/Redis, but for a cron running every minute this works.
const seenAlerts = new Set<string>();
const MAX_SEEN = 500;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch current alerts (real-time — only during active sirens)
    const currentAlerts = await fetchCurrentAlerts();

    if (currentAlerts.length === 0) {
      return NextResponse.json({ checked: true, newAlerts: 0 });
    }

    // Find new alerts we haven't seen
    const newAlerts = currentAlerts.filter((a) => !seenAlerts.has(a.id));

    if (newAlerts.length === 0) {
      return NextResponse.json({ checked: true, newAlerts: 0 });
    }

    // Mark as seen
    for (const alert of newAlerts) {
      seenAlerts.add(alert.id);
      // Trim if too large
      if (seenAlerts.size > MAX_SEEN) {
        const first = seenAlerts.values().next().value;
        if (first) seenAlerts.delete(first);
      }
    }

    // Send push notifications for new alerts
    let pushSent = 0;
    for (const alert of newAlerts) {
      const catInfo = ALERT_CATEGORIES[alert.category];
      const cityList = alert.cities.slice(0, 5).join(", ");
      const cityExtra = alert.cities.length > 5 ? ` +${alert.cities.length - 5}` : "";

      const sent = await sendPush({
        title: catInfo?.en || "Alert",
        body: `${cityList}${cityExtra}`,
        tag: `alert-${alert.id}`,
        url: "/",
        category: alert.category,
      });
      if (sent) pushSent++;
    }

    return NextResponse.json({
      checked: true,
      newAlerts: newAlerts.length,
      pushSent,
    });
  } catch (err) {
    console.error("Cron check-alerts error:", err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}

async function fetchCurrentAlerts(): Promise<ProcessedAlert[]> {
  try {
    let url: string;
    let headers: Record<string, string>;

    if (PROXY_URL) {
      const base = PROXY_URL.replace(/\/+$/, "");
      const keyParam = PROXY_KEY ? `?key=${PROXY_KEY}` : "";
      url = `${base}/alerts${keyParam}`;
      headers = {};
    } else {
      url = OREF_ALERTS_URL;
      headers = { ...OREF_HEADERS, Client: "true" };
    }

    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];

    const text = await res.text();
    if (!text.trim()) return [];

    const data = JSON.parse(text) as OrefAlert | OrefAlert[];
    const alerts = Array.isArray(data) ? data : [data];
    return alerts.map(processOrefAlert);
  } catch {
    return [];
  }
}

async function sendPush(payload: {
  title: string;
  body: string;
  tag: string;
  url: string;
  category: number;
}): Promise<boolean> {
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${origin}/api/push/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PUSH_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
