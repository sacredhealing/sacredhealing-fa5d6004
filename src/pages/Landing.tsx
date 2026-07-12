import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cinzel:wght@400;500;600&family=Montserrat:wght@300;400;700;800;900&display=swap');

  .sqi-body { background: #050505; font-family: 'Montserrat', sans-serif; overflow-x: hidden; }
  .sqi-gold { color: #D4AF37; }
  .sqi-glass { background: rgba(255,255,255,0.02); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.05); border-radius: 40px; transition: all 0.35s ease; }
  .sqi-glass:hover { border-color: rgba(212,175,55,0.15); transform: translateY(-3px); }
  .sqi-serif { font-family: 'Cormorant Garamond', serif; }
  .sqi-cinzel { font-family: 'Cinzel', serif; }
  .sqi-label { font-size: 12px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: #D4AF37; opacity: 0.85; }
  .sqi-btn-primary { background: linear-gradient(100deg,#D4AF37,#F5E17A); color: #050505; font-family: 'Montserrat',sans-serif; font-weight: 900; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; padding: 18px 40px; border: none; border-radius: 100px; cursor: pointer; box-shadow: 0 0 30px rgba(212,175,55,0.28); transition: all 0.3s ease; }
  .sqi-btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 50px rgba(212,175,55,0.45); }
  .sqi-btn-primary:active { transform: scale(0.97); }
  .sqi-btn-secondary { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.85); font-family: 'Montserrat',sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; padding: 17px 38px; border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
  .sqi-btn-secondary:hover { background: rgba(212,175,55,0.06); transform: translateY(-2px); border-color: rgba(212,175,55,0.2); }
  .sqi-divider { width: 1px; height: 80px; background: linear-gradient(to bottom, transparent, #D4AF37, transparent); margin: 0 auto; opacity: 0.25; }
  .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin-ccw { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes glow-breathe { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
  @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp 1s ease both; }
  @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0)} 50%{box-shadow:0 0 20px 4px rgba(212,175,55,0.15)} }
  @keyframes rotate-yantra { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scalar-ping { 0%{transform:scale(0.3);opacity:0.5} 100%{transform:scale(1);opacity:0} }
  @keyframes marquee-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes ring-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.25)} 50%{box-shadow:0 0 0 8px rgba(212,175,55,0)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .scalar-field { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .scalar-ring { position: absolute; border: 1px solid rgba(212,175,55,0.4); border-radius: 50%; width: 120px; height: 120px; animation: scalar-ping 6s cubic-bezier(.22,.61,.36,1) infinite; }
  .scalar-ring.soft { border-color: rgba(212,175,55,0.18); }

  .stat-strip { position: relative; z-index: 2; max-width: 980px; margin: 0 auto; padding: 0 24px 10px; display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
  .stat-card { padding: 22px 14px; text-align: center; }
  .stat-num { font-size: clamp(1.3rem,2.4vw,1.8rem); font-weight: 900; background: linear-gradient(100deg,#D4AF37,#F5E17A); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: -0.02em; }
  .stat-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); margin-top: 6px; text-transform: uppercase; }

  .founder-line { max-width: 560px; margin: 32px auto 0; padding: 0 24px; text-align: center; position: relative; z-index: 2; }
  .founder-line p { font-size: 13.5px; color: rgba(255,255,255,0.5); line-height: 1.7; }
  .founder-line strong { color: rgba(255,255,255,0.85); font-weight: 700; }

  .free-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; max-width: 1080px; margin: 0 auto; }
  .free-card { padding: 28px 24px; position: relative; }
  .free-tag { position: absolute; top: -11px; left: 22px; background: rgba(212,175,55,0.12); color: #D4AF37; border: 1px solid rgba(212,175,55,0.35); font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 12px; border-radius: 100px; }
  .free-card .fc-icon { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, rgba(212,175,55,0.14), rgba(245,225,122,0.06)); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .free-card:hover .fc-icon { animation: float-y 1.6s ease-in-out infinite; }
  .free-card h3 { font-size: 17px; font-weight: 800; margin-bottom: 8px; color: rgba(255,255,255,0.92); }
  .free-card p { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.6; }

  .marquee-wrap { max-width: 1120px; margin: 40px auto 0; overflow: hidden; -webkit-mask-image: linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent); mask-image: linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent); position: relative; z-index: 2; }
  .marquee-track { display: flex; gap: 14px; width: max-content; animation: marquee-scroll 44s linear infinite; }
  .marquee-item { white-space: nowrap; padding: 11px 20px; border: 1px solid rgba(255,255,255,0.05); border-radius: 100px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.015); }
  .marquee-item .dot { color: #D4AF37; margin-right: 8px; }

  .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; max-width: 1000px; margin: 0 auto; }
  .step-card { padding: 34px 26px; text-align: left; }
  .step-num { width: 40px; height: 40px; border-radius: 50%; background: rgba(212,175,55,0.1); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #D4AF37; font-size: 15px; margin-bottom: 18px; border: 1px solid rgba(212,175,55,0.3); animation: ring-pulse 3s ease-in-out infinite; }
  .step-card:nth-child(2) .step-num { animation-delay: .4s; }
  .step-card:nth-child(3) .step-num { animation-delay: .8s; }
  .step-card h3 { font-size: 18px; font-weight: 800; margin-bottom: 9px; color: rgba(255,255,255,0.92); }
  .step-card p { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.6; }

  .faq-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; max-width: 900px; margin: 0 auto; }
  .faq-item { padding: 24px 26px; }
  .faq-item h3 { font-size: 15.5px; font-weight: 800; margin-bottom: 8px; color: rgba(255,255,255,0.92); }
  .faq-item p { font-size: 14.5px; color: rgba(255,255,255,0.5); line-height: 1.6; }

  .golden-banner { max-width: 520px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 2; }
  .golden-banner-inner { background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(5,5,5,0.98) 60%); border: 1px solid rgba(212,175,55,0.25); border-radius: 24px; padding: 26px 24px; text-align: center; position: relative; overflow: hidden; }
  .golden-banner-inner::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 60%; height: 1px; background: linear-gradient(to right,transparent,rgba(212,175,55,0.3),transparent); }
  .gb-micro { font-size: 8px; font-weight: 800; letter-spacing: 0.5em; text-transform: uppercase; color: rgba(212,175,55,0.5); margin-bottom: 10px; }
  .gb-title { font-family: 'Cinzel', serif; font-size: 1.25rem; color: #fff; margin-bottom: 6px; }
  .gb-sub { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }

  .sticky-cta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: rgba(5,5,5,0.92); backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,0.08); transform: translateY(100%); transition: transform 0.3s ease; display: none; }
  .sticky-cta.visible { transform: translateY(0); }
  .sticky-cta button { width: 100%; }
  @media (max-width: 860px) { .sticky-cta { display: block; } }

  @media (max-width: 860px) {
    .stat-strip { grid-template-columns: repeat(2,1fr); }
    .free-grid { grid-template-columns: 1fr; }
    .steps-grid { grid-template-columns: 1fr; }
    .faq-grid { grid-template-columns: 1fr; }
  }
`;

const ACADEMIES = [
  "Agastyar Academy · 108 Modules",
  "Sovereign Jyotish Vidya · 32 Modules",
  "Siddha Medicine Academy",
  "Kayakalpa Immortality Academy",
  "Kriya Yoga Mastery",
  "Thirumoolar\u2019s Pranayama Codex",
  "Mantra Academy · 24 Modules",
  "Mudra Academy",
  "Supreme Siddha Meditation",
  "Ojas Rasayana Academy",
  "Brahmacharya Siddha Academy",
  "Sacred Geometry Education",
  "Abundance Sadhana",
  "Vastu Shastra Curriculum",
  "Sacred Water Alchemy",
  "Siddha Fasting Academy",
];

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      x=0; y=0; size=0; speedX=0; speedY=0; life=0; maxLife=0; growing=true; color="212,175,55";
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.life = Math.random();
        this.maxLife = Math.random() * 0.005 + 0.001;
        this.growing = true;
        // Gold-family only — no cyan/blue accents on this page.
        const c = ["212,175,55","245,225,122","255,255,255"];
        this.color = c[Math.floor(Math.random()*3)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.growing) { this.life += this.maxLife; if (this.life>=1) this.growing=false; }
        else { this.life -= this.maxLife; if (this.life<=0) this.reset(); }
        if (this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.life*0.5;
        ctx.fillStyle = `rgba(${this.color},1)`;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
    }

    const particles = Array.from({length:160},()=>new Particle());
    const animate = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p=>{p.update();p.draw();});
      animId = requestAnimationFrame(animate);
    };
    animate();

    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add("visible"); });
    },{threshold:0.1});
    reveals.forEach(r=>observer.observe(r));

    const revealFallback = setTimeout(() => {
      document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    }, 2000);

    let stickyObserver: IntersectionObserver | null = null;
    if (heroRef.current && stickyRef.current) {
      stickyObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { stickyRef.current?.classList.toggle("visible", !e.isIntersecting); });
      }, { threshold: 0 });
      stickyObserver.observe(heroRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize",resize);
      observer.disconnect();
      stickyObserver?.disconnect();
      clearTimeout(revealFallback);
    };
  }, []);

  const scrollToFree = () => {
    document.getElementById("whats-free")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="sqi-body" style={{minHeight:"100vh",color:"rgba(255,255,255,0.9)",position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:styles}}/>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:0.5}}/>
      <div className="scalar-field">
        <div className="scalar-ring" style={{animationDelay:"0s"}}/>
        <div className="scalar-ring soft" style={{animationDelay:"1.2s"}}/>
        <div className="scalar-ring" style={{animationDelay:"2.4s"}}/>
        <div className="scalar-ring soft" style={{animationDelay:"3.6s"}}/>
        <div className="scalar-ring" style={{animationDelay:"4.8s"}}/>
      </div>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:999,padding:"18px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(5,5,5,0.75)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontWeight:900,fontSize:13,letterSpacing:"0.15em",textTransform:"uppercase",color:"#D4AF37",textShadow:"0 0 15px rgba(212,175,55,0.3)"}}>Sacred Healing</div>
        <button className="sqi-btn-primary" type="button" style={{padding:"11px 24px",fontSize:12}} onClick={()=>navigate("/auth")}>Start Free</button>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{minHeight:"88vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:"120px 24px 60px",position:"relative",zIndex:2}}>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",opacity:0.1}}>
          <svg style={{width:"min(600px,90vw)",height:"min(600px,90vw)",animation:"rotate-yantra 120s linear infinite"}} viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="220" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5"/>
            <polygon points="250,30 470,420 30,420" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.7"/>
            <polygon points="250,470 30,80 470,80" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.7"/>
            <circle cx="250" cy="250" r="5" fill="#D4AF37" opacity="0.8"/>
          </svg>
        </div>

        <div style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:12,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"#D4AF37",border:"1px solid rgba(212,175,55,0.3)",padding:"9px 20px",borderRadius:100,marginBottom:36,animation:"pulse-border 3s ease-in-out infinite",position:"relative",zIndex:2}}>
          ◈ 10,000 Years of Tamil Siddha &amp; Vedic Wisdom
        </div>

        <h1 className="sqi-cinzel fade-up" style={{fontSize:"clamp(2.2rem,5.4vw,4rem)",fontWeight:600,lineHeight:1.15,letterSpacing:"-0.01em",marginBottom:18,position:"relative",zIndex:2,animationDelay:"0.2s"}}>
          Ancient wisdom,<br/>
          <em style={{fontStyle:"normal",background:"linear-gradient(135deg,#D4AF37 0%,#F5E17A 40%,#D4AF37 60%,#A07C10 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"shimmer 5s linear infinite",display:"inline-block"}}>real value, free to begin.</em>
        </h1>
        <p className="sqi-serif fade-up" style={{fontSize:"clamp(1.05rem,1.9vw,1.3rem)",fontWeight:400,color:"rgba(255,255,255,0.55)",maxWidth:620,margin:"0 auto 36px",lineHeight:1.6,position:"relative",zIndex:2,animationDelay:"0.4s"}}>
          Dozens of Siddha academies, personal Ayurveda, Vedic astrology, and sacred sound — start today with real content, at no cost.
        </p>
        <div className="fade-up" style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginBottom:16,position:"relative",zIndex:2,animationDelay:"0.6s"}}>
          <button className="sqi-btn-primary" type="button" onClick={()=>navigate("/auth")}>Start Free — Takes 30 Seconds</button>
          <button className="sqi-btn-secondary" type="button" onClick={scrollToFree}>See What's Free Inside</button>
        </div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontWeight:500,position:"relative",zIndex:2}}>No credit card needed · Cancel anytime</div>
      </section>

      <div className="stat-strip reveal">
        <div className="sqi-glass stat-card"><div className="stat-num">30+</div><div className="stat-label">Sacred Academies</div></div>
        <div className="sqi-glass stat-card"><div className="stat-num">100+</div><div className="stat-label">Free Lessons to Start</div></div>
        <div className="sqi-glass stat-card"><div className="stat-num">Free</div><div className="stat-label">Dosha &amp; Jyotish Readings</div></div>
        <div className="sqi-glass stat-card"><div className="stat-num">10,000</div><div className="stat-label">Years of Living Tradition</div></div>
      </div>

      <div className="founder-line reveal">
        <p>Guided by <strong>Shiva Siddhananda</strong>, a Siddha Nada Transmission practitioner trained directly in the Tamil Siddha lineage — not a chatbot dressed up as a guru.</p>
      </div>

      {/* WHAT'S FREE */}
      <section id="whats-free" className="reveal" style={{padding:"90px 24px",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",maxWidth:640,margin:"0 auto 48px"}}>
          <div className="sqi-label">◈ What's Free</div>
          <h2 className="sqi-cinzel" style={{fontSize:"clamp(1.8rem,3.6vw,2.6rem)",fontWeight:600,margin:"14px 0 12px"}}>This much is already yours</h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.5)"}}>No trial gimmick — this is real, complete content, free from the moment you sign in.</p>
        </div>

        <div className="free-grid">
          <div className="sqi-glass free-card">
            <div className="free-tag">Free</div>
            <div className="fc-icon">
              <svg viewBox="0 0 44 44" width="24" height="24" fill="none"><path d="M22 8C14 12 12 20 16 28C19 33 22 36 22 36C22 36 25 33 28 28C32 20 30 12 22 8Z" stroke="#D4AF37" strokeWidth="1" style={{animation:"pulse-scale 3.4s ease-in-out infinite",transformOrigin:"22px 22px"}}/><path d="M22 14V32" stroke="#F5E17A" strokeWidth="1"/></svg>
            </div>
            <h3>Your Dosha Blueprint</h3>
            <p>A complete Prakriti scan revealing your Vata-Pitta-Kapha constitution, with a daily ritual timeline built around it.</p>
          </div>
          <div className="sqi-glass free-card">
            <div className="free-tag">Free · Modules 1–6</div>
            <div className="fc-icon">
              <svg viewBox="0 0 44 44" width="24" height="24" fill="none"><ellipse cx="22" cy="22" rx="17" ry="9" stroke="#D4AF37" strokeWidth="1"/><circle cx="22" cy="22" r="6.5" stroke="#F5E17A" strokeWidth="1"/><circle cx="22" cy="22" r="2.5" fill="#D4AF37" style={{animation:"glow-breathe 2.2s ease-in-out infinite"}}/></svg>
            </div>
            <h3>Sovereign Jyotish Vidya</h3>
            <p>Begin the 32-module Vedic astrology path — the 9 Grahas and your birth chart, free through module 6.</p>
          </div>
          <div className="sqi-glass free-card">
            <div className="free-tag">Free · Modules 1–27</div>
            <div className="fc-icon">
              <svg viewBox="0 0 44 44" width="24" height="24" fill="none"><path d="M5 24 Q10 24 12 18 Q14 12 17 24 Q19 32 22 24 Q24 18 27 24 Q29 30 32 24 Q34 20 39 24" stroke="#D4AF37" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <h3>Agastyar Ayurveda Academy</h3>
            <p>The foundation of the full 108-module Ayurveda path from the Agastyar lineage — 27 modules free to complete.</p>
          </div>
          <div className="sqi-glass free-card">
            <div className="free-tag">Open Access</div>
            <div className="fc-icon">
              <svg viewBox="0 0 44 44" width="24" height="24" fill="none"><rect x="10" y="20" width="3.4" height="8" rx="1.5" fill="#F5E17A"/><rect x="16" y="14" width="3.4" height="20" rx="1.5" fill="#D4AF37"/><rect x="22" y="9" width="3.4" height="30" rx="1.5" fill="#F5E17A"/><rect x="28" y="14" width="3.4" height="20" rx="1.5" fill="#D4AF37"/><rect x="34" y="20" width="3.4" height="8" rx="1.5" fill="#F5E17A"/></svg>
            </div>
            <h3>Meditations &amp; Mantra</h3>
            <p>A free Open Access selection of guided meditations, mantra chanting, and healing sound to start — with more unlocking as you grow.</p>
          </div>
          <div className="sqi-glass free-card">
            <div className="free-tag">Free Preview</div>
            <div className="fc-icon">
              <svg viewBox="0 0 44 44" width="24" height="24" fill="none"><path d="M22 6L26 18L38 18L28 25L32 37L22 30L12 37L16 25L6 18L18 18Z" stroke="#D4AF37" strokeWidth="1"/></svg>
            </div>
            <h3>Kriya, Mantra &amp; Mudra</h3>
            <p>Every academy — Kriya Yoga, Mantra Science, Mudra, Pranayama, and more — opens with free lessons to explore.</p>
          </div>
          <div className="sqi-glass free-card">
            <div className="free-tag">Free</div>
            <div className="fc-icon">
              <svg viewBox="0 0 44 44" width="24" height="24" fill="none"><circle cx="22" cy="22" r="14" stroke="#D4AF37" strokeWidth="1"/><circle cx="22" cy="22" r="4" fill="#F5E17A" style={{animation:"glow-breathe 2.4s ease-in-out infinite"}}/></svg>
            </div>
            <h3>The Full Siddha Portal</h3>
            <p>Browse every academy freely — Sacred Texts, Vastu, Sound Alchemy, and more — and see exactly what's inside before you begin.</p>
          </div>
        </div>

        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...ACADEMIES, ...ACADEMIES].map((name, i) => (
              <div key={i} className="marquee-item"><span className="dot">◈</span>{name}</div>
            ))}
          </div>
        </div>
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* STEPS */}
      <section className="reveal" style={{padding:"90px 24px",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",maxWidth:640,margin:"0 auto 48px"}}>
          <div className="sqi-label">◈ Getting Started</div>
          <h2 className="sqi-cinzel" style={{fontSize:"clamp(1.8rem,3.6vw,2.6rem)",fontWeight:600,margin:"14px 0 12px"}}>Three simple steps</h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.5)"}}>No jargon, no learning curve — built to be easy for everyone, including your parents.</p>
        </div>
        <div className="steps-grid">
          <div className="sqi-glass step-card">
            <div className="step-num">1</div>
            <h3>Sign in your way</h3>
            <p>Use Google in one tap, sign in with email, or scan a QR code with your phone if that's easier.</p>
          </div>
          <div className="sqi-glass step-card">
            <div className="step-num">2</div>
            <h3>Get your free reading</h3>
            <p>A couple of quick questions — birth details for your Jyotish chart, and your Ayurveda constitution.</p>
          </div>
          <div className="sqi-glass step-card">
            <div className="step-num">3</div>
            <h3>Explore, free</h3>
            <p>Start a free academy module, play an Open Access meditation, or browse the full Siddha Portal — no card needed.</p>
          </div>
        </div>
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* SIGN IN TEASER */}
      <section className="reveal" style={{padding:"90px 24px",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",maxWidth:640,margin:"0 auto 40px"}}>
          <div className="sqi-label">◈ Easy Sign In</div>
          <h2 className="sqi-cinzel" style={{fontSize:"clamp(1.8rem,3.6vw,2.6rem)",fontWeight:600,margin:"14px 0 12px"}}>Made for everyone</h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.5)"}}>One tap with Google, your email, or scan a QR code with your phone — whichever feels easiest.</p>
        </div>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
          <button className="sqi-btn-primary" type="button" onClick={()=>navigate("/auth")}>Sign In / Start Free</button>
          <button className="sqi-btn-secondary" type="button" onClick={()=>navigate("/qr-signin")}>◈ Sign In With QR Code</button>
        </div>
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* FAQ */}
      <section className="reveal" style={{padding:"90px 24px",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",maxWidth:640,margin:"0 auto 48px"}}>
          <div className="sqi-label">◈ Before You Begin</div>
          <h2 className="sqi-cinzel" style={{fontSize:"clamp(1.8rem,3.6vw,2.6rem)",fontWeight:600,margin:"14px 0 12px"}}>Common questions</h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.5)"}}>Straight answers — no fine print.</p>
        </div>
        <div className="faq-grid">
          <div className="sqi-glass faq-item">
            <h3>Is this hard to use?</h3>
            <p>No. Sign in with one tap, and everything is written in plain language — no technical steps, no confusing menus.</p>
          </div>
          <div className="sqi-glass faq-item">
            <h3>Do I need a credit card to start?</h3>
            <p>No. Every free feature — your Dosha reading, free academy modules, Open Access meditations — is available the moment you sign in.</p>
          </div>
          <div className="sqi-glass faq-item">
            <h3>Will I be charged automatically?</h3>
            <p>Never without your say-so. You choose if and when to go deeper — nothing is billed unless you decide to.</p>
          </div>
          <div className="sqi-glass faq-item">
            <h3>Is my information private?</h3>
            <p>Yes. Your details are only used to personalize your readings and guidance — never sold or shared.</p>
          </div>
        </div>
      </section>

      <div className="golden-banner reveal">
        <div className="golden-banner-inner">
          <div className="gb-micro">◈ As You Grow</div>
          <div className="gb-title sqi-cinzel">Deeper transmissions await inside</div>
          <div className="gb-sub">Live guidance, full academies, and healing sound unlock naturally as you explore — no pressure, at your own pace.</div>
        </div>
      </div>

      {/* FINAL CTA */}
      <section className="reveal" style={{padding:"100px 24px",textAlign:"center",maxWidth:640,margin:"0 auto",position:"relative",zIndex:2}}>
        <div className="sqi-label" style={{marginBottom:16}}>◈ Real Value, Free To Start</div>
        <h2 className="sqi-cinzel" style={{fontSize:"clamp(2rem,4.5vw,2.9rem)",fontWeight:600,lineHeight:1.15,marginBottom:14}}>Ready to begin?</h2>
        <p style={{fontSize:16,lineHeight:1.7,color:"rgba(255,255,255,0.5)",marginBottom:32}}>
          Join thousands finding calm, clarity, and guidance rooted in living, ancient tradition — made simple.
        </p>
        <button className="sqi-btn-primary" type="button" style={{fontSize:14,padding:"20px 48px"}} onClick={()=>navigate("/auth")}>Start Free Today</button>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"40px 24px",textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.06)",position:"relative",zIndex:2}}>
        <div style={{fontSize:13,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:"#D4AF37",opacity:0.8}}>Sacred Healing · Siddha Quantum Intelligence</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:6}}>Tamil Siddha Tradition · Vedic Astrology · Ayurveda</div>
      </footer>

      <div className="sticky-cta" ref={stickyRef}>
        <button className="sqi-btn-primary" type="button" onClick={()=>navigate("/auth")}>Start Free</button>
      </div>
    </div>
  );
}
