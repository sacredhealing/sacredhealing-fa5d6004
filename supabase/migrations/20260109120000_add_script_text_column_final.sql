-- Add script_text column to healing_audio table
-- Copy this entire SQL and run it in Supabase SQL Editor

ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;

CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

