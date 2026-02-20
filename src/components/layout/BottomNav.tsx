import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Compass, User, HandHeart, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// Bottom tabs: Home, Explore, Healing, Profile (Community & Music live inside Explore)
const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, labelKey: 'nav_home', label: 'Home' },
  { to: '/meditations', icon: Brain, labelKey: 'nav_meditate', label: 'Meditate' },
  { to: '/mantras', icon: HandHeart, labelKey: 'nav_mantras', label: 'Mantras' },
  { to: '/explore', icon: Compass, labelKey: 'nav_library', label: 'Library' },
  { to: '/healing', icon: Sparkles, labelKey: 'header_healing', label: 'Healing' },
  { to: '/profile', icon: User, labelKey: 'nav_profile', label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0a2e]/95 backdrop-blur-xl border-t border-amber-500/20 safe-area-bottom">
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
                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary))]'
                  )}
                />
                <span className="text-[11px] xs:text-[12px] font-medium leading-tight" style={{ fontSize: '0.75rem' }}>
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
