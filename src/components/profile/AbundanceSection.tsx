// @ts-nocheck
import React from 'react';
import { Bell, Moon, Shield, Settings, LogOut, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AbundanceItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export interface AbundanceSectionProps {
  onNotificationsOpen: () => void;
  onAppearanceOpen: () => void;
  onPrivacyOpen: () => void;
  onSettingsOpen: () => void;
  onProfileEditOpen: () => void;
  abundanceLineage: AbundanceItem[];
  theCovenant: AbundanceItem[];
  onSignOut: () => void;
}

export const AbundanceSection: React.FC<AbundanceSectionProps> = ({
  onNotificationsOpen,
  onAppearanceOpen,
  onPrivacyOpen,
  onSettingsOpen,
  onProfileEditOpen,
  abundanceLineage,
  theCovenant,
  onSignOut,
}) => (
  <div className="profile-card flex flex-wrap items-center justify-center gap-6 mb-8">
    <button type="button" onClick={onNotificationsOpen} className="flex flex-col items-center gap-2 group">
      <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
        <Bell size={20} />
      </div>
      <span className="text-white/20 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>Alerts</span>
    </button>
    <button type="button" onClick={onAppearanceOpen} className="flex flex-col items-center gap-2 group">
      <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
        <Moon size={20} />
      </div>
      <span className="text-white/20 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>Theme</span>
    </button>
    <button type="button" onClick={onPrivacyOpen} className="flex flex-col items-center gap-2 group">
      <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
        <Shield size={20} />
      </div>
      <span className="text-white/20 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>Privacy</span>
    </button>
    <button type="button" onClick={onSettingsOpen} className="flex flex-col items-center gap-2 group">
      <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
        <Settings size={20} />
      </div>
      <span className="text-white/20 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>Settings</span>
    </button>
    <button type="button" onClick={onProfileEditOpen} className="flex flex-col items-center gap-2 group">
      <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
        <Pencil size={20} />
      </div>
      <span className="text-white/20 uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>Profile</span>
    </button>
    {abundanceLineage.map((item) => (
      <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-2 group">
        <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
          <item.icon size={20} />
        </div>
        <span className="text-white/20 uppercase max-w-[60px] truncate" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>{item.label}</span>
      </button>
    ))}
    {theCovenant.map((item) => (
      <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-2 group">
        <div className="w-12 h-12 rounded-full border border-[#D4AF37]/10 bg-white/[0.02] flex items-center justify-center text-white/40 group-hover:text-[#D4AF37] transition-colors">
          <item.icon size={20} />
        </div>
        <span className="text-white/20 uppercase max-w-[60px] truncate" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '8px', letterSpacing: '0.2em' }}>{item.label}</span>
      </button>
    ))}
    <button type="button" onClick={onSignOut} className="flex flex-col items-center gap-2 text-white/30 hover:text-red-500/60 transition-colors">
      <LogOut size={20} />
      <span className="text-[8px] font-extrabold tracking-widest" style={{ fontFamily: 'Montserrat, sans-serif' }}>Sign Out</span>
    </button>
  </div>
);
