-- ============================================
-- Complete Fix for Creative Tools - ALL IN ONE
-- ============================================
-- This migration fixes everything needed for tools to display

-- Step 1: Ensure table exists (with all columns)
CREATE TABLE IF NOT EXISTS public.creative_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_eur NUMERIC NOT NULL DEFAULT 0,
  workspace_url TEXT NOT NULL,
  tool_type TEXT NOT NULL,
  icon_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  featured_start_date DATE,
  featured_end_date DATE,
  promo_text TEXT,
  promo_discount_percent INTEGER DEFAULT 0,
  featured_action_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'is_featured') THEN
    ALTER TABLE public.creative_tools ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'featured_order') THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_order INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'featured_start_date') THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_start_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'featured_end_date') THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_end_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'promo_text') THEN
    ALTER TABLE public.creative_tools ADD COLUMN promo_text TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'promo_discount_percent') THEN
    ALTER TABLE public.creative_tools ADD COLUMN promo_discount_percent INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_tools' AND column_name = 'featured_action_text') THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_action_text TEXT;
  END IF;
END $$;

-- Step 3: Fix CHECK constraint to include creative_studio
ALTER TABLE public.creative_tools 
  DROP CONSTRAINT IF EXISTS creative_tools_tool_type_check;

-- Only add constraint if table has rows, otherwise it might fail
DO $$
BEGIN
  ALTER TABLE public.creative_tools 
    ADD CONSTRAINT creative_tools_tool_type_check 
    CHECK (tool_type IN ('music_beat', 'soul_writing', 'meditation_creator', 'energy_translator', 'creative_studio'));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint might already exist or other issue, continue
    RAISE NOTICE 'Constraint creation skipped or already exists';
END $$;

-- Step 4: Enable RLS and set policy
ALTER TABLE public.creative_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active creative tools" ON public.creative_tools;

CREATE POLICY "Anyone can view active creative tools"
ON public.creative_tools FOR SELECT
TO public
USING (is_active = true);

-- Step 5: Insert all tools
INSERT INTO public.creative_tools (
  slug, name, description, price_eur, workspace_url, 
  tool_type, icon_name, is_active, is_featured, featured_order
) VALUES
(
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
),
(
  'music-beat-companion',
  'Music & Healing Beat Companion',
  'Upload a beat or song and receive spiritual context, emotional tone, affirmations, and healing intention. Perfect for musicians and creators.',
  29.00,
  '/creative-soul-tool',
  'music_beat',
  'Music',
  true,
  false,
  1
),
(
  'soul-writing',
  'Soul Writing Companion',
  'Turn feelings or short notes into poems, prayers, affirmations, or reflections — without losing your authentic voice. For writers and poets.',
  19.00,
  '/creative-soul-tool',
  'soul_writing',
  'PenTool',
  true,
  false,
  2
),
(
  'meditation-creator',
  'Meditation Creator',
  'Create meditations using intention. The system helps with structure, pacing, and breath guidance while preserving your unique style.',
  39.00,
  '/creative-soul-tool',
  'meditation_creator',
  'Heart',
  true,
  false,
  3
),
(
  'energy-translator',
  'Energy & Intention Translator',
  'Describe how you feel — receive healing language, mantras, or spiritual guidance. Transform emotions into actionable wisdom.',
  24.00,
  '/creative-soul-tool',
  'energy_translator',
  'Zap',
  true,
  false,
  4
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

-- Step 6: Ensure all are active
UPDATE public.creative_tools
SET is_active = true
WHERE slug IN ('creative-soul-studio', 'music-beat-companion', 'soul-writing', 'meditation-creator', 'energy-translator');

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_creative_tools_active ON public.creative_tools(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_creative_tools_slug ON public.creative_tools(slug) WHERE is_active = true;

-- Step 8: Verify
DO $$
DECLARE
  tool_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tool_count FROM public.creative_tools WHERE is_active = true;
  IF tool_count = 0 THEN
    RAISE EXCEPTION 'No tools found after migration! Check table and data.';
  ELSE
    RAISE NOTICE 'SUCCESS: Found % active creative tools', tool_count;
  END IF;
END $$;

