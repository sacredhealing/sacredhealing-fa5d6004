-- Add timezone column to profiles table for Hora Watch synchronization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_timezone TEXT DEFAULT 'Europe/Stockholm';

-- Add index for timezone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_timezone ON public.profiles(user_timezone);

COMMENT ON COLUMN public.profiles.user_timezone IS 'User timezone for accurate Hora Watch calculations (IANA format)';