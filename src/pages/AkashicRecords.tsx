import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AkashicReveal from '@/components/vedic/AkashicReveal';
import { AkashicCryptoModal } from '@/components/vedic/AkashicCryptoModal';
import AkashicReadingFull from '@/pages/AkashicReadingFull';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess } from '@/lib/tierAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Full-page Akashic Decoder — linked from palm (Multi-Planetary: Ketu + Saturn). */
const AkashicRecords: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, isPremium } = useMembership();
  const { hasAccess, isLoading } = useAkashicAccess(user?.id);
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const hasAkashaInfinity = hasFeatureAccess(isAdmin, tier, 3);
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);

  const originalPrice = 49;
  const discountedPrice = isPremium ? 39.2 : originalPrice;

  // ── STRIPE CHECKOUT — UNTOUCHED ──────────────────────────────────────────
  const handleStripeCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-akashic-checkout', {
        body: {
          isPremium,
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Checkout failed. Please try again.');
    }
  };

  // Admin or Akasha Infinity: full access (no €49 purchase required)
  if (!adminLoading && (isAdmin || hasAkashaInfinity)) {
    return <AkashicReadingFull />;
  }

  // Show loading while checking — NEVER redirect or render content until loading is complete
  if (isLoading || adminLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050505',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {/* SQI 2050 loading spinner */}
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(212,175,55,0.12)',
              borderTop: '1px solid #D4AF37',
              borderRadius: '50%',
              animation: 'sqi-spin 1s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 8,
              border: '1px solid rgba(34,211,238,0.1)',
              borderBottom: '1px solid #22D3EE',
              borderRadius: '50%',
              animation: 'sqi-spin 1.5s linear infinite reverse',
            }}
          />
        </div>
        <p
          style={{
            fontSize: '8px',
            letterSpacing: '0.4em',
            color: 'rgba(212,175,55,0.6)',
            textTransform: 'uppercase',
            fontFamily: 'Courier New, monospace',
          }}
        >
          Consulting the Akashic Field...
        </p>
        <style>{`
          @keyframes sqi-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ── HAS ACCESS — "Your Record is Ready" state ─────────────────────────────
  // (Use Link instead of navigate() to avoid redirect loop from separate hook instances)
  if (hasAccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050505',
          color: '#D4AF37',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid rgba(212,175,55,0.1)',
            background: 'rgba(5,5,5,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '12px 20px',
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              color: '#D4AF37',
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              padding: 4,
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
            }}
            aria-label="Go back"
          >
            ←
          </button>
          <p
            style={{
              fontSize: '9px',
              letterSpacing: '0.4em',
              color: 'rgba(212,175,55,0.6)',
              textTransform: 'uppercase',
              fontFamily: 'Courier New, monospace',
            }}
          >
            Akashic Decoder
          </p>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 56px)',
            padding: '40px 24px',
            gap: 0,
          }}
        >
          {/* Sri Yantra sigil */}
          <svg
            viewBox="0 0 200 200"
            style={{
              width: 96,
              height: 96,
              marginBottom: 32,
              filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.5))',
              animation: 'sqi-fadein 0.8s ease-out',
            }}
          >
            <circle cx="100" cy="100" r="94" fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeOpacity="0.35" />
            <polygon points="100,14 178,158 22,158" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.65" />
            <polygon points="100,186 22,42 178,42" fill="none" stroke="#22D3EE" strokeWidth="0.8" strokeOpacity="0.5" />
            <polygon points="100,38 160,140 40,140" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.4" />
            <polygon points="100,162 160,60 40,60" fill="none" stroke="#22D3EE" strokeWidth="0.5" strokeOpacity="0.3" />
            <circle cx="100" cy="100" r="4" fill="#D4AF37" fillOpacity="0.9" />
          </svg>

          {/* Glass card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 40,
              padding: '40px 32px',
              textAlign: 'center',
              maxWidth: 400,
              width: '100%',
              boxShadow:
                '0 0 0 1px rgba(212,175,55,0.06), 0 0 60px rgba(212,175,55,0.05)',
              animation: 'sqi-fadein 0.9s ease-out',
            }}
          >
            {/* Label */}
            <p
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '8px',
                letterSpacing: '0.45em',
                color: '#22D3EE',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              ◈ AKASHIC SEAL — VERIFIED
            </p>

            {/* Headline */}
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.6rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#D4AF37',
                textShadow: '0 0 20px rgba(212,175,55,0.3)',
                textTransform: 'uppercase',
                lineHeight: 1.25,
                marginBottom: 14,
              }}
            >
              Your Soul Manuscript
              <br />
              Has Been Decoded
            </h2>

            {/* Body */}
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.7,
                marginBottom: 32,
                letterSpacing: '0.02em',
              }}
            >
              Your complete 15-page Akashic reading is sealed and ready for transmission. Past lifetimes, Saturn debts, and
              your sovereign future await.
            </p>

            {/* CTA — Link unchanged */}
            <Link
              to="/akashic-reading/full"
              style={{
                display: 'block',
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
                color: '#050505',
                fontWeight: 900,
                fontSize: '11px',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                borderRadius: 100,
                textDecoration: 'none',
                boxShadow: '0 0 30px rgba(212,175,55,0.25), 0 4px 20px rgba(0,0,0,0.4)',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.opacity = '0.88';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
              }}
            >
              Open Your Reading
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes sqi-fadein {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── NO ACCESS — show gate / purchase ─────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#D4AF37' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid rgba(212,175,55,0.1)',
          background: 'rgba(5,5,5,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '12px 20px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            color: '#D4AF37',
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            padding: 4,
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <p
          style={{
            fontSize: '9px',
            letterSpacing: '0.4em',
            color: 'rgba(212,175,55,0.6)',
            textTransform: 'uppercase',
            fontFamily: 'Courier New, monospace',
          }}
        >
          Akashic Decoder
        </p>
      </div>

      <div style={{ paddingBottom: 96 }}>
        <AkashicReveal
          tier={tier}
          isPremium={!!isPremium}
          discountedPrice={discountedPrice}
          onStripeCheckout={handleStripeCheckout}
          onCryptoClick={() => setCryptoModalOpen(true)}
          onAkashaInfinityClick={() => navigate('/akasha-infinity')}
        />
        <AkashicCryptoModal
          open={cryptoModalOpen}
          onOpenChange={setCryptoModalOpen}
          amount={discountedPrice}
          userId={user?.id ?? ''}
        />
      </div>
    </div>
  );
};

export default AkashicRecords;
