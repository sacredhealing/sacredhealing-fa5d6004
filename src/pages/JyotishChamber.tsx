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
  'prana-flow': ['free','prana'],
  'prana-flow-monthly': ['free','prana'],
  'siddha-quantum': ['free','prana','siddha'],
  'akasha-infinity': ['free','prana','siddha','akasha'],
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

// ── Oracle responses ─────────────────────────────────────────────
const ORACLE_RESPONSES = [
  'Your Rahu Mahadasha is the most karmic 18-year corridor of your Vimshottari cycle. The Bhakti-Algorithm is precise — Rahu amplifies your dharmic calling and places foreign influence, digital realms, and unconventional paths at the centre of your karmic curriculum. The Jupiter Antardasha (the current sub-period) is your peak expansion window. Any spiritual platform, teaching, or community built now carries exponential dharmic momentum encoded in the Akasha. Bhrigu prescription: Om Rāhave Namaḥ, 18 repetitions at dusk. Feed the hungry on Saturdays.',
  'Your Bhrigu Bindu is the most sensitive oracle point in your chart — the midpoint between Rahu and Moon. When Saturn, Jupiter, or Rahu/Ketu transit this degree, the most significant events of your life unfold. The Vedic Light-Code is clear: track this degree every 6 months. The current Rahu-Jupiter Antardasha activates your Bindu at peak intensity — the dharmic breakthrough window is precisely now.',
  'The 7th house reveals your karmic relationship blueprint — what the soul contracted to experience through partnership. Venus placement amplifies the Prema-Pulse Transmission: the capacity for beauty and harmonious relating. The Upapada Lagna (Jaimini indicator for marriage quality) confirms: your relationship dharma involves soul-level partnership, healing through love, and the mastery of holding sacred space for another.',
  'Your Atmakaraka — the soul planet at the highest degree — carries the primary mission of this incarnation. The Karakamsha (Atmakaraka in Navamsha) reveals your dharmic path with clarity. The Akasha-Neural Archive confirms: your soul contracted to build sacred systems and platforms that serve humanity awakening. The current dasha period activates this mission with full cosmic support.',
];

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
const JyotishChamber: React.FC = () => {
  const { user } = useAuth();
  const { membershipTier, isAdmin } = useMembership();
  useTranslation();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'overview'|'chart'|'oracle'|'nadi'|'vidya'|'hora'|'lexicon'>('overview');
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [ephemeris, setEphemeris] = useState<EphemerisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [birthDialogOpen, setBirthDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role:'user'|'oracle', text:string}>>([
    { role:'oracle', text:'I have read your Akashic record across 108 lifetimes. The Rahu-Jupiter period you enter now is among the most expansive in your entire 120-year Vimshottari cycle. Speak your query and I shall illuminate what the stars have encoded for your liberation.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(true);
  const [lexSearch, setLexSearch] = useState('');
  const [lexCat, setLexCat] = useState('All');
  const [activeTierTab, setActiveTierTab] = useState('free');
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [openNadi, setOpenNadi] = useState<string|null>(null);
  const [builtTabs, setBuiltTabs] = useState<Set<string>>(new Set(['overview']));
  const oracleIdx = useRef(0);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Tier access
  const userTier = isAdmin ? 'admin' : (membershipTier || 'free');
  const accessibleTiers = TIER_ACCESS[userTier] || ['free'];
  const canAccess = (modTier: string) => accessibleTiers.includes(modTier);

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
      .select('moon_nakshatra, ascendant, sun_sign, dasha_data, ephemeris_confirmed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (cached?.moon_nakshatra) {
      setEphemeris({
        moonNakshatra: cached.moon_nakshatra,
        moonLongitude: 0,
        ascendantSign: cached.ascendant || '',
        sunSign: cached.sun_sign || '',
        dashaData: cached.dasha_data as any,
      });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Chat ─────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role:'user', text:q }]);
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 1600 + Math.random() * 800));
    const resp = ORACLE_RESPONSES[oracleIdx.current % ORACLE_RESPONSES.length];
    oracleIdx.current++;
    setChatMessages(prev => [...prev, { role:'oracle', text:resp }]);
    setChatLoading(false);
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior:'smooth' }), 100);
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

        {/* ── HEADER ── */}
        <header style={{ textAlign:'center', padding:'44px 0 32px' }}>
          <div style={{ width:80, height:80, margin:'0 auto 16px' }}>
            <svg viewBox="0 0 100 100" fill="none" className="sqi-rot" style={{ width:'100%', height:'100%' }}>
              <circle cx="50" cy="50" r="46" stroke="rgba(212,175,55,.14)" strokeWidth=".8"/>
              <circle cx="50" cy="50" r="36" stroke="rgba(212,175,55,.09)" strokeWidth=".8" strokeDasharray="3 3"/>
              <circle cx="50" cy="50" r="24" stroke="rgba(212,175,55,.16)" strokeWidth=".8"/>
              <circle cx="50" cy="50" r="12" stroke="rgba(212,175,55,.22)" strokeWidth=".8"/>
              <path d="M50 4 L53 47 L50 50 L47 47Z" fill="rgba(212,175,55,.28)"/>
              <path d="M96 50 L53 53 L50 50 L53 47Z" fill="rgba(212,175,55,.18)"/>
              <path d="M50 96 L47 53 L50 50 L53 53Z" fill="rgba(212,175,55,.23)"/>
              <path d="M4 50 L47 47 L50 50 L47 53Z" fill="rgba(212,175,55,.18)"/>
              <circle cx="50" cy="50" r="4" fill="rgba(212,175,55,.6)"/>
            </svg>
          </div>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:9 }}>
            Bhrigu Nadi Chamber · SQI 2050 · Akasha-Neural Archive
          </div>
          <h1 className="sqi-shimmer" style={{ fontSize:'clamp(2rem,6vw,3rem)', fontWeight:900, letterSpacing:'-0.05em', lineHeight:1.1, marginBottom:10 }}>
            Jyotish Vidya
          </h1>
          <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:15, color:'rgba(255,255,255,0.4)', marginBottom:18 }}>
            "The stars do not imprison you. They reveal the karma you came to transform." — Maharishi Bhrigu
          </p>
          {birthData && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 16px', borderRadius:99, border:'1px solid rgba(212,175,55,0.18)', background:'rgba(212,175,55,0.07)', fontSize:9, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37' }}>
              ⬡ Natal Blueprint Active · {birthData.birth_name}
            </div>
          )}
        </header>

        {/* ── NAV ── */}
        <nav style={{ display:'flex', gap:5, padding:5, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:99, marginBottom:22, overflowX:'auto', scrollbarWidth:'none' }}>
          {(['overview','chart','oracle','nadi','vidya','hora','lexicon'] as const).map((tab, i) => {
            const labels = ['⬡ Overview','✦ My Chart','🔱 Oracle','🌿 Nadi Leaf','◈ Vidya','⏱ Hora','📖 Lexicon'];
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
              <>
                {/* Stats row */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
                  {[
                    { val: ephemeris?.ascendantSign ? (SIGN_SYMBOLS[ephemeris.ascendantSign] || '?') + ' ' + ephemeris.ascendantSign : calcLoading ? '…' : '—', lbl:'Rising Sign / Lagna' },
                    { val: ephemeris?.moonNakshatra || (calcLoading ? '…' : '—'), lbl:'Moon Nakshatra' },
                    { val: activeMaha?.planet || (calcLoading ? '…' : '—'), lbl:'Mahadasha' },
                    { val: activeAntar?.planet || (calcLoading ? '…' : '—'), lbl:'Antardasha' },
                  ].map(s => (
                    <div key={s.lbl} style={{ ...gs, padding:'14px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:s.val.length > 8 ? 11 : 16, fontWeight:900, color:'#D4AF37', lineHeight:1.1, marginBottom:5, letterSpacing:'-0.02em' }}>{s.val}</div>
                      <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', lineHeight:1.3 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Bhrigu quote */}
                <div style={{ ...g, padding:'24px 26px', marginBottom:18, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-14, left:14, fontSize:90, fontFamily:'Georgia,serif', color:'rgba(212,175,55,0.07)', lineHeight:1 }}>"</div>
                  <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.7, position:'relative' }}>
                    "Your birth chart is not a sentence — it is a Bhakti-Algorithm. The planets encode the precise Prema-Pulse Transmissions your soul contracted to master. When understood fully, every planet becomes an ally in your liberation."
                  </p>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.4)', marginTop:12 }}>
                    — Maharishi Bhrigu · Akasha-Neural Transmission 2050→2026
                  </div>
                </div>

                {/* Current chart summary - beginner friendly */}
                <div style={{ ...gm, padding:22, marginBottom:18 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:14 }}>
                    Your Vedic Natal Blueprint — {birthData.birth_name}
                  </div>
                  {calcLoading ? (
                    <div style={{ textAlign:'center', padding:20 }}>
                      <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:10 }}>
                        {[0,1,2].map(i => <div key={i} className="sqi-dot" style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37', animationDelay:`${i*0.15}s` }}/>)}
                      </div>
                      <p style={{ fontSize:11, color:'rgba(212,175,55,0.5)', letterSpacing:'0.3em' }}>Calculating your planetary positions via VedAstro ephemeris…</p>
                    </div>
                  ) : ephemeris ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {/* Lagna */}
                      {ephemeris.ascendantSign && (
                        <div style={{ ...gs, padding:'16px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <span style={{ fontSize:24 }}>{SIGN_SYMBOLS[ephemeris.ascendantSign] || '♏'}</span>
                            <div>
                              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:2 }}>Lagna — Your Rising Sign</div>
                              <div style={{ fontSize:18, fontWeight:900, color:'#D4AF37' }}>{ephemeris.ascendantSign}</div>
                            </div>
                          </div>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                            {SIGN_MEANINGS[ephemeris.ascendantSign] || 'Your Lagna shapes your physical body, personality, and the entire lens through which life is experienced.'}
                          </p>
                          <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:8, fontStyle:'italic' }}>
                            This is the sign that was rising on the eastern horizon at the exact moment of your birth. It is the most important point in your chart.
                          </p>
                        </div>
                      )}

                      {/* Moon Nakshatra */}
                      {ephemeris.moonNakshatra && (
                        <div style={{ ...gs, padding:'16px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <span style={{ fontSize:24 }}>☽</span>
                            <div>
                              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:2 }}>Your Birth Star (Janma Nakshatra)</div>
                              <div style={{ fontSize:18, fontWeight:900, color:'#D4AF37' }}>{ephemeris.moonNakshatra}</div>
                            </div>
                          </div>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                            Your birth star encodes your soul's original frequency. This Nakshatra determines your Dasha starting point and reveals your deepest psychological and spiritual nature.
                          </p>
                        </div>
                      )}

                      {/* Sun Sign */}
                      {ephemeris.sunSign && (
                        <div style={{ ...gs, padding:'16px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <span style={{ fontSize:24 }}>☉</span>
                            <div>
                              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:2 }}>Sun Sign (Sidereal / Vedic)</div>
                              <div style={{ fontSize:18, fontWeight:900, color:'#D4AF37' }}>{ephemeris.sunSign}</div>
                            </div>
                          </div>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                            Note: Your Vedic Sun sign may differ from your Western Sun sign by approximately 23 days. Vedic astrology uses the actual star positions (sidereal), not a fixed mathematical calculation.
                          </p>
                        </div>
                      )}

                      {/* Dasha */}
                      {activeMaha && (
                        <div style={{ ...gs, padding:'16px 18px', borderColor:'rgba(212,175,55,0.2)' }}>
                          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:10 }}>
                            Your Current Karmic Chapter (Vimshottari Dasha)
                          </div>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>Main Period (Mahadasha)</div>
                              <div style={{ fontSize:20, fontWeight:900, color:'#D4AF37' }}>{activeMaha.planet} {PLANET_INFO[activeMaha.planet]?.sym}</div>
                              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{activeMaha.start} — {activeMaha.end} · {activeMaha.years} years</div>
                            </div>
                            {activeAntar && (
                              <div style={{ flex:1, paddingLeft:12, borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>Sub-Period (Antardasha)</div>
                                <div style={{ fontSize:20, fontWeight:900, color:'#fff' }}>{activeAntar.planet} {PLANET_INFO[activeAntar.planet]?.sym}</div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{activeAntar.start} — {activeAntar.end}</div>
                              </div>
                            )}
                          </div>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                            <strong style={{ color:'#D4AF37' }}>{activeMaha.planet} Mahadasha:</strong>{" "}
                            {DASHA_MEANINGS[activeMaha.planet] || 'This period brings the specific karmic curriculum of this planet into focus for its entire duration.'}
                          </p>
                          {activeAntar && (
                            <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.55, marginTop:8 }}>
                              <strong style={{ color:'rgba(255,255,255,0.6)' }}>{activeAntar.planet} Antardasha adds:</strong>{" "}
                              {DASHA_MEANINGS[activeAntar.planet] || ''}
                            </p>
                          )}
                        </div>
                      )}

                      {/* BNN Active Planet */}
                      {activeBNNAge && (
                        <div style={{ ...gs, padding:'14px 18px' }}>
                          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:6 }}>
                            BNN Age Activation — Bhrigu Nandi Nadi
                          </div>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                            At age {age}, the{" "}
                            <strong style={{ color:'#D4AF37' }}>{activeBNNAge.planet}</strong> intelligence is your primary karmic teacher.{" "}
                            {PLANET_INFO[activeBNNAge.planet]?.meaning}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textAlign:'center', padding:'16px 0', fontStyle:'italic' }}>
                        Your chart is being calculated. This may take a moment for the first calculation.
                      </p>
                      <button onClick={() => calculateEphemeris(birthData!)} style={{
                        padding:'11px 20px', borderRadius:99, border:'1px solid rgba(212,175,55,0.3)',
                        background:'rgba(212,175,55,0.08)', color:'#D4AF37',
                        fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.3em',
                        textTransform:'uppercase' as const, cursor:'pointer', margin:'0 auto', display:'block'
                      }}>✦ Calculate My Chart</button>
                    </div>
                  )}
                </div>

                {/* Edit birth data */}
                <div style={{ textAlign:'center', marginBottom:18 }}>
                  <Dialog open={birthDialogOpen} onOpenChange={setBirthDialogOpen}>
                    <DialogTrigger asChild>
                      <button style={{ fontSize:11, color:'rgba(212,175,55,0.5)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                        Edit birth details · {birthData.birth_date} · {birthData.birth_place}
                      </button>
                    </DialogTrigger>
                    <DialogContent style={{ background:'#0a0a0f', border:'1px solid rgba(212,175,55,0.20)', borderRadius:24, maxWidth:640, maxHeight:'90vh', overflowY:'auto' }}>
                      <DialogHeader>
                        <DialogTitle style={{ color:'#D4AF37', fontWeight:900 }}>Update Birth Details</DialogTitle>
                      </DialogHeader>
                      <BirthDetailsForm initialData={birthData} onSaved={async () => {
                        setBirthDialogOpen(false);
                        await loadBirthData();
                      }} />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Navagraha strip */}
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', textAlign:'center', marginBottom:10 }}>
                  Navagraha · Nine Cosmic Intelligences
                </div>
                <div style={{ display:'flex', gap:7, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', marginBottom:16 }}>
                  {Object.entries(PLANET_INFO).map(([p, info]) => (
                    <div key={p} style={{ flexShrink:0, padding:'8px 12px', borderRadius:99, border:activeMaha?.planet === p ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.06)', background:activeMaha?.planet === p ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', textAlign:'center' }}>
                      <span style={{ fontSize:15, display:'block', marginBottom:2 }}>{info.sym}</span>
                      <span style={{ fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:activeMaha?.planet === p ? '#D4AF37' : 'rgba(255,255,255,0.25)' }}>{p}</span>
                    </div>
                  ))}
                </div>

                {/* Free tier note */}
                {membershipTier === 'free' && (
                  <div style={{ ...gs, padding:'14px 18px', borderColor:'rgba(107,114,128,0.2)', marginBottom:16 }}>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(107,114,128,0.7)', marginBottom:8 }}>Free Tier · Basic Reading</div>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>
                      Your chart is activated. Upgrade to <strong style={{ color:'#22D3EE' }}>Prāna-Flow (€19/mo)</strong> to access the full Bhrigu Oracle chat, advanced dasha analysis, and complete planetary interpretation.
                    </p>
                    <button onClick={() => navigate('/membership')} style={{ marginTop:12, padding:'9px 18px', borderRadius:99, border:'1px solid rgba(34,211,238,0.3)', background:'rgba(34,211,238,0.07)', color:'#22D3EE', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer' }}>
                      Activate Prāna-Flow
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════ CHART ══════════════ */}
        {activeTab === 'chart' && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            {!birthData ? <BirthPrompt /> : (
              <>
                {/* Dasha tree */}
                <div style={{ ...gm, padding:22, marginBottom:14 }}>
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
                      {calcLoading ? 'Calculating your dasha timeline…' : 'Dasha data not yet calculated. Open Overview tab to trigger calculation.'}
                    </p>
                  )}
                </div>

                {/* BNN age-planet activations */}
                <div style={{ ...gm, padding:22, marginBottom:14 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:6 }}>Bhrigu Nandi Nadi · Age-Planet Activations</div>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5, marginBottom:12 }}>Each age activates a specific planetary intelligence. This is your current primary karmic teacher according to BNN.</p>
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
                  {activeBNNAge && (
                    <div style={{ ...gs, padding:'13px 16px', borderColor:'rgba(212,175,55,0.14)' }}>
                      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.6)', marginBottom:4 }}>Active: {activeBNNAge.planet}</div>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.6 }}>
                        {PLANET_INFO[activeBNNAge.planet]?.meaning}. <strong style={{ color:'rgba(255,255,255,0.5)' }}>Mantra:</strong>{" "}
                        <em>{PLANET_INFO[activeBNNAge.planet]?.mantra}</em>
                      </p>
                    </div>
                  )}
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
                {/* Quick readings */}
                <div style={{ ...gm, padding:20, marginBottom:14 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:12 }}>Quick Readings — Tap to Activate</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                    {[
                      { icon:'☊', label:'Rahu Cycle', q:'Read my Rahu Mahadasha — karmic curriculum, breakthrough windows, and what to navigate carefully.' },
                      { icon:'♄', label:'Financial Verdict', q:'Financial verdict for my current dasha period. Best action months and what to avoid.' },
                      { icon:'♀', label:'Relationship Karma', q:'Analyse my relationship karma from Venus and 7th house. What soul-pattern is being resolved?' },
                      { icon:'🕉', label:'Soul Mission', q:'What is my Atmakaraka and what does it reveal about my soul mission in this incarnation?' },
                      { icon:'♃', label:'Dharma Path', q:'Read my 10th house and Saturn for dharmic career direction and timing.' },
                      { icon:'🔱', label:'Bhrigu Remedy', q:'Identify the primary karmic obstacle and prescribe the Bhrigu remedy with mantra.' },
                      { icon:'☋', label:'Ketu Karma', q:'What does my Ketu reveal about past-life mastery and what I came to release this life?' },
                      { icon:'⭐', label:'Timing Oracle', q:'Is my current dasha period auspicious for my spiritual platform? Precise timing.' },
                      { icon:'📿', label:'Graha Sādhana', q:'Prescribe the optimal Graha sādhana — mantra, gem, and practice — for my weakest planet.' },
                    ].map(qa => (
                      <button key={qa.label} onClick={() => { setChatInput(qa.q); setOracleOpen(true); }} style={{
                        padding:'10px 8px', borderRadius:14, border:'1px solid rgba(212,175,55,0.12)',
                        background:'rgba(212,175,55,0.04)', color:'rgba(255,255,255,0.6)',
                        fontFamily:'inherit', fontSize:9, fontWeight:800, textAlign:'left' as const,
                        cursor:'pointer', lineHeight:1.4, transition:'all 0.2s'
                      }}>
                        <span style={{ display:'block', fontSize:14, marginBottom:3 }}>{qa.icon}</span>
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tier note */}
                {membershipTier === 'free' && (
                  <div style={{ ...gs, padding:'13px 18px', marginBottom:14, borderColor:'rgba(34,211,238,0.15)', background:'rgba(34,211,238,0.03)', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:20 }}>🔥</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(34,211,238,0.7)', marginBottom:3 }}>Prāna-Flow · Full Oracle Access</div>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Birth-chart aware Oracle. 10 consultations/month. Deep personalised readings.</p>
                    </div>
                    <button onClick={() => navigate('/membership')} style={{ padding:'6px 13px', borderRadius:99, border:'1px solid rgba(34,211,238,0.3)', background:'rgba(34,211,238,0.07)', color:'#22D3EE', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer', flexShrink:0 }}>€19/mo</button>
                  </div>
                )}

                {/* Oracle chat */}
                <div style={{ ...g, marginBottom:14 }}>
                  <div style={{ padding:'16px 16px 0', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.04)', paddingBottom:12, marginBottom:0 }}>
                    <div style={{ width:38, height:38, borderRadius:99, border:'1px solid rgba(212,175,55,0.3)', background:'rgba(212,175,55,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, position:'relative', flexShrink:0 }}>
                      🔱<div className="sqi-pulse" style={{ position:'absolute', width:8, height:8, background:'#D4AF37', borderRadius:'50%', bottom:0, right:0 }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:900, letterSpacing:'-0.02em' }}>Maharishi Bhrigu</div>
                      <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase' as const, color:'#D4AF37', marginTop:1 }}>◉ Vedic Light-Codes Streaming</div>
                    </div>
                  </div>
                  {(
                    <>
                      <div style={{ padding:'0 0 12px', display:'flex', flexDirection:'column', gap:0 }}>
                        {chatMessages.map((m, i) => (
                          {m.role === 'user' ? (
                            <div style={{ display:'flex', justifyContent:'flex-end', width:'100%', padding:'8px 16px' }}>
                              <div style={{ maxWidth:'88%', position:'relative', padding:'14px 20px', background:'rgba(212,175,55,0.03)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ position:'absolute', top:5, right:5, width:10, height:10, borderTop:'1px solid rgba(212,175,55,0.2)', borderRight:'1px solid rgba(212,175,55,0.2)'}} />
                                <p style={{ fontFamily:"'Cinzel', serif", fontSize:7, letterSpacing:'0.4em', color:'rgba(212,175,55,0.28)', textTransform:'uppercase' as const, marginBottom:8 }}>The Seeker inquires</p>
                                <div style={{ fontFamily:"'IM Fell English', Georgia, serif", fontStyle:'italic', fontSize:15, color:'rgba(200,184,154,0.75)', lineHeight:1.65, wordBreak:'break-word' as const }}>{m.text}</div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ width:'100%', position:'relative', padding:'20px 16px 14px', background:'rgba(255,255,255,0.016)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                              <p style={{ fontFamily:"'Cinzel', serif", fontSize:7, letterSpacing:'0.45em', color:'rgba(212,175,55,0.5)', textTransform:'uppercase' as const, marginBottom:10 }}>◈ Maharishi Bhrigu Transmits</p>
                              <div style={{ fontFamily:"'IM Fell English', Georgia, serif", fontSize:16, lineHeight:1.9, color:'rgba(225,210,185,0.9)', letterSpacing:'0.008em', wordBreak:'break-word' as const }}>{m.text}</div>
                            </div>
                          )}
                        ))}
                        {chatLoading && (
                          <div style={{ width:'100%', padding:'20px 16px', background:'rgba(255,255,255,0.016)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontFamily:"'Cinzel', serif", fontSize:7, letterSpacing:'0.45em', color:'rgba(212,175,55,0.5)', textTransform:'uppercase' as const, marginBottom:12 }}>◈ Maharishi Bhrigu Transmits</p>
                            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                              {[0,1,2].map(i => <div key={i} className="sqi-dot" style={{ width:7, height:7, borderRadius:'50%', background:'#D4AF37', animationDelay:`${i*0.15}s` }}/>)}
                            </div>
                          </div>
                        )}
                        <div ref={messagesEnd}/>
                      </div>
                      <div style={{ display:'flex', gap:8, padding:'12px 16px 20px', alignItems:'flex-end', borderTop:'1px solid rgba(212,175,55,0.08)', background:'rgba(0,0,0,0.3)', backdropFilter:'blur(20px)' }}>
                        <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.14)', borderRadius:14, padding:'4px 14px', minHeight:44 }}>
                        <textarea
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                          placeholder="Ask Maharishi Bhrigu…"
                          rows={1}
                          style={{ flex:1, minHeight:44, maxHeight:120, resize:'none' as const, background:'transparent', border:'none', outline:'none', color:'rgba(255,255,255,0.9)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, lineHeight:1.55, fontWeight:400, padding:'6px 8px', minHeight:36, alignSelf:'center' as const }}
                        />
                        </div>
                        <button onClick={sendMessage} style={{ width:44, height:44, borderRadius:99, border:'none', background:'linear-gradient(135deg,rgba(212,175,55,0.5),rgba(212,175,55,0.22))', color:'#D4AF37', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>➤</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════ NADI LEAF ══════════════ */}
        {activeTab === 'nadi' && builtTabs.has('nadi') && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            <div style={{ ...g, padding:26, textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🌿</div>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:8 }}>Ākāsha-Infinity · Sacred Nadi Leaf System</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.04em', marginBottom:10 }}>The 18 Siddhar Nadi Transmissions</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.65, maxWidth:480, margin:'0 auto' }}>
                Encoded 5,000 years ago by Tamil Siddhars who accessed all future timelines through the Akasha. Each lineage holds a unique key to the soul's karmic record. Select a lineage to open its transmission.
              </p>
            </div>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', textAlign:'center', marginBottom:12 }}>Select a Nadi Lineage</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[
                { id:'agastya', ico:'🌊', nm:'Agastya Nadi', desc:'Root of all Nadi science' },
                { id:'bhrigu', ico:'📜', nm:'Bhrigu Samhitā', desc:'500,000 horoscopes · Bhrigu Bindu' },
                { id:'bnn', ico:'🔮', nm:'Bhrigu Nandi Nadi', desc:'Conjunction grammar · event prediction' },
                { id:'saptarishi', ico:'⭐', nm:'Saptarishi Nadi', desc:'Seven Rishis · 16 Kāṇḍas' },
                { id:'thirumoolar', ico:'🔱', nm:'Thirumoolar Nadi', desc:'Tantric patterns · Kundalini' },
                { id:'svara', ico:'🌬', nm:'Svara Shāstra', desc:'Breath Oracle · no chart needed' },
              ].map(n => (
                <div key={n.id} style={{ ...gs, padding:'16px 12px', textAlign:'center', cursor:'pointer' }} onClick={() => setOpenNadi(openNadi === n.id ? null : n.id)}>
                  <div style={{ fontSize:22, marginBottom:7 }}>{n.ico}</div>
                  <div style={{ fontSize:10, fontWeight:900, marginBottom:3 }}>{n.nm}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', lineHeight:1.4 }}>{n.desc}</div>
                </div>
              ))}
            </div>
            {/* Bhrigu Bindu calculator always visible */}
            <div style={{ ...gm, padding:22, marginBottom:14 }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:10 }}>Bhrigu Bindu Calculator</div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:14 }}>
                The Bhrigu Bindu is the midpoint between your Rahu and Moon longitudes (0–360°). Any slow planet transiting this degree triggers the most significant events of your life.
              </p>
              {birthData && ephemeris?.moonLongitude && ephemeris.moonLongitude > 0 ? (
                <div style={{ ...gs, padding:'14px 16px', borderColor:'rgba(212,175,55,0.2)' }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.6)', marginBottom:5 }}>Auto-Calculated from Your Chart</div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                    Your Moon longitude is {ephemeris.moonLongitude.toFixed(2)}°. Enter your Rahu longitude below to calculate your Bhrigu Bindu.
                  </p>
                </div>
              ) : null}
            </div>
            {openNadi === 'svara' && (
              <div style={{ ...g, padding:26, marginBottom:14 }}>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:10 }}>Svara Shāstra · Module 28 · Deepest Siddha Secret</div>
                <div style={{ display:'inline-block', padding:'2px 7px', borderRadius:99, border:'1px solid rgba(212,175,55,0.2)', background:'rgba(212,175,55,0.06)', fontSize:7, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase' as const, color:'#D4AF37', marginBottom:12 }}>⬡ Ākāsha-Infinity Only</div>
                <h3 style={{ fontSize:16, fontWeight:900, letterSpacing:'-0.03em', marginBottom:8 }}>Predicting Without a Chart — The Breath Alone</h3>
                <p style={{ fontFamily:'Georgia,serif', fontStyle:'italic', fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.65, marginBottom:14 }}>"When the left nostril flows — Moon is active, water, success in travel. When the right — Sun, fire, success in physical work. When both flow equally — Suṣumnā — do nothing material. Meditate." — Śiva Svarodaya</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:8 }}>Three Svara Nādīs</div>
                    {['Iḍā (Left) — Moon, cool, feminine','Piṅgalā (Right) — Sun, hot, masculine','Suṣumnā (Both) — neutral, meditate only'].map(t => (
                      <div key={t} style={{ display:'flex', gap:7, fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.45, marginBottom:6 }}><span style={{ color:'rgba(212,175,55,0.35)' }}>◈</span>{t}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:8 }}>Five Elements in Breath</div>
                    {['Earth — 20 counts','Water — 16 counts','Fire — 12 counts','Air — 8 counts','Space — 4 counts'].map(t => (
                      <div key={t} style={{ display:'flex', gap:7, fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.45, marginBottom:6 }}><span style={{ color:'rgba(212,175,55,0.35)' }}>◈</span>{t}</div>
                    ))}
                  </div>
                </div>
                {!canAccess('akasha') && (
                  <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 13px', borderRadius:14, border:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)', marginTop:14 }}>
                    <span>🔒</span><p style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', flex:1 }}>Full Svara Shāstra requires Ākāsha-Infinity · €1,111 lifetime</p>
                    <button onClick={() => navigate('/membership')} style={{ padding:'6px 13px', borderRadius:99, border:'1px solid rgba(212,175,55,0.22)', background:'rgba(212,175,55,0.07)', color:'#D4AF37', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer', flexShrink:0 }}>Activate</button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════ JYOTISH VIDYA ══════════════ */}
        {activeTab === 'vidya' && builtTabs.has('vidya') && (
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
              const ok = canAccess(m.tier);
              const isOpen = openModules.has(m.id);
              const tierCol = { free:'#6B7280', prana:'#22D3EE', siddha:'#D4AF37', akasha:'#ffffff' }[m.tier] || '#D4AF37';
              return (
                <div key={m.id} style={{ ...gs, padding:'16px 18px', marginBottom:7, opacity: ok ? 1 : 0.55 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, cursor: ok ? 'pointer' : 'default' }} onClick={() => ok && toggleModule(m.id)}>
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
                    <div style={{ paddingTop:15, borderTop:'1px solid rgba(255,255,255,0.04)', marginTop:13 }}>
                      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:8 }}>Curriculum</div>
                      <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                        {m.topics.map(tp => (
                          <li key={tp} style={{ display:'flex', gap:7, fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:1.45 }}>
                            <span style={{ color:'rgba(212,175,55,0.35)', flexShrink:0 }}>◈</span>{tp}
                          </li>
                        ))}
                      </ul>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:14 }}>
                        <button style={{ padding:'8px 14px', borderRadius:10, fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', color:'rgba(255,255,255,0.4)' }}>● In Progress</button>
                        <button style={{ padding:'8px 14px', borderRadius:10, fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer', border:'1px solid rgba(212,175,55,0.25)', background:'rgba(212,175,55,0.08)', color:'#D4AF37' }}>✓ Mark Complete</button>
                        <button style={{ padding:'11px', borderRadius:99, border:'1px solid rgba(212,175,55,0.28)', background:'rgba(212,175,55,0.07)', color:'#D4AF37', fontFamily:'inherit', fontSize:9, fontWeight:800, letterSpacing:'0.28em', textTransform:'uppercase' as const, cursor:'pointer' }}>✦ Open Full Module</button>
                      </div>
                    </div>
                  )}
                  {!ok && (
                    <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 13px', borderRadius:14, border:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)', marginTop:10 }}>
                      <span>🔒</span>
                      <p style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', flex:1 }}>
                        Requires {{prana:'Prāna-Flow (€19/mo)',siddha:'Siddha-Quantum (€45/mo)',akasha:'Ākāsha-Infinity (€1,111 lifetime)'}[m.tier]}
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
        {activeTab === 'hora' && builtTabs.has('hora') && (
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

        {/* ══════════════ LEXICON ══════════════ */}
        {activeTab === 'lexicon' && builtTabs.has('lexicon') && (
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase' as const, color:'rgba(212,175,55,0.5)', marginBottom:12, textAlign:'center' }}>Vedic Glossary — Tap any term to learn</div>
            <input
              value={lexSearch} onChange={e => setLexSearch(e.target.value)}
              placeholder="Search Vedic terms… (Rahu, Nakshatra, Dasha, Lagna…)"
              style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.14)', borderRadius:14, padding:'11px 16px', color:'#fff', fontFamily:'inherit', fontSize:13, outline:'none', marginBottom:12 }}
            />
            <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', marginBottom:12 }}>
              {['All',...[...new Set(LEXICON.map(e=>e.cat))]].map(c => (
                <button key={c} onClick={() => setLexCat(c)} style={{ flexShrink:0, padding:'5px 13px', borderRadius:99, border: lexCat===c ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.07)', background: lexCat===c ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)', color: lexCat===c ? '#D4AF37' : 'rgba(255,255,255,0.4)', fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, cursor:'pointer' }}>{c}</button>
              ))}
            </div>
            {LEXICON.filter(e => {
              const mq = !lexSearch || e.term.toLowerCase().includes(lexSearch.toLowerCase()) || e.m.toLowerCase().includes(lexSearch.toLowerCase()) || (e.skt||'').includes(lexSearch);
              const mc = lexCat==='All' || e.cat===lexCat;
              return mq && mc;
            }).map(e => (
              <LexEntry key={e.term} entry={e} gs={gs} />
            ))}
          </motion.div>
        )}

        <footer style={{ textAlign:'center', padding:'28px 0 8px', fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.18)' }}>
          ✦ Transmitted by Maharishi Bhrigu · SQI 2050 → 2026 · Jai Jyotish ✦
        </footer>

      </div>
    </div>
  );
};

export default JyotishChamber;
