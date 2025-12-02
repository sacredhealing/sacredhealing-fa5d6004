-- Add new columns to custom_meditation_bookings for the creation service
ALTER TABLE public.custom_meditation_bookings
ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS frequency text,
ADD COLUMN IF NOT EXISTS sound_type text,
ADD COLUMN IF NOT EXISTS custom_description text,
ADD COLUMN IF NOT EXISTS include_voice_addon boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_file_url text,
ADD COLUMN IF NOT EXISTS contract_signed boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.custom_meditation_bookings.service_type IS 'personal for channeled meditation, creation for influencer meditation creation service';