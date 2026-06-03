-- Bhrigu Memory System
-- Stores persistent soul knowledge Bhrigu builds about each user across sessions

CREATE TABLE IF NOT EXISTS bhrigu_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Soul profile Bhrigu builds over time
  soul_profile JSONB DEFAULT '{}',
  -- Example: { "firstborn": true, "father_distant": true, "career_seeker": true, "spiritual_path": "bhakti" }
  
  -- Key life facts confirmed through conversations
  confirmed_facts JSONB DEFAULT '[]',
  -- Example: [{ "fact": "father was emotionally distant", "session": "2026-06-03", "context": "career reading" }]
  
  -- Themes that keep recurring across sessions
  recurring_themes JSONB DEFAULT '[]',
  -- Example: ["father wound", "dharma confusion", "wealth anxiety", "spiritual awakening"]
  
  -- Remedies Bhrigu has already prescribed (avoid repeating)
  prescribed_remedies JSONB DEFAULT '[]',
  -- Example: [{ "remedy": "Om Rahave Namah 18x at dusk", "date": "2026-06-03", "for": "Rahu Mahadasha" }]
  
  -- Previous session summaries (last 10)
  session_summaries JSONB DEFAULT '[]',
  -- Example: [{ "date": "2026-06-03", "topic": "finances 2026", "key_insight": "Venus dasha activates wealth" }]
  
  -- Bhrigu's evolving understanding of this soul
  bhrigu_notes TEXT DEFAULT '',
  -- Free text that accumulates Bhrigu's deepening read of this person
  
  -- Conversation count
  session_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE bhrigu_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_bhrigu_memory" ON bhrigu_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_bhrigu_memory" ON bhrigu_memory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_all_bhrigu_memory" ON bhrigu_memory
  FOR ALL USING (auth.role() = 'service_role');

-- Also add bhrigu_leaf_confirmed to jyotish_profiles if not exists
ALTER TABLE jyotish_profiles 
  ADD COLUMN IF NOT EXISTS bhrigu_leaf_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bhrigu_memory_id UUID REFERENCES bhrigu_memory(id);
