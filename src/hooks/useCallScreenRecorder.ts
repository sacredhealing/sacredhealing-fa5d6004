import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * useCallScreenRecorder
 * --------------------------------------------------------------
 * Records the host's screen (the Daily.co iframe tab) + their mic
 * directly in the browser using getDisplayMedia + MediaRecorder, then
 * uploads the resulting webm/mp4 blob to the `call-recordings` bucket
 * and flips the matching `call_recordings` row to status='ready'.
 *
 * This bypasses Daily.co's paid cloud recording. The host must keep
 * the tab open during the call.
 */

export type CallRecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'uploading'
  | 'ready'
  | 'failed';

interface StartArgs {
  /** Daily room name (matches call_recordings.room_name created by daily-room fn). */
  roomName: string;
  /** community_live_sessions.id (used to look up the right recording row). */
  sessionId?: string | null;
}

export function useCallScreenRecorder() {
  const [status, setStatus] = useState<CallRecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const argsRef = useRef<StartArgs | null>(null);

  const cleanupStreams = useCallback(() => {
    [displayStreamRef.current, micStreamRef.current].forEach((s) => {
      s?.getTracks().forEach((t) => {
        try { t.stop(); } catch { /* noop */ }
      });
    });
    displayStreamRef.current = null;
    micStreamRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupStreams(), [cleanupStreams]);

  const finalize = useCallback(async (blob: Blob) => {
    const args = argsRef.current;
    if (!args) return;
    setStatus('uploading');
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not authenticated');

      // Find the pending row created by daily-room create
      const { data: row, error: lookupErr } = await supabase
        .from('call_recordings')
        .select('id, host_user_id')
        .eq('room_name', args.roomName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (!row) throw new Error('Recording row not found for room');

      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const path = `${row.host_user_id}/${row.id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('call-recordings')
        .upload(path, blob, { upsert: true, contentType: blob.type });
      if (upErr) throw upErr;

      const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);

      const { error: updErr } = await (supabase
        .from('call_recordings') as any)
        .update({
          status: 'ready',
          storage_path: path,
          video_url: path,
          duration_seconds: durationSec,
          ended_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (updErr) throw updErr;

      setStatus('ready');
      toast.success('Recording saved to your profile');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useCallScreenRecorder] finalize error:', e);
      setError(msg);
      setStatus('failed');
      toast.error(`Recording upload failed: ${msg}`);
    }
  }, []);

  const start = useCallback(async (args: StartArgs) => {
    setError(null);
    setElapsed(0);
    argsRef.current = args;
    setStatus('requesting');
    try {
      // 1) Screen + tab audio
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      displayStreamRef.current = display;

      // 2) Mic
      let mic: MediaStream | null = null;
      try {
        mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        micStreamRef.current = mic;
      } catch (e) {
        console.warn('[useCallScreenRecorder] no mic, continuing with tab audio only', e);
      }

      // 3) Mix audio tracks (tab + mic) via WebAudio
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      const tabAudio = display.getAudioTracks();
      if (tabAudio.length) {
        try {
          audioCtx
            .createMediaStreamSource(new MediaStream(tabAudio))
            .connect(dest);
        } catch (e) {
          console.warn('[useCallScreenRecorder] tab audio mix failed', e);
        }
      }
      if (mic) {
        try {
          audioCtx.createMediaStreamSource(mic).connect(dest);
        } catch (e) {
          console.warn('[useCallScreenRecorder] mic mix failed', e);
        }
      }

      const mixed = new MediaStream([
        ...display.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mime =
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/webm')
              ? 'video/webm'
              : 'video/mp4';

      const recorder = new MediaRecorder(mixed, {
        mimeType: mime,
        videoBitsPerSecond: 2_500_000,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        cleanupStreams();
        await finalize(blob);
      };

      // Auto-stop if user ends screen share from the browser chrome
      display.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (recorder.state !== 'inactive') recorder.stop();
      });

      recorder.start(2000); // 2s chunks
      startedAtRef.current = Date.now();
      setStatus('recording');
      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);
      toast.success('Recording started — keep this tab open');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[useCallScreenRecorder] start error:', e);
      setError(msg);
      setStatus('failed');
      cleanupStreams();
      // Mark the row as failed so it disappears from "pending" listings
      try {
        if (argsRef.current) {
          await (supabase.from('call_recordings') as any)
            .update({ status: 'failed', error_message: msg })
            .eq('room_name', argsRef.current.roomName)
            .eq('status', 'pending');
        }
      } catch { /* noop */ }
      toast.error(`Could not start recording: ${msg}`);
    }
  }, [cleanupStreams, finalize]);

  const stop = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') {
      r.stop();
    } else {
      cleanupStreams();
      setStatus('idle');
    }
  }, [cleanupStreams]);

  return { status, error, elapsed, start, stop };
}

export default useCallScreenRecorder;