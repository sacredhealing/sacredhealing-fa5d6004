import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SacredFlame } from '@/components/dashboard/SacredFlame';
import { useProfile } from '@/hooks/useProfile';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { TodaysPracticeCard } from '@/components/dashboard/TodaysPracticeCard';
import { InlineSessionPlayer } from '@/components/dashboard/InlineSessionPlayer';
import { CompletionResponse } from '@/components/dashboard/CompletionResponse';
import { FeaturedPlaylistsCarousel } from '@/components/dashboard/FeaturedPlaylistsCarousel';
import { AchievementPopup } from '@/components/achievements/AchievementPopup';
import { useAchievements } from '@/hooks/useAchievements';
import type { DailyGuidance } from '@/hooks/useDailyGuidance';

export type HomeFlowState = 'idle' | 'in_session' | 'completed' | 'suggestions';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile: userProfile } = useProfile();
  const {
    newlyUnlocked,
    dismissNewlyUnlocked,
    checkAchievements,
  } = useAchievements();

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

      {/* State: idle - Daily Guidance Card only */}
      {flowState === 'idle' && (
        <div className="mb-4 sm:mb-6 animate-slide-up">
          <TodaysPracticeCard
            greeting="Today's Sacred Practice"
            onStartClick={handleStartSession}
          />
        </div>
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
