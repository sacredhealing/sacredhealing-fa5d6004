-- ============================================
-- Fix Creative Tools Display Issues
-- ============================================
-- Ensures tools are visible to all users (authenticated and unauthenticated)

-- Update RLS policy to allow unauthenticated users to view tools
DROP POLICY IF EXISTS "Anyone can view active creative tools" ON public.creative_tools;

CREATE POLICY "Anyone can view active creative tools"
ON public.creative_tools FOR SELECT
USING (is_active = true);

-- Ensure Creative Soul Studio tool exists and is active
INSERT INTO public.creative_tools (
  slug,
  name,
  description,
  price_eur,
  workspace_url,
  tool_type,
  icon_name,
  is_active,
  is_featured,
  featured_order
) VALUES (
  'creative-soul-studio',
  'Creative Soul Studio',
  'Transform your voice into creative ideas, images, and documents. Voice-to-text transcription, AI idea generation, image creation, and PDF export.',
  19.99,
  '/creative-soul-tool',
  'creative_studio',
  'Sparkles',
  true,
  true,
  0
)
ON CONFLICT (slug) DO UPDATE
SET 
  name = 'Creative Soul Studio',
  description = 'Transform your voice into creative ideas, images, and documents. Voice-to-text transcription, AI idea generation, image creation, and PDF export.',
  price_eur = 19.99,
  workspace_url = '/creative-soul-tool',
  tool_type = 'creative_studio',
  icon_name = 'Sparkles',
  is_active = true,
  is_featured = true,
  featured_order = 0;

-- Ensure all default tools are active and visible
UPDATE public.creative_tools
SET is_active = true
WHERE slug IN ('music-beat-companion', 'soul-writing', 'meditation-creator', 'energy-translator', 'creative-soul-studio');

-- Add index to improve query performance
CREATE INDEX IF NOT EXISTS idx_creative_tools_active_featured 
  ON public.creative_tools(is_active, is_featured) 
  WHERE is_active = true;

COMMENT ON POLICY "Anyone can view active creative tools" ON public.creative_tools IS 
'Allows both authenticated and unauthenticated users to view active creative tools for purchase';

