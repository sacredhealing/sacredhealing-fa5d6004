-- ============================================
-- Creative Tool Access Management
-- ============================================
-- Tracks user purchases and access to Creative Soul tools with Lovable AI workspace links

-- Create creative_tools catalog table (defines available tools)
CREATE TABLE IF NOT EXISTS public.creative_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_eur NUMERIC NOT NULL,
  workspace_url TEXT NOT NULL, -- Lovable AI workspace URL
  tool_type TEXT NOT NULL CHECK (tool_type IN ('music_beat', 'soul_writing', 'meditation_creator', 'energy_translator')),
  icon_name TEXT, -- For UI display
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create creative_tool_access table (tracks user purchases/access)
CREATE TABLE IF NOT EXISTS public.creative_tool_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.creative_tools(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creative_tools_slug ON public.creative_tools(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_creative_tools_active ON public.creative_tools(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_creative_tool_access_user ON public.creative_tool_access(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_tool_access_tool ON public.creative_tool_access(tool_id);
CREATE INDEX IF NOT EXISTS idx_creative_tool_access_stripe ON public.creative_tool_access(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.creative_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_tool_access ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tools
CREATE POLICY "Anyone can view active creative tools"
ON public.creative_tools FOR SELECT
USING (is_active = true);

-- Admins can manage tools
CREATE POLICY "Admins can manage creative tools"
ON public.creative_tools FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own access
CREATE POLICY "Users can view own tool access"
ON public.creative_tool_access FOR SELECT
USING (auth.uid() = user_id);

-- Service role can grant access (via webhook)
CREATE POLICY "Service can grant tool access"
ON public.creative_tool_access FOR INSERT
WITH CHECK (true);

-- Insert default tools with workspace URLs
-- IMPORTANT: After migration, update workspace_url values with actual Lovable AI workspace URLs
-- You can do this via Supabase SQL Editor or Admin Panel
-- Example: UPDATE creative_tools SET workspace_url = 'https://lovable.ai/projects/abc123/music-beat' WHERE slug = 'music-beat-companion';
INSERT INTO public.creative_tools (slug, name, description, price_eur, workspace_url, tool_type, icon_name) VALUES
(
  'music-beat-companion',
  'Music & Healing Beat Companion',
  'Upload a beat or song and receive spiritual context, emotional tone, affirmations, and healing intention. Perfect for musicians and creators.',
  29.00,
  'https://lovable.ai/projects/YOUR_PROJECT_ID/music-beat-companion', -- TODO: Replace with actual Lovable AI workspace URL
  'music_beat',
  'Music'
),
(
  'soul-writing',
  'Soul Writing Companion',
  'Turn feelings or short notes into poems, prayers, affirmations, or reflections — without losing your authentic voice. For writers and poets.',
  19.00,
  'https://lovable.ai/projects/YOUR_PROJECT_ID/soul-writing', -- TODO: Replace with actual Lovable AI workspace URL
  'soul_writing',
  'PenTool'
),
(
  'meditation-creator',
  'Meditation Creator',
  'Create meditations using intention. The system helps with structure, pacing, and breath guidance while preserving your unique style.',
  39.00,
  'https://lovable.ai/projects/YOUR_PROJECT_ID/meditation-creator', -- TODO: Replace with actual Lovable AI workspace URL
  'meditation_creator',
  'Heart'
),
(
  'energy-translator',
  'Energy & Intention Translator',
  'Describe how you feel — receive healing language, mantras, or spiritual guidance. Transform emotions into actionable wisdom.',
  24.00,
  'https://lovable.ai/projects/YOUR_PROJECT_ID/energy-translator', -- TODO: Replace with actual Lovable AI workspace URL
  'energy_translator',
  'Zap'
)
ON CONFLICT (slug) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_creative_tools_updated_at
  BEFORE UPDATE ON public.creative_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

