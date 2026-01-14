-- Add progress tracking columns to creative_soul_jobs
ALTER TABLE public.creative_soul_jobs
ADD COLUMN IF NOT EXISTS progress_step text,
ADD COLUMN IF NOT EXISTS progress_percent integer DEFAULT 0;

-- Create job events table for step history logging
CREATE TABLE IF NOT EXISTS public.creative_soul_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.creative_soul_jobs(id) ON DELETE CASCADE,
  event text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_soul_job_events ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own job events
CREATE POLICY "job_events_own_read" ON public.creative_soul_job_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.creative_soul_jobs j
    WHERE j.id = creative_soul_job_events.job_id
      AND j.user_id = auth.uid()
  )
);

-- Create creative_soul_outputs table for storing final outputs
CREATE TABLE IF NOT EXISTS public.creative_soul_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.creative_soul_jobs(id) ON DELETE CASCADE,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_soul_outputs ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own outputs
CREATE POLICY "outputs_own_read" ON public.creative_soul_outputs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.creative_soul_jobs j
    WHERE j.id = creative_soul_outputs.job_id
      AND j.user_id = auth.uid()
  )
);

-- Policy: service role can insert outputs (for worker callback)
CREATE POLICY "outputs_service_insert" ON public.creative_soul_outputs
FOR INSERT WITH CHECK (true);

-- Policy: service role can update outputs
CREATE POLICY "outputs_service_update" ON public.creative_soul_outputs
FOR UPDATE USING (true);

-- Add index for faster job lookups
CREATE INDEX IF NOT EXISTS idx_creative_soul_job_events_job_id ON public.creative_soul_job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_creative_soul_outputs_job_id ON public.creative_soul_outputs(job_id);