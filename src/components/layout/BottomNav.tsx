import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Play, Music2, Users, Sparkles, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

const getNavItems = (t: (key: string) => string) => [
  { to: '/dashboard', icon: Home, label: t('nav.home') },
  { to: '/explore', icon: Compass, label: t('dashboard.explore') },
  { to: '/meditations', icon: Play, label: t('nav.meditate') },
  { to: '/music', icon: Music2, label: t('nav.music') },
  { to: '/healing', icon: Sparkles, label: t('nav.healing') },
  { to: '/community', icon: Users, label: t('nav.community') },
];

const NAV_LABELS: Record<string, string> = {
  '/dashboard': 'Home',
  '/explore': 'Explore',
  '/meditations': 'Meditate',
  '/music': 'Music',
  '/healing': 'Healing',
  '/community': 'Community',
};

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const navItems = getNavItems(t);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div 
        className="grid grid-cols-6 w-full px-1 py-1"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => (
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
                <span className="text-[9px] xs:text-[10px] font-medium leading-tight">
                  {NAV_LABELS[item.to] || item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
