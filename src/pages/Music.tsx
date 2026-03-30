// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Music2, Plus, List, Crown, ChevronRight, X, GripVertical, Edit2, Check, Loader2, Disc, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { TrackCard } from '@/components/music/TrackCard';
import { CuratedPlaylistCard } from '@/components/music/CuratedPlaylistCard';
import { useCuratedPlaylists, CuratedPlaylist } from '@/hooks/useCuratedPlaylists';
import { useAuth } from '@/hooks/useAuth';
import { selectTrackForMood, type MoodKey, getTrackIdSafe, getTrackLabel } from '@/features/music/selectTrackForMood';
import { tMusicGenre, tMusicMood } from '@/features/music/musicDisplayI18n';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useTranslation } from '@/hooks/useTranslation';

// SQI 2050 — Sacred Sound Portal styles
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

  :root {
    --gold: #D4AF37;
    --gold-glow: rgba(212, 175, 55, 0.25);
    --gold-dim: rgba(212, 175, 55, 0.5);
    --akasha: #050505;
    --glass: rgba(255,255,255,0.02);
    --glass-border: rgba(255,255,255,0.05);
    --glass-border-gold: rgba(212,175,55,0.15);
    --cyan: #22D3EE;
    --text-muted: rgba(255,255,255,0.5);
    --text-body: rgba(255,255,255,0.7);
    --radius: 28px;
  }

  .sqi-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .sqi-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--akasha);
    color: #fff;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  .sqi-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(212,175,55,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 80%, rgba(34,211,238,0.04) 0%, transparent 50%),
      radial-gradient(ellipse 40% 30% at 10% 60%, rgba(212,175,55,0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .anahata-ring {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 600px;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.03);
    pointer-events: none;
    z-index: 0;
    animation: ring-rotate 30s linear infinite;
  }
  .anahata-ring::before {
    content: '';
    position: absolute;
    inset: 40px;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.02);
  }
  @keyframes ring-rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .star {
    position: fixed;
    width: 1.5px; height: 1.5px;
    background: rgba(212,175,55,0.6);
    border-radius: 50%;
    animation: twinkle var(--dur) ease-in-out infinite;
  }
  @keyframes twinkle {
    0%,100% { opacity: 0.1; transform: scale(1); }
    50%      { opacity: 0.8; transform: scale(1.5); }
  }

  .sqi-page {
    position: relative;
    z-index: 1;
    max-width: 440px;
    margin: 0 auto;
    padding: 0 16px 120px;
  }

  .sqi-header {
    padding: 20px 0 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sqi-back-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--gold);
    font-size: 14px;
    backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .sqi-page-title {
    font-size: 22px; font-weight: 900;
    letter-spacing: -0.04em;
    background: linear-gradient(135deg, #fff 40%, var(--gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .planetary-hero {
    position: relative;
    background: linear-gradient(135deg,
      rgba(212,175,55,0.08) 0%,
      rgba(34,211,238,0.05) 50%,
      rgba(212,175,55,0.04) 100%);
    border: 1px solid var(--glass-border-gold);
    border-radius: 32px;
    padding: 28px 24px 24px;
    margin-bottom: 12px;
    overflow: hidden;
    backdrop-filter: blur(40px);
  }
  .planetary-hero::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,0.12), transparent 70%);
    animation: orb-pulse 4s ease-in-out infinite;
  }
  @keyframes orb-pulse {
    0%,100% { transform: scale(1); opacity: 0.8; }
    50%      { transform: scale(1.2); opacity: 1; }
  }
  .hero-eyebrow {
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.45em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 8px;
    display: flex; align-items: center; gap: 8px;
  }
  .hero-eyebrow::after {
    content: '';
    flex: 1; height: 1px;
    background: linear-gradient(to right, var(--gold-dim), transparent);
  }
  .hero-title {
    font-size: 30px; font-weight: 900;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, #fff 0%, var(--gold) 60%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.1; margin-bottom: 16px;
  }
  .waveform {
    display: flex; align-items: flex-end;
    gap: 3px; height: 36px; margin-bottom: 16px;
  }
  .waveform-bar {
    flex: 1;
    background: linear-gradient(to top, var(--gold), rgba(212,175,55,0.3));
    border-radius: 2px;
    animation: wave var(--spd) ease-in-out infinite alternate;
  }
  @keyframes wave {
    from { transform: scaleY(0.2); }
    to   { transform: scaleY(1); }
  }
  .hero-meta {
    display: flex; align-items: center;
    justify-content: space-between;
  }
  .hero-freq-tag {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.3em; color: var(--cyan);
    text-transform: uppercase;
    display: flex; align-items: center; gap: 6px;
  }
  .nadi-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 8px var(--cyan);
    animation: nadi-pulse 1.5s ease-in-out infinite;
  }
  @keyframes nadi-pulse {
    0%,100% { transform: scale(1); box-shadow: 0 0 8px var(--cyan); }
    50%      { transform: scale(1.5); box-shadow: 0 0 16px var(--cyan), 0 0 32px rgba(34,211,238,0.3); }
  }
  .hero-play-btn {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--gold); border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px; color: #000;
    box-shadow: 0 0 20px var(--gold-glow);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .hero-play-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 0 32px rgba(212,175,55,0.5);
  }

  .prescription-card {
    background: var(--glass);
    border: 1px solid var(--glass-border-gold);
    border-radius: var(--radius);
    padding: 20px; margin-bottom: 12px;
    backdrop-filter: blur(40px);
    position: relative; overflow: hidden;
  }
  .prescription-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, transparent, var(--gold), transparent);
  }
  .presc-header {
    display: flex; align-items: center;
    gap: 8px; margin-bottom: 10px;
  }
  .presc-label {
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: var(--gold);
  }
  .presc-text {
    font-size: 13px; font-weight: 400;
    line-height: 1.6; color: var(--text-body);
  }
  .presc-text strong { color: var(--gold); font-weight: 700; }

  .pranaflow-banner {
    position: relative;
    background: linear-gradient(135deg,
      rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%);
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: var(--radius);
    padding: 22px 20px; margin-bottom: 12px;
    overflow: hidden; backdrop-filter: blur(40px);
    cursor: pointer; transition: border-color 0.3s;
  }
  .pranaflow-banner:hover { border-color: var(--gold); }
  .pranaflow-banner::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    animation: shimmer 3s linear infinite;
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    100% { left: 100%; }
  }
  .pf-inner {
    display: flex; align-items: center; gap: 14px;
  }
  .pf-crown {
    width: 44px; height: 44px; border-radius: 14px;
    background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05));
    border: 1px solid rgba(212,175,55,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .pf-content { flex: 1; }
  .pf-tier-label {
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.45em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 3px;
  }
  .pf-name {
    font-size: 16px; font-weight: 900;
    letter-spacing: -0.03em; color: #fff; margin-bottom: 2px;
  }
  .pf-desc { font-size: 11px; color: var(--text-muted); font-weight: 500; }
  .pf-badge {
    background: var(--gold); color: #000;
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.05em;
    padding: 5px 10px; border-radius: 20px; flex-shrink: 0;
  }

  .mastering-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    padding: 18px 20px; margin-bottom: 20px;
    backdrop-filter: blur(40px);
    display: flex; align-items: center; gap: 14px;
    cursor: pointer; transition: border-color 0.3s;
  }
  .mastering-card:hover { border-color: rgba(212,175,55,0.2); }
  .mastering-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(212,175,55,0.08);
    border: 1px solid var(--glass-border-gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .mastering-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .mastering-sub { font-size: 11px; color: var(--text-muted); }

  .section-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 14px; margin-top: 4px;
  }
  .section-title {
    font-size: 18px; font-weight: 900; letter-spacing: -0.04em;
  }
  .section-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .shuffle-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 20px;
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.2);
    color: var(--gold); font-size: 11px; font-weight: 700;
    cursor: pointer; transition: background 0.2s; letter-spacing: 0.05em;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .shuffle-btn:hover { background: rgba(212,175,55,0.18); }

  .mood-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px; margin-bottom: 24px;
  }
  .mood-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 22px; padding: 18px 16px;
    cursor: pointer; position: relative; overflow: hidden;
    backdrop-filter: blur(20px);
    transition: border-color 0.3s, transform 0.2s;
  }
  .mood-card:hover {
    border-color: rgba(212,175,55,0.25);
    transform: translateY(-2px);
  }
  .mood-card.full-width { grid-column: 1 / -1; }
  .mood-freq {
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .freq-dot {
    width: 4px; height: 4px;
    border-radius: 50%; background: var(--gold); opacity: 0.7;
  }
  .mini-wave {
    display: flex; align-items: flex-end;
    gap: 2px; height: 14px; margin-bottom: 8px;
  }
  .mini-bar {
    width: 2px; background: rgba(212,175,55,0.4);
    border-radius: 1px;
    animation: wave var(--spd) ease-in-out infinite alternate;
  }
  .mood-title {
    font-size: 15px; font-weight: 800;
    letter-spacing: -0.03em; margin-bottom: 6px; line-height: 1.2;
  }
  .mood-track { font-size: 10px; color: var(--text-muted); line-height: 1.4; }
  .mood-footer {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-top: 10px; padding-top: 10px;
    border-top: 1px solid var(--glass-border);
  }
  .mood-tag {
    font-size: 8px; font-weight: 700;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--text-muted);
  }
  .mood-play {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(212,175,55,0.12);
    border: 1px solid rgba(212,175,55,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--gold);
    transition: background 0.2s, box-shadow 0.2s;
  }
  .mood-card:hover .mood-play {
    background: var(--gold); color: #000;
    box-shadow: 0 0 12px var(--gold-glow);
  }

  .path-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 22px; padding: 16px 18px; margin-bottom: 8px;
    cursor: pointer; backdrop-filter: blur(20px);
    transition: border-color 0.3s;
    display: flex; align-items: center; gap: 14px;
  }
  .path-card:hover { border-color: rgba(212,175,55,0.2); }
  .path-freq-badge {
    font-size: 8px; font-weight: 800;
    letter-spacing: 0.3em; color: var(--gold);
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.15);
    padding: 4px 8px; border-radius: 8px;
    flex-shrink: 0; text-transform: uppercase;
  }
  .path-title { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; }
  .path-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .path-play {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(212,175,55,0.08);
    border: 1px solid var(--glass-border-gold);
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); font-size: 11px; flex-shrink: 0;
    transition: background 0.2s;
  }
  .path-card:hover .path-play { background: var(--gold); color: #000; }

  .time-matched {
    background: linear-gradient(135deg,
      rgba(34,211,238,0.06) 0%, rgba(212,175,55,0.04) 100%);
    border: 1px solid rgba(34,211,238,0.15);
    border-radius: var(--radius); padding: 20px; margin-bottom: 24px;
    backdrop-filter: blur(40px);
    display: flex; align-items: center; gap: 14px; cursor: pointer;
  }
  .time-icon {
    width: 44px; height: 44px; border-radius: 14px;
    background: rgba(34,211,238,0.08);
    border: 1px solid rgba(34,211,238,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .time-label {
    font-size: 8px; font-weight: 800; letter-spacing: 0.4em;
    text-transform: uppercase; color: var(--cyan); margin-bottom: 3px;
  }
  .time-title { font-size: 15px; font-weight: 800; letter-spacing: -0.03em; }
  .time-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  .browse-section {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    overflow: hidden; backdrop-filter: blur(40px); margin-bottom: 24px;
  }
  .browse-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 20px; cursor: pointer;
  }
  .browse-title { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; }
  .browse-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .browse-chevron {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(212,175,55,0.08);
    border: 1px solid var(--glass-border-gold);
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); font-size: 12px;
    transition: transform 0.3s;
  }

  .gold-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent);
    margin: 20px 0;
  }

  .bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: rgba(5,5,5,0.92);
    backdrop-filter: blur(40px);
    border-top: 1px solid var(--glass-border);
    display: flex; justify-content: space-around;
    padding: 10px 0 10px;
    z-index: 100;
  }
  .nav-item {
    display: flex; flex-direction: column;
    align-items: center; gap: 4px;
    cursor: pointer; padding: 4px 12px;
  }
  .nav-icon { font-size: 18px; color: var(--text-muted); transition: color 0.2s; }
  .nav-item.active .nav-icon {
    color: var(--gold);
    filter: drop-shadow(0 0 6px rgba(212,175,55,0.4));
  }
  .nav-label {
    font-size: 8px; font-weight: 700;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--text-muted);
  }
  .nav-item.active .nav-label { color: var(--gold); }

  .float-btn {
    position: fixed;
    bottom: 80px; right: 20px;
    background: var(--gold); color: #000; border: none;
    border-radius: 28px; padding: 13px 20px;
    font-size: 12px; font-weight: 800;
    letter-spacing: 0.05em; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 30px rgba(212,175,55,0.4);
    z-index: 99; transition: transform 0.2s;
    animation: float-breathe 3s ease-in-out infinite;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  @keyframes float-breathe {
    0%,100% { box-shadow: 0 4px 30px rgba(212,175,55,0.4); }
    50%      { box-shadow: 0 4px 40px rgba(212,175,55,0.6), 0 0 60px rgba(212,175,55,0.1); }
  }
  .float-btn:hover { transform: scale(1.04); }
`;

const JyotishMusicCard = () => {
  const { t } = useTranslation();
  const jyotish = useJyotishProfile();
  if (jyotish.isLoading) return null;
  return (
    <div className="mx-0 mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-900/20 to-indigo-900/20 border border-amber-800/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-indigo-400">🎵</span>
        <span className="text-sm font-serif text-amber-300 uppercase tracking-wider">
          {t('music.portal.jyotishTitle', 'Cosmic Sound Prescription')}
        </span>
      </div>
      <p className="text-sm text-amber-100/70">
        {t('music.portal.jyotishBodyPrefix', 'Your')}{' '}
        <strong className="text-amber-200">{jyotish.mahadasha}</strong>{' '}
        {t('music.portal.jyotishBodyMid', 'period resonates with')}{' '}
        <strong className="text-amber-200">{jyotish.musicRaga}</strong>{' '}
        {t('music.portal.jyotishBodyAnd', 'and')}{' '}
        <strong className="text-amber-200">{jyotish.musicFrequency}</strong>.{' '}
        {t('music.portal.jyotishBodySuffix', { defaultValue: 'Listen to these to balance your {{dosha}} energy.', dosha: jyotish.primaryDosha })}
      </p>
    </div>
  );
};
interface Playlist {
  id: string;
  name: string;
  user_id: string;
}

interface PlayHistory {
  track_id: string;
  play_count: number;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  cover_image_url: string | null;
  price_usd: number;
}

const GENRES = ['all', 'beats', 'meditation', 'mystic', 'reggae', 'hip-hop', 'reggaeton', 'indian', 'shamanic'];

function MiniWave() {
  return (
    <div className="mini-wave">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="mini-bar"
          style={{
            height: `${3 + Math.random() * 11}px`,
            ['--spd' as string]: `${0.5 + Math.random()}s`,
            animationDelay: `${Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
}

function HeroWave() {
  return (
    <div className="waveform">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            ['--spd' as string]: `${0.4 + Math.random() * 0.8}s`,
            animationDelay: `${Math.random() * 0.8}s`,
          }}
        />
      ))}
    </div>
  );
}

function timeOfDayKey() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

const Music: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, checkSubscription, refreshPurchases, playTrack, currentTrack } = useMusicPlayer();
  const { user } = useAuth();
  const starsRef = useRef<HTMLDivElement | null>(null);
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [purchasedAlbumIds, setPurchasedAlbumIds] = useState<string[]>([]);
  const [albumTracksMap, setAlbumTracksMap] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'albums' | 'playlists' | 'history'>('browse');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedPath, setSelectedPath] = useState('all');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  // Curated playlists
  const { playlists: curatedPlaylists, loading: curatedLoading, getPlaylistItems } = useCuratedPlaylists('music');
  const [selectedCuratedPlaylist, setSelectedCuratedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [curatedPlaylistTracks, setCuratedPlaylistTracks] = useState<Track[]>([]);
  
  // User Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playHistory, setPlayHistory] = useState<PlayHistory[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<string[]>([]);
  const [openLibrary, setOpenLibrary] = useState(false);
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const [selectedForMood, setSelectedForMood] = useState<Record<MoodKey, Track | null>>({
    calm: null,
    comfort: null,
    energy: null,
    rest: null,
    background: null,
  });

  const moods = useMemo(
    () => [
      { value: 'all', label: t('music.portal.moodAll', 'All Moods') },
      { value: 'calm', label: t('music.portal.moodCalm', 'Calm') },
      { value: 'energizing', label: t('music.portal.moodEnergizing', 'Energizing') },
      { value: 'healing', label: t('music.portal.moodHealing', 'Healing') },
      { value: 'meditative', label: t('music.portal.moodMeditative', 'Meditative') },
      { value: 'grounding', label: t('music.portal.moodGrounding', 'Grounding') },
    ],
    [t]
  );

  const spiritualPaths = useMemo(
    () => [
      { value: 'all', label: t('music.portal.pathAll', 'All Paths') },
      { value: 'inner_peace', label: t('music.portal.pathInnerPeace', 'Inner Peace') },
      { value: 'focus', label: t('music.portal.pathFocus', 'Focus') },
      { value: 'sleep', label: t('music.portal.pathSleep', 'Sleep Sanctuary') },
      { value: 'healing', label: t('music.portal.pathDeepHealing', 'Deep Healing') },
      { value: 'awakening', label: t('music.portal.pathAwakening', 'Awakening') },
    ],
    [t]
  );

  const moodCards = useMemo(
    () => [
      { hz: '432 HZ', title: t('music.portal.cardCalmThoughts', 'Calm my thoughts'), trackLabel: t('music.portal.trackExampleCalm', 'HARE KRISHNA SLOW (Beat)'), tag: t('music.portal.tagCalming', 'Calming'), moodKey: 'calm' as MoodKey },
      { hz: '528 HZ', title: t('music.portal.cardComfort', 'Feel comfort'), trackLabel: t('music.portal.trackExampleComfort', 'ABUNDANCE ACTIVATION'), tag: t('music.portal.tagHealing', 'Healing'), moodKey: 'comfort' as MoodKey },
      { hz: '417 HZ', title: t('music.portal.cardEnergy', 'More energy'), trackLabel: t('music.portal.trackExampleEnergy', 'DISCIPLE 2 DISCIPLINE (Beat)'), tag: t('music.portal.tagEnergizing', 'Energizing'), moodKey: 'energy' as MoodKey },
      { hz: '396 HZ', title: t('music.portal.cardRest', 'Deep rest'), trackLabel: t('music.portal.trackExampleRest', 'DEVI MARYADA (Beat)'), tag: t('music.portal.tagRest', 'Rest'), moodKey: 'rest' as MoodKey },
      { hz: '432 HZ', title: t('music.portal.cardBackground', 'Silent background'), trackLabel: t('music.portal.trackExampleBackground', 'SCRIPTUREZ OF GIZA (Beat)'), tag: t('music.portal.tagFocus', 'Focus'), moodKey: 'background' as MoodKey, full: true },
    ],
    [t]
  );

  const recentPlaceholders = useMemo(
    () => [
      { hz: '432 Hz', title: t('music.portal.continueListening', 'Continue listening') },
      { hz: '528 Hz', title: t('music.portal.recentTrack', 'Recent track') },
    ],
    [t]
  );

  useEffect(() => {
    if (!starsRef.current) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --dur: ${2 + Math.random() * 4}s;
        animation-delay: ${Math.random() * 4}s;
      `;
      frag.appendChild(s);
    }
    starsRef.current.appendChild(frag);
  }, []);

  useEffect(() => {
    fetchTracks();
    fetchAlbums();
    fetchPlaylists();
    fetchPlayHistory();
    fetchPurchasedAlbums();
    checkSubscription();
    refreshPurchases();
    
    const membershipSuccess = searchParams.get('membership_success');
    const albumSuccess = searchParams.get('album_success');
    if (membershipSuccess) {
      toast({ title: t('music.portal.toastSubActive', 'Subscription active!'), description: t('music.portal.toastSubDesc', 'Enjoy unlimited music streaming.') });
      checkSubscription();
    }
    if (albumSuccess) {
      toast({ title: t('music.portal.toastAlbumPurchased', 'Album purchased!'), description: t('music.portal.toastAlbumDesc', 'You now have full access to all tracks in this album.') });
      fetchPurchasedAlbums();
      refreshPurchases();
    }
  }, [searchParams]);

  const fetchTracks = async () => {
    const { data } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
    if (data) setTracks(data as Track[]);
    setIsLoading(false);
  };

  const fetchAlbums = async () => {
    const { data: albumsData } = await supabase.from('music_albums').select('*').order('created_at', { ascending: false });
    if (albumsData) setAlbums(albumsData);
    
    // Fetch album tracks
    const { data: albumTracks } = await supabase.from('album_tracks').select('album_id, track_id').order('order_index');
    if (albumTracks) {
      const map: Record<string, string[]> = {};
      albumTracks.forEach(at => {
        if (!map[at.album_id]) map[at.album_id] = [];
        map[at.album_id].push(at.track_id);
      });
      setAlbumTracksMap(map);
    }
  };

  const fetchPurchasedAlbums = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('album_purchases').select('album_id').eq('user_id', user.id);
    if (data) setPurchasedAlbumIds(data.map(p => p.album_id));
  };

  const hasAlbumAccess = (albumId: string) => {
    return isSubscribed || purchasedAlbumIds.includes(albumId);
  };

  const handlePurchaseAlbum = async (album: Album) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-album-checkout', {
        body: { albumId: album.id }
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: "destructive" });
    }
  };

  const fetchPlaylists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_playlists').select('*').eq('user_id', user.id).order('created_at');
    if (data) setPlaylists(data);
  };

  const fetchPlayHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('music_play_history').select('track_id, play_count').eq('user_id', user.id).order('play_count', { ascending: false });
    if (data) setPlayHistory(data);
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    const { data } = await supabase.from('playlist_tracks').select('track_id').eq('playlist_id', playlistId).order('order_index');
    if (data) setPlaylistTracks(data.map(pt => pt.track_id));
  };

  const handleSubscribe = () => {
    // ◈ SQI 2050 — All music access is via Prana-Flow tier (19€/mo)
    navigate('/prana-flow');
  };

  const handlePurchaseTrack = async (track: Track) => {
    try {
      const { data, error } = await supabase.functions.invoke('purchase-music', {
        body: { trackId: track.id, paymentMethod: 'stripe' }
      });
      if (error) throw error;
      if (data?.checkoutUrl) window.open(data.checkoutUrl, '_blank');
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: "destructive" });
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('user_playlists').insert({ user_id: user.id, name: newPlaylistName.trim() });
    setNewPlaylistName('');
    fetchPlaylists();
    toast({ title: t('music.portal.playlistCreated', 'Playlist created') });
  };

  const renamePlaylist = async (id: string) => {
    if (!editingName.trim()) return;
    await supabase.from('user_playlists').update({ name: editingName.trim() }).eq('id', id);
    setEditingPlaylistId(null);
    fetchPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from('user_playlists').delete().eq('id', id);
    fetchPlaylists();
    if (selectedPlaylist === id) setSelectedPlaylist(null);
  };

  const addToPlaylist = async (playlistId: string, trackId: string) => {
    const maxOrder = playlistTracks.length;
    await supabase.from('playlist_tracks').insert({ playlist_id: playlistId, track_id: trackId, order_index: maxOrder });
    fetchPlaylistTracks(playlistId);
    toast({ title: t('music.portal.addedToPlaylist', 'Added to playlist') });
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId).eq('track_id', trackId);
    fetchPlaylistTracks(playlistId);
  };

  const filteredTracks = tracks.filter(t => {
    if (selectedGenre !== 'all' && t.genre !== selectedGenre) return false;
    if (selectedMood !== 'all' && t.mood !== selectedMood) return false;
    if (selectedPath !== 'all' && t.spiritual_path !== selectedPath) return false;
    return true;
  });
  const newReleases = [...tracks].sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime()).slice(0, 5);
  const historyTracks = playHistory.map(h => tracks.find(t => t.id === h.track_id)).filter(Boolean) as Track[];
  const playlistTracksList = playlistTracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];
  const userId = user?.id ?? 'anon';

  const dailyPicks = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    const baseSeed = `${userId}:${date}:${shuffleNonce}`;

    const picks: Record<MoodKey, Track | null> = {
      calm: null,
      comfort: null,
      energy: null,
      rest: null,
      background: null,
    };

    const used: string[] = [];

    const pickMood = (mood: MoodKey) => {
      const picked = selectTrackForMood(tracks as any[], mood, {
        seed: `${baseSeed}:${mood}`,
        excludeIds: used,
      }) as Track | null;
      if (picked) used.push(getTrackIdSafe(picked as any));
      picks[mood] = picked;
    };

    pickMood('calm');
    pickMood('comfort');
    pickMood('energy');
    pickMood('rest');
    pickMood('background');

    return picks;
  }, [tracks, userId, shuffleNonce]);

  const onMoodClick = (mood: MoodKey) => {
    const track = dailyPicks[mood];
    if (!track) {
      toast({ title: t('music.portal.toastNoTracksTitle', 'No tracks available'), description: t('music.portal.toastNoTracksDesc', 'Music sessions are coming soon.') });
      return;
    }
    playTrack(track, tracks);
    setSelectedForMood((prev) => ({ ...prev, [mood]: track }));
  };

  const playForMe = () => {
    const tod = timeOfDayKey();
    const key: MoodKey =
      tod === 'morning' ? 'energy' : tod === 'afternoon' ? 'background' : 'rest';
    onMoodClick(key);
  };

  const lastPlayed: Track | null =
    currentTrack ||
    (historyTracks && historyTracks.length > 0 ? historyTracks[0] : null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="sqi-root">
      <style>{styles}</style>

      <div className="anahata-ring" />
      <div ref={starsRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div className="sqi-page">
        <div className="sqi-header">
          <button className="sqi-back-btn" onClick={() => navigate(-1)}>
            ←
          </button>
          <div className="sqi-page-title">{t('music.portal.pageTitle', '♪ Sacred Sound Portal')}</div>
        </div>

        <div className="planetary-hero">
          <div className="hero-eyebrow">{t('music.portal.heroEyebrow', 'Current Planetary Sound')}</div>
          <div className="hero-title">
            {t('music.portal.heroTitle1', 'Sacred')}
            <br />
            {t('music.portal.heroTitle2', 'Frequencies')}
          </div>
          <HeroWave />
          <div className="hero-meta">
            <div className="hero-freq-tag">
              <div className="nadi-dot" />
              {t('music.portal.heroLiveTransmission', '963 Hz · Live Transmission')}
            </div>
            <button className="hero-play-btn" onClick={playForMe}>
              ▶
            </button>
          </div>
        </div>

        <div className="prescription-card">
          <div className="presc-header">
            <span style={{ color: 'var(--gold)' }}>♫</span>
            <span className="presc-label">{t('music.portal.prescriptionLabel', 'Cosmic Sound Prescription')}</span>
          </div>
          <div className="presc-text">
            {t('music.portal.prescriptionCopy', 'Your Jupiter period resonates with Raga Yaman and 963Hz (divine connection). Listen to these to balance your Kapha energy.')}
          </div>
        </div>

        <div
          className="pranaflow-banner"
          onClick={async () => {
            await handleSubscribe();
          }}
        >
          <div className="pf-inner">
            <div className="pf-crown">👑</div>
            <div className="pf-content">
              <div className="pf-tier-label">{t('music.portal.pranaflowTier', 'Pranaflow Tier')}</div>
              <div className="pf-name">{t('music.portal.musicMember', 'Music Member')}</div>
              <div className="pf-desc">{t('music.portal.pranaflowDesc', 'Unlimited streaming · 33 SHC/track · Renews soon')}</div>
            </div>
            <div className="pf-badge">{t('music.portal.pranaflowPrice', '19€/mo')}</div>
          </div>
        </div>

        <div className="mastering-card" onClick={() => navigate('/mastering')}>
          <div className="mastering-icon">🎛</div>
          <div style={{ flex: 1 }}>
            <div className="mastering-title">{t('music.portal.masteringTitle', 'Music Mastering Service')}</div>
            <div className="mastering-sub">{t('music.portal.masteringSub', 'Professional audio mastering from €147')}</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
        </div>

        <div className="gold-divider" />

        <div className="section-header">
          <div>
            <div className="section-title">{t('music.portal.sectionNeedTitle', 'What do you need right now?')}</div>
            <div className="section-sub">{t('music.portal.sectionNeedSub', 'One tap — the sound meets you where you are.')}</div>
          </div>
          <button
            className="shuffle-btn"
            onClick={() => {
              setShuffleNonce((n) => n + 1);
              setSelectedForMood({
                calm: null,
                comfort: null,
                energy: null,
                rest: null,
                background: null,
              });
            }}
          >
            ⇄ {t('music.portal.shuffle', 'Shuffle')}
          </button>
        </div>

        <div className="mood-grid">
          {moodCards.map((m) => (
            <div
              key={m.title}
              className={`mood-card${m.full ? ' full-width' : ''}`}
              onClick={() => onMoodClick(m.moodKey)}
            >
              <div className="mood-freq">
                <div className="freq-dot" />
                {m.hz}
              </div>
              <MiniWave />
              <div className="mood-title">{m.title}</div>
              <div className="mood-track">{m.trackLabel}</div>
              <div className="mood-footer">
                <div className="mood-tag">{m.tag}</div>
                <div className="mood-play">▶</div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <div>
            <div className="section-title">{t('music.portal.soundPathTitle', 'Your Sound Path')}</div>
            <div className="section-sub">{t('music.portal.soundPathSub', "The sounds you've returned to recently.")}</div>
          </div>
        </div>

        {lastPlayed && (
          <div className="path-card" onClick={() => playTrack(lastPlayed, tracks)}>
            <div className="path-freq-badge">432 Hz</div>
            <div style={{ flex: 1 }}>
              <div className="path-title">{t('music.portal.continueListening', 'Continue listening')}</div>
              <div className="path-sub">{lastPlayed.title}</div>
            </div>
            <div className="path-play">▶</div>
          </div>
        )}

        {historyTracks
          .filter((t) => !lastPlayed || t.id !== lastPlayed.id)
          .slice(0, 2)
          .map((track, index) => (
            <div key={track.id} className="path-card" onClick={() => playTrack(track, tracks)}>
              <div className="path-freq-badge">{index === 0 ? '432 Hz' : '528 Hz'}</div>
              <div style={{ flex: 1 }}>
                <div className="path-title">{track.title}</div>
                {track.mood && <div className="path-sub">{tMusicMood(track.mood, t)}</div>}
              </div>
              <div className="path-play">▶</div>
            </div>
          ))}

        {!lastPlayed && historyTracks.length === 0 && (
          <>
            {recentPlaceholders.map((r) => (
              <div key={r.title} className="path-card">
                <div className="path-freq-badge">{r.hz}</div>
                <div style={{ flex: 1 }}>
                  <div className="path-title">{r.title}</div>
                  <div className="path-sub">{t('music.portal.soonListening', 'Soon this will show your listening.')}</div>
                </div>
                <div className="path-play">▶</div>
              </div>
            ))}
          </>
        )}

        <div className="time-matched" style={{ marginTop: 8 }} onClick={playForMe}>
          <div className="time-icon">🕐</div>
          <div style={{ flex: 1 }}>
            <div className="time-label">{t('music.portal.nadiScanner', 'Nadi Scanner · Time-Matched')}</div>
            <div className="time-title">{t('music.portal.timeMatchedTitle', 'The sound that fits now')}</div>
            <div className="time-sub">{t('music.portal.timeMatchedSub', 'Matched to your time of day — no thinking required.')}</div>
          </div>
          <span style={{ color: 'var(--cyan)', fontSize: 16 }}>›</span>
        </div>

        <div className="browse-section">
          <div
            className="browse-header"
            onClick={() => {
              setOpenLibrary((v) => !v);
            }}
          >
            <div>
              <div className="browse-title">{t('music.portal.browseTitle', 'Browse All Sounds')}</div>
              <div className="browse-sub">{t('music.portal.browseSub', 'Only if you feel like exploring.')}</div>
            </div>
            <div className="browse-chevron">{openLibrary ? '∧' : '∨'}</div>
          </div>

          {openLibrary && (
            <div className="px-4 pb-5">
              {/* Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {(['browse', 'albums', 'playlists', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === 'browse') {
                        setSelectedPlaylist(null);
                        setSelectedAlbum(null);
                        setSelectedCuratedPlaylist(null);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {tab === 'albums' && <Disc size={14} className="inline mr-1" />}
                    {tab === 'browse' && t('music.portal.tabBrowse', 'Browse')}
                    {tab === 'albums' && t('music.portal.tabAlbums', 'Albums')}
                    {tab === 'playlists' && t('music.portal.tabPlaylists', 'Playlists')}
                    {tab === 'history' && t('music.portal.tabHistory', 'History')}
                  </button>
                ))}
              </div>

              {/* Albums Tab */}
              {activeTab === 'albums' && (
                <div>
                  {selectedAlbum ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAlbum(null)}>
                          ← {t('common.back', 'Back')}
                        </Button>
                      </div>

                      {/* Album Header */}
                      <div className="flex gap-4 mb-6">
                        {selectedAlbum.cover_image_url ? (
                          <img
                            src={selectedAlbum.cover_image_url}
                            alt={selectedAlbum.title}
                            className="w-24 h-24 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                            <Disc size={32} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-xl font-bold">{selectedAlbum.title}</h2>
                          <p className="text-sm text-muted-foreground">{selectedAlbum.artist}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('music.portal.trackCount', { defaultValue: '{{count}} tracks', count: String(albumTracksMap[selectedAlbum.id]?.length || 0) })}
                          </p>

                          {hasAlbumAccess(selectedAlbum.id) ? (
                            <span className="text-xs text-primary mt-2 inline-block">{t('music.portal.fullAccess', '✓ Full access')}</span>
                          ) : (
                            <Button size="sm" className="mt-2" onClick={() => handlePurchaseAlbum(selectedAlbum)}>
                              {t('music.portal.buyAlbumCta', {
                                defaultValue: 'Buy album {{price}}',
                                price: `$${selectedAlbum.price_usd}`,
                              })}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Album Tracks */}
                      <div className="space-y-2">
                        {(albumTracksMap[selectedAlbum.id] || []).map((trackId) => {
                          const track = tracks.find((t) => t.id === trackId);
                          if (!track) return null;
                          return (
                            <TrackCard
                              key={track.id}
                              track={track}
                              playlists={playlists}
                              onAddToPlaylist={addToPlaylist}
                              onPurchase={handlePurchaseTrack}
                              allTracks={tracks.filter((t) => albumTracksMap[selectedAlbum.id]?.includes(t.id))}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {albums.map((album) => (
                        <button
                          key={album.id}
                          onClick={() => setSelectedAlbum(album)}
                          className="bg-muted/30 border border-border/50 rounded-xl p-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          {album.cover_image_url ? (
                            <img
                              src={album.cover_image_url}
                              alt={album.title}
                              className="w-full aspect-square rounded-lg object-cover mb-2"
                            />
                          ) : (
                            <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-2">
                              <Disc size={32} className="text-muted-foreground" />
                            </div>
                          )}
                          <h3 className="font-medium text-sm truncate">{album.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {t('music.portal.trackCount', { defaultValue: '{{count}} tracks', count: String(albumTracksMap[album.id]?.length || 0) })}
                            </span>
                            {hasAlbumAccess(album.id) ? (
                              <span className="text-xs text-primary">{t('music.owned', '✓ Owned')}</span>
                            ) : (
                              <span className="text-xs text-primary font-medium">${album.price_usd}</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {albums.length === 0 && (
                        <p className="col-span-2 text-muted-foreground text-sm text-center py-8">
                          {t('music.portal.noAlbums', 'No albums available yet')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Browse Tab */}
              {activeTab === 'browse' && (
                <>
                  {selectedCuratedPlaylist ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCuratedPlaylist(null);
                            setCuratedPlaylistTracks([]);
                          }}
                        >
                          <ArrowLeft size={16} className="mr-1" /> {t('common.back', 'Back')}
                        </Button>
                      </div>

                      {/* Playlist Header */}
                      <div className="flex gap-4 mb-6">
                        {selectedCuratedPlaylist.cover_image_url ? (
                          <img
                            src={selectedCuratedPlaylist.cover_image_url}
                            alt={selectedCuratedPlaylist.title}
                            className="w-24 h-24 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <Music2 size={32} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-xl font-bold">{selectedCuratedPlaylist.title}</h2>
                          {selectedCuratedPlaylist.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedCuratedPlaylist.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('music.portal.curatedPlaylistMeta', {
                              defaultValue: '{{count}} tracks · {{minutes}} min',
                              count: String(selectedCuratedPlaylist.track_count),
                              minutes: String(Math.floor(selectedCuratedPlaylist.total_duration / 60)),
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Playlist Tracks */}
                      <div className="space-y-2">
                        {curatedPlaylistTracks.map((track) => (
                          <TrackCard
                            key={track.id}
                            track={track}
                            playlists={playlists}
                            onAddToPlaylist={addToPlaylist}
                            onPurchase={handlePurchaseTrack}
                            allTracks={curatedPlaylistTracks}
                          />
                        ))}
                        {curatedPlaylistTracks.length === 0 && (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Curated Playlists Section */}
                      {curatedPlaylists.length > 0 && (
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold mb-3">{t('music.portal.featuredPlaylists', 'Featured Playlists')}</h2>
                          <div className="grid grid-cols-2 gap-3">
                            {curatedPlaylists.map((playlist) => (
                              <CuratedPlaylistCard
                                key={playlist.id}
                                playlist={playlist}
                                onClick={async () => {
                                  setSelectedCuratedPlaylist(playlist);
                                  const items = await getPlaylistItems(playlist.id);
                                  setCuratedPlaylistTracks(items as Track[]);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Filters Section */}
                      <h2 className="text-lg font-semibold mb-3">{t('music.portal.allTracks', 'All Tracks')}</h2>

                      {/* Genre Filter */}
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">{t('music.portal.genre', 'Genre')}</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {GENRES.map((g) => (
                            <button
                              key={g}
                              onClick={() => setSelectedGenre(g)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedGenre === g
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {tMusicGenre(g, t)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mood Filter */}
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">{t('music.portal.moodFilter', 'Mood')}</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {moods.map((m) => (
                            <button
                              key={m.value}
                              onClick={() => setSelectedMood(m.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedMood === m.value
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Spiritual Path Filter */}
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">{t('music.portal.spiritualPath', 'Spiritual Path')}</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {spiritualPaths.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => setSelectedPath(p.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedPath === p.value
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tracks */}
                      <div className="space-y-2">
                        {filteredTracks.map((track) => (
                          <TrackCard
                            key={track.id}
                            track={track}
                            playlists={playlists}
                            onAddToPlaylist={addToPlaylist}
                            onPurchase={handlePurchaseTrack}
                            allTracks={filteredTracks}
                          />
                        ))}
                        {filteredTracks.length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-8">
                            {t('music.portal.noTracksGenre', 'No tracks in this genre yet')}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Playlists Tab */}
              {activeTab === 'playlists' && (
                <div>
                  {/* Create Playlist */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder={t('music.portal.newPlaylistPlaceholder', 'New playlist name')}
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                    />
                    <Button size="sm" onClick={createPlaylist}>
                      <Plus size={16} />
                    </Button>
                  </div>

                  {selectedPlaylist ? (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPlaylist(null)}>
                          ← {t('common.back', 'Back')}
                        </Button>
                        <span className="font-semibold">
                          {playlists.find((p) => p.id === selectedPlaylist)?.name}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {playlistTracksList.map((track) => (
                          <div key={track.id} className="flex items-center gap-2">
                            <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                            <div className="flex-1">
                              <TrackCard
                                track={track}
                                onPurchase={handlePurchaseTrack}
                                allTracks={playlistTracksList}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromPlaylist(selectedPlaylist, track.id)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ))}
                        {playlistTracksList.length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-8">
                            {t('music.portal.noPlaylistTracks', 'No tracks in this playlist yet')}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {playlists.map((pl) => (
                        <div
                          key={pl.id}
                          className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl hover:bg-muted/40 transition-colors"
                        >
                          <List size={18} className="text-muted-foreground" />
                          {editingPlaylistId === pl.id ? (
                            <>
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 h-8"
                              />
                              <Button size="icon" variant="ghost" onClick={() => renamePlaylist(pl.id)}>
                                <Check size={14} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                  setSelectedPlaylist(pl.id);
                                  fetchPlaylistTracks(pl.id);
                                }}
                              >
                                {pl.name}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingPlaylistId(pl.id);
                                  setEditingName(pl.name);
                                }}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => deletePlaylist(pl.id)}>
                                <X size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                      {playlists.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-8">
                          {t('music.portal.createFirstPlaylist', 'Create your first playlist')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">{t('music.portal.mostPlayed', 'Most Played')}</h2>
                  <div className="space-y-2">
                    {historyTracks.map((track, i) => (
                      <div key={track.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6 text-center font-medium">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <TrackCard
                            track={track}
                            playlists={playlists}
                            onAddToPlaylist={addToPlaylist}
                            onPurchase={handlePurchaseTrack}
                            allTracks={historyTracks}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {t('music.portal.plays', { defaultValue: '{{count}} plays', count: String(playHistory.find((h) => h.track_id === track.id)?.play_count ?? 0) })}
                        </span>
                      </div>
                    ))}
                    {historyTracks.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        {t('music.portal.noPlayHistory', 'No play history yet')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="bottom-nav">
        {[
          { icon: '⌂', label: t('music.portal.navHome', 'Home') },
          { icon: '◎', label: t('music.portal.navMeditate', 'Meditate') },
          { icon: '✦', label: t('music.portal.navMantras', 'Mantras') },
          { icon: '♪', label: t('music.portal.navMusic', 'Music'), active: true },
          { icon: '❋', label: t('music.portal.navHealing', 'Healing') },
          { icon: '◯', label: t('music.portal.navProfile', 'Profile') },
        ].map((n) => (
          <div key={n.label} className={`nav-item${n.active ? ' active' : ''}`}>
            <div className="nav-icon">{n.icon}</div>
            <div className="nav-label">{n.label}</div>
          </div>
        ))}
      </nav>

      <button className="float-btn" onClick={playForMe}>
        🎵 {t('music.portal.floatPlayForMe', 'Play something for me')}
      </button>
    </div>
  );
};

export default Music;
