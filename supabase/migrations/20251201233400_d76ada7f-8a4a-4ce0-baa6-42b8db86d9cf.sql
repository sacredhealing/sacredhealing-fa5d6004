-- Add recurring payment columns to courses
ALTER TABLE public.courses 
ADD COLUMN recurring_price_usd numeric DEFAULT NULL,
ADD COLUMN recurring_interval text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.courses.recurring_interval IS 'Options: month, year, or NULL for one-time only';