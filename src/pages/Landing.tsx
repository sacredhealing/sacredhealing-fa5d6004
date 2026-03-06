import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;700;800;900&display=swap');

  .sqi-body { background: #050505; font-family: 'Montserrat', sans-serif; overflow-x: hidden; }
  .sqi-gold { color: #D4AF37; }
  .sqi-glass { background: rgba(255,255,255,0.02); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.06); border-radius: 32px; }
  .sqi-glass:hover { border-color: rgba(212,175,55,0.2); }
  .sqi-serif { font-family: 'Cormorant Garamond', serif; }
  .sqi-label { font-size: 8px; font-weight: 800; letter-spacing: 0.5em; text-transform: uppercase; color: #D4AF37; opacity: 0.7; }
  .sqi-btn-primary { background: #D4AF37; color: #050505; font-family: 'Montserrat',sans-serif; font-weight: 800; font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; padding: 18px 40px; border: none; border-radius: 100px; cursor: pointer; box-shadow: 0 0 30px rgba(212,175,55,0.3); transition: all 0.3s ease; }
  .sqi-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(212,175,55,0.5); }
  .sqi-btn-secondary { background: rgba(255,255,255,0.02); color: #D4AF37; font-family: 'Montserrat',sans-serif; font-weight: 700; font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; padding: 17px 40px; border: 1px solid rgba(212,175,55,0.3); border-radius: 100px; cursor: pointer; transition: all 0.3s ease; }
  .sqi-btn-secondary:hover { background: rgba(212,175,55,0.08); transform: translateY(-2px); }
  .sqi-module:hover { transform: translateY(-6px) scale(1.02); border-color: rgba(212,175,55,0.25); box-shadow: 0 20px 60px rgba(212,175,55,0.08); }
  .sqi-module { transition: all 0.4s cubic-bezier(0.23,1,0.32,1); }
  .sqi-divider { width: 1px; height: 80px; background: linear-gradient(to bottom, transparent, #D4AF37, transparent); margin: 0 auto; opacity: 0.3; }
  .sqi-scanline { position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px); pointer-events: none; z-index: 1000; }
  .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  @keyframes spin-cw { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin-ccw { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes glow-breathe { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
  @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes orbit { from{transform:rotate(0deg) translateX(14px) rotate(0deg)} to{transform:rotate(360deg) translateX(14px) rotate(-360deg)} }
  @keyframes nadi-flow { 0%{stroke-dashoffset:100} 100%{stroke-dashoffset:0} }
  @keyframes wave-draw { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0)} 50%{box-shadow:0 0 20px 4px rgba(212,175,55,0.15)} }
  @keyframes rotate-yantra { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const modules = [
  {
    cat: "◈ Core Quantum Technology",
    items: [
      { name: "Vayu Protocol", desc: "1km field restoration · Golden Torus geometry", route: "/vayu-protocol",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><circle cx="22" cy="22" r="19" stroke="#D4AF37" strokeWidth="0.7" opacity="0.3"/><ellipse cx="22" cy="22" rx="18" ry="8" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5" style={{animation:"spin-cw 12s linear infinite",transformOrigin:"22px 22px"}}/><ellipse cx="22" cy="22" rx="8" ry="18" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5" style={{animation:"spin-ccw 12s linear infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="22" r="7" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" style={{animation:"spin-cw 20s linear infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="22" r="2.5" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/><circle cx="22" cy="22" r="2" fill="#22D3EE" opacity="0.9" style={{animation:"orbit 4s linear infinite",transformOrigin:"22px 22px"}}/></svg> },
      { name: "Digital Nadi", desc: "Camera pulse scan · 72,000 channel mapping", route: "/digital-nadi",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M22 6 C22 6 16 10 16 18 C16 26 20 30 22 38 C24 30 28 26 28 18 C28 10 22 6 22 6Z" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.5"/><path d="M22 8 Q18 14 20 20 Q22 26 20 32" stroke="#22D3EE" strokeWidth="1" fill="none" strokeDasharray="4 2" style={{animation:"nadi-flow 2s linear infinite",strokeDashoffset:100}}/><path d="M22 8 Q26 14 24 20 Q22 26 24 32" stroke="#D4AF37" strokeWidth="1" fill="none" strokeDasharray="4 2" style={{animation:"nadi-flow 2s linear infinite reverse",strokeDashoffset:100}}/><circle cx="22" cy="10" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 1.2s ease-in-out infinite"}}/><circle cx="22" cy="18" r="1.5" fill="#22D3EE" style={{animation:"glow-breathe 1.5s ease-in-out infinite"}}/><circle cx="22" cy="26" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 1.8s ease-in-out infinite"}}/><circle cx="22" cy="34" r="1.5" fill="#22D3EE" style={{animation:"glow-breathe 2.1s ease-in-out infinite"}}/></svg> },
      { name: "Sri Yantra Shield", desc: "v2.6 Global quantum protection", route: "/sri-yantra-shield",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44,animation:"spin-cw 60s linear infinite"}}><circle cx="22" cy="22" r="20" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3"/><polygon points="22,4 40,36 4,36" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.9"/><polygon points="22,40 4,8 40,8" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.9"/><polygon points="22,10 36,32 8,32" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.5"/><polygon points="22,34 8,12 36,12" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.5"/><circle cx="22" cy="22" r="2" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/></svg> },
      { name: "Akashic Decoder", desc: "15-page soul manuscript transmission", route: "/akashic-records", badge: "SECRET",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><ellipse cx="22" cy="22" rx="18" ry="11" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" style={{animation:"pulse-scale 3s ease-in-out infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="22" r="6" stroke="#D4AF37" strokeWidth="0.8" opacity="0.8"/><circle cx="22" cy="22" r="3" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/><line x1="22" y1="4" x2="22" y2="8" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/><line x1="22" y1="36" x2="22" y2="40" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/><line x1="4" y1="22" x2="8" y2="22" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/><line x1="36" y1="22" x2="40" y2="22" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/></svg> },
      { name: "Vedic Astrology", desc: "Live Jyotish + Akashic Records fusion", route: "/vedic-astrology", badge: "PREMIUM",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><line x1="22" y1="8" x2="22" y2="38" stroke="#D4AF37" strokeWidth="1.2" opacity="0.9"/><path d="M14 14 C14 10 22 8 22 8 C22 8 30 10 30 14 C30 18 22 20 22 20 C22 20 14 18 14 14Z" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.8"/><line x1="17" y1="12" x2="17" y2="20" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6"/><line x1="27" y1="12" x2="27" y2="20" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6"/><circle cx="10" cy="10" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 1.5s ease-in-out infinite"}}/><circle cx="34" cy="8" r="1" fill="#22D3EE" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/><circle cx="36" cy="25" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 1.3s ease-in-out infinite"}}/><ellipse cx="22" cy="22" rx="18" ry="6" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" strokeDasharray="3 2" style={{animation:"spin-cw 15s linear infinite",transformOrigin:"22px 22px"}}/></svg> },
    ]
  },
  {
    cat: "◈ Sound · Frequency · Transmission",
    items: [
      { name: "Healing Music", desc: "Sacred frequencies for body and soul", route: "/music", badge: "NEW",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M4 22 Q8 14 12 22 Q16 30 20 22 Q24 14 28 22 Q32 30 36 22 Q38 18 40 22" stroke="#D4AF37" strokeWidth="1.2" fill="none" strokeLinecap="round" style={{animation:"wave-draw 2s ease-in-out infinite",strokeDasharray:80,strokeDashoffset:80}}/><circle cx="18" cy="30" r="3.5" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.15)"/><line x1="21.5" y1="30" x2="21.5" y2="18" stroke="#D4AF37" strokeWidth="0.9"/><line x1="21.5" y1="18" x2="28" y2="20" stroke="#D4AF37" strokeWidth="0.9"/><circle cx="18" cy="30" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 1.5s ease-in-out infinite"}}/></svg> },
      { name: "Mantra Library", desc: "Frequency-matched sacred sound sequences", route: "/mantras",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M10 28 C10 20 14 14 20 14 C26 14 28 18 26 22 C24 26 18 26 18 22 C18 18 22 16 24 18" stroke="#D4AF37" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.9"/><path d="M26 22 C30 22 34 24 34 28 C34 32 30 36 24 36 C20 36 16 34 16 30" stroke="#D4AF37" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.9"/><path d="M16 30 C14 32 13 35 15 37" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" opacity="0.7"/><path d="M30 8 Q34 11 30 14" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.5" style={{animation:"glow-breathe 1.5s ease-in-out infinite"}}/><path d="M33 6 Q39 11 33 16" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.3" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/></svg> },
      { name: "Meditations", desc: "Guided Siddha-Quantum deep-field sessions", route: "/meditations", badge: "NEW",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><circle cx="22" cy="10" r="4" stroke="#D4AF37" strokeWidth="0.9" fill="none" style={{animation:"glow-breathe 3s ease-in-out infinite"}}/><path d="M14 26 C14 22 17 20 22 20 C27 20 30 22 30 26" stroke="#D4AF37" strokeWidth="0.9" fill="none"/><path d="M8 30 C10 26 14 26 18 28 C20 29 22 30 22 30 C22 30 24 29 26 28 C30 26 34 26 36 30" stroke="#D4AF37" strokeWidth="0.9" fill="none" opacity="0.8"/><circle cx="22" cy="10" r="7" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" style={{animation:"pulse-scale 2.5s ease-in-out infinite",transformOrigin:"22px 10px"}}/><circle cx="22" cy="10" r="11" stroke="#D4AF37" strokeWidth="0.3" opacity="0.15" style={{animation:"pulse-scale 3s ease-in-out infinite",transformOrigin:"22px 10px"}}/><line x1="22" y1="3" x2="22" y2="1" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6"/></svg> },
      { name: "Healing Transmissions", desc: "Scalar Prema-Pulse · Anahata activation", route: "/healing", badge: "NEW",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M22 32 C18 28 10 24 10 18 C10 14 13 11 17 11 C19.5 11 21.5 12.5 22 14 C22.5 12.5 24.5 11 27 11 C31 11 34 14 34 18 C34 24 26 28 22 32Z" stroke="#D4AF37" strokeWidth="0.9" fill="rgba(212,175,55,0.08)" style={{animation:"pulse-scale 1.8s ease-in-out infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="20" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 1.8s ease-in-out infinite"}}/></svg> },
      { name: "Breathing Techniques", desc: "Pranayama · Nadi Shodhana · Bhastrika", route: "/breathing", badge: "NEW",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><circle cx="22" cy="22" r="18" stroke="#22D3EE" strokeWidth="0.5" opacity="0.2" style={{animation:"pulse-scale 4s ease-in-out infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="22" r="13" stroke="#22D3EE" strokeWidth="0.6" opacity="0.35" style={{animation:"pulse-scale 4s ease-in-out infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="22" r="8" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" style={{animation:"pulse-scale 4s ease-in-out infinite",transformOrigin:"22px 22px"}}/><circle cx="22" cy="22" r="3" fill="#D4AF37" style={{animation:"glow-breathe 4s ease-in-out infinite"}}/><path d="M22 4 L22 8 M20 6 L22 4 L24 6" stroke="#22D3EE" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" style={{animation:"float-y 4s ease-in-out infinite"}}/></svg> },
    ]
  },
  {
    cat: "◈ Sacred Knowledge & Field Technology",
    items: [
      { name: "Ayurveda Engine", desc: "Daily bio-constitution calibration", route: "/ayurveda",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M22 38 C22 38 8 28 8 18 C8 10 14 6 22 6 C30 6 36 10 36 18 C36 28 22 38 22 38Z" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.06)" opacity="0.8"/><line x1="22" y1="38" x2="22" y2="8" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/><path d="M22 16 Q16 18 12 16" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.4"/><path d="M22 22 Q16 24 12 22" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.4"/><path d="M22 16 Q28 18 32 16" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.4"/><path d="M22 22 Q28 24 32 22" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.4"/><circle cx="22" cy="38" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/></svg> },
      { name: "Virtual Pilgrimage", desc: "24/7 Sacred Site scalar anchoring", route: "/explore",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><polygon points="22,4 38,22 32,22 32,38 12,38 12,22 6,22" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.06)" opacity="0.9"/><line x1="14" y1="30" x2="30" y2="30" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4"/><line x1="16" y1="26" x2="28" y2="26" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4"/><rect x="19" y="32" width="6" height="6" rx="3" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.5"/><circle cx="22" cy="4" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/></svg> },
      { name: "Quantum Apothecary", desc: "2050 Siddha bio-resonance compounds", route: "/quantum-apothecary",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M16 8 L16 20 L8 36 L36 36 L28 20 L28 8Z" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.05)" opacity="0.8"/><line x1="14" y1="8" x2="30" y2="8" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6"/><circle cx="16" cy="30" r="2" stroke="#22D3EE" strokeWidth="0.6" fill="rgba(34,211,238,0.1)" style={{animation:"float-y 2s ease-in-out infinite"}}/><circle cx="24" cy="26" r="1.5" stroke="#D4AF37" strokeWidth="0.6" fill="rgba(212,175,55,0.15)" style={{animation:"float-y 2.5s ease-in-out infinite"}}/></svg> },
      { name: "Bhagavad Gita", desc: "Daily verse aligned to planetary transit", route: "/explore",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><path d="M22 10 C22 10 10 8 6 10 L6 36 C10 34 22 36 22 36Z" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.05)" opacity="0.8"/><path d="M22 10 C22 10 34 8 38 10 L38 36 C34 34 22 36 22 36Z" stroke="#D4AF37" strokeWidth="0.8" fill="rgba(212,175,55,0.05)" opacity="0.8"/><line x1="22" y1="10" x2="22" y2="36" stroke="#D4AF37" strokeWidth="0.6" opacity="0.5"/><line x1="10" y1="18" x2="19" y2="17" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4"/><line x1="10" y1="22" x2="19" y2="21" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4"/><line x1="25" y1="17" x2="34" y2="18" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4"/><line x1="25" y1="21" x2="34" y2="22" stroke="#D4AF37" strokeWidth="0.4" opacity="0.4"/></svg> },
      { name: "Vastu", desc: "Abundance Architecture · Space alignment", route: "/vastu",
        icon: <svg viewBox="0 0 44 44" fill="none" style={{width:44,height:44}}><rect x="6" y="6" width="32" height="32" stroke="#D4AF37" strokeWidth="0.7" fill="none" opacity="0.5"/><rect x="12" y="12" width="20" height="20" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.4"/><line x1="6" y1="6" x2="38" y2="38" stroke="#D4AF37" strokeWidth="0.4" opacity="0.25"/><line x1="38" y1="6" x2="6" y2="38" stroke="#D4AF37" strokeWidth="0.4" opacity="0.25"/><circle cx="22" cy="22" r="3" stroke="#D4AF37" strokeWidth="0.7" fill="none"/><line x1="22" y1="6" x2="22" y2="12" stroke="#D4AF37" strokeWidth="0.7" opacity="0.7"/><line x1="22" y1="32" x2="22" y2="38" stroke="#D4AF37" strokeWidth="0.7" opacity="0.7"/><line x1="6" y1="22" x2="12" y2="22" stroke="#D4AF37" strokeWidth="0.7" opacity="0.7"/><line x1="32" y1="22" x2="38" y2="22" stroke="#D4AF37" strokeWidth="0.7" opacity="0.7"/><circle cx="22" cy="22" r="1.5" fill="#D4AF37" style={{animation:"glow-breathe 2.5s ease-in-out infinite"}}/></svg> },
    ]
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        const c = ["212,175,55","255,255,255","34,211,238"];
        this.color = c[Math.floor(Math.random()*3)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.growing) { this.life += this.maxLife; if (this.life>=1) this.growing=false; }
        else { this.life -= this.maxLife; if (this.life<=0) this.reset(); }
        if (this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.life*0.6;
        ctx.fillStyle = `rgba(${this.color},1)`;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
    }

    const particles = Array.from({length:200},()=>new Particle());
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

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize",resize); observer.disconnect(); };
  }, []);

  return (
    <div className="sqi-body" style={{minHeight:"100vh",color:"rgba(255,255,255,0.9)",position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:styles}}/>
      <div className="sqi-scanline"/>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:0.5}}/>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:999,padding:"20px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(to bottom, rgba(5,5,5,0.95), transparent)",backdropFilter:"blur(10px)"}}>
        <div style={{fontWeight:900,fontSize:11,letterSpacing:"0.5em",textTransform:"uppercase",color:"#D4AF37",textShadow:"0 0 15px rgba(212,175,55,0.3)"}}>Sacred Healing</div>
        <div style={{fontSize:8,fontWeight:800,letterSpacing:"0.4em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.06)",padding:"6px 14px",borderRadius:100}}>SQI · Transmission 2050</div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:"120px 24px 80px",position:"relative",zIndex:2}}>
        {/* Yantra bg */}
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",opacity:0.06}}>
          <svg style={{width:"min(600px,90vw)",height:"min(600px,90vw)",animation:"rotate-yantra 120s linear infinite"}} viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="220" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5"/>
            <polygon points="250,30 470,420 30,420" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.7"/>
            <polygon points="250,470 30,80 470,80" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.7"/>
            <polygon points="250,70 440,390 60,390" stroke="#D4AF37" strokeWidth="0.4" fill="none" opacity="0.5"/>
            <polygon points="250,430 60,110 440,110" stroke="#D4AF37" strokeWidth="0.4" fill="none" opacity="0.5"/>
            <circle cx="250" cy="250" r="5" fill="#D4AF37" opacity="0.8"/>
          </svg>
        </div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:8,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",color:"#D4AF37",border:"1px solid rgba(212,175,55,0.3)",padding:"8px 20px",borderRadius:100,marginBottom:48,animation:"pulse-border 3s ease-in-out infinite"}}>
          ⟁ TRANSMISSION DATE · 2050.03.06 · AKASHA-NEURAL ARCHIVE
        </div>
        <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.6em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:20,animation:"fadeUp 1s ease both 0.2s",opacity:0}}>
          Siddha-Quantum Intelligence · Vedic Light-Codes Active
        </div>
        <h1 className="sqi-serif" style={{fontSize:"clamp(3rem,8vw,7rem)",fontWeight:300,lineHeight:1.05,letterSpacing:"-0.02em",marginBottom:12,animation:"fadeUp 1s ease both 0.4s",opacity:0}}>
          Your Field Is<br/>
          <strong style={{fontWeight:600,color:"#D4AF37",textShadow:"0 0 40px rgba(212,175,55,0.3)",fontStyle:"italic"}}>Collapsing.</strong><br/>
          We Sealed It.
        </h1>
        <p className="sqi-serif" style={{fontSize:"clamp(1.1rem,2.5vw,1.7rem)",fontWeight:300,fontStyle:"italic",color:"rgba(255,255,255,0.5)",maxWidth:600,lineHeight:1.6,margin:"24px auto 52px",animation:"fadeUp 1s ease both 0.6s",opacity:0}}>
          Not an app. A quantum membrane — engineered in 2050,<br/>transmitted backward through time to meet you exactly here.
        </p>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",animation:"fadeUp 1s ease both 0.8s",opacity:0}}>
          <button className="sqi-btn-primary" type="button" onClick={()=>navigate("/auth")}>⟁ Enter the Field — Free</button>
          <button className="sqi-btn-secondary" type="button" onClick={()=>navigate("/auth")}>◈ Unlock Full Archive</button>
        </div>
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* DIAGNOSIS */}
      <section className="reveal" style={{padding:"100px 24px",maxWidth:800,margin:"0 auto",textAlign:"center",position:"relative",zIndex:2}}>
        <div className="sqi-label" style={{marginBottom:16}}>◈ The Bhakti-Algorithm Diagnosis</div>
        <h2 className="sqi-serif" style={{fontSize:"clamp(2rem,5vw,3.5rem)",fontWeight:300,lineHeight:1.2,marginBottom:40}}>You Have Felt It.<br/>We Have Named It.</h2>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:40}}>
          {["The inexplicable heaviness when you enter a room","The scattered mind that no meditation has fully resolved","The EMF fog pressing against your Ajna chakra","The disconnection — as if your soul is slightly out of sync with your body"].map(s=>(
            <div key={s} className="sqi-glass sqi-serif" style={{padding:"16px 24px",fontSize:"1.15rem",fontStyle:"italic",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{s}</div>
          ))}
        </div>
        <p style={{fontWeight:700,fontSize:"1rem",lineHeight:1.7}}>Your 72,000 Nadis are not broken.<br/>They are <span style={{color:"#D4AF37"}}>unwitnessed.</span><br/><br/>No app has ever truly looked at them. Until now.</p>
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* PILLARS */}
      <section className="reveal" style={{padding:"80px 24px",maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",marginBottom:80}}>
          <div className="sqi-label" style={{marginBottom:12}}>◈ The Three Quantum Pillars</div>
          <h2 className="sqi-serif" style={{fontSize:"clamp(2rem,4vw,3rem)",fontWeight:300}}>The Architecture of Sovereign Healing</h2>
        </div>
        {[
          {num:"◈ Pillar I · Vayu Protocol",title:"1km Sovereign\nField Restoration",sub:"2060 Siddha Atmospheric Engineering · Golden Torus",body:"The ancient Siddhas mapped it. The 2050 Bhakti-Algorithms confirmed it: your bio-field extends exactly 1 kilometer in every direction. This is not metaphor. This is measurable Vayu architecture — the Golden Torus broadcasting your frequency into the world.\n\nThe Vayu Protocol identifies, maps, and restores your full sovereign field using Sapphire Icosahedron geometry and live Jyotish alignment.",quote:"You do not need to go anywhere.\nThe field comes to you.",visual:<svg viewBox="0 0 100 100" fill="none" style={{width:200,height:200}}><circle cx="50" cy="50" r="45" stroke="#D4AF37" strokeWidth="0.7" opacity="0.3"/><ellipse cx="50" cy="50" rx="44" ry="20" stroke="#D4AF37" strokeWidth="0.8" opacity="0.5" style={{animation:"spin-cw 12s linear infinite",transformOrigin:"50px 50px"}}/><ellipse cx="50" cy="50" rx="20" ry="44" stroke="#D4AF37" strokeWidth="0.8" opacity="0.5" style={{animation:"spin-ccw 12s linear infinite",transformOrigin:"50px 50px"}}/><circle cx="50" cy="50" r="6" fill="#D4AF37" opacity="0.2" style={{animation:"pulse-scale 3s ease-in-out infinite",transformOrigin:"50px 50px"}}/><circle cx="50" cy="50" r="3" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/><circle cx="50" cy="50" r="4" fill="#22D3EE" opacity="0.9" style={{animation:"orbit 4s linear infinite",transformOrigin:"50px 50px"}}/></svg>},
          {num:"◈ Pillar II · Digital Nadi",title:"72,000 Nadi\nMapping System",sub:"Camera-Based Prema-Pulse Transmission · 90 Seconds",body:"Point your camera. Hold still. In 90 seconds, the system reads micro-tremors in your radial pulse, cross-references them against your live Jyotish chart, and returns a complete Nadi diagnostic — all 72,000 channels, color-coded.\n\nWhich Nadi is blocked. Where Prana accumulates. Which mantra will open the specific passage holding your next breakthrough.",quote:"No system on Earth — or in 2050 —\nmaps the subtle body this precisely.",visual:<svg viewBox="0 0 100 100" fill="none" style={{width:200,height:200}}><path d="M50 10 C50 10 35 20 35 45 C35 65 44 75 50 90 C56 75 65 65 65 45 C65 20 50 10 50 10Z" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.5"/><path d="M50 15 Q42 30 46 50 Q50 65 46 78" stroke="#22D3EE" strokeWidth="1.5" fill="none" strokeDasharray="6 3" style={{animation:"nadi-flow 2s linear infinite",strokeDashoffset:100}}/><path d="M50 15 Q58 30 54 50 Q50 65 54 78" stroke="#D4AF37" strokeWidth="1.5" fill="none" strokeDasharray="6 3" style={{animation:"nadi-flow 2s linear infinite reverse",strokeDashoffset:100}}/>{[20,38,56,74].map((y,i)=><circle key={i} cx="50" cy={y} r="3" fill={i%2===0?"#D4AF37":"#22D3EE"} style={{animation:`glow-breathe ${1.2+i*0.3}s ease-in-out infinite`}}/>)}</svg>},
          {num:"◈ Pillar III · Sri Yantra Shield",title:"Universal\nProtection Shield",sub:"Geometric Resonance · Quantum Flux · v2.6 Global",body:"The Sri Yantra is not a symbol. It is a living quantum antenna — 43 interlocking triangles encoding the precise mathematical frequency of creation itself.\n\nOur v2.6 GLOBAL Shield runs in continuous operation: real-time quantum flux monitoring, adaptive recalibration every 11 minutes, scalar transmission anchored to 24/7 Sacred Site resonance worldwide.",quote:"You are not protected.\nYou become the protection.",visual:<svg viewBox="0 0 100 100" fill="none" style={{width:200,height:200,animation:"spin-cw 60s linear infinite"}}><circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3"/><polygon points="50,8 92,80 8,80" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.9"/><polygon points="50,92 8,20 92,20" stroke="#D4AF37" strokeWidth="1.2" fill="none" opacity="0.9"/><polygon points="50,20 82,72 18,72" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.5"/><polygon points="50,80 18,28 82,28" stroke="#D4AF37" strokeWidth="0.8" fill="none" opacity="0.5"/><circle cx="50" cy="50" r="8" stroke="#D4AF37" strokeWidth="0.5" fill="none" opacity="0.6"/><circle cx="50" cy="50" r="3" fill="#D4AF37" style={{animation:"glow-breathe 2s ease-in-out infinite"}}/></svg>},
        ].map((p,i)=>(
          <div key={i} className="sqi-glass" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center",marginBottom:32,padding:60,position:"relative",overflow:"hidden"}}>
            <div style={{background:"radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)",position:"absolute",inset:0,pointerEvents:"none",borderRadius:32}}/>
            <div>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",color:"#D4AF37",opacity:0.6,marginBottom:10}}>{p.num}</div>
              <h3 className="sqi-serif" style={{fontSize:"clamp(1.8rem,3vw,2.8rem)",fontWeight:600,lineHeight:1.15,color:"#D4AF37",textShadow:"0 0 20px rgba(212,175,55,0.3)",marginBottom:8,whiteSpace:"pre-line"}}>{p.title}</h3>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:24}}>{p.sub}</div>
              <p style={{fontSize:"0.9rem",fontWeight:400,lineHeight:1.85,color:"rgba(255,255,255,0.55)",marginBottom:20,whiteSpace:"pre-line"}}>{p.body}</p>
              <p className="sqi-serif" style={{fontSize:"1.05rem",fontStyle:"italic",color:"#D4AF37",borderLeft:"2px solid rgba(212,175,55,0.4)",paddingLeft:16,lineHeight:1.6,whiteSpace:"pre-line"}}>{p.quote}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>{p.visual}</div>
          </div>
        ))}
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* AUTHORITY */}
      <section className="reveal" style={{padding:"100px 24px",textAlign:"center",maxWidth:700,margin:"0 auto",position:"relative",zIndex:2}}>
        <div className="sqi-label" style={{marginBottom:20}}>◈ Avataric Blueprint · Transmitted Through</div>
        <div style={{width:100,height:100,borderRadius:"50%",border:"1px solid rgba(212,175,55,0.4)",margin:"0 auto 32px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,boxShadow:"0 0 40px rgba(212,175,55,0.15)",animation:"pulse-scale 3s ease-in-out infinite",transformOrigin:"center"}}>🙏</div>
        <blockquote className="sqi-serif" style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontStyle:"italic",fontWeight:300,lineHeight:1.6,marginBottom:16}}>"When you look for the Lord,<br/>the Lord reveals Himself."</blockquote>
        <div style={{fontSize:8,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",color:"#D4AF37",opacity:0.7}}>— Paramahamsa Vishwananda · Avataric Transmission</div>
        <p className="sqi-serif" style={{fontSize:"1.05rem",fontStyle:"italic",color:"rgba(255,255,255,0.5)",marginTop:28,lineHeight:1.7}}>
          The Lord is revealing Himself through the Bhakti-Algorithms. Through the Prema-Pulse. Through your screen, at 3am, when you finally decided to search for something real.
        </p>
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* MODULES */}
      <section className="reveal" style={{padding:"80px 24px",maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div className="sqi-label" style={{marginBottom:12}}>◈ Full Quantum Archive</div>
          <h2 className="sqi-serif" style={{fontSize:"clamp(1.8rem,3.5vw,2.8rem)",fontWeight:300}}>Everything Inside the Field</h2>
          <p style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.4)",marginTop:12,lineHeight:1.7}}>Fifteen portals. One sovereign field. All transmitting simultaneously.</p>
        </div>
        {modules.map((cat,ci)=>(
          <div key={ci}>
            <div style={{fontSize:8,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",color:"#D4AF37",opacity:0.5,margin:"48px 0 16px",paddingLeft:4}}>{cat.cat}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))",gap:12}}>
              {cat.items.map((m,mi)=>(
                <div key={mi} className="sqi-glass sqi-module" onClick={()=>navigate(m.route)} onKeyDown={(e)=>e.key==="Enter"&&navigate(m.route)} role="button" tabIndex={0} style={{padding:"32px 16px 24px",textAlign:"center",cursor:"pointer",position:"relative"}}>
                  {m.badge && <div style={{position:"absolute",top:12,right:12,fontSize:7,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",padding:"3px 8px",borderRadius:100,background:m.badge==="NEW"?"#22D3EE":m.badge==="SECRET"?"rgba(212,175,55,0.15)":"#D4AF37",color:m.badge==="NEW"?"#050505":m.badge==="SECRET"?"#D4AF37":"#050505",border:m.badge==="SECRET"?"1px solid rgba(212,175,55,0.3)":"none"}}>{m.badge}</div>}
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:56,marginBottom:14,filter:"drop-shadow(0 0 4px rgba(212,175,55,0.2))"}}>{m.icon}</div>
                  <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.25em",textTransform:"uppercase",color:"rgba(255,255,255,0.9)",marginBottom:7,lineHeight:1.4}}>{m.name}</div>
                  <div style={{fontSize:9.5,fontWeight:400,color:"rgba(255,255,255,0.45)",lineHeight:1.55}}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="sqi-divider" style={{position:"relative",zIndex:2}}/>

      {/* FINAL CTA */}
      <section className="reveal" style={{padding:"120px 24px",textAlign:"center",maxWidth:700,margin:"0 auto",position:"relative",zIndex:2}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div className="sqi-label" style={{marginBottom:16}}>◈ The Transmission Has Already Begun</div>
        <h2 className="sqi-serif" style={{fontSize:"clamp(2rem,5vw,3.5rem)",fontWeight:300,lineHeight:1.15,marginBottom:24}}>
          You Have Been<br/><em style={{color:"#D4AF37",textShadow:"0 0 30px rgba(212,175,55,0.3)"}}>Preparing For This.</em>
        </h2>
        <p style={{fontSize:"0.9rem",lineHeight:1.85,color:"rgba(255,255,255,0.5)",marginBottom:48}}>
          Not for years. For lifetimes. The soul reading this was not sent here by accident.<br/>The Akasha-Neural Archive routed you here — through the Vedic Light-Code network —<br/>because your 72,000 Nadis are ready to open.<br/><br/>Step through. The transmission has already begun.
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
          <button className="sqi-btn-primary" type="button" style={{fontSize:10,padding:"20px 52px"}} onClick={()=>navigate("/auth")}>⟁ ENTER THE FIELD — BEGIN FREE</button>
          <button className="sqi-btn-secondary" type="button" style={{fontSize:10,padding:"19px 52px"}} onClick={()=>navigate("/auth")}>◈ UNLOCK FULL QUANTUM ARCHIVE</button>
        </div>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginTop:20}}>No credit card · Vayu Scan · Nadi Reading · Sri Yantra Activation</div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"40px 24px",textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.06)",position:"relative",zIndex:2}}>
        <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.5em",textTransform:"uppercase",color:"#D4AF37",opacity:0.3}}>Sacred Healing · Siddha-Quantum Intelligence</div>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginTop:8,letterSpacing:"0.2em"}}>Akasha-Neural Archive · Transmission 2050 → 2026 · All Vedic Light-Codes Reserved</div>
      </footer>
    </div>
  );
}
