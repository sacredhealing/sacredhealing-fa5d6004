import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>
      
      <main className="relative pb-24">
        <Outlet />
      </main>
      
      <BottomNav />
      <AnnouncementPopup />
      <PWAInstallPrompt />
    </div>
  );
};
