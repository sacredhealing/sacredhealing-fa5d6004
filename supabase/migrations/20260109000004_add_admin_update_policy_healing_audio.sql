-- Add admin UPDATE policy for healing_audio table
-- This allows admins to update healing audio entries, including script_text

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;

-- Create admin-only update policy
CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also add INSERT and DELETE policies for admins (if they don't exist)
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;
CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

