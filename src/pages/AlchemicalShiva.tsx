import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";
import { Lock, Play, ChevronDown, ChevronUp, Flame, Star, Zap, Wind, Waves, Eye, Mic } from "lucide-react";

// ─── SQI 2050 TIER SYSTEM ────────────────────────────────────────────────────
// FREE      → Module 1 preview only
// PRANA_FLOW → Modules 1–2
// SIDDHA_QUANTUM → Modules 1–4
// AKASHA_INFINITY → All modules + Bonus Nath Vault
// ─────────────────────────────────────────────────────────────────────────────

type Tier = "free" | "prana_flow" | "siddha_quantum" | "akasha_infinity";

interface Module {
  id: number;
  title: string;
  subtitle: string;
  requiredTier: Tier;
  icon: React.ReactNode;
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

const TIER_ORDER: Record<string, number> = {
  free: 0,
  prana_flow: 1, "prana-flow": 1,
  siddha_quantum: 2, "siddha-quantum": 2,
  akasha_infinity: 3, "akasha-infinity": 3,
};

const TIER_LABELS: Record<Tier, string> = {
  free: "FREE",
  prana_flow: "PRANA FLOW",
  siddha_quantum: "SIDDHA QUANTUM",
  akasha_infinity: "AKASHA INFINITY",
};

const TIER_COLORS: Record<Tier, string> = {
  free: "rgba(255,255,255,0.5)",
  prana_flow: "#22D3EE",
  siddha_quantum: "#D4AF37",
  akasha_infinity: "#FF6B6B",
};

const modules: Module[] = [
  {
    id: 1,
    title: "The Bio-Geometry of the Lingam",
    subtitle: "Tuning the Human Antenna — Meru-Danda Alignment",
    requiredTier: "free",
    icon: <Flame size={22} />,
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
    icon: <Waves size={22} />,
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
    icon: <Wind size={22} />,
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
    icon: <Eye size={22} />,
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
    icon: <Star size={22} />,
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
    icon: <Zap size={22} />,
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

const nathMantras = [
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

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function AlchemicalShiva() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : getTierRank(tier);
  const userTier: Tier =
    rank >= 3 ? "akasha_infinity" : rank >= 2 ? "siddha_quantum" : rank >= 1 ? "prana_flow" : "free";
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<"course" | "vault">("course");
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; opacity: number; speed: number }[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Generate floating particles
  useEffect(() => {
    const p = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.015 + 0.005,
    }));
    setParticles(p);
  }, []);

  const canAccess = (tier: Tier) =>
    TIER_ORDER[userTier] >= TIER_ORDER[tier];

  const tierUpgradeLabel = (tier: Tier) => {
    if (tier === "prana_flow") return "Unlock with Prana Flow — €19/mo";
    if (tier === "siddha_quantum") return "Unlock with Siddha Quantum — €45/mo";
    if (tier === "akasha_infinity") return "Unlock with Akasha Infinity — €1,111 Lifetime";
    return "";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "rgba(255,255,255,0.85)",
        overflowX: "hidden",
      }}
    >
      {/* ── GOOGLE FONTS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 40px;
        }

        .gold-glow {
          text-shadow: 0 0 20px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.15);
          color: #D4AF37;
        }

        .module-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 28px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .module-card:hover {
          border-color: rgba(212, 175, 55, 0.2);
          background: rgba(212, 175, 55, 0.03);
          transform: translateY(-2px);
        }

        .module-card.locked:hover {
          border-color: rgba(255,255,255,0.08);
          background: rgba(255, 255, 255, 0.01);
          transform: none;
        }

        .nyasa-row {
          display: grid;
          grid-template-columns: 60px 1fr 1fr 1fr;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .nyasa-row:last-child { border-bottom: none; }

        .mantra-text {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #D4AF37;
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }

        .section-pill {
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
        }

        .section-pill.active {
          background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05));
          border: 1px solid rgba(212,175,55,0.4);
          color: #D4AF37;
        }

        .section-pill.inactive {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
        }

        .tier-badge {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .upgrade-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 100px;
          background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05));
          border: 1px solid rgba(212,175,55,0.3);
          color: #D4AF37;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
        }

        .upgrade-btn:hover {
          background: linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1));
          border-color: rgba(212,175,55,0.5);
          transform: translateY(-1px);
        }

        .nath-mantra-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 28px;
          padding: 32px;
          transition: all 0.4s;
        }

        .nath-mantra-card:hover {
          border-color: rgba(212,175,55,0.15);
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: #D4AF37;
          pointer-events: none;
          animation: float linear infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: var(--opacity); }
          50% { transform: translateY(-20px) translateX(10px); opacity: calc(var(--opacity) * 0.5); }
          100% { transform: translateY(0px) translateX(0px); opacity: var(--opacity); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .lingam-icon {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(212,175,55,0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(212,175,55,0.8)); }
        }

        .reveal {
          opacity: 0;
          transform: translateY(20px);
          animation: revealUp 0.7s forwards;
        }

        @keyframes revealUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.35s; }
        .stagger-4 { animation-delay: 0.5s; }
        .stagger-5 { animation-delay: 0.65s; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          overflow: "hidden",
        }}
      >
        {/* Back nav */}
        <button onClick={() => navigate("/siddha-portal")} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.45)", padding:0 }}>← SIDDHA PORTAL</button>

        {/* Radial gradient backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--opacity": p.opacity,
              animationDuration: `${4 + p.speed * 100}s`,
              animationDelay: `${i * 0.3}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* Lingam SVG */}
        <div className="lingam-icon reveal stagger-1" style={{ marginBottom: 32 }}>
          <svg width="72" height="96" viewBox="0 0 72 96" fill="none">
            {/* Yoni base */}
            <ellipse cx="36" cy="84" rx="32" ry="10" fill="rgba(212,175,55,0.1)" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
            {/* Lingam pillar */}
            <rect x="26" y="20" width="20" height="64" rx="10" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.35)" strokeWidth="1" />
            {/* Rounded top */}
            <ellipse cx="36" cy="20" rx="10" ry="10" fill="rgba(212,175,55,0.12)" stroke="#D4AF37" strokeWidth="1.5" />
            {/* Center light */}
            <line x1="36" y1="14" x2="36" y2="76" stroke="rgba(212,175,55,0.25)" strokeWidth="1" strokeDasharray="3 4" />
            {/* Glow rings */}
            <circle cx="36" cy="20" r="18" stroke="rgba(212,175,55,0.08)" strokeWidth="1" />
            <circle cx="36" cy="20" r="26" stroke="rgba(212,175,55,0.04)" strokeWidth="1" />
          </svg>
        </div>

        <div className="reveal stagger-1" style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.7)",
            }}
          >
            Siddha Quantum Intelligence · Nath Transmission
          </span>
        </div>

        <h1
          className="gold-glow reveal stagger-2"
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: 20,
            maxWidth: 800,
          }}
        >
          Alchemical Shiva
        </h1>

        <h2
          className="reveal stagger-2"
          style={{
            fontSize: "clamp(16px, 2.5vw, 22px)",
            fontWeight: 300,
            letterSpacing: "0.02em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: 32,
            maxWidth: 600,
          }}
        >
          The Secrets of the Siddhas — Gorakshanath's Path to the Inner Lingam
        </h2>

        <p
          className="reveal stagger-3"
          style={{
            fontSize: "15px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.45)",
            maxWidth: 520,
            marginBottom: 48,
          }}
        >
          Stop looking at the stone. Become the Pillar.
          <br />
          <em style={{ color: "rgba(212,175,55,0.6)", fontStyle: "italic" }}>
            "The Lingam is not in the temple; the temple is the body, and the Lingam is the light within the heart."
          </em>
        </p>

        {/* Stats row */}
        <div
          className="reveal stagger-4"
          style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 48,
          }}
        >
          {[
            { label: "MODULES", value: "5 + BONUS" },
            { label: "LINEAGE", value: "NATH SIDDHA" },
            { label: "MANTRAS", value: "9 SECRET" },
            { label: "TRADITION", value: "84 MAHASIDDHAS" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#D4AF37",
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tier badges */}
        <div
          className="reveal stagger-5"
          style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}
        >
          {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
            <span
              key={t}
              className="tier-badge"
              style={{
                background:
                  userTier === t
                    ? `rgba(${t === "free" ? "255,255,255" : t === "prana_flow" ? "34,211,238" : t === "siddha_quantum" ? "212,175,55" : "255,107,107"},0.12)`
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${userTier === t ? TIER_COLORS[t] : "rgba(255,255,255,0.08)"}`,
                color: userTier === t ? TIER_COLORS[t] : "rgba(255,255,255,0.3)",
              }}
            >
              {userTier === t ? "✦ " : ""}{TIER_LABELS[t]}
            </span>
          ))}
        </div>
      </div>

      {/* ── QUOTE DIVIDER ───────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "32px 24px",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontStyle: "italic",
            color: "rgba(212,175,55,0.5)",
            letterSpacing: "0.05em",
          }}
        >
          "Do not seek Shiva in the stones of the mountain until you have found Him in the stone of your own heart."
          <span style={{ display: "block", marginTop: 8, fontStyle: "normal", fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
            — Gorakshanath, Nath Lineage Transmission
          </span>
        </p>
      </div>

      {/* ── SECTION TOGGLE ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          padding: "40px 24px 0",
        }}
      >
        <button
          className={`section-pill ${activeSection === "course" ? "active" : "inactive"}`}
          onClick={() => setActiveSection("course")}
          style={{ border: "none" }}
        >
          Course Modules
        </button>
        <button
          className={`section-pill ${activeSection === "vault" ? "active" : "inactive"}`}
          onClick={() => setActiveSection("vault")}
          style={{ border: "none" }}
        >
          Nath Vault — Secret Mantras
          {!canAccess("akasha_infinity") && (
            <Lock size={9} style={{ marginLeft: 6, display: "inline" }} />
          )}
        </button>
      </div>

      {/* ── MODULES SECTION ─────────────────────────────────────────────────── */}
      {activeSection === "course" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
          {modules.map((mod, idx) => {
            const accessible = canAccess(mod.requiredTier);
            const isExpanded = expandedModule === mod.id;

            return (
              <div
                key={mod.id}
                className={`module-card ${!accessible ? "locked" : ""}`}
                style={{
                  marginBottom: 16,
                  opacity: accessible ? 1 : 0.6,
                  border: mod.isBonus
                    ? "1px solid rgba(255,107,107,0.15)"
                    : isExpanded
                    ? `1px solid rgba(212,175,55,0.2)`
                    : "1px solid rgba(255,255,255,0.05)",
                }}
                onClick={() => accessible && setExpandedModule(isExpanded ? null : mod.id)}
              >
                {/* Module header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "24px 28px",
                  }}
                >
                  {/* Number / Lock */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: accessible
                        ? `rgba(${mod.color === "#D4AF37" ? "212,175,55" : mod.color === "#22D3EE" ? "34,211,238" : mod.color === "#A78BFA" ? "167,139,250" : mod.color === "#F59E0B" ? "245,158,11" : mod.color === "#818CF8" ? "129,140,248" : "255,107,107"},0.1)`
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${accessible ? mod.color + "40" : "rgba(255,255,255,0.08)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: accessible ? mod.color : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {accessible ? mod.icon : <Lock size={16} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      {mod.isBonus && (
                        <span
                          style={{
                            fontSize: "7px",
                            fontWeight: 800,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            color: "#FF6B6B",
                            background: "rgba(255,107,107,0.1)",
                            border: "1px solid rgba(255,107,107,0.2)",
                            padding: "2px 8px",
                            borderRadius: "100px",
                          }}
                        >
                          ✦ NATH VAULT BONUS
                        </span>
                      )}
                      <span
                        className="tier-badge"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${TIER_COLORS[mod.requiredTier]}30`,
                          color: TIER_COLORS[mod.requiredTier],
                        }}
                      >
                        {TIER_LABELS[mod.requiredTier]}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: accessible ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                        marginBottom: 4,
                      }}
                    >
                      {!mod.isBonus && (
                        <span style={{ color: mod.color, marginRight: 8 }}>
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                      )}
                      {mod.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {mod.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 800,
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: accessible ? mod.color : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {mod.duration}
                    </span>
                    <span
                      style={{
                        fontSize: "8px",
                        fontWeight: 800,
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.2)",
                      }}
                    >
                      {mod.element}
                    </span>
                    {accessible && (
                      isExpanded ? (
                        <ChevronUp size={16} color="rgba(212,175,55,0.5)" />
                      ) : (
                        <ChevronDown size={16} color="rgba(255,255,255,0.2)" />
                      )
                    )}
                  </div>
                </div>

                {/* ── EXPANDED CONTENT ── */}
                {isExpanded && accessible && (
                  <div
                    style={{
                      padding: "0 28px 28px",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ paddingTop: 24 }}>
                      {/* Technique */}
                      <div style={{ marginBottom: 24 }}>
                        <div
                          style={{
                            fontSize: "8px",
                            fontWeight: 800,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            color: mod.color,
                            marginBottom: 8,
                          }}
                        >
                          ◆ Siddha Technique
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          {mod.technique}
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.55)",
                          }}
                        >
                          {mod.techniqueDetail}
                        </p>
                      </div>

                      {/* Mantra */}
                      <div
                        style={{
                          background: `rgba(${mod.color === "#D4AF37" ? "212,175,55" : mod.color === "#22D3EE" ? "34,211,238" : "167,139,250"},0.05)`,
                          border: `1px solid ${mod.color}20`,
                          borderRadius: 20,
                          padding: "20px 24px",
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "8px",
                            fontWeight: 800,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.3)",
                            marginBottom: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Mic size={10} />
                          Sacred Mantra — Record This
                        </div>
                        <div
                          className="mantra-text"
                          style={{ fontSize: "18px", lineHeight: 1.6, letterSpacing: "0.15em", color: mod.color }}
                        >
                          {mod.mantra}
                        </div>
                      </div>

                      {/* Nyasa table (Module 3 only) */}
                      {mod.nyasa && (
                        <div style={{ marginBottom: 20 }}>
                          <div
                            style={{
                              fontSize: "8px",
                              fontWeight: 800,
                              letterSpacing: "0.4em",
                              textTransform: "uppercase",
                              color: mod.color,
                              marginBottom: 12,
                            }}
                          >
                            ◆ Nyasa — Body Placement Map
                          </div>
                          <div
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: 16,
                              padding: "16px 20px",
                              border: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "48px 1fr 80px 1fr",
                                gap: 12,
                                marginBottom: 12,
                                paddingBottom: 8,
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              {["BIJA", "LOCATION", "ELEMENT", "ACTIVATION"].map((h) => (
                                <span
                                  key={h}
                                  style={{
                                    fontSize: "7px",
                                    fontWeight: 800,
                                    letterSpacing: "0.3em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.25)",
                                  }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                            {mod.nyasa.map((row) => (
                              <div className="nyasa-row" key={row.syllable}>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 900,
                                    color: "#A78BFA",
                                    textShadow: "0 0 10px rgba(167,139,250,0.4)",
                                    letterSpacing: "0.1em",
                                  }}
                                >
                                  {row.syllable}
                                </span>
                                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                                  {row.location}
                                </span>
                                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                                  {row.element}
                                </span>
                                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                                  {row.meaning}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instruction */}
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 16,
                          padding: "16px 20px",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "8px",
                            fontWeight: 800,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.25)",
                            marginBottom: 8,
                          }}
                        >
                          ◆ Siddha Instruction
                        </div>
                        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                          {mod.instruction}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Locked — upgrade CTA */}
                {!accessible && (
                  <div
                    style={{
                      padding: "0 28px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
                      {tierUpgradeLabel(mod.requiredTier)}
                    </p>
                    <a className="upgrade-btn" href="/siddha-quantum">
                      <Lock size={10} />
                      UPGRADE TO UNLOCK
                    </a>
                  </div>
                )}
              </div>
            );
          })}

          {/* Recording CTA Banner */}
          <div
            className="glass-card"
            style={{
              padding: "32px",
              textAlign: "center",
              marginTop: 32,
              border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                padding: "6px 16px",
                borderRadius: "100px",
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
              }}
            >
              <Mic size={12} color="#D4AF37" />
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "#D4AF37",
                }}
              >
                Recording Protocol
              </span>
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "rgba(255,255,255,0.85)",
                marginBottom: 12,
              }}
            >
              Record the Sacred Mantras
            </h3>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.4)",
                maxWidth: 440,
                margin: "0 auto 24px",
              }}
            >
              Each mantra marked with <span style={{ color: "#D4AF37" }}>◆</span> is a recording cue. Your voice carries
              the Siddha transmission. The audio will be activated with scalar Prema-Pulse before upload to SQI.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a className="upgrade-btn" href="/apothecary">
                <Play size={10} />
                OPEN SQI APOTHECARY
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── NATH VAULT SECTION ──────────────────────────────────────────────── */}
      {activeSection === "vault" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
          {!canAccess("akasha_infinity") ? (
            <div
              className="glass-card"
              style={{
                padding: "64px 32px",
                textAlign: "center",
                border: "1px solid rgba(255,107,107,0.1)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 24 }}>🔱</div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#FF6B6B",
                  marginBottom: 12,
                }}
              >
                Nath Vault — Akasha Infinity Only
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.4)",
                  maxWidth: 400,
                  margin: "0 auto 32px",
                }}
              >
                These three mantras were transmitted only from Guru to disciple at the moment of Shaktipat.
                They require the sovereign container of Akasha Infinity.
              </p>
              <a className="upgrade-btn" href="/siddha-quantum" style={{ borderColor: "rgba(255,107,107,0.3)", color: "#FF6B6B", background: "rgba(255,107,107,0.08)" }}>
                <Lock size={10} />
                AKASHA INFINITY — €1,111 LIFETIME
              </a>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.5em",
                    textTransform: "uppercase",
                    color: "#FF6B6B",
                    marginBottom: 12,
                  }}
                >
                  ✦ Nath Lineage · 84 Mahasiddhas · Guru-Disciple Transmission
                </div>
                <h2
                  style={{
                    fontSize: "32px",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  The Three Lost Mantras
                </h2>
              </div>

              {nathMantras.map((m, i) => (
                <div
                  key={i}
                  className="nath-mantra-card"
                  style={{ marginBottom: 20, border: `1px solid ${m.color}18` }}
                >
                  <div
                    style={{
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: m.color,
                      marginBottom: 12,
                    }}
                  >
                    ✦ NATH MANTRA {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: 20,
                    }}
                  >
                    {m.name}
                  </h3>

                  {/* Mantra display */}
                  <div
                    style={{
                      background: `rgba(${m.color === "#D4AF37" ? "212,175,55" : m.color === "#22D3EE" ? "34,211,238" : "255,107,107"},0.06)`,
                      border: `1px solid ${m.color}25`,
                      borderRadius: 20,
                      padding: "24px",
                      marginBottom: 20,
                      textAlign: "center",
                    }}
                  >
                    <pre
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "16px",
                        fontWeight: 800,
                        letterSpacing: "0.15em",
                        color: m.color,
                        textShadow: `0 0 15px ${m.color}40`,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.mantra}
                    </pre>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 16,
                        padding: "16px",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "7px",
                          fontWeight: 800,
                          letterSpacing: "0.35em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.25)",
                          marginBottom: 8,
                        }}
                      >
                        Effect
                      </div>
                      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
                        {m.effect}
                      </p>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 16,
                        padding: "16px",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "7px",
                          fontWeight: 800,
                          letterSpacing: "0.35em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.25)",
                          marginBottom: 8,
                        }}
                      >
                        Siddha Instruction
                      </div>
                      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
                        {m.instruction}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM TRANSMISSION SEAL ─────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          borderTop: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.3)",
            marginBottom: 8,
          }}
        >
          Scalar Prema-Pulse Transmission Active
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.15)" }}>
          All audio recorded through this module carries live Anahata activation · Siddha Quantum Intelligence 2050
        </p>
      </div>
    </div>
  );
}
