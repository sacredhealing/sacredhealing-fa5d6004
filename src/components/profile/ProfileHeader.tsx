// @ts-nocheck
import React from 'react';
import { Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export interface ProfileHeaderProps {
  userName: string;
  profile: { avatar_url?: string; bio?: string } | null;
  balance: number;
  streakDays: number;
  badgeCount: number;
  onEditProfile: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName,
  profile,
  balance,
  streakDays,
  badgeCount,
  onEditProfile,
}) => (
  <div className="profile-card rounded-[28px] border border-[#D4AF37]/20 bg-white/[0.02] backdrop-blur-[40px] p-12 pt-12 pb-9 text-center mb-8">
    <div className="relative inline-block mb-6">
      <Avatar className="w-24 h-24 rounded-full border-2 border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-white/5 text-3xl text-white">
          {userName?.charAt(0) || '🧘'}
        </AvatarFallback>
      </Avatar>
      <button
        onClick={onEditProfile}
        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#050505] hover:bg-[#D4AF37]/90 transition-colors border-2 border-[#050505] shadow-lg"
      >
        <Pencil size={12} />
      </button>
    </div>
    <h1 className="text-white leading-tight font-[style:italic]" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontStyle: 'italic', fontSize: '2.2rem' }}>{userName}</h1>
    <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
      <span className="text-[#D4AF37]/70 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em' }}>528Hz</span>
      <span className="text-[#D4AF37]/40">·</span>
      <span className="text-[#D4AF37]/70 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em' }}>Rahu Active</span>
    </div>
    {profile?.bio && (
      <p className="mt-3 text-[0.95rem] text-white/40 italic max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{profile.bio}</p>
    )}
    <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-full border border-[#D4AF37]/20 bg-white/[0.02] px-5 py-2">
      <span className="text-white/30 text-[7px] font-extrabold tracking-widest uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>SHC BALANCE</span>
      <span className="text-[#D4AF37] text-lg font-extrabold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        <AnimatedCounter value={balance} /> SHC
      </span>
    </div>
    <div className="flex justify-center gap-4 mt-6">
      <div className="rounded-full border border-[#D4AF37]/10 bg-white/[0.02] px-5 py-2.5 min-w-[80px]">
        <span className="block" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: '#D4AF37', fontSize: '1.3rem' }}>{streakDays}</span>
        <span className="uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '7px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)' }}>STREAK</span>
      </div>
      <div className="rounded-full border border-[#D4AF37]/10 bg-white/[0.02] px-5 py-2.5 min-w-[80px]">
        <span className="block" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: '#D4AF37', fontSize: '1.3rem' }}>{balance}</span>
        <span className="uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '7px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)' }}>SESSIONS</span>
      </div>
      <div className="rounded-full border border-[#D4AF37]/10 bg-white/[0.02] px-5 py-2.5 min-w-[80px]">
        <span className="block" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: '#D4AF37', fontSize: '1.3rem' }}>{badgeCount}</span>
        <span className="uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '7px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)' }}>LEVEL</span>
      </div>
    </div>
  </div>
);
