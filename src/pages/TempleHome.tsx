import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, Sparkles, Home, Activity, Zap, Map, Info, X, BookOpen, 
  ChevronRight, ArrowLeft, Lock, Shield
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import TempleGateIcon from '@/components/icons/TempleGateIcon';

// ─── Data ───────────────────────────────────────────────────────────────────
// SACRED HEALING: SITE REGISTRY V2.0 — Galactic, Temporal, Lost Civilizations, Supreme Earth

const SACRED_SITES = [
  // Original Earth sites (unchanged)
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
  // Supreme Earth (Site Registry V2.0)
  { id: 'kailash_13x', name: 'Mount Kailash', focus: 'Moksha / Total Purification', reach: 100, color: '#7B61FF' },
  { id: 'glastonbury', name: 'Glastonbury (Avalon)', focus: 'Divine Love & Emotional Restoration', reach: 40, color: '#00FF7F' },
  { id: 'sedona', name: 'Sedona Vortex', focus: 'Psychic Vision & Ability Activation', reach: 35, color: '#FF4500' },
  { id: 'titicaca', name: 'Lake Titicaca', focus: 'Creative Rebirth & Manifestation', reach: 45, color: '#FFD700' },
  // Ancient Holy Eras (Temporal)
  { id: 'vrindavan_krsna', name: 'Ancient Vrindavan (Era of Krishna)', focus: 'Premananda (Supreme Bliss)', reach: 75, color: '#1E90FF' },
  { id: 'ayodhya_rama', name: 'Ancient Ayodhya (Era of Rama & Hanuman)', focus: 'Dharma & Divine Protection Shield', reach: 75, color: '#FFA500' },
  // Lost Civilizations
  { id: 'lemuria', name: 'Lemuria (Mu)', focus: 'Maternal Creation & Emotional Purity', reach: 60, color: '#40E0D0' },
  { id: 'atlantis', name: 'Atlantis (Poseidia)', focus: 'Advanced Crystal Technology & Mental Breakthroughs', reach: 60, color: '#000080' },
  // Galactic Star Nations
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
  // Site Registry V2.0 — Supreme, Temporal, Ancient, Galactic
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
  { id: 'ADMIN', name: 'Admin Mode', intensity: 1.0, description: 'Live Testing: Active only while the engine is running.' },
  { id: 'INTEGRATION', name: 'Integration', intensity: 0.25, description: 'Normal Life: Maintains energy without high intensity.' },
  { id: 'TEMPLE_LOCK', name: 'Temple Lock', intensity: 0.6, description: '24/7 Continuity: Keeps the house permanently locked.' },
];

const ROOMS = [
  { name: 'Studio (Hub)', distance: 0 },
  { name: 'Living Room', distance: 8 },
  { name: 'Bedroom', distance: 12 },
  { name: 'Kitchen', distance: 18 },
];

// ─── Persistence Key ────────────────────────────────────────────────────────
const ANCHOR_KEY = 'sh:temple_home_anchor';

interface AnchorState {
  siteId: string;
  intensity: number;
  mode: string;
  anchored: boolean;
  ts: number;
}

function loadAnchor(): AnchorState | null {
  try {
    const raw = localStorage.getItem(ANCHOR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAnchor(state: AnchorState) {
  try { localStorage.setItem(ANCHOR_KEY, JSON.stringify(state)); } catch {}
}

function calcSaturation(distance: number, intensity: number) {
  return Math.max(intensity - distance * 3, 10);
}

// ─── Component ──────────────────────────────────────────────────────────────

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

  // Persist on every change
  useEffect(() => {
    saveAnchor({ siteId: selectedSite, intensity: auraIntensity, mode: currentMode, anchored: isAnchored, ts: Date.now() });
  }, [selectedSite, auraIntensity, currentMode, isAnchored]);

  // Sync animation
  useEffect(() => {
    setIsSyncing(true);
    const t = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(t);
  }, [selectedSite, auraIntensity]);

  // Guard
  if (authLoading || adminLoading) {
    return <div className="min-h-screen bg-[#0a0502] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0502] flex flex-col items-center justify-center text-white/60 gap-4 p-8">
        <Lock className="h-12 w-12 text-[#D4AF37]/60" />
        <p className="text-center text-sm max-w-md">
          <span className="font-semibold text-[#D4AF37]">Temple Home is currently locked.</span>{" "}
          This 24/7 house-anchored engine is reserved for Temple Home License holders and admins.
        </p>
        <p className="text-center text-xs text-[#D4AF37]/80">
          Unlock permanently for <span className="font-semibold text-[#D4AF37]">€499</span>{" "}
          (Stripe / Crypto) and gain full Temple access.
        </p>
        <div className="flex flex-col items-center gap-3 mt-2">
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-3 rounded-full border border-[#D4AF37]/60 text-xs uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
          >
            Unlock Temple Home — €499
          </button>
          <button
            onClick={() => navigate('/explore')}
            className="text-[#D4AF37] text-xs opacity-80 hover:opacity-100"
          >
            ← Return to Library
          </button>
        </div>
      </div>
    );
  }

  // Healing activations
  const bliss = auraIntensity > 90 ? { message: 'You are experiencing High-Coherence Bliss.', instruction: 'Enjoy the laughter and tingling. Breathe deeply into your spine.' } : null;
  const deepSync = selectedSite === 'babaji' && auraIntensity > 70 ? { sensations: ['Subtle Body Vibration', 'Deep Relaxation', 'Third Eye Pressure'], guidance: 'Do not resist the sleepiness. Your aura is restructuring.' } : null;
  const heartExpansion = selectedSite === 'babaji' && auraIntensity > 85 ? { status: 'HEART CENTER EXPANDING', advice: 'Relax your chest muscles. Visualize the pressure as a golden light.', quote: 'The Master resides in the cave of the heart.' } : null;
  const luxorHealer = selectedSite === 'luxor' && auraIntensity > 70 ? { frequency: 'ALCHEMICAL GOLD 528HZ', instruction: 'Place your hands on the area needing healing.' } : null;

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

  const auraColor = currentSite.id === 'babaji' ? 'rgba(255,255,255,' 
    : currentSite.id === 'lourdes' ? 'rgba(173,216,230,' 
    : currentSite.id === 'shasta' ? 'rgba(138,43,226,' 
    : currentSite.id === 'uluru' ? 'rgba(139,0,0,' 
    : 'rgba(212,175,55,';

  return (
    <div className="min-h-screen bg-[#0a0502] text-white relative overflow-hidden">
      {/* Aura Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `radial-gradient(ellipse at 50% 40%, ${auraColor}${auraIntensity / 400}) 0%, transparent 70%)`,
        transition: 'all 1.5s ease',
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-4 border-b border-[#D4AF37]/10">
        <button onClick={() => navigate('/explore')} className="p-2 rounded-lg hover:bg-white/5 transition"><ArrowLeft size={20} className="text-[#D4AF37]" /></button>
        <TempleGateIcon className="text-[#D4AF37]" />
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#D4AF37]">Temple Home</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            {isSyncing ? 'Syncing...' : isAnchored ? '24/7 Locked' : 'Ready'}
          </p>
        </div>
        {isAnchored && <Shield size={16} className="text-emerald-400 animate-pulse" />}
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex border-b border-[#D4AF37]/10">
        {[{ id: 'PORTAL', icon: Compass, label: 'Portal' }, { id: 'HEALING', icon: Activity, label: 'Healing' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-widest border-b-2 transition ${
              activeTab === tab.id ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#D4AF37]/40'
            }`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 p-4 pb-32 space-y-6">
        {activeTab === 'PORTAL' && (
          <>
            {/* Mode Selector */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 flex items-center gap-1"><Zap size={10} /> Resonance Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(mode => (
                  <button key={mode.id} onClick={() => handleModeChange(mode.id)}
                    className={`text-[9px] py-2 px-1 rounded-lg border transition uppercase tracking-tighter ${
                      currentMode === mode.id ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold' : 'border-[#D4AF37]/30 text-[#D4AF37]/60 hover:border-[#D4AF37]/60'
                    }`}>
                    {mode.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30">{activeMode.description}</p>
            </div>

            {/* Site Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 flex items-center gap-1"><Compass size={10} /> Sacred Site</p>
                <button onClick={() => setInfoSiteId(selectedSite)} className="text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37] flex items-center gap-1"><Info size={10} /> Deep Context</button>
              </div>
              <div className="relative">
                <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)}
                  className="w-full bg-black/60 border border-[#D4AF37]/30 rounded-xl py-3 px-4 appearance-none focus:outline-none focus:border-[#D4AF37] text-sm text-white">
                  {SACRED_SITES.map(site => <option key={site.id} value={site.id}>{site.name} — {site.focus}</option>)}
                </select>
              </div>
            </div>

            {/* Intensity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 flex items-center gap-1"><Sparkles size={10} /> Aura Intensity</p>
                <span className="text-[#D4AF37] font-bold text-sm">{auraIntensity}%</span>
              </div>
              <input type="range" min={0} max={100} value={auraIntensity} onChange={e => setAuraIntensity(parseInt(e.target.value))}
                className="w-full h-1 bg-[#D4AF37]/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
            </div>

            {/* Spatial Heat Map */}
            <button onClick={() => setShowSpatialMap(!showSpatialMap)}
              className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition pt-2 border-t border-[#D4AF37]/10">
              <span className="flex items-center gap-1"><Map size={10} /> Spatial Heat Map</span>
              <span>{showSpatialMap ? 'Hide' : 'Show'}</span>
            </button>
            <AnimatePresence>
              {showSpatialMap && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                  {ROOMS.map(room => {
                    const sat = Math.round(calcSaturation(room.distance, auraIntensity));
                    const state = sat > 85 ? 'CORE PEAK' : sat > 50 ? 'HIGH COHERENCE' : 'INTEGRATION';
                    return (
                      <div key={room.name} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                        <span className="text-xs text-white/60">{room.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${sat}%` }} /></div>
                          <span className="text-[10px] text-[#D4AF37] font-mono">{sat}%</span>
                          <span className="text-[8px] text-white/30 uppercase">{state}</span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {activeTab === 'HEALING' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 flex items-center gap-1 mb-3"><Activity size={10} /> Healing Protocols</p>
              <p className="text-xs text-white/40">Advanced vibrational restoration modules.</p>
            </div>

            {bliss && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-900/20 space-y-2">
                <p className="text-sm font-bold text-amber-300 flex items-center gap-2"><Sparkles size={14} /> High-Coherence Bliss</p>
                <p className="text-xs text-white/60">{bliss.message}</p>
                <p className="text-xs text-amber-200/80 italic">💡 {bliss.instruction}</p>
              </div>
            )}

            {deepSync && (
              <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-900/20 space-y-2">
                <p className="text-sm font-bold text-blue-300">Delta-Theta Bridge</p>
                <div className="flex flex-wrap gap-1">{deepSync.sensations.map(s => <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">{s}</span>)}</div>
                <p className="text-xs text-white/60 italic">💡 {deepSync.guidance}</p>
              </div>
            )}

            {heartExpansion && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-900/20 space-y-2">
                <p className="text-sm font-bold text-rose-300">Anahata Expansion</p>
                <p className="text-xs text-white/60">{heartExpansion.advice}</p>
                <p className="text-xs text-rose-200/60 italic">"{heartExpansion.quote}"</p>
              </div>
            )}

            {luxorHealer && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-900/20 space-y-2">
                <p className="text-sm font-bold text-amber-300 flex items-center gap-2"><Zap size={14} /> Luxor Vitality Healer</p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">{luxorHealer.frequency}</span>
                <p className="text-xs text-white/60 italic">💡 {luxorHealer.instruction}</p>
              </div>
            )}

            {!bliss && !deepSync && !heartExpansion && !luxorHealer && (
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-center space-y-2">
                <Activity className="h-8 w-8 mx-auto text-white/20" />
                <p className="text-sm text-white/40">No Active Protocols</p>
                <p className="text-xs text-white/30">Increase intensity or select a specialized site to activate.</p>
              </div>
            )}
          </div>
        )}

        {/* Anchor Button */}
        <button onClick={handleAnchor}
          className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm bg-[#D4AF37] text-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2">
          <Home size={16} />
          {isAnchored ? 'Temple Locked 24/7' : 'Anchor to House'}
        </button>
      </div>

      {/* Anchor Flash */}
      <AnimatePresence>
        {anchorFlash && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-xl flex items-center gap-2">
            <Shield size={16} className="text-emerald-300" />
            <span className="text-xs text-emerald-200 font-bold">24/7 Continuity Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoSite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setInfoSiteId(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#0a0502] border border-[#D4AF37]/30 rounded-3xl p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto">
              <button onClick={() => setInfoSiteId(null)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={18} /></button>
              <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-widest">Sacred Context</p>
              <h3 className="text-xl font-bold text-[#D4AF37]">{infoSite.title}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[10px] text-white/40 uppercase">Primary Benefit</p><p className="text-sm text-white/80">{infoSite.primaryBenefit}</p></div>
                <div><p className="text-[10px] text-white/40 uppercase">Experience</p><p className="text-sm text-white/80">{infoSite.experience}</p></div>
              </div>
              <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest mb-1 flex items-center gap-1"><BookOpen size={10} /> Sacred Instruction</p>
                <p className="text-sm text-white/70">{infoSite.instruction}</p>
              </div>
              <button onClick={() => setInfoSiteId(null)} className="w-full py-3 rounded-xl border border-[#D4AF37]/30 text-[10px] uppercase tracking-widest text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition">
                Return to Meditation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TempleHome() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-sm uppercase tracking-[0.3em] text-white/40">Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.virtualPilgrimage)) {
    return <Navigate to="/akasha-infinity" replace />;
  }

  return <TempleHomeInner />;
}
