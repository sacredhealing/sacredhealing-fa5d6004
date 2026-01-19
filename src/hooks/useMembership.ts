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

export const useMembership = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<MembershipStatus>({
    subscribed: false,
    tier: 'free',
    subscriptionEnd: null,
    loading: true,
    adminGranted: false,
    isAdmin: false,
  });

  const checkSubscription = useCallback(async () => {
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

    try {
      // First check if user is admin - admins get full access
      const { data: isAdminData } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (isAdminData === true) {
        setStatus({
          subscribed: true,
          tier: 'lifetime',
          subscriptionEnd: null,
          loading: false,
          adminGranted: true,
          isAdmin: true,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-membership-subscription');
      
      if (error) {
        console.error('Error checking membership:', error);
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      setStatus({
        subscribed: data.subscribed,
        tier: data.tier || 'free',
        subscriptionEnd: data.subscription_end,
        loading: false,
        adminGranted: data.admin_granted || false,
        isAdmin: false,
      });
    } catch (error) {
      console.error('Error checking membership:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription status periodically (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const isPremium = status.isAdmin || (status.tier !== 'free' && status.subscribed);

  return {
    ...status,
    isPremium,
    refresh: checkSubscription,
  };
};
