
## Root Cause — Vastu Page Redirecting on Click

### The Bug

`Vastu.tsx` has two guards that fire in the wrong order:

1. Line 12: `if (!user) return <Navigate to="/auth" replace />;`
2. Line 17: `if (membershipLoading) return <spinner />;`

On every navigation to `/vastu`, `useAuth` starts with `user: null, isLoading: true`. The page hits line 12 immediately and redirects to `/auth` — before the session has been verified. The user is already logged in (proven by `ProtectedRoute` letting them through), but `Vastu.tsx` doesn't wait for auth to finish.

### Why the Previous Fix Did Not Work

The previous fix correctly updated `useMembership` to respect `authLoading`. However, `Vastu.tsx` has its own raw `useAuth()` call (`const { user } = useAuth()`) that bypasses all that logic and redirects immediately when `user` is null.

### The Fix

**File: `src/pages/Vastu.tsx`**

Add `isLoading: authLoading` from `useAuth`, and wait for both auth AND membership to resolve before making any routing decisions:

```tsx
const { user, isLoading: authLoading } = useAuth();
```

Then replace the premature redirect with a single loading guard:

```tsx
// Wait for auth session AND membership check to complete
if (authLoading || membershipLoading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

// Only redirect to auth once we KNOW there is no user
if (!user) {
  return <Navigate to="/auth" replace />;
}
```

This ensures the page never redirects based on an unresolved `null` user value.

### Also Check Ayurveda.tsx

The same anti-pattern likely exists in `src/pages/Ayurveda.tsx`. That page will have the same instant-redirect bug for the same reason. The fix is identical — add `isLoading: authLoading` and gate the `!user` redirect behind it.

### Files to Modify

- `src/pages/Vastu.tsx` — Fix auth loading guard (the primary issue)
- `src/pages/Ayurveda.tsx` — Apply same fix proactively to prevent the same bug there
