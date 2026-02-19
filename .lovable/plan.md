

## Fix: Add Audio Diagnostic Test Tone and Improve Debugging

### Current Status

After thorough code review and browser testing, the audio chain is correctly wired:
- `solfeggioGain` and `binauralGain` connect to `mixerGain`
- `mixerGain` connects to `waveshaper` then `limiter` then `masterGain` then `destination`
- The oscillator starts with correct frequency and gain (confirmed in browser test logs)
- AudioContext state is "running"

Yet the user reports no sound. This means either:
1. An audio node in the processing chain is silently eating the signal
2. The waveshaper or limiter is behaving unexpectedly
3. A browser autoplay policy is blocking output despite "running" state

### Plan

#### 1. Add a direct "Test Tone" bypass in `CreativeSoulMeditationTool.tsx`

Add a diagnostic button that creates a pure sine tone connected DIRECTLY to `ctx.destination`, bypassing the entire DSP chain. If this plays sound, the problem is in the processing chain. If this doesn't play sound, the problem is in the user's browser/device.

```text
Test Tone button:
  1. Gets AudioContext from engine (or creates new one)
  2. Resumes context
  3. Creates 440 Hz sine oscillator
  4. Connects directly to ctx.destination (bypasses mixer, waveshaper, limiter, master)
  5. Sets gain to 0.3
  6. Plays for 2 seconds
  7. Logs full diagnostic info (context state, sample rate, destination channels)
```

#### 2. Add signal path verification logging in `startSolfeggio`

After starting the oscillator, log the entire chain status:
- AudioContext state and sample rate
- Oscillator frequency value
- solfeggioGain value and number of connected outputs
- mixerGain value
- waveshaper curve length
- limiter threshold/ratio
- masterGain value
- Whether destination has inputs connected

#### 3. Add a direct oscillator-to-destination fallback

If the test tone works but the main chain doesn't, add a secondary direct path: `solfeggioGain` also connects directly to `masterGain` (bypassing waveshaper/limiter). This ensures sound reaches the user even if the waveshaper node has an issue.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/CreativeSoulMeditationTool.tsx` | Add Test Tone diagnostic button in the header area (near Initialize/Engine Active) |
| `src/hooks/useSoulMeditateEngine.ts` | Add `playTestTone()` method that bypasses all processing; add chain verification logging in `startSolfeggio` and `startBinaural` |

### Technical Details

**Test Tone implementation** (in `useSoulMeditateEngine.ts`):
```ts
const playTestTone = useCallback(async () => {
  let ctx = audioContextRef.current;
  if (!ctx) {
    ctx = new AudioContext();
    // Don't store — this is a throwaway test
  }
  if (ctx.state === 'suspended') await ctx.resume();
  
  console.log('[TEST TONE] Context state:', ctx.state, 'sampleRate:', ctx.sampleRate);
  console.log('[TEST TONE] Destination:', ctx.destination.numberOfInputs, 'inputs,', ctx.destination.channelCount, 'channels');
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 440;
  gain.gain.value = 0.3;
  osc.connect(gain);
  gain.connect(ctx.destination); // DIRECT — no mixer, no waveshaper, no limiter
  osc.start();
  osc.stop(ctx.currentTime + 2);
  console.log('[TEST TONE] Playing 440 Hz for 2 seconds — DIRECT to destination');
}, []);
```

**Chain verification** (added to end of `startSolfeggio`):
```ts
// Diagnostic chain verification
console.log('[Solfeggio] Chain check:',
  'mixer:', mixerGainRef.current?.gain.value,
  'waveshaper:', waveShaperRef.current?.curve?.length,
  'limiter:', limiterRef.current?.threshold.value,
  'master:', masterGainRef.current?.gain.value,
  'ctx.destination channels:', audioContextRef.current.destination.channelCount
);
```

**Button in UI** (in `CreativeSoulMeditationTool.tsx`, near the Engine Active badge):
```tsx
<Button size="sm" variant="outline" onClick={engine.playTestTone}>
  Test Tone
</Button>
```

This will be a small button, visible only when the engine is initialized. It plays a 2-second 440 Hz beep directly to the speakers. If the user hears this, we know their audio output works and the issue is specifically in the DSP chain.

