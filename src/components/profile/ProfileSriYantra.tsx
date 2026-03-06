// @ts-nocheck
import React from 'react';

export const ProfileSriYantra: React.FC = () => (
  <div className="profile-card rounded-[28px] border border-[#D4AF37]/12 bg-white/[0.02] backdrop-blur-xl p-8 flex flex-col items-center justify-center mb-8">
    <div className="relative flex items-center justify-center w-[280px] h-[280px]">
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)', animation: 'siddhiSpin 20s ease-in-out infinite' }} />
      <svg className="w-full h-full" width="280" height="280" viewBox="0 0 280 280" fill="none" style={{ animation: 'siddhiSpin 150s linear infinite' }}>
        <circle cx="140" cy="140" r="135" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
        <circle cx="140" cy="140" r="125" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" />
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 22.5) * Math.PI / 180;
          const x = 140 + 118 * Math.cos(angle);
          const y = 140 + 118 * Math.sin(angle);
          const x2 = 140 + 118 * Math.cos(angle + 0.2);
          const y2 = 140 + 118 * Math.sin(angle + 0.2);
          return <path key={i} d={`M140 140 Q${x} ${y} ${x2} ${y2} Z`} stroke="#D4AF37" strokeWidth="0.6" fill="rgba(212,175,55,0.04)" opacity="0.7" />;
        })}
        <polygon points="140,30 242,198 38,198" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
        <polygon points="140,250 242,82 38,82" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.95" />
        <polygon points="140,55 222,183 58,183" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
        <polygon points="140,225 222,97 58,97" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.7" />
        <polygon points="140,82 202,168 78,168" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
        <polygon points="140,198 202,112 78,112" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.6" />
        <polygon points="140,105 186,155 94,155" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
        <polygon points="140,175 186,125 94,125" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5" />
        <circle cx="140" cy="140" r="55" stroke="#D4AF37" strokeWidth="0.6" opacity="0.4" />
        <circle cx="140" cy="140" r="35" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
        <circle cx="140" cy="140" r="18" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
        <circle cx="140" cy="140" r="4" fill="#D4AF37" opacity="0.9" />
        <circle cx="140" cy="140" r="8" fill="rgba(212,175,55,0.2)" opacity="0.8" />
      </svg>
      <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#D4AF37', opacity: 0.3, animation: 'glowBreathe 2s ease-in-out infinite', filter: 'blur(8px)' }} />
    </div>
    <p className="mt-6 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em', color: 'rgba(212,175,55,0.6)' }}>◈ AKASHIC FIELD ACTIVE · 72,000 NADIS MAPPED</p>
  </div>
);
