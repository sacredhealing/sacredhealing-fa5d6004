-- Create workflow_templates table for storing global workflow definitions
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'music', 'course', 'project', 'song'
  stages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {key: string, label: string, order_index: number}
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage workflow templates
CREATE POLICY "Admins can view workflow templates"
  ON public.workflow_templates
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert workflow templates"
  ON public.workflow_templates
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update workflow templates"
  ON public.workflow_templates
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete workflow templates"
  ON public.workflow_templates
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default workflow templates based on existing hardcoded values
INSERT INTO public.workflow_templates (content_type, stages, is_default) VALUES
  ('music', '[
    {"key": "idea", "label": "Idea", "order_index": 0},
    {"key": "arrangement", "label": "Arrangement", "order_index": 1},
    {"key": "logic_to_studio_one", "label": "Move from Logic to Studio One", "order_index": 2},
    {"key": "record_mpc", "label": "Record from MPC", "order_index": 3},
    {"key": "record_studio_one_mpc", "label": "Record to Studio One from MPC", "order_index": 4},
    {"key": "record_karaveera", "label": "Record – Karaveera Nivasini Dasi", "order_index": 5},
    {"key": "record_kritagya", "label": "Record – Kritagya Das", "order_index": 6},
    {"key": "mix", "label": "Mix", "order_index": 7},
    {"key": "master", "label": "Master", "order_index": 8},
    {"key": "cover", "label": "Cover", "order_index": 9},
    {"key": "release", "label": "Release", "order_index": 10}
  ]'::jsonb, true),
  ('song', '[
    {"key": "idea", "label": "Idea", "order_index": 0},
    {"key": "arrangement", "label": "Arrangement", "order_index": 1},
    {"key": "logic_to_studio_one", "label": "Move from Logic to Studio One", "order_index": 2},
    {"key": "record_mpc", "label": "Record from MPC", "order_index": 3},
    {"key": "record_studio_one_mpc", "label": "Record to Studio One from MPC", "order_index": 4},
    {"key": "record_karaveera", "label": "Record – Karaveera Nivasini Dasi", "order_index": 5},
    {"key": "record_kritagya", "label": "Record – Kritagya Das", "order_index": 6},
    {"key": "mix", "label": "Mix", "order_index": 7},
    {"key": "master", "label": "Master", "order_index": 8},
    {"key": "cover", "label": "Cover", "order_index": 9},
    {"key": "release", "label": "Release", "order_index": 10}
  ]'::jsonb, true),
  ('course', '[
    {"key": "idea", "label": "Idea", "order_index": 0},
    {"key": "arrangement", "label": "Arrangement", "order_index": 1},
    {"key": "pdf_text", "label": "PDF Text", "order_index": 2},
    {"key": "youtube_to_studio_one", "label": "YouTube to Studio One", "order_index": 3},
    {"key": "music_to_meditations", "label": "Music to Meditations and Audios", "order_index": 4},
    {"key": "mix", "label": "Mix", "order_index": 5},
    {"key": "master", "label": "Master", "order_index": 6},
    {"key": "videos", "label": "Videos", "order_index": 7},
    {"key": "cover", "label": "Cover", "order_index": 8},
    {"key": "description", "label": "Description", "order_index": 9}
  ]'::jsonb, true),
  ('project', '[
    {"key": "idea", "label": "Idea", "order_index": 0},
    {"key": "finished_coding", "label": "Finished Coding", "order_index": 1},
    {"key": "integrated_into_app", "label": "Integrated into the App", "order_index": 2},
    {"key": "added_to_affiliate", "label": "Added to Affiliate", "order_index": 3},
    {"key": "bought_domain", "label": "Bought Domain", "order_index": 4},
    {"key": "released_into_app", "label": "Released into the App", "order_index": 5}
  ]'::jsonb, true);