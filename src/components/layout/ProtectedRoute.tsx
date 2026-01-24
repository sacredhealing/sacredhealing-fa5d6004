import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const publicPaths = ['/meditations', '/music', '/healing', '/membership'];
  const isPublicPath = publicPaths.includes(location.pathname);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingCompleted(true); // Default to true on error to not block
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (isAuthenticated && user) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Allow marketing-style access to a small set of pages so membership banners
    // can remain visible (no redirect flicker).
    if (isPublicPath) return <Outlet />;
    return <Navigate to="/auth" replace />;
  }

  // Redirect to onboarding if not completed (unless already on onboarding page)
  if (onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};
