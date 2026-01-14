-- Drop any failed policies from previous attempt
DROP POLICY IF EXISTS "Public read access for creative-soul-library" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload to creative-soul-library" ON storage.objects;
DROP POLICY IF EXISTS "Admin update creative-soul-library" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete from creative-soul-library" ON storage.objects;

-- Create storage bucket for creative soul sound library
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('creative-soul-library', 'creative-soul-library', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for creative-soul-library bucket
CREATE POLICY "Public read access for creative-soul-library"
ON storage.objects FOR SELECT
USING (bucket_id = 'creative-soul-library');

CREATE POLICY "Admin upload to creative-soul-library"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'creative-soul-library' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin update creative-soul-library"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'creative-soul-library' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin delete from creative-soul-library"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'creative-soul-library' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Drop table if partially created
DROP TABLE IF EXISTS public.sound_library;

-- Create sound library table to track metadata
CREATE TABLE public.sound_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  style TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  is_loopable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sound_library ENABLE ROW LEVEL SECURITY;

-- Public read access for sounds
CREATE POLICY "Public read access for sound_library"
ON public.sound_library FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access to sound_library"
ON public.sound_library FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create index for faster lookups by style
CREATE INDEX idx_sound_library_style ON public.sound_library(style);
CREATE INDEX idx_sound_library_category ON public.sound_library(category);

-- Add trigger for updated_at
CREATE TRIGGER update_sound_library_updated_at
BEFORE UPDATE ON public.sound_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();