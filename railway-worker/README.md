# Railway Audio Worker API

This is the Railway worker service for processing meditation audio with advanced features.

## Features

- **Binaural Beats**: Delta, Theta, Alpha, Beta, Gamma frequencies
- **Healing Frequencies**: Full Solfeggio scale (174Hz - 963Hz)
- **Noise Removal**: Using noisereduce library
- **Meditation Styles**: Vedic, Shamanic, Tibetan, Nature, Ocean, Forest, and more
- **Mastering Presets**: meditation_warm, balanced, warm, bright, loud
- **Multiple Variants**: Generate multiple variations of processed audio

## Setup

1. **Deploy to Railway**:
   - Connect your GitHub repository
   - Railway will auto-detect the Dockerfile
   - Set environment variables (see `.env.example`)

2. **Environment Variables**:
   - `AUDIO_WORKER_API_KEY`: Secret key for API authentication
   - `PORT`: Port to run on (default: 8080)
   - `LANDR_API_KEY`: (Optional) For LANDR mastering
   - `LANDR_API_SECRET`: (Optional) For LANDR mastering

3. **Update Supabase Edge Function**:
   - Set `AUDIO_WORKER_URL` to your Railway service URL
   - Set `AUDIO_WORKER_API_KEY` to match the worker's API key

## API Endpoints

### `GET /health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "audio-worker"
}
```

### `POST /process-audio`
Process audio with meditation effects.

**Headers**:
- `x-api-key`: Your `AUDIO_WORKER_API_KEY`

**Request Body**:
```json
{
  "job_id": "uuid",
  "callback_url": "https://your-supabase-url/functions/v1/worker-callback",
  "callback_api_key": "your-api-key",
  "payload": {
    "frequency_hz": 432,
    "binaural": "theta",
    "style": "nature-healing",
    "duration": 30,
    "variants": 3,
    "audioUrl": "https://example.com/audio.mp3",
    "youtube_urls": ["https://youtube.com/watch?v=..."],
    "direct_urls": ["https://example.com/audio.wav"],
    "noise_reduction_level": "medium",
    "mastering_enabled": true,
    "mastering_preset": "meditation_warm"
  }
}
```

**Response**:
```json
{
  "success": true,
  "job_id": "uuid",
  "message": "Processing started"
}
```

## Binaural Beat Types

- `delta`: 0.5-4 Hz - Deep sleep
- `theta`: 4-8 Hz - Meditation, deep relaxation
- `alpha`: 8-13 Hz - Light meditation, relaxed awareness
- `beta`: 14-30 Hz - Focus, active thinking
- `gamma`: 30-100 Hz - Peak concentration, insight
- `none`: No binaural beats

## Solfeggio Frequencies

- 174 Hz - Foundation, pain relief
- 285 Hz - Quantum cognition, tissue healing
- 396 Hz - Liberation, release fear
- 417 Hz - Facilitation, change
- 432 Hz - Natural frequency, DNA repair
- 444 Hz - Love frequency
- 528 Hz - Miracle tone, transformation
- 639 Hz - Connection, relationships
- 741 Hz - Expression, intuition
- 777 Hz - Spiritual awakening
- 852 Hz - Third eye activation
- 888 Hz - Abundance, prosperity
- 936 Hz - Pineal gland activation
- 963 Hz - Crown chakra
- 999 Hz - Highest consciousness

## Meditation Styles

- `vedic` / `indian-vedic`: Tanpura drones, temple bells, mantras
- `shamanic`: Frame drums, rattles, tribal rhythms
- `tibetan`: Singing bowls, long horns, overtone chanting
- `nature` / `nature-healing`: Forest sounds, birds, wind
- `ocean` / `ocean-water`: Ocean waves, seagulls
- `forest`: Birdsong, rustling leaves, stream
- `mystic`: Etheric pads, choirs, cosmic textures
- `sufi`: Whirling rhythms, ney flute
- `zen`: Minimal ambience, breath awareness
- `sound-bath`: Gongs, crystal bowls, harmonics
- `chakra-balancing`: Layered tones for each chakra
- `higher-consciousness`: Cosmic tones, transcendence
- `relaxing`: Gentle ambient, soft pads
- `breath-focus`: Minimal, breath-guiding
- `kundalini-energy`: Rising energy, activation tones

## Mastering Presets

- `meditation_warm`: Warm, gentle mastering for meditation
- `balanced`: Balanced frequency response
- `warm`: Warm, smooth mastering
- `bright`: Bright, clear mastering
- `loud`: Loud, punchy mastering
- `punchy`: Punchy, dynamic mastering

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export AUDIO_WORKER_API_KEY=your-key
export PORT=8080

# Run locally
python app.py
```

## Railway Deployment

1. Push code to GitHub
2. Connect repository to Railway
3. Railway will auto-detect Dockerfile
4. Set environment variables in Railway dashboard
5. Deploy!

## Notes

- Audio processing happens asynchronously
- Results are sent via callback to Supabase edge function
- Large files may take several minutes to process
- Worker uses background threads for parallel processing

