# Sacred Healing — Speed Improvements Round 2

## What Improved (great progress!)

| Metric | Before | Now | Change |
|---|---|---|---|
| JS bundle (main) | 5,155 KB (1 file) | 623 KB + chunks | **↓ 88%** |
| Code splitting | None (1 file) | Vendor chunks + lazy routes | ✅ Working |
| Supabase API calls (dashboard) | 116 | 44 | **↓ 62%** |
| DOM Content Loaded | 2,635ms | 1,399ms | **↓ 47%** |
| Full page load | 3,559ms | 1,508ms | **↓ 58%** |

The vendor chunking is working perfectly — React, charts, motion, UI, i18n, and query are all in separate cached files. The lazy loading is splitting page routes.

---

## What Still Needs Fixing

### Problem 1: `generate-vedic-reading` Edge Function — 16 SECONDS

This is your biggest remaining bottleneck. The Supabase edge function at `/functions/v1/generate-vedic-reading` took **16,095ms** (16 seconds) to respond. This is the AI-powered reading generation — it's calling an LLM behind the scenes.

The hook (`useAIVedicReading.ts`) has localStorage caching with a 6-hour TTL, which is good. But the first load or cache-miss is brutal.

### Problem 2: Profiles still called 9-10 times

Down from 29, but still 9-10 times. Several hooks still independently fetch profiles.

### Problem 3: `recharts` loads on dashboard (401 KB)

The `vendor-charts` chunk (recharts, 401 KB) loads on the dashboard even though no charts are visible there. It's probably imported by a component inside the achievements or progress section.

### Problem 4: No loading skeleton for Vedic page content

The page shows the tabs (Overview, Guru, Hora, etc.) but the content area below is completely blank for 16+ seconds while the AI reading generates.

---

## Cursor Prompts — Round 2

### Prompt 1: Show Loading State for Vedic Reading

```
PERFORMANCE: Add a proper loading skeleton for the Vedic Astrology page 
while the AI reading is being generated.

The generate-vedic-reading edge function takes 10-16 seconds. During this 
time the user sees empty white space below the tab navigation.

In the VedicAstrology page component (src/pages/VedicAstrology.tsx):

1. While isLoading is true, show an animated skeleton that matches the 
   layout of the actual content:
   - A pulsing card skeleton for the "Cosmic Coordinate Sync" bar
   - A large skeleton placeholder where the Hora Watch goes
   - Skeleton lines for text content
   - Use the existing Skeleton component from @/components/ui/skeleton

2. Add a subtle status message below the skeleton:
   "Reading the cosmic patterns..." in serif font, amber-300/50 color,
   with a subtle fade-in-out animation.

3. Show cached data immediately if available. The useAIVedicReading hook 
   already checks localStorage cache — make sure the page renders the 
   cached reading instantly while a background refresh happens (stale-while-revalidate pattern).

The goal: the user should NEVER see a blank page. Either show cached 
content or an informative loading state.
```

### Prompt 2: Cache Vedic Reading with React Query

```
PERFORMANCE: Convert useAIVedicReading to use React Query with 
stale-while-revalidate.

File: src/hooks/useAIVedicReading.ts

Currently this hook uses raw useState + localStorage caching. Convert it 
to React Query which will:
- Deduplicate calls (if multiple components use it)
- Show stale data instantly while refreshing in background
- Handle retry/error automatically

Changes:
1. Use useQuery with queryKey: ['vedic-reading', user.name, user.birthDate, timeOffset, timezone]
2. Set staleTime to 6 hours (same as current CACHE_TTL_MS): 6 * 60 * 60 * 1000
3. Set gcTime to 24 hours so it persists in memory longer
4. The queryFn should call the Supabase edge function
5. Keep the localStorage cache as a fallback initialData provider — 
   in the useQuery options, set initialData to load from localStorage 
   if available
6. On success, save to localStorage (same as current saveToCache)
7. Set refetchOnWindowFocus: false (don't re-call an expensive AI 
   function just because the user switched tabs)
8. Set retry: 1 (don't retry expensive AI calls multiple times)

This means: first visit = 16s wait, but every subsequent visit shows 
the cached reading instantly and refreshes silently only if stale.
```

### Prompt 3: Fix Remaining Profile Duplication

```
PERFORMANCE: Profiles endpoint is still called 9-10 times on page load.
Reduce to 1.

The useProfile hook may have been partially converted to React Query 
but other hooks or components are still fetching profiles independently.

Search the entire src/ directory for any direct Supabase call to 
.from('profiles') that is NOT going through React Query.

Common culprits:
- src/hooks/useAuth.ts or auth context fetching profile inline
- src/contexts/SHCContext.tsx or similar context providers
- src/components/layout/AppLayout.tsx or ProtectedRoute fetching profile
- src/hooks/useMembership.ts, useStargateAccess.ts, useAdminRole.ts 
  might each independently query profiles

For each one found:
- Replace the direct Supabase .from('profiles') call with a call to 
  useProfile() hook (which should use React Query)
- Or use queryClient.fetchQuery/ensureQueryData with the same 
  queryKey ['profile', userId] so React Query deduplicates it

The goal: ONE profile fetch per page load, shared via React Query cache.
```

### Prompt 4: Lazy-load Recharts

```
PERFORMANCE: The recharts library (401 KB) loads on every page because 
it's in the vendor-charts chunk that loads eagerly.

Recharts is only used on specific pages (analytics, achievements, 
progress charts). It should NOT load on the dashboard or Vedic page.

In vite.config.ts:
1. Remove 'recharts' from the manualChunks vendor-charts group
2. Instead, let Vite's default code splitting handle it — recharts 
   will be bundled with the pages that import it

In any dashboard component that imports from 'recharts':
3. Check if the recharts usage is inside a SectionCollapse that's 
   defaultOpen={false} (like "Progress & achievements"). If so, 
   the component should be lazy-loaded:
   
   const ProgressChart = React.lazy(() => import('./ProgressChart'));
   
   Then wrap it in <Suspense> inside the collapse.

This saves 401 KB from the initial dashboard load.
```

### Prompt 5: Preconnect to Supabase

```
PERFORMANCE: Add DNS preconnect hints for Supabase to reduce 
connection latency.

In index.html, add these tags in the <head> before any scripts:

<link rel="preconnect" href="https://YOUR_SUPABASE_PROJECT_ID.supabase.co" />
<link rel="dns-prefetch" href="https://YOUR_SUPABASE_PROJECT_ID.supabase.co" />

Replace YOUR_SUPABASE_PROJECT_ID with the actual project ID from 
your .env file (VITE_SUPABASE_URL).

This saves ~100-200ms on the first API call by establishing the 
TLS connection early while the JS is still parsing.
```

### Prompt 6: Add Global React Query Persistence (Optional but High Impact)

```
PERFORMANCE: Add React Query persistence so cached data survives 
page refreshes and app reopens.

Install: npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client

In src/lib/queryClient.ts:
1. Create a persister:
   import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
   
   const persister = createSyncStoragePersister({
     storage: window.localStorage,
     key: 'sh-query-cache',
   })

2. In src/App.tsx or main.tsx, wrap QueryClientProvider with PersistQueryClientProvider:
   import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
   
   <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}>

This means ALL React Query data (profile, achievements, paths, etc.) 
persists across page refreshes. The app will feel instant on return 
visits — data renders immediately from cache, then silently refreshes 
in the background if stale.

IMPORTANT: Only cache safe queryKeys. Exclude any sensitive auth tokens.
Add a dehydrate filter:
  persistOptions: {
    persister,
    maxAge: 24 * 60 * 60 * 1000,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Don't persist auth queries
        const key = query.queryKey[0] as string;
        return !key.includes('auth');
      }
    }
  }
```

---

## Expected Results After Round 2

| Metric | Current | After Round 2 |
|---|---|---|
| Dashboard API calls | 44 | ~15-20 |
| Vedic page first load | 16s blank | 16s with loading skeleton |
| Vedic page return visit | 16s | **Instant** (cached) |
| Initial JS (dashboard) | 1,616 KB total | ~1,200 KB (no recharts) |
| Return visit load | Full refetch | **Instant** (persisted cache) |

The biggest win is Prompt 6 (persistence) — it makes the entire app feel instant for returning users.
