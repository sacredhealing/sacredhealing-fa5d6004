
-- Fix 1: Remove overly permissive profile read policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Fix 2: Restrict storage uploads/updates/deletes to admins for content buckets
DROP POLICY IF EXISTS "Allow authenticated users to upload to songs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload songs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update songs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete songs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload practitioner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update practitioner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete practitioner images" ON storage.objects;

CREATE POLICY "Admins can upload songs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'songs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update songs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'songs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete songs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'songs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload audio" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update audio" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete audio" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload practitioner images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'practitioners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update practitioner images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'practitioners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete practitioner images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'practitioners' AND public.has_role(auth.uid(), 'admin'));
