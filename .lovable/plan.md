
## Root Cause

The redirect bug is a timing issue between two async hooks:

1. `useAuth` initialises with `user: null` and `isLoading: true`
2. `useMembership` runs `checkSubscription` immediately with `user === null`
3. Because `user` is null, it sets `loading: false, subscribed: false, isAdmin: false`
4. `Vastu.tsx` reads this state: `membershipLoading: false` and `hasAccess: false` → immediately redirects to `/membership`
5. Only after this redirect does `useAuth` finish loading the actual session

The Vastu page never gets a chance to see the real membership status.

## Fix Plan

### 1. Fix `useMembership` hook — respect `useAuth.isLoading`

Currently `useMembership` imports `useAuth` and only gets `user`. It needs to also get `isLoading` from `useAuth`. When `isLoading` is `true` (auth session not yet resolved), the hook should keep its own `loading: true` state instead of immediately short-circuiting with `loading: false` when `user` is `null`.

**File:** `src/hooks/useMembership.ts`

Change:
```ts
const { user } = useAuth();
```
To:
```ts
const { user, isLoading: authLoading } = useAuth();
```

And in `checkSubscription`, guard the early-exit with `authLoading`:
```ts
const checkSubscription = useCallback(async () => {
  if (authLoading) return; // stay loading while auth resolves
  if (!user) {
    setStatus({
      subscribed: false,
      tier: 'free',
      subscriptionEnd: null,
      loading: false,
      adminGranted: false,
      isAdmin: false,
    });
    return;
  }
  // ... rest of the existing logic
}, [user, authLoading]);
```

Also add `authLoading` to the dependency array of the `useEffect`.

### 2. Add `localStorage` caching to `useMembership`

Since the hook is mounted in multiple places and each mount fires the same slow async calls (confirmed by the duplicate edge function invocations in the logs), add a short-lived cache (5 minutes) in `localStorage` to return the last known status instantly on subsequent mounts. This also eliminates the concurrent duplicate API calls.

**Cache key:** `sh:membership:[userId]`  
**TTL:** 5 minutes

On successful status fetch, save to cache. On mount (before async), load from cache and use it as the initial state (so `loading: false` with real data, not `loading: true`).

### Files to Modify

- `src/hooks/useMembership.ts` — two changes:
  1. Respect `authLoading` to prevent premature `loading: false` before auth resolves
  2. Add localStorage cache to serve instant results and prevent duplicate calls

No changes needed to `Vastu.tsx` or the edge function — they are already correct.
