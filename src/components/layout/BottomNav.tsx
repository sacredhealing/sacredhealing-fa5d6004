import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import TempleGateIcon from '@/components/icons/TempleGateIcon';
import ThirdEyeIcon from '@/components/icons/ThirdEyeIcon';
import MalaBeadsIcon from '@/components/icons/MalaBeadsIcon';
import PalmLeafIcon from '@/components/icons/PalmLeafIcon';
import AlchemicalStarIcon from '@/components/icons/AlchemicalStarIcon';
import AtmaIcon from '@/components/icons/AtmaIcon';

const NAV_ITEMS = [
  { to: '/dashboard', icon: TempleGateIcon, labelKey: 'nav_home', label: 'Home' },
  { to: '/meditations', icon: ThirdEyeIcon, labelKey: 'nav_meditate', label: 'Meditate' },
  { to: '/mantras', icon: MalaBeadsIcon, labelKey: 'nav_mantras', label: 'Mantras' },
  { to: '/explore', icon: PalmLeafIcon, labelKey: 'nav_library', label: 'Library' },
  { to: '/healing', icon: AlchemicalStarIcon, labelKey: 'header_healing', label: 'Healing' },
  { to: '/profile', icon: AtmaIcon, labelKey: 'nav_profile', label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D1A]/95 backdrop-blur-xl border-t border-[#D4AF37]/10 safe-area-bottom">
      <div
        className="grid grid-cols-6 w-full px-0 py-1 gap-0"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                  : 'text-[#6B5F50] hover:text-[#D4AF37]/80 active:text-[#D4AF37]/80'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-all duration-200',
                    isActive && 'drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]'
                  )}
                />
                <span className="text-[11px] font-medium leading-tight" style={{ fontSize: '0.75rem' }}>
                  {t(item.labelKey, item.label)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
