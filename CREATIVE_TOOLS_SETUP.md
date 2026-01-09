# Creative Tools Setup Guide

## Issue: Tools Not Showing
If you see "No Tools Available" on the Creative Soul page, follow these steps:

## Step 1: Run Migrations (IMPORTANT!)

Run these migrations in Supabase in order:

1. `20260110140000_creative_tool_access.sql` - Creates the table
2. `20260110250000_fix_tool_type_constraint.sql` - Fixes constraint
3. `20260110220000_fix_creative_tools_display.sql` - Fixes RLS
4. `20260110230000_ensure_creative_tools_exist.sql` - Inserts tools
5. `20260110240000_fix_rls_and_tools_final.sql` - Final fix

**OR run the single comprehensive migration:**
- `20260110240000_fix_rls_and_tools_final.sql` (includes everything)

## Step 2: Verify Tools Exist

Run this query in Supabase SQL Editor:

```sql
SELECT slug, name, price_eur, is_active, is_featured 
FROM creative_tools 
ORDER BY price_eur;
```

You should see:
- creative-soul-studio (€19.99, featured)
- music-beat-companion (€29.00)
- soul-writing (€19.00)
- meditation-creator (€39.00)
- energy-translator (€24.00)

## Step 3: Check RLS Policy

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'creative_tools' 
AND policyname = 'Anyone can view active creative tools';
```

The policy should allow public access with `USING (is_active = true)`.

## Step 4: Test Query

Test if the query works:

```sql
SELECT * FROM creative_tools WHERE is_active = true;
```

## Step 5: Check Browser Console

Open browser DevTools (F12) and check the Console tab. Look for:
- `[useCreativeTools] Fetched tools: X`
- Any error messages

## Step 6: Manual Tool Insert (If Still Not Working)

If tools still don't show, manually insert them:

```sql
-- Insert Creative Soul Studio
INSERT INTO creative_tools (
  slug, name, description, price_eur, workspace_url, 
  tool_type, icon_name, is_active, is_featured, featured_order
) VALUES (
  'creative-soul-studio',
  'Creative Soul Studio',
  'Transform your voice into creative ideas, images, and documents.',
  19.99,
  '/creative-soul-tool',
  'creative_studio',
  'Sparkles',
  true,
  true,
  0
) ON CONFLICT (slug) DO UPDATE SET is_active = true, is_featured = true;

-- Verify
SELECT COUNT(*) FROM creative_tools WHERE is_active = true;
```

## Common Issues:

1. **Migration not run**: Tools won't exist until migrations are executed
2. **RLS blocking**: Policy might not allow public access
3. **Tool type constraint**: Make sure 'creative_studio' is in the CHECK constraint
4. **Table doesn't exist**: Run the first migration that creates the table

## Quick Fix SQL:

Run this to ensure everything is set up:

```sql
-- Fix constraint
ALTER TABLE creative_tools DROP CONSTRAINT IF EXISTS creative_tools_tool_type_check;
ALTER TABLE creative_tools ADD CONSTRAINT creative_tools_tool_type_check 
  CHECK (tool_type IN ('music_beat', 'soul_writing', 'meditation_creator', 'energy_translator', 'creative_studio'));

-- Fix RLS
DROP POLICY IF EXISTS "Anyone can view active creative tools" ON creative_tools;
CREATE POLICY "Anyone can view active creative tools"
ON creative_tools FOR SELECT TO public USING (is_active = true);

-- Insert tools (if missing)
INSERT INTO creative_tools (slug, name, description, price_eur, workspace_url, tool_type, icon_name, is_active) VALUES
('creative-soul-studio', 'Creative Soul Studio', 'Transform your voice into creative ideas.', 19.99, '/creative-soul-tool', 'creative_studio', 'Sparkles', true)
ON CONFLICT (slug) DO UPDATE SET is_active = true;
```

