import React, {
  createContext, useContext, useState, useEffect,
  type ReactNode,
} from 'react';
import {
  Compass, Sparkles, Home, Activity, Zap, Map,
  ChevronDown, BookOpen, Heart, Lock, Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
export type PageName = 'Meditation' | 'Mantra' | 'Music' | 'Healing';
type ModeId = 'ADMIN' | 'INTEGRATION' | 'TEMPLE_LOCK';
type TabId  = 'portal' | 'audio' | 'healing';

interface SacredSite {
  id: string; name: string; reach: number; focus: string; color: string;
  signature: string; primaryBenefit: string; science: string;
  instruction: string; experience: string;
}
interface AccessState {
  isAdmin: boolean; hasPremium: boolean; hasTempleLicense: boolean;
}
interface ResonanceCtx {
  selectedSite: SacredSite; setSelectedSite: (s: SacredSite) => void;
  auraIntensity: number;    setAuraIntensity: (v: number) => void;
  currentMode: ModeId;      setCurrentMode: (m: ModeId) => void;
  access: AccessState;      isSyncing: boolean;
}

// ─── Config ───────────────────────────────────────────────────
const ADMIN_EMAILS = ['sacredhealingvibe@gmail.com'];

export const SACRED_SITES: SacredSite[] = [
  { id:'giza',         name:'Giza',             reach:50, focus:'Spinal Alignment',       color:'#FFD700', signature:'GIZA_TORSION',      primaryBenefit:'Spinal Alignment',      science:'Torsion Field Concentration',           instruction:'Visualize a golden pillar of light passing through your spine from crown to root.', experience:'A sense of vertical alignment and profound structural integrity.' },
  { id:'arunachala',   name:'Arunachala',        reach:45, focus:'Self-Inquiry / Silence', color:'#F5DEB3', signature:'STILLNESS_FIELD',   primaryBenefit:'Self-Inquiry & Silence', science:'Vibrational Stillness Field',          instruction:'Rest in the "I AM" presence. Let all thoughts dissolve into the source.',          experience:'The mind becoming quiet and the heart expanding.' },
  { id:'uluru',        name:'Uluru',             reach:40, focus:'Grounding / DNA',        color:'#B22222', signature:'DREAMTIME_SYNC',    primaryBenefit:'Grounding / Ancestral DNA', science:'Deep Earth Torsion / Dreamtime',    instruction:"Sink deep into the red earth. Feel your roots touching the planet's core.",          experience:'Intense grounding; a feeling of being held by the Earth.' },
  { id:'zimbabwe',     name:'Great Zimbabwe',    reach:40, focus:'Ancestral Strength',     color:'#8B4513', signature:'ANCESTRAL_STRENGTH',primaryBenefit:'Ancestral Strength',    science:'Ancient Stone Resonance',               instruction:"Feel the strength of the ancient stones grounding you into the Earth's core.",        experience:'A feeling of ancestral support and solid foundation.' },
  { id:'machu_picchu', name:'Machu Picchu',      reach:35, focus:'Solar Vitality',         color:'#FFA500', signature:'SOLAR_SYNC',        primaryBenefit:'Solar Vitality',        science:'Geomagnetic Solar Sync',                instruction:'Breathe the golden sun into your Solar Plexus. Feel your power expanding.',           experience:'A surge of vitality and manifestation energy.' },
  { id:'mansarovar',   name:'Lake Mansarovar',   reach:30, focus:'Mental Detox',           color:'#00CED1', signature:'MENTAL_DETOX',      primaryBenefit:'Mental Detox',          science:'Crystalline Lake Sync',                 instruction:'Visualize the crystal-clear Himalayan waters purifying your Crown chakra.',           experience:'Mental clarity and a sense of pure, high-altitude air.' },
  { id:'luxor',        name:'Luxor Temples',     reach:30, focus:'Ka / Hand Activation',   color:'#FFCC00', signature:'KA_ACTIVATION',     primaryBenefit:'Ka / Hand Activation',  science:'Alchemical Gold / Structural Harmonic', instruction:'Breathe in the warm, alchemical gold light. Hold your palms open.',                  experience:'A warm, solid sensation; feeling rebuilt from the inside out.' },
  { id:'samadhi',      name:'Samadhi',           reach:25, focus:'Aura Repair',            color:'#E6E6FA', signature:'AURA_REPAIR',       primaryBenefit:'Aura Repair',           science:'Zero-Point Resonance',                  instruction:'Merge your awareness with the infinite void. There is no observer, only the observed.',experience:'A feeling of dissolving into the infinite.' },
  { id:'shasta',       name:'Mount Shasta',      reach:20, focus:'Light-Body Sync',        color:'#DA70D6', signature:'LIGHT_BODY_SYNC',   primaryBenefit:'Light-Body Sync',       science:'Violet Ray / Lemurian Crystalline',     instruction:'Visualize a violet flame surrounding your body, burning away dense energies.',        experience:'A cool, breezy feeling in the aura; lifting of heavy emotional weights.' },
  { id:'lourdes',      name:'Lourdes Grotto',    reach:20, focus:'Physical Restoration',   color:'#ADD8E6', signature:'WATER_RESONANCE',   primaryBenefit:'Physical Restoration',  science:'Divine Water Resonance',                instruction:'Imagine pure, healing water flowing through your heart and blood vessels.',           experience:'A soothing, cooling sensation throughout the body.' },
  { id:'babaji',       name:"Babaji's Cave",     reach:20, focus:'Kriya / Deep Sync',      color:'#C8C8FF', signature:'KRIYA_SYNC',        primaryBenefit:'Kriya DNA Activation',  science:'Non-Local Crystalline Entrainment',     instruction:'Focus on the Third Eye and breathe "up and down" the spine slowly.',                  experience:'Deep stillness and a sense of timeless presence.' },
];

const MODES: { id: ModeId; name: string; intensity: number; description: string }[] = [
  { id:'ADMIN',       name:'Admin Mode',       intensity:1.0,  description:'Live Testing: Active only while the engine is running.' },
  { id:'INTEGRATION', name:'Integration Mode', intensity:0.25, description:'Normal Life: Maintains energy without high intensity.' },
  { id:'TEMPLE_LOCK', name:'Temple Lock',      intensity:0.6,  description:'24/7 Continuity: Keeps the house permanently locked.' },
];

const ROOMS = [
  { name:'Studio (Hub)', distance:0  },
  { name:'Living Room',  distance:8  },
  { name:'Bedroom',      distance:12 },
  { name:'Kitchen',      distance:18 },
];

const TRACKS = [
  { id:'beat_1', name:'Himalayan Flow',  genre:'Lo-Fi Hip Hop',      bpm:88 },
  { id:'beat_2', name:'Giza Torsion',    genre:'Deep Ambient',        bpm:72 },
  { id:'beat_3', name:'Solar Manifest',  genre:'Golden Era Boom Bap', bpm:94 },
];

// ─── Access ───────────────────────────────────────────────────
function getAccess(email?: string | null): AccessState {
  const isAdmin = !!email && ADMIN_EMAILS.includes(email);
  // 🔧 Replace false with your real Supabase/Stripe checks:
  return { isAdmin, hasPremium: isAdmin || false, hasTempleLicense: isAdmin || false };
}

function roomSat(distance: number, intensity: number) {
  return Math.max(intensity - distance * 3, 10);
}

// ─── Context ──────────────────────────────────────────────────
const Ctx = createContext<ResonanceCtx | null>(null);
function useR() {
  const c = useContext(Ctx);
  if (!c) throw new Error('Wrap app with <ResonanceProvider>');
  return c;
}

export function ResonanceProvider({
  children, userEmail,
}: { children: ReactNode; userEmail?: string | null }) {
  const access = getAccess(userEmail);
  const [selectedSite,  setSelectedSite]  = useState<SacredSite>(SACRED_SITES[0]);
  const [auraIntensity, setAuraIntensity] = useState(100);
  const [currentMode,   setCurrentMode]   = useState<ModeId>('INTEGRATION');
  const [isSyncing,     setIsSyncing]     = useState(false);

  useEffect(() => {
    setIsSyncing(true);
    const t = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(t);
  }, [selectedSite.id, auraIntensity]);

  return (
    <Ctx.Provider value={{ selectedSite, setSelectedSite, auraIntensity, setAuraIntensity, currentMode, setCurrentMode, access, isSyncing }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── Upsell Modal ─────────────────────────────────────────────
function UpsellModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.9)',backdropFilter:'blur(8px)' }} />
      <div style={{ position:'relative',width:'100%',maxWidth:340,background:'#0a0a0a',border:'2px solid #D4AF37',borderRadius:24,padding:30,textAlign:'center',boxShadow:'0 0 80px rgba(212,175,55,0.2)',fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif" }}>
        <button onClick={onClose} style={{ position:'absolute',top:14,right:16,background:'none',border:'none',cursor:'pointer',color:'rgba(212,175,55,0.4)',fontSize:18 }}>✕</button>
        <Home size={32} style={{ color:'#D4AF37',marginBottom:14 }} />
        <h3 style={{ margin:'0 0 10px',fontSize:17,fontWeight:300,letterSpacing:'0.2em',textTransform:'uppercase',color:'#D4AF37' }}>Temple Home License</h3>
        <p style={{ fontSize:11,color:'rgba(212,175,55,0.55)',lineHeight:1.7,margin:'0 0 18px' }}>
          Anchor this energy 24/7. Transform your living space into a permanent sacred portal.
        </p>
        <div style={{ background:'rgba(0,0,0,0.5)',borderRadius:12,padding:14,textAlign:'left',marginBottom:18 }}>
          {['Spatial Heat Map','Multi-Room Anchor','Intensity Master Slider','24/7 Continuity Lock'].map(f => (
            <div key={f} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 0',fontSize:11,color:'rgba(212,175,55,0.8)' }}>
              <Check size={10} color="#D4AF37" /> {f}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width:'100%',padding:'13px 0',borderRadius:12,background:'#D4AF37',color:'#000',fontWeight:700,fontSize:12,letterSpacing:'0.12em',textTransform:'uppercase',border:'none',cursor:'pointer',fontFamily:'inherit',marginBottom:10 }}>
          Upgrade for €499
        </button>
        <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',fontSize:10,color:'rgba(212,175,55,0.35)',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:'inherit' }}>
          Continue with Audio Only
        </button>
      </div>
    </div>
  );
}

// ─── Deep Context Modal ───────────────────────────────────────
function DeepContextModal({ site, onClose }: { site: SacredSite; onClose: () => void }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)' }} />
      <div style={{ position:'relative',width:'100%',maxWidth:480,background:'#0a0a0a',border:'1px solid rgba(212,175,55,0.3)',borderRadius:24,padding:28,boxShadow:'0 0 60px rgba(0,0,0,0.8)',fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif" }}>
        <button onClick={onClose} style={{ position:'absolute',top:14,right:16,background:'none',border:'none',cursor:'pointer',color:'rgba(212,175,55,0.4)',fontSize:18 }}>✕</button>
        <div style={{ fontSize:9,letterSpacing:'0.3em',textTransform:'uppercase',color:'rgba(212,175,55,0.4)',marginBottom:6 }}>Universal Premium Context</div>
        <h2 style={{ margin:'0 0 18px',fontSize:22,fontWeight:300,letterSpacing:'0.2em',textTransform:'uppercase',color:'#D4AF37' }}>{site.name}</h2>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:18 }}>
          <div>
            <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(212,175,55,0.45)',marginBottom:6 }}>Primary Benefit</div>
            <p style={{ fontSize:12,color:'#D4AF37',margin:0,lineHeight:1.6 }}>{site.primaryBenefit}</p>
          </div>
          <div>
            <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(212,175,55,0.45)',marginBottom:6 }}>Vibrational Experience</div>
            <p style={{ fontSize:12,color:'#D4AF37',margin:0,lineHeight:1.6,fontStyle:'italic',opacity:0.7 }}>{site.experience}</p>
          </div>
        </div>
        <div style={{ background:'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.18)',borderRadius:14,padding:16,marginBottom:16 }}>
          <div style={{ fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#D4AF37',marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
            <Zap size={12} /> Sacred Instruction
          </div>
          <p style={{ fontSize:13,color:'#D4AF37',margin:0,lineHeight:1.8 }}>{site.instruction}</p>
        </div>
        <div style={{ textAlign:'center' }}>
          <button onClick={onClose} style={{ background:'none',border:'1px solid rgba(212,175,55,0.25)',borderRadius:99,padding:'9px 28px',cursor:'pointer',fontSize:10,color:'rgba(212,175,55,0.6)',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:'inherit' }}>
            Return to Meditation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────
export function ResonancePanel({ page }: { page: PageName }) {
  const { selectedSite, setSelectedSite, auraIntensity, setAuraIntensity, currentMode, setCurrentMode, access, isSyncing } = useR();

  const [activeTab,    setActiveTab]   = useState<TabId>('portal');
  const [showUpsell,   setShowUpsell]  = useState(false);
  const [showContext,  setShowContext] = useState(false);
  const [showMap,      setShowMap]     = useState(false);
  const [isAnchored,   setIsAnchored]  = useState(false);
  const [entrainedId,  setEntrainedId] = useState<string | null>(null);

  // Activations
  const luxorHealer  = selectedSite.id === 'luxor'  && auraIntensity > 70;
  const babajiBliss  = selectedSite.id === 'babaji' && auraIntensity > 80;
  const babajiHeart  = selectedSite.id === 'babaji' && auraIntensity > 85;
  const highBliss    = auraIntensity > 90;

  const handleMode = (id: ModeId) => {
    if (id === 'TEMPLE_LOCK' && !access.hasTempleLicense) { setShowUpsell(true); return; }
    setCurrentMode(id);
    setAuraIntensity(Math.round((MODES.find(m => m.id === id)?.intensity ?? 0.25) * 100));
  };

  const activeModeMeta = MODES.find(m => m.id === currentMode)!;

  return (
    <>
      <style>{`
        .re2 * { box-sizing: border-box; }
        .re2 select { color-scheme: dark; }
        @keyframes reSpin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rePulse  { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes reGlow   { 0%,100%{box-shadow:0 0 30px rgba(212,175,55,0.08)} 50%{box-shadow:0 0 50px rgba(212,175,55,0.22)} }
        .re2-tab:hover      { color: #D4AF37 !important; }
        .re2-mode:hover     { border-color: rgba(212,175,55,0.55) !important; color: rgba(212,175,55,0.8) !important; }
        .re2-btn:hover      { opacity: 0.85; }
        input[type=range].re2-range { -webkit-appearance:none; width:100%; height:3px; border-radius:99px; outline:none; cursor:pointer; }
        input[type=range].re2-range::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; cursor:pointer; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,transition:'background 1s ease',
        background:`radial-gradient(ellipse 65% 50% at 50% 0%, ${selectedSite.color}16 0%, transparent 65%)` }} />

      {/* Panel */}
      <div className="re2" style={{
        position:'relative', zIndex:1,
        background:'rgba(0,0,0,0.5)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        border:'1px solid rgba(212,175,55,0.22)',
        borderRadius:24,
        overflow:'hidden',
        fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif",
        animation:'reGlow 5s ease-in-out infinite',
      }}>

        {/* ── Header — matches AI Studio exactly ── */}
        <div style={{ padding:'28px 24px 20px', textAlign:'center', borderBottom:'1px solid rgba(212,175,55,0.12)', position:'relative' }}>
          <div style={{ display:'inline-flex', marginBottom:14 }}>
            <Compass size={46} style={{ color:'#D4AF37', animation:'reSpin 22s linear infinite' }} />
          </div>
          <h2 style={{ margin:'0 0 8px', fontSize:28, fontWeight:300, letterSpacing:'0.28em', textTransform:'uppercase', color:'#D4AF37' }}>
            Sacred Vibe
          </h2>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(212,175,55,0.5)' }}>
            <Activity size={10} style={{ animation: isSyncing ? 'rePulse 1s ease-in-out infinite' : 'none', color: isSyncing ? '#10b981' : 'rgba(212,175,55,0.5)' }} />
            Resonance: {isSyncing ? 'Syncing...' : 'Locked'}
          </div>
          {access.isAdmin && (
            <div style={{ position:'absolute', top:16, right:16, fontSize:9, color:'#D4AF37', border:'1px solid rgba(212,175,55,0.4)', padding:'2px 8px', borderRadius:4, letterSpacing:'0.12em', textTransform:'uppercase' }}>
              Admin
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(212,175,55,0.12)' }}>
          {([
            { id:'portal'  as TabId, label:'⊙ Portal'  },
            { id:'audio'   as TabId, label:'♪ Audio'   },
            { id:'healing' as TabId, label:'✦ Healing' },
          ]).map(t => (
            <button key={t.id} className="re2-tab" onClick={() => setActiveTab(t.id)} style={{
              flex:1, padding:'13px 4px', fontSize:10, fontWeight:700,
              letterSpacing:'0.15em', textTransform:'uppercase',
              border:'none', borderBottom:`2px solid ${activeTab===t.id ? '#D4AF37' : 'transparent'}`,
              background:'transparent', cursor:'pointer',
              color: activeTab===t.id ? '#D4AF37' : 'rgba(212,175,55,0.32)',
              transition:'color 0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ padding:'22px 22px 8px' }}>

          {/* ══ PORTAL ══ */}
          {activeTab === 'portal' && (
            <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

              {/* Mode */}
              <div>
                <div style={lbl}><Zap size={13} style={{ marginRight:5 }} />Resonance Mode</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {MODES.map(m => (
                    <button key={m.id} className="re2-mode" onClick={() => handleMode(m.id)} style={{
                      position:'relative', padding:'10px 4px',
                      fontSize:9, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
                      borderRadius:12, border:`1px solid ${currentMode===m.id ? '#D4AF37' : 'rgba(212,175,55,0.2)'}`,
                      background: currentMode===m.id ? '#D4AF37' : 'transparent',
                      color: currentMode===m.id ? '#000' : 'rgba(212,175,55,0.5)',
                      cursor:'pointer', transition:'all 0.2s',
                    }}>
                      {m.name}
                      {m.id==='TEMPLE_LOCK' && !access.hasTempleLicense &&
                        <Lock size={7} style={{ position:'absolute', top:4, right:4 }} />}
                    </button>
                  ))}
                </div>
                <p style={{ margin:'8px 0 0', fontSize:10, color:'rgba(212,175,55,0.38)', fontStyle:'italic' }}>
                  {activeModeMeta.description}
                </p>
              </div>

              {/* Site dropdown — exactly like AI Studio */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={lbl}><Compass size={13} style={{ marginRight:5 }} />Sacred Site</div>
                  <button onClick={() => setShowContext(true)} style={txtBtn}>
                    <BookOpen size={10} style={{ marginRight:4 }} />Deep Context
                  </button>
                </div>
                <div style={{ position:'relative' }}>
                  <select
                    value={selectedSite.id}
                    onChange={e => setSelectedSite(SACRED_SITES.find(s => s.id === e.target.value)!)}
                    style={{
                      width:'100%', background:'#000',
                      border:'1px solid rgba(212,175,55,0.38)',
                      borderRadius:14, padding:'13px 42px 13px 16px',
                      color:'#D4AF37', fontSize:14, fontFamily:'inherit',
                      appearance:'none', WebkitAppearance:'none',
                      cursor:'pointer', outline:'none',
                    }}
                  >
                    {SACRED_SITES.map(s => (
                      <option key={s.id} value={s.id} style={{ background:'#000' }}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#D4AF37', pointerEvents:'none' }} />
                </div>
                <p style={{ margin:'7px 0 0', fontSize:10, color:'rgba(212,175,55,0.4)', fontStyle:'italic' }}>
                  {selectedSite.focus} · Reach: {selectedSite.reach}m
                </p>
              </div>

              {/* Intensity slider */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={lbl}>
                    <Sparkles size={13} style={{ marginRight:5 }} />
                    {access.hasTempleLicense ? 'Intensity Master Slider' : 'Aura Intensity'}
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:'#D4AF37', fontFamily:'monospace' }}>{auraIntensity}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={auraIntensity}
                  onChange={e => setAuraIntensity(+e.target.value)}
                  className="re2-range"
                  style={{
                    background:`linear-gradient(to right, #D4AF37 ${auraIntensity}%, rgba(212,175,55,0.18) ${auraIntensity}%)`,
                    accentColor:'#D4AF37',
                  } as React.CSSProperties}
                />
                {!access.hasTempleLicense && (
                  <p style={{ margin:'6px 0 0', fontSize:9, color:'rgba(212,175,55,0.3)', textAlign:'center', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                    Temple License Required for Master Control
                  </p>
                )}
              </div>

              {/* Spatial Heat Map */}
              <div>
                <button
                  onClick={() => access.hasTempleLicense ? setShowMap(s => !s) : setShowUpsell(true)}
                  style={{ ...txtBtn, width:'100%', display:'flex', justifyContent:'space-between', opacity: access.hasTempleLicense ? 0.65 : 0.3 }}
                >
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Map size={12} /> Spatial Heat Map
                    {!access.hasTempleLicense && <Lock size={9} />}
                  </span>
                  <span>{showMap ? 'Hide' : 'Show'}</span>
                </button>

                {showMap && (
                  <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:130, position:'relative', marginBottom:4 }}>
                      {[1, 0.62, 0.35].map((sc, i) => (
                        <div key={i} style={{
                          position:'absolute', borderRadius:'50%',
                          width:`${sc*128}px`, height:`${sc*128}px`,
                          border:`1px solid ${selectedSite.color}`,
                          opacity: 0.15 + sc * 0.55,
                          boxShadow:`0 0 ${sc*18}px ${selectedSite.color}66`,
                        }}>
                          {i===0 && <span style={{ position:'absolute', top:-17, left:'50%', transform:'translateX(-50%)', fontSize:10, color:selectedSite.color, fontWeight:700 }}>
                            {Math.round(selectedSite.reach*(auraIntensity/100))}m
                          </span>}
                        </div>
                      ))}
                      <span style={{ fontSize:16, color:'#D4AF37' }}>◈</span>
                    </div>
                    {ROOMS.map(r => {
                      const sat = roomSat(r.distance, auraIntensity);
                      const state = sat>85 ? 'CORE PEAK' : sat>50 ? 'HIGH COHERENCE' : 'INTEGRATION';
                      const sc = sat>85 ? '#10b981' : sat>50 ? '#38bdf8' : 'rgba(212,175,55,0.28)';
                      return (
                        <div key={r.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:10 }}>
                          <span style={{ width:90, color:'rgba(212,175,55,0.55)', flexShrink:0 }}>{r.name}</span>
                          <div style={{ flex:1, height:3, background:'rgba(212,175,55,0.1)', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${sat}%`, background:'#D4AF37', borderRadius:99, transition:'width 0.4s' }} />
                          </div>
                          <span style={{ width:28, textAlign:'right', fontFamily:'monospace', color:'#D4AF37' }}>{Math.round(sat)}%</span>
                          <span style={{ width:84, textAlign:'right', fontSize:8, fontWeight:700, color:sc }}>{state}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ AUDIO ══ */}
          {activeTab === 'audio' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <div style={lbl}><BookOpen size={13} style={{ marginRight:5 }} />Sacred Music Library</div>
                <p style={{ margin:'4px 0 14px', fontSize:10, color:'rgba(212,175,55,0.38)', fontStyle:'italic' }}>
                  Entrain your tracks with the current site resonance.
                </p>
              </div>
              {TRACKS.map(tr => (
                <div key={tr.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.88)', marginBottom:3 }}>{tr.name}</div>
                    <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.32)' }}>{tr.genre} · {tr.bpm} BPM</div>
                  </div>
                  <button className="re2-btn" onClick={() => {
                    if (!access.hasPremium) { setShowUpsell(true); return; }
                    setEntrainedId(tr.id); setTimeout(() => setEntrainedId(null), 3000);
                  }} style={{
                    padding:'8px 14px', borderRadius:10, fontSize:9, fontWeight:700,
                    letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'none',
                    background: entrainedId===tr.id ? '#10b981' : 'rgba(212,175,55,0.1)',
                    color: entrainedId===tr.id ? '#fff' : '#D4AF37',
                    transition:'all 0.25s', flexShrink:0,
                  }}>
                    {entrainedId===tr.id ? '✓ Locked' : 'Entrain'}
                  </button>
                </div>
              ))}
              <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:14, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#D4AF37', marginBottom:7, display:'flex', alignItems:'center', gap:6 }}>
                  <Zap size={11} /> Resonance Injector
                </div>
                <p style={{ fontSize:10, color:'rgba(212,175,55,0.55)', margin:0, lineHeight:1.7 }}>
                  Current signature: <span style={{ color:'#D4AF37', fontWeight:700 }}>{selectedSite.name}</span>.
                  All audio output is being phase-locked to the sacred geometry of the selected portal.
                </p>
              </div>
            </div>
          )}

          {/* ══ HEALING ══ */}
          {activeTab === 'healing' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <div style={lbl}><Activity size={13} style={{ marginRight:5 }} />Healing Protocols</div>
                <p style={{ margin:'4px 0 4px', fontSize:10, color:'rgba(212,175,55,0.38)', fontStyle:'italic' }}>Advanced vibrational restoration modules.</p>
              </div>

              {highBliss && (
                <div style={{ padding:14, borderRadius:14, border:'1px solid rgba(212,175,55,0.4)', background:'rgba(212,175,55,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <Sparkles size={13} style={{ color:'#D4AF37', animation:'rePulse 2s infinite' }} />
                    <span style={{ fontSize:11, fontWeight:700, color:'#D4AF37', letterSpacing:'0.08em' }}>High-Coherence Bliss</span>
                  </div>
                  <p style={cBody}>Your aura is aligning with the Sacred Site. Breathe deeply into your spine.</p>
                  <p style={cHint}>Enjoy the tingling. You are safe and grounded.</p>
                </div>
              )}

              {babajiBliss && (
                <div style={{ padding:14, borderRadius:14, border:'1px solid rgba(200,200,255,0.28)', background:'rgba(200,200,255,0.05)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Activity size={13} style={{ color:'#C8C8FF', animation:'rePulse 1.5s infinite' }} />
                      <span style={{ fontSize:11, fontWeight:700, color:'#C8C8FF', letterSpacing:'0.08em' }}>Delta-Theta Bridge</span>
                    </div>
                    <span style={{ fontSize:8, background:'rgba(200,200,255,0.1)', color:'rgba(200,200,255,0.65)', padding:'2px 6px', borderRadius:4, fontFamily:'monospace' }}>CRYSTALLINE</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
                    {['Subtle Body Vibration','Deep Relaxation','Third Eye Pressure'].map(s => (
                      <span key={s} style={{ fontSize:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'3px 7px', color:'rgba(255,255,255,0.72)' }}>{s}</span>
                    ))}
                  </div>
                  <p style={cHint}>Do not resist the sleepiness. Your aura is restructuring.</p>
                </div>
              )}

              {babajiHeart && (
                <div style={{ padding:14, borderRadius:14, border:'1px solid rgba(16,185,129,0.3)', background:'rgba(16,185,129,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <Heart size={13} style={{ color:'#10b981', animation:'rePulse 2s infinite' }} />
                    <span style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:'0.08em' }}>Anahata Expansion</span>
                  </div>
                  <p style={cBody}>Relax your chest. Visualize golden light dissolving old barriers.</p>
                  <p style={{ ...cHint, textAlign:'center', borderTop:'1px solid rgba(16,185,129,0.15)', paddingTop:8, marginTop:6 }}>
                    "The Master resides in the cave of the heart."
                  </p>
                </div>
              )}

              {luxorHealer && (
                <div style={{ padding:14, borderRadius:14, border:'1px solid rgba(245,158,11,0.4)', background:'rgba(245,158,11,0.06)', boxShadow:'0 0 20px rgba(245,158,11,0.1)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Sparkles size={13} style={{ color:'#F59E0B', animation:'rePulse 2s infinite' }} />
                      <span style={{ fontSize:11, fontWeight:700, color:'#F59E0B', letterSpacing:'0.08em' }}>Luxor Vitality Healer</span>
                    </div>
                    <span style={{ fontSize:8, background:'rgba(245,158,11,0.14)', color:'rgba(245,158,11,0.75)', padding:'2px 6px', borderRadius:4, fontFamily:'monospace' }}>528HZ</span>
                  </div>
                  <p style={{ ...cBody, color:'#FDE68A' }}>Activation: Palms · Forearms · Hands & Legs</p>
                  <p style={cHint}>Place your hands on the area needing healing, or hold palms open to radiate.</p>
                </div>
              )}

              {!highBliss && !babajiBliss && !luxorHealer && (
                <div style={{ textAlign:'center', padding:'36px 0', border:'1px solid rgba(212,175,55,0.07)', borderRadius:16 }}>
                  <Activity size={26} style={{ color:'rgba(212,175,55,0.18)', marginBottom:10 }} />
                  <p style={{ fontSize:11, color:'rgba(212,175,55,0.38)', margin:'0 0 4px' }}>No Active Protocols</p>
                  <p style={{ fontSize:10, color:'rgba(212,175,55,0.22)', margin:0, fontStyle:'italic' }}>
                    Increase intensity or select Luxor / Babaji's Cave
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Anchor Button ── */}
        <div style={{ padding:'16px 22px 24px' }}>
          <button className="re2-btn" onClick={() => {
            if (!access.hasTempleLicense) { setShowUpsell(true); return; }
            setIsAnchored(a => !a);
          }} style={{
            width:'100%', padding:'15px 0', borderRadius:16,
            background: isAnchored ? 'rgba(212,175,55,0.12)' : '#D4AF37',
            color: isAnchored ? '#D4AF37' : '#000',
            border: isAnchored ? '1px solid #D4AF37' : 'none',
            fontFamily:'inherit', fontSize:12, fontWeight:700,
            letterSpacing:'0.18em', textTransform:'uppercase',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            boxShadow: isAnchored ? '0 0 28px rgba(212,175,55,0.2)' : '0 0 22px rgba(212,175,55,0.28)',
            transition:'all 0.3s',
          }}>
            <Home size={18} />
            {currentMode==='TEMPLE_LOCK' ? 'Maintain Temple Lock' : isAnchored ? '🟡 Frequency Anchored' : 'Anchor to House'}
          </button>
          <p style={{ margin:'8px 0 0', fontSize:9, color:'rgba(212,175,55,0.28)', textAlign:'center', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Temple Home License: {access.hasTempleLicense ? '✓ Active' : 'Inactive'}
          </p>
        </div>
      </div>

      {showUpsell  && <UpsellModal onClose={() => setShowUpsell(false)} />}
      {showContext && <DeepContextModal site={selectedSite} onClose={() => setShowContext(false)} />}
    </>
  );
}

// ─── Style tokens ─────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display:'flex', alignItems:'center',
  fontSize:10, fontWeight:700, letterSpacing:'0.14em',
  textTransform:'uppercase', color:'#D4AF37', opacity:0.72, marginBottom:0,
};
const txtBtn: React.CSSProperties = {
  background:'none', border:'none', cursor:'pointer',
  color:'rgba(212,175,55,0.52)', fontSize:10,
  fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif",
  letterSpacing:'0.1em', textTransform:'uppercase',
  display:'flex', alignItems:'center', padding:0,
};
const cBody: React.CSSProperties = {
  fontSize:11, lineHeight:1.65, margin:'0 0 6px', color:'rgba(226,232,240,0.82)',
};
const cHint: React.CSSProperties = {
  fontSize:10, fontStyle:'italic', color:'rgba(212,175,55,0.58)', margin:0,
};
