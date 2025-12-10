-- Create practitioners storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('practitioners', 'practitioners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to practitioners bucket
CREATE POLICY "Authenticated users can upload practitioner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'practitioners');

-- Allow public to view practitioner images
CREATE POLICY "Public can view practitioner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'practitioners');

-- Allow authenticated users to delete practitioner images
CREATE POLICY "Authenticated users can delete practitioner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'practitioners');

-- Allow authenticated users to update practitioner images
CREATE POLICY "Authenticated users can update practitioner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'practitioners');