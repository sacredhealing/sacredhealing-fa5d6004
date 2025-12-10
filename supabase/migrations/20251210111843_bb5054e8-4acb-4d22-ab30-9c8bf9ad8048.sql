-- Add new columns to transformation_programs for installment support and practitioner
ALTER TABLE public.transformation_programs 
ADD COLUMN IF NOT EXISTS installment_price_eur numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS installment_count integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS practitioner text DEFAULT 'both';

-- Create transformation_variations table for different package options
CREATE TABLE IF NOT EXISTS public.transformation_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.transformation_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  price_eur NUMERIC NOT NULL DEFAULT 0,
  installment_price_eur NUMERIC DEFAULT 0,
  installment_count INTEGER DEFAULT 3,
  duration_months INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transformation_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active transformation variations"
ON public.transformation_variations
FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can manage transformation variations"
ON public.transformation_variations
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_transformation_variations_updated_at
BEFORE UPDATE ON public.transformation_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();