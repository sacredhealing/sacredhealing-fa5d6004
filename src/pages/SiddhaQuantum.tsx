import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SiddhaQuantum: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { isPremium, refresh: refreshMembership } = useMembership();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      toast.success('◈ Universal Field Activated — Welcome to Siddha–Quantum');
      refreshMembership();
      navigate('/siddha-quantum', { replace: true });
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled — no charge made');
      navigate('/siddha-quantum', { replace: true });
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
    const COLORS = ['rgba(212,175,55,', 'rgba(212,175,55,', 'rgba(245,215,110,', 'rgba(255,255,255,'];
    const pts = Array.from({ length: 180 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.45 + 0.08,
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

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isPremium) {
      toast.success('You already have full access!');
      navigate('/dashboard');
      return;
    }

    setCheckoutLoading(true);
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
        .select('stripe_price_id, slug')
        .eq('slug', 'siddha-quantum-monthly')
        .single();

      if (tierError || !tierData?.stripe_price_id) {
        toast.error('Tier not available — contact support');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        body: {
          priceId: tierData.stripe_price_id,
          tierSlug: 'siddha-quantum-monthly',
          affiliate_id: affiliateRef,
          successPath: '/siddha-quantum',
          metadata: {
            tier_name: 'Siddha–Quantum',
            source_page: 'siddha-quantum',
          },
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || 'Checkout failed — please try again');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const faqItems = [
    { q: 'What is the Universal Field?', a: 'The Siddha–Quantum tier unlocks the full 72,000 Nadi scanner, practice scantions, Siddha Portal, healing audios, and the Sri Yantra EMF & fear-field protection shield across all modules.' },
    { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your account or Stripe customer portal. No lock-in. Access continues until the end of your billing period.' },
    { q: 'How does the Nadi Scanner work?', a: 'The Digital Nadi Scanner uses bio-sync technology to map your nadis and generate practice scantions. Results sync to your Soul Vault and Jyotish profile.' },
    { q: 'What is the Sri Yantra Shield?', a: 'The Sri Yantra Universal Protection Shield is active across the app — it supports EMF coherence and fear-field dissolution as you practice.' },
    { q: 'Is there an annual option?', a: 'Yes. For better value, check the main Membership page for annual and lifetime options.' },
  ];

  const testimonials = [
    { text: 'The Nadi Scanner changed how I see my practice. The scantions are eerily accurate.', name: 'Mira' },
    { text: 'Finally one place for Jyotish, healing audios, and community. Worth every euro.', name: 'Lars' },
    { text: 'Sri Yantra Shield + daily readings = my morning ritual. Game changer.', name: 'Sofia' },
    { text: 'Upgraded from free and never looked back. Full field access is real.', name: 'David' },
  ];

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
      <style
        dangerouslySetInnerHTML={{
          __html: `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;700;800;900&display=swap');
  .sq-wrap *,:root{--gold:#D4AF37;--black:#050505}
  .sq-topbar{display:flex;align-items:center;gap:16px;padding:20px 24px;position:sticky;top:0;z-index:10;background:rgba(5,5,5,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.04)}
  .sq-hero{text-align:center;padding:48px 24px 56px}
  .sq-badge{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:#D4AF37;margin-bottom:20px;background:rgba(212,175,55,0.08);padding:6px 14px;border-radius:100px;border:1px solid rgba(212,175,55,0.2)}
  .sq-hero h1{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(2.8rem,8vw,4.5rem);color:white;line-height:1;margin-bottom:8px}
  .sq-hero-sub{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.6);margin-bottom:20px}
  .sq-hero-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1rem;color:rgba(255,255,255,0.45);max-width:480px;margin:0 auto 40px;line-height:1.65}
  .sq-mandala{position:relative;width:200px;height:200px;margin:0 auto 48px}
  .sq-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(212,175,55,0.3);pointer-events:none}
  .sq-ring-1{width:180px;height:180px;animation:sqRingPulse 3s ease-in-out infinite}
  .sq-ring-2{width:140px;height:140px;animation:sqRingPulse 3s ease-in-out infinite 0.4s}
  .sq-ring-3{width:100px;height:100px;animation:sqRingPulse 3s ease-in-out infinite 0.8s}
  .sq-ring-4{width:60px;height:60px;animation:sqRingPulse 3s ease-in-out infinite 1.2s}
  .sq-section{max-width:720px;margin:0 auto;padding:0 24px 48px}
  .sq-section-label{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.5);margin-bottom:24px;display:flex;align-items:center;gap:12px}
  .sq-section-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,0.2),transparent)}
  .sq-glass{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:20px;padding:24px;backdrop-filter:blur(20px);margin-bottom:16px}
  .sq-included-card{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.08);margin-bottom:12px}
  .sq-included-card:last-child{margin-bottom:0}
  .sq-icon-wrap{width:48px;height:48px;border-radius:14px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sq-card-title{font-weight:700;font-size:13px;color:rgba(255,255,255,0.85);margin-bottom:2px}
  .sq-card-desc{font-size:11px;color:rgba(255,255,255,0.35)}
  .sq-portal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:520px){.sq-portal-grid{grid-template-columns:1fr}}
  .sq-portal-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:20px;text-align:center;transition:all 0.2s}
  .sq-portal-card:hover{border-color:rgba(212,175,55,0.25);background:rgba(212,175,55,0.03)}
  .sq-portal-card .t{font-weight:800;font-size:10px;letter-spacing:0.15em;color:rgba(255,255,255,0.7);margin-top:10px}
  .sq-pricing-card{position:relative;overflow:visible;background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.25);border-radius:24px;padding:32px;margin-bottom:16px}
  .sq-aura{position:absolute;inset:0;border-radius:24px;pointer-events:none;z-index:0}
  .sq-aura-1{border:1px solid rgba(212,175,55,0.5);animation:sqPulse 2.5s ease-in-out infinite}
  .sq-aura-2{border:1px solid rgba(212,175,55,0.3);animation:sqPulse 2.5s ease-in-out infinite 0.6s}
  .sq-aura-3{border:1px solid rgba(212,175,55,0.15);animation:sqPulse 2.5s ease-in-out infinite 1.2s}
  .sq-gold-btn{display:block;width:100%;background:#D4AF37;color:#050505;border:none;border-radius:100px;padding:14px 24px;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:opacity 0.2s;text-align:center}
  .sq-gold-btn:hover{opacity:0.9}
  .sq-gold-btn:disabled{opacity:0.6;cursor:not-allowed}
  .sq-success-box{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:24px;text-align:center;margin-bottom:16px}
  .sq-comparison{width:100%;border-collapse:collapse;font-size:11px}
  .sq-comparison th,.sq-comparison td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.06)}
  .sq-comparison th{font-weight:800;letter-spacing:0.1em;color:rgba(255,255,255,0.4);text-transform:uppercase}
  .sq-comparison td{color:rgba(255,255,255,0.6)}
  .sq-comparison .col-feature{width:45%;color:rgba(255,255,255,0.4)}
  .sq-comparison .col-free{width:27%}
  .sq-comparison .col-siddha{width:28%;color:#D4AF37}
  .sq-testimonials{display:flex;gap:16px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none}
  .sq-testimonials::-webkit-scrollbar{display:none}
  .sq-test-card{min-width:260px;flex-shrink:0;background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:18px;padding:20px}
  .sq-test-card .text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.95rem;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:12px}
  .sq-test-card .name{font-weight:800;font-size:9px;letter-spacing:0.2em;color:rgba(212,175,55,0.8)}
  .sq-faq-item{border-bottom:1px solid rgba(255,255,255,0.06);overflow:hidden}
  .sq-faq-q{padding:16px 20px;font-weight:800;font-size:11px;letter-spacing:0.1em;color:rgba(255,255,255,0.8);cursor:pointer;display:flex;justify-content:space-between;align-items:center}
  .sq-faq-q:hover{background:rgba(255,255,255,0.02)}
  .sq-faq-a{padding:0 20px;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;transition:max-height 0.3s ease}
  @keyframes sqPulse{0%{transform:scale(1);opacity:0.8}50%{transform:scale(1.04);opacity:0}100%{transform:scale(1.08);opacity:0}}
  @keyframes sqRingPulse{0%,100%{opacity:0.4}50%{opacity:1}}
  @keyframes slowSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes starMove{from{background-position:0 0}to{background-position:1000px 1000px}}
  @keyframes spin{to{transform:rotate(360deg)}}
`,
        }}
      />

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')", opacity: 0.18, pointerEvents: 'none', zIndex: 0, animation: 'starMove 180s linear infinite' }} />

      <div className="sq-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sq-topbar">
          <button type="button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 8 }} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Profile / Universal Field</span>
        </div>

        <section className="sq-hero">
          <div className="sq-badge">◈ Universal Path</div>
          <h1>Siddha–Quantum</h1>
          <div className="sq-hero-sub">Universal Field Node</div>
          <p className="sq-hero-desc">Full Nadi Scanner, Practice Scantions, Siddha Portal, Healing Audios & Transmissions, and the Sri Yantra Universal Protection Shield. One subscription, every module unlocked.</p>
          <div className="sq-mandala">
            <div className="sq-ring sq-ring-1" />
            <div className="sq-ring sq-ring-2" />
            <div className="sq-ring sq-ring-3" />
            <div className="sq-ring sq-ring-4" />
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'slowSpin 60s linear infinite' }}>
              <polygon points="40,8 68,72 12,72" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.6" />
              <polygon points="40,20 60,60 20,60" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.4" />
              <circle cx="40" cy="40" r="6" fill="#D4AF37" opacity="0.9" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 12, height: 12, borderRadius: '50%', background: '#D4AF37', transform: 'translate(-50%,-50%)', boxShadow: '0 0 20px rgba(212,175,55,0.8)' }} />
          </div>
        </section>

        <section className="sq-section">
          <div className="sq-section-label">◈ Everything in the Universal Field</div>
          {[
            { title: 'Digital Nadi Scanner', desc: '72,000 Nadi bio-sync, practice-based scantions' },
            { title: 'Practice Scantions', desc: 'Printed results that sync to your Soul Vault' },
            { title: 'Siddha Portal Access', desc: 'Full access to Siddha teachings and protocols' },
            { title: 'Full Healing Audios & Transmissions', desc: 'All frequencies and transmissions unlocked' },
            { title: 'Sri Yantra Universal Shield', desc: 'EMF coherence & fear-field protection across the app' },
          ].map((item) => (
            <div key={item.title} className="sq-included-card">
              <div className="sq-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="sq-card-title">{item.title}</div>
                <div className="sq-card-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="sq-section">
          <div className="sq-section-label">◈ Portals You Enter</div>
          <div className="sq-portal-grid">
            {['Vedic Astrology', 'Agni Protocols', 'Vayu Protocol 1km', 'Siddhi Acceleration', 'Soul Community', 'EMF & Fear Shield'].map((title) => (
              <div key={title} className="sq-portal-card">
                <div className="sq-icon-wrap" style={{ margin: '0 auto' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="t">{title}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="sq-section">
          <div className="sq-pricing-card">
            <div className="sq-aura sq-aura-1" />
            <div className="sq-aura sq-aura-2" />
            <div className="sq-aura sq-aura-3" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              {isPremium ? (
                <>
                  <div className="sq-success-box">
                    <div style={{ fontSize: 28, color: '#22c55e', marginBottom: 12 }}>✓</div>
                    <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', color: '#22c55e', marginBottom: 20 }}>◈ Universal Field Active</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button type="button" className="sq-gold-btn" onClick={() => navigate('/membership')}>Manage Subscription</button>
                      <button type="button" onClick={() => navigate('/dashboard')} style={{ background: 'transparent', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 100, padding: '12px 24px', fontWeight: 800, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer' }}>Explore Dashboard</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.15em', color: '#D4AF37', marginBottom: 8 }}>45€ <small style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ month</small></div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Cancel anytime · No lock-in · Instant access</div>
                  <button type="button" className="sq-gold-btn" onClick={handleSubscribe} disabled={checkoutLoading}>
                    {checkoutLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#050505', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Activating...
                      </span>
                    ) : (
                      '◈ Activate Universal Field'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>◈ Cancel anytime · No lock-in · Instant access</p>
          <p style={{ textAlign: 'center', marginTop: 10, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '0.83rem', color: 'rgba(255,255,255,0.18)' }}>
            Looking for something lighter?{' '}
            <button
              type="button"
              onClick={() => navigate('/prana-flow')}
              style={{ color: 'rgba(212,175,55,0.45)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontStyle: 'inherit', fontSize: 'inherit' }}
            >
              See Prana–Flow · 19€/mo →
            </button>
          </p>
          <p style={{
            textAlign: 'center', marginTop: 14,
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)'
          }}>
            Want everything forever?{' '}
            <button
              type="button"
              onClick={() => navigate('/akasha-infinity')}
              style={{
                color: 'rgba(212,175,55,0.55)', background: 'none', border: 'none',
                cursor: 'pointer', textDecoration: 'underline',
                fontFamily: 'inherit', fontStyle: 'inherit', fontSize: 'inherit'
              }}
            >
              See Akasha–Infinity →
            </button>
          </p>
        </section>

        <section className="sq-section">
          <div className="sq-section-label">◈ Free vs Siddha–Quantum</div>
          <div className="sq-glass">
            <table className="sq-comparison">
              <thead>
                <tr><th className="col-feature">Feature</th><th className="col-free">Free</th><th className="col-siddha">Siddha–Quantum</th></tr>
              </thead>
              <tbody>
                {[
                  ['Meditations & Mantras', 'Limited', 'Full library'],
                  ['Healing Audios', 'Limited', 'Full library'],
                  ['Breathing Protocols', 'Limited', 'Full library'],
                  ['Vayu Scrubber', '1 km', '1 km'],
                  ['Community Chat & Live', 'Access', 'Access'],
                  ['Ayurveda & Jyotish', 'Basic', 'Full + Chat'],
                  ['Digital Nadi Scanner', '—', 'Included'],
                  ['Practice Scantions', '—', 'Included'],
                  ['Siddha Portal', '—', 'Included'],
                  ['Sri Yantra Shield', '—', 'Active'],
                  ['Price', 'Free', '45€/mo'],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="col-feature">{row[0]}</td>
                    <td className="col-free">{row[1]}</td>
                    <td className="col-siddha">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sq-section">
          <div className="sq-section-label">◈ What Others Say</div>
          <div className="sq-testimonials">
            {testimonials.map((t, i) => (
              <div key={i} className="sq-test-card">
                <div className="text">&ldquo;{t.text}&rdquo;</div>
                <div className="name">— {t.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="sq-section">
          <div className="sq-section-label">◈ FAQ</div>
          <div className="sq-glass">
            {faqItems.map((item, i) => (
              <div key={i} className="sq-faq-item">
                <div className="sq-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </div>
                <div className="sq-faq-a" style={{ maxHeight: openFaq === i ? 200 : 0, paddingTop: openFaq === i ? 12 : 0, paddingBottom: openFaq === i ? 16 : 0 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {!isPremium && (
          <section className="sq-section">
            <button type="button" className="sq-gold-btn" onClick={handleSubscribe} disabled={checkoutLoading}>
              {checkoutLoading ? 'Activating...' : '◈ Activate Universal Field — 45€/mo'}
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default SiddhaQuantum;
