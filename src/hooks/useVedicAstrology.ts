import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';

export interface VedicAstrologyTier {
  id: string;
  tier_level: 'basic' | 'premium' | 'master';
  name: string;
  description: string;
  membership_required: string[];
  features: string[];
  workspace_url: string | null;
  is_active: boolean;
  order_index: number;
}

export interface UserVedicAccess {
  tier_level: 'basic' | 'premium' | 'master';
  granted_at: string;
  expires_at: string | null;
  granted_via_membership: boolean;
}

export const useVedicAstrology = () => {
  const { user } = useAuth();
  const { tier: membershipTier } = useMembership();
  const [tiers, setTiers] = useState<VedicAstrologyTier[]>([]);
  const [userAccess, setUserAccess] = useState<UserVedicAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTiers = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vedic_astrology_tiers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const formattedTiers: VedicAstrologyTier[] = (data || []).map(tier => ({
        ...tier,
        features: (tier.features as any) || [],
      }));

      setTiers(formattedTiers);
    } catch (error) {
      console.error('Error fetching Vedic astrology tiers:', error);
      setTiers([]);
    }
  }, []);

  const fetchUserAccess = useCallback(async () => {
    if (!user) {
      setUserAccess([]);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('user_vedic_astrology_access')
        .select('tier_level, granted_at, expires_at, granted_via_membership')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAccess((data as UserVedicAccess[]) || []);
    } catch (error) {
      console.error('Error fetching user Vedic astrology access:', error);
      setUserAccess([]);
    }
  }, [user]);

  const hasAccess = useCallback((tierLevel: 'basic' | 'premium' | 'master'): boolean => {
    if (!user) return false;

    // Check explicit access
    const access = userAccess.find(a => a.tier_level === tierLevel);
    if (access) {
      // Check if expired
      if (access.expires_at && new Date(access.expires_at) < new Date()) {
        return false;
      }
      return true;
    }

    // Check membership-based eligibility
    const tier = tiers.find(t => t.tier_level === tierLevel);
    if (!tier) return false;

    // Map membership tier to eligibility
    const membershipEligibility: Record<string, string[]> = {
      'free': ['basic'],
      'premium-monthly': ['basic', 'premium'],
      'premium-annual': ['basic', 'premium'],
      'lifetime': ['basic', 'premium', 'master'],
    };

    const eligibleTiers = membershipEligibility[membershipTier || 'free'] || [];
    return eligibleTiers.includes(tierLevel);
  }, [user, userAccess, tiers, membershipTier]);

  const getHighestAccessLevel = useCallback((): 'basic' | 'premium' | 'master' | null => {
    if (hasAccess('master')) return 'master';
    if (hasAccess('premium')) return 'premium';
    if (hasAccess('basic')) return 'basic';
    return null;
  }, [hasAccess]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTiers(), fetchUserAccess()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchTiers, fetchUserAccess]);

  return {
    tiers,
    userAccess,
    isLoading,
    hasAccess,
    getHighestAccessLevel,
    refetch: () => Promise.all([fetchTiers(), fetchUserAccess()]),
  };
};

