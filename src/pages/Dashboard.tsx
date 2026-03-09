import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/lib/vedicTypes';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { useDayClosed } from '@/hooks/useDayClosed';
import { useReturnVisit } from '@/hooks/useReturnVisit';
import { useDashboardAutostart } from '@/hooks/useDashboardAutostart';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { getSuccessWindowPhrase } from '@/lib/horaPhrases';
import { InlineSessionPlayer } from '@/components/dashboard/InlineSessionPlayer';
import { CompletionResponse } from '@/components/dashboard/CompletionResponse';
import { mapSessionTypeToCompleted } from '@/lib/recommendationEngine';
import { DailyRitualCard } from '@/components/dashboard/DailyRitualCard';
import { SpiritualPathCard } from '@/components/dashboard/SpiritualPathCard';
import { AchievementPopup } from '@/components/achievements/AchievementPopup';

import { useAchievements } from '@/hooks/useAchievements';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { useSocialShare } from '@/hooks/useSocialShare';
import { translateAchievement } from '@/lib/translateAchievement';
import { Award, Flame, Target, Share2, Users, Star, Sparkles, Heart, Crown, Calendar, Droplet, Clock, Shield, Pentagon } from 'lucide-react';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';
import type { SessionLike } from '@/hooks/useDashboardAutostart';

const ACHIEVEMENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: string | number }>> = {
  Award, Flame, Target, Share2, Users, Star, Sparkles, Heart, Crown, Calendar, Droplet, Clock, Shield, Pentagon,
};

export type HomeFlowState = 'idle' | 'in_session' | 'completed';

function guidanceToSessionLike(guidance: DailyGuidance): SessionLike {
  const typeMap: Record<string, SessionLike['type']> = {
    breathing_reset: 'breath',
    morning_ritual: 'meditation',
    evening_reflection: 'meditation',
    journal: 'meditation',
    meditation: 'meditation',
    path_day: 'path',
  };
  return {
    id: guidance.session_id,
    type: typeMap[guidance.session_type] ?? 'meditation',
    title: guidance.button_label,
  };
}

const SectionLabel: React.FC<{ label: string; delay?: string }> = ({ label, delay = '0s' }) => (
  <div style={{
    fontFamily: 'Montserrat,sans-serif',
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: '0.5em',
    textTransform: 'uppercase' as const,
    color: 'rgba(212,175,55,0.3)',
    padding: '0 16px',
    marginTop: 22,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    animation: `sqFadeUp 0.5s ${delay} ease both`,
  }}>
    {label}
    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(212,175,55,0.12),transparent)' }} />
  </div>
);

const SQTile: React.FC<{
  children: React.ReactNode;
  featured?: boolean;
  locked?: boolean;
  onClick?: () => void;
}> = ({ children, featured, locked, onClick }) => (
  <div
    onClick={onClick}
    className={`sq-tile ${featured ? 'sq-tile-featured' : ''} ${locked ? 'sq-tile-locked' : ''}`}
    style={{ position: 'relative', cursor: onClick ? 'pointer' : undefined }}
  >
    {children}
  </div>
);

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { profile: userProfile } = useProfile();
  const { isPremium, tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const horaWatch = useHoraWatch({ timezone: 'Europe/Stockholm' });
  const { reading: vedicReading, generateReading } = useAIVedicReading();

  // Load Vedic reading when user has birth data so PlanetaryCycleBanner shows real cycle (not "Initializing Alignment...")
  useEffect(() => {
    if (!user || vedicReading || !generateReading) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('birth_name, birth_date, birth_time, birth_place')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.birth_name && data?.birth_date && data?.birth_time && data?.birth_place) {
        const profile: UserProfile = {
          name: data.birth_name,
          birthDate: data.birth_date,
          birthTime: data.birth_time,
          birthPlace: data.birth_place,
          plan: 'compass',
        };
        await generateReading(profile, 0, 'Europe/Stockholm', user.id);
      }
    };
    load();
  }, [user, vedicReading, generateReading]);

  const currentHour = new Date().getHours();
  const timePhase: 'morning' | 'midday' | 'evening' = currentHour >= 5 && currentHour < 12 ? 'morning' : currentHour >= 12 && currentHour < 17 ? 'midday' : 'evening';
  const greetingKey = timePhase === 'morning' ? 'dashboard.headerGreetingMorning' : timePhase === 'midday' ? 'dashboard.headerGreetingMidday' : 'dashboard.headerGreetingEvening';
  const { guidance, isLoading, lastCompleted, completeSlot, streakDays, hasCompletedAllThree } = useDailyGuidance();
  const { completeMorning, completeMidday, completeEvening } = useDailyJourney();
  const { isDayClosed, markDayClosed } = useDayClosed();
  const { returnState, streakIncreased } = useReturnVisit({
    hasCompletedToday: lastCompleted !== null,
    isDayClosed,
    streakDays,
    isLoading,
  });
  const {
    newlyUnlocked,
    dismissNewlyUnlocked,
    checkAchievements,
    achievements,
    userAchievements,
    getAchievementProgress,
  } = useAchievements();
  const { trackShare } = useSocialShare();

  const [flowState, setFlowState] = useState<HomeFlowState>('idle');
  const [activeGuidance, setActiveGuidance] = useState<DailyGuidance | null>(null);
  const [isContinuationCompletion, setIsContinuationCompletion] = useState(false);

  // Live time display
  const [liveTime, setLiveTime] = useState(() => {
    const n = new Date();
    return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setLiveTime(String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Hora countdown timer (live, ticks every second)
  const [horaCountdown, setHoraCountdown] = useState('');
  useEffect(() => {
    const update = () => {
      const ms = horaWatch.remainingMs ?? 0;
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setHoraCountdown(`${mins}:${String(secs).padStart(2, '0')} left`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [horaWatch.remainingMs]);

  // Smart upgrade banner logic based on tier
  const showUpgradeBanner = tier !== 'lifetime';
  const upgradePath =
    tier === 'free'            ? '/prana-flow' :
    tier === 'prana-monthly'   ? '/siddha-quantum' :
                                 '/akasha-infinity';
  const upgradeLabel =
    tier === 'free'            ? '◈ Activate Prana–Flow — Begin Your Sacred Journey' :
    tier === 'prana-monthly'   ? '◈ Activate Siddha–Quantum — Full Universal Field' :
                                 '◈ Unlock Akasha–Infinity — One Payment, Eternal Access';

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAchievements();
    }, 5000);
    return () => clearTimeout(timer);
  }, [checkAchievements]);

  const handleStartSession = useCallback((g: DailyGuidance, options?: { isContinuation?: boolean }) => {
    setActiveGuidance(g);
    setFlowState('in_session');
    setIsContinuationCompletion(options?.isContinuation ?? false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const todaySession = useMemo(() => {
    if (isLoading || !guidance?.session_id) return null;
    return { ...guidance, ...guidanceToSessionLike(guidance) } as SessionLike & DailyGuidance;
  }, [guidance, isLoading]);

  const hasCompletedToday = lastCompleted !== null;

  const openSession = useCallback((session: SessionLike) => {
    handleStartSession(session as unknown as DailyGuidance);
  }, [handleStartSession]);

  useDashboardAutostart({
    todaySession,
    hasCompletedToday,
    openSession,
    enabled: flowState === 'idle',
  });

  const handleSessionComplete = () => {
    if (!isContinuationCompletion) {
      if (completeSlot === 'morning') completeMorning.mutate(undefined);
      else if (completeSlot === 'midday') completeMidday.mutate(undefined);
      else if (completeSlot === 'evening') completeEvening.mutate({});
    }
    setFlowState('completed');
  };

  const handleBackFromSession = () => {
    setFlowState('idle');
    setActiveGuidance(null);
  };

  const handleDone = useCallback(() => {
    if (isContinuationCompletion) {
      markDayClosed();
    }
    setFlowState('idle');
    setActiveGuidance(null);
    setIsContinuationCompletion(false);
  }, [isContinuationCompletion, markDayClosed]);

  const completedSession = activeGuidance
    ? mapSessionTypeToCompleted(
        activeGuidance.session_type,
        activeGuidance.session_id,
        activeGuidance.session_id?.startsWith('/paths/')
          ? activeGuidance.session_id.replace('/paths/', '')
          : undefined
      )
    : null;

  const userName = userProfile?.full_name?.split(' ')[0] || 'Adam';
  const dashaCycle = vedicReading?.personalCompass?.currentDasha?.period?.split(' ')[0] || 'Rahu';
  const horaPlanet = horaWatch.calculation?.currentHora?.planet || 'Venus';
  const horaDurationMs = horaWatch.calculation?.currentHora?.durationMinutes
    ? horaWatch.calculation.currentHora.durationMinutes * 60 * 1000
    : 1;
  const successWindowPct = horaWatch.calculation
    ? Math.round((1 - horaWatch.remainingMs / horaDurationMs) * 100)
    : 80;

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 112, maxWidth: 430, margin: '0 auto' }}>

      <AchievementPopup achievement={newlyUnlocked} onClose={dismissNewlyUnlocked} />

      {/* IN SESSION */}
      {flowState === 'in_session' && activeGuidance && (
        <div className="px-4 mb-6 animate-slide-up">
          <InlineSessionPlayer
            sessionType={activeGuidance.session_type}
            sessionId={activeGuidance.session_id}
            buttonLabel={activeGuidance.button_label}
            onComplete={handleSessionComplete}
            onBack={handleBackFromSession}
          />
        </div>
      )}

      {/* COMPLETED */}
      {flowState === 'completed' && (
        <div className="px-4 mb-6 animate-slide-up">
          <CompletionResponse
            onDone={handleDone}
            completedSession={completedSession}
            variant={isContinuationCompletion ? 'closing' : 'standard'}
          />
        </div>
      )}

      {/* IDLE — SQI 2050 */}
      {flowState === 'idle' && (
        <>
          {/* ══ ZONE 1: HEADER ══ */}
          <header style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', animation: 'sqFadeUp 0.5s ease both' }}>
            <div>
              <p style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.48em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.55)', marginBottom: 4 }}>
                {timePhase === 'morning' ? 'Good Morning' : timePhase === 'midday' ? 'Good Afternoon' : 'Good Evening'}
              </p>
              <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '1.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.1, margin: 0 }}>
                {userName}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
              <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(212,175,55,0.4)', fontVariantNumeric: 'tabular-nums' as const }}>
                {liveTime}
              </span>
              <AmbientSoundToggle />
            </div>
          </header>

          {/* ══ ZONE 2: SRI YANTRA HERO ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 16px', animation: 'sqFadeUp 0.5s 0.08s ease both' }}>
            <div style={{ position: 'relative', width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
              {[190, 156, 124].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.1)', animation: `sqRingBreath 5s ${i * 0.7}s ease-in-out infinite` }} />
              ))}
              <div style={{ position: 'absolute', width: 190, height: 190, borderRadius: '50%', border: '1px solid transparent', borderTop: '1px solid rgba(212,175,55,0.35)', borderRight: '1px solid rgba(212,175,55,0.15)', animation: 'sqSpin 18s linear infinite' }} />
              <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '1px solid transparent', borderBottom: '1px solid rgba(212,175,55,0.28)', borderLeft: '1px solid rgba(212,175,55,0.1)', animation: 'sqSpin 12s linear infinite reverse' }} />
              <svg width="160" height="160" viewBox="0 0 400 400" fill="none" style={{ animation: 'sqYantraBreathe 7s ease-in-out infinite' }}>
                <defs>
                  <filter id="bG" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="tG" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <radialGradient id="yG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(212,175,55,0.08)"/><stop offset="100%" stopColor="rgba(212,175,55,0)"/></radialGradient>
                </defs>
                <circle cx="200" cy="200" r="200" fill="url(#yG)"/>
                <rect x="8" y="8" width="384" height="384" stroke="rgba(212,175,55,0.18)" strokeWidth="1.2" fill="none"/>
                <rect x="16" y="16" width="368" height="368" stroke="rgba(212,175,55,0.11)" strokeWidth="0.7" fill="none"/>
                <circle cx="200" cy="200" r="168" stroke="rgba(212,175,55,0.16)" strokeWidth="1" fill="none"/>
                <circle cx="200" cy="200" r="147" stroke="rgba(212,175,55,0.1)" strokeWidth="0.8" fill="none"/>
                <circle cx="200" cy="200" r="131" stroke="rgba(212,175,55,0.13)" strokeWidth="0.8" fill="none" strokeDasharray="8,9.6"/>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => { const r = a * Math.PI / 180; const px = 200 + 115.2 * Math.cos(r); const py = 200 + 115.2 * Math.sin(r); return <ellipse key={i} cx={px} cy={py} rx="11" ry="18" transform={`rotate(${a} ${px} ${py})`} stroke="rgba(212,175,55,0.25)" strokeWidth="0.9" fill="rgba(212,175,55,0.03)"/>; })}
                <circle cx="200" cy="200" r="115" stroke="rgba(212,175,55,0.14)" strokeWidth="0.8" fill="none"/>
                <polygon points="200,43.2 64.207,278.4 335.793,278.4" stroke="rgba(212,175,55,0.85)" strokeWidth="1.6" fill="none" filter="url(#tG)"/>
                <polygon points="200,82.4 94.691,262.8 305.309,262.8" stroke="rgba(212,175,55,0.68)" strokeWidth="1.25" fill="none"/>
                <polygon points="200,110.4 122.404,243.8 277.596,243.8" stroke="rgba(212,175,55,0.52)" strokeWidth="1.0" fill="none"/>
                <polygon points="200,145.4 150.117,229.8 249.883,229.8" stroke="rgba(212,175,55,0.36)" strokeWidth="0.75" fill="none"/>
                <polygon points="200,356.8 64.207,121.6 335.793,121.6" stroke="rgba(212,175,55,0.78)" strokeWidth="1.5" fill="none"/>
                <polygon points="200,317.8 105.776,148.6 294.224,148.6" stroke="rgba(212,175,55,0.62)" strokeWidth="1.18" fill="none"/>
                <polygon points="200,281 132.718,161 267.282,161" stroke="rgba(212,175,55,0.47)" strokeWidth="0.92" fill="none"/>
                <polygon points="200,253.2 155.659,176.4 244.341,176.4" stroke="rgba(212,175,55,0.33)" strokeWidth="0.70" fill="none"/>
                <polygon points="200,226.6 177.83,187.2 222.17,187.2" stroke="rgba(212,175,55,0.20)" strokeWidth="0.52" fill="none"/>
                <polygon points="200,188 187,208 213,208" stroke="rgba(212,175,55,0.55)" strokeWidth="0.8" fill="rgba(212,175,55,0.06)"/>
                <polygon points="200,212 187,192 213,192" stroke="rgba(212,175,55,0.50)" strokeWidth="0.8" fill="rgba(212,175,55,0.04)"/>
                <text x="200" y="196" fontSize="22" textAnchor="middle" dominantBaseline="middle" fill="rgba(212,175,55,0.22)" fontFamily="serif" fontStyle="italic">ॐ</text>
                <circle cx="200" cy="200" r="12" fill="rgba(212,175,55,0.12)" filter="url(#bG)"/>
                <circle cx="200" cy="200" r="7" fill="rgba(212,175,55,0.88)" filter="url(#bG)"/>
                <circle cx="200" cy="200" r="3" fill="rgba(255,235,100,1)"/>
              </svg>
              <div style={{ position: 'absolute', bottom: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 12px rgba(212,175,55,0.9)', animation: 'sqDotPulse 2s ease-in-out infinite' }} />
            </div>

            <p style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.3)', textAlign: 'center', marginBottom: 10 }}>◈ Today&apos;s Akashic Verdict</p>
            <p style={{ fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: '1.12rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, textAlign: 'center', marginBottom: 14, maxWidth: 300 }}>
              {vedicReading?.todayInfluence?.wisdomQuote || `As you move through your ${dashaCycle} cycle, the ${horaPlanet} Hora illuminates karmic completion.`}
            </p>
            <button onClick={() => navigate('/vedic-astrology')} style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 8, fontWeight: 800, letterSpacing: '0.42em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Open Full Reading →
            </button>
          </div>


          {/* ══ ZONE 3: COSMIC STRIP — links to /vedic-astrology ══ */}
          <div
            onClick={() => navigate('/vedic-astrology')}
            style={{ margin: '14px 16px 0', background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 18, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', animation: 'sqFadeUp 0.5s 0.15s ease both', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.06),transparent)', animation: 'sqShimmer 4s ease-in-out infinite', pointerEvents: 'none' }} />
            {[
              { icon: '☽', lbl: 'Dasha', val: dashaCycle, sub: 'Active cycle' },
              { icon: '⏱', lbl: 'Hora Now', val: horaPlanet, sub: horaCountdown },
              { icon: '✦', lbl: 'Alignment', val: `${successWindowPct}%`, sub: getSuccessWindowPhrase(horaPlanet) },
            ].map(({ icon, lbl, val, sub }, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, height: '70%', background: 'rgba(212,175,55,0.08)', alignSelf: 'center' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: 14, marginBottom: 4 }}>{icon}</span>
                  <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 6.5, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.4)', marginBottom: 3 }}>{lbl}</span>
                  <span style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{val}</span>
                  <span style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(212,175,55,0.35)', marginTop: 2, fontVariantNumeric: 'tabular-nums' as const }}>{sub}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* ══ ZONE 4: MODULE GRID (Sacred Portals) — light on hover/touch per tile ══ */}
          <SectionLabel label="◈ Sacred Portals" delay="0.2s" />
          <div style={{ padding: '0 16px', animation: 'sqFadeUp 0.5s 0.2s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SQTile featured onClick={() => navigate('/vedic-astrology')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 34, flexShrink: 0, animation: 'sqIconFloat 4s ease-in-out infinite', filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.5))' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <line x1="12" y1="6" x2="12" y2="22" stroke="rgba(212,175,55,0.85)" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M8 6 C8 3 10 2 12 2 C14 2 16 3 16 6 C16 9 14 10 12 10 C10 10 8 9 8 6Z" stroke="rgba(212,175,55,0.85)" strokeWidth="1.4" fill="rgba(212,175,55,0.1)"/>
                    <path d="M6 5 C4 5 3 7 4 9 L7 10" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                    <path d="M18 5 C20 5 21 7 20 9 L17 10" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.8)', animation: 'sqDotPulse 2s infinite' }} />
                    <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.5)' }}>Live Reading</span>
                  </div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.8)', marginBottom: 6 }}>Vedic Oracle</div>
                  <p style={{ fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: '0.9rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.4, margin: '0 0 10px' }}>
                    {vedicReading?.personalCompass?.currentDasha
                      ? `Your ${dashaCycle} Dasha peaks — consult the Bhrigu Guru now.`
                      : 'Your cosmic chart awaits — open your Jyotish reading.'}
                  </p>
                  <button style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase' as const, color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>Open Jyotish →</button>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 8px rgba(212,175,55,0.8)', animation: 'sqDotPulse 2.5s infinite' }} />
            </SQTile>

            <SQTile onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.ayurveda) ? navigate('/ayurveda') : navigate('/prana-flow')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8, display: 'block', animation: 'sqIconFloat 3s ease-in-out infinite' }}>
                <path d="M12 20 C12 20 4 14 4 8 C4 4 8 2 12 4 C16 2 20 4 20 8 C20 14 12 20 12 20Z" stroke="rgba(212,175,55,0.7)" strokeWidth="1.4" fill="rgba(212,175,55,0.07)"/>
                <line x1="12" y1="4" x2="12" y2="20" stroke="rgba(212,175,55,0.3)" strokeWidth="0.8"/>
                <line x1="8" y1="10" x2="12" y2="8" stroke="rgba(212,175,55,0.25)" strokeWidth="0.7"/>
                <line x1="16" y1="10" x2="12" y2="8" stroke="rgba(212,175,55,0.25)" strokeWidth="0.7"/>
              </svg>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.7)', marginBottom: 4 }}>Ayurveda</div>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.42)' }}>
                {(vedicReading as unknown as { ayurvedicProfile?: { dominantDosha?: string } })?.ayurvedicProfile?.dominantDosha
                  ? `${(vedicReading as unknown as { ayurvedicProfile: { dominantDosha: string } }).ayurvedicProfile.dominantDosha} dominance`
                  : 'Dosha analysis'}
              </div>
              <span style={{ position: 'absolute', bottom: 13, right: 13, color: 'rgba(212,175,55,0.25)', fontSize: 11 }}>→</span>
            </SQTile>

            <SQTile onClick={() => navigate('/music')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8, display: 'block', animation: 'sqIconFloat 3s 0.3s ease-in-out infinite' }}>
                <path d="M9 18V6l10-2v12" stroke="rgba(212,175,55,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="7" cy="18" r="2.5" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2" fill="rgba(212,175,55,0.08)"/>
                <circle cx="17" cy="16" r="2.5" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" fill="rgba(212,175,55,0.06)"/>
              </svg>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.7)', marginBottom: 4 }}>Healing Sounds</div>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.42)' }}>528Hz ready</div>
              <span style={{ position: 'absolute', bottom: 13, right: 13, color: 'rgba(212,175,55,0.25)', fontSize: 11 }}>→</span>
            </SQTile>

            <SQTile onClick={() => hasFeatureAccess(isAdmin, tier, FEATURE_TIER.vastu) ? navigate('/vastu') : navigate('/prana-flow')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8, display: 'block', animation: 'sqIconFloat 3s 0.6s ease-in-out infinite' }}>
                <rect x="3" y="10" width="18" height="12" stroke="rgba(212,175,55,0.6)" strokeWidth="1.3" fill="rgba(212,175,55,0.05)" rx="1"/>
                <polyline points="2,10 12,2 22,10" stroke="rgba(212,175,55,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <line x1="9" y1="22" x2="9" y2="14" stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
                <line x1="15" y1="22" x2="15" y2="14" stroke="rgba(212,175,55,0.3)" strokeWidth="1"/>
              </svg>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.7)', marginBottom: 4 }}>Vastu</div>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.42)' }}>Sacred space scan</div>
              <span style={{ position: 'absolute', bottom: 13, right: 13, color: 'rgba(212,175,55,0.25)', fontSize: 11 }}>→</span>
            </SQTile>

            <SQTile onClick={() => navigate('/mantras')}>
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none" style={{ marginBottom: 8, display: 'block', animation: 'sqIconFloat 3s 0.9s ease-in-out infinite' }}>
                <text x="20" y="28" fontSize="26" textAnchor="middle" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="0.8" fontFamily="serif" fontStyle="italic">ॐ</text>
                <text x="20" y="28" fontSize="26" textAnchor="middle" fill="rgba(212,175,55,0.45)" fontFamily="serif" fontStyle="italic">ॐ</text>
              </svg>
              <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.7)', marginBottom: 4 }}>Mantras</div>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.42)' }}>Daily mantra set</div>
              <span style={{ position: 'absolute', bottom: 13, right: 13, color: 'rgba(212,175,55,0.25)', fontSize: 11 }}>→</span>
            </SQTile>

            {!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal) && (
              <SQTile locked onClick={() => navigate('/siddha-quantum')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.38 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <polygon points="13,2 4,14 11,14 11,22 20,10 13,10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinejoin="round" fill="rgba(255,255,255,0.05)"/>
                  </svg>
                  <div>
                    <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.18)', marginBottom: 6 }}>Siddha Portal</div>
                    <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.82rem', color: 'rgba(255,255,255,0.18)', lineHeight: 1.4, marginBottom: 8 }}>18 Siddha Masters · Nāḍī Scanner · Universal Shield</div>
                    <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.28)' }}>Unlock Siddha-Quantum · 45€/mo →</div>
                  </div>
                </div>
                <span style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>🔒</span>
              </SQTile>
            )}
            </div>
          </div>

          {/* ══ ZONE 5: DAILY SADHANA (match preview) ══ */}
          <SectionLabel label="◈ Daily Sadhana" delay="0.27s" />
          <div className="sq-sadhana-card" style={{ margin: '12px 16px 0', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', animation: 'sqFadeUp 0.5s 0.27s ease both' }}>
            <DailyRitualCard isDayClosed={isDayClosed} hasCompletedAllThree={hasCompletedAllThree} />
          </div>

          {/* ══ ZONE 6: DHARMA PATH (match preview) ══ */}
          <SectionLabel label="◈ Dharma Path" delay="0.32s" />
          <div style={{ margin: '10px 16px 0', animation: 'sqFadeUp 0.5s 0.32s ease both' }}>
            <SpiritualPathCard />
          </div>

          {/* ══ ZONE 7: SOUL FIELD — stats + achievements only (no separate achievements section below) ══ */}
          <SectionLabel label="◈ Soul Field" delay="0.35s" />
          <div style={{ margin: '0 16px', animation: 'sqFadeUp 0.5s 0.35s ease both' }}>
            {/* Row 1: 4 stat cards — Day Streak, SHC, Presence, Min */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              {([
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11z" stroke="rgba(212,175,55,0.7)" strokeWidth="1.4" fill="rgba(212,175,55,0.08)"/><circle cx="12" cy="14" r="2" fill="rgba(212,175,55,0.5)"/></svg>, val: streakDays ?? 0, lbl: 'Continuity Loops' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="12,2 14.5,9 22,9 16,14 18.5,21 12,17 5.5,21 8,14 2,9 9.5,9" stroke="rgba(212,175,55,0.7)" strokeWidth="1.3" strokeLinejoin="round" fill="rgba(212,175,55,0.07)"/><circle cx="12" cy="12" r="2" fill="rgba(212,175,55,0.45)"/></svg>, val: userAchievements.length * 25, lbl: 'Soma Resonance' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(212,175,55,0.55)" strokeWidth="1.2" fill="none"/><circle cx="12" cy="12" r="5" stroke="rgba(212,175,55,0.35)" strokeWidth="1" fill="none"/><circle cx="12" cy="12" r="2" fill="rgba(212,175,55,0.6)"/></svg>, val: userAchievements.length, lbl: 'Coherence Peaks' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" fill="none"/><line x1="12" y1="6" x2="12" y2="12" stroke="rgba(212,175,55,0.7)" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="12" x2="16" y2="14" stroke="rgba(212,175,55,0.5)" strokeWidth="1.3" strokeLinecap="round"/><circle cx="12" cy="12" r="1.5" fill="rgba(212,175,55,0.7)"/></svg>, val: successWindowPct, lbl: 'Depth Cycles' },
              ] as { icon: React.ReactNode; val: string | number; lbl: string }[]).map(({ icon, val, lbl }, i) => (
                <div key={i} className="sq-stat-chip">
                  <div style={{ marginBottom: 6 }}>{icon}</div>
                  <div className="sq-stat-val">{val}</div>
                  <div className="sq-stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>
            {/* Row 2: achievement badges — horizontal scroll strip (match preview) */}
            {achievements.length > 0 && (
              <div className="sq-ach-strip" style={{ marginTop: 10 }}>
                {achievements.slice(0, 6).map((achievement) => {
                  const progress = getAchievementProgress(achievement);
                  const translated = translateAchievement(achievement.slug, t, achievement.name, achievement.description || '');
                  const nameUpper = (translated.name || achievement.name || '').toUpperCase().replace(/\s+/g, ' ');
                  const IconComponent = ACHIEVEMENT_ICON_MAP[achievement.icon_name] || Award;
                  return (
                    <div
                      key={achievement.id}
                      className={`sq-ach-badge ${progress.unlocked ? 'sq-ach-badge-unlocked' : 'sq-ach-badge-locked'}`}
                    >
                      <div style={{ marginBottom: 6, color: progress.unlocked ? 'rgba(212,175,55,0.9)' : 'rgba(212,175,55,0.5)', filter: progress.unlocked ? 'drop-shadow(0 0 4px rgba(212,175,55,0.3))' : 'none' }}>
                        <IconComponent size={22} />
                      </div>
                      <div className="sq-ach-name">{nameUpper.slice(0, 20)}{nameUpper.length > 20 ? '…' : ''}</div>
                      {progress.unlocked && achievement.shc_reward != null && achievement.shc_reward > 0 ? (
                        <div className="sq-ach-pts">+{achievement.shc_reward} SHC</div>
                      ) : progress.progressText ? (
                        <div className="sq-ach-pts sq-ach-pts-muted">{progress.progressText}</div>
                      ) : achievement.shc_reward != null && achievement.shc_reward > 0 ? (
                        <div className="sq-ach-pts sq-ach-pts-muted">+{achievement.shc_reward} SHC</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══ ZONE 9: UPGRADE BANNER ══ */}
          {showUpgradeBanner && (
            <div
              onClick={() => navigate(upgradePath)}
              style={{ margin: '10px 16px 0', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(212,175,55,0.07) 0%,rgba(212,175,55,0.03) 100%)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', animation: 'sqFadeUp 0.5s 0.4s ease both' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: 'rgba(212,175,55,0.65)' }}>
                  {upgradeLabel}
                </span>
                <span style={{ color: 'rgba(212,175,55,0.45)', fontSize: 14 }}>→</span>
              </div>
              {tier === 'prana-monthly' && (
                <p style={{ margin: '8px 0 0', fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: '0.78rem', color: 'rgba(212,175,55,0.3)' }}>
                  or{' '}
                  <button type="button" onClick={(e) => { e.stopPropagation(); navigate('/akasha-infinity'); }} style={{ color: 'rgba(212,175,55,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit', fontStyle: 'inherit' }}>
                    unlock everything forever with Akasha–Infinity →
                  </button>
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
