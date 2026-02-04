import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppDisclaimer } from '@/components/AppDisclaimer';

export const AdminLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-background pb-20">
    <Outlet />
    <AppDisclaimer fixed position="screen" />
  </div>
);
