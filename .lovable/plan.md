
## Root Cause: Three Separate "No Sound" Issues

### Issue 1: Healing Fundamental (Hz) — No Sound on Click
**What's broken:** Clicking a frequency card in `HealingFrequencySelector` calls `onSelect` → `setHealingFreq` (state only). There is a `useEffect` that would restart the oscillator when `healingFreq` changes, but it checks `engine.frequencies.solfeggio.enabled` first — which is `false` until "Begin Session" is clicked. So the oscillator is **never started by clicking a frequency card**. The frequency only works after "Begin Session" has been pressed first.

**Where it is:** `src/pages/CreativeSoulMeditationTool.tsx` lines 361–366:
```tsx
useEffect(() => {
  if (engine.frequencies.solfeggio.enabled && engine.frequencies.solfeggio.hz !== healingFreq) {
    engine.stopSolfeggio();
    engine.startSolfeggio(healingFreq); // ← only fires if already enabled
  }
}, [healingFreq, engine]);
```

### Issue 2: Neural Brainwave Target — No Sound on Click
**Same exact problem.** Lines 368–373. `startBinaural` is only called if `engine.frequencies.binaural.enabled` is already `true`.

### Issue 3: Neural Source — No Sound on Play Button
**What's broken:** `engine.toggleNeuralPlay()` pauses/plays `neuralAudioRef.current`, but if the AudioContext is `suspended` (browser autoplay policy — it starts suspended until a user gesture triggers `resume()`), the audio element connected to the AudioContext produces no output. The play button does not call `audioContextRef.current.resume()` before playing.

In `useSoulMeditateEngine.ts` line 727–737:
```tsx
const toggleNeuralPlay = useCallback(() => {
  if (!neuralAudioRef.current) return;
  if (neuralLayer.isPlaying) {
    neuralAudioRef.current.pause();
  } else {
    audioContextRef.current?.resume(); // ← this IS called, BUT...
    neuralAudioRef.current.play().catch(console.error);
  }
```
Actually `toggleNeuralPlay` does call `resume()`. The issue here is different: the engine is not initialized when the user first loads a file and hits play. The `loadNeuralSource` auto-initializes if needed (line 433), but if that auto-initialization hasn't completed yet when `toggleNeuralPlay` is called, the audio context may still be `suspended`.

**The real problem for Neural Source sound**: The engine requires explicit "Initialize" + "Begin Session" to produce sound. But users expect to just drop a file and hit play.

---

### The Fix: Make Frequencies Self-Activating

The correct fix is to change `onSelect` in `HealingFrequencySelector` and `BrainwaveSelector` to **trigger audio immediately** — not just update UI state.

#### Fix in `src/pages/CreativeSoulMeditationTool.tsx`

**1. `handleHealingFreqSelect` — new handler that starts audio:**
```tsx
const handleHealingFreqSelect = useCallback(async (freq: number) => {
  setHealingFreq(freq);
  
  // Initialize engine if needed (browser requires user gesture)
  if (!engine.isInitialized) {
    await engine.initialize();
  }
  
  // Resume context (browser autoplay policy)
  const audioCtx = engine.getAudioContext();
  if (audioCtx?.state === 'suspended') {
    await audioCtx.resume();
  }
  
  // Stop old and start new frequency immediately
  engine.stopSolfeggio();
  await engine.startSolfeggio(freq);
}, [engine]);
```

**2. `handleBrainwaveFreqSelect` — new handler that starts audio:**
```tsx
const handleBrainwaveFreqSelect = useCallback(async (freq: number) => {
  setBrainwaveFreq(freq);
  
  if (!engine.isInitialized) {
    await engine.initialize();
  }
  
  const audioCtx = engine.getAudioContext();
  if (audioCtx?.state === 'suspended') {
    await audioCtx.resume();
  }
  
  engine.stopBinaural();
  await engine.startBinaural(200, freq);
}, [engine]);
```

**3. Pass new handlers to components:**
```tsx
<HealingFrequencySelector 
  activeFrequency={healingFreq} 
  volume={healingVolume}
  onSelect={handleHealingFreqSelect}  // ← was: setHealingFreq
  onVolumeChange={handleHealingVolumeChange}
/>
<BrainwaveSelector 
  activeFrequency={brainwaveFreq} 
  volume={brainwaveVolume}
  onSelect={handleBrainwaveFreqSelect}  // ← was: setBrainwaveFreq
  onVolumeChange={handleBrainwaveVolumeChange}
/>
```

**4. Fix `handleHealingVolumeChange` and `handleBrainwaveVolumeChange` — they should also initialize if needed:**
```tsx
const handleHealingVolumeChange = useCallback(async (vol: number) => {
  if (!engine.isInitialized) {
    await engine.initialize();
  }
  const audioCtx = engine.getAudioContext();
  if (audioCtx?.state === 'suspended') await audioCtx.resume();
  engine.updateSolfeggioVolume(vol);
  // If not already playing, start the oscillator
  if (!engine.frequencies.solfeggio.enabled) {
    await engine.startSolfeggio(healingFreq);
  }
}, [engine, healingFreq]);
```

Similarly for `handleBrainwaveVolumeChange`.

**5. Fix Neural Source play — also ensure AudioContext is resumed:**
The `toggleNeuralPlay` in the engine already calls `audioContextRef.current?.resume()`, but it's async and not awaited. We need to patch the engine's `toggleNeuralPlay` to await the resume before calling `play()`.

In `src/hooks/useSoulMeditateEngine.ts` lines 727–737, change `toggleNeuralPlay` to:
```tsx
const toggleNeuralPlay = useCallback(async () => {
  if (!neuralAudioRef.current) return;
  
  if (neuralLayer.isPlaying) {
    neuralAudioRef.current.pause();
  } else {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    await neuralAudioRef.current.play().catch(console.error);
  }
  setNeuralLayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
}, [neuralLayer.isPlaying]);
```

**6. Remove the now-redundant `useEffect` guards** that check `engine.frequencies.*.enabled` before restarting (lines 361–373). Since the new handlers manage start/stop directly, these effects should be removed to avoid double-starts.

---

### Files to Modify

| File | Change |
|---|---|
| `src/pages/CreativeSoulMeditationTool.tsx` | Add `handleHealingFreqSelect` + `handleBrainwaveFreqSelect` handlers; update `HealingFrequencySelector` + `BrainwaveSelector` props; also fix `handleHealingVolumeChange` / `handleBrainwaveVolumeChange` to auto-initialize |
| `src/hooks/useSoulMeditateEngine.ts` | Make `toggleNeuralPlay` async and `await` the AudioContext resume before calling `play()` |
