ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_period_date date,
  ADD COLUMN IF NOT EXISTS cycle_length integer NOT NULL DEFAULT 28,
  ADD COLUMN IF NOT EXISTS bleed_days integer NOT NULL DEFAULT 5;