import React from 'react';
import { VastuTool } from '@/components/vastu/VastuTool';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Navigate } from 'react-router-dom';

const Vastu = () => {
  const { user, isLoading: authLoading } = useAuth();
  // useMembership already handles admin check and sets tier='lifetime' + isAdmin=true for admins
  const { tier, isPremium, loading: membershipLoading, isAdmin, adminGranted } = useMembership();

  // Wait for auth session AND membership check to complete before any routing decisions
  if (authLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Only redirect to auth once we KNOW there is no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins and lifetime/premium members have access
  const isLifetime = tier === 'lifetime';
  const isPremiumRecurring = !!tier && tier.includes('premium');
  const hasAccess = isAdmin || adminGranted || isLifetime || isPremiumRecurring || isPremium;

  if (!hasAccess) {
    return <Navigate to="/membership" replace />;
  }

  return (
    <div className="min-h-screen bg-background px-2 py-3 md:px-4 md:py-6">
      <VastuTool isAdmin={isAdmin} />
    </div>
  );
};

export default Vastu;
