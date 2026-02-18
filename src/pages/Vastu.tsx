import React from 'react';
import { VastuTool } from '@/components/vastu/VastuTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';

const Vastu = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();

  if (!user) {
    return <Navigate to="/auth" replace />;
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
