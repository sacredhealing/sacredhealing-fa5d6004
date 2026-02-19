

## Fix: Restore Full Audio Chain and Harden Initialization

### Problem

Two issues are causing the "no sound" failure:

1. **Critical `initialize()` bug**: If ANY line inside the try block (lines 185-392) throws an error, the `catch` block runs but `finally` still sets `isInitialized = true` AND `audioContextRef.current` is already set. This means:
   - The gain nodes (solfeggio, binaural, atmosphere, neural) are NEVER created
   - All subsequent calls to `initialize()` return early at line 183 (`if (audioContextRef.current) return`)
   - `startSolfeggio` and `startBinaural` silently exit because gain refs are null
   - This is a permanent failure — the engine can never recover without a page reload

2. **Audio processing chain removed**: The last edit simplified the neural source connection from the full processing chain (mono balancer, noise cleanup, EQ, noise gate) to a direct connection. While this shouldn't break sound, restoring the full chain ensures consistency with the working version from 10 days ago.

### Fix 1 — Make `initialize()` recoverable (most critical)

In `src/hooks/useSoulMeditateEngine.ts`, modify the `initialize` function so that if it fails mid-way, the AudioContext is cleaned up and `isInitialized` remains `false`, allowing a retry:

```text
Before (broken):
  try {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    // ... 200 lines of node creation ...
  } catch (e) {
    console.error(e);
  } finally {
    setIsInitialized(true);  // <-- BUG: always sets true even on failure
  }

After (fixed):
  try {
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    // ... 200 lines of node creation ...
    setIsInitialized(true);  // only set on success
  } catch (e) {
    console.error('SoulMeditateEngine initialize error:', e);
    // Clean up so retry is possible
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    // Do NOT set isInitialized = true
  }
```

### Fix 2 — Restore full neural source audio chain

Restore the processing chain in `loadNeuralSource` that was removed in the last diff. This restores the mono balancer, noise cleanup, low-cut filter, 3-band EQ, and noise gate chain that was confirmed working:

```text
source -> monoSplitter -> monoMerger -> noiseHighPass -> noiseLowPass ->
noiseCompressor -> lowCutFilter -> eqWeight -> eqPresence -> eqAir ->
userNoiseGate -> neuralGain
```

With the direct-connection fallback if any node is null.

### Fix 3 — Add AudioContext resume in `initialize()` itself

After creating all nodes, explicitly resume the AudioContext at the end of `initialize()` so oscillators can produce sound immediately:

```ts
// At end of initialize, before setIsInitialized:
if (ctx.state === 'suspended') {
  await ctx.resume();
}
```

### Files to Modify

| File | Change |
|---|---|
| `src/hooks/useSoulMeditateEngine.ts` | Move `setIsInitialized(true)` from `finally` into `try` block (end); add cleanup in `catch`; restore full audio chain in `loadNeuralSource`; add `ctx.resume()` at end of initialize |

### Technical Details

- `initialize()` — lines 182-399: restructure try/catch/finally
- `loadNeuralSource()` — lines 470-473: restore the full chain with if-guard and fallback
- No other files need changes

