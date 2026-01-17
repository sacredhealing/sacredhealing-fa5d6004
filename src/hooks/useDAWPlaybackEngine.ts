/**
 * DAW Playback Engine - Quantum Sync Architecture
 * Bridges timeline clip state with real-time audio scheduling
 * Ensures cuts, moves, and trims are reflected instantly in playback
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { AudioClip } from '@/components/soulmeditate/ClipTimeline';
import { supabase } from '@/integrations/supabase/client';

// Engine configuration constants
const ENGINE_CONFIG = {
  SAMPLE_RATE: 44100,
  COMPRESSOR: { threshold: -12, ratio: 12, knee: 5, attack: 0.003, release: 0.25 },
  COEFFS: {
    AMBIENT: 0.5,
    VOCAL: 1.8,
    HEALING: 0.15,
    BINAURAL: 0.25,
    REVERB: 0.6,
    DELAY: 0.4,
    WARMTH_BASE: 0.8,
    WARMTH_RANGE: 1.0
  }
};

// EQ settings for vocal chain
interface EQSettings {
  lowCut: boolean;
  boxyGain: number;
  presenceGain: number;
  airGain: number;
}

// Active shard tracking for dirty-state detection
interface ActiveShard {
  id: string;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
  trimStart: number;
  trimEnd: number;
  scheduledAt: number;
}

// Clip buffer cache
interface BufferCacheEntry {
  buffer: AudioBuffer;
  url: string;
  timestamp: number;
}

export interface DAWSettings {
  volumes: {
    ambient: number;
    user: number;
    healing: number;
    binaural: number;
    master: number;
  };
  fx: {
    reverb: number;
    delay: number;
    warmth: number;
  };
  healingFreq: number;
  binaural: {
    enabled: boolean;
    carrierFrequency: number;
    targetFrequency: number;
  };
  eq: EQSettings;
}

export function useDAWPlaybackEngine() {
  // Audio context and master chain
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  
  // Layer gain nodes
  const styleGainRef = useRef<GainNode | null>(null);
  const userAudioGainRef = useRef<GainNode | null>(null);
  const quantumToneGainRef = useRef<GainNode | null>(null);
  const binauralGainRef = useRef<GainNode | null>(null);
  
  // DSP nodes
  const reverbGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const warmthGainRef = useRef<GainNode | null>(null);
  const warmthShaperRef = useRef<WaveShaperNode | null>(null);
  
  // Oscillators
  const quantumOscRef = useRef<OscillatorNode | null>(null);
  const binauralOscLeftRef = useRef<OscillatorNode | null>(null);
  const binauralOscRightRef = useRef<OscillatorNode | null>(null);
  
  // Active sources (for surgical re-scheduling)
  const activeShardsRef = useRef<Map<string, ActiveShard>>(new Map());
  const bufferCacheRef = useRef<Map<string, BufferCacheEntry>>(new Map());
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentClipHash, setCurrentClipHash] = useState<string>('');
  
  // Playback timeline refs
  const playbackStartTimeRef = useRef<number>(0);
  const timelineOffsetRef = useRef<number>(0);

  // Generate hash from clips to detect changes
  const generateClipHash = useCallback((clips: AudioClip[]): string => {
    return clips.map(c => 
      `${c.id}:${c.startTime}:${c.trimStart}:${c.trimEnd}:${c.isMuted ? 1 : 0}`
    ).join('|');
  }, []);

  // Create tanh warmth curve
  const makeTanhCurve = useCallback((amount: number): Float32Array<ArrayBuffer> => {
    const n = 44100;
    const buffer = new ArrayBuffer(n * 4);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * amount);
    }
    return curve;
  }, []);

  // Create impulse response for reverb
  const createImpulseResponse = useCallback((ctx: AudioContext, duration: number, decay: number): AudioBuffer => {
    const sr = ctx.sampleRate;
    const len = sr * duration;
    const buffer = ctx.createBuffer(2, len, sr);
    for (let i = 0; i < 2; i++) {
      const data = buffer.getChannelData(i);
      for (let j = 0; j < len; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, decay);
      }
    }
    return buffer;
  }, []);

  // Create vocal EQ chain
  const createVocalChain = useCallback((ctx: AudioContext, eqSettings: EQSettings): AudioNode[] => {
    // High-pass filter (low cut)
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = eqSettings.lowCut ? 100 : 20;

    // Boxy reduction (400Hz)
    const boxy = ctx.createBiquadFilter();
    boxy.type = 'peaking';
    boxy.frequency.value = 400;
    boxy.Q.value = 1.0;
    boxy.gain.value = eqSettings.boxyGain;

    // Presence (4kHz)
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 4000;
    presence.Q.value = 0.8;
    presence.gain.value = eqSettings.presenceGain;

    // Air (10kHz+)
    const air = ctx.createBiquadFilter();
    air.type = 'highshelf';
    air.frequency.value = 10000;
    air.gain.value = eqSettings.airGain;

    // Limiter
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.ratio.value = 20;

    // Connect chain
    hpf.connect(boxy);
    boxy.connect(presence);
    presence.connect(air);
    air.connect(limiter);

    return [hpf, boxy, presence, air, limiter];
  }, []);

  // Initialize the audio engine
  const initialize = useCallback(async () => {
    if (ctxRef.current) return;

    const ctx = new AudioContext({ sampleRate: ENGINE_CONFIG.SAMPLE_RATE });
    if (ctx.state === 'suspended') await ctx.resume();
    ctxRef.current = ctx;

    // Create compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -3;
    compressor.ratio.value = 12;
    compressorRef.current = compressor;

    // Master gain
    const masterGain = ctx.createGain();
    masterGainRef.current = masterGain;

    // Analyzer
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 2048;
    analyzerRef.current = analyzer;

    // Warmth shaper
    const warmthShaper = ctx.createWaveShaper();
    warmthShaper.curve = makeTanhCurve(3);
    warmthShaperRef.current = warmthShaper;

    // Warmth gain
    const warmthGain = ctx.createGain();
    warmthGainRef.current = warmthGain;

    // Reverb (using convolver)
    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx, 3.5, 2.0);
    const reverbGain = ctx.createGain();
    reverbGainRef.current = reverbGain;

    // Delay
    const delayNode = ctx.createDelay(2.0);
    delayNodeRef.current = delayNode;
    const delayGain = ctx.createGain();
    delayGainRef.current = delayGain;

    // Layer gains
    styleGainRef.current = ctx.createGain();
    userAudioGainRef.current = ctx.createGain();
    quantumToneGainRef.current = ctx.createGain();
    binauralGainRef.current = ctx.createGain();

    // Quantum oscillator (healing frequency)
    const quantumOsc = ctx.createOscillator();
    quantumOsc.type = 'sine';
    quantumOsc.start();
    quantumOsc.connect(quantumToneGainRef.current);
    quantumOscRef.current = quantumOsc;

    // Connect routing
    const layers = [styleGainRef.current, userAudioGainRef.current, quantumToneGainRef.current, binauralGainRef.current];
    layers.forEach(n => n.connect(compressor));
    
    compressor.connect(warmthShaper);
    warmthShaper.connect(warmthGain);
    warmthGain.connect(masterGain);
    warmthGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
    warmthGain.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(masterGain);
    masterGain.connect(analyzer);
    analyzer.connect(ctx.destination);

    setIsInitialized(true);
    console.log('🎛️ DAW Playback Engine initialized');
  }, [makeTanhCurve, createImpulseResponse]);

  // Fetch and cache audio buffer
  const fetchBuffer = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    if (!ctxRef.current) return null;

    // Check cache
    const cached = bufferCacheRef.current.get(url);
    if (cached) return cached.buffer;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await ctxRef.current.decodeAudioData(arrayBuffer);
      
      // Cache it
      bufferCacheRef.current.set(url, {
        buffer,
        url,
        timestamp: Date.now()
      });
      
      return buffer;
    } catch (e) {
      console.error('Buffer fetch failed:', e);
      return null;
    }
  }, []);

  // Stop all active shards
  const stopAllShards = useCallback(() => {
    activeShardsRef.current.forEach(shard => {
      try {
        shard.gainNode.gain.linearRampToValueAtTime(0, (ctxRef.current?.currentTime || 0) + 0.05);
        setTimeout(() => {
          try { shard.source.stop(); } catch (e) {}
        }, 100);
      } catch (e) {}
    });
    activeShardsRef.current.clear();
  }, []);

  // Schedule clips (surgical scheduling)
  const scheduleClips = useCallback(async (
    clips: AudioClip[],
    clipUrlMap: Map<string, string>,
    timelinePosition: number,
    eqSettings: EQSettings
  ) => {
    if (!ctxRef.current || !userAudioGainRef.current) return;

    const ctx = ctxRef.current;
    const now = ctx.currentTime;

    // Stop existing shards
    stopAllShards();

    for (const clip of clips) {
      if (clip.isMuted) continue;

      const url = clipUrlMap.get(clip.id);
      if (!url) continue;

      const buffer = await fetchBuffer(url);
      if (!buffer) continue;

      // Calculate timing
      const clipStart = clip.startTime;
      const clipDuration = clip.duration - clip.trimStart - clip.trimEnd;
      const clipEnd = clipStart + clipDuration;

      // Skip clips that are entirely before the current position
      if (clipEnd <= timelinePosition) continue;

      // Calculate when this clip should start playing relative to now
      let scheduledTime = now;
      let bufferOffset = clip.trimStart;
      let playDuration = clipDuration;

      if (clipStart > timelinePosition) {
        // Clip starts in the future
        scheduledTime = now + (clipStart - timelinePosition);
      } else {
        // Clip is already in progress
        const elapsed = timelinePosition - clipStart;
        bufferOffset = clip.trimStart + elapsed;
        playDuration = clipDuration - elapsed;
      }

      if (playDuration <= 0) continue;

      // Create source
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Create gain for fades
      const gainNode = ctx.createGain();
      gainNode.gain.value = clip.volume;

      // Create EQ chain
      const eqChain = createVocalChain(ctx, eqSettings);
      source.connect(eqChain[0]);
      eqChain[eqChain.length - 1].connect(gainNode);
      gainNode.connect(userAudioGainRef.current!);

      // Schedule playback
      source.start(scheduledTime, bufferOffset, playDuration);

      // Track active shard
      activeShardsRef.current.set(clip.id, {
        id: clip.id,
        source,
        gainNode,
        startTime: clip.startTime,
        trimStart: clip.trimStart,
        trimEnd: clip.trimEnd,
        scheduledAt: scheduledTime
      });

      console.log(`🎵 Scheduled shard: ${clip.name} at ${scheduledTime.toFixed(2)}s, offset ${bufferOffset.toFixed(2)}s, duration ${playDuration.toFixed(2)}s`);
    }
  }, [stopAllShards, fetchBuffer, createVocalChain]);

  // Sync clips with dirty-state detection
  const syncClips = useCallback(async (
    clips: AudioClip[],
    clipUrlMap: Map<string, string>,
    timelinePosition: number,
    eqSettings: EQSettings,
    forceResync: boolean = false
  ) => {
    const newHash = generateClipHash(clips);
    
    if (!forceResync && newHash === currentClipHash && isPlaying) {
      // No changes, skip re-scheduling
      return;
    }

    setCurrentClipHash(newHash);
    await scheduleClips(clips, clipUrlMap, timelinePosition, eqSettings);
  }, [currentClipHash, isPlaying, generateClipHash, scheduleClips]);

  // Start playback
  const startPlayback = useCallback(async (
    clips: AudioClip[],
    clipUrlMap: Map<string, string>,
    timelinePosition: number,
    eqSettings: EQSettings
  ) => {
    if (!ctxRef.current) await initialize();

    if (ctxRef.current?.state === 'suspended') {
      await ctxRef.current.resume();
    }

    playbackStartTimeRef.current = ctxRef.current!.currentTime;
    timelineOffsetRef.current = timelinePosition;

    await syncClips(clips, clipUrlMap, timelinePosition, eqSettings, true);
    setIsPlaying(true);
    console.log('▶️ DAW Playback started');
  }, [initialize, syncClips]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    stopAllShards();
    setIsPlaying(false);
    console.log('⏹️ DAW Playback stopped');
  }, [stopAllShards]);

  // Update settings (volumes, fx, etc.)
  const updateSettings = useCallback((settings: Partial<DAWSettings>) => {
    if (!ctxRef.current) return;
    const now = ctxRef.current.currentTime;

    if (settings.volumes) {
      styleGainRef.current?.gain.setTargetAtTime(
        (settings.volumes.ambient / 100) * ENGINE_CONFIG.COEFFS.AMBIENT, now, 0.1
      );
      userAudioGainRef.current?.gain.setTargetAtTime(
        (settings.volumes.user / 100) * ENGINE_CONFIG.COEFFS.VOCAL, now, 0.1
      );
      quantumToneGainRef.current?.gain.setTargetAtTime(
        (settings.volumes.healing / 100) * ENGINE_CONFIG.COEFFS.HEALING, now, 0.1
      );
      binauralGainRef.current?.gain.setTargetAtTime(
        (settings.volumes.binaural / 100) * ENGINE_CONFIG.COEFFS.BINAURAL, now, 0.1
      );
      masterGainRef.current?.gain.setTargetAtTime(
        settings.volumes.master / 100, now, 0.1
      );
    }

    if (settings.fx) {
      reverbGainRef.current?.gain.setTargetAtTime(
        (settings.fx.reverb / 100) * ENGINE_CONFIG.COEFFS.REVERB, now, 0.1
      );
      delayGainRef.current?.gain.setTargetAtTime(
        (settings.fx.delay / 100) * ENGINE_CONFIG.COEFFS.DELAY, now, 0.1
      );
      warmthGainRef.current?.gain.setTargetAtTime(
        ENGINE_CONFIG.COEFFS.WARMTH_BASE + (settings.fx.warmth / 100) * ENGINE_CONFIG.COEFFS.WARMTH_RANGE, now, 0.1
      );
    }

    if (settings.healingFreq !== undefined) {
      quantumOscRef.current?.frequency.setTargetAtTime(settings.healingFreq, now, 0.2);
    }

    if (settings.binaural) {
      const { enabled, carrierFrequency, targetFrequency } = settings.binaural;
      if (enabled && !binauralOscLeftRef.current && ctxRef.current) {
        // Create binaural oscillators
        const ctx = ctxRef.current;
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);
        
        leftOsc.connect(merger, 0, 0);
        rightOsc.connect(merger, 0, 1);
        merger.connect(binauralGainRef.current!);
        
        leftOsc.start();
        rightOsc.start();
        
        binauralOscLeftRef.current = leftOsc;
        binauralOscRightRef.current = rightOsc;
      }
      
      binauralOscLeftRef.current?.frequency.setTargetAtTime(carrierFrequency, now, 0.2);
      binauralOscRightRef.current?.frequency.setTargetAtTime(carrierFrequency + targetFrequency, now, 0.2);
    }
  }, []);

  // Get analyzer data for visualization
  const getAnalyzerData = useCallback((array: Uint8Array<ArrayBuffer>) => {
    if (analyzerRef.current) {
      analyzerRef.current.getByteFrequencyData(array);
    }
  }, []);

  // Render master (offline export)
  const renderMaster = useCallback(async (
    clips: AudioClip[],
    clipUrlMap: Map<string, string>,
    settings: DAWSettings,
    durationSec: number = 300
  ): Promise<Blob> => {
    const offlineCtx = new OfflineAudioContext(2, ENGINE_CONFIG.SAMPLE_RATE * durationSec, ENGINE_CONFIG.SAMPLE_RATE);
    
    // Create compressor
    const offlineComp = offlineCtx.createDynamicsCompressor();
    offlineComp.threshold.value = -3;

    // Create vocal gain
    const vocalGain = offlineCtx.createGain();
    vocalGain.gain.setValueAtTime((settings.volumes.user / 100) * ENGINE_CONFIG.COEFFS.VOCAL, 0);

    // Healing frequency oscillator
    const osc = offlineCtx.createOscillator();
    const oscGain = offlineCtx.createGain();
    osc.frequency.setValueAtTime(settings.healingFreq, 0);
    oscGain.gain.setValueAtTime((settings.volumes.healing / 100) * ENGINE_CONFIG.COEFFS.HEALING, 0);
    osc.connect(oscGain).connect(offlineComp);
    osc.start(0);

    // Schedule all clips
    for (const clip of clips) {
      if (clip.isMuted) continue;
      
      const url = clipUrlMap.get(clip.id);
      if (!url) continue;

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await offlineCtx.decodeAudioData(arrayBuffer);
        
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        // Create EQ chain for offline context
        const hpf = offlineCtx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = settings.eq.lowCut ? 100 : 20;

        const boxy = offlineCtx.createBiquadFilter();
        boxy.type = 'peaking';
        boxy.frequency.value = 400;
        boxy.Q.value = 1.0;
        boxy.gain.value = settings.eq.boxyGain;

        const presence = offlineCtx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 4000;
        presence.Q.value = 0.8;
        presence.gain.value = settings.eq.presenceGain;

        const air = offlineCtx.createBiquadFilter();
        air.type = 'highshelf';
        air.frequency.value = 10000;
        air.gain.value = settings.eq.airGain;

        const limiter = offlineCtx.createDynamicsCompressor();
        limiter.threshold.value = -1;
        limiter.ratio.value = 20;

        source.connect(hpf);
        hpf.connect(boxy);
        boxy.connect(presence);
        presence.connect(air);
        air.connect(limiter);
        limiter.connect(vocalGain);
        vocalGain.connect(offlineComp);

        const playDuration = clip.duration - clip.trimStart - clip.trimEnd;
        if (playDuration > 0) {
          source.start(clip.startTime, clip.trimStart, playDuration);
        }
      } catch (e) {
        console.error('Render shard error:', e);
      }
    }

    offlineComp.connect(offlineCtx.destination);
    
    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
  }, []);

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + buffer.length * numChannels * 2);
    const view = new DataView(arrayBuffer);
    
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * numChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, buffer.length * numChannels * 2, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllShards();
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, [stopAllShards]);

  return {
    // State
    isInitialized,
    isPlaying,

    // Engine lifecycle
    initialize,
    startPlayback,
    stopPlayback,

    // Clip synchronization
    syncClips,
    stopAllShards,

    // Settings
    updateSettings,

    // Visualization
    getAnalyzerData,

    // Export
    renderMaster,

    // Direct access
    getAudioContext: () => ctxRef.current,
    getMasterGain: () => masterGainRef.current,
  };
}
