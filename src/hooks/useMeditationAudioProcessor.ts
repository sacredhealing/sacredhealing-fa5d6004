import { useRef, useState, useCallback, useEffect } from 'react';

interface AudioProcessingSettings {
  selectedFrequency: number | null;
  selectedBinaural: string;
  frequencyIntensity: number;
  volumeMix: number;
}

interface BinauralBeatConfig {
  baseFrequency: number;
  beatFrequency: number;
}

const binauralConfigs: Record<string, BinauralBeatConfig> = {
  delta: { baseFrequency: 200, beatFrequency: 2 },    // 0.5-4 Hz: Deep sleep
  theta: { baseFrequency: 200, beatFrequency: 6 },    // 4-8 Hz: Meditation
  alpha: { baseFrequency: 200, beatFrequency: 10 },   // 8-12 Hz: Relaxation
  beta: { baseFrequency: 200, beatFrequency: 20 },    // 12-30 Hz: Focus
  gamma: { baseFrequency: 200, beatFrequency: 40 },   // 30-100 Hz: Peak awareness
};

export function useMeditationAudioProcessor() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const binauralGainRef = useRef<GainNode | null>(null);
  const frequencyGainRef = useRef<GainNode | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const frequencyOscRef = useRef<OscillatorNode | null>(null);
  const pannerLeftRef = useRef<StereoPannerNode | null>(null);
  const pannerRightRef = useRef<StereoPannerNode | null>(null);
  const isInitializedRef = useRef(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<AudioProcessingSettings | null>(null);

  // Initialize audio context
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Connect audio element to processing chain
  const connectAudioElement = useCallback((audioElement: HTMLAudioElement) => {
    const ctx = initializeAudioContext();
    
    // Only create source node once per audio element
    if (!sourceNodeRef.current) {
      try {
        sourceNodeRef.current = ctx.createMediaElementSource(audioElement);
      } catch (e) {
        // Already connected, just return
        return;
      }
    }

    // Create main gain node for the original audio
    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }

    // Connect source to gain
    sourceNodeRef.current.connect(gainNodeRef.current);
    isInitializedRef.current = true;
  }, [initializeAudioContext]);

  // Create binaural beat oscillators
  const startBinauralBeats = useCallback((binauralType: string, intensity: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Stop existing oscillators
    stopBinauralBeats();

    const config = binauralConfigs[binauralType] || binauralConfigs.theta;
    const leftFreq = config.baseFrequency;
    const rightFreq = config.baseFrequency + config.beatFrequency;

    // Create gain node for binaural beats
    binauralGainRef.current = ctx.createGain();
    binauralGainRef.current.gain.value = (intensity / 100) * 0.15; // Max 15% volume
    binauralGainRef.current.connect(ctx.destination);

    // Create left oscillator (goes to left ear)
    leftOscRef.current = ctx.createOscillator();
    leftOscRef.current.type = 'sine';
    leftOscRef.current.frequency.value = leftFreq;

    // Create right oscillator (goes to right ear)
    rightOscRef.current = ctx.createOscillator();
    rightOscRef.current.type = 'sine';
    rightOscRef.current.frequency.value = rightFreq;

    // Create stereo panners
    pannerLeftRef.current = ctx.createStereoPanner();
    pannerLeftRef.current.pan.value = -1; // Full left

    pannerRightRef.current = ctx.createStereoPanner();
    pannerRightRef.current.pan.value = 1; // Full right

    // Connect: osc -> panner -> gain -> destination
    leftOscRef.current.connect(pannerLeftRef.current);
    pannerLeftRef.current.connect(binauralGainRef.current);

    rightOscRef.current.connect(pannerRightRef.current);
    pannerRightRef.current.connect(binauralGainRef.current);

    // Start oscillators
    leftOscRef.current.start();
    rightOscRef.current.start();
  }, []);

  // Stop binaural beats
  const stopBinauralBeats = useCallback(() => {
    try {
      if (leftOscRef.current) {
        leftOscRef.current.stop();
        leftOscRef.current.disconnect();
        leftOscRef.current = null;
      }
      if (rightOscRef.current) {
        rightOscRef.current.stop();
        rightOscRef.current.disconnect();
        rightOscRef.current = null;
      }
      if (binauralGainRef.current) {
        binauralGainRef.current.disconnect();
        binauralGainRef.current = null;
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
  }, []);

  // Start healing frequency tone
  const startHealingFrequency = useCallback((frequency: number, intensity: number) => {
    const ctx = audioContextRef.current;
    if (!ctx || !frequency) return;

    // Stop existing frequency
    stopHealingFrequency();

    // Create gain node for healing frequency
    frequencyGainRef.current = ctx.createGain();
    frequencyGainRef.current.gain.value = (intensity / 100) * 0.1; // Max 10% volume
    frequencyGainRef.current.connect(ctx.destination);

    // Create oscillator for the healing frequency
    frequencyOscRef.current = ctx.createOscillator();
    frequencyOscRef.current.type = 'sine';
    frequencyOscRef.current.frequency.value = frequency;

    frequencyOscRef.current.connect(frequencyGainRef.current);
    frequencyOscRef.current.start();
  }, []);

  // Stop healing frequency
  const stopHealingFrequency = useCallback(() => {
    try {
      if (frequencyOscRef.current) {
        frequencyOscRef.current.stop();
        frequencyOscRef.current.disconnect();
        frequencyOscRef.current = null;
      }
      if (frequencyGainRef.current) {
        frequencyGainRef.current.disconnect();
        frequencyGainRef.current = null;
      }
    } catch (e) {
      // Ignore errors during cleanup
    }
  }, []);

  // Update volume mix
  const updateVolumeMix = useCallback((mix: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = mix / 100;
    }
  }, []);

  // Start processing with all settings
  const startProcessing = useCallback((
    audioElement: HTMLAudioElement,
    settings: AudioProcessingSettings
  ) => {
    const ctx = initializeAudioContext();
    
    // Resume context if suspended (required for Chrome autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Connect audio element if not already connected
    if (!isInitializedRef.current) {
      connectAudioElement(audioElement);
    }

    // Apply settings
    setCurrentSettings(settings);
    setIsProcessing(true);

    // Set volume mix for original audio
    updateVolumeMix(settings.volumeMix);

    // Start binaural beats
    if (settings.selectedBinaural) {
      startBinauralBeats(settings.selectedBinaural, settings.frequencyIntensity);
    }

    // Start healing frequency
    if (settings.selectedFrequency) {
      startHealingFrequency(settings.selectedFrequency, settings.frequencyIntensity);
    }
  }, [initializeAudioContext, connectAudioElement, updateVolumeMix, startBinauralBeats, startHealingFrequency]);

  // Stop all processing
  const stopProcessing = useCallback(() => {
    stopBinauralBeats();
    stopHealingFrequency();
    setIsProcessing(false);
  }, [stopBinauralBeats, stopHealingFrequency]);

  // Update settings in real-time
  const updateSettings = useCallback((settings: Partial<AudioProcessingSettings>) => {
    if (!isProcessing || !currentSettings) return;

    const newSettings = { ...currentSettings, ...settings };
    setCurrentSettings(newSettings);

    if (settings.volumeMix !== undefined) {
      updateVolumeMix(settings.volumeMix);
    }

    if (settings.frequencyIntensity !== undefined) {
      if (binauralGainRef.current) {
        binauralGainRef.current.gain.value = (settings.frequencyIntensity / 100) * 0.15;
      }
      if (frequencyGainRef.current) {
        frequencyGainRef.current.gain.value = (settings.frequencyIntensity / 100) * 0.1;
      }
    }

    if (settings.selectedBinaural !== undefined) {
      stopBinauralBeats();
      startBinauralBeats(settings.selectedBinaural, newSettings.frequencyIntensity);
    }

    if (settings.selectedFrequency !== undefined) {
      stopHealingFrequency();
      if (settings.selectedFrequency) {
        startHealingFrequency(settings.selectedFrequency, newSettings.frequencyIntensity);
      }
    }
  }, [isProcessing, currentSettings, updateVolumeMix, stopBinauralBeats, startBinauralBeats, stopHealingFrequency, startHealingFrequency]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopProcessing]);

  return {
    isProcessing,
    currentSettings,
    startProcessing,
    stopProcessing,
    updateSettings,
    initializeAudioContext,
  };
}
