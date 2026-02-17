-- ============================================================
-- Siddha-Core: Scheduled Messages Support
-- For 10X Automation: Allow messages to be scheduled for future delivery
-- ============================================================

-- Add scheduled_at column to private_messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'private_messages' 
    AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE public.private_messages 
    ADD COLUMN scheduled_at timestamptz;
    
    -- Create index for efficient scheduled message queries
    CREATE INDEX IF NOT EXISTS idx_private_messages_scheduled 
    ON public.private_messages(scheduled_at) 
    WHERE scheduled_at IS NOT NULL AND status = 'pending';
  END IF;
END $$;

-- Create function to process scheduled messages (can be called by pg_cron)
CREATE OR REPLACE FUNCTION public.process_scheduled_messages()
RETURNS TABLE(processed_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processed bigint;
BEGIN
  -- Update scheduled messages that are due
  UPDATE public.private_messages
  SET status = 'sent',
      scheduled_at = NULL
  WHERE scheduled_at IS NOT NULL
    AND scheduled_at <= now()
    AND status = 'pending';
  
  GET DIAGNOSTICS processed = ROW_COUNT;
  
  RETURN QUERY SELECT processed;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.process_scheduled_messages() TO authenticated;

-- Comment
COMMENT ON FUNCTION public.process_scheduled_messages IS 'Process scheduled messages that are due. Can be called by pg_cron for automated delivery.';
