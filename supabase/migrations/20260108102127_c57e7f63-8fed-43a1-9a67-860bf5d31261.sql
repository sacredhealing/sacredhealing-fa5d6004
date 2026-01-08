-- Create stripe_webhook_logs table for debugging webhook events
CREATE TABLE public.stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'received',
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_stripe_webhook_logs_event_id ON public.stripe_webhook_logs(event_id);
CREATE INDEX idx_stripe_webhook_logs_event_type ON public.stripe_webhook_logs(event_type);
CREATE INDEX idx_stripe_webhook_logs_created_at ON public.stripe_webhook_logs(created_at DESC);

-- Enable RLS (admin only via service role, no user policies needed)
ALTER TABLE public.stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view logs
CREATE POLICY "Admins can view webhook logs"
ON public.stripe_webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add source column to revenue_records for tracking backfilled entries
ALTER TABLE public.revenue_records 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'webhook';

-- Add unique constraint on stripe_payment_id to prevent duplicates
ALTER TABLE public.revenue_records
ADD CONSTRAINT revenue_records_stripe_payment_id_unique UNIQUE (stripe_payment_id);

-- Enable realtime for webhook logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.stripe_webhook_logs;