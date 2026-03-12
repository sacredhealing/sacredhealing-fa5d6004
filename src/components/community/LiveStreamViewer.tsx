/**
 * LiveStreamViewer — Daily.co based live viewer (replaces Agora).
 * Renders a Daily.co iframe for viewers to watch/join a session.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LiveStreamViewerProps {
  roomUrl: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const LiveStreamViewer = ({ roomUrl, title, isOpen, onClose }: LiveStreamViewerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">LIVE</span>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="w-full" style={{ aspectRatio: '16/9', minHeight: 300 }}>
          <iframe
            src={roomUrl}
            allow="camera;microphone;fullscreen;display-capture"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 8px 8px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveStreamViewer;
