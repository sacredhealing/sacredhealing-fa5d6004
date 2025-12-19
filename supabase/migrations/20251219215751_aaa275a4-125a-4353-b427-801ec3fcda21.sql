-- Create music_completions table for tracking music play completions
CREATE TABLE public.music_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.music_tracks(id),
  duration_listened INTEGER NOT NULL DEFAULT 0,
  shc_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view their own music completions"
ON public.music_completions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert their own music completions"
ON public.music_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for anti-farming lookup
CREATE INDEX idx_music_completions_user_track_time 
ON public.music_completions(user_id, track_id, completed_at DESC);

-- Create index for mantra_completions anti-farming lookup
CREATE INDEX idx_mantra_completions_user_mantra_time 
ON public.mantra_completions(user_id, mantra_id, completed_at DESC);

-- Create index for meditation_completions anti-farming lookup
CREATE INDEX idx_meditation_completions_user_meditation_time 
ON public.meditation_completions(user_id, meditation_id, completed_at DESC);