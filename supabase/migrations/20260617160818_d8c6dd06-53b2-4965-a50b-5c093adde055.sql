
-- ── Helper: map textual tier_required to numeric level
CREATE OR REPLACE FUNCTION public.tier_name_to_level(tier_name text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(tier_name,'free'))
    WHEN 'free' THEN 0
    WHEN 'prana-flow' THEN 1
    WHEN 'prana_flow' THEN 1
    WHEN 'siddha-quantum' THEN 2
    WHEN 'siddha_quantum' THEN 2
    WHEN 'akasha-infinity' THEN 3
    WHEN 'akasha_infinity' THEN 3
    ELSE 0
  END;
$$;

-- ── ayurveda_courses: tier-gated SELECT
DROP POLICY IF EXISTS ayurveda_courses_select_published ON public.ayurveda_courses;
CREATE POLICY ayurveda_courses_select_published
ON public.ayurveda_courses
FOR SELECT
USING (
  is_published = true
  AND (
    public.tier_name_to_level(tier_required) = 0
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.current_user_tier_level() >= public.tier_name_to_level(tier_required)
  )
);

-- ── jyotish_modules: tier-gated SELECT (replace both anon-preview + auth policies)
DROP POLICY IF EXISTS jyotish_modules_select_anon_preview ON public.jyotish_modules;
DROP POLICY IF EXISTS jyotish_modules_select_authenticated ON public.jyotish_modules;
CREATE POLICY jyotish_modules_select_published
ON public.jyotish_modules
FOR SELECT
USING (
  is_published = true
  AND (
    public.tier_name_to_level(tier_required) = 0
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.current_user_tier_level() >= public.tier_name_to_level(tier_required)
  )
);

-- ── shreem_brzee_*: re-enable RLS, public read, service-role writes
ALTER TABLE public.shreem_brzee_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY shreem_signals_public_read ON public.shreem_brzee_signals FOR SELECT USING (true);
CREATE POLICY shreem_signals_service_write ON public.shreem_brzee_signals FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.shreem_brzee_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY shreem_session_public_read ON public.shreem_brzee_session FOR SELECT USING (true);
CREATE POLICY shreem_session_service_write ON public.shreem_brzee_session FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.shreem_brzee_paper_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY shreem_trades_public_read ON public.shreem_brzee_paper_trades FOR SELECT USING (true);
CREATE POLICY shreem_trades_service_write ON public.shreem_brzee_paper_trades FOR ALL TO service_role USING (true) WITH CHECK (true);
