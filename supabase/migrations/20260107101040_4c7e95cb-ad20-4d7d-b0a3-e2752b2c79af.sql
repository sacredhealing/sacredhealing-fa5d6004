-- Create table for admin-granted access (bypasses payment requirements)
CREATE TABLE IF NOT EXISTS public.admin_granted_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('membership', 'course', 'path', 'program')),
  access_id TEXT, -- Optional: specific course_id, path_id, program_id (NULL = all access for that type)
  tier TEXT, -- For membership: 'premium_monthly', 'premium_annual', 'lifetime'
  granted_by UUID NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, access_type, access_id)
);

-- Enable RLS
ALTER TABLE public.admin_granted_access ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can do everything, users can view their own
CREATE POLICY "Admins can manage all granted access"
ON public.admin_granted_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own granted access"
ON public.admin_granted_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_admin_granted_access_updated_at
  BEFORE UPDATE ON public.admin_granted_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for fast lookups
CREATE INDEX idx_admin_granted_access_user ON public.admin_granted_access(user_id);
CREATE INDEX idx_admin_granted_access_type ON public.admin_granted_access(access_type, access_id);