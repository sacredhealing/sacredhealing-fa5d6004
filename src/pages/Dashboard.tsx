import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, BookOpen, Gift, Wallet, Flame, Sparkles, DollarSign, Youtube, ShoppingBag, Crown, Music, Heart, Trophy, Star, Calendar, Headphones, Wind, Award, Share2, Radio, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { SocialShare } from '@/components/SocialShare';
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
import { DailyRitualCard } from '@/components/dashboard/DailyRitualCard';
import { DailyPracticeCard } from '@/components/dashboard/DailyPracticeCard';
import { SpiritualPathCard } from '@/components/dashboard/SpiritualPathCard';
import { useChallenges } from '@/hooks/useChallenges';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { LiveEventCard } from '@/components/events/LiveEventCard';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { balance, profile, isLoading } = useSHC();
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

  const quickActions = [
    { icon: Play, labelKey: 'quickActions.meditate', to: '/meditations', color: 'primary' },
    { icon: Youtube, labelKey: 'quickActions.videos', to: '/spiritual-education', color: 'red' },
    { icon: BookOpen, labelKey: 'quickActions.courses', to: '/courses', color: 'secondary' },
    { icon: DollarSign, labelKey: 'quickActions.earn', to: '/income-streams', color: 'accent' },
    { icon: Wallet, labelKey: 'quickActions.wallet', to: '/wallet', color: 'purple' },
  ];

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Achievement Popup */}
      <AchievementPopup 
        achievement={newlyUnlocked}
        onClose={dismissNewlyUnlocked}
      />
      {/* Header */}
      <header className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <p className="text-muted-foreground text-sm">{t('dashboard.greeting')}</p>
          <h1 className="text-2xl font-heading font-bold text-foreground">{t('dashboard.sacredSoul')} ✨</h1>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          <Flame className="text-accent" size={18} />
          <span className="font-heading font-semibold text-foreground">
            {profile?.streak_days ?? 0}
          </span>
          <span className="text-sm text-muted-foreground">{t('dashboard.streak')}</span>
        </div>
      </header>

      {/* SHC Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border/50 p-6 mb-6 animate-slide-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('dashboard.balance')}</p>
            <div className="flex items-baseline gap-2">
              <AnimatedCounter 
                value={balance?.balance ?? 0} 
                className="text-4xl font-heading font-bold text-gradient-gold"
              />
              <span className="text-lg text-accent font-medium">SHC</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center glow-gold">
            <Sparkles className="text-accent" size={28} />
          </div>
        </div>
        <Link to="/wallet">
          <Button variant="gold" size="sm" className="mt-4">
            {t('dashboard.claimRewards')}
          </Button>
        </Link>
      </div>

      {/* Personalized Daily Practice */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <DailyPracticeCard />
      </div>

      {/* Today's Meditation */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">{t('dashboard.todaysMeditation')}</h2>
        <Link to="/meditations" className="block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-healing p-6 glow-purple">
            <div className="absolute top-4 right-4 opacity-30">
              <LotusIcon size={80} />
            </div>
            <div className="relative">
              {meditationLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 w-24 bg-background/20 rounded-full mb-3" />
                  <div className="h-7 w-48 bg-background/20 rounded mb-2" />
                  <div className="h-5 w-32 bg-background/20 rounded" />
                </div>
              ) : dailyMeditation ? (
                <>
                  <span className="inline-block px-3 py-1 bg-background/20 rounded-full text-xs font-medium text-foreground mb-3">
                    {dailyMeditation.category}
                  </span>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                    {dailyMeditation.title}
                  </h3>
                  <div className="flex items-center gap-4 text-foreground/80 text-sm">
                    <span>{dailyMeditation.duration_minutes} min</span>
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} className="text-accent" />
                      +{dailyMeditation.shc_reward || 100} SHC
                    </span>
                  </div>
                  <Button variant="glass" size="sm" className="mt-4">
                    <Play size={16} />
                    {t('dashboard.startSession')}
                  </Button>
                </>
              ) : (
                <>
                  <span className="inline-block px-3 py-1 bg-background/20 rounded-full text-xs font-medium text-foreground mb-3">
                    {t('meditations.categories.focus')}
                  </span>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                    {t('dashboard.morningAwakening')}
                  </h3>
                  <div className="flex items-center gap-4 text-foreground/80 text-sm">
                    <span>10 {t('meditations.duration')}</span>
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} className="text-accent" />
                      +100 SHC
                    </span>
                  </div>
                  <Button variant="glass" size="sm" className="mt-4">
                    <Play size={16} />
                    {t('dashboard.startSession')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((action) => (
            <Link key={action.labelKey} to={action.to}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-all duration-300">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  action.color === 'primary' ? 'bg-primary/20 text-primary' :
                  action.color === 'secondary' ? 'bg-secondary/20 text-secondary' :
                  action.color === 'accent' ? 'bg-accent/20 text-accent' :
                  action.color === 'red' ? 'bg-red-500/20 text-red-500' :
                  'bg-purple/20 text-purple'
                }`}>
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{t(action.labelKey)}</span>
              </div>
            </Link>
          ))}
          <button
            onClick={() => navigate("/creative-soul")}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="text-purple-500" size={20} />
            </div>
            <span className="text-xs font-medium text-foreground text-center">Creative Soul</span>
          </button>
        </div>
      </div>

      {/* Daily Ritual Card */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.32s' }}>
        <DailyRitualCard />
      </div>

      {/* Challenges Section */}
      {!challengesLoading && challenges && challenges.length > 0 && (
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.33s' }}>
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
      {events.filter(e => new Date(e.scheduled_at) > new Date()).length > 0 && (
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.34s' }}>
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

      {/* Spiritual Path Card */}
      <div className="mt-4 animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <SpiritualPathCard />
      </div>

      {/* Featured Playlists Carousel */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.34s' }}>
        <FeaturedPlaylistsCarousel contentType="meditation" />
      </div>

      {/* Featured Sections - Explore */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
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
            <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-amber-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/10 border-pink-500/30 hover:border-pink-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-amber-500/20 to-purple-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 hover:border-violet-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all h-full">
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
            <Card className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30 hover:border-emerald-500/50 transition-all h-full">
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
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
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
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
        <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.45s' }}>
          <ShareableQuoteCard 
            quote={quote}
            author="Paramahamsa Vishwananda"
            category="Daily Wisdom"
            onShare={() => trackShare({ shareType: 'quote', platform: 'native' })}
          />
        </div>
      )}

      {/* Social Share */}
      <div className="mt-8 rounded-2xl bg-muted/30 border border-border/30 p-5 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('dashboard.inviteFriends')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('dashboard.inviteDescription')}</p>
        <SocialShare 
          title="Sacred Healing App"
          text="Join me on Sacred Healing - Transform your spiritual journey and earn SHC tokens! 🧘‍♀️✨"
        />
      </div>
    </div>
  );
};

export default Dashboard;
