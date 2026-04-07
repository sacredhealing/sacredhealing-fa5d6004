-- Migration: Add shakti_cycle_logs to profiles
-- Run this in your Supabase SQL editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shakti_cycle_logs jsonb DEFAULT '{}'::jsonb;

-- Index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_shakti_cycle_logs
  ON profiles USING gin(shakti_cycle_logs);

-- Comment
COMMENT ON COLUMN profiles.shakti_cycle_logs IS
  'Shakti Cycle Intelligence daily logs: { "2025-01-14": { secretions: [], energy: "e_high", moods: [], symptoms: [], note: "" } }';
