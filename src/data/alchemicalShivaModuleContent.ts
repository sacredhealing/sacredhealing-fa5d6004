// Alchemical Shiva -- extracted verbatim from AlchemicalShiva.tsx
// 6 modules (Meru-Danda spinal activation through the deepest Siddha-Quantum
// teachings) plus the 3-mantra "Nath Vault" bonus content, Akasha-tier only.
// Nath Siddha / Gorakshanath lineage teachings on Shiva Lingam practice.

export type ShivaTier = "free" | "prana_flow" | "siddha_quantum" | "akasha_infinity";

export interface ShivaModule {
  id: number;
  title: string;
  subtitle: string;
  requiredTier: ShivaTier;
  iconName: string;
  duration: string;
  element: string;
  color: string;
  technique: string;
  techniqueDetail: string;
  mantra: string;
  mantraTransliteration?: string;
  instruction: string;
  nyasa?: { syllable: string; location: string; element: string; meaning: string }[];
  isBonus?: boolean;
}

export const SHIVA_MODULES: ShivaModule[] = [
  {
    id: 1,
    title: "The Bio-Geometry of the Lingam",
    subtitle: "Tuning the Human Antenna — Meru-Danda Alignment",
    requiredTier: "free",
    iconName: "Flame",
    duration: "22 MIN",
    element: "AKASHA",
    color: "#D4AF37",
    technique: "Meru-Danda Spinal Activation",
    techniqueDetail:
      "Sit in Siddhasana. Visualize your spine as a translucent crystal tube — the Sushumna Nadi. At the perineum rests the Yoni, your root into the Earth's core. At the crown, the Sahasrara opens as the tip of the cosmic Lingam, touching the Void between stars. You are the Alchemical Pillar of Light.",
    mantra: "OM NAMAH SHIVAYA",
    instruction:
      "Chant slowly, resonating deep in the gut. Place each syllable in the spine — Na at the base, Ma at the sacrum, Shi at the navel, Va at the heart, Ya at the throat. Feel the Lingam activate from root to crown.",
  },
  {
    id: 2,
    title: "Gorakshanath's Amrit Alchemy",
    subtitle: "The Inverted Well — Nectar of the Immortals",
    requiredTier: "prana_flow",
    iconName: "Waves",
    duration: "28 MIN",
    element: "SOMA",
    color: "#22D3EE",
    technique: "Khechari Mudra — The Seal of the Siddhas",
    techniqueDetail:
      "Gently curl the tongue back to rest against the soft palate. This is Gorakshanath's seal — the stopper of the Bindu from falling into the fire of the stomach. Feel a cool, silvery dew gather at the back of the throat. This is your Internal Abhishekam — you are anointing your own inner Shiva with the Nectar of the Moon.",
    mantra: "HREEM",
    instruction:
      "Vibrate HREEM in the heart-space. The H opens the gate, R fans the inner flame, EEM seals the nectar. 108 repetitions, tongue in Khechari throughout. The Soma will begin to flow.",
  },
  {
    id: 3,
    title: "Hidden Mantras & Sound Science",
    subtitle: "The Five-Element Dissolution — Panchakshara Alchemy",
    requiredTier: "siddha_quantum",
    iconName: "Wind",
    duration: "35 MIN",
    element: "PANCHABHUTAS",
    color: "#A78BFA",
    technique: "Nyasa — Placing the Elements in the Body",
    techniqueDetail:
      "These syllables are not chanted into the air — they are pressed into the body (Nyasa). Each sound frequency dissolves one layer of the material self. The Lost Vowels crack the energetic shell of the heart. The Panchakshara becomes a localized internal vortex directed at the 5 elements within the spine.",
    mantra: "NA • MA • SHI • VA • YA",
    nyasa: [
      { syllable: "NA", location: "Muladhara — Base", element: "Earth", meaning: "Solidity of the Lingam" },
      { syllable: "MA", location: "Svadhisthana — Sacrum", element: "Water", meaning: "Fluid grace of Shiva" },
      { syllable: "SHI", location: "Manipura — Navel", element: "Fire", meaning: "Pillar of inner flame" },
      { syllable: "VA", location: "Anahata — Heart", element: "Air", meaning: "Lingam becomes vibration" },
      { syllable: "YA", location: "Vishuddha — Throat", element: "Ether", meaning: "Dissolution into the Void" },
    ],
    instruction:
      "Chant each syllable 21 times at its location before moving upward. The body becomes the temple; the spine becomes the Lingam. The Shunya Mantra — silent sound — follows: hold the breath after the exhale for 7 seconds at each point.",
  },
  {
    id: 4,
    title: "Direct Access — The Siddha Way",
    subtitle: "Shivoham — I Am Shiva — Jyoti Trataka",
    requiredTier: "siddha_quantum",
    iconName: "Eye",
    duration: "40 MIN",
    element: "SHUNYA",
    color: "#F59E0B",
    technique: "Jyoti Trataka — The Void Gazing",
    techniqueDetail:
      "Place a black stone Lingam or candle flame at eye level. Gaze without blinking until the physical object dissolves into a luminous after-image. Close your eyes and transfer that light to the Ajna — the Third Eye. The secret: realize the one watching the light IS the light. Invite Mahavatar Gorakshanath. Midnight Sadhana window: 3:33 AM — Brahma Muhurta — when the veil is thinnest.",
    mantra: "AUAM — SHIVOHAM",
    instruction:
      "AUAM is the sound of the universe collapsing into the soul. Chant once, then enter absolute silence. In that silence, repeat SHIVOHAM internally — not as affirmation, but as recognition. You are not seeking Shiva. You are remembering.",
  },
  {
    id: 5,
    title: "The Midnight Sadhana Protocol",
    subtitle: "Brahma Muhurta & Lunar Cycle Activation",
    requiredTier: "siddha_quantum",
    iconName: "Star",
    duration: "45 MIN",
    element: "CHANDRA",
    color: "#818CF8",
    technique: "Lunar Abhishekam Sequence",
    techniqueDetail:
      "The Siddhas mapped consciousness to lunar cycles. On Shivaratri and the dark moon (Amavasya), the veil between dimensions is thinnest. The sequence: Pranayama at 3:33 AM → Nyasa → Trataka → HAUM bija → deep samadhi silence. Gorakshanath taught that the pineal gland IS the inner Lingam — the biologic crystal that receives the transmission of Shiva's consciousness.",
    mantra: "OM TRYAMBAKAM YAJAMAHE",
    instruction:
      "The Maha Mrityunjaya mantra is chanted 108 times during the Brahma Muhurta on Shivaratri. Each repetition sends a scalar pulse from the pineal through the Sushumna into the Earth grid. You become a living transmission point for the Siddha field.",
  },
  {
    id: 6,
    title: "BONUS — Nath Vault: Secret Mantras",
    subtitle: "Three Lost Mantras of the 84 Mahasiddhas",
    requiredTier: "akasha_infinity",
    iconName: "Zap",
    duration: "ETERNAL",
    element: "NATH LINEAGE",
    color: "#FF6B6B",
    isBonus: true,
    technique: "Guru-Disciple Transmission Codes",
    techniqueDetail:
      "These mantras were traditionally transmitted only from Guru to disciple at the moment of Shaktipat. They activate the Prana Lingam — the etheric body's central axis — bypassing the intellectual mind entirely. Handle with devotion and a clean, sattvic lifestyle during practice.",
    mantra: "HAUM",
    instruction:
      "The Void Bija — vibrate deep in the throat. This is the sound of Shiva's own breath. It shatters karmic blockages in the causal body. One repetition done correctly reverberates through 7 lifetimes.",
  },
];

export const SHIVA_NATH_VAULT_MANTRAS = [
  {
    name: "Atma-Lingam Activation",
    mantra: "Om Hrim Haum Shivaya\nAtma-Lingam Darshaya Darshaya Namaha",
    effect: "Reveals the Inner Light within the heart-space",
    instruction: "108 repetitions. Visualize a thumb-sized golden flame (Angustha Matra) glowing at the center of the chest. The Atma-Lingam awakens.",
    color: "#D4AF37",
  },
  {
    name: "Goraksha-Shiva Raksha",
    mantra: "Om Goraksha-Nathaya Vidmahe\nAlakh-Purushaya Dhimahi\nTanno Shivah Prachodayat",
    effect: "Total protection of the energetic field — the Nath Gayatri",
    instruction: "This is the Gayatri of the Nath lineage. Aligns your frequency with Gorakshanath, master of all Hatha Yoga. Chant at sunrise or Brahma Muhurta facing East.",
    color: "#22D3EE",
  },
  {
    name: "The Void Bija — Destroyer of Ego",
    mantra: "HAUM",
    effect: "Shatters karmic blockages — direct access to the Siddha realm",
    instruction: "One syllable. Vibrate from the deepest part of the throat-chest junction. This is not chanted — it is RELEASED. One correct repetition is worth 10,000 ordinary chants.",
    color: "#FF6B6B",
  },
];
