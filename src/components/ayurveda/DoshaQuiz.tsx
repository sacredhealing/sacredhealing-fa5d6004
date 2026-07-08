/**
 * ████████████████████████████████████████████████████████████████
 *  SQI 2050 — PRAKRITI DEEP-SCAN PROTOCOL v2
 *  DoshaQuiz.tsx — 18-Dimension Single-Trait Accuracy
 *
 *  UPGRADE FROM v1:
 *  - 18 focused questions (one atomic observable per question)
 *  - No more bundled multi-trait answers → eliminates mixed-constitution confusion
 *  - Vikruti (current imbalance) detected separately on final question
 *  - Cleaner progress UX (dots + %)
 *  - onComplete(profile) — PRESERVED EXACTLY
 * ████████████████████████████████████████████████████████████████
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanLine } from 'lucide-react';
import type { AyurvedaUserProfile } from '@/lib/ayurvedaTypes';

// ── SQI tokens ───────────────────────────────────────────────────
const G = {
  gold:       '#D4AF37',
  goldBorder: 'rgba(212,175,55,0.25)',
  goldStrong: 'rgba(212,175,55,0.5)',
  goldGlow:   'rgba(212,175,55,0.15)',
  glass:      'rgba(255,255,255,0.025)',
  glassBorder:'rgba(255,255,255,0.06)',
  w90:        'rgba(255,255,255,0.9)',
  w60:        'rgba(255,255,255,0.6)',
  w40:        'rgba(255,255,255,0.4)',
};

const DC = {
  vata:  { c: '#93C5FD', g: 'rgba(147,197,253,0.12)', b: 'rgba(147,197,253,0.25)' },
  pitta: { c: '#FBBF24', g: 'rgba(251,191,36,0.12)',  b: 'rgba(251,191,36,0.25)' },
  kapha: { c: '#34D399', g: 'rgba(52,211,153,0.12)',  b: 'rgba(52,211,153,0.25)' },
};

// ── 18 single-trait questions ─────────────────────────────────────
interface QuizOption { d: 'vata' | 'pitta' | 'kapha'; icon: string; label: string; desc: string; }
interface QuizQuestion { cat: string; icon: string; q: string; opts: QuizOption[]; }

const QUESTIONS: QuizQuestion[] = [
  {
    cat: 'Body Frame', icon: '🌿', q: 'What is your natural body frame?',
    opts: [
      { d: 'vata',  icon: '🌬️', label: 'Lean & Slender',      desc: 'Fine bones, narrow shoulders, hard to gain weight' },
      { d: 'pitta', icon: '🔥', label: 'Medium & Athletic',    desc: 'Medium frame, defined muscles, moderate build' },
      { d: 'kapha', icon: '🌍', label: 'Broad & Solid',        desc: 'Wide frame, gains weight easily, solid structure' },
    ],
  },
  {
    cat: 'Skin Texture', icon: '✨', q: 'How does your skin naturally feel?',
    opts: [
      { d: 'vata',  icon: '💨', label: 'Dry & Rough',          desc: 'Often flaky, cool to touch, chaps easily' },
      { d: 'pitta', icon: '🌡️', label: 'Warm & Sensitive',     desc: 'Prone to redness, warm, reactive to heat' },
      { d: 'kapha', icon: '💧', label: 'Smooth & Moist',       desc: 'Naturally soft, thick, cool to touch' },
    ],
  },
  {
    cat: 'Hair Quality', icon: '🌀', q: 'What is your hair naturally like?',
    opts: [
      { d: 'vata',  icon: '🌬️', label: 'Dry & Fine',           desc: 'Frizzy, breaks easily, lacks moisture' },
      { d: 'pitta', icon: '🔥', label: 'Straight & Fine',      desc: 'Thin texture, premature greying or thinning' },
      { d: 'kapha', icon: '🌊', label: 'Thick & Lustrous',     desc: 'Dense, oily, slow to grey, voluminous' },
    ],
  },
  {
    cat: 'Appetite', icon: '🔥', q: 'How would you describe your appetite?',
    opts: [
      { d: 'vata',  icon: '💨', label: 'Irregular & Variable', desc: 'Sometimes starving, sometimes no appetite at all' },
      { d: 'pitta', icon: '⚡', label: 'Strong & Intense',     desc: 'Must eat on time — irritable if meals are skipped' },
      { d: 'kapha', icon: '🌿', label: 'Slow & Steady',        desc: 'Can skip meals easily, rarely feels truly hungry' },
    ],
  },
  {
    cat: 'Digestion Speed', icon: '⚡', q: 'How quickly do you digest food?',
    opts: [
      { d: 'vata',  icon: '💨', label: 'Unpredictable',        desc: 'Sometimes fast, sometimes constipated or bloated' },
      { d: 'pitta', icon: '🔥', label: 'Fast & Complete',      desc: 'Digests well, loose stools when stressed' },
      { d: 'kapha', icon: '🌊', label: 'Slow & Heavy',         desc: 'Feels heavy after eating, slow full digestion' },
    ],
  },
  {
    cat: 'Energy Pattern', icon: '⚡', q: 'How does your energy flow through the day?',
    opts: [
      { d: 'vata',  icon: '🌩️', label: 'Bursts & Crashes',     desc: 'High energy spurts followed by exhaustion' },
      { d: 'pitta', icon: '☀️', label: 'Steady & Driven',      desc: 'Consistent energy, peaks in afternoon' },
      { d: 'kapha', icon: '🌙', label: 'Slow to Start',        desc: 'Low morning energy that improves through the day' },
    ],
  },
  {
    cat: 'Sleep Nature', icon: '🌙', q: 'How do you sleep?',
    opts: [
      { d: 'vata',  icon: '🌬️', label: 'Light & Disturbed',    desc: 'Wake easily, vivid dreams, often under 6 hours' },
      { d: 'pitta', icon: '🔥', label: 'Moderate & Intense',   desc: '7–8 hours, vivid dreams, alert on waking' },
      { d: 'kapha', icon: '🌊', label: 'Deep & Long',          desc: 'Sleep heavily, 9+ hours, hard to wake up' },
    ],
  },
  {
    cat: 'Mind Speed', icon: '🧠', q: 'How does your mind process information?',
    opts: [
      { d: 'vata',  icon: '🌪️', label: 'Fast & Scattered',     desc: 'Quick to grasp, quick to forget, jumps between topics' },
      { d: 'pitta', icon: '🎯', label: 'Sharp & Focused',      desc: 'Analytical, decisive, retains information well' },
      { d: 'kapha', icon: '🌿', label: 'Slow & Deep',          desc: 'Takes time to learn but never forgets' },
    ],
  },
  {
    cat: 'Stress Response', icon: '💚', q: 'When stressed or overwhelmed, you tend to…',
    opts: [
      { d: 'vata',  icon: '😰', label: 'Worry & Scatter',      desc: 'Anxiety spikes, overthinking, freeze response' },
      { d: 'pitta', icon: '😤', label: 'Anger & Control',      desc: 'Irritability rises, urge to fix everything fast' },
      { d: 'kapha', icon: '😔', label: 'Withdraw & Numb',      desc: 'Retreat inward, comfort eat, slow emotional response' },
    ],
  },
  {
    cat: 'Core Emotion', icon: '💫', q: 'What is your most common emotional tendency?',
    opts: [
      { d: 'vata',  icon: '🌬️', label: 'Enthusiasm → Anxiety', desc: 'Excited quickly, but worry and fear follow easily' },
      { d: 'pitta', icon: '🔥', label: 'Passion → Anger',      desc: 'Driven and intense, temper rises under pressure' },
      { d: 'kapha', icon: '🌿', label: 'Love → Attachment',    desc: 'Deeply caring, holds on, slow to release' },
    ],
  },
  {
    cat: 'Memory Type', icon: '🔮', q: 'How is your memory?',
    opts: [
      { d: 'vata',  icon: '💨', label: 'Quick but Forgetful',  desc: 'Absorbs fast, forgets names and details easily' },
      { d: 'pitta', icon: '🎯', label: 'Sharp & Precise',      desc: 'Retains facts, figures, and sequences accurately' },
      { d: 'kapha', icon: '🌊', label: 'Slow but Lasting',     desc: 'Takes longer to memorize, but never truly forgets' },
    ],
  },
  {
    cat: 'Climate Preference', icon: '🌤️', q: 'Which climate feels best for your body?',
    opts: [
      { d: 'vata',  icon: '☀️', label: 'Warm & Humid',         desc: 'Cold and wind aggravate you the most' },
      { d: 'pitta', icon: '❄️', label: 'Cool & Airy',          desc: 'Heat exhausts you — love cool breezes' },
      { d: 'kapha', icon: '🌞', label: 'Dry & Warm',           desc: 'Cold and damp make you heavy and sluggish' },
    ],
  },
  {
    cat: 'Speech Pattern', icon: '🗣️', q: 'How do you naturally speak?',
    opts: [
      { d: 'vata',  icon: '🌪️', label: 'Fast & Talkative',     desc: 'Speaks quickly, topic-hops, gestures often' },
      { d: 'pitta', icon: '⚡', label: 'Clear & Precise',      desc: 'Direct, articulate, persuasive by nature' },
      { d: 'kapha', icon: '🌿', label: 'Slow & Melodious',     desc: 'Deep voice, thoughtful, few but meaningful words' },
    ],
  },
  {
    cat: 'Decision Making', icon: '⚖️', q: 'How do you make decisions?',
    opts: [
      { d: 'vata',  icon: '🌬️', label: 'Fast but Indecisive',  desc: 'Changes mind often, second-guesses frequently' },
      { d: 'pitta', icon: '🔥', label: 'Fast & Confident',     desc: 'Decisive, rarely reverses, thinks strategically' },
      { d: 'kapha', icon: '🌊', label: 'Slow & Deliberate',    desc: 'Takes time, but once committed — stays committed' },
    ],
  },
  {
    cat: 'Exercise Style', icon: '🏃', q: 'What kind of physical activity feels natural?',
    opts: [
      { d: 'vata',  icon: '💨', label: 'Light & Varied',       desc: 'Yoga, walking, dance — dislikes rigid routine' },
      { d: 'pitta', icon: '🔥', label: 'Intense & Competitive',desc: 'Loves challenges, sport, high-intensity training' },
      { d: 'kapha', icon: '🌍', label: 'Steady & Enduring',    desc: 'Prefers slow endurance over rapid bursts' },
    ],
  },
  {
    cat: 'Social Nature', icon: '👁️', q: 'How do you recharge socially?',
    opts: [
      { d: 'vata',  icon: '🌬️', label: 'Stimulated by People', desc: 'Loves social energy but gets scattered quickly' },
      { d: 'pitta', icon: '🎯', label: 'Selective & Purposeful',desc: 'Socializes with intention, dislikes small talk' },
      { d: 'kapha', icon: '🌿', label: 'Intimate & Loyal',     desc: 'Prefers deep one-on-one over large groups' },
    ],
  },
  {
    cat: 'Elimination', icon: '🌊', q: 'What describes your natural bowel pattern?',
    opts: [
      { d: 'vata',  icon: '💨', label: 'Irregular & Dry',      desc: 'Constipation, gas, and bloating common' },
      { d: 'pitta', icon: '🔥', label: 'Regular & Loose',      desc: 'Once or more daily, often soft or loose' },
      { d: 'kapha', icon: '🌍', label: 'Regular & Slow',       desc: 'Consistent but slow, heavy stools' },
    ],
  },
  {
    cat: 'Current Imbalance', icon: '🔮', q: 'What has been most prominent in the last 3 months?',
    opts: [
      { d: 'vata',  icon: '⚡', label: 'Anxiety · Dryness · Restlessness', desc: 'Racing mind, sleep issues, irregular digestion' },
      { d: 'pitta', icon: '🌡️', label: 'Irritability · Heat · Inflammation', desc: 'Skin flares, impatience, burning sensations' },
      { d: 'kapha', icon: '💧', label: 'Heaviness · Lethargy · Congestion', desc: 'Weight gain, mucus, low motivation' },
    ],
  },
];

const TOTAL = QUESTIONS.length;

interface DoshaQuizProps {
  onComplete: (profile: AyurvedaUserProfile) => void;
  isLoading: boolean;
}

type Phase = 'identity' | 'scan' | 'situation';

export const DoshaQuiz: React.FC<DoshaQuizProps> = ({ onComplete, isLoading }) => {
  const [phase, setPhase]       = useState<Phase>('identity');
  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<AyurvedaUserProfile>({
    name: '', birthDate: '', birthTime: '', location: '',
    currentChallenge: '', personalityTraits: '',
  });

  // ── Tally ────────────────────────────────────────────────────
  const scores = Object.values(answers).reduce<Record<string, number>>(
    (acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {}
  );
  const vScore = scores['vata']  || 0;
  const pScore = scores['pitta'] || 0;
  const kScore = scores['kapha'] || 0;
  const vPct   = Math.round((vScore / TOTAL) * 100);
  const pPct   = Math.round((pScore / TOTAL) * 100);
  const kPct   = Math.round((kScore / TOTAL) * 100);

  // ── Answer handler ───────────────────────────────────────────
  const handleAnswer = (dosha: string) => {
    const key = QUESTIONS[step].cat;
    setAnswers(prev => ({ ...prev, [key]: dosha }));
    setTimeout(() => {
      if (step < TOTAL - 1) {
        setStep(s => s + 1);
      } else {
        setPhase('situation');
      }
    }, 320);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = () => {
    const scanLines = QUESTIONS.map(q => {
      const ans = answers[q.cat];
      const opt = q.opts.find(o => o.d === ans);
      return `${q.cat}: ${opt?.label || ans}`;
    }).join('\n');

    onComplete({
      ...formData,
      personalityTraits: `PRAKRITI SCAN (18-Dimension SQI Protocol):\n${scanLines}\n\nDOSHA SCORES: Vata ${vPct}% | Pitta ${pPct}% | Kapha ${kPct}%`,
    });
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', minHeight:'50vh', gap:24, textAlign:'center', padding:'40px 24px' }}>
        <div style={{ position:'relative', width:80, height:80 }}>
          {[0,1].map(i => (
            <motion.div key={i}
              style={{ position:'absolute', inset:-(i*16), borderRadius:'50%',
                border:`1px solid ${i===0 ? G.goldStrong : G.goldBorder}` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3+i*2, repeat:Infinity, ease:'linear' }}
            />
          ))}
          <div style={{ width:80, height:80, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(212,175,55,0.2), transparent)',
            border:`1px solid ${G.goldBorder}`, display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:28 }}>🔱</div>
        </div>
        <div>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.04em', color:G.gold, marginBottom:8 }}>
            Consulting the Sages…
          </div>
          <p style={{ fontSize:14, color:G.w40, lineHeight:1.65 }}>
            The Akasha-Neural Archive maps your Prakriti with Siddha wisdom.
          </p>
        </div>
      </div>
    );
  }

  // ── PHASE: IDENTITY ──────────────────────────────────────────
  if (phase === 'identity') {
    const ready = formData.name && formData.birthDate && formData.birthTime && formData.location;
    return (
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ maxWidth:580, margin:'0 auto', padding:'32px 16px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={badge}>✦ Prakriti Deep-Scan Protocol · Step 1 of 3 ✦</div>
          <h2 style={{ fontSize:30, fontWeight:900, letterSpacing:'-0.05em',
            color:G.w90, marginBottom:8 }}>Sacred Beginnings</h2>
          <p style={{ fontSize:13, color:G.w40, lineHeight:1.65 }}>
            Birth data activates Jyotish-Ayurveda alignment for higher accuracy
          </p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <ScanField label="Your Sacred Name" type="text" placeholder="Full name"
            value={formData.name} onChange={v => setFormData(p => ({ ...p, name:v }))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <ScanField label="Birth Date" type="date" placeholder=""
              value={formData.birthDate} onChange={v => setFormData(p => ({ ...p, birthDate:v }))} />
            <ScanField label="Birth Time (HH:MM)" type="text" placeholder="e.g. 12:45"
              value={formData.birthTime} onChange={v => {
                let val = v.replace(/[^\d:]/g, '');
                if (val.length === 2 && !val.includes(':')) val = val + ':';
                if (val.length > 5) val = val.slice(0, 5);
                setFormData(p => ({ ...p, birthTime: val }));
              }} />
          </div>
          <ScanField label="Current Location" type="text" placeholder="City, Country"
            value={formData.location} onChange={v => setFormData(p => ({ ...p, location:v }))} />
          <GoldButton onClick={() => setPhase('scan')} disabled={!ready}>
            Begin Prakriti Scan <ScanLine style={{ width:18, height:18, marginLeft:8 }} />
          </GoldButton>
        </div>
      </motion.div>
    );
  }

  // ── PHASE: SCAN ──────────────────────────────────────────────
  if (phase === 'scan') {
    const q   = QUESTIONS[step];
    const pct = Math.round((step / TOTAL) * 100);

    return (
      <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 16px' }}>
        {/* Progress */}
        <div style={{ marginBottom:26 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <div style={badge}>✦ Question {step+1} of {TOTAL} ✦</div>
            <div style={{ fontSize:11, fontWeight:900, color:G.gold }}>{pct}%</div>
          </div>
          <div style={{ height:2, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
            <motion.div style={{ height:'100%', borderRadius:2,
              background:`linear-gradient(90deg, ${G.gold}, #B8960C)`,
              boxShadow:`0 0 10px ${G.gold}` }}
              animate={{ width:`${pct + (100/TOTAL)}%` }}
              transition={{ duration:0.4 }}
            />
          </div>
          {/* Dots */}
          <div style={{ display:'flex', gap:5, marginTop:10, flexWrap:'wrap' }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{
                height:5, borderRadius:3,
                width: i===step ? 18 : 5,
                background: i<step ? G.gold : i===step ? G.gold : 'rgba(255,255,255,0.1)',
                opacity: i<step ? 0.5 : 1,
                boxShadow: i===step ? `0 0 8px ${G.gold}` : 'none',
                transition:'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity:0, x:28 }} animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-28 }} transition={{ duration:0.25 }}>
            {/* Question card */}
            <div style={{ textAlign:'center', marginBottom:16, padding:'24px 20px',
              borderRadius:24, background:G.glass, border:`1px solid ${G.goldBorder}` }}>
              <div style={{ fontSize:34, marginBottom:10 }}>{q.icon}</div>
              <div style={badge}>{q.cat}</div>
              <p style={{ fontSize:16, fontWeight:800, color:G.w90, lineHeight:1.45,
                letterSpacing:'-0.02em', marginTop:8 }}>{q.q}</p>
            </div>

            {/* Options */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {q.opts.map(opt => {
                const dc = DC[opt.d];
                return (
                  <motion.button key={opt.d}
                    whileHover={{ scale:1.015, x:4 }} whileTap={{ scale:0.98 }}
                    onClick={() => handleAnswer(opt.d)}
                    style={{ display:'flex', alignItems:'center', gap:14,
                      padding:'16px 18px', borderRadius:18,
                      background:G.glass, border:`1px solid ${G.glassBorder}`,
                      cursor:'pointer', textAlign:'left',
                      fontFamily:"'Plus Jakarta Sans', sans-serif",
                      width:'100%', transition:'background 0.2s, border-color 0.2s' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = dc.g;
                      (e.currentTarget as HTMLElement).style.borderColor = dc.b;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = G.glass;
                      (e.currentTarget as HTMLElement).style.borderColor = G.glassBorder;
                    }}>
                    <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                      background:dc.g, border:`1px solid ${dc.b}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                      {opt.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:G.w90, marginBottom:3 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize:11, color:G.w40, lineHeight:1.55 }}>
                        {opt.desc}
                      </div>
                    </div>
                    <div style={{ color:dc.c, opacity:0.4, flexShrink:0, fontSize:15, alignSelf:'center' }}>→</div>
                  </motion.button>
                );
              })}
            </div>

            {step > 0 && (
              <button onClick={() => setStep(s => s-1)}
                style={{ marginTop:14, padding:'8px 20px', borderRadius:999,
                  background:'transparent', border:`1px solid ${G.glassBorder}`,
                  color:G.w40, fontSize:12, fontWeight:700,
                  cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                ← Back
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── PHASE: SITUATION & SUBMIT ─────────────────────────────────
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      style={{ maxWidth:580, margin:'0 auto', padding:'32px 16px' }}>
      {/* Score summary */}
      <div style={{ padding:24, borderRadius:24, marginBottom:24,
        background:`linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))`,
        border:`1px solid ${G.goldBorder}`, boxShadow:`0 0 50px ${G.goldGlow}` }}>
        <div style={{ ...badge, marginBottom:14 }}>✦ Prakriti Scan Complete — 18 Dimensions ✦</div>
        <div style={{ display:'flex', gap:12 }}>
          {[
            { label:'Vata · Air',   val:vPct, color:DC.vata.c },
            { label:'Pitta · Fire', val:pPct, color:DC.pitta.c },
            { label:'Kapha · Earth',val:kPct, color:DC.kapha.c },
          ].map(d => (
            <div key={d.label} style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.04em', color:d.color }}>
                {d.val}%
              </div>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'.4em',
                textTransform:'uppercase', color:G.w40, marginTop:3 }}>
                {d.label}
              </div>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', marginTop:6 }}>
                <div style={{ height:'100%', borderRadius:2, width:`${d.val}%`,
                  background:d.color, boxShadow:`0 0 6px ${d.color}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={badge}>✦ Final Dimension · Step 3 of 3 ✦</div>
        <h2 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.04em',
          color:G.w90, marginTop:10, marginBottom:6 }}>Life Situation</h2>
        <p style={{ fontSize:13, color:G.w40, lineHeight:1.65 }}>
          This unlocks your personalized Siddha healing path
        </p>
      </div>

      <div style={{ marginBottom:22 }}>
        <div style={{ ...badge, marginBottom:10 }}>Current Life Challenges</div>
        <textarea required rows={4} value={formData.currentChallenge}
          onChange={e => setFormData(p => ({ ...p, currentChallenge:e.target.value }))}
          placeholder="e.g. High work stress, sleep issues, relationship tension, digestive problems, financial anxiety…"
          style={{ width:'100%', padding:'16px 18px', borderRadius:18,
            background:'rgba(255,255,255,0.03)', border:`1px solid ${G.glassBorder}`,
            color:G.w90, fontSize:14, lineHeight:1.65, resize:'none',
            fontFamily:"'Plus Jakarta Sans', sans-serif", outline:'none' }}
          onFocus={e => e.currentTarget.style.borderColor = G.goldStrong}
          onBlur={e  => e.currentTarget.style.borderColor = G.glassBorder}
        />
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => { setPhase('scan'); setStep(TOTAL-1); }}
          style={{ flex:1, padding:14, borderRadius:18,
            background:'transparent', border:`1px solid ${G.glassBorder}`,
            color:G.w40, fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
          ← Rescan
        </button>
        <GoldButton onClick={handleSubmit} disabled={!formData.currentChallenge} style={{ flex:3 }}>
          Reveal My Siddha Blueprint <Sparkles style={{ width:16, height:16, marginLeft:8 }} />
        </GoldButton>
      </div>
    </motion.div>
  );
};

// ── Shared style token ────────────────────────────────────────────
const badge: React.CSSProperties = {
  fontSize:8, fontWeight:800, letterSpacing:'0.55em',
  textTransform:'uppercase', color:G.gold, opacity:0.7,
  display:'block',
};

// ── Sub-components ────────────────────────────────────────────────
const ScanField: React.FC<{
  label:string; type:string; placeholder:string;
  value:string; onChange:(v:string)=>void;
}> = ({ label, type, placeholder, value, onChange }) => (
  <div>
    <div style={badge}>{label}</div>
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ width:'100%', padding:'13px 18px', borderRadius:14, marginTop:8,
        background:'rgba(255,255,255,0.03)', border:`1px solid ${G.glassBorder}`,
        color:G.w90, fontSize:14, fontFamily:"'Plus Jakarta Sans', sans-serif",
        outline:'none', colorScheme:'dark' }}
      onFocus={e => e.currentTarget.style.borderColor = G.goldStrong}
      onBlur={e  => e.currentTarget.style.borderColor = G.glassBorder}
    />
  </div>
);

const GoldButton: React.FC<{
  onClick:()=>void; disabled?:boolean;
  children:React.ReactNode; style?:React.CSSProperties;
}> = ({ onClick, disabled, children, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      padding:'15px 20px', borderRadius:18, display:'flex',
      alignItems:'center', justifyContent:'center',
      background: disabled ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${G.gold}, #B8960C)`,
      border:`1px solid ${disabled ? G.glassBorder : G.gold}`,
      color: disabled ? G.w40 : '#050505',
      fontSize:14, fontWeight:900, letterSpacing:'-0.02em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily:"'Plus Jakarta Sans', sans-serif",
      boxShadow: disabled ? 'none' : `0 0 30px ${G.goldGlow}`,
      transition:'all 0.2s',
      width:'100%',
      ...style,
    }}>
    {children}
  </button>
);
