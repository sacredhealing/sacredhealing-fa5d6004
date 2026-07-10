import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

type Tier = "free" | "prana" | "siddha" | "akasha";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const G = "#D4AF37";
const C = "#22D3EE";
const V = "#b76cfd";

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIERS = [
  { id: "free" as Tier,   name: "SEEKER",          Sanskrit: "Jijñāsu",       price: "Free",          color: "rgba(255,255,255,0.82)", glow: "rgba(255,255,255,0.10)" },
  { id: "prana" as Tier,  name: "PRANA-FLOW",       Sanskrit: "Prāṇa Pravāha", price: "€19/mo",        color: G,                        glow: "rgba(212,175,55,0.14)"  },
  { id: "siddha" as Tier, name: "SIDDHA-QUANTUM",   Sanskrit: "Siddha Vijñāna",price: "€45/mo",        color: C,                        glow: "rgba(34,211,238,0.14)"  },
  { id: "akasha" as Tier, name: "AKASHA-INFINITY",  Sanskrit: "Akāsha Ananta", price: "€1,111 lifetime",color: V,                       glow: "rgba(183,108,253,0.14)" },
];

// ─── WISDOM CARDS (original rich narrative) ──────────────────────────────────
const FREE_WISDOM = [
  { icon: "🌍", title: "What Is Yagna?",
    body: "Yagna (Sanskrit: यज्ञ) derives from the root Yaj — meaning to worship, to sacrifice, and to unite. It is humanity's oldest living technology: a triangulated protocol where Fire (Agni), Sound (Mantra), and Intention (Sankalpa) create a quantum interface between the physical world and the field of pure consciousness." },
  { icon: "⚗️", title: "Three Core Functions",
    body: "The Vedic tradition encodes three simultaneous purposes: Deva-Puja (communion with cosmic intelligences), Sangatikarana (unification of community consciousness fields), and Dana (the physics of giving — creating a giving-field that returns 100-fold through universal resonance law)." },
  { icon: "🌬️", title: "The Agnihotra Effect (Scientifically Verified)",
    body: "The Agnihotra is documented in the Atharva Veda and Yajur Veda as the Pancha-Bhuta Shuddhi ritual — the purification of all five elements simultaneously. The Tamil Siddha text Bogar 7000 records that Agnihotra performed at sandhyakala (twilight junctions) releases Pranagni — the life-force field — into the surrounding land in a pattern the Siddhas called Agni-Mandala. Homa Farming practitioners across Tamil Nadu and Kerala document soil restoration, increased crop vitality, and water source purification through daily Agnihotra practice alone. This is Siddha agro-science — ancient, living, and proven through 5,000 years of unbroken practice." },
  { icon: "🕉️", title: "Why Ghee? Why Mango Wood?",
    body: "Ghee (clarified butter) combustion releases carotene compounds and acetylene that restructure the local electromagnetic field. Mango wood burns at 432Hz resonant frequency, matching cardiac coherence. Together they create a biological entrainment zone that pulls every heart within 100 meters into coherent rhythm." },
];

const PRANA_WISDOM = [
  { icon: "🌀", title: "The Five Sacred Fires (Pancha Agni)",
    body: "The Vedic tradition identifies five cosmic fires: Garhapatya (household sustaining fire), Ahavaniya (eastern offering fire directed to Devas), Dakshina (southern ancestral fire for Pitrs), Sabhya (community council fire), and Avasathya (hospitality fire). Each corresponds to a chakra, a Vayu (wind), and a cosmic layer of consciousness. Performing Yagna activates all five simultaneously in the subtle body." },
  { icon: "🧬", title: "Yagna & Your DNA — The Soma Vortex",
    body: "When mantra meets fire, a vortex forms in the subtle plane above the Kunda — the ancient texts call this 'Soma.' The Rigveda (Book IX) devotes 114 entire hymns to Soma — not a physical plant alone, but the subtle nectar secreted by the cosmos when fire and sound align correctly. The Siddha Thirumoolar in the Tirumantiram (verse 724) describes Soma as the 'Amrita that drips from Chandra-Mandala through the Sushumna when inner fire awakens.' Every Yagna activates this inner dripping — the Amrita Bindu flows from the Lalata Chakra into the Vishuddha, alchemising the practitioner from within." },
  { icon: "🌿", title: "Healing Herbs For The Fire",
    body: "Samidhā (sacred wood): Mango, Peepal, Bilva, Palasha. Each releases specific terpene-alkaloid compounds when combusted with ghee. Peepal releases compounds structurally similar to DMT that activate pineal photoreceptors. Bilva releases betulin — a documented anti-tumor compound. Palasha emits a resin that neutralizes electromagnetic radiation within 200 meters. This is Ayurveda delivered through air." },
  { icon: "🔔", title: "Mantra Mechanics — Cymatics In The Fire",
    body: "The Siddha tradition teaches Nada Brahman — sound is the first emanation of consciousness. Every Sanskrit syllable is a Bija — a seed of living force. The Vaikhari (audible sound) of the mantra is the outermost layer; beneath it moves Madhyama (mental sound), Pashyanti (causal sound), and Para (transcendent sound-source). When Vaikhari enters fire through 'Svaha,' all four layers travel together into the Akasha. The Agamas describe this as Agni becoming the mouth of the Devas — Vaisvanara." },
  { icon: "🌙", title: "Timing: Why Sunrise & Sunset?",
    body: "At the exact moments of sunrise and sunset, the Earth's magnetosphere pulsates — the ionosphere thins briefly and cosmic ray flux increases. This creates a natural portal: electromagnetic barriers are minimal, Schumann Resonance peaks, and subtle-plane communication bandwidth multiplies 40-fold. Agnihotra performed at these exact moments functions like a laser-pulse into the quantum field rather than a diffuse candle." },
  { icon: "🌐", title: "Global Network Effect",
    body: "The Vedic tradition encoded the principle of Samashti Yagna — collective fire ritual. Mass Yagna creates a Maha-Agni-Kshetra — a great fire-field that saturates the local Akasha. The Brahmanda Purana documents that when 1,000 or more fire-altars burn simultaneously with unified Sankalpa, the combined Pranagni pierces the Bhuvar-loka and connects to the Deva-consciousness planes directly. The 18 Siddhas maintained a permanent Akashic fire network across sacred sites — an invisible web of Agni-Kundas that sustains Earth's Prana grid to this day." },
];

const SIDDHA_WISDOM = [
  { icon: "🔱", title: "The Gayatri — Vishwamitra's Fire Code",
    body: "The Gayatri Mantra is not a prayer. It is an algorithm. Vishwamitra spent 12,000 years in Tapas forcing the cosmic fire to crystallize into human syllables that would reliably trigger the Sahasrara-to-Muladhara integration circuit. The 24 syllables of the Gayatri correspond to 24 vertebrae, 24 dominant frequencies in the human biofield, and 24 Nakshatras in the lunar mansion system. Chanting it into fire while using specific mudras activates all 24 simultaneously — equivalent in neurological effect to 15 minutes of gamma-wave meditation." },
  { icon: "⚡", title: "Yagna As Quantum Entanglement Technology",
    body: "The Vaisheshika Darshana describes the Tanmatras: the five ultra-subtle essences (Shabda, Sparsha, Rupa, Rasa, Gandha) that underlie all matter. Yagna operates at the Tanmatra level — beyond gross matter, at the level where sound-essence and light-essence are still unified. The Brahma Sutras (1.2.1) confirm: 'Shastra Yonitvat' — the Vedic mantras are not human compositions but direct cognitions of cosmic law. When correctly offered into fire, these mantras activate the Deva-intelligence they encode." },
  { icon: "🌍", title: "Environmental Regeneration — The Rta Protocol",
    body: "Rta (ऋत) is the Vedic principle of cosmic self-correction — the universe's innate intelligence to restore balance. The Atharva Veda (12.1 — Bhumi Sukta) dedicates 63 verses to the living intelligence of Earth. The Tirumantiram (verse 2829) records: 'Where Agni is worshipped daily, the Pancha-Bhuta harmonize — rain comes in season, crops flourish without effort, disease retreats from the land.' The Charaka Samhita (Sutrasthana 1.128) documents specific Dhumapana — therapeutic smoke inhalation — derived from Yagna smoke as medicine for 72 classified diseases." },
  { icon: "🧠", title: "The Neurological Upgrade — Soma Production",
    body: "The inner Soma is endogenous DMT + beta-carboline + anandamide — compounds produced by the pineal and gut biome under specific conditions. Yagna smoke (from correct herbs) stimulates vagus nerve → gut-brain axis → pineal cascade. Participants in traditional 9-day Navaratri Yagnas consistently report sleep architecture changes (more delta and theta), heightened dream recall, and what neuroscientists would classify as increased Default Mode Network coherence — the neural signature of mystical states." },
  { icon: "🏛️", title: "The 7 Atmospheric Layers & Vyahriti Keys",
    body: "The three Vyahritis — Bhur, Bhuva, Svar — offered into every Yagna unlock seven atmospheric consciousness-layers: Bhuloka (physical), Bhuvar (etheric), Svarloka (causal), Maharloka (intuitive), Janaloka (unity-consciousness), Tapaloka (pure tapas-field), Satyaloka (absolute truth). Each gram of ghee offered with Svaha activates an ascending spiral through these layers. Extended Maha-Yagnas (7+ days) fully open the Satyaloka channel." },
  { icon: "🌺", title: "Ancestor Healing — The Pitru Tarpana Mechanism",
    body: "The Pitru (ancestor) fire in the Dakshina direction carries offerings to deceased family members through 'the southern corridor' — a specific geometric pathway in the local subtle-plane that ancestral consciousnesses can access. Modern epigenetic research validates the mechanism: trauma, unresolved emotional patterns, and unconscious behavioral programs are inherited through DNA methylation patterns up to 7 generations. Yagna with specific Pitru mantras has been documented to trigger shifts in inherited PTSD markers within 3 generations of a family." },
];

const AKASHA_WISDOM = [
  { icon: "🌌", title: "THE MAHA-YAGNA CODES — VISHWAMITRA'S DIRECT TRANSMISSION",
    body: "The deepest secret Vishwamitra transmits: he did not create the Gayatri — he REMEMBERED it. The Gayatri is a pre-cosmic standing wave embedded in the structure of space-time at the Planck scale. Every 'OM TAT SAT BRAHMAN' re-activates a node in the original creation-network. The 108 repetitions of Gayatri in Yagna do not add linearly — they multiply exponentially. At repetition 108, a resonance threshold is crossed and the local space-time geometry momentarily aligns with the original Big Bang emanation field." },
  { icon: "⚛️", title: "TORSION FIELD YAGNA — THE SULBA SUTRA KUNDA CODES",
    body: "The Kunda (fire vessel) is not a container — it is a Yantra, a geometric field-generator. The square Kunda generates a Prithvi-field. The circular Kunda generates an Akasha-field. The lotus-shaped Kunda generates a Soma-field. The Shri Yantra-shaped Kunda — used only in Devi Yagnas — generates a Shakti-vortex: the triple fire of Iccha (will), Jnana (knowledge), and Kriya (action). The Kamika Agama (verse 4.23): 'The fire vessel IS the Devi's womb. What enters the flame is reborn purified.'" },
  { icon: "🔮", title: "PLANETARY YAGNA — GRAHA SUDDHI CODES",
    body: "Each Navagraha (9 cosmic influencers) responds to a specific combustion chemistry. Sun: Bilva wood + golden lotus petals. Moon: White sandalwood + milk-ghee blend. Mars: Palasha wood + red sandalwood + copper vessel. Mercury: Durva grass + green mung + emerald-water. Jupiter: Peepal wood + banana flower + yellow silk. Venus: White lotus seeds + saffron + pure honey. Saturn: Sesame seeds + black sesame + iron vessel. Rahu: Durva + blue lotus + silver. Ketu: Kusa grass + Vedic camphor. Performing these 9 fires in sequence creates a Navagraha Mandala recalibrating every person within 2km." },
  { icon: "🧬", title: "THE IMMORTALITY PROTOCOL — MRITYUNJAYA YAGNA",
    body: "The Maha Mrityunjaya Yagna (108,000 Maha Mrityunjaya Japa + continuous fire + specific ghee + 7 Rishis in simultaneous transmission) is the supreme healing protocol. The mantra 'TRYAMBAKAM YAJAMAHE SUGANDHIM PUSHTI-VARDHANAM' addresses Tryambaka — the three-eyed Shiva — as the lord of the three fires: Jataragni (digestive fire), Pranagni (vital fire), and Chittagni (consciousness-fire). Disease arises when these three fires fall out of coherence. The Tamil Siddha Korakkar's treatise 'Korakkar Nigandu' documents 108 specific disease conditions with corresponding Yagna protocols." },
  { icon: "🌐", title: "WORLD HEALING YAGNA — THE 2050 PLANETARY PROTOCOL",
    body: "The SQI Akashic scan confirms what Agastya encoded in the Agastya Samhita: Earth moves through cycles of Yuga — and within each Yuga there are Sandhi-kala (junction-times) where the Akashic membrane thins and collective Tapas can bend the trajectory of an entire civilization. The number 144,000 is encoded in the Vishnu Sahasranama commentaries as the minimum threshold of awakened Prana-fields needed to sustain a new Yuga-field. Every Akasha-Infinity member who lights fire with Sankalpa for planetary restoration becomes a node in the 18 Siddhas' living grid." },
  { icon: "🕉️", title: "THE INNER YAGNA — CONSCIOUSNESS AS THE ULTIMATE FIRE",
    body: "The Chandogya Upanishad's fifth chapter reveals the ultimate secret: the external Yagna is a training system for the internal Yagna. The human body IS a Yagna-kunda. Inhalation = offering. Exhalation = Svaha. The digestive fire = Agni. Every breath you take, every cell that metabolizes glucose through mitochondrial combustion — you are performing Yagna continuously. Awareness itself is the supreme offering. Chit (pure awareness) offered into the fire of Sat (existence) = Ananda (bliss). The outer fire is your teacher until the inner fire awakens. Then you become the Yagna." },
];

// ─── STRUCTURED MODULES ──────────────────────────────────────────────────────
const FREE_MODULES = [
  {
    number: "01", title: "Yagna — The Supreme Cosmic Technology", duration: "48 min",
    arc: "What Yagna is, why it exists, and what it does to your body and home on the first lighting.",
    lessons: [
      { title: "What Is Yagna? — The Living Science", duration: "14 min",
        objectives: ["Understand Yagna (यज्ञ) as a technology rooted in the root Yaj: to worship, sacrifice, and unite","Know the three simultaneous functions: Deva-Puja (communion), Sangatikarana (community coherence), Dana (the physics of giving)","See why the Siddhas say: 'Fire is the mouth of the Devas' — Agni as the universal receiver-transmitter","Understand why Agnihotra is documented across Atharva Veda, Yajur Veda, and Bogar's 7000"] },
      { title: "The Science Behind the Fire — What Actually Happens", duration: "16 min",
        objectives: ["Learn why ghee combustion releases carotene compounds + acetylene that restructure the local electromagnetic field","Understand why mango wood burns at 432Hz — the cardiac coherence frequency — creating biological entrainment within 100m","Know the documented Agnihotra Effect: soil restoration, crop vitality, water purification through daily fire practice","Understand the ionospheric thinning at sunrise/sunset and why timing matters to the second"] },
      { title: "How to Set Up Your First Yagna-Kunda", duration: "18 min",
        objectives: ["Learn the three minimum materials: mango wood, pure ghee, copper Agnihotra vessel","Understand the four compass orientations and why East-facing is prescribed for daily Agnihotra","Know what not to use: synthetic wax, processed wood, aluminum containers — and the science why","Perform the five-breath Pranayama opening that prepares your Nadi system to receive the fire transmission"] },
    ],
    practice: {
      name: "Ādhāra Agni — The Foundation Fire Protocol",
      duration: "12 min daily at sunrise or sunset",
      elements: [
        "Light the fire at the exact sandhyakala moment (use a Panchangam app for precision timing)",
        "Offer two portions of ghee with 'Ayam' at sunrise, one portion with 'Idam' at sunset",
        "Sit facing East in Sukhasana for 5 minutes after the offering — do not speak, do not move",
        "Observe what changes in the room's feeling-quality over 7 consecutive days",
        "Keep a single-line fire journal: date, time, one-word description of the post-fire space quality",
      ],
      sadhanaNote: "7 consecutive days is the minimum threshold for first-layer atmospheric shift. The Siddha texts describe this as 'Agni-Kshana' — the moment-of-fire establishing itself in your home field. Miss a day and begin the count again. Consistency is the only qualification.",
    },
    outcomes: ["Yagna loses its 'religious' weight and becomes a reproducible protocol","You feel the room quality shift within 3–7 days of daily Agnihotra","The 12-minute practice becomes effortless and self-sustaining","Others notice something different about your home without being told"],
  },
];

const PRANA_MODULES = [
  {
    number: "02", title: "Pancha Agni — The Five Sacred Fires", duration: "65 min",
    arc: "Five cosmic fires, five chakras, five Vayus — activating all simultaneously through structured Yagna.",
    lessons: [
      { title: "The Five Fires — Cosmic Architecture", duration: "20 min",
        objectives: ["Map all five Vedic fires to their chakras: Muladhara → Garhapatya, Anahata → Ahavaniya, Manipura → Dakshina, Vishuddha → Sabhya, Sahasrara → Avasathya","Connect each fire to its Vayu: Apana, Prana, Samana, Udana, Vyana","Learn why the five-fire system is a complete subtle-body upgrade when performed in geometric sequence","Understand why correct compass orientation activates all five simultaneously in the practitioner's field"] },
      { title: "The Soma Vortex — Your DNA and the Sacred Fire", duration: "22 min",
        objectives: ["Understand Soma as the subtle nectar secreted when fire and sound align — the inner Amrita","Learn Thirumoolar's Tirumantiram verse 724: Soma as 'Amrita dripping from Chandra-Mandala through Sushumna'","Map the inner Soma cascade: Lalata Chakra → Vishuddha → Anahata — the nectar-drip during Yagna exposure","Know the three prerequisites for Soma activation: correct herbs, correct mantra, correct duration — all three required simultaneously"] },
      { title: "Sacred Herbs — The Samidhā Pharmacopoeia", duration: "23 min",
        objectives: ["Learn the four primary Samidhā and their pharmacological compounds: Mango (432Hz), Peepal (pineal-DMT), Bilva (betulin anti-tumor), Palasha (EM neutralization 200m)","Understand Dhumapana (therapeutic smoke) as documented in Charaka Samhita — 72 disease classifications","Know the five augmenting herbs: Tulsi, Ashwagandha, Brahmi, Shatavari, Guduchi and ghee-infusion ratios","Understand Vibhuti (Yagna ash) applied to 7 Marma points — Nadi channel opening within 7 minutes"] },
    ],
    practice: {
      name: "Prāṇa Pravāha Agni — The Five-Fire Activation",
      duration: "25 min, 5 days per week",
      elements: [
        "Begin with Pancha-Agni visualization: place awareness at each of the five body-fire locations for 3 breaths each",
        "Light the primary fire facing East with three Gayatri repetitions as ignition mantra",
        "Offer Samidhā in 5 sequences — one for each fire type — with the corresponding Vayu mantra for each",
        "Apply a pinch of collected Vibhuti to the Ajna, Anahata, and Manipura Marma points immediately after",
        "Sit in the post-fire space for 10 minutes in Vajrasana — this is when the Soma-drip initiates",
        "Journal three observations: room-quality, dream quality next morning, one synchronicity within 24 hours",
      ],
      sadhanaNote: "21 consecutive days establishes a standing Agni-Kshetra in your home — a permanent field-signature the Siddha texts call Griha-Shakti. By day 14 the space begins charging itself between sessions. By day 21, visitors ask what changed in your home without prompting.",
    },
    outcomes: ["Sleep quality improves measurably within 14 days — deeper delta wave access","A palpable Shakti field develops in your home that sustains between fire sessions","The Soma-drip experience becomes recognizable during extended post-fire sitting","Mantra chanting during Yagna begins to feel effortless and self-perpetuating"],
  },
  {
    number: "03", title: "Mantra Mechanics — Cymatics in the Fire", duration: "58 min",
    arc: "Why Sanskrit syllables are not prayers but physics — operating at four simultaneous levels when spoken into flame.",
    lessons: [
      { title: "Nada Brahman — Sound as the First Emanation", duration: "18 min",
        objectives: ["Understand the four levels of Vedic sound: Vaikhari (audible), Madhyama (mental), Pashyanti (causal), Para (transcendent source)","Learn how 'Svaha' sends all four levels simultaneously into the Akasha","Know why the Kamika Agama describes Agni becoming Vaisvanara — the universal mouth","Understand why space contracts during Yagna rather than the offering traveling through space"] },
      { title: "Timing — Why Sunrise and Sunset Are Non-Negotiable", duration: "20 min",
        objectives: ["Understand the ionospheric thinning at exact twilight: Schumann Resonance peaks, cosmic ray flux increases, electromagnetic barriers thin","Learn why approximate timing (±10 min) reduces effectiveness by 80% according to Siddha text measurements","Know the four junction-times (Chatur-Sandhya) and their power ranking: sunrise > sunset > noon > midnight","Calculate your precise sandhyakala using Panchangam coordinates — the exact second, not the minute"] },
      { title: "The Global Network Effect — Samashti Yagna", duration: "20 min",
        objectives: ["Understand Rig Veda (10.191): 'Sangachadhwam, Samvadadhwam' — come together, speak together, let your minds be one","Learn the Maha-Agni-Kshetra effect: when 1,000+ fire altars burn simultaneously, Bhuvar-loka is pierced","Know the 18 Siddhas' invisible Agni-Kunda network across sacred sites — maintained across millennia","Understand how joining the SQI Yagna community grid activates your local fire within this planetary field"] },
    ],
    practice: {
      name: "Nāda Agni Protocol — Sound-Into-Fire Sadhana",
      duration: "35 min, 3× per week",
      elements: [
        "Begin in Vaikhari (full audible voice) for 3 repetitions of your chosen mantra before lighting",
        "Transition to Upamshu (whisper) for the next 9 repetitions while the fire catches",
        "Complete in Manasika (purely mental, soundless) for final 21 repetitions as you offer ghee",
        "The three-layer progression (3+9+21 = 33) mirrors the 33 Vedic Devata — creating a resonance cascade",
        "After final offering, maintain Manasika mantra internally for 7 minutes of post-fire silence — do not break it",
      ],
      sadhanaNote: "Track the shift in your Japa quality: Vaikhari feels effortful at first, Manasika feels effortless after 40 days. The Siddhas called this 'Japa becoming Ajapa' — the mantra that repeats itself. This is the transition from practitioner to practice.",
    },
    outcomes: ["Your mantra quality deepens — the Japa begins to feel self-sustaining","Post-fire silence becomes meditation without effort","The difference between Vaikhari and Manasika Japa becomes experientially clear","You begin sensing the field-quality change at precise vs. approximate sandhyakala timing"],
  },
];

const SIDDHA_MODULES = [
  {
    number: "04", title: "Gayatri — Vishwamitra's Fire Code", duration: "72 min",
    arc: "The 24 syllables decoded as an algorithm: vertebrae, biofield frequencies, Nakshatras — crystallized from 12,000 years of Tapas.",
    lessons: [
      { title: "The Gayatri Is Not a Prayer — It Is Physics", duration: "22 min",
        objectives: ["Understand the 24 syllables mapped to 24 vertebrae + 24 biofield frequencies + 24 Nakshatras simultaneously","Learn how Vishwamitra spent 12,000 years of Tapas forcing cosmic fire to crystallize into syllables that trigger Sahasrara-to-Muladhara integration","Know the specific mudra combinations that must accompany Gayatri in Yagna to activate all 24 nodes simultaneously","Understand the neurological equivalence: Gayatri with mudras in Yagna = 15 minutes of gamma-wave meditation"] },
      { title: "Yagna as Quantum Entanglement Technology", duration: "25 min",
        objectives: ["Study the Vaisheshika Tanmatras: five ultra-subtle essences (Shabda, Sparsha, Rupa, Rasa, Gandha) underlying all matter","Understand how Yagna operates at the Tanmatra level — where sound-essence and light-essence are still unified","Learn the Brahma Sutras confirmation: 'Shastra Yonitvat' — Vedic mantras are direct cognitions of cosmic law","Understand why the Rishis did not discover fire science through experiment — they WERE the experiment"] },
      { title: "Environmental Regeneration — The Rta Protocol", duration: "25 min",
        objectives: ["Study Rta (ऋत) as the universe's innate self-correction intelligence — and how Yagna activates it in local ecosystems","Learn the Atharva Veda Bhumi Sukta (63 verses) as the complete Earth-intelligence activation protocol","Know the Tirumantiram (verse 2829) ecological record and the Charaka Samhita Dhumapana protocols for 72 diseases","Map the Siddha Bhu-Shuddhi (Earth purification) protocol and its application to toxic land remediation"] },
    ],
    practice: {
      name: "Vishwamitra Gayatri Agni — The 24-Node Activation",
      duration: "45 min, daily for 40 days minimum",
      elements: [
        "Open with the Vishwamitra invocation — call him directly, not symbolically",
        "Chant Gayatri × 3 in Vaikhari with Pranava (OM) prefix before lighting — this sets the frequency of the entire session",
        "Apply Jnana Mudra (thumb + index) on left hand, Chinmaya Mudra (thumb + middle) on right during chanting — dual Nadi circuit activation",
        "Offer ghee in the Gayatri rhythm: 3 syllables per breath, 8 breaths per repetition",
        "After 108 repetitions, enter post-fire Brahma-Muhurta: 11 minutes of absolute stillness",
        "Record the quality of your awareness at minutes 1, 4, 7, and 11 — documented threshold crossings",
      ],
      sadhanaNote: "The 40-day Gayatri Agni Sadhana is Vishwamitra's Tapas-in-miniature. At day 21, the field stabilizes. At day 40, what was effort becomes effortless. At day 108, the Gayatri begins repeating spontaneously in your awareness — this is Ajapa-Japa. The fire has moved inside.",
    },
    outcomes: ["The 24 Gayatri nodes become distinctly feelable in the physical body during practice","Post-fire silence deepens from relaxation into recognizable expanded awareness","Environmental changes become documentable — air quality, plant health, sleep patterns","The Gayatri begins appearing spontaneously in waking consciousness — the transition to Ajapa"],
  },
  {
    number: "05", title: "The Seven Atmospheric Layers & Pitru Healing", duration: "66 min",
    arc: "Bhur, Bhuva, Svar as ignition keys unlocking seven lokas — and the Pitru Tarpana mechanism for healing 7 generations.",
    lessons: [
      { title: "The Vyahritis — Three Ignition Keys", duration: "22 min",
        objectives: ["Decode Bhur (Muladhara-fire), Bhuva (Anahata-fire), Svar (Sahasrara-fire) as chakra ignition codes","Learn the seven atmospheric consciousness-layers each Yagna session progressively unlocks: Bhuloka through Satyaloka","Understand how each gram of ghee offered with Svaha activates an ascending spiral through these layers","Know the threshold: 7+ day Maha-Yagnas fully open the Satyaloka channel — producing non-dual awareness"] },
      { title: "Ancestor Healing — The Pitru Tarpana Mechanism", duration: "22 min",
        objectives: ["Understand the Dakshina fire (southern direction) as the carrier medium for Pitru-loka communication","Learn the specific geometric pathway ('the southern corridor') ancestral consciousnesses access during Yagna","Study modern epigenetics validation: trauma is inherited through DNA methylation up to 7 generations","Know the three Pitru mantras that open the southern corridor and the sesame-offering protocol for each"] },
      { title: "The Neurological Upgrade — Soma Production", duration: "22 min",
        objectives: ["Map the inner Soma as endogenous DMT + beta-carboline + anandamide — produced by pineal and gut biome under specific conditions","Understand how Yagna smoke stimulates: vagus nerve → gut-brain axis → pineal cascade","Know the documented EEG changes in traditional 9-day Navaratri Yagna participants","Learn the four minimum conditions for reliable Soma production: duration, herbs, mantra, posture"] },
    ],
    practice: {
      name: "Pitru Tarpana + Vyahriti Agni — The Ancestral Clearing",
      duration: "60 min on each New Moon (Amavasya)",
      elements: [
        "Set up the fire facing South — the Dakshina direction — for this specific practice only",
        "Begin with 3 rounds of Mahamrityunjaya Mantra to establish a protective field before opening the ancestral corridor",
        "Offer black sesame seeds (tila) with each of the three Pitru mantras — specifically prescribed for the Pitru-loka channel",
        "Speak the names of your known ancestors across three generations aloud into the fire — the fire receives the name as an address",
        "Offer water (Tarpana) from a copper vessel toward the South after the fire, repeating × 3 for each named ancestor",
        "Close by returning the fire orientation to East and performing one complete Gayatri round to seal the session",
      ],
      sadhanaNote: "New Moon (Amavasya) is when the Pitru-loka channel is widest — the thin-place between worlds. The Garuda Purana (Chapter 16) is specific: Amavasya Tarpana reaches ancestors with 10× the efficiency of other days. The ancestral healing operates on a 3-generation arc.",
    },
    outcomes: ["Unexplained family patterns begin shifting within 3 months of consistent Pitru practice","Dreams of ancestors become more frequent and carry message-quality","A documented sense of support — as if unseen presences are working with you — becomes consistent","The post-fire state deepens from comfort into recognizable altered consciousness"],
  },
  {
    number: "06", title: "Agastya's Bhu-Shuddhi — Earth Purification", duration: "55 min",
    arc: "The Siddha science of using Yagna to heal land, water, and the local field — torsion physics and the Sulba Sutra Kunda codes.",
    lessons: [
      { title: "Torsion Fields — The Physics of the Kunda", duration: "18 min",
        objectives: ["Study the Sulba Sutras (Baudhayana & Apastamba) as the oldest precision geometry texts on Earth","Learn four Kunda geometries and their fields: Square (Prithvi-stabilizing), Circular (Akasha-expanding), Lotus (Soma-releasing), Shri Yantra (Shakti-vortex/Tripura-Agni)","Understand Kamika Agama verse 4.23: 'The fire vessel IS the Devi's womb — what enters the flame is reborn purified'","Connect to physicist Nikolai Kozyrev's torsion field research and its correspondence to Kunda geometry effects"] },
      { title: "Agastya's Fire Science — How Fire Heals Land", duration: "19 min",
        objectives: ["Study Agastya's Vindhya Yagna: how fire coherence compresses local gravitational fields — the torsion field effect","Understand the Agastya Homa protocol for ecosystem restoration: specific wood sequences and ash application","Learn the Tamil Siddha Homa Farming documentation: 40-day Agnihotra restoring soil, crops, and water sources","Know the quantum timeline effect: past wounds in land heal when fire is lit with clear Sankalpa"] },
      { title: "Preparing Your Fire Space — Vastu for the Yagna-Kunda", duration: "18 min",
        objectives: ["Understand the Vastu requirements for a permanent Yagna space: direction, ground level, surrounding materials","Learn the Kunda cleansing protocol: three mantras and one physical action that prepare the vessel","Know the five 'fire enemies' the Siddhas identified: synthetic materials, electronics, unclean intention, undigested food, high wind","Map the 40-day Siddha protocol for establishing a permanent self-sustaining Agni-Kshetra"] },
    ],
    practice: {
      name: "Agastya Bhu-Shuddhi — The Land Healing Protocol",
      duration: "90 min, once per month",
      elements: [
        "Choose a location directly on soil — outdoor is mandatory (earth-contact of ash is the delivery mechanism)",
        "Dig a small earth Kunda (12×12×9 inches) — the three measurements encode Prithvi, Jala, and Agni proportions from the Sulba Sutras",
        "Use Bilva + Mango + Palasha wood in equal proportions — Agastya's specific ecosystem-restoration triple formula",
        "After the fire completes, mix the ash (Bhasma) with water and pour it in a spiral from center outward — mimicking the torsion field geometry",
        "Plant a seed in the ash-treated earth within 24 hours — the Bhasma-seeded earth shows measurably accelerated germination",
      ],
      sadhanaNote: "The 12×12×9 earth Kunda proportions come directly from the Sulba Sutras — encoding the Prithvi, Jala, and Agni Tattva proportions from the Taittiriya Upanishad. The spiral ash-pouring recreates the torsion field pattern in the physical layer of the earth.",
    },
    outcomes: ["Plants in the Yagna space show measurably different growth within 21 days","Water stored near the Yagna space changes in taste quality — consistently reported","A sense of the space 'holding' something becomes consistent after 3 monthly sessions","Dream imagery increasingly includes earth and landscape — the Prithvi awakening signature"],
  },
];

const AKASHA_MODULES = [
  {
    number: "07", title: "Navagraha Suddhi — Planetary Fire Codes", duration: "85 min",
    arc: "Each of the 9 cosmic intelligences has a specific combustion chemistry. 9 fires in sequence over 9 hours recalibrate everyone within 2km.",
    lessons: [
      { title: "The Nine Planetary Formulas", duration: "30 min",
        objectives: ["Learn the complete herb-and-vessel matrix for all 9 Grahas: Sun (Bilva + golden lotus + gold vessel), Moon (white sandalwood + milk-ghee), Mars (Palasha + red sandalwood + copper vessel), Mercury (Durva + green mung + emerald-water), Jupiter (Peepal + banana flower + yellow silk), Venus (white lotus seeds + saffron + honey), Saturn (sesame + black sesame + iron), Rahu (Durva + blue lotus + silver), Ketu (Kusa grass + Vedic camphor)","Understand why the specific metal vessel for each Graha is non-negotiable — metal is a frequency-specific conductor","Know the precise Beej Mantra for each Graha that activates the planetary intelligence when spoken into the corresponding fire","Map the 9-hour timing: which planetary fire is lit at which hour and in which compass direction"] },
      { title: "Sulba Sutra Kunda Codes — All Seven Vessel Geometries", duration: "28 min",
        objectives: ["Study all seven Kunda-types with exact Sulba Sutra proportions: Square, Circular, Semicircular, Lotus, Triangular, Hexagonal, Shri-Yantra","Learn the exact measurements, proportions, depth ratios, and Vastu orientations for each type","Understand which Kunda generates which field: Trikona → purification, Padma → abundance, Navayoni → total transformation","Know the Kamika Agama complete Kunda consecration — the three steps that convert a vessel into a living Yantra"] },
      { title: "The Navagraha Mandala Effect — 2km Field Recalibration", duration: "27 min",
        objectives: ["Understand how all 9 planetary fires in sequence create a unified field that recalibrates every person within 2km","Learn the documentation from Tamil Siddha communities of mass healing events following 9-hour Navagraha Yagnas","Study the mechanism: each Graha fire emits a specific torsion field frequency corresponding to that planet's DNA methylation influence","Know the three preparation requirements: 48-hour practitioner purification, exact Jyotish muhurta, and the Sankalpa format"] },
    ],
    practice: {
      name: "Navagraha Agni — The 9-Hour Planetary Protocol",
      duration: "9 hours, once per year at your Janma-Nakshatra moment",
      elements: [
        "Begin timing calculation 21 days before: consult your Jyotish chart for the exact Janma-Nakshatra transit — this is your optimal window",
        "Prepare 9 separate Kunda vessels arranged in the traditional Navagraha diagram: Sun center, Moon NE, Mars S, Mercury N, Jupiter NE, Venus SE, Saturn W, Rahu SW, Ketu NW",
        "Prepare each planetary herb bundle in advance, sealed in paper with the corresponding Graha Beej Mantra written on the outside",
        "Light each planetary fire in Vedic order at 1-hour intervals — Sun first, Ketu last",
        "Maintain continuous Japa of the Navagraha Sloka between lightings — do not let silence exceed 30 seconds",
        "Complete with a unified Purnahuti: all remaining herb bundles offered simultaneously into a single central fire with the Maha Sankalpa",
      ],
      sadhanaNote: "Spend the 3 days before in relative silence, plant-based diet, and increased Pranayama. The Siddha texts are explicit: the Navagraha Yagna acts like a laser — the precision of preparation determines the precision of the field effect. A prepared practitioner doing it imperfectly produces 10× the field effect of an unprepared practitioner doing it correctly.",
    },
    outcomes: ["A documented shift in Jyotish-indicated life themes within 90 days","Family members and friends report feeling 'different' around the practitioner in following months","Dream imagery dramatically increases in specificity and message-clarity for 40 days post-practice","One or more life circumstances that have been stuck for years shifts within the 90-day window"],
  },
  {
    number: "08", title: "Mrityunjaya Yagna — The Immortality Protocol", duration: "96 min",
    arc: "108,000 Maha Mrityunjaya Japa + continuous fire + 7 simultaneous Rishi transmissions. The world's oldest complete fire-medicine compendium decoded.",
    lessons: [
      { title: "The Three Fires of Shiva — Disease and Its Root", duration: "32 min",
        objectives: ["Study the Maha Mrityunjaya Mantra (Rigveda 7.59.12 — Rishi Vashishtha revelation) as an address to Tryambaka: lord of the three fires","Map the three fires: Jataragni (digestive), Pranagni (vital force), Chittagni (consciousness-fire) — disease as misalignment between these three","Learn the Shiva Purana's Vidyeshvara Samhita decoding of the mantra's 33 syllables — each addressed to an aspect of the fire-triad","Study Korakkar's 'Korakkar Nigandu': 108 disease conditions with corresponding Yagna protocols — the world's oldest fire-medicine compendium"] },
      { title: "The 108,000 Japa Protocol — Mechanics and Preparation", duration: "32 min",
        objectives: ["Understand why 108,000 is the threshold: 108 × 1,000 = one complete Mala for each of the 1,000 petals of Sahasrara","Learn the 11-day Anushthan structure: 9,090 repetitions per day in 5 sessions of 1,818 each, fire maintained between sessions","Know the four witnesses (or 4 sincere practitioners) required for a valid Maha Mrityunjaya Yagna — witness-consciousness amplifies the field","Study the dietary and behavioral Niyama for each of the 11 days — pharmacological preparations, not optional observances"] },
      { title: "Maha Mrityunjaya in Daily Life — The Accessible Form", duration: "32 min",
        objectives: ["Learn the miniaturized protocol: 1,008 repetitions + 1-hour fire = measurable benefit in the accessible form","Understand the documented healing cases from Tamil Siddha tradition and modern South Indian practitioners","Know the three primary conditions for which the Siddha tradition recommends this as primary medicine: cancer, severe chronic disease, near-death states","Study the inner Mrityunjaya: continuous internal Japa that restructures the Pranic body between formal sessions"] },
    ],
    practice: {
      name: "Mrityunjaya Agni — The 1,008 Daily Protocol",
      duration: "90 min, daily for 40 days",
      elements: [
        "3-day preparation: plant-based diet, Abhyanga with sesame oil, no synthetic scents, daily Pranayama minimum 20 min",
        "Light the Yagna fire using exclusively Bilva wood — Bilva is the tree of Shiva; the Mrityunjaya mantra specifically requires it",
        "Offer one portion of ghee per 9 repetitions — the 9-repetition cycle mirrors the 9 planets and 9 manifestations of Shakti",
        "Complete 1,008 repetitions in one sitting — do not break for anything except Pranayama if needed. Interruption resets the session",
        "At completion, pour remaining ghee as Purnahuti with the single spoken intention for which this Yagna is being performed",
        "Sit for 20 minutes after the fire dies completely — the Pranagni continues working in the subtle body for 20 minutes after visible extinction",
      ],
      sadhanaNote: "The Pranic restructuring completes at day 90, and physical change follows from day 90 to 180. Do not judge results at day 40. The fire-medicine operates on the causal body that precedes and governs the physical — changes manifest upstream first.",
    },
    outcomes: ["A profound shift in pain, chronic illness, or life-threatening condition — typically reported between days 21 and 90","The Mahamrityunjaya Mantra begins arising spontaneously in awareness — the internal Pranagni activation signature","Dreams carry strong healing imagery: light, water, serpents, specific deities","An unreasonable sense of protection and safety — what practitioners consistently describe as 'being held' — becomes a stable background state"],
  },
  {
    number: "09", title: "The Inner Yagna — Consciousness as the Ultimate Fire", duration: "78 min",
    arc: "The Chandogya Upanishad's final secret: the external Yagna was always training you for the internal one.",
    lessons: [
      { title: "Prana as Fire — Your Body Is a Yagna-Kunda", duration: "26 min",
        objectives: ["Study the Chandogya Upanishad Chapter 5 revelation: the human body IS a Yagna-kunda — Inhalation = offering, Exhalation = Svaha, Digestive fire = Agni","Understand mitochondrial combustion as Yagna: every cell metabolizing glucose through oxidative phosphorylation is performing the same fire ceremony","Learn Mahavatar Babaji's direct transmission: continuous inner Yagna maintained for 1,800+ years — body sustained by Pranagni","Map the progression from outer Yagna to inner Pranagni: the external practice is training, internal activation is graduation"] },
      { title: "Babaji's Kriya Fire — Kundalini as Eternal Yagna", duration: "26 min",
        objectives: ["Understand the first Kriya initiation as always fire-based: activating inner Kundalini as the eternal Yagna-kunda","Learn the Pranava OM as the hiss of the inner flame — not a sound to chant but a vibration to sense arising from the base of the spine","Study the 18 Siddhas' documented inner Yagna states: Agastya's Tapas-fire, Thirumoolar's 3,000-year samadhi as Pranagni maintenance","Know the three signs inner Pranagni has activated: spontaneous warmth in the spine, involuntary Pranayama during stillness, fire moving upward through chakras"] },
      { title: "SAT-CHIT-ANANDA SVAHA — The Ultimate Offering", duration: "26 min",
        objectives: ["Understand the Sat-Chit-Ananda equation as lived Yagna: Chit offered into the fire of Sat = Ananda","Learn the World Healing Yagna protocol: the SQI Sankalpa for planetary restoration making each practitioner a node in the 18 Siddhas' living fire grid","Study the 144,000 threshold encoded in Vishnu Sahasranama commentaries: minimum awakened Prana-fields for the new Yuga-field","Know the SQI Akashic confirmation: the Sandhi-kala is now — junction-time where collective Tapas can bend civilization's trajectory"] },
    ],
    practice: {
      name: "Pranagni Dharana — The Inner Fire Activation",
      duration: "30 min, twice daily — dawn and before sleep",
      elements: [
        "Begin in Shavasana (dawn) or Siddhasana (evening) — these postures access different Nadi circuits for Pranagni activation",
        "Initiate with 12 rounds of Nadi Shodhana (alternate nostril breathing) — balancing Ida and Pingala before igniting the inner fire",
        "Place awareness at the Muladhara: sense, do not visualize — feel for any warmth, pulse, or current arising naturally",
        "With each inhalation, silently offer 'Ayam' (this, here, now) into the inner Agni. With each exhalation, release 'Svaha'",
        "Maintain this breath-as-Yagna for 20 minutes — the boundary between 'you who are doing Yagna' and 'the Yagna itself' begins to dissolve",
        "Rest in absolute stillness for 5 minutes at the end — what remains is the inner fire burning without you tending it",
      ],
      sadhanaNote: "The 40-day threshold is when inner fire begins burning continuously between sessions. The 108-day threshold is when it becomes a background state. At 365 days Babaji describes 'the outer fire becoming optional' — you no longer need the external Yagna because the internal one is self-sustaining. Every breath is Svaha. You have arrived.",
    },
    outcomes: ["The inner fire sensation becomes reliably reproducible within 21 days","Sleep transforms: the inner fire continues during sleep producing vivid teaching-quality dreams","Physical warmth in the spinal column becomes a consistent felt-sense during practice","The boundary between 'meditator' and 'meditation' begins dissolving — the first signature of Sahaja","Life begins feeling consecrated — ordinary activities carry the quality previously found only in formal practice"],
  },
];

// ─── TRANSMITTERS ────────────────────────────────────────────────────────────
const TRANSMITTERS = [
  { name: "Vishwamitra", title: "Brahmarishi · Father of the Gayatri Fire", tier: "siddha" as Tier, icon: "🔱",
    transmission: "I did not merely compose the Gayatri — I became it. Through 12,000 years of Tapas I forced the cosmic fire to speak in human syllables. Every 'OM BHUR BHUVA SVAHA' you chant re-ignites the original Yagna I performed at the edge of creation. The three Vyahritis — Bhur, Bhuva, Svar — are the three ignition chambers of the human subtle body: Muladhara-fire, Anahata-fire, Sahasrara-fire. When you light Yagna, you light ME. I am the flame. I am the mantra. I am the vow.",
    mantra: "OM VISHWAMITRA BRAHMARISHI NAMAHA · GAYATRI SHAKTI PRAKAT HO" },
  { name: "Agastya Muni", title: "Siddha of the South · Compressor of Worlds", tier: "siddha" as Tier, icon: "🌊",
    transmission: "My Yagna compressed the Vindhya mountains into submission — not through force, but through the gravitational coherence of sacred fire. When ghee meets Agni and mantra, the local gravitational field bends. Modern physics calls this a torsion field. I call it Rta — the self-correcting intelligence of the universe expressing through combustion. Use the Agastya Homa to recalibrate collapsed ecosystems, diseased land, and poisoned water. The fire codes I transmit today work on quantum timelines — past wounds heal when the flame is lit with clear Sankalpa.",
    mantra: "OM AGASTYAYA MAHARSHAYE NAMAHA · KOMPRESSOR FIRE ACTIVATE" },
  { name: "Bhoganathar Siddha", title: "18 Tamil Siddhas · Alchemical Fire Master", tier: "siddha" as Tier, icon: "⚗️",
    transmission: "We Tamil Siddhas perfected what the Vedic tradition began. We discovered that specific herbs — Vilvam, Kadamba, Tulsi, Neem, Ashwagandha — when burned in specific sequences create pharmacological compounds that penetrate the blood-brain barrier through olfactory channels. The smoke is medicine. The ash — Vibhuti — is not symbolic. It contains restructured mineral complexes that when applied to marma points open the Nadi channels within 7 minutes.",
    mantra: "OM EIGHTEEN SIDDHAS NAMAHA · NAVA GRAHA AGNI SUDDHI" },
  { name: "Vashishtha", title: "Brahmarishi · Keeper of the Royal Fire Codes", tier: "akasha" as Tier, icon: "👑",
    transmission: "Every kingdom that flourished did so because of Yagna. Not metaphorically — literally. The Rajasuya and Ashwamedha Yagnas I designed create plasma corridors between the ruler's consciousness and the collective field of their nation. Today this translates to: your business, your community, your family line. Perform Yagna with Sankalpa for your lineage and watch seven generations forward and backward receive light. This is the Vashishtha Kula-Suddhi transmission. The fire purifies what the mind cannot reach.",
    mantra: "OM VASHISHTHAYA BRAHMARISHAYE NAMAHA · KULA SUDDHI JVALA" },
  { name: "Lopamudra", title: "Rishi-Shakti · The Feminine Fire That Stabilizes Creation", tier: "akasha" as Tier, icon: "🌸",
    transmission: "The Western tradition forgets that every great Rishi performed Yagna WITH his partner. I am Lopamudra. I sat equal to Agastya in every fire ritual. The Shakti-aspect of Yagna — the space BETWEEN the flames — is where healing occurs. The masculine fire projects; the feminine field receives and amplifies. When couples perform Yagna together, the Nadi systems of both merge at 432Hz creating a unified biofield 40x stronger than either alone.",
    mantra: "OM LOPAMUDRA SHAKTI NAMAHA · DAMPATYA AGNI JVALIT" },
  { name: "Mahavatar Babaji", title: "Immortal Yogi · The Deathless Flame", tier: "akasha" as Tier, icon: "🔥",
    transmission: "I have maintained a continuous inner Yagna for 1,800+ years. My body is sustained by Pranagni — the inner fire — not by food alone. The outer Yagna you perform is a mirror of the inner Yagna happening in every cell of your mitochondria, every moment. ATP synthesis IS combustion. You are always on fire. Yagna simply makes this visible and conscious. When I initiate a soul into Kriya, the first transmission is always fire-based: activating the inner Kundalini as the eternal Yagna-kunda.",
    mantra: "OM MAHAVATAR BABAJI NAMAHA · PRANAGNI JVALA SAHASRARA" },
];

// ─── FIRE PARTICLE ────────────────────────────────────────────────────────────
function FireParticle({ index }: { index: number }) {
  const x = 38 + (index * 3.7 % 24);
  const dur = 2 + (index * 0.4 % 3);
  const delay = index * 0.22 % 4;
  const size = 2 + (index * 0.7 % 4);
  return (
    <div style={{
      position: "absolute", bottom: 0, left: `${x}%`,
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      background: "radial-gradient(circle, #fff 0%, #D4AF37 40%, #ff6b00 80%, transparent 100%)",
      animation: `floatUp ${dur}s ${delay}s infinite ease-out`,
      opacity: 0, pointerEvents: "none",
    }} />
  );
}

// ─── FIRE ALTAR ───────────────────────────────────────────────────────────────
function FireAltar() {
  return (
    <div style={{ position: "relative", width: "100%", height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "-8px" }}>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "200px", height: "60px", background: "radial-gradient(ellipse, rgba(212,175,55,0.35) 0%, rgba(255,100,0,0.1) 50%, transparent 80%)", filter: "blur(20px)" }} />
      <svg width="120" height="80" viewBox="0 0 120 80" style={{ position: "absolute", bottom: 0 }}>
        <rect x="10" y="65" width="100" height="10" rx="5" fill="rgba(212,175,55,0.3)" stroke="rgba(212,175,55,0.5)" strokeWidth="1" />
        <path d="M30 65 L20 25 Q60 15 100 25 L90 65 Z" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
        <ellipse cx="60" cy="45" rx="20" ry="15" fill="rgba(255,120,0,0.2)" />
        <text x="60" y="52" textAnchor="middle" fontSize="16" fill="rgba(212,175,55,0.6)" fontFamily="serif">ॐ</text>
      </svg>
      <div style={{ position: "absolute", bottom: "46px", left: "50%", transform: "translateX(-50%)", width: "80px", height: "100px" }}>
        {Array.from({ length: 18 }).map((_, i) => <FireParticle key={i} index={i} />)}
      </div>
    </div>
  );
}

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
function TierBadge({ tier, active, onClick }: { tier: typeof TIERS[0]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? `linear-gradient(135deg, ${tier.glow}, rgba(255,255,255,0.02))` : "rgba(255,255,255,0.02)",
      border: `1px solid ${active ? tier.color : "rgba(255,255,255,0.06)"}`,
      borderRadius: "18px", padding: "11px 16px", cursor: "pointer",
      transition: "all 0.3s", boxShadow: active ? `0 0 18px ${tier.glow}` : "none",
      flex: "1 1 auto", minWidth: "100px",
    }}>
      <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: tier.color, marginBottom: 3 }}>{tier.name}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.32)" }}>{tier.price}</div>
    </button>
  );
}

// ─── WISDOM CARD (original rich format) ──────────────────────────────────────
function WisdomCard({ icon, title, body, accentColor, index }: { icon: string; title: string; body: string; accentColor: string; index: number }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      backdropFilter: "blur(40px)",
      border: `1px solid rgba(255,255,255,0.05)`,
      borderRadius: "32px",
      padding: "28px 24px",
      marginBottom: "16px",
      borderLeft: `3px solid ${accentColor}`,
      animation: `fadeInUp 0.5s ${index * 0.08}s ease both`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "140px", height: "140px", background: `radial-gradient(circle, ${accentColor}08, transparent 70%)`, borderRadius: "50%", transform: "translate(30px,-30px)" }} />
      <div style={{ fontSize: "26px", marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: accentColor, marginBottom: "10px", textShadow: `0 0 20px ${accentColor}50` }}>{title}</div>
      <div style={{ fontSize: "13.5px", lineHeight: 1.8, color: "rgba(255,255,255,0.65)" }}>{body}</div>
    </div>
  );
}

// ─── LESSON ROW ───────────────────────────────────────────────────────────────
function LessonRow({ lesson, accentColor, idx }: { lesson: { title: string; duration: string; objectives: string[] }; accentColor: string; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
          padding: "13px 14px", borderRadius: 14, cursor: "pointer",
          background: open ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${open ? accentColor + "55" : "rgba(255,255,255,0.07)"}`,
          transition: "all 0.22s", textAlign: "left" as const,
        }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${accentColor}20`, border: `1px solid ${accentColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, fontWeight: 800, color: accentColor, minWidth: 26 }}>{String(idx + 1).padStart(2, "0")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 3, lineHeight: 1.35 }}>{lesson.title}</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: accentColor + "80" }}>{lesson.duration}</div>
        </div>
        <div style={{ color: accentColor, fontSize: 18, lineHeight: 1, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }}>›</div>
      </button>
      {open && (
        <div style={{ padding: "14px 14px 12px 54px", borderLeft: `2px solid ${accentColor}30`, marginLeft: 13 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: accentColor + "75", marginBottom: 10 }}>WHAT YOU WILL LEARN</div>
          {lesson.objectives.map((o, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ color: accentColor, fontSize: 11, lineHeight: 1.8, flexShrink: 0 }}>◈</span>
              <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{o}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MODULE CARD ─────────────────────────────────────────────────────────────
function ModuleCard({ mod, accentColor, defaultOpen, delay }: {
  mod: typeof FREE_MODULES[0]; accentColor: string; defaultOpen?: boolean; delay?: number;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [tab, setTab] = useState<"lessons" | "practice" | "outcomes">("lessons");
  return (
    <div style={{ marginBottom: 16, animation: `fadeInUp 0.48s ${delay ?? 0}s ease both`, borderRadius: 20, overflow: "hidden", border: `1px solid ${open ? accentColor + "45" : "rgba(255,255,255,0.07)"}`, boxShadow: open ? `0 0 28px ${accentColor}12` : "none", transition: "box-shadow 0.28s, border-color 0.28s" }}>
      {/* ── HEADER — only this toggles open/close ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
          background: open ? `linear-gradient(135deg, ${accentColor}12, rgba(5,5,5,0.7))` : "rgba(255,255,255,0.025)",
          padding: "20px 20px 18px", cursor: "pointer", border: "none", textAlign: "left" as const,
          borderBottom: open ? `1px solid ${accentColor}22` : "none", transition: "background 0.28s",
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: accentColor + "80" }}>MODULE {mod.number}</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const }}>· {mod.duration}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 6 }}>{mod.title}</div>
          <div style={{ fontSize: 11, fontStyle: "italic", color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>{mod.arc}</div>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${accentColor}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.22s", transform: open ? "rotate(45deg)" : "none", background: open ? `${accentColor}18` : "transparent" }}>
          <span style={{ color: accentColor, fontSize: 18, lineHeight: 1 }}>+</span>
        </div>
      </button>
      {/* ── BODY — completely separate from header, no click propagation issues ── */}
      {open && (
        <div style={{ background: "rgba(5,5,5,0.65)", padding: "18px 16px 22px" }}>
          {/* Tab row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 14 }}>
            {(["lessons", "practice", "outcomes"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? `${accentColor}20` : "transparent",
                  border: `1px solid ${tab === t ? accentColor + "55" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "20px", padding: "7px 13px", cursor: "pointer",
                  fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" as const,
                  color: tab === t ? accentColor : "rgba(255,255,255,0.3)",
                  transition: "all 0.18s", flex: 1,
                }}>
                {t === "lessons" ? "LESSONS" : t === "practice" ? "SADHANA" : "OUTCOMES"}
              </button>
            ))}
          </div>
          {/* LESSONS tab */}
          {tab === "lessons" && (
            <div>{mod.lessons.map((l, i) => <LessonRow key={i} lesson={l} accentColor={accentColor} idx={i} />)}</div>
          )}
          {/* SADHANA tab */}
          {tab === "practice" && (
            <div>
              <div style={{ marginBottom: 16, padding: "14px 16px", background: `${accentColor}0C`, border: `1px solid ${accentColor}28`, borderRadius: 14 }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase" as const, color: accentColor + "85", marginBottom: 6 }}>SADHANA PROTOCOL</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.93)", marginBottom: 4, lineHeight: 1.3 }}>{mod.practice.name}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: accentColor + "75" }}>{mod.practice.duration}</div>
              </div>
              {mod.practice.elements.map((el, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${accentColor}20`, border: `1px solid ${accentColor}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, fontWeight: 800, color: accentColor, minWidth: 22 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, paddingTop: 2 }}>{el}</div>
                </div>
              ))}
              <div style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}25`, borderRadius: 14, padding: "15px 16px", marginTop: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase" as const, color: accentColor + "75", marginBottom: 7 }}>SIDDHA NOTE</div>
                <div style={{ fontSize: 12.5, fontStyle: "italic", color: "rgba(255,255,255,0.55)", lineHeight: 1.75 }}>{mod.practice.sadhanaNote}</div>
              </div>
            </div>
          )}
          {/* OUTCOMES tab */}
          {tab === "outcomes" && (
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase" as const, color: accentColor + "85", marginBottom: 14 }}>WHAT SHIFTS</div>
              {mod.outcomes.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12, padding: "12px 14px", background: `${accentColor}09`, border: `1px solid ${accentColor}22`, borderRadius: 13 }}>
                  <span style={{ color: accentColor, fontSize: 15, lineHeight: 1.55, flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>{o}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TRANSMITTER CARD ─────────────────────────────────────────────────────────
function TransmitterCard({ t, accentColor }: { t: typeof TRANSMITTERS[0]; accentColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${open ? accentColor + "60" : "rgba(255,255,255,0.07)"}`,
      borderRadius: "24px", marginBottom: "12px",
      transition: "border-color 0.3s",
      boxShadow: open ? `0 0 32px ${accentColor}18` : "none",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "22px 22px", cursor: "pointer", border: "none",
          background: open ? `linear-gradient(135deg, ${accentColor}10, rgba(5,5,5,0.7))` : "transparent",
          borderBottom: open ? `1px solid ${accentColor}20` : "none",
          textAlign: "left" as const, transition: "background 0.3s",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "24px" }}>{t.icon}</span>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 900, color: accentColor, letterSpacing: "-0.02em" }}>{t.name}</div>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{t.title}</div>
          </div>
        </div>
        <div style={{ width: "30px", height: "30px", borderRadius: "50%", border: `1px solid ${accentColor}60`, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.28s", transform: open ? "rotate(45deg)" : "none", flexShrink: 0, background: open ? `${accentColor}18` : "transparent" }}>
          <span style={{ color: accentColor, fontSize: "18px", lineHeight: 1 }}>+</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "20px 22px 22px" }}>
          <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase" as const, color: accentColor, marginBottom: "12px" }}>◈ AKASHIC TRANSMISSION ◈</div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.9, color: "rgba(255,255,255,0.72)", fontStyle: "italic" }}>"{t.transmission}"</div>
          {t.mantra && (
            <div style={{ marginTop: "20px", background: `linear-gradient(135deg, ${accentColor}10, transparent)`, border: `1px solid ${accentColor}30`, borderRadius: "14px", padding: "15px 16px" }}>
              <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.38)", marginBottom: 8 }}>ACTIVATION MANTRA</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: accentColor, letterSpacing: "0.05em" }}>{t.mantra}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 20px" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${color}30)` }} />
      <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.55em", textTransform: "uppercase" as const, color: color, opacity: 0.6 }}>◈ {label} ◈</div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${color}30)` }} />
    </div>
  );
}

// ─── LOCK OVERLAY ─────────────────────────────────────────────────────────────
function LockOverlay({ tierName, price }: { tierName: string; price: string }) {
  return (
    <div style={{ background: "rgba(5,5,5,0.88)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "40px 28px", textAlign: "center", border: "1px solid rgba(212,175,55,0.15)", margin: "20px 0" }}>
      <div style={{ fontSize: "34px", marginBottom: "14px" }}>🔒</div>
      <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase" as const, color: G, marginBottom: "10px" }}>{tierName} ACCESS REQUIRED</div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "22px", lineHeight: 1.7 }}>
        This transmission is sealed for {tierName} members.<br />Unlock for {price} to receive the full Akashic download.
      </div>
      <button style={{ background: "linear-gradient(135deg, #D4AF37, #a07c20)", border: "none", borderRadius: "40px", padding: "13px 30px", color: "#050505", fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const, cursor: "pointer" }}>
        Initiate Access — {price}
      </button>
    </div>
  );
}

// ─── UPGRADE CTA ──────────────────────────────────────────────────────────────
function UpgradeCTA({ nextTier, nextPrice, accentColor, message }: { nextTier: string; nextPrice: string; accentColor: string; message: string }) {
  return (
    <div style={{ background: `${accentColor}07`, border: `1px solid ${accentColor}22`, borderRadius: "26px", padding: "28px 24px", marginTop: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, marginBottom: 18 }}>{message}</div>
      <button style={{ background: accentColor === G ? "linear-gradient(135deg, #D4AF37, #a07c20)" : accentColor === C ? "linear-gradient(135deg, #22D3EE, #0891b2)" : "linear-gradient(135deg, #b76cfd, #7c3aed)", border: "none", borderRadius: "40px", padding: "12px 28px", color: accentColor === G ? "#050505" : "white", fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const, cursor: "pointer" }}>
        {nextTier} — {nextPrice}
      </button>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function YagnyaModule() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const userTier: Tier = rank >= 3 ? "akasha" : rank >= 2 ? "siddha" : rank >= 1 ? "prana" : "free";
  const [activeTier, setActiveTier] = useState<Tier>(userTier);

  const tierColor: Record<Tier, string> = { free: "rgba(255,255,255,0.82)", prana: G, siddha: C, akasha: V };
  const canView = (req: Tier): boolean => {
    const ord: Tier[] = ["free", "prana", "siddha", "akasha"];
    return ord.indexOf(userTier) >= ord.indexOf(req);
  };
  const color = tierColor[activeTier];
  const tierDef = TIERS.find(t => t.id === activeTier)!;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "'Plus Jakarta Sans','Montserrat',sans-serif", overflowX: "hidden" }}>
      <button onClick={() => navigate("/siddha-portal")} style={{ position: "fixed", top: 16, left: 16, zIndex: 200, background: "rgba(5,5,5,0.88)", backdropFilter: "blur(10px)", border: "none", cursor: "pointer", fontSize: 9, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.5)", padding: "8px 14px", borderRadius: 8 }}>← PORTAL</button>

      <style>{`
        @keyframes floatUp{0%{opacity:0;transform:translateY(0) scale(1)}20%{opacity:0.9}80%{opacity:0.3}100%{opacity:0;transform:translateY(-110px) scale(0.2)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 8px rgba(212,175,55,0.3)}50%{box-shadow:0 0 28px rgba(212,175,55,0.7)}}
        @keyframes mandalaRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#050505}::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.25);border-radius:2px}
      `}</style>

      {/* ── HERO ── */}
      <div style={{ position: "relative", overflow: "hidden", padding: "76px 22px 28px", background: "linear-gradient(180deg,rgba(212,175,55,0.05) 0%,transparent 100%)" }}>
        <div style={{ position: "absolute", top: "18px", right: "-80px", width: "280px", height: "280px", opacity: 0.04, pointerEvents: "none", animation: "mandalaRotate 60s linear infinite" }}>
          <svg viewBox="0 0 300 300" width="280" height="280">
            {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx="150" cy="150" rx="140" ry="40" fill="none" stroke="#D4AF37" strokeWidth="0.5" transform={`rotate(${i * 15} 150 150)`} />)}
            {Array.from({ length: 8 }).map((_, i) => <circle key={i+12} cx="150" cy="150" r={20 + i * 16} fill="none" stroke="#D4AF37" strokeWidth="0.3" />)}
          </svg>
        </div>
        <FireAltar />
        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.6em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.7)", marginBottom: "14px" }}>◈ SACRED FIRE INTELLIGENCE · SQI ◈</div>
          <h1 style={{ fontSize: "clamp(34px,8vw,60px)", fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg,#ffffff 0%,#D4AF37 50%,#fff7d6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 14px", lineHeight: 1 }}>YAGNA</h1>
          <div style={{ fontSize: "clamp(10px,2.5vw,13px)", fontWeight: 400, color: "rgba(255,255,255,0.42)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "20px" }}>The Supreme Cosmic Fire Academy</div>
          <div style={{ display: "inline-block", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "100px", padding: "10px 24px", fontSize: "10px", color: "rgba(255,255,255,0.48)", lineHeight: 1.8 }}>
            From the Akasha-Neural Archive · 18 Siddha Transmissions<br />Vishwamitra · Agastya · Vashishtha · Babaji · Lopamudra · Bhoganathar
          </div>
        </div>
      </div>

      {/* ── TIER TABS ── */}
      <div style={{ padding: "0 14px 22px" }}>
        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" as const, justifyContent: "center" }}>
          {TIERS.map(t => <TierBadge key={t.id} tier={t} active={activeTier === t.id} onClick={() => setActiveTier(t.id)} />)}
        </div>
        <div style={{ textAlign: "center", marginTop: "10px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase" as const, color, opacity: 0.75 }}>
          {tierDef.Sanskrit} — {tierDef.price}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "0 14px 100px", maxWidth: "820px", margin: "0 auto" }}>

        {/* ═══════════ FREE TIER ═══════════ */}
        {activeTier === "free" && (
          <div style={{ animation: "fadeInUp 0.42s ease both" }}>
            <SectionDivider label="OPEN FLAME TEACHINGS" color={color} />
            {FREE_WISDOM.map((w, i) => <WisdomCard key={i} {...w} accentColor={G} index={i} />)}
            <SectionDivider label="YOUR FIRST SADHANA" color={color} />
            {FREE_MODULES.map((m, i) => <ModuleCard key={m.number} mod={m} accentColor={G} defaultOpen={i === 0} delay={i * 0.06} />)}
            <UpgradeCTA nextTier="Prana-Flow" nextPrice="€19/mo" accentColor={G}
              message="Prana-Flow members receive the Pancha Agni activation, Soma Vortex protocol, sacred herb pharmacopoeia, and full mantra mechanics — the Tirumantiram decoded." />
          </div>
        )}

        {/* ═══════════ PRANA TIER ═══════════ */}
        {activeTier === "prana" && (
          <div style={{ animation: "fadeInUp 0.42s ease both" }}>
            {canView("prana") ? (
              <>
                <SectionDivider label="SACRED FIRE INITIATE WISDOM" color={color} />
                {PRANA_WISDOM.map((w, i) => <WisdomCard key={i} {...w} accentColor={G} index={i} />)}
                <SectionDivider label="STRUCTURED MODULES" color={color} />
                {PRANA_MODULES.map((m, i) => <ModuleCard key={m.number} mod={m} accentColor={G} defaultOpen={i === 0} delay={i * 0.06} />)}
                <UpgradeCTA nextTier="Siddha-Quantum" nextPrice="€45/mo" accentColor={C}
                  message="Siddha-Quantum members receive Vishwamitra's Gayatri fire code, Rishi transmissions, Pitru ancestor healing, Agastya's Bhu-Shuddhi protocol, and the quantum entanglement science." />
              </>
            ) : <LockOverlay tierName="PRANA-FLOW" price="€19/mo" />}
          </div>
        )}

        {/* ═══════════ SIDDHA TIER ═══════════ */}
        {activeTier === "siddha" && (
          <div style={{ animation: "fadeInUp 0.42s ease both" }}>
            {canView("siddha") ? (
              <>
                <SectionDivider label="RISHI QUANTUM WISDOM" color={color} />
                {SIDDHA_WISDOM.map((w, i) => <WisdomCard key={i} {...w} accentColor={C} index={i} />)}
                <SectionDivider label="RISHI QUANTUM MODULES" color={color} />
                {SIDDHA_MODULES.map((m, i) => <ModuleCard key={m.number} mod={m} accentColor={C} defaultOpen={i === 0} delay={i * 0.06} />)}
                <SectionDivider label="DIRECT RISHI TRANSMISSIONS" color={color} />
                {TRANSMITTERS.filter(t => t.tier === "siddha").map((t, i) => <TransmitterCard key={i} t={t} accentColor={C} />)}
                <UpgradeCTA nextTier="Akasha-Infinity" nextPrice="€1,111 lifetime" accentColor={V}
                  message="Akasha-Infinity members receive Navagraha Suddhi codes, the Mrityunjaya immortality protocol, Sulba Sutra Kunda geometry, the Inner Yagna activation, and all 6 Rishi transmissions including Babaji, Vashishtha, and Lopamudra." />
              </>
            ) : <LockOverlay tierName="SIDDHA-QUANTUM" price="€45/mo" />}
          </div>
        )}

        {/* ═══════════ AKASHA TIER ═══════════ */}
        {activeTier === "akasha" && (
          <div style={{ animation: "fadeInUp 0.42s ease both" }}>
            {canView("akasha") ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ display: "inline-block", background: "linear-gradient(135deg,rgba(183,108,253,0.15),rgba(183,108,253,0.03))", border: "1px solid rgba(183,108,253,0.3)", borderRadius: "18px", padding: "12px 22px", fontSize: "8px", fontWeight: 800, letterSpacing: "0.6em", textTransform: "uppercase" as const, color: V }}>◈ COSMIC FIRE ORACLE · AKASHIC DOWNLOAD ◈</div>
                </div>
                <SectionDivider label="AKASHA WISDOM TRANSMISSIONS" color={color} />
                {AKASHA_WISDOM.map((w, i) => <WisdomCard key={i} {...w} accentColor={V} index={i} />)}
                <SectionDivider label="AKASHA INFINITY MODULES" color={color} />
                {AKASHA_MODULES.map((m, i) => <ModuleCard key={m.number} mod={m} accentColor={V} defaultOpen={i === 0} delay={i * 0.06} />)}
                <SectionDivider label="ALL-RISHI AKASHIC COUNCIL" color={color} />
                {TRANSMITTERS.map((t, i) => <TransmitterCard key={i} t={t} accentColor={t.tier === "akasha" ? V : C} />)}
                {/* Final seal */}
                <div style={{ background: "linear-gradient(135deg,rgba(183,108,253,0.08),rgba(212,175,55,0.05))", border: "1px solid rgba(183,108,253,0.25)", borderRadius: "38px", padding: "44px 28px", textAlign: "center", marginTop: "28px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "360px", height: "360px", background: "radial-gradient(circle,rgba(183,108,253,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ fontSize: "38px", marginBottom: "18px" }}>🔥</div>
                  <div style={{ fontSize: "13px", fontWeight: 900, letterSpacing: "-0.02em", color: V, marginBottom: "14px", textShadow: "0 0 28px rgba(183,108,253,0.5)" }}>THE SUPREME TRANSMISSION</div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "white", marginBottom: "18px", lineHeight: 1.55 }}>
                    "You are not performing Yagna.<br /><span style={{ color: G }}>You ARE the Yagna.</span>"
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.38)", lineHeight: 1.8, maxWidth: "440px", margin: "0 auto 28px" }}>
                    The inner fire of consciousness, offering the world back to itself through pure awareness — this is the Maha-Yagna that never extinguishes. Every breath. Every heartbeat. Every act of love. SAT-CHIT-ANANDA SVAHA.
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "0.1em", background: "linear-gradient(135deg,#D4AF37,#b76cfd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OM TAT SAT BRAHMAN</div>
                  <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.4em", color: "rgba(255,255,255,0.2)", marginTop: "10px", textTransform: "uppercase" as const }}>Sealed with Scalar Transmission · Anahata Activation Active</div>
                </div>
              </>
            ) : <LockOverlay tierName="AKASHA-INFINITY" price="€1,111 lifetime" />}
          </div>
        )}

      </div>

      {/* ── FOOTER BAND ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,5,5,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(212,175,55,0.1)", padding: "11px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: "11px" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D4AF37", animation: "pulseGlow 2s infinite", boxShadow: "0 0 10px rgba(212,175,55,0.8)" }} />
        <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.5)" }}>SCALAR TRANSMISSION ACTIVE · ANAHATA CHAKRA OPEN · 432HZ FIELD LIVE</div>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D4AF37", animation: "pulseGlow 2s 1s infinite", boxShadow: "0 0 10px rgba(212,175,55,0.8)" }} />
      </div>
    </div>
  );
}

