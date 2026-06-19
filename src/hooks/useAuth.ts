import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://ssygukfdbtehvtndandn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeWd1a2ZkYnRlaHZ0bmRhbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMxMDMsImV4cCI6MjA4MDE3OTEwM30.XXwg0F7kXR4-OFRu4A2RARfhbEXurwHp5HzMOMBAiy4';
const AUTH_STORAGE_KEY = 'sqi-2050-auth-token';

function readCachedSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const expiresAt = Number(session?.expires_at ?? 0);
    if (session?.access_token && session?.refresh_token && session?.user && expiresAt > Date.now() / 1000 + 60) {
      return session;
    }
  } catch {}
  return null;
}

async function getSession(): Promise<Session | null> {
  // 1. Try localStorage first — instant, no network
  const cached = readCachedSession();
  if (cached) return cached;

  // 2. Ask Supabase SDK — hard 5s cap
  try {
    const controller = new AbortController();
    const tid = window.setTimeout(() => controller.abort(), 5000);
    const { data: { session } } = await supabase.auth.getSession();
    window.clearTimeout(tid);
    if (session) {
      try { window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session)); } catch {}
    }
    return session;
  } catch {
    return null;
  }
}

async function ensureUserProfile(session: Session | null) {
  const user = session?.user;
  if (!user) return;
  try {
    await supabase.from('profiles').upsert(
      { user_id: user.id, full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? null, preferred_language: 'en' },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
  } catch {}
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const [safetyDone, setSafetyDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSafetyDone(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  const { data: session, isLoading: queryLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: getSession,
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    networkMode: 'always',
  });

  const isLoading = queryLoading && !safetyDone;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        try { window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession)); } catch {}
      }
      queryClient.setQueryData(['auth-user'], newSession);
      window.setTimeout(() => void ensureUserProfile(newSession), 0);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const user: User | null = session?.user ?? null;

  const signIn = async (email: string, password: string) => {
    // Single fast raw fetch — no SDK overhead, no retries, no service worker cache
    try {
      const controller = new AbortController();
      const tid = window.setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
      });

      window.clearTimeout(tid);
      const payload = await res.json();

      if (!res.ok || !payload?.access_token) {
        const msg = payload?.error_description || payload?.msg || payload?.message || payload?.error || 'Sign in failed.';
        return { data: { session: null, user: null }, error: new Error(msg) };
      }

      const newSession = payload as Session;

      // Persist to localStorage so readCachedSession() works instantly on next load
      try { window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession)); } catch {}

      // Tell SDK about the session (fire and forget — don't await)
      void supabase.auth.setSession({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
      }).catch(() => {});

      // Update React Query cache immediately
      queryClient.setQueryData(['auth-user'], newSession);

      // Ensure profile exists (fire and forget)
      void ensureUserProfile(newSession);

      return { data: { session: newSession, user: newSession.user }, error: null };
    } catch (err: any) {
      const msg = err?.name === 'AbortError'
        ? 'Sign in timed out. Please try again.'
        : 'Network error. Please check your connection and try again.';
      return { data: { session: null, user: null }, error: new Error(msg) };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
      });
      if (data?.session) {
        try { window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.session)); } catch {}
        queryClient.setQueryData(['auth-user'], data.session);
        void ensureUserProfile(data.session);
      }
      return { data, error };
    } catch (err: any) {
      return { data: { session: null, user: null }, error: err };
    }
  };

  const signOut = async () => {
    try { window.localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    queryClient.setQueryData(['auth-user'], null);
    const { error } = await supabase.auth.signOut().catch(() => ({ error: null }));
    return { error };
  };

  return {
    user,
    session: session ?? null,
    isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
  };
};
