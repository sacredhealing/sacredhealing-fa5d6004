import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, Banknote, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
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
  const { reading: vedicReading } = useAIVedicReading();

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

  const dashaCycle = vedicReading?.personalCompass?.currentDasha?.period?.split(' ')[0] || 'Rahu';
  const soulLabel = t('profile.soulRecordLabel', `Age 42 • ${dashaCycle} Cycle Active • Soul Frequency: 528Hz`);

  // Sacred Folders for Dharma Configuration
  const physicalSanctuary = [
    { icon: Bell, label: t('profile.notifications'), sublabel: t('profile.dailyReminders'), onClick: () => setNotificationsOpen(true) },
    { icon: Moon, label: t('profile.appearance'), sublabel: t('profile.darkMode'), onClick: () => setAppearanceOpen(true) },
    { icon: Shield, label: t('profile.privacy'), sublabel: t('profile.dataAndSecurity'), onClick: () => setPrivacyOpen(true) },
  ];
  const abundanceLineage = [
    { icon: Banknote, label: t('profile.walletEarningsAdvanced', 'Wallet & Earnings (Advanced)'), sublabel: t('profile.walletEarningsDesc', 'SHC, affiliate, income streams'), onClick: () => navigate('/income-streams') },
    { icon: Megaphone, label: t('profile.promoteEarn'), sublabel: t('profile.promoteEarnDesc'), onClick: () => navigate('/income-streams/affiliate') },
    { icon: Wallet, label: t('wallet.connectWallet'), sublabel: walletAddress ? `${walletAddress.slice(0,4)}...${walletAddress.slice(-4)}` : t('profile.web3Wallet'), onClick: connectWallet },
    ...(isAdmin ? [{ icon: LayoutDashboard, label: t('admin.title'), sublabel: t('admin.manageContent'), onClick: () => navigate('/admin') }] : []),
  ];
  const theCovenant = [
    { icon: Scale, label: t('settings.legal.title'), sublabel: t('settings.legal.subtitle'), onClick: () => navigate('/legal') },
    { icon: Settings, label: t('profile.settings'), sublabel: t('profile.appPreferences'), onClick: () => setSettingsOpen(true) },
  ];

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Soul Header - Bhrigu Soul Record */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative flex justify-center">
          {/* Golden Halo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-[#D4AF37]/20 blur-xl animate-sangha-pulse" style={{ boxShadow: '0 0 40px rgba(212,175,55,0.4)' }} />
          </div>
          <div className="relative w-24 h-24 rounded-full p-[2px] border border-[#D4AF37]/40" style={{ boxShadow: '0 0 24px rgba(212,175,55,0.35), inset 0 0 20px rgba(212,175,55,0.1)' }}>
            <Avatar className="w-full h-full rounded-full border-2 border-background">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-background text-4xl text-foreground">
                {userName?.charAt(0) || '🧘'}
              </AvatarFallback>
            </Avatar>
          </div>
          <button
            onClick={() => setProfileEditOpen(true)}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0f051a] hover:bg-[#D4AF37]/90 transition-colors shadow-[0_0_12px_rgba(212,175,55,0.5)]"
          >
            <Pencil size={14} />
          </button>
        </div>

        <h1 className="mt-4 text-2xl font-heading font-bold text-foreground">{userName}</h1>
        <p className="text-sm text-[#D4AF37]/90 mt-1 text-center max-w-sm">{soulLabel}</p>
        <p className="text-muted-foreground text-xs mt-1">{userEmail}</p>

        {profile?.bio && (
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">{profile.bio}</p>
        )}

        {/* Sacred Counters - Flame, Lotus, Star */}
        <div className="flex gap-10 mt-6">
          <div className="flex flex-col items-center">
            <Flame className="w-6 h-6 text-[#D4AF37] mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }} />
            <p className="text-xl font-heading font-bold text-[#D4AF37]">{shcProfile?.streak_days ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t('profile.streak')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Flower2 className="w-6 h-6 text-[#D4AF37] mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }} />
            <p className="text-xl font-heading font-bold text-[#D4AF37]">
              <AnimatedCounter value={balance?.balance ?? 0} />
            </p>
            <p className="text-xs text-muted-foreground">{t('profile.balance')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Star className="w-6 h-6 text-[#D4AF37] mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }} />
            <p className="text-xl font-heading font-bold text-[#D4AF37]">{badges.filter(b => b.earned).length}</p>
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

      {/* Badge Vault - Mystical Seals */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">{t('profile.badges')}</h2>
          <button className="text-sm text-[#D4AF37] hover:text-[#D4AF37]/80">{t('common.viewAll')}</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`relative rounded-2xl text-center border transition-all p-5 ${
                badge.earned
                  ? 'bg-[rgba(212,175,55,0.06)] border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15),inset_0_0_20px_rgba(212,175,55,0.03)]'
                  : 'bg-white/[0.03] border-white/10 opacity-70'
              }`}
            >
              {!badge.earned && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-white/40" />
                </div>
              )}
              <span className={`block text-4xl mb-2 ${badge.earned ? 'drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]' : 'grayscale opacity-60'}`}>
                {badge.emoji}
              </span>
              <p className={`text-xs font-medium ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                {t(badge.titleKey)}
              </p>
              {badge.earned && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#D4AF37]/50" />
              )}
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

      {/* Dharma Configuration - Sacred Folders */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.04] backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-sm font-semibold text-[#D4AF37]/90 mb-3 px-1">{t('profile.sacredFolder.physicalSanctuary', 'Physical Sanctuary')}</h3>
          <div className="space-y-1">
            {physicalSanctuary.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                  <item.icon size={18} className="text-[#D4AF37]/90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.04] backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-sm font-semibold text-[#D4AF37]/90 mb-3 px-1">{t('profile.sacredFolder.abundanceLineage', 'Abundance & Lineage')}</h3>
          <div className="space-y-1">
            {abundanceLineage.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                  <item.icon size={18} className="text-[#D4AF37]/90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/25 bg-white/[0.04] backdrop-blur-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-sm font-semibold text-[#D4AF37]/90 mb-3 px-1">{t('profile.sacredFolder.theCovenant', 'The Covenant')}</h3>
          <div className="space-y-1">
            {theCovenant.map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                  <item.icon size={18} className="text-[#D4AF37]/90" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            ))}
            <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-destructive/10 transition-all text-left mt-2 border-t border-white/10 pt-3">
              <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center">
                <LogOut size={18} className="text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive text-sm">{t('profile.signOut')}</p>
              </div>
              <ChevronRight size={18} className="text-destructive/70 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Sovereign Initiation - Deep Space banner */}
      <div className="mb-8 mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div
          className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 p-6 cursor-pointer transition-all"
          style={{
            background: 'linear-gradient(135deg, #0f051a 0%, #1a0b2e 25%, #2d1b4e 50%, #1a0b2e 75%, #0f051a 100%)',
            boxShadow: '0 0 40px rgba(88,28,135,0.3), inset 0 0 60px rgba(0,0,0,0.3)',
          }}
          onClick={() => navigate('/membership')}
        >
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(147,51,234,0.4), transparent 60%)' }} />
          <div className="relative flex flex-col items-center text-center">
            <Crown className="w-10 h-10 text-[#D4AF37]/80 mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.4))' }} />
            <h3 className="font-bold text-lg text-foreground">{t('profile.ascendUniversal', 'Ascend to Universal Premium. Unlock the Full Bhrigu Samhita.')}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              {t('profile.unlockFeatures')}
            </p>
            <Button
              size="lg"
              className="mt-4 w-full max-w-xs bg-[#D4AF37] text-[#0f051a] font-bold border-0 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:bg-[#D4AF37]/95 hover:shadow-[0_0_28px_rgba(212,175,55,0.5)] animate-sangha-pulse"
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
