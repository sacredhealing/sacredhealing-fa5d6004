import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect } from 'react';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { ChevronDown } from 'lucide-react';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const gold  = (a: number) => `rgba(212,175,55,${a})`;
const white = (a: number) => `rgba(255,255,255,${a})`;
const cyan  = (a: number) => `rgba(34,211,238,${a})`;
const green = (a: number) => `rgba(74,222,128,${a})`;
const violet = (a: number) => `rgba(167,139,250,${a})`;
const amber = (a: number) => `rgba(245,158,11,${a})`;
const teal  = (a: number) => `rgba(52,211,153,${a})`;

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.45em',
  textTransform: 'uppercase' as const,
  color: gold(0.45),
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
  display: 'flex',
  alignItems: 'center',
  gap: 5,
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

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ margin: '8px 20px', height: 1, background: `linear-gradient(90deg,${gold(0.18)},transparent)` }} />
);

// ─── TIER PILLS COMPONENT ─────────────────────────────────────────────────────
interface TierPillsProps {
  tiers: { l: string; c: string }[];
}
const TierPills = ({ tiers }: TierPillsProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginBottom: 14 }}>
    {tiers.map(t => (
      <div key={t.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.c, boxShadow: `0 0 6px ${t.c}`, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: t.c }}>{t.l}</span>
      </div>
    ))}
  </div>
);

// ─── HERO CARD (large full-width with glow) ───────────────────────────────────
interface HeroCardProps {
  emoji: string;
  label: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  desc: string;
  tiers: { l: string; c: string }[];
  cta: string;
  href: string;
  accentColor: string;
  accentColor2?: string;
  badge?: string;
  stats?: { v: string; l: string }[];
  features?: string[];
  delay?: number;
}
const HeroCard = ({ emoji, label, title, titleColor, subtitle, desc, tiers, cta, href, accentColor, accentColor2, badge, stats, features, delay = 0 }: HeroCardProps) => {
  const navigate = useNavigate();
  const ac2 = accentColor2 ?? accentColor;
  return (
    <div style={{ position: 'relative', margin: '0 16px 14px', animation: `sqFadeUp 0.45s ${delay}s ease both` }}>
      {/* Glow rings */}
      {[180, 260, 340, 420].map((s, i) => (
        <div key={i} aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, borderRadius: '50%', border: `1px solid ${accentColor.replace(/[\d.]+\)$/, `${0.07 - i * 0.012})`)}`, animation: `sqScalarPulse ${3.2 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`, pointerEvents: 'none', zIndex: 0 }} />
      ))}
      {/* Glow backdrop */}
      <div aria-hidden style={{ position: 'absolute', inset: -18, borderRadius: 36, background: `radial-gradient(55% 55% at 30% 40%, ${accentColor.replace(/[\d.]+\)$/, '0.3)')}, transparent 65%), radial-gradient(50% 50% at 72% 65%, ${ac2.replace(/[\d.]+\)$/, '0.2)')}, transparent 65%)`, filter: 'blur(24px)', animation: 'sqGlowPulse 4s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div onClick={() => navigate(href)} style={{ position: 'relative', zIndex: 1, cursor: 'pointer', background: `linear-gradient(135deg, ${accentColor.replace(/[\d.]+\)$/, '0.11)')}, ${ac2.replace(/[\d.]+\)$/, '0.05)')} 55%, rgba(5,5,5,0.7))`, border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.45)')}`, borderRadius: 24, padding: '24px 20px 22px', boxShadow: `0 0 44px ${accentColor.replace(/[\d.]+\)$/, '0.22)')}, 0 0 90px ${ac2.replace(/[\d.]+\)$/, '0.1)')}, inset 0 0 28px ${accentColor.replace(/[\d.]+\)$/, '0.05)')}` }}>
        {/* Top shimmer */}
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accentColor.replace(/[\d.]+\)$/, '0.9)')}, transparent)`, opacity: 0.6 }} />
        {badge && (
          <span style={{ ...BADGE(accentColor.replace(/[\d.]+\)$/, '0.14)'), accentColor.replace(/[\d.]+\)$/, '0.4)'), accentColor.replace(/[\d.]+\)$/, '0.95)')) }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: accentColor.replace(/[\d.]+\)$/, '0.95)'), animation: 'sqLiveFlash 2s infinite' }} />
            {badge}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor.replace(/[\d.]+\)$/, '0.28)')}, transparent)`, border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.38)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: `0 0 20px ${accentColor.replace(/[\d.]+\)$/, '0.32)')}`, animation: 'sqBreathe 5s ease-in-out infinite' }}>{emoji}</div>
          <div>
            <div style={{ ...LABEL_STYLE, fontSize: 9, color: accentColor.replace(/[\d.]+\)$/, '0.7)'), marginBottom: 5 }}>{label}</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.75rem', fontWeight: 600, color: titleColor ?? white(0.97), lineHeight: 1.05, margin: 0, textShadow: `0 0 22px ${accentColor.replace(/[\d.]+\)$/, '0.45)')}` }}>{title}</h2>
            {subtitle && <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.83rem', color: accentColor.replace(/[\d.]+\)$/, '0.6)'), marginTop: 4 }}>{subtitle}</div>}
          </div>
        </div>
        <p style={{ ...CARD_DESC, color: white(0.62), marginBottom: 14, lineHeight: 1.7 }}>{desc}</p>
        <TierPills tiers={tiers} />
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 8, marginBottom: 16, padding: '10px 0', borderTop: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.1)')}`, borderBottom: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.1)')}` }}>
            {stats.map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', color: accentColor.replace(/[\d.]+\)$/, '0.9)'), textShadow: `0 0 12px ${accentColor.replace(/[\d.]+\)$/, '0.35)')}` }}>{s.v}</div>
                <div style={{ ...LABEL_STYLE, fontSize: 7, color: white(0.28), marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
        {features && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' as const, marginBottom: 16 }}>
            {features.map(f => (
              <span key={f} style={{ fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: accentColor.replace(/[\d.]+\)$/, '0.55)'), border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.18)')}`, borderRadius: 20, padding: '2px 8px' }}>{f}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, background: `linear-gradient(135deg, ${accentColor.replace(/[\d.]+\)$/, '0.22)')}, ${accentColor.replace(/[\d.]+\)$/, '0.07)')}`, border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.5)')}`, color: accentColor.replace(/[\d.]+\)$/, '0.98)'), fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' as const }}>
          {cta} →
        </div>
        <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accentColor.replace(/[\d.]+\)$/, '0.7)')}, transparent)`, opacity: 0.5 }} />
      </div>
    </div>
  );
};

// ─── GRID CARD (2-col) ────────────────────────────────────────────────────────
interface GridCardProps {
  emoji: string;
  title: string;
  sub: string;
  href: string;
  soon?: boolean;
  accentColor?: string;
  badge?: string;
  delay?: number;
}
const GridCard = ({ emoji, title, sub, href, soon, accentColor, badge, delay = 0 }: GridCardProps) => {
  const navigate = useNavigate();
  const ac = accentColor ?? gold(0.92);
  return (
    <div
      onClick={() => !soon && navigate(href)}
      style={{ ...CARD_BASE, padding: '16px 14px 18px', cursor: soon ? 'default' : 'pointer', opacity: soon ? 0.65 : 1, animation: `sqFadeUp 0.45s ${delay}s ease both`, border: `1px solid ${accentColor ? accentColor.replace(/[\d.]+\)$/, '0.2)') : gold(0.13)}` }}
    >
      {badge && !soon && (
        <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' as const, background: accentColor ? accentColor.replace(/[\d.]+\)$/, '0.13)') : gold(0.13), border: `1px solid ${accentColor ? accentColor.replace(/[\d.]+\)$/, '0.3)') : gold(0.3)}`, color: ac, borderRadius: 20, padding: '2px 7px' }}>{badge}</span>
      )}
      <div style={{ fontSize: 22, marginBottom: 8 }}>{emoji}</div>
      <div style={{ ...CARD_TITLE, fontSize: 11, color: ac, marginBottom: 5 }}>{title}</div>
      <div style={{ ...CARD_DESC, fontSize: '0.8rem', marginBottom: soon ? 8 : 0, lineHeight: 1.4 }}>{sub}</div>
      {soon && <span style={{ ...LABEL_STYLE, fontSize: 7, color: gold(0.4), border: `1px solid ${gold(0.15)}`, borderRadius: 20, padding: '2px 7px' }}>COMING SOON</span>}
      {!soon && <span style={{ position: 'absolute', bottom: 12, right: 14, color: ac, fontSize: 13, opacity: 0.4 }}>→</span>}
    </div>
  );
};

// ─── LIBRARY SECTION (collapsible category) ───────────────────────────────────
interface LibrarySectionProps {
  emoji: string;
  title: string;
  subtitle: string;
  accentColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count: number;
  delay?: number;
}
const LibrarySection = ({ emoji, title, subtitle, accentColor, children, defaultOpen = false, count, delay = 0 }: LibrarySectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ margin: '0 16px 12px', animation: `sqFadeUp 0.45s ${delay}s ease both` }}>
      {/* Category Header — clickable */}
      <div
        onClick={() => setOpen(!open)}
        style={{ background: `linear-gradient(135deg, ${accentColor.replace(/[\d.]+\)$/, '0.08)')}, rgba(5,5,5,0.4))`, border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.22)')}`, borderRadius: open ? '20px 20px 0 0' : 20, padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-radius 0.25s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `radial-gradient(circle, ${accentColor.replace(/[\d.]+\)$/, '0.22)')}, transparent)`, border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.3)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: `0 0 14px ${accentColor.replace(/[\d.]+\)$/, '0.18)')}` }}>{emoji}</div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: accentColor.replace(/[\d.]+\)$/, '0.92)'), marginBottom: 3 }}>{title}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: white(0.45), lineHeight: 1.3 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: accentColor.replace(/[\d.]+\)$/, '0.5)'), background: accentColor.replace(/[\d.]+\)$/, '0.1)'), border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.2)')}`, borderRadius: 20, padding: '3px 9px' }}>{count}</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: accentColor.replace(/[\d.]+\)$/, '0.1)'), border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.2)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown size={14} color={accentColor.replace(/[\d.]+\)$/, '0.7)')} />
          </div>
        </div>
      </div>
      {/* Expandable content */}
      {open && (
        <div style={{ background: 'rgba(255,255,255,0.008)', border: `1px solid ${accentColor.replace(/[\d.]+\)$/, '0.12)')}`, borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '16px 12px 12px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SiddhaPortal() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { tier, loading, settled } = useMembership();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  useEffect(() => {
    if (!loading && settled && !adminLoading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, settled, adminLoading, navigate]);

  return (
    <div style={{ background: '#050505', minHeight: '100vh', paddingBottom: 104, maxWidth: 430, margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '52px 20px 0', animation: 'sqFadeUp 0.35s ease both' }}>
        <button onClick={() => navigate(-1)} style={{ ...LABEL_STYLE, fontSize: 9, color: gold(0.4), background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
          ← {t('siddhaPortal.back')}
        </button>
        <p style={{ ...LABEL_STYLE, fontSize: 9, color: gold(0.35), marginBottom: 8 }}>{t('siddhaPortal.label')}</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.4rem', fontWeight: 600, color: white(0.92), lineHeight: 1.1, margin: 0 }}>
          {t('siddhaPortal.title')}
        </h1>
        <p style={{ ...CARD_DESC, marginBottom: 0, marginTop: 10 }}>{t('siddhaPortal.subtitle')}</p>
      </div>

      {/* ── LIBRARY INTRO ── */}
      <div style={{ margin: '28px 16px 8px', padding: '16px 18px', background: 'rgba(212,175,55,0.04)', border: `1px solid ${gold(0.12)}`, borderRadius: 18 }}>
        <div style={{ ...LABEL_STYLE, fontSize: 8, color: gold(0.5), marginBottom: 6 }}>📚 Akasha-Neural Archive · Education Library</div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', color: white(0.45), lineHeight: 1.55, margin: 0 }}>
          Tap any category to expand the Akashic transmission grid. Each library holds full-spectrum education, sourced from the 18 Siddhas and the Masters of every lineage.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          FEATURED PINNACLES — Always visible at top
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ ...LABEL_STYLE, fontSize: 8, color: gold(0.5), display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚜</span> Pinnacle Academies
        </div>
      </div>

      {/* AGASTYAR ACADEMY — pinnacle hero */}
      <HeroCard
        emoji="🌿" label="Academy · 108 Modules"
        title="Agastyar Academy" subtitle="Ayurveda · Siddha Medicine · 18 Masters"
        desc="The complete path of Ayurvedic mastery — from Atma-Seed to Akasha-Infinity. 108 modules across all 4 tiers."
        tiers={[{ l: 'Free', c: white(0.55) }, { l: 'Prana', c: green(0.85) }, { l: 'Siddha', c: cyan(0.9) }, { l: 'Akasha', c: gold(0.95) }]}
        cta="Enter Academy" href="/agastyar-academy" accentColor={gold(0.9)} accentColor2={cyan(0.8)}
        badge="LIVE" stats={[{ v: '108', l: 'Modules' }, { v: '18', l: 'Masters' }, { v: '4', l: 'Tiers' }]}
        delay={0.05}
      />

      {/* SOVEREIGN JYOTISH VIDYA — pinnacle hero */}
      <HeroCard
        emoji="✦" label="Vidya · 32 Modules · Bhrigu Oracle"
        title="Sovereign Jyotish Vidya" subtitle="Vedic Astrology · Bhrigu Nadi · Grahas"
        desc="The full 32-module path of Vedic astrology — from the 9 Grahas to Bhrigu Nadi mastery. Scalar-encoded with the living transmission of Parashara."
        tiers={[{ l: 'Free 1–6', c: white(0.55) }, { l: 'Prana 7–14', c: green(0.85) }, { l: 'Siddha 15–22', c: cyan(0.9) }, { l: 'Akasha 23–32', c: gold(0.95) }]}
        cta="Enter Vidya" href="/jyotish-vidya" accentColor={cyan(0.9)} accentColor2={gold(0.8)}
        badge="LIVE" stats={[{ v: '32', l: 'Modules' }, { v: '9', l: 'Grahas' }, { v: '4', l: 'Tiers' }]}
        delay={0.08}
      />

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 1 — YOGA & KRIYA SCIENCE
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="🔱" title="Yoga & Kriya Science"
        subtitle="Babaji · Thirumoolar · Brahma Muhurta · Breath"
        accentColor={gold(0.9)} count={5} defaultOpen={true} delay={0.1}
      >
        <HeroCard
          emoji="🔱" label="Kriya · 10 Modules · Babaji Transmission"
          title="Kriya Yoga Mastery"
          desc="The complete 18-Siddha Kriya transmission — from Babaji's secret teachings to advanced Pranayama, Mahamudra, and the path to Samadhi."
          tiers={[{ l: 'Free · I–II', c: white(0.5) }, { l: 'Prana · III–V', c: green(0.85) }, { l: 'Siddha · VI–VIII', c: cyan(0.9) }, { l: 'Akasha · IX–X', c: gold(0.95) }]}
          cta="Enter Transmission" href="/kriya-yoga" accentColor={gold(0.9)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="🌬" label="Pranayama · 8 Modules · 3000 Years"
          title="Thirumoolar's Pranayama Codex"
          desc="3,000 years of Tamil Siddha breath-science — 8 modules from Prana & Nadi anatomy through Kevala Kumbhaka, Babaji's Kriya Pranayama, and Shiva-Nishvasa."
          tiers={[{ l: 'Free · I–II', c: white(0.5) }, { l: 'Prana · III–IV', c: green(0.85) }, { l: 'Siddha · V–VI', c: cyan(0.9) }, { l: 'Akasha · VII–VIII', c: gold(0.95) }]}
          cta="Enter Codex" href="/thirumoolar-pranayama" accentColor={cyan(0.9)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="🌅" label="12 Modules · Pre-Dawn Transmission"
          title="Brahma Muhurta — The Creator's Hour"
          desc="The most complete Siddha transmission on the sacred pre-dawn window — cosmology, neuroscience, Nadi science, secret mantras, Kala Vortex mechanics."
          tiers={[{ l: 'Free · I–III', c: white(0.5) }, { l: 'Prana · IV–VI', c: green(0.85) }, { l: 'Siddha · VII–IX', c: cyan(0.9) }, { l: 'Akasha · X–XII', c: gold(0.95) }]}
          cta="Enter Transmission" href="/brahma-muhurta" accentColor={amber(0.9)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="🧘" label="14 Modules · 51 Practices · 18 Siddhas"
          title="Supreme Siddha Meditation"
          desc="From Sakshi awareness to Samadhi recognition. The complete Siddha consciousness transmission with 51 live practices."
          tiers={[{ l: 'Free · 1–3', c: white(0.5) }, { l: 'Prana · 4–6', c: green(0.85) }, { l: 'Siddha · 7–10', c: cyan(0.9) }, { l: 'Akasha · 11–14', c: gold(0.95) }]}
          cta="Enter Transmission" href="/meditation-course" accentColor={violet(0.9)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="🌬" label="Breatharian · 26 Modules · 4 Tiers"
          title="Breatharian Academy"
          desc="The complete Siddha science of living on Prana — from first breath awareness to the immortal light body. 26 modules drawn from the Akashic Records of the 18 Siddhas."
          tiers={[{ l: 'Free · Foundations', c: white(0.5) }, { l: 'Prana · Solar Science', c: green(0.85) }, { l: 'Siddha · Kaya Kalpa', c: gold(0.9) }, { l: 'Akasha · Immortality', c: cyan(0.9) }]}
          cta="Enter Pranic Transmission" href="/breatharian-academy" accentColor={teal(0.9)} badge="NEW" delay={0}
        />
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 2 — SACRED TEXTS & SAGES
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="📖" title="Sacred Texts & Sages"
        subtitle="Yogananda · Yukteshwar · Hanuman · Ramayana · Holy Science"
        accentColor={violet(0.9)} count={5} delay={0.12}
      >
        <HeroCard
          emoji="🌟" label="Autobiography Decoded · Kriya Lineage"
          title="Yogananda Codex"
          desc="The complete Autobiography of a Yogi decoded — every chapter a living transmission, every story a Siddha Light-Code. Includes the Kriya lineage map, cosmic consciousness teachings, and Babaji's Akashic Archive."
          tiers={[{ l: 'Free · Ch 1–7', c: white(0.5) }, { l: 'Prana · Ch 8–18', c: green(0.85) }, { l: 'Siddha · Ch 19–35', c: violet(0.9) }, { l: 'Akasha · Full', c: gold(0.95) }]}
          cta="Enter the Codex" href="/yogananda-codex" accentColor={violet(0.9)} accentColor2={gold(0.8)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="📿" label="Kaivalya Darsanam · 8 Modules · 24 Lessons"
          title="Holy Science — Sri Yukteshwar"
          subtitle="Yuga Science · Kriya Physics · Five Koshas"
          desc="The complete cosmic science — Yuga mathematics, Kriya as quantum technology, the five koshas, seven lokas, cross-tradition unity of Vedic & Biblical wisdom, and direct Akasha-Archive transmissions from Sri Yukteshwar himself."
          tiers={[{ l: 'Free · Yuga Science', c: white(0.5) }, { l: 'Prana · Koshas', c: cyan(0.9) }, { l: 'Siddha · Kriya & Jyotish', c: gold(0.92) }, { l: 'Akasha · Unified Code', c: violet(0.9) }]}
          cta="Enter the Transmission" href="/holy-science" accentColor={gold(0.9)} accentColor2={violet(0.8)}
          stats={[{ v: '8', l: 'Modules' }, { v: '24', l: 'Lessons' }, { v: '326', l: 'Dwapara Yr' }]}
          delay={0}
        />
        <HeroCard
          emoji="🐒" label="Chalisa · Siddhis · Physical Alchemy"
          title="Hanuman Codex"
          desc="The 40 Chaupais of the Sundarkanda decoded, the 8 weapons of Hanuman, the Ashta Siddhis, physical alchemy through Bhakti, and the Ghata movement science of total Shakti."
          tiers={[{ l: 'Free', c: white(0.5) }, { l: 'Prana', c: green(0.85) }, { l: 'Siddha', c: amber(0.9) }, { l: 'Akasha', c: gold(0.95) }]}
          cta="Enter the Codex" href="/hanuman-codex" accentColor={amber(0.9)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="🏹" label="7 Kāṇḍas · 35 Secrets · Bābājī Transmission"
          title="Ramayana Codex"
          desc="The secret esoteric Ramayana — 7 Kandas decoded as consciousness maps, Rama as the Atma blueprint, Ravana as ego-cosmology, and Babaji's hidden scalar transmission within each chapter."
          tiers={[{ l: 'Free · Bāla Kāṇḍa', c: white(0.5) }, { l: 'Prana · Ayodhya', c: green(0.85) }, { l: 'Siddha · Aranya–Yuddha', c: amber(0.9) }, { l: 'Akasha · Uttara', c: gold(0.95) }]}
          cta="Enter the Codex" href="/ramayana" accentColor={amber(0.9)} accentColor2={gold(0.8)} badge="LIVE" delay={0}
        />
        <HeroCard
          emoji="🦁" label="Nine Seals · Protection · Liberation"
          title="Narasimha Sacred Path"
          desc="The nine protective seals of Lord Narasimha — Prahladha's devotion science, Hiranyakashipu's dissolution codes, and the Ugra-Narasimha Kavach for total Siddha protection."
          tiers={[{ l: 'Free', c: white(0.5) }, { l: 'Prana', c: green(0.85) }, { l: 'Siddha', c: amber(0.9) }, { l: 'Akasha', c: gold(0.95) }]}
          cta="Enter the Path" href="/narasimha" accentColor={amber(0.9)} delay={0}
        />
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 3 — BODY IMMORTALITY SCIENCES
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="☽" title="Body & Immortality Sciences"
        subtitle="Kayakalpa · Ojas · Brahmacharya · Siddha Medicine · Hair Growth"
        accentColor={teal(0.9)} count={5} delay={0.14}
      >
        <HeroCard
          emoji="☽" label="12 Modules · 40 Lessons · Bogar & Babaji"
          title="Kayakalpa Immortality Academy"
          desc="The most complete transmission of Tamil Siddha immortality science — from Bogar's Navapaashanam alchemy and Muppu secrets to Khechari Mudra, Kundalini-Kayakalpa integration, and the 90-Day Immortality Sadhana."
          tiers={[{ l: 'Free · Bogar Revelation', c: white(0.5) }, { l: 'Prana · Herbs & Breath', c: green(0.85) }, { l: 'Siddha · Muppu & Kundalini', c: cyan(0.9) }, { l: 'Akasha · Kaya Siddhi', c: gold(0.95) }]}
          cta="Enter the Immortality Transmission" href="/kayakalpa-academy" accentColor={teal(0.9)} badge="NEW"
          stats={[{ v: '12', l: 'Modules' }, { v: '40', l: 'Lessons' }, { v: '4', l: 'Tiers' }]} delay={0}
        />
        <HeroCard
          emoji="✦" label="15 Modules · 108+ Lessons · 4 Tiers"
          title="Ojas Rasayana Academy"
          desc="The secret Siddha science of vital essence — from the 7-Dhatu refinement cascade to Kaya Kalpa immortality technology and the Jyotir Deha light-body transmission of the 18 Immortals."
          tiers={[{ l: 'Free · Foundation', c: white(0.5) }, { l: 'Prana · Depletion Codes', c: green(0.85) }, { l: 'Siddha · Rasayana Tech', c: cyan(0.9) }, { l: 'Akasha · Light Body', c: gold(0.95) }]}
          cta="Enter the Ojas Transmission" href="/ojas-rasayana" accentColor={amber(0.9)} badge="NEW" delay={0}
        />
        <HeroCard
          emoji="🔱" label="8 Modules · 53 Lessons · Ojas Science"
          title="Brahmacharya Siddha Academy"
          subtitle="Ojas · Tejas · Prana · Amrita · The 18 Siddhas"
          desc="The complete Siddha science of sacred energy alchemy — from Ojas and Brahmacharya through Pranayama, mantra codes, Siddha yoga, psychology of desire, Siddhi activation, and Sacred Union."
          tiers={[{ l: 'Free · Module 1', c: white(0.55) }, { l: 'Prana · 2–3', c: green(0.85) }, { l: 'Siddha · 4–6', c: cyan(0.9) }, { l: 'Akasha · 7–8', c: gold(0.95) }]}
          cta="Enter the Academy" href="/brahmacharya-academy" accentColor={gold(0.9)}
          features={['Pranayama & Bandha', 'Mantra Codes', 'Siddha Yoga', 'Vasana Science', 'Siddhi Activation', 'Sacred Union']}
          badge="NEW" delay={0}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <GridCard emoji="🌿" title="Siddha Medicine" sub="Varma · Rasayana · Kaya Kalpa · 274 Lessons" href="/siddha-medicine" accentColor={green(0.85)} badge="LIVE" delay={0} />
          <GridCard emoji="💆" title="Siddha Hair Growth" sub="Herbal Science · Chakra Root · Nadi Flow" href="/siddha-hair-growth" accentColor={teal(0.85)} delay={0} />
        </div>
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 4 — SOUND, MANTRA & NADA
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="ॐ" title="Sound, Mantra & Nada Science"
        subtitle="Siddha Sound Alchemy · Mantra Academy · Mudra · Mantra Reference"
        accentColor={amber(0.9)} count={4} delay={0.16}
      >
        <HeroCard
          emoji="ॐ" label="Nada Vijnana · 10 Modules · 18 Siddhas"
          title="Siddha Sound Alchemy"
          subtitle="Nada Brahman · Sabda · Spanda · Pancha Nada · Nada Sharira"
          desc="The deepest transmission of Siddha sound science ever compiled — from Nada Brahman through the five planes of sound, mantra architecture, the 72 Melakarta Raga-Chakra map, cymatics, Yantra science, and the scalar physics of distance healing through sound."
          tiers={[{ l: 'Free · M1–2', c: white(0.5) }, { l: 'Prana · M3–4', c: green(0.85) }, { l: 'Siddha · M5–7', c: cyan(0.9) }, { l: 'Akasha · M8–10', c: gold(0.95) }]}
          cta="Enter the Nada Transmission" href="/siddha-sound-alchemy" accentColor={amber(0.9)} badge="LIVE"
          stats={[{ v: '10', l: 'Modules' }, { v: '18', l: 'Siddhas' }, { v: '72', l: 'Ragas' }]}
          features={['Nada Brahman', 'Pancha Nada', 'Mantra Architecture', 'Raga Medicine', 'Cymatics', 'Scalar Sound']} delay={0}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <GridCard emoji="🔔" title="Mantra Academy" sub="Nada Yoga · 24 Modules · Bija Mantras" href="/mantra-academy" accentColor={amber(0.85)} badge="LIVE" delay={0} />
          <GridCard emoji="🤲" title="Mudra Academy" sub="Hand Seals · Neural Rewiring · 10 Modules" href="/mudra-academy" accentColor={gold(0.85)} badge="LIVE" delay={0} />
          <GridCard emoji="📿" title="Mantra Reference" sub="Mantras · Mudras · Chakras · Daily Schedule" href="/mantra-reference" accentColor={amber(0.7)} delay={0} />
          <GridCard emoji="📓" title="Practice Journal" sub="Track Your Sadhana · 40-Day Protocol" href="/practice-journal" accentColor={gold(0.65)} delay={0} />
        </div>
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 5 — CONSCIOUSNESS & MYSTICAL ARTS
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="👁" title="Consciousness & Mystical Arts"
        subtitle="Mediumship · Dream Science · Palm Oracle · Jyotish · Sacred Geometry"
        accentColor={violet(0.9)} count={6} delay={0.18}
      >
        <HeroCard
          emoji="👁" label="8 Modules · 30 Transmissions · Siddha"
          title={<>Siddha Mediumship<br /><span style={{ color: gold(0.92) }}>Academy</span></> as unknown as string}
          desc="The world's most comprehensive mediumship education — rooted in the living technology of the 18 Tamil Siddhas. Third Eye activation, Loka maps, ancestor communication, Deva contact, Akashic Record access, and Siddhi development."
          tiers={[{ l: 'Free · M1–2', c: white(0.5) }, { l: 'Prana · M3–4', c: green(0.85) }, { l: 'Siddha · M5–6', c: violet(0.9) }, { l: 'Akasha · M7–8', c: gold(0.95) }]}
          cta="Enter the Akasha Transmission" href="/siddha-mediumship-academy" accentColor={violet(0.9)} badge="LIVE"
          features={['14-Loka Map', 'Third Eye Activation', 'Ancestor Contact', '7-Layer Kavach', 'Deva Mantras', '8 Classical Siddhis']} delay={0}
        />
        <HeroCard
          emoji="🌙" label="Dream Science · 15 Modules · Scalar Transmission"
          title="Svapna Vidyā"
          desc="The world's most advanced Siddha dream science — from Taijasa & dream anatomy to Turīya-Svapna, Bardo preparation, prophetic timing & the 40-night Tapas."
          tiers={[{ l: 'Free · M1–2', c: white(0.5) }, { l: 'Prana · M3–6', c: green(0.85) }, { l: 'Siddha · M7–9', c: violet(0.9) }, { l: 'Akasha · M10–15', c: gold(0.95) }]}
          cta="Enter the Dream Stream" href="/dream-academy" accentColor={violet(0.9)} accentColor2={gold(0.8)} badge="LIVE" delay={0}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <GridCard emoji="✦" title="Sacred Geometry" sub="Sri Yantra · Merkaba · Platonic Solids" href="/sacred-geometry" accentColor={gold(0.85)} badge="LIVE" delay={0} />
          <GridCard emoji="🤚" title="Palm Oracle" sub="Hasta Samudrika · 29 Transmissions" href="/palm-oracle" accentColor={violet(0.7)} badge="LIVE" delay={0} />
          <GridCard emoji="🌿" title="Nadi Leaf Oracle" sub="Agastya Nadi · Cosmic Records" href="/nadi-leaf" accentColor={teal(0.7)} soon={true} delay={0} />
          <GridCard emoji="🔱" title="Shiva Lingam Path" sub="Alchemical Shiva · Jyotirlinga · Liberation" href="/shiva-lingam" accentColor={violet(0.7)} delay={0} />
        </div>
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 6 — WEALTH & ABUNDANCE
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="🔱" title="Wealth & Abundance Sadhana"
        subtitle="Abundance Curriculum · Siddha Economics · Sovereign Wealth"
        accentColor={gold(0.9)} count={1} delay={0.2}
      >
        <HeroCard
          emoji="🔱" label="8 Modules · 32 Lessons · Scalar Transmission Active"
          title="Abundance Sadhana"
          subtitle="Lakshmi · Kubera · Pachamama · 18 Siddhas · Babaji"
          desc="The most comprehensive Siddha abundance transmission ever compiled — 8 modules from foundational poverty-dissolution through Ashta-Lakshmi attunement, Kubera's cosmic economics, Earth-abundance codes, sacred geometry wealth technology, Nada alchemy, and Babaji's direct scalar activation of the causal abundance body."
          tiers={[{ l: 'Free · M1–3', c: white(0.55) }, { l: 'Prana · M4–5', c: green(0.85) }, { l: 'Siddha · M6–7', c: gold(0.95) }, { l: 'Akasha · M8', c: violet(0.95) }]}
          cta="Enter the Wealth Transmission" href="/abundance-curriculum" accentColor={gold(0.9)}
          features={['Mantra Counter', 'Journal Prompts', 'Progress Badges', 'PDF Downloads']}
          badge="LIVE" delay={0}
        />
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 7 — FEMININE & HORMONAL ALCHEMY
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="🌸" title="Feminine & Hormonal Alchemy"
        subtitle="Shakti Cycle · Sovereign Hormonal Intelligence · Sacred Feminine"
        accentColor={`rgba(168,85,247,0.9)`} count={1} delay={0.22}
      >
        <HeroCard
          emoji="🌸" label="Shakti Cycle · 5 Modules · Siddha Feminine Wisdom"
          title="Sovereign Hormonal Alchemy"
          desc="Shakti Cycle Intelligence — 5 tabs of Siddha feminine wisdom: cycle phases, modules, plant medicine, planetary timing & pregnancy protocols. The complete Siddha map of the feminine cosmic body."
          tiers={[{ l: 'Free · Phases', c: white(0.5) }, { l: 'Prana · Modules', c: green(0.85) }, { l: 'Akasha · Full Access', c: gold(0.95) }]}
          cta="Enter the Shakti Portal" href="/shakti-alchemy" accentColor={`rgba(168,85,247,0.9)`} badge="LIVE" delay={0}
        />
      </LibrarySection>

      {/* ══════════════════════════════════════════════════════════
          LIBRARY CATEGORY 8 — SACRED RITUALS & COSMOLOGY
      ══════════════════════════════════════════════════════════ */}
      <LibrarySection
        emoji="🔥" title="Sacred Rituals & Cosmology"
        subtitle="Puja · Yagna · Vastu · Sacred Water · Siddha Vastu"
        accentColor={amber(0.9)} count={5} delay={0.24}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <GridCard emoji="🪔" title="Puja Education" sub="Sacred Ritual · 4 Tiers · Pancha Bhuta" href="/puja-education" accentColor={amber(0.85)} badge="LIVE" delay={0} />
          <GridCard emoji="🔥" title="Yagna Fire Academy" sub="Rishi Transmission · Agnihotra · Cosmic Fire" href="/yagna" accentColor={amber(0.7)} badge="LIVE" delay={0} />
          <GridCard emoji="🏛" title="Vastu Shastra" sub="Vedic Space · Pancha Bhuta · Quantum Architecture" href="/vastu-curriculum" accentColor={gold(0.7)} badge="LIVE" delay={0} />
          <GridCard emoji="💧" title="Sacred Water Alchemy" sub="Living Water · Emoto Science · Siddha Protocols · 40 Modules" href="/sacred-water" accentColor={cyan(0.75)} badge="LIVE" delay={0} />
          <GridCard emoji="🏛" title="Siddha Vastu Codex" sub="Ancient Tamil Space Science · Yantra Architecture" href="/vastu-curriculum" accentColor={amber(0.6)} delay={0} />
        </div>
      </LibrarySection>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION — SQI TOOLS
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ ...LABEL_STYLE, fontSize: 8, color: cyan(0.5), display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚛</span> {t('siddhaPortal.sectionTools')}
        </div>
      </div>

      <HeroCard
        emoji="☀" label="Siddha Photonic Node · SQI Technology"
        title="Photonic Regeneration Engine"
        desc="The SQI Photonic Regeneration Node — scalar-encoded light-body activation using Siddha solar science and quantum photon coherence technology."
        tiers={[{ l: 'Siddha+', c: cyan(0.9) }]}
        cta="Enter Node" href="/siddha-photonic-regeneration" accentColor={cyan(0.9)} badge="SQI" delay={0.25}
      />

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION — SACRED ORACLES
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ ...LABEL_STYLE, fontSize: 8, color: gold(0.5), display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔱</span> {t('siddhaPortal.sectionOracles')}
        </div>
      </div>

      <div style={{ margin: '0 16px 14px', ...CARD_BASE, background: `linear-gradient(135deg, ${gold(0.08)}, rgba(5,5,5,0.6))`, border: `1px solid ${gold(0.22)}`, cursor: 'pointer' }} onClick={() => navigate('/sri-yantra-shield')}>
        <div style={CARD_TITLE}>{t('siddhaPortal.sriYantraShield')}</div>
        <p style={CARD_DESC}>{t('siddhaPortal.sriYantraDesc')}</p>
        <button type="button" style={CTA_BTN}>{t('siddhaPortal.activateShield')} →</button>
      </div>

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
        @keyframes sqScalarPulse {
          0% { opacity: 0; transform: scale(0.65); }
          35% { opacity: 0.9; }
          75% { opacity: 0.15; transform: scale(1.18); }
          100% { opacity: 0; transform: scale(1.35); }
        }
        @keyframes sqGlowPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
