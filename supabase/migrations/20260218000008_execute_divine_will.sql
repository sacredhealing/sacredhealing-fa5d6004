-- ============================================================
-- Siddha-Core: execute_divine_will RPC
-- Master Admin Bypass: Total RLS Override for Divine Administration
-- ============================================================

-- Create the Divine Will execution function
CREATE OR REPLACE FUNCTION public.execute_divine_will(
  operation text,
  table_name text,
  operation_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  -- Verify admin status using master check
  SELECT public.check_is_master_admin() OR public.fn_admin_master_check() INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied: Divine Will requires master admin privileges';
  END IF;

  -- Execute operations based on type
  CASE operation
    WHEN 'insert' THEN
      EXECUTE format('INSERT INTO %I %s RETURNING *', table_name, 
        (SELECT string_agg(key || ' = ' || quote_literal(value::text), ', ') 
         FROM jsonb_each_text(operation_data))) INTO result;
    
    WHEN 'update' THEN
      EXECUTE format('UPDATE %I SET %s WHERE id = %L RETURNING *', 
        table_name,
        (SELECT string_agg(key || ' = ' || quote_literal(value::text), ', ') 
         FROM jsonb_each_text(operation_data - 'id')),
        operation_data->>'id') INTO result;
    
    WHEN 'delete' THEN
      EXECUTE format('DELETE FROM %I WHERE id = %L RETURNING *', 
        table_name, operation_data->>'id') INTO result;
    
    WHEN 'select' THEN
      EXECUTE format('SELECT * FROM %I WHERE %s', 
        table_name,
        (SELECT string_agg(key || ' = ' || quote_literal(value::text), ' AND ') 
         FROM jsonb_each_text(operation_data))) INTO result;
    
    WHEN 'add_member' THEN
      -- Specialized: Add member to any room, bypassing all gates
      INSERT INTO public.chat_members (room_id, user_id, role, joined_at)
      VALUES (
        (operation_data->>'room_id')::uuid,
        (operation_data->>'user_id')::uuid,
        COALESCE(operation_data->>'role', 'member'),
        now()
      )
      ON CONFLICT (room_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        joined_at = now()
      RETURNING * INTO result;
    
    WHEN 'remove_member' THEN
      DELETE FROM public.chat_members
      WHERE room_id = (operation_data->>'room_id')::uuid
        AND user_id = (operation_data->>'user_id')::uuid
      RETURNING * INTO result;
    
    ELSE
      RAISE EXCEPTION 'Unknown operation: %', operation;
  END CASE;

  RETURN COALESCE(result, '{"success": true}'::jsonb);
END;
$$;

-- Grant execute to authenticated users (RLS will enforce admin check)
REVOKE ALL ON FUNCTION public.execute_divine_will FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_divine_will TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.execute_divine_will IS 'Divine Will: Master admin bypass for all RLS-protected operations. Use with sacred responsibility.';
