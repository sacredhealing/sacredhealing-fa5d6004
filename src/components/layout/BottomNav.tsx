import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Play, Music2, User, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const getNavItems = (t: (key: string) => string) => [
  { to: '/dashboard', icon: Home, label: t('nav.home') },
  { to: '/meditations', icon: Play, label: t('nav.meditate') },
  { to: '/music', icon: Music2, label: t('nav.music') },
  { to: '/healing', icon: Sparkles, label: t('nav.healing') },
  { to: '/community', icon: Users, label: t('nav.community') },
  { to: '/profile', icon: User, label: t('nav.profile') },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const navItems = getNavItems(t);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-2 py-1.5 sm:py-2 sm:px-4 w-full max-w-2xl mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-1.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-300 flex-1 min-w-0',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 sm:w-[22px] sm:h-[22px] transition-all duration-300 shrink-0',
                    isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]'
                  )}
                />
                <span className="text-[10px] sm:text-xs font-medium truncate max-w-full">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
