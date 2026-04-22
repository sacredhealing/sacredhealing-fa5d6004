import React, { useEffect, useState } from 'react';
import { Play, Loader2, Clock, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VideoPlayerModal from '@/components/courses/VideoPlayerModal';
import { toast } from 'sonner';

export interface CallRecording {
  id: string;
  room_name: string;
  call_type: string;
  stargate_category: string | null;
  host_user_id: string;
  partner_user_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

interface RecordingsListProps {
  /** Filter: 'dm' shows my 1-on-1s; 'stargate' shows Stargate sessions */
  callType: 'dm' | 'stargate';
  stargateCategory?: 'healing-chamber' | 'bhagavad-gita' | 'other';
  emptyText?: string;
  /** Larger type for accessibility (e.g. profile page) */
  largeText?: boolean;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  callType,
  stargateCategory,
  emptyText,
  largeText,
}) => {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      setLoading(true);
      let q = (supabase as any)
        .from('call_recordings')
        .select('*')
        .eq('call_type', callType)
        .order('started_at', { ascending: false });
      if (stargateCategory) q = q.eq('stargate_category', stargateCategory);
      const { data, error } = await q;
      if (error) {
        console.error('Recordings fetch error:', error);
      } else {
        setRecordings((data as CallRecording[]) || []);
      }
      setLoading(false);
    };
    fetchRecordings();
  }, [callType, stargateCategory]);

  const playRecording = async (rec: CallRecording) => {
    if (rec.status !== 'ready') {
      toast.info('This recording is still processing. Check back soon.');
      return;
    }
    setOpeningId(rec.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('get-recording-url', {
        body: { recording_id: rec.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || !data?.url) {
        toast.error('Could not load recording');
        return;
      }
      setActiveUrl(data.url);
      setActiveTitle(rec.title);
    } finally {
      setOpeningId(null);
    }
  };

  const emptyBodyCls = largeText ? 'text-base text-muted-foreground' : 'text-sm text-muted-foreground';
  const titleCls = largeText ? 'font-semibold text-base text-foreground truncate' : 'font-semibold text-sm text-foreground truncate';
  const metaCls = largeText ? 'flex items-center gap-2 text-sm text-muted-foreground mt-0.5' : 'flex items-center gap-2 text-xs text-muted-foreground mt-0.5';
  const badgeCls = largeText ? 'ml-1 text-xs py-0 px-1.5' : 'ml-1 text-[10px] py-0 px-1.5';
  const playBtnSize = largeText ? 'default' : 'sm';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className={`${largeText ? 'w-6 h-6' : 'w-5 h-5'} animate-spin text-muted-foreground`} />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Video className={`${largeText ? 'w-12 h-12' : 'w-10 h-10'} text-muted-foreground mx-auto mb-3 opacity-40`} />
        <p className={emptyBodyCls}>
          {emptyText || 'No recordings yet. They will appear here automatically after each call.'}
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {recordings.map((rec) => {
          const date = new Date(rec.started_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
          });
          const duration = rec.duration_seconds
            ? `${Math.round(rec.duration_seconds / 60)} min`
            : null;
          return (
            <Card key={rec.id} className={`${largeText ? 'p-5' : 'p-4'} flex items-center gap-3`}>
              <div className={`${largeText ? 'w-14 h-14' : 'w-12 h-12'} rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0`}>
                <Video className={`${largeText ? 'w-6 h-6' : 'w-5 h-5'} text-primary`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={titleCls}>{rec.title}</p>
                <div className={metaCls}>
                  <span>{date}</span>
                  {duration && (
                    <>
                      <span>•</span>
                      <Clock className={largeText ? 'w-4 h-4' : 'w-3 h-3'} />
                      <span>{duration}</span>
                    </>
                  )}
                  {rec.status !== 'ready' && (
                    <Badge variant="secondary" className={badgeCls}>
                      {rec.status}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size={playBtnSize}
                variant={rec.status === 'ready' ? 'default' : 'secondary'}
                disabled={rec.status !== 'ready' || openingId === rec.id}
                onClick={() => playRecording(rec)}
              >
                {openingId === rec.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" /> Watch
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      <VideoPlayerModal
        isOpen={!!activeUrl}
        onClose={() => setActiveUrl(null)}
        videoUrl={activeUrl}
        title={activeTitle}
      />
    </>
  );
};

export default RecordingsList;
