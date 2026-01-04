-- Add missing tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.path_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.spiritual_paths(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meditation_id UUID REFERENCES public.meditations(id),
  mantra_id UUID REFERENCES public.mantras(id),
  reflection_prompt TEXT,
  affirmation TEXT,
  shc_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(path_id, day_number)
);

CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_completed BOOLEAN DEFAULT false,
  morning_completed_at TIMESTAMP WITH TIME ZONE,
  midday_completed BOOLEAN DEFAULT false,
  midday_completed_at TIMESTAMP WITH TIME ZONE,
  evening_completed BOOLEAN DEFAULT false,
  evening_completed_at TIMESTAMP WITH TIME ZONE,
  meditation_id UUID REFERENCES public.meditations(id),
  mood_morning TEXT,
  mood_evening TEXT,
  reflection_notes TEXT,
  shc_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  goals TEXT[] DEFAULT '{}',
  practice_duration TEXT DEFAULT '10',
  morning_time TEXT DEFAULT '07:00',
  midday_time TEXT DEFAULT '12:00',
  evening_time TEXT DEFAULT '21:00',
  preferred_path_id UUID REFERENCES public.spiritual_paths(id),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.path_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view path days" 
ON public.path_days FOR SELECT USING (true);

CREATE POLICY "Admins can manage path days" 
ON public.path_days FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own daily activities" 
ON public.daily_activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own daily activities" 
ON public.daily_activities FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own goals" 
ON public.user_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own goals" 
ON public.user_goals FOR ALL 
USING (auth.uid() = user_id);

-- Add preferred_language to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
  END IF;
END $$;

-- Insert sample path days for existing paths
INSERT INTO public.path_days (path_id, day_number, title, description, reflection_prompt, affirmation, shc_reward)
SELECT 
  sp.id,
  day_num,
  CASE day_num
    WHEN 1 THEN 'Finding Stillness'
    WHEN 2 THEN 'Breath of Peace'
    WHEN 3 THEN 'Releasing Tension'
    WHEN 4 THEN 'Embracing Silence'
    WHEN 5 THEN 'Heart Opening'
    WHEN 6 THEN 'Grounding Presence'
    WHEN 7 THEN 'Peaceful Integration'
  END,
  CASE day_num
    WHEN 1 THEN 'Begin your journey by connecting with the stillness within.'
    WHEN 2 THEN 'Discover the calming power of conscious breathing.'
    WHEN 3 THEN 'Learn to release physical and mental tension.'
    WHEN 4 THEN 'Find peace in moments of silence and solitude.'
    WHEN 5 THEN 'Open your heart to love and compassion.'
    WHEN 6 THEN 'Ground yourself in the present moment.'
    WHEN 7 THEN 'Integrate your learnings into daily life.'
  END,
  CASE day_num
    WHEN 1 THEN 'What does inner peace mean to you?'
    WHEN 2 THEN 'How does your breath affect your emotional state?'
    WHEN 3 THEN 'Where do you hold tension in your body?'
    WHEN 4 THEN 'What arises when you sit in silence?'
    WHEN 5 THEN 'What would you tell your younger self?'
    WHEN 6 THEN 'What helps you feel grounded?'
    WHEN 7 THEN 'How will you maintain peace in daily life?'
  END,
  CASE day_num
    WHEN 1 THEN 'I am at peace with myself and the world around me.'
    WHEN 2 THEN 'With each breath, I invite calmness and release worry.'
    WHEN 3 THEN 'I release what no longer serves me with love.'
    WHEN 4 THEN 'In silence, I find my true self.'
    WHEN 5 THEN 'My heart is open to give and receive love.'
    WHEN 6 THEN 'I am grounded, centered, and secure.'
    WHEN 7 THEN 'Peace flows through me in every moment.'
  END,
  50
FROM public.spiritual_paths sp
CROSS JOIN generate_series(1, 7) AS day_num
WHERE sp.slug = 'inner-peace-7day'
ON CONFLICT (path_id, day_number) DO NOTHING;