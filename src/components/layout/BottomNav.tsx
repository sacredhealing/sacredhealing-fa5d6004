import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Play, Music2, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/meditations', icon: Play, label: 'Meditate' },
  { to: '/music', icon: Music2, label: 'Music' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
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
