import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Award, Share2, Radio, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSHC } from '@/contexts/SHCContext';
import { useDailyQuote } from '@/hooks/useDailyQuote';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
import { AchievementPopup } from '@/components/achievements/AchievementPopup';
import { ShareableProgressCard } from '@/components/achievements/ShareableProgressCard';
import { ShareableQuoteCard } from '@/components/social/ShareableQuoteCard';
import { useSocialShare } from '@/hooks/useSocialShare';
import { FeaturedPlaylistsCarousel } from '@/components/dashboard/FeaturedPlaylistsCarousel';
import { SacredFlame } from '@/components/dashboard/SacredFlame';
import { useChallenges } from '@/hooks/useChallenges';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { LiveEventCard } from '@/components/events/LiveEventCard';
import { useProfile } from '@/hooks/useProfile';
import { AmbientSoundToggle } from '@/components/audio/AmbientSoundToggle';
import { TodaysPracticeCard } from '@/components/dashboard/TodaysPracticeCard';
import { BreathingJourneysCard } from '@/components/dashboard/BreathingJourneysCard';
import { HealingJourneysCard } from '@/components/dashboard/HealingJourneysCard';
import { JourneyTimeline } from '@/components/dashboard/JourneyTimeline';
import { PositiveMeCard } from '@/components/dashboard/PositiveMeCard';
import { DailyRitualCard } from '@/components/dashboard/DailyRitualCard';
import { SpiritualPathCard } from '@/components/dashboard/SpiritualPathCard';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { balance, profile, isLoading } = useSHC();
  const { profile: userProfile } = useProfile();
  const { quote, isVisible } = useDailyQuote();
  const { 
    achievements, 
    userAchievements, 
    newlyUnlocked, 
    checkAchievements, 
    dismissNewlyUnlocked,
    getAchievementProgress 
  } = useAchievements();
  const { trackShare } = useSocialShare();
  const { challenges, isLoading: challengesLoading, joinChallenge } = useChallenges();
  const { events, isLoading: eventsLoading, rsvpToEvent } = useLiveEvents();

  // Check achievements when dashboard loads
  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  return (
    <div className="min-h-screen px-3 sm:px-4 pt-4 sm:pt-6 pb-24">
      {/* Achievement Popup */}
      <AchievementPopup 
        achievement={newlyUnlocked}
        onClose={dismissNewlyUnlocked}
      />

      {/* Header with Sacred Flame and Ambient Toggle */}
      <header className="flex items-center justify-between mb-4 sm:mb-6 animate-fade-in">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Sacred Flame on the left */}
          <SacredFlame />
          
          {/* Greeting */}
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.greeting')}</p>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground truncate">
              {userProfile?.full_name || t('dashboard.sacredSoul')}
              <span className="ml-1 text-secondary">✨</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground/70">The soul awaits.</p>
          </div>
        </div>

        {/* Ambient Sound Toggle on the right */}
        <AmbientSoundToggle />
      </header>

      {/* Today's Sacred Practice - Hero Card (Daily Guidance Engine) */}
      <div className="mb-4 sm:mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <TodaysPracticeCard greeting="Today's Sacred Practice" />
      </div>

      {/* Daily Spiritual Practice */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <DailyRitualCard />
      </div>

      {/* Your Path */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <SpiritualPathCard />
      </div>

      {/* Two-Column Journeys Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Breathing Journeys */}
        <BreathingJourneysCard />
        
        {/* Healing Journeys */}
        <HealingJourneysCard />
      </div>

      {/* Bottom Section: Positive Me + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        {/* Positive Me Stats */}
        <PositiveMeCard />
        
        {/* Journey Timeline */}
        <JourneyTimeline />
      </div>

      {/* Challenges Section */}
      {!challengesLoading && challenges && challenges.length > 0 && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Challenges
            </h2>
            <Link to="/challenges" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {challenges.slice(0, 2).map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={joinChallenge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Live Events Section */}
      {!eventsLoading && events && events.length > 0 && events.filter(e => new Date(e.scheduled_at) > new Date()).length > 0 && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Upcoming Events
            </h2>
            <Link to="/live-events" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {events
              .filter(e => new Date(e.scheduled_at) > new Date())
              .slice(0, 2)
              .map(event => (
                <LiveEventCard
                  key={event.id}
                  event={event}
                  onRSVP={rsvpToEvent}
                />
              ))}
          </div>
        </div>
      )}

      {/* Featured Playlists Carousel */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <FeaturedPlaylistsCarousel contentType="meditation" />
      </div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.45s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-heading font-semibold text-foreground">
                Achievements
              </h2>
            </div>
            <Badge variant="outline" className="text-xs">
              {userAchievements.length}/{achievements.length}
            </Badge>
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
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shareable Progress Card */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Share Your Journey
          </h2>
        </div>
        <ShareableProgressCard 
          onShare={() => trackShare({ shareType: 'progress_card', platform: 'native' })} 
        />
      </div>

      {/* Daily Wisdom Shareable */}
      {quote && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.55s' }}>
          <ShareableQuoteCard 
            quote={quote}
            author="Paramahamsa Vishwananda"
            category="Daily Wisdom"
            onShare={() => trackShare({ shareType: 'quote', platform: 'native' })}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
