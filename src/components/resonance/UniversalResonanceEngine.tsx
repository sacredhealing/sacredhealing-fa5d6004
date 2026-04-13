import React, {
  createContext, useContext, useState, useEffect,
  type ReactNode,
} from 'react';
import {
  Sparkles, Zap, Map, X, BookOpen, Heart, Shield, Sun,
  Droplets, Mountain, Flame, Wind, Star, Eye,
  Lock, Check, ChevronRight,
} from 'lucide-react';

export type PageName = 'Meditation' | 'Mantra' | 'Music' | 'Healing';
type ModeId = 'INTEGRATION' | 'ADMIN' | 'TEMPLE_LOCK';

interface SacredSite {
  id: string; name: string; reach: number; focus: string;
  color: string; icon: ReactNode; signature: string;
  primaryBenefit: string; science: string;
  instruction: string; experience: string;
}
interface AccessState {
  isAdmin: boolean; hasPremium: boolean; hasTempleLicense: boolean;
}
interface ResonanceCtx {
  selectedSite: SacredSite; setSelectedSite: (s: SacredSite) => void;
  auraIntensity: number; setAuraIntensity: (v: number) => void;
  currentMode: ModeId; setCurrentMode: (m: ModeId) => void;
  access: AccessState; isSyncing: boolean;
}

const ADMIN_EMAILS: string[] = [
  'sacredhealingvibe@gmail.com',
];

export const SACRED_SITES: SacredSite[] = [
  { id: 'giza', name: 'Giza', reach: 50, focus: 'Spinal Alignment', color: '#FFD700', icon: <Mountain size={16} />, signature: 'GIZA_TORSION', primaryBenefit: 'Spinal Alignment', science: 'Torsion Field Concentration', instruction: 'Visualize a golden pillar of light passing through your spine from crown to root.', experience: 'A sense of vertical alignment and profound structural integrity.' },
  { id: 'arunachala', name: 'Arunachala', reach: 45, focus: 'Self-Inquiry / Silence', color: '#F5DEB3', icon: <Eye size={16} />, signature: 'STILLNESS_FIELD', primaryBenefit: 'Self-Inquiry & Silence', science: 'Vibrational Stillness Field', instruction: 'Rest in the "I AM" presence. Let all thoughts dissolve into the source.', experience: 'The mind becoming quiet and the heart expanding.' },
  { id: 'uluru', name: 'Uluru', reach: 40, focus: 'Grounding / Ancestral DNA', color: '#B22222', icon: <Mountain size={16} />, signature: 'DREAMTIME_SYNC', primaryBenefit: 'Grounding / Ancestral DNA', science: 'Deep Earth Torsion / Dreamtime Frequency', instruction: "Sink deep into the red earth. Feel your roots touching the planet's core.", experience: 'Intense grounding; a feeling of being held by the Earth.' },
  { id: 'zimbabwe', name: 'Great Zimbabwe', reach: 40, focus: 'Ancestral Strength', color: '#8B4513', icon: <Shield size={16} />, signature: 'ANCESTRAL_STRENGTH', primaryBenefit: 'Ancestral Strength', science: 'Ancient Stone Resonance', instruction: "Feel the strength of the ancient stones grounding you into the Earth's core.", experience: 'A feeling of ancestral support and solid foundation.' },
  { id: 'machu_picchu', name: 'Machu Picchu', reach: 35, focus: 'Solar Vitality', color: '#FFA500', icon: <Sun size={16} />, signature: 'SOLAR_SYNC', primaryBenefit: 'Solar Vitality', science: 'Geomagnetic Solar Sync', instruction: 'Breathe the golden sun into your Solar Plexus. Feel your power expanding.', experience: 'A surge of vitality and manifestation energy.' },
  { id: 'mansarovar', name: 'Lake Mansarovar', reach: 30, focus: 'Mental Detox', color: '#00CED1', icon: <Droplets size={16} />, signature: 'MENTAL_DETOX', primaryBenefit: 'Mental Detox', science: 'Crystalline Lake Sync', instruction: 'Visualize the crystal-clear Himalayan waters purifying your Crown chakra.', experience: 'Mental clarity and a sense of pure, high-altitude air.' },
  { id: 'luxor', name: 'Luxor Temples', reach: 30, focus: 'Ka / Hand Activation', color: '#FFCC00', icon: <Sparkles size={16} />, signature: 'KA_ACTIVATION', primaryBenefit: 'Ka / Hand Activation', science: 'Alchemical Gold / Structural Harmonic (528 Hz)', instruction: 'Breathe in the warm, alchemical gold light. Hold your palms open.', experience: 'A warm, solid sensation; feeling rebuilt from the inside out.' },
  { id: 'samadhi', name: 'Samadhi', reach: 25, focus: 'Aura Repair', color: '#E6E6FA', icon: <Star size={16} />, signature: 'AURA_REPAIR', primaryBenefit: 'Aura Repair', science: 'Zero-Point Resonance', instruction: 'Merge your awareness with the infinite void. There is no observer, only the observed.', experience: 'A feeling of dissolving into the infinite.' },
  { id: 'shasta', name: 'Mt. Shasta', reach: 20, focus: 'Light-Body Sync', color: '#DA70D6', icon: <Flame size={16} />, signature: 'LIGHT_BODY_SYNC', primaryBenefit: 'Light-Body Sync', science: 'Violet Ray / Lemurian Crystalline', instruction: 'Visualize a violet flame surrounding your body, burning away dense energies.', experience: 'A cool, breezy feeling in the aura; lifting of heavy emotional weights.' },
  { id: 'lourdes', name: 'Lourdes Grotto', reach: 20, focus: 'Physical Restoration', color: '#ADD8E6', icon: <Heart size={16} />, signature: 'WATER_RESONANCE', primaryBenefit: 'Physical Restoration', science: 'Divine Water Resonance', instruction: 'Imagine pure, healing water flowing through your heart and blood vessels.', experience: 'A soothing, cooling sensation throughout the body.' },
  { id: 'babaji', name: "Babaji's Cave", reach: 20, focus: 'Kriya / Deep Sync', color: '#FFFFFF', icon: <Wind size={16} />, signature: 'KRIYA_SYNC', primaryBenefit: 'Kriya DNA Activation', science: 'Non-Local Crystalline Entrainment', instruction: 'Focus on the Third Eye and breathe "up and down" the spine slowly.', experience: 'Deep stillness and a sense of timeless presence.' },
];

const MODES: { id: ModeId; name: string; intensity: number; description: string }[] = [
  { id: 'INTEGRATION', name: 'Integration', intensity: 0.25, description: 'Normal Life: Maintains energy without high intensity.' },
  { id: 'ADMIN', name: 'Admin / Live', intensity: 1.0, description: 'Live Testing: Active only while the engine is running.' },
  { id: 'TEMPLE_LOCK', name: 'Temple Lock', intensity: 0.6, description: '24/7 Continuity: Keeps the house permanently anchored.' },
];

const ROOMS = [
  { name: 'Studio (Hub)', distance: 0 },
  { name: 'Living Room', distance: 8 },
  { name: 'Bedroom', distance: 12 },
  { name: 'Kitchen', distance: 18 },
  { name: 'Garden', distance: 25 },
];

function getAccess(email?: string | null, hasTierAccess?: boolean): AccessState {
  const isAdmin = !!email && ADMIN_EMAILS.includes(email);
  const fullAccess = isAdmin || !!hasTierAccess;
  return { isAdmin: fullAccess, hasPremium: fullAccess, hasTempleLicense: fullAccess };
}

function roomSaturation(distance: number, intensity: number) {
  return Math.max(intensity - distance * 3, 10);
}

const Ctx = createContext<ResonanceCtx | null>(null);
function useResonance() {
  const c = useContext(Ctx);
  if (!c) throw new Error('Wrap your app with <ResonanceProvider>');
  return c;
}

export function ResonanceProvider({ children, userEmail, hasTierAccess }: { children: ReactNode; userEmail?: string | null; hasTierAccess?: boolean }) {
  const access = getAccess(userEmail, hasTierAccess);
  const [selectedSite, setSelectedSite] = useState<SacredSite>(SACRED_SITES[0]);
  const [auraIntensity, setAuraIntensity] = useState(25);
  const [currentMode, setCurrentMode] = useState<ModeId>('INTEGRATION');
  const [isSyncing, setIsSyncing] = useState(false);
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

const btnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(212,175,55,0.3)', background: 'transparent', color: '#D4AF37', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', transition: 'all 0.2s', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { ...btnBase, border: 'none', opacity: 0.65, padding: '4px 0' };
const cardText: React.CSSProperties = { fontSize: 11, lineHeight: 1.6, margin: '0 0 6px', color: '#e2e8f0', opacity: 0.85 };
const cardHint: React.CSSProperties = { fontSize: 10, fontStyle: 'italic', color: '#D4AF37', opacity: 0.65, margin: 0 };

function GoldRule() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)', margin: '14px 0' }} />;
}
function SectionLbl({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', margin: '0 0 8px' }}>{children}</p>;
}
function TierChip({ label, color }: { label: string; color: string }) {
  return <span style={{ display: 'inline-block', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44` }}>{label}</span>;
}
function ActivationCard({ color, title, badge, children }: { color: string; title: string; badge?: string; children: ReactNode }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${color}33`, background: `${color}08`, padding: '12px 14px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{title}</span>
        {badge && <TierChip label={badge} color={color} />}
      </div>
      {children}
    </div>
  );
}

function SiteSelector({ onInfo }: { onInfo: (s: SacredSite) => void }) {
  const { selectedSite, setSelectedSite } = useResonance();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLbl>☯ Sacred Site</SectionLbl>
        <button onClick={() => onInfo(selectedSite)} style={btnGhost}><BookOpen size={12} /> Context</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {SACRED_SITES.map(site => {
          const active = selectedSite.id === site.id;
          return (
            <button key={site.id} onClick={() => setSelectedSite(site)} style={{ ...btnBase, flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 6px', borderColor: active ? site.color : 'rgba(212,175,55,0.15)', background: active ? `${site.color}16` : 'rgba(255,255,255,0.02)', boxShadow: active ? `0 0 12px ${site.color}44` : 'none', color: active ? site.color : 'rgba(212,175,55,0.45)' }}>
              {site.icon}
              <span style={{ fontSize: 8, fontWeight: 700 }}>{site.name}</span>
              <span style={{ fontSize: 7, opacity: 0.5 }}>{site.reach}m</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: `${selectedSite.color}0a`, border: `1px solid ${selectedSite.color}22` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: selectedSite.color }}>{selectedSite.name}</span>
        <span style={{ fontSize: 9, opacity: 0.5, color: '#D4AF37' }}>Reach: {selectedSite.reach}m</span>
      </div>
    </div>
  );
}

export function AuraSlider() {
  const { auraIntensity, setAuraIntensity, selectedSite } = useResonance();
  return (
    <div style={{ margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <SectionLbl>✦ Aura Intensity</SectionLbl>
        <span style={{ fontSize: 18, fontWeight: 800, color: selectedSite.color, fontVariantNumeric: 'tabular-nums' }}>{auraIntensity}%</span>
      </div>
      <input type="range" min={0} max={100} value={auraIntensity} onChange={e => setAuraIntensity(+e.target.value)} style={{ width: '100%', accentColor: selectedSite.color, cursor: 'pointer', height: 4 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(212,175,55,0.35)', marginTop: 4 }}>
        <span>Subtle</span>
        <span>Immersive</span>
      </div>
    </div>
  );
}

function ModeSelector({ setShowUpsell }: { setShowUpsell: (v: boolean) => void }) {
  const { currentMode, setCurrentMode, setAuraIntensity, access } = useResonance();
  const handleMode = (id: ModeId) => {
    if (id === 'TEMPLE_LOCK' && !access.hasTempleLicense) { setShowUpsell(true); return; }
    setCurrentMode(id);
    setAuraIntensity(Math.round((MODES.find(m => m.id === id)?.intensity ?? 0.25) * 100));
  };
  const active = MODES.find(m => m.id === currentMode)!;
  return (
    <div style={{ margin: '14px 0' }}>
      <SectionLbl>⚡ Resonance Mode</SectionLbl>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => handleMode(m.id)} style={{ ...btnBase, position: 'relative', padding: '8px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', justifyContent: 'center', background: currentMode === m.id ? '#D4AF37' : 'transparent', color: currentMode === m.id ? '#000' : 'rgba(212,175,55,0.5)', borderColor: currentMode === m.id ? '#D4AF37' : 'rgba(212,175,55,0.2)' }}>
            {m.name}
            {m.id === 'TEMPLE_LOCK' && !access.hasTempleLicense && <Lock size={8} style={{ position: 'absolute', top: 3, right: 3, opacity: 0.5 }} />}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 10, color: 'rgba(212,175,55,0.45)', margin: 0 }}>{active.description}</p>
    </div>
  );
}

export function HealingActivations() {
  const { selectedSite, auraIntensity, access } = useResonance();
  const isBliss = auraIntensity > 90;
  const isBabajiDeep = selectedSite.id === 'babaji' && auraIntensity > 70;
  const isBabajiHeart = selectedSite.id === 'babaji' && auraIntensity > 85;
  const isLuxor = selectedSite.id === 'luxor' && auraIntensity > 70;
  const isLuxorFull = selectedSite.id === 'luxor' && auraIntensity > 90 && access.hasTempleLicense;
  const hasAny = isBliss || isBabajiDeep || isBabajiHeart || isLuxor || isLuxorFull;
  const protocols = [
    { label: 'Bliss State', hint: 'Any > 90%', active: isBliss },
    { label: 'Babaji Deep', hint: "Babaji's > 70%", active: isBabajiDeep },
    { label: 'Heart Expansion', hint: "Babaji's > 85%", active: isBabajiHeart },
    { label: 'Luxor Healer', hint: 'Luxor > 70%', active: isLuxor },
    { label: 'Luxor Vitality', hint: 'Luxor > 90% + €499', active: isLuxorFull },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
        {protocols.map(p => (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: `1px solid ${p.active ? '#10b981' : 'rgba(212,175,55,0.1)'}`, background: p.active ? 'rgba(16,185,129,0.08)' : 'transparent' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.active ? '#10b981' : 'rgba(212,175,55,0.2)', boxShadow: p.active ? '0 0 6px #10b981' : 'none' }} />
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: p.active ? '#10b981' : 'rgba(212,175,55,0.4)', margin: 0 }}>{p.label}</p>
              <p style={{ fontSize: 7, color: 'rgba(212,175,55,0.3)', margin: 0 }}>{p.hint}</p>
            </div>
          </div>
        ))}
      </div>
      {isBliss && <ActivationCard color="#10b981" title="Bliss State" badge="ACTIVE"><p style={cardText}>Your aura is aligning with the Sacred Site. Breathe deeply into your spine.</p><p style={cardHint}>Enjoy the tingling. You are safe and grounded.</p></ActivationCard>}
      {isBabajiDeep && <ActivationCard color="#818cf8" title="Babaji Deep Sync" badge="KRIYA"><p style={cardText}>{['Subtle Body Vibration', 'Deep Relaxation', 'Third Eye Pressure'].map(s => <span key={s} style={{ display: 'inline-block', fontSize: 9, padding: '2px 8px', borderRadius: 99, background: 'rgba(129,140,248,0.12)', color: '#818cf8', marginRight: 4 }}>{s}</span>)}</p><p style={cardHint}>Do not resist the sleepiness. Your aura is restructuring.</p></ActivationCard>}
      {isBabajiHeart && <ActivationCard color="#f472b6" title="Heart Expansion" badge="BHAKTI"><p style={cardText}>Relax your chest muscles. Visualize golden light dissolving old barriers.</p><p style={cardHint}>"The Master resides in the cave of the heart."</p></ActivationCard>}
      {isLuxor && <ActivationCard color="#fbbf24" title="Luxor Ka Activation" badge="HEALER"><p style={cardText}>Activation: Palms · Forearms · Hands & Legs</p><p style={cardHint}>Place your hands on the area needing healing, or hold palms open to radiate.</p></ActivationCard>}
      {isLuxorFull && <ActivationCard color="#34d399" title="Full Vitality Dashboard" badge="€499">{[{ l: 'Physical Body', v: '98% — High Vitality', c: '#fff' }, { l: 'Mental Clarity', v: '100% — Focused', c: '#fff' }, { l: 'Emotional State', v: 'Radiant Laughter', c: '#6ee7b7' }, { l: 'Grounding', v: 'OPTIMAL', c: '#34d399' }].map(m => <div key={m.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(52,211,153,0.1)' }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{m.l}</span><span style={{ fontSize: 10, fontWeight: 700, color: m.c }}>{m.v}</span></div>)}</ActivationCard>}
      {!hasAny && <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.4 }}><p style={{ fontSize: 11, fontWeight: 600, color: '#D4AF37', margin: '0 0 4px' }}>No Active Protocols</p><p style={{ fontSize: 9, color: 'rgba(212,175,55,0.4)', margin: 0 }}>Increase intensity or select Luxor / Babaji's Cave</p></div>}
    </div>
  );
}

export function SanctuaryDashboard({ setShowUpsell }: { setShowUpsell: (v: boolean) => void }) {
  const { selectedSite, auraIntensity, access, currentMode } = useResonance();
  const [anchored, setAnchored] = useState(false);
  const [since, setSince] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('');
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    if (!anchored || !since) { setElapsed(''); return; }
    const iv = setInterval(() => { const s = Math.floor((Date.now() - since.getTime()) / 1000); setElapsed(`${Math.floor(s / 60)}m ${s % 60}s`); }, 1000);
    return () => clearInterval(iv);
  }, [anchored, since]);
  const handleAnchor = () => {
    if (!access.hasTempleLicense) { setShowUpsell(true); return; }
    if (!anchored) { setAnchored(true); setSince(new Date()); } else { setAnchored(false); setSince(null); }
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLbl>🏛️ Sanctuary Dashboard</SectionLbl>
        <TierChip label={access.hasTempleLicense ? 'LICENSED' : 'FREE'} color={access.hasTempleLicense ? '#10b981' : '#D4AF37'} />
      </div>
      <div style={{ borderRadius: 12, border: '1px solid rgba(212,175,55,0.15)', padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', margin: '0 0 2px' }}>🔐 Temple Lock · 24/7</p>
            <p style={{ fontSize: 9, color: 'rgba(212,175,55,0.45)', margin: 0 }}>{anchored ? `Active ${elapsed} — anchored to ${selectedSite.name}` : 'Activate to maintain continuous resonance field'}</p>
          </div>
          <button onClick={handleAnchor} style={{ ...btnBase, fontSize: 9, padding: '6px 14px', background: anchored ? '#D4AF37' : 'transparent', color: anchored ? '#000' : '#D4AF37' }}>{anchored ? '🟡 Anchored' : 'Activate'}</button>
        </div>
        {anchored && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>{[['Site', selectedSite.name], ['Mode', currentMode], ['Intensity', `${auraIntensity}%`]].map(([l, v]) => <div key={l} style={{ textAlign: 'center', padding: '6px 0', borderRadius: 8, background: 'rgba(212,175,55,0.05)' }}><p style={{ fontSize: 7, color: 'rgba(212,175,55,0.4)', margin: '0 0 2px' }}>{l}</p><p style={{ fontSize: 10, fontWeight: 700, color: '#D4AF37', margin: 0 }}>{v}</p></div>)}</div>}
      </div>
      <button onClick={() => setShowMap(s => !s)} style={{ ...btnGhost, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span><Map size={12} /> Spatial Saturation Map</span>
        <ChevronRight size={12} style={{ transform: showMap ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {showMap && (
        <div style={{ marginTop: 10 }}>
          <div style={{ position: 'relative', width: '100%', height: 120, borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 }}>
            {[1, 0.62, 0.36].map((scale, i) => { const r = Math.round(selectedSite.reach * (auraIntensity / 100) * scale); return <div key={i} style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: '50%', border: `1px solid ${selectedSite.color}${i === 0 ? '40' : '20'}`, background: i === 0 ? `radial-gradient(circle, ${selectedSite.color}12, transparent)` : 'none' }}>{i === 0 && <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: selectedSite.color, opacity: 0.6 }}>{r}m</span>}</div>; })}
            <div style={{ position: 'relative', zIndex: 1, color: selectedSite.color }}>{selectedSite.icon}</div>
          </div>
          {ROOMS.map(room => { const sat = roomSaturation(room.distance, auraIntensity); const state = sat > 85 ? 'CORE_PEAK' : sat > 50 ? 'HIGH_COHERENCE' : 'INTEGRATION'; const stateColor = state === 'CORE_PEAK' ? '#10b981' : state === 'HIGH_COHERENCE' ? '#38bdf8' : 'rgba(212,175,55,0.3)'; return <div key={room.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid rgba(212,175,55,0.06)' }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{room.name}</span><span style={{ fontSize: 9, fontWeight: 700, color: stateColor }}>{Math.round(sat)}% <span style={{ fontSize: 7, opacity: 0.6 }}>{state.replace('_', ' ')}</span></span></div>; })}
        </div>
      )}
      {!access.hasTempleLicense && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(212,175,55,0.2)', background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))', textAlign: 'center' }}>
          <Lock size={16} style={{ color: '#D4AF37', margin: '0 auto 6px', opacity: 0.5 }} />
          <p style={{ fontSize: 10, fontWeight: 700, color: '#D4AF37', margin: '0 0 2px', letterSpacing: '0.1em' }}>TEMPLE HOME LICENSE</p>
          <p style={{ fontSize: 9, color: 'rgba(212,175,55,0.45)', margin: '0 0 8px' }}>€499 one-time to unlock</p>
          <button onClick={() => setShowUpsell(true)} style={{ ...btnBase, marginTop: 4, padding: '6px 16px', fontSize: 10, background: '#D4AF37', color: '#000' }}>Upgrade</button>
        </div>
      )}
    </div>
  );
}

function UpsellModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', maxWidth: 400, width: '100%', borderRadius: 16, border: '1px solid rgba(212,175,55,0.3)', background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)', padding: '32px 24px', textAlign: 'center' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={16} /></button>
        <p style={{ fontSize: 32, margin: '0 0 8px' }}>🏛️</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#D4AF37', margin: '0 0 8px', letterSpacing: '0.08em' }}>Temple Home License</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.6 }}>Transform your living space into a permanent resonance portal.</p>
        <div style={{ textAlign: 'left', marginBottom: 20 }}>
          {['Spatial Saturation Map', 'Multi-Room Anchor', 'Intensity Master Slider', '24/7 Continuity Lock', 'Sanctuary Dashboard'].map(f => <p key={f} style={{ fontSize: 11, color: '#e2e8f0', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}><Check size={12} style={{ color: '#10b981' }} />{f}</p>)}
        </div>
        <button style={{ ...btnBase, width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 13, fontWeight: 700, background: '#D4AF37', color: '#000', borderColor: '#D4AF37' }}>Upgrade for €499</button>
        <button onClick={onClose} style={{ ...btnGhost, margin: '12px auto 0', fontSize: 10 }}>Continue with Audio Only</button>
      </div>
    </div>
  );
}

function SiteInfoModal({ site, onClose }: { site: SacredSite; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', maxWidth: 420, width: '100%', borderRadius: 16, border: `1px solid ${site.color}33`, background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)', padding: '28px 24px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={16} /></button>
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.4)', margin: '0 0 6px' }}>Vibrational Signature · {site.signature}</p>
        <p style={{ fontSize: 20, fontWeight: 700, color: site.color, margin: '0 0 16px' }}>{site.name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div><p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(212,175,55,0.4)', margin: '0 0 2px', textTransform: 'uppercase' }}>Primary Benefit</p><p style={{ fontSize: 11, color: '#e2e8f0', margin: 0 }}>{site.primaryBenefit}</p></div>
          <div><p style={{ fontSize: 8, fontWeight: 700, color: 'rgba(212,175,55,0.4)', margin: '0 0 2px', textTransform: 'uppercase' }}>Science</p><p style={{ fontSize: 11, color: '#e2e8f0', margin: 0 }}>{site.science}</p></div>
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: `${site.color}0a`, border: `1px solid ${site.color}22`, marginBottom: 14 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: site.color, margin: '0 0 6px' }}>⚡ Sacred Instruction</p>
          <p style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>{site.instruction}</p>
        </div>
        <p style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(212,175,55,0.5)', lineHeight: 1.6, margin: '0 0 16px' }}>{site.experience}</p>
        <button onClick={onClose} style={{ ...btnBase, width: '100%', justifyContent: 'center', fontSize: 11 }}>Return to Meditation</button>
      </div>
    </div>
  );
}

export function ResonancePanel({ page }: { page: PageName }) {
  const { selectedSite, auraIntensity, isSyncing, access } = useResonance();
  const [tab, setTab] = useState<'controls' | 'healing' | 'sanctuary'>('controls');
  const [showUpsell, setShowUpsell] = useState(false);
  const [infoSite, setInfoSite] = useState<SacredSite | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const tabs = [{ id: 'controls' as const, label: '☯ Portal' }, { id: 'healing' as const, label: '✦ Healing' }, { id: 'sanctuary' as const, label: '🏛️ Sanctuary' }];
  return (
    <>
      <style>{`@keyframes sacredPulse{0%,100%{opacity:1}50%{opacity:0.7}}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${selectedSite.color};cursor:pointer}input[type=range]{-webkit-appearance:none;height:4px;border-radius:99px;outline:none;background:rgba(212,175,55,0.15)}`}</style>
      <div style={{ borderRadius: 16, border: '1px solid rgba(212,175,55,0.15)', background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(5,5,5,0.98) 100%)', backdropFilter: 'blur(12px)', overflow: 'hidden', fontFamily: 'inherit' }}>
        <div onClick={() => setCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid rgba(212,175,55,0.15)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.06em' }}>Resonance Engine</span>
            <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.35)' }}>· {page}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSyncing ? '#fbbf24' : '#10b981', animation: isSyncing ? 'sacredPulse 1s ease infinite' : 'none', boxShadow: `0 0 6px ${isSyncing ? '#fbbf24' : '#10b981'}` }} />
              <span style={{ fontSize: 8, fontWeight: 600, color: isSyncing ? '#fbbf24' : '#10b981' }}>{isSyncing ? 'Syncing' : 'Locked'}</span>
            </div>
            {access.isAdmin && <TierChip label="ADMIN" color="#818cf8" />}
            <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.3)' }}>{collapsed ? '▼' : '▲'}</span>
          </div>
        </div>
        {!collapsed && (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
              {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t.id ? '#D4AF37' : 'transparent'}`, background: 'transparent', color: tab === t.id ? '#D4AF37' : 'rgba(212,175,55,0.3)', transition: 'all 0.2s' }}>{t.label}</button>)}
            </div>
            <div style={{ padding: 18 }}>
              {tab === 'controls' && <><SiteSelector onInfo={s => setInfoSite(s)} /><GoldRule /><AuraSlider /><GoldRule /><ModeSelector setShowUpsell={setShowUpsell} /></>}
              {tab === 'healing' && <HealingActivations />}
              {tab === 'sanctuary' && <SanctuaryDashboard setShowUpsell={setShowUpsell} />}
            </div>
          </>
        )}
      </div>
      {showUpsell && <UpsellModal onClose={() => setShowUpsell(false)} />}
      {infoSite && <SiteInfoModal site={infoSite} onClose={() => setInfoSite(null)} />}
    </>
  );
}

// Gated wrapper: only renders for premium members / admins
export function GatedResonancePanel({ page }: { page: PageName }) {
  // We import these lazily to avoid circular deps - consumers must have auth context
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setChecked(true); return; }

        // Check admin
        const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (isAdmin === true) { setShow(true); setChecked(true); return; }

        // Check premium membership
        const { data } = await supabase.functions.invoke('check-membership-subscription');
        if (data?.subscribed && data?.tier !== 'free') { setShow(true); }
        setChecked(true);
      } catch { setChecked(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!checked || !show) return null;
  return <ResonancePanel page={page} />;
}
