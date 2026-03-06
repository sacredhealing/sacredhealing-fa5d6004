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

      {/* SECTION 2: SRI YANTRA — from reference: glowing on stardust, stats pill overlay */}
      <section className="relative w-full flex flex-col items-center mt-4">
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          {/* Glow behind Yantra */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(212,175,55,0.12)_0%,_transparent_70%)] pointer-events-none" />
          <img
            src="/Gemini_Generated_Image_v8j3v8j3v8j3v8j3.png"
            alt="Siddha Sri Yantra"
            className="relative w-full h-full object-contain mix-blend-screen opacity-95"
            style={{
              maskImage: 'radial-gradient(circle, black 35%, transparent 88%)',
              WebkitMaskImage: 'radial-gradient(circle, black 35%, transparent 88%)',
              filter: 'drop-shadow(0 0 30px rgba(212,175,55,0.25))',
            }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg'; }}
          />
          {/* Stats banner: pill-shaped glass overlay on lower part of Yantra */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm backdrop-blur-3xl bg-white/[0.04] border border-white/10 rounded-[40px] py-6 flex justify-around items-center shadow-xl">
            <div className="text-center">
              <span className="text-[#D4AF37] text-2xl font-black block">{streak}</span>
              <span className="text-[8px] text-white/40 uppercase tracking-[0.25em] font-medium">STREAK</span>
            </div>
            <div className="text-center">
              <span className="text-[#D4AF37] text-2xl font-black block">{balanceVal}</span>
              <span className="text-[8px] text-white/40 uppercase tracking-[0.25em] font-medium">BALANCE</span>
            </div>
            <div className="text-center">
              <span className="text-[#D4AF37] text-2xl font-black block">{badgesCount}</span>
              <span className="text-[8px] text-white/40 uppercase tracking-[0.25em] font-medium">BADGES</span>
            </div>
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

      <ProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
    </div>
  );
};

export default Profile;
