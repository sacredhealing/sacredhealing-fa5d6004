import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AkashicSiddhaReading from '@/components/vedic/AkashicSiddhaReading';
import { useAIVedicReading } from '@/hooks/useAIVedicReading';
import { useAuth } from '@/hooks/useAuth';
import { useAkashicAccess } from '@/hooks/useAkashicAccess';
import { supabase } from '@/integrations/supabase/client';

const AKASHIC_RECORDS: Record<number, { title: string; remedy: string }> = {
  1: { title: 'The Sovereign Atma', remedy: 'Sun Mantra' },
  4: { title: 'The Heart Guardian', remedy: 'Moon Mantra' },
  9: { title: 'The Vedic Scholar', remedy: 'Jupiter Mantra' },
  12: { title: 'The Himalayan Mystic', remedy: 'Ketu Mantra' },
};
const DEFAULT_RECORD = { title: 'The Wandering Gandharva', remedy: 'Saraswati Mantra' };

/** Derive house from birth date day (1-12). */
function houseFromBirthDate(birthDate: string | null): number {
  if (!birthDate) return 12;
  const day = new Date(birthDate).getDate();
  return ((day - 1) % 12) + 1;
}

/** Full 15-page manuscript after purchase — Deep Siddha Logic + Certificate of Origin PDF. */
const AkashicReadingFull: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reading } = useAIVedicReading();
  const { hasAccess, isLoading } = useAkashicAccess(user?.id);
  const [userHouse, setUserHouse] = useState(12);
  const [scrolled, setScrolled] = useState(false);

  // ── Fetch user_house — UNTOUCHED ─────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !hasAccess) return;
    const resolve = async () => {
      const { data: record } = await (supabase as any)
        .from('akashic_readings')
        .select('user_house')
        .eq('user_id', user.id)
        .maybeSingle();
      if (record?.user_house != null) {
        setUserHouse(record.user_house);
        return;
      }
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('birth_date')
        .eq('user_id', user.id)
        .maybeSingle();
      setUserHouse(houseFromBirthDate(profile?.birth_date ?? null));
    };
    resolve();
  }, [user?.id, hasAccess]);

  const userName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    'Soul';

  const emailSentRef = useRef(false);
  const record = AKASHIC_RECORDS[userHouse] || DEFAULT_RECORD;

  // ── Save to My Records — UNTOUCHED ───────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !hasAccess) return;
    const saveRecord = async () => {
      const { error } = await (supabase as any).from('akashic_readings').upsert(
        {
          user_id: user.id,
          user_house: userHouse,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );
      if (error) console.warn('Could not save Akashic record:', error);
    };
    saveRecord();
  }, [user?.id, hasAccess, userHouse]);

  // ── Email trigger — UNTOUCHED ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.email || !hasAccess || emailSentRef.current) return;
    const fromInitiating = sessionStorage.getItem('akashic_from_initiating') === '1';
    if (!fromInitiating) return;
    sessionStorage.removeItem('akashic_from_initiating');
    emailSentRef.current = true;
    supabase.functions
      .invoke('send-akashic-purchase-email', {
        body: {
          userEmail: user.email,
          userName,
          remedy: record.remedy,
          archetype: record.title,
          appOrigin: window.location.origin,
        },
      })
      .catch((e) => console.warn('Could not send Akashic email:', e));
  }, [user?.email, userName, hasAccess, record.remedy, record.title]);

  // ── Redirect if no access — UNTOUCHED ────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate('/akashic-records', { replace: true });
    }
  }, [hasAccess, isLoading, navigate]);

  // ── Scroll effect for header ──────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
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
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(212,175,55,0.1)',
              borderTop: '1px solid #D4AF37',
              borderRadius: '50%',
              animation: 'sqi-spin 1s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 10,
              border: '1px solid rgba(34,211,238,0.08)',
              borderBottom: '1px solid #22D3EE',
              borderRadius: '50%',
              animation: 'sqi-spin 1.6s linear infinite reverse',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#D4AF37',
            }}
          />
        </div>
        <p
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '8px',
            letterSpacing: '0.4em',
            color: 'rgba(212,175,55,0.55)',
            textTransform: 'uppercase',
          }}
        >
          Decoding Soul Manuscript...
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

  if (!hasAccess) return null;

  const houseLabel = record.title;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#D4AF37',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212,175,55,0.045) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: scrolled
            ? '1px solid rgba(212,175,55,0.12)'
            : '1px solid rgba(212,175,55,0.06)',
          background: scrolled ? 'rgba(5,5,5,0.97)' : 'rgba(5,5,5,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 100,
            color: '#D4AF37',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '6px 14px 6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            letterSpacing: '0.08em',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(212,175,55,0.06)';
            el.style.borderColor = 'rgba(212,175,55,0.35)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(255,255,255,0.03)';
            el.style.borderColor = 'rgba(212,175,55,0.15)';
          }}
          aria-label="Go back"
        >
          <span style={{ fontSize: 14 }}>←</span>
          <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>Back</span>
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <p
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '8px',
              letterSpacing: '0.4em',
              color: 'rgba(212,175,55,0.55)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            ◈ Akashic Archive
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: '#D4AF37',
              textTransform: 'uppercase',
            }}
          >
            {houseLabel}
          </p>
        </div>

        <div
          style={{
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 100,
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22D3EE',
              boxShadow: '0 0 6px #22D3EE',
              animation: 'sqi-breathe 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '7px',
              letterSpacing: '0.3em',
              color: '#22D3EE',
              textTransform: 'uppercase',
            }}
          >
            Live
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          padding: '40px 24px 32px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(212,175,55,0.06)',
          zIndex: 1,
        }}
      >
        <svg
          viewBox="0 0 200 200"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 20px',
            filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.45))',
            animation: 'sqi-spin-slow 20s linear infinite',
          }}
        >
          <circle cx="100" cy="100" r="94" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.3" />
          <polygon points="100,14 178,158 22,158" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.6" />
          <polygon points="100,186 22,42 178,42" fill="none" stroke="#22D3EE" strokeWidth="0.8" strokeOpacity="0.45" />
          <polygon points="100,38 160,140 40,140" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.35" />
          <circle cx="100" cy="100" r="3.5" fill="#D4AF37" fillOpacity="0.9" />
        </svg>

        <p
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '8px',
            letterSpacing: '0.45em',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Soul Transmission for {userName}
        </p>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#D4AF37',
            textShadow: '0 0 30px rgba(212,175,55,0.3)',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            marginBottom: 10,
          }}
        >
          Your Akashic Record
        </h1>

        <p
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.06em',
            lineHeight: 1.6,
            maxWidth: 360,
            margin: '0 auto 20px',
          }}
        >
          The seals of your Palm Mandala have been decoded. Your soul manuscript is now active.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 20px',
            background: 'rgba(212,175,55,0.05)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 100,
          }}
        >
          <span style={{ color: '#D4AF37', fontSize: 11, opacity: 0.6 }}>◈</span>
          <span
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '9px',
              letterSpacing: '0.3em',
              color: 'rgba(212,175,55,0.8)',
              textTransform: 'uppercase',
            }}
          >
            {record.remedy} · House {userHouse}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 16px 96px', position: 'relative', zIndex: 1 }}>
        <AkashicSiddhaReading
          userHouse={userHouse}
          vedicReading={reading}
          isModal={false}
          hasDeepReadingAccess={true}
          showCertificateDownload={true}
          userName={userName}
        />
      </div>

      <style>{`
        @keyframes sqi-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sqi-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sqi-breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default AkashicReadingFull;
