import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [balance, setBalance] = useState<Balance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('streak_days, last_login_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  }, [user]);

  const updateStreak = useCallback(async () => {
    if (!user || hasUpdatedStreak.current) return;
    
    hasUpdatedStreak.current = true;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('streak_days, last_login_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profileData) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profileData.last_login_date;

    if (lastLogin === today) {
      // Already logged in today, no update needed
      return;
    }

    let newStreak = profileData.streak_days;

    if (lastLogin) {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = profileData.streak_days + 1;
      } else if (diffDays > 1) {
        // Missed a day - reset streak
        newStreak = 1;
      }
    } else {
      // First login ever
      newStreak = 1;
    }

    // Update profile with new streak and login date
    const { error } = await supabase
      .from('profiles')
      .update({ 
        streak_days: newStreak, 
        last_login_date: today 
      })
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, streak_days: newStreak, last_login_date: today } : null);
      
      // Award streak bonus on day 7
      if (newStreak === 7 && profileData.streak_days < 7) {
        await earnSHC(20, '7-day streak bonus!');
        toast.success('🔥 7-day streak! +20 SHC bonus!');
      } else if (newStreak > 1) {
        toast.success(`🔥 ${newStreak} day streak!`);
      }
    }
  }, [user]);

  const earnSHC = useCallback(async (amount: number, description: string) => {
    if (!session) return false;

    try {
      const { error } = await supabase.functions.invoke('shc-transfer', {
        body: { action: 'earn', amount, description },
      });

      if (error) throw error;

      // Optimistic update
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

  const addOptimisticBalance = useCallback((amount: number) => {
    setBalance(prev => prev ? {
      ...prev,
      balance: prev.balance + amount,
      total_earned: prev.total_earned + amount
    } : { balance: amount, total_earned: amount, total_spent: 0 });
  }, []);

  const refreshBalance = useCallback(async () => {
    await Promise.all([fetchBalance(), fetchProfile()]);
  }, [fetchBalance, fetchProfile]);

  // Initial load
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchBalance(), fetchProfile()])
        .finally(() => setIsLoading(false));
      
      // Update streak on initial load
      setTimeout(() => {
        updateStreak();
      }, 0);
    } else {
      setBalance(null);
      setProfile(null);
      setIsLoading(false);
      hasUpdatedStreak.current = false;
    }
  }, [user, fetchBalance, fetchProfile, updateStreak]);

  // Real-time subscription for balance updates
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