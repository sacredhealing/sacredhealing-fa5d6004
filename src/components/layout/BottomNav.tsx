import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import MerkabaIcon from '@/components/icons/MerkabaIcon';
import ThirdEyeIcon from '@/components/icons/ThirdEyeIcon';
import MalaBeadsIcon from '@/components/icons/MalaBeadsIcon';
import PalmLeafIcon from '@/components/icons/PalmLeafIcon';
import StarPentagramIcon from '@/components/icons/StarPentagramIcon';
import AtmaIcon from '@/components/icons/AtmaIcon';

/** SQI tab names — fixed English; not driven by i18n so profile language never changes this bar. */
const NAV_ITEMS = [
  { to: '/dashboard', icon: MerkabaIcon, label: 'Nexus' },
  { to: '/meditations', icon: ThirdEyeIcon, label: 'Dhyana' },
  { to: '/mantras', icon: MalaBeadsIcon, label: 'Nada' },
  { to: '/explore', icon: PalmLeafIcon, label: 'Akasha' },
  { to: '/healing', icon: StarPentagramIcon, label: 'Soma' },
  { to: '/profile', icon: AtmaIcon, label: 'Avatar' },
] as const;

function BottomNavInner() {
  return (
    <nav
      lang="en"
      translate="no"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.05] safe-area-bottom"
      style={{ background: 'rgba(5, 5, 5, 0.92)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
      aria-label="Main navigation"
    >
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
                'flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all duration-300 min-w-0 w-full overflow-hidden',
                isActive
                  ? 'text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                  : 'text-white/[0.45] hover:text-[#D4AF37]/70 active:text-[#D4AF37]/70'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="shrink-0 flex items-center justify-center relative">
                  <item.icon
                    className={cn(
                      item.to === '/dashboard'
                        ? 'w-6 h-6 md:w-5 md:h-5 transition-all duration-300'
                        : 'w-5 h-5 transition-all duration-300',
                      isActive && 'drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                    )}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#D4AF37]" style={{ boxShadow: '0 0 6px rgba(212,175,55,0.8)' }} />
                  )}
                </div>
                <span
                  className="text-center block w-full min-w-0 px-0.5"
                  style={{
                    fontSize: '10px',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: isActive ? 900 : 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    textShadow: isActive ? '0 0 8px rgba(212,175,55,0.4)' : 'none',
                  }}
                  title={item.label}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Memoized: does not subscribe to i18n; `lang="en"` keeps typography stable vs document locale. */
export const BottomNav = React.memo(BottomNavInner);
