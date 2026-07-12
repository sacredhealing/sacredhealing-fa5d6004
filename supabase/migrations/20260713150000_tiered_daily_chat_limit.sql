-- Tier-aware daily chat limit, built on top of the existing rate_limit_log
-- table (previously only used for a flat 30/hour anti-abuse ceiling on
-- ayurveda-chat). This adds a SEPARATE, SHARED daily cap across all four
-- Gemini-powered chat functions (ayurveda-chat, guide-chat, vastu-chat,
-- vedic-guru-chat) — shared because the concern is total AI cost per
-- member, not cost per individual chat type. A Prana-Flow member could
-- otherwise use all four chats at 15 each and still cost 60/day.
--
-- Free tier already has zero chat access (confirmed in AyurvedaTool.tsx:
-- canChat = membership !== FREE) so no limit needed there — it's already
-- fully blocked before this function would ever be called.
--
-- Limits: Prana-Flow 15/day, Siddha-Quantum 25/day. Akasha-Infinity set to
-- 50/day here as a placeholder — confirm with Kritagya/Laila and adjust;
-- not specified in the conversation that requested this.

CREATE OR REPLACE FUNCTION public.check_daily_chat_limit(p_user_id UUID, p_tier_slug TEXT)
RETURNS TABLE(allowed BOOLEAN, remaining INT, daily_limit INT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_limit INT;
  v_used INT;
  v_window_start TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  v_limit := CASE
    WHEN p_tier_slug = 'prana-flow' THEN 15
    WHEN p_tier_slug = 'siddha-quantum' THEN 25
    WHEN p_tier_slug = 'akasha-infinity' THEN 50  -- placeholder, confirm real number
    ELSE 0  -- free / unrecognized tier: no chat access
  END;

  IF v_limit = 0 THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_used
  FROM public.rate_limit_log
  WHERE user_id = p_user_id
    AND function_name IN ('ayurveda-chat', 'guide-chat', 'vastu-chat', 'vedic-guru-chat')
    AND created_at >= v_window_start;

  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, 0, v_limit;
  ELSE
    RETURN QUERY SELECT true, (v_limit - v_used - 1), v_limit;
  END IF;
END;
$$;
