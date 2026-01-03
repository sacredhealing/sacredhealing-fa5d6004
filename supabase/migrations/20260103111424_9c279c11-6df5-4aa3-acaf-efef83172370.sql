-- Add is_published column to courses table for visibility control
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- Add linked_project_id to link courses with admin_projects for sync
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS linked_project_id uuid REFERENCES public.admin_projects(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_linked_project_id ON public.courses(linked_project_id);

-- Add comment for clarity
COMMENT ON COLUMN public.courses.is_published IS 'Course is only visible on /courses when this is true (set automatically when workflow is complete)';
COMMENT ON COLUMN public.courses.linked_project_id IS 'Links to admin_projects for workflow sync';