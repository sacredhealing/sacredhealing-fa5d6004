
## Root Cause Analysis

The admin mantra page isn't loading mantras due to **two compounding problems**:

**Problem 1 — Missing database columns (the primary issue)**
The `mantras` table in the database is missing columns that the code expects:
- `category` (missing)
- `planet_type` (missing)
- `is_premium` (missing)
- `duration_minutes` (missing)
- `updated_at` (missing)

The `AdminMantras.tsx` page calls `supabase.rpc('insert_mantra_admin')` and `supabase.rpc('update_mantra_admin')` — but **neither of these RPC functions exist in the database**. So saving mantras fails silently, and because the TypeScript type errors cause a broken build, even the fetch may not reach the page correctly.

**Problem 2 — Build errors blocking the app**
The app has numerous TypeScript build errors in unrelated files that prevent the app from compiling cleanly. The most critical ones that directly affect the mantras admin page are:
- `insert_mantra_admin` / `update_mantra_admin` are listed in the RPC type definitions but not yet deployed to the database
- `AdminSacredCircles.tsx` references `get_room_members` RPC and `chat_members_view` table (neither exist in types)
- `PromptLibrary.tsx` references `ai_templates` and `ai_user_preferences` tables (not in types)
- `HiddenWisdomVault.tsx` references `hidden_wisdom_vault` and `angelic_spheres` tables (not in types) + uses `hasAccess` which doesn't exist (hook returns `isStargateMember`)
- `FrequencyToggle.tsx` imports `RadioOff` from `lucide-react` (not a valid export)
- `useChatSharded.ts` adds messages missing `message_type` field
- `useCommunityPolls.ts` references `community_polls`, `community_poll_options`, `community_poll_votes` tables (not in types)

---

## Technical Plan

### Step 1 — Database Migration
Run a SQL migration to add missing columns to `mantras` and create the `insert_mantra_admin` / `update_mantra_admin` RPC functions:

```sql
-- Add missing columns to mantras table
ALTER TABLE public.mantras
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS planet_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER GENERATED ALWAYS AS (CEIL(duration_seconds::numeric / 60)) STORED,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_mantra_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER mantras_updated_at
  BEFORE UPDATE ON public.mantras
  FOR EACH ROW EXECUTE FUNCTION public.set_mantra_updated_at();

-- RPC: insert_mantra_admin (security definer, admin only)
CREATE OR REPLACE FUNCTION public.insert_mantra_admin(data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  INSERT INTO public.mantras (title, description, audio_url, cover_image_url,
    duration_seconds, shc_reward, is_active, category, planet_type, is_premium)
  VALUES (
    data->>'title', data->>'description', data->>'audio_url', data->>'cover_image_url',
    (data->>'duration_seconds')::int, (data->>'shc_reward')::int,
    (data->>'is_active')::boolean,
    COALESCE(data->>'category', 'general'),
    data->>'planet_type',
    COALESCE((data->>'is_premium')::boolean, false)
  );
  RETURN jsonb_build_object('success', true);
END; $$;

-- RPC: update_mantra_admin (security definer, admin only)
CREATE OR REPLACE FUNCTION public.update_mantra_admin(data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  UPDATE public.mantras SET
    title = COALESCE(data->>'title', title),
    description = COALESCE(data->>'description', description),
    audio_url = COALESCE(data->>'audio_url', audio_url),
    cover_image_url = COALESCE(data->>'cover_image_url', cover_image_url),
    duration_seconds = COALESCE((data->>'duration_seconds')::int, duration_seconds),
    shc_reward = COALESCE((data->>'shc_reward')::int, shc_reward),
    is_active = COALESCE((data->>'is_active')::boolean, is_active),
    category = COALESCE(data->>'category', category),
    planet_type = data->>'planet_type',
    is_premium = COALESCE((data->>'is_premium')::boolean, is_premium)
  WHERE id = (data->>'id')::uuid;
  RETURN jsonb_build_object('success', true);
END; $$;
```

### Step 2 — Fix Build Errors in Unrelated Files

Fix all TypeScript errors that prevent the app from building:

**`src/components/audio/FrequencyToggle.tsx`**
- Remove the invalid `RadioOff` import (it doesn't exist in lucide-react), replace with `RadioTower` or just remove it

**`src/components/stargate/HiddenWisdomVault.tsx`**
- Fix: `useStargateAccess()` returns `isStargateMember`, not `hasAccess` — rename the destructured variable
- Fix: Cast the `supabase.from('hidden_wisdom_vault')` and `supabase.from('angelic_spheres')` calls with `as any` to bypass type checking

**`src/components/admin/AdminSacredCircles.tsx`**
- Fix: Cast `supabase.rpc('get_room_members', ...)` with `as any`
- Fix: Cast `supabase.from('chat_members_view')` with `as any`
- Fix type assertions on `rpcData` to treat it as `any[]`

**`src/components/ai/PromptLibrary.tsx`**
- Fix: Cast `supabase.from('ai_templates')` and `supabase.from('ai_user_preferences')` with `as any`
- Fix: Cast the fetched data with `as any` when setting state
- Fix: Cast `usage_count` property access with `as any`

**`src/hooks/useCommunityPolls.ts`**
- Fix: Cast all `supabase.from('community_polls')`, `community_poll_options`, `community_poll_votes` with `as any`
- Fix: Cast fetched data with appropriate `as any` assertions

**`src/hooks/useChatSharded.ts`**
- Fix: Add `message_type: 'text'` as a default when building message objects so they match the `ChatMessage` interface

**`supabase/functions/stripe-webhook/index.ts`**
- Fix: Change `userId = matchingUser.id` to use `let` instead of `const` (or restructure the assignment)

**`supabase/functions/weekly-motivational-email/index.ts`**
- Fix: Properly type the `profilesError` so `.message` is accessible

---

## Files to Change

1. **Database migration** — Add missing columns and RPC functions to `mantras` table
2. `src/components/audio/FrequencyToggle.tsx` — Remove invalid `RadioOff` import
3. `src/components/stargate/HiddenWisdomVault.tsx` — Fix `hasAccess` → `isStargateMember`, cast unknown tables
4. `src/components/admin/AdminSacredCircles.tsx` — Cast RPC and unknown table calls with `as any`
5. `src/components/ai/PromptLibrary.tsx` — Cast unknown table calls with `as any`
6. `src/hooks/useCommunityPolls.ts` — Cast unknown table calls with `as any`
7. `src/hooks/useChatSharded.ts` — Add `message_type` field to message objects
8. `supabase/functions/stripe-webhook/index.ts` — Fix `const` → `let` for `userId`
9. `supabase/functions/weekly-motivational-email/index.ts` — Fix type of `profilesError`

This will unblock the build, make the mantras admin page load existing mantras, and allow adding/editing mantras to work correctly.
