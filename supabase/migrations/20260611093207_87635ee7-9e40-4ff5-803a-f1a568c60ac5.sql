
-- Service-role-only: drop public ALL policies (service_role bypasses RLS, no policy needed)
DROP POLICY IF EXISTS "Service role can manage events" ON public.affiliate_events;
DROP POLICY IF EXISTS "Service role can manage attribution" ON public.affiliate_attribution;
DROP POLICY IF EXISTS "Service role can manage all bot entitlements" ON public.bot_entitlements;
DROP POLICY IF EXISTS "Service role can manage awards" ON public.coin_awards;
DROP POLICY IF EXISTS "Service role can manage entitlements" ON public.creative_soul_entitlements;

-- Announcements: drop broad authenticated write policies (admin policy remains)
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;

-- Music tracks/albums: drop broad write policies (admin policy remains)
DROP POLICY IF EXISTS "Authenticated users can insert music tracks" ON public.music_tracks;
DROP POLICY IF EXISTS "Authenticated users can update music tracks" ON public.music_tracks;
DROP POLICY IF EXISTS "Authenticated users can delete music tracks" ON public.music_tracks;
DROP POLICY IF EXISTS "Authenticated users can insert albums" ON public.music_albums;
DROP POLICY IF EXISTS "Authenticated users can update albums" ON public.music_albums;
DROP POLICY IF EXISTS "Authenticated users can delete albums" ON public.music_albums;

-- Session packages/types: drop broad management policies (admin policy remains)
DROP POLICY IF EXISTS "Authenticated users can manage session packages" ON public.session_packages;
DROP POLICY IF EXISTS "Authenticated users can manage session types" ON public.session_types;

-- mastering-uploads: restrict to owner-folder
DROP POLICY IF EXISTS "Authenticated users can view all mastering files" ON storage.objects;

-- support_requests: owner + admin only read
DROP POLICY IF EXISTS "Anyone can view requests" ON public.support_requests;
CREATE POLICY "Users can view own requests"
  ON public.support_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all requests"
  ON public.support_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Remove sensitive table from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.stripe_webhook_logs;
