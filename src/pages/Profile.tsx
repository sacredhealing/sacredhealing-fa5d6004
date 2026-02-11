import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Flame, Award, Settings, LogOut, ChevronRight, Wallet, Bell, Moon, Shield, Scale, LayoutDashboard, Globe, Megaphone, Crown, Check, Pencil, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useCertificates } from '@/hooks/useCertificates';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { NotificationsDialog } from '@/components/profile/NotificationsDialog';
import { AppearanceDialog } from '@/components/profile/AppearanceDialog';
import { PrivacyDialog } from '@/components/profile/PrivacyDialog';
import { SettingsDialog } from '@/components/profile/SettingsDialog';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { walletAddress, connectWallet } = usePhantomWallet();
  const { balance, profile: shcProfile } = useSHC();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const { certificates, isLoading: certificatesLoading, downloadCertificate, shareCertificate } = useCertificates();
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const badges = [
    { id: 1, emoji: '🧘', titleKey: 'badges.firstMeditation', earned: true },
    { id: 2, emoji: '🔥', titleKey: 'badges.sevenDayStreak', earned: true },
    { id: 3, emoji: '📚', titleKey: 'badges.courseComplete', earned: true },
    { id: 4, emoji: '🌟', titleKey: 'badges.thirtyDayStreak', earned: false },
    { id: 5, emoji: '👑', titleKey: 'badges.premiumMember', earned: false },
    { id: 6, emoji: '🎯', titleKey: 'badges.hundredSessions', earned: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: t('profile.signOut'),
      description: t('profile.seeYouSoon')
    });
    navigate('/');
  };

  // Build menu items - only show admin link if user is admin
  const menuItems = [
    { icon: Banknote, label: t('profile.walletEarningsAdvanced', 'Wallet & Earnings (Advanced)'), sublabel: t('profile.walletEarningsDesc', 'SHC, affiliate, income streams'), onClick: () => navigate('/income-streams') },
    { icon: Megaphone, label: t('profile.promoteEarn'), sublabel: t('profile.promoteEarnDesc'), onClick: () => navigate('/income-streams/affiliate') },
    // Admin panel only visible to admins
    ...(isAdmin ? [{ icon: LayoutDashboard, label: t('admin.title'), sublabel: t('admin.manageContent'), onClick: () => navigate('/admin') }] : []),
    { icon: Bell, label: t('profile.notifications'), sublabel: t('profile.dailyReminders'), onClick: () => setNotificationsOpen(true) },
    { 
      icon: Wallet, 
      label: t('wallet.connectWallet'), 
      sublabel: walletAddress ? `${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}` : t('profile.web3Wallet'),
      onClick: connectWallet 
    },
    { icon: Moon, label: t('profile.appearance'), sublabel: t('profile.darkMode'), onClick: () => setAppearanceOpen(true) },
    { icon: Shield, label: t('profile.privacy'), sublabel: t('profile.dataAndSecurity'), onClick: () => setPrivacyOpen(true) },
    { icon: Scale, label: t('settings.legal.title'), sublabel: t('settings.legal.subtitle'), onClick: () => navigate('/legal') },
    { icon: Settings, label: t('profile.settings'), sublabel: t('profile.appPreferences'), onClick: () => setSettingsOpen(true) },
  ];

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-healing p-1 glow-purple">
            <Avatar className="w-full h-full">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-background text-4xl">
                {userName?.charAt(0) || '🧘'}
              </AvatarFallback>
            </Avatar>
          </div>
          <button 
            onClick={() => setProfileEditOpen(true)}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
        
        <h1 className="mt-4 text-2xl font-heading font-bold text-foreground">{userName}</h1>
        <p className="text-muted-foreground">{userEmail}</p>
        
        {/* Bio */}
        {profile?.bio && (
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">{profile.bio}</p>
        )}
        
        {/* Stats */}
        <div className="flex gap-8 mt-6">
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-primary">{shcProfile?.streak_days ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t('profile.streak')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-secondary">
              <AnimatedCounter value={balance?.balance ?? 0} />
            </p>
            <p className="text-xs text-muted-foreground">{t('profile.balance')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading font-bold text-accent">3</p>
            <p className="text-xs text-muted-foreground">{t('profile.badges')}</p>
          </div>
        </div>

        {/* Your Space + orientation (above badges) */}
        <div className="mt-4 grid gap-3">
          {/* Your Space */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white font-semibold">{t('profile.yourSacredSpace.title')}</div>
            <div className="mt-2 text-sm text-white/70 whitespace-pre-line">
              {t('profile.yourSacredSpace.description')}
            </div>
          </div>

          {/* How to use */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white font-semibold">{t('profile.howToUse.title')}</div>
            <div className="mt-2 text-sm text-white/70 grid gap-2">
              <div>{t('profile.howToUse.step1')}</div>
              <div>{t('profile.howToUse.step2')}</div>
              <div>{t('profile.howToUse.step3')}</div>
            </div>
          </div>

          {/* What each tab does (collapsed) */}
          <details className="rounded-2xl border border-white/10 bg-white/5 p-4 group">
            <summary className="cursor-pointer text-white font-semibold list-none flex items-center justify-between">
              {t('profile.whatEachTabDoes.title')}
              <ChevronRight className="w-4 h-4 text-white/60 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-3 text-sm text-white/70 grid gap-2">
              <div>{t('profile.whatEachTabDoes.home')}</div>
              <div>{t('profile.whatEachTabDoes.meditate')}</div>
              <div>{t('profile.whatEachTabDoes.music')}</div>
              <div>{t('profile.whatEachTabDoes.soul')}</div>
              <div>{t('profile.whatEachTabDoes.library')}</div>
              <div>{t('profile.whatEachTabDoes.community')}</div>
            </div>
          </details>

          {/* Reassurance */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white font-semibold">{t('profile.whatIsHappening.title')}</div>
            <div className="mt-2 text-sm text-white/70 whitespace-pre-line">
              {t('profile.whatIsHappening.description')}
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.badges')}</h2>
          <button className="text-sm text-primary">{t('common.viewAll')}</button>
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
                {t(badge.titleKey)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.certificates')}</h2>
          </div>
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onDownload={downloadCertificate}
                onShare={shareCertificate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Language Selector */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-3">{t('profile.language')}</h2>
        <LanguageSelector />
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

      {/* Premium CTA - Membership Card (moved below preferences) */}
      <div className="mb-8 mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-background to-amber-500/10 border border-border/50 p-5 cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => navigate('/membership')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground">{t('profile.upgradePremium')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('profile.unlockFeatures')}
              </p>
              
              <ul className="space-y-1.5 mb-4">
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('profile.premiumFeature1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('profile.premiumFeature2')}
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {t('profile.premiumFeature3')}
                </li>
              </ul>

              <Button 
                size="sm"
                className="w-full bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_25px_rgba(0,242,254,0.5)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/membership');
                }}
              >
                {t('common.upgradeNow')}
              </Button>
            </div>
          </div>
        </div>
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

      {/* Dialogs */}
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
