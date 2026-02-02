/**
 * Offline Export Hook - Orchestrates the Hybrid Render architecture
 * Renders audio offline, encodes to WAV, optionally converts to MP3 via Railway worker
 */

import { useState, useCallback, useRef } from 'react';
import { renderOffline, OfflineRenderConfig, DSPSettings } from '@/utils/offlineAudioRenderer';
import { audioBufferToWav } from '@/utils/wavEncoder';
import { sanitizeUrl } from '@/utils/sanitizeUrl';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExportProgress {
  percent: number;
  step: string;
  isExporting: boolean;
}

export interface ExportResult {
  blob: Blob;
  format: 'wav' | 'mp3';
  durationSeconds: number;
  url: string;
}

export interface ExportConfig {
  durationSeconds: number;
  neuralAudioUrl?: string;
  neuralSourceVolume?: number;
  atmosphereAudioUrl?: string;
  atmosphereVolume?: number;
  solfeggioHz?: number;
  solfeggioVolume?: number;
  binauralCarrierHz?: number;
  binauralBeatHz?: number;
  binauralVolume?: number;
  dsp: DSPSettings;
  masterVolume: number;
}

export function useOfflineExport() {
  const [progress, setProgress] = useState<ExportProgress>({
    percent: 0,
    step: '',
    isExporting: false
  });
  const abortRef = useRef(false);

  const exportMeditation = useCallback(async (config: ExportConfig): Promise<ExportResult | null> => {
    abortRef.current = false;
    setProgress({ percent: 0, step: 'Preparing render...', isExporting: true });

    try {
      // Long offline renders at 44.1kHz create very large buffers and WAVs.
      // Downsample to 22.05kHz for longer sessions to stay within browser memory limits.
      const chosenSampleRate = config.durationSeconds > 300 ? 22050 : 44100;

      // Build render config
      const renderConfig: OfflineRenderConfig = {
        durationSeconds: config.durationSeconds,
        sampleRate: chosenSampleRate,
        neuralAudioUrl: config.neuralAudioUrl,
        neuralSourceVolume: config.neuralSourceVolume ?? 1.0,
        atmosphereAudioUrl: config.atmosphereAudioUrl,
        atmosphereVolume: config.atmosphereVolume ?? 0.85,
        solfeggio: config.solfeggioHz ? {
          enabled: true,
          hz: config.solfeggioHz,
          volume: config.solfeggioVolume ?? 0.5
        } : undefined,
        binaural: config.binauralBeatHz ? {
          enabled: true,
          carrierHz: config.binauralCarrierHz ?? 200,
          beatHz: config.binauralBeatHz,
          volume: config.binauralVolume ?? 0.5
        } : undefined,
        dsp: config.dsp,
        masterVolume: config.masterVolume,
        onProgress: (percent, step) => {
          if (!abortRef.current) {
            setProgress({ percent, step, isExporting: true });
          }
        }
      };

      // Phase 1: Offline render (fast - seconds, not real-time)
      console.log('[OfflineExport] Starting offline render...');
      const audioBuffer = await renderOffline(renderConfig);
      
      if (abortRef.current) {
        throw new Error('Export cancelled');
      }

      // Phase 2: Encode to WAV
      setProgress({ percent: 80, step: 'Encoding to WAV...', isExporting: true });
      const wavBlob = audioBufferToWav(audioBuffer);
      console.log('[OfflineExport] WAV encoded:', wavBlob.size, 'bytes');

      if (abortRef.current) {
        throw new Error('Export cancelled');
      }

      // Phase 3: Try to convert to MP3 via Railway worker
      setProgress({ percent: 85, step: 'Converting to MP3...', isExporting: true });
      
      let finalBlob: Blob;
      let finalFormat: 'wav' | 'mp3';

      try {
        // Avoid crashing the browser by trying to base64-encode huge WAVs.
        // For long sessions we keep the WAV master (still downloadable).
        const MAX_MP3_CONVERT_WAV_BYTES = 25 * 1024 * 1024; // 25MB
        if (wavBlob.size > MAX_MP3_CONVERT_WAV_BYTES) {
          throw new Error('MP3 conversion skipped (WAV too large)');
        }

        finalBlob = await convertToMp3(wavBlob);
        finalFormat = 'mp3';
        console.log('[OfflineExport] MP3 conversion successful:', finalBlob.size, 'bytes');
      } catch (e) {
        console.warn('[OfflineExport] MP3 conversion failed, using WAV fallback:', e);
        finalBlob = wavBlob;
        finalFormat = 'wav';
        const msg = (e as Error)?.message || '';
        toast.info(
          msg.includes('skipped')
            ? 'Using WAV format (MP3 skipped for long export)'
            : 'Using WAV format (MP3 service offline)'
        );
      }

      if (abortRef.current) {
        throw new Error('Export cancelled');
      }

      // Create object URL for playback/download
      const url = URL.createObjectURL(finalBlob);
      
      setProgress({ percent: 100, step: 'Export complete!', isExporting: false });

      return {
        blob: finalBlob,
        format: finalFormat,
        durationSeconds: config.durationSeconds,
        url
      };

    } catch (error) {
      console.error('[OfflineExport] Export failed:', error);
      setProgress({ percent: 0, step: '', isExporting: false });
      
      if ((error as Error).message !== 'Export cancelled') {
        toast.error('Export failed: ' + (error as Error).message);
      }
      
      return null;
    }
  }, []);

  const cancelExport = useCallback(() => {
    abortRef.current = true;
    setProgress({ percent: 0, step: '', isExporting: false });
  }, []);

  const downloadResult = useCallback((result: ExportResult, filename?: string) => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = filename || `meditation-${Date.now()}.${result.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  return {
    progress,
    exportMeditation,
    cancelExport,
    downloadResult
  };
}

/**
 * Send WAV to Railway worker for MP3 conversion
 */
async function convertToMp3(wavBlob: Blob): Promise<Blob> {
  // Get worker URL from edge function (which has the secret)
  const { data: configData, error: configError } = await supabase.functions.invoke('get-audio-worker-url');
  
  if (configError || !configData?.url) {
    throw new Error('Audio worker URL not configured');
  }

  const workerUrl = sanitizeUrl(configData.url);
  const renderEndpoint = `${workerUrl}/render`;

  // Convert blob to base64 (memory-safe: avoid O(n^2) string concatenation)
  const base64 = await blobToBase64(wavBlob);

  // Send to worker
  const response = await fetch(renderEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': configData.apiKey || ''
    },
    body: JSON.stringify({
      audio_base64: base64,
      format: 'wav',
      output_format: 'mp3',
      bitrate: 320
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Worker error: ${response.status} - ${text}`);
  }

  const result = await response.json();
  
  if (!result.audio_base64) {
    throw new Error('No audio data in response');
  }

  // Decode base64 MP3
  const binaryString = atob(result.audio_base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: 'audio/mpeg' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to encode blob'));
        return;
      }
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to encode blob'));
    reader.readAsDataURL(blob);
  });
}
