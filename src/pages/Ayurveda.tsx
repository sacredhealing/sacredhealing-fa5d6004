// cache-bust: 20260605-siddha-banner-clean
import React from 'react';
import { AyurvedaTool } from '@/components/ayurveda/AyurvedaTool';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import type { AyurvedaMembershipLevel } from '@/lib/ayurvedaTypes';
import { getTierRank } from '@/lib/tierAccess';
import { useNavigate } from 'react-router-dom';

// ─── SIDDHA MEDICINE BANNER CARD ──────────────────────────────────────────────
const SiddhaMedicineBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#050505', padding: '0 16px 80px' }}>

      {/* Section divider */}
      <div style={{
        textAlign: 'center',
        padding: '40px 0 20px',
        fontSize: 9, fontWeight: 800,
        letterSpacing: '0.45em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.18)',
      }}>
        ● ─────────── Also in the Academy ─────────── ●
      </div>

      {/* Banner card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/siddha-medicine')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/siddha-medicine'); }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 40,
          border: '1px solid rgba(212,175,55,0.20)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          cursor: 'pointer',
          transition: 'border-color 0.3s, transform 0.2s',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.45)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.20)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Gold glow top */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 250, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Cyan accent br */}
        <div style={{
          position: 'absolute', bottom: -60, right: -40,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Top gold line */}
        <div style={{
          position: 'absolute', top: 0, left: 36, right: 36, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.45), transparent)',
        }} />

        {/* Inner layout */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: 24,
          padding: '28px 32px',
          flexWrap: 'wrap',
        }}>
          {/* Icon */}
          <div style={{
            flexShrink: 0,
            width: 72, height: 72, borderRadius: 24,
            border: '1px solid rgba(212,175,55,0.28)',
            background: 'rgba(212,175,55,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>
            🔱
          </div>

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.24)',
              borderRadius: 999, padding: '4px 14px',
              fontSize: 8, fontWeight: 800,
              letterSpacing: '0.42em', textTransform: 'uppercase',
              color: '#D4AF37', marginBottom: 10,
            }}>
              ✦ Pathinen Siddhargal ✦
            </div>

            {/* Title */}
            <div style={{
              fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 900,
              letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 6,
              background: 'linear-gradient(135deg, #fff 0%, #D4AF37 55%, rgba(212,175,55,0.6) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Siddha Medicine Academy
            </div>

            {/* Sub */}
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.42)',
              fontWeight: 400, lineHeight: 1.5, marginBottom: 14,
            }}>
              5,000 years of Tamil Siddha wisdom — from your first step to full immortality codes.
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {[
                { v: '32', l: 'Modules' },
                { v: '274', l: 'Lessons' },
                { v: '346+', l: 'Hours' },
                { v: '18', l: 'Masters' },
              ].map(({ v, l }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#D4AF37', letterSpacing: '-0.03em' }}>{v}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate('/siddha-medicine'); }}
            style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              padding: '13px 26px',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: '#050505',
              fontFamily: 'inherit',
              boxShadow: '0 0 28px rgba(212,175,55,0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            Enter →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN AYURVEDA PAGE ────────────────────────────────────────────────────────
const Ayurveda = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isPremium, tier, loading: membershipLoading, settled } = useMembership();

  if (authLoading || membershipLoading || adminLoading || !settled) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '2px solid rgba(212,175,55,0.15)',
          borderTop: '2px solid #D4AF37',
          borderRadius: '50%',
          animation: 'sqiSpin 1s linear infinite',
        }} />
        <style>{`@keyframes sqiSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const getAyurvedaLevel = (): AyurvedaMembershipLevel => {
    if (isAdmin) return 'LIFETIME' as AyurvedaMembershipLevel;
    const rank = getTierRank(tier);
    if (rank >= 3) return 'LIFETIME' as AyurvedaMembershipLevel;
    if (rank >= 2) return 'SIDDHA'   as AyurvedaMembershipLevel;
    if (rank >= 1 || isPremium) return 'PREMIUM' as AyurvedaMembershipLevel;
    return 'FREE' as AyurvedaMembershipLevel;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505' }}>
      <AyurvedaTool
        membershipLevel={getAyurvedaLevel()}
        isAdmin={isAdmin}
      />
      {/* ── SIDDHA MEDICINE ACADEMY ENTRY POINT ── */}
      <SiddhaMedicineBanner />
    </div>
  );
};

export default Ayurveda;
