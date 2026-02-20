import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Play, Music2, Heart } from 'lucide-react';
import { SacredFlame } from '@/components/dashboard/SacredFlame';
import { useProfile } from '@/hooks/useProfile';
import { useHoraWatch } from '@/hooks/useHoraWatch';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { useDayClosed } from '@/hooks/useDayClosed';
import { useReturnVisit } from '@/hooks/useReturnVisit';
import { useDashboardAutostart } from '@/hooks/useDashboardAutostart';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { DailyGuidanceCard } from '@/components/dashboard/DailyGuidanceCard';
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

  const QUICK_ACTIONS = [
    { id: "mantra", titleKey: "dashboard.mantra", icon: Sparkles, route: "/mantras" },
    { id: "soul", titleKey: "dashboard.soul", icon: Heart, route: "/healing" },
    { id: "meditate", titleKey: "dashboard.meditate", icon: Play, route: "/meditations" },
  ];
  const { profile: userProfile } = useProfile();
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
    checkAchievements();
  }, [checkAchievements]);

  const handleStartSession = useCallback((g: DailyGuidance, options?: { isContinuation?: boolean }) => {
    setActiveGuidance(g);
    setFlowState('in_session');
    setIsContinuationCompletion(options?.isContinuation ?? false);
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
  const horaIntensity = Math.min(100, Math.max(0, successWindowPct));

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-4 sm:pt-6 pb-24">
      <AchievementPopup achievement={newlyUnlocked} onClose={dismissNewlyUnlocked} />

      {/* Header - always visible; elegant serif greeting */}
      <header className="flex items-center justify-between mb-4 sm:mb-6 animate-fade-in">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <SacredFlame />
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-serif" style={{ fontFamily: 'Cinzel, DM Serif Display, serif' }}>{t(greetingKey)}</p>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground truncate">
              {userProfile?.full_name || t('dashboard.sacredSoul')}
              <span className="ml-1 text-secondary">✨</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70">{t('common.soulAwaits')}</p>
          </div>
        </div>
        <AmbientSoundToggle />
      </header>

      {/* State: idle - Daily Guidance Card + restored sections */}
      {flowState === 'idle' && (
        <>
          <div className="mb-4 sm:mb-6 animate-slide-up">
            <DailyGuidanceCard
              onStartClick={handleStartSession}
              isDayClosed={isDayClosed}
              onSkipContinuation={() => {
                markDayClosed();
              }}
              returnState={returnState}
              streakIncreased={streakIncreased}
            />
          </div>

          {/* Celestial Sync — below big banner */}
          {horaWatch.calculation && (
            <section className="mb-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-indigo-950/90 via-violet-950/70 to-amber-950/50 px-4 py-3 flex items-center gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 animate-pulse"
                style={{ animationDuration: `${2 + (100 - horaIntensity) / 50}s` }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
                  <path d="M12 2a10 10 0 0 1 0 20" strokeOpacity="0.8" />
                  <path d="M12 2l0 4M12 18l0 4M2 12l4 0M18 12l4 0" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-medium">Celestial Sync</p>
                <p className="text-xs sm:text-sm text-white/95 leading-snug mt-0.5">
                  {userName}, your {dashaCycle} Cycle (Age 42) is Active. Current Success Window: {horaPlanet} Hora — {successWindowPct}%.
                </p>
              </div>
            </section>
          )}

          {/* Quick Oracle — below big banner */}
          <section className="mb-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-purple-400/80 font-medium mb-2">Quick Oracle</p>
            {vedicReading?.todayInfluence?.wisdomQuote ? (
              <p className="text-sm font-serif italic text-purple-100/90 leading-relaxed">
                &ldquo;{vedicReading.todayInfluence.wisdomQuote}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-white/70 leading-relaxed">
                Align with the current {horaPlanet} Hora for clarity. Get your full Akashic Verdict in Jyotish.
              </p>
            )}
            <Link to="/vedic-astrology" className="inline-block mt-2 text-xs text-amber-400/90 hover:text-amber-300 font-medium">
              See full verdict →
            </Link>
          </section>

          {/* Quick Actions Section — compact, visually light, subtle glow */}
          <div className="mb-4 sm:mb-5 animate-slide-up">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {QUICK_ACTIONS.map((action, index) => {
                const gradients = [
                  'bg-gradient-to-br from-purple-900/40 via-secondary/30 to-purple-800/40',
                  'bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-700/40',
                  'bg-gradient-to-br from-amber-500/30 via-gold/20 to-amber-400/30',
                ];
                const glows = [
                  'shadow-[0_0_10px_rgba(167,139,250,0.16)] hover:shadow-[0_0_14px_rgba(167,139,250,0.22)]',
                  'shadow-[0_0_10px_rgba(212,175,55,0.25)] hover:shadow-[0_0_14px_rgba(168,85,247,0.3)]',
                  'shadow-[0_0_10px_rgba(255,193,7,0.16)] hover:shadow-[0_0_14px_rgba(255,193,7,0.22)]',
                ];
                const iconColors = [
                  'text-purple-300',
                  'text-amber-300',
                  'text-amber-400',
                ];
                return (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.route)}
                    className="group relative"
                  >
                    <Card className={`glass-card relative overflow-hidden p-2.5 sm:p-3 h-full min-h-0 ${gradients[index]} border border-white/10 hover:border-white/20 transition-all duration-300 ${glows[index]}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 text-center">
                        <div className="relative inline-block mb-1.5 sm:mb-2">
                          <action.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${iconColors[index]} mx-auto group-hover:scale-105 transition-transform duration-300`} style={{ filter: `drop-shadow(0 0 5px ${index === 0 ? 'rgba(167,139,250,0.35)' : index === 1 ? 'rgba(212,175,55,0.5)' : 'rgba(255,193,7,0.35)'})` }} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-heading font-bold text-white">{t(action.titleKey)}</h3>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily routine — optional, visually softened */}
          <div className="pt-6 border-t border-border/50 space-y-4 mb-6 animate-slide-up">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('dashboard.dailyRoutineSection', 'Daily routine')}
            </p>
            <DailyRitualCard
              isDayClosed={isDayClosed}
              hasCompletedAllThree={hasCompletedAllThree}
            />
            <SpiritualPathCard />
          </div>

          {/* Collapsed: More practices */}
          <div className="mb-4 animate-slide-up">
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

          {/* Collapsed: Progress & achievements */}
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
                      <h2 className="text-lg font-heading font-semibold text-foreground">
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
        </>
      )}

      {/* State: in_session - Inline Session Player */}
      {flowState === 'in_session' && activeGuidance && (
        <div className="mb-6 animate-slide-up">
          <InlineSessionPlayer
            sessionType={activeGuidance.session_type}
            sessionId={activeGuidance.session_id}
            buttonLabel={activeGuidance.button_label}
            onComplete={handleSessionComplete}
            onBack={handleBackFromSession}
          />
        </div>
      )}

      {/* State: completed - Reflection + Affirmation + Recommendations */}
      {flowState === 'completed' && (
        <div className="mb-6 animate-slide-up">
          <CompletionResponse
            onDone={handleDone}
            completedSession={completedSession}
            variant={isContinuationCompletion ? 'closing' : 'standard'}
          />
        </div>
      )}

      {/* Floating Mantra quick action — Sovereign Gold with purple glow */}
      {flowState === 'idle' && (
        <button
          type="button"
          onClick={() => navigate('/mantras')}
          className="fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 bg-[#D4AF37] text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.5),0_0_40px_rgba(168,85,247,0.2)] hover:bg-amber-500 flex items-center justify-center border border-amber-400/50"
          aria-label={t('dashboard.ritualMantra', 'Mantra')}
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
