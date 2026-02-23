import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

async function fetchBalance(userId: string): Promise<Balance> {
  const { data, error } = await supabase
    .from('user_balances')
    .select('balance, total_earned, total_spent')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { balance: 0, total_earned: 0, total_spent: 0 };
  return {
    balance: Number(data.balance),
    total_earned: Number(data.total_earned),
    total_spent: Number(data.total_spent),
  };
}

async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('shc_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export const useSHCBalance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const balanceQuery = useQuery({
    queryKey: ['shc-balance', user?.id],
    queryFn: () => fetchBalance(user!.id),
    enabled: !!user?.id,
  });

  const transactionsQuery = useQuery({
    queryKey: ['shc-transactions', user?.id],
    queryFn: () => fetchTransactions(user!.id),
    enabled: !!user?.id,
  });

  const invalidateBalance = () => {
    queryClient.invalidateQueries({ queryKey: ['shc-balance', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['shc-transactions', user?.id] });
  };

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, walletAddress }: { amount: number; walletAddress?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await supabase.functions.invoke('shc-transfer', {
        body: { action: 'withdraw', amount, walletAddress },
      });
      if (response.error) throw response.error;
    },
    onSuccess: (_, { amount }) => {
      toast({ title: 'Withdrawal successful', description: `${amount} SHC sent to your wallet` });
      invalidateBalance();
    },
    onError: (error: Error) => {
      toast({
        title: 'Withdrawal failed',
        description: error.message || 'Failed to process withdrawal',
        variant: 'destructive',
      });
    },
  });

  const earnMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await supabase.functions.invoke('shc-transfer', {
        body: { action: 'earn', amount, description },
      });
      if (response.error) throw response.error;
    },
    onSuccess: () => invalidateBalance(),
  });

  const withdrawSHC = async (amount: number, walletAddress?: string) => {
    try {
      await withdrawMutation.mutateAsync({ amount, walletAddress });
      return true;
    } catch {
      return false;
    }
  };

  const earnSHC = async (amount: number, description: string) => {
    try {
      await earnMutation.mutateAsync({ amount, description });
      return true;
    } catch {
      return false;
    }
  };

  const balance = balanceQuery.data ?? null;
  const transactions = transactionsQuery.data ?? [];
  const isLoading = balanceQuery.isLoading || transactionsQuery.isLoading;

  return {
    balance,
    transactions,
    isLoading,
    withdrawSHC,
    earnSHC,
    refreshBalance: () => queryClient.invalidateQueries({ queryKey: ['shc-balance', user?.id] }),
    refreshTransactions: () => queryClient.invalidateQueries({ queryKey: ['shc-transactions', user?.id] }),
  };
};
