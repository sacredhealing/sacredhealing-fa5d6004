-- Create custom meditation bookings table
CREATE TABLE public.custom_meditation_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('single', 'double')),
  amount_paid NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  notes TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_meditation_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own bookings" 
ON public.custom_meditation_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" 
ON public.custom_meditation_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
ON public.custom_meditation_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_custom_meditation_bookings_updated_at
BEFORE UPDATE ON public.custom_meditation_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();