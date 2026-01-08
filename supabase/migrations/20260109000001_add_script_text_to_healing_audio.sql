-- Add script_text column to healing_audio for pre-written meditation scripts
ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text ON public.healing_audio(script_text) WHERE script_text IS NOT NULL;

