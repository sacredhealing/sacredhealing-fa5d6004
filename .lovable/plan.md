
## Fix: Wrong Supabase URL Causing No Atmosphere Sound

### The Exact Problem

Line 600 of `src/hooks/useSoulMeditateEngine.ts` has a hardcoded wrong Supabase project URL that was accidentally introduced:

```ts
// LINE 600 — WRONG:
const SUPABASE_URL = 'https://tdiqrngivbrwkhwcejvv.supabase.co';

// SHOULD BE:
const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
```

This URL is used to construct every audio file URL for the Meditation Style / Atmosphere layer (lines 625 and 683). Because the URL points to a non-existent project, all `new Audio()` elements fail to load their `src`, which means:

- The Meditation Style / Neural Source Atmosphere layer is **completely silent** — audio element load fails silently
- This also breaks the Healing Hz and Brainwave Target because when `loadAtmosphere` fails, it does not call `audioContextRef.current?.resume()` — leaving the AudioContext in a `suspended` state for the whole engine
- A suspended AudioContext means **all audio is muted** — oscillators, binaural beats, everything

The `VITE_SUPABASE_URL` env variable is already correctly set to `ssygukfdbtehvtndandn` throughout the rest of the app. This one hardcoded constant in `loadAtmosphere` is the sole cause of the total audio failure.

### The Fix — 1 Line in 1 File

**`src/hooks/useSoulMeditateEngine.ts`, line 600:**

Change:
```ts
const SUPABASE_URL = 'https://tdiqrngivbrwkhwcejvv.supabase.co';
```

To use the correct environment variable (consistent with how the rest of the app accesses Supabase):
```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
```

Using `import.meta.env.VITE_SUPABASE_URL` is the correct approach because:
1. It matches `src/integrations/supabase/client.ts` which already uses this pattern
2. It avoids hardcoding the project URL — if the project URL ever changes, this updates automatically
3. It is guaranteed to be `https://ssygukfdbtehvtndandn.supabase.co` based on the `.env` file

### Why This Fixes All Three Issues

| Symptom | Root Cause | After Fix |
|---|---|---|
| Healing Hz — no sound | AudioContext stays suspended because atmosphere load fails before calling `resume()` | `resume()` is called after successful atmosphere load → oscillators produce sound |
| Neural Brainwave Target — no sound | Same AudioContext suspension issue | Fixed |
| Neural Source — no sound | Same AudioContext suspension issue | Fixed |
| Meditation Style (Atmosphere) — no sound | Audio `src` points to wrong Supabase project, file 404s | Correct URL → file loads → plays |

### Files to Modify

| File | Line | Change |
|---|---|---|
| `src/hooks/useSoulMeditateEngine.ts` | 600 | `'https://tdiqrngivbrwkhwcejvv.supabase.co'` → `import.meta.env.VITE_SUPABASE_URL` |
