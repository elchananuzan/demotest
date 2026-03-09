-- Create a public storage bucket for custom alert sounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('sounds', 'sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files (max 10MB handled by app)
CREATE POLICY "Anyone can upload sounds"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sounds');

-- Allow anyone to read sounds
CREATE POLICY "Anyone can read sounds"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sounds');

-- Allow anyone to delete their sounds (by path)
CREATE POLICY "Anyone can delete sounds"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sounds');
