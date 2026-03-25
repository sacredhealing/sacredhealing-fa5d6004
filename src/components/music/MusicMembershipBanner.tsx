// ◈ SQI 2050 — Legacy €4.99 music plan REMOVED.
// All music access is now via Prana-Flow (19€/mo) or higher.
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MusicMembershipBanner: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate('/prana-flow')}
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(5,5,5,0.98) 60%)',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 24,
        padding: '24px 22px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)' }} />
      <div style={{ fontWeight: 800, fontSize: 7, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', marginBottom: 8 }}>◈ Prana–Flow · 19€/mo</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'white', marginBottom: 6 }}>Unlock the Full Healing Music Library</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, marginBottom: 14 }}>Solfeggio tones · Planetary Ragas · Binaural states · Sacred frequencies</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#D4AF37', color: '#050505', borderRadius: 100, padding: '10px 22px', fontWeight: 800, fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase' }}>
        ◈ Activate Prana–Flow
      </div>
    </div>
  );
};

export default MusicMembershipBanner;
