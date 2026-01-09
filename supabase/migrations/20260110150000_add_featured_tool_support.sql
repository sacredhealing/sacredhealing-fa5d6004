-- ============================================
-- Add Featured Tool Support
-- ============================================
-- Adds ability to highlight a featured tool at the top of Creative Soul section

-- Add featured tool columns to creative_tools table
ALTER TABLE public.creative_tools
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_action_text TEXT DEFAULT 'Get This Tool',
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

-- Create index for quick featured tool lookup
CREATE INDEX IF NOT EXISTS idx_creative_tools_featured 
  ON public.creative_tools(is_featured, featured_order) 
  WHERE is_featured = true;

-- Update one tool to be featured by default (you can change this)
UPDATE public.creative_tools
SET is_featured = true,
    featured_action_text = 'Get Music Companion',
    featured_order = 1
WHERE slug = 'music-beat-companion'
LIMIT 1;

