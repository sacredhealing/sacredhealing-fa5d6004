import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Music, Wind, ShoppingBag, Crown, Heart, Trophy, Calendar, Headphones,
  Sparkles, DollarSign, Search, Zap, Star, BookOpen, Mic, Users, Play, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HealingProgressCard } from '@/components/healing/HealingProgressCard';
import { useSHC } from '@/contexts/SHCContext';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useCuratedPlaylists } from '@/hooks/useCuratedPlaylists';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const Explore: React.FC = () => {
  const { t } = useTranslation();
  const { balance, profile } = useSHC();
  const [searchQuery, setSearchQuery] = useState('');
  const { playlists: meditationPlaylists, loading: playlistsLoading } = useCuratedPlaylists('meditation');

  const exploreCategories = [
    {
      id: 'mantras',
      to: '/mantras',
      icon: Music,
      title: t('dashboard.mantras'),
      description: t('dashboard.earnMantras'),
      gradient: 'from-purple-500/20 to-amber-500/10',
      border: 'border-purple-500/30 hover:border-purple-500/50',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      badge: '111 SHC',
    },
    {
      id: 'breathing',
      to: '/breathing',
      icon: Wind,
      title: t('dashboard.breathing', 'Breathing'),
      description: t('dashboard.breathingDesc', 'Calm & energize'),
      gradient: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'shop',
      to: '/shop',
      icon: ShoppingBag,
      title: t('nav.shop'),
      description: t('dashboard.lailasCollection'),
      gradient: 'from-pink-500/20 to-purple-500/10',
      border: 'border-pink-500/30 hover:border-pink-500/50',
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
    },
    {
      id: 'membership',
      to: '/membership',
      icon: Crown,
      title: t('dashboard.membership'),
      description: t('dashboard.upgradeYourPlan'),
      gradient: 'from-amber-500/20 to-purple-500/10',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      id: 'transformation',
      to: '/transformation',
      icon: Heart,
      title: t('dashboard.coaching'),
      description: t('dashboard.sixMonthProgram'),
      gradient: 'from-green-500/20 to-emerald-500/10',
      border: 'border-green-500/30 hover:border-green-500/50',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      id: 'leaderboard',
      to: '/leaderboard',
      icon: Trophy,
      title: t('dashboard.leaderboard'),
      description: t('dashboard.leaderboardDesc'),
      gradient: 'from-yellow-500/20 to-orange-500/10',
      border: 'border-yellow-500/30 hover:border-yellow-500/50',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      badge: '5,000 SHC',
    },
    {
      id: 'affirmation',
      to: '/affirmation-soundtrack',
      icon: Mic,
      title: t('dashboard.affirmationSoundtrack'),
      description: t('dashboard.personalizedForYou'),
      gradient: 'from-violet-500/20 to-fuchsia-500/10',
      border: 'border-violet-500/30 hover:border-violet-500/50',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      id: 'sessions',
      to: '/private-sessions',
      icon: Calendar,
      title: t('dashboard.privateSessions'),
      description: t('dashboard.privateSessionsDesc'),
      gradient: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      id: 'podcast',
      to: '/podcast',
      icon: Headphones,
      title: t('dashboard.podcast'),
      description: t('dashboard.podcastDesc'),
      gradient: 'from-emerald-500/20 to-green-500/10',
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'ai-income',
      to: '/income-streams',
      icon: Zap,
      title: t('dashboard.aiIncomeEngine'),
      description: t('dashboard.aiIncomeDesc'),
      gradient: 'from-blue-500/20 to-indigo-500/10',
      border: 'border-blue-500/30 hover:border-blue-500/50',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      badge: t('common.new', 'New'),
    },
    {
      id: 'courses',
      to: '/courses',
      icon: BookOpen,
      title: t('nav.courses'),
      description: t('courses.subtitle', 'Deepen your practice'),
      gradient: 'from-indigo-500/20 to-purple-500/10',
      border: 'border-indigo-500/30 hover:border-indigo-500/50',
      iconBg: 'bg-indigo-500/20',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'community',
      to: '/community',
      icon: Users,
      title: t('nav.community'),
      description: t('home.communityDesc', 'Connect with like-minded souls'),
      gradient: 'from-rose-500/20 to-pink-500/10',
      border: 'border-rose-500/30 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
    },
  ];

  const filteredCategories = exploreCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">
          {t('dashboard.explore')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('home.offerSubtitle', 'Comprehensive tools and guidance for your spiritual journey')}
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-6 animate-slide-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={t('community.searchUsers', 'Search...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/30 border-border/50"
        />
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('wallet.totalBalance', 'Total Balance')}</p>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={balance?.balance ?? 0} className="text-lg font-bold text-foreground" />
                <span className="text-xs text-accent">SHC</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-amber-500/5 border-accent/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('dashboard.streak', 'Streak')}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{profile?.streak_days ?? 0}</span>
                <span className="text-xs text-muted-foreground">{t('common.days', 'days')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Healing Journey - Primary Card */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <HealingProgressCard variant="full" />
      </div>

      {/* Featured Playlists Carousel */}
      {meditationPlaylists && meditationPlaylists.length > 0 && (
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.12s' }}>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
            {t('explore.featuredPlaylists', 'Featured Playlists')}
          </h2>
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {meditationPlaylists.slice(0, 8).map((playlist) => (
                <CarouselItem key={playlist.id} className="pl-2 md:pl-4 basis-[70%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <Link to={`/meditations?playlist=${playlist.id}`}>
                    <Card className="relative overflow-hidden group cursor-pointer border-border/30 hover:border-primary/50 transition-all">
                      <div className="aspect-square relative">
                        {playlist.cover_image_url ? (
                          <img
                            src={playlist.cover_image_url}
                            alt={playlist.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                            <Music className="w-12 h-12 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-foreground text-sm truncate">{playlist.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{playlist.category}</p>
                      </div>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 hidden sm:flex" />
            <CarouselNext className="right-2 hidden sm:flex" />
          </Carousel>
        </div>
      )}

      {/* Explore Grid */}
      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
          {t('home.whatWeOffer', 'What We Offer')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCategories.map((item) => (
            <Link key={item.id} to={item.to}>
              <Card className={`p-4 bg-gradient-to-br ${item.gradient} ${item.border} transition-all h-full relative overflow-hidden`}>
                {item.badge && (
                  <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent border-accent/30">
                    {item.badge}
                  </Badge>
                )}
                <div className="flex flex-col gap-3">
                  <div className={`p-2 rounded-lg ${item.iconBg} w-fit`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Programs */}
      <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
          {t('common.featured', 'Featured')}
        </h2>
        <div className="space-y-3">
          <Link to="/stargate-membership">
            <Card className="p-4 bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-pink-500/20 border-amber-500/30 hover:border-amber-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-500/20">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{t('home.stargateMembership')}</h3>
                  <p className="text-xs text-muted-foreground">{t('home.stargateDesc')}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">€25/mo</Badge>
              </div>
            </Card>
          </Link>

          <Link to="/practitioner-certification">
            <Card className="p-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border-emerald-500/30 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20">
                  <Star className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{t('home.practitionerCert')}</h3>
                  <p className="text-xs text-muted-foreground">{t('home.certDesc')}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">12 mo</Badge>
              </div>
            </Card>
          </Link>

          <Link to="/pregnancy-program">
            <Card className="p-4 bg-gradient-to-r from-rose-500/20 via-pink-500/10 to-fuchsia-500/20 border-rose-500/30 hover:border-rose-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-500/20">
                  <Heart className="w-6 h-6 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{t('pregnancy.title', 'Sacred Pregnancy')}</h3>
                  <p className="text-xs text-muted-foreground">{t('pregnancy.subtitle', 'Support on your journey')}</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Explore;
