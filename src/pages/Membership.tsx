import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useMembership } from '@/hooks/useMembership';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { MembershipHub } from '@/features/membership/MembershipHub';
import { toast } from 'sonner';

// ◈ SQI 2050 — Only 3 tiers:
//   /prana-flow      → 19€/mo   (prana-monthly)
//   /siddha-quantum  → 45€/mo   (siddha-quantum-monthly)
//   /akasha-infinity → €1111    (lifetime)
// Annual and old premium-monthly/premium-annual plans REMOVED from hub marketing.

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@400;700;800;900&display=swap');

.mem-wrap { min-height: 100vh; background: #050505; color: white; font-family: 'Montserrat', sans-serif; padding-bottom: 120px; }
.mem-hero { text-align: center; padding: 52px 24px 40px; position: relative; }
.mem-hero::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 120px; height: 1px; background: linear-gradient(to right, transparent, rgba(212,175,55,0.25), transparent); }
.mem-eyebrow { font-weight: 800; font-size: 7px; letter-spacing: 0.55em; text-transform: uppercase; color: rgba(212,175,55,0.38); margin-bottom: 14px; }
.mem-title { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic; font-size: clamp(2.4rem, 8vw, 3.8rem); line-height: 0.95; color: white; margin-bottom: 16px; text-shadow: 0 0 60px rgba(212,175,55,0.12); }
.mem-title .gold { color: #D4AF37; }
.mem-subtitle { font-weight: 800; font-size: 7px; letter-spacing: 0.45em; text-transform: uppercase; color: rgba(255,255,255,0.18); }
.mem-tiers { padding: 40px 20px 0; display: flex; flex-direction: column; gap: 12px; max-width: 520px; margin: 0 auto; }
.mem-card { border-radius: 28px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
.mem-card:hover { transform: translateY(-3px); }
.mem-card-prana { background: rgba(212,175,55,0.03); border: 1px solid rgba(212,175,55,0.18); }
.mem-card-prana:hover { box-shadow: 0 0 40px rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.35); }
.mem-card-siddha { background: linear-gradient(140deg, rgba(212,175,55,0.08) 0%, rgba(5,5,5,0.98) 55%); border: 1px solid rgba(212,175,55,0.32); box-shadow: 0 0 30px rgba(212,175,55,0.08); }
.mem-card-siddha:hover { box-shadow: 0 0 50px rgba(212,175,55,0.18); border-color: rgba(212,175,55,0.55); }
.mem-card-akasha { background: linear-gradient(140deg, rgba(139,92,246,0.06) 0%, rgba(212,175,55,0.04) 50%, rgba(5,5,5,0.99) 100%); border: 1px solid rgba(212,175,55,0.22); }
.mem-card-akasha:hover { box-shadow: 0 0 50px rgba(139,92,246,0.12), 0 0 80px rgba(212,175,55,0.06); border-color: rgba(212,175,55,0.45); }
.mem-card-top-line { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 50%; height: 1px; }
.mem-card-prana .mem-card-top-line { background: linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent); }
.mem-card-siddha .mem-card-top-line { background: linear-gradient(to right, transparent, rgba(212,175,55,0.5), transparent); }
.mem-card-akasha .mem-card-top-line { background: linear-gradient(to right, transparent, rgba(139,92,246,0.4), transparent); }
.mem-card-inner { padding: 26px 24px 22px; }
.mem-card-badge { position: absolute; top: 16px; right: 16px; font-weight: 800; font-size: 6.5px; letter-spacing: 0.3em; text-transform: uppercase; padding: 5px 10px; border-radius: 100px; }
.mem-badge-featured { background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.4); color: #D4AF37; }
.mem-badge-ultimate { background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.35); color: rgba(167,139,250,0.9); }
.mem-tier-label { font-weight: 800; font-size: 7px; letter-spacing: 0.45em; text-transform: uppercase; color: rgba(212,175,55,0.4); margin-bottom: 6px; }
.mem-tier-name { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic; font-size: 2rem; color: white; margin-bottom: 4px; line-height: 1; }
.mem-tier-name .gold { color: #D4AF37; }
.mem-tier-tagline { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.85rem; color: rgba(255,255,255,0.28); margin-bottom: 20px; line-height: 1.5; }
.mem-price-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 18px; }
.mem-price { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-style: italic; font-size: 3rem; color: white; line-height: 1; text-shadow: 0 0 30px rgba(212,175,55,0.2); }
.mem-price-period { font-weight: 800; font-size: 7px; letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.25); }
.mem-features { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 20px; }
@media (max-width: 380px) { .mem-features { grid-template-columns: 1fr; } }
.mem-feature { font-size: 10px; color: rgba(255,255,255,0.38); padding: 4px 0; display: flex; align-items: center; gap: 7px; }
.mem-feature::before { content: '◈'; color: #D4AF37; font-size: 6px; flex-shrink: 0; }
.mem-cta { width: 100%; border: none; border-radius: 100px; padding: 15px 24px; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 8.5px; letter-spacing: 0.38em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.mem-cta-prana { background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.25) !important; color: #D4AF37; }
.mem-cta-prana:hover { background: rgba(212,175,55,0.14); }
.mem-cta-siddha { background: #D4AF37; color: #050505; box-shadow: 0 0 28px rgba(212,175,55,0.45); }
.mem-cta-siddha:hover { opacity: 0.88; box-shadow: 0 0 40px rgba(212,175,55,0.6); }
.mem-cta-akasha { background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(212,175,55,0.12)); border: 1px solid rgba(212,175,55,0.3) !important; color: white; }
.mem-cta-akasha:hover { border-color: rgba(212,175,55,0.55) !important; }
.mem-divider { display: flex; align-items: center; gap: 14px; padding: 0 20px; max-width: 520px; margin: 8px auto; }
.mem-divider::before, .mem-divider::after { content: ''; flex: 1; height: 1px; background: linear-gradient(to right, transparent, rgba(212,175,55,0.08), transparent); }
.mem-divider span { font-weight: 800; font-size: 6.5px; letter-spacing: 0.4em; text-transform: uppercase; color: rgba(255,255,255,0.1); white-space: nowrap; }
.mem-note { text-align: center; font-weight: 800; font-size: 6.5px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.08); margin-top: 24px; padding: 0 24px; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const Membership = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh: refreshMembership, loading, isPremium } = useMembership();
  const { isTrialActive } = useFreeTrial();

  useEffect(() => {
    const product = searchParams.get('product');
    if (product === 'akashic' || product === 'digital-nadi') {
      try { sessionStorage.setItem('membership_product_intent', product); } catch { /* ignore */ }
    }
  }, [searchParams]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === 'true') {
      const productIntent = (() => { try { return sessionStorage.getItem('membership_product_intent'); } catch { return null; } })();
      if (productIntent === 'akashic') {
        try { sessionStorage.removeItem('membership_product_intent'); } catch { /* ignore */ }
        refreshMembership();
        toast.success('Your Akashic Record is now unlocked.');
        navigate('/akashic-reading/initiating');
        return;
      } else if (productIntent === 'digital-nadi') {
        try { sessionStorage.removeItem('membership_product_intent'); } catch { /* ignore */ }
        refreshMembership();
        toast.success('Your membership is active. Digital Nāḍī is now unlocked.');
        navigate('/digital-nadi');
        return;
      }
      toast.success('◈ Field Activated — Welcome to the SQI Ecosystem');
      refreshMembership();
      window.history.replaceState({}, '', '/membership');
    } else if (canceled === 'true') {
      toast.info('Checkout was canceled. No charges were made.');
      window.history.replaceState({}, '', '/membership');
    }
  }, [searchParams, refreshMembership, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#D4AF37' }} />
      </div>
    );
  }

  if (isPremium || isTrialActive) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505' }}>
        <MembershipHub onManage={async () => {
          try {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase.functions.invoke('customer-portal');
            if (error) throw error;
            if (data?.url) window.open(data.url, '_blank');
          } catch {
            toast.error('Failed to open subscription management. Please try again.');
          }
        }} />
      </div>
    );
  }

  return (
    <div className="mem-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="mem-hero">
          <div className="mem-eyebrow">◈ Siddha–Quantum Intelligence · 2050</div>
          <h1 className="mem-title">Choose Your<br /><span className="gold">Field</span></h1>
          <div className="mem-subtitle">Three Tiers · One Path · Infinite Depth</div>
        </div>
        <div className="mem-tiers">
          {/* TIER 1 — Prana-Flow */}
          <div className="mem-card mem-card-prana" onClick={() => navigate('/prana-flow')}>
            <div className="mem-card-top-line" />
            <div className="mem-card-inner">
              <div className="mem-tier-label">◈ First Tier · Monthly</div>
              <div className="mem-tier-name">Prana–<span className="gold">Flow</span></div>
              <div className="mem-tier-tagline">Vedic intelligence · Sacred sound library · Full meditation access</div>
              <div className="mem-price-row">
                <span className="mem-price">19€</span>
                <span className="mem-price-period">/ month</span>
              </div>
              <div className="mem-features">
                {['Full Vedic Jyotish Oracle','Guru Chat','Ayurvedic Scan','Vastu Guide',
                  'All Healing Music','Mantra Library','Meditation Library','Cancel anytime'].map(f => (
                  <div key={f} className="mem-feature">{f}</div>
                ))}
              </div>
              <button className="mem-cta mem-cta-prana" type="button">◈ Activate Prana–Flow</button>
            </div>
          </div>

          <div className="mem-divider"><span>◈ or go deeper</span></div>

          {/* TIER 2 — Siddha-Quantum */}
          <div className="mem-card mem-card-siddha" onClick={() => navigate('/siddha-quantum')}>
            <div className="mem-card-top-line" />
            <div className="mem-card-badge mem-badge-featured">◈ Most Popular</div>
            <div className="mem-card-inner">
              <div className="mem-tier-label">◈ Second Tier · Monthly</div>
              <div className="mem-tier-name">Siddha–<span className="gold">Quantum</span></div>
              <div className="mem-tier-tagline">Everything in Prana-Flow + bio-energetic scanning, Nadi analysis & protection tools</div>
              <div className="mem-price-row">
                <span className="mem-price">45€</span>
                <span className="mem-price-period">/ month</span>
              </div>
              <div className="mem-features">
                {['Everything in Prana–Flow','Digital Nadi Scanner','Sri Yantra Shield · EMF','All 6 Vedic Siddhis',
                  'Siddha Portal Access','Bio-field Clearing','Advanced Protection Tools','Priority Support'].map(f => (
                  <div key={f} className="mem-feature">{f}</div>
                ))}
              </div>
              <button className="mem-cta mem-cta-siddha" type="button">◈ Activate Siddha–Quantum</button>
            </div>
          </div>

          <div className="mem-divider"><span>◈ or go infinite</span></div>

          {/* TIER 3 — Akasha-Infinity */}
          <div className="mem-card mem-card-akasha" onClick={() => navigate('/akasha-infinity')}>
            <div className="mem-card-top-line" />
            <div className="mem-card-badge mem-badge-ultimate">◈ Lifetime</div>
            <div className="mem-card-inner">
              <div className="mem-tier-label">◈ Third Tier · One-Time</div>
              <div className="mem-tier-name">Akasha–<span className="gold">Infinity</span></div>
              <div className="mem-tier-tagline">Everything, forever. One sacred investment — unlimited access across all dimensions of the SQI ecosystem</div>
              <div className="mem-price-row">
                <span className="mem-price">€1111</span>
                <span className="mem-price-period">one-time</span>
              </div>
              <div className="mem-features">
                {['Everything in Siddha–Quantum','Akashic Records Access','Hand Analyzer','All Future Features',
                  'VIP Community Badge','Direct Practitioner Access','Lifetime Updates','No Recurring Fees'].map(f => (
                  <div key={f} className="mem-feature">{f}</div>
                ))}
              </div>
              <button className="mem-cta mem-cta-akasha" type="button">◈ Enter Akasha–Infinity</button>
            </div>
          </div>
        </div>
        <p className="mem-note">◈ Affiliate Program · 30% Commission on All Referrals · Cancel Anytime (Monthly Tiers)</p>
      </div>
    </div>
  );
};

export default Membership;
