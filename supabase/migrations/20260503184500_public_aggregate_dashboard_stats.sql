-- KPI aggregates for Admin Dashboard / Leaderboard / Community totals.
-- Client COUNT/SUM under RLS only sees rows the JWT may access (often "self only"),
-- which wrongly showed ~1 member. This RPC runs elevated counts inside SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.public_aggregate_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN json_build_object(
    'total_profiles', (SELECT COUNT(*)::bigint FROM public.profiles),
    'active_this_month', (
      SELECT COUNT(DISTINCT user_id)::bigint
      FROM public.shc_transactions
      WHERE created_at >= date_trunc('month', now())
    ),
    'total_shc_distributed', COALESCE(
      (SELECT SUM(total_earned)::numeric FROM public.user_balances),
      0::numeric
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.public_aggregate_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_aggregate_dashboard_stats() TO authenticated;
