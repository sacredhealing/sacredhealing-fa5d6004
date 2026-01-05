import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSacredCircles from '@/components/admin/AdminSacredCircles';

const AdminCircles: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Sacred Circles</h1>
            <p className="text-muted-foreground">Manage community chat rooms and moderation</p>
          </div>
        </div>

        <AdminSacredCircles />
      </div>
    </div>
  );
};

export default AdminCircles;
