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
    <>
      <style>{`
        .c-drop-wrap { align-self: flex-start; max-width: 82%; width: 82%; margin: 4px 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        .c-drop-eyebrow { font-size: 8px; font-weight: 800; letter-spacing: .3em; text-transform: uppercase; color: rgba(212,175,55,.55); margin-bottom: 6px; padding-left: 4px; display: flex; align-items: center; gap: 6px; }
        .c-drop-dot { width: 5px; height: 5px; border-radius: 50%; background: #D4AF37; }
        .c-drop-card { border-radius: 22px; overflow: hidden; border: 1px solid rgba(212,175,55,.28); background: linear-gradient(180deg, rgba(212,175,55,.06), rgba(255,255,255,.02)); box-shadow: 0 10px 30px rgba(0,0,0,.4); }
        .c-drop-media { height: 160px; position: relative; overflow: hidden; background: radial-gradient(ellipse at 30% 20%, rgba(212,175,55,.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(34,211,238,.1), transparent 55%), #0a0a0a; display: flex; align-items: center; justify-content: center; }
        .c-drop-thumb-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .5; }
        .c-drop-media::after { content: ''; position: absolute; inset: 0; backdrop-filter: blur(14px); background: rgba(5,5,5,.35); }
        .c-drop-media.unlocked::after { content: none; }
        .c-drop-play { position: relative; z-index: 2; width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 16px; backdrop-filter: blur(6px); cursor: pointer; color: #fff; }
        .c-drop-lock { position: absolute; z-index: 3; top: 10px; right: 10px; width: 24px; height: 24px; border-radius: 8px; background: rgba(5,5,5,.7); border: 1px solid rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; font-size: 11px; }
        .c-drop-duration { position: absolute; z-index: 3; bottom: 10px; left: 10px; font-size: 9px; font-weight: 800; letter-spacing: .1em; padding: 4px 9px; border-radius: 20px; background: rgba(5,5,5,.7); border: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.75); }
        .c-drop-player, .c-drop-audio-player { position: relative; z-index: 4; width: 100%; }
        .c-drop-audio-player { position: absolute; bottom: 8px; left: 8px; right: 8px; width: calc(100% - 16px); height: 34px; }
        .c-drop-body { padding: 13px 15px 15px; color: #fff; }
        .c-drop-title { font-weight: 900; font-size: 14px; letter-spacing: -.02em; color: #fff; }
        .c-drop-desc { font-size: 11.5px; color: rgba(255,255,255,.55); margin-top: 4px; line-height: 1.5; }
        .c-drop-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .c-drop-price { font-size: 16px; font-weight: 900; color: #D4AF37; }
        .c-drop-price span { font-size: 9px; font-weight: 700; color: rgba(255,255,255,.35); margin-left: 4px; }
        .c-unlock-btn { background: radial-gradient(circle at 30% 30%, #F4D35E, #D4AF37 75%); color: #1a1300; border: none; padding: 8px 16px; border-radius: 13px; font-weight: 900; font-size: 11.5px; cursor: pointer; box-shadow: 0 6px 16px rgba(212,175,55,.25); }
        .c-unlock-btn.owned { background: rgba(34,211,238,.12); color: #22D3EE; border: 1px solid rgba(34,211,238,.35); box-shadow: none; }
        .c-unlock-btn:disabled { opacity: .5; cursor: default; }
      `}</style>
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
    </>
  );
}
