# Switch App to New Supabase

When data migration is confirmed complete, do these steps:

## 1. Get new Supabase keys
Go to: supabase.com → siddha-quantum-nexus project → Settings → API
Copy:
- Project URL: https://fjdzhrdpioxdeyyfogep.supabase.co
- anon public key (the long eyJ... string)

## 2. Update .env in GitHub
Go to: github.com/sacredhealing/sacredhealing-fa5d6004/blob/main/.env
Edit these values:
```
SUPABASE_URL=https://fjdzhrdpioxdeyyfogep.supabase.co
SUPABASE_PUBLISHABLE_KEY=<new anon key>
VITE_SUPABASE_URL=https://fjdzhrdpioxdeyyfogep.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<new anon key>
VITE_SUPABASE_PROJECT_ID=fjdzhrdpioxdeyyfogep
```

## 3. Connect Vercel
Go to: vercel.com → Add New Project → Import GitHub repo
- Select: sacredhealing/sacredhealing-fa5d6004
- Add the same env vars above in Vercel dashboard
- Deploy

## 4. Point domain to Vercel
In Vercel: Settings → Domains → add sacredhealing.lovable.app or custom domain

## 5. Cancel Lovable
You're free. €25/month saved.
