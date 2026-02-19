
## Audio Fix: Sound Not Playing for Healing Hz, Brainwave Target & Neural Source

### What the Browser Confirms

After testing in the live preview, the browser console reveals the exact failure for Binaural (and the same pattern applies to Solfeggio):

```
[Binaural] Starting binaural beats: 200 Hz carrier, 4 Hz beat, volume: 0.5 -> 0.281...
[Binaural] Audio context state: running
[Binaural] Gain node value: 0
```

The AudioContext IS running. The oscillators ARE started. But **the gain is 0** at the moment it is read back. This means the gain set at line 837 is not sticking — it is being overridden or ignored.

### Root Cause (3 bugs)

**Bug 1 & 2 — Binaural & Solfeggio gain stuck at 0**

In `initialize()` (lines 306-310):
```ts
solfeggioGainRef.current = ctx.createGain();
solfeggioGainRef.current.gain.value = 0;  // starts at 0

binauralGainRef.current = ctx.createGain();
binauralGainRef.current.gain.value = 0;   // starts at 0
```

In `startBinaural` (line 836-837):
```ts
binauralGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
binauralGainRef.current.gain.setValueAtTime(targetVolume, ctx.currentTime);
```

Then at line 860:
```ts
binauralMergerRef.current.connect(binauralGainRef.current);
```

The problem: `cancelScheduledValues` + `setValueAtTime` should work, but **there is already a scheduled value at time 0 from initialization**. The `cancelScheduledValues` call cancels automation up to `ctx.currentTime`, but if `ctx.currentTime` is very small (e.g., 0.001), the initial value set during `initialize()` may survive. The fix is to use `gain.value = targetVolume` (direct assignment) which bypasses the automation timeline entirely, followed by `setValueAtTime` for safety.

Additionally, `stopBinaural()` uses `setTargetAtTime(0, ...)` with a 500ms timeout before actually stopping the oscillators — but it also **leaves the gain at 0** with a scheduled ramp. If `startBinaural` is called quickly after `stopBinaural`, the ramp-to-0 automation is still in the timeline and overrides the new `setValueAtTime`.

**Bug 3 — `stopBinaural`/`stopSolfeggio` leave gain automation in place**

```ts
// stopBinaural (line 876-885):
binauralGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.3);
setTimeout(() => {
  binauralLeftOscRef.current?.stop();  // stops after 500ms
  ...
}, 500);
```

When `handleBrainwaveFreqSelect` calls `engine.stopBinaural()` then immediately `await engine.startBinaural(...)`, the gain still has the `setTargetAtTime(0)` automation running. The `cancelScheduledValues` in `startBinaural` should cancel it — but only if `ctx.currentTime` is past the scheduled start. Since both happen near-simultaneously, the cancel doesn't catch the ramp.

**The complete fix**: In both `startSolfeggio` and `startBinaural`, replace `cancelScheduledValues` + `setValueAtTime` with a direct `gain.value = targetVolume` assignment first, then call `setValueAtTime`. Also add a small `await` delay (10ms) between `stop` and `start` calls in the handlers to let the previous oscillators fully terminate.

**Bug 4 — Neural Source no sound on first play**

The `toggleNeuralPlay` fix from the previous edit is correct (async + await resume). But there's also a Supabase URL in the diff that was changed to a wrong URL (`tdiqrngivbrwkhwcejvv` instead of `ssygukfdbtehvtndandn`). This was reverted but needs confirming. Looking at line 600, it correctly shows `ssygukfdbtehvtndandn` — so that's fine.

### Files to Modify

**`src/hooks/useSoulMeditateEngine.ts`** — 3 targeted fixes:

1. **`startSolfeggio` (line ~785-788)**: Replace `cancelScheduledValues` + `setValueAtTime` with direct `gain.value` assignment:
```ts
// BEFORE:
solfeggioGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
solfeggioGainRef.current.gain.setValueAtTime(targetVolume, audioContextRef.current.currentTime);

// AFTER:
solfeggioGainRef.current.gain.cancelScheduledValues(0);
solfeggioGainRef.current.gain.value = targetVolume;  // direct assignment bypasses automation
```

2. **`startBinaural` (line ~835-837)**: Same fix:
```ts
// BEFORE:
binauralGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
binauralGainRef.current.gain.setValueAtTime(targetVolume, ctx.currentTime);

// AFTER:
binauralGainRef.current.gain.cancelScheduledValues(0);
binauralGainRef.current.gain.value = targetVolume;  // direct assignment
```

3. **`stopSolfeggio` and `stopBinaural`**: When stopping, also cancel all scheduled values before ramping to 0, so pending automations don't leak into the next `start` call:
```ts
// In stopSolfeggio:
solfeggioGainRef.current.gain.cancelScheduledValues(0);
solfeggioGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.3);

// In stopBinaural:
binauralGainRef.current.gain.cancelScheduledValues(0);
binauralGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.3);
```

**`src/pages/CreativeSoulMeditationTool.tsx`** — add a small delay between stop and start:

In `handleHealingFreqSelect`:
```ts
engine.stopSolfeggio();
await new Promise(r => setTimeout(r, 50)); // let old oscillator die
await engine.startSolfeggio(freq);
```

In `handleBrainwaveFreqSelect`:
```ts
engine.stopBinaural();
await new Promise(r => setTimeout(r, 50)); // let old oscillator die
await engine.startBinaural(200, freq);
```

### Summary

| Fix | File | Lines |
|-----|------|-------|
| `cancelScheduledValues(0)` + `gain.value =` in `startSolfeggio` | `useSoulMeditateEngine.ts` | ~785 |
| `cancelScheduledValues(0)` + `gain.value =` in `startBinaural` | `useSoulMeditateEngine.ts` | ~835 |
| `cancelScheduledValues(0)` before ramp in `stopSolfeggio` | `useSoulMeditateEngine.ts` | ~799 |
| `cancelScheduledValues(0)` before ramp in `stopBinaural` | `useSoulMeditateEngine.ts` | ~876 |
| 50ms delay between stop and start in freq select handlers | `CreativeSoulMeditationTool.tsx` | ~374, ~384 |
