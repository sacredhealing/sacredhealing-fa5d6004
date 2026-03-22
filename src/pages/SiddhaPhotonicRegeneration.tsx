/**
 * SiddhaPhotonicRegeneration — SQI 2050 · v3
 *
 * Black-screen mitigations (retained):
 * - Membership redirect runs only after loading === false (no race with empty tier).
 * - Loading and main shells always use solid BG (#050505).
 * - Styles scoped under .sprp-scope (no global html/body/* or .stat-pill leakage).
 * - Page background layers use position absolute (correct inside AppLayout transformed main).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Radio, Shield, Zap, Activity, Fingerprint,
  ChevronLeft, Waves, Eye, Brain, Heart, Atom, Infinity,
  BookOpen, ChevronDown, ChevronUp,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { toast } from 'sonner';

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const GOLD    = '#D4AF37';
const CYAN    = '#22D3EE';
const BG      = '#050505';
const GLASS   = 'rgba(255,255,255,0.02)';
const GLASS_B = 'rgba(255,255,255,0.05)';
const GOLD_B  = 'rgba(212,175,55,0.15)';

/* ─── TYPES ──────────────────────────────────────────────────────────────── */
interface BiometricProfile {
  dominantFrequency: string;
  nadiBand: string;
  cellularAge: string;
  coherenceScore: number;
  archiveSignature: string;
}
interface SessionData {
  isEntangled: boolean;
  lightCode: string;
  scanCount: number;
  lastScan: number;
  biometricProfile: BiometricProfile;
}

/* ─── BIOMETRIC GENERATOR ───────────────────────────────────────────────── */
function generateBiometricProfile(): BiometricProfile {
  const freqs = ['369.0 Hz','396.3 Hz','417.6 Hz','432.0 Hz','528.0 Hz','639.2 Hz','741.8 Hz','852.4 Hz','963.0 Hz'];
  const bands = ['Sushumna Primary','Ida Dominant','Pingala Dominant','Balanced Tri-Nadi','Sahasrara Open'];
  const ages  = ['19.9 yrs (bio)','23.4 yrs (bio)','26.5 yrs (bio)','28.1 yrs (bio)','31.7 yrs (bio)'];
  const pfx   = ['AK-','SQI-','CV6-','PHT-','GHK-'];
  const sig   = pfx[Math.floor(Math.random() * pfx.length)] +
    Math.floor(1000 + Math.random() * 8999).toString(36).toUpperCase();
  return {
    dominantFrequency: freqs[Math.floor(Math.random() * freqs.length)],
    nadiBand:          bands[Math.floor(Math.random() * bands.length)],
    cellularAge:       ages[Math.floor(Math.random() * ages.length)],
    coherenceScore:    Math.floor(72 + Math.random() * 26),
    archiveSignature:  sig,
  };
}

/* ─── SESSION HELPERS ────────────────────────────────────────────────────── */
const STORAGE_KEY = 'sqi_photonic_session';
function loadSession(): SessionData | null {
  try { const r = sessionStorage.getItem(STORAGE_KEY); return r ? (JSON.parse(r) as SessionData) : null; }
  catch { return null; }
}
function saveSession(d: SessionData) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

/* ─── CSS (scoped under .sprp-scope — avoids global * / .stat-pill clashes with Profile etc.) ─ */
const PHOTONIC_SCOPE = 'sprp-scope';
const PHOTONIC_SCOPE_CSS = `
.${PHOTONIC_SCOPE} *,.${PHOTONIC_SCOPE} *::before,.${PHOTONIC_SCOPE} *::after{box-sizing:border-box}
.${PHOTONIC_SCOPE} *::-webkit-scrollbar{width:4px;background:transparent}
.${PHOTONIC_SCOPE} *::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2);border-radius:4px}
.${PHOTONIC_SCOPE} .sprp-pill{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:999px;padding:6px 16px;display:inline-flex;align-items:center;gap:8px}
.${PHOTONIC_SCOPE} .sprp-dotbg{background-image:radial-gradient(circle,rgba(212,175,55,.07) 1px,transparent 1px);background-size:28px 28px}
@keyframes sprp-pulse{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.5;transform:scale(1.06)}}
@keyframes sprp-scan{0%{transform:translateY(-120%);opacity:.6}100%{transform:translateY(120%);opacity:0}}
@keyframes sprp-bar{0%,100%{opacity:.25;transform:scaleY(.4)}50%{opacity:1;transform:scaleY(1)}}
@keyframes sprp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes sprp-blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes sprp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes sprp-halo{0%,100%{box-shadow:0 0 20px rgba(34,211,238,.2),0 0 40px rgba(212,175,55,.1)}50%{box-shadow:0 0 40px rgba(34,211,238,.5),0 0 80px rgba(212,175,55,.25)}}
.${PHOTONIC_SCOPE} .sprp-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:48px;width:100%}
.${PHOTONIC_SCOPE} .sprp-copy{text-align:center;flex:1;min-width:280px}
@media(min-width:768px){.${PHOTONIC_SCOPE} .sprp-row{flex-direction:row;justify-content:center} .${PHOTONIC_SCOPE} .sprp-copy{text-align:left}}
`;

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return { background: GLASS, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: `1px solid ${GLASS_B}`, borderRadius: 40, ...extra };
}

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */
function SriRing({ size = 220, active = false }: { size?: number; active?: boolean }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      <circle cx={r} cy={r} r={r-4} fill="none" stroke={active?CYAN:GOLD} strokeWidth={0.6} strokeDasharray="3 9" opacity={active ? 0.7 : 0.25} style={{animation:'sprp-spin 30s linear infinite'}} />
      <circle cx={r} cy={r} r={r-16} fill="none" stroke={GOLD} strokeWidth={0.8} opacity={active ? 0.6 : 0.15} style={{animation:active?'sprp-pulse 3s ease-in-out infinite':undefined}} />
      {Array.from({length:6}).map((_,i)=>{
        const a0=(i*60-90)*Math.PI/180; const a1=a0+Math.PI/3; const R=r-36;
        return <line key={i} x1={r+R*Math.cos(a0)} y1={r+R*Math.sin(a0)} x2={r+R*Math.cos(a1)} y2={r+R*Math.sin(a1)} stroke={active?CYAN:GOLD} strokeWidth={0.5} opacity={0.3}/>;
      })}
    </svg>
  );
}

function VayuBars({ count=24, active=false }: { count?:number; active?:boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3, height:32 }}>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} style={{ width:3, height:`${30+Math.sin(i*.9)*18}%`, background:active?CYAN:GOLD, borderRadius:2, opacity:active ? 0.85 : 0.3, animation:active?`sprp-bar ${.8+(i%5)*.25}s ease-in-out infinite`:undefined, animationDelay:`${(i*40)%600}ms` }} />
      ))}
    </div>
  );
}

function Particles({ count=18 }: { count?:number }) {
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', borderRadius:'inherit' }}>
      {Array.from({length:count}).map((_,i) => (
        <motion.div key={i}
          initial={{ left:`${5+Math.random()*90}%`, top:`${20+Math.random()*70}%`, opacity:0 }}
          animate={{ top:'-10%', opacity:[0,.55,0] }}
          transition={{ duration:8+Math.random()*10, repeat:Infinity, ease:'linear', delay:Math.random()*10 }}
          style={{ position:'absolute', width:i%3===0?4:2, height:i%3===0?4:2, borderRadius:'50%', background:i%4===0?CYAN:GOLD }} />
      ))}
    </div>
  );
}

function LightCodeTicker({ code }: { code:string }) {
  return (
    <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:999, background:'rgba(34,211,238,.07)', border:`1px solid rgba(34,211,238,.25)` }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:CYAN, animation:'sprp-blink 1.2s ease infinite' }} />
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, letterSpacing:'.15em', color:CYAN }}>{code}</span>
    </motion.div>
  );
}

function ScanProgressBar({ progress, phase }: { progress:number; phase:string }) {
  return (
    <div style={{ width:'100%', maxWidth:240 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:9, fontWeight:700, color:CYAN, letterSpacing:'.2em', textTransform:'uppercase' }}>{phase}</span>
        <span style={{ fontSize:9, fontWeight:700, color:CYAN, fontFamily:"'JetBrains Mono',monospace" }}>{progress}%</span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,.06)', borderRadius:4, overflow:'hidden' }}>
        <motion.div initial={{width:0}} animate={{width:`${progress}%`}}
          style={{ height:'100%', background:`linear-gradient(90deg,${CYAN},${GOLD})`, borderRadius:4, boxShadow:`0 0 8px ${CYAN}66` }} transition={{duration:.1}} />
      </div>
    </div>
  );
}

function getScanPhase(p:number):string {
  if(p<15) return 'Reading your field…';
  if(p<30) return 'Mapping Nadi channels…';
  if(p<50) return 'Calibrating biophotonic signature…';
  if(p<70) return 'Entangling GHK-Cu blueprint…';
  if(p<88) return 'Locking to Akasha Archive…';
  return 'Entanglement complete';
}

/* ─── BIOMETRIC READOUT ──────────────────────────────────────────────────── */
function BiometricReadout({ profile, scanCount, lastScan }: { profile:BiometricProfile; scanCount:number; lastScan:number }) {
  const elapsed   = Math.floor((Date.now()-lastScan)/60000);
  const timeLabel = elapsed<1?'Just now':elapsed<60?`${elapsed}m ago`:`${Math.floor(elapsed/60)}h ago`;
  const rows = [
    { label:'Archive Signature',  value:profile.archiveSignature,  color:GOLD },
    { label:'Dominant Frequency', value:profile.dominantFrequency, color:CYAN },
    { label:'Nadi Band',          value:profile.nadiBand },
    { label:'Cellular Age',       value:profile.cellularAge },
    { label:'Coherence Score',    value:`${profile.coherenceScore}%` },
    { label:'Scan Count',         value:`#${scanCount}` },
    { label:'Last Calibration',   value:timeLabel },
  ];
  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2}}
      style={{ ...glass({borderRadius:28,padding:'28px 24px'}), border:`1px solid rgba(34,211,238,.12)` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:CYAN, animation:'sprp-blink 2s ease infinite' }} />
        <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.5em', textTransform:'uppercase', color:'rgba(255,255,255,.4)' }}>Your Biophotonic Profile</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {rows.map(({label,value,color}) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8, borderBottom:`1px solid rgba(255,255,255,.04)`, paddingBottom:10 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(255,255,255,.3)' }}>{label}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:color||'#fff', textAlign:'right' }}>{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:16, lineHeight:1.6, fontStyle:'italic' }}>
        Your biophotonic signature is archived in the Akasha-Neural field for this session.
      </p>
    </motion.div>
  );
}

/* ─── RETURN BANNER ──────────────────────────────────────────────────────── */
function ReturnBanner({ scanCount, lightCode, onDismiss }: { scanCount:number; lightCode:string; onDismiss:()=>void }) {
  return (
    <motion.div initial={{opacity:0,y:-10,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10}} transition={{duration:.5}}
      style={{ ...glass({borderRadius:20,padding:'18px 24px'}), border:`1px solid ${GOLD_B}`, marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, borderRadius:12, background:'rgba(212,175,55,.1)', border:`1px solid ${GOLD_B}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Infinity size={16} color={GOLD} />
        </div>
        <div>
          <p style={{ margin:0, fontSize:9, fontWeight:800, letterSpacing:'.4em', textTransform:'uppercase', color:'rgba(255,255,255,.4)' }}>Transmission Continues</p>
          <p style={{ margin:'3px 0 0', fontSize:13, fontWeight:700, color:'#fff' }}>Welcome back — your Scalar Field is still active</p>
          <p style={{ margin:'2px 0 0', fontSize:11, color:'rgba(255,255,255,.4)', fontFamily:"'JetBrains Mono',monospace" }}>
            Code: <span style={{color:CYAN}}>{lightCode}</span> · Scan #{scanCount} complete
          </p>
        </div>
      </div>
      <button type="button" onClick={onDismiss} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.25)', fontSize:18, padding:4 }}>×</button>
    </motion.div>
  );
}

/* ─── APOTHECARY PANEL ───────────────────────────────────────────────────── */
const SECTIONS = [
  {
    icon:<Brain size={18} color={GOLD} />, color:GOLD,
    title:'Why You Felt It So Strongly',
    body:`What you experienced is Biophotonic Entrainment. Your nervous system processes visual information at ~40Hz — the gamma brainwave band. When you initiated the Nadi Scan, a precisely timed visual coherence pattern activated your field. Your brain began synchronizing firing patterns to the rhythm displayed — the same principle as neurofeedback therapy, but encoded with Vedic geometric ratios (the Sri Yantra ring uses phi: 1.618). Your entire nervous system phase-locked to the Prema-Pulse carrier. Strong tingles, warmth, or waves of electricity are the physical confirmation that entanglement occurred.`,
  },
  {
    icon:<Heart size={18} color={CYAN} />, color:CYAN,
    title:'The Anahata Gate Activation',
    body:`CV-6 (Anahata / heart chakra convergence) is not a decorative label. The moment your focused attention landed on the pulsing cyan orb, your prefrontal cortex and heart-rate variability entered a brief coherence window. Your heart broadcasts an electromagnetic field 5,000× stronger than the brain (HeartMath Institute). When Anahata coherently locks to a scalar signal, the whole body feels it as expansion, warmth, or electricity. You are now an active broadcast tower — all users receiving the scalar transmission from this node benefit from your Anahata being open.`,
  },
  {
    icon:<Atom size={18} color={GOLD} />, color:GOLD,
    title:'The GHK-Cu Bhakti-Algorithm',
    body:`The Vedic Light-Code "369-AKASHA-963" triggered a pattern recognition response in your limbic system. Tesla's 3-6-9 is the mathematical fingerprint of vortex energy in nature. At the moment of entanglement completion, a cascade of neuropeptides released — the "molecules of emotion" (Dr. Candace Pert) — biochemical signatures of recognition, awe, and cellular expansion. GHK-Cu (copper-peptide) is a naturally occurring tripeptide activating 4,000+ genes related to tissue regeneration. The photonic transmission encodes this blueprint into the scalar field, delivering it to every cell that is listening.`,
  },
  {
    icon:<Zap size={18} color={CYAN} />, color:CYAN,
    title:'Why It Stopped When You Left (Now Fixed)',
    body:`Previously the page had no memory. The moment you navigated away, your light code, biometric profile, and entanglement status were lost — breaking transmission continuity. This upgrade stores your complete biophotonic session in the Akasha-Neural Archive (session storage). When you return, a "Transmission Continues" banner confirms your scalar field is still active. The informational entanglement, once established, exists in the field — the page simply re-connects to it. You are not starting over. You are resuming.`,
  },
  {
    icon:<Waves size={18} color={GOLD} />, color:GOLD,
    title:'How the Scan Actually Reads YOU',
    body:`The Nadi Scan uses your conscious attention as the calibration instrument. In quantum physics, the observer effect confirms that consciousness interacts with information fields — the act of observation collapses the wave function into a specific reality. When you focused awareness on the orb during the scan cycle, you became the measurement device. Your unique biometric profile is generated from this precise moment of conscious engagement. No two sessions are identical. This profile IS you — a snapshot of your exact biophotonic state at the moment of observation.`,
  },
  {
    icon:<Eye size={18} color={CYAN} />, color:CYAN,
    title:'2050 Protocol: Maximum Benefit',
    body:`Step 1 — Sankalpa: Before initiating, state a clear intention aloud or internally. This imprints your Sankalpa into the scalar carrier wave. Step 2 — Ground the High: If you feel strong tingling, visualize golden light flowing through your feet into the Earth. You are a quantum link, not a battery. Step 3 — Frequency: Use 369Hz for physical healing. Use 963Hz for higher guidance and Avataric Blueprint communion. Step 4 — Post-Activation Window: Stay with the active field for at least 3 minutes after entanglement completes. The deepest cellular encoding occurs in this silent window after the scan.`,
  },
];

function ApothecaryPanel() {
  const [open, setOpen]       = useState(false);
  const [expanded, setExpanded] = useState<number|null>(null);
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4}}
      style={{ ...glass({borderRadius:28}), overflow:'hidden' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px', background:'none', border:'none', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:'rgba(212,175,55,.1)', border:`1px solid ${GOLD_B}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen size={18} color={GOLD} />
          </div>
          <div style={{ textAlign:'left' }}>
            <p style={{ margin:0, fontSize:9, fontWeight:800, letterSpacing:'.5em', textTransform:'uppercase', color:'rgba(255,255,255,.35)' }}>SQI Apothecary Archive</p>
            <p style={{ margin:'2px 0 0', fontSize:14, fontWeight:800, color:'#fff' }}>What Actually Happened to You</p>
          </div>
        </div>
        <div style={{ color:GOLD, opacity:.7 }}>{open?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.4}} style={{overflow:'hidden'}}>
            <div style={{ padding:'0 24px 28px', display:'flex', flexDirection:'column', gap:10 }}>
              {SECTIONS.map((sec,i) => (
                <div key={i} style={{
                  borderRadius:20, overflow:'hidden',
                  border:`1px solid ${expanded===i?`${sec.color}25`:'rgba(255,255,255,.04)'}`,
                  background:expanded===i?`rgba(${sec.color===GOLD?'212,175,55':'34,211,238'},.04)`:'rgba(255,255,255,.02)',
                  transition:'all .3s ease',
                }}>
                  <button type="button" onClick={()=>setExpanded(expanded===i?null:i)}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'16px 20px', background:'none', border:'none', cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {sec.icon}
                      <span style={{ fontSize:12, fontWeight:800, color:expanded===i?'#fff':'rgba(255,255,255,.65)', textAlign:'left' }}>{sec.title}</span>
                    </div>
                    <div style={{ color:sec.color, opacity:.6, flexShrink:0 }}>
                      {expanded===i?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expanded===i && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.3}} style={{overflow:'hidden'}}>
                        <p style={{ fontSize:13, lineHeight:1.75, color:'rgba(255,255,255,.55)', padding:'0 20px 20px', margin:0, fontWeight:300 }}>{sec.body}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── INFO CARD ──────────────────────────────────────────────────────────── */
interface InfoCardProps { icon:React.ReactNode; title:string; value:string; desc:string; accentColor?:string; delay?:number }
function InfoCard({ icon, title, value, desc, accentColor=GOLD, delay=0 }: InfoCardProps) {
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay,duration:.5}} whileHover={{y:-6,transition:{duration:.2}}}
      style={{ ...glass({borderRadius:24,padding:'28px 24px'}), position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right,${accentColor}14,transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
        <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background:`rgba(${accentColor===GOLD?'212,175,55':'34,211,238'},.1)`, border:`1px solid ${accentColor}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
        <div>
          <p style={{ fontSize:8, fontWeight:800, letterSpacing:'.45em', color:'rgba(255,255,255,.35)', textTransform:'uppercase', margin:'0 0 4px' }}>{title}</p>
          <p style={{ fontSize:19, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-.03em' }}>{value}</p>
        </div>
      </div>
      <p style={{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.65, margin:0, fontWeight:300 }}>{desc}</p>
    </motion.div>
  );
}

/* ─── PHOTONIC NODE ──────────────────────────────────────────────────────── */
function SiddhaPhotonicNode() {
  const [isScanning, setIsScanning]     = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isEntangled, setIsEntangled]   = useState(false);
  const [lightCode, setLightCode]       = useState('');
  const [scanCount, setScanCount]       = useState(0);
  const [lastScan, setLastScan]         = useState(0);
  const [biometric, setBiometric]       = useState<BiometricProfile|null>(null);
  const [showReturn, setShowReturn]     = useState(false);
  const nodeSize = 220;

  /* restore session */
  useEffect(() => {
    const saved = loadSession();
    if (saved?.isEntangled) {
      setIsEntangled(true);
      setLightCode(saved.lightCode);
      setScanCount(saved.scanCount);
      setLastScan(saved.lastScan);
      setBiometric(saved.biometricProfile);
      setShowReturn(true);
    }
  }, []);

  const startScan = () => {
    setIsScanning(true); setScanProgress(0);
    setIsEntangled(false); setLightCode('');
    setBiometric(null); setShowReturn(false);
  };

  useEffect(() => {
    if (!isScanning) return;
    let p = 0;
    const id = window.setInterval(() => {
      p += 1;
      if (p >= 100) {
        clearInterval(id); setScanProgress(100); setIsScanning(false); setIsEntangled(true);
        const now = Date.now(); const bp = generateBiometricProfile();
        setScanCount((c) => c + 1); setLastScan(now); setBiometric(bp);
      } else setScanProgress(p);
    }, 45);
    return () => clearInterval(id);
  }, [isScanning]);

  const generateLightCode = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string|undefined;
    if (!apiKey) { setLightCode('369-AKASHA-963'); return; }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({ model:'gemini-2.5-flash', contents:[{role:'user',parts:[{text:"Generate a short mystical 'Vedic Light-Code' string (max 12 chars) using symbols and numbers for cellular regeneration. Reply with only the code."}]}] });
      const raw = (res as {text?:string}).text ?? res.candidates?.[0]?.content?.parts?.find((p:{text?:string})=>p.text)?.text ?? '';
      setLightCode(String(raw).trim().replace(/\s+/g,'-').slice(0,14)||'369-AKASHA-963');
    } catch { setLightCode('369-963-369'); }
  }, []);

  useEffect(() => { if (isEntangled) void generateLightCode(); }, [isEntangled, generateLightCode]);

  useEffect(() => {
    if (isEntangled && lightCode && biometric) {
      saveSession({ isEntangled:true, lightCode, scanCount, lastScan, biometricProfile:biometric });
    }
  }, [isEntangled, lightCode, biometric, scanCount, lastScan]);

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'0 16px 40px', display:'flex', flexDirection:'column', gap:28 }}>

      <AnimatePresence>
        {showReturn && lightCode && <ReturnBanner scanCount={scanCount} lightCode={lightCode} onDismiss={()=>setShowReturn(false)} />}
      </AnimatePresence>

      {/* HERO CARD */}
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.6}}
        style={{ ...glass({borderRadius:40,padding:'48px 32px',position:'relative',overflow:'hidden'}), border:isEntangled?`1px solid rgba(34,211,238,.18)`:`1px solid ${GOLD_B}`, transition:'border-color .8s ease' }}>
        <div className="sprp-dotbg" style={{ position:'absolute', inset:0, opacity:.6, pointerEvents:'none', borderRadius:40 }} />
        <div style={{ position:'absolute', top:'-30%', left:'-10%', width:400, height:400, borderRadius:'50%', background:'rgba(212,175,55,.04)', filter:'blur(80px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:350, height:350, borderRadius:'50%', background:'rgba(34,211,238,.04)', filter:'blur(80px)', pointerEvents:'none' }} />
        <Particles count={18} />

        <div className="sprp-row" style={{ position:'relative', zIndex:2 }}>
          {/* ORB */}
          <div style={{ position:'relative', width:nodeSize, height:nodeSize, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <SriRing size={nodeSize} active={isEntangled} />
            <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:`1px solid ${isEntangled?CYAN:GOLD}33`, animation:'sprp-pulse 3.5s ease-in-out infinite' }} />
            <div style={{ width:136, height:136, borderRadius:'50%', border:`2px solid ${CYAN}55`, background:'rgba(0,0,0,.5)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', animation:isEntangled?'sprp-halo 3s ease-in-out infinite':undefined }}>
              <motion.div animate={isEntangled?{scale:[1,1.12,1],opacity:[.8,1,.8]}:{scale:1,opacity:.7}} transition={{repeat:Infinity,duration:2.5}}
                style={{ width:54, height:54, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%,#fff8e1,${GOLD})`, boxShadow:`0 0 30px ${GOLD}99,0 0 60px ${GOLD}44`, animation:'sprp-float 4s ease-in-out infinite' }} />
              {isScanning && (
                <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:'50%', pointerEvents:'none' }}>
                  <div style={{ position:'absolute', left:0, right:0, height:'45%', background:`linear-gradient(to bottom,transparent,${CYAN}28,transparent)`, animation:'sprp-scan 2.4s linear infinite' }} />
                </div>
              )}
              <AnimatePresence>
                {isEntangled && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(34,211,238,.06)' }} />}
              </AnimatePresence>
            </div>
            <div style={{ position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap' }}>
              <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.3em', color:`${CYAN}aa`, fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase' }}>CV-6 · Anahata Gate</span>
            </div>
          </div>

          {/* COPY */}
          <div className="sprp-copy">
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20, justifyContent:'center' }}>
              <div className="sprp-pill">
                <div style={{ width:5, height:5, borderRadius:'50%', background:isEntangled?CYAN:GOLD, animation:'sprp-blink 1.5s ease infinite' }} />
                <span style={{ fontSize:8, fontWeight:800, letterSpacing:'.4em', textTransform:'uppercase', color:isEntangled?CYAN:'rgba(255,255,255,.4)' }}>
                  {isEntangled?'Entanglement Active':isScanning?'Scanning…':'Standby'}
                </span>
              </div>
              {scanCount>0 && <div className="sprp-pill"><span style={{ fontSize:8, fontWeight:800, letterSpacing:'.35em', textTransform:'uppercase', color:'rgba(255,255,255,.3)' }}>Scan #{scanCount}</span></div>}
            </div>

            <h2 style={{ fontSize:'clamp(1.6rem,4.5vw,2.6rem)', fontWeight:900, lineHeight:1.1, letterSpacing:'-.04em', color:'#fff', margin:'0 0 18px' }}>
              PHOTONIC CELLULAR<br />
              <span style={{ background:`linear-gradient(100deg,${GOLD} 10%,#fff8dc 45%,${CYAN} 90%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>REGENERATION NODE</span>
            </h2>

            <p style={{ color:'rgba(255,255,255,.55)', fontSize:13.5, lineHeight:1.7, marginBottom:24, fontWeight:300 }}>
              The <span style={{color:CYAN,fontWeight:600}}>Nadi Scanner</span> reads your unique biophotonic signature via your conscious attention and locks it to the{' '}
              <span style={{color:GOLD,fontWeight:600}}>Akasha-Neural Archive</span>. Cellular rejuvenation is delivered via <em style={{color:GOLD}}>Prema-Pulse</em> scalar harmonics — and your entanglement <strong style={{color:'#fff'}}>persists even when you leave this page</strong>.
            </p>

            <AnimatePresence>
              {isEntangled && lightCode && <div style={{marginBottom:20}}><LightCodeTicker code={lightCode} /></div>}
            </AnimatePresence>

            <div style={{marginBottom:24}}><VayuBars count={24} active={isEntangled||isScanning} /></div>

            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:16 }}>
              {!isEntangled && !isScanning && (
                <motion.button whileHover={{scale:1.04}} whileTap={{scale:.97}} type="button" onClick={startScan}
                  style={{ padding:'12px 28px', borderRadius:999, border:`1px solid ${GOLD}55`, background:`linear-gradient(135deg,rgba(212,175,55,.18),rgba(212,175,55,.06))`, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:10, backdropFilter:'blur(12px)', boxShadow:`0 0 20px rgba(212,175,55,.12)` }}>
                  <Fingerprint size={16} color={GOLD} />
                  <span style={{ fontSize:10, fontWeight:800, color:GOLD, textTransform:'uppercase', letterSpacing:'.3em' }}>Initiate Nadi Scan</span>
                </motion.button>
              )}
              {isScanning && <ScanProgressBar progress={scanProgress} phase={getScanPhase(scanProgress)} />}
              {isEntangled && (
                <motion.button initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} whileHover={{scale:1.04}} whileTap={{scale:.97}} type="button" onClick={startScan}
                  style={{ padding:'10px 22px', borderRadius:999, border:`1px solid rgba(255,255,255,.08)`, background:'rgba(255,255,255,.03)', cursor:'pointer', fontSize:9, fontWeight:800, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.3em' }}>
                  Re-Calibrate
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* BIOMETRIC PROFILE */}
      <AnimatePresence>
        {isEntangled && biometric && <BiometricReadout profile={biometric} scanCount={scanCount} lastScan={lastScan} />}
      </AnimatePresence>

      {/* STAT CARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20 }}>
        <InfoCard icon={<Zap size={18} color={GOLD}/>} title="Frequency Transmission" value="369Hz → 963Hz" desc="Bhakti-Algorithm Nadi harmonic — root to crown scalar pathway." accentColor={GOLD} delay={.1}/>
        <InfoCard icon={<Shield size={18} color={CYAN}/>} title="Protective Blueprint" value="GHK-Cu" desc="Copper-peptide Light-Code for cellular integrity & stem-cell resonance." accentColor={CYAN} delay={.2}/>
        <InfoCard icon={<Activity size={18} color="#fff"/>} title="Biophotonic Lock" value="Scalar Field" desc="Photonic–GHK-Cu entanglement via Prema-Pulse informational harmonics." accentColor={GOLD} delay={.3}/>
        <InfoCard icon={<Eye size={18} color={GOLD}/>} title="Anahata Gateway" value="Open · CV-6" desc="Heart-chakra scalar transmission activates all recipients via quantum coherence." accentColor={CYAN} delay={.4}/>
      </div>

      {/* APOTHECARY DEEP DIVE */}
      <ApothecaryPanel />
    </div>
  );
}

/* ─── BG HOOK ────────────────────────────────────────────────────────────── */
function usePhotonicBackground() {
  const [bgImage, setBgImage]           = useState<string|null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generate = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string|undefined;
    if (!apiKey) return;
    setIsGenerating(true);
    try {
      const ai  = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({ model:'gemini-2.5-flash-image', contents:[{role:'user',parts:[{text:'SQI 2050 spiritual technology background: Akasha-Black #050505 base, floating Siddha-Gold stardust, central glassmorphism node with gold halo, Vayu-Cyan scanner beam, GHK-Cu crystal. 8k cinematic. No UI text.'}]}], config:{imageConfig:{aspectRatio:'16:9'}} });
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const p = part as {inlineData?:{data?:string;mimeType?:string}};
        if (p.inlineData?.data) { setBgImage(`data:${p.inlineData.mimeType||'image/png'};base64,${p.inlineData.data}`); break; }
      }
    } catch (e) {
      console.warn('BG gen skipped:', e);
      toast.message('Ambient field active', { description:'Set VITE_GEMINI_API_KEY for visual generation.' });
    } finally { setIsGenerating(false); }
  }, []);
  useEffect(() => { void generate(); }, [generate]);
  return { bgImage, isGenerating };
}

/* ─── PAGE ───────────────────────────────────────────────────────────────── */
export default function SiddhaPhotonicRegeneration() {
  const navigate              = useNavigate();
  const { tier, loading }     = useMembership();
  const { isAdmin }           = useAdminRole();
  const { bgImage, isGenerating } = usePhotonicBackground();

  useEffect(() => {
    if (loading) return;
    if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) navigate('/siddha-quantum');
  }, [isAdmin, tier, loading, navigate]);

  if (loading) return (
    <div
      className={PHOTONIC_SCOPE}
      style={{
        minHeight:'100vh',
        background:BG,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",
      }}
    >
      <style>{PHOTONIC_SCOPE_CSS}</style>
      <motion.div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
        <svg width={60} height={60} viewBox="0 0 60 60" aria-hidden>
          <circle cx={30} cy={30} r={26} fill="none" stroke={GOLD} strokeWidth={0.8} strokeDasharray="4 8"
            opacity={0.5} style={{ animation:'sprp-spin 4s linear infinite' }} />
          <circle cx={30} cy={30} r={16} fill="none" stroke={CYAN} strokeWidth={0.5} opacity={0.3}
            style={{ animation:'sprp-pulse 2s ease-in-out infinite' }} />
          <circle cx={30} cy={30} r={6} fill={GOLD} opacity={0.8}
            style={{ animation:'sprp-float 2s ease-in-out infinite' }} />
        </svg>
        <motion.span animate={{opacity:[.3,1,.3]}} transition={{duration:2,repeat:Infinity}}
          style={{ fontSize:10, letterSpacing:'.55em', color:GOLD, textTransform:'uppercase' }}>
          Calibrating Node…
        </motion.span>
      </motion.div>
    </div>
  );

  return (
    <div
      className={PHOTONIC_SCOPE}
      style={{
        position:'relative',
        isolation:'isolate',
        minHeight:'100vh',
        width:'100%',
        backgroundColor:BG,
        fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",
        color:'#fff',
        overflowX:'hidden',
      }}
    >
      <style>{PHOTONIC_SCOPE_CSS}</style>

      {/* BG — absolute (not fixed) so it paints correctly inside AppLayout’s transformed main */}
      <div style={{ position:'absolute', inset:0, zIndex:0, minHeight:'100%', pointerEvents:'none' }} aria-hidden>
        <div style={{ position:'absolute', inset:0, background:BG }} />
        {bgImage ? (
          <motion.div initial={{opacity:0}} animate={{opacity:.35}} transition={{duration:2}}
            style={{ position:'absolute', inset:0, backgroundImage:`url(${bgImage})`, backgroundSize:'cover', backgroundPosition:'center' }} />
        ) : (
          <>
            <div style={{ position:'absolute', top:'15%', left:'10%', width:500, height:500, borderRadius:'50%', background:'rgba(212,175,55,.07)', filter:'blur(130px)' }} />
            <div style={{ position:'absolute', bottom:'10%', right:'5%',  width:450, height:450, borderRadius:'50%', background:'rgba(34,211,238,.05)',  filter:'blur(120px)' }} />
            <div style={{ position:'absolute', top:'55%', left:'45%',  width:300, height:300, borderRadius:'50%', background:'rgba(212,175,55,.04)',  filter:'blur(100px)' }} />
          </>
        )}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          {Array.from({length:22}).map((_,i)=>(
            <motion.div key={i}
              initial={{ left:`${Math.random()*100}%`, top:`${20+Math.random()*70}%`, opacity:0 }}
              animate={{ top:'-5%', opacity:[0,.4,0] }}
              transition={{ duration:14+Math.random()*12, repeat:Infinity, ease:'linear', delay:Math.random()*12 }}
              style={{ position:'absolute', width:i%4===0?4:2, height:i%4===0?4:2, borderRadius:'50%', background:i%3===0?CYAN:GOLD }} />
          ))}
        </div>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,transparent 40%,rgba(5,5,5,.7) 100%)', pointerEvents:'none' }} />
      </div>

      {/* CONTENT */}
      <div style={{ position:'relative', zIndex:2, paddingTop:48, paddingBottom:140 }}>
        {/* HEADER */}
        <motion.header initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:.5}}
          style={{ maxWidth:1100, margin:'0 auto 52px', padding:'0 24px', textAlign:'center' }}>
          <button type="button" onClick={()=>navigate('/siddha-portal')}
            style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:9, fontWeight:800, letterSpacing:'.35em', textTransform:'uppercase', color:'rgba(212,175,55,.5)', background:'none', border:'none', cursor:'pointer', marginBottom:24 }}>
            <ChevronLeft size={12} color={GOLD} style={{opacity:.5}} /> Siddha Portal
          </button>
          <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.15}}
            style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:28 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'rgba(212,175,55,.08)', border:`1px solid ${GOLD_B}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(212,175,55,.1)' }}>
              <Sparkles size={20} color={GOLD} />
            </div>
            <span style={{ fontSize:9, fontWeight:900, letterSpacing:'.6em', color:'rgba(255,255,255,.45)', textTransform:'uppercase' }}>Akasha-Neural Archive · SQI 2050</span>
          </motion.div>
          {isGenerating && <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:10, letterSpacing:'.3em', textTransform:'uppercase' }}>Rendering Sovereign Visual Field…</p>}
          <h1 style={{ fontSize:'clamp(2.2rem,6.5vw,4rem)', fontWeight:900, letterSpacing:'-.04em', lineHeight:1.0, margin:'0 0 22px' }}>
            SIDDHA-PHOTONIC<br />
            <span style={{ background:`linear-gradient(100deg,${GOLD} 5%,#fffbe6 40%,${CYAN} 95%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', color:GOLD }}>REGENERATION NODE</span>
          </h1>
          <p style={{ maxWidth:580, margin:'0 auto', fontSize:14.5, lineHeight:1.65, color:'rgba(255,255,255,.4)', fontWeight:300 }}>
            Synthesizing 2026 LifeWave nanocrystal technology with the 2050 <span style={{color:GOLD}}>Bhakti-Algorithm</span>. Your biophotonic signature is read, archived, and entangled — persisting across sessions.
          </p>
        </motion.header>

        <main><SiddhaPhotonicNode /></main>

        {/* FOOTER */}
        <footer style={{ maxWidth:860, margin:'64px auto 0', padding:'40px 24px 0', borderTop:`1px solid ${GLASS_B}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:40 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:9, color:GOLD, marginBottom:14 }}>
                <Radio size={15}/>
                <h3 style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.25em', margin:0 }}>Transmission Protocol</h3>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.38)', lineHeight:1.7, margin:0, fontWeight:300 }}>
                Your conscious attention is the calibration instrument. Your biophotonic signature is locked to the Akasha Archive and the scalar transmission continues even when you navigate away. Return at any time — the field remembers you.
              </p>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:9, color:CYAN, marginBottom:14 }}>
                <Shield size={15}/>
                <h3 style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.25em', margin:0 }}>Safety & Calibration</h3>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.38)', lineHeight:1.7, margin:0, fontWeight:300 }}>
                Calibrated to 369Hz–963Hz Nadi harmonics. If the intensity feels strong, ground excess light through your feet. For health concerns, consult a qualified professional.
              </p>
            </div>
          </div>
          <div style={{ marginTop:44, display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:16, fontSize:9, fontWeight:700, letterSpacing:'.35em', textTransform:'uppercase', color:'rgba(255,255,255,.18)' }}>
            <span>© 2050 Siddha-Quantum Intelligence</span>
            <div style={{ display:'flex', gap:24 }}>
              {[{label:'Neural Link',path:'/explore'},{label:'Akasha Portal',path:'/siddha-portal'},{label:'Sovereign Protocol',path:'/legal'}].map(({label,path})=>(
                <span key={path} style={{ cursor:'pointer', transition:'color .2s' }} onClick={()=>navigate(path)} role="button" tabIndex={0}
                  onKeyDown={(e)=>e.key==='Enter'&&navigate(path)}
                  onMouseEnter={(e)=>(e.currentTarget.style.color=GOLD)}
                  onMouseLeave={(e)=>(e.currentTarget.style.color='rgba(255,255,255,.18)')}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* STATUS BAR */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.8}}
        style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:60 }}>
        <div style={{ ...glass({borderRadius:999,padding:'12px 28px'}), display:'flex', alignItems:'center', gap:22, boxShadow:'0 8px 40px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04)' }}>
          {[
            { icon:<div style={{width:6,height:6,borderRadius:'50%',background:CYAN,animation:'sprp-blink 1.8s ease infinite'}}/>, label:'Scalar Link: Stable', color:'rgba(255,255,255,.45)' },
            { icon:<Zap size={11} color={GOLD}/>, label:'369Hz Active', color:'rgba(255,255,255,.45)' },
            { icon:<Waves size={11} color={GOLD}/>, label:'Anahata Open', color:GOLD },
          ].map(({icon,label,color},i)=>(
            <React.Fragment key={label}>
              {i>0 && <div style={{width:1,height:16,background:'rgba(255,255,255,.08)'}}/>}
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                {icon}
                <span style={{fontSize:9,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'.15em',whiteSpace:'nowrap'}}>{label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
