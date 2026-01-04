-- Create revenue_records table for tracking all revenue sources
CREATE TABLE public.revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL,
  product_name TEXT,
  amount_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_shc INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'stripe',
  customer_id UUID,
  customer_email TEXT,
  stripe_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (using user_roles table pattern from existing codebase)
CREATE POLICY "Admins can view revenue records" 
ON public.revenue_records 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert revenue records" 
ON public.revenue_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update revenue records" 
ON public.revenue_records 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete revenue records" 
ON public.revenue_records 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_revenue_records_created_at ON public.revenue_records(created_at DESC);
CREATE INDEX idx_revenue_records_product_type ON public.revenue_records(product_type);