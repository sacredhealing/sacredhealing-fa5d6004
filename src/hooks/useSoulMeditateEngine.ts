import { useRef, useState, useCallback, useEffect } from 'react';

// Types
export interface LayerState {
  isPlaying: boolean;
  volume: number;
  source: string | null;
}

export interface DSPSettings {
  reverb: { enabled: boolean; decay: number; wet: number };
  delay: { enabled: boolean; time: number; feedback: number; wet: number };
  warmth: { enabled: boolean; drive: number; tone: number };
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
  { hz: 528, label: '528 Hz – DNA Repair', color: '#06b6d4' },
  { hz: 639, label: '639 Hz – Heart Coherence', color: '#3b82f6' },
  { hz: 741, label: '741 Hz – Awakening', color: '#6366f1' },
  { hz: 852, label: '852 Hz – Third Eye', color: '#8b5cf6' },
  { hz: 963, label: '963 Hz – Crown Activation', color: '#a855f7' },
];

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

export function useSoulMeditateEngine() {
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Layer nodes
  const neuralSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const neuralAudioRef = useRef<HTMLAudioElement | null>(null);
  const neuralGainRef = useRef<GainNode | null>(null);
  
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
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [neuralLayer, setNeuralLayer] = useState<LayerState>({ isPlaying: false, volume: 0.7, source: null });
  const [atmosphereLayer, setAtmosphereLayer] = useState<LayerState>({ isPlaying: false, volume: 0.4, source: null });
  const [frequencies, setFrequencies] = useState<FrequencyState>({
    solfeggio: { enabled: false, hz: 528 },
    binaural: { enabled: false, carrierHz: 200, beatHz: 6 },
  });
  const [frequencyVolume, setFrequencyVolume] = useState(0.15);
  const [dsp, setDSP] = useState<DSPSettings>({
    reverb: { enabled: true, decay: 2.5, wet: 0.3 },
    delay: { enabled: false, time: 0.4, feedback: 0.3, wet: 0.2 },
    warmth: { enabled: true, drive: 0.3, tone: 0.5 },
  });
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [analyserData, setAnalyserData] = useState<AnalyserData | null>(null);

  // Initialize audio context
  const initialize = useCallback(async () => {
    if (audioContextRef.current) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

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

    // Create layer gains
    neuralGainRef.current = ctx.createGain();
    neuralGainRef.current.gain.value = neuralLayer.volume;

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

    // Create delay
    delayNodeRef.current = ctx.createDelay(5);
    delayNodeRef.current.delayTime.value = dsp.delay.time;

    delayFeedbackRef.current = ctx.createGain();
    delayFeedbackRef.current.gain.value = dsp.delay.feedback;

    delayGainRef.current = ctx.createGain();
    delayGainRef.current.gain.value = dsp.delay.wet;

    // Delay feedback loop
    delayNodeRef.current.connect(delayFeedbackRef.current);
    delayFeedbackRef.current.connect(delayNodeRef.current);

    // Create warmth (waveshaper)
    waveShaperRef.current = ctx.createWaveShaper();
    (waveShaperRef.current as any).curve = createWarmthCurve(dsp.warmth.drive);
    waveShaperRef.current.oversample = '4x';

    warmthGainRef.current = ctx.createGain();
    warmthGainRef.current.gain.value = 1;

    // Connect DSP chain
    // Dry signals -> analyser
    neuralGainRef.current.connect(analyser);
    atmosphereGainRef.current.connect(analyser);
    solfeggioGainRef.current.connect(analyser);
    binauralGainRef.current.connect(analyser);

    // Analyser -> warmth -> master
    analyser.connect(waveShaperRef.current);
    waveShaperRef.current.connect(masterGain);

    // Parallel reverb
    analyser.connect(convolver);
    convolver.connect(reverbGainRef.current);
    reverbGainRef.current.connect(masterGain);

    // Parallel delay
    analyser.connect(delayNodeRef.current);
    delayNodeRef.current.connect(delayGainRef.current);
    delayGainRef.current.connect(masterGain);

    setIsInitialized(true);
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
    // Auto-initialize if needed
    if (!audioContextRef.current) {
      await initialize();
    }
    
    // Wait for refs to be available after initialization
    if (!audioContextRef.current || !neuralGainRef.current) {
      console.error('Failed to initialize audio context');
      return false;
    }

    // Clean up previous
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

    // Create source node
    const source = audioContextRef.current.createMediaElementSource(audio);
    source.connect(neuralGainRef.current);
    neuralSourceRef.current = source;

    setNeuralLayer(prev => ({ ...prev, source: typeof file === 'string' ? file : file.name }));
    return true;
  }, [initialize]);

  // Load atmosphere
  const loadAtmosphere = useCallback(async (atmosphereId: string) => {
    // Auto-initialize if needed
    if (!audioContextRef.current) {
      await initialize();
    }
    
    if (!audioContextRef.current || !atmosphereGainRef.current) {
      console.error('Failed to initialize audio context');
      return false;
    }

    // For demo, we use placeholder - in production, load from storage
    const atmosphereUrls: Record<string, string> = {
      vedic: '/audio/atmospheres/vedic.mp3',
      shamanic: '/audio/atmospheres/shamanic.mp3',
      tibetan: '/audio/atmospheres/tibetan.mp3',
      ocean: '/audio/atmospheres/ocean.mp3',
      forest: '/audio/atmospheres/forest.mp3',
      cosmic: '/audio/atmospheres/cosmic.mp3',
      crystal: '/audio/atmospheres/crystal.mp3',
      zen: '/audio/atmospheres/zen.mp3',
    };

    if (atmosphereAudioRef.current) {
      atmosphereAudioRef.current.pause();
    }
    if (atmosphereSourceRef.current) {
      atmosphereSourceRef.current.disconnect();
      atmosphereSourceRef.current = null;
    }

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.src = atmosphereUrls[atmosphereId] || '';
    
    atmosphereAudioRef.current = audio;

    if (audio.src) {
      try {
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(atmosphereGainRef.current);
        atmosphereSourceRef.current = source;
      } catch (e) {
        console.log('Atmosphere audio not available - using placeholder');
      }
    }

    setAtmosphereLayer(prev => ({ ...prev, source: atmosphereId }));
    return true;
  }, [initialize]);

  // Play/pause neural layer
  const toggleNeuralPlay = useCallback(() => {
    if (!neuralAudioRef.current) return;
    
    if (neuralLayer.isPlaying) {
      neuralAudioRef.current.pause();
    } else {
      audioContextRef.current?.resume();
      neuralAudioRef.current.play().catch(console.error);
    }
    setNeuralLayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [neuralLayer.isPlaying]);

  // Play/pause atmosphere
  const toggleAtmospherePlay = useCallback(() => {
    if (!atmosphereAudioRef.current) return;
    
    if (atmosphereLayer.isPlaying) {
      atmosphereAudioRef.current.pause();
    } else {
      audioContextRef.current?.resume();
      atmosphereAudioRef.current.play().catch(console.error);
    }
    setAtmosphereLayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [atmosphereLayer.isPlaying]);

  // Start solfeggio oscillator
  const startSolfeggio = useCallback((hz: number) => {
    if (!audioContextRef.current || !solfeggioGainRef.current) return;

    // Stop existing
    if (solfeggioOscRef.current) {
      solfeggioOscRef.current.stop();
      solfeggioOscRef.current.disconnect();
    }

    const osc = audioContextRef.current.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz;
    osc.connect(solfeggioGainRef.current);
    osc.start();

    // Fade in
    solfeggioGainRef.current.gain.setTargetAtTime(frequencyVolume, audioContextRef.current.currentTime, 0.5);

    solfeggioOscRef.current = osc;
    setFrequencies(prev => ({ ...prev, solfeggio: { enabled: true, hz } }));
  }, [frequencyVolume]);

  // Stop solfeggio
  const stopSolfeggio = useCallback(() => {
    if (solfeggioOscRef.current && solfeggioGainRef.current && audioContextRef.current) {
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
  const startBinaural = useCallback((carrierHz: number, beatHz: number) => {
    if (!audioContextRef.current || !binauralGainRef.current || !binauralMergerRef.current) return;

    // Stop existing
    binauralLeftOscRef.current?.stop();
    binauralRightOscRef.current?.stop();

    const ctx = audioContextRef.current;
    
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

    // Fade in
    binauralGainRef.current.gain.setTargetAtTime(frequencyVolume, ctx.currentTime, 0.5);

    binauralLeftOscRef.current = leftOsc;
    binauralRightOscRef.current = rightOsc;

    setFrequencies(prev => ({ ...prev, binaural: { enabled: true, carrierHz, beatHz } }));
  }, [frequencyVolume]);

  // Stop binaural
  const stopBinaural = useCallback(() => {
    if (binauralGainRef.current && audioContextRef.current) {
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

  // Update volumes
  const updateNeuralVolume = useCallback((vol: number) => {
    if (neuralGainRef.current) {
      neuralGainRef.current.gain.value = vol;
    }
    setNeuralLayer(prev => ({ ...prev, volume: vol }));
  }, []);

  const updateAtmosphereVolume = useCallback((vol: number) => {
    if (atmosphereGainRef.current) {
      atmosphereGainRef.current.gain.value = vol;
    }
    setAtmosphereLayer(prev => ({ ...prev, volume: vol }));
  }, []);

  const updateFrequencyVolume = useCallback((vol: number) => {
    if (solfeggioGainRef.current && frequencies.solfeggio.enabled) {
      solfeggioGainRef.current.gain.value = vol;
    }
    if (binauralGainRef.current && frequencies.binaural.enabled) {
      binauralGainRef.current.gain.value = vol;
    }
    setFrequencyVolume(vol);
  }, [frequencies.solfeggio.enabled, frequencies.binaural.enabled]);

  const updateMasterVolume = useCallback((vol: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = vol;
    }
    setMasterVolume(vol);
  }, []);

  // Update DSP settings
  const updateDSP = useCallback((newDsp: Partial<DSPSettings>) => {
    setDSP(prev => {
      const updated = { ...prev, ...newDsp };

      // Apply reverb changes
      if (newDsp.reverb && reverbGainRef.current) {
        reverbGainRef.current.gain.value = updated.reverb.enabled ? updated.reverb.wet : 0;
      }

      // Apply delay changes
      if (newDsp.delay) {
        if (delayNodeRef.current) {
          delayNodeRef.current.delayTime.value = updated.delay.time;
        }
        if (delayFeedbackRef.current) {
          delayFeedbackRef.current.gain.value = updated.delay.feedback;
        }
        if (delayGainRef.current) {
          delayGainRef.current.gain.value = updated.delay.enabled ? updated.delay.wet : 0;
        }
      }

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

  return {
    // State
    isInitialized,
    neuralLayer,
    atmosphereLayer,
    frequencies,
    frequencyVolume,
    dsp,
    masterVolume,
    analyserData,
    
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
    updateFrequencyVolume,
    updateMasterVolume,
    updateDSP,
  };
}
