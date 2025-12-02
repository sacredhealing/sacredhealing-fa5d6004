-- Create mastering_orders table
CREATE TABLE public.mastering_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('single', 'bundle')),
  track_count INTEGER NOT NULL DEFAULT 1,
  amount_paid NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'cancelled')),
  contact_email TEXT NOT NULL,
  notes TEXT,
  file_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mastering_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own mastering orders"
ON public.mastering_orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create mastering orders"
ON public.mastering_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mastering orders"
ON public.mastering_orders
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mastering_orders_updated_at
BEFORE UPDATE ON public.mastering_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for mastering files
INSERT INTO storage.buckets (id, name, public)
VALUES ('mastering-uploads', 'mastering-uploads', false);

-- Storage policies - users can upload to their own folder
CREATE POLICY "Users can upload mastering files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'mastering-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own mastering files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mastering-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin can view all mastering files (for processing)
CREATE POLICY "Authenticated users can view all mastering files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mastering-uploads' 
  AND auth.uid() IS NOT NULL
);