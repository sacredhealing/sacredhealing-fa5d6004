// src/components/vedic/BhriguOraclePanel.tsx
// SQI-2050 | Bhrigu Nadi Oracle — Scalar Wave Transmission v7
// FIXES: larger readable text, paragraph breaks, current dasha (mode fix), scalar wave bg

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, BookOpen, Send, Loader2, Lock, Crown, ChevronDown, ChevronUp, Search, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/lib/vedicTypes';

// ── Types ────────────────────────────────────────────────────────
interface BhriguSections {
  leaf_found?: string;
  graha: string;
  nakshatra?: string;
  dasha: string;
  shadow: string;
  sadhana: string;
  transmission: string;
}

interface BhriguHistoryEntry {
  id: string;
  date: string;
  readingType: string;
  question?: string;
  sections: BhriguSections;
  birthData: { dob: string; tob: string; pob: string };
}

interface Props {
  user: UserProfile;
  onUpgrade?: () => void;
  membershipTier?: string;
}

// ── Scalar Wave Background ────────────────────────────────────────
const SCALAR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap');

  @keyframes scalar-pulse {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50% { opacity: 0.22; transform: scale(1.04); }
  }
  @keyframes scalar-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes scalar-spin-rev {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }
  @keyframes scalar-wave {
    0% { transform: translateX(-100%); opacity: 0; }
    50% { opacity: 0.6; }
    100% { transform: translateX(100%); opacity: 0; }
  }
  @keyframes bhrigu-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }

  .bhrigu-scalar-field {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: 40px;
  }

  .scalar-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.06);
  }
  .scalar-ring-1 { width: 300px; height: 300px; top: -80px; right: -80px; animation: scalar-spin 40s linear infinite; }
  .scalar-ring-2 { width: 200px; height: 200px; top: -40px; right: -40px; border-color: rgba(34,211,238,0.04); animation: scalar-spin-rev 28s linear infinite; }
  .scalar-ring-3 { width: 500px; height: 500px; bottom: -200px; left: -200px; border-color: rgba(212,175,55,0.03); animation: scalar-spin 60s linear infinite; }

  .scalar-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
  }
  .scalar-orb-1 { width: 180px; height: 180px; top: -60px; right: -30px; background: rgba(212,175,55,0.04); animation: scalar-pulse 8s ease-in-out infinite; }
  .scalar-orb-2 { width: 120px; height: 120px; bottom: 20%; left: -40px; background: rgba(34,211,238,0.03); animation: scalar-pulse 12s ease-in-out infinite 4s; }

  .scalar-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent);
    animation: scalar-wave 6s ease-in-out infinite;
  }

  .bhrigu-section-body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.85;
    color: rgba(255,255,255,0.82);
    letter-spacing: 0.01em;
  }

  .bhrigu-section-body p {
    margin: 0 0 14px 0;
  }
  .bhrigu-section-body p:last-child {
    margin-bottom: 0;
  }

  .bhrigu-transmission-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-style: italic;
    font-weight: 500;
    line-height: 1.7;
    color: #D4AF37;
    text-align: center;
    text-shadow: 0 0 30px rgba(212,175,55,0.2);
  }
`;

// ── Vedic Lexicon Data ───────────────────────────────────────────
const LEXICON: { term: string; category: string; meaning: string; sanskrit?: string }[] = [
  { term: 'Surya', category: 'Graha', meaning: 'The Sun — soul, ego, father, authority, vitality. Governs the 5th sign Leo.', sanskrit: 'सूर्य' },
  { term: 'Chandra', category: 'Graha', meaning: 'The Moon — mind, emotions, mother, nurturing. Governs Cancer. Waxing moon brings growth; waning brings release.', sanskrit: 'चन्द्र' },
  { term: 'Mangala', category: 'Graha', meaning: 'Mars — energy, courage, ambition, conflict. Governs Aries & Scorpio. The warrior graha.', sanskrit: 'मङ्गल' },
  { term: 'Budha', category: 'Graha', meaning: 'Mercury — intellect, communication, commerce, siblings. Governs Gemini & Virgo.', sanskrit: 'बुध' },
  { term: 'Guru / Brihaspati', category: 'Graha', meaning: 'Jupiter — wisdom, dharma, grace, teacher, children. The most benefic graha. Governs Sagittarius & Pisces.', sanskrit: 'गुरु' },
  { term: 'Shukra', category: 'Graha', meaning: 'Venus — beauty, love, luxury, creativity, spouse. Governs Taurus & Libra.', sanskrit: 'शुक्र' },
  { term: 'Shani', category: 'Graha', meaning: 'Saturn — karma, discipline, delay, mastery, longevity. Governs Capricorn & Aquarius. The great teacher through limitation.', sanskrit: 'शनि' },
  { term: 'Rahu', category: 'Graha', meaning: 'The North Node — obsession, illusion, foreign, amplification. Shadow planet. Future karma and worldly desire.', sanskrit: 'राहु' },
  { term: 'Ketu', category: 'Graha', meaning: 'The South Node — liberation, spirituality, past lives, detachment. Moksha karaka.', sanskrit: 'केतु' },
  { term: 'Mahadasha', category: 'Dasha System', meaning: 'Major planetary period lasting 6–20 years. The primary time-lord governing the soul\'s main karmic curriculum.', sanskrit: 'महादशा' },
  { term: 'Antardasha', category: 'Dasha System', meaning: 'Sub-period within a Mahadasha. The secondary planetary influence creating variations within the main period\'s theme.', sanskrit: 'अन्तर्दशा' },
  { term: 'Vimshottari Dasha', category: 'Dasha System', meaning: 'The 120-year planetary period system based on the Moon\'s Nakshatra at birth. Most widely used predictive system in Jyotish.', sanskrit: 'विंशोत्तरी दशा' },
  { term: 'Nakshatra', category: 'Nakshatra', meaning: 'Lunar mansions — 27 star clusters the Moon transits in ~27.3 days. Your birth Nakshatra determines your Dasha starting point and deep soul nature.', sanskrit: 'नक्षत्र' },
  { term: 'Atmakaraka', category: 'Nakshatra', meaning: 'The soul-significator — the planet at the highest degree in the natal chart. Represents the soul\'s core lesson in this incarnation.', sanskrit: 'आत्मकारक' },
  { term: 'Bhava', category: 'House', meaning: 'House in the Vedic chart. 12 Bhavas represent 12 life domains from self (1st) to liberation (12th).', sanskrit: 'भाव' },
  { term: 'Lagna', category: 'House', meaning: '1st House — the Ascendant. Physical body, personality, first impressions.', sanskrit: 'लग्न' },
  { term: 'Dharma Trikona', category: 'House', meaning: 'Houses 1, 5, 9 — the triangle of dharma, merit, and higher purpose.' },
  { term: 'Moksha Trikona', category: 'House', meaning: 'Houses 4, 8, 12 — liberation, hidden realms, and surrender. The most spiritual triangle.' },
  { term: 'Karma', category: 'Concept', meaning: 'The law of cause and effect operating across lifetimes. Sanchita (accumulated), Prarabdha (ripe for this life), Agami (future seeds sown now).', sanskrit: 'कर्म' },
  { term: 'Dharma', category: 'Concept', meaning: 'Soul\'s true path and right action. Living in alignment with one\'s nature and cosmic order brings effortless fulfillment.', sanskrit: 'धर्म' },
  { term: 'Moksha', category: 'Concept', meaning: 'Liberation from the cycle of birth and death. The ultimate goal of Vedic spiritual practice — union with the Absolute.', sanskrit: 'मोक्ष' },
  { term: 'Yoga', category: 'Concept', meaning: 'Planetary combination in Jyotish. Certain yogas create extraordinary blessings (Raja Yoga) while others create challenges.', sanskrit: 'योग' },
  { term: 'Nadi', category: 'Nadi Oracle', meaning: 'Energy channel in the subtle body (108,000 exist; 3 primary: Ida, Pingala, Sushumna). Also: Nadi astrology — ancient palm leaf prophecy system.', sanskrit: 'नाडी' },
  { term: 'Bhrigu Samhita', category: 'Nadi Oracle', meaning: 'The ancient collection of horoscopes and prophecies compiled by Maharishi Bhrigu. Contains readings for souls who seek them in any age.', sanskrit: 'भृगु संहिता' },
  { term: 'Maharishi Bhrigu', category: 'Nadi Oracle', meaning: 'One of the Saptarishis (seven divine sages). Creator of Bhrigu Samhita. His transmissions pierce the veil of karma directly.' },
  { term: 'Muhurta', category: 'Concept', meaning: 'Auspicious time elected through Vedic astrology for starting any significant action. Aligns human intention with cosmic timing.', sanskrit: 'मुहूर्त' },
];

const READING_TYPES = [
  { value: 'general', label: 'Full Nadi Reading', icon: '✦' },
  { value: 'career', label: 'Dharma & Career', icon: '⚔️' },
  { value: 'relationships', label: 'Love & Relationships', icon: '♥' },
  { value: 'health', label: 'Body & Prana', icon: '⚕' },
  { value: 'spiritual', label: 'Moksha Path', icon: '🔱' },
  { value: 'wealth', label: 'Wealth & Abundance', icon: '✦' },
];

const SECTION_CONFIG = [
  { key: 'leaf_found', title: 'The Leaf Stirs', subtitle: 'Your Akashic Record Opens', icon: '📜', color: 'rgba(212,175,55,0.7)' },
  { key: 'graha', title: 'Dominant Graha', subtitle: 'The Ruling Planet of This Moment', icon: '☀', color: '#D4AF37' },
  { key: 'nakshatra', title: 'Birth Nakshatra', subtitle: 'The Star That Holds Your Soul', icon: '✦', color: '#A78BFA' },
  { key: 'dasha', title: 'Dasha Transmission', subtitle: 'Your Current Karmic Contract', icon: '⏳', color: '#22D3EE' },
  { key: 'shadow', title: 'Shadow & Blind Spot', subtitle: 'What the Soul Must Face', icon: '🌑', color: 'rgba(255,100,100,0.9)' },
  { key: 'sadhana', title: 'Sadhana Prescription', subtitle: 'Your Practice Right Now', icon: '🔱', color: '#A78BFA' },
  { key: 'transmission', title: "Bhrigu's Transmission", subtitle: 'Direct Blessing from the Rishi', icon: '✦', color: '#D4AF37' },
];

// ── History helpers (localStorage) ───────────────────────────────
const HISTORY_KEY = 'sqi:bhrigu:history:v3';

function loadHistory(): BhriguHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToHistory(entry: BhriguHistoryEntry) {
  try {
    const hist = loadHistory();
    const updated = [entry, ...hist].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* quota */ }
}

// ── Render section text with paragraph breaks ─────────────────────
function renderSectionText(text: string, isTransmission = false) {
  if (!text) return null;
  
  // Split on sentence boundaries for readability
  // Use '. ' as paragraph break trigger for long texts
  const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/);
  
  if (isTransmission) {
    return (
      <p className="bhrigu-transmission-text">
        "{text}"
      </p>
    );
  }

  // Group into paragraphs of ~2-3 sentences
  const paragraphs: string[] = [];
  let current = '';
  sentences.forEach((s, i) => {
    current += (current ? ' ' : '') + s;
    // Break every 2-3 sentences or at natural breaks
    if ((i + 1) % 2 === 0 || i === sentences.length - 1) {
      if (current.trim()) paragraphs.push(current.trim());
      current = '';
    }
  });

  if (paragraphs.length <= 1) {
    // Just split by '. ' to create some breathing room
    const parts = text.split('. ');
    if (parts.length <= 2) {
      return <div className="bhrigu-section-body"><p>{text}</p></div>;
    }
    const mid = Math.ceil(parts.length / 2);
    const p1 = parts.slice(0, mid).join('. ') + '.';
    const p2 = parts.slice(mid).join('. ');
    return (
      <div className="bhrigu-section-body">
        <p>{p1}</p>
        {p2 && <p>{p2}</p>}
      </div>
    );
  }

  return (
    <div className="bhrigu-section-body">
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export const BhriguOraclePanel: React.FC<Props> = ({ user, onUpgrade, membershipTier = 'free' }) => {
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'reading' | 'history' | 'lexicon'>('reading');
  const [readingType, setReadingType] = useState('general');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<BhriguSections | null>(null);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [history, setHistory] = useState<BhriguHistoryEntry[]>([]);
  const [lexiconSearch, setLexiconSearch] = useState('');
  const [lexiconCategory, setLexiconCategory] = useState('All');

  const isPaid = ['prana-flow', 'siddha-quantum', 'akasha-infinity', 'premium', 'premium-monthly', 'premium-annual', 'lifetime', 'compass', 'master'].includes(membershipTier);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const callOracle = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    setSections(null);
    setExpandedSection(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      // ✅ FIX: explicitly pass mode:'full_reading' so edge function returns current dasha
      const { data, error: fnError } = await supabase.functions.invoke('bhrigu-oracle', {
        body: {
          mode: 'full_reading',
          name: user.name,
          chart_context: {
            dateOfBirth: user.birthDate,
            timeOfBirth: user.birthTime,
            placeOfBirth: user.birthPlace,
          },
          readingType,
          question: question.trim(),
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (fnError) throw new Error(fnError.message || 'Oracle channel disrupted');

      if (data?.error === 'RATE_LIMIT') {
        setError(data.message || 'Free weekly reading used. Upgrade for unlimited access.');
        return;
      }

      const secs: BhriguSections = data?.sections || null;
      if (!secs) throw new Error('The Nadi returned silence. Please try again.');

      setSections(secs);
      // Auto-open leaf_found if present, else graha
      setExpandedSection(secs.leaf_found ? 'leaf_found' : 'graha');

      if (secs) {
        const entry: BhriguHistoryEntry = {
          id: Date.now().toString(36),
          date: new Date().toISOString(),
          readingType,
          question: question.trim() || undefined,
          sections: secs,
          birthData: { dob: user.birthDate, tob: user.birthTime, pob: user.birthPlace },
        };
        saveToHistory(entry);
        setHistory(loadHistory());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transmission interrupted. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, readingType, question, isLoading]);

  const loadHistoryEntry = (entry: BhriguHistoryEntry) => {
    setSections(entry.sections);
    setReadingType(entry.readingType);
    setQuestion(entry.question || '');
    setExpandedSection(entry.sections.leaf_found ? 'leaf_found' : 'graha');
    setActiveTab('reading');
  };

  const lexiconCategories = ['All', ...Array.from(new Set(LEXICON.map(l => l.category)))];
  const filteredLexicon = LEXICON.filter(l => {
    const matchSearch = !lexiconSearch ||
      l.term.toLowerCase().includes(lexiconSearch.toLowerCase()) ||
      l.meaning.toLowerCase().includes(lexiconSearch.toLowerCase());
    const matchCat = lexiconCategory === 'All' || l.category === lexiconCategory;
    return matchSearch && matchCat;
  });

  // ── Scalar Wave Field (pure energy background) ───────────────────
  const ScalarField = () => (
    <div className="bhrigu-scalar-field">
      <div className="scalar-orb scalar-orb-1" />
      <div className="scalar-orb scalar-orb-2" />
      <div className="scalar-ring scalar-ring-1" />
      <div className="scalar-ring scalar-ring-2" />
      <div className="scalar-ring scalar-ring-3" />
      {[15, 35, 55, 72, 88].map((top, i) => (
        <div key={i} className="scalar-line" style={{
          top: `${top}%`, left: 0, right: 0,
          animationDelay: `${i * 1.2}s`,
          animationDuration: `${7 + i * 1.5}s`,
        }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative' }}>
      <style>{SCALAR_STYLES}</style>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 100, padding: 4 }}>
        {([['reading', '✦ Oracle Reading'], ['history', '◎ History'], ['lexicon', '⊕ Lexicon']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
              transition: 'all 0.2s',
              background: activeTab === tab ? '#D4AF37' : 'transparent',
              color: activeTab === tab ? '#050505' : 'rgba(212,175,55,0.5)',
              boxShadow: activeTab === tab ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── READING TAB ── */}
        {activeTab === 'reading' && (
          <motion.div key="reading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

            {/* Reading Type Selector */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 10 }}>Select Reading Type</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {READING_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => setReadingType(rt.value)}
                    style={{
                      padding: '8px 16px', borderRadius: 100, border: '1px solid',
                      borderColor: readingType === rt.value ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.08)',
                      background: readingType === rt.value ? 'rgba(212,175,55,0.1)' : 'transparent',
                      color: readingType === rt.value ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {rt.icon} {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Input */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 10 }}>Ask the Rishi (Optional)</p>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What specific question do you bring to the Nadi leaf?"
                rows={2}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '14px 18px', color: 'rgba(255,255,255,0.75)',
                  fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif", resize: 'none' as const,
                  outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.6,
                }}
              />
            </div>

            {/* Upgrade gate */}
            {!isPaid && (
              <div style={{ textAlign: 'center', padding: 24, background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 24, marginBottom: 20 }}>
                <Lock size={24} style={{ color: '#D4AF37', marginBottom: 8, opacity: 0.6 }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                  Free members receive 1 Nadi reading per week. Upgrade for unlimited transmissions.
                </p>
                <button onClick={onUpgrade} style={{ padding: '10px 28px', background: '#D4AF37', color: '#050505', borderRadius: 100, border: 'none', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer' }}>
                  UPGRADE ACCESS
                </button>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={callOracle}
              disabled={isLoading}
              style={{
                width: '100%', padding: '16px', borderRadius: 100, border: '1px solid rgba(212,175,55,0.4)',
                background: isLoading ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.1)',
                color: '#D4AF37', fontWeight: 800, fontSize: 13, letterSpacing: '0.12em',
                textTransform: 'uppercase' as const, cursor: isLoading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 28, transition: 'all 0.2s',
                boxShadow: isLoading ? 'none' : '0 0 30px rgba(212,175,55,0.1)',
              }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="spin" /> Channeling Nadi Transmission...</>
              ) : (
                <><Sparkles size={16} /> Receive Your Nadi Reading</>
              )}
            </button>

            {/* Error */}
            {error && (
              <div style={{ padding: 18, background: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 16, marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,120,120,0.9)', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
                {error.includes('Upgrade') && (
                  <button onClick={onUpgrade} style={{ marginTop: 10, padding: '8px 20px', background: '#D4AF37', color: '#050505', borderRadius: 100, border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                    UPGRADE NOW
                  </button>
                )}
              </div>
            )}

            {/* ── Reading Sections ── */}
            {sections && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {SECTION_CONFIG.map((sec, i) => {
                  const text = sections[sec.key as keyof BhriguSections];
                  if (!text) return null; // skip empty sections
                  const isExpanded = expandedSection === sec.key;
                  return (
                    <motion.div
                      key={sec.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{
                        position: 'relative',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(40px)',
                        border: `1px solid ${isExpanded ? `${sec.color}35` : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: 28, overflow: 'hidden',
                        transition: 'border-color 0.3s',
                        boxShadow: isExpanded ? `0 0 40px ${sec.color}08` : 'none',
                      }}
                    >
                      {/* Scalar field inside each expanded section */}
                      {isExpanded && <ScalarField />}

                      {/* Section Header */}
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : sec.key)}
                        style={{
                          width: '100%', padding: '18px 22px', background: 'transparent', border: 'none',
                          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                          position: 'relative', zIndex: 1,
                        }}
                      >
                        {/* Icon circle */}
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                          background: `${sec.color}10`,
                          border: `1px solid ${sec.color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                          boxShadow: isExpanded ? `0 0 20px ${sec.color}15` : 'none',
                        }}>
                          {sec.icon}
                        </div>
                        
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{
                            fontSize: 8, fontWeight: 800, letterSpacing: '0.5em',
                            textTransform: 'uppercase', color: sec.color, margin: 0,
                          }}>{sec.title}</p>
                          <p style={{
                            fontSize: 13, color: 'rgba(255,255,255,0.45)',
                            margin: '4px 0 0', fontWeight: 400, letterSpacing: '0.02em',
                          }}>{sec.subtitle}</p>
                        </div>
                        
                        <div style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                          {isExpanded
                            ? <ChevronUp size={18} />
                            : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {/* Section Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ position: 'relative', zIndex: 1 }}
                          >
                            <div style={{
                              padding: '0 22px 24px',
                              borderTop: `1px solid ${sec.color}12`,
                            }}>
                              <div style={{ paddingTop: 18 }}>
                                {sec.key === 'transmission'
                                  ? renderSectionText(text, true)
                                  : renderSectionText(text, false)
                                }
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {/* Footer transmission seal */}
                <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
                  <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', color: 'rgba(212,175,55,0.3)', textTransform: 'uppercase' }}>
                    ✦ Transmitted by Maharishi Bhrigu · SQI 2050 → 2026 · Jai Jyotish ✦
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 18 }}>
              Past Transmissions — {history.length} Reading{history.length !== 1 ? 's' : ''}
            </p>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
                <History size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>No readings yet. Receive your first Nadi transmission.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.map((entry, i) => {
                  const date = new Date(entry.date);
                  const rtConfig = READING_TYPES.find(r => r.value === entry.readingType);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => loadHistoryEntry(entry)}
                      style={{
                        padding: '18px 20px', background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 22,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#D4AF37' }}>
                            {rtConfig?.icon} {rtConfig?.label || entry.readingType}
                          </span>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '5px 0 0', fontWeight: 400 }}>
                            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.5)', fontWeight: 700 }}>VIEW →</span>
                      </div>
                      {entry.question && (
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: '0 0 8px' }}>
                          "{entry.question.slice(0, 80)}{entry.question.length > 80 ? '...' : ''}"
                        </p>
                      )}
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                        {entry.sections.graha?.slice(0, 110)}...
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── LEXICON TAB ── */}
        {activeTab === 'lexicon' && (
          <motion.div key="lexicon" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 18 }}>
              Vedic Light-Code Lexicon
            </p>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212,175,55,0.5)' }} />
              <input
                value={lexiconSearch}
                onChange={e => setLexiconSearch(e.target.value)}
                placeholder="Search terms..."
                style={{
                  width: '100%', padding: '12px 14px 12px 38px', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, color: 'rgba(255,255,255,0.7)',
                  fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' as const,
                }}
              />
              {lexiconSearch && (
                <button onClick={() => setLexiconSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={14} color="rgba(255,255,255,0.3)" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {lexiconCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setLexiconCategory(cat)}
                  style={{
                    padding: '5px 14px', borderRadius: 100, border: '1px solid',
                    borderColor: lexiconCategory === cat ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)',
                    background: lexiconCategory === cat ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color: lexiconCategory === cat ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredLexicon.map((item, i) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  style={{
                    padding: '16px 18px', background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: 18,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#D4AF37' }}>{item.term}</span>
                      {item.sanskrit && (
                        <span style={{ fontSize: 13, color: 'rgba(212,175,55,0.4)', fontStyle: 'italic' }}>{item.sanskrit}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.6)', background: 'rgba(34,211,238,0.08)', padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>
                      {item.category}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.meaning}</p>
                </motion.div>
              ))}
              {filteredLexicon.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: 24 }}>No terms found. Try a different search.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BhriguOraclePanel;
