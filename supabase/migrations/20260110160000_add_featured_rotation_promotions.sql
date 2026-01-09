-- ============================================
-- Add Featured Tool Rotation & Promotions
-- ============================================
-- Enables weekly rotation and limited-time promotions for featured tools

-- Add rotation and promotion fields to creative_tools table
ALTER TABLE public.creative_tools
ADD COLUMN IF NOT EXISTS featured_start_date DATE,
ADD COLUMN IF NOT EXISTS featured_end_date DATE,
ADD COLUMN IF NOT EXISTS promo_text TEXT,
ADD COLUMN IF NOT EXISTS promo_discount_percent INTEGER DEFAULT 0;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_creative_tools_featured_dates 
  ON public.creative_tools(is_featured, featured_start_date, featured_end_date) 
  WHERE is_featured = true;

-- Add comment for clarity
COMMENT ON COLUMN public.creative_tools.featured_start_date IS 'Date when this tool should start appearing as featured';
COMMENT ON COLUMN public.creative_tools.featured_end_date IS 'Date when this tool should stop appearing as featured (inclusive)';
COMMENT ON COLUMN public.creative_tools.promo_text IS 'Short promotional text displayed with featured tool (e.g., "50% off this week!")';
COMMENT ON COLUMN public.creative_tools.promo_discount_percent IS 'Optional discount percentage (0-100) for promotional pricing';

-- Example: Set up a featured tool with date range and promotion
-- This will be featured from today for 7 days with a 20% discount
UPDATE public.creative_tools
SET 
  is_featured = true,
  featured_start_date = CURRENT_DATE,
  featured_end_date = CURRENT_DATE + INTERVAL '7 days',
  promo_text = 'Limited Time: Special Launch Offer!',
  promo_discount_percent = 20,
  featured_action_text = 'Get 20% Off Now'
WHERE slug = 'music-beat-companion'
LIMIT 1;

