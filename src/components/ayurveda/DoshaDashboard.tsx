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
        {open && (
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
const AudioTeachings: React.FC = () => (
  <div>
    {[
      { kicker:'🎧 This Month · New', k2:'rgba(212,175,55,0.7)', title:'Why You Cannot Sleep Even When You Are Exhausted', desc:'For Vata-Pitta types, exhaustion after sleep means the nervous system never fully switched off. Three things to do tonight that will change your sleep within a week.', play:'▶ Listen Now · 28 min', pb:'rgba(212,175,55,0.08)', pc:'#D4AF37', pbc:'rgba(212,175,55,0.4)' },
      { kicker:'🎧 Last Month · Available', k2:'#FF8C00', title:'The Food That Is Slowly Draining You', desc:'Most health problems are caused by the wrong food for your constitution. Agastya identifies the three foods your Vata-Pitta body is reacting to right now.', play:'▶ Listen · 34 min', pb:'rgba(255,140,0,0.08)', pc:'#FF8C00', pbc:'rgba(255,140,0,0.4)' },
      { kicker:'🎧 Archive · Unlocked', k2:'rgba(255,255,255,0.4)', title:'How Stress Becomes Physical Disease', desc:'Unprocessed emotion moves into the body and becomes pain, stiffness, or inflammation. This shows exactly where your stress is hiding and how to release it.', play:'▶ Listen · 41 min', pb:'rgba(255,255,255,0.04)', pc:'rgba(255,255,255,0.4)', pbc:'rgba(255,255,255,0.15)' },
    ].map((a,i) => (
      <div key={i} style={{ padding:'14px 16px', borderRadius:18, marginBottom: i<2 ? 9 : 0,
        border:`1px solid ${a.pbc}`, background:a.pb, overflow:'hidden', cursor:'pointer' }}>
        <div style={{ fontSize:7, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', marginBottom:4, opacity:0.7, color:a.k2 }}>{a.kicker}</div>
        <div style={{ fontSize:13, fontWeight:900, marginBottom:4, color:'rgba(255,255,255,0.9)' }}>{a.title}</div>
        <div style={{ fontSize:11, lineHeight:1.6, color:'rgba(255,255,255,0.5)' }}>{a.desc}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, padding:'6px 12px', borderRadius:999,
          fontSize:9, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase',
          border:`1px solid ${a.pbc}`, color:a.pc, background:a.pb }}>
          {a.play}
        </div>
      </div>
    ))}
  </div>
);

// ── ACADEMY BANNER ────────────────────────────────────────────────────────────
const AcademyBanner: React.FC<{ rank: TierRank }> = ({ rank }) => {
  const texts: Record<TierRank, { sub:string; desc:string }> = {
    0: { sub:'108 Modules', desc:'The complete path of Ayurvedic mastery — from Atma-Seed to Akasha-Infinity.' },
    1: { sub:'Phases 1 & 2 Unlocked', desc:'Modules 1–44 unlocked. Foundations and Panchakarma mastery path.' },
    2: { sub:'Phases 1–4 Unlocked', desc:'Modules 1–87 unlocked. Clinical Siddha and planetary medicine.' },
    3: { sub:'All 108 Modules Unlocked', desc:'The complete 108-module path — all 5 phases from Atma-Seed to Akasha Transmission.' },
  };
  const dots = [
    { label: rank>=1 ? '✓ FREE 1–22' : 'FREE 1–22', on: true, c:'rgba(74,222,128,0.85)' },
    { label: rank>=1 ? '✓ PRANA 23–44' : '🔒 PRANA 23–44', on: rank>=1, c: rank>=1 ? 'rgba(34,211,238,0.9)' : 'rgba(255,255,255,0.2)' },
    { label: rank>=2 ? '✓ SIDDHA 45–66' : '🔒 SIDDHA 45–66', on: rank>=2, c: rank>=2 ? 'rgba(255,140,0,0.9)' : 'rgba(255,255,255,0.2)' },
    { label: rank>=3 ? '✓ AKASHA 67–108' : '🔒 AKASHA 67–108', on: rank>=3, c: rank>=3 ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.2)' },
  ];
  const t = texts[rank];
  return (
    <div style={{ position:'relative', marginBottom:12 }}>
      <div style={{ position:'absolute', inset:-14, borderRadius:38, pointerEvents:'none', zIndex:0,
        background:'radial-gradient(60% 60% at 30% 40%,rgba(212,175,55,0.35),transparent 70%),radial-gradient(60% 60% at 75% 65%,rgba(34,211,238,0.28),transparent 70%)',
        filter:'blur(22px)' }} />
      <div onClick={() => { window.location.href='/agastyar-academy'; }} style={{ position:'relative', zIndex:1, cursor:'pointer',
        background:'linear-gradient(135deg,rgba(212,175,55,0.10),rgba(0,242,254,0.05) 60%,rgba(5,5,5,0.6))',
        border:'1px solid rgba(212,175,55,0.45)', borderRadius:24, padding:'22px 20px 20px',
        boxShadow:'0 0 40px rgba(212,175,55,0.25),0 0 80px rgba(34,211,238,0.12),inset 0 0 30px rgba(212,175,55,0.06)' }}>
        <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:'rgba(212,175,55,0.7)', marginBottom:10 }}>⚜ Academy · {t.sub}</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.85rem', fontWeight:600, color:'rgba(255,255,255,0.96)', lineHeight:1.1, margin:0, textShadow:'0 0 18px rgba(212,175,55,0.35)' }}>Agastyar Academy</h2>
        <p style={{ fontSize:13, lineHeight:1.65, color:'rgba(255,255,255,0.62)', margin:'8px 0 14px' }}>{t.desc}</p>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          {dots.map((dot,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:dot.c, boxShadow:`0 0 8px ${dot.c}`, display:'inline-block' }}/>
              <span style={{ fontSize:8, fontWeight:800, letterSpacing:'0.25em', textTransform:'uppercase', color:dot.c }}>{dot.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:999,
          background:'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))',
          border:'1px solid rgba(212,175,55,0.5)', color:'rgba(212,175,55,0.98)',
          fontSize:10, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase' }}>
          Enter Academy →
        </div>
      </div>
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
  profile, dosha, onRestart, isPremium = false, isSiddhaPlus = false, onOpenChat,
}) => {
  const [syncing, setSyncing] = useState(false);
  const primary = dosha.primary?.toLowerCase() || 'vata';

  // Derive tier rank from props
  const rank: TierRank = isSiddhaPlus ? 2 : isPremium ? 1 : 0;

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

      {/* ── AGASTYA CHAT BANNER (Prana+) ── */}
      {isPremium ? (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} onClick={onOpenChat}
          style={{ background:'linear-gradient(135deg,rgba(255,140,0,0.08),rgba(212,175,55,0.04))',
            border:'1.5px solid rgba(212,175,55,0.4)', borderRadius:32, padding:'22px 20px',
            position:'relative', overflow:'hidden', marginBottom:12, cursor:'pointer',
            boxShadow:'0 0 50px rgba(212,175,55,0.1)' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,#FF8C00,#D4AF37,#FF8C00,transparent)' }} />
          <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            <motion.div animate={{ boxShadow:['0 0 0 0 rgba(212,175,55,0.4)','0 0 0 8px rgba(212,175,55,0)','0 0 0 0 rgba(212,175,55,0.4)'] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{ width:60, height:60, borderRadius:'50%', flexShrink:0,
                background:'radial-gradient(circle,rgba(212,175,55,0.22),rgba(212,175,55,0.06))',
                border:'2px solid rgba(212,175,55,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🔱</motion.div>
            <div>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:'rgba(212,175,55,0.75)', marginBottom:5 }}>✦ Your Personal Guide · Agastya Samhita ✦</div>
              <div style={{ fontSize:19, fontWeight:900, letterSpacing:'-0.04em', color:'#D4AF37', marginBottom:5, fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic' }}>Speak with Agastya Muni</div>
              <div style={{ fontSize:12, lineHeight:1.65, color:'rgba(255,255,255,0.65)', marginBottom:12 }}>
                {profile.name}, I see your {dosha.primary?.charAt(0).toUpperCase()+(dosha.primary?.slice(1)||'')}-Pitta constitution clearly. Ask me anything — herbs, digestion, sleep, or the deeper question behind your suffering.
              </div>
              <button style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:999,
                background:'linear-gradient(135deg,#FF8C00,#D4AF37)', color:'#050505',
                fontSize:12, fontWeight:900, cursor:'pointer', border:'none', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                🔱 Open Divine Physician
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:'rgba(255,255,255,0.015)', border:'1px solid rgba(34,211,238,0.25)', borderRadius:32,
            padding:'28px 20px', textAlign:'center', marginBottom:12, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(34,211,238,0.05),transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:26, opacity:0.4, marginBottom:10 }}>🔒</div>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.45em', textTransform:'uppercase', color:'#22D3EE', marginBottom:6 }}>◈ Prana Flow Required</div>
            <div style={{ fontSize:17, fontWeight:900, color:'rgba(255,255,255,0.9)', marginBottom:8 }}>Speak with Agastya Muni</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.65, marginBottom:18, maxWidth:340, margin:'0 auto 18px' }}>Ask the ancient physician anything — herbs, sleep, digestion, emotional pain. Available from Prana Flow and above.</div>
            <button style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:999,
              borderColor:'rgba(34,211,238,0.4)', color:'#22D3EE', background:'rgba(34,211,238,0.08)',
              border:'1px solid rgba(34,211,238,0.4)', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11, fontWeight:900, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              ◈ Upgrade to Prana Flow
            </button>
          </div>
        </motion.div>
      )}

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
          kicker="Monthly Healing Teachings" kickerColor="#D4AF37" title="Monthly Healing Teachings" sub="Personal audio teaching for your Prakriti — tap to open">
          <AudioTeachings />
        </SectionCard>
      ) : (
        <GateCard icon="🎧" iconColor="#D4AF37" tierLabel="∞ Akasha Infinity Required" tierColor="#D4AF37" title="Monthly Healing Teachings" sub="Personal audio teaching for your Prakriti" />
      )}

      {/* ── ACADEMY ── */}
      <AcademyBanner rank={rank} />

    </div>
  );
};
