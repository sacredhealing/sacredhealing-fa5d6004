import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';

/**
 * True if user can access Stargate Community:
 * - Admin (always has access)
 * - Has active Stargate subscription (NOT regular premium)
 * - Was manually added to stargate_community_members by admin
 * - Has active admin_granted_access row: program + access_id stargate, or access_type stargate
 */
export const useStargateAccess = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [hasAdminGrant, setHasAdminGrant] = useState(false);
  const [hasStargateSubscription, setHasStargateSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setIsManualAdd(false);
      setHasAdminGrant(false);
      setHasStargateSubscription(false);
      setLoading(false);
      return;
    }

    // Check if manually added by admin
    const { data: manualMember, error: manualError } = await (supabase as any)
      .from('stargate_community_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Table may not exist if migration not run (e.g. Supabase only via Lovable)
    if (manualError && !manualError.message?.includes('does not exist')) {
      console.warn('Error checking manual Stargate membership:', manualError);
    }
    
    setIsManualAdd(!!manualMember);

    // Admin Access Grant tab stores Stargate as program + access_id "stargate"
    let granted = false;
    try {
      const { data: progRow } = await supabase
        .from('admin_granted_access')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('access_type', 'program')
        .eq('access_id', 'stargate')
        .maybeSingle();
      const { data: typeRow } = await supabase
        .from('admin_granted_access')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('access_type', 'stargate')
        .maybeSingle();
      granted = !!(progRow || typeRow);
    } catch (e) {
      console.warn('Error checking admin Stargate grant:', e);
    }
    setHasAdminGrant(granted);

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

  // Access granted if: admin OR subscription OR manual table OR admin_granted_access Stargate row
  // NOTE: Regular premium members (tier !== 'stargate') do NOT get access
  const isStargateMember =
    isAdmin || hasStargateSubscription || isManualAdd || hasAdminGrant;

  return { isStargateMember, loading };
};
