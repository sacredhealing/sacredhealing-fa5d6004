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


const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_VERSION = 'v4'; // bumped — schema cache bypass


function getCacheKey(userId: string) {
  return `sh:membership:${CACHE_VERSION}:${userId}`;
}


function loadFromCache(userId: string): MembershipStatus | null {
  try {
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
    // ignore
  }
}


export const useMembership = () => {
  const { user, isLoading: authLoading } = useAuth();
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
      const [adminRes, membershipRes] = await Promise.all([
        supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        }),
        supabase
          .from('user_memberships')
          .select('tier_id, status, expires_at, membership_tiers(slug, name)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const isAdmin = adminRes.data === true;
      const membershipRow = membershipRes.data as any;
      const tierSlug = membershipRow?.membership_tiers?.slug ?? 'free';
      const expiresAt = membershipRow?.expires_at ?? null;

      // Also check admin_granted_access as fallback
      const { data: grant } = await supabase
        .from('admin_granted_access')
        .select('tier, access_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('access_type', 'membership')
        .order('granted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const grantTier = (grant as any)?.tier || (grant as any)?.access_id || null;
      const bestTier = isAdmin
        ? 'akasha-infinity'
        : [tierSlug, grantTier || 'free'].sort((a: string, b: string) => getTierRank(b) - getTierRank(a))[0];

      const next: MembershipStatus = {
        subscribed: isAdmin || !!membershipRow || !!grantTier,
        tier: bestTier,
        subscriptionEnd: expiresAt,
        loading: false,
        adminGranted: !!grantTier,
        isAdmin,
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
