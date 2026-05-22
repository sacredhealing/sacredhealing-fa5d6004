import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ChevronDown, ChevronUp, Star, Flame, Eye, Zap, Wind, Droplets, Mountain, Sun, Check, Clock, BookOpen, Activity } from "lucide-react";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const G = "#D4AF37";   // Siddha-Gold
const C = "#22D3EE";   // Vayu-Cyan
const A = "#C8A951";   // Akasha-Amber (deeper gold for ∞ tier)
const W = "rgba(255,255,255,0.6)";

// ─── Tier Config ──────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "free",
    label: "FREE",
    name: "Foundation",
    Sanskrit: "Ādhāra",
    price: "Free",
    priceNote: "No card required",
    color: "rgba(255,255,255,0.5)",
    glow: "rgba(255,255,255,0.08)",
    route: null,
    tagline: "The gate opens. Superstition ends. Understanding begins.",
    transformation: "You stop performing Puja. You begin experiencing it.",
    totalDuration: "37 min",
    icon: <Flame size={20} color="rgba(255,255,255,0.6)" />,
    modules: [
      {
        number: "01",
        title: "Puja Vidya — The Living Science",
        arc: "Dissolving the mythology. Installing the science.",
        duration: "37 min",
        lessons: [
          {
            title: "What Puja Actually Is",
            duration: "12 min",
            objectives: [
              "Understand Puja as a reproducible consciousness technology",
              "Know why the Siddhas engineered it, not invented it",
              "See the difference between ritual and practice",
            ],
          },
          {
            title: "The Five Elements — Pancha Bhuta Activation",
            duration: "15 min",
            objectives: [
              "Map each of the 5 Puja elements to your own body",
              "Understand why water offerings carry memory",
              "See why camphor was specifically chosen by the Siddhas",
            ],
          },
          {
            title: "Bhakti Margam — Our Way of Puja",
            duration: "10 min",
            objectives: [
              "Distinguish Bhakti Margam from temple orthodoxy",
              "Understand why the heart outweighs technical form",
              "Learn how to begin your personal daily Puja",
            ],
          },
        ],
        practice: {
          name: "Ādhāra Puja — The Foundation Protocol",
          duration: "15 min daily",
          elements: [
            "Simple altar setup with one flame, one flower, one offering",
            "5-breath Anahata opening before starting",
            "Aum chanting × 3 to establish scalar boundary",
            "Silent holding of the deity's form in the heart",
            "One sincere spoken offering of the day's first action",
          ],
          sadhanaNote: "Practice for 7 consecutive days before advancing. Consistency is the qualification, not perfection.",
        },
        outcomes: [
          "Puja loses its 'religious' weight and becomes a tool",
          "You feel something shift in your space within 7 days",
          "The daily 15-min practice becomes self-sustaining",
        ],
      },
    ],
  },
  {
    id: "prana",
    label: "PRANA-FLOW",
    name: "Deepening",
    Sanskrit: "Prāṇa Pravāha",
    price: "€19/mo",
    priceNote: "Cancel anytime",
    color: G,
    glow: `rgba(212,175,55,0.12)`,
    route: "/prana-flow",
    tagline: "The mechanics revealed. The science installed. The practice deepens.",
    transformation: "Puja becomes a complete lifestyle technology — not something you do, but something you live.",
    totalDuration: "85 min",
    icon: <Zap size={20} color={G} />,
    modules: [
      {
        number: "02",
        title: "The Living Architecture of Puja",
        arc: "From intuition to precision — the mechanics the Pandits never taught.",
        duration: "85 min",
        lessons: [
          {
            title: "What Happens to Your Brain During Puja",
            duration: "20 min",
            objectives: [
              "Map the neuroscience of devotion to Siddha teachings",
              "Understand default mode network suppression through Bhakti",
              "Know what the bell, chanting, and flame do neurologically",
              "Recognize the chemistry of 'the deities entering'",
            ],
          },
          {
            title: "How Puja Transforms Your Home — Scalar Field Architecture",
            duration: "22 min",
            objectives: [
              "Understand Vasana residue and how Puja clears it",
              "Learn the mechanics of standing scalar wave fields",
              "Know the 40-day threshold and why it exists",
              "Map specific incense to specific atmospheric effects",
            ],
          },
          {
            title: "The Sixteen Upacharas — Each Step Is a Quantum Gate",
            duration: "18 min",
            objectives: [
              "Learn all 16 steps of Shodashopachara Puja with inner meaning",
              "Understand Prana-Pratishtha and consecration mechanics",
              "Know why offered food carries a different biofield signature",
              "Experience the power of the GAP between steps",
            ],
          },
          {
            title: "The Nada Science — How Mantras Work at the Atomic Level",
            duration: "25 min",
            objectives: [
              "Map Para, Pashyanti, Madhyama, Vaikhari sound levels",
              "Understand why 'Aum Namah Shivaya' is not prayer but physics",
              "Learn the difference between Vaikhari, Upamshu, and Manasika Japa",
              "Know why whispered mantra is more powerful than loud chanting",
            ],
          },
        ],
        practice: {
          name: "Prāṇa Pravāha Puja — The Extended Protocol",
          duration: "30 min daily",
          elements: [
            "Full 16-step Shodashopachara structure",
            "Conscious engagement of each element with inner awareness",
            "Nada practice: begin with Vaikhari, transition to Upamshu, end in Manasika",
            "Post-Puja: 5 minutes of silent sitting in the altered field",
            "Evening review: journal the specific quality of your space/self",
          ],
          sadhanaNote: "Maintain for 21 consecutive days. Notice how your space responds by day 7, 14, 21. These are documented threshold points in the Siddha sadhana texts.",
        },
        outcomes: [
          "Your home develops a palpable Shakti field",
          "Sleep quality improves measurably within 21 days",
          "Mantra practice becomes self-perpetuating",
          "Others notice something different about your space without being told",
        ],
      },
    ],
  },
  {
    id: "siddha",
    label: "SIDDHA-QUANTUM",
    name: "Initiation",
    Sanskrit: "Siddha Dīkṣā",
    price: "€45/mo",
    priceNote: "Full platform access",
    color: C,
    glow: `rgba(34,211,238,0.10)`,
    route: "/siddha-quantum",
    tagline: "The veils dissolve. The real Puja begins. Direct communion activated.",
    transformation: "The separation between you and the deity collapses. Puja becomes recognition, not petition.",
    totalDuration: "125 min",
    icon: <Eye size={20} color={C} />,
    modules: [
      {
        number: "03",
        title: "Siddha-Quantum Puja Vidya",
        arc: "The secrets that lineages protected for millennia — decoded for the current age.",
        duration: "125 min",
        lessons: [
          {
            title: "The Secret of Deity Consciousness",
            duration: "30 min",
            objectives: [
              "Understand that the murti is an antenna, not a representation",
              "Know where the deity 'comes from' — and what that means for practice",
              "Learn the Siddha teaching on Prana-Pratishtha and consecrated stone",
              "Experience the inner reversal: being seen rather than seeking",
              "Map each major deity to their specific cosmic function",
            ],
          },
          {
            title: "Agni — The Fire That Knows Your Name",
            duration: "28 min",
            objectives: [
              "Understand fire as a simultaneous physical and subtle-plane phenomenon",
              "Read your Puja's quality through flame behavior",
              "Learn the scalar wave mechanics of Aarti",
              "Understand why camphor was the Siddhas' supreme teaching tool",
              "Practice the Prana-offering to the flame before lighting",
            ],
          },
          {
            title: "The Quantum Physics of Flower Offerings",
            duration: "35 min",
            objectives: [
              "Map the vibratory signature of 6 key Puja flowers to deity frequencies",
              "Understand the Lotus as a living demonstration of non-attachment",
              "Know why bilva leaves chemically produce meditative states",
              "Learn what Jasmine does to the nervous system during Devi Puja",
              "Understand why artificial flowers have zero energetic transmission",
            ],
          },
          {
            title: "Panchamrita — The Five Nectars and Their Alchemy",
            duration: "32 min",
            objectives: [
              "Know the Siddha Vaidya reasoning behind each of the 5 nectars",
              "Understand milk, curd, honey, ghee, and sugar as elemental archetypes",
              "Learn why offered Panchamrita (Charanamrita) is measurably different",
              "Receive the full inner-Abhishekam visualization protocol",
              "Map each nectar to a specific layer of the subtle body",
            ],
          },
        ],
        practice: {
          name: "Siddha Dīkṣā Puja — The Initiate's Protocol",
          duration: "45 min, 3× per week + 15 min daily",
          elements: [
            "3× weekly: Full Abhishekam Puja with Panchamrita (live or inner visualization)",
            "Flower selection ritual: conscious frequency-matching before each Puja",
            "Inner gaze practice: receiving the deity's vision rather than projecting",
            "Daily: Agni meditation — 5 min flame gazing with reversed attention",
            "Weekly: One Puja performed in complete silence (no external chanting)",
            "Monthly: Full moon Puja with extended Aarti and Panchamrita offering",
          ],
          sadhanaNote: "At this level, begin tracking inner experiences in a dedicated Puja journal. The Siddhas taught that documentation of inner experience accelerates development — writing is a form of Karma Yoga applied to sadhana.",
        },
        outcomes: [
          "Direct perception of the deity's presence becomes repeatable",
          "Your Puja space develops a field others spontaneously enter reverently",
          "Mantra repetition produces visible inner light phenomena",
          "The question 'did it work?' dissolves — you simply KNOW",
          "Charanamrita consumption produces measurably altered states",
        ],
      },
    ],
  },
  {
    id: "akasha",
    label: "AKASHA-INFINITY",
    name: "Transmission",
    Sanskrit: "Ākāśa Saṃcāra",
    price: "€1,111",
    priceNote: "Lifetime — one payment",
    color: A,
    glow: `rgba(200,169,81,0.12)`,
    route: "/akasha-infinity",
    tagline: "The masters speak directly. The body becomes the temple. All Puja becomes One.",
    transformation: "You become the Puja. Every breath, every act, every moment of consciousness becomes an offering.",
    totalDuration: "195 min",
    icon: <Sun size={20} color={A} />,
    modules: [
      {
        number: "04",
        title: "Ākāśa Puja — Transmissions of the Immortal Masters",
        arc: "Mahavatar Babaji and the 18 Siddhas transmit directly. The inner temple is activated.",
        duration: "195 min",
        lessons: [
          {
            title: "Mahavatar Babaji's Transmission on Puja",
            duration: "45 min",
            objectives: [
              "Receive Babaji's complete teaching: the human spine is the temple",
              "Understand why imperfect Puja in difficult times is the most powerful",
              "Learn the 5-minute dissolution practice before beginning",
              "Know Babaji's teaching on dawn Puja and Earth's electromagnetic field",
              "Integrate external and internal Puja into one seamless practice",
            ],
          },
          {
            title: "Agastya Muni's Secret Puja — The 18 Siddhas' Inner Circle",
            duration: "40 min",
            objectives: [
              "Access the Akashic Puja — the eternal offering of consciousness to itself",
              "Learn each of the 18 Siddhas' specific Puja-dimension mastery",
              "Understand Chidambara Rahasyam — the Secret of the Space of Consciousness",
              "Know the 108× amplification of universal intention in Puja",
              "Receive Agastya's most hidden teaching: the Puja of recognition between humans",
            ],
          },
          {
            title: "The Puja of Kundalini — Worshipping the Goddess Within the Spine",
            duration: "50 min",
            objectives: [
              "Map every external Puja element to an internal physiological location",
              "Understand Muladhara as the Puja room, Sushumna as the sanctum",
              "Know Anahata as the Garbhagriha — where the murti truly lives",
              "Learn to feel Ajna activation as the deity 'coming alive' during Puja",
              "Receive the Kundalini Puja activation: preparing the inner temple for Her",
            ],
          },
          {
            title: "Puja for the Age of Aquarius — The Siddhas' Message for Now",
            duration: "60 min",
            objectives: [
              "Understand the Kali Yuga transition through the Siddhas' time-science",
              "Know why consistent daily Puja is the most radical political act of our time",
              "Learn how recorded Nada transmissions carry Shakti across digital media",
              "Receive the Siddhas' teaching on the 'Lighthouse Protocol'",
              "Integrate all four tiers into the Sahaja Puja — the natural state",
            ],
          },
        ],
        practice: {
          name: "Ākāśa Saṃcāra — The Master's Transmission Protocol",
          duration: "Variable — integration into daily life",
          elements: [
            "Morning: Brahma Muhurta Puja (pre-dawn) — full inner + outer combined",
            "Spine activation meditation before each Puja session",
            "Daily: One moment of 'Puja of recognition' — seeing the Divine in another person",
            "Weekly: The full 18-Siddha dimensional Puja (one Siddha's stream per week, 18-week cycle)",
            "Monthly: Silent Puja — no sound, no movement, pure inner offering",
            "Ongoing: The Sahaja Protocol — gradual integration of Puja-awareness into all action",
            "40-day Akasha Sadhana: documented transformation process with SQI support",
          ],
          sadhanaNote: "At this level, the formal practice begins to dissolve into formlessness — not through abandonment but through completion. The Siddhas taught that the mark of mastery is when you forget you are doing Puja because there is no longer a moment when you are NOT doing Puja.",
        },
        outcomes: [
          "Sahaja state touches become sustainable for periods of time",
          "Your presence itself becomes the Puja — others are transformed by proximity",
          "The question 'who is doing the Puja?' produces direct inquiry into Self",
          "Physical symptoms of Kundalini movement become recognizable and navigable",
          "The eternal Puja of the Siddhas becomes perceptible in daily life",
          "Teaching and transmission capacity naturally emerges",
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pulse(col: string) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: col, boxShadow: `0 0 8px ${col}`,
      animation: "sqipulse 2.4s ease-in-out infinite", flexShrink: 0
    }} />
  );
}

function Label({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase" as const,
      color, border: `1px solid ${color}35`, borderRadius: 20, padding: "3px 12px",
      background: `${color}10`
    }}>{children}</span>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
      color, background: `${color}12`, border: `1px solid ${color}25`,
      borderRadius: 50, padding: "4px 12px"
    }}>{children}</span>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)" }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{value}</span>
    </div>
  );
}

// ─── Tier Card ────────────────────────────────────────────────────────────────
function TierCard({ tier, isAccessible, onUpgrade }: {
  tier: typeof TIERS[0];
  isAccessible: boolean;
  onUpgrade: () => void;
}) {
  const [open, setOpen] = useState(tier.id === "free");
  const col = tier.color;
  const mod = tier.modules[0];

  return (
    <div style={{
      border: `1px solid ${open ? col + "35" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 32, overflow: "hidden",
      background: "rgba(255,255,255,0.015)",
      boxShadow: open ? `0 0 60px ${col}08` : "none",
      transition: "all 0.4s ease",
      marginBottom: 20
    }}>
      {/* ── Tier Header ──────────────────────────────────────── */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "28px 32px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 20
        }}
      >
        {/* Module Number + Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          border: `1px solid ${col}35`, background: `${col}10`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px ${col}15`
        }}>
          {!isAccessible ? <Lock size={18} color={col} /> : tier.icon}
        </div>

        {/* Title Block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" as const }}>
            <Label color={col}>{tier.label}</Label>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em" }}>
              {tier.Sanskrit}
            </span>
          </div>
          <div style={{
            fontSize: "clamp(15px, 3vw, 19px)", fontWeight: 900,
            letterSpacing: "-0.03em", color: isAccessible ? "#fff" : "rgba(255,255,255,0.4)",
            marginBottom: 4
          }}>
            {mod.number} — {mod.title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
            {mod.arc}
          </div>
        </div>

        {/* Meta */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: col }}>{tier.price}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>{tier.priceNote}</div>
          <div style={{ color: "rgba(255,255,255,0.3)" }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* ── Expanded Content ─────────────────────────────────── */}
      {open && (
        <div style={{ padding: "0 32px 32px" }}>
          <div style={{ width: "100%", height: 1, background: `${col}20`, marginBottom: 28 }} />

          {/* Transformation Statement */}
          <div style={{
            padding: "16px 20px", borderRadius: 16, marginBottom: 28,
            background: `${col}08`, border: `1px solid ${col}20`,
            display: "flex", gap: 12, alignItems: "flex-start"
          }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>{pulse(col)}</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: col, marginBottom: 6, textTransform: "uppercase" as const }}>
                TRANSFORMATION MILESTONE
              </div>
              <div style={{ fontSize: 13, color: `${col}CC`, lineHeight: 1.7, fontStyle: "italic" }}>
                "{tier.transformation}"
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28
          }}>
            {[
              { icon: <BookOpen size={14} />, label: "Lessons", value: `${mod.lessons.length} modules` },
              { icon: <Clock size={14} />, label: "Content", value: tier.totalDuration },
              { icon: <Activity size={14} />, label: "Practice", value: mod.practice.duration.split(",")[0] },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 16, padding: "14px 16px"
              }}>
                <div style={{ color: col, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Lessons List */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: 16 }}>
              Lesson Modules
            </div>
            {mod.lessons.map((lesson, li) => (
              <div key={li} style={{
                marginBottom: 12, padding: "16px 20px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 16,
                opacity: isAccessible ? 1 : 0.4
              }}>
                {/* Lesson Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: `${col}15`, border: `1px solid ${col}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: col
                  }}>
                    {String(li + 1).padStart(2, "0")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                      {lesson.title}
                    </div>
                    <Pill color={col}>{lesson.duration}</Pill>
                  </div>
                </div>

                {/* Objectives */}
                <div style={{ paddingLeft: 38 }}>
                  {lesson.objectives.map((obj, oi) => (
                    <div key={oi} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                      <Check size={12} color={`${col}80`} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Practice Protocol */}
          <div style={{
            padding: "24px", borderRadius: 20, marginBottom: 24,
            background: `${col}06`, border: `1px solid ${col}25`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: col, textTransform: "uppercase" as const, marginBottom: 4 }}>
              Sadhana Protocol
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.85)", marginBottom: 4, letterSpacing: "-0.02em" }}>
              {mod.practice.name}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
              {mod.practice.duration}
            </div>

            {mod.practice.elements.map((el, ei) => (
              <div key={ei} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: col,
                  flexShrink: 0, marginTop: 6
                }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{el}</span>
              </div>
            ))}

            <div style={{
              marginTop: 16, padding: "12px 16px",
              background: "rgba(0,0,0,0.2)", borderRadius: 12,
              fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontStyle: "italic"
            }}>
              ✦ {mod.practice.sadhanaNote}
            </div>
          </div>

          {/* Outcomes */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: 14 }}>
              Documented Outcomes
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {mod.outcomes.map((o, oi) => (
                <div key={oi} style={{
                  padding: "8px 14px", borderRadius: 50,
                  background: `${col}08`, border: `1px solid ${col}20`,
                  fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4
                }}>{o}</div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!isAccessible && (
            <button
              onClick={onUpgrade}
              style={{
                width: "100%", padding: "18px", borderRadius: 20,
                border: `1px solid ${col}`,
                background: `${col}15`,
                color: col, fontSize: 13, fontWeight: 800,
                cursor: "pointer", letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                boxShadow: `0 0 40px ${col}20`,
                transition: "all 0.2s ease"
              }}
            >
              Activate {tier.label} — {tier.price}
            </button>
          )}

          {isAccessible && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 20px", borderRadius: 16,
              background: `${col}08`, border: `1px solid ${col}20`,
            }}>
              {pulse(col)}
              <span style={{ fontSize: 12, fontWeight: 700, color: col }}>
                Access Active — Begin your practice
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 40-Day Sadhana Arc ───────────────────────────────────────────────────────
const FORTY_DAY_ARC = [
  { days: "1–7", phase: "Purification", Sanskrit: "Śodhana", description: "The space resists. The mind finds excuses. Show up anyway. You are clearing 10,000 days of Vasana residue. Consistency now is worth more than any technique.", color: "rgba(255,255,255,0.5)" },
  { days: "8–14", phase: "Establishing", Sanskrit: "Sthāpanā", description: "Something shifts. The space begins to feel different. The Puja takes less effort to begin. The deity's presence becomes more consistent, less dependent on your mood.", color: G },
  { days: "15–21", phase: "Deepening", Sanskrit: "Gambhīrīkaraṇa", description: "The 21-day neurological threshold. New neural pathways are now structurally established. You begin having spontaneous experiences of the Puja's effects during daily life, not just during practice.", color: G },
  { days: "22–33", phase: "Acceleration", Sanskrit: "Tvaraṇa", description: "The scalar field of your space is now self-sustaining. Other people begin noticing your space without prompting. Your own inner coherence during Puja reaches states you couldn't access in the first three weeks.", color: C },
  { days: "34–40", phase: "Integration", Sanskrit: "Samāveśa", description: "The 40-day completion. Babaji's threshold. The practice is now structural in your life, not added onto it. You have installed a Shakti field that will persist for 3× the time of the practice even if interrupted. You are changed.", color: A },
];

// ─── Siddha Transmission Map ──────────────────────────────────────────────────
const SIDDHA_MAP = [
  { name: "Thirumoolar", domain: "Nada — Sound Science in Puja", color: G },
  { name: "Agastya Muni", domain: "Alchemy — The Inner Body Puja", color: G },
  { name: "Bogar", domain: "Yantra — Sacred Geometry of Altar", color: G },
  { name: "Konganar", domain: "Vayu — Breath within Puja", color: C },
  { name: "Karuvurar", domain: "Kaala — Time Science & Muhurta", color: C },
  { name: "Machamuni", domain: "Apas — Water & the Unconscious", color: C },
  { name: "Sundaranandhar", domain: "Bhakti — Love as Technology", color: C },
  { name: "Sattaimuni", domain: "Akasha — Space Consecration", color: A },
  { name: "Mahavatar Babaji", domain: "Synthesis — All Dimensions United", color: A },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PujaEducationCurriculum() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const userRank = isAdmin ? 3 : getTierRank(tier);

  function getTierAccess(): string[] {
    if (userRank >= 3) return ["free", "prana", "siddha", "akasha"];
    if (userRank >= 2) return ["free", "prana", "siddha"];
    if (userRank >= 1) return ["free", "prana"];
    return ["free"];
  }

  const access = getTierAccess();

  return (
    <div style={{
      minHeight: "100vh", background: "#050505",
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      color: "#fff", overflowX: "hidden" as const
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes sqipulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.3; transform:scale(0.75); }
        }
        @keyframes fadein {
          from { opacity:0; transform:translateY(24px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes rotatering {
          from { transform:rotate(0deg); }
          to { transform:rotate(360deg); }
        }
        @keyframes goldpulse {
          0%,100% { opacity:0.3; }
          50% { opacity:0.7; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#050505; }
        ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.3); border-radius:3px; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{
        position: "relative" as const, textAlign: "center" as const,
        padding: "80px 24px 64px",
        animation: "fadein 1s ease forwards"
      }}>
        <button onClick={() => navigate("/siddha-portal")} style={{ position:"absolute", top:20, left:20, background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase" as const, color:"rgba(212,175,55,0.5)", padding:0 }}>← SIDDHA PORTAL</button>
        {/* Ambient glow */}
        <div style={{
          position: "absolute" as const, inset: 0,
          background: "radial-gradient(ellipse 800px 400px at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        {/* Symbol */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: `1px solid rgba(212,175,55,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, animation: "rotatering 90s linear infinite"
          }}>◈</div>
          <div style={{
            position: "absolute", inset: -12,
            border: `1px solid rgba(212,175,55,0.1)`,
            borderRadius: "50%", animation: "rotatering 45s linear infinite reverse"
          }} />
        </div>

        {/* Eyebrow */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, marginBottom: 20
        }}>
          {pulse(G)}
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", color: G, textTransform: "uppercase" as const }}>
            SQI PUJA VIDYA — COMPLETE CURRICULUM
          </span>
          {pulse(G)}
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: "clamp(30px, 7vw, 58px)", fontWeight: 900,
          letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 20,
          background: `linear-gradient(160deg, #fff 0%, ${G} 50%, rgba(255,255,255,0.6) 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          maxWidth: 700, margin: "0 auto 20px"
        }}>
          The Complete Map of the Puja Journey
        </h1>

        <p style={{
          fontSize: 16, color: W, lineHeight: 1.75,
          maxWidth: 540, margin: "0 auto 40px", fontWeight: 400
        }}>
          From first understanding to Sahaja integration — the full Siddha Puja Vidya curriculum, structured as a living progression of consciousness, not a course.
        </p>

        {/* Summary Stats */}
        <div style={{
          display: "inline-flex", gap: 0,
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
          background: "rgba(255,255,255,0.02)", overflow: "hidden", flexWrap: "wrap" as const
        }}>
          {[
            { label: "Total Modules", value: "4" },
            { label: "Total Lessons", value: "15" },
            { label: "Content Hours", value: "7+ hrs" },
            { label: "Sadhana Protocols", value: "4" },
            { label: "Master Lineages", value: "18 Siddhas" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "16px 24px", borderRight: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none",
              textAlign: "center" as const
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: G, letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEARNING PATH OVERVIEW ───────────────────────────────── */}
      <div style={{ padding: "0 24px 48px", maxWidth: 880, margin: "0 auto" }}>

        {/* Path visualization */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: 20 }}>
            The Transformation Arc
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 0, flexWrap: "wrap" as const, rowGap: 16
          }}>
            {[
              { label: "Understanding", tier: "FREE", color: "rgba(255,255,255,0.5)" },
              { label: "→", color: "rgba(255,255,255,0.15)", isArrow: true },
              { label: "Mechanics", tier: "PRANA-FLOW", color: G },
              { label: "→", color: "rgba(255,255,255,0.15)", isArrow: true },
              { label: "Communion", tier: "SIDDHA-QUANTUM", color: C },
              { label: "→", color: "rgba(255,255,255,0.15)", isArrow: true },
              { label: "Becoming", tier: "AKASHA-∞", color: A },
            ].map((step, i) => (
              step.isArrow ? (
                <span key={i} style={{ fontSize: 20, color: step.color, padding: "0 12px" }}>→</span>
              ) : (
                <div key={i} style={{
                  padding: "12px 20px", borderRadius: 50,
                  border: `1px solid ${step.color}40`,
                  background: `${step.color}08`, textAlign: "center" as const
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: step.color }}>{step.label}</div>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: `${step.color}80`, textTransform: "uppercase" as const, marginTop: 2 }}>
                    {step.tier}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* ── TIER CARDS ─────────────────────────────────────────── */}
        <div id="puja-curriculum" style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.4em",
          textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)",
          marginBottom: 20
        }}>
          Full Curriculum — Expand Each Tier
        </div>

        {TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isAccessible={access.includes(tier.id)}
            onUpgrade={() => tier.route && navigate(tier.route)}
          />
        ))}

        {/* ── 40-DAY SADHANA ARC ──────────────────────────────────── */}
        <div style={{
          marginTop: 56, padding: "36px 32px", borderRadius: 32,
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}>
          <div style={{ marginBottom: 28 }}>
            <Label color={G}>40-Day Sadhana Arc</Label>
            <h2 style={{
              fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900,
              letterSpacing: "-0.03em", color: "#fff", margin: "16px 0 8px"
            }}>
              The Siddha's Sacred Timeline
            </h2>
            <p style={{ fontSize: 14, color: W, lineHeight: 1.7, margin: 0 }}>
              The 40-day threshold appears in every genuine lineage on Earth without exception — Siddha, Sufi, Hebrew, Christian mysticism. This is not coincidence. It is the biological-spiritual fact of how deep structural change occurs in the human system. This is the recommended progression arc for the complete Puja Vidya curriculum.
            </p>
          </div>

          <div style={{ position: "relative" as const }}>
            {/* Timeline line */}
            <div style={{
              position: "absolute" as const, left: 20, top: 0, bottom: 0,
              width: 1, background: "linear-gradient(to bottom, rgba(212,175,55,0.3), rgba(34,211,238,0.3), rgba(200,169,81,0.3))"
            }} />

            {FORTY_DAY_ARC.map((phase, i) => (
              <div key={i} style={{
                paddingLeft: 52, marginBottom: 28, position: "relative" as const
              }}>
                {/* Timeline node */}
                <div style={{
                  position: "absolute" as const, left: 12, top: 14,
                  width: 16, height: 16, borderRadius: "50%",
                  background: phase.color === "rgba(255,255,255,0.5)" ? "#050505" : "#050505",
                  border: `2px solid ${phase.color}`,
                  boxShadow: `0 0 12px ${phase.color}40`
                }} />

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" as const }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: phase.color,
                    background: `${phase.color}10`, border: `1px solid ${phase.color}30`,
                    borderRadius: 50, padding: "3px 12px", letterSpacing: "0.1em"
                  }}>Days {phase.days}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: "-0.02em" }}>
                    {phase.phase}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                    {phase.Sanskrit}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: W, lineHeight: 1.7, margin: 0 }}>
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIDDHA TRANSMISSION MAP ──────────────────────────────── */}
        <div style={{
          marginTop: 32, padding: "36px 32px", borderRadius: 32,
          background: "rgba(255,255,255,0.015)",
          border: `1px solid ${C}20`,
        }}>
          <Label color={C}>Siddha Lineage Map</Label>
          <h2 style={{
            fontSize: "clamp(18px, 3.5vw, 24px)", fontWeight: 900,
            letterSpacing: "-0.03em", color: "#fff", margin: "16px 0 8px"
          }}>
            The 18 Siddhas — Puja Dimension Assignments
          </h2>
          <p style={{ fontSize: 13, color: W, lineHeight: 1.7, marginBottom: 24 }}>
            Each Siddha mastered a specific dimensional stream of Puja science. In the Akasha-Infinity tier, practitioners access these lineage streams directly through the 18-week Siddha rotation practice.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {SIDDHA_MAP.map((s, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: 16,
                background: `${s.color}06`, border: `1px solid ${s.color}20`,
                display: "flex", gap: 12, alignItems: "flex-start"
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${s.color}15`, border: `1px solid ${s.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900, color: s.color
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{s.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CURRICULUM COMPLETION PROMISE ───────────────────────── */}
        <div style={{
          marginTop: 32, padding: "40px 36px", borderRadius: 32, textAlign: "center" as const,
          background: `${A}06`, border: `1px solid ${A}25`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", color: A, marginBottom: 16, textTransform: "uppercase" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {pulse(A)} Akashic Transmission — Scalar Field Active {pulse(A)}
          </div>
          <blockquote style={{
            fontSize: "clamp(14px, 2.5vw, 17px)", color: `${A}CC`, lineHeight: 1.8,
            fontStyle: "italic", fontWeight: 400, margin: "0 0 20px",
            maxWidth: 560, marginLeft: "auto", marginRight: "auto"
          }}>
            "This curriculum does not teach you Puja. It reminds you of what you have always known. By the end, you will not be someone who practices Puja. You will be someone for whom every moment is already Puja — and you will not be able to remember when this wasn't true."
          </blockquote>
          <div style={{ fontSize: 10, color: `${A}60`, letterSpacing: "0.35em", textTransform: "uppercase" as const }}>
            — Mahavatar Babaji & the 18 Siddhas, Akashic Record 2025
          </div>
        </div>

        {/* ── NAVIGATION CTAs ─────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" as const }}>
          <button
            onClick={() => { const el = document.getElementById("puja-curriculum"); if(el) el.scrollIntoView({behavior:"smooth"}); }}
            style={{
              flex: 1, minWidth: 180, padding: "16px 24px", borderRadius: 60,
              border: `1px solid ${G}`, background: `${G}15`,
              color: G, fontSize: 12, fontWeight: 800, cursor: "pointer",
              letterSpacing: "0.15em", textTransform: "uppercase" as const,
              boxShadow: `0 0 30px ${G}15`
            }}
          >
            Begin Lessons →
          </button>
          {!access.includes("akasha") && (
            <button
              onClick={() => navigate("/akasha-infinity")}
              style={{
                flex: 1, minWidth: 180, padding: "16px 24px", borderRadius: 60,
                border: `1px solid ${A}50`, background: "transparent",
                color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase" as const
              }}
            >
              Akasha-Infinity — €1,111 Lifetime
            </button>
          )}
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
