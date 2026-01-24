import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Radio, Award, Share2, Users, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useChallenges } from '@/hooks/useChallenges';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { LiveEventCard } from '@/components/events/LiveEventCard';
import { useProfile } from '@/hooks/useProfile';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';

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

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E] p-6 text-white">
      {/* Achievement Popup */}
      <AchievementPopup 
        achievement={newlyUnlocked}
        onClose={dismissNewlyUnlocked}
      />

      {/* 1. Header with Sacred Flame & Wallet */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-400/20 flex items-center justify-center sacred-glow">
            {/* Sacred Flame Icon */}
            <div className="w-6 h-6 bg-cyan-400 rounded-full blur-[2px] animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-light">
              Good Morning, {userProfile?.full_name || 'Soul'}. 
              <span className="font-bold ml-1">The light awaits.</span>
            </h1>
          </div>
        </div>
        <div className="flex gap-4">
          {/* Wallet Balance Integration */}
          <Link to="/wallet" className="glass-card px-4 py-2 rounded-full flex items-center gap-2 hover:scale-105 transition-transform">
            <span className="text-yellow-400 text-sm">●</span>
            <span className="text-xs font-mono uppercase tracking-widest">
              <AnimatedCounter value={balance?.balance ?? 0} /> SHC
            </span>
          </Link>
          <button className="glass-card p-2 rounded-full hover:scale-105 transition-transform">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Hero: Today's Practice (Left Column Large) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 glass-card rounded-3xl p-8 flex items-center relative overflow-hidden min-h-[280px]"
        >
          {/* Animated Sacred Geometry */}
          <div className="absolute -left-10 opacity-20 animate-spin-slow">
            <svg width="300" height="300" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="cyan" fill="none" strokeWidth="0.5" />
              <polygon points="50,10 90,90 10,90" stroke="cyan" fill="none" strokeWidth="0.5" />
              <polygon points="50,90 10,10 90,10" stroke="cyan" fill="none" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" stroke="cyan" fill="none" strokeWidth="0.3" />
            </svg>
          </div>
          
          <div className="relative z-10 ml-auto w-full md:w-1/2">
            <h2 className="text-3xl font-bold mb-2">Today's Sacred Practice</h2>
            <p className="text-cyan-200/70 mb-6 italic">"Morning: Rise with Clarity"</p>
            <Link to="/meditations">
              <button className="bg-cyan-400 text-[#0F0C29] px-8 py-3 rounded-xl font-bold sacred-glow hover:scale-105 transition-transform">
                Start Journey
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Right Column: Healing Journeys & Quick Action */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-3xl p-6 flex-1">
            <h3 className="text-sm uppercase tracking-widest text-cyan-300 mb-4">Healing Journeys</h3>
            <div className="flex flex-col gap-4">
              <Link to="/healing" className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <span>My Sacred Flame</span>
                <span className="text-cyan-400 text-xs">Strong 🔥</span>
              </Link>
              {/* Quickie Reset Icon */}
              <Link to="/breathing" className="w-full h-32 flex items-center justify-center bg-cyan-400/10 rounded-2xl border border-cyan-400/30 hover:bg-cyan-400/20 transition-colors">
                <span className="text-4xl animate-pulse">✨</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Bottom Row: Journeys & Timeline */}
        <div className="md:col-span-4 glass-card rounded-3xl p-6">
          <h3 className="mb-4 font-semibold">Breathing Journeys</h3>
          <div className="grid grid-cols-2 gap-3">
            {['Anxiety', 'Balance', 'Focus', 'Sleep'].map((item) => (
              <Link 
                key={item} 
                to="/breathing"
                className="p-4 bg-white/5 rounded-2xl text-center text-xs hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="mb-2 text-xl">◎</div>
                {item}
              </Link>
            ))}
          </div>
        </div>

        {/* Timeline & Progress */}
        <div className="md:col-span-8 glass-card rounded-3xl p-6 relative">
          <h3 className="text-sm text-cyan-300 uppercase tracking-widest">Your Journey Timeline</h3>
          <p className="my-4 text-lg">"Your soul seeks calm. Try <strong>Heart-Opening</strong> breath next."</p>
          {/* Mini Timeline Dots */}
          <div className="flex gap-4 items-center">
            {[1,2,3,4,5].map(i => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full ${i < 4 ? 'bg-cyan-400 shadow-[0_0_10px_cyan]' : 'bg-white/20'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Challenges Section */}
      {!challengesLoading && challenges && challenges.length > 0 && (
        <div className="mt-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              Challenges
            </h2>
            <Link to="/challenges" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
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
        <div className="mt-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              Upcoming Events
            </h2>
            <Link to="/live-events" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
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
      <div className="mt-8 animate-slide-up">
        <FeaturedPlaylistsCarousel contentType="meditation" />
      </div>

      {/* Healing Journey Card */}
      <div className="mt-8">
        <HealingProgressCard variant="compact" />
      </div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="mt-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-heading font-semibold">
                Achievements
              </h2>
            </div>
            <Badge variant="outline" className="text-xs border-cyan-400/30 text-cyan-300">
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
      <div className="mt-8 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-heading font-semibold">
            Share Your Journey
          </h2>
        </div>
        <ShareableProgressCard 
          onShare={() => trackShare({ shareType: 'progress_card', platform: 'native' })} 
        />
      </div>

      {/* Daily Wisdom Shareable */}
      {quote && (
        <div className="mt-8 animate-slide-up">
          <ShareableQuoteCard 
            quote={quote}
            author="Paramahamsa Vishwananda"
            category="Daily Wisdom"
            onShare={() => trackShare({ shareType: 'quote', platform: 'native' })}
          />
        </div>
      )}

      {/* Invite Friends */}
      <div className="mt-8 mb-8 rounded-3xl glass-card p-6 animate-slide-up">
        <h2 className="text-lg font-heading font-semibold mb-3">{t('dashboard.inviteFriends')}</h2>
        <p className="text-sm text-cyan-200/60 mb-4">{t('dashboard.inviteDescription')}</p>
        <Link to="/invite-friends">
          <Button className="w-full gap-2 bg-cyan-400 text-[#0F0C29] hover:bg-cyan-300 font-bold">
            <Users className="w-4 h-4" />
            {t('dashboard.inviteFriends')}
          </Button>
        </Link>
      </div>

      {/* 4. Floating Action Button (FAB) */}
      <FloatingActionButton />
    </div>
  );
};

export default Dashboard;
