import React from 'react';
import { VastuTool } from '@/components/vastu/VastuTool';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Navigate } from 'react-router-dom';

const Vastu = () => {
  const { user } = useAuth();
  // useMembership already handles admin check and sets tier='lifetime' + isAdmin=true for admins
  const { tier, isPremium, loading: membershipLoading, isAdmin, adminGranted } = useMembership();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for membership check (which includes admin role check) to finish
  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Admins and lifetime/premium members have access
  const isLifetime = tier === 'lifetime';
  const isPremiumRecurring = !!tier && tier.includes('premium');
  const hasAccess = isAdmin || adminGranted || isLifetime || isPremiumRecurring || isPremium;

  if (!hasAccess) {
    return <Navigate to="/membership" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <VastuTool isAdmin={isAdmin} />
      </div>
    </div>
  );
};

export default Vastu;
