-- FINAL RLS FIX FOR DEMO MODE
-- This fixes the "Database configuration needed" error

-- Step 1: Make user_id nullable (if not already)
ALTER TABLE creative_soul_jobs 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop and recreate foreign key to allow NULL
ALTER TABLE creative_soul_jobs 
DROP CONSTRAINT IF EXISTS creative_soul_jobs_user_id_fkey;

ALTER TABLE creative_soul_jobs 
ADD CONSTRAINT creative_soul_jobs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 3: Drop ALL existing policies on creative_soul_jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON creative_soul_jobs;
DROP POLICY IF EXISTS "Service role can manage jobs" ON creative_soul_jobs;
DROP POLICY IF EXISTS "Service role can insert jobs" ON creative_soul_jobs;
DROP POLICY IF EXISTS "Service role can update jobs" ON creative_soul_jobs;
DROP POLICY IF EXISTS "Service role can delete jobs" ON creative_soul_jobs;

-- Step 4: Create SELECT policy (allows viewing jobs with NULL user_id for demo)
CREATE POLICY "Users can view their own jobs"
ON creative_soul_jobs FOR SELECT
USING (
    auth.uid() = user_id OR 
    user_id IS NULL OR
    auth.role() = 'service_role'
);

-- Step 5: Create INSERT policy (CRITICAL - allows service role to insert with NULL user_id)
CREATE POLICY "Service role can insert jobs"
ON creative_soul_jobs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Step 6: Create UPDATE policy
CREATE POLICY "Service role can update jobs"
ON creative_soul_jobs FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Step 7: Create DELETE policy
CREATE POLICY "Service role can delete jobs"
ON creative_soul_jobs FOR DELETE
USING (auth.role() = 'service_role');