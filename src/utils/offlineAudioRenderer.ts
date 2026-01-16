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
  atmosphereAudioUrl?: string;
  solfeggio?: { enabled: boolean; hz: number; volume: number };
  binaural?: { enabled: boolean; carrierHz: number; beatHz: number; volume: number };
  dsp: DSPSettings;
  masterVolume: number;
  onProgress?: (percent: number, step: string) => void;
}

interface AudioLayer {
  buffer: AudioBuffer;
  volume: number;
}

/**
 * Renders meditation audio offline at CPU speed (not real-time)
 * A 5-minute track renders in ~5-10 seconds
 */
export async function renderOffline(config: OfflineRenderConfig): Promise<AudioBuffer> {
  const {
    durationSeconds,
    sampleRate = 44100,
    neuralAudioUrl,
    atmosphereAudioUrl,
    solfeggio,
    binaural,
    dsp,
    masterVolume,
    onProgress
  } = config;

  const totalFrames = Math.ceil(durationSeconds * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
  
  onProgress?.(5, 'Initializing render engine...');

  // Master gain node
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(offlineCtx.destination);

  // DSP chain
  const dspOutput = await createDSPChain(offlineCtx, dsp, masterGain);
  
  onProgress?.(15, 'Loading audio sources...');

  // Load and schedule audio layers
  const layers: AudioLayer[] = [];
  
  if (neuralAudioUrl) {
    try {
      const buffer = await fetchAndDecode(offlineCtx, neuralAudioUrl);
      layers.push({ buffer, volume: 0.8 });
      onProgress?.(25, 'Neural source loaded...');
    } catch (e) {
      console.warn('Failed to load neural audio:', e);
    }
  }
  
  if (atmosphereAudioUrl) {
    try {
      const buffer = await fetchAndDecode(offlineCtx, atmosphereAudioUrl);
      layers.push({ buffer, volume: 0.5 });
      onProgress?.(35, 'Atmosphere loaded...');
    } catch (e) {
      console.warn('Failed to load atmosphere:', e);
    }
  }

  onProgress?.(40, 'Scheduling audio layers...');

  // Schedule all audio layers with looping
  for (const layer of layers) {
    scheduleLoopingBuffer(offlineCtx, layer.buffer, layer.volume, durationSeconds, dspOutput);
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
function scheduleLoopingBuffer(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  volume: number,
  durationSeconds: number,
  destination: AudioNode
): void {
  const bufferDuration = buffer.duration;
  let currentTime = 0;
  
  while (currentTime < durationSeconds) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    
    // Fade in/out for smooth loops
    const fadeTime = Math.min(0.5, bufferDuration * 0.1);
    const playDuration = Math.min(bufferDuration, durationSeconds - currentTime);
    
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + fadeTime);
    gainNode.gain.setValueAtTime(volume, currentTime + playDuration - fadeTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + playDuration);
    
    source.connect(gainNode);
    gainNode.connect(destination);
    
    source.start(currentTime);
    source.stop(currentTime + playDuration);
    
    currentTime += bufferDuration - fadeTime; // Overlap for crossfade
  }
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
