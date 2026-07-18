import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw, RefreshCw } from 'lucide-react';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';
import { getDoshaEmoji } from '@/lib/ayurvedaTypes';

interface DoshaDashboardProps {
  profile: AyurvedaUserProfile;
  dosha: DoshaProfile;
  dailyGuidance: string;
  isLoadingGuidance: boolean;
  onRestart: () => void;
  onFetchGuidance: () => void;
  isPremium?: boolean;
  isSiddhaPlus?: boolean;
  isLifetime?: boolean;
  isAdmin?: boolean;
  onOpenChat?: () => void;
}

// ── TIER RANK helper ──────────────────────────────────────────────────────────
// FREE=0  PREMIUM/prana=1  SIDDHA=2  LIFETIME/akasha=3
type TierRank = 0 | 1 | 2 | 3;

// ── EXPANDABLE SECTION CARD ──────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: string; iconBg: string; iconBorder: string; iconColor: string;
  kicker: string; kickerColor: string; title: string; sub: string;
  children: React.ReactNode;
}> = ({ icon, iconBg, iconBorder, iconColor, kicker, kickerColor, title, sub, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      style={{ background:'rgba(255,255,255,0.025)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
        border:`1px solid ${open ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.055)'}`,
        borderRadius:32, marginBottom:12, overflow:'hidden',
        boxShadow: open ? '0 0 30px rgba(212,175,55,0.05)' : 'none',
        transition:'border-color 0.3s, box-shadow 0.3s' }}>
      <div onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', cursor:'pointer', userSelect:'none' }}>
        <div style={{ width:44, height:44, borderRadius:14, background:iconBg, border:`1px solid ${iconBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, color:iconColor }}>
          {icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:kickerColor, opacity:0.75, marginBottom:3 }}>✦ {kicker}</div>
          <div style={{ fontSize:15, fontWeight:900, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.9)' }}>{title}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{sub}</div>
        </div>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, transition:'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none', color:'rgba(255,255,255,0.5)', fontSize:12 }}>
          ▾
        </div>
      </div>
      <AnimatePresence>
        {open && status !== 'upcoming' && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 18px 18px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── LOCKED GATE CARD (inline) ─────────────────────────────────────────────────
const GateCard: React.FC<{ icon:string; iconColor:string; tierLabel:string; tierColor:string; title:string; sub:string }> = 
({ icon, iconColor, tierLabel, tierColor, title, sub }) => (
  <div style={{ background:'rgba(255,255,255,0.015)', border:`1px solid ${tierColor}25`, borderRadius:24, padding:'16px 18px', marginBottom:12 }}>
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:44, height:44, borderRadius:14, background:`${tierColor}10`, border:`1px solid ${tierColor}25`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, color:tierColor, opacity:0.5 }}>
        {icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:tierColor, opacity:0.6, marginBottom:3 }}>{tierLabel}</div>
        <div style={{ fontSize:15, fontWeight:900, color:'rgba(255,255,255,0.4)' }}>{title}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{sub}</div>
      </div>
      <div style={{ fontSize:18, opacity:0.25 }}>🔒</div>
    </div>
  </div>
);

// ── TIMELINE ─────────────────────────────────────────────────────────────────
const Timeline: React.FC<{ items: { time:string; icon:string; name:string; desc:string; bg:string; border:string }[] }> = ({ items }) => (
  <div style={{ position:'relative' }}>
    {items.map((item, i) => (
      <div key={i} style={{ display:'grid', gridTemplateColumns:'50px 1fr', gap:'0 12px', paddingBottom: i < items.length-1 ? 18 : 0, position:'relative' }}>
        {i < items.length-1 && <div style={{ position:'absolute', left:24, top:50, bottom:0, width:1, background:'linear-gradient(180deg,rgba(212,175,55,0.25),rgba(212,175,55,0.03))' }} />}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gridRow:'1/3' }}>
          <div style={{ width:50, height:50, borderRadius:'50%', background:item.bg, border:`1px solid ${item.border}`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, position:'relative', zIndex:1 }}>{item.icon}</div>
        </div>
        <div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', color:'#D4AF37', opacity:0.7, paddingTop:4 }}>{item.time}</div>
          <div style={{ fontSize:14, fontWeight:900, letterSpacing:'-0.02em', color:'rgba(255,255,255,0.9)', marginBottom:4 }}>{item.name}</div>
          <div style={{ fontSize:11, lineHeight:1.7, color:'rgba(255,255,255,0.5)' }}>{item.desc}</div>
        </div>
      </div>
    ))}
  </div>
);

// ── VIKRUTI ROWS ──────────────────────────────────────────────────────────────
const VikrutiRows: React.FC<{ dosha: DoshaProfile }> = ({ dosha }) => {
  const primary = dosha.primary?.toLowerCase() || 'vata';
  const aggravated = primary === 'vata' ? 'Air (Vata) 🌬️' : primary === 'pitta' ? 'Fire (Pitta) 🔥' : 'Earth (Kapha) 🌍';
  const agColor = primary === 'vata' ? '#93C5FD' : primary === 'pitta' ? '#F87171' : '#34D399';
  const rows = [
    { label:'What is aggravated right now', hint:'The energy running too high in your body today', val:aggravated, color:agColor },
    { label:'Digestive fire', hint:'Strong digestion = strong immunity', val:'Irregular 🔥', color:'#F87171' },
    { label:'Toxin level', hint:'Undigested food and emotion stored in tissue', val:'Moderate', color:'#FBBF24' },
    { label:'Vital energy', hint:'Deep life force rebuilt through sleep, food and herbs', val:'Rebuilding 🌿', color:'#34D399' },
    { label:'Seasonal pressure', hint:'Summer intensifies Fire energy', val:'Summer · Extra Fire ☀️', color:'#D4AF37' },
  ];
  return (
    <div>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:14 }}>
        Your <strong style={{ color:'#22D3EE' }}>Prakriti is permanent</strong> — who you are. This shows what is off balance today due to stress, food, or season.
      </p>
      {rows.map((r,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'11px 0', borderBottom: i < rows.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginBottom:3 }}>{r.label}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', lineHeight:1.5, maxWidth:180 }}>{r.hint}</div>
          </div>
          <div style={{ fontSize:12, fontWeight:800, textAlign:'right', flexShrink:0, marginLeft:12, color:r.color }}>{r.val}</div>
        </div>
      ))}
    </div>
  );
};

// ── HERB GRID ─────────────────────────────────────────────────────────────────
const HerbGrid: React.FC<{ extended?: boolean }> = ({ extended }) => {
  const base = [
    { e:'🌿', n:'Ashwagandha', a:'Grounds Vata', ac:'#93C5FD', d:'300mg at night. Reduces anxiety, builds Ojas.' },
    { e:'🌸', n:'Shatavari', a:'Cools Pitta', ac:'#FBBF24', d:'Nourishes moisture. Sacred restorative tonic.' },
    { e:'🍃', n:'Triphala', a:'Balances All', ac:'#34D399', d:'1 tsp before bed. Master tridoshic cleanser.' },
    { e:'🌾', n:'Brahmi', a:'Clarifies Mind', ac:'#D4AF37', d:'For the racing Vata mind. Sacred brain tonic.' },
  ];
  const extra = [
    { e:'🪨', n:'Shilajit', a:'Kaya Kalpa ∞', ac:'#D4AF37', d:'Himalayan mineral pitch. Rejuvenates all dhatus.' },
    { e:'🌺', n:'Guduchi', a:'Amrita Plant', ac:'#FBBF24', d:'Nectar herb. Tridoshic immune tonic.' },
    { e:'🫚', n:'Swarna Bhasma', a:'Gold Ash ∞', ac:'#D4AF37', d:'Akasha exclusive. Purified gold ash.' },
    { e:'🔮', n:'Chyawanprash', a:'Ojas Builder', ac:'#FF8C00', d:"Agastya longevity formula. 1 tsp every morning." },
  ];
  const herbs = extended ? [...base, ...extra] : base;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
      {herbs.map((h,i) => (
        <div key={i} style={{ padding:12, borderRadius:18, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:20, marginBottom:6 }}>{h.e}</div>
          <div style={{ fontSize:12, fontWeight:900, marginBottom:2 }}>{h.n}</div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', marginBottom:5, opacity:0.85, color:h.ac }}>{h.a}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{h.d}</div>
        </div>
      ))}
    </div>
  );
};

// ── HZ GRID ───────────────────────────────────────────────────────────────────
const HzGrid: React.FC<{ dosha: string }> = ({ dosha }) => {
  const [active, setActive] = useState(0);
  const vata = [
    { hz:'528 Hz', c:'#22D3EE', n:'Start Here — Your #1', d:'Cellular repair. Reduces inflammation. Daily for Vata types.' },
    { hz:'174 Hz', c:'#93C5FD', n:'For Pain and Tension', d:'Neck, back, joints. Penetrates deep into tissue.' },
    { hz:'417 Hz', c:'#FBBF24', n:'Release Stuck Emotion', d:'Pitta frustration in liver and gut. Shifts blocks.' },
    { hz:'432 Hz', c:'#D4AF37', n:'Grounding and Calm', d:'When your mind will not stop. Immediately calmer.' },
    { hz:'639 Hz', c:'#34D399', n:'Open Your Heart', d:'Loneliness or disconnection. Heart centre resonance.' },
    { hz:'963 Hz', c:'#A78BFA', n:'Deep Meditation', d:'Low volume overnight. Healing dreams. Crown activation.' },
  ];
  const pitta = [
    { hz:'396 Hz', c:'#FBBF24', n:'Release Anger & Control', d:'Pitta tension in liver. Releases perfectionism and heat.' },
    { hz:'417 Hz', c:'#F87171', n:'Clear Pitta Blocks', d:'Dissolves emotional rigidity. Shifts Fire accumulation.' },
    { hz:'528 Hz', c:'#22D3EE', n:'DNA & Cell Repair', d:'Repairs inflammation damage. Your core healing frequency.' },
    { hz:'639 Hz', c:'#34D399', n:'Heart Opening', d:'Pitta isolates — this reconnects. Anahata activation.' },
    { hz:'741 Hz', c:'#A78BFA', n:'Toxin Release', d:'Clears Pitta-Ama from liver and blood.' },
    { hz:'963 Hz', c:'#D4AF37', n:'Sahasrara Cooling', d:'Crown frequency. Pitta overdrive in the mind — calms it.' },
  ];
  const kapha = [
    { hz:'285 Hz', c:'#34D399', n:'Tissue Regeneration', d:'Rebuilds Kapha tissues. Cellular renewal.' },
    { hz:'396 Hz', c:'#FBBF24', n:'Release Attachment', d:'Kapha holds on — this frequency helps let go.' },
    { hz:'528 Hz', c:'#22D3EE', n:'DNA Repair', d:'Daily use. Activates Kapha healing intelligence.' },
    { hz:'741 Hz', c:'#A78BFA', n:'Detox & Awakening', d:'Clears Ama from dense Kapha tissues.' },
    { hz:'852 Hz', c:'#93C5FD', n:'Intuition & Clarity', d:'Kapha clouds the mind — this pierces through.' },
    { hz:'963 Hz', c:'#D4AF37', n:'Crown Activation', d:'Kapha needs upward energy — crown frequency lifts it.' },
  ];
  const d = dosha?.toLowerCase() || 'vata';
  const freqs = d === 'pitta' ? pitta : d === 'kapha' ? kapha : vata;
  return (
    <div>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:14 }}>
        Play through headphones or a speaker near you. Each frequency targets something specific in your {d.charAt(0).toUpperCase()+d.slice(1)}-Pitta body.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
        {freqs.map((f,i) => (
          <div key={i} onClick={() => setActive(i)}
            style={{ padding:'14px 12px', borderRadius:18,
              background: active===i ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
              border: active===i ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.07)',
              cursor:'pointer', transition:'all 0.2s' }}>
            <div style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.03em', color:f.c }}>{f.hz}</div>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.7)', margin:'3px 0 2px' }}>{f.n}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── JYOTISH PLANET TABLE ──────────────────────────────────────────────────────
const JyotishSection: React.FC<{ dosha: string }> = ({ dosha }) => {
  const d = dosha?.toLowerCase() || 'vata';
  const yours = d === 'vata' ? ['Moon','Mercury'] : d === 'pitta' ? ['Sun','Mars'] : ['Jupiter','Moon'];
  const planets = [
    { e:'☀️', n:'Sun', b:'Heart', t:'Fire', tc:'#FBBF24' },
    { e:'🌙', n:'Moon', b:'Mind', t: yours.includes('Moon') ? 'Yours ←' : 'Water', tc: yours.includes('Moon') ? '#93C5FD' : '#93C5FD' },
    { e:'☿', n:'Mercury', b:'Nerves', t: yours.includes('Mercury') ? 'Yours ←' : 'Air', tc: yours.includes('Mercury') ? '#93C5FD' : '#93C5FD' },
    { e:'♃', n:'Jupiter', b:'Liver', t: yours.includes('Jupiter') ? 'Yours ←' : 'Earth', tc: yours.includes('Jupiter') ? '#D4AF37' : '#34D399' },
    { e:'♄', n:'Saturn', b:'Bones', t:'Air', tc:'#93C5FD' },
    { e:'♀', n:'Venus', b:'Fluids', t:'Water', tc:'#D4AF37' },
    { e:'♂', n:'Mars', b:'Blood', t: yours.includes('Mars') ? 'Yours ←' : 'Fire', tc: yours.includes('Mars') ? '#FBBF24' : '#FBBF24' },
    { e:'☊', n:'Rahu', b:'Patterns', t:'Karmic', tc:'#A78BFA' },
    { e:'☋', n:'Ketu', b:'Gifts', t:'Liberation', tc:'#A78BFA' },
  ];
  const ctx = d === 'vata'
    ? 'Your Vata is ruled by the Moon and Mercury.'
    : d === 'pitta' ? 'Your Pitta is ruled by the Sun and Mars.'
    : 'Your Kapha is governed by Jupiter and Moon.';
  const weekly = d === 'vata'
    ? 'This week Moon is waxing — your Vata is naturally calmer than usual. A good window to start new health habits.'
    : d === 'pitta' ? 'Sun in high degree — extra care with Pitta heat this week. Avoid spicy foods, cool your environment.'
    : 'Jupiter direct this week — a window of expansion for Kapha. Good time to begin movement practices.';
  const tip = d === 'vata'
    ? 'Saturn moving through your Air houses — old Vata patterns surfacing for release. Double sesame oil practice. Reduce screens after sunset.'
    : d === 'pitta' ? 'Mars transit amplifying Pitta fire this week. Cooling pranayama essential. Pearl or moonstone on the left hand.'
    : 'Jupiter-Moon conjunction blessing your constitution. Begin that discipline you have been postponing.';
  return (
    <div>
      <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:12 }}>
        Each planet governs a part of your body. When strong — that organ thrives. <strong style={{ color:'#FF8C00' }}>{ctx}</strong>
      </p>
      <p style={{ fontSize:11, lineHeight:1.65, padding:'10px 12px', borderRadius:12, background:'rgba(255,140,0,0.05)', border:'1px solid rgba(255,140,0,0.15)', color:'rgba(255,255,255,0.65)', marginBottom:12 }}>{weekly}</p>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {planets.map((p,i) => (
          <div key={i} style={{ padding:'10px 10px 8px', borderRadius:16, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', textAlign:'center', minWidth:60, flex:1 }}>
            <div style={{ fontSize:16, marginBottom:4 }}>{p.e}</div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase', color:'#D4AF37', marginBottom:2 }}>{p.n}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)' }}>{p.b}</div>
            <div style={{ fontSize:8, marginTop:3, fontWeight:800, color:p.tc }}>{p.t}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, lineHeight:1.65, padding:'10px 12px', borderRadius:12, background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.15)', color:'rgba(255,255,255,0.6)', marginTop:12 }}>
        💡 <strong style={{ color:'#D4AF37' }}>This week:</strong> {tip}
      </p>
    </div>
  );
};

// ── AUDIO TEACHINGS (Akasha only) ────────────────────────────────────────────
const MONTHLY_TEACHINGS = [
  {
    month: 'January', num: 1,
    accent: '#D4AF37', border: 'rgba(212,175,55,0.35)', bg: 'rgba(212,175,55,0.06)',
    badge: '✦ January · Winter Transmission',
    title: 'Why You Cannot Sleep Even When You Are Exhausted',
    teaser: 'For Vata-Pitta types exhaustion after sleep means the nervous system never fully switched off. Three things to do tonight that change your sleep within a week.',
    sections: [
      { label: 'The Siddha Explanation', text: 'In Siddha medicine the inability to sleep despite exhaustion is called Vatham Vittalai — displaced Vata. Your physical body is tired but Prana Vata has become overactivated and cannot descend from the head into the body. Vata-Pitta types are especially vulnerable because Pitta keeps the mind sharp even at midnight while Vata keeps it moving and anxious. The root cause is Prana Mala — a subtle toxin in the Mano-Vaha Srota from unprocessed stimulation: screens, urgent thinking, undigested emotional events. This toxin blocks the natural downward flow of Apana Vata that pulls consciousness from wakefulness into sleep.' },
      { label: 'Why Your Body Is Exhausted But Your Mind Is Not', text: 'Dhatu-Agni (tissue fire) burns too hot all day depleting Ojas — the body collapses but the nervous system remains lit. Undigested thoughts (Manasa Ama) accumulate in the Chitta and generate low-level anxiety preventing the brain-wave shift from Beta to Theta. For Pitta types cortisol spikes between 10 PM and 2 AM — the Pitta-dominant window. If you are still mentally active at 10 PM you have missed the Kapha window (6–10 PM) when sleep comes easiest. The Hridaya Marma (heart vital point) holds the day\'s emotional residue — any unresolved conversation or worry keeps it energetically activated even when the body is prone.' },
      { label: 'Three Things To Do Tonight', isProtocol: true, steps: ['At 9 PM apply warm sesame oil to the soles of your feet (Talahridaya Marma) and the crown of your head (Brahmarandra). This grounds rising Vata and begins the downward descent of Prana. 3 minutes.', 'Drink warm milk with ¼ tsp Ashwagandha and a pinch of nutmeg (Jathikkai). Ashwagandha rebuilds depleted Ojas; nutmeg is the strongest natural sedative in Siddha pharmacopoeia.', 'Lie in Savasana and practice Nadi Shodhana at 4:4:8 ratio — 4 counts inhale, 4 hold, 8 exhale. The extended exhale activates the parasympathetic nervous system and shifts Apana Vata downward. 7 rounds.'] },
    ],
    quote: { tamil: 'உறக்கம் என்பது மரணம் அல்ல — உயிரின் திரும்பல்', english: 'Sleep is not death — it is the return of the life-force to its source. The one who cannot sleep has forgotten how to surrender.', master: 'Thirumoolar · Thirumantiram 728' },
  },
  {
    month: 'February', num: 2,
    accent: '#FF8C00', border: 'rgba(255,140,0,0.35)', bg: 'rgba(255,140,0,0.06)',
    badge: '🌿 February · Agni Teaching',
    title: 'The Food That Is Slowly Draining You',
    teaser: 'Most health problems are caused by the wrong food for your constitution. Three foods your Vata-Pitta body is reacting to right now — and what to eat instead.',
    sections: [
      { label: 'The Siddha View on Food Incompatibility', text: 'Pathyam (right food for your nature) is not merely nutrition — it is a vibrational compatibility between your Prakriti field and the living intelligence of food. When you eat food incompatible with your constitution it does not just fail to nourish — it generates Ama (undigested toxic residue) that accumulates in the weakest Dhatu. For Vata-Pitta types the digestive Agni swings between too sharp (Tikshna Agni — Pitta phase causing acid reflux and inflammation) and too variable (Vishama Agni — Vata phase causing bloating, gas, irregular hunger).' },
      { label: 'Three Foods Your Body Is Reacting To', text: 'Raw salads and cold foods: Vata types have irregular Agni; cold food suppresses it further. Result is undigested food fermenting in the colon — gas, bloating, joint pain, fatigue. Switch to lightly cooked warm oiled vegetables.\n\nFermented foods at night (yogurt, aged cheese, kombucha): For Pitta-elevated types these amplify Pitta fire after 6 PM disturbing sleep and over-acidifying the Rakta Dhatu. Have yogurt only at lunch, never at dinner.\n\nNightshades in excess (tomatoes, peppers, eggplant): These are Ushna Virya (heating) and aggravate both Vata and Pitta simultaneously creating chronic low-grade inflammation in joints, gut lining, and nervous system.' },
      { label: 'The Vata-Pitta Pacifying Plate', isProtocol: true, steps: ['Morning: Warm lightly spiced porridge (rice or oats) with ghee, cardamom, and raisins. Builds Ojas, balances both Vata and Pitta, grounds the nervous system before the day.', 'Lunch (main meal): Cooked grains + cooked legumes + ghee + digestive spices (cumin, coriander, fennel). Eat the largest most complex meal at midday when Agni is strongest.', 'Evening: Light warm easy-to-digest food only. Kitchari (rice + moong dal) or soup. Nothing raw, cold, fermented, or heavy. The digestive system needs rest by 7 PM.'] },
    ],
    quote: { tamil: 'உண்ணும் உணவே உடலின் தெய்வம்', english: 'The food you eat is the deity of your body — worship it correctly and it gives you life; worship it wrongly and it becomes the architect of your disease.', master: 'Agathiyar · Agastyar 3000' },
  },
  {
    month: 'March', num: 3,
    accent: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.15)', bg: 'rgba(255,255,255,0.03)',
    badge: '◇ March · Archive Transmission',
    title: 'How Stress Becomes Physical Disease',
    teaser: 'Unprocessed emotion moves into the body and becomes pain, stiffness, or inflammation. The Siddha map of exactly where your stress is hiding and how to release it.',
    sections: [
      { label: 'The Siddha Map of Emotion-to-Disease', text: 'Emotions are Prana movements with specific frequencies that resonate with specific Dhatus and Srotas. When an emotion is suppressed its Prana frequency becomes lodged in the corresponding physical tissue and begins to alter that tissue\'s intelligence. This is the Siddha understanding of psychosomatic disease: the body is not separate from the mind — it is the mind in its densest expression. Every thought and emotion is simultaneously a physical event materializing in physical tissue within weeks, months, or years depending on intensity and repetition.' },
      { label: 'Where Stress Hides in Your Body', text: 'Chronic worry and fear → neck, shoulders, lower back: Vata-type fear contracts Apana Vata creating holding patterns in the psoas and lumbar fascia. Over years this becomes chronic cervical tension and disc degeneration.\n\nAnger and frustration → liver, small intestine, skin: Pitta-type anger heats the Rakta Dhatu. Chronic anger inflames the liver, creates hypersensitive gut lining, and erupts through the skin.\n\nGrief and attachment → lungs and large intestine: Unprocessed grief depletes Prana in the Pranavaha Srota leading to shallow breathing and lowered immunity.\n\nChronic mental overload → heart and Hridaya Marma: Sustained pressure without rest depletes Ojas in the heart — palpitations, anxiety, difficulty feeling joy.' },
      { label: 'Siddha Stress Release — Three-Tissue Method', isProtocol: true, steps: ['Locate the holding site: Lie down and scan your body. Where is there density, heat, tightness, or numbness? This is where unprocessed Prana is lodged. Name the region.', 'Apply Hridaya Marma pressure: With the heel of your right hand apply gentle circular pressure to the center of your sternum. This is the master point for emotional clearing. 90 seconds, slow circles.', 'Breathe directly into the holding site: Inhale slowly directing breath to the tight region. On the exhale make a soft "Haaa" sound (the Agni Bija). This vibrates tissue at the frequency that releases fascia and restores Prana flow. 12 rounds.', 'Complete with Kaya Shuddhi: Take 3 deep breaths visualizing golden light entering through the crown and washing through every tissue from head to feet on the exhale.'] },
    ],
    quote: { tamil: 'மனம் தெளிந்தால் மருந்து வேண்டாம்', english: 'When the mind becomes clear medicine is no longer needed — the body heals itself through the intelligence it was always carrying.', master: 'Bogar Siddhar · Bogar 7000' },
  },
  {
    month: 'April', num: 4,
    accent: '#4ADE80', border: 'rgba(74,222,128,0.32)', bg: 'rgba(74,222,128,0.05)',
    badge: '🌱 April · Spring Detox Transmission',
    title: 'The Spring Detox Your Body Has Been Waiting For',
    teaser: 'Kapha season is the one time of year when accumulated Ama naturally liquefies and is ready to be expelled. The Siddha protocol to complete this process before it re-hardens.',
    sections: [
      { label: 'Why Spring Is the Most Important Detox Window', text: 'Spring corresponds to the Kapha-Pitta sandhi (seasonal crossover) when accumulated Kapha begins to liquefy under rising spring Pitta. This liquefied Kapha is now mobile and can either be properly expelled — or if you eat the wrong foods, it reabsorbs and becomes Sthana Samshraya Ama (site-lodged toxin) causing the chronic congestion, allergies, lethargy, and heaviness most people experience every spring. The 14 days of early spring are the most powerful Shodhana (purification) window of the entire year.' },
      { label: 'The Five Signs You Need This Detox', text: 'You wake up tired even after 8 hours of sleep (Kapha coating on the Mano-Vaha Srota). Heavy or coated white/yellow tongue in the morning (Ama on the digestive channel). Sinus congestion or mucus excess (Kapha blocking the respiratory channel). Joints feel stiff in the morning but loosen as the day progresses. Low motivation, mental fog, difficulty starting tasks (Tamas — the Kapha-Ama quality affecting the Manas/mind).' },
      { label: 'The Siddha 7-Day Spring Protocol', isProtocol: true, steps: ['Days 1–3 (Preparation): Eat only warm light spiced foods. No dairy, no cold foods, no heavy grains. Begin each day with 1 tsp of triphala in warm water before sleep the night before. This begins to soften and mobilize Ama.', 'Days 4–5 (Agni Kindling): Add ½ tsp dry ginger + ¼ tsp black pepper + ¼ tsp long pepper (Trikatu) to hot water each morning. This sharp-hot combination specifically cuts through Kapha-Ama in the digestive and respiratory channels.', 'Days 6–7 (Active Purification): Practice 30 minutes of vigorous Siddha yoga each morning to mobilize Kapha through sweat. Follow with a 15-minute steam (Swedana) if available. Drink warm water with lemon and ginger throughout the day.', 'Post-protocol (Rebuilding): Continue avoiding cold, heavy, fermented foods for another week while the digestive Agni restores its natural Sama (balanced) state.'] },
    ],
    quote: { tamil: 'வசந்த காலம் உடலின் புதுப்பிப்பு நேரம்', english: 'Spring is the body\'s renewal time — the season when the earth demonstrates the art of letting go and beginning again.', master: 'Agathiyar · Bhogar Nighantu' },
  },
  {
    month: 'May', num: 5,
    accent: '#22D3EE', border: 'rgba(34,211,238,0.32)', bg: 'rgba(34,211,238,0.05)',
    badge: '💧 May · Rasayana Transmission',
    title: 'Ojas — The Master Vital Essence You Are Depleting Without Knowing',
    teaser: 'Ojas is the most refined product of perfect digestion — the physical substrate of immunity, radiance, and spiritual capacity. Most modern people have critically low Ojas. Here is how to rebuild it.',
    sections: [
      { label: 'What Ojas Actually Is', text: 'Ojas is the eighth and final distillation of food through all seven Dhatu layers: food → plasma → blood → muscle → fat → bone → nerve/marrow → reproductive essence → Ojas. One drop of Ojas requires approximately 30 days of perfect digestion of pure food to produce. Ojas resides primarily in the heart (Hridaya) and is the physical basis of the immune system, the lustre of skin and eyes, the stability of the mind, and what Siddha masters call Tejas — the inner radiance that makes a person\'s presence felt in a room before they speak.' },
      { label: 'The Seven Ways You Are Depleting Ojas', text: 'Excessive sexual activity without Brahmacharya periods (the reproductive essence depletes before completing its conversion to Ojas). Chronic stress and anxiety (Vata burns Ojas like wind evaporates water). Sleep deprivation (tissue repair that produces Ojas happens only in deep sleep before midnight). Excessive talking especially emotionally charged talk (Vak-Prana depletes Ojas when used without rest). Poor digestion (any food that creates Ama blocks the final conversion step). Excessive fasting or extreme diets. Digital overstimulation — the eyes and nervous system are primary channels of Prana output.' },
      { label: 'The Ojas Rebuilding Protocol', isProtocol: true, steps: ['The Siddha Ojas Tonic: Each morning combine 1 tsp raw honey + 1 tsp pure ghee + 8 soaked almonds (ground) + ½ tsp Shatavari powder + ¼ tsp cardamom in warm milk. Take 30 minutes before eating. This is Bala Rasayana — the strength-vitality formula. Minimum 40 days.', 'Sleep architecture: Be in bed before 10 PM. The Kapha window (6–10 PM) is when Ojas production is highest. Every night before 10 PM is worth 3 hours after midnight in Ojas terms.', 'Brahmacharya practice: One day per week of complete sense-withdrawal — no screens, minimal speech, simple food, meditation. Minimum Ojas-protective practice for high-stimulation environments.', 'Shiro Abhyanga: 5 minutes of warm sesame oil application to the scalp before sleep each night. The scalp directly nourishes Majja Dhatu (nerve tissue) which is the penultimate step before Ojas production.'] },
    ],
    quote: { tamil: 'ஓஜஸ் இருந்தால் நோய் வராது', english: 'Where Ojas is full disease cannot enter — for Ojas is the body\'s agreement with life itself.', master: 'Konganar Siddhar · Konganar Vaithiyam 800' },
  },
  {
    month: 'June', num: 6,
    accent: '#F59E0B', border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.05)',
    badge: '☀️ June · Pitta Season Transmission',
    title: 'Cooling the Fire — Pitta Season Survival for Vata-Pitta Types',
    teaser: 'Summer is Pitta season. For Vata-Pitta types this is when inflammation, skin eruptions, irritability, and burnout peak. The Siddha cooling protocol that protects your system through the heat.',
    sections: [
      { label: 'Why Summer Is Your Most Vulnerable Season', text: 'Summer\'s heat amplifies Pitta in the environment — and in Vata-Pitta types who already have a Pitta component this external heat is added to internal fire creating Pitta Vriddhi (Pitta excess). The signs are unmistakable: short temper that was not there in winter, skin that flushes or breaks out, acid reflux peaking in summer, eyes that are red or light-sensitive, and a driven quality to work that teeters toward burnout. Left unaddressed summer Pitta Vriddhi accumulates as Rakta Pitta (blood-Pitta) — a deep inflammatory state that is the root of most autoimmune conditions and early aging.' },
      { label: 'The Siddha Pitta Cooling Foods', text: 'Cooling foods that directly reduce Pitta: Coconut in every form — coconut water, coconut oil for cooking, fresh coconut. Coconut is considered the supreme Pitta pacifier in Siddha medicine. Pomegranate — cools the blood, reduces Rakta Pitta, restores Ojas. Cucumber, coriander, fennel, mint — all Sheeta Virya (cooling in post-digestive effect). Rose water — drunk and applied to the eyes and face. Amla (Nellikai) — the highest natural Vitamin C; directly reduces Pitta while rebuilding Ojas.\n\nFoods to strictly avoid in summer: Alcohol, chilies, garlic in excess, red meat, nightshades, fermented foods, coffee after noon, all fried food — each is Ushna Virya (heating) and will amplify Pitta Vriddhi.' },
      { label: 'Daily Summer Practice', isProtocol: true, steps: ['Begin every day with 1 cup of room-temperature rose water + 1 tsp raw cane sugar + ¼ tsp cardamom. This is the Siddha Hridaya Tarpana (heart nourishment drink) for summer — it cools the blood and stabilizes the morning Pitta spike.', 'Apply coconut oil to the soles of the feet and the crown of the head before your morning shower. Coconut oil is the single most effective topical Pitta reducer — absorbed through the Marma points it reduces systemic heat within 20 minutes.', 'Practice Sheetali Pranayama (cooling breath) daily: roll the tongue into a tube, inhale deeply through the tongue-tube, hold 4 counts, exhale through the nose. 12 rounds. This directly cools the blood and calms the liver.', 'End every workday with a complete screen-free 30-minute period before starting any evening activity. Pitta burnout is 70% driven by unbroken mental work. This transition ritual is more effective than any supplement.'] },
    ],
    quote: { tamil: 'நெருப்பை தணிக்க நீர் வேண்டும் — உள்ளே இருக்கும் நெருப்பை தணிக்க அமைதி வேண்டும்', english: 'Water is needed to quench outer fire — but silence is needed to quench the fire within.', master: 'Sattamuni Siddhar · Sattamuni Gnanam' },
  },
  {
    month: 'July', num: 7,
    accent: '#A78BFA', border: 'rgba(167,139,250,0.32)', bg: 'rgba(167,139,250,0.05)',
    badge: '🔮 July · Varma Transmission',
    title: 'The 5 Varma Points That Heal 80% of Common Ailments',
    teaser: 'Varma Shastra is the Siddha science of vital energy points — more precise than acupuncture, older than Marma therapy. Five key points you can activate at home to heal headaches, fatigue, digestion, anxiety, and immunity.',
    sections: [
      { label: 'What Varma Points Are', text: 'Varma points (Varmam) are junctions where Prana is concentrated and where the Sukshma Sharira (subtle body) interfaces directly with the physical body. The Siddha masters identified 108 primary Varma points. Unlike acupuncture which works primarily through meridian flow Varma therapy works through direct Prana activation at the point itself — releasing blocked Prana, restoring Nadi flow, and transmitting healing frequency directly into the Dhatu beneath. The following five points are safe for self-practice and among the most clinically powerful in the system.' },
      { label: 'The Five Points and Their Actions', text: 'Kalam Varma (center of the sternum): The master cardiac point. Activates Ojas in the Hridaya, releases emotional holding, restores Prana circulation to the upper body. Press with 3 fingers, gentle circular motion, 90 seconds.\n\nAmmni Varma (2 fingers below the navel): The master digestive and Apana Vata point. Restores digestive fire, relieves bloating and cramping. Press with the thumb, gentle pulsing pressure, 60 seconds.\n\nThiruvarthi Varma (base of skull, occipital ridge): Releases Vata tension from the head-neck junction. Relieves headaches, neck pain, mental fatigue. Use thumbs bilaterally, upward pressure, 60 seconds.\n\nKuzhi Varma (temples, 1 finger behind the outer eye corner): Relieves anxiety, racing thoughts, eye strain, insomnia. Circular pressure with middle fingers, 60 seconds each side.\n\nAdi Thadam Varma (arch of the foot): The grounding Vata point. For anxiety, hyperactivity, and excessive thinking. Press with the thumb into the arch, hold steady pressure, 90 seconds each foot.' },
      { label: 'Daily Varma Self-Care Sequence', isProtocol: true, steps: ['Morning activation (2 minutes): Adi Thadam Varma (both feet, 30 seconds each) to ground Prana before the day. Then Kalam Varma (sternum, 60 seconds) to open the heart center and stabilize Ojas.', 'Midday reset (90 seconds): When mental fatigue hits — Thiruvarthi Varma (occipital base, 60 seconds with both thumbs) + Kuzhi Varma (temples, 30 seconds). Restores Prana to the brain and clears Manasa Ama accumulated through the morning.', 'Evening release (3 minutes): Ammni Varma (navel, 60 seconds) to process the day\'s digestive and emotional Ama. Then Kalam Varma (sternum, 90 seconds) to release the heart center. End with 3 deep breaths and the sound "Mmmm" (Brahma Nada) to seal the Prana.', 'Never apply Varma pressure to inflamed, injured, or infected tissue. Apply only to healthy skin. The pressure should feel like a good ache — firm but not painful.'] },
    ],
    quote: { tamil: 'வர்மம் அறிந்தவன் மரணத்தை வெல்வான்', english: 'The one who knows Varma conquers death — for Prana has revealed its architecture and obeys his understanding.', master: 'Agathiyar · Varma Odivu Murivu Saaram' },
  },
  {
    month: 'August', num: 8,
    accent: '#34D399', border: 'rgba(52,211,153,0.32)', bg: 'rgba(52,211,153,0.05)',
    badge: '🌿 August · Rasayana Herbs Transmission',
    title: 'The Six Siddha Herbs Every Person Should Take Daily',
    teaser: 'Not supplements. Consciousness-activated plants from the Siddha pharmacopoeia — each one a living intelligence that builds a specific tissue and clears a specific imbalance.',
    sections: [
      { label: 'The Siddha View on Medicinal Plants', text: 'In Siddha medicine plants are not collections of active chemical compounds — they are living beings with their own Prana field, consciousness (Chetana), and intention. The Siddha masters communicated directly with plant intelligences to receive the transmissions of their healing properties. A daily herbal regimen in Siddha is called Pathiyam Rasayana — not medication but an ongoing nutritional communion with plant consciousness that gradually recalibrates the Prakriti toward its optimal expression.' },
      { label: 'The Six Daily Siddha Plants', text: 'Amla (Nellikai): The king of Siddha herbs. Contains the highest natural Vitamin C, rebuilds Ojas, reduces Pitta, supports all seven Dhatus simultaneously. Take 1 tsp of Amla powder in warm water each morning.\n\nAshwagandha (Amukkara): The master Vata-reducing adaptogen. Rebuilds Majja Dhatu (nerve tissue), increases Ojas, reduces cortisol. Take ½ tsp in warm milk each night before sleep.\n\nTurmeric (Manjal): The universal anti-Ama herb — breaks down Ama in the channels and is simultaneously anti-inflammatory, antimicrobial, and Pitta-regulating. Take ¼ tsp daily.\n\nTulsi (Thulasi): The Prana herb. Opens the Pranavaha Srota, protects against environmental Ama, has unique Prabhava on the heart and immune field. Chew 3–5 fresh leaves each morning.\n\nTriphala (Three Fruits): The master bowel-and-channel tonic. Taken each night before sleep it gradually cleanses all seven Dhatus beginning with the digestive channel. ½ tsp in warm water before sleep.\n\nShatavari: The supreme Ojas-building herb for Pitta types. Rebuilds reproductive tissues, nourishes Rasa and Rakta Dhatu, the most important herb for Vata-Pitta under chronic stress. ½ tsp in warm milk each morning.' },
      { label: 'The Daily Rasayana Timing', isProtocol: true, steps: ['Morning (before breakfast): 1 tsp Amla powder in warm water. 3–5 Tulsi leaves chewed. ½ tsp Shatavari in warm milk.', 'With meals: ¼ tsp Turmeric in any cooked food or warm water. This is your daily Shodhana (channel-clearing) practice.', 'Evening (30 min before sleep): ½ tsp Ashwagandha in warm milk. ½ tsp Triphala in warm water. This combination rebuilds Ojas during sleep and cleanses the channels during the overnight lymphatic cycle.', 'Always use organic single-origin herbs when possible. The Prana content of the herb is directly related to the quality of its cultivation.'] },
    ],
    quote: { tamil: 'மூலிகை உண்பவன் மூப்படையான்', english: 'The one who takes the right herbs does not age — for the plant\'s intelligence continuously renews what time would otherwise erode.', master: 'Siddha Gunapadam · Agathiyar Tradition' },
  },
  {
    month: 'September', num: 9,
    accent: '#F97316', border: 'rgba(249,115,22,0.32)', bg: 'rgba(249,115,22,0.05)',
    badge: '🍂 September · Vata Season Preparation',
    title: 'Preparing for Vata Season — How to Not Get Sick This Autumn',
    teaser: '80% of the colds, joint pains, anxiety spikes, and digestive problems that happen in October-November are predictable and preventable. The protocol begins in September.',
    sections: [
      { label: 'The Vata Seasonal Cycle', text: 'Vata season (autumn to early winter) is the season of movement, dryness, and cold — and for the millions of people who have Vata as their dominant or secondary dosha this is the season of maximum vulnerability. Vata accumulates through summer\'s activity, travel, and irregular routine — and when the cold dry windy qualities of autumn arrive the accumulated Vata rapidly expresses as nervous system hypersensitivity, dry skin and mucous membranes, erratic digestion, insomnia, anxiety, joint stiffness, and a dropping of the immune threshold that invites infection. The Siddha approach is prophylactic — begin grounding Vata in September before the symptoms arrive.' },
      { label: 'The Five Signs Vata Is Rising', text: 'Your thoughts are faster than usual — more mental chatter, more worry, more difficulty staying present. Your skin and lips are drying out even with normal hydration. Your sleep is becoming lighter — waking between 2–4 AM (the Vata hour). Your appetite is irregular — sometimes very hungry, sometimes forgetting to eat. Your joints feel stiffer or pop and click more than usual (Vata dehydrating the synovial channels).' },
      { label: 'The September Vata Prevention Protocol', isProtocol: true, steps: ['Daily Abhyanga (self-oil massage): Warm sesame oil applied to the entire body before the morning shower — at minimum the scalp, ears, hands, and feet. Do this every day from September onwards. This is the single most important Vata-pacifying practice in the Siddha system. 5–10 minutes.', 'Dietary shift: From September transition to warm oily heavier sweet-sour-salty foods. Soups, stews, ghee, warm grains, root vegetables, nuts. Reduce raw foods, cold drinks, and light/dry foods. The digestive Agni naturally wants to increase in autumn.', 'Routine (Dinacharya): Vata is the dosha that destabilizes most when routine breaks down. September is the time to establish firm sleep, meal, and practice times. Wake and sleep at the same time every day. This regularity is medicine for Vata.', 'Nasya (nasal oil): Apply 2–3 drops of warm sesame oil to each nostril each morning before going outside. This protects the nasal mucosa (primary Vata entry point), prevents sinusitis and upper respiratory infection, and nourishes the brain through the nasal-brain connection.'] },
    ],
    quote: { tamil: 'வாதம் அடங்கில் வாழ்வு நீடிக்கும்', english: 'When Vata is subdued life is prolonged — for Vata governs all movement, and when movement is steady, time itself slows.', master: 'Thirumoolar · Thirumantiram 817' },
  },
  {
    month: 'October', num: 10,
    accent: '#EC4899', border: 'rgba(236,72,153,0.32)', bg: 'rgba(236,72,153,0.05)',
    badge: '🌸 October · Shakti Medicine Transmission',
    title: 'The Feminine Healing Code — Shakti Medicine for All Bodies',
    teaser: 'Siddha Shakti Medicine is the science of the feminine principle (Yin, cooling, receptive, lunar intelligence) that every body needs to balance the masculine. Most modern disease comes from an excess of the solar principle.',
    sections: [
      { label: 'The Siddha Shakti Principle', text: 'In Siddha cosmology the universe is the interplay of Shiva (pure consciousness — the static masculine principle) and Shakti (the dynamic creative power — the active feminine principle). The human body requires both in precise balance. Modern life is radically Shakti-depleted in the receptive restorative dimension (parasympathetic underactivation) while being overactivated in the stress response dimension (sympathetic nervous system dominance). Siddha Shakti Medicine addresses this imbalance through Nada (sacred sound), Tantra (ritual practices), and Dravya (Shakti-activating herbs and foods).' },
      { label: 'The Lunar Body — Healing Through the Moon Cycle', text: 'The moon\'s gravitational and electromagnetic field has a direct measurable effect on the human nervous system, the water content of the body, and the Ojas production cycle.\n\nNew Moon: the lowest Prana day — ideal for fasting, silence practice, and inner work. The body\'s channels are most receptive to deep cleansing.\n\nFull Moon: the highest Prana day — ideal for vigorous practice, Rasayana intake, and deep meditation. Siddha tradition prescribes specific mantras on full moon that amplify practice 12-fold.\n\nWaxing Moon (new to full): building phase — ideal for Rasayana and any healing intention that requires building or increasing.\n\nWaning Moon (full to new): releasing phase — ideal for Shodhana (purifying) practices and completing cycles.' },
      { label: 'The Shakti Activation Practice', isProtocol: true, steps: ['Lunar awareness practice: Note the current moon phase daily. On new moon days eat light, practice silence for 1 hour, and drink only warm water with lemon and honey. This practice recalibrates the body\'s Prana cycle to the lunar field within 3 months.', 'Shakti Nada practice: Each evening for 5 minutes hum the sound "HMMM" with the lips sealed — a deep resonant hum felt in the chest and belly. This is the Brahmanada — the primordial sound that activates the Shakti current in the Sushumna Nadi and feeds the Anahata.', 'Shatavari + Rose protocol: Take ½ tsp Shatavari powder + ½ tsp dried rose petals (or rose water) in warm milk each evening. Shatavari is the primary Shakti herb in Siddha medicine. Rose works on the heart-Prana level.', 'Earth connection: 10 minutes of bare feet on natural ground (grass, earth, stone) each day reestablishes the electromagnetic connection between the body\'s biofield and the earth\'s Shakti field. This is called Bhumi Sparsha — Earth Touch.'] },
    ],
    quote: { tamil: 'சக்தி இல்லாமல் சிவன் இல்லை — உடல் இல்லாமல் ஆத்மன் இல்லை', english: 'Without Shakti there is no Shiva — without the body there is no Self. Honor the vessel and the Self is honored.', master: 'Sivavakkiyar Siddhar · Sivavakkiyam 300' },
  },
  {
    month: 'November', num: 11,
    accent: '#6EE7B7', border: 'rgba(110,231,183,0.32)', bg: 'rgba(110,231,183,0.05)',
    badge: '🌙 November · Dinacharya Transmission',
    title: 'The Perfect Siddha Day — Dinacharya for the Modern World',
    teaser: 'Dinacharya (daily routine) is considered more powerful than any medicine in Siddha tradition. A correctly structured day prevents 90% of disease before it begins.',
    sections: [
      { label: 'Why Routine Is Medicine', text: 'The human body is a dynamic pattern of rhythmic cycles — Prana, hormonal, digestive, lymphatic, neural, and circadian. Health is the state of these cycles being synchronized with each other and with the larger cycles of nature. Disease begins when these rhythms desynchronize. Dinacharya is the technology of re-synchronization — a daily routine precisely timed to align the body\'s cycles with the day\'s natural doshic phases (Kapha 6–10 AM, Pitta 10 AM–2 PM, Vata 2–6 PM, Kapha 6–10 PM, Pitta 10 PM–2 AM, Vata 2–6 AM) thereby optimizing every physiological process automatically without supplements or intervention.' },
      { label: 'The Modern Siddha Day — Hour by Hour', text: '5:00–6:00 AM (Brahma Muhurta): Wake naturally. Meditation and mantra practice are 10x more powerful in this window. Even 10 minutes of silence before any screen is transformative.\n\n6:00–7:00 AM: Oil pulling with sesame oil 5 minutes. Tongue scraping. Warm water with lemon. Nasya (nasal oil). Abhyanga (oil massage minimum 5 minutes). Shower.\n\n7:00–8:00 AM: Yoga or movement (30 minutes). Pranayama (10 minutes). Meditation (20 minutes). This sequence takes the body from sleep to full Prana activation.\n\n8:00–9:00 AM: Breakfast — warm light Ojas-building. Agni is still waking up; heavy breakfast suppresses it.\n\n10 AM–2 PM: Pitta window — hardest mental and physical work. Main meal at noon when digestive Agni peaks.\n\n2:00–6:00 PM: Vata window — creative, communicative, mobile work. Avoid major decisions in the late afternoon Vata low (3–4 PM).\n\n6:00–7:00 PM: Light movement (walk), transition from work mode. Begin screen-dimming.\n\n7:00–8:00 PM: Light dinner (before 7:30 PM ideally). Nothing raw, cold, or heavy.\n\n9:00–10:00 PM: Wind-down. Warm oil on feet and head. Herbal tea. Reading (physical book). Asleep by 10 PM.' },
      { label: 'The Three Non-Negotiables', isProtocol: true, steps: ['Wake before 6 AM (or at sunrise). Missing the Brahma Muhurta is the single habit most associated with chronic Vata imbalance, poor mental clarity, and low Ojas in Siddha clinical observation.', 'Main meal at noon (±30 minutes). The digestive Agni (Jatharagni) peaks between 12:00 and 1:30 PM. Eating a large meal in the evening when digestive fire is low is the primary cause of Ama accumulation.', 'Asleep before 10 PM. The Kapha window is when the body naturally begins producing sleep-inducing neurochemicals. Staying awake past 10 PM on Pitta fire costs Ojas and disrupts the lymphatic cleaning cycle from 10 PM to 2 AM.'] },
    ],
    quote: { tamil: 'ஒழுங்கான வாழ்வே மருத்துவம்', english: 'An orderly life is medicine itself — the body that lives in alignment with nature has no need to be healed for it never departs from wholeness.', master: 'Agathiyar · Agastyar Ashtanga Hridayam' },
  },
  {
    month: 'December', num: 12,
    accent: '#818CF8', border: 'rgba(129,140,248,0.32)', bg: 'rgba(129,140,248,0.05)',
    badge: '✦ December · Year-End Transmission',
    title: 'Kayakalpa — The Siddha Science of Age Reversal',
    teaser: 'Kayakalpa is the most advanced and most secret teaching of the Siddha tradition — the complete science of physical rejuvenation and extended life. The foundational principles are available to all. Here is the beginning of the transmission.',
    sections: [
      { label: 'What Kayakalpa Actually Is', text: 'Kayakalpa (Kaya = body, Kalpa = transformation/alchemy) is the science of systematically reversing the aging process by working at the level of the Prakriti field itself. The Siddha masters who mastered Kayakalpa are documented as living for hundreds or thousands of years: Thirumoolar (3,000+ years, body preserved in meditation at Chidambaram), Agathiyar (still living in subtle body, manifesting to initiates), Bogar (traveled to China, documented as living in multiple centuries). Kayakalpa works through three channels: Dravya Kayakalpa (herbal-mineral alchemy), Mantra Kayakalpa (sound frequencies that reprogram the DNA field), and Yoga Kayakalpa (advanced pranayama that reverses the flow of Bindu from dissipating to accumulating).' },
      { label: 'The Foundation — Why We Age According to Siddha', text: 'Aging in Siddha medicine is not a genetic inevitability — it is the progressive depletion of Ojas and the progressive accumulation of Ama. Each thought, each emotional reaction, each meal either deposits or withdraws from the Ojas account. The vast majority of modern humans are in continuous Ojas deficit — the account never recovers between withdrawals. When Ojas drops below a critical threshold the body loses its self-renewal capacity and begins to express the genetic aging program. The reversal is theoretically simple: stop the Ojas drain, rebuild the Ojas surplus, then apply the advanced Kayakalpa practices that use the surplus Ojas as fuel for genuine cellular restructuring.' },
      { label: 'The Kayakalpa Foundation Protocol — Year 1', isProtocol: true, steps: ['The Muppu Preparation: In its accessible form this means ensuring adequate intake of rock salt (Saindhava Lavana), potassium-rich foods, and magnesium-rich foods — the mineral triad that governs cellular water balance and nerve transmission. This is the entry point into Muppu science.', 'Kaya Shuddhi daily practice: Each morning after oil massage and shower perform 12 Surya Namaskar (Sun Salutations) with full breath synchronization and mantra. This is the minimum daily Kaya Shodhana practice that prepares the body for Kayakalpa over time.', 'Brahmacharya Rasayana: 3 consecutive nights per week of complete sense-withdrawal from 6 PM onwards — no screens, minimal speech, simple food, 20 minutes of Trataka (candle gazing) followed by 20 minutes of meditation. Sustained for 12 months this begins the accumulation of the Bindu-Ojas surplus required for formal Kayakalpa.', 'The Kayakalpa Mantra: "Om Agastyar Namah — Om Thirumoolaraya Namah — Om Babajiya Namah." Chant 108 times each morning before any other activity. This is the lineage invocation — it opens the Nadi connection to the living Siddha masters and begins the transmission of their Kayakalpa field into your Prakriti.'] },
    ],
    quote: { tamil: 'உடல் கோயில் — ஆத்மா தெய்வம்', english: 'The body is the temple — the Self is the deity within. The one who tends the temple perfectly gives the deity a perfect home, and the deity fills the temple with its light.', master: 'Thirumoolar · Thirumantiram 1832' },
  },
];

interface SectionData { label: string; text?: string; isProtocol?: boolean; steps?: string[]; }
interface TeachingData {
  month: string; num: number; accent: string; border: string; bg: string;
  badge: string; title: string; teaser: string;
  sections: SectionData[];
  quote: { tamil: string; english: string; master: string };
}

const TeachingCard: React.FC<{ t: TeachingData; status: 'current' | 'archive' | 'upcoming' }> = ({ t, status }) => {
  const isCurrent = status === 'current';
  const isArchive = status === 'archive';
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderRadius:18, marginBottom:10, overflow:'hidden',
      border:`1px solid ${open || isCurrent ? t.border : 'rgba(255,255,255,0.07)'}`,
      background: open || isCurrent ? t.bg : 'rgba(255,255,255,0.02)',
      transition:'border-color 0.25s, background 0.25s' }}>
      <div style={{ padding:'14px 16px 0' }}>
        <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase' as const, marginBottom:5, color: status === 'upcoming' ? 'rgba(255,255,255,0.25)' : t.accent, opacity:0.8 }}>
          {t.badge}{isCurrent ? ' · Current' : isArchive ? ' · Archive' : ' · Upcoming'}
        </div>
        <div style={{ fontSize:13, fontWeight:900, marginBottom:5, color: status === 'upcoming' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.92)', lineHeight:1.3, letterSpacing:'-0.02em' }}>
          {status === 'upcoming' ? `🔒 ${t.month} — Coming Soon` : t.title}
        </div>
        {status !== 'upcoming' && <div style={{ fontSize:11, lineHeight:1.65, color:'rgba(255,255,255,0.48)', paddingBottom:12 }}>{t.teaser}</div>}
        {status === 'upcoming' && <div style={{ fontSize:11, lineHeight:1.65, color:'rgba(255,255,255,0.28)', paddingBottom:12 }}>This transmission unlocks in {t.month}.</div>}
      </div>
      {status !== 'upcoming' && (
        <button onClick={() => setOpen(o => !o)} style={{ display:'inline-flex', alignItems:'center', gap:6,
          margin:'0 16px 14px', padding:'7px 14px', borderRadius:999,
          fontSize:9, fontWeight:800, letterSpacing:'0.28em', textTransform:'uppercase' as const,
          color:t.accent, border:`1px solid ${t.border}`, background:t.bg, cursor:'pointer' }}>
          <span style={{ display:'inline-block', transform:open?'rotate(180deg)':'rotate(0deg)', transition:'transform 0.3s', fontSize:11 }}>▾</span>
          {open ? 'Close Teaching' : 'Read Full Teaching'}
        </button>
      )}
      {open && status !== 'upcoming' && (
        <div style={{ padding:'0 16px 18px', borderTop:`1px solid ${t.border}` }}>
          {t.sections.map((s, si) => (
            <div key={si} style={{ marginTop:16 }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.42em', textTransform:'uppercase' as const, color:t.accent, opacity:0.75, marginBottom:8 }}>{s.label}</div>
              {s.isProtocol ? (
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'12px 14px' }}>
                  <ol style={{ listStyle:'none', paddingLeft:0, margin:0, display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {(s.steps||[]).map((step,pi) => (
                      <li key={pi} style={{ display:'flex', gap:10, fontSize:11, lineHeight:1.65, color:'rgba(255,255,255,0.55)' }}>
                        <span style={{ flexShrink:0, fontSize:9, fontWeight:800, color:t.accent, opacity:0.75, minWidth:18, marginTop:1 }}>{String(pi+1).padStart(2,'0')}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div style={{ fontSize:12, lineHeight:1.75, color:'rgba(255,255,255,0.58)' }}>
                  {(s.text||'').split('\n\n').map((para,pi,arr) => (
                    <p key={pi} style={{ marginBottom: pi < arr.length-1 ? 10 : 0 }}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop:18, borderLeft:`2px solid ${t.accent}`, background:'rgba(255,255,255,0.015)', borderRadius:'0 10px 10px 0', padding:'12px 14px' }}>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic' as const, fontSize:13, color:t.accent, opacity:0.85, letterSpacing:'0.02em', marginBottom:5 }}>{t.quote.tamil}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.48)', lineHeight:1.65, marginBottom:4 }}>"{t.quote.english}"</div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.28)' }}>— {t.quote.master}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const AudioTeachings: React.FC = () => {
  // June 2026 = month 6. July is the NEXT/current release.
  // Months 1–6 already released (archive). Month 7 = current. 8–12 = upcoming.
  const LIVE_THROUGH = 7; // July is first live month
  return (
    <div>
      {MONTHLY_TEACHINGS.map(t => {
        const status: 'current' | 'archive' | 'upcoming' =
          t.num === LIVE_THROUGH ? 'current' :
          t.num < LIVE_THROUGH ? 'archive' : 'upcoming';
        return <TeachingCard key={t.month} t={t} status={status} />;
      })}
    </div>
  );
};

// ── DINACHARYA DATA ───────────────────────────────────────────────────────────
const getTimeline = (rank: TierRank, dosha: string) => {
  if (rank >= 3) return [
    { time:'4:30 AM', icon:'🌅', name:'Brahma Muhurta Extended', desc:'Wake before the birds. 963 Hz on waking. Copper water with Shilajit. Nadi Shodhana 54 rounds. Receive in meditation — the Akasha channel is most open now.', bg:'rgba(212,175,55,0.12)', border:'rgba(212,175,55,0.4)' },
    { time:'6:00 AM', icon:'☀️', name:'Kaya Kalpa Morning', desc:'Full Abhyanga with Kaya Kalpa oil. Herbal steam 15 min. Nasya with Brahmi ghee. Sun gazing at exact sunrise. 24 rounds Surya Namaskara.', bg:'rgba(255,200,0,0.12)', border:'rgba(255,200,0,0.35)' },
    { time:'12:00 PM', icon:'🔥', name:'Sacred Meal and Rasayana', desc:'Chyawanprash before eating. Gold-charged water. Eat in silence. Vajrasana 20 min. Every choice here compounds over years.', bg:'rgba(255,100,0,0.12)', border:'rgba(255,100,0,0.35)' },
    { time:'3:00 PM', icon:'✨', name:'Siddhi Window', desc:'528 Hz + 432 Hz combined 45 min. Full Marma sequence. The body is most receptive to frequency medicine now.', bg:'rgba(167,139,250,0.12)', border:'rgba(167,139,250,0.35)' },
    { time:'6:00 PM', icon:'🌇', name:'Agnihotra', desc:'Fire ceremony at exact sunset. Cow ghee + rice offering. Agastya Dhanvantari mantra 108x. Review Jyotish timing for tomorrow.', bg:'rgba(255,80,120,0.12)', border:'rgba(255,80,120,0.35)' },
    { time:'9:00 PM', icon:'🌙', name:'Kaya Kalpa Sleep', desc:'Ashwagandha + Shatavari + Brahmi + Shilajit milk. Total darkness. 963 Hz at low volume overnight. The body rebuilds at cellular level.', bg:'rgba(100,120,255,0.12)', border:'rgba(100,120,255,0.35)' },
  ];
  if (rank >= 2) return [
    { time:'5:00 AM', icon:'🌅', name:'Brahma Muhurta', desc:'528 Hz healing sound on waking. Copper water. Nadi Shodhana 30 rounds. Tap Ajna marma point (between eyebrows) 7x with ring finger.', bg:'rgba(255,180,50,0.12)', border:'rgba(255,180,50,0.35)' },
    { time:'7:00 AM', icon:'☀️', name:'Full Siddha Morning', desc:'Abhyanga with medicated Vata oil. Herbal steam. Nasya 4 drops Brahmi ghee. Sun salutation 12 rounds East. Hridayam marma activation.', bg:'rgba(255,200,0,0.12)', border:'rgba(255,200,0,0.35)' },
    { time:'12:00 PM', icon:'🔥', name:'Pitta Sovereign Meal', desc:'Ginger + rock salt + lime before eating. Complete silence. Vajrasana 15 min. Triphala ghee as digestive.', bg:'rgba(255,100,0,0.12)', border:'rgba(255,100,0,0.35)' },
    { time:'3:00 PM', icon:'◉', name:'Scalar Sound Window', desc:'432 Hz grounding 15 min. Press Kshipra marma (between thumb and index) 2 min to calm Vata. Brahmi tea.', bg:'rgba(255,140,0,0.12)', border:'rgba(255,140,0,0.35)' },
    { time:'6:00 PM', icon:'🌇', name:'Sandhya Kala', desc:'Agastya Navagraha mantra. Agnihotra fire if possible. Light kichari only. Jyotish evening alignment.', bg:'rgba(255,80,120,0.12)', border:'rgba(255,80,120,0.35)' },
    { time:'9:00 PM', icon:'🌙', name:'Kapha Restoration', desc:'963 Hz crown sound 10 min. Head massage with Brahmi oil. Ashwagandha + Shatavari milk. Sleep by 10 PM.', bg:'rgba(100,120,255,0.12)', border:'rgba(100,120,255,0.35)' },
  ];
  if (rank >= 1) return [
    { time:'5:00 AM', icon:'🌅', name:'Brahma Muhurta', desc:'Copper vessel water. Silver tongue scraper. Sesame oil pulling 15 min. Nadi Shodhana 20 rounds.', bg:'rgba(255,180,50,0.12)', border:'rgba(255,180,50,0.35)' },
    { time:'7:00 AM', icon:'☀️', name:'Abhyanga & Agni', desc:'Full self-massage with warm Bala oil. 10-min herbal steam. Ginger-licorice tea. Nasya: 2 drops Anu taila.', bg:'rgba(255,200,0,0.12)', border:'rgba(255,200,0,0.35)' },
    { time:'12:00 PM', icon:'🔥', name:'Pitta Peak — Main Meal', desc:'Begin with ginger + rock salt + lime. Warm, unctuous. Vajrasana 15 min after eating.', bg:'rgba(255,100,0,0.12)', border:'rgba(255,100,0,0.35)' },
    { time:'3:00 PM', icon:'🌊', name:'Vata Calming Window', desc:'Walk in nature. Warm herbal tea. Head massage with Brahmi oil if feeling scattered.', bg:'rgba(34,211,238,0.12)', border:'rgba(34,211,238,0.35)' },
    { time:'6:00 PM', icon:'🌇', name:'Sandhya Kala', desc:'Agastya mantra 108 times. Light dinner — kichari or warm soup. No screens after sunset.', bg:'rgba(255,80,120,0.12)', border:'rgba(255,80,120,0.35)' },
    { time:'9:00 PM', icon:'🌙', name:'Kapha Rest Protocol', desc:'Ashwagandha-nutmeg milk. Feet massage with sesame oil. Sacred text, not screens. Asleep by 10 PM.', bg:'rgba(100,120,255,0.12)', border:'rgba(100,120,255,0.35)' },
  ];
  return [
    { time:'5:00 AM', icon:'🌅', name:'Brahma Muhurta', desc:'Rise before the sun. Warm lemon water. 5 minutes stillness. Tongue scraping, sesame oil pulling 10 min.', bg:'rgba(255,180,50,0.12)', border:'rgba(255,180,50,0.35)' },
    { time:'7:00 AM', icon:'☀️', name:'Morning Agni', desc:'Sesame oil self-massage, warm shower. Ginger tea with raw honey. Nadi Shodhana 10 rounds.', bg:'rgba(255,200,0,0.12)', border:'rgba(255,200,0,0.35)' },
    { time:'12:00 PM', icon:'🔥', name:'Pitta Peak — Main Meal', desc:'Largest meal. Warm, well-cooked, unctuous. Eat in silence. 15-min walk after. Agni is strongest now.', bg:'rgba(255,100,0,0.12)', border:'rgba(255,100,0,0.35)' },
    { time:'6:00 PM', icon:'🌇', name:'Sandhya Kala', desc:'Sacred twilight. 10 min meditation or mantra. Light dinner before 7 PM. No work after sunset.', bg:'rgba(255,80,120,0.12)', border:'rgba(255,80,120,0.35)' },
    { time:'9:00 PM', icon:'🌙', name:'Kapha Rest', desc:'Warm Ashwagandha milk with nutmeg. Feet massage with sesame oil. In bed by 10 PM.', bg:'rgba(100,120,255,0.12)', border:'rgba(100,120,255,0.35)' },
  ];
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const DoshaDashboard: React.FC<DoshaDashboardProps> = ({
  profile, dosha, onRestart, isPremium = false, isSiddhaPlus = false, isLifetime = false, isAdmin = false, onOpenChat,
}) => {
  const [syncing, setSyncing] = useState(false);
  const primary = dosha.primary?.toLowerCase() || 'vata';

  // Derive tier rank from props
  const rank: TierRank = (isAdmin || isLifetime) ? 3 : isSiddhaPlus ? 2 : isPremium ? 1 : 0;

  const accentColor = rank === 3 ? '#D4AF37' : rank === 2 ? '#FF8C00' : rank === 1 ? '#22D3EE' : 'rgba(180,180,180,0.7)';
  const tierLabel = rank === 3 ? '∞ AKASHA INFINITY · Eternal Sovereign' : rank === 2 ? '◉ SIDDHA QUANTUM · Sovereign Flame' : rank === 1 ? '◈ PRANA FLOW · Sacred Current' : '◇ FREE · Akasha Seed';
  const nadiScore = rank === 3 ? 95 : rank === 2 ? 85 : rank === 1 ? 78 : 72;
  const nadiStatus = rank >= 2 ? 'Sovereign' : rank === 1 ? 'Harmonious' : 'Seeking';
  const nadiEmoji = rank === 3 ? '👑' : rank === 2 ? '🌺' : rank === 1 ? '🌸' : '🌿';
  const nadiDesc = `Dosha Balance · ${primary.charAt(0).toUpperCase()+primary.slice(1)}-Pitta Expression`;

  const dinKicker = rank >= 3 ? '✦ Kaya Kalpa Dinacharya' : rank >= 2 ? '✦ Siddha Quantum Dinacharya' : rank >= 1 ? '✦ Enhanced Dinacharya' : '✦ Siddha Dinacharya';
  const dinSub = rank >= 3 ? 'All Siddha protocols combined — tap to open' : rank >= 2 ? 'Marma, scalar sound and Jyotish protocols — tap to open' : rank >= 1 ? 'Panchakarma protocols added — tap to open' : 'Your dosha-specific daily routine — tap to open';

  return (
    <div style={{ display:'flex', flexDirection:'column', paddingBottom:24 }}>

      {/* ── PROFILE HEADER ── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:'rgba(255,255,255,0.025)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
          border:'1px solid rgba(255,255,255,0.055)', borderRadius:40, padding:'22px 20px',
          position:'relative', overflow:'hidden', marginBottom:12 }}>
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1,
          background:`linear-gradient(90deg,transparent,${accentColor}66,${accentColor},${accentColor}66,transparent)` }} />
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <motion.div animate={{ boxShadow:[`0 0 18px ${accentColor}33`,`0 0 34px ${accentColor}66`,`0 0 18px ${accentColor}33`] }}
            transition={{ duration:4, repeat:Infinity }}
            style={{ width:50, height:50, borderRadius:16, background:`linear-gradient(135deg,${accentColor}28,${accentColor}0a)`,
              border:`1.5px solid ${accentColor}70`, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:19, fontWeight:900, color:accentColor, flexShrink:0 }}>
            {profile.name[0]}
          </motion.div>
          <div>
            <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.04em' }}>{profile.name}</div>
            <div style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999,
              background:`${accentColor}12`, border:`1px solid ${accentColor}30`, color:accentColor,
              fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', marginTop:4 }}>
              {tierLabel}
            </div>
          </div>
          <button onClick={() => setSyncing(true)} onTransitionEnd={() => setSyncing(false)}
            style={{ marginLeft:'auto', padding:'8px 14px', borderRadius:16, background:'rgba(255,255,255,0.025)',
              border:'1px solid rgba(255,255,255,0.055)', color:'rgba(255,255,255,0.5)',
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
            ⟳ Jyotish
          </button>
        </div>

        {/* Nadi Score */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:18,
          background:`${accentColor}08`, border:`1px solid ${accentColor}20`, marginBottom:16 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:`${accentColor}14`, border:`1px solid ${accentColor}35`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>〰</div>
          <div>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:accentColor, opacity:0.75 }}>Nadi Pulse Reading</div>
            <div style={{ fontSize:21, fontWeight:900, letterSpacing:'-0.04em', color:accentColor }}>{nadiScore}/100</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{nadiDesc}</div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'center', fontSize:18 }}>
            {nadiEmoji}<div style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>{nadiStatus}</div>
          </div>
        </div>

        {/* Dosha Orbs */}
        <div style={{ display:'flex', justifyContent:'center', gap:24, padding:'8px 0 14px' }}>
          {[
            { name:'VATA', val:Number(dosha.vata)||45, c:'#93C5FD', e:'🌬️' },
            { name:'PITTA', val:Number(dosha.pitta)||35, c:'#FBBF24', e:'🔥' },
            { name:'KAPHA', val:Number(dosha.kapha)||20, c:'#34D399', e:'🌍' },
          ].map((orb,i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ width:68, height:68, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                background:`radial-gradient(circle,${orb.c}28,${orb.c}06)`, border:`2px solid ${orb.c}45`, boxShadow:`0 0 18px ${orb.c}25` }}>{orb.e}</div>
              <div style={{ fontSize:14, fontWeight:900, color:orb.c }}>{orb.val}%</div>
              <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:orb.c }}>{orb.name}</div>
              <div style={{ height:3, width:68, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:2, background:orb.c, width:`${orb.val}%` }} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={onRestart}
          style={{ width:'100%', marginTop:14, padding:7, background:'transparent', border:'none',
            color:'rgba(255,255,255,0.2)', fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize:9, fontWeight:800, letterSpacing:'0.38em', textTransform:'uppercase', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          ↺ Reset Cosmic Blueprint
        </button>
      </motion.div>

      {/* ── DINACHARYA ── */}
      <SectionCard icon="🕐" iconBg={`${accentColor}10`} iconBorder={`${accentColor}25`} iconColor={accentColor}
        kicker={dinKicker.replace('✦ ','')} kickerColor={accentColor} title="Sacred Daily Timeline" sub={dinSub}>
        <Timeline items={getTimeline(rank, primary)} />
      </SectionCard>

      {/* ── VIKRUTI (Prana+) ── */}
      {isPremium ? (
        <SectionCard icon="🔬" iconBg="rgba(34,211,238,0.1)" iconBorder="rgba(34,211,238,0.25)" iconColor="#22D3EE"
          kicker="Current Health Snapshot" kickerColor="#22D3EE" title="How Your Body Feels Right Now" sub="What is off balance today — tap to open">
          <VikrutiRows dosha={dosha} />
        </SectionCard>
      ) : (
        <GateCard icon="🔬" iconColor="#22D3EE" tierLabel="◈ Prana Flow Required" tierColor="#22D3EE" title="How Your Body Feels Right Now" sub="Current health snapshot" />
      )}

      {/* ── HERBS ── */}
      {isPremium ? (
        <SectionCard icon="🌿" iconBg="rgba(52,211,153,0.1)" iconBorder="rgba(52,211,153,0.25)" iconColor="#34D399"
          kicker={isSiddhaPlus ? "Full Rasayana Pharmacopeia" : "Sacred Herbarium"} kickerColor="#34D399"
          title="Your Herb Allies" sub={isSiddhaPlus ? "All 8 herbs including Akasha exclusives — tap to open" : "Dosha-specific plant medicines — tap to open"}>
          <HerbGrid extended={isSiddhaPlus} />
        </SectionCard>
      ) : (
        <GateCard icon="🌿" iconColor="#22D3EE" tierLabel="◈ Prana Flow Required" tierColor="#22D3EE" title="Your Herb Allies" sub="Dosha-specific plant medicines" />
      )}

      {/* ── HZ FREQUENCIES (Siddha+) ── */}
      {isSiddhaPlus ? (
        <SectionCard icon="🎵" iconBg="rgba(255,140,0,0.1)" iconBorder="rgba(255,140,0,0.25)" iconColor="#FF8C00"
          kicker="Healing Sound Frequencies" kickerColor="#FF8C00" title="Healing Sound Frequencies" sub={`6 frequencies for your ${dosha.primary}-Pitta body — tap to open`}>
          <HzGrid dosha={primary} />
        </SectionCard>
      ) : (
        <GateCard icon="🎵" iconColor="#FF8C00" tierLabel="◉ Siddha Quantum Required" tierColor="#FF8C00" title="Healing Sound Frequencies" sub="528 Hz · 432 Hz · 963 Hz — play while you rest" />
      )}

      {/* ── JYOTISH (Siddha+) ── */}
      {isSiddhaPlus ? (
        <SectionCard icon="🪐" iconBg="rgba(255,140,0,0.1)" iconBorder="rgba(255,140,0,0.25)" iconColor="#FF8C00"
          kicker="How the Planets Affect Your Health" kickerColor="#FF8C00" title="How the Planets Affect Your Health" sub="Weekly reading — tap to open">
          <JyotishSection dosha={primary} />
        </SectionCard>
      ) : (
        <GateCard icon="🪐" iconColor="#FF8C00" tierLabel="◉ Siddha Quantum Required" tierColor="#FF8C00" title="How the Planets Affect Your Health" sub="Weekly planetary body map" />
      )}

      {/* ── AUDIO TEACHINGS (Akasha only — rank 3) ── */}
      {rank >= 3 ? (
        <SectionCard icon="🎧" iconBg="rgba(212,175,55,0.1)" iconBorder="rgba(212,175,55,0.3)" iconColor="#D4AF37"
          kicker="Monthly Healing Teachings" kickerColor="#D4AF37" title="Monthly Healing Teachings" sub="Personal Siddha transmission for your Prakriti — tap to read">
          <AudioTeachings />
        </SectionCard>
      ) : (
        <GateCard icon="🎧" iconColor="#D4AF37" tierLabel="∞ Akasha Infinity Required" tierColor="#D4AF37" title="Monthly Healing Teachings" sub="Personal audio teaching for your Prakriti" />
      )}

    </div>
  );
};
