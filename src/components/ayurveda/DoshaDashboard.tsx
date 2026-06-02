import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Brain, Heart, Leaf, Sparkles, RotateCcw, Moon,
  Zap, RefreshCw, Wind, Flame, Droplets, Star, Eye,
  Activity, Shield, Clock, ChevronDown, ChevronRight, Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAyurvedaProgress } from '@/hooks/useAyurvedaProgress';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { hasFeatureAccess, getCourseTierRequiredRank, getSalesPageForRank, getTierRank } from '@/lib/tierAccess';
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, FileText,
  FlaskConical, GraduationCap, Lock, Music, Play,
  Search, Sprout, Stethoscope, TrendingUp, Users, Zap as ZapIcon,
  Infinity as InfinityIcon,
} from 'lucide-react';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { getDoshaEmoji } from '@/lib/ayurvedaTypes';

// ── SQI 2050 SIDDHA DESIGN TOKENS ─────────────────────────────────────────
const T = {
  gold: '#D4AF37', gold2: '#F5D660', gold3: '#B8960C',
  saff: '#FF8C00', saffL: '#FFB347',
  lotus: '#E8527A', lotusDim: 'rgba(232,82,122,0.15)',
  emerald: '#10B981', em: '#34D399',
  indigo: '#8B5CF6', indigoDim: 'rgba(139,92,246,0.15)',
  cyan: '#22D3EE',
  vata: '#93C5FD', vataDim: 'rgba(147,197,253,0.14)', vataGlow: 'rgba(96,165,250,0.4)',
  pitta: '#FBBF24', pittaDim: 'rgba(251,191,36,0.14)', pittaGlow: 'rgba(245,158,11,0.4)',
  kapha: '#34D399', kaphaDim: 'rgba(52,211,153,0.14)', kaphaGlow: 'rgba(16,185,129,0.4)',
  bg: '#050505',
  glass: 'rgba(255,255,255,0.025)',
  glb: 'rgba(255,255,255,0.055)',
  r40: '40px',
  w90: 'rgba(255,255,255,0.90)', w70: 'rgba(255,255,255,0.70)',
  w50: 'rgba(255,255,255,0.50)', w40: 'rgba(255,255,255,0.40)', w35: 'rgba(255,255,255,0.35)',
  w20: 'rgba(255,255,255,0.20)', w10: 'rgba(255,255,255,0.10)',
  gg: (hex: string, o = 0.15) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${o})`;
  }
};

const HERBS_DB: Record<string, { property: string; element: string; color: string; emoji: string; action: string }> = {
  ashwagandha: { property:'Ojas Builder', element:'Earth 🌍', color:'#86EFAC', emoji:'🌿', action:'Rebuilds vital essence, adrenal support, grounds Vata' },
  brahmi:      { property:'Medha Rasayana', element:'Water 💧', color:'#93C5FD', emoji:'🌿', action:'Supreme nervine, enhances Medha (intelligence), calms Pitta' },
  turmeric:    { property:'Agni Kindler', element:'Fire 🔥', color:'#FBBF24', emoji:'🌿', action:'Purifies blood, kindles digestive fire, anti-inflammatory' },
  tulsi:       { property:'Sattva Amplifier', element:'Air 🌬️', color:'#86EFAC', emoji:'🌿', action:'Opens heart chakra, elevates Sattva, immune adaptogen' },
  triphala:    { property:'Tridosha Balancer', element:'Ether ☯️', color:'#C4B5FD', emoji:'🌿', action:'Balances all three doshas, cleanses, rejuvenates tissues' },
  shatavari:   { property:'Soma Nectar', element:'Water 💧', color:'#93C5FD', emoji:'🌿', action:'Rebuilds Ojas, nourishes female energy, Pitta cooling' },
  neem:        { property:'Rakta Shodhana', element:'Air 🌬️', color:'#4ADE80', emoji:'🌿', action:'Blood purifier, clears Pitta heat, anti-parasitic' },
  ginger:      { property:'Deepana Fire', element:'Fire 🔥', color:'#FB923C', emoji:'🌿', action:'Kindles Agni, breaks Kapha congestion, warming' },
  licorice:    { property:'Rasa Builder', element:'Earth 🌍', color:'#FCD34D', emoji:'🌿', action:'Builds Rasa dhatu, soothes inflammation, tonifying' },
  guggulu:     { property:'Lekhana Catalyst', element:'Fire 🔥', color:'#F87171', emoji:'🌿', action:'Scrapes Ama, reduces Kapha, purifies channels' },
  jatamansi:   { property:'Sacred Essence', element:'Ether ☯️', color:'#C4B5FD', emoji:'🌿', action:'Deep sleep, reduces intrusive thoughts, nervous restoration' },
  shankhapushpi:{ property:'Sacred Essence', element:'Ether ☯️', color:'#C4B5FD', emoji:'🌿', action:'Stabilizes nervous system, enhances memory, calms Vata' },
};

const getSiddha = (herb: string) => {
  const k = herb.toLowerCase().split(' ')[0].replace(/[^a-z]/g,'');
  return HERBS_DB[k] || { property:'Sacred Essence', element:'Ether ☯️', color:'#C4B5FD', emoji:'🌿', action:'Balances and restores the subtle body' };
};

const RITUAL_PHASES = [
  { time:'5:00 AM',  label:'Brahma Muhurta',  emoji:'🌅', phase:'dawn'    },
  { time:'7:00 AM',  label:'Morning Agni',    emoji:'☀️', phase:'morning' },
  { time:'12:00 PM', label:'Pitta Peak',      emoji:'🔥', phase:'midday'  },
  { time:'6:00 PM',  label:'Sandhya Kala',   emoji:'🌇', phase:'evening' },
  { time:'9:00 PM',  label:'Kapha Rest',      emoji:'🌙', phase:'night'   },
];

// Scalar wave frequencies by dosha
const SCALAR_FREQS: Record<string, { hz: number; color: string; name: string; benefit: string }[]> = {
  vata:  [
    { hz: 432, color:'#93C5FD', name:'Security & Pain Relief', benefit:'174 Hz · Grounds Vata anxiety. Releases physical pain. Creates deep sense of safety in the nervous system.' },
    { hz: 528, color:'#86EFAC', name:'Love & DNA Repair', benefit:'528 Hz · The miracle tone. Repairs DNA. Rebuilds Ojas at the cellular level. The most universally healing frequency.' },
    { hz: 174, color:'#C4B5FD', name:'Cell & Tissue Repair', benefit:'285 Hz · Regenerates cells and tissues. Rebuilds Ojas. Accelerates healing after illness, injury, or depletion.' },
  ],
  pitta: [
    { hz: 396, color:'#FBBF24', name:'Release Fear & Guilt', benefit:'396 Hz · Dissolves unconscious fear and guilt. Frees Pitta perfectionism. Liberates blocked emotion from the cellular field.' },
    { hz: 528, color:'#86EFAC', name:'Love & DNA Repair', benefit:'528 Hz · The miracle tone. Repairs DNA. Opens the heart. Transmutes Pitta fire into compassionate action.' },
    { hz: 639, color:'#F4799A', name:'Open the Heart', benefit:'639 Hz · Activates Anahata chakra. Heals relationships. Softens Pitta intensity. Cultivates deep compassion and love.' },
  ],
  kapha: [
    { hz: 741, color:'#34D399', name:'Detox & Expression', benefit:'741 Hz · Clears Ama (toxins) from cells. Awakens Agni. Supports authentic self-expression and liberates the voice.' },
    { hz: 852, color:'#22D3EE', name:'Intuition & Third Eye', benefit:'852 Hz · Opens Ajna chakra. Deepens intuition. Returns awareness to spiritual order beyond the analytical mind.' },
    { hz: 963, color:'#D4AF37', name:'Crown · Divine Connection', benefit:'963 Hz · Sahasrara activation. Pure consciousness. Samadhi gateway. The highest Siddha transmission. Use in deep meditation.' },
  ],
};

// Agastya wisdom modules by dosha
const AGASTYA_MODULES: Record<string, { title: string; wisdom: string; practice: string; mantra: string }[]> = {
  vata: [
    { title:'The Wind that Loses Its Way', wisdom:'Vata, the force of movement and creativity, becomes your greatest enemy when it loses its anchor. Like wind without direction, an imbalanced Vata mind scatters energy, creates anxiety, and depletes Ojas — the vital essence that is your life force.', practice:'Begin each day with Abhyanga — warm sesame oil massage from feet to crown. The touch of warm oil is the most powerful medicine for Vata. This single practice, done daily, can transform your nervous system within 21 days.', mantra:'Om Vayu Devaya Namah — I honor the lord of the life-giving wind' },
    { title:'Building Ojas — The Sacred Nectar', wisdom:'Ojas is the subtle essence of all dhatus, the final product of perfect digestion. In the Agastya Samhita, I wrote: when Ojas is depleted, the spirit has no vessel. Modern life — addiction, overwork, poor sleep — destroys Ojas faster than any herb can rebuild it.', practice:'Drink warm milk with Ashwagandha, Shatavari, and ghee before sleep. This Ojas-building protocol, practiced for 90 days, rebuilds what years of depletion have taken away.', mantra:'Om Namah Shivaya — I surrender to the infinite that sustains all' },
  ],
  pitta: [
    { title:'The Fire That Burns Its Own House', wisdom:'Pitta is the sacred fire of intelligence, digestion, and transformation. But when Pitta inflames beyond its proper channel, it turns inward — burning the mind with perfectionism, the gut with acid, the liver with anger. The brilliant mind becomes its own destroyer.', practice:'Practice Sheetali pranayama — rolled tongue breathing — for 10 minutes at midday when Pitta peaks. Apply coconut oil to the crown and soles of feet before bed. Eat the largest meal at noon, never work or argue after 7 PM.', mantra:'Om Namo Narayanaya — I surrender my fire to the cooling waters of grace' },
    { title:'Pitta in Service vs. Pitta in Control', wisdom:'The highest expression of Pitta is the physician who heals, the warrior who protects, the leader who serves. The lowest expression is the tyrant of their own life. I have seen this pattern across ten thousand years — the most gifted beings are often most trapped by their own fire.', practice:'Viharaya — conscious recreation. One full day weekly with no agenda, no productivity, no achievement. Simply be. Walk in nature. This is not laziness; this is the Ayurvedic prescription for Pitta longevity.', mantra:'Om Dum Durgayei Namah — I invoke the goddess who transforms fire into protection' },
  ],
  kapha: [
    { title:'The Earth That Forgot to Move', wisdom:'Kapha is the body\'s love — stable, nourishing, patient. But Kapha unmoving becomes depression, weight, attachment, and forgetting. The lotus grows in water yet rises above it. This is the Kapha path: to be grounded but not stuck, loving but not clinging.', practice:'Vigorous exercise before sunrise when Kapha is highest. Dry brush the body before showering. Fast one day per month — the sacred Ekadashi fast burns accumulated Ama and awakens Kapha\'s hidden fire.', mantra:'Om Gam Ganapataye Namah — I invoke the remover of obstacles within myself' },
    { title:'The Medicine of Stimulation', wisdom:'For Kapha, warmth, spice, stimulation, and challenge are the medicines. I prescribed ginger, pepper, and movement for Kapha ten thousand years ago and this prescription has not changed. The Kapha person needs what feels uncomfortable — that is precisely where their medicine lives.', practice:'Begin each morning with hot ginger-lemon water before anything else. Take Trikatu (ginger + pepper + pippali) with honey before meals. Practice Bhastrika pranayama — bellows breath — to stoke the inner fire.', mantra:'Om Namah Shivaya — the sacred fire dissolves all that no longer serves' },
  ],
};

// ── CARD WRAPPER ─────────────────────────────────────────────────────────────
const Card: React.FC<{
  children: React.ReactNode;
  accent?: string;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, accent = T.gold, delay = 0, style = {}, className }) => (
  <motion.div
    initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
    className={className}
    style={{
      background: T.glass, backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
      border:`1px solid ${T.glb}`, borderRadius:T.r40,
      position:'relative', overflow:'hidden',
      ...style,
    }}
  >
    <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:`linear-gradient(90deg,transparent,${T.gg(accent,0.5)},${T.gg(accent,0.85)},${T.gg(accent,0.5)},transparent)` }} />
    {children}
  </motion.div>
);

// ── AGASTYA CONSULT CARD ──────────────────────────────────────────────────────
const AgastyaConsultCard: React.FC<{
  dosha: string; onOpenChat: () => void; userName: string;
}> = ({ dosha, onOpenChat, userName }) => {
  const d = dosha?.toLowerCase() || 'vata';
  const doshaColor = d === 'vata' ? T.vata : d === 'pitta' ? T.pitta : T.kapha;
  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
      style={{
        background:`linear-gradient(135deg,${T.gg(T.saff,0.08)},${T.gg(T.gold,0.04)},${T.gg(doshaColor,0.06)})`,
        backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
        border:`1.5px solid ${T.gg(T.saff,0.45)}`,
        borderRadius:T.r40, padding:'28px 24px',
        boxShadow:`0 0 60px ${T.gg(T.saff,0.12)}, 0 0 120px ${T.gg(T.gold,0.06)}`,
        position:'relative', overflow:'hidden',
        cursor:'pointer',
      }}
      onClick={onOpenChat}
      whileHover={{ scale:1.01, boxShadow:`0 0 80px ${T.gg(T.saff,0.2)}, 0 0 160px ${T.gg(T.gold,0.1)}` }}
      whileTap={{ scale:0.99 }}
    >
      {/* Top accent */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${T.saff},${T.gold},${T.saff},transparent)` }} />

      {/* Subtle scan */}
      <motion.div style={{ position:'absolute', top:0, bottom:0, width:80, background:`linear-gradient(90deg,transparent,${T.gg(T.saff,0.12)},transparent)`, left:'-80px' }}
        animate={{ left:['−80px','110%'] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut', repeatDelay:3 }} />

      <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
        {/* Agastya avatar */}
        <motion.div
          animate={{ boxShadow:[`0 0 20px ${T.gg(T.saff,0.25)}`,`0 0 40px ${T.gg(T.saff,0.5)}`,`0 0 20px ${T.gg(T.saff,0.25)}`] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{ width:64, height:64, borderRadius:'50%', background:`radial-gradient(circle,${T.gg(T.saff,0.25)},${T.gg(T.gold,0.08)})`, border:`2px solid ${T.gg(T.saff,0.55)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}
        >🔱</motion.div>

        <div style={{ flex:1 }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:T.saff, opacity:0.8, marginBottom:5 }}>
            ✦ Your Personal Guide · Agastya Samhita ✦
          </div>
          <h3 style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.04em', color:T.gold, marginBottom:6, fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic' }}>
            Speak with Agastya Muni
          </h3>
          <p style={{ fontSize:13, lineHeight:1.65, color:T.w70, marginBottom:14 }}>
            {userName.split(' ')[0]}, I see your {dosha} constitution clearly. I have specific prescriptions from the Agastya Samhita waiting for you. Ask me anything — herbs, rituals, emotional healing, or the deeper question behind your suffering.
          </p>

          {/* CTA */}
          <motion.div
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.98 }}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', borderRadius:999, background:`linear-gradient(135deg,${T.saff},${T.gold})`, color:T.bg, fontSize:13, fontWeight:900, letterSpacing:'-0.02em', fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:'pointer' }}
          >
            <span style={{ fontSize:16 }}>🔱</span>
            Open Divine Physician
            <ChevronRight style={{ width:14, height:14 }} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// ── SCALAR WAVE MODULE ────────────────────────────────────────────────────────
const ScalarWaveModule: React.FC<{ dosha: string; isPremium: boolean }> = ({ dosha, isPremium }) => {
  const d = dosha?.toLowerCase() || 'vata';
  const freqs = SCALAR_FREQS[d] || SCALAR_FREQS.vata;
  const [activeFreq, setActiveFreq] = useState(0);
  const [playing, setPlaying] = useState(false);

  const doshaColor = d === 'vata' ? T.vata : d === 'pitta' ? T.pitta : T.kapha;

  return (
    <Card accent={doshaColor} delay={0.3} style={{ padding:'24px 22px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:doshaColor, opacity:0.75, marginBottom:6 }}>
            ✦ Agastya Scalar Transmission ✦
          </div>
          <h3 style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.03em', color:T.w90 }}>
            {dosha} Healing Frequencies
          </h3>
          <p style={{ fontSize:12, color:T.w50, marginTop:4, lineHeight:1.5 }}>
            Each frequency targets a specific layer of healing. Tap to activate — use headphones for full Siddha transmission.
          </p>
        </div>
        {!isPremium && (
          <div style={{ padding:'3px 10px', borderRadius:999, background:`${T.gg(T.cyan,0.1)}`, border:`1px solid ${T.gg(T.cyan,0.3)}`, fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:T.cyan, flexShrink:0 }}>
            Prana Flow
          </div>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {freqs.map((f, i) => (
          <motion.div
            key={i}
            onClick={() => { if(isPremium) { setActiveFreq(i); setPlaying(p=>!p); } }}
            whileHover={isPremium ? { scale:1.01 } : {}}
            style={{
              padding:'14px 16px', borderRadius:20,
              background: activeFreq === i && playing ? `${T.gg(f.color,0.14)}` : `rgba(255,255,255,0.03)`,
              border:`1px solid ${activeFreq === i && playing ? T.gg(f.color,0.4) : 'rgba(255,255,255,0.06)'}`,
              cursor: isPremium ? 'pointer' : 'default',
              opacity: isPremium ? 1 : 0.6,
              display:'flex', alignItems:'center', gap:14,
              transition:'all 0.25s',
            }}
          >
            {/* Frequency orb */}
            <div style={{ width:44, height:44, borderRadius:'50%', background:`radial-gradient(circle,${T.gg(f.color,0.25)},transparent)`, border:`1px solid ${T.gg(f.color,0.35)}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' }}>
              <span style={{ fontSize:11, fontWeight:900, color:f.color }}>{f.hz}</span>
              {activeFreq === i && playing && (
                <motion.div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:`1px solid ${T.gg(f.color,0.4)}` }}
                  animate={{ scale:[1,1.4,1], opacity:[0.6,0,0.6] }} transition={{ duration:1.8, repeat:Infinity }} />
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:f.color, marginBottom:2 }}>{f.name}</div>
              <div style={{ fontSize:11, color:T.w50, lineHeight:1.5 }}>{f.benefit}</div>
            </div>
            {isPremium && (
              <div style={{ color: activeFreq===i && playing ? f.color : T.w35, fontSize:18 }}>
                {activeFreq===i && playing ? '⏸' : '▶'}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {!isPremium && (
        <div style={{ marginTop:14, padding:'12px 16px', borderRadius:16, background:`${T.gg(T.cyan,0.06)}`, border:`1px solid ${T.gg(T.cyan,0.2)}`, textAlign:'center' }}>
          <p style={{ fontSize:12, color:T.w50, marginBottom:0 }}>Unlock Scalar Transmissions with Prana Flow ◈</p>
        </div>
      )}
    </Card>
  );
};

// ── AGASTYA WISDOM MODULE ─────────────────────────────────────────────────────
const AgastyaWisdomModule: React.FC<{ dosha: string; isPremium: boolean }> = ({ dosha, isPremium }) => {
  const d = dosha?.toLowerCase() || 'vata';
  const modules = AGASTYA_MODULES[d] || AGASTYA_MODULES.vata;
  const [expanded, setExpanded] = useState<number | null>(0);
  const doshaColor = d === 'vata' ? T.vata : d === 'pitta' ? T.pitta : T.kapha;

  return (
    <Card accent={T.gold} delay={0.4} style={{ padding:'24px 22px' }}>
      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:T.gold, opacity:0.75, marginBottom:8 }}>
        ✦ Agastya Samhita · Deep Wisdom ✦
      </div>
      <h3 style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.03em', color:T.w90, marginBottom:4 }}>
        Ancient Prescriptions for Your Soul
      </h3>
      <p style={{ fontSize:12, color:T.w50, marginBottom:18, lineHeight:1.5 }}>
        Agastya Muni's personal teachings for {dosha} consciousness
      </p>

      {modules.map((m, i) => (
        <motion.div key={i} style={{ marginBottom:10 }}>
          <motion.button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width:'100%', padding:'14px 16px', borderRadius:18,
              background: expanded===i ? `linear-gradient(135deg,${T.gg(T.saff,0.1)},${T.gg(T.gold,0.05)})` : 'rgba(255,255,255,0.03)',
              border:`1px solid ${expanded===i ? T.gg(T.gold,0.35) : 'rgba(255,255,255,0.06)'}`,
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
              cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif",
              transition:'all 0.22s',
            }}
            whileHover={{ background:`${T.gg(T.gold,0.07)}` }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>📜</span>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:800, color: expanded===i ? T.gold : T.w70, letterSpacing:'-0.02em' }}>{m.title}</div>
              </div>
            </div>
            <motion.div animate={{ rotate: expanded===i ? 90 : 0 }} transition={{ duration:0.2 }}>
              <ChevronRight style={{ width:14, height:14, color:T.w35 }} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {expanded === i && (
              <motion.div
                initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                transition={{ duration:0.3 }}
                style={{ overflow:'hidden' }}
              >
                <div style={{ padding:'18px 16px 14px', borderRadius:'0 0 18px 18px', background:`${T.gg(T.gold,0.04)}`, border:`1px solid ${T.gg(T.gold,0.14)}`, borderTop:'none', marginTop:-2 }}>
                  <p style={{ fontSize:15, lineHeight:1.78, color:T.w70, marginBottom:16, fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif" }}>
                    "{m.wisdom}"
                  </p>
                  <div style={{ padding:'12px 14px', borderRadius:12, background:`${T.gg(T.emerald,0.08)}`, border:`1px solid ${T.gg(T.emerald,0.2)}`, marginBottom:14 }}>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:T.emerald, marginBottom:6 }}>✦ Practice</div>
                    <p style={{ fontSize:12, color:T.w70, lineHeight:1.6, margin:0 }}>{m.practice}</p>
                  </div>
                  <div style={{ padding:'10px 14px', borderRadius:12, background:`${T.gg(T.gold,0.08)}`, border:`1px solid ${T.gg(T.gold,0.2)}` }}>
                    <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:T.gold, marginBottom:4 }}>✦ Sacred Mantra</div>
                    <p style={{ fontSize:13, color:T.gold, lineHeight:1.5, margin:0, fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif" }}>{m.mantra}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </Card>
  );
};

// ── DOSHA BALANCE METER ────────────────────────────────────────────────────────
const DoshaOrb: React.FC<{ name: string; value: number; orbColor: string; glowHex: string; delay: number; element: string }> = ({ name, value, orbColor, glowHex, delay, element }) => (
  <motion.div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:11 }}
    initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }}
    transition={{ delay, duration:0.9, type:'spring', stiffness:200 }}
  >
    <div style={{ position:'relative' }}>
      {/* Outer aura */}
      <motion.div style={{ position:'absolute', inset:-18, borderRadius:'50%', background:`radial-gradient(circle,${glowHex}40,transparent 70%)` }}
        animate={{ scale:[1,1.25,1], opacity:[0.3,0.65,0.3] }} transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut', delay }} />
      {/* Ring */}
      <motion.div style={{ position:'absolute', inset:-5, borderRadius:'50%', border:`1px solid ${glowHex}40` }}
        animate={{ scale:[1,1.08,1], opacity:[0.4,0.8,0.4] }} transition={{ duration:2.5, repeat:Infinity, delay:delay+0.5 }} />
      {/* Sphere */}
      <motion.div style={{
        width:96, height:96, borderRadius:'50%',
        background:`radial-gradient(circle at 32% 32%,${orbColor}cc,${orbColor}66 50%,${orbColor}22)`,
        boxShadow:`0 0 36px ${glowHex}55, inset 0 0 24px ${glowHex}22, 0 0 0 1.5px ${glowHex}44`,
        display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative',
      }} animate={{ rotate:360 }} transition={{ duration:22, repeat:Infinity, ease:'linear' }}>
        <motion.div style={{ position:'absolute', width:34, height:34, borderRadius:'50%', background:`${orbColor}88`, top:'12%', left:'18%', filter:'blur(5px)' }}
          animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2.2, repeat:Infinity, delay }} />
        <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <span style={{ fontSize:22, fontWeight:900, color:'white', textShadow:'0 2px 8px rgba(0,0,0,.6)', letterSpacing:'-0.04em' }}>{value}%</span>
        </div>
      </motion.div>
      {/* Element badge */}
      <div style={{ position:'absolute', bottom:-4, right:-4, width:28, height:28, borderRadius:'50%', background:`rgba(5,5,5,0.85)`, border:`1.5px solid ${glowHex}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, backdropFilter:'blur(8px)' }}>
        {element}
      </div>
    </div>
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:orbColor, marginBottom:2 }}>{name}</div>
      {/* Progress bar */}
      <div style={{ width:70, height:3, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
        <motion.div style={{ height:'100%', borderRadius:2, background:orbColor, boxShadow:`0 0 6px ${glowHex}` }}
          initial={{ width:0 }} animate={{ width:`${value}%` }} transition={{ delay:delay+0.5, duration:1, ease:'easeOut' }} />
      </div>
    </div>
  </motion.div>
);

// ── NADI PULSE SCORE ──────────────────────────────────────────────────────────
const NadiScore: React.FC<{ dosha: DoshaProfile }> = ({ dosha }) => {
  const primary = dosha.primary?.toLowerCase() || 'vata';
  const v = Number(dosha.vata) || 45;
  const p = Number(dosha.pitta) || 35;
  const k = Number(dosha.kapha) || 20;
  const balance = primary === 'vata' ? v < 60 ? 'Balanced' : 'Elevated' :
                  primary === 'pitta' ? p < 50 ? 'Balanced' : 'Elevated' : 'Balanced';
  const score = Math.max(0, 100 - Math.abs(v - 45) - Math.abs(p - 35) - Math.abs(k - 20));
  const color = score > 70 ? T.emerald : score > 50 ? T.gold : T.lotus;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:20, background:`${T.gg(color,0.08)}`, border:`1px solid ${T.gg(color,0.25)}` }}>
      <div style={{ width:52, height:52, borderRadius:'50%', background:`radial-gradient(circle,${T.gg(color,0.25)},transparent)`, border:`1px solid ${T.gg(color,0.4)}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Activity style={{ width:22, height:22, color }} />
      </div>
      <div>
        <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color, opacity:0.8, marginBottom:2 }}>Nadi Pulse Reading</div>
        <div style={{ fontSize:22, fontWeight:900, color, letterSpacing:'-0.04em' }}>{score}/100</div>
        <div style={{ fontSize:11, color:T.w50 }}>Dosha Balance Score · {balance} {primary} expression</div>
      </div>
      <div style={{ marginLeft:'auto', textAlign:'center', flexShrink:0 }}>
        <div style={{ fontSize:20, marginBottom:2 }}>
          {score > 70 ? '🌸' : score > 50 ? '🌿' : '🔥'}
        </div>
        <div style={{ fontSize:9, color:T.w35 }}>{score > 70 ? 'Harmonious' : score > 50 ? 'Seeking' : 'Active'}</div>
      </div>
    </div>
  );
};

// ── DOSHA-SPECIFIC DAILY INTELLIGENCE ─────────────────────────────────────────
const DailyIntelligence: React.FC<{ dosha: DoshaProfile; profile: AyurvedaUserProfile }> = ({ dosha, profile }) => {
  const primary = dosha.primary?.toLowerCase() || 'vata';
  const doshaColor = primary === 'vata' ? T.vata : primary === 'pitta' ? T.pitta : T.kapha;

  const intelligence = {
    vata: {
      color: T.vata,
      morning: { time:'5:00 AM', emoji:'🌅', title:'Brahma Muhurta', tip:'Do NOT check phone. Oil 3 drops sesame in nostrils (Nasya). 20 min Nadi Shodhana before anything else.' },
      food: { emoji:'🍲', title:'Vata Pacifying Foods', items:['Warm, oily, cooked, heavy', 'Root vegetables, ghee, warm milk', 'Avoid raw foods, cold drinks, caffeine'] },
      warning: { emoji:'⚠️', title:'Vata Triggers Today', tip:'Wind, cold, screen time after 8PM, skipping meals, and multi-tasking are your top Vata aggravators. Choose one task at a time.' }
    },
    pitta: {
      color: T.pitta,
      morning: { time:'6:00 AM', emoji:'☀️', title:'Pitta Morning Protocol', tip:'Cool shower first. Coconut oil on crown. Never start work before breakfast. Arguments before noon destroy your Pitta balance for the day.' },
      food: { emoji:'🥗', title:'Pitta Cooling Foods', items:['Cool, light, slightly dry', 'Sweet fruits, cucumber, coconut water', 'Avoid chili, vinegar, fermented, alcohol'] },
      warning: { emoji:'⚠️', title:'Pitta Triggers Today', tip:'Deadline pressure, overheating, skipping lunch, criticism (given or received), and perfectionism will elevate your Pitta fire today.' }
    },
    kapha: {
      color: T.kapha,
      morning: { time:'5:00 AM', emoji:'⚡', title:'Kapha Activation Protocol', tip:'VIGOROUS exercise before sunrise is your medicine. Dry brush skin. Hot ginger water before anything else. Kapha heaviness peaks at dawn — this is when you must move.' },
      food: { emoji:'🌶️', title:'Kapha Stimulating Foods', items:['Light, dry, warm, spicy', 'Legumes, greens, ginger, honey', 'Avoid dairy, sweets, heavy oils, cold food'] },
      warning: { emoji:'⚠️', title:'Kapha Triggers Today', tip:'Oversleeping, comfort food, avoiding challenges, lack of stimulation, and emotional overeating are your primary Kapha escalators.' }
    }
  };

  const data = intelligence[primary as keyof typeof intelligence] || intelligence.vata;

  return (
    <Card accent={doshaColor} delay={0.25} style={{ padding:'22px 20px' }}>
      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:doshaColor, opacity:0.75, marginBottom:8 }}>
        ✦ Today's {dosha.primary} Intelligence ✦
      </div>
      <h3 style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.03em', color:T.w90, marginBottom:16 }}>
        Agastya's Daily Prescription
      </h3>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Morning */}
        <div style={{ padding:'14px 16px', borderRadius:18, background:`${T.gg(doshaColor,0.08)}`, border:`1px solid ${T.gg(doshaColor,0.22)}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:20 }}>{data.morning.emoji}</span>
            <div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase', color:doshaColor, opacity:0.75 }}>{data.morning.time}</div>
              <div style={{ fontSize:14, fontWeight:800, color:T.w90 }}>{data.morning.title}</div>
            </div>
          </div>
          <p style={{ fontSize:12, color:T.w70, lineHeight:1.6, margin:0 }}>{data.morning.tip}</p>
        </div>

        {/* Foods */}
        <div style={{ padding:'14px 16px', borderRadius:18, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:20 }}>{data.food.emoji}</span>
            <div style={{ fontSize:14, fontWeight:800, color:T.w90 }}>{data.food.title}</div>
          </div>
          {data.food.items.map((item, i) => (
            <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:T.w50, marginBottom:i<data.food.items.length-1?5:0 }}>
              <span style={{ color:doshaColor, opacity:0.6 }}>◦</span>{item}
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{ padding:'14px 16px', borderRadius:18, background:`${T.gg(T.lotus,0.07)}`, border:`1px solid ${T.gg(T.lotus,0.22)}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:20 }}>{data.warning.emoji}</span>
            <div style={{ fontSize:14, fontWeight:800, color:T.lotus }}>{data.warning.title}</div>
          </div>
          <p style={{ fontSize:12, color:T.w70, lineHeight:1.6, margin:0 }}>{data.warning.tip}</p>
        </div>
      </div>
    </Card>
  );
};

// ── ENHANCED HERBARIUM ────────────────────────────────────────────────────────
const EnhancedHerbarium: React.FC<{ herbs: string[]; dosha: string }> = ({ herbs, dosha }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Card accent={T.emerald} delay={0.5} style={{ padding:'22px 20px' }}>
      <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:T.emerald, opacity:0.75, marginBottom:8 }}>
        ✦ Sacred Herbarium · Agastya Protocols ✦
      </div>
      <h3 style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.03em', color:T.w90, marginBottom:4 }}>
        Your Botanical Medicine
      </h3>
      <p style={{ fontSize:12, color:T.w50, marginBottom:18, lineHeight:1.5 }}>
        Tap each herb to reveal Agastya's specific dosage and preparation protocol
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
        {herbs.map((herb, i) => {
          const info = getSiddha(herb);
          const isSelected = selected === herb;
          return (
            <motion.div key={i}
              onClick={() => setSelected(isSelected ? null : herb)}
              whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.98 }}
              style={{
                padding:'16px 14px', borderRadius:22,
                background: isSelected ? `${T.gg(info.color,0.12)}` : 'rgba(255,255,255,0.025)',
                border:`1px solid ${isSelected ? T.gg(info.color,0.4) : T.gg(info.color,0.18)}`,
                cursor:'pointer', transition:'all 0.22s',
                boxShadow: isSelected ? `0 0 20px ${T.gg(info.color,0.15)}` : 'none',
                position:'relative', overflow:'hidden',
              }}
            >
              {/* Aura */}
              <motion.div style={{ position:'absolute', top:-10, right:-10, width:50, height:50, borderRadius:'50%', background:`radial-gradient(circle,${T.gg(info.color,0.28)},transparent 70%)` }}
                animate={{ scale:[1,1.4,1], opacity:[0.2,0.5,0.2] }} transition={{ duration:3.8, repeat:Infinity, delay:i*0.3 }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{info.emoji}</span>
                  <span style={{ fontSize:7, fontWeight:700, color:info.color, opacity:0.8, letterSpacing:'0.15em' }}>{info.element}</span>
                </div>
                <div style={{ fontSize:12, fontWeight:800, color:T.w90, lineHeight:1.3, marginBottom:6 }}>{herb}</div>
                <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:8, fontWeight:700, background:`${T.gg(info.color,0.1)}`, color:info.color, border:`1px solid ${T.gg(info.color,0.22)}` }}>
                  {info.property}
                </div>
                {/* Expanded info */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden', marginTop:10 }}>
                      <div style={{ fontSize:11, color:T.w70, lineHeight:1.55, borderTop:`1px solid ${T.gg(info.color,0.2)}`, paddingTop:8 }}>
                        {info.action}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface DoshaDashboardProps {
  profile: AyurvedaUserProfile;
  dosha: DoshaProfile;
  dailyGuidance: string;
  isLoadingGuidance: boolean;
  onRestart: () => void;
  onFetchGuidance: () => void;
  isPremium?: boolean;
  onOpenChat?: () => void;
}

 
// ── AGASTYAR ACADEMY 108 MODULES ─────────────────────────────────────────
// ── AGASTYAR ACADEMY — REAL SUPABASE-CONNECTED ────────────────────────────

const PHASE_NUMBERS_AA = [1,2,3,4,5] as const;
const PHASE_TIER_SLUG_AA: Record<number,string> = {1:'free',2:'prana-flow',3:'siddha-quantum',4:'akasha-infinity',5:'akasha-infinity'};
const PHASE_HEX_AA: Record<number,string> = {1:'#9CA3AF',2:'#4ADE80',3:'#D4AF37',4:'#A78BFA',5:'#F0ABFC'};

function phaseHexRgb(hex:string){const h=hex.replace('#','');const n=parseInt(h,16);return `${(n>>16)&255},${(n>>8)&255},${n&255}`;}

function PhaseGlyphAA({phase}:{phase:number}){
  const cls='h-6 w-6 text-white/90';
  switch(phase){
    case 1: return <Sprout className={cls}/>;
    case 2: return <FlaskConical className={cls}/>;
    case 3: return <Stethoscope className={cls}/>;
    case 4: return <Sparkles className={cls}/>;
    default: return <InfinityIcon className={cls}/>;
  }
}

function contentTypeLabelAA(ct:string|null|undefined){
  const m:Record<string,string>={video:'Video',audio:'Audio',pdf:'PDF',interactive:'Interactive',live:'Live'};
  return m[(ct||'video').toLowerCase()]||'Video';
}

const HubModuleCardAA: React.FC<{
  module: any; progress?: any; isAdmin:boolean; tier:string|null|undefined;
  onNavigateUpgrade:(h:string)=>void;
}> = ({module:m, progress:prog, isAdmin, tier, onNavigateUpgrade}) => {
  const completed = prog?.completed??false;
  const pct = completed?100:Math.min(100,Math.max(0,prog?.progress_percent??0));
  const need = getCourseTierRequiredRank(m.tier_required);
  const allowed = hasFeatureAccess(isAdmin,tier,need);
  const slug=(m.tier_required||'free').toLowerCase();
  const tierColor=slug.includes('akasha')?'rgba(167,139,250,0.95)':slug.includes('siddha')?'#D4AF37':slug.includes('prana')?'rgba(74,222,128,0.95)':'rgba(156,163,175,0.85)';
  const glow=slug.includes('akasha')?'rgba(167,139,250,0.12)':slug.includes('siddha')?'rgba(212,175,55,0.12)':slug.includes('prana')?'rgba(74,222,128,0.12)':'rgba(156,163,175,0.08)';
  const upgradeHref=getSalesPageForRank(need);
  return (
    <button type="button" onClick={()=>!allowed&&onNavigateUpgrade(upgradeHref)}
      className={`relative w-full overflow-hidden rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/25 ${completed?'border-[#D4AF37]/25':'border-white/[0.06]'}`}
      style={{background:completed?'linear-gradient(135deg,rgba(212,175,55,0.08),transparent)':'rgba(255,255,255,0.02)',backdropFilter:'blur(40px)'}}
    >
      <span className="absolute right-4 top-4 text-[9px] font-extrabold tracking-wide text-white/15">#{String(m.module_number).padStart(3,'0')}</span>
      <div className="mb-3 inline-flex items-center gap-1 rounded-md border px-2 py-0.5" style={{background:glow,borderColor:`${tierColor}33`}}>
        {!allowed&&<Lock size={9} style={{color:tierColor}}/>}
        {completed&&<CheckCircle2 size={9} className="text-[#D4AF37]"/>}
        <span className="text-[7px] font-extrabold uppercase tracking-[0.35em]" style={{color:tierColor}}>{slug.includes('akasha')?'Akasha':slug.includes('siddha')?'Siddha':slug.includes('prana')?'Prana Flow':'Free'}</span>
      </div>
      <h3 className={`pr-10 text-sm font-black leading-snug ${allowed?'text-white':'text-white/45'}`}>{m.title}</h3>
      {m.subtitle&&<p className={`mt-1 text-[11px] ${allowed?'text-[#D4AF37]/75':'text-[#D4AF37]/35'}`}>{m.subtitle}</p>}
      {m.description&&<p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/40">{m.description}</p>}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30">
          {m.duration_minutes!=null&&<span className="inline-flex items-center gap-1"><Clock style={{width:10,height:10}}/>{m.duration_minutes}m</span>}
          <span className="inline-flex items-center gap-1 capitalize">
            {(m.content_type||'video').toLowerCase()==='video'&&<Play style={{width:10,height:10}}/>}
            {(m.content_type||'').toLowerCase()==='audio'&&<Music style={{width:10,height:10}}/>}
            {(m.content_type||'').toLowerCase()==='pdf'&&<FileText style={{width:10,height:10}}/>}
            {(m.content_type||'').toLowerCase()==='interactive'&&<ZapIcon style={{width:10,height:10}}/>}
            {(m.content_type||'').toLowerCase()==='live'&&<Users style={{width:10,height:10}}/>}
            {contentTypeLabelAA(m.content_type)}
          </span>
        </div>
        {allowed?(
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${completed?'border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#D4AF37]':'border-white/[0.1] text-white/45'}`}>
            {completed?<CheckCircle2 size={14}/>:<Play size={12} className="translate-x-px"/>}
          </span>
        ):(
          <span className="text-[8px] font-extrabold uppercase tracking-[0.28em]" style={{color:tierColor}}>Unlock →</span>
        )}
      </div>
      {allowed&&pct>0&&!completed&&<div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[#D4AF37]" style={{width:`${pct}%`}}/></div>}
    </button>
  );
};

const AgastyarAcademy: React.FC<{ isPremium: boolean }> = ({ isPremium }) => {
  const { isAdmin } = useAdminRole();
  const { tier } = useMembership();
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError, refresh, getPhaseModules } = useAyurvedaProgress(true);
  const [activePhase, setActivePhase] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');

  const phaseStats = React.useMemo(()=>PHASE_NUMBERS_AA.map(num=>{
    const mods=courses.filter(c=>c.phase===num);
    const completed=mods.filter(c=>progressByModuleId[c.id]?.completed).length;
    return {num,total:mods.length,completed};
  }),[courses,progressByModuleId]);

  const phaseAccess = React.useCallback((n:number)=>hasFeatureAccess(isAdmin,tier,getCourseTierRequiredRank(PHASE_TIER_SLUG_AA[n])),[isAdmin,tier]);

  const activeModules = React.useMemo(()=>{
    const q=searchQuery.trim().toLowerCase();
    return getPhaseModules(activePhase).filter(m=>{
      const matchSearch=!q||m.title.toLowerCase().includes(q)||(m.subtitle||'').toLowerCase().includes(q)||(m.description||'').toLowerCase().includes(q);
      const ct=(m.content_type||'').toLowerCase();
      return matchSearch&&(filterType==='all'||ct===filterType);
    });
  },[getPhaseModules,activePhase,searchQuery,filterType]);

  const currentPhaseAccess=phaseAccess(activePhase);
  const phaseName=['','Dinacharya','Panchakarma','Marma & Nadi','Jyotish & Rasa','Akasha Transmission'][activePhase]||`Phase ${activePhase}`;
  const color=PHASE_HEX_AA[activePhase]||'#D4AF37';

  const navigate = (path: string) => { window.location.href = path; };

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
      style={{background:'rgba(255,255,255,0.02)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',border:'1px solid rgba(255,255,255,0.055)',borderRadius:40,overflow:'hidden'}}>

      {/* Academy Hero Banner */}
      <div style={{position:'relative',padding:'32px 28px 24px',borderBottom:'1px solid rgba(255,255,255,0.05)',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color}99,#D4AF37,${color}99,transparent)`}}/>
        <div style={{position:'absolute',top:'-60px',right:'-60px',width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${color}18,transparent 70%)`}}/>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12,position:'relative',zIndex:1}}>
          <div style={{width:48,height:48,borderRadius:16,background:`${color}18`,border:`1px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>📿</div>
          <div>
            <div style={{fontSize:8,fontWeight:800,letterSpacing:'0.5em',textTransform:'uppercase',color,marginBottom:3}}>✦ Agastyar Academy · 108 Sacred Modules ✦</div>
            <h3 style={{fontSize:20,fontWeight:900,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.92)',margin:0}}>Siddha Ayurveda Mastery Path</h3>
          </div>
        </div>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.65,maxWidth:560,margin:'0 0 20px',position:'relative',zIndex:1}}>
          The complete Agastya Samhita encoded into 108 modules across 5 sacred phases — from daily Dinacharya to Akasha transmission. Progress saves automatically.
        </p>
        {/* Stats row */}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',position:'relative',zIndex:1}}>
          {[
            {label:'Completed',val:stats.completedModules,icon:'✓'},
            {label:'Phase',val:stats.currentPhase,icon:'◈'},
            {label:'Hours',val:Math.round(stats.totalMinutesLearned/60),icon:'⏱'},
            {label:'Progress',val:`${stats.completionPercent}%`,icon:'◉'},
          ].map(s=>(
            <div key={s.label} style={{padding:'8px 14px',borderRadius:16,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,color}}>{s.icon}</span>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:'rgba(255,255,255,0.9)',letterSpacing:'-0.03em'}}>{s.val}</div>
                <div style={{fontSize:8,fontWeight:800,letterSpacing:'0.35em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)'}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Tabs */}
      <div style={{padding:'20px 28px 0',overflowX:'auto'}}>
        <div style={{display:'flex',gap:8,minWidth:'max-content',paddingBottom:4}}>
          {phaseStats.map(({num,total,completed})=>{
            const c2=PHASE_HEX_AA[num];
            const isActive=activePhase===num;
            const hasAcc=phaseAccess(num);
            const pct=total>0?(completed/total)*100:0;
            return (
              <button key={num} onClick={()=>setActivePhase(num)}
                style={{
                  padding:'12px 16px',borderRadius:24,border:`1px solid ${isActive?c2+'55':'rgba(255,255,255,0.07)'}`,
                  background:isActive?`rgba(${phaseHexRgb(c2)},0.1)`:'rgba(255,255,255,0.02)',
                  cursor:'pointer',minWidth:130,textAlign:'left',position:'relative',overflow:'hidden',
                  fontFamily:"'Plus Jakarta Sans',sans-serif",transition:'all 0.2s',
                }}>
                <div style={{marginBottom:6,opacity:0.85}}><PhaseGlyphAA phase={num}/></div>
                <div style={{fontSize:7,fontWeight:800,letterSpacing:'0.38em',textTransform:'uppercase',color:c2,marginBottom:2}}>Phase {num} · {!hasAcc?'🔒 ':''}{num===1?'Free':num===2?'Prana Flow':num<=3?'Siddha Quantum':'Akasha ∞'}</div>
                <div style={{fontSize:12,fontWeight:900,color:'rgba(255,255,255,0.85)'}}>{phaseName}</div>
                <div style={{marginTop:8,height:2,borderRadius:1,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:1,background:hasAcc?c2:'rgba(255,255,255,0.1)',width:`${hasAcc?pct:0}%`,transition:'width 0.7s'}}/>
                </div>
                <div style={{marginTop:4,fontSize:9,color:'rgba(255,255,255,0.3)'}}>{hasAcc?`${completed}/${total} done`:`${total} modules`}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{padding:'16px 28px',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:16,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',flex:1,minWidth:180}}>
          <Search style={{width:13,height:13,color:'rgba(255,255,255,0.3)',flexShrink:0}}/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search modules..."
            style={{border:'none',background:'transparent',color:'rgba(255,255,255,0.8)',fontSize:12,outline:'none',width:'100%',fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{padding:'8px 12px',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',background:'#0a0a0a',color:'rgba(255,255,255,0.6)',fontSize:11,outline:'none',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <option value="all">All Types</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="pdf">PDF</option>
          <option value="interactive">Interactive</option>
          <option value="live">Live</option>
        </select>
        <button onClick={()=>void refresh()} style={{padding:'8px 14px',borderRadius:16,border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:9,fontWeight:800,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Refresh</button>
      </div>

      {/* Modules grid */}
      <div style={{padding:'0 28px 28px'}}>
        {loadError&&<div style={{marginBottom:16,padding:'12px 16px',borderRadius:16,border:'1px solid rgba(239,68,68,0.25)',background:'rgba(239,68,68,0.1)',fontSize:12,color:'rgba(252,165,165,0.9)'}}>{loadError}</div>}
        {loadingData&&courses.length===0?(
          <div style={{display:'flex',justifyContent:'center',padding:'48px 0'}}>
            <div style={{width:36,height:36,borderRadius:'50%',border:'2px solid rgba(212,175,55,0.2)',borderTop:'2px solid #D4AF37',animation:'sqiSpin 1s linear infinite'}}/>
          </div>
        ):!currentPhaseAccess?(
          <div style={{padding:'48px 24px',borderRadius:28,border:`1px solid ${color}44`,background:'rgba(255,255,255,0.02)',textAlign:'center',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at center,${color}14,transparent 72%)`,pointerEvents:'none'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <Lock style={{width:44,height:44,color,margin:'0 auto 16px',opacity:0.5}}/>
              <div style={{fontSize:8,fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase',color,marginBottom:8}}>Requires {activePhase<=2?'Prana Flow ◈':activePhase===3?'Siddha Quantum ◉':'Akasha Infinity ∞'}</div>
              <div style={{fontSize:20,fontWeight:900,color:'rgba(255,255,255,0.9)',marginBottom:8}}>{phaseName}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:24}}>{courses.filter(c=>c.phase===activePhase).length} sacred modules await your initiation</div>
              <button onClick={()=>navigate(getSalesPageForRank(getCourseTierRequiredRank(PHASE_TIER_SLUG_AA[activePhase])))}
                style={{padding:'12px 32px',borderRadius:999,background:`linear-gradient(135deg,${color},${color}bb)`,color:'#050505',fontSize:11,fontWeight:900,letterSpacing:'0.22em',textTransform:'uppercase',border:'none',cursor:'pointer',boxShadow:`0 0 28px ${color}33`,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Unlock This Phase
              </button>
            </div>
          </div>
        ):activeModules.length===0?(
          <div style={{padding:'48px 16px',borderRadius:24,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>
            <BookOpen style={{width:36,height:36,margin:'0 auto 12px',opacity:0.3}}/>
            <p style={{fontSize:13}}>{courses.length===0?'Loading Agastya Samhita…':'No modules match your search.'}</p>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {activeModules.map(m=>(
              <HubModuleCardAA key={m.id} module={m} isAdmin={isAdmin} tier={tier} progress={progressByModuleId[m.id]}
                onNavigateUpgrade={href=>navigate(href)}/>
            ))}
          </div>
        )}

        {/* Closing */}
        <div style={{marginTop:32,padding:'28px',borderRadius:28,border:'1px solid rgba(212,175,55,0.15)',background:'rgba(212,175,55,0.04)',textAlign:'center'}}>
          <GraduationCap style={{width:28,height:28,color:'rgba(212,175,55,0.6)',margin:'0 auto 12px'}}/>
          <p style={{fontSize:8,fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase',color:'rgba(212,175,55,0.7)',marginBottom:10}}>✦ Agastya Muni · Father of Siddha Medicine ✦</p>
          <p style={{fontSize:14,fontStyle:'italic',lineHeight:1.7,color:'rgba(255,255,255,0.65)',maxWidth:480,margin:'0 auto 8px'}}>"The medicine that heals the body also heals the soul. The Siddha path is not a discipline — it is a remembering."</p>
          <p style={{fontSize:9,fontWeight:800,letterSpacing:'0.3em',textTransform:'uppercase',color:'rgba(212,175,55,0.5)'}}>Agastya Samhita · SQI Intelligence 2050</p>
        </div>
      </div>
    </motion.div>
  );
};


export const DoshaDashboard: React.FC<DoshaDashboardProps> = ({
  profile, dosha, dailyGuidance, isLoadingGuidance,
  onRestart, onFetchGuidance, isPremium = false, onOpenChat,
}) => {
  const [syncing, setSyncing] = useState(false);
  const primary = dosha.primary?.toLowerCase() || 'vata';

  useEffect(() => { onFetchGuidance(); }, [onFetchGuidance]);
  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2200); };

  const getRitualItems = (phase: string) => {
    const all = [
      ...dosha.guidelines.diet.map(d => ({ text:d, type:'diet' })),
      ...dosha.guidelines.lifestyle.map(l => ({ text:l, type:'lifestyle' })),
    ];
    const per = Math.ceil(all.length / RITUAL_PHASES.length);
    const idx = RITUAL_PHASES.findIndex(r => r.phase === phase);
    return all.slice(idx * per, (idx+1) * per);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, paddingBottom:24 }}>

      {/* ── PROFILE HEADER ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:T.glass, backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', border:`1px solid ${T.glb}`, borderRadius:T.r40, padding:'22px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:`linear-gradient(90deg,transparent,${T.gg(T.saff,0.5)},${T.gg(T.gold,0.85)},${T.gg(T.saff,0.5)},transparent)` }} />
        {/* Scan line */}
        <motion.div style={{ position:'absolute', top:0, bottom:0, width:80, background:`linear-gradient(90deg,transparent,${T.gg(T.saff,0.1)},transparent)`, left:'-80px' }}
          animate={{ left:['−80px','110%'] }} transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut', repeatDelay:2 }} />

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, position:'relative', zIndex:1 }}>
          <motion.div
            animate={{ boxShadow:[`0 0 18px ${T.gg(T.saff,0.22)}`,`0 0 34px ${T.gg(T.saff,0.5)}`,`0 0 18px ${T.gg(T.saff,0.22)}`] }}
            transition={{ duration:4, repeat:Infinity }}
            style={{ width:52, height:52, borderRadius:18, background:`linear-gradient(135deg,${T.gg(T.saff,0.24)},${T.gg(T.gold,0.1)})`, border:`1.5px solid ${T.gg(T.gold,0.52)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:T.gold, flexShrink:0 }}
          >
            {profile.name[0]}
          </motion.div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:21, fontWeight:900, letterSpacing:'-0.04em', color:T.w90 }}>{profile.name}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 11px', borderRadius:999, background:`${T.gg(T.saff,0.1)}`, border:`1px solid ${T.gg(T.saff,0.32)}`, fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:T.saff, marginTop:5 }}>
              {getDoshaEmoji(dosha.primary)} {dosha.primary} Prakriti
            </div>
          </div>
          <motion.button whileTap={{ scale:0.96 }} onClick={handleSync} disabled={syncing}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:18, background:T.glass, border:`1px solid ${T.glb}`, color:T.w50, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}
          >
            <RefreshCw style={{ width:11, height:11, animation:syncing?'spin 1s linear infinite':undefined }} />
            {syncing ? 'Syncing…' : 'Jyotish'}
          </motion.button>
        </div>

        {/* Nadi Score */}
        <div style={{ marginBottom:20 }}>
          <NadiScore dosha={dosha} />
        </div>

        {/* Dosha Orbs */}
        <div style={{ display:'flex', justifyContent:'center', gap:32, padding:'12px 0 18px' }}>
          <DoshaOrb name="Vata"  value={Number(dosha.vata)  || 45}  orbColor={T.vata}  glowHex="#60A5FA" delay={0}   element="🌬️" />
          <DoshaOrb name="Pitta" value={Number(dosha.pitta) || 35} orbColor={T.pitta} glowHex="#F59E0B" delay={0.18} element="🔥" />
          <DoshaOrb name="Kapha" value={Number(dosha.kapha) || 20} orbColor={T.kapha} glowHex="#10B981" delay={0.36} element="🌍" />
        </div>

        <AnimatePresence>
          {syncing && (
            <motion.p initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              style={{ textAlign:'center', color:`${T.saff}99`, fontSize:11, fontStyle:'italic', letterSpacing:'0.15em', marginTop:4 }}>
              ✦ Aligning Dosha frequencies with current planetary transits… ✦
            </motion.p>
          )}
        </AnimatePresence>

        <button onClick={onRestart}
          style={{ width:'100%', marginTop:14, padding:'7px', background:'transparent', border:'none', color:T.w20, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'0.38em', textTransform:'uppercase', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'color 0.2s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(212,175,55,0.7)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=T.w20}
        >
          <RotateCcw style={{ width:11, height:11 }} /> Reset Cosmic Blueprint
        </button>
      </motion.div>

      {/* ── DAILY INTELLIGENCE ── */}
      <DailyIntelligence dosha={dosha} profile={profile} />

      {/* ── SCALAR WAVE FREQUENCIES ── */}
      <ScalarWaveModule dosha={primary} isPremium={isPremium} />

      {/* ── AGASTYA WISDOM ── */}
      <AgastyaWisdomModule dosha={primary} isPremium={isPremium} />

      {/* ── ENHANCED HERBARIUM ── */}
      <EnhancedHerbarium herbs={dosha.guidelines?.herbs || []} dosha={primary} />

      {/* ── AGASTYAR ACADEMY ── */}
      <AgastyarAcademy isPremium={isPremium} />


    </div>
  );
};