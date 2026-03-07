-- Siddha 2050: Deep Transformation Documents (Soul Scan / Bhakti Algorithms)
CREATE TABLE IF NOT EXISTS public.healing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL,
  content TEXT NOT NULL,
  pre_scan_data JSONB,
  post_scan_data JSONB,
  technical_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_healing_reports_user_created
  ON public.healing_reports(user_id, created_at DESC);

ALTER TABLE public.healing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own healing reports"
  ON public.healing_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own healing reports"
  ON public.healing_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage healing reports"
  ON public.healing_reports FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.healing_reports IS 'Siddha 2050 Deep Transformation Documents from Soul Scan / Digital Nadi.';
