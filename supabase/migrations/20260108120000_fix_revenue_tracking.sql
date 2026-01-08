-- ============================================
-- Fix Revenue Tracking for External Stripe Payments
-- ============================================
-- This migration ensures revenue_records table is properly configured
-- for tracking external Stripe payments via webhooks

-- Ensure source column exists (should already exist from previous migration)
ALTER TABLE public.revenue_records 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'webhook';

-- Ensure customer_id can store UUID (should already be UUID type)
-- This is for linking revenue to users when possible

-- Add index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_revenue_records_customer_id 
ON public.revenue_records(customer_id) 
WHERE customer_id IS NOT NULL;

-- Add index on source for filtering
CREATE INDEX IF NOT EXISTS idx_revenue_records_source 
ON public.revenue_records(source);

-- Ensure stripe_payment_id unique constraint exists (should already exist)
-- This prevents duplicate revenue entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'revenue_records_stripe_payment_id_unique'
  ) THEN
    ALTER TABLE public.revenue_records
    ADD CONSTRAINT revenue_records_stripe_payment_id_unique 
    UNIQUE (stripe_payment_id);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.revenue_records.source IS 'Source of revenue record: webhook (from Stripe), manual (admin entry), or backfill';
COMMENT ON COLUMN public.revenue_records.stripe_payment_id IS 'Unique Stripe payment identifier to prevent duplicate entries';
COMMENT ON COLUMN public.revenue_records.customer_id IS 'User ID if available, for linking revenue to users';
