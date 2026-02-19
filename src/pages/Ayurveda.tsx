import React from 'react';
import { AyurvedaTool } from '@/components/ayurveda/AyurvedaTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import type { AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';

const Ayurveda = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isPremium, tier, loading: membershipLoading } = useMembership();

  // Wait for auth and membership to resolve before rendering
  if (authLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Map membership tiers to Ayurveda levels - Admins get LIFETIME access
  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return 'LIFETIME' as AyurvedaMembershipLevel;
    if (tier === 'lifetime') return 'LIFETIME' as AyurvedaMembershipLevel;
    if (isPremium || tier?.includes('premium')) return 'PREMIUM' as AyurvedaMembershipLevel;
    return 'FREE' as AyurvedaMembershipLevel;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <AyurvedaTool membershipLevel={getAyurvedaLevel()} isAdmin={isAdmin} />
      </div>
    </div>
  );
};

export default Ayurveda;
