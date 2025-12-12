-- Create email subscribers table
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage subscribers (admin access)
CREATE POLICY "Authenticated users can view subscribers" 
ON public.email_subscribers FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert subscribers" 
ON public.email_subscribers FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update subscribers" 
ON public.email_subscribers FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete subscribers" 
ON public.email_subscribers FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create index for faster email lookups
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX idx_email_subscribers_active ON public.email_subscribers(is_active);

-- Update handle_new_user function to also add to email subscribers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, referral_code)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', public.generate_referral_code());
  
  INSERT INTO public.user_balances (user_id, balance, total_earned)
  VALUES (new.id, 50, 50);
  
  INSERT INTO public.shc_transactions (user_id, type, amount, description, status)
  VALUES (new.id, 'earned', 50, 'Welcome bonus', 'completed');
  
  -- Add to email subscribers list
  INSERT INTO public.email_subscribers (email, name, source)
  VALUES (new.email, new.raw_user_meta_data ->> 'full_name', 'signup')
  ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, email_subscribers.name),
    is_active = true;
  
  RETURN new;
END;
$function$;