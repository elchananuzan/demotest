import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface AlertRecord {
  id: string;
  timestamp: string;
  category: number;
  category_name: string;
  cities: string[];
  title: string;
  description: string;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface WhereWereYouRecord {
  id: string;
  alert_id: string;
  activity: string;
  count: number;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  endpoint: string;
  keys: Record<string, string>;
  created_at: string;
}

// Supabase schema SQL (run this in Supabase SQL editor)
export const SCHEMA_SQL = `
-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  cities TEXT[] NOT NULL DEFAULT '{}',
  title TEXT,
  description TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Where Were You responses
CREATE TABLE IF NOT EXISTS where_were_you (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT REFERENCES alerts(id),
  activity TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_category ON alerts(category);
CREATE INDEX IF NOT EXISTS idx_where_were_you_alert ON where_were_you(alert_id);
CREATE INDEX IF NOT EXISTS idx_where_were_you_activity ON where_were_you(activity);

-- RLS policies
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE where_were_you ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alerts are viewable by everyone" ON alerts FOR SELECT USING (true);
CREATE POLICY "Alerts insertable by service" ON alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Where were you viewable by everyone" ON where_were_you FOR SELECT USING (true);
CREATE POLICY "Where were you insertable by everyone" ON where_were_you FOR INSERT WITH CHECK (true);

CREATE POLICY "Push subs insertable by everyone" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Push subs deletable by owner" ON push_subscriptions FOR DELETE USING (true);
`;

// Helper functions
export async function getAlerts(limit = 100) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AlertRecord[];
}

export async function getAlertsToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .gte("timestamp", today.toISOString())
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data as AlertRecord[];
}

export async function getAlerts24h() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .gte("timestamp", since.toISOString())
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return data as AlertRecord[];
}

export async function insertAlert(alert: Omit<AlertRecord, "created_at">) {
  const { data, error } = await supabase.from("alerts").upsert(alert);
  if (error) throw error;
  return data;
}

export async function submitWhereWereYou(alertId: string, activity: string) {
  const { data, error } = await supabase
    .from("where_were_you")
    .insert({ alert_id: alertId, activity, count: 1 });
  if (error) throw error;
  return data;
}

export async function getWhereWereYouStats(alertId: string) {
  const { data, error } = await supabase
    .from("where_were_you")
    .select("activity, count")
    .eq("alert_id", alertId);
  if (error) throw error;

  const stats: Record<string, number> = {};
  data?.forEach((row) => {
    stats[row.activity] = (stats[row.activity] || 0) + row.count;
  });
  return stats;
}

export async function getWhereWereYouAggregated() {
  const { data, error } = await supabase
    .from("where_were_you")
    .select("activity, count");
  if (error) throw error;

  const stats: Record<string, number> = {};
  let total = 0;
  data?.forEach((row) => {
    stats[row.activity] = (stats[row.activity] || 0) + row.count;
    total += row.count;
  });
  return { stats, total };
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  });
  if (error) throw error;
}
