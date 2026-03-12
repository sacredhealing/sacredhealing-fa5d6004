/**
 * LiveBroadcaster — Daily.co based broadcaster (replaces Agora).
 * Renders a Daily.co iframe where the host can broadcast.
 */
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface LiveBroadcasterProps {
  roomUrl: string;
  title: string;
  onEnd: () => void;
}

const LiveBroadcaster = ({ roomUrl, title, onEnd }: LiveBroadcasterProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
            LIVE
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <Button variant="destructive" size="sm" onClick={onEnd}>
          <X className="h-4 w-4 mr-1" />
          End
        </Button>
      </div>
      <div className="w-full" style={{ aspectRatio: '16/9', minHeight: 300 }}>
        <iframe
          src={roomUrl}
          allow="camera;microphone;fullscreen;display-capture"
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
        />
      </div>
    </div>
  );
};

export default LiveBroadcaster;
