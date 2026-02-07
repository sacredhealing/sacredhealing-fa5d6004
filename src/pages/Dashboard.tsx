import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SacredFlame } from '@/components/dashboard/SacredFlame';
import { useProfile } from '@/hooks/useProfile';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { TodaysPracticeCard } from '@/components/dashboard/TodaysPracticeCard';
import { InlineSessionPlayer } from '@/components/dashboard/InlineSessionPlayer';
import { CompletionResponse } from '@/components/dashboard/CompletionResponse';
import { FeaturedPlaylistsCarousel } from '@/components/dashboard/FeaturedPlaylistsCarousel';
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
import { useAchievements } from '@/hooks/useAchievements';
import { useSocialShare } from '@/hooks/useSocialShare';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';

export type HomeFlowState = 'idle' | 'in_session' | 'completed' | 'suggestions';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile: userProfile } = useProfile();
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

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const handleStartSession = (guidance: DailyGuidance) => {
    setActiveGuidance(guidance);
    setFlowState('in_session');
  };

  const handleSessionComplete = () => {
    setFlowState('completed');
  };

  const handleBackFromSession = () => {
    setFlowState('idle');
    setActiveGuidance(null);
  };

  const handleDone = () => {
    setFlowState('idle');
    setActiveGuidance(null);
  };

  const handleSeeSuggestions = () => {
    setFlowState('suggestions');
  };

  const handleCloseSuggestions = () => {
    setFlowState('idle');
    setActiveGuidance(null);
  };

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
            <p className="text-[10px] sm:text-xs text-muted-foreground/70">The soul awaits.</p>
          </div>
        </div>
        <AmbientSoundToggle />
      </header>

      {/* State: idle - Daily Guidance Card + restored sections */}
      {flowState === 'idle' && (
        <>
          <div className="mb-4 sm:mb-6 animate-slide-up">
            <TodaysPracticeCard
              greeting="Today's Sacred Practice"
              onStartClick={handleStartSession}
            />
          </div>

          {/* Daily Spiritual Practice & Your Path — above the fold */}
          <div className="space-y-4 mb-6 animate-slide-up">
            <DailyRitualCard />
            <SpiritualPathCard />
          </div>

          {/* Collapsed: More practices */}
          <div className="mb-4 animate-slide-up">
            <SectionCollapse
              title="More practices"
              description="Breathing and healing journeys"
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
              title="Progress & achievements"
              description="Timeline, streaks, achievements and share"
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
                        Achievements
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

      {/* State: completed - Reflection + Affirmation */}
      {flowState === 'completed' && (
        <div className="mb-6 animate-slide-up">
          <CompletionResponse
            onDone={handleDone}
            onSeeSuggestions={handleSeeSuggestions}
          />
        </div>
      )}

      {/* State: suggestions - You may also like */}
      {flowState === 'suggestions' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              You may also like
            </h2>
            <button
              onClick={handleCloseSuggestions}
              className="text-sm text-primary hover:text-primary/80"
            >
              Done
            </button>
          </div>
          <FeaturedPlaylistsCarousel contentType="meditation" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
