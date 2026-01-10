# RapidAPI Noise Canceller Integration

## Overview
The `noise-removal` edge function has been updated to integrate with RapidAPI's Noise Canceller service. The function now uses RapidAPI as the primary noise removal processor, with automatic fallback to the audio worker if RapidAPI is unavailable or returns a server error.

## Changes Made

### Updated Environment Variables
- **Removed**: `NOISE_REMOVAL_API_URL` and `NOISE_REMOVAL_API_KEY`
- **Added**: `RAPIDAPI_NOISE_CANCELLER_KEY` (the RapidAPI API key)
- **Added**: `RAPIDAPI_HOST` (constant: `"noise-canceller.p.rapidapi.com"`)

### API Integration Details
- **Endpoint**: `https://noise-canceller.p.rapidapi.com/api/noiseCanceller`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `X-RapidAPI-Key: <your-api-key>`
  - `X-RapidAPI-Host: noise-canceller.p.rapidapi.com`
- **Request Body**:
  ```json
  {
    "url": "<audio-url>"
  }
  ```

### Error Handling
1. **4xx Errors (Client Errors)**: 
   - Job marked as `failed`
   - Error returned immediately
   - No fallback to worker
   - Example: Invalid API key, missing required fields

2. **5xx Errors (Server Errors)**:
   - Job status reset to `queued`
   - Error logged
   - Automatic fallback to audio worker (if configured)

3. **Network Exceptions**:
   - Error logged
   - Automatic fallback to audio worker (if configured)

### Response Handling
The function handles multiple possible response field names from RapidAPI:
- `outputUrl`
- `output_url`
- `url`
- `downloadUrl`
- `download_url`

If no output URL is found in the response, an error is thrown and the job is marked as failed.

## Setup Instructions

### Step 1: Add Secret to Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Enter the following:
   - **Name**: `RAPIDAPI_NOISE_CANCELLER_KEY`
   - **Value**: `346fb865edmsh7acbc48b4c9d99bp15e88ejsnbee8261858f3`
5. Click **Save**

### Step 2: Deploy Edge Function

The edge function code has already been updated. You need to deploy it:

```bash
# Using Supabase CLI
supabase functions deploy noise-removal

# Or if using Lovable/automatic deployment
# The function will be automatically deployed on next push
```

### Step 3: Verify Configuration

Test the noise removal function by calling it with a valid audio URL:

```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/noise-removal \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/audio.mp3"
  }'
```

Expected response (success):
```json
{
  "success": true,
  "job_id": "<uuid>",
  "output_url": "<processed-audio-url>",
  "noise_reduction_applied": true
}
```

## Fallback Behavior

The function uses the following priority order:

1. **RapidAPI** (if `RAPIDAPI_NOISE_CANCELLER_KEY` is configured)
   - Primary processor
   - Returns immediately on success
   - Falls back to worker on server errors (5xx) or network exceptions

2. **Audio Worker** (if `AUDIO_WORKER_URL` and `AUDIO_WORKER_API_KEY` are configured)
   - Secondary processor
   - Used when RapidAPI is unavailable or returns server errors
   - Jobs dispatched via callback mechanism

3. **Manual Processing** (if neither is configured)
   - Job remains in `queued` status
   - Requires manual intervention

## Job Tracking

All noise removal jobs are tracked in the `creative_soul_jobs` table:

- **Status**: `queued` → `processing` → `completed` / `failed`
- **Progress**: 0 → 100 (percentage)
- **Result URL**: Stored in `result_url` field when completed
- **Error Messages**: Stored in `error_message` field when failed

## API Key Security

⚠️ **Important**: The API key is stored as a Supabase secret and is only accessible within Edge Functions. Never expose it in client-side code or commit it to version control.

## Troubleshooting

### RapidAPI Returns 401 (Unauthorized)
- Verify `RAPIDAPI_NOISE_CANCELLER_KEY` is correctly set in Supabase secrets
- Check that the API key hasn't expired
- Verify the API key is active in your RapidAPI dashboard

### RapidAPI Returns 400 (Bad Request)
- Ensure the `audioUrl` in the request is a valid, publicly accessible URL
- Check that the audio format is supported by RapidAPI
- Verify the request body format is correct

### RapidAPI Returns 5xx (Server Error)
- The function will automatically fall back to the audio worker
- Check RapidAPI service status
- Retry the request after a delay

### No Output URL in Response
- Check RapidAPI response format
- Verify the audio file was processed successfully
- Check Edge Function logs for detailed error messages

## Files Modified

- `supabase/functions/noise-removal/index.ts` - Updated to use RapidAPI integration

## Related Documentation

- [RapidAPI Noise Canceller API Documentation](https://rapidapi.com/api-specs/api/noise-canceller)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Audio Processing Services Architecture](../docs/AUDIO_PROCESSING_SERVICES.md)

