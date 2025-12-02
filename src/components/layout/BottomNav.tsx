import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Play, Music2, User, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const getNavItems = (t: (key: string) => string) => [
  { to: '/dashboard', icon: Home, label: t('nav.home') },
  { to: '/meditations', icon: Play, label: t('nav.meditate') },
  { to: '/community', icon: Users, label: t('nav.community') },
  { to: '/healing', icon: Sparkles, label: t('nav.healing') },
  { to: '/profile', icon: User, label: t('nav.profile') },
];

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const navItems = getNavItems(t);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={22}
                  className={cn(
                    'transition-all duration-300',
                    isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]'
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
