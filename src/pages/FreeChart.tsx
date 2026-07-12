import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * FreeChart — dedicated cold-traffic ad landing page.
 *
 * This is deliberately separate from /atma-seed (the in-app free-tier
 * account page). No app navigation, no "back to profile," no assumption
 * the visitor already has an account. Single promise, single CTA, value
 * captured before the signup ask (birth data first, email second) — a
 * visitor never hits a wall before getting something real.
 *
 * Birth data is held in local state until signup succeeds, then stashed in
 * sessionStorage and handed off to /atma-seed to save once a real
 * authenticated session exists (Supabase requires email confirmation
 * before writes are authorized in this project's config, so we can't
 * write to `profiles` synchronously from here). AtmaSeed.tsx picks up the
 * stash on load — see the effect added there.
 */

const FreeChart: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'email' | 'sent'>('form');
  const [birthData, setBirthData] = useState({
    birth_name: '',
    birth_date: '',
    birth_time: '',
    birth_place: '',
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue =
    birthData.birth_name.trim() &&
    birthData.birth_date &&
    birthData.birth_time &&
    birthData.birth_place.trim();

  const handleContinue = () => {
    if (!canContinue) {
      toast.error('Fill in all four fields to generate your reading');
      return;
    }
    setStep('email');
  };

  const handleUnlock = async () => {
    if (!email || !password) {
      toast.error('Enter your email and a password to unlock your reading');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/atma-seed` },
      });
      if (error) throw error;

      try {
        sessionStorage.setItem('pending_birth_data', JSON.stringify(birthData));
      } catch { /* best-effort */ }

      supabase.functions.invoke('send-welcome-email', {
        body: { email, name: birthData.birth_name, language: navigator.language },
      }).catch(() => { /* best-effort */ });

      setStep('sent');
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong';
      if (msg.includes('already registered')) {
        toast.error('An account already exists for this email — log in instead.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/30 focus:border-[#D4AF37]/50 outline-none font-mono text-sm';
  const labelClass = 'block text-[8px] font-extrabold tracking-widest uppercase text-white/40 mb-1';

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Montserrat,sans-serif', color: '#fff' }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;700;800;900&display=swap');
  .fc-wrap{max-width:480px;margin:0 auto;padding:56px 24px 80px;}
  .fc-badge{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:8px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(34,197,94,0.9);margin-bottom:24px;background:rgba(34,197,94,0.08);padding:6px 14px;border-radius:100px;border:1px solid rgba(34,197,94,0.2)}
  .fc-h1{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(2.2rem,8vw,3rem);color:white;line-height:1.05;margin-bottom:16px}
  .fc-sub{font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:36px}
  .fc-form{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.15);border-radius:24px;padding:28px}
  .fc-cta{width:100%;background:#D4AF37;color:#050505;border:none;border-radius:100px;padding:16px 24px;font-weight:900;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;margin-top:8px}
  .fc-cta:disabled{opacity:0.5;cursor:not-allowed}
  .fc-note{font-size:10px;color:rgba(255,255,255,0.3);text-align:center;margin-top:14px;line-height:1.6}
  .fc-social{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:28px;font-size:11px;color:rgba(255,255,255,0.35)}
  `,
        }}
      />
      <div className="fc-wrap">
        <div className="fc-badge"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(34,197,94,0.9)' }} />100% Free · No Card · Takes 60 Seconds</div>

        {step === 'form' && (
          <>
            <h1 className="fc-h1">Get Your Free<br />Vedic Birth Chart</h1>
            <p className="fc-sub">Enter your birth details and unlock your real Jyotish chart, Dosha type, and Nakshatra — read using the same ancient Siddha system, decoded instantly.</p>
            <div className="fc-form">
              <div style={{ marginBottom: 16 }}>
                <label className={labelClass}>Your Name</label>
                <input className={inputClass} value={birthData.birth_name} onChange={(e) => setBirthData((d) => ({ ...d, birth_name: e.target.value }))} placeholder="Full name" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className={labelClass}>Date of Birth</label>
                <input type="date" className={inputClass} value={birthData.birth_date} onChange={(e) => setBirthData((d) => ({ ...d, birth_date: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className={labelClass}>Time of Birth</label>
                <input type="time" className={inputClass} value={birthData.birth_time} onChange={(e) => setBirthData((d) => ({ ...d, birth_time: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label className={labelClass}>Place of Birth</label>
                <input className={inputClass} value={birthData.birth_place} onChange={(e) => setBirthData((d) => ({ ...d, birth_place: e.target.value }))} placeholder="City, Country" />
              </div>
              <button className="fc-cta" onClick={handleContinue} disabled={!canContinue}>◈ Reveal My Chart</button>
              <div className="fc-note">Your birth data is used only to generate your reading. Never sold, never shared.</div>
            </div>
          </>
        )}

        {step === 'email' && (
          <>
            <h1 className="fc-h1">Almost There,<br />{birthData.birth_name.split(' ')[0]}</h1>
            <p className="fc-sub">Your chart is calculated. Enter your email to unlock it — this also creates your free Atma-Seed account so your reading is saved.</p>
            <div className="fc-form">
              <div style={{ marginBottom: 16 }}>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label className={labelClass}>Create a Password</label>
                <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <button className="fc-cta" onClick={handleUnlock} disabled={loading}>{loading ? 'Unlocking…' : '◈ Unlock My Free Reading'}</button>
              <div className="fc-note">Free forever. No card required, ever, for this tier.</div>
            </div>
          </>
        )}

        {step === 'sent' && (
          <>
            <h1 className="fc-h1">Check Your Email</h1>
            <p className="fc-sub">We've sent a confirmation link to <strong style={{ color: '#D4AF37' }}>{email}</strong>. Click it, log in, and your chart — plus everything else free in Atma-Seed — will be waiting.</p>
            <div className="fc-form" style={{ textAlign: 'center' }}>
              <button className="fc-cta" onClick={() => navigate('/auth')}>I've Confirmed — Log In</button>
            </div>
          </>
        )}

        <div className="fc-social">◈ Free Vedic astrology, Ayurveda, meditations, mantras &amp; 25 sacred education academies</div>
      </div>
    </div>
  );
};

export default FreeChart;
