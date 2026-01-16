import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExportPayload {
  style_slug: string;
  frequency_hz: number;
  binaural: {
    enabled: boolean;
    beat_hz: number;
    carrier_hz: number;
    volume: number;
  };
  healing_frequency: {
    enabled: boolean;
    hz: number;
    volume: number;
  };
  stem?: {
    pre?: { enabled: boolean; action: string };
    post?: { enabled: boolean; stems: string[] };
  };
  /** Backend-fetchable URL (preferred when available) */
  source_audio_url?: string;
  /** Optional storage path for backend-side lookup/signing */
  upload_storage_path?: string;
  /** Mix levels */
  source_volume?: number;
  ambient_volume?: number;
  duration?: number;
}

export interface ExportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  progressStep: string;
  resultUrl: string | null;
  error: string | null;
}

export function useBackendExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // When workers cold-start, dispatch can fail transiently (e.g. 502). We auto-retry dispatch.
  const dispatchRetryRef = useRef<{
    jobId: string;
    attempts: number;
    nextAttemptAt: number;
  } | null>(null);

  const retryDispatch = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-creative-soul-job', {
        body: { job_id: jobId },
      });

      if (error) {
        console.warn('[useBackendExport] Dispatch retry failed:', error);
        return;
      }

      if (data?.dispatched) {
        // Nice to know, but don't spam users with toasts.
        console.log('[useBackendExport] Worker dispatch retry succeeded', { jobId });
      }
    } catch (err) {
      console.warn('[useBackendExport] Dispatch retry exception:', err);
    }
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('creative_soul_jobs')
        .select('status, progress, progress_step, result_url, error_message')
        .eq('job_id', jobId)
        .single();

      if (error) {
        console.error('Failed to poll job status:', error);
        return;
      }

      const job: ExportJob = {
        id: jobId,
        status: data.status as ExportJob['status'],
        progress: data.progress || 0,
        progressStep:
          data.progress_step ||
          (data.status === 'queued' ? 'Warming up renderer…' : 'Processing…'),
        resultUrl: data.result_url,
        error: data.error_message,
      };

      setCurrentJob(job);

      // Auto re-dispatch if worker didn't accept (cold-start 502, timeouts, etc.)
      if (job.status === 'queued') {
        const now = Date.now();
        const state = dispatchRetryRef.current;

        if (!state || state.jobId !== jobId) {
          // First time seeing this job
          dispatchRetryRef.current = {
            jobId,
            attempts: 0,
            nextAttemptAt: now + 8000,
          };
        } else if (state.attempts < 3 && now >= state.nextAttemptAt) {
          dispatchRetryRef.current = {
            ...state,
            attempts: state.attempts + 1,
            nextAttemptAt: now + (state.attempts + 1) * 12000,
          };
          retryDispatch(jobId);
        }

        // Hard stop: avoid "stuck forever" when worker is actually down.
        const startedAt = startedAtRef.current;
        const gaveUp = (dispatchRetryRef.current?.attempts ?? 0) >= 3;
        if (startedAt && gaveUp && now - startedAt > 90000) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setIsExporting(false);
          dispatchRetryRef.current = null;
          setCurrentJob({
            ...job,
            status: 'failed',
            progressStep: 'Renderer offline',
            error: job.error || 'Renderer did not respond. Please try again in a minute.',
          });
          toast.error('Renderer offline. Please try again shortly.');
          return;
        }
      }

      // Stop polling if completed or failed
      if (job.status === 'completed' || job.status === 'failed') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsExporting(false);
        dispatchRetryRef.current = null;

        if (job.status === 'completed' && job.resultUrl) {
          toast.success('Export complete! Ready to download.');
        } else if (job.status === 'failed') {
          toast.error(job.error || 'Export failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [retryDispatch]);

  // Start export job
  const startExport = useCallback(async (payload: ExportPayload): Promise<string | null> => {
    try {
      setIsExporting(true);
      setCurrentJob(null);
      startedAtRef.current = Date.now();

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to export');
        setIsExporting(false);
        return null;
      }

      // Build payload for backend function
      // NOTE: The backend function supports both the new nested payload and legacy top-level fields.
      // We send both so volumes/mix settings are honored.
      const requestPayload = {
        mode: 'paid', // Use paid mode for full export
        payload: {
          style_slug: payload.style_slug,
          frequency_hz: payload.frequency_hz,
          binaural: {
            enabled: payload.binaural.enabled,
            beat_hz: payload.binaural.beat_hz,
            carrier_hz: payload.binaural.carrier_hz,
          },
          stem: payload.stem,
          input: {
            direct_urls: payload.source_audio_url ? [payload.source_audio_url] : [],
            upload_storage_path: payload.upload_storage_path,
          },
          duration_seconds: payload.duration || 300,
          variants: 1,
          mastering: { enabled: true, preset: 'meditation_warm' },
        },
        // Legacy fields used by current backend mapping (mix levels)
        binaural_enabled: payload.binaural.enabled,
        binaural_volume: payload.binaural.volume,
        frequency_hz: payload.frequency_hz,
        frequency_enabled: payload.healing_frequency.enabled,
        frequency_volume: payload.healing_frequency.volume,
        ambient_volume: payload.ambient_volume,
        source_volume: payload.source_volume,
        duration: payload.duration || 300,
        enable_mastering: true,
      };

      toast.info('Starting backend rendering...');

      // Call backend function
      const { data, error } = await supabase.functions.invoke('convert-meditation-audio', {
        body: requestPayload,
      });

      if (error) {
        throw new Error(error.message || 'Failed to start export');
      }

      // convert-meditation-audio can now return success:true even if the worker is cold-starting.
      if (!data?.success || !data?.job_id) {
        throw new Error(data?.error || 'Export request failed');
      }

      const jobId = data.job_id as string;
      jobIdRef.current = jobId;
      dispatchRetryRef.current = {
        jobId,
        attempts: 0,
        nextAttemptAt: Date.now() + 8000,
      };

      setCurrentJob({
        id: jobId,
        status: (data.status as ExportJob['status']) || 'queued',
        progress: 0,
        progressStep: data.dispatched === false ? 'Warming up renderer…' : 'Job queued…',
        resultUrl: null,
        error: null,
      });

      toast.success('Export job started! Processing in background...');

      // Start polling
      pollingRef.current = setInterval(() => {
        pollJobStatus(jobId);
      }, 2000);

      // Initial poll
      pollJobStatus(jobId);

      return jobId;
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to start export');
      setIsExporting(false);
      dispatchRetryRef.current = null;
      return null;
    }
  }, [pollJobStatus]);

  // Cancel current job
  const cancelExport = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsExporting(false);
    setCurrentJob(null);
    jobIdRef.current = null;
    startedAtRef.current = null;
    dispatchRetryRef.current = null;
    toast.info('Export cancelled');
  }, []);

  // Download result
  const downloadResult = useCallback(async () => {
    if (!currentJob?.resultUrl) {
      toast.error('No download available');
      return;
    }

    try {
      // If it's a storage path, get public URL
      let downloadUrl = currentJob.resultUrl;

      if (downloadUrl.startsWith('creative-soul-outputs/')) {
        const { data } = supabase.storage
          .from('creative-soul-library')
          .getPublicUrl(downloadUrl);
        downloadUrl = data.publicUrl;
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `meditation-export-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download');
    }
  }, [currentJob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    isExporting,
    currentJob,
    startExport,
    cancelExport,
    downloadResult,
  };
}

