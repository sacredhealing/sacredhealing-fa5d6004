// ╔══════════════════════════════════════════════════════════════════╗
// ║  QuantumApothecaryLanding.tsx                                   ║
// ║                                                                  ║
// ║  WHAT THIS DOES:                                                 ║
// ║  Shows a stunning landing page to users who do NOT have         ║
// ║  Akasha-Infinity access instead of redirecting to /akasha-      ║
// ║  infinity. Users with access pass straight through to the app.  ║
// ║                                                                  ║
// ║  HOW TO DEPLOY:                                                  ║
// ║  1. Save this file as:                                           ║
// ║     src/pages/QuantumApothecaryLanding.tsx                      ║
// ║                                                                  ║
// ║  2. In src/App.tsx (or your router file), find the route for    ║
// ║     /quantum-apothecary and ADD a wrapper:                      ║
// ║                                                                  ║
// ║     BEFORE:                                                      ║
// ║     <Route path="/quantum-apothecary" element={<QuantumApothecary />} /> ║
// ║                                                                  ║
// ║     AFTER:                                                       ║
// ║     <Route path="/quantum-apothecary" element={<QuantumApothecaryGate />} /> ║
// ║                                                                  ║
// ║  3. The QuantumApothecaryGate (at bottom of this file) checks   ║
// ║     tier access. If user has Akasha-Infinity → loads the real   ║
// ║     app. If not → shows the landing page.                       ║
// ╚══════════════════════════════════════════════════════════════════╝

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { useTranslation } from '@/hooks/useTranslation';

// Lazy load the real app — only loads for users who have access
import { lazy, Suspense } from 'react';
const QuantumApothecaryApp = lazy(() => import('./QuantumApothecary'));

// ══════════════════════════════════════════════════════════════════
// GATE COMPONENT — drop this into your router
// ══════════════════════════════════════════════════════════════════
export function QuantumApothecaryGate() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            border: '2px solid rgba(212,175,55,0.3)',
            borderTop: '2px solid #D4AF37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(212,175,55,0.5)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            {t('quantumApothecary.gate.syncingArchive')}
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → show landing page (with login CTA)
  // Has access → show the real app
  // No access → show landing page (with upgrade CTA)
  const hasAccess = user && hasFeatureAccess(isAdmin, tier, FEATURE_TIER.quantumApothecary);

  if (hasAccess) {
    return (
      <Suspense fallback={
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(212,175,55,0.4)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>{t('quantumApothecary.gate.loadingApp')}</p>
        </div>
      }>
        <QuantumApothecaryApp />
      </Suspense>
    );
  }

  return <QuantumApothecaryLanding isLoggedIn={!!user} />;
}

// ══════════════════════════════════════════════════════════════════
// LANDING PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════
interface Props {
  isLoggedIn: boolean;
}

export default function QuantumApothecaryLanding({ isLoggedIn }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reveal-on-scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.target.id) {
            setVisible((v) => ({ ...v, [e.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const reveal = (id: string, delay = 0): React.CSSProperties => ({
    opacity: visible[id] ? 1 : 0,
    transform: visible[id] ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s ${delay}s, transform 0.7s ${delay}s`,
  });

  const ctaTarget = isLoggedIn ? '/akasha-infinity' : '/auth';
  const ctaLabel = isLoggedIn ? t('quantumApothecary.landing.ctaUnlock') : t('quantumApothecary.landing.ctaBegin');

  return (
    <div style={{ background: '#050505', color: 'rgba(255,255,255,0.88)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ── Embedded Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;600;700;800;900&display=swap');
        :root {
          --gold: #D4AF37;
          --gold-dim: rgba(212,175,55,0.12);
          --gold-border: rgba(212,175,55,0.2);
          --glass: rgba(255,255,255,0.02);
          --border: rgba(255,255,255,0.06);
          --dim: rgba(255,255,255,0.45);
        }
        .qa-serif { font-family: 'Cormorant Garamond', Georgia, serif !important; }
        .qa-gold { color: #D4AF37; }
        @keyframes qa-breathe { 0%,100%{transform:scale(1)}50%{transform:scale(1.04)} }
        @keyframes qa-orbit { to{transform:rotate(360deg)} }
        @keyframes qa-orbit-r { to{transform:rotate(-360deg)} }
        @keyframes qa-scroll { 0%{opacity:0;transform:scaleY(0);transform-origin:top}50%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(0);transform-origin:bottom} }
        @keyframes qa-pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes qa-yantra { to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes qa-ping { 75%,100%{transform:scale(2);opacity:0} }
      `}</style>

      {/* ── Background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(1px 1px at 8% 12%,rgba(212,175,55,.6) 0%,transparent 100%),radial-gradient(1px 1px at 41% 8%,rgba(212,175,55,.4) 0%,transparent 100%),radial-gradient(1px 1px at 78% 72%,rgba(212,175,55,.3) 0%,transparent 100%),radial-gradient(1px 1px at 23% 55%,rgba(255,255,255,.15) 0%,transparent 100%),radial-gradient(1px 1px at 89% 30%,rgba(255,255,255,.2) 0%,transparent 100%)',
      }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 15% 20%,rgba(212,175,55,.04) 0%,transparent 60%),radial-gradient(ellipse 60% 80% at 85% 80%,rgba(212,175,55,.03) 0%,transparent 60%)',
      }} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        backdropFilter: 'blur(20px)',
        background: 'rgba(5,5,5,0.7)',
        borderBottom: '1px solid rgba(212,175,55,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg,#D4AF37,#B8940A)',
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, boxShadow: '0 0 16px rgba(212,175,55,.3)',
          }}>⚙</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>{t('quantumApothecary.landing.brand')}</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,.4)', marginTop: 1 }}>{t('quantumApothecary.landing.brandTag')}</div>
          </div>
        </div>
        <button
          onClick={() => navigate(ctaTarget)}
          style={{
            padding: '9px 20px',
            background: 'linear-gradient(135deg,#D4AF37,#B8940A)',
            color: '#050505', border: 'none', borderRadius: 11,
            fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: '0 0 16px rgba(212,175,55,.2)',
            fontFamily: 'inherit',
          }}
        >{ctaLabel}</button>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', zIndex: 1 }}>

        {/* Sri Yantra */}
        <svg style={{ position: 'absolute', width: 600, height: 600, opacity: 0.04, top: '50%', left: '50%', animation: 'qa-yantra 120s linear infinite' }} viewBox="0 0 400 400" fill="none">
          <polygon points="200,40 360,280 40,280" stroke="#D4AF37" strokeWidth="0.8"/>
          <polygon points="200,360 40,120 360,120" stroke="#D4AF37" strokeWidth="0.8"/>
          <polygon points="200,60 340,270 60,270" stroke="#D4AF37" strokeWidth="0.5"/>
          <polygon points="200,340 60,130 340,130" stroke="#D4AF37" strokeWidth="0.5"/>
          <circle cx="200" cy="200" r="150" stroke="#D4AF37" strokeWidth="0.5"/>
          <circle cx="200" cy="200" r="6" fill="#D4AF37" fillOpacity="0.8"/>
        </svg>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 18px', background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.25)', borderRadius: 100, fontSize: 9, fontWeight: 900, letterSpacing: '0.45em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, background: '#D4AF37', borderRadius: '50%', boxShadow: '0 0 8px #D4AF37', animation: 'qa-pulse 2s infinite', display: 'inline-block' }} />
          {t('quantumApothecary.landing.heroBadge')}
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="qa-serif"
          style={{ fontSize: 'clamp(52px,10vw,108px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#fff', marginBottom: 12 }}>
          {t('quantumApothecary.landing.heroTitle1')}<br />
          <em style={{ color: '#D4AF37', textShadow: '0 0 60px rgba(212,175,55,.3)' }}>{t('quantumApothecary.landing.heroTitle2')}</em>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="qa-serif"
          style={{ fontSize: 'clamp(16px,2.5vw,26px)', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.45)', marginBottom: 44, letterSpacing: '0.02em' }}>
          {t('quantumApothecary.landing.heroSub')}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
          <button onClick={() => navigate(ctaTarget)} style={{
            padding: '15px 36px', background: 'linear-gradient(135deg,#D4AF37,#B8940A)', color: '#050505',
            border: 'none', borderRadius: 14, fontSize: 11, fontWeight: 900, letterSpacing: '0.3em',
            textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 30px rgba(212,175,55,.25)',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
          }}>⚙ {ctaLabel}</button>
          <a href="#how" style={{
            padding: '15px 36px', background: 'transparent', color: 'rgba(255,255,255,.8)',
            border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>{t('quantumApothecary.landing.howItWorks')}</a>
        </motion.div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,.35)' }}>{t('quantumApothecary.landing.scroll')}</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom,#D4AF37,transparent)', animation: 'qa-scroll 2s infinite' }} />
        </div>
      </div>

      {/* ══════════ STATS ══════════ */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(5,5,5,.8)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', zIndex: 1, position: 'relative' }}>
        {[
          { num: '72,000', label: t('quantumApothecary.landing.stat1Label') },
          { num: '200+', label: t('quantumApothecary.landing.stat2Label') },
          { num: '24/7', label: t('quantumApothecary.landing.stat3Label') },
          { num: '2050', label: t('quantumApothecary.landing.stat4Label') },
        ].map((s, i) => (
          <div key={i} id={`stat-${i}`} data-reveal=""
            style={{ padding: '28px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none', ...reveal(`stat-${i}`, i * 0.1) }}>
            <div className="qa-serif" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 300, color: '#D4AF37', textShadow: '0 0 24px rgba(212,175,55,.3)', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <div id="how" style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(212,175,55,.015)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(60px,8vw,120px) clamp(20px,4vw,48px)' }}>
          <div id="how-eye" data-reveal="" style={{ ...reveal('how-eye'), fontSize: 9, fontWeight: 900, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', opacity: (visible['how-eye'] ? 1 : 0) * 0.7, marginBottom: 14 }}>⟁ {t('quantumApothecary.landing.howEye')}</div>
          <h2 id="how-title" data-reveal="" className="qa-serif" style={{ ...reveal('how-title', 0.1), fontSize: 'clamp(28px,5vw,56px)', fontWeight: 300, color: '#fff', marginBottom: 8, lineHeight: 1.1, textAlign: 'center' }}>
            {t('quantumApothecary.landing.howTitle1')} <em style={{ color: '#D4AF37' }}>{t('quantumApothecary.landing.howTitle2')}</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 48 }}>
            {[
              { n: '01', icon: '🖐', title: t('quantumApothecary.landing.step1Title'), desc: t('quantumApothecary.landing.step1Desc') },
              { n: '02', icon: '🔬', title: t('quantumApothecary.landing.step2Title'), desc: t('quantumApothecary.landing.step2Desc') },
              { n: '03', icon: '⚗', title: t('quantumApothecary.landing.step3Title'), desc: t('quantumApothecary.landing.step3Desc') },
              { n: '04', icon: '⚡', title: t('quantumApothecary.landing.step4Title'), desc: t('quantumApothecary.landing.step4Desc') },
            ].map((s, i) => (
              <div key={i} id={`step-${i}`} data-reveal=""
                style={{
                  ...reveal(`step-${i}`, i * 0.1),
                  background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: 22, padding: '28px 24px', position: 'relative', overflow: 'hidden',
                  transition: `opacity 0.6s ${i * 0.1}s, transform 0.6s ${i * 0.1}s, border-color 0.3s`,
                }}>
                <div className="qa-serif" style={{ fontSize: 44, fontWeight: 300, color: 'rgba(212,175,55,.1)', lineHeight: 1, marginBottom: 12 }}>{s.n}</div>
                <div style={{ fontSize: 24, marginBottom: 12, filter: 'drop-shadow(0 0 8px rgba(212,175,55,.4))' }}>{s.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,.45)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ INSTRUCTIONS ══════════ */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(60px,8vw,120px) clamp(20px,4vw,48px)' }}>
          <div id="inst-eye" data-reveal="" style={{ ...reveal('inst-eye'), fontSize: 9, fontWeight: 900, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', opacity: (visible['inst-eye'] ? 1 : 0) * 0.7, marginBottom: 14 }}>⟁ {t('quantumApothecary.landing.instEye')}</div>
          <h2 id="inst-title" data-reveal="" className="qa-serif" style={{ ...reveal('inst-title', 0.1), fontSize: 'clamp(28px,5vw,52px)', fontWeight: 300, color: '#fff', marginBottom: 44, lineHeight: 1.1 }}>
            {t('quantumApothecary.landing.instTitle1')} <em style={{ color: '#D4AF37' }}>{t('quantumApothecary.landing.instTitle2')}</em>
          </h2>
          {[
            { title: t('quantumApothecary.landing.guide1Title'), body: t('quantumApothecary.landing.guide1Body'), tip: null as string | null },
            { title: t('quantumApothecary.landing.guide2Title'), body: t('quantumApothecary.landing.guide2Body'), tip: t('quantumApothecary.landing.guide2Tip') },
            { title: t('quantumApothecary.landing.guide3Title'), body: t('quantumApothecary.landing.guide3Body'), tip: null },
            { title: t('quantumApothecary.landing.guide4Title'), body: t('quantumApothecary.landing.guide4Body'), tip: t('quantumApothecary.landing.guide4Tip') },
            { title: t('quantumApothecary.landing.guide5Title'), body: t('quantumApothecary.landing.guide5Body'), tip: t('quantumApothecary.landing.guide5Tip') },
            { title: t('quantumApothecary.landing.guide6Title'), body: t('quantumApothecary.landing.guide6Body'), tip: null },
            { title: t('quantumApothecary.landing.guide7Title'), body: t('quantumApothecary.landing.guide7Body'), tip: t('quantumApothecary.landing.guide7Tip') },
          ].map((step, i) => (
            <div key={i} id={`inst-${i}`} data-reveal=""
              style={{ ...reveal(`inst-${i}`, i * 0.06), display: 'flex', gap: 20, padding: '28px 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <div style={{ width: 34, height: 34, background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#D4AF37', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: 8 }}>{step.title}</h4>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,.5)', marginBottom: step.tip ? 10 : 0 }}>{step.body}</p>
                {step.tip && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 100, fontSize: 10, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.08em' }}>
                    {step.tip}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ CTA ══════════ */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', position: 'relative', zIndex: 1, textAlign: 'center', padding: 'clamp(80px,10vw,160px) clamp(20px,4vw,48px)' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle,rgba(212,175,55,.07) 0%,transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div id="cta-badge" data-reveal="" style={{ ...reveal('cta-badge'), display: 'inline-block', padding: '5px 18px', background: 'rgba(212,175,55,.08)', border: '1px solid rgba(212,175,55,.2)', borderRadius: 100, fontSize: 9, fontWeight: 900, letterSpacing: '0.45em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 24 }}>⟁ {t('quantumApothecary.landing.ctaBadge')}</div>
        <h2 id="cta-title" data-reveal="" className="qa-serif" style={{ ...reveal('cta-title', 0.1), fontSize: 'clamp(36px,7vw,80px)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: 16 }}>
          {t('quantumApothecary.landing.ctaTitle1')}<br /><em style={{ color: '#D4AF37' }}>{t('quantumApothecary.landing.ctaTitle2')}</em>
        </h2>
        <p id="cta-sub" data-reveal="" style={{ ...reveal('cta-sub', 0.2), fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(255,255,255,.45)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
          {t('quantumApothecary.landing.ctaSub')}
        </p>
        <button
          id="cta-btn"
          data-reveal=""
          onClick={() => navigate(ctaTarget)}
          style={{
            ...reveal('cta-btn', 0.3),
            padding: '16px 44px',
            background: 'linear-gradient(135deg,#D4AF37,#B8940A)',
            color: '#050505', border: 'none', borderRadius: 14,
            fontSize: 12, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: '0 0 40px rgba(212,175,55,.25)',
            fontFamily: 'inherit',
          }}
        >
          ⚙ {ctaLabel}
        </button>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '40px clamp(20px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
        <div className="qa-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.3)' }}>{t('quantumApothecary.landing.brand')}</div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,.18)' }}>{t('quantumApothecary.landing.footerCopy')}</div>
      </div>

    </div>
  );
}
