import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { STORAGE_KEY_RETURN_FROM_SESSION } from '@/hooks/useDashboardAutostart';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { BackButton, BACK_BUTTON_HIDE_PATHS } from './BackButton';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NowPlayingBar } from '@/components/music/NowPlayingBar';
import { AppDisclaimer } from '@/components/AppDisclaimer';

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

  useEffect(() => {
    if (isSessionRoute(location.pathname)) {
      sessionStorage.setItem(STORAGE_KEY_RETURN_FROM_SESSION, '1');
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative">
      {/* Pure Midnight #030303 with Deep Indigo #1e1b4b radial in top-left */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          background: "radial-gradient(ellipse at 15% 20%, rgba(30, 27, 75, 0.7) 0%, transparent 50%), #030303",
        }}
      />
      
      {/* Animated ambient glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(271 76% 53% / 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(174 72% 56% / 0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(51 100% 50% / 0.08) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </div>
      
      {/* Header bar with back button - reserves top space, content stays full width */}
      {showBackButton ? (
        <header className="fixed top-0 left-0 right-0 h-14 z-[100] flex items-center px-4 bg-background/80 backdrop-blur-sm border-b border-border/20">
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
          className={`relative pb-28 overflow-x-hidden ${showBackButton ? 'pt-14' : ''}`}
        >
          <Outlet />
          <AppDisclaimer />
        </motion.main>
      </AnimatePresence>
      <NowPlayingBar />
      <BottomNav />
      <AnnouncementPopup />
      <PWAInstallPrompt />
    </div>
  );
};
