-- Add last_activity_date column to profiles for tracking flame brightness
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Update existing profiles to set last_activity_date based on their most recent completion
UPDATE public.profiles p
SET last_activity_date = COALESCE(
  (
    SELECT GREATEST(
      COALESCE((SELECT MAX(completed_at::DATE) FROM public.meditation_completions WHERE user_id = p.user_id), '1970-01-01'::DATE),
      COALESCE((SELECT MAX(completed_at::DATE) FROM public.mantra_completions WHERE user_id = p.user_id), '1970-01-01'::DATE),
      COALESCE((SELECT MAX(completed_at::DATE) FROM public.music_completions WHERE user_id = p.user_id), '1970-01-01'::DATE)
    )
  ),
  NULL
)
WHERE last_activity_date IS NULL;

-- Set to null if the date is the fallback '1970-01-01'
UPDATE public.profiles 
SET last_activity_date = NULL 
WHERE last_activity_date = '1970-01-01'::DATE;