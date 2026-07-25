import React, { useEffect, useState } from 'react';
import { Play, Loader2, Clock, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

  const titleCls = largeText ? 'font-bold text-base text-white truncate' : 'font-bold text-sm text-white truncate';
  const metaCls = largeText ? 'flex items-center gap-2 text-sm text-white/40 mt-1' : 'flex items-center gap-2 text-xs text-white/40 mt-1';
  const emptyBodyCls = largeText ? 'text-base text-white/40' : 'text-sm text-white/40';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className={`${largeText ? 'w-6 h-6' : 'w-5 h-5'} animate-spin text-[#D4AF37]/70`} />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="card-glass !p-8 text-center">
        <Video className={`${largeText ? 'w-12 h-12' : 'w-10 h-10'} text-[#D4AF37]/25 mx-auto mb-4`} />
        <p className={emptyBodyCls}>
          {emptyText || 'No recordings yet. They will appear here automatically after each call.'}
        </p>
      </div>
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
          const isReady = rec.status === 'ready';
          const isOpening = openingId === rec.id;
          return (
            <div
              key={rec.id}
              className={`card-glass !rounded-[24px] ${largeText ? '!p-5' : '!p-4'} flex items-center gap-4`}
            >
              <div
                className={`${largeText ? 'w-14 h-14' : 'w-12 h-12'} rounded-2xl flex items-center justify-center flex-shrink-0`}
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  boxShadow: '0 0 20px rgba(212,175,55,0.08)',
                }}
              >
                <Video className={`${largeText ? 'w-6 h-6' : 'w-5 h-5'} text-[#D4AF37]`} />
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
                  {!isReady && (
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/50">
                      {rec.status}
                    </span>
                  )}
                </div>
              </div>
              <button
                disabled={!isReady || isOpening}
                onClick={() => playRecording(rec)}
                className={`flex items-center gap-1.5 rounded-full font-black uppercase tracking-[0.1em] transition-all duration-300 flex-shrink-0 ${
                  largeText ? 'text-xs px-5 py-3' : 'text-[11px] px-4 py-2.5'
                } ${
                  isReady
                    ? 'bg-[#D4AF37] text-black shadow-[0_8px_24px_rgba(212,175,55,0.25)] hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(212,175,55,0.4)] active:scale-95 disabled:opacity-60'
                    : 'bg-white/[0.04] border border-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {isOpening ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Watch
                  </>
                )}
              </button>
            </div>
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
