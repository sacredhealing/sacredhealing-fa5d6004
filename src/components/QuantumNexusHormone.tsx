// @ts-nocheck
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  QUANTUM NEXUS: Hormone Intelligence (QI)                       ║
 * ║  Personalised, data-driven hormone dashboard                    ║
 * ║  • Questionnaire-first onboarding (life stage, goal, pill)      ║
 * ║  • Hormone graph PRIMARY visual with live "Today" dot           ║
 * ║  • Quick Daily Log (bleed, discharge, energy)                   ║
 * ║  • Phase-synced nutrition list with target quantities           ║
 * ║  • Phase-synced Movement/Workout section                        ║
 * ║  • 7-day forecast planner                                       ║
 * ║  • Conditional rendering — menopause hidden if cycling/pregnant ║
 * ║  • Jyotish + Dosha from existing hooks                         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCyclePhase } from '@/hooks/useCyclePhase';
import { useJyotishProfile } from '@/hooks/useJyotishProfile';
import { useAyurvedaAnalysis } from '@/hooks/useAyurvedaAnalysis';
import { useAuth } from '@/hooks/useAuth';

/* ─── Design tokens ──────────────────────────────────────────────────────────── */
const G = '#D4AF37';
const G2 = '#F5E27D';
const BG = '#050505';
const GLASS = 'rgba(255,255,255,0.025)';
const BORDER = 'rgba(255,255,255,0.07)';
const GOLD_BORDER = 'rgba(212,175,55,0.25)';
const S = (extra?: object) => ({
  background: GLASS,
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  border: `1px solid ${BORDER}`,
  borderRadius: 28,
  padding: 20,
  marginBottom: 16,
  ...extra,
});
const KICKER = {
  fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const,
  color: G, display: 'block', marginBottom: 10,
};
const INPUT_S = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
  borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};
const LABEL_S = {
  fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6,
};

/* ─── Hormone curves (28-day) ────────────────────────────────────────────────── */
const HC = {
  prog: [5,4,3,2,1,3,6,10,12,14,16,18,20,22,20,30,50,70,85,90,88,82,75,65,50,35,20,8],
  ostr: [10,12,14,16,20,28,38,52,65,75,80,85,90,95,85,70,60,55,55,58,55,52,48,45,42,38,28,15],
  fsh:  [8,12,18,25,30,35,40,45,40,35,30,25,20,18,15,12,10,8,8,9,9,8,8,9,12,18,25,12],
  lh:   [3,3,4,4,5,6,7,8,9,10,12,14,18,95,20,8,5,4,4,4,5,5,4,4,4,4,5,3],
};
const HORMONE_COLORS = { prog:'#A78BFA', ostr:'#F472B6', fsh:'#60A5FA', lh:'#34D399' };
const HORMONE_LABELS = { prog:'Progesterone', ostr:'Estrogen', fsh:'FSH', lh:'LH' };

/* ─── Phase data ─────────────────────────────────────────────────────────────── */
type PhaseId = 'menstrual'|'follicular'|'ovulatory'|'luteal';
const PHASES: Record<PhaseId, {
  name: string; days: string; color: string; season: string;
  tagline: string;
  foods: { name: string; amount: string; why: string; phase: 'excellent'|'neutral'|'avoid' }[];
  supplements: { name: string; dose: string; why: string }[];
  workouts: { type: string; intensity: 'Low'|'Moderate'|'High'; examples: string[]; why: string }[];
}> = {
  menstrual: {
    name: 'Menstrual Phase', days: 'Days 1–5', color: '#F87171', season: 'Winter · Inner',
    tagline: 'Rest, release, renew. Your body is doing powerful work.',
    foods: [
      { name: 'Kidney Beans', amount: '150g cooked', why: 'Iron 3.9mg — replenishes blood loss', phase: 'excellent' },
      { name: 'Dark Chocolate (85%+)', amount: '30g', why: 'Magnesium 64mg — eases cramps', phase: 'excellent' },
      { name: 'Spinach', amount: '80g raw', why: 'Iron 2.1mg + Folate 194mcg — blood building', phase: 'excellent' },
      { name: 'Wild Blueberries', amount: '100g', why: 'Antioxidants reduce prostaglandin inflammation', phase: 'excellent' },
      { name: 'Walnuts', amount: '30g', why: 'Omega-3 2.5g — anti-cramp, anti-inflammatory', phase: 'excellent' },
      { name: 'Beet Root', amount: '80g roasted', why: 'Nitrates boost blood flow, reduce fatigue', phase: 'excellent' },
      { name: 'Ginger Root', amount: '5g fresh or tea', why: 'Prostaglandin inhibitor — natural pain relief', phase: 'excellent' },
      { name: 'Lentils (red)', amount: '150g cooked', why: 'Iron 3.3mg + protein 18g — energy support', phase: 'excellent' },
      { name: 'Pumpkin Seeds', amount: '30g', why: 'Zinc 2.9mg — regulates period pain & mood', phase: 'excellent' },
      { name: 'Bone Broth / Miso', amount: '250ml', why: 'Collagen + electrolytes — gut & womb repair', phase: 'excellent' },
      { name: 'Caffeinated Coffee', amount: 'Minimise', why: 'Constricts blood vessels — worsens cramps', phase: 'avoid' },
      { name: 'Processed Sugar', amount: 'Minimise', why: 'Spikes prostaglandins — intensifies pain', phase: 'avoid' },
    ],
    supplements: [
      { name: 'Magnesium Glycinate', dose: '300–400mg before bed', why: 'Muscle relaxant — reduces cramping & improves sleep' },
      { name: 'Iron Bisglycinate', dose: '18–25mg with Vitamin C', why: 'Bioavailable form — replenishes menstrual blood loss' },
      { name: 'Omega-3 (EPA/DHA)', dose: '2–3g daily', why: 'Reduces prostaglandins — powerful anti-cramp effect' },
      { name: 'Vitamin B6', dose: '50–100mg', why: 'Mood stabiliser — reduces premenstrual carry-over' },
      { name: 'Chaste Tree (Vitex)', dose: '400mg morning', why: 'Hormonal adaptogen — reduces pain & heavy flow' },
    ],
    workouts: [
      { type: 'Restorative Yoga', intensity: 'Low', examples: ['Supta Baddha Konasana', 'Child\'s Pose', 'Legs up the wall'], why: 'Opens hip flexors, reduces cramps, activates parasympathetic' },
      { type: 'Walking', intensity: 'Low', examples: ['20-30 min gentle walk', 'Barefoot in nature'], why: 'Stimulates endorphins without taxing adrenals' },
      { type: 'Stretching / Yin', intensity: 'Low', examples: ['Dragon Pose', 'Sleeping Swan'], why: 'Releases fascia tension in pelvic region' },
    ],
  },
  follicular: {
    name: 'Follicular Phase', days: 'Days 6–13', color: '#34D399', season: 'Spring · Rising',
    tagline: 'Estrogen rises. Energy builds. Your most creative window.',
    foods: [
      { name: 'Broccoli Sprouts', amount: '50g fresh', why: 'Sulforaphane activates estrogen detox (CYP1A1)', phase: 'excellent' },
      { name: 'Flaxseeds (ground)', amount: '2 tbsp / 14g', why: 'Lignans balance rising estrogen via SHBG modulation', phase: 'excellent' },
      { name: 'Fermented Foods', amount: '2–3 servings', why: 'Estrobolome bacteria regulate estrogen recirculation', phase: 'excellent' },
      { name: 'Quinoa', amount: '185g cooked', why: 'Complete protein 8g + zinc 2mg — supports FSH signalling', phase: 'excellent' },
      { name: 'Avocado', amount: '½ medium', why: 'Monounsaturated fat + B6 — steroid hormone precursor', phase: 'excellent' },
      { name: 'Green Tea (Matcha)', amount: '1–2 cups', why: 'EGCG modulates estrogen receptor — protects breast tissue', phase: 'excellent' },
      { name: 'Eggs (pasture)', amount: '2 large', why: 'Choline 250mg + B12 1.1mcg — liver detox support', phase: 'excellent' },
      { name: 'Sunflower Seeds', amount: '30g', why: 'Vitamin E 7.4mg — follicle development antioxidant', phase: 'excellent' },
      { name: 'Amaranth', amount: '100g cooked', why: 'Calcium 116mg + iron 2.6mg — bone + blood building', phase: 'excellent' },
      { name: 'Asparagus', amount: '100g', why: 'Folate 52mcg + prebiotic fibre — estrobolome support', phase: 'excellent' },
      { name: 'Peas (snap/frozen)', amount: '80g', why: 'Plant estrogen + zinc 0.5mg — gentle phytoestrogen', phase: 'neutral' },
      { name: 'Alcohol', amount: 'Avoid / Minimise', why: 'Impairs liver detox of estrogen — drives estrogen dominance', phase: 'avoid' },
    ],
    supplements: [
      { name: 'DIM (Diindolylmethane)', dose: '100–200mg with meal', why: 'Shifts estrogen to protective 2-OHE1 — prevents dominance' },
      { name: 'Folate (L-methylfolate)', dose: '400–800mcg', why: 'Critical for follicle maturation and DNA methylation' },
      { name: 'Zinc Picolinate', dose: '15–25mg', why: 'Essential for follicle development and LH surge prep' },
      { name: 'Vitamin D3 + K2', dose: '2000–4000IU D3 + 100mcg K2', why: 'Supports ovarian reserve and follicle quality' },
      { name: 'Maca Root', dose: '1500–3000mg', why: 'Adaptogen — amplifies energy and libido with rising estrogen' },
    ],
    workouts: [
      { type: 'Strength Training', intensity: 'Moderate', examples: ['Compound lifts (squat, deadlift)', 'Resistance bands', 'Push/pull splits'], why: 'Rising estrogen improves muscle protein synthesis and recovery' },
      { type: 'Running / Cardio', intensity: 'Moderate', examples: ['5–8km steady run', 'Cycling class', 'Dance'], why: 'Estrogen boosts endurance — best time to build aerobic base' },
      { type: 'Pilates / Barre', intensity: 'Moderate', examples: ['Core activation', 'Leg series', 'Balance work'], why: 'Coordination improves in follicular — neural plasticity peaks' },
    ],
  },
  ovulatory: {
    name: 'Ovulatory Phase', days: 'Days 14–16', color: '#FBBF24', season: 'Summer · Peak',
    tagline: 'LH surges. Peak energy. Your most magnetic and social window.',
    foods: [
      { name: 'Berries (mixed)', amount: '150g', why: 'Antioxidants protect egg from oxidative damage at release', phase: 'excellent' },
      { name: 'Salmon / Mackerel', amount: '120g or plant omega', why: 'DHA 1.2g — protects egg membrane integrity', phase: 'excellent' },
      { name: 'Sesame Seeds', amount: '2 tbsp / 18g', why: 'Zinc 1.4mg + lignans — peak hormone balance support', phase: 'excellent' },
      { name: 'Raw Carrot', amount: '1 medium / 80g', why: 'Raw carrot fibre binds excess estrogen in gut', phase: 'excellent' },
      { name: 'Fig', amount: '2 fresh or 30g dried', why: 'Calcium 35mg + potassium — uterine muscle function', phase: 'excellent' },
      { name: 'Coconut Yoghurt', amount: '150g', why: 'Probiotics + MCT — estrobolome + hormone synthesis', phase: 'excellent' },
      { name: 'Sunflower Butter', amount: '2 tbsp', why: 'Vitamin E 4mg — antioxidant protection at ovulation', phase: 'excellent' },
      { name: 'Leafy Greens (kale)', amount: '80g', why: 'Indole-3-carbinol supports estrogen clearance post-peak', phase: 'excellent' },
      { name: 'Heavy starches', amount: 'Reduce portion', why: 'Blood sugar spikes suppress LH surge precision', phase: 'neutral' },
    ],
    supplements: [
      { name: 'CoQ10 (Ubiquinol)', dose: '200–400mg', why: 'Mitochondrial support for egg energy — peak oxidative demand' },
      { name: 'NAC (N-Acetyl Cysteine)', dose: '600mg', why: 'Glutathione precursor — protects egg from oxidative stress' },
      { name: 'Inositol (Myo + D-Chiro)', dose: '4g:400mg ratio', why: 'Supports LH signalling and ovarian follicle response' },
      { name: 'Vitamin C', dose: '1000mg', why: 'Corpus luteum formation requires high Vitamin C post-ovulation' },
      { name: 'L-Arginine', dose: '2g', why: 'Increases uterine and ovarian blood flow at ovulation' },
    ],
    workouts: [
      { type: 'HIIT / High Intensity', intensity: 'High', examples: ['Sprint intervals', 'Tabata circuits', 'CrossFit WODs'], why: 'Testosterone peaks — explosive power and recovery are at maximum' },
      { type: 'Group Classes / Team', intensity: 'High', examples: ['Hot yoga', 'Boxing class', 'Group cycling'], why: 'Oxytocin + social estrogen drive — peak connection energy' },
      { type: 'Functional Training', intensity: 'High', examples: ['Olympic lifts', 'Plyometrics', 'Battle ropes'], why: 'Estrogen + testosterone synergy gives maximum strength output' },
    ],
  },
  luteal: {
    name: 'Luteal Phase', days: 'Days 17–28', color: '#A78BFA', season: 'Autumn · Deepening',
    tagline: 'Progesterone rises. Energy turns inward. Complete, consolidate, rest.',
    foods: [
      { name: 'Sweet Potato', amount: '150g roasted', why: 'B6 0.3mg + potassium — progesterone co-factor', phase: 'excellent' },
      { name: 'Dark Leafy Greens (Swiss Chard)', amount: '80g sautéed', why: 'Magnesium 150mg — reduces PMS and bloating', phase: 'excellent' },
      { name: 'Chickpeas', amount: '165g cooked', why: 'B6 0.2mg + zinc 2.5mg — mood stabilisation + progesterone', phase: 'excellent' },
      { name: 'Sunflower Seeds', amount: '30g', why: 'Vitamin E 7mg — luteal phase antioxidant + breast tenderness', phase: 'excellent' },
      { name: 'Cacao (raw)', amount: '1 tbsp / 10g', why: 'Magnesium 27mg + anandamide — PMS mood support', phase: 'excellent' },
      { name: 'Brown Rice', amount: '185g cooked', why: 'B vitamins + selenium 19mcg — liver detox of estrogen', phase: 'excellent' },
      { name: 'Pumpkin Seeds', amount: '30g', why: 'Zinc 2.9mg — triggers progesterone rise post-ovulation', phase: 'excellent' },
      { name: 'Turmeric', amount: '1 tsp / 2.5g in food', why: 'Curcumin reduces PMS inflammation and cyclooxygenase', phase: 'excellent' },
      { name: 'Warm Soups / Stews', amount: 'Daily', why: 'Vata-pacifying, grounding — supports nervous system in luteal', phase: 'excellent' },
      { name: 'Cold raw foods', amount: 'Minimise', why: 'Cold foods weaken Agni — increases Vata and bloating', phase: 'avoid' },
      { name: 'Caffeine > 1 cup', amount: 'Reduce', why: 'Raises cortisol → suppresses progesterone', phase: 'avoid' },
      { name: 'Refined carbs / sugar', amount: 'Minimise', why: 'Blood sugar instability amplifies PMS anxiety and fatigue', phase: 'avoid' },
    ],
    supplements: [
      { name: 'Vitex (Chaste Tree)', dose: '400mg morning', why: 'Stimulates LH → raises progesterone — reduces PMS' },
      { name: 'Magnesium Glycinate', dose: '400mg before bed', why: 'Reduces PMS anxiety, bloating, cramps, and insomnia' },
      { name: 'Vitamin B6 (P5P)', dose: '50–100mg', why: 'Neurotransmitter synthesis — serotonin, dopamine balance' },
      { name: 'Evening Primrose Oil', dose: '1500mg daily', why: 'GLA reduces breast tenderness and inflammatory PMS' },
      { name: 'Ashwagandha', dose: '300–600mg KSM-66', why: 'Adaptogen — lowers cortisol surge that suppresses progesterone' },
    ],
    workouts: [
      { type: 'Yoga (Vinyasa/Hatha)', intensity: 'Moderate', examples: ['Hip openers', 'Twists for liver detox', 'Inversions'], why: 'Progesterone supports flexibility — twists aid estrogen clearance' },
      { type: 'Swimming / Low-impact', intensity: 'Low', examples: ['30 min swim', 'Aqua yoga', 'Walking in water'], why: 'Supports joints without cortisol spike — progesterone is calming' },
      { type: 'Moderate Strength', intensity: 'Moderate', examples: ['Bodyweight circuits', 'Resistance bands', 'Reformer Pilates'], why: 'Moderate load prevents catabolism as energy turns inward' },
    ],
  },
};

/* ─── Life stage types ───────────────────────────────────────────────────────── */
type LifeStage = 'cycling' | 'perimenopause' | 'menopause';
type PrimaryGoal = 'general' | 'pregnancy' | 'symptoms' | 'fertility';
interface UserProfile {
  age: number;
  lifeStage: LifeStage;
  goal: PrimaryGoal;
  onPill: boolean;
  cycleLength: number;
  bleedDays: number;
  lastPeriodDate: string;
}

/* ─── helpers ────────────────────────────────────────────────────────────────── */
function getPhaseId(day: number, cycleLen = 28, bleedDays = 5): PhaseId {
  const ovDay = Math.round(cycleLen / 2);
  if (day <= bleedDays) return 'menstrual';
  if (day <= ovDay - 1) return 'follicular';
  if (day <= ovDay + 2) return 'ovulatory';
  return 'luteal';
}

function getDayPhaseId(absDay: number, cycleLen = 28, bleedDays = 5): PhaseId {
  const d = ((absDay - 1) % cycleLen) + 1;
  return getPhaseId(d, cycleLen, bleedDays);
}

declare global { interface Window { Chart?: any } }

/* ─── SVG Hormone Chart with live dot ───────────────────────────────────────── */
function HormoneGraph({ day, cycleLen = 28 }: { day: number; cycleLen?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 320, H = 120, PAD_L = 8, PAD_R = 8, PAD_T = 10, PAD_B = 24;
  const cW = W - PAD_L - PAD_R;
  const cH = H - PAD_T - PAD_B;

  const toX = (i: number) => PAD_L + (i / (cycleLen - 1)) * cW;
  const toY = (v: number) => PAD_T + cH - (v / 100) * cH;

  const pts = (data: number[]) => {
    const arr = Array.from({ length: cycleLen }, (_, i) => {
      const t = i / (cycleLen - 1);
      const srcI = t * (data.length - 1);
      const lo = Math.floor(srcI), hi = Math.ceil(srcI);
      return data[lo] + (data[hi] - data[lo]) * (srcI - lo);
    });
    return arr.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  };

  const dotForHormone = (key: keyof typeof HC) => {
    const data = HC[key];
    const t = (day - 1) / (cycleLen - 1);
    const srcI = t * (data.length - 1);
    const lo = Math.floor(srcI), hi = Math.ceil(srcI);
    const v = data[lo] + (data[hi] - data[lo]) * (srcI - lo);
    return { x: toX(day - 1), y: toY(v), color: HORMONE_COLORS[key] };
  };

  // Phase background bands
  const phases = [
    { start: 0, end: 5, color: 'rgba(248,113,113,0.08)' },
    { start: 5, end: 13, color: 'rgba(52,211,153,0.07)' },
    { start: 13, end: 16, color: 'rgba(251,191,36,0.08)' },
    { start: 16, end: cycleLen, color: 'rgba(167,139,250,0.07)' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Phase bands */}
        {phases.map((ph, i) => (
          <rect
            key={i}
            x={toX(ph.start)}
            y={PAD_T}
            width={toX(ph.end) - toX(ph.start)}
            height={cH}
            fill={ph.color}
          />
        ))}

        {/* Today vertical line */}
        <line
          x1={toX(day - 1)} y1={PAD_T}
          x2={toX(day - 1)} y2={PAD_T + cH}
          stroke={G} strokeWidth={1} strokeDasharray="3,3" opacity={0.6}
        />

        {/* Hormone curves */}
        {(Object.keys(HC) as (keyof typeof HC)[]).map(key => (
          <polyline
            key={key}
            points={pts(HC[key])}
            fill="none"
            stroke={HORMONE_COLORS[key]}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        ))}

        {/* Today dots */}
        {(Object.keys(HC) as (keyof typeof HC)[]).map(key => {
          const dot = dotForHormone(key);
          return (
            <g key={`dot-${key}`}>
              <circle cx={dot.x} cy={dot.y} r={4} fill={BG} stroke={dot.color} strokeWidth={1.5} />
              <circle cx={dot.x} cy={dot.y} r={2} fill={dot.color} />
            </g>
          );
        })}

        {/* Day axis ticks */}
        {[1, 7, 14, 21, 28].map(d => (
          <text key={d} x={toX(d - 1)} y={H - 6} fill="rgba(255,255,255,0.3)" fontSize={7} textAnchor="middle">{d}</text>
        ))}

        {/* "Today" label */}
        <text x={toX(day - 1)} y={PAD_T - 3} fill={G} fontSize={7} textAnchor="middle" fontWeight="bold">▼</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8 }}>
        {(Object.entries(HORMONE_LABELS) as [keyof typeof HC, string][]).map(([k, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 2, borderRadius: 1, background: HORMONE_COLORS[k] }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 7-Day Forecast ─────────────────────────────────────────────────────────── */
function SevenDayForecast({ day, cycleLen, bleedDays }: { day: number; cycleLen: number; bleedDays: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const absDay = ((day - 1 + i) % cycleLen) + 1;
    const phaseId = getDayPhaseId(absDay, cycleLen, bleedDays);
    const phase = PHASES[phaseId];
    return { absDay, phaseId, phase, isToday: i === 0 };
  });

  const date = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {days.map((d, i) => (
        <div
          key={i}
          style={{
            minWidth: 100, flexShrink: 0, borderRadius: 20, padding: '14px 10px', textAlign: 'center',
            background: d.isToday ? `${d.phase.color}18` : GLASS,
            border: `1px solid ${d.isToday ? d.phase.color + '55' : BORDER}`,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            {d.isToday ? 'TODAY' : date(i)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: d.phase.color, letterSpacing: '-0.02em', marginBottom: 2 }}>
            {d.absDay}
          </div>
          <div style={{ fontSize: 8, fontWeight: 800, color: d.phase.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            {d.phaseId === 'menstrual' ? 'MENS' : d.phaseId === 'follicular' ? 'FOLL' : d.phaseId === 'ovulatory' ? 'OVU' : 'LUT'}
          </div>
          {/* Top food for the day */}
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
            {d.phase.foods[0]?.name}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
            {d.phase.workouts[0]?.type}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Quick Log component ────────────────────────────────────────────────────── */
type BleedLevel = 'none' | 'spotting' | 'light' | 'moderate' | 'heavy';
type DischargeType = 'none' | 'creamy' | 'watery' | 'eggwhite' | 'sticky' | 'spotting';
interface DailyLog {
  date: string;
  bleed: BleedLevel;
  discharge: DischargeType;
  energy: number;
  mood: number;
  notes: string;
}

function QuickLogPanel({ gold }: { gold: string }) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [log, setLog] = useState<DailyLog>({ date: today, bleed: 'none', discharge: 'none', energy: 5, mood: 5, notes: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        activity_type: 'cycle_daily_log',
        activity_data: log,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const bleedLevels: BleedLevel[] = ['none', 'spotting', 'light', 'moderate', 'heavy'];
  const bleedColors: Record<BleedLevel, string> = { none: 'rgba(255,255,255,0.2)', spotting: '#FBBF24', light: '#FB923C', moderate: '#F87171', heavy: '#EF4444' };

  const dischargeTypes: DischargeType[] = ['none', 'spotting', 'sticky', 'creamy', 'watery', 'eggwhite'];
  const dischargeMeaning: Record<DischargeType, string> = {
    none: 'None', spotting: 'Spotting', sticky: 'Sticky (dry)', creamy: 'Creamy (post-period)', watery: 'Watery', eggwhite: 'Egg-white (fertile)',
  };

  return (
    <div style={S({ border: `1px solid ${GOLD_BORDER}`, background: 'linear-gradient(135deg,rgba(212,175,55,0.06),rgba(212,175,55,0.01))' })}>
      <span style={KICKER}>⬡ Quick Daily Log — {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Bleed level */}
        <div>
          <div style={LABEL_S as object}>Bleeding</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {bleedLevels.map(b => (
              <button key={b} type="button" onClick={() => setLog(l => ({ ...l, bleed: b }))}
                style={{ padding: '6px 14px', borderRadius: 40, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${log.bleed === b ? bleedColors[b] : 'rgba(255,255,255,0.1)'}`, background: log.bleed === b ? `${bleedColors[b]}22` : 'transparent', color: log.bleed === b ? bleedColors[b] : 'rgba(255,255,255,0.45)', transition: 'all 0.15s' }}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Discharge */}
        <div>
          <div style={LABEL_S as object}>Discharge</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {dischargeTypes.map(d => (
              <button key={d} type="button" onClick={() => setLog(l => ({ ...l, discharge: d }))}
                style={{ padding: '6px 12px', borderRadius: 40, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${log.discharge === d ? gold + '88' : 'rgba(255,255,255,0.08)'}`, background: log.discharge === d ? 'rgba(212,175,55,0.12)' : 'transparent', color: log.discharge === d ? gold : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
                {dischargeMeaning[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Energy + Mood sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={LABEL_S as object}>Energy · {log.energy}/10</div>
            <input type="range" min={1} max={10} value={log.energy} onChange={e => setLog(l => ({ ...l, energy: +e.target.value }))}
              style={{ width: '100%', accentColor: '#34D399', cursor: 'pointer' }} />
          </div>
          <div>
            <div style={LABEL_S as object}>Mood · {log.mood}/10</div>
            <input type="range" min={1} max={10} value={log.mood} onChange={e => setLog(l => ({ ...l, mood: +e.target.value }))}
              style={{ width: '100%', accentColor: '#A78BFA', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={LABEL_S as object}>Notes (optional)</div>
          <textarea value={log.notes} onChange={e => setLog(l => ({ ...l, notes: e.target.value }))}
            placeholder="Symptoms, cravings, observations…"
            style={{ ...INPUT_S, resize: 'none', height: 60, fontSize: 12 }} />
        </div>

        <button type="button" onClick={save} disabled={saving}
          style={{ padding: '12px 24px', borderRadius: 40, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', background: saved ? '#34D399' : gold, color: '#050505', border: 'none', fontFamily: 'inherit', transition: 'all 0.2s' }}>
          {saved ? 'Saved ✦' : saving ? 'Saving…' : 'Save Today\'s Log'}
        </button>
      </div>
    </div>
  );
}

/* ─── Food & Nutrition Section ───────────────────────────────────────────────── */
function NutritionSection({ phaseId }: { phaseId: PhaseId }) {
  const phase = PHASES[phaseId];
  const [filter, setFilter] = useState<'all' | 'excellent' | 'avoid'>('all');

  const filtered = phase.foods.filter(f => filter === 'all' || f.phase === filter);

  const phaseColor: Record<'excellent' | 'neutral' | 'avoid', string> = {
    excellent: '#34D399', neutral: '#FBBF24', avoid: '#F87171',
  };

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['all', 'excellent', 'avoid'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 40, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${filter === f ? G + '88' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? 'rgba(212,175,55,0.1)' : 'transparent', color: filter === f ? G : 'rgba(255,255,255,0.45)', transition: 'all 0.15s' }}>
            {f === 'all' ? 'All Foods' : f === 'excellent' ? '✓ Best for Phase' : '✗ Avoid'}
          </button>
        ))}
      </div>

      {/* Food list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((food, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 20, background: GLASS, border: `1px solid ${phaseColor[food.phase]}22`, alignItems: 'flex-start' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: phaseColor[food.phase], flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{food.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: phaseColor[food.phase], flexShrink: 0, marginLeft: 8 }}>{food.amount}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{food.why}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplements */}
      <div style={{ marginTop: 20 }}>
        <div style={KICKER as object}>Supplement Stack · {phase.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {phase.supplements.map((sup, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(212,175,55,0.04)', border: `1px solid ${GOLD_BORDER}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: G }}>{sup.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: 8 }}>{sup.dose}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{sup.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Movement Section ───────────────────────────────────────────────────────── */
function MovementSection({ phaseId }: { phaseId: PhaseId }) {
  const phase = PHASES[phaseId];
  const intColors = { Low: '#34D399', Moderate: '#FBBF24', High: '#F87171' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {phase.workouts.map((w, i) => (
        <div key={i} style={S({ marginBottom: 0 }) as object}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{w.type}</span>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 40, background: `${intColors[w.intensity]}18`, color: intColors[w.intensity], border: `1px solid ${intColors[w.intensity]}44` }}>
              {w.intensity}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10, lineHeight: 1.5 }}>{w.why}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {w.examples.map((ex, j) => (
              <span key={j} style={{ fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 40, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {ex}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Onboarding Questionnaire ───────────────────────────────────────────────── */
function OnboardingQuestionnaire({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    cycleLength: 28, bleedDays: 5, onPill: false,
  });

  const update = (patch: Partial<UserProfile>) => setProfile(p => ({ ...p, ...patch }));
  const next = () => setStep(s => s + 1);

  const OptionBtn = ({ value, current, onClick, children }: { value: any; current: any; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick}
      style={{ width: '100%', padding: '14px 20px', borderRadius: 20, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${current === value ? G + '77' : BORDER}`, background: current === value ? `rgba(212,175,55,0.1)` : GLASS, color: current === value ? G : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, transition: 'all 0.15s', marginBottom: 8 }}>
      {children}
    </button>
  );

  const steps = [
    /* Step 0 — Age & Life Stage */
    <div key={0}>
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>What stage of life are you in?</div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>This determines which modules are shown to you.</p>
      <div>
        <div style={LABEL_S as object}>Your Age</div>
        <input type="number" min={14} max={85} placeholder="e.g. 32"
          value={profile.age || ''} onChange={e => update({ age: +e.target.value })}
          style={{ ...INPUT_S, marginBottom: 16, width: '50%' }} />
      </div>
      <OptionBtn value="cycling" current={profile.lifeStage} onClick={() => { update({ lifeStage: 'cycling' }); }}>
        🌱 Cycling — I have regular or irregular menstrual cycles
      </OptionBtn>
      <OptionBtn value="perimenopause" current={profile.lifeStage} onClick={() => { update({ lifeStage: 'perimenopause' }); }}>
        🌀 Perimenopause — My cycles are shifting / I'm in the transition
      </OptionBtn>
      <OptionBtn value="menopause" current={profile.lifeStage} onClick={() => { update({ lifeStage: 'menopause' }); }}>
        🌙 Post-Menopause — 12+ months without a period
      </OptionBtn>
      <button type="button" onClick={next} disabled={!profile.lifeStage}
        style={{ padding: '13px 32px', borderRadius: 40, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: profile.lifeStage ? 'pointer' : 'not-allowed', background: profile.lifeStage ? G : 'rgba(255,255,255,0.1)', color: profile.lifeStage ? '#050505' : 'rgba(255,255,255,0.3)', border: 'none', fontFamily: 'inherit', marginTop: 8 }}>
        Continue →
      </button>
    </div>,

    /* Step 1 — Goal */
    <div key={1}>
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>What is your primary goal?</div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>This personalises your nutrition and supplement recommendations.</p>
      <OptionBtn value="general" current={profile.goal} onClick={() => update({ goal: 'general' })}>⚡ General hormonal health & energy optimisation</OptionBtn>
      <OptionBtn value="pregnancy" current={profile.goal} onClick={() => update({ goal: 'pregnancy' })}>🌸 Trying to conceive / Pregnancy tracking</OptionBtn>
      <OptionBtn value="symptoms" current={profile.goal} onClick={() => update({ goal: 'symptoms' })}>🩺 Managing symptoms (PMS, PCOS, endo, heavy flow)</OptionBtn>
      <OptionBtn value="fertility" current={profile.goal} onClick={() => update({ goal: 'fertility' })}>🔬 Fertility optimisation & egg quality</OptionBtn>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={() => setStep(0)}
          style={{ padding: '13px 24px', borderRadius: 40, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: `1px solid ${BORDER}`, fontFamily: 'inherit' }}>← Back</button>
        <button type="button" onClick={next} disabled={!profile.goal}
          style={{ flex: 1, padding: '13px 24px', borderRadius: 40, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: profile.goal ? 'pointer' : 'not-allowed', background: profile.goal ? G : 'rgba(255,255,255,0.1)', color: profile.goal ? '#050505' : 'rgba(255,255,255,0.3)', border: 'none', fontFamily: 'inherit' }}>
          Continue →
        </button>
      </div>
    </div>,

    /* Step 2 — Contraception + Cycle data (only if cycling/peri) */
    profile.lifeStage !== 'menopause' ? (
      <div key={2}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Your cycle data</div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>This powers the hormone graph and phase tracking.</p>

        <div style={{ marginBottom: 16 }}>
          <div style={LABEL_S as object}>Are you on hormonal contraception?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: true, l: 'Yes — on the pill/IUD/ring' }, { v: false, l: 'No — natural cycle' }].map(opt => (
              <button key={String(opt.v)} type="button" onClick={() => update({ onPill: opt.v })}
                style={{ flex: 1, padding: '12px', borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${profile.onPill === opt.v ? G + '66' : BORDER}`, background: profile.onPill === opt.v ? 'rgba(212,175,55,0.1)' : GLASS, color: profile.onPill === opt.v ? G : 'rgba(255,255,255,0.6)', transition: 'all 0.15s' }}>
                {opt.l}
              </button>
            ))}
          </div>
          {profile.onPill && (
            <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 16, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 11, color: 'rgba(251,191,36,0.85)', lineHeight: 1.6 }}>
              ⚠️ Hormonal contraception suppresses natural LH surge and ovulation. The graph shows a natural cycle template — use it for nutritional phase support and pattern awareness.
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={LABEL_S as object}>Average cycle length (days)</div>
            <input type="number" min={21} max={45} value={profile.cycleLength || 28}
              onChange={e => update({ cycleLength: +e.target.value })} style={INPUT_S} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Typical: 21–35</div>
          </div>
          <div>
            <div style={LABEL_S as object}>Bleed days</div>
            <input type="number" min={2} max={10} value={profile.bleedDays || 5}
              onChange={e => update({ bleedDays: +e.target.value })} style={INPUT_S} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Typical: 3–7</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={LABEL_S as object}>First day of your last period</div>
          <input type="date" value={profile.lastPeriodDate || ''}
            onChange={e => update({ lastPeriodDate: e.target.value })} style={INPUT_S} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setStep(1)}
            style={{ padding: '13px 24px', borderRadius: 40, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: `1px solid ${BORDER}`, fontFamily: 'inherit' }}>← Back</button>
          <button type="button"
            onClick={() => onComplete(profile as UserProfile)}
            disabled={!profile.lastPeriodDate}
            style={{ flex: 1, padding: '13px 24px', borderRadius: 40, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: profile.lastPeriodDate ? 'pointer' : 'not-allowed', background: profile.lastPeriodDate ? G : 'rgba(255,255,255,0.1)', color: profile.lastPeriodDate ? '#050505' : 'rgba(255,255,255,0.3)', border: 'none', fontFamily: 'inherit' }}>
            Activate My Dashboard →
          </button>
        </div>
      </div>
    ) : (
      <div key={2}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Post-Menopause Dashboard</div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
          Your dashboard will focus on hormone balance, bone density, cardiovascular health, and vitality — without a cycle tracker.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setStep(1)}
            style={{ padding: '13px 24px', borderRadius: 40, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: `1px solid ${BORDER}`, fontFamily: 'inherit' }}>← Back</button>
          <button type="button" onClick={() => onComplete(profile as UserProfile)}
            style={{ flex: 1, padding: '13px 24px', borderRadius: 40, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', background: G, color: '#050505', border: 'none', fontFamily: 'inherit' }}>
            Open My Dashboard →
          </button>
        </div>
      </div>
    ),
  ];

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= step ? G : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>
      {steps[step]}
    </div>
  );
}

/* ─── Perimenopause / Menopause view ─────────────────────────────────────────── */
function MenoView({ lifeStage }: { lifeStage: LifeStage }) {
  const stages = lifeStage === 'perimenopause'
    ? [
        { name: 'Early Perimenopause', color: '#F6AD55', desc: 'Cycles become irregular. Estrogen fluctuates widely. Progesterone begins to decline.', key: 'follicular' as PhaseId },
        { name: 'Late Perimenopause', color: '#A78BFA', desc: 'Cycles may be 60+ days apart. Estrogen drops significantly. Vasomotor symptoms peak.', key: 'luteal' as PhaseId },
      ]
    : [
        { name: 'Early Post-Menopause', color: '#60A5FA', desc: 'Estrogen is low and stable. Focus shifts to bone density, cardiovascular health and brain protection.', key: 'follicular' as PhaseId },
        { name: 'Established Menopause', color: '#A78BFA', desc: 'Full hormone recalibration. Adrenals become primary estrogen source. Vitality focus.', key: 'luteal' as PhaseId },
      ];

  const [idx, setIdx] = useState(0);
  const stage = stages[idx];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {stages.map((st, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)}
            style={{ flex: 1, padding: '12px 8px', borderRadius: 40, fontFamily: 'inherit', fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', border: idx === i ? `1px solid ${st.color}77` : `1px solid ${BORDER}`, background: idx === i ? `${st.color}15` : 'transparent', color: idx === i ? st.color : 'rgba(255,255,255,0.45)' }}>
            {st.name}
          </button>
        ))}
      </div>
      <div style={S({ borderColor: `${stage.color}33` }) as object}>
        <div style={{ fontSize: 16, fontWeight: 900, color: stage.color, marginBottom: 8 }}>{stage.name}</div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 16 }}>{stage.desc}</p>
        <div style={KICKER as object}>Nutrition & Supplements</div>
        <NutritionSection phaseId={stage.key} />
        <div style={{ marginTop: 20 }}>
          <div style={KICKER as object}>Movement</div>
          <MovementSection phaseId={stage.key} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'qn_hormone_profile';

export default function QuantumNexusHormone() {
  const { user } = useAuth();
  const { phase: livePhase, cycleDay: liveCycleDay, isConfigured, settings, isLoading: cycleLoading, updateCycleSettings, isSaving } = useCyclePhase();
  const jyotish = useJyotishProfile();
  const { doshaProfile } = useAyurvedaAnalysis();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [day, setDay] = useState(14);
  const [userAdjusted, setUserAdjusted] = useState(false);
  const [activeSection, setActiveSection] = useState<'nutrition'|'movement'|'log'|'forecast'|'jyotish'>('nutrition');

  // Load profile from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUserProfile(JSON.parse(raw));
    } catch { /* ignore */ }
    setProfileLoaded(true);
  }, []);

  // Sync live cycle day
  useEffect(() => {
    if (isConfigured && liveCycleDay && !userAdjusted) {
      setDay(Math.min(Math.max(liveCycleDay, 1), userProfile?.cycleLength || 28));
    }
  }, [isConfigured, liveCycleDay, userAdjusted, userProfile?.cycleLength]);

  const handleProfileComplete = useCallback((p: UserProfile) => {
    setUserProfile(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    // Also save cycle settings to DB
    if (p.lastPeriodDate && p.lifeStage !== 'menopause') {
      updateCycleSettings(p.lastPeriodDate, p.cycleLength, p.bleedDays);
    }
  }, [updateCycleSettings]);

  const cycleLen = userProfile?.cycleLength || 28;
  const bleedDays = userProfile?.bleedDays || 5;
  const phaseId = getPhaseId(day, cycleLen, bleedDays);
  const phase = PHASES[phaseId];

  const isCycling = !userProfile || userProfile.lifeStage === 'cycling';
  const isPeri = userProfile?.lifeStage === 'perimenopause';
  const isMeno = userProfile?.lifeStage === 'menopause';

  const SECTIONS = [
    { id: 'nutrition' as const, label: 'Nutrition' },
    { id: 'movement' as const, label: 'Movement' },
    { id: 'log' as const, label: 'Daily Log' },
    { id: 'forecast' as const, label: '7-Day Plan' },
    { id: 'jyotish' as const, label: 'Jyotish' },
  ];

  if (!profileLoaded) return null;

  // Show onboarding if no profile
  if (!userProfile) {
    return (
      <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", color: '#fff' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', padding: '32px 16px 0' }}>
          <div style={{ display: 'inline-block', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: G, border: `1px solid ${GOLD_BORDER}`, padding: '5px 16px', borderRadius: 40, background: 'rgba(212,175,55,0.1)', marginBottom: 16 }}>
            Quantum Nexus · Hormone Intelligence · QI
          </div>
          <h1 style={{ fontSize: 'clamp(24px,5vw,38px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 10 }}>
            Your <span style={{ color: G }}>Biological Rhythm</span><br />Intelligence
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '0 auto 8px', lineHeight: 1.7 }}>
            Personalised hormone tracking, phase-synced nutrition, and Vedic bio-intelligence — calibrated to your unique cycle.
          </p>
        </div>
        <OnboardingQuestionnaire onComplete={handleProfileComplete} />
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", color: '#fff', paddingBottom: 80 }}>
      {/* ── Brand Header ── */}
      <div style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
        <div style={{ display: 'inline-block', fontSize: 7, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: G, border: `1px solid ${GOLD_BORDER}`, padding: '5px 16px', borderRadius: 40, background: 'rgba(212,175,55,0.1)', marginBottom: 12 }}>
          Quantum Nexus · Hormone Intelligence · QI
        </div>
        <h1 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 6 }}>
          Your <span style={{ color: G }}>Biological Rhythm</span>
        </h1>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          {userProfile.lifeStage === 'cycling' ? 'Cycle Synchronisation Dashboard' :
           userProfile.lifeStage === 'perimenopause' ? 'Perimenopause Transition Dashboard' :
           'Post-Menopause Vitality Dashboard'}
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 14px' }}>

        {/* ── CYCLE MODE — Only shown if cycling or perimenopause ── */}
        {(isCycling || isPeri) && (
          <>
            {/* 1. HORMONE GRAPH — Primary visual */}
            <div style={S({ border: `1px solid ${GOLD_BORDER}` }) as object}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={KICKER as object}>Hormone Profile · Cycle Graph</span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: G, letterSpacing: '-0.04em', lineHeight: 1 }}>Day {day}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                    <span style={{ color: phase.color, fontWeight: 800 }}>{phase.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{phase.days}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{phase.season}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: phase.color, padding: '4px 12px', borderRadius: 40, background: `${phase.color}18`, border: `1px solid ${phase.color}33` }}>
                    {phase.tagline.split('.')[0]}
                  </div>
                </div>
              </div>

              {/* THE GRAPH */}
              <HormoneGraph day={day} cycleLen={cycleLen} />

              {/* Day slider */}
              <div style={{ marginTop: 16 }}>
                <input type="range" min={1} max={cycleLen} value={day}
                  onChange={e => { setDay(+e.target.value); setUserAdjusted(true); }}
                  style={{ width: '100%', accentColor: G, cursor: 'pointer', height: 4 }}
                  aria-label="Navigate cycle day" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {(['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'] as const).map((label, i) => {
                    const d = i === 0 ? 3 : i === 1 ? 9 : i === 2 ? 14 : 22;
                    const active = getPhaseId(day, cycleLen, bleedDays) === (['menstrual','follicular','ovulatory','luteal'] as PhaseId[])[i];
                    return (
                      <button key={label} type="button" onClick={() => { setDay(d); setUserAdjusted(true); }}
                        style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? G : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.3s', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {isConfigured && !userAdjusted && (
                  <div style={{ fontSize: 9, color: 'rgba(212,175,55,0.6)', textAlign: 'center', marginTop: 4 }}>
                    ✦ Live — Day {liveCycleDay} of your personal cycle
                  </div>
                )}
                {userAdjusted && (
                  <button type="button" onClick={() => { setUserAdjusted(false); setDay(Math.min(Math.max(liveCycleDay || 14, 1), cycleLen)); }}
                    style={{ display: 'block', margin: '4px auto 0', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ↩ Back to live day {liveCycleDay}
                  </button>
                )}
              </div>
            </div>

            {/* 2. PHASE TAGLINE BANNER */}
            <div style={{ padding: '14px 20px', borderRadius: 20, marginBottom: 16, background: `linear-gradient(135deg,${phase.color}12,${phase.color}04)`, border: `1px solid ${phase.color}33`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: phase.color, fontWeight: 700, lineHeight: 1.6 }}>{phase.tagline}</div>
            </div>

            {/* 3. SECTION TABS */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {SECTIONS.map(sec => (
                <button key={sec.id} type="button" onClick={() => setActiveSection(sec.id)}
                  style={{ flex: 1, minWidth: 60, padding: '10px 6px', border: activeSection === sec.id ? `1px solid rgba(212,175,55,0.5)` : `1px solid ${BORDER}`, borderRadius: 40, background: activeSection === sec.id ? 'rgba(212,175,55,0.1)' : 'transparent', color: activeSection === sec.id ? G : 'rgba(255,255,255,0.55)', fontFamily: 'inherit', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  {sec.label}
                </button>
              ))}
            </div>

            {/* 4. SECTION CONTENT */}
            {activeSection === 'nutrition' && (
              <div>
                <div style={KICKER as object}>Phase Foods & Supplements · {phase.name}</div>
                <NutritionSection phaseId={phaseId} />
              </div>
            )}

            {activeSection === 'movement' && (
              <div>
                <div style={KICKER as object}>Movement Protocol · {phase.name}</div>
                <MovementSection phaseId={phaseId} />
              </div>
            )}

            {activeSection === 'log' && <QuickLogPanel gold={G} />}

            {activeSection === 'forecast' && (
              <div>
                <div style={KICKER as object}>7-Day Cycle Forecast</div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.6 }}>
                  Plan your meals, workouts, and energy management for the next 7 days based on upcoming hormonal shifts.
                </p>
                <SevenDayForecast day={day} cycleLen={cycleLen} bleedDays={bleedDays} />
                {/* Upcoming phase preview */}
                <div style={{ marginTop: 20 }}>
                  {Array.from({ length: 4 }, (_, i) => {
                    const futureDay = ((day - 1 + (i + 1) * 3) % cycleLen) + 1;
                    const fPhaseId = getPhaseId(futureDay, cycleLen, bleedDays);
                    const fPhase = PHASES[fPhaseId];
                    if (fPhaseId === phaseId) return null;
                    return (
                      <div key={i} style={{ padding: '14px 18px', borderRadius: 20, marginBottom: 8, background: `${fPhase.color}08`, border: `1px solid ${fPhase.color}22` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: fPhase.color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                          Upcoming: {fPhase.name} · {fPhase.days}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>{fPhase.tagline}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                          Key foods: {fPhase.foods.slice(0, 3).map(f => f.name).join(' · ')}
                        </div>
                      </div>
                    );
                  }).filter(Boolean).slice(0, 2)}
                </div>
              </div>
            )}

            {activeSection === 'jyotish' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Nakshatra */}
                {jyotish?.nakshatra && (
                  <div style={S({ background: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.2)' }) as object}>
                    <div style={{ ...KICKER, color: '#A78BFA' }}>☽ Birth Nakshatra</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{jyotish.nakshatra}</div>
                    {jyotish.mahadasha && (
                      <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 700, marginBottom: 10 }}>Mahadasha: {jyotish.mahadasha}</div>
                    )}
                  </div>
                )}
                {/* Dosha */}
                {(jyotish?.primaryDosha || doshaProfile?.primary) && (
                  <div style={S({ background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.2)' }) as object}>
                    <div style={{ ...KICKER, color: '#34D399' }}>⟁ Ayurvedic Constitution</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{jyotish?.primaryDosha || doshaProfile?.primary} Prakriti</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                      Your Dosha shapes which cycle phases feel most natural and which require additional support.
                    </div>
                  </div>
                )}
                {/* No birth data prompt */}
                {!jyotish?.nakshatra && !doshaProfile?.primary && (
                  <div style={S() as object}>
                    <div style={KICKER as object}>☽ Jyotish & Ayurveda</div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                      Add your birth date in your Profile to unlock Nakshatra wisdom, Mahadasha timing, and personalised Ayurvedic recommendations for your cycle.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── MENOPAUSE / PERIMENOPAUSE VIEW ── Only shown if life stage matches ── */}
        {(isPeri || isMeno) && (
          <div style={{ marginTop: isCycling ? 32 : 0 }}>
            {isCycling && <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.3),transparent)', margin: '0 0 24px' }} />}
            <MenoView lifeStage={userProfile.lifeStage} />
          </div>
        )}

        {/* ── Profile summary (bottom reference) ── */}
        <div style={{ marginTop: 32, padding: '16px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: G, fontWeight: 800 }}>QI Profile</span>
            {userProfile.age ? ` · Age ${userProfile.age}` : ''}
            {' · '}{userProfile.lifeStage}
            {userProfile.goal ? ` · Goal: ${userProfile.goal}` : ''}
          </div>
          <button type="button"
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setUserProfile(null); }}
            style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Re-run Questionnaire ›
          </button>
        </div>

      </div>
    </div>
  );
}
