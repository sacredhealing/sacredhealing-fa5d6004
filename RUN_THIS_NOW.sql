-- ============================================================================
-- COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR AND CLICK "RUN"
-- This will add script_text column and enable saving scripts 100%
-- ============================================================================

-- Step 1: Add script_text column to healing_audio for pre-written meditation scripts
ALTER TABLE public.healing_audio 
ADD COLUMN IF NOT EXISTS script_text TEXT;

-- Step 2: Add index for faster queries on script_text
CREATE INDEX IF NOT EXISTS idx_healing_audio_script_text 
ON public.healing_audio(script_text) 
WHERE script_text IS NOT NULL;

-- Step 3: Ensure RLS is enabled (should already be enabled, but safe to check)
ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can insert healing audio" ON public.healing_audio;
DROP POLICY IF EXISTS "Admins can delete healing audio" ON public.healing_audio;

-- Step 5: Create admin UPDATE policy (allows admins to update script_text)
CREATE POLICY "Admins can update healing audio"
ON public.healing_audio
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 6: Create admin INSERT policy (allows admins to create new entries with script_text)
CREATE POLICY "Admins can insert healing audio"
ON public.healing_audio
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 7: Create admin DELETE policy (allows admins to delete entries)
CREATE POLICY "Admins can delete healing audio"
ON public.healing_audio
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- VERIFICATION: Run this query to confirm the column was added successfully
-- ============================================================================
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'healing_audio' 
AND column_name = 'script_text';

-- If the above query returns 1 row with column_name = 'script_text', 
-- then the migration was successful! ✅

