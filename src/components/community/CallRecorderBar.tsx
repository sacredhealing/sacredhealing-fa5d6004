import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

  return (
    <div
      className={
        'flex items-center gap-3 px-3 py-2 rounded-md border border-border/40 bg-background/60 text-xs ' +
        (className || '')
      }
    >
      {status === 'idle' && (
        <>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => start({ roomName, sessionId })}
            className="gap-1.5"
          >
            <Circle className="w-3 h-3 fill-current" /> Record call
          </Button>
          <span className="text-muted-foreground">
            Saves to your profile / Stargate when you stop.
          </span>
        </>
      )}
      {status === 'requesting' && (
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Waiting for screen + mic permission…
        </span>
      )}
      {status === 'recording' && (
        <>
          <span className="flex items-center gap-1.5 text-red-500 font-semibold">
            <Circle className="w-2.5 h-2.5 fill-current animate-pulse" /> REC {fmt(elapsed)}
          </span>
          <Button size="sm" variant="outline" onClick={stop} className="gap-1.5 ml-auto">
            <Square className="w-3 h-3" /> Stop & save
          </Button>
        </>
      )}
      {status === 'uploading' && (
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading recording…
        </span>
      )}
      {status === 'ready' && (
        <span className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="w-3 h-3" /> Saved to your profile.
        </span>
      )}
      {status === 'failed' && (
        <span className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="w-3 h-3" /> {error || 'Recording failed'}
          <Button size="sm" variant="ghost" onClick={() => start({ roomName, sessionId })}>
            Retry
          </Button>
        </span>
      )}
    </div>
  );
};

export default CallRecorderBar;