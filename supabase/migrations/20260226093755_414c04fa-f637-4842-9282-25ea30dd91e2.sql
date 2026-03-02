
-- Add missing columns to meditations table
ALTER TABLE public.meditations ADD COLUMN IF NOT EXISTS script_text TEXT;
ALTER TABLE public.meditations ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- Add admin INSERT policy
CREATE POLICY "Admins can insert meditations"
ON public.meditations
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin UPDATE policy
CREATE POLICY "Admins can update meditations"
ON public.meditations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin DELETE policy
CREATE POLICY "Admins can delete meditations"
ON public.meditations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
