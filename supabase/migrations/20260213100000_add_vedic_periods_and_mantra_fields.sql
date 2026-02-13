-- Create vedic_periods table
CREATE TABLE IF NOT EXISTS vedic_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Extend mantras table (ADD COLUMNS ONLY)
ALTER TABLE mantras
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS recommended_duration TEXT,
ADD COLUMN IF NOT EXISTS vedic_period_id UUID REFERENCES vedic_periods(id);

-- RLS for vedic_periods (read for all, full access for authenticated)
ALTER TABLE vedic_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vedic periods" ON vedic_periods FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage vedic periods" ON vedic_periods FOR ALL USING (auth.role() = 'authenticated');
