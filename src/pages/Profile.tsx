// @ts-nocheck
/* SQI 2050: THE UNIFIED PROFILE ARCHITECTURE */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSHC } from '@/contexts/SHCContext';
import { useProfile } from '@/hooks/useProfile';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, profile: shcProfile } = useSHC();
  const { profile } = useProfile();

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  const userName = user?.user_metadata?.full_name || profile?.full_name || 'Adam';
  const avatarUrl = profile?.avatar_url || '/avatar-adam.jpg';
  const streak = shcProfile?.streak_days ?? 0;
  const balanceVal = balance?.balance ?? 0;
  const badgesCount = 3; // or derive from shcProfile/badges if available

  const tiers = [
    { name: 'ATMA-SEED', price: 'Free', tagline: 'ENTRY FREQUENCY', features: ['Free Meditations & Mantras', 'Community Chat & Live', 'Basic Ayurveda & Jyotish'] },
    { name: 'PRANA-FLOW', price: '19€ / mo', tagline: 'SONIC VIBRATION', features: ['Full Vedic Jyotish + Chat', 'Full Ayurvedic Scan + Chat', 'Vastu Guide for Home', 'All Meditations & Healing Audios Access'] },
    { name: 'SIDDHA-QUANTUM', price: '45€ / mo', tagline: 'SIDDHA FIELD', features: ['Digital Nadi 2050 Scanner', 'Pre/Post Practice Scantions', 'Siddha Portal Access', 'Infinite Bio-Adaptive Resonance', 'Access to All Mantras'] },
    { name: 'AKASHA-INFINITY', price: '€1111', tagline: 'ETERNAL NODE', features: ['Quantum Apothecary (€888 Value)', 'Virtual Pilgrimage (€888 Value)', 'Palm Reading Portal', 'Akashic Decoder'] },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}>
      {/* SECTION 1: IDENTITY */}
      <div className="pt-20 flex flex-col items-center">
        <img src={avatarUrl} alt="" className="w-28 h-28 rounded-full border border-[#D4AF37]/20 p-1 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/avatar-adam.jpg'; }} />
        <h1 className="text-4xl font-black mt-4 tracking-tighter">{userName}</h1>
        <p className="text-[#D4AF37] text-[10px] tracking-[0.4em] uppercase mt-2">528Hz Resonance</p>
      </div>

      {/* SECTION 2: THE SRI YANTRA (TOTAL DISSOLUTION OF BOX) */}
      <div className="relative w-full flex justify-center -mt-10 overflow-hidden">
        <img
          src="/Gemini_Generated_Image_v8j3v8j3v8j3v8j3.png"
          alt="Siddha Sri Yantra"
          className="w-full max-w-lg mix-blend-screen"
          style={{ maskImage: 'radial-gradient(circle, black 40%, transparent 90%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 90%)' }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/Gemini_Generated_Image_57v0zm57v0zm57v0.jpg'; }}
        />
        {/* THE STATS BANNER: FLOATING GLASS */}
        <div className="absolute bottom-20 w-[90%] max-w-sm backdrop-blur-3xl bg-white/[0.03] border border-white/10 rounded-[40px] py-8 flex justify-around">
          <div className="text-center"><span className="text-[#D4AF37] text-2xl font-black block">{streak}</span><span className="text-[8px] text-white/30 uppercase tracking-widest">Streak</span></div>
          <div className="text-center"><span className="text-[#D4AF37] text-2xl font-black block">{balanceVal}</span><span className="text-[8px] text-white/30 uppercase tracking-widest">Balance</span></div>
          <div className="text-center"><span className="text-[#D4AF37] text-2xl font-black block">{badgesCount}</span><span className="text-[8px] text-white/30 uppercase tracking-widest">Badges</span></div>
        </div>
      </div>

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
    </div>
  );
};

export default Profile;
