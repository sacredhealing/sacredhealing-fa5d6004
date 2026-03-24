import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MembershipStatus {
  subscribed: boolean;
  tier: string;
  subscriptionEnd: string | null;
  loading: boolean;
  adminGranted?: boolean;
  isAdmin?: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(userId: string) {
  return `sh:membership:${userId}`;
}

function loadFromCache(userId: string): MembershipStatus | null {
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(getCacheKey(userId));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveToCache(userId: string, data: MembershipStatus) {
  try {
    localStorage.setItem(
      getCacheKey(userId),
      JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS })
    );
  } catch {
    // ignore storage errors
  }
}

export const useMembership = () => {
  const { user, isLoading: authLoading } = useAuth();

  const getInitialStatus = (): MembershipStatus => {
    if (user) {
      const cached = loadFromCache(user.id);
      if (cached) return { ...cached, loading: false };
    }
    return {
      subscribed: false,
      tier: 'free',
      subscriptionEnd: null,
      loading: true,
      adminGranted: false,
      isAdmin: false,
    };
  };

  const [status, setStatus] = useState<MembershipStatus>(getInitialStatus);

  const checkSubscription = useCallback(async () => {
    // Stay loading while auth is still resolving
    if (authLoading) return;

    if (!user) {
      setStatus({
        subscribed: false,
        tier: 'free',
        subscriptionEnd: null,
        loading: false,
        adminGranted: false,
        isAdmin: false,
      });
      return;
    }

    // Serve from cache instantly if available
    const cached = loadFromCache(user.id);
    if (cached) {
      setStatus({ ...cached, loading: false });
      return;
    }

    try {
      // First check if user is admin - admins get full access
      const { data: isAdminData } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (isAdminData === true) {
        const adminStatus: MembershipStatus = {
          subscribed: true,
          tier: 'lifetime',
          subscriptionEnd: null,
          loading: false,
          adminGranted: true,
          isAdmin: true,
        };
        saveToCache(user.id, adminStatus);
        setStatus(adminStatus);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-membership-subscription');
      
      if (error) {
        console.error('Error checking membership:', error);
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const newStatus: MembershipStatus = {
        subscribed: data.subscribed,
        tier: data.tier || 'free',
        subscriptionEnd: data.subscription_end,
        loading: false,
        adminGranted: data.admin_granted || false,
        isAdmin: false,
      };
      saveToCache(user.id, newStatus);
      setStatus(newStatus);
    } catch (error) {
      console.error('Error checking membership:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user, authLoading]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription status periodically (every 60 seconds)
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, authLoading, checkSubscription]);

  const isPremium = status.isAdmin || (status.tier !== 'free' && status.subscribed);

  return {
    ...status,
    isPremium,
    refresh: checkSubscription,
  };
};
