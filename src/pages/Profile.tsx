import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, 
  Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, 
  Clock, Smartphone, Compass, Sparkles, HelpCircle 
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
import { AnimatedCounter } from '@/components/ui/animated-counter';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { walletAddress, connectWallet } = usePhantomWallet();
  const { balance, profile: shcProfile } = useSHC();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();

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

  const userName = user?.user_metadata?.full_name || "Sacred Soul";
  
  const getSiddhaRank = () => {
    if (isAdmin) return "Siddha Lineage Holder";
    if (profile?.membership_type === 'lifetime') return "Jivanmukta";
    if (profile?.membership_type === 'yearly') return "Siddha Adept";
    return "Sadhaka Seeker";
  };

  return (
    <div className="min-h-screen text-stone-200 font-serif pb-44 overflow-x-hidden relative"
         style={{ background: 'radial-gradient(circle at 50% -10%, #2d1b4e 0%, #0f051a 50%, #050208 100%)' }}>
      
      {/* Sacred Geometry Texture Layer */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/sacred-geometry.png')` }} />

      {/* Header & Language Toggle */}
      <div className="relative z-10 flex justify-between items-center p-6 mb-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <Compass className="text-[#D4AF37] w-4 h-4" />
          <span className="text-[9px] tracking-[0.5em] uppercase text-[#D4AF37]/50 font-bold">Personal Chamber</span>
        </div>
        <div className="bg-[#1a0b2e]/40 backdrop-blur-xl border border-[#D4AF37]/20 rounded-full px-2 py-0.5 scale-90">
          <LanguageSelector />
        </div>
      </div>

      {/* Main Sanctuary Altar (Profile) */}
      <div className="flex flex-col items-center mb-12 relative z-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#D4AF37]/15 blur-3xl rounded-full group-hover:bg-[#D4AF37]/25 transition-all duration-1000" />
          <div className="relative w-36 h-36 rounded-full p-1.5 border border-[#D4AF37]/30 shadow-[0_0_60px_rgba(212,175,55,0.1)]">
            <Avatar className="w-full h-full rounded-full border-4 border-[#0f051a]">
              <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-[#1a0b2e] text-[#D4AF37] text-4xl font-light">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#D4AF37] to-[#8b6e2f] text-[#0f051a] px-5 py-1 rounded-full text-[9px] font-black tracking-[0.2em] uppercase shadow-2xl whitespace-nowrap">
              {getSiddhaRank()}
            </div>
          </div>
          <button onClick={() => setProfileEditOpen(true)} className="absolute top-0 right-0 p-2 bg-[#1a0b2e] border border-[#D4AF37]/30 rounded-full text-[#D4AF37] shadow-xl active:scale-90 transition-all">
            <Pencil size={14} />
          </button>
        </div>

        <h2 className="mt-10 text-3xl font-light tracking-wide text-white drop-shadow-lg">{userName}</h2>
        <div className="flex items-center gap-2 mt-3 text-[#D4AF37]/60 text-[9px] tracking-[0.3em] uppercase">
          <Sparkles size={10} className="animate-pulse" />
          <span>Rohini Soul • Jupiter Influence</span>
          <Sparkles size={10} className="animate-pulse" />
        </div>
      </div>

      {/* Sacred Counters (Streak, Balance, Seals) */}
      <div className="flex justify-center gap-14 mb-14 relative z-10 px-6">
        {[
          { icon: Flame, value: shcProfile?.streak_days ?? 0, label: 'Streak' },
          { icon: Flower2, value: <AnimatedCounter value={balance?.balance ?? 0} />, label: 'Balance' },
          { icon: Star, value: '7', label: 'Seals' }
        ].map((stat, i) => (
          <div key={i} className="text-center group">
            <stat.icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-xl font-light text-white">{stat.value}</p>
            <p className="text-[8px] uppercase tracking-[0.4em] text-stone-500 mt-2 font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sadhana Timer - Dharma Sync */}
      <div className="px-6 mb-12 relative z-10">
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 shadow-inner">
          <div className="flex items-center gap-3 mb-4 text-[#D4AF37]/80">
            <Clock size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{t('profile.sadhanaTiming', 'Anchor Practice Time')}</h3>
          </div>
          <input 
            type="time" 
            value={sadhanaTime}
            onChange={handleTimeChange}
            className="w-full bg-[#0a0411] border border-[#D4AF37]/20 rounded-2xl p-5 text-3xl text-center text-white focus:border-[#D4AF37] outline-none transition-all font-light"
          />
          <p className="text-[8px] text-stone-600 mt-4 text-center uppercase tracking-widest font-bold">Synchronizes the dashboard to your spiritual rhythm</p>
        </div>
      </div>

      {/* Wisdom Grid (The Content Shrines) */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-12 relative z-10">
        {['Music', 'Meditation', 'Mantra', 'Healing', 'Vastu', 'Ayurveda', 'Jyotish'].map((item) => (
          <div key={item} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center group hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 transition-all duration-500">
            <p className="text-[10px] uppercase tracking-[0.4em] text-stone-500 group-hover:text-[#D4AF37] transition-colors">{item}</p>
          </div>
        ))}
      </div>

      {/* Guides Section (Adam & Laila) */}
      <div className="px-6 mb-20 relative z-10 border-t border-white/5 pt-16">
        <h3 className="text-center text-[#D4AF37]/30 uppercase tracking-[0.6em] text-[8px] mb-16 font-black">The Siddha Lineage Guides</h3>
        <div className="grid grid-cols-1 gap-16">
          {[
            { 
              name: 'Adam Kritagya Das', 
              role: 'Healer of the Siddha Lineage', 
              img: '/adam-face.jpg',
              bio: 'A healer of the Siddha lineage helping souls transform through touch, sound, and light. Adam guides spiritual seekers toward peace through Soul Purpose Analysis.' 
            },
            { 
              name: 'Laila Karaveera Nivasini Dasi', 
              role: 'The Singing Healer', 
              img: '/laila-face.jpg',
              bio: 'Yoga teacher and conduit for Nada Yoga. Laila channels restorative vibrations to reorganize the emotional body and heart through sacred song.' 
            }
          ].map((guide, i) => (
            <div key={i} className="flex flex-col items-center text-center px-4 group">
              <div className="w-28 h-28 rounded-full border border-[#D4AF37]/20 p-1.5 mb-6 relative shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <img src={guide.img} className="relative w-full h-full rounded-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-1000 shadow-inner" alt={guide.name} />
              </div>
              <h4 className="text-xl font-light tracking-widest text-white">{guide.name}</h4>
              <p className="text-[9px] text-[#D4AF37] uppercase tracking-[0.2em] mt-2 mb-4 font-black">{guide.role}</p>
              <p className="text-[11px] leading-relaxed text-stone-500 italic font-light max-w-[260px]">{guide.bio}</p>
            </div>
          ))}
        </div>
        <div className="mt-20 text-center opacity-40">
          <p className="text-[8px] text-stone-500 uppercase tracking-[0.4em]">Humble Devotees of</p>
          <p className="text-xs text-[#D4AF37] font-light mt-3 tracking-[0.1em] uppercase">Paramahamsa Vishwananda & Mahavatar Babaji</p>
        </div>
      </div>

      {/* Navigation & Help Shrines */}
      <div className="px-6 space-y-4 mb-20 relative z-10">
        <button onClick={() => setShowAppGuide(!showAppGuide)} className="w-full p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
          <div className="flex items-center gap-5">
            <Smartphone className="text-[#D4AF37]/40" size={20} />
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-white">How this app works</p>
              <p className="text-[9px] text-stone-600 uppercase tracking-tighter">Installation for iOS & Android</p>
            </div>
          </div>
          <ChevronRight className={`text-stone-700 transition-transform ${showAppGuide ? 'rotate-90 text-[#D4AF37]' : ''}`} size={16} />
        </button>
        {showAppGuide && (
          <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="text-[11px] text-stone-400 font-light leading-relaxed">
              <span className="text-[#D4AF37] font-black uppercase text-[9px]">iPhone:</span> Tap 'Share' in Safari → Scroll down → 'Add to Home Screen'.
            </div>
            <div className="text-[11px] text-stone-400 font-light leading-relaxed border-t border-white/5 pt-4">
              <span className="text-[#D4AF37] font-black uppercase text-[9px]">Android:</span> Tap 'Menu' (⋮) in Chrome → 'Install App' or 'Add to home screen'.
            </div>
          </div>
        )}

        <button onClick={() => setShowWalletGuide(!showWalletGuide)} className="w-full p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between group hover:border-indigo-400/50 transition-all">
          <div className="flex items-center gap-5">
            <Wallet className="text-indigo-400/70" size={20} />
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Web3 Sanctuary</p>
              <p className="text-[9px] text-indigo-500/40 uppercase tracking-tighter">Connect Phantom & Digital Assets</p>
            </div>
          </div>
          <ChevronRight className={`text-indigo-500/30 transition-transform ${showWalletGuide ? 'rotate-90' : ''}`} size={16} />
        </button>
        {showWalletGuide && (
          <div className="p-6 rounded-3xl bg-indigo-950/10 border border-indigo-500/10 space-y-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-[11px] text-indigo-200/60 font-light leading-relaxed">
              Phantom is your secure digital vault. It protects your spiritual progress and unique certificates on the blockchain. Download the Phantom App, create your vault, then link it below.
            </p>
            <Button onClick={connectWallet} className="w-full bg-indigo-600 hover:bg-indigo-500 text-[10px] tracking-[0.2em] font-black uppercase py-7 rounded-2xl">
              {walletAddress ? t('wallet.connected') : 'Connect Digital Vault'}
            </Button>
          </div>
        )}
      </div>

      {/* Sanctuary Settings */}
      <div className="px-6 space-y-3 mb-12 relative z-10">
        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-600 mb-6 px-2">Sanctuary Configuration</h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {[
            { icon: Bell, label: t('profile.notifications'), onClick: () => setNotificationsOpen(true) },
            { icon: Moon, label: t('profile.appearance'), onClick: () => setAppearanceOpen(true) },
            { icon: Shield, label: t('profile.privacy'), onClick: () => setPrivacyOpen(true) },
            { icon: Settings, label: t('profile.settings'), onClick: () => setSettingsOpen(true) },
          ].map((item, idx) => (
            <button key={item.label} onClick={item.onClick} className={`w-full flex items-center justify-between p-6 hover:bg-white/[0.04] transition-all ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
              <div className="flex items-center gap-4">
                <item.icon size={16} className="text-stone-500" />
                <span className="text-sm font-light tracking-wide">{item.label}</span>
              </div>
              <ChevronRight size={14} className="text-stone-800" />
            </button>
          ))}
        </div>
        <button onClick={handleSignOut} className="w-full py-8 text-[9px] text-red-400/30 uppercase tracking-[0.5em] font-black hover:text-red-400/60 transition-colors">Terminate Session</button>
      </div>

      {/* Sovereign Sacred Exchange Bar (Fixed) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0a0411]/95 backdrop-blur-3xl border-t border-[#D4AF37]/20 z-50">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center text-[9px] text-[#D4AF37]/60 uppercase tracking-widest font-black px-4">
            <span>Sadhaka €19</span>
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]/20" />
            <span className="text-[#D4AF37]">Siddha €120</span>
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]/20" />
            <span>Jivanmukta €495</span>
          </div>
          <Button 
            onClick={() => navigate('/membership')}
            className="w-full bg-gradient-to-r from-[#8b6e2f] via-[#D4AF37] to-[#8b6e2f] text-[#0f051a] font-black rounded-2xl py-8 shadow-[0_10px_40px_rgba(212,175,55,0.2)] border-0 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-[10px]"
          >
            Ascend to Premium
          </Button>
        </div>
      </div>

      {/* Core App Dialogs */}
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
