
-- ── 1. SECURITY EVENTS ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  metadata    JSONB DEFAULT '{}'::jsonb,
  user_agent  TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);

-- ── 2. RATE LIMIT EVENTS ────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_events(identifier, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_events()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.rate_limit_events WHERE created_at < now() - INTERVAL '1 hour';
END;
$$;

-- ── 3. BLOCKED USERS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  ip_address  INET,
  reason      TEXT NOT NULL,
  blocked_by  UUID REFERENCES auth.users(id),
  blocked_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_email ON public.blocked_users(email);
CREATE INDEX IF NOT EXISTS idx_blocked_users_ip ON public.blocked_users(ip_address);

-- ── 4. RLS ──────────────────────────────────────────
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can log security events" ON public.security_events;
CREATE POLICY "Authenticated can log security events"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can read security events" ON public.security_events;
CREATE POLICY "Admins can read security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read rate limit events" ON public.rate_limit_events;
CREATE POLICY "Admins can read rate limit events"
  ON public.rate_limit_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage blocked users" ON public.blocked_users;
CREATE POLICY "Admins manage blocked users"
  ON public.blocked_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ── 5. is_user_blocked helper ───────────────────────
CREATE OR REPLACE FUNCTION public.is_user_blocked(check_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE blocked BOOLEAN;
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

-- ── 6. Security dashboard view (admin filtered via base RLS) ──
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT event_type, severity, COUNT(*) AS count,
       MAX(created_at) AS last_seen, MIN(created_at) AS first_seen
FROM public.security_events
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY count DESC;

-- ── 7. Auto-block trigger on critical events ────────
CREATE OR REPLACE FUNCTION public.auto_block_on_critical()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE critical_count INT;
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

-- ── 8. Realtime ─────────────────────────────────────
ALTER TABLE public.security_events REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'security_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events';
  END IF;
END $$;
