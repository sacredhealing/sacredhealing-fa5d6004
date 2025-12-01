-- Create healing_purchases table for one-time and subscription purchases
CREATE TABLE public.healing_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),
  amount_paid NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create healing_audio table for free and purchasable audio files
CREATE TABLE public.healing_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  preview_url TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 180,
  is_free BOOLEAN NOT NULL DEFAULT false,
  price_usd NUMERIC NOT NULL DEFAULT 4.99,
  price_shc INTEGER NOT NULL DEFAULT 50,
  category TEXT NOT NULL DEFAULT 'healing',
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create healing_audio_purchases table
CREATE TABLE public.healing_audio_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  audio_id UUID NOT NULL REFERENCES public.healing_audio(id),
  payment_method TEXT NOT NULL,
  amount_paid NUMERIC,
  shc_paid INTEGER,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.healing_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healing_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healing_audio_purchases ENABLE ROW LEVEL SECURITY;

-- Healing purchases policies
CREATE POLICY "Users can view their own healing purchases" ON public.healing_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own healing purchases" ON public.healing_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Healing audio policies (public read)
CREATE POLICY "Anyone can view healing audio" ON public.healing_audio FOR SELECT USING (true);

-- Healing audio purchases policies
CREATE POLICY "Users can view their own audio purchases" ON public.healing_audio_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audio purchases" ON public.healing_audio_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);