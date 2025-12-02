-- Add unique constraint for user_wallets if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_wallets_user_id_wallet_address_key'
  ) THEN
    ALTER TABLE public.user_wallets ADD CONSTRAINT user_wallets_user_id_wallet_address_key UNIQUE (user_id, wallet_address);
  END IF;
END $$;

-- Create private sessions table
CREATE TABLE public.session_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session packages table
CREATE TABLE public.session_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  session_count INTEGER NOT NULL DEFAULT 1,
  price_eur NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session bookings table
CREATE TABLE public.session_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type_id UUID NOT NULL REFERENCES public.session_types(id),
  package_id UUID NOT NULL REFERENCES public.session_packages(id),
  practitioner TEXT NOT NULL DEFAULT 'adam',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  stripe_payment_id TEXT,
  amount_paid NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_types (public read)
CREATE POLICY "Anyone can view session types" ON public.session_types FOR SELECT USING (is_active = true);

-- RLS policies for session_packages (public read)
CREATE POLICY "Anyone can view session packages" ON public.session_packages FOR SELECT USING (is_active = true);

-- RLS policies for session_bookings
CREATE POLICY "Users can view own bookings" ON public.session_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.session_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.session_bookings FOR UPDATE USING (auth.uid() = user_id);

-- Insert session types
INSERT INTO public.session_types (name, description, category, order_index) VALUES
  ('Yoga Integration', 'Integrate yoga practices into your spiritual journey for mind-body harmony', 'spiritual', 1),
  ('Voice Healing & Expansion', 'Unlock your authentic voice and expand your energy through sound healing', 'healing', 2),
  ('Healing & 3rd Eye Activation', 'Deep healing work combined with third eye chakra activation', 'healing', 3),
  ('Meditation Training & Spiritual Integration', 'Master meditation techniques and awaken your spiritual gifts', 'spiritual', 4),
  ('Trauma Healing', 'Compassionate support for healing deep emotional wounds and trauma', 'healing', 5),
  ('Men''s Transformation', 'Control sexual desires, overcome addictions, and master the mind - for men seeking transformation', 'men', 6);

-- Insert session packages
INSERT INTO public.session_packages (name, description, session_count, price_eur, order_index) VALUES
  ('Single Session', 'One transformative 60-minute session', 1, 79, 1),
  ('3-Session Package', 'Three sessions for deeper transformation - Save €40', 3, 197, 2);