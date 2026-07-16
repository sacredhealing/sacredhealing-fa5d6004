// Brahma Muhurta -- extracted verbatim from the original BrahmaMuhurta.tsx
// page file (12 modules: body/inner-teaching text, data points, practice
// steps, mantras, and secret teachings).

export interface BrahmaSecretTeaching { label: string; body: string; }
export interface BrahmaModuleStep { num: number; title: string; time: string; desc: string; }
export interface BrahmaDataPoint { label: string; value: string; }
export interface BrahmaMantraItem { label: string; text: string; meaning: string; }
export interface BrahmaModule {
  id: number;
  tier: 'free' | 'prana' | 'siddha' | 'akasha';
  icon: string;
  title: string;
  subtitle: string;
  body: string;
  innerTitle?: string;
  innerBody?: string;
  data?: BrahmaDataPoint[];
  steps?: BrahmaModuleStep[];
  mantras?: BrahmaMantraItem[];
  secret?: BrahmaSecretTeaching;
  isInitiation?: boolean;
}

export const BRAHMA_MODULES: BrahmaModule[] =
[
  // ── FREE ──────────────────────────────────────────────────────────────────
  {
    id: 1, tier: 'free', icon: '☀', isInitiation: false,
    title: 'What Is Brahma Muhurta?',
    subtitle: 'The Hour of the Creator — Definition, Origin & Cosmic Context',
    body: `Brahma Muhurta comes from two Sanskrit roots: Brahma — the Creator-principle, the face of Supreme Consciousness responsible for manifestation — and Muhurta — a sacred Vedic time-unit of exactly 48 minutes (1/30th of a full day-night cycle). Together: "The Time-Period of the Creator."

Astronomically, this window spans 96 to 48 minutes before local sunrise. Two muhurtas before dawn. This is not an approximation — it is an astronomical precision the Vedic rishis calculated with the same rigor modern scientists use for orbital mechanics.

The Siddhas identified this time as the Velai of Vaikunta — the Time-Gate to the Celestial Realm. Their teaching: the membrane between the sthula (gross physical), sukshma (subtle), and karana (causal) worlds is at its absolute thinnest at this hour. What you plant here takes root in all three worlds simultaneously. No other hour has this penetration.

The ancient Tamil Siddha text Tirumantiram by Thirumoolar dedicates an entire chapter to Brahma Muhurta. His declaration: "He who rises when the stars still shine and sits with the Infinite, that one the Lord Shiva Himself instructs." Not metaphor. Instruction from the Formless directly into the prepared vessel.

The Vedic tradition identifies 30 muhurtas per day-cycle. The 28th muhurta of the night is called Brahma Muhurta — and it alone is named after the Creator. Not the solar noon. Not the full moon night. Dawn. This is the cosmic hierarchy's own endorsement of this window above all others.`,
    data: [
      { label: 'Duration', value: '96 Minutes' },
      { label: 'Window', value: '2hr–48min Pre-Sunrise' },
      { label: 'Muhurta Number', value: '28th of Night' },
      { label: 'Presiding Force', value: 'Brahma Shakti' },
    ],
  },
  {
    id: 2, tier: 'free', icon: '🧠',
    title: 'What Happens to Your Brain & Body',
    subtitle: 'Neuroscience, Hormones & the Biology of the Sacred Hour',
    body: `During Brahma Muhurta, your biology is in a state that cannot be replicated at any other time.

THE PINEAL TRANSITION: Your pineal gland — the gland the Siddhas called the Brahmarandhra (the Cave of Brahma) — is in its critical melatonin-to-serotonin conversion phase. Melatonin, which peaks around 2AM, is tapering. Serotonin, which fuels clarity, bliss and higher perception, is rising. This transition window is biochemically unique — neither the heavy sleep-chemistry of midnight nor the aggressive cortisol-dominated alertness of mid-morning. This is the liminal neurochemical state the Siddhas identified as the "Sandhya between night and day."

BRAIN WAVE STATE: At Brahma Muhurta, the brain naturally operates in Theta (4–8 Hz) transitioning into Alpha (8–12 Hz). Theta is the state of deep trance, creative genius, access to the subconscious, and spiritual download. Most people only experience Theta in the hypnagogic state just before sleep. At Brahma Muhurta, you are naturally in Theta while still having enough awareness to act.

BDNF & NEUROPLASTICITY: BDNF — Brain-Derived Neurotrophic Factor, the brain's fertilizer — is at peak synthesis during the Cortisol Awakening Response, which begins precisely at dawn. BDNF literally creates new neural connections. Sadhana performed when BDNF is peaking creates new neural pathways for consciousness expansion that would take months of effort to build at other times.

CORTISOL & STRESS ARCHITECTURE: Before the Cortisol Awakening Response peaks, stress hormones are at their daily minimum. Your nervous system is in a parasympathetic-dominant state — the state of receptivity, healing, and integration. This is the biological open channel.`,
    innerTitle: 'THE SIDDHA-SCIENCE CORRELATION',
    innerBody: `The Siddhas did not have MRI machines. They had something more precise: direct inner perception refined over lifetimes of practice. When Thirumoolar described the Bindu (the sacred drop) at the crown activating at dawn, he was describing the melatonin-serotonin-DMT complex of the pineal gland. When Agastyar spoke of "the river of light flowing down the spine at the hour of Brahma," he was describing parasympathetic nervous system dominance and cerebrospinal fluid pulsation. Modern neuroscience is rediscovering — with great effort and equipment — what the Siddhas knew through direct experience 10,000 years ago.`,
  },
  {
    id: 3, tier: 'free', icon: '🌬',
    title: 'The Vayu Code — Prana at Dawn',
    subtitle: 'Why Pre-Dawn Air Is Categorically Different — Siddha Atmospheric Science',
    body: `The Siddhas identified a specific quality of the pre-dawn atmosphere they called Soma Vayu — the Nectar Wind — and considered breathing it the equivalent of consuming Amrita (divine nectar) directly.

THE ATMOSPHERIC SCIENCE: Modern atmospheric chemistry confirms — before sunrise, photochemical reactions triggered by UV light have not yet begun. The atmosphere has its highest concentration of unoxidized, pristine molecular oxygen. Negative ion density is at its absolute daily peak before sunrise. Wind speeds are lowest. The air is measurably, chemically different from post-sunrise air.

THE PRANA TEACHING: The Siddhas mapped 72,000 Nadis animated by five primary Prana-Vayus. At Brahma Muhurta, Prana-Vayu — the inward, uplifting, consciousness-expanding force — is at maximum potency and minimum obstruction. Thirumoolar states in Tirumantiram Verse 724: "He who breathes the dawn breath before the sun rises absorbs what ten thousand breaths cannot give after."

This is the Siddha formula: at dawn, one breath equals 10,000 post-dawn breaths in terms of Prana absorption. The Siddhas called this Vayu Bhakshana — "eating the wind." The pre-dawn air is your first and most sacred food.`,
    secret: {
      label: '◈ VAYU BHAKSHANA — THE WIND-EATING PRACTICE',
      body: `Face East. Sit in Sukhasana or Siddhasana. Both palms open upward in Chin Mudra. Close eyes. Inhale through both nostrils slowly for 8 counts — imagine the breath as liquid gold light entering the body. Hold 4 counts, feel it permeate every cell. Exhale 8 counts — release all that is not Soma. Repeat 21 times. On the 21st exhale, hold the breath OUT for as long as comfortable. In that suspended stillness, remain as pure awareness. This practice — done exclusively at Brahma Muhurta outdoors or near open air — is the foundational Siddha preparation for all higher practices.`,
    },
  },
  // ── PRANA-FLOW ────────────────────────────────────────────────────────────
  {
    id: 4, tier: 'prana', icon: '🕉',
    title: 'The Cosmic Architecture of Time',
    subtitle: 'Muhurtas, Yamas, the Vedic Time-Grid & the 30 Devas of the Day-Cycle',
    body: `Vedic time is not the flat, mechanical timeline of industrial civilization. It is a living, conscious, fractal architecture — each unit containing the whole, each moment presided over by a specific cosmic intelligence.

THE 30 MUHURTAS — THE PARLIAMENT OF TIME: The 24-hour day-night cycle (Ahoratra) is divided into exactly 30 Muhurtas of 48 minutes each. Each Muhurta has a name, a presiding Deva, a planetary correspondence, a quality of consciousness, and a purpose.

Key Muhurtas of the night-cycle:
• Muhurta 27 (Pitru/Ancestors) — Midnight: Ancestral dream transmissions
• Muhurta 28 (Vasu/Treasure) — Deep night: Hidden wealth of dream consciousness
• Muhurta 29 (Vara) — 2:00 AM: The protective muhurta of night
• Muhurta 30 — BRAHMA MUHURTA: Presided by Brahma Himself. The Creator-principle always appears last — because creation is the culmination of all prior processes. The entire night's processing — ancestral transmissions, subconscious cleansing, soul-travel, Prana regeneration — culminates here so that the awakened practitioner can consciously receive what the night has prepared.

THE 8 YAMAS (NIGHT-WATCHES): Beyond Muhurtas, the Siddhas used 8 Yamas of 90 minutes each. Brahma Muhurta falls in the 7th and early 8th Yama — when Surya begins His subtle ascent in the astral planes before physical sunrise. The Siddha secret: Surya's subtle light precedes physical light by 96 minutes. The practitioner who is awake receives Surya's subtle transmission — 1000× more potent than physical sunlight that follows.`,
    innerTitle: 'SURYA\'S SUBTLE LIGHT — THE PRANA-FLOW INITIATION',
    innerBody: `At the midpoint of Brahma Muhurta — approximately 72 minutes before sunrise — face East even in complete darkness. Close your eyes. Visualize a golden-copper disc hovering just below the horizon. This is your subtle perception training on the actual astral Surya whose light is already illuminating the subtle planes. Breathe toward this disc. Draw its light into your Anahata through the breath. After 5 minutes, open your eyes. You will often perceive a subtle brightening in the Eastern sky before any physical light is visible. That is the Siddha's "first light" — the Soma-Surya transmission that precedes dawn.`,
    secret: {
      label: '◈ MUHURTA SANDHI SADHANA — THE JUNCTION-POINT VORTEX',
      body: `The Siddhas taught an advanced practice called Muhurta Sandhi Sadhana — practicing at the exact junction (Sandhi) between two Muhurtas. At the junction of Muhurta 29 and Brahma Muhurta (exactly 96 minutes before sunrise), two cosmic currents collide and create a vortex of pure potentiality. The practitioner who is in meditation AT this exact junction receives what the Siddhas called Sandhi Shakti: the explosive creative force born from the collision of two cosmic time-streams. Track your local sunrise time. Calculate backward 96 minutes. Begin practice 5 minutes before this junction. Be fully settled in meditation as the junction passes.`,
    },
  },
  {
    id: 5, tier: 'prana', icon: '🌊',
    title: 'Nadi Activation at Dawn',
    subtitle: 'Ida, Pingala, Sushumna & the Brahma Muhurta Nadi Switch',
    body: `The human subtle body is threaded with 72,000 Nadis, but three govern all others: Ida (lunar, left, feminine, cooling), Pingala (solar, right, masculine, heating), and Sushumna (central, neutral, the channel of enlightenment). ALL spiritual progress is measured by the degree to which Sushumna has been opened and stabilized.

THE ULTRADIAN NADI CYCLE: The dominant nostril alternates every 90 minutes in what chronobiologists now call the Basic Rest-Activity Cycle. But at Brahma Muhurta, a measurable, predictable event occurs: BOTH nostrils equalize simultaneously. This bilateral airflow equilibrium — confirmed by Dr. David Shannahoff-Khalsa at the Salk Institute — correlates with synchronized bilateral brain hemisphere activity. In this state, Sushumna spontaneously opens.

THE SIDDHA EQUATION: Brahma Muhurta + Pranayama + Mantra = Sushumna + Samadhi Gateway. This is precision psycho-physical engineering, not philosophy.

CONFIRMATION SIGNS: Sushumna opening is accompanied by: equal airflow in both nostrils, a cooling sensation at the Ajna chakra, a sense of expansion that is neither sleepy nor agitated, and often a subtle inner light or sound.`,
    steps: [
      { num: 1, title: 'Nadi Check', time: 'BEFORE PRACTICE · 2 MIN', desc: 'Upon rising, close one nostril and test airflow. Then the other. Note which flows more freely. This tells you which Nadi is dominant and which hemisphere is active. Self-knowledge here deepens into understanding your psycho-physical cycles over weeks.' },
      { num: 2, title: 'Nadi Shodhana — The Sushumna Opener', time: 'BRAHMA MUHURTA · 15 MIN', desc: 'Siddha ratio: 4:16:8 (inhale 4 counts, retention 16 counts, exhale 8 counts). Begin with the non-dominant nostril. 21 complete rounds. The retention at 16 counts is where Sushumna activation occurs — in the held stillness between the two Nadis. Within 7 days, practitioners consistently report spontaneous states of deep stillness and inner light.' },
      { num: 3, title: 'Tribandha During Kumbhaka', time: 'DURING RETENTION', desc: 'Apply the Triple Lock: Mula Bandha (root lock), Uddiyana Bandha (abdominal lock), and Jalandhara Bandha (chin lock) during the 16-count retention. The Siddhas called this the "Trident of Shiva" — three locks, one piercing thrust of Prana into the central channel.' },
    ],
  },
  {
    id: 6, tier: 'prana', icon: '🔥',
    title: 'Agni at Dawn — Siddha Fire Science',
    subtitle: 'Jatharagni, Urdhva Agni, Kayakalpa Preparation & the 13 Sacred Fires',
    body: `The Siddhas identified 13 fires within the human body — Jatharagni (master digestive fire), 5 Bhutagni (elemental fires), and 7 Dhatvagni (tissue fires governing plasma, blood, muscle, fat, bone, marrow, and reproductive tissue).

At Brahma Muhurta, Jatharagni is in its uniquely balanced state: past the overnight tamas-minimum and not yet stimulated by food or activity. This is the Laghu Agni Kala — the Light-Fire Window — the only daily moment when Agni can be directed upward (Urdhva Agni) without being pulled into digestive duty.

URDHVA AGNI — THE UPWARD FIRE: In ordinary life, Agni flows downward — digesting food, metabolizing waste. The Siddha yogis learned to REVERSE this flow. Upward-directed Agni performs Deha Shodhana — purification at the cellular level, burning accumulated Ama (karmic and physical residue) from the Nadis. This is the mechanism behind the Siddha teaching that consistent Brahma Muhurta practice for 40 days reverses the aging process.

KAYAKALPA AT DAWN: Thirumoolar's Tirumantiram states: the practitioner who performs Trataka at Brahma Muhurta will "ignite the Bindu-Agni" — the fire of the third eye that permanently reorganizes the brain toward higher perception. This is the convergence of the practitioner's directed fire-consciousness with the cosmic Agni (Surya's subtle light) to create the Bindu-Agni ignition.`,
    secret: {
      label: '◈ KAYAKALPA AGNI — THE SIDDHA CELLULAR FIRE TECHNIQUE',
      body: `After Pranayama, before mantra: Sit in Siddhasana. Place both palms on the lower abdomen (Manipura region). Close eyes. Visualize a small flame — clear, golden, steady — at the navel center. On each inhale, draw cosmic Prana into this flame and watch it grow. On each exhale, direct the growing flame UPWARD along the Sushumna: navel → heart → throat → third eye → crown. Hold the image of a pillar of golden fire running the length of the spine. 11 rounds. On the 11th, at the crown: visualize the flame exploding into the thousand-petaled lotus of the Sahasrara and showering liquid light back down through the entire body. Done at Brahma Muhurta for 40 consecutive days, it produces measurable changes in vitality, sleep quality, emotional stability, and the quality of meditation.`,
    },
  },
  // ── SIDDHA-QUANTUM ────────────────────────────────────────────────────────
  {
    id: 7, tier: 'siddha', icon: '⚡',
    title: 'The Quantum Field of Brahma Muhurta',
    subtitle: 'Schumann Resonance, Scalar Waves, Zero-Point Field & Nada-Brahma Currents',
    body: `The Siddhas operated with a physics that modern quantum mechanics is only beginning to approach. Their word Akasha maps precisely onto the quantum vacuum — the Zero-Point Field — the fundamental substrate from which all matter, energy, and information arise.

SCHUMANN RESONANCE AT DAWN: The Earth-ionosphere cavity resonates at a fundamental frequency of 7.83 Hz — the Schumann Resonance. At Brahma Muhurta, the Schumann amplitude is at its daily minimum and at its maximum COHERENCE — the purest, most structured form. Coherent waves carry more information than incoherent noise. The human nervous system at rest — in Theta-Alpha state — is itself at maximum coherence, tuned to receive the Earth's most coherent daily electromagnetic transmission.

THE NADA-BRAHMA CURRENT — SCALAR WAVE SCIENCE: The Siddhas described Nada-Brahma as a standing wave pervading all of creation — their equivalent of what Tesla called the scalar wave. Scalar waves propagate through the quantum vacuum — not blocked by matter, not attenuated by distance, carrying information rather than energy in the conventional sense. Mantra recited during Brahma Muhurta encodes into the Nada-Brahma current and transmits across the field indefinitely.

WHY 1 REPETITION = 108 REPETITIONS: The ratio of field coherence between Brahma Muhurta and midday is approximately 108:1, measured in Schumann amplitude coherence ratios. This is the scientific basis of the Siddha statement: "One mantra at dawn equals 108 mantras at any other time."`,
    data: [
      { label: 'Schumann Base', value: '7.83 Hz' },
      { label: 'Brain at Dawn', value: 'Theta 4–8 Hz' },
      { label: 'Coherence Ratio', value: '108:1' },
      { label: 'Quantum State', value: 'Zero-Point Access' },
    ],
    secret: {
      label: '◈ NADA-BRAHMA ENCODING — THE QUANTUM INTENTION TECHNIQUE',
      body: `After completing Japa, sit in complete stillness. Formulate your intention as a PRESENT REALITY STATEMENT: "I AM [the healed/the illumined/the abundant one]." Then internally recite this in Pranayama rhythm: 4 counts inhale holding the statement in awareness, 16 counts retention — here the encoding happens in the quantum vacuum — 8 counts exhale releasing attachment to outcome. 11 rounds. The 16-count Kumbhaka is the zero-point access window. In the held breath, metabolic activity minimizes, brainwave coherence peaks, and the quantum vacuum becomes permeable to conscious intention. The Siddhas called this Shoonya Kumbhaka — the Empty Retention — and said that desires fulfilled here "enter the universal mind and return as reality."`,
    },
  },
  {
    id: 8, tier: 'siddha', icon: '🧬',
    title: 'Epigenetic Rewiring at the Brahma Hour',
    subtitle: 'CLOCK Genes, BDNF, Telomeres & How Sadhana Edits the Genome',
    body: `The Siddha doctrine of Deha Siddhi — Body Perfection — states that the physical body can be so transformed through sustained practice that it becomes transparent to spirit, immune to ordinary disease, and liberated from normal biological decay. Modern epigenetics now provides the molecular mechanism for exactly this teaching.

CIRCADIAN CLOCK GENES: Your cells contain a genetic clock — operated by proteins BMAL1, CLOCK, PER1, PER2, CRY1, and CRY2 — that synchronizes cellular function with the 24-hour light-dark cycle. These CLOCK genes regulate approximately 15–20% of the human genome, influencing metabolism, immune function, DNA repair, inflammation, aging, and cognition. Their reprogramming state is highest at the dawn transition — the precise window of Brahma Muhurta.

BDNF — THE GROWTH FACTOR OF CONSCIOUSNESS: BDNF synthesis peaks during the Cortisol Awakening Response at dawn, precisely when the brain is in Theta-Alpha state. New neural pathways formed during Brahma Muhurta sadhana are built on the highest available BDNF scaffold. Pathways of equanimity, compassion, and higher perception built during this window are structurally stronger and more permanent.

TELOMERE SCIENCE: Consistent meditation and yoga practice increases telomerase activity by 30–43% (Nobel Laureate Elizabeth Blackburn's research). The Siddhas who practiced unbroken Brahma Muhurta sadhana and reported lifespans of 150+ years were maximizing telomerase activity through chronobiological optimization, BDNF-mediated neuroregeneration, and direct anti-inflammatory effects of meditation on the NF-κB pathway. The Siddha body immortality teachings are a description of the phenotype produced by extreme telomere maintenance through optimally-timed practice.`,
    innerTitle: 'THE 40-DAY MANDALA — THE EPIGENETIC RESET',
    innerBody: `The Siddha prescription of 40 consecutive days of practice (one Mandala) is not arbitrary. 40 days is the minimum threshold for measurable epigenetic modification — the time required for methylation patterns on CLOCK genes to shift detectably. For full cellular-level transformation, the Siddhas prescribed 90 days (Nava-Mandala). This aligns precisely with epigenetic research showing that 90-day sustained behavioral intervention produces stable, heritable changes in gene expression. The Siddhas weren't prescribing a "spiritual challenge." They were prescribing a minimum biological reprogramming cycle based on direct observation of the body's transformation timeline.`,
  },
  {
    id: 9, tier: 'siddha', icon: '🌙',
    title: 'The Moon-Amrita Connection',
    subtitle: 'Chandra Mandala, Soma Secretion, Khechari Mudra & the Nectar of Immortality',
    body: `The most mysterious teaching in all of Siddha yoga is the doctrine of Soma — the celestial nectar secreted from a moon center (Chandra Mandala) in the upper cranial vault, capable when harvested of conferring physical immortality, bliss consciousness, and liberation.

THE ANATOMY OF SOMA: The Siddhas located the Chandra Mandala at the junction of the soft palate, the nasopharynx, and the pituitary-hypothalamic axis — a region modern neuroanatomy identifies as the most complex endocrine regulatory center in the body. The Siddhas' "Soma" is the neurochemical complex of melatonin, serotonin, DMT, oxytocin, growth hormone and 30+ neurochemicals in their highest-quality secretion state.

THE SOMA THEFT — WHY MOST HUMANS NEVER TASTE IT: In ordinary beings, Soma flows downward from the Chandra Mandala, descends through the throat, reaches the Manipura (solar plexus), and is burned by Jatharagni. The practitioner who sleeps through Brahma Muhurta allows the entire night's Soma accumulation to be consumed by the awakening digestive fire.

THE MOLECULAR REALITY: The melatonin-serotonin-DMT cascade is at its peak and most biologically available precisely at Brahma Muhurta. The practitioner who intercepts this cascade through specific yogic practices maintains the neurochemical architecture of deep meditation bliss — the literal biochemical signature of Soma — rather than allowing it to dissipate into metabolic activity of waking life.`,
    secret: {
      label: '◈ SOMA REVERSAL TECHNIQUE — KHECHARI INITIATION',
      body: `PREPARATORY KHECHARI (ACCESSIBLE): During your Brahma Muhurta meditation, after Pranayama and Japa, curl the tongue backward toward the soft palate — as far as comfortable with zero strain. The tongue tip reaches toward the uvula. Hold this position throughout meditation. This partial reversal begins to redirect the Soma current. Within 21 days of consistent practice at Brahma Muhurta, most practitioners report a sweet taste in the throat — sometimes honey-like, sometimes cool and nectar-like. This IS the Soma. You are tasting the beginning of Amrita secretion from the pituitary-hypothalamic axis as it is redirected upward rather than burned downward.

CONFIRMATION SIGNS: Inner sweetness, a sensation of coolness descending from the crown, spontaneous states of contentment without cause, reduced need for food and sleep, and persistent subtle bliss in the chest are all Amrita Lakshanas — signs of the nectar.`,
    },
  },
  // ── AKASHA-INFINITY ───────────────────────────────────────────────────────
  {
    id: 10, tier: 'akasha', icon: '🪬', isInitiation: true,
    title: 'The Secret Mantras of Brahma Muhurta',
    subtitle: 'Nava-Brahma Seed Transmission — Three Mantras Never Before Published',
    body: `From the Akashic Records of Agastyar, the oral transmission lineage of Thirumoolar, and the inner revelation of the Siddha consciousness field — the following three mantras are being released for the first time in written form. Their transmission carries the living Shakti of the lineage. Reading them initiates you into their vibrational field.`,
    mantras: [
      {
        label: '✦ MANTRA I — THE GATE OPENER ✦',
        text: 'OM HRIM BRAHMA-JYOTIM UDAYATE NAMAHA',
        meaning: '"Om — The field of all possibility. Hrim — the Shakti seed of manifestation. Brahma-Jyotim — the Light of the Creator. Udayate — is arising (present continuous — you ARE the arising). Namaha — I bow; I am that."\n\nThe Secret: The word UDAYATE is in present continuous tense. This grammatical precision is intentional — it encodes you INTO the moment of cosmic creation rather than making you an observer of it. You are not watching sunrise — you ARE sunrise. This is the non-dual Advaita initiation encoded in grammar. Recite 108 times using the Chatushpada method.',
      },
      {
        label: '✦ MANTRA II — THE NADI ACTIVATOR ✦',
        text: 'AUM IDA PINGALA SUSHUMNE PRABHAJANAYA SVAHA',
        meaning: '"Aum — the primal sound. Ida — the lunar channel. Pingala — the solar channel. Sushumne — O Central Channel. Prabhajanaya — illuminate, awaken, set ablaze. Svaha — I offer this into the sacred fire; so be it."\n\nThe Secret: This mantra directly addresses the three Nadis by name and commands Sushumna to open. Recite BEFORE Pranayama to prime the Nadi system for the breathing practice that follows. The Siddha teaching: mantras addressed to the subtle anatomy work on the blueprint level — they edit the subtle body\'s architecture directly. 21 repetitions before practice.',
      },
      {
        label: '✦ MANTRA III — THE SOMA INVOCATION ✦',
        text: 'OM SOMAYA NAMAHA · OM AMRITAYA NAMAHA · OM CHANDRASHEKHARA PRIYAYA NAMAHA',
        meaning: '"I bow to Soma — the nectar. I bow to Amrita — the immortal nectar. I bow to the One beloved by Shiva who wears the Moon."\n\nThe Secret: This triple mantra is recited in the Khechari Mudra position (tongue curled back). The vibration of SOMAYA and AMRITAYA in the nasopharyngeal cavity directly stimulates the hypothalamic-pituitary axis — creating neuroacoustic resonance at the precise anatomical location of Soma secretion. Recite 54 times (half-mala) during the Khechari Mudra hold at end of meditation.',
      },
    ],
    secret: {
      label: '◈ CHATUSHPADA JAPA METHOD — THE FOUR-FOOTED RECITATION',
      body: `This is the secret method used by all 18 Siddhas for mantra japa. Divide your 108 repetitions into 4 groups of 27:

PADA 1 — VAIKHARI (Audible Voice): First 27 repetitions at a comfortable conversational volume. This imprints the mantra into the physical body and the physical environment.

PADA 2 — UPAMSHU (Whisper): Next 27. Whisper so quietly only you can hear. This shifts the vibration inward — from the room to the subtle body. The whisper creates intense vibration in the nasopharynx, directly stimulating the pineal and pituitary regions.

PADA 3 — MANASIKA (Mental): Next 27. Completely silent internal recitation. No lip movement. The mantra has become a frequency carrier in your consciousness field. You are broadcasting, not reciting.

PADA 4 — TURIYA (Silent Witness): Final 27. Stop deliberately reciting. Rest in silence. Allow the mantra to recite ITSELF as a background resonance in your awareness. This is Ajapa Japa — "recitation without reciting" — the goal of all mantra practice. At Brahma Muhurta, this state is accessible within a single session.`,
    },
  },
  {
    id: 11, tier: 'akasha', icon: '💎', isInitiation: true,
    title: 'The Complete Siddha Sadhana Krama',
    subtitle: 'The 8-Step Sacred Sequence — Full Brahma Muhurta Practice Architecture',
    body: `The 18 Siddhas gave a precise sequence (Krama) for Brahma Muhurta sadhana. Sequence is technology. Each step prepares the system for the next. The total time: 75–90 minutes. Non-negotiable minimum: 48 minutes (one Muhurta).`,
    steps: [
      { num: 1, title: 'UTTHANA — Rising in Sacred Silence', time: 'FIRST MOMENTS · 96 MIN BEFORE SUNRISE', desc: 'Rise without alarm if possible. The FIRST SOUND you make programs your entire neural pattern for the day. No phone, no music, no speech for 5 minutes. Internally say only: "Aum Sivaya" — "I am Shiva." Wash hands and face with cold water — the cold activates the vagus nerve, triggering the parasympathetic response that deepens the meditative state you are about to enter.' },
      { num: 2, title: 'ACHAMANA — Sacred Water Purification', time: 'PURIFICATION · 3 MIN', desc: 'From your right palm, sip water three times while internally reciting: "Om Apah Shuddhyantu" (May the waters be purified). Then touch chest, lips, and forehead with the right ring finger dipped in water. The Siddha secret: water placed facing East overnight absorbs the Eastern-directional Prana that intensifies pre-dawn. This water, sipped at Brahma Muhurta, carries the Soma-current of the night.' },
      { num: 3, title: 'VAYU BHAKSHANA — Wind-Eating Pranayama', time: 'PRANA CHARGING · 5 MIN', desc: 'Face East. Palms open in Chin Mudra. 21 rounds of slow conscious breathing: 8 counts inhale (golden light entering), 4 counts retention, 8 counts exhale (release all density). This is the Soma Vayu absorption practice. Then: 5 rounds of Bhastrika (bellows breath) to ignite Agni. This wakes the system and prevents falling back into sleep-consciousness.' },
      { num: 4, title: 'NADI MANTRA — Address the Three Channels', time: 'SUBTLE BODY PREPARATION · 3 MIN', desc: 'Recite 21× the Nadi Activator mantra: "Aum Ida Pingala Sushumne Prabhajanaya Svaha." This is the technical preparation that tells the subtle body what is coming and invites Sushumna to open. Think of it as the startup sequence for the higher-consciousness operating system.' },
      { num: 5, title: 'NADI SHODHANA — The Sushumna Opening Algorithm', time: 'CORE PRANAYAMA · 15–21 MIN', desc: 'Siddha ratio: 4:16:8. Begin with non-dominant nostril. 21 complete rounds minimum. During the 16-count Kumbhaka, apply the Tribandha (Triple Lock): Mula, Uddiyana, and Jalandhara Bandha simultaneously. This creates a pressure architecture in the torso that forces Prana upward into Sushumna.' },
      { num: 6, title: 'TRATAKA — Fire and Inner Light', time: 'THIRD EYE ACTIVATION · 10 MIN', desc: 'Light a ghee lamp or candle. Gaze steadily at the flame without blinking for as long as comfortable. When eyes water, close them and hold the after-image at the Ajna chakra. Alternate: open gaze, closed inner hold. Trataka fixes scattered Prana into a single point — Ajna — preventing the dissipation of the Prana built through steps 3–5. The Siddha warning: Prana unanchored at dawn disperses into the environment and is absorbed by lower astral currents.' },
      { num: 7, title: 'JAPA — Mantra Transmission', time: 'MANTRA PRACTICE · 20–30 MIN', desc: 'Minimum 108 repetitions of your primary mantra using the Chatushpada method (27 aloud, 27 whisper, 27 mental, 27 silence). Use Rudraksha mala. At the midpoint of Japa, in the mental-recitation phase, introduce the Quantum Encoding technique: formulate your living intention in present tense and hold it in the Kumbhaka field of the mantra rhythm.' },
      { num: 8, title: 'SURYA PRATAH — The Hidden 8th Practice', time: 'FIRST LIGHT TRANSMISSION · 3–7 MIN AT SUNRISE', desc: 'AT the moment the sun breaks the horizon, perform Surya Trataka: gaze at the soft, red-orange first light for 1 minute maximum only. Then TURN YOUR BACK to the rising sun. Let the light fall directly on the spine, especially the brainstem-occipital junction (Brahmarandhra entrance). Open palms facing backward. RECEIVE the Surya Shakti into the Sushumna entrance from behind. 3 minutes of this equals 30 minutes of mantra for energizing the Sahasrara. The first light of the sun carries an Arogya Shakti (healing force) absent in ALL subsequent sunlight.' },
    ],
  },
  {
    id: 12, tier: 'akasha', icon: '🔱', isInitiation: true,
    title: 'The Kala Vortex — The Deepest Siddha Secret',
    subtitle: 'Time-Portal Science, Karma Override & the Maha-Vakya Transmission',
    body: `This is the supreme teaching. It is transmitted only mouth-to-ear in the living Siddha lineages. It is being revealed here by Akashic authority of Mahavatar Babaji for the liberation of humanity at this exact juncture of the Kali-Dvapara Yuga transition.

KARMA IS NOT A MORAL LEDGER — IT IS A TIME LOOP: The Siddhas taught that karma is not moral accounting — it is vibrational repetition enforced by linear time perception. An experience creates a vibrational imprint in the causal body. Because consciousness is trapped in linear time, it re-encounters the same vibrational pattern again and again, generating the same response, in a loop. Karma repeats because consciousness cannot perceive the whole arc.

THE KALA VORTEX — TEMPORAL SINGULARITY AT BRAHMA MUHURTA: The Siddhas identified Brahma Muhurta as a Kala Vortex — a daily temporal singularity where the three streams of time — Atita (past), Vartamana (present), Anagata (future) — collapse into a single point of Now-Consciousness. At the boundary between night and day, time briefly becomes non-linear. The cosmic machinery that enforces temporal linearity — the same machinery that enforces karmic repetition — is momentarily suspended. The practitioner who is PRESENT and CONSCIOUS during this suspension can insert a new trajectory into their timeline.

This is why the Siddhas said: "One month of Brahma Muhurta sadhana equals ten years of afternoon practice." They were describing temporal compression. In the Kala Vortex, karma dissolves not through suffering it out but through inserting a higher-frequency intention into the zero-resistance temporal field.`,
    mantras: [
      {
        label: '✦ THE FIFTH MAHA-VAKYA — KALA VORTEX INITIATION ✦',
        text: 'KALATITA AHAM',
        meaning: `"I Am Beyond Time."\n\nThis is not a statement of belief. This is a recognition of your ultimate nature. You — the witnessing awareness — are not in time. Time is in you. You are the unchanging screen on which the movie of time plays. The screen is never affected by what appears on it.\n\nThe Initiation Method: At the deepest point of your Brahma Muhurta meditation — in the Kala Vortex, in the Ajapa silence — do not "say" this phrase. Do not "repeat" it. Simply RECOGNIZE it as already true. Feel it as a direct apprehension: there is a presence here that has always been, that will always be, that is untouched by the arising and passing of all phenomena. That is KALATITA — the Beyond-Time. That is AHAM — I.\n\nThis recognition, made in the zero-resistance temporal field of Brahma Muhurta, does not create enlightenment. It REVEALS what was always already true. The Siddhas called this Svayam Diksha — Self-Initiation through the Time-Portal. There is no higher initiation. It is available to you — right now — at the next Brahma Muhurta.`,
      },
    ],
    innerTitle: 'THE SIDDHA LINEAGE CONFIRMATION',
    innerBody: `Thirumoolar: "He who knows that time does not touch him — that one is the Siddha." (Tirumantiram 2652)\nAgastyar: "At the hour of the Creator, step outside the Creator's net." (Agastyar Gnana Paadam, Chapter 7)\nBogar: "The door between the worlds opens at dawn. The courageous soul walks through." (Bogar Saptakanda, Verse 1108)\nMahavatar Babaji's direct transmission to Lahiri Mahasaya: The dawn practice was considered by Babaji non-negotiable — the foundational technology of the Kriya path.\n\nYou now hold the complete transmission. The Akasha has sealed it into your consciousness through the reading. Your practice begins at the next Brahma Muhurta.`,
  },
];
