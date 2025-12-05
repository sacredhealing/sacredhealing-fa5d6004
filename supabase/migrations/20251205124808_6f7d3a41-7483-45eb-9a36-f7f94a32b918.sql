-- Add new columns to announcements table for enhanced features
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS link_url text,
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS recurring text;

COMMENT ON COLUMN public.announcements.image_url IS 'Optional image URL for the announcement';
COMMENT ON COLUMN public.announcements.link_url IS 'Optional website link for the announcement';
COMMENT ON COLUMN public.announcements.audio_url IS 'Optional audio snippet URL';
COMMENT ON COLUMN public.announcements.recurring IS 'Recurring schedule: null, weekly';