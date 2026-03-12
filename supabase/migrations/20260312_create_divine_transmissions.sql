-- Create the divine_transmissions table for Explore Akasha audio talks
CREATE TABLE IF NOT EXISTS public.divine_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'divine_transmissions',
  audio_url_en TEXT,
  audio_url_sv TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  required_tier INTEGER NOT NULL DEFAULT 0,
  series_name TEXT,
  series_order INTEGER,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.divine_transmissions ENABLE ROW LEVEL SECURITY;

-- Public can view published transmissions
DROP POLICY IF EXISTS "Anyone can view published transmissions" ON public.divine_transmissions;
CREATE POLICY "Anyone can view published transmissions"
  ON public.divine_transmissions FOR SELECT
  USING (published = true);

-- Admins can view all (including unpublished)
DROP POLICY IF EXISTS "Admins can view all transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can view all transmissions"
  ON public.divine_transmissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert
DROP POLICY IF EXISTS "Admins can insert transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can insert transmissions"
  ON public.divine_transmissions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update
DROP POLICY IF EXISTS "Admins can update transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can update transmissions"
  ON public.divine_transmissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete
DROP POLICY IF EXISTS "Admins can delete transmissions" ON public.divine_transmissions;
CREATE POLICY "Admins can delete transmissions"
  ON public.divine_transmissions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_divine_transmissions_category
  ON public.divine_transmissions(category);

CREATE INDEX IF NOT EXISTS idx_divine_transmissions_published
  ON public.divine_transmissions(published);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_divine_transmissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_divine_transmissions_updated_at ON public.divine_transmissions;
CREATE TRIGGER set_divine_transmissions_updated_at
  BEFORE UPDATE ON public.divine_transmissions
  FOR EACH ROW EXECUTE FUNCTION public.update_divine_transmissions_updated_at();
