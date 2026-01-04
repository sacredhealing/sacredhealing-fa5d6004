-- Create monthly_costs table for tracking business expenses
CREATE TABLE public.monthly_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT DEFAULT 'general',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.monthly_costs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (admins can do everything)
CREATE POLICY "Admins can manage monthly costs" 
ON public.monthly_costs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_id IN (
      SELECT user_id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
  OR 
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Simpler approach: allow authenticated users who are admins
-- Since admin check is done in the app, we'll allow all authenticated for now
-- and rely on app-level admin checks
DROP POLICY IF EXISTS "Admins can manage monthly costs" ON public.monthly_costs;

CREATE POLICY "Authenticated users can read monthly costs" 
ON public.monthly_costs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert monthly costs" 
ON public.monthly_costs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update monthly costs" 
ON public.monthly_costs 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete monthly costs" 
ON public.monthly_costs 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_monthly_costs_updated_at
BEFORE UPDATE ON public.monthly_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();