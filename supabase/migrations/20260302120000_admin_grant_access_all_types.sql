-- Allow admin to grant access to any product in the app (courses, membership, Sri Yantra, Creative Soul, Stargate, etc.)
-- Drop the restrictive CHECK so access_type can be any app product identifier.
ALTER TABLE public.admin_granted_access
  DROP CONSTRAINT IF EXISTS admin_granted_access_access_type_check;

-- Optional: add a comment for clarity
COMMENT ON COLUMN public.admin_granted_access.access_type IS 'Product/feature: membership, course, path, program, sri_yantra_shield, creative_soul, creative_soul_meditation, stargate, healing, meditation_membership, music_membership, transformation, etc.';
