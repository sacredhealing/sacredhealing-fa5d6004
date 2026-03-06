// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface BadgeItem {
  id: number;
  emoji: string;
  titleKey: string;
  earned: boolean;
}

export interface VedicSiddhisProps {
  badges: BadgeItem[];
  isAndligCompleted: boolean;
}

export const VedicSiddhis: React.FC<VedicSiddhisProps> = ({ badges, isAndligCompleted }) => {
  const { t } = useTranslation();
  return (
    <div className="profile-card mb-8">
      <p className="uppercase mb-4" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.5em', color: 'rgba(212,175,55,0.6)' }}>◈ VEDIC SIDDHIS</p>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {badges.map((b) => (
          <div
            key={b.id}
            className="min-w-[140px] rounded-[20px] border bg-white/[0.02] p-5 py-5 flex flex-col items-center shrink-0"
            style={{ borderColor: b.earned ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}
          >
            <span className="text-[32px] mb-3 leading-none">{b.emoji}</span>
            <span
              className="text-[9px] font-bold tracking-wider text-center"
              style={{ fontFamily: 'Montserrat, sans-serif', color: b.earned ? 'white' : 'rgba(255,255,255,0.3)' }}
            >
              {t(b.titleKey)}
            </span>
            <div className="w-full h-1 rounded-full bg-white/10 mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-[#D4AF37] transition-all" style={{ width: b.earned ? '100%' : '0%' }} />
            </div>
          </div>
        ))}
        <div
          className="flex flex-col items-center min-w-[140px] rounded-[20px] border bg-white/[0.02] p-5 shrink-0"
          style={{ borderColor: isAndligCompleted ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}
        >
          <div className="relative w-12 h-12 flex items-center justify-center mb-3">
            <img
              src="/Andlig_Transformation_Seal.jpg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              alt="Andlig"
              className={`w-full h-full object-contain ${isAndligCompleted ? 'opacity-100' : 'opacity-30'}`}
            />
          </div>
          <span className="text-[9px] font-bold tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif', color: isAndligCompleted ? 'white' : 'rgba(255,255,255,0.3)' }}>Siddha Certified</span>
          <div className="w-full h-1 rounded-full bg-white/10 mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: isAndligCompleted ? '100%' : '0%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
