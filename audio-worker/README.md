# Sacred Healing Audio Worker

Complete audio processing service for meditation audio generation.

## Features

- ✅ **Binaural Beats** - Delta, Theta, Alpha, Beta, Gamma waves
- ✅ **Healing Frequencies** - Solfeggio scale (174Hz - 963Hz)
- ✅ **Noise Removal** - AI-powered noise reduction
- ✅ **Meditation Styles** - Vedic, Shamanic, Tibetan, Nature, Ocean, Forest
- ✅ **Mastering** - Presets: meditation_warm, balanced, warm, bright, loud
- ✅ **Multiple Variants** - Generate 1-5 variants per job

## Quick Deploy

### Option 1: Railway (Recommended)

1. Fork this repo or push to your GitHub
2. Go to [Railway](https://railway.app)
3. Click "New Project" → "Deploy from GitHub"
4. Select this repository
5. Add environment variables:
   - `WORKER_API_KEY` = Your secret key
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_SERVICE_KEY` = Your service role key
6. Deploy!

### Option 2: Render

1. Go to [Render](https://render.com)
2. Click "New" → "Blueprint"
3. Connect your repo with the `render.yaml` file
4. Add environment variables
5. Deploy!

### Option 3: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
cd audio-worker
fly deploy

# Set secrets
fly secrets set WORKER_API_KEY=your-secret-key
fly secrets set SUPABASE_URL=your-supabase-url
fly secrets set SUPABASE_SERVICE_KEY=your-service-key
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WORKER_API_KEY` | API key for authentication | Yes |
| `SUPABASE_URL` | Supabase project URL | No* |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | No* |
| `PORT` | Server port (default: 8000) | No |

*Required for job status updates and file storage

## API Endpoints

### Health Check
```
GET /health
```

### Process Audio
```
POST /process
POST /process-audio

Headers:
  X-Worker-Key: your-api-key

Body:
{
  "job_id": "uuid",
  "user_id": "uuid",
  "mode": "generate",
  "respond_immediately": true,
  "payload": {
    "duration_seconds": 600,
    "binaural": {
      "enabled": true,
      "type": "theta",
      "carrier_hz": 200,
      "beat_hz": 6,
      "intensity": 0.3
    },
    "healing_frequency": {
      "enabled": true,
      "hz": 528,
      "intensity": 0.2
    },
    "noise_removal": {
      "enabled": true
    },
    "meditation_style": "vedic",
    "mastering": {
      "enabled": true,
      "preset": "meditation_warm"
    },
    "variants": 1
  }
}
```

### Get Job Status
```
GET /jobs/{job_id}

Headers:
  X-Worker-Key: your-api-key
```

## Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export WORKER_API_KEY=test-key

# Run
python app.py
```

## After Deployment

1. Copy your deployed URL (e.g., `https://your-app.railway.app`)
2. Go to Lovable → Settings → Secrets
3. Update:
   - `AUDIO_WORKER_URL` = Your deployed URL
   - `AUDIO_WORKER_API_KEY` = The key you set in `WORKER_API_KEY`

## Testing

```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Test processing
curl -X POST https://your-app.railway.app/process \
  -H "Content-Type: application/json" \
  -H "X-Worker-Key: your-key" \
  -d '{
    "job_id": "test-123",
    "mode": "generate",
    "respond_immediately": true,
    "payload": {
      "duration_seconds": 60,
      "binaural": {"enabled": true, "type": "theta"}
    }
  }'
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Lovable App   │────▶│  Edge Function   │────▶│  Audio Worker   │
│   (Frontend)    │     │ (convert-audio)  │     │   (This Repo)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │    Supabase      │     │  Cloud Storage  │
                        │   (Job Status)   │     │  (Audio Files)  │
                        └──────────────────┘     └─────────────────┘
```

## License

MIT
