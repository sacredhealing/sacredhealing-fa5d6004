-- Create creative_soul_jobs table for tracking audio generation jobs
CREATE TABLE public.creative_soul_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  result_url TEXT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_creative_soul_jobs_user_id ON public.creative_soul_jobs(user_id);
CREATE INDEX idx_creative_soul_jobs_job_id ON public.creative_soul_jobs(job_id);
CREATE INDEX idx_creative_soul_jobs_status ON public.creative_soul_jobs(status);

-- Enable RLS
ALTER TABLE public.creative_soul_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs"
  ON public.creative_soul_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all jobs (for edge functions)
CREATE POLICY "Service role can manage jobs"
  ON public.creative_soul_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_creative_soul_jobs_updated_at
  BEFORE UPDATE ON public.creative_soul_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();