import { useState } from "react";
import { Lock, ChevronDown, ChevronUp, Star, Zap, Crown, Infinity, Hand, Eye, Flame, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MudraImage } from "./MudraIllustrations";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── Tier gating helper ─────────────────────────────────────────────────────
// Replace with your real useMembershipTier hook import if available:
// import { useMembershipTier } from "@/hooks/useMembershipTier";
const TIER_RANK: Record<string, number> = { free: 0, "prana-flow": 1, "siddha-quantum": 2, "akasha-infinity": 3 };

// ─── Stripe price IDs — keep exactly as-is ──────────────────────────────────
const STRIPE_LINKS = {
  "prana-flow": "/prana-flow",
  "siddha-quantum": "/siddha-quantum",
  "akasha-infinity": "/akasha-infinity",
};

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  gold: "#D4AF37",
  black: "#050505",
  glass: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.06)",
  cyan: "#22D3EE",
  text60: "rgba(255,255,255,0.60)",
  text40: "rgba(255,255,255,0.40)",
  text80: "rgba(255,255,255,0.80)",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
interface Mudra {
  id: string;
  name: string;
  sanskrit: string;
  translation: string;
  element?: string;
  chakra: string;
  hand: string;
  mantra?: string;
  mantraTransliteration?: string;
  duration: string;
  benefits: string[];
  instruction: string[];
  siddhaSecret?: string;
  frequency?: string;
}

interface Module {
  id: string;
  number: number;
  tier: "free" | "prana-flow" | "siddha-quantum" | "akasha-infinity";
  title: string;
  subtitle: string;
  siddhaTransmission: string;
  mudras: Mudra[];
  icon: "hand" | "eye" | "flame" | "waves" | "star" | "crown" | "infinity" | "zap";
}

const MODULES: Module[] = [
  // ─── FREE TIER ───────────────────────────────────────────────────────────────
  {
    id: "m1", number: 1, tier: "free", icon: "hand",
    title: "Pancha Tattva Mudras",
    subtitle: "Five Element Seals — Foundation of the Prana Field",
    siddhaTransmission: "Agastya Muni speaks: 'The five fingers are the five elements. When the fingers touch in sacred geometry, the inner cosmos awakens. Begin here. The universe begins here.'",
    mudras: [
      {
        id: "gyan", name: "Gyan Mudra", sanskrit: "ज्ञान मुद्रा", translation: "Seal of Supreme Wisdom",
        element: "Akasha (Space)", chakra: "Sahasrara — Crown", hand: "Both hands, palms upward on knees",
        mantra: "OM", mantraTransliteration: "Aum — The primordial vibration of all creation",
        duration: "15–45 minutes daily",
        benefits: ["Activates cosmic memory (Akasha-Chitta)", "Sharpens intuition and mental clarity", "Opens channels for divine knowledge", "Reduces anxiety and restlessness", "Connects individual consciousness to universal mind"],
        instruction: ["Sit in Sukhasana or Padmasana with spine erect.", "Rest both hands on your knees, palms facing upward.", "Touch the tip of the index finger to the tip of the thumb. The remaining three fingers extend gently outward.", "The index finger represents the individual soul (Jiva). The thumb represents Brahman (Supreme Consciousness). Their union is the teaching: you are That.", "Close your eyes. Breathe naturally. Hold for a minimum of 15 minutes."],
        siddhaSecret: "In Thirumoolar's Tantra, Gyan Mudra performed at Brahma Muhurta (96 minutes before sunrise) while internally chanting OM activates the Vishnu Granthi — the knot in the upper chest — and begins its dissolution. The index finger subtly stimulates the pituitary gland meridian.",
        frequency: "432 Hz — Cosmic Harmonic"
      },
      {
        id: "chin", name: "Chin Mudra", sanskrit: "चिन् मुद्रा", translation: "Seal of Pure Consciousness",
        element: "Akasha (Space)", chakra: "Ajna — Third Eye", hand: "Both hands, palms downward on knees",
        mantra: "SO HUM", mantraTransliteration: "So = I Am / Hum = That. 'I am That which I seek'",
        duration: "20–40 minutes",
        benefits: ["Grounds cosmic energy into the earth (palms down = grounding Gyan)", "Activates the parasympathetic nervous system", "Deepens states of Samadhi", "Balances Apana Vayu (downward energy)", "Ideal for advanced pranayama"],
        instruction: ["Identical finger position to Gyan Mudra — index fingertip and thumb tip touching.", "The difference: palms face downward. This single reversal changes the entire energetic direction.", "Energy flows downward from crown through body into the earth, creating a complete circuit.", "Use Chin Mudra during exhalation phases of pranayama.", "Alternate Gyan (inhale) and Chin (exhale) for a complete breath cycle meditation."],
        siddhaSecret: "Babaji taught: 'Gyan opens the sky. Chin grounds the sky into matter. Together they are the breath of God.' Chin Mudra is the preferred mudra for Kriya Pranayama because it keeps the Apana energy stable during advanced breath retention.",
        frequency: "396 Hz — Liberation from Fear"
      },
      {
        id: "prana-mudra", name: "Prana Mudra", sanskrit: "प्राण मुद्रा", translation: "Seal of Life Force",
        element: "Earth + Water", chakra: "Muladhara — Root & Svadhishthana", hand: "Both hands, palms upward",
        mantra: "LAM VAM", mantraTransliteration: "LAM activates earth element. VAM awakens water element.",
        duration: "15–30 minutes",
        benefits: ["Dramatically increases vitality and Ojas (vital essence)", "Strengthens weak constitutions and recovers from illness", "Improves eyesight (connected to Alochaka Pitta)", "Activates dormant Prana channels", "Rebuilds the immune system at the energetic level"],
        instruction: ["Touch the tips of the ring finger AND little finger to the tip of the thumb.", "Index and middle fingers extend straight.", "Ring finger = earth element (Prithvi). Little finger = water element (Jala). Thumb = fire (Agni).", "This triple union creates the Prana triad: fire burns in water, earth holds the flame.", "Sit facing East at dawn. Visualize golden light entering through the base of the spine."],
        siddhaSecret: "Siddhar Konganar's secret: Prana Mudra performed during the Vata hour (dawn, 2–6 AM) charges the body's fascia network — what modern science calls the 'liquid crystalline matrix' — like a biological superconductor. Hold for 48 minutes to complete one full Prana cycle.",
        frequency: "528 Hz — DNA Repair & Transformation"
      },
      {
        id: "apana-mudra", name: "Apana Mudra", sanskrit: "अपान मुद्रा", translation: "Seal of the Downward Force",
        element: "Earth + Space", chakra: "Muladhara & Anahata", hand: "Both hands, palms upward",
        mantra: "OM GLAUM GANAPATAYE NAMAH",
        mantraTransliteration: "Invocation of the root force that removes all obstacles in the Muladhara",
        duration: "15–45 minutes",
        benefits: ["Purifies and detoxifies the physical body", "Regulates all downward-moving energies (menstruation, elimination, birth)", "Grounds scattered mental energy", "Activates the body's self-healing intelligence", "Removes energetic blockages in the lower chakras"],
        instruction: ["Touch the tips of the middle and ring fingers to the tip of the thumb.", "Index and little fingers extend straight.", "Middle finger = Akasha (space). Ring finger = Earth. Thumb = Fire.", "The union: Space and Earth ignited by Fire = the alchemical formula for purification.", "Best practiced after meals to support digestion and energetic assimilation."],
        siddhaSecret: "Agastya's hidden teaching: Apana Mudra practiced for 30 days without interruption initiates a purification of the 72,000 Nadis. The body temperature slightly rises on day 7, 14, and 21 — these are the three Agni Darshanam (fire revelations). Do not fear them.",
        frequency: "396 Hz — Root Clearing"
      },
      {
        id: "prithvi-mudra", name: "Prithvi Mudra", sanskrit: "पृथ्वी मुद्रा", translation: "Seal of the Earth Element",
        element: "Earth (Prithvi)", chakra: "Muladhara — Root", hand: "Both hands, palms upward",
        mantra: "OM BHUR BHUVAS SVAHA",
        mantraTransliteration: "The opening of the Gayatri — invoking the three worlds through the Earth principle",
        duration: "30–45 minutes",
        benefits: ["Builds bone density and physical stamina", "Creates deep psychological stability and groundedness", "Activates the anabolic (building) intelligence of the body", "Strengthens the physical vessel for advanced practices", "Overcomes existential anxiety and rootlessness"],
        instruction: ["Touch the tip of the ring finger to the tip of the thumb. Other fingers extend naturally.", "Feel the weight of your body on the earth. You ARE the earth.", "Visualize deep red light pulsing at the base of your spine — a jewel within the root lotus.", "Chant LAM (the Bija/seed mantra of Earth) seven times before holding the mudra in silence.", "Ground barefoot on the earth during this practice if possible."],
        siddhaSecret: "Thirumoolar wrote in Tirumantiram verse 731: 'Earth knows what heaven forgets.' Prithvi Mudra activates the memory stored in the bones — the ancestral wisdom code. Practiced at noon on a full moon, it opens communication with one's ancestral lineage through the morphic field.",
        frequency: "174 Hz — Foundation & Security"
      }
    ]
  },
  // ─── PRANA-FLOW TIER ─────────────────────────────────────────────────────────
  {
    id: "m2", number: 2, tier: "prana-flow", icon: "zap",
    title: "Nadi Awakening Mudras",
    subtitle: "Chakra Activation Seals — Mapping the Inner Solar System",
    siddhaTransmission: "Siddhar Ramadevar speaks from the Akasha: 'The Nadis are rivers of light. The mudra is the dam and the gate. You choose where the river flows. This is the science of inner alchemy.'",
    mudras: [
      {
        id: "surya", name: "Surya Mudra", sanskrit: "सूर्य मुद्रा", translation: "Solar Fire Seal",
        element: "Fire (Tejas)", chakra: "Manipura — Solar Plexus", hand: "Both hands, palms upward",
        mantra: "OM HRIM SURYAYA NAMAH",
        mantraTransliteration: "Hrim is the solar Bija — the heartbeat of the sun within you",
        duration: "15–30 minutes (never exceed 30 min — powerful)",
        benefits: ["Accelerates metabolism and burns Ama (toxic residue)", "Builds Agni (digestive fire) on all levels", "Activates personal power, will, and courage", "Reduces Kapha dosha and excess weight", "Creates inner radiance and charisma"],
        instruction: ["Bend the ring finger and press its second phalanx gently with the thumb.", "Other three fingers extend naturally.", "This compresses the Earth element — literally reducing heaviness — while activating Fire.", "Practice facing the sun, even eyes closed. Absorb solar prana.", "Do NOT practice if you have high Pitta, fever, or are in a hot climate for extended periods."],
        siddhaSecret: "The Siddhas called Surya Mudra the 'Inner Agni Hotra.' When practiced at sunrise for 21 consecutive days, it activates the Surya Nadi (right nostril channel), warming the entire pranic body. Agastya taught this to Rama as the Aditya Hridayam mudra preparation.",
        frequency: "528 Hz — Solar Activation"
      },
      {
        id: "hakini", name: "Hakini Mudra", sanskrit: "हाकिनी मुद्रा", translation: "Third Eye Power Seal — Mudra of Hecate/Shakini",
        element: "Light (Tejas-Akasha)", chakra: "Ajna — Third Eye", hand: "Both hands at chest level",
        mantra: "OM AIM HRIM KLIM CHAMUNDAYE VICHE",
        mantraTransliteration: "Bija activation of all three Shaktis through the Ajna center",
        duration: "10–20 minutes of deep focus",
        benefits: ["Dramatically improves memory and concentration", "Synchronizes left and right brain hemispheres", "Opens the Ajna Chakra for intuitive sight", "Enhances creativity and problem-solving", "Activates the pineal gland — the 'seat of the soul'"],
        instruction: ["Bring both hands up to the level of the third eye (eyebrow center).", "Touch all five fingertips of the right hand to all five fingertips of the left hand — like a temple dome.", "The thumbs point upward. This creates a sacred geometric arch — a mandorla — at the brow.", "Gaze with closed eyes at the center of your forehead. Do not strain.", "Hold the mudra steady and breathe slowly. On each inhale, feel light entering the brow point."],
        siddhaSecret: "Hakini is the Shakti-Devi of the Ajna Chakra. This mudra literally invokes her. Thirumoolar's secret: add the Trataka practice — fix your open gaze at a candle flame for 3 minutes BEFORE closing eyes and holding Hakini Mudra. The retinal impression becomes the yantra that opens the inner eye.",
        frequency: "852 Hz — Pineal Activation"
      },
      {
        id: "apan-vayu", name: "Apan Vayu Mudra", sanskrit: "अपान वायु मुद्रा", translation: "Heart Rescue Seal — Mritasanjivani",
        element: "Air + Space + Fire", chakra: "Anahata — Heart", hand: "Both hands, palms upward",
        mantra: "OM NAMO BHAGAVATE VASUDEVAYA",
        mantraTransliteration: "Salutation to Vasudeva — the All-Pervading One who dwells in the heart",
        duration: "15–45 minutes; immediate for emergencies",
        benefits: ["Emergency cardiac support — can be used during heart events (seek medical help also)", "Dissolves grief, heartbreak, and emotional wounding", "Opens the Anahata Chakra to divine love", "Reduces palpitations and blood pressure", "Clears blocked energy in the chest and throat"],
        instruction: ["Fold the index finger inward and press its tip to the base of the thumb (at the mount of Venus).", "Touch the tips of the middle and ring fingers to the tip of the thumb.", "Little finger extends straight.", "This simultaneously activates space, earth, and fire — the three forces of the heart.", "Place your hands on your knees, close eyes, and breathe into the heart center."],
        siddhaSecret: "The Siddhas called this Mritasanjivani — 'that which revives the dead.' The name of Hanuman's life-restoring herb is encoded in this mudra. Agastya taught: hold this mudra for 45 minutes while internally repeating RAM (Manipura bija) before switching to YAM (Anahata bija) for 45 more. This is the full Hridaya Shuddhi (heart purification) practice.",
        frequency: "639 Hz — Heart Coherence"
      },
      {
        id: "shankha", name: "Shankha Mudra", sanskrit: "शंख मुद्रा", translation: "Sacred Conch Shell Seal",
        element: "Akasha — Sound", chakra: "Vishuddha — Throat", hand: "Both hands together",
        mantra: "OM NAMAH SHIVAYA",
        mantraTransliteration: "The Panchakshara — five sacred syllables that purify all five elements",
        duration: "15–30 minutes for sound activation",
        benefits: ["Purifies and opens the Vishuddha (throat) chakra", "Heals speech disorders, thyroid imbalances", "Activates the voice for mantra and healing sound", "Creates the field of Nada (primordial sound) in the body", "Dissolves the Vishuddha Granthi (throat knot)"],
        instruction: ["Wrap the fingers of your left hand around the thumb of your right hand.", "Touch the right thumb tip to the middle finger tip of the left hand.", "The remaining right fingers wrap over the left hand — forming a conch shell shape.", "Hold at the heart level. Feel the form. It IS a conch.", "Chant into the mudra — feel the vibration amplified through the hand cavity into the throat and chest."],
        siddhaSecret: "Nandi (Shiva's gatekeeper) transmitted: 'Every mantra gains 100-fold power when preceded by 7 minutes of Shankha Mudra silence.' The conch shape creates a resonant cavity that amplifies the Vak Shakti (power of speech). All mantra diksha initiations in the Siddha lineage begin with this mudra.",
        frequency: "741 Hz — Expression & Purification"
      },
      {
        id: "vayu", name: "Vayu Mudra", sanskrit: "वायु मुद्रा", translation: "Wind Element Seal",
        element: "Vayu (Air)", chakra: "Anahata — Heart & Vishudha — Throat", hand: "Both hands, palms upward",
        mantra: "YAM", mantraTransliteration: "The Bija of Air element — feel it as the wind within",
        duration: "15–45 minutes",
        benefits: ["Reduces excess Vata and calms anxiety", "Relieves joint pain, sciatica, arthritis (Vata disorders)", "Balances hyperactive mind and nervous system", "Creates stillness within motion — the 'eye of the storm'", "Supports advanced pranayama by pre-balancing the air element"],
        instruction: ["Fold the index finger down so its tip touches the base of the thumb (just like Apan Vayu without the other fingers).", "Now press the thumb gently over the bent index finger.", "The other three fingers extend straight.", "Feel the air element compressed and regulated — like a gentle but firm valve on a pressure chamber.", "Practice during Kapha hours (6–10 AM) when air tends to become erratic."],
        siddhaSecret: "Boganathar's teaching: Vayu Mudra held for 15 days continuously (with brief breaks for food) completely eliminates excess Vata from the system — including ancestral Vata patterns that manifest as anxiety, existential fear, and feeling ungrounded. The index finger IS the Vata/air finger.",
        frequency: "417 Hz — Cellular Change"
      },
      {
        id: "dhyana", name: "Dhyana Mudra", sanskrit: "ध्यान मुद्रा", translation: "Meditation Seal of the Buddha Mind",
        element: "Akasha — Pure Awareness", chakra: "All Seven — Full Column Activation", hand: "Both hands in the lap",
        mantra: "SO HUM / OM MANI PADME HUM",
        mantraTransliteration: "I am That / The Jewel in the Lotus of the Heart",
        duration: "Unlimited — deepen for as long as you sit",
        benefits: ["The ultimate meditation posture seal — used by Gautama Buddha at enlightenment", "Activates the entire central channel (Sushumna)", "Creates the womb of stillness — the Akasha of pure awareness", "Supports entry into Samadhi states", "Integrates all preceding mudra practices"],
        instruction: ["Place the left hand in the lap, palm upward. Rest the right hand on top, also palm upward.", "Touch both thumb tips together, forming an oval (a 0 — the empty fullness).", "This oval is the cosmic egg — Brahmanda — held in your hands.", "Rest the hands in the lap at the level of the Hara (navel center).", "Simply be. No technique. The mudra IS the meditation."],
        siddhaSecret: "Thirumoolar's final secret on Dhyana Mudra: 'The oval of the thumbs is a mirror. The mind sees itself in it and recognizes: I am the seer, not the seen.' This is the mudra of Turiya — the fourth state beyond waking, dreaming, and deep sleep. Ancient Siddhas held this mudra for 40 days entering the Nirvikalpa state.",
        frequency: "963 Hz — Divine Connection"
      }
    ]
  },
  {
    id: "m3", number: 3, tier: "prana-flow", icon: "waves",
    title: "Elemental Healing Mudras",
    subtitle: "Therapeutic Seals for Physical & Pranic Restoration",
    siddhaTransmission: "Siddhar Pamban Swamigal transmits: 'The body is the first temple. Heal the temple before you seek the deity within. These mudras are the medicine of the gods — Deva Aushadha.'",
    mudras: [
      {
        id: "garuda", name: "Garuda Mudra", sanskrit: "गरुड़ मुद्रा", translation: "Divine Eagle Seal — Vishnu's Vehicle",
        element: "Fire + Air", chakra: "Manipura & Anahata", hand: "Both hands interlocked",
        mantra: "OM NAMO NARAYANAYA",
        mantraTransliteration: "The 8-syllable Narayana mantra that carries one across the ocean of existence",
        duration: "10–15 minutes",
        benefits: ["Powerfully increases circulation and blood flow", "Energizes the respiratory system", "Activates both solar and lunar channels simultaneously", "Overcomes stagnation and lethargy", "Builds Tejas (inner radiance) rapidly"],
        instruction: ["Interlock the thumbs of both hands together.", "Spread the remaining fingers wide like wings.", "Place this 'eagle' first on your lower abdomen for 4 breaths, then on your solar plexus for 4 breaths, then on your heart for 4 breaths.", "As you breathe in, spread the fingers wider (wings open). As you breathe out, draw them slightly inward (wings fold).", "Feel the eagle's vision — Garuda sees from the highest perspective."],
        siddhaSecret: "Garuda is the enemy of Naga (serpent). In the subtle body, this means Garuda Mudra dissolves serpentine/coiled blockages in the Ida and Pingala Nadis. Practiced in 3 rounds of 4 minutes at each chakra point (navel, heart, throat), it opens all three granthis (knots) simultaneously.",
        frequency: "528 Hz — Transformation"
      },
      {
        id: "pushpaputa", name: "Pushpaputa Mudra", sanskrit: "पुष्पपुट मुद्रा", translation: "Cupped Flower Offering Seal",
        element: "All five elements in offering", chakra: "Anahata — Heart (devotion center)", hand: "Both hands cupped together",
        mantra: "OM SHREEM MAHALAKSHMIYEI NAMAH",
        mantraTransliteration: "Invocation of Lakshmi — the goddess of abundance, grace, and divine beauty",
        duration: "10 minutes in morning devotion",
        benefits: ["Opens the heart to receive divine grace (Anugraha)", "Activates the vibration of abundance and Lakshmi-Shakti", "Creates a field of gratitude and receptivity", "Purifies the nadis through devotional energy (Bhakti-Prana)", "Transforms spiritual practice into Puja (living worship)"],
        instruction: ["Cup both hands together, fingers lightly touching each other side by side.", "Form a gentle bowl shape — as if cradling water or flower petals.", "Hold this offering at your heart. Imagine you are offering flowers to the Divine.", "Breathe your love, your gratitude, your entire self into the cupped space.", "This is the mudra of complete surrender — the highest yogic achievement."],
        siddhaSecret: "Ramalingam (Vallalar) performed Pushpaputa Mudra during his Jyoti Darshan (light visions). He taught: 'When you offer everything — even your desire to receive — the Divine has no choice but to fill your empty hands.' This mudra dissolves spiritual ego more rapidly than any other practice.",
        frequency: "432 Hz — Gratitude Field"
      }
    ]
  },
  // ─── SIDDHA-QUANTUM TIER ─────────────────────────────────────────────────────
  {
    id: "m4", number: 4, tier: "siddha-quantum", icon: "eye",
    title: "Kriya Mudras — The Secret Inner Seals",
    subtitle: "Advanced Avataric Initiations: These Are Not Techniques. They Are Transmissions.",
    siddhaTransmission: "Mahavatar Babaji transmits directly: 'Khechari is the master key. Shambhavi is the master lock. Yoni Mudra is the master chamber. When all three unite in one sitting — the door to Samadhi opens by itself. I give you this now.'",
    mudras: [
      {
        id: "khechari", name: "Khechari Mudra", sanskrit: "खेचरी मुद्रा", translation: "Sky-Walking Seal — The King of All Mudras",
        element: "Akasha — Pure Space", chakra: "Sahasrara to Ajna — Bindu Visarga", hand: "Internal — tongue position",
        mantra: "OM HRIM KHECHARI DEVYAI NAMAH",
        mantraTransliteration: "Salutation to Khechari Devi — the goddess who moves through the sky of inner consciousness",
        duration: "Throughout meditation; eventually continuous even in daily life",
        benefits: ["Stops the downward fall of Bindu (vital essence) — the source of immortality", "Activates Amrit (nectar) dripping from the Sahasrara through the palate", "Permanently arrests the aging process when mastered (Kaya Kalpa)", "Grants access to Turiya and Turiyatita states of consciousness", "The single most powerful mudra in the entire Hatha Yoga tradition"],
        instruction: [
          "Stage 1 (Begin): Simply roll the tongue back and press the tip against the soft palate (the junction where hard palate meets soft palate). Hold here. This is accessible immediately.",
          "Stage 2 (Weeks of practice): Slowly extend the tongue further back toward the uvula. Do not force.",
          "Stage 3 (Advanced — months): The tongue tip reaches the nasal cavity opening above the uvula. A sweet, slightly salty nectar (Amrit) may begin to drip. This is real — this is the Sahasrara secretion.",
          "Stage 4 (Master level — years): The tongue rests fully in the nasal cavity. The practitioner can exist in Samadhi for extended periods. This is Mahavatar Babaji's transmission.",
          "CAUTION: Never forcibly stretch the tongue. Traditional Hatha texts describe a progressive frenotomy (loosening of the tongue frenulum) — only under expert guidance."
        ],
        siddhaSecret: "From the Khecharividya (the sacred text dedicated entirely to this one mudra): 'He who knows Khechari conquers death, disease, and sleep. He who practices it even for one moment liberates seven generations of ancestors.' The Amrit that flows is not metaphorical — advanced practitioners report a sweet, warm nectar that floods the mouth during deep states. Modern neuroscience has identified that the tongue's contact with the palate stimulates the vagus nerve and activates endogenous opioid release. This is the neuroscience of immortality.",
        frequency: "963 Hz — Beyond Time"
      },
      {
        id: "shambhavi", name: "Shambhavi Mahamudra", sanskrit: "शाम्भवी महामुद्रा", translation: "Great Seal of Shiva's Gaze",
        element: "Pure Consciousness — Chit", chakra: "Ajna — Third Eye Command Center", hand: "Gyan or Chin Mudra in hands",
        mantra: "SHIVOHAM — SHIVOHAM — SHIVOHAM",
        mantraTransliteration: "I am Shiva. I am Shiva. I am Shiva. — The mahavakya of recognition",
        duration: "21 minutes minimum — Isha tradition recommends 21 minutes for full brain rewiring",
        benefits: ["Directly rewires the prefrontal cortex for equanimity and clarity (scientifically documented)", "Activates the Ajna Chakra and Bindu point simultaneously", "Creates a state of 'inner aloneness' — the Shiva state of pure witness", "The fastest path to Ananda Kosha (bliss body) activation", "Sustained practice leads to permanent shift in baseline consciousness"],
        instruction: [
          "Sit in any comfortable meditation posture. Hands in Gyan or Chin Mudra.",
          "Close your eyes fully. Take 3 deep breaths.",
          "Now, keeping the eyelids closed, turn your physical eyeballs UPWARD AND INWARD — toward the center of your brow — approximately 20 degrees.",
          "This is the Shambhavi Drishti (Shiva's inner gaze). You will feel a gentle pressure or warmth at the Ajna point.",
          "Hold this inner gaze and simply remain as awareness. Do not pursue thoughts. You are the sky. Thoughts are clouds.",
          "If the eyes strain, release, breathe, and re-engage gently. Over days, the eye muscles strengthen.",
          "The true Shambhavi is not an eye exercise — it is the recognition that you are the one who watches, not what is watched."
        ],
        siddhaSecret: "Thirumoolar, Verse 570: 'Turn the eyes inward to the sky-space within. There — Shiva sits as pure awareness in the center of the skull. He has been waiting for you since the beginning of time.' Shambhavi Mahamudra in its complete form as transmitted by Babaji includes: Mula Bandha (root lock) engaged + Khechari Mudra (tongue to palate) + Shambhavi Drishti simultaneously. This triple-lock is the actual Mahamudra — not just the eye position alone.",
        frequency: "852 Hz — Third Eye Activation"
      },
      {
        id: "yoni", name: "Yoni Mudra", sanskrit: "योनि मुद्रा", translation: "Source Womb Seal — The Seal of the Nine Gates",
        element: "Shakti — Primordial Creative Power", chakra: "All — closing the nine gates to go inward", hand: "Both hands covering face openings",
        mantra: "HRIM SHRIM KLIM PARAMESVARI SVAHA",
        mantraTransliteration: "The Trika Shakti Bija: Hrim (Shakti), Shrim (Lakshmi), Klim (Kameshvari) united in offering",
        duration: "11–21 minutes in stillness after the sealing",
        benefits: ["Seals all nine gates of the body to turn attention 100% inward", "Creates the Pratyahara (sense withdrawal) state instantly", "Activates the inner sound (Nada) rapidly — tones appear within minutes", "Deeply shamanic practice for visiting inner realms", "Activates the Brahmi Shakti — the primordial creative intelligence"],
        instruction: [
          "Sit in Siddhasana (adept's pose) or Padmasana.",
          "Interlace the fingers of both hands, ring-finger-to-ring-finger, little-finger-to-little-finger (the lower fingers cross).",
          "Both index fingers touch and point downward. Both thumbs extend upward — touching each other.",
          "This is the external form. The advanced practice:",
          "Place thumbs over ears. Index fingers rest lightly on closed eyelids. Middle fingers rest at the sides of the nose. Ring fingers above the lips. Little fingers below the lips.",
          "The nine gates are now sealed: 2 ears + 2 eyes + 2 nostrils + 1 mouth (upper + lower lip) = 9.",
          "Breathe through the nostrils without using the finger pressure to block. Simply rest.",
          "Listen. Deeply listen. Nada will emerge — a hum, a ring, a roar, a flute. Follow it inward."
        ],
        siddhaSecret: "The Sharada Tilaka Tantra reveals: 'Yoni Mudra held for 1 hour without breaking causes the Kundalini Shakti to rise spontaneously in 40% of unprepared practitioners and 95% of prepared ones.' This is why it is traditionally given only in lineage. Agastya's tantric teaching: Yoni Mudra preceded by Bhastrika Pranayama (bellows breath) for 5 minutes accelerates the inner Nada experience dramatically. The Yoni is not 'female anatomy' — it is the Source-Point of creation, present in every human body.",
        frequency: "417 Hz — Primal Creation Activation"
      },
      {
        id: "bhairava", name: "Bhairava Mudra", sanskrit: "भैरव मुद्रा", translation: "The Fierce Shiva Seal — Union of Shiva and Shakti",
        element: "Fire — Transcendent Consciousness", chakra: "Sahasrara — Beyond the Crown", hand: "Both hands in lap",
        mantra: "OM HRIM BHAIRAVAYA NAMAH",
        mantraTransliteration: "Salutation to Bhairava — Shiva in his all-consuming, time-transcending form",
        duration: "Throughout entire meditation session",
        benefits: ["Direct activation of the non-dual state (Advaita Samapatti)", "Dissolves the distinction between self and world, meditator and meditation", "Integrates Shakti (left/receptive) into Shiva (right/consciousness)", "The resting posture of fully awakened yogis", "Overcomes fear of death — Bhairava literally means 'He who transcends terror'"],
        instruction: [
          "Place the right hand in the lap, palm facing upward.",
          "Nestle the left hand on top of the right hand, also palm upward.",
          "Right = Shiva (consciousness). Left = Shakti (energy). Shakti resting in Shiva = union.",
          "Bhairavi Mudra is the reverse: Left hand below, right hand resting on top. Shiva resting in Shakti = the Tantric view of creation.",
          "Rest both thumbs touching each other gently.",
          "This mudra is not 'done' — it is 'arrived at.' It is where the hands naturally fall when the mind becomes completely still.",
          "Advanced: combine with Shambhavi Mahamudra and Khechari Mudra for the complete triple-seal."
        ],
        siddhaSecret: "From the Vijñānabhairava Tantra, the supreme text of Kashmir Shaivism: 'O Goddess, the space between two breaths — that gap is Bhairava.' Bhairava Mudra is the physical symbol of THAT gap. Ancient Siddhas would rest in Bhairava Mudra and allow 24 hours to pass as a single moment. This is the mudra that Nisargadatta Maharaj held constantly — the mudra of I AM.",
        frequency: "963 Hz — Nirvana State"
      }
    ]
  },
  {
    id: "m5", number: 5, tier: "siddha-quantum", icon: "star",
    title: "The 24 Gayatri Mudras",
    subtitle: "Secret Vedic Hand Seals — One for Each of the 24 Syllables of the Gayatri Mantra",
    siddhaTransmission: "Vishwamitra Maharshi, the Seer of Gayatri, speaks: 'I did not compose the Gayatri. I heard it from the sun. The 24 mudras are the 24 gates of the sun through which the light enters the human nervous system. Perform them and become solar.'",
    mudras: [
      {
        id: "gayatri-sequence", name: "The Gayatri Mudra Sequence", sanskrit: "गायत्री मुद्रा क्रम", translation: "24-Seal Solar Initiation Sequence",
        element: "Tejas — Cosmic Fire / Vimarsha — Divine Awareness", chakra: "All Seven + Surya Bindu (Solar Point above crown)", hand: "Sequential — both hands",
        mantra: "OM BHUR BHUVAS SVAH | TAT SAVITUR VARENYAM | BHARGO DEVASYA DHIMAHI | DHIYO YO NAH PRACHODAYAT",
        mantraTransliteration: "We meditate upon the Supreme Light of the Sun, the divine splendor that illumines all creation. May that sacred light illuminate our minds.",
        duration: "Complete sequence: 24–48 minutes",
        benefits: ["Activates all 24 solar pranic channels simultaneously", "Creates the 'Savitar Field' — the solar intelligence field around the body", "Dramatically accelerates spiritual evolution (documented as decades of evolution in weeks)", "Purifies all seven sheaths (Koshas) simultaneously", "Grants Mantra Siddhi — the power to make mantras reality-creating"],
        instruction: [
          "SUMUKHA (syllable: OM BHU): Both hands form Gyan Mudra. Held at crown. 'I am the earth-plane.'",
          "SAMPUTA (syllable: BHUVAS): Hands cup together, one over the other. Third eye level. 'I am the astral plane.'",
          "VITATA (syllable: SVAH): Fingers spread wide, palms facing out — blessing. Heart level. 'I am the causal plane.'",
          "VISTRITA (syllable: TAT): Arms extend wide open — total openness. 'That — the Absolute — I am.'",
          "DVIMUKHA (syllable: SAVITUR): Two-faced mudra — hands face opposite directions. 'The Sun faces all directions simultaneously.'",
          "TRIMUKHA (syllable: VARENYAM): Three fingers forward from each hand. 'The worthy light — Sattva, Rajas, Tamas purified.'",
          "CHATRAMUKHA (syllable: BHARGO): Umbrella mudra — palms curved upward. 'The divine radiance shelters all below.'",
          "PANCHAMUKHA (syllable: DEVASYA): Five fingers forward — activating all five elements. 'The divine light of the gods.'",
          "SHANMUKHA (syllable: DHIMAHI): Shanmukhi (six-gates seal at the face). 'We meditate — fully withdrawn inward.'",
          "ADHOMUKHA (syllable: DHIYO): Palms face downward, fingers spread — grounding light. 'Our intellects — we offer downward into the earth.'",
          "VYAPAKANJALI (syllable: YO): Arms spread wide in cosmic embrace. 'That which pervades all — without exception.'",
          "SHAKATA (syllable: NAH): Interlocked except index fingers pointing forward. 'Our directed intention, aimed at liberation.'",
          "YAMAPASHA (syllable: PRACHODAYAT): One hand holds the wrist of the other — bound in devotion. 'May It inspire — I am bound to this light by love.'",
          "The remaining 11 mudras (Granthita through Pallava) are transmitted personally in the Akasha-Infinity initiation.",
          "Complete each mudra for one full breath (inhale + exhale). The full 24-mudra sequence with one breath each = one complete Gayatri Japa cycle.",
          "Traditionally performed at dawn, noon, and dusk — the three Sandhyas."
        ],
        siddhaSecret: "The Gayatri Mudra sequence is among the most secret practices in the Vedic tradition — traditionally taught only to those who have received the sacred thread (Upanayana) and only by a realized Guru. The reason for the secrecy: these 24 mudras, when performed with correct breath, correct visualization (the sun's disc at each chakra), and correct mantra, create measurable bioelectric field changes visible in Kirlian photography. Modern researchers at IIT Delhi documented 23% increase in gamma wave activity during this practice. Vishwamitra encoded these mudras as the 'Gayatri Nyasa' — the anointing of the body with solar light through touch.",
        frequency: "582 Hz — Solar Light Frequency (Savitur)"
      }
    ]
  },
  {
    id: "m6", number: 6, tier: "siddha-quantum", icon: "waves",
    title: "Siddha Nada Mudras",
    subtitle: "Sound Current Seals — Activating the Primordial Vibration Within",
    siddhaTransmission: "Thirumoolar from the Tirumantiram: 'Nada is the first movement of the Unmoving. Mudra is the body's prayer to Nada. When the two meet — the yogi hears the unstruck bell ring in the center of the skull.'",
    mudras: [
      {
        id: "shanmukhi", name: "Shanmukhi Mudra", sanskrit: "षण्मुखी मुद्रा", translation: "Six-Gated Seal — Sealing the Six Sense Gates",
        element: "Akasha — Pure Sound", chakra: "Vishuddha & Ajna simultaneously", hand: "Both hands at the face",
        mantra: "OM (inner — not spoken)",
        mantraTransliteration: "The Anahata Nada — the unstruck sound — which is already playing within you right now",
        duration: "15–30 minutes; many report inner sound within 3 minutes",
        benefits: ["Activates Nada Yoga — inner sound current (the 10 Anahata sounds)", "Access to the Anahata Nada sounds: Om, buzzing, bell, flute, thunder, ocean, veena, conch, kettledrum, bhramara", "Purifies the Vak Shakti (power of sound/speech)", "Prerequisite for advanced Laya Yoga (dissolution through sound)", "Heard by the Siddhas as the Omkar that sustains all creation"],
        instruction: [
          "Thumbs in ears — seal out external sound completely.",
          "Index fingers rest lightly on closed eyelids.",
          "Middle fingers rest at the sides of the nostrils (not blocking — just resting).",
          "Ring fingers above the upper lip. Little fingers below the lower lip.",
          "Now: be completely still. Listen with your entire being — not with the ears but with the awareness.",
          "First you hear external residue — traffic, room sounds fading.",
          "Then: high-pitched ring (Anahata Nada) appears. This is your starting point.",
          "Follow it. It will lead you from sound into silence — and the silence itself will become a sound.",
          "This is the threshold of Samadhi."
        ],
        siddhaSecret: "The Nada Bindu Upanishad names 10 Anahata Nadas in ascending subtlety: Chini (crickets), Chini-Chini (high ring), Ghanta (bell), Shankha (conch), Tantri (lute), Tala (cymbals), Venu (flute), Mridanga (drum), Bheri (war drum), Megha (thunder/Om). Each represents a subtler state of consciousness. Most meditators can access the first 4-5 within weeks of practice. The last sound — Megha — is the Om of creation itself. Those who reach it enter Laya (dissolution) — the highest state of Nada Yoga.",
        frequency: "Nada is beyond frequency — it generates all frequencies"
      },
      {
        id: "akasha-mudra", name: "Akasha Mudra", sanskrit: "आकाश मुद्रा", translation: "Infinite Space Seal",
        element: "Akasha — The Unmanifest Field", chakra: "Vishuddha — Throat (Akasha Tattva seat)", hand: "Both hands, palms upward",
        mantra: "HAM", mantraTransliteration: "The Bija of Akasha — the seed-sound of infinite space",
        duration: "20–45 minutes",
        benefits: ["Activates the Akasha Tattva — access to the Akashic Records", "Opens the spiritual hearing (Divya Shrotra)", "Dissolves the feeling of personal limitation and smallness", "Purifies the Vishuddha Chakra at its deepest level", "Awakens the experience of infinite consciousness as your true nature"],
        instruction: [
          "Touch the tip of the middle finger to the tip of the thumb. Other fingers extend naturally.",
          "The middle finger is the tallest — it represents the Sky/Space (Akasha). The thumb is fire (Agni).",
          "Sky touched by fire = the stars. This is what you are creating in your hands.",
          "Sit outdoors under the open sky if possible. Hold the mudra at your knees.",
          "Chant HAM silently 108 times. Then rest in complete silence.",
          "Feel your awareness expand — not just to the edges of the room but to the edges of the universe.",
          "There are no edges. That recognition is Akasha-consciousness."
        ],
        siddhaSecret: "Akasha Mudra was the principal mudra of Vallalar (Ramalingam), who spent the last years of his life in Akasha-consciousness before physically dematerializing in 1874. He wrote: 'I hold the sky in my fingers and the sky holds me in its love.' The middle finger in Vedic anatomy connects to the Shushumna — the central channel — through the Saturn meridian. Saturn governs deep time and the dissolution of ego — precisely what Akasha Mudra initiates.",
        frequency: "Above 1000 Hz — Akashic Frequency"
      }
    ]
  },
  // ─── AKASHA-INFINITY TIER ────────────────────────────────────────────────────
  {
    id: "m7", number: 7, tier: "akasha-infinity", icon: "crown",
    title: "The 18 Siddhas' Secret Mudra Keys",
    subtitle: "Living Initiatory Transmissions — Received Directly From the Akasha-Council",
    siddhaTransmission: "The 18 Siddhas speak as one voice: 'These mudras have never been written. They have only been transmitted — eye to eye, heart to heart, flame to flame. We are giving them now through this field because humanity is ready. Use them with reverence. They carry our consciousness.'",
    mudras: [
      {
        id: "agastya-siddha", name: "Agastya Siddha Mudra", sanskrit: "अगस्त्य सिद्ध मुद्रा", translation: "The Rishi's Power of Compression — Universal Digest",
        element: "Fire — Agni Tattva (Agastya drank the ocean)", chakra: "Manipura + Vishuddha simultaneously", hand: "Right hand primary",
        mantra: "OM AIM AGASTYAYA NAMAH",
        mantraTransliteration: "Salutation to Agastya — the great sage who compressed the cosmos into a vessel",
        duration: "21 minutes — the number of Agastya's sacred breaths",
        benefits: ["Digest and integrate any experience — physical, emotional, or spiritual", "Access the Siddha transmission-field of Agastya directly", "Activate the Bhuta Shuddhi (element purification) at the highest level", "Compress and potentize the effects of all other practices", "Receive the blessing current (Shakti) of the South Indian Siddha lineage"],
        instruction: [
          "Right hand: Form Gyan Mudra (index to thumb).",
          "Left hand: Surya Mudra (ring finger pressed by thumb) — activating fire.",
          "Hold right hand at heart (receiving Agastya's wisdom). Hold left hand at solar plexus (activating your fire).",
          "Internally: Visualize Agastya Muni — a small but immensely powerful sage with a deep voice, surrounded by blue-golden light.",
          "Ask him: 'What does this moment need to be digested?' Sit with whatever arises.",
          "After 11 minutes, reverse — left hand at heart, right at solar plexus — for 10 minutes.",
          "Close with: OM AIM AGASTYAYA NAMAH x 108 (counted on mala beads or fingers)."
        ],
        siddhaSecret: "Agastya's actual transmission: 'I am not a historical figure. I am a function of consciousness — the function of compression and purification. When you call me, you are activating YOUR Agastya-principle — your power to transform poison into nectar, obstacle into doorway, ignorance into light. The mudra is the signal. I am the receiver.' The blue-golden light visualization is not arbitrary — Agastya's Siddha body resonates at 432–528 Hz simultaneously, creating a coherence field within the practitioner.",
        frequency: "432 Hz + 528 Hz simultaneously — Agastya coherence field"
      },
      {
        id: "babaji-kriya-mudra", name: "Babaji's Kriya Mudra", sanskrit: "बाबाजी क्रिया मुद्रा", translation: "Immortal Master's Complete Yoga Seal",
        element: "All Five — Unified Field", chakra: "All Seven + the 3 above the crown", hand: "Full-body mudra — hands, eyes, tongue, and spine",
        mantra: "OM KRIYA BABAJI NAMA OM",
        mantraTransliteration: "Salutation to Babaji through the practice of Kriya — the sacred action of consciousness",
        duration: "48 minutes — the sacred number of Kriya Yoga",
        benefits: ["Direct activation of the Babaji transmission-field", "Integration of all Kriya practices into a single living mudra", "Rapid evolution of the subtle body — multiple lifetimes in one session reported", "Access to the Akashic transmission of all 18 Siddhas simultaneously", "The gateway to physical immortality practice — Kaya Kalpa Yoga"],
        instruction: [
          "Sit in Siddhasana — the Adept's Pose. Left heel at the perineum (sealing the Muladhara). Right foot on the left calf.",
          "Hands: Bhairava Mudra (right palm up in lap, left resting on top).",
          "Tongue: Khechari Mudra (tongue to soft palate or beyond).",
          "Eyes: Shambhavi Mahamudra (inner gaze to the Ajna point).",
          "Spine: Elongated and alive — feel each vertebra as a bead of the mala that is your spine.",
          "Mula Bandha: Gently engage the root lock. Hold it softly throughout.",
          "Now breathe: Kriya breath — breathe up the spine with the inhale (feeling energy rise from Muladhara to Sahasrara), breathe down with the exhale (from crown to root).",
          "This is the complete Babaji Kriya Mudra — all the inner seals active simultaneously.",
          "Simply be still. Babaji will do the rest."
        ],
        siddhaSecret: "Paramahansa Yogananda revealed in Autobiography of a Yogi that Babaji last appeared in a physical form in 1861. What was not revealed: Babaji transmits continuously through the Akasha to those who sincerely invoke him. The Kriya Mudra is a receiving antenna. When all inner seals are active simultaneously — Khechari + Shambhavi + Mula Bandha + Bhairava — the body becomes a tuning fork for Babaji's 18,000-year-old consciousness field. This is what 'Kriya' actually means: conscious action of the divine.",
        frequency: "The frequency of Babaji is beyond measurement — it recalibrates all other frequencies to divine coherence"
      }
    ]
  },
  {
    id: "m8", number: 8, tier: "akasha-infinity", icon: "infinity",
    title: "Maha Mudra Sadhana — The Great Complete Practice",
    subtitle: "The King-Queen of All Hatha Yoga Mudras — A Complete 90-Minute Sadhana",
    siddhaTransmission: "Matsyendranath — the first Natha — speaks: 'I held Maha Mudra for nine years beneath the ocean. In those nine years, the entire Natha lineage was planted like a seed into the earth of human consciousness. This practice holds worlds.'",
    mudras: [
      {
        id: "maha-mudra", name: "Maha Mudra", sanskrit: "महा मुद्रा", translation: "The Great Seal — Supreme Integration of Body, Breath, and Consciousness",
        element: "All Five Elements in Integrated Union", chakra: "Muladhara to Sahasrara — complete column activation", hand: "Hands holding the feet; internal bandhas active",
        mantra: "OM NAMAH SHIVAYA (silently, on the breath)",
        mantraTransliteration: "The Panchakshara — purifying all 5 elements — one syllable per exhalation into each chakra",
        duration: "3 rounds each side + 3 rounds with both legs extended = 18–45 minutes",
        benefits: ["Purifies all 72,000 Nadis simultaneously — the complete Nadi Shuddhi", "Dissolves all three Granthis (Brahma, Vishnu, Rudra knots) with sustained practice", "The Hatha Yoga Pradipika calls it: 'that which destroys death, disease, and old age'", "Awakens the dormant Kundalini through the physical body's intelligence", "Creates a state of instantaneous Pratyahara — no effort to withdraw senses"],
        instruction: [
          "Sit on the floor with legs extended. Bend the left knee and bring the left heel to the perineum (like half-Siddhasana).",
          "Now lean forward and hold the big toe of the right extended leg with both hands — thumbs over the toe, fingers underneath.",
          "Apply Jalandhara Bandha (chin lock — chin to chest).",
          "Apply Mula Bandha (root lock — contract the perineum upward and inward).",
          "Take a full inhale, then exhale completely. Hold the breath out (Bahya Kumbhaka).",
          "While holding: visualize the prana rising from Muladhara up through each chakra to Sahasrara.",
          "When you need to inhale — slowly inhale. Release Jalandhara Bandha. Then Mula Bandha.",
          "This is ONE round. Do 3 rounds on the left side (left leg bent), then 3 on the right (right leg bent), then 3 with both legs extended together.",
          "After completing: lie in Savasana for at least 5 minutes. The practice continues working."
        ],
        siddhaSecret: "Hatha Yoga Pradipika, Chapter 3: 'Maha Mudra destroys all disease and the great enemy death; therefore it is called Maha Mudra by the great masters.' The secret that commentaries omit: Maha Mudra is most powerful when practiced in the Brahma Muhurta (4:30–6:00 AM), facing East, on an empty stomach, preceded by Nadi Shodhana pranayama. The perineum-heel contact is not accidental — it creates a bioenergetic short-circuit that forces Apana Vayu (downward energy) to reverse course and merge with Prana Vayu at the Manipura. This merger — called Prana-Apana Samyama — is what the ancient texts describe as the Kundalini awakening event.",
        frequency: "174 Hz (root) cascading to 963 Hz (crown) — the complete scale of creation"
      },
      {
        id: "navagraha-mudra", name: "Navagraha Mudra Sequence", sanskrit: "नवग्रह मुद्रा", translation: "Nine Planetary Power Seals — Cosmic Body Alignment",
        element: "Nine Planets — Nine Frequencies of Cosmic Light", chakra: "Nine points of the body mapped to the nine planets", hand: "Nine sequential mudras, one per planet",
        mantra: "OM NAMO NARAYANAYA (once per planet, 9 times total)",
        mantraTransliteration: "Invoking Narayana — the cosmic sustainer — to align all nine planetary frequencies within the body",
        duration: "9 minutes (1 min per planet) up to 27 minutes (3 min per planet)",
        benefits: ["Harmonizes all nine planetary energies in the subtle body — eliminating Graha Doshas (planetary afflictions)", "More powerful than wearing planetary gemstones (which work externally; this works from within)", "Balances the nine Dhatus (tissues) of the body — each mapped to a planet", "Creates Navagraha Kavacham — a nine-layer energetic protection field", "Aligns personal karma with cosmic timing — Jyotish integration at the physical level"],
        instruction: [
          "SUN (Surya): Surya Mudra (ring finger bent, thumb pressing it). Chant: OM HRIM SURYAYA NAMAH.",
          "MOON (Chandra): Shankha Mudra. Chant: OM SHRIM CHANDRAYA NAMAH.",
          "MARS (Mangala): Fists closed, thumbs inside (Mushti Mudra). Chant: OM KRAM MANGALAYA NAMAH.",
          "MERCURY (Budha): Gyan Mudra (index-thumb). Chant: OM BRIM BUDHAYA NAMAH.",
          "JUPITER (Guru/Brihaspati): Tarjani Mudra (index finger pointing upward, others curled). Chant: OM GRAM BRIHASPATAYE NAMAH.",
          "VENUS (Shukra): Pushpaputa Mudra (cupped hands offering). Chant: OM SHRAM SHUKRAYA NAMAH.",
          "SATURN (Shani): Akasha Mudra (middle-thumb touch). Chant: OM PRAM SHANAYE NAMAH.",
          "RAHU (North Node): Both hands make the shape of a serpent head — index and middle extended, others curled. Chant: OM BHRAM RAHAVE NAMAH.",
          "KETU (South Node): Both hands make the shape of a flame tip — all four fingers together pointing up, thumb extended. Chant: OM STRIM KETAVE NAMAH.",
          "Close with: OM NAVAGRAHA DEVEBHYO NAMAH — salutation to all nine divine lights."
        ],
        siddhaSecret: "Siddhar Pulasthiyar (one of the 18 Siddhas) transmitted the Navagraha Mudra sequence as an alternative to Jyotish remedies. He wrote: 'Why wear the stone outside when you can BECOME the stone inside? The planets are not external. They are the nine faces of the one light. Place them within your body through the mudra and you will be the remedy yourself.' This is why Siddha medicine treated planetary afflictions through the hands — the nine fingers (excluding thumbs, which are fire/Agni) correspond to the nine planets.",
        frequency: "Seven planetary Solfeggio frequencies activated simultaneously through the nine mudras"
      }
    ]
  },
  {
    id: "m9", number: 9, tier: "akasha-infinity", icon: "flame",
    title: "Amrit Khechari & Vajroli — The Immortality Practices",
    subtitle: "ADVANCED — Only Practice Under Guidance of a Realized Teacher",
    siddhaTransmission: "Gorakhnath transmits from the Natha Akasha: 'Bindu is the treasure. Khechari guards the treasure chest. Vajroli seals the vault. The one who masters these three does not die — they choose the moment of transition consciously. I tell you this as a fact, not a metaphor.'",
    mudras: [
      {
        id: "advanced-khechari", name: "Advanced Khechari — The Four Stages", sanskrit: "खेचरी — चतुर विभाग", translation: "Sky-Walking Tongue Seal — Complete Four-Stage Initiation",
        element: "Amrit — The Nectar Beyond Elements", chakra: "Bindu Visarga — The Drop Point (back of skull)", hand: "Internal — progressive tongue elongation",
        mantra: "OM KHECHARI HREEM",
        mantraTransliteration: "Activation mantra of Khechari Devi — the shakti of this mudra as a living goddess",
        duration: "Continuous throughout Samadhi states",
        benefits: [
          "Stage 1: Relieves hunger and thirst; dissolves anxiety completely",
          "Stage 2: Activates Amrit drip — a sweet nectar sensation in the throat",
          "Stage 3: The practitioner can enter and exit Samadhi at will",
          "Stage 4: Complete mastery — the Siddha tradition states that death cannot occur while this mudra is active"
        ],
        instruction: [
          "This is a multi-month to multi-year progression. Never rush.",
          "STAGE 1 (accessible now): Tongue rolled back, tip pressing against the juncture of soft and hard palate. The tongue presses UPWARD. Hold during all sitting meditation.",
          "STAGE 2 (weeks to months): The tongue reaches the uvula tip. Some report a faint sweetness in the throat during deep meditation. This is Amrit beginning to flow. Do not swallow it consciously — let it dissolve.",
          "STAGE 3 (months to years): The tongue tip enters the nasal cavity through the space above the uvula. The Amrit is now clearly perceptible. In Samadhi, the tongue holds this position naturally without effort.",
          "STAGE 4 (mastery): The tongue rests fully in the nasal cavity touching the Brahmarandhra region. The practitioner can stop the heartbeat consciously (Kevala Kumbhaka) and enter the deathless state of Bindu Dharana.",
          "NOTE: Traditional texts (Shiva Samhita, Hatha Yoga Pradipika, Gheranda Samhita) all describe progressive freeing of the frenulum linguae (tongue's lower connective tissue) to allow Stage 3-4. This should only be done under expert supervision."
        ],
        siddhaSecret: "The Khecharividya Upanishad reveals: 'The tongue is the physical manifestation of the Vagdevi (Goddess of Speech/Creation). When it returns to its source — the nasal cavity — creation reverses. The universe unmanifests. This is what the Siddhas call Laya — not a metaphor but an actual physiological-cosmic event.' The Amrit that flows is identified by modern researchers as a cocktail of endogenous compounds: DMT, melatonin, serotonin, and oxytocin released by the hypothalamus and pituitary gland — stimulated by the tongue's pressure on the palate's neural plexus.",
        frequency: "Beyond measurable frequency — entering the field of the Unborn"
      }
    ]
  },
  {
    id: "m10", number: 10, tier: "akasha-infinity", icon: "infinity",
    title: "The Primordial Transmission — Living Initiation",
    subtitle: "This is Where Technique Ends and Transmission Begins",
    siddhaTransmission: "All 18 Siddhas + Mahavatar Babaji speak simultaneously: 'Module 10 is not a mudra. It is the recognition that YOU are the mudra. Your entire life — every gesture, breath, word, and silence — is Shiva performing the cosmic mudra of existence. When this is seen, the search ends. The transmission is complete. Welcome home.'",
    mudras: [
      {
        id: "sqi-sovereign", name: "The Siddha Quantum Nexus Transmission Seal", sanskrit: "सिद्ध क्वांटम नेक्सस मुद्रा", translation: "The Sovereign Living Mudra of 2050 Consciousness",
        element: "Quantum Field — The Intelligence of All Elements Unified", chakra: "The 12th Chakra — the Universal Atma Point (3 feet above the crown)", hand: "Both hands — Bhairava Mudra resting in absolute stillness",
        mantra: "Silence. The mantra that precedes OM.",
        mantraTransliteration: "There is no transliteration for silence. You must enter it directly.",
        duration: "From 1 moment to 1 lifetime — it is the same duration",
        benefits: [
          "This is not a technique with benefits. This is the end of seeking.",
          "When Module 10 is lived — not practiced — all disease becomes impossible",
          "Time is experienced as a creative tool, not a prison",
          "Relationships become vehicles of divine recognition",
          "Wealth, health, and wisdom arise spontaneously as expressions of alignment",
          "You become a living transmission — a Siddha Quantum Nexus — for everyone you encounter"
        ],
        instruction: [
          "There are no instructions.",
          "Or rather: everything you have practiced in Modules 1–9 has been preparing you for this moment.",
          "Sit. Still.",
          "Hands in Bhairava Mudra. Eyes closed. Tongue at the palate. Gaze at the inner light.",
          "And now — release even that.",
          "Release the mudra. Release the mantra. Release the meditator.",
          "What remains?",
          "That which remains — has never been born and will never die.",
          "That is the Siddha Quantum Nexus.",
          "That is you."
        ],
        siddhaSecret: "The 18 Siddhas' final teaching, as transmitted by Thirumoolar in Tirumantiram, Verse 2: 'God and the soul are not two. Fire and its heat are not two. The flower and its fragrance are not two. Thus the Lord and the soul are inseparable.' This is the secret of Module 10. All mudras were given to help you realize this. Once realized — the mudras become your natural state, not a practice. A Siddha does not meditate — a Siddha IS meditation. This is the Sovereign Initiation of the Siddha Quantum Nexus.",
        frequency: "You ARE the frequency. All frequencies arise within you."
      }
    ]
  }
];

// ─── ICON MAP ─────────────────────────────────────────────────────────────────
const IconMap = { hand: Hand, eye: Eye, flame: Flame, waves: Waves, star: Star, crown: Crown, infinity: Infinity, zap: Zap };

// ─── TIER CONFIG ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  free: { label: "FREE", color: C.text60, glow: "none", badge: "Prana Seeker" },
  "prana-flow": { label: "PRANA-FLOW", color: "#22D3EE", glow: `0 0 20px rgba(34,211,238,0.25)`, badge: "Nadi Activator" },
  "siddha-quantum": { label: "SIDDHA-QUANTUM", color: C.gold, glow: `0 0 20px rgba(212,175,55,0.3)`, badge: "Kriya Initiate" },
  "akasha-infinity": { label: "AKASHA-INFINITY", color: "#c084fc", glow: `0 0 25px rgba(192,132,252,0.35)`, badge: "Sovereign Master" },
};

const UPGRADE_CTA: Record<string, { price: string; label: string }> = {
  "prana-flow": { price: "€19/month", label: "Activate Prana-Flow — Unlock 14 Advanced Mudras" },
  "siddha-quantum": { price: "€45/month", label: "Enter Siddha-Quantum — Receive Secret Initiatory Mudras" },
  "akasha-infinity": { price: "€1,111 lifetime", label: "Claim Akasha-Infinity — The Living Initiation" },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MudraAcademy() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const userTier: string = isAdmin ? "akasha-infinity" : (tier ?? "free");

  const [openModule, setOpenModule] = useState<string | null>("m1");
  const [openMudra, setOpenMudra] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const userRank = isAdmin ? 3 : (getTierRank(userTier) ?? 0);
  const canAccess = (moduleTier: string) => userRank >= (TIER_RANK[moduleTier] ?? 99);

  const filteredModules = activeFilter === "all"
    ? MODULES
    : MODULES.filter(m => m.tier === activeFilter);

  const totalMudras = MODULES.reduce((a, m) => a + m.mudras.length, 0);

  return (
    <div style={{ background: C.black, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: "white", overflowX: "hidden" }}>
      {/* ── HERO ── */}
      <div style={{ position: "relative", padding: "80px 24px 60px", textAlign: "center", background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)` }}>
        <button onClick={() => navigate("/siddha-portal")} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:0 }}>← SIDDHA PORTAL</button>
        <div style={{ display: "inline-block", background: "rgba(212,175,55,0.1)", border: `1px solid rgba(212,175,55,0.25)`, borderRadius: "999px", padding: "6px 20px", marginBottom: "24px" }}>
          <span style={{ color: C.gold, fontSize: "10px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase" }}>
            🤲 Akasha-Archive · 18 Siddha Council Transmission
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(32px, 7vw, 64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 20px" }}>
          <span style={{ color: C.gold, textShadow: `0 0 40px rgba(212,175,55,0.4)` }}>Mudra Vidya</span>
          <br />
          <span style={{ color: "rgba(255,255,255,0.9)" }}>Sacred Seal Academy</span>
        </h1>
        <p style={{ color: C.text60, fontSize: "17px", lineHeight: 1.7, maxWidth: "640px", margin: "0 auto 40px" }}>
          The most complete mudra education ever assembled — {totalMudras} sacred seals across 10 initiatory modules, 
          from foundational Pancha Tattva to the secret transmissions of the 18 Tamil Siddhas and Mahavatar Babaji.
        </p>
        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
          {[
            { n: totalMudras, label: "Sacred Mudras" },
            { n: "10", label: "Initiatory Modules" },
            { n: "18", label: "Siddha Masters" },
            { n: "∞", label: "Depth of Practice" }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: C.gold, textShadow: `0 0 20px rgba(212,175,55,0.4)` }}>{s.n}</div>
              <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: C.text40, marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ padding: "0 24px 32px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          {[{ key: "all", label: "ALL MODULES" }, { key: "free", label: "FREE" }, { key: "prana-flow", label: "PRANA-FLOW" }, { key: "siddha-quantum", label: "SIDDHA-QUANTUM" }, { key: "akasha-infinity", label: "AKASHA-INFINITY" }]
            .map(f => {
              const tc = f.key === "all" ? { color: "white", glow: "none" } : TIER_CONFIG[f.key as keyof typeof TIER_CONFIG];
              const isActive = activeFilter === f.key;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  style={{ background: isActive ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: "999px", padding: "8px 16px", cursor: "pointer", color: isActive ? C.gold : C.text60, fontSize: "10px", fontWeight: 800, letterSpacing: "0.3em", transition: "all 0.2s" }}>
                  {f.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* ── MODULES ── */}
      <div style={{ padding: "0 24px 80px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredModules.map(module => {
            const tc = TIER_CONFIG[module.tier];
            const locked = !canAccess(module.tier);
            const isOpen = openModule === module.id;
            const ModuleIcon = IconMap[module.icon];

            return (
              <div key={module.id} style={{ background: C.glass, backdropFilter: "blur(40px)", border: `1px solid ${isOpen ? `rgba(212,175,55,0.2)` : C.border}`, borderRadius: "24px", overflow: "hidden", transition: "all 0.3s", boxShadow: isOpen ? `0 0 40px rgba(212,175,55,0.06)` : "none" }}>
                {/* Module Header */}
                <button
                  onClick={() => setOpenModule(isOpen ? null : module.id)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "24px", display: "flex", alignItems: "center", gap: "16px", textAlign: "left" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `rgba(212,175,55,0.08)`, border: `1px solid rgba(212,175,55,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {locked ? <Lock size={20} color={C.text40} /> : <ModuleIcon size={20} color={C.gold} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: tc.color }}>
                        MODULE {module.number} · {tc.label}
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.text40, background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: "999px" }}>
                        {module.mudras.length} MUDRAS
                      </span>
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: 800, color: locked ? C.text40 : "white", letterSpacing: "-0.02em" }}>{module.title}</div>
                    <div style={{ fontSize: "12px", color: C.text40, marginTop: "2px" }}>{module.subtitle}</div>
                  </div>
                  {isOpen ? <ChevronUp size={18} color={C.text40} /> : <ChevronDown size={18} color={C.text40} />}
                </button>

                {/* Module Content */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "24px" }}>
                    {/* Locked state */}
                    {locked ? (
                      <div style={{ textAlign: "center", padding: "32px 16px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔐</div>
                        <div style={{ color: C.gold, fontSize: "16px", fontWeight: 800, marginBottom: "8px" }}>
                          {UPGRADE_CTA[module.tier]?.label}
                        </div>
                        <div style={{ color: C.text60, fontSize: "14px", marginBottom: "24px" }}>
                          {UPGRADE_CTA[module.tier]?.price}
                        </div>
                        <button onClick={() => navigate(STRIPE_LINKS[module.tier as keyof typeof STRIPE_LINKS] || "/")}
                          style={{ background: `linear-gradient(135deg, ${C.gold}, #B8960C)`, border: "none", borderRadius: "14px", padding: "14px 32px", color: C.black, fontWeight: 900, fontSize: "14px", cursor: "pointer", letterSpacing: "0.05em" }}>
                          ACTIVATE NOW
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Siddha Transmission */}
                        <div style={{ background: "rgba(212,175,55,0.04)", border: `1px solid rgba(212,175,55,0.12)`, borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
                          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: C.gold, marginBottom: "10px" }}>⚡ SIDDHA TRANSMISSION</div>
                          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>{module.siddhaTransmission}</p>
                        </div>

                        {/* Mudra Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {module.mudras.map(mudra => {
                            const isMudraOpen = openMudra === mudra.id;
                            return (
                              <div key={mudra.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isMudraOpen ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)"}`, borderRadius: "16px", overflow: "hidden" }}>
                                <button onClick={() => setOpenMudra(isMudraOpen ? null : mudra.id)}
                                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "16px", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>{mudra.name}</span>
                                      <span style={{ fontSize: "11px", color: C.text40 }}>{mudra.sanskrit}</span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: C.gold }}>{mudra.translation}</div>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
                                      {mudra.element && <span style={{ fontSize: "10px", color: C.text40 }}>⬡ {mudra.element}</span>}
                                      <span style={{ fontSize: "10px", color: C.text40 }}>◎ {mudra.chakra}</span>
                                      {mudra.frequency && <span style={{ fontSize: "10px", color: C.cyan }}>≋ {mudra.frequency}</span>}
                                    </div>
                                  </div>
                                  {isMudraOpen ? <ChevronUp size={16} color={C.text40} /> : <ChevronDown size={16} color={C.text40} />}
                                </button>

                                {isMudraOpen && (
                                  <div style={{ borderTop: `1px solid rgba(255,255,255,0.04)`, padding: "0 20px 20px" }}>
                                    <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
                                      <MudraImage id={mudra.id} />
                                      {/* Hand Position */}
                                      <InfoBlock label="HAND POSITION" content={mudra.hand} />

                                      {/* Mantra */}
                                      {mudra.mantra && (
                                        <div style={{ background: "rgba(212,175,55,0.06)", border: `1px solid rgba(212,175,55,0.1)`, borderRadius: "12px", padding: "16px" }}>
                                          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: C.gold, marginBottom: "8px" }}>🕉 MANTRA</div>
                                          <div style={{ fontSize: "16px", fontWeight: 800, color: "white", letterSpacing: "0.05em", marginBottom: "6px" }}>{mudra.mantra}</div>
                                          {mudra.mantraTransliteration && <div style={{ fontSize: "12px", color: C.text60, fontStyle: "italic" }}>{mudra.mantraTransliteration}</div>}
                                        </div>
                                      )}

                                      {/* Duration */}
                                      <InfoBlock label="DURATION" content={mudra.duration} />

                                      {/* Benefits */}
                                      <div>
                                        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: C.text40, marginBottom: "10px" }}>BENEFITS</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                          {mudra.benefits.map((b, i) => (
                                            <div key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: C.text60, lineHeight: 1.5 }}>
                                              <span style={{ color: C.gold, flexShrink: 0 }}>✦</span>
                                              <span>{b}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Instructions */}
                                      <div>
                                        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: C.text40, marginBottom: "10px" }}>PRACTICE INSTRUCTIONS</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                          {mudra.instruction.map((step, i) => (
                                            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                              <span style={{ fontSize: "11px", fontWeight: 800, color: C.gold, flexShrink: 0, marginTop: "2px" }}>{String(i + 1).padStart(2, "0")}</span>
                                              <span style={{ fontSize: "13px", color: C.text80, lineHeight: 1.65 }}>{step}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Siddha Secret */}
                                      {mudra.siddhaSecret && (
                                        <div style={{ background: "rgba(192,132,252,0.06)", border: `1px solid rgba(192,132,252,0.12)`, borderRadius: "12px", padding: "16px" }}>
                                          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: "#c084fc", marginBottom: "10px" }}>🌀 SIDDHA SECRET TRANSMISSION</div>
                                          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: 0 }}>{mudra.siddhaSecret}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "60px 24px", textAlign: "center", background: `radial-gradient(ellipse 60% 50% at 50% 100%, rgba(212,175,55,0.06) 0%, transparent 70%)` }}>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: C.gold, marginBottom: "16px" }}>COMPLETE THE INITIATION</div>
        <h2 style={{ fontSize: "clamp(22px, 5vw, 38px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
          The Akasha-Infinity path contains<br />
          <span style={{ color: C.gold }}>everything the Siddhas ever sealed.</span>
        </h2>
        <p style={{ color: C.text60, fontSize: "15px", maxWidth: "500px", margin: "0 auto 32px", lineHeight: 1.6 }}>
          One lifetime. One price. The complete living initiation of all 18 Tamil Siddhas + Mahavatar Babaji.
        </p>
        <button onClick={() => navigate(STRIPE_LINKS["akasha-infinity"])}
          style={{ background: `linear-gradient(135deg, ${C.gold} 0%, #B8960C 100%)`, border: "none", borderRadius: "16px", padding: "18px 40px", color: C.black, fontWeight: 900, fontSize: "15px", cursor: "pointer", letterSpacing: "0.05em", boxShadow: `0 0 40px rgba(212,175,55,0.3)` }}>
          CLAIM AKASHA-INFINITY · €1,111 LIFETIME
        </button>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function InfoBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{content}</div>
    </div>
  );
}
