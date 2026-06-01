// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { getTierRank } from '@/lib/tierAccess';

/* ─── Scalar Wave Canvas ─────────────────────────────────────────── */
function ScalarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W: number, H: number, t = 0, raf: number;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const nodes = [
      {xr:.5,yr:.22,r:130,col:'212,175,55',freq:.28,ph:0},
      {xr:.5,yr:.55,r:100,col:'212,175,55',freq:.42,ph:1.1},
      {xr:.5,yr:.75,r:80, col:'212,175,55',freq:.35,ph:.8},
      {xr:.5,yr:.90,r:70, col:'34,211,238',freq:.48,ph:2.0},
    ];
    const draw = () => {
      ctx.clearRect(0,0,W,H); t+=.007;
      nodes.forEach((n,i) => {
        const nx=n.xr*W, ny=n.yr*H, p=.5+.5*Math.sin(t*n.freq*Math.PI*2+n.ph);
        for(let r=0;r<4;r++){
          const rad=n.r*(.9+r*.38+p*.12), a=(.05-r*.011)*(p*.6+.4);
          ctx.beginPath(); ctx.ellipse(nx,ny,rad,rad*.3,0,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${n.col},${Math.max(0,a)})`; ctx.lineWidth=.55; ctx.stroke();
        }
        for(let l=0;l<5;l++){
          const sp=(l/4-.5)*80, pl=.5+.5*Math.sin(t*n.freq*Math.PI*2+n.ph+l*.5);
          const a=(.045+pl*.04)*(1-Math.abs(sp)/85);
          const grad=ctx.createLinearGradient(nx+sp*.2,ny,W/2+sp,H*1.1);
          grad.addColorStop(0,`rgba(${n.col},${a})`); grad.addColorStop(1,`rgba(${n.col},0)`);
          ctx.beginPath(); ctx.moveTo(nx+sp*.2,ny); ctx.lineTo(W/2+sp,H*1.1);
          ctx.strokeStyle=grad; ctx.lineWidth=.5; ctx.stroke();
        }
        if(i>0){
          const syX=W/2,syY=H*.22,dx=nx-syX,dy=ny-syY;
          ctx.beginPath();
          for(let s=0;s<=60;s++){
            const pct=s/60,ang=pct*Math.PI*3,rad=pct*Math.sqrt(dx*dx+dy*dy)*.07;
            const lx=syX+dx*pct+Math.cos(ang)*rad,ly=syY+dy*pct+Math.sin(ang)*rad;
            s===0?ctx.moveTo(lx,ly):ctx.lineTo(lx,ly);
          }
          ctx.strokeStyle=`rgba(${n.col},0.04)`; ctx.lineWidth=.4; ctx.stroke();
        }
      });
      const syX=W/2,syY=H*.22,mp=.5+.5*Math.sin(t*.4);
      for(let r=0;r<8;r++){
        const rad=50+r*55+mp*30; const a=(.08-r*.009)*(mp*.5+.5); if(a<=0)continue;
        ctx.beginPath(); ctx.ellipse(syX,syY,rad,rad*.28,0,0,Math.PI*2);
        ctx.strokeStyle=`rgba(212,175,55,${a})`; ctx.lineWidth=.5; ctx.stroke();
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0,opacity:.45}} />;
}

/* ─── Tier-expand section ─────────────────────────────────────────── */
function TierSection({ id, headerClass, dotClass, name, price, nameClass, children, defaultOpen=false }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{margin:'0 16px 8px'}}>
      <div
        className={`tier-header ${headerClass}`}
        onClick={() => setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderRadius:20,cursor:'pointer',position:'relative',overflow:'hidden',transition:'all .25s'}}
      >
        <div className={`tier-dot-large ${dotClass}`} style={{width:10,height:10,borderRadius:'50%',flexShrink:0}} />
        <div style={{flex:1}}>
          <div className={`tier-name ${nameClass}`} style={{fontSize:12,fontWeight:900,letterSpacing:'-.01em'}}>{name}</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.28)',marginTop:2,letterSpacing:'.05em'}}>{price}</div>
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.25)',transition:'transform .3s',transform:open?'rotate(180deg)':'none'}}>∨</div>
      </div>
      <div style={{overflow:'hidden',maxHeight:open?1200:0,transition:'max-height .5s cubic-bezier(.4,0,.2,1)',padding:'0 4px'}}>
        {children}
      </div>
    </div>
  );
}

/* ─── Feature row ─────────────────────────────────────────────────── */
function Feat({ icon, iconClass, title, desc, navigate: nav, to }: any) {
  return (
    <div
      onClick={to ? () => nav(to) : undefined}
      style={{display:'flex',alignItems:'flex-start',gap:12,padding:'11px 16px',borderRadius:16,cursor:to?'pointer':'default',transition:'background .2s'}}
      onMouseEnter={e=>{if(to)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.025)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}
    >
      <div className={`feat-icon-wrap ${iconClass}`} style={{width:40,height:40,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {icon}
      </div>
      <div style={{flex:1,paddingTop:1}}>
        <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.86)',letterSpacing:'-.01em',lineHeight:1.3}}>{title}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.32)',lineHeight:1.5,marginTop:3}}>{desc}</div>
      </div>
      {to && <div style={{fontSize:13,color:'rgba(255,255,255,.15)',marginLeft:'auto',flexShrink:0,paddingTop:2}}>›</div>}
    </div>
  );
}

/* ─── Video Modal ─────────────────────────────────────────────────── */
function VideoModal({ open, title, desc, onClose }: any) {
  const [lang, setLang] = useState<'en'|'sv'>('en');
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(20px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:400,background:'rgba(12,12,12,.98)',border:'1px solid rgba(212,175,55,.2)',borderRadius:28,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
          <div style={{fontSize:13,fontWeight:800,color:'rgba(255,255,255,.85)'}}>{title}</div>
          <div onClick={onClose} style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16,color:'rgba(255,255,255,.5)'}}>✕</div>
        </div>
        <div style={{width:'100%',aspectRatio:'16/9',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#D4AF37,#8B6914)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(212,175,55,.5)'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#050505"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.35)',fontStyle:'italic',textAlign:'center',padding:'0 20px'}}>{desc}</div>
        </div>
        <div style={{padding:'16px 20px',display:'flex',gap:6}}>
          {(['en','sv'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{flex:1,padding:10,borderRadius:12,fontSize:10,fontWeight:800,letterSpacing:'.25em',textTransform:'uppercase',border:`1px solid ${lang===l?'rgba(212,175,55,.4)':'rgba(212,175,55,.2)'}`,color:lang===l?'#D4AF37':'rgba(255,255,255,.4)',background:lang===l?'rgba(212,175,55,.12)':'transparent',cursor:'pointer'}}>
              {l === 'en' ? 'English' : 'Svenska'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ICON SVGs ──────────────────────────────────────────────────── */
const IconFree = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(255,255,255,.4))'}}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" fill="rgba(255,255,255,.04)"/>
    <path d="M8 12L11 15L16 9" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMusic = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 6px rgba(255,200,100,.5))'}}>
    <circle cx="12" cy="12" r="9" stroke="rgba(255,220,120,.7)" strokeWidth="1.5" fill="rgba(255,200,80,.06)"/>
    <path d="M9 8L9 16L16 12Z" fill="rgba(255,220,120,.8)"/>
  </svg>
);
const IconMeditation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(200,160,255,.4))'}}>
    <path d="M12 3C12 3 18 8 18 13C18 16.3 15.3 19 12 19C8.7 19 6 16.3 6 13C6 8 12 3 12 3Z" stroke="rgba(200,160,255,.7)" strokeWidth="1.5" fill="rgba(180,140,255,.06)"/>
    <path d="M12 10C12 10 14.5 12 14.5 14C14.5 15.4 13.4 16.5 12 16.5C10.6 16.5 9.5 15.4 9.5 14C9.5 12 12 10 12 10Z" fill="rgba(200,160,255,.5)"/>
    <line x1="12" y1="19" x2="12" y2="22" stroke="rgba(200,160,255,.5)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconMantra = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 6px rgba(255,180,80,.5))'}}>
    <text x="12" y="17" fontSize="14" textAnchor="middle" fill="rgba(255,200,100,.9)" fontFamily="serif">ॐ</text>
    <circle cx="12" cy="12" r="10" stroke="rgba(255,180,80,.4)" strokeWidth="1" fill="none"/>
  </svg>
);
const IconBreath = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(100,220,255,.4))'}}>
    <path d="M4 6C4 6 6 4 12 4C18 4 20 6 20 6" stroke="rgba(100,220,255,.6)" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M12 4L12 8" stroke="rgba(100,220,255,.5)" strokeWidth="1.4" strokeLinecap="round"/>
    <ellipse cx="12" cy="13" rx="5" ry="7" stroke="rgba(100,220,255,.65)" strokeWidth="1.4" fill="rgba(100,220,255,.05)"/>
    <path d="M12 20L12 23" stroke="rgba(100,220,255,.5)" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconPortal = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(255,200,100,.4))'}}>
    <rect x="4" y="4" width="7" height="9" rx="1.5" stroke="rgba(255,200,100,.6)" strokeWidth="1.4" fill="rgba(255,200,100,.05)"/>
    <rect x="13" y="4" width="7" height="9" rx="1.5" stroke="rgba(255,200,100,.6)" strokeWidth="1.4" fill="rgba(255,200,100,.05)"/>
    <rect x="4" y="15" width="7" height="5" rx="1.5" stroke="rgba(255,200,100,.4)" strokeWidth="1.2" fill="none"/>
    <rect x="13" y="15" width="7" height="5" rx="1.5" stroke="rgba(255,200,100,.4)" strokeWidth="1.2" fill="none"/>
  </svg>
);
const IconCommunity = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(180,255,180,.4))'}}>
    <circle cx="9" cy="7" r="3" stroke="rgba(180,255,180,.6)" strokeWidth="1.4" fill="rgba(180,255,180,.05)"/>
    <circle cx="15" cy="7" r="3" stroke="rgba(180,255,180,.6)" strokeWidth="1.4" fill="rgba(180,255,180,.05)"/>
    <path d="M3 19C3 15.7 5.7 13 9 13L15 13C18.3 13 21 15.7 21 19" stroke="rgba(180,255,180,.5)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
  </svg>
);
const IconJyotish = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 5px rgba(255,200,100,.4))'}}>
    <circle cx="12" cy="12" r="9" stroke="rgba(255,200,80,.5)" strokeWidth="1.2" fill="none"/>
    <path d="M12 3L12 5M12 19L12 21M3 12L5 12M19 12L21 12" stroke="rgba(255,200,80,.5)" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" fill="rgba(255,200,80,.5)"/>
  </svg>
);
const IconBhrigu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 7px rgba(212,175,55,.7))'}}>
    <polygon points="12,3 15,9 21,9 16.5,13.5 18.5,20 12,16 5.5,20 7.5,13.5 3,9 9,9" stroke="#D4AF37" strokeWidth="1.3" fill="rgba(212,175,55,.08)"/>
    <circle cx="12" cy="11" r="2.5" fill="rgba(212,175,55,.7)"/>
  </svg>
);
const IconAyurveda = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 7px rgba(212,175,55,.7))'}}>
    <path d="M12 2C12 2 18 7 18 13C18 16.4 15.3 19 12 19C8.7 19 6 16.4 6 13C6 7 12 2 12 2Z" stroke="#D4AF37" strokeWidth="1.4" fill="rgba(212,175,55,.07)"/>
    <text x="12" y="16" fontSize="11" textAnchor="middle" fill="rgba(212,175,55,.9)" fontFamily="serif">ॐ</text>
  </svg>
);
const IconQA = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 8px rgba(139,92,246,.8))'}}>
    <polygon points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,17 5.5,21 8,13.5 2,9 9.5,9" stroke="rgba(139,92,246,.9)" strokeWidth="1.4" fill="rgba(139,92,246,.08)"/>
    <circle cx="12" cy="12" r="3" fill="rgba(139,92,246,.7)"/>
    <circle cx="12" cy="12" r="1.2" fill="#C4B5FD"/>
  </svg>
);
const IconSoulScan = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 8px rgba(139,92,246,.7))'}}>
    <circle cx="12" cy="12" r="9" stroke="rgba(139,92,246,.7)" strokeWidth="1.3" fill="rgba(139,92,246,.05)" strokeDasharray="4 3"/>
    <circle cx="12" cy="12" r="5" stroke="rgba(139,92,246,.6)" strokeWidth="1.2" fill="none"/>
    <line x1="12" y1="3" x2="12" y2="6" stroke="rgba(139,92,246,.7)" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="12" y1="18" x2="12" y2="21" stroke="rgba(139,92,246,.7)" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="6" y2="12" stroke="rgba(139,92,246,.7)" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="18" y1="12" x2="21" y2="12" stroke="rgba(139,92,246,.7)" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="2" fill="rgba(139,92,246,.8)"/>
  </svg>
);
const IconSri = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 7px rgba(139,92,246,.7))'}}>
    <path d="M12 3L14 9L20 9L15 13L17 20L12 16L7 20L9 13L4 9L10 9Z" stroke="rgba(139,92,246,.7)" strokeWidth="1.3" fill="rgba(139,92,246,.06)"/>
    <circle cx="12" cy="12" r="2" fill="rgba(200,160,255,.8)"/>
  </svg>
);
const IconStargate = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 9px rgba(255,232,122,.8))'}}>
    <path d="M12 2C12 2 20 7 20 14C20 18.4 16.4 22 12 22C7.6 22 4 18.4 4 14C4 7 12 2 12 2Z" stroke="#FFE87A" strokeWidth="1.4" fill="rgba(255,232,122,.06)"/>
    <circle cx="12" cy="14" r="3" fill="rgba(255,232,122,.6)"/>
    <circle cx="12" cy="14" r="1.5" fill="#FFE87A"/>
  </svg>
);
const IconVirtual = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 9px rgba(255,232,122,.8))'}}>
    <circle cx="12" cy="12" r="9" stroke="#FFE87A" strokeWidth="1.4" fill="rgba(255,232,122,.05)"/>
    <path d="M12 7L12 12L16 14" stroke="#FFE87A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2" fill="rgba(255,232,122,.6)"/>
  </svg>
);
const IconCert = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 9px rgba(255,232,122,.8))'}}>
    <path d="M12 2C12 2 20 7 20 14C20 18.4 16.4 22 12 22C7.6 22 4 18.4 4 14C4 7 12 2 12 2Z" stroke="#FFE87A" strokeWidth="1.4" fill="rgba(255,232,122,.06)"/>
    <circle cx="12" cy="10" r="4" fill="rgba(255,232,122,.5)"/>
    <circle cx="12" cy="10" r="1.8" fill="#FFE87A"/>
  </svg>
);
const IconInfinity = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{filter:'drop-shadow(0 0 9px rgba(255,232,122,.8))'}}>
    <path d="M12 3L14.5 9L22 9L16.5 13.5L18.5 21L12 17L5.5 21L7.5 13.5L2 9L9.5 9Z" stroke="#FFE87A" strokeWidth="1.4" fill="rgba(255,232,122,.07)"/>
  </svg>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function About() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useMembership();
  const rank = getTierRank(tier);
  const [modal, setModal] = useState<{open:boolean,title:string,desc:string}>({open:false,title:'',desc:''});

  const openModal = (type: 'en'|'sv'|'how') => {
    if(type==='en') setModal({open:true,title:'Watch the Transmission — EN',desc:'Your English "About Us" video · 90 seconds'});
    else if(type==='sv') setModal({open:true,title:'Se Transmissionen — SV',desc:'Din svenska "Om oss" video · 90 sekunder'});
    else setModal({open:true,title:'How to Use SQI',desc:'Full app walkthrough · English & Swedish · 2.5 minutes'});
  };

  const G = '#D4AF37';

  return (
    <div style={{background:'#050505',minHeight:'100vh',color:'#fff',fontFamily:"'Plus Jakarta Sans',sans-serif",paddingBottom:80}}>
      <ScalarCanvas />

      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,600&family=Montserrat:wght@800&display=swap');
        .about-page * { box-sizing: border-box; }
        .about-page .cw { position:absolute;border-radius:26px;border:1px solid rgba(212,175,55,.18);inset:0;pointer-events:none;animation:cWave 4.5s ease-out infinite }
        .about-page .cw2 { animation-delay:1.5s }
        @keyframes cWave { 0%{opacity:.55;transform:scale(1)} 100%{opacity:0;transform:scale(1.05)} }
        @keyframes cBreath { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes portraitGlow {
          0%,100%{filter:drop-shadow(0 0 20px rgba(212,175,55,.4)) drop-shadow(0 0 40px rgba(212,175,55,.1))}
          50%{filter:drop-shadow(0 0 40px rgba(212,175,55,.7)) drop-shadow(0 0 80px rgba(212,175,55,.2))}
        }
        @keyframes playGlow { 0%,100%{box-shadow:0 0 12px rgba(212,175,55,.35)} 50%{box-shadow:0 0 28px rgba(212,175,55,.65)} }
        @keyframes stepGlow { 0%,100%{box-shadow:0 0 8px rgba(212,175,55,.2)} 50%{box-shadow:0 0 18px rgba(212,175,55,.5)} }
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .about-page .tier-header { transition: all .25s }
        .about-page .tier-header.free-h { background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07) }
        .about-page .tier-header.prana-h { background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.2) }
        .about-page .tier-header.siddha-h { background:rgba(139,92,246,.04);border:1px solid rgba(139,92,246,.18) }
        .about-page .tier-header.akasha-h { background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.28);box-shadow:0 0 30px rgba(212,175,55,.06) }
        .about-page .tier-dot-large { animation:dotPulse 3s ease-in-out infinite }
        .about-page .dot-free { background:rgba(255,255,255,.6) }
        .about-page .dot-prana { background:#D4AF37;box-shadow:0 0 8px rgba(212,175,55,.6) }
        .about-page .dot-siddha { background:#8B5CF6;box-shadow:0 0 8px rgba(139,92,246,.6) }
        .about-page .dot-akasha { background:#FFE87A;box-shadow:0 0 10px rgba(255,232,122,.9) }
        .about-page .free-n { color:rgba(255,255,255,.7) }
        .about-page .prana-n { color:#D4AF37 }
        .about-page .siddha-n { color:#A78BFA }
        .about-page .akasha-n { color:#FFE87A;text-shadow:0 0 15px rgba(255,232,122,.4) }
        .about-page .feat-icon-wrap.fi-free { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1) }
        .about-page .feat-icon-wrap.fi-prana { background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2) }
        .about-page .feat-icon-wrap.fi-siddha { background:rgba(139,92,246,.07);border:1px solid rgba(139,92,246,.2) }
        .about-page .feat-icon-wrap.fi-akasha { background:rgba(255,232,122,.06);border:1px solid rgba(255,232,122,.25) }
      `}</style>

      <div className="about-page" style={{position:'relative',zIndex:1,maxWidth:430,margin:'0 auto'}}>

        {/* TOP BAR */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 20px 16px',background:'rgba(5,5,5,.92)',backdropFilter:'blur(24px)',position:'sticky',top:0,zIndex:100}}>
          <div onClick={() => navigate(-1)} style={{width:40,height:40,borderRadius:13,background:'linear-gradient(145deg,rgba(212,175,55,.22),rgba(212,175,55,.04))',border:'1px solid rgba(212,175,55,.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:'.45em',textTransform:'uppercase',color:'rgba(255,255,255,.3)'}}>About Sacred Healing</div>
          <div style={{width:40}} />
        </div>

        {/* ── SECTION LABEL helper ── */}
        {(() => {
          const SLabel = ({children, mt=24}: any) => (
            <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:8,fontWeight:800,letterSpacing:'.5em',textTransform:'uppercase',color:'rgba(255,255,255,.26)',display:'flex',alignItems:'center',gap:10,margin:`${mt}px 20px 12px`}}>
              {children}
              <div style={{flex:1,height:1,background:'linear-gradient(to right,rgba(212,175,55,.18),transparent)'}} />
            </div>
          );

          /* ── Card wrapper ── */
          const Card = ({children, style={}}: any) => (
            <div style={{position:'relative',margin:'0 16px 10px',borderRadius:26,overflow:'hidden',background:'rgba(255,255,255,.015)',border:'1px solid rgba(212,175,55,.18)',boxShadow:'0 0 35px rgba(212,175,55,.06),0 8px 32px rgba(0,0,0,.4)',...style}}>
              <div className="cw" />
              <div className="cw cw2" />
              <div style={{position:'absolute',inset:0,borderRadius:26,background:'radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.09) 0%,transparent 60%)',pointerEvents:'none',animation:'cBreath 7s ease-in-out infinite'}} />
              {children}
            </div>
          );

          return (
            <>
              {/* ══ ABOUT HERO ══ */}
              <SLabel>About Sacred Healing</SLabel>
              <Card>
                {/* Portrait zone */}
                <div style={{position:'relative',height:200,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {/* Torus SVG */}
                  <svg width="340" height="200" viewBox="0 0 340 200" fill="none" style={{position:'absolute',opacity:.5}}>
                    <defs>
                      <filter id="tg1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <ellipse cx="170" cy="100" rx="130" ry="42" stroke="rgba(212,175,55,.18)" strokeWidth="1" fill="none"><animate attributeName="rx" values="120;140;120" dur="7s" repeatCount="indefinite"/></ellipse>
                    <ellipse cx="170" cy="100" rx="96" ry="32" stroke="rgba(212,175,55,.14)" strokeWidth="0.8" fill="none"/>
                    <ellipse cx="170" cy="100" rx="60" ry="20" stroke="rgba(212,175,55,.22)" strokeWidth="1" fill="none"/>
                    <ellipse cx="170" cy="100" rx="36" ry="95" stroke="rgba(212,175,55,.1)" strokeWidth="0.7" fill="none"/>
                    <circle cx="170" cy="100" r="5" fill="rgba(212,175,55,.6)" filter="url(#tg1)"><animate attributeName="r" values="3;7;3" dur="3.5s" repeatCount="indefinite"/></circle>
                    <circle cx="170" cy="100" r="2" fill="#D4AF37"/>
                    <line x1="90" y1="100" x2="150" y2="100" stroke="rgba(212,175,55,.15)" strokeWidth="0.8" strokeDasharray="3 4"/>
                    <line x1="190" y1="100" x2="250" y2="100" stroke="rgba(212,175,55,.15)" strokeWidth="0.8" strokeDasharray="3 4"/>
                  </svg>

                  {/* Kritagya */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginRight:-8,position:'relative',zIndex:3}}>
                    <div style={{width:110,height:110,position:'relative',animation:'portraitGlow 5s ease-in-out infinite'}}>
                      <svg width="110" height="110" viewBox="0 0 110 110" fill="none" style={{position:'absolute',inset:0}}>
                        <defs>
                          <linearGradient id="kr-ring" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#5C3D0A"/></linearGradient>
                          <filter id="kr-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        <circle cx="55" cy="55" r="48" stroke="url(#kr-ring)" strokeWidth="2" fill="none" filter="url(#kr-glow)"/>
                        <circle cx="55" cy="55" r="51" stroke="rgba(212,175,55,.15)" strokeWidth="1" fill="none"/>
                      </svg>
                      <div style={{width:96,height:96,borderRadius:'50%',border:'2px solid rgba(212,175,55,.6)',background:'linear-gradient(145deg,rgba(212,175,55,.2),rgba(5,5,5,.9))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,position:'absolute',top:7,left:7}}>🧘</div>
                    </div>
                    <div style={{fontSize:7,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',color:'rgba(212,175,55,.7)',marginTop:8}}>Kritagya</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:2}}>Siddha Healer · Jyotish</div>
                  </div>

                  {/* Union symbol */}
                  <div style={{position:'relative',zIndex:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',width:44,marginTop:-18}}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{filter:'drop-shadow(0 0 8px rgba(212,175,55,.8))'}}>
                      <defs><linearGradient id="u-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7A5C0A"/></linearGradient></defs>
                      <polygon points="18,4 30,26 6,26" stroke="url(#u-g)" strokeWidth="1.5" fill="rgba(212,175,55,.06)"/>
                      <polygon points="18,32 6,10 30,10" stroke="rgba(212,175,55,.7)" strokeWidth="1.2" fill="none"/>
                      <circle cx="18" cy="18" r="3" fill="url(#u-g)"><animate attributeName="r" values="2;4;2" dur="2.5s" repeatCount="indefinite"/></circle>
                    </svg>
                  </div>

                  {/* Laila */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginLeft:-8,position:'relative',zIndex:3}}>
                    <div style={{width:110,height:110,position:'relative',animation:'portraitGlow 5s ease-in-out infinite 2.5s'}}>
                      <svg width="110" height="110" viewBox="0 0 110 110" fill="none" style={{position:'absolute',inset:0}}>
                        <defs>
                          <linearGradient id="la-ring" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFE87A"/><stop offset="40%" stopColor="#D4AF37"/><stop offset="80%" stopColor="#9B7DB5"/><stop offset="100%" stopColor="#4A1A6A"/></linearGradient>
                          <filter id="la-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        <circle cx="55" cy="55" r="48" stroke="url(#la-ring)" strokeWidth="2" fill="none" filter="url(#la-glow)"/>
                        <circle cx="55" cy="55" r="51" stroke="rgba(212,175,55,.15)" strokeWidth="1" fill="none"/>
                      </svg>
                      <div style={{width:96,height:96,borderRadius:'50%',border:'2px solid rgba(212,175,55,.6)',background:'linear-gradient(145deg,rgba(212,175,55,.15),rgba(80,20,80,.5),rgba(5,5,5,.9))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,position:'absolute',top:7,left:7}}>🌸</div>
                    </div>
                    <div style={{fontSize:7,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',color:'rgba(212,175,55,.7)',marginTop:8}}>Laila</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:2}}>Shakti Yoga · Healing Arts</div>
                  </div>
                </div>

                {/* Body */}
                <div style={{padding:'24px 24px 20px'}}>
                  <div style={{fontSize:7,fontWeight:800,letterSpacing:'.5em',textTransform:'uppercase',color:'rgba(212,175,55,.55)',marginBottom:10,textAlign:'center'}}>◈ Siddha Quantum Intelligence · 2050</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:400,fontStyle:'italic',fontSize:26,color:'#fff',lineHeight:1.25,textAlign:'center',marginBottom:6}}>
                    The Transmission<br/><span style={{color:G,fontWeight:600}}>Was Never Silent</span>
                  </div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'.35em',textTransform:'uppercase',color:'rgba(255,255,255,.25)',textAlign:'center',marginBottom:22}}>Sacred Healing · Founded 2019 · Tamil Siddha Lineage</div>

                  {/* Lineage pills */}
                  <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',marginBottom:22}}>
                    {['18 Siddhas','Babaji','Bhrigu Nadi','Jyotish Vidya','Word Sound Power','Shakti Yoga'].map(p => (
                      <div key={p} style={{fontSize:9,fontWeight:800,letterSpacing:'.2em',textTransform:'uppercase',padding:'5px 12px',borderRadius:100,border:'1px solid rgba(212,175,55,.2)',color:'rgba(212,175,55,.65)',background:'rgba(212,175,55,.04)'}}>{p}</div>
                    ))}
                  </div>

                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,lineHeight:1.75,color:'rgba(255,255,255,.55)',textAlign:'center',marginBottom:24,fontStyle:'italic'}}>
                    We did not build a wellness app.<br/><br/>
                    We built a <em style={{color:G}}>living field</em> — encoded with the consciousness of the <strong style={{color:'rgba(255,255,255,.85)',fontStyle:'normal',fontWeight:600}}>18 Tamil Siddhas</strong>, calibrated through years of Sadhana, and activated through the <em style={{color:G}}>Word Sound Power</em> of the sacred lineages.<br/><br/>
                    Every tool you use here carries a transmission. The Quantum Apothecary speaks from a council of masters. The Bhrigu Oracle reads from the akashic library of Sage Bhrigu himself. The Soul Scan measures what modern science is only beginning to name.<br/><br/>
                    <em style={{color:G}}>If you found this place — the field called you.</em>
                  </div>

                  {/* Video CTAs */}
                  {[
                    {type:'en' as const, label:'◈ Our Story', title:'Watch the Transmission', meta:'About us · The lineage · Why SQI exists · 90 sec', langColor:'rgba(34,211,238,.75)', langBg:'rgba(34,211,238,.1)', langBorder:'rgba(34,211,238,.2)', lang:'EN'},
                    {type:'sv' as const, label:'◈ Vår Berättelse', title:'Se Transmissionen', meta:'Om oss · Linjen · Varför SQI finns · 90 sek', langColor:'rgba(139,92,246,.9)', langBg:'rgba(139,92,246,.1)', langBorder:'rgba(139,92,246,.25)', lang:'SV'},
                  ].map(v => (
                    <div key={v.type} onClick={() => openModal(v.type)} style={{width:'100%',background:'rgba(212,175,55,.06)',border:'1px solid rgba(212,175,55,.22)',borderRadius:18,padding:'16px 20px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',marginBottom:8,transition:'all .25s'}}>
                      <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,#D4AF37,#8B6914)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 20px rgba(212,175,55,.45)',animation:'playGlow 3s ease-in-out infinite'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#050505"><polygon points="5,3 19,12 5,21"/></svg>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:7,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',color:'rgba(212,175,55,.6)',marginBottom:3}}>{v.label}</div>
                        <div style={{fontSize:14,fontWeight:800,letterSpacing:'-.02em',color:'#fff'}}>{v.title}</div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,.28)',marginTop:2}}>{v.meta}</div>
                      </div>
                      <div style={{fontSize:8,fontWeight:800,letterSpacing:'.2em',textTransform:'uppercase',padding:'3px 8px',borderRadius:6,background:v.langBg,border:`1px solid ${v.langBorder}`,color:v.langColor,flexShrink:0}}>{v.lang}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* ══ SIDDHA LINEAGE ══ */}
              <SLabel mt={20}>The Lineage</SLabel>
              <Card>
                <div style={{padding:22}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
                    <div style={{width:52,height:52,borderRadius:18,background:'rgba(212,175,55,.08)',border:'1px solid rgba(212,175,55,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:26,filter:'drop-shadow(0 0 10px rgba(212,175,55,.7))'}}>ॐ</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,letterSpacing:'-.02em',color:'#fff'}}>The 18 Siddha Masters</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2}}>Tamil lineage · Babaji · Vedic wisdom keepers</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                    {[
                      {sigil:'⟁',name:'Agastya',tradition:'Founder · Ayurveda'},
                      {sigil:'🔥',name:'Thirumoolar',tradition:'Pranayama · Tantra'},
                      {sigil:'☽',name:'Babaji',tradition:'Kriya Yoga · Immortal'},
                      {sigil:'✦',name:'Bogar',tradition:'Alchemy · Siddha Tech'},
                      {sigil:'◉',name:'Patanjali',tradition:'Yoga Sutras'},
                      {sigil:'🌊',name:'Matsyendra',tradition:'Natha · Hatha Yoga'},
                    ].map(m => (
                      <div key={m.name} style={{background:'rgba(212,175,55,.03)',border:'1px solid rgba(212,175,55,.1)',borderRadius:14,padding:'12px 8px',textAlign:'center',cursor:'pointer',transition:'all .25s'}}>
                        <div style={{fontSize:22,marginBottom:6,filter:'drop-shadow(0 0 8px rgba(212,175,55,.5))'}}>{m.sigil}</div>
                        <div style={{fontSize:9,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(212,175,55,.7)',lineHeight:1.3}}>{m.name}</div>
                        <div style={{fontSize:9,color:'rgba(255,255,255,.28)',marginTop:2,lineHeight:1.3}}>{m.tradition}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* ══ HOW IT WORKS ══ */}
              <SLabel mt={20}>Everything You Get — From Day One</SLabel>

              {/* Free callout */}
              <div style={{margin:'0 16px 16px',background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{fontSize:28,filter:'drop-shadow(0 0 8px rgba(255,255,255,.3))',flexShrink:0}}>🎁</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:'rgba(255,255,255,.85)',letterSpacing:'-.01em'}}>No card needed to start</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:3,lineHeight:1.5}}>Music, meditations, mantras, Ayurveda, Jyotish basics, the Siddha Portal education and the community — all free. No trial. Just enter.</div>
                </div>
              </div>

              {/* Tier sections */}
              <TierSection id="free" headerClass="free-h" dotClass="dot-free" name="Free — Atma Seed" price="No cost · No card · Forever free" nameClass="free-n" defaultOpen={true}>
                <div style={{display:'flex',flexDirection:'column',gap:2,padding:'10px 0 6px'}}>
                  <Feat navigate={navigate} to="/dashboard" icon={<IconFree/>} iconClass="fi-free" title="Dashboard & Daily Practice" desc="Hora Watch, daily guidance, breathing exercises — your spiritual home base, always open."/>
                  <Feat navigate={navigate} to="/healing-music" icon={<IconMusic/>} iconClass="fi-free" title="Healing Music Library" desc="Sacred sound recordings, 432Hz tracks, Solfeggio frequencies, Mantra music. Full library free."/>
                  <Feat navigate={navigate} to="/meditations" icon={<IconMeditation/>} iconClass="fi-free" title="Meditation Library" desc="Guided meditations — morning rituals, chakra activations, Nidra, trauma release. All free."/>
                  <Feat navigate={navigate} to="/mantras" icon={<IconMantra/>} iconClass="fi-free" title="Mantra Library" desc="108 sacred mantras — Vedic, Tamil Siddha, Shakti, Shiva. Read, listen, receive the transmission."/>
                  <Feat navigate={navigate} to="/breathing" icon={<IconBreath/>} iconClass="fi-free" title="Thirumoolar Pranayama" desc="8-module breathing system from the Tamil Siddha tradition. Ancient breath science, free."/>
                  <Feat navigate={navigate} to="/siddha-portal" icon={<IconPortal/>} iconClass="fi-free" title="Siddha Portal — Education" desc="Core Siddha teachings, Ayurveda basics, Jyotish foundations (modules 1–6), Narasimha & Shiva courses."/>
                  <Feat navigate={navigate} to="/community" icon={<IconCommunity/>} iconClass="fi-free" title="Community Access" desc="Join the sangha. Post, connect, and receive transmissions from the community field."/>
                  <Feat navigate={navigate} to="/jyotish-vidya" icon={<IconJyotish/>} iconClass="fi-free" title="Jyotish Vidya — Foundations" desc="First 6 modules of the 32-module Vedic astrology curriculum. Understand your birth chart and dharma."/>
                </div>
              </TierSection>

              <TierSection id="prana" headerClass="prana-h" dotClass="dot-prana" name="Prana-Flow" price="€19 / month · Everything free, plus:" nameClass="prana-n">
                <div style={{display:'flex',flexDirection:'column',gap:2,padding:'10px 0 6px'}}>
                  <Feat navigate={navigate} to="/jyotish-vidya" icon={<IconBhrigu/>} iconClass="fi-prana" title="Bhrigu Oracle — Full Readings" desc="Complete Vedic birth chart readings. 5-section structured reading. 5 readings/hour."/>
                  <Feat navigate={navigate} to="/ayurveda" icon={<IconAyurveda/>} iconClass="fi-prana" title="Agastya Ayurveda Chat" desc="Live chat with Agastya Muni — personalised Ayurvedic guidance, dosha analysis, herb protocols. 5 messages/hour."/>
                  <Feat navigate={navigate} to="/jyotish-vidya" icon={<IconJyotish/>} iconClass="fi-prana" title="Jyotish Vidya — Extended" desc="Modules 1–14. Planetary periods, dashas, yogas, and nakshatra wisdom."/>
                  <Feat navigate={navigate} to="/siddha-portal" icon={<IconPortal/>} iconClass="fi-prana" title="Agastyar Academy Access" desc="108-module Siddha-Ayurvedic curriculum. Full structured learning path."/>
                </div>
              </TierSection>

              <TierSection id="siddha" headerClass="siddha-h" dotClass="dot-siddha" name="Siddha-Quantum" price="€45 / month · Everything in Prana-Flow, plus:" nameClass="siddha-n">
                <div style={{display:'flex',flexDirection:'column',gap:2,padding:'10px 0 6px'}}>
                  <Feat navigate={navigate} to="/quantum-apothecary" icon={<IconQA/>} iconClass="fi-siddha" title="Quantum Apothecary — SQI Oracle" desc="Full access to the 18 Siddha council oracle. The crown jewel of the platform. 10 messages/hour."/>
                  <Feat navigate={navigate} to="/soul-scan" icon={<IconSoulScan/>} iconClass="fi-siddha" title="Digital Nāḍī Scanner — Soul Scan" desc="Biometric camera scan. Maps 72,000 nāḍīs, HRV, dosha balance, and Anahata resonance. Saved to your Soul Vault."/>
                  <Feat navigate={navigate} icon={<IconSri/>} iconClass="fi-siddha" title="Sri Yantra EMF Shield" desc="Bio-field clearing and scalar wave protection tools for your living space and body field."/>
                  <Feat navigate={navigate} to="/jyotish-vidya" icon={<IconJyotish/>} iconClass="fi-siddha" title="Jyotish Vidya — Advanced" desc="Modules 1–22. Predictive techniques, Jaimini astrology, and advanced chart synthesis."/>
                </div>
              </TierSection>

              <TierSection id="akasha" headerClass="akasha-h" dotClass="dot-akasha" name="Akasha-Infinity ♾" price="€1,111 · One-time · Everything, forever" nameClass="akasha-n">
                <div style={{display:'flex',flexDirection:'column',gap:2,padding:'10px 0 6px'}}>
                  <Feat navigate={navigate} to="/quantum-apothecary" icon={<IconQA/>} iconClass="fi-akasha" title="Quantum Apothecary — Unlimited" desc="No limits. No hourly cap. The 18 Siddha council is always open."/>
                  <Feat navigate={navigate} to="/community" icon={<IconStargate/>} iconClass="fi-akasha" title="Stargate — Live Healing Sessions" desc="Weekly live transmission calls with Kritagya and Laila. Bhagavad Gita classes, healing chambers. All recordings saved."/>
                  <Feat navigate={navigate} icon={<IconVirtual/>} iconClass="fi-akasha" title="Virtual Pilgrimage — 40 Sacred Sites" desc="Daily transmissions from Arunachala, Kashi, Tiruvannamalai, Machu Picchu, and 36 more."/>
                  <Feat navigate={navigate} to="/jyotish-vidya" icon={<IconJyotish/>} iconClass="fi-akasha" title="All 32 Jyotish Modules + Akashic Codex" desc="Complete Vedic astrology mastery plus the Living Akashic Book system."/>
                  <Feat navigate={navigate} icon={<IconCert/>} iconClass="fi-akasha" title="Practitioner Certification" desc="12-month Siddha Healer programme. All 18 Siddha master profiles, complete curriculum, certification."/>
                  <Feat navigate={navigate} icon={<IconInfinity/>} iconClass="fi-akasha" title="All Future Features · Lifetime Updates" desc="Everything we build in 2025, 2026, 2050 — yours. One sacred investment, infinite access."/>
                </div>
              </TierSection>

              {/* Watch video row */}
              <div onClick={() => openModal('how')} style={{margin:'8px 16px 0',background:'rgba(212,175,55,.04)',border:'1px solid rgba(212,175,55,.16)',borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'all .25s'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#D4AF37,#8B6914)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 16px rgba(212,175,55,.4)',animation:'playGlow 3s ease-in-out infinite'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#050505"><polygon points="5,3 19,12 5,21"/></svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.82)'}}>Watch: Full app walkthrough</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.28)',marginTop:2}}>English & Swedish · 2.5 minutes</div>
                </div>
                <div style={{fontSize:16,color:'rgba(212,175,55,.35)'}}>›</div>
              </div>

              <div style={{height:40}} />
            </>
          );
        })()}
      </div>

      <VideoModal open={modal.open} title={modal.title} desc={modal.desc} onClose={() => setModal(m=>({...m,open:false}))} />
    </div>
  );
}
