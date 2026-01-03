-- Create table for songs within music projects
CREATE TABLE public.music_project_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.admin_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  workflow_stages JSONB NOT NULL DEFAULT '{"idea": false, "arrangement": false, "record": false, "mix": false, "master": false, "cover": false, "release": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_project_songs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins
CREATE POLICY "Admins can view songs" ON public.music_project_songs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert songs" ON public.music_project_songs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update songs" ON public.music_project_songs
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete songs" ON public.music_project_songs
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));