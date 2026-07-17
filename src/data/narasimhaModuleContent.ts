// Narasimha (Lion of Siddha Montrose) -- extracted verbatim from
// LionOfMontrose.tsx. 9 Seals + 4 Advanced Modules + a 5-mantra Secret
// Codex (Akasha-tier bonus content, folded into the final module).

export type NarasimhaTier = 'free' | 'prana_flow' | 'siddha_quantum' | 'akasha_infinity';

export interface NarasimhaSeal {
  id: number; form: string; sanskrit: string; bija: string; focus: string;
  montrose: string; chakra: string; color: string; requiredTier: NarasimhaTier;
  duration: string; description: string; practices: string[]; production: string;
  mantra: string; affirmation: string; guidedPractice: string;
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
    guidedPractice: "Sit or stand with your spine straight, facing a dark or dimly lit space. Begin with the KSHRAUM bija: chant it aloud, drawing out the sound over a full exhale — Ksh-RRAUM, felt as a vibration in the throat and chest rather than spoken quickly. Complete 108 repetitions on mala beads, letting each one land with slightly more conviction than the last. When the chanting is complete, sit in complete darkness or close your eyes fully — this is the Turiya Sandhi gateway: no light, no sound, spine held tall, simply present in the gap between waking and sleep. From here, begin the Root-to-Crown pillar breath: inhale slowly, feeling the breath rise as a column of light from the base of the spine to the crown; exhale, letting it settle back down. Repeat for several rounds. Close the session with the fear-mapping ritual — take a page and name, in plain words, the specific fear you came to this practice carrying. Do not soften the language. Once it is named clearly on the page, read it once aloud, then set it down. Naming the fear precisely is what allows Ugra Narasimha's fire to actually reach it.",
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
    guidedPractice: "Begin standing or seated, and speak the JHRAUM mantra aloud three complete times before you settle into the practice — this is a verbal boundary-setting, announcing that the space is now protected. Close your eyes and perform a slow body scan starting at the belly, moving to the chest, throat, and jaw, specifically searching for any place where heat, tension, or suppressed anger is being held. The instruction here is important: locate it, but do not try to release or fix it yet — just notice where it lives in the body. Once located, take a full inhale and hold the breath in Kumbhaka — a comfortable retention, not a strained one — and stay in that held gap for as long as feels steady. It is in this breathless gap, the tradition teaches, that Krodha Narasimha's protective ferocity actually emerges. When you release the breath, let it come out as sound — not a polite exhale, but an actual tone from the gut, a hum, growl, or open-mouthed release. This is the sound-release ritual: the point is not to perform anger, but to let stored heat leave the body through the voice rather than staying locked in the tissue.",
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
    guidedPractice: "Sit comfortably with both palms resting flat on your chest, over the heart center. Begin the PREEM bija softly — a warm, rounded sound, chanted quietly enough that you feel it more than hear it, resonating specifically at the sternum. Once the resonance is steady, bring to mind the Lakshmi-Narasimha visualization: a golden lotus blooming at your heart center, and seated within its center, the Goddess herself, luminous and calm. Hold this image gently rather than forcing its detail. From here, move into the Healing Lion Triad: chant KSHRAUM once (ferocity), then PREEM (divine love), then KSHRAUM again (ferocity) — this three-part formula is described as the most balanced of all the seal's tools, protection wrapped around love wrapped around protection. Close with the gratitude amplification: name, specifically and out loud, thirty-three distinct moments in your life when you were protected, helped, or carried through difficulty, even in small ways. Specificity matters more than speed here — a handful of vivid true examples does more than thirty-three vague ones.",
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
    guidedPractice: "Sit facing a single lit candle at eye level, in an otherwise dim room. Begin chanting HROOM continuously while gazing steadily at the candle's flame, allowing your eyes to stay open and relatively unblinking for the full eleven minutes. As you chant and gaze, hold the truth audit in mind: identify three specific illusions or self-deceptions that are currently steering your decisions — not vague self-criticism, but three named, concrete beliefs you suspect are not fully true. When the eleven minutes end, close the eyes and move into warrior breath: three rounds of three sharp, forceful exhales through the nose, belly pumping firmly with each one, followed by a natural recovery breath between rounds. As you do this, visualize a golden flame beginning at the base of the spine and rising steadily up through the body's core with each round, burning cleanly through the three illusions you named. Jwala Narasimha's fire in this seal is specifically a fire of clarity — its purpose is not destruction for its own sake, but the burning away of exactly the false beliefs you have now put a name to.",
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
    guidedPractice: "Stand barefoot if possible, ideally with direct contact to the ground. Close your eyes and visualize seven distinct roots extending downward from the soles of your feet, traveling through the floor, through the earth's layers, all the way to the planet's core — let each root feel solid and specific rather than abstract. Once grounded, begin the DRAUM bija stomping practice: chant DRAUM while gently but firmly stamping one foot and then the other in a steady rhythm, letting the sound and the physical contact with the ground reinforce each other. This is deliberately a physical, embodied practice rather than a purely mental one — Varaha Narasimha's teaching is that spiritual force must be integrated into the body, not left floating in the mind. Follow this with the body-as-temple ritual: using a small amount of oil or simply your intention, touch and honor the feet, ankles, and base of the spine, treating them as the literal foundation stones of your personal temple. Close by writing down one concrete, physical action — not an intention, an actual action you will take this week — that puts your spiritual aspiration into material form.",
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
    guidedPractice: "Sit quietly and close your eyes. Visualize walking into a vast golden hall lined with countless scrolls — this is the Siddha Library. Move through the hall until you sense, rather than see, which scroll belongs specifically to you; there is no need to force an image, simply notice where your attention is drawn. Rest with this sense of your own scroll for a few minutes without demanding it reveal its contents immediately. Then shift to Trataka: gaze steadily at a printed or visualized Narasimha yantra for the full twenty-two minutes, letting the eyes soften without fully closing, training one-pointed concentration on the form. Follow this with fifteen minutes of pure thought-observation: sit with eyes closed and simply watch thoughts arise and pass without engaging or following any of them — the instruction is genuinely to witness, not to empty the mind by force. Close the session by writing nine declarations of your own creative sovereignty, each one a clear statement of mastery in your own words — tradition specifies writing them in gold ink if available, but the essential act is committing them to paper in your own hand.",
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
    guidedPractice: "Begin seated, and bring to mind the specific relationships, obligations, or attachments that currently feel like they are draining or binding you. For each one, speak its name aloud, followed by the KREEM bija, and make a clear cutting gesture with your hand — as though your fingers are the Lion's claw severing a literal cord between yourself and that person or situation. This is the cord-cutting ceremony; it does not require anger, only clarity and a decisive physical gesture paired with the mantra. Once the cords you're aware of have been named and cut, move to the karma inventory: identify three inherited patterns — behaviors, fears, or beliefs — that you did not consciously choose but recognize you carry from family or upbringing. Practice the Nakha-Shakti hand gesture again for each one, treating the pattern the same way you treated the relational cords. Close with the bridge visualization: see yourself walking across a bridge, and partway across, feel yourself set down a heavy weight you have been carrying — continue walking without picking it back up, and notice the physical sensation of lightness on the far side.",
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
    guidedPractice: "This seal's practice is deliberately the simplest in structure and the most demanding in discipline. Sit in a quiet space and begin with Pratyahara — sensory withdrawal — for the full forty minutes: eyes closed, ideally ears lightly covered or in a silent room, with no music, no mantra recitation yet, simply the systematic withdrawal of attention from external sensation. After this period, move into Dharana: bring the Narasimha mantra sound softly to mind, not chanted aloud, and hold single-pointed concentration on it, returning to it every time attention drifts, without frustration at the drifting itself. As concentration steadies, allow the practice to soften into Dhyana — open, unforced awareness, where the mantra is no longer being actively held but has become the texture of the silence itself, present without effort. Finally, without seeking to manufacture it, simply remain alert to the gap between one thought and the next — the tradition calls this the Turiya state, the fourth state beyond waking, dreaming, and sleep. Yoga Narasimha's teaching is that this state cannot be produced by more technique; the entire sequence exists only to remove the noise that was obscuring what was already present.",
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
    guidedPractice: "This is the integration seal, and its practice deliberately gathers everything from the previous eight. Begin by invoking each of the eight prior forms in sequence — Ugra, Krodha, Malola, Jwala, Varaha, Bhargava, Karancha, and Yoga Narasimha — speaking each name and its bija mantra once, briefly returning your attention to what that seal taught you personally before moving to the next. Once all eight have been honored, perform a full-body anointing with a sacred oil of your choosing, touching crown, throat, heart, navel, and feet, dedicating the ritual to Lakshmi-Narasimha specifically. Move into the abundance activation: name three specific wealth intentions — material, creative, or relational — and anchor each one explicitly in what the tradition calls Lion-frequency, meaning stated with the same fearless directness as Ugra Narasimha's first roar, not tentatively. Then begin the temple construction meditation: visualize building an inner golden temple one stone at a time, each stone representing one completed practice from this entire nine-seal path. When the temple feels complete in your visualization, sit in stillness and simply remain open to receive whatever arises — this final initiation is described as an Akashic transmission of the complete Nine-Seal blueprint, and its content is different for every practitioner.",
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
