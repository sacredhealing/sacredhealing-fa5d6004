-- Create membership tiers table
CREATE TABLE public.membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_eur numeric NOT NULL DEFAULT 0,
  billing_interval text DEFAULT 'month', -- month, year, one_time
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user memberships table
CREATE TABLE public.user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier_id uuid REFERENCES public.membership_tiers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- active, cancelled, expired
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  stripe_subscription_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mantras table
CREATE TABLE public.mantras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  audio_url text NOT NULL,
  cover_image_url text,
  duration_seconds integer NOT NULL DEFAULT 180,
  shc_reward integer NOT NULL DEFAULT 111,
  play_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mantra completions table
CREATE TABLE public.mantra_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mantra_id uuid REFERENCES public.mantras(id) ON DELETE CASCADE,
  shc_earned integer NOT NULL DEFAULT 111,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create shop products table
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'clothing', -- clothing, art, accessories
  price_eur numeric NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb, -- for clothing
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create shop orders table
CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
  total_eur numeric NOT NULL,
  shipping_address jsonb,
  stripe_payment_id text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create transformation program table
CREATE TABLE public.transformation_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_eur numeric NOT NULL DEFAULT 2497,
  duration_months integer NOT NULL DEFAULT 6,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create transformation enrollments table
CREATE TABLE public.transformation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid REFERENCES public.transformation_programs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- active, completed, cancelled
  current_module integer NOT NULL DEFAULT 1,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  stripe_payment_id text,
  whatsapp_group_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantra_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformation_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformation_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_tiers (public read)
CREATE POLICY "Anyone can view active membership tiers" ON public.membership_tiers FOR SELECT USING (is_active = true);

-- RLS Policies for user_memberships
CREATE POLICY "Users can view own memberships" ON public.user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memberships" ON public.user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memberships" ON public.user_memberships FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for mantras (public read)
CREATE POLICY "Anyone can view active mantras" ON public.mantras FOR SELECT USING (is_active = true);

-- RLS Policies for mantra_completions
CREATE POLICY "Users can view own mantra completions" ON public.mantra_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mantra completions" ON public.mantra_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for shop_products (public read)
CREATE POLICY "Anyone can view active products" ON public.shop_products FOR SELECT USING (is_active = true);

-- RLS Policies for shop_orders
CREATE POLICY "Users can view own orders" ON public.shop_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.shop_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.shop_orders FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for transformation_programs (public read)
CREATE POLICY "Anyone can view active programs" ON public.transformation_programs FOR SELECT USING (is_active = true);

-- RLS Policies for transformation_enrollments
CREATE POLICY "Users can view own enrollments" ON public.transformation_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enrollments" ON public.transformation_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default membership tiers
INSERT INTO public.membership_tiers (name, slug, description, price_eur, billing_interval, features, order_index) VALUES
('Free', 'free', 'Start your spiritual journey', 0, 'month', '["Basic meditations", "Community access", "Earn SHC rewards", "Daily quotes"]'::jsonb, 0),
('Starter', 'starter', 'Begin your transformation', 5, 'month', '["All free features", "10 premium meditations/month", "Basic healing audio", "Email support"]'::jsonb, 1),
('Pro', 'pro', 'Accelerate your growth', 19, 'month', '["All starter features", "Unlimited premium meditations", "Full healing audio library", "Priority support", "50% off 30-day healing"]'::jsonb, 2),
('VIP', 'vip', 'Complete spiritual mastery', 49, 'month', '["All pro features", "Exclusive VIP content", "Direct practitioner access", "Monthly group call", "Free 30-day healing access"]'::jsonb, 3);

-- Insert the 6-month transformation program
INSERT INTO public.transformation_programs (name, description, price_eur, duration_months, modules, features) VALUES
('Sacred Healing Transformation', 'A life-changing 6-month journey with personalized guidance, daily support, and deep healing integration.', 2497, 6, 
'[
  {"number": 1, "name": "Foundation & Awakening", "duration_months": 2, "description": "Establish your spiritual foundation and begin awakening your inner healer"},
  {"number": 2, "name": "Deep Healing & Integration", "duration_months": 2, "description": "Release trauma and integrate healing practices into your daily life"},
  {"number": 3, "name": "Mastery & Embodiment", "duration_months": 2, "description": "Embody your transformation and step into your power as a healer"}
]'::jsonb,
'["2 Zoom sessions per month", "Daily WhatsApp connection", "Daily healing integration practices", "Exclusive app materials", "Certificate of completion", "Lifetime community access"]'::jsonb);