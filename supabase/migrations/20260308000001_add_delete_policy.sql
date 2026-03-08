-- Allow deleting alerts (for data cleanup)
DO $$ BEGIN
  CREATE POLICY "Alerts deletable by service" ON alerts FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
