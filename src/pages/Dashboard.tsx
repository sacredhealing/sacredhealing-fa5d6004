import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, BookOpen, Gift, Wallet, Flame, Sparkles, DollarSign, Youtube, ShoppingBag, Crown, Music, Heart, Trophy, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { SocialShare } from '@/components/SocialShare';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useDailyQuote } from '@/hooks/useDailyQuote';
import { useDailyMeditation } from '@/hooks/useDailyMeditation';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { balance, profile, isLoading } = useSHC();
  const { quote, isVisible } = useDailyQuote();
  const { meditation: dailyMeditation, isLoading: meditationLoading } = useDailyMeditation();

  const quickActions = [
    { icon: Play, labelKey: 'quickActions.meditate', to: '/meditations', color: 'primary' },
    { icon: Youtube, labelKey: 'quickActions.videos', to: '/spiritual-education', color: 'red' },
    { icon: BookOpen, labelKey: 'quickActions.courses', to: '/courses', color: 'secondary' },
    { icon: DollarSign, labelKey: 'quickActions.earn', to: '/income-streams', color: 'accent' },
    { icon: Wallet, labelKey: 'quickActions.wallet', to: '/wallet', color: 'purple' },
  ];

  return (
    <div className="min-h-screen px-4 pt-6">
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

      {/* Today's Wisdom */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-pink-500/20 border border-amber-500/30 p-6 mb-6 animate-slide-up text-center shadow-lg" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-heading font-semibold text-amber-400">
            {t('dashboard.todaysWisdom')}
          </h2>
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <p 
          className={`text-foreground italic leading-relaxed text-lg transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {quote ? `"${quote}"` : 'Loading wisdom...'}
        </p>
        <p className="text-muted-foreground text-sm mt-3">— Paramahamsa Vishwananda</p>
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
                    Mindfulness
                  </span>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                    Morning Awakening
                  </h3>
                  <div className="flex items-center gap-4 text-foreground/80 text-sm">
                    <span>10 min</span>
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
        <div className="grid grid-cols-5 gap-2">
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
                <span className="text-xs font-medium text-foreground">{t(action.labelKey)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Sections */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Explore</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/mantras">
            <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-amber-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Music className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Mantras</h3>
                  <p className="text-xs text-muted-foreground">Earn 111 SHC</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/shop">
            <Card className="p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/10 border-pink-500/30 hover:border-pink-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <ShoppingBag className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Shop</h3>
                  <p className="text-xs text-muted-foreground">Laila's Collection</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/membership">
            <Card className="p-4 bg-gradient-to-br from-amber-500/20 to-purple-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Membership</h3>
                  <p className="text-xs text-muted-foreground">Upgrade your plan</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/transformation">
            <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Heart className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Coaching</h3>
                  <p className="text-xs text-muted-foreground">6-Month Program</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Leaderboard</h3>
                  <p className="text-xs text-muted-foreground">Top earners win 5,000 SHC monthly</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/affirmation-soundtrack">
            <Card className="p-4 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 hover:border-violet-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Music className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Affirmation Soundtrack</h3>
                  <p className="text-xs text-muted-foreground">Personalized for you</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/private-sessions">
            <Card className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{t('healing.bookPrivateSession', 'Private Sessions')}</h3>
                  <p className="text-xs text-muted-foreground">1-on-1 with Adam or Laila</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Social Share */}
      <div className="mt-8 rounded-2xl bg-muted/30 border border-border/30 p-5 animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
