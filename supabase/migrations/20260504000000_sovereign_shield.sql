-- ============================================================
-- SQI SOVEREIGN SHIELD — Database Security Migration
-- File: supabase/migrations/20260504000000_sovereign_shield.sql
-- Apply via: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- NOTE: The profiles RLS + tier trigger sections alter public.profiles policies.
-- Review Community / leaderboard / cross-profile reads before applying in production.

-- ── 1. SECURITY EVENTS TABLE ─────────────────────────────────
-- Audit log for all security incidents

CREATE TABLE IF NOT EXISTS public.security_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  metadata    JSONB DEFAULT '{}',
  user_agent  TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast queries by user and type
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);

-- ── 2. RATE LIMIT EVENTS TABLE ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier  TEXT NOT NULL, -- IP address or user_id
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_events(identifier, created_at DESC);

-- Auto-clean rate limit events older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_events()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.rate_limit_events WHERE created_at < now() - INTERVAL '1 hour';
END;
$$;

-- ── 3. BLOCKED USERS TABLE ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  ip_address  INET,
  reason      TEXT NOT NULL,
  blocked_by  UUID REFERENCES auth.users(id),
  blocked_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at  TIMESTAMPTZ, -- NULL = permanent
  is_active   BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_email ON public.blocked_users(email);
CREATE INDEX IF NOT EXISTS idx_blocked_users_ip ON public.blocked_users(ip_address);

-- ── 4. ROW LEVEL SECURITY — ENABLE ON ALL TABLES ────────────

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can see all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.email() IN ('sacredhealingvibe@gmail.com', 'laila.amrouche@gmail.com')
  );

-- security_events: Users can insert (log client events), admins can read all
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can log events" ON public.security_events;
CREATE POLICY "Anyone authenticated can log events"
  ON public.security_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can read security events" ON public.security_events;
CREATE POLICY "Admins can read security events"
  ON public.security_events FOR SELECT
  USING (
    auth.email() IN ('sacredhealingvibe@gmail.com', 'laila.amrouche@gmail.com')
  );

-- rate_limit_events: Only service role writes
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for rate limits" ON public.rate_limit_events;
CREATE POLICY "Service role only for rate limits"
  ON public.rate_limit_events
  USING (false); -- All access via service role key only

-- blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage blocked users" ON public.blocked_users;
CREATE POLICY "Admins manage blocked users"
  ON public.blocked_users
  USING (
    auth.email() IN ('sacredhealingvibe@gmail.com', 'laila.amrouche@gmail.com')
  );

-- ── 5. SECURE PROFILES — PREVENT PRIVILEGE ESCALATION ───────
-- Users cannot manually set their own tier to premium

CREATE OR REPLACE FUNCTION public.prevent_tier_self_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only allow tier changes via service role (Stripe webhooks)
  IF auth.role() != 'service_role' THEN
    -- Preserve existing tier values — user cannot change these
    NEW.membership_tier := OLD.membership_tier;
    NEW.is_prana_flow := OLD.is_prana_flow;
    NEW.is_siddha_quantum := OLD.is_siddha_quantum;
    NEW.is_akasha_infinity := OLD.is_akasha_infinity;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_tier_escalation ON public.profiles;
CREATE TRIGGER prevent_tier_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tier_self_escalation();

-- ── 6. IS_BLOCKED CHECK FUNCTION ────────────────────────────
-- Call this from edge functions before processing requests

CREATE OR REPLACE FUNCTION public.is_user_blocked(check_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  blocked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.blocked_users
    WHERE user_id = check_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO blocked;
  RETURN blocked;
END;
$$;

-- ── 7. SECURITY SUMMARY VIEW (admin only) ───────────────────

CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT
  event_type,
  severity,
  COUNT(*) as count,
  MAX(created_at) as last_seen,
  MIN(created_at) as first_seen
FROM public.security_events
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY count DESC;

-- ── 8. AUTO-ALERT ON CRITICAL EVENTS ────────────────────────
-- Marks user blocked after 10 CRITICAL events

CREATE OR REPLACE FUNCTION public.auto_block_on_critical()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  critical_count INT;
BEGIN
  IF NEW.severity = 'CRITICAL' AND NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO critical_count
    FROM public.security_events
    WHERE user_id = NEW.user_id
      AND severity = 'CRITICAL'
      AND created_at > now() - INTERVAL '1 hour';

    IF critical_count >= 10 THEN
      INSERT INTO public.blocked_users (user_id, reason, blocked_at)
      SELECT NEW.user_id, 'Auto-blocked: 10+ CRITICAL events in 1 hour', now()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE bu.user_id = NEW.user_id
          AND bu.is_active = true
          AND (bu.expires_at IS NULL OR bu.expires_at > now())
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_block_trigger ON public.security_events;
CREATE TRIGGER auto_block_trigger
  AFTER INSERT ON public.security_events
  FOR EACH ROW EXECUTE FUNCTION public.auto_block_on_critical();

-- ── 9. CLEANUP CRON (run via pg_cron or Supabase scheduler) ─
-- Uncomment if pg_cron is enabled on your Supabase project

-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '0 * * * *',  -- Every hour
--   $$ SELECT public.cleanup_rate_limit_events(); $$
-- );

-- SELECT cron.schedule(
--   'cleanup-old-security-events',
--   '0 3 * * *',  -- Daily at 3am
--   $$ DELETE FROM public.security_events WHERE created_at < now() - INTERVAL '90 days'; $$
-- );

-- ── Done ─────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor
-- Then add SecurityProvider to src/App.tsx wrapping your routes
