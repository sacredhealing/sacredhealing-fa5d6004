# Dashboard Speed Fix — Eliminate Duplicate API Calls

## The Problem

The dashboard still makes **43 API calls** with a **2.6 second waterfall**.
The main issue: multiple hooks fetch the SAME data but use DIFFERENT React Query 
queryKeys, so React Query treats them as separate queries and fires them all.

### Current Duplicate Calls:
| Endpoint | Calls | Should Be |
|---|---|---|
| /profiles | 10 | 1 |
| /auth/v1/user | 5 | 1 |
| /meditation_completions | 3 | 1 |
| /mantra_completions | 3 | 1 |
| /user_daily_activities | 3 | 1 |
| /spiritual_paths | 2 | 1 |
| /user_path_progress | 2 | 1 |
| /user_spiritual_goals | 2 | 1 |

Fixing this alone cuts API calls from 43 to ~15 and removes ~1.5s from load.

---

## PROMPT (paste into Cursor):

```
PERFORMANCE: The dashboard makes 43 Supabase API calls because multiple hooks 
fetch the same data with different React Query keys. Fix all duplicates.

The root cause: each hook creates its OWN queryKey for the same Supabase table, 
so React Query can't deduplicate them. We need to standardize queryKeys.

### FIX 1: SHCContext.tsx — Stop direct Supabase profile calls

File: src/contexts/SHCContext.tsx

This context uses raw useState + useEffect with direct supabase.from('profiles') 
calls in fetchProfile() AND updateStreak(). That's 3 profile fetches bypassing 
React Query entirely.

Changes:
- Remove the fetchProfile function and the profile useState
- Instead, import useProfile from '@/hooks/useProfile' BUT since this is a 
  Context Provider (not a hook consumer), you can't directly use useProfile here.
  
  SOLUTION: Use queryClient directly.
  
  import { useQueryClient } from '@tanstack/react-query';
  
  Then in the provider:
  const queryClient = useQueryClient();
  
  Replace fetchProfile() with:
  const profileData = queryClient.getQueryData(['profile', user?.id]);
  
  For updateStreak(), instead of fetching profiles again, use:
  const cached = queryClient.getQueryData(['profile', user?.id]);
  
  If cached data isn't available yet, use queryClient.fetchQuery() with the 
  SAME queryKey ['profile', user?.id] so it shares the cache:
  
  const profileData = await queryClient.fetchQuery({
    queryKey: ['profile', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, streak_days, preferred_language, last_login_date, total_referrals')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  This way it reuses the cached profile instead of making a new call.

- After updateStreak succeeds, invalidate the profile cache:
  queryClient.invalidateQueries({ queryKey: ['profile', user.id] });


### FIX 2: useDailyGuidance.ts — Use shared queryKeys

File: src/hooks/useDailyGuidance.ts

This hook creates 4 separate queries with unique keys:
- ['daily-guidance-activity', userId, today]
- ['daily-guidance-profile', userId]  ← DUPLICATE of profiles!
- ['daily-guidance-goals', userId]
- ['daily-guidance-path', userId]

Changes:
- REMOVE the profile query entirely. Instead get streak_days from useProfile():
  
  import { useProfile } from './useProfile';
  const { profile } = useProfile();
  const streakDays = profile?.streak_days ?? 0;

  Delete the entire daily-guidance-profile useQuery block.
  Delete the profileLoading variable and remove it from isLoading.

- For the other queries, standardize the keys so they can be shared:
  - ['daily-guidance-activity', userId, today] → ['user-daily-activities', userId, today]
  - ['daily-guidance-goals', userId] → ['user-spiritual-goals', userId]  
  - ['daily-guidance-path', userId] → ['user-active-path', userId]

  These keys should match what other hooks use. Search the codebase for any 
  other hook querying user_daily_activities, user_spiritual_goals, or 
  user_path_progress and make sure they use the SAME queryKey.


### FIX 3: useAchievements.ts — fetchUserStats duplicates profiles + completions

File: src/hooks/useAchievements.ts

The fetchUserStats function makes 4 parallel calls:
- profiles (streak_days, total_referrals) ← DUPLICATE
- meditation_completions (count) ← DUPLICATE  
- music_completions (count)
- mantra_completions (count) ← DUPLICATE

Changes:
- For streak_days: get it from the shared profile cache instead:
  
  import { useProfile } from './useProfile';
  
  Then inside useAchievements:
  const { profile: sharedProfile } = useProfile();
  
  Modify fetchUserStats to NOT query profiles. Instead pass streakDays in:
  const userStats = {
    streakDays: sharedProfile?.streak_days ?? 0,
    totalSessions: ..., // still fetch completion counts
    ...
  };

- For completion counts, use shared queryKeys:
  Change the queryKey for user-achievement-stats to break it into separate 
  queries that can be shared:
  
  const meditationCountQuery = useQuery({
    queryKey: ['meditation-completions-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('meditation_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  Do the same for music_completions and mantra_completions.
  This way if any other hook needs these counts, they share the cache.


### FIX 4: useAuth — Deduplicate auth/v1/user calls

File: src/hooks/useAuth.ts

The /auth/v1/user endpoint is called 5 times. Check if useAuth uses 
supabase.auth.getUser() or onAuthStateChange. Multiple components mounting 
useAuth() each trigger their own auth check.

Fix: Make useAuth use a React Query wrapper or a singleton pattern:
- Store the auth state in a context (AuthContext) that calls 
  supabase.auth.getUser() ONCE on mount
- All components consuming useAuth() get the same cached state
- If useAuth already uses a context, check for any stale useEffect 
  that re-fetches the user on dependency changes


### FIX 5: Defer check-achievements edge function

File: src/pages/Dashboard.tsx or wherever checkAchievements() is called

The /functions/v1/check-achievements edge function takes 580ms and blocks 
rendering. It doesn't need to run on every dashboard load.

Change: Only call checkAchievements() AFTER the dashboard has fully rendered:
  
  useEffect(() => {
    // Defer achievement check to avoid blocking initial render
    const timer = setTimeout(() => {
      checkAchievements();
    }, 5000); // 5 second delay — user won't notice
    return () => clearTimeout(timer);
  }, []);

  Or better: only check achievements after a session is completed, not on 
  every page load. Move the call to the session completion handler.


### FIX 6: Add staleTime to ALL remaining queries

Search all files in src/hooks/ for useQuery calls that don't have staleTime set.
Add staleTime: 5 * 60 * 1000 (5 minutes) to every query that fetches 
relatively stable data (profiles, achievements, milestones, paths, completions).

This prevents React Query from refetching on every component mount.
Queries that should have 5 min staleTime:
- profiles
- achievements, milestones, user_achievements, user_milestones
- spiritual_paths, user_path_progress
- meditation_completions, mantra_completions, music_completions
- user_spiritual_goals

Queries that should stay fresh (shorter staleTime like 30 seconds):
- user_daily_activities (changes within a session)
- user_balances (changes when SHC is earned)
```

---

## Expected Results

| Metric | Current | After Fix |
|---|---|---|
| Total API calls | 43 | ~15 |
| Profile fetches | 10 | 1 |
| Auth checks | 5 | 1 |
| Completion queries | 6+ | 3 |
| API waterfall | 2.6s | ~1.0s |
| check-achievements | Blocks render | Deferred 5s |
| Dashboard interactive | ~2.5s | ~1.2s |

This is the FINAL major speed fix. After this, the remaining calls are all 
necessary unique queries that can't be deduplicated further.
