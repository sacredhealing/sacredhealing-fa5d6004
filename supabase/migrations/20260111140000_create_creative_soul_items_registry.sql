-- ============================================
-- Creative Soul Items Registry
-- Single source of truth for all Creative Soul items
-- ============================================

-- Create unified registry table
CREATE TABLE IF NOT EXISTS public.creative_soul_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price_eur NUMERIC(10, 2) DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('tool', 'income', 'course')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_membership BOOLEAN NOT NULL DEFAULT false,
  admin_only BOOLEAN NOT NULL DEFAULT false,
  icon_name TEXT DEFAULT 'Sparkles',
  workspace_url TEXT,
  internal_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_soul_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active items (admin sees all)
CREATE POLICY "Anyone can view active creative soul items"
ON public.creative_soul_items
FOR SELECT
USING (
  -- Admins see everything
  public.has_role(auth.uid(), 'admin')
  OR 
  -- Regular users see active non-admin items
  (is_active = true AND admin_only = false)
);

-- Admins can manage all items
CREATE POLICY "Admins can manage creative soul items"
ON public.creative_soul_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_creative_soul_items_active 
ON public.creative_soul_items(is_active, type, order_index);

CREATE INDEX IF NOT EXISTS idx_creative_soul_items_slug 
ON public.creative_soul_items(slug) WHERE is_active = true;

-- Add updated_at trigger
CREATE TRIGGER update_creative_soul_items_updated_at
BEFORE UPDATE ON public.creative_soul_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Creative Soul Tools from creative_tools table
INSERT INTO public.creative_soul_items (slug, title, description, price_eur, type, is_active, icon_name, workspace_url, order_index)
SELECT 
  slug,
  name as title,
  description,
  price_eur,
  'tool'::text as type,
  is_active,
  icon_name,
  workspace_url,
  0 as order_index
FROM public.creative_tools
WHERE is_active = true
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_eur = EXCLUDED.price_eur,
  is_active = EXCLUDED.is_active,
  workspace_url = EXCLUDED.workspace_url;

-- Insert Income Streams (Astro VED and Polygram)
INSERT INTO public.creative_soul_items (slug, title, description, price_eur, type, is_active, icon_name, internal_url, order_index, admin_only)
VALUES
  ('astro-ved', 
   'Astro VED', 
   'Vedic Astrology access for all membership tiers. Unlock personalized astrology readings and insights.',
   0,
   'income',
   true,
   'Sparkles',
   '/income-streams/astro-ved',
   10,
   false),
  ('polygram', 
   'Polygram Income Stream', 
   'Earn income through Polygram platform integration.',
   0,
   'income',
   true,
   'Zap',
   '/income-streams/polygram',
   11,
   false)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  internal_url = EXCLUDED.internal_url;

-- Ensure all active creative tools are in registry
INSERT INTO public.creative_soul_items (slug, title, description, price_eur, type, is_active, icon_name, workspace_url, order_index)
SELECT 
  slug,
  name as title,
  description,
  price_eur,
  'tool'::text as type,
  is_active,
  icon_name,
  workspace_url,
  1 as order_index
FROM public.creative_tools
WHERE is_active = true 
  AND slug NOT IN (SELECT slug FROM public.creative_soul_items)
ON CONFLICT (slug) DO NOTHING;

-- Ensure active income streams are in registry
INSERT INTO public.creative_soul_items (slug, title, description, price_eur, type, is_active, icon_name, internal_url, order_index)
SELECT 
  COALESCE(internal_slug, 'income-' || id::text) as slug,
  title,
  description,
  0 as price_eur,
  'income'::text as type,
  is_active,
  icon_name,
  link as internal_url,
  order_index + 100
FROM public.income_streams
WHERE is_active = true 
  AND (internal_slug IS NOT NULL OR id IS NOT NULL)
  AND COALESCE(internal_slug, 'income-' || id::text) NOT IN (SELECT slug FROM public.creative_soul_items)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  internal_url = EXCLUDED.internal_url;

