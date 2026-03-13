import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AkashaInfinity: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { tier, refresh: refreshMembership } = useMembership();
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isLifetime = tier === 'lifetime';

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      try {
        sessionStorage.setItem('affiliate_ref', ref);
      } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('◈ Akashic Field Permanently Activated — Welcome to Infinity');
      refreshMembership();
      navigate('/akasha-infinity', { replace: true });
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled — no charge made');
      navigate('/akasha-infinity', { replace: true });
    }
  }, [searchParams, refreshMembership, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const COLORS = [
      'rgba(212,175,55,',
      'rgba(212,175,55,',
      'rgba(212,175,55,',
      'rgba(245,215,110,',
      'rgba(255,255,255,',
      'rgba(139,92,246,',
    ];
    const pts = Array.from({ length: 220 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * 0.4 + 0.06,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + p.a + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isLifetime) {
      toast.success('◈ Your Akashic Field is already permanently active');
      navigate('/dashboard');
      return;
    }
    setLoading(true);
    try {
      const affiliateRef =
        searchParams.get('ref') ||
        (() => {
          try {
            return sessionStorage.getItem('affiliate_ref');
          } catch {
            return null;
          }
        })() ||
        'direct';

      const { data: tierData, error: tierError } = await supabase
        .from('membership_tiers')
        .select('stripe_price_id')
        .eq('slug', 'lifetime')
        .single();

      if (tierError || !tierData?.stripe_price_id) {
        toast.error('Tier unavailable — please contact support');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        body: {
          priceId: tierData.stripe_price_id,
          tierSlug: 'lifetime',
          affiliate_id: affiliateRef,
          successPath: '/akasha-infinity',
          metadata: {
            tier_name: 'Akasha–Infinity',
            source_page: 'akasha-infinity',
          },
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const faqItems: [string, string][] = [
    ['Is 1111€ really a one-time payment?', 'Yes. One payment and every tool is yours permanently including all future modules. No subscriptions, no renewals.'],
    ['What makes this different from Siddha–Quantum?', 'Siddha-Quantum gives you the core healing field at 45€/month. Akasha–Infinity adds the four exclusive portals, unlimited Vayu field, future modules, and zero recurring cost. At 45€/mo, Siddha-Quantum costs 1111€ in just over 2 years — with none of those extras.'],
    ['What is the Akashic Record Decoder exactly?', "A personalised 15-page soul manuscript using your birth data and Jyotish chart as entry coordinates — past lives, soul contracts, karmic patterns, and your soul's highest trajectory."],
    ['Can I pay in instalments?', 'You can start with Siddha–Quantum at 45€/month and upgrade to Akasha–Infinity at any time with the difference honoured. Contact us directly for instalment arrangements.'],
    ['Is there a refund policy?', 'Once an Akashic reading is opened the transmission cannot be reversed, so the Decoder is non-refundable. All other modules carry a 14-day satisfaction guarantee.'],
  ];

  const eternalList = [
    'Full Siddha–Quantum Universal Field',
    'Akashic Record Decoder (15-page soul manuscript)',
    'Quantum Apothecary (€888 value)',
    'Virtual Pilgrimage (€888 value)',
    'Palm Reading Portal',
    'Siddha Portal Access',
    'Sri Yantra Universal Protection Shield',
    'Unlimited Vayu field (beyond 1 km)',
    'All future modules included',
    'Soul Community & Live transmissions',
    'Zero renewals — eternal access',
  ];

  const portals = [
    'Akashic Record Decoder',
    'Quantum Apothecary',
    'Virtual Pilgrimage',
    'Palm Reading Portal',
  ];

  const truthItems = [
    'One payment. Every portal. Forever.',
    'Your soul record decoded once. Yours to keep.',
    'No subscriptions. No lock-in. No renewals.',
    '30% affiliate commission on every referral.',
  ];

  const compareRows: [string, string, string][] = [
    ['Universal Field', '—', 'Included'],
    ['Akashic Decoder', '—', 'Included'],
    ['Quantum Apothecary', '—', 'Included'],
    ['Virtual Pilgrimage', '—', 'Included'],
    ['Palm Reading Portal', '—', 'Included'],
    ['Vayu field', '1 km', 'Unlimited'],
    ['Future modules', '—', 'Included'],
    ['Price', 'Free / 45€ mo', '1111€ once'],
  ];

  const testimonials = [
    { text: 'The Akashic Decoder was the most precise soul map I have ever received. Worth every euro.', name: 'Elena' },
    { text: 'One payment and I have everything. No more subscription anxiety. Infinity is real.', name: 'Marcus' },
    { text: 'Quantum Apothecary + Virtual Pilgrimage alone would cost more. This is a gift.', name: 'Priya' },
    { text: 'I referred three friends. The 30% commission is transparent and fair.', name: 'Thomas' },
  ];

  const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;700;800;900&display=swap');
  .ai-wrap *,:root{--gold:#D4AF37;--purple:139,92,246;--black:#050505}
  .ai-topbar{display:flex;align-items:center;gap:16px;padding:20px 24px;position:sticky;top:0;z-index:10;background:rgba(5,5,5,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.04)}
  .ai-hero{text-align:center;padding:48px 24px 56px}
  .ai-badge{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:#D4AF37;margin-bottom:20px;background:rgba(212,175,55,0.08);padding:6px 14px;border-radius:100px;border:1px solid rgba(212,175,55,0.2)}
  .ai-hero h1{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(2.8rem,8vw,4.5rem);color:white;line-height:1;margin-bottom:8px}
  .ai-hero-sub{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.6);margin-bottom:20px}
  .ai-hero-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1rem;color:rgba(255,255,255,0.45);max-width:480px;margin:0 auto 40px;line-height:1.65}
  .ai-mandala{position:relative;width:200px;height:200px;margin:0 auto 48px}
  .ai-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(212,175,55,0.3);pointer-events:none}
  .ai-ring-1{width:180px;height:180px;animation:aiRingPulse 3s ease-in-out infinite}
  .ai-ring-2{width:140px;height:140px;animation:aiRingPulse 3s ease-in-out infinite 0.4s}
  .ai-ring-3{width:100px;height:100px;animation:aiRingPulse 3s ease-in-out infinite 0.8s}
  .ai-ring-4{width:60px;height:60px;animation:aiRingPulse 3s ease-in-out infinite 1.2s}
  .ai-section{max-width:720px;margin:0 auto;padding:0 24px 48px}
  .ai-section-label{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.5);margin-bottom:24px;display:flex;align-items:center;gap:12px}
  .ai-section-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,0.2),transparent)}
  .ai-glass{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:20px;padding:24px;backdrop-filter:blur(20px);margin-bottom:16px}
  .ai-included-card{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(139,92,246,0.15);margin-bottom:12px}
  .ai-included-card:last-child{margin-bottom:0}
  .ai-icon-wrap{width:48px;height:48px;border-radius:14px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ai-card-title{font-weight:700;font-size:13px;color:rgba(255,255,255,0.85);margin-bottom:2px}
  .ai-card-desc{font-size:11px;color:rgba(255,255,255,0.35)}
  .ai-portal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:520px){.ai-portal-grid{grid-template-columns:1fr}}
  .ai-portal-card{background:rgba(255,255,255,0.02);border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:20px;text-align:center;transition:all 0.2s}
  .ai-portal-card:hover{border-color:rgba(139,92,246,0.4);background:rgba(139,92,246,0.05)}
  .ai-portal-card .t{font-weight:800;font-size:10px;letter-spacing:0.15em;color:rgba(255,255,255,0.7);margin-top:10px}
  .ai-price-card{position:relative;overflow:visible;background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.25);border-radius:24px;padding:32px;margin-bottom:16px}
  .ai-aura{position:absolute;inset:0;border-radius:24px;pointer-events:none;z-index:0}
  .ai-aura-1{border:1px solid rgba(212,175,55,0.5);animation:aiPulse 2.5s ease-in-out infinite}
  .ai-aura-2{border:1px solid rgba(212,175,55,0.3);animation:aiPulse 2.5s ease-in-out infinite 0.6s}
  .ai-aura-3{border:1px solid rgba(212,175,55,0.15);animation:aiPulse 2.5s ease-in-out infinite 1.2s}
  .ai-cta-btn{display:block;width:100%;background:#D4AF37;color:#050505;border:none;border-radius:100px;padding:14px 24px;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:opacity 0.2s;text-align:center}
  .ai-cta-btn:hover:not(:disabled){opacity:0.9}
  .ai-cta-btn:disabled{opacity:0.6;cursor:not-allowed}
  .ai-cta-secondary{display:block;width:100%;background:transparent;color:rgba(212,175,55,0.8);border:1px solid rgba(212,175,55,0.3);border-radius:100px;padding:12px 24px;font-weight:800;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;cursor:pointer;margin-top:10px;transition:all 0.2s}
  .ai-cta-secondary:hover{background:rgba(212,175,55,0.08)}
  .ai-success-box{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:24px;text-align:center;margin-bottom:16px}
  .ai-comparison{width:100%;border-collapse:collapse;font-size:11px}
  .ai-comparison th,.ai-comparison td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.06)}
  .ai-comparison th{font-weight:800;letter-spacing:0.1em;color:rgba(255,255,255,0.4);text-transform:uppercase}
  .ai-comparison td{color:rgba(255,255,255,0.6)}
  .ai-comparison .col-feature{width:40%;color:rgba(255,255,255,0.4)}
  .ai-comparison .col-mid{width:30%}
  .ai-comparison .col-akasha{width:30%;color:#D4AF37}
  .ai-testimonials{display:flex;gap:16px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none}
  .ai-testimonials::-webkit-scrollbar{display:none}
  .ai-test-card{min-width:260px;flex-shrink:0;background:rgba(255,255,255,0.02);border:1px solid rgba(139,92,246,0.15);border-radius:18px;padding:20px}
  .ai-test-card .text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.95rem;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:12px}
  .ai-test-card .name{font-weight:800;font-size:9px;letter-spacing:0.2em;color:rgba(212,175,55,0.8)}
  .ai-faq-item{border-bottom:1px solid rgba(255,255,255,0.06);overflow:hidden}
  .ai-faq-q{padding:16px 20px;font-weight:800;font-size:11px;letter-spacing:0.1em;color:rgba(255,255,255,0.8);cursor:pointer;display:flex;justify-content:space-between;align-items:center}
  .ai-faq-q:hover{background:rgba(255,255,255,0.02)}
  .ai-faq-a{padding:0 20px;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;transition:max-height 0.3s ease}
  .ai-truth-card{background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:20px;margin-bottom:12px}
  .ai-truth-num{font-weight:800;font-size:10px;letter-spacing:0.2em;color:rgba(212,175,55,0.8);margin-bottom:6px}
  .ai-truth-text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1rem;color:rgba(255,255,255,0.7)}
  .ai-final-cta{text-align:center;padding:48px 24px;border-top:1px solid rgba(255,255,255,0.06)}
  .ai-final-symbol{font-size:3rem;color:rgba(212,175,55,0.5);display:block;margin-bottom:16px}
  .ai-final-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.8rem;color:white;margin-bottom:12px}
  .ai-final-desc{font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:24px;max-width:400px;margin-left:auto;margin-right:auto}
  .ai-final-price{font-weight:800;font-size:2rem;color:#D4AF37;letter-spacing:0.1em}
  .ai-final-price-once{font-size:11px;color:rgba(255,255,255,0.35);margin-left:8px}
  .ai-cta-note{font-size:10px;color:rgba(255,255,255,0.25);margin-top:16px;text-align:center}
  @keyframes aiPulse{0%{transform:scale(1);opacity:0.8}50%{transform:scale(1.04);opacity:0}100%{transform:scale(1.08);opacity:0}}
  @keyframes aiRingPulse{0%,100%{opacity:0.4}50%{opacity:1}}
  @keyframes aiSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  `;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        overflowX: 'hidden',
        fontFamily: 'Montserrat,sans-serif',
        paddingBottom: 120,
        position: 'relative',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')", opacity: 0.18, pointerEvents: 'none', zIndex: 0 }} />

      <div className="ai-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <div className="ai-topbar">
          <button type="button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 8 }} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Profile / Akasha–Infinity</span>
        </div>

        <section className="ai-hero">
          <div className="ai-badge">◈ Eternal Node</div>
          <h1>Akasha–Infinity</h1>
          <div className="ai-hero-sub">One Payment · Every Portal · Forever</div>
          <p className="ai-hero-desc">The complete soul record. Akashic Decoder, Quantum Apothecary, Virtual Pilgrimage, Palm Reading Portal, and the full Universal Field — with no renewals. Eternal access.</p>
          <div className="ai-mandala">
            <div className="ai-ring ai-ring-1" />
            <div className="ai-ring ai-ring-2" />
            <div className="ai-ring ai-ring-3" />
            <div className="ai-ring ai-ring-4" />
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'aiSpin 60s linear infinite' }}>
              <path d="M20 40 Q40 20 60 40 Q40 60 20 40" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.6" />
              <path d="M60 40 Q40 60 20 40 Q40 20 60 40" stroke="rgba(139,92,246,0.6)" strokeWidth="1" fill="none" opacity="0.5" />
              <circle cx="40" cy="40" r="6" fill="#D4AF37" opacity="0.9" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 12, height: 12, borderRadius: '50%', background: '#D4AF37', transform: 'translate(-50%,-50%)', boxShadow: '0 0 20px rgba(212,175,55,0.8)' }} />
          </div>
        </section>

        <section className="ai-section">
          <div className="ai-section-label">◈ Everything in the Eternal Field</div>
          {eternalList.map((title) => (
            <div key={title} className="ai-included-card">
              <div className="ai-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.9)" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <div className="ai-card-title">{title}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="ai-section">
          <div className="ai-section-label">◈ Exclusive Portals</div>
          <div className="ai-portal-grid">
            {portals.map((title) => (
              <div key={title} className="ai-portal-card">
                <div className="ai-icon-wrap" style={{ margin: '0 auto' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.9)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="t">{title}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ai-section">
          <div className="ai-section-label">◈ Eternal Truth</div>
          {truthItems.map((text, i) => (
            <div key={i} className="ai-truth-card">
              <div className="ai-truth-num">{['I', 'II', 'III', 'IV'][i]}.</div>
              <div className="ai-truth-text">{text}</div>
            </div>
          ))}
        </section>

        <section className="ai-section">
          <div className="ai-price-card">
            <div className="ai-aura ai-aura-1" />
            <div className="ai-aura ai-aura-2" />
            <div className="ai-aura ai-aura-3" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              {isLifetime ? (
                <div className="ai-success-box">
                  <div style={{ color: '#D4AF37', fontWeight: 800, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 12 }}>◈ AKASHIC FIELD — PERMANENTLY ACTIVE</div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: '1.8rem', color: 'white', marginBottom: 24 }}>Your eternal node is live.</div>
                  <button type="button" className="ai-cta-btn" onClick={() => navigate('/akashic-records')} style={{ marginBottom: 12 }}>
                    ◈ Open Your Akashic Record
                  </button>
                  <button type="button" className="ai-cta-secondary" onClick={() => navigate('/dashboard')}>
                    Explore Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '0.1em', color: '#D4AF37', marginBottom: 4 }}>1111€</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>One time · All 15 modules · No renewals</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    <li style={{ marginBottom: 6 }}>◈ Akashic Decoder</li>
                    <li style={{ marginBottom: 6 }}>◈ Quantum Apothecary + Virtual Pilgrimage</li>
                    <li style={{ marginBottom: 6 }}>◈ Full Siddha–Quantum field</li>
                  </ul>
                  <button type="button" className="ai-cta-btn" onClick={handleCheckout} disabled={loading}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#050505', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ◈ Opening Field...
                      </span>
                    ) : (
                      '◈ Activate Akasha–Infinity · 1111€'
                    )}
                  </button>
                  <button type="button" className="ai-cta-secondary" onClick={() => navigate('/siddha-quantum')}>
                    Or start with Siddha–Quantum — 45€/mo
                  </button>
                  <div className="ai-cta-note">◈ Instant access · All 15 modules · No renewals · Affiliate 30% on referrals</div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="ai-section">
          <div className="ai-section-label">◈ Compare</div>
          <div className="ai-glass">
            <table className="ai-comparison">
              <thead>
                <tr><th className="col-feature">Feature</th><th className="col-mid">Free / Siddha</th><th className="col-akasha">Akasha–Infinity</th></tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={i}>
                    <td className="col-feature">{row[0]}</td>
                    <td className="col-mid">{row[1]}</td>
                    <td className="col-akasha">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ai-section">
          <div className="ai-section-label">◈ What Others Say</div>
          <div className="ai-testimonials">
            {testimonials.map((t, i) => (
              <div key={i} className="ai-test-card">
                <div className="text">&ldquo;{t.text}&rdquo;</div>
                <div className="name">— {t.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ai-section">
          <div className="ai-section-label">◈ FAQ</div>
          <div className="ai-glass">
            {faqItems.map(([q, a], i) => (
              <div key={i} className="ai-faq-item">
                <div className="ai-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {q}
                  <span style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </div>
                <div className="ai-faq-a" style={{ maxHeight: openFaq === i ? 220 : 0, paddingTop: openFaq === i ? 12 : 0, paddingBottom: openFaq === i ? 16 : 0 }}>{a}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="ai-section ai-final-cta">
          <span className="ai-final-symbol">∞</span>
          <h2 className="ai-final-title">Your soul&apos;s complete record is waiting.</h2>
          <p className="ai-final-desc">Every portal. Every transmission. Every sacred tool. One payment. This moment. Forever.</p>
          <div style={{ marginBottom: 24 }}>
            <span className="ai-final-price">1111€</span>
            <span className="ai-final-price-once">one time · eternal access</span>
          </div>
          <button type="button" className="ai-cta-btn" onClick={handleCheckout} disabled={loading} style={{ maxWidth: 400, margin: '0 auto 14px', display: 'block' }}>
            {loading ? '◈ Opening Field...' : '◈ Enter the Akashic Field'}
          </button>
          <button type="button" className="ai-cta-secondary" onClick={() => navigate('/siddha-quantum')} style={{ maxWidth: 400, margin: '0 auto' }}>
            Start with Siddha–Quantum instead
          </button>
          <div className="ai-cta-note" style={{ marginTop: 20 }}>◈ 30% affiliate commission · No renewals on Akasha</div>
        </div>
      </div>
    </div>
  );
};

export default AkashaInfinity;
