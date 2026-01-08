-- QUICK FIX: Add script_text column to healing_audio table
-- Copy and paste this entire file into Supabase SQL Editor and click "Run"

-- Step 1: Add the script_text column
ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Step 2: Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

-- Step 3: Add admin UPDATE policy (if not already added)
DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Verify the column was added (this should return 1 row)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'healing_audio' 
AND column_name = 'script_text';

-- If the above query returns a row, the migration was successful!

