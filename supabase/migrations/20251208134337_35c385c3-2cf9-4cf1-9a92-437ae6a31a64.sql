-- Create songs bucket for audio uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to songs bucket
CREATE POLICY "Authenticated users can upload songs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'songs');

-- Allow public read access to songs
CREATE POLICY "Anyone can view songs"
ON storage.objects FOR SELECT
USING (bucket_id = 'songs');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete songs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'songs');