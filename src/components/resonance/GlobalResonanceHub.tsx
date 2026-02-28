import React, {
  createContext, useContext, useState, useEffect, useRef,
  type ReactNode, type CSSProperties,
} from 'react';
import { Home, Lock, Zap, Map, ChevronDown, Check, Star, Globe, Sparkles, Activity } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 1. SITE REGISTRY (23 sites)
// ─────────────────────────────────────────────────────────────
export type SiteCategory = 'Supreme' | 'Earth' | 'Temporal' | 'Ancient' | 'Galactic';
export type VisualEffect =
  | 'kailash_shimmer' | 'gold_pulse' | 'red_vortex' | 'solar_ripples'
  | 'avalon_mist' | 'torsion_field' | 'dreamtime' | 'ancestral'
  | 'solar_sync' | 'crystal_lake' | 'ka_gold' | 'zero_point'
  | 'violet_ray' | 'water_flow' | 'kriya_light'
  | 'lotus_petals' | 'saffron_shield'
  | 'tropical_aqua' | 'liquid_geometry'
  | 'diamond_sparkle' | 'double_sun' | 'violet_grid' | 'white_fire';

export interface SacredSite {
  id: string;
  name: string;
  subtitle?: string;
  category: SiteCategory;
  multiplier?: number;
  color: string;
  glow: string;         // rgba for box-shadow
  reach: number | 'Infinite';
  resonance?: string;
  focus: string;
  instruction: string;
  experience: string;
  visualEffect: VisualEffect;
  signature?: string;
  // Globe position (percentage of globe canvas, 0-100)
  globeX: number;
  globeY: number;
}

export const ALL_SITES: SacredSite[] = [
  // ── SUPREME ──────────────────────────────────────────────
  {
    id:'kailash', name:'Mount Kailash', subtitle:'Supreme Portal · 13X',
    category:'Supreme', multiplier:13,
    color:'#7B61FF', glow:'rgba(123,97,255,0.55)', reach:100,
    resonance:'7.83Hz Schumann', focus:'Moksha / Total Purification',
    instruction:'Feel the axis of the cosmos running through your spine. You are the mountain.',
    experience:'Trembling stillness. The mind dissolves. Moksha beckons.',
    visualEffect:'kailash_shimmer', globeX:68, globeY:28,
  },
  {
    id:'glastonbury', name:'Glastonbury', subtitle:'Avalon — Heart Gate',
    category:'Supreme', color:'#00FF7F', glow:'rgba(0,255,127,0.45)', reach:40,
    resonance:'Heart-Gate Activation', focus:'Divine Love & Emotional Restoration',
    instruction:'Open your chest like a flower. Feel all barriers dissolve in green light.',
    experience:'Warmth flooding the heart. Ancient grief releasing.',
    visualEffect:'avalon_mist', globeX:46, globeY:22,
  },
  {
    id:'sedona', name:'Sedona Vortex', subtitle:'Red Rock Spiral',
    category:'Supreme', color:'#FF4500', glow:'rgba(255,69,0,0.5)', reach:35,
    resonance:'Magnetic Spiral', focus:'Psychic Vision & Ability Activation',
    instruction:'Spin your awareness clockwise from the base of your skull. Open the third eye.',
    experience:'Visions. Electrical tingling in the forehead.',
    visualEffect:'red_vortex', globeX:18, globeY:30,
  },
  {
    id:'titicaca', name:'Lake Titicaca', subtitle:'Solar Birthplace',
    category:'Supreme', color:'#FFD700', glow:'rgba(255,215,0,0.5)', reach:45,
    resonance:'Sacral Birthplace Frequency', focus:'Creative Rebirth & Manifestation',
    instruction:'Breathe golden light into your sacral center. You are birthing a new reality.',
    experience:'Creative energy surging. Visions of golden water.',
    visualEffect:'solar_ripples', globeX:26, globeY:58,
  },
  // ── EARTH (original 11) ───────────────────────────────────
  {
    id:'giza', name:'Giza Pyramids', category:'Earth',
    color:'#FFD700', glow:'rgba(255,215,0,0.45)', reach:50,
    resonance:'Torsion Field', focus:'Spinal Alignment',
    instruction:'Visualize a golden pillar of light passing through your spine from crown to root.',
    experience:'A sense of vertical alignment and profound structural integrity.',
    visualEffect:'torsion_field', globeX:57, globeY:32,
  },
  {
    id:'arunachala', name:'Arunachala', category:'Earth',
    color:'#F5DEB3', glow:'rgba(245,222,179,0.4)', reach:45,
    resonance:'Stillness Field', focus:'Self-Inquiry / Silence',
    instruction:'Rest in the "I AM" presence. Let all thoughts dissolve into the source.',
    experience:'The mind becoming quiet and the heart expanding.',
    visualEffect:'gold_pulse', globeX:65, globeY:38,
  },
  {
    id:'uluru', name:'Uluru', category:'Earth',
    color:'#B22222', glow:'rgba(178,34,34,0.45)', reach:40,
    resonance:'Dreamtime Frequency', focus:'Grounding / Ancestral DNA',
    instruction:"Sink deep into the red earth. Feel your roots touching the planet's core.",
    experience:'Intense grounding; a feeling of being held by the Earth.',
    visualEffect:'dreamtime', globeX:77, globeY:64,
  },
  {
    id:'zimbabwe', name:'Great Zimbabwe', category:'Earth',
    color:'#8B4513', glow:'rgba(139,69,19,0.45)', reach:40,
    resonance:'Ancient Stone', focus:'Ancestral Strength',
    instruction:"Feel the strength of the ancient stones grounding you into the Earth's core.",
    experience:'A feeling of ancestral support and solid foundation.',
    visualEffect:'ancestral', globeX:58, globeY:58,
  },
  {
    id:'machu_picchu', name:'Machu Picchu', category:'Earth',
    color:'#FFA500', glow:'rgba(255,165,0,0.45)', reach:35,
    resonance:'Solar Sync', focus:'Solar Vitality',
    instruction:'Breathe the golden sun into your Solar Plexus. Feel your power expanding.',
    experience:'A surge of vitality and manifestation energy.',
    visualEffect:'solar_sync', globeX:24, globeY:55,
  },
  {
    id:'mansarovar', name:'Lake Mansarovar', category:'Earth',
    color:'#00CED1', glow:'rgba(0,206,209,0.45)', reach:30,
    resonance:'Crystalline Lake', focus:'Mental Detox',
    instruction:'Visualize the crystal-clear Himalayan waters purifying your Crown chakra.',
    experience:'Mental clarity and a sense of pure, high-altitude air.',
    visualEffect:'crystal_lake', globeX:67, globeY:30,
  },
  {
    id:'luxor', name:'Luxor Temples', subtitle:'Molten Gold · 528Hz',
    category:'Earth', color:'#FFCC00', glow:'rgba(255,204,0,0.5)', reach:30,
    resonance:'Alchemical Gold 528Hz', focus:'Ka / Hand Activation · Vitality Healer',
    instruction:'Breathe in the warm, alchemical gold light. Hold your palms open.',
    experience:'A warm, solid sensation; feeling rebuilt from the inside out.',
    visualEffect:'ka_gold', globeX:56, globeY:34,
  },
  {
    id:'samadhi', name:'Samadhi', category:'Earth',
    color:'#E6E6FA', glow:'rgba(230,230,250,0.35)', reach:25,
    resonance:'Zero-Point Field', focus:'Aura Repair',
    instruction:'Merge your awareness with the infinite void.',
    experience:'A feeling of dissolving into the infinite.',
    visualEffect:'zero_point', globeX:66, globeY:25,
  },
  {
    id:'shasta', name:'Mount Shasta', category:'Earth',
    color:'#DA70D6', glow:'rgba(218,112,214,0.45)', reach:20,
    resonance:'Violet Ray', focus:'Light-Body Sync',
    instruction:'Visualize a violet flame surrounding your body, burning away dense energies.',
    experience:'A cool, breezy feeling in the aura; lifting of heavy emotional weights.',
    visualEffect:'violet_ray', globeX:16, globeY:28,
  },
  {
    id:'lourdes', name:'Lourdes Grotto', category:'Earth',
    color:'#ADD8E6', glow:'rgba(173,216,230,0.4)', reach:20,
    resonance:'Divine Water', focus:'Physical Restoration',
    instruction:'Imagine pure, healing water flowing through your heart and blood vessels.',
    experience:'A soothing, cooling sensation throughout the body.',
    visualEffect:'water_flow', globeX:47, globeY:25,
  },
  {
    id:'babaji', name:"Babaji's Cave", category:'Earth',
    color:'#C8C8FF', glow:'rgba(200,200,255,0.4)', reach:20,
    resonance:'Kriya Sync', focus:'Kriya / Deep Sync',
    instruction:'Focus on the Third Eye and breathe "up and down" the spine slowly.',
    experience:'Deep stillness and a sense of timeless presence.',
    visualEffect:'kriya_light', globeX:64, globeY:32,
  },
  // ── TEMPORAL ─────────────────────────────────────────────
  {
    id:'vrindavan', name:'Ancient Vrindavan', subtitle:'Era of Krishna',
    category:'Temporal', color:'#1E90FF', glow:'rgba(30,144,255,0.5)', reach:75,
    resonance:'Premananda Frequency', focus:'Premananda — Supreme Bliss',
    instruction:'Chant His name softly in your heart. The flute is always playing.',
    experience:'Waves of inexplicable love and joy. Peacock feathers in the mind.',
    visualEffect:'lotus_petals', globeX:65, globeY:34,
  },
  {
    id:'ayodhya', name:'Ancient Ayodhya', subtitle:'Era of Rama & Hanuman',
    category:'Temporal', color:'#FFA500', glow:'rgba(255,165,0,0.5)', reach:75,
    resonance:'Dharma Shield', focus:'Dharma & Divine Protection',
    instruction:'Chant "Jai Shri Ram" internally. Feel an orange shield of protection around you.',
    experience:'Unshakeable strength. A golden shield of protection envelops you.',
    visualEffect:'saffron_shield', globeX:65, globeY:33,
  },
  // ── ANCIENT ──────────────────────────────────────────────
  {
    id:'lemuria', name:'Lemuria (Mu)', subtitle:'Lost Civilization',
    category:'Ancient', color:'#40E0D0', glow:'rgba(64,224,208,0.45)', reach:60,
    resonance:'Heartbeat Pulse', focus:'Maternal Creation & Emotional Purity',
    instruction:'Feel the warm ocean beneath you. Let your heart lead every breath.',
    experience:'A feeling of primal safety, warmth, and belonging.',
    visualEffect:'tropical_aqua', globeX:25, globeY:50,
  },
  {
    id:'atlantis', name:'Atlantis (Poseidia)', subtitle:'Lost Civilization',
    category:'Ancient', color:'#4169E1', glow:'rgba(65,105,225,0.5)', reach:60,
    resonance:'Crystal Technology', focus:'Advanced Crystal Technology & Mental Breakthroughs',
    instruction:'Visualize a perfect crystal at your third eye. Feel the geometric activation.',
    experience:'Rapid mental clarity. Geometric light patterns in the mind.',
    visualEffect:'liquid_geometry', globeX:38, globeY:28,
  },
  // ── GALACTIC ─────────────────────────────────────────────
  {
    id:'pleiades', name:'Pleiades', subtitle:'Star System — Diamond Light',
    category:'Galactic', color:'#E0FFFF', glow:'rgba(224,255,255,0.45)', reach:'Infinite',
    resonance:'Diamond White Light', focus:'Starlight Harmony & Creative Production',
    instruction:'Look inward at the star behind your eyes. Feel the stardust in your cells.',
    experience:'A shower of diamond light. Creativity igniting in every cell.',
    visualEffect:'diamond_sparkle', globeX:50, globeY:50,
  },
  {
    id:'sirius', name:'Sirius', subtitle:'The Blue Star — Royal Wisdom',
    category:'Galactic', color:'#4169E1', glow:'rgba(65,105,225,0.55)', reach:'Infinite',
    resonance:'Royal Blue Initiation', focus:'Initiation & Ancient High-Wisdom',
    instruction:'See two blue suns rising in your mind. Receive the ancient initiation.',
    experience:'Sudden knowing. Ancient memories awakening. Royal dignity.',
    visualEffect:'double_sun', globeX:50, globeY:50,
  },
  {
    id:'arcturus', name:'Arcturus', subtitle:'Cellular Regeneration',
    category:'Galactic', color:'#9932CC', glow:'rgba(153,50,204,0.55)', reach:'Infinite',
    resonance:'10Hz Alpha Grid', focus:'Cellular Regeneration & High-Speed Healing',
    instruction:'Breathe violet light into every cell. The grid is activating your DNA.',
    experience:'Physical tingling everywhere. Deep cellular repair in process.',
    visualEffect:'violet_grid', globeX:50, globeY:50,
  },
  {
    id:'lyra', name:'Lyra', subtitle:'The Felines — Sound of Creation',
    category:'Galactic', color:'#FFFFFF', glow:'rgba(255,255,255,0.4)', reach:'Infinite',
    resonance:'Original Sound of Creation', focus:'Original Sound / Frequency of Creation',
    instruction:'Listen for the silence beneath all sound. That is the original note of creation.',
    experience:'White fire at the edges of reality. Pure tone in the mind.',
    visualEffect:'white_fire', globeX:50, globeY:50,
  },
];

// Group sites by category
export const SITE_GROUPS = {
  Supreme: ALL_SITES.filter(s => s.category === 'Supreme'),
  Earth:   ALL_SITES.filter(s => s.category === 'Earth'),
  Temporal:ALL_SITES.filter(s => s.category === 'Temporal'),
  Ancient: ALL_SITES.filter(s => s.category === 'Ancient'),
  Galactic:ALL_SITES.filter(s => s.category === 'Galactic'),
};

// ─────────────────────────────────────────────────────────────
// 2. GLOBAL CONTEXT
// ─────────────────────────────────────────────────────────────
const ADMIN_EMAILS = ['sacredhealingvibe@gmail.com'];

interface GlobalResonanceState {
  activeSite: SacredSite;
  setActiveSite: (s: SacredSite) => void;
  intensity: number;
  setIntensity: (v: number) => void;
  isTempleLocked: boolean;
  setTempleLocked: (v: boolean) => void;
  access: { isAdmin: boolean; hasPremium: boolean; hasTemple: boolean };
  isSyncing: boolean;
}

const GlobalCtx = createContext<GlobalResonanceState | null>(null);

export function useGlobalResonance() {
  const c = useContext(GlobalCtx);
  if (!c) throw new Error('Wrap your app with <GlobalResonanceProvider>');
  return c;
}

export function GlobalResonanceProvider({
  children,
  userEmail,
}: { children: ReactNode; userEmail?: string | null }) {
  const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail);
  const access = { isAdmin, hasPremium: isAdmin || false, hasTemple: isAdmin || false };

  const [activeSite, setActiveSiteRaw] = useState<SacredSite>(ALL_SITES[0]);
  const [intensity, setIntensity]      = useState(100);
  const [isTempleLocked, setTempleLocked] = useState(false);
  const [isSyncing, setIsSyncing]      = useState(false);

  const setActiveSite = (s: SacredSite) => {
    setActiveSiteRaw(s);
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 900);
  };

  return (
    <GlobalCtx.Provider value={{ activeSite, setActiveSite, intensity, setIntensity, isTempleLocked, setTempleLocked, access, isSyncing }}>
      {children}
    </GlobalCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. SITE VISUAL EFFECT OVERLAY
//    Drop <SiteEffectOverlay /> on Meditation, Mantra, Music, Healing pages
//    It renders the ambient background effect for the active site — no UI chrome
// ─────────────────────────────────────────────────────────────
export function SiteEffectOverlay() {
  const { activeSite, intensity } = useGlobalResonance();
  const opacity = intensity / 100;

  const effect = activeSite.visualEffect;

  return (
    <>
      <style>{`
        @keyframes shimmer    { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes vortexSpin { from{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.08)} to{transform:rotate(360deg) scale(1)} }
        @keyframes ripple     { 0%{transform:scale(0.8);opacity:0.7} 100%{transform:scale(2.5);opacity:0} }
        @keyframes lotusFloat { 0%{transform:translateY(-10px) rotate(0deg);opacity:0} 20%{opacity:0.8} 80%{opacity:0.6} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }
        @keyframes gridPulse  { 0%,100%{opacity:0.35} 50%{opacity:0.75} }
        @keyframes whiteFire  { 0%,100%{opacity:0.5;transform:scaleX(1)} 50%{opacity:0.9;transform:scaleX(1.03)} }
        @keyframes doubleGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes sparkle    { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
        @keyframes saffron    { 0%,100%{opacity:0.25} 50%{opacity:0.55} }
        @keyframes aquaHeart  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>

      {/* Base ambient glow — every site */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:`radial-gradient(ellipse 70% 55% at 50% 5%, ${activeSite.color}${Math.round(opacity * 28).toString(16).padStart(2,'0')} 0%, transparent 65%)`,
        transition:'background 1.2s ease',
      }} />

      {/* ── PER-EFFECT LAYERS ── */}

      {/* KAILASH: 7.83Hz shimmer — concentric violet rings */}
      {effect === 'kailash_shimmer' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              position:'absolute', left:'50%', top:'30%',
              width:`${200 + i*80}px`, height:`${200 + i*80}px`,
              marginLeft:`${-(100+i*40)}px`, marginTop:`${-(100+i*40)}px`,
              border:`1px solid rgba(123,97,255,${0.5 - i*0.1})`,
              borderRadius:'50%',
              animation:`shimmer ${2.5 + i*0.4}s ease-in-out ${i*0.3}s infinite`,
              boxShadow:`0 0 ${12+i*6}px rgba(123,97,255,0.3)`,
              opacity: opacity * 0.9,
            }} />
          ))}
        </div>
      )}

      {/* SEDONA: Red vortex spiral */}
      {effect === 'red_vortex' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, display:'flex', alignItems:'center', justifyContent:'center', opacity }}>
          <div style={{ width:400, height:400, borderRadius:'50%', border:'2px solid rgba(255,69,0,0.35)', animation:'vortexSpin 8s linear infinite', boxShadow:'0 0 60px rgba(255,69,0,0.2)' }} />
          <div style={{ position:'absolute', width:250, height:250, borderRadius:'50%', border:'1px solid rgba(255,69,0,0.25)', animation:'vortexSpin 5s linear infinite reverse' }} />
        </div>
      )}

      {/* SOLAR RIPPLES: Lake Titicaca / solar sites */}
      {(effect === 'solar_ripples' || effect === 'solar_sync') && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              position:'absolute', left:'50%', top:'50%',
              width:`${80+i*60}px`, height:`${80+i*60}px`,
              marginLeft:`${-(40+i*30)}px`, marginTop:`${-(40+i*30)}px`,
              borderRadius:'50%',
              border:`2px solid rgba(255,215,0,0.4)`,
              animation:`ripple 3s ease-out ${i*1}s infinite`,
              opacity: opacity * 0.7,
            }} />
          ))}
        </div>
      )}

      {/* LOTUS PETALS: Vrindavan */}
      {effect === 'lotus_petals' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden', opacity }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position:'absolute',
              left:`${8 + (i * 8)}%`,
              top: '-5%',
              fontSize:`${14 + (i%3)*6}px`,
              animation:`lotusFloat ${6 + (i%4)*2}s ease-in ${i * 0.6}s infinite`,
              filter:`drop-shadow(0 0 4px rgba(30,144,255,0.6))`,
            }}>
              🪷
            </div>
          ))}
        </div>
      )}

      {/* SAFFRON SHIELD: Ayodhya */}
      {effect === 'saffron_shield' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{
            width:'85vw', height:'85vw', maxWidth:500, maxHeight:500,
            borderRadius:'50%',
            background:'radial-gradient(circle, rgba(255,165,0,0.12) 0%, rgba(255,69,0,0.06) 50%, transparent 75%)',
            border:'2px solid rgba(255,165,0,0.3)',
            animation:'saffron 3s ease-in-out infinite',
            boxShadow:'0 0 80px rgba(255,165,0,0.15)',
            opacity,
          }} />
        </div>
      )}

      {/* TROPICAL AQUA: Lemuria */}
      {effect === 'tropical_aqua' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity }}>
          <div style={{
            position:'absolute', inset:0,
            background:'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(64,224,208,0.15) 0%, transparent 60%)',
            animation:'aquaHeart 4s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* LIQUID GEOMETRY: Atlantis — Metatron's Cube */}
      {effect === 'liquid_geometry' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, display:'flex', alignItems:'center', justifyContent:'center', opacity: opacity * 0.5 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position:'absolute',
              width:'180px', height:'180px',
              border:'1px solid rgba(65,105,225,0.4)',
              borderRadius:'4px',
              transform:`rotate(${i*30}deg)`,
              animation:`shimmer ${3+i*0.5}s ease-in-out ${i*0.2}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* DIAMOND SPARKLE: Pleiades */}
      {effect === 'diamond_sparkle' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden', opacity }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{
              position:'absolute',
              left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
              width:'4px', height:'4px', borderRadius:'50%',
              background:'white', boxShadow:'0 0 6px white',
              animation:`sparkle ${1.5 + (i%5)*0.4}s ease-in-out ${(i%7)*0.3}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* DOUBLE SUN: Sirius */}
      {effect === 'double_sun' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity }}>
          <div style={{ position:'absolute', left:'25%', top:'15%', width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(65,105,225,0.5) 0%, transparent 70%)', animation:'doubleGlow 3s ease-in-out infinite' }} />
          <div style={{ position:'absolute', right:'20%', top:'20%', width:80, height:80, borderRadius:'50%', background:'radial-gradient(circle, rgba(65,105,225,0.4) 0%, transparent 70%)', animation:'doubleGlow 3s ease-in-out 1.5s infinite' }} />
        </div>
      )}

      {/* VIOLET GRID: Arcturus */}
      {effect === 'violet_grid' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity: opacity * 0.55 }}>
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(153,50,204,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(153,50,204,0.3) 1px, transparent 1px)',
            backgroundSize:'40px 40px',
            animation:'gridPulse 2s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* WHITE FIRE: Lyra */}
      {effect === 'white_fire' && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity }}>
          {['top','bottom','left','right'].map(side => (
            <div key={side} style={{
              position:'absolute',
              [side]:0,
              ...(side==='top'||side==='bottom' ? { left:0, right:0, height:'12vh' } : { top:0, bottom:0, width:'6vw' }),
              background: side==='top' ? 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)'
                        : side==='bottom' ? 'linear-gradient(to top, rgba(255,255,255,0.2), transparent)'
                        : side==='left' ? 'linear-gradient(to right, rgba(255,255,255,0.2), transparent)'
                        : 'linear-gradient(to left, rgba(255,255,255,0.2), transparent)',
              animation:`whiteFire ${2+['top','bottom','left','right'].indexOf(side)*0.3}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. MINI GLOBE COMPONENT
// ─────────────────────────────────────────────────────────────
function MiniGlobe({ site, intensity }: { site: SacredSite; intensity: number }) {
  const isGalactic = site.category === 'Galactic';

  return (
    <div style={{ position:'relative', width:'100%', paddingBottom:'100%', maxWidth:300, margin:'0 auto' }}>
      <div style={{ position:'absolute', inset:0 }}>
        {/* Globe background */}
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background: isGalactic
            ? 'radial-gradient(circle at 35% 35%, #0a0a2e 0%, #000010 60%, #000005 100%)'
            : 'radial-gradient(circle at 35% 35%, #1a2a4a 0%, #0d1829 55%, #060d14 100%)',
          border:`1px solid ${site.color}44`,
          boxShadow:`0 0 40px ${site.glow}, inset 0 0 30px rgba(0,0,0,0.8)`,
          overflow:'hidden',
        }}>
          {/* Grid lines */}
          {!isGalactic && (
            <>
              {/* Latitude lines */}
              {[25,45,65,80].map(y => (
                <div key={y} style={{ position:'absolute', left:0, right:0, top:`${y}%`, height:1, background:'rgba(255,255,255,0.06)' }} />
              ))}
              {/* Longitude lines */}
              {[20,40,60,80].map(x => (
                <div key={x} style={{ position:'absolute', top:0, bottom:0, left:`${x}%`, width:1, background:'rgba(255,255,255,0.06)' }} />
              ))}
            </>
          )}

          {isGalactic && (
            /* Star field for galactic sites */
            <>
              {[...Array(30)].map((_, i) => (
                <div key={i} style={{
                  position:'absolute',
                  left:`${(i*37)%95+2}%`, top:`${(i*53)%90+2}%`,
                  width: i%5===0 ? '3px' : '1px',
                  height: i%5===0 ? '3px' : '1px',
                  borderRadius:'50%', background:'white',
                  opacity: 0.3 + (i%7)*0.1,
                  boxShadow: i%5===0 ? '0 0 4px white' : 'none',
                }} />
              ))}
            </>
          )}

          {/* Site dot — or for galactic: center star */}
          <div style={{
            position:'absolute',
            left: isGalactic ? '50%' : `${site.globeX}%`,
            top:  isGalactic ? '50%' : `${site.globeY}%`,
            transform:'translate(-50%,-50%)',
            zIndex:2,
          }}>
            <div style={{
              width: site.multiplier ? 14 : 10,
              height: site.multiplier ? 14 : 10,
              borderRadius:'50%',
              background: site.color,
              boxShadow:`0 0 ${12 + intensity/10}px ${site.color}`,
            }} />
            {/* Pulse ring */}
            <div style={{
              position:'absolute', inset:-8,
              borderRadius:'50%',
              border:`1px solid ${site.color}`,
              opacity:0.5,
              animation:'siteRingPulse 2s ease-out infinite',
            }} />
          </div>

          {/* Reach radius visualization */}
          {site.reach !== 'Infinite' && (
            <div style={{
              position:'absolute',
              left:`${site.globeX}%`, top:`${site.globeY}%`,
              transform:'translate(-50%,-50%)',
              width:`${(site.reach as number) * 1.8}px`,
              height:`${(site.reach as number) * 1.8}px`,
              borderRadius:'50%',
              border:`1px dashed ${site.color}55`,
              background:`${site.color}08`,
              maxWidth:'80%', maxHeight:'80%',
            }} />
          )}

          {/* Other site dots (dimmed) */}
          {ALL_SITES.filter(s => s.id !== site.id && s.category !== 'Galactic').slice(0,8).map(s => (
            <div key={s.id} style={{
              position:'absolute',
              left:`${s.globeX}%`, top:`${s.globeY}%`,
              transform:'translate(-50%,-50%)',
              width:5, height:5, borderRadius:'50%',
              background:s.color, opacity:0.3,
            }} />
          ))}

          {/* Connection lines from active site to nearby sites (only for Earth/Supreme) */}
          {!isGalactic && (
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {ALL_SITES.filter(s => s.id !== site.id && s.category !== 'Galactic').slice(0,4).map(s => (
                <line key={s.id}
                  x1={site.globeX} y1={site.globeY}
                  x2={s.globeX} y2={s.globeY}
                  stroke={site.color} strokeOpacity="0.15" strokeWidth="0.4"
                  strokeDasharray="1 2"
                />
              ))}
            </svg>
          )}
        </div>

        {/* Atmospheric glow ring */}
        <div style={{
          position:'absolute', inset:-8, borderRadius:'50%',
          background:`radial-gradient(circle, transparent 48%, ${site.color}22 65%, transparent 75%)`,
        }} />
      </div>

      <style>{`
        @keyframes siteRingPulse { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.6} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. SITE CARD BUTTON
// ─────────────────────────────────────────────────────────────
function SiteCard({ site, active, onClick }: { site: SacredSite; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:4, padding:'10px 6px',
      borderRadius:14,
      border:`1px solid ${active ? site.color : 'rgba(255,255,255,0.08)'}`,
      background: active ? `${site.color}18` : 'rgba(255,255,255,0.03)',
      boxShadow: active ? `0 0 16px ${site.glow}` : 'none',
      cursor:'pointer', transition:'all 0.25s',
      fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif",
    }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background: site.color, boxShadow:`0 0 6px ${site.color}`, flexShrink:0 }} />
      <span style={{ fontSize:8, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color: active ? site.color : 'rgba(255,255,255,0.4)', textAlign:'center', lineHeight:1.2 }}>
        {site.name.split(' ')[0]}
        {site.multiplier && <span style={{ display:'block', fontSize:7, color:site.color }}>{site.multiplier}X</span>}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. UPSELL MODAL
// ─────────────────────────────────────────────────────────────
function TempleUpsellModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(10px)' }} />
      <div style={{ position:'relative', width:'100%', maxWidth:340, background:'#0a0505', border:'2px solid #D4AF37', borderRadius:24, padding:30, textAlign:'center', fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif" }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', cursor:'pointer', color:'rgba(212,175,55,0.4)', fontSize:18 }}>✕</button>
        <Home size={32} style={{ color:'#D4AF37', marginBottom:14 }} />
        <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:300, letterSpacing:'0.2em', textTransform:'uppercase', color:'#D4AF37' }}>Temple Home License</h3>
        <p style={{ fontSize:11, color:'rgba(212,175,55,0.55)', lineHeight:1.7, margin:'0 0 18px' }}>
          Lock this planetary energy into your home 24/7. All 23 sites. Unlimited reach.
        </p>
        <div style={{ background:'rgba(0,0,0,0.5)', borderRadius:12, padding:14, textAlign:'left', marginBottom:18 }}>
          {['24/7 House Anchor — Cloud Locked','All 23 Sacred Sites Unlocked','Spatial Heat Map','Admin Access Override'].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', fontSize:11, color:'rgba(212,175,55,0.8)' }}>
              <Check size={10} color="#D4AF37" /> {f}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'13px 0', borderRadius:12, background:'#D4AF37', color:'#000', fontWeight:700, fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', border:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:10 }}>
          Activate for €499
        </button>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:'rgba(212,175,55,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'inherit' }}>
          Continue Without
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. MAIN SANCTUARY DASHBOARD
//    Add this to your Library page
// ─────────────────────────────────────────────────────────────
export function SanctuaryDashboard() {
  const { activeSite, setActiveSite, intensity, setIntensity, isTempleLocked, setTempleLocked, access, isSyncing } = useGlobalResonance();

  const [activeCategory, setActiveCategory] = useState<SiteCategory>('Supreme');
  const [showUpsell, setShowUpsell] = useState(false);
  const [anchorTimer, setAnchorTimer] = useState('');
  const anchorStart = useRef<Date | null>(null);

  // Temple lock timer
  useEffect(() => {
    if (!isTempleLocked) { setAnchorTimer(''); anchorStart.current = null; return; }
    if (!anchorStart.current) anchorStart.current = new Date();
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - anchorStart.current!.getTime()) / 1000);
      setAnchorTimer(`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
    }, 1000);
    return () => clearInterval(iv);
  }, [isTempleLocked]);

  const handleAnchor = () => {
    if (!access.hasTemple) { setShowUpsell(true); return; }
    setTempleLocked(!isTempleLocked);
  };

  const categories: SiteCategory[] = ['Supreme', 'Earth', 'Temporal', 'Ancient', 'Galactic'];
  const categoryColors: Record<SiteCategory, string> = {
    Supreme:'#7B61FF', Earth:'#D4AF37', Temporal:'#1E90FF', Ancient:'#40E0D0', Galactic:'#E0FFFF'
  };
  const categoryIcons: Record<SiteCategory, string> = {
    Supreme:'♛', Earth:'⊕', Temporal:'⟳', Ancient:'◈', Galactic:'✦'
  };

  return (
    <>
      <style>{`
        .sd * { box-sizing: border-box; }
        @keyframes sdPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.04)} }
        @keyframes sdGlow   { 0%,100%{box-shadow:0 0 30px rgba(212,175,55,0.1)} 50%{box-shadow:0 0 60px rgba(212,175,55,0.25)} }
        @keyframes sdSpin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sd-cat:hover       { opacity: 1 !important; }
        .sd-anchor:hover    { opacity: 0.88 !important; }
        input[type=range].sd-range { -webkit-appearance:none; width:100%; height:4px; border-radius:99px; outline:none; cursor:pointer; }
        input[type=range].sd-range::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; cursor:pointer; }
      `}</style>

      <div className="sd" style={{
        background:'rgba(0,0,0,0.6)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        border:'1px solid rgba(212,175,55,0.2)',
        borderRadius:24,
        overflow:'hidden',
        fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif",
        animation:'sdGlow 5s ease-in-out infinite',
      }}>

        {/* ── HEADER ── */}
        <div style={{ padding:'24px 20px 16px', textAlign:'center', borderBottom:'1px solid rgba(212,175,55,0.1)', background:'rgba(0,0,0,0.3)', position:'relative' }}>
          <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:300, letterSpacing:'0.25em', textTransform:'uppercase', color:'#D4AF37' }}>
            Sanctuary Dashboard
          </h1>
          <div style={{ fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(212,175,55,0.45)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background: isSyncing ? '#fbbf24' : '#10b981', animation: isSyncing ? 'sdPulse 1s infinite' : 'none' }} />
            {isSyncing ? 'Syncing...' : 'Global Grid Active'} · {ALL_SITES.length} Sites
          </div>
          {access.isAdmin && (
            <div style={{ position:'absolute', top:16, right:16, fontSize:8, color:'#D4AF37', border:'1px solid rgba(212,175,55,0.4)', padding:'2px 8px', borderRadius:4, letterSpacing:'0.12em' }}>ADMIN</div>
          )}
        </div>

        <div style={{ padding:'18px 18px 4px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* ── MINI GLOBE ── */}
          <div>
            <MiniGlobe site={activeSite} intensity={intensity} />
            {/* Globe label */}
            <div style={{ textAlign:'center', marginTop:10 }}>
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: activeSite.color }}>
                {activeSite.name}
              </div>
              {activeSite.subtitle && (
                <div style={{ fontSize:9, color:'rgba(212,175,55,0.5)', letterSpacing:'0.15em', marginTop:3 }}>
                  {activeSite.subtitle}
                </div>
              )}
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', marginTop:4 }}>
                {activeSite.category.toUpperCase()} · {activeSite.reach === 'Infinite' ? '∞ Non-Local' : `${activeSite.reach}m Reach`}
                {activeSite.resonance && ` · ${activeSite.resonance}`}
              </div>
              {/* Phase-lock status */}
              <div style={{ fontSize:9, color:'rgba(212,175,55,0.6)', letterSpacing:'0.15em', marginTop:5, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <div style={{ width:4, height:4, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 4px #10b981', animation:'sdPulse 2s infinite' }} />
                {Math.round(intensity)}% Phase-Locked · {activeSite.signature || 'AXIS MUNDI'} Resonance
              </div>
            </div>
          </div>

          {/* ── CATEGORY TABS ── */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
            {categories.map(cat => (
              <button key={cat} className="sd-cat" onClick={() => setActiveCategory(cat)} style={{
                flexShrink:0, padding:'7px 12px', borderRadius:99,
                border:`1px solid ${activeCategory===cat ? categoryColors[cat] : 'rgba(255,255,255,0.1)'}`,
                background: activeCategory===cat ? `${categoryColors[cat]}18` : 'transparent',
                color: activeCategory===cat ? categoryColors[cat] : 'rgba(255,255,255,0.35)',
                fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit',
                opacity: activeCategory===cat ? 1 : 0.6,
              }}>
                {categoryIcons[cat]} {cat}
              </button>
            ))}
          </div>

          {/* ── SITE GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {(SITE_GROUPS[activeCategory] || []).map(site => (
              <SiteCard key={site.id} site={site} active={activeSite.id === site.id} onClick={() => setActiveSite(site)} />
            ))}
          </div>

          {/* ── INTENSITY ── */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(212,175,55,0.7)' }}>
                <Zap size={12} style={{ marginRight:5, verticalAlign:'middle' }} />
                {access.hasTemple ? 'Intensity Master Slider' : 'Aura Intensity'}
              </span>
              <span style={{ fontSize:15, fontWeight:700, color:'#D4AF37', fontFamily:'monospace' }}>{intensity}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={intensity}
              onChange={e => setIntensity(+e.target.value)}
              className="sd-range"
              style={{
                background:`linear-gradient(to right, ${activeSite.color} ${intensity}%, rgba(255,255,255,0.12) ${intensity}%)`,
                accentColor: activeSite.color,
              } as CSSProperties}
            />
          </div>

          {/* ── SITE INSTRUCTION ── */}
          <div style={{ background:`${activeSite.color}0a`, border:`1px solid ${activeSite.color}28`, borderRadius:14, padding:14 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color: activeSite.color, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <Sparkles size={11} /> Sacred Instruction
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.75)', margin:'0 0 8px', lineHeight:1.7 }}>
              {activeSite.instruction}
            </p>
            <p style={{ fontSize:10, fontStyle:'italic', color:'rgba(212,175,55,0.5)', margin:0 }}>
              {activeSite.experience}
            </p>
          </div>

          {/* ── TEMPLE LOCK ── */}
          <div style={{
            padding:16, borderRadius:16,
            border:`1px solid ${isTempleLocked ? '#D4AF37' : 'rgba(212,175,55,0.18)'}`,
            background: isTempleLocked ? 'rgba(212,175,55,0.07)' : 'rgba(0,0,0,0.3)',
            boxShadow: isTempleLocked ? '0 0 30px rgba(212,175,55,0.15)' : 'none',
            transition:'all 0.4s',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#D4AF37', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                  <Home size={14} /> Temple Lock · 24/7
                </div>
                <div style={{ fontSize:9, color:'rgba(212,175,55,0.45)', letterSpacing:'0.1em' }}>
                  {isTempleLocked ? `Active ${anchorTimer} · ${activeSite.name}` : 'Lock your home energy field permanently'}
                </div>
              </div>
              <button onClick={handleAnchor} style={{
                padding:'9px 16px', borderRadius:12, fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                border:`1px solid ${isTempleLocked ? '#D4AF37' : 'rgba(212,175,55,0.35)'}`,
                background: isTempleLocked ? '#D4AF37' : 'transparent',
                color: isTempleLocked ? '#000' : 'rgba(212,175,55,0.7)',
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
              }}>
                {isTempleLocked ? '🟡 Locked' : 'Activate'}
                {!access.hasTemple && <Lock size={8} style={{ marginLeft:4, verticalAlign:'middle' }} />}
              </button>
            </div>
          </div>

          {/* ── STATUS BAR ── */}
          <div style={{ padding:'10px 0 14px', borderTop:'1px solid rgba(212,175,55,0.08)', display:'flex', justifyContent:'center', fontSize:8, color:'rgba(212,175,55,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'center', lineHeight:1.8 }}>
            {`Temple Home License: ${access.hasTemple ? '✓ Active' : 'Inactive'} · 24/7 House Anchor ${isTempleLocked ? 'Enabled' : 'Disabled'} · ${activeSite.reach === 'Infinite' ? '∞' : activeSite.reach+'m'} Reach · ${access.isAdmin ? 'Admin Access' : 'Member'}`}
          </div>
        </div>
      </div>

      {showUpsell && <TempleUpsellModal onClose={() => setShowUpsell(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. COMPACT SITE INDICATOR
//    Small floating badge — use on Meditation/Mantra/Music/Healing pages
//    Shows which site is active without the full dashboard
// ─────────────────────────────────────────────────────────────
export function ActiveSiteBadge() {
  const { activeSite, intensity, isSyncing } = useGlobalResonance();
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'8px 14px', borderRadius:99,
      background:'rgba(0,0,0,0.6)',
      backdropFilter:'blur(12px)',
      border:`1px solid ${activeSite.color}55`,
      boxShadow:`0 0 16px ${activeSite.glow}`,
      fontFamily:"'Cinzel','Palatino Linotype',Georgia,serif",
      transition:'all 0.5s',
    }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background: activeSite.color, boxShadow:`0 0 6px ${activeSite.color}`, animation: isSyncing ? 'sdPulse 1s infinite' : 'none', flexShrink:0 }} />
      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: activeSite.color }}>
        {activeSite.name}
      </span>
      <span style={{ fontSize:9, color:'rgba(212,175,55,0.5)' }}>· {intensity}%</span>
    </div>
  );
}
