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
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
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
