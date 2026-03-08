CREATE TABLE public.healing_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Scan Report',
  session_type TEXT NOT NULL DEFAULT 'Mantra',
  content TEXT,
  pre_scan_data JSONB,
  post_scan_data JSONB,
  technical_metrics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.healing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.healing_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON public.healing_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);