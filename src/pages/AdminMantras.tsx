/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ADMIN MANTRAS — SQI-2050 Dhyana Playlist Design                 ║
 * ║  • Category-grouped cards (planet/wealth/health/etc)             ║
 * ║  • Cover image + colored category pills                          ║
 * ║  • Proper Free / Premium tier labelling                          ║
 * ║  • All functional logic preserved (RPC, AudioUpload, toggles)    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Music, Trash2, Edit, Save, X, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AudioUpload from '@/components/admin/AudioUpload';
import ImageUpload from '@/components/admin/ImageUpload';

/* ── inline styles ── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Cinzel:wght@500;600&display=swap');

  .am-root {
    font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
    background: #050505;
    color: rgba(255,255,255,0.92);
    min-height: 100vh;
  }
  .am-glass {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 40px;
  }
  .am-glass-sm {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 20px;
  }
  .am-header {
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(24px);
  }
  .am-kicker {
    font-size: 8px; font-weight: 800; letter-spacing: 0.5em;
    text-transform: uppercase; color: rgba(255,255,255,0.4);
  }
  .am-h1 {
    font-family: 'Cinzel', serif;
    font-weight: 600; letter-spacing: -0.02em;
    color: #D4AF37; text-shadow: 0 0 20px rgba(212,175,55,0.3);
    line-height: 1.1;
  }
  @keyframes mShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .am-shimmer {
    background: linear-gradient(135deg,#D4AF37 0%,#F5E17A 45%,#D4AF37 65%,#A07C10 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: mShimmer 5s linear infinite;
  }
  .am-input, .am-select {
    border-radius: 40px !important;
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    color: rgba(255,255,255,0.88) !important;
    font-family: inherit !important;
  }
  .am-input:focus-visible, .am-select:focus-visible {
    border-color: rgba(212,175,55,0.35) !important;
    box-shadow: 0 0 0 1px rgba(212,175,55,0.2) !important;
    outline: none !important;
  }
  .am-textarea {
    border-radius: 20px !important; min-height: 90px;
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    color: rgba(255,255,255,0.88) !important;
    font-family: inherit !important;
  }
  .am-btn-gold {
    border-radius: 40px;
    background: linear-gradient(135deg,rgba(212,175,55,0.95),rgba(160,124,16,0.95));
    color: #050505; font-weight: 800; letter-spacing: 0.04em;
    border: none; cursor: pointer; font-family: inherit;
    box-shadow: 0 0 24px rgba(212,175,55,0.25);
    transition: all .2s;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .am-btn-gold:hover { box-shadow: 0 0 36px rgba(212,175,55,0.45); transform: scale(1.01); }

  /* ── Category section headers ── */
  .am-cat-header {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 0 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 12px; cursor: pointer;
  }
  .am-cat-label {
    font-size: 8px; font-weight: 800; letter-spacing: 0.5em;
    text-transform: uppercase;
  }
  .am-cat-count {
    font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.25);
    margin-left: auto;
  }

  /* ── Mantra card (Dhyana playlist style) ── */
  .am-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 20px;
    overflow: hidden;
    transition: all .22s ease;
    position: relative;
  }
  .am-card:hover { border-color: rgba(212,175,55,0.18); }
  .am-card-cover {
    width: 100%; aspect-ratio: 16/9;
    object-fit: cover; display: block;
    background: linear-gradient(135deg,rgba(212,175,55,0.08),rgba(0,0,0,0.4));
  }
  .am-card-cover-placeholder {
    width: 100%; aspect-ratio: 16/9;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
  }
  .am-card-body { padding: 12px 14px 12px; }
  .am-card-title {
    font-size: 13px; font-weight: 800; letter-spacing: -0.02em;
    color: rgba(255,255,255,0.92); margin-bottom: 6px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .am-card-meta {
    display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px;
  }
  .am-pill {
    font-size: 8px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
  }
  .am-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px 10px; border-top: 1px solid rgba(255,255,255,0.04);
  }
  .am-inactive { opacity: 0.4; }

  /* ── Form card ── */
  .am-form-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 32px; padding: 24px;
    margin-bottom: 24px;
  }
  .am-radio-row {
    display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;
  }
  .am-radio-option {
    display: flex; align-items: center; gap: 6px;
    cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.8);
    padding: 8px 16px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.02);
    transition: all .15s;
  }
  .am-radio-option.active {
    border-color: rgba(212,175,55,0.4);
    background: rgba(212,175,55,0.07);
    color: #D4AF37;
  }
`;

/* ─────────────────────────────────────────────────────────────────
   SQI-2050 Sacred SVG Icon System
   Each icon is a tiny inline SVG — crisp at any size, no emoji pixelation
───────────────────────────────────────────────────────────────── */
const SvgIcons: Record<string, (color: string, size?: number) => React.ReactElement> = {
  /** Navagraha / Planetary — 9-pointed star (celestial body symbol) */
  planet: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3.5" fill={c} opacity=".9"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke={c} strokeWidth="1.2" fill="none" transform="rotate(-25 12 12)" opacity=".7"/>
      <circle cx="12" cy="12" r="7.5" stroke={c} strokeWidth=".7" fill="none" strokeDasharray="2 3" opacity=".4"/>
      <circle cx="12" cy="2.5" r="1.2" fill={c} opacity=".6"/>
      <circle cx="20.5" cy="7" r="1" fill={c} opacity=".5"/>
      <circle cx="20.5" cy="17" r="1" fill={c} opacity=".5"/>
      <circle cx="12" cy="21.5" r="1.2" fill={c} opacity=".6"/>
      <circle cx="3.5" cy="17" r="1" fill={c} opacity=".5"/>
      <circle cx="3.5" cy="7" r="1" fill={c} opacity=".5"/>
    </svg>
  ),
  /** Deity — Om / Aum glyph rendered as sacred geometry */
  deity: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 10.5C5 8.5 6.5 7 8.5 7C10.5 7 12 8.5 12 10.5C12 12.5 10 14 8 15.5C10 15.5 14 15.5 16 13C17.5 11 16.5 8.5 15 8C17 7.5 19 9 19 11.5C19 14 17 16.5 14 17.5L13 19.5C12.5 20.5 11.5 20.5 11 19.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".9"/>
      <path d="M12 4.5C12 4.5 13.5 3.5 15 4.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity=".7"/>
      <circle cx="12.5" cy="3.2" r="1" fill={c} opacity=".8"/>
    </svg>
  ),
  /** Intention — Lotus with 8 petals (Ashtadala Padma) */
  intention: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="2.8" fill={c} opacity=".85"/>
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 12 + 5.5 * Math.sin(rad);
        const y = 12 - 5.5 * Math.cos(rad);
        return <ellipse key={i} cx={x} cy={y} rx="2" ry="3.5" fill={c} opacity=".45" transform={`rotate(${deg} ${x} ${y})`} />;
      })}
      <circle cx="12" cy="12" r="4.2" stroke={c} strokeWidth=".6" fill="none" opacity=".35"/>
    </svg>
  ),
  /** Karma / Healing — Sri Yantra triangle (downward + upward) */
  karma: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,3 22,20 2,20" stroke={c} strokeWidth="1.1" fill="none" opacity=".7"/>
      <polygon points="12,21 2,4 22,4" stroke={c} strokeWidth="1.1" fill="none" opacity=".7"/>
      <circle cx="12" cy="12" r="2.5" fill={c} opacity=".85"/>
      <circle cx="12" cy="12" r="6" stroke={c} strokeWidth=".6" fill="none" opacity=".3"/>
    </svg>
  ),
  /** Wealth — Shri Yantra bindu with 6-pointed star (Lakshmi) */
  wealth: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 14.8,9.2 22.4,9.2 16.8,14 18.9,21.5 12,17.3 5.1,21.5 7.2,14 1.6,9.2 9.2,9.2" stroke={c} strokeWidth="1" fill={c} fillOpacity=".12" opacity=".9"/>
      <circle cx="12" cy="12" r="3" fill={c} opacity=".8"/>
    </svg>
  ),
  /** Health — Caduceus / DNA helix (Vedic medicine) */
  health: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3V21" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M7 6C10 8 14 8 17 6" stroke={c} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".75"/>
      <path d="M17 10C14 12 10 12 7 10" stroke={c} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".75"/>
      <path d="M7 14C10 16 14 16 17 14" stroke={c} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".75"/>
      <path d="M17 18C14 20 10 20 7 18" stroke={c} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".75"/>
      <circle cx="12" cy="3" r="1.5" fill={c}/>
    </svg>
  ),
  /** Peace — Hamsa eye (palm of Fatima, eye of protection) */
  peace: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C8 4 4 8 4 12C4 16 8 20 12 20C16 20 20 16 20 12C20 8 16 4 12 4Z" stroke={c} strokeWidth="1" fill={c} fillOpacity=".08"/>
      <path d="M4 12C4 12 7 8 12 8C17 8 20 12 20 12C20 12 17 16 12 16C7 16 4 12 4 12Z" stroke={c} strokeWidth="1.1" fill="none" opacity=".7"/>
      <circle cx="12" cy="12" r="2.5" fill={c} opacity=".9"/>
      <circle cx="12" cy="12" r="1" fill={c} opacity=".4"/>
      <path d="M10.5 6C10.5 6 11 3.5 12 2.5C13 3.5 13.5 6 13.5 6" stroke={c} strokeWidth=".9" strokeLinecap="round" fill="none" opacity=".5"/>
    </svg>
  ),
  /** Protection — Yantra shield with Kavacha geometry */
  protection: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L20 6V13C20 17.4 16.4 21.2 12 22C7.6 21.2 4 17.4 4 13V6L12 2Z" stroke={c} strokeWidth="1.2" fill={c} fillOpacity=".08" opacity=".9"/>
      <path d="M12 5L17 7.5V12.5C17 15.2 14.8 17.7 12 18.5C9.2 17.7 7 15.2 7 12.5V7.5L12 5Z" stroke={c} strokeWidth=".7" fill="none" opacity=".45"/>
      <path d="M9 12L11 14L15 10" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity=".85"/>
    </svg>
  ),
  /** Spiritual — Merkaba / Star Tetrahedron (light body) */
  spiritual: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 22,19 2,19" stroke={c} strokeWidth="1.1" fill={c} fillOpacity=".1" opacity=".8"/>
      <polygon points="12,22 2,5 22,5" stroke={c} strokeWidth="1.1" fill={c} fillOpacity=".1" opacity=".8"/>
      <circle cx="12" cy="12" r="2.5" fill={c} opacity=".9"/>
      <line x1="12" y1="2" x2="12" y2="22" stroke={c} strokeWidth=".5" opacity=".25"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth=".5" opacity=".25"/>
    </svg>
  ),
  /** General — Tao / Infinity / Akasha symbol */
  general: (c, s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C12 12 8 7 5.5 7C3 7 2 9 2 12C2 15 3 17 5.5 17C8 17 12 12 12 12Z" stroke={c} strokeWidth="1.2" fill="none" opacity=".75"/>
      <path d="M12 12C12 12 16 17 18.5 17C21 17 22 15 22 12C22 9 21 7 18.5 7C16 7 12 12 12 12Z" stroke={c} strokeWidth="1.2" fill="none" opacity=".75"/>
      <circle cx="5.5" cy="12" r="1.5" fill={c} opacity=".5"/>
      <circle cx="18.5" cy="12" r="1.5" fill={c} opacity=".5"/>
    </svg>
  ),
};

/** Render a sacred SVG icon or fall back to text symbol */
const CatIcon: React.FC<{ cat: string; color: string; size?: number }> = ({ cat, color, size = 20 }) => {
  const fn = SvgIcons[cat];
  return fn ? fn(color, size) : <span style={{ fontSize: size * 0.75, lineHeight: 1 }}>✦</span>;
};

/* ── Category metadata ── */
const CAT_META: Record<string, { label: string; color: string; pillBg: string; pillColor: string; borderColor: string }> = {
  planet:     { label: 'Planetary',       color: '#D4AF37',              pillBg: 'rgba(212,175,55,.12)',  pillColor: '#D4AF37',             borderColor: 'rgba(212,175,55,.3)' },
  deity:      { label: 'Deity',           color: '#F5E17A',              pillBg: 'rgba(245,225,122,.1)',  pillColor: '#F5E17A',             borderColor: 'rgba(245,225,122,.25)' },
  intention:  { label: 'Intention',       color: 'rgba(34,211,238,.9)',   pillBg: 'rgba(34,211,238,.09)', pillColor: 'rgba(34,211,238,.9)',  borderColor: 'rgba(34,211,238,.25)' },
  karma:      { label: 'Karma & Healing', color: 'rgba(167,139,250,.9)', pillBg: 'rgba(167,139,250,.09)',pillColor: 'rgba(167,139,250,.9)', borderColor: 'rgba(167,139,250,.25)' },
  wealth:     { label: 'Wealth',          color: '#F5E17A',              pillBg: 'rgba(245,225,122,.1)',  pillColor: '#F5E17A',             borderColor: 'rgba(245,225,122,.28)' },
  health:     { label: 'Health',          color: 'rgba(52,211,153,.9)',  pillBg: 'rgba(52,211,153,.09)', pillColor: 'rgba(52,211,153,.9)', borderColor: 'rgba(52,211,153,.25)' },
  peace:      { label: 'Peace',           color: 'rgba(147,197,253,.9)',pillBg: 'rgba(147,197,253,.09)',pillColor: 'rgba(147,197,253,.9)',borderColor: 'rgba(147,197,253,.25)' },
  protection: { label: 'Protection',      color: 'rgba(251,146,60,.9)', pillBg: 'rgba(251,146,60,.09)', pillColor: 'rgba(251,146,60,.9)', borderColor: 'rgba(251,146,60,.25)' },
  spiritual:  { label: 'Spiritual',       color: '#D4AF37',              pillBg: 'rgba(212,175,55,.1)',   pillColor: '#D4AF37',             borderColor: 'rgba(212,175,55,.22)' },
  general:    { label: 'General',         color: 'rgba(255,255,255,.55)',pillBg: 'rgba(255,255,255,.04)',pillColor: 'rgba(255,255,255,.55)',borderColor: 'rgba(255,255,255,.08)' },
};

const CAT_ORDER = ['planet', 'deity', 'wealth', 'health', 'karma', 'intention', 'protection', 'peace', 'spiritual', 'general'];

const ADMIN_MANTRA_CATEGORIES = [
  { id: 'planet',     label: 'Planets' },
  { id: 'deity',      label: 'Deity' },
  { id: 'intention',  label: 'Intention' },
  { id: 'karma',      label: 'Karma & Healing' },
  { id: 'wealth',     label: 'Wealth & Abundance' },
  { id: 'health',     label: 'Health & Vitality' },
  { id: 'peace',      label: 'Peace & Calm' },
  { id: 'protection', label: 'Protection & Power' },
  { id: 'spiritual',  label: 'Spiritual Growth' },
  { id: 'general',    label: 'General' },
] as const;

const PLANET_TYPES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

interface Mantra {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  shc_reward: number;
  is_active: boolean;
  category?: string | null;
  planet_type?: string | null;
  is_premium?: boolean;
  required_tier?: number;
}

const TIER_OPTIONS: { value: number; label: string; short: string }[] = [
  { value: 0, label: 'Free',             short: 'Free' },
  { value: 1, label: 'Prana-Flow',       short: 'Prana' },
  { value: 2, label: 'Siddha-Quantum',   short: 'Siddha' },
  { value: 3, label: 'Akasha-Infinity',  short: 'Akasha' },
];

const AdminMantras = () => {
  const navigate = useNavigate();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audio_url: '',
    cover_image_url: '',
    duration_seconds: 180,
    shc_reward: 111,
    is_active: true,
    is_premium: false,
    required_tier: 0,
  });
  const [category, setCategory] = useState('general');
  const [planetType, setPlanetType] = useState('');

  useEffect(() => { fetchMantras(); }, []);

  const fetchMantras = async () => {
    const { data } = await supabase
      .from('mantras' as any)
      .select('id, title, description, audio_url, cover_image_url, duration_seconds, shc_reward, is_active, is_premium, required_tier, category, planet_type, created_at')
      .order('created_at', { ascending: false });
    if (data) setMantras(data as unknown as Mantra[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', audio_url: '', cover_image_url: '', duration_seconds: 180, shc_reward: 111, is_active: true, is_premium: false, required_tier: 0 });
    setCategory('general');
    setPlanetType('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (mantra: Mantra) => {
    const tier = (mantra.required_tier ?? (mantra.is_premium ? 1 : 0)) as number;
    setFormData({
      title: mantra.title,
      description: mantra.description || '',
      audio_url: mantra.audio_url,
      cover_image_url: mantra.cover_image_url || '',
      duration_seconds: mantra.duration_seconds ?? 180,
      shc_reward: mantra.shc_reward,
      is_active: mantra.is_active,
      is_premium: tier > 0,
      required_tier: tier,
    });
    setCategory((mantra as any).category || 'general');
    setPlanetType((mantra as any).planet_type || '');
    setEditingId(mantra.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => {
    const shc = Number(formData.shc_reward);
    const dur = Number.isFinite(formData.duration_seconds) && formData.duration_seconds > 0 ? formData.duration_seconds : 180;
    const tier = Number.isFinite(formData.required_tier) ? formData.required_tier : 0;
    return {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      audio_url: formData.audio_url.trim(),
      cover_image_url: formData.cover_image_url?.trim() || null,
      duration_seconds: dur,
      shc_reward: Number.isFinite(shc) && shc >= 0 ? shc : 111,
      is_active: Boolean(formData.is_active),
      category: category || 'general',
      planet_type: category === 'planet' && planetType?.trim() ? planetType.trim() : null,
      is_premium: tier > 0,
      required_tier: tier,
    };
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.audio_url?.trim()) {
      toast.error('Title and Audio URL are required');
      return;
    }
    const payload = buildPayload();
    if (editingId) {
      const { data, error } = await supabase.rpc('update_mantra_admin' as any, { data: { ...payload, id: editingId } });
      if (error) { toast.error(error.message || 'Failed to update'); return; }
      if (data && typeof data === 'object' && 'success' in data && !(data as any).success) { toast.error((data as any).error || 'Failed to update'); return; }
      toast.success('Mantra updated ✦');
    } else {
      const { data, error } = await supabase.rpc('insert_mantra_admin' as any, { data: payload });
      if (error) { toast.error(error.message || 'Failed to add'); return; }
      if (data && typeof data === 'object' && 'success' in data && !(data as any).success) { toast.error((data as any).error || 'Failed to add'); return; }
      toast.success('Mantra added ✦');
    }
    resetForm();
    fetchMantras();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mantra?')) return;
    const { error } = await supabase.from('mantras' as any).delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Mantra deleted');
    fetchMantras();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.rpc('update_mantra_admin' as any, { data: { id, is_active: !isActive } });
    fetchMantras();
  };

  const toggleCat = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  /* group by category */
  const grouped: Record<string, Mantra[]> = {};
  mantras.forEach((m) => {
    const cat = (m as any).category || 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  });

  const fmtDur = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="am-root pb-28">

        {/* ── header ── */}
        <div className="am-header px-4 py-5">
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,.06)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.5)', flexShrink: 0 }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="am-kicker" style={{ marginBottom: 4 }}>NADA · ADMIN VAULT</div>
              <h1 className="am-h1" style={{ fontSize: 'clamp(20px, 5vw, 26px)', marginBottom: 2 }}>Manage Mantras</h1>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
                <span style={{ color: '#22D3EE', fontWeight: 700 }}>{mantras.length}</span> Bhakti-Algorithms indexed
              </div>
            </div>
            {!showForm && (
              <button
                className="am-btn-gold"
                style={{ padding: '10px 18px', fontSize: 12, flexShrink: 0 }}
                onClick={() => setShowForm(true)}
              >
                <Plus size={14} /> Add Mantra
              </button>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 0' }}>

          {/* ── ADD / EDIT FORM ── */}
          {showForm && (
            <div className="am-form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div className="am-kicker" style={{ marginBottom: 4 }}>PREMA-PULSE FORM</div>
                  <h3 className="am-shimmer" style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.03em' }}>
                    {editingId ? 'Edit Mantra' : 'New Mantra'}
                  </h3>
                </div>
                <button
                  onClick={resetForm}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,.07)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.5)' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Title */}
                <div>
                  <div className="am-kicker" style={{ marginBottom: 6 }}>Title *</div>
                  <Input className="am-input h-11" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Om Namah Shivaya" />
                </div>

                {/* Category */}
                <div>
                  <div className="am-kicker" style={{ marginBottom: 6 }}>Category</div>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); if (e.target.value !== 'planet') setPlanetType(''); }}
                    className="am-select"
                    style={{ height: 44, width: '100%', padding: '0 16px', fontSize: 14 }}
                  >
                    {ADMIN_MANTRA_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: '#0a0a0a' }}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Planet (only when planet category) */}
                {category === 'planet' && (
                  <div>
                    <div className="am-kicker" style={{ marginBottom: 6 }}>Planet Type</div>
                    <select
                      value={planetType}
                      onChange={(e) => setPlanetType(e.target.value)}
                      className="am-select"
                      style={{ height: 44, width: '100%', padding: '0 16px', fontSize: 14 }}
                    >
                      <option value="" style={{ background: '#0a0a0a' }}>Select planet…</option>
                      {PLANET_TYPES.map((p) => (
                        <option key={p} value={p} style={{ background: '#0a0a0a' }}>{PLANET_SYMBOLS[p]} {p}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <div className="am-kicker" style={{ marginBottom: 6 }}>Description</div>
                  <Textarea className="am-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="A powerful mantra for…" />
                </div>

                {/* Audio Upload */}
                <div style={{ background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 16 }}>
                  <AudioUpload
                    key={editingId ?? 'create'}
                    value={formData.audio_url}
                    onChange={(url) => setFormData({ ...formData, audio_url: url })}
                    folder="mantras"
                    label="Audio File *"
                  />
                </div>

                {/* Cover Image — upload or paste URL */}
                <ImageUpload
                  value={formData.cover_image_url}
                  onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                  folder="mantra-covers"
                  label="Cover Image"
                  aspectRatio="16/9"
                />

                {/* Duration + SHC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div className="am-kicker" style={{ marginBottom: 6 }}>Duration (minutes)</div>
                    <Input
                      className="am-input h-11" type="number" min={0.5} step={0.5}
                      placeholder="e.g. 3"
                      value={formData.duration_seconds / 60}
                      onChange={(e) => { const s = parseFloat(e.target.value) * 60; setFormData({ ...formData, duration_seconds: Number.isFinite(s) ? s : 180 }); }}
                    />
                  </div>
                  <div>
                    <div className="am-kicker" style={{ marginBottom: 6 }}>SHC Reward</div>
                    <Input className="am-input h-11" type="number" value={formData.shc_reward} onChange={(e) => setFormData({ ...formData, shc_reward: parseInt(e.target.value) || 111 })} />
                  </div>
                </div>

                {/* Access tier */}
                <div style={{ background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 16 }}>
                  <div className="am-kicker" style={{ marginBottom: 10 }}>Access Level</div>
                  <div className="am-radio-row">
                    <label className={`am-radio-option${!formData.is_premium ? ' active' : ''}`}>
                      <input type="radio" name="access" checked={!formData.is_premium} onChange={() => setFormData({ ...formData, is_premium: false })} style={{ accentColor: '#D4AF37' }} />
                      <Unlock size={13} />
                      <span>Free</span>
                    </label>
                    <label className={`am-radio-option${formData.is_premium ? ' active' : ''}`}>
                      <input type="radio" name="access" checked={formData.is_premium} onChange={() => setFormData({ ...formData, is_premium: true })} style={{ accentColor: '#D4AF37' }} />
                      <Lock size={13} />
                      <span style={{ color: formData.is_premium ? '#D4AF37' : undefined }}>Members Only</span>
                    </label>
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 10, lineHeight: 1.5 }}>
                    Free mantras are accessible to all users. Members-only mantras require an active Prana-Flow+ subscription.
                  </p>
                </div>

                {/* Active toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} className="data-[state=checked]:bg-[#D4AF37]" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>Active (visible to users)</span>
                </div>

                {/* Save */}
                <button className="am-btn-gold" style={{ width: '100%', height: 48, fontSize: 13, justifyContent: 'center' }} onClick={handleSave}>
                  <Save size={15} />
                  {editingId ? 'Update Mantra' : 'Save Mantra'}
                </button>
              </div>
            </div>
          )}

          {/* ── MANTRAS GROUPED BY CATEGORY ── */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,.35)', fontSize: 13 }}>
              Loading Vedic Light-Codes…
            </div>
          )}

          {!loading && CAT_ORDER.map((cat) => {
            const group = grouped[cat];
            if (!group || group.length === 0) return null;
            const meta = CAT_META[cat] ?? CAT_META.general;
            const isCollapsed = collapsedCats.has(cat);

            return (
              <div key={cat} style={{ marginBottom: 28 }}>
                {/* Category header */}
                <div
                  className="am-cat-header"
                  style={{ borderBottomColor: meta.borderColor }}
                  onClick={() => toggleCat(cat)}
                >
                  <CatIcon cat={cat} color={meta.color} size={18} />
                  <span className="am-cat-label" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="am-cat-count">{group.length} mantra{group.length !== 1 ? 's' : ''}</span>
                  {isCollapsed ? <ChevronRight size={13} style={{ color: 'rgba(255,255,255,.3)' }} /> : <ChevronDown size={13} style={{ color: 'rgba(255,255,255,.3)' }} />}
                </div>

                {!isCollapsed && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {group.map((mantra) => {
                      const planet = (mantra as any).planet_type as string | null;
                      const pSym = planet ? PLANET_SYMBOLS[planet] ?? '' : '';
                      return (
                        <div
                          key={mantra.id}
                          className={`am-card${!mantra.is_active ? ' am-inactive' : ''}`}
                          style={{ borderColor: meta.borderColor }}
                        >
                          {/* cover image */}
                          {mantra.cover_image_url ? (
                            <img src={mantra.cover_image_url} alt={mantra.title} className="am-card-cover" />
                          ) : (
                            <div className="am-card-cover-placeholder" style={{ background: `linear-gradient(135deg,${meta.borderColor}40,rgba(0,0,0,.5))` }}>
                              <CatIcon cat={cat} color={meta.color} size={36} />
                            </div>
                          )}

                          {/* body */}
                          <div className="am-card-body">
                            <div className="am-card-title">{mantra.title}</div>
                            <div className="am-card-meta">
                              {/* category pill */}
                              <span className="am-pill" style={{ background: meta.pillBg, border: `1px solid ${meta.borderColor}`, color: meta.pillColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {pSym ? <span style={{ fontSize: 11 }}>{pSym}</span> : <CatIcon cat={cat} color={meta.pillColor} size={11} />}
                                {planet ?? meta.label}
                              </span>
                              {/* tier pill */}
                              {mantra.is_premium ? (
                                <span className="am-pill" style={{ background: 'rgba(212,175,55,.1)', border: '1px solid rgba(212,175,55,.3)', color: '#D4AF37' }}>
                                  <Lock size={8} style={{ display: 'inline', marginRight: 3 }} />Members
                                </span>
                              ) : (
                                <span className="am-pill" style={{ background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.2)', color: 'rgba(52,211,153,.8)' }}>
                                  Free
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.35)', display: 'flex', gap: 8 }}>
                              <span>{fmtDur(mantra.duration_seconds)}</span>
                              <span>·</span>
                              <span>{mantra.shc_reward} SHC</span>
                              {!mantra.is_active && <span style={{ color: 'rgba(251,146,60,.7)' }}>· Inactive</span>}
                            </div>
                          </div>

                          {/* footer actions */}
                          <div className="am-card-footer">
                            <button
                              onClick={() => toggleActive(mantra.id, mantra.is_active)}
                              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, border: `1px solid ${mantra.is_active ? 'rgba(52,211,153,.25)' : 'rgba(255,255,255,.1)'}`, background: mantra.is_active ? 'rgba(52,211,153,.08)' : 'rgba(255,255,255,.03)', color: mantra.is_active ? 'rgba(52,211,153,.8)' : 'rgba(255,255,255,.35)', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              {mantra.is_active ? 'Active' : 'Inactive'}
                            </button>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={() => handleEdit(mantra)}
                                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,.07)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.45)', transition: 'all .15s' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#D4AF37'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,.3)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.45)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.07)'; }}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(mantra.id)}
                                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(239,68,68,.15)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(239,68,68,.7)', transition: 'all .15s' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.08)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && mantras.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{SvgIcons.deity('#D4AF37', 48)}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.35)' }}>No mantras yet — add the first one above</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMantras;
