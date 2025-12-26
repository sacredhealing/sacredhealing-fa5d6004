import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PayoutAccount {
  id: string;
  stripe_connect_account_id: string | null;
  account_status: 'pending' | 'active' | 'restricted';
  country: string | null;
  currency: string;
  payout_method: 'bank' | 'crypto';
}

interface Payout {
  id: string;
  amount_shc: number;
  amount_eur: number;
  payout_method: 'bank' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

interface StripeConnectStatus {
  hasAccount: boolean;
  status: 'pending' | 'active' | 'restricted' | null;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export const useAffiliatePayouts = () => {
  const { user } = useAuth();
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayoutAccount = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('affiliate_payout_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setPayoutAccount(data as PayoutAccount | null);
    } catch (err) {
      console.error('Error fetching payout account:', err);
    }
  }, [user]);

  const fetchPayouts = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('affiliate_payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setPayouts((data as Payout[]) || []);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  }, [user]);

  const checkStripeConnectStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-stripe-connect-status');
      
      if (error) throw error;
      
      setConnectStatus(data);
    } catch (err) {
      console.error('Error checking Stripe Connect status:', err);
    }
  }, [user]);

  const createStripeConnectAccount = useCallback(async (country: string = 'NO') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { country },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }

      return data;
    } catch (err) {
      console.error('Error creating Stripe Connect account:', err);
      throw err;
    }
  }, []);

  const requestBankPayout = useCallback(async (amountShc: number, priceEur: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('request-bank-payout', {
        body: { amountShc, priceEur },
      });

      if (error) throw error;

      await fetchPayouts();
      return data;
    } catch (err) {
      console.error('Error requesting bank payout:', err);
      throw err;
    }
  }, [fetchPayouts]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        fetchPayoutAccount(),
        fetchPayouts(),
        checkStripeConnectStatus(),
      ]).finally(() => setIsLoading(false));
    }
  }, [user, fetchPayoutAccount, fetchPayouts, checkStripeConnectStatus]);

  return {
    payoutAccount,
    payouts,
    connectStatus,
    isLoading,
    createStripeConnectAccount,
    requestBankPayout,
    checkStripeConnectStatus,
    refetch: () => Promise.all([fetchPayoutAccount(), fetchPayouts(), checkStripeConnectStatus()]),
  };
};
