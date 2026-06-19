import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AUTH_STORAGE_KEY = 'sqi-2050-auth-token';
const AUTH_CHECK_TIMEOUT_MS = 2500;
const AUTH_REQUEST_TIMEOUT_MS = 30000;

const getClientConfig = () => {
  const client = supabase as unknown as { supabaseUrl?: string; supabaseKey?: string };
  return {
    url: client.supabaseUrl || import.meta.env.VITE_SUPABASE_URL,
    key: client.supabaseKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
};

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
  });
}

function isNetworkAuthFailure(error: unknown) {
  const maybe = error as { name?: string; message?: string; status?: number };
  return (
    maybe?.status === 0 ||
    maybe?.name === 'AuthRetryableFetchError' ||
    maybe?.message?.toLowerCase().includes('failed to fetch') ||
    maybe?.message?.toLowerCase().includes('timed out')
  );
}

function readCachedSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const expiresAt = Number(session?.expires_at ?? 0);
    if (session?.access_token && session?.refresh_token && session?.user && expiresAt > Date.now() / 1000 + 60) {
      return session;
    }
  } catch {
    // Ignore corrupt browser storage and fall back to a clean auth check.
  }
  return null;
}

function clearStaleAuthStorage() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Browser storage can be unavailable in restricted contexts.
  }
}

async function getSession(): Promise<Session | null> {
  const cachedSession = readCachedSession();
  if (cachedSession) return cachedSession;

  try {
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_CHECK_TIMEOUT_MS,
      'Auth check timed out'
    );
    return session;
  } catch (error) {
    if (isNetworkAuthFailure(error)) clearStaleAuthStorage();
    return null;
  }
}

async function ensureUserProfile(session: Session | null) {
  const user = session?.user;
  if (!user) return;

  try {
    await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? null,
        preferred_language: 'en',
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
  } catch {
    // A missing profile must never block a successful auth session.
  }
}

function passwordSignInRequest(email: string, password: string): Promise<Session> {
  const { url, key } = getClientConfig();

  return new Promise((resolve, reject) => {
    if (!url || !key) {
      reject(new Error('Authentication is not configured.'));
      return;
    }

    const request = new XMLHttpRequest();
    request.open('POST', `${url}/auth/v1/token?grant_type=password`);
    request.timeout = AUTH_REQUEST_TIMEOUT_MS;
    request.setRequestHeader('apikey', key);
    request.setRequestHeader('Authorization', `Bearer ${key}`);
    request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    request.setRequestHeader('x-client-info', 'sqi-auth-xhr-fallback');

    request.onload = () => {
      let payload: any = null;
      try {
        payload = request.responseText ? JSON.parse(request.responseText) : null;
      } catch {
        // Keep payload null and use a generic message below.
      }

      if (request.status >= 200 && request.status < 300 && payload?.access_token && payload?.user) {
        resolve(payload as Session);
        return;
      }

      reject(new Error(payload?.error_description || payload?.msg || payload?.message || payload?.error || 'Sign in failed.'));
    };

    request.onerror = () => reject(new Error('Network connection failed. Please check your connection and try again.'));
    request.ontimeout = () => reject(new Error('Login timed out. Please check your connection and try again.'));
    request.send(JSON.stringify({ email, password, gotrue_meta_security: {} }));
  });
}

async function activateSession(session: Session) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Auth can still continue through in-memory cache.
  }

  try {
    const { data } = await withTimeout(
      supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }),
      2000,
      'Session activation timed out'
    );
    return data.session ?? session;
  } catch {
    return session;
  }
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  // Safety: if the query never resolves, force isLoading false after 5s
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSafetyTimedOut(true), 5000);
    return () => window.clearTimeout(t);
  }, []);

  const { data: session, isLoading: queryLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: getSession,
    staleTime: 30 * 60 * 1000,       // 30 minutes — no refetch churn
    gcTime: 24 * 60 * 60 * 1000,     // cache for 24h so reloads restore instantly
    retry: false,
    refetchOnWindowFocus: true,
    // CRITICAL: must be 'always' — global 'offlineFirst' causes this query
    // to hang indefinitely when there is no cached session on first load.
    networkMode: 'always',
  });

  // isLoading is false once query resolves OR safety timeout fires
  const isLoading = queryLoading && !safetyTimedOut;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Directly update cache — no invalidate → no loading flash → no bounce to /auth
      queryClient.setQueryData(['auth-user'], newSession);
      window.setTimeout(() => void ensureUserProfile(newSession), 0);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const user: User | null = session?.user ?? null;

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await withTimeout(supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    }), AUTH_REQUEST_TIMEOUT_MS, 'Sign up timed out. Please try again.');
    // Immediately seed the cache so ProtectedRoute sees session before navigation
    if (data.session) {
      queryClient.setQueryData(['auth-user'], data.session);
      window.setTimeout(() => void ensureUserProfile(data.session), 0);
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    let data: any = { session: null, user: null };
    let error: any = null;

    try {
      const fallbackSession = await passwordSignInRequest(email, password);
      const session = await activateSession(fallbackSession);
      data = { session, user: session.user };
      error = null;
    } catch (fallbackError) {
      error = fallbackError;
    }

    if (isNetworkAuthFailure(error)) {
      try {
        const result = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          AUTH_REQUEST_TIMEOUT_MS,
          'Login timed out. Please check your connection and try again.'
        );
        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }
    }

    // Immediately seed the cache so ProtectedRoute sees session before navigation
    if (data.session) {
      queryClient.setQueryData(['auth-user'], data.session);
      window.setTimeout(() => void ensureUserProfile(data.session), 0);
    }
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      queryClient.setQueryData(['auth-user'], null);
    }
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
