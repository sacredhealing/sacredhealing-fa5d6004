-- Add script_text column to healing_audio table
ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Create index for faster queries on script_text
CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

-- Ensure RLS is enabled
ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;

-- Create admin UPDATE policy (allows admins to update script_text)
CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin INSERT policy (allows admins to create new entries with script_text)
CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin DELETE policy (allows admins to delete entries)
CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));