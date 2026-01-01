-- Add new fields to income_streams for full admin control
ALTER TABLE public.income_streams
ADD COLUMN IF NOT EXISTS icon_name text DEFAULT 'Sparkles',
ADD COLUMN IF NOT EXISTS badge_text text,
ADD COLUMN IF NOT EXISTS badge_text_sv text,
ADD COLUMN IF NOT EXISTS badge_text_es text,
ADD COLUMN IF NOT EXISTS badge_text_no text,
ADD COLUMN IF NOT EXISTS color_from text DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS color_to text DEFAULT 'primary/70',
ADD COLUMN IF NOT EXISTS internal_slug text,
ADD COLUMN IF NOT EXISTS cta_button_text text DEFAULT 'Learn More',
ADD COLUMN IF NOT EXISTS cta_button_text_sv text,
ADD COLUMN IF NOT EXISTS cta_button_text_es text,
ADD COLUMN IF NOT EXISTS cta_button_text_no text;

-- Insert the static streams into the database if they don't exist
INSERT INTO public.income_streams (title, description, link, category, is_featured, is_active, order_index, icon_name, badge_text, color_from, color_to, internal_slug)
SELECT 'Affiliate Program', 'Earn commissions by referring new users to our platform.', '/income-streams/affiliate', 'affiliate', true, true, 0, 'Users', 'Popular', 'primary', 'primary/70', 'affiliate'
WHERE NOT EXISTS (SELECT 1 FROM public.income_streams WHERE internal_slug = 'affiliate');

INSERT INTO public.income_streams (title, description, link, category, is_featured, is_active, order_index, icon_name, badge_text, color_from, color_to, internal_slug)
SELECT 'SHC Coin', 'Invest in our native token and grow with the community.', '/income-streams/shc-coin', 'investment', false, true, 1, 'Coins', 'Investment', 'accent', 'amber-500', 'shc-coin'
WHERE NOT EXISTS (SELECT 1 FROM public.income_streams WHERE internal_slug = 'shc-coin');

INSERT INTO public.income_streams (title, description, link, category, is_featured, is_active, order_index, icon_name, badge_text, color_from, color_to, internal_slug)
SELECT 'Copy Trading', 'Earn passively by copying professional forex trades. Fully automated.', '/income-streams/copy-trading', 'passive', false, true, 2, 'TrendingUp', 'Passive', 'green-500', 'emerald-600', 'copy-trading'
WHERE NOT EXISTS (SELECT 1 FROM public.income_streams WHERE internal_slug = 'copy-trading');

INSERT INTO public.income_streams (title, description, link, category, is_featured, is_active, order_index, icon_name, badge_text, color_from, color_to, internal_slug)
SELECT 'Bitcoin Mining', 'Earn Bitcoin passively through cloud mining. No hardware required.', '/income-streams/bitcoin-mining', 'investment', false, true, 3, 'Cpu', 'Crypto', 'orange-500', 'amber-600', 'bitcoin-mining'
WHERE NOT EXISTS (SELECT 1 FROM public.income_streams WHERE internal_slug = 'bitcoin-mining');

INSERT INTO public.income_streams (title, description, link, category, is_featured, is_active, order_index, icon_name, badge_text, color_from, color_to, internal_slug)
SELECT 'AI Income Engine', 'Leverage AI tools to create automated income streams.', '/income-streams/ai-income', 'passive', false, true, 4, 'Bot', 'New', 'violet-500', 'purple-600', 'ai-income'
WHERE NOT EXISTS (SELECT 1 FROM public.income_streams WHERE internal_slug = 'ai-income');

INSERT INTO public.income_streams (title, description, link, category, is_featured, is_active, order_index, icon_name, badge_text, color_from, color_to, internal_slug)
SELECT 'Education Hub', 'Access courses and guides to master trading and investing.', '/income-streams/education', 'other', false, true, 5, 'GraduationCap', 'Learn', 'blue-500', 'cyan-500', 'education'
WHERE NOT EXISTS (SELECT 1 FROM public.income_streams WHERE internal_slug = 'education');