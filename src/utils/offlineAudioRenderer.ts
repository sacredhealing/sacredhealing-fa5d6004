/**
 * Offline Audio Renderer - "Ghost Engine"
 * Renders full meditation audio in seconds using OfflineAudioContext
 */

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
  // Neural source processing options
  deEsserAmount?: number;        // 0-100% de-esser intensity
  noiseGateThreshold?: number;   // -80 to -20 dB threshold
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
    deEsserAmount = 0,
    noiseGateThreshold = -60,
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

  // Clamp master volume to prevent clipping (max 0.85 for headroom)
  const safeVolume = Math.min(masterVolume, 0.85);

  // Create master limiter BEFORE master gain to catch peaks
  const masterLimiter = offlineCtx.createDynamicsCompressor();
  masterLimiter.threshold.value = -3;  // -3 dB threshold (catches peaks before clipping)
  masterLimiter.knee.value = 6;        // Soft knee
  masterLimiter.ratio.value = 20;      // Brick-wall limiting
  masterLimiter.attack.value = 0.001;  // 1ms attack
  masterLimiter.release.value = 0.1;   // 100ms release
  masterLimiter.connect(offlineCtx.destination);

  // Master gain node - connects to limiter, not destination
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = safeVolume;
  masterGain.connect(masterLimiter);

  // DSP chain
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

  // Schedule all audio layers with looping
  for (const layer of layers) {
    scheduleLoopingBuffer(
      offlineCtx, 
      layer.buffer, 
      layer.volume, 
      durationSeconds, 
      dspOutput, 
      layer.isNeuralSource ?? false,
      deEsserAmount,
      noiseGateThreshold
    );
  }

  onProgress?.(50, 'Generating healing frequencies...');

  // Solfeggio frequency
  if (solfeggio?.enabled && solfeggio.hz > 0) {
    createSolfeggioOscillator(offlineCtx, solfeggio.hz, solfeggio.volume, durationSeconds, dspOutput);
  }

  onProgress?.(60, 'Generating binaural beats...');

  // Binaural beats (stereo oscillators)
  if (binaural?.enabled && binaural.beatHz > 0) {
    createBinauralBeats(offlineCtx, binaural.carrierHz, binaural.beatHz, binaural.volume, durationSeconds, dspOutput);
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
  isNeuralSource: boolean = false,
  deEsserAmount: number = 0,
  noiseGateThreshold: number = -60
): void {
  // Clamp volume to prevent distortion (leave headroom for mixing)
  const safeVolume = Math.min(volume, 0.85);
  
  // Create dynamics chain for neural source (matches live engine)
  let outputNode: AudioNode = destination;
  
  if (isNeuralSource) {
    // Gentle limiter only - no aggressive compressor. De-esser and noise gate caused chaos
    // (pumping, artifacts) on uploaded meditation/vocal audio.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;  // -3 dB threshold for headroom
    limiter.knee.value = 6;        // 6 dB soft knee
    limiter.ratio.value = 20;      // High ratio for limiting
    limiter.attack.value = 0.001;  // 1ms attack
    limiter.release.value = 0.1;   // 100ms release
    
    limiter.connect(destination);
    outputNode = limiter;
    
    console.log('[OfflineRender] Neural source: gentle limiter only (no compressor/de-esser/noise gate)');
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
 * Create DSP effects chain (reverb, warmth)
 */
async function createDSPChain(
  ctx: OfflineAudioContext,
  dsp: DSPSettings,
  destination: AudioNode
): Promise<AudioNode> {
  // Warmth (low-pass filter with resonance)
  const warmthFilter = ctx.createBiquadFilter();
  warmthFilter.type = 'lowshelf';
  warmthFilter.frequency.value = 500;
  warmthFilter.gain.value = dsp.warmth * 6; // 0-6 dB boost
  
  // Simple convolution reverb using delay network
  const dryGain = ctx.createGain();
  dryGain.gain.value = 1 - dsp.reverb * 0.5;
  
  const wetGain = ctx.createGain();
  wetGain.gain.value = dsp.reverb * 0.5;
  
  // Create delay-based reverb approximation
  const delayNode = ctx.createDelay(1);
  delayNode.delayTime.value = 0.05 + dsp.delay * 0.3;
  
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.3 + dsp.reverb * 0.4;
  
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
