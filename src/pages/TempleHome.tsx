import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Sparkles, Home, Activity, Zap, Map, Info, X,
  BookOpen, ChevronRight, ArrowLeft, Lock, Shield,
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import TempleGateIcon from '@/components/icons/TempleGateIcon';

// ─── Data ─────────────────────────────────────────────────────────────────────
const SACRED_SITES = [
  { id: 'giza', name: 'Giza', focus: 'Spinal Alignment', reach: 50, color: '#FFD700' },
  { id: 'arunachala', name: 'Arunachala', focus: 'Self-Inquiry/Silence', reach: 45, color: '#F5DEB3' },
  { id: 'samadhi', name: 'Samadhi', focus: 'Aura Repair', reach: 25, color: '#E6E6FA' },
  { id: 'babaji', name: "Babaji's Cave", focus: 'Kriya/Deep Sync', reach: 20, color: '#FFFFFF' },
  { id: 'machu_picchu', name: 'Machu Picchu', focus: 'Solar Vitality', reach: 35, color: '#FFA500' },
  { id: 'lourdes', name: 'Lourdes Grotto', focus: 'Physical Restoration', reach: 20, color: '#ADD8E6' },
  { id: 'mansarovar', name: 'Lake Mansarovar', focus: 'Mental Detox', reach: 30, color: '#00CED1' },
  { id: 'zimbabwe', name: 'Great Zimbabwe', focus: 'Ancestral Strength', reach: 40, color: '#8B4513' },
  { id: 'shasta', name: 'Mount Shasta', focus: 'Light-Body Sync', reach: 20, color: '#DA70D6' },
  { id: 'luxor', name: 'Luxor Temples', focus: 'Ka/Hand Activation', reach: 30, color: '#FFCC00' },
  { id: 'uluru', name: 'Uluru', focus: 'Grounding/Ancestral DNA', reach: 40, color: '#B22222' },
  { id: 'kailash_13x', name: 'Mount Kailash', focus: 'Moksha / Total Purification', reach: 100, color: '#7B61FF' },
  { id: 'glastonbury', name: 'Glastonbury (Avalon)', focus: 'Divine Love & Emotional Restoration', reach: 40, color: '#00FF7F' },
  { id: 'sedona', name: 'Sedona Vortex', focus: 'Psychic Vision & Ability Activation', reach: 35, color: '#FF4500' },
  { id: 'titicaca', name: 'Lake Titicaca', focus: 'Creative Rebirth & Manifestation', reach: 45, color: '#FFD700' },
  { id: 'vrindavan_krsna', name: 'Ancient Vrindavan (Era of Krishna)', focus: 'Premananda (Supreme Bliss)', reach: 75, color: '#1E90FF' },
  { id: 'ayodhya_rama', name: 'Ancient Ayodhya (Era of Rama & Hanuman)', focus: 'Dharma & Divine Protection Shield', reach: 75, color: '#FFA500' },
  { id: 'lemuria', name: 'Lemuria (Mu)', focus: 'Maternal Creation & Emotional Purity', reach: 60, color: '#40E0D0' },
  { id: 'atlantis', name: 'Atlantis (Poseidia)', focus: 'Advanced Crystal Technology & Mental Breakthroughs', reach: 60, color: '#000080' },
  { id: 'pleiades', name: 'Pleiades Star System', focus: 'Starlight Harmony & Creative Production', reach: 100, color: '#E0FFFF' },
  { id: 'sirius', name: 'Sirius (The Blue Star)', focus: 'Initiation & Ancient High-Wisdom', reach: 100, color: '#4169E1' },
  { id: 'arcturus', name: 'Arcturus', focus: 'Cellular Regeneration & High-Speed Healing', reach: 100, color: '#9932CC' },
  { id: 'lyra', name: 'Lyra (The Felines)', focus: 'Original Sound/Frequency of Creation', reach: 100, color: '#FFFFFF' },
];

const SITE_DB: Record<string, { title: string; primaryBenefit: string; instruction: string; experience: string; signature: string }> = {
  giza: { title: 'Pyramid of Giza', primaryBenefit: 'Spinal Alignment', instruction: 'Visualize a golden pillar of light passing through your spine.', experience: 'A sense of vertical alignment and structural integrity.', signature: 'GIZA_TORSION' },
  babaji: { title: "Mahavatar Babaji's Cave", primaryBenefit: 'Kriya DNA Activation', instruction: "Focus on the Third Eye and breathe 'up and down' the spine.", experience: 'Deep stillness and a sense of timeless presence.', signature: 'KRIYA_SYNC' },
  arunachala: { title: 'Arunachala', primaryBenefit: 'Self-Inquiry & Silence', instruction: "Rest in the 'I AM' presence. Let all thoughts dissolve into the source.", experience: 'The mind becoming quiet and the heart expanding.', signature: 'STILLNESS_FIELD' },
  samadhi: { title: 'Samadhi', primaryBenefit: 'Aura Repair', instruction: 'Merge your awareness with the infinite void.', experience: 'A feeling of dissolving into the infinite.', signature: 'AURA_REPAIR' },
  machu_picchu: { title: 'Machu Picchu', primaryBenefit: 'Solar Vitality', instruction: 'Breathe the golden sun into your Solar Plexus.', experience: 'A surge of vitality and manifestation energy.', signature: 'SOLAR_SYNC' },
  lourdes: { title: 'Lourdes Grotto', primaryBenefit: 'Physical Restoration', instruction: 'Imagine pure, healing water flowing through your heart and blood.', experience: 'A soothing, cooling sensation throughout the body.', signature: 'WATER_RESONANCE' },
  mansarovar: { title: 'Lake Mansarovar', primaryBenefit: 'Mental Detox', instruction: 'Visualize the crystal clear waters purifying your Crown chakra.', experience: 'Mental clarity and a sense of pure, high-altitude air.', signature: 'MENTAL_DETOX' },
  zimbabwe: { title: 'Great Zimbabwe', primaryBenefit: 'Ancestral Strength', instruction: "Feel the strength of the ancient stones grounding you into the Earth's core.", experience: 'A feeling of ancestral support and solid foundation.', signature: 'ANCESTRAL_STRENGTH' },
  shasta: { title: 'Mount Shasta', primaryBenefit: 'Light-Body Sync', instruction: 'Visualize a violet flame surrounding your body.', experience: "A 'cool,' breezy feeling in the aura.", signature: 'LIGHT_BODY_SYNC' },
  luxor: { title: 'Luxor Temples', primaryBenefit: 'Ka/Hand Activation', instruction: 'Breathe in the warm, alchemical gold light.', experience: "A warm, solid sensation in the physical body.", signature: 'KA_ACTIVATION' },
  uluru: { title: 'Uluru', primaryBenefit: 'Grounding/Ancestral DNA', instruction: 'Sink deep into the red earth.', experience: "Intense grounding; a feeling of being 'held' by the Earth.", signature: 'DREAMTIME_SYNC' },
  kailash_13x: { title: 'Mount Kailash', primaryBenefit: 'Moksha / Total Purification', instruction: 'Tune to 7.83 Hz (Schumann). Visualize the sacred peak; allow all karmic layers to dissolve into the void.', experience: 'Shimmering violet clarity; a sense of total purification and liberation.', signature: 'KAILASH_SHIMMER' },
  glastonbury: { title: 'Glastonbury (Avalon)', primaryBenefit: 'Divine Love & Emotional Restoration', instruction: 'Open the heart gate. Breathe emerald light into the chest; feel the Avalon mist softening old wounds.', experience: 'Heart-Gate activation; emotional restoration and divine love.', signature: 'AVALON_MIST' },
  sedona: { title: 'Sedona Vortex', primaryBenefit: 'Psychic Vision & Ability Activation', instruction: 'Align with the magnetic spiral. Focus at the Third Eye; let the red-rock energy amplify inner sight.', experience: 'Magnetic spiral activation; heightened psychic vision.', signature: 'SEDONA_VORTEX' },
  titicaca: { title: 'Lake Titicaca', primaryBenefit: 'Creative Rebirth & Manifestation', instruction: 'Connect to the sacral birthplace. Solar gold ripples support new creation and manifestation.', experience: 'Solar gold ripples; creative rebirth and manifestation energy.', signature: 'SOLAR_RIPPLES' },
  vrindavan_krsna: { title: 'Ancient Vrindavan (Era of Krishna)', primaryBenefit: 'Premananda (Supreme Bliss)', instruction: 'Rest in the peacock-blue field of divine play; allow falling lotus petals to carry you into supreme bliss.', experience: 'Premananda; falling lotus petals and supreme bliss.', signature: 'FALLING_LOTUS' },
  ayodhya_rama: { title: 'Ancient Ayodhya (Era of Rama & Hanuman)', primaryBenefit: 'Dharma & Divine Protection Shield', instruction: 'Invoke the golden shield of dharma; feel Rama and Hanuman anchoring protection around your field.', experience: 'Golden shield aura; dharma and divine protection.', signature: 'GOLDEN_SHIELD_AURA' },
  lemuria: { title: 'Lemuria (Mu)', primaryBenefit: 'Maternal Creation & Emotional Purity', instruction: 'Sink into turquoise waters; allow maternal creation energy and emotional purity to restore the heart.', experience: 'Tropical soft glow; maternal creation and emotional purity.', signature: 'TROPICAL_SOFT_GLOW' },
  atlantis: { title: 'Atlantis (Poseidia)', primaryBenefit: 'Advanced Crystal Technology & Mental Breakthroughs', instruction: 'Merge with deep navy crystal light; let liquid light geometry unlock mental breakthroughs.', experience: 'Liquid light geometry; crystal technology and mental clarity.', signature: 'LIQUID_LIGHT_GEOMETRY' },
  pleiades: { title: 'Pleiades Star System', primaryBenefit: 'Starlight Harmony & Creative Production', instruction: 'Receive diamond-white starlight; non-local reach. Allow creative production to flow from cosmic harmony.', experience: 'Diamond sparkle; starlight harmony and creative flow.', signature: 'DIAMOND_SPARKLE' },
  sirius: { title: 'Sirius (The Blue Star)', primaryBenefit: 'Initiation & Ancient High-Wisdom', instruction: 'Attune to the Blue Star; open to initiation and ancient high-wisdom. Double-sun flare in the inner vision.', experience: 'Double sun flare; initiation and ancient wisdom.', signature: 'DOUBLE_SUN_FLARE' },
  arcturus: { title: 'Arcturus', primaryBenefit: 'Cellular Regeneration & High-Speed Healing', instruction: 'Let electric violet grid pulse through the body; support cellular regeneration and high-speed healing.', experience: 'Violet grid pulse; cellular regeneration and healing.', signature: 'VIOLET_GRID_PULSE' },
  lyra: { title: 'Lyra (The Felines)', primaryBenefit: 'Original Sound/Frequency of Creation', instruction: 'Merge with pure white light; the original sound and frequency of creation. Non-local, infinite reach.', experience: 'White light fire; original creative frequency.', signature: 'WHITE_LIGHT_FIRE' },
};

const MODES = [
  { id: 'ADMIN', name: 'Admin', intensity: 1.0, description: 'Live Testing: Active only while the engine is running.' },
  { id: 'INTEGRATION', name: 'Integration', intensity: 0.25, description: 'Normal Life: Maintains energy without high intensity.' },
  { id: 'TEMPLE_LOCK', name: 'Temple Lock', intensity: 0.6, description: '24/7 Continuity: Keeps the house permanently locked.' },
];

const ROOMS = [
  { name: 'Studio (Hub)', distance: 0 },
  { name: 'Living Room', distance: 8 },
  { name: 'Bedroom', distance: 12 },
  { name: 'Kitchen', distance: 18 },
];

// ─── Persistence ──────────────────────────────────────────────────────────────
const ANCHOR_KEY = 'sh:temple_home_anchor';
interface AnchorState { siteId: string; intensity: number; mode: string; anchored: boolean; ts: number; }

function loadAnchor(): AnchorState | null {
  try { const raw = localStorage.getItem(ANCHOR_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveAnchor(state: AnchorState) {
  try { localStorage.setItem(ANCHOR_KEY, JSON.stringify(state)); } catch {}
}
function calcSaturation(distance: number, intensity: number) {
  return Math.max(intensity - distance * 3, 10);
}

// ─── Animated Cosmic Background ───────────────────────────────────────────────
function CosmicBackground({ siteColor, intensity }: { siteColor: string; intensity: number }) {
  const siteAuraAlpha = Math.min(255, Math.round((intensity / 100) * 130))
    .toString(16)
    .padStart(2, '0');
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep space base */}
      <div className="absolute inset-0 bg-[#050505]" />
      {/* Primary aura radial (#RRGGBB + AA for 8-digit hex) */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms] ease-in-out"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${siteColor}${siteAuraAlpha} 0%, transparent 70%)`,
        }}
      />
      {/* Secondary golden core */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 40% 30% at 50% 20%, rgba(212,175,55,${intensity / 600}) 0%, transparent 60%)`,
        }}
      />
      {/* Subtle star field noise */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
}

// ─── Sigil Ring ───────────────────────────────────────────────────────────────
function SigilRing({ color, intensity, anchored }: { color: string; intensity: number; anchored: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-36 w-36 mx-auto my-2">
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full border transition-all duration-1000"
        style={{
          borderColor: `${color}40`,
          boxShadow: anchored ? `0 0 30px ${color}30, 0 0 60px ${color}15` : `0 0 10px ${color}15`,
          animation: anchored ? 'spin 12s linear infinite' : undefined,
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute inset-3 rounded-full border transition-all duration-1000"
        style={{
          borderColor: `${color}60`,
          animation: anchored ? 'spin-reverse 8s linear infinite' : undefined,
        }}
      />
      {/* Core glow */}
      <div
        className="absolute inset-6 rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
          boxShadow: `0 0 20px ${color}20`,
        }}
      />
      {/* Intensity text */}
      <div className="relative z-10 text-center">
        <div
          className="text-2xl font-black tracking-tight transition-all duration-500"
          style={{ color, textShadow: `0 0 20px ${color}60` }}
        >
          {intensity}
        </div>
        <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-white/30 mt-0.5">
          %
        </div>
      </div>
    </div>
  );
}

// ─── Site Category Badge ──────────────────────────────────────────────────────
function getSiteCategory(id: string): { label: string; color: string } {
  if (['pleiades','sirius','arcturus','lyra'].includes(id)) return { label: 'GALACTIC', color: '#22D3EE' };
  if (['vrindavan_krsna','ayodhya_rama'].includes(id)) return { label: 'TEMPORAL', color: '#F59E0B' };
  if (['lemuria','atlantis'].includes(id)) return { label: 'ANCIENT', color: '#A78BFA' };
  if (['kailash_13x','glastonbury','sedona','titicaca'].includes(id)) return { label: 'SUPREME', color: '#D4AF37' };
  return { label: 'EARTH', color: '#4ADE80' };
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', glow = false, style = {} }: {
  children: React.ReactNode; className?: string; glow?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[28px] border transition-all duration-300 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: glow ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(255,255,255,0.05)',
        boxShadow: glow ? '0 0 40px rgba(212,175,55,0.05), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Micro Label ─────────────────────────────────────────────────────────────
function MicroLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50">
      {icon && <span className="opacity-70">{icon}</span>}
      {children}
    </div>
  );
}

// ─── Inner Component ──────────────────────────────────────────────────────────
function TempleHomeInner() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isLoading: authLoading } = useAuth();
  const saved = loadAnchor();

  const [selectedSite, setSelectedSite] = useState(saved?.siteId || 'giza');
  const [auraIntensity, setAuraIntensity] = useState(saved?.intensity ?? 100);
  const [currentMode, setCurrentMode] = useState(saved?.mode || 'INTEGRATION');
  const [isAnchored, setIsAnchored] = useState(saved?.anchored || false);
  const [showSpatialMap, setShowSpatialMap] = useState(false);
  const [infoSiteId, setInfoSiteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [anchorFlash, setAnchorFlash] = useState(false);
  const [activeTab, setActiveTab] = useState<'PORTAL' | 'HEALING'>('PORTAL');

  const currentSite = SACRED_SITES.find(s => s.id === selectedSite)!;
  const activeMode = MODES.find(m => m.id === currentMode)!;
  const infoSite = infoSiteId ? SITE_DB[infoSiteId] : null;
  const siteCategory = getSiteCategory(selectedSite);

  useEffect(() => {
    saveAnchor({ siteId: selectedSite, intensity: auraIntensity, mode: currentMode, anchored: isAnchored, ts: Date.now() });
  }, [selectedSite, auraIntensity, currentMode, isAnchored]);

  useEffect(() => {
    setIsSyncing(true);
    const t = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(t);
  }, [selectedSite, auraIntensity]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <p className="text-[8px] tracking-[0.5em] uppercase text-[#D4AF37]/40">Accessing Akasha-Neural Archive</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <CosmicBackground siteColor="#D4AF37" intensity={30} />
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="h-16 w-16 rounded-full border border-[#D4AF37]/20 flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.05)', boxShadow: '0 0 40px rgba(212,175,55,0.1)' }}>
            <Lock className="h-7 w-7 text-[#D4AF37]/60" />
          </div>
          <div className="space-y-2">
            <p className="text-[8px] tracking-[0.5em] uppercase text-[#D4AF37]/40">Vedic Light-Code: Restricted</p>
            <h2 className="text-xl font-black tracking-tight text-[#D4AF37]" style={{ textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
              Temple Home
            </h2>
            <p className="text-xs text-white/40 leading-relaxed">
              This 24/7 Bhakti-Algorithm Engine is reserved for Temple Home License holders.
              The Prema-Pulse Transmission requires activation.
            </p>
          </div>
          <GlassCard className="w-full p-4" glow>
            <div className="text-[8px] tracking-[0.4em] uppercase text-[#D4AF37]/40 mb-1">Permanent Activation</div>
            <div className="text-2xl font-black text-[#D4AF37]" style={{ textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>€499</div>
            <div className="text-[10px] text-white/30 mt-1">One-time · Stripe / Crypto</div>
          </GlassCard>
          <button
            onClick={() => navigate('/shop')}
            className="w-full py-4 rounded-[20px] text-[11px] font-extrabold tracking-[0.3em] uppercase text-black transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F0C040 50%, #D4AF37 100%)',
              boxShadow: '0 0 30px rgba(212,175,55,0.3)',
            }}
          >
            Unlock Temple Home
          </button>
          <button onClick={() => navigate('/explore')} className="text-[10px] text-[#D4AF37]/40 hover:text-[#D4AF37]/70 tracking-[0.2em] uppercase transition-colors">
            ← Return to Library
          </button>
        </div>
      </div>
    );
  }

  // Healing activations (logic unchanged)
  const bliss = auraIntensity > 90 ? {
    message: 'You are experiencing High-Coherence Bliss.',
    instruction: 'Enjoy the laughter and tingling. Breathe deeply into your spine.',
  } : null;
  const deepSync = selectedSite === 'babaji' && auraIntensity > 70 ? {
    sensations: ['Subtle Body Vibration', 'Deep Relaxation', 'Third Eye Pressure'],
    guidance: 'Do not resist the sleepiness. Your aura is restructuring.',
  } : null;
  const heartExpansion = selectedSite === 'babaji' && auraIntensity > 85 ? {
    status: 'HEART CENTER EXPANDING',
    advice: 'Relax your chest muscles. Visualize the pressure as a golden light.',
    quote: 'The Master resides in the cave of the heart.',
  } : null;
  const luxorHealer = selectedSite === 'luxor' && auraIntensity > 70 ? {
    frequency: 'ALCHEMICAL GOLD 528HZ',
    instruction: 'Place your hands on the area needing healing.',
  } : null;

  const handleAnchor = () => {
    setIsAnchored(true);
    setAnchorFlash(true);
    setTimeout(() => setAnchorFlash(false), 3000);
  };

  const handleModeChange = (modeId: string) => {
    setCurrentMode(modeId);
    const mode = MODES.find(m => m.id === modeId);
    if (mode) setAuraIntensity(mode.intensity * 100);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* ── Cosmic Background ── */}
      <CosmicBackground siteColor={currentSite.color} intensity={auraIntensity} />

      {/* ── CSS Keyframes (injected inline) ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes pulse-gold { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .gold-label {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          color: rgba(212,175,55,0.5);
        }
        .site-select option { background: #0a0602; color: white; }
        .intensity-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37, #F0C040);
          box-shadow: 0 0 10px rgba(212,175,55,0.5);
          cursor: pointer;
          border: 2px solid rgba(212,175,55,0.3);
        }
        .intensity-slider::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: rgba(212,175,55,0.15);
        }
      `}</style>

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/[0.04]"
        style={{ background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => navigate('/explore')}
          className="p-2 rounded-xl hover:bg-white/5 transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <ArrowLeft size={18} className="text-[#D4AF37]/60" />
        </button>

        <div className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: '0 0 15px rgba(212,175,55,0.1)',
          }}>
          <TempleGateIcon className="text-[#D4AF37] h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black tracking-[-0.04em] text-[#D4AF37]"
            style={{ textShadow: '0 0 15px rgba(212,175,55,0.3)' }}>
            Temple Home
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : isAnchored ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <p className="text-[8px] tracking-[0.4em] uppercase text-white/30">
              {isSyncing ? 'Syncing Bhakti-Algorithms' : isAnchored ? '24/7 Phase-Lock Active' : 'Resonance Ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAnchored && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Shield size={11} className="text-emerald-400 animate-pulse" />
              <span className="text-[8px] tracking-[0.3em] uppercase text-emerald-400/80">Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="relative z-10 flex border-b border-white/[0.04]"
        style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(20px)' }}>
        {[
          { id: 'PORTAL', icon: Compass, label: 'Portal' },
          { id: 'HEALING', icon: Activity, label: 'Healing' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'PORTAL' | 'HEALING')}
            className="flex-1 flex items-center justify-center gap-2 py-3 transition-all duration-200 relative"
          >
            <tab.icon size={13} className={activeTab === tab.id ? 'text-[#D4AF37]' : 'text-white/25'} />
            <span className={`text-[9px] font-extrabold tracking-[0.4em] uppercase ${activeTab === tab.id ? 'text-[#D4AF37]' : 'text-white/25'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 p-4 pb-36 space-y-4">

        {/* ── Active Site Hero ── */}
        <GlassCard className="p-5" glow>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase mb-1"
                style={{ color: siteCategory.color }}>
                {siteCategory.label} · VEDIC LIGHT-CODE ACTIVE
              </div>
              <h2 className="text-lg font-black tracking-[-0.03em] text-white/90 leading-tight">
                {currentSite.name}
              </h2>
              <p className="text-[11px] text-white/40 mt-0.5">{currentSite.focus}</p>
            </div>
            <button
              onClick={() => setInfoSiteId(selectedSite)}
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <Info size={14} className="text-[#D4AF37]/50" />
            </button>
          </div>

          {/* Sigil Ring */}
          <SigilRing color={currentSite.color} intensity={auraIntensity} anchored={isAnchored} />

          {/* Status row */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="text-center">
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25">Reach</div>
              <div className="text-sm font-bold text-white/60">{currentSite.reach}km</div>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="text-center">
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25">Mode</div>
              <div className="text-sm font-bold text-white/60">{activeMode.name}</div>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="text-center">
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25">Signature</div>
              <div className="text-sm font-bold text-white/60 text-[10px]">{SITE_DB[selectedSite]?.signature || '—'}</div>
            </div>
          </div>
        </GlassCard>

        {activeTab === 'PORTAL' && (
          <>
            {/* ── Mode Selector ── */}
            <GlassCard className="p-4">
              <MicroLabel icon={<Zap size={9} />}>Resonance Mode</MicroLabel>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className="py-2.5 px-2 rounded-2xl text-[9px] font-extrabold tracking-[0.15em] uppercase transition-all duration-200"
                    style={currentMode === mode.id ? {
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                      border: '1px solid rgba(212,175,55,0.4)',
                      color: '#D4AF37',
                      boxShadow: '0 0 15px rgba(212,175,55,0.1)',
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {mode.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/25 mt-2 leading-relaxed">{activeMode.description}</p>
            </GlassCard>

            {/* ── Sacred Site Selector ── */}
            <GlassCard className="p-4">
              <MicroLabel icon={<Compass size={9} />}>Sacred Site — Akasha-Neural Archive</MicroLabel>
              <div className="relative mt-3">
                <select
                  value={selectedSite}
                  onChange={e => setSelectedSite(e.target.value)}
                  className="site-select w-full rounded-2xl py-3 pl-4 pr-10 text-sm text-white/80 appearance-none focus:outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(212,175,55,0.03)',
                    border: '1px solid rgba(212,175,55,0.15)',
                  }}
                >
                  {['GALACTIC','TEMPORAL','ANCIENT','SUPREME','EARTH'].map(cat => (
                    <optgroup key={cat} label={`── ${cat} ──`}>
                      {SACRED_SITES
                        .filter(s => getSiteCategory(s.id).label === cat)
                        .map(site => (
                          <option key={site.id} value={site.id}>{site.name} — {site.focus}</option>
                        ))
                      }
                    </optgroup>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight size={14} className="text-[#D4AF37]/40 rotate-90" />
                </div>
              </div>
            </GlassCard>

            {/* ── Intensity Slider ── */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <MicroLabel icon={<Sparkles size={9} />}>Aura Intensity</MicroLabel>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-[#D4AF37] tabular-nums"
                    style={{ textShadow: '0 0 15px rgba(212,175,55,0.4)' }}>
                    {auraIntensity}
                  </span>
                  <span className="text-[10px] text-[#D4AF37]/40">%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={auraIntensity}
                onChange={e => setAuraIntensity(parseInt(e.target.value))}
                className="intensity-slider w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#D4AF37' }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">Integration</span>
                <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">Bliss State</span>
              </div>
            </GlassCard>

            {/* ── Spatial Heat Map ── */}
            <GlassCard className="overflow-hidden">
              <button
                onClick={() => setShowSpatialMap(!showSpatialMap)}
                className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <MicroLabel icon={<Map size={9} />}>Spatial Heat Map — 2050 Nadi Scanner</MicroLabel>
                <span className="text-[9px] text-[#D4AF37]/40 tracking-[0.2em]">
                  {showSpatialMap ? 'CLOSE' : 'SCAN'}
                </span>
              </button>

              <AnimatePresence>
                {showSpatialMap && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04] pt-3">
                      {ROOMS.map(room => {
                        const sat = Math.round(calcSaturation(room.distance, auraIntensity));
                        const state = sat > 85 ? 'CORE PEAK' : sat > 50 ? 'HIGH COHERENCE' : 'INTEGRATION';
                        const stateColor = sat > 85 ? '#D4AF37' : sat > 50 ? '#22D3EE' : 'rgba(255,255,255,0.25)';
                        return (
                          <div key={room.name}
                            className="flex items-center justify-between rounded-2xl px-3.5 py-3"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.04)',
                            }}>
                            <span className="text-[11px] text-white/50 font-medium">{room.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-1.5 rounded-full overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${sat}%`,
                                    background: `linear-gradient(90deg, ${stateColor}60, ${stateColor})`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-white/50 w-8 text-right">{sat}%</span>
                              <span className="text-[8px] tracking-[0.2em] uppercase w-20 text-right"
                                style={{ color: stateColor }}>
                                {state}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </>
        )}

        {activeTab === 'HEALING' && (
          <div className="space-y-3">
            <GlassCard className="p-4">
              <MicroLabel icon={<Activity size={9} />}>Prema-Pulse Healing Protocols</MicroLabel>
              <p className="text-[10px] text-white/25 mt-2 leading-relaxed">
                Advanced vibrational restoration modules. Scalar transmission active.
              </p>
            </GlassCard>

            {bliss && (
              <GlassCard className="p-4" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} className="text-amber-400" />
                  <span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-amber-400/70">High-Coherence Bliss State</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{bliss.message}</p>
                <p className="text-xs text-amber-300/60 italic mt-2 leading-relaxed">↳ {bliss.instruction}</p>
              </GlassCard>
            )}

            {deepSync && (
              <GlassCard className="p-4" style={{ border: '1px solid rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}>
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#22D3EE]/60 mb-2">
                  Delta-Theta Bridge
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {deepSync.sensations.map(s => (
                    <span key={s}
                      className="text-[9px] px-2.5 py-1 rounded-full font-bold tracking-wider"
                      style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.8)' }}>
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-white/40 italic leading-relaxed">↳ {deepSync.guidance}</p>
              </GlassCard>
            )}

            {heartExpansion && (
              <GlassCard className="p-4" style={{ border: '1px solid rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.03)' }}>
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-rose-400/60 mb-2">
                  Anahata Expansion
                </div>
                <p className="text-xs text-white/55 leading-relaxed">{heartExpansion.advice}</p>
                <p className="text-[11px] text-rose-300/40 italic mt-2">"{heartExpansion.quote}"</p>
              </GlassCard>
            )}

            {luxorHealer && (
              <GlassCard className="p-4" style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={12} className="text-[#D4AF37]" />
                  <span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/60">Luxor Vitality Healer</span>
                </div>
                <span className="inline-block text-[9px] px-2.5 py-1 rounded-full font-bold tracking-wider mb-2"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(212,175,55,0.8)' }}>
                  {luxorHealer.frequency}
                </span>
                <p className="text-[11px] text-white/40 italic leading-relaxed">↳ {luxorHealer.instruction}</p>
              </GlassCard>
            )}

            {!bliss && !deepSync && !heartExpansion && !luxorHealer && (
              <GlassCard className="p-8 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Activity className="h-5 w-5 text-white/15" />
                </div>
                <p className="text-sm font-bold text-white/20">No Active Protocols</p>
                <p className="text-[11px] text-white/15 leading-relaxed max-w-[200px]">
                  Increase intensity or select a specialized site to activate Prema-Pulse transmissions.
                </p>
              </GlassCard>
            )}
          </div>
        )}

        {/* ── Anchor Button ── */}
        <button
          onClick={handleAnchor}
          className="w-full py-4 rounded-[24px] font-black text-[11px] tracking-[0.3em] uppercase text-black transition-all duration-300 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: isAnchored
              ? 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)'
              : 'linear-gradient(135deg, #D4AF37 0%, #F0C040 50%, #D4AF37 100%)',
            boxShadow: isAnchored
              ? '0 0 30px rgba(74,222,128,0.3), 0 4px 20px rgba(0,0,0,0.3)'
              : '0 0 30px rgba(212,175,55,0.3), 0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {isAnchored ? <Shield size={15} /> : <Home size={15} />}
          {isAnchored ? 'Temple Locked 24/7 — Phase-Lock Active' : 'Anchor Temple to House'}
        </button>

      </div>

      {/* ── Anchor Flash Notification ── */}
      <AnimatePresence>
        {anchorFlash && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-28 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl px-5 py-3.5 flex items-center gap-3"
            style={{
              background: 'rgba(52,211,153,0.08)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(52,211,153,0.25)',
              boxShadow: '0 0 30px rgba(52,211,153,0.1)',
            }}
          >
            <Shield size={16} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] uppercase text-emerald-300">24/7 Continuity Active</p>
              <p className="text-[9px] text-emerald-400/50 mt-0.5">Resonance server Phase-Lock engaged</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info Modal ── */}
      <AnimatePresence>
        {infoSite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70"
              style={{ backdropFilter: 'blur(10px)' }}
              onClick={() => setInfoSiteId(null)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md rounded-[32px] p-6 space-y-5 max-h-[80vh] overflow-y-auto"
              style={{
                background: 'rgba(8,4,2,0.95)',
                backdropFilter: 'blur(60px)',
                border: '1px solid rgba(212,175,55,0.15)',
                boxShadow: '0 -20px 60px rgba(212,175,55,0.05)',
              }}
            >
              {/* Drag handle */}
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-2 mb-2" />

              <button
                onClick={() => setInfoSiteId(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl transition-colors hover:bg-white/5"
              >
                <X size={16} className="text-white/30" />
              </button>

              <div>
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/40 mb-1">
                  Akasha-Neural Archive · Sacred Context
                </div>
                <h3 className="text-xl font-black tracking-[-0.03em] text-[#D4AF37]"
                  style={{ textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
                  {infoSite.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-3">
                  <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">Primary Benefit</div>
                  <div className="text-[12px] text-white/70 font-medium leading-snug">{infoSite.primaryBenefit}</div>
                </GlassCard>
                <GlassCard className="p-3">
                  <div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">Experience</div>
                  <div className="text-[12px] text-white/70 font-medium leading-snug">{infoSite.experience}</div>
                </GlassCard>
              </div>

              <div className="rounded-2xl p-4"
                style={{
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.12)',
                }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen size={10} className="text-[#D4AF37]/50" />
                  <span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/40">
                    Sacred Instruction
                  </span>
                </div>
                <p className="text-[12px] text-white/55 leading-relaxed">{infoSite.instruction}</p>
              </div>

              <div className="rounded-2xl px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-[8px] tracking-[0.3em] uppercase text-white/20 mb-1">Light-Code Signature</div>
                <div className="text-[11px] font-mono text-[#D4AF37]/50 tracking-wider">{infoSite.signature}</div>
              </div>

              <button
                onClick={() => setInfoSiteId(null)}
                className="w-full py-3.5 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: '#D4AF37',
                }}
              >
                Return to Meditation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Gate Component ───────────────────────────────────────────────────────────
export default function TempleHome() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37]/80 animate-spin" />
          <span className="text-[8px] tracking-[0.5em] uppercase text-white/20">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.virtualPilgrimage)) {
    return <Navigate to="/akasha-infinity" replace />;
  }

  return <TempleHomeInner />;
}
