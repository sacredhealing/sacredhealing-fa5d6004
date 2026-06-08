# SQI Sovereign Sniper — Railway Worker

## Railway env vars (set these in Railway dashboard)

| Variable | Value | Required |
|---|---|---|
| `HELIUS_API_KEY` | From helius.dev (free) | YES (or Alchemy) |
| `ALCHEMY_API_KEY` | From alchemy.com (free, faster) | Recommended |
| `GEMINI_API_KEY` | Already active: `AIzaAb8RN6I1pEG3CwLRQUrouoAGdXVOb--n9niPBfnCdu_OCQnkJw` | YES |
| `SUPABASE_URL` | `https://fjdzhrdpioxdeyyfogep.supabase.co` | YES |
| `SUPABASE_SERVICE_KEY` | From Supabase → Settings → API | YES |
| `BOT_USER_ID` | `bd0b21c9-577a-450b-bb1e-21c9d0423f17` (admin UUID) | YES |
| `PAPER_MODE` | `true` to start | YES |
| `BUY_AMOUNT_SOL` | `0.05` | YES |
| `TWITTER_BEARER_TOKEN` | From developer.twitter.com | Optional |

## Deploy steps
1. Railway → New Project → Deploy from GitHub repo
2. Select folder: `sniper-worker`
3. Add all env vars above
4. Deploy → watch logs
