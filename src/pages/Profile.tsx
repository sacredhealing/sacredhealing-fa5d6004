import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Flame, Award, Settings, LogOut, ChevronRight, Wallet, Bell, Moon, Shield, LayoutDashboard, Globe, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LotusIcon } from '@/components/icons/LotusIcon';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { useToast } from '@/hooks/use-toast';

const badges = [
  { id: 1, emoji: '🧘', title: 'First Meditation', earned: true },
  { id: 2, emoji: '🔥', title: '7-Day Streak', earned: true },
  { id: 3, emoji: '📚', title: 'Course Complete', earned: true },
  { id: 4, emoji: '🌟', title: '30-Day Streak', earned: false },
  { id: 5, emoji: '👑', title: 'Premium Member', earned: false },
  { id: 6, emoji: '🎯', title: '100 Sessions', earned: false },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { walletAddress, connectWallet } = usePhantomWallet();
  const { balance } = useSHCBalance();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t('profile.signOut'),
      description: "See you soon!"
    });
    navigate('/');
  };

  const menuItems = [
    { icon: Megaphone, label: 'Promote & Earn', sublabel: 'Share and earn SHC rewards', onClick: () => navigate('/promote') },
    { icon: LayoutDashboard, label: t('admin.title'), sublabel: t('admin.manageContent'), onClick: () => navigate('/admin') },
    { icon: Bell, label: t('profile.notifications'), sublabel: 'Daily reminders', onClick: () => {} },
    { 
      icon: Wallet, 
      label: t('wallet.connectWallet'), 
      sublabel: walletAddress ? `${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}` : 'Web3 wallet',
      onClick: connectWallet 
    },
    { icon: Moon, label: 'Appearance', sublabel: 'Dark mode', onClick: () => {} },
    { icon: Shield, label: 'Privacy', sublabel: 'Data & security', onClick: () => {} },
    { icon: Settings, label: t('profile.settings'), sublabel: 'App preferences', onClick: () => {} },
  ];

  const userName = user?.user_metadata?.full_name || 'Sacred Soul';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-healing p-1 glow-purple">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <LotusIcon size={48} />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
            <Flame size={16} />
          </div>
        </div>
        
        <h1 className="mt-4 text-2xl font-heading font-bold text-foreground">{userName}</h1>
        <p className="text-muted-foreground">{userEmail}</p>
        
        {/* Stats */}
        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-primary">7</p>
            <p className="text-xs text-muted-foreground">{t('profile.streak')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-secondary">
              {balance?.balance.toLocaleString() ?? '0'}
            </p>
            <p className="text-xs text-muted-foreground">{t('profile.balance')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-accent">3</p>
            <p className="text-xs text-muted-foreground">{t('profile.badges')}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.badges')}</h2>
          <button className="text-sm text-primary">View All</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl text-center border transition-all ${
                badge.earned
                  ? 'bg-gradient-card border-border/50'
                  : 'bg-muted/20 border-border/30 opacity-50'
              }`}
            >
              <span className="text-3xl">{badge.emoji}</span>
              <p className={`text-xs mt-2 ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                {badge.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Language Selector */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('profile.language')}</h2>
        <LanguageSelector />
      </div>

      {/* Premium CTA */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-healing p-5 glow-purple">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/30 rounded-full blur-2xl" />
          <div className="relative">
            <h3 className="text-lg font-heading font-bold text-foreground mb-1">{t('profile.upgradePremium')}</h3>
            <p className="text-foreground/80 text-sm mb-4">
              {t('profile.unlockFeatures')}
            </p>
            <Button variant="gold" size="sm">
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-card border border-border/50 hover:bg-muted/50 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <item.icon size={20} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sublabel}</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <Button 
        variant="ghost" 
        className="w-full mt-6 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleSignOut}
      >
        <LogOut size={18} />
        {t('profile.signOut')}
      </Button>
    </div>
  );
};

export default Profile;
