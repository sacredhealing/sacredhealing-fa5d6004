import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Calendar, ChevronRight, Flame, Heart,
  Lock, Moon, Sparkles, Wind, Droplets, Zap,
} from 'lucide-react';
import { useCyclePhase } from '@/hooks/useCyclePhase';
import { useMembership } from '@/hooks/useMembership';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ─── TYPES ────────────────────────────────────────────────────────────────────
const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212,175,55,0.12)';
const GB = 'rgba(255,255,255,0.07)';
const W60 = 'rgba(255,255,255,0.6)';
const W40 = 'rgba(255,255,255,0.35)';
const W20 = 'rgba(255,255,255,0.1)';

// ─── SECRETION OPTIONS ────────────────────────────────────────────────────────
const SECRETION_OPTIONS = [
  { id: 'heavy_flow',  label: 'Tung blödning', icon: '🔴', desc: 'Tung röd blödning' },
  { id: 'light_flow',  label: 'Lätt blödning', icon: '💗', desc: 'Lätt röd/rosa blödning' },
  { id: 'spotting',    label: 'Spotting',       icon: '🩸', desc: 'Lätt fläckning' },
  { id: 'dry',         label: 'Torrt',          icon: '🏜️', desc: 'Torrt, inget sekret' },
  { id: 'sticky',      label: 'Klibbigt',       icon: '🍯', desc: 'Klibbigt, vitt/gult' },
  { id: 'creamy',      label: 'Krämigt',        icon: '🥛', desc: 'Krämigt, lotionliknande' },
  { id: 'watery',      label: 'Vattnigt',       icon: '💧', desc: 'Tunt, klart, glatt' },
  { id: 'egg_white',   label: 'Äggvita ✨',     icon: '✨', desc: 'Klart, stretchigt — FERTIL PEAK' },
  { id: 'thick_white', label: 'Tjockt vitt',    icon: '☁️', desc: 'Tjockt, vitt, icke-stretchigt' },
];

const ENERGY_OPTIONS = [
  { id: 'e_very_low', label: 'Mycket låg', icon: '🌑', val: 1 },
  { id: 'e_low',      label: 'Låg',        icon: '🌒', val: 2 },
  { id: 'e_medium',   label: 'Medel',      icon: '🌓', val: 3 },
  { id: 'e_high',     label: 'Hög',        icon: '🌔', val: 4 },
  { id: 'e_very_high',label: 'Mycket hög', icon: '🌕', val: 5 },
];

const MOOD_OPTIONS = [
  { id: 'm_anxious',   label: 'Ångestfylld', icon: '😰' },
  { id: 'm_sensitive', label: 'Känslig',     icon: '🥺' },
  { id: 'm_calm',      label: 'Lugn',        icon: '😌' },
  { id: 'm_creative',  label: 'Kreativ',     icon: '✨' },
  { id: 'm_confident', label: 'Stark',       icon: '💪' },
  { id: 'm_social',    label: 'Social',      icon: '🤝' },
  { id: 'm_withdrawn', label: 'Inåtvänd',    icon: '🌙' },
  { id: 'm_focused',   label: 'Fokuserad',   icon: '🎯' },
];

const SYMPTOM_OPTIONS = [
  { id: 's_cramps',   label: 'Kramper',    icon: '⚡' },
  { id: 's_bloating', label: 'Uppblåst',   icon: '🫧' },
  { id: 's_headache', label: 'Huvudvärk',  icon: '🤕' },
  { id: 's_tender',   label: 'Ömma bröst', icon: '💜' },
  { id: 's_acne',     label: 'Finnar',     icon: '🔮' },
  { id: 's_cravings', label: 'Sötsug',     icon: '🍫' },
  { id: 's_insomnia', label: 'Sömnlöshet', icon: '🌙' },
  { id: 's_libido',   label: 'Hög libido', icon: '🔥' },
];

const INTENSITY_COLOR: Record<string, string> = {
  none: '#64748b', low: '#34D399', medium: '#FBBF24', high: '#F472B6',
};
const INTENSITY_LABEL: Record<string, string> = {
  none: 'Vila', low: 'Låg', medium: 'Medel', high: 'Hög',
};

// ─── EXTENDED PHASE DATA ──────────────────────────────────────────────────────
// Parallel to the lib/cycle-phases data, with UI-focused extensions
const PHASE_EXT = {
  Menstrual: {
    secretionSignals: ['heavy_flow', 'light_flow', 'spotting'],
    confirmText: 'Blödning bekräftad — du är i din Vinterfas.',
    activities: [
      { icon: '🧘', title: 'Yin Yoga', sub: 'Apasana, Supta Baddha Konasana. Inga inversioner.', intensity: 'low' },
      { icon: '🚶', title: 'Lugn promenad', sub: 'Max 30 min. Grounded, naturen läker.', intensity: 'low' },
      { icon: '🛋️', title: 'Aktiv vila', sub: 'Läsa, kreativt, meditativ tystnad.', intensity: 'none' },
      { icon: '🚫', title: 'Undvik HIIT', sub: 'Inga tunga lyft dag 1–3. Kroppen avgiftar.', intensity: 'high' },
    ],
    pranayama: { name: 'Bhramari', desc: 'Humleandedräkt — 5–10 omgångar. Vagusnerv-aktivering löser upp livmoderspänning.', icon: '🐝' },
    nutritionList: ['Rödbetor + citron (järn + C-vitamin)', 'Pumpafrön (zink → kramper)', 'Spenat & grönkål (folat)', 'Malda linfrön (omega-3)'],
    minerals: [
      { icon: '🫐', mineral: 'Järn + C-vitamin', food: 'Rödbetor + citron', amount: '150g = 2.7mg järn', fn: 'Syresätter blodet efter blodförlust', tags: ['#järn', '#syresättning'], bio: 'Järn är centralt i hemoglobin. Kombinera med C-vitamin — konverterar Fe³⁺ till absorberbar Fe²⁺. Utan C absorberas 2–3%; med C upp till 30%. Rödbetor innehåller betain som stöttar leverns avgiftning.' },
      { icon: '🌰', mineral: 'Zink', food: 'Pumpafrön', amount: '30g = 2.2mg zink', fn: 'Reglerar prostaglandiner → minskar kramper', tags: ['#zink', '#kramper'], bio: 'Zink är kofaktor för 300+ enzymer. Reglerar prostaglandiner — de inflammatoriska signalerna som orsakar livmoderkontraktioner. Pumpafrön = rikaste växtbaserade källan.' },
      { icon: '🥬', mineral: 'Folat (B9)', food: 'Spenat', amount: 'Stor näve = 100µg folat', fn: 'Blodcellsproduktion & nervfunktion', tags: ['#folat', '#B9'], bio: 'Folat driver produktion av nya röda blodkroppar. Kombinera med B12 (nutritionsjäst) för DNA-syntes. Välj lätt ångad — folat är värmekänsligt.' },
      { icon: '🫚', mineral: 'Omega-3', food: 'Malda linfrön', amount: '1 msk/dag', fn: 'Minskar PGF2α → minskad mensvärk', tags: ['#omega3', '#inflammation'], bio: 'Omega-3 konkurrerar med arakidonsyra om COX/LOX-enzymerna. Mer omega-3 = färre inflammatoriska prostaglandiner = minskad mensvärk. Märks efter 2–3 cykler.' },
    ],
    careerSync: 'Reflektionsdag. Journaling & ensamt analysarbete. Skjut upp stora beslut och presentationer.',
    herb: 'Shatavari Moon Milk — återuppbygger Ojas efter blodförlust. Havremjölk + Ghi + honung.',
    phaseColor: '#5B8FBF',
    season: 'Vinter', seasonIcon: '❄️',
  },
  Follicular: {
    secretionSignals: ['dry', 'sticky', 'creamy'],
    confirmText: 'Torrt → klibbigt → krämigt sekret bekräftar Vårfasen. FSH stiger, östrogen klättrar.',
    activities: [
      { icon: '☀️', title: 'Vinyasa Flow', sub: 'Surya Namaskar 12 runder. Bygg energi gradvis.', intensity: 'medium' },
      { icon: '🏃', title: 'Jogging / Dans', sub: '30–45 min. Prova ny träningsform!', intensity: 'medium' },
      { icon: '🏋️', title: 'Styrketräning', sub: 'Börja bygga styrka — östrogenet skyddar musklerna.', intensity: 'medium' },
      { icon: '🎨', title: 'Kreativ rörelse', sub: 'Klättring, simning, dans — följ nyfikenheten.', intensity: 'medium' },
    ],
    pranayama: { name: 'Kapalabhati', desc: 'Skallskimrande andedräkt — 3×30 andetag. Rensar stagnation, aktiverar solar plexus.', icon: '☀️' },
    nutritionList: ['Avokado (vitamin E → follikel)', 'Broccoli ångad (I3C → lever)', 'Kimchi (probiotika → östrobolom)', 'Cashewnötter (magnesium → ATP)'],
    minerals: [
      { icon: '🥑', mineral: 'Vitamin E', food: 'Avokado', amount: '½ = 2.7mg vit E', fn: 'Skyddar follikeln från oxidativ stress', tags: ['#vitaminE', '#fertilitet'], bio: 'Vitamin E skyddar den växande follikeln. Viktig för cervikalslemkvalitet och endometriums uppbyggnad via östrogenreceptorerna.' },
      { icon: '🥦', mineral: 'Indol-3-karbinol', food: 'Broccoli & blomkål', amount: '100g lätt ångad', fn: 'CYP1A2-enzymet → god östrogenmetabolism', tags: ['#I3C', '#lever'], bio: 'I3C aktiverar CYP1A2 i levern för "god" östrogenmetabolism (2-hydroxyöstrogen). Lätt ångad — överhettning förstör I3C.' },
      { icon: '🫙', mineral: 'Probiotika', food: 'Kimchi & surkål', amount: '2 msk dagligen', fn: 'Östrobolonet — tarmbakteriernas hormonkontroll', tags: ['#probiotika', '#tarm'], bio: 'Östrobolonet = tarmbakterierna som styr östrogenets enterohepatiska cirkulation. Dysbiose → beta-glukuronidas återaktiverar östrogen → östrogendominans.' },
      { icon: '💚', mineral: 'Magnesium', food: 'Cashewnötter', amount: '30g = 83mg', fn: 'ATP-produktion på cellnivå', tags: ['#magnesium', '#ATP'], bio: 'Magnesium driver ATP-syntes i mitokondrierna. Stöttar COMT-enzymet som bryter ner katekolöstrogen. Brist ger trötthet trots stigande östrogen.' },
    ],
    careerSync: 'Initiera projekt, brainstorming, visionärt arbete. FSH höjer kognitiv flexibilitet. Nätverka och nå ut.',
    herb: 'Ashwagandha Moon Milk — stöttar binjurarna inför den aktiva fasen. Mandelmjölk + kardemumma + Ghi + honung.',
    phaseColor: '#5FAD72',
    season: 'Vår', seasonIcon: '🌱',
  },
  Ovulatory: {
    secretionSignals: ['watery', 'egg_white'],
    confirmText: '🌟 FERTIL PEAK — äggviteliknande sekret bekräftar LH-spike. Max östrogen + testosteron.',
    activities: [
      { icon: '🔥', title: 'HIIT', sub: 'Maximal intensitet — kroppen är på topp. Ge allt!', intensity: 'high' },
      { icon: '💪', title: 'Tung styrka', sub: 'Öka vikterna. Testosteron + östrogen skyddar muskler.', intensity: 'high' },
      { icon: '🤸', title: 'Gruppass', sub: 'Spinning, CrossFit, lagspel. Social energi är höjd.', intensity: 'high' },
      { icon: '⚔️', title: 'Power Yoga', sub: 'Virabhadrasana I & II, Ustrasana. Kraft + hjärtöppning.', intensity: 'medium' },
    ],
    pranayama: { name: 'Sitali', desc: 'Svalkande andedräkt — kanaliserar peak-Pitta. Rulla tungan, andas in kallt, ut genom näsan.', icon: '❄️' },
    nutritionList: ['Quinoa (B-komplex → lever)', 'Spenat + grönkål (klorofyll → syre)', 'Hallon & jordgubbar (vitamin C)', 'Sesamfrön (selen → sköldkörtel)'],
    minerals: [
      { icon: '🌾', mineral: 'B-komplex', food: 'Quinoa & amarant', amount: '100g = komplett B', fn: 'Lever bryter ner östrogentoppen', tags: ['#Bvitaminer', '#lever', '#LH'], bio: 'B6 och B2 är kofaktorer för CYP450-enzymerna. Utan B6 → östrogen cirkulerar längre → finnar post-ovulation. Quinoa = komplett protein + komplett B-komplex.' },
      { icon: '🥬', mineral: 'Klorofyll', food: 'Spenat & grönkål', amount: 'Stor handfull', fn: 'Maximal syresättning vid peak output', tags: ['#klorofyll', '#järn'], bio: 'Klorofylls molekylstruktur är nästan identisk med hemoglobin. Under peak-aktivitet vid ovulation är optimal syresättning avgörande.' },
      { icon: '🍓', mineral: 'Vitamin C', food: 'Hallon & jordgubbar', amount: '100g = 60–80mg', fn: 'Skyddar follikeln under LH-spike', tags: ['#vitaminC', '#kollagen'], bio: 'Vitamin C koncentreras i äggstockvävnaden. Skyddar follikeln från fri-radikalskada under LH-spike. Kofaktor för kollagensyntes.' },
      { icon: '🌿', mineral: 'Selen', food: 'Sesamfrön', amount: '30g = 8µg selen', fn: 'Sköldkörtelfunktion + hormonkoherens', tags: ['#selen', '#sköldkörtel'], bio: 'Selen driver thyreoperoxidas som producerar T3/T4. Sköldkörteln är intimt kopplad till äggstockarnas funktion. Selenbrist → störd ägglossning.' },
    ],
    careerSync: '⚡ BOKA DET VIKTIGASTE MÖTET HIT. LH + östrogen + testosteron på topp. Lönesamtal, pitch, presentation — din karisma är kemiskt maximerad.',
    herb: 'Shatavari Anahata Elixir — kokosmjölk + saffran + Ghi + rosenvatten + honung. Vid peak.',
    phaseColor: '#D4924A',
    season: 'Sommar', seasonIcon: '☀️',
  },
  Luteal: {
    secretionSignals: ['thick_white', 'dry', 'spotting'],
    confirmText: 'Tjockt vitt eller torrt sekret bekräftar Höstfasen. Progesteron dominerar.',
    activities: [
      { icon: '🌿', title: 'Slow Flow Yoga', sub: 'Malasana, Paschimottanasana. Grunda Vata.', intensity: 'low' },
      { icon: '🎯', title: 'Pilates', sub: 'Core och stabilitet. Lågintensiv men effektiv.', intensity: 'low' },
      { icon: '🌳', title: 'Naturpromenad', sub: 'Grounding. Barfota om möjligt.', intensity: 'low' },
      { icon: '⚠️', title: 'Minska dag 25–28', sub: 'Byt HIIT mot yin i sen luteal.', intensity: 'high' },
    ],
    pranayama: { name: 'Nadi Shodhana', desc: 'Växelvis näsandning — 10–15 min. Balanserar hjärnhalvorna och HPA-axeln via vagusnerven.', icon: '🌬️' },
    nutritionList: ['Råkakao (magnesium → kramper)', 'Sötpotatis (B6 → progesteron)', 'Solrosfrön (B6+selen → gulkroppen)', 'Kikärter (fiber → östrogen ut)'],
    minerals: [
      { icon: '🍫', mineral: 'Magnesium', food: 'Råkakao', amount: '2 msk = 150mg', fn: 'Livmodern slappnar av, sötsug minskar', tags: ['#magnesium', '#kramper', '#GABA'], bio: 'Magnesium hindrar kalcium-drivna livmodersammandragningar. Stöttar GABA-receptorerna → bättre sömn. Sänker kortisol direkt. Råkakao = upp till 500mg/100g.' },
      { icon: '🍠', mineral: 'B6 & Betakaroten', food: 'Sötpotatis', amount: '½ medelstor = 0.3mg B6', fn: 'Direkt kofaktor för progesteronsyntesen', tags: ['#B6', '#progesteron', '#blodsocker'], bio: 'B6 är direkt kofaktor för progesteronbiosyntesen i gulkroppen. Lågt B6 → lägre progesteron → östrogendominans → PMS. Betakaroten → Vitamin A stöttar gulkroppens funktion.' },
      { icon: '🌻', mineral: 'B6 & Selen', food: 'Solrosfrön', amount: '1 msk/dag dag 15–28', fn: 'Gulkroppens #1 näring — Alisa Vittis val', tags: ['#B6', '#selen', '#gulkropp'], bio: 'B6 + selen + vit E stöttar corpus luteums progesteronproduktion under hela lutealfasen. Ät 1 msk dagligen på sallad, soppa eller smoothie.' },
      { icon: '🫘', mineral: 'Fiber & Zink', food: 'Kikärter', amount: '100g = 5g fiber + 1.5mg zink', fn: 'Eliminerar överskottsöstrogen via tarmen', tags: ['#fiber', '#zink', '#östrogen'], bio: 'Fiber binder konjugerat östrogen i tarmen, förhindrar återupptag. Brist → östrogen återabsorberas → relativ östrogendominans trots stigande progesteron → PMS.' },
    ],
    careerSync: 'Detaljarbete, granskning, avsluta projekt. Stäng affärer. Dag 22–28: sätt gränser — det är neurobiologi, inte svaghet.',
    herb: 'Ashwagandha + råkakao Moon Milk — skyddar progesteronet mot kortisol dag 15–28. Havremjölk + kanel + Ghi + honung.',
    phaseColor: '#B56057',
    season: 'Höst', seasonIcon: '🍂',
  },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const glassCard = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.025)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  border: `1px solid ${GB}`,
  borderRadius: 28,
  padding: 20,
  marginBottom: 12,
  ...extra,
});
const smCard = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.02)',
  border: `1px solid ${GB}`,
  borderRadius: 20,
  padding: 14,
  ...extra,
});
const LABEL: React.CSSProperties = {
  fontSize: '7px', fontWeight: 800, letterSpacing: '0.45em',
  textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 10,
};

function chip(active: boolean, color = GOLD): React.CSSProperties {
  return {
    padding: '8px 13px', borderRadius: 40, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    background: active ? `${color}22` : W20,
    color: active ? color : W60,
    border: `1px solid ${active ? color + '55' : 'transparent'}`,
    transition: 'all 0.18s', userSelect: 'none', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  };
}

// ─── LOCK GATE ────────────────────────────────────────────────────────────────
function TierGate({ title, requiredTier, children }: {
  title: string;
  requiredTier: 'prana-flow' | 'siddha-quantum';
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const tierLabel = requiredTier === 'prana-flow' ? 'Prana-Flow' : 'Siddha-Quantum';
  const tierPath = requiredTier === 'prana-flow' ? '/membership' : '/membership';

  return (
    <div style={glassCard({ position: 'relative', overflow: 'hidden', minHeight: 160 })}>
      {/* Blurred preview */}
      <div style={{ filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      {/* Lock overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: GOLD_DIM, border: `1px solid ${GOLD}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={20} color={GOLD} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 11, color: W60, marginBottom: 14 }}>
            Tillgänglig med <span style={{ color: GOLD, fontWeight: 700 }}>{tierLabel}</span>-nivå
          </div>
          <button
            onClick={() => navigate(tierPath)}
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #B8941F)`,
              border: 'none', borderRadius: 20, color: '#050505',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 900,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '10px 20px', cursor: 'pointer',
            }}
          >
            Uppgradera → {tierLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        style={{
          background: '#0C0C14', border: `1px solid ${GB}`, borderRadius: 28,
          padding: '28px 24px', maxWidth: 440, width: '100%', maxHeight: '82vh',
          overflowY: 'auto', position: 'relative',
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14, background: W20, border: 'none',
          color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
          fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
        }}>✕</button>
        {children}
      </motion.div>
    </div>
  );
}

// ─── CONFIRM BANNER ───────────────────────────────────────────────────────────
function ConfirmBanner({ phaseName, secretions }: { phaseName: string; secretions: string[] }) {
  const ext = PHASE_EXT[phaseName as keyof typeof PHASE_EXT];
  if (!ext) return null;
  const hit = secretions.some(s => ext.secretionSignals.includes(s));
  if (!hit) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: `${ext.phaseColor}15`, border: `1px solid ${ext.phaseColor}44`,
        borderRadius: 18, padding: '12px 16px', marginBottom: 12,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 16, marginTop: 1 }}>⟁</span>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
        <strong style={{ color: ext.phaseColor }}>Fas bekräftad: </strong>{ext.confirmText}
      </p>
    </motion.div>
  );
}

// ─── DAILY LOG HOOK ───────────────────────────────────────────────────────────
function useDailyLog(date: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: log = {} } = useQuery({
    queryKey: ['shakti-log', user?.id, date],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('shakti_cycle_logs')
        .eq('user_id', user!.id)
        .single();
      const logs = (data as any)?.shakti_cycle_logs || {};
      return logs[date] || {};
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { data } = await supabase
        .from('profiles')
        .select('shakti_cycle_logs')
        .eq('user_id', user!.id)
        .single();
      const existing = (data as any)?.shakti_cycle_logs || {};
      const next = { ...existing, [date]: { ...(existing[date] || {}), ...patch } };
      const { error } = await supabase
        .from('profiles')
        .update({ shakti_cycle_logs: next } as any)
        .eq('user_id', user!.id);
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shakti-log', user?.id, date] });
    },
    onError: () => {
      toast({ title: 'Could not save log', variant: 'destructive' });
    },
  });

  const updateLog = (patch: Record<string, unknown>) => saveMutation.mutate(patch);

  const toggle = (field: string, id: string) => {
    const cur: string[] = (log as any)[field] || [];
    updateLog({ [field]: cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id] });
  };

  return { log: log as Record<string, any>, updateLog, toggle };
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SovereignHormonalAlchemy() {
  const navigate = useNavigate();
  const { phase, cycleDay, daysUntilNextPhase, isConfigured, settings, isLoading, updateCycleSettings, isSaving } = useCyclePhase();
  const { tier } = useMembership();

  const isPranaFlow = ['prana-flow', 'siddha-quantum', 'akasha-infinity'].includes(tier);
  const isSiddhaQuantum = ['siddha-quantum', 'akasha-infinity'].includes(tier);

  const [tab, setTab] = useState<'today' | 'log' | 'explore' | 'insights'>('today');
  const [modal, setModal] = useState<React.ReactNode | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [exploreDay, setExploreDay] = useState<number | null>(null);

  // Setup form
  const [formDate, setFormDate] = useState('');
  const [formCycleLen, setFormCycleLen] = useState(28);
  const [formBleedDays, setFormBleedDays] = useState(5);

  // Log
  const today = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(today);
  const [noteInput, setNoteInput] = useState('');
  const { log: todayLog, updateLog, toggle } = useDailyLog(logDate);

  const displayDay = exploreDay ?? cycleDay;
  const displayPhaseName = phase.name;
  const ext = PHASE_EXT[displayPhaseName as keyof typeof PHASE_EXT] || PHASE_EXT.Menstrual;
  const daysToNext = settings ? (settings.cycleLength ?? 28) - cycleDay + 1 : null;

  useEffect(() => {
    if (!isLoading && !isConfigured) setShowSetup(true);
  }, [isLoading, isConfigured]);
  useEffect(() => {
    if (settings) {
      if (settings.lastPeriodDate) setFormDate(settings.lastPeriodDate);
      setFormCycleLen(settings.cycleLength ?? 28);
      setFormBleedDays(settings.bleedDays ?? 5);
    }
  }, [settings]);

  const handleSaveSettings = () => {
    if (!formDate) return;
    updateCycleSettings(formDate, formCycleLen, formBleedDays);
    setShowSetup(false);
  };

  const openMineralModal = (m: any) => setModal(
    <div>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{m.icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: GOLD, letterSpacing: '-0.03em', marginBottom: 4 }}>{m.food}</div>
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: W40, marginBottom: 16 }}>{m.mineral}</div>
      <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}22`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>Funktion idag</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{m.fn}</div>
      </div>
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: W40, marginBottom: 10 }}>Biokemi</div>
      <p style={{ fontSize: 12, color: W60, lineHeight: 1.75, marginBottom: 14 }}>{m.bio}</p>
      <div>{(m.tags as string[]).map((t: string) => <span key={t} style={{ display: 'inline-block', fontSize: '9px', fontWeight: 700, padding: '2px 9px', borderRadius: 20, margin: 2, background: GOLD_DIM, color: GOLD, border: `1px solid ${GOLD}22` }}>{t}</span>)}</div>
    </div>
  );

  const TABS = [
    { id: 'today', label: '⟁ Idag' },
    { id: 'log', label: '📝 Logga' },
    { id: 'explore', label: '🔭 Utforska' },
    { id: 'insights', label: '💡 Insikter' },
  ] as const;

  return (
    <div style={{ background: '#050505', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 100 }}>

      {/* SETUP MODAL */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => isConfigured && setShowSetup(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0A0A12', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 32, padding: 32, maxWidth: 400, width: '100%' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: GOLD, border: '1px solid rgba(212,175,55,0.25)', padding: '5px 16px', borderRadius: 40, background: GOLD_DIM, display: 'inline-block', marginBottom: 14 }}>⟁ Shakti Cycle Intelligence</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>Aktivera din<br /><span style={{ color: GOLD }}>Cykelintelligens</span></h2>
                <p style={{ fontSize: 11, color: W60, lineHeight: 1.7 }}>Ange din senaste menstruation. Appen spårar sedan din cykel automatiskt — för alltid.</p>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={LABEL}>Startdatum senaste mens</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} max={today}
                  style={{ width: '100%', background: W20, border: `1px solid ${GB}`, borderRadius: 14, color: '#fff', fontSize: 14, padding: '12px 14px', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark', marginBottom: 14 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Cykellängd', val: formCycleLen, set: setFormCycleLen, min: 21, max: 40 },
                    { label: 'Blödningsdagar', val: formBleedDays, set: setFormBleedDays, min: 2, max: 10 },
                  ].map(({ label, val, set, min, max }) => (
                    <div key={label}>
                      <label style={LABEL}>{label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => set((v: number) => Math.max(min, v - 1))} style={{ background: W20, border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>−</button>
                        <span style={{ fontSize: 24, fontWeight: 900, color: GOLD, minWidth: 36, textAlign: 'center' }}>{val}</span>
                        <button onClick={() => set((v: number) => Math.min(max, v + 1))} style={{ background: W20, border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={!formDate || isSaving}
                style={{ width: '100%', background: formDate ? `linear-gradient(135deg, ${GOLD}, #B8941F)` : W20, border: 'none', borderRadius: 20, color: formDate ? '#050505' : W40, fontFamily: 'inherit', fontSize: 13, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', padding: 15, cursor: formDate ? 'pointer' : 'not-allowed' }}>
                {isSaving ? '...' : '⟁ Aktivera'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY HEADER */}
      <div style={{ background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${GB}`, padding: '14px 16px 12px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: W20, border: `1px solid ${GB}`, borderRadius: 12, color: W60, fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, padding: '7px 12px', cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>← Tillbaka</button>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${ext.phaseColor}20`, border: `2px solid ${ext.phaseColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ext.seasonIcon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 1 }}>
              <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: GOLD, lineHeight: 1 }}>{displayDay}</span>
              <span style={{ fontSize: '8px', fontWeight: 800, color: exploreDay ? '#FBBF24' : W40, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{exploreDay ? 'UTFORSKAR' : 'CYKELDAG'}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{phase.name} <span style={{ color: ext.phaseColor, fontSize: 10 }}>· {ext.season}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {daysToNext !== null && !exploreDay && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: W60 }}>{daysToNext}d</div>
                <div style={{ fontSize: '7px', fontWeight: 800, color: W40, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Till mens</div>
              </div>
            )}
            <button onClick={() => setShowSetup(true)} style={{ background: W20, border: `1px solid ${GB}`, borderRadius: 12, color: W60, fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, padding: '7px 10px', cursor: 'pointer', flexShrink: 0 }}>
              <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />Cykel
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '14px 14px 0' }}>

        {/* TIER BADGE */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { id: 'free', label: '✦ Free', active: true },
            { id: 'prana', label: '⟁ Prana-Flow', active: isPranaFlow },
            { id: 'siddha', label: '⬡ Siddha-Quantum', active: isSiddhaQuantum },
          ].map(t => (
            <span key={t.id} style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 40, background: t.active ? GOLD_DIM : 'transparent', color: t.active ? GOLD : W40, border: `1px solid ${t.active ? GOLD + '44' : GB}` }}>{t.label}</span>
          ))}
        </div>

        {/* CONFIRM BANNER */}
        {tab === 'today' && <ConfirmBanner phaseName={displayPhaseName} secretions={todayLog?.secretions || []} />}

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== 'explore') setExploreDay(null); }}
              style={{ flex: 1, padding: '10px 4px', border: `1px solid ${tab === t.id ? GOLD + '55' : GB}`, borderRadius: 40, background: tab === t.id ? GOLD_DIM : 'transparent', color: tab === t.id ? GOLD : W60, fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ TODAY ═══ */}
        {tab === 'today' && (
          <div>
            {/* Phase card — FREE */}
            <div style={smCard({ marginBottom: 12, background: `${ext.phaseColor}0E`, border: `1px solid ${ext.phaseColor}33` })}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 32 }}>{ext.seasonIcon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: ext.phaseColor, marginBottom: 4 }}>
                    {ext.season} · Dag {displayDay} · {phase.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>{phase.name}</div>
                  <div style={{ fontSize: 11, color: W60 }}>{ext.tagline || phase.mantra}</div>
                </div>
              </div>
            </div>

            {/* Mantra — FREE */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Mantra</span>
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, marginBottom: 8 }}>"{phase.mantra}"</p>
              <div style={{ fontSize: 10, color: W40 }}>{phase.frequency} · {phase.frequencyHz}Hz</div>
            </div>

            {/* Quick log — FREE */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Snabblogg idag</span>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: W40, marginBottom: 8 }}>Sekret / Blödning</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SECRETION_OPTIONS.map(o => {
                    const active = (todayLog?.secretions || []).includes(o.id);
                    return <button key={o.id} onClick={() => toggle('secretions', o.id)} style={chip(active)} type="button">{o.icon} {o.label}</button>;
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: W40, marginBottom: 8 }}>Energinivå</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ENERGY_OPTIONS.map(o => {
                    const active = todayLog?.energy === o.id;
                    return <button key={o.id} onClick={() => updateLog({ energy: active ? null : o.id })} style={chip(active)} type="button">{o.icon} {o.label}</button>;
                  })}
                </div>
              </div>
            </div>

            {/* Activities — PRANA-FLOW+ */}
            {isPranaFlow ? (
              <div style={glassCard()}>
                <span style={LABEL}>⟁ Rekommenderade aktiviteter</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10, marginBottom: 14 }}>
                  {ext.activities.map((a: any, i: number) => (
                    <div key={i} style={smCard({ background: `${INTENSITY_COLOR[a.intensity]}0C`, border: `1px solid ${INTENSITY_COLOR[a.intensity]}30` })}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 22 }}>{a.icon}</span>
                        <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: INTENSITY_COLOR[a.intensity], padding: '2px 7px', borderRadius: 10, background: `${INTENSITY_COLOR[a.intensity]}18` }}>{INTENSITY_LABEL[a.intensity]}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{a.title}</div>
                      <div style={{ fontSize: 10, color: W60, lineHeight: 1.5 }}>{a.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Pranayama */}
                <div style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}22`, borderRadius: 18, padding: '14px 16px', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{ext.pranayama.icon}</span>
                  <div>
                    <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>Pranayama · Nu</div>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 3 }}>{ext.pranayama.name}</div>
                    <div style={{ fontSize: 11, color: W60, lineHeight: 1.55 }}>{ext.pranayama.desc}</div>
                  </div>
                </div>
              </div>
            ) : (
              <TierGate title="Aktiviteter & Pranayama" requiredTier="prana-flow">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[1,2,3,4].map(i => <div key={i} style={smCard({ height: 80 })} />)}
                </div>
              </TierGate>
            )}

            {/* Nutrition + herb — PRANA-FLOW+ */}
            {isPranaFlow ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={smCard()}>
                  <span style={LABEL}>🌿 Näring idag</span>
                  {ext.nutritionList.map((n: string, i: number) => (
                    <div key={i} style={{ fontSize: 11, color: W60, marginBottom: 7, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${GOLD}44` }}>{n}</div>
                  ))}
                </div>
                <div>
                  <div style={smCard({ background: `${GOLD}0A`, border: `1px solid ${GOLD}25`, marginBottom: 10 })}>
                    <span style={LABEL}>🥛 Moon Milk</span>
                    <p style={{ fontSize: 11, color: W60, lineHeight: 1.6 }}>{ext.herb}</p>
                  </div>
                  <div style={smCard({ display: 'flex', gap: 10 })}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <div>
                      <span style={LABEL}>Career Sync</span>
                      <p style={{ fontSize: 11, color: W60, lineHeight: 1.6 }}>{ext.careerSync}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <TierGate title="Näring, Moon Milk & Career Sync" requiredTier="prana-flow">
                <div style={{ height: 120 }} />
              </TierGate>
            )}

            {/* Minerals — SIDDHA-QUANTUM+ */}
            {isSiddhaQuantum ? (
              <div style={glassCard()}>
                <span style={LABEL}>⟁ Mineraler & Biokemi — klicka för djupinfo</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {ext.minerals.map((m: any, i: number) => (
                    <div key={i} onClick={() => openMineralModal(m)}
                      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${GB}`, borderRadius: 22, padding: 16, cursor: 'pointer', transition: 'all 0.25s', position: 'relative' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.5)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = GB; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                    >
                      <span style={{ position: 'absolute', top: 12, right: 14, fontSize: 16, color: W40 }}>›</span>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{m.icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{m.mineral}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{m.food}</div>
                      <div style={{ fontSize: 10, color: W40, marginBottom: 6 }}>{m.amount}</div>
                      <p style={{ fontSize: 11, color: W60, lineHeight: 1.5 }}>{m.fn}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <TierGate title="Mineraler & Biokemi" requiredTier="siddha-quantum">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[1,2,3,4].map(i => <div key={i} style={smCard({ height: 100 })} />)}
                </div>
              </TierGate>
            )}
          </div>
        )}

        {/* ═══ LOG ═══ */}
        {tab === 'log' && (
          <div>
            {/* Date picker */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Välj datum</span>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[0,1,2,3].map(d => {
                  const dt = new Date(); dt.setDate(dt.getDate() - d);
                  const ds = dt.toISOString().split('T')[0];
                  const sel = logDate === ds;
                  return (
                    <button key={d} onClick={() => setLogDate(ds)}
                      style={{ flex: 1, padding: '10px 4px', borderRadius: 14, border: `1px solid ${sel ? GOLD + '55' : GB}`, background: sel ? GOLD_DIM : 'transparent', color: sel ? GOLD : W60, fontFamily: 'inherit', fontSize: '9px', fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}>
                      {d === 0 ? 'Idag' : d === 1 ? 'Igår' : `−${d}d`}
                    </button>
                  );
                })}
              </div>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} max={today}
                style={{ width: '100%', background: W20, border: `1px solid ${GB}`, borderRadius: 12, color: '#fff', fontSize: 13, padding: '10px 12px', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }} />
            </div>

            {/* Secretions */}
            <div style={glassCard()}>
              <span style={LABEL}>🩸 Sekret & Blödning</span>
              <p style={{ fontSize: 11, color: W40, marginBottom: 12, lineHeight: 1.55 }}>Dessa data bekräftar din faktiska cykelposition och identifierar den fertila fasen.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {SECRETION_OPTIONS.map(o => {
                  const active = (todayLog?.secretions || []).includes(o.id);
                  return <button key={o.id} onClick={() => toggle('secretions', o.id)} style={chip(active, GOLD)} type="button">{o.icon} {o.label}</button>;
                })}
              </div>
            </div>

            {/* Energy */}
            <div style={glassCard()}>
              <span style={LABEL}>🌙 Energinivå</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {ENERGY_OPTIONS.map(o => {
                  const active = todayLog?.energy === o.id;
                  return (
                    <button key={o.id} onClick={() => updateLog({ energy: active ? null : o.id })} type="button"
                      style={{ padding: '12px 6px', borderRadius: 16, border: `1px solid ${active ? GOLD + '66' : GB}`, background: active ? GOLD_DIM : 'transparent', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{o.icon}</div>
                      <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? GOLD : W40 }}>{o.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood */}
            <div style={glassCard()}>
              <span style={LABEL}>💫 Humör</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {MOOD_OPTIONS.map(o => {
                  const active = (todayLog?.moods || []).includes(o.id);
                  return <button key={o.id} onClick={() => toggle('moods', o.id)} style={chip(active, '#A78BFA')} type="button">{o.icon} {o.label}</button>;
                })}
              </div>
            </div>

            {/* Symptoms */}
            <div style={glassCard()}>
              <span style={LABEL}>⚡ Symtom</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {SYMPTOM_OPTIONS.map(o => {
                  const active = (todayLog?.symptoms || []).includes(o.id);
                  return <button key={o.id} onClick={() => toggle('symptoms', o.id)} style={chip(active, '#F472B6')} type="button">{o.icon} {o.label}</button>;
                })}
              </div>
            </div>

            {/* Note */}
            <div style={glassCard()}>
              <span style={LABEL}>📝 Anteckning</span>
              <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} onBlur={() => updateLog({ note: noteInput })}
                placeholder="Hur känns kroppen? Vad behöver du idag?"
                style={{ width: '100%', minHeight: 88, background: W20, border: `1px solid ${GB}`, borderRadius: 16, color: '#fff', fontSize: 12, padding: '12px 14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.7, colorScheme: 'dark' }} />
              <button onClick={() => updateLog({ note: noteInput })} type="button"
                style={{ marginTop: 10, background: GOLD_DIM, border: `1px solid ${GOLD}44`, borderRadius: 14, color: GOLD, fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '9px 18px', cursor: 'pointer' }}>
                ⟁ Spara
              </button>
            </div>
          </div>
        )}

        {/* ═══ EXPLORE ═══ */}
        {tab === 'explore' && (
          <div>
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Utforska valfri dag — dra för att navigera</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: GOLD, letterSpacing: '-0.04em', lineHeight: 1, minWidth: 60 }}>{exploreDay ?? cycleDay}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{phase.name}</div>
                  <div style={{ fontSize: 9, color: W40, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{ext.season}</div>
                </div>
                {exploreDay && <button onClick={() => setExploreDay(null)} style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}44`, borderRadius: 20, color: GOLD, fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, padding: '6px 12px', cursor: 'pointer' }}>← Idag</button>}
              </div>
              <input type="range" min="1" max={settings?.cycleLength ?? 28} value={exploreDay ?? cycleDay}
                onChange={e => setExploreDay(+e.target.value)}
                style={{ width: '100%', accentColor: GOLD, cursor: 'pointer', marginBottom: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {Object.entries(PHASE_EXT).map(([name, p]) => (
                  <span key={name} style={{ fontSize: '8px', fontWeight: 700, color: displayPhaseName === name ? (p as any).phaseColor : W40, cursor: 'pointer', letterSpacing: '0.1em' }}
                    onClick={() => setExploreDay(name === 'Menstrual' ? 3 : name === 'Follicular' ? 9 : name === 'Ovulatory' ? 14 : 22)}>
                    {(p as any).seasonIcon} {name === 'Menstrual' ? '1–5' : name === 'Follicular' ? '6–13' : name === 'Ovulatory' ? '14–15' : '16–28'}
                  </span>
                ))}
              </div>
            </div>

            {isPranaFlow && (
              <div style={glassCard()}>
                <span style={LABEL}>⟁ Aktiviteter dag {exploreDay ?? cycleDay}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
                  {ext.activities.map((a: any, i: number) => (
                    <div key={i} style={smCard({ background: `${INTENSITY_COLOR[a.intensity]}0C`, border: `1px solid ${INTENSITY_COLOR[a.intensity]}30` })}>
                      <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{a.icon}</span>
                      <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: INTENSITY_COLOR[a.intensity], display: 'block', marginBottom: 4 }}>{INTENSITY_LABEL[a.intensity]}</span>
                      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 3 }}>{a.title}</div>
                      <div style={{ fontSize: 10, color: W60, lineHeight: 1.5 }}>{a.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ INSIGHTS ═══ */}
        {tab === 'insights' && (
          <div>
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Cykeldashboard</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { l: 'Cykeldag', v: cycleDay },
                  { l: 'Cykellängd', v: `${settings?.cycleLength ?? 28}d` },
                  { l: 'Till mens', v: daysToNext ? `${daysToNext}d` : '—' },
                  { l: 'Fas', v: ext.seasonIcon },
                  { l: 'Dosha', v: phase.dosha },
                  { l: 'Hz', v: `${phase.frequencyHz}` },
                ].map((s, i) => (
                  <div key={i} style={smCard({ textAlign: 'center', padding: '12px 8px' })}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{s.v}</div>
                    <div style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: W40, marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {isSiddhaQuantum && (
              <div style={glassCard()}>
                <span style={LABEL}>⟁ Hormonkurvor — alla 28 dagar</span>
                <div style={{ fontSize: 11, color: W40, marginBottom: 8 }}>Dag {cycleDay} markerad</div>
                {Object.entries({ Progesteron: '#A78BFA', Östrogen: '#F472B6', FSH: '#60A5FA', LH: '#34D399', Test: '#FBBF24' }).map(([name, color]) => (
                  <div key={name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color }}>{name}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 5, background: W20, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 5, background: color, width: `${(cycleDay / (settings?.cycleLength ?? 28)) * 100}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 10, color: W40, marginTop: 8 }}>Uppgradera till full hormongrafikvy med Siddha-Quantum för detaljerade kurvor per dag.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modal && <Modal onClose={() => setModal(null)}>{modal}</Modal>}
      </AnimatePresence>
    </div>
  );
}
