import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
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
      <button type="button" style={{ ...CTA_BTN, color: accent }}>{cta}</button>
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
  const { t } = useTranslation();
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
            <span style={{ ...LABEL_STYLE, fontSize: 8, color: gold(0.5) }}>{t('siddhaPortal.badgeLive')}</span>
          </div>
        )}
      </div>
      <p style={CARD_DESC}>{desc}</p>
      <button type="button" style={CTA_BTN}>{cta}</button>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SiddhaPortal() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { tier, loading, settled } = useMembership();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  // Siddha-Quantum (rank 2) and above — align with FEATURE_TIER.siddhaPortal
  useEffect(() => {
    if (!loading && settled && !adminLoading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, settled, adminLoading, navigate]);


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

      {/* ── AGASTYAR ACADEMY HERO ── */}
      <div style={{ position: 'relative', margin: '24px 16px 8px' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: -14,
            borderRadius: 32,
            background: `radial-gradient(60% 60% at 30% 40%, ${gold(0.35)}, transparent 70%), radial-gradient(60% 60% at 75% 65%, ${cyan(0.28)}, transparent 70%)`,
            filter: 'blur(22px)',
            animation: 'sqGlowPulse 4s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          onClick={() => navigate('/agastyar-academy')}
          style={{
            position: 'relative',
            zIndex: 1,
            background: `linear-gradient(135deg, rgba(212,175,55,0.10), rgba(0,242,254,0.05) 60%, rgba(5,5,5,0.6))`,
            border: `1px solid ${gold(0.45)}`,
            borderRadius: 24,
            padding: '22px 20px 20px',
            cursor: 'pointer',
            boxShadow: `0 0 40px ${gold(0.25)}, 0 0 80px ${cyan(0.12)}, inset 0 0 30px rgba(212,175,55,0.06)`,
          }}
        >
          <div style={{ ...LABEL_STYLE, fontSize: 9, color: gold(0.7), marginBottom: 10 }}>
            ⚜ Academy · 108 Modules
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: '1.85rem',
            fontWeight: 600,
            color: white(0.96),
            lineHeight: 1.1,
            margin: 0,
            textShadow: `0 0 18px ${gold(0.35)}`,
          }}>
            Agastyar Academy
          </h2>
          <p style={{ ...CARD_DESC, marginTop: 8, marginBottom: 14, color: white(0.62) }}>
            The complete path of Ayurvedic mastery — from Atma-Seed to Akasha-Infinity.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Free', color: white(0.55) },
              { label: 'Prana', color: green(0.85) },
              { label: 'Siddha', color: cyan(0.9) },
              { label: 'Akasha', color: gold(0.95) },
            ].map((t) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                <span style={{ ...LABEL_STYLE, fontSize: 8, color: t.color, letterSpacing: '0.25em' }}>{t.label}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 999,
            background: `linear-gradient(135deg, ${gold(0.25)}, ${gold(0.08)})`,
            border: `1px solid ${gold(0.5)}`,
            color: gold(0.98),
            fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}>
            Enter Academy →
          </div>
        </div>
      </div>

      {/* ── SRI YANTRA ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 20px' }}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" style={{ animation: 'sqBreathe 7s ease-in-out infinite', opacity: 0.75 }}>
          <polygon points="12,2.2 21.8,19.5 2.2,19.5" stroke={gold(0.8)} strokeWidth="1.3" fill="none"/>
          <polygon points="12,21.8 2.2,4.5 21.8,4.5" stroke={gold(0.65)} strokeWidth="1.1" fill="none"/>
          <circle cx="12" cy="12" r="1.8" fill={gold(0.95)}/>
        </svg>
      </div>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — SQI TOOLS
      ══════════════════════════════════════════════════════════ */}
      <div style={SECTION_TITLE}>
        <span>⚛</span>
        <span>{t('siddhaPortal.sectionTools')}</span>
      </div>

      <ToolCard
        title={t('siddhaPortal.photonicNodeTitle')}
        desc={t('siddhaPortal.photonicNodeDesc')}
        cta={t('siddhaPortal.photonicNodeCta')}
        href="/siddha-photonic-regeneration"
        badge={t('siddhaPortal.badgeSqi')}
        accentColor={cyan(0.9)}
        gradientFrom={cyan(0.06)} gradientTo={gold(0.02)}
        delay={0.1}
      />
      <ToolCard
        title={t('siddhaPortal.hairGrowthTitle')}
        desc={t('siddhaPortal.hairGrowthDesc')}
        cta={t('siddhaPortal.hairGrowthCta')}
        href="/siddha-hair-growth"
        badge={t('siddhaPortal.badgeSqi')}
        accentColor={gold(0.92)}
        gradientFrom="rgba(180,83,9,0.08)" gradientTo={gold(0.03)}
        delay={0.15}
      />
      <ToolCard
        title={t('siddhaPortal.shaktiTitle')}
        desc={t('siddhaPortal.shaktiDesc')}
        cta={t('siddhaPortal.shaktiCta')}
        href={
          hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)
            ? '/sovereign-hormonal-alchemy'
            : '/siddha-quantum'
        }
        badge={t('siddhaPortal.badgeNew')}
        accentColor={pink(0.88)}
        gradientFrom={pink(0.07)} gradientTo={gold(0.02)}
        delay={0.2}
      />
      <ToolCard
        title={t('siddhaPortal.aethericTitle')}
        desc={t('siddhaPortal.aethericDesc')}
        cta={t('siddhaPortal.aethericCta')}
        href="/aetheric-heliostat"
        badge={t('siddhaPortal.badgeSqi')}
        accentColor={amber(0.88)}
        gradientFrom={amber(0.06)} gradientTo={gold(0.02)}
        delay={0.3}
      />
      <ToolCard
        title={t('siddhaPortal.atmosphericTitle')}
        desc={t('siddhaPortal.atmosphericDesc')}
        cta={t('siddhaPortal.atmosphericCta')}
        href="/atmospheric-clearance-engine"
        badge={t('siddhaPortal.badgeSqi')}
        accentColor={green(0.88)}
        gradientFrom={green(0.06)} gradientTo={gold(0.02)}
        delay={0.35}
      />
      <ToolCard
        title={t('siddhaPortal.wealthBeaconTitle')}
        desc={t('siddhaPortal.wealthBeaconDesc')}
        cta={t('siddhaPortal.wealthBeaconCta')}
        href="/wealth-beacon"
        badge={t('siddhaPortal.badgeSqi')}
        isLive
        accentColor={gold(0.92)}
        gradientFrom={gold(0.1)} gradientTo="rgba(157,80,187,0.06)"
        delay={0.4}
      />
      <ToolCard
        title={t('siddhaPortal.vajraTitle')}
        desc={t('siddhaPortal.vajraDesc')}
        cta={t('siddhaPortal.vajraCta')}
        href="/vajra-sky-breaker"
        badge={t('siddhaPortal.badgeSqi')}
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
        <span>{t('siddhaPortal.sectionOracles')}</span>
      </div>

      <OracleCard
        title={t('siddhaPortal.digitalNadiOracleTitle')}
        desc={t('siddhaPortal.nadiDesc')}
        cta={t('siddhaPortal.beginScan')}
        href="/digital-nadi"
        isLive
        delay={0.05}
      />
      <OracleCard
        title={t('siddhaPortal.sriYantraShield')}
        desc={t('siddhaPortal.sriYantraDesc')}
        cta={t('siddhaPortal.activateShield')}
        href="/sri-yantra-shield"
        delay={0.1}
      />
      <OracleCard
        title={t('siddhaPortal.palmOracleTitle')}
        desc={t('siddhaPortal.palmOracleDesc')}
        cta={t('siddhaPortal.palmOracleCta')}
        href="/hand-analyzer"
        delay={0.25}
      />
      <OracleCard
        title={t('siddhaPortal.akashicDecoderTitle')}
        desc={t('siddhaPortal.akashicDecoderDesc')}
        cta={t('siddhaPortal.akashicDecoderCta')}
        href="/akashic-records"
        delay={0.3}
      />
      <OracleCard
        title={t('siddhaPortal.vayuTitle')}
        desc={t('siddhaPortal.vayuDesc')}
        cta={t('siddhaPortal.vayuCta')}
        href="/vayu-protocol"
        delay={0.35}
      />

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