/**
 * LiveStreamList — shows active Daily.co live sessions (replaces Agora-based version).
 */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';
import { useDailyLive, DailySession } from '@/hooks/useDailyLive';
import LiveStreamViewer from './LiveStreamViewer';
import { formatDistanceToNow } from 'date-fns';

const LiveStreamList = () => {
  const daily = useDailyLive();
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('Live Session');

  useEffect(() => {
    daily.fetchActiveSessions().then((s) => {
      setSessions(s);
      setLoading(false);
    });
  }, [daily]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (sessions.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse block" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Live Now</h3>
            <p className="text-sm text-white/70 mt-0.5">Join the live session</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <Card
            key={s.id}
            className="bg-gradient-to-r from-red-500/10 to-primary/10 border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer"
            onClick={() => {
              if (s.room_url) {
                setSelectedUrl(s.room_url);
                setSelectedTitle(s.title);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{s.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Started {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                  </p>
                </div>
                <Button size="sm" className="bg-red-500 hover:bg-red-600">
                  <Video className="h-4 w-4 mr-1" /> Watch
                </Button>
              </div>
              {s.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedUrl && (
        <LiveStreamViewer
          roomUrl={selectedUrl}
          title={selectedTitle}
          isOpen
          onClose={() => setSelectedUrl(null)}
        />
      )}
    </>
  );
};

export default LiveStreamList;
