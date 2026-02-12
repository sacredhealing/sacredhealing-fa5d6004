import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Play, Music2, Users, Sparkles, Compass, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, labelKey: 'nav.home' },
  { to: '/meditations', icon: Play, labelKey: 'nav.meditate' },
  { to: '/music', icon: Music2, labelKey: 'nav.music' },
  { to: '/healing', icon: Sparkles, labelKey: 'nav.soul' },
  { to: '/explore', icon: Compass, labelKey: 'nav.explore' },
  { to: '/community', icon: Users, labelKey: 'nav.community' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div 
        className="grid grid-cols-7 w-full px-1 py-1"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {NAV_ITEMS.map((item) => {
          // Special handling for Soul tab: active on /healing or /creative-soul routes
          const isActive = item.to === '/healing'
            ? location.pathname === '/healing' || location.pathname.startsWith('/creative-soul')
            : location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary))]'
                )}
              />
              <span className="text-[9px] xs:text-[10px] font-medium leading-tight">
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
