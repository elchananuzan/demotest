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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_category ON alerts(category);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Alerts are viewable by everyone" ON alerts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Alerts insertable by service" ON alerts FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Alerts upsertable by service" ON alerts FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
