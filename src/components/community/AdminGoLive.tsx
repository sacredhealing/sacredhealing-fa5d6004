import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video, Loader2 } from 'lucide-react';
import { useLiveStream } from '@/hooks/useLiveStream';
import LiveBroadcaster from './LiveBroadcaster';

const AdminGoLive = () => {
  const { t } = useTranslation();
  const { createStream } = useLiveStream();
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeStream, setActiveStream] = useState<any>(null);

  const handleStartStream = async () => {
    if (!title.trim()) return;

    setIsStarting(true);
    const stream = await createStream(title, description);
    setIsStarting(false);

    if (stream) {
      setActiveStream(stream);
    }
  };

  const handleEndStream = () => {
    setActiveStream(null);
    setTitle('');
    setDescription('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
          <Video className="h-4 w-4 mr-2" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle>
            {activeStream ? 'You are LIVE!' : 'Start a Live Stream'}
          </DialogTitle>
        </DialogHeader>

        {activeStream ? (
          <LiveBroadcaster 
            stream={activeStream} 
            onEnd={handleEndStream}
          />
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Stream Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input
                  placeholder="Enter stream title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="What will you be sharing today?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Make sure you have granted camera and microphone permissions before going live.
                </p>
              </div>
              <Button
                onClick={handleStartStream}
                disabled={!title.trim() || isStarting}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Go Live Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminGoLive;
