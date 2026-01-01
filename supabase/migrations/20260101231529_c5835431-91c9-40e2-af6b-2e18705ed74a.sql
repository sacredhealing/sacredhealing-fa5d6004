-- Create breathing_patterns table to store editable breathing exercises
CREATE TABLE public.breathing_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  inhale integer NOT NULL DEFAULT 4,
  hold integer NOT NULL DEFAULT 4,
  exhale integer NOT NULL DEFAULT 4,
  hold_out integer NOT NULL DEFAULT 0,
  cycles integer NOT NULL DEFAULT 4,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breathing_patterns ENABLE ROW LEVEL SECURITY;

-- Anyone can view active patterns
CREATE POLICY "Anyone can view active breathing patterns" 
ON public.breathing_patterns 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all patterns
CREATE POLICY "Admins can manage breathing patterns" 
ON public.breathing_patterns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_breathing_patterns_updated_at
BEFORE UPDATE ON public.breathing_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default patterns
INSERT INTO public.breathing_patterns (name, description, inhale, hold, exhale, hold_out, cycles, order_index) VALUES
('Box Breathing', 'Equal counts for calm and focus. Used by Navy SEALs.', 4, 4, 4, 4, 4, 0),
('4-7-8 Relaxation', 'Deep relaxation technique for sleep and anxiety relief.', 4, 7, 8, 0, 4, 1),
('Energizing Breath', 'Short, powerful breaths to boost energy and alertness.', 2, 0, 2, 0, 10, 2),
('Calming Breath', 'Longer exhales activate the parasympathetic nervous system.', 4, 2, 6, 2, 6, 3);