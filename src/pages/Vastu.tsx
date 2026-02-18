import React from 'react';
import { VastuTool } from '@/components/vastu/VastuTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { Navigate } from 'react-router-dom';

const Vastu = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdminRole();
  const { tier, isPremium, loading: membershipLoading } = useMembership();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for both hooks to finish loading before checking access
  if (isAdminLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Access rules:
  // - Admins: always allowed
  // - Lifetime: tier === 'lifetime'
  // - Premium monthly/yearly: tier contains 'premium' OR isPremium flag
  const isLifetime = tier === 'lifetime';
  const isPremiumRecurring = !!tier && tier.includes('premium');
  const hasAccess = isAdmin || isLifetime || isPremiumRecurring || isPremium;

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
