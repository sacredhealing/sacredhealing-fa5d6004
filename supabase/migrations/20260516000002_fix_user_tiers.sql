-- Fix Akasha-Infinity access for Pia Svanberg and Margaretha Donosa
UPDATE profiles
SET
  membership_tier = 'akasha-infinity',
  has_prana_flow_access = true,
  has_siddha_quantum_access = true
WHERE id IN (
  SELECT p.id
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE
    LOWER(u.email) LIKE '%pia%svanberg%'
    OR LOWER(u.email) LIKE '%margaretha%'
    OR LOWER(u.email) LIKE '%donosa%'
    OR LOWER(p.full_name) ILIKE '%pia svanberg%'
    OR LOWER(p.full_name) ILIKE '%margaretha%'
    OR LOWER(p.full_name) ILIKE '%donosa%'
);

-- Verify Julia Atkins has correct tier (she should already be set)
-- This just ensures her access columns are correct
UPDATE profiles
SET
  has_prana_flow_access = true,
  has_siddha_quantum_access = CASE WHEN membership_tier IN ('siddha-quantum','akasha-infinity') THEN true ELSE has_siddha_quantum_access END
WHERE id IN (
  SELECT p.id
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE
    LOWER(u.email) LIKE '%julia%atkins%'
    OR LOWER(p.full_name) ILIKE '%julia atkins%'
);
