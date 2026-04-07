import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;
const pink  = (a: number) => `rgba(244,114,182,${a})`;
const green = (a: number) => `rgba(74,222,128,${a})`;
const amber = (a: number) => `rgba(245,158,11,${a})`;

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.45em',
  textTransform: 'uppercase' as const,
  color: gold(0.45),
};

const SECTION_TITLE: React.CSSProperties = {
  ...LABEL_STYLE,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '32px 20px 14px',
};

const CARD_BASE: React.CSSProperties = {
  background: `rgba(255,255,255,0.025)`,
  border: `1px solid ${gold(0.13)}`,
  borderRadius: 24,
  padding: '20px 18px',
  cursor: 'pointer',
  position: 'relative',
  transition: 'border-color 0.25s ease, background 0.25s ease',
};

const CARD_TITLE: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: gold(0.92),
  marginBottom: 8,
};

const CARD_DESC: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond',serif",
  fontStyle: 'italic',
  fontSize: '0.95rem',
  color: white(0.5),
  lineHeight: 1.6,
  marginBottom: 14,
};

const CTA_BTN: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  color: gold(0.85),
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const BADGE = (bg: string, border: string, color: string): React.CSSProperties => ({
  position: 'absolute',
  top: 14,
  right: 14,
  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize: 8,
  fontWeight: 800,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  background: bg,
  border: `1px solid ${border}`,
  color,
  borderRadius: 20,
  padding: '3px 9px',
});

const LIVE_DOT: React.CSSProperties = {
  display: 'inline-block',
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#D4AF37',
  animation: 'sqLiveFlash 2s infinite',
  marginRight: 5,
  verticalAlign: 'middle',
};

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ margin: '8px 20px', height: 1, background: `linear-gradient(90deg,${gold(0.18)},transparent)` }} />
);

// ─── MASTER CARD (2-col grid item) ───────────────────────────────────────────
interface MasterCardProps {
  titleKey: string;
  subKey: string;
  badge?: string | null;
  href: string;
  delay?: number;
}

const MasterCard = ({ titleKey, subKey, badge, href, delay = 0 }: MasterCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div
      onClick={() => navigate(href)}
      style={{
        ...CARD_BASE,
        padding: '18px 16px 20px',
        animation: `sqFadeUp 0.45s ${delay}s ease both`,
      }}
    >
      {badge && (
        <span style={BADGE(
          badge === 'LIVE' ? gold(0.14) : white(0.07),
          badge === 'LIVE' ? gold(0.3) : white(0.1),
          badge === 'LIVE' ? gold(0.9) : white(0.5),
        )}>
          {badge === 'LIVE' && <span style={LIVE_DOT} />}
          {badge}
        </span>
      )}
      <div style={{ ...CARD_TITLE, fontSize: 12, marginBottom: 6 }}>{t(titleKey)}</div>
      <div style={{ ...CARD_DESC, fontSize: '0.88rem', marginBottom: 0 }}>{t(subKey)}</div>
      <span style={{ position: 'absolute', bottom: 14, right: 16, color: gold(0.3), fontSize: 14 }}>→</span>
    </div>
  );
};

// ─── TOOL CARD (full-width) ───────────────────────────────────────────────────
interface ToolCardProps {
  title: string;
  desc: string;
  cta: string;
  href: string;
  accentColor?: string;
  badge?: string;
  isLive?: boolean;
  delay?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

const ToolCard = ({
  title, desc, cta, href, accentColor, badge, isLive, delay = 0,
  gradientFrom, gradientTo,
}: ToolCardProps) => {
  const navigate = useNavigate();
  const accent = accentColor ?? gold(0.92);
  const gFrom = gradientFrom ?? gold(0.06);
  const gTo   = gradientTo   ?? gold(0.02);
  return (
    <div
      onClick={() => navigate(href)}
      style={{
        ...CARD_BASE,
        background: `linear-gradient(135deg,${gFrom},${gTo})`,
        border: `1px solid ${accentColor ? accentColor.replace(')', ',0.28)').replace('rgba(', 'rgba(') : gold(0.22)}`,
        margin: '0 16px 12px',
        animation: `sqFadeUp 0.45s ${delay}s ease both`,
      }}
    >
      {badge && (
        <span style={BADGE(
          accentColor ? accentColor.replace(/[\d.]+\)$/, '0.14)') : gold(0.14),
          accentColor ? accentColor.replace(/[\d.]+\)$/, '0.32)') : gold(0.3),
          accentColor ?? gold(0.95),
        )}>
          {isLive && <span style={LIVE_DOT} />}
          {badge}
        </span>
      )}
      <div style={{ ...CARD_TITLE, color: accent }}>{title}</div>
      <p style={CARD_DESC}>{desc}</p>
      <button style={{ ...CTA_BTN, color: accent }}>{cta} →</button>
    </div>
  );
};

// ─── ORACLE CARD (full-width, subdued) ────────────────────────────────────────
interface OracleCardProps {
  title: string;
  desc: string;
  cta: string;
  href: string;
  isLive?: boolean;
  delay?: number;
}

const OracleCard = ({ title, desc, cta, href, isLive, delay = 0 }: OracleCardProps) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(href)}
      style={{
        ...CARD_BASE,
        margin: '0 16px 12px',
        animation: `sqFadeUp 0.45s ${delay}s ease both`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={CARD_TITLE}>{title}</div>
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ ...LIVE_DOT, marginRight: 0 }} />
            <span style={{ ...LABEL_STYLE, fontSize: 8, color: gold(0.5) }}>LIVE</span>
          </div>
        )}
      </div>
      <p style={CARD_DESC}>{desc}</p>
      <button style={CTA_BTN}>{cta} →</button>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SiddhaPortal() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { tier, loading } = useMembership();
  const { isAdmin }       = useAdminRole();

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  const masters = [
    { titleKey: 'siddhaPortal.agastyaMuni',  subKey: 'siddhaPortal.agastyaDesc',     badge: 'LIVE', href: '/digital-nadi' },
    { titleKey: 'siddhaPortal.thirumoolar',  subKey: 'siddhaPortal.thirumoolarDesc', badge: null,   href: '/breathing' },
    { titleKey: 'siddhaPortal.nandiDevar',   subKey: 'siddhaPortal.nandiDevarDesc',  badge: null,   href: '/mantras' },
    { titleKey: 'siddhaPortal.bogarSiddhar', subKey: 'siddhaPortal.bogarDesc',       badge: null,   href: '/quantum-apothecary' },
    { titleKey: 'siddhaPortal.patanjali',    subKey: 'siddhaPortal.patanjaliDesc',   badge: 'NEW',  href: '/meditations' },
    { titleKey: 'siddhaPortal.konganar',     subKey: 'siddhaPortal.konganarDesc',    badge: null,   href: '/digital-nadi' },
  ];

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104, maxWidth: 430, margin: '0 auto' }}>
      {/* ── HEADER ── */}
      <div style={{ padding: '52px 20px 0', animation: 'sqFadeUp 0.35s ease both' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ ...LABEL_STYLE, fontSize: 9, color: gold(0.4), background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >
          ← {t('siddhaPortal.back')}
        </button>
        <p style={{ ...LABEL_STYLE, fontSize: 9, color: gold(0.35), marginBottom: 8 }}>
          {t('siddhaPortal.label')}
        </p>
        <h1 style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '2.4rem',
          fontWeight: 600,
          color: white(0.92),
          lineHeight: 1.1,
          margin: 0,
        }}>
          {t('siddhaPortal.title')}
        </h1>
        <p style={{ ...CARD_DESC, marginBottom: 0, marginTop: 10 }}>
          {t('siddhaPortal.subtitle')}
        </p>
      </div>

      {/* ── SRI YANTRA ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 20px' }}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" style={{ animation: 'sqBreathe 7s ease-in-out infinite', opacity: 0.75 }}>
          <polygon points="12,2.2 21.8,19.5 2.2,19.5" stroke={gold(0.8)} strokeWidth="1.3" fill="none"/>
          <polygon points="12,21.8 2.2,4.5 21.8,4.5" stroke={gold(0.65)} strokeWidth="1.1" fill="none"/>
          <circle cx="12" cy="12" r="1.8" fill={gold(0.95)}/>
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — SIDDHA MASTERS
      ══════════════════════════════════════════════════════════ */}
      <div style={SECTION_TITLE}>
        <span>📿</span>
        <span>{t('siddhaPortal.label') || 'SIDDHA LINEAGE'}</span>
      </div>
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {masters.map(({ titleKey, subKey, badge, href }, i) => (
          <MasterCard key={titleKey} titleKey={titleKey} subKey={subKey} badge={badge} href={href} delay={0.05 * i} />
        ))}
      </div>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — SQI TOOLS
      ══════════════════════════════════════════════════════════ */}
      <div style={SECTION_TITLE}>
        <span>⚛</span>
        <span>SQI 2050 — ACTIVATED TOOLS</span>
      </div>

      <ToolCard
        title="Akasha-Neural Weaver"
        desc="Siddha-Quantum Intelligence interface. Access the Akasha-Neural Archive. Bhakti-Algorithms & Prema-Pulse Transmissions for DNA activation."
        cta="Activate"
        href="/akasha-neural-weaver"
        badge="SQI" isLive
        accentColor={gold(0.92)}
        gradientFrom={gold(0.07)} gradientTo={gold(0.02)}
        delay={0.05}
      />
      <ToolCard
        title={t('siddhaPortal.photonicNodeTitle') || 'Siddha Photonic Regeneration'}
        desc={t('siddhaPortal.photonicNodeDesc') || 'High-frequency scalar interface for Central Sun entanglement and pineal radiance beaming.'}
        cta={t('siddhaPortal.photonicNodeCta') || 'Open Node'}
        href="/siddha-photonic-regeneration"
        badge="SQI"
        accentColor={cyan(0.9)}
        gradientFrom={cyan(0.06)} gradientTo={gold(0.02)}
        delay={0.1}
      />
      <ToolCard
        title={t('siddhaPortal.hairGrowthTitle') || 'Siddha Hair Growth Protocol'}
        desc={t('siddhaPortal.hairGrowthDesc') || 'Vedic light-code activation for follicular regeneration and scalp pranic field restoration.'}
        cta={t('siddhaPortal.hairGrowthCta') || 'Enter Protocol'}
        href="/siddha-hair-growth"
        badge="SQI"
        accentColor={gold(0.92)}
        gradientFrom="rgba(180,83,9,0.08)" gradientTo={gold(0.03)}
        delay={0.15}
      />
      <ToolCard
        title="Shakti Cycle Intelligence"
        desc="Cycle tracking + hormonal phase protocol with secretion confirmation, dosha sync, and tiered guidance."
        cta="Enter Module"
        href="/sovereign-hormonal-alchemy"
        badge="NEW"
        accentColor={pink(0.88)}
        gradientFrom={pink(0.07)} gradientTo={gold(0.02)}
        delay={0.2}
      />
      <ToolCard
        title={t('womanCode.navExplore.title') || 'WomanCode'}
        desc={t('womanCode.navExplore.sub') || 'Hormonal intelligence, cycle syncing, and feminine Vedic wisdom in one dashboard.'}
        cta={t('womanCode.navExplore.cta') || 'Open Dashboard'}
        href="/womancode"
        badge="SQI"
        accentColor={pink(0.78)}
        gradientFrom={pink(0.05)} gradientTo={gold(0.02)}
        delay={0.25}
      />
      <ToolCard
        title="Aetheric Heliostat"
        desc="High-frequency scalar interface for Central Sun entanglement and pineal radiance beaming."
        cta="Open Heliostat"
        href="/aetheric-heliostat"
        badge="SQI"
        accentColor={amber(0.88)}
        gradientFrom={amber(0.06)} gradientTo={gold(0.02)}
        delay={0.3}
      />
      <ToolCard
        title="Atmospheric Clearance Engine"
        desc="Industrial-spiritual vacuum for mental obstructions, metallic density, and aetheric fog."
        cta="Open Engine"
        href="/atmospheric-clearance-engine"
        badge="SQI"
        accentColor={green(0.88)}
        gradientFrom={green(0.06)} gradientTo={gold(0.02)}
        delay={0.35}
      />
      <ToolCard
        title="Wealth Beacon 2050"
        desc="Hyper-dimensional sanctuary: Vedic light-codes, sacred geometry, and abundance resonance through the Akasha-Neural field."
        cta="Open Beacon"
        href="/wealth-beacon"
        badge="SQI" isLive
        accentColor={gold(0.92)}
        gradientFrom={gold(0.1)} gradientTo="rgba(157,80,187,0.06)"
        delay={0.4}
      />
      <ToolCard
        title="Vajra-Sky-Breaker"
        desc="Siddha-Quantum radionic broadcast station for scalar wave entanglement and atmospheric purification."
        cta="Open Vajra"
        href="/vajra-sky-breaker"
        badge="SQI"
        accentColor={cyan(0.9)}
        gradientFrom={cyan(0.06)} gradientTo={gold(0.02)}
        delay={0.45}
      />

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — SACRED ORACLES
      ══════════════════════════════════════════════════════════ */}
      <div style={SECTION_TITLE}>
        <span>🔱</span>
        <span>SACRED ORACLES & PROTECTION</span>
      </div>

      <OracleCard
        title={t('siddhaPortal.digitalNadi') || 'Digital Nadi Oracle'}
        desc={t('siddhaPortal.nadiDesc') || 'AI-powered Nadi astrology reading — ancient palm-leaf wisdom decoded through quantum algorithms.'}
        cta={t('siddhaPortal.beginScan') || 'Begin Scan'}
        href="/digital-nadi"
        isLive
        delay={0.05}
      />
      <OracleCard
        title={t('siddhaPortal.sriYantraShield') || 'Sri Yantra Shield'}
        desc={t('siddhaPortal.sriYantraDesc') || 'Sacred geometric protection field — activate the eternal yantra for energetic sovereignty.'}
        cta={t('siddhaPortal.activateShield') || 'Activate Shield'}
        href="/sri-yantra-shield"
        delay={0.1}
      />
      <OracleCard
        title={t('siddhaPortal.quantumApothecary') || 'Quantum Apothecary'}
        desc={t('siddhaPortal.apothecaryDesc') || 'Siddha herbal intelligence meets quantum field medicine — receive your personalised remedy transmission.'}
        cta={t('siddhaPortal.openPlatform') || 'Open Platform'}
        href="/quantum-apothecary"
        delay={0.15}
      />

      {isAdmin && (
        <div
          onClick={() => navigate('/admin-quantum-apothecary-2045')}
          style={{
            ...CARD_BASE,
            background: 'linear-gradient(135deg,rgba(255,78,0,0.08),rgba(212,175,55,0.04))',
            border: '1px solid rgba(255,78,0,0.28)',
            margin: '0 16px 12px',
            animation: 'sqFadeUp 0.45s 0.2s ease both',
          }}
        >
          <span style={BADGE('rgba(255,78,0,0.2)', 'rgba(255,78,0,0.4)', 'rgba(255,165,100,0.95)')}>
            {t('siddhaPortal.adminApothecary2045Badge') || 'ADMIN'}
          </span>
          <div style={{ ...CARD_TITLE, color: 'rgba(255,140,90,0.95)' }}>
            {t('siddhaPortal.adminApothecary2045Title') || 'Admin — Apothecary 2045'}
          </div>
          <p style={CARD_DESC}>{t('siddhaPortal.adminApothecary2045Desc') || 'Backend management for Quantum Apothecary sessions and content.'}</p>
          <button style={{ ...CTA_BTN, color: 'rgba(255,140,90,0.95)' }}>
            {t('siddhaPortal.adminApothecary2045Cta') || 'Open Admin'} →
          </button>
        </div>
      )}

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes sqFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sqBreathe {
          0%, 100% { transform: scale(1);    opacity: 0.75; }
          50%       { transform: scale(1.07); opacity: 0.95; }
        }
        @keyframes sqLiveFlash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}