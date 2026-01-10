-- ============================================
-- Add script_text column to meditations table
-- ============================================
-- This allows storing meditation scripts for recording purposes

-- Add script_text column to meditations table
ALTER TABLE public.meditations 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_meditations_script_text 
ON public.meditations(script_text) 
WHERE script_text IS NOT NULL;

-- Ensure RLS policies allow admins to update scripts
DROP POLICY IF EXISTS "Admins can update meditations" ON public.meditations;
CREATE POLICY "Admins can update meditations"
ON public.meditations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure admins can insert meditations
DROP POLICY IF EXISTS "Admins can insert meditations" ON public.meditations;
CREATE POLICY "Admins can insert meditations"
ON public.meditations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure admins can delete meditations
DROP POLICY IF EXISTS "Admins can delete meditations" ON public.meditations;
CREATE POLICY "Admins can delete meditations"
ON public.meditations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

