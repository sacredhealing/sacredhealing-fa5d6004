import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

/**
 * True if user can access Stargate Community: has Stargate membership tier
 * or was manually added to stargate_community_members.
 */
export const useStargateAccess = () => {
  const { user } = useAuth();
  const { tier, isAdmin } = useMembership();
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!user) {
      setIsManualAdd(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('stargate_community_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    // Table may not exist if migration not run (e.g. Supabase only via Lovable)
    if (error) {
      setIsManualAdd(false);
      setLoading(false);
      return;
    }
    setIsManualAdd(!!data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  const isStargateMember = isAdmin || tier === 'stargate' || isManualAdd;

  return { isStargateMember, loading };
};
