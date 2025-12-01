import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Balance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  tx_signature: string | null;
  status: string;
  created_at: string;
}

export const useSHCBalance = () => {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBalance = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
  }, []);

  const fetchTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('shc_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data as Transaction[]);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchBalance(), fetchTransactions()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchBalance, fetchTransactions]);

  const withdrawSHC = useCallback(async (amount: number, walletAddress?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('shc-transfer', {
        body: { action: 'withdraw', amount, walletAddress },
      });

      if (response.error) throw response.error;

      toast({
        title: "Withdrawal successful",
        description: `${amount} SHC sent to your wallet`
      });

      await Promise.all([fetchBalance(), fetchTransactions()]);
      return true;
    } catch (error: any) {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, fetchBalance, fetchTransactions]);

  const earnSHC = useCallback(async (amount: number, description: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('shc-transfer', {
        body: { action: 'earn', amount, description },
      });

      if (response.error) throw response.error;

      await Promise.all([fetchBalance(), fetchTransactions()]);
      return true;
    } catch (error: any) {
      console.error('Earn SHC error:', error);
      return false;
    }
  }, [fetchBalance, fetchTransactions]);

  return {
    balance,
    transactions,
    isLoading,
    withdrawSHC,
    earnSHC,
    refreshBalance: fetchBalance,
    refreshTransactions: fetchTransactions
  };
};
