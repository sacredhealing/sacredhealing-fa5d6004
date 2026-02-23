import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Balance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface Profile {
  streak_days: number;
  last_login_date: string | null;
}

interface SHCContextType {
  balance: Balance | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  earnSHC: (amount: number, description: string) => Promise<boolean>;
  addOptimisticBalance: (amount: number) => void;
}

const SHCContext = createContext<SHCContextType | null>(null);

export const useSHC = () => {
  const context = useContext(SHCContext);
  if (!context) {
    throw new Error('useSHC must be used within an SHCProvider');
  }
  return context;
};

export const SHCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasUpdatedStreak = useRef(false);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_balances')
      .select('balance, total_earned, total_spent')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching balance:', error);
      return;
    }

    setBalance(data ? {
      balance: Number(data.balance),
      total_earned: Number(data.total_earned),
      total_spent: Number(data.total_spent)
    } : { balance: 0, total_earned: 0, total_spent: 0 });
  }, [user]);

  const getProfileFromCache = useCallback((): Profile | null => {
    if (!user?.id) return null;
    const cached = queryClient.getQueryData<{ streak_days: number; last_login_date: string | null }>(['profile', user.id]);
    if (cached) return { streak_days: cached.streak_days, last_login_date: cached.last_login_date ?? null };
    return null;
  }, [queryClient, user?.id]);

  const fetchProfileForStreak = useCallback(async (): Promise<Profile | null> => {
    if (!user?.id) return null;
    const data = await queryClient.fetchQuery({
      queryKey: ['profile', user.id],
      queryFn: async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, bio, streak_days, preferred_language, last_login_date, total_referrals')
          .eq('user_id', user.id)
          .single();
        return profileData;
      },
      staleTime: 5 * 60 * 1000,
    });
    if (!data) return null;
    return { streak_days: (data as { streak_days: number }).streak_days, last_login_date: (data as { last_login_date: string | null }).last_login_date ?? null };
  }, [user?.id, queryClient]);

  const earnSHC = useCallback(async (amount: number, description: string) => {
    if (!session) return false;

    try {
      const { error } = await supabase.functions.invoke('shc-transfer', {
        body: { action: 'earn', amount, description },
      });

      if (error) throw error;

      setBalance(prev => prev ? {
        ...prev,
        balance: prev.balance + amount,
        total_earned: prev.total_earned + amount
      } : { balance: amount, total_earned: amount, total_spent: 0 });

      return true;
    } catch (error: any) {
      console.error('Earn SHC error:', error);
      return false;
    }
  }, [session]);

  const updateStreak = useCallback(async () => {
    if (!user || hasUpdatedStreak.current) return;

    hasUpdatedStreak.current = true;

    let profileData: Profile | null = getProfileFromCache();
    if (!profileData) {
      profileData = await fetchProfileForStreak();
    }
    if (!profileData) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profileData.last_login_date;

    if (lastLogin === today) {
      return;
    }

    let newStreak = profileData.streak_days;

    if (lastLogin) {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak = profileData.streak_days + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        streak_days: newStreak,
        last_login_date: today
      })
      .eq('user_id', user.id);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      if (newStreak === 3 && profileData.streak_days < 3) {
        await earnSHC(10, '3-day streak bonus!');
        toast.success('🔥 3-day streak! +10 SHC bonus!');
      } else if (newStreak === 7 && profileData.streak_days < 7) {
        await earnSHC(25, '7-day streak bonus!');
        toast.success('🔥 7-day streak! +25 SHC bonus!');
      } else if (newStreak === 14 && profileData.streak_days < 14) {
        await earnSHC(50, '14-day streak bonus!');
        toast.success('🔥 14-day streak! +50 SHC bonus!');
      } else if (newStreak === 30 && profileData.streak_days < 30) {
        await earnSHC(100, '30-day streak bonus!');
        toast.success('🔥 30-day streak! +100 SHC bonus!');
      } else if (newStreak > 1) {
        await earnSHC(5, `Day ${newStreak} streak bonus`);
        toast.success(`🔥 ${newStreak} day streak! +5 SHC`);
      }
    }
  }, [user, getProfileFromCache, fetchProfileForStreak, queryClient, earnSHC]);

  const addOptimisticBalance = useCallback((amount: number) => {
    setBalance(prev => prev ? {
      ...prev,
      balance: prev.balance + amount,
      total_earned: prev.total_earned + amount
    } : { balance: amount, total_earned: amount, total_spent: 0 });
  }, []);

  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchBalance().finally(() => setIsLoading(false));

      setTimeout(() => {
        updateStreak();
      }, 0);
    } else {
      setBalance(null);
      setIsLoading(false);
      hasUpdatedStreak.current = false;
    }
  }, [user, fetchBalance, updateStreak]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('balance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_balances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && 'balance' in payload.new) {
            setBalance({
              balance: Number(payload.new.balance),
              total_earned: Number(payload.new.total_earned),
              total_spent: Number(payload.new.total_spent)
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const profile = user ? getProfileFromCache() : null;

  return (
    <SHCContext.Provider value={{
      balance,
      profile,
      isLoading,
      refreshBalance,
      earnSHC,
      addOptimisticBalance
    }}>
      {children}
    </SHCContext.Provider>
  );
};
