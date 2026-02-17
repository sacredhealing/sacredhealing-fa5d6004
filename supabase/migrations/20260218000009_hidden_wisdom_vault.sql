-- ============================================================
-- Siddha-Core: Hidden Wisdom Vault (Stargate Module)
-- Ancient Technology Repository: Acoustic Levitation & Angelic Hierarchy
-- ============================================================

-- Hidden Wisdom Vault Table
CREATE TABLE IF NOT EXISTS public.hidden_wisdom_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('acoustic_levitation', 'angelic_hierarchy', 'pyramid_wisdom', 'vedic_secret', 'siddha_teaching')),
  content text NOT NULL,
  devanagari_script text,
  translation text,
  frequency_hz numeric, -- Acoustic frequency (432Hz, 528Hz, etc.)
  angelic_sphere integer CHECK (angelic_sphere >= 1 AND angelic_sphere <= 9), -- 1=Seraphim (core), 9=Guardian Angels (interface)
  metadata jsonb DEFAULT '{}'::jsonb,
  access_level text DEFAULT 'stargate' CHECK (access_level IN ('stargate', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Angelic Hierarchy Mapping Table
CREATE TABLE IF NOT EXISTS public.angelic_spheres (
  sphere_number integer PRIMARY KEY CHECK (sphere_number >= 1 AND sphere_number <= 9),
  name text NOT NULL,
  description text,
  ui_layer text NOT NULL, -- Maps to frontend UI component layer
  frequency_range jsonb, -- {min: 432, max: 528} Hz
  color_theme text, -- CSS color theme
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert Angelic Spheres (9 Spheres)
INSERT INTO public.angelic_spheres (sphere_number, name, description, ui_layer, frequency_range, color_theme) VALUES
  (1, 'Seraphim', 'Highest order - Core consciousness and divine fire', 'core', '{"min": 528, "max": 528}'::jsonb, 'gold'),
  (2, 'Cherubim', 'Wisdom and knowledge - Deep understanding', 'wisdom', '{"min": 500, "max": 528}'::jsonb, 'purple'),
  (3, 'Thrones', 'Divine justice and authority - Structural foundation', 'foundation', '{"min": 480, "max": 500}'::jsonb, 'blue'),
  (4, 'Dominions', 'Divine governance - Order and harmony', 'governance', '{"min": 460, "max": 480}'::jsonb, 'indigo'),
  (5, 'Virtues', 'Miracles and signs - Transformation', 'transformation', '{"min": 450, "max": 460}'::jsonb, 'cyan'),
  (6, 'Powers', 'Protection and defense - Security layer', 'security', '{"min": 440, "max": 450}'::jsonb, 'green'),
  (7, 'Principalities', 'Guardianship of nations - Community layer', 'community', '{"min": 435, "max": 440}'::jsonb, 'teal'),
  (8, 'Archangels', 'Divine messengers - Communication layer', 'communication', '{"min": 432, "max": 435}'::jsonb, 'silver'),
  (9, 'Guardian Angels', 'Personal protection - Interface layer', 'interface', '{"min": 432, "max": 432}'::jsonb, 'white')
ON CONFLICT (sphere_number) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  ui_layer = EXCLUDED.ui_layer,
  frequency_range = EXCLUDED.frequency_range,
  color_theme = EXCLUDED.color_theme;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hidden_wisdom_access ON public.hidden_wisdom_vault(access_level);
CREATE INDEX IF NOT EXISTS idx_hidden_wisdom_sphere ON public.hidden_wisdom_vault(angelic_sphere);
CREATE INDEX IF NOT EXISTS idx_hidden_wisdom_type ON public.hidden_wisdom_vault(content_type);

-- Enable RLS
ALTER TABLE public.hidden_wisdom_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angelic_spheres ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Stargate members can view hidden wisdom"
  ON public.hidden_wisdom_vault FOR SELECT
  USING (
    access_level = 'stargate' AND (
      EXISTS (
        SELECT 1 FROM public.stargate_community_members
        WHERE user_id = auth.uid()
      )
    ) OR public.check_is_master_admin() OR public.fn_admin_master_check()
  );

CREATE POLICY "Admins can manage hidden wisdom"
  ON public.hidden_wisdom_vault FOR ALL
  USING (public.check_is_master_admin() OR public.fn_admin_master_check())
  WITH CHECK (public.check_is_master_admin() OR public.fn_admin_master_check());

CREATE POLICY "Anyone can view angelic spheres"
  ON public.angelic_spheres FOR SELECT
  USING (true);
