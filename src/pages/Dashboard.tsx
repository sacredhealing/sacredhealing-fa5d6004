import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Play, Music2, Wind } from 'lucide-react';
import { SacredFlame } from '@/components/dashboard/SacredFlame';
import { useProfile } from '@/hooks/useProfile';
import { useDailyGuidance } from '@/hooks/useDailyGuidance';
import { useDailyJourney } from '@/hooks/useDailyJourney';
import { useDayClosed } from '@/hooks/useDayClosed';
import { useReturnVisit } from '@/hooks/useReturnVisit';
import { useDashboardAutostart, dismissDashboardAutostartForToday } from '@/hooks/useDashboardAutostart';
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
    {
      id: "mantra",
      title: "Mantra",
      icon: Sparkles,
      route: "/mantras",
    },
    {
      id: "breath",
      title: "Breath",
      icon: Wind,
      route: "/breathing",
    },
    {
      id: "meditate",
      title: "Meditate",
      icon: Play,
      route: "/meditations",
    },
  ];
  const { profile: userProfile } = useProfile();
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

  const onNotNow = useCallback(() => {
    dismissDashboardAutostartForToday();
  }, []);

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

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-4 sm:pt-6 pb-24">
      <AchievementPopup achievement={newlyUnlocked} onClose={dismissNewlyUnlocked} />

      {/* Header - always visible */}
      <header className="flex items-center justify-between mb-4 sm:mb-6 animate-fade-in">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <SacredFlame />
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.greeting')}</p>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground truncate">
              {userProfile?.full_name || t('dashboard.sacredSoul')}
              <span className="ml-1 text-secondary">✨</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70">{t('common.soulAwaits')}</p>
          </div>
        </div>
        <AmbientSoundToggle />
      </header>

      {/* Quick Actions Section */}
      <div className="mb-4 sm:mb-6 animate-slide-up">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="group"
            >
              <Card className="bg-card/50 backdrop-blur border-border/50 p-3 sm:p-4 h-full hover:bg-card/80 hover:border-gold/50 transition-all duration-300 text-center">
                <action.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gold mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="text-xs sm:text-sm font-heading font-bold text-foreground">{action.title}</h3>
              </Card>
            </button>
          ))}
        </div>
      </div>

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
            {!hasCompletedToday && (
              <button
                type="button"
                onClick={onNotNow}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground/80 transition-colors block ml-auto"
                style={{ opacity: 0.7 }}
              >
                {t('common.notNow')}
              </button>
            )}
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
                        return (
                          <div key={achievement.id} className="flex-shrink-0">
                            <AchievementBadge
                              name={achievement.name}
                              description={achievement.description || ''}
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

      {/* Floating Mantra quick action — visible on Home when idle */}
      {flowState === 'idle' && (
        <button
          type="button"
          onClick={() => navigate('/mantras')}
          className="fixed bottom-20 right-4 z-40 rounded-full h-14 w-14 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center"
          aria-label={t('dashboard.ritualMantra', 'Mantra')}
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
