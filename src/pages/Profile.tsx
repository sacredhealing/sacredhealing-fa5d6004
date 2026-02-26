import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, 
  Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, 
  Banknote, Lock, FileText, Clock, Smartphone, Info, HelpCircle 
} from 'lucide-react';
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
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
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
  const { certificates, downloadCertificate, shareCertificate } = useCertificates();
  const { hasAccess: hasAkashicRecord } = useAkashicAccess(user?.id);
  const { reading: vedicReading } = useAIVedicReading();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  
  // New State for Education & Preferences
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [sadhanaTime, setSadhanaTime] = useState(localStorage.getItem('sadhana_time') || '05:00');

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSadhanaTime(e.target.value);
    localStorage.setItem('sadhana_time', e.target.value);
    toast({ title: t('profile.practiceTimeUpdated', 'Practice Time Set') });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t('profile.signOut'), description: t('profile.seeYouSoon') });
    navigate('/');
  };

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  
  const getSiddhaRank = () => {
    if (isAdmin) return "Siddha Lineage Holder";
    if (profile?.membership_type === 'lifetime') return "Jivanmukta";
    if (profile?.membership_type === 'yearly') return "Siddha Adept";
    return "Sadhaka Seeker";
  };

  return (
    <div className="min-h-screen bg-[#0f051a] text-stone-200 px-4 pt-6 pb-36 font-serif selection:bg-[#D4AF37]/30">
      
      {/* Header & Language Integration */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-xl tracking-[0.2em] uppercase text-[#D4AF37] font-light">The Personal Chamber</h1>
        <div className="scale-90 origin-right border border-[#D4AF37]/20 rounded-lg p-1">
          <LanguageSelector />
        </div>
      </div>

      {/* Soul Aura Profile Header */}
      <div className="flex flex-col items-center mb-12 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full animate-pulse" />
          <div className="relative w-32 h-32 rounded-full p-1 border-2 border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
            <Avatar className="w-full h-full rounded-full border-4 border-[#0f051a]">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-[#1a0b2e] text-4xl text-[#D4AF37] font-light">
                {userName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0f051a] px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg">
              {getSiddhaRank()}
            </div>
          </div>
          <button onClick={() => setProfileEditOpen(true)} className="absolute top-0 right-0 p-2 bg-[#1a0b2e] rounded-full border border-[#D4AF37]/30 text-[#D4AF37]">
            <Pencil size={14} />
          </button>
        </div>
        <h2 className="mt-8 text-2xl font-light tracking-wide text-white">{userName}</h2>
        <p className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase mt-2">Rohini Soul • Jupiter Influence</p>
      </div>

      {/* Stats Ribbon */}
      <div className="flex justify-center gap-12 mb-12">
        <div className="text-center">
          <Flame className="w-5 h-5 text-[#D4AF37] mx-auto mb-1 opacity-70" />
          <p className="text-lg font-bold text-white leading-none">{shcProfile?.streak_days ?? 0}</p>
          <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">Streak</p>
        </div>
        <div className="text-center">
          <Flower2 className="w-5 h-5 text-[#D4AF37] mx-auto mb-1 opacity-70" />
          <p className="text-lg font-bold text-white leading-none"><AnimatedCounter value={balance?.balance ?? 0} /></p>
          <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">Balance</p>
        </div>
        <div className="text-center">
          <Star className="w-5 h-5 text-[#D4AF37] mx-auto mb-1 opacity-70" />
          <p className="text-lg font-bold text-white leading-none">7</p>
          <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">Seals</p>
        </div>
      </div>

      {/* Sadhana Timing Adjustment */}
      <div className="mb-6 p-6 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
        <div className="flex items-center gap-3 mb-4 text-[#D4AF37]/80">
          <Clock size={18} />
          <h3 className="text-xs font-bold uppercase tracking-widest">{t('profile.spiritualPracticeTime', 'Sadhana Timing')}</h3>
        </div>
        <input 
          type="time" 
          value={sadhanaTime}
          onChange={handleTimeChange}
          className="w-full bg-[#0a0411] border border-[#D4AF37]/20 rounded-xl p-4 text-2xl text-center text-white focus:ring-1 focus:ring-[#D4AF37] transition-all"
        />
        <p className="text-[10px] text-stone-500 mt-3 text-center uppercase tracking-tighter">Sets the anchor for your daily dashboard guidance</p>
      </div>

      {/* Wisdom Folders */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {['Music', 'Meditation', 'Mantra', 'Healing', 'Vastu', 'Ayurveda', 'Jyotish'].map((item) => (
          <div key={item} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center group cursor-pointer hover:bg-[#D4AF37]/5 transition-all">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 group-hover:text-[#D4AF37] transition-colors">{item}</p>
          </div>
        ))}
      </div>

      {/* App Installation Guidance */}
      <div className="mb-4">
        <button 
          onClick={() => setShowAppGuide(!showAppGuide)}
          className="w-full p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <Smartphone className="text-[#D4AF37]/60 group-hover:text-[#D4AF37]" size={20} />
            <div className="text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-white">How this app works</p>
              <p className="text-[10px] text-stone-500">Add to Phone (Android & iOS)</p>
            </div>
          </div>
          <ChevronRight className={`text-stone-600 transition-transform ${showAppGuide ? 'rotate-90 text-[#D4AF37]' : ''}`} />
        </button>
        {showAppGuide && (
          <div className="mt-2 p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 animate-slide-up">
            <div className="text-xs leading-relaxed text-stone-400">
              <p className="text-[#D4AF37] font-bold mb-1 uppercase tracking-tighter text-[10px]">Apple iPhone (Safari)</p>
              Tap the <span className="text-white px-1">Share icon</span> → Scroll down → Tap <span className="text-white">'Add to Home Screen'</span>.
            </div>
            <div className="text-xs leading-relaxed text-stone-400 border-t border-white/5 pt-4">
              <p className="text-[#D4AF37] font-bold mb-1 uppercase tracking-tighter text-[10px]">Android (Chrome)</p>
              Tap the <span className="text-white px-1">three dots (⋮)</span> → Tap <span className="text-white">'Install app'</span> or 'Add to home screen'.
            </div>
          </div>
        )}
      </div>

      {/* Web3 / Phantom Education */}
      <div className="mb-10">
        <button 
          onClick={() => setShowWalletGuide(!showWalletGuide)}
          className="w-full p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <Wallet className="text-indigo-400" size={20} />
            <div className="text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-100">Web3 Sanctuary</p>
              <p className="text-[10px] text-indigo-400/70">Phantom Connection & Guidance</p>
            </div>
          </div>
          <ChevronRight className={`text-indigo-400/50 transition-transform ${showWalletGuide ? 'rotate-90' : ''}`} />
        </button>
        {showWalletGuide && (
          <div className="mt-2 p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/10 animate-slide-up">
            <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2">What is Phantom?</h4>
            <p className="text-[11px] text-indigo-200/60 leading-relaxed mb-4">
              Phantom is your secure digital vault. It allows you to truly own your spiritual badges, certificates, and assets on the blockchain. 
              If you are new, download the Phantom App from your store, create a wallet, and then click Connect.
            </p>
            <Button onClick={connectWallet} className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white border-0 py-6 text-xs tracking-widest">
              {walletAddress ? t('wallet.connected') : 'INITIATE CONNECTION'}
            </Button>
          </div>
        )}
      </div>

      {/* The Guides Section */}
      <div className="mb-16 border-t border-white/5 pt-12">
        <h3 className="text-center text-[#D4AF37] uppercase tracking-[0.4em] text-[10px] mb-12 opacity-80">The Siddha Lineage Guides</h3>
        <div className="grid grid-cols-1 gap-16 px-4">
          {/* Adam */}
          <div className="text-center flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border border-[#D4AF37]/30 p-1.5 mb-6 relative">
              <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-full animate-ping opacity-20" />
              <img src="/adam-face.jpg" className="w-full h-full rounded-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-1000" alt="Adam" />
            </div>
            <h4 className="text-xl font-light text-white tracking-widest">Adam Kritagya Das</h4>
            <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] mt-2 mb-4">Healer of the Siddha Lineage</p>
            <p className="text-xs leading-relaxed text-stone-400 italic font-light max-w-xs">
              "Transforming souls through healing touch, sound, and light. A guide of peace and Soul Purpose Analysis under the wisdom of Rohini."
            </p>
          </div>
          {/* Laila */}
          <div className="text-center flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border border-[#D4AF37]/30 p-1.5 mb-6 relative">
              <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-full animate-ping opacity-20" />
              <img src="/laila-face.jpg" className="w-full h-full rounded-full object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-1000" alt="Laila" />
            </div>
            <h4 className="text-xl font-light text-white tracking-widest">Laila Karaveera Nivasini Dasi</h4>
            <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] mt-2 mb-4">The Singing Healer</p>
            <p className="text-xs leading-relaxed text-stone-400 italic font-light max-w-xs">
              "A conduit for Nada Yoga and restorative peace. Laila channels healing vibrations to reorganize the emotional body and heart."
            </p>
          </div>
        </div>
        <div className="mt-16 text-center border-b border-white/5 pb-12">
          <p className="text-[9px] text-stone-500 uppercase tracking-[0.3em]">Humble Devotees of</p>
          <p className="text-sm text-[#D4AF37] font-light mt-2 tracking-wide uppercase opacity-80">
            Paramahamsa Vishwananda & Mahavatar Babaji
          </p>
        </div>
      </div>

      {/* Standard Sanctuary Settings */}
      <div className="space-y-3 mb-12">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4 px-2 italic">Sanctuary Configuration</h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          {[
            { icon: Bell, label: t('profile.notifications'), onClick: () => setNotificationsOpen(true) },
            { icon: Moon, label: t('profile.appearance'), onClick: () => setAppearanceOpen(true) },
            { icon: Shield, label: t('profile.privacy'), onClick: () => setPrivacyOpen(true) },
            { icon: Settings, label: t('profile.settings'), onClick: () => setSettingsOpen(true) },
          ].map((item, idx) => (
            <button key={item.label} onClick={item.onClick} className={`w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-all ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
              <div className="flex items-center gap-4">
                <item.icon size={18} className="text-stone-500" />
                <span className="text-sm font-light">{item.label}</span>
              </div>
              <ChevronRight size={14} className="text-stone-700" />
            </button>
          ))}
        </div>
        <button onClick={handleSignOut} className="w-full py-6 text-[10px] text-red-400/40 uppercase tracking-[0.4em] font-bold">Terminate Session</button>
      </div>

      {/* Fixed Sovereignty Membership Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0f051a]/95 backdrop-blur-2xl border-t border-[#D4AF37]/20 z-50">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] text-[#D4AF37] uppercase tracking-tighter font-bold px-2">
            <span className="opacity-70">Monthly €19</span>
            <div className="h-1 w-1 rounded-full bg-[#D4AF37]/30" />
            <span>Yearly €120</span>
            <div className="h-1 w-1 rounded-full bg-[#D4AF37]/30" />
            <span className="opacity-70">Lifetime €495</span>
          </div>
          <Button 
            onClick={() => navigate('/membership')}
            className="w-full bg-[#D4AF37] text-[#0f051a] font-bold rounded-xl py-7 shadow-[0_-10px_40px_rgba(212,175,55,0.15)] border-0 hover:bg-[#D4AF37]/90 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
          >
            Upgrade to Universal Premium
          </Button>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
