// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode } from 'lucide-react';
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

        {/* Signup QR shortcut */}
        <button
          type="button"
          onClick={() => navigate('/admin/system?tab=signup-qr')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, borderRadius: 20, padding: '16px 20px', marginBottom: 20,
            textAlign: 'left', cursor: 'pointer',
            background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <QrCode size={20} color="#D4AF37" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4AF37' }}>
                Signup QR Code
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                Get the printable QR code to sign new users up in person
              </div>
            </div>
          </div>
          <span style={{ color: '#D4AF37', fontSize: 14, fontWeight: 900 }}>→</span>
        </button>

        {/* Panel */}
        <UserManagementPanel />
      </div>
    </div>
  );
};

export default AdminUsers;
