import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, BookOpen, Gift, Wallet, Flame, Sparkles, DollarSign, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LotusIcon } from '@/components/icons/LotusIcon';

const dailyQuote = {
  text: "The wound is the place where the Light enters you.",
  author: "Rumi"
};

const todaysMeditation = {
  title: "Morning Awakening",
  duration: "10 min",
  category: "Mindfulness",
  reward: 5
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

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
          <span className="font-heading font-semibold text-foreground">7</span>
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
              <span className="text-4xl font-heading font-bold text-gradient-gold">1,250</span>
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

      {/* Daily Quote */}
      <div className="rounded-2xl bg-muted/30 border border-border/30 p-5 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-sm text-secondary mb-2 font-medium">{t('dashboard.todaysWisdom')}</p>
        <p className="text-foreground italic leading-relaxed">"{dailyQuote.text}"</p>
        <p className="text-muted-foreground text-sm mt-2">— {dailyQuote.author}</p>
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
              <span className="inline-block px-3 py-1 bg-background/20 rounded-full text-xs font-medium text-foreground mb-3">
                {todaysMeditation.category}
              </span>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                {todaysMeditation.title}
              </h3>
              <div className="flex items-center gap-4 text-foreground/80 text-sm">
                <span>{todaysMeditation.duration}</span>
                <span className="flex items-center gap-1">
                  <Sparkles size={14} className="text-accent" />
                  +{todaysMeditation.reward} SHC
                </span>
              </div>
              <Button variant="glass" size="sm" className="mt-4">
                <Play size={16} />
                {t('dashboard.startSession')}
              </Button>
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
    </div>
  );
};

export default Dashboard;
