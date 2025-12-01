import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AffiliateData {
  referralCode: string | null;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  recentReferrals: Array<{
    id: string;
    created_at: string;
    signup_bonus_shc: number;
  }>;
  earningsHistory: Array<{
    id: string;
    created_at: string;
    commission_shc: number;
    purchase_type: string;
    status: string;
  }>;
}

export const useAffiliate = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchAffiliateData = async () => {
      try {
        // Fetch profile with referral code
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code, total_referrals, total_affiliate_earnings')
          .eq('user_id', user.id)
          .single();

        // Fetch referral signups
        const { data: referrals } = await supabase
          .from('referral_signups')
          .select('id, created_at, signup_bonus_shc')
          .eq('referrer_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch affiliate earnings
        const { data: earnings } = await supabase
          .from('affiliate_earnings')
          .select('id, created_at, commission_shc, purchase_type, status')
          .eq('affiliate_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Calculate pending vs paid earnings
        const pendingEarnings = earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.commission_shc, 0) || 0;
        const paidEarnings = earnings?.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.commission_shc, 0) || 0;

        setData({
          referralCode: profile?.referral_code || null,
          totalReferrals: profile?.total_referrals || 0,
          totalEarnings: Number(profile?.total_affiliate_earnings) || 0,
          pendingEarnings,
          paidEarnings,
          recentReferrals: referrals || [],
          earningsHistory: earnings || [],
        });
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAffiliateData();
  }, [user]);

  const getReferralLink = () => {
    if (!data?.referralCode) return '';
    return `${window.location.origin}/auth?ref=${data.referralCode}`;
  };

  return {
    data,
    isLoading,
    getReferralLink,
  };
};
