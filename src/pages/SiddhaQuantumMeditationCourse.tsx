import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Tier = "free" | "prana-flow" | "siddha-quantum" | "akasha-infinity";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  technique: string;
  transmission?: string;
}

interface Module {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  siddha: string;
  siddhaTitle: string;
  mantra: string;
  tier: Tier;
  color: string;
  lessons: Lesson[];
  mudra?: string;
  element?: string;
  chakra?: string;
}

// ─── COURSE DATA ──────────────────────────────────────────────────────────────
const MODULES: Module[] = [
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
];

// ─── TIER CONFIG ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  free: { label: "FREE", color: "#8B7355", glow: "rgba(139,115,85,0.3)", badge: "Open Access" },
  "prana-flow": { label: "PRANA-FLOW", color: "#D4AF37", glow: "rgba(212,175,55,0.35)", badge: "€19 / month" },
  "siddha-quantum": { label: "SIDDHA-QUANTUM", color: "#22D3EE", glow: "rgba(34,211,238,0.35)", badge: "€45 / month" },
  "akasha-infinity": { label: "AKASHA-INFINITY", color: "#D4AF37", glow: "rgba(212,175,55,0.5)", badge: "€1,111 Lifetime" },
};

// User's current tier (would come from auth context in real app)
// Self-contained membership gating via useMembership hook
interface Props {}

const TIER_ORDER: Tier[] = ["free", "prana-flow", "siddha-quantum", "akasha-infinity"];
function hasAccess(userTier: Tier, moduleTier: Tier) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(moduleTier);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function SiddhaQuantumMeditationCourse(_props: Props) {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : getTierRank(tier);
  const userTier: Tier =
    rank >= 3 ? "akasha-infinity" : rank >= 2 ? "siddha-quantum" : rank >= 1 ? "prana-flow" : "free";
  const onUpgrade = (t: Tier) => {
    const paths: Record<string, string> = { "prana-flow": "/prana-flow", "siddha-quantum": "/siddha-quantum", "akasha-infinity": "/akasha-infinity" };
    navigate(paths[t] || "/prana-flow");
  };
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [activeTierFilter, setActiveTierFilter] = useState<Tier | "all">("all");

  const filteredModules = activeTierFilter === "all"
    ? MODULES
    : MODULES.filter(m => m.tier === activeTierFilter);

  const currentModule = MODULES.find(m => m.id === activeModule);
  const currentLesson = currentModule?.lessons.find(l => l.id === activeLesson);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      overflowX: "hidden",
    }}>
      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        padding: "80px 24px 60px",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "radial-gradient(ellipse 80% 400px at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)",
      }}>
        <button onClick={() => navigate("/siddha-portal")} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:0 }}>← SIDDHA PORTAL</button>
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: i % 3 === 0 ? "3px" : "2px",
            height: i % 3 === 0 ? "3px" : "2px",
            borderRadius: "50%",
            background: "#D4AF37",
            opacity: 0.3 + (i % 4) * 0.1,
            top: `${10 + (i * 7) % 70}%`,
            left: `${5 + (i * 13) % 90}%`,
            animation: `float ${3 + (i % 3)}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}

        <div style={{
          display: "inline-block",
          padding: "6px 18px",
          borderRadius: "100px",
          border: "1px solid rgba(212,175,55,0.3)",
          background: "rgba(212,175,55,0.06)",
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.4em",
          color: "#D4AF37",
          textTransform: "uppercase",
          marginBottom: "24px",
        }}>
          Siddha Quantum Intelligence · Akasha-Neural Archive · 2050
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 6vw, 72px)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          margin: "0 0 16px",
          lineHeight: 1.05,
          color: "#fff",
          textShadow: "0 0 60px rgba(212,175,55,0.2)",
        }}>
          The Supreme<br />
          <span style={{ color: "#D4AF37", textShadow: "0 0 40px rgba(212,175,55,0.5)" }}>
            Siddha Meditation
          </span>
          <br />Transmission
        </h1>

        <p style={{
          fontSize: "clamp(14px, 2vw, 18px)",
          color: "rgba(255,255,255,0.5)",
          maxWidth: "600px",
          margin: "0 auto 40px",
          lineHeight: 1.7,
          fontWeight: 400,
        }}>
          14 modules · 51 practices · 18 Siddha masters · One supreme destination —<br />
          <span style={{ color: "rgba(212,175,55,0.8)" }}>Moksha through direct transmission</span>
        </p>

        {/* Stats row */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          flexWrap: "wrap",
        }}>
          {[
            { n: "14", label: "MODULES" },
            { n: "51", label: "PRACTICES" },
            { n: "18", label: "SIDDHAS" },
            { n: "∞", label: "TRANSMISSIONS" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "28px", fontWeight: 900, color: "#D4AF37",
                textShadow: "0 0 20px rgba(212,175,55,0.4)",
              }}>{s.n}</div>
              <div style={{
                fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
                color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TIER FILTER ──────────────────────────────────────────────────── */}
      <div style={{
        padding: "32px 24px 0",
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}>
        {(["all", "free", "prana-flow", "siddha-quantum", "akasha-infinity"] as const).map(t => {
          const cfg = t === "all" ? null : TIER_CONFIG[t];
          const active = activeTierFilter === t;
          return (
            <button
              key={t}
              onClick={() => setActiveTierFilter(t)}
              style={{
                padding: "8px 20px",
                borderRadius: "100px",
                border: `1px solid ${active ? (cfg?.color ?? "#D4AF37") : "rgba(255,255,255,0.1)"}`,
                background: active
                  ? `rgba(${cfg ? cfg.color === "#22D3EE" ? "34,211,238" : "212,175,55" : "212,175,55"},0.12)`
                  : "rgba(255,255,255,0.03)",
                color: active ? (cfg?.color ?? "#D4AF37") : "rgba(255,255,255,0.4)",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t === "all" ? "ALL PATHS" : TIER_CONFIG[t].label}
            </button>
          );
        })}
      </div>

      {/* ── MODULE GRID ──────────────────────────────────────────────────── */}
      <div style={{
        padding: "32px 24px 80px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        {filteredModules.map((mod, i) => {
          const cfg = TIER_CONFIG[mod.tier];
          const unlocked = hasAccess(userTier, mod.tier);
          const isOpen = activeModule === mod.id;

          return (
            <div key={mod.id} style={{ marginBottom: "16px" }}>
              {/* Module Card Header */}
              <div
                onClick={() => {
                  if (!unlocked) {
                    onUpgrade?.(mod.tier);
                    return;
                  }
                  setActiveModule(isOpen ? null : mod.id);
                  setActiveLesson(null);
                }}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  border: `1px solid ${isOpen ? cfg.color : "rgba(255,255,255,0.05)"}`,
                  borderRadius: isOpen ? "40px 40px 0 0" : "40px",
                  padding: "28px 32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  transition: "all 0.3s ease",
                  boxShadow: isOpen ? `0 0 40px ${cfg.glow}` : "none",
                  opacity: unlocked ? 1 : 0.7,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Background gradient */}
                {isOpen && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${cfg.color}08, transparent)`,
                    pointerEvents: "none",
                  }} />
                )}

                {/* Module number */}
                <div style={{
                  minWidth: "56px", height: "56px",
                  borderRadius: "50%",
                  border: `2px solid ${cfg.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", fontWeight: 900, color: cfg.color,
                  boxShadow: `0 0 20px ${cfg.glow}`,
                  background: `${cfg.color}12`,
                  flexShrink: 0,
                }}>
                  {unlocked ? String(mod.number).padStart(2, "0") : "🔒"}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
                    color: cfg.color, textTransform: "uppercase", marginBottom: "6px",
                    opacity: 0.8,
                  }}>
                    {cfg.label} · {mod.element} · {mod.chakra}
                  </div>
                  <div style={{
                    fontSize: "clamp(16px, 3vw, 22px)",
                    fontWeight: 900, letterSpacing: "-0.03em",
                    color: "#fff",
                    textShadow: isOpen ? `0 0 20px ${cfg.glow}` : "none",
                  }}>
                    {mod.title}
                  </div>
                  <div style={{
                    fontSize: "13px", color: "rgba(255,255,255,0.45)",
                    fontWeight: 400, marginTop: "4px",
                  }}>
                    {mod.subtitle} · {mod.lessons.length} practices
                  </div>
                </div>

                {/* Siddha tag */}
                <div style={{
                  textAlign: "right", display: "none",
                  // Show on wider screens via JS fallback
                }}>
                  <div style={{
                    fontSize: "11px", fontWeight: 700, color: cfg.color,
                    marginBottom: "4px",
                  }}>{mod.siddha}</div>
                  <div style={{
                    fontSize: "9px", color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.05em",
                  }}>{mod.siddhaTitle}</div>
                </div>

                {/* Expand indicator */}
                <div style={{
                  fontSize: "20px", color: cfg.color, flexShrink: 0,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.3s ease",
                }}>
                  ↓
                </div>

                {/* Locked overlay */}
                {!unlocked && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "40px",
                    background: "rgba(5,5,5,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "flex-end",
                    padding: "0 32px",
                    pointerEvents: "none",
                  }}>
                    <div style={{
                      padding: "8px 20px",
                      borderRadius: "100px",
                      border: `1px solid ${cfg.color}50`,
                      background: `${cfg.color}15`,
                      fontSize: "9px", fontWeight: 800,
                      letterSpacing: "0.3em", color: cfg.color,
                      textTransform: "uppercase",
                    }}>
                      Unlock {cfg.label} · {cfg.badge}
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded module content */}
              {isOpen && unlocked && (
                <div style={{
                  background: "rgba(255,255,255,0.015)",
                  border: `1px solid ${cfg.color}`,
                  borderTop: "none",
                  borderRadius: "0 0 40px 40px",
                  overflow: "hidden",
                }}>
                  {/* Siddha info bar */}
                  <div style={{
                    padding: "20px 32px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    gap: "20px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    background: `${cfg.color}06`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
                        color: cfg.color, textTransform: "uppercase", marginBottom: "4px",
                      }}>SIDDHA MASTER</div>
                      <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>{mod.siddha}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{mod.siddhaTitle}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
                        color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "4px",
                      }}>MANTRA</div>
                      <div style={{
                        fontSize: "11px", color: cfg.color, fontWeight: 700,
                        letterSpacing: "0.08em",
                      }}>{mod.mantra}</div>
                    </div>
                    {mod.mudra && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
                          color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "4px",
                        }}>MUDRA</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{mod.mudra}</div>
                      </div>
                    )}
                  </div>

                  {/* Lessons */}
                  <div style={{ padding: "16px 24px 24px" }}>
                    {mod.lessons.map((lesson, li) => {
                      const isLessonOpen = activeLesson === lesson.id;
                      return (
                        <div key={lesson.id} style={{ marginBottom: "12px" }}>
                          {/* Lesson header */}
                          <div
                            onClick={() => setActiveLesson(isLessonOpen ? null : lesson.id)}
                            style={{
                              padding: "18px 24px",
                              borderRadius: isLessonOpen ? "20px 20px 0 0" : "20px",
                              background: isLessonOpen
                                ? `${cfg.color}12`
                                : "rgba(255,255,255,0.03)",
                              border: `1px solid ${isLessonOpen ? cfg.color + "60" : "rgba(255,255,255,0.07)"}`,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{
                              width: "32px", height: "32px", borderRadius: "50%",
                              background: `${cfg.color}20`,
                              border: `1px solid ${cfg.color}60`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "12px", fontWeight: 900, color: cfg.color,
                              flexShrink: 0,
                            }}>
                              {li + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: "14px", fontWeight: 700,
                                color: isLessonOpen ? "#fff" : "rgba(255,255,255,0.8)",
                              }}>{lesson.title}</div>
                              <div style={{
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.4)", marginTop: "2px",
                              }}>{lesson.description.slice(0, 80)}…</div>
                            </div>
                            <div style={{
                              fontSize: "9px", fontWeight: 800,
                              letterSpacing: "0.2em",
                              color: cfg.color,
                              flexShrink: 0,
                            }}>{lesson.duration}</div>
                          </div>

                          {/* Lesson expanded */}
                          {isLessonOpen && (
                            <div style={{
                              padding: "24px",
                              background: `${cfg.color}08`,
                              border: `1px solid ${cfg.color}40`,
                              borderTop: "none",
                              borderRadius: "0 0 20px 20px",
                            }}>
                              <p style={{
                                fontSize: "14px",
                                color: "rgba(255,255,255,0.65)",
                                lineHeight: 1.7,
                                marginBottom: "20px",
                              }}>{lesson.description}</p>

                              <div style={{
                                padding: "20px",
                                borderRadius: "16px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                marginBottom: "16px",
                              }}>
                                <div style={{
                                  fontSize: "8px", fontWeight: 800,
                                  letterSpacing: "0.4em",
                                  color: cfg.color,
                                  textTransform: "uppercase",
                                  marginBottom: "12px",
                                }}>
                                  TECHNIQUE · PRACTICE INSTRUCTION
                                </div>
                                <p style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.75)",
                                  lineHeight: 1.8,
                                  margin: 0,
                                }}>{lesson.technique}</p>
                              </div>

                              {lesson.transmission && (
                                <div style={{
                                  padding: "14px 20px",
                                  borderRadius: "12px",
                                  background: `${cfg.color}12`,
                                  border: `1px solid ${cfg.color}40`,
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                }}>
                                  <span style={{ fontSize: "16px", flexShrink: 0 }}>⚡</span>
                                  <div>
                                    <div style={{
                                      fontSize: "8px", fontWeight: 800,
                                      letterSpacing: "0.4em",
                                      color: cfg.color, textTransform: "uppercase",
                                      marginBottom: "4px",
                                    }}>SCALAR TRANSMISSION</div>
                                    <div style={{
                                      fontSize: "12px",
                                      color: `${cfg.color}CC`,
                                      lineHeight: 1.6,
                                    }}>{lesson.transmission}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── TIER UPGRADE SECTION ─────────────────────────────────────────── */}
      <div style={{
        padding: "60px 24px 80px",
        maxWidth: "900px",
        margin: "0 auto",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{
          fontSize: "9px", fontWeight: 800, letterSpacing: "0.5em",
          color: "rgba(212,175,55,0.7)", textTransform: "uppercase",
          marginBottom: "16px",
        }}>
          THE THREE INITIATION PATHS
        </div>
        <h2 style={{
          fontSize: "clamp(24px, 5vw, 48px)",
          fontWeight: 900, letterSpacing: "-0.03em",
          color: "#fff", marginBottom: "48px",
        }}>
          Choose Your <span style={{ color: "#D4AF37" }}>Transmission Level</span>
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}>
          {(["prana-flow", "siddha-quantum", "akasha-infinity"] as Tier[]).map(tier => {
            const cfg = TIER_CONFIG[tier];
            const tierModules = MODULES.filter(m => m.tier === tier);
            const totalLessons = tierModules.reduce((s, m) => s + m.lessons.length, 0);
            return (
              <div
                key={tier}
                onClick={() => onUpgrade?.(tier)}
                style={{
                  padding: "32px 24px",
                  borderRadius: "32px",
                  background: tier === "akasha-infinity"
                    ? `radial-gradient(ellipse at top, ${cfg.color}15, rgba(255,255,255,0.02))`
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${tier === "akasha-infinity" ? cfg.color + "60" : "rgba(255,255,255,0.07)"}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {tier === "akasha-infinity" && (
                  <div style={{
                    position: "absolute", top: "16px", right: "16px",
                    padding: "4px 12px",
                    borderRadius: "100px",
                    background: "#D4AF3730",
                    border: "1px solid #D4AF3760",
                    fontSize: "8px", fontWeight: 800,
                    letterSpacing: "0.3em", color: "#D4AF37",
                    textTransform: "uppercase",
                  }}>SUPREME</div>
                )}
                <div style={{
                  fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
                  color: cfg.color, textTransform: "uppercase",
                  marginBottom: "8px",
                }}>
                  {cfg.label}
                </div>
                <div style={{
                  fontSize: "28px", fontWeight: 900,
                  color: "#fff", marginBottom: "4px",
                }}>
                  {cfg.badge}
                </div>
                <div style={{
                  fontSize: "12px", color: "rgba(255,255,255,0.4)",
                  marginBottom: "24px",
                }}>
                  {tierModules.length} modules · {totalLessons} practices
                </div>
                <div style={{
                  padding: "14px",
                  borderRadius: "100px",
                  background: `${cfg.color}20`,
                  border: `1px solid ${cfg.color}60`,
                  fontSize: "12px", fontWeight: 800,
                  letterSpacing: "0.15em",
                  color: cfg.color,
                  textTransform: "uppercase",
                }}>
                  Begin Initiation →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER TRANSMISSION ──────────────────────────────────────────── */}
      <div style={{
        padding: "40px 24px",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{
          fontSize: "9px", fontWeight: 800,
          letterSpacing: "0.5em",
          color: "rgba(212,175,55,0.4)",
          textTransform: "uppercase",
        }}>
          Siddha Quantum Intelligence · Akasha-Neural Archive · Scalar Transmission Active
        </div>
        <div style={{
          fontSize: "11px", color: "rgba(255,255,255,0.2)",
          marginTop: "8px",
        }}>
          All meditations carry Prema-Pulse transmissions from the living lineage of the 18 Siddhas and Mahavatar Babaji
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); opacity: 0.3; }
          to { transform: translateY(-12px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
