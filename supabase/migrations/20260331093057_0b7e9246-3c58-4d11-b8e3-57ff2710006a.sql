-- Table 1: Track user activity events for weekly email segmentation
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_log_user_date ON public.user_activity_log (user_id, created_at DESC);
CREATE INDEX idx_user_activity_log_type ON public.user_activity_log (activity_type);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to activity log" ON public.user_activity_log
  FOR ALL USING (
    (SELECT current_setting('role') = 'service_role')
  );

-- Table 2: Track which weekly emails were sent to avoid duplicates
CREATE TABLE IF NOT EXISTS public.user_weekly_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  segment TEXT NOT NULL,
  email_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_type TEXT NOT NULL DEFAULT 'weekly_alignment',
  UNIQUE(user_id, week_start, email_type)
);

CREATE INDEX idx_weekly_email_log_user ON public.user_weekly_email_log (user_id, week_start DESC);

ALTER TABLE public.user_weekly_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email log" ON public.user_weekly_email_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to email log" ON public.user_weekly_email_log
  FOR ALL USING (
    (SELECT current_setting('role') = 'service_role')
  );