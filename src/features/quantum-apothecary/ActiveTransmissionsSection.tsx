// ActiveTransmissionsSection — SQI 2050 Organic
// daysRemaining(act.expiresAt) — Wellness=21d, others=8d, null=permanent
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, X } from 'lucide-react';
import type { Activation } from '@/features/quantum-apothecary/types';
import { daysRemaining, formatSourceLabel } from '@/features/quantum-apothecary/apothecarySqiUi';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  activeTransmissions: Activation[];
  setActiveTransmissions: React.Dispatch<React.SetStateAction<Activation[]>>;
  onDissolveTransmission?: (id: string) => void;
}

function TxCanvas({ wrapRef }: { wrapRef: React.RefObject<HTMLDivElement> }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let t = 0;
    const resize = () => { canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const waves = [
      { amp:.18, freq:3.5, speed:.7,  alpha:.06, lw:.9 },
      { amp:.12, freq:6,   speed:1.3, alpha:.04, lw:.7 },
      { amp:.08, freq:10,  speed:1.9, alpha:.03, lw:.6 },
      { amp:.22, freq:2.2, speed:.45, alpha:.04, lw:1.1 },
    ];
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0,0,W,H);
      const pulse = .5 + .5 * Math.sin(t);
      const gc = ctx.createRadialGradient(W*.5,H*.55,0,W*.5,H*.55,W*.6);
      gc.addColorStop(0, `rgba(212,175,55,${.04+.025*pulse})`);
      gc.addColorStop(1, 'transparent');
      ctx.fillStyle = gc; ctx.fillRect(0,0,W,H);
      waves.forEach((w,wi) => {
        const phase = (wi/waves.length)*Math.PI*2;
        ctx.beginPath();
        for (let x=0;x<=W;x+=1.5) {
          const nx=x/W, env=Math.sin(nx*Math.PI)*.7+.3;
          const y=H*.65+Math.sin(nx*w.freq*Math.PI*2+t*w.speed+phase)*H*w.amp*env;
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.strokeStyle=`rgba(212,175,55,${w.alpha})`; ctx.lineWidth=w.lw; ctx.stroke();
      });
      t+=.010; rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  },[]);
  return <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0,borderRadius:32 }} />;
}

export default function ActiveTransmissionsSection({ activeTransmissions, setActiveTransmissions, onDissolveTransmission }: Props) {
  const { t } = useTranslation();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapRef} style={{ position:'relative', filter:'drop-shadow(0 0 24px rgba(212,175,55,0.10))' }}>
      <style>{`
        @keyframes txHalo{0%,100%{opacity:0.3;transform:scale(1);}50%{opacity:0;transform:scale(1.9);}}
        @keyframes txLiveDot{0%,100%{opacity:1;}50%{opacity:0.35;}}
        @keyframes txShimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
      `}</style>

      <TxCanvas wrapRef={wrapRef} />

      <div style={{ position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <Zap size={14} style={{ color:'#D4AF37', filter:'drop-shadow(0 0 4px rgba(212,175,55,0.7))' }} />
            <h2 style={{ fontSize:13, fontWeight:900, letterSpacing:'-0.02em', background:'linear-gradient(135deg,#D4AF37,#F5E17A,#D4AF37)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', animation:'txShimmer 4s linear infinite' }}>
              {t('quantumApothecary.activeTransmissionsSection.title')}
            </h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:100, border:'1px solid rgba(212,175,55,0.28)', background:'rgba(212,175,55,0.06)' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 5px #D4AF37', animation:'txLiveDot 1.8s ease-in-out infinite' }} />
            <span style={{ fontSize:7, fontWeight:900, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.8)' }}>
              {t('quantumApothecary.activeTransmissionsSection.live247')}
            </span>
          </div>
        </div>

        {/* Unified organic container */}
        <div style={{ background:'rgba(212,175,55,0.025)', borderRadius:22, border:'1px solid rgba(212,175,55,0.10)', overflow:'hidden', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
          {activeTransmissions.length === 0 ? (
            <div style={{ padding:'28px 20px', textAlign:'center' }}>
              <ShieldCheck size={22} style={{ margin:'0 auto 10px', color:'rgba(255,255,255,0.10)', display:'block' }} />
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.18)' }}>
                {t('quantumApothecary.activeTransmissionsSection.noActive')}
              </p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.12)', marginTop:4 }}>
                {t('quantumApothecary.activeTransmissionsSection.selectHint')}
              </p>
            </div>
          ) : (
            <div style={{ maxHeight:300, overflowY:'auto', scrollbarWidth:'none' }}>
              <AnimatePresence>
                {activeTransmissions.map((act, idx) => {
                  const c = act.color || '#D4AF37';
                  // ✅ Correct calls: pass act.expiresAt and act.source
                  const days = daysRemaining(act.expiresAt);
                  const src = formatSourceLabel(act.source);
                  const isLast = idx === activeTransmissions.length - 1;
                  // Urgent if ≤3 days left
                  const urgent = days !== null && days <= 3;

                  return (
                    <motion.div
                      key={act.id ?? act.name}
                      initial={{ opacity:0, y:-6 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:6 }}
                      transition={{ duration:0.2 }}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', position:'relative' }}
                    >
                      {/* Thin divider */}
                      {!isLast && (
                        <div style={{ position:'absolute', bottom:0, left:14, right:14, height:1, background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.10),transparent)' }} />
                      )}

                      {/* Glowing dot + halo */}
                      <div style={{ position:'relative', width:14, height:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 7px ${c}, 0 0 14px ${c}60` }} />
                        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`1px solid ${c}`, animation:'txHalo 2.5s ease-in-out infinite' }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.92)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, lineHeight:1.3 }}>
                          {act.name}
                        </p>
                        <p style={{ fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.30)', marginTop:2 }}>
                          {act.type}{src ? ` · ${src}` : ''}
                        </p>

                        {/* Badge row: 24/7 + days or permanent */}
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                          <span style={{ fontSize:7, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:c, background:`${c}18`, padding:'2px 7px', borderRadius:5 }}>
                            Transmitting 24/7
                          </span>

                          {days !== null ? (
                            /* Days remaining pill — amber if urgent */
                            <span style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, background: urgent ? 'rgba(251,146,60,0.12)' : 'rgba(212,175,55,0.10)', border: `1px solid ${urgent ? 'rgba(251,146,60,0.28)' : 'rgba(212,175,55,0.22)'}` }}>
                              <span style={{ fontSize:9, fontWeight:900, color: urgent ? '#FB923C' : '#D4AF37' }}>{days}</span>
                              <span style={{ fontSize:7, fontWeight:700, color: urgent ? 'rgba(251,146,60,0.7)' : 'rgba(212,175,55,0.6)', letterSpacing:'0.05em' }}>days left</span>
                            </span>
                          ) : (
                            /* Permanent */
                            <span style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                              <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>∞</span>
                              <span style={{ fontSize:7, fontWeight:700, color:'rgba(255,255,255,0.22)', letterSpacing:'0.05em' }}>Permanent</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dissolve X */}
                      <button
                        type="button"
                        onClick={() => onDissolveTransmission ? onDissolveTransmission(act.id ?? act.name) : setActiveTransmissions(p => p.filter(x => x.id !== act.id))}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.22)', cursor:'pointer', flexShrink:0 }}
                      >
                        <X size={11} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
