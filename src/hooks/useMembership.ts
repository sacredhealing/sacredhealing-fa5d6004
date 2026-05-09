import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getTierRank } from '@/lib/tierAccess';


interface MembershipStatus {
  subscribed: boolean;
  tier: string;
  subscriptionEnd: string | null;
  loading: boolean;
  adminGranted?: boolean;
  isAdmin?: boolean;
}


const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes — cost optimisation (was 5 min)
// Bump this version whenever tier slugs / canonical mapping change so old cached
// values (e.g. "siddha-quantum-monthly", "premium-monthly", "lifetime") are discarded.
const CACHE_VERSION = 'v3';


function getCacheKey(userId: string) {
  return `sh:membership:${CACHE_VERSION}:${userId}`;
}


function loadFromCache(userId: string): MembershipStatus | null {
  try {
    // Clean up any older cache versions so paid users never see stale "free".
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('sh:membership:') && !k.startsWith(`sh:membership:${CACHE_VERSION}:`)) {
        localStorage.removeItem(k);
      }
    });
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
  // Whether we've completed at least one fresh server check this mount
  const [settled, setSettled] = useState(false);
  const [status, setStatus] = useState<MembershipStatus>(() => ({
    subscribed: false,
    tier: 'free',
    subscriptionEnd: null,
    loading: true,
    adminGranted: false,
    isAdmin: false,
  }));
  const mountedRef = useRef(true);


  const getInitialStatus = (): MembershipStatus => {
    if (user) {
      const cached = loadFromCache(user.id);
      if (cached) return { ...cached, loading: false };
    }
    return {
      subscribed: false,
      tier: 'free',
      subscriptionEnd: null,
      loading: false,
      adminGranted: false,
      isAdmin: false,
    };
  };

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus({
        subscribed: false,
        tier: 'free',
        subscriptionEnd: null,
        loading: authLoading,
        adminGranted: false,
        isAdmin: false,
      });
      setSettled(!authLoading);
      return;
    }

    const initial = getInitialStatus();
    setStatus({ ...initial, loading: true });
    setSettled(false);

    try {
      const [{ data: isAdmin }, { data: grant }, { data, error }] = await Promise.all([
        supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
        supabase
          .from('admin_granted_access')
          .select('tier, access_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('access_type', 'membership')
          .order('granted_at', { ascending: false })
          .limit(5),
        supabase.functions.invoke('check-membership-subscription'),
      ]);

      const grantRows = Array.isArray(grant) ? grant : [];
      const grantTier = grantRows
        .map((row: any) => row.tier || row.access_id || 'free')
        .sort((a: string, b: string) => getTierRank(b) - getTierRank(a))[0];

      const cloudTier = !error && data?.tier ? String(data.tier) : 'free';
      const bestTier = [cloudTier, grantTier || 'free'].sort((a, b) => getTierRank(b) - getTierRank(a))[0];
      const next: MembershipStatus = {
        subscribed: Boolean(data?.subscribed) || !!grantTier || isAdmin === true,
        tier: isAdmin === true ? 'akasha-infinity' : bestTier,
        subscriptionEnd: data?.subscription_end ?? data?.subscriptionEnd ?? null,
        loading: false,
        adminGranted: !!grantTier,
        isAdmin: isAdmin === true,
      };

      if (!mountedRef.current) return;
      saveToCache(user.id, next);
      setStatus(next);
    } catch (err) {
      console.warn('Membership check failed:', err);
      if (!mountedRef.current) return;
      setStatus({ ...initial, loading: false });
    } finally {
      if (mountedRef.current) setSettled(true);
    }
  }, [authLoading, user]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const tierRank = getTierRank(status.tier);

  return {
    ...status,
    loading: authLoading || status.loading,
    settled,
    isPremium: tierRank > 0 || status.isAdmin || status.adminGranted,
    refresh,
  };
};
