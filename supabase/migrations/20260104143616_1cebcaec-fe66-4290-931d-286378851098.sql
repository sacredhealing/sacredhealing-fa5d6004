-- Phase 1 (retry): Daily Engagement & Spiritual Coaching schema
-- Fix: use existing role system via public.has_role(auth.uid(), 'admin')

-- 1) user_spiritual_goals
CREATE TABLE IF NOT EXISTS public.user_spiritual_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_spiritual_goals_unique ON public.user_spiritual_goals(user_id, goal_type);
CREATE INDEX IF NOT EXISTS idx_user_spiritual_goals_user ON public.user_spiritual_goals(user_id);

ALTER TABLE public.user_spiritual_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_spiritual_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.user_spiritual_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_spiritual_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.user_spiritual_goals;

CREATE POLICY "Users can view their own goals" ON public.user_spiritual_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.user_spiritual_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.user_spiritual_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.user_spiritual_goals
  FOR DELETE USING (auth.uid() = user_id);


-- 2) spiritual_paths
CREATE TABLE IF NOT EXISTS public.spiritual_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  duration_days INTEGER NOT NULL DEFAULT 21,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  goal_types TEXT[] NOT NULL DEFAULT '{}',
  shc_reward_total INTEGER NOT NULL DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spiritual_paths_active ON public.spiritual_paths(is_active, order_index);

ALTER TABLE public.spiritual_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active paths" ON public.spiritual_paths;
DROP POLICY IF EXISTS "Admins can manage paths" ON public.spiritual_paths;

CREATE POLICY "Anyone can view active paths" ON public.spiritual_paths
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage paths" ON public.spiritual_paths
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- 3) spiritual_path_days
CREATE TABLE IF NOT EXISTS public.spiritual_path_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES public.spiritual_paths ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  morning_meditation_id UUID REFERENCES public.meditations(id) ON DELETE SET NULL,
  evening_meditation_id UUID REFERENCES public.meditations(id) ON DELETE SET NULL,
  mantra_id UUID REFERENCES public.mantras(id) ON DELETE SET NULL,
  breathing_pattern_id UUID REFERENCES public.breathing_patterns(id) ON DELETE SET NULL,
  journal_prompt TEXT,
  affirmation TEXT,
  shc_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(path_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_spiritual_path_days_path ON public.spiritual_path_days(path_id, day_number);

ALTER TABLE public.spiritual_path_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view path days" ON public.spiritual_path_days;
DROP POLICY IF EXISTS "Admins can manage path days" ON public.spiritual_path_days;

CREATE POLICY "Anyone can view path days" ON public.spiritual_path_days
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage path days" ON public.spiritual_path_days
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- 4) user_path_progress
CREATE TABLE IF NOT EXISTS public.user_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  path_id UUID REFERENCES public.spiritual_paths ON DELETE CASCADE NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_shc_earned INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_user_path_progress_user ON public.user_path_progress(user_id, is_active);

ALTER TABLE public.user_path_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_path_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_path_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_path_progress;

CREATE POLICY "Users can view their own progress" ON public.user_path_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_path_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_path_progress
  FOR UPDATE USING (auth.uid() = user_id);


-- 5) user_daily_activities
CREATE TABLE IF NOT EXISTS public.user_daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_completed BOOLEAN NOT NULL DEFAULT false,
  morning_completed_at TIMESTAMPTZ,
  morning_meditation_id UUID REFERENCES public.meditations(id) ON DELETE SET NULL,
  midday_completed BOOLEAN NOT NULL DEFAULT false,
  midday_completed_at TIMESTAMPTZ,
  evening_completed BOOLEAN NOT NULL DEFAULT false,
  evening_completed_at TIMESTAMPTZ,
  evening_meditation_id UUID REFERENCES public.meditations(id) ON DELETE SET NULL,
  mood_morning INTEGER,
  mood_evening INTEGER,
  shc_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_activities_user_date ON public.user_daily_activities(user_id, activity_date DESC);

ALTER TABLE public.user_daily_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_daily_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.user_daily_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.user_daily_activities;

CREATE POLICY "Users can view their own activities" ON public.user_daily_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON public.user_daily_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON public.user_daily_activities
  FOR UPDATE USING (auth.uid() = user_id);


-- 6) user_journal_entries
CREATE TABLE IF NOT EXISTS public.user_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompt TEXT,
  content TEXT,
  mood INTEGER,
  gratitude_items TEXT[] NOT NULL DEFAULT '{}',
  path_day_id UUID REFERENCES public.spiritual_path_days(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_journal_entries_user_date ON public.user_journal_entries(user_id, entry_date DESC);

ALTER TABLE public.user_journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.user_journal_entries;
DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.user_journal_entries;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.user_journal_entries;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.user_journal_entries;

CREATE POLICY "Users can view their own journal entries" ON public.user_journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON public.user_journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON public.user_journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON public.user_journal_entries
  FOR DELETE USING (auth.uid() = user_id);


-- 7) profiles columns for onboarding + preferences
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_practice_duration INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS notification_style TEXT NOT NULL DEFAULT 'gentle',
  ADD COLUMN IF NOT EXISTS morning_reminder_time TIME NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS midday_reminder_time TIME NOT NULL DEFAULT '13:00',
  ADD COLUMN IF NOT EXISTS evening_reminder_time TIME NOT NULL DEFAULT '21:00';


-- 8) updated_at triggers (uses existing public.update_updated_at_column())
DROP TRIGGER IF EXISTS update_spiritual_paths_updated_at ON public.spiritual_paths;
CREATE TRIGGER update_spiritual_paths_updated_at
  BEFORE UPDATE ON public.spiritual_paths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.user_journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.user_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
