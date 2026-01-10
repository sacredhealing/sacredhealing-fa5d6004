# ✅ Deployment Checklist

Use this checklist to ensure everything is deployed correctly.

## Pre-Deployment Checks

- [ ] You have access to Supabase Dashboard for project `ssygukfdbtehvtndandn`
- [ ] You have the Edge Function code ready: `supabase/functions/convert-meditation-audio/index.ts`
- [ ] You have the migration SQL ready: `DEPLOY_TO_SUPABASE.sql`
- [ ] Your Supabase project is active (not paused)

## Step 1: Database Migration

- [ ] Opened Supabase Dashboard → SQL Editor
- [ ] Opened file `DEPLOY_TO_SUPABASE.sql`
- [ ] Copied ALL contents (Ctrl+A, Ctrl+C)
- [ ] Pasted into SQL Editor
- [ ] Clicked **Run**
- [ ] ✅ Saw success message: "creative_soul_usage table created successfully"
- [ ] ✅ Saw success message: "creative_soul_entitlements table created successfully"
- [ ] Verified tables exist: Run `SELECT COUNT(*) FROM creative_soul_usage;` (should return 0 or number)

**If migration failed:**
- [ ] Check error message
- [ ] Check if tables already exist (run: `SELECT * FROM information_schema.tables WHERE table_name IN ('creative_soul_usage', 'creative_soul_entitlements');`)
- [ ] If tables exist but migration failed, that's OK - tables are created

## Step 2: Edge Function Deployment

- [ ] Opened Supabase Dashboard → Edge Functions
- [ ] Found or created function: `convert-meditation-audio`
- [ ] Opened file: `supabase/functions/convert-meditation-audio/index.ts`
- [ ] Copied ALL contents (Ctrl+A, Ctrl+C)
- [ ] Pasted into Supabase code editor
- [ ] Clicked **Deploy** or **Save**
- [ ] ✅ Waited for "Deployed successfully" message (10-30 seconds)
- [ ] ✅ Verified function exists in Edge Functions list

**If deployment failed:**
- [ ] Check for syntax errors in code
- [ ] Check Supabase function logs for errors
- [ ] Verify all imports are correct

## Step 3: Configuration Verification

- [ ] Checked `supabase/config.toml` has: `[functions.convert-meditation-audio]` with `verify_jwt = true`
- [ ] Verified function settings in Dashboard (if accessible)
- [ ] Function is enabled/active

**Note**: Dashboard may auto-configure based on `config.toml`. Manual verification may not be needed.

## Step 4: Testing

- [ ] Opened Supabase Dashboard → Edge Functions → `convert-meditation-audio` → **Invoke**
- [ ] Set method: `POST`
- [ ] Set headers: `{ "Authorization": "Bearer YOUR_ANON_KEY" }` (get from Project Settings → API)
- [ ] Set body: `{ "mode": "demo" }`
- [ ] Clicked **Invoke**
- [ ] ✅ Received 200 status response
- [ ] ✅ Response contains: `{ "success": true, "mode": "demo", "job_id": "..." }`
- [ ] ✅ No 400 or 500 errors

**If test failed:**
- [ ] Check function logs in Dashboard
- [ ] Verify migration ran successfully (Step 1)
- [ ] Verify tables exist: `SELECT * FROM creative_soul_usage LIMIT 1;`
- [ ] Check RLS policies are set correctly

## Step 5: Frontend Integration

- [ ] Frontend has correct environment variables:
  - `VITE_SUPABASE_URL=https://ssygukfdbtehvtndandn.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key`
- [ ] Tested in app: Navigate to `/creative-soul-meditation-tool`
- [ ] Clicked "Generate Demo" button
- [ ] ✅ Received success message with `job_id`
- [ ] ✅ No console errors
- [ ] ✅ Demo was tracked in database: `SELECT * FROM creative_soul_usage WHERE demo_used = true;`

## Step 6: Verify Stripe Webhook (After First Purchase)

- [ ] Made a test purchase (or wait for real purchase)
- [ ] Checked Stripe webhook logs
- [ ] ✅ Webhook processed payment successfully
- [ ] ✅ Entitlement was granted: `SELECT * FROM creative_soul_entitlements WHERE has_access = true;`
- [ ] ✅ Coins were credited: `SELECT * FROM user_balances WHERE balance > 0;`
- [ ] ✅ SHC transaction recorded: `SELECT * FROM shc_transactions WHERE type = 'earned';`

## Troubleshooting Checklist

### Migration Issues
- [ ] Error: "relation already exists" → OK, tables exist, skip
- [ ] Error: "permission denied" → Check user role (must be project owner/admin)
- [ ] Error: "function does not exist" → Check if `update_updated_at_column` exists (it should auto-create)

### Edge Function Issues
- [ ] Error: "Function not found" → Create function first in Dashboard, then paste code
- [ ] Error: "Deployment timeout" → Wait longer, check Supabase status
- [ ] Error: "Syntax error" → Check code in `supabase/functions/convert-meditation-audio/index.ts`

### Testing Issues
- [ ] Error: "Usage lookup failed" → Migration didn't run, re-run Step 1
- [ ] Error: "Entitlement lookup failed" → Migration didn't run, re-run Step 1
- [ ] Error: "Unauthorized" → Check Authorization header has valid Bearer token
- [ ] Error: "Missing env" → Edge Function doesn't have SUPABASE_URL/ANON_KEY set (should auto-set)

## Success Criteria

✅ **All items checked** = Deployment successful!

If all items are checked, your Edge Function is:
- ✅ Deployed and active
- ✅ Connected to database
- ✅ Ready to accept requests
- ✅ Tracking demo usage
- ✅ Checking entitlements correctly

## Next Steps

After successful deployment:
1. Test demo generation in app
2. Test paid generation (after purchase)
3. Monitor Edge Function logs for any issues
4. Set up external audio worker (Railway/Fly.io) for actual processing (future task)

## Need Help?

1. Check function logs: Supabase Dashboard → Edge Functions → `convert-meditation-audio` → Logs
2. Check SQL errors: Supabase Dashboard → SQL Editor → History
3. Check deployment status: Supabase Dashboard → Edge Functions → Activity
4. See detailed troubleshooting: `DEPLOY_INSTRUCTIONS.md`

