import { useEffect } from 'react';
import { Circle, Square, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import useCallScreenRecorder from '@/hooks/useCallScreenRecorder';

interface CallRecorderBarProps {
  /** Daily room name returned by the daily-room create action. */
  roomName: string;
  sessionId?: string | null;
  /** Auto-prompt the host to start recording as soon as the bar appears. */
  autoStart?: boolean;
  className?: string;
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

/** Below this, "Stop & save" asks for a confirmation tap so a stray click
 * doesn't kill a live class after a few seconds. */
const MIN_SAFE_STOP_SECONDS = 20;

/**
 * Small inline bar shown to the host of a Daily call.
 * Lets them start/stop a browser-side screen+mic recording that
 * is uploaded to Supabase Storage and saved to their profile / Stargate.
 * Replaces Daily.co's paid cloud recording.
 */
export const CallRecorderBar: React.FC<CallRecorderBarProps> = ({
  roomName,
  sessionId,
  autoStart,
  className,
}) => {
  const { status, elapsed, start, stop, error } = useCallScreenRecorder();

  useEffect(() => {
    if (autoStart && status === 'idle' && roomName) {
      // Defer one tick so the dialog is fully painted before the
      // browser permission prompt appears.
      const t = setTimeout(() => {
        void start({ roomName, sessionId });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [autoStart, status, roomName, sessionId, start]);

  const handleStopClick = () => {
    if (elapsed < MIN_SAFE_STOP_SECONDS) {
      const ok = window.confirm(
        `Only ${fmt(elapsed)} has been recorded. Stop and save anyway?`
      );
      if (!ok) return;
    }
    stop();
  };

  return (
    <div
      className={
        'flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl text-xs ' +
        (className || '')
      }
    >
      {status === 'idle' && (
        <>
          <button
            onClick={() => start({ roomName, sessionId })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] text-black font-black text-[10px] tracking-[0.1em] uppercase transition-all hover:scale-[1.02] active:scale-95"
          >
            <Circle className="w-3 h-3 fill-current" /> Record call
          </button>
          <span className="text-white/40">Saves to your profile / Stargate when you stop.</span>
        </>
      )}
      {status === 'requesting' && (
        <span className="flex items-center gap-2 text-white/40">
          <Loader2 className="w-3 h-3 animate-spin" /> Waiting for screen + mic permission…
        </span>
      )}
      {status === 'recording' && (
        <>
          <span className="flex items-center gap-1.5 text-red-400 font-black tracking-wide">
            <Circle className="w-2.5 h-2.5 fill-current animate-pulse" /> REC {fmt(elapsed)}
          </span>
          <button
            onClick={handleStopClick}
            className="flex items-center gap-1.5 ml-auto px-4 py-2 rounded-full border border-white/10 text-white/70 font-black text-[10px] tracking-[0.1em] uppercase hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all"
          >
            <Square className="w-3 h-3" /> Stop &amp; save
          </button>
        </>
      )}
      {status === 'uploading' && (
        <span className="flex items-center gap-2 text-white/40">
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading recording…
        </span>
      )}
      {status === 'ready' && (
        <span className="flex items-center gap-2 text-[#22D3EE]">
          <CheckCircle2 className="w-3 h-3" /> Saved to your profile.
        </span>
      )}
      {status === 'failed' && (
        <span className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-3 h-3" /> {error || 'Recording failed'}
          <button
            onClick={() => start({ roomName, sessionId })}
            className="underline decoration-dotted underline-offset-2 hover:text-[#D4AF37]"
          >
            Retry
          </button>
        </span>
      )}
    </div>
  );
};

export default CallRecorderBar;
