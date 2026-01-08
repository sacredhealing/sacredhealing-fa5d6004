-- Add script_text column to content_tasks for pre-written meditation scripts
ALTER TABLE public.content_tasks 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_tasks_script_text ON public.content_tasks(script_text) WHERE script_text IS NOT NULL;

