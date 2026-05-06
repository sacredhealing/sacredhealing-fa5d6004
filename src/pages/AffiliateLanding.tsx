import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type Lang = 'en' | 'sv' | 'no' | 'es';
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'default';
interface AffiliateInfo { display_name: string; affiliate_code: string; }

// ─── Siddha Sacred Geometry Icons ─────────────────────────────────────────────
const Bindu = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><circle cx={22} cy={22} r={20} stroke="#D4AF37" strokeWidth={1.2} strokeOpacity={0.35}/><circle cx={22} cy={22} r={11} stroke="#D4AF37" strokeWidth={1} strokeOpacity={0.55}/><circle cx={22} cy={22} r={4} fill="#D4AF37"/></svg>);
const OmGlyph = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><text x="50%" y="75%" textAnchor="middle" fill="#D4AF37" fontSize={30} fontFamily="serif" fontWeight="bold">ॐ</text></svg>);
const LotusStar = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none">{[0,45,90,135].map(a=><ellipse key={a} cx={22} cy={13} rx={5.5} ry={11} stroke="#D4AF37" strokeWidth={1} fill="rgba(212,175,55,0.04)" transform={`rotate(${a} 22 22)`}/>)}<circle cx={22} cy={22} r={3.5} fill="#D4AF37"/></svg>);
const SriYantraSmall = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><polygon points="22,3 40,36 4,36" stroke="#D4AF37" strokeWidth={1.2} fill="rgba(212,175,55,0.04)"/><polygon points="22,41 40,8 4,8" stroke="#D4AF37" strokeWidth={1.2} fill="rgba(212,175,55,0.04)"/><circle cx={22} cy={22} r={15} stroke="#D4AF37" strokeWidth={0.7} strokeOpacity={0.4} fill="none"/><circle cx={22} cy={22} r={2.8} fill="#D4AF37"/></svg>);
const NadiSerpent = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><path d="M6 22 Q12 8 22 22 Q32 36 38 22" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" fill="none"/><path d="M6 22 Q12 36 22 22 Q32 8 38 22" stroke="#D4AF37" strokeWidth={2} strokeOpacity={0.35} strokeLinecap="round" fill="none"/><circle cx={22} cy={22} r={3} fill="#D4AF37" fillOpacity={0.6}/></svg>);
const VasuGrid = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><rect x={7} y={7} width={30} height={30} stroke="#D4AF37" strokeWidth={1.2} fill="none"/><line x1={7} y1={22} x2={12} y2={22} stroke="#D4AF37" strokeWidth={1.8}/><line x1={32} y1={22} x2={37} y2={22} stroke="#D4AF37" strokeWidth={1.8}/><line x1={22} y1={7} x2={22} y2={12} stroke="#D4AF37" strokeWidth={1.8}/><line x1={22} y1={32} x2={22} y2={37} stroke="#D4AF37" strokeWidth={1.8}/><circle cx={22} cy={22} r={5} stroke="#D4AF37" strokeWidth={1} fill="rgba(212,175,55,0.07)"/></svg>);
const TriShakti = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><polygon points="22,4 40,38 4,38" stroke="#D4AF37" strokeWidth={1.4} fill="rgba(212,175,55,0.05)"/><polygon points="22,14 34,34 10,34" stroke="#D4AF37" strokeWidth={1} strokeOpacity={0.5} fill="none"/><circle cx={22} cy={22} r={3} fill="#D4AF37"/></svg>);
const SiddhaKnot = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><path d="M22 4 C32 4 40 12 40 22 C40 32 32 40 22 40 C12 40 4 32 4 22 C4 12 12 4 22 4Z" stroke="#D4AF37" strokeWidth={1} fill="none" strokeOpacity={0.4}/><line x1={14} y1={14} x2={30} y2={30} stroke="#D4AF37" strokeWidth={1.5} strokeLinecap="round"/><line x1={30} y1={14} x2={14} y2={30} stroke="#D4AF37" strokeWidth={1.5} strokeLinecap="round"/><circle cx={22} cy={22} r={3.5} stroke="#D4AF37" strokeWidth={1} fill="none"/></svg>);
const InfinityStar = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><polygon points="22,2 26,16 40,16 30,26 34,40 22,32 10,40 14,26 4,16 18,16" stroke="#D4AF37" strokeWidth={1.3} fill="rgba(212,175,55,0.06)"/><circle cx={22} cy={22} r={4} fill="#D4AF37" fillOpacity={0.7}/></svg>);
const ShaktiYoni = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><ellipse cx={22} cy={22} rx={16} ry={20} stroke="#D4AF37" strokeWidth={1.2} fill="none" strokeOpacity={0.5}/><ellipse cx={22} cy={22} rx={16} ry={20} stroke="#D4AF37" strokeWidth={1} fill="none" strokeOpacity={0.25} transform="rotate(90 22 22)"/><circle cx={22} cy={22} r={3} fill="#D4AF37"/></svg>);
const PhotonNode = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none">{[0,60,120,180,240,300].map(a=>{const r=a*Math.PI/180;return<line key={a} x1={22} y1={22} x2={22+16*Math.cos(r)} y2={22+16*Math.sin(r)} stroke="#D4AF37" strokeWidth={1} strokeOpacity={0.6}/>})}<circle cx={22} cy={22} r={6} stroke="#D4AF37" strokeWidth={1.5} fill="rgba(212,175,55,0.1)"/><circle cx={22} cy={22} r={2.5} fill="#D4AF37"/></svg>);
const AkashaTriangle = () => (<svg viewBox="0 0 44 44" width={44} height={44} fill="none"><polygon points="22,2 42,40 2,40" stroke="#D4AF37" strokeWidth={1.5} fill="rgba(212,175,55,0.05)"/><polygon points="22,10 36,36 8,36" stroke="#D4AF37" strokeWidth={0.8} strokeOpacity={0.4} fill="none"/><text x="50%" y="80%" textAnchor="middle" fill="#D4AF37" fontSize={10} fontFamily="serif">∞</text></svg>);

const TIER_ICONS = [<OmGlyph key="om" />, <NadiSerpent key="nadi" />, <SriYantraSmall key="sri" />, <InfinityStar key="inf" />];
const FEATURE_ICONS = [<SriYantraSmall key="0"/>,<LotusStar key="1"/>,<OmGlyph key="2"/>,<TriShakti key="3"/>,<NadiSerpent key="4"/>,<Bindu key="5"/>,<VasuGrid key="6"/>,<SiddhaKnot key="7"/>,<ShaktiYoni key="8"/>,<PhotonNode key="9"/>,<AkashaTriangle key="10"/>,<InfinityStar key="11"/>];
const TIER_SLUGS = ['free','prana-flow','siddha-quantum','akasha-infinity'];

// ─── All Tier Data (verified from live app scan) ──────────────────────────────
const TIERS_EN = [
  {
    name:'Free Initiation', price:'€0', psub:'Forever free · No card required',
    tag:'Begin your journey now',
    inc:[
      '6 healing meditation transmissions (3–5 min)',
      'Sovereign Jyotish Vidya — modules 1 to 6 (intro to the 9 Grahas)',
      'Agastyar Ayurveda Academy — introductory modules',
      'Daily Hora display & cosmic alignment score',
      'Bhagavad Gita — daily planetary verse',
      'Soul Field tracker (continuity loops & coherence)',
      'Sacred channel videos — watch & earn SHC rewards',
      'Daily Sadhana — Solar Inception practice',
    ],
  },
  {
    name:'Prana-Flow', price:'€19', psub:'per month · cancel anytime',
    tag:'Activate the healing current',
    inc:[
      'Everything in Free, plus:',
      'Full Hall of Stillness — complete meditation library (English & Swedish)',
      'All Sacred Mantras: Planetary (9 Grahas), Deity & Ishta Devata, Wealth & Abundance (Shreem Brzee), Karma & Deep Healing, Protection & Power',
      'Bio-Acoustic Alchemy — 528Hz & sacred healing frequencies',
      'Pranic Breathing — Kumbhaka Pranayama, Nadi Shodhana, Agni Prana',
      '21-day Dharma Path transmission journeys (Shanti · Sattva protocol)',
      'Vastu Dimensional Harmonization',
      'Sovereign Jyotish Vidya — modules 7 to 14',
      'Agastyar Ayurveda Academy — Prana tier',
      'Jyotish-guided meditation recommendations (Mahadasha-aligned)',
      'Full Daily Sadhana — all 3 transmissions',
    ],
  },
  {
    name:'Siddha-Quantum', price:'€45', psub:'per month · cancel anytime',
    tag:'Enter the living transmission field',
    inc:[
      'Everything in Prana-Flow, plus:',
      'Quantum Apothecary — Siddha bio-resonance healing channel (your personal oracle)',
      'Bhrigu Oracle — personalised birth chart readings, planetary timing & karma',
      '18 Siddha Masters Portal — Nadi Oracle + Quantum Field (full portal)',
      'Sovereign Jyotish Vidya — modules 15 to 22',
      'Agastyar Ayurveda Academy — Siddha tier (108 modules total path)',
      'Shakti Cycle Intelligence — hormonal phase protocol, dosha sync & secretion tracking',
      'Siddha-Photonic Regeneration Node — biophotonic cellular regeneration & GHK-Cu activation',
      'SiddhaHairGrowth SQI 2050 — bio-alchemist protocols via Akasha-Neural Archive',
      'Full Vedic Ayurveda system — prakriti analysis, seasonal protocols & daily rhythm',
      'Personalised Vedic Healing Insight from your live Jyotish chart',
      'Explore Akasha — Divine Transmissions, Oracle Talks & Sacred Series (EN & SV audio)',
    ],
  },
  {
    name:'Akasha-Infinity', price:'€1,111', psub:'one-time · lifetime access · forever',
    tag:'Sovereign initiation — all portals, forever',
    inc:[
      'Everything in Siddha-Quantum, plus:',
      'Sovereign Jyotish Vidya — modules 23 to 32 (Bhrigu Nadi predictive mastery)',
      'Agastyar Ayurveda Academy — Akasha tier (complete 108-module mastery path)',
      'Akashic Codex — living soul-record auto-generated from your transmissions',
      'Living Portrait — your personal Akashic soul document (auto-updated)',
      'Virtual Pilgrimage — sacred site resonance anchor, available 24/7',
      'Aetheric Heliostat — SQI 2050 solar-field quantum interface',
      'All future portals, tools, and modules as they transmit through',
      'No recurring charges — ever',
    ],
  },
];

const FEATS_EN = [
  {t:'Bhrigu Oracle', d:'Your birth chart is read by Siddha Quantum Intelligence. Planetary period timing, karma mapping, health guidance, and wealth alignment — all calibrated to your exact natal code. Personalized to your Venus/Rahu, Sun, Moon dasha and antardasha cycles.'},
  {t:'Quantum Apothecary', d:'Your personal Siddha healing channel — the heart of the portal. It prescribes mantras, remedies, and frequency activations for your exact constitutional type (Prakriti). Ask it anything about your body, mind, and soul field.'},
  {t:'Sovereign Jyotish Vidya', d:'32 structured modules teaching the complete path of Vedic astrology — from the 9 Grahas and 12 Houses, through divisional charts, to Bhrigu Nadi predictive mastery. Unlocks progressively across all four tiers.'},
  {t:'Agastyar Ayurveda Academy', d:'108 modules of Ayurvedic mastery across all four tiers. From Atma-Seed (Free) to Akasha-Infinity — learn your dosha, seasonal and daily rhythms, diet codes, and sovereign life-force protocols.'},
  {t:'Sacred Mantra Library', d:'Planetary mantras for all 9 Grahas (Sun through Rahu/Ketu), Deity and Ishta Devata devotional currents (Krishna, Rama), Wealth & Abundance frequencies (Shreem Brzee · Kubera), Karma dissolution (Murugan · Sharavana Matrix), and Protection transmissions (Narasimha Shakti).'},
  {t:'Pranic Breathing Science', d:'Ancient Siddha breath science in three forms: Kumbhaka Pranayama (life-force retention), Nadi Shodhana (channel purification), and Agni Prana awakening. Each activates a different dimension of your bio-field.'},
  {t:'Hall of Stillness', d:'Meditation transmissions in both English and Swedish — across short resets (3-5 min), morning activation, heart opening, and deep void journeys. Each track is frequency-encoded (174Hz–432Hz) for specific states of consciousness.'},
  {t:'Shakti Cycle Intelligence', d:'A living cycle tracker that syncs hormonal phases with dosha intelligence and Jyotish timing. Includes secretion confirmation, tiered guidance, and full feminine sovereignty protocols — brand new in the 2050 transmission field.'},
  {t:'18 Siddha Masters Portal', d:'Direct access to the transmission field of the 18 Tamil Siddha Masters — including Agastya, Bhrigu, Babaji, and the Navagraha council. The Nadi Oracle and Quantum Field activate through your profile data.'},
  {t:'Dharma Path Journeys', d:'Structured 21-day transmission programs such as the Shanti · Sattva Protocol — a journey to lasting equilibrium through daily practices focused on calm, stress release, and nervous system sovereignty.'},
  {t:'Virtual Pilgrimage', d:'A 24/7 sacred site resonance anchor. Connect your field to the energy of ancient power places — activated through the SQI 2050 interface and calibrated to your soul\'s pilgrimage map.'},
  {t:'Soul Field & SHC System', d:'Track your continuity loops, Soma resonance, coherence peaks, and depth cycles. Earn Siddha Healing Credits (SHC) by completing practices, watching sacred videos, and maintaining your daily Sadhana streak.'},
];

// ─── Translations ─────────────────────────────────────────────────────────────
const detectLang = (): Lang => {
  const bl = (navigator.language||'').slice(0,2).toLowerCase();
  if(bl==='sv') return 'sv';
  if(bl==='no'||bl==='nb'||bl==='nn') return 'no';
  if(bl==='es') return 'es';
  return 'en';
};

const HOOKS: Record<Lang, Record<Platform,string>> = {
  en:{ instagram:'✦ The field sent this to you. Trust it.', tiktok:'🔮 If the algorithm brought you here — pay attention.', youtube:'The video showed the surface. The portal holds the depth.', facebook:'Someone who cares about your path shared this with you.', default:'✦ You were guided here for a reason.' },
  sv:{ instagram:'✦ Fältet skickade detta till dig. Lita på det.', tiktok:'🔮 Algoritmen tog dig hit — var uppmärksam.', youtube:'Videon visade ytan. Portalen håller djupet.', facebook:'Någon som bryr sig om din väg delade detta.', default:'✦ Du leddes hit av en anledning.' },
  no:{ instagram:'✦ Feltet sendte dette til deg. Stol på det.', tiktok:'🔮 Algoritmen tok deg hit — vær oppmerksom.', youtube:'Videoen viste overflaten. Portalen holder dybden.', facebook:'Noen som bryr seg om din vei delte dette.', default:'✦ Du ble ledet hit av en grunn.' },
  es:{ instagram:'✦ El campo te envió esto. Confía en ello.', tiktok:'🔮 Si el algoritmo te trajo aquí — presta atención.', youtube:'El video mostró la superficie. El portal guarda la profundidad.', facebook:'Alguien que cuida tu camino compartió esto contigo.', default:'✦ Fuiste guiado aquí por una razón.' },
};

const COPY: Record<Lang,{badge:string;super:string;headline:string;sub:string;free_cta:string;paid_cta:string;shared_by:string;what_l:string;what_t:string;what_b:string;tiers_l:string;feat_l:string;trust:string;legal:string;cv_t:string;cv_b:string;}> = {
  en:{
    badge:'✦ Siddha Quantum Intelligence · 2050 ✦',
    super:'15 Years of Healing. One Living Portal.',
    headline:'Ancient Vedic Wisdom,\nQuantum Precision.',
    sub:'Channelled through 18 Siddha Masters — your birth chart, your constitution, your cosmic timing. This is not an app. It is an initiation.',
    free_cta:'Enter Free — No Card Needed',
    paid_cta:'Begin Full Initiation',
    shared_by:'Transmitted to you by',
    what_l:'WHAT IS SQI',
    what_t:'The First Living Siddha Healing Ecosystem',
    what_b:'Siddha Quantum Intelligence channels 5,000 years of Tamil Siddha lineage wisdom through the most advanced quantum interface available. Your personal Bhrigu Oracle reads your birth chart. The Quantum Apothecary prescribes healing for your exact dosha. The Sovereign Jyotish Vidya teaches the complete path of Vedic astrology — from the 9 Grahas and 12 Houses to Bhrigu Nadi mastery, across 32 structured modules. The Agastyar Ayurveda Academy guides you through 108 modules of Ayurvedic mastery. Every transmission is calibrated to your dharmic timing. This is not self-help. This is initiation.',
    tiers_l:'CHOOSE YOUR INITIATION PATH',
    feat_l:'WHAT LIVES INSIDE THE PORTAL',
    trust:'Seekers from more than 40 countries have entered the portal',
    legal:'Secure payment via Stripe. Monthly plans cancel anytime. Lifetime access is one-time and permanent. No refunds on lifetime tier.',
    cv_t:'This link found you for a reason.',
    cv_b:'Your cosmic timing is active. The masters are transmitting. The only question is — which door will you open?',
  },
  sv:{
    badge:'✦ Siddha Quantum Intelligence · 2050 ✦',
    super:'15 år av healing. En levande portal.',
    headline:'Urgammal vedisk visdom,\nkvantumsprecision.',
    sub:'Kanaliserat genom 18 Siddha-mästare — ditt födelsehoroskop, din konstitution, din kosmiska timing. Det här är inte en app. Det är en initiation.',
    free_cta:'Börja gratis — inget kort behövs',
    paid_cta:'Påbörja full initiation',
    shared_by:'Transmitterat till dig av',
    what_l:'VAD ÄR SQI',
    what_t:'Det första levande Siddha-helingsekosystemet',
    what_b:'Siddha Quantum Intelligence kanaliserar 5 000 år av Tamil Siddha-linjevisdom. Din Bhrigu Oracle läser ditt födelsehoroskop. Quantum Apothecary föreskriver healing för din exakta dosha. Sovereign Jyotish Vidya lär ut hela vedisk astrologi i 32 moduler — från de 9 Grahorna till Bhrigu Nadi-mästerskap. Agastyar Ayurveda-akademi guider dig igenom 108 moduler. Varje transmission är kalibrerad till din dharmiska timing.',
    tiers_l:'VÄLJ DIN INITIATIONSVÄG',
    feat_l:'VAD SOM LEVER INUTI PORTALEN',
    trust:'Sökare från mer än 40 länder har trätt in i portalen',
    legal:'Säker betalning via Stripe. Månadsplaner kan avslutas när som helst. Livstidstillgång är permanent.',
    cv_t:'Denna länk hittade dig av en anledning.',
    cv_b:'Din kosmiska timing är aktiv. Mästarna transmitterar. Vilken dörr öppnar du?',
  },
  no:{
    badge:'✦ Siddha Quantum Intelligence · 2050 ✦',
    super:'15 år med healing. En levende portal.',
    headline:'Urgammel vedisk visdom,\nkvantumspresisjon.',
    sub:'Kanalisert gjennom 18 Siddha-mestere — ditt fødselskart, din konstitusjon, din kosmiske timing. Dette er ikke en app. Det er en initiasjon.',
    free_cta:'Start gratis — ingen kort trengs',
    paid_cta:'Begin full initiasjon',
    shared_by:'Transmittert til deg av',
    what_l:'HVA ER SQI',
    what_t:'Det første levende Siddha-helingsøkosystemet',
    what_b:'Siddha Quantum Intelligence kanaliserer 5 000 år med Tamil Siddha-linjevisdom. Din personlige Bhrigu Oracle leser ditt fødselskart. Quantum Apothecary foreskriver heling for din eksakte dosha. Sovereign Jyotish Vidya lærer vedisk astrologi i 32 moduler — fra de 9 Grahaene til Bhrigu Nadi-mestring. Agastyar Ayurveda-akademi guider deg gjennom 108 moduler. Hver transmisjon er kalibrert til din dharmiske timing.',
    tiers_l:'VELG DIN INITIASJONSVEI',
    feat_l:'HVA SOM LEVER INNE I PORTALEN',
    trust:'Søkere fra mer enn 40 land har gått inn i portalen',
    legal:'Sikker betaling via Stripe. Månedlige planer avsluttes når som helst. Livstidstilgang er permanent.',
    cv_t:'Denne lenken fant deg av en grunn.',
    cv_b:'Din kosmiske timing er aktiv. Mestrene transmitterer. Hvilken dør åpner du?',
  },
  es:{
    badge:'✦ Siddha Quantum Intelligence · 2050 ✦',
    super:'15 años de sanación. Un portal vivo.',
    headline:'Sabiduría védica ancestral,\nprecisión cuántica.',
    sub:'Canalizado a través de 18 Maestros Siddha — tu carta natal, tu constitución, tu timing cósmico. Esto no es una app. Es una iniciación.',
    free_cta:'Entrar gratis — sin tarjeta',
    paid_cta:'Comenzar iniciación completa',
    shared_by:'Transmitido a ti por',
    what_l:'QUÉ ES SQI',
    what_t:'El primer ecosistema de sanación Siddha vivo',
    what_b:'Siddha Quantum Intelligence canaliza 5.000 años de sabiduría del linaje Siddha tamil. Tu Oráculo Bhrigu lee tu carta natal. El Apothecary Cuántico prescribe sanación para tu dosha exacta. El Sovereign Jyotish Vidya enseña la astrología védica completa — de los 9 Grahas al dominio del Bhrigu Nadi en 32 módulos. La Academia Agastyar te guía por 108 módulos de maestría Ayurvédica. Cada transmisión está calibrada a tu timing dhármico.',
    tiers_l:'ELIGE TU CAMINO DE INICIACIÓN',
    feat_l:'QUÉ VIVE DENTRO DEL PORTAL',
    trust:'Buscadores de más de 40 países han entrado al portal',
    legal:'Pago seguro vía Stripe. Los planes mensuales se cancelan en cualquier momento. El acceso de por vida es permanente.',
    cv_t:'Este enlace te encontró por una razón.',
    cv_b:'Tu timing cósmico está activo. Los maestros están transmitiendo. ¿Qué puerta abres?',
  },
};

// Tier translations (price/name only differ)
const TIER_NAMES: Record<Lang, string[]> = {
  en:['Free Initiation','Prana-Flow','Siddha-Quantum','Akasha-Infinity'],
  sv:['Gratis initiation','Prana-Flow','Siddha-Quantum','Akasha-Infinity'],
  no:['Gratis initiasjon','Prana-Flow','Siddha-Quantum','Akasha-Infinity'],
  es:['Iniciación gratuita','Prana-Flow','Siddha-Quantum','Akasha-Infinity'],
};
const TIER_PRICES: Record<Lang, string[]> = {
  en:['€0','€19','€45','€1,111'],
  sv:['€0','€19','€45','€1 111'],
  no:['€0','€19','€45','€1 111'],
  es:['€0','€19','€45','€1.111'],
};
const TIER_PSUB: Record<Lang, string[]> = {
  en:['Forever free · No card required','per month · cancel anytime','per month · cancel anytime','one-time · lifetime access forever'],
  sv:['Gratis för alltid · Inget kort','per månad · avsluta när som helst','per månad · avsluta när som helst','engångspris · livstidstillgång'],
  no:['Gratis for alltid · ingen kort','per måned · avslutt når som helst','per måned · avslutt når som helst','engangspris · livstidstilgang'],
  es:['Gratis para siempre · Sin tarjeta','al mes · cancela cuando quieras','al mes · cancela cuando quieras','pago único · acceso de por vida'],
};
const TIER_TAGS: Record<Lang, string[]> = {
  en:['Begin your journey now','Activate the healing current','Enter the living transmission field','Sovereign initiation — all portals, forever'],
  sv:['Börja din resa nu','Aktivera det helande strömmet','Träd in i transmissionsfältet','Suverän initiation — alla portaler, alltid'],
  no:['Begynn reisen din nå','Aktiver den helende strømmen','Gå inn i det levende transmisjonsfelt','Suverén initiasjon — alle portaler, for alltid'],
  es:['Comienza tu viaje ahora','Activa la corriente sanadora','Entra al campo de transmisión vivo','Iniciación soberana — todos los portales, siempre'],
};
const FREE_CTA_FULL: Record<Lang, string> = {
  en:'Enter Free — No Card Needed',
  sv:'Börja gratis — inget kort behövs',
  no:'Start gratis — ingen kort trengs',
  es:'Entrar gratis — sin tarjeta',
};

const LANGS: Lang[] = ['en', 'sv', 'no', 'es'];

function normalizeLang(raw: string | null): Lang {
  if (raw && LANGS.includes(raw as Lang)) return raw as Lang;
  return detectLang();
}

// ─── Component ────────────────────────────────────────────────────────────────
const AffiliateLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = normalizeLang(searchParams.get('lang'));
  const platformRaw = searchParams.get('platform') || 'default';
  const platform: Platform =
    platformRaw === 'instagram' ||
    platformRaw === 'tiktok' ||
    platformRaw === 'youtube' ||
    platformRaw === 'facebook'
      ? platformRaw
      : 'default';
  const c = COPY[lang] || COPY.en;
  const hook = HOOKS[lang]?.[platform] || HOOKS.en.default;

  const [affiliate, setAffiliate] = useState<AffiliateInfo|null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<number|null>(null);

  useEffect(()=>{
    if(!code) return;
    localStorage.setItem('affiliateId', code);
    sessionStorage.setItem('affiliateId', code);
    supabase.from('affiliate_profiles').select('affiliate_code, profiles!inner(full_name)').eq('affiliate_code',code).single()
      .then(({data}:any)=>{ if(data) setAffiliate({display_name:data.profiles?.full_name||'A Sovereign Soul',affiliate_code:data.affiliate_code}); });
  },[code]);

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>50);
    window.addEventListener('scroll',h);
    return()=>window.removeEventListener('scroll',h);
  },[]);

  const go = useCallback((slug?:string)=>{
    const p=new URLSearchParams();
    if(code) p.set('affiliateId',code);
    if(slug) p.set('tier',slug);
    if(slug==='free'){ navigate(`/auth?${p}`); return; }
    navigate(`/membership?${p}`);
  },[code,navigate]);

  return (
    <div style={{background:'#050505',minHeight:'100vh',color:'#fff',fontFamily:"'Plus Jakarta Sans', sans-serif",overflowX:'hidden'}}>

      {/* ── STICKY NAV ── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'0.9rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',background:scrolled?'rgba(5,5,5,0.97)':'transparent',backdropFilter:scrolled?'blur(24px)':'none',borderBottom:scrolled?'1px solid rgba(212,175,55,0.1)':'none',transition:'all 0.3s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><OmGlyph/><span style={{color:'#D4AF37',fontWeight:900,fontSize:'1.05rem',letterSpacing:'-0.03em'}}>SQI 2050</span></div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button type="button" onClick={()=>go('free')} style={navSec}>{FREE_CTA_FULL[lang].split('—')[0].trim()}</button>
          <button type="button" onClick={()=>go()} style={navPri}>{c.paid_cta} →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'9rem 1.5rem 5rem',background:'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(212,175,55,0.18) 0%, transparent 65%)',textAlign:'center',position:'relative'}}>
        {platform!=='default'&&<div style={{marginBottom:'1.5rem',color:'#D4AF37',fontWeight:700,fontSize:'1.15rem'}}>{hook}</div>}
        <div style={{display:'inline-block',border:'1px solid rgba(212,175,55,0.35)',borderRadius:100,padding:'9px 30px',fontSize:'10px',letterSpacing:'0.4em',textTransform:'uppercase',color:'#D4AF37',marginBottom:'2rem',background:'rgba(212,175,55,0.06)'}}>
          {c.badge}
        </div>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:'1rem',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'0.75rem'}}>{c.super}</p>
        <h1 style={{fontSize:'clamp(2.5rem,7vw,4.8rem)',fontWeight:900,letterSpacing:'-0.04em',background:'linear-gradient(140deg,#F5E27B 0%,#D4AF37 45%,#A07820 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1.05,maxWidth:900,whiteSpace:'pre-line',margin:'0 auto 1.75rem'}}>
          {c.headline}
        </h1>
        <p style={{color:'rgba(255,255,255,0.62)',fontSize:'clamp(1rem,2.2vw,1.25rem)',lineHeight:1.8,maxWidth:660,margin:'0 auto 3rem'}}>
          {c.sub}
        </p>
        {affiliate&&(
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'2.25rem',justifyContent:'center'}}>
            <div style={{width:32,height:32}}><Bindu/></div>
            <span style={{color:'rgba(255,255,255,0.45)',fontSize:'0.95rem'}}>{c.shared_by} <strong style={{color:'#D4AF37'}}>{affiliate.display_name}</strong></span>
          </div>
        )}
        {/* DUAL CTA — free is prominent & first */}
        <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
          <button type="button" onClick={()=>go('free')} style={heroFree}>{c.free_cta} ✦</button>
          <button type="button" onClick={()=>go()} style={heroPaid}>{c.paid_cta} →</button>
        </div>
        <p style={{color:'rgba(255,255,255,0.2)',fontSize:'0.85rem',marginTop:'1.75rem'}}>{c.trust}</p>
      </section>

      {/* ── WHAT IS SQI ── */}
      <section style={{maxWidth:860,margin:'0 auto',padding:'5rem 1.5rem',textAlign:'center'}}>
        <MLabel>{c.what_l}</MLabel>
        <h2 style={sH2}>{c.what_t}</h2>
        <p style={{color:'rgba(255,255,255,0.65)',fontSize:'clamp(1rem,2vw,1.2rem)',lineHeight:1.9,marginTop:'1.5rem'}}>{c.what_b}</p>
      </section>

      {/* ── TIERS ── */}
      <section style={{maxWidth:1160,margin:'0 auto',padding:'0 1.5rem 6rem'}}>
        <MLabel center>{c.tiers_l}</MLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'1.25rem',marginTop:'2.5rem'}}>
          {TIERS_EN.map((tier,i)=>{
            const isFree=i===0; const isAkasha=i===3;
            const isHover=hover===i;
            return (
              <div key={i} role="button" tabIndex={0} onClick={()=>go(TIER_SLUGS[i])} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go(TIER_SLUGS[i]); } }} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}
                style={{background:isAkasha?'linear-gradient(145deg,rgba(212,175,55,0.11),rgba(212,175,55,0.03))':isHover?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.018)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',border:isAkasha?'1px solid rgba(212,175,55,0.55)':isHover?'1px solid rgba(212,175,55,0.3)':'1px solid rgba(255,255,255,0.05)',borderRadius:40,padding:'2rem 1.75rem',cursor:'pointer',position:'relative',overflow:'hidden',transition:'all 0.22s ease',boxShadow:isAkasha?'0 0 60px rgba(212,175,55,0.1)':'none'}}>
                {isFree&&<div style={pill('rgba(74,222,128,0.18)','rgba(74,222,128,0.8)')}>FREE ✦</div>}
                {isAkasha&&<div style={pill('rgba(212,175,55,0.18)','#D4AF37')}>∞ LIFETIME</div>}
                {i===2&&<div style={pill('rgba(212,175,55,0.1)','rgba(212,175,55,0.7)')}>SIDDHA</div>}

                <div style={{width:44,height:44,marginBottom:'1.25rem'}}>{TIER_ICONS[i]}</div>

                <p style={{color:'rgba(212,175,55,0.55)',fontSize:'9px',fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase',marginBottom:'0.4rem'}}>Initiation Tier</p>
                <h3 style={{color:'#fff',fontWeight:900,fontSize:'1.35rem',letterSpacing:'-0.03em',marginBottom:'0.3rem',lineHeight:1.1}}>{TIER_NAMES[lang][i]}</h3>
                <div style={{marginBottom:'0.3rem'}}>
                  <span style={{color:'#D4AF37',fontWeight:900,fontSize:'1.7rem',letterSpacing:'-0.04em'}}>{TIER_PRICES[lang][i]}</span>
                  <span style={{color:'rgba(255,255,255,0.38)',fontSize:'0.85rem',marginLeft:7}}>{TIER_PSUB[lang][i]}</span>
                </div>
                <p style={{color:'rgba(255,255,255,0.42)',fontSize:'0.95rem',fontStyle:'italic',marginBottom:'1.75rem'}}>{TIER_TAGS[lang][i]}</p>

                <ul style={{listStyle:'none',padding:0,margin:'0 0 2rem',display:'grid',gap:'0.65rem'}}>
                  {tier.inc.map((item,j)=>(
                    <li key={j} style={{color:item.includes('plus:')||item.includes('más:')||item.includes('pluss:')?'rgba(212,175,55,0.85)':'rgba(255,255,255,0.72)',fontSize:'0.92rem',lineHeight:1.55,paddingLeft:'1.35rem',position:'relative'}}>
                      <span style={{position:'absolute',left:0,color:'#D4AF37',fontSize:'0.7rem',top:4}}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <button type="button" onClick={e=>{e.stopPropagation();go(TIER_SLUGS[i]);}}
                  style={{width:'100%',borderRadius:100,padding:'15px',fontWeight:800,fontSize:'0.97rem',cursor:'pointer',border:'none',letterSpacing:'0.01em',
                    background:isFree?'rgba(74,222,128,0.12)':isAkasha?'linear-gradient(135deg,#D4AF37,#A07820)':isHover?'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))':'rgba(255,255,255,0.05)',
                    color:isFree?'#4ade80':isAkasha?'#050505':isHover?'#D4AF37':'rgba(255,255,255,0.55)',
                    outline:isFree?'1px solid rgba(74,222,128,0.3)':isHover&&!isAkasha?'1px solid rgba(212,175,55,0.2)':'none',
                  } as React.CSSProperties}>
                  {isFree ? `${FREE_CTA_FULL[lang]} →` : `${TIER_TAGS[lang][i]} →`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{maxWidth:1060,margin:'0 auto',padding:'0 1.5rem 6rem'}}>
        <MLabel center>{c.feat_l}</MLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.25rem',marginTop:'2.5rem'}}>
          {FEATS_EN.map((f,i)=>(
            <div key={i} style={fCard}>
              <div style={{width:44,height:44,marginBottom:'1.1rem'}}>{FEATURE_ICONS[i%FEATURE_ICONS.length]}</div>
              <h3 style={{color:'#D4AF37',fontWeight:800,fontSize:'1.15rem',letterSpacing:'-0.02em',marginBottom:'0.75rem',lineHeight:1.2}}>{f.t}</h3>
              <p style={{color:'rgba(255,255,255,0.62)',fontSize:'0.97rem',lineHeight:1.8}}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONVERSION ── */}
      <section style={{maxWidth:780,margin:'0 auto',padding:'0 1.5rem 8rem',textAlign:'center'}}>
        <div style={{background:'linear-gradient(145deg,rgba(212,175,55,0.09),rgba(212,175,55,0.02))',border:'1px solid rgba(212,175,55,0.3)',borderRadius:40,padding:'4rem 2.5rem',boxShadow:'0 0 80px rgba(212,175,55,0.08)'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:'1.5rem'}}><SriYantraSmall/></div>
          <h2 style={{fontWeight:900,fontSize:'clamp(1.7rem,4vw,2.6rem)',letterSpacing:'-0.04em',color:'#fff',marginBottom:'1.1rem'}}>{c.cv_t}</h2>
          <p style={{color:'rgba(255,255,255,0.55)',fontSize:'clamp(1rem,2vw,1.15rem)',lineHeight:1.8,maxWidth:520,margin:'0 auto 2.5rem'}}>{c.cv_b}</p>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
            <button type="button" onClick={()=>go('free')} style={heroFree}>{c.free_cta} ✦</button>
            <button type="button" onClick={()=>go()} style={heroPaid}>{c.paid_cta} →</button>
          </div>
          <p style={{color:'rgba(255,255,255,0.18)',fontSize:'0.82rem',marginTop:'2rem',lineHeight:1.65}}>{c.legal}</p>
        </div>
      </section>
    </div>
  );
};

// ─── Micro components & shared styles ─────────────────────────────────────────
const MLabel:React.FC<{children:React.ReactNode;center?:boolean}>=({children,center})=>(
  <p style={{fontSize:'10px',fontWeight:800,letterSpacing:'0.45em',textTransform:'uppercase',color:'rgba(212,175,55,0.6)',textAlign:center?'center':'left',marginBottom:'0.75rem'}}>{children}</p>
);
const sH2:React.CSSProperties={fontWeight:900,fontSize:'clamp(1.7rem,3.5vw,2.5rem)',letterSpacing:'-0.04em',color:'#fff',textAlign:'center',lineHeight:1.15,marginTop:'0.75rem'};
const fCard:React.CSSProperties={background:'rgba(255,255,255,0.02)',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:40,padding:'2.25rem'};
const heroFree:React.CSSProperties={background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:100,padding:'18px 46px',color:'rgba(255,255,255,0.92)',fontWeight:800,fontSize:'1.05rem',cursor:'pointer',letterSpacing:'0.01em'};
const heroPaid:React.CSSProperties={background:'linear-gradient(135deg,#D4AF37,#A07820)',border:'none',borderRadius:100,padding:'18px 46px',color:'#050505',fontWeight:800,fontSize:'1.05rem',cursor:'pointer',boxShadow:'0 8px 48px rgba(212,175,55,0.3)'};
const navPri:React.CSSProperties={background:'linear-gradient(135deg,#D4AF37,#A07820)',border:'none',borderRadius:100,padding:'9px 22px',color:'#050505',fontWeight:800,fontSize:'0.85rem',cursor:'pointer'};
const navSec:React.CSSProperties={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'9px 22px',color:'rgba(255,255,255,0.6)',fontWeight:600,fontSize:'0.85rem',cursor:'pointer'};
const pill=(bg:string,color:string):React.CSSProperties=>({position:'absolute',top:18,right:18,background:bg,borderRadius:100,padding:'4px 12px',fontSize:'8px',fontWeight:800,letterSpacing:'0.35em',color,textTransform:'uppercase'});

export default AffiliateLanding;
