import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { BackButton } from './BackButton';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NowPlayingBar } from '@/components/music/NowPlayingBar';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    filter: 'blur(3px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(3px)',
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.35,
};

export const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen relative">
      {/* Deep Indigo to Midnight Blue gradient background - fixed and seamless */}
      <div 
        className="fixed inset-0 -z-20" 
        style={{
          background: 'linear-gradient(135deg, hsl(258 100% 8%) 0%, hsl(250 50% 15%) 50%, hsl(258 100% 8%) 100%)',
        }}
      />
      
      {/* Animated ambient glow orbs - enhanced with turquoise */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Large purple orb - top left */}
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(271 76% 53% / 0.18) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Turquoise orb - bottom right */}
        <motion.div
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(185 100% 50% / 0.15) 0%, transparent 65%)',
            filter: 'blur(70px)',
          }}
          animate={{
            x: [0, -35, 0],
            y: [0, -25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        
        {/* Gold orb - left center */}
        <motion.div
          className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(51 100% 50% / 0.08) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 25, 0],
            y: [0, -40, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />

        {/* Small turquoise accent - top right */}
        <motion.div
          className="absolute top-20 right-1/4 w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(185 100% 50% / 0.12) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />
      </div>
      
      {/* Universal back button */}
      <BackButton />
      
      {/* Page content with fade transitions */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="relative pb-24"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
      <NowPlayingBar />
      <BottomNav />
      <AnnouncementPopup />
      <PWAInstallPrompt />
    </div>
  );
};
