import React from 'react';
import { VastuTool } from '@/components/vastu/VastuTool';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Navigate } from 'react-router-dom';
import { getTierRank } from '@/lib/tierAccess';

const Vastu = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, isPremium, loading: membershipLoading, isAdmin, adminGranted, settled } = useMembership();

  // Wait for auth session AND membership check to complete before any routing decisions
  if (authLoading || membershipLoading || !settled) {
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

  // Admins and Prana-Flow+ members have access (rank ≥ 1)
  const hasAccess = isAdmin || adminGranted || isPremium || getTierRank(tier) >= 1;

  if (!hasAccess) {
    return <Navigate to="/membership" replace />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background md:relative md:min-h-0 md:px-4 md:py-4">
      <VastuTool isAdmin={isAdmin} />
    </div>
  );
};

export default Vastu;
