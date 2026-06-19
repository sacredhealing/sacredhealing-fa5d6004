import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const publicPaths = ['/meditations', '/music', '/healing', '/membership'];
  const isPublicPath = publicPaths.includes(location.pathname);

  // While auth initialises, show spinner — never redirect during this window
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isPublicPath) return <Outlet />;
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Onboarding check removed from route — it was making an extra Supabase call
  // on every protected page load, adding 500-2000ms of blocking latency.
  // Onboarding redirect is handled inside the Dashboard component itself.
  return <Outlet />;
};
