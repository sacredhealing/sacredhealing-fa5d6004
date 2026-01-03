-- Add music-specific columns to admin_projects table
ALTER TABLE public.admin_projects 
ADD COLUMN IF NOT EXISTS music_type text,
ADD COLUMN IF NOT EXISTS workflow_stages jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS distrokid_released boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS added_to_app boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.admin_projects.music_type IS 'Type of music project: album, single, meditation, beats, light_language, frequency, affirmations, mantra';
COMMENT ON COLUMN public.admin_projects.workflow_stages IS 'JSON object tracking music workflow stages: idea, arrangement, record, mix, master, cover, release';
COMMENT ON COLUMN public.admin_projects.distrokid_released IS 'Whether the music has been distributed via DistroKid';
COMMENT ON COLUMN public.admin_projects.added_to_app IS 'Whether the music has been added inside the app';