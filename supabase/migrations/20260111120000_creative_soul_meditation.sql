-- ============================================
-- Creative Soul Meditation Audio Tool
-- ============================================
-- Migration for meditation audio generation tool with demo tracking

-- Create meditation_audio_demos table for demo tracking
CREATE TABLE IF NOT EXISTS public.meditation_audio_demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_files_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_meditation_audio_demos_user ON public.meditation_audio_demos(user_id);

-- Enable RLS
ALTER TABLE public.meditation_audio_demos ENABLE ROW LEVEL SECURITY;

-- Users can view their own demo records
CREATE POLICY "Users can view own demo records"
ON public.meditation_audio_demos FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert demo records (via Edge Function)
CREATE POLICY "Service can insert demo records"
ON public.meditation_audio_demos FOR INSERT
WITH CHECK (true);

-- Insert Creative Soul Meditation tool into creative_tools table
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
  'creative-soul-meditation',
  'Creative Soul Meditation',
  'Transform any audio or YouTube video into high-quality meditation, affirmation, and healing tracks. Use real music, binaural beats, frequency tuning, and full stem separation to create professional-quality audio.',
  19.99,
  '/creative-soul-meditation-tool',
  'meditation_audio',
  'Music',
  true,
  true,
  1
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

-- Ensure creative_tools table has all necessary columns
DO $$
BEGIN
  -- Add is_featured if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creative_tools' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.creative_tools ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add featured_order if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creative_tools' AND column_name = 'featured_order'
  ) THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_order INTEGER;
  END IF;

  -- Add featured_start_date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creative_tools' AND column_name = 'featured_start_date'
  ) THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_start_date TIMESTAMPTZ;
  END IF;

  -- Add featured_end_date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creative_tools' AND column_name = 'featured_end_date'
  ) THEN
    ALTER TABLE public.creative_tools ADD COLUMN featured_end_date TIMESTAMPTZ;
  END IF;

  -- Add promo_text if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creative_tools' AND column_name = 'promo_text'
  ) THEN
    ALTER TABLE public.creative_tools ADD COLUMN promo_text TEXT;
  END IF;

  -- Add promo_discount_percent if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creative_tools' AND column_name = 'promo_discount_percent'
  ) THEN
    ALTER TABLE public.creative_tools ADD COLUMN promo_discount_percent NUMERIC(5, 2);
  END IF;
END $$;

-- Verify tool was created
DO $$
DECLARE
  tool_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.creative_tools WHERE slug = 'creative-soul-meditation') INTO tool_exists;
  IF tool_exists THEN
    RAISE NOTICE 'Creative Soul Meditation tool created successfully';
  ELSE
    RAISE NOTICE 'Warning: Creative Soul Meditation tool was not created';
  END IF;
END $$;

