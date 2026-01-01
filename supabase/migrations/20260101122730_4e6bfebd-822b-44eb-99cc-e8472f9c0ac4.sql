-- Admin Projects table
CREATE TABLE public.admin_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Tasks table
CREATE TABLE public.admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.admin_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Content table
CREATE TABLE public.admin_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.admin_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'document',
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Events table
CREATE TABLE public.admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.admin_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'meeting',
  date_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Settings table
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_projects (admins only)
CREATE POLICY "Admins can view projects" ON public.admin_projects
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert projects" ON public.admin_projects
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects" ON public.admin_projects
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects" ON public.admin_projects
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_tasks (admins only)
CREATE POLICY "Admins can view tasks" ON public.admin_tasks
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tasks" ON public.admin_tasks
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks" ON public.admin_tasks
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tasks" ON public.admin_tasks
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_content (admins only)
CREATE POLICY "Admins can view content" ON public.admin_content
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert content" ON public.admin_content
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content" ON public.admin_content
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content" ON public.admin_content
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_events (admins only)
CREATE POLICY "Admins can view events" ON public.admin_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert events" ON public.admin_events
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events" ON public.admin_events
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events" ON public.admin_events
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_settings (admins only)
CREATE POLICY "Admins can view settings" ON public.admin_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings" ON public.admin_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings" ON public.admin_settings
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Update triggers for updated_at
CREATE TRIGGER update_admin_projects_updated_at
  BEFORE UPDATE ON public.admin_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_tasks_updated_at
  BEFORE UPDATE ON public.admin_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_content_updated_at
  BEFORE UPDATE ON public.admin_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_events_updated_at
  BEFORE UPDATE ON public.admin_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();