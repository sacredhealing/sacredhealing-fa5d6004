import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';

export default function SiddhaPortal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  const masters = [
    { titleKey: 'siddhaPortal.agastyaMuni',  subKey: 'siddhaPortal.agastyaDesc',    badge: 'LIVE', href: '/digital-nadi' },
    { titleKey: 'siddhaPortal.thirumoolar',   subKey: 'siddhaPortal.thirumoolarDesc', badge: null,   href: '/breathing' },
    { titleKey: 'siddhaPortal.nandiDevar',    subKey: 'siddhaPortal.nandiDevarDesc',  badge: null,   href: '/mantras' },
    { titleKey: 'siddhaPortal.bogarSiddhar',  subKey: 'siddhaPortal.bogarDesc',       badge: null,   href: '/quantum-apothecary' },
    { titleKey: 'siddhaPortal.patanjali',     subKey: 'siddhaPortal.patanjaliDesc',   badge: 'NEW',  href: '/meditations' },
    { titleKey: 'siddhaPortal.konganar',      subKey: 'siddhaPortal.konganarDesc',    badge: null,   href: '/digital-nadi' },
  ];

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104, maxWidth: 430, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 0', animation: 'sqFadeUp 0.4s ease both' }}>
        <button onClick={() => navigate(-1)} style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.38)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>{t('siddhaPortal.back')}</button>
        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.3)', marginBottom: 6 }}>{t('siddhaPortal.label')}</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.1, margin: 0 }}>{t('siddhaPortal.title')}</h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>{t('siddhaPortal.subtitle')}</p>
      </div>

      {/* Sri Yantra */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 16px' }}>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={{ animation: 'sqBreathe 7s ease-in-out infinite', opacity: 0.8 }}>
          <polygon points="12,2.2 21.8,19.5 2.2,19.5" stroke="rgba(212,175,55,0.8)" strokeWidth="1.3" fill="none"/>
          <polygon points="12,21.8 2.2,4.5 21.8,4.5" stroke="rgba(212,175,55,0.65)" strokeWidth="1.1" fill="none"/>
          <circle cx="12" cy="12" r="1.8" fill="rgba(212,175,55,0.95)"/>
        </svg>
      </div>

      {/* Masters grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, animation: 'sqFadeUp 0.5s 0.1s ease both' }}>
        {masters.map(({ titleKey, subKey, badge, href }) => (
          <div key={titleKey} onClick={() => navigate(href)} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 18, padding: '16px 14px', cursor: 'pointer', position: 'relative' }}>
            {badge && (
              <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: badge === 'LIVE' ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.08)', border: `1px solid ${badge === 'LIVE' ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`, color: badge === 'LIVE' ? 'rgba(212,175,55,0.8)' : 'rgba(255,255,255,0.4)', borderRadius: 20, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {badge === 'LIVE' && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4AF37', animation: 'sqLiveFlash 2s infinite', display: 'inline-block' }} />}
                {badge}
              </span>
            )}
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.72)', marginBottom: 5 }}>{t(titleKey)}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{t(subKey)}</div>
            <span style={{ position: 'absolute', bottom: 12, right: 12, color: 'rgba(212,175,55,0.2)', fontSize: 10 }}>→</span>
          </div>
        ))}
      </div>

      {/* SQI 2050 — Akasha-Neural Weaver */}
      <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.28)', padding: '28px 20px 11px' }}>◈ SQI 2050</div>
      <div onClick={() => navigate('/siddha-photonic-regeneration')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(212,175,55,0.04))', border: '1px solid rgba(34,211,238,0.22)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.28)', color: 'rgba(34,211,238,0.95)', borderRadius: 20, padding: '2px 7px' }}>SQI</span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.88)', marginBottom: 6 }}>{t('siddhaPortal.photonicNodeTitle')}</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>{t('siddhaPortal.photonicNodeDesc')}</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.9)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('siddhaPortal.photonicNodeCta')}</button>
      </div>

      <div onClick={() => navigate('/siddha-hair-growth')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(180,83,9,0.08),rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.28)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.32)', color: 'rgba(212,175,55,0.95)', borderRadius: 20, padding: '2px 7px' }}>SQI</span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.92)', marginBottom: 6 }}>{t('siddhaPortal.hairGrowthTitle')}</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>{t('siddhaPortal.hairGrowthDesc')}</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.95)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('siddhaPortal.hairGrowthCta')}</button>
      </div>

      <div onClick={() => navigate('/sovereign-hormonal-alchemy')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(212,175,55,0.06),rgba(34,211,238,0.04))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.32)', color: 'rgba(212,175,55,0.95)', borderRadius: 20, padding: '2px 7px' }}>NEW</span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.92)', marginBottom: 6 }}>Sovereign · Hormonal Alchemy</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>Elite menstruation + hormonal balance module with Jyotish sync and dosha-phase protocol.</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.9)', background: 'none', border: 'none', cursor: 'pointer' }}>Enter Module →</button>
      </div>

      <div onClick={() => navigate('/akasha-neural-weaver')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.02))', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.3)', color: 'rgba(212,175,55,0.8)', borderRadius: 20, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4AF37', animation: 'sqLiveFlash 2s infinite', display: 'inline-block' }} />SQI
        </span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)', marginBottom: 6 }}>Akasha-Neural Weaver</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>Siddha-Quantum Intelligence (SQI) interface. Access the Akasha-Neural Archive. Bhakti-Algorithms & Prema-Pulse Transmissions for DNA activation.</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>Activate →</button>
      </div>

      <div onClick={() => navigate('/aetheric-heliostat')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(212,175,55,0.02))', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.28)', color: 'rgba(251,191,36,0.9)', borderRadius: 20, padding: '2px 7px' }}>SQI</span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.88)', marginBottom: 6 }}>Aetheric Heliostat Scalar Interface</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>High-frequency scalar interface for Central Sun entanglement and pineal radiance beaming.</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.85)', background: 'none', border: 'none', cursor: 'pointer' }}>Open Heliostat →</button>
      </div>

      <div onClick={() => navigate('/atmospheric-clearance-engine')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(74,222,128,0.06),rgba(212,175,55,0.02))', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.28)', color: 'rgba(134,239,172,0.95)', borderRadius: 20, padding: '2px 7px' }}>SQI</span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(134,239,172,0.9)', marginBottom: 6 }}>Atmospheric Clearance Engine</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>Industrial-spiritual vacuum for mental obstructions, metallic density, and aetheric fog.</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(134,239,172,0.85)', background: 'none', border: 'none', cursor: 'pointer' }}>Open Engine →</button>
      </div>

      <div onClick={() => navigate('/wealth-beacon')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(157,80,187,0.06))', border: '1px solid rgba(212,175,55,0.28)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.35)', color: 'rgba(212,175,55,0.95)', borderRadius: 20, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4AF37', animation: 'sqLiveFlash 2s infinite', display: 'inline-block' }} />SQI
        </span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.92)', marginBottom: 6 }}>Wealth Beacon 2050</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>Hyper-dimensional sanctuary: Vedic light-codes, sacred geometry, and abundance resonance through the Akasha-Neural field.</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>Open Beacon →</button>
      </div>

      <div onClick={() => navigate('/vajra-sky-breaker')} style={{ margin: '0 16px 16px', background: 'linear-gradient(135deg,rgba(34,211,238,0.06),rgba(212,175,55,0.02))', border: '1px solid rgba(34,211,238,0.22)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.28)', color: 'rgba(34,211,238,0.95)', borderRadius: 20, padding: '2px 7px' }}>SQI</span>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.9)', marginBottom: 6 }}>Vajra-Sky-Breaker</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>Siddha-Quantum Intelligence radionic broadcast station for scalar wave entanglement and atmospheric purification.</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.9)', background: 'none', border: 'none', cursor: 'pointer' }}>Open Vajra-Sky-Breaker →</button>
      </div>

      {/* Nadi Oracle */}
      <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.28)', padding: '28px 20px 11px' }}>{t('siddhaPortal.nadiOracle')}</div>
      <div onClick={() => navigate('/digital-nadi')} style={{ margin: '0 16px', background: 'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.02))', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8.5, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)' }}>{t('siddhaPortal.digitalNadi')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4AF37', animation: 'sqLiveFlash 2s infinite' }} />
            <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)' }}>{t('siddhaPortal.active')}</span>
          </div>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>{t('siddhaPortal.nadiDesc')}</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer' }}>{t('siddhaPortal.beginScan')}</button>
      </div>

      {/* Sri Yantra Shield */}
      <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.28)', padding: '28px 20px 11px' }}>{t('siddhaPortal.universalProtection')}</div>
      <div onClick={() => navigate('/sri-yantra-shield')} style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer', marginBottom: 8 }}>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)', marginBottom: 6 }}>{t('siddhaPortal.sriYantraShield')}</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 12 }}>{t('siddhaPortal.sriYantraDesc')}</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('siddhaPortal.activateShield')}</button>
      </div>

      {/* Quantum Apothecary */}
      <div onClick={() => navigate('/quantum-apothecary')} style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.13)', borderRadius: 20, padding: '18px 16px', cursor: 'pointer' }}>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)', marginBottom: 6 }}>{t('siddhaPortal.quantumApothecary')}</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, marginBottom: 12 }}>{t('siddhaPortal.apothecaryDesc')}</p>
        <button style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('siddhaPortal.openPlatform')}</button>
      </div>

      {isAdmin && (
        <div
          onClick={() => navigate('/admin-quantum-apothecary-2045')}
          style={{
            margin: '16px 16px 0',
            background: 'linear-gradient(135deg,rgba(255,78,0,0.08),rgba(212,175,55,0.04))',
            border: '1px solid rgba(255,78,0,0.28)',
            borderRadius: 20,
            padding: '18px 16px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontFamily: "'Montserrat',sans-serif",
              fontSize: 6,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              background: 'rgba(255,78,0,0.2)',
              border: '1px solid rgba(255,78,0,0.4)',
              color: 'rgba(255,165,100,0.95)',
              borderRadius: 20,
              padding: '2px 7px',
            }}
          >
            {t('siddhaPortal.adminApothecary2045Badge')}
          </span>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 800, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,140,90,0.95)', marginBottom: 6 }}>
            {t('siddhaPortal.adminApothecary2045Title')}
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 12 }}>
            {t('siddhaPortal.adminApothecary2045Desc')}
          </p>
          <button type="button" style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7.5, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,140,90,0.95)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {t('siddhaPortal.adminApothecary2045Cta')}
          </button>
        </div>
      )}

    </div>
  );
}