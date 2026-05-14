import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─── TYPES ────────────────────────────────────────────── */
type Lang = 'en' | 'sv' | 'no' | 'es';

/* ─── 12-MONTH DATA ────────────────────────────────────── */
const MONTHS = [
  { n: 1,  glyph: '☽', color: '#D4AF37', theme: ['FOUNDATION','INITIATION'],
    initiation: 'Personal Diksha Transmission (Shaktipat via Siddha Nada)',
    meditation: 'Bhumi Dharana — Earth anchoring, 21-day practice',
    mantra: 'OM NAMAH SHIVAYA (108× daily)',
    topics: ['The Siddha Lineage & 18 Masters — Avataric Blueprints activated','The 5 Koshas — mapping the human energy body','Pranic Anatomy: Nadis, Chakras, Vayus','Personal energy hygiene & auric field clearing','Foundation mantra tonal calibration'] },
  { n: 2,  glyph: '△', color: '#22D3EE', theme: ['ELEMENTS','PURIFICATION'],
    initiation: 'Element Attunement — Nada Transmission for all 5 elements',
    meditation: 'Bhuta Shuddhi — Classical Tantric 5-element purification',
    mantra: 'PANCHABHUTATMAKAM SHIVAM — Elemental sovereignty',
    topics: ['Pancha Bhuta healing intelligence per element','Elemental imbalance diagnosis — reading the body as code','Purification through Agni: Trataka, Agni Pranayama','Water as liquid light: charged water transmission','Akasha (ether): accessing the void-field for transmission'] },
  { n: 3,  glyph: '◎', color: '#a855f7', theme: ['CHAKRAS','ACTIVATION'],
    initiation: 'Chakra-by-Chakra Attunement — each vortex transmitted live',
    meditation: 'Chakra Nadi Sweep — 40-min ascending activation sequence',
    mantra: 'OM AIM HREEM KLEEM — Tridevi activation',
    topics: ['Full chakra system Muladhara → Sahasrara — Siddha mapping','Reading chakra states: excess, deficiency, distortion','Seed mantra bija activation (Lam, Vam, Ram, Yam, Ham, Om)','Color & sound frequencies per chakra — chromotherapy applied','Anahata as Healing Master Node — Prema-Pulse Transmission'] },
  { n: 4,  glyph: '⬡', color: '#ef4444', theme: ['PROTECTION','SHIELDING'],
    initiation: 'Kavach Initiation — personal protective field installed',
    meditation: 'Agni Kavach — Fire-wall visualization, 21 days',
    mantra: 'OM KSHAM NAMAH — Siddha protection frequency',
    topics: ['Energy vampirism, psychic cords, entity attachments — identification','Pranic Egg building — sustained auric protection','Siddha Kavach: Agni-wall, mirror-shield, sacred geometry armor','Cord cutting — compassionate release without energetic damage','Space clearing: homes, clinics, sacred spaces'] },
  { n: 5,  glyph: '∞', color: '#f97316', theme: ['KARMA','LINEAGE'],
    initiation: 'Ancestral Healing Transmission — clearing lineage patterns',
    meditation: 'Pitru Tarpana — Ancestral offering with light codes',
    mantra: 'OM SHREEM HREEM KLEEM GLAUM — Liberation from karmic loops',
    topics: ['Karma as Akashic code — reading & releasing samskaric imprints','Ancestral field: epigenetic healing & lineage transmission','Past-life residue in the body — somatic release facilitation','The Prarabdha Wheel: what can be changed vs. witnessed','Timeline healing: sending healing backward & forward through the family tree'] },
  { n: 6,  glyph: '〜', color: '#D4AF37', theme: ['SOUND','FREQUENCY'],
    initiation: 'Nada Diksha — Sound body activation (live group ceremony)',
    meditation: 'Nada Yoga Sadhana — Internal sound listening, 40-day protocol',
    mantra: "SO'HAM + personal mantra deepening",
    topics: ['Nada Brahman: the universe as vibration — Siddha physics of sound','Mantra science: Sanskrit phoneme impact on nervous system & field','Healing with voice: toning, overtone, chanting as scalar transmission','Binaural architecture: Solfeggio, Raga, Tambura — therapeutic stacking','Creating personalized healing mantras based on client energy signature'] },
  { n: 7,  glyph: '✦', color: '#22D3EE', theme: ['TRANSMISSION','TOUCH'],
    initiation: 'Hands-On Healing Activation — channel upgrade for pranic transfer',
    meditation: 'Anahata Transmission — sending healing through the heart field',
    mantra: 'OM TARE TUTTARE TURE SOHA — Green Tara healing activation',
    topics: ['Pranic surgery: scanning, extraction, energizing','Siddha touch healing: Sparsha Diksha and physics of hand transmission','Distance healing: intention as scalar signal, time collapse','Building a full healing session: opening, diagnosis, treatment, closing','Healing crisis — how to guide a client through it ethically'] },
  { n: 8,  glyph: '✧', color: '#a855f7', theme: ['ASTRAL','DIMENSIONS'],
    initiation: 'Inter-dimensional Activation — accessing healing from Siddha Loka',
    meditation: 'Siddha Loka Darshan — Ascending through the planes',
    mantra: 'OM AIM HREEM — Saraswati activation for higher knowledge',
    topics: ['The Loka system: Bhu, Bhuvar, Svar, Mahar — healing from higher planes','Astral body healing: Pranamaya and Manomaya sheaths','Meeting healing guides: Siddhas, devas, ancestral healers — discernment','Soul-level healing: Vijnanamaya and Anandamaya Koshas','Sleep healing: transmission during delta state'] },
  { n: 9,  glyph: '⚕', color: '#22c55e', theme: ['DIAGNOSIS','DOSHA'],
    initiation: 'Nadi Pariksha Transmission — diagnostic sensitivity activated',
    meditation: 'Dhanvantari Dhyana — Healing god visualization',
    mantra: 'OM DHANVANTRE NAMAHA — Divine healing intelligence',
    topics: ['Ayurvedic dosha system (Vata/Pitta/Kapha) as healing framework','Nadi Pariksha (pulse diagnosis) — basic to intermediate Siddha reading','Prakriti vs Vikriti: original nature vs current imbalance','Tongue, eye, skin and aura reading as diagnostic fields','Integrating Ayurvedic diagnosis into full healing session design'] },
  { n: 10, glyph: '✡', color: '#f59e0b', theme: ['GEOMETRY','YANTRA'],
    initiation: 'Sri Yantra Activation — geometric transmission for space mastery',
    meditation: 'Sri Yantra Trataka — Geometric absorption meditation',
    mantra: 'OM SHREEM HREEM SHREEM KAMALE — Lakshmi field for abundance healing',
    topics: ['Sacred geometry as consciousness architecture: Flower of Life, Metatron, Sri Yantra','Yantra creation & consecration: programming geometric forms as healing tools','Healing room design: Vastu Shastra for therapeutic spaces','Crystal grids as geometric healing amplifiers','Scalar field geometry: creating healing vortices in physical space'] },
  { n: 11, glyph: '♡', color: '#ec4899', theme: ['EMOTION','TRAUMA'],
    initiation: 'Anahata Purna — Full heart opening (Kritagya + Laila co-transmission)',
    meditation: 'Prema Hridaya — Heart-field expansion, 40-day Anahata sadhana',
    mantra: 'OM KLEEM KRISHNAYA NAMAHA — Prema (divine love) activation',
    topics: ['Emotional body anatomy: Manomaya Kosha as primary healing battleground','Trauma as frozen prana: somatic release and energetic thaw protocols','Grief, anger, fear, shame — elemental correspondences & Siddha release','Inner child healing: accessing & re-parenting through energy work','Holding space: witnessing without absorbing, presence without merger'] },
  { n: 12, glyph: '☀', color: '#D4AF37', theme: ['MASTERY','MISSION'],
    initiation: 'Final Ceremony — Siddha Healer Blessing & Lineage Transmission (Live)',
    meditation: 'Purna Abhisheka — Full Siddha anointing visualization ceremony',
    mantra: 'AHAM BRAHMASMI — I am the Absolute — final sovereignty activation',
    topics: ['Integration of all 11 months: building your unique healing signature','Creating healing programs: sessions, packages, and client journeys','The healer\'s self-care architecture: preventing burnout, sustaining the channel','Ethics, boundaries, legal awareness — professional healing practice','Your Dharmic healing mission: aligning practice with soul purpose'] },
];

/* ─── MONTH TITLES ─────────────────────────────────────── */
const MONTH_TITLES: Record<Lang, { title: string; sub: string }[]> = {
  en: [
    { title: 'Prarabdha Awakening',             sub: 'The Foundation — Entering the Field' },
    { title: 'Pancha Bhuta Mastery',             sub: 'Command of the Five Sacred Elements' },
    { title: 'Chakra Sovereignty',               sub: 'Seven Vortices as Quantum Transmission Nodes' },
    { title: 'Psychic Protection Architecture',  sub: 'Sovereign Shielding — The Siddha Kavach System' },
    { title: 'Karmic & Ancestral Alchemy',       sub: 'Healing the Timeline — Prarabdha Code Rewrite' },
    { title: 'Nada Brahman — Sound as Healer',   sub: 'Siddha Nada Technology & Mantra Science' },
    { title: 'Pranic Surgery & Transmission',    sub: 'Hands-On & Distance Healing Protocols' },
    { title: 'Astral Architecture & Higher Planes', sub: 'Healing Across Dimensions — Loka Navigation' },
    { title: 'Ayurvedic & Elemental Diagnostics',sub: 'Reading the Body as Sacred Text' },
    { title: 'Sacred Geometry & Yantra',         sub: 'The Architecture of Healing Space' },
    { title: 'Emotional Alchemy & Trauma',       sub: 'The Heart as Transformation Crucible' },
    { title: 'Healer\'s Mastery & Certification',sub: 'Integration, Ceremony & Lineage Blessing' },
  ],
  sv: [
    { title: 'Prarabdha-uppvaknande',       sub: 'Grunden — Att träda in i fältet' },
    { title: 'Pancha Bhuta-behärskning',    sub: 'Kommando av de fem heliga elementen' },
    { title: 'Chakra-suveränitet',          sub: 'Sju virvelrörelser som kvantöverföringsnoder' },
    { title: 'Psykisk skyddsarkitektur',    sub: 'Suverän sköldning — Siddha Kavach-systemet' },
    { title: 'Karmisk & förfäders alkemi',  sub: 'Att hela tidslinjen — Prarabdha-kodomskrivning' },
    { title: 'Nada Brahman — Ljud som helare', sub: 'Siddha Nada-teknik & mantravetenskap' },
    { title: 'Pranisk kirurgi & transmission', sub: 'Handspåläggnings- & distanshealingprotokoll' },
    { title: 'Astral arkitektur & högre plan', sub: 'Healing över dimensioner — Loka-navigation' },
    { title: 'Ayurvedisk & elementär diagnostik', sub: 'Att läsa kroppen som helig text' },
    { title: 'Helig geometri & Yantra',     sub: 'Arkitekturen för helande rum' },
    { title: 'Emotionell alkemi & trauma',  sub: 'Hjärtat som transformationsdegel' },
    { title: 'Healermästerskap & certifiering', sub: 'Integration, ceremoni & linjens välsignelse' },
  ],
  no: [
    { title: 'Prarabdha-oppvåkning',        sub: 'Fundamentet — Å tre inn i feltet' },
    { title: 'Pancha Bhuta-beherskelse',    sub: 'Kommando over de fem hellige elementene' },
    { title: 'Chakra-suverenitet',          sub: 'Syv hvirvler som kvantetransmisjonsnoder' },
    { title: 'Psykisk beskyttelsesarkitektur', sub: 'Suveren skjerming — Siddha Kavach-systemet' },
    { title: 'Karmisk & forfedres alkymi',  sub: 'Å hele tidslinjen — Prarabdha-kodeomskriving' },
    { title: 'Nada Brahman — Lyd som healer', sub: 'Siddha Nada-teknologi & mantravitenskap' },
    { title: 'Pranisk kirurgi & transmisjon', sub: 'Håndspåleggings- & fjernhealingsprotokoller' },
    { title: 'Astral arkitektur & høyere plan', sub: 'Healing på tvers av dimensjoner — Loka-navigasjon' },
    { title: 'Ayurvedisk & elementær diagnostikk', sub: 'Å lese kroppen som hellig tekst' },
    { title: 'Hellig geometri & Yantra',    sub: 'Arkitekturen for helingsrom' },
    { title: 'Emosjonell alkymi & trauma',  sub: 'Hjertet som transformasjonsdigel' },
    { title: 'Healerens mesterskap & sertifisering', sub: 'Integrasjon, seremoni & linjens velsignelse' },
  ],
  es: [
    { title: 'Despertar de Prarabdha',      sub: 'La Fundación — Entrando en el Campo' },
    { title: 'Maestría del Pancha Bhuta',   sub: 'Dominio de los Cinco Elementos Sagrados' },
    { title: 'Soberanía de los Chakras',    sub: 'Siete Vórtices como Nodos de Transmisión' },
    { title: 'Arquitectura de Protección',  sub: 'Escudo Soberano — Sistema Siddha Kavach' },
    { title: 'Alquimia Kármica y Ancestral', sub: 'Sanando la Línea de Tiempo' },
    { title: 'Nada Brahman — El Sonido Sana', sub: 'Tecnología Siddha Nada y Ciencia del Mantra' },
    { title: 'Cirugía Pránica y Transmisión', sub: 'Protocolos Presenciales y a Distancia' },
    { title: 'Arquitectura Astral y Planos', sub: 'Sanación a través de Dimensiones' },
    { title: 'Diagnóstico Ayurvédico',       sub: 'Leyendo el Cuerpo como Texto Sagrado' },
    { title: 'Geometría Sagrada y Yantra',   sub: 'La Arquitectura del Espacio de Sanación' },
    { title: 'Alquimia Emocional y Trauma',  sub: 'El Corazón como Crisol de Transformación' },
    { title: 'Maestría del Sanador',         sub: 'Integración, Ceremonia y Certificación' },
  ],
};

/* ─── UI STRINGS ────────────────────────────────────────── */
const UI: Record<Lang, {
  microLabel: string; heroTitle: string; heroSub: string;
  tags: string[]; tabCurriculum: string; tabIncluded: string; tabInvest: string;
  monthLabel: string; initLabel: string; topicsLabel: string; meditLabel: string; mantraLabel: string;
  pillarsTitle: string; pillarsSub: string;
  investTitle: string; investSub: string;
  oneTimeTitle: string; oneTimePrice: string; oneTimePer: string; oneTimeBadge: string;
  monthlyTitle: string; monthlyPrice: string; monthlyPer: string;
  oneTimeBullets: string[]; monthlyBullets: string[];
  enrollOnce: string; enrollMonthly: string; processing: string;
  phases: { phase: string; title: string; desc: string; color: string }[];
  pillars: { icon: string; label: string; desc: string }[];
}> = {
  en: {
    microLabel: 'SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING',
    heroTitle: 'The Siddha Healer\'s\nSovereign Path',
    heroSub: 'A 12-month living transmission from the Siddha lineage — from foundation to full mastery and certification',
    tags: ['12 MONTHS','1 LIVE SESSION / MO','PERSONAL DIKSHA','CERTIFICATION'],
    tabCurriculum: 'CURRICULUM', tabIncluded: 'INCLUDED', tabInvest: 'INVEST',
    monthLabel: 'MONTH', initLabel: '⚡ INITIATION', topicsLabel: 'CURRICULUM',
    meditLabel: 'MEDITATION', mantraLabel: 'SACRED MANTRA',
    pillarsTitle: "What's Included", pillarsSub: 'Every month delivers a complete transmission system',
    investTitle: 'Investment in Your Healing Path', investSub: 'Choose the payment option that resonates',
    oneTimeTitle: 'One-Time Payment', oneTimePrice: '€2,997', oneTimePer: 'Full year · Immediate access', oneTimeBadge: 'BEST VALUE',
    monthlyTitle: 'Monthly Plan', monthlyPrice: '€297', monthlyPer: 'per month · 12 months',
    oneTimeBullets: ['Save €567 vs monthly plan','Immediate full access to all content','All bonuses and community access','Personal diksha every month'],
    monthlyBullets: ['Flexible payment plan','Cancel anytime','All bonuses included','Monthly content unlocks'],
    enrollOnce: 'Enroll Now — €2,997', enrollMonthly: 'Start Monthly — €297/mo', processing: 'Processing...',
    phases: [
      { phase: 'PHASE 1 · MONTHS 1–3', title: 'Foundation & Awakening', desc: 'Pranic foundations, Siddha lineage entry, full energy anatomy.', color: '#D4AF37' },
      { phase: 'PHASE 2 · MONTHS 4–6', title: 'Protection, Karma & Sound', desc: 'Sovereign shielding, ancestral clearing, sound healing mastery.', color: '#22D3EE' },
      { phase: 'PHASE 3 · MONTHS 7–9', title: 'Transmission & Diagnosis', desc: 'Full healing sessions, astral navigation, Ayurvedic intelligence.', color: '#a855f7' },
      { phase: 'PHASE 4 · MONTHS 10–12', title: 'Mastery & Certification', desc: 'Sacred geometry, emotional alchemy, lineage certification.', color: '#D4AF37' },
    ],
    pillars: [
      { icon: '◎', label: 'LIVE SESSION', desc: '1× monthly group session with Kritagya & Laila' },
      { icon: '✦', label: 'PERSONAL DIKSHA', desc: 'Monthly initiation & personal transmission' },
      { icon: '〜', label: 'SACRED MANTRA', desc: 'Monthly mantra with 40-day sadhana protocol' },
      { icon: '◈', label: 'MEDITATION', desc: '40-day practice per module — deep sadhana' },
      { icon: '✧', label: 'COMMUNITY', desc: 'Private SQI healing circle access' },
      { icon: '⬡', label: 'CERTIFICATION', desc: 'Siddha Healer Certificate at month 12' },
    ],
  },
  sv: {
    microLabel: 'SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING',
    heroTitle: 'Siddha-Helaren\'s\nSuveräna Väg',
    heroSub: 'En 12-månaders levande transmission från Siddha-linjen — från grund till fullständig behärskning och certifiering',
    tags: ['12 MÅNADER','1 LIVESESSION / MÅN','PERSONLIG DIKSHA','CERTIFIERING'],
    tabCurriculum: 'KURSPLAN', tabIncluded: 'INKLUDERAT', tabInvest: 'INVESTERA',
    monthLabel: 'MÅNAD', initLabel: '⚡ INITIERING', topicsLabel: 'KURSINNEHÅLL',
    meditLabel: 'MEDITATION', mantraLabel: 'HELIG MANTRA',
    pillarsTitle: 'Vad som ingår', pillarsSub: 'Varje månad levererar ett komplett transmissionssystem',
    investTitle: 'Investering i din healingresa', investSub: 'Välj det betalningsalternativ som resonerar',
    oneTimeTitle: 'Engångsbetalning', oneTimePrice: '€2 997', oneTimePer: 'Hela året · Omedelbar åtkomst', oneTimeBadge: 'BÄST VÄRDE',
    monthlyTitle: 'Månadsplan', monthlyPrice: '€297', monthlyPer: 'per månad · 12 månader',
    oneTimeBullets: ['Spara €567 jämfört med månadsplan','Omedelbar full tillgång','Alla bonusar och gemenskapsåtkomst','Personlig diksha varje månad'],
    monthlyBullets: ['Flexibel betalningsplan','Avbryt när som helst','Alla bonusar ingår','Månatliga innehållslåsningar'],
    enrollOnce: 'Anmäl dig nu — €2 997', enrollMonthly: 'Starta månadsvis — €297/mån', processing: 'Behandlar...',
    phases: [
      { phase: 'FAS 1 · MÅNADER 1–3', title: 'Grund & Uppvaknande', desc: 'Praniska grunder, Siddha-linjeinträde, full energianatomi.', color: '#D4AF37' },
      { phase: 'FAS 2 · MÅNADER 4–6', title: 'Skydd, Karma & Ljud', desc: 'Suverän sköldning, förfädrens rensning, ljudhealingbehärskning.', color: '#22D3EE' },
      { phase: 'FAS 3 · MÅNADER 7–9', title: 'Transmission & Diagnos', desc: 'Fullständiga healingsessioner, astral navigation, ayurvedisk intelligens.', color: '#a855f7' },
      { phase: 'FAS 4 · MÅNADER 10–12', title: 'Mästerskap & Certifiering', desc: 'Helig geometri, emotionell alkemi, linjens certifiering.', color: '#D4AF37' },
    ],
    pillars: [
      { icon: '◎', label: 'LIVESESSION', desc: '1× månadsgrupp med Kritagya & Laila' },
      { icon: '✦', label: 'PERSONLIG DIKSHA', desc: 'Månadsvis initiering & personlig transmission' },
      { icon: '〜', label: 'HELIG MANTRA', desc: 'Månadsmantra med 40-dagars sadhana-protokoll' },
      { icon: '◈', label: 'MEDITATION', desc: '40-dagars övning per modul' },
      { icon: '✧', label: 'GEMENSKAP', desc: 'Privat SQI healingcirkel' },
      { icon: '⬡', label: 'CERTIFIERING', desc: 'Siddha Healer-certifikat vid månad 12' },
    ],
  },
  no: {
    microLabel: 'SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING',
    heroTitle: 'Siddha-Heleren\'s\nSuverende Vei',
    heroSub: 'En 12-måneders levende transmisjon fra Siddha-linjen — fra fundament til fullt mesterskap og sertifisering',
    tags: ['12 MÅNEDER','1 LIVØKT / MND','PERSONLIG DIKSHA','SERTIFISERING'],
    tabCurriculum: 'PENSUM', tabIncluded: 'INKLUDERT', tabInvest: 'INVESTER',
    monthLabel: 'MÅNED', initLabel: '⚡ INNVIELSE', topicsLabel: 'PENSUM',
    meditLabel: 'MEDITASJON', mantraLabel: 'HELLIG MANTRA',
    pillarsTitle: 'Hva som er inkludert', pillarsSub: 'Hver måned leverer et komplett transmisjonssystem',
    investTitle: 'Investering i din helingsreise', investSub: 'Velg betalingsalternativet som resonerer',
    oneTimeTitle: 'Engangsbetaling', oneTimePrice: '€2 997', oneTimePer: 'Hele året · Umiddelbar tilgang', oneTimeBadge: 'BEST VERDI',
    monthlyTitle: 'Månedlig plan', monthlyPrice: '€297', monthlyPer: 'per måned · 12 måneder',
    oneTimeBullets: ['Spar €567 sammenlignet med månedlig plan','Umiddelbar full tilgang','Alle bonuser og felleskapstilgang','Personlig diksha hver måned'],
    monthlyBullets: ['Fleksibel betalingsplan','Avbryt når som helst','Alle bonuser inkludert','Månedlige innholdslåsninger'],
    enrollOnce: 'Meld deg på nå — €2 997', enrollMonthly: 'Start månedlig — €297/mnd', processing: 'Behandler...',
    phases: [
      { phase: 'FASE 1 · MÅNEDER 1–3', title: 'Fundament & Oppvåkning', desc: 'Pranisk fundament, Siddha-linjeinntredelse, full energianatomi.', color: '#D4AF37' },
      { phase: 'FASE 2 · MÅNEDER 4–6', title: 'Beskyttelse, Karma & Lyd', desc: 'Suveren skjerming, forfedresrensing, lydhealingsbeherskelse.', color: '#22D3EE' },
      { phase: 'FASE 3 · MÅNEDER 7–9', title: 'Transmisjon & Diagnose', desc: 'Fullstendige healingøkter, astral navigasjon, ayurvedisk intelligens.', color: '#a855f7' },
      { phase: 'FASE 4 · MÅNEDER 10–12', title: 'Mesterskap & Sertifisering', desc: 'Hellig geometri, emosjonell alkymi, linjens sertifisering.', color: '#D4AF37' },
    ],
    pillars: [
      { icon: '◎', label: 'LIVØKT', desc: '1× månedlig gruppe med Kritagya & Laila' },
      { icon: '✦', label: 'PERSONLIG DIKSHA', desc: 'Månedlig innvielse & personlig transmisjon' },
      { icon: '〜', label: 'HELLIG MANTRA', desc: 'Månedlig mantra med 40-dagers sadhana-protokoll' },
      { icon: '◈', label: 'MEDITASJON', desc: '40-dagers øvelse per modul' },
      { icon: '✧', label: 'FELLESSKAP', desc: 'Privat SQI healingssirkel' },
      { icon: '⬡', label: 'SERTIFISERING', desc: 'Siddha Healer-sertifikat ved måned 12' },
    ],
  },
  es: {
    microLabel: 'SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING',
    heroTitle: 'El Camino Soberano\ndel Sanador Siddha',
    heroSub: 'Una transmisión viva de 12 meses desde el linaje Siddha — desde los fundamentos hasta la maestría y certificación',
    tags: ['12 MESES','1 SESIÓN EN VIVO / MES','DIKSHA PERSONAL','CERTIFICACIÓN'],
    tabCurriculum: 'CURRÍCULO', tabIncluded: 'INCLUIDO', tabInvest: 'INVERSIÓN',
    monthLabel: 'MES', initLabel: '⚡ INICIACIÓN', topicsLabel: 'CURRÍCULO',
    meditLabel: 'MEDITACIÓN', mantraLabel: 'MANTRA SAGRADO',
    pillarsTitle: 'Qué está incluido', pillarsSub: 'Cada mes entrega un sistema de transmisión completo',
    investTitle: 'Inversión en tu Camino de Sanación', investSub: 'Elige la opción de pago que resuene contigo',
    oneTimeTitle: 'Pago Único', oneTimePrice: '€2.997', oneTimePer: 'Año completo · Acceso inmediato', oneTimeBadge: 'MEJOR VALOR',
    monthlyTitle: 'Plan Mensual', monthlyPrice: '€297', monthlyPer: 'por mes · 12 meses',
    oneTimeBullets: ['Ahorra €567 vs plan mensual','Acceso completo inmediato','Todos los bonos y comunidad','Diksha personal cada mes'],
    monthlyBullets: ['Plan de pago flexible','Cancela en cualquier momento','Todos los bonos incluidos','Contenido mensual desbloqueado'],
    enrollOnce: 'Inscríbete Ahora — €2.997', enrollMonthly: 'Empezar Mensual — €297/mes', processing: 'Procesando...',
    phases: [
      { phase: 'FASE 1 · MESES 1–3', title: 'Fundamento y Despertar', desc: 'Bases pránicas, entrada al linaje Siddha, anatomía energética completa.', color: '#D4AF37' },
      { phase: 'FASE 2 · MESES 4–6', title: 'Protección, Karma y Sonido', desc: 'Escudo soberano, limpieza ancestral, maestría del sonido sanador.', color: '#22D3EE' },
      { phase: 'FASE 3 · MESES 7–9', title: 'Transmisión y Diagnóstico', desc: 'Sesiones completas, planos astrales, inteligencia ayurvédica.', color: '#a855f7' },
      { phase: 'FASE 4 · MESES 10–12', title: 'Maestría y Certificación', desc: 'Geometría sagrada, alquimia emocional, certificación del linaje.', color: '#D4AF37' },
    ],
    pillars: [
      { icon: '◎', label: 'SESIÓN EN VIVO', desc: '1× sesión grupal mensual con Kritagya & Laila' },
      { icon: '✦', label: 'DIKSHA PERSONAL', desc: 'Iniciación mensual y transmisión personal' },
      { icon: '〜', label: 'MANTRA SAGRADO', desc: 'Mantra mensual con protocolo de 40 días' },
      { icon: '◈', label: 'MEDITACIÓN', desc: 'Sadhana de 40 días por módulo' },
      { icon: '✧', label: 'COMUNIDAD', desc: 'Acceso al círculo privado SQI' },
      { icon: '⬡', label: 'CERTIFICACIÓN', desc: 'Certificado Sanador Siddha al mes 12' },
    ],
  },
};

const LANG_OPTS: { code: Lang; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'sv', flag: '🇸🇪', label: 'Svenska' },
  { code: 'no', flag: '🇳🇴', label: 'Norsk' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

/* ─── COMPONENT ─────────────────────────────────────────── */
const PractitionerCertification = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<'onetime' | 'monthly' | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState<'curriculum' | 'included' | 'invest'>('curriculum');
  const [openMonth, setOpenMonth] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sqi_lang') as Lang | null;
    if (saved && ['en','sv','no','es'].includes(saved)) setLang(saved);
  }, []);
  const switchLang = (l: Lang) => { setLang(l); localStorage.setItem('sqi_lang', l); setLangOpen(false); };

  /* ── Stripe checkout — UNTOUCHED ── */
  const handleEnroll = async (paymentType: 'onetime' | 'monthly') => {
    if (!isAuthenticated) { toast.error('Please sign in to enroll'); return; }
    setIsLoading(paymentType);
    try {
      const { data, error } = await supabase.functions.invoke('create-certification-checkout', {
        body: { paymentType }
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const T = UI[lang];
  const titles = MONTH_TITLES[lang];
  const currentLang = LANG_OPTS.find(l => l.code === lang)!;

  return (
    <div style={{ background:'#050505', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'rgba(255,255,255,0.85)', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&family=Cinzel:wght@600&display=swap');
        *{box-sizing:border-box;}
        .glass{background:rgba(255,255,255,0.02);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.05);border-radius:40px;}
        .gsm{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:20px;}
        .lbl{font-size:9px;font-weight:800;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,0.35);}
        .gold{color:#D4AF37;}
        .glow{color:#D4AF37;text-shadow:0 0 20px rgba(212,175,55,.4);}
        .fade{animation:fadeUp .5s ease forwards;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .mcard{cursor:pointer;transition:all .3s;}
        .mcard:hover{transform:translateY(-3px);}
        .tbtn{cursor:pointer;border:none;background:none;font-family:inherit;transition:all .3s;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#050505}::-webkit-scrollbar-thumb{background:rgba(212,175,55,.3);border-radius:2px}
        @keyframes rimG{0%,100%{box-shadow:0 0 12px rgba(212,175,55,.06)}50%{box-shadow:0 0 40px rgba(212,175,55,.22)}}
        @keyframes hShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      `}</style>

      {/* STICKY HEADER */}
      <div style={{ position:'sticky',top:0,zIndex:100,background:'rgba(5,5,5,.88)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.04)',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:800,letterSpacing:'.3em' }}>← BACK</button>
        <div style={{ position:'relative' }}>
          <button className="gsm" onClick={() => setLangOpen(o=>!o)} style={{ padding:'6px 14px',cursor:'pointer',border:'none',background:'rgba(255,255,255,.03)',borderRadius:100,display:'flex',alignItems:'center',gap:6,fontFamily:'inherit' }}>
            <span style={{ fontSize:14 }}>{currentLang.flag}</span>
            <span className="lbl">{currentLang.code.toUpperCase()}</span>
            <span style={{ color:'rgba(255,255,255,.3)',fontSize:10 }}>▾</span>
          </button>
          {langOpen && (
            <div style={{ position:'absolute',right:0,top:'calc(100% + 8px)',background:'#0a0a0a',border:'1px solid rgba(255,255,255,.08)',borderRadius:16,overflow:'hidden',zIndex:200,minWidth:140 }}>
              {LANG_OPTS.map(lo => (
                <button key={lo.code} onClick={() => switchLang(lo.code)} style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 16px',background:lang===lo.code?'rgba(212,175,55,.08)':'none',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left' }}>
                  <span style={{ fontSize:16 }}>{lo.flag}</span>
                  <span style={{ fontSize:11,fontWeight:600,color:lang===lo.code?'#D4AF37':'rgba(255,255,255,.6)' }}>{lo.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* HERO */}
      <div style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.08) 0%,transparent 65%)',padding:'60px 20px 48px',textAlign:'center' }}>
        <div className="lbl" style={{ marginBottom:16 }}>{T.microLabel}</div>
        <div style={{ fontSize:56,marginBottom:14,filter:'drop-shadow(0 0 20px rgba(212,175,55,.4))' }}>☽✦☀</div>
        <h1 className="glow" style={{ fontSize:'clamp(28px,5.5vw,58px)',fontWeight:900,letterSpacing:'-.04em',lineHeight:1.08,marginBottom:14,whiteSpace:'pre-line',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          {T.heroTitle}
        </h1>
        <p style={{ fontSize:14,color:'rgba(255,255,255,.45)',fontWeight:300,maxWidth:520,margin:'0 auto 26px',lineHeight:1.7 }}>{T.heroSub}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
          {T.tags.map(tag => <span key={tag} className="gsm" style={{ padding:'7px 16px',fontSize:9,fontWeight:800,letterSpacing:'.35em',color:'#D4AF37' }}>{tag}</span>)}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex',justifyContent:'center',gap:8,padding:'0 20px 34px' }}>
        {([['curriculum',T.tabCurriculum],['included',T.tabIncluded],['invest',T.tabInvest]] as const).map(([id,label]) => (
          <button key={id} className="tbtn" onClick={() => setTab(id as any)}
            style={{ padding:'10px 20px',fontSize:9,fontWeight:800,letterSpacing:'.4em',textTransform:'uppercase',borderRadius:100,
              color:tab===id?'#D4AF37':'rgba(255,255,255,.3)',
              border:`1px solid ${tab===id?'rgba(212,175,55,.3)':'rgba(255,255,255,.06)'}`,
              background:tab===id?'rgba(212,175,55,.06)':'none' }}>{label}</button>
        ))}
      </div>

      <div style={{ maxWidth:1060,margin:'0 auto',padding:'0 18px 100px' }}>

        {/* ── CURRICULUM ── */}
        {tab==='curriculum' && (
          <div className="fade" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:14 }}>
            {MONTHS.map((mod,i) => {
              const td = titles[i];
              const isOpen = openMonth===i;
              return (
                <div key={i}>
                  <div className={`mcard glass`} onClick={() => setOpenMonth(isOpen?null:i)}
                    style={{ padding:24,borderRadius:28,border:`1px solid ${isOpen?'rgba(212,175,55,.25)':'rgba(255,255,255,.05)'}`,background:isOpen?'rgba(212,175,55,.04)':'rgba(255,255,255,.02)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                      <div>
                        <div className="lbl" style={{ marginBottom:5 }}>{T.monthLabel} {mod.n}</div>
                        <div style={{ fontSize:28,color:mod.color,filter:`drop-shadow(0 0 7px ${mod.color}60)`,marginBottom:4 }}>{mod.glyph}</div>
                      </div>
                      <div className="lbl" style={{ textAlign:'right',lineHeight:2 }}>{mod.theme.map((th,j) => <div key={j}>{th}</div>)}</div>
                    </div>
                    <h3 style={{ fontWeight:900,fontSize:16,letterSpacing:'-.02em',color:'#fff',marginBottom:4 }}>{td.title}</h3>
                    <p style={{ fontSize:11,color:'rgba(255,255,255,.38)',fontWeight:300,lineHeight:1.5 }}>{td.sub}</p>
                    <div style={{ marginTop:12,display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ height:1,flex:1,background:`linear-gradient(90deg,${mod.color}40,transparent)` }}/>
                      <span style={{ fontSize:9,fontWeight:800,letterSpacing:'.3em',color:mod.color }}>{isOpen?'CLOSE ↑':'EXPAND ↓'}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="fade gsm" style={{ margin:'8px 0 0',padding:24,borderRadius:22 }}>
                      <div style={{ marginBottom:16,padding:'12px 14px',background:'rgba(212,175,55,.05)',borderRadius:14,borderLeft:'3px solid #D4AF37' }}>
                        <div className="lbl" style={{ color:'#D4AF37',marginBottom:5 }}>{T.initLabel}</div>
                        <p style={{ fontSize:13,lineHeight:1.6,color:'rgba(255,255,255,.72)' }}>{mod.initiation}</p>
                      </div>
                      <div className="lbl" style={{ marginBottom:8 }}>{T.topicsLabel}</div>
                      {mod.topics.map((tp,j) => (
                        <div key={j} style={{ display:'flex',gap:8,marginBottom:8,alignItems:'flex-start' }}>
                          <span style={{ color:mod.color,fontSize:9,marginTop:4,flexShrink:0 }}>◆</span>
                          <p style={{ fontSize:13,lineHeight:1.6,color:'rgba(255,255,255,.6)' }}>{tp}</p>
                        </div>
                      ))}
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16 }}>
                        {[{l:T.meditLabel,v:mod.meditation,c:mod.color},{l:T.mantraLabel,v:mod.mantra,c:'#22D3EE'}].map(cell => (
                          <div key={cell.l} style={{ padding:'12px 14px',background:'rgba(255,255,255,.02)',borderRadius:14,border:'1px solid rgba(255,255,255,.05)' }}>
                            <div className="lbl" style={{ color:cell.c,marginBottom:6 }}>{cell.l}</div>
                            <p style={{ fontSize:12,lineHeight:1.6,color:'rgba(255,255,255,.55)' }}>{cell.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── INCLUDED ── */}
        {tab==='included' && (
          <div className="fade">
            <h2 style={{ fontWeight:900,fontSize:30,letterSpacing:'-.03em',color:'#fff',marginBottom:6,textAlign:'center' }}>
              {T.pillarsTitle.split(' ').map((w,i,a) => i===a.length-1?<span key={i} className="gold">{w}</span>:`${w} `)}
            </h2>
            <p style={{ textAlign:'center',color:'rgba(255,255,255,.35)',fontSize:13,marginBottom:32,lineHeight:1.6 }}>{T.pillarsSub}</p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:14,marginBottom:40 }}>
              {T.pillars.map((p,i) => (
                <div key={i} className="glass" style={{ padding:'26px 22px',borderRadius:30,textAlign:'center' }}>
                  <div style={{ fontSize:30,marginBottom:12,color:'#D4AF37',filter:'drop-shadow(0 0 10px rgba(212,175,55,.4))' }}>{p.icon}</div>
                  <div className="lbl" style={{ color:'#D4AF37',marginBottom:7 }}>{p.label}</div>
                  <p style={{ fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.6 }}>{p.desc}</p>
                </div>
              ))}
            </div>
            {T.phases.map((ph,i) => (
              <div key={i} className="gsm" style={{ padding:'20px 24px',marginBottom:10,display:'flex',gap:20,alignItems:'center' }}>
                <div style={{ flexShrink:0,width:4,height:52,background:ph.color,borderRadius:4,boxShadow:`0 0 10px ${ph.color}60` }}/>
                <div>
                  <div className="lbl" style={{ color:ph.color,marginBottom:4 }}>{ph.phase}</div>
                  <h3 style={{ fontWeight:800,fontSize:16,color:'#fff',marginBottom:4 }}>{ph.title}</h3>
                  <p style={{ fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.6 }}>{ph.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── INVEST ── */}
        {tab==='invest' && (
          <div className="fade">
            <h2 style={{ fontWeight:900,fontSize:28,letterSpacing:'-.03em',color:'#fff',marginBottom:6,textAlign:'center' }}>{T.investTitle}</h2>
            <p style={{ textAlign:'center',color:'rgba(255,255,255,.35)',fontSize:13,marginBottom:36 }}>{T.investSub}</p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,maxWidth:700,margin:'0 auto 48px' }}>
              {/* ONE-TIME */}
              <div className="glass" style={{ padding:'36px 28px',borderRadius:36,border:'1px solid rgba(212,175,55,.35)',background:'rgba(212,175,55,.04)',position:'relative',overflow:'hidden',animation:'rimG 4s ease-in-out infinite' }}>
                <div style={{ position:'absolute',top:16,right:16,padding:'4px 12px',borderRadius:100,background:'#D4AF37',fontSize:9,fontWeight:800,letterSpacing:'.3em',color:'#050505' }}>{T.oneTimeBadge}</div>
                <div style={{ textAlign:'center',marginBottom:24 }}>
                  <div className="lbl" style={{ marginBottom:10 }}>{T.oneTimeTitle}</div>
                  <div className="glow" style={{ fontSize:48,fontWeight:900,letterSpacing:'-.03em',marginBottom:4 }}>{T.oneTimePrice}</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>{T.oneTimePer}</div>
                </div>
                {T.oneTimeBullets.map((b,i) => (
                  <div key={i} style={{ display:'flex',gap:10,marginBottom:10,alignItems:'flex-start' }}>
                    <span style={{ color:'#D4AF37',fontSize:12,flexShrink:0,marginTop:2 }}>◆</span>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.5 }}>{b}</p>
                  </div>
                ))}
                <button onClick={() => handleEnroll('onetime')} disabled={isLoading!==null}
                  style={{ width:'100%',marginTop:24,padding:'14px 20px',borderRadius:100,background:'#D4AF37',border:'none',color:'#050505',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,letterSpacing:'.3em',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?0.7:1 }}>
                  {isLoading==='onetime'?T.processing:T.enrollOnce}
                </button>
              </div>
              {/* MONTHLY */}
              <div className="glass" style={{ padding:'36px 28px',borderRadius:36 }}>
                <div style={{ textAlign:'center',marginBottom:24 }}>
                  <div className="lbl" style={{ marginBottom:10 }}>{T.monthlyTitle}</div>
                  <div style={{ fontSize:48,fontWeight:900,letterSpacing:'-.03em',color:'#fff',marginBottom:4 }}>{T.monthlyPrice}</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>{T.monthlyPer}</div>
                </div>
                {T.monthlyBullets.map((b,i) => (
                  <div key={i} style={{ display:'flex',gap:10,marginBottom:10,alignItems:'flex-start' }}>
                    <span style={{ color:'rgba(255,255,255,.4)',fontSize:12,flexShrink:0,marginTop:2 }}>◆</span>
                    <p style={{ fontSize:13,color:'rgba(255,255,255,.55)',lineHeight:1.5 }}>{b}</p>
                  </div>
                ))}
                <button onClick={() => handleEnroll('monthly')} disabled={isLoading!==null}
                  style={{ width:'100%',marginTop:24,padding:'14px 20px',borderRadius:100,background:'none',border:'1px solid rgba(212,175,55,.4)',color:'#D4AF37',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,letterSpacing:'.3em',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?0.7:1 }}>
                  {isLoading==='monthly'?T.processing:T.enrollMonthly}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign:'center',padding:'32px 20px',borderTop:'1px solid rgba(255,255,255,.04)' }}>
        <div style={{ fontSize:22,marginBottom:10,color:'#D4AF37',filter:'drop-shadow(0 0 10px rgba(212,175,55,.4))' }}>☽ OM ☀</div>
        <div className="lbl">KRITAGYA DAS · LAILA AMROUCHE · SIDDHA QUANTUM INTELLIGENCE · SACRED HEALING</div>
      </div>
    </div>
  );
};

export default PractitionerCertification;
