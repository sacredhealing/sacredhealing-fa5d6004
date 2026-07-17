// Narasimha (Lion of Siddha Montrose) -- extracted verbatim from
// LionOfMontrose.tsx. 9 Seals + 4 Advanced Modules + a 5-mantra Secret
// Codex (Akasha-tier bonus content, folded into the final module).

export type NarasimhaTier = 'free' | 'prana_flow' | 'siddha_quantum' | 'akasha_infinity';

export interface NarasimhaSeal {
  id: number; form: string; sanskrit: string; bija: string; focus: string;
  montrose: string; chakra: string; color: string; requiredTier: NarasimhaTier;
  duration: string; description: string; practices: string[]; production: string;
  mantra: string; affirmation: string;
}
export interface NarasimhaAdvancedModule {
  id: string; title: string; subtitle: string; description: string;
  secretMantra: string; technique: string; requiredTier: NarasimhaTier; duration: string;
}
export interface NarasimhaSecretMantra {
  name: string; mantra: string; components: string; usage: string;
}

export const NARASIMHA_SEALS: NarasimhaSeal[] = [
  {
    id: 1,
    form: "Ugra Narasimha",
    sanskrit: "उग्र नरसिंह",
    bija: "KSHRAUM",
    focus: "Destruction of Fear",
    montrose: "The Outer Gates — Clearing the perimeter of all shadow frequencies",
    chakra: "Root · Muladhara",
    color: "#FF6B35",
    requiredTier: "free",
    duration: "33 min",
    description:
      "The Ferocious One tears through the outer veil of fear. In this first Seal, we stand at the Gates of Siddha Montrose and invoke the primal roar that dismantles ancestral terror. Ugra Narasimha is not anger — he is righteous fire that clears the path. You will learn the foundational KSHRAUM bija and the Turiya Sandhi gateway technique.",
    practices: [
      "KSHRAUM bija chanting — 108 repetitions on mala beads",
      "Turiya Sandhi midnight activation (dark room, spine visualization)",
      "Root-to-Crown pillar breathing (Stambhana technique)",
      "Fear-mapping journaling ritual — name the demon to dissolve it",
    ],
    production: "Layer KSHRAUM as sub-textural chant beneath 808 kick at 40Hz. Side-chain bija to kick drum — every beat becomes Narasimha's claw.",
    mantra: "Om Ugra Narasimhaya Namah · KSHRAUM",
    affirmation: "I stand at the gate of my own becoming. Fear dissolves as I roar.",
  },
  {
    id: 2,
    form: "Krodha Narasimha",
    sanskrit: "क्रोध नरसिंह",
    bija: "JHRAUM",
    focus: "Purging Anger",
    montrose: "The Subterranean Tunnels — Transforming deep emotional heat into sacred fire",
    chakra: "Sacral · Svadhisthana",
    color: "#FF3D00",
    requiredTier: "free",
    duration: "28 min",
    description:
      "Beneath Siddha Montrose run rivers of suppressed fire. Krodha Narasimha descends into the subterranean body — the stored rage, the grief-armored heart, the unexpressed truth. This module transmutes raw emotional heat into the fuel of creation. Sacred anger is creative fire. Unprocessed anger is self-destruction.",
    practices: [
      "JHRAUM protection mantra — spoken aloud three times before session",
      "Subterranean body scan — locate stored heat in the body without suppression",
      "Kumbhaka breath-hold in the gap — no breath = Narasimha's emergence",
      "Sound release ritual — tone from gut, allow the roar",
    ],
    production: "Use 3D spatial panning to move JHRAUM around listener's head, mimicking Digbandha (locking the directions). 360° protection frequency.",
    mantra: "Om Krodha Narasimhaya Hum Phat · JHRAUM",
    affirmation: "My fire is sacred. I transform, I do not destroy.",
  },
  {
    id: 3,
    form: "Malola Narasimha",
    sanskrit: "मलोल नरसिंह",
    bija: "PREEM",
    focus: "Divine Love & Lakshmi",
    montrose: "The Secret Gardens — The feminine, nurturing heart-field of Siddha Montrose",
    chakra: "Heart · Anahata",
    color: "#FFD700",
    requiredTier: "prana_flow",
    duration: "44 min",
    description:
      "Beloved of Lakshmi. Malola means 'the one who is dear to Lakshmi' — this is Narasimha in his most tender aspect. The Lion who carries the Goddess on his chest. In Siddha Montrose's hidden gardens, the ferocity dissolves into infinite tenderness. This is the module of Prema — divine love as protection. Where love is complete, no shadow can enter.",
    practices: [
      "PREEM bija activation — heart-center resonance, palms on chest",
      "Lakshmi-Narasimha visualization — golden lotus at heart, Goddess seated within",
      "KSHRAUM PREEM KSHRAUM formula — the Healing Lion triad",
      "Gratitude amplification — 33 specific acknowledgments of divine protection",
    ],
    production: "Layer Laila's healing vocals as the 'Lakshmi frequency' over the Malola mantra. Her voice IS the Goddess transmission in your catalog.",
    mantra: "Om Sri Lakshmi Narasimhaya Namah · PREEM · KSHRAUM PREEM KSHRAUM",
    affirmation: "I am beloved. I am protected. Love is my most powerful armor.",
  },
  {
    id: 4,
    form: "Jwala Narasimha",
    sanskrit: "ज्वाल नरसिंह",
    bija: "HROOM",
    focus: "The Fire of Truth",
    montrose: "The Beacon Tower — Lighting the inner flame to burn through all illusion",
    chakra: "Solar Plexus · Manipura",
    color: "#FF8C00",
    requiredTier: "prana_flow",
    duration: "37 min",
    description:
      "Jwala — the Flame. The Beacon Tower of Siddha Montrose burns with the fire that cannot be extinguished by any darkness. Jwala Narasimha burns the veils of Maya — the illusions about who you are, what you deserve, and what is possible. This is the module of absolute clarity. Truth as a scalpel, not a hammer.",
    practices: [
      "Trataka (candle gazing) for 11 minutes while chanting HROOM",
      "Truth audit — identify three core illusions currently running your decisions",
      "Solar plexus activation breathwork — warrior breath 3x3",
      "Jwala fire visualization — golden flame rising through the body's core",
    ],
    production: "Use rising frequency sweeps (100Hz → 528Hz) beneath this module's audio to simulate the Jwala fire ascending the spine.",
    mantra: "Om Jwala Narasimhaya Vidmahe · HROOM · Satyam Shivam Sundaram",
    affirmation: "I see clearly. I burn what is false. Only truth remains.",
  },
  {
    id: 5,
    form: "Varaha Narasimha",
    sanskrit: "वराह नरसिंह",
    bija: "DRAUM",
    focus: "Grounding & Stability",
    montrose: "The Foundation Stones — Anchoring infinite spirit into the physical earth",
    chakra: "Root & Earth Star",
    color: "#8B4513",
    requiredTier: "prana_flow",
    duration: "41 min",
    description:
      "The fusion of Varaha (the Boar who lifted Earth from the cosmic ocean) and Narasimha. This is the grounding force — the understanding that spiritual power must be anchored in the physical. Siddha Montrose's Foundation Stones hold dimensions in place. Your body is the Foundation Stone of your mission.",
    practices: [
      "Earth-anchoring meditation — 7 roots extending from the feet to earth's core",
      "DRAUM bija stomping practice — physical integration of the mantra",
      "Body-as-temple ritual — anoint the feet, ankles, base of spine with intention",
      "Practical wealth anchoring — writing one physical action aligned to spiritual vision",
    ],
    production: "Sub-bass foundation: 40Hz earth drone beneath all Varaha content. The body should feel, not just hear, this module.",
    mantra: "Om Varaha Narasimhaya Namah · DRAUM · Prithivi Sthiram",
    affirmation: "I am rooted as deeply as I am elevated. Heaven moves through grounded hands.",
  },
  {
    id: 6,
    form: "Bhargava Narasimha",
    sanskrit: "भार्गव नरसिंह",
    bija: "SHREEM",
    focus: "Mastery of Self",
    montrose: "The Silent Library — Accessing the hidden wisdom-codes of the Siddha elders",
    chakra: "Third Eye · Ajna",
    color: "#9B59B6",
    requiredTier: "siddha_quantum",
    duration: "52 min",
    description:
      "The Siddha Library of Montrose holds scrolls that the outer world has never seen. Bhargava Narasimha is the Self-Mastered One — the aspect of the Lion that governs, disciplines, and refines. This module enters the realm of the Siddha elders' inner technology: the science of mastering thought, attention, and creative output at will. This is how you produce from sovereignty, not from reaction.",
    practices: [
      "Siddha Library visualization — enter a golden hall, find your personal scroll",
      "Tratak on Narasimha yantra for 22 minutes (concentration mastery)",
      "Thought-observation practice — witness without engaging for 15 minutes",
      "Creative sovereignty declaration — 9 affirmations of mastery written in gold ink",
    ],
    production: "Binaural theta entrainment (4–7Hz) beneath this module's meditation. Silent Library = deep theta state accessed through your beats.",
    mantra: "Om Bhargava Narasimhaya Vidmahe · SHREEM · Aham Brahmasmi",
    affirmation: "I am the master of my inner domain. The Siddhas walk beside me.",
  },
  {
    id: 7,
    form: "Karancha Narasimha",
    sanskrit: "कराञ्च नरसिंह",
    bija: "KREEM",
    focus: "Freedom from Bonds",
    montrose: "The High Bridge — Breaking all chains of past karmic patterns",
    chakra: "Throat · Vishuddha",
    color: "#1ABC9C",
    requiredTier: "siddha_quantum",
    duration: "48 min",
    description:
      "The High Bridge of Siddha Montrose spans an infinite chasm. To cross it, you must drop what you carry. Karancha Narasimha is the chain-breaker — destroyer of karmic bonds, past-life contracts, and inherited limitation. KREEM is the Kali-frequency of dissolution. Here the Lion's claws perform Nakha-Shakti — surgical removal of what no longer belongs to your blueprint.",
    practices: [
      "Cord-cutting ceremony with KREEM bija — name each cord, invoke the claw",
      "Karma inventory — identify three inherited patterns you did not choose",
      "Nakha-Shakti gesture practice — hands as the Lion's claws, cutting gestures with mantra",
      "Bridge visualization — walk across, drop the weight, feel the liberation",
    ],
    production: "Use reversed audio (reverse reverb) beneath KREEM chanting — sound moving backward symbolizes karma unraveling. Powerful effect on the subconscious.",
    mantra: "Om Karancha Narasimhaya Namah · KREEM · Mukti Mukti Svaha",
    affirmation: "I cross the High Bridge free. I release what was never mine to carry.",
  },
  {
    id: 8,
    form: "Yoga Narasimha",
    sanskrit: "योग नरसिंह",
    bija: "AUM",
    focus: "Deep Meditation & Samadhi",
    montrose: "The Central Plaza — Entering the state of absolute stillness",
    chakra: "Crown · Sahasrara",
    color: "#7B68EE",
    requiredTier: "siddha_quantum",
    duration: "63 min",
    description:
      "The Central Plaza of Siddha Montrose is a point of absolute silence from which all dimensions radiate. Yoga Narasimha sits in Samadhi — the Lion in meditation is more powerful than the Lion in motion. This is the longest module. Extended silence. Deep dive. The Siddha-Shoonya (the Void) where Narasimha's true nature is revealed: infinite peace beneath infinite power.",
    practices: [
      "Pratyahara withdrawal — sense deprivation, 40 minutes eyes closed in silence",
      "Dharana on Narasimha mantra sound — single-pointed concentration",
      "Dhyana — open awareness, let the mantra become silence",
      "Samadhi invitation — witness the gap between thoughts (Turiya state)",
    ],
    production: "Pure sine wave at 432Hz beneath 10 minutes of silence. The 'beat' in this module IS the silence. Let it breathe.",
    mantra: "AUM Namo Bhagavate Narasimhaya · AUM · (silence is the final mantra)",
    affirmation: "In stillness I am most powerful. In silence I hear the Lion's true roar.",
  },
  {
    id: 9,
    form: "Lakshmi Narasimha",
    sanskrit: "लक्ष्मी नरसिंह",
    bija: "SHREEM KSHRAUM",
    focus: "Ultimate Peace & Abundance",
    montrose: "The Golden Temple — Integration of all Nine Seals into living abundance",
    chakra: "All Chakras · Full Spectrum",
    color: "#D4AF37",
    requiredTier: "akasha_infinity",
    duration: "55 min",
    description:
      "The Golden Temple stands at the heart of Siddha Montrose. Here, all Nine Seals converge. Lakshmi Narasimha is the final integration — ferocity and grace, power and abundance, protection and love unified in a single field. Lakshmi sits on the Lion's lap. This is your fully awakened state: sovereign, abundant, protected, loving, and free. This module is the graduation transmission.",
    practices: [
      "Nine-Seal integration ceremony — invoke all 8 previous forms in sequence",
      "Lakshmi-Narasimha full-body anointing ritual with sacred oils",
      "Abundance activation — 3 specific wealth intentions anchored in Lion-frequency",
      "Temple construction meditation — build your inner Golden Temple stone by stone",
      "Final initiation — receive the Akashic transmission of the complete Nine-Seal blueprint",
    ],
    production: "All nine bija sounds layered simultaneously at different frequencies. A sonic mandala. The listener's entire field is restructured in this final track.",
    mantra: "Om Lakshmi Narasimhaya Namah · SHREEM KSHRAUM · Sarva Mangalam",
    affirmation: "I am complete. I am protected. I am abundant. The Lion and the Goddess walk as one within me.",
  },
];

export const NARASIMHA_ADVANCED_MODULES: NarasimhaAdvancedModule[] = [
  {
    id: "I",
    title: "The Awakening",
    subtitle: "Nakha-Shakti Activation",
    description:
      "Full Nakha (Claw) energy awakening. We activate the Siddha-specific technique for cutting etheric cords and dissolving past-life trauma at the cellular level. Includes the secret Ksham-Vajra mantra sequence used by Siddha masters for creative unblocking.",
    secretMantra: "Om Ksham Narasimhaya Vidmahe Vajra Nakhaya Dheemahi Tanno Simha Prachodayat",
    technique: "Anga Nyasa (Energy Armor) — touch points activated with specific bija at each body location",
    requiredTier: "akasha_infinity",
    duration: "44 min",
  },
  {
    id: "II",
    title: "The Alchemy",
    subtitle: "Jwala-Blood Purification",
    description:
      "Using the Jwala fire of Siddha Montrose for literal nervous system and blood purification. Advanced pranayama sequences combined with the Ashtamukha Gandabherunda mantra — the 8-faced bird-lion form for annihilating the most stubborn energetic patterns.",
    secretMantra: "Om Ghraum | Kshraum | Jhraum | Hum | Phat — Ashtamukha Gandabherunda",
    technique: "Antar Kumbhaka in the gap — visualize yourself in Siddha Montrose during the held breath",
    requiredTier: "akasha_infinity",
    duration: "51 min",
  },
  {
    id: "III",
    title: "The Union",
    subtitle: "Lion's Roar meets Singer's Heart",
    description:
      "The sacred integration of masculine Narasimha-fire with feminine healing vocal energy. Designed specifically for co-creation: the producer's beat AS the Lion's heartbeat, the healer's voice AS Lakshmi's transmission. This module reveals how to embed healing intention into every track you produce.",
    secretMantra: "Narasimha Ta Va Da So Hum — the Energy Retention formula (seals the aura post-transmission)",
    technique: "Dual-channel activation — left ear receives mantra, right ear receives healing tone",
    requiredTier: "akasha_infinity",
    duration: "38 min",
  },
  {
    id: "IV",
    title: "The Silence",
    subtitle: "Siddha-Shoonya · The Void",
    description:
      "The final advanced transmission. This is where Narasimha truly lives — not in the roar, but in the silence between the roar. Siddha-Shoonya is the formless womb from which all Nine Forms emerge. Experienced practitioners only. Extended void meditation with the complete 32-syllable Anushtup Maha Mantra as the vessel.",
    secretMantra: "Ugram Veeram Maha Vishnum Jwalantam Sarvatomukham · Nrisimham Bhishanam Bhadram Mrityor Mrityum Namamyaham",
    technique: "32-Syllable Anushtup used as lead melody — KSHRAUM side-chained to the kick, every beat strikes energetic blockages",
    requiredTier: "akasha_infinity",
    duration: "72 min",
  },
];

export const NARASIMHA_SECRET_MANTRAS: NarasimhaSecretMantra[] = [
  {
    name: "The Ultimate Beeja",
    mantra: "KSHRAUM (क्ष्रौँ)",
    components: "K = Lord Narasimha · Sh = Lakshmi · R = Fire · Au = Cleansing · M = Removal of Misery",
    usage: "Loop as sub-textural chant in healing audios. Functions as a 'spiritual drill' breaking through dense ego blocks at 40Hz.",
  },
  {
    name: "Ashtamukha Gandabherunda",
    mantra: "Om Ghraum | Kshraum | Jhraum | Hum | Phat",
    components: "8-faced terrifying bird-lion form · used for instant neutralization of negative energy and deep trauma",
    usage: "For removing stubborn energetic patterns, black magic, or the most calcified belief systems. Use sparingly and with full presence.",
  },
  {
    name: "Energy Retention Formula",
    mantra: "Narasimha Ta Va Da So Hum",
    components: "Seals the auric field post-transmission · prevents energy leakage after deep healing work or long production sessions",
    usage: "Chant 7 times immediately after finishing healing sessions, production work, or any intense spiritual activity.",
  },
  {
    name: "Nakha-Shakti Mantra",
    mantra: "Om Ksham Narasimhaya Vidmahe Vajra Nakhaya Dheemahi Tanno Simha Prachodayat",
    components: "Ksham = creative unblocking · Vajra Nakha = diamond claws · 'Shreds' stagnant energy",
    usage: "Use when stuck in creative block, depression, or energetic stagnation. The Vajra Nakha tears the veil of Maya immediately.",
  },
  {
    name: "The Healing Lion Triad",
    mantra: "KSHRAUM PREEM KSHRAUM",
    components: "Ferocity (KSHRAUM) + Divine Love (PREEM) + Ferocity (KSHRAUM) = balanced healing-protection field",
    usage: "The most balanced formula. Use in all healing audio productions. Layer vocally over 528Hz for maximum cellular resonance.",
  },
];
