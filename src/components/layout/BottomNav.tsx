import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Play, Music2, Users, Sparkles, Compass, User, Sparkles as MantraIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

// Simplified Navigation: Clearly labeled icons (Stordalen/Robbins Hospitality)
const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, labelKey: 'nav_home', label: 'Home' },
  { to: '/meditations', icon: Play, labelKey: 'nav_meditations', label: 'Meditations' },
  { to: '/mantras', icon: MantraIcon, labelKey: 'nav_mantras', label: 'Mantras' }, // Temple icon for Mantras
  { to: '/music', icon: Music2, labelKey: 'nav_music', label: 'Music' },
  { to: '/healing', icon: Sparkles, labelKey: 'header_healing', label: 'Healing' },
  { to: '/explore', icon: Compass, labelKey: 'nav_explore', label: 'Explore' },
  { to: '/community', icon: Users, labelKey: 'nav_community', label: 'Community' },
  { to: '/profile', icon: User, labelKey: 'nav_profile', label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div 
        className="grid grid-cols-7 w-full px-1 py-1"
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
                  ? 'text-primary'
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
