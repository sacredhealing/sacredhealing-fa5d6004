# Fix SQI Quantum Apothecary message cutoff

## Root cause
In `supabase/functions/quantum-apothecary-chat/index.ts` (line 674), the main streaming Gemini call is configured with:

```
generationConfig: { temperature: 0.78, topK: 45, topP: 0.95, maxOutputTokens: 1200 }
```

Gemini 2.5 Flash hits that 1200-token ceiling and stops mid-sentence — exactly the "cut off" behavior you're seeing. This is independent of your AI credit balance (top-up doesn't help here, the cap is hardcoded).

It worked "a few days ago" because the prompt + system context was shorter then; recent additions to the system prompt (canonical library, biofield, active field, life book, living portrait) push the model to need more output room, so the 1200 limit now bites every time.

## Plan

1. **Raise the output cap** in `supabase/functions/quantum-apothecary-chat/index.ts` line 674:
   - `maxOutputTokens: 1200` → `maxOutputTokens: 4096`
   (Gemini 2.5 Flash supports up to 8192; 4096 is plenty of headroom for SQI transmissions while keeping cost reasonable.)

2. **Redeploy the edge function** so the change takes effect immediately (`quantum-apothecary-chat`).

3. **No other changes** — frontend, scan path, life-book persistence, and the direct-Gemini fallback in `geminiAlchemistChat.ts` (already at 2048) are untouched.

## Verification
- Send a chat message in SQI Quantum Apothecary that previously cut off
- Confirm full response streams to completion
- Check edge function logs for any errors

No database, RLS, or secrets changes needed.
