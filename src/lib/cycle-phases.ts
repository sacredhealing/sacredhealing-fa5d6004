/**
 * Shakti Cycle Intelligence — Cycle Phase Constants
 * Extended from SovereignHormonalAlchemy.
 * Adds: secretion signals, activities, minerals, pranayama, tier data.
 */

export type CycleDosha = 'Vata' | 'Kapha' | 'Pitta';
export type CyclePhaseName = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export interface CycleActivity {
  icon: string;
  title: string;
  sub: string;
  intensity: 'none' | 'low' | 'medium' | 'high';
}

export interface CycleMineral {
  icon: string;
  mineral: string;
  food: string;
  amount: string;
  fn: string;
  bio: string;
  tags: string[];
}

export interface CyclePhaseData {
  name: CyclePhaseName;
  dosha: CycleDosha;
  label: string;
  season: string;
  seasonIcon: string;
  tagline: string;
  mantra: string;
  frequency: string;
  frequencyHz: number;
  nutrition: string;
  nutritionList: string[];
  movement: string;
  ritual: string;
  mudra: string;
  mudraInstruction: string;
  colorAccent: string;
  phaseColor: string;
  // Secretion signals that confirm this phase
  secretionSignals: string[];
  confirmText: string;
  // Activities (Prana-Flow+)
  activities: CycleActivity[];
  // Pranayama (Prana-Flow+)
  pranayama: { name: string; desc: string; icon: string };
  // Minerals & biochemistry (Siddha-Quantum+)
  minerals: CycleMineral[];
  // Career sync (Prana-Flow+)
  careerSync: string;
  // Herb (Prana-Flow+)
  herb: string;
}

/** Phase 1 — Menstrual / Release */
export const MENSTRUAL_PHASE: CyclePhaseData = {
  name: 'Menstrual',
  dosha: 'Vata',
  label: 'Release',
  season: 'Vinter',
  seasonIcon: '❄️',
  tagline: 'Kroppen rensar — vila är din medicin',
  mantra: 'Om Somaye Namaha — I release into the cosmic void.',
  frequency: '396Hz (Grounding)',
  frequencyHz: 396,
  nutrition: 'Warm soups, root vegetables, iron-rich greens',
  nutritionList: [
    'Rödbetor + citron (järn + C-vitamin → syresätter blodet)',
    'Pumpafrön (zink → minskar prostaglandiner & kramper)',
    'Spenat & grönkål (folat → blodcellsproduktion)',
    'Malda linfrön (omega-3 → anti-inflammatorisk)',
  ],
  movement: 'Yin Yoga & gentle stretching',
  ritual: 'Rose water anointing & candlelight meditation',
  mudra: 'Prithvi Mudra',
  mudraInstruction:
    'Touch the tip of the ring finger to the tip of the thumb. Visualize golden roots extending from your spine into the crystalline core of Gaia.',
  colorAccent: 'rgba(147, 130, 220, 0.85)',
  phaseColor: '#5B8FBF',
  secretionSignals: ['heavy_flow', 'light_flow', 'spotting'],
  confirmText:
    'Blödning bekräftad — du är i din Vinterfas. Östrogen och progesteron är som lägst.',
  activities: [
    { icon: '🧘', title: 'Yin Yoga', sub: 'Apasana, Supta Baddha Konasana. 20–30 min. Inga inversioner.', intensity: 'low' },
    { icon: '🚶', title: 'Lugn promenad', sub: 'Grounded, max 30 min. Naturen läker.', intensity: 'low' },
    { icon: '🛋️', title: 'Aktiv vila', sub: 'Läsa, kreativt skapande, meditativ tystnad.', intensity: 'none' },
    { icon: '🚫', title: 'Undvik HIIT', sub: 'Inga tunga lyft dag 1–3. Kroppen avgiftar.', intensity: 'high' },
  ],
  pranayama: {
    name: 'Bhramari',
    desc: 'Humleandedräkt — 5–10 omgångar. Vagusnerv-aktivering som löser upp livmoderspänning och sänker kortisol.',
    icon: '🐝',
  },
  minerals: [
    {
      icon: '🫐', mineral: 'Järn + C-vitamin', food: 'Rödbetor + citron', amount: '150g = 2.7mg järn',
      fn: 'Syresätter blodet efter blodförlust',
      bio: 'Järn är centralt i hemoglobin. Kombinera alltid med C-vitamin — konverterar Fe³⁺ till absorberbar Fe²⁺. Utan C absorberas bara 2–3%; med C upp till 30%. Rödbetor innehåller även betain som stöttar leverns avgiftning.',
      tags: ['#järn', '#syresättning', '#anemi'],
    },
    {
      icon: '🌰', mineral: 'Zink', food: 'Pumpafrön', amount: '30g = 2.2mg zink',
      fn: 'Reglerar prostaglandiner → minskar kramper',
      bio: 'Zink är kofaktor för 300+ enzymer. Reglerar prostaglandiner — de inflammatoriska signalerna som orsakar livmoderkontraktioner. Tillräckligt zink → signifikant minskad mensvärk. Pumpafrön är rikaste växtbaserade källan.',
      tags: ['#zink', '#kramper', '#immunitet'],
    },
    {
      icon: '🥬', mineral: 'Folat (B9)', food: 'Spenat & mörka blad', amount: 'Stor näve = 100µg folat',
      fn: 'Blodcellsproduktion & nervfunktion',
      bio: 'Folat är avgörande för att producera nya röda blodkroppar. Kombinera med B12 (nutritionsjäst) för DNA-syntes. Undvik överhettning — folat är värmekänsligt, välj lätt ångad eller rå.',
      tags: ['#folat', '#B9', '#blodceller'],
    },
    {
      icon: '🫚', mineral: 'Omega-3 (ALA)', food: 'Malda linfrön & valnötter', amount: '1 msk malda linfrön/dag',
      fn: 'Minskar inflammatoriska prostaglandiner → minskad mensvärk',
      bio: 'Omega-3 konkurrerar med arakidonsyra om COX/LOX-enzymerna som producerar prostaglandiner. Mer omega-3 = färre PGF2α = minskad livmoderkontraktion. Effekten märks efter 2–3 cykler.',
      tags: ['#omega3', '#inflammation', '#mensvärk'],
    },
  ],
  careerSync: 'Reflektionsdag. Journaling & ensamt analysarbete. Kritisk blick är skarp — men ta inga stora beslut. Skjut upp presentationer till ovulation.',
  herb: 'Shatavari Moon Milk — återuppbygger Ojas (vitalkraft) efter blodförlust. 1 tsk + varm havremjölk + 1 tsk Ghi + 1 tsk honung (tillsätt efter avkylning).',
};

/** Phase 2 — Follicular / Nourish */
export const FOLLICULAR_PHASE: CyclePhaseData = {
  name: 'Follicular',
  dosha: 'Kapha',
  label: 'Nourish',
  season: 'Vår',
  seasonIcon: '🌱',
  tagline: 'FSH väcker äggstockarna — energin bygger',
  mantra: 'Om Shrim Namaha — I nourish the temple of creation.',
  frequency: '417Hz (Stimulating)',
  frequencyHz: 417,
  nutrition: 'Spicy, light greens & sprouted seeds',
  nutritionList: [
    'Avokado (vitamin E → skyddar växande follikel)',
    'Broccoli lätt ångad (I3C → lever metaboliserar östrogen)',
    'Kimchi & surkål (probiotika → östrobolonet i tarmen)',
    'Cashewnötter (magnesium → ATP-produktion & nervsystem)',
  ],
  movement: 'Sun Salutations & dynamic flow',
  ritual: 'Flower offering at sunrise',
  mudra: 'Hakini Mudra',
  mudraInstruction:
    'Bring all fingertips together, forming a tent shape. Direct awareness to the third eye and invite creative Shakti to rise.',
  colorAccent: 'rgba(72, 209, 148, 0.85)',
  phaseColor: '#5FAD72',
  secretionSignals: ['dry', 'sticky', 'creamy'],
  confirmText:
    'Torrt → klibbigt → krämigt sekret bekräftar Vårfasen. FSH stiger, östrogen klättrar.',
  activities: [
    { icon: '☀️', title: 'Vinyasa Flow', sub: 'Surya Namaskar 12 runder. Bygg energi gradvis.', intensity: 'medium' },
    { icon: '🏃', title: 'Jogging / Dans', sub: '30–45 min. Prova ny träningsform! Kroppen älskar variation.', intensity: 'medium' },
    { icon: '🏋️', title: 'Styrketräning', sub: 'Börja bygga styrka — östrogenet skyddar musklerna.', intensity: 'medium' },
    { icon: '🎨', title: 'Kreativ rörelse', sub: 'Klättring, simning, dans — följ nyfikenheten.', intensity: 'medium' },
  ],
  pranayama: {
    name: 'Kapalabhati',
    desc: 'Skallskimrande andedräkt — 3×30 andetag. Rensar vinterns stagnation och aktiverar solar plexus.',
    icon: '☀️',
  },
  minerals: [
    {
      icon: '🥑', mineral: 'Vitamin E', food: 'Avokado', amount: '½ avokado = 2.7mg vit E',
      fn: 'Skyddar den växande follikeln från oxidativ stress',
      bio: 'Vitamin E är en fettlöslig antioxidant som skyddar den växande follikeln. Viktigt för cervikalslemkvalitet vid ägglossning och endometriums uppbyggnad via östrogenreceptorerna.',
      tags: ['#vitaminE', '#fertilitet', '#follikel'],
    },
    {
      icon: '🥦', mineral: 'Indol-3-karbinol (I3C)', food: 'Broccoli & blomkål', amount: '100g lätt ångad = aktivt I3C',
      fn: 'Aktiverar CYP1A2-enzymet → god östrogenmetabolism',
      bio: 'I3C i korsblommiga grönsaker aktiverar CYP1A2 i levern för "god" östrogenmetabolism (2-hydroxyöstrogen). Mer 2-OH östrogen = bättre hormonbalans och lägre östrogendominansrisk. Lätt ångad — överhettning förstör I3C.',
      tags: ['#I3C', '#leverstöd', '#östrogen'],
    },
    {
      icon: '🫙', mineral: 'Probiotika', food: 'Kimchi & surkål', amount: '2 msk dagligen',
      fn: 'Östrobolonet — tarmbakteriernas hormonkontroll',
      bio: 'Östrobolonet = tarmbakterierna som kontrollerar östrogenets enterohepatiska cirkulation. Dysbiose → beta-glukuronidas återaktiverar avkonjugerat östrogen → östrogendominans. Lactobacillus i kimchi håller balansen.',
      tags: ['#probiotika', '#östrobolom', '#tarm'],
    },
    {
      icon: '💚', mineral: 'Magnesium', food: 'Cashewnötter', amount: '30g = 83mg magnesium',
      fn: 'Kofaktor för ATP-produktion — energi på cellnivå',
      bio: 'Magnesium driver ATP-syntes i mitokondrierna. I follikulärfas stiger energin och cellerna behöver mer magnesium. Stöttar även COMT-enzymet som bryter ner katekolöstrogen.',
      tags: ['#magnesium', '#ATP', '#nervsystem'],
    },
  ],
  careerSync: 'Initiera projekt, brainstorming, visionärt arbete. Din kreativitet är biokemiskt på topp — FSH höjer kognitiv flexibilitet. Nätverka, börja nå ut.',
  herb: 'Ashwagandha Moon Milk — stöttar binjurarna inför den aktiva fasen. 1 tsk + varm mandelmjölk + kardemumma + Ghi + honung.',
};

/** Phase 3 — Ovulatory / Radiate */
export const OVULATORY_PHASE: CyclePhaseData = {
  name: 'Ovulatory',
  dosha: 'Pitta',
  label: 'Radiate',
  season: 'Sommar',
  seasonIcon: '☀️',
  tagline: 'LH-spike — du är vid maximal kraft & magnetism',
  mantra: 'Om Dum Durgaye Namaha — I radiate sovereign fire.',
  frequency: '528Hz (Heart Resonance)',
  frequencyHz: 528,
  nutrition: 'Cooling coconut water & raw fruits',
  nutritionList: [
    'Quinoa (B-komplex → lever bryter ner östrogentoppen)',
    'Spenat + grönkål (klorofyll → maximal syresättning)',
    'Hallon & jordgubbar (vitamin C → skyddar follikeln)',
    'Sesamfrön (selen → sköldkörtel + hormonkoherens)',
  ],
  movement: 'Dance, ecstatic movement & expressive flow',
  ritual: 'Mirror gazing with sandalwood tika',
  mudra: 'Anahata Mudra',
  mudraInstruction:
    'Place the right palm over the heart center; left palm on top. Breathe golden-rose light into the Anahata chakra.',
  colorAccent: 'rgba(212, 175, 55, 0.92)',
  phaseColor: '#D4924A',
  secretionSignals: ['watery', 'egg_white'],
  confirmText:
    '🌟 FERTIL PEAK! Äggviteliknande sekret bekräftar LH-spike. Maximalt östrogen + testosteron.',
  activities: [
    { icon: '🔥', title: 'HIIT', sub: 'Maximal intensitet — kroppen är på topp. Ge allt!', intensity: 'high' },
    { icon: '💪', title: 'Tung styrka', sub: 'Öka vikterna. Testosteron + östrogen skyddar muskler.', intensity: 'high' },
    { icon: '🤸', title: 'Gruppass', sub: 'Spinning, CrossFit, lagspel. Social energi är höjd.', intensity: 'high' },
    { icon: '⚔️', title: 'Power Yoga', sub: 'Virabhadrasana I & II, Ustrasana. Kraft + hjärtöppning.', intensity: 'medium' },
  ],
  pranayama: {
    name: 'Sitali',
    desc: 'Svalkande andedräkt — kanaliserar peak-Pitta utan övervärmning. Rulla tungan, andas in kallt, ut genom näsan.',
    icon: '❄️',
  },
  minerals: [
    {
      icon: '🌾', mineral: 'B-komplex', food: 'Quinoa & amarant', amount: '100g = B1,B2,B3,B6,folat',
      fn: 'CYP450-enzymer bryter ner östrogentoppen vid ägglossning',
      bio: 'B6 och B2 är kritiska kofaktorer för CYP450-enzymer i levern. Utan B6 → östrogen cirkulerar längre → finnar och humörsvängningar post-ovulation. Quinoa är komplett protein + komplett B-komplex.',
      tags: ['#Bvitaminer', '#lever', '#LH'],
    },
    {
      icon: '🥬', mineral: 'Klorofyll & Järn', food: 'Spenat & grönkål', amount: 'Stor handfull = 2mg järn',
      fn: 'Maximal syresättning för peak fysisk output',
      bio: 'Klorofylls molekylstruktur är nästan identisk med hemoglobin (Mg istället för Fe i mitten). Under peak-aktivitet vid ovulation är optimal syresättning avgörande för kondition och mental klarhet.',
      tags: ['#klorofyll', '#järn', '#syresättning'],
    },
    {
      icon: '🍓', mineral: 'Vitamin C', food: 'Hallon & jordgubbar', amount: '100g = 60–80mg vit C',
      fn: 'Skyddar follikeln under LH-spike + kollagensyntes',
      bio: 'Vitamin C koncentreras i äggstockvävnaden i höga nivåer. Skyddar follikeln från fri-radikalskada under det dramatiska LH-spike-förloppet. Kofaktor för kollagensyntes — viktig för äggledartransport.',
      tags: ['#vitaminC', '#kollagen', '#äggstock'],
    },
    {
      icon: '🌿', mineral: 'Selen', food: 'Sesamfrön & brysselkål', amount: '30g sesamfrön = 8µg selen',
      fn: 'Kofaktor för thyreoperoxidas → sköldkörtelfunktion',
      bio: 'Selen driver thyreoperoxidas som producerar T3/T4. Sköldkörteln är intimt kopplad till äggstockarnas funktion. Selenbrist → störd ägglossning och kortare lutealfas.',
      tags: ['#selen', '#sköldkörtel', '#hormon'],
    },
  ],
  careerSync: '⚡ BOKA DET VIKTIGASTE MÖTET HIT. LH + östrogen + testosteron på simultant topp. Lönesamtal, pitch, presentation, förhandling — din karisma är kemiskt maximerad.',
  herb: 'Shatavari Anahata Elixir — 1.5 tsk + varm kokosmjölk + 2–3 saffranstrådar + Ghi + rosenvatten + honung. Drick vid peak.',
};

/** Phase 4 — Luteal / Transform */
export const LUTEAL_PHASE: CyclePhaseData = {
  name: 'Luteal',
  dosha: 'Pitta',
  label: 'Transform',
  season: 'Höst',
  seasonIcon: '🍂',
  tagline: 'Gulkroppen producerar progesteron — lugn inre kraft',
  mantra: 'Om Dum Durgaye Namaha — I transform fire into wisdom.',
  frequency: '741Hz (Intuition)',
  frequencyHz: 741,
  nutrition: 'Magnesium-rich cacao & warm sesame milk',
  nutritionList: [
    'Råkakao (magnesium → slappnar av livmodern, dämpar sötsug)',
    'Sötpotatis (B6 → direkt kofaktor för progesteronsyntes)',
    'Solrosfrön (B6 + selen → gulkroppens #1 näring)',
    'Kikärter (fiber + zink → eliminerar överskottsöstrogen)',
  ],
  movement: 'Moonlight walks & restorative yoga',
  ritual: 'Evening journaling under candlelight',
  mudra: 'Yoni Mudra',
  mudraInstruction:
    'Interlace the fingers with index fingers and thumbs forming a downward triangle. Rest at the womb center and invite Shakti inward.',
  colorAccent: 'rgba(212, 175, 55, 0.65)',
  phaseColor: '#B56057',
  secretionSignals: ['thick_white', 'dry', 'spotting'],
  confirmText:
    'Tjockt vitt eller torrt sekret bekräftar Höstfasen. Progesteron dominerar — kroppens naturliga Valium.',
  activities: [
    { icon: '🌿', title: 'Slow Flow Yoga', sub: 'Malasana, Paschimottanasana. Grunda Vata. Håll länge.', intensity: 'low' },
    { icon: '🎯', title: 'Pilates', sub: 'Core och stabilitet. Lågintensiv men djupt effektiv.', intensity: 'low' },
    { icon: '🌳', title: 'Naturpromenad', sub: 'Grounding. Barfota om möjligt.', intensity: 'low' },
    { icon: '⚠️', title: 'Minska dag 25–28', sub: 'Byt HIIT mot yin och promenader i sen luteal.', intensity: 'high' },
  ],
  pranayama: {
    name: 'Nadi Shodhana',
    desc: 'Växelvis näsandning — 10–15 min. Balanserar hjärnhalvorna och stabiliserar HPA-axeln biokemiskt via vagusnerven.',
    icon: '🌬️',
  },
  minerals: [
    {
      icon: '🍫', mineral: 'Magnesium', food: 'Råkakao', amount: '2 msk = 150mg magnesium',
      fn: 'Antagonist till kalcium → livmodern slappnar av',
      bio: 'Magnesium hindrar för kraftiga kalcium-drivna livmodersammandragningar. Stöttar GABA-receptorerna (samma som progesteron) → bättre sömn. Sänker kortisol direkt. Råkakao = 500mg/100g — rikaste källan.',
      tags: ['#magnesium', '#kramper', '#GABA', '#sötsug'],
    },
    {
      icon: '🍠', mineral: 'B6 & Betakaroten', food: 'Sötpotatis', amount: '½ medelstor = 0.3mg B6',
      fn: 'Direkt kofaktor för progesteronbiosyntes i gulkroppen',
      bio: 'B6 är direkt kofaktor för progesteronsyntesen. Lågt B6 → lägre progesteron → östrogendominans → PMS. Betakaroten → Vitamin A som stöttar gulkroppens funktion. Komplext kolhydrat stabiliserar blodsockret och sänker kortisol.',
      tags: ['#B6', '#progesteron', '#blodsocker'],
    },
    {
      icon: '🌻', mineral: 'B6 & Selen', food: 'Solrosfrön', amount: '1 msk dagligen dag 15–28',
      fn: 'Gulkroppens topp-näring — Alisa Vittis #1 lutealval',
      bio: 'B6 + selen + vitamin E stöttar corpus luteums kapacitet att producera progesteron under hela lutealfasen. Linolensyra reducerar inflammation. Ät 1 msk/dag på sallad, soppa eller smoothie.',
      tags: ['#B6', '#selen', '#gulkropp', '#progesteron'],
    },
    {
      icon: '🫘', mineral: 'Fiber & Zink', food: 'Kikärter', amount: '100g = 5g fiber + 1.5mg zink',
      fn: 'Binder östrogen i tarmen — förhindrar enterohepatisk recirkulation',
      bio: 'Fiber binder konjugerat östrogen och förhindrar återupptag i tarmen. Brist → östrogen återabsorberas → relativ östrogendominans trots stigande progesteron → PMS. Resistent stärkelse ger stabilt blodsocker.',
      tags: ['#fiber', '#zink', '#östrogen', '#tarm'],
    },
  ],
  careerSync: 'Detaljarbete, granskning, avsluta projekt. Stäng affärer. Sen luteal (dag 22–28): sätt gränser och dra ner sociala åtaganden — det är neurobiologi, inte svaghet.',
  herb: 'Ashwagandha + råkakao Moon Milk — skyddar progesteronet mot kortisol dag 15–28. 1 tsk Ashwagandha + ½ tsk råkakao + havremjölk + kanel + Ghi + honung.',
};

export const ALL_PHASES: CyclePhaseData[] = [
  MENSTRUAL_PHASE,
  FOLLICULAR_PHASE,
  OVULATORY_PHASE,
  LUTEAL_PHASE,
];
