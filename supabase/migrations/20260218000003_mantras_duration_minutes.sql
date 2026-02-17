-- Siddha Core: Normalize mantra durations to minutes
-- Keep duration_seconds for backward compatibility, but establish duration_minutes as canonical.

ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Backfill from duration_seconds when needed
UPDATE public.mantras
SET duration_minutes = GREATEST(1, CEIL((duration_seconds::numeric) / 60.0))::int
WHERE duration_minutes IS NULL
  AND duration_seconds IS NOT NULL;

-- Default for new rows
ALTER TABLE public.mantras
  ALTER COLUMN duration_minutes SET DEFAULT 3;

-- Basic guardrail (avoid breaking existing installs where constraint already differs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mantras_duration_minutes_check'
      AND conrelid = 'public.mantras'::regclass
  ) THEN
    ALTER TABLE public.mantras
      ADD CONSTRAINT mantras_duration_minutes_check CHECK (duration_minutes IS NULL OR duration_minutes >= 1);
  END IF;
END $$;

