import { useState, useEffect, useCallback, useRef } from 'react';
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


  const getInitialStatus = (): MembershipStatus => {
    if (user) {
      const cached = loadFromCache(user.id);
      if (cached) return { ...cached, loading: false };
    }
    return {
      subscribed: false,
