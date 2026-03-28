-- ═══════════════════════════════════════════════════════════════════════════
-- DEPLOY_TRACKING.sql — run in Supabase Dashboard → SQL Editor (project owner)
-- Creates: user_activity_log, user_weekly_email_log
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log (created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own activity" ON public.user_activity_log;
CREATE POLICY "Users insert own activity"
  ON public.user_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own activity" ON public.user_activity_log;
CREATE POLICY "Users read own activity"
  ON public.user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_weekly_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_weekly_email_log_user_week UNIQUE (user_id, week_key)
);

CREATE INDEX IF NOT EXISTS idx_user_weekly_email_log_sent_at ON public.user_weekly_email_log (sent_at DESC);

ALTER TABLE public.user_weekly_email_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_activity_log IS 'Optional app analytics / engagement events per user.';
COMMENT ON TABLE public.user_weekly_email_log IS 'Dedup log for weekly alignment emails (one row per user per ISO week_key).';
