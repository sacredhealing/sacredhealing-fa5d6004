-- Add is_premium to mantras for membership gating (Free vs Premium)
ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mantras.is_premium IS 'When true, mantra is only available to app members (Premium). When false, available to all (Free).';
