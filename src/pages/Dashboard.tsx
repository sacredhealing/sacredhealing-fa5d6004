import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, BookOpen, Gift, Wallet, Sparkles, DollarSign, Youtube, ShoppingBag, Crown, Music, Heart, Trophy, Star, Calendar, Headphones, Wind, Award, Share2, Radio, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useDailyQuote } from '@/hooks/useDailyQuote';
import { useDailyMeditation } from '@/hooks/useDailyMeditation';
import { HealingProgressCard } from '@/components/healing/HealingProgressCard';
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
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { SHCBalanceCard } from '@/components/dashboard/SHCBalanceCard';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { balance, profile, isLoading } = useSHC();
  const { profile: userProfile } = useProfile();
  const { quote, isVisible } = useDailyQuote();
  const { meditation: dailyMeditation, isLoading: meditationLoading } = useDailyMeditation();
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
    <div className="min-h-screen px-4 pt-6">
      {/* Achievement Popup */}
      <AchievementPopup 
        achievement={newlyUnlocked}
        onClose={dismissNewlyUnlocked}
      />

      {/* Header with Sacred Flame and Ambient Toggle */}
      <header className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          {/* Sacred Flame on the left */}
          <SacredFlame />
          
          {/* Greeting */}
          <div>
            <p className="text-sm text-muted-foreground">{t('dashboard.greeting')}</p>
            <h1 className="text-xl font-heading font-bold text-foreground">
              {userProfile?.full_name || t('dashboard.sacredSoul')}
              <span className="ml-1 text-secondary">✨</span>
            </h1>
            <p className="text-xs text-muted-foreground/70">The soul awaits.</p>
          </div>
        </div>

        {/* Ambient Sound Toggle on the right */}
        <AmbientSoundToggle />
      </header>

      {/* SHC Balance Card */}
      <div className="mb-6 animate-slide-up">
        <SHCBalanceCard />
      </div>

      {/* Today's Sacred Practice - Hero Card */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <TodaysPracticeCard 
          greeting="Today's Sacred Practice"
          subtitle="Morning: Rise with Clarity"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <QuickActionsGrid />
      </div>

      {/* Daily Spiritual Practice */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <DailyRitualCard />
      </div>

      {/* Your Path */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <SpiritualPathCard />
      </div>

      {/* Two-Column Journeys Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        {/* Breathing Journeys */}
        <BreathingJourneysCard />
        
        {/* Healing Journeys */}
        <HealingJourneysCard />
      </div>

      {/* Bottom Section: Positive Me + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
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

      {/* Explore Section */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.45s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            {t('dashboard.explore')}
          </h2>
          <Link to="/explore" className="text-sm text-primary hover:text-primary/80 transition-colors">
            {t('common.viewAll', 'View All')} →
          </Link>
        </div>
        
        {/* Healing Journey - Primary Large Card */}
        <div className="mb-4">
          <HealingProgressCard variant="compact" />
        </div>

        {/* Other Explore Items - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link to="/mantras">
            <Card className="glass-card p-4 hover:border-purple-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                  <Music className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.mantras')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.earnMantras')}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/breathing">
            <Card className="glass-card p-4 hover:border-cyan-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 shrink-0">
                  <Wind className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.breathing', 'Breathing')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.breathingDesc', 'Calm & energize')}</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/shop">
            <Card className="glass-card p-4 hover:border-pink-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20 shrink-0">
                  <ShoppingBag className="w-5 h-5 text-pink-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('nav.shop')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.lailasCollection')}</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/membership">
            <Card className="glass-card p-4 hover:border-amber-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.membership')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.upgradeYourPlan')}</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/transformation">
            <Card className="glass-card p-4 hover:border-green-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                  <Heart className="w-5 h-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.coaching')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.sixMonthProgram')}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="glass-card p-4 hover:border-yellow-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20 shrink-0">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.leaderboard')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.leaderboardDesc')}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/affirmation-soundtrack">
            <Card className="glass-card p-4 hover:border-violet-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20 shrink-0">
                  <Music className="w-5 h-5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.affirmationSoundtrack')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.personalizedForYou')}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/private-sessions">
            <Card className="glass-card p-4 hover:border-amber-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.privateSessions')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.privateSessionsDesc')}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/podcast">
            <Card className="glass-card p-4 hover:border-emerald-500/50 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 shrink-0">
                  <Headphones className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{t('dashboard.podcast')}</h3>
                  <p className="text-xs text-muted-foreground truncate">{t('dashboard.podcastDesc')}</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
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
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.55s' }}>
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
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <ShareableQuoteCard 
            quote={quote}
            author="Paramahamsa Vishwananda"
            category="Daily Wisdom"
            onShare={() => trackShare({ shareType: 'quote', platform: 'native' })}
          />
        </div>
      )}

      {/* Invite Friends */}
      <div className="mb-8 rounded-2xl glass-card p-5 animate-slide-up" style={{ animationDelay: '0.65s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('dashboard.inviteFriends')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('dashboard.inviteDescription')}</p>
        <Link to="/invite-friends">
          <Button className="w-full gap-2">
            <Users className="w-4 h-4" />
            {t('dashboard.inviteFriends')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
