import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: getSession,
    staleTime: 30 * 60 * 1000,       // 30 minutes — no refetch churn
    gcTime: 24 * 60 * 60 * 1000,     // cache for 24h so reloads restore instantly
    retry: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Directly update cache — no invalidate → no loading flash → no bounce to /auth
      queryClient.setQueryData(['auth-user'], newSession);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const user: User | null = session?.user ?? null;

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    // Immediately seed the cache so ProtectedRoute sees session before navigation
    if (data.session) {
      queryClient.setQueryData(['auth-user'], data.session);
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Immediately seed the cache so ProtectedRoute sees session before navigation
    if (data.session) {
      queryClient.setQueryData(['auth-user'], data.session);
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
