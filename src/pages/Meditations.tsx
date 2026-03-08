/**
 * SQI 2050 — Meditations page
 * Glassmorphism · Siddha-Gold · Akasha-Black · all logic preserved (AffiliateID, Stripe, hooks, play_count, intention threshold, curated playlists).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Clock, Sparkles, ArrowLeft, Loader2, Globe, Lock, Settings } from 'lucide-react';
import BabajiShadow from '@/components/meditation/BabajiShadow';
import { Button } from '@/components/ui/button';
import CustomMeditationBooking from '@/components/meditation/CustomMeditationBooking';
import CustomMeditationCreation from '@/components/meditation/CustomMeditationCreation';
import WealthMeditationService from '@/components/meditation/WealthMeditationService';
import MeditationMembershipBanner from '@/components/meditation/MeditationMembershipBanner';
import { CuratedMeditationCard } from '@/components/meditation/CuratedMeditationCard';
import { IntentionThreshold, IntentionType } from '@/components/meditation/IntentionThreshold';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCuratedPlaylists, CuratedPlaylist } from '@/hooks/useCuratedPlaylists';
import { useMusicPlayer, UniversalAudioItem } from '@/contexts/MusicPlayerContext';
import { useUserDailyState } from '@/hooks/useUserDailyState';
import { getDayPhase } from '@/utils/postSessionContext';
import { StartNowCard } from '@/features/meditations/StartNowCard';
import { LanguageToggle } from '@/features/meditations/LanguageToggle';
import { useMeditationContentLanguage } from '@/features/meditations/useContentLanguage';
import { selectStartNowItem } from '@/features/meditations/startNowSelector';
import { filterByMeditationLanguage, buildSections } from '@/features/meditations/groupAndFilter';
import type { MeditationSectionKey } from '@/features/meditations/groupAndFilter';
import { BackToTopFab } from '@/features/meditations/BackToTopFab';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAuth } from '@/hooks/useAuth';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import type { UserProfile } from '@/lib/vedicTypes';
import type { ContentLanguage } from '@/utils/contentLanguage';

const SQI_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
  :root {
    --siddha-gold: #D4AF37;
    --gold-glow: rgba(212,175,55,0.25);
    --gold-faint: rgba(212,175,55,0.08);
    --akasha-black: #050505;
    --glass-bg: rgba(255,255,255,0.02);
    --glass-border: rgba(255,255,255,0.05);
    --text-primary: rgba(255,255,255,0.92);
    --text-muted: rgba(255,255,255,0.45);
    --vayu-cyan: #22D3EE;
    --radius-xl: 40px;
    --radius-lg: 20px;
  }
  .sqi-page { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--akasha-black); min-height: 100vh; color: var(--text-primary); overflow-x: hidden; }
  .glass-card { background: var(--glass-bg); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid var(--glass-border); border-radius: var(--radius-xl); transition: border-color 0.3s ease, box-shadow 0.3s ease; }
  .glass-card:hover { border-color: rgba(212,175,55,0.15); }
  .gold-glow { color: var(--siddha-gold); text-shadow: 0 0 15px rgba(212,175,55,0.3); }
  .akasha-hero { position: relative; padding: 48px 20px 32px; overflow: hidden; }
  .akasha-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 100%, rgba(34,211,238,0.04) 0%, transparent 60%); pointer-events: none; }
  @keyframes nadiPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
  .nadi-pulse { animation: nadiPulse 3s ease-in-out infinite; color: var(--vayu-cyan); filter: drop-shadow(0 0 8px var(--vayu-cyan)); }
  @keyframes orbFloat { 0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; } 33% { transform: translateY(-12px) rotate(120deg); opacity: 0.7; } 66% { transform: translateY(6px) rotate(240deg); opacity: 0.5; } }
  .gold-orb { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(212,175,55,0.3), transparent 70%); pointer-events: none; animation: orbFloat var(--dur, 8s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
  .lang-pill { display: inline-flex; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 100px; padding: 3px; gap: 2px; }
  .lang-btn { padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; border: none; cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-muted); }
  .lang-btn.active { background: linear-gradient(135deg, #D4AF37, #B8960C); color: #050505; box-shadow: 0 0 12px rgba(212,175,55,0.4); }
  .jyotish-banner { background: linear-gradient(135deg, rgba(212,175,55,0.06), rgba(139,92,246,0.06)); border: 1px solid rgba(212,175,55,0.12); border-radius: var(--radius-xl); padding: 20px 24px; margin: 0 20px 24px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; cursor: pointer; border-radius: var(--radius-xl); transition: background 0.2s; }
  .section-header:hover { background: rgba(255,255,255,0.02); }
  .meditation-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 20px; transition: background 0.2s ease; cursor: pointer; position: relative; }
  .meditation-row:hover { background: rgba(212,175,55,0.04); }
  .play-btn { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05)); border: 1px solid rgba(212,175,55,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.25s ease; color: var(--siddha-gold); }
  .play-btn:hover, .play-btn.playing { background: linear-gradient(135deg, #D4AF37, #B8960C); color: #050505; box-shadow: 0 0 20px rgba(212,175,55,0.5); transform: scale(1.08); }
  .badge-premium { font-size: 9px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05)); border: 1px solid rgba(212,175,55,0.3); color: var(--siddha-gold); }
  .badge-free { font-size: 9px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.2); color: var(--vayu-cyan); }
  .lock-overlay { position: absolute; inset: 0; border-radius: 20px; background: rgba(5,5,5,0.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
  .meditation-row:hover .lock-overlay { opacity: 1; }
  .akasha-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent); margin: 4px 20px; }
  .commission-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 24px; background: var(--glass-bg); border: 1px solid var(--glass-border); cursor: pointer; transition: all 0.25s ease; }
  .commission-card:hover { border-color: rgba(212,175,55,0.2); box-shadow: 0 8px 32px rgba(212,175,55,0.06); }
  .micro-label { font-size: 8px; font-weight: 800; letter-spacing: 0.5em; text-transform: uppercase; color: var(--text-muted); }
  .hero-title { font-size: clamp(22px, 5vw, 32px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.1; }
  @keyframes goldShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  .shimmer-text { background: linear-gradient(90deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: goldShimmer 4s linear infinite; }
  .progress-track { height: 3px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #D4AF37, #F5E17A); border-radius: 3px; transition: width 0.5s ease; }
  @keyframes scalarRing { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 0.4; } 100% { transform: scale(1.4); opacity: 0; } }
  .scalar-ring { position: absolute; inset: -4px; border-radius: 50%; border: 1px solid var(--vayu-cyan); animation: scalarRing 2.5s ease-out infinite; }
  .chevron { width: 24px; height: 24px; border: 1px solid var(--glass-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 12px; transition: transform 0.3s ease, border-color 0.3s; }
  .chevron.open { transform: rotate(180deg); border-color: rgba(212,175,55,0.3); color: var(--siddha-gold); }
`;

const JyotishMeditationCard = () => {
  const jyotish = useJyotishProfile();
  if (jyotish.isLoading) return null;
  if (!jyotish.mahadasha) return null;
  return (
    <div className="jyotish-banner" style={{ fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>🔭</span>
        <span className="micro-label" style={{ color: 'rgba(212,175,55,0.7)' }}>Jyotish Meditation Guidance</span>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
        Your <strong style={{ color: '#D4AF37' }}>{jyotish.mahadasha} Mahadasha</strong> period recommends{' '}
        <strong style={{ color: '#D4AF37' }}>{jyotish.meditationType}</strong>. Focus on {jyotish.karmaFocus} for deepest benefit.
      </p>
    </div>
  );
};

interface Meditation {
  id: string;
  title: string;
  title_sv?: string;
  description?: string | null;
  duration_minutes?: number;
  tier?: string;
  category?: string;
  audio_url?: string;
  audio_url_sv?: string;
  cover_image_url?: string | null;
  shc_reward?: number;
  is_premium?: boolean;
  play_count?: number;
}

const MeditationRow: React.FC<{
  med: Meditation;
  lang: ContentLanguage;
  isPlaying: boolean;
  isLocked: boolean;
  onPlay: () => void;
  onLock: () => void;
  progress?: number;
}> = ({ med, lang, isPlaying, isLocked, onPlay, onLock, progress }) => {
  const title = lang === 'sv' && med.title_sv ? med.title_sv : med.title;
  const isFree = !med.is_premium && med.tier === 'free';
  return (
    <div className="meditation-row" onClick={isLocked ? onLock : onPlay}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          className={`play-btn${isPlaying ? ' playing' : ''}`}
          onClick={e => { e.stopPropagation(); isLocked ? onLock() : onPlay(); }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} strokeWidth={2.5} /> : <Play size={16} strokeWidth={2.5} style={{ marginLeft: 2 }} />}
        </button>
        {isPlaying && <div className="scalar-ring" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: isLocked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.92)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(med.duration_minutes != null) && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{med.duration_minutes} min</span>
          )}
          {(med.shc_reward != null) && (
            <span style={{ fontSize: 11, color: 'rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}><Sparkles size={10} />+{med.shc_reward} SHC</span>
          )}
          {med.audio_url_sv && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.6)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 6, padding: '2px 6px' }}>SV+EN</span>
          )}
        </div>
        {isPlaying && progress !== undefined && (
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {isFree ? <span className="badge-free">Free</span> : <span className="badge-premium">{isLocked ? '🔒' : '✦'} Prana+</span>}
      </div>
      {isLocked && (
        <div className="lock-overlay">
          <div style={{ textAlign: 'center' }}>
            <Lock size={18} color="#D4AF37" style={{ margin: '0 auto 4px' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37' }}>Upgrade</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MeditationSectionSQI: React.FC<{
  title: string;
  subtitle?: string;
  meditations: Meditation[];
  lang: ContentLanguage;
  currentAudio: UniversalAudioItem | null;
  isPlaying: boolean;
  playerProgress: number;
  userTier: string;
  onPlay: (med: Meditation, lang: ContentLanguage) => void;
  onLock: () => void;
  defaultOpen?: boolean;
}> = ({ title, subtitle, meditations, lang, currentAudio, isPlaying, playerProgress, userTier, onPlay, onLock, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const canAccess = (med: Meditation) => {
    if (!med.is_premium || med.tier === 'free') return true;
    return ['prana_flow', 'soma', 'brahman', 'admin'].includes(userTier);
  };
  return (
    <div className="glass-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <div className="section-header" onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.9)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div className={`chevron${open ? ' open' : ''}`}>▼</div>
      </div>
      {open && (
        <div style={{ paddingBottom: 12 }}>
          <div className="akasha-divider" />
          {meditations.map((med, i) => (
            <React.Fragment key={med.id}>
              <MeditationRow
                med={med}
                lang={lang}
                isPlaying={isPlaying && currentAudio?.id === med.id}
                isLocked={!canAccess(med)}
                progress={currentAudio?.id === med.id ? playerProgress : undefined}
                onPlay={() => onPlay(med, lang)}
                onLock={onLock}
              />
              {i < meditations.length - 1 && <div className="akasha-divider" style={{ margin: '2px 16px' }} />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const SacredCommissionCard: React.FC<{ icon: string; price: string; title: string; subtitle: string }> = ({ icon, price, title, subtitle }) => (
  <div className="commission-card">
    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.6)', marginBottom: 2 }}>{price}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 1 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{subtitle}</div>
    </div>
    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, flexShrink: 0 }}>›</div>
  </div>
);

const Meditations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reading: vedicReading, generateReading } = useAIVedicReading();
  const { playUniversalAudio, currentAudio, isPlaying, progress: playerProgress } = useMusicPlayer();
  const { language, setLanguage } = useMeditationContentLanguage();
  const { userState } = useUserDailyState();
  const dayPhase = getDayPhase();

  const [searchParams] = useSearchParams();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThreshold, setShowThreshold] = useState(false);
  const [pendingMeditation, setPendingMeditation] = useState<Meditation | null>(null);
  const [currentIntention, setCurrentIntention] = useState<IntentionType | null>(null);

  const { playlists: curatedPlaylists, getPlaylistItems } = useCuratedPlaylists('meditation');
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [playlistMeditations, setPlaylistMeditations] = useState<Meditation[]>([]);

  useEffect(() => {
    if (!user || vedicReading || !generateReading) return;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('birth_name, birth_date, birth_time, birth_place').eq('user_id', user.id).maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        const profile: UserProfile = { name: data.birth_name, birthDate: data.birth_date, birthTime: data.birth_time, birthPlace: data.birth_place, plan: 'compass' };
        await generateReading(profile, 0, 'Europe/Stockholm', user.id);
      }
    };
    load();
  }, [user, vedicReading, generateReading]);

  useEffect(() => { fetchMeditations(); }, []);

  const fetchMeditations = async () => {
    const { data } = await supabase.from('meditations').select('*').order('created_at', { ascending: false });
    if (data) setMeditations(data as Meditation[]);
    setLoading(false);
  };

  useEffect(() => {
    const success = searchParams.get('success');
    const wealthSuccess = searchParams.get('wealth_success');
    const cancelled = searchParams.get('cancelled');
    const membershipSuccess = searchParams.get('membership_success');
    const membershipCancelled = searchParams.get('membership_cancelled');
    if (success === 'true') toast.success(t('meditations.paymentSuccess', 'Payment successful! Adam will begin channeling your meditation.'));
    else if (wealthSuccess === 'true') toast.success(t('meditations.wealthSuccess', 'Payment successful! Check your email for the 108 affirmations.'));
    else if (membershipSuccess) toast.success(t('meditations.membershipSuccess', 'Welcome to Meditation Membership! Your subscription is now active.'));
    else if (cancelled === 'true' || membershipCancelled === 'true') toast.info(t('meditations.paymentCancelled', 'Payment was cancelled'));
  }, [searchParams, t]);

  const userTier = (user as any)?.subscription_tier || 'free';

  const filtered = useMemo(() => filterByMeditationLanguage(meditations, language), [meditations, language]);
  const sectionsObj = useMemo(() => buildSections(filtered), [filtered]);
  const sectionsArray = useMemo(() => {
    const keys: MeditationSectionKey[] = ['short', 'morning', 'sleep', 'healing', 'focus', 'nature', 'all'];
    const titles: Record<MeditationSectionKey, string> = {
      short: t('meditations.sections.short', 'Short resets'),
      morning: t('meditations.sections.morning', 'Morning'),
      sleep: t('meditations.sections.sleep', 'Sleep'),
      healing: t('meditations.sections.healing', 'Healing'),
      focus: t('meditations.sections.focus', 'Focus'),
      nature: t('meditations.sections.nature', 'Nature'),
      all: t('meditations.sections.more', 'More'),
    };
    const subtitles: Record<MeditationSectionKey, string> = {
      short: t('meditations.sections.shortDesc', '2–5 minutes. Easy to begin.'),
      morning: t('meditations.sections.morningDesc', 'Start your day gently.'),
      sleep: t('meditations.sections.sleepDesc', 'Unwind the body and mind.'),
      healing: t('meditations.sections.healingDesc', "Support what's tender."),
      focus: t('meditations.sections.focusDesc', 'Clear and steady attention.'),
      nature: t('meditations.sections.natureDesc', 'Ground in the presence of earth.'),
      all: t('meditations.sections.moreDesc', 'Explore when you feel ready.'),
    };
    return keys.map(key => ({ title: titles[key], subtitle: subtitles[key], items: sectionsObj[key] || [] }));
  }, [sectionsObj, t]);

  const startNowItem = useMemo(() => selectStartNowItem(meditations, { dayPhase, userState, language }), [meditations, dayPhase, userState, language]);

  const buildAudioItem = (med: Meditation, selectedLang: ContentLanguage): UniversalAudioItem => {
    const audioUrl = selectedLang === 'sv' && med.audio_url_sv ? med.audio_url_sv : (med.audio_url ?? '');
    const title = selectedLang === 'sv' && med.title_sv ? med.title_sv : med.title;
    const durationMin = med.duration_minutes ?? 10;
    return {
      id: med.id,
      title,
      artist: 'Siddha Quantum Nexus',
      audio_url: audioUrl,
      cover_image_url: med.cover_image_url ?? null,
      duration_seconds: durationMin * 60,
      shc_reward: med.shc_reward ?? 0,
      contentType: 'meditation',
      originalData: med,
    };
  };

  const startPlayback = async (med: Meditation) => {
    const item = buildAudioItem(med, language);
    if (!item.audio_url) return;
    playUniversalAudio(item);
    const playCount = (med.play_count ?? 0) + 1;
    await supabase.from('meditations').update({ play_count: playCount }).eq('id', med.id);
  };

  const handlePlay = (med: Meditation, selectedLang: ContentLanguage) => {
    const item = buildAudioItem(med, selectedLang);
    if (!item.audio_url) return;
    playUniversalAudio(item);
    const playCount = (med.play_count ?? 0) + 1;
    supabase.from('meditations').update({ play_count: playCount }).eq('id', med.id).then(() => {});
  };

  const initiatePlay = (meditation: Meditation) => {
    if (currentAudio?.id === meditation.id && isPlaying) {
      startPlayback(meditation);
      return;
    }
    setPendingMeditation(meditation);
    setShowThreshold(true);
  };

  const handleIntentionSelected = (intention: IntentionType) => {
    setCurrentIntention(intention);
    setShowThreshold(false);
    if (pendingMeditation) {
      startPlayback(pendingMeditation);
      setPendingMeditation(null);
    }
  };

  const handleThresholdClose = () => {
    setShowThreshold(false);
    if (pendingMeditation) {
      startPlayback(pendingMeditation);
      setPendingMeditation(null);
    }
  };

  const handleLock = () => {
    toast('✦ Upgrade to Prana Flow to unlock this transmission', { description: 'Access the full Akasha library.' });
  };

  if (loading) {
    return (
      <div className="sqi-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <style>{SQI_STYLES}</style>
        <BabajiShadow />
        <Loader2 size={28} className="nadi-pulse" style={{ margin: '0 auto 12px', display: 'block', color: '#22D3EE' }} />
        <div className="micro-label">Accessing Akasha Archive…</div>
      </div>
    );
  }

  if (selectedPlaylist) {
    return (
      <div className="sqi-page">
        <style>{SQI_STYLES}</style>
        <div style={{ padding: '48px 20px 32px' }}>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedPlaylist(null); setPlaylistMeditations([]); }} className="mb-4">
            <ArrowLeft size={16} className="mr-1" /> {t('common.back', 'Back')}
          </Button>
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            {selectedPlaylist.cover_image_url && (
              <img src={selectedPlaylist.cover_image_url} alt={selectedPlaylist.title} style={{ width: 96, height: 96, borderRadius: 16, objectFit: 'cover', marginBottom: 12 }} />
            )}
            <h2 style={{ fontWeight: 800, fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>{selectedPlaylist.title}</h2>
            {selectedPlaylist.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{selectedPlaylist.description}</p>}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{selectedPlaylist.track_count} sessions</p>
          </div>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {playlistMeditations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Loader2 className="animate-spin" size={24} style={{ color: 'rgba(212,175,55,0.6)' }} /></div>
            ) : (
              <>
                <div className="akasha-divider" />
                {playlistMeditations.map((m, i) => (
                  <React.Fragment key={m.id}>
                    <MeditationRow
                      med={m}
                      lang={language}
                      isPlaying={isPlaying && currentAudio?.id === m.id}
                      isLocked={!['prana_flow', 'soma', 'brahman', 'admin'].includes(userTier) && !!m.is_premium && m.tier !== 'free'}
                      progress={currentAudio?.id === m.id ? (playerProgress ?? 0) : undefined}
                      onPlay={() => handlePlay(m, language)}
                      onLock={handleLock}
                    />
                    {i < playlistMeditations.length - 1 && <div className="akasha-divider" style={{ margin: '2px 16px' }} />}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>
        <div style={{ height: 100 }} />
      </div>
    );
  }

  return (
    <div className="sqi-page">
      <style>{SQI_STYLES}</style>

      <div className="akasha-hero">
        <div className="gold-orb" style={{ width: 160, height: 160, top: -40, right: -40, '--dur': '9s', '--delay': '0s' } as React.CSSProperties & { '--dur': string; '--delay': string }} />
        <div className="gold-orb" style={{ width: 80, height: 80, top: 60, left: -20, '--dur': '7s', '--delay': '-3s' } as React.CSSProperties & { '--dur': string; '--delay': string }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="nadi-pulse"><Sparkles size={18} /></div>
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }} onClick={() => navigate('/settings')}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="micro-label" style={{ marginBottom: 8, color: 'rgba(212,175,55,0.5)' }}>Akasha-Neural Archive · Meditation Transmissions</div>
        <h1 className="hero-title shimmer-text" style={{ marginBottom: 6 }}>{t('meditations.templeGreeting', 'The Hall of Stillness')}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 24, maxWidth: 340 }}>Curated by intention. Bhakti-Algorithms activated. Expand when you feel ready.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Globe size={13} color="rgba(255,255,255,0.3)" />
          <span className="micro-label" style={{ color: 'rgba(255,255,255,0.3)' }}>Audio Language</span>
          <div className="lang-pill">
            <button className={`lang-btn${language === 'en' ? ' active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
            <button className={`lang-btn${language === 'sv' ? ' active' : ''}`} onClick={() => setLanguage('sv')}>SV</button>
          </div>
        </div>
      </div>

      {startNowItem && (
        <div style={{ padding: '0 20px 20px' }}>
          <StartNowCard item={startNowItem} dayPhase={dayPhase} userState={userState} onStart={(item) => item && startPlayback(item as Meditation)} />
        </div>
      )}

      <JyotishMeditationCard />

      {userTier === 'free' && (
        <div style={{ padding: '0 20px 20px' }}>
          <MeditationMembershipBanner />
        </div>
      )}

      {curatedPlaylists.length > 0 && (
        <div style={{ padding: '0 20px 24px' }}>
          <div className="micro-label" style={{ marginBottom: 8, color: 'rgba(212,175,55,0.5)' }}>{t('meditations.featuredCollections', 'Featured collections')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {curatedPlaylists.map(playlist => (
              <CuratedMeditationCard
                key={playlist.id}
                playlist={playlist}
                onClick={async () => { setSelectedPlaylist(playlist); const items = await getPlaylistItems(playlist.id); setPlaylistMeditations((items || []) as Meditation[]); }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="micro-label" style={{ marginBottom: 4, color: 'rgba(212,175,55,0.5)' }}>Prema-Pulse Transmissions</div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>{t('meditations.allMeditations', 'All meditations')}</div>
        </div>
        <LanguageToggle language={language} setLanguage={setLanguage} compact />
      </div>

      <div style={{ padding: '0 20px' }}>
        {sectionsArray.map((section, i) => (
          section.items.length > 0 && (
            <MeditationSectionSQI
              key={section.title}
              title={section.title}
              subtitle={section.subtitle}
              meditations={section.items}
              lang={language}
              currentAudio={currentAudio}
              isPlaying={isPlaying}
              playerProgress={playerProgress ?? 0}
              userTier={userTier}
              onPlay={(med) => initiatePlay(med)}
              onLock={handleLock}
              defaultOpen={i === 0}
            />
          )
        ))}
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <div className="micro-label" style={{ marginBottom: 6, color: 'rgba(212,175,55,0.5)' }}>{t('meditations.sacredCommissions', 'Sacred Commissions')}</div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Personal Transmissions</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>When you want something channeled for you alone.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SacredCommissionCard icon="☸" price="€47" title="108 Wealth Reprogramming Meditation" subtitle="Wealth Activation" />
          <SacredCommissionCard icon="✦" price="€20–€97" title="Custom Channeled Meditation" subtitle="Personalized Experience" />
          <SacredCommissionCard icon="◎" price="€97–€197" title="Custom Meditation Creation" subtitle="For Creators & Healers" />
        </div>
        {/* Hidden functional components for dialog triggers */}
        <div style={{ display: 'none' }}>
          <WealthMeditationService />
          <CustomMeditationBooking />
          <CustomMeditationCreation />
        </div>
      </div>

      <IntentionThreshold
        isOpen={showThreshold}
        onSelectIntention={handleIntentionSelected}
        onClose={handleThresholdClose}
      />

      {BackToTopFab && <BackToTopFab />}
      <div style={{ height: 100 }} />
    </div>
  );
};

export default Meditations;
