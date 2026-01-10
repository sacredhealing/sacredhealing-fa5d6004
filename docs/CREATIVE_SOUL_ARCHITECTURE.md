# Creative Soul Tool Architecture

## ✅ Current Architecture (Edge-Safe)

### Frontend (Lovable/React)
- Calls lightweight edge functions for API-based operations
- Calls dispatcher edge function for heavy processing operations

### Edge Functions (Supabase/Deno) - Traffic Cop Only
These functions **ONLY**:
- ✅ Authenticate users
- ✅ Check access/licenses
- ✅ Create Stripe checkout sessions
- ✅ Call external APIs (OpenAI, etc.)
- ✅ Return job IDs for heavy processing
- ✅ Return 200 status codes (never 500)

These functions **CANNOT**:
- ❌ Run ffmpeg
- ❌ Run Demucs
- ❌ Process audio files
- ❌ Do stem separation
- ❌ Access filesystem
- ❌ Use Node.js libraries
- ❌ Handle large file uploads

### External Worker (Required for Heavy Processing)
For operations like:
- YouTube to MP3 conversion
- Stem separation (Demucs)
- Audio mixing/processing
- BPM detection
- File format conversion

**Recommended Services:**
- Railway (Python, ffmpeg)
- Fly.io (Containerized workloads)
- RunPod (GPU instances)
- Any VPS with ffmpeg/Demucs installed

## 🔄 Current Edge Functions

### ✅ Lightweight Functions (OK - Just API Calls)

1. **`creative-soul-transcribe`**
   - Calls OpenAI Whisper API
   - Just forwards API request
   - ✅ Edge-safe

2. **`creative-soul-ideas`**
   - Calls GPT-4 API
   - Just forwards API request
   - ✅ Edge-safe

3. **`creative-soul-image`**
   - Calls DALL-E API
   - Just forwards API request
   - ✅ Edge-safe

4. **`creative-soul-youtube`**
   - Currently returns placeholder
   - ❌ Cannot do actual conversion in Edge
   - ✅ Should return job_id and queue external worker

### ✅ Dispatcher Function (NEW)

**`creative-soul-tool`**
- Handles: `demo`, `generate`, `checkout` actions
- Validates auth and access
- Returns job IDs for external processing
- ✅ Always returns 200 status
- ✅ Never crashes

## 🚀 External Worker Setup

### Required API Endpoint

Your external worker should expose:

```
POST /process-audio
Content-Type: application/json
Authorization: Bearer <worker-api-key>

{
  "job_id": "uuid-from-edge-function",
  "user_id": "user-uuid",
  "action": "youtube_mp3" | "stem_separation" | "audio_mix",
  "youtube_url": "https://youtube.com/...",
  "options": {
    "keep_music": true,
    "keep_vocals": false,
    "binaural": true,
    "frequency": 432,
    "bpm": null,
    "variants": 3
  }
}
```

### Response Format

```json
{
  "success": true,
  "job_id": "uuid",
  "status": "queued" | "processing" | "completed" | "failed",
  "result_url": "https://storage.url/audio.mp3",
  "stems": {
    "vocals": "https://...",
    "music": "https://...",
    "bass": "https://..."
  }
}
```

### Job Status Endpoint

```
GET /job-status/{job_id}
Authorization: Bearer <worker-api-key>

Response:
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 45,
  "estimated_seconds_remaining": 120
}
```

## 📝 Integration Example

### Frontend Code

```typescript
// 1. Dispatch job to edge function
const { data: job } = await supabase.functions.invoke('creative-soul-tool', {
  body: {
    action: 'generate',
    youtube_url: 'https://youtube.com/watch?v=...',
    options: {
      keep_music: true,
      binaural: true,
      frequency: 432
    }
  }
});

// 2. Queue job in external worker
if (job.success && job.job_id) {
  await fetch('https://your-worker.railway.app/process-audio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WORKER_API_KEY}`
    },
    body: JSON.stringify({
      job_id: job.job_id,
      user_id: user.id,
      action: 'youtube_mp3',
      youtube_url: '...',
      options: { ... }
    })
  });

  // 3. Poll for results
  pollJobStatus(job.job_id);
}
```

## 🔐 Security

- Edge function validates user auth
- Edge function checks tool access
- External worker validates API key
- External worker should verify job_id was created by valid user
- Store job status in Supabase DB for tracking

## 💾 Database Schema (Recommended)

```sql
CREATE TABLE creative_soul_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL UNIQUE,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);
```

## 🎯 Deployment Checklist

- [x] Edge function `creative-soul-tool` created and deployed
- [ ] External worker service provisioned (Railway/Fly.io/etc.)
- [ ] Worker API endpoints implemented
- [ ] Worker API key configured in Supabase secrets
- [ ] Job tracking table created in Supabase
- [ ] Frontend updated to use new architecture
- [ ] Error handling and retry logic implemented
- [ ] Progress polling implemented in frontend

## ⚠️ Important Notes

1. **Never try to do heavy processing in Edge Functions**
2. **Always return 200 status codes** (errors in response body)
3. **Use job IDs for async processing**
4. **Poll external worker for job status**
5. **Store results in Supabase Storage** after processing
6. **Update database with job status** for tracking

