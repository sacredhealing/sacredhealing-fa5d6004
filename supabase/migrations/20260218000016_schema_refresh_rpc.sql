-- URGENT: DATABASE SYNC & MANTRA RESTORATION
-- Create RPC function to refresh PostgREST schema cache programmatically

-- Function to refresh PostgREST schema cache
CREATE OR REPLACE FUNCTION public.refresh_postgrest_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Send NOTIFY to refresh PostgREST schema cache
  PERFORM pg_notify('pgrst', 'reload schema');
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'PostgREST schema cache refresh triggered',
    'timestamp', now()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_postgrest_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_postgrest_schema() TO anon;

-- Function to check mantras table structure
CREATE OR REPLACE FUNCTION public.check_mantras_structure()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  columns_info jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable
    )
  ) INTO columns_info
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'mantras'
  ORDER BY ordinal_position;
  
  RETURN jsonb_build_object(
    'success', true,
    'columns', columns_info,
    'has_category', EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mantras' 
      AND column_name = 'category'
    ),
    'has_planet_type', EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mantras' 
      AND column_name = 'planet_type'
    ),
    'has_is_active', EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mantras' 
      AND column_name = 'is_active'
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_mantras_structure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_mantras_structure() TO anon;
