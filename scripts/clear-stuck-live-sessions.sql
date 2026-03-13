-- Run this in Supabase SQL Editor to clear stuck live sessions that block chat
UPDATE community_live_sessions 
SET status = 'ended', ended_at = now() 
WHERE status = 'active';
