
-- ============================================================
-- Lock down RLS policies flagged by security scanner
-- ============================================================

-- 1. affiliate_profiles: replace USING(true) public SELECT
DROP POLICY IF EXISTS "affiliate_profiles_public_code_check" ON public.affiliate_profiles;
-- Owner-scoped SELECT already exists; admin policy already exists. No public select needed.

-- 2. creative_soul_outputs: restrict service insert/update to service_role
DROP POLICY IF EXISTS "outputs_service_insert" ON public.creative_soul_outputs;
DROP POLICY IF EXISTS "outputs_service_update" ON public.creative_soul_outputs;
CREATE POLICY "outputs_service_insert" ON public.creative_soul_outputs
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "outputs_service_update" ON public.creative_soul_outputs
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- 3. influencer_partners: remove public email exposure; admins only
DROP POLICY IF EXISTS "Anyone can read active influencers" ON public.influencer_partners;
CREATE POLICY "Admins read influencer partners" ON public.influencer_partners
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. mantra_completions: remove broad read
DROP POLICY IF EXISTS "Authenticated users can view all completions" ON public.mantra_completions;

-- 5. meditations storage bucket: tighten upload policy to admins
DROP POLICY IF EXISTS "Admins can upload meditations" ON storage.objects;
CREATE POLICY "Admins can upload meditations" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meditations' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 6. membership_tiers: admins-only writes; public read still allowed
DROP POLICY IF EXISTS "Authenticated users can manage membership tiers" ON public.membership_tiers;
CREATE POLICY "Admins manage membership tiers" ON public.membership_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. monthly_costs: admin-only all access
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='monthly_costs' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.monthly_costs', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Admins manage monthly_costs" ON public.monthly_costs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. shop_orders: remove broad read; keep owner + admin
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.shop_orders;

-- 9. transformation_enrollments: remove broad read
DROP POLICY IF EXISTS "Authenticated users can view all enrollments" ON public.transformation_enrollments;

-- 10. user_memberships: remove broad read
DROP POLICY IF EXISTS "Authenticated users can view all memberships" ON public.user_memberships;

-- 11. user_wallet: replace misconfigured public ALL policy
DROP POLICY IF EXISTS "Service role can manage wallets" ON public.user_wallet;
CREATE POLICY "Service role can manage wallets" ON public.user_wallet
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 12. Admin-only writes for catalog content tables
DO $$
DECLARE
  tname text;
  pol RECORD;
  tables text[] := ARRAY[
    'transformation_programs','transformation_variations','mantras','music_tracks',
    'music_albums','lessons','courses','course_materials','album_tracks',
    'shop_products','practitioners','youtube_channels','session_types',
    'session_packages','income_streams','announcements'
  ];
BEGIN
  FOREACH tname IN ARRAY tables LOOP
    -- Drop any write/all policy that's gated only on auth.uid() IS NOT NULL
    FOR pol IN
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname='public' AND tablename=tname
        AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
        AND (
          coalesce(qual,'') ILIKE '%auth.uid() IS NOT NULL%'
          OR coalesce(with_check,'') ILIKE '%auth.uid() IS NOT NULL%'
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tname);
    END LOOP;

    -- Create unified admin-only write policy
    EXECUTE format($f$
      CREATE POLICY "Admins write %1$s" ON public.%1$I
        FOR ALL TO authenticated
        USING (public.has_role(auth.uid(), 'admin'::app_role))
        WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
    $f$, tname);
  END LOOP;
END $$;

-- 13. Also drop any "view all" broad SELECT on announcements
DROP POLICY IF EXISTS "Authenticated users can view all announcements" ON public.announcements;
