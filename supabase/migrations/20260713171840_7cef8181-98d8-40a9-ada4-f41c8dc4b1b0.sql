CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_log TO authenticated;
GRANT ALL ON public.rate_limit_log TO service_role;

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_user_fn_time
  ON public.rate_limit_log(user_id, function_name, created_at);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rate limit usage" ON public.rate_limit_log;
CREATE POLICY "Users can view their own rate limit usage"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record their own rate limit usage" ON public.rate_limit_log;
CREATE POLICY "Users can record their own rate limit usage"
ON public.rate_limit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages rate limit usage" ON public.rate_limit_log;
CREATE POLICY "Service role manages rate limit usage"
ON public.rate_limit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'free';

WITH resolved AS (
  SELECT
    p.user_id,
    COALESCE(
      (
        SELECT mt.slug
        FROM public.user_memberships um
        JOIN public.membership_tiers mt ON mt.id = um.tier_id
        WHERE um.user_id = p.user_id
          AND um.status IN ('active', 'trialing')
          AND (um.expires_at IS NULL OR um.expires_at > now())
        ORDER BY
          CASE
            WHEN mt.slug = 'akasha-infinity' THEN 3
            WHEN mt.slug = 'siddha-quantum' THEN 2
            WHEN mt.slug = 'prana-flow' THEN 1
            ELSE 0
          END DESC,
          um.updated_at DESC
        LIMIT 1
      ),
      (
        SELECT aga.tier
        FROM public.admin_granted_access aga
        WHERE aga.user_id = p.user_id
          AND aga.is_active = true
          AND aga.access_type = 'membership'
          AND (aga.expires_at IS NULL OR aga.expires_at > now())
        ORDER BY
          CASE
            WHEN aga.tier = 'akasha-infinity' THEN 3
            WHEN aga.tier = 'siddha-quantum' THEN 2
            WHEN aga.tier = 'prana-flow' THEN 1
            ELSE 0
          END DESC,
          aga.updated_at DESC
        LIMIT 1
      ),
      p.membership_tier,
      'free'
    ) AS tier
  FROM public.profiles p
)
UPDATE public.profiles p
SET membership_tier = resolved.tier
FROM resolved
WHERE p.user_id = resolved.user_id
  AND p.membership_tier IS DISTINCT FROM resolved.tier;

CREATE OR REPLACE FUNCTION public.check_daily_apothecary_limit(p_user_id uuid, p_tier_slug text)
RETURNS TABLE(allowed boolean, remaining integer, daily_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_used integer;
  v_effective_tier text;
  v_window_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  SELECT COALESCE(
    (
      SELECT mt.slug
      FROM public.user_memberships um
      JOIN public.membership_tiers mt ON mt.id = um.tier_id
      WHERE um.user_id = p_user_id
        AND um.status IN ('active', 'trialing')
        AND (um.expires_at IS NULL OR um.expires_at > now())
      ORDER BY
        CASE
          WHEN mt.slug = 'akasha-infinity' THEN 3
          WHEN mt.slug = 'siddha-quantum' THEN 2
          WHEN mt.slug = 'prana-flow' THEN 1
          ELSE 0
        END DESC,
        um.updated_at DESC
      LIMIT 1
    ),
    (
      SELECT aga.tier
      FROM public.admin_granted_access aga
      WHERE aga.user_id = p_user_id
        AND aga.is_active = true
        AND aga.access_type = 'membership'
        AND (aga.expires_at IS NULL OR aga.expires_at > now())
      ORDER BY
        CASE
          WHEN aga.tier = 'akasha-infinity' THEN 3
          WHEN aga.tier = 'siddha-quantum' THEN 2
          WHEN aga.tier = 'prana-flow' THEN 1
          ELSE 0
        END DESC,
        aga.updated_at DESC
      LIMIT 1
    ),
    NULLIF(lower(coalesce(p_tier_slug, '')), ''),
    'free'
  ) INTO v_effective_tier;

  v_limit := CASE WHEN v_effective_tier = 'akasha-infinity' THEN 50 ELSE 0 END;

  IF v_limit = 0 THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_used
  FROM public.rate_limit_log
  WHERE user_id = p_user_id
    AND function_name = 'quantum-apothecary-chat'
    AND created_at >= v_window_start;

  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, 0, v_limit;
  ELSE
    RETURN QUERY SELECT true, (v_limit - v_used - 1), v_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_daily_apothecary_limit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_daily_apothecary_limit(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_daily_apothecary_limit(uuid, text) TO service_role;