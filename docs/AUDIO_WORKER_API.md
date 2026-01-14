# Audio Worker API Specification

This document describes the API contract between Sacred Healing and your custom Audio Worker service.

## Overview

The Audio Worker is responsible for:
- **Binaural beats generation** (delta, theta, alpha, beta, gamma)
- **Healing frequency embedding** (174Hz - 963Hz solfeggio + 432Hz)
- **Meditation style ambient sounds** (ocean, forest, tibetan, cosmic, etc.)
- **Stem separation** (2stems, 4stems, 5stems using Demucs/Spleeter)
- **Noise removal** (light, medium, aggressive)
- **Audio mastering** (via LANDR API or local processing)
- **BPM matching and tempo adjustment**

## Endpoint

```
POST {AUDIO_WORKER_URL}/process-audio
```

## Authentication

Include the API key in the request header:
```
x-api-key: {AUDIO_WORKER_API_KEY}
```

## Request Payload

```typescript
interface AudioWorkerRequest {
  // Job identification
  job_id: string;
  callback_url: string;
  callback_api_key: string;
  
  // Binaural beats configuration
  binaural: {
    enabled: boolean;
    type: "delta" | "theta" | "alpha" | "beta" | "gamma";
    carrier_frequency: number;  // Hz (100-500)
    beat_frequency: number;     // Hz (2-40)
    volume: number;             // 0.0 - 1.0
    description: string;
  };
  
  // Healing frequency configuration
  healing_frequency: {
    enabled: boolean;
    hz: number;                 // 174, 285, 396, 417, 432, 528, 639, 741, 852, 963
    volume: number;             // 0.0 - 1.0
    description: string;
  };
  
  // Processing mode
  processing_mode: "BINAURAL" | "TONE_TUNING" | "BOTH";
  
  // Meditation style and ambient sounds
  meditation_style: string;     // "ocean-water", "forest-nature", etc.
  ambient: {
    sounds: string[];           // ["ocean_waves", "birds", etc.]
    intensity: number;          // 0.0 - 1.0
    volume: number;             // 0.0 - 1.0
  };
  
  // Source audio configuration
  source: {
    url?: string;               // URL to source audio file
    volume: number;             // 0.0 - 1.0
    target_bpm?: number;        // Optional BPM to match
  };
  
  // Duration and variants
  duration: number;             // Duration in seconds
  variants: number;             // Number of output variants (1-3)
  
  // Stem separation options
  stem_separation: {
    enabled: boolean;
    type: "2stems" | "4stems" | "5stems";
    keep_stems: string[];       // ["vocals", "drums", "bass", "other", "piano"]
    remove_stems: string[];
  };
  
  // Noise removal
  noise_removal: {
    enabled: boolean;
    level: "light" | "medium" | "aggressive";
  };
  
  // Mastering
  mastering: {
    enabled: boolean;
    preset: "balanced" | "loud" | "warm" | "bright" | "punchy";
  };
  
  // Output configuration
  output: {
    format: "mp3" | "wav" | "flac";
    quality: "standard" | "high" | "lossless";
  };
  
  // Mode info
  mode: "demo" | "paid";
  is_demo: boolean;
}
```

## Binaural Beat Configurations

| Type   | Carrier | Beat | Description                          |
|--------|---------|------|--------------------------------------|
| delta  | 100 Hz  | 2 Hz | Deep sleep, healing (0.5-4 Hz)       |
| theta  | 200 Hz  | 6 Hz | Deep meditation, creativity (4-8 Hz) |
| alpha  | 300 Hz  | 10 Hz| Relaxation, light meditation (8-13 Hz)|
| beta   | 400 Hz  | 20 Hz| Focus, alertness (13-30 Hz)          |
| gamma  | 500 Hz  | 40 Hz| Higher cognition, insight (30-100 Hz)|

### Binaural Generation Algorithm

```python
# Left channel: carrier frequency
# Right channel: carrier frequency + beat frequency
left_channel = sine_wave(carrier_hz)
right_channel = sine_wave(carrier_hz + beat_hz)

# The brain perceives the difference as the "beat"
# For theta (6 Hz): left=200Hz, right=206Hz
```

## Healing Frequencies (Solfeggio Scale)

| Frequency | Description               |
|-----------|---------------------------|
| 174 Hz    | Pain relief, grounding    |
| 285 Hz    | Tissue healing, safety    |
| 396 Hz    | Liberation from fear      |
| 417 Hz    | Facilitating change       |
| 432 Hz    | Universal harmony         |
| 528 Hz    | DNA repair, miracles      |
| 639 Hz    | Harmonious relationships  |
| 741 Hz    | Awakening intuition       |
| 852 Hz    | Spiritual order           |
| 963 Hz    | Divine consciousness      |

## Meditation Styles

| Style         | Ambient Sounds                    | Intensity |
|---------------|-----------------------------------|-----------|
| ocean-water   | ocean_waves, water_flow           | 0.6       |
| forest-nature | birds, wind_leaves, stream        | 0.5       |
| tibetan       | singing_bowls, temple_bells, chanting | 0.7   |
| space-cosmic  | space_drone, cosmic_pad, stars    | 0.4       |
| rain-thunder  | rain_heavy, thunder_distant, rain_on_leaves | 0.65 |
| crystal-bowls | crystal_singing, harmonic_resonance | 0.55    |
| zen-garden    | bamboo_fountain, wind_chimes, koto | 0.45    |

## Callback API

When processing is complete, call the callback URL:

### Progress Update
```json
POST {callback_url}
Headers: { "x-worker-api-key": "{callback_api_key}" }
Body: {
  "job_id": "uuid",
  "status": "processing",
  "progress": 50
}
```

### Completion
```json
POST {callback_url}
Headers: { "x-worker-api-key": "{callback_api_key}" }
Body: {
  "job_id": "uuid",
  "status": "completed",
  "progress": 100,
  "result_url": "https://storage.example.com/output.mp3"
}
```

### Failure
```json
POST {callback_url}
Headers: { "x-worker-api-key": "{callback_api_key}" }
Body: {
  "job_id": "uuid",
  "status": "failed",
  "error": "Detailed error message"
}
```

## Status Values

- `queued` - Job received, waiting to process
- `processing` - Currently processing
- `completed` - Successfully completed
- `failed` - Processing failed

## Recommended Tech Stack for Worker

### Audio Processing Libraries
- **Binaural/Tone Generation**: PyDub, NumPy + SciPy
- **Stem Separation**: Demucs (5stems), Spleeter (2/4stems)
- **Noise Removal**: RNNoise, DeepFilterNet
- **Mastering**: LANDR API, or MatcherLoud + Limiter

### Python Example
```python
import numpy as np
from scipy.io import wavfile
from pydub import AudioSegment

def generate_binaural(carrier_hz, beat_hz, duration_sec, sample_rate=44100):
    """Generate stereo binaural beat audio."""
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec))
    
    # Left channel: carrier frequency
    left = np.sin(2 * np.pi * carrier_hz * t)
    
    # Right channel: carrier + beat frequency
    right = np.sin(2 * np.pi * (carrier_hz + beat_hz) * t)
    
    # Combine into stereo
    stereo = np.column_stack((left, right))
    
    return (stereo * 32767).astype(np.int16)

def generate_healing_tone(frequency_hz, duration_sec, sample_rate=44100):
    """Generate healing frequency tone."""
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec))
    tone = np.sin(2 * np.pi * frequency_hz * t)
    return (tone * 32767).astype(np.int16)
```

## Response Format

Immediate response (before processing):
```json
{
  "success": true,
  "job_id": "uuid",
  "message": "Job queued for processing"
}
```

## Environment Variables Required

```bash
AUDIO_WORKER_URL=https://your-worker.example.com
AUDIO_WORKER_API_KEY=your-secret-api-key
```

## Demo vs Paid Limits

| Feature           | Demo      | Paid      |
|-------------------|-----------|-----------|
| Duration          | 60 sec    | 300 sec   |
| Variants          | 1         | 3         |
| Stem Separation   | No        | Yes       |
| Noise Removal     | Basic     | Full      |
| Mastering         | No        | Yes       |
| Output Quality    | Standard  | High/Lossless |
