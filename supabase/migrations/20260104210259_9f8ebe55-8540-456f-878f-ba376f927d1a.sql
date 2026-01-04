-- Add audio analysis and spiritual metadata columns to music_tracks
ALTER TABLE public.music_tracks 
  ADD COLUMN IF NOT EXISTS energy_level text CHECK (energy_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS rhythm_type text CHECK (rhythm_type IN ('steady', 'flowing', 'dynamic')),
  ADD COLUMN IF NOT EXISTS vocal_type text CHECK (vocal_type IN ('instrumental', 'mantra', 'lyrics', 'spoken')),
  ADD COLUMN IF NOT EXISTS frequency_band text CHECK (frequency_band IN ('low', 'balanced', 'high')),
  ADD COLUMN IF NOT EXISTS best_time_of_day text CHECK (best_time_of_day IN ('morning', 'midday', 'evening', 'sleep', 'anytime')),
  ADD COLUMN IF NOT EXISTS spiritual_description text,
  ADD COLUMN IF NOT EXISTS auto_generated_description text,
  ADD COLUMN IF NOT EXISTS auto_generated_affirmation text,
  ADD COLUMN IF NOT EXISTS auto_analysis_data jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS analysis_status text DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'approved', 'failed')),
  ADD COLUMN IF NOT EXISTS analysis_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Add comment for documentation
COMMENT ON COLUMN public.music_tracks.auto_analysis_data IS 'Raw AI analysis data including detected BPM, energy patterns, frequency analysis';
COMMENT ON COLUMN public.music_tracks.auto_generated_description IS 'AI-generated spiritual description before admin approval';
COMMENT ON COLUMN public.music_tracks.auto_generated_affirmation IS 'AI-generated affirmation before admin approval';
COMMENT ON COLUMN public.music_tracks.analysis_status IS 'Status of AI analysis: pending, analyzing, completed, approved, failed';