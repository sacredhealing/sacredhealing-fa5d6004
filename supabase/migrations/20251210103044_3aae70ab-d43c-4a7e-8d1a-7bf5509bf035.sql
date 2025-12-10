-- Add calendly_url column to session_types table
ALTER TABLE public.session_types 
ADD COLUMN IF NOT EXISTS calendly_url text;

-- Add image_url column for practitioner images
ALTER TABLE public.session_types 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create RLS policies for admin management
CREATE POLICY "Authenticated users can manage session types" 
ON public.session_types 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage session packages" 
ON public.session_packages 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);