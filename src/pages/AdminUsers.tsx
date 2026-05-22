// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserManagementPanel from '@/components/admin/UserManagementPanel';

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
      background: '#050505',
      minHeight: '100vh',
      padding: '24px 16px 80px',
      color: '#fff',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back button */}
        <div style={{ marginBottom: 28 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: 'linear-gradient(155deg, rgba(212,175,55,0.28), rgba(212,175,55,0.04))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(212,175,55,0.18)',
            }}>
              <ArrowLeft size={18} color="#D4AF37" strokeWidth={1.4} />
            </div>
          </Button>
        </div>

        {/* Panel */}
        <UserManagementPanel />
      </div>
    </div>
  );
};

export default AdminUsers;
