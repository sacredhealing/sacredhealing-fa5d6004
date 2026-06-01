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
    // Keep session fresh for 30 minutes before background refetch
    // Previously 60s — caused brief unauthenticated flashes on every minute boundary
    staleTime: 30 * 60 * 1000,
    // Keep cached session for 24 hours so page reloads restore immediately
    gcTime: 24 * 60 * 60 * 1000,
    // Don't retry on auth failures — avoids 3x redundant Supabase calls
    retry: false,
    // Refetch when window regains focus to catch token refresh events
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Directly update the cache with the new session instead of invalidating
      // This prevents the loading flash that was causing the "logged out" feeling
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
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
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
