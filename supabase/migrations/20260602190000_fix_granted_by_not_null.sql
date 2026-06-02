-- Fix: granted_by column had NOT NULL constraint causing all admin grants to fail
-- Both tier grants (access_type='membership') and product grants (access_type='product')
-- were failing with: null value in column "granted_by" violates not-null constraint
-- Root cause: new Supabase project had stricter column definition than old Lovable project

ALTER TABLE public.admin_granted_access
  ALTER COLUMN granted_by DROP NOT NULL;

COMMENT ON COLUMN public.admin_granted_access.granted_by IS
  'UUID of admin who granted access. Nullable to support system grants.';
