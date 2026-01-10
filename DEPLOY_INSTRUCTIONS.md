# 🚀 Deploy to Supabase Without Lovable Credits

Since you don't have Lovable credits, here's how to deploy directly to Supabase.

## Step 1: Run Database Migration ✅

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select project: `ssygukfdbtehvtndandn`

2. **Open SQL Editor**
   - Click: **SQL Editor** (left sidebar)
   - Click: **New query**

3. **Copy & Paste Migration**
   - Open file: `DEPLOY_TO_SUPABASE.sql`
   - Copy **ALL** contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor (Ctrl+V)
   - Click: **Run** or press `Ctrl+Enter`

4. **Verify Success**
   - You should see: `✅ creative_soul_usage table created successfully`
   - You should see: `✅ creative_soul_entitlements table created successfully`
   - If you see errors, check the error message and fix any issues

## Step 2: Deploy Edge Function ✅

### Option A: Via Supabase Dashboard (RECOMMENDED - EASIEST)

1. **Go to Edge Functions**
   - In Supabase Dashboard, click: **Edge Functions** (left sidebar)

2. **Find or Create Function**
   - Look for: `convert-meditation-audio`
   - If it exists: Click on it
   - If it doesn't exist: Click **Create a new function** → Name: `convert-meditation-audio`

3. **Copy Function Code**
   - Open file: `supabase/functions/convert-meditation-audio/index.ts`
   - Copy **ALL** contents (Ctrl+A, Ctrl+C)
   - Paste into Supabase code editor (Ctrl+V)

4. **Deploy**
   - Click: **Deploy** or **Save**
   - Wait for deployment to complete (usually takes 10-30 seconds)

5. **Verify Configuration**
   - Go to: **Edge Functions** → **Settings** (or check `config.toml`)
   - Ensure `verify_jwt = true` is set for `convert-meditation-audio`

### Option B: Via Supabase CLI (If CLI is installed)

```bash
# Install Supabase CLI (one-time)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref ssygukfdbtehvtndandn

# Deploy the function
supabase functions deploy convert-meditation-audio
```

### Option C: Via Management API (Advanced)

```bash
# Set your access token (get from: https://supabase.com/dashboard/account/tokens)
export SUPABASE_ACCESS_TOKEN="your_access_token_here"

# Run deployment script
node deploy-edge-function.js
```

## Step 3: Test Deployment ✅

After deployment, test the function:

1. **In Supabase Dashboard**
   - Go to: **Edge Functions** → **convert-meditation-audio** → **Invoke**
   - Method: `POST`
   - Headers: `{ "Authorization": "Bearer YOUR_ANON_KEY" }`
   - Body: `{ "mode": "demo" }`
   - Click: **Invoke**

2. **Expected Response (200 status)**
   ```json
   {
     "success": true,
     "mode": "demo",
     "job_id": "some-uuid",
     "message": "Demo generation queued. Processing will begin shortly."
   }
   ```

3. **If you get an error**
   - Check that migration ran successfully (Step 1)
   - Check that function was deployed (Step 2)
   - Check function logs in Supabase Dashboard

## Step 4: Verify Frontend Integration ✅

1. **Check Environment Variables**
   - Your frontend should have:
     - `VITE_SUPABASE_URL=https://ssygukfdbtehvtndandn.supabase.co`
     - `VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key`

2. **Test in App**
   - Navigate to: `/creative-soul-meditation-tool`
   - Click: **Generate Demo**
   - Should see: Success message with `job_id`
   - Should NOT see: 400 or 500 errors

## Troubleshooting

### Migration Fails
- **Error: "relation already exists"**
  - Tables already exist, that's OK. The migration uses `CREATE TABLE IF NOT EXISTS`
  
- **Error: "permission denied"**
  - Make sure you're running as project owner/admin
  - Check RLS policies are correct

### Edge Function Deployment Fails
- **Error: "Function not found"**
  - Create the function first in Dashboard, then paste code
  
- **Error: "verify_jwt not found"**
  - This is OK, it's in `config.toml`. Dashboard will auto-configure.
  
- **Error: "Syntax error"**
  - Check the TypeScript code is valid
  - Ensure all imports are correct

### Edge Function Returns Errors
- **Error: "Usage lookup failed"**
  - Migration didn't run successfully
  - Re-run migration (Step 1)
  
- **Error: "Entitlement lookup failed"**
  - Migration didn't run successfully
  - Re-run migration (Step 1)

## Quick Reference

**Migration File**: `DEPLOY_TO_SUPABASE.sql`  
**Edge Function File**: `supabase/functions/convert-meditation-audio/index.ts`  
**Project Ref**: `ssygukfdbtehvtndandn`  
**Build Marker**: `MED9K3M2X`

## Need Help?

1. Check Supabase Dashboard logs: **Edge Functions** → **convert-meditation-audio** → **Logs**
2. Check SQL Editor for migration errors
3. Verify tables exist: Run `SELECT * FROM creative_soul_usage LIMIT 1;` in SQL Editor

