/**
 * SacredMeetingRoom.tsx
 * ─────────────────────────────────────────────────────────────
 * Embeds a Daily.co video room directly inside the app
 * - Works for both 1:1 healing sessions and group calls
 * - Recording saved to Supabase storage on end
 * - Recording link auto-published to /membership area
 *
 * Install Daily.co React SDK:
 *   npm install @daily-co/daily-react @daily-co/daily-js
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Dynamic import to avoid SSR issues with Daily.co
// When installed: import DailyIframe from '@daily-co/daily-js';

interface SacredMeetingRoomProps {
  roomUrl: string;
  channelId: string;
  channelName: string;
  userId: string;
  isAdmin: boolean;
  onEnd: () => void;
}

export default function SacredMeetingRoom({
  roomUrl,
  channelId,
  channelName,
  userId,
  isAdmin,
  onEnd,
}: SacredMeetingRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const callFrameRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'joined' | 'ended'>('loading');
  const [participantCount, setParticipantCount] = useState(1);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!iframeRef.current) return;

    // ── INITIALIZE DAILY.CO ─────────────────────────────
    // This uses the iframe embed approach (no SDK install needed)
    // The iframe gives a full Zoom-like UI inside your app

    const loadDaily = async () => {
      try {
        // Option A: Pure iframe (works without npm install)
        // The iframe IS the meeting room — Daily.co handles all UI
        if (iframeRef.current) {
          iframeRef.current.src = roomUrl + '?showLeaveButton=true&showFullscreenButton=true';
          setStatus('joined');
        }

        // Option B (better): Daily.co JS SDK for full control
        // Uncomment after: npm install @daily-co/daily-js
        /*
        const DailyIframe = (await import('@daily-co/daily-js')).default;
        const callFrame = DailyIframe.createFrame(iframeRef.current!, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            border: 'none', borderRadius: '24px',
          },
        });

        callFrame
          .on('joined-meeting', () => {
            setStatus('joined');
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
          })
          .on('participant-counts-updated', (e: any) => {
            setParticipantCount(e.participants.present);
          })
          .on('left-meeting', () => handleEnd(callFrame))
          .on('recording-stopped', (e: any) => saveRecording(e));

        callFrame.join({ url: roomUrl });
        callFrameRef.current = callFrame;
        */

        // Start timer
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

      } catch (err) {
        console.error('Daily.co initialization failed:', err);
      }
    };

    loadDaily();

    return () => {
      clearInterval(timerRef.current);
    };
  }, [roomUrl]);

  // ── END MEETING ─────────────────────────────────────────
  const handleEnd = async (callFrame?: any) => {
    clearInterval(timerRef.current);
    setStatus('ended');

    // Mark session as inactive in Supabase
    await supabase
      .from('community_live_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
      })
      .eq('channel_id', channelId)
      .eq('is_active', true);

    if (callFrame) {
      await callFrame.destroy();
    }

    onEnd();
  };

  // ── SAVE RECORDING (called by Daily.co webhook) ─────────
  // This runs server-side via Supabase Edge Function
  // See: supabase/functions/daily-webhook/index.ts
  const saveRecording = async (event: any) => {
    // Webhook handles this automatically
    // Recording appears in /membership for the channel
    console.log('Recording event:', event);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sqi-meeting-room">

      {/* ── MEETING HEADER ─────────────────────── */}
      <div className="sqi-meeting-header">
        <div className="sqi-meeting-info">
          <div className="sqi-meeting-live-dot" />
          <span className="sqi-meeting-channel">{channelName}</span>
          <span className="sqi-meeting-duration">{formatDuration(duration)}</span>
          <span className="sqi-meeting-participants">
            👥 {participantCount} soul{participantCount !== 1 ? 's' : ''}
          </span>
        </div>
        {isAdmin && (
          <button
            className="sqi-end-meeting-btn"
            onClick={() => handleEnd()}
          >
            End Session
          </button>
        )}
        {!isAdmin && (
          <button
            className="sqi-leave-btn"
            onClick={() => handleEnd()}
          >
            Leave
          </button>
        )}
      </div>

      {/* ── DAILY.CO IFRAME ────────────────────── */}
      <div className="sqi-meeting-iframe-wrap">
        {status === 'loading' && (
          <div className="sqi-meeting-loading">
            <div className="sqi-loading-spinner" />
            <div>Activating Sacred Space...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Sacred Meeting Room"
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="sqi-meeting-iframe"
          style={{ display: status === 'loading' ? 'none' : 'block' }}
          onLoad={() => setStatus('joined')}
        />
      </div>

      {/* ── RECORDING NOTICE ───────────────────── */}
      <div className="sqi-recording-notice">
        🔴 This session is being recorded · Available in your membership area after
      </div>
    </div>
  );
}

