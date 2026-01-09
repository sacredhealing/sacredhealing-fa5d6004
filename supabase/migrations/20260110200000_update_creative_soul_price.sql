-- ============================================
-- Update Creative Soul Tool Price to €19.99
-- ============================================
-- Sets the main Creative Soul Studio tool price to €19.99 one-time payment

-- Update or insert the main Creative Soul Studio tool
INSERT INTO public.creative_tools (
  slug,
  name,
  description,
  price_eur,
  workspace_url,
  tool_type,
  icon_name,
  is_active,
  is_featured
) VALUES (
  'creative-soul-studio',
  'Creative Soul Studio',
  'Transform your voice into creative ideas, images, and documents. Voice-to-text transcription, AI idea generation, image creation, and PDF export.',
  19.99,
  '/creative-soul-tool',
  'creative_studio',
  'Sparkles',
  true,
  true
)
ON CONFLICT (slug) DO UPDATE
SET 
  price_eur = 19.99,
  description = 'Transform your voice into creative ideas, images, and documents. Voice-to-text transcription, AI idea generation, image creation, and PDF export.',
  workspace_url = '/creative-soul-tool',
  is_active = true;

-- Update featured order if it exists
UPDATE public.creative_tools
SET featured_order = 0
WHERE slug = 'creative-soul-studio';

COMMENT ON TABLE public.creative_tools IS 'Creative tools available for purchase. Includes Creative Soul Studio at €19.99.';

