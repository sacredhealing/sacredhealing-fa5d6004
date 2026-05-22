import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tier = "free" | "prana_flow" | "siddha_quantum" | "akasha_infinity";

interface UserProfile {
  id: string;
  membership_tier: Tier | null;
  full_name: string | null;
}

// ─── Tier Access Matrix ───────────────────────────────────────────────────────
const TIER_RANK: Record<string, number> = {
  free: 0,
  prana_flow: 1, "prana-flow": 1,
  siddha_quantum: 2, "siddha-quantum": 2,
  akasha_infinity: 3, "akasha-infinity": 3,
};

function hasAccess(userTier: string | null, requiredTier: string): boolean {
  const userRank = TIER_RANK[userTier ?? "free"] ?? 0;
  const requiredRank = TIER_RANK[requiredTier] ?? 0;
  return userRank >= requiredRank;
}

// ─── Course Data ──────────────────────────────────────────────────────────────
const NINE_SEALS = [
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

const ADVANCED_MODULES = [
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

const SECRET_MANTRAS = [
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    free: { label: "FREE", color: "#FFFFFF", bg: "rgba(255,255,255,0.1)" },
    prana_flow: { label: "PRANA FLOW", color: "#22D3EE", bg: "rgba(34,211,238,0.12)" },
    siddha_quantum: { label: "SIDDHA QUANTUM", color: "#9B59B6", bg: "rgba(155,89,182,0.15)" },
    akasha_infinity: { label: "AKASHA ∞", color: "#D4AF37", bg: "rgba(212,175,55,0.15)" },
  };
  const c = config[tier] ?? config.free;
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.color}30`,
        padding: "2px 10px",
        borderRadius: "20px",
        fontSize: "8px",
        fontWeight: 800,
        letterSpacing: "0.5em",
        textTransform: "uppercase",
      }}
    >
      {c.label}
    </span>
  );
}

function LockOverlay({ tier }: { tier: string }) {
  const navigate = useNavigate();
  const labels: Record<string, string> = {
    prana_flow: "Prana Flow",
    siddha_quantum: "Siddha Quantum",
    akasha_infinity: "Akasha Infinity",
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "24px",
        background: "rgba(5,5,5,0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: "32px" }}>🦁</div>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", textAlign: "center", padding: "0 20px" }}>
        This Seal requires <strong style={{ color: "#D4AF37" }}>{labels[tier] ?? tier}</strong> initiation
      </p>
      <button
        onClick={() => navigate("/membership")}
        style={{
          background: "linear-gradient(135deg, #D4AF37, #B8941F)",
          border: "none",
          borderRadius: "20px",
          padding: "10px 24px",
          color: "#050505",
          fontWeight: 800,
          fontSize: "11px",
          letterSpacing: "0.15em",
          cursor: "pointer",
        }}
      >
        UNLOCK NOW
      </button>
    </div>
  );
}

function ModuleCard({
  module,
  userTier,
  index,
}: {
  module: (typeof NINE_SEALS)[0];
  userTier: string | null;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const accessible = hasAccess(userTier, module.requiredTier);

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        border: `1px solid ${accessible ? module.color + "30" : "rgba(255,255,255,0.05)"}`,
        borderRadius: "24px",
        overflow: "hidden",
        transition: "border-color 0.3s, box-shadow 0.3s",
        boxShadow: accessible ? `0 0 30px ${module.color}10` : "none",
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: "3px", background: accessible ? `linear-gradient(90deg, ${module.color}80, transparent)` : "rgba(255,255,255,0.05)" }} />

      <div style={{ padding: "24px" }}>
        {/* Header Row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          {/* Seal Number */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: accessible ? `${module.color}15` : "rgba(255,255,255,0.04)",
              border: `1px solid ${accessible ? module.color + "40" : "rgba(255,255,255,0.08)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: accessible ? module.color : "rgba(255,255,255,0.3)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.2em" }}>
              SEAL
            </span>
            <span style={{ color: accessible ? module.color : "rgba(255,255,255,0.2)", fontSize: "20px", fontWeight: 900 }}>{module.id}</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
              <TierBadge tier={module.requiredTier} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{module.duration}</span>
            </div>
            <h3
              style={{
                color: accessible ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                fontSize: "17px",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "4px 0 2px",
              }}
            >
              {module.form}
            </h3>
            <p style={{ color: accessible ? module.color : "rgba(255,255,255,0.25)", fontSize: "10px", fontWeight: 600, margin: 0 }}>
              {module.sanskrit}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                background: accessible ? `${module.color}20` : "rgba(255,255,255,0.05)",
                border: `1px solid ${accessible ? module.color + "40" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "10px",
                padding: "6px 12px",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em", margin: "0 0 2px" }}>BIJA</p>
              <p style={{ color: accessible ? module.color : "rgba(255,255,255,0.2)", fontSize: "13px", fontWeight: 900, margin: 0 }}>
                {module.bija}
              </p>
            </div>
          </div>
        </div>

        {/* Focus & Chakra */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "10px",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            ⚡ {module.focus}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "10px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            ◎ {module.chakra}
          </span>
        </div>

        {/* Montrose Connection */}
        <div
          style={{
            background: accessible ? `${module.color}08` : "rgba(255,255,255,0.02)",
            border: `1px solid ${accessible ? module.color + "20" : "rgba(255,255,255,0.04)"}`,
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "14px",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 4px" }}>
            SIDDHA MONTROSE TRANSMISSION
          </p>
          <p style={{ color: accessible ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
            {module.montrose}
          </p>
        </div>

        {/* Description */}
        <p style={{ color: accessible ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)", fontSize: "13px", lineHeight: 1.7, margin: "0 0 14px" }}>
          {module.description}
        </p>

        {/* Expand Button */}
        {accessible && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${module.color}30`,
              borderRadius: "12px",
              padding: "10px",
              color: module.color,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {expanded ? "▲ CLOSE TRANSMISSION" : "▼ OPEN FULL SEAL"}
          </button>
        )}

        {/* Expanded Content */}
        {expanded && accessible && (
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Practices */}
            <div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 10px" }}>
                SACRED PRACTICES
              </p>
              {module.practices.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: module.color, fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>◆</span>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>{p}</p>
                </div>
              ))}
            </div>

            {/* Mantra */}
            <div
              style={{
                background: `${module.color}10`,
                border: `1px solid ${module.color}30`,
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 8px" }}>
                MANTRA TRANSMISSION
              </p>
              <p
                style={{
                  color: module.color,
                  fontSize: "13px",
                  fontWeight: 700,
                  margin: "0 0 6px",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                {module.mantra}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0, fontStyle: "italic" }}>"{module.affirmation}"</p>
            </div>

            {/* Production Note */}
            <div
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.15)",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <p style={{ color: "rgba(34,211,238,0.7)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 6px" }}>
                🎵 PRODUCTION CODEX
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>{module.production}</p>
            </div>
          </div>
        )}
      </div>

      {!accessible && <LockOverlay tier={module.requiredTier} />}
    </div>
  );
}

function AdvancedModuleCard({
  module,
  userTier,
  index,
}: {
  module: (typeof ADVANCED_MODULES)[0];
  userTier: string | null;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const accessible = hasAccess(userTier, module.requiredTier);

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(212,175,55,0.03)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: accessible ? "0 0 40px rgba(212,175,55,0.08)" : "none",
      }}
    >
      <div style={{ height: "3px", background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D4AF37",
              fontWeight: 900,
              fontSize: "16px",
            }}
          >
            {module.id}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
              <TierBadge tier={module.requiredTier} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>{module.duration}</span>
            </div>
            <h3 style={{ color: "#D4AF37", fontSize: "16px", fontWeight: 900, letterSpacing: "-0.03em", margin: "2px 0 0" }}>{module.title}</h3>
            <p style={{ color: "rgba(212,175,55,0.6)", fontSize: "10px", fontWeight: 600, margin: 0 }}>{module.subtitle}</p>
          </div>
        </div>

        <p style={{ color: accessible ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)", fontSize: "13px", lineHeight: 1.7, margin: "0 0 14px" }}>
          {module.description}
        </p>

        {accessible && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%",
              background: "rgba(212,175,55,0.05)",
              border: "1px solid rgba(212,175,55,0.25)",
              borderRadius: "12px",
              padding: "10px",
              color: "#D4AF37",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              cursor: "pointer",
            }}
          >
            {expanded ? "▲ CLOSE" : "▼ REVEAL SECRET TRANSMISSION"}
          </button>
        )}

        {expanded && accessible && (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "14px" }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 8px" }}>
                SECRET SIDDHA MANTRA
              </p>
              <p style={{ color: "#D4AF37", fontSize: "13px", fontWeight: 700, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
                {module.secretMantra}
              </p>
            </div>
            <div style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: "12px", padding: "12px" }}>
              <p style={{ color: "rgba(34,211,238,0.7)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 6px" }}>
                TECHNIQUE
              </p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>{module.technique}</p>
            </div>
          </div>
        )}
      </div>
      {!accessible && <LockOverlay tier={module.requiredTier} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LionOfMontrose() {
  const [activeTab, setActiveTab] = useState<"seals" | "advanced" | "mantras">("seals");
  const navigate = useNavigate();
  const { toast } = useToast();
  const heroRef = useRef<HTMLDivElement>(null);
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const userTier: string =
    rank >= 3 ? "akasha_infinity" : rank >= 2 ? "siddha_quantum" : rank >= 1 ? "prana_flow" : "free";

  const completedSeals = NINE_SEALS.filter((m) => hasAccess(userTier, m.requiredTier)).length;
  const totalSeals = NINE_SEALS.length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#D4AF37", fontSize: "32px", marginBottom: "16px" }}>🦁</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.3em" }}>OPENING THE SEALS...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Back nav */}
      <button onClick={() => navigate("/siddha-portal")} style={{ position:"fixed", top:20, left:20, zIndex:100, background:"rgba(5,5,5,0.8)", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.5)", padding:"8px 12px", borderRadius:8, backdropFilter:"blur(10px)" }}>← SIDDHA PORTAL</button>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          padding: "80px 20px 60px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "30%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Course Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "30px", padding: "6px 16px", marginBottom: "24px" }}>
          <span style={{ color: "#D4AF37", fontSize: "14px" }}>🦁</span>
          <span style={{ color: "rgba(212,175,55,0.8)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em" }}>SIDDHA QUANTUM COURSE</span>
        </div>

        <h1
          style={{
            color: "#D4AF37",
            fontSize: "clamp(32px, 7vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            margin: "0 0 12px",
            textShadow: "0 0 40px rgba(212,175,55,0.3)",
          }}
        >
          The Lion of<br />Siddha Montrose
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: 500, letterSpacing: "0.2em", margin: "0 0 8px" }}>
          AWAKENING THE NINE SEALS OF NARASIMHA
        </p>

        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "15px",
            lineHeight: 1.8,
            maxWidth: "580px",
            margin: "20px auto 32px",
          }}
        >
          Siddha Montrose is not a city — it is a Siddha Loka, a dimension of perfected beings tuned to the Narasimha frequency. Nine modules. Nine forms of the Lion-God. Nine seals to crack open your sovereign blueprint.
        </p>

        {/* Progress Bar */}
        <div style={{ maxWidth: "400px", margin: "0 auto 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em" }}>SEALS ACCESSIBLE</span>
            <span style={{ color: "#D4AF37", fontSize: "9px", fontWeight: 800 }}>{completedSeals}/{totalSeals}</span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(completedSeals / totalSeals) * 100}%`,
                background: "linear-gradient(90deg, #D4AF37, #FF6B35)",
                borderRadius: "2px",
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          {[
            { label: "MODULES", value: "13" },
            { label: "HOURS", value: "9.1" },
            { label: "MANTRAS", value: "27" },
            { label: "TECHNIQUES", value: "5" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ color: "#D4AF37", fontSize: "22px", fontWeight: 900, margin: "0 0 2px" }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 20px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            padding: "6px",
            marginBottom: "32px",
          }}
        >
          {(
            [
              { key: "seals", label: "🦁 Nine Seals" },
              { key: "advanced", label: "⚡ Siddha Montrose" },
              { key: "mantras", label: "🔮 Secret Mantras" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "12px",
                transition: "all 0.25s",
                background: activeTab === tab.key ? "rgba(212,175,55,0.12)" : "transparent",
                color: activeTab === tab.key ? "#D4AF37" : "rgba(255,255,255,0.4)",
                borderColor: activeTab === tab.key ? "rgba(212,175,55,0.25)" : "transparent",
                letterSpacing: "0.05em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── NINE SEALS ────────────────────────────────────────────────── */}
        {activeTab === "seals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Tier gating legend */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                padding: "14px 18px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em" }}>ACCESS MATRIX:</span>
              {[
                { tier: "free", seals: "1–2" },
                { tier: "prana_flow", seals: "3–5" },
                { tier: "siddha_quantum", seals: "6–8" },
                { tier: "akasha_infinity", seals: "9 + All Advanced" },
              ].map((t) => (
                <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <TierBadge tier={t.tier} />
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>Seals {t.seals}</span>
                </div>
              ))}
            </div>

            {NINE_SEALS.map((module, i) => (
              <ModuleCard key={module.id} module={module} userTier={userTier} index={i} />
            ))}
          </div>
        )}

        {/* ── ADVANCED: SIDDHA MONTROSE ────────────────────────────────── */}
        {activeTab === "advanced" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header */}
            <div
              style={{
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: "20px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "rgba(212,175,55,0.6)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 10px" }}>
                AKASHA INFINITY EXCLUSIVE
              </p>
              <h2 style={{ color: "#D4AF37", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
                Siddha Montrose Advanced
              </h2>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.7, margin: 0, maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
                Siddha Montrose is a Siddha Loka — a dimension of perfected beings. These four advanced modules go beyond the outer nine seals into the internal mechanics of Narasimha consciousness. Reserved for Akasha Infinity initiates.
              </p>
            </div>

            {ADVANCED_MODULES.map((module, i) => (
              <AdvancedModuleCard key={module.id} module={module} userTier={userTier} index={i} />
            ))}
          </div>
        )}

        {/* ── SECRET MANTRAS ────────────────────────────────────────────── */}
        {activeTab === "mantras" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Three Siddha Keys */}
            <div
              style={{
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <p style={{ color: "rgba(212,175,55,0.6)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 14px" }}>
                THE 3 SECRET SIDDHA KEYS TO NARASIMHA
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  {
                    key: "1. Stambhana",
                    subtitle: "The Pillar of Stillness",
                    text: 'Narasimha emerged from a pillar. Your spine IS that pillar (Meru Danda). Meditate on "HUM" vibrating at the base of the spine. Visualize the spine as a white-hot pillar of light. This stabilizes your production energy so you never burn out.',
                    tier: "prana_flow",
                  },
                  {
                    key: "2. Nakha-Shakti",
                    subtitle: "The Power of the Claws",
                    text: "The claws of Narasimha tear through the veil of Maya. Mantra: Om Ksham Narasimhaya Vidmahe Vajra Nakhaya Dheemahi. Use specifically when stuck in a creative block or depression. It shreds stagnant energy.",
                    tier: "siddha_quantum",
                  },
                  {
                    key: "3. Hiranyakashipu-Dahana",
                    subtitle: "The Burning of Ego",
                    text: "The demon represents the conditioned mind that thinks it is immortal. Secret Sound: KSHRAUM combined with PREEM. Formula: KSHRAUM PREEM KSHRAUM. Preem is divine love. Mixing it with KSHRAUM creates the balanced Healing Lion frequency.",
                    tier: "siddha_quantum",
                  },
                ].map((item) => {
                  const accessible = hasAccess(userTier, item.tier);
                  return (
                    <div
                      key={item.key}
                      style={{
                        position: "relative",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "16px",
                        padding: "16px",
                        opacity: accessible ? 1 : 0.5,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <p style={{ color: "#D4AF37", fontSize: "13px", fontWeight: 800, margin: "0 0 2px" }}>{item.key}</p>
                          <p style={{ color: "rgba(212,175,55,0.6)", fontSize: "10px", margin: 0 }}>{item.subtitle}</p>
                        </div>
                        <TierBadge tier={item.tier} />
                      </div>
                      <p style={{ color: accessible ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)", fontSize: "12px", lineHeight: 1.7, margin: 0 }}>
                        {accessible ? item.text : "Initiation required to access this key."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anga Nyasa */}
            {hasAccess(userTier, "siddha_quantum") && (
              <div
                style={{
                  background: "rgba(155,89,182,0.06)",
                  border: "1px solid rgba(155,89,182,0.2)",
                  borderRadius: "20px",
                  padding: "24px",
                }}
              >
                <p style={{ color: "rgba(155,89,182,0.8)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 14px" }}>
                  ANGA NYASA · ENERGY ARMOR PLACEMENT
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Before producing music or entering meditation, "place" the mantra on your body to turn your skin into spiritual armor:
                </p>
                {[
                  { point: "Heart", instruction: 'Touch with right index, middle, and ring fingers', mantra: "Om Ghraum Hridayaaya Namah" },
                  { point: "Crown", instruction: "Touch the top of your head", mantra: "Kshraum Shirase Svaha" },
                  { point: "Third Eye", instruction: "Touch space between eyebrows", mantra: "Kshraum Netratrayaaya Vaushat" },
                  { point: "Shield", instruction: "Cross arms and touch shoulders", mantra: "Jhraum Kavachaaya Hum" },
                ].map((n) => (
                  <div
                    key={n.point}
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "12px",
                      alignItems: "flex-start",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(155,89,182,0.15)",
                        border: "1px solid rgba(155,89,182,0.25)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "#9B59B6", fontSize: "10px", fontWeight: 800 }}>{n.point}</span>
                    </div>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", margin: "0 0 3px" }}>{n.instruction}</p>
                      <p style={{ color: "#D4AF37", fontSize: "12px", fontWeight: 700, fontStyle: "italic", margin: 0 }}>{n.mantra}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Secret Mantra Cards */}
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em", margin: "8px 0 4px" }}>
              THE HIDDEN BIJA CODEX
            </p>
            {SECRET_MANTRAS.map((m, i) => {
              const requiredTier = i >= 3 ? "akasha_infinity" : i >= 2 ? "siddha_quantum" : "prana_flow";
              const accessible = hasAccess(userTier, requiredTier);
              return (
                <div
                  key={m.name}
                  style={{
                    position: "relative",
                    background: "rgba(212,175,55,0.03)",
                    border: "1px solid rgba(212,175,55,0.12)",
                    borderRadius: "20px",
                    padding: "20px",
                    opacity: accessible ? 1 : 0.45,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <h3 style={{ color: "#D4AF37", fontSize: "14px", fontWeight: 800, margin: 0 }}>{m.name}</h3>
                    <TierBadge tier={requiredTier} />
                  </div>

                  <div
                    style={{
                      background: "rgba(212,175,55,0.08)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      marginBottom: "12px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        color: accessible ? "#D4AF37" : "rgba(212,175,55,0.3)",
                        fontSize: "15px",
                        fontWeight: 900,
                        fontStyle: "italic",
                        letterSpacing: "0.05em",
                        margin: 0,
                      }}
                    >
                      {accessible ? m.mantra : "███████████████"}
                    </p>
                  </div>

                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", margin: "0 0 8px" }}>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>Components: </span>
                    {accessible ? m.components : "Initiation required"}
                  </p>
                  <p style={{ color: accessible ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                    {accessible ? m.usage : "Unlock to reveal the usage protocol."}
                  </p>
                </div>
              );
            })}

            {/* Kumbhaka Technique */}
            {hasAccess(userTier, "prana_flow") && (
              <div
                style={{
                  background: "rgba(34,211,238,0.04)",
                  border: "1px solid rgba(34,211,238,0.15)",
                  borderRadius: "20px",
                  padding: "24px",
                }}
              >
                <p style={{ color: "rgba(34,211,238,0.7)", fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em", margin: "0 0 12px" }}>
                  THE NO-BREATH GAP · KUMBHAKA PRACTICE
                </p>
                <h3 style={{ color: "#22D3EE", fontSize: "16px", fontWeight: 800, margin: "0 0 10px" }}>
                  Narasimha Appeared in the Gap
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Narasimha appeared neither inside nor outside, neither day nor night — he appeared in the GAP. In Siddha science, the held breath IS that gap. The power of the deity lives in the moment of absolute stillness between breaths.
                </p>
                <div style={{ background: "rgba(34,211,238,0.06)", borderRadius: "14px", padding: "16px" }}>
                  <p style={{ color: "rgba(34,211,238,0.8)", fontSize: "11px", fontWeight: 700, margin: "0 0 8px" }}>PRACTICE:</p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", lineHeight: 1.8, margin: 0 }}>
                    1. Inhale deeply.<br />
                    2. Hold the breath (Antar Kumbhaka).<br />
                    3. In that silent gap where there is no movement of air — visualize yourself standing in the center of Siddha Montrose.<br />
                    4. The Lion emerges from the pillar of your spine.<br />
                    5. Release slowly. The transmission has been received.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── UPGRADE CTA ───────────────────────────────────────────────── */}
        {userTier !== "akasha_infinity" && (
          <div
            style={{
              marginTop: "40px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,107,53,0.05))",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "28px",
              padding: "36px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🦁</div>
            <h2 style={{ color: "#D4AF37", fontSize: "24px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
              Unlock All Nine Seals
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.7, maxWidth: "440px", margin: "0 auto 24px" }}>
              The full Siddha Montrose transmission — all 9 Narasimha forms, 4 advanced modules, and the complete secret mantra codex — awaits your Akasha Infinity initiation.
            </p>
            <a
              href="/pricing"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                color: "#050505",
                fontWeight: 900,
                fontSize: "13px",
                letterSpacing: "0.15em",
                textDecoration: "none",
                borderRadius: "24px",
                padding: "14px 36px",
              }}
            >
              ENTER THE GOLDEN TEMPLE
            </a>
          </div>
        )}

        <div style={{ height: "60px" }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
