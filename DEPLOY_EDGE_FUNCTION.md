# Deploy Edge Function to Supabase (Without Lovable Credits)

Since you don't have Lovable credits, deploy the Edge Function directly to Supabase.

## Option 1: Deploy via Supabase Dashboard (EASIEST)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `ssygukfdbtehvtndandn`

2. **Navigate to Edge Functions**
   - Go to: **Edge Functions** (left sidebar)
   - Click: **Create a new function** or find `convert-meditation-audio`

3. **Deploy the Function**
   - If function doesn't exist: Click **Create function** → Name: `convert-meditation-audio`
   - If function exists: Click on it to edit
   - Copy the entire contents of: `supabase/functions/convert-meditation-audio/index.ts`
   - Paste into the code editor
   - Click **Deploy** or **Save**

4. **Verify Configuration**
   - Go to: **Edge Functions** → **convert-meditation-audio** → **Settings**
   - Ensure `verify_jwt = true` is set (should be in `config.toml`)

## Option 2: Deploy via Supabase CLI (If you have CLI installed)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref ssygukfdbtehvtndandn

# Deploy the function
supabase functions deploy convert-meditation-audio
```

## Option 3: Deploy via Management API (Script)

See `deploy-edge-function.js` for a Node.js script that uses Supabase Management API.

## Verify Deployment

After deploying, test the function:

```bash
curl -X POST https://ssygukfdbtehvtndandn.supabase.co/functions/v1/convert-meditation-audio \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "demo"}'
```

Expected response (200 status):
```json
{
  "success": true,
  "mode": "demo",
  "job_id": "...",
  "message": "Demo generation queued. Processing will begin shortly."
}
```

## Function Code Location

The Edge Function code is at:
```
supabase/functions/convert-meditation-audio/index.ts
```

Copy the entire file contents and paste into Supabase Dashboard.

