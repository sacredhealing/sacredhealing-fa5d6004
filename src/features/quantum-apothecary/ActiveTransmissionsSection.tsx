// ╔══════════════════════════════════════════════════════════════════╗
// ║  ActiveTransmissionsSection-SQI2050.tsx                        ║
// ║  → src/features/quantum-apothecary/ActiveTransmissionsSection.tsx ║
// ║  Scalar wave canvas + per-frequency color + gold aura          ║
// ╚══════════════════════════════════════════════════════════════════╝
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

/** Canvas scalar waves + breathing gold glow behind the transmission box */
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
      { amp:.22, freq:4,   speed:.8,  alpha:.07, lw:1.0 },
      { amp:.15, freq:7,   speed:1.4, alpha:.05, lw:.75 },
      { amp:.12, freq:11,  speed:2.0, alpha:.04, lw:.65 },
      { amp:.28, freq:2.8, speed:.55, alpha:.05, lw:1.3 },
      { amp:.09, freq:17,  speed:2.7, alpha:.03, lw:.55 },
    ];
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      const pulse = .5 + .5 * Math.sin(t * 1.1);
      const gc = ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.65);
      gc.addColorStop(0, `rgba(212,175,55,${.06+.04*pulse})`);
      gc.addColorStop(1, 'transparent');
      ctx.fillStyle = gc; ctx.fillRect(0,0,W,H);
      const gt = ctx.createLinearGradient(0,0,0,H*.3);
      gt.addColorStop(0, `rgba(212,175,55,${.10+.05*pulse})`);
      gt.addColorStop(1, 'transparent');
      ctx.fillStyle = gt; ctx.fillRect(0,0,W,H);
      waves.forEach((w, wi) => {
        const phase = (wi / waves.length) * Math.PI * 2;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 1.5) {
          const nx = x/W, env = Math.sin(nx*Math.PI)*.8+.2;
          const y = H*.5 + Math.sin(nx*w.freq*Math.PI*2 + t*w.speed + phase) * H*w.amp*env;
          x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = `rgba(212,175,55,${w.alpha})`; ctx.lineWidth = w.lw; ctx.stroke();
      });
      t += .012;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />
  );
}

export default function ActiveTransmissionsSection({
  activeTransmissions,
  setActiveTransmissions,
  onDissolveTransmission,
}: Props) {
  const { t } = useTranslation();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        borderRadius: 28,
        overflow: 'hidden',
        animation: 'txAura 4s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes txAura {
          0%,100% { box-shadow: 0 0 0 1px rgba(212,175,55,0.26), 0 0 16px rgba(212,175,55,0.14), 0 0 44px rgba(212,175,55,0.08); }
          50%     { box-shadow: 0 0 0 1px rgba(212,175,55,0.42), 0 0 28px rgba(212,175,55,0.24), 0 0 66px rgba(212,175,55,0.14); }
        }
        @keyframes txDotRing {
          0%,100% { opacity:0.5; transform:scale(1); }
          50%     { opacity:0;   transform:scale(1.9); }
        }
        @keyframes txLiveDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.65); }
        }
        @keyframes txZap {
          0%,100% { opacity:1; }
          50%     { opacity:0.55; }
        }
      `}</style>

      <TxCanvas wrapRef={wrapRef} />

      {/* Glass layer */}
      <div style={{ position:'relative', zIndex:1, background:'rgba(10,8,3,0.80)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 18px 13px', borderBottom: activeTransmissions.length > 0 ? '1px solid rgba(212,175,55,0.12)' : 'none', background:'linear-gradient(90deg,rgba(212,175,55,0.07),rgba(212,175,55,0.02))' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Zap size={15} style={{ color:'#D4AF37', filter:'drop-shadow(0 0 5px rgba(212,175,55,0.8))', animation:'txZap 2s ease-in-out infinite' }} />
            <h2 className="sqi-master-name-shimmer" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:900, letterSpacing:'-0.03em' }}>
              {t('quantumApothecary.activeTransmissionsSection.title')}
            </h2>
          </div>
          {/* 24/7 LIVE — gold */}
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:100, border:'1px solid rgba(212,175,55,0.38)', background:'rgba(212,175,55,0.08)', boxShadow:'0 0 10px rgba(212,175,55,0.18),inset 0 0 8px rgba(212,175,55,0.05)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 6px #D4AF37,0 0 12px rgba(212,175,55,0.6)', animation:'txLiveDot 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize:8, fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.9)' }}>
              {t('quantumApothecary.activeTransmissionsSection.live247')}
            </span>
          </div>
        </div>

        {/* Transmissions list */}
        <div style={{ padding: activeTransmissions.length > 0 ? '12px 14px 14px' : '0', maxHeight:260, overflowY:'auto', scrollbarWidth:'thin', display:'flex', flexDirection:'column', gap:8 }}>
          {activeTransmissions.length === 0 ? (
            <div style={{ padding:'28px 20px', textAlign:'center' }}>
              <ShieldCheck size={24} style={{ margin:'0 auto 10px', color:'rgba(255,255,255,0.1)', display:'block' }} />
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.2)' }}>
                {t('quantumApothecary.activeTransmissionsSection.noActive')}
              </p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.15)', marginTop:4 }}>
                {t('quantumApothecary.activeTransmissionsSection.selectHint')}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {activeTransmissions.map(act => {
                const c = act.color || '#D4AF37';
                const days = daysRemaining(act);
                const src = formatSourceLabel(act);
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity:0, x:-10 }}
                    animate={{ opacity:1, x:0 }}
                    exit={{ opacity:0, x:10, height:0 }}
                    style={{
                      position:'relative',
                      display:'flex', alignItems:'center', gap:10,
                      padding:'11px 12px',
                      borderRadius:16,
                      overflow:'hidden',
                      border:`1px solid ${c}38`,
                      background:`${c}0d`,
                      boxShadow:`0 0 14px ${c}18, inset 0 0 16px ${c}08`,
                    }}
                  >
                    {/* Left color line */}
                    <div style={{ position:'absolute', left:0, top:'15%', height:'70%', width:2, background:`linear-gradient(180deg,transparent,${c},transparent)`, borderRadius:2 }} />

                    {/* Pulsing dot */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:c, boxShadow:`0 0 8px ${c}, 0 0 16px ${c}80` }} />
                      <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:`1px solid ${c}`, animation:'txDotRing 2s ease-in-out infinite' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.95)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>
                        {act.name}
                      </p>
                      <p style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.38)', marginTop:3 }}>
                        {act.type}{src ? ` · ${src}` : ''}{days !== null ? ` · ${days}d left` : ''}
                      </p>
                      <p style={{ fontSize:8, fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:c, marginTop:4, opacity:0.85 }}>
                        Transmitting 24/7
                      </p>
                    </div>

                    {/* Dissolve */}
                    <button
                      type="button"
                      onClick={() => onDissolveTransmission ? onDissolveTransmission(act.id ?? act.name) : setActiveTransmissions(p => p.filter(x => x.id !== act.id))}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:26, height:26, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.3)', cursor:'pointer', flexShrink:0 }}
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

      </div>
    </div>
  );
}
