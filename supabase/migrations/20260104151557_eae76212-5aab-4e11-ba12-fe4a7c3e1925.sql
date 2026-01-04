-- Create promotional_offers table
CREATE TABLE public.promotional_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount')),
  discount_value NUMERIC NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  applicable_tiers TEXT[] DEFAULT ARRAY['premium-monthly', 'premium-annual'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_offers table
CREATE TABLE public.user_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, offer_id)
);

-- Create free_trials table
CREATE TABLE public.free_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_tier TEXT NOT NULL DEFAULT 'premium',
  converted BOOLEAN NOT NULL DEFAULT false,
  conversion_date TIMESTAMP WITH TIME ZONE,
  reminder_sent_day_7 BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_day_12 BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_day_14 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Award',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('streak', 'sessions', 'community', 'special', 'general')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  shc_reward INTEGER NOT NULL DEFAULT 0,
  badge_color TEXT DEFAULT 'gold',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shared BOOLEAN NOT NULL DEFAULT false,
  shared_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, achievement_id)
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Star',
  shc_reward INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_milestones table
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  reached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS on all tables
ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- Promotional offers - public read for active offers
CREATE POLICY "Anyone can view active promotional offers"
ON public.promotional_offers FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- User offers policies
CREATE POLICY "Users can view their own offers"
ON public.user_offers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offers"
ON public.user_offers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers"
ON public.user_offers FOR UPDATE
USING (auth.uid() = user_id);

-- Free trials policies
CREATE POLICY "Users can view their own trial"
ON public.free_trials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trial"
ON public.free_trials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial"
ON public.free_trials FOR UPDATE
USING (auth.uid() = user_id);

-- Achievements - public read
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (is_active = true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
ON public.user_achievements FOR UPDATE
USING (auth.uid() = user_id);

-- Milestones - public read
CREATE POLICY "Anyone can view milestones"
ON public.milestones FOR SELECT
USING (is_active = true);

-- User milestones policies
CREATE POLICY "Users can view their own milestones"
ON public.user_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
ON public.user_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (slug, name, description, icon_name, category, requirement_type, requirement_value, shc_reward, badge_color, order_index) VALUES
('first-meditation', 'First Steps', 'Complete your first meditation', 'Sparkles', 'sessions', 'meditation_count', 1, 10, 'bronze', 1),
('streak-3', 'Building Momentum', 'Maintain a 3-day streak', 'Flame', 'streak', 'streak_days', 3, 25, 'bronze', 2),
('streak-7', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'streak', 'streak_days', 7, 50, 'silver', 3),
('streak-30', 'Monthly Master', 'Maintain a 30-day streak', 'Flame', 'streak', 'streak_days', 30, 200, 'gold', 4),
('sessions-10', 'Dedicated Practitioner', 'Complete 10 sessions', 'Target', 'sessions', 'total_sessions', 10, 50, 'bronze', 5),
('sessions-50', 'Committed Seeker', 'Complete 50 sessions', 'Target', 'sessions', 'total_sessions', 50, 150, 'silver', 6),
('sessions-100', 'Enlightened Soul', 'Complete 100 sessions', 'Target', 'sessions', 'total_sessions', 100, 300, 'gold', 7),
('first-share', 'Social Butterfly', 'Share your progress', 'Share2', 'community', 'shares', 1, 25, 'bronze', 8),
('first-referral', 'Community Builder', 'Refer your first friend', 'Users', 'community', 'referrals', 1, 100, 'gold', 9),
('early-adopter', 'Early Adopter', 'Joined during launch period', 'Star', 'special', 'special', 1, 50, 'purple', 10);

-- Insert default milestones
INSERT INTO public.milestones (name, description, requirement_type, requirement_value, icon_name, shc_reward, order_index) VALUES
('Novice Healer', 'Complete 25 sessions and reach level 1', 'total_sessions', 25, 'Heart', 100, 1),
('Apprentice Healer', 'Complete 50 sessions and reach level 2', 'total_sessions', 50, 'Heart', 200, 2),
('Journeyman Healer', 'Complete 100 sessions and reach level 3', 'total_sessions', 100, 'Heart', 400, 3),
('Master Healer', 'Complete 250 sessions and reach level 4', 'total_sessions', 250, 'Heart', 800, 4),
('Grandmaster Healer', 'Complete 500 sessions and reach level 5', 'total_sessions', 500, 'Crown', 1500, 5),
('One Month Journey', 'Practice for 30 days total', 'days_active', 30, 'Calendar', 150, 6),
('Six Month Journey', 'Practice for 180 days total', 'days_active', 180, 'Calendar', 500, 7),
('One Year Journey', 'Practice for 365 days total', 'days_active', 365, 'Calendar', 1000, 8);

-- Insert default promotional offers
INSERT INTO public.promotional_offers (name, code, discount_type, discount_value, valid_until, applicable_tiers) VALUES
('Welcome 30% Off', 'WELCOME30', 'percent', 30, now() + interval '1 year', ARRAY['premium-monthly', 'premium-annual']),
('New Year New You', 'NEWYEAR2026', 'percent', 25, '2026-01-31 23:59:59+00', ARRAY['premium-monthly', 'premium-annual']),
('First Annual 40% Off', 'ANNUAL40', 'percent', 40, now() + interval '1 year', ARRAY['premium-annual']);