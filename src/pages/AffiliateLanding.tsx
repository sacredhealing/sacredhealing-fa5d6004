import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

type Lang = 'en' | 'sv' | 'no' | 'es';
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'default';

interface AffiliateInfo {
  display_name: string;
  affiliate_code: string;
}

interface LandingTier {
  name: string;
  price: string;
  desc: string;
  ctaSlug: string;
}

interface LandingFeature {
  icon: string;
  title: string;
  desc: string;
}

const LANGS: Lang[] = ['en', 'sv', 'no', 'es'];

function detectLang(): Lang {
  const bl = navigator.language?.slice(0, 2).toLowerCase();
  if (bl === 'sv') return 'sv';
  if (bl === 'no' || bl === 'nb' || bl === 'nn') return 'no';
  if (bl === 'es') return 'es';
  return 'en';
}

function normalizeLang(raw: string | null): Lang {
  if (raw && LANGS.includes(raw as Lang)) return raw as Lang;
  return detectLang();
}

const AffiliateLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { i18n } = useI18nTranslation();

  const langParam = normalizeLang(searchParams.get('lang'));
  const platformRaw = searchParams.get('platform') || 'default';
  const platform: Platform =
    platformRaw === 'instagram' ||
    platformRaw === 'tiktok' ||
    platformRaw === 'youtube' ||
    platformRaw === 'facebook'
      ? platformRaw
      : 'default';

  const tl = i18n.getFixedT(langParam);
  const selectTierMap = (tl('affiliateLanding.selectTier', { returnObjects: true }) || {}) as Record<
    string,
    string
  >;
  const selectTierLabel =
    selectTierMap[langParam] || selectTierMap.en || 'Select';

  const tiers = tl('affiliateLanding.tiers', { returnObjects: true }) as LandingTier[];
  const features = tl('affiliateLanding.features', { returnObjects: true }) as LandingFeature[];

  const rawPlatform = tl(`affiliateLanding.platform.${platform}`, { returnObjects: true });
  const platformCopy =
    rawPlatform && typeof rawPlatform === 'object' && 'hook' in rawPlatform
      ? (rawPlatform as { hook: string; visual_note: string })
      : (tl('affiliateLanding.platform.default', { returnObjects: true }) as {
          hook: string;
          visual_note: string;
        });

  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!code) return;
    try {
      localStorage.setItem('affiliateId', code);
      sessionStorage.setItem('affiliateId', code);
    } catch {
      /* ignore storage failures */
    }

    const tloc = i18n.getFixedT(langParam);

    (async () => {
      const { data: ap } = await supabase
        .from('affiliate_profiles')
        .select('affiliate_code, user_id')
        .eq('affiliate_code', code)
        .maybeSingle();
      if (!ap) return;
      let fullName: string | null = null;
      if (ap.user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', ap.user_id)
          .maybeSingle();
        fullName = prof?.full_name ?? null;
      }
      setAffiliate({
        display_name: fullName || tloc('affiliateLanding.defaultPartnerName'),
        affiliate_code: ap.affiliate_code,
      });
    })();
  }, [code, langParam, i18n]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleCTA = (tierSlug?: string) => {
    const params = new URLSearchParams();
    if (code) params.set('affiliateId', code);
    if (tierSlug) params.set('tier', tierSlug);
    navigate(`/membership?${params.toString()}`);
  };

  return (
    <div
      style={{
        background: '#050505',
        minHeight: '100vh',
        color: '#fff',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? 'rgba(5,5,5,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          transition: 'background 0.3s ease',
          borderBottom: scrolled ? '1px solid rgba(212,175,55,0.1)' : 'none',
        }}
      >
        <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em' }}>
          {tl('affiliateLanding.navBrand')}
        </span>
        <button type="button" onClick={() => handleCTA()} style={navCta}>
          {tl('affiliateLanding.cta_primary')} →
        </button>
      </nav>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8rem 1.5rem 4rem',
          background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,175,55,0.15) 0%, transparent 65%),
          radial-gradient(ellipse 40% 50% at 80% 80%, rgba(212,175,55,0.05) 0%, transparent 70%)
        `,
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {platform !== 'default' && platformCopy?.hook && (
          <div
            style={{
              marginBottom: '1.5rem',
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 100,
              padding: '8px 24px',
              fontSize: '0.85rem',
              color: '#D4AF37',
              fontWeight: 600,
            }}
          >
            {platformCopy.hook}
          </div>
        )}

        <div
          style={{
            display: 'inline-block',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 100,
            padding: '6px 24px',
            fontSize: '9px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: '#D4AF37',
            marginBottom: '2rem',
            background: 'rgba(212,175,55,0.05)',
          }}
        >
          {tl('affiliateLanding.badge')}
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #F5E27B 0%, #D4AF37 50%, #A07820 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.05,
            maxWidth: 800,
            whiteSpace: 'pre-line',
            margin: '0 auto 1.5rem',
          }}
        >
          {tl('affiliateLanding.headline')}
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            maxWidth: 600,
            margin: '0 auto 3rem',
          }}
        >
          {tl('affiliateLanding.subheadline')}
        </p>

        {affiliate && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: '2.5rem',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212,175,55,0.15)',
                border: '2px solid rgba(212,175,55,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              ✦
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              {tl('affiliateLanding.shared_by')}{' '}
              <strong style={{ color: '#D4AF37' }}>{affiliate.display_name}</strong>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={() => handleCTA()} style={primaryCta}>
            {tl('affiliateLanding.cta_primary')} ✦
          </button>
          <button type="button" onClick={() => handleCTA('free')} style={secondaryCta}>
            {tl('affiliateLanding.cta_secondary')}
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          {tl('affiliateLanding.social_proof')}
        </p>
      </div>

      <section style={{ maxWidth: 820, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <SectionLabel text={tl('affiliateLanding.what_is')} />
        <p
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '1.05rem',
            lineHeight: 1.8,
            marginTop: '1.5rem',
            textAlign: 'center',
          }}
        >
          {tl('affiliateLanding.what_body')}
        </p>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {Array.isArray(features) &&
            features.map((f, i) => (
              <div key={i} style={featureCard}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ color: '#D4AF37', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <SectionLabel text={tl('affiliateLanding.sectionInitiationTiers')} center />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginTop: '2rem',
          }}
        >
          {Array.isArray(tiers) &&
            tiers.map((tier, i) => (
              <div
                key={tier.ctaSlug}
                role="button"
                tabIndex={0}
                onClick={() => handleCTA(tier.ctaSlug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCTA(tier.ctaSlug);
                  }
                }}
                style={{
                  ...featureCard,
                  cursor: 'pointer',
                  border:
                    i === 2 ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {i === 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(212,175,55,0.15)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 100,
                      padding: '3px 10px',
                      fontSize: '8px',
                      letterSpacing: '0.3em',
                      color: '#D4AF37',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tl('affiliateLanding.badgeAkasha')}
                  </div>
                )}
                <p
                  style={{
                    color: 'rgba(212,175,55,0.6)',
                    fontSize: '8px',
                    fontWeight: 800,
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                  }}
                >
                  {tl('affiliateLanding.initiationTierMicro')}
                </p>
                <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '1.15rem', marginBottom: '0.3rem' }}>{tier.name}</h3>
                <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>{tier.price}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.65 }}>{tier.desc}</p>
                <div style={{ marginTop: '1.25rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background:
                        i === 2 ? 'linear-gradient(135deg, #D4AF37, #A07820)' : 'rgba(255,255,255,0.05)',
                      border: i !== 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      borderRadius: 100,
                      padding: '8px 20px',
                      color: i === 2 ? '#050505' : 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {selectTierLabel}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem 6rem', textAlign: 'center' }}>
        <div
          style={{
            ...featureCard,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌟</div>
          {platformCopy?.visual_note && (
            <p style={{ color: 'rgba(212,175,55,0.7)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              {platformCopy.visual_note}
            </p>
          )}
          <h2
            style={{
              fontWeight: 900,
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              letterSpacing: '-0.03em',
              color: '#fff',
              marginBottom: '1rem',
            }}
          >
            {tl('affiliateLanding.conversion_headline')}
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              maxWidth: 480,
              margin: '0 auto 2rem',
            }}
          >
            {tl('affiliateLanding.conversion_body')}
          </p>
          <button type="button" onClick={() => handleCTA()} style={primaryCta}>
            {tl('affiliateLanding.cta_primary')} →
          </button>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '1.5rem', lineHeight: 1.6 }}>
            {tl('affiliateLanding.legal')}
          </p>
        </div>
      </section>
    </div>
  );
};

const SectionLabel: React.FC<{ text: string; center?: boolean }> = ({ text, center }) => (
  <p
    style={{
      fontSize: '9px',
      fontWeight: 800,
      letterSpacing: '0.4em',
      textTransform: 'uppercase',
      color: 'rgba(212,175,55,0.6)',
      textAlign: center ? 'center' : 'left',
    }}
  >
    {text}
  </p>
);

const featureCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 40,
  padding: '1.75rem',
};

const primaryCta: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #A07820)',
  border: 'none',
  borderRadius: 100,
  padding: '16px 40px',
  color: '#050505',
  fontWeight: 800,
  fontSize: '0.95rem',
  cursor: 'pointer',
  letterSpacing: '0.02em',
  boxShadow: '0 8px 40px rgba(212,175,55,0.3)',
};

const secondaryCta: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 100,
  padding: '16px 40px',
  color: 'rgba(255,255,255,0.7)',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const navCta: React.CSSProperties = {
  background: 'rgba(212,175,55,0.1)',
  border: '1px solid rgba(212,175,55,0.3)',
  borderRadius: 100,
  padding: '8px 20px',
  color: '#D4AF37',
  fontWeight: 700,
  fontSize: '0.8rem',
  cursor: 'pointer',
};

export default AffiliateLanding;
