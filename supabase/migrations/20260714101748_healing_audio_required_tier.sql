-- =============================================================================
-- Add required_tier to healing_audio (Admin Healing panel tier selector)
-- Canonical slugs, matching src/lib/tierAccess.ts and Stripe/admin-grant conventions:
--   free, prana-flow, siddha-quantum, akasha-infinity
-- Run this via Lovable's SQL editor (Supabase is locked inside Lovable for this project).
-- =============================================================================

ALTER TABLE public.healing_audio
  ADD COLUMN IF NOT EXISTS required_tier text NOT NULL DEFAULT 'free';

ALTER TABLE public.healing_audio
  DROP CONSTRAINT IF EXISTS healing_audio_required_tier_check;

ALTER TABLE public.healing_audio
  ADD CONSTRAINT healing_audio_required_tier_check
  CHECK (required_tier IN ('free', 'prana-flow', 'siddha-quantum', 'akasha-infinity'));

-- Backfill from the existing is_free boolean, exactly as requested:
-- everything that was free -> Atma-Seed (free), everything premium -> Prana-Flow.
UPDATE public.healing_audio
SET required_tier = CASE WHEN is_free THEN 'free' ELSE 'prana-flow' END;
