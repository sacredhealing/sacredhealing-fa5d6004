-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own jobs" ON creative_soul_jobs;
DROP POLICY IF EXISTS "Service role can manage jobs" ON creative_soul_jobs;

-- Policy for SELECT: Allow users to see their own jobs OR jobs with NULL user_id (demo)
CREATE POLICY "Users can view their own jobs"
ON creative_soul_jobs FOR SELECT
USING (
    auth.uid() = user_id OR 
    user_id IS NULL OR
    auth.role() = 'service_role'
);

-- Policy for INSERT: Allow service role to insert any job (including NULL user_id)
CREATE POLICY "Service role can insert jobs"
ON creative_soul_jobs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Policy for UPDATE: Allow service role to update any job
CREATE POLICY "Service role can update jobs"
ON creative_soul_jobs FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy for DELETE: Allow service role to delete any job
CREATE POLICY "Service role can delete jobs"
ON creative_soul_jobs FOR DELETE
USING (auth.role() = 'service_role');

-- Also ensure user_id is nullable (in case it wasn't set correctly)
ALTER TABLE creative_soul_jobs 
ALTER COLUMN user_id DROP NOT NULL;

-- Verify the foreign key allows NULL
ALTER TABLE creative_soul_jobs 
DROP CONSTRAINT IF EXISTS creative_soul_jobs_user_id_fkey;

ALTER TABLE creative_soul_jobs 
ADD CONSTRAINT creative_soul_jobs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;