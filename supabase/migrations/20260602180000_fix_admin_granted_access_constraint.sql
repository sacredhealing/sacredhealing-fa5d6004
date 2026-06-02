-- ============================================================
-- FIX: admin_granted_access_access_type_check constraint
-- The live DB still has a restrictive CHECK on access_type.
-- This migration removes it and adds a permissive CHECK that
-- covers all current SQI access types: membership, product,
-- course, path, program, and any future string value.
-- ============================================================

-- 1. Drop all known variants of the constraint name (safe if missing)
ALTER TABLE public.admin_granted_access
  DROP CONSTRAINT IF EXISTS admin_granted_access_access_type_check;

ALTER TABLE public.admin_granted_access
  DROP CONSTRAINT IF EXISTS admin_granted_access_access_type_check1;

-- 2. Ensure access_type column exists with correct type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_granted_access'
      AND column_name = 'access_type'
  ) THEN
    ALTER TABLE public.admin_granted_access
      ADD COLUMN access_type TEXT NOT NULL DEFAULT 'membership';
  END IF;
END $$;

-- 3. Add a permissive CHECK: any non-empty string is valid
--    This covers: membership, product, course, path, program,
--    sri_yantra_shield, healing, meditation_membership, etc.
ALTER TABLE public.admin_granted_access
  ADD CONSTRAINT admin_granted_access_access_type_check
  CHECK (access_type IS NOT NULL AND length(trim(access_type)) > 0);

-- 4. Ensure access_id column exists (product grants use this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_granted_access'
      AND column_name = 'access_id'
  ) THEN
    ALTER TABLE public.admin_granted_access
      ADD COLUMN access_id TEXT;
  END IF;
END $$;

-- 5. Ensure granted_by column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_granted_access'
      AND column_name = 'granted_by'
  ) THEN
    ALTER TABLE public.admin_granted_access
      ADD COLUMN granted_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 6. Comment for clarity
COMMENT ON COLUMN public.admin_granted_access.access_type IS
  'SQI access types: membership | product | course | path | program | sri_yantra_shield | healing | etc.';

COMMENT ON COLUMN public.admin_granted_access.access_id IS
  'Product/feature ID: akashic-reading | digital-nadi | shakti-cycle | quantum-apothecary | etc.';
