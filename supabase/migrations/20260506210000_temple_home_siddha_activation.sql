-- Siddha Activation Portal — cross-device JSON blob on existing temple_home_sessions

ALTER TABLE public.temple_home_sessions
  ADD COLUMN IF NOT EXISTS siddha_activation JSONB DEFAULT NULL;

COMMENT ON COLUMN public.temple_home_sessions.siddha_activation IS
  'Client-authored Siddha scalar lock state (place, lock_code, uptime anchor, etc.) for Temple Home / SQI.';
