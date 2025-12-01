-- Create income_streams table
CREATE TABLE public.income_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  potential_earnings TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_streams ENABLE ROW LEVEL SECURITY;

-- Anyone can view active income streams
CREATE POLICY "Anyone can view active income streams" 
ON public.income_streams 
FOR SELECT 
USING (is_active = true);

-- Authenticated users can manage income streams (admin)
CREATE POLICY "Authenticated users can manage income streams" 
ON public.income_streams 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_income_streams_updated_at
BEFORE UPDATE ON public.income_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();