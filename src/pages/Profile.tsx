import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Flame, Flower2, Star, Settings, LogOut, ChevronRight, Wallet, Bell, 
  Moon, Shield, Scale, LayoutDashboard, Megaphone, Crown, Pencil, 
  Clock, Smartphone, Compass, Sparkles
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

  const [showAppGuide, setShowAppGuide] = useState(false);
  const [showWalletGuide, setShowWalletGuide] = useState(false);
  const [sadhanaTime, setSadhanaTime] = useState(localStorage.getItem('sadhana_time') || '06:00');

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSadhanaTime(e.target.value);
    localStorage.setItem('sadhana_time', e.target.value);
    toast({ title: "Sadhana Time Anchored" });
  };

  const userName = user?.user_metadata?.full_name || "Sacred Soul";

  return (
    <div className="min-h-screen text-stone-200 font-serif pb-40 overflow-x-hidden relative"
         style={{ background: 'radial-gradient(circle at 50% -20%, #2d1b4e 0%, #0f051a 50%, #050208 100%)' }}>
      
      {/* Sacred Geometry Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/sacred-geometry.png')` }} />

      {/* Top Navigation: Language & Identity */}
      <div className="relative z-10 flex justify-between items-center p-6 mb-4">
        <div className="flex items-center gap-2">
          <Compass className="text-[#D4AF37] w-5 h-5 animate-spin-slow" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#D4AF37]/60">Personal Chamber</span>
        </div>
        <div className="bg-[#1a0b2e]/60 backdrop-blur-md border border-[#D4AF37]/20 rounded-full px-3 py-1 scale-90">
          <LanguageSelector />
        </div>
      </div>

      {/* Central Altar: Profile & Rank */}
      <div className="flex flex-col items-center mb-16 animate-fade-in relative z-10">
        <div className="relative group">
          {/* Pulsing Aura */}
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full group-hover:bg-[#D4AF37]/40 transition-all duration-1000" />
          
          <div className="relative w-36 h-36 rounded-full p-1.5 border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <Avatar className="w-full h-full rounded-full border-2 border-[#0f051a]">
              <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-[#1a0b2e] text-[#D4AF37] text-4xl font-light">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Rank Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8b6e2f] via-[#D4AF37] to-[#8b6e2f] text-[#0f051a] px-5 py-1 rounded-full text-[9px] font-black tracking-[0.2em] uppercase shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
              {isAdmin ? "Siddha Lineage Holder" : "Jivanmukta"}
            </div>
          </div>
        </div>

        <h2 className="mt-10 text-3xl font-light tracking-[0.1em] text-white drop-shadow-md">{userName}</h2>
        <div className="flex items-center gap-2 mt-3 text-[#D4AF37]/60 text-[9px] tracking-[0.3em] uppercase">
          <Sparkles size={10} />
          <span>Rohini Soul • Jupiter Influence</span>
          <Sparkles size={10} />
        </div>
      </div>

      {/* Sacred Counters */}
      <div className="flex justify-center gap-16 mb-20 relative z-10">
        {[
          { icon: Flame, value: shcProfile?.streak_days ?? 0, label: 'Streak' },
          { icon: Flower2, value: <AnimatedCounter value={balance?.balance ?? 0} />, label: 'Balance' },
          { icon: Star, value: '7', label: 'Seals' }
        ].map((stat, i) => (
          <div key={i} className="text-center group cursor-default">
            <stat.icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
            <p className="text-xl font-light text-white leading-none">{stat.value}</p>
            <p className="text-[8px] uppercase tracking-[0.3em] text-stone-500 mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content Shrines Grid */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-16 relative z-10">
        {['Music', 'Meditation', 'Mantra', 'Healing', 'Vastu', 'Ayurveda', 'Jyotish'].map((item) => (
          <div key={item} 
               className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center group transition-all duration-500 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 active:scale-95 shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 group-hover:text-[#D4AF37] transition-colors">{item}</p>
          </div>
        ))}
      </div>

      {/* Action Altars */}
      <div className="px-6 space-y-4 mb-20 relative z-10">
        {/* App Guidance */}
        <div className="group">
          <button onClick={() => setShowAppGuide(!showAppGuide)}
                  className="w-full p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-between group-hover:border-[#D4AF37]/30 transition-all">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-full bg-white/5 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#0f051a] transition-all">
                <Smartphone size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-white">How this app works</p>
                <p className="text-[9px] text-stone-500 mt-1 uppercase tracking-tighter">Installation & Usage Guide</p>
              </div>
            </div>
            <ChevronRight size={14} className={`text-stone-600 transition-transform ${showAppGuide ? 'rotate-90 text-[#D4AF37]' : ''}`} />
          </button>
          {showAppGuide && (
            <div className="mt-3 p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 animate-slide-up text-[11px] text-stone-400 leading-relaxed font-light">
              <p><span className="text-[#D4AF37] font-bold">iOS:</span> Tap 'Share' in Safari → 'Add to Home Screen'</p>
              <p><span className="text-[#D4AF37] font-bold">Android:</span> Tap 'Menu' (⋮) in Chrome → 'Install App'</p>
            </div>
          )}
        </div>

        {/* Web3 Education */}
        <div className="group">
          <button onClick={() => setShowWalletGuide(!showWalletGuide)}
                  className="w-full p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between hover:bg-indigo-950/30 transition-all">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                <Wallet size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Web3 Sanctuary</p>
                <p className="text-[9px] text-indigo-400/50 mt-1 uppercase tracking-tighter">Your Digital Identity Guide</p>
              </div>
            </div>
            <ChevronRight size={14} className={`text-indigo-400/30 transition-transform ${showWalletGuide ? 'rotate-90' : ''}`} />
          </button>
          {showWalletGuide && (
            <div className="mt-3 p-6 rounded-3xl bg-indigo-950/10 border border-indigo-500/10 animate-slide-up text-[11px] text-indigo-200/60 leading-relaxed">
              <p className="mb-4">Phantom is your vault. It secures your spiritual progress and unique certificates on the blockchain.</p>
              <Button onClick={connectWallet} className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-[10px] tracking-[0.2em] font-black uppercase py-6 rounded-2xl">
                Initiate Connection
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lineage Section: Adam & Laila */}
      <div className="px-6 mb-24 relative z-10 border-t border-white/5 pt-16">
        <h3 className="text-center text-[#D4AF37]/40 uppercase tracking-[0.5em] text-[8px] mb-16">The Siddha Lineage Guides</h3>
        
        <div className="space-y-20">
          {[
            { 
              name: 'Adam Kritagya Das', 
              role: 'Healer of the Siddha Lineage', 
              img: '/adam-face.jpg',
              bio: '"Transforming souls through healing touch, sound, and light. A guide of peace under the wisdom of Rohini."' 
            },
            { 
              name: 'Laila Karaveera Nivasini Dasi', 
              role: 'The Singing Healer', 
              img: '/laila-face.jpg',
              bio: '"A conduit for Nada Yoga and restorative peace. Laila channels vibrations to reorganize the emotional body."' 
            }
          ].map((guide, i) => (
            <div key={i} className="flex flex-col items-center text-center px-4 group">
              <div className="w-24 h-24 rounded-full border border-[#D4AF37]/20 p-1.5 mb-6 relative">
                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-xl group-hover:bg-[#D4AF37]/30 transition-all duration-700" />
                <img src={guide.img} className="relative w-full h-full rounded-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000" alt={guide.name} />
              </div>
              <h4 className="text-lg font-light tracking-[0.1em] text-white">{guide.name}</h4>
              <p className="text-[8px] text-[#D4AF37] uppercase tracking-[0.2em] mt-2 mb-4 font-black">{guide.role}</p>
              <p className="text-[11px] leading-relaxed text-stone-500 italic font-light max-w-[280px]">{guide.bio}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center opacity-40">
          <p className="text-[8px] text-stone-500 uppercase tracking-[0.4em]">Humble Devotees of</p>
          <p className="text-xs text-[#D4AF37] font-light mt-3 tracking-[0.1em] uppercase">
            Paramahamsa Vishwananda & Mahavatar Babaji
          </p>
        </div>
      </div>

      {/* Sovereign Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0a0411]/90 backdrop-blur-3xl border-t border-[#D4AF37]/20 z-50">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center text-[9px] text-[#D4AF37]/60 uppercase tracking-widest font-black px-4">
            <span>Seeker €19</span>
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]/20" />
            <span className="text-[#D4AF37]">Adept €120</span>
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]/20" />
            <span>Eternal €495</span>
          </div>
          <Button 
            onClick={() => navigate('/membership')}
            className="w-full bg-gradient-to-r from-[#8b6e2f] via-[#D4AF37] to-[#8b6e2f] text-[#0f051a] font-black rounded-2xl py-8 shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-[10px]"
          >
            Upgrade to Universal Premium
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
