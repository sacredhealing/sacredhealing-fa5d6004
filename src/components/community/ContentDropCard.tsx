import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VaultItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;       // 'file' | 'audio' | 'video' | 'image' | 'pdf' | 'archive'
  thumbnail_url: string | null;
  duration_seconds: number | null;
  price_cents: number;
  currency: string;
  tier_required: string;      // 'free' | 'prana-flow' | 'siddha-quantum' | 'akasha-infinity'
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free tier',
  'prana-flow': 'Prana-Flow',
  'siddha-quantum': 'Siddha-Quantum',
  'akasha-infinity': 'Akasha-Infinity',
};

function formatDuration(sec: number | null) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ContentDropCard({ content }: { content: VaultItem }) {
  const { toast } = useToast();
  const [access, setAccess] = useState<{ has_access: boolean; reason: string } | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (supabase as any)
      .rpc('get_content_access', { p_content_id: content.id })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (error) { console.error(error); return; }
        const row = Array.isArray(data) ? data[0] : data;
        setAccess(row || { has_access: false, reason: 'unknown' });
      });
    return () => { cancelled = true; };
  }, [content.id]);

  const unlocked = access?.has_access === true;
  const priceLabel = content.price_cents > 0 ? `${(content.price_cents / 100).toFixed(2)} ${content.currency.toUpperCase()}` : null;

  const handlePlay = async () => {
    if (playUrl) { setIsPlaying(true); return; }
    try {
      const { data, error } = await supabase.functions.invoke('get-content-signed-url', {
        body: { contentId: content.id },
      });
      if (error) throw error;
      if (data?.url) { setPlayUrl(data.url); setIsPlaying(true); }
      else throw new Error(data?.error || 'No playback URL returned');
    } catch (err: any) {
      toast({ title: "Couldn't load this", description: err.message, variant: 'destructive' });
    }
  };

  const handleUnlock = async () => {
    if (unlocked) { await handlePlay(); return; }

    if (access?.reason === 'tier_required') {
      toast({ title: 'Included at a higher tier', description: `This is included from ${TIER_LABELS[content.tier_required] || content.tier_required} upward.` });
      return;
    }
    if (!priceLabel) {
      toast({ title: 'Not available for individual purchase' });
      return;
    }

    setIsBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-content-checkout', {
        body: { contentId: content.id },
      });
      if (error) throw error;
      if (data?.alreadyPurchased) {
        setAccess({ has_access: true, reason: 'purchased' });
        toast({ title: 'You already own this' });
        return;
      }
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || 'No checkout URL returned');
    } catch (err: any) {
      toast({ title: 'Could not start checkout', description: err.message, variant: 'destructive' });
    } finally {
      setIsBuying(false);
    }
  };

  const isVideo = content.content_type === 'video';
  const isImage = content.content_type === 'image';

  return (
    <div className="c-drop-wrap">
      <div className="c-drop-eyebrow"><span className="c-drop-dot" />New Offering</div>
      <div className="c-drop-card">
        <div className={`c-drop-media ${unlocked ? 'unlocked' : ''}`}>
          {content.thumbnail_url && <img src={content.thumbnail_url} alt="" className="c-drop-thumb-img" />}
          {!unlocked && <div className="c-drop-lock">🔒</div>}
          <div className="c-drop-duration">
            {content.duration_seconds ? `${formatDuration(content.duration_seconds)} · ` : ''}
            {content.content_type.toUpperCase()}
          </div>
          {isPlaying && playUrl ? (
            isVideo ? (
              <video src={playUrl} controls autoPlay className="c-drop-player" />
            ) : isImage ? (
              <img src={playUrl} className="c-drop-player" style={{ objectFit: 'contain' }} />
            ) : (
              <audio src={playUrl} controls autoPlay className="c-drop-audio-player" />
            )
          ) : (
            <div className="c-drop-play" onClick={handleUnlock}>▶</div>
          )}
        </div>
        <div className="c-drop-body">
          <div className="c-drop-title">{content.title}</div>
          {content.description && <div className="c-drop-desc">{content.description}</div>}
          <div className="c-drop-footer">
            <div className="c-drop-price">
              {unlocked ? (
                <span style={{ color: '#22D3EE' }}>Owned</span>
              ) : priceLabel ? (
                <>{priceLabel}<span>one-time</span></>
              ) : (
                <span style={{ fontSize: 11 }}>{TIER_LABELS[content.tier_required] || content.tier_required}+ only</span>
              )}
            </div>
            <button className={`c-unlock-btn ${unlocked ? 'owned' : ''}`} onClick={handleUnlock} disabled={isBuying || access === null}>
              {isBuying ? '…' : access === null ? '···' : unlocked ? '▶ Play' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
