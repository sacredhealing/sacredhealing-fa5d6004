// Sovereign Hormonal Alchemy (Shakti Cycle Intelligence) — extracted
// verbatim from SovereignHormonalAlchemy.tsx. 35 modules across 3 tiers
// (free / prana-flow / akasha-infinity — no siddha-quantum tier in this
// academy by original design), plus 4 cycle-phase profiles and two
// universal reference tables (10 herbs, 7 planetary correspondences).

export type ShaktiTier = 'free' | 'prana' | 'akasha';
export type ShaktiPhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

export interface ShaktiCurriculumItem {
  title: string; description: string;
  practices?: string[]; herbs?: string[]; mantra?: string;
}
export interface ShaktiModule {
  id: string; title: string; subtitle: string; tier: ShaktiTier;
  phase?: ShaktiPhase; duration: string; icon: string;
  curriculum: ShaktiCurriculumItem[]; secretTeaching?: string;
}

export const SHAKTI_PHASES =
[
  {
    id: "menstruation" as ShaktiPhase,
    name: "Rtumati",
    subtitle: "The Sacred Release · Days 1–5",
    siddhaName: "Rakta Shakti Kala",
    goddess: "Kali — The Transformer",
    color: "#8B1A1A",
    glow: "rgba(139,26,26,0.4)",
    icon: "🌑",
    element: "Water (Jala Tattva)",
    planet: "Moon (Chandra) + Mars (Mangal)",
    quality: "Yin at Maximum · Deep Rest · Visioning",
    description:
      "The Siddhas called this phase 'Bindu Visarjana' — the sacred release of accumulated consciousness-codes. Thirumoolar taught that menstrual blood carries encoded Akashic information from the previous lunar cycle. This is not weakness. This is your most psychic window of the entire month.",
    secretTeaching:
      "Secret of Thirumanthiram (Verse 2847): The uterus contracts during menstruation in the same waveform as the cosmic 'Om' pulse — 7.83 Hz Schumann resonance. Women who bleed consciously are entraining their entire body to Earth's heartbeat. This is why ancient Siddhas placed menstruating women in dedicated 'Shakti Kutirs' — not to isolate them, but because their frequency was so high it disrupted ordinary household energy fields.",
    foods: [
      "Black sesame with jaggery (Til Laddu)",
      "Warm beet kvass with ginger",
      "Dates soaked in ghee",
      "Kitchari with extra turmeric",
      "Dark chocolate (85%+) with cardamom",
      "Pomegranate juice — fresh",
      "Red lentil soup with cumin",
      "Nettle tea with honey",
    ],
    avoid: [
      "Cold foods & ice water",
      "Raw salads",
      "Caffeine excess",
      "High-intensity exercise",
      "Sexual activity (conserves Ojas)",
    ],
    practices: [
      "Yoga Nidra 20–40 minutes daily",
      "Menstrual meditation: place hands on womb, chant 'Lam' 108x",
      "Moon-bathing at night",
      "Journaling visionary dreams",
      "Abhyanga (self-oil massage) with castor oil on lower abdomen",
    ],
  },
  {
    id: "follicular" as ShaktiPhase,
    name: "Shuddha Kala",
    subtitle: "The Pure Rising · Days 6–13",
    siddhaName: "Saraswati Shakti",
    goddess: "Saraswati — The Creator",
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.3)",
    icon: "🌒",
    element: "Air (Vayu Tattva)",
    planet: "Venus (Shukra) + Mercury (Budha)",
    quality: "Yang Rising · Initiation · Creativity",
    description:
      "Agastya Muni's Shakti Kalpa describes this as 'Nava Srishti' — New Creation phase. Estrogen rises like the sun, serotonin floods the brain, and the Saraswati Nadi (governing language, art, and intelligence) becomes maximally active. This is your peak manifestation window. Plant seeds — literal and metaphorical.",
    secretTeaching:
      "Hidden Teaching of Agastya Muni: The follicles maturing in the ovary during this phase are not just biological — each follicle is a 'Bindu' (consciousness-seed) waiting to crystallize an experience. Ancient Siddha midwives would give specific mantras to women during Days 6–8 to 'program' the dominant follicle with the desired soul-quality they wished to birth — whether conceiving a child or conceiving a great creative work.",
    foods: [
      "Sprouted seeds (sunflower, pumpkin)",
      "Fermented foods — idli, dosa batter, kefir",
      "Avocado with lime & black pepper",
      "Green smoothies with Shatavari powder",
      "Flaxseed — 1 tbsp ground daily",
      "Quinoa with saffron",
      "Coconut water fresh",
      "Moringa leaf powder in warm water",
    ],
    avoid: [
      "Excessive sugar",
      "Processed foods",
      "Alcohol",
      "Overcommitting socially",
    ],
    practices: [
      "Surya Namaskar at sunrise — 12 rounds",
      "Creative project initiation",
      "New moon ritual if cycle aligns",
      "Trataka (candle gazing) to sharpen focus",
      "Learning new knowledge/skills",
    ],
  },
  {
    id: "ovulation" as ShaktiPhase,
    name: "Ritukala",
    subtitle: "The Sacred Peak · Days 14–16",
    siddhaName: "Lakshmi Shakti",
    goddess: "Lalita Tripura Sundari — The Full Power",
    color: "#D4AF37",
    glow: "rgba(212,175,55,0.5)",
    icon: "🌕",
    element: "Fire (Agni Tattva)",
    planet: "Sun (Surya) + Jupiter (Guru)",
    quality: "Maximum Yang · Full Power · Transmission",
    description:
      "Thirumanthiram's most guarded secret: During ovulation, the woman's body naturally produces microscopic amounts of 'Amrita' — the same Soma nectar that Siddhas spend decades trying to cultivate through advanced Khechari Mudra. LH surge creates a biochemical state identical to what yogis call 'Savikalpa Samadhi.' You are neurologically at your highest consciousness threshold right now.",
    secretTeaching:
      "The Soma Mandala Secret (Never Before Published): In Siddha Tantra, ovulation day is called 'Purna Shakti Tithi' — the day of complete power. A woman's auric field expands to 3x normal size. The Siddhas knew this and specifically designed the '64 Tantric Arts' to be practiced by women ONLY during this 3-day window. Modern science confirms: LH surge creates a brief window of photon emission from human cells 300% above baseline. You are literally glowing with light.",
    foods: [
      "Saffron milk with Ashwagandha",
      "Raw figs — sacred to Lakshmi",
      "Coconut fresh — the Amrita fruit",
      "Blueberries & raspberries",
      "Light dal with ghee",
      "Pomegranate seeds",
      "Raw cacao with rose water",
      "Fresh turmeric shots",
    ],
    avoid: [
      "Overeating (dissipates Ojas)",
      "Argumentative conversations",
      "Excessive screen time",
      "Missing the creative/productive peak",
    ],
    practices: [
      "Full Shakti meditation — visualize golden sun in womb",
      "Creative output, recording, publishing",
      "Sacred intimacy if desired",
      "Perform abhisheka (water offering) to the divine feminine",
      "Affirmations & manifestation work at maximum power",
    ],
  },
  {
    id: "luteal" as ShaktiPhase,
    name: "Rajah Kala",
    subtitle: "The Integration · Days 17–28",
    siddhaName: "Kali-Durga Shakti",
    goddess: "Durga — The Protector & Integrator",
    color: "#7C3AED",
    glow: "rgba(124,58,237,0.35)",
    icon: "🌘",
    element: "Earth (Prithvi Tattva)",
    planet: "Saturn (Shani) + Rahu",
    quality: "Yin Returning · Deep Processing · Completion",
    description:
      "This phase is where PMS symptoms indicate blocked Shakti, not weakness. The Siddhas called PMS 'Stagnant Vayu in the Apana Channel' — a clear, fixable energetic imbalance. When this phase flows correctly, it becomes a portal of extraordinary intuition, shadow integration, and completion of incomplete cycles.",
    secretTeaching:
      "Agastya Muni's Clinical Teaching on PMS: Every PMS symptom maps to a specific Pancha Bhuta (5 element) imbalance. Bloating = excess Earth (ungrounded emotions stored in lower chakras). Rage = Fire in Vata channel (suppressed anger from the previous cycle). Weeping = Water element processing grief the mind refused to acknowledge. The cure is NOT suppression — it is conscious completion of what was left undone in the previous 28 days.",
    foods: [
      "Sweet potato & yam (grounding)",
      "Lentils & legumes of all kinds",
      "Brown rice with sesame",
      "Dark leafy greens with lemon",
      "Walnuts & Brazil nuts",
      "Miso soup (fermented, warming)",
      "Triphala churna at night",
      "Warm milk with nutmeg & Ashwagandha",
    ],
    avoid: [
      "Excess salt (causes bloating)",
      "Refined sugar (feeds inflammation)",
      "Alcohol (amplifies emotional swings)",
      "Conflict initiation",
      "New projects — complete existing ones",
    ],
    practices: [
      "Yin yoga 45 min daily",
      "Journaling shadow material that arises",
      "Completion rituals — finish what was started",
      "Restorative pranayama: Nadi Shodhana",
      "Castor oil pack on liver 3x per week",
    ],
  },
];

export const SHAKTI_MODULES: ShaktiModule[] =
[
  // ── FREE TIER ─────────────────────────────────────────────────────────────
  {
    id: "free-1",
    title: "The Sacred Shakti Map",
    subtitle: "Understanding Your Cycle as a Consciousness Technology",
    tier: "free",
    duration: "45 min",
    icon: "🗺️",
    curriculum: [
      {
        title: "Lesson 1: The 4 Seasons Within You",
        description:
          "Your menstrual cycle mirrors the 4 seasons, 4 lunar phases, and 4 daily cycles of the sun. The Siddhas built entire calendrical systems around this truth. Learn to see your body as a living cosmic clock.",
        practices: [
          "Cycle charting template (Siddha method)",
          "Moon phase alignment basics",
          "Identifying your personal cycle length",
        ],
      },
      {
        title: "Lesson 2: Why the Siddhas Called Menstruation 'Rtumati'",
        description:
          "Rtumati means 'She Who Has Received the Sacred Time.' This word alone contains an entire philosophical framework. Menstruation in Siddha medicine is the body's monthly intelligence report — not a curse, but a diagnostic and spiritual event.",
        practices: [
          "The Shakti honor ritual (5 minutes)",
          "Basic womb awareness meditation",
          "Reframing your cycle narrative",
        ],
      },
      {
        title: "Lesson 3: Your Hormones as Light Codes",
        description:
          "Estrogen, progesterone, LH, FSH — these are not just chemicals. From the 2050 quantum biology perspective, each hormone carries a specific photon signature. Estrogen resonates at 432 Hz. Progesterone at 528 Hz. When these frequencies are coherent, you are in Shakti flow.",
        practices: [
          "Hormone-tone meditation (audio)",
          "Basic symptom journaling system",
        ],
      },
    ],
  },
  {
    id: "free-2",
    title: "Moon Medicine Basics",
    subtitle: "Aligning Your Cycle to Chandra's Intelligence",
    tier: "free",
    duration: "30 min",
    icon: "🌙",
    curriculum: [
      {
        title: "Lesson 1: The Lunar Cycle & Your Cycle",
        description:
          "The perfect menstrual cycle is 29.5 days — identical to the lunar orbit. This is not coincidence. The Siddhas knew that the Moon governs the 'Chandra Nadi' — the left nostril pathway — which directly regulates the hypothalamus and pituitary gland.",
        practices: [
          "Download the Siddha Moon Calendar",
          "Track your cycle against lunar phases for 3 months",
        ],
      },
      {
        title: "Lesson 2: 3 Emergency Siddha Remedies Every Woman Must Know",
        description:
          "These three remedies have been used for 5,000 years and are validated by modern research. They work within 20 minutes for acute menstrual pain.",
        herbs: ["Ginger + Jaggery decoction", "Castor oil lower abdomen pack", "Ashoka bark tea (2 tsp bark : 2 cups water, simmer 15 min)"],
        practices: [
          "Apana Vayu Mudra (both hands, hold 20 minutes)",
          "Warming pranayama: Bhastrika 3 rounds",
        ],
        mantra: "Om Chandraya Namaha — chant 108x during acute pain",
      },
    ],
  },
  {
    id: "free-3",
    title: "Daily Shakti Rituals",
    subtitle: "5-Minute Practices for Every Phase",
    tier: "free",
    duration: "20 min",
    icon: "✨",
    curriculum: [
      {
        title: "The 5-Minute Womb Awakening",
        description:
          "A daily practice taught by Siddha Bogar — practiced upon waking, before the mind activates. Place both palms on the lower abdomen. Breathe 5 complete cycles, visualizing a golden light expanding from the womb with each exhale.",
        practices: [
          "Morning womb awakening (audio guided)",
          "Evening Chandra Mudra",
          "Cycle phase awareness check-in",
        ],
        mantra: "Om Aim Hreem Shreem — The Tri-Shakti Invocation",
      },
    ],
  },

  {
    id: "free-4",
    title: "Cycle Symptom Decoder",
    subtitle: "What Your Body Is Telling You Every Month",
    tier: "free",
    duration: "25 min",
    icon: "🗝️",
    curriculum: [
      {
        title: "Lesson 1: The Symptom-as-Message System",
        description:
          "Siddha medicine's core diagnostic insight: every symptom is information, not malfunction. Cramping, bloating, mood shifts, acne, fatigue — each carries a precise message from the Causal Body through the physical body. This decoder gives you the translation key for the 12 most common menstrual symptoms.",
        practices: [
          "Heavy flow → excess Pitta (fire) + liver congestion",
          "Scanty flow → excess Vata (air) + blood deficiency",
          "Severe cramps → Apana Vayu obstruction",
          "Bloating → unprocessed emotions in Svadhisthana chakra",
          "Breast tenderness → excess estrogen, liver needs support",
          "Headaches → Vata in upper body, dehydration, magnesium deficiency",
          "Acne before period → excess androgens, blood heat",
          "Fatigue Days 1-2 → body's mandatory reset signal (not a disorder)",
        ],
      },
      {
        title: "Lesson 2: Your Personal Cycle Signature",
        description:
          "Over 3 months of cycle tracking, a pattern emerges that is unique to you — your personal Cycle Signature. This signature is your most accurate ongoing health report. Changes in the signature indicate systemic shifts before they manifest as diagnoses.",
        practices: [
          "3-month cycle tracking template (free download)",
          "Identifying your baseline vs. deviation",
          "When to seek professional support",
        ],
        mantra: "Om Namah Shivaya — for clarity in reading the body's intelligence",
      },
    ],
  },

  // ── PRANA-FLOW TIER ───────────────────────────────────────────────────────
  {
    id: "prana-1",
    title: "Phase 1 Deep Protocol",
    subtitle: "Rtumati: Mastering Menstruation as Medicine",
    tier: "prana",
    phase: "menstruation",
    duration: "3 hours",
    icon: "🌑",
    secretTeaching:
      "The Thirumoolar Teaching: Menstrual blood is the only human fluid that contains the complete genetic blueprint of the mother and a 'space' for the incoming soul — even when no conception has occurred. Siddhas called it 'Devi's Signature.' Ceremonially returning it to the earth (as in original cultures) creates a powerful fertility grid around the home.",
    curriculum: [
      {
        title: "Module 1.1: The Neuroscience of Menstruation",
        description:
          "Prostaglandins, the endometrium, and what cramping actually means energetically. Pain maps to specific emotional blockages in the Svadhisthana (sacral) chakra. We decode the symptom-as-message system.",
        practices: [
          "Complete pain decoding chart",
          "Emotional mapping of cramp locations",
          "Prostaglandin-reducing protocol (diet + herbs)",
        ],
      },
      {
        title: "Module 1.2: The Siddha Menstrual Rest Protocol",
        description:
          "Why resting on Day 1 is not optional but strategic. The Siddhas designed a specific 'Shakti Restoration' sequence for Day 1-2 that reduces cycle disruption for the entire following month.",
        practices: [
          "Day 1 full rest sequence (Yoga Nidra 45 min)",
          "Day 2 gentle movement — Yin sequence",
          "Day 3-5 returning protocol",
        ],
        herbs: ["Ashoka bark decoction", "Ginger-turmeric golden milk", "Shatavari in warm water"],
        mantra: "Om Dum Durgayei Namaha — 108x for menstrual strength",
      },
      {
        title: "Module 1.3: Healing Dysmenorrhea Permanently",
        description:
          "Painful periods are not normal — they indicate excess Vata or Pitta in the Apana Vata channel. Full 3-month protocol to eliminate menstrual pain using Siddha herbs, diet, and specific Mudra sequences.",
        herbs: ["Dashamoola Kashayam", "Shatavari Ghee (2 tsp morning)", "Cinnamon + Fennel decoction"],
        practices: [
          "Apana Vata balancing sequence (daily)",
          "Castor oil liver pack protocol",
          "Adho Mukha Virasana hold (10 min) during cramps",
        ],
      },
      {
        title: "Module 1.4: Psychic Vision During Menstruation",
        description:
          "Siddha masters documented that the pineal gland is 40% more active during menstruation. Dreams are more vivid, intuition is heightened, and prophetic vision is accessible. Learn the specific practices to activate this window.",
        practices: [
          "Dream journaling protocol (Siddha method)",
          "Menstrual vision meditation",
          "Creating a personal Shakti oracle practice",
        ],
        mantra: "Om Aim Saraswatyei Namaha — for visionary clarity",
      },
    ],
  },
  {
    id: "prana-2",
    title: "Phase 2 Deep Protocol",
    subtitle: "Shuddha Kala: The Art of Pure Beginning",
    tier: "prana",
    phase: "follicular",
    duration: "2.5 hours",
    icon: "🌒",
    secretTeaching:
      "Agastya Muni's Nava Srishti Teaching: Days 6-8 are the most important days of the entire cycle for manifestation. The follicle that will become the dominant egg is chosen during this exact window. Siddhas taught that performing specific Shakti mantras during these 3 days 'programs' your creative intelligence for the entire next month. This is the real secret behind ancient women's temple practices.",
    curriculum: [
      {
        title: "Module 2.1: Estrogen as Consciousness Activator",
        description:
          "Rising estrogen increases serotonin, BDNF (brain growth factor), and verbal fluency by measurable amounts. From 2050 quantum biology: estrogen carries a specific photon signature at 432 Hz that creates phase coherence between the heart and brain field.",
        practices: [
          "The Follicular Focus Protocol",
          "New moon setting ritual (for synced cycles)",
          "Sankalpa (intention-setting) meditation",
        ],
      },
      {
        title: "Module 2.2: The Seed-Programming Practice",
        description:
          "Based on Agastya Muni's 'Bija Dharana' — the practice of planting consciousness-seeds. On Days 6, 7, 8 specifically, perform this practice to program your creative field for the entire month.",
        practices: [
          "Bija Dharana 21-minute ritual",
          "Written Sankalpa ceremony",
          "Vision board activation meditation",
        ],
        mantra: "Om Aim Hreem Shreem Kleem — The 5-bija creative matrix",
      },
      {
        title: "Module 2.3: Spring Foods & Microbiome Restoration",
        description:
          "The follicular phase is the optimal window for gut microbiome restoration. Estrogen and gut bacteria have a bidirectional relationship — the 'estrobolome' of bacteria that metabolize estrogen must be cultivated specifically now.",
        herbs: ["Moringa leaf powder (1 tsp in warm water)", "Shatavari churna", "Fennel seed decoction"],
        practices: [
          "Siddha seed-cycling protocol",
          "Probiotic food preparation guide",
          "Seed cycle recipe collection",
        ],
      },
    ],
  },
  {
    id: "prana-3",
    title: "Phase 3 Deep Protocol",
    subtitle: "Ritukala: Living at Full Power",
    tier: "prana",
    phase: "ovulation",
    duration: "2 hours",
    icon: "🌕",
    secretTeaching:
      "The Soma Mandala Revelation: Ancient Siddha texts describe ovulation as the moment when the Sushumna (central energy channel) opens fully and the Kundalini energy can rise without deliberate effort. This is why women feel naturally charismatic, magnetic, and energized. The 2050 research confirms: LH surge creates a 3x increase in cellular biophoton emission. You are measurably more luminous.",
    curriculum: [
      {
        title: "Module 3.1: Harnessing Peak Power",
        description:
          "The 3-day ovulation window carries your highest physical strength, verbal fluency, social magnetism, and creative output of the month. Strategic scheduling of important presentations, difficult conversations, and creative projects to this window produces measurably superior results.",
        practices: [
          "Peak Power scheduling system",
          "The Shakti business strategy template",
          "High-visibility social media timing protocol",
        ],
      },
      {
        title: "Module 3.2: Sacred Sexuality & Ojas Conservation",
        description:
          "Siddha Tantra's most important teaching on ovulation: the difference between 'Ojas-building' and 'Ojas-depleting' practices during this phase. Whether you choose sacred sexuality or transmutation, the protocol determines your vitality for the remaining 14 days.",
        practices: [
          "Shakti transmutation breathwork",
          "The Ojas-building diet for ovulation",
          "Creative sublimation practices",
        ],
        mantra: "Om Shreem Hreem Shreem — Lakshmi's abundance activation",
      },
      {
        title: "Module 3.3: Full Moon Ritual & Shakti Ceremony",
        description:
          "When ovulation aligns with the Full Moon (the 'White Moon' cycle), this is considered the most powerful 24 hours of the entire year for women's manifestation practice. This module teaches the complete Purnima Shakti ceremony.",
        practices: [
          "Purnima Shakti Ceremony (complete ritual)",
          "Full moon water charging",
          "Gratitude amplification practice",
        ],
      },
    ],
  },
  {
    id: "prana-4",
    title: "Phase 4 Deep Protocol",
    subtitle: "Rajah Kala: The Art of Sacred Completion",
    tier: "prana",
    phase: "luteal",
    duration: "3 hours",
    icon: "🌘",
    secretTeaching:
      "The PMS Decoding Secret: Every PMS symptom is the body delivering specific Akashic information about what was suppressed, avoided, or left incomplete in the last cycle. Rage = suppressed power. Weeping = unexpressed love. Bloating = unexpressed creativity held in the lower field. The Siddhas did not 'treat' PMS — they 'decoded' it as diagnostic intelligence from the Causal Body.",
    curriculum: [
      {
        title: "Module 4.1: The PMS Decoding Protocol",
        description:
          "Complete symptom-to-soul-message translation guide. Based on Agastya Muni's Pancha Bhuta clinical system. Once you decode what each symptom is communicating, you complete the cycle with grace rather than suffering.",
        practices: [
          "PMS Symptom Decoder worksheet",
          "Shadow journaling protocol (Kali method)",
          "Completion rituals for unfinished cycles",
        ],
      },
      {
        title: "Module 4.2: Progesterone Support Protocol",
        description:
          "Progesterone is the 'peace hormone' — when deficient, anxiety, insomnia, and irritability result. The Siddha protocol for naturally supporting progesterone production through specific herbs, foods, lifestyle, and the single most important practice: eliminating excess cortisol.",
        herbs: [
          "Vitex (Chasteberry) — 400mg daily, morning",
          "Ashwagandha — 500mg before bed",
          "Saffron 20mg daily (clinical antidepressant dose)",
          "Brahmi for cortisol regulation",
        ],
        practices: [
          "Liver support protocol (critical for progesterone)",
          "The cortisol elimination system",
          "Evening Yoga Nidra (30 min)",
        ],
      },
      {
        title: "Module 4.3: Preparing for the Next Cycle",
        description:
          "Days 25-28 are the 'Preparation Gate' — what you do here determines the quality of your next menstruation and the entire following cycle. The Siddha 3-day completion ritual cleanses the energetic field for the next 28-day journey.",
        practices: [
          "3-day completion cleanse (Siddha method)",
          "Cycle review journaling",
          "Triphala overnight for gentle detox",
        ],
        mantra: "Om Krim Kalikayei Namaha — for release and completion",
      },
    ],
  },
  {
    id: "prana-5",
    title: "Siddha Plant Medicine Encyclopedia",
    subtitle: "The Complete Sacred Feminine Apothecary",
    tier: "prana",
    duration: "4 hours",
    icon: "🌿",
    curriculum: [
      {
        title: "Module 5.1: The Queen Plants — 7 Non-Negotiables",
        description:
          "Seven plants that every woman must know. These are the foundations of Siddha women's medicine — used for 5,000 years, confirmed by modern research, safe, accessible, and profoundly effective.",
        herbs: [
          "Shatavari (Asparagus racemosus) — The Queen of women's herbs",
          "Ashoka (Saraca asoca) — The grief-healer of the uterus",
          "Lodhra (Symplocos racemosa) — The hormonal harmonizer",
          "Kumari/Aloe Vera — 'The Virgin' — heals all female complaints",
          "Hibiscus — Thyroid, hair, hormones, iron",
          "Turmeric — Systemic anti-inflammatory, liver support",
          "Brahmi — Cortisol reduction, neuroplasticity",
        ],
      },
      {
        title: "Module 5.2: PCOS Siddha Protocol",
        description:
          "PCOS is a modern epidemic caused by chronic inflammation, insulin resistance, and adrenal dysregulation — all perfectly addressable in Siddha medicine. 6-month complete reversal protocol.",
        herbs: [
          "Cinnamon — insulin sensitizing (1/2 tsp in warm water, morning)",
          "Neem — androgenic excess reduction",
          "Spearmint tea — natural anti-androgen (2 cups daily)",
          "Inositol (Myo + D-Chiro) — 4000mg daily",
          "Triphala — gut-liver axis reset",
        ],
        practices: [
          "PCOS lifestyle protocol",
          "Ovarian massage practice (Siddha method)",
          "Stress-cortisol elimination system",
        ],
      },
      {
        title: "Module 5.3: Endometriosis Siddha Protocol",
        description:
          "In Siddha medicine, endometriosis is 'Rakta Dushti with Pitta excess' — a fire-blood disorder that requires sustained cooling, liver detox, and emotional release of deep rage or grief stored in the reproductive organs.",
        herbs: [
          "Turmeric + Black Pepper (curcumin activation)",
          "Boswellia (Shallaki) — anti-inflammatory",
          "Ashoka bark — endometrial tissue regulation",
          "Castor oil (Eranda) — liver & pelvis detox",
          "Evening primrose oil — prostaglandin balance",
        ],
        practices: [
          "12-week Pitta-reducing protocol",
          "Emotional release for endo (somatic approach)",
          "Castor oil pack master protocol",
        ],
      },
      {
        title: "Module 5.4: Thyroid & Adrenal Restoration",
        description:
          "The thyroid-adrenal-ovarian triangle governs all of women's hormonal health. These three cannot be treated independently. Full Siddha protocol for restoring this triangle.",
        herbs: [
          "Ashwagandha — adrenal restoration",
          "Guggulu — thyroid metabolism support",
          "Kanchanar — specific for thyroid nodules",
          "Hibiscus — iodine-rich, thyroid-feeding",
          "Brahmi + Shankhpushpi — HPA axis regulation",
        ],
      },
    ],
  },
  {
    id: "prana-6",
    title: "Planetary Timing for Women",
    subtitle: "Jyotish & the Feminine Cosmic Calendar",
    tier: "prana",
    duration: "3 hours",
    icon: "🪐",
    curriculum: [
      {
        title: "Module 6.1: The 7 Planets & Your Hormonal System",
        description:
          "Vedic Jyotish maps the planets directly to specific endocrine glands and hormones. This is not metaphor — it is a precise anatomical system used by Siddha physicians for 4,000 years.",
        practices: [
          "Moon (Chandra) → Uterus, menstrual cycle, breasts",
          "Venus (Shukra) → Ovaries, reproductive system, Ojas",
          "Mars (Mangal) → Blood, iron, menstrual flow intensity",
          "Jupiter (Guru) → Liver, fat metabolism, fertility",
          "Saturn (Shani) → Bones, structure, endometrial lining",
          "Mercury (Budha) → Thyroid, nervous system",
          "Sun (Surya) → Adrenals, vitality, ovulation timing",
        ],
      },
      {
        title: "Module 6.2: The Tithi System for Women",
        description:
          "The 30 lunar days (Tithis) each carry specific energetic qualities that affect women's physiology. Specific Tithis for starting herbal protocols, fasting, sacred sexuality, and menstrual ceremonies.",
        practices: [
          "Tithi calendar and health planning guide",
          "Ekadashi fasting for hormonal reset",
          "Purnima (Full Moon) ceremony protocol",
          "Amavasya (New Moon) dark moon retreat",
        ],
      },
      {
        title: "Module 6.3: Your Jyotish Fertility Chart",
        description:
          "Reading your natal chart for women's health indicators. Venus, Moon, and 5th house analysis for understanding your natural hormonal constitution and predispositions.",
        practices: [
          "Basic natal chart interpretation guide",
          "Dasha periods and hormonal transitions",
          "Remedial measures (Upayas) for planetary imbalances",
        ],
      },
    ],
  },
  {
    id: "prana-7",
    title: "Sacred Mantras for Each Phase",
    subtitle: "Nada Shakti: Sound as Hormonal Medicine",
    tier: "prana",
    duration: "2.5 hours",
    icon: "🎵",
    curriculum: [
      {
        title: "Module 7.1: The Science of Mantra & Hormones",
        description:
          "Chanting at specific frequencies produces measurable changes in cortisol, oxytocin, and endorphins within 11 minutes. The Siddhas designed specific mantras to target specific endocrine glands — this module teaches the mapping.",
        practices: [
          "Bija mantra resonance locations in the body",
          "Hormonal mantra prescription system",
          "Daily mantra japa protocol by cycle phase",
        ],
      },
      {
        title: "Module 7.2: The 5-Phase Mantra System",
        description:
          "Complete mantra prescriptions with correct pronunciation, timing, number of repetitions, and specific mudra pairings for each phase of the cycle.",
        practices: [
          "Menstruation: Om Krim Kalikayei Namaha (108x morning)",
          "Follicular: Om Aim Saraswatyei Namaha (108x sunrise)",
          "Ovulation: Om Shreem Hreem Shreem Mahalakshmyei Namaha (108x noon)",
          "Luteal: Om Dum Durgayei Namaha (108x sunset)",
          "All phases: Gayatri Mantra (108x dawn)",
        ],
        mantra: "Om Aim Hreem Shreem Kleem Sauh — The complete Shakti activation matrix",
      },
      {
        title: "Module 7.3: Nada Yoga for Hormonal Healing",
        description:
          "The 'Bindu-Nada' secret from Thirumoolar: specific musical notes (Swaras) resonate with specific hormonal glands. Sa=adrenals, Re=gonads, Ga=pancreas, Ma=thyroid, Pa=parathyroid, Dha=pituitary, Ni=pineal. Full healing sound protocol.",
        practices: [
          "7-swara healing sequence (guided audio)",
          "Binaural beat protocols by phase",
          "432 Hz vs 528 Hz usage guide for cycle phases",
        ],
      },
    ],
  },
  {
    id: "prana-8",
    title: "Shakti Pranayama Complete System",
    subtitle: "Breath as Hormonal Architect",
    tier: "prana",
    duration: "3 hours",
    icon: "💨",
    curriculum: [
      {
        title: "Module 8.1: The Chandra Bhedana Protocol",
        description:
          "Left-nostril breathing (Chandra Bhedana) activates the parasympathetic nervous system, reduces cortisol by up to 40%, and specifically targets the hypothalamic-pituitary-ovarian axis. 15 minutes daily transforms hormonal balance within 3 months.",
        practices: [
          "Chandra Bhedana technique (complete instruction)",
          "Phase-specific duration guide",
          "Morning vs evening protocol",
        ],
      },
      {
        title: "Module 8.2: Bhramari for Hormone Reset",
        description:
          "The humming bee breath creates nitric oxide in the sinuses — a vasodilator that increases blood flow to the pituitary gland by measurable amounts. The Siddhas called this 'Bhramari Shakti' and prescribed it specifically for menstrual irregularity and infertility.",
        practices: [
          "Bhramari with Shanmukhi Mudra",
          "21-round protocol for menstrual regulation",
          "Bhramari with specific bija mantras",
        ],
      },
      {
        title: "Module 8.3: Shakti Pranayama Sequences by Phase",
        description:
          "Complete breathwork prescriptions for every phase — from the cooling Sheetali during ovulation heat to the warming Ujjayi during menstrual cold. Designed by Siddha master Tirumular's complete respiratory medicine system.",
        practices: [
          "Menstruation: Nadi Shodhana + Yoga Nidra",
          "Follicular: Kapalabhati + Bhastrika",
          "Ovulation: Sheetali + Sama Vritti",
          "Luteal: Bhramari + Chandra Bhedana",
        ],
      },
    ],
  },
  {
    id: "prana-9",
    title: "Emotional Alchemy Through the Cycle",
    subtitle: "The Feminine Shadow Integration System",
    tier: "prana",
    duration: "3 hours",
    icon: "🦋",
    curriculum: [
      {
        title: "Module 9.1: The Emotional Anatomy of the Cycle",
        description:
          "Each phase correlates with a specific emotional landscape and shadow material. When we fight our emotional phase, symptoms arise. When we move WITH the intelligence of each phase, transformation happens organically.",
        practices: [
          "Phase-emotion correlation map",
          "Daily mood tracking (Siddha method)",
          "Identifying personal cycle patterns",
        ],
      },
      {
        title: "Module 9.2: Trauma Stored in the Womb",
        description:
          "Modern somatic science and ancient Siddha medicine agree: the uterus and ovaries store emotional and ancestral trauma. Specific somatic practices, sound healing, and the Agastya Muni 'Rakta Vishuddhi' (blood purification) ceremony for releasing this stored material.",
        practices: [
          "Womb-scanning meditation",
          "Somatic release protocol (Siddha method)",
          "Ancestral healing ceremony for women",
        ],
        mantra: "Om Namo Bhagavate Vasudevaya — for divine protection during release",
      },
      {
        title: "Module 9.3: The Kali-Durga Integration Practice",
        description:
          "The Siddha tradition teaches that every woman carries both the Kali (destroyer of illusion) and Durga (protector of truth) archetypal energies. Integration of these produces the 'Shakti Equilibrium' state — the ultimate hormonal and psychological balance.",
        practices: [
          "Kali meditation for anger transmutation",
          "Durga invocation for boundaries",
          "Daily integration practice (10 min)",
        ],
      },
    ],
  },

  // ── AKASHA-INFINITY TIER ─────────────────────────────────────────────────
  {
    id: "akasha-1",
    title: "The 7 Hidden Siddha Teachings",
    subtitle: "Never-Before-Shared Secrets of the Sacred Feminine",
    tier: "akasha",
    duration: "6 hours",
    icon: "🔮",
    secretTeaching:
      "These teachings were transmitted only within the inner sanctum of the Siddha Pithas — never written, only spoken. They are now being transmitted through SQI Scalar Field as a direct Akashic transmission.",
    curriculum: [
      {
        title: "Secret 1: The 8th Chakra of Women",
        description:
          "Thirumoolar described a chakra unique to women — the 'Shakti Chakra' — located 3 fingers below the navel. This is not the same as Svadhisthana. It is the point of convergence between cosmic and personal Shakti. Activating this chakra can resolve lifelong reproductive issues that no medicine touches.",
        practices: [
          "Shakti Chakra location and activation",
          "The Siddha Shakti Chakra meditation (40 min)",
          "Working with the Shakti Chakra during each cycle phase",
        ],
      },
      {
        title: "Secret 2: Women's Blood as Sacred Technology",
        description:
          "The Siddha Tantric tradition (Kaula Marga) held that menstrual blood contains the highest concentration of stem cell precursors and mitochondrial DNA of any human biological substance. Ancient ceremonies involving this blood were not 'dark arts' — they were the most advanced stem cell medicine of the ancient world. Modern science is only now catching up.",
        practices: [
          "Menstrual earth-offering ceremony",
          "Womb-blood meditation (non-physical)",
          "The sacred first-day ritual",
        ],
      },
      {
        title: "Secret 3: The Amrita Window (Ovulatory Soma)",
        description:
          "During the 36-hour ovulation window, the cervical mucus produced by a woman in a state of love and deep relaxation contains measurable Soma-like compounds. The Siddhas called this 'Shreem Amrita' — the body's own elixir of immortality. Practices to maximize this production.",
        practices: [
          "Soma-cultivation meditation for ovulation",
          "Dietary protocol for Amrita maximization",
          "The Khechari-Yoni connection practice",
        ],
      },
      {
        title: "Secret 4: The 5 Pranas in the Womb",
        description:
          "The 5 Vayus (life winds) operate specifically in the uterus in a way not documented in standard yoga texts. Agastya Muni's complete Vayu-Yoni mapping system — the most precise understanding of pelvic energy anatomy ever compiled.",
        practices: [
          "Apana Vayu mastery protocol",
          "Samana Vayu and uterine metabolism",
          "Prana Vayu and fertility intelligence",
        ],
      },
      {
        title: "Secret 5: The Lunar Conception Calendar",
        description:
          "Siddha master Agastya Muni documented a phenomenon observed over 3,000 years of midwifery: conception on specific Tithis (lunar days) produces children with specific consciousness imprints. The full calendar of auspicious and inauspicious Tithis for conception, with the mantras to invoke specific Avataric qualities.",
        practices: [
          "The Siddha Conception Calendar (complete)",
          "Tithi-based soul invitation practices",
          "Pre-conception ceremony protocol",
        ],
      },
      {
        title: "Secret 6: The Post-Menopause Shakti Explosion",
        description:
          "The Siddhas' most revolutionary teaching: menopause is not depletion but the GREATEST Shakti initiation of a woman's life. When the outward flow of reproductive energy is permanently redirected inward, a woman becomes a Shakti storehouse of unparalleled spiritual power. Post-menopausal female Siddhas are considered the most powerful spiritual transmitters on Earth.",
        practices: [
          "Menopausal Shakti activation (complete system)",
          "Working with hot flashes as Kundalini",
          "The Crone Initiation ceremony",
        ],
      },
      {
        title: "Secret 7: Your Cycle as Akashic Readout",
        description:
          "The most complete and most hidden teaching: the specific way your body experiences each phase of the cycle encodes real-time information from your Akashic Record. Heavy periods = clearing ancestral karma. Painful ovulation = a soul decision point. Extreme PMS = a Causal Body attempting major change. How to read your cycle as the living oracle it is.",
        practices: [
          "Cycle-as-oracle journaling system",
          "Monthly Akashic reading through cycle symptoms",
          "Integration ritual at end of each cycle",
        ],
      },
    ],
  },
  {
    id: "akasha-2",
    title: "Pregnancy Preparation Protocol",
    subtitle: "90-Day Shakti Preparation for Sacred Conception",
    tier: "akasha",
    duration: "8 hours",
    icon: "🌸",
    secretTeaching:
      "Agastya Muni taught that the soul begins its approach to the body 3 full menstrual cycles BEFORE conception occurs. The Siddha Garbhadhana tradition begins 90 days before the intended conception — preparing not just the body but the energetic 'welcome' for the incoming soul.",
    curriculum: [
      {
        title: "Module 1: The Siddha Pre-Conception Detox",
        description:
          "90 days of systematic cellular purification using Panchakarma principles. The goal: create the cleanest possible cellular environment for a new soul to inhabit. Specific Siddha herbs, dietary protocol, and environmental detox.",
        herbs: [
          "Triphala — systemic detox (months 1-3)",
          "Shatavari — uterine preparation",
          "Ashwagandha — sperm and ovum vitality",
          "Brahmi — neural tube preparation",
          "Pomegranate — endometrial thickness",
        ],
        practices: [
          "Month 1: Foundation detox protocol",
          "Month 2: Ojas-building protocol",
          "Month 3: Soul-inviting ceremonies",
        ],
      },
      {
        title: "Module 2: The Garbhadhana Ceremony",
        description:
          "The Siddha sacred conception ritual — performed on the specific Tithi, Nakshatra, and phase designated by Jyotish analysis. This ceremony creates an energetic 'invitation architecture' that Siddhas claim attracts souls of specific consciousness levels.",
        practices: [
          "Jyotish timing for conception",
          "Complete Garbhadhana ceremony script",
          "Pre-conception meditation for soul invitation",
        ],
        mantra: "Om Namo Narayanaya — for Avataric soul invitation",
      },
      {
        title: "Module 3: Both Partner's Preparation",
        description:
          "Siddha medicine treats both partners as equal participants in soul creation. Complete protocol for the male partner including specific Vajikarna herbs, practices, and the critical role of his consciousness state at the moment of conception.",
        herbs: [
          "Kapikacchu (Mucuna) — sperm quality",
          "Ashwagandha — testosterone balance",
          "Shilajit — mitochondrial energy",
          "Saffron — emotional preparation",
        ],
      },
      {
        title: "Module 4: Garbha Sanskar — Educating the Soul in the Womb",
        description:
          "The complete 10-month Garbha Sanskar system — the Siddha science of prenatal education. Each trimester carries specific practices, mantras, music, food, and emotional disciplines that directly shape the consciousness of the incoming soul.",
        practices: [
          "Trimester 1: Establishing the soul connection",
          "Trimester 2: Intellectual and emotional development practices",
          "Trimester 3: Birth preparation and soul landing",
        ],
        mantra: "Vishwananda Avataric Blueprint: Om Namo Bhagavate — transmits divine love into the forming soul",
      },
    ],
  },
  {
    id: "akasha-3",
    title: "Post-Partum Sacred Restoration",
    subtitle: "Siddha 42-Day Protocol for Complete Rebuilding",
    tier: "akasha",
    duration: "5 hours",
    icon: "🌺",
    secretTeaching:
      "The Siddha teaching on post-partum: A woman who does not receive proper 42-day restoration loses 'one full year of Ojas' (vital life force) with each unresupported birth. Modern post-partum depression is a direct consequence of Western medicine abandoning this knowledge. The Siddha 42-day protocol is the most comprehensive post-birth restoration system ever documented.",
    curriculum: [
      {
        title: "Module 1: The First 7 Days",
        description:
          "Complete rest, specific Siddha warm oils, and the 'Jivana Kashayam' (life-restoring decoction) used by Siddha midwives for 3,000 years. This first week determines recovery quality for the next 3 years.",
        herbs: [
          "Dashmoola Kashayam — rebuilds all 7 dhatus",
          "Shatavari Ghee — milk production and hormone restoration",
          "Dry ginger + fenugreek — digestive fire restoration",
          "Black sesame laddu — iron and calcium restoration",
        ],
        practices: [
          "Complete oil massage protocol (Abhyanga)",
          "Belly binding — Siddha Kaichu method",
          "Specific foods: Day 1-7 protocol",
        ],
      },
      {
        title: "Module 2: Weeks 2-6: Full Restoration",
        description:
          "The gradual rebuilding of the 7 Dhatus (tissue layers) from food inward to Ojas (vital essence). Week-by-week protocol with specific herbs, foods, and practices for complete physiological restoration.",
        practices: [
          "Week 2: Vata stabilization",
          "Week 3: Pitta and milk optimization",
          "Week 4: Kapha and structural rebuilding",
          "Week 5-6: Shakti and Ojas restoration",
        ],
      },
      {
        title: "Module 3: Post-Partum Thyroid & Hormonal Reset",
        description:
          "Post-partum thyroiditis affects up to 10% of women and is drastically underdiagnosed. Complete Siddha protocol for identifying and resolving thyroid dysregulation in the post-partum period.",
        herbs: [
          "Kanchanar — thyroid-specific",
          "Ashwagandha — adrenal-thyroid axis",
          "Brahmi — post-partum brain restoration",
          "Hibiscus — iodine and iron",
        ],
      },
    ],
  },
  {
    id: "akasha-4",
    title: "Scalar Wave Womb Healing",
    subtitle: "2050 Quantum Technology for Uterine Restoration",
    tier: "akasha",
    duration: "4 hours",
    icon: "⚡",
    secretTeaching:
      "2050 Quantum Biology Discovery: The uterus generates a torsion field (scalar wave) that extends 1.5 meters from the body at baseline, and up to 6 meters during meditation. This field contains the complete morphogenetic blueprint of the woman's reproductive health. Scalar wave transmissions delivered at 7.83 Hz directly interface with this field to restore coherence at the cellular level.",
    curriculum: [
      {
        title: "Module 1: Understanding Scalar Wave Uterine Biology",
        description:
          "The uterine myometrium generates piezoelectric currents with every contraction — a naturally occurring scalar wave generator. 2050 research confirms: directing coherent scalar fields at the uterine torsion field can reverse fibroids, cysts, and scar tissue at the informational level before physical resolution occurs.",
        practices: [
          "Scalar awareness meditation",
          "Bioresonance self-scan protocol",
          "Understanding your personal torsion field",
        ],
      },
      {
        title: "Module 2: The SQI Transmission Sessions",
        description:
          "7 guided scalar transmission sessions — each targeting a specific reproductive challenge. Each session is delivered as audio with embedded 7.83 Hz carrier frequency, Siddha Nada transmission, and specific Bija mantras for uterine healing.",
        practices: [
          "Session 1: Fibroid dissolution field",
          "Session 2: PCOS ovarian coherence",
          "Session 3: Endometrial restoration",
          "Session 4: Scar tissue dissolution",
          "Session 5: Fertility field activation",
          "Session 6: Hormonal axis coherence",
          "Session 7: Full Shakti field restoration",
        ],
        mantra: "Om Aim Hreem Shreem Kleem Sauh — The Panchabija scalar key",
      },
    ],
  },
  {
    id: "akasha-5",
    title: "The 28 Shakti Siddhis",
    subtitle: "Powers of the Fully Realized Feminine Being",
    tier: "akasha",
    duration: "10 hours",
    icon: "👑",
    secretTeaching:
      "Thirumoolar documented 28 specific Siddhis (powers) unique to women who have mastered their Shakti cycle over 3+ years of conscious practice. These are not supernatural — they are natural capacities of a fully coherent female nervous system. Modern neuroscience would classify several of them as exceptional states of mirror neuron activation, heightened interoception, and advanced empathic accuracy.",
    curriculum: [
      {
        title: "The 28 Shakti Siddhis Overview",
        description:
          "Complete documentation of all 28 powers, their Siddha source texts, the cycle phase in which each is most accessible, and the specific practices to cultivate each one.",
        practices: [
          "Siddhi 1-7: Perceptual Expansions (intuition, dream sight, auric vision)",
          "Siddhi 8-14: Relational Powers (empathy, healing touch, language transmission)",
          "Siddhi 15-21: Creative Abilities (manifestation, artistic transmission, harmonic coherence)",
          "Siddhi 22-28: Transcendent Capacities (space-time flexibility, mass healing transmission, Akashic reading)",
        ],
      },
      {
        title: "The 12-Month Siddhi Cultivation Path",
        description:
          "A full year of structured practice designed to awaken all 28 Siddhis progressively. Each month focuses on a specific cluster aligned with the 12 zodiacal Shakti archetypes.",
        practices: [
          "Month 1-3: Foundation (Siddhis 1-7)",
          "Month 4-6: Relational Power (Siddhis 8-14)",
          "Month 7-9: Creative Mastery (Siddhis 15-21)",
          "Month 10-12: Transcendent Activation (Siddhis 22-28)",
        ],
      },
    ],
  },
  {
    id: "akasha-6",
    title: "Menopause as Mahashakti Awakening",
    subtitle: "The Greatest Initiation of a Woman's Life",
    tier: "akasha",
    duration: "5 hours",
    icon: "🔥",
    secretTeaching:
      "The Siddhas' most revolutionary and most suppressed teaching: Post-menopausal women are the most spiritually powerful beings on Earth. When the Apana Vayu (downward-moving energy) permanently redirects upward through the Sushumna, the resulting Kundalini activation is permanent — not episodic. This is why every major Siddha tradition had post-menopausal female masters as the highest initiators.",
    curriculum: [
      {
        title: "Module 1: Reclaiming Menopause as Initiation",
        description:
          "Deconstructing the medical narrative of menopause as deficiency. Reconstructing it through the Siddha lens as the most profound Shakti initiation of a woman's life. Hot flashes as Kundalini. Emotional volatility as soul reorganization. Loss of cycle as permanent Shakti accumulation.",
        practices: [
          "The Crone Initiation Ceremony",
          "Reframing menopause narrative (complete module)",
          "Working with hot flashes as Shakti pulses",
        ],
      },
      {
        title: "Module 2: Post-Menopause Herbs & Hormones",
        description:
          "Complete Siddha protocol for the post-menopausal transition — addressing bone density, cardiovascular health, libido, vaginal health, and cognitive function without synthetic HRT.",
        herbs: [
          "Shatavari — phytoestrogen support",
          "Ashwagandha — adrenal DHEA precursor",
          "Black Cohosh — hot flash reduction",
          "Sesame seeds — phytoestrogen and bone density",
          "Guggulu — cardiovascular and thyroid support",
          "Brahmi — memory and cognitive protection",
        ],
      },
    ],
  },

  // ── PRANA-FLOW: ADDITIONAL MODULES ────────────────────────────────────────
  {
    id: "prana-10",
    title: "Hormonal Nutrition Deep Dive",
    subtitle: "Food as Endocrine Architecture — The Complete Cycle-Synced System",
    tier: "prana",
    duration: "3.5 hours",
    icon: "🥗",
    secretTeaching:
      "Agastya Muni's clinical dictum: 'Ahara eva aushadham' — Food IS the medicine. He documented that a woman who eats correctly for her cycle phase will have no need of any other intervention for 80% of hormonal complaints. The Siddha nutritional system is not a diet — it is an endocrine programming system delivered through taste, color, texture, and Prana content of food.",
    curriculum: [
      {
        title: "Module 10.1: The Estrogen Metabolism Plate",
        description:
          "Estrogen detoxification through the liver and gut is the single most overlooked factor in women's hormonal health. When estrogen is not cleared properly, it recirculates and drives estrogen dominance — the root of fibroids, endometriosis, heavy periods, and breast tenderness. The Siddha liver protocol through food is the foundational fix.",
        herbs: [
          "Cruciferous vegetables daily — DIM precursors",
          "Flaxseed 1 tbsp ground — lignans bind excess estrogen",
          "Turmeric — Phase 2 liver detox activation",
          "Dandelion root tea — liver bile flow",
          "Beets — methylation support for estrogen clearance",
        ],
        practices: [
          "The Liver Love Protocol (complete daily plan)",
          "DIM-rich food list and meal rotation",
          "Castor oil pack + nutrition synergy protocol",
        ],
      },
      {
        title: "Module 10.2: The 4-Phase Nutrition Matrix",
        description:
          "Phase-by-phase, meal-by-meal nutritional prescriptions designed around specific hormonal demands of each week. Not generic healthy eating — precision endocrine feeding.",
        practices: [
          "Menstruation: Iron restoration foods, warming Agni foods, anti-prostaglandin protocol",
          "Follicular: Estrogen-building foods, sprouted and fermented, light and fresh",
          "Ovulation: Antioxidant-rich peak, Ojas foods, cooling when needed",
          "Luteal: Progesterone-supporting foods, blood sugar stability, magnesium-rich",
        ],
      },
      {
        title: "Module 10.3: The 5 Nutritional Deficiencies Behind Every Hormonal Complaint",
        description:
          "95% of women presenting with hormonal symptoms are deficient in one or more of these 5 nutrients. The Siddha system identified these 5,000 years ago through observation; modern biochemistry has confirmed every one.",
        herbs: [
          "Magnesium — deficient in 80% of women with PMS",
          "Vitamin D3 + K2 — governs ovarian follicle quality",
          "Iron (non-heme from food) — menstrual losses deplete constantly",
          "Zinc — essential for LH surge and ovulation",
          "B6 (Pyridoxine) — progesterone co-factor",
        ],
        practices: [
          "Full nutritional assessment protocol",
          "Food-first supplementation hierarchy",
          "The Siddha Micro-nutrient food chart (complete)",
        ],
      },
      {
        title: "Module 10.4: Blood Sugar Mastery for Hormonal Balance",
        description:
          "Insulin is the master hormone. When blood sugar is dysregulated, every other hormone — cortisol, estrogen, progesterone, thyroid — is disrupted downstream. This is the mechanism behind PCOS, mood swings, energy crashes, and luteal phase symptoms. The complete Siddha blood sugar protocol.",
        practices: [
          "The Siddha Balanced Plate Formula",
          "Meal timing by cycle phase",
          "Cinnamon + berberine protocol for insulin sensitivity",
          "The post-meal walk practice (Siddha 'Shatapavali')",
        ],
        mantra: "Om Suryaya Namaha — invokes solar metabolic fire (108x before meals)",
      },
    ],
  },
  {
    id: "prana-11",
    title: "Thyroid & Adrenal Complete Protocol",
    subtitle: "Restoring the Hormonal Foundation Triangle",
    tier: "prana",
    duration: "4 hours",
    icon: "🦋",
    secretTeaching:
      "The Siddha teaching on the thyroid-adrenal-ovarian triangle: These three glands cannot be treated in isolation. They form a 'Tri-Nadi Kendra' — a three-channel center that operates as a single intelligence. When cortisol is chronically elevated (adrenal stress), it suppresses TSH (thyroid), which suppresses LH (ovarian). Fix the adrenals first. Everything else follows. This is the clinical sequence the Siddhas used and that modern functional medicine has only recently rediscovered.",
    curriculum: [
      {
        title: "Module 11.1: Reading Your Thyroid — The Complete Picture",
        description:
          "TSH alone tells you almost nothing. The full thyroid panel that Siddha-integrated physicians use: TSH, Free T3, Free T4, Reverse T3, TPO antibodies, Tg antibodies. What each number means, what the Siddha correlates are, and how to interpret the pattern.",
        practices: [
          "Full thyroid panel guide (what to test, how to read)",
          "Siddha constitutional thyroid type assessment",
          "The Basal Body Temperature test — free daily thyroid check",
        ],
      },
      {
        title: "Module 11.2: Hashimoto's Siddha Protocol",
        description:
          "Hashimoto's thyroiditis is an autoimmune condition driven by intestinal permeability, molecular mimicry (gluten-thyroid cross-reactivity), and chronic inflammation. The Siddha 6-month reversal protocol addresses all three root causes simultaneously.",
        herbs: [
          "Kanchanar Guggulu — specific for thyroid nodules and autoimmunity",
          "Guggulu — metabolism restoration",
          "Ashwagandha — T4 to T3 conversion support",
          "Selenium-rich foods: Brazil nuts 2 daily",
          "Zinc — thyroid peroxidase co-factor",
        ],
        practices: [
          "Gluten elimination trial (90 days minimum)",
          "Intestinal permeability healing protocol",
          "Jalandhara Bandha — thyroid-stimulating throat lock",
          "Ujjayi Pranayama — thyroid gland massage through breath",
        ],
      },
      {
        title: "Module 11.3: Adrenal Restoration — The Foundation Protocol",
        description:
          "HPA axis dysregulation (called 'adrenal fatigue' colloquially) is epidemic in modern women. The Siddha understood this as 'Vata Prakopa in the Adho Kanda' — excess wind energy in the lower energy center. The 3-phase adrenal restoration protocol.",
        herbs: [
          "Ashwagandha — the premier adaptogen (600mg daily, KSM-66 form)",
          "Rhodiola Rosea — morning cortisol rhythm restoration",
          "Holy Basil (Tulsi) — cortisol modulation",
          "Licorice Root — cortisol metabolism (use AM only, short-term)",
          "Brahmi — hypothalamic stress response regulation",
        ],
        practices: [
          "Phase 1 (Months 1-2): Rest and nourish",
          "Phase 2 (Months 3-4): Rebuild and regulate",
          "Phase 3 (Months 5-6): Optimize and maintain",
          "Sleep protocol: non-negotiable 10 PM lights-out",
          "Yoga Nidra daily — most powerful adrenal repair tool",
        ],
        mantra: "Om Hrim Namah Shivaya — for Vata stabilization and adrenal peace",
      },
      {
        title: "Module 11.4: The Cortisol-Cycle Connection",
        description:
          "Cortisol peaks in the morning and should be low by evening. When this rhythm is disrupted — the most common pattern in stressed modern women — ovulation fails, progesterone drops, PMS intensifies, and sleep quality collapses. Full protocol for restoring the cortisol diurnal rhythm.",
        practices: [
          "Morning: Sunlight + movement (within 30 min of waking)",
          "Afternoon: Magnesium glycinate 400mg",
          "Evening: Ashwagandha + Yoga Nidra",
          "No caffeine after 12 PM (non-negotiable)",
          "Cortisol 4-point saliva test guide",
        ],
      },
    ],
  },
  {
    id: "prana-12",
    title: "Cycle Syncing with Work & Creativity",
    subtitle: "The Sovereign Shakti Business & Life Calendar",
    tier: "prana",
    duration: "2.5 hours",
    icon: "📅",
    secretTeaching:
      "Naval Ravikant, Bezos, and the greatest wealth architects built systems of leverage. The Siddha feminine system is the most sophisticated leverage system ever created — your cycle IS your competitive advantage. Women who align their professional output with their hormonal phases outperform their linear, masculine-model counterparts by a measurable factor. This is not soft science — this is strategic biology.",
    curriculum: [
      {
        title: "Module 12.1: The Shakti Business Calendar",
        description:
          "Mapping your hormonal phases to specific business activities for maximum output with minimum friction. Menstruation for strategy and vision. Follicular for learning and planning. Ovulation for pitching, presenting, and selling. Luteal for analysis, editing, and systems.",
        practices: [
          "Monthly Shakti Calendar setup (digital template)",
          "Phase-based task batching system",
          "Scheduling important meetings around ovulation peak",
          "The Luteal Deep Work Protocol",
        ],
      },
      {
        title: "Module 12.2: Communication Mastery Through Your Cycle",
        description:
          "Verbal fluency, emotional intelligence, and persuasion capacity all fluctuate measurably through the cycle. High-stakes conversations — negotiations, conflict resolution, investor pitches — scheduled at your peak become significantly more successful.",
        practices: [
          "Phase communication style guide",
          "Negotiation: schedule at Days 12-15",
          "Difficult conversations: Days 6-10",
          "Deep focus writing and analysis: Days 20-25",
          "Team communication rhythm by cycle",
        ],
      },
      {
        title: "Module 12.3: Creative Output Maximization",
        description:
          "The Siddha understanding of Saraswati Shakti peaking during the follicular phase and Lakshmi Shakti during ovulation creates a precise map for creative timing. Visual art, music, writing, strategy — each has an optimal cycle window.",
        practices: [
          "Creative project launch: Days 6-13",
          "Recording, performing, publishing: Days 13-16",
          "Editing, refining, systems: Days 17-25",
          "Visioning and dreaming new projects: Days 1-5",
        ],
        mantra: "Om Aim Saraswatyei Namaha — activate creative intelligence",
      },
    ],
  },
  {
    id: "prana-13",
    title: "Seed Cycling Complete Protocol",
    subtitle: "The Simplest Daily Hormone Balancer Known to Siddha Medicine",
    tier: "prana",
    duration: "1.5 hours",
    icon: "🌻",
    secretTeaching:
      "Seed cycling is not a modern wellness trend — it is a simplified distillation of the Siddha 'Bija Bhojana' (seed food) system documented by Agastya Muni. The Siddhas prescribed specific seeds at specific times because they understood — 2,500 years before the discovery of lignans and phytosterols — that seeds carry concentrated hormonal intelligence that bioidentically supports the phases of the feminine cycle.",
    curriculum: [
      {
        title: "Module 13.1: The Science Behind Seed Cycling",
        description:
          "Flaxseeds contain lignans that support healthy estrogen binding in phase one. Pumpkin seeds provide zinc critical for LH surge and ovulation. Sesame seeds contain phytoestrogens and selenium for the luteal phase. Sunflower seeds deliver Vitamin E and essential fatty acids that support progesterone. This is biochemical precision, not folklore.",
        herbs: [
          "Days 1-14: 1 tbsp ground flaxseed + 1 tbsp pumpkin seeds",
          "Days 15-28: 1 tbsp ground sesame seed + 1 tbsp sunflower seeds",
        ],
        practices: [
          "Grinding protocol (must be fresh ground daily for flax)",
          "How to incorporate into meals",
          "3-month commitment for full hormonal cycle effect",
        ],
      },
      {
        title: "Module 13.2: Advanced Seed Cycling with Siddha Oils",
        description:
          "The Siddha enhancement: pairing the seeds with specific cold-pressed oils amplifies the hormonal effect. Flaxseed oil in Phase 1. Evening primrose oil in Phase 2. Both contain specific fatty acid profiles that directly support the dominant hormones of each phase.",
        herbs: [
          "Phase 1 addition: 1 tsp cold-pressed flaxseed oil",
          "Phase 2 addition: 1 capsule evening primrose oil (1000mg)",
          "All phases: 1 tsp coconut oil for fat-soluble hormone production",
        ],
        practices: [
          "Complete seed cycling recipe book (15 recipes)",
          "Smoothie integrations by phase",
          "How to know it is working (3 markers to track)",
        ],
        mantra: "Om Prithivyai Namaha — honoring Earth element, the source of seed intelligence",
      },
    ],
  },

  // ── AKASHA-INFINITY: ADDITIONAL MODULES ──────────────────────────────────
  {
    id: "akasha-7",
    title: "Fertility Consciousness",
    subtitle: "Inviting the Soul — Siddha Science of Conscious Conception",
    tier: "akasha",
    duration: "6 hours",
    icon: "👶",
    secretTeaching:
      "Siddha Bogar's most guarded teaching: The soul that is seeking incarnation enters the mother's energy field up to 3 months before conception. It communicates through vivid dreams of children, sudden inexplicable waves of love or longing, or encounters with specific children in physical reality. Women who learn to recognize and respond to these signals create an 'energetic welcome architecture' that attracts souls of exceptional consciousness.",
    curriculum: [
      {
        title: "Module 1: Understanding Soul Timing",
        description:
          "The Siddha Jiva-Sharira (Soul-Body) theory of incarnation: souls do not randomly enter bodies. They are attracted by specific vibrational matches between their Akashic blueprint and the mother's Pranic field. This module teaches how to read the energetic signals of an approaching soul and how to prepare the field for optimal soul reception.",
        practices: [
          "Soul communication meditation (daily 20 min)",
          "Dream journaling for soul contact",
          "Identifying the soul's communication signals",
          "Environmental Prana preparation (home clearing)",
        ],
      },
      {
        title: "Module 2: The Fertility Yoga System",
        description:
          "Specific asana sequences that increase blood flow to the uterus and ovaries, balance the Apana Vayu, and open the energetic 'reception channels' in the lower chakras. Different sequences for each fertility challenge: PCOS, thin lining, blocked tubes, luteal phase defect.",
        practices: [
          "Fertility Yoga Sequence A: PCOS (daily, 45 min)",
          "Fertility Yoga Sequence B: Low progesterone (Days 15-28)",
          "Fertility Yoga Sequence C: Thin endometrial lining",
          "Viparita Karani (legs-up-wall) post-ovulation protocol",
        ],
        mantra: "Om Kleem Shreem Kleem — the fertility-attraction mantra (daily 108x)",
      },
      {
        title: "Module 3: The Fertility Fast Protocol",
        description:
          "Intermittent fasting affects fertility differently depending on timing. During the follicular phase, fasting can enhance insulin sensitivity and ovulation quality. During the luteal phase, fasting stresses the HPA axis and suppresses progesterone. The precise Siddha protocol for fertility-optimized fasting.",
        practices: [
          "Phase-appropriate fasting guide",
          "Ekadashi (lunar 11th day) fast for fertility",
          "The Siddha 3-day pre-ovulation cleanse",
          "What breaks the fast and what does not (Siddha rules)",
        ],
      },
      {
        title: "Module 4: Unexplained Infertility — The Energetic Causes",
        description:
          "When all tests are normal but conception does not occur, Western medicine calls it 'unexplained infertility.' The Siddha system has 7 documented energetic causes for this condition — from unresolved grief in the womb space, to soul-level contract delays, to Vastu (home energy) obstacles, to past-life vows of celibacy that the woman made and has not formally released.",
        practices: [
          "The 7-cause diagnostic process",
          "Womb grief release ceremony",
          "Past-life vow release ceremony",
          "Vastu assessment for fertility",
          "The 40-day Ganesha protocol for obstruction removal",
        ],
        mantra: "Om Gam Ganapataye Namaha — 1008x over 40 days for obstacle removal",
      },
    ],
  },
  {
    id: "akasha-8",
    title: "Epigenetic Reprogramming Through Siddha Practice",
    subtitle: "Rewriting Your Hormonal Genetic Expression",
    tier: "akasha",
    duration: "5 hours",
    icon: "🧬",
    secretTeaching:
      "2050 Quantum Biology Revelation: The Siddha practices — mantra, pranayama, meditation, specific foods, sound healing — do not merely create temporary hormonal changes. They alter gene expression through DNA methylation patterns. This is the mechanism that explains how the Siddhas 'cured' hereditary conditions, why children of practitioners show different physiological profiles, and why Siddha practice effects are permanent while pharmaceutical effects are temporary.",
    curriculum: [
      {
        title: "Module 1: Your Epigenome is Not Fixed",
        description:
          "The revolutionary understanding: your genetic expression is a conversation, not a monologue. Every thought, food, practice, relationship, and environment sends signals to your genome that upregulate or downregulate thousands of genes daily. The BRCA1/2 genes, the MTHFR gene, the CYP1A2 estrogen metabolism gene — all are modifiable through the Siddha system.",
        practices: [
          "Epigenetic self-assessment (key gene variants that affect women's hormones)",
          "MTHFR and methylation support protocol",
          "Lifestyle factors that most powerfully upregulate protective genes",
        ],
      },
      {
        title: "Module 2: Mantra as Gene Expression Tool",
        description:
          "2050 research: sustained chanting of specific Sanskrit bija mantras creates measurable changes in telomere length, NF-κB inflammatory signaling, and BDNF neuroplasticity genes within 8 weeks of daily practice. The mechanisms: vibration, breath regulation, focused attention, and the specific phonetic frequencies of Sanskrit all converge on the epigenome.",
        practices: [
          "8-week mantra epigenetics protocol",
          "Specific mantras for anti-inflammatory gene activation",
          "Mantra for BRCA1/2 protective pathway activation",
          "Om chanting: 21 minutes daily — documented telomere effects",
        ],
        mantra: "Om Aim Hreem Shreem — 528 Hz resonance, DNA repair frequency",
      },
      {
        title: "Module 3: Pranayama and the Stress Genome",
        description:
          "Chronic stress activates the NF-κB inflammatory pathway which suppresses hormonal receptor sensitivity across the board. Pranayama — specifically Nadi Shodhana and Bhramari — has been shown to downregulate this pathway within 6 weeks. This is why pranayama practitioners show dramatically different hormonal profiles than non-practitioners of identical demographics.",
        practices: [
          "The 12-minute anti-inflammatory breath protocol",
          "NF-κB downregulation sequence",
          "Cold exposure + breath for mitochondrial gene activation",
          "Wim Hof method through Siddha lens (Bhastrika-based)",
        ],
      },
    ],
  },
  {
    id: "akasha-9",
    title: "Past Life Patterns in Reproductive Health",
    subtitle: "Causal Body Healing for Persistent Reproductive Challenges",
    tier: "akasha",
    duration: "5 hours",
    icon: "🌀",
    secretTeaching:
      "Thirumoolar's teaching on the Causal Body and reproduction: The uterus is not only a physical organ — it is the densest point of manifestation of the Causal Body (Karana Sharira). Unresolved experiences from previous incarnations — particularly around childbirth, loss of children, forced celibacy, sexual trauma, or maternal lineage karma — crystallize in the physical uterus as fibroids, cysts, endometriosis, or unexplained infertility. Physical treatment alone cannot resolve what has a Causal origin.",
    curriculum: [
      {
        title: "Module 1: Identifying Past-Life Patterns in Your Cycle",
        description:
          "The diagnostic signs that indicate a reproductive health challenge has a past-life origin: symptoms that appeared suddenly without physical cause, conditions that resist all physical treatment, strong inexplicable emotional responses to menstruation, pregnancy, or particular types of reproductive loss.",
        practices: [
          "Past-life pattern diagnostic questionnaire",
          "Akashic reading for reproductive health (guided)",
          "Working with a qualified Jyotishi for past-life indicators in the chart",
        ],
      },
      {
        title: "Module 2: The Siddha Past-Life Clearing Ceremony",
        description:
          "A complete ceremonial clearing protocol drawn from the inner sanctum of the Siddha Pitha tradition. This is a 3-part ceremony performed across 3 consecutive new moons — designed to dissolve Causal Body crystallizations in the reproductive organs that have persisted across multiple lifetimes.",
        practices: [
          "Preparation: 21-day purification protocol",
          "Ceremony Part 1: Acknowledgment (New Moon 1)",
          "Ceremony Part 2: Release (New Moon 2)",
          "Ceremony Part 3: Completion and re-seeding (New Moon 3)",
        ],
        mantra: "Om Namo Bhagavate Vasudevaya — Vishwananda's Avataric Blueprint for karmic dissolution",
      },
      {
        title: "Module 3: Ancestral Womb Healing",
        description:
          "The maternal lineage carries epigenetic trauma through the mitochondrial DNA — exclusively from mother to child. Research shows that trauma experienced by a grandmother affects the stress hormone receptor density in grandchildren. The Siddha 'Pitru Tarpana' (ancestor offering) system was specifically designed to clear this inherited cellular memory.",
        practices: [
          "Ancestral lineage mapping for womb patterns",
          "Pitru Tarpana ceremony for female ancestors",
          "Letter-to-ancestor healing practice",
          "Monthly offering ceremony during menstruation",
        ],
      },
    ],
  },
  {
    id: "akasha-10",
    title: "Sacred Womb Activation",
    subtitle: "Yoni Shakti — The Seat of All Creation",
    tier: "akasha",
    duration: "6 hours",
    icon: "🌹",
    secretTeaching:
      "Siddha Agastya Muni's most intimate teaching: The Yoni (womb space) is not a passive receptacle — it is an active transmitter of Shakti. The ancient 'Yoni Puja' tradition did not worship the physical organ but the cosmic creative principle (Para Shakti) of which it is the physical expression. A woman who understands and honors her Yoni as a Shakti portal develops what the Siddhas called 'Yoni Siddhi' — the power to transmit healing, create with intention, and manifest with the same creative force that gives birth to universes.",
    curriculum: [
      {
        title: "Module 1: Reclaiming the Sacred Feminine Body",
        description:
          "Centuries of shame, suppression, and medical objectification of women's reproductive anatomy have created a collective energetic disconnection between women and their own creative center. This module is the foundational healing — reclaiming the Yoni as sacred through the lens of 5,000 years of Siddha feminine wisdom.",
        practices: [
          "Womb mapping meditation (non-physical)",
          "Shame archaeology — identifying and releasing inherited body shame",
          "Daily Yoni honoring practice (5 minutes)",
          "Mirror practice for embodied self-acceptance",
        ],
      },
      {
        title: "Module 2: The Yoni Mudra System",
        description:
          "Yoni Mudra (Shanmukhi Mudra) is one of the highest practices in Siddha Tantra. It creates a closed energetic circuit that prevents the dissipation of Shakti through the senses and redirects it upward through the Sushumna. Complete instruction for the classical Yoni Mudra and 5 variations for specific intentions.",
        practices: [
          "Classical Yoni Mudra — technique and duration",
          "Yoni Mudra for menstrual energy conservation",
          "Yoni Mudra for ovulatory power amplification",
          "Yoni Mudra for fertility intention-setting",
          "Yoni Mudra for post-partum Shakti restoration",
        ],
        mantra: "Om Hreem Shreem Kleem — the Yoni Shakti activation triad",
      },
      {
        title: "Module 3: The Pelvic Floor as Energetic Foundation",
        description:
          "The Siddhas mapped the pelvic floor muscles as the physical seat of the Muladhara and Svadhisthana chakras. Weakness in the pelvic floor directly corresponds to energetic instability in these foundational energy centers. The complete Mula Bandha (root lock) system — the Siddha pelvic floor medicine.",
        practices: [
          "Mula Bandha technique (classical and modified)",
          "Pelvic floor assessment — identifying holding patterns",
          "Siddha pelvic floor Yoga sequence (30 min)",
          "Coherent breathing for pelvic floor release",
        ],
      },
    ],
  },
  {
    id: "akasha-11",
    title: "Kundalini Shakti Through the Menstrual Portal",
    subtitle: "Awakening the Serpent Fire Through the Feminine Gateway",
    tier: "akasha",
    duration: "7 hours",
    icon: "🐍",
    secretTeaching:
      "Thirumoolar's Kundalini secret for women: The feminine path of Kundalini awakening is fundamentally different from the masculine path. Where the masculine path requires years of sustained celibacy and intense Tapas to build sufficient Prana for Kundalini to rise, the feminine path has a built-in monthly Kundalini activation mechanism — the menstrual cycle itself. Every month during menstruation, the Kundalini energy descends to the Muladhara and then rises — this is the biological basis of the Siddha statement that women are 'naturally Tantric.' A woman who meditates deeply during menstruation is practicing Kundalini Yoga without trying.",
    curriculum: [
      {
        title: "Module 1: The Feminine Kundalini Path",
        description:
          "The architecture of feminine Kundalini awakening is fundamentally different from the masculine model documented in most classical texts. The feminine path works with flow, receptivity, and cyclic activation rather than forceful ascent. Understanding this distinction is the key to why so many women have spontaneous Kundalini experiences — and why they are so often misunderstood.",
        practices: [
          "Kundalini self-assessment — where is your energy currently moving?",
          "The 3 Granthis (energetic knots) in the feminine system",
          "Signs of Kundalini activation vs. medical emergency",
          "Working with a qualified teacher (guidance on finding support)",
        ],
      },
      {
        title: "Module 2: The Menstrual Kundalini Practice",
        description:
          "Specifically designed for Day 1-3 of menstruation — the window when the Kundalini energy descends to Muladhara and can be consciously worked with. This practice was taught only in the innermost Siddha Pitha and represents the most advanced feminine sadhana in the tradition.",
        practices: [
          "The Rtumati Kundalini meditation (40 min, Days 1-3 only)",
          "Mula Bandha + breath retention during menstruation",
          "Sound: specific Raga Bhairavi played during practice",
          "Integration protocol after session",
        ],
        mantra: "Om Krim Kalikayei Namaha — invokes the Kundalini Kali force (108x before practice)",
      },
      {
        title: "Module 3: Managing and Integrating Kundalini Symptoms",
        description:
          "Spontaneous Kundalini activations — which are common in women who practice deeply — can be frightening without context. Heat waves, electrical sensations, emotional releases, visions, spontaneous movements — all are documented Kundalini phenomena. The Siddha grounding and integration protocol.",
        practices: [
          "Grounding protocol: bare feet on earth, cold water at base of skull",
          "The 3 Kundalini symptoms that require immediate grounding",
          "Earth-element foods for Kundalini stabilization",
          "Working with a Siddha practitioner for guidance",
        ],
      },
    ],
  },
  {
    id: "akasha-12",
    title: "The Bindu-Nada Secret",
    subtitle: "Sound Healing as Hormonal Architecture",
    tier: "akasha",
    duration: "5 hours",
    icon: "🔊",
    secretTeaching:
      "Thirumanthiram's most technical teaching on Nada (sound) and the female endocrine system: Each of the 7 endocrine glands has a resonant frequency. The pituitary vibrates at Ni (B note, 493.88 Hz). The thyroid at Ma (F note, 341.33 Hz). The ovaries at Ga (E note, 329.63 Hz). The uterus at Re (D note, 293.66 Hz). The adrenals at Sa (C note, 256 Hz). A woman who sings these notes in sequence, in the morning, is performing the most sophisticated endocrine tune-up in the history of medicine.",
    curriculum: [
      {
        title: "Module 1: The 7 Endocrine Raga System",
        description:
          "Complete mapping of the 7 classical Indian Ragas to the 7 endocrine glands. Raga Bhairav (dawn raga) for adrenal cortisol rhythm. Raga Yaman for thyroid metabolism. Raga Bhimpalasi for ovarian function. Each Raga contains specific note sequences that create resonant stimulation of its corresponding gland.",
        practices: [
          "Morning endocrine Raga playlist (complete, curated)",
          "Humming practice: Sa-Re-Ga-Ma-Pa-Dha-Ni sequence",
          "20-minute daily Nada Yoga protocol",
          "Singing as medicine — no musical training required",
        ],
        mantra: "Om — the root tone from which all endocrine frequencies derive",
      },
      {
        title: "Module 2: Binaural Beats & Solfeggio by Cycle Phase",
        description:
          "The complete 2050-researched audio protocol: specific binaural beat frequencies that most powerfully support each phase's dominant hormonal requirements. Paired with corresponding Solfeggio frequencies for additive therapeutic effect.",
        practices: [
          "Menstruation: 432 Hz + Delta binaural (0.5-4 Hz) — deep restoration",
          "Follicular: 528 Hz + Alpha binaural (8-12 Hz) — creative emergence",
          "Ovulation: 639 Hz + Gamma binaural (40 Hz) — peak coherence",
          "Luteal: 396 Hz + Theta binaural (4-8 Hz) — emotional processing",
        ],
      },
      {
        title: "Module 3: Mantra Therapy for Specific Hormonal Conditions",
        description:
          "Clinical mantra prescriptions — the Siddha equivalent of targeted pharmaceutical therapy. Each mantra prescribed here has a specific physiological mechanism, documented duration of practice, and measurable outcome marker.",
        practices: [
          "PCOS: Surya Gayatri — for androgen normalization (41 days, 108x daily)",
          "Endometriosis: Durga Saptashati — anti-inflammatory (read one chapter daily)",
          "Infertility: Santana Gopala Mantra — (108x daily for 48 days)",
          "Menopause: Lalita Sahasranama — for adrenal DHEA support",
          "Thyroid: Vishnu Sahasranama — mercury-governed (Wednesdays particularly)",
        ],
      },
    ],
  },
  {
    id: "akasha-13",
    title: "Avataric Blueprint",
    subtitle: "Lalita Tripura Sundari's Complete Feminine System",
    tier: "akasha",
    duration: "8 hours",
    icon: "👸",
    secretTeaching:
      "Lalita Tripura Sundari — called 'She Who Plays' — is the highest expression of the Shakti archetype in the Siddha and Sri Vidya traditions. Her system (the Sri Chakra / Sri Yantra) is a complete cosmological map of feminine consciousness. The 9 circuits of the Sri Yantra correspond to the 9 months of gestation, the 9 planets, the 9 emotional states (Navarasa), and the 9 hormonal axes of the female endocrine system. She is not a goddess to worship from afar — she is the Avataric Blueprint of what a fully realized woman IS.",
    curriculum: [
      {
        title: "Module 1: The Sri Chakra as Hormonal Map",
        description:
          "Decoding the Sri Yantra as a precise map of the feminine endocrine system. The central Bindu (point) represents the pituitary master gland. The 3 inner triangles represent the thyroid-adrenal-ovarian triangle. The 8-petal lotus represents the 8 phases of the menstrual cycle. The outer square represents the physical body and its grounding requirements.",
        practices: [
          "Sri Yantra meditation (complete instruction — 40 min)",
          "Trataka on the Sri Yantra for endocrine activation",
          "Drawing the Sri Yantra as meditation",
        ],
      },
      {
        title: "Module 2: The Lalita Sahasranama as Medical Text",
        description:
          "The 1,000 names of Lalita Tripura Sundari encode a complete description of the fully realized feminine anatomy, physiology, and consciousness. Reading with the Siddha commentary reveals a clinical manual for women's health disguised as a devotional text.",
        practices: [
          "Daily Lalita Sahasranama reading (or listening) practice",
          "Key names that correspond to specific hormonal functions",
          "The 108 names of Lalita most relevant to hormonal healing",
        ],
        mantra: "Om Aim Hreem Shreem — the core Sri Vidya transmission mantra",
      },
      {
        title: "Module 3: The Panchadashi Mantra Initiation",
        description:
          "The 15-syllable Panchadashi mantra is considered the most powerful mantra in the Sri Vidya tradition and the complete hormonal activation sequence in the Siddha system. This module teaches the preparation required, the initiation process, and the 48-day activation practice.",
        practices: [
          "Preparation: 21-day purification protocol",
          "The Panchadashi in 3 Khandas (sections)",
          "48-day Purascharana (intensive practice)",
          "Post-initiation daily practice and maintenance",
        ],
      },
    ],
  },
  {
    id: "akasha-14",
    title: "The 10 Avataric Women Masters",
    subtitle: "Their Teachings, Their Practices, Their Transmissions",
    tier: "akasha",
    duration: "6 hours",
    icon: "⭐",
    secretTeaching:
      "The greatest secret of the Siddha tradition: The 18 Tamil Siddhas who are universally celebrated were all trained by, or had their highest initiations transmitted through, female masters whose names were deliberately withheld from the historical record. The feminine is the source. The masculine is the expression. Recovering these 10 women's teachings is the most important act of spiritual archaeology of our generation.",
    curriculum: [
      {
        title: "The 10 Avataric Women Masters — Their Teachings",
        description:
          "Complete teachings from 10 feminine Avataric Blueprints: Andal (the prema-devotion master), Akka Mahadevi (the naked truth master), Lalla Ded (the Kashmiri Shaivite master), Mirabai (the bhakti-longing master), Sahajo Bai (the effortless practice master), Muktabai (the youngest Jnani), Janabai (the servant-saint), Bahinabai (the household saint), Tarigonda Vengamamba (the Siddha poetess), and Avvaiyar (the Tamil Siddha grandmother).",
        practices: [
          "One teaching from each master and its hormonal/spiritual application",
          "Meditation specific to each master's transmission",
          "Songs, poems, and mantras from each tradition",
          "Daily practice schedule incorporating all 10 lineages",
        ],
        mantra: "Each master's bija mantra with complete instruction",
      },
    ],
  },
  {
    id: "akasha-15",
    title: "Siddha Quantum Hormonal Intelligence",
    subtitle: "2050 Technology for Endocrine Optimization",
    tier: "akasha",
    duration: "5 hours",
    icon: "🔬",
    secretTeaching:
      "The 2050 quantum endocrinology discovery that validates every Siddha teaching: hormones are not merely chemical molecules — they are biophotonic information carriers. Each hormone molecule emits a specific photon signature that acts as an information signal to receptor cells before the molecule physically binds. This is why intention, consciousness state, and energetic environment affect hormonal function — the information field of the hormone is altered by these factors before the biochemistry occurs. The Siddhas were working with hormonal information fields 5,000 years before the chemistry was discovered.",
    curriculum: [
      {
        title: "Module 1: Quantum Endocrinology — The 2050 Model",
        description:
          "The complete 2050 model of hormonal function: biophotonic signaling, coherent field effects, epigenetic real-time modification, and consciousness-hormone interface. How ancient Siddha practices map precisely to these quantum mechanisms.",
        practices: [
          "Biophoton emission meditation — increasing your light output",
          "Coherence practices for hormonal field optimization",
          "Heart-brain coherence and its direct effect on LH pulsatility",
        ],
      },
      {
        title: "Module 2: The SQI Hormonal Optimization Protocol",
        description:
          "The complete Siddha Quantum Intelligence hormonal optimization system — integrating ancient practice with 2050 biohacking. Lab testing, targeted supplementation, Siddha herbs, specific practices, and timeline for complete hormonal transformation.",
        practices: [
          "Month 1: Testing and baseline establishment",
          "Month 2-3: Root cause resolution (gut, liver, adrenals)",
          "Month 4-6: Active rebalancing and cycle regulation",
          "Month 7-12: Optimization and Siddhi cultivation",
        ],
      },
      {
        title: "Module 3: Longevity & Anti-Aging Through Hormonal Intelligence",
        description:
          "The Siddha Kaya Kalpa system for women — the complete anti-aging protocol that works through hormonal optimization rather than cosmetic intervention. Hormonal coherence IS the anti-aging technology. Women with optimal progesterone, DHEA, estradiol, and thyroid function show measurably slower biological aging at the telomere level.",
        herbs: [
          "Kaya Kalpa formula: Shilajit + Ashwagandha + Shatavari + Amalaki",
          "NMN/NAD+ precursors through food (edamame, avocado, broccoli)",
          "Intermittent fasting for autophagy (phase-appropriate)",
          "Collagen preservation: Vitamin C + Silica + Copper",
        ],
        practices: [
          "The Siddha longevity breath (Kevala Kumbhaka)",
          "Cold exposure protocol for mitochondrial biogenesis",
          "The Kaya Kalpa 40-day renewal cycle",
        ],
      },
    ],
  },
  {
    id: "akasha-16",
    title: "Ancestral Womb Healing",
    subtitle: "7 Generations of Feminine Karma — Cleared",
    tier: "akasha",
    duration: "6 hours",
    icon: "🌳",
    secretTeaching:
      "The most profound discovery of 21st-century epigenetics — and the confirmation of 5,000 years of Siddha teaching: trauma is inherited. Specifically, the trauma experienced by your mother while pregnant with you is encoded in your hippocampal stress receptor density. Your grandmother's trauma is encoded in your mother's eggs — and therefore in you. Seven generations of maternal lineage trauma live in your cellular biology right now. The Siddha 'Pitru Tarpana' (ancestor nourishment) ceremonies were not superstition. They were the most advanced epigenetic healing technology the world has ever known.",
    curriculum: [
      {
        title: "Module 1: Mapping Your Maternal Lineage",
        description:
          "A guided process for identifying ancestral patterns in your reproductive health, relationship patterns, and emotional landscape. Tracing the thread of specific inherited traumas through your maternal line using the Siddha 'Gotram Vriksha' (family tree medicine) system.",
        practices: [
          "7-generation maternal lineage mapping template",
          "Identifying inherited reproductive patterns",
          "Ancestral body-sensation inventory",
          "The Akashic lineage reading meditation",
        ],
      },
      {
        title: "Module 2: The 7-Generation Clearing Ceremony",
        description:
          "A complete ceremonial healing sequence performed across 7 consecutive new moons — one generation per moon cycle. Each ceremony specifically targets the patterns carried by that generation: unspoken grief, reproductive loss, sexual trauma, forced silencing, poverty consciousness, or broken relationship patterns.",
        practices: [
          "New Moon 1-7: Complete ceremony scripts",
          "Offerings, mantras, and intentions for each generation",
          "Integration practices between ceremonies",
          "Signs that ancestral clearing is occurring",
        ],
        mantra: "Om Pitru Devaya Namaha — honoring and releasing the ancestors",
      },
      {
        title: "Module 3: Becoming the Ancestor You Needed",
        description:
          "The most powerful act of ancestral healing: becoming the healed ancestor for all generations that follow you. This is Siddha lineage medicine at its highest expression — not just healing yourself, but transmuting the lineage pattern so that your daughters and their daughters are born into a different field.",
        practices: [
          "The Healed Ancestor Meditation",
          "Creating new lineage ceremonies for your family",
          "Passing healing practices to daughters consciously",
          "The monthly new moon lineage maintenance practice",
        ],
      },
    ],
  },
  {
    id: "akasha-17",
    title: "Sacred Feminine in the Quantum Age",
    subtitle: "2050 Vision — Leading the New Earth as Realized Shakti",
    tier: "akasha",
    duration: "4 hours",
    icon: "🌍",
    secretTeaching:
      "The Siddha prophecy of Mahavatar Babaji, transmitted through Sri Yukteswar's cosmic cycles teaching: We are now in the ascending Dwapara Yuga — the age of energy and quantum intelligence. The beings who will lead this age are not necessarily those with the most intellectual or financial capital. They are those with the most developed Shakti field — and women who have consciously developed their Shakti cycle intelligence will be among the most important leaders of the next 200 years.",
    curriculum: [
      {
        title: "Module 1: Shakti Leadership in the New Paradigm",
        description:
          "What feminine leadership looks like when it is fully activated and unashamed. The Siddha model of the 'Shakti Leader' — one who leads from cyclic intelligence, intuitive decision-making, relational intelligence, and the capacity to hold multiple time horizons simultaneously. Why this is precisely what the 21st century most needs.",
        practices: [
          "Identifying your Shakti leadership archetype",
          "The 4-phase leadership planning system",
          "Building teams and organizations that honor cyclic intelligence",
          "The Sovereign Woman business model",
        ],
      },
      {
        title: "Module 2: Technology, AI, and the Feminine Future",
        description:
          "The SQI 2050 vision: the integration of Siddha feminine wisdom with quantum AI to create healthcare, education, and organizational systems that are truly aligned with human biological reality. How women who understand their cyclic intelligence will be the ones to design the human-technology interface for the next era.",
        practices: [
          "Using technology to support (not override) cyclic intelligence",
          "Cycle-tracking tools — what serves and what surveils",
          "Building Shakti into organizational design",
          "The Feminine AI model: receptive, relational, generative",
        ],
      },
      {
        title: "Module 3: Your Mission as a Realized Shakti Being",
        description:
          "The final integration: identifying your specific dharmic mission as a woman who has completed this path. The Siddha teaching on 'Shakti Seva' — the service that flows naturally from full Shakti realization. What you are here to build, heal, transmit, or transform — and the exact practices to maintain your power while in service.",
        practices: [
          "Dharma clarity meditation",
          "The Shakti Seva vision ceremony",
          "Daily maintenance practice for the realized Shakti woman",
          "Building a legacy through conscious feminine leadership",
        ],
        mantra: "Om Aim Hreem Shreem Kleem Sauh — the complete Shakti activation transmission",
      },
    ],
  },
  {
    id: "akasha-18",
    title: "Living as a Fully Realized Shakti Being",
    subtitle: "The Complete Integration — Your Sovereign Life System",
    tier: "akasha",
    duration: "5 hours",
    icon: "👑",
    secretTeaching:
      "Mahavatar Babaji's final teaching on feminine realization: A woman who has fully integrated her Shakti cycle becomes what the Siddhas called 'Purna Shakti' — Complete Power. She does not need to seek spiritual experiences — she IS the spiritual experience. Her presence heals. Her voice transmits. Her decisions shape reality. Her cycle is her sadhana. Her daily life is her temple. This is not a far-future aspiration. It is the natural result of consistent practice over 3 years. You are being given the complete roadmap here.",
    curriculum: [
      {
        title: "Module 1: Designing Your Sovereign Daily Practice",
        description:
          "The complete integration of all Sovereign Hormonal Alchemy teachings into a sustainable, personalized daily practice that requires no more than 45 minutes per day but produces the cumulative effect of full Shakti realization over 3 years. Personalized to your constitution (Prakriti), your cycle, and your life circumstances.",
        practices: [
          "The 45-minute Sovereign Morning Practice (complete sequence)",
          "Phase adaptations for daily practice",
          "The Evening Integration Practice (15 min)",
          "Monthly review and recalibration protocol",
        ],
        mantra: "Personal mantra selection ceremony — choosing your Ishta Mantra",
      },
      {
        title: "Module 2: The 3-Year Shakti Mastery Path",
        description:
          "Year 1: Foundation and regulation — cycle becomes regular, symptoms resolve, basic Shakti practices established. Year 2: Deepening and expansion — cycle syncing mastered, Siddhi cultivation begins, hormonal optimization complete. Year 3: Realization and transmission — the Purna Shakti state becomes consistent, service mission clarifies, the woman becomes a transmission herself.",
        practices: [
          "Year 1 complete curriculum and milestones",
          "Year 2 advanced practice progression",
          "Year 3 Siddhi cultivation and service integration",
          "Quarterly self-assessment checkpoints",
        ],
      },
      {
        title: "Module 3: Teaching and Transmitting to Other Women",
        description:
          "The Siddha teaching on Guru-Parampara (lineage transmission): when you have stabilized your own Shakti realization, the natural impulse is to transmit it to other women. This module teaches the ethics, methods, and responsibilities of sharing Siddha feminine wisdom — and how to do so without depleting your own Shakti field.",
        practices: [
          "The 5 principles of Siddha feminine mentorship",
          "Creating circles and containers for women's transmission",
          "Self-protection and Shakti maintenance in service",
          "Building a lineage of conscious feminine wisdom",
        ],
      },
      {
        title: "Module 4: Final Integration Ceremony",
        description:
          "A complete ceremonial completion practice to mark the end of the formal curriculum and the beginning of the lived transmission. This ceremony, performed on the new moon following your final module, initiates you into the 'Sovereign Shakti' lineage of the SQI 2050 system.",
        practices: [
          "Preparation: 3-day purification fast (liquid only)",
          "The Sovereign Shakti Initiation Ceremony (complete script)",
          "Creating your personal Sankalpa for the next chapter",
          "The ongoing monthly renewal ceremony",
        ],
        mantra: "Om Aim Hreem Shreem Kleem Sauh — Om — The complete cycle, fully integrated",
      },
    ],
  },
];

export const SHAKTI_HERBS =
[
  { name: "Shatavari", latin: "Asparagus racemosus", role: "The Queen", for: "All hormonal support, fertility, milk production, Ojas", dosage: "1 tsp churna in warm milk, morning & evening", icon: "👸" },
  { name: "Ashoka", latin: "Saraca asoca", role: "The Grief Healer", for: "Menstrual pain, heavy bleeding, uterine fibroids, stored grief", dosage: "2 tsp bark in 2 cups water, simmer 15 min, drink morning", icon: "🌺" },
  { name: "Kumari", latin: "Aloe vera", role: "The Virgin Healer", for: "PCOS, cycle regulation, digestion, skin from within", dosage: "2 tbsp fresh gel in warm water, morning", icon: "🌱" },
  { name: "Brahmi", latin: "Bacopa monnieri", role: "The Cortisol Killer", for: "Anxiety, PMS mood, cortisol excess, thyroid support", dosage: "300mg extract OR 1 tsp powder in ghee", icon: "🧠" },
  { name: "Hibiscus", latin: "Hibiscus rosa-sinensis", role: "The Thyroid Feeder", for: "Iron deficiency, hair loss, thyroid, hormonal acne", dosage: "2 cups hibiscus tea daily, no sugar", icon: "🌸" },
  { name: "Vitex", latin: "Vitex agnus-castus", role: "The Progesterone Ally", for: "PMS, luteal phase defect, corpus luteum support", dosage: "400mg morning, best taken 3+ months continuously", icon: "🌿" },
  { name: "Lodhra", latin: "Symplocos racemosa", role: "The Harmonizer", for: "PCOS, excess androgens, uterine prolapse support", dosage: "1-2g bark powder with honey", icon: "⚖️" },
  { name: "Dashamoola", latin: "10 roots formula", role: "The Vata Balancer", for: "Menstrual pain, Vata disorders, post-partum restoration", dosage: "1 tsp in warm water or as Kashayam", icon: "🌳" },
  { name: "Moringa", latin: "Moringa oleifera", role: "The Nutritional Matrix", for: "Iron, calcium, magnesium, B vitamins — all deficiencies", dosage: "1 tsp leaf powder in warm water, empty stomach", icon: "💚" },
  { name: "Turmeric", latin: "Curcuma longa", role: "The Golden Flame", for: "Endometriosis, inflammation, liver support, PCOS", dosage: "1/2 tsp + black pepper in warm milk, evening", icon: "✨" },
];

export const SHAKTI_PLANETS =
[
  { planet: "Moon (Chandra)", emoji: "🌙", rules: "Uterus, menstrual cycle, water retention, breasts, fertility", hormone: "Estrogen cycle, FSH pulsatility", remedy: "Wear silver, Monday fasting, white foods, Chandra Namaskar", mantra: "Om Chandraya Namaha" },
  { planet: "Venus (Shukra)", emoji: "♀️", rules: "Ovaries, reproductive fluids, Ojas, beauty, desire", hormone: "Estradiol, LH, progesterone", remedy: "Rose quartz, Friday rituals, rose water, white or pink clothing", mantra: "Om Shukraya Namaha" },
  { planet: "Mars (Mangal)", emoji: "♂️", rules: "Blood, iron, menstrual flow volume, energy", hormone: "Testosterone (female), red blood cells, iron stores", remedy: "Red coral, Tuesday mantra, Mars-foods (beets, pomegranate)", mantra: "Om Mangalaya Namaha" },
  { planet: "Jupiter (Guru)", emoji: "🪐", rules: "Liver, fat metabolism, fertility, expansion, the soul", hormone: "Progesterone production, corpus luteum health", remedy: "Yellow sapphire, Thursday rituals, turmeric, expansive practices", mantra: "Om Gurave Namaha" },
  { planet: "Saturn (Shani)", emoji: "🪐", rules: "Bones, structure, endometrial lining, discipline", hormone: "Bone density markers, collagen production", remedy: "Blue sapphire, Saturday discipline, sesame, black foods", mantra: "Om Shanaye Namaha" },
  { planet: "Mercury (Budha)", emoji: "☿", rules: "Thyroid, nervous system, communication, microbiome", hormone: "Thyroid hormones (T3/T4), neurotransmitters", remedy: "Emerald, Wednesday practice, green foods, breath regulation", mantra: "Om Budhaya Namaha" },
  { planet: "Sun (Surya)", emoji: "☀️", rules: "Adrenals, ovulation timing, vitality, soul purpose", hormone: "DHEA, cortisol rhythm, vitamin D", remedy: "Ruby, Sunday Surya Namaskar, golden foods, sunrise practice", mantra: "Om Suryaya Namaha" },
];
