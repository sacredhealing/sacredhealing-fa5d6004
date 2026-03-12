/**
 * Offline Audio Renderer - "Ghost Engine"
 * Renders full meditation audio in seconds using OfflineAudioContext
 */

// III. Quantum Calibration is 3dB lower than II. Meditation Style & Neural Source
const QUANTUM_CALIBRATION_LINEAR = Math.pow(10, -3 / 20); // ≈ 0.708

export interface DSPSettings {
  reverb: number;
  delay: number;
  warmth: number;
  compression?: number;
}

export interface NoiseGateSettings {
  enabled: boolean;
  threshold: number;   // dB (-80 to -10)
  range: number;       // dB reduction when closed (-96 to -6)
}

export interface EQSettings {
  weight: number;      // dB gain at 400Hz
  presence: number;    // dB gain at 4kHz
  air: number;         // dB gain at 10kHz+
  lowCutEnabled: boolean;
  deEsserEnabled: boolean;
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
  noiseGate?: NoiseGateSettings;
  eq?: EQSettings;
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
// To prevent Chrome renderer OOM ("Aw, Snap! error code 5"), we cap total frames.
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
    noiseGate,
    eq,
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

  // Clamp master volume (allow higher ceiling to match louder live engine)
  const safeVolume = Math.min(masterVolume, 0.95);

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
    scheduleLoopingBuffer(offlineCtx, layer.buffer, layer.volume, durationSeconds, dspOutput, layer.isNeuralSource ?? false, noiseGate, eq);
  }

  onProgress?.(50, 'Generating healing frequencies...');

  // Solfeggio frequency (3dB lower than II. Meditation Style)
  if (solfeggio?.enabled && solfeggio.hz > 0) {
    createSolfeggioOscillator(offlineCtx, solfeggio.hz, solfeggio.volume * QUANTUM_CALIBRATION_LINEAR, durationSeconds, dspOutput);
  }

  onProgress?.(60, 'Generating binaural beats...');

  // Binaural beats (3dB lower than II. Meditation Style)
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
 * Uses a single looping buffer source to reduce memory pressure
 * Includes dynamics processing to match live preview chain
 */
function scheduleLoopingBuffer(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  volume: number,
  durationSeconds: number,
  destination: AudioNode,
  isNeuralSource: boolean = false,
  noiseGate?: NoiseGateSettings,
  eq?: EQSettings
): void {
  // Higher volume ceiling to match louder live engine
  const safeVolume = Math.min(volume, 0.95);
  
  // Create dynamics chain for neural source (matches live engine)
  let outputNode: AudioNode = destination;
  
  if (isNeuralSource) {
    // STEREO-TO-MONO BALANCER: Fixes unbalanced phone recordings (louder left/right channel)
    const monoSplitter = ctx.createChannelSplitter(2);
    const monoMerger = ctx.createChannelMerger(2);
    const monoMixGainL = ctx.createGain();
    const monoMixGainR = ctx.createGain();
    monoMixGainL.gain.value = 0.5;
    monoMixGainR.gain.value = 0.5;

    monoSplitter.connect(monoMixGainL, 0);
    monoSplitter.connect(monoMixGainR, 1);
    monoMixGainL.connect(monoMerger, 0, 0);
    monoMixGainL.connect(monoMerger, 0, 1);
    monoMixGainR.connect(monoMerger, 0, 0);
    monoMixGainR.connect(monoMerger, 0, 1);

    console.log('[OfflineRender] Stereo-to-Mono Balancer applied to neural source');

    // --- Neural cleanup chain ---

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

    // Low-cut around 100Hz (matches live low-cut filter) — use user setting
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = (eq?.lowCutEnabled !== false) ? 100 : 10; // bypass if disabled
    lowCut.Q.value = 0.7;

    // 3‑band EQ — use live engine values when available
    const eqWeight = ctx.createBiquadFilter();
    eqWeight.type = 'peaking';
    eqWeight.frequency.value = 400;
    eqWeight.Q.value = 1.5;
    eqWeight.gain.value = eq?.weight ?? -0.5;

    const eqPresence = ctx.createBiquadFilter();
    eqPresence.type = 'peaking';
    eqPresence.frequency.value = 4000;
    eqPresence.Q.value = 1.2;
    eqPresence.gain.value = eq?.presence ?? 3;

    const eqAir = ctx.createBiquadFilter();
    eqAir.type = 'highshelf';
    eqAir.frequency.value = 10000;
    eqAir.gain.value = eq?.air ?? 1;

    // De‑Esser: gentle cut around 7.2kHz
    const deEsser = ctx.createBiquadFilter();
    deEsser.type = 'peaking';
    deEsser.frequency.value = 7200;
    deEsser.Q.value = 2.5;
    deEsser.gain.value = (eq?.deEsserEnabled !== false) ? -4 : 0; // bypass if disabled

    // Compressor similar to live engine
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Noise Gate simulation via expander-style compressor
    // OfflineAudioContext doesn't support AudioWorklet reliably, so we simulate
    // the gate effect using a very high-ratio compressor with the user's threshold
    let gateNode: AudioNode;
    if (noiseGate?.enabled) {
      const gate = ctx.createDynamicsCompressor();
      // Use high ratio + user threshold to simulate gate behavior
      gate.threshold.value = noiseGate.threshold; // user's gate threshold (e.g. -40dB)
      gate.knee.value = 3;                         // narrow knee for sharp gate action
      gate.ratio.value = 20;                       // very high ratio acts like a gate
      gate.attack.value = 0.005;                   // 5ms attack
      gate.release.value = 0.05;                   // 50ms release (matches live 'purity' feel)
      gateNode = gate;
      console.log(`[OfflineRender] Noise gate ON: threshold ${noiseGate.threshold}dB, range ${noiseGate.range}dB`);
    } else {
      const bypass = ctx.createGain();
      bypass.gain.value = 1;
      gateNode = bypass;
    }

    // Soft-knee limiter for final voicing stage
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 6;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    // Chain:
    // monoMerger -> highPass -> lowPass -> lowCut -> EQ -> deEsser -> gate -> compressor -> limiter -> destination
    monoMerger.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(lowCut);
    lowCut.connect(eqWeight);
    eqWeight.connect(eqPresence);
    eqPresence.connect(eqAir);
    eqAir.connect(deEsser);
    deEsser.connect(gateNode);
    gateNode.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(destination);

    // Output to mono splitter (start of chain)
    outputNode = monoSplitter;

    console.log('[OfflineRender] Neural chain: MONO -> HP/LP/LowCut -> EQ -> De‑Esser -> Gate -> Compressor -> Limiter -> DSP');
  }
  
  // Use a SINGLE looping buffer source
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
  const targetVol = volume * 0.4; // Slightly louder blend than before (was 0.3)
  gain.gain.value = targetVol;
  
  // Envelope
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(targetVol, 2);
  gain.gain.setValueAtTime(targetVol, durationSeconds - 3);
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
  
  const leftOsc = ctx.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = leftFreq;
  
  const rightOsc = ctx.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = rightFreq;
  
  const leftPan = ctx.createStereoPanner();
  leftPan.pan.value = -1;
  
  const rightPan = ctx.createStereoPanner();
  rightPan.pan.value = 1;
  
  const targetVol = volume * 0.25; // Slightly louder (was 0.2)
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  leftGain.gain.value = targetVol;
  rightGain.gain.value = targetVol;
  
  // Envelope
  const fadeIn = 3;
  const fadeOut = 5;
  
  leftGain.gain.setValueAtTime(0, 0);
  leftGain.gain.linearRampToValueAtTime(targetVol, fadeIn);
  leftGain.gain.setValueAtTime(targetVol, durationSeconds - fadeOut);
  leftGain.gain.linearRampToValueAtTime(0, durationSeconds);
  
  rightGain.gain.setValueAtTime(0, 0);
  rightGain.gain.linearRampToValueAtTime(targetVol, fadeIn);
  rightGain.gain.setValueAtTime(targetVol, durationSeconds - fadeOut);
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
  const warmthAmount = Math.max(0, Math.min(1, dsp.warmth));
  warmthFilter.gain.value = warmthAmount * 10;
  
  // Simple convolution-style reverb using a feedback delay network
  const dryGain = ctx.createGain();
  const reverbAmount = Math.max(0, Math.min(1, dsp.reverb));
  dryGain.gain.value = 1 - reverbAmount * 0.5; // Less dry-cut so audio stays present
  
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.3 + reverbAmount * 0.9; // Stronger wet for audible Sacred Reverb
  
  // Create delay-based reverb approximation
  const delayNode = ctx.createDelay(1);
  const delayControl = Math.max(0, Math.min(1, dsp.delay));
  delayNode.delayTime.value = 0.02 + delayControl * 0.28;
  
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.25 + reverbAmount * 0.55;
  
  const reverbFilter = ctx.createBiquadFilter();
  reverbFilter.type = 'lowpass';
  reverbFilter.frequency.value = 3500; // Slightly brighter reverb tail
  
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
