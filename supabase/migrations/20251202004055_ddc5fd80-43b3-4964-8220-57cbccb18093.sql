-- Add admin management policies for mantras
CREATE POLICY "Authenticated users can manage mantras" ON public.mantras FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add admin management policies for shop_products
CREATE POLICY "Authenticated users can manage shop products" ON public.shop_products FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add admin view policy for all membership_tiers
CREATE POLICY "Authenticated users can manage membership tiers" ON public.membership_tiers FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add admin management policy for transformation_programs
CREATE POLICY "Authenticated users can manage transformation programs" ON public.transformation_programs FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add admin view policy for shop_orders
CREATE POLICY "Authenticated users can view all orders" ON public.shop_orders FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Add admin view policy for transformation_enrollments
CREATE POLICY "Authenticated users can view all enrollments" ON public.transformation_enrollments FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Add admin view policy for user_memberships
CREATE POLICY "Authenticated users can view all memberships" ON public.user_memberships FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Add admin view policy for mantra_completions
CREATE POLICY "Authenticated users can view all completions" ON public.mantra_completions FOR SELECT 
  USING (auth.uid() IS NOT NULL);