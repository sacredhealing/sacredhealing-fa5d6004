// @ts-nocheck
/* SQI 2050: THE UNIFIED PROFILE ARCHITECTURE */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { Pencil } from 'lucide-react';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, profile: shcProfile } = useSHC();
  const { profile } = useProfile();
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  const userName = user?.user_metadata?.full_name || profile?.full_name || 'Adam';
  const avatarUrl = profile?.avatar_url || '/avatar-adam.jpg';
  const streak = shcProfile?.streak_days ?? 0;
  const balanceVal = balance?.balance ?? 0;
  const badgesCount = 3;

  const tiers = [
    { name: 'ATMA-SEED', price: 'Free', tagline: 'ENTRY FREQUENCY', features: ['Free Meditations & Mantras', 'Community Chat & Live', 'Basic Ayurveda & Jyotish'] },
    { name: 'PRANA-FLOW', price: '19€ / mo', tagline: 'SONIC VIBRATION', features: ['Full Vedic Jyotish + Chat', 'Full Ayurvedic Scan + Chat', 'Vastu Guide for Home', 'All Meditations & Healing Audios Access'] },
    { name: 'SIDDHA-QUANTUM', price: '45€ / mo', tagline: 'SIDDHA FIELD', features: ['Digital Nadi 2050 Scanner', 'Pre/Post Practice Scantions', 'Siddha Portal Access', 'Infinite Bio-Adaptive Resonance', 'Access to All Mantras'] },
    { name: 'AKASHA-INFINITY', price: '€1111', tagline: 'ETERNAL NODE', features: ['Quantum Apothecary (€888 Value)', 'Virtual Pilgrimage (€888 Value)', 'Palm Reading Portal', 'Akashic Decoder'] },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}>
      {/* SECTION 1: IDENTITY — avatar with golden border, edit button, 528Hz • Rahu */}
      <div className="pt-20 flex flex-col items-center">
        <div className="relative">
          <img
            src={avatarUrl}
            alt=""
            className="w-28 h-28 rounded-full border-2 border-[#D4AF37]/40 object-cover shadow-[0_0_20px_rgba(212,175,55,0.15)]"
            onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-adam.jpg'; }}
          />
          <button
            type="button"
            onClick={() => setProfileEditOpen(true)}
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#050505] border-2 border-[#050505] shadow-lg"
          >
            <Pencil size={12} />
          </button>
        </div>
        <h1 className="text-4xl font-black mt-4 tracking-tighter">{userName}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[#D4AF37] text-[10px] font-black tracking-[0.35em] uppercase">528Hz Resonance</span>
          <span className="w-1 h-1 rounded-full bg-[#D4AF37]/60" />
          <span className="text-[#D4AF37]/80 text-[10px] font-black tracking-[0.2em] uppercase">Rahu Active</span>
        </div>
      </div>

      {/* SECTION 2: SRI YANTRA — radial gradient background, stats bar below */}
      <section className="relative w-full overflow-hidden mx-3 mt-5 rounded-2xl border border-[#D4AF37]/10" style={{ background: 'radial-gradient(ellipse at center, #1e1200 0%, #0a0800 55%, #050505 100%)' }}>
        <div className="relative w-full">
          <img
            src="/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg"
            alt="Sri Yantra"
            className="w-full h-auto block"
            style={{ mixBlendMode: 'screen', opacity: 0.95, transform: 'scale(1.05)' }}
          />
        </div>
        <div className="w-full grid grid-cols-3 bg-black/60 backdrop-blur border-t border-[#D4AF37]/10">
          <div className="py-4 text-center border-r border-[#D4AF37]/10 last:border-r-0">
            <span className="text-[#D4AF37] text-2xl font-black block">{streak}</span>
            <span className="text-[8px] text-white/40 uppercase tracking-[0.25em] font-medium">STREAK</span>
          </div>
          <div className="py-4 text-center border-r border-[#D4AF37]/10 last:border-r-0">
            <span className="text-[#D4AF37] text-2xl font-black block">{balanceVal}</span>
            <span className="text-[8px] text-white/40 uppercase tracking-[0.25em] font-medium">BALANCE</span>
          </div>
          <div className="py-4 text-center border-r border-[#D4AF37]/10 last:border-r-0">
            <span className="text-[#D4AF37] text-2xl font-black block">{badgesCount}</span>
            <span className="text-[8px] text-white/40 uppercase tracking-[0.25em] font-medium">BADGES</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE ASCENSION PATH — FLOATING GLASS CARDS */}
      <div className="px-6 space-y-4 mt-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-[#D4AF37] text-lg font-black">{tier.name}</h3><p className="text-[8px] text-white/30 tracking-widest">{tier.tagline}</p></div>
              <span className="font-bold">{tier.price}</span>
            </div>
            <ul className="space-y-2">
              {tier.features.map((f) => <li key={f} className="text-white/60 text-[10px]">• {f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* SQI 2050: Nadi Restoration & Space Compression */}
      <section className="mt-12 px-6">
        <div className="glass-card p-6 bg-white/[0.02] border border-white/5 rounded-[40px] backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                <span className="text-[#D4AF37] text-xl">📜</span>
              </div>
              <div>
                <h3 className="text-white text-lg font-black tracking-tighter uppercase">Your Life Reading</h3>
                <p className="text-[#D4AF37] text-[7px] font-black tracking-[0.4em] uppercase opacity-60">Siddha Insights</p>
              </div>
            </div>
            <button type="button" className="text-[8px] font-black tracking-widest text-white/20 uppercase border border-white/10 px-3 py-1 rounded-full">Expand All</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5 mb-6">
            {['Children', 'Healing', 'Past Lives', 'Future', 'Nadi'].map((cat) => (
              <span key={cat} className="px-4 py-2 rounded-xl bg-white/[0.03] text-[#D4AF37] text-[9px] font-bold whitespace-nowrap border border-white/5">
                {cat}
              </span>
            ))}
          </div>
          <div className="space-y-4">
            {[
              { title: 'Samadhi Stabilization', subtitle: 'Uddevalla School Mission', date: '04/03/2026' },
              { title: 'Activation of Youth Codes', subtitle: 'Bio-Signature Recalibration', date: '05/03/2026' },
            ].map((nadi, i) => (
              <div key={i} className="relative pl-6 border-l border-[#D4AF37]/20 py-1">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
                <div className="flex justify-between items-start">
                  <h4 className="text-white text-xs font-bold">{nadi.title}</h4>
                  <span className="text-white/20 text-[7px] font-mono">{nadi.date}</span>
                </div>
                <p className="text-white/40 text-[9px] mt-1 italic">{nadi.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
