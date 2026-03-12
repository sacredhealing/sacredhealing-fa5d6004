import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Types
export interface LayerExportInput {
  /** URL the backend worker can fetch (preferred when available) */
  directUrl?: string;
  /** Storage path (optional) for backend-side signing/lookup */
  uploadPath?: string;
  /** Friendly label for UI */
  displayName?: string;
}

export interface LayerState {
  isPlaying: boolean;
  volume: number;
  /** UI/engine identifier (may be a URL or filename) */
  source: string | null;
  /** Backend-safe source info for exports */
  exportInput?: LayerExportInput;
}

export interface DSPSettings {
  reverb: { enabled: boolean; decay: number; wet: number };
  delay: { enabled: boolean; time: number; feedback: number; wet: number };
  warmth?: { enabled: boolean; drive: number; tone: number };
}

export interface FrequencyState {
  solfeggio: { enabled: boolean; hz: number };
  binaural: { enabled: boolean; carrierHz: number; beatHz: number };
}

export interface AnalyserData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
}

const SOLFEGGIO_FREQUENCIES = [
  { hz: 174, label: '174 Hz – Foundation', color: '#ef4444' },
  { hz: 285, label: '285 Hz – Quantum Cognition', color: '#f97316' },
  { hz: 396, label: '396 Hz – Liberation', color: '#eab308' },
  { hz: 417, label: '417 Hz – Transmutation', color: '#22c55e' },
  { hz: 432, label: '432 Hz – Cosmic Harmony', color: '#14b8a6' },
  { hz: 528, label: '528 Hz – DNA Restore', color: '#06b6d4' },
  { hz: 639, label: '639 Hz – Heart Coherence', color: '#3b82f6' },
  { hz: 741, label: '741 Hz – Awakening', color: '#6366f1' },
  { hz: 852, label: '852 Hz – Third Eye', color: '#8b5cf6' },
  { hz: 963, label: '963 Hz – Crown Activation', color: '#a855f7' },
];

// III. Quantum Calibration is 5dB lower than II. Meditation Style & Neural Source
const QUANTUM_CALIBRATION_LINEAR = Math.pow(10, -3 / 20); // ≈ 0.708 (was -5dB, now -3dB for louder oscillators)
// Oscillator gain: 0.85–0.95 range for audible Hz/Binaural without clipping
const OSCILLATOR_BASE_GAIN = 0.9;
const OSCILLATOR_GAIN_MAX = 0.95;
// Neural source +4dB to match oscillators in the same DSP rack
const NEURAL_GAIN_BOOST_LINEAR = Math.pow(10, 4 / 20); // ≈ 1.585

const BINAURAL_PRESETS = [
  { beatHz: 0.5, label: 'Epsilon (0.5 Hz) – Transcendence' },
  { beatHz: 2, label: 'Delta (2 Hz) – Deep Healing Sleep' },
  { beatHz: 4, label: 'Theta (4 Hz) – Meditation' },
  { beatHz: 6, label: 'Theta (6 Hz) – Creativity' },
  { beatHz: 10, label: 'Alpha (10 Hz) – Relaxed Focus' },
  { beatHz: 14, label: 'Beta (14 Hz) – Active Thinking' },
  { beatHz: 40, label: 'Gamma (40 Hz) – Peak Cognition' },
];

const ATMOSPHERE_LIBRARY = [
  { id: 'vedic', label: 'Vedic Temple', icon: '🕉️', description: 'Tanpura drones & temple bells' },
  { id: 'shamanic', label: 'Shamanic Journey', icon: '🪘', description: 'Frame drums & rattles' },
  { id: 'tibetan', label: 'Tibetan Monastery', icon: '🔔', description: 'Singing bowls & chants' },
  { id: 'ocean', label: 'Ocean Depths', icon: '🌊', description: 'Deep waves & whale songs' },
  { id: 'forest', label: 'Ancient Forest', icon: '🌲', description: 'Birds & rustling leaves' },
  { id: 'cosmic', label: 'Cosmic Void', icon: '🌌', description: 'Space drones & stellar winds' },
  { id: 'crystal', label: 'Crystal Cave', icon: '💎', description: 'Crystal bowls & resonance' },
  { id: 'zen', label: 'Zen Garden', icon: '🎋', description: 'Wind chimes & flowing water' },
];

/** Universal file reader: File or URL → ArrayBuffer for decodeAudioData (MP3, M4A, WAV, FLAC, etc.) */
async function readFileAsArrayBuffer(file: File | string, fileUrl: string, isUrl: boolean): Promise<ArrayBuffer> {
  if (isUrl) {
    const response = await fetch(fileUrl);
    return response.arrayBuffer();
  }
  return (file as File).arrayBuffer();
}

export function useSoulMeditateEngine() {
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mixerGainRef = useRef<GainNode | null>(null);
  
  // Layer nodes
  const neuralSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const neuralAudioRef = useRef<HTMLAudioElement | null>(null);
  const neuralGainRef = useRef<GainNode | null>(null);
  /** BufferSource for neural playback (one-shot: create new node each Play) */
  const neuralBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  /** Gain compensation (1.2) between BufferSource and neuralGain for low-volume fix */
  const neuralBufferGainRef = useRef<GainNode | null>(null);
  
  // Noise cleanup chain for neural source
  const noiseHighPassRef = useRef<BiquadFilterNode | null>(null);
  const noiseLowPassRef = useRef<BiquadFilterNode | null>(null);
  const noiseCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const noiseGateRef = useRef<GainNode | null>(null);
  
  // Stereo-to-mono balancer (fixes unbalanced phone recordings)
  const monoSplitterRef = useRef<ChannelSplitterNode | null>(null);
  const monoMergerRef = useRef<ChannelMergerNode | null>(null);
  const monoMixGainRef = useRef<GainNode | null>(null);
  
  // 3-Band Parametric EQ for neural source (Weight, Presence, Air)
  const eqWeightRef = useRef<BiquadFilterNode | null>(null);     // 400Hz - Boxy control
  const eqPresenceRef = useRef<BiquadFilterNode | null>(null);   // 4kHz - Clarity
  const eqAirRef = useRef<BiquadFilterNode | null>(null);        // 10kHz+ - Sheen/Sibilance
  
  // Low cut filter (100Hz high-pass)
  const lowCutFilterRef = useRef<BiquadFilterNode | null>(null);

  // Soft-shelf de-esser at 7.2kHz (tames sibilance without dulling)
  const deEsserFilterRef = useRef<BiquadFilterNode | null>(null);
  const deEsserEnabled = useRef(true);

  // Transparent mode: auto-lower compression for pre-mastered sources
  const transparentModeRef = useRef(false);

  // User-controllable noise gate (AudioWorklet) - professional envelope-following gate
  const userNoiseGateRef = useRef<AudioNode | null>(null);
  
  const atmosphereSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const atmosphereAudioRef = useRef<HTMLAudioElement | null>(null);
  const atmosphereGainRef = useRef<GainNode | null>(null);
  
  // Oscillators for frequencies
  const solfeggioOscRef = useRef<OscillatorNode | null>(null);
  const solfeggioGainRef = useRef<GainNode | null>(null);
  const binauralLeftOscRef = useRef<OscillatorNode | null>(null);
  const binauralRightOscRef = useRef<OscillatorNode | null>(null);
  const binauralMergerRef = useRef<ChannelMergerNode | null>(null);
  const binauralGainRef = useRef<GainNode | null>(null);
  
  // DSP nodes
  const convolverRef = useRef<ConvolverNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const waveShaperRef = useRef<WaveShaperNode | null>(null);
  const warmthGainRef = useRef<GainNode | null>(null);
  
  // Soft-knee limiter for final stage
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  
  // DAW types
  interface AudioRegion {
    id: string;
    startTime: number;
    duration: number;
    sourceStart: number;
    sourceDuration: number;
    color: string;
    label?: string;
  }

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [neuralLayer, setNeuralLayer] = useState<LayerState>({ isPlaying: false, volume: 0.7, source: null });
  const [atmosphereLayer, setAtmosphereLayer] = useState<LayerState>({ isPlaying: false, volume: 0.85, source: null });
  const [frequencies, setFrequencies] = useState<FrequencyState>({
    solfeggio: { enabled: false, hz: 528 },
    binaural: { enabled: false, carrierHz: 200, beatHz: 6 },
  });
  const [solfeggioVolume, setSolfeggioVolume] = useState(0.5);
  const [binauralVolume, setBinauralVolume] = useState(0.5);
  const [dsp, setDSP] = useState<DSPSettings>({
    reverb: { enabled: true, decay: 2.5, wet: 0.3 },
    // Sacred Echo (delay) removed globally – keep structure but force fully bypassed
    delay: { enabled: false, time: 0.4, feedback: 0, wet: 0 },
    warmth: { enabled: false, drive: 0.3, tone: 0.5 },
  });
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [analyserData, setAnalyserData] = useState<AnalyserData | null>(null);
  
  // DAW state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [dawRegions, setDawRegions] = useState<AudioRegion[]>([]);
  const [dawCurrentTime, setDawCurrentTime] = useState(0);
  const dawPlaybackRef = useRef<{ source: AudioBufferSourceNode; startedAt: number; offset: number } | null>(null);
  
  // EQ state for UI sync
  const [eqSettings, setEqSettings] = useState({
    weight: -0.5,    // dB gain at 400Hz
    presence: 3,     // dB gain at 4kHz
    air: 1,          // dB gain at 10kHz+
    lowCutEnabled: true,
    noiseGateThreshold: -40,   // -80 to -20 dB
    noiseGateAttack: 5,        // ms, 1-50
    noiseGateRelease: 120,     // ms, 50-500
    noiseGateRange: -72,       // dB reduction when closed, -96 to -24
    noiseGateEnabled: true,
  });

  // Initialize audio context (once per session; re-calling does not reset volume)
  const initialize = useCallback(async () => {
    if (audioContextRef.current) {
      console.log('[Engine] AudioContext already exists, skip re-init (preserves volume)');
      return;
    }

    try {
    // Use hardware default sample rate (44100 or 48000) to prevent silent playback on high-end / 50+ hearing aids
    const CtxClass = typeof window !== 'undefined' && (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    const ctx = CtxClass ? new (CtxClass as typeof AudioContext)() : new AudioContext();
    audioContextRef.current = ctx;
    // Unlock context on same user gesture (2026 browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Analyser for visualization (2048 FFT)
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    // Create layer gains (neural +3dB default so it matches oscillators in DSP rack)
    neuralGainRef.current = ctx.createGain();
    neuralGainRef.current.gain.value = Math.min(0.95, neuralLayer.volume * NEURAL_GAIN_BOOST_LINEAR);

    // Create noise cleanup chain for neural source
    // High-pass filter: removes low-frequency rumble/hum (below 80Hz)
    noiseHighPassRef.current = ctx.createBiquadFilter();
    noiseHighPassRef.current.type = 'highpass';
    noiseHighPassRef.current.frequency.value = 80;
    noiseHighPassRef.current.Q.value = 0.7;

    // Low-pass filter: removes high-frequency hiss (above 12kHz)
    noiseLowPassRef.current = ctx.createBiquadFilter();
    noiseLowPassRef.current.type = 'lowpass';
    noiseLowPassRef.current.frequency.value = 12000;
    noiseLowPassRef.current.Q.value = 0.7;

    // Dynamics compressor: reduces dynamic range and acts as noise gate
    noiseCompressorRef.current = ctx.createDynamicsCompressor();
    noiseCompressorRef.current.threshold.value = -50; // Threshold in dB
    noiseCompressorRef.current.knee.value = 40; // Smooth knee
    noiseCompressorRef.current.ratio.value = 4; // Compression ratio
    noiseCompressorRef.current.attack.value = 0.003; // Fast attack
    noiseCompressorRef.current.release.value = 0.25; // Smooth release

    // Noise gate gain (for very quiet sections)
    noiseGateRef.current = ctx.createGain();
    noiseGateRef.current.gain.value = 1;
    
    // Stereo-to-Mono Balancer: Fixes unbalanced phone recordings (e.g. louder left channel)
    // Splits stereo into L and R, mixes to mono (balanced), outputs to both channels
    monoSplitterRef.current = ctx.createChannelSplitter(2);
    monoMergerRef.current = ctx.createChannelMerger(2);
    monoMixGainRef.current = ctx.createGain();
    monoMixGainRef.current.gain.value = 0.5; // Mix L+R at 50% each to prevent clipping
    
    // Create a second gain for the right channel mix
    const monoMixGainR = ctx.createGain();
    monoMixGainR.gain.value = 0.5;
    
    // Connect: splitter -> both channels sum through gains -> merger (mono to both L and R)
    // Left channel (0) -> mix gain -> merger input 0 and 1
    // Right channel (1) -> mix gain R -> merger input 0 and 1
    monoSplitterRef.current.connect(monoMixGainRef.current, 0); // Left to mix gain
    monoSplitterRef.current.connect(monoMixGainR, 1);            // Right to mix gain R
    monoMixGainRef.current.connect(monoMergerRef.current, 0, 0); // Left mix -> output L
    monoMixGainRef.current.connect(monoMergerRef.current, 0, 1); // Left mix -> output R
    monoMixGainR.connect(monoMergerRef.current, 0, 0);           // Right mix -> output L
    monoMixGainR.connect(monoMergerRef.current, 0, 1);           // Right mix -> output R
    console.log('Stereo-to-Mono Balancer initialized: auto-balances uneven phone recordings');
    
    // Create 100Hz low-cut filter
    lowCutFilterRef.current = ctx.createBiquadFilter();
    lowCutFilterRef.current.type = 'highpass';
    lowCutFilterRef.current.frequency.value = 100;
    lowCutFilterRef.current.Q.value = 0.7;
    
    // Create 3-Band Parametric EQ
    // Weight (400Hz) - Peaking filter for boxy control
    eqWeightRef.current = ctx.createBiquadFilter();
    eqWeightRef.current.type = 'peaking';
    eqWeightRef.current.frequency.value = 400;
    eqWeightRef.current.Q.value = 1.5;
    eqWeightRef.current.gain.value = eqSettings.weight;
    
    // Presence (4kHz) - Peaking filter for clarity
    eqPresenceRef.current = ctx.createBiquadFilter();
    eqPresenceRef.current.type = 'peaking';
    eqPresenceRef.current.frequency.value = 4000;
    eqPresenceRef.current.Q.value = 1.2;
    eqPresenceRef.current.gain.value = eqSettings.presence;
    
    // Air (10kHz+) - High shelf for sheen/sibilance
    eqAirRef.current = ctx.createBiquadFilter();
    eqAirRef.current.type = 'highshelf';
    eqAirRef.current.frequency.value = 10000;
    eqAirRef.current.gain.value = eqSettings.air;
    
    console.log('3-Band Parametric EQ initialized: Weight(400Hz), Presence(4kHz), Air(10kHz+)');

    // Soft-shelf De-Esser at 7.2kHz: reduces sibilance ("S" harshness) without muffling
    deEsserFilterRef.current = ctx.createBiquadFilter();
    deEsserFilterRef.current.type = 'peaking';
    deEsserFilterRef.current.frequency.value = 7200;
    deEsserFilterRef.current.Q.value = 2.5;      // Narrow Q targets sibilant range
    deEsserFilterRef.current.gain.value = -4;     // -4dB cut at 7.2kHz
    console.log('De-Esser initialized: -4dB peaking at 7.2kHz (Q=2.5)');

    // Professional noise gate (AudioWorklet) - envelope-following with attack/release
    try {
      await ctx.audioWorklet.addModule('/noiseGateProcessor.js');
      const gateNode = new AudioWorkletNode(ctx, 'noise-gate-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        parameterData: {
          threshold: eqSettings.noiseGateThreshold,
          attack: eqSettings.noiseGateAttack / 1000,
          release: eqSettings.noiseGateRelease / 1000,
          range: eqSettings.noiseGateRange,
          enabled: eqSettings.noiseGateEnabled ? 1 : 0,
        },
      });
      userNoiseGateRef.current = gateNode;
      console.log('Noise gate initialized: threshold', eqSettings.noiseGateThreshold, 'dB, attack', eqSettings.noiseGateAttack, 'ms, release', eqSettings.noiseGateRelease, 'ms');
    } catch (e) {
      console.error('Noise gate worklet failed, using bypass:', e);
      const bypassGain = ctx.createGain();
      bypassGain.gain.value = 1;
      userNoiseGateRef.current = bypassGain;
    }
    console.log('Noise gate initialization completed (worklet or bypass)');

    atmosphereGainRef.current = ctx.createGain();
    atmosphereGainRef.current.gain.value = atmosphereLayer.volume;

    solfeggioGainRef.current = ctx.createGain();
    solfeggioGainRef.current.gain.value = 0;

    binauralGainRef.current = ctx.createGain();
    binauralGainRef.current.gain.value = 0;

    // Create binaural merger (stereo separation)
    binauralMergerRef.current = ctx.createChannelMerger(2);

    // Create reverb (convolver with generated impulse)
    const convolver = ctx.createConvolver();
    convolver.buffer = await createReverbImpulse(ctx, dsp.reverb.decay);
    convolverRef.current = convolver;

    reverbGainRef.current = ctx.createGain();
    reverbGainRef.current.gain.value = dsp.reverb.wet;

    // Create delay (kept in graph but hard-bypassed so Sacred Echo is fully removed)
    delayNodeRef.current = ctx.createDelay(5);
    delayNodeRef.current.delayTime.value = dsp.delay.time;

    delayFeedbackRef.current = ctx.createGain();
    delayFeedbackRef.current.gain.value = 0;

    delayGainRef.current = ctx.createGain();
    delayGainRef.current.gain.value = 0;

    // Delay feedback loop
    delayNodeRef.current.connect(delayFeedbackRef.current);
    delayFeedbackRef.current.connect(delayNodeRef.current);

    // Create warmth (waveshaper) - optional, check if enabled
    waveShaperRef.current = ctx.createWaveShaper();
    if (dsp.warmth?.enabled) {
      (waveShaperRef.current as any).curve = createWarmthCurve(dsp.warmth.drive);
    } else {
      // Linear pass-through when warmth is disabled - MUST use a linear curve, not null
      const linearCurve = new Float32Array(44100);
      for (let i = 0; i < 44100; i++) {
        linearCurve[i] = (i * 2) / 44100 - 1;
      }
      (waveShaperRef.current as any).curve = linearCurve;
    }
    waveShaperRef.current.oversample = '4x';

    warmthGainRef.current = ctx.createGain();
    warmthGainRef.current.gain.value = 1;

    // Create soft-knee limiter as final stage for glassy professional finish
    // More aggressive settings to prevent distortion at max volume
    limiterRef.current = ctx.createDynamicsCompressor();
    limiterRef.current.threshold.value = -6;  // -6 dB threshold (more headroom)
    limiterRef.current.knee.value = 10;       // Wider soft knee for transparency
    limiterRef.current.ratio.value = 20;      // High ratio for limiting
    limiterRef.current.attack.value = 0.001;  // 1ms attack
    limiterRef.current.release.value = 0.05;  // 50ms release (faster recovery)

    // Connect DSP chain
    // Create a mixer gain node to combine all sources before analyser
    mixerGainRef.current = ctx.createGain();
    mixerGainRef.current.gain.value = 1.0;
    
    // All sources -> mixer -> analyser (for visualization) AND direct to processing
    neuralGainRef.current.connect(mixerGainRef.current);
    atmosphereGainRef.current.connect(mixerGainRef.current);
    solfeggioGainRef.current.connect(mixerGainRef.current);
    binauralGainRef.current.connect(mixerGainRef.current);
    
    // Mixer -> analyser (for visualization)
    mixerGainRef.current.connect(analyser);
    
    // Mixer -> warmth -> limiter -> master (main audio path)
    mixerGainRef.current.connect(waveShaperRef.current);
    waveShaperRef.current.connect(limiterRef.current);
    limiterRef.current.connect(masterGain);

    // Parallel reverb (connects to limiter)
    mixerGainRef.current.connect(convolver);
    convolver.connect(reverbGainRef.current);
    reverbGainRef.current.connect(limiterRef.current);

    // Parallel delay (connects to limiter)
    mixerGainRef.current.connect(delayNodeRef.current);
    delayNodeRef.current.connect(delayGainRef.current);
    delayGainRef.current.connect(limiterRef.current);
    
    console.log('Audio chain initialized: sources -> mixer -> analyser/processing -> master');

    // Ensure AudioContext is running so oscillators can produce sound immediately
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('AudioContext resumed from suspended state');
    }

    // Only mark as initialized on full success
    setIsInitialized(true);
    } catch (e) {
      console.error('SoulMeditateEngine initialize error:', e);
      // Clean up so retry is possible
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      // Reset all refs that may have been partially set
      masterGainRef.current = null;
      analyserRef.current = null;
      mixerGainRef.current = null;
      neuralGainRef.current = null;
      atmosphereGainRef.current = null;
      solfeggioGainRef.current = null;
      binauralGainRef.current = null;
      limiterRef.current = null;
      // Do NOT set isInitialized = true — allow retry
    }
  }, [masterVolume, neuralLayer.volume, atmosphereLayer.volume, dsp]);

  // Create reverb impulse response
  async function createReverbImpulse(ctx: AudioContext, decay: number): Promise<AudioBuffer> {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * decay;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    return buffer;
  }

  // Create warmth curve (soft saturation)
  function createWarmthCurve(drive: number): Float32Array | null {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const amount = drive * 50;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve as Float32Array | null;
  }

  // Load neural source (user uploaded audio)
  const loadNeuralSource = useCallback(async (file: File | string) => {
    // Preserve file reference for later use (TypeScript narrowing workaround)
    const isUrl = typeof file === 'string';
    const fileUrl = isUrl ? file : URL.createObjectURL(file);
    const fileName = isUrl ? file.split('/').pop() || 'Audio' : file.name;
    
    // Auto-initialize if needed
    if (!audioContextRef.current) {
      await initialize();
    }
    
    // Wait for refs to be available after initialization
    if (!audioContextRef.current || !neuralGainRef.current) {
      console.error('Failed to initialize audio context');
      return false;
    }

    // Clean up previous (MediaElement + any buffer playback)
    if (neuralBufferGainRef.current) {
      neuralBufferGainRef.current.disconnect();
      neuralBufferGainRef.current = null;
    }
    if (neuralBufferSourceRef.current) {
      try { neuralBufferSourceRef.current.stop(); } catch (_) {}
      neuralBufferSourceRef.current.disconnect();
      neuralBufferSourceRef.current = null;
    }
    if (neuralAudioRef.current) {
      neuralAudioRef.current.pause();
      neuralAudioRef.current.src = '';
    }
    if (neuralSourceRef.current) {
      neuralSourceRef.current.disconnect();
      neuralSourceRef.current = null;
    }

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;

    if (typeof file === 'string') {
      audio.src = file;
    } else {
      audio.src = URL.createObjectURL(file);
    }

    neuralAudioRef.current = audio;
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    audio.play().catch(() => {});
    setNeuralLayer(prev => ({ ...prev, isPlaying: true }));

    // Start source only after element is ready (and after decodeAudioData below for buffer path)
    audio.addEventListener('canplaythrough', () => {
      console.log('Neural source element ready to play (same chain as oscillators: neuralGain -> mixer -> masterGain -> destination)');
    }, { once: true });

    // Create source node and connect through same masterGain chain as oscillators
    const source = audioContextRef.current.createMediaElementSource(audio);

    // Restore full chain: source -> mono balancer -> noise cleanup -> low cut -> EQ -> de-esser -> noise gate -> neuralGain
    const hasMono = monoSplitterRef.current && monoMergerRef.current;
    const hasNoise = noiseHighPassRef.current && noiseLowPassRef.current && noiseCompressorRef.current;
    const hasLowCut = lowCutFilterRef.current;
    const hasEQ = eqWeightRef.current && eqPresenceRef.current && eqAirRef.current;
    const hasDeEsser = deEsserFilterRef.current;
    const hasGate = userNoiseGateRef.current;

    if (hasMono && hasNoise && hasLowCut && hasEQ && hasGate) {
      // Full professional chain; neuralGain feeds same mixer -> masterGain as oscillators
      source.connect(monoSplitterRef.current!);
      monoMergerRef.current!.connect(noiseHighPassRef.current!);
      noiseHighPassRef.current!.connect(noiseLowPassRef.current!);
      noiseLowPassRef.current!.connect(noiseCompressorRef.current!);
      noiseCompressorRef.current!.connect(lowCutFilterRef.current!);
      lowCutFilterRef.current!.connect(eqWeightRef.current!);
      eqWeightRef.current!.connect(eqPresenceRef.current!);
      eqPresenceRef.current!.connect(eqAirRef.current!);
      // De-esser sits after EQ, before gate
      if (hasDeEsser) {
        eqAirRef.current!.connect(deEsserFilterRef.current!);
        deEsserFilterRef.current!.connect(userNoiseGateRef.current!);
      } else {
        eqAirRef.current!.connect(userNoiseGateRef.current!);
      }
      userNoiseGateRef.current!.connect(neuralGainRef.current!);
      console.log('Neural source connected: mono -> noise cleanup -> EQ -> de-esser(7.2kHz) -> gate -> neuralGain');
    } else {
      // Fallback: direct to neuralGain (same mixer -> masterGain as oscillators)
      source.connect(neuralGainRef.current!);
      console.warn('Neural source direct to neuralGain (same masterGain chain as oscillators)');
    }

    neuralSourceRef.current = source;

    // Unlock context on same user gesture (2026 autoplay policy) so neural playback can start
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    // Ensure neural gain is audible; +3dB boost to match oscillators in DSP rack
    const neuralVol = Math.min(0.95, Math.max(0.01, neuralLayer.volume * NEURAL_GAIN_BOOST_LINEAR));
    neuralGainRef.current.gain.value = neuralVol;

    // Set UI source + export metadata
    if (typeof file === 'string') {
      setNeuralLayer((prev) => ({
        ...prev,
        source: file,
        exportInput: {
          directUrl: file,
          displayName: file.split('/').pop() || file,
        },
      }));
      return true;
    }

    // Local file: upload to storage so backend can fetch it for mastering
    setNeuralLayer((prev) => ({
      ...prev,
      source: file.name,
      exportInput: { displayName: file.name },
    }));

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth?.user) throw authError || new Error('Not signed in');

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `creative-soul-uploads/${auth.user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('creative-soul-library')
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type || 'audio/mpeg',
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('creative-soul-library').getPublicUrl(storagePath);

      setNeuralLayer((prev) => ({
        ...prev,
        exportInput: {
          ...(prev.exportInput || {}),
          uploadPath: storagePath,
          directUrl: data.publicUrl,
          displayName: file.name,
        },
      }));
    } catch (e) {
      console.error('Failed to upload neural source for export:', e);
    }

    // Universal file reader: File → ArrayBuffer (format-agnostic; MP3, M4A, WAV, FLAC, etc.)
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file, fileUrl, isUrl);
      const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      console.log('Neural Buffer Loaded:', decodedBuffer.duration);

      // === TRANSPARENT MODE: Detect pre-mastered/high-quality sources ===
      // Analyze RMS and dynamic range; if source is already well-mastered,
      // lower compression ratio to 1.2:1 to preserve life/dynamics
      const channelData = decodedBuffer.getChannelData(0);
      let sumSq = 0;
      let peak = 0;
      const sampleCount = Math.min(channelData.length, decodedBuffer.sampleRate * 10); // Analyze first 10s
      for (let i = 0; i < sampleCount; i++) {
        const abs = Math.abs(channelData[i]);
        sumSq += channelData[i] * channelData[i];
        if (abs > peak) peak = abs;
      }
      const rms = Math.sqrt(sumSq / sampleCount);
      const dynamicRangeDb = 20 * Math.log10(peak / Math.max(rms, 0.0001));
      const isPreMastered = dynamicRangeDb < 12 && rms > 0.05; // Low dynamic range + loud RMS = mastered
      transparentModeRef.current = isPreMastered;

      if (isPreMastered && noiseCompressorRef.current) {
        // Transparent mode: gentle compression preserves source dynamics
        noiseCompressorRef.current.ratio.value = 1.2;
        noiseCompressorRef.current.threshold.value = -12;
        noiseCompressorRef.current.knee.value = 30;
        console.log(`[Transparent Mode] ON — DR: ${dynamicRangeDb.toFixed(1)}dB, RMS: ${rms.toFixed(3)} → ratio 1.2:1`);
      } else if (noiseCompressorRef.current) {
        // Standard mode: full processing for raw recordings
        noiseCompressorRef.current.ratio.value = 4;
        noiseCompressorRef.current.threshold.value = -50;
        noiseCompressorRef.current.knee.value = 40;
        console.log(`[Transparent Mode] OFF — DR: ${dynamicRangeDb.toFixed(1)}dB, RMS: ${rms.toFixed(3)} → ratio 4:1`);
      }

      console.log('Neural source buffer status: decoded, hit engine, duration', decodedBuffer.duration, 's');
      
      // Create initial region spanning the entire audio
      const initialRegion: AudioRegion = {
        id: `region-${Date.now()}`,
        startTime: 0,
        duration: decodedBuffer.duration,
        sourceStart: 0,
        sourceDuration: decodedBuffer.duration,
        color: 'hsl(280, 70%, 50%)',
        label: fileName
      };
      setDawRegions([initialRegion]);
      setDawCurrentTime(0);
      console.log('Audio buffer loaded for DAW:', decodedBuffer.duration, 'seconds');
    } catch (e) {
      console.error('Failed to decode audio for DAW:', e);
    }

    return true;
  }, [initialize]);

  // Load atmosphere from Supabase - randomly select from available sounds for style
  const loadAtmosphere = useCallback(async (styleId: string) => {
    // Auto-initialize if needed
    if (!audioContextRef.current) {
      await initialize();
    }
    
    if (!audioContextRef.current || !atmosphereGainRef.current) {
      console.error('Failed to initialize audio context');
      return { ok: false, reason: 'error' as const };
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const BUCKET = 'creative-soul-library';
    
    // Fetch available sounds for this style from database (always use the requested styleId)
    const { data: sounds, error } = await supabase
      .from('meditation_style_sounds')
      .select('*')
      .eq('style_id', styleId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch atmosphere sounds:', error);
      return { ok: false, reason: 'error' as const };
    }

    if (!sounds || sounds.length === 0) {
      // Fallback: try 'indian' (only style with active sounds in seed data)
      if (styleId !== 'indian') {
        const { data: fallbackSounds, error: fallbackErr } = await supabase
          .from('meditation_style_sounds')
          .select('*')
          .eq('style_id', 'indian')
          .eq('is_active', true);
        if (!fallbackErr && fallbackSounds?.length) {
          const fb = fallbackSounds[Math.floor(Math.random() * fallbackSounds.length)];
          const fbUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fb.file_path}`;
          if (atmosphereAudioRef.current) {
            atmosphereAudioRef.current.pause();
            atmosphereAudioRef.current.volume = 0;
          }
          if (atmosphereSourceRef.current) {
            atmosphereSourceRef.current.disconnect();
            atmosphereSourceRef.current = null;
          }
          atmosphereAudioRef.current = null;
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          audio.loop = true;
          audio.src = fbUrl;
          try {
            const src = audioContextRef.current!.createMediaElementSource(audio);
            src.connect(atmosphereGainRef.current!);
            atmosphereSourceRef.current = src;
            atmosphereAudioRef.current = audio;
            setAtmosphereLayer({
              isPlaying: true,
              volume: atmosphereLayer.volume,
              source: `indian:${fb.name}`,
              exportInput: { directUrl: fbUrl, displayName: fb.name }
            });
            audioContextRef.current?.resume();
            audio.play().catch(console.warn);
            return { ok: true, fallbackFrom: styleId };
          } catch (e) {
            console.error('Fallback load failed:', e);
          }
        }
      }
      console.log(`No active sounds found for style: ${styleId}`);
      if (atmosphereAudioRef.current) {
        atmosphereAudioRef.current.pause();
        atmosphereAudioRef.current.volume = 0;
      }
      if (atmosphereSourceRef.current) {
        atmosphereSourceRef.current.disconnect();
        atmosphereSourceRef.current = null;
      }
      atmosphereAudioRef.current = null;
      setAtmosphereLayer(prev => ({ ...prev, source: styleId, exportInput: undefined }));
      return { ok: false, reason: 'no_sounds' as const };
    }

    // Pick a different sound than current when possible (for "New Sound" button)
    // Only consider current sound if it's from the SAME category (styleId)
    const currentSource = atmosphereLayer.source;
    const currentStyleMatch = currentSource?.startsWith(`${styleId}:`);
    const currentName = currentStyleMatch && currentSource?.includes(':')
      ? currentSource.split(':').slice(1).join(':').trim()
      : null;
    const candidates = currentName && sounds.length > 1
      ? sounds.filter((s) => s.name?.trim() !== currentName)
      : sounds;
    const selectedSound = candidates[Math.floor(Math.random() * candidates.length)];
    const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${selectedSound.file_path}`;

    // Pause and mute before disconnect to avoid click/pop
    if (atmosphereAudioRef.current) {
      atmosphereAudioRef.current.pause();
      atmosphereAudioRef.current.volume = 0;
    }
    if (atmosphereSourceRef.current) {
      atmosphereSourceRef.current.disconnect();
      atmosphereSourceRef.current = null;
    }
    atmosphereAudioRef.current = null;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.src = audioUrl;

    try {
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(atmosphereGainRef.current);
      atmosphereSourceRef.current = source;
      atmosphereAudioRef.current = audio;
    } catch (e) {
      console.error('Atmosphere audio setup failed:', e);
      return { ok: false, reason: 'error' as const };
    }

    setAtmosphereLayer(prev => ({ 
      ...prev, 
      source: `${styleId}:${selectedSound.name}`,
      isPlaying: true,
      exportInput: {
        directUrl: audioUrl,
        displayName: selectedSound.name
      }
    }));
    // Auto-play so user hears the new sound immediately
    audioContextRef.current?.resume();
    audio.play().catch(console.warn);
    return { ok: true };
  }, [initialize, atmosphereLayer.source]);

  // Play/pause neural layer — buffer playback uses same gain chain as Hz; new BufferSource each Play (one-shot)
  const toggleNeuralPlay = useCallback(async () => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    // Kickstart: resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (neuralLayer.isPlaying) {
      // Stop: BufferSource + gain compensation node, or MediaElement
      if (neuralBufferGainRef.current) {
        neuralBufferGainRef.current.disconnect();
        neuralBufferGainRef.current = null;
      }
      if (neuralBufferSourceRef.current) {
        try { neuralBufferSourceRef.current.stop(); } catch (_) {}
        neuralBufferSourceRef.current.disconnect();
        neuralBufferSourceRef.current = null;
      }
      if (neuralAudioRef.current) neuralAudioRef.current.pause();
      setNeuralLayer(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    // Play: decoded buffer → [noise chain + EQ + gate] → neuralGain → mixer → Sacred Effects → master
    const buffer = audioBuffer;
    if (buffer && neuralGainRef.current) {
      if (neuralBufferGainRef.current) {
        neuralBufferGainRef.current.disconnect();
        neuralBufferGainRef.current = null;
      }
      if (neuralBufferSourceRef.current) {
        try { neuralBufferSourceRef.current.stop(); } catch (_) {}
        neuralBufferSourceRef.current.disconnect();
        neuralBufferSourceRef.current = null;
      }
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Detect presence of full neural processing chain
      const hasMono = monoSplitterRef.current && monoMergerRef.current;
      const hasNoise = noiseHighPassRef.current && noiseLowPassRef.current && noiseCompressorRef.current;
      const hasLowCut = lowCutFilterRef.current;
      const hasEQ = eqWeightRef.current && eqPresenceRef.current && eqAirRef.current;
      const hasGate = userNoiseGateRef.current;

      // Slight gain compensation so buffer path matches MediaElement loudness
      const gainComp = audioCtx.createGain();
      gainComp.gain.value = 1.2;

      if (hasMono && hasNoise && hasLowCut && hasEQ && hasGate) {
        // Buffer follows the same chain as live neural source:
        // source -> gain(1.2) -> mono balancer -> noise cleanup -> EQ -> de-esser -> gate -> neuralGain
        source.connect(gainComp);
        gainComp.connect(monoSplitterRef.current!);
        console.log('[Neural] BufferSource -> gain(1.2) -> mono/EQ/gate -> neuralGain -> Sacred Effects -> master');
      } else {
        // Fallback: direct to neuralGain (still hits Sacred Effects via mixer)
        source.connect(gainComp);
        gainComp.connect(neuralGainRef.current);
        console.warn('[Neural] BufferSource direct to neuralGain (no full noise/EQ chain available)');
      }

      neuralBufferGainRef.current = gainComp;
      source.start(0);
      neuralBufferSourceRef.current = source;
      setNeuralLayer(prev => ({ ...prev, isPlaying: true }));
      return;
    }

    // Fallback: MediaElement (e.g. URL-only source before decode)
    if (neuralAudioRef.current) {
      await neuralAudioRef.current.play().catch(console.error);
      setNeuralLayer(prev => ({ ...prev, isPlaying: true }));
    }
  }, [neuralLayer.isPlaying, audioBuffer]);

  // Play/pause atmosphere
  const toggleAtmospherePlay = useCallback(async () => {
    if (!atmosphereAudioRef.current) return;
    
    if (atmosphereLayer.isPlaying) {
      atmosphereAudioRef.current.pause();
    } else {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      atmosphereAudioRef.current.play().catch(console.error);
    }
    setAtmosphereLayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [atmosphereLayer.isPlaying]);

  // Start solfeggio oscillator
  const startSolfeggio = useCallback(async (hz: number) => {
    if (!audioContextRef.current || !solfeggioGainRef.current) {
      console.error('[Solfeggio] Audio context or gain node missing');
      return;
    }

    // CRITICAL: Resume audio context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      console.log('[Solfeggio] Resuming suspended audio context');
      await audioContextRef.current.resume();
    }

    console.log('[Solfeggio] Audio context state:', audioContextRef.current.state);

    // Stop existing
    if (solfeggioOscRef.current) {
      solfeggioOscRef.current.stop();
      solfeggioOscRef.current.disconnect();
    }

    const osc = audioContextRef.current.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz;
    osc.connect(solfeggioGainRef.current);
    
    // Boosted gain (0.7–0.8 range) so oscillators are audible; cap to avoid clip
    const targetVolume = Math.min(OSCILLATOR_GAIN_MAX, solfeggioVolume * OSCILLATOR_BASE_GAIN);
    console.log('[Solfeggio] Starting oscillator:', hz, 'Hz, volume:', solfeggioVolume, '->', targetVolume);
    
    // Set volume BEFORE starting to ensure immediate sound
    solfeggioGainRef.current.gain.cancelScheduledValues(0);
    solfeggioGainRef.current.gain.value = targetVolume;
    
    osc.start();
    
    // Verify gain is set correctly
    console.log('[Solfeggio] Gain node value:', solfeggioGainRef.current.gain.value);

    solfeggioOscRef.current = osc;
    setFrequencies(prev => ({ ...prev, solfeggio: { enabled: true, hz } }));

    // Diagnostic chain verification
    console.log('[Solfeggio] Chain check:',
      'mixer:', mixerGainRef.current?.gain.value,
      'waveshaper curve:', waveShaperRef.current?.curve?.length,
      'limiter threshold:', limiterRef.current?.threshold.value,
      'master:', masterGainRef.current?.gain.value,
      'ctx.destination channels:', audioContextRef.current?.destination.channelCount
    );
  }, [solfeggioVolume]);

  // Stop solfeggio
  const stopSolfeggio = useCallback(() => {
    if (solfeggioOscRef.current && solfeggioGainRef.current && audioContextRef.current) {
      solfeggioGainRef.current.gain.cancelScheduledValues(0);
      solfeggioGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.3);
      setTimeout(() => {
        solfeggioOscRef.current?.stop();
        solfeggioOscRef.current?.disconnect();
        solfeggioOscRef.current = null;
      }, 500);
    }
    setFrequencies(prev => ({ ...prev, solfeggio: { ...prev.solfeggio, enabled: false } }));
  }, []);

  // Start binaural beats
  const startBinaural = useCallback(async (carrierHz: number, beatHz: number) => {
    if (!audioContextRef.current || !binauralGainRef.current || !binauralMergerRef.current) {
      console.error('[Binaural] Audio context or gain/merger nodes missing');
      return;
    }

    // CRITICAL: Resume audio context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      console.log('[Binaural] Resuming suspended audio context');
      await audioContextRef.current.resume();
    }

    console.log('[Binaural] Audio context state:', audioContextRef.current.state);

    // Stop existing
    binauralLeftOscRef.current?.stop();
    binauralRightOscRef.current?.stop();

    const ctx = audioContextRef.current;
    
    // Boosted gain (0.7–0.8 range) so binaural is audible; cap to avoid clip
    const targetVolume = Math.min(OSCILLATOR_GAIN_MAX, binauralVolume * OSCILLATOR_BASE_GAIN);
    console.log('[Binaural] Starting binaural beats:', carrierHz, 'Hz carrier,', beatHz, 'Hz beat, volume:', binauralVolume, '->', targetVolume);
    
    // Set volume BEFORE creating oscillators
    binauralGainRef.current.gain.cancelScheduledValues(0);
    binauralGainRef.current.gain.value = targetVolume;
    
    // Left ear oscillator
    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = carrierHz;
    
    // Right ear oscillator (offset by beat frequency)
    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = carrierHz + beatHz;

    // Create individual gains for panning
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = 1;
    rightGain.gain.value = 1;

    // Connect to merger (stereo separation)
    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    leftGain.connect(binauralMergerRef.current, 0, 0);
    rightGain.connect(binauralMergerRef.current, 0, 1);
    binauralMergerRef.current.connect(binauralGainRef.current);

    leftOsc.start();
    rightOsc.start();
    
    // Verify gain is set correctly
    console.log('[Binaural] Gain node value:', binauralGainRef.current.gain.value);

    binauralLeftOscRef.current = leftOsc;
    binauralRightOscRef.current = rightOsc;

    setFrequencies(prev => ({ ...prev, binaural: { enabled: true, carrierHz, beatHz } }));

    // Diagnostic chain verification
    console.log('[Binaural] Chain check:',
      'mixer:', mixerGainRef.current?.gain.value,
      'waveshaper curve:', waveShaperRef.current?.curve?.length,
      'limiter threshold:', limiterRef.current?.threshold.value,
      'master:', masterGainRef.current?.gain.value,
      'ctx.destination channels:', audioContextRef.current?.destination.channelCount
    );
  }, [binauralVolume]);

  // Stop binaural
  const stopBinaural = useCallback(() => {
    if (binauralGainRef.current && audioContextRef.current) {
      binauralGainRef.current.gain.cancelScheduledValues(0);
      binauralGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.3);
      setTimeout(() => {
        binauralLeftOscRef.current?.stop();
        binauralRightOscRef.current?.stop();
        binauralLeftOscRef.current = null;
        binauralRightOscRef.current = null;
      }, 500);
    }
    setFrequencies(prev => ({ ...prev, binaural: { ...prev.binaural, enabled: false } }));
  }, []);

  // Stop everything currently playing (neural, atmosphere, solfeggio, binaural, DAW)
  const stopAll = useCallback(() => {
    // Neural (voice / source)
    if (neuralLayer.isPlaying) {
      void toggleNeuralPlay();
    }
    // Atmosphere bed
    if (atmosphereLayer.isPlaying) {
      void toggleAtmospherePlay();
    }
    // Healing solfeggio tone
    if (frequencies.solfeggio.enabled) {
      stopSolfeggio();
    }
    // Binaural beats
    if (frequencies.binaural.enabled) {
      stopBinaural();
    }
    // DAW preview playback (if active) — inlined to avoid forward-reference
    if (dawPlaybackRef.current) {
      dawPlaybackRef.current.source.stop();
      dawPlaybackRef.current = null;
    }
    setDawCurrentTime(0);
  }, [
    neuralLayer.isPlaying,
    atmosphereLayer.isPlaying,
    frequencies.solfeggio.enabled,
    frequencies.binaural.enabled,
    toggleNeuralPlay,
    toggleAtmospherePlay,
    stopSolfeggio,
    stopBinaural,
  ]);

  // Update volumes
  // Volume clamping helper to prevent distortion at max volume
  // Max 0.85 gives headroom for the limiter when multiple layers combine
  const clampVolume = (vol: number, maxVol: number = 0.85) => Math.min(Math.max(0, vol), maxVol);

  const updateNeuralVolume = useCallback((vol: number) => {
    const safeVol = Math.min(0.95, clampVolume(vol) * NEURAL_GAIN_BOOST_LINEAR);
    if (neuralGainRef.current) {
      neuralGainRef.current.gain.value = safeVol;
    }
    setNeuralLayer(prev => ({ ...prev, volume: vol })); // Store original for UI
  }, []);

  const updateAtmosphereVolume = useCallback((vol: number) => {
    const safeVol = clampVolume(vol);
    if (atmosphereGainRef.current) {
      atmosphereGainRef.current.gain.value = safeVol;
    }
    setAtmosphereLayer(prev => ({ ...prev, volume: vol })); // Store original for UI
  }, []);

  const updateSolfeggioVolume = useCallback((vol: number) => {
    const safeVol = Math.min(OSCILLATOR_GAIN_MAX, vol * OSCILLATOR_BASE_GAIN);
    if (solfeggioGainRef.current && frequencies.solfeggio.enabled) {
      solfeggioGainRef.current.gain.value = safeVol;
    }
    setSolfeggioVolume(vol); // Store original for UI
  }, [frequencies.solfeggio.enabled]);

  const updateBinauralVolume = useCallback((vol: number) => {
    const safeVol = Math.min(OSCILLATOR_GAIN_MAX, vol * OSCILLATOR_BASE_GAIN);
    if (binauralGainRef.current && frequencies.binaural.enabled) {
      binauralGainRef.current.gain.value = safeVol;
    }
    setBinauralVolume(vol); // Store original for UI
  }, [frequencies.binaural.enabled]);

  const updateMasterVolume = useCallback((vol: number) => {
    const safeVol = clampVolume(vol, 0.9); // Master has limiter, allow slightly higher
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = safeVol;
    }
    setMasterVolume(vol); // Store original for UI
  }, []);

  // Update EQ band
  const updateEQ = useCallback((bandId: string, value: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    // Clamp value to reasonable range (-12 to +12 dB)
    const clampedValue = Math.max(-12, Math.min(12, value));
    
    switch (bandId) {
      case 'weight':
        if (eqWeightRef.current) {
          eqWeightRef.current.gain.setValueAtTime(clampedValue, ctx.currentTime);
        }
        setEqSettings(prev => ({ ...prev, weight: clampedValue }));
        break;
      case 'presence':
        if (eqPresenceRef.current) {
          eqPresenceRef.current.gain.setValueAtTime(clampedValue, ctx.currentTime);
        }
        setEqSettings(prev => ({ ...prev, presence: clampedValue }));
        break;
      case 'air':
        if (eqAirRef.current) {
          eqAirRef.current.gain.setValueAtTime(clampedValue, ctx.currentTime);
        }
        setEqSettings(prev => ({ ...prev, air: clampedValue }));
        break;
    }
    console.log(`EQ ${bandId} set to ${clampedValue}dB`);
  }, []);
  
  // Update noise gate parameters (pass object or single number for threshold)
  const updateNoiseGate = useCallback((params: number | {
    threshold?: number;
    attack?: number;
    release?: number;
    range?: number;
    enabled?: boolean;
  }) => {
    const opts = typeof params === 'number' ? { threshold: params } : params;
    const ctx = audioContextRef.current;
    const node = userNoiseGateRef.current;
    if (!ctx || !node || !('parameters' in node)) return;

    const nodeParams = (node as AudioWorkletNode).parameters;
    const now = ctx.currentTime;

    if (opts.threshold !== undefined) {
      const v = Math.max(-80, Math.min(-10, opts.threshold));
      nodeParams.get('threshold')!.setValueAtTime(v, now);
      setEqSettings(prev => ({ ...prev, noiseGateThreshold: v }));
    }
    if (opts.attack !== undefined) {
      const v = Math.max(1, Math.min(50, opts.attack));
      nodeParams.get('attack')!.setValueAtTime(v / 1000, now);
      setEqSettings(prev => ({ ...prev, noiseGateAttack: v }));
    }
    if (opts.release !== undefined) {
      const v = Math.max(50, Math.min(500, opts.release));
      nodeParams.get('release')!.setValueAtTime(v / 1000, now);
      setEqSettings(prev => ({ ...prev, noiseGateRelease: v }));
    }
    if (opts.range !== undefined) {
      const v = Math.max(-96, Math.min(-6, opts.range));
      nodeParams.get('range')!.setValueAtTime(v, now);
      setEqSettings(prev => ({ ...prev, noiseGateRange: v }));
    }
    if (opts.enabled !== undefined) {
      nodeParams.get('enabled')!.setValueAtTime(opts.enabled ? 1 : 0, now);
      setEqSettings(prev => ({ ...prev, noiseGateEnabled: opts.enabled }));
    }
  }, []);

  // Toggle low cut filter (100Hz high-pass)
  const toggleLowCut = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !lowCutFilterRef.current) return;
    
    setEqSettings(prev => {
      const newEnabled = !prev.lowCutEnabled;
      if (lowCutFilterRef.current) {
        // When disabled, set frequency very low to effectively bypass
        lowCutFilterRef.current.frequency.setValueAtTime(
          newEnabled ? 100 : 10, 
          ctx.currentTime
        );
      }
      console.log(`Low cut filter ${newEnabled ? 'enabled' : 'disabled'}`);
      return { ...prev, lowCutEnabled: newEnabled };
    });
  }, []);

  // Update DSP settings
  const updateDSP = useCallback((newDsp: Partial<DSPSettings>) => {
    setDSP(prev => {
      const updated = { ...prev, ...newDsp };

      // Apply reverb changes
      if (newDsp.reverb && reverbGainRef.current) {
        reverbGainRef.current.gain.value = updated.reverb.enabled ? updated.reverb.wet : 0;
      }

      // Sacred Echo (delay) is removed – ignore any delay updates and keep it bypassed

      // Apply warmth changes
      if (newDsp.warmth && waveShaperRef.current) {
        if (updated.warmth.enabled) {
          (waveShaperRef.current as any).curve = createWarmthCurve(updated.warmth.drive);
        } else {
          // Bypass - linear curve
          const bypassCurve = new Float32Array(44100);
          for (let i = 0; i < 44100; i++) {
            bypassCurve[i] = (i * 2) / 44100 - 1;
          }
          (waveShaperRef.current as any).curve = bypassCurve;
        }
      }

      return updated;
    });
  }, []);

  // Animation loop for analyser
  useEffect(() => {
    if (!analyserRef.current || !isInitialized) return;

    const analyser = analyserRef.current;
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    let animationId: number;

    const updateData = () => {
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeData);
      setAnalyserData({ frequencyData: new Uint8Array(frequencyData), timeData: new Uint8Array(timeData) });
      animationId = requestAnimationFrame(updateData);
    };

    updateData();

    return () => cancelAnimationFrame(animationId);
  }, [isInitialized]);

  // Cleanup
  useEffect(() => {
    return () => {
      solfeggioOscRef.current?.stop();
      binauralLeftOscRef.current?.stop();
      binauralRightOscRef.current?.stop();
      neuralAudioRef.current?.pause();
      atmosphereAudioRef.current?.pause();
      audioContextRef.current?.close();
    };
  }, []);

  // ============ RECORDING CAPABILITY ============
  const recordingDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  /**
   * Get the master gain node for connecting a recording destination.
   * This allows external recording hooks to tap into the audio output.
   */
  const getMasterNode = useCallback((): AudioNode | null => {
    return masterGainRef.current;
  }, []);

  /**
   * Get the audio context for recording purposes.
   */
  const getAudioContext = useCallback((): AudioContext | null => {
    return audioContextRef.current;
  }, []);

  // ============ DAW FUNCTIONS ============
  
  // Update DAW regions
  const updateDawRegions = useCallback((regions: AudioRegion[]) => {
    setDawRegions(regions);
  }, []);
  
  // Seek to specific time in DAW
  const dawSeek = useCallback((time: number) => {
    setDawCurrentTime(time);
    
    // If playing, restart from new position
    if (dawPlaybackRef.current && audioContextRef.current && audioBuffer) {
      dawPlaybackRef.current.source.stop();
      dawPlaybackRef.current = null;
      
      // Restart playback from new position
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(neuralGainRef.current || audioContextRef.current.destination);
      source.start(0, time);
      
      dawPlaybackRef.current = {
        source,
        startedAt: audioContextRef.current.currentTime,
        offset: time
      };
    }
  }, [audioBuffer]);
  
  // Toggle DAW playback (plays edited regions as one audio)
  const dawTogglePlay = useCallback(() => {
    if (!audioContextRef.current || !audioBuffer) return;
    
    if (dawPlaybackRef.current) {
      // Stop
      dawPlaybackRef.current.source.stop();
      dawPlaybackRef.current = null;
      setNeuralLayer(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Play - for now just play from current time through the buffer
      // Future: render regions to a composite buffer
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      
      // Connect through the processing chain
      if (noiseHighPassRef.current) {
        source.connect(noiseHighPassRef.current);
      } else if (neuralGainRef.current) {
        source.connect(neuralGainRef.current);
      } else {
        source.connect(audioContextRef.current.destination);
      }
      
      source.start(0, dawCurrentTime);
      
      dawPlaybackRef.current = {
        source,
        startedAt: audioContextRef.current.currentTime,
        offset: dawCurrentTime
      };
      
      setNeuralLayer(prev => ({ ...prev, isPlaying: true }));
    }
  }, [audioBuffer, dawCurrentTime]);
  
  // Stop DAW playback and reset to beginning
  const dawStop = useCallback(() => {
    if (dawPlaybackRef.current) {
      dawPlaybackRef.current.source.stop();
      dawPlaybackRef.current = null;
    }
    setDawCurrentTime(0);
    setNeuralLayer(prev => ({ ...prev, isPlaying: false }));
  }, []);
  
  // Update DAW current time during playback
  useEffect(() => {
    if (!dawPlaybackRef.current || !audioContextRef.current) return;
    
    const updateTime = () => {
      if (dawPlaybackRef.current && audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - dawPlaybackRef.current.startedAt;
        const newTime = dawPlaybackRef.current.offset + elapsed;
        setDawCurrentTime(newTime % (audioBuffer?.duration || 1));
      }
    };
    
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, [audioBuffer?.duration]);
  
  // Get computed duration from regions for export
  const getDawDuration = useCallback((): number => {
    if (dawRegions.length === 0) return audioBuffer?.duration || 0;
    return Math.max(...dawRegions.map(r => r.startTime + r.duration));
  }, [dawRegions, audioBuffer]);

  // Diagnostic: play a test tone DIRECTLY to destination, bypassing all DSP
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

  // Toggle de-esser on/off
  const toggleDeEsser = useCallback((enabled: boolean) => {
    deEsserEnabled.current = enabled;
    if (deEsserFilterRef.current) {
      deEsserFilterRef.current.gain.value = enabled ? -4 : 0; // -4dB cut or bypass
      console.log(`[De-Esser] ${enabled ? 'ON (-4dB @ 7.2kHz)' : 'OFF (bypass)'}`);
    }
  }, []);

  // Check if transparent mode is active
  const isTransparentMode = transparentModeRef.current;

  return {
    // State
    isInitialized,
    neuralLayer,
    atmosphereLayer,
    frequencies,
    solfeggioVolume,
    binauralVolume,
    dsp,
    eqSettings,
    masterVolume,
    analyserData,
    
    // DAW State
    audioBuffer,
    dawRegions,
    dawCurrentTime,
    
    // Constants
    SOLFEGGIO_FREQUENCIES,
    BINAURAL_PRESETS,
    ATMOSPHERE_LIBRARY,
    
    // Actions
    initialize,
    loadNeuralSource,
    loadAtmosphere,
    toggleNeuralPlay,
    toggleAtmospherePlay,
    startSolfeggio,
    stopSolfeggio,
    startBinaural,
    stopBinaural,
    updateNeuralVolume,
    updateAtmosphereVolume,
    updateSolfeggioVolume,
    updateBinauralVolume,
    updateMasterVolume,
    updateDSP,
    updateEQ,
    toggleLowCut,
    updateNoiseGate,

    // DAW Actions
    updateDawRegions,
    dawSeek,
    dawTogglePlay,
    dawStop,
    getDawDuration,
    
    // Recording support
    getMasterNode,
    getAudioContext,
    
    // Vocal Processing
    toggleDeEsser,
    isTransparentMode,
    
    // Diagnostics
    playTestTone,
    stopAll,
  };
}
