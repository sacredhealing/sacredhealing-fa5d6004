-- Create wishlist table for saving products
CREATE TABLE public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
ON public.wishlists
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their wishlist
CREATE POLICY "Users can add to wishlist"
ON public.wishlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their wishlist
CREATE POLICY "Users can remove from wishlist"
ON public.wishlists
FOR DELETE
USING (auth.uid() = user_id);