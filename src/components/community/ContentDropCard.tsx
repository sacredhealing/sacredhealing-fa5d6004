import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VaultItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  price_cents: number;
  currency: string;
  included_min_tier_rank: number | null;
}

interface Props {
  content: VaultItem;
  owned: boolean;
  myTierRank: number;
}

const TIER_LABELS: Record<number, string> = {
  0: 'Free tier',
  1: 'Prana-Flow',
  2: 'Siddha-Quantum',
  3: 'Akasha-Infinity',
};

function formatDuration(sec: number | null) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ContentDropCard({ content, owned, myTierRank }: Props) {
  const { toast } = useToast();
  const [isBuying, setIsBuying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  const includedByTier = content.included_min_tier_rank !== null && myTierRank >= (content.included_min_tier_rank ?? 99);
  const unlocked = owned || includedByTier;
  const priceLabel = content.price_cents > 0 ? `€${(content.price_cents / 100).toFixed(2)}` : null;

  const handleUnlock = async () => {
    if (unlocked) {
      await handlePlay();
      return;
    }
    if (!priceLabel) {
      toast({ title: 'Not available for purchase', description: `Included at ${TIER_LABELS[content.included_min_tier_rank ?? 3]} or higher.` });
      return;
    }
    setIsBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-content-checkout', {
        body: { contentId: content.id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error('No checkout URL returned');
    } catch (err: any) {
      toast({ title: 'Could not start checkout', description: err.message, variant: 'destructive' });
    } finally {
      setIsBuying(false);
    }
  };

  const handlePlay = async () => {
    if (playUrl) { setIsPlaying(true); return; }
    try {
      const { data, error } = await supabase.functions.invoke('get-content-signed-url', {
        body: { contentId: content.id },
      });
      if (error) throw error;
      if (data?.url) { setPlayUrl(data.url); setIsPlaying(true); }
      else throw new Error('No playback URL returned');
    } catch (err: any) {
      toast({ title: "Couldn't load this", description: err.message, variant: 'destructive' });
    }
  };

  const isVideo = content.media_type === 'video';

  return (
    <div className="c-drop-wrap">
      <div className="c-drop-eyebrow"><span className="c-drop-dot" />New Offering</div>
      <div className="c-drop-card">
        <div className={`c-drop-media ${unlocked ? 'unlocked' : ''}`}>
          {content.thumbnail_url && (
            <img src={content.thumbnail_url} alt="" className="c-drop-thumb-img" />
          )}
          {!unlocked && <div className="c-drop-lock">🔒</div>}
          {content.duration_seconds ? (
            <div className="c-drop-duration">{formatDuration(content.duration_seconds)} · {content.media_type.toUpperCase()}</div>
          ) : (
            <div className="c-drop-duration">{content.media_type.toUpperCase()}</div>
          )}
          {isPlaying && playUrl ? (
            isVideo ? (
              <video src={playUrl} controls autoPlay className="c-drop-player" />
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
                <span style={{ fontSize: 11 }}>
                  {content.included_min_tier_rank !== null ? `${TIER_LABELS[content.included_min_tier_rank]}+ only` : ''}
                </span>
              )}
            </div>
            <button className={`c-unlock-btn ${unlocked ? 'owned' : ''}`} onClick={handleUnlock} disabled={isBuying}>
              {isBuying ? '…' : unlocked ? '▶ Play' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
