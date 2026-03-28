import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { STORAGE_KEY_RETURN_FROM_SESSION } from '@/hooks/useDashboardAutostart';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { BackButton, BACK_BUTTON_HIDE_PATHS } from './BackButton';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NowPlayingBar } from '@/components/music/NowPlayingBar';

const pageVariants = {
  initial: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0.7,
    y: -4,
    filter: 'blur(2px)',
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.2,
};

const SESSION_ROUTES = ['/ritual', '/breathing', '/meditations', '/journal'];

function isSessionRoute(pathname: string): boolean {
  if (SESSION_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith('/paths/')) return true;
  return false;
}

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const showBackButton = !BACK_BUTTON_HIDE_PATHS.includes(location.pathname);
  const isVastuRoute = location.pathname === '/vastu';

  useEffect(() => {
    if (isSessionRoute(location.pathname)) {
      sessionStorage.setItem(STORAGE_KEY_RETURN_FROM_SESSION, '1');
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative">
      {/* SQI 2050 — Akasha-Black #050505 with subtle golden radial */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          background: "radial-gradient(ellipse at 15% 20%, rgba(212, 175, 55, 0.03) 0%, transparent 50%), #050505",
        }}
      />
      
      {/* SQI 2050 — Siddha-Gold ambient glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.04) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </div>
      
      {/* Header bar with back button - reserves top space, content stays full width (including /vastu so users can leave) */}
      {showBackButton ? (
        <header className="fixed top-0 left-0 right-0 h-14 z-[100] flex items-center px-4 border-b border-white/[0.05]" style={{ background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}>
          <BackButton variant="inline" />
        </header>
      ) : null}
      
      {/* Page content with fade transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className={`relative overflow-x-hidden w-full max-w-none ${showBackButton ? 'pt-14' : ''} ${isVastuRoute ? 'min-w-full h-[100svh] min-h-0 overflow-hidden pb-0' : location.pathname === '/community' ? 'min-w-full h-[calc(100vh-64px)] min-h-[280px] overflow-hidden pb-0' : location.pathname === '/digital-nadi' || location.pathname === '/atmospheric-clearance-engine' || location.pathname === '/wealth-beacon' ? 'pb-[10.5rem]' : 'pb-28'}`}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <NowPlayingBar />
      {!isVastuRoute && <BottomNav />}
      <AnnouncementPopup />
      <PWAInstallPrompt />
    </div>
  );
};
