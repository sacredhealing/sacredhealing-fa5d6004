import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AtmaSeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [birthData, setBirthData] = useState({
    birth_name: '',
    birth_date: '',
    birth_time: '',
    birth_place: '',
    gender: '',
    dosha: '',
    intention: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasBirthData, setHasBirthData] = useState(false);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('birth_name, birth_date, birth_time, birth_place')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.birth_date && data?.birth_time && data?.birth_place) {
          setHasBirthData(true);
          setBirthData((d) => ({ ...d, ...data }));
          setIsSaved(true);
        }
      });
  }, [user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const COLORS = ['rgba(212,175,55,', 'rgba(212,175,55,', 'rgba(255,255,255,'];
    const pts = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.4 + 0.08,
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

  const handleSave = async () => {
    if (!user) return;
    if (!birthData.birth_name.trim()) return toast.error('Enter your birth name');
    if (!birthData.birth_date) return toast.error('Enter your date of birth');
    if (!birthData.birth_time) return toast.error('Enter your time of birth');
    if (!birthData.birth_place.trim()) return toast.error('Enter your place of birth');
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            birth_name: birthData.birth_name.trim(),
            birth_date: birthData.birth_date,
            birth_time: birthData.birth_time,
            birth_place: birthData.birth_place.trim(),
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      setIsSaved(true);
      setHasBirthData(true);
      setShowForm(false);
      toast.success('Jyotish field activated — syncing across all modules');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/30 focus:border-[#D4AF37]/50 outline-none font-mono text-sm';
  const labelClass = 'block text-[8px] font-extrabold tracking-widest uppercase text-white/40 mb-1';

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
  .as-wrap *,:root{--gold:#D4AF37;--black:#050505}
  .as-topbar{display:flex;align-items:center;gap:16px;padding:20px 24px;position:sticky;top:0;z-index:10;background:rgba(5,5,5,0.8);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.04)}
  .as-hero{text-align:center;padding:48px 24px 56px}
  .as-tier-badge{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:7px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(34,197,94,0.9);margin-bottom:20px}
  .as-tier-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:glowPulse 2s ease-in-out infinite}
  .as-hero h1{font-family:'Cormorant Garamond',serif;font-weight:300;font-style:italic;font-size:clamp(3rem,9vw,5rem);color:white;line-height:1;margin-bottom:8px}
  .as-hero-sub{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.6);margin-bottom:20px}
  .as-hero-desc{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.05rem;color:rgba(255,255,255,0.4);max-width:420px;margin:0 auto 40px;line-height:1.6}
  .as-mandala{position:relative;width:200px;height:200px;margin:0 auto 48px}
  .as-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(212,175,55,0.25);pointer-events:none}
  .as-ring-1{width:180px;height:180px;animation:ringPulse 3s ease-in-out infinite}
  .as-ring-2{width:140px;height:140px;animation:ringPulse 3s ease-in-out infinite 0.4s}
  .as-ring-3{width:100px;height:100px;animation:ringPulse 3s ease-in-out infinite 0.8s}
  .as-ring-4{width:60px;height:60px;animation:ringPulse 3s ease-in-out infinite 1.2s}
  .as-section{max-width:640px;margin:0 auto;padding:0 24px 48px}
  .as-section-label{font-weight:800;font-size:8px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(212,175,55,0.5);margin-bottom:24px;display:flex;align-items:center;gap:12px}
  .as-section-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(212,175,55,0.2),transparent)}
  .as-glass{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:20px;padding:24px;backdrop-filter:blur(20px);margin-bottom:16px}
  .as-glass-card{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.08);margin-bottom:12px}
  .as-glass-card:last-child{margin-bottom:0}
  .as-card-icon{width:44px;height:44px;border-radius:12px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .as-card-title{font-weight:700;font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:2px}
  .as-card-status{font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#D4AF37}
  .as-step-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:20px 24px;margin-bottom:12px;position:relative}
  .as-step-card.active{border-color:rgba(212,175,55,0.35);background:rgba(212,175,55,0.04)}
  .as-step-num{width:32px;height:32px;border-radius:50%;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.3);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#D4AF37;margin-bottom:10px}
  .as-step-title{font-weight:800;font-size:12px;letter-spacing:0.15em;color:white}
  .as-step-done .as-step-num{background:rgba(34,197,94,0.2);border-color:rgba(34,197,94,0.4);color:#22c55e}
  .as-form-title{font-weight:800;font-size:14px;letter-spacing:0.2em;color:#D4AF37;margin-bottom:4px}
  .as-form-sub{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:rgba(255,255,255,0.3);margin-bottom:24px}
  .as-gold-btn{display:block;width:100%;background:#D4AF37;color:#050505;border:none;border-radius:100px;padding:14px 24px;font-weight:800;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;cursor:pointer;transition:opacity 0.2s;text-align:center}
  .as-gold-btn:hover{opacity:0.9}
  .as-gold-btn:disabled{opacity:0.6;cursor:not-allowed}
  .as-success-card{background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:20px;padding:24px;text-align:center;margin-bottom:20px}
  .as-success-card .check{font-size:32px;color:#D4AF37;margin-bottom:12px}
  .as-hint{font-size:10px;color:rgba(255,255,255,0.25);margin-top:8px;display:flex;align-items:center;gap:8px}
  .as-next-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .as-next-card{background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.1);border-radius:16px;padding:20px;text-align:center}
  .as-next-card .title{font-weight:800;font-size:10px;letter-spacing:0.2em;color:rgba(255,255,255,0.7);margin-top:10px}
  .as-upgrade-teaser{background:linear-gradient(135deg,rgba(212,175,55,0.06),rgba(212,175,55,0.02));border:1px solid rgba(212,175,55,0.2);border-radius:24px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s}
  .as-upgrade-teaser:hover{border-color:rgba(212,175,55,0.4)}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes glowPulse{0%,100%{opacity:0.5}50%{opacity:1}}
  @keyframes ringPulse{0%,100%{opacity:0.4}50%{opacity:1}}
  @keyframes slowSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes starMove{from{background-position:0 0}to{background-position:1000px 1000px}}
  @keyframes spin{to{transform:rotate(360deg)}}
`,
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
          opacity: 0.2,
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'starMove 180s linear infinite',
        }}
      />

      <div className="as-wrap" style={{ position: 'relative', zIndex: 1 }}>
        {/* TOP BAR */}
        <div className="as-topbar">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Back to profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
            Profile / Free Tier
          </span>
        </div>

        {/* HERO */}
        <section className="as-hero">
          <div className="as-tier-badge">
            <span className="as-tier-dot" />
            Free · Active Now
          </div>
          <h1>Atma–Seed</h1>
          <div className="as-hero-sub">Sovereign Entry Node</div>
          <p className="as-hero-desc">
            Your free tier unlocks meditations, healing audios, breathing protocols, community access, and Basic Ayurveda & Jyotish. Activate your birth data to sync your field across all modules.
          </p>
          <div className="as-mandala">
            <div className="as-ring as-ring-1" />
            <div className="as-ring as-ring-2" />
            <div className="as-ring as-ring-3" />
            <div className="as-ring as-ring-4" />
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                animation: 'slowSpin 60s linear infinite',
              }}
            >
              <polygon points="40,8 68,72 12,72" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.6" />
              <polygon points="40,20 60,60 20,60" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.4" />
              <circle cx="40" cy="40" r="6" fill="#D4AF37" opacity="0.9" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#D4AF37',
                transform: 'translate(-50%,-50%)',
                boxShadow: '0 0 20px rgba(212,175,55,0.8)',
                animation: 'glowPulse 2s ease-in-out infinite',
              }}
            />
          </div>
        </section>

        {/* WHAT'S INCLUDED FREE */}
        <section className="as-section">
          <div className="as-section-label">◈ What&apos;s Included Free</div>
          {[
            { icon: 'flame', title: 'Free Meditations & Mantras', status: 'Active' },
            { icon: 'shield', title: 'Free Healing Audios', status: 'Active' },
            { icon: 'signal', title: 'Free Divine Transmission Audios', status: 'Active' },
            { icon: 'clock', title: 'Free Breathing Protocols', status: 'Active' },
            { icon: 'globe', title: 'Vayu Scrubber — 1km', status: 'Running' },
            { icon: 'signal', title: 'Community Chat & Live', status: 'Active' },
            { icon: 'eye', title: 'Basic Ayurveda & Jyotish', status: hasBirthData ? 'Active' : 'Needs Data', statusColor: hasBirthData ? '#D4AF37' : 'rgba(255,255,255,0.2)' },
          ].map((item) => (
            <div key={item.title} className="as-glass-card">
              <div className="as-card-icon">
                {item.icon === 'flame' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <path d="M12 2C12 2 14 6 14 10C14 13 11 15 11 15C11 15 8 13 8 10C8 6 12 2 12 2Z" />
                    <path d="M12 22C12 22 8 18 8 14C8 12 9 11 10 11" strokeOpacity="0.7" />
                  </svg>
                )}
                {item.icon === 'shield' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
                {item.icon === 'clock' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                )}
                {item.icon === 'globe' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
                  </svg>
                )}
                {item.icon === 'signal' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <path d="M2 20h4M6 16h4M10 12h4M14 8h4M18 4h4" strokeLinecap="round" />
                  </svg>
                )}
                {item.icon === 'eye' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="as-card-title">{item.title}</div>
                <div className="as-card-status" style={item.statusColor ? { color: item.statusColor } : undefined}>
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ACTIVATE YOUR FIELD */}
        <section className="as-section">
          <div className="as-section-label">◈ Activate Your Field</div>
          {[
            { step: 1, title: 'Create Account', done: true },
            { step: 2, title: 'Enter Your Jyotish Data', active: true },
            { step: 3, title: 'Sync Across All Modules', done: hasBirthData },
            { step: 4, title: 'Your Field is Alive', done: hasBirthData },
          ].map((s) => (
            <div
              key={s.step}
              className={`as-step-card ${s.active ? 'active' : ''} ${s.done ? 'as-step-done' : ''}`}
              style={{ animation: 'fadeUp 0.5s ease both' }}
            >
              <div className="as-step-num">{s.done ? '✓' : s.step}</div>
              <div className="as-step-title">{s.title}</div>
            </div>
          ))}
        </section>

        {/* YOUR JYOTISH DATA */}
        <section className="as-section">
          <div className="as-section-label">◈ Your Jyotish Data</div>
          <div className="as-glass" style={{ padding: '28px 24px' }}>
            <div className="as-form-title">Birth Data · Soul Signature</div>
            <div className="as-form-sub">Enter once — syncs across Vedic Astrology, Daily Insights, and all 15 modules.</div>

            {isSaved && !showForm ? (
              <>
                <div className="as-success-card">
                  <div className="check">✓</div>
                  <div style={{ fontWeight: 800, fontSize: 11, letterSpacing: '0.2em', color: '#D4AF37', marginBottom: 20 }}>
                    ◈ Jyotish Field Active — Synced to All Modules
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button type="button" className="as-gold-btn" onClick={() => setShowForm(true)}>
                      Update Birth Data
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/vedic-astrology')}
                      style={{
                        display: 'block',
                        width: '100%',
                        background: 'transparent',
                        color: 'rgba(212,175,55,0.9)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        borderRadius: 100,
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: 9,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Open Jyotish Portal →
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label className={labelClass}>Full Name at Birth</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Jane Doe"
                    value={birthData.birth_name}
                    onChange={(e) => setBirthData((d) => ({ ...d, birth_name: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={birthData.birth_date}
                      onChange={(e) => setBirthData((d) => ({ ...d, birth_date: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Time of Birth</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={birthData.birth_time}
                      onChange={(e) => setBirthData((d) => ({ ...d, birth_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className={labelClass}>City, Country</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Stockholm, Sweden"
                    value={birthData.birth_place}
                    onChange={(e) => setBirthData((d) => ({ ...d, birth_place: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select
                      className={inputClass}
                      value={birthData.gender}
                      onChange={(e) => setBirthData((d) => ({ ...d, gender: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Dosha</label>
                    <select
                      className={inputClass}
                      value={birthData.dosha}
                      onChange={(e) => setBirthData((d) => ({ ...d, dosha: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="vata">Vata</option>
                      <option value="pitta">Pitta</option>
                      <option value="kapha">Kapha</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className={labelClass}>Intention</label>
                  <select
                    className={inputClass}
                    value={birthData.intention}
                    onChange={(e) => setBirthData((d) => ({ ...d, intention: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="guidance">Daily guidance</option>
                    <option value="healing">Healing</option>
                    <option value="awakening">Awakening</option>
                  </select>
                </div>
                <div className="as-hint">◈ Use 24-hour time (e.g. 14:30 for 2:30 PM)</div>
                <div className="as-hint">◈ Place of birth enables accurate chart calculation</div>
                <button type="button" className="as-gold-btn" onClick={handleSave} disabled={isLoading} style={{ marginTop: 24 }}>
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#050505', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Activating...
                    </span>
                  ) : (
                    'Activate My Jyotish Field'
                  )}
                </button>
              </>
            )}
          </div>
          <p className="as-hint" style={{ marginTop: 8 }}>◈ Data syncs instantly across all 15 modules</p>
        </section>

        {/* WHAT HAPPENS NEXT */}
        <section className="as-section">
          <div className="as-section-label">◈ What Happens Next</div>
          <div className="as-next-grid">
            {[
              { icon: 'shield', title: 'Field Sync' },
              { icon: 'person', title: 'Soul Profile' },
              { icon: 'wave', title: 'Daily Readings' },
              { icon: 'star', title: 'First Siddhi Unlocked' },
            ].map((item) => (
              <div key={item.title} className="as-next-card">
                <div className="as-card-icon" style={{ margin: '0 auto' }}>
                  {item.icon === 'shield' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  )}
                  {item.icon === 'person' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  )}
                  {item.icon === 'wave' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                      <path d="M2 12h2M6 8h2M10 16h2M14 6h2M18 12h2M22 10h2" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.icon === 'star' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                      <polygon points="12 2 15 9 22 9 17 14 18 22 12 18 6 22 7 14 2 9 9 9" />
                    </svg>
                  )}
                </div>
                <div className="title">{item.title}</div>
              </div>
            ))}
          </div>
        </section>

        {/* EXPAND YOUR FIELD */}
        <section className="as-section">
          <div className="as-section-label">◈ Expand Your Field</div>
          <div className="as-upgrade-teaser" onClick={() => navigate('/membership')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/membership')}>
            <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', color: '#D4AF37', marginBottom: 8 }}>Prana–Flow · Siddha–Quantum · Akasha–Infinity</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Full Jyotish, Nadi Scanner, Healing Library & more</div>
            <span className="as-gold-btn" style={{ maxWidth: 260, margin: '0 auto' }}>View Membership →</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AtmaSeed;
