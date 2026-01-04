-- Email Sequences System
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.email_sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.email_sequence_steps(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Influencer Partners System
CREATE TABLE public.influencer_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  platform TEXT NOT NULL DEFAULT 'instagram',
  referral_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 0.20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Social Shares Tracking
CREATE TABLE public.social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_id TEXT,
  content_type TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_email_sequence_steps_sequence ON public.email_sequence_steps(sequence_id);
CREATE INDEX idx_user_email_queue_user ON public.user_email_queue(user_id);
CREATE INDEX idx_user_email_queue_status ON public.user_email_queue(status, scheduled_for);
CREATE INDEX idx_influencer_partners_code ON public.influencer_partners(referral_code);
CREATE INDEX idx_social_shares_user ON public.social_shares(user_id);

-- Enable RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_sequences (admin only read)
CREATE POLICY "Anyone can read active sequences" ON public.email_sequences
  FOR SELECT USING (is_active = true);

-- RLS Policies for email_sequence_steps (admin only read)
CREATE POLICY "Anyone can read steps" ON public.email_sequence_steps
  FOR SELECT USING (true);

-- RLS Policies for user_email_queue
CREATE POLICY "Users can view their own email queue" ON public.user_email_queue
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for influencer_partners (admin read)
CREATE POLICY "Anyone can read active influencers" ON public.influencer_partners
  FOR SELECT USING (is_active = true);

-- RLS Policies for social_shares
CREATE POLICY "Users can manage their own shares" ON public.social_shares
  FOR ALL USING (auth.uid() = user_id);

-- Insert default email sequences
INSERT INTO public.email_sequences (name, description, trigger_type) VALUES
('Welcome Series', 'Onboarding emails for new users', 'signup'),
('Weekly Inspiration', 'Weekly meditation and wisdom emails', 'recurring'),
('Re-engagement', 'Win back inactive users', 'inactive_7_days'),
('Trial Reminder', 'Remind users about trial ending', 'trial_ending');

-- Insert sample influencer
INSERT INTO public.influencer_partners (name, email, platform, referral_code, commission_rate) VALUES
('Sample Partner', 'partner@example.com', 'instagram', 'PARTNER2025', 0.25);