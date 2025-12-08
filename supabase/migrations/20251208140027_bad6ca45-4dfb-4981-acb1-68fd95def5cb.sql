-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to upload songs" ON storage.objects;

-- Create more permissive policy for uploading to songs bucket
CREATE POLICY "Allow authenticated users to upload to songs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'songs');