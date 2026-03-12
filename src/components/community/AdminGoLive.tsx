/**
 * AdminGoLive — Daily.co based live streaming (replaces Agora).
 * Uses the daily-room edge function to create rooms.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video, Loader2, X } from 'lucide-react';
import { useDailyLive } from '@/hooks/useDailyLive';

const AdminGoLive = () => {
  const { t } = useTranslation();
  const daily = useDailyLive();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomUrl, setRoomUrl] = useState<string | null>(null);

  const handleStartStream = async () => {
    if (!title.trim()) return;
    const result = await daily.createRoom('divine-sangha', title, description);
    if (result) {
      setRoomUrl(result.room_url);
    }
  };

  const handleEndStream = async () => {
    if (daily.activeSession) {
      await daily.endSession(daily.activeSession.id);
    }
    setRoomUrl(null);
    setTitle('');
    setDescription('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full text-white border-0 shadow-[0_0_20px_rgba(147,51,234,0.3),0_0_0_1px_rgba(212,175,55,0.2)] hover:shadow-[0_0_28px_rgba(147,51,234,0.4),0_0_0_1px_rgba(212,175,55,0.35)]" style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 35%, #D4AF37 70%, #b45309 100%)' }}>
          <Video className="h-4 w-4 mr-2" />
          {t('community.enterSacredSpace', 'Enter the Sacred Space (Go Live)')}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto mx-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{roomUrl ? 'You are LIVE!' : 'Start a Live Stream'}</DialogTitle>
        </DialogHeader>

        {roomUrl ? (
          <div className="space-y-4 p-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">LIVE</span>
                <span className="text-sm font-semibold">{title}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleEndStream}>
                <X className="h-4 w-4 mr-1" /> End
              </Button>
            </div>
            <div style={{ aspectRatio: '16/9', minHeight: 280 }}>
              <iframe
                src={roomUrl}
                allow="camera;microphone;fullscreen;display-capture"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
              />
            </div>
          </div>
        ) : (
          <Card className="bg-card border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Stream Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input placeholder="Enter stream title..." value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="What will you be sharing today?" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={3} />
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Grant camera and microphone permissions before going live.</p>
              </div>
              <Button
                onClick={handleStartStream}
                disabled={!title.trim() || daily.isCreating}
                className="w-full text-white border-0"
                style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #D4AF37 100%)' }}
              >
                {daily.isCreating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</>
                ) : (
                  <><Video className="h-4 w-4 mr-2" /> {t('community.enterSacredSpace', 'Go Live')}</>
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
