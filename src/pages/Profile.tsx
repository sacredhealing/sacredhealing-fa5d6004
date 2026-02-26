import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, 
  Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, 
  Banknote, Lock, FileText, Clock, Smartphone, Sparkles, Compass 
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

// Core Dialogs
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
  const { reading: vedicReading } = useAIVedicReading();

  // State Management
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [sadhanaTime, setSadhanaTime] = useState(localStorage.getItem('sadhana_time') || '05:00');

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSadhanaTime(e.target.value);
    localStorage.setItem('sadhana_time', e.target.value);
    toast({ title: t('profile.practiceTimeUpdated', 'Sadhana Time Anchored') });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userName = user?.user_metadata?.full_name || t('dashboard.sacredSoul');
  const dashaCycle = vedicReading?.personalCompass?.currentDasha?.period?.split(' ')[0] || 'Rahu';

  return (
    <div className="min-h-screen text-stone-200 font-serif pb-48 overflow-x-hidden relative selection:bg-[#D4AF37]/30"
         style={{ background: 'radial-gradient(circle at 50% -10%, #2d1b4e 0%, #0f051a 50%, #050208 100%)' }}>
      
      {/* Top Header */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <Compass className="text-[#D4AF37] w-4 h-4" />
          <span className="text-[9px] tracking-[0.5em] uppercase text-[#D4AF37]/50 font-bold">Personal Chamber</span>
        </div>
        <div className="scale-90">
          <LanguageSelector />
        </div>
      </div>

      {/* Profile Altar */}
      <div className="flex flex-col items-center mb-12 relative z-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full" />
          <div className="relative w-32 h-32 rounded-full p-1 border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <Avatar className="w-full h-full rounded-full border-2 border-[#0f051a]">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-[#1a0b2e] text-[#D4AF37] text-3xl font-light">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0f051a] px-4 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase whitespace-nowrap">
              {isAdmin ? "Siddha Lineage Holder" : "Jivanmukta"}
            </div>
          </div>
          <button onClick={() => setProfileEditOpen(true)} className="absolute top-0 right-0 p-2 bg-[#1a0b2e] border border-[#D4AF37]/30 rounded-full text-[#D4AF37]">
            <Pencil size={12} />
          </button>
        </div>
        <h2 className="mt-8 text-2xl font-light tracking-wide text-white">{userName}</h2>
        <p className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase mt-2">
          {dashaCycle} Cycle Active • Soul Frequency: 528Hz
        </p>
      </div>

      {/* Stats Ribbon */}
      <div className="flex justify-center gap-12 mb-12 relative z-10">
        <div className="text-center">
          <Flame className="w-5 h-5 text-[#D4AF37] mx-auto mb-1 opacity-50" />
          <p className="text-lg font-bold text-white leading-none">{shcProfile?.streak_days ?? 0}</p>
          <p className="text-[8px] uppercase tracking-widest text-stone-500 mt-1 italic">Streak</p>
        </div>
        <div className="text-center">
          <Flower2 className="w-5 h-5 text-[#D4AF37] mx-auto mb-1 opacity-50" />
          <p className="text-lg font-bold text-white leading-none"><AnimatedCounter value={balance?.balance ?? 0} /></p>
          <p className="text-[8px] uppercase tracking-widest text-stone-500 mt-1 italic">Balance</p>
        </div>
        <div className="text-center">
          <Star className="w-5 h-5 text-[#D4AF37] mx-auto mb-1 opacity-50" />
          <p className="text-lg font-bold text-white leading-none">7</p>
          <p className="text-[8px] uppercase tracking-widest text-stone-500 mt-1 italic">Seals</p>
        </div>
      </div>

      {/* Sadhana Anchor */}
      <div className="px-6 mb-10 relative z-10">
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-3 mb-4 text-[#D4AF37]/70">
            <Clock size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sadhana Timing</span>
          </div>
          <input 
            type="time" 
            value={sadhanaTime}
            onChange={handleTimeChange}
            className="w-full bg-[#0a0411] border border-[#D4AF37]/20 rounded-xl p-4 text-2xl text-center text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
      </div>

      {/* Wisdom Grid */}
      <div className="px-6 grid grid-cols-2 gap-3 mb-12 relative z-10">
        {['Music', 'Meditation', 'Mantra', 'Healing', 'Vastu', 'Ayurveda', 'Jyotish'].map((item) => (
          <div key={item} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center group active:scale-95 transition-all">
            <p className="text-[9px] uppercase tracking-[0.3em] text-stone-500 group-hover:text-[#D4AF37]">{item}</p>
          </div>
        ))}
      </div>

      {/* Guides Section */}
      <div className="px-6 mb-20 relative z-10 border-t border-white/5 pt-16">
        <h3 className="text-center text-[#D4AF37]/30 uppercase tracking-[0.5em] text-[8px] mb-12 font-black">The Lineage Guides</h3>
        <div className="space-y-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full border border-[#D4AF37]/20 p-1 mb-4 relative">
              <img src="/adam-face.jpg" className="w-full h-full rounded-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700" alt="Adam" />
            </div>
            <h4 className="text-lg font-light tracking-widest text-white">Adam Kritagya Das</h4>
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-[0.2em] mt-1 mb-3">Siddha Lineage Healer</p>
            <p className="text-[11px] leading-relaxed text-stone-500 italic max-w-xs px-4">Transforming through healing touch, sound, and light. Soul Purpose Analysis under Rohini.</p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full border border-[#D4AF37]/20 p-1 mb-4 relative">
              <img src="/laila-face.jpg" className="w-full h-full rounded-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700" alt="Laila" />
            </div>
            <h4 className="text-lg font-light tracking-widest text-white">Laila Karaveera Nivasini Dasi</h4>
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-[0.2em] mt-1 mb-3">The Singing Healer</p>
            <p className="text-[11px] leading-relaxed text-stone-500 italic max-w-xs px-4">Conduit for Nada Yoga. Reorganizing the emotional body through restorative vibrations.</p>
          </div>
        </div>
        <div className="mt-16 text-center opacity-30">
          <p className="text-[8px] text-stone-600 uppercase tracking-[0.3em]">Devotees of</p>
          <p className="text-xs text-[#D4AF37] font-light mt-2 tracking-widest uppercase">Paramahamsa Vishwananda & Mahavatar Babaji</p>
        </div>
      </div>

      {/* Help Buttons */}
      <div className="px-6 space-y-3 mb-12 relative z-10">
        <button onClick={() => setShowAppGuide(!showAppGuide)} className="w-full p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <Smartphone className="text-stone-500 group-hover:text-[#D4AF37]" size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">App Guidance</span>
          </div>
          <ChevronRight size={14} className={showAppGuide ? 'rotate-90' : ''} />
        </button>
        {showAppGuide && (
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 text-[10px] text-stone-500 leading-relaxed">
            <p className="mb-2"><span className="text-[#D4AF37] font-bold">iOS:</span> Safari Share → Add to Home Screen</p>
            <p><span className="text-[#D4AF37] font-bold">Android:</span> Chrome Menu → Install App</p>
          </div>
        )}

        <button onClick={() => setShowWalletGuide(!showWalletGuide)} className="w-full p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <Wallet className="text-indigo-400/50 group-hover:text-indigo-400" size={18} />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Web3 Sanctuary</span>
          </div>
          <ChevronRight size={14} className={showWalletGuide ? 'rotate-90' : ''} />
        </button>
        {showWalletGuide && (
          <div className="p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/10 text-[10px] text-indigo-300/60 leading-relaxed">
            <p className="mb-4">Phantom is your digital vault for spiritual assets. Download the app, create a wallet, and connect below.</p>
            <Button onClick={connectWallet} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 text-[10px] tracking-widest">Connect Phantom</Button>
          </div>
        )}
      </div>

      {/* Sanctuary Settings */}
      <div className="px-6 space-y-1 mb-12 relative z-10">
        <h3 className="text-[9px] uppercase tracking-[0.4em] text-stone-600 mb-4 px-2 italic">Configuration</h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {[
            { icon: Bell, label: t('profile.notifications'), onClick: () => setNotificationsOpen(true) },
            { icon: Moon, label: t('profile.appearance'), onClick: () => setAppearanceOpen(true) },
            { icon: Shield, label: t('profile.privacy'), onClick: () => setPrivacyOpen(true) },
            { icon: Settings, label: t('profile.settings'), onClick: () => setSettingsOpen(true) },
          ].map((item, idx) => (
            <button key={item.label} onClick={item.onClick} className={`w-full flex items-center justify-between p-5 hover:bg-white/[0.04] transition-all ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
              <div className="flex items-center gap-4">
                <item.icon size={16} className="text-stone-500" />
                <span className="text-sm font-light">{item.label}</span>
              </div>
              <ChevronRight size={12} className="text-stone-800" />
            </button>
          ))}
        </div>
        <button onClick={handleSignOut} className="w-full py-8 text-[9px] text-red-400/30 uppercase tracking-[0.5em] font-black">Terminate Session</button>
      </div>

      {/* Pricing Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0a0411]/95 backdrop-blur-3xl border-t border-[#D4AF37]/20 z-50">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center text-[9px] text-[#D4AF37]/60 uppercase tracking-widest font-black px-4 italic">
            <span>Sadhaka €19</span>
            <span>Siddha €120</span>
            <span>Jivanmukta €495</span>
          </div>
          <Button onClick={() => navigate('/membership')} className="w-full bg-gradient-to-r from-[#8b6e2f] via-[#D4AF37] to-[#8b6e2f] text-[#0f051a] font-black rounded-2xl py-7 uppercase tracking-[0.2em] text-[10px] shadow-2xl border-0">
            Ascend to Premium
          </Button>
        </div>
      </div>

      {/* Dialog Components */}
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
