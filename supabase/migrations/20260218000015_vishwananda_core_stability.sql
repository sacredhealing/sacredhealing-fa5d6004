-- PROJECT: THE SOVEREIGN SANCTUARY - VISHWANANDA CORE
-- Linus Torvalds Stability Fix + Sri Yukteswar Astrology Engine

-- 1. Refresh PostgREST Schema Cache (Fabrice Bellard Efficiency)
-- Note: This requires PostgreSQL LISTEN/NOTIFY support
-- The actual schema refresh happens automatically when Supabase detects the migration

-- 2. Add status column to mantras (if using status instead of is_active)
-- For now, we'll use is_active as status = 'active' equivalent
-- But ensure category and planet_type are visible
ALTER TABLE public.mantras 
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS planet_type text;

-- Ensure all existing mantras have category
UPDATE public.mantras 
SET category = 'general' 
WHERE category IS NULL;

-- 3. Create Admin Override Function (Linus Torvalds Stability)
CREATE OR REPLACE FUNCTION public.check_is_shiva_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  -- Check if user is admin by querying profiles directly
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  ) = true;
END;
$$;

-- 4. Fix Mantra RLS Policies (Allow public read for active mantras)
ALTER TABLE public.mantras ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read for active mantras" ON public.mantras;
DROP POLICY IF EXISTS "Users can view active mantras" ON public.mantras;

-- Create new policy: Allow public read for active mantras
CREATE POLICY "Allow public read for active mantras" 
ON public.mantras FOR SELECT 
USING (is_active = true);

-- Admins can manage all mantras
CREATE POLICY "Admins can manage all mantras"
ON public.mantras FOR ALL
USING (public.check_is_shiva_admin())
WITH CHECK (public.check_is_shiva_admin());

-- 5. Create SQL View for Member Fetching (Gennady Korotkevich Efficiency)
-- This avoids infinite recursion by using a single view
CREATE OR REPLACE VIEW public.chat_members_view AS
SELECT 
  cm.id,
  cm.room_id,
  cm.user_id,
  cm.joined_at,
  cm.role,
  cm.is_active,
  p.full_name,
  p.avatar_url,
  p.language,
  CASE 
    WHEN public.check_is_shiva_admin() THEN true
    ELSE cm.user_id = auth.uid()
  END as can_view
FROM public.chat_members cm
LEFT JOIN public.profiles p ON p.user_id = cm.user_id
WHERE 
  public.check_is_shiva_admin() = true 
  OR cm.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_members cm2 
    WHERE cm2.room_id = cm.room_id 
    AND cm2.user_id = auth.uid()
  );

-- Grant access to the view
GRANT SELECT ON public.chat_members_view TO authenticated;
GRANT SELECT ON public.chat_members_view TO anon;

-- 6. Create is_master_admin function (Alternative to check_is_shiva_admin)
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  RETURN public.check_is_shiva_admin();
END;
$$;

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mantras_is_active ON public.mantras(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mantras_category ON public.mantras(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mantras_planet_type ON public.mantras(planet_type) WHERE planet_type IS NOT NULL;

-- 8. Add error message translations (Dan Abramov Retainable UI)
INSERT INTO public.ui_translations (key_name, en_text, sv_text, category) VALUES
  ('error_mantras_fetch', 'Could not load mantras right now. Please try again in a moment.', 'Kunde inte ladda mantras just nu. Var vänlig försök igen om en stund.', 'ui'),
  ('error_audio_play', 'Audio could not play. Check your internet connection and try again.', 'Ljudet kunde inte spelas. Kontrollera din internetanslutning och försök igen.', 'ui'),
  ('error_no_audio', 'No audio available for this mantra. Please select another mantra.', 'Det finns inget ljud tillgängligt för denna mantra. Välj en annan mantra.', 'ui'),
  ('error_mantra_reward', 'Could not register the reward. Your practice is still valuable.', 'Kunde inte registrera belöningen. Din praxis är fortfarande värdefull.', 'ui'),
  ('error_member_fetch', 'Could not load members right now. The database needs updating. Contact support if the problem persists.', 'Kunde inte ladda medlemmar just nu. Databasen behöver uppdateras. Kontakta support om problemet kvarstår.', 'ui'),
  ('mantras_dasha_pinned', 'Your Period', 'Ditt Period', 'ui')
ON CONFLICT (key_name) DO UPDATE SET 
  en_text = EXCLUDED.en_text, 
  sv_text = EXCLUDED.sv_text, 
  updated_at = now();

-- 9. Verify columns exist (Safety Check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mantras' 
    AND column_name = 'category'
  ) THEN
    RAISE EXCEPTION 'Category column not found after migration';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mantras' 
    AND column_name = 'planet_type'
  ) THEN
    RAISE EXCEPTION 'Planet_type column not found after migration';
  END IF;
END $$;
