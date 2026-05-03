import React from 'react';
import { AyurvedaTool } from '@/components/ayurveda/AyurvedaTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import type { AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';

const Ayurveda = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isPremium, tier, loading: membershipLoading, settled } = useMembership();

  // Wait for auth and membership to resolve before rendering
  if (authLoading || membershipLoading || adminLoading || !settled) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '2px solid rgba(212,175,55,0.15)',
          borderTop: '2px solid #D4AF37',
          borderRadius: '50%',
          animation: 'sqiSpin 1s linear infinite',
        }} />
        <style>{`@keyframes sqiSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── MEMBERSHIP LEVEL MAPPING ────────────────────────────────────────────────
  // Admin check runs FIRST — overrides everything else
  // Admin always gets LIFETIME regardless of their subscription status
  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return 'LIFETIME' as AyurvedaMembershipLevel;
    const rank = getTierRank(tier);
    if (rank >= 3) return 'LIFETIME' as AyurvedaMembershipLevel;
    if (rank >= 1 || isPremium) return 'PREMIUM' as AyurvedaMembershipLevel;
    return 'FREE' as AyurvedaMembershipLevel;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <AyurvedaTool
        membershipLevel={getAyurvedaLevel()}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Ayurveda;
