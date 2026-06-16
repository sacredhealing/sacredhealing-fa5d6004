
-- Tier helper function
CREATE OR REPLACE FUNCTION public.current_user_tier_level()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(mt.order_index), 0)
  FROM public.user_memberships um
  JOIN public.membership_tiers mt ON mt.id = um.tier_id
  WHERE um.user_id = auth.uid()
    AND um.status = 'active'
    AND (um.expires_at IS NULL OR um.expires_at > now());
$$;
GRANT EXECUTE ON FUNCTION public.current_user_tier_level() TO authenticated, anon;

-- Mantras: gate premium rows by tier
DROP POLICY IF EXISTS "Anyone can view active mantras" ON public.mantras;
CREATE POLICY "View mantras by tier"
ON public.mantras FOR SELECT
USING (
  is_active = true AND (
    COALESCE(required_tier, 0) = 0
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid() IS NOT NULL AND public.current_user_tier_level() >= COALESCE(required_tier, 0))
  )
);

-- Meditations: gate premium rows
DROP POLICY IF EXISTS "Anyone can view meditations" ON public.meditations;
CREATE POLICY "View meditations by tier"
ON public.meditations FOR SELECT
USING (
  COALESCE(is_premium, false) = false
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() IS NOT NULL AND public.current_user_tier_level() >= 1)
);

-- Divine transmissions: gate paid by tier
DROP POLICY IF EXISTS "Anyone can view published transmissions" ON public.divine_transmissions;
CREATE POLICY "View published transmissions by tier"
ON public.divine_transmissions FOR SELECT
USING (
  published = true AND (
    COALESCE(is_free, false) = true
    OR COALESCE(required_tier, 0) = 0
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (auth.uid() IS NOT NULL AND public.current_user_tier_level() >= COALESCE(required_tier, 0))
  )
);
