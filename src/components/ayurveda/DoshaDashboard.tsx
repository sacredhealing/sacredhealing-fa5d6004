import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Brain, Heart, Leaf, Sparkles, RotateCcw, Moon,
  Zap, RefreshCw, Wind, Flame, Droplets, Star, Eye,
  Activity, Shield, Clock, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  w50: 'rgba(255,255,255,0.50)', w35: 'rgba(255,255,255,0.35)',
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
    { hz: 432, color:'#93C5FD', name:'Earth Resonance', benefit:'Grounds scattered Vata energy, calms nervous system' },
    { hz: 528, color:'#86EFAC', name:'DNA Repair', benefit:'Restores cellular integrity disrupted by Vata imbalance' },
    { hz: 174, color:'#C4B5FD', name:'Pain Foundation', benefit:'Reduces anxiety, provides sense of security to Vata' },
  ],
  pitta: [
    { hz: 396, color:'#FBBF24', name:'Liberation', benefit:'Releases guilt and fear driving Pitta perfectionism' },
    { hz: 528, color:'#86EFAC', name:'Transformation', benefit:'Transmutes Pitta fire into compassionate action' },
    { hz: 639, color:'#F4799A', name:'Heart Opening', benefit:'Softens Pitta intensity, opens heart channel' },
  ],
  kapha: [
    { hz: 741, color:'#34D399', name:'Awakening', benefit:'Stimulates Kapha movement, awakens dormant energy' },
    { hz: 852, color:'#22D3EE', name:'Third Eye', benefit:'Elevates Kapha consciousness, reduces attachment' },
    { hz: 963, color:'#D4AF37', name:'Crown Activation', benefit:'Divine connection, transcends Kapha heaviness' },
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
            Scalar waves programmed with Agastya's consciousness to rebalance your {dosha} force
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
              <span style={{ fontSize:13, fontWeight:900, color:f.color }}>{f.hz}</span>
              {activeFreq === i && playing && (
                <motion.div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:`1px solid ${T.gg(f.color,0.4)}` }}
                  animate={{ scale:[1,1.4,1], opacity:[0.6,0,0.6] }} transition={{ duration:1.8, repeat:Infinity }} />
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:800, color:f.color, marginBottom:2 }}>{f.name} · {f.hz} Hz</div>
              <div style={{ fontSize:11, color:T.w50, lineHeight:1.4 }}>{f.benefit}</div>
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
  const balance = primary === 'vata' ? dosha.vata < 60 ? 'Balanced' : 'Elevated' :
                  primary === 'pitta' ? dosha.pitta < 50 ? 'Balanced' : 'Elevated' : 'Balanced';
  const score = Math.max(0, 100 - Math.abs(dosha.vata - 45) - Math.abs(dosha.pitta - 35) - Math.abs(dosha.kapha - 20));
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
          <DoshaOrb name="Vata"  value={dosha.vata}  orbColor={T.vata}  glowHex="#60A5FA" delay={0}   element="🌬️" />
          <DoshaOrb name="Pitta" value={dosha.pitta} orbColor={T.pitta} glowHex="#F59E0B" delay={0.18} element="🔥" />
          <DoshaOrb name="Kapha" value={dosha.kapha} orbColor={T.kapha} glowHex="#10B981" delay={0.36} element="🌍" />
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

      {/* ── AGASTYA CONSULT CTA — MOST PROMINENT ── */}
      <AgastyaConsultCard dosha={dosha.primary} onOpenChat={onOpenChat || (() => {})} userName={profile.name} />

      {/* ── PERSONALITY + RISHI'S MIRROR ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Personality */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{ background:T.glass, backdropFilter:'blur(40px)', border:`1px solid ${T.gg(T.indigo,0.35)}`, borderRadius:T.r40, padding:'22px 20px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.gg(T.indigo,0.6)},transparent)` }} />
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:T.indigo, marginBottom:8, opacity:0.75 }}>Mind · Manas</div>
          <h3 style={{ fontSize:14, fontWeight:900, letterSpacing:'-0.03em', color:T.w90, display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
            <Brain style={{ width:14, height:14, color:T.indigo }} />Personality & Mind
          </h3>
          <div style={{ display:'inline-block', padding:'2px 10px', borderRadius:999, background:`${T.gg(T.indigo,0.1)}`, border:`1px solid ${T.gg(T.indigo,0.25)}`, fontSize:8, fontWeight:700, color:T.indigo, marginBottom:10 }}>
            {dosha.mentalConstitution}
          </div>
          <p style={{ fontSize:12, lineHeight:1.7, color:'rgba(255,255,255,0.65)' }}>{dosha.personalitySummary}</p>
        </motion.div>

        {/* Rishi's Mirror */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          style={{ background:`linear-gradient(135deg,${T.gg(T.lotus,0.09)},${T.gg(T.gold,0.04)})`, backdropFilter:'blur(40px)', border:`1px solid ${T.gg(T.lotus,0.4)}`, borderRadius:T.r40, padding:'22px 20px', position:'relative', overflow:'hidden', boxShadow:`0 0 40px ${T.gg(T.lotus,0.07)}` }}>
          <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(232,82,122,0.5) 9px,rgba(232,82,122,0.5) 10px)` }} />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.gg(T.lotus,0.7)},transparent)` }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:T.lotus, marginBottom:8, opacity:0.8 }}>Karmic · Rishi</div>
            <h3 style={{ fontSize:14, fontWeight:900, color:T.saff, display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
              <Heart style={{ width:14, height:14, color:T.lotus }} />The Rishi's Mirror
            </h3>
            <p style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:`${T.lotus}80`, marginBottom:10 }}>Your Karmic Constitution</p>
            <p style={{ fontSize:14, lineHeight:1.75, color:'rgba(255,255,255,0.74)', fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif" }}>
              "{dosha.lifeSituationAdvice}"
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── DAILY AI GUIDANCE ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        style={{ background:T.glass, backdropFilter:'blur(40px)', border:`1px solid ${T.glb}`, borderRadius:T.r40, padding:'22px 26px', position:'relative', overflow:'hidden', boxShadow:`0 0 50px ${T.gg(T.gold,0.06)}` }}>
        {/* Animated scan */}
        <motion.div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${T.saff},${T.gold},transparent)` }}
          animate={{ opacity:[0,0.7,0.5,0] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut', times:[0,0.3,0.8,1] }} />
        <div style={{ position:'absolute', top:'-18%', right:'-4%', opacity:0.055, fontSize:100 }}>☀️</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <Moon style={{ width:17, height:17, color:T.saff }} />
          <h3 style={{ fontSize:16, fontWeight:900, letterSpacing:'-0.03em', color:T.w90 }}>Agastya's Daily Transmission</h3>
          <Sun style={{ width:14, height:14, color:`${T.gold}55` }} />
        </div>
        {isLoadingGuidance ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[0.75,1,0.85].map((w,i) => (
              <motion.div key={i} style={{ height:14, borderRadius:7, background:`${T.gg(T.gold,0.08)}`, width:`${w*100}%` }}
                animate={{ opacity:[0.3,0.7,0.3] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.2 }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize:15, lineHeight:1.82, color:'rgba(255,255,255,0.72)', fontStyle:'italic', fontFamily:"'Cormorant Garamond',serif" }}>
            "{dailyGuidance}"
          </p>
        )}
      </motion.div>

      {/* ── TODAY'S DOSHA INTELLIGENCE ── */}
      <DailyIntelligence dosha={dosha} profile={profile} />

      {/* ── AGASTYA WISDOM MODULES ── */}
      <AgastyaWisdomModule dosha={dosha.primary} isPremium={isPremium} />

      {/* ── SCALAR WAVE HEALING ── */}
      <ScalarWaveModule dosha={dosha.primary} isPremium={isPremium} />

      {/* ── SACRED RITUAL TIMELINE ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        style={{ background:T.glass, backdropFilter:'blur(40px)', border:`1px solid ${T.glb}`, borderRadius:T.r40, padding:'22px 26px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${T.gg(T.gold,0.4)},transparent)` }} />
        <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:T.gold, opacity:0.75, marginBottom:4 }}>✦ Dinacharya · Sacred Timeline ✦</div>
        <h2 style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.04em', color:T.w90, marginBottom:20 }}>Your Daily Healing Ritual</h2>
        <div style={{ position:'relative', paddingLeft:26 }}>
          <div style={{ position:'absolute', left:7, top:8, bottom:0, width:1, background:`linear-gradient(to bottom,${T.gg(T.gold,0.7)},${T.gg(T.gold,0.07)})` }} />
          {RITUAL_PHASES.map((r, i) => {
            const items = getRitualItems(r.phase);
            return (
              <motion.div key={r.phase} style={{ display:'flex', gap:16, paddingBottom:20 }}
                initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5+i*0.1 }}>
                <div style={{ flexShrink:0, width:38, display:'flex', justifyContent:'center', paddingTop:2 }}>
                  <motion.div style={{ width:11, height:11, borderRadius:'50%', background:`linear-gradient(135deg,${T.saff},${T.gold})`, boxShadow:`0 0 12px ${T.gold}88`, zIndex:1, position:'relative' }}
                    animate={{ boxShadow:[`0 0 8px ${T.gold}66`,`0 0 18px ${T.saff}aa`,`0 0 8px ${T.gold}66`] }}
                    transition={{ duration:3, repeat:Infinity, delay:i*0.4 }} />
                </div>
                <div style={{ flex:1, paddingBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>{r.emoji}</span>
                    <div>
                      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:T.saff }}>{r.time}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:T.w90 }}>{r.label}</div>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:4 }}>
                      {items.map((item, j) => (
                        <li key={j} style={{ display:'flex', gap:7, fontSize:12, color:T.w50, lineHeight:1.5 }}>
                          <span style={{ color:`${T.gold}66`, flexShrink:0 }}>◦</span>{item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── ENHANCED HERBARIUM ── */}
      <EnhancedHerbarium herbs={dosha.guidelines.herbs} dosha={dosha.primary} />

      {/* ── UPGRADE CTA (free users) ── */}
      {!isPremium && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'32px 28px', background:`linear-gradient(135deg,${T.gg(T.lotus,0.08)},${T.gg(T.gold,0.04)})`, backdropFilter:'blur(40px)', border:`1px solid ${T.gg(T.lotus,0.3)}`, borderRadius:T.r40, textAlign:'center', boxShadow:`0 0 50px ${T.gg(T.lotus,0.07)}` }}>
          <div>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:T.lotus, marginBottom:12, opacity:0.75 }}>✦ Deepen Your Practice ✦</div>
            <h3 style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.04em', color:T.w90, marginBottom:10 }}>Unlock the Full Siddha Experience</h3>
            <p style={{ fontSize:14, lineHeight:1.7, color:T.w50, maxWidth:460 }}>Upgrade to Prana Flow for Agastya Muni AI chat, scalar healing frequencies, and deeper wisdom modules. Lifetime includes live audio Vaidya sessions.</p>
          </div>
          <motion.button whileHover={{ scale:1.06 }} whileTap={{ scale:0.97 }}
            style={{ padding:'15px 40px', borderRadius:999, background:`linear-gradient(135deg,${T.gold},${T.gold3})`, color:T.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:900, letterSpacing:'-0.02em', border:'none', cursor:'pointer', boxShadow:`0 0 30px ${T.gg(T.gold,0.35)},0 4px 20px rgba(0,0,0,0.4)`, display:'flex', alignItems:'center', gap:9 }}>
            <Zap style={{ width:16, height:16 }} /> Upgrade to Prana Flow
          </motion.button>
        </motion.div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
