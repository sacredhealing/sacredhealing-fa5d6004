-- ============================================
-- 90-Day Master Roadmap System
-- ============================================
-- Task management system for tracking content creation roadmap

CREATE TABLE IF NOT EXISTS public.admin_system_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Roadmap organization
  phase INTEGER NOT NULL CHECK (phase IN (1, 2, 3)),
  category TEXT NOT NULL CHECK (category IN ('Content', 'Product', 'Community', 'Monetization')),
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  target_location TEXT, -- e.g., "Daily > Morning", "Paths > Inner Peace > Day 1"
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  
  -- Auto-completion
  auto_complete_on_upload BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  
  -- Metadata
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_system_tasks_phase ON public.admin_system_tasks(phase);
CREATE INDEX IF NOT EXISTS idx_admin_system_tasks_category ON public.admin_system_tasks(category);
CREATE INDEX IF NOT EXISTS idx_admin_system_tasks_status ON public.admin_system_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_system_tasks_target_location ON public.admin_system_tasks(target_location);

ALTER TABLE public.admin_system_tasks ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage tasks
CREATE POLICY "Admins can view all tasks"
ON public.admin_system_tasks FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tasks"
ON public.admin_system_tasks FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks"
ON public.admin_system_tasks FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tasks"
ON public.admin_system_tasks FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_admin_system_tasks_updated_at
  BEFORE UPDATE ON public.admin_system_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED DATA: 90-Day Master Roadmap
-- ============================================

-- PHASE 1: Foundation (Days 1-30)
INSERT INTO public.admin_system_tasks (phase, category, title, description, target_location, auto_complete_on_upload, order_index) VALUES

-- Phase 1: Content
(1, 'Content', 'Morning Grounding Meditation', '8-10 min foundational daily practice', 'Daily > Morning', true, 1),
(1, 'Content', 'Morning Energy Boost', '5-7 min energizing meditation', 'Daily > Morning', true, 2),
(1, 'Content', 'Morning Gratitude Practice', '10 min gratitude meditation', 'Daily > Morning', true, 3),
(1, 'Content', 'Morning Intention Setting', '8 min intention meditation', 'Daily > Morning', true, 4),
(1, 'Content', 'Morning Clarity Meditation', '10 min focus meditation', 'Daily > Morning', true, 5),
(1, 'Content', 'Morning Abundance Flow', '12 min abundance meditation', 'Daily > Morning', true, 6),
(1, 'Content', 'Morning Sacred Space', '15 min sacred space meditation', 'Daily > Morning', true, 7),

(1, 'Content', 'Midday Reset - Quick Calm', '5 min midday reset', 'Daily > Midday', true, 8),
(1, 'Content', 'Midday Energy Recharge', '7 min energy boost', 'Daily > Midday', true, 9),
(1, 'Content', 'Midday Focus Reset', '8 min focus meditation', 'Daily > Midday', true, 10),
(1, 'Content', 'Midday Stress Release', '10 min stress relief', 'Daily > Midday', true, 11),
(1, 'Content', 'Midday Balance Practice', '12 min balancing meditation', 'Daily > Midday', true, 12),

(1, 'Content', 'Evening Wind Down', '10 min evening relaxation', 'Daily > Evening', true, 13),
(1, 'Content', 'Deep Sleep Preparation', '15 min sleep preparation', 'Daily > Evening', true, 14),
(1, 'Content', 'Evening Gratitude Reflection', '10 min gratitude practice', 'Daily > Evening', true, 15),
(1, 'Content', 'Evening Release & Let Go', '12 min release meditation', 'Daily > Evening', true, 16),
(1, 'Content', 'Sleep Sanctuary - Deep Rest', '20 min deep sleep meditation', 'Daily > Evening', true, 17),
(1, 'Content', 'Evening Peace Meditation', '15 min peace practice', 'Daily > Evening', true, 18),
(1, 'Content', 'Nighttime Healing', '18 min healing meditation', 'Daily > Evening', true, 19),
(1, 'Content', 'Dream State Preparation', '15 min dream preparation', 'Daily > Evening', true, 20),

(1, 'Content', 'Inner Peace Path - Day 1', 'First day of Inner Peace journey', 'Paths > Inner Peace > Day 1', true, 21),
(1, 'Content', 'Inner Peace Path - Day 2', 'Second day of Inner Peace journey', 'Paths > Inner Peace > Day 2', true, 22),
(1, 'Content', 'Inner Peace Path - Day 3', 'Third day of Inner Peace journey', 'Paths > Inner Peace > Day 3', true, 23),
(1, 'Content', 'Inner Peace Path - Day 4', 'Fourth day of Inner Peace journey', 'Paths > Inner Peace > Day 4', true, 24),
(1, 'Content', 'Inner Peace Path - Day 5', 'Fifth day of Inner Peace journey', 'Paths > Inner Peace > Day 5', true, 25),
(1, 'Content', 'Inner Peace Path - Day 6', 'Sixth day of Inner Peace journey', 'Paths > Inner Peace > Day 6', true, 26),
(1, 'Content', 'Inner Peace Path - Day 7', 'Seventh day of Inner Peace journey', 'Paths > Inner Peace > Day 7', true, 27),

(1, 'Content', 'Basic Breathwork - Box Breathing', '4-4-4-4 breathing pattern', 'Breathing > Basic', true, 28),
(1, 'Content', 'Basic Breathwork - Deep Belly', 'Deep belly breathing practice', 'Breathing > Basic', true, 29),
(1, 'Content', 'Basic Breathwork - 4-7-8 Technique', '4-7-8 breathing for calm', 'Breathing > Basic', true, 30),

-- Phase 1: Product
(1, 'Product', 'Daily Practice Card Implementation', 'Show personalized daily practice', 'Dashboard > Daily Practice', false, 31),
(1, 'Product', 'Streak Counter System', 'Simple streak tracking and display', 'Dashboard > Streaks', false, 32),
(1, 'Product', 'Free Community Chat', 'Chat with guides functionality', 'Community > Guide Chat', false, 33),
(1, 'Product', 'Announcements Channel', 'Admin-only announcements channel', 'Community > Announcements', false, 34),

-- Phase 1: Monetization
(1, 'Monetization', 'Premium Unlock Messaging', 'Clear premium upgrade prompts', 'App > Premium Gating', false, 35),
(1, 'Monetization', 'Stripe Revenue Tracking', 'Fix and verify revenue tracking', 'Admin > Revenue', false, 36),

-- PHASE 2: Transformation (Days 31-60)
(2, 'Content', 'Inner Peace Path - Day 8', 'Eighth day of Inner Peace journey', 'Paths > Inner Peace > Day 8', true, 37),
(2, 'Content', 'Inner Peace Path - Day 9', 'Ninth day of Inner Peace journey', 'Paths > Inner Peace > Day 9', true, 38),
(2, 'Content', 'Inner Peace Path - Day 10', 'Tenth day of Inner Peace journey', 'Paths > Inner Peace > Day 10', true, 39),
(2, 'Content', 'Inner Peace Path - Day 11', 'Eleventh day of Inner Peace journey', 'Paths > Inner Peace > Day 11', true, 40),
(2, 'Content', 'Inner Peace Path - Day 12', 'Twelfth day of Inner Peace journey', 'Paths > Inner Peace > Day 12', true, 41),
(2, 'Content', 'Inner Peace Path - Day 13', 'Thirteenth day of Inner Peace journey', 'Paths > Inner Peace > Day 13', true, 42),
(2, 'Content', 'Inner Peace Path - Day 14', 'Fourteenth day of Inner Peace journey', 'Paths > Inner Peace > Day 14', true, 43),
(2, 'Content', 'Inner Peace Path - Day 15', 'Fifteenth day of Inner Peace journey', 'Paths > Inner Peace > Day 15', true, 44),
(2, 'Content', 'Inner Peace Path - Day 16', 'Sixteenth day of Inner Peace journey', 'Paths > Inner Peace > Day 16', true, 45),
(2, 'Content', 'Inner Peace Path - Day 17', 'Seventeenth day of Inner Peace journey', 'Paths > Inner Peace > Day 17', true, 46),
(2, 'Content', 'Inner Peace Path - Day 18', 'Eighteenth day of Inner Peace journey', 'Paths > Inner Peace > Day 18', true, 47),
(2, 'Content', 'Inner Peace Path - Day 19', 'Nineteenth day of Inner Peace journey', 'Paths > Inner Peace > Day 19', true, 48),
(2, 'Content', 'Inner Peace Path - Day 20', 'Twentieth day of Inner Peace journey', 'Paths > Inner Peace > Day 20', true, 49),
(2, 'Content', 'Inner Peace Path - Day 21', 'Twenty-first day of Inner Peace journey', 'Paths > Inner Peace > Day 21', true, 50),

(2, 'Content', 'Sleep Sanctuary - Day 1', 'First day of sleep journey', 'Sleep Sanctuary > Day 1', true, 51),
(2, 'Content', 'Sleep Sanctuary - Day 2', 'Second day of sleep journey', 'Sleep Sanctuary > Day 2', true, 52),
(2, 'Content', 'Sleep Sanctuary - Day 3', 'Third day of sleep journey', 'Sleep Sanctuary > Day 3', true, 53),
(2, 'Content', 'Sleep Sanctuary - Day 4', 'Fourth day of sleep journey', 'Sleep Sanctuary > Day 4', true, 54),
(2, 'Content', 'Sleep Sanctuary - Day 5', 'Fifth day of sleep journey', 'Sleep Sanctuary > Day 5', true, 55),
(2, 'Content', 'Sleep Sanctuary - Day 6', 'Sixth day of sleep journey', 'Sleep Sanctuary > Day 6', true, 56),
(2, 'Content', 'Sleep Sanctuary - Day 7', 'Seventh day of sleep journey', 'Sleep Sanctuary > Day 7', true, 57),
(2, 'Content', 'Sleep Sanctuary - Day 8', 'Eighth day of sleep journey', 'Sleep Sanctuary > Day 8', true, 58),
(2, 'Content', 'Sleep Sanctuary - Day 9', 'Ninth day of sleep journey', 'Sleep Sanctuary > Day 9', true, 59),
(2, 'Content', 'Sleep Sanctuary - Day 10', 'Tenth day of sleep journey', 'Sleep Sanctuary > Day 10', true, 60),
(2, 'Content', 'Sleep Sanctuary - Day 11', 'Eleventh day of sleep journey', 'Sleep Sanctuary > Day 11', true, 61),
(2, 'Content', 'Sleep Sanctuary - Day 12', 'Twelfth day of sleep journey', 'Sleep Sanctuary > Day 12', true, 62),
(2, 'Content', 'Sleep Sanctuary - Day 13', 'Thirteenth day of sleep journey', 'Sleep Sanctuary > Day 13', true, 63),
(2, 'Content', 'Sleep Sanctuary - Day 14', 'Fourteenth day of sleep journey', 'Sleep Sanctuary > Day 14', true, 64),

(2, 'Content', 'Deep Healing - Session 1', 'First deep healing session', 'Healing > Deep Healing > Session 1', true, 65),
(2, 'Content', 'Deep Healing - Session 2', 'Second deep healing session', 'Healing > Deep Healing > Session 2', true, 66),
(2, 'Content', 'Deep Healing - Session 3', 'Third deep healing session', 'Healing > Deep Healing > Session 3', true, 67),
(2, 'Content', 'Deep Healing - Session 4', 'Fourth deep healing session', 'Healing > Deep Healing > Session 4', true, 68),
(2, 'Content', 'Deep Healing - Session 5', 'Fifth deep healing session', 'Healing > Deep Healing > Session 5', true, 69),
(2, 'Content', 'Deep Healing - Session 6', 'Sixth deep healing session', 'Healing > Deep Healing > Session 6', true, 70),
(2, 'Content', 'Deep Healing - Session 7', 'Seventh deep healing session', 'Healing > Deep Healing > Session 7', true, 71),

(2, 'Content', 'Yoga Nidra - Core Practice 1', 'First core yoga nidra practice', 'Yoga Nidra > Core 1', true, 72),
(2, 'Content', 'Yoga Nidra - Core Practice 2', 'Second core yoga nidra practice', 'Yoga Nidra > Core 2', true, 73),
(2, 'Content', 'Yoga Nidra - Core Practice 3', 'Third core yoga nidra practice', 'Yoga Nidra > Core 3', true, 74),

-- Phase 2: Product
(2, 'Product', '7-Day Inner Peace Challenge', 'Create challenge with community feed', 'Challenges > Inner Peace', false, 75),
(2, 'Product', 'Badges System Enhancement', 'Add completion markers and badges', 'Gamification > Badges', false, 76),
(2, 'Product', 'Personalized Daily Suggestions', 'Goal-based content recommendations', 'Dashboard > Recommendations', false, 77),
(2, 'Product', 'Admin Content Task Automation', 'Auto-complete tasks on upload', 'Admin > Automation', false, 78),

-- Phase 2: Monetization
(2, 'Monetization', 'Premium Retention Strategy', 'Improve premium member retention', 'Monetization > Retention', false, 79),
(2, 'Monetization', 'First Paid Course Preparation', 'Prepare course structure and pricing', 'Courses > First Course', false, 80),

-- PHASE 3: Mastery & Scale (Days 61-90)
(2, 'Content', 'Deep Healing - Session 8', 'Eighth deep healing session', 'Healing > Deep Healing > Session 8', true, 81),
(2, 'Content', 'Deep Healing - Session 9', 'Ninth deep healing session', 'Healing > Deep Healing > Session 9', true, 82),
(2, 'Content', 'Deep Healing - Session 10', 'Tenth deep healing session', 'Healing > Deep Healing > Session 10', true, 83),
(2, 'Content', 'Deep Healing - Session 11', 'Eleventh deep healing session', 'Healing > Deep Healing > Session 11', true, 84),
(2, 'Content', 'Deep Healing - Session 12', 'Twelfth deep healing session', 'Healing > Deep Healing > Session 12', true, 85),
(2, 'Content', 'Deep Healing - Session 13', 'Thirteenth deep healing session', 'Healing > Deep Healing > Session 13', true, 86),
(2, 'Content', 'Deep Healing - Session 14', 'Fourteenth deep healing session', 'Healing > Deep Healing > Session 14', true, 87),

(3, 'Content', 'Chakra & Energy Course - Module 1', 'First module of chakra course', 'Courses > Chakra Energy > Module 1', true, 88),
(3, 'Content', 'Chakra & Energy Course - Module 2', 'Second module of chakra course', 'Courses > Chakra Energy > Module 2', true, 89),
(3, 'Content', 'Chakra & Energy Course - Module 3', 'Third module of chakra course', 'Courses > Chakra Energy > Module 3', true, 90),
(3, 'Content', 'Chakra & Energy Course - Module 4', 'Fourth module of chakra course', 'Courses > Chakra Energy > Module 4', true, 91),
(3, 'Content', 'Chakra & Energy Course - Module 5', 'Fifth module of chakra course', 'Courses > Chakra Energy > Module 5', true, 92),

(3, 'Content', 'Advanced Breathwork - Wim Hof', 'Wim Hof breathing technique', 'Breathing > Advanced', true, 93),
(3, 'Content', 'Advanced Breathwork - Pranayama', 'Pranayama breathing practice', 'Breathing > Advanced', true, 94),
(3, 'Content', 'Advanced Breathwork - Holotropic', 'Holotropic breathing introduction', 'Breathing > Advanced', true, 95),

(3, 'Content', 'Live Healing Circle - Week 1', 'First weekly healing circle', 'Live Events > Healing Circles', true, 96),
(3, 'Content', 'Live Healing Circle - Week 2', 'Second weekly healing circle', 'Live Events > Healing Circles', true, 97),
(3, 'Content', 'Live Healing Circle - Week 3', 'Third weekly healing circle', 'Live Events > Healing Circles', true, 98),
(3, 'Content', 'Live Healing Circle - Week 4', 'Fourth weekly healing circle', 'Live Events > Healing Circles', true, 99),

-- Phase 3: Product
(3, 'Product', 'Certificate Generation System', 'Generate PDF certificates for completions', 'Certificates > System', false, 100),
(3, 'Product', 'Live Events System', 'Full live events with RSVP', 'Events > Live System', false, 101),
(3, 'Product', 'Creator Authority Profile', 'Build Laila''s authority profile page', 'Profile > Creator', false, 102),
(3, 'Product', 'Analytics Dashboard', 'Comprehensive analytics for admins', 'Admin > Analytics', false, 103),

-- Phase 3: Monetization
(3, 'Monetization', 'Course Pricing Structure', 'Set pricing for courses (€49-€149)', 'Monetization > Courses', false, 104),
(3, 'Monetization', 'Annual & Lifetime Plans', 'Create annual and lifetime membership tiers', 'Monetization > Plans', false, 105),
(3, 'Monetization', 'Corporate & B2B Preparation', 'Prepare B2B offering structure', 'Monetization > B2B', false, 106)

ON CONFLICT DO NOTHING;

-- ============================================
-- AUTO-COMPLETION FUNCTION FOR ROADMAP TASKS
-- ============================================
-- This function auto-completes roadmap tasks when content is uploaded
-- to a matching target_location

CREATE OR REPLACE FUNCTION auto_complete_roadmap_task(
  p_target_location TEXT,
  p_content_type TEXT DEFAULT 'meditation'
)
RETURNS void AS $$
BEGIN
  -- Update tasks that match the target_location and have auto_complete_on_upload enabled
  UPDATE public.admin_system_tasks
  SET 
    status = 'completed',
    completed_at = now()
  WHERE 
    target_location = p_target_location
    AND auto_complete_on_upload = true
    AND status IN ('pending', 'in_progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to extract target location from meditation/healing audio
-- This can be called from application code when content is uploaded
CREATE OR REPLACE FUNCTION get_target_location_for_content(
  p_title TEXT,
  p_category TEXT,
  p_content_type TEXT DEFAULT 'meditation'
)
RETURNS TEXT AS $$
DECLARE
  v_target_location TEXT;
BEGIN
  -- For meditations, try to match based on title and category
  -- This is a simple pattern matching - can be enhanced
  IF p_content_type = 'meditation' THEN
    -- Morning meditations
    IF p_title ILIKE '%morning%' OR p_title ILIKE '%grounding%' OR p_title ILIKE '%gratitude%' OR p_title ILIKE '%intention%' THEN
      v_target_location := 'Daily > Morning';
    -- Midday meditations
    ELSIF p_title ILIKE '%midday%' OR p_title ILIKE '%reset%' OR p_title ILIKE '%recharge%' THEN
      v_target_location := 'Daily > Midday';
    -- Evening/Sleep meditations
    ELSIF p_title ILIKE '%evening%' OR p_title ILIKE '%sleep%' OR p_title ILIKE '%wind down%' OR p_title ILIKE '%sanctuary%' THEN
      v_target_location := 'Daily > Evening';
    -- Inner Peace Path
    ELSIF p_title ILIKE '%inner peace%' AND p_title ILIKE '%day%' THEN
      -- Extract day number if possible
      v_target_location := 'Paths > Inner Peace > Day ' || COALESCE(
        (SELECT regexp_replace(p_title, '.*[Dd]ay\s*(\d+).*', '\1', 'g') WHERE p_title ~* 'day\s*\d+'),
        '1'
      );
    -- Sleep Sanctuary
    ELSIF p_title ILIKE '%sleep sanctuary%' AND p_title ILIKE '%day%' THEN
      v_target_location := 'Sleep Sanctuary > Day ' || COALESCE(
        (SELECT regexp_replace(p_title, '.*[Dd]ay\s*(\d+).*', '\1', 'g') WHERE p_title ~* 'day\s*\d+'),
        '1'
      );
    -- Deep Healing
    ELSIF p_title ILIKE '%deep healing%' AND p_title ILIKE '%session%' THEN
      v_target_location := 'Healing > Deep Healing > Session ' || COALESCE(
        (SELECT regexp_replace(p_title, '.*[Ss]ession\s*(\d+).*', '\1', 'g') WHERE p_title ~* 'session\s*\d+'),
        '1'
      );
    -- Yoga Nidra
    ELSIF p_title ILIKE '%yoga nidra%' OR p_title ILIKE '%nidra%' THEN
      v_target_location := 'Yoga Nidra > Core ' || COALESCE(
        (SELECT regexp_replace(p_title, '.*[Cc]ore\s*(\d+).*', '\1', 'g') WHERE p_title ~* 'core\s*\d+'),
        '1'
      );
    -- Breathwork
    ELSIF p_title ILIKE '%breath%' OR p_title ILIKE '%breathing%' THEN
      IF p_title ILIKE '%advanced%' OR p_title ILIKE '%wim hof%' OR p_title ILIKE '%pranayama%' THEN
        v_target_location := 'Breathing > Advanced';
      ELSE
        v_target_location := 'Breathing > Basic';
      END IF;
    END IF;
  ELSIF p_content_type = 'healing' THEN
    -- For healing audio, use category to determine target
    IF p_category ILIKE '%deep healing%' THEN
      v_target_location := 'Healing > Deep Healing > Session ' || COALESCE(
        (SELECT regexp_replace(p_title, '.*[Ss]ession\s*(\d+).*', '\1', 'g') WHERE p_title ~* 'session\s*\d+'),
        '1'
      );
    ELSE
      v_target_location := 'Healing > ' || COALESCE(p_category, 'General');
    END IF;
  END IF;

  RETURN v_target_location;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-complete roadmap tasks when meditations are uploaded
CREATE OR REPLACE FUNCTION check_roadmap_task_completion_meditation()
RETURNS TRIGGER AS $$
DECLARE
  v_target_location TEXT;
BEGIN
  -- Only process if audio_url is being set (not empty)
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url != '' THEN
    -- Try to determine target location from title/category
    v_target_location := get_target_location_for_content(
      NEW.title,
      COALESCE(NEW.category, ''),
      'meditation'
    );

    -- If we found a target location, try to auto-complete matching tasks
    IF v_target_location IS NOT NULL THEN
      PERFORM auto_complete_roadmap_task(v_target_location, 'meditation');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete roadmap tasks when meditation is uploaded
CREATE TRIGGER auto_complete_roadmap_meditation
  AFTER UPDATE OF audio_url ON public.meditations
  FOR EACH ROW
  WHEN (NEW.audio_url IS DISTINCT FROM OLD.audio_url AND NEW.audio_url IS NOT NULL AND NEW.audio_url != '')
  EXECUTE FUNCTION check_roadmap_task_completion_meditation();

-- Trigger function to auto-complete roadmap tasks when healing audio is uploaded
CREATE OR REPLACE FUNCTION check_roadmap_task_completion_healing()
RETURNS TRIGGER AS $$
DECLARE
  v_target_location TEXT;
BEGIN
  -- Only process if audio_url is being set (not empty)
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url != '' THEN
    -- Try to determine target location from title/category
    v_target_location := get_target_location_for_content(
      NEW.title,
      COALESCE(NEW.category, ''),
      'healing'
    );

    -- If we found a target location, try to auto-complete matching tasks
    IF v_target_location IS NOT NULL THEN
      PERFORM auto_complete_roadmap_task(v_target_location, 'healing');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete roadmap tasks when healing audio is uploaded
CREATE TRIGGER auto_complete_roadmap_healing
  AFTER UPDATE OF audio_url ON public.healing_audio
  FOR EACH ROW
  WHEN (NEW.audio_url IS DISTINCT FROM OLD.audio_url AND NEW.audio_url IS NOT NULL AND NEW.audio_url != '')
  EXECUTE FUNCTION check_roadmap_task_completion_healing();

