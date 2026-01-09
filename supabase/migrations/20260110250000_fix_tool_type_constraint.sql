-- ============================================
-- Fix Tool Type Constraint
-- ============================================
-- Updates the CHECK constraint to allow 'creative_studio' type

-- Drop existing constraint if it exists
ALTER TABLE public.creative_tools 
  DROP CONSTRAINT IF EXISTS creative_tools_tool_type_check;

-- Add new constraint that includes creative_studio
ALTER TABLE public.creative_tools 
  ADD CONSTRAINT creative_tools_tool_type_check 
  CHECK (tool_type IN ('music_beat', 'soul_writing', 'meditation_creator', 'energy_translator', 'creative_studio'));

