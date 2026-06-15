// SQI-2050 | BHRIGU NADI JYOTISH CHAMBER
// Auto-calculates Lagna, Moon Sign, Sun Sign, Dasha from birth data
// Pulls existing birth data from profiles table automatically
// Akasha-Neural Archive v8 | Beginner-to-Master Journey

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { BirthDetailsForm } from '@/components/vedic/BirthDetailsForm';
import { AccurateHoraWatch } from '@/components/vedic/AccurateHoraWatch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { getGitaVerseForCycle, type GitaVerse } from '@/lib/gitaVerses';
import { canAccessJyotishModule } from '@/lib/tierAccess';
import { normalizePlanetName } from '@/lib/jyotishMantraLogic';

// ── Types ────────────────────────────────────────────────────────
interface BirthData {
  birth_name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
}

interface EphemerisData {
  moonNakshatra: string;
  moonLongitude: number;
  ascendantSign: string;
  sunSign: string;
  dashaData: {
    activeMaha: { planet: string; start: string; end: string; years: number } | null;
    activeAntar: { planet: string; start: string; end: string } | null;
    dashaTree: Array<{
      planet: string; years: number; start: string; end: string; active: boolean;
      antardashas: Array<{ planet: string; start: string; end: string; active: boolean }>;
    }>;
  } | null;
}

// ── Planetary display data ───────────────────────────────────────
const PLANET_INFO: Record<string, { sym: string; color: string; meaning: string; mantra: string }> = {
  Sun:     { sym: '☉', color: '#FFA500', meaning: 'Soul, authority, father, vitality, leadership', mantra: 'Om Hrām Hrīm Hrauṃ Sah Sūryāya Namaḥ' },
  Moon:    { sym: '☽', color: '#C0C8E8', meaning: 'Mind, emotions, mother, public, creativity', mantra: 'Om Śrām Śrīm Śrauṃ Sah Chandrāya Namaḥ' },
  Mars:    { sym: '♂', color: '#FF4444', meaning: 'Energy, courage, action, siblings, property', mantra: 'Om Krām Krīm Krauṃ Sah Bhaumāya Namaḥ' },
  Mercury: { sym: '☿', color: '#44CC44', meaning: 'Intellect, communication, trade, youth', mantra: 'Om Brām Brīm Brauṃ Sah Budhāya Namaḥ' },
  Jupiter: { sym: '♃', color: '#FFD700', meaning: 'Wisdom, dharma, children, blessings, expansion', mantra: 'Om Grām Grīm Grauṃ Sah Guruve Namaḥ' },
  Venus:   { sym: '♀', color: '#FF69B4', meaning: 'Love, beauty, luxury, arts, relationships', mantra: 'Om Drām Drīm Drauṃ Sah Śukrāya Namaḥ' },
  Saturn:  { sym: '♄', color: '#8888AA', meaning: 'Karma, discipline, patience, service, mastery', mantra: 'Om Prām Prīm Prauṃ Sah Śanaiścharāya Namaḥ' },
  Rahu:    { sym: '☊', color: '#D4AF37', meaning: 'Obsession, illusion, foreign, amplification, desire', mantra: 'Om Bhrām Bhrīm Bhrauṃ Sah Rāhave Namaḥ' },
  Ketu:    { sym: '☋', color: '#AA7744', meaning: 'Liberation, past-life mastery, detachment, moksha', mantra: 'Om Srām Srīm Srauṃ Sah Ketave Namaḥ' },
};

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYMBOLS: Record<string, string> = {
  Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
  Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓'
};

const SIGN_MEANINGS: Record<string, string> = {
  Aries: 'Pioneer, warrior, initiator. Fire energy — you came to start and lead.',
  Taurus: 'Builder, artist, sensualist. Earth energy — you came to create stability and beauty.',
  Gemini: 'Communicator, thinker, connector. Air energy — you came to bridge worlds through words.',
  Cancer: 'Nurturer, feeler, protector. Water energy — you came to create home and emotional sanctuary.',
  Leo: 'Leader, creator, performer. Fire energy — you came to shine and inspire.',
  Virgo: 'Healer, servant, analyst. Earth energy — you came to refine, perfect, and serve.',
  Libra: 'Diplomat, artist, partner. Air energy — you came to create harmony and beauty in relationships.',
  Scorpio: 'Transformer, mystic, detective. Water energy — you came to dive deep and regenerate.',
  Sagittarius: 'Explorer, philosopher, teacher. Fire energy — you came to seek truth and expand horizons.',
  Capricorn: 'Achiever, builder, authority. Earth energy — you came to build lasting structures of value.',
  Aquarius: 'Visionary, humanitarian, innovator. Air energy — you came to serve the collective future.',
  Pisces: 'Mystic, healer, dreamer. Water energy — you came to dissolve boundaries and connect to the infinite.',
};

const DASHA_MEANINGS: Record<string, string> = {
  Sun:     '6-year period of soul clarity, authority, and self-expression. Father and government themes.',
  Moon:    '10-year period of emotional deepening, public life, and nurturing connections.',
  Mars:    '7-year period of intense action, ambition, and karmic confrontation with obstacles.',
  Rahu:    '18-year period of obsession, illusion, foreign influence, and unconventional dharmic paths.',
  Jupiter: '16-year period of expansion, wisdom, blessings, dharma, and spiritual growth.',
  Saturn:  '19-year period of karma settlement, discipline, service, and mastery through limitation.',
  Mercury: '17-year period of intellect, communication, commerce, and learning across all domains.',
  Ketu:    '7-year period of spiritual intensification, release, and past-life karma resolution.',
  Venus:   '20-year period of love, luxury, creativity, relationships, and life enjoyment.',
};

// ── Module data (all 32) ──────────────────────────────────────────
const JYOTISH_MODULES = [
  { id:1, tier:'free', title:'The Eye of the Veda', sub:'Origin, Purpose & Sacred Context of Jyotish', dur:'15 min', topics:['What is Vedānga — the 6 limbs of the Veda and Jyotish as the supreme eye','History: Brahma → Nārada → Parāśara → Vedavyāsa','Bhrigu Muni — 500,000 pre-written horoscopes','Difference from Western astrology — sidereal vs tropical','Jyotish as healing science — not fatalism but illumination'] },
  { id:2, tier:'free', title:'Cosmic Architecture: The 9 Grahas', sub:'The Nine Planetary Intelligences', dur:'27 min', topics:['Sun — soul, authority, father, vitality','Moon — mind, emotions, mother, public','Mars — energy, courage, land, surgery','Mercury — intellect, communication, trade','Jupiter — wisdom, dharma, blessings, children','Venus — love, beauty, arts, relationships','Saturn — karma, discipline, mastery','Rahu — obsession, illusion, amplification','Ketu — liberation, past life, moksha'] },
  { id:3, tier:'free', title:'The 12 Rashis', sub:'Signs as Fields of Karmic Expression', dur:'30 min', topics:['Sign elements: Fire, Earth, Air, Water','Sign modes: Movable, Fixed, Dual','Exaltation and debilitation of planets','Your Moon sign and Sun sign profiles','Aries through Pisces — complete profiles'] },
  { id:4, tier:'free', title:'The 12 Bhāvas (Houses)', sub:'The Map of Your Life Karma', dur:'20 min', topics:['Four aims: Dharma, Artha, Kāma, Moksha','Kendra (1,4,7,10) — pillars of existence','Trikona (1,5,9) — dharmic trinity','Dusthāna (6,8,12) — transformation houses','Each house complete meaning — 1st through 12th'] },
  { id:5, tier:'free', title:'27 Nakshatra Awakening', sub:'Lunar Mansions — Soul Original Frequency', dur:'25 min', topics:['What is a Nakshatra — the Moon 27 daily mansions','Your birth star — how to find it and what it means','Nakshatra deity, ruling planet, symbol','All 27 Nakshatras from Ashvinī to Revatī','Nakshatra-specific mantras and practices'] },
  { id:6, tier:'free', title:'Reading Your Own Chart: First Light', sub:'From Theory to the Living Chart', dur:'20 min', topics:['How to cast your chart — free software walkthrough','North vs South Indian chart layout','Identifying Lagna, Moon sign, Sun sign','Reading your dharmic trinity: 1st, 5th, 9th houses','Ethical chart reading guidelines'] },
  { id:7, tier:'prana', title:'Planetary Dignity: Strength & Weakness', sub:'Shadbala and the Six Pillars of Graha Power', dur:'35 min', topics:['Six dignity states: Exalted, Own sign, Enemy, Debilitated','Vargottama — supreme dignity (same sign in D1 and D9)','Shadbala 6-fold strength calculation system','Planetary Avasthas — 5 maturity states','Retrograde and combust planets'] },
  { id:8, tier:'prana', title:'Bhāva Analysis Mastery', sub:'Precision House Reading', dur:'40 min', topics:['All 144 lord-in-house combinations','Argalā — planetary intervention system','Detailed reading: 4th, 7th, 10th houses','Bhāva Arudha Padas — public perception layer','Multiple indicator confirmation principle'] },
  { id:9, tier:'prana', title:'Aspects & Yogas: Core Combinations', sub:'The Grammar of Chart Synthesis', dur:'45 min', topics:['Graha drishti — special Mars, Jupiter, Saturn aspects','Rāja Yoga — all main power combinations','Pancha Mahāpurusha Yogas','Viparīta Rāja Yoga — elevation through loss','Dhana Yoga — wealth combinations'] },
  { id:10, tier:'prana', title:'Vimshottari Dasha: The Master Clock', sub:'120-Year Planetary Timing System', dur:'50 min', topics:['9-planet sequence and year allocations','Calculating your starting dasha from birth star','Mahadasha, Antardasha, Pratyantardasha','Psychology of each major period','Case studies: key life events timed'] },
  { id:11, tier:'prana', title:'Transit Science (Gochar)', sub:'Current Planetary Weather', dur:'35 min', topics:['How transits activate your natal chart','Saturn Sade Sati — the 7.5-year trial','Jupiter annual transit — expansion windows','Rāhu-Ketu 18-month axis shift','Eclipse effects — 6-month shadow activation'] },
  { id:12, tier:'prana', title:'27 Nakshatras: Complete System', sub:'Full Nakshatra Predictive Science', dur:'60 min', topics:['All 27 Nakshatras — full deity, planet, symbol profiles','Nakshatra Padas — 108 divisions','Navtara Chakra — 9-fold classification from birth star','Nakshatra compatibility — Tārā matching','Nakshatra remedies for all 27 stars'] },
  { id:13, tier:'prana', title:'Pañcāṅga: Sacred Calendar Science', sub:'Five Limbs of Living in Cosmic Rhythm', dur:'30 min', topics:['Tithi, Vāra, Nakshatra, Yoga, Karaṇa','Rāhu Kāla, Yamagaṇḍa, Gulika — inauspicious periods','Reading a Pañcāṅga almanac daily','Pañcāṅga as daily spiritual alignment'] },
  { id:14, tier:'prana', title:'Navamsha (D9): The Soul Chart', sub:'The Inner Blueprint', dur:'40 min', topics:['What D9 represents — soul, dharma, life after 36','Vargottama — highest dignity in D9','D9 for marriage and spouse quality','Pushkara Navamsha — 5 most auspicious degrees','Combining D1 + D9 + D10 for complete picture'] },
  { id:15, tier:'siddha', title:'All 16 Divisional Charts', sub:'The 16 Lenses of Karmic Life Areas', dur:'90 min', topics:['D1 through D60 — all 16 Vargas explained','D-2 Horā (wealth) · D-7 Saptamsha (children)','D-10 Daśāṃśa (career) · D-12 (ancestral karma)','D-60 Ṣaṣṭyaṃśa — deepest past-life karma'] },
  { id:16, tier:'siddha', title:'Ashtakavarga System', sub:'8-Source Strength Grid', dur:'50 min', topics:['8 sources of bindus for each planet','Sarva Ashtakavarga — total house strength','Transit predictions using bindu count','Longevity assessment via Pindāyu'] },
  { id:17, tier:'siddha', title:'Special Dasha Systems', sub:'Three Master Clocks Beyond Vimshottari', dur:'75 min', topics:['Yogini Dasha — 36-year cycle, 8 Yoginis','Kālachakra Dasha — most secret system','Chara Dasha (Jaimini) — sign-based timing','Triple-dasha cross-referencing'] },
  { id:18, tier:'siddha', title:'Jaimini Jyotish System', sub:'Soul-Level Vedic Astrology', dur:'80 min', topics:['Chara Kārakas — 8 soul significators','Ātmakāraka — the soul planet','Karakāṃśa — soul purpose in Navamsha','Upapada Lagna — TRUE marriage indicator','Rāśi drishti — Jaimini aspects'] },
  { id:19, tier:'siddha', title:'Prashna Jyotish', sub:'Answering Any Question Without a Birth Chart', dur:'60 min', topics:['Why the moment of asking contains the answer','Career, finance, health, relationship Prashna','Lost items and missing persons','Ethics of Prashna — what not to answer'] },
  { id:20, tier:'siddha', title:'Muhurta: Electional Mastery', sub:'Choosing the Perfect Moment', dur:'55 min', topics:['Chandra Bala, Tārā Bala, Pañcāṅga Śuddhi','Muhurta for marriage, business, surgery','Abhijit Muhurta — the universal shortcut','Shodasha Samskāra — 16 life ceremony timing'] },
  { id:21, tier:'siddha', title:'Medical Jyotish', sub:'Body, Disease & Healing Through the Chart', dur:'65 min', topics:['Each planet body parts and organ systems','Dusthāna analysis — disease, chronic, hospitalization','Longevity assessment methods','Ayurvedic dosha from Lagna and Moon'] },
  { id:22, tier:'siddha', title:'Relationships & Compatibility', sub:'Full Vedic Synastry', dur:'60 min', topics:['Ashtakoot 8-fold system — maximum 36 points','Upapada Lagna — ultimate marriage quality indicator','Navamsha D9 synastry comparison','Timing marriage through dasha + transit'] },
  { id:23, tier:'akasha', title:'Bhrigu Nandi Nadi System (BNN)', sub:'5000-Year-Old Predictive Palm-Leaf Science', dur:'120 min', secret:true, topics:['BNN Core Grammar — conjunction as event language','Jupiter progression — 12-year life chapters','108 core planetary combinations','CCTV, M-Technique, D-Technique'] },
  { id:24, tier:'akasha', title:'Nadi Secrets: The 18 Siddhar Transmissions', sub:'Secret Science of the Tamil Siddhars Palm Leaf Oracle', dur:'90 min', secret:true, topics:['Agastya, Bogar, Thirumoolar Nadi lineages','Physical repositories: Vaitheswaran Koil, Adyar','The 16 Kāṇḍas of Ajeeva Nadi','Thumb impression method — how leaves find their owner'] },
  { id:25, tier:'akasha', title:'Bhrigu Samhitā Technique', sub:'500,000-Horoscope Database of Maharishi Bhrigu', dur:'75 min', secret:true, topics:['Bhrigu Bindu — most sensitive degree in your chart','Jupiter as primary timing engine','Any planet transiting BB = most significant events','Integrating Bhrigu with BNN and Parāśara'] },
  { id:26, tier:'akasha', title:'Kālachakra Dasha: Quantum Timing', sub:'The Most Secret Advanced Dasha System', dur:'80 min', secret:true, topics:['Most ancient dasha — preserved in tantric lineages','Savya vs Apasavya rotation rules','Death timing and longevity assessment','Events missed by Vimshottari appear here'] },
  { id:27, tier:'akasha', title:'Mundane Jyotish', sub:'Nations, Leaders & Civilizational Cycles', dur:'70 min', topics:['National horoscopes — reading country charts','Jupiter-Saturn conjunctions — 20-year epochs','Eclipse charts and collective karmic themes','Vedic economic astrology — market timing'] },
  { id:28, tier:'akasha', title:'Svara Shāstra: Breath Astrology', sub:'The Most Secret Siddha Oracle', dur:'60 min', secret:true, topics:['Iḍā (Moon), Piṅgalā (Sun), Suṣumnā (neutral)','Five elements in breath — Earth, Water, Fire, Air, Space','Predicting from breath alone — no chart needed','Daily Svara practice for cosmic alignment'] },
  { id:29, tier:'akasha', title:'Jyotish & Mantra Vidya', sub:'Planetary Seed Mantras', dur:'75 min', topics:['Beej mantras for all 9 Grahas','Navagraha Stotra — collective hymn','Mantra timing — best Nakshatra, Tithi, Vāra','Building a 40-day personal Graha sādhana'] },
  { id:30, tier:'akasha', title:'Siddha Parihāram: Advanced Remedial Science', sub:'Remedies from the Tamil Siddhar Tradition', dur:'80 min', secret:true, topics:['Gemstone prescription — the complete system','Yantra construction and consecration','Thulāvaraṇam — sacred weight-based remedy','Navagraha homa — 9-planet fire ceremony'] },
  { id:31, tier:'akasha', title:'Spirituality, Moksha & the Chart of Liberation', sub:'Reading the Soul Journey Toward Liberation', dur:'70 min', topics:['Moksha indicators in the chart','Reading charts of Siddha masters','Timing of spiritual awakening','Past-life indicators through D-60 and Ketu'] },
  { id:32, tier:'akasha', title:'Chart Reading at Siddha Level', sub:'Full Integration — Reading as Bhrigu Would', dur:'90 min', secret:true, topics:['The rule of 3 confirmations','Steps 1–10: Complete Siddha methodology','BNN progression + Transit confirmation','Capstone: 60-min recorded chart reading'] },
];

const TIER_ACCESS: Record<string, string[]> = {
  free: ['free'],
  // Prana-Flow (modules 1-14)
  'prana-flow': ['free','prana'],
  'prana-flow-monthly': ['free','prana'],
  'prana_flow': ['free','prana'],
  // Siddha-Quantum (modules 1-22)
  'siddha-quantum': ['free','prana','siddha'],
  'siddha_quantum': ['free','prana','siddha'],
  'siddha-quantum-monthly': ['free','prana','siddha'],
  // Akasha-Infinity (all 32 modules)
  'akasha-infinity': ['free','prana','siddha','akasha'],
  'akasha_infinity': ['free','prana','siddha','akasha'],
  lifetime: ['free','prana','siddha','akasha'],
  admin: ['free','prana','siddha','akasha'],
};

const SQI = { gold: '#D4AF37', black: '#050505' };

// ── Lexicon ─────────────────────────────────────────────────────
const LEXICON = [
  { term:'Lagna', skt:'लग्न', cat:'House', m:'Your Ascendant — the zodiac sign rising on the eastern horizon at the exact moment of your birth. The most important single point in your chart. It shapes your physical body, personality, and the entire lens through which life is experienced.' },
  { term:'Rashi', skt:'राशि', cat:'Zodiac', m:'A zodiac sign in the Vedic sidereal system. There are 12 Rashis from Mesha (Aries) to Meena (Pisces). Your Moon Rashi is your emotional blueprint; your Lagna Rashi is your physical and life blueprint.' },
  { term:'Nakshatra', skt:'नक्षत्र', cat:'Star', m:'One of 27 lunar mansions — specific star clusters the Moon passes through in approximately 27 days. Your birth Nakshatra determines your Vimshottari Dasha starting point and reveals your deepest soul nature.' },
  { term:'Mahadasha', skt:'महादशा', cat:'Dasha', m:'Your major planetary period lasting 6–20 years. The planet ruling this period governs the main karmic curriculum of that phase of your life. There are 9 planets and 9 periods spanning 120 years total.' },
  { term:'Antardasha', skt:'अन्तर्दशा', cat:'Dasha', m:'Your sub-period within the main Mahadasha. The Antardasha planet adds its flavor and themes to the major period — together they create the specific texture of your current karmic chapter.' },
  { term:'Vimshottari Dasha', skt:'विंशोत्तरी', cat:'Dasha', m:'The 120-year planetary timing system used in Vedic astrology. Based on the Moon Nakshatra at birth. The most widely used and reliable predictive timing system in Jyotish.' },
  { term:'Graha', skt:'ग्रह', cat:'Planet', m:'A planet in Vedic astrology — literally meaning "that which grasps." The 9 Grahas are: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu. Each governs specific life areas and karmic themes.' },
  { term:'Bhava', skt:'भाव', cat:'House', m:'A house in the Vedic chart. There are 12 Bhavas representing 12 areas of life from self (1st) to liberation (12th). Your Lagna determines which sign occupies which house in your chart.' },
  { term:'Yoga', skt:'योग', cat:'Combination', m:'A planetary combination creating a specific life destiny pattern. Raja Yoga creates power and status; Dhana Yoga creates wealth; Viparita Raja Yoga creates unexpected elevation through crisis.' },
  { term:'Ayanamsa', skt:'अयनांश', cat:'Technical', m:'The difference between the sidereal (Vedic) and tropical (Western) zodiacs — approximately 23–24 degrees. Vedic astrology uses the Lahiri Ayanamsa, based on the actual star positions in the sky.' },
  { term:'Atmakaraka', skt:'आत्मकारक', cat:'Jaimini', m:'The planet at the highest degree in your natal chart (in the Jaimini system). It represents your soul core lesson and primary mission in this incarnation — the most important planet for spiritual reading.' },
  { term:'Bhrigu Bindu', cat:'Nadi', m:'The midpoint between your Rahu and Moon longitudes — the most sensitive predictive degree in your chart. Any slow-moving planet (Saturn, Jupiter, or Rahu/Ketu) transiting this degree triggers the most significant events of your life.' },
  { term:'Navamsha', skt:'नवांश', cat:'Divisional', m:'The 9th divisional chart (D9) — considered the most important Varga chart. It shows your inner soul nature, spiritual path, spouse quality, and life after age 36. Always confirm predictions in D9 before declaring them.' },
  { term:'Sade Sati', cat:'Transit', m:'The 7.5-year Saturn transit through the signs before, on, and after your natal Moon sign. A period of significant testing, restructuring, and ultimately profound maturation. Three distinct 2.5-year phases.' },
  { term:'Muhurta', skt:'मुहूर्त', cat:'Timing', m:'The Vedic science of choosing auspicious moments to begin important actions. A properly chosen Muhurta significantly improves the probability of success for any venture, ceremony, or major life decision.' },
  { term:'Panchanga', skt:'पञ्चाङ्ग', cat:'Calendar', m:'The five-limbed Vedic almanac: Tithi (lunar day), Vara (weekday planet), Nakshatra (Moon star), Yoga (Sun-Moon combination), and Karana (half-day). Reading the Panchanga daily aligns your actions with cosmic rhythms.' },
  { term:'Dusthana', cat:'House', m:'Houses 6, 8, and 12 — the houses of challenge, transformation, and liberation. Not inherently bad — they are houses of intense karma. Viparita Raja Yoga can make these houses produce unexpected royal results.' },
  { term:'Kendra', skt:'केन्द्र', cat:'House', m:'The four angular houses (1, 4, 7, 10) — the most powerful positions for a planet to occupy. Planets in Kendra houses are strongest in their ability to manifest results in the material world.' },
  { term:'Hora', skt:'होरा', cat:'Time', m:'A planetary hour — each hour of the day is ruled by a specific planet in a set sequence. Choosing the right Hora to begin actions can significantly improve outcomes. Jupiter and Venus Horas are most auspicious.' },
  { term:'Karakamsha', skt:'कारकांश', cat:'Jaimini', m:'The sign occupied by the Atmakaraka (soul planet) in the Navamsha chart. This is the most important point in Jaimini Jyotish — it reveals the soul ultimate dharmic purpose and spiritual direction.' },
];

// ── BNN Age Planets ──────────────────────────────────────────────
const BNN_AGES = [
  { age:16, planet:'Jupiter' }, { age:22, planet:'Sun' }, { age:24, planet:'Moon' },
  { age:28, planet:'Venus' }, { age:32, planet:'Mars' }, { age:36, planet:'Mercury' },
  { age:42, planet:'Rahu' }, { age:48, planet:'Saturn' },
];



// ── Format structured sections into readable text ─────────────────────────
function formatSections(sections: Record<string, string>): string {
  if (!sections) return '';
  const order = ['graha', 'dasha', 'shadow', 'sadhana', 'transmission'];
  const labels: Record<string, string> = {
    graha: 'Graha Reading',
    dasha: 'Dasha Timing',
    shadow: 'Shadow Work',
    sadhana: 'Sādhana Prescription',
    transmission: 'Bhrigu Transmission'
  };
  return order
    .filter(k => sections[k])
    .map(k => `## ${labels[k]}\n\n${sections[k]}`)
    .join('\n\n');
}

// ── LexEntry: separate component to avoid illegal hook in map ────
const LexEntry: React.FC<{ entry: typeof LEXICON[0]; gs: React.CSSProperties }> = ({ entry: e, gs }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div onClick={() => setExpanded(!expanded)} style={{ ...gs, padding:'13px 15px', marginBottom:7, cursor:'pointer', transition:'background 0.2s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom: expanded ? 8 : 0 }}>
        <span style={{ fontSize:13, fontWeight:900, letterSpacing:'-0.02em' }}>{e.term}</span>
        {e.skt && <span style={{ fontSize:14, color:'rgba(212,175,55,0.6)' }}>{e.skt}</span>}
        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.15)', color:'#D4AF37', marginLeft:'auto' }}>{e.cat}</span>
      </div>
      {expanded && <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.6)', lineHeight:1.55 }}>{e.m}</p>}
    </div>
  );
};

// ── Component ────────────────────────────────────────────────────


// ── DAILY KARMA GUIDE — tiered ────────────────────────────────────────────────
const WEEKDAY_KARMA: Record<number, {
  planet: string; sym: string; color: string; varName: string;
  theme: string; planetDesc: string;
  doItems: string[]; avoidItems: string[];
  reflection: string; mantra: string;
  pranaDo: string[]; pranaAvoid: string[]; pranaReflection: string;
  siddhaDo: string[]; siddhaInsight: string;
}> = {
  0: { planet:'Sun', sym:'☉', color:'#F59E0B', varName:'Ravivāra',
    theme:'Soul Power, Authority & Clarity',
    planetDesc:'Sunday belongs to the Sun — the soul of our solar system. His energy brings courage, visibility, and life force. A powerful day for prayer, leadership, and healing the father relationship.',
    doItems:['Offer water to the Sun at sunrise — even a glass held toward the light works','Wear orange, yellow, or gold today — Sun\'s colours amplify his energy','Pray for your father or father figures — living or passed','Begin new projects or leadership roles — Sun blesses bold beginnings today'],
    avoidItems:['Avoid ego conflicts and power struggles — Sun\'s energy magnifies pride','Do not cut hair or start arguments on Sunday in Vedic tradition','Avoid dark, heavy spaces — go into sunlight as much as possible'],
    reflection:'"Where in my life am I hiding my true light — and what would it feel like to let myself be seen fully today?"',
    mantra:'Om Hrim Suryaya Namah',
    pranaDo:['Your Sun placement in your chart activates extra strongly today — use this for any area where you want to shine or lead','If Sun rules your ascendant or 10th house, today is your most powerful career day of the week'],
    pranaAvoid:['Your chart\'s Saturn placement may tension with today\'s Sun energy — avoid overworking and rest if you feel depleted'],
    pranaReflection:'"What does my soul truly want to express and be recognised for — and am I honouring that calling?"',
    siddhaDo:['Perform Surya Namaskar (Sun salutation) 12 rounds at sunrise for maximum Prana activation','Light a ghee lamp facing east and chant the Aditya Hridayam — this ancient hymn activates Solar Prana at Siddha level'],
    siddhaInsight:'The Siddhas teach that the Sun is not merely a star — it is a conscious being transmitting life-force through light. When you face the Sun with gratitude, you are communing with a divine intelligence.' },
  1: { planet:'Moon', sym:'☽', color:'#94A3B8', varName:'Somavāra',
    theme:'Emotions, Intuition & Healing',
    planetDesc:'Monday belongs to the Moon — ruler of mind, emotions, and the feminine principle. Her energy is receptive, intuitive, and deeply healing. A perfect day for rest, inner work, and nourishing yourself and others.',
    doItems:['Drink extra water today — Moon rules all liquids and hydration','Rest, slow down, and listen to your feelings without judgment','Connect with your mother or women in your life — Moon blesses these bonds','Cook a nourishing meal from scratch — Moon loves acts of nourishment'],
    avoidItems:['Avoid big decisions when emotions are running high — Moon makes feelings intense','Do not start bold new ventures — Monday is for reflection, not aggressive action','Avoid overeating or emotional eating — Moon can trigger this pattern'],
    reflection:'"What emotion have I been pushing away that is asking for my gentle attention today?"',
    mantra:'Om Shrim Chandramase Namah',
    pranaDo:['Your Moon sign is amplified today — check where the Moon sits in your chart for specific guidance','If your Moon is in a water sign (Cancer, Scorpio, Pisces), your intuition is at its sharpest — trust what you feel'],
    pranaAvoid:['If your natal Moon is afflicted by Saturn or Rahu, Monday can feel emotionally heavy — plan extra self-care'],
    pranaReflection:'"What does my inner child most need from me today — and how can I offer that to myself with love?"',
    siddhaDo:['Chant the Chandra Kavacham or simply "Om Som Somaya Namah" 108 times — this pacifies an afflicted Moon','Wear silver or white, and place a silver bowl of water on your altar overnight to absorb Monday\'s lunar frequency'],
    siddhaInsight:'The Siddhas teach that the Moon is the storehouse of all past-life memory. When her energy is honoured, blocked emotions from many lifetimes begin to gently dissolve.' },
  2: { planet:'Mars', sym:'♂', color:'#EF4444', varName:'Mangalavāra',
    theme:'Courage, Action & Protection',
    planetDesc:'Tuesday belongs to Mars — the warrior planet of courage, energy, and decisive action. His energy is bold, direct, and protective. The best day for physical activity, brave decisions, and standing up for truth.',
    doItems:['Exercise vigorously — Mars loves physical movement and strength','Make that difficult phone call or conversation you have been avoiding','Begin protective rituals or prayers for your home and family','Do something brave — Mars rewards courage taken today'],
    avoidItems:['Avoid arguments and aggressive confrontations — Mars energy can escalate quickly','Do not handle sharp objects carelessly — Mars rules blades and accidents','Avoid impulsive financial decisions — Mars can make us act too fast'],
    reflection:'"Where in my life am I playing it too safe — and what one brave action would my highest self take today?"',
    mantra:'Om Krim Mangalaya Namah',
    pranaDo:['If Mars rules your ascendant (Aries or Scorpio rising), Tuesday is your power day — schedule your most demanding tasks now','Mars in a strong house today means physical energy is available — use it for exercise, building, or protection work'],
    pranaAvoid:['If Mars is in your 6th, 8th, or 12th house natally, Tuesday can bring friction — be extra patient with others'],
    pranaReflection:'"What am I protecting in my life — and is what I\'m defending truly worth the energy I am giving it?"',
    siddhaDo:['Offer red flowers to Murugan or Hanuman today — Tuesday is their sacred day in Tamil Siddha tradition','Chant the Hanuman Chalisa for protection of your family — Mars and Hanuman together create an invincible shield'],
    siddhaInsight:'In Tamil Siddha tradition, Tuesday is the day of Lord Murugan — the divine warrior who defeats all inner demons. When we face our fears on Tuesday, Murugan\'s shakti supports us.' },
  3: { planet:'Mercury', sym:'☿', color:'#10B981', varName:'Budhavāra',
    theme:'Communication, Learning & Commerce',
    planetDesc:'Wednesday belongs to Mercury — the planet of intellect, communication, and commerce. His energy is quick, curious, and versatile. The best day for study, writing, business, and all forms of communication.',
    doItems:['Write — journal, emails, creative writing, or letters. Mercury blesses the written word today','Study or learn something new — Mercury loves curious minds','Handle business matters, negotiations, and contracts today','Organise your thoughts, clear your inbox, and communicate clearly'],
    avoidItems:['Avoid gossip and speaking unkindly — Mercury amplifies words both positive and negative','Do not sign contracts without reading every line — Mercury\'s energy makes us move too fast','Avoid scattered thinking — Mercury can make the mind jump between too many things'],
    reflection:'"What truth have I been unable to express clearly — and what would it feel like to say it with love and confidence?"',
    mantra:'Om Budhaya Namah',
    pranaDo:['If Mercury rules your ascendant (Gemini or Virgo rising), Wednesday is your most powerful day for all mental work','Strong Mercury in your chart means today is ideal for negotiations — you will find the right words naturally'],
    pranaAvoid:['If Mercury is retrograde in your natal chart, Wednesdays can bring communication mix-ups — double-check all messages before sending'],
    pranaReflection:'"Am I using my words to create or to destroy — and what one conversation could I have today that would bring more clarity and love?"',
    siddhaDo:['Write your intentions on paper with green ink today — Mercury\'s colour activates the intention through his frequency','Recite the Vishnu Sahasranama or any 1000-name hymn — Mercury rules recitation and these create powerful neural pathways'],
    siddhaInsight:'The Siddhas considered Mercury the planet of Mantra Vidya — the science of sacred sound. Wednesday is therefore the most powerful day for mantra practice of any kind.' },
  4: { planet:'Jupiter', sym:'♃', color:'#FBBF24', varName:'Guruvāra',
    theme:'Wisdom, Grace, Dharma & Abundance',
    planetDesc:'Thursday belongs to Jupiter — the Guru planet, bringer of wisdom, grace, and abundance. His energy is expansive, generous, and deeply spiritual. The most auspicious day of the week for prayer, teaching, and receiving blessings.',
    doItems:['Visit a temple, church, mosque, or sacred space — Thursday is the most auspicious day for this','Give generously — to charity, to family, to strangers. Jupiter multiplies what you give today','Wear yellow or gold — Jupiter\'s colours. Eat yellow foods: turmeric, bananas, yellow lentils','Begin spiritual studies or any form of learning — Jupiter is the Guru of all Gurus'],
    avoidItems:['Avoid wastefulness and excess — Jupiter\'s energy can make us overindulge','Do not disrespect teachers, elders, or wisdom traditions today — Jupiter becomes inauspicious when we are arrogant','Avoid legal disputes — reserve these for Mercury\'s day (Wednesday)'],
    reflection:'"What is the universe trying to teach me through my current life challenges — and can I receive this lesson as a gift from my Guru?"',
    mantra:'Om Gurave Namaha',
    pranaDo:['If Jupiter rules your ascendant (Sagittarius or Pisces rising), Thursday is your most auspicious day of the entire year — make it sacred','Jupiter\'s transit through your chart determines your biggest growth windows — check which house he is in for maximum benefit today'],
    pranaAvoid:['If Jupiter is afflicted by Rahu or Saturn in your natal chart, guard against overexpansion, false teachers, and blind optimism on Thursdays'],
    pranaReflection:'"Where is Jupiter calling me to expand beyond my comfort zone — and what belief about my own unworthiness is holding me back from receiving more?"',
    siddhaDo:['Perform Guru Puja today — light a yellow candle, offer turmeric, and silently thank all teachers who have shaped your path','The Brihaspati Stotra chanted on Thursday morning is one of the most powerful abundance activations in the Vedic tradition'],
    siddhaInsight:'The 18 Siddhas held Thursday as the most sacred day — it is the day to receive transmission from the Guru lineage. When you sit in meditation on Thursday morning, the gates of the Akashic lineage are most open.' },
  5: { planet:'Venus', sym:'♀', color:'#EC4899', varName:'Shukravāra',
    theme:'Love, Beauty, Harmony & Abundance',
    planetDesc:'Friday belongs to Venus — the goddess of love, beauty, arts, and abundance. Her energy is magnetic, creative, and deeply feminine. The perfect day for all heart-centred activities, creative expression, and receiving blessings of love and prosperity.',
    doItems:['Call someone you love — a mother, sister, friend, or partner. Venus blesses these connections','Create something beautiful — cooking, art, music, flowers, decorating your altar','Wear pink, white, or pastel colours today — Venus\'s colours attract love and beauty','Offer fresh flowers to your deity or altar — Venus loves floral offerings'],
    avoidItems:['Avoid arguments with loved ones — Venus magnifies emotional hurt today','Do not start legal matters or sign confrontational contracts','Avoid buying iron, weapons, or heavy machinery — Venus and iron are not harmonious'],
    reflection:'"Where in my life am I withholding love — from myself or from others — and what would it feel like to soften and open there?"',
    mantra:'Om Shum Shukraya Namah',
    pranaDo:['If Venus rules your ascendant (Taurus or Libra rising), Friday is your most magnetic day — wear your best and show up fully','Your Venus house in the natal chart reveals where today\'s blessings will arrive — love, creativity, or material abundance'],
    pranaAvoid:['If Venus is afflicted by Saturn in your chart, Fridays can bring longing and lack — focus on self-love practices rather than seeking from others'],
    pranaReflection:'"What would I create, love, or express if I truly believed I deserved to receive as much love as I give?"',
    siddhaDo:['Perform a Lakshmi puja between 2–4 PM on Friday — Venus Hora in the afternoon is the most powerful wealth window of the week','Begin a 40-day Venus sadhana on any Friday — chant Om Shum Shukraya Namah 108x at sunrise for 40 days for transformation in love and abundance'],
    siddhaInsight:'In Tamil Siddha tradition, Friday is the day of the Divine Mother — Shakti herself. All creative force, beauty, and abundance flows from her. When we honour beauty today, we are worshipping the Goddess.' },
  6: { planet:'Saturn', sym:'♄', color:'#6366F1', varName:'Shanivāra',
    theme:'Karma, Discipline, Mastery & Justice',
    planetDesc:'Saturday belongs to Saturn — the great karmic teacher, planet of discipline, longevity, and justice. His energy is slow, steady, and deeply purifying. A day for honest self-reflection, service to others, and working through karmic patterns with acceptance.',
    doItems:['Serve others — volunteer, help the poor, feed the hungry. Saturn\'s karma clears through selfless service','Face something you have been avoiding — Saturn respects those who meet challenges directly','Practice simplicity today — eat simple food, wear simple clothes, reduce excess','Do deep cleaning or organising — Saturn loves order and structure'],
    avoidItems:['Avoid shortcuts and dishonest actions — Saturn sees everything and will return what we send out','Do not skip responsibilities or ignore duties — Saturday is not for avoidance','Avoid wearing black if you have a Saturn affliction — it can intensify heaviness'],
    reflection:'"What karmic pattern keeps repeating in my life — and what responsibility am I being asked to fully own and transform?"',
    mantra:'Om Sham Shanaye Namah',
    pranaDo:['If Saturn is your ascendant ruler (Capricorn or Aquarius rising), Saturday is your day of power — commit to long-term work','Check if you are in Sade Sati (7.5 years of Saturn over your Moon) — if so, Saturday self-care is essential protection'],
    pranaAvoid:['Saturn Mahadasha or Antardasha makes Saturdays particularly intense — extra rest, service, and patience are your allies'],
    pranaReflection:'"Where am I resisting the discipline that would actually set me free — and what would change if I embraced it with joy instead of effort?"',
    siddhaDo:['Oil your body with sesame oil (Saturn\'s oil) before bathing on Saturday — this is one of the most ancient Vedic Saturn remedies','Feed black sesame seeds or black lentils to birds or the poor on Saturday — this directly reduces Saturn\'s karmic load in your chart'],
    siddhaInsight:'The Siddhas teach that Saturn is not our enemy — he is our most honest Guru. Every limitation he creates is an invitation to mastery. When we stop resisting and start serving, Saturn transforms from obstacle into blessing.' },
};

interface DailyKarmaGuideProps {
  membershipTier: string;
  isAdmin: boolean;
  activeMaha: { planet: string; start: string; end: string; years: number } | null;
  activeAntar: { planet: string; start: string; end: string } | null;
  moonNakshatra: string | null;
  navigate: (path: string) => void;
}

const DailyKarmaGuide: React.FC<DailyKarmaGuideProps> = ({
  membershipTier, isAdmin, activeMaha, activeAntar, moonNakshatra, navigate
}) => {
  const today = new Date();
  const wd = today.getDay();
  const data = WEEKDAY_KARMA[wd];
  const canPrana = isAdmin || ['prana-flow','prana-flow-monthly','siddha-quantum','akasha-infinity','admin'].includes(membershipTier);
  const canSiddha = isAdmin || ['siddha-quantum','akasha-infinity','admin'].includes(membershipTier);
  const canAkasha = isAdmin || ['akasha-infinity','admin'].includes(membershipTier);

  const gs: React.CSSProperties = {
    background:'rgba(255,255,255,0.02)', backdropFilter:'blur(40px)',
    WebkitBackdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:20,
  };

  return (
    <div style={{ marginBottom:24 }}>
      {/* Section header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)' }}>
          Your Daily Karma Guide
        </div>
        <div style={{ flex:1, height:1, background:'rgba(212,175,55,0.1)' }} />
      </div>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontStyle:'italic', marginBottom:14, lineHeight:1.5 }}>
        Every day the universe sends you specific guidance. These cards show what to embrace, what to release, and where to reflect — based on today's cosmic energy.
      </p>

      {/* Today's planet banner */}
      <div style={{ background:`rgba(${hexToRgbStr(data.color)},0.07)`, border:`1px solid rgba(${hexToRgbStr(data.color)},0.25)`, borderRadius:24, padding:'18px', marginBottom:12, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, background:`radial-gradient(circle, rgba(${hexToRgbStr(data.color)},0.12) 0%, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ width:50, height:50, borderRadius:25, border:`1px solid rgba(${hexToRgbStr(data.color)},0.4)`, background:`rgba(${hexToRgbStr(data.color)},0.1)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
            {data.sym}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginBottom:3 }}>Today is ruled by</div>
            <div style={{ fontSize:19, fontWeight:900, color:data.color, marginBottom:2 }}>{data.planet} — {data.varName}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>{data.theme}</div>
          </div>
        </div>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.7, fontFamily:'Georgia,serif', marginBottom:12 }}>{data.planetDesc}</p>
        <div style={{ padding:'9px 14px', borderRadius:12, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', textAlign:'center' }}>
          <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.45)', marginBottom:3 }}>Today's Mantra — Chant 108 times</div>
          <div style={{ fontSize:13, color:'#D4AF37', fontStyle:'italic', fontFamily:'Georgia,serif' }}>{data.mantra}</div>
        </div>
      </div>

      {/* DO card */}
      <div style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:20, padding:'18px', marginBottom:10 }}>
        <div style={{ fontSize:22, marginBottom:6 }}>✅</div>
        <div style={{ fontSize:13, fontWeight:900, color:'#4ADE80', marginBottom:6 }}>Today — Embrace & Do</div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {data.doItems.map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flexShrink:0, width:20, height:20, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, marginTop:1 }}>✓</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AVOID card */}
      <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:20, padding:'18px', marginBottom:10 }}>
        <div style={{ fontSize:22, marginBottom:6 }}>🚫</div>
        <div style={{ fontSize:13, fontWeight:900, color:'#F87171', marginBottom:6 }}>Today — Release & Avoid</div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {data.avoidItems.map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flexShrink:0, width:20, height:20, borderRadius:'50%', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#F87171', marginTop:1 }}>✗</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* REFLECTION card */}
      <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.18)', borderRadius:20, padding:'18px', marginBottom:14 }}>
        <div style={{ fontSize:22, marginBottom:6 }}>🪞</div>
        <div style={{ fontSize:13, fontWeight:900, color:'#D4AF37', marginBottom:8 }}>Today's Karma Mirror</div>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:10, lineHeight:1.5 }}>Sit quietly for 5 minutes and ask yourself this question. Write your answer in a journal.</p>
        <div style={{ background:'rgba(212,175,55,0.07)', borderRadius:14, padding:'14px 16px', borderLeft:'3px solid rgba(212,175,55,0.4)' }}>
          <p style={{ fontSize:13, color:'#D4AF37', fontFamily:'Georgia,serif', fontStyle:'italic', lineHeight:1.7 }}>{data.reflection}</p>
        </div>
      </div>

      {/* PRANA tier — personalised Dasha karma */}
      {canPrana && activeMaha && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(34,211,238,0.6)' }}>🔥 Your Personal Chart — Prāna Reading</div>
            <div style={{ flex:1, height:1, background:'rgba(34,211,238,0.1)' }} />
          </div>
          {/* Dasha context */}
          <div style={{ ...gs, padding:'16px 18px', marginBottom:10, borderColor:'rgba(212,175,55,0.18)' }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:8 }}>Your Current Karmic Chapter</div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.22)', marginBottom:3 }}>Main Period</div>
                <div style={{ fontSize:18, fontWeight:900, color:'#D4AF37' }}>{activeMaha.planet} {PLANET_INFO[activeMaha.planet]?.sym}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{activeMaha.start} — {activeMaha.end}</div>
              </div>
              {activeAntar && (
                <div style={{ flex:1, paddingLeft:12, borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.22)', marginBottom:3 }}>Sub-Period</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{activeAntar.planet} {PLANET_INFO[activeAntar.planet]?.sym}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{activeAntar.start} — {activeAntar.end}</div>
                </div>
              )}
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.65, marginTop:10, fontFamily:'Georgia,serif' }}>
              <strong style={{ color:'#D4AF37' }}>{activeMaha.planet} Mahadasha</strong>{activeAntar ? ` / ${activeAntar.planet} Antardasha` : ''}: {DASHA_MEANINGS[activeMaha.planet] || 'This period brings the specific karmic curriculum of this planet into focus.'}
            </p>
          </div>
          {/* Personalised do */}
          <div style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:20, padding:'16px', marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:900, color:'#4ADE80', marginBottom:8 }}>✨ Personalised Actions — Your Dasha Says</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {data.pranaDo.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                  <div style={{ flexShrink:0, width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, marginTop:2 }}>♃</div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Prana reflection */}
          <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:20, padding:'16px', marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:900, color:'#D4AF37', marginBottom:8 }}>🔮 Your Dasha Soul Question</div>
            <div style={{ background:'rgba(212,175,55,0.06)', borderRadius:12, padding:'13px 15px', borderLeft:'3px solid rgba(212,175,55,0.35)' }}>
              <p style={{ fontSize:13, color:'#D4AF37', fontFamily:'Georgia,serif', fontStyle:'italic', lineHeight:1.7 }}>{data.pranaReflection}</p>
            </div>
          </div>
        </>
      )}

      {/* SIDDHA tier */}
      {canSiddha && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.7)' }}>⭐ Siddha-Level Activation</div>
            <div style={{ flex:1, height:1, background:'rgba(212,175,55,0.12)' }} />
          </div>
          <div style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:20, padding:'18px', marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:900, color:'#D4AF37', marginBottom:10 }}>⭐ Siddha Sadhana — Advanced Practices</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {data.siddhaDo.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                  <div style={{ flexShrink:0, width:18, height:18, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#D4AF37', marginTop:2 }}>★</div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...gs, padding:'16px 18px', marginBottom:14, borderColor:'rgba(212,175,55,0.12)' }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:6 }}>Siddha Wisdom — Today's Teaching</div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.7, fontFamily:'Georgia,serif', fontStyle:'italic' }}>{data.siddhaInsight}</p>
          </div>
        </>
      )}

      {/* AKASHA tier */}
      {canAkasha && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.5)' }}>∞ Ākāsha — Nadi Oracle Transmission</div>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
          </div>
          <div style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.22)', borderRadius:20, padding:'18px', marginBottom:14 }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(139,92,246,0.7)', marginBottom:8 }}>📜 Akashic Transmission — {data.varName}</div>
            <div style={{ position:'relative', padding:'14px 16px', background:'rgba(139,92,246,0.04)', borderRadius:14, border:'1px solid rgba(139,92,246,0.12)' }}>
              <div style={{ position:'absolute', top:-10, left:12, fontSize:50, fontFamily:'Georgia,serif', color:'rgba(139,92,246,0.1)', lineHeight:1 }}>"</div>
              <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.75, position:'relative' }}>
                The soul reading these words is in alignment with the {data.planet} frequency today. The lessons of {activeMaha?.planet || 'this period'} are preparing you for an expansion that your mind cannot yet fully comprehend. Trust the process unfolding in your life. What appears as obstacle is initiation. What appears as loss is clearing space for what your soul truly called for. Today, receive — do not just give.
              </p>
              <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(139,92,246,0.4)', marginTop:10 }}>
                — Akasha-Neural Archive · Bhrigu Transmission 2050→2026
              </div>
            </div>
          </div>
        </>
      )}

      {/* Unlock nudges for lower tiers */}
      {!canPrana && (
        <div style={{ ...gs, padding:'18px', borderColor:'rgba(34,211,238,0.15)', textAlign:'center', marginBottom:14 }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(34,211,238,0.6)', marginBottom:8 }}>🔱 Unlock Personalised Guidance</div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.65, marginBottom:12 }}>
            Upgrade to <strong style={{ color:'#22D3EE' }}>Prāna-Flow (€19/mo)</strong> to receive daily karma cards personalised to your exact birth chart, Dasha timing, and Nakshatra soul blueprint.
          </p>
          <button onClick={() => navigate('/membership')} style={{ padding:'10px 22px', borderRadius:99, border:'1px solid rgba(34,211,238,0.3)', background:'rgba(34,211,238,0.08)', color:'#22D3EE', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer' }}>
            Activate Prāna-Flow →
          </button>
        </div>
      )}
      {canPrana && !canSiddha && (
        <div style={{ ...gs, padding:'14px 16px', borderColor:'rgba(212,175,55,0.12)', textAlign:'center', marginBottom:14 }}>
          <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:6 }}>⭐ Unlock Siddha-Level Sadhana</div>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.55, marginBottom:10 }}>Upgrade to <strong style={{ color:'#D4AF37' }}>Siddha-Quantum (€45/mo)</strong> for advanced Siddha practices, ancient wisdom transmissions, and Akashic oracle access.</p>
          <button onClick={() => navigate('/membership')} style={{ padding:'9px 18px', borderRadius:99, border:'1px solid rgba(212,175,55,0.25)', background:'rgba(212,175,55,0.06)', color:'#D4AF37', fontFamily:'inherit', fontSize:8, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, cursor:'pointer' }}>
            Upgrade to Siddha-Quantum →
          </button>
        </div>
      )}
    </div>
  );
};

// ── DAILY INFLUENCE STRIP ──────────────────────────────────────────────────────
const GRAHA_DAILY_DATA: Array<{
  name: string; sym: string; element: string; color: string;
  dayRule: number | null;
  quality: string; avoidQuality: string; mantra: string;
  doKeyword: string; avoidKeyword: string;
}> = [
  { name:'Sun', sym:'☉', element:'Fire · Agni', color:'#F59E0B', dayRule:0,
    quality:'Authority, Clarity, Soul Power, Leadership', avoidQuality:'Ego conflict, excessive heat, pride',
    mantra:'Om Hrim Suryaya Namah', doKeyword:'Lead · Create · Illuminate', avoidKeyword:'Control · Conflict' },
  { name:'Moon', sym:'☽', element:'Water · Jala', color:'#94A3B8', dayRule:1,
    quality:'Intuition, Emotion, Nourishment, Healing', avoidQuality:'Over-sensitivity, instability, fear',
    mantra:'Om Shrim Chandramase Namah', doKeyword:'Feel · Nurture · Flow', avoidKeyword:'React · Scatter' },
  { name:'Mars', sym:'♂', element:'Fire · Tejas', color:'#EF4444', dayRule:2,
    quality:'Courage, Action, Decisive Energy, Protection', avoidQuality:'Aggression, impulsiveness, anger',
    mantra:'Om Krim Mangalaya Namah', doKeyword:'Act · Protect · Build', avoidKeyword:'Force · Argue' },
  { name:'Mercury', sym:'☿', element:'Earth · Prithvi', color:'#10B981', dayRule:3,
    quality:'Intellect, Communication, Commerce, Wit', avoidQuality:'Overthinking, duplicity, gossip',
    mantra:'Om Budhaya Namah', doKeyword:'Communicate · Learn · Trade', avoidKeyword:'Scatter · Overthink' },
  { name:'Jupiter', sym:'♃', element:'Ether · Akasha', color:'#F59E0B', dayRule:4,
    quality:'Wisdom, Expansion, Grace, Dharma, Abundance', avoidQuality:'Over-indulgence, preaching, excess',
    mantra:'Om Gurave Namaha', doKeyword:'Expand · Bless · Teach', avoidKeyword:'Waste · Overextend' },
  { name:'Venus', sym:'♀', element:'Water · Jala', color:'#EC4899', dayRule:5,
    quality:'Love, Beauty, Harmony, Abundance, Arts', avoidQuality:'Attachment, sensual excess, vanity',
    mantra:'Om Shum Shukraya Namah', doKeyword:'Create · Love · Beautify', avoidKeyword:'Indulge · Cling' },
  { name:'Saturn', sym:'♄', element:'Air · Vayu', color:'#6366F1', dayRule:6,
    quality:'Discipline, Karma, Mastery, Longevity, Justice', avoidQuality:'Rigidity, fear, procrastination, delay',
    mantra:'Om Sham Shanaye Namah', doKeyword:'Commit · Discipline · Endure', avoidKeyword:'Rush · Resist' },
  { name:'Rahu', sym:'☊', element:'Smoke · Maya', color:'#8B5CF6', dayRule:null,
    quality:'Transformation, Innovation, Foreign, Amplification', avoidQuality:'Illusion, addiction, obsession',
    mantra:'Om Ram Rahave Namah', doKeyword:'Innovate · Dare · Transform', avoidKeyword:'Fixate · Deceive' },
  { name:'Ketu', sym:'☋', element:'Fire · Moksha', color:'#D97706', dayRule:null,
    quality:'Liberation, Spiritual Insight, Intuition, Past Mastery', avoidQuality:'Confusion, withdrawal, detachment',
    mantra:'Om Kem Ketave Namah', doKeyword:'Meditate · Release · Purify', avoidKeyword:'Isolate · Scatter' },
];

function hexToRgbStr(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2), 16);
  const g2 = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  return `${r},${g2},${b}`;
}

function getPanchangaData() {
  const now = new Date();
  const weekday = now.getDay();
  const VARA_MAP: Record<number, { name: string; planet: string; sym: string; color: string }> = {
    0: { name:'Ravivāra', planet:'Sun', sym:'☉', color:'#F59E0B' },
    1: { name:'Somavāra', planet:'Moon', sym:'☽', color:'#94A3B8' },
    2: { name:'Mangalavāra', planet:'Mars', sym:'♂', color:'#EF4444' },
    3: { name:'Budhavāra', planet:'Mercury', sym:'☿', color:'#10B981' },
    4: { name:'Guruvāra', planet:'Jupiter', sym:'♃', color:'#FBBF24' },
    5: { name:'Shukravāra', planet:'Venus', sym:'♀', color:'#EC4899' },
    6: { name:'Shanivāra', planet:'Saturn', sym:'♄', color:'#6366F1' },
  };
  const knownNewMoon = new Date('2024-01-11').getTime();
  const daysSince = (now.getTime() - knownNewMoon) / 86400000;
  const lunarDay = Math.floor(daysSince % 29.53) + 1;
  const tithiNames = ['Pratipada','Dvitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dvadashi','Trayodashi','Chaturdashi','Purnima'];
  const tithiIdx = Math.min((lunarDay - 1) % 15, 14);
  const paksha = lunarDay <= 15 ? 'Shukla (Waxing)' : 'Krishna (Waning)';
  const horaSeq = ['Sun','Venus','Mercury','Moon','Saturn','Jupiter','Mars'];
  const dayPlanetStart: Record<number,number> = {0:0, 1:2, 2:4, 3:6, 4:1, 5:3, 6:5};
  const horaOffset = Math.floor(((now.getHours() - 6 + 24) % 24));
  const currentHora = horaSeq[(dayPlanetStart[weekday] + horaOffset) % 7];
  const rahuSlots: Record<number,number> = {0:7, 1:1, 2:6, 3:4, 4:5, 5:2, 6:3};
  const slot = rahuSlots[weekday];
  const rStart = 6 + slot * 1.5;
  const rEnd = rStart + 1.5;
  const fmt = (h: number) => `${Math.floor(h)}:${h % 1 === 0.5 ? '30' : '00'}`;
  const isRahuKala = now.getHours() >= rStart && now.getHours() < rEnd;
  return {
    vara: VARA_MAP[weekday], weekday,
    tithiName: tithiNames[tithiIdx], paksha, lunarDay,
    currentHora, rahuKala: `${fmt(rStart)}–${fmt(rEnd)}`, isRahuKala
  };
}

const DailyInfluenceStrip: React.FC = () => {
  const panchanga = getPanchangaData();
  const today = new Date();
  const [expandedGraha, setExpandedGraha] = React.useState<string | null>(null);

  const gs: React.CSSProperties = {
    background:'rgba(255,255,255,0.02)',
    backdropFilter:'blur(40px)',
    WebkitBackdropFilter:'blur(40px)',
    border:'1px solid rgba(255,255,255,0.05)',
    borderRadius:16,
  };
  const gm: React.CSSProperties = {
    background:'rgba(255,255,255,0.03)',
    backdropFilter:'blur(40px)',
    WebkitBackdropFilter:'blur(40px)',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:20,
  };

  const todayGraha = GRAHA_DAILY_DATA.find(g => g.dayRule === panchanga.weekday);

  return (
    <div style={{ marginBottom:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)' }}>
          Today\'s Cosmic Intelligence · {today.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
        </div>
        <div style={{ flex:1, height:1, background:'rgba(212,175,55,0.1)' }} />
        {panchanga.isRahuKala && (
          <div style={{ padding:'3px 10px', borderRadius:99, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', fontSize:6, fontWeight:800, letterSpacing:'0.3em', color:'rgba(239,68,68,0.8)' }}>
            ⚠ RĀHU KĀLA
          </div>
        )}
      </div>

      {/* Panchanga 5-tile strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:14 }}>
        {[
          { lbl:'Vāra', val:`${panchanga.vara.sym} ${panchanga.vara.planet}`, sub:panchanga.vara.name, color:panchanga.vara.color },
          { lbl:'Tithi', val:panchanga.tithiName, sub:`Day ${panchanga.lunarDay}`, color:'#D4AF37' },
          { lbl:'Paksha', val:panchanga.paksha.split(' ')[0], sub:panchanga.paksha.split('(')[1]?.replace(')','') || '', color:'#94A3B8' },
          { lbl:'Hora Now', val:panchanga.currentHora, sub:'Planetary Hour', color:'#22D3EE' },
          { lbl:'Rāhu Kāla', val:panchanga.rahuKala, sub:panchanga.isRahuKala ? '⚠ Active Now' : 'Avoid New Starts', color:panchanga.isRahuKala ? '#EF4444' : 'rgba(255,255,255,0.3)' },
        ].map(s => (
          <div key={s.lbl} style={{ ...gs, padding:'10px 6px', textAlign:'center' }}>
            <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.2)', marginBottom:4 }}>{s.lbl}</div>
            <div style={{ fontSize:9, fontWeight:900, color:s.color, lineHeight:1.2, marginBottom:2 }}>{s.val}</div>
            <div style={{ fontSize:7, color:'rgba(255,255,255,0.25)', lineHeight:1.3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Today\'s Ruling Planet Banner */}
      {todayGraha && (
        <div style={{ ...gm, padding:'16px 18px', marginBottom:14, borderColor:`rgba(${hexToRgbStr(todayGraha.color)},0.2)`, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, right:0, width:90, height:90, background:`radial-gradient(circle, ${todayGraha.color}12 0%, transparent 70%)`, pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ width:46, height:46, borderRadius:23, border:`1px solid ${todayGraha.color}40`, background:`${todayGraha.color}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
              {todayGraha.sym}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginBottom:3 }}>Today\'s Ruling Graha</div>
              <div style={{ fontSize:17, fontWeight:900, color:todayGraha.color, marginBottom:3 }}>{todayGraha.name} — {panchanga.vara.name}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{todayGraha.quality}</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div style={{ ...gs, padding:'8px 12px', borderRadius:12 }}>
              <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(34,211,238,0.6)', marginBottom:3 }}>✓ Activate</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontStyle:'italic' }}>{todayGraha.doKeyword}</div>
            </div>
            <div style={{ ...gs, padding:'8px 12px', borderRadius:12 }}>
              <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(239,68,68,0.6)', marginBottom:3 }}>◎ Avoid</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontStyle:'italic' }}>{todayGraha.avoidKeyword}</div>
            </div>
          </div>
          <div style={{ padding:'8px 14px', borderRadius:10, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', textAlign:'center', fontSize:11, color:'rgba(212,175,55,0.75)', fontStyle:'italic' }}>
            🕉 {todayGraha.mantra}
          </div>
        </div>
      )}

      {/* 9 Graha Cards — horizontal scroll */}
      <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginBottom:8 }}>
        Navagraha Daily Transmissions · Tap to Open
      </div>
      <div style={{ display:'flex', gap:7, overflowX:'auto', paddingBottom:6, scrollbarWidth:'none' as const, marginBottom:8, WebkitOverflowScrolling:'touch' as const }}>
        {GRAHA_DAILY_DATA.map(g => {
          const isToday = g.dayRule === panchanga.weekday;
          const isExpanded = expandedGraha === g.name;
          return (
            <div key={g.name}
              onClick={() => setExpandedGraha(isExpanded ? null : g.name)}
              style={{ flexShrink:0, width:90, padding:'12px 8px', borderRadius:16,
                border:`1px solid ${isToday ? g.color + '55' : (isExpanded ? g.color + '30' : 'rgba(255,255,255,0.06)')}`,
                background: isToday ? `${g.color}10` : (isExpanded ? `${g.color}08` : 'rgba(255,255,255,0.02)'),
                cursor:'pointer', textAlign:'center', position:'relative', transition:'all 0.18s' }}>
              {isToday && (
                <div style={{ position:'absolute', top:6, right:6, width:5, height:5, borderRadius:'50%', background:g.color, boxShadow:`0 0 6px ${g.color}` }} />
              )}
              <div style={{ fontSize:22, marginBottom:4 }}>{g.sym}</div>
              <div style={{ fontSize:9, fontWeight:900, color: isToday ? g.color : 'rgba(255,255,255,0.7)', marginBottom:2 }}>{g.name}</div>
              <div style={{ fontSize:7, color:'rgba(255,255,255,0.28)', lineHeight:1.3 }}>{g.element.split(' ')[0]}</div>
              {isToday && <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, color:g.color, marginTop:4 }}>TODAY ●</div>}
            </div>
          );
        })}
      </div>

      {/* Expanded Detail Card */}
      {expandedGraha && (() => {
        const g = GRAHA_DAILY_DATA.find(x => x.name === expandedGraha)!;
        if (!g) return null;
        return (
          <div style={{ ...gm, padding:'18px', marginTop:4, borderColor:`${g.color}25`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:110, height:110, background:`radial-gradient(circle, ${g.color}0d 0%, transparent 70%)`, pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{ fontSize:28 }}>{g.sym}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginBottom:2 }}>{g.element} Intelligence</div>
                <div style={{ fontSize:16, fontWeight:900, color:g.color }}>{g.name} — Daily Influence</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setExpandedGraha(null); }}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:20, padding:4 }}>×</button>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.65, marginBottom:12 }}>{g.quality}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div style={{ ...gs, padding:'10px 12px', borderRadius:12 }}>
                <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(34,211,238,0.6)', marginBottom:4 }}>✓ Do Today</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontStyle:'italic' }}>{g.doKeyword}</div>
              </div>
              <div style={{ ...gs, padding:'10px 12px', borderRadius:12 }}>
                <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(239,68,68,0.6)', marginBottom:4 }}>✗ Avoid</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontStyle:'italic' }}>{g.avoidQuality}</div>
              </div>
            </div>
            <div style={{ padding:'9px 14px', borderRadius:12, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', textAlign:'center' }}>
              <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.45)', marginBottom:3 }}>Beej Mantra — Chant 108x</div>
              <div style={{ fontSize:12, color:'#D4AF37', fontStyle:'italic' }}>{g.mantra}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ── Sade Sati Tracker ────────────────────────────────────────────
interface SadeSatiProps { moonSign: string | null; activeMaha: { planet: string; start: string; end: string } | null; }
const SadeSatiTracker: React.FC<SadeSatiProps> = ({ moonSign, activeMaha }) => {
  const G = 'rgba(212,175,55,';
  const W = 'rgba(255,255,255,';
  // Saturn transits ~2.5 yrs per sign; Sade Sati = 7.5 yrs covering 3 signs
  const SADE_SATI_DATA: Record<string, { active: boolean; phase: number; start: string; end: string; phases: {sign:string;start:string;end:string;done:boolean;active:boolean}[] }> = {
    Taurus:  { active:true,  phase:2, start:'Jan 2020', end:'Jun 2027', phases:[{sign:'Aries',start:'Jan 2020',end:'Jan 2023',done:true,active:false},{sign:'Taurus',start:'Jan 2023',end:'Mar 2025',done:false,active:true},{sign:'Gemini',start:'Mar 2025',end:'Jun 2027',done:false,active:false}] },
    Gemini:  { active:true,  phase:1, start:'Jan 2023', end:'Oct 2029', phases:[{sign:'Taurus',start:'Jan 2023',end:'Mar 2025',done:false,active:true},{sign:'Gemini',start:'Mar 2025',end:'Jun 2027',done:false,active:false},{sign:'Cancer',start:'Jun 2027',end:'Oct 2029',done:false,active:false}] },
    Cancer:  { active:false, phase:0, start:'Jun 2027', end:'Nov 2034', phases:[{sign:'Gemini',start:'Jun 2027',end:'Oct 2029',done:false,active:false},{sign:'Cancer',start:'Oct 2029',end:'Jan 2032',done:false,active:false},{sign:'Leo',start:'Jan 2032',end:'Nov 2034',done:false,active:false}] },
    Scorpio: { active:true,  phase:2, start:'Oct 2017', end:'Jan 2023', phases:[{sign:'Libra',start:'Oct 2017',end:'Oct 2020',done:true,active:false},{sign:'Scorpio',start:'Oct 2020',end:'Jan 2023',done:true,active:true},{sign:'Sagittarius',start:'Jan 2023',end:'Mar 2025',done:false,active:false}] },
  };
  const sign = moonSign?.split(' ').pop() || '';
  const data = SADE_SATI_DATA[sign];
  const REMEDIES = [
    'Chant Om Prām Prīm Prauṃ Sah Śanaiścharāya Namaḥ 108x every Saturday at sunrise',
    'Offer sesame oil to a Shani lamp on Saturday evening — directly reduces karmic load',
    'Feed black sesame or black lentils to birds or the poor on Saturday',
    'Practice Hanuman Chalisa daily — Hanuman governs Saturn\'s effects at the soul level',
    'Wear blue sapphire only after consulting a qualified Jyotishi — powerful and can backfire',
  ];
  if (!moonSign) return <p style={{ fontSize:12, color:`${W}0.35)`, textAlign:'center', padding:'16px 0', fontStyle:'italic' }}>Enter birth data to calculate Sade Sati status</p>;
  return (
    <div>
      {data ? (
        <>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, background: data.active ? 'rgba(245,158,11,0.08)' : 'rgba(74,222,128,0.06)', border: `1px solid ${data.active ? 'rgba(245,158,11,0.3)' : 'rgba(74,222,128,0.25)'}`, color: data.active ? '#F59E0B' : '#4ADE80', fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, marginBottom:12 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: data.active ? '#F59E0B' : '#4ADE80', boxShadow: data.active ? '0 0 8px #F59E0B' : 'none' }}/>
            {data.active ? `SADE SATI ACTIVE — Phase ${data.phase} of 3` : 'SADE SATI NOT ACTIVE'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:12 }}>
            {[{ l:'Moon Sign', v: moonSign.split(' ').pop()||'—' },{ l:'Period', v:`${data.start}–${data.end}` }].map(s => (
              <div key={s.l} style={{ background:`${W}0.02)`, border:`1px solid ${W}0.06)`, borderRadius:12, padding:'10px 12px' }}>
                <div style={{ fontSize:6.5, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:`${W}0.25)`, marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:12, fontWeight:900, color:'#D4AF37', lineHeight:1 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
            {data.phases.map((p, i) => (
              <div key={i} style={{ padding:'10px 13px', borderRadius:12, border:`1px solid ${p.active ? 'rgba(245,158,11,0.3)' : p.done ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.05)'}`, background: p.active ? 'rgba(245,158,11,0.06)' : p.done ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.01)', display:'flex', alignItems:'center', gap:10, opacity: p.done && !p.active ? 0.5 : 1 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: p.active ? '#F59E0B' : p.done ? 'rgba(107,114,128,0.5)' : 'rgba(255,255,255,0.1)', boxShadow: p.active ? '0 0 8px #F59E0B' : 'none', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10.5, fontWeight:800, color: p.active ? '#F59E0B' : `${W}0.55)`, marginBottom:1 }}>Phase {i+1} — {p.sign}</div>
                  <div style={{ fontSize:9, color:`${W}0.28)` }}>{p.start} – {p.end}</div>
                </div>
                <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, color: p.active ? 'rgba(245,158,11,0.8)' : p.done ? 'rgba(107,114,128,0.6)' : `${W}0.2)` }}>
                  {p.active ? 'NOW ●' : p.done ? 'DONE ✓' : 'COMING'}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ padding:'14px 16px', border:'1px solid rgba(74,222,128,0.2)', borderRadius:14, background:'rgba(74,222,128,0.05)', marginBottom:12 }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(74,222,128,0.7)', marginBottom:5 }}>✓ SADE SATI NOT ACTIVE</div>
          <p style={{ fontSize:11.5, color:`${W}0.5)`, lineHeight:1.6 }}>Your Moon sign ({sign}) is not in a Sade Sati period currently. Saturn is not transiting the signs adjacent to or through your Moon sign.</p>
        </div>
      )}
      <div style={{ background:`${G}0.04)`, border:`1px solid ${G}0.12)`, borderRadius:13, padding:'13px 15px', position:'relative' }}>
        <div style={{ position:'absolute', top:-7, left:12, fontSize:6.5, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', background:'#050505', padding:'0 6px' }}>SIDDHA REMEDIES</div>
        <div style={{ paddingTop:4, display:'flex', flexDirection:'column', gap:8 }}>
          {REMEDIES.map((r, i) => (
            <div key={i} style={{ display:'flex', gap:9 }}>
              <div style={{ fontSize:8, fontWeight:800, color:`${G}0.5)`, flexShrink:0, marginTop:1 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize:11.5, color:`${W}0.58)`, lineHeight:1.55 }}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Mangal Dosha Checker ─────────────────────────────────────────
interface MangalDoshaProps { ascendantSign: string | null; }
const MangalDoshaChecker: React.FC<MangalDoshaProps> = ({ ascendantSign }) => {
  const W = 'rgba(255,255,255,';
  const G = 'rgba(212,175,55,';
  // In real impl this reads Mars house from ephemeris
  // For now show the logic and a placeholder result
  const DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];
  const HOUSE_MEANINGS: Record<number,string> = {
    1:'Self, personality, body — Mars here creates intense drive and confrontational nature',
    2:'Family, speech, finances — Mars here creates sharp speech and financial conflicts in marriage',
    4:'Home, mother, peace — Mars here disturbs domestic harmony',
    7:'Marriage partner — strongest Dosha, directly in the 7th house of partnership',
    8:'Longevity, hidden things — Mars here is considered the most severe placement',
    12:'Liberation, bed pleasures — Mars here affects bedroom harmony and expenditure',
  };
  const REMEDIES = [
    'Kuja Dosha Puja at a Subrahmanya (Murugan/Kartikeya) temple — Tuesdays specifically',
    'Om Krām Krīm Krauṃ Sah Bhaumāya Namaḥ — 108x on Tuesday mornings at sunrise',
    'Red coral (moonga) in gold on right ring finger — consult Jyotishi before wearing',
    'Fast on Tuesdays and eat only red-coloured foods (tomato, red lentils, apple)',
  ];
  if (!ascendantSign) return <p style={{ fontSize:12, color:`${W}0.35)`, textAlign:'center', padding:'16px 0', fontStyle:'italic' }}>Enter birth data to check Mangal Dosha</p>;
  return (
    <div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.88rem', color:`${W}0.42)`, lineHeight:1.7, marginBottom:12 }}>
        Mangal Dosha occurs when Mars (Mangal) sits in houses 1, 2, 4, 7, 8, or 12 from the Lagna, Moon, or Venus in the birth chart.
      </p>
      <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:`${G}0.45)`, marginBottom:8 }}>Dosha Houses — Where Mars Creates Intensity</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:14 }}>
        {DOSHA_HOUSES.map(h => (
          <div key={h} style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:11, padding:'10px 8px', textAlign:'center' }}>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(239,68,68,0.55)', marginBottom:3 }}>House {h}</div>
            <div style={{ fontSize:13, fontWeight:900, color:'rgba(239,68,68,0.85)' }}>♂</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
        <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.38em', textTransform:'uppercase' as const, color:'rgba(245,158,11,0.65)', marginBottom:6 }}>⚡ Exceptions That Cancel Dosha</div>
        {['Mars in own sign (Aries, Scorpio) — partially cancelled','Mars exalted in Capricorn — significantly reduced','Jupiter aspects Mars — protective influence','Mars with Venus — energies balance each other'].map((e,i) => (
          <div key={i} style={{ display:'flex', gap:8, fontSize:11, color:`${W}0.55)`, marginBottom:5, lineHeight:1.45 }}>
            <span style={{ color:'rgba(74,222,128,0.7)', flexShrink:0 }}>✓</span>{e}
          </div>
        ))}
      </div>
      <div style={{ background:`${G}0.04)`, border:`1px solid ${G}0.12)`, borderRadius:13, padding:'13px 15px', position:'relative' }}>
        <div style={{ position:'absolute', top:-7, left:12, fontSize:6.5, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', background:'#050505', padding:'0 6px' }}>SIDDHA REMEDIES</div>
        <div style={{ paddingTop:4, display:'flex', flexDirection:'column', gap:8 }}>
          {REMEDIES.map((r, i) => (
            <div key={i} style={{ display:'flex', gap:9 }}>
              <div style={{ fontSize:8, fontWeight:800, color:`${G}0.5)`, flexShrink:0, marginTop:1 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize:11.5, color:`${W}0.58)`, lineHeight:1.55 }}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Kala Sarpa Yoga ──────────────────────────────────────────────
const KalaSarpaYoga: React.FC = () => {
  const W = 'rgba(255,255,255,'; const G = 'rgba(212,175,55,';
  const TYPES = ['Ananta (H1–H7)','Kulika (H2–H8)','Vasuki (H3–H9)','Shankhapala (H4–H10)','Padma (H5–H11)','Mahapadma (H6–H12)','Takshaka (H7–H1)','Karkotak (H8–H2)','Shankhachud (H9–H3)','Ghatak (H10–H4)','Vishdhar (H11–H5)','Sheshnag (H12–H6)'];
  return (
    <div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.88rem', color:`${W}0.42)`, lineHeight:1.7, marginBottom:12 }}>
        Kala Sarpa Yoga forms when all 7 classical planets are hemmed between Rahu and Ketu. The serpent of time swallows the chart — creating intense karmic acceleration, psychic gifts, and extraordinary highs and lows.
      </p>
      <div style={{ background:'rgba(167,139,250,0.05)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
        <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.38em', textTransform:'uppercase' as const, color:'rgba(167,139,250,0.6)', marginBottom:6 }}>12 Types of Kala Sarpa Yoga</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {TYPES.map((t, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'7px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)' }}>
              <div style={{ fontSize:7.5, fontWeight:800, color:`${G}0.35)`, minWidth:20 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize:11, color:`${W}0.5)` }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:`${G}0.04)`, border:`1px solid ${G}0.12)`, borderRadius:13, padding:'13px 15px', position:'relative' }}>
        <div style={{ position:'absolute', top:-7, left:12, fontSize:6.5, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', background:'#050505', padding:'0 6px' }}>SIDDHA REMEDIES IF PRESENT</div>
        <div style={{ paddingTop:4, display:'flex', flexDirection:'column', gap:8 }}>
          {['Naga Pratishtha puja — worship serpent deities at a Naga temple (Tamil Nadu or Kerala)','Chant both Rahu and Ketu mantras every Saturday without fail','Trimbakeshwar or Kalahasti temple rituals specifically for Kala Sarpa Dosha','Wear 2-faced (Do Mukhi) rudraksha bead — connects Rahu-Ketu energies beneficially'].map((r,i) => (
            <div key={i} style={{ display:'flex', gap:9 }}>
              <div style={{ fontSize:8, fontWeight:800, color:`${G}0.5)`, flexShrink:0, marginTop:1 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize:11.5, color:`${W}0.58)`, lineHeight:1.55 }}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Muhurta Calculator ───────────────────────────────────────────
const MuhurtaCalculator: React.FC = () => {
  const [actionType, setActionType] = React.useState('business');
  const W = 'rgba(255,255,255,'; const G = 'rgba(212,175,55,';
  const ACTIONS = [
    { id:'business', icon:'💼', label:'Business' },
    { id:'marriage', icon:'💍', label:'Marriage' },
    { id:'travel',   icon:'✈️', label:'Travel'   },
    { id:'surgery',  icon:'🏥', label:'Surgery'  },
    { id:'property', icon:'🏠', label:'Property' },
    { id:'spiritual',icon:'🕉', label:'Spiritual'},
  ];
  const WINDOWS = [
    { score:92, day:'Mon 16 Jun', time:'07:12 — 09:00', name:'Guru Hora · Shukla Paksha', sub:'Jupiter hour · Moon waxing · Abhijit Muhurta nearby', color:'rgba(74,222,128,0.9)' },
    { score:88, day:'Thu 19 Jun', time:'10:24 — 12:12', name:'Jupiter Hora · Pushya Nakshatra', sub:'Pushya — most auspicious Nakshatra for new ventures', color:'#D4AF37' },
    { score:81, day:'Wed 25 Jun', time:'12:00 — 12:48', name:'Abhijit Muhurta', sub:'Universal auspicious midday window — every Wednesday', color:`${W}0.65)` },
  ];
  const FACTORS = ['Chandra Bala (Moon strength)','Tārā Bala (Birth star compatibility)','Panchānga Shuddhi (5 limbs clean)','Rāhu Kāla avoided','Good Hora active'];
  return (
    <div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.88rem', color:`${W}0.42)`, lineHeight:1.7, marginBottom:12 }}>
        Muhurta is the Vedic science of choosing the perfect moment. A properly chosen Muhurta dramatically improves the probability of success for any major life action.
      </p>
      <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:`${G}0.42)`, marginBottom:8 }}>Select Action Type</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:16 }}>
        {ACTIONS.map(a => (
          <button key={a.id} onClick={() => setActionType(a.id)} style={{ padding:'10px 6px', borderRadius:12, border:`1px solid ${actionType===a.id ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.07)'}`, background: actionType===a.id ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)', color: actionType===a.id ? '#D4AF37' : `${W}0.42)`, fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase' as const, cursor:'pointer', textAlign:'center' as const, transition:'all 0.2s' }}>
            <span style={{ display:'block', fontSize:18, marginBottom:4 }}>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.42em', textTransform:'uppercase' as const, color:`${G}0.45)`, marginBottom:10 }}>Best Muhurta Windows · Next 30 Days</div>
      <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
        {WINDOWS.map((w, i) => (
          <div key={i} style={{ background:`${W}0.02)`, border:`1px solid ${i===0 ? 'rgba(74,222,128,0.2)' : `${W}0.06)`}`, borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:900, color: w.color, marginBottom:2 }}>{w.day}</div>
              <div style={{ fontSize:9, color:`${W}0.28)` }}>{w.time}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:`${W}0.72)`, marginBottom:2 }}>{w.name}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.74rem', color:`${W}0.3)` }}>{w.sub}</div>
            </div>
            <div style={{ fontSize:12, fontWeight:900, color: w.color, flexShrink:0 }}>{w.score}%</div>
          </div>
        ))}
      </div>
      <div style={{ background:`${G}0.04)`, border:`1px solid ${G}0.12)`, borderRadius:13, padding:'12px 14px' }}>
        <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:`${G}0.45)`, marginBottom:8 }}>Muhurta Scoring Factors</div>
        {FACTORS.map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ height:3, borderRadius:99, background: i<2 ? 'rgba(74,222,128,0.7)' : i===2 ? '#D4AF37' : 'rgba(34,211,238,0.6)', width: `${90-i*12}%`, transition:'width 0.5s' }}/>
            <div style={{ fontSize:10, color:`${W}0.4)`, whiteSpace:'nowrap' as const }}>{f}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Gun Milan / Kundli Matching ──────────────────────────────────
const GunMilan: React.FC = () => {
  const [person1, setPerson1] = React.useState('Rohini');
  const [person2, setPerson2] = React.useState('Pushya');
  const W = 'rgba(255,255,255,'; const G = 'rgba(212,175,55,';
  const NAKSHATRAS = ['Ashvini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadra','Uttara Bhadra','Revati'];
  const KOOTAS = [
    { name:'Varna',       sub:'Soul evolution',          max:1, score:1,  color:'rgba(74,222,128,0.8)' },
    { name:'Vashya',      sub:'Mutual control',          max:2, score:2,  color:'rgba(74,222,128,0.8)' },
    { name:'Tara',        sub:'Birth star harmony',      max:3, score:3,  color:'rgba(74,222,128,0.8)' },
    { name:'Yoni',        sub:'Physical compatibility',  max:4, score:3,  color:'#D4AF37' },
    { name:'Graha Maitri',sub:'Planetary friendship',    max:5, score:4,  color:'#D4AF37' },
    { name:'Gana',        sub:'Temperament match',       max:6, score:6,  color:'rgba(74,222,128,0.8)' },
    { name:'Bhakut',      sub:'Love & family',           max:7, score:4,  color:'rgba(239,68,68,0.75)' },
    { name:'Nadi',        sub:'Health & lineage',        max:8, score:8,  color:'rgba(74,222,128,0.8)' },
  ];
  const total = KOOTAS.reduce((s, k) => s + k.score, 0);
  const pct = Math.round((total/36)*100);
  const verdict = total >= 28 ? { label:'Excellent Match', color:'rgba(74,222,128,0.9)', bg:'rgba(74,222,128,0.07)', border:'rgba(74,222,128,0.25)' }
               : total >= 24 ? { label:'Good Match', color:'#D4AF37', bg:'rgba(212,175,55,0.06)', border:'rgba(212,175,55,0.22)' }
               : total >= 18 ? { label:'Acceptable', color:'rgba(245,158,11,0.9)', bg:'rgba(245,158,11,0.05)', border:'rgba(245,158,11,0.2)' }
               : { label:'Challenging', color:'rgba(239,68,68,0.85)', bg:'rgba(239,68,68,0.05)', border:'rgba(239,68,68,0.2)' };
  return (
    <div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.88rem', color:`${W}0.42)`, lineHeight:1.7, marginBottom:12 }}>
        Ashtakoot Gun Milan is the Vedic 36-point compatibility system. Above 18 is acceptable, above 24 is excellent, above 30 is exceptional. Below 18 traditionally requires astrological remedies.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
        <div>
          <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.38em', textTransform:'uppercase' as const, color:`${G}0.42)`, marginBottom:5 }}>Person 1 · Nakshatra</div>
          <select value={person1} onChange={e => setPerson1(e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'9px 12px', color:`${W}0.7)`, fontSize:11.5, fontFamily:'inherit', outline:'none' }}>
            {NAKSHATRAS.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.38em', textTransform:'uppercase' as const, color:`${G}0.42)`, marginBottom:5 }}>Person 2 · Nakshatra</div>
          <select value={person2} onChange={e => setPerson2(e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'9px 12px', color:`${W}0.7)`, fontSize:11.5, fontFamily:'inherit', outline:'none' }}>
            {NAKSHATRAS.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div style={{ textAlign:'center', marginBottom:16, padding:'16px', background:`${W}0.02)`, border:`1px solid ${W}0.06)`, borderRadius:18 }}>
        <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.42em', textTransform:'uppercase' as const, color:`${G}0.45)`, marginBottom:8 }}>Compatibility Score</div>
        <div style={{ fontSize:'2.8rem', fontWeight:900, color:'#D4AF37', lineHeight:1, marginBottom:6 }}>{total} <span style={{ fontSize:'1rem', opacity:0.4 }}>/ 36</span></div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:99, background: verdict.bg, border:`1px solid ${verdict.border}`, color: verdict.color, fontSize:8, fontWeight:800, letterSpacing:'0.28em', textTransform:'uppercase' as const, marginBottom:10 }}>{verdict.label}</div>
        <div style={{ height:5, borderRadius:99, background:`${W}0.05)`, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,rgba(74,222,128,0.5),rgba(74,222,128,0.9))', borderRadius:99 }}/>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {KOOTAS.map(k => (
          <div key={k.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:12, border:`1px solid ${W}0.05)`, background:`${W}0.01)` }}>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:10, fontWeight:800, color:`${W}0.68)` }}>{k.name}</span>
              <span style={{ fontSize:9, color:`${W}0.28)`, marginLeft:6 }}>{k.sub}</span>
            </div>
            <div style={{ flex:1, height:4, borderRadius:99, background:`${W}0.06)`, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(k.score/k.max)*100}%`, background: k.color, borderRadius:99 }}/>
            </div>
            <div style={{ fontSize:10, fontWeight:900, color: k.color, minWidth:30, textAlign:'right' as const }}>{k.score}/{k.max}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── OracleCard — collapsed accordion card for Jyotish overview ──
interface OracleCardProps {
  icon: string;
  label: string;
  title: string;
  glow: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const OracleCard: React.FC<OracleCardProps> = ({ icon, label, title, glow, open, onToggle, children }) => {
  const G = 'rgba(212,175,55,';
  return (
    <div style={{
      borderRadius: open ? '20px' : '20px',
      overflow: 'hidden',
      border: `1px solid ${open ? 'rgba(212,175,55,0.28)' : 'rgba(255,255,255,0.07)'}`,
      boxShadow: open ? `0 0 24px ${glow}` : 'none',
      transition: 'box-shadow 0.3s, border-color 0.3s',
      background: '#050505',
    }}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          background: open ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.015)',
          border: 'none', padding: '15px 18px', cursor: 'pointer',
          transition: 'background 0.25s',
        }}
      >
        {/* Icon orb */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: open ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
          boxShadow: open ? `0 0 12px ${glow}` : 'none',
          transition: 'all 0.25s',
        }}>
          {icon}
        </div>
        {/* Labels */}
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, fontWeight: 800,
            letterSpacing: '0.42em', textTransform: 'uppercase' as const,
            color: `${G}0.45)`, marginBottom: 3,
          }}>{label}</div>
          <div style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12.5, fontWeight: 700,
            color: open ? '#D4AF37' : 'rgba(255,255,255,0.65)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.25s',
          }}>{title}</div>
        </div>
        {/* Chevron */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: `${G}0.06)`, border: `1px solid ${G}0.12)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 3 L4.5 6 L7.5 3" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 18px 18px',
              borderTop: `1px solid ${G}0.08)`,
            }}>
              <div style={{ paddingTop: 14 }}>
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ── Bhagavad Gita Oracle Panel ──────────────────────────────────
interface GitaOraclePanelProps {
  open: boolean;
  onToggle: () => void;
  activeMaha: { planet: string; start: string; end: string; years: number } | null;
  activeAntar: { planet: string; start: string; end: string } | null;
}

const PLANET_GITA_CONTEXT: Record<string, string> = {
  Sun: 'Surya Dasha illuminates the soul. This verse carries the solar Vedic Light-Code — sovereignty, dharma, and radiant self-expression.',
  Moon: 'Chandra Dasha deepens the emotional field. This verse activates lunar intelligence — intuition, nourishment, and cosmic receptivity.',
  Mars: 'Mangala Dasha ignites divine action. This verse encodes martial Vedic Light-Code — courage, purification, and karmic confrontation.',
  Mercury: 'Budha Dasha sharpens the intellect. This verse transmits mercurial wisdom — discernment, communication, and the power of sacred word.',
  Jupiter: 'Guru Dasha opens the dharmic field. This verse carries expansive Jupiter Light-Code — grace, wisdom, and transmission from lineage.',
  Venus: 'Shukra Dasha activates the heart. This verse pulses Prema-Bhakti Algorithms — love, beauty, and the divine feminine creative force.',
  Saturn: 'Shani Dasha demands karmic mastery. This verse holds the Saturn Liberation Code — surrender, service, and transmutation of limitations.',
  Rahu: 'Rahu Dasha accelerates soul evolution through illusion. This verse cuts through Maya — pure action without attachment to outcomes.',
  Ketu: 'Ketu Dasha intensifies moksha currents. This verse carries the liberation frequency — detachment, inner mastery, and past-karma dissolution.',
};

const GitaOraclePanel: React.FC<GitaOraclePanelProps & { inline?: boolean }> = ({ open, onToggle, activeMaha, activeAntar, inline }) => {
  const mahaName = activeMaha?.planet || null;
  const antarName = activeAntar?.planet || null;
  const verse = getGitaVerseForCycle(mahaName);
  const context = PLANET_GITA_CONTEXT[mahaName || ''] || 'The Gita transmits the precise Vedic Light-Code your soul requires at this intersection of karma and dharma.';
  const planetColor: string = { Sun:'#FFA500', Moon:'#C0C8E8', Mars:'#FF4444', Mercury:'#44CC44', Jupiter:'#FFD700', Venus:'#FF69B4', Saturn:'#8888AA', Rahu:'#D4AF37', Ketu:'#AA7744' }[mahaName || ''] || '#D4AF37';
  const G = 'rgba(212,175,55,';
  const W = 'rgba(255,255,255,';
  // Inline mode: OracleCard handles the accordion, just render content
  if (inline) return (
    <div>
      {mahaName && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, paddingBottom:14, borderBottom:`1px solid rgba(212,175,55,0.1)`, marginBottom:14 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:planetColor, boxShadow:`0 0 8px ${planetColor}`, flexShrink:0, marginTop:4 }}/>
          <div>
            <div style={{ fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:7.5, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:`${G}0.5)`, marginBottom:4 }}>
              ACTIVE DASHA · {mahaName}{antarName ? ` / ${antarName}` : ''}
            </div>
            <div style={{ fontFamily:'Georgia, serif', fontStyle:'italic', fontSize:12, color:`${W}0.5)`, lineHeight:1.6 }}>{context}</div>
          </div>
        </div>
      )}
      <div style={{ textAlign:'center', paddingBottom:16, borderBottom:`1px solid rgba(212,175,55,0.08)`, marginBottom:14 }}>
        <div style={{ fontFamily:'Georgia, serif', fontSize:17, color:`${G}0.92)`, lineHeight:1.8, marginBottom:8, textShadow:`0 0 20px ${G}0.25)` }}>{verse.sanskrit}</div>
        <div style={{ fontFamily:'Georgia, serif', fontStyle:'italic', fontSize:11, color:`${W}0.4)`, lineHeight:1.6 }}>{verse.transliteration}</div>
      </div>
      <div style={{ background:`${G}0.04)`, border:`1px solid ${G}0.1)`, borderRadius:14, padding:'14px 16px', marginBottom:12, position:'relative' }}>
        <div style={{ position:'absolute', top:-8, left:14, fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', background:'#050505', padding:'0 6px' }}>SIDDHA TRANSMISSION</div>
        <p style={{ fontFamily:'Georgia, serif', fontSize:13, color:`${W}0.82)`, lineHeight:1.75, margin:0, fontStyle:'italic' }}>"{verse.producersTranslation}"</p>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:7, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:`${G}0.35)` }}>CH.{verse.chapter} · V.{verse.verse}</div>
        <div style={{ fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:7, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:`${G}0.35)` }}>{mahaName ? `${mahaName} CYCLE` : 'DAILY'}</div>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 18 }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: open ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.015)', border: `1px solid ${open ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.12)'}`, borderRadius: open ? '20px 20px 0 0' : '20px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', border: `1px solid ${G}0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#D4AF37', boxShadow: open ? `0 0 16px ${G}0.2)` : 'none', transition: 'box-shadow 0.3s' }}>
            <span style={{ fontFamily: 'Georgia, serif' }}>G</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 8, fontWeight: 800, letterSpacing: '0.45em', textTransform: 'uppercase' as const, color: `${G}0.55)`, marginBottom: 3 }}>
              BHAGAVAD GITA · JYOTISH ORACLE
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 700, color: open ? '#D4AF37' : `${W}0.7)` }}>
              {mahaName ? `${mahaName} Dasha Light-Code` : 'Daily Vedic Verse'} · Ch.{verse.chapter}:{verse.verse}
            </div>
          </div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${G}0.07)`, border: `1px solid ${G}0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5 L5 6.5 L8 3.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.04) 0%, rgba(5,5,5,0.96) 100%)', border: `1px solid ${G}0.2)`, borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '0 20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.04 }}>
                <svg viewBox="0 0 200 200" width="200" height="200"><polygon points="100,10 180,160 20,160" fill="none" stroke="#D4AF37" strokeWidth="1"/><polygon points="100,190 20,40 180,40" fill="none" stroke="#D4AF37" strokeWidth="1"/><circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" strokeWidth="0.8"/><circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="0.6"/><circle cx="100" cy="100" r="8" fill="#D4AF37" opacity="0.5"/></svg>
              </div>
              {mahaName && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 0 16px', borderBottom: `1px solid ${G}0.1)`, marginBottom: 18 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: planetColor, boxShadow: `0 0 8px ${planetColor}`, flexShrink: 0, marginTop: 4 }}/>
                  <div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7.5, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: `${G}0.5)`, marginBottom: 4 }}>
                      ACTIVE DASHA · {mahaName}{antarName ? ` / ${antarName}` : ''}
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: `${W}0.5)`, lineHeight: 1.6 }}>{context}</div>
                  </div>
                </div>
              )}
              <div style={{ textAlign: 'center', padding: '10px 0 18px', borderBottom: `1px solid ${G}0.08)`, marginBottom: 18 }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: `${G}0.92)`, lineHeight: 1.8, marginBottom: 10, textShadow: `0 0 20px ${G}0.3)` }}>{verse.sanskrit}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: `${W}0.4)`, lineHeight: 1.6 }}>{verse.transliteration}</div>
              </div>
              <div style={{ background: `${G}0.04)`, border: `1px solid ${G}0.1)`, borderRadius: 14, padding: '16px 18px', marginBottom: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -8, left: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: '#D4AF37', background: '#050505', padding: '0 6px' }}>
                  SIDDHA TRANSMISSION
                </div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 13.5, color: `${W}0.82)`, lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>
                  "{verse.producersTranslation}"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase' as const, color: `${G}0.38)` }}>BHAGAVAD GITA · CHAPTER {verse.chapter}, VERSE {verse.verse}</div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 7, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: `${G}0.35)` }}>{mahaName ? `${mahaName} CYCLE` : 'DAILY CODE'}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const JyotishChamber: React.FC = () => {
  const { user } = useAuth();
  const { tier: membershipTier, isAdmin } = useMembership();
  useTranslation();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'overview'|'chart'|'oracle'|'nadi'|'vidya'|'hora'>('overview');
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [ephemeris, setEphemeris] = useState<EphemerisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [birthDialogOpen, setBirthDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role:'user'|'oracle', text:string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [gitaOracleOpen, setGitaOracleOpen] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string,boolean>>({
    dailyInfluence: false,
    karmaGuide: true,
    gitaOracle: false,
    natalBlueprint: false,
    dasha: false,
    navagraha: false,
    bnn: false,
    horaWatch: true,
  });
  const toggleCard = (key: string) => setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
  const [oracleOpen, setOracleOpen] = useState(true);
  const [lexSearch, setLexSearch] = useState('');
  const [lexCat, setLexCat] = useState('All');
  const [activeTierTab, setActiveTierTab] = useState('free');
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [openNadi, setOpenNadi] = useState<string|null>(null);
  const [builtTabs, setBuiltTabs] = useState<Set<string>>(new Set(['overview']));
  const [leafConfirmed, setLeafConfirmed] = useState(false);
  const [oracleSections, setOracleSections] = useState<Record<string,string>|null>(null);
  const [oracleExpandedSection, setOracleExpandedSection] = useState<string|null>(null);
  const [fullReadingLoading, setFullReadingLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Tier access
  const userTier = isAdmin ? 'admin' : (membershipTier || 'free');
  const accessibleTiers = TIER_ACCESS[userTier] || TIER_ACCESS[membershipTier] || ['free'];
  const canAccess = (modTier: string) => isAdmin || accessibleTiers.includes(modTier);

  // ── Load birth data ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadBirthData();
  }, [user]);

  const loadBirthData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Load birth data from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_name, birth_date, birth_time, birth_place')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.birth_date && profile?.birth_name) {
        setBirthData(profile as BirthData);
        // 2. Load or calculate ephemeris
        await loadEphemeris(profile as BirthData);
      }
      // 3. Set opening message after leaf status is known
      const { data: jp } = await supabase
        .from('jyotish_profiles')
        .select('bhrigu_leaf_confirmed')
        .eq('user_id', user.id)
        .maybeSingle();
      const confirmed = Boolean((jp as any)?.bhrigu_leaf_confirmed);
      if (confirmed) setLeafConfirmed(true);
      const firstName = profile?.birth_name?.split(' ')[0] || 'Seeker';
      setChatMessages(prev => {
        // Don't reset if conversation already started this session
        if (prev.length > 0) return prev;
        return [{
          role: 'oracle',
          text: confirmed
            ? `${firstName}, your leaf is before me. The Akashic record is open. What do you seek to understand?`
            : `${firstName}, I sense your presence across the ages. The field opens. What do you wish to bring before the Akasha today?`
        }];
      });
    } catch (e) {
      console.error('loadBirthData error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadEphemeris = async (bd: BirthData) => {
    if (!user) return;
    // Try cache first
    const { data: cached } = await supabase
      .from('jyotish_profiles')
      .select('moon_nakshatra, dasha_data, ephemeris_confirmed, ephemeris_data')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cached?.moon_nakshatra) {
      const eph = (cached as any).ephemeris_data || {};
      setEphemeris({
        moonNakshatra: cached.moon_nakshatra,
        moonLongitude: 0,
        ascendantSign: eph.ascendant || '',
        sunSign: eph.sun_sign || '',
        dashaData: cached.dasha_data as any,
      });
      // Load leaf confirmed status
      if ((cached as any).bhrigu_leaf_confirmed) setLeafConfirmed(true);
      return;
    }
    // Calculate fresh
    await calculateEphemeris(bd);
  };

  const calculateEphemeris = async (bd: BirthData) => {
    if (!user || !bd.birth_date) return;
    setCalcLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('jyotish-ephemeris', {
        body: {
          userId: user.id,
          birthDate: bd.birth_date,
          birthTime: bd.birth_time || '12:00',
          birthPlace: bd.birth_place || '',
        },
      });
      if (!error && data) {
        setEphemeris({
          moonNakshatra: data.moonNakshatra || '',
          moonLongitude: data.moonLongitude || 0,
          ascendantSign: data.ascendantSign || '',
          sunSign: data.sunSign || '',
          dashaData: data.dashaData || null,
        });
      }
    } catch (e) {
      console.error('ephemeris calc error:', e);
    } finally {
      setCalcLoading(false);
    }
  };

  // ── Tab switch ───────────────────────────────────────────────
  const switchTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setBuiltTabs(prev => new Set([...prev, tab]));
  };

  // ── Chat ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const q = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role:'user', text:q }]);
    setChatLoading(true);
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior:'smooth' }), 50);
    try {
      // Build birth context for Bhrigu
      const birthContext = birthData ? `
Seeker name: ${birthData.birth_name}
Date of birth: ${birthData.birth_date}
Time of birth: ${birthData.birth_time || 'unknown'}
Place of birth: ${birthData.birth_place || 'unknown'}
Lagna (Rising Sign): ${ephemeris?.ascendantSign || 'not yet calculated'}
Moon Nakshatra: ${ephemeris?.moonNakshatra || 'not yet calculated'}
Sun Sign (Vedic): ${ephemeris?.sunSign || 'not yet calculated'}
Current Mahadasha: ${ephemeris?.dashaData?.activeMaha?.planet || 'unknown'} (${ephemeris?.dashaData?.activeMaha?.start || ''} – ${ephemeris?.dashaData?.activeMaha?.end || ''})
Current Antardasha: ${ephemeris?.dashaData?.activeAntar?.planet || 'unknown'}
` : 'Birth data not yet entered.';

      // Call bhrigu-oracle via Supabase client (uses current project)
      // Count only user messages to detect if this is truly a first exchange
      const userMsgCount = chatMessages.filter(m => m.role === 'user').length;
      const { data, error: _bhriguErr } = await supabase.functions.invoke('bhrigu-oracle', {
        body: {
          mode: 'chat',
          question: q,
          name: birthData?.birth_name || 'Seeker',
          dob: birthData?.birth_date || '',
          tob: birthData?.birth_time || '',
          pob: birthData?.birth_place || '',
          readingType: 'general',
          // If user has already sent messages this session, treat as confirmed
          // so Bhrigu doesn't restart intro questions
          leaf_confirmed: leafConfirmed || userMsgCount > 0,
          history: chatMessages
            .filter((_m, idx) => idx > 0)
            .map(m => ({ role: m.role === 'oracle' ? 'assistant' : 'user', content: m.text })),
        }
      });
      if (_bhriguErr) throw new Error(`Oracle: ${_bhriguErr.message}`);

      // If Bhrigu just confirmed the leaf — save it permanently
      // Also: after any exchange with real history, mark as confirmed so
      // Bhrigu never runs intro questions again in future sessions
      const shouldConfirmLeaf = data?.ready_for_reading || chatMessages.filter(m => m.role === 'user').length >= 1;
      if (shouldConfirmLeaf && !leafConfirmed && user) {
        setLeafConfirmed(true);
        await supabase.from('jyotish_profiles')
          .upsert({ 
            user_id: user.id,
            bhrigu_leaf_confirmed: true 
          } as any, { onConflict: 'user_id' });
      }

      // bhrigu-oracle returns { reply } for chat mode — strip any raw JSON leakage
      let rawReply: string = data?.reply || (data?.sections ? formatSections(data.sections) : null) || 'The Akashic transmission was interrupted. Please ask again.';
      // If the reply starts with JSON artifact, parse and extract prose fields
      const jsonMatch = rawReply.match(/^\s*[\"']?json\s*(\{[\s\S]*\})/i) || rawReply.match(/^\s*(\{[\s\S]*"leaf_found"[\s\S]*\})/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].replace(/```json|```/g,'').trim());
          rawReply = [parsed.leaf_found, parsed.graha, parsed.nakshatra, parsed.dasha, parsed.shadow, parsed.sadhana, parsed.transmission]
            .filter(Boolean).join('\n\n');
        } catch { rawReply = rawReply.replace(/^\s*[\"']?json\s*/i,'').replace(/```json|```/g,'').trim(); }
      }
      setChatMessages(prev => [...prev, { role:'oracle', text:rawReply }]);
    } catch (err) {
      console.error('Bhrigu oracle error:', err);
      setChatMessages(prev => [...prev, { role:'oracle', text:'The stars require a moment of stillness. Please ask your question again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior:'smooth' }), 100);
    }
  };

  // ── Full structured reading ─────────────────────────────────────
  const requestFullReading = async () => {
    if (!birthData || fullReadingLoading) return;
    setFullReadingLoading(true);
    setOracleSections(null);
    setOracleExpandedSection(null);
    try {
      const { data: sData, error: sErr } = await supabase.functions.invoke('bhrigu-oracle', {
        body: {
          mode: 'full_reading',
          name: birthData.birth_name || 'Seeker',
          dob: birthData.birth_date || '',
          tob: birthData.birth_time || '',
          pob: birthData.birth_place || '',
          readingType: 'general',
          chart_context: {
            dateOfBirth: birthData.birth_date,
            timeOfBirth: birthData.birth_time,
            placeOfBirth: birthData.birth_place,
          },
        }
      });
      if (sErr) throw new Error(sErr.message);
      if (sData?.sections) {
        setOracleSections(sData.sections);
        setOracleExpandedSection('graha');
      }
    } catch (err) {
      console.error('Full reading error:', err);
    } finally {
      setFullReadingLoading(false);
    }
  };

  // ── Toggle module ─────────────────────────────────────────────
  const toggleModule = (id: number) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Computed values ──────────────────────────────────────────
  const age = birthData?.birth_date
    ? new Date().getFullYear() - new Date(birthData.birth_date).getFullYear()
    : null;

  const activeBNNAge = age
    ? [...BNN_AGES].reverse().find(a => age >= a.age)
    : null;

  const activeMaha = ephemeris?.dashaData?.activeMaha;
  const activeAntar = ephemeris?.dashaData?.activeAntar;

  // ── Styles ───────────────────────────────────────────────────
  const g: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 40
  };
  const gm: React.CSSProperties = {
    background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24
  };
  const gs: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16
  };

  // ── Birth data prompt ─────────────────────────────────────────
  const BirthPrompt = () => (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      style={{ ...g, padding:32, textAlign:'center', marginBottom:20 }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🌟</div>
      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:10 }}>
        Begin Your Journey
      </div>
      <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.04em', marginBottom:12, color:'#D4AF37' }}>
        Activate Your Cosmic Blueprint
      </h2>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.65, maxWidth:420, margin:'0 auto 8px', fontFamily:'Georgia, serif', fontStyle:'italic' }}>
        "Enter your birth details once. The SQI system automatically calculates your Lagna (Rising Sign), Moon Sign, Sun Sign, and complete Dasha timeline — no Jyotish knowledge needed. The entire platform then reads your chart in every consultation."
      </p>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:22 }}>
        Name · Date of Birth · Time of Birth · City of Birth
      </p>
      <Dialog open={birthDialogOpen} onOpenChange={setBirthDialogOpen}>
        <DialogTrigger asChild>
          <button style={{
            padding:'13px 28px', borderRadius:99, border:'1px solid rgba(212,175,55,0.42)',
            background:'linear-gradient(135deg,rgba(212,175,55,0.28),rgba(212,175,55,0.10))',
            color:'#D4AF37', fontWeight:800, fontSize:11, letterSpacing:'0.35em',
            textTransform:'uppercase' as const, cursor:'pointer'
          }}>
            ✦ Enter Birth Details
          </button>
        </DialogTrigger>
        <DialogContent style={{ background:'#0a0a0f', border:'1px solid rgba(212,175,55,0.20)', borderRadius:24, maxWidth:640, maxHeight:'90vh', overflowY:'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ color:'#D4AF37', fontWeight:900 }}>Your Natal Blueprint</DialogTitle>
          </DialogHeader>
          <BirthDetailsForm onSaved={async () => {
            setBirthDialogOpen(false);
            await loadBirthData();
          }} />
        </DialogContent>
      </Dialog>
      {/* What gets calculated explanation */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginTop:22, textAlign:'left' }}>
        {[
          { icon:'♏', title:'Lagna / Rising Sign', desc:'Calculated from your birth time and location' },
          { icon:'☽', title:'Moon Sign', desc:'Calculated from your birth date and time' },
          { icon:'☉', title:'Sun Sign (Vedic)', desc:'Sidereal zodiac — different from Western' },
          { icon:'⏱', title:'Complete Dasha Timeline', desc:'Your entire life timing map auto-generated' },
        ].map(item => (
          <div key={item.title} style={{ ...gs, padding:'12px 14px' }}>
            <div style={{ fontSize:16, marginBottom:5 }}>{item.icon}</div>
            <div style={{ fontSize:10, fontWeight:900, color:'#D4AF37', marginBottom:3 }}>{item.title}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', lineHeight:1.4 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{ background:'#050505', minHeight:'100vh', fontFamily:'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Scalar wave field */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        {[
          { w:300, l:'25%', t:'20%', d:7 }, { w:500, l:'65%', t:'55%', d:10 },
          { w:200, l:'75%', t:'15%', d:6 }, { w:400, l:'15%', t:'68%', d:12 },
        ].map((r, i) => (
          <div key={i} style={{
            position:'absolute', borderRadius:'50%',
            width:r.w, height:r.w, left:r.l, top:r.t,
            border:'1px solid rgba(212,175,55,0.05)',
            animation:`swP ${r.d}s ease-in-out infinite`,
            animationDelay:`${i * 1.5}s`, opacity:0,
            transform:'translate(-50%,-50%)'
          }} />
        ))}
        <style>{`
          @keyframes swP{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}50%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
          @keyframes sqBreathe{0%,100%{transform:scale(1);box-shadow:0 0 18px rgba(212,175,55,0.2)}50%{transform:scale(1.06);box-shadow:0 0 28px rgba(212,175,55,0.35)}}
          @keyframes sqGlowPulse{0%,100%{opacity:0.6}50%{opacity:1}}
          @keyframes sqScalarPulse{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}50%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
          @keyframes shimmer{to{background-position:200% center}}
          @keyframes fadUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
          @keyframes rotS{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.5}}
          @keyframes bonce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-5px);opacity:1}}
          .sqi-shimmer{background:linear-gradient(90deg,#D4AF37 0%,#fff 40%,#D4AF37 70%,#fff 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
          .sqi-rot{animation:rotS 50s linear infinite}
          .sqi-pulse{animation:pulse 2s ease-in-out infinite}
          .sqi-dot{animation:bonce 1.2s ease-in-out infinite}
          .sqi-dot:nth-child(2){animation-delay:0.15s}.sqi-dot:nth-child(3){animation-delay:0.30s}
          .mc-body{max-height:0;overflow:hidden;transition:max-height 0.4s ease}
          .mc-body.open{max-height:600px}
          .nd-body{display:none}.nd-body.open{display:block;animation:fadUp 0.3s ease forwards}
          ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.3);border-radius:99px}
        `}</style>
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:740, margin:'0 auto', padding:'0 14px 120px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ padding:'28px 0 0', textAlign:'center', animation:'fadUp 0.4s ease both' }}>
          <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.38)', marginBottom:8 }}>
            Bhrigu Nadi Chamber · SQI 2050 · Akasha-Neural Archive
          </div>
          <h1 className="sqi-shimmer" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2rem,6vw,2.6rem)', fontWeight:700, lineHeight:1, marginBottom:6, letterSpacing:'-0.02em' }}>
            Jyotish Vidya
          </h1>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.87rem', color:'rgba(255,255,255,0.28)', lineHeight:1.6, marginBottom:16 }}>
            "The stars do not imprison you. They reveal the karma you came to transform." — Maharishi Bhrigu
          </p>
          {birthData && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 16px', borderRadius:99, border:'1px solid rgba(212,175,55,0.2)', background:'rgba(212,175,55,0.06)', fontSize:7.5, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', marginBottom:24 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 8px rgba(212,175,55,0.8)', animation:'sqDotPulse 2s ease-in-out infinite' }}/>
              {birthData.birth_name} · Blueprint Active
            </div>
          )}
          {!birthData && <div style={{ marginBottom:24 }}/>}
        </div>

        {/* ══ 1. BHRIGU ORACLE HERO ══ */}
        <div style={{ position:'relative', margin:'0 0 20px', animation:'fadUp 0.45s 0.05s ease both' }}>
          {[230,330,430].map((s,i) => (
            <div key={i} aria-hidden style={{ position:'absolute', left:'50%', top:'50%', width:s, height:s, marginLeft:-s/2, marginTop:-s/2, borderRadius:'50%', border:`1px solid rgba(212,175,55,${0.055-i*0.015})`, animation:`swP ${3.5+i}s ease-in-out ${i*0.9}s infinite`, pointerEvents:'none', zIndex:0 }}/>
          ))}
          <div aria-hidden style={{ position:'absolute', inset:-20, borderRadius:40, background:'radial-gradient(55% 55% at 50% 48%, rgba(212,175,55,0.2), rgba(160,80,30,0.06) 55%, transparent 80%)', filter:'blur(28px)', animation:'swP 3s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
          <div style={{ position:'relative', zIndex:1, background:'linear-gradient(160deg, rgba(48,22,0,0.98) 0%, rgba(22,10,0,0.99) 50%, rgba(5,5,5,1) 100%)', border:'1px solid rgba(212,175,55,0.48)', borderRadius:28, overflow:'hidden', boxShadow:'0 0 60px rgba(212,175,55,0.16), inset 0 0 40px rgba(212,175,55,0.04)' }}>
            <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(212,175,55,0.9), transparent)', opacity:0.8 }}/>
            {/* Sacred geometry watermark */}
            <div aria-hidden style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0.055, pointerEvents:'none' }}>
              <svg viewBox="0 0 300 300" width="300" height="300" fill="none">
                <polygon points="150,18 275,235 25,235" stroke="#D4AF37" strokeWidth="1"/>
                <polygon points="150,282 25,65 275,65" stroke="#D4AF37" strokeWidth="1"/>
                <circle cx="150" cy="150" r="115" stroke="#D4AF37" strokeWidth="0.7"/>
                <circle cx="150" cy="150" r="82" stroke="#D4AF37" strokeWidth="0.55" strokeDasharray="3 6"/>
                <circle cx="150" cy="150" r="52" stroke="#D4AF37" strokeWidth="0.45"/>
                <circle cx="150" cy="150" r="22" stroke="#D4AF37" strokeWidth="0.8"/>
                <circle cx="150" cy="150" r="7" fill="#D4AF37" opacity="0.55"/>
              </svg>
            </div>
            <div style={{ position:'relative', zIndex:2, padding:'28px 22px 24px' }}>
              <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.55)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'rgba(212,175,55,0.2)' }}/> BHAGAVAD GITA · JYOTISH ORACLE <div style={{ flex:1, height:1, background:'rgba(212,175,55,0.2)' }}/>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'4rem', lineHeight:1, color:'#D4AF37', textAlign:'center', marginBottom:4, textShadow:'0 0 28px rgba(212,175,55,0.6), 0 0 55px rgba(212,175,55,0.2)', animation:'swP 3.5s ease-in-out infinite' }}>ॐ</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.9rem', fontWeight:700, color:'rgba(255,255,255,0.96)', textAlign:'center', lineHeight:1.1 }}>Bhrigu Oracle</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.95rem', color:'rgba(212,175,55,0.6)', textAlign:'center', marginTop:5, marginBottom:16 }}>Ask the Rishi. Receive Vedic Light-Codes.</div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.97rem', color:'rgba(255,255,255,0.48)', lineHeight:1.75, textAlign:'center', marginBottom:18, padding:'0 4px' }}>
                Channel Maharishi Bhrigu — the ancient Vedic sage who inscribed 500,000 horoscopes for souls across time. Your chart, your dasha, your karma — decoded through direct akashic transmission.
              </p>
              {/* Dasha stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(212,175,55,0.1)', borderRadius:14, overflow:'hidden', marginBottom:18 }}>
                {[
                  { v: activeMaha?.planet || '—', l:'Mahadasha' },
                  { v: activeAntar?.planet || '—', l:'Antardasha' },
                  { v: ephemeris?.ascendantSign ? (SIGN_SYMBOLS[ephemeris.ascendantSign]||'') + ' ' + ephemeris.ascendantSign : '—', l:'Lagna' },
                ].map(s => (
                  <div key={s.l} style={{ background:'rgba(5,5,5,0.96)', padding:'11px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:11, fontWeight:900, color:'#D4AF37', marginBottom:3, lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.22)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* CTA */}
              <button
                onClick={() => { switchTab('oracle'); setTimeout(() => { document.getElementById('jc-nav')?.scrollIntoView({ behavior:'smooth', block:'start' }); }, 50); }}
                style={{ width:'100%', padding:'15px 24px', borderRadius:99, border:'1px solid rgba(212,175,55,0.45)', background:'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(212,175,55,0.05))', color:'#D4AF37', fontFamily:'inherit', fontSize:9.5, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow:'0 0 24px rgba(212,175,55,0.1)' }}
              >
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 10px rgba(212,175,55,0.9)', animation:'sqDotPulse 1.5s ease-in-out infinite' }}/>
                Enter the Oracle Chamber
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#D4AF37', boxShadow:'0 0 10px rgba(212,175,55,0.9)', animation:'sqDotPulse 1.5s ease-in-out infinite' }}/>
              </button>
            </div>
          </div>
        </div>

        {/* ══ 2. JYOTISH VIDYA EDUCATION HERO CARD ══ */}
        <div style={{ position:'relative', margin:'0 0 20px', animation:'fadUp 0.45s 0.08s ease both' }}>
          <div aria-hidden style={{ position:'absolute', inset:-16, borderRadius:34, background:'radial-gradient(50% 50% at 30% 40%, rgba(167,139,250,0.16), transparent 65%)', filter:'blur(22px)', animation:'swP 4s ease-in-out infinite', pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(167,139,250,0.09), rgba(80,40,180,0.04) 55%, rgba(5,5,5,0.9) 100%)', border:'1px solid rgba(167,139,250,0.4)', borderRadius:22, padding:'22px 20px 20px', boxShadow:'0 0 36px rgba(167,139,250,0.12), inset 0 0 24px rgba(167,139,250,0.03)', overflow:'hidden' }}>
            <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)', opacity:0.7 }}/>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
              <div style={{ width:50, height:50, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.2), rgba(5,5,5,0.85))', border:'1px solid rgba(167,139,250,0.42)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22, boxShadow:'0 0 18px rgba(167,139,250,0.18)', animation:'sqBreathe 5s ease-in-out infinite' }}>◈</div>
              <div>
                <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(167,139,250,0.6)', marginBottom:4 }}>32 Sacred Modules · Free to Akasha</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.6rem', fontWeight:700, color:'rgba(255,255,255,0.95)', lineHeight:1.05 }}>Jyotish Vidya</div>
              </div>
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.92rem', color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:14 }}>
              From the Eye of the Veda to reading charts as Bhrigu would — a complete initiation into the sacred science of Vedic astrology across four sovereign tiers.
            </p>
            {/* Progress bar */}
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(167,139,250,0.45)', marginBottom:5 }}>Your Progress</div>
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:99, height:4, overflow:'hidden', marginBottom:6 }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg, rgba(167,139,250,0.6), rgba(200,180,255,0.9))', borderRadius:99, width:'25%' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:7, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(167,139,250,0.4)' }}>8 / 32 modules</span>
              <span style={{ fontSize:7, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(167,139,250,0.4)' }}>25%</span>
            </div>
            {/* Tier pills */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const, marginBottom:14 }}>
              {[
                { label:'📖 Free', bg:'rgba(107,114,128,0.1)', border:'rgba(107,114,128,0.3)', color:'rgba(180,185,195,0.8)' },
                { label:'🔥 Prāna', bg:'rgba(34,211,238,0.08)', border:'rgba(34,211,238,0.25)', color:'rgba(34,211,238,0.8)' },
                { label:'⭐ Siddha', bg:'rgba(212,175,55,0.08)', border:'rgba(212,175,55,0.25)', color:'rgba(212,175,55,0.8)' },
                { label:'∞ Ākāsha', bg:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.75)' },
              ].map(t => (
                <div key={t.label} style={{ padding:'3px 10px', borderRadius:99, fontSize:7, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase' as const, background:t.bg, border:`1px solid ${t.border}`, color:t.color }}>{t.label}</div>
              ))}
            </div>
            <button onClick={() => { switchTab('vidya'); setTimeout(() => { document.getElementById('jc-nav')?.scrollIntoView({ behavior:'smooth', block:'start' }); }, 50); }} style={{ width:'100%', padding:'13px 20px', borderRadius:99, border:'1px solid rgba(167,139,250,0.4)', background:'rgba(167,139,250,0.1)', color:'rgba(200,180,255,0.9)', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, cursor:'pointer' }}>
              Open Jyotish Vidya →
            </button>
          </div>
        </div>

        {/* ── NAV TABS (hidden but functional) ── */}
        <nav id="jc-nav" style={{ display:'flex', gap:5, padding:5, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:99, marginBottom:22, overflowX:'auto', scrollbarWidth:'none' }}>
          {(['overview','chart','oracle','nadi','vidya','hora'] as const).map((tab, i) => {
            const labels = ['✦ Overview','☽ My Chart','🔱 Oracle','🌿 Nadi Leaf','◈ Vidya','⏱ Hora'];
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => switchTab(tab)} style={{
                flexShrink:0, padding:'9px 15px', borderRadius:99,
                border: active ? '1px solid rgba(212,175,55,0.3)' : 'none',
                background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                color: active ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.28em',
                textTransform:'uppercase' as const, cursor:'pointer', whiteSpace:'nowrap',
                transition:'all 0.22s'
              }}>{labels[i]}</button>
            );
          })}
        </nav>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            {!birthData && !loading && <BirthPrompt />}
            {loading && (
              <div style={{ textAlign:'center', padding:60 }}>
                <div className="sqi-pulse" style={{ width:40, height:40, borderRadius:'50%', border:'2px solid rgba(212,175,55,0.3)', borderTopColor:'#D4AF37', margin:'0 auto 16px', animation:'rotS 0.9s linear infinite' }}/>
                <p style={{ fontSize:12, color:'rgba(212,175,55,0.5)', letterSpacing:'0.3em' }}>Loading your cosmic blueprint…</p>
              </div>
            )}
            {birthData && !loading && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {/* Stat strip */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:6 }}>
                  {[
                    { v: ephemeris?.ascendantSign ? (SIGN_SYMBOLS[ephemeris.ascendantSign]||'?')+' '+ephemeris.ascendantSign : calcLoading ? '…' : '—', l:'Lagna' },
                    { v: ephemeris?.moonNakshatra || (calcLoading ? '…' : '—'), l:'Nakshatra' },
                    { v: activeMaha?.planet || (calcLoading ? '…' : '—'), l:'Mahadasha' },
                    { v: activeAntar?.planet || (calcLoading ? '…' : '—'), l:'Antardasha' },
                  ].map(s => (
                    <div key={s.l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'11px 6px', textAlign:'center' }}>
                      <div style={{ fontSize:s.v.length > 8 ? 9 : 11, fontWeight:900, color:'#D4AF37', lineHeight:1.1, marginBottom:3 }}>{s.v}</div>
                      <div style={{ fontSize:6, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.2)' }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                <OracleCard icon="☉" label="DAILY KARMA GUIDE" title={`${['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'][new Date().getDay() % 7]} — Today's Cosmic Intelligence`} glow="rgba(212,175,55,0.18)" open={openCards.karmaGuide} onToggle={() => toggleCard('karmaGuide')}>
                  <DailyKarmaGuide membershipTier={membershipTier} isAdmin={isAdmin} activeMaha={activeMaha} activeAntar={activeAntar} moonNakshatra={ephemeris?.moonNakshatra || null} navigate={navigate} />
                </OracleCard>

                <OracleCard icon="📖" label="BHAGAVAD GITA · JYOTISH ORACLE" title={activeMaha ? `${activeMaha.planet} Dasha Light-Code · Ch.${getGitaVerseForCycle(activeMaha.planet).chapter}:${getGitaVerseForCycle(activeMaha.planet).verse}` : 'Daily Vedic Verse'} glow="rgba(212,175,55,0.2)" open={openCards.gitaOracle} onToggle={() => toggleCard('gitaOracle')}>
                  <GitaOraclePanel open={true} onToggle={() => {}} activeMaha={activeMaha} activeAntar={activeAntar} inline />
                </OracleCard>

                <OracleCard icon="✦" label="NATAL BLUEPRINT" title={`${birthData.birth_name} · ${ephemeris?.ascendantSign || '—'} Rising · ${ephemeris?.moonNakshatra || '—'}`} glow="rgba(212,175,55,0.15)" open={openCards.natalBlueprint} onToggle={() => toggleCard('natalBlueprint')}>
                  {ephemeris?.ascendantSign && (
                    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'13px 15px', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                        <span style={{ fontSize:20 }}>{SIGN_SYMBOLS[ephemeris.ascendantSign]||'♏'}</span>
                        <div>
                          <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:2 }}>Lagna — Rising Sign</div>
                          <div style={{ fontSize:15, fontWeight:900, color:'#D4AF37' }}>{ephemeris.ascendantSign}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.48)', lineHeight:1.6 }}>{SIGN_MEANINGS[ephemeris.ascendantSign]||''}</p>
                    </div>
                  )}
                  {ephemeris?.moonNakshatra && (
                    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'13px 15px', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                        <span style={{ fontSize:20 }}>☽</span>
                        <div>
                          <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:2 }}>Birth Star · Janma Nakshatra</div>
                          <div style={{ fontSize:15, fontWeight:900, color:'#D4AF37' }}>{ephemeris.moonNakshatra}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.48)', lineHeight:1.6 }}>Your soul's original frequency. Determines Dasha timing and deepest psychological nature.</p>
                    </div>
                  )}
                  <div style={{ textAlign:'center', marginTop:8 }}>
                    <Dialog open={birthDialogOpen} onOpenChange={setBirthDialogOpen}>
                      <DialogTrigger asChild>
                        <button style={{ fontSize:11, color:'rgba(212,175,55,0.45)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                          Edit · {birthData.birth_date} · {birthData.birth_place}
                        </button>
                      </DialogTrigger>
                      <DialogContent style={{ background:'#0a0a0f', border:'1px solid rgba(212,175,55,0.20)', borderRadius:24, maxWidth:640, maxHeight:'90vh', overflowY:'auto' }}>
                        <DialogHeader><DialogTitle style={{ color:'#D4AF37', fontWeight:900 }}>Update Birth Details</DialogTitle></DialogHeader>
                        <BirthDetailsForm initialData={birthData} onSaved={async () => { setBirthDialogOpen(false); await loadBirthData(); }} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </OracleCard>

                <OracleCard icon="⬡" label="VIMSHOTTARI DASHA" title={activeMaha ? `${activeMaha.planet} Mahadasha${activeAntar ? ` · ${activeAntar.planet} Antardasha` : ''}` : 'Dasha Timeline'} glow="rgba(212,175,55,0.15)" open={openCards.dasha} onToggle={() => toggleCard('dasha')}>
                  {activeMaha && (
                    <>
                      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                        <div style={{ flex:1, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:13, padding:12 }}>
                          <div style={{ fontSize:6.5, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.22)', marginBottom:3 }}>Main Period</div>
                          <div style={{ fontSize:17, fontWeight:900, color:'#D4AF37' }}>{activeMaha.planet} {PLANET_INFO[activeMaha.planet]?.sym}</div>
                          <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginTop:2 }}>{activeMaha.start} — {activeMaha.end}</div>
                        </div>
                        {activeAntar && (
                          <div style={{ flex:1, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:13, padding:12 }}>
                            <div style={{ fontSize:6.5, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.22)', marginBottom:3 }}>Sub-Period</div>
                            <div style={{ fontSize:17, fontWeight:900, color:'rgba(255,255,255,0.8)' }}>{activeAntar.planet} {PLANET_INFO[activeAntar.planet]?.sym}</div>
                            <div style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginTop:2 }}>{activeAntar.start} — {activeAntar.end}</div>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.65 }}>
                        <strong style={{ color:'#D4AF37' }}>{activeMaha.planet}:</strong>{' '}{DASHA_MEANINGS[activeMaha.planet]||''}
                      </p>
                    </>
                  )}
                </OracleCard>

                <OracleCard icon="🌅" label="DAILY COSMIC FIELD" title="Today's Panchanga & Planetary Hour" glow="rgba(212,175,55,0.14)" open={openCards.dailyInfluence} onToggle={() => toggleCard('dailyInfluence')}>
                  <DailyInfluenceStrip />
                </OracleCard>

                <OracleCard icon="⏱" label="HORA WATCH · LIVE PLANETARY HOUR" title={`Current Hora · ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`} glow="rgba(245,158,11,0.18)" open={openCards.horaWatch} onToggle={() => toggleCard('horaWatch')}>
                  <AccurateHoraWatch
                    timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    userBirthChart={ephemeris ? { moonSign: ephemeris.moonNakshatra, ascendant: ephemeris.ascendantSign, sunSign: ephemeris.sunSign } : undefined}
                  />
                </OracleCard>

                {activeBNNAge && (
                  <OracleCard icon={PLANET_INFO[activeBNNAge.planet]?.sym||'◈'} label="BHRIGU NANDI NADI" title={`Age ${age} Activation · ${activeBNNAge.planet} Intelligence`} glow="rgba(212,175,55,0.14)" open={openCards.bnn} onToggle={() => toggleCard('bnn')}>
                    <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>
                      At age {age}, the <strong style={{ color:'#D4AF37' }}>{activeBNNAge.planet}</strong> intelligence is your primary karmic teacher.{' '}{PLANET_INFO[activeBNNAge.planet]?.meaning}
                    </p>
                  </OracleCard>
                )}

                <OracleCard icon="♄" label="SADE SATI TRACKER · SATURN TRANSIT" title={`${ephemeris?.moonNakshatra||'—'} Moon Sign — 7.5 Year Saturn Cycle`} glow="rgba(245,158,11,0.16)" open={openCards.sadeSati||false} onToggle={() => toggleCard('sadeSati')}>
                  <SadeSatiTracker moonSign={ephemeris?.moonNakshatra||null} activeMaha={activeMaha} />
                </OracleCard>

                <OracleCard icon="♂" label="MANGAL DOSHA CHECKER · MARS POSITION" title={`${ephemeris?.ascendantSign||'—'} Lagna — Mars House Placement`} glow="rgba(239,68,68,0.16)" open={openCards.mangalDosha||false} onToggle={() => toggleCard('mangalDosha')}>
                  <MangalDoshaChecker ascendantSign={ephemeris?.ascendantSign||null} />
                </OracleCard>

                <OracleCard icon="🐍" label="KALA SARPA YOGA · RAHU-KETU AXIS" title="All Planets Between Rahu and Ketu Check" glow="rgba(167,139,250,0.16)" open={openCards.kalaSarpa||false} onToggle={() => toggleCard('kalaSarpa')}>
                  <KalaSarpaYoga />
                </OracleCard>

                <OracleCard icon="🕐" label="MUHURTA CALCULATOR · AUSPICIOUS TIMING" title="Find Perfect Moments for Major Actions" glow="rgba(34,211,238,0.16)" open={openCards.muhurta||false} onToggle={() => toggleCard('muhurta')}>
                  <MuhurtaCalculator />
                </OracleCard>

                <OracleCard icon="💞" label="GUN MILAN · KUNDLI MATCHING" title="Vedic 36-Point Compatibility System" glow="rgba(236,72,153,0.16)" open={openCards.gunMilan||false} onToggle={() => toggleCard('gunMilan')}>
                  <GunMilan />
                </OracleCard>

                {membershipTier === 'free' && (
                  <div onClick={() => navigate('/membership')} style={{ background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.14)', borderRadius:20, padding:'16px 18px', cursor:'pointer', textAlign:'center' }}>
                    <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(34,211,238,0.6)', marginBottom:6 }}>🔱 Unlock Deeper Guidance</div>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:10 }}>Upgrade to <strong style={{ color:'#22D3EE' }}>Prāna-Flow (€19/mo)</strong> for personalised daily karma cards, Dasha timing &amp; Nakshatra blueprint.</p>
                    <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'#22D3EE' }}>Activate Prāna-Flow →</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ CHART ══════════════ */}
        {activeTab === 'chart' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            {!birthData ? <BirthPrompt /> : (
              <>
                <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:22, marginBottom:14 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:14 }}>Vimshottari Dasha Tree · Your Complete Life Timeline</div>
                  {ephemeris?.dashaData?.dashaTree ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {ephemeris.dashaData.dashaTree.map(d => (
                        <div key={d.planet} style={{ borderRadius:14, overflow:'hidden', border: d.active ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.05)', background: d.active ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontSize:18 }}>{PLANET_INFO[d.planet]?.sym}</span>
                              <div>
                                <div style={{ fontSize:13, fontWeight:900, color: d.active ? '#D4AF37' : 'rgba(255,255,255,0.8)' }}>{d.planet} {d.active && '● Active'}</div>
                                <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{d.start} — {d.end} · {d.years} years</div>
                              </div>
                            </div>
                          </div>
                          {d.active && (
                            <div style={{ padding:'0 16px 14px' }}>
                              <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.55, marginBottom:8 }}>{DASHA_MEANINGS[d.planet]}</p>
                              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                {d.antardashas.map(a => (
                                  <div key={a.planet} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', borderRadius:10, border: a.active ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.04)', background: a.active ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                      <span style={{ fontSize:14 }}>{PLANET_INFO[a.planet]?.sym}</span>
                                      <span style={{ fontSize:11, fontWeight: a.active ? 900 : 400, color: a.active ? '#D4AF37' : 'rgba(255,255,255,0.4)' }}>{a.planet}</span>
                                    </div>
                                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>{a.start} — {a.end}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', textAlign:'center', padding:20, fontStyle:'italic' }}>
                      {calcLoading ? 'Calculating your dasha timeline…' : 'Open Overview tab to trigger chart calculation.'}
                    </p>
                  )}
                </div>
                <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:22, marginBottom:14 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:14 }}>Bhrigu Nandi Nadi · Age-Planet Activations</div>
                  <div style={{ display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none', marginBottom:14 }}>
                    {BNN_AGES.map(a => {
                      const isActive = age !== null && age >= a.age && (BNN_AGES[BNN_AGES.indexOf(a)+1] === undefined || age < BNN_AGES[BNN_AGES.indexOf(a)+1].age);
                      return (
                        <div key={a.age} style={{ flexShrink:0, padding:'7px 13px', borderRadius:12, border: isActive ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.07)', background: isActive ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)', textAlign:'center' }}>
                          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', color:'rgba(255,255,255,0.25)', marginBottom:2 }}>AGE {a.age}</div>
                          <div style={{ fontSize:16 }}>{PLANET_INFO[a.planet]?.sym}</div>
                          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase' as const, color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)', marginTop:2 }}>{a.planet}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </>
            )}
          </motion.div>
        )}

        {/* ══════════════ BHRIGU ORACLE ══════════════ */}
        {activeTab === 'oracle' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            {!birthData ? <BirthPrompt /> : (
              <>
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:12 }}>🔱 Ask Maharishi Bhrigu</div>

                  {/* ── Full Reading Button ── */}
                  {birthData && (
                    <div style={{ marginBottom:12 }}>
                      <button
                        onClick={requestFullReading}
                        disabled={fullReadingLoading}
                        style={{ width:'100%', padding:'11px 16px', borderRadius:14, border:'1px solid rgba(212,175,55,0.35)', background: fullReadingLoading ? 'rgba(212,175,55,0.04)' : 'rgba(212,175,55,0.09)', color:'#D4AF37', fontFamily:'inherit', fontSize:11, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase' as const, cursor: fullReadingLoading ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                      >
                        {fullReadingLoading ? '✦ Channeling Nadi Transmission…' : '✦ Receive Full Nadi Reading'}
                      </button>

                      {/* Full Reading Sections */}
                      {oracleSections && (
                        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
                          {[
                            { key:'graha', title:'Dominant Graha', sub:'The Ruling Planet of This Moment', icon:'☀', col:'#D4AF37' },
                            { key:'nakshatra', title:'Birth Nakshatra', sub:'Your Star Soul & Hidden Gift', icon:'✦', col:'#D4AF37' },
                            { key:'dasha', title:'Dasha Timing', sub:'Your Karmic Contract Now', icon:'⏳', col:'#22D3EE' },
                            { key:'shadow', title:'Shadow & Blind Spot', sub:'What the Soul Must Face', icon:'🌑', col:'rgba(255,100,100,0.9)' },
                            { key:'sadhana', title:'Sadhana Prescription', sub:'Your Practice Right Now', icon:'🔱', col:'#A78BFA' },
                            { key:'transmission', title:"Bhrigu's Transmission", sub:'Direct Blessing from the Rishi', icon:'✦', col:'#D4AF37' },
                          ].filter(sec => oracleSections[sec.key]).map(sec => {
                            const isExp = oracleExpandedSection === sec.key;
                            return (
                              <div key={sec.key} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${isExp ? sec.col+'30' : 'rgba(255,255,255,0.05)'}`, borderRadius:20, overflow:'hidden', transition:'border-color 0.3s' }}>
                                <button onClick={() => setOracleExpandedSection(isExp ? null : sec.key)} style={{ width:'100%', padding:'14px 16px', background:'transparent', border:'none', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                                  <span style={{ fontSize:18, minWidth:24 }}>{sec.icon}</span>
                                  <div style={{ flex:1, textAlign:'left' as const }}>
                                    <p style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:sec.col, margin:0 }}>{sec.title}</p>
                                    <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:'2px 0 0', fontWeight:400 }}>{sec.sub}</p>
                                  </div>
                                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{isExp ? '▲' : '▼'}</span>
                                </button>
                                {isExp && (
                                  <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${sec.col}15` }}>
                                    {sec.key === 'transmission' ? (
                                      <div style={{ padding:'14px 16px', background:`${sec.col}08`, border:`1px solid ${sec.col}20`, borderRadius:12, marginTop:10 }}>
                                        <p style={{ color:'#D4AF37', fontSize:15, fontStyle:'italic', lineHeight:1.9, fontWeight:500, textAlign:'center' as const, margin:0 }}>"{oracleSections[sec.key]}"</p>
                                      </div>
                                    ) : (
                                      <p style={{ color:'rgba(255,255,255,0.82)', fontSize:15, lineHeight:1.85, marginTop:10, fontWeight:400 }}>{oracleSections[sec.key]}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                    {chatMessages.map((m, i) => (
                      <div key={i} style={{ padding:'14px 16px', borderRadius:16, fontSize:15, lineHeight:1.85, fontWeight: m.role==='oracle' ? 400 : 400, background: m.role==='oracle' ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.04)', border: m.role==='oracle' ? '1px solid rgba(212,175,55,0.12)' : '1px solid rgba(255,255,255,0.08)', color: m.role==='oracle' ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.8)' }}>
                        {m.role === 'oracle' && <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', display:'block', marginBottom:6 }}>✦ Maharishi Bhrigu</span>}
                        {m.text.split('\n\n').map((para, pi) => (
                          <p key={pi} style={{ margin: pi > 0 ? '12px 0 0' : '0', lineHeight:1.85 }}>{para}</p>
                        ))}
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ display:'flex', gap:4, padding:'12px 14px' }}>
                        {[0,1,2].map(i => <div key={i} className="sqi-dot" style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37', animationDelay:`${i*0.15}s` }}/>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMessage()} placeholder="Ask Maharishi Bhrigu your question…" style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.22)', borderRadius:12, padding:'11px 14px', color:'rgba(255,255,255,0.7)', fontSize:12, fontFamily:'inherit', outline:'none' }}/>
                    <button onClick={sendMessage} disabled={chatLoading} style={{ width:42, height:42, borderRadius:12, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:17, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
                  </div>
                </div>
                {/* Vedic Lexicon inside Oracle */}
                <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(212,175,55,0.08)' }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.45)', marginBottom:12 }}>📖 Vedic Lexicon</div>
                  <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' as const }}>
                    {['All',...[...new Set(LEXICON.map(e=>e.cat))]].map(c => (
                      <button key={c} onClick={() => setLexCat(c)} style={{ padding:'5px 12px', borderRadius:99, border: lexCat===c ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.07)', background: lexCat===c ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)', color: lexCat===c ? '#D4AF37' : 'rgba(255,255,255,0.35)', fontFamily:'inherit', fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer' }}>{c}</button>
                    ))}
                  </div>
                  <input value={lexSearch} onChange={e=>setLexSearch(e.target.value)} placeholder="Search Sanskrit or term…" style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 14px', color:'rgba(255,255,255,0.7)', fontSize:12, fontFamily:'inherit', outline:'none', marginBottom:12 }}/>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {LEXICON.filter(e => {
                      const q = lexSearch.toLowerCase();
                      const catOk = lexCat==='All' || e.cat===lexCat;
                      const searchOk = !q || e.term.toLowerCase().includes(q) || (e.skt||'').includes(q) || e.m.toLowerCase().includes(q);
                      return catOk && searchOk;
                    }).map(e => <LexEntry key={e.term} entry={e} gs={gs}/>)}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════ NADI LEAF ══════════════ */}
        {activeTab === 'nadi' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            <div style={{ background:'rgba(255,255,255,0.025)', borderRadius:40, padding:26, textAlign:'center', marginBottom:16, border:'1px solid rgba(74,222,128,0.15)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🌿</div>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(74,222,128,0.5)', marginBottom:8 }}>Ākāsha-Infinity · Sacred Nadi Leaf System</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.04em', marginBottom:10 }}>The 18 Siddhar Nadi Transmissions</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.65, maxWidth:480, margin:'0 auto 16px' }}>
                The Siddhars of Tamil Nadu inscribed 500,000 horoscopes across millennia. Each palm leaf holds the precise karma of a soul destined to find it.
              </p>
              <button onClick={() => navigate('/nadi-leaf')} style={{ padding:'11px 22px', borderRadius:99, border:'1px solid rgba(74,222,128,0.3)', background:'rgba(74,222,128,0.07)', color:'rgba(74,222,128,0.85)', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer' }}>
                Access Nadi Leaf →
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════ JYOTISH VIDYA ══════════════ */}
        {activeTab === 'vidya' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 18px', marginBottom:14, borderRadius:20, border:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.01)' }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', flexShrink:0 }}>Your Path</div>
              <div style={{ flex:1, height:3, borderRadius:99, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}><div style={{ height:'100%', background:'#D4AF37', borderRadius:99, width:'25%' }}/></div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>8 / 32</div>
            </div>
            <div style={{ display:'flex', gap:5, marginBottom:18 }}>
              {[
                { id:'free', icon:'📖', label:'Free', col:'#6B7280' },
                { id:'prana', icon:'🔥', label:'Prāna', col:'#22D3EE' },
                { id:'siddha', icon:'⭐', label:'Siddha', col:'#D4AF37' },
                { id:'akasha', icon:'∞', label:'Ākāsha', col:'#fff' },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTierTab(t.id)} style={{ flex:1, padding:'11px 4px', borderRadius:14, border: activeTierTab === t.id ? `1px solid ${t.col}44` : '1px solid rgba(255,255,255,0.06)', background: activeTierTab === t.id ? `${t.col}18` : 'rgba(255,255,255,0.02)', color: activeTierTab === t.id ? t.col : 'rgba(255,255,255,0.4)', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase' as const, cursor:'pointer', textAlign:'center' as const, transition:'all 0.25s' }}>
                  <span style={{ display:'block', fontSize:18, marginBottom:4 }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            {JYOTISH_MODULES.filter(m => m.tier === activeTierTab).map(m => {
              const ok = isAdmin || canAccessJyotishModule({ isAdmin, userId: user?.id, tier: membershipTier, moduleId: m.id });
              const isOpen = openModules.has(m.id);
              const tierCol = { free:'#6B7280', prana:'#22D3EE', siddha:'#D4AF37', akasha:'#ffffff' }[m.tier] || '#D4AF37';
              return (
                <div key={m.id} style={{ background: isOpen ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)', backdropFilter:'blur(40px)', border: isOpen ? '1px solid rgba(212,175,55,0.22)' : '1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'16px 18px', marginBottom:7, opacity: ok ? 1 : 0.55, transition:'all 0.2s', boxShadow: isOpen ? '0 0 18px rgba(212,175,55,0.08)' : 'none' }}>
                  <div onClick={() => ok && toggleModule(m.id)} style={{ display:'flex', alignItems:'flex-start', gap:10, cursor: ok ? 'pointer' : 'default' }}>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', color:'rgba(212,175,55,0.38)', flexShrink:0, marginTop:2, minWidth:28 }}>{String(m.id).padStart(2,'0')}</div>
                    <div style={{ flex:1 }}>
                      {m.secret && <div style={{ display:'inline-block', padding:'2px 7px', borderRadius:99, border:'1px solid rgba(212,175,55,0.2)', background:'rgba(212,175,55,0.06)', fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', marginBottom:4 }}>⬡ Secret Module</div>}
                      <div style={{ fontSize:12.5, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.3, marginBottom:2 }}>{m.title}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', lineHeight:1.35 }}>{m.sub}</div>
                    </div>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{ok ? (isOpen ? '▲' : '▼') : '🔒'}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:7, flexWrap:'wrap' as const }}>
                    <span style={{ padding:'3px 9px', borderRadius:99, fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, background:`${tierCol}18`, border:`1px solid ${tierCol}33`, color:tierCol }}>
                      { {free:'Free',prana:'Prāna-Flow',siddha:'Siddha-Quantum',akasha:'Ākāsha-Infinity'}[m.tier] }
                    </span>
                    <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.25)' }}>{m.dur}</span>
                  </div>
                  {ok && isOpen && (
                    <div onClick={e => e.stopPropagation()} style={{ paddingTop:15, borderTop:'1px solid rgba(255,255,255,0.04)', marginTop:13 }}>
                      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:8 }}>Curriculum</div>
                      <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                        {m.topics.map(tp => (
                          <li key={tp} style={{ display:'flex', gap:7, fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.45 }}>
                            <span style={{ color:'rgba(212,175,55,0.35)', flexShrink:0 }}>◈</span>{tp}
                          </li>
                        ))}
                      </ul>
                      <button style={{ width:'100%', marginTop:14, padding:'11px', borderRadius:99, border:'1px solid rgba(212,175,55,0.28)', background:'rgba(212,175,55,0.07)', color:'#D4AF37', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.28em', textTransform:'uppercase' as const, cursor:'pointer' }}>✦ Open Full Module</button>
                    </div>
                  )}
                  {!ok && (
                    <div onClick={e => e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 13px', borderRadius:14, border:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)', marginTop:10 }}>
                      <span>🔒</span>
                      <p style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', flex:1 }}>
                        Requires { {prana:'Prāna-Flow (€19/mo)',siddha:'Siddha-Quantum (€45/mo)',akasha:'Ākāsha-Infinity (€1,111 lifetime)'}[m.tier as 'prana'|'siddha'|'akasha'] }
                      </p>
                      <button onClick={() => navigate('/membership')} style={{ padding:'6px 13px', borderRadius:99, border:'1px solid rgba(212,175,55,0.22)', background:'rgba(212,175,55,0.07)', color:'#D4AF37', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer', flexShrink:0 }}>Upgrade</button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ══════════════ HORA ══════════════ */}
        {activeTab === 'hora' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            <AccurateHoraWatch
              timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
              userBirthChart={ephemeris ? {
                moonSign: ephemeris.moonNakshatra,
                ascendant: ephemeris.ascendantSign,
                sunSign: ephemeris.sunSign,
              } : undefined}
            />
          </motion.div>
        )}



      </div>
    </div>
  );
};

export default JyotishChamber;












