import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, 
  Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, 
  Banknote, Lock, FileText, Globe, Clock, Info, HelpCircle, Smartphone
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
  const { t, i18n } = useTranslation();
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
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);

  // Practice Time State
  const [sadhanaTime, setSadhanaTime] = useState(localStorage.getItem('sadhanaTime') || '05:00');

  const handleSadhanaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSadhanaTime(e.target.value);
    localStorage.setItem('sadhanaTime', e.target.value);
    toast({ title: t('profile.timeUpdated', 'Practice Time Set'), description: `${e.target.value}` });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  
  // Custom Membership Naming
  const getMembershipLevel = () => {
    if (isAdmin) return "Siddha Lineage Holder";
    if (profile?.membership_type === 'lifetime') return "Jivanmukta";
    if (profile?.membership_type === 'yearly') return "Siddha Adept";
    return "Sadhaka Seeker";
  };

  return (
    <div className="min-h-screen bg-[#0f051a] text-stone-200 px-4 pt-6 pb-32 font-serif overflow-x-hidden">
      
      {/* Top Header & Language */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-xl tracking-[0.2em] uppercase text-[#D4AF37] font-light">Personal Chamber</h1>
        <div className="scale-90 origin-right">
          <LanguageSelector />
        </div>
      </div>

      {/* Profile & Badge Section */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-32 h-32 rounded-full p-1 border-2 border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Avatar className="w-full h-full rounded-full">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-[#1a0b2e] text-3xl">{userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0f051a] px-3 py-0.5 rounded-full text-[10px] font-bold tracking-tighter uppercase whitespace-nowrap border border-[#0f051a]">
              {getMembershipLevel()}
            </div>
          </div>
          <button onClick={() => setProfileEditOpen(true)} className="absolute top-0 right-0 p-2 bg-white/5 rounded-full border border-white/10">
            <Pencil size={14} className="text-[#D4AF37]" />
          </button>
        </div>
        <h2 className="mt-6 text-2xl font-light tracking-wide">{userName}</h2>
        <p className="text-[#D4AF37]/70 text-xs italic mt-1 tracking-widest uppercase">Rohini Nakshatra • Jupiter Influence</p>
      </div>

      {/* Practice Time Adjustment */}
      <div className="mb-10 p-5 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/20">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-[#D4AF37]" size={20} />
          <h3 className="text-sm font-semibold tracking-widest uppercase">{t('profile.sadhanaTime', 'Daily Practice Time')}</h3>
        </div>
        <input 
          type="time" 
          value={sadhanaTime}
          onChange={handleSadhanaChange}
          className="w-full bg-[#1a0b2e] border border-white/10 rounded-xl p-3 text-xl text-center text-white focus:border-[#D4AF37] outline-none transition-all"
        />
        <p className="text-[10px] text-stone-500 mt-2 text-center uppercase tracking-tighter">Adjust your dashboard practice reminder</p>
      </div>

      {/* Wisdom Grid */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        {['Music', 'Meditation', 'Mantra', 'Healing', 'Vastu', 'Ayurveda', 'Jyotish'].map((item) => (
          <div key={item} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center hover:bg-white/[0.05] transition-all cursor-pointer group">
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#D4AF37] transition-colors">{item}</span>
          </div>
        ))}
      </div>

      {/* Wallet Guidance Button */}
      <button 
        onClick={() => setShowWalletInfo(!showWalletInfo)}
        className="w-full mb-4 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <Wallet className="text-indigo-400" />
          <div className="text-left">
            <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Web3 Portal</p>
            <p className="text-xs text-indigo-400/70">{walletAddress ? 'Wallet Linked' : 'What is Phantom?'}</p>
          </div>
        </div>
        <ChevronRight className={`text-indigo-400 transition-transform ${showWalletInfo ? 'rotate-90' : ''}`} />
      </button>

      {showWalletInfo && (
        <div className="mb-8 p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/20 text-sm leading-relaxed text-indigo-200/80 animate-in fade-in slide-in-from-top-2">
          <p className="mb-3 font-bold text-indigo-300">Phantom is your secure digital vault.</p>
          <p className="mb-4">It allows you to own your digital assets and spiritual badges. To connect:</p>
          <ol className="list-decimal list-inside space-y-2 mb-4 text-xs">
            <li>Download the Phantom App/Extension.</li>
            <li>Create a new wallet (Save your recovery phrase!).</li>
            <li>Click 'Connect' below to link your lineage.</li>
          </ol>
          <Button onClick={connectWallet} className="w-full bg-indigo-600 hover:bg-indigo-500">Connect Phantom</Button>
        </div>
      )}

      {/* App Guide Button */}
      <button 
        onClick={() => setShowAppGuide(!showAppGuide)}
        className="w-full mb-12 p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
      >
        <div className="flex items-center gap-4 text-left">
          <Smartphone className="text-[#D4AF37]" />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest">How this app works</p>
            <p className="text-xs text-stone-500">Android & iPhone Guidance</p>
          </div>
        </div>
        <ChevronRight className={showAppGuide ? 'rotate-90' : ''} />
      </button>

      {showAppGuide && (
        <div className="mb-12 space-y-4 animate-in fade-in">
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
            <h4 className="text-[#D4AF37] text-xs font-bold uppercase mb-2">Install on iPhone (Safari)</h4>
            <p className="text-xs text-stone-400 italic">Tap the 'Share' icon (square with arrow) → Scroll down → Tap 'Add to Home Screen'.</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
            <h4 className="text-[#D4AF37] text-xs font-bold uppercase mb-2">Install on Android (Chrome)</h4>
            <p className="text-xs text-stone-400 italic">Tap the three dots (⋮) → Tap 'Install app' or 'Add to home screen'.</p>
          </div>
        </div>
      )}

      {/* About Us - The Guides */}
      <div className="mb-16 border-t border-white/5 pt-12">
        <h3 className="text-center text-[#D4AF37] uppercase tracking-[0.3em] text-[10px] mb-10">The Siddha Lineage Guides</h3>
        <div className="space-y-12">
          {/* Adam */}
          <div className="text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border border-[#D4AF37]/40 p-1 mb-4">
              <img src="/adam-face.jpg" className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all duration-700 object-cover" alt="Adam" />
            </div>
            <h4 className="text-lg font-light tracking-widest text-white">Adam Kritagya Das</h4>
            <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest mb-4">Healer of the Siddha Lineage</p>
            <p className="text-xs leading-relaxed text-stone-400 max-w-xs italic">
              Helping people transform through healing touch, sound, and light. Adam guides seekers through Soul Purpose Analysis and the wisdom of the Rohini nakshatra.
            </p>
          </div>
          {/* Laila */}
          <div className="text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border border-[#D4AF37]/40 p-1 mb-4">
              <img src="/laila-face.jpg" className="w-full h-full rounded-full grayscale hover:grayscale-0 transition-all duration-700 object-cover" alt="Laila" />
            </div>
            <h4 className="text-lg font-light tracking-widest text-white">Laila Karaveera Nivasini Dasi</h4>
            <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest mb-4">The Singing Healer</p>
            <p className="text-xs leading-relaxed text-stone-400 max-w-xs italic">
              Yoga teacher and conduit for Nada Yoga. Laila channels healing vibrations to reorganize the emotional body and invite restorative peace.
            </p>
          </div>
          {/* Lineage Text */}
          <div className="text-center px-4 pt-4">
            <p className="text-[10px] text-stone-500 uppercase tracking-widest">Devotees of</p>
            <p className="text-sm text-[#D4AF37]/80 font-light mt-1">The Lineage of Paramahamsa Vishwananda & Mahavatar Babaji</p>
          </div>
        </div>
      </div>

      {/* Settings Sections - Simplified */}
      <div className="space-y-4 mb-12">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-4">Sanctuary Settings</h3>
          {[
            { icon: Bell, label: t('profile.notifications'), onClick: () => setNotificationsOpen(true) },
            { icon: Moon, label: t('profile.appearance'), onClick: () => setAppearanceOpen(true) },
            { icon: Shield, label: t('profile.privacy'), onClick: () => setPrivacyOpen(true) },
            { icon: Settings, label: t('profile.settings'), onClick: () => setSettingsOpen(true) },
          ].map((item) => (
            <button key={item.label} onClick={item.onClick} className="w-full flex items-center justify-between py-3 hover:px-2 transition-all">
              <div className="flex items-center gap-4">
                <item.icon size={18} className="text-stone-500" />
                <span className="text-sm">{item.label}</span>
              </div>
              <ChevronRight size={14} className="text-stone-700" />
            </button>
          ))}
        </div>
        <button onClick={handleSignOut} className="w-full py-4 text-sm text-red-400/60 uppercase tracking-widest">Sign Out</button>
      </div>

      {/* Fixed Membership Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0f051a]/90 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[10px] text-[#D4AF37] uppercase tracking-tighter px-2 mb-1">
            <span>Monthly: €19</span>
            <span className="font-bold underline">Yearly: €120</span>
            <span>Lifetime: €495</span>
          </div>
          <Button 
            onClick={() => navigate('/membership')}
            className="w-full bg-[#D4AF37] text-[#0f051a] font-bold rounded-xl py-6 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
          >
            UPGRADE TO UNIVERSAL PREMIUM
          </Button>
        </div>
      </div>

      {/* Existing Dialogs */}
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
