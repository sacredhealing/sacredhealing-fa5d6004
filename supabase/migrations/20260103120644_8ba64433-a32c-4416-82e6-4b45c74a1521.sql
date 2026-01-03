-- Add file_url columns to admin_projects for courses and projects
ALTER TABLE public.admin_projects ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.admin_projects ADD COLUMN IF NOT EXISTS file_urls JSONB DEFAULT '[]'::jsonb;

-- Add file_url column to music_project_songs for individual song files
ALTER TABLE public.music_project_songs ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add comments
COMMENT ON COLUMN public.admin_projects.file_url IS 'Primary file URL for the project';
COMMENT ON COLUMN public.admin_projects.file_urls IS 'Array of additional file URLs for the project';
COMMENT ON COLUMN public.music_project_songs.file_url IS 'Audio file URL for the song';