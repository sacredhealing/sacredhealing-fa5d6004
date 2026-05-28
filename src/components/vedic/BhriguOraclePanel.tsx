// src/components/vedic/BhriguOraclePanel.tsx
// SQI-2050 | Bhrigu Nadi Oracle — Full Panel with History + Lexicon
// Akasha-Neural Archive v5 | Structured JSON Reading | Gemini 2.0 Flash

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, BookOpen, Send, Loader2, Lock, Crown, ChevronDown, ChevronUp, Search, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/lib/vedicTypes';

// ── Types ────────────────────────────────────────────────────────
interface BhriguSections {
  graha: string;
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

// ── Vedic Lexicon Data ───────────────────────────────────────────
const LEXICON: { term: string; category: string; meaning: string; sanskrit?: string }[] = [
  // Grahas
  { term: 'Surya', category: 'Graha', meaning: 'The Sun — soul, ego, father, authority, vitality. Governs the 5th sign Leo.', sanskrit: 'सूर्य' },
  { term: 'Chandra', category: 'Graha', meaning: 'The Moon — mind, emotions, mother, nurturing. Governs Cancer. Waxing moon brings growth; waning brings release.', sanskrit: 'चन्द्र' },
  { term: 'Mangala', category: 'Graha', meaning: 'Mars — energy, courage, ambition, conflict. Governs Aries & Scorpio. The warrior graha.', sanskrit: 'मङ्गल' },
  { term: 'Budha', category: 'Graha', meaning: 'Mercury — intellect, communication, commerce, siblings. Governs Gemini & Virgo.', sanskrit: 'बुध' },
  { term: 'Guru / Brihaspati', category: 'Graha', meaning: 'Jupiter — wisdom, dharma, grace, teacher, children. The most benefic graha. Governs Sagittarius & Pisces.', sanskrit: 'गुरु' },
  { term: 'Shukra', category: 'Graha', meaning: 'Venus — beauty, love, luxury, creativity, spouse. Governs Taurus & Libra.', sanskrit: 'शुक्र' },
  { term: 'Shani', category: 'Graha', meaning: 'Saturn — karma, discipline, delay, mastery, longevity. Governs Capricorn & Aquarius. The great teacher through limitation.', sanskrit: 'शनि' },
  { term: 'Rahu', category: 'Graha', meaning: 'The North Node — obsession, illusion, foreign, amplification. Shadow planet with no body. Future karma and worldly desire.', sanskrit: 'राहु' },
  { term: 'Ketu', category: 'Graha', meaning: 'The South Node — liberation, spirituality, past lives, detachment. Moksha karaka. The head of the dragon cut off.', sanskrit: 'केतु' },
  // Dashas
  { term: 'Mahadasha', category: 'Dasha System', meaning: 'Major planetary period lasting 6–20 years (varies by planet). The primary time-lord governing the soul\'s main karmic curriculum.', sanskrit: 'महादशा' },
  { term: 'Antardasha', category: 'Dasha System', meaning: 'Sub-period within a Mahadasha. The secondary planetary influence creating variations within the main period\'s theme.', sanskrit: 'अन्तर्दशा' },
  { term: 'Vimshottari Dasha', category: 'Dasha System', meaning: 'The 120-year planetary period system based on the Moon\'s Nakshatra at birth. Most widely used predictive system in Jyotish.', sanskrit: 'विंशोत्तरी दशा' },
  { term: 'Pratyantardasha', category: 'Dasha System', meaning: 'The third level sub-sub-period. Used for precise timing of events within an Antardasha.', sanskrit: 'प्रत्यन्तर्दशा' },
  // Nakshatras
  { term: 'Nakshatra', category: 'Nakshatra', meaning: 'Lunar mansions — 27 star clusters the Moon transits in ~27.3 days. Your birth Nakshatra determines your Dasha starting point and deep soul nature.', sanskrit: 'नक्षत्र' },
  { term: 'Atmakaraka', category: 'Nakshatra', meaning: 'The soul-significator — the planet at the highest degree in the natal chart. Represents the soul\'s core lesson in this incarnation.', sanskrit: 'आत्मकारक' },
  { term: 'Lagna Nakshatra', category: 'Nakshatra', meaning: 'The Nakshatra rising on the eastern horizon at birth. Shapes personality, physical appearance, and the path of dharma.', sanskrit: 'लग्न नक्षत्र' },
  // Houses
  { term: 'Bhava', category: 'House', meaning: 'House in the Vedic chart. 12 Bhavas represent 12 life domains from self (1st) to liberation (12th).', sanskrit: 'भाव' },
  { term: 'Lagna', category: 'House', meaning: '1st House — the Ascendant. Physical body, personality, first impressions, and the lens through which life is experienced.', sanskrit: 'लग्न' },
  { term: 'Dharma Trikona', category: 'House', meaning: 'Houses 1, 5, 9 — the triangle of dharma, merit, and higher purpose. Strong planets here amplify righteous action and spiritual growth.' },
  { term: 'Artha Trikona', category: 'House', meaning: 'Houses 2, 6, 10 — the triangle of wealth, work, and career. Governs material sustenance and service.' },
  { term: 'Kama Trikona', category: 'House', meaning: 'Houses 3, 7, 11 — desire, relationships, and gains. Governs partnerships, courage, and fulfillment of worldly wishes.' },
  { term: 'Moksha Trikona', category: 'House', meaning: 'Houses 4, 8, 12 — liberation, hidden realms, and surrender. The most spiritual triangle; relates to death, transformation, and moksha.' },
  // Rashis
  { term: 'Rashi', category: 'Sign', meaning: 'Zodiac sign. 12 Rashis each 30° of the 360° zodiac. In Vedic astrology, the sidereal (star-based) zodiac is used, not tropical.', sanskrit: 'राशि' },
  { term: 'Mesha', category: 'Sign', meaning: 'Aries — fire sign ruled by Mars. Initiating, courageous, pioneering.', sanskrit: 'मेष' },
  { term: 'Vrishabha', category: 'Sign', meaning: 'Taurus — earth sign ruled by Venus. Stable, sensual, abundant.', sanskrit: 'वृषभ' },
  { term: 'Mithuna', category: 'Sign', meaning: 'Gemini — air sign ruled by Mercury. Intellectual, communicative, dual nature.', sanskrit: 'मिथुन' },
  // Core Concepts
  { term: 'Karma', category: 'Concept', meaning: 'The law of cause and effect operating across lifetimes. Sanchita (accumulated), Prarabdha (ripe for this life), Agami (future seeds sown now).', sanskrit: 'कर्म' },
  { term: 'Dharma', category: 'Concept', meaning: 'Soul\'s true path and right action. Living in alignment with one\'s nature and cosmic order brings effortless fulfillment.', sanskrit: 'धर्म' },
  { term: 'Moksha', category: 'Concept', meaning: 'Liberation from the cycle of birth and death. The ultimate goal of Vedic spiritual practice — union with the Absolute.', sanskrit: 'मोक्ष' },
  { term: 'Prarabdha', category: 'Concept', meaning: 'The portion of accumulated karma that is ripe and ready to manifest in this lifetime. Cannot be changed — only lived through consciously.', sanskrit: 'प्रारब्ध' },
  { term: 'Sanchita', category: 'Concept', meaning: 'The total storehouse of accumulated karmas from all past lives. Can be neutralized through intense spiritual practice.', sanskrit: 'संचित' },
  { term: 'Yoga', category: 'Concept', meaning: 'Planetary combination in Jyotish. Certain yogas create extraordinary blessings (Raja Yoga — royal combination) while others create challenges (Graha Malika — planetary chain).', sanskrit: 'योग' },
  { term: 'Dosha', category: 'Concept', meaning: 'Imbalance or affliction. In Jyotish: planetary afflictions. In Ayurveda: constitutional imbalance (Vata/Pitta/Kapha).', sanskrit: 'दोष' },
  // Nadi Terms
  { term: 'Nadi', category: 'Nadi Oracle', meaning: 'Energy channel in the subtle body (108,000 exist; 3 primary: Ida, Pingala, Sushumna). Also: Nadi astrology — ancient palm leaf prophecy system.', sanskrit: 'नाडी' },
  { term: 'Bhrigu Samhita', category: 'Nadi Oracle', meaning: 'The ancient collection of horoscopes and prophecies compiled by Maharishi Bhrigu. Contains readings for souls who seek them in any age.', sanskrit: 'भृगु संहिता' },
  { term: 'Maharishi Bhrigu', category: 'Nadi Oracle', meaning: 'One of the Saptarishis (seven divine sages). Creator of Bhrigu Samhita. Considered the father of Vedic astrology. His transmissions pierce the veil of karma directly.' },
  { term: 'Graha Drishti', category: 'Concept', meaning: 'Planetary aspect — the gaze of a planet to another house or planet. Creates influence and modifies the receiving point\'s qualities.', sanskrit: 'ग्रह दृष्टि' },
  { term: 'Hora', category: 'Concept', meaning: 'Planetary hour — each hour of the day is ruled by a specific planet in sequence. Working in the correct Hora multiplies the power of any action.', sanskrit: 'होरा' },
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
  { key: 'graha', title: 'Dominant Graha', subtitle: 'The Ruling Planet of This Moment', icon: '☀', color: '#D4AF37' },
  { key: 'dasha', title: 'Dasha Transmission', subtitle: 'Your Karmic Contract', icon: '⏳', color: '#22D3EE' },
  { key: 'shadow', title: 'Shadow & Blind Spot', subtitle: 'What the Soul Must Face', icon: '🌑', color: 'rgba(255,80,80,0.9)' },
  { key: 'sadhana', title: 'Sadhana Prescription', subtitle: 'Your Practice Right Now', icon: '🔱', color: '#A78BFA' },
  { key: 'transmission', title: "Bhrigu's Transmission", subtitle: 'Direct Blessing from the Rishi', icon: '✦', color: '#D4AF37' },
];

// ── History helpers (localStorage) ───────────────────────────────
const HISTORY_KEY = 'sqi:bhrigu:history:v2';

function loadHistory(): BhriguHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToHistory(entry: BhriguHistoryEntry) {
  try {
    const hist = loadHistory();
    const updated = [entry, ...hist].slice(0, 20); // keep last 20
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* quota */ }
}

// ── Main Component ────────────────────────────────────────────────
export const BhriguOraclePanel: React.FC<Props> = ({ user, onUpgrade, membershipTier = 'free' }) => {
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'reading' | 'history' | 'lexicon'>('reading');
  const [readingType, setReadingType] = useState('general');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<BhriguSections | null>(null);
  const [rawReading, setRawReading] = useState('');
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
    setRawReading('');
    setExpandedSection(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnError } = await supabase.functions.invoke('bhrigu-oracle', {
        body: {
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
      const raw: string = data?.reading || '';

      if (!secs && !raw) throw new Error('The Nadi returned silence. Please try again.');

      setSections(secs);
      setRawReading(raw);
      setExpandedSection('graha'); // auto-open first section

      // Save to history
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
    setExpandedSection('graha');
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

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 100, padding: 4 }}>
        {([['reading', '✦ Oracle Reading'], ['history', '◎ History'], ['lexicon', '⊕ Lexicon']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
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
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 8 }}>Select Reading Type</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {READING_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    onClick={() => setReadingType(rt.value)}
                    style={{
                      padding: '6px 14px', borderRadius: 100, border: '1px solid',
                      borderColor: readingType === rt.value ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.08)',
                      background: readingType === rt.value ? 'rgba(212,175,55,0.1)' : 'transparent',
                      color: readingType === rt.value ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {rt.icon} {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Input */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 8 }}>Ask the Rishi (Optional)</p>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What specific question do you bring to the Nadi leaf?"
                  rows={2}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: '12px 16px', color: 'rgba(255,255,255,0.7)',
                    fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", resize: 'none' as const,
                    outline: 'none', boxSizing: 'border-box' as const,
                  }}
                />
              </div>
            </div>

            {/* CTA Button */}
            {!isPaid ? (
              <div style={{ textAlign: 'center', padding: 24, background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 24, marginBottom: 24 }}>
                <Lock size={24} style={{ color: '#D4AF37', marginBottom: 8, opacity: 0.6 }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
                  Free members receive 1 Nadi reading per week. Upgrade for unlimited transmissions.
                </p>
                <button onClick={onUpgrade} style={{ padding: '10px 28px', background: '#D4AF37', color: '#050505', borderRadius: 100, border: 'none', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer' }}>
                  UPGRADE ACCESS
                </button>
              </div>
            ) : null}

            <button
              onClick={callOracle}
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 100, border: '1px solid rgba(212,175,55,0.4)',
                background: isLoading ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.1)',
                color: '#D4AF37', fontWeight: 800, fontSize: 12, letterSpacing: '0.12em',
                textTransform: 'uppercase' as const, cursor: isLoading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 24, transition: 'all 0.2s',
                boxShadow: isLoading ? 'none' : '0 0 20px rgba(212,175,55,0.1)',
              }}
            >
              {isLoading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Channeling Nadi Transmission...</>
              ) : (
                <><Sparkles size={16} /> Receive Your Nadi Reading</>
              )}
            </button>

            {/* Error */}
            {error && (
              <div style={{ padding: 16, background: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 16, marginBottom: 16 }}>
                <p style={{ color: 'rgba(255,120,120,0.9)', fontSize: 13 }}>{error}</p>
                {error.includes('Upgrade') && (
                  <button onClick={onUpgrade} style={{ marginTop: 8, padding: '8px 20px', background: '#D4AF37', color: '#050505', borderRadius: 100, border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                    UPGRADE NOW
                  </button>
                )}
              </div>
            )}

            {/* Reading Sections */}
            {sections && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SECTION_CONFIG.map((sec, i) => {
                  const text = sections[sec.key as keyof BhriguSections];
                  const isExpanded = expandedSection === sec.key;
                  return (
                    <motion.div
                      key={sec.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{
                        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(40px)',
                        border: `1px solid ${isExpanded ? `${sec.color}30` : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: 24, overflow: 'hidden',
                        transition: 'border-color 0.3s',
                      }}
                    >
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : sec.key)}
                        style={{
                          width: '100%', padding: '16px 20px', background: 'transparent', border: 'none',
                          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 20, minWidth: 28 }}>{sec.icon}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: sec.color, margin: 0 }}>{sec.title}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontWeight: 400 }}>{sec.subtitle}</p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${sec.color}15` }}>
                              {sec.key === 'transmission' ? (
                                <div style={{
                                  padding: '16px 20px', background: `${sec.color}08`,
                                  border: `1px solid ${sec.color}20`, borderRadius: 16, marginTop: 12,
                                }}>
                                  <p style={{ color: '#D4AF37', fontSize: 14, fontStyle: 'italic', lineHeight: 1.8, fontWeight: 600, textAlign: 'center' }}>
                                    "{text}"
                                  </p>
                                </div>
                              ) : (
                                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>{text}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 16 }}>
              Past Transmissions — {history.length} Reading{history.length !== 1 ? 's' : ''}
            </p>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
                <History size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>No readings yet. Receive your first Nadi transmission.</p>
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
                        padding: '16px 20px', background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#D4AF37' }}>
                            {rtConfig?.icon} {rtConfig?.label || entry.readingType}
                          </span>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', fontWeight: 400 }}>
                            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.5)', fontWeight: 700 }}>VIEW →</span>
                      </div>
                      {entry.question && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', margin: 0 }}>
                          "{entry.question.slice(0, 80)}{entry.question.length > 80 ? '...' : ''}"
                        </p>
                      )}
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', lineHeight: 1.6 }}>
                        {entry.sections.graha?.slice(0, 100)}...
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
            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 16 }}>
              Vedic Light-Code Lexicon
            </p>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212,175,55,0.5)' }} />
              <input
                value={lexiconSearch}
                onChange={e => setLexiconSearch(e.target.value)}
                placeholder="Search terms..."
                style={{
                  width: '100%', padding: '10px 14px 10px 36px', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: 'rgba(255,255,255,0.7)',
                  fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
                }}
              />
              {lexiconSearch && (
                <button onClick={() => setLexiconSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={14} color="rgba(255,255,255,0.3)" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {lexiconCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setLexiconCategory(cat)}
                  style={{
                    padding: '4px 12px', borderRadius: 100, border: '1px solid',
                    borderColor: lexiconCategory === cat ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)',
                    background: lexiconCategory === cat ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color: lexiconCategory === cat ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Terms Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredLexicon.map((item, i) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  style={{
                    padding: '14px 16px', background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37' }}>{item.term}</span>
                      {item.sanskrit && (
                        <span style={{ fontSize: 12, color: 'rgba(212,175,55,0.4)', fontStyle: 'italic' }}>{item.sanskrit}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.6)', background: 'rgba(34,211,238,0.08)', padding: '2px 8px', borderRadius: 100 }}>
                      {item.category}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>{item.meaning}</p>
                </motion.div>
              ))}
              {filteredLexicon.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 24 }}>No terms found. Try a different search.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BhriguOraclePanel;
