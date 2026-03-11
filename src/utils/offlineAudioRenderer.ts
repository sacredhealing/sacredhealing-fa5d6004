/**
 * Offline Audio Renderer - "Ghost Engine"
 * Renders full meditation audio in seconds using OfflineAudioContext
 */

// III. Quantum Calibration is 5dB lower than II. Meditation Style & Neural Source
const QUANTUM_CALIBRATION_LINEAR = Math.pow(10, -5 / 20); // ≈ 0.562

export interface DSPSettings {
  reverb: number;
  delay: number;
  warmth: number;
  compression?: number;
}

export interface OfflineRenderConfig {
  durationSeconds: number;
  sampleRate?: number;
  neuralAudioUrl?: string;
  neuralSourceVolume?: number;
  atmosphereAudioUrl?: string;
  atmosphereVolume?: number;
  solfeggio?: { enabled: boolean; hz: number; volume: number };
  binaural?: { enabled: boolean; carrierHz: number; beatHz: number; volume: number };
  dsp: DSPSettings;
  masterVolume: number;
  onProgress?: (percent: number, step: string) => void;
}

interface AudioLayer {
  buffer: AudioBuffer;
  volume: number;
  isNeuralSource?: boolean;
}

/**
 * Renders meditation audio offline at CPU speed (not real-time)
 * A 5-minute track renders in ~5-10 seconds
 */
// OfflineAudioContext allocates the full render buffer up-front.
// To prevent Chrome renderer OOM (“Aw, Snap! error code 5”), we cap total frames.
// 20,000,000 frames @ 44.1kHz ≈ 7.5 min, @ 22.05kHz ≈ 15.1 min.
const MAX_RENDER_FRAMES = 20_000_000;

export async function renderOffline(config: OfflineRenderConfig): Promise<AudioBuffer> {
  const {
    durationSeconds: rawDuration,
    sampleRate = 44100,
    neuralAudioUrl,
    neuralSourceVolume = 1.0,
    atmosphereAudioUrl,
    atmosphereVolume = 0.85,
    solfeggio,
    binaural,
    dsp,
    masterVolume,
    onProgress
  } = config;

  // Clamp duration to prevent memory exhaustion (Error code 5)
  const maxSeconds = Math.max(1, Math.floor(MAX_RENDER_FRAMES / sampleRate));
  const durationSeconds = Math.min(rawDuration, maxSeconds);
  if (rawDuration > maxSeconds) {
    console.warn(
      `[OfflineRender] Duration clamped from ${rawDuration}s to ${maxSeconds}s (sampleRate=${sampleRate}) to prevent memory issues`
    );
  }

  const totalFrames = Math.ceil(durationSeconds * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
  
  onProgress?.(5, 'Initializing render engine...');

  // Clamp master volume to prevent clipping (match live engine headroom: <= 0.9)
  const safeVolume = Math.min(masterVolume, 0.9);

  // Create master limiter (mirror live engine limiter settings as closely as possible)
  const masterLimiter = offlineCtx.createDynamicsCompressor();
  masterLimiter.threshold.value = -6;  // -6 dB threshold (same as live engine)
  masterLimiter.knee.value = 10;       // Soft knee width
  masterLimiter.ratio.value = 20;      // High ratio for limiting
  masterLimiter.attack.value = 0.001;  // 1ms attack
  masterLimiter.release.value = 0.05;  // 50ms release (faster recovery)
  masterLimiter.connect(offlineCtx.destination);

  // Master gain node - connects to limiter, not destination (same order as live engine master stage)
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = safeVolume;
  masterGain.connect(masterLimiter);

  // DSP chain (Sacred Effects) — mirrors live engine voicing but slightly stronger in export
  const dspOutput = await createDSPChain(offlineCtx, dsp, masterGain);
  
  onProgress?.(15, 'Loading audio sources...');

  // Load and schedule audio layers
  const layers: AudioLayer[] = [];
  
  if (neuralAudioUrl) {
    try {
      const buffer = await fetchAndDecode(offlineCtx, neuralAudioUrl);
      layers.push({ buffer, volume: neuralSourceVolume, isNeuralSource: true });
      console.log('[OfflineRender] Neural source volume:', neuralSourceVolume);
      onProgress?.(25, 'Neural source loaded...');
    } catch (e) {
      console.warn('Failed to load neural audio:', e);
    }
  }
  
  if (atmosphereAudioUrl) {
    try {
      const buffer = await fetchAndDecode(offlineCtx, atmosphereAudioUrl);
      layers.push({ buffer, volume: atmosphereVolume });
      console.log('[OfflineRender] Atmosphere volume:', atmosphereVolume);
      onProgress?.(35, 'Atmosphere loaded...');
    } catch (e) {
      console.warn('Failed to load atmosphere:', e);
    }
  }

  onProgress?.(40, 'Scheduling audio layers...');

  // Schedule all audio layers with looping (neural + atmosphere hit the same DSP chain)
  for (const layer of layers) {
    scheduleLoopingBuffer(offlineCtx, layer.buffer, layer.volume, durationSeconds, dspOutput, layer.isNeuralSource ?? false);
  }

  onProgress?.(50, 'Generating healing frequencies...');

  // Solfeggio frequency (5dB lower than II. Meditation Style)
  if (solfeggio?.enabled && solfeggio.hz > 0) {
    createSolfeggioOscillator(offlineCtx, solfeggio.hz, solfeggio.volume * QUANTUM_CALIBRATION_LINEAR, durationSeconds, dspOutput);
  }

  onProgress?.(60, 'Generating binaural beats...');

  // Binaural beats (5dB lower than II. Meditation Style)
  if (binaural?.enabled && binaural.beatHz > 0) {
    createBinauralBeats(offlineCtx, binaural.carrierHz, binaural.beatHz, binaural.volume * QUANTUM_CALIBRATION_LINEAR, durationSeconds, dspOutput);
  }

  onProgress?.(70, 'Rendering audio (this may take a moment)...');

  // Render the audio
  const renderedBuffer = await offlineCtx.startRendering();
  
  onProgress?.(95, 'Render complete!');

  return renderedBuffer;
}

/**
 * Fetch audio file and decode to AudioBuffer
 */
async function fetchAndDecode(ctx: OfflineAudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

/**
 * Schedule a buffer to play with looping to fill the duration
 */
/**
 * Schedule a buffer to play with looping to fill the duration
 * Uses a single looping buffer source to reduce memory pressure
 * Includes dynamics processing to match live preview chain
 */
function scheduleLoopingBuffer(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  volume: number,
  durationSeconds: number,
  destination: AudioNode,
  isNeuralSource: boolean = false
): void {
  // Clamp volume to prevent distortion (leave headroom for mixing)
  const safeVolume = Math.min(volume, 0.85);
  
  // Create dynamics chain for neural source (matches live engine)
  let outputNode: AudioNode = destination;
  
  if (isNeuralSource) {
    // STEREO-TO-MONO BALANCER: Fixes unbalanced phone recordings (louder left/right channel)
    // Splits stereo into L and R, mixes to mono (balanced), outputs to both channels
    const monoSplitter = ctx.createChannelSplitter(2);
    const monoMerger = ctx.createChannelMerger(2);
    const monoMixGainL = ctx.createGain();
    const monoMixGainR = ctx.createGain();
    monoMixGainL.gain.value = 0.5; // Mix L+R at 50% each to prevent clipping
    monoMixGainR.gain.value = 0.5;

    // Connect: splitter -> both channels sum through gains -> merger (mono to both L and R)
    monoSplitter.connect(monoMixGainL, 0); // Left channel to mix gain L
    monoSplitter.connect(monoMixGainR, 1); // Right channel to mix gain R
    monoMixGainL.connect(monoMerger, 0, 0); // Left mix -> output L
    monoMixGainL.connect(monoMerger, 0, 1); // Left mix -> output R
    monoMixGainR.connect(monoMerger, 0, 0); // Right mix -> output L
    monoMixGainR.connect(monoMerger, 0, 1); // Right mix -> output R

    console.log('[OfflineRender] Stereo-to-Mono Balancer applied to neural source');

    // --- Neural cleanup chain to mirror live engine (high-pass, low-pass, EQ, de-esser, compressor, limiter) ---

    // High-pass: remove low-frequency rumble (≈80Hz)
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    highPass.Q.value = 0.7;

    // Low-pass: remove harsh hiss above ~12kHz
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 12000;
    lowPass.Q.value = 0.7;

    // Additional low-cut around 100Hz (matches live low-cut filter)
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = 100;
    lowCut.Q.value = 0.7;

    // 3‑band EQ defaults (match live defaults: weight -0.5dB, presence +3dB, air +1dB)
    const eqWeight = ctx.createBiquadFilter();
    eqWeight.type = 'peaking';
    eqWeight.frequency.value = 400;
    eqWeight.Q.value = 1.5;
    eqWeight.gain.value = -0.5;

    const eqPresence = ctx.createBiquadFilter();
    eqPresence.type = 'peaking';
    eqPresence.frequency.value = 4000;
    eqPresence.Q.value = 1.2;
    eqPresence.gain.value = 3;

    const eqAir = ctx.createBiquadFilter();
    eqAir.type = 'highshelf';
    eqAir.frequency.value = 10000;
    eqAir.gain.value = 1;

    // De‑Esser: gentle cut around 7.2kHz to tame sibilance
    const deEsser = ctx.createBiquadFilter();
    deEsser.type = 'peaking';
    deEsser.frequency.value = 7200;
    deEsser.Q.value = 2.5;
    deEsser.gain.value = -4;

    // Compressor similar to live engine
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18; // More conservative threshold
    compressor.knee.value = 12;       // Wider knee for smoother compression
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Soft-knee limiter for final voicing stage
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;  // -3 dB threshold for headroom
    limiter.knee.value = 6;        // 6 dB soft knee
    limiter.ratio.value = 20;      // High ratio for limiting
    limiter.attack.value = 0.001;  // 1ms attack
    limiter.release.value = 0.1;   // 100ms release

    // Chain:
    // monoMerger -> highPass -> lowPass -> lowCut -> EQ (weight/presence/air) -> deEsser -> compressor -> limiter -> destination
    monoMerger.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(lowCut);
    lowCut.connect(eqWeight);
    eqWeight.connect(eqPresence);
    eqPresence.connect(eqAir);
    eqAir.connect(deEsser);
    deEsser.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(destination);

    // Output to mono splitter (start of chain)
    outputNode = monoSplitter;

    console.log('[OfflineRender] Neural chain: MONO BALANCER -> HP/LP/LowCut -> 3‑band EQ -> De‑Esser -> Compressor -> Limiter -> destination');
  }
  
  // Use a SINGLE looping buffer source instead of creating many to reduce memory
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;
  
  const gainNode = ctx.createGain();
  
  // Fade in at start
  const fadeTime = Math.min(2, durationSeconds * 0.05);
  gainNode.gain.setValueAtTime(0, 0);
  gainNode.gain.linearRampToValueAtTime(safeVolume, fadeTime);
  
  // Hold at volume
  gainNode.gain.setValueAtTime(safeVolume, durationSeconds - fadeTime);
  
  // Fade out at end
  gainNode.gain.linearRampToValueAtTime(0, durationSeconds);
  
  source.connect(gainNode);
  gainNode.connect(outputNode);
  
  source.start(0);
  source.stop(durationSeconds);
  
  console.log(`[OfflineRender] Scheduled ${buffer.duration}s buffer to loop for ${durationSeconds}s (volume: ${safeVolume})`);
}

/**
 * Create solfeggio healing frequency oscillator
 */
function createSolfeggioOscillator(
  ctx: OfflineAudioContext,
  hz: number,
  volume: number,
  durationSeconds: number,
  destination: AudioNode
): void {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = hz;
  
  const gain = ctx.createGain();
  gain.gain.value = volume * 0.3; // Subtle blend
  
  // Envelope
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(volume * 0.3, 2);
  gain.gain.setValueAtTime(volume * 0.3, durationSeconds - 3);
  gain.gain.linearRampToValueAtTime(0, durationSeconds);
  
  osc.connect(gain);
  gain.connect(destination);
  
  osc.start(0);
  osc.stop(durationSeconds);
}

/**
 * Create binaural beats (left and right channel at different frequencies)
 */
function createBinauralBeats(
  ctx: OfflineAudioContext,
  carrierHz: number,
  beatHz: number,
  volume: number,
  durationSeconds: number,
  destination: AudioNode
): void {
  const leftFreq = carrierHz - beatHz / 2;
  const rightFreq = carrierHz + beatHz / 2;
  
  // Left channel oscillator
  const leftOsc = ctx.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = leftFreq;
  
  // Right channel oscillator
  const rightOsc = ctx.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = rightFreq;
  
  // Stereo panning
  const leftPan = ctx.createStereoPanner();
  leftPan.pan.value = -1;
  
  const rightPan = ctx.createStereoPanner();
  rightPan.pan.value = 1;
  
  // Gain nodes
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  leftGain.gain.value = volume * 0.2;
  rightGain.gain.value = volume * 0.2;
  
  // Envelope
  const fadeIn = 3;
  const fadeOut = 5;
  
  leftGain.gain.setValueAtTime(0, 0);
  leftGain.gain.linearRampToValueAtTime(volume * 0.2, fadeIn);
  leftGain.gain.setValueAtTime(volume * 0.2, durationSeconds - fadeOut);
  leftGain.gain.linearRampToValueAtTime(0, durationSeconds);
  
  rightGain.gain.setValueAtTime(0, 0);
  rightGain.gain.linearRampToValueAtTime(volume * 0.2, fadeIn);
  rightGain.gain.setValueAtTime(volume * 0.2, durationSeconds - fadeOut);
  rightGain.gain.linearRampToValueAtTime(0, durationSeconds);
  
  // Connect
  leftOsc.connect(leftGain);
  leftGain.connect(leftPan);
  leftPan.connect(destination);
  
  rightOsc.connect(rightGain);
  rightGain.connect(rightPan);
  rightPan.connect(destination);
  
  leftOsc.start(0);
  rightOsc.start(0);
  leftOsc.stop(durationSeconds);
  rightOsc.stop(durationSeconds);
}

/**
 * Create DSP effects chain (reverb, warmth) for offline export
 */
async function createDSPChain(
  ctx: OfflineAudioContext,
  dsp: DSPSettings,
  destination: AudioNode
): Promise<AudioNode> {
  // Warmth (lowshelf tilt EQ) — slightly stronger in export so voice feels as rich as live engine
  const warmthFilter = ctx.createBiquadFilter();
  warmthFilter.type = 'lowshelf';
  warmthFilter.frequency.value = 500;
  // Map 0–1 warmth → ~0–10 dB boost
  const warmthAmount = Math.max(0, Math.min(1, dsp.warmth));
  warmthFilter.gain.value = warmthAmount * 10;
  
  // Simple convolution-style reverb using a feedback delay network
  // We intentionally make export reverb slightly wetter so it matches the in-app Sacred Effects perceived level
  const dryGain = ctx.createGain();
  const reverbAmount = Math.max(0, Math.min(1, dsp.reverb));
  // Reduce dry as reverb increases, but never fully dry-cut so intelligibility stays
  dryGain.gain.value = 1 - reverbAmount * 0.7;
  
  const wetGain = ctx.createGain();
  // Give exported mixes a clearly audible space: baseline + scale with reverbAmount
  wetGain.gain.value = 0.25 + reverbAmount * 0.85;
  
  // Create delay-based reverb approximation
  const delayNode = ctx.createDelay(1);
  // Export: slightly longer tail than live, but still in plate-style range
  const delayControl = Math.max(0, Math.min(1, dsp.delay));
  delayNode.delayTime.value = 0.02 + delayControl * 0.28;
  
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.2 + reverbAmount * 0.6;
  
  const reverbFilter = ctx.createBiquadFilter();
  reverbFilter.type = 'lowpass';
  reverbFilter.frequency.value = 3000;
  
  // Connect reverb network
  warmthFilter.connect(dryGain);
  warmthFilter.connect(delayNode);
  delayNode.connect(reverbFilter);
  reverbFilter.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  reverbFilter.connect(wetGain);
  
  dryGain.connect(destination);
  wetGain.connect(destination);
  
  return warmthFilter;
}
