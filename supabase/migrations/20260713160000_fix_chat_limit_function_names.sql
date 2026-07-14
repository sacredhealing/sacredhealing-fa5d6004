-- Corrections after verifying the REAL frontend call sites (the previous
-- migration's function-name assumptions were wrong for two of four chats):
--
-- REAL chat functions actually called from the app, verified against every
-- caller (not just supabase.functions.invoke — several use raw fetch() to a
-- CHAT_URL constant, which the earlier pass's grep missed entirely):
--   - ayurveda-chat        -> AyurvedaChatConsultation.tsx, AyurvedaLiveDoctor.tsx (correct, already fixed)
--   - vastu-chat            -> VastuTool.tsx (correct, already fixed)
--   - bhrigu-oracle         -> BhriguOraclePanel.tsx, BhriguAkashaChat.tsx, JyotishChamber.tsx
--                              (the REAL Jyotish/Bhrigu chat — vedic-guru-chat, which
--                              got the limit added previously, has ZERO callers, dead code)
--   - quantum-apothecary-chat -> chatService.ts, CreativeSoulMeditationTool.tsx
--                              (Akasha-Infinity exclusive, FEATURE_TIER.quantumApothecary = 3)
--   - guide-chat            -> ChatContainer.tsx — this is the general COMMUNITY chat,
--                              confirmed genuinely free-tier accessible (no tier gate
--                              anywhere in ChatContainer.tsx, and listed as a free
--                              feature on the Atma-Seed page). The previous migration
--                              wrongly lumped this into the paid-only shared pool,
--                              which gave free-tier users a limit of 0 — a real
--                              regression, breaking something that was supposed to
--                              work. Fixed here with its own function and real
--                              free-tier allowance.

-- Correct the shared pool to the real paid-only Ayurveda/Vastu/Jyotish chats.
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
    WHEN p_tier_slug = 'akasha-infinity' THEN 50  -- placeholder, not confirmed
    ELSE 0
  END;

  IF v_limit = 0 THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_used
  FROM public.rate_limit_log
  WHERE user_id = p_user_id
    AND function_name IN ('ayurveda-chat', 'vastu-chat', 'bhrigu-oracle')
    AND created_at >= v_window_start;

  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, 0, v_limit;
  ELSE
    RETURN QUERY SELECT true, (v_limit - v_used - 1), v_limit;
  END IF;
END;
$$;

-- Separate function for the Akasha-Infinity-only Quantum Apothecary chat.
-- Not shared with the other pool since it's gated to a different tier entirely.
CREATE OR REPLACE FUNCTION public.check_daily_apothecary_limit(p_user_id UUID, p_tier_slug TEXT)
RETURNS TABLE(allowed BOOLEAN, remaining INT, daily_limit INT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_limit INT;
  v_used INT;
  v_window_start TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  v_limit := CASE WHEN p_tier_slug = 'akasha-infinity' THEN 50 ELSE 0 END;  -- placeholder
  IF v_limit = 0 THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;
  SELECT COUNT(*) INTO v_used
  FROM public.rate_limit_log
  WHERE user_id = p_user_id AND function_name = 'quantum-apothecary-chat' AND created_at >= v_window_start;
  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, 0, v_limit;
  ELSE
    RETURN QUERY SELECT true, (v_limit - v_used - 1), v_limit;
  END IF;
END;
$$;

-- Separate function for the general Community chat (guide-chat), genuinely
-- free-tier accessible. Real numbers, not zero for free — this is the fix
-- for the regression.
CREATE OR REPLACE FUNCTION public.check_daily_community_chat_limit(p_user_id UUID, p_tier_slug TEXT)
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
    WHEN p_tier_slug = 'akasha-infinity' THEN 50
    WHEN p_tier_slug = 'siddha-quantum' THEN 30
    WHEN p_tier_slug = 'prana-flow' THEN 20
    ELSE 8  -- free tier: real, non-zero allowance — placeholder number, confirm with Kritagya/Laila
  END;
  SELECT COUNT(*) INTO v_used
  FROM public.rate_limit_log
  WHERE user_id = p_user_id AND function_name = 'guide-chat' AND created_at >= v_window_start;
  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, 0, v_limit;
  ELSE
    RETURN QUERY SELECT true, (v_limit - v_used - 1), v_limit;
  END IF;
END;
$$;
