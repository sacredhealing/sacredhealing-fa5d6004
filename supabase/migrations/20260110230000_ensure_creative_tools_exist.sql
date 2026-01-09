-- ============================================
-- Ensure All Creative Tools Exist
-- ============================================
-- Creates/updates all creative tools to ensure they're available

-- Ensure Creative Soul Studio exists (main tool)
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
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  workspace_url = EXCLUDED.workspace_url,
  tool_type = EXCLUDED.tool_type,
  icon_name = EXCLUDED.icon_name,
  is_active = true,
  is_featured = EXCLUDED.is_featured,
  featured_order = EXCLUDED.featured_order,
  updated_at = now();

-- Ensure Music & Healing Beat Companion exists
INSERT INTO public.creative_tools (
  slug,
  name,
  description,
  price_eur,
  workspace_url,
  tool_type,
  icon_name,
  is_active
) VALUES (
  'music-beat-companion',
  'Music & Healing Beat Companion',
  'Upload a beat or song and receive spiritual context, emotional tone, affirmations, and healing intention. Perfect for musicians and creators.',
  29.00,
  '/creative-soul-tool',
  'music_beat',
  'Music',
  true
)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  is_active = true,
  updated_at = now();

-- Ensure Soul Writing Companion exists
INSERT INTO public.creative_tools (
  slug,
  name,
  description,
  price_eur,
  workspace_url,
  tool_type,
  icon_name,
  is_active
) VALUES (
  'soul-writing',
  'Soul Writing Companion',
  'Turn feelings or short notes into poems, prayers, affirmations, or reflections — without losing your authentic voice. For writers and poets.',
  19.00,
  '/creative-soul-tool',
  'soul_writing',
  'PenTool',
  true
)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  is_active = true,
  updated_at = now();

-- Ensure Meditation Creator exists
INSERT INTO public.creative_tools (
  slug,
  name,
  description,
  price_eur,
  workspace_url,
  tool_type,
  icon_name,
  is_active
) VALUES (
  'meditation-creator',
  'Meditation Creator',
  'Create meditations using intention. The system helps with structure, pacing, and breath guidance while preserving your unique style.',
  39.00,
  '/creative-soul-tool',
  'meditation_creator',
  'Heart',
  true
)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  is_active = true,
  updated_at = now();

-- Ensure Energy & Intention Translator exists
INSERT INTO public.creative_tools (
  slug,
  name,
  description,
  price_eur,
  workspace_url,
  tool_type,
  icon_name,
  is_active
) VALUES (
  'energy-translator',
  'Energy & Intention Translator',
  'Describe how you feel — receive healing language, mantras, or spiritual guidance. Transform emotions into actionable wisdom.',
  24.00,
  '/creative-soul-tool',
  'energy_translator',
  'Zap',
  true
)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  is_active = true,
  updated_at = now();

-- Verify tools exist (for debugging)
DO $$
DECLARE
  tool_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tool_count FROM public.creative_tools WHERE is_active = true;
  RAISE NOTICE 'Active creative tools count: %', tool_count;
END $$;

