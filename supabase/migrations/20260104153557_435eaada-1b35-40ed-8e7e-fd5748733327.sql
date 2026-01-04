-- Analytics Views for KPI Tracking

-- Daily Active Users tracking table
CREATE TABLE IF NOT EXISTS public.daily_active_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT NOT NULL,
  activity_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date, activity_type)
);

-- User retention cohorts
CREATE TABLE IF NOT EXISTS public.user_cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  signup_date DATE NOT NULL,
  first_activity_date DATE,
  last_activity_date DATE,
  d1_retained BOOLEAN DEFAULT false,
  d7_retained BOOLEAN DEFAULT false,
  d30_retained BOOLEAN DEFAULT false,
  conversion_stage TEXT DEFAULT 'free',
  converted_to_trial_at TIMESTAMP WITH TIME ZONE,
  converted_to_paid_at TIMESTAMP WITH TIME ZONE,
  churned_at TIMESTAMP WITH TIME ZONE,
  upgraded_at TIMESTAMP WITH TIME ZONE,
  current_tier TEXT DEFAULT 'free',
  lifetime_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue tracking by tier
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  tier_slug TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Path and meditation activity tracking
CREATE TABLE IF NOT EXISTS public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_name TEXT,
  duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_daily_active_users_date ON public.daily_active_users(activity_date);
CREATE INDEX idx_daily_active_users_user ON public.daily_active_users(user_id);
CREATE INDEX idx_user_cohorts_signup ON public.user_cohorts(signup_date);
CREATE INDEX idx_user_cohorts_stage ON public.user_cohorts(conversion_stage);
CREATE INDEX idx_revenue_events_date ON public.revenue_events(created_at);
CREATE INDEX idx_revenue_events_tier ON public.revenue_events(tier_slug);
CREATE INDEX idx_content_analytics_date ON public.content_analytics(activity_date);
CREATE INDEX idx_content_analytics_type ON public.content_analytics(content_type);

-- Enable RLS
ALTER TABLE public.daily_active_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin read-only, users can see their own)
CREATE POLICY "Users can view their own DAU" ON public.daily_active_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DAU" ON public.daily_active_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cohort" ON public.user_cohorts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own revenue" ON public.revenue_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own content analytics" ON public.content_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert content analytics" ON public.content_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update user cohort on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_cohort()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_cohorts (user_id, signup_date)
  VALUES (NEW.id, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user cohort creation
DROP TRIGGER IF EXISTS on_auth_user_created_cohort ON auth.users;
CREATE TRIGGER on_auth_user_created_cohort
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_cohort();