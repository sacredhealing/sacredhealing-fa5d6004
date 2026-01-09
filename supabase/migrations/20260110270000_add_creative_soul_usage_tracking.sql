-- ============================================
-- Add Usage Tracking for Creative Soul Tool
-- ============================================
-- Tracks user actions (transcriptions, translations, PDF exports, etc.)

CREATE TABLE IF NOT EXISTS public.creative_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'transcribe', 'translate', 'generate_ideas', 'generate_image', 'export_pdf', 'youtube_convert'
  metadata JSONB DEFAULT '{}'::jsonb, -- Store additional info like language, video_url, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creative_tool_usage_user ON public.creative_tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_tool_usage_tool ON public.creative_tool_usage(tool_slug);
CREATE INDEX IF NOT EXISTS idx_creative_tool_usage_action ON public.creative_tool_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_creative_tool_usage_created ON public.creative_tool_usage(created_at DESC);

-- Enable RLS
ALTER TABLE public.creative_tool_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own tool usage"
ON public.creative_tool_usage FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert usage (via Edge Functions)
CREATE POLICY "Service can insert tool usage"
ON public.creative_tool_usage FOR INSERT
WITH CHECK (true);

-- Admins can view all usage
CREATE POLICY "Admins can view all tool usage"
ON public.creative_tool_usage FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.creative_tool_usage IS 'Tracks user actions and usage of Creative Soul tools for analytics and admin monitoring';

