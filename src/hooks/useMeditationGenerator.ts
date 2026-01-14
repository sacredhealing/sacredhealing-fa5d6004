import { useRef, useState, useCallback, useEffect } from 'react';

export type MeditationStyleType =
  | "indian"
  | "shamanic"
  | "mystic"
  | "tibetan"
  | "sufi"
  | "zen"
  | "nature"
  | "ocean"
  | "sound_bath"
  | "chakra"
  | "higher_consciousness"
  | "relaxing"
  | "forest"
  | "breath_focus"
  | "kundalini";

interface MeditationGeneratorSettings {
  style: MeditationStyleType;
  healingFrequency: number | null;
  binauralType: string | null;
  binauralCarrier: number;
  ambientVolume: number;
  binauralVolume: number;
  frequencyVolume: number;
}

interface AudioNodes {
  ambient: OscillatorNode[];
  binauralLeft: OscillatorNode | null;
  binauralRight: OscillatorNode | null;
  healingFreq: OscillatorNode | null;
  gains: GainNode[];
  panners: StereoPannerNode[];
  filters: BiquadFilterNode[];
  lfos: OscillatorNode[];
}

const BINAURAL_CONFIGS: Record<string, { carrier: number; beat: number }> = {
  delta: { carrier: 200, beat: 2 },
  theta: { carrier: 200, beat: 6 },
  alpha: { carrier: 200, beat: 10 },
  beta: { carrier: 200, beat: 20 },
  gamma: { carrier: 200, beat: 40 },
};

export function useMeditationGenerator() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNodes>({
    ambient: [],
    binauralLeft: null,
    binauralRight: null,
    healingFreq: null,
    gains: [],
    panners: [],
    filters: [],
    lfos: [],
  });
  const masterGainRef = useRef<GainNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const binauralGainRef = useRef<GainNode | null>(null);
  const frequencyGainRef = useRef<GainNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<MeditationGeneratorSettings | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Cleanup all audio nodes
  const cleanupNodes = useCallback(() => {
    const nodes = nodesRef.current;
    
    // Stop and disconnect all oscillators
    [...nodes.ambient, ...nodes.lfos].forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) { /* ignore */ }
    });

    [nodes.binauralLeft, nodes.binauralRight, nodes.healingFreq].forEach(osc => {
      if (osc) {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) { /* ignore */ }
      }
    });

    // Disconnect gains, panners, filters
    [...nodes.gains, ...nodes.panners, ...nodes.filters].forEach(node => {
      try { node.disconnect(); } catch (e) { /* ignore */ }
    });

    nodesRef.current = {
      ambient: [],
      binauralLeft: null,
      binauralRight: null,
      healingFreq: null,
      gains: [],
      panners: [],
      filters: [],
      lfos: [],
    };
  }, []);

  // Create noise buffer
  const createNoiseBuffer = useCallback((ctx: AudioContext, duration: number, type: 'white' | 'pink' | 'brown' = 'white') => {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        
        if (type === 'white') {
          data[i] = white * 0.5;
        } else if (type === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else { // brown
          data[i] = (b0 = (b0 + (0.02 * white)) / 1.02) * 3.5;
        }
      }
    }
    return buffer;
  }, []);

  // Create Tanpura drone (Indian)
  const createTanpuraDrone = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const rootHz = 130.81; // C3
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    // Root, 5th, and octave
    [rootHz, rootHz * 1.5, rootHz * 2, rootHz * 3].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Add slight vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.1 + Math.random() * 0.1;
      lfoGain.gain.value = freq * 0.003;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      nodesRef.current.lfos.push(lfo);
      
      gain.gain.value = volume * (i === 0 ? 0.4 : 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      gains.push(gain);
    });
    
    nodesRef.current.ambient.push(...oscillators);
    nodesRef.current.gains.push(...gains);
  }, []);

  // Create Tibetan bowls
  const createTibetanBowls = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const bowlFreqs = [293.66, 440, 587.33, 783.99]; // D4, A4, D5, G5
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    bowlFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // AM modulation for shimmer
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.5 + i * 0.2;
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      nodesRef.current.lfos.push(lfo);
      
      gain.gain.value = volume * 0.15;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      gains.push(gain);
    });
    
    nodesRef.current.ambient.push(...oscillators);
    nodesRef.current.gains.push(...gains);
  }, []);

  // Create ocean waves
  const createOceanWaves = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const noiseBuffer = createNoiseBuffer(ctx, 10, 'brown');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.3;
    
    // LFO for wave motion
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05; // 20 second wave cycle
    lfoGain.gain.value = volume * 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    
    nodesRef.current.lfos.push(lfo);
    nodesRef.current.filters.push(filter);
    nodesRef.current.gains.push(gain);
    // Treat buffer source like oscillator for cleanup
    (source as any).stop = source.stop.bind(source);
    nodesRef.current.ambient.push(source as any);
  }, [createNoiseBuffer]);

  // Create forest ambience
  const createForestAmbience = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    // Wind (pink noise)
    const noiseBuffer = createNoiseBuffer(ctx, 10, 'pink');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.15;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    
    nodesRef.current.filters.push(filter);
    nodesRef.current.gains.push(gain);
    nodesRef.current.ambient.push(source as any);
    
    // Bird chirps (high sine oscillators with random timing)
    const birdGain = ctx.createGain();
    birdGain.gain.value = 0;
    birdGain.connect(masterGain);
    
    const birdOsc = ctx.createOscillator();
    birdOsc.type = 'sine';
    birdOsc.frequency.value = 2000;
    birdOsc.connect(birdGain);
    birdOsc.start();
    
    // Create chirp pattern
    const chirpLFO = ctx.createOscillator();
    const chirpLFOGain = ctx.createGain();
    chirpLFO.frequency.value = 0.3;
    chirpLFOGain.gain.value = volume * 0.05;
    chirpLFO.connect(chirpLFOGain);
    chirpLFOGain.connect(birdGain.gain);
    chirpLFO.start();
    
    nodesRef.current.ambient.push(birdOsc);
    nodesRef.current.lfos.push(chirpLFO);
    nodesRef.current.gains.push(birdGain);
  }, [createNoiseBuffer]);

  // Create shamanic drums
  const createShamanicDrums = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const drumOsc = ctx.createOscillator();
    drumOsc.type = 'sine';
    drumOsc.frequency.value = 60; // Low drum frequency
    
    const drumGain = ctx.createGain();
    drumGain.gain.value = volume * 0.25;
    
    // Pulse LFO for drum beats
    const pulseLFO = ctx.createOscillator();
    const pulseGain = ctx.createGain();
    pulseLFO.frequency.value = 1.5; // ~90 BPM
    pulseLFO.type = 'square';
    pulseGain.gain.value = volume * 0.15;
    pulseLFO.connect(pulseGain);
    pulseGain.connect(drumGain.gain);
    pulseLFO.start();
    
    drumOsc.connect(drumGain);
    drumGain.connect(masterGain);
    drumOsc.start();
    
    nodesRef.current.ambient.push(drumOsc);
    nodesRef.current.lfos.push(pulseLFO);
    nodesRef.current.gains.push(drumGain, pulseGain);
  }, []);

  // Create crystal bowls (sound bath)
  const createCrystalBowls = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const bowlFreqs = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
    const oscillators: OscillatorNode[] = [];
    
    bowlFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Slow amplitude modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.2 + i * 0.1;
      lfoGain.gain.value = 0.4;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      nodesRef.current.lfos.push(lfo);
      
      gain.gain.value = volume * 0.12;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      nodesRef.current.gains.push(gain);
    });
    
    nodesRef.current.ambient.push(...oscillators);
  }, []);

  // Create ethereal pad (mystic)
  const createEtherealPad = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const baseFreq = 220; // A3
    const oscillators: OscillatorNode[] = [];
    
    // Detuned oscillators for rich pad sound
    [-5, 0, 5, 7, 12].forEach((detune, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 2 ? 'sine' : 'triangle';
      osc.frequency.value = baseFreq * Math.pow(2, detune / 12);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;
      
      gain.gain.value = volume * 0.08;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      nodesRef.current.gains.push(gain);
      nodesRef.current.filters.push(filter);
    });
    
    nodesRef.current.ambient.push(...oscillators);
  }, []);

  // Create breathing air (zen/minimal)
  const createBreathingAir = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const noiseBuffer = createNoiseBuffer(ctx, 10, 'white');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.3;
    
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.05;
    
    // Breathing rhythm LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1; // ~6 breaths per minute
    lfoGain.gain.value = volume * 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    
    nodesRef.current.lfos.push(lfo);
    nodesRef.current.filters.push(filter);
    nodesRef.current.gains.push(gain);
    nodesRef.current.ambient.push(source as any);
  }, [createNoiseBuffer]);

  // Create chakra tones
  const createChakraTones = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    // Chakra frequencies
    const chakraFreqs = [256, 288, 320, 341.3, 384, 426.7, 480]; // C, D, E, F, G, A, B
    const oscillators: OscillatorNode[] = [];
    
    chakraFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Gentle pulsing
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      nodesRef.current.lfos.push(lfo);
      
      gain.gain.value = volume * 0.06;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      nodesRef.current.gains.push(gain);
    });
    
    nodesRef.current.ambient.push(...oscillators);
  }, []);

  // Create ney flute sound (sufi)
  const createNeyFlute = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    // Breathy noise component
    const noiseBuffer = createNoiseBuffer(ctx, 5, 'white');
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 5;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = volume * 0.08;
    
    // Frequency modulation for expressive quality
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
    
    // Sine component
    const sineOsc = ctx.createOscillator();
    const sineGain = ctx.createGain();
    sineOsc.type = 'sine';
    sineOsc.frequency.value = 587; // D5
    sineGain.gain.value = volume * 0.1;
    sineOsc.connect(sineGain);
    sineGain.connect(masterGain);
    sineOsc.start();
    
    nodesRef.current.ambient.push(noise as any, sineOsc);
    nodesRef.current.lfos.push(lfo);
    nodesRef.current.filters.push(filter);
    nodesRef.current.gains.push(noiseGain, sineGain);
  }, [createNoiseBuffer]);

  // Create cosmic pad (higher consciousness)
  const createCosmicPad = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const baseFreq = 110; // A2
    const oscillators: OscillatorNode[] = [];
    
    // Very slow, layered oscillators
    [0, 7, 12, 19, 24].forEach((semitone, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = baseFreq * Math.pow(2, semitone / 12);
      
      // Very slow LFO for cosmic drift
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.02 + i * 0.01;
      lfoGain.gain.value = 0.4;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      nodesRef.current.lfos.push(lfo);
      
      gain.gain.value = volume * 0.07;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      nodesRef.current.gains.push(gain);
    });
    
    nodesRef.current.ambient.push(...oscillators);
  }, []);

  // Create relaxing pink noise
  const createRelaxingNoise = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    const noiseBuffer = createNoiseBuffer(ctx, 10, 'pink');
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.1;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    
    nodesRef.current.filters.push(filter);
    nodesRef.current.gains.push(gain);
    nodesRef.current.ambient.push(source as any);
  }, [createNoiseBuffer]);

  // Create kundalini drone
  const createKundaliniDrone = useCallback((ctx: AudioContext, masterGain: GainNode, volume: number) => {
    // Rising energy drone
    const baseFreq = 110;
    const oscillators: OscillatorNode[] = [];
    
    [0, 5, 12].forEach((semitone, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = baseFreq * Math.pow(2, semitone / 12);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400 + i * 100;
      
      // Slow rising LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.03;
      lfoGain.gain.value = 100;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      nodesRef.current.lfos.push(lfo);
      
      gain.gain.value = volume * 0.08;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      nodesRef.current.gains.push(gain);
      nodesRef.current.filters.push(filter);
    });
    
    nodesRef.current.ambient.push(...oscillators);
  }, []);

  // Style to generator mapping
  const styleGenerators: Record<MeditationStyleType, (ctx: AudioContext, gain: GainNode, vol: number) => void> = {
    indian: createTanpuraDrone,
    tibetan: createTibetanBowls,
    ocean: createOceanWaves,
    nature: createForestAmbience,
    forest: createForestAmbience,
    shamanic: createShamanicDrums,
    sound_bath: createCrystalBowls,
    mystic: createEtherealPad,
    zen: createBreathingAir,
    breath_focus: createBreathingAir,
    chakra: createChakraTones,
    sufi: createNeyFlute,
    higher_consciousness: createCosmicPad,
    relaxing: createRelaxingNoise,
    kundalini: createKundaliniDrone,
  };

  // Start playing
  const startPlaying = useCallback((settings: MeditationGeneratorSettings) => {
    const ctx = initializeAudioContext();
    cleanupNodes();

    // Create master gain
    masterGainRef.current = ctx.createGain();
    masterGainRef.current.gain.value = 0.8;
    masterGainRef.current.connect(ctx.destination);

    // Create ambient gain node
    ambientGainRef.current = ctx.createGain();
    ambientGainRef.current.gain.value = settings.ambientVolume / 100;
    ambientGainRef.current.connect(masterGainRef.current);

    // Generate ambient sound based on style
    const generator = styleGenerators[settings.style];
    if (generator) {
      generator(ctx, ambientGainRef.current, settings.ambientVolume / 100);
    }

    // Create binaural beats if enabled
    if (settings.binauralType) {
      const config = BINAURAL_CONFIGS[settings.binauralType] || BINAURAL_CONFIGS.theta;
      const carrier = settings.binauralCarrier || config.carrier;
      
      binauralGainRef.current = ctx.createGain();
      binauralGainRef.current.gain.value = (settings.binauralVolume / 100) * 0.15;
      binauralGainRef.current.connect(masterGainRef.current);

      // Left ear oscillator
      const leftOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      leftOsc.frequency.value = carrier;
      const leftPanner = ctx.createStereoPanner();
      leftPanner.pan.value = -1;
      leftOsc.connect(leftPanner);
      leftPanner.connect(binauralGainRef.current);
      leftOsc.start();
      nodesRef.current.binauralLeft = leftOsc;
      nodesRef.current.panners.push(leftPanner);

      // Right ear oscillator
      const rightOsc = ctx.createOscillator();
      rightOsc.type = 'sine';
      rightOsc.frequency.value = carrier + config.beat;
      const rightPanner = ctx.createStereoPanner();
      rightPanner.pan.value = 1;
      rightOsc.connect(rightPanner);
      rightPanner.connect(binauralGainRef.current);
      rightOsc.start();
      nodesRef.current.binauralRight = rightOsc;
      nodesRef.current.panners.push(rightPanner);
    }

    // Create healing frequency if enabled
    if (settings.healingFrequency) {
      frequencyGainRef.current = ctx.createGain();
      frequencyGainRef.current.gain.value = (settings.frequencyVolume / 100) * 0.1;
      frequencyGainRef.current.connect(masterGainRef.current);

      const freqOsc = ctx.createOscillator();
      freqOsc.type = 'sine';
      freqOsc.frequency.value = settings.healingFrequency;
      freqOsc.connect(frequencyGainRef.current);
      freqOsc.start();
      nodesRef.current.healingFreq = freqOsc;
    }

    setCurrentSettings(settings);
    setIsPlaying(true);
  }, [initializeAudioContext, cleanupNodes, styleGenerators]);

  // Stop playing
  const stopPlaying = useCallback(() => {
    cleanupNodes();
    setIsPlaying(false);
    setCurrentSettings(null);
  }, [cleanupNodes]);

  // Update volumes in real-time
  const updateVolume = useCallback((type: 'ambient' | 'binaural' | 'frequency', value: number) => {
    if (type === 'ambient' && ambientGainRef.current) {
      ambientGainRef.current.gain.value = value / 100;
    }
    if (type === 'binaural' && binauralGainRef.current) {
      binauralGainRef.current.gain.value = (value / 100) * 0.15;
    }
    if (type === 'frequency' && frequencyGainRef.current) {
      frequencyGainRef.current.gain.value = (value / 100) * 0.1;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;

    const dest = ctx.createMediaStreamDestination();
    masterGainRef.current.connect(dest);

    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingDuration(0);
  }, []);

  // Stop recording and return blob
  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(new Blob([]));
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
      mediaRecorderRef.current = null;
    });
  }, []);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupNodes();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanupNodes]);

  return {
    isPlaying,
    isRecording,
    recordingDuration,
    currentSettings,
    startPlaying,
    stopPlaying,
    updateVolume,
    startRecording,
    stopRecording,
  };
}
