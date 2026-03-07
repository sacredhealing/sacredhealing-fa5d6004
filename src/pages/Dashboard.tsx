import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Play, Heart } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { useDayClosed } from '@/hooks/useDayClosed';
import { useReturnVisit } from '@/hooks/useReturnVisit';
import { useDashboardAutostart } from '@/hooks/useDashboardAutostart';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { TempleEntrance } from '@/components/dashboard/TempleEntrance';
import { ThreeGateways } from '@/components/dashboard/ThreeGateways';
import { WallInscription } from '@/components/dashboard/WallInscription';
import { getSuccessWindowPhrase } from '@/lib/horaPhrases';
import { InlineSessionPlayer } from '@/components/dashboard/InlineSessionPlayer';
import { CompletionResponse } from '@/components/dashboard/CompletionResponse';
import { mapSessionTypeToCompleted } from '@/lib/recommendationEngine';
import { DailyRitualCard } from '@/components/dashboard/DailyRitualCard';
import { SpiritualPathCard } from '@/components/dashboard/SpiritualPathCard';
import { BreathingJourneysCard } from '@/components/dashboard/BreathingJourneysCard';
import { HealingJourneysCard } from '@/components/dashboard/HealingJourneysCard';
import { PositiveMeCard } from '@/components/dashboard/PositiveMeCard';
import { JourneyTimeline } from '@/components/dashboard/JourneyTimeline';
import { ShareableProgressCard } from '@/components/achievements/ShareableProgressCard';
import { AchievementPopup } from '@/components/achievements/AchievementPopup';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
import { SectionCollapse } from '@/components/ui/SectionCollapse';
import { Card } from '@/components/ui/card';
import { useAchievements } from '@/hooks/useAchievements';
import { useMembership } from '@/hooks/useMembership';
import { useSocialShare } from '@/hooks/useSocialShare';
import { translateAchievement } from '@/lib/translateAchievement';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';
import type { SessionLike } from '@/hooks/useDashboardAutostart';

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

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { profile: userProfile } = useProfile();
  const { isPremium } = useMembership();
  const horaWatch = useHoraWatch({ timezone: 'Europe/Stockholm' });
  const { reading: vedicReading } = useAIVedicReading();

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
    <div className="min-h-screen pb-24">
      <AchievementPopup achievement={newlyUnlocked} onClose={dismissNewlyUnlocked} />

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 pt-4 sm:pt-6 mb-3 sm:mb-4 animate-fade-in">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, serif' }}>{t(greetingKey)}</p>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground truncate">
            {userProfile?.full_name || t('dashboard.sacredSoul')}
            <span className="ml-1 text-secondary">✨</span>
          </h1>
        </div>
        <AmbientSoundToggle />
      </header>

      {flowState === 'idle' && (
        <>
          {/* TempleEntrance — full bleed, no side padding */}
          <div className="mb-4 sm:mb-5 animate-slide-up">
            <TempleEntrance
              onStartClick={() => navigate('/breathing')}
              isDayClosed={isDayClosed}
              onSkipContinuation={() => markDayClosed()}
              returnState={returnState}
              streakIncreased={streakIncreased}
              successWindowText={getSuccessWindowPhrase(horaPlanet)}
              restCtaInBanner={hasCompletedAllThree && !isDayClosed}
            />
          </div>

          {/* Rest of page — padded */}
          <div className="px-3 sm:px-4 space-y-4">

            {!isPremium && (
              <div
                onClick={() => navigate('/siddha-quantum')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/siddha-quantum')}
                style={{
                  background: 'linear-gradient(90deg,rgba(212,175,55,0.08),rgba(212,175,55,0.04))',
                  border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: 14,
                  padding: '12px 18px',
                  margin: '0 0 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)' }}>
                  ◈ Activate Siddha–Quantum — Full Universal Field Access
                </span>
                <span style={{ color: 'rgba(212,175,55,0.5)', fontSize: 12 }}>→</span>
              </div>
            )}

            {/* Three Gateways */}
            <div className="animate-slide-up">
              <ThreeGateways
                horaPlanet={horaPlanet}
                isNight={!horaWatch.calculation?.currentHora?.isDay}
              />
            </div>

            {/* Wall Inscription */}
            <div className="animate-slide-up">
              <WallInscription
                userName={userName}
                dashaCycle={dashaCycle}
                horaPlanet={horaPlanet}
                successWindowPct={successWindowPct}
                wisdomQuote={vedicReading?.todayInfluence?.wisdomQuote ?? null}
              />
            </div>

            {/* Daily Practice */}
            <div className="pt-6 border-t border-[#D4AF37]/10 space-y-4 animate-slide-up">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[rgba(212,175,55,0.4)]" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                {t('dashboard.dailyRoutineSection', 'Daily Practice')}
              </p>
              <DailyRitualCard
                isDayClosed={isDayClosed}
                hasCompletedAllThree={hasCompletedAllThree}
              />
              <SpiritualPathCard />
            </div>

            {/* More practices */}
            <div className="animate-slide-up">
              <SectionCollapse
                title={t('dashboard.morePractices')}
                description={t('dashboard.morePracticesDesc')}
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <BreathingJourneysCard />
                  <HealingJourneysCard />
                </div>
              </SectionCollapse>
            </div>

            {/* Progress & achievements */}
            <div className="mb-6 animate-slide-up">
              <SectionCollapse
                title={t('dashboard.progressAchievements')}
                description={t('dashboard.progressAchievementsDesc')}
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PositiveMeCard />
                    <JourneyTimeline />
                  </div>
                  {achievements.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Cinzel, DM Serif Display, Georgia, serif' }}>
                          {t('dashboard.achievements')}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          {userAchievements.length}/{achievements.length}
                        </span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {achievements.slice(0, 6).map((achievement) => {
                          const progress = getAchievementProgress(achievement);
                          const translated = translateAchievement(achievement.slug, t, achievement.name, achievement.description || '');
                          return (
                            <div key={achievement.id} className="flex-shrink-0">
                              <AchievementBadge
                                name={translated.name}
                                description={translated.description}
                                iconName={achievement.icon_name}
                                badgeColor={achievement.badge_color}
                                unlocked={progress.unlocked}
                                unlockedAt={progress.unlockedAt}
                                shcReward={achievement.shc_reward}
                                size="sm"
                                progressText={progress.progressText}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <ShareableProgressCard
                    onShare={() => trackShare({ shareType: 'progress_card', platform: 'native' })}
                  />
                </div>
              </SectionCollapse>
            </div>
          </div>
        </>
      )}

      {/* In session */}
      {flowState === 'in_session' && activeGuidance && (
        <div className="px-3 sm:px-4 mb-6 animate-slide-up">
          <InlineSessionPlayer
            sessionType={activeGuidance.session_type}
            sessionId={activeGuidance.session_id}
            buttonLabel={activeGuidance.button_label}
            onComplete={handleSessionComplete}
            onBack={handleBackFromSession}
          />
        </div>
      )}

      {/* Completed */}
      {flowState === 'completed' && (
        <div className="px-3 sm:px-4 mb-6 animate-slide-up">
          <CompletionResponse
            onDone={handleDone}
            completedSession={completedSession}
            variant={isContinuationCompletion ? 'closing' : 'standard'}
          />
        </div>
      )}

      {/* Floating Mantra button */}
      {flowState === 'idle' && (
        <button
          type="button"
          onClick={() => navigate('/mantras')}
          className="fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 bg-[#D4AF37] text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:bg-amber-500 flex items-center justify-center border border-amber-400/50"
          aria-label={t('dashboard.ritualMantra', 'Mantra')}
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
