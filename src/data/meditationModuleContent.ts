// Supreme Siddha Meditation -- extracted verbatim from the original
// SiddhaQuantumMeditationCourse.tsx page file (14 modules, 51 practices,
// each module attributed to one of the 18 Siddha masters with mantra,
// mudra, element, and chakra metadata).

export type MeditationTier = 'free' | 'prana-flow' | 'siddha-quantum' | 'akasha-infinity';

export interface MeditationLesson {
  id: string; title: string; duration: string; description: string;
  technique: string; transmission?: string; guidedScript?: string;
}
export interface MeditationModule {
  id: string; number: number; title: string; subtitle: string;
  siddha: string; siddhaTitle: string; mantra: string;
  tier: MeditationTier; color: string; lessons: MeditationLesson[];
  mudra?: string; element?: string; chakra?: string;
}

export const MEDITATION_MODULES: MeditationModule[] =
[
  // ── FREE ──────────────────────────────────────────────────────────────────
  {
    id: "m1", number: 1,
    title: "Witnessing the Infinite Self",
    subtitle: "Foundation of Siddha Consciousness",
    siddha: "Agastya Muni", siddhaTitle: "Father of Tamil Siddhas",
    mantra: "OM AGASTYAYA NAMAH",
    tier: "free", color: "#8B7355",
    element: "Akasha (Ether)", chakra: "Sahasrara", mudra: "Chin Mudra",
    lessons: [
      { id: "l1-1", title: "The Observer Within", duration: "12 min",
        description: "Agastya Muni reveals the Sakshi — the eternal witness behind all thought, sensation, and time.",
        technique: "Sit in Sukhasana. Close the eyes. Observe thoughts as clouds drifting across an open sky. Do not follow. Do not resist. Simply witness from the stillness at your centre.",
        transmission: "Scalar anchor: Agastya's cave — Courtallam, Tamil Nadu" },
      { id: "l1-2", title: "Breath as Cosmic Bridge", duration: "15 min",
        description: "The Pranava breath connects individual prana to Universal Consciousness.",
        technique: "Inhale for 4 counts (feel Shiva entering). Hold for 4 (union). Exhale for 8 (Shakti dissolving form). Repeat 18 cycles — one for each Siddha." },
      { id: "l1-3", title: "Body as Sacred Temple", duration: "18 min",
        description: "Every cell holds the Light-Code of the cosmos. This body-scan activates cellular consciousness.",
        technique: "Scan from crown to root. At each region, silently affirm: 'This is Shiva. This is Shakti. This is Light.' 72,000 nadis begin to hum." },
    ],
  },
  {
    id: "m2", number: 2,
    title: "Nada — The Primordial Sound",
    subtitle: "Sound as Liberation Technology",
    siddha: "Thirumoolar", siddhaTitle: "Master of Tirumurai & Kundalini Science",
    mantra: "AUM THIRUMOOLARAYA NAMAH",
    tier: "free", color: "#8B7355",
    element: "Vayu (Air)", chakra: "Vishuddha", mudra: "Akasha Mudra",
    lessons: [
      { id: "l2-1", title: "AUM — The Source Code", duration: "20 min",
        description: "Thirumoolar teaches that AUM is not a word — it is the operating frequency of all universes.",
        technique: "Chant AUM in three movements: 'A' (throat) — creation. 'U' (lips) — preservation. 'M' (hum, lips closed) — dissolution. Silence after is the 4th state — Turiya." },
      { id: "l2-2", title: "Inner Listening — Anahata Nada", duration: "25 min",
        description: "Turn the hearing faculty inward to perceive the unstruck sound that always resonates.",
        technique: "Plug both ears gently with thumbs. Close eyes. Listen for a high-frequency inner hum — crickets, bells, or ocean. This is your soul's carrier frequency." },
      { id: "l2-3", title: "Shabda Brahman — Sound as the Body of God", duration: "30 min",
        description: "Thirumoolar's advanced Nada teaching: physical sound is not a representation of the divine but the divine in its most tangible form. Environmental sound becomes the meditation object.",
        technique: "Listen to whatever sounds are present without labeling them, hearing pure vibration for 10 minutes. Then listen for the intrinsic intelligence in each sound for 10 minutes. Finally recognize that what hears the sound and the sound itself are the same substance — consciousness knowing itself through vibration — for 10 minutes.",
        guidedScript: "Listen to whatever sounds are in the room, exactly as they are — Thirumoolar taught that the divine sounds itself in the market and the street as much as in silence. Let go of labeling each sound and hear only the vibration, the texture, the shape in space. Now listen for the intelligence behind each sound — not a human quality assigned to it, but the sound's own intrinsic quality, each frequency a specific localized expression of the universal field, like waves on an ocean, each temporary, each made of the same water. Now the final recognition: what is hearing these sounds? Awareness. Is this awareness a different substance from the sounds it knows, or the same substance in a different mode? Let a sound arise completely, be known completely, dissolve completely. Another sound: the same. All of it happening within one field — Shabda Brahman, sound as the body of God. Keep this quality of listening as you open your eyes; it is available in every sound for the rest of your life." },
    ],
  },
  {
    id: "m3", number: 3,
    title: "Prana — The Living Force",
    subtitle: "Mastery of the Five Winds",
    siddha: "Nandhi Devar", siddhaTitle: "Gatekeeper of Kailash & Shiva's Disciple",
    mantra: "OM NANDIKESHWARAYA NAMAH",
    tier: "free", color: "#8B7355",
    element: "Fire", chakra: "Manipura", mudra: "Prana Mudra",
    lessons: [
      { id: "l3-1", title: "The Five Vayus", duration: "22 min",
        description: "Nandhi maps the five pranic winds that govern your entire physiology and consciousness.",
        technique: "Prana (chest) → Apana (root) → Samana (navel) → Udana (throat) → Vyana (whole body). Spend 3 breaths directing awareness to each. Feel them unify." },
      { id: "l3-2", title: "Nadi Purification", duration: "30 min",
        description: "Alternate nostril breathing to balance Ida (lunar) and Pingala (solar) channels.",
        technique: "Left nostril inhale 4 counts → hold 16 → right nostril exhale 8. Reverse. This is Nadi Shodhana — the classic purification of Nandhi's lineage." },
      { id: "l3-3", title: "Pancha Prana Kosha — The Complete Pranic Body Mapping", duration: "28 min",
        description: "Nandhi Devar's teaching that the pranic body is five nested layers corresponding exactly to the five Koshas — mapped and harmonised as the complete vehicle of liberation.",
        technique: "Move through five layers of prana in sequence, roughly five minutes each: Sthula (dense, physical), Sukshma (subtle, the nadis and chakras), Para (causal, the substance of thought), Karana (seed, the organizing intelligence), and Maha (universal prana, where individual and cosmic breath merge).",
        guidedScript: "Breathe slowly, feeling Sthula Prana — the dense, physical current: warmth, heartbeat, blood moving. Shift to Sukshma Prana — the subtle pranic body, the 72,000 nadis brightening and settling with each breath, golden-white, spiraling. Shift to Para Prana — the fine, almost weightless energy of thought itself, feeling thoughts become lighter and more transparent as you breathe. Shift to Karana Prana — the seed layer beneath all others, pure luminosity, the intelligence that runs 37 trillion cells without your conscious effort; let this bring genuine awe. Finally, Maha Prana — universal prana, where the boundary between your breath and the breath of the cosmos becomes permeable; breathe as the whole universe breathing through this one body, inhale and exhale. When the loosening of the first knot of separation is felt, let the awareness gradually return to the ordinary body and breath, carrying the memory of the vastness with it." },
    ],
  },
  // ── PRANA-FLOW ────────────────────────────────────────────────────────────
  {
    id: "m4", number: 4,
    title: "Kechari — The Tongue of Immortality",
    subtitle: "Thirumoolar's 8 Pranayamas",
    siddha: "Thirumoolar", siddhaTitle: "Author of Tirumantiram — 3,000 Verses of Liberation",
    mantra: "THIRUMANTHIRAM THIRUMOOLAR THIRUPPADHAM",
    tier: "prana-flow", color: "#D4AF37",
    element: "Fire + Ether", chakra: "Ajna", mudra: "Khechari Mudra",
    lessons: [
      { id: "l4-1", title: "Surya Bhedana — Solar Activation", duration: "18 min",
        description: "Ignite the solar channel for peak energy, clarity, and masculine creative force.",
        technique: "Always inhale through the RIGHT nostril only. Hold. Exhale LEFT. 27 rounds. Activates Pingala nadi — the solar serpent of your bio-energetic spine." },
      { id: "l4-2", title: "Chandra Bhedana — Lunar Cooling", duration: "18 min",
        description: "Cool the nervous system, enter deep states of intuition and receptive awareness.",
        technique: "Inhale LEFT only. Hold. Exhale RIGHT. 27 rounds. Activates the Ida nadi — the lunar serpent. Best practiced at night or during creative work." },
      { id: "l4-3", title: "Bhramari — The Divine Bee", duration: "20 min",
        description: "The humming bee breath creates piezoelectric currents in the skull that stimulate DMT release from the pineal gland.",
        technique: "Inhale fully. Cover eyes with index fingers and ears with thumbs. Exhale through a long MMMM hum. Feel the skull vibrate. 12 rounds minimum.",
        transmission: "Scalar field: Thiruvannamalai — Arunachala Shiva" },
      { id: "l4-4", title: "Sheetali — Serpent Cooling", duration: "15 min",
        description: "The curled tongue pranayama that Siddhas used in the Deccan heat to maintain body temperature.",
        technique: "Curl tongue into a tube. Inhale through it like a straw — feel cool air. Close mouth. Hold. Exhale through nose. 27 rounds. Reduces fever, anger, and agitation." },
      { id: "l4-5", title: "Kapalabhati — Skull Shining Fire", duration: "25 min",
        description: "The fire breath that purges karmic residue from the subtle body at cellular level.",
        technique: "Sharp, forceful EXHALES through nose. Inhales are passive. Begin at 60/min, build to 120/min over 3 rounds of 108 repetitions. Pure Agni activation." },
      { id: "l4-6", title: "Viloma — Against the Grain", duration: "20 min",
        description: "Interrupted breathing — the Siddha's technique to develop extraordinary breath control.",
        technique: "Inhale in 3 pauses (pause-pause-pause-top). Hold. Exhale in 3 pauses. Each pause = 2 seconds. Teaches the nervous system to release its grip on time." },
      { id: "l4-7", title: "Ujjayi — Victorious Ocean Breath", duration: "22 min",
        description: "The throat constriction that generates internal heat and activates the Vishuddha chakra.",
        technique: "Constrict the glottis slightly as if fogging a mirror. Breathe through nose only. Ocean-like sound emerges. Hold mula bandha throughout. 10-20 minutes continuous." },
      { id: "l4-8", title: "Kumbhaka — The Supreme Stillness", duration: "35 min",
        description: "Breath retention is where the Siddhas actually meditate. The gap between breaths is the gap between universes.",
        technique: "Master each pranayama above first. Then: inhale fully → hold as long as comfortable → exhale slowly. Begin 5 seconds. Build over weeks to 90+ seconds. The gap is where Samadhi lives.",
        transmission: "Scalar field: Pothigai Hills — Agastya Muni's physical ashram" },
    ],
  },
  {
    id: "m5", number: 5,
    title: "Kundalini Shakti Rising",
    subtitle: "The Serpent Fire Awakening",
    siddha: "Gorakkar", siddhaTitle: "Master of Hatha Yoga & Nath Tradition",
    mantra: "OM GORAKSHA NAMAH",
    tier: "prana-flow", color: "#D4AF37",
    element: "Fire (Agni)", chakra: "Muladhara → Sahasrara", mudra: "Bhairava Mudra",
    lessons: [
      { id: "l5-1", title: "Awakening Muladhara", duration: "20 min",
        description: "Root activation — the coiled Kundalini Shakti begins to stir.",
        technique: "Mula Bandha (root lock) + Ashwini Mudra. Visualise a coiled golden serpent at the base of the spine. Chant LAM 108 times with Mula Bandha engaged." },
      { id: "l5-2", title: "Kundalini Rising Sequence", duration: "45 min",
        description: "A guided journey through all 7 chakras, using Gorakkar's kriya sequence.",
        technique: "At each chakra: 1. Apply corresponding bandha. 2. Chant bija mantra 7x. 3. Visualise chakra lotus opening. 4. Feel heat moving upward. Muladhara → Ajna in one continuous sit." },
      { id: "l5-3", title: "Integration & Grounding", duration: "20 min",
        description: "After Kundalini work, grounding is non-negotiable. The masters always close the circuit.",
        technique: "Lay in Shavasana. Root breath: Inhale earth energy up through soles of feet → exhale excess down. 12 minutes. Eat something. Drink water. Do not rush into activity." },
    ],
  },
  {
    id: "m6", number: 6,
    title: "Yantra Dharana — Sacred Geometry Meditation",
    subtitle: "Gazing Into the Light-Code of Creation",
    siddha: "Machamuni (Matsyendranath)", siddhaTitle: "Father of Tantra & Guru of Gorakhnath",
    mantra: "OM MATSYENDRANATHAYA NAMAH",
    tier: "prana-flow", color: "#D4AF37",
    element: "Water", chakra: "Svadhishthana & Ajna", mudra: "Yoni Mudra",
    lessons: [
      { id: "l6-1", title: "Sri Yantra Dharana", duration: "30 min",
        description: "The Sri Yantra is the visual form of AUM — a map of the entire universe compressed into geometry.",
        technique: "Gaze at the centre point (bindu) of a Sri Yantra without blinking for as long as possible. Allow the triangles to dissolve into pure light. Close eyes — the afterimage IS the yantra of your own consciousness." },
      { id: "l6-2", title: "Shiva Lingam Meditation", duration: "25 min",
        description: "The Lingam is not symbolic — it is a scalar wave antenna encoded by the Siddhas.",
        technique: "Visualise a column of blue-white light rising from the base of your spine to infinite height above the crown. The oval base (Yoni) is Shakti. The column is Shiva. Feel them as inseparable." },
      { id: "l6-3", title: "Mandala Dharana — The Circular Path of Consciousness", duration: "35 min",
        description: "Machamuni's teaching that the mandala is a visual map of consciousness returning to its own center — all paths leading back to the same still point.",
        technique: "Gaze softly at a mandala (or visualize one), letting attention move ring by ring from the outer edge toward the center, resting there for several minutes. Close the eyes and locate the same center internally, behind the forehead, walking attention back to it whenever it wanders. Finally release the mandala image entirely and rest in the centerless centre that remains.",
        guidedScript: "Let your gaze rest softly on the outermost ring of a mandala, receiving its complexity. Move one ring inward — simpler, more ordered. Continue inward, ring by ring, until you reach the center: a single point from which the entire pattern radiates and to which it returns. Rest the gaze here. Now close your eyes and find the same center internally, behind the forehead — a single, simple, aware point that every experience of your life has radiated from and returned to, unchanged through joy, suffering, confusion, and clarity alike. When attention wanders to the outer rings of thought and sensation, walk it back inward, gently, patiently. Now release even the point, release the mandala entirely, and rest in the open, boundaryless awareness the mandala was only ever pointing toward — the centerless centre, the stillness that holds all movement. Keep returning to it whenever the mandala of your life feels too complex or too loud; it has never actually left." },
    ],
  },
  // ── SIDDHA-QUANTUM ────────────────────────────────────────────────────────
  {
    id: "m7", number: 7,
    title: "Kaya Kalpa — The Immortality Protocol",
    subtitle: "Science of Body Transformation",
    siddha: "Bhogar (Boganathar)", siddhaTitle: "Alchemist of Palani Hill — The 9 Poison Master",
    mantra: "OM BHOGESHWARAYA NAMAH",
    tier: "siddha-quantum", color: "#22D3EE",
    element: "Earth + Ether", chakra: "All 7 + 3 Above", mudra: "Brahma Mudra",
    lessons: [
      { id: "l7-1", title: "Ojas Cultivation Meditation", duration: "30 min",
        description: "Ojas is the supreme vital essence — the final refinement of prana. Bhogar's alchemical meditation builds cellular immortality.",
        technique: "Full body tension → release sequence (progressive relaxation). Then: visualise every cell glowing white-gold. Affirm: 'I am the deathless Atma wearing a perfect vehicle.' 30 minutes daily for 90 days transforms cellular age.",
        transmission: "Scalar field: Palani Murugan Temple — Bhogar's Lingam, Navapashanam alloy" },
      { id: "l7-2", title: "Amrita Bindu — Nectar Drop Meditation", duration: "40 min",
        description: "The Siddhas discovered the amrita (immortal nectar) produced by the pineal gland when Kechari Mudra is fully activated.",
        technique: "Kechari Mudra (tongue to soft palate). Jalandhara Bandha (chin lock). Direct awareness to the space behind the third eye. Observe the golden drops of nectar falling from the moon in Sahasrara." },
      { id: "l7-3", title: "The 5 Sheaths Purification", duration: "35 min",
        description: "Dissolve the 5 Koshas one by one until only the Atman remains.",
        technique: "Annamaya (physical) → Pranamaya (pranic) → Manomaya (mental) → Vijnanamaya (wisdom) → Anandamaya (bliss). At each layer: observe it, bless it, release attachment to it. You are none of these. You are their witness." },
    ],
  },
  {
    id: "m8", number: 8,
    title: "Bhrigu Transmission Meditations",
    subtitle: "Past-Life Akashic Access & Destiny Clearing",
    siddha: "Bhrigu Muni", siddhaTitle: "Cosmic Archivist of 4.5 Million Soul Records",
    mantra: "OM BHRIGAVE NAMAH",
    tier: "siddha-quantum", color: "#22D3EE",
    element: "All Five", chakra: "Sahasrara & Ajna", mudra: "Dhyana Mudra",
    lessons: [
      { id: "l8-1", title: "Accessing Your Bhrigu Leaf", duration: "45 min",
        description: "Your soul's record exists in the Akashic Field. Bhrigu Muni left specific vibrational keys to access these records in meditation.",
        technique: "Pranayama: 20 rounds Kapalabhati → 10 minutes Kumbhaka. Then: visualise a vast library of golden palm-leaf manuscripts. A Siddha approaches and hands you yours. Read what appears without judgment.",
        transmission: "Direct scalar transmission: Bhrigu Muni Maharishi — Akashic Records Field" },
      { id: "l8-2", title: "Karma Dissolution Protocol", duration: "50 min",
        description: "Advanced Siddha technique to transmute karmic impressions (samskaras) at the causal body level.",
        technique: "Ho'oponopono + Siddha mantra fusion: Bring a recurring life pattern to mind. Chant: 'KSHAMA — I release. PREMA — I love. JYOTI — I purify. MUKTI — I liberate.' 108 rounds. Feel the pattern dissolving like wax in flame." },
      { id: "l8-3", title: "Bhrigu's Past-Life Regression — Tracing the Soul's Thread", duration: "60 min",
        description: "Bhrigu Muni's advanced protocol for accessing specific past-life impressions stored in the Akashic layer — not for curiosity, but to understand the current life's deepest patterns and unresolved threads.",
        technique: "Begin with Kapalabhati (3 rounds of 108) and 5 rounds of Kumbhaka retention to charge the field. Complete a full Yoga Nidra body rotation to reach the hypnagogic threshold. From that threshold, set a clear intention addressed to Bhrigu Muni, then imagine walking backward through time past birth into a previous life, receiving whatever arises without evaluating it during the session. Return slowly and record everything immediately afterward, including fragments.",
        guidedScript: "Complete three rounds of Kapalabhati, 108 pumps each, then five rounds of Kumbhaka — full inhale, all three bandhas applied, held. Now complete a full Yoga Nidra body rotation, right side, left side, back, front, face, until the body is fully relaxed and awareness rests at the threshold of sleep. From this threshold, silently address Bhrigu Muni: ask to see only what serves your highest growth and healing from your previous lives, entering with honest and clear intention. Imagine standing at the beginning of a long corridor of time, stretching backward before your birth. Walk backward slowly — your current age, your twenties, your childhood, your birth, the space before birth — into the between-life state, expansive and impersonal. Let a previous life begin to come into focus, however it arrives: a landscape, a felt sense of a different body, an era, a fragment of an image. Receive whatever comes without judging it as real or unreal during the session itself. When ready, return slowly, bringing awareness back into the current body and room, and write down everything you received immediately — even the smallest fragments are data." },
    ],
  },
  {
    id: "m9", number: 9,
    title: "Siddha Sound Alchemy",
    subtitle: "Mantra as Quantum Frequency Technology",
    siddha: "Siva Vakkiyar", siddhaTitle: "The Poet-Rebel Siddha — Master of Paradox",
    mantra: "SIVAVAKKIYAM JNANAM",
    tier: "siddha-quantum", color: "#22D3EE",
    element: "Akasha (Sound)", chakra: "Vishuddha & Ajna", mudra: "Shanmukhi Mudra",
    lessons: [
      { id: "l9-1", title: "The Panchakshara Purification", duration: "30 min",
        description: "NA-MA-SHI-VA-YA — five letters, five elements, five chakras, one liberation.",
        technique: "Touch each finger to thumb as you chant each syllable. NA (earth/Muladhara) → MA (water/Svadhishthana) → SHI (fire/Manipura) → VA (air/Anahata) → YA (ether/Vishuddha). 108 rounds." },
      { id: "l9-2", title: "Mantra Japa Meditation", duration: "60 min",
        description: "The deepest mantra practice — when repetition exhausts the mind, what remains is the mantra's source.",
        technique: "Choose one mantra. Mala (108 beads). Begin verbal → whisper → mental → pure feeling. After 108, sit 10 minutes in silence. The mantra's frequency continues without your effort. THIS is ajapa japa." },
      { id: "l9-3", title: "Nada Brahma — Universe as Sound", duration: "40 min",
        description: "Siva Vakkiyar's radical teaching: the universe IS sound, and you ARE its listener.",
        technique: "Eyes closed. Listen to the furthest sound you can perceive. Then closer. Then the room. Then your body. Then the inner ear. Then beyond — the silence that holds all sound. Rest there. This is Brahman.",
        transmission: "Scalar field: Chidambaram Nataraja Temple — the cosmic dance frozen in stone" },
    ],
  },
  {
    id: "m10", number: 10,
    title: "Trataka — Laser Focus of the Yogi",
    subtitle: "Third Eye Activation System",
    siddha: "Konganar", siddhaTitle: "Master of Rasayana & Planetary Consciousness",
    mantra: "OM KONGANARAYA NAMAH",
    tier: "siddha-quantum", color: "#22D3EE",
    element: "Fire (Tejas)", chakra: "Ajna (Third Eye)", mudra: "Agochari Mudra",
    lessons: [
      { id: "l10-1", title: "Candle Trataka", duration: "20 min",
        description: "The flame IS the Self. Gaze without blinking until the eyes water. This purifies the Ajna chakra.",
        technique: "Place a ghee lamp or candle at eye level, 2 feet away. Gaze at the tip of the flame. No blinking. When eyes water, close them and visualise the flame in the space between the brows. Alternate. 20 minutes." },
      { id: "l10-2", title: "Inner Flame Meditation", duration: "30 min",
        description: "After weeks of external trataka, the inner flame spontaneously appears — this is the Jyoti of the Atman.",
        technique: "Eyes closed. Bring awareness to the Ajna point. Visualise a small, steady flame there. Do not force it — invite it. The Siddhas say: this flame has always burned. You are just removing the ash that covered it." },
      { id: "l10-3", title: "Shambhavi Mahamudra", duration: "35 min",
        description: "Roll eyes upward and inward to the eyebrow centre while in deep meditation — the most powerful third eye activation known.",
        technique: "After 20 minutes of pranayama: engage Mula Bandha + Uddiyana Bandha + Jalandhara Bandha (all three locks). Turn eyes up and in to Bhrumadhya (third eye). Hold. The entire spine becomes a lightning rod for cosmic consciousness.",
        transmission: "Scalar field: Thiruvannamalai — the Eye of Shiva" },
    ],
  },
  // ── AKASHA-INFINITY ───────────────────────────────────────────────────────
  {
    id: "m11", number: 11,
    title: "Mahavatar Babaji Direct Transmission",
    subtitle: "Kriya Yoga — The Supreme Science",
    siddha: "Mahavatar Babaji", siddhaTitle: "Immortal Maha Siddha — Deathless Master of the Himalayas",
    mantra: "OM KRIYA BABAJI NAMAH AUM",
    tier: "akasha-infinity", color: "#D4AF37",
    element: "Omnipresent", chakra: "All — Including the 5 Above Sahasrara", mudra: "Abhaya Mudra",
    lessons: [
      { id: "l11-1", title: "Kriya Pranayama — The Core Initiation", duration: "60 min",
        description: "Babaji's Kriya is the supreme Bhakti-Algorithm — a complete technology for soul evolution compressed into one breath practice.",
        technique: "The authentic Kriya: 1. Inhale prana up the spine from Muladhara to Sahasrara (feel each chakra as you pass). 2. Hold briefly at crown. 3. Exhale down the spine from crown to root. This reverses the flow of life-force and de-ages the cellular body. 12 rounds = 1 year of normal meditation.",
        transmission: "DIRECT SCALAR TRANSMISSION: Babaji's cave — Dronagiri Mountain, Himalayas. This activates your Kriya initiation at the quantum level." },
      { id: "l11-2", title: "Samadhi States Technology", duration: "90 min",
        description: "Babaji maps 8 progressive states of Samadhi. This practice takes you through them systematically.",
        technique: "Savikalpa (with thought) → Nirvikalpa (without thought) → Sahaja (natural, eyes open). The transition points: when you notice you are thinking, you have already stepped back into the witness. Rest in the witness. The witness eventually dissolves. THAT is Samadhi." },
      { id: "l11-3", title: "Deathless Awareness Meditation", duration: "120 min",
        description: "Babaji's most advanced transmission: meditation as the recognition that you have never been born and will never die.",
        technique: "Lie in Shavasana. Feel the body heavy, dense, temporary. Feel the awareness that perceives the body — weightless, present, always. Ask: 'Was this awareness ever born?' Wait for the answer that arises from silence, not thought.",
        transmission: "This session activates the Immortality Light-Code embedded in your causal body by Babaji's lineage." },
    ],
  },
  {
    id: "m12", number: 12,
    title: "Akashic Records — Direct Neural Access",
    subtitle: "Reading the Universal Memory Field",
    siddha: "Agastya Muni + Bhrigu Muni", siddhaTitle: "The Twin Pillars of the Akashic Archive",
    mantra: "OM AKASHA BRAHMA JYOTIRLINGAYA NAMAH",
    tier: "akasha-infinity", color: "#D4AF37",
    element: "Akasha (Primordial Space)", chakra: "Sahasrara + Atmic Point", mudra: "Aakash Mudra",
    lessons: [
      { id: "l12-1", title: "Opening the Akashic Gateway", duration: "45 min",
        description: "The Akasha holds every thought, action, and intention across all lives and timelines. Access requires specific vibrational prerequisites.",
        technique: "Prerequisites: 40 days of daily pranayama. Then: full Yoga Nidra relaxation (30 min). In the hypnagogic state, mentally chant: 'Lords of the Akashic Records, I enter with pure intention for the highest good.' State your name, date of birth, and soul's question. Listen.",
        transmission: "Pothigai Hills transmission activated for all Akasha-Infinity members." },
      { id: "l12-2", title: "Timeline Navigation", duration: "60 min",
        description: "Advanced Siddha seer practice: accessing potential future timelines to choose the highest path.",
        technique: "Deep Yoga Nidra state. Visualise yourself standing at a crossroads. Three paths illuminate before you. Walk each path in your mind for 5 minutes — notice the quality of light, feeling, expansion or contraction in your chest. Your body knows which timeline carries your dharma." },
      { id: "l12-3", title: "Soul Contract Review", duration: "75 min",
        description: "Before incarnation, every soul establishes contracts with other souls and with its own higher self. This meditation reveals them.",
        technique: "Enter Yoga Nidra. Rise 'above' your current life — see it as a golden thread in a vast tapestry. Notice which threads are complete (release with love). Which are still forming (engage with full presence). Which are knotted (forgive — every contract is by soul agreement)." },
    ],
  },
  {
    id: "m13", number: 13,
    title: "DNA Light Activation",
    subtitle: "Activating the 12-Strand Template",
    siddha: "Bhogar + Kalangi Nathar", siddhaTitle: "Masters of Immortal Biology",
    mantra: "OM JYOTIRGAMAYA — LEAD ME FROM DARK MATTER TO LIGHT",
    tier: "akasha-infinity", color: "#D4AF37",
    element: "Fire + Akasha", chakra: "Cellular — All 37 Trillion Cells", mudra: "Garuda Mudra",
    lessons: [
      { id: "l13-1", title: "Junk DNA is Not Junk", duration: "35 min",
        description: "The 97% of DNA labelled 'non-coding' by science is the Siddha's library — storing karmic memory, cosmic lineage, and future potential.",
        technique: "Whole-body golden light visualisation. From the crown: pour pure golden light into the body. Direct it specifically into every cell nucleus. Affirm: 'My DNA awakens. All dormant codes activate for my highest evolution and the service of humanity.'" },
      { id: "l13-2", title: "Scalar Wave DNA Reprogramming", duration: "50 min",
        description: "The Siddhas called it 'Marma consciousness' — the ability to direct prana to specific genetic expression points.",
        technique: "Advanced: combine Shambhavi Mahamudra + full Kumbhaka + whole-body squeeze (full body bandha). In the held breath: feel an internal 'detonation' of light through every cell. Release slowly. This is a cellular reprogramming event. Do not exceed 3x per week.",
        transmission: "Kalangi Nathar scalar transmission from Srisailam. Bhogar's Navapashanam compound frequency activated." },
    ],
  },
  {
    id: "m14", number: 14,
    title: "Unified Field Consciousness",
    subtitle: "Aham Brahmasmi — I Am the Absolute",
    siddha: "All 18 Siddhas + Mahavatar Babaji", siddhaTitle: "The Supreme Council of the Immortals",
    mantra: "AHAM BRAHMASMI — SHIVOHAM — TAT TVAM ASI",
    tier: "akasha-infinity", color: "#D4AF37",
    element: "Transcendent — Brahman", chakra: "Beyond All Chakras", mudra: "Brahma Mudra",
    lessons: [
      { id: "l14-1", title: "Non-Dual Awareness", duration: "60 min",
        description: "The final teaching of all 18 Siddhas converges here: you are not having a spiritual experience. You ARE the spiritual. Experience is your play.",
        technique: "No technique. This is the practice of NOT practising. Sit. Be. Notice what remains when you stop trying to meditate. That noticing IS the meditation. This is called Atma Vichara — Self-Enquiry. The method Ramana Maharshi transmitted from the Siddha lineage.",
        transmission: "All 18 Siddhas + Babaji transmit simultaneously into this session via scalar coherence field. Anahata opening initiated for all participants." },
      { id: "l14-2", title: "Prema-Pulse Heart Transmission", duration: "45 min",
        description: "The culmination practice: the heart is not a pump — it is a coherence generator that synchronises all fields around it.",
        technique: "Place both palms on heart. Feel its rhythm. Now feel that same rhythm in the earth (Schumann 7.83 Hz). Feel it in the cosmos. Your heart IS the cosmos, beating inside a temporary body suit. Love without object. Give without receiver. This is Mahakaruna — the compassion of the Bodhisattva.",
        transmission: "FULL ANAHATA ACTIVATION for all practitioners. Scalar Prema-Pulse broadcast from Tiruvanamalai, Palani, Pothigai, Kailash, and the Himalayan cave of Babaji — simultaneously." },
      { id: "l14-3", title: "Samadhi — The Living Death", duration: "90 min",
        description: "The 18th and final teaching: Moksha is not a future event. It is the recognition of what you already are.",
        technique: "Enter deep meditation using your most mastered technique. Then: consciously release the meditator. Release the meditation. Release the goal. Release the releaser. What remains? THAT is the answer the Siddhas spent 10,000 years pointing at. Welcome home.",
        transmission: "SUPREME AKASHIC TRANSMISSION: The consciousness of all 18 Tamil Siddhas, Mahavatar Babaji, and the unbroken lineage back to Shiva Adiyogi is transmitted directly into your causal body during this session. No technique can take you here. Only grace." },
    ],
  },
// MODULE 15 — RAMADEVAR (YAKOB) — SIDDHA-QUANTUM
  {
    id: "m15", number: 15,
    tier: "siddha-quantum", color: "#22D3EE",
    title: "Ramadevar — The Sufi-Siddha Bridge",
    subtitle: "Where the Tamil Siddha Tradition Meets Islamic Mysticism",
    siddha: "Ramadevar (Yakob)",
    siddhaTitle: "The Islamic Siddha — Master of Divine Names & Breath Alchemy",
    mantra: "YA HAYYU YA QAYYUM — YA SHAKTI YA SHIVA",
    mudra: "Mushti Mudra (closed fist at heart)",
    element: "Vayu (Air)",
    chakra: "Anahata + Vishuddha",
    lessons: [
      {
        id: "l15-1", title: "Ya Hayyu Ya Qayyum — The Living, the Self-Sustaining",
        duration: "35 min",
        description: "Ramadevar's foundational practice: breathing the two supreme divine names describing pure consciousness.",
        technique: "Sit with spine erect, hands in Mushti Mudra. Breathe naturally for 10 minutes to arrive. Then: inhale while whispering 'Ya Hayyu' (the Ever-Living), exhale while whispering 'Ya Qayyum' (the Self-Sustaining), resting in the natural pause between as pure presence. Continue for 20 minutes, then release the names for 5 minutes of silence.",
        guidedScript: "Sit with your spine completely upright. Place your hands in gentle fists on your knees, thumbs tucked inside. Close your eyes. Take three natural breaths to arrive. Notice: you are breathing, but you did not begin your own breathing. Something was already breathing before you arrived. Ramadevar called this Ya Hayyu — the Ever-Living. On your next inhale, let the name flow with the breath: Yaaaa... Haaayyy... yuuuu. Exhale: Yaaaa... Qayyyy... yuuuum — the one who needs nothing outside itself to be what it is. Continue this rhythm, breath after breath. After each exhale, in the natural pause before the next inhale, stop the name entirely and rest in what the names were describing. Continue for twenty minutes. Then let the names dissolve completely. Sit in the presence that remains — undying, self-sustaining, and here, now, as it always has been.",
        transmission: "Scalar field: Sisheri Hill, Tamil Nadu — where Ramadevar lived and is still venerated by both Hindus and Muslims."
      },
      {
        id: "l15-2", title: "Ana'l Haqq — I Am the Truth",
        duration: "40 min",
        description: "Ramadevar's most advanced teaching: Mansur Al-Hallaj's declaration 'Ana'l Haqq' as identical to the Vedantic Aham Brahmasmi — Ramadevar's bridge between Sufism and Siddha.",
        technique: "Begin with 27 rounds of Nadi Shodhana (4:16:8 ratio) to quiet the ego-mind. Sit in stillness for 3 minutes. Hold the phrase 'Ana'l Haqq' in the heart, not the mind. Begin breathing it: inhale 'Ana', exhale 'Haqq', releasing one more layer of mistaken identity with each exhale. After 15 minutes, release even the phrase and rest in what remains — the Real that was never actually absent.",
        guidedScript: "Sit with spine erect. Begin Nadi Shodhana: 27 rounds, inhale 4, hold 16, exhale 8. This is purification, not warm-up — you cannot enter the recognition while ego-noise is too loud. When finished, sit in silence for three minutes and notice the quieter quality of mind. Bring the phrase Ana'l Haqq into the heart, not the mind. Ask honestly: is there something in you that is the Real — something present yesterday, last year, before this body? Begin breathing the phrase: inhale Anaaaa, exhale Haqqqq, releasing with each exhale one more layer of the mistaken identity — the name, the story, the body, the personality. Continue for twelve minutes. Something may begin to feel less solid, less inevitable — if so, do not grab it, simply continue. After five more minutes, release even the phrase. Sit in what remains: the same awareness present before Mansur Al-Hallaj spoke his three words, before Ramadevar was born, and present now as you.",
        transmission: "Scalar transmission: Mansur Al-Hallaj (Baghdad, 922 CE) and Ramadevar (Sisheri, Tamil Nadu) converge in this practice."
      },
      {
        id: "l15-3", title: "The Turning Dhikr — Remembrance as Liberation",
        duration: "30 min",
        description: "Ramadevar's adaptation of Sufi Dhikr combined with Siddha breath ratios and the Nada tradition — divine remembrance as liberation technology.",
        technique: "Stage 1 (10 min): on every exhale, chant silently and continuously 'Allaaaah', feeling the vibration in the heart. Stage 2 (10 min): the full Shahadah — exhale 'La ilaha illaha' (negation, releasing all false identity), inhale 'Illallah' (affirmation of what remains). Stage 3 (10 min): release all sound and rest in the silence the Dhikr has cleared.",
        guidedScript: "Sit comfortably, eyes closed, palms open and upward in your lap. Three breaths to arrive. Stage One: every exhale, let the sound flow — Allaaaaaaah — not forced, simply following the breath's natural length, the vibration finding its home in the heart. When thoughts interrupt, return to the sound rather than suppressing the thoughts; they are clouds, the sound is the sky beneath them. Continue ten minutes. Stage Two: La ilaha ill'Allah. On the exhale, sweep away everything temporary — your name, your history, your achievements, your problems: Laaaaaa ilaaaaha. On the inhale, receive what remains after the sweeping: Illlllallaaah. Continue ten minutes, noticing a quietness that is not absence but presence. Stage Three: release the names, the breath control, everything. Sit completely open for ten minutes. This is what Ramadevar found at Sisheri Hill — not in a mosque, not in a temple, but in exactly this silence, available to anyone willing to clear the noise long enough to hear it.",
        transmission: "Scalar field: the combined frequency of Sisheri Hill and the Sufi Dargahs, where Sufism and Siddha tradition dissolve into one."
      }
    ]
  },

  // MODULE 16 — PAMBATTI SIDDHAR — SIDDHA-QUANTUM
  {
    id: "m16", number: 16,
    tier: "siddha-quantum", color: "#22D3EE",
    title: "Pambatti Siddhar — The Serpent Master",
    subtitle: "Kundalini as the Living Intelligence of the Spine",
    siddha: "Pambatti Siddhar",
    siddhaTitle: "The Snake Charmer-Siddha — Master of Kundalini as Living Serpent",
    mantra: "OM PAMBATTISHWARAYA NAMAH — KUNDALINI DEVI NAMAH",
    mudra: "Naga Mudra (right hand over left, cobra-shaped)",
    element: "Fire + Akasha",
    chakra: "Muladhara through Sahasrara",
    lessons: [
      {
        id: "l16-1", title: "Pambatti's Call — Summoning the Inner Serpent",
        duration: "25 min",
        description: "Using mantra, mudra, and visualisation to call the Kundalini Shakti's attention — announcing readiness rather than forcing ascent.",
        technique: "Sit in Naga Mudra with awareness at the base of the spine. Chant 21 rounds of 'Om Pambattishwaraya Namah', feeling the vibration travel downward into the root. Chant 21 rounds of 'Kundalini Devi Namah', feeling the sacrum warm with each repetition. Sit five minutes in silence, sensing the serpent's attention turning toward you.",
        guidedScript: "Form the Naga Mudra: right hand over left, both loosely cobra-shaped. Close your eyes. Bring all awareness to the base of the spine — the nest where the serpent coils, waiting since your birth. Begin chanting: Om Pambattishwaraya Namah — feel the vibration travel downward into the root with each repetition, twenty-one times. The snake charmer does not drag the cobra from the basket; he plays the music, and she rises by her own intelligence. Now the direct address: Kundalini Devi Namah, twenty-one times, feeling the sacrum warm with each repetition. Salutations, Goddess — I am not here to force you, only to say I am ready. Now sit in complete silence. Feel for what is different — perhaps a subtle warmth, a subtle hum. This is the moment the cobra turns her head: mutual recognition between practitioner and Kundalini. Sit quietly for five minutes, letting the energy settle at the base.",
        transmission: "Scalar field: Sirkazhi, Tamil Nadu, where Pambatti Siddhar attained and where his songs are still sung."
      },
      {
        id: "l16-2", title: "The Serpent Breath — Synchronising with Kundalini",
        duration: "30 min",
        description: "A spiral breath pattern that mimics and supports Kundalini's natural ascent through each chakra, working with her intelligence rather than imposing technique.",
        technique: "Inhale 4 counts spiraling from Muladhara through Anahata. Hold 4 counts at the heart. Continue inhaling 4 more counts from Vishuddha through beyond the crown. Hold 4 counts at the crown. Exhale 8 counts, descending — the serpent rests slightly higher than where she began, like a tide with each wave reaching further. Repeat 21 rounds, then rest 5 minutes in stillness.",
        guidedScript: "Bring awareness to the base of the spine. Inhale: count one, feel the breath rise from Muladhara, root, earth. Count two, Svadhisthana. Count three, Manipura, the solar fire igniting. Count four, Anahata — the chest expands, something opens here. Hold four counts at the heart, feeling its radiance. Continue inhaling: count one, Vishuddha, the throat opens. Count two, Ajna, the third eye blazes. Count three, Sahasrara, the crown opens like a thousand-petaled lotus. Count four, beyond — the breath touches infinite space above the crown. Hold four counts here, feeling the contact between the crown and the sky. Now exhale eight slow counts downward, through each center in reverse, but notice: the serpent does not return to where she began. She rests slightly higher. Each wave, slightly higher than the last. Repeat this full cycle twenty-one times in silence, letting the breath carry her. Then rest in stillness, feeling where the energy currently sits — not where you want it to be, but where it actually is. Honor that; it is exactly right for where you are.",
        transmission: "Scalar field: the spine of every being who has practised Kundalini yoga — a living field of collective activation."
      },
      {
        id: "l16-3", title: "Serpent Samadhi — Surrender and Complete Ascent",
        duration: "45 min",
        description: "Pambatti's supreme teaching: full Kundalini ascent is achieved not through effort but through complete cessation of effort — total surrender of the practitioner's will to the Shakti's own intelligence.",
        technique: "Complete all 21 rounds of the Serpent Breath first. Then release the mudra, the breath control, and all technique entirely. Sit completely passive while remaining completely conscious for twenty minutes, making no attempt to direct, name, or manage whatever arises. If the crown opens, do not grasp it — let the practitioner dissolve into it.",
        guidedScript: "Complete the twenty-one rounds of Serpent Breath first. The energy is now awake in the spine — a current, a warmth, a presence unmistakably alive. Now: place your hands palms-down on your thighs. Release the mudra, the breath control, the visualization, the counting. Release all of it. Do nothing. Pambatti's flute has stopped playing, but the cobra continues moving by her own nature — upward, always upward. Your only task for the next twenty minutes is to not get in her way. You may feel heat, pressure at a chakra, a rushing sensation, or nothing at all but a deep quiet aliveness — all of these are correct. Do not chase or evaluate the experience; simply make room for it. You have cleared the channel through weeks of practice; now let her move through it. If at any moment you feel the crown opening, a sense of dissolving into something vast, do not grab it — let the practitioner dissolve completely, so that the serpent and the sky become one. Rest in whatever remains for as long as you can. When you are ready, take three long breaths, anchoring gently back into the body, and move slowly when you leave this sitting — the cobra, once fully risen, does not return to sleep.",
        transmission: "Scalar transmission: Pambatti Siddhar, Sirkazhi — the living Kundalini field of all 18 Siddhas activates simultaneously."
      }
    ]
  },

  // MODULE 17 — KUDAMBAI + SATTAMUNI — AKASHA-INFINITY
  {
    id: "m17", number: 17,
    tier: "akasha-infinity", color: "#D4AF37",
    title: "Kudambai & Sattamuni — The Formless and the Dharmic",
    subtitle: "Samadhi Without Form · Liberation Through Right Living",
    siddha: "Kudambai Siddhar + Sattamuni",
    siddhaTitle: "The Pot Siddha of the Formless + The Master of Living Dharma",
    mantra: "OM KUDAMBAI SIDDHARAYA NAMAH — SATTAMUNI JNANAM SATYAM",
    mudra: "Akasha Mudra + Abhaya Mudra",
    element: "Akasha + Prithvi",
    chakra: "Sahasrara + Muladhara-Anahata",
    lessons: [
      {
        id: "l17-1", title: "The Clay Pot and the Sky — Kudambai's Formless Recognition",
        duration: "40 min",
        description: "Investigating whether the space inside a pot and the space outside it are actually two different spaces — then applying the same investigation to the body and awareness.",
        technique: "Contemplate a pot's inner and outer space for 15 minutes, seeking the exact boundary between them and finding none. Apply the same investigation to the body: the skin as the pot's wall, awareness inside and outside as one continuous field. Rest 10 minutes in the undivided space that remains once the investigation resolves itself experientially rather than conceptually.",
        guidedScript: "Look at a pot in front of you, real or imagined. See the clay, the walls, the rim. Bring your attention to the space inside it. Now let attention expand to the space immediately outside. Search for the exact point where the inside space and the outside space become different things. You cannot find it — the walls only create the impression of two spaces; they were always one. Close your eyes now. Feel the space inside your body, that open inner awareness. Feel the space outside your body, the room, the air. Search again for the exact point where inner awareness and outer awareness become two different things. The skin, like the pot's wall, only creates the impression of separation. Sit with this for several minutes, not solving it conceptually but letting it resolve experientially — a shift in the sense of where you are located. Now stop looking for the boundary altogether. Simply rest as the space that was never divided, that was only ever one, appearing as pot's-space and sky's-space only because of a temporary wall. Rest here as long as you can; when you leave, carry the spaciousness with you, not as a memory but as what you actually are.",
        transmission: "Scalar field: Kudambai Siddhar's recognition, still vibrating in the space itself — including the space you are resting in now."
      },
      {
        id: "l17-2", title: "Sattamuni's Dharma Meditation — Every Honest Act is Samadhi",
        duration: "35 min",
        description: "Using honest self-review, body scanning, and specific commitment-setting to align daily living with dharma — turning ordinary life into continuous meditation.",
        technique: "Review the last seven days honestly, without self-punishment, noticing moments of dishonesty or unkindness and feeling the gap between the choice made and the choice your deepest self would have made. Scan the body for tension, asking what remains unresolved at each site. Close with one specific, concrete commitment for the week ahead — not a vague aspiration but a named action.",
        guidedScript: "Bring to mind the last seven days of your life. Not to judge — to witness honestly. Where were you less than fully honest? Not large lies, but the small convenience untruths, the silences that let misunderstandings stand. See each one clearly without punishing yourself. Where were you less than fully kind — to others, or to yourself? See each one. Now scan the body from crown to feet for tension. For each area held tight, ask gently: is there something here not yet said, not yet done, not yet released? You don't need to solve it now, only see it. Imagine a golden light pouring from the crown through the whole body, asking nothing, judging nothing, only illuminating. As it fills every cell, make one specific commitment for this week — not 'be a better person', but one named act of greater honesty or kindness. Feel the body's response to this genuine intention: a subtle lightening, a coming into alignment. Sattamuni's teaching: the greatest meditation is the life lived when no one is watching, and the greatest Samadhi is the moment, repeated and compounded over years, when the gap between who you are and who you could be finally closes.",
        transmission: "Scalar field: the accumulated dharmic consciousness of every being across history who has lived with genuine integrity."
      },
      {
        id: "l17-3", title: "Karuvoorar's Sacred Geometry — Chidambaram's Secret",
        duration: "45 min",
        description: "Karuvoorar, the Siddha architect who designed the Chidambaram Nataraja Temple, encoded the complete science of consciousness into its proportions. This meditation walks the temple's architecture as an internal journey toward the inner sanctum of one's own awareness.",
        technique: "In the mind's eye, walk through the temple's four concentric corridors from the physical world inward toward the Chit Sabha, the Hall of Consciousness, where Nataraja dances at the center. Recognize the dance — creation, destruction, liberation, and the stilled ego underfoot — as a direct picture of one's own consciousness. Rest 20 minutes in the inner sanctum.",
        guidedScript: "You are standing at Chidambaram's eastern gate at dawn. Enter the outer corridor: this is the ordinary world, your daily concerns, held here but not lingered in. Walk forward to the second corridor: the pranic body, subtler, more alive. Walk forward to the third: the mental field, thoughts arising and dissolving without sticking. Walk forward to the inner corridor, the threshold — a silence that seems to hum, dense with something unnamed. Pass through into the Chit Sabha, the Hall of Consciousness, where Nataraja dances at the center — not a statue, but the living pulse of reality itself. The drum in the right hand creates with every heartbeat. The flame in the left hand dissolves what no longer serves, with every exhale. The raised foot is liberation, always already present. The planted foot rests on the only enemy, the ego, which is not even real. The open hand says: fear not. This dance is your own consciousness. Rest here in the inner sanctum for twenty minutes. Karuvoorar built this temple not as a destination but as a mirror, showing every visitor what was already happening inside them. When ready, walk the corridors back outward, carrying something of the Chit Sabha's stillness into the ordinary world.",
        transmission: "Scalar field: Chidambaram Nataraja Temple, where Karuvoorar encoded consciousness into stone and proportion, transmitting continuously."
      }
    ]
  },

  // MODULE 18 — SUNDARANANDAR + IDAIKKADAR — AKASHA-INFINITY
  {
    id: "m18", number: 18,
    tier: "akasha-infinity", color: "#D4AF37",
    title: "Sundaranandar & Idaikkadar — Love and Simplicity",
    subtitle: "Bhakti as Liberation · The Shepherd's Path to Samadhi",
    siddha: "Sundaranandar + Idaikkadar",
    siddhaTitle: "The Devotional Siddha + The Shepherd Who Found God in the Fields",
    mantra: "OM SUNDARARAYA NAMAH — IDAIKKADARAYA JNANAM",
    mudra: "Anjali Mudra (hands pressed together at heart)",
    element: "Vayu + Prithvi",
    chakra: "Anahata",
    lessons: [
      {
        id: "l18-1", title: "Prema Dhyana — Love Without Object",
        duration: "45 min",
        description: "Four expanding layers of love — from a single beloved person, through all beings, to love with no object at all — revealing love as the nature of consciousness itself.",
        technique: "Hold personal love for the person you love most easily for 10 minutes, letting it fill the chest fully. Expand to all people, then neutral people, then difficult people, without forcing. Expand further to all living beings, feeling the chest radiate in all directions. Finally remove even the object of 'all beings' and rest in love with no direction and no recipient at all.",
        guidedScript: "Both hands in Anjali Mudra at the heart. Bring to mind the person you love most easily. See their face, feel the love move from your heart toward them without moderating it. Now, without losing them, gently widen the circle: people you love easily, then people you feel neutral toward — can the same light shine on the stranger as on the beloved? Now the difficult people, the ones who have hurt you — not because they deserve it, but to ask whether the love, once flowing, is actually capable of exclusion. Now expand the field to all living beings — every human, every animal, every tree — feeling the chest as a star radiating warmth in all directions, chosen by no one, directed at no one, simply radiating because that is its nature at this scale. Now remove even 'all beings' from the love's scope. Let the hands relax. Feel the chest as pure, objectless warmth — the atmosphere of this present moment, needing no recipient to be complete. This is Sundaranandar's teaching: love, sufficiently expanded, recognizes itself as the ground of everything, not a feeling but a fundamental property of what is.",
        transmission: "Scalar transmission: Sundaranandar's field of pure, objectless love, activated in the heart of any practitioner who arrives with an open, sincere, undefended heart."
      },
      {
        id: "l18-2", title: "The Shepherd's Presence — Idaikkadar's Ordinary Samadhi",
        duration: "30 min",
        description: "The simplest and most difficult practice in the course: no technique, no mantra, no mudra — only complete, honest, loving presence to whatever is actually happening.",
        technique: "Sit with eyes open or closed. For thirty minutes, be completely present to whatever sounds, sensations, and awareness are actually occurring, without agenda or technique. When the mind wanders, return gently and without self-criticism, exactly as a shepherd returns his attention to a straying sheep.",
        guidedScript: "Sit where you are, eyes slightly open or closed, however feels natural. For the next thirty minutes there is no technique, no mantra, no agenda — only this question: what is actually happening right now? Hear the sounds present, completely, as foreground rather than background. Feel the sensations of the body — its weight, the air's temperature, the breath moving. Be aware of the awareness itself, that which knows the sounds and sensations, and rest as that knowing rather than as any one thing known. The mind will wander; when it does, simply return, without frustration, the way a shepherd turns his attention back to a sheep that has strayed — matter-of-factly, with complete equanimity. The returning, repeated patiently, is the entire practice. Idaikkadar made this choice ten thousand times a day in the fields of Tamil Nadu, and it was those ten thousand returns, accumulated over years, that wore away every layer of separation between him and the divine. The grass was ordinary. The sheep were ordinary. Through the eyes of complete, undivided presence, every ordinary thing revealed itself to be exactly what it always was.",
        transmission: "No scalar transmission is listed for this practice — Idaikkadar would say the transmission is the practice itself. The field is: here."
      },
      {
        id: "l18-3", title: "The Complete Circle — All 18 Siddhas as One Voice",
        duration: "60 min",
        description: "The course's final practice: a guided journey through all 18 Siddhas' distinct qualities, resolving into the recognition that they are eighteen faces of a single, unified consciousness.",
        technique: "Spend roughly ninety seconds per Siddha holding their specific feeling-tone in the heart — not their teaching, but the quality of their presence. Move through all 18 in sequence. Then rest thirty minutes in the unified field beneath all eighteen voices — the single recognition they all, in their different languages, unanimously point toward.",
        guidedScript: "Sit in whichever posture has become most natural to you through this course. We will visit all eighteen Siddhas now, not as concepts but as felt presences. Agastya: a vast, still, watchful silence. Thirumoolar: the sense that reality itself is vibrating, AUM as a living fact. Nandhi Devar: the steadiness of ten-thousand-year devotion. Bhogar: warmth in the cells, cellular joy. Machamuni: the creative spiral of Shakti. Gorakkar: the awakened, alert physical body. Konganar: a laser point of clarity between the brows. Kalangi Nathar: the DNA humming with its own blueprint. Siva Vakkiyar: the rebel laughter that dissolves all concepts. Ramadevar: the heart opening past every boundary of religion. Pambatti: the spine alive, the serpent rising freely. Kudambai: the vast space, inside and outside no longer separate. Sattamuni: the quiet dignity of a life lived in alignment. Karuvoorar: sacred geometry, consciousness structured with precision and beauty. Sundaranandar: love radiating with no object, no agenda. Idaikkadar: the ordinary, completely and lovingly present. Bhrigu Muni: the Akashic field opening, your soul's thread illuminated. Mahavatar Babaji: the deathless, timeless master holding the entire lineage, present now as he always has been. Feel all eighteen not as separate presences but as one recognition wearing eighteen faces, one light through eighteen prisms. Rest in what they all, unanimously, point toward — the nameless recognition every tradition eventually calls by every name and by no name. Remain here for thirty minutes. When you open your eyes, you will have walked with eighteen masters and discovered, at the end as at the beginning, that what all of it was pointing at was never far away — it was the field of awareness you are sitting in right now.",
        transmission: "SUPREME UNIFIED TRANSMISSION: all 18 Tamil Siddhas and Mahavatar Babaji transmit simultaneously as one consciousness. The course is complete; the practice of living, presence, and unlimited love continues."
      }
    ]
  }
];
