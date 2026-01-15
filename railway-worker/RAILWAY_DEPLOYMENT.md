# Railway Worker Deployment Guide

## Quick Start

1. **Push to GitHub**: Ensure the `railway-worker/` directory is in your repository

2. **Create Railway Project**:
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect the Dockerfile

3. **Set Environment Variables** in Railway dashboard:
   ```
   AUDIO_WORKER_API_KEY=your-secret-key-here
   PORT=8080
   ```

4. **Get Your Railway URL**:
   - Railway will provide a URL like: `https://your-service.up.railway.app`
   - Copy this URL

5. **Update Supabase Edge Function**:
   - Go to Supabase Dashboard → Edge Functions → Settings
   - Add environment variables:
     ```
     AUDIO_WORKER_URL=https://your-service.up.railway.app
     AUDIO_WORKER_API_KEY=your-secret-key-here (same as Railway)
     ```

6. **Test the Health Endpoint**:
   ```bash
   curl https://your-service.up.railway.app/health
   ```
   Should return: `{"status":"healthy","service":"audio-worker"}`

## Features Implemented

✅ **Binaural Beats**: Delta, Theta, Alpha, Beta, Gamma  
✅ **Solfeggio Frequencies**: 174Hz - 963Hz (full scale)  
✅ **Noise Removal**: Using noisereduce library  
✅ **Meditation Styles**: 15+ styles (vedic, shamanic, tibetan, nature, ocean, etc.)  
✅ **Mastering Presets**: meditation_warm, balanced, warm, bright, loud  
✅ **Multiple Variants**: Generate 1-5 variants per job  
✅ **YouTube Support**: Download and process YouTube audio  
✅ **Direct URL Support**: Process audio from any URL  

## API Endpoints

### Health Check
```
GET /health
```

### Process Audio
```
POST /process-audio
Headers:
  x-api-key: your-secret-key

Body:
{
  "job_id": "uuid",
  "callback_url": "https://supabase-url/functions/v1/worker-callback",
  "callback_api_key": "key",
  "payload": {
    "frequency_hz": 432,
    "binaural": "theta",
    "style": "nature-healing",
    "duration": 30,
    "variants": 3,
    "audioUrl": "https://...",
    "youtube_urls": [],
    "direct_urls": [],
    "noise_reduction_level": "medium",
    "mastering_enabled": true,
    "mastering_preset": "meditation_warm"
  }
}
```

## Troubleshooting

### Health Check Fails
- Check Railway logs for errors
- Verify PORT environment variable is set
- Check if service is running

### Processing Fails
- Check Railway logs for detailed error messages
- Verify audio URLs are accessible
- Check callback URL is correct

### Slow Processing
- Large audio files take time
- Multiple variants increase processing time
- Consider upgrading Railway plan for more resources

## Monitoring

- Check Railway dashboard for logs
- Monitor job status via Supabase `creative_soul_jobs` table
- Check callback responses in Supabase Edge Function logs

## Next Steps

1. Test with a small audio file
2. Monitor processing times
3. Adjust worker resources in Railway if needed
4. Add LANDR API integration for mastering (optional)

