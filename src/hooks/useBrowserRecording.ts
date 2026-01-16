import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecordingState {
  isRecording: boolean;
  progress: number; // 0-100
  elapsedSeconds: number;
  status: 'idle' | 'recording' | 'uploading' | 'mastering' | 'completed' | 'failed';
  statusMessage: string;
  resultUrl: string | null;
  error: string | null;
}

interface RecordingOptions {
  durationSeconds: number;
  onProgress?: (progress: number, elapsed: number) => void;
}

export function useBrowserRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    progress: 0,
    elapsedSeconds: 0,
    status: 'idle',
    statusMessage: '',
    resultUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  /**
   * Start recording from an AudioContext's master output.
   * Connect your master gain/analyser to the returned destination node.
   */
  const startRecording = useCallback((
    audioContext: AudioContext,
    masterNode: AudioNode,
    options: RecordingOptions
  ): MediaStreamAudioDestinationNode | null => {
    try {
      // Create destination node
      const destination = audioContext.createMediaStreamDestination();
      destinationRef.current = destination;

      // Connect master output to destination
      masterNode.connect(destination);

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      // Create MediaRecorder
      const recorder = new MediaRecorder(destination.stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();

      setState({
        isRecording: true,
        progress: 0,
        elapsedSeconds: 0,
        status: 'recording',
        statusMessage: 'Recording meditation (keep tab open)…',
        resultUrl: null,
        error: null,
      });

      // Progress interval
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const progress = Math.min(100, (elapsed / options.durationSeconds) * 100);

        setState(prev => ({
          ...prev,
          elapsedSeconds: elapsed,
          progress,
          statusMessage: `Recording: ${formatTime(elapsed)} / ${formatTime(options.durationSeconds)}`,
        }));

        options.onProgress?.(progress, elapsed);

        // Auto-stop when duration reached
        if (elapsed >= options.durationSeconds) {
          stopRecording();
        }
      }, 500);

      return destination;
    } catch (err) {
      console.error('[useBrowserRecording] Start error:', err);
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Failed to start recording',
        statusMessage: 'Recording failed',
      }));
      return null;
    }
  }, []);

  /**
   * Stop recording and return the audio Blob
   */
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];

        // Disconnect destination
        if (destinationRef.current) {
          try {
            destinationRef.current.disconnect();
          } catch {}
          destinationRef.current = null;
        }

        setState(prev => ({
          ...prev,
          isRecording: false,
          progress: 100,
          status: 'uploading',
          statusMessage: 'Uploading audio…',
        }));

        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  /**
   * Upload recorded audio to Supabase storage
   */
  const uploadRecording = useCallback(async (blob: Blob, jobId: string): Promise<string | null> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not authenticated');

      const ext = blob.type.includes('webm') ? 'webm' : 'mp4';
      const fileName = `${jobId}.${ext}`;
      const storagePath = `creative-soul-exports/${auth.user.id}/${fileName}`;

      setState(prev => ({
        ...prev,
        status: 'uploading',
        statusMessage: 'Uploading recorded audio…',
      }));

      const { error: uploadError } = await supabase.storage
        .from('creative-soul-library')
        .upload(storagePath, blob, {
          upsert: true,
          contentType: blob.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('creative-soul-library')
        .getPublicUrl(storagePath);

      return data.publicUrl;
    } catch (err) {
      console.error('[useBrowserRecording] Upload error:', err);
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: 'Failed to upload recording',
        statusMessage: 'Upload failed',
      }));
      return null;
    }
  }, []);

  /**
   * Send audio to LANDR for mastering via edge function
   */
  const masterWithLandr = useCallback(async (
    jobId: string,
    audioUrl: string,
    preset: string = 'meditation_warm'
  ): Promise<string | null> => {
    try {
      setState(prev => ({
        ...prev,
        status: 'mastering',
        statusMessage: 'Mastering with LANDR…',
        progress: 70,
      }));

      const { data, error } = await supabase.functions.invoke('landr-master-meditation', {
        body: { job_id: jobId, audio_url: audioUrl, preset },
      });

      if (error) {
        console.warn('[useBrowserRecording] LANDR error:', error);
        // Return original URL if LANDR fails
        return audioUrl;
      }

      if (data?.result_url) {
        setState(prev => ({
          ...prev,
          progress: 100,
          status: 'completed',
          statusMessage: 'Complete!',
          resultUrl: data.result_url,
        }));
        return data.result_url;
      }

      // LANDR didn't return a result, use original
      return audioUrl;
    } catch (err) {
      console.warn('[useBrowserRecording] LANDR exception:', err);
      // Return original URL on failure
      return audioUrl;
    }
  }, []);

  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (destinationRef.current) {
      try {
        destinationRef.current.disconnect();
      } catch {}
      destinationRef.current = null;
    }

    chunksRef.current = [];
    
    setState({
      isRecording: false,
      progress: 0,
      elapsedSeconds: 0,
      status: 'idle',
      statusMessage: '',
      resultUrl: null,
      error: null,
    });
  }, []);

  /**
   * Mark completion with a result URL
   */
  const markCompleted = useCallback((resultUrl: string) => {
    setState(prev => ({
      ...prev,
      status: 'completed',
      progress: 100,
      statusMessage: 'Complete!',
      resultUrl,
      error: null,
    }));
  }, []);

  /**
   * Mark as failed
   */
  const markFailed = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'failed',
      statusMessage: error,
      error,
    }));
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    uploadRecording,
    masterWithLandr,
    cancelRecording,
    markCompleted,
    markFailed,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
