# Audio Processing Services Integration

This document describes the integrated audio processing services available in the Creative Soul Meditation tool.

## Overview

The system supports four main audio processing services:

1. **Stem Separation** - Spleeter-based 5-stem API
2. **Audio Analysis** - BPM/Key/Tempo detection
3. **LANDR Mastering** - Automated mastering service
4. **Noise Removal** - Audio denoising and cleanup

## Architecture

All services follow the same architecture pattern:

1. **Edge Function** - Lightweight dispatcher that:
   - Validates authentication
   - Creates job records in `creative_soul_jobs` table
   - Dispatches to external worker or API
   - Returns job_id for tracking

2. **External Worker/API** - Heavy processing happens in:
   - External audio worker service (Railway, Fly.io, etc.)
   - Direct API integration (LANDR, Spleeter API, etc.)
   - Updates job status via `worker-callback` Edge Function

3. **Job Tracking** - All jobs are tracked in `creative_soul_jobs` table with:
   - `job_id` - Unique identifier
   - `action` - Service type (stem_separation, audio_analysis, etc.)
   - `status` - queued | processing | completed | failed
   - `progress` - 0-100
   - `result_url` - Final output URL
   - `payload` - Original request parameters

## Services

### 1. Stem Separation (`stem-separation`)

**Purpose**: Separate audio into individual stems (vocals, drums, bass, etc.)

**Edge Function**: `supabase/functions/stem-separation/index.ts`

**Request Body**:
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "stems": "5stems",  // "2stems" | "4stems" | "5stems"
  "keepStems": ["vocals", "drums"],  // Optional: keep only these stems
  "removeStems": ["vocals"]  // Optional: remove these stems
}
```

**Response**:
```json
{
  "success": true,
  "job_id": "uuid",
  "message": "Stem separation queued. Processing will begin shortly."
}
```

**Environment Variables**:
- `SPLEETER_API_URL` (optional) - External Spleeter API endpoint
- `SPLEETER_API_KEY` (optional) - API key for external service
- `AUDIO_WORKER_URL` - External worker service URL
- `AUDIO_WORKER_API_KEY` - Worker API key

**Worker Endpoint**: `POST /stem-separation`

---

### 2. Audio Analysis (`audio-analysis`)

**Purpose**: Analyze audio to detect BPM, key, tempo, loudness

**Edge Function**: `supabase/functions/audio-analysis/index.ts`

**Request Body**:
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "trackId": "optional-uuid",  // If analyzing existing track
  "analyzeBPM": true,
  "analyzeKey": true,
  "analyzeTempo": true,
  "analyzeLoudness": true
}
```

**Response**:
```json
{
  "success": true,
  "job_id": "uuid",
  "analysis": {
    "bpm": 120,
    "key": "C major",
    "tempo": 120.5,
    "loudness": -14.2
  }
}
```

**Environment Variables**:
- `AUDIO_ANALYSIS_API_URL` (optional) - External analysis API
- `AUDIO_ANALYSIS_API_KEY` (optional) - API key
- `AUDIO_WORKER_URL` - External worker service URL
- `AUDIO_WORKER_API_KEY` - Worker API key

**Worker Endpoint**: `POST /audio-analysis`

---

### 3. LANDR Mastering (`landr-mastering`)

**Purpose**: Automated mastering using LANDR API

**Edge Function**: `supabase/functions/landr-mastering/index.ts`

**Request Body**:
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "preset": "balanced",  // "balanced" | "loud" | "warm" | "bright" | "punchy"
  "format": "wav",  // "wav" | "mp3"
  "sampleRate": 44100  // 44100 | 48000 | 96000
}
```

**Response**:
```json
{
  "success": true,
  "job_id": "uuid",
  "landr_job_id": "landr-job-id",
  "status_url": "https://api.landr.com/v1/mastering/status/...",
  "message": "Mastering job submitted to LANDR. Processing..."
}
```

**Environment Variables**:
- `LANDR_API_KEY` - LANDR API client ID
- `LANDR_API_SECRET` - LANDR API client secret
- `AUDIO_WORKER_URL` - External worker service URL (fallback)
- `AUDIO_WORKER_API_KEY` - Worker API key

**LANDR API**: Uses OAuth 2.0 client credentials flow

**Worker Endpoint**: `POST /landr-mastering`

---

### 4. Noise Removal (`noise-removal`)

**Purpose**: Remove noise, hiss, hum, clicks from audio

**Edge Function**: `supabase/functions/noise-removal/index.ts`

**Request Body**:
```json
{
  "audioUrl": "https://example.com/audio.mp3",
  "noiseReductionLevel": "medium",  // "light" | "medium" | "aggressive"
  "removeHiss": true,
  "removeHum": true,
  "removeClicks": true,
  "preserveVoice": true
}
```

**Response**:
```json
{
  "success": true,
  "job_id": "uuid",
  "output_url": "https://example.com/cleaned-audio.mp3",
  "noise_reduction_applied": true
}
```

**Environment Variables**:
- `NOISE_REMOVAL_API_URL` (optional) - External noise removal API
- `NOISE_REMOVAL_API_KEY` (optional) - API key
- `AUDIO_WORKER_URL` - External worker service URL
- `AUDIO_WORKER_API_KEY` - Worker API key

**Worker Endpoint**: `POST /noise-removal`

---

## Integration with Creative Soul Meditation

The `convert-meditation-audio` Edge Function now supports these services as optional processing steps:

**Request Body** (extended):
```json
{
  "mode": "paid",
  "frequency_hz": 432,
  "processing_mode": "TONE_TUNING",
  "meditation_style": "ocean-water",
  "sound_layers": ["ocean_waves", "rain_soft"],
  "audioUrl": "https://example.com/audio.mp3",
  "variants": 3,
  // New options:
  "enable_stem_separation": true,
  "stem_separation_type": "5stems",
  "keep_stems": ["vocals"],
  "enable_noise_removal": true,
  "noise_reduction_level": "medium",
  "enable_mastering": true,
  "mastering_preset": "balanced"
}
```

## Job Status Tracking

All services use the same job tracking system:

**Get Job Status**:
```typescript
const { data } = await supabase.functions.invoke('get-job-status', {
  body: { job_id: 'uuid' }
});
```

**Response**:
```json
{
  "success": true,
  "job": {
    "job_id": "uuid",
    "action": "stem_separation",
    "status": "processing",
    "progress": 65,
    "result_url": null,
    "error_message": null,
    "created_at": "2024-01-01T00:00:00Z",
    "completed_at": null
  }
}
```

## Worker Callback

The `worker-callback` Edge Function receives updates from external workers:

**Request** (from worker):
```json
{
  "job_id": "uuid",
  "status": "completed",
  "progress": 100,
  "result_url": "https://example.com/output.mp3",
  "error": null
}
```

**Headers**:
- `x-worker-api-key`: Must match `AUDIO_WORKER_API_KEY`

## Deployment

1. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy stem-separation
   supabase functions deploy audio-analysis
   supabase functions deploy landr-mastering
   supabase functions deploy noise-removal
   ```

2. **Set Environment Variables** in Supabase Dashboard:
   - `LANDR_API_KEY` / `LANDR_API_SECRET` (for LANDR)
   - `SPLEETER_API_URL` / `SPLEETER_API_KEY` (optional)
   - `AUDIO_ANALYSIS_API_URL` / `AUDIO_ANALYSIS_API_KEY` (optional)
   - `NOISE_REMOVAL_API_URL` / `NOISE_REMOVAL_API_KEY` (optional)
   - `AUDIO_WORKER_URL` / `AUDIO_WORKER_API_KEY` (required for worker-based processing)

3. **External Worker Implementation**:
   - Worker should implement endpoints: `/stem-separation`, `/audio-analysis`, `/landr-mastering`, `/noise-removal`
   - Worker should call back to `worker-callback` Edge Function with job updates
   - Worker should use libraries like:
     - **Spleeter** (Python) or **Demucs** for stem separation
     - **librosa** (Python) or **essentia** for audio analysis
     - **LANDR API** for mastering
     - **noisereduce** (Python) or **sox** for noise removal

## Example Worker Implementation (Python/Flask)

```python
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

AUDIO_WORKER_API_KEY = os.getenv('AUDIO_WORKER_API_KEY')
CALLBACK_URL = os.getenv('CALLBACK_URL')

@app.route('/stem-separation', methods=['POST'])
def stem_separation():
    data = request.json
    job_id = data['job_id']
    callback_url = data['callback_url']
    
    # Process with Spleeter/Demucs
    # ... audio processing ...
    
    # Callback with result
    requests.post(callback_url, json={
        'job_id': job_id,
        'status': 'completed',
        'progress': 100,
        'result_url': 'https://example.com/stems.zip'
    }, headers={'x-worker-api-key': AUDIO_WORKER_API_KEY})
    
    return jsonify({'success': True})
```

## Next Steps

1. Deploy Edge Functions to Supabase
2. Set up external audio worker service (Railway, Fly.io, etc.)
3. Configure environment variables
4. Test each service individually
5. Integrate into frontend UI

