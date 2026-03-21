// TempleHome.tsx — SQI 2050 V4.0 — TypeScript-safe build
// All DeviceMotionEvent calls wrapped in window as any
// No empty catch blocks, no unused imports, no stale closures
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Sparkles, Home, Activity, Zap, Info, X,
  BookOpen, ChevronRight, ArrowLeft, Lock, Shield, Flame,
  Droplets, Moon, Music, Star, Clock, CheckCircle, Radio,
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import TempleGateIcon from '@/components/icons/TempleGateIcon';

// ─── Site Registry ────────────────────────────────────────────────────────────
const SACRED_SITES = [
  { id: 'giza', name: 'Giza', focus: 'Spinal Alignment & Torsion Field', reach: 50, color: '#FFD700' },
  { id: 'arunachala', name: 'Arunachala', focus: 'Self-Inquiry & I AM Presence', reach: 45, color: '#F5DEB3' },
  { id: 'samadhi', name: 'Samadhi Portal', focus: 'Aura Repair & Dissolution', reach: 25, color: '#E6E6FA' },
  { id: 'babaji', name: "Babaji's Cave", focus: 'Kriya Activation & DNA Sync', reach: 20, color: '#FFFFFF' },
  { id: 'machu_picchu', name: 'Machu Picchu', focus: 'Solar Vitality & Manifestation', reach: 35, color: '#FFA500' },
  { id: 'lourdes', name: 'Lourdes Grotto', focus: 'Physical Restoration & Healing Water', reach: 20, color: '#ADD8E6' },
  { id: 'mansarovar', name: 'Lake Mansarovar', focus: 'Mental Detox & Crown Purification', reach: 30, color: '#00CED1' },
  { id: 'zimbabwe', name: 'Great Zimbabwe', focus: 'Ancestral Strength & Lineage', reach: 40, color: '#8B4513' },
  { id: 'shasta', name: 'Mount Shasta', focus: 'Light-Body & Violet Flame', reach: 20, color: '#DA70D6' },
  { id: 'luxor', name: 'Luxor Temples', focus: 'Ka Body & Healer Activation', reach: 30, color: '#FFCC00' },
  { id: 'uluru', name: 'Uluru', focus: 'Dreamtime & Ancestral DNA', reach: 40, color: '#B22222' },
  { id: 'kailash_13x', name: 'Mount Kailash', focus: 'Moksha — Ultimate System Reset', reach: 100, color: '#7B61FF' },
  { id: 'glastonbury', name: 'Glastonbury (Avalon)', focus: 'Heart-Gate & Emotional Restoration', reach: 40, color: '#00FF7F' },
  { id: 'sedona', name: 'Sedona Vortex', focus: 'Psychic Vision & Creative Downloads', reach: 35, color: '#FF4500' },
  { id: 'titicaca', name: 'Lake Titicaca', focus: 'Creative Rebirth & M/F Balance', reach: 45, color: '#FFD700' },
  { id: 'amritsar', name: 'Golden Temple (Amritsar)', focus: 'Selfless Service & Abundance', reach: 80, color: '#FFD700' },
  { id: 'mauritius', name: "Paramahamsa's Miracle Room", focus: 'Quantum Shifts & Instant Healing', reach: 90, color: '#F0E68C' },
  { id: 'shirdi', name: 'Shirdi Sai Baba Samadhi', focus: 'Total Surrender — Shraddha / Saburi', reach: 85, color: '#FF6B35' },
  { id: 'vrindavan_krsna', name: 'Ancient Vrindavan', focus: 'Premananda — Supreme Bliss', reach: 75, color: '#1E90FF' },
  { id: 'ayodhya_rama', name: 'Ancient Ayodhya', focus: 'Dharma & Spiritual Fortress', reach: 75, color: '#FFA500' },
  { id: 'lemuria', name: 'Lemuria (Mu)', focus: 'Maternal Healing & Inner Child', reach: 60, color: '#40E0D0' },
  { id: 'atlantis', name: 'Atlantis (Poseidia)', focus: 'Mental Clarity & High-Tech Logic', reach: 60, color: '#6080DD' },
  { id: 'pleiades', name: 'Pleiades Star System', focus: 'Starlight Harmony & Music Alignment', reach: 100, color: '#E0FFFF' },
  { id: 'sirius', name: 'Sirius (The Blue Star)', focus: 'Initiation & Wisdom Downloads', reach: 100, color: '#4169E1' },
  { id: 'arcturus', name: 'Arcturus', focus: 'Rapid Regeneration & Geometric Healing', reach: 100, color: '#9932CC' },
  { id: 'lyra', name: 'Lyra (The Felines)', focus: 'Original Sound — Frequency of Creation', reach: 100, color: '#FFFFFF' },
];

// ─── Cinematic Background DNA ─────────────────────────────────────────────────
interface SiteBG { gradient: string; overlay: string; particles: string; scene: string; }
const SITE_BG: Record<string, SiteBG> = {
  kailash_13x: { gradient: 'radial-gradient(ellipse 120% 80% at 50% 100%, #1a0533 0%, #2d0d5c 30%, #0d0520 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(123,97,255,0.12) 0%, rgba(212,175,55,0.08) 50%, transparent 100%)', particles: '#7B61FF', scene: 'Snow-capped peak · Violet-gold Schumann sky' },
  amritsar: { gradient: 'radial-gradient(ellipse 120% 60% at 50% 100%, #1a1000 0%, #2d1f00 25%, #0d0a00 60%, #050505 100%)', overlay: 'linear-gradient(180deg, transparent 40%, rgba(212,175,55,0.18) 80%, rgba(212,175,55,0.28) 100%)', particles: '#FFD700', scene: 'Golden Temple night · Amrit Sarovar reflection' },
  ayodhya_rama: { gradient: 'radial-gradient(ellipse 100% 70% at 50% 80%, #2d1000 0%, #4a1e00 30%, #1a0800 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(255,140,0,0.06) 0%, rgba(205,90,0,0.15) 60%, transparent 100%)', particles: '#FFA500', scene: 'Grand Vedic temple · Saffron celestial aura' },
  vrindavan_krsna: { gradient: 'radial-gradient(ellipse 110% 70% at 50% 60%, #001428 0%, #001e3d 30%, #00091a 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(30,144,255,0.08) 0%, rgba(0,80,40,0.12) 60%, transparent 100%)', particles: '#1E90FF', scene: 'Mystical forest twilight · Blue lotus & peacock sky' },
  glastonbury: { gradient: 'radial-gradient(ellipse 110% 70% at 50% 70%, #001a0a 0%, #003318 30%, #000f07 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(0,255,127,0.05) 0%, rgba(0,180,80,0.12) 60%, transparent 100%)', particles: '#00FF7F', scene: 'Green hills of Avalon · Emerald mist rising' },
  giza: { gradient: 'radial-gradient(ellipse 120% 80% at 50% 100%, #0d0900 0%, #1a1200 30%, #0a0700 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(0,0,20,0.8) 0%, rgba(20,15,0,0.4) 70%, rgba(212,175,55,0.06) 100%)', particles: '#FFD700', scene: 'Cosmic night sky · Milky Way · Ancient torsion' },
  sedona: { gradient: 'radial-gradient(ellipse 110% 70% at 50% 80%, #2a0800 0%, #4a1200 30%, #1a0500 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(255,69,0,0.08) 0%, rgba(180,40,0,0.18) 60%, transparent 100%)', particles: '#FF4500', scene: 'Red rock vortex · Fiery sunset · Energy spirals' },
  pleiades: { gradient: 'radial-gradient(ellipse 120% 90% at 50% 40%, #00101e 0%, #001828 30%, #000a14 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(224,255,255,0.05) 0%, rgba(65,105,225,0.08) 60%, transparent 100%)', particles: '#E0FFFF', scene: 'Deep space nebula · Diamond-white stardust' },
  sirius: { gradient: 'radial-gradient(ellipse 120% 80% at 50% 40%, #000820 0%, #000d30 30%, #000510 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(65,105,225,0.1) 0%, rgba(30,60,180,0.08) 60%, transparent 100%)', particles: '#4169E1', scene: 'The Blue Star · Initiation light field' },
  arcturus: { gradient: 'radial-gradient(ellipse 110% 80% at 50% 40%, #0d0020 0%, #1a0035 30%, #08001a 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(153,50,204,0.1) 0%, rgba(100,0,180,0.08) 60%, transparent 100%)', particles: '#9932CC', scene: 'Violet regeneration grid · Geometric light fields' },
  mauritius: { gradient: 'radial-gradient(ellipse 110% 70% at 50% 40%, #0a0a00 0%, #141400 30%, #070700 60%, #050505 100%)', overlay: 'linear-gradient(180deg, rgba(240,230,140,0.06) 0%, rgba(200,190,80,0.04) 60%, transparent 100%)', particles: '#F0E68C', scene: 'Miracle Room · Divine Spark field' },
  shirdi: { gradient: 'radial-gradient(ellipse 100% 80% at 50% 100%, #1a0800 0%, #2a1200 30%, #0f0600 60%, #050505 100%)', overlay: 'linear-gradient(180deg, transparent 50%, rgba(255,107,53,0.12) 80%, rgba(255,107,53,0.20) 100%)', particles: '#FF6B35', scene: 'Dhuni eternal flame · Sacred fire of surrender' },
};
function getSiteBG(id: string): SiteBG {
  return SITE_BG[id] ?? { gradient: 'radial-gradient(ellipse 80% 60% at 50% 30%, #0a0602 0%, #050505 70%)', overlay: 'none', particles: '#D4AF37', scene: '' };
}

// ─── Site DB ──────────────────────────────────────────────────────────────────
interface SiteDBEntry { title: string; primaryBenefit: string; instruction: string; experience: string; signature: string; intensityLabel?: string; bio?: string; }
const SITE_DB: Record<string, SiteDBEntry> = {
  giza: { title: 'Pyramid of Giza', primaryBenefit: 'Spinal Alignment & Torsion Field', instruction: 'Visualize a golden pillar of light passing through your spine, root to crown.', experience: 'A sense of vertical alignment and structural integrity throughout the body.', signature: 'GIZA_TORSION' },
  babaji: { title: "Mahavatar Babaji's Cave", primaryBenefit: 'Kriya DNA Activation', instruction: "Focus on the Third Eye. Breathe 'up and down' the spine in a spiral.", experience: 'Deep stillness, spinal heat, a sense of timeless presence.', signature: 'KRIYA_SYNC' },
  arunachala: { title: 'Arunachala', primaryBenefit: 'Self-Inquiry & Silence', instruction: "Rest in the 'I AM' presence. Let all thoughts dissolve back to their source.", experience: 'The mind becoming quiet. The heart expanding into boundlessness.', signature: 'STILLNESS_FIELD' },
  samadhi: { title: 'Samadhi Portal', primaryBenefit: 'Aura Repair', instruction: 'Merge your awareness with the infinite void. Dissolve the edges of self completely.', experience: 'A feeling of dissolving into the infinite. The aura resets.', signature: 'AURA_REPAIR' },
  machu_picchu: { title: 'Machu Picchu', primaryBenefit: 'Solar Vitality & Manifestation', instruction: 'Breathe the golden sun directly into your Solar Plexus.', experience: 'A surge of vitality, personal power, and manifestation clarity.', signature: 'SOLAR_SYNC' },
  lourdes: { title: 'Lourdes Grotto', primaryBenefit: 'Physical Restoration', instruction: 'Imagine pure healing water flowing through every cell.', experience: 'A soothing, cooling, cleansing sensation through the entire body.', signature: 'WATER_RESONANCE' },
  mansarovar: { title: 'Lake Mansarovar', primaryBenefit: 'Mental Detox & Crown Purification', instruction: 'Visualize crystal clear Himalayan water pouring through the Crown chakra.', experience: 'Mental clarity. A sense of pure, high-altitude air in the mind.', signature: 'MENTAL_DETOX' },
  zimbabwe: { title: 'Great Zimbabwe', primaryBenefit: 'Ancestral Strength', instruction: "Feel the strength of thousands of years of lineage grounding you into the Earth's core.", experience: 'A feeling of ancestral support, solid foundation, and deep belonging.', signature: 'ANCESTRAL_STRENGTH' },
  shasta: { title: 'Mount Shasta', primaryBenefit: 'Light-Body Activation', instruction: 'Visualize a violet flame surrounding the entire body.', experience: "A 'cool,' breezy feeling in the aura. The body feeling lighter.", signature: 'LIGHT_BODY_SYNC' },
  luxor: { title: 'Luxor Temples', primaryBenefit: 'Ka Body & Healer Activation', instruction: 'Breathe warm alchemical gold light into the palms of the hands.', experience: 'Heat and tingling in the hands. A warm, solid sensation in the physical body.', signature: 'KA_ACTIVATION' },
  uluru: { title: 'Uluru', primaryBenefit: 'Dreamtime & Ancestral DNA', instruction: "Sink deep into the red earth. Feel the Dreamtime consciousness rising.", experience: "Intense grounding. A feeling of being 'held' by the entire Earth.", signature: 'DREAMTIME_SYNC' },
  kailash_13x: { title: 'Mount Kailash — 13X Awakening', primaryBenefit: 'Moksha / Total Purification', instruction: 'Breathe in a 7.83-second cycle. Visualize the sacred peak; allow all karmic layers to dissolve.', experience: 'Shimmering violet clarity. Total purification. A sense of liberation.', signature: 'KAILASH_SHIMMER', bio: 'The Axis Mundi. Strips karmic imprints and 13× the power of any mantra or healing audio.' },
  glastonbury: { title: 'Glastonbury (Avalon)', primaryBenefit: 'Heart-Gate Activation', instruction: 'Open the heart gate. Breathe emerald light into the chest.', experience: 'Heart-Gate activation. Emotional restoration. An emerald warmth in the chest.', signature: 'AVALON_MIST', bio: 'Heart-Gate activation and emotional restoration. Heals relationships and grief.' },
  sedona: { title: 'Sedona Vortex', primaryBenefit: 'Psychic Vision & Ability Activation', instruction: "Align with the magnetic spiral. Focus at the Third Eye.", experience: 'Magnetic spiral activation. Heightened psychic vision. Creative clarity.', signature: 'SEDONA_VORTEX', bio: 'Spins out mental fog and activates dormant psychic abilities.' },
  titicaca: { title: 'Lake Titicaca', primaryBenefit: 'Creative Rebirth & Manifestation', instruction: 'Connect to the sacral center. Solar gold light ripples from the lake into the lower belly.', experience: 'Solar gold ripples. Creative energy surging.', signature: 'SOLAR_RIPPLES', bio: 'Activates the sacral center for creative rebirth and manifestation.' },
  amritsar: { title: 'Golden Temple — Harmandir Sahib', primaryBenefit: 'Selfless Service (Seva) & Infinite Abundance', instruction: 'Visualize wading into still, golden water. Liquid gold light rises into your heart.', experience: 'A warm, liquid-gold sensation flooding the chest. Deep equality and profound calm.', signature: 'AMRIT_SAROVAR', bio: 'Clears poverty consciousness. Aligns the heart with selfless giving (Seva).' },
  mauritius: { title: "Paramahamsa Vishwananda's Miracle Room", primaryBenefit: 'Quantum Shifts & Cellular Recalibration', instruction: 'Sit in complete stillness. Do NOT visualize. Empty the mind. Become the vessel.', experience: 'Third Eye pressure. Palm heat. Spontaneous emotional release. Time distortion.', signature: 'MIRACLE_PORTAL', bio: 'Breaks stagnant physical laws in the body. Used for impossible healing.' },
  shirdi: { title: 'Shirdi Sai Baba Dhuni Samadhi', primaryBenefit: 'Total Surrender & Nervous System Protection', instruction: 'Visualize the Dhuni — ancient sacred fire. Offer every fear into the flame. Repeat: "Shraddha. Saburi."', experience: 'A warm weight settling on the shoulders. Fear dissolving. Deep protection.', signature: 'DHUNI_FLAME', intensityLabel: 'Faith & Patience (Shraddha / Saburi)', bio: 'Drastically lowers cortisol/stress. Creates a Faith Shield for the nervous system.' },
  vrindavan_krsna: { title: 'Ancient Vrindavan (Era of Krishna)', primaryBenefit: 'Premananda — Supreme Bliss', instruction: 'Rest in the peacock-blue field of divine play. Allow falling lotus petals to carry you into bliss.', experience: 'Premananda — bliss arising from love. Spontaneous joy.', signature: 'FALLING_LOTUS', bio: 'Infuses the home with Supreme Bliss. Heals through joy and divine love.' },
  ayodhya_rama: { title: 'Ancient Ayodhya (Era of Rama & Hanuman)', primaryBenefit: 'Dharma & Spiritual Fortress', instruction: "Invoke the golden shield of dharma. Feel Rama's order and Hanuman's protection anchoring.", experience: 'Golden shield aura forming. Dharma and divine protection established.', signature: 'GOLDEN_SHIELD_AURA', bio: 'The ultimate Spiritual Fortress. Provides 24/7 protection and re-establishes Dharma.' },
  lemuria: { title: 'Lemuria (Mu)', primaryBenefit: 'Maternal Healing & Inner Child Safety', instruction: 'Sink into warm turquoise waters. Allow maternal creation energy to restore the heart.', experience: 'Tropical soft warmth. Deep emotional safety.', signature: 'TROPICAL_SOFT_GLOW', bio: 'Maternal and Ancestral healing. Provides deep emotional safety.' },
  atlantis: { title: 'Atlantis (Poseidia)', primaryBenefit: 'Mental Clarity & High-Tech Logic', instruction: 'Merge with deep navy crystal light. Let liquid light geometry flow through the brain.', experience: 'Liquid light geometry visible in the mind. Crystal clarity.', signature: 'LIQUID_LIGHT_GEOMETRY', bio: 'Clears brain fog and enhances high-tech logic and analytical brilliance.' },
  pleiades: { title: 'Pleiades Star System', primaryBenefit: 'Starlight Harmony & Music Production', instruction: 'Receive diamond-white starlight from above. Let it flow through you into your creative work.', experience: 'Diamond sparkle. Creative downloads arriving spontaneously.', signature: 'DIAMOND_SPARKLE', bio: 'Aligns music production and healing audio with Starlight Harmony.' },
  sirius: { title: 'Sirius (The Blue Star)', primaryBenefit: 'Initiation & Wisdom Downloads', instruction: 'Attune to the Blue Star. Open to initiation. Allow ancient high-wisdom to download.', experience: 'Double sun flare in inner vision. A sense of being initiated.', signature: 'DOUBLE_SUN_FLARE', bio: 'Transmits initiation and Ancient High-Wisdom.' },
  arcturus: { title: 'Arcturus', primaryBenefit: 'Rapid Regeneration & Geometric Healing', instruction: 'Let an electric violet grid pulse through the body from head to toe.', experience: 'Violet grid pulse throughout the body. Cellular regeneration.', signature: 'VIOLET_GRID_PULSE', bio: 'Focused on rapid physical regeneration and advanced geometric healing.' },
  lyra: { title: 'Lyra (The Felines)', primaryBenefit: 'Original Sound — Frequency of Creation', instruction: 'Merge with pure white light. This is the original sound. Do not direct it. Become it.', experience: 'White light fire. The feeling of touching the original creative frequency.', signature: 'WHITE_LIGHT_FIRE', bio: 'The Original Sound and Frequency of Creation.' },
};

const MODES = [
  { id: 'ADMIN', name: 'Admin', intensity: 1.0, description: 'Live Testing: Active only while engine running.' },
  { id: 'INTEGRATION', name: 'Integration', intensity: 0.25, description: 'Normal Life: Maintains energy without high intensity.' },
  { id: 'TEMPLE_LOCK', name: 'Temple Lock', intensity: 0.6, description: '24/7 Continuity: Keeps the house permanently locked.' },
];

// ─── Residual Presets ─────────────────────────────────────────────────────────
type PresetIcon = 'music' | 'moon' | 'shield' | 'star' | 'sparkle';
interface ResidualPreset { id: string; label: string; icon: PresetIcon; site: string; intensity: number; mode: string; color: string; why: string; tip: string; }
const RESIDUAL_PRESETS: ResidualPreset[] = [
  { id: 'studio', label: 'Leaving for Studio', icon: 'music', site: 'pleiades', intensity: 80, mode: 'INTEGRATION', color: '#22D3EE', why: 'Pleiades broadcasts Starlight Harmony into your home while you create.', tip: 'Play healing audio at home — Kailash 13X amplifies every note 13×.' },
  { id: 'sleep', label: 'Going to Sleep', icon: 'moon', site: 'babaji', intensity: 30, mode: 'INTEGRATION', color: '#E6E6FA', why: "Babaji's Cave transmits deep Kriya-level stillness. 30% holds the field without disturbing sleep.", tip: 'Use Shirdi at 25% instead if anxiety is present.' },
  { id: 'sleep_stress', label: 'Sleep (High Stress)', icon: 'moon', site: 'shirdi', intensity: 25, mode: 'INTEGRATION', color: '#FF6B35', why: "Shirdi's Dhuni creates a 24/7 cortisol-reducing Faith Shield through the night.", tip: 'Ideal when grief, fear, or overwhelming stress is present.' },
  { id: 'protection', label: 'Family Protection', icon: 'shield', site: 'ayodhya_rama', intensity: 70, mode: 'TEMPLE_LOCK', color: '#FFA500', why: 'Ayodhya (Rama + Hanuman) maintains a Spiritual Fortress 24/7 at 70% Temple Lock.', tip: 'Activate whenever you travel internationally or sense spiritual instability.' },
  { id: 'healing', label: 'Home Healing Day', icon: 'star', site: 'lourdes', intensity: 60, mode: 'INTEGRATION', color: '#ADD8E6', why: 'Lourdes transmits healing water consciousness continuously through the home.', tip: 'After 4 hours switch to Arcturus at 40% for cellular regeneration.' },
  { id: 'abundance', label: 'Abundance Work', icon: 'sparkle', site: 'amritsar', intensity: 65, mode: 'INTEGRATION', color: '#FFD700', why: 'The Golden Temple clears poverty consciousness and aligns the space with Seva-based abundance.', tip: 'Best combined with morning business intention-setting.' },
];

// ─── Healing Prescriptions ────────────────────────────────────────────────────
interface HealingRx { id: string; label: string; icon: string; color: string; primary: string; primaryName: string; primaryIntensity: number; backup: string; backupName: string; backupIntensity: number; rx: string; physical: string; hydration: boolean; hydrationNote: string; }
const HEALING_RX: HealingRx[] = [
  { id: 'anxiety', label: 'Anxiety & Stress', icon: '🌿', color: '#FF6B35', primary: 'shirdi', primaryName: 'Shirdi Sai Baba', primaryIntensity: 45, backup: 'babaji', backupName: "Babaji's Cave", backupIntensity: 30, rx: 'Shirdi at 45% (Integration). Sit quietly for 20 min. Offer each anxious thought into the Dhuni flame. The Saburi field absorbs cortisol from the nervous system.', physical: 'Within 15–30 min: breath slowing, warm settling on the shoulders, chest tension releasing.', hydration: false, hydrationNote: '' },
  { id: 'creative_block', label: 'Creative Block', icon: '✦', color: '#22D3EE', primary: 'pleiades', primaryName: 'Pleiades', primaryIntensity: 80, backup: 'sedona', backupName: 'Sedona Vortex', backupIntensity: 65, rx: 'Pleiades at 80% while working. Do not force ideas — begin moving in the studio. Starlight Harmony delivers downloads when you are in motion.', physical: 'Unexpected melodic ideas, clarity on stuck arrangements, effortless flow arriving.', hydration: false, hydrationNote: '' },
  { id: 'physical_healing', label: 'Physical Illness', icon: '💙', color: '#ADD8E6', primary: 'lourdes', primaryName: 'Lourdes Grotto', primaryIntensity: 60, backup: 'arcturus', backupName: 'Arcturus', backupIntensity: 55, rx: 'Lourdes at 60% all day (Temple Lock if possible). After 4 hours switch to Arcturus at 55% for cellular geometric healing.', physical: 'A soothing, cooling sensation. Reduction in inflammation. Accelerated recovery.', hydration: true, hydrationNote: 'Drink 2–3 extra glasses of structured water daily. Water conducts Lourdes and Arcturus energy.' },
  { id: 'relationship', label: 'Relationship Healing', icon: '💚', color: '#00FF7F', primary: 'glastonbury', primaryName: 'Glastonbury (Avalon)', primaryIntensity: 55, backup: 'vrindavan_krsna', backupName: 'Ancient Vrindavan', backupIntensity: 60, rx: "Glastonbury at 55% overnight for emotional armor dissolution. Vrindavan (Krishna) heals through joy rather than emotional processing.", physical: 'Spontaneous emotional release. Chest softening. Forgiveness arising without effort.', hydration: false, hydrationNote: '' },
  { id: 'mantra_power', label: 'Mantra & Prayer Power', icon: '🔮', color: '#7B61FF', primary: 'kailash_13x', primaryName: 'Mount Kailash 13X', primaryIntensity: 70, backup: 'sirius', backupName: 'Sirius (Blue Star)', backupIntensity: 65, rx: 'Kailash at 70% before and during any mantra or healing audio. The Axis Mundi amplifies every syllable 13×.', physical: 'Crown and Third Eye vibration during chanting. Mantra becoming self-sustaining.', hydration: true, hydrationNote: '⚠ High-voltage. Drink 2 glasses of structured water before and after.' },
  { id: 'karmic_clearing', label: 'Deep Karmic Clearing', icon: '♾', color: '#7B61FF', primary: 'kailash_13x', primaryName: 'Mount Kailash 13X', primaryIntensity: 85, backup: 'arunachala', backupName: 'Arunachala', backupIntensity: 70, rx: 'Kailash at 85% (only after 7 days of practice). Darken room, 20 min, 7.83-second breath cycles.', physical: 'Intense crown activity. Emotional release. A sense of something heavy leaving. Rest required after.', hydration: true, hydrationNote: '⚠ Maximum voltage. 3 glasses of structured water before. Ground on bare earth 5 min after.' },
  { id: 'miracle', label: 'Miracle Activation', icon: '✦', color: '#F0E68C', primary: 'mauritius', primaryName: "Paramahamsa's Room", primaryIntensity: 60, backup: 'amritsar', backupName: 'Golden Temple', backupIntensity: 70, rx: 'Mauritius at 60% (never exceed 80% without practitioner guidance). Complete stillness. No visualization. Become the vessel.', physical: 'Divine Spark particles in app confirm activation. Third Eye pressure, palm heat, time distortion normal.', hydration: true, hydrationNote: '⚠ Miracle-Class node. Structured water is mandatory at 963Hz voltage.' },
  { id: 'abundance_seva', label: 'Abundance & Business', icon: '🌊', color: '#FFD700', primary: 'amritsar', primaryName: 'Golden Temple', primaryIntensity: 65, backup: 'machu_picchu', backupName: 'Machu Picchu', backupIntensity: 70, rx: 'Amritsar at 65% every morning before business decisions. Amrit Sarovar clears scarcity and aligns all decisions with Seva law.', physical: 'Liquid-gold sensation in the chest. Clarity in financial decisions. Deep equanimity.', hydration: false, hydrationNote: '' },
];

// ─── Crystal Setup Steps ──────────────────────────────────────────────────────
const CRYSTAL_STEPS = [
  { id: 0, corner: 'North-West', label: 'First Crystal', instruction: 'Place a Clear Quartz crystal in the furthest North-West corner of your home. Point facing up or toward the center of the room.' },
  { id: 1, corner: 'North-East', label: 'Second Crystal', instruction: 'Place the second Clear Quartz crystal in the furthest North-East corner. The crystal anchors the second node of the field boundary.' },
  { id: 2, corner: 'South-East', label: 'Third Crystal', instruction: 'Place the third Clear Quartz crystal in the furthest South-East corner. Three corners now form a triangular energy field.' },
  { id: 3, corner: 'South-West', label: 'Fourth Crystal', instruction: 'Place the final crystal in the furthest South-West corner. All four corners now form a sealed energetic square — the Temple perimeter.' },
];

// ─── Persistence ──────────────────────────────────────────────────────────────
const ANCHOR_KEY = 'sh:temple_home_anchor';
const CRYSTAL_KEY = 'sh:crystal_setup_done';
interface AnchorState { siteId: string; intensity: number; mode: string; anchored: boolean; ts: number; }

const DEFAULT_SITE_ID = 'giza';

function isKnownSiteId(id: unknown): id is string {
  return typeof id === 'string' && SACRED_SITES.some(s => s.id === id);
}
function isKnownMode(id: unknown): id is string {
  return typeof id === 'string' && MODES.some(m => m.id === id);
}

function loadAnchor(): AnchorState | null {
  try {
    const r = localStorage.getItem(ANCHOR_KEY);
    if (!r) return null;
    const raw = JSON.parse(r) as Partial<AnchorState>;
    const siteId = isKnownSiteId(raw.siteId) ? raw.siteId : DEFAULT_SITE_ID;
    const mode = isKnownMode(raw.mode) ? raw.mode : 'INTEGRATION';
    const intensity =
      typeof raw.intensity === 'number' && raw.intensity >= 0 && raw.intensity <= 100
        ? raw.intensity
        : 100;
    return {
      siteId,
      mode,
      intensity,
      anchored: !!raw.anchored,
      ts: typeof raw.ts === 'number' ? raw.ts : Date.now(),
    };
  } catch (_e) {
    return null;
  }
}
function saveAnchor(s: AnchorState): void { try { localStorage.setItem(ANCHOR_KEY, JSON.stringify(s)); } catch (_e) { /* noop */ } }
function loadCrystalDone(): boolean { try { return localStorage.getItem(CRYSTAL_KEY) === '1'; } catch (_e) { return false; } }
function saveCrystalDone(): void { try { localStorage.setItem(CRYSTAL_KEY, '1'); } catch (_e) { /* noop */ } }

// ─── Motion helpers (outside component — no stale closures) ──────────────────
function calcMotionSaturation(variance: number, intensity: number): number {
  const stillness = Math.max(0, 1 - variance / 10);
  return Math.round(intensity * (0.3 + 0.7 * stillness));
}
function getMotionZone(sat: number): string {
  if (sat > 90) return 'CORE — You are at the Anchor';
  if (sat > 70) return 'HIGH COHERENCE';
  if (sat > 45) return 'INTEGRATION';
  return 'PERIPHERAL — Move toward Center';
}
function getMotionZoneColor(sat: number): string {
  if (sat > 90) return '#D4AF37';
  if (sat > 70) return '#22D3EE';
  if (sat > 45) return '#A78BFA';
  return 'rgba(255,255,255,0.35)';
}

function getSiteCategory(id: string): { label: string; color: string } {
  if (['pleiades', 'sirius', 'arcturus', 'lyra'].includes(id)) return { label: 'GALACTIC', color: '#22D3EE' };
  if (['vrindavan_krsna', 'ayodhya_rama'].includes(id)) return { label: 'TEMPORAL', color: '#F59E0B' };
  if (['lemuria', 'atlantis'].includes(id)) return { label: 'ANCIENT', color: '#A78BFA' };
  if (['kailash_13x', 'glastonbury', 'sedona', 'titicaca'].includes(id)) return { label: 'SUPREME', color: '#D4AF37' };
  if (['amritsar', 'mauritius', 'shirdi'].includes(id)) return { label: 'MIRACLE-CLASS', color: '#FF9FD2' };
  return { label: 'EARTH', color: '#4ADE80' };
}

// ─── Components ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', glow = false, style = {} }: { children: React.ReactNode; className?: string; glow?: boolean; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-[28px] transition-all duration-300 ${className}`}
      style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: glow ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(255,255,255,0.05)', boxShadow: glow ? '0 0 40px rgba(212,175,55,0.05)' : 'none', ...style }}>
      {children}
    </div>
  );
}

// ─── Cinematic Background ─────────────────────────────────────────────────────
function CinematicBackground({ siteId, intensity }: { siteId: string; intensity: number }) {
  const bg = getSiteBG(siteId);
  // Safe hex opacity: intensity 0-100 maps to 0x00-0x12
  const opacityHex = Math.min(255, Math.round(intensity * 0.18)).toString(16).padStart(2, '0');
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ transition: 'all 2.5s ease' }}>
      <div className="absolute inset-0" style={{ background: bg.gradient, transition: 'all 2.5s ease' }} />
      {bg.overlay !== 'none' && <div className="absolute inset-0" style={{ background: bg.overlay, transition: 'all 2.5s ease' }} />}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 30% at 50% 15%, ${bg.particles}${opacityHex} 0%, transparent 65%)`, transition: 'all 1.5s ease' }} />
      {siteId === 'amritsar' && <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to top, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 60%, transparent 100%)', animation: 'amrit-ripple 4s ease-in-out infinite' }} />}
      {siteId === 'shirdi' && <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,107,53,0.15) 0%, transparent 70%)', animation: 'dhuni 3s ease-in-out infinite' }} />}
      {siteId === 'kailash_13x' && <div className="absolute top-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(180deg, rgba(123,97,255,0.12) 0%, transparent 100%)', animation: 'schumann-pulse 7.83s ease-in-out infinite' }} />}
      {siteId === 'pleiades' && <div className="absolute inset-0" style={{ opacity: 0.06, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />}
      {siteId === 'glastonbury' && <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 100%, rgba(0,180,80,0.1) 0%, transparent 70%)' }} />}
    </div>
  );
}

// ─── Divine Sparks (Mauritius only) ──────────────────────────────────────────
function DivineSparks() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const sparks: Array<{ x: number; y: number; a: number; r: number }> = [];
    let animId: number;
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      if (Math.random() < 0.4) sparks.push({ x: Math.random() * c.width, y: Math.random() * c.height, a: 1, r: Math.random() * 2.5 + 0.5 });
      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].a -= 0.035;
        ctx.beginPath();
        ctx.arc(sparks[i].x, sparks[i].y, sparks[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,230,${sparks[i].a})`;
        ctx.fill();
        if (sparks[i].a <= 0) sparks.splice(i, 1);
      }
      animId = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[1]" style={{ mixBlendMode: 'screen' }} />;
}

// ─── Sigil Ring ───────────────────────────────────────────────────────────────
function SigilRing({ color, intensity, anchored, miracle }: { color: string; intensity: number; anchored: boolean; miracle: boolean }) {
  return (
    <div className="relative flex items-center justify-center h-40 w-40 mx-auto my-2">
      <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${color}40`, boxShadow: anchored ? `0 0 ${miracle ? 70 : 35}px ${color}40` : `0 0 10px ${color}15`, animation: anchored ? 'spin 12s linear infinite' : undefined }} />
      <div className="absolute inset-3 rounded-full border" style={{ borderColor: `${color}60`, animation: anchored ? 'spin-reverse 8s linear infinite' : undefined }} />
      {miracle && <div className="absolute inset-1 rounded-full border border-dashed" style={{ borderColor: `${color}25`, animation: 'spin 20s linear infinite' }} />}
      <div className="absolute inset-6 rounded-full" style={{ background: `radial-gradient(circle, ${color}28 0%, transparent 70%)`, boxShadow: `0 0 ${miracle ? 50 : 25}px ${color}20` }} />
      <div className="relative z-10 text-center">
        <div className="text-3xl font-black tabular-nums" style={{ color, textShadow: `0 0 25px ${color}70` }}>{intensity}</div>
        <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-white/30">%</div>
      </div>
    </div>
  );
}

// ─── Motion Nadi Scanner ──────────────────────────────────────────────────────
function MotionNadiScanner({ intensity }: { intensity: number }) {
  const [motionState, setMotionState] = useState<'idle' | 'active' | 'unavailable'>('idle');
  const [variance, setVariance] = useState(0);
  const [saturation, setSaturation] = useState<number | null>(null);
  const [zone, setZone] = useState('');
  const samplesRef = useRef<number[]>([]);
  const handlerRef = useRef<((e: Event) => void) | null>(null);
  const intensityRef = useRef(intensity);

  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  useEffect(() => {
    if (motionState === 'active') {
      const sat = calcMotionSaturation(variance, intensity);
      setSaturation(sat);
      setZone(getMotionZone(sat));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity]);

  useEffect(() => {
    return () => { if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current); };
  }, []);

  const startScan = useCallback(async () => {
    // Use window as any to avoid TypeScript lib mismatch with DeviceMotionEvent
    const win = window as Record<string, unknown>;
    if (!('DeviceMotionEvent' in win)) { setMotionState('unavailable'); return; }
    const DME = win['DeviceMotionEvent'] as { requestPermission?: () => Promise<string> };
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        if (result !== 'granted') { setMotionState('unavailable'); return; }
      } catch (_e) { setMotionState('unavailable'); return; }
    }
    setMotionState('active');
    samplesRef.current = [];
    const handler = (e: Event) => {
      const motionEvent = e as Event & { accelerationIncludingGravity?: { x: number | null; y: number | null; z: number | null } };
      const acc = motionEvent.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      samplesRef.current.push(mag);
      if (samplesRef.current.length > 20) samplesRef.current.shift();
      const mean = samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length;
      const vr = samplesRef.current.reduce((a, b) => a + (b - mean) ** 2, 0) / samplesRef.current.length;
      const smoothV = Math.min(vr, 10);
      setVariance(smoothV);
      const sat = calcMotionSaturation(smoothV, intensityRef.current);
      setSaturation(sat);
      setZone(getMotionZone(sat));
    };
    handlerRef.current = handler;
    window.addEventListener('devicemotion', handler);
  }, []);

  const zoneColor = saturation !== null ? getMotionZoneColor(saturation) : '#D4AF37';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${motionState === 'active' ? 'bg-emerald-400 animate-pulse' : motionState === 'unavailable' ? 'bg-red-400' : 'bg-white/20'}`} />
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
            {motionState === 'active' ? 'Motion Scanner Active' : motionState === 'unavailable' ? 'Motion Unavailable' : 'Nadi Scanner — No GPS Required'}
          </span>
        </div>
        {motionState === 'active' && <span className="text-[9px] font-mono text-white/20">σ²={variance.toFixed(2)}</span>}
      </div>
      {motionState === 'active' && saturation !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25 mb-1">Field Saturation Here</div>
              <div className="text-3xl font-black tabular-nums" style={{ color: zoneColor, textShadow: `0 0 20px ${zoneColor}50` }}>{saturation}%</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] tracking-[0.4em] uppercase text-white/25 mb-1">Zone</div>
              <div className="text-[11px] font-extrabold" style={{ color: zoneColor }}>{zone.split('—')[0].trim()}</div>
            </div>
          </div>
          <div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full" animate={{ width: `${saturation}%` }} transition={{ duration: 0.6 }} style={{ background: `linear-gradient(90deg, ${zoneColor}50, ${zoneColor})` }} />
            </div>
            {zone.includes('—') && <p className="text-[9px] text-white/30 mt-1 italic">{zone.split('—')[1]?.trim()}</p>}
          </div>
          <div className="pt-1 border-t border-white/[0.04]">
            <p className="text-[10px] text-white/30 leading-relaxed">
              {variance < 1 ? '✓ Still — maximum field depth. Sit and receive.' : variance < 3 ? '◎ Slight movement — breathe slowly to settle.' : '↺ Moving — walk slowly toward the center of your home.'}
            </p>
          </div>
        </motion.div>
      )}
      {motionState === 'active' && (
        <div className="space-y-1.5">
          {[
            { label: 'Core — Anchor Point', range: 'Completely still', color: '#D4AF37', active: variance < 1 },
            { label: 'High Coherence', range: 'Minimal movement', color: '#22D3EE', active: variance >= 1 && variance < 3 },
            { label: 'Integration', range: 'Slow walking', color: '#A78BFA', active: variance >= 3 && variance < 6 },
            { label: 'Peripheral', range: 'Active movement', color: 'rgba(255,255,255,0.3)', active: variance >= 6 },
          ].map(z => (
            <div key={z.label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: z.active ? `${z.color}10` : 'rgba(255,255,255,0.01)', border: z.active ? `1px solid ${z.color}30` : '1px solid rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: z.active ? z.color : 'rgba(255,255,255,0.12)' }} />
                <span className="text-[10px] font-medium" style={{ color: z.active ? z.color : 'rgba(255,255,255,0.28)' }}>{z.label}</span>
              </div>
              <span className="text-[8px] font-mono" style={{ color: z.active ? z.color : 'rgba(255,255,255,0.18)' }}>{z.range}</span>
            </div>
          ))}
        </div>
      )}
      {motionState === 'idle' && (
        <button onClick={() => { void startScan(); }} className="w-full py-3 rounded-2xl text-[10px] font-extrabold tracking-[0.25em] uppercase" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE' }}>
          <Radio size={11} className="inline mr-2" />Activate Nadi Scanner — No GPS
        </button>
      )}
      {motionState === 'unavailable' && (
        <div className="py-3 px-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[11px] text-white/35">Motion sensor unavailable.</p>
          <p className="text-[10px] text-white/20 mt-1">Use on a physical phone with motion sensors enabled.</p>
        </div>
      )}
    </div>
  );
}

// ─── Crystal Setup Flow ───────────────────────────────────────────────────────
function CrystalSetupFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const allDone = confirmed.size === CRYSTAL_STEPS.length;

  const confirmStep = (idx: number) => {
    setConfirmed(prev => new Set([...prev, idx]));
    if (idx < CRYSTAL_STEPS.length - 1) setTimeout(() => setStep(idx + 1), 600);
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 mb-2">Crystal Grid Activation</div>
        <p className="text-[11px] text-white/35 leading-relaxed max-w-xs mx-auto">Place 4 Clear Quartz crystals in the four corners of your home to seal the Temple perimeter. Confirm each one as you place it.</p>
      </div>
      <div className="flex justify-center gap-3 py-1">
        {CRYSTAL_STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500"
              style={{ background: confirmed.has(i) ? 'rgba(74,222,128,0.15)' : step === i ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)', border: confirmed.has(i) ? '1px solid rgba(74,222,128,0.4)' : step === i ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.05)' }}>
              {confirmed.has(i) ? <CheckCircle size={14} className="text-emerald-400" /> : <span className="text-[10px] font-black" style={{ color: step === i ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>{i + 1}</span>}
            </div>
            <span className="text-[7px] tracking-widest uppercase" style={{ color: confirmed.has(i) ? 'rgba(74,222,128,0.6)' : step === i ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)' }}>{s.corner.split('-')[0]}</span>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="rounded-[24px] p-5 space-y-3" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] flex items-center justify-center text-lg" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>💎</div>
            <div>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/50">Crystal {step + 1} of 4</div>
              <div className="text-sm font-black text-white/80">{CRYSTAL_STEPS[step].label}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-[#D4AF37]/40">{CRYSTAL_STEPS[step].corner} Corner</div>
            </div>
          </div>
          <p className="text-[12px] text-white/50 leading-relaxed">{CRYSTAL_STEPS[step].instruction}</p>
          {!confirmed.has(step) ? (
            <button onClick={() => confirmStep(step)} className="w-full py-3 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>✓ Crystal Placed — Confirm</button>
          ) : (
            <div className="w-full py-3 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase text-center" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ADE80' }}>✓ Anchored</div>
          )}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[24px] p-5 text-center space-y-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <div className="text-2xl">🔮</div>
            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-emerald-400/70">Perimeter Sealed</div>
            <p className="text-[11px] text-white/45 leading-relaxed">All 4 crystal nodes confirmed. Your Temple Home perimeter is established. Now activate the Anchor to begin the 24/7 Phase-Lock.</p>
            <button onClick={() => { saveCrystalDone(); onComplete(); }} className="w-full py-3.5 rounded-2xl text-[11px] font-extrabold tracking-[0.3em] uppercase text-black" style={{ background: 'linear-gradient(135deg, #4ADE80, #22C55E)', boxShadow: '0 0 20px rgba(74,222,128,0.3)' }}>Seal the Temple — Begin Activation</button>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => { saveCrystalDone(); onComplete(); }} className="w-full text-center text-[9px] text-white/20 hover:text-white/40 tracking-[0.3em] uppercase py-1">Crystals already placed — skip setup</button>
    </div>
  );
}

// ─── TempleHomeInner ──────────────────────────────────────────────────────────
function TempleHomeInner() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { isLoading: authLoading } = useAuth();
  const saved = loadAnchor();

  const [selectedSite, setSelectedSite] = useState(saved?.siteId ?? 'giza');
  const [auraIntensity, setAuraIntensity] = useState(saved?.intensity ?? 100);
  const [currentMode, setCurrentMode] = useState(saved?.mode ?? 'INTEGRATION');
  const [isAnchored, setIsAnchored] = useState(saved?.anchored ?? false);
  const [showSpatialMap, setShowSpatialMap] = useState(false);
  const [infoSiteId, setInfoSiteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [anchorFlash, setAnchorFlash] = useState(false);
  const [activeTab, setActiveTab] = useState<'PORTAL' | 'HEALING' | 'PRESCRIPTIONS'>('PORTAL');
  const [presetFlash, setPresetFlash] = useState<string | null>(null);
  const [showHydrationAlert, setShowHydrationAlert] = useState(false);
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [crystalDone, setCrystalDone] = useState(() => loadCrystalDone());
  const [showCrystalSetup, setShowCrystalSetup] = useState(false);

  useEffect(() => {
    if (!isKnownSiteId(selectedSite)) setSelectedSite(DEFAULT_SITE_ID);
  }, [selectedSite]);
  useEffect(() => {
    if (!isKnownMode(currentMode)) setCurrentMode('INTEGRATION');
  }, [currentMode]);

  const currentSite = SACRED_SITES.find(s => s.id === selectedSite) ?? SACRED_SITES[0];
  const activeMode = MODES.find(m => m.id === currentMode) ?? MODES[1];
  const infoSite = infoSiteId ? SITE_DB[infoSiteId] : null;
  const cat = getSiteCategory(selectedSite);
  const isMiracle = ['amritsar', 'mauritius', 'shirdi'].includes(selectedSite);
  const db = SITE_DB[selectedSite];
  const intensityLabel = db?.intensityLabel ?? 'Aura Intensity';
  const siteBg = getSiteBG(selectedSite);
  const CATS = ['MIRACLE-CLASS', 'GALACTIC', 'TEMPORAL', 'ANCIENT', 'SUPREME', 'EARTH'];

  useEffect(() => { saveAnchor({ siteId: selectedSite, intensity: auraIntensity, mode: currentMode, anchored: isAnchored, ts: Date.now() }); }, [selectedSite, auraIntensity, currentMode, isAnchored]);
  useEffect(() => { setIsSyncing(true); const t = setTimeout(() => setIsSyncing(false), 800); return () => clearTimeout(t); }, [selectedSite, auraIntensity]);
  useEffect(() => {
    const isHighVoltage = selectedSite === 'mauritius' || selectedSite === 'kailash_13x';
    if (isHighVoltage && auraIntensity >= 60) {
      const t = setTimeout(() => setShowHydrationAlert(true), 1200);
      return () => clearTimeout(t);
    }
    setShowHydrationAlert(false);
    return undefined;
  }, [selectedSite, auraIntensity]);

  const applyPreset = useCallback((preset: ResidualPreset) => {
    setSelectedSite(preset.site);
    setAuraIntensity(preset.intensity);
    setCurrentMode(preset.mode);
    setPresetFlash(preset.id);
    setTimeout(() => setPresetFlash(null), 2500);
  }, []);

  const handleAnchor = useCallback(() => {
    if (!crystalDone) { setShowCrystalSetup(true); return; }
    setIsAnchored(true);
    setAnchorFlash(true);
    setTimeout(() => setAnchorFlash(false), 3000);
  }, [crystalDone]);

  const handleModeChange = useCallback((id: string) => {
    setCurrentMode(id);
    const m = MODES.find(x => x.id === id);
    if (m) setAuraIntensity(Math.round(m.intensity * 100));
  }, []);

  if (authLoading || adminLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        <p className="text-[8px] tracking-[0.5em] uppercase text-[#D4AF37]/40">Accessing Akasha-Neural Archive</p>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <CinematicBackground siteId="giza" intensity={30} />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="h-16 w-16 rounded-full border border-[#D4AF37]/20 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.05)' }}>
          <Lock className="h-7 w-7 text-[#D4AF37]/60" />
        </div>
        <div className="space-y-2">
          <p className="text-[8px] tracking-[0.5em] uppercase text-[#D4AF37]/40">Vedic Light-Code: Restricted</p>
          <h2 className="text-xl font-black tracking-tight text-[#D4AF37]">Temple Home</h2>
          <p className="text-xs text-white/40 leading-relaxed">This 24/7 Bhakti-Algorithm Engine is reserved for Temple Home License holders.</p>
        </div>
        <GlassCard className="w-full p-4" glow>
          <div className="text-[8px] tracking-[0.4em] uppercase text-[#D4AF37]/40 mb-1">Permanent Activation</div>
          <div className="text-2xl font-black text-[#D4AF37]">€499</div>
          <div className="text-[10px] text-white/30 mt-1">One-time · Stripe / Crypto</div>
        </GlassCard>
        <button onClick={() => navigate('/shop')} className="w-full py-4 rounded-[20px] text-[11px] font-extrabold tracking-[0.3em] uppercase text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0C040, #D4AF37)' }}>Unlock Temple Home</button>
        <button onClick={() => navigate('/akasha-infinity')} className="text-[10px] text-white/25 tracking-[0.2em] uppercase">Or explore Akasha–Infinity →</button>
        <button onClick={() => navigate('/explore')} className="text-[10px] text-[#D4AF37]/40 tracking-[0.2em] uppercase">← Return to Library</button>
      </div>
    </div>
  );

  // Original healing activations (unchanged logic)
  const bliss = auraIntensity > 90 ? { message: 'You are experiencing High-Coherence Bliss.', instruction: 'Enjoy the laughter and tingling. Breathe deeply into your spine.' } : null;
  const deepSync = selectedSite === 'babaji' && auraIntensity > 70 ? { sensations: ['Subtle Body Vibration', 'Deep Relaxation', 'Third Eye Pressure'], guidance: 'Do not resist the sleepiness. Your aura is restructuring.' } : null;
  const heartExpansion = selectedSite === 'babaji' && auraIntensity > 85 ? { advice: 'Relax your chest muscles. Visualize the pressure as a golden light.', quote: 'The Master resides in the cave of the heart.' } : null;
  const luxorHealer = selectedSite === 'luxor' && auraIntensity > 70 ? { instruction: 'Place your hands on the area needing healing. The Ka body is transmitting.' } : null;
  const amritsarSeva = selectedSite === 'amritsar' && auraIntensity > 40;
  const mauritiusSpark = selectedSite === 'mauritius' && auraIntensity > 50;
  const shirdiDhuni = selectedSite === 'shirdi' && auraIntensity > 30;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <CinematicBackground siteId={selectedSite} intensity={auraIntensity} />
      {selectedSite === 'mauritius' && <DivineSparks />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        @keyframes dhuni { 0%,100%{ opacity:.6 } 33%{ opacity:1 } 66%{ opacity:.75 } }
        @keyframes schumann-pulse { 0%,100%{ opacity:.6 } 50%{ opacity:1 } }
        @keyframes amrit-ripple { 0%,100%{ opacity:.7; transform:scaleX(1) } 50%{ opacity:1; transform:scaleX(1.03) } }
        @keyframes shimmer { 0%{ background-position:200% center } 100%{ background-position:-200% center } }
        .gold-shimmer { background: linear-gradient(90deg,#CFB53B,#FFF8DC,#FFD700,#FFF8DC,#CFB53B); background-size:200% auto; animation: shimmer 4s linear infinite; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .site-select option { background: #0a0602; color: #fff; }
        .intensity-slider::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,#D4AF37,#F0C040); box-shadow:0 0 12px rgba(212,175,55,.6); cursor:pointer; border:2px solid rgba(212,175,55,.3); }
        .intensity-slider::-webkit-slider-runnable-track { height:4px; border-radius:2px; background:rgba(212,175,55,.15); }
      `}</style>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/[0.04]" style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(24px)' }}>
        <button onClick={() => navigate('/explore')} className="p-2 rounded-xl hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.05)' }}><ArrowLeft size={18} className="text-[#D4AF37]/60" /></button>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}><TempleGateIcon className="text-[#D4AF37] h-4 w-4" /></div>
        <div className="flex-1">
          <h1 className={`text-base font-black tracking-[-0.04em] ${selectedSite === 'amritsar' ? 'gold-shimmer' : 'text-[#D4AF37]'}`}>Temple Home</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : isAnchored ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <p className="text-[8px] tracking-[0.4em] uppercase text-white/30">{isSyncing ? 'Syncing…' : isAnchored ? '24/7 Phase-Lock Active' : crystalDone ? 'Crystals Sealed · Ready' : 'Crystal Setup Required'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCrystalSetup(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={crystalDone ? { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 10 }}>💎</span>
            <span className="text-[7px] font-extrabold tracking-widest uppercase" style={{ color: crystalDone ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.25)' }}>{crystalDone ? 'Sealed' : 'Setup'}</span>
          </button>
          {isAnchored && (<div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}><Shield size={11} className="text-emerald-400 animate-pulse" /><span className="text-[8px] tracking-[0.3em] uppercase text-emerald-400/80">Locked</span></div>)}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex border-b border-white/[0.04]" style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(20px)' }}>
        {([{ id: 'PORTAL', Icon: Compass, label: 'Portal' }, { id: 'HEALING', Icon: Activity, label: 'Healing' }, { id: 'PRESCRIPTIONS', Icon: Star, label: 'Rx' }] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex-1 flex items-center justify-center gap-1.5 py-3 relative">
            <t.Icon size={12} className={activeTab === t.id ? 'text-[#D4AF37]' : 'text-white/25'} />
            <span className={`text-[9px] font-extrabold tracking-[0.35em] uppercase ${activeTab === t.id ? 'text-[#D4AF37]' : 'text-white/25'}`}>{t.label}</span>
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />}
          </button>
        ))}
      </div>

      <div className="relative z-10 p-4 pb-36 space-y-4">

        {/* Hero card */}
        <GlassCard className="p-5" glow style={selectedSite === 'amritsar' ? { border: '1px solid rgba(212,175,55,0.25)' } : {}}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase mb-1" style={{ color: cat.color }}>{cat.label} · SITE ENERGY ACTIVE</div>
              <h2 className={`text-lg font-black tracking-[-0.03em] leading-tight ${selectedSite === 'amritsar' ? 'gold-shimmer' : 'text-white/90'}`}>{currentSite.name}</h2>
              <p className="text-[10px] text-white/35 mt-0.5">{currentSite.focus}</p>
            </div>
            <button onClick={() => setInfoSiteId(selectedSite)} className="p-2 rounded-xl hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.05)' }}><Info size={14} className="text-[#D4AF37]/50" /></button>
          </div>
          {siteBg.scene !== '' && (
            <div className="mb-2 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5" style={{ background: `${currentSite.color}0a`, border: `1px solid ${currentSite.color}20` }}>
              <span className="text-[8px] font-mono tracking-widest" style={{ color: `${currentSite.color}80` }}>{siteBg.scene}</span>
            </div>
          )}
          {isMiracle && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-2 px-4 py-2 rounded-2xl flex items-center gap-2 w-fit"
              style={{ background: selectedSite === 'amritsar' ? 'rgba(212,175,55,0.08)' : selectedSite === 'mauritius' ? 'rgba(240,230,140,0.06)' : 'rgba(255,107,53,0.08)', border: `1px solid ${currentSite.color}30` }}>
              <span>{selectedSite === 'amritsar' ? '🌊' : selectedSite === 'mauritius' ? '✦' : '🔥'}</span>
              <div>
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase" style={{ color: currentSite.color }}>{selectedSite === 'amritsar' ? 'AMRIT SAROVAR' : selectedSite === 'mauritius' ? 'MIRACLE PORTAL' : 'DHUNI FLAME'}</div>
                <div className="text-[9px] text-white/30">{selectedSite === 'amritsar' ? 'Nectar Pool Active' : selectedSite === 'mauritius' ? 'Divine Spark Field' : 'Eternal Presence'}</div>
              </div>
            </motion.div>
          )}
          <SigilRing color={currentSite.color} intensity={auraIntensity} anchored={isAnchored} miracle={isMiracle} />
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="text-center"><div className="text-[8px] tracking-[0.4em] uppercase text-white/25">Reach</div><div className="text-[11px] font-bold text-white/60">{currentSite.reach === 100 ? '∞' : `${currentSite.reach}km`}</div></div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="text-center"><div className="text-[8px] tracking-[0.4em] uppercase text-white/25">Mode</div><div className="text-[11px] font-bold text-white/60">{activeMode.name}</div></div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="text-center"><div className="text-[8px] tracking-[0.4em] uppercase text-white/25">Sig</div><div className="text-[9px] font-mono text-white/40">{db?.signature ?? '—'}</div></div>
          </div>
        </GlassCard>

        {!crystalDone && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => setShowCrystalSetup(true)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <span className="text-xl">💎</span>
            <div className="flex-1 text-left">
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/60 mb-0.5">Step 1 — Required Before Activation</div>
              <div className="text-sm font-bold text-white/70">Crystal Grid Setup</div>
              <div className="text-[10px] text-white/30">Place 4 Clear Quartz crystals to seal the Temple perimeter</div>
            </div>
            <ChevronRight size={16} className="text-[#D4AF37]/40" />
          </motion.button>
        )}

        {/* PORTAL TAB */}
        {activeTab === 'PORTAL' && (
          <>
            <GlassCard className="p-4">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-3"><Zap size={9} />Resonance Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => handleModeChange(m.id)} className="py-2.5 px-2 rounded-2xl text-[9px] font-extrabold tracking-[0.15em] uppercase"
                    style={currentMode === m.id ? { background: 'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                    {m.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/25 mt-2">{activeMode.description}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-3"><Compass size={9} />Sacred Site — 26-Portal Registry V3.0</div>
              <div className="relative">
                <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} className="site-select w-full rounded-2xl py-3 pl-4 pr-10 text-sm text-white/80 appearance-none focus:outline-none" style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  {CATS.map(c => (
                    <optgroup key={c} label={`── ${c} ──`}>
                      {SACRED_SITES.filter(s => getSiteCategory(s.id).label === c).map(s => (
                        <option key={s.id} value={s.id}>{s.name} — {s.focus}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight size={14} className="text-[#D4AF37]/40 rotate-90" /></div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5"><Sparkles size={9} />{intensityLabel}</div>
                <div className="flex items-center gap-1"><span className="text-xl font-black text-[#D4AF37]">{auraIntensity}</span><span className="text-[10px] text-[#D4AF37]/40">%</span></div>
              </div>
              <input type="range" min={0} max={100} value={auraIntensity} onChange={e => setAuraIntensity(parseInt(e.target.value, 10))} className="intensity-slider w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: selectedSite === 'shirdi' ? '#FF6B35' : '#D4AF37' }} />
              <div className="flex justify-between mt-2">
                <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">{selectedSite === 'shirdi' ? 'Surrender' : 'Integration'}</span>
                <span className="text-[8px] tracking-[0.3em] uppercase text-white/15">{selectedSite === 'shirdi' ? 'Full Faith' : 'Bliss State'}</span>
              </div>
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <button onClick={() => setShowSpatialMap(!showSpatialMap)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02]">
                <div className="flex items-center gap-2"><Radio size={10} className="text-[#22D3EE]/60" /><div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#22D3EE]/60">Field Strength Scanner — No GPS</div></div>
                <span className="text-[9px] text-[#22D3EE]/40 tracking-[0.2em]">{showSpatialMap ? 'CLOSE' : 'SCAN'}</span>
              </button>
              <AnimatePresence>
                {showSpatialMap && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3">
                      <p className="text-[9px] text-white/25 leading-relaxed mb-3">Hold your phone and move through your home. Still = at the anchor core. Moving = farther from center.</p>
                      <MotionNadiScanner intensity={auraIntensity} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <div className="px-4 py-3.5 border-b border-white/[0.04]">
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5"><Clock size={9} />24/7 Residual Presets</div>
                <p className="text-[10px] text-white/25 mt-1">One tap sets the perfect site before you leave.</p>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {RESIDUAL_PRESETS.map(preset => {
                  const IconEl = preset.icon === 'music' ? Music : preset.icon === 'moon' ? Moon : preset.icon === 'shield' ? Shield : preset.icon === 'star' ? Star : Sparkles;
                  const isActive = presetFlash === preset.id;
                  return (
                    <motion.button key={preset.id} onClick={() => applyPreset(preset)} whileTap={{ scale: 0.97 }} className="p-3 rounded-2xl text-left relative overflow-hidden"
                      style={{ background: isActive ? `${preset.color}18` : 'rgba(255,255,255,0.02)', border: isActive ? `1px solid ${preset.color}50` : '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: `${preset.color}15`, border: `1px solid ${preset.color}30` }}>
                          <IconEl size={13} style={{ color: preset.color }} />
                        </div>
                      </div>
                      <div className="text-[9px] font-extrabold tracking-[0.1em] leading-tight" style={{ color: isActive ? preset.color : 'rgba(255,255,255,0.65)' }}>{preset.label}</div>
                      <div className="text-[8px] text-white/20 mt-0.5 font-mono">{SACRED_SITES.find(s => s.id === preset.site)?.name?.split(' ')[0]} · {preset.intensity}%</div>
                      {isActive && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: `${preset.color}12` }}>
                          <div className="text-[8px] font-extrabold tracking-[0.3em] uppercase" style={{ color: preset.color }}>✓ Applied</div>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>

            <button onClick={() => navigate('/akasha-infinity')} className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div><div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-purple-400/60 mb-0.5">Connected System</div><div className="text-sm font-bold text-white/60">Akasha–Infinity</div></div>
              <div className="flex items-center gap-2"><span className="text-[10px] text-purple-400/50">1111€ · All portals →</span><ChevronRight size={14} className="text-purple-400/40" /></div>
            </button>
          </>
        )}

        {/* HEALING TAB */}
        {activeTab === 'HEALING' && (
          <div className="space-y-3">
            <GlassCard className="p-4">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-2"><Activity size={9} />Prema-Pulse Healing Protocols</div>
              <p className="text-[10px] text-white/25 leading-relaxed">The real energy of the sacred site is active. These protocols align your body as the receiver.</p>
            </GlassCard>
            {bliss && <GlassCard className="p-4" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><Sparkles size={13} className="text-amber-400" /><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-amber-400/70">High-Coherence Bliss State</span></div>
              <p className="text-xs text-white/60">{bliss.message}</p><p className="text-xs text-amber-300/60 italic mt-2">↳ {bliss.instruction}</p>
            </GlassCard>}
            {deepSync && <GlassCard className="p-4" style={{ border: '1px solid rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#22D3EE]/60 mb-2">Delta-Theta Bridge</div>
              <div className="flex flex-wrap gap-1.5 mb-3">{deepSync.sensations.map(s => <span key={s} className="text-[9px] px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.8)' }}>{s}</span>)}</div>
              <p className="text-[11px] text-white/40 italic">↳ {deepSync.guidance}</p>
            </GlassCard>}
            {heartExpansion && <GlassCard className="p-4" style={{ border: '1px solid rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.03)' }}>
              <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-rose-400/60 mb-2">Anahata Expansion</div>
              <p className="text-xs text-white/55">{heartExpansion.advice}</p><p className="text-[11px] text-rose-300/40 italic mt-2">"{heartExpansion.quote}"</p>
            </GlassCard>}
            {luxorHealer && <GlassCard className="p-4" style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><Zap size={12} className="text-[#D4AF37]" /><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/60">Ka Body Vitality Healer</span></div>
              <p className="text-[11px] text-white/40 italic">↳ {luxorHealer.instruction}</p>
            </GlassCard>}
            {amritsarSeva && <GlassCard className="p-4" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.05)' }}>
              <div className="flex items-center gap-2 mb-2"><span>🌊</span><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#FFD700]/70">Amrit Sarovar — Active</span></div>
              <p className="text-xs text-white/60">The Pool of Nectar is open. Liquid gold light floods the chest cavity.</p>
              <p className="text-xs text-[#FFD700]/50 italic mt-2">↳ Serve without expectation. Abundance follows selflessness automatically.</p>
            </GlassCard>}
            {mauritiusSpark && <GlassCard className="p-4" style={{ border: '1px solid rgba(240,230,140,0.25)', background: 'rgba(240,230,140,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><span>✦</span><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-yellow-200/70">Miracle Portal Engaged</span></div>
              <p className="text-xs text-white/60">Divine Spark Field active. Cellular laws softening.</p>
              <p className="text-xs text-yellow-100/40 italic mt-2">↳ Surrender the logical mind completely. Do not seek the miracle — BE the miracle.</p>
            </GlassCard>}
            {shirdiDhuni && <GlassCard className="p-4" style={{ border: '1px solid rgba(255,107,53,0.25)', background: 'rgba(255,107,53,0.04)' }}>
              <div className="flex items-center gap-2 mb-2"><Flame size={13} className="text-orange-400" /><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-orange-400/70">Dhuni Flame — {auraIntensity >= 70 ? 'FULLY ALIVE' : 'Building'}</span></div>
              <p className="text-xs text-white/60">Faith Level: {auraIntensity}% · The sacred fire burns. Cortisol dissolving.</p>
              <p className="text-xs text-orange-300/50 italic mt-2">↳ Shraddha (Faith) + Saburi (Patience) = Miracle.</p>
            </GlassCard>}
            {db?.bio && !bliss && !deepSync && !heartExpansion && !luxorHealer && !amritsarSeva && !mauritiusSpark && !shirdiDhuni && (
              <GlassCard className="p-4" style={{ border: `1px solid ${currentSite.color}20`, background: `${currentSite.color}04` }}>
                <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase mb-2" style={{ color: cat.color }}>Site Healing Intelligence</div>
                <p className="text-xs text-white/55 leading-relaxed">{db.bio}</p>
                <p className="text-[11px] text-white/30 italic mt-2">↳ {db.instruction}</p>
              </GlassCard>
            )}
            {!bliss && !deepSync && !heartExpansion && !luxorHealer && !amritsarSeva && !mauritiusSpark && !shirdiDhuni && !db?.bio && (
              <GlassCard className="p-8 flex flex-col items-center text-center gap-3">
                <Activity className="h-8 w-8 text-white/15" />
                <p className="text-sm font-bold text-white/20">Raise Intensity to Activate</p>
                <p className="text-[11px] text-white/15 max-w-[220px]">Increase the slider to activate site-specific healing transmissions.</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'PRESCRIPTIONS' && (
          <div className="space-y-3">
            <GlassCard className="p-4">
              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/50 flex items-center gap-1.5 mb-2"><Star size={9} />Healing Prescription Cards</div>
              <p className="text-[10px] text-white/25">Choose your need. Each Rx gives you the exact portal, intensity, and protocol — one tap to activate.</p>
            </GlassCard>
            {HEALING_RX.map(rx => {
              const isOpen = selectedRxId === rx.id;
              return (
                <motion.div key={rx.id} layout>
                  <button onClick={() => setSelectedRxId(isOpen ? null : rx.id)} className="w-full p-4 rounded-[24px] text-left"
                    style={{ background: isOpen ? `${rx.color}08` : 'rgba(255,255,255,0.02)', border: isOpen ? `1px solid ${rx.color}30` : '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{rx.icon}</div>
                        <div>
                          <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase mb-0.5" style={{ color: isOpen ? rx.color : 'rgba(255,255,255,0.35)' }}>PRESCRIPTION</div>
                          <div className="text-sm font-black" style={{ color: isOpen ? rx.color : 'rgba(255,255,255,0.75)' }}>{rx.label}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rx.hydration && <Droplets size={12} className="text-blue-400/60" />}
                        <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                    {!isOpen && (
                      <div className="flex gap-2 mt-2">
                        <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${rx.color}12`, color: rx.color, border: `1px solid ${rx.color}25` }}>{rx.primaryName}</span>
                        <span className="text-[8px] px-2 py-0.5 rounded-full font-bold text-white/25" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>{rx.primaryIntensity}%</span>
                        {rx.hydration && <span className="text-[8px] px-2 py-0.5 rounded-full font-bold text-blue-300/60" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>💧 Water</span>}
                      </div>
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden" style={{ marginTop: -8 }}>
                        <div className="p-4 rounded-b-[24px] space-y-3" style={{ background: `${rx.color}05`, border: `1px solid ${rx.color}20`, borderTop: 'none' }}>
                          <div className="p-3 rounded-2xl" style={{ background: `${rx.color}10`, border: `1px solid ${rx.color}20` }}>
                            <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase mb-2" style={{ color: rx.color }}>Sacred Protocol</div>
                            <p className="text-[12px] text-white/65 leading-relaxed">{rx.rx}</p>
                          </div>
                          <div className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-white/30 mb-2">What You Will Feel</div>
                            <p className="text-[11px] text-white/45 italic">↳ {rx.physical}</p>
                          </div>
                          {rx.hydration && (
                            <div className="p-3 rounded-2xl flex items-start gap-2.5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                              <Droplets size={14} className="text-blue-400 shrink-0 mt-0.5" />
                              <div><div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-blue-400/70 mb-1">Hydration Alert</div><p className="text-[11px] text-blue-300/60">{rx.hydrationNote}</p></div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => { setSelectedSite(rx.primary); setAuraIntensity(rx.primaryIntensity); setActiveTab('PORTAL'); setSelectedRxId(null); }} className="py-3 rounded-2xl text-[9px] font-extrabold tracking-[0.2em] uppercase" style={{ background: `${rx.color}18`, border: `1px solid ${rx.color}40`, color: rx.color }}>
                              {rx.icon} {rx.primaryName.split(' ')[0]}<div className="text-[8px] opacity-60 mt-0.5">{rx.primaryIntensity}% · Primary</div>
                            </button>
                            <button onClick={() => { setSelectedSite(rx.backup); setAuraIntensity(rx.backupIntensity); setActiveTab('PORTAL'); setSelectedRxId(null); }} className="py-3 rounded-2xl text-[9px] font-extrabold tracking-[0.2em] uppercase" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                              Alt: {rx.backupName.split(' ')[0]}<div className="text-[8px] opacity-60 mt-0.5">{rx.backupIntensity}% · Backup</div>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Anchor button */}
        <button onClick={handleAnchor} className="w-full py-4 rounded-[24px] font-black text-[11px] tracking-[0.3em] uppercase flex items-center justify-center gap-2.5"
          style={{ background: isAnchored ? 'linear-gradient(135deg,#4ADE80,#22C55E)' : crystalDone ? 'linear-gradient(135deg,#D4AF37,#F0C040,#D4AF37)' : 'rgba(212,175,55,0.25)', boxShadow: isAnchored ? '0 0 30px rgba(74,222,128,0.3)' : crystalDone ? '0 0 30px rgba(212,175,55,0.3)' : 'none', color: crystalDone ? '#000' : 'rgba(255,255,255,0.4)' }}>
          {isAnchored ? <Shield size={15} /> : crystalDone ? <Home size={15} /> : <span style={{ fontSize: 14 }}>💎</span>}
          {isAnchored ? 'Temple Locked 24/7 — Phase-Lock Active' : crystalDone ? 'Anchor Temple to House' : 'Complete Crystal Setup First'}
        </button>
      </div>

      {/* Anchor flash */}
      <AnimatePresence>
        {anchorFlash && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="fixed bottom-28 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl px-5 py-3.5 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', backdropFilter: 'blur(40px)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <Shield size={16} className="text-emerald-400 shrink-0" />
            <div><p className="text-[11px] font-black tracking-[0.2em] uppercase text-emerald-300">24/7 Continuity Active</p><p className="text-[9px] text-emerald-400/50 mt-0.5">Resonance server Phase-Lock engaged</p></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hydration alert */}
      <AnimatePresence>
        {showHydrationAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-4 right-4 z-50 mx-auto max-w-sm">
            <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3" style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(40px)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Droplets size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[9px] font-extrabold tracking-[0.4em] uppercase text-blue-400/80 mb-1">Hydration Alert — High-Voltage Portal</div>
                <p className="text-[11px] text-white/60"><span className="font-bold text-white/80">{currentSite.name}</span> at {auraIntensity}% requires structured water as a conductor.</p>
                <p className="text-[10px] text-blue-300/50 italic mt-1">↳ Drink 2–3 glasses of structured water before and during this session.</p>
              </div>
              <button onClick={() => setShowHydrationAlert(false)} className="p-1 rounded-lg hover:bg-white/5"><X size={13} className="text-white/30" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crystal Setup Modal */}
      <AnimatePresence>
        {showCrystalSetup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center p-4">
            <div className="absolute inset-0 bg-black/75" style={{ backdropFilter: 'blur(12px)' }} onClick={() => { if (crystalDone) setShowCrystalSetup(false); }} />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="relative w-full max-w-md rounded-[32px] p-6 max-h-[85vh] overflow-y-auto" style={{ background: 'rgba(6,4,2,0.96)', backdropFilter: 'blur(60px)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-2 mb-4" />
              {crystalDone && <button onClick={() => setShowCrystalSetup(false)} className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-white/5"><X size={16} className="text-white/30" /></button>}
              <CrystalSetupFlow onComplete={() => { setCrystalDone(true); setShowCrystalSetup(false); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoSite && infoSiteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center p-4">
            <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: 'blur(10px)' }} onClick={() => setInfoSiteId(null)} />
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md rounded-[32px] p-6 space-y-4 max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(8,4,2,0.95)', backdropFilter: 'blur(60px)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-2 mb-1" />
              <button onClick={() => setInfoSiteId(null)} className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-white/5"><X size={16} className="text-white/30" /></button>
              <div>
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/40 mb-1">Akasha-Neural Archive · {getSiteCategory(infoSiteId).label}</div>
                <h3 className={`text-xl font-black tracking-[-0.03em] ${infoSiteId === 'amritsar' ? 'gold-shimmer' : 'text-[#D4AF37]'}`}>{infoSite.title}</h3>
              </div>
              {SITE_BG[infoSiteId]?.scene && (
                <div className="px-3 py-2 rounded-xl" style={{ background: `${currentSite.color}0a`, border: `1px solid ${currentSite.color}18` }}>
                  <div className="text-[8px] font-mono tracking-widest" style={{ color: `${currentSite.color}70` }}>{SITE_BG[infoSiteId].scene}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-3"><div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">Primary Benefit</div><div className="text-[11px] text-white/70 font-medium leading-snug">{infoSite.primaryBenefit}</div></GlassCard>
                <GlassCard className="p-3"><div className="text-[8px] tracking-[0.3em] uppercase text-white/25 mb-1">Experience</div><div className="text-[11px] text-white/70 font-medium leading-snug">{infoSite.experience}</div></GlassCard>
              </div>
              {infoSite.bio && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,159,210,0.04)', border: '1px solid rgba(255,159,210,0.12)' }}>
                  <div className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#FF9FD2]/50 mb-2">Biological &amp; Spiritual Integration</div>
                  <p className="text-[12px] text-white/55 leading-relaxed">{infoSite.bio}</p>
                </div>
              )}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-2"><BookOpen size={10} className="text-[#D4AF37]/50" /><span className="text-[8px] font-extrabold tracking-[0.4em] uppercase text-[#D4AF37]/40">Sacred Instruction</span></div>
                <p className="text-[12px] text-white/55 leading-relaxed">{infoSite.instruction}</p>
              </div>
              <div className="rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-[8px] tracking-[0.3em] uppercase text-white/20 mb-1">Light-Code Signature</div>
                <div className="text-[11px] font-mono text-[#D4AF37]/50 tracking-wider">{infoSite.signature}</div>
              </div>
              <button onClick={() => setInfoSiteId(null)} className="w-full py-3.5 rounded-2xl text-[10px] font-extrabold tracking-[0.3em] uppercase" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>Return to Meditation</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function TempleHome() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  if (authLoading || membershipLoading || adminLoading) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37]/80 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.virtualPilgrimage)) return <Navigate to="/akasha-infinity" replace />;
  return <TempleHomeInner />;
}
