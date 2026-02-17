import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';

/**
 * True if user can access Stargate Community: 
 * - Admin (always has access)
 * - Has active Stargate subscription (NOT regular premium)
 * - Was manually added to stargate_community_members by admin
 */
export const useStargateAccess = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [hasStargateSubscription, setHasStargateSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setIsManualAdd(false);
      setHasStargateSubscription(false);
      setLoading(false);
      return;
    }

    // Check if manually added by admin
    const { data: manualMember, error: manualError } = await supabase
      .from('stargate_community_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Table may not exist if migration not run (e.g. Supabase only via Lovable)
    if (manualError && !manualError.message?.includes('does not exist')) {
      console.warn('Error checking manual Stargate membership:', manualError);
    }
    
    setIsManualAdd(!!manualMember);

    // Check for active Stargate subscription via Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { data, error: subError } = await supabase.functions.invoke('check-stargate-membership', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!subError && data) {
          setHasStargateSubscription(data.hasStargateMembership === true);
        } else {
          console.warn('Error checking Stargate subscription:', subError);
          setHasStargateSubscription(false);
        }
      }
    } catch (err) {
      console.warn('Error invoking Stargate membership check:', err);
      setHasStargateSubscription(false);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  // Access granted if: admin OR has Stargate subscription OR manually added
  // NOTE: Regular premium members (tier !== 'stargate') do NOT get access
  const isStargateMember = isAdmin || hasStargateSubscription || isManualAdd;

  return { isStargateMember, loading };
};
