-- ============================================================
-- Stage 1: Unified Mantra View (Single Source of Truth)
-- ============================================================
-- Creates a PostgreSQL view that handles minutes/seconds conversion globally
-- Ensures /admin/mantras and /mantras never lose data or show "ghosted" entries

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.mantras_unified CASCADE;

-- Create unified view with automatic duration normalization
CREATE VIEW public.mantras_unified AS
SELECT 
  id,
  title,
  description,
  audio_url,
  cover_image_url,
  -- Canonical duration in minutes (always present)
  COALESCE(
    duration_minutes,
    CASE 
      WHEN duration_seconds IS NOT NULL AND duration_seconds > 0 
      THEN GREATEST(1, CEIL((duration_seconds::numeric) / 60.0))::integer
      ELSE 3 -- Default fallback
    END
  ) AS duration_minutes,
  -- Keep seconds for backward compatibility
  COALESCE(
    duration_seconds,
    CASE 
      WHEN duration_minutes IS NOT NULL AND duration_minutes > 0
      THEN duration_minutes * 60
      ELSE 180 -- Default fallback
    END
  ) AS duration_seconds,
  shc_reward,
  play_count,
  is_active,
  category,
  planet_type,
  is_premium,
  created_at,
  updated_at
FROM public.mantras;

-- Grant access to authenticated users
GRANT SELECT ON public.mantras_unified TO authenticated;

-- Create comment for documentation
COMMENT ON VIEW public.mantras_unified IS 
  'Unified mantra view ensuring /admin/mantras and /mantras share single source of truth. Automatically handles minutes/seconds conversion to prevent data loss.';
