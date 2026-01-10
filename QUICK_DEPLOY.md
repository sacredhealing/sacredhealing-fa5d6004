# ⚡ Quick Deploy to Supabase (2 Steps)

**Project ID**: `ssygukfdbtehvtndandn`

## Step 1: Run Database Migration (2 minutes)

1. Go to: https://supabase.com/dashboard/project/ssygukfdbtehvtndandn/sql/new
2. Open file: `DEPLOY_TO_SUPABASE.sql`
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. ✅ You should see: "creative_soul_usage table created successfully"

## Step 2: Deploy Edge Function (3 minutes)

### Via Dashboard (EASIEST):

1. Go to: https://supabase.com/dashboard/project/ssygukfdbtehvtndandn/functions
2. Click: **Create a new function** (or find `convert-meditation-audio` if it exists)
3. Function name: `convert-meditation-audio`
4. Open file: `supabase/functions/convert-meditation-audio/index.ts`
5. Copy ALL contents (Ctrl+A, Ctrl+C)
6. Paste into code editor
7. Click **Deploy**
8. ✅ Wait for "Deployed successfully" message

## Step 3: Test It (1 minute)

1. In Supabase Dashboard → Edge Functions → `convert-meditation-audio`
2. Click **Invoke**
3. Body: `{ "mode": "demo" }`
4. Headers: `{ "Authorization": "Bearer YOUR_ANON_KEY" }`
5. ✅ Expected: `{ "success": true, "mode": "demo", "job_id": "..." }`

## Done! 🎉

Your Edge Function is now deployed and ready to use.

**Need help?** See `DEPLOY_INSTRUCTIONS.md` for detailed troubleshooting.

