import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PranaFlow: React.FC = () => {
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
      toast.success('◈ Prana Field Activated — Welcome to Sonic Vibration');
      refreshMembership();
      navigate('/prana-flow', { replace: true });
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled — no charge made');
      navigate('/prana-flow', { replace: true });
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
    const COLORS = ['rgba(212,175,55,', 'rgba(212,175,55,', 'rgba(245,215,110,', 'rgba(255,255,255,', 'rgba(20,184,166,'];
    const pts = Array.from({ length: 180 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r: Math.random() * 1.5 + 0.2,
      a: Math.random() * 0.35 + 0.06,
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
      toast.success('You already have access to this field');
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
        .eq('slug', 'prana-monthly')
        .single();

      if (tierError || !tierData?.stripe_price_id) {
        toast.error('Tier not available — contact support');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        body: {
          priceId: tierData.stripe_price_id,
          tierSlug: 'prana-monthly',
          affiliate_id: affiliateRef,
          successPath: '/prana-flow',
          metadata: {
            tier_name: 'Prana–Flow',
            source_page: 'prana-flow',
          },
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Checkout failed — please try again');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const faqItems: [string, string][] = [
    ['What happens when I subscribe?', 'All five modules open instantly — Vedic Jyotish, Ayurvedic Scan, Vastu Guide, Healing Music Library, and Meditation & Mantra Library. There is no waiting period. You can navigate to any module from the dashboard the moment the payment is confirmed.'],
    ['Does Prana–Flow include Nadi scanning?', 'No — the Digital Nadi Scanner and Siddha Portal Access are part of the Siddha-Quantum tier at 45€/month. Prana-Flow focuses on Vedic intelligence, sound healing, and Ayurveda. You can upgrade at any time.'],
    ['Can I cancel anytime?', 'Yes, completely. Cancel directly from your profile — no emails, no forms, no waiting. Access continues until the end of your billing cycle, and you can reactivate with one tap anytime.'],
    ['How personalised is the Jyotish Guru?', "The Guru reads your full natal chart — all 12 houses, planetary positions, Nakshatra placements, and current Dasha period — before it answers any question. It is not a generic horoscope. It understands the specific geometry of your soul's map."],
    ['Is there a difference between Prana–Flow and Siddha–Quantum?', 'Prana-Flow is the Vedic intelligence and sound healing layer. Siddha-Quantum adds the bio-energetic scanning and protection tools — the Digital Nadi Scanner, Sri Yantra Universal Shield, all 6 Vedic Siddhis, and Siddha Portal Access. If you feel drawn to deeper energy work and bio-field clearing, Siddha-Quantum is the natural next step.'],
  ];

  const includesList = [
    { title: 'Full Vedic Jyotish + Guru Chat', desc: 'Complete natal chart, daily planetary influences, Dasha timeline, Soul Blueprint, Yoga Activations, and a Jyotish Guru you can ask anything — available whenever you need guidance.', badge: 'Full Access' },
    { title: 'Full Ayurvedic Scan + Chat', desc: 'Prakriti and Vikriti assessment, Dosha balance analysis, seasonal and daily protocols, personalised diet and lifestyle guidance, and a Vaidya for questions about your body.', badge: 'Full Access' },
    { title: 'Vastu Guide for Home', desc: 'The science of sacred space. Sacred Vastu analysis of your home — identify energy blockages, optimise room directions, harmonise your living field with cosmic forces.', badge: 'Full Access' },
    { title: 'All Healing Music — Full Library', desc: 'Every sacred frequency in the library — Solfeggio tones, Raga healing sessions, Binaural Theta states, and planetary sound sequences composed for each dosha and moon phase.', badge: 'Full Library' },
    { title: 'Divine Transmission Audios', desc: 'Sacred transmissions encoded with high-frequency healing intelligence — channelled sound sequences that activate dormant Nadi pathways and open the Anahata field.', badge: 'Full Access' },
    { title: 'Full Meditation & Mantra Library', desc: 'Guided meditations for every state — morning Sadhana, mid-day grounding, sleep Yoga Nidra. Plus the complete Mantra library with pronunciation guides and planetary correlations.', badge: 'Full Library' },
  ];

  const modulesList = [
    { title: 'Jyotish Oracle', desc: 'Natal chart + Dasha timeline + daily planetary transits + Jyotish Guru that knows your chart. Ask anything — relationships, health, timing, career.' },
    { title: 'Ayurveda Portal', desc: 'Vata–Pitta–Kapha constitution scan, seasonal adjustment protocol, food and herb guidance, daily Dinacharya routine calibrated to your Prakriti.' },
    { title: 'Sacred Sound Library', desc: '417Hz trauma release · 528Hz DNA repair · 639Hz heart opening · 741Hz intuition · 963Hz crown activation · Planetary Ragas for each day of the week · Moon phase ceremonies · Yoga Nidra for deep sleep · Morning Pranayama sequences. All in one living library, always expanding.', wide: true },
    { title: 'Vastu Analysis', desc: "Our guide scans your home's energy map. Room-by-room guidance on colour, placement, and direction to align your space with Brahma Sthana and the five elements." },
    { title: 'Mantra Library', desc: '108 Beeja mantras, Gayatri variations, Planetary Stotras, Healing Kavachas — each with pronunciation audio, meaning, and the optimal time to chant.' },
  ];

  const stepsList = [
    { num: 'I', strong: 'Subscribe — instant field access', text: 'Subscribe and every module opens immediately. No waiting, no onboarding sequence — your field is live from the first breath.' },
    { num: 'II', strong: 'Enter your birth data', text: 'Name, date, time, and place of birth. This is the seed coordinate that personalises the Jyotish chart, the Ayurvedic scan, and the Vastu guide to your exact soul signature.' },
    { num: 'III', strong: 'Open your first session', text: 'Start with your Jyotish chart or the Dosha assessment — or go straight to the healing library and let sound do the work first. There is no wrong door to enter.' },
    { num: 'IV', strong: 'Let the field build', text: 'Prana compounds with consistent exposure. Daily contact with your chart, your sound library, and your Vastu creates a coherent field in your life within weeks.' },
  ];

  const compareRows: [string, string, string, string][] = [
    ['Vedic Jyotish Chart', 'Basic', '◈', '◈'],
    ['Guru Chat', '—', '◈', '◈'],
    ['Ayurvedic Scan', '—', '◈', '◈'],
    ['Vaidya Chat', '—', '◈', '◈'],
    ['Vastu Guide', '—', '◈', '◈'],
    ['Healing Music Library', '—', '◈', '◈'],
    ['Mantra Library', '—', '◈', '◈'],
    ['Digital Nadi Scanner', '—', '—', '◈'],
    ['Sri Yantra Shield · EMF', '—', '—', '◈'],
    ['Vedic Siddhis', '3 free', '3 free', '◈'],
    ['Price', 'Free', '19€/mo', '45€/mo'],
  ];

  const testimonials = [
    { text: "The Guru knows my chart better than any human astrologer I've paid hundreds of euros to. I ask it about my week every Monday morning.", name: 'Mia K. · Helsinki' },
    { text: "The Ayurveda scan told me something I had suspected for 10 years — I am a Vata-dominant constitution and I had been living as if I were Pitta. Three weeks of adjustments changed everything.", name: 'Lucas R. · Berlin' },
    { text: "I fall asleep to the Yoga Nidra recordings every night. I haven't needed sleeping pills since I subscribed. That alone is worth 19€.", name: 'Ingrid H. · Oslo' },
    { text: "The Vastu analysis told me my workspace was in the Rahu zone of my flat. I moved my desk — it sounds crazy but my concentration doubled.", name: 'Thomas W. · Amsterdam' },
    { text: "19€ for a full Vedic astrology system, Ayurveda coach, Vastu guide AND a sound library? I was paying 120€/month between different apps for less.", name: 'Sofia M. · Stockholm' },
  ];

  const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;700;800;900&display=swap');
  .pf-wrap *,:root{--gold:#D4AF37;--black:#050505}
  .pf-topbar{display:flex;align-items:center;padding:20px 24px 0;gap:12px}
  .pf-back-btn{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0}
  .pf-back-btn:hover{border-color:rgba(212,175,55,0.3)}
  .pf-top-label{font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.2)}
  .pf-hero{padding:52px 24px 0;text-align:center;max-width:620px;margin:0 auto}
  .pf-hero-badge{display:inline-flex;align-items:center;gap:10px;border:1px solid rgba(212,175,55,0.25);border-radius:100px;padding:9px 22px;margin-bottom:32px;font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.7);background:rgba(212,175,55,0.06)}
  .pf-hero-badge-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 10px rgba(212,175,55,0.9)}
  .pf-hero-eyebrow{font-weight:800;font-size:7px;letter-spacing:0.6em;text-transform:uppercase;color:rgba(212,175,55,0.3);margin-bottom:16px}
  .pf-hero-title{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(3.2rem,10vw,5.6rem);line-height:0.9;color:white;margin-bottom:6px;text-shadow:0 0 60px rgba(212,175,55,0.15)}
  .pf-hero-title .gold{color:var(--gold)}
  .pf-hero-sub{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.18);margin-bottom:28px}
  .pf-hero-price-block{margin-bottom:28px}
  .pf-hero-price{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:4.8rem;color:white;line-height:1;letter-spacing:-0.03em;text-shadow:0 0 40px rgba(212,175,55,0.25)}
  .pf-hero-price-label{font-weight:800;font-size:7px;letter-spacing:0.45em;text-transform:uppercase;color:rgba(212,175,55,0.45);margin-top:4px}
  .pf-hero-price-sub{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:rgba(255,255,255,0.22);margin-top:5px}
  .pf-hero-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:300;font-size:1.1rem;line-height:1.95;color:rgba(255,255,255,0.35);margin-bottom:48px}
  .pf-mandala-wrap{position:relative;width:260px;height:260px;margin:0 auto 64px}
  .pf-m-aura{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none}
  .pf-m-aura-1{width:240px;height:240px;background:radial-gradient(circle,rgba(212,175,55,0.18) 0%,transparent 65%);filter:blur(18px);animation:pfAuraBreath 5s ease-in-out infinite}
  .pf-m-aura-2{width:160px;height:160px;background:radial-gradient(circle,rgba(20,184,166,0.1) 0%,transparent 65%);filter:blur(14px);animation:pfAuraBreath 4s ease-in-out infinite 1.5s}
  .pf-m-ring{position:absolute;top:50%;left:50%;border-radius:50%;transform:translate(-50%,-50%)}
  .pf-m-ring-1{width:258px;height:258px;border:1px solid rgba(212,175,55,0.07);animation:pfRingBreath 6s ease-in-out infinite 0s}
  .pf-m-ring-2{width:210px;height:210px;border:1px solid rgba(212,175,55,0.1);animation:pfRingBreath 6s ease-in-out infinite 0.8s}
  .pf-m-ring-3{width:162px;height:162px;border:1px solid rgba(212,175,55,0.18);animation:pfRingBreath 6s ease-in-out infinite 1.6s}
  .pf-m-ring-4{width:114px;height:114px;border:1px solid rgba(212,175,55,0.3);animation:pfRingBreath 6s ease-in-out infinite 2.4s}
  .pf-m-ring-5{width:66px;height:66px;border:1px solid rgba(212,175,55,0.5);animation:pfRingBreath 6s ease-in-out infinite 3.2s}
  .pf-m-wave-svg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:pfSlowSpin 90s linear infinite}
  .pf-m-inner-svg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:pfSlowSpinRev 60s linear infinite}
  .pf-m-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,0.75) 0%,rgba(212,175,55,0.25) 50%,transparent 100%);filter:blur(5px)}
  .pf-m-core-dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:9px;height:9px;border-radius:50%;background:#D4AF37;box-shadow:0 0 18px rgba(212,175,55,1),0 0 36px rgba(212,175,55,0.5)}
  .pf-prana-truth{max-width:560px;margin:0 auto 64px;padding:0 24px;text-align:center}
  .pf-prana-truth-title{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(1.5rem,5vw,2.2rem);color:white;margin-bottom:18px}
  .pf-prana-truth-body{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1rem;color:rgba(255,255,255,0.32);line-height:2}
  .pf-prana-truth-body strong{color:rgba(212,175,55,0.6);font-weight:600;font-style:normal}
  .pf-section-wrap{max-width:560px;margin:0 auto;padding:0 24px}
  .pf-section-label{font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.38);display:flex;align-items:center;gap:12px;margin-bottom:26px}
  .pf-section-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,0.1),transparent)}
  .pf-includes-list{display:flex;flex-direction:column;gap:2px;margin-bottom:56px;border:1px solid rgba(212,175,55,0.09);border-radius:24px;overflow:hidden}
  .pf-inc-item{display:flex;align-items:center;gap:16px;padding:20px 22px;background:rgba(255,255,255,0.015);transition:background 0.2s}
  .pf-inc-item:not(:last-child){border-bottom:1px solid rgba(212,175,55,0.055)}
  .pf-inc-item:hover{background:rgba(212,175,55,0.03)}
  .pf-i-icon{width:42px;height:42px;flex-shrink:0;border-radius:13px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.13);display:flex;align-items:center;justify-content:center}
  .pf-i-text{flex:1}
  .pf-i-title{font-weight:800;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);display:block;margin-bottom:3px}
  .pf-i-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.85rem;color:rgba(255,255,255,0.25);line-height:1.5}
  .pf-i-badge{font-weight:800;font-size:6.5px;letter-spacing:0.3em;text-transform:uppercase;padding:4px 9px;border-radius:100px;flex-shrink:0;white-space:nowrap;color:var(--gold);background:rgba(212,175,55,0.09);border:1px solid rgba(212,175,55,0.22)}
  .pf-modules-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:56px}
  @media(max-width:400px){.pf-modules-grid{grid-template-columns:1fr}}
  .pf-mod-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.08);border-radius:20px;padding:22px 16px;position:relative;overflow:hidden;transition:all 0.25s}
  .pf-mod-card::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:55%;height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.25),transparent)}
  .pf-mod-card:hover{border-color:rgba(212,175,55,0.2);transform:translateY(-2px);background:rgba(212,175,55,0.02)}
  .pf-mod-icon{width:46px;height:46px;border-radius:14px;background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.11);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .pf-mod-title{font-weight:800;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.52);display:block;margin-bottom:5px}
  .pf-mod-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.82rem;color:rgba(255,255,255,0.2);line-height:1.6}
  .pf-tier-divider{display:flex;align-items:center;gap:16px;margin:0 24px 56px}
  .pf-tier-divider::before,.pf-tier-divider::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,0.12),transparent)}
  .pf-tier-divider-text{font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(212,175,55,0.25);white-space:nowrap}
  .pf-price-card{position:relative;border-radius:28px;padding:1.5px;margin-bottom:16px;background:linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.06),rgba(212,175,55,0.25))}
  .pf-price-card-inner{background:linear-gradient(160deg,rgba(212,175,55,0.05) 0%,rgba(5,5,5,0.98) 45%);border-radius:26px;padding:38px 28px;position:relative;overflow:hidden}
  .pf-price-aura{position:absolute;inset:-2px;border-radius:30px;pointer-events:none}
  .pf-price-aura-a{border:1px solid rgba(212,175,55,0.45);animation:pfSqPulse 3.5s ease-in-out infinite 0s}
  .pf-price-aura-b{border:1px solid rgba(212,175,55,0.22);animation:pfSqPulse 3.5s ease-in-out infinite 0.9s}
  .pf-price-aura-c{border:1px solid rgba(212,175,55,0.1);animation:pfSqPulse 3.5s ease-in-out infinite 1.8s}
  .pf-p-inner{position:relative;z-index:1}
  .pf-p-eyebrow{font-weight:800;font-size:7px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.4);display:block;margin-bottom:10px}
  .pf-p-name{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:2.6rem;color:white;display:block;margin-bottom:4px;text-shadow:0 0 28px rgba(212,175,55,0.2)}
  .pf-p-name .gold{color:var(--gold)}
  .pf-p-subname{font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.18);margin-bottom:26px;display:block}
  .pf-p-price-row{display:flex;align-items:baseline;gap:8px;margin-bottom:6px}
  .pf-p-price{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:4rem;color:white;line-height:1;text-shadow:0 0 36px rgba(212,175,55,0.3)}
  .pf-p-mo{font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.28)}
  .pf-p-tagline{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.88rem;color:rgba(212,175,55,0.45);margin-bottom:26px}
  .pf-p-features{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:26px}
  @media(max-width:420px){.pf-p-features{grid-template-columns:1fr}}
  .pf-p-features li{list-style:none;font-size:10.5px;color:rgba(255,255,255,0.38);padding:5px 0;display:flex;align-items:center;gap:8px}
  .pf-p-features li::before{content:'◈';color:var(--gold);font-size:7px;flex-shrink:0}
  .pf-cta-btn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;background:var(--gold);color:#050505;border:none;border-radius:100px;padding:17px 32px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:9.5px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;margin-bottom:12px;box-shadow:0 0 36px rgba(212,175,55,0.5),0 0 72px rgba(212,175,55,0.18)}
  .pf-cta-btn:hover:not(:disabled){opacity:0.88;transform:translateY(-2px)}
  .pf-cta-btn:disabled{opacity:0.6;cursor:not-allowed}
  .pf-cta-secondary{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:transparent;color:rgba(212,175,55,0.45);border:1px solid rgba(212,175,55,0.18);border-radius:100px;padding:13px 32px;font-family:'Montserrat',sans-serif;font-weight:800;font-size:8.5px;letter-spacing:0.33em;text-transform:uppercase;cursor:pointer;transition:all 0.2s}
  .pf-cta-secondary:hover{border-color:rgba(212,175,55,0.38);color:var(--gold)}
  .pf-cta-note{text-align:center;font-weight:800;font-size:7px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.09);margin-top:14px}
  .pf-success-box{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:24px;text-align:center;margin-bottom:16px}
  .pf-compare-table{border-radius:20px;overflow:hidden;border:1px solid rgba(212,175,55,0.09);margin-bottom:56px}
  .pf-compare-row{display:grid;grid-template-columns:1fr 70px 70px 80px}
  .pf-compare-row.header{background:rgba(212,175,55,0.04);border-bottom:1px solid rgba(212,175,55,0.09)}
  .pf-compare-row:not(.header){border-bottom:1px solid rgba(255,255,255,0.035)}
  .pf-compare-row:not(.header):last-child{border-bottom:none}
  .pf-cc{padding:11px 12px;font-size:10.5px;display:flex;align-items:center}
  .pf-cc.center{justify-content:center}
  .pf-cc.feature{font-weight:600;color:rgba(255,255,255,0.38);font-size:10px}
  .pf-cc.col-head{font-weight:800;font-size:7px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.22);justify-content:center}
  .pf-cc.col-head.active{color:var(--gold)}
  .pf-y{color:var(--gold);font-size:12px}
  .pf-n{color:rgba(255,255,255,0.09);font-size:12px}
  .pf-steps-list{display:flex;flex-direction:column;gap:0;margin-bottom:56px}
  .pf-step-item{display:flex;align-items:flex-start;gap:16px;padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
  .pf-step-item:last-child{border-bottom:none}
  .pf-step-num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:2rem;color:rgba(212,175,55,0.2);line-height:1;flex-shrink:0;width:30px}
  .pf-step-text strong{font-weight:800;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);display:block;margin-bottom:4px}
  .pf-step-text span{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:rgba(255,255,255,0.24);line-height:1.7}
  .pf-t-scroll{display:flex;gap:12px;overflow-x:auto;padding:0 24px 8px;scrollbar-width:none;margin-bottom:56px}
  .pf-t-scroll::-webkit-scrollbar{display:none}
  .pf-t-card{min-width:235px;background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.09);border-radius:18px;padding:22px 18px;flex-shrink:0}
  .pf-t-stars{color:var(--gold);font-size:9px;letter-spacing:3px;margin-bottom:10px}
  .pf-t-text{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.88rem;color:rgba(255,255,255,0.3);line-height:1.75;margin-bottom:12px}
  .pf-t-name{font-weight:800;font-size:7px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(212,175,55,0.4)}
  .pf-faq-item{border-bottom:1px solid rgba(255,255,255,0.04);padding:17px 0;cursor:pointer}
  .pf-faq-item:last-child{border-bottom:none}
  .pf-faq-q{font-weight:800;font-size:10px;letter-spacing:0.07em;color:rgba(255,255,255,0.42);display:flex;justify-content:space-between;align-items:center;gap:16px}
  .pf-faq-a{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.89rem;color:rgba(255,255,255,0.27);max-height:0;overflow:hidden;transition:max-height 0.3s ease;line-height:1.75}
  .pf-final-cta{background:linear-gradient(155deg,rgba(212,175,55,0.08) 0%,rgba(212,175,55,0.02) 60%);border:1px solid rgba(212,175,55,0.18);border-radius:28px;padding:44px 26px;text-align:center;position:relative;overflow:hidden}
  .pf-final-title{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(1.8rem,5.5vw,2.6rem);color:white;margin-bottom:12px;text-shadow:0 0 40px rgba(212,175,55,0.18)}
  .pf-final-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.96rem;color:rgba(255,255,255,0.26);line-height:1.8;margin-bottom:28px;max-width:400px;margin-left:auto;margin-right:auto}
  .pf-final-price-row{display:flex;align-items:baseline;justify-content:center;gap:8px;margin-bottom:28px}
  .pf-final-price{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:3.2rem;color:white}
  .pf-final-price-mo{font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.22)}
  @keyframes pfAuraBreath{0%,100%{opacity:0.35}50%{opacity:0.85}}
  @keyframes pfRingBreath{0%,100%{opacity:0.45}50%{opacity:1}}
  @keyframes pfSlowSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes pfSlowSpinRev{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
  @keyframes pfSqPulse{0%{transform:scale(1);opacity:0.9}50%{transform:scale(1.04);opacity:0}100%{transform:scale(1.08);opacity:0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  `;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', fontFamily: 'Montserrat,sans-serif', overflowX: 'hidden', paddingBottom: 120, position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 0, right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="pf-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pf-topbar">
          <button type="button" className="pf-back-btn" onClick={() => navigate('/profile')} aria-label="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="pf-top-label">Profile / Prana–Flow</span>
        </div>

        <section className="pf-hero">
          <div className="pf-hero-badge">
            <div className="pf-hero-badge-dot" />
            ◈ Sonic Vibration Field · 19€/mo · Cancel Anytime
          </div>
          <div className="pf-hero-eyebrow">The Second Tier</div>
          <h1 className="pf-hero-title">Prana–<span className="gold">Flow</span></h1>
          <div className="pf-hero-sub">Vedic Intelligence · Sonic Vibration · Living Wisdom</div>
          <div className="pf-hero-price-block">
            <div className="pf-hero-price">19€<small style={{ fontSize: '1.6rem', color: 'rgba(255,255,255,0.3)' }}> /mo</small></div>
            <div className="pf-hero-price-label">◈ Cancel anytime · Full access from day one</div>
            <div className="pf-hero-price-sub">Everything you need to live in alignment with cosmic rhythm</div>
          </div>
          <p className="pf-hero-desc">Prana is the living force that moves through all things — breath, light, sound, intelligence. Prana–Flow gives you the full Vedic intelligence system: your astrology, your Ayurvedic body type, your home&apos;s energy field, and the complete library of sacred sound that carries your system back into resonance.</p>

          <div className="pf-mandala-wrap">
            <div className="pf-m-aura pf-m-aura-1" />
            <div className="pf-m-aura pf-m-aura-2" />
            <div className="pf-m-ring pf-m-ring-1" />
            <div className="pf-m-ring pf-m-ring-2" />
            <div className="pf-m-ring pf-m-ring-3" />
            <div className="pf-m-ring pf-m-ring-4" />
            <div className="pf-m-ring pf-m-ring-5" />
            <svg className="pf-m-wave-svg" width={220} height={220} viewBox="0 0 220 220" fill="none">
              <circle cx="110" cy="110" r="104" stroke="rgba(212,175,55,0.06)" strokeWidth="0.8" />
              {[0, 60, 120, 180, 240, 300].map((rot) => (
                <g key={rot} transform={`rotate(${rot} 110 110)`}>
                  <path d="M110 22 C120 50 120 80 110 98" stroke="rgba(212,175,55,0.55)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                  <path d="M108 22 C98 50 98 80 108 98" stroke="rgba(212,175,55,0.3)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
                </g>
              ))}
              <circle cx="110" cy="110" r="18" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.25)" strokeWidth="1" />
            </svg>
            <svg className="pf-m-inner-svg" width={130} height={130} viewBox="0 0 130 130" fill="none">
              <circle cx="65" cy="65" r="58" stroke="rgba(212,175,55,0.18)" strokeWidth="1" strokeDasharray="2,8" />
              <circle cx="65" cy="65" r="40" stroke="rgba(212,175,55,0.25)" strokeWidth="1" strokeDasharray="2,6" />
              <circle cx="65" cy="65" r="22" stroke="rgba(212,175,55,0.4)" strokeWidth="1.2" />
              <path d="M30 65 C38 55 45 75 53 65 C61 55 68 75 76 65 C84 55 91 75 99 65" stroke="rgba(212,175,55,0.5)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            </svg>
            <div className="pf-m-core" />
            <div className="pf-m-core-dot" />
          </div>
        </section>

        <div className="pf-prana-truth">
          <h2 className="pf-prana-truth-title">What Prana actually is</h2>
          <p className="pf-prana-truth-body">
            <strong>Prana</strong> is not air. It is the intelligent life force that organises all matter, thought, and experience. The ancient Rishis understood that when prana flows freely — through the body, through the home, through the rhythms of planetary time — health, clarity, and purpose arise naturally. Prana–Flow gives you the <strong>complete Vedic intelligence system</strong> to understand your body type, your cosmic blueprint, your living space, and the <strong>sonic frequencies</strong> that restore your system to its original harmony.
          </p>
        </div>

        <div className="pf-section-wrap">
          <div className="pf-section-label">◈ Everything included</div>
        </div>
        <div className="pf-section-wrap" style={{ padding: '0 24px' }}>
          <div className="pf-includes-list">
            {includesList.map((item) => (
              <div key={item.title} className="pf-inc-item">
                <div className="pf-i-icon">
                  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                    <path d="M3 14 C3 14 8 6 14 6 C20 6 25 14 25 14 C25 14 20 22 14 22 C8 22 3 14 3 14Z" fill="rgba(212,175,55,0.05)" stroke="#D4AF37" strokeWidth="1.3" strokeLinejoin="round" />
                    <circle cx="14" cy="14" r="4" fill="rgba(212,175,55,0.09)" stroke="#D4AF37" strokeWidth="1.3" />
                    <circle cx="14" cy="14" r="1.6" fill="#D4AF37" />
                  </svg>
                </div>
                <div className="pf-i-text">
                  <span className="pf-i-title">{item.title}</span>
                  <span className="pf-i-desc">{item.desc}</span>
                </div>
                <span className="pf-i-badge">{item.badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-section-wrap" style={{ marginTop: 56 }}>
          <div className="pf-section-label">◈ Inside each module</div>
          <div className="pf-modules-grid">
            {modulesList.map((mod) => (
              <div key={mod.title} className="pf-mod-card" style={mod.wide ? { gridColumn: 'span 2' } : undefined}>
                <div className="pf-mod-icon">
                  <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                    <path d="M3 14 C3 14 8 6 14 6 C20 6 25 14 25 14 C25 14 20 22 14 22 C8 22 3 14 3 14Z" fill="rgba(212,175,55,0.05)" stroke="#D4AF37" strokeWidth="1.3" strokeLinejoin="round" />
                    <circle cx="14" cy="14" r="3.5" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="1.2" />
                    <circle cx="14" cy="14" r="1.4" fill="#D4AF37" />
                  </svg>
                </div>
                <span className="pf-mod-title">{mod.title}</span>
                <span className="pf-mod-desc">{mod.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-section-wrap" style={{ marginTop: 0 }}>
          <div className="pf-section-label">◈ How it activates</div>
          <div className="pf-steps-list">
            {stepsList.map((step) => (
              <div key={step.num} className="pf-step-item">
                <span className="pf-step-num">{step.num}</span>
                <div className="pf-step-text">
                  <strong>{step.strong}</strong>
                  <span>{step.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-tier-divider" style={{ marginTop: 56 }}>
          <span className="pf-tier-divider-text">◈ Everything included for 19€/mo</span>
        </div>

        <div className="pf-section-wrap">
          <div className="pf-price-card">
            <div className="pf-price-aura pf-price-aura-a" />
            <div className="pf-price-aura pf-price-aura-b" />
            <div className="pf-price-aura pf-price-aura-c" />
            <div className="pf-price-card-inner">
              <div className="pf-p-inner">
                {isPremium ? (
                  <>
                    <div className="pf-success-box">
                      <div style={{ fontWeight: 800, fontSize: 10, letterSpacing: '0.3em', color: '#22c55e', marginBottom: 12 }}>◈ PRANA FIELD ACTIVE</div>
                      <div style={{ fontFamily: 'Cormorant Garamond,serif', fontStyle: 'italic', fontSize: '1.2rem', color: 'white', marginBottom: 20 }}>Your sonic vibration field is live.</div>
                      <button type="button" className="pf-cta-btn" onClick={() => navigate('/vedic-astrology')} style={{ marginBottom: 10 }}>◈ Open Vedic Oracle</button>
                      <button type="button" className="pf-cta-secondary" onClick={() => navigate('/ayurveda')}>◈ Open Ayurveda</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="pf-p-eyebrow">◈ Second Tier · Monthly</span>
                    <span className="pf-p-name">Prana–<span className="gold">Flow</span></span>
                    <span className="pf-p-subname">Sonic Vibration Field · Full Vedic Intelligence</span>
                    <div className="pf-p-price-row">
                      <span className="pf-p-price">19€</span>
                      <span className="pf-p-mo">/ month</span>
                    </div>
                    <div className="pf-p-tagline">Full access. Cancel anytime. No lock-in.</div>
                    <ul className="pf-p-features">
                      <li>Full Vedic Jyotish Oracle</li><li>Guru Chat</li><li>Full Ayurvedic Scan</li><li>Vaidya Chat</li>
                      <li>Vastu Home Analysis</li><li>All Healing Music</li><li>Divine Transmission Audios</li><li>Full Mantra Library</li>
                      <li>Meditation Library</li><li>Yoga Nidra Sessions</li><li>Soul Blueprint</li>
                    </ul>
                    <button type="button" className="pf-cta-btn" onClick={handleSubscribe} disabled={checkoutLoading}>
                      {checkoutLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#050505', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Activating...
                        </span>
                      ) : (
                        <>◈ Activate Prana–Flow · 19€/mo</>
                      )}
                    </button>
                    <button type="button" className="pf-cta-secondary" onClick={() => navigate('/siddha-quantum')}>Or upgrade to Siddha–Quantum · 45€/mo</button>
                    <div className="pf-cta-note">◈ Cancel anytime · Full access from day one · Affiliate 30% on referrals</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pf-section-wrap" style={{ marginTop: 56 }}>
          <div className="pf-section-label">◈ Free vs Prana–Flow vs Siddha–Quantum</div>
          <div className="pf-compare-table">
            <div className="pf-compare-row header">
              <div className="pf-cc col-head feature">Feature</div>
              <div className="pf-cc col-head">Free</div>
              <div className="pf-cc col-head active">Prana</div>
              <div className="pf-cc col-head">Siddha</div>
            </div>
            {compareRows.map((row, i) => (
              <div key={i} className="pf-compare-row">
                <div className="pf-cc feature">{row[0]}</div>
                <div className="pf-cc center">
                  <span className={row[1] === '◈' ? 'pf-y' : row[1] === '—' ? 'pf-n' : ''} style={row[1] !== '◈' && row[1] !== '—' ? { fontSize: 9, color: 'rgba(255,255,255,0.2)' } : undefined}>{row[1]}</span>
                </div>
                <div className="pf-cc center"><span className="pf-y">{row[2]}</span></div>
                <div className="pf-cc center"><span className={row[3] === '◈' ? 'pf-y' : ''} style={row[3] !== '◈' ? { fontSize: 9, color: 'rgba(255,255,255,0.3)' } : undefined}>{row[3]}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-section-wrap" style={{ marginTop: 56 }}>
          <div className="pf-section-label">◈ From the field</div>
        </div>
        <div className="pf-t-scroll">
          {testimonials.map((t, i) => (
            <div key={i} className="pf-t-card">
              <div className="pf-t-stars">★★★★★</div>
              <p className="pf-t-text">&ldquo;{t.text}&rdquo;</p>
              <div className="pf-t-name">{t.name}</div>
            </div>
          ))}
        </div>

        <div className="pf-section-wrap">
          <div className="pf-section-label">◈ Questions</div>
          <div>
            {faqItems.map(([q, a], i) => (
              <div key={i} className="pf-faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="pf-faq-q">
                  {q}
                  <span style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: openFaq === i ? 'var(--gold)' : 'rgba(212,175,55,0.38)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </div>
                <div className="pf-faq-a" style={{ maxHeight: openFaq === i ? 200 : 0, paddingTop: openFaq === i ? 11 : 0 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-section-wrap" style={{ marginTop: 56 }}>
          <div className="pf-final-cta">
            <h2 className="pf-final-title">Let the Prana flow.</h2>
            <p className="pf-final-desc">Full Vedic intelligence. Complete sound healing library. Your home in cosmic order. All for 19€/month — less than one session with any practitioner.</p>
            <div className="pf-final-price-row">
              <span className="pf-final-price">19€</span>
              <span className="pf-final-price-mo">/ month · cancel anytime</span>
            </div>
            <button type="button" className="pf-cta-btn" onClick={handleSubscribe} disabled={checkoutLoading} style={{ maxWidth: 400, margin: '0 auto 12px', display: 'flex' }}>
              {checkoutLoading ? 'Activating...' : '◈ Activate Prana–Flow'}
            </button>
            <button type="button" className="pf-cta-secondary" onClick={() => navigate('/siddha-quantum')} style={{ maxWidth: 400, margin: '0 auto 12px', display: 'flex' }}>Upgrade to Siddha–Quantum · 45€/mo</button>
            <p style={{ textAlign: 'center', marginTop: 10, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.18)' }}>
              Want everything forever?{' '}
              <button type="button" onClick={() => navigate('/akasha-infinity')} style={{ color: 'rgba(212,175,55,0.5)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>See Akasha–Infinity →</button>
            </p>
            <div className="pf-cta-note" style={{ marginTop: 16 }}>◈ 30% affiliate commission · Full access instantly · Cancel anytime</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PranaFlow;
