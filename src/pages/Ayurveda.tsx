import React from 'react';
import { AyurvedaTool } from '@/components/ayurveda/AyurvedaTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import type { AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

const Ayurveda = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isPremium, tier, loading: membershipLoading } = useMembership();
  const { t } = useTranslation();

  // Wait for auth and membership to resolve before rendering
  if (authLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D4AF37]" />
        <div className="text-[8px] font-extrabold uppercase tracking-[0.6em] text-[#D4AF37]/60">
          {t('ayurvedaPage.loadingArchive', 'Accessing Akasha-Neural Archive…')}
        </div>
      </div>
    );
  }

  // Map membership tiers to Ayurveda levels — isAdmin runs first and overrides everything
  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return 'LIFETIME' as AyurvedaMembershipLevel;
    if (tier === 'lifetime') return 'LIFETIME' as AyurvedaMembershipLevel;
    if (tier === 'akasha-infinity') return 'LIFETIME' as AyurvedaMembershipLevel;
    if (
      isPremium ||
      tier?.includes('premium') ||
      tier === 'siddha-quantum' ||
      tier === 'prana-flow'
    ) {
      return 'PREMIUM' as AyurvedaMembershipLevel;
    }
    return 'FREE' as AyurvedaMembershipLevel;
  };

  return <AyurvedaTool membershipLevel={getAyurvedaLevel()} isAdmin={isAdmin} />;
};

export default Ayurveda;
