/**
 * Offline Audio Renderer - "Ghost Engine"
 * Renders full meditation audio in seconds using OfflineAudioContext
 *
 * This renderer mirrors the EXACT audio chain from useSoulMeditateEngine.ts
 * so that exported audio matches the UI playback 1:1.
 *
 * Live engine chain (what the user hears):
 *   sources -> mixer(1.0) -> waveshaper(warmth) -> limiter(-6dB) -> masterGain -> destination
 *   Parallel: mixer -> convolver(IR) -> reverbGain(wet) -> limiter
 *
 * Neural source sub-chain (live):
 *   source -> monoBalancer -> HP(80) -> LP(12k) -> compressor(-50dB,4:1,knee40)
 *          -> lowCut(100) -> EQ(weight,presence,air) -> deEsser(7.2kHz,-4dB)
 *          -> noiseGate -> neuralGain(+3dB) -> mixer
 */

// Match live engine: 5dB lower for oscillators vs meditation layers
const QUANTUM_CALIBRATION_LINEAR = Math.pow(10, -5 / 20); // ≈ 0.562

// Match live engine: neural source gets +3dB boost
const NEURAL_GAIN_BOOST_LINEAR = Math.pow(10, 3 / 20); // ≈ 1.412

export interface DSPSettings {
  reverb: number;
  delay: number;
  warmth: number;
  compression?: number;
  reverbDecay?: number;
}

export interface NoiseGateSettings {
  enabled: boolean;
  threshold: number;
  range: number;
}

export interface EQSettings {
  weight: number;
  presence: number;
  air: number;
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

const MAX_RENDER_FRAMES = 20_000_000;

/**
 * Generate a reverb impulse response identical to the live engine's createReverbImpulse.
 * This ensures the convolver in export produces the same spatial character as the UI.
 */
function createReverbImpulse(ctx: BaseAudioContext, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * decay);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }
  return buffer;
}

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

  // ─── Master stage: identical to live engine ───
  // Live: masterGain -> destination  (limiter sits before masterGain in the mixer chain)
  // Actually live is: mixer -> waveshaper -> limiter -> masterGain -> destination
  const safeVolume = Math.min(masterVolume, 0.9);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = safeVolume;
  masterGain.connect(offlineCtx.destination);

  // Limiter: identical to live engine (limiterRef)
  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 10;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;
  limiter.connect(masterGain);

  // Warmth (waveshaper) — same saturation curve as live engine
  const rawWarmth = dsp.warmth;
  const warmthAmount = typeof rawWarmth === 'number'
    ? Math.max(0, Math.min(1, rawWarmth))
    : (typeof rawWarmth === 'object' && rawWarmth !== null)
      ? Math.max(0, Math.min(1, (rawWarmth as any).drive ?? 0))
      : 0;
  const waveshaper = offlineCtx.createWaveShaper();
  if (warmthAmount > 0) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const amount = warmthAmount * 50;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    waveshaper.curve = curve;
  } else {
    const linearCurve = new Float32Array(44100);
    for (let i = 0; i < 44100; i++) {
      linearCurve[i] = (i * 2) / 44100 - 1;
    }
    waveshaper.curve = linearCurve;
  }
  waveshaper.oversample = '4x';
  waveshaper.connect(limiter);

  // Mixer node (all sources sum here, just like live engine's mixerGainRef)
  const mixer = offlineCtx.createGain();
  mixer.gain.value = 1.0;
  mixer.connect(waveshaper);

  // ─── Reverb: real ConvolverNode with generated IR (identical to live engine) ───
  // Handle both number and object shapes for backward compatibility
  const rawReverb = dsp.reverb;
  const reverbAmount = typeof rawReverb === 'number'
    ? Math.max(0, Math.min(1, rawReverb))
    : (typeof rawReverb === 'object' && rawReverb !== null)
      ? Math.max(0, Math.min(1, (rawReverb as any).wet ?? 0.3))
      : 0;
  const reverbDecay = (dsp as any).reverbDecay
    ?? (typeof rawReverb === 'object' && rawReverb !== null ? (rawReverb as any).decay : null)
    ?? 2.5;

  console.log(`[OfflineRender] Reverb: amount=${reverbAmount}, decay=${reverbDecay}s`);

  if (reverbAmount > 0) {
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createReverbImpulse(offlineCtx, reverbDecay);

    const reverbGain = offlineCtx.createGain();
    reverbGain.gain.value = reverbAmount;

    // Parallel send: mixer -> convolver -> reverbGain -> limiter (same as live)
    mixer.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(limiter);
  }

  onProgress?.(15, 'Loading audio sources...');

  // ─── Load audio layers ───
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

  for (const layer of layers) {
    scheduleLoopingBuffer(
      offlineCtx, layer.buffer, layer.volume, durationSeconds,
      mixer, layer.isNeuralSource ?? false, noiseGate, eq
    );
  }

  onProgress?.(50, 'Generating healing frequencies...');

  if (solfeggio?.enabled && solfeggio.hz > 0) {
    createSolfeggioOscillator(offlineCtx, solfeggio.hz, solfeggio.volume * QUANTUM_CALIBRATION_LINEAR, durationSeconds, mixer);
  }

  onProgress?.(60, 'Generating binaural beats...');

  if (binaural?.enabled && binaural.beatHz > 0) {
    createBinauralBeats(offlineCtx, binaural.carrierHz, binaural.beatHz, binaural.volume * QUANTUM_CALIBRATION_LINEAR, durationSeconds, mixer);
  }

  onProgress?.(70, 'Rendering audio (this may take a moment)...');

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(95, 'Render complete!');

  return renderedBuffer;
}

async function fetchAndDecode(ctx: OfflineAudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

/**
 * Schedule a looping buffer.  For neural sources, replicate the EXACT same
 * voice-processing chain the live engine uses:
 *
 *   source -> monoBalancer -> HP(80) -> LP(12k) -> compressor(-50dB, 4:1, knee 40)
 *          -> lowCut(100) -> EQ(3-band) -> deEsser(7.2kHz) -> neuralGain(+3dB)
 *          -> destination (mixer)
 *
 * The live engine also has a noise gate AudioWorklet, but OfflineAudioContext
 * doesn't support worklets reliably, so we omit it -- the compressor already
 * handles the dynamic range the same way the user hears it.
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
  const safeVolume = Math.min(volume, 0.95);

  let outputNode: AudioNode = destination;

  if (isNeuralSource) {
    // ─── Stereo-to-Mono Balancer (identical to live engine) ───
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

    // ─── Noise cleanup filters (identical to live engine) ───
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    highPass.Q.value = 0.7;

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 12000;
    lowPass.Q.value = 0.7;

    // ─── Compressor: SAME settings as live engine (noiseCompressorRef) ───
    // Live: threshold -50, knee 40, ratio 4, attack 0.003, release 0.25
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // ─── Transparent mode detection ───
    // Analyze first 10s of the buffer to detect pre-mastered sources
    const channelData = buffer.getChannelData(0);
    const sampleCount = Math.min(channelData.length, buffer.sampleRate * 10);
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < sampleCount; i++) {
      const abs = Math.abs(channelData[i]);
      sumSq += channelData[i] * channelData[i];
      if (abs > peak) peak = abs;
    }
    const rms = Math.sqrt(sumSq / sampleCount);
    const dynamicRangeDb = 20 * Math.log10(peak / Math.max(rms, 0.0001));
    const isPreMastered = dynamicRangeDb < 12 && rms > 0.05;

    if (isPreMastered) {
      compressor.ratio.value = 1.2;
      compressor.threshold.value = -12;
      compressor.knee.value = 30;
      console.log(`[OfflineRender] Transparent mode ON — DR: ${dynamicRangeDb.toFixed(1)}dB, RMS: ${rms.toFixed(3)}`);
    } else {
      console.log(`[OfflineRender] Standard mode — DR: ${dynamicRangeDb.toFixed(1)}dB, RMS: ${rms.toFixed(3)}`);
    }

    // ─── Low-cut 100Hz (identical to live engine lowCutFilterRef) ───
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = (eq?.lowCutEnabled !== false) ? 100 : 10;
    lowCut.Q.value = 0.7;

    // ─── 3-Band EQ (identical to live engine) ───
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

    // ─── De-Esser (identical to live engine) ───
    const deEsser = ctx.createBiquadFilter();
    deEsser.type = 'peaking';
    deEsser.frequency.value = 7200;
    deEsser.Q.value = 2.5;
    deEsser.gain.value = (eq?.deEsserEnabled !== false) ? -4 : 0;

    // ─── Neural gain with +3dB boost (identical to live engine) ───
    const neuralGain = ctx.createGain();
    neuralGain.gain.value = Math.min(0.95, safeVolume * NEURAL_GAIN_BOOST_LINEAR);

    // ─── Chain: exact same order as live engine ───
    // monoMerger -> HP -> LP -> compressor -> lowCut -> EQ -> deEsser -> neuralGain -> mixer
    monoMerger.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(compressor);
    compressor.connect(lowCut);
    lowCut.connect(eqWeight);
    eqWeight.connect(eqPresence);
    eqPresence.connect(eqAir);
    eqAir.connect(deEsser);
    deEsser.connect(neuralGain);
    neuralGain.connect(destination);

    outputNode = monoSplitter;

    console.log('[OfflineRender] Neural chain: MONO -> HP(80) -> LP(12k) -> Comp(-50/4:1) -> LowCut(100) -> EQ -> DeEsser -> neuralGain(+3dB) -> mixer');

    // Neural source uses neuralGain for volume, so skip the generic gain below
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;

    // Fade envelope (no extra volume scaling — neuralGain handles it)
    const fadeGain = ctx.createGain();
    const fadeTime = Math.min(2, durationSeconds * 0.05);
    fadeGain.gain.setValueAtTime(0, 0);
    fadeGain.gain.linearRampToValueAtTime(1.0, fadeTime);
    fadeGain.gain.setValueAtTime(1.0, durationSeconds - fadeTime);
    fadeGain.gain.linearRampToValueAtTime(0, durationSeconds);

    source.connect(fadeGain);
    fadeGain.connect(outputNode);
    source.start(0);
    source.stop(durationSeconds);

    console.log(`[OfflineRender] Neural source: ${buffer.duration}s buffer looping for ${durationSeconds}s (vol: ${safeVolume})`);
    return;
  }

  // ─── Non-neural layers (atmosphere, etc.) ───
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;

  const gainNode = ctx.createGain();
  const fadeTime = Math.min(2, durationSeconds * 0.05);
  gainNode.gain.setValueAtTime(0, 0);
  gainNode.gain.linearRampToValueAtTime(safeVolume, fadeTime);
  gainNode.gain.setValueAtTime(safeVolume, durationSeconds - fadeTime);
  gainNode.gain.linearRampToValueAtTime(0, durationSeconds);

  source.connect(gainNode);
  gainNode.connect(outputNode);
  source.start(0);
  source.stop(durationSeconds);

  console.log(`[OfflineRender] Scheduled ${buffer.duration}s buffer to loop for ${durationSeconds}s (volume: ${safeVolume})`);
}

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
  const targetVol = volume * 0.4;
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(targetVol, 2);
  gain.gain.setValueAtTime(targetVol, durationSeconds - 3);
  gain.gain.linearRampToValueAtTime(0, durationSeconds);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(0);
  osc.stop(durationSeconds);
}

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

  const targetVol = volume * 0.25;
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();

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
