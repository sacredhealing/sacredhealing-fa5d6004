import React from 'react';
import { VastuTool } from '@/components/vastu/VastuTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { Navigate } from 'react-router-dom';

const Vastu = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { isPremium, tier, subscribed } = useMembership();

  // Check access: Admin, Premium (monthly/yearly), Lifetime, or subscribed users
  const hasAccess = isAdmin || isPremium || tier === 'lifetime' || subscribed;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Vastu Abundance Architect</h1>
          <p className="text-muted-foreground mb-6">
            This course is available for Premium members, Lifetime members, and admins.
          </p>
          <a href="/membership" className="text-primary hover:underline">
            Upgrade to Premium →
          </a>
        </div>
      </div>
    );
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
