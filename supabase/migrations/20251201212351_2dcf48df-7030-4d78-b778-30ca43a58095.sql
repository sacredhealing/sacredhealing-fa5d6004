-- Create storage bucket for meditation audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meditations', 'meditations', true);

-- Storage policies for meditations bucket
CREATE POLICY "Anyone can view meditations"
ON storage.objects FOR SELECT
USING (bucket_id = 'meditations');

CREATE POLICY "Admins can upload meditations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meditations');

-- Create meditations table
CREATE TABLE public.meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  shc_reward INTEGER NOT NULL DEFAULT 5,
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

-- Everyone can view meditations
CREATE POLICY "Anyone can view meditations"
ON public.meditations FOR SELECT
USING (true);

-- Track user meditation completions
CREATE TABLE public.meditation_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meditation_id UUID NOT NULL REFERENCES public.meditations(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_listened INTEGER NOT NULL DEFAULT 0,
  shc_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, meditation_id, completed_at)
);

-- Enable RLS
ALTER TABLE public.meditation_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
ON public.meditation_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
ON public.meditation_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);