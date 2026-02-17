import { useState, useRef, useCallback } from 'react';

export interface VoiceRecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  /** Live waveform bars (0..1). */
  waveform: number[];
  error: string | null;
}

export const useVoiceRecorder = () => {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    waveform: Array.from({ length: 24 }, () => 0.15),
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastWaveformUpdateMsRef = useRef<number>(0);

  const stopWaveform = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  const startWaveform = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);
      const bars = 24;

      const tick = (t: number) => {
        rafRef.current = requestAnimationFrame(tick);
        if (!analyserRef.current) return;

        // Throttle state updates (~30fps) for perf
        if (t - lastWaveformUpdateMsRef.current < 33) return;
        lastWaveformUpdateMsRef.current = t;

        analyserRef.current.getByteTimeDomainData(buffer);

        // Convert time-domain to normalized amplitudes (0..1)
        const next = new Array(bars).fill(0).map((_, i) => {
          const start = Math.floor((i / bars) * buffer.length);
          const end = Math.floor(((i + 1) / bars) * buffer.length);
          let sum = 0;
          for (let j = start; j < end; j++) {
            const v = (buffer[j] - 128) / 128; // -1..1
            sum += Math.abs(v);
          }
          const avg = sum / Math.max(1, end - start); // 0..1-ish
          // Clamp and add a base so silence is still visible
          return Math.min(1, Math.max(0.12, avg * 1.8));
        });

        setState((prev) => ({ ...prev, waveform: next }));
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // If waveform fails, recording still works.
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveform(stream);
      
      // Use WebM format (better browser support) or fallback to default
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
        ? 'audio/ogg'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false
        }));

        stopWaveform();

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.onerror = (event) => {
        setState(prev => ({
          ...prev,
          error: 'Recording error occurred',
          isRecording: false
        }));
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        waveform: Array.from({ length: 24 }, () => 0.15),
        error: null
      }));

      // Update duration every 100ms
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: elapsed }));
      }, 100);

    } catch (error: any) {
      stopWaveform();
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start recording',
        isRecording: false
      }));
    }
  }, [startWaveform, stopWaveform]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [state.isRecording]);

  const reset = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    stopWaveform();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setState({
      isRecording: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      waveform: Array.from({ length: 24 }, () => 0.15),
      error: null
    });
    audioChunksRef.current = [];
  }, [state.audioUrl, stopWaveform]);

  return {
    ...state,
    startRecording,
    stopRecording,
    reset
  };
};
