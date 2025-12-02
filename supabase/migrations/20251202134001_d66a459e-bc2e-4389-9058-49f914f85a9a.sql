-- Create public audio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio');

-- Allow public read access to audio files
CREATE POLICY "Public read access to audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio');

-- Allow authenticated users to delete audio
CREATE POLICY "Authenticated users can delete audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio');