ALTER TABLE public.healing_audio
  ADD COLUMN IF NOT EXISTS required_tier text NOT NULL DEFAULT 'free';

ALTER TABLE public.healing_audio
  DROP CONSTRAINT IF EXISTS healing_audio_required_tier_check;

ALTER TABLE public.healing_audio
  ADD CONSTRAINT healing_audio_required_tier_check
  CHECK (required_tier IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity'));

UPDATE public.healing_audio
SET required_tier = CASE WHEN is_free THEN 'free' ELSE 'prana-flow' END;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.healing_audio TO authenticated;
GRANT ALL ON public.healing_audio TO service_role;
GRANT SELECT ON public.healing_audio TO anon;