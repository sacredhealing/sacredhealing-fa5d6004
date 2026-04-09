/**
 * SHAKTI CYCLE INTELLIGENCE
 * Route: /sovereign-hormonal-alchemy  ← already in App.tsx, no changes needed
 *
 * Design principle: ONE clear message per screen. Depth only on tap.
 * Never show everything at once. Guide, don't overwhelm.
 *
 * FREE         → Today's phase card + basic logging
 * PRANA-FLOW   → + Movement + Food + Herb cards
 * SIDDHA       → + Hormone graph + Mineral biochemistry + History
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, X, Lock } from 'lucide-react';
import { useCyclePhase } from '@/hooks/useCyclePhase';
import { useMembership } from '@/hooks/useMembership';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const GOLD   = '#D4AF37';
const BLACK  = '#050505';
const GLASS  = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const DIM    = 'rgba(255,255,255,0.5)';
const FAINT  = 'rgba(255,255,255,0.12)';

// ─── PHASE DEFINITIONS ────────────────────────────────────────────────────────
// Four phases. Each has a single headline message, then detail in layers.
const PHASES = {
  Menstrual: {
    color: '#7B9CC4',
    season: 'Winter', icon: '❄️',
    headline: 'Rest is your medicine today.',
    subline: 'Your body is releasing. Honour it.',
    dayRange: '1–5',
    energy: 1, // 1-5 expected energy

    // FREE content
    todayFocus: 'Gentle movement. Iron-rich food. Silence.',
    mantra: 'Om Somaye Namaha',
    mantraTranslation: 'I release into the cosmic void',
    mudra: 'Prithvi Mudra',
    mudraHow: 'Touch ring fingertip to thumb tip. Both hands. 10 minutes.',
    ritual: 'Light a candle. Rose water on your wrists. Let the day be soft.',

    // Secretion signals that confirm this phase
    secretionConfirms: ['heavy_flow', 'light_flow', 'spotting'],
    confirmMessage: 'Your bleed confirms this — you are in Winter phase.',

    // PRANA-FLOW content — movement
    movement: {
      main: 'Yin Yoga',
      why: 'Your body moves energy downward (Apana Vayu). Inversions and HIIT work against this. Yin works with it.',
      options: [
        { name: 'Yin Yoga', intensity: 'Gentle', good: true, note: 'Apasana, Supta Baddha Konasana — no inversions' },
        { name: 'Slow walk', intensity: 'Gentle', good: true, note: '20–30 min max. Nature if possible.' },
        { name: 'HIIT / Running', intensity: 'High', good: false, note: 'Avoid days 1–3. Your body is working hard.' },
      ],
      pranayama: 'Bhramari (Bee Breath)',
      pranayamaHow: 'Close your eyes. Hum like a bee on every exhale. 8 rounds. This vibration directly reduces cramps via the vagus nerve.',
    },

    // PRANA-FLOW content — food
    food: {
      focus: 'Iron, Zinc, Omega-3',
      why: "You're losing iron. Zinc calms cramping. Omega-3 reduces the prostaglandins that cause pain.",
      eat: [
        { item: 'Beetroot + lemon', why: 'Iron. The lemon makes it absorbable — without vitamin C, only 2–3% of plant iron reaches your blood.' },
        { item: 'Pumpkin seeds', why: 'Zinc. Regulates the prostaglandins behind cramps.' },
        { item: 'Ground flaxseed', why: 'Omega-3. Competes with the inflammatory signals causing pain.' },
        { item: 'Dark leafy greens', why: 'Folate — rebuilds red blood cells.' },
      ],
      herb: 'Shatavari Moon Milk',
      herbRecipe: '1 tsp Shatavari + 240ml oat milk + 1 tsp Ghee. Simmer 3 min. Cool. Add 1 tsp raw honey. Drink before sleep.',
      herbWhy: 'Shatavari rebuilds Ojas — the vital essence lost during menstruation.',
    },

    // SIDDHA content — hormones
    hormones: {
      summary: 'Oestrogen and progesterone are both at their lowest point. This is why you feel inward, tired, and clear-headed at the same time.',
      prog: 5, ostr: 12, fsh: 20, lh: 4, test: 21,
    },

    // SIDDHA content — minerals deep dive
    minerals: [
      { name: 'Iron (Fe)', why: 'Core of haemoglobin — the protein that carries oxygen in blood. You lose it every cycle.', source: 'Beetroot, spinach, lentils', tip: 'Always pair with vitamin C. It converts Fe³⁺ → Fe²⁺, the absorbable form. Without it: 2% absorbed. With it: up to 30%.' },
      { name: 'Zinc (Zn)', why: 'Regulates prostaglandins — the inflammatory signals that cause uterine cramping. More zinc = less pain.', source: 'Pumpkin seeds, chickpeas', tip: 'Roast pumpkin seeds lightly for best bioavailability.' },
      { name: 'Omega-3 (ALA)', why: 'Competes with arachidonic acid for COX/LOX enzymes. More omega-3 = fewer PGF2α = less cramping.', source: 'Ground flaxseed, walnuts', tip: 'Grind flaxseed fresh — whole seeds pass through undigested.' },
    ],

    career: 'Today is for solo work, reflection, and analysis. Your critical thinking is sharp — but avoid big decisions. Save presentations for ovulation.',
  },

  Follicular: {
    color: '#6AAF7A',
    season: 'Spring', icon: '🌱',
    headline: 'Your energy is building.',
    subline: 'FSH is waking your ovaries. Ride this rising wave.',
    dayRange: '6–13',
    energy: 3,

    todayFocus: 'Start something new. Move your body. Eat light.',
    mantra: 'Om Shrim Namaha',
    mantraTranslation: 'I nourish the temple of creation',
    mudra: 'Hakini Mudra',
    mudraHow: 'Bring all fingertips together, tent shape. Focus at your third eye. 10 minutes.',
    ritual: 'A flower offering at sunrise. Set one clear intention for this cycle.',

    secretionConfirms: ['dry', 'sticky', 'creamy'],
    confirmMessage: 'Dry → sticky → creamy discharge confirms you are in Spring phase.',

    movement: {
      main: 'Vinyasa or Jogging',
      why: 'Oestrogen is rising and protecting your muscles. Your body wants to move and try new things. This is the best time to start a new training habit.',
      options: [
        { name: 'Vinyasa / Sun Salutations', intensity: 'Medium', good: true, note: '12 rounds — build energy gradually' },
        { name: 'Running / Dance', intensity: 'Medium', good: true, note: '30–45 min. Try something you\'ve never tried.' },
        { name: 'Strength training', intensity: 'Medium', good: true, note: 'Start building — oestrogen protects muscle.' },
      ],
      pranayama: 'Kapalabhati (Skull-Shining Breath)',
      pranayamaHow: '3 rounds of 30 sharp exhales. Clears stagnant energy from winter. Activates solar plexus.',
    },

    food: {
      focus: 'Vitamin E, Probiotics, Magnesium',
      why: "Your follicle is growing. It needs vitamin E protection. Your liver needs probiotic support to metabolise rising oestrogen cleanly.",
      eat: [
        { item: 'Avocado', why: 'Vitamin E — protects the growing follicle from oxidative damage.' },
        { item: 'Lightly steamed broccoli', why: 'Indole-3-carbinol (I3C) activates liver enzymes that break down oestrogen correctly. Raw or overcooked loses this.' },
        { item: 'Kimchi or sauerkraut', why: 'Your gut bacteria control whether oestrogen recirculates or exits. Probiotics keep this clean.' },
        { item: 'Cashews', why: 'Magnesium — powers ATP (cellular energy) as your activity rises.' },
      ],
      herb: 'Ashwagandha Moon Milk',
      herbRecipe: '1 tsp Ashwagandha + 240ml almond milk + pinch cardamom + 1 tsp Ghee. Simmer 3 min. Cool. Add 1 tsp raw honey. Morning tonic.',
      herbWhy: 'Ashwagandha supports your adrenal glands before the most active phase of your cycle.',
    },

    hormones: {
      summary: 'FSH is rising, which stimulates follicle growth. Oestrogen climbs steadily — this is what increases your energy, verbal ability, and optimism.',
      prog: 14, ostr: 65, fsh: 35, lh: 9, test: 55,
    },

    minerals: [
      { name: 'Vitamin E', why: 'Protects the growing follicle from free-radical damage. Also improves cervical mucus quality.', source: 'Avocado, sunflower seeds', tip: 'Fat-soluble — always eat with healthy fats for absorption.' },
      { name: 'Indole-3-Carbinol (I3C)', why: 'Activates the CYP1A2 enzyme in the liver — converts oestrogen into the "good" 2-hydroxy form instead of the inflammatory 16-alpha form.', source: 'Broccoli, cauliflower, Brussels sprouts', tip: 'Light steaming only — high heat destroys I3C completely.' },
      { name: 'Probiotics', why: "Your gut's 'oestrobolome' (specific bacteria) controls whether used oestrogen leaves your body or gets reabsorbed. Dysbiosis → oestrogen recirculates → dominance.", source: 'Kimchi, sauerkraut, kefir', tip: '2 tablespoons daily is enough. Consistency matters more than quantity.' },
    ],

    career: 'Best time to start projects, brainstorm, and network. Your brain is neuroplastic right now — FSH increases cognitive flexibility. Go first.',
  },

  Ovulatory: {
    color: '#D4924A',
    season: 'Summer', icon: '☀️',
    headline: 'You are at full power.',
    subline: 'LH peak. Oestrogen peak. Testosterone peak. Use it.',
    dayRange: '14–15',
    energy: 5,

    todayFocus: 'Book the important meeting. Train hard. Be seen.',
    mantra: 'Om Dum Durgaye Namaha',
    mantraTranslation: 'I radiate sovereign fire',
    mudra: 'Anahata Mudra',
    mudraHow: 'Right palm on heart. Left palm on top. Breathe golden light into your chest. 10 minutes.',
    ritual: 'Mirror gazing. Sandalwood on your forehead. Speak one true thing out loud.',

    secretionConfirms: ['watery', 'egg_white'],
    confirmMessage: '✨ Egg-white discharge confirms your LH surge — this is your fertile peak.',

    movement: {
      main: 'HIIT, heavy lifting, group classes',
      why: 'Testosterone + oestrogen are both peaking. Your muscles recover faster and work harder right now than at any other point in your cycle.',
      options: [
        { name: 'HIIT', intensity: 'High', good: true, note: 'Max effort — your body can handle it and loves it.' },
        { name: 'Heavy strength training', intensity: 'High', good: true, note: 'Increase weights. Muscle protection is at peak.' },
        { name: 'Group classes', intensity: 'High', good: true, note: 'Social energy is highest — use it.' },
        { name: 'Power Yoga', intensity: 'Medium', good: true, note: 'Warrior poses, Camel — strength and heart opening.' },
      ],
      pranayama: 'Sitali (Cooling Breath)',
      pranayamaHow: 'Roll tongue into a tube. Inhale slowly through it, exhale through the nose. 10 rounds. Channels peak Pitta without overheating.',
    },

    food: {
      focus: 'B-vitamins, Vitamin C, Selenium',
      why: 'Your liver is working hard to break down the oestrogen peak. B-vitamins and selenium are the key tools it needs.',
      eat: [
        { item: 'Quinoa', why: 'Complete B-complex in one food. B6 and B2 are cofactors for the liver enzymes breaking down oestrogen. Without them → breakouts, mood swings post-ovulation.' },
        { item: 'Spinach + kale raw', why: 'Chlorophyll — nearly identical molecule to haemoglobin. Maximum oxygenation at peak physical output.' },
        { item: 'Berries', why: 'Vitamin C protects the follicle during the LH surge. Also cofactor for collagen in fallopian tubes.' },
        { item: 'Sesame seeds', why: 'Selenium — cofactor for thyroid peroxidase (T3/T4 production). Thyroid and ovaries are tightly linked.' },
      ],
      herb: 'Shatavari Anahata Elixir',
      herbRecipe: '1.5 tsp Shatavari + 240ml coconut milk + 2–3 saffron threads + 1 tsp Ghee + 3 drops rose water. Simmer 5 min. Cool. Add 1 tsp raw honey.',
      herbWhy: 'At ovulation, Shatavari lubricates, cools Pitta, and supports the heart chakra (Anahata) opening.',
    },

    hormones: {
      summary: 'The LH spike — 400–800% increase in 12–16 hours — ruptures the dominant follicle and releases the egg. Oestrogen + testosterone both peak. This is why you feel at your most attractive, confident, and articulate right now.',
      prog: 22, ostr: 95, fsh: 18, lh: 95, test: 88,
    },

    minerals: [
      { name: 'B-Complex (esp. B6, B2)', why: 'Cofactors for CYP450 enzymes that metabolise the oestrogen peak. Without enough B6: oestrogen lingers → post-ovulation breakouts and mood dips.', source: 'Quinoa, nutritional yeast', tip: 'Quinoa is one of the few complete sources of both protein and B-vitamins in plant form.' },
      { name: 'Vitamin C', why: 'High concentration in ovarian tissue. Protects the follicle from free-radical damage during the explosive LH surge. Also essential for collagen in fallopian tube function.', source: 'Berries, citrus, bell peppers', tip: 'Eat raw — vitamin C breaks down with heat.' },
      { name: 'Selenium (Se)', why: 'Drives thyroid peroxidase (TPO) — produces T3/T4. The thyroid and ovaries are deeply linked: selenium deficiency disrupts ovulation and shortens the luteal phase.', source: 'Sesame seeds, Brazil nuts', tip: '1–2 Brazil nuts = entire daily selenium need. Sesame seeds across meals also work.' },
    ],

    career: 'Schedule the salary negotiation, the pitch, the important presentation here. LH + oestrogen + testosterone at simultaneous peak means your charisma, verbal ability, and confidence are chemically maximised.',
  },

  Luteal: {
    color: '#B56057',
    season: 'Autumn', icon: '🍂',
    headline: 'Turn inward. Finish what you started.',
    subline: 'Progesterone rises. Your body asks for depth over breadth.',
    dayRange: '16–28',
    energy: 3,

    todayFocus: 'Detail work. Slow movement. Magnesium-rich food.',
    mantra: 'Om Dum Durgaye Namaha',
    mantraTranslation: 'I transform fire into wisdom',
    mudra: 'Yoni Mudra',
    mudraHow: 'Interlace fingers. Index fingers and thumbs form a downward triangle at your womb. 10 minutes.',
    ritual: 'Evening journaling. Candle. Ask yourself: what does this cycle want me to release?',

    secretionConfirms: ['thick_white', 'dry', 'spotting'],
    confirmMessage: 'Thick white or dry discharge confirms you are in Autumn phase.',

    movement: {
      main: 'Slow yoga, Pilates, walks',
      why: 'Progesterone is naturally calming. Fighting it with high intensity raises cortisol, which competes with progesterone for the same receptors — causing PMS. Work with the hormone, not against it.',
      options: [
        { name: 'Slow Flow Yoga', intensity: 'Gentle', good: true, note: 'Malasana, Paschimottanasana. Hold poses 2–3 min.' },
        { name: 'Pilates', intensity: 'Gentle', good: true, note: 'Core and stability. Low intensity but deep effect.' },
        { name: 'Nature walk', intensity: 'Gentle', good: true, note: 'Barefoot if possible. Grounds rising Vata energy.' },
        { name: 'HIIT (days 25–28)', intensity: 'High', good: false, note: 'Raises cortisol → competes with progesterone → PMS.' },
      ],
      pranayama: 'Nadi Shodhana (Alternate Nostril)',
      pranayamaHow: 'Right thumb closes right nostril: inhale left. Right ring finger closes left: exhale right. Reverse. 10 min daily. Directly balances the HPA axis (your stress response system) via the vagus nerve.',
    },

    food: {
      focus: 'Magnesium, B6, Fibre',
      why: 'Progesterone needs B6 to be synthesised. Magnesium activates the same calming receptors as progesterone. Fibre removes used oestrogen — if it recirculates, relative oestrogen dominance causes PMS.',
      eat: [
        { item: 'Raw cacao', why: 'Highest magnesium source — up to 500mg per 100g. Magnesium relaxes the uterine muscle and activates GABA receptors for calm. This is why you crave chocolate — your body is asking for magnesium.' },
        { item: 'Sweet potato', why: 'B6 — direct cofactor for progesterone synthesis in the corpus luteum. Low B6 = low progesterone = PMS.' },
        { item: 'Sunflower seeds', why: 'The luteal superfood (B6 + selenium + vitamin E). Supports corpus luteum function for the entire phase. 1 tbsp daily on salad or soup.' },
        { item: 'Chickpeas', why: 'Fibre that binds used oestrogen in the gut and prevents reabsorption. Without it, oestrogen recirculates → relative oestrogen dominance despite rising progesterone.' },
      ],
      herb: 'Ashwagandha + Cacao Moon Milk',
      herbRecipe: '1 tsp Ashwagandha + ½ tsp raw cacao + 240ml oat milk + pinch cinnamon + 1 tsp Ghee. Simmer 3 min. Cool. Add 1 tsp raw honey. Every evening days 15–28.',
      herbWhy: "Ashwagandha is a cortisol modulator — it lowers cortisol, which competes with progesterone. This is your progesterone shield.",
    },

    hormones: {
      summary: 'Progesterone dominates after ovulation, produced by the corpus luteum (the empty follicle shell). It is chemically similar to a natural benzodiazepine — it should make you calm and focused. When it drops relative to oestrogen: anxiety, cravings, and mood swings = PMS.',
      prog: 85, ostr: 55, fsh: 9, lh: 4, test: 40,
    },

    minerals: [
      { name: 'Magnesium (Mg)', why: 'Antagonises calcium in uterine muscle cells — preventing over-contraction. Also activates GABA receptors (same mechanism as progesterone and benzodiazepines) → calm nervous system. Raw cacao = 500mg/100g.', source: 'Raw cacao, pumpkin seeds, dark greens', tip: 'The chocolate craving before your period is your body asking for magnesium. Give it raw cacao, not milk chocolate.' },
      { name: 'Vitamin B6 (Pyridoxine)', why: 'Direct cofactor for progesterone biosynthesis in the corpus luteum. Low B6 → lower progesterone → relative oestrogen dominance → PMS. Simple equation.', source: 'Sweet potato, sunflower seeds, banana', tip: 'Sunflower seeds: 1 tbsp daily covers B6 + selenium + vitamin E in one go. Easiest luteal habit.' },
      { name: 'Dietary Fibre', why: "Binds conjugated oestrogen in the gut and prevents entero-hepatic recirculation (reabsorption). Without fibre, used oestrogen re-enters the bloodstream → relative oestrogen dominance despite rising progesterone → PMS.", source: 'Chickpeas, lentils, oats, flaxseed', tip: 'Aim for 25–30g fibre daily in luteal phase. Most people get 12–15g. Close the gap with legumes.' },
    ],

    career: 'Detailed work, reviewing, finishing projects — your analytical attention to detail is sharpest here. Days 22–28: reduce social obligations. This is neurobiology, not weakness.',
  },
} as const;

type PhaseKey = keyof typeof PHASES;

// ─── LOG OPTIONS ──────────────────────────────────────────────────────────────
const DISCHARGE = [
  { id: 'heavy_flow',  label: 'Heavy bleeding',  icon: '🔴' },
  { id: 'light_flow',  label: 'Light bleeding',  icon: '💗' },
  { id: 'spotting',    label: 'Spotting',         icon: '🩸' },
  { id: 'dry',         label: 'Dry',              icon: '○' },
  { id: 'sticky',      label: 'Sticky',           icon: '●' },
  { id: 'creamy',      label: 'Creamy',           icon: '◐' },
  { id: 'watery',      label: 'Watery',           icon: '💧' },
  { id: 'egg_white',   label: 'Egg-white',        icon: '✨' },
  { id: 'thick_white', label: 'Thick white',      icon: '○' },
];

const ENERGY_LEVELS = [
  { id: 'e1', label: 'Exhausted', icon: '🌑' },
  { id: 'e2', label: 'Low',       icon: '🌒' },
  { id: 'e3', label: 'OK',        icon: '🌓' },
  { id: 'e4', label: 'Good',      icon: '🌔' },
  { id: 'e5', label: 'Peak',      icon: '🌕' },
];

const SYMPTOMS = [
  { id: 'cramps',   label: 'Cramps' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'headache', label: 'Headache' },
  { id: 'cravings', label: 'Cravings' },
  { id: 'insomnia', label: 'Poor sleep' },
  { id: 'tender',   label: 'Breast tenderness' },
  { id: 'mood_low', label: 'Low mood' },
  { id: 'anxiety',  label: 'Anxiety' },
];

// ─── HORMONE CURVES ───────────────────────────────────────────────────────────
const HORMONE_CURVES: Record<string, number[]> = {
  prog: [5,4,3,2,1,3,6,10,12,14,16,18,20,22,20,30,50,70,85,90,88,82,75,65,50,35,20,8],
  ostr: [10,12,14,16,20,28,38,52,65,75,80,85,90,95,85,70,60,55,55,58,55,52,48,45,42,38,28,15],
  fsh:  [8,12,18,25,30,35,40,45,40,35,30,25,20,18,15,12,10,8,8,9,9,8,8,9,12,18,25,12],
  lh:   [3,3,4,4,5,6,7,8,9,10,12,14,18,95,20,8,5,4,4,4,5,5,4,4,4,4,5,3],
  test: [20,20,22,24,26,30,36,44,52,60,68,76,82,88,78,68,58,50,44,40,38,36,34,32,30,28,24,20],
};

const HORMONE_META = [
  { key: 'prog', label: 'Progesterone', color: '#A78BFA' },
  { key: 'ostr', label: 'Oestrogen',    color: '#F472B6' },
  { key: 'fsh',  label: 'FSH',          color: '#60A5FA' },
  { key: 'lh',   label: 'LH',           color: '#34D399' },
  { key: 'test', label: 'Testosterone', color: '#FBBF24' },
];

// ─── UTILS ─────────────────────────────────────────────────────────────────────
function getPhaseKey(name: string): PhaseKey {
  if (name === 'Menstrual')  return 'Menstrual';
  if (name === 'Follicular') return 'Follicular';
  if (name === 'Ovulatory')  return 'Ovulatory';
  return 'Luteal';
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

// ─── DAILY LOG HOOK ───────────────────────────────────────────────────────────
function useDailyLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = todayISO();

  const { data: allLogs = {} } = useQuery({
    queryKey: ['shakti-logs', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('shakti_cycle_logs')
        .eq('user_id', user!.id)
        .single();
      return (data as any)?.shakti_cycle_logs ?? {};
    },
    enabled: !!user?.id,
  });

  const todayLog: Record<string, any> = (allLogs as any)[today] ?? {};

  const mut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const next = {
        ...(allLogs as any),
        [today]: { ...((allLogs as any)[today] ?? {}), ...patch },
      };
      const { error } = await supabase
        .from('profiles')
        .update({ shakti_cycle_logs: next } as any)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shakti-logs', user?.id] }),
    onError: () => toast({ title: 'Could not save', variant: 'destructive' }),
  });

  function set(patch: Record<string, unknown>) { mut.mutate(patch); }
  function toggle(field: string, id: string) {
    const cur: string[] = todayLog[field] ?? [];
    set({ [field]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  }

  return { todayLog, allLogs: allLogs as Record<string, any>, set, toggle };
}

// ─── CHART ─────────────────────────────────────────────────────────────────────
// @ts-ignore - Chart.js loaded via CDN
declare const Chart: any;

function HormoneChart({ day }: { day: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<any>(null);

  useEffect(() => {
    const build = () => {
      if (!ref.current || !window.Chart) return;
      if (chart.current) chart.current.destroy();
      chart.current = new window.Chart(ref.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: Array.from({ length: 28 }, (_, i) => i + 1),
          datasets: HORMONE_META.map(h => ({
            data: HORMONE_CURVES[h.key],
            borderColor: h.color,
            borderWidth: 1.5,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: ['fsh', 'test'].includes(h.key) ? [4, 3] : [],
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 8 }, maxTicksLimit: 7 }, border: { color: 'transparent' } },
            y: { display: false, min: 0, max: 110 },
          },
        },
      });
    };
    if (window.Chart) build();
    else {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      s.onload = build;
      document.head.appendChild(s);
    }
    return () => { if (chart.current) chart.current.destroy(); };
  }, []);

  useEffect(() => {
    if (!chart.current) return;
    chart.current.data.datasets.forEach((ds: any, i: number) => {
      const r = Array(28).fill(0); r[day - 1] = 5;
      ds.pointRadius = r;
      ds.pointBackgroundColor = HORMONE_META[i].color;
      ds.pointBorderColor = '#050505';
      ds.pointBorderWidth = 2;
    });
    chart.current.update('none');
  }, [day]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 140 }}>
      <canvas ref={ref} style={{ width: '100%', height: 140 }} />
    </div>
  );
}

// ─── BOTTOM SHEET ──────────────────────────────────────────────────────────────
function Sheet({ open, onClose, children }: {
  open: boolean; onClose: () => void; children: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              width: '100%', maxWidth: 600, margin: '0 auto',
              background: '#0E0E14',
              border: `1px solid ${BORDER}`,
              borderRadius: '24px 24px 0 0',
              padding: '20px 20px 40px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            {/* Close */}
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: 16, right: 16, background: FAINT, border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── TIER LOCK ─────────────────────────────────────────────────────────────────
function Locked({ label, tier, onUpgrade }: { label: string; tier: string; onUpgrade: () => void }) {
  return (
    <div
      style={{
        border: `1px dashed rgba(255,255,255,0.15)`,
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Lock size={14} color={DIM} />
        <span style={{ fontSize: 13, color: DIM }}>{label}</span>
      </div>
      <button
        onClick={onUpgrade}
        style={{
          background: 'transparent',
          border: `1px solid rgba(212,175,55,0.4)`,
          borderRadius: 20, color: GOLD,
          fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
          padding: '6px 14px', cursor: 'pointer',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {tier} →
      </button>
    </div>
  );
}

// ─── SECTION ROW (tap to expand) ───────────────────────────────────────────────
function SectionRow({
  icon, title, subtitle, onClick, locked = false,
}: {
  icon: string; title: string; subtitle: string;
  onClick?: () => void; locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      style={{
        width: '100%', background: GLASS,
        border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: '16px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: locked ? 'default' : 'pointer',
        textAlign: 'left',
        opacity: locked ? 0.4 : 1,
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => { if (!locked) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = GLASS; }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: DIM, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
      </div>
      {!locked && <ChevronRight size={16} color={DIM} />}
      {locked && <Lock size={14} color={DIM} />}
    </button>
  );
}

// ─── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({ onSave }: { onSave: (date: string, len: number, bleed: number) => void }) {
  const [date, setDate] = useState('');
  const [len, setLen] = useState(28);
  const [bleed, setBleed] = useState(5);

  const preview = date
    ? ((Math.floor((Date.now() - new Date(date).getTime()) / 86400000) % len) + 1)
    : null;

  return (
    <div style={{
      minHeight: '100vh', background: BLACK,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'inherit',
    }}>
      <div style={{ maxWidth: 360, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌸</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 8 }}>
            Shakti Cycle Intelligence
          </h1>
          <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>
            Enter your last period start date.<br />
            The tool tracks your cycle from there — automatically, every day.
          </p>
        </div>

        {/* Date input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>
            Last period started
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={todayISO()}
            style={{
              width: '100%', background: GLASS, border: `1px solid ${BORDER}`,
              borderRadius: 12, color: '#fff', fontSize: 15,
              padding: '13px 14px', fontFamily: 'inherit',
              outline: 'none', colorScheme: 'dark',
            }}
          />
        </div>

        {/* Cycle length */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Cycle length (days)', val: len, set: setLen, min: 21, max: 40 },
            { label: 'Bleeding days', val: bleed, set: setBleed, min: 2, max: 10 },
          ].map(({ label, val, set, min, max }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>
                {label}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => set(v => Math.max(min, v - 1))}
                  style={{ background: FAINT, border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}
                >−</button>
                <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, minWidth: 30, textAlign: 'center' }}>{val}</span>
                <button
                  onClick={() => set(v => Math.min(max, v + 1))}
                  style={{ background: FAINT, border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}
                >+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        {preview !== null && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: DIM }}>Today you are on </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>day {Math.max(1, preview)}</span>
            <span style={{ fontSize: 13, color: DIM }}> of your cycle</span>
          </div>
        )}

        <button
          onClick={() => { if (date) onSave(date, len, bleed); }}
          disabled={!date}
          style={{
            width: '100%',
            background: date ? `linear-gradient(135deg, ${GOLD}, #B8941F)` : FAINT,
            border: 'none', borderRadius: 14,
            color: date ? BLACK : DIM,
            fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
            padding: 15, cursor: date ? 'pointer' : 'not-allowed',
          }}
        >
          Start tracking
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function SovereignHormonalAlchemy() {
  const nav = useNavigate();
  const { phase, cycleDay, isConfigured, settings, isLoading, updateCycleSettings, isSaving } = useCyclePhase();
  const { tier, isAdmin, adminGranted } = useMembership();
  const { todayLog, allLogs, set, toggle } = useDailyLog();

  // Admins and owner-granted users see all tiers; lifetime maps to full unlock (same as useMembership for admins).
  const fullShaktiUnlock =
    !!isAdmin ||
    !!adminGranted ||
    tier === 'lifetime';
  const isPrana =
    fullShaktiUnlock ||
    ['prana-flow', 'siddha-quantum', 'akasha-infinity'].includes(tier);
  const isSiddha =
    fullShaktiUnlock ||
    ['siddha-quantum', 'akasha-infinity'].includes(tier);

  const [showSettings, setShowSettings] = useState(false);

  // Sheet state — one sheet at a time
  const [sheet, setSheet] = useState<
    | 'log' | 'movement' | 'food' | 'hormones' | 'minerals' | 'mudra' | 'history' | null
  >(null);

  const pk = getPhaseKey(phase.name);
  const pd = PHASES[pk];

  const cycleLen  = settings?.cycleLength ?? 28;
  const daysLeft  = cycleLen - cycleDay + 1;

  // Secretion confirmation
  const todayDischarge: string[] = todayLog?.discharge ?? [];
  const phaseConfirmed = todayDischarge.some((d: string) => pd.secretionConfirms.includes(d as never));

  function handleSetup(date: string, len: number, bleed: number) {
    updateCycleSettings(date, len, bleed);
  }

  // Show setup if not configured
  if (!isLoading && !isConfigured) {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <SetupScreen onSave={handleSetup} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ background: BLACK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Energy bar helper
  const energyPct = (() => {
    const e = todayLog?.energy;
    const map: Record<string, number> = { e1: 20, e2: 40, e3: 60, e4: 80, e5: 100 };
    return e ? map[e] : 0;
  })();

  return (
    <div style={{
      background: BLACK, minHeight: '100vh',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#fff', paddingBottom: 80,
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: DIM, marginBottom: 2 }}>
            Shakti Cycle Intelligence
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', lineHeight: 1 }}>Day {cycleDay}</span>
            <span style={{ fontSize: 13, color: DIM }}>{pd.season} · {daysLeft}d to next period</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10, cursor: 'pointer', color: DIM }}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 18px 0' }}>

        {/* PHASE CARD — the most important thing */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, ${pd.color}20, ${pd.color}08)`,
            border: `1px solid ${pd.color}44`,
            borderRadius: 24, padding: '24px 22px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: pd.color, marginBottom: 8 }}>
                {pd.season} Phase · Days {pd.dayRange}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
                {pd.headline}
              </div>
              <div style={{ fontSize: 14, color: DIM, lineHeight: 1.5 }}>
                {pd.subline}
              </div>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${pd.color}20`,
              border: `2px solid ${pd.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              {pd.icon}
            </div>
          </div>

          {/* Phase confirmed by discharge */}
          {phaseConfirmed && (
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: `${pd.color}18`, border: `1px solid ${pd.color}33`,
              borderRadius: 10, fontSize: 12, color: '#fff', lineHeight: 1.5,
            }}>
              ✓ {pd.confirmMessage}
            </div>
          )}

          {/* Today's focus */}
          <div style={{ marginTop: 14, fontSize: 12, color: DIM, lineHeight: 1.5 }}>
            <span style={{ color: GOLD, fontWeight: 700 }}>Today: </span>{pd.todayFocus}
          </div>
        </motion.div>

        {/* QUICK LOG — discharge + energy, always visible, dead simple */}
        <div style={{
          background: GLASS, border: `1px solid ${BORDER}`,
          borderRadius: 18, padding: '18px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM, marginBottom: 14 }}>
            Today's log
          </div>

          {/* Discharge — compact pills */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: DIM, marginBottom: 8 }}>Discharge</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DISCHARGE.map(d => {
                const active = todayDischarge.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggle('discharge', d.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: `1px solid ${active ? pd.color + '88' : BORDER}`,
                      background: active ? `${pd.color}20` : 'transparent',
                      color: active ? '#fff' : DIM,
                      fontFamily: 'inherit', fontSize: 12,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {d.icon} {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy — simple slider row */}
          <div>
            <div style={{ fontSize: 12, color: DIM, marginBottom: 8 }}>Energy</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ENERGY_LEVELS.map(e => {
                const active = todayLog?.energy === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => set({ energy: active ? null : e.id })}
                    style={{
                      flex: 1, padding: '8px 4px',
                      borderRadius: 10,
                      border: `1px solid ${active ? GOLD + '66' : BORDER}`,
                      background: active ? `${GOLD}18` : 'transparent',
                      cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{e.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: active ? GOLD : DIM, letterSpacing: '0.05em' }}>{e.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Symptoms — small, secondary */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: DIM, marginBottom: 8 }}>Symptoms <span style={{ opacity: 0.5 }}>(optional)</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {SYMPTOMS.map(s => {
                const active = (todayLog?.symptoms ?? []).includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle('symptoms', s.id)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 20,
                      border: `1px solid ${active ? '#F472B688' : BORDER}`,
                      background: active ? 'rgba(244,114,182,0.12)' : 'transparent',
                      color: active ? '#F472B6' : DIM,
                      fontFamily: 'inherit', fontSize: 11,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION ROWS — tap to go deeper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Mantra + Mudra — FREE */}
          <SectionRow
            icon="🤲"
            title={`${pd.mudra} · Mantra`}
            subtitle={`${pd.mantraTranslation} · Tap for practice`}
            onClick={() => setSheet('mudra')}
          />

          {/* Movement — PRANA-FLOW */}
          {isPrana ? (
            <SectionRow
              icon="🏃"
              title={`Movement: ${pd.movement.main}`}
              subtitle={pd.movement.options.filter(o => o.good).map(o => o.name).join(', ')}
              onClick={() => setSheet('movement')}
            />
          ) : (
            <Locked label="Movement guidance" tier="Prana-Flow" onUpgrade={() => nav('/prana-flow')} />
          )}

          {/* Food — PRANA-FLOW */}
          {isPrana ? (
            <SectionRow
              icon="🌿"
              title={`Nutrition: ${pd.food.focus}`}
              subtitle={pd.food.herb}
              onClick={() => setSheet('food')}
            />
          ) : (
            <Locked label="Nutrition + Moon Milk" tier="Prana-Flow" onUpgrade={() => nav('/prana-flow')} />
          )}

          {/* Hormones — SIDDHA */}
          {isSiddha ? (
            <SectionRow
              icon="📊"
              title="Hormone profile"
              subtitle={`Progesterone ${pd.hormones.prog}% · Oestrogen ${pd.hormones.ostr}%`}
              onClick={() => setSheet('hormones')}
            />
          ) : (
            <Locked label="Hormone graph + biochemistry" tier="Siddha-Quantum" onUpgrade={() => nav('/siddha-quantum')} />
          )}

          {/* Minerals — SIDDHA */}
          {isSiddha ? (
            <SectionRow
              icon="⚗️"
              title="Mineral deep-dive"
              subtitle={pd.minerals.map(m => m.name).join(' · ')}
              onClick={() => setSheet('minerals')}
            />
          ) : (
            <Locked label="Mineral biochemistry" tier="Siddha-Quantum" onUpgrade={() => nav('/siddha-quantum')} />
          )}

          {/* Log history — SIDDHA */}
          {isSiddha ? (
            <SectionRow
              icon="📅"
              title="Cycle history"
              subtitle="Patterns across your logged days"
              onClick={() => setSheet('history')}
            />
          ) : (
            <Locked label="Cycle pattern history" tier="Siddha-Quantum" onUpgrade={() => nav('/siddha-quantum')} />
          )}
        </div>

        {/* Career note — always visible, small */}
        <div style={{
          marginTop: 16,
          padding: '14px 16px',
          background: GLASS, border: `1px solid ${BORDER}`,
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
            Career · Today
          </div>
          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.6 }}>{pd.career}</p>
        </div>

      </div>

      {/* ── BOTTOM SHEETS ────────────────────────────────────────────────────── */}

      {/* MUDRA + MANTRA SHEET */}
      <Sheet open={sheet === 'mudra'} onClose={() => setSheet(null)}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🤲</div>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>{pd.mudra}</h3>
        <p style={{ fontSize: 13, color: DIM, marginBottom: 20, lineHeight: 1.6 }}>{pd.mudraHow}</p>

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Mantra</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, fontStyle: 'italic' }}>{pd.mantra}</div>
          <div style={{ fontSize: 13, color: DIM }}>{pd.mantraTranslation}</div>
        </div>

        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Daily ritual</div>
          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.6 }}>{pd.ritual}</p>
        </div>
      </Sheet>

      {/* MOVEMENT SHEET */}
      <Sheet open={sheet === 'movement'} onClose={() => setSheet(null)}>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Movement</h3>
        <p style={{ fontSize: 13, color: DIM, marginBottom: 20, lineHeight: 1.6 }}>{pd.movement.why}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {pd.movement.options.map((o, i) => (
            <div key={i} style={{
              background: GLASS,
              border: `1px solid ${o.good ? pd.color + '44' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16, marginTop: 1 }}>{o.good ? '✓' : '✕'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: o.good ? '#fff' : 'rgba(239,68,68,0.8)', marginBottom: 3 }}>{o.name}</div>
                <div style={{ fontSize: 12, color: DIM, lineHeight: 1.5 }}>{o.note}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: o.good ? pd.color : 'rgba(239,68,68,0.7)', marginLeft: 'auto', flexShrink: 0 }}>{o.intensity}</div>
            </div>
          ))}
        </div>

        <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Pranayama</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{pd.movement.pranayama}</div>
          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.6 }}>{pd.movement.pranayamaHow}</p>
        </div>
      </Sheet>

      {/* FOOD SHEET */}
      <Sheet open={sheet === 'food'} onClose={() => setSheet(null)}>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Nutrition</h3>
        <p style={{ fontSize: 13, color: DIM, marginBottom: 20, lineHeight: 1.6 }}>{pd.food.why}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {pd.food.eat.map((f, i) => (
            <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{f.item}</div>
              <div style={{ fontSize: 12, color: DIM, lineHeight: 1.5 }}>{f.why}</div>
            </div>
          ))}
        </div>

        <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
            Moon Milk — {pd.food.herb}
          </div>
          <p style={{ fontSize: 13, color: DIM, lineHeight: 1.6, marginBottom: 10 }}>{pd.food.herbWhy}</p>
          <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.8, background: GLASS, padding: '10px 14px', borderRadius: 10 }}>
            {pd.food.herbRecipe}
          </div>
        </div>
      </Sheet>

      {/* HORMONES SHEET */}
      <Sheet open={sheet === 'hormones'} onClose={() => setSheet(null)}>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Hormone Profile</h3>
        <p style={{ fontSize: 13, color: DIM, marginBottom: 20, lineHeight: 1.6 }}>{pd.hormones.summary}</p>

        <HormoneChart day={cycleDay} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 16 }}>
          {HORMONE_META.map(h => (
            <div key={h.key} style={{
              padding: '4px 10px', borderRadius: 20,
              background: `${h.color}15`, color: h.color,
              border: `1px solid ${h.color}33`,
              fontSize: 11, fontWeight: 700,
            }}>
              {h.label} — {Math.round(HORMONE_CURVES[h.key][cycleDay - 1])}%
            </div>
          ))}
        </div>
      </Sheet>

      {/* MINERALS SHEET */}
      <Sheet open={sheet === 'minerals'} onClose={() => setSheet(null)}>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>Mineral Biochemistry</h3>
        <p style={{ fontSize: 13, color: DIM, marginBottom: 20, lineHeight: 1.6 }}>
          The specific nutrients your body needs in this phase — and exactly why.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pd.minerals.map((m, i) => (
            <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: GOLD, marginBottom: 6 }}>{m.name}</div>
              <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, marginBottom: 8 }}>{m.why}</p>
              <div style={{ fontSize: 12, color: DIM, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Sources: </span>{m.source}
              </div>
              <div style={{
                background: `${GOLD}0A`, border: `1px solid ${GOLD}22`,
                borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: DIM, lineHeight: 1.55,
              }}>
                <span style={{ color: GOLD, fontWeight: 700 }}>Tip: </span>{m.tip}
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* HISTORY SHEET */}
      <Sheet open={sheet === 'history'} onClose={() => setSheet(null)}>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 16 }}>Cycle History</h3>

        {(() => {
          const entries = Object.entries(allLogs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
          const eggWhite = entries.filter(([, v]: any) => (v.discharge ?? []).includes('egg_white')).length;
          const cramps   = entries.filter(([, v]: any) => (v.symptoms ?? []).includes('cramps')).length;

          if (entries.length === 0) {
            return <p style={{ fontSize: 14, color: DIM, textAlign: 'center', padding: '30px 0' }}>No logs yet. Start logging daily to see patterns here.</p>;
          }

          return (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Days logged', value: entries.length },
                  { label: 'Ovulation confirmed', value: eggWhite },
                  { label: 'Cramp days', value: cramps },
                  { label: 'Current day', value: cycleDay },
                ].map((s, i) => (
                  <div key={i} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: DIM, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map(([date, entry]: any) => {
                  const diff = Math.floor((new Date(date).getTime() - new Date(settings?.lastPeriodDate ?? date).getTime()) / 86400000);
                  const cd = diff >= 0 ? (diff % cycleLen) + 1 : null;
                  const energyIcon = ENERGY_LEVELS.find(e => e.id === entry.energy)?.icon ?? '';
                  return (
                    <div key={date} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{date}</span>
                          {cd && <span style={{ fontSize: 11, color: DIM, marginLeft: 8 }}>day {cd}</span>}
                        </div>
                        {energyIcon && <span style={{ fontSize: 16 }}>{energyIcon}</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(entry.discharge ?? []).map((d: string) => {
                          const o = DISCHARGE.find(x => x.id === d);
                          return o ? <span key={d} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: FAINT, color: DIM }}>{o.label}</span> : null;
                        })}
                        {(entry.symptoms ?? []).map((s: string) => {
                          const o = SYMPTOMS.find(x => x.id === s);
                          return o ? <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(244,114,182,0.1)', color: '#F472B6' }}>{o.label}</span> : null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </Sheet>

      {/* SETTINGS SHEET */}
      <Sheet open={showSettings} onClose={() => setShowSettings(false)}>
        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 16 }}>Cycle Settings</h3>
        <SetupScreen onSave={(date, len, bleed) => { handleSetup(date, len, bleed); setShowSettings(false); }} />
      </Sheet>

    </div>
  );
}
