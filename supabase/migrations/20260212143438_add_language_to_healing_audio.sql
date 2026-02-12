-- Add language column to healing_audio table
-- This allows filtering healing audios by language (en, sv, es, no)

ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'sv', 'es', 'no'));

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_healing_audio_language 
ON public.healing_audio(language) 
WHERE language IS NOT NULL;

-- Update existing records to have default language 'en' if null
UPDATE public.healing_audio 
SET language = 'en' 
WHERE language IS NULL;
