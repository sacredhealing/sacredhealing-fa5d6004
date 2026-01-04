-- Add stripe_payment_id column to revenue_records for deduplication
ALTER TABLE public.revenue_records 
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Add unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_records_stripe_payment_id 
ON public.revenue_records(stripe_payment_id) 
WHERE stripe_payment_id IS NOT NULL;