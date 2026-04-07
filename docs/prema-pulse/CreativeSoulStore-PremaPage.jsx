import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   SQI 2050 DESIGN TOKENS
───────────────────────────────────────────── */
const G = "#D4AF37";       // Siddha-Gold
const BG = "#050505";      // Akasha-Black
const CYAN = "#22D3EE";    // Vayu-Cyan
const GLASS = "rgba(255,255,255,0.02)";
const GBORDER = "rgba(255,255,255,0.05)";

/* ─────────────────────────────────────────────
   PRICING TIERS
───────────────────────────────────────────── */
const TIERS = [
  {
    id: "spark",
    name: "Prana Spark",
    subtitle: "Begin the Transmission",
    price: "€9",
    period: "/month",
    color: "#A0A0A0",
    glow: "rgba(160,160,160,0.15)",
    icon: "✦",
    posts: "30 AI posts/month",
    features: [
      "2 platforms (Instagram + TikTok)",
      "5 content pillars",
      "Basic viral hooks library",
      "Auto hashtag generation",
      "3 languages",
      "Copy & manual publish",
    ],
    cta: "Start Healing",
    popular: false,
  },
  {
    id: "quantum",
    name: "Siddha Quantum",
    subtitle: "Full Bhakti-Algorithm Power",
    price: "€29",
    period: "/month",
    color: G,
    glow: "rgba(212,175,55,0.2)",
    icon: "🔱",
    posts: "Unlimited posts",
    features: [
      "All 4 platforms simultaneously",
      "All 5 Bhakti-Algorithm pillars",
      "Voice mic transcription",
      "AI caption + hook generation",
      "6 languages + auto-translate",
      "Viral Protocol tips per post",
      "Post scheduling queue",
      "Edit notes per platform",
      "Platform preview mockups",
    ],
    cta: "Activate Now",
    popular: true,
  },
  {
    id: "akasha",
    name: "Akasha Infinity",
    subtitle: "The Sovereign Creator",
    price: "€111",
    period: "one-time",
    color: CYAN,
    glow: "rgba(34,211,238,0.2)",
    icon: "⚡",
    posts: "Unlimited · Forever",
    features: [
      "Everything in Siddha Quantum",
      "Lifetime access — no monthly fee",
      "Admin dashboard access",
      "White-label for your own brand",
      "Priority SQI AI model",
      "Custom brand voice training",
      "Direct Kritagya Das support",
      "Early access to all new features",
      "Sacred Healing affiliate link built-in",
    ],
    cta: "Own It Forever",
    popular: false,
  },
];

/* ─────────────────────────────────────────────
   FEATURES DETAIL
───────────────────────────────────────────── */
const FEATURES = [
  { icon: "🎙️", title: "Voice-to-Post", desc: "Speak your idea into the mic. SQI transcribes, structures, and transforms it into platform-ready captions in seconds." },
  { icon: "⚡", title: "AI Viral Hook Engine", desc: "Every post begins with a 3-second scroll-stopping hook. Powered by Bhakti-Algorithms trained on what actually goes viral." },
  { icon: "🌍", title: "6-Language Translation", desc: "Auto-translate every post to English, Swedish, Norwegian, Spanish, German, and French simultaneously." },
  { icon: "📸", title: "Media Upload & Edit Guide", desc: "Upload your videos and images. SQI gives you exact cutting specs per platform — aspect ratio, duration, style notes." },
  { icon: "🔱", title: "All 4 Platforms at Once", desc: "One creation. Four perfectly adapted posts — Instagram Reels, TikTok, Facebook, YouTube Shorts — each optimised for their algorithm." },
  { icon: "📡", title: "Transmission Queue", desc: "Build your posting queue. Get the best time to post per platform. Copy with one tap. Connect Buffer or Later to auto-publish." },
  { icon: "🌀", title: "5 Bhakti-Algorithm Pillars", desc: "Activation, Transmission, Vedic Light-Code, Avataric Story, Sacred CTA — each pillar engineered for different healing content archetypes." },
  { icon: "🔺", title: "Viral Protocol Tips", desc: "After every post, SQI gives you one specific tip to maximise reach on that platform — built from 2026 algorithm intelligence." },
];

/* ─────────────────────────────────────────────
   PARTICLE FIELD
───────────────────────────────────────────── */
const particles = Array.from({ length: 24 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  opacity: Math.random() * 0.35 + 0.05,
  duration: Math.random() * 12 + 8,
  delay: Math.random() * 6,
}));

function StarField() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x + "%", top: p.y + "%",
          width: p.size, height: p.size,
          background: `rgba(212,175,55,${p.opacity})`,
          borderRadius: "50%",
          animation: `starFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      {/* Radial nebula */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "15%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(34,211,238,0.03) 0%, transparent 70%)",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────── */
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────
   STORE BANNER COMPONENT
───────────────────────────────────────────── */
function StoreBanner({ onViewProduct }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(v => !v), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      borderRadius: 28,
      background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(5,5,5,0.95) 40%, rgba(34,211,238,0.04) 100%)",
      border: "1px solid rgba(212,175,55,0.25)",
      padding: "28px 28px 28px 28px",
      marginBottom: 32,
      boxShadow: "0 0 60px rgba(212,175,55,0.08), inset 0 0 40px rgba(212,175,55,0.02)",
      animation: "bannerGlow 4s ease-in-out infinite",
    }}>
      {/* Scan line */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
        animation: "scanLine 3s linear infinite",
        pointerEvents: "none",
      }} />

      {/* Corner ornament TL */}
      <div style={{ position: "absolute", top: 16, left: 16, width: 20, height: 20, borderTop: `2px solid ${G}`, borderLeft: `2px solid ${G}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", top: 16, right: 16, width: 20, height: 20, borderTop: `2px solid ${G}`, borderRight: `2px solid ${G}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 16, left: 16, width: 20, height: 20, borderBottom: `2px solid ${G}`, borderLeft: `2px solid ${G}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 16, right: 16, width: 20, height: 20, borderBottom: `2px solid ${G}`, borderRight: `2px solid ${G}`, opacity: 0.5 }} />

      {/* NEW badge */}
      <div style={{
        position: "absolute", top: -1, left: 32,
        background: `linear-gradient(90deg, ${G}, #F0D060)`,
        padding: "3px 16px", borderRadius: "0 0 12px 12px",
        fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", color: "#050505",
      }}>NEW TOOL</div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, flexShrink: 0,
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
          boxShadow: pulse ? "0 0 30px rgba(212,175,55,0.4)" : "0 0 10px rgba(212,175,55,0.1)",
          transition: "box-shadow 0.8s ease",
        }}>⚡</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: 4 }}>
            SACRED HEALING TOOL
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: G, lineHeight: 1.1, marginBottom: 6 }}>
            PREMA-PULSE TRANSMITTER
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 10 }}>
            AI-powered viral content engine for all 4 platforms.<br />
            Upload media · Speak your idea · SQI does the rest.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["📸", "🎵", "👁️", "🔺"].map((icon, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13,
                }} title={["Instagram", "TikTok", "Facebook", "YouTube"][i]}>{icon}</div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "rgba(212,175,55,0.6)", fontWeight: 700 }}>
              from €9/mo
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button
            onClick={onViewProduct}
            style={{
              background: `linear-gradient(135deg, ${G}, #F0D060)`,
              border: "none", borderRadius: 16, padding: "14px 24px",
              fontFamily: "inherit", fontWeight: 900, fontSize: 13,
              color: "#050505", cursor: "pointer", letterSpacing: "0.05em",
              boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
              transition: "all 0.3s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          >
            VIEW PRODUCT →
          </button>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textAlign: "center", letterSpacing: "0.2em" }}>
            ADMIN FULL ACCESS
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRODUCT PAGE
───────────────────────────────────────────── */
function ProductPage({ onBack }) {
  const [selectedTier, setSelectedTier] = useState("quantum");
  const [activeFeature, setActiveFeature] = useState(null);
  const [showAdminBadge] = useState(true);

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: "none", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "8px 16px", color: "rgba(255,255,255,0.4)",
          fontFamily: "inherit", fontSize: 11, cursor: "pointer", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
      >
        ← Back to Store
      </button>

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 60, animation: "fadeUp 0.6s ease both" }}>
        {/* Admin badge */}
        {showAdminBadge && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.3)",
            borderRadius: 20, padding: "6px 18px", marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: CYAN, animation: "blip 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: CYAN, textTransform: "uppercase" }}>
              Admin · Full Access Enabled
            </span>
          </div>
        )}

        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: 12 }}>
          SACRED HEALING · CREATIVE TOOLS
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, letterSpacing: "-0.04em",
          color: G, margin: "0 0 8px",
          textShadow: "0 0 40px rgba(212,175,55,0.3)",
          lineHeight: 1,
        }}>
          PREMA-PULSE<br />TRANSMITTER
        </h1>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", fontWeight: 400, marginBottom: 24, letterSpacing: "0.05em" }}>
          The AI Viral Content Engine for Spiritual Creators
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 36 }}>
          {[
            { val: 4, suffix: " platforms", label: "SIMULTANEOUS" },
            { val: 6, suffix: " languages", label: "AUTO-TRANSLATE" },
            { val: 5, suffix: " pillars", label: "BHAKTI-ALGORITHMS" },
            { val: 100, suffix: "%", label: "AI-POWERED" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", animation: `fadeUp 0.6s ease ${i * 0.1}s both` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: G }}>
                <Counter target={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Platform logos row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {[
            { icon: "📸", name: "Instagram", color: "#E1306C" },
            { icon: "🎵", name: "TikTok", color: "#69C9D0" },
            { icon: "👁️", name: "Facebook", color: "#1877F2" },
            { icon: "🔺", name: "YouTube", color: "#FF0000" },
          ].map((p) => (
            <div key={p.name} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `${p.color}11`, border: `1px solid ${p.color}33`,
              borderRadius: 12, padding: "8px 14px",
            }}>
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What is it */}
      <div style={{
        background: GLASS, border: `1px solid ${GBORDER}`,
        borderRadius: 28, padding: "32px 28px", marginBottom: 40,
        backdropFilter: "blur(40px)", animation: "fadeUp 0.6s ease 0.2s both",
      }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: 12 }}>
              WHAT IS THIS?
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.2 }}>
              Your spiritual brand, going viral — every single day.
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: 12 }}>
              The Prema-Pulse Transmitter is a complete AI-powered social media automation tool built specifically for spiritual creators and healers. Upload a video or image, speak your idea into the mic, choose your content pillar — and SQI generates fully optimised posts for Instagram, TikTok, Facebook, and YouTube simultaneously.
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
              Every post includes AI-generated viral hooks, platform-specific captions, hashtags, best posting times, and editing instructions — all in your brand voice, in up to 6 languages.
            </p>
          </div>
          {/* Mini demo visual */}
          <div style={{
            flex: "0 0 auto", width: 200,
            background: "#0a0a0a", borderRadius: 20,
            border: "1px solid rgba(212,175,55,0.15)",
            overflow: "hidden",
          }}>
            <div style={{ height: 120, background: "linear-gradient(135deg,#0d0d0d,#1a1208)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,rgba(212,175,55,0.1),transparent 70%)" }} />
              <div style={{ fontSize: 48, position: "relative", zIndex: 1 }}>⚡</div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: G, marginBottom: 6 }}>"This mantra rewires your nervous system…"</div>
              {["📸 Instagram", "🎵 TikTok", "👁️ Facebook", "🔺 YouTube"].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: G, opacity: 0.6 }} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{p}</span>
                  <div style={{ marginLeft: "auto", fontSize: 8, color: CYAN, fontWeight: 700 }}>READY</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: 8 }}>
            FULL FEATURE SET
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.03em", margin: 0 }}>
            Everything in one transmission
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onClick={() => setActiveFeature(activeFeature === i ? null : i)}
              style={{
                background: activeFeature === i ? "rgba(212,175,55,0.06)" : GLASS,
                border: `1px solid ${activeFeature === i ? "rgba(212,175,55,0.3)" : GBORDER}`,
                borderRadius: 20, padding: "18px 18px",
                cursor: "pointer", transition: "all 0.3s",
                animation: `fadeUp 0.5s ease ${i * 0.05}s both`,
              }}
              onMouseEnter={e => { if (activeFeature !== i) e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"; }}
              onMouseLeave={e => { if (activeFeature !== i) e.currentTarget.style.borderColor = GBORDER; }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: G, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: 8 }}>
            CHOOSE YOUR TIER
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.04em", margin: 0 }}>
            Sovereign Pricing
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
            All tiers include access to sacredhealing.lovable.app
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {TIERS.map((tier, i) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              style={{
                position: "relative",
                background: selectedTier === tier.id ? `${tier.glow}` : GLASS,
                border: `1px solid ${selectedTier === tier.id ? tier.color + "55" : GBORDER}`,
                borderRadius: 28, padding: "28px 24px",
                cursor: "pointer", transition: "all 0.4s",
                boxShadow: selectedTier === tier.id ? `0 0 40px ${tier.glow}` : "none",
                animation: `fadeUp 0.6s ease ${i * 0.1}s both`,
                transform: tier.popular && selectedTier === tier.id ? "scale(1.02)" : "scale(1)",
              }}
            >
              {tier.popular && (
                <div style={{
                  position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                  background: `linear-gradient(90deg, ${G}, #F0D060)`,
                  padding: "4px 20px", borderRadius: "0 0 16px 16px",
                  fontSize: 8, fontWeight: 900, letterSpacing: "0.3em", color: "#050505",
                  whiteSpace: "nowrap",
                }}>MOST POPULAR</div>
              )}

              <div style={{ fontSize: 28, marginBottom: 8 }}>{tier.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: tier.color, letterSpacing: "-0.02em", marginBottom: 2 }}>{tier.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>{tier.subtitle}</div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.04em", lineHeight: 1 }}>{tier.price}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{tier.period}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tier.color, marginBottom: 24, letterSpacing: "0.1em" }}>{tier.posts}</div>

              <div style={{ marginBottom: 24 }}>
                {tier.features.map((feat, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: tier.color + "33", border: `1px solid ${tier.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: tier.color }} />
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  width: "100%", padding: "14px 0",
                  background: selectedTier === tier.id
                    ? `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${tier.color}44`,
                  borderRadius: 16, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 900, fontSize: 13,
                  color: selectedTier === tier.id ? "#050505" : tier.color,
                  letterSpacing: "0.08em", transition: "all 0.3s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`}
                onMouseLeave={e => {
                  if (selectedTier !== tier.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Admin section */}
      <div style={{
        background: "rgba(34,211,238,0.03)",
        border: "1px solid rgba(34,211,238,0.15)",
        borderRadius: 28, padding: "28px 28px", marginBottom: 40,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(34,211,238,0.04),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(34,211,238,0.6)", textTransform: "uppercase", marginBottom: 8 }}>
              ADMIN · KRITAGYA DAS
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: CYAN, letterSpacing: "-0.03em", marginBottom: 8 }}>
              Full Admin Access — Always Free
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 480 }}>
              As the platform creator, you and Laila (Karaveera Nivasini Dasi) have permanent full access to all Prema-Pulse Transmitter features with no subscription required. Admin mode unlocks white-label settings, user analytics, post performance tracking, and the ability to manage content for all Sacred Healing members.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 16, padding: "12px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🔱</div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: CYAN, textTransform: "uppercase" }}>AKASHA INFINITY</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Admin Override Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{
        background: `linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))`,
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 28, padding: "36px 28px", textAlign: "center",
        boxShadow: "0 0 60px rgba(212,175,55,0.06)",
        animation: "bannerGlow 4s ease-in-out infinite",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: G, letterSpacing: "-0.04em", marginBottom: 8 }}>
          Ready to go viral?
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 28px" }}>
          Join the Sacred Healing creator community. Upload. Speak. Transmit.<br />
          Every post is a Vedic Light-Code reaching the souls who need it.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{
            background: `linear-gradient(135deg, ${G}, #F0D060)`,
            border: "none", borderRadius: 16, padding: "16px 36px",
            fontFamily: "inherit", fontWeight: 900, fontSize: 14,
            color: "#050505", cursor: "pointer", letterSpacing: "0.05em",
            boxShadow: "0 4px 30px rgba(212,175,55,0.4)",
          }}>
            START FOR €9/MONTH →
          </button>
          <button style={{
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 16, padding: "16px 28px",
            fontFamily: "inherit", fontWeight: 700, fontSize: 13,
            color: G, cursor: "pointer",
          }}>
            LIFETIME ACCESS — €111
          </button>
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 16, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          sacredhealing.lovable.app · Siddha-Quantum Intelligence 2050
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STORE PAGE (with banner)
───────────────────────────────────────────── */
function StorePage({ onViewProduct }) {
  const STORE_ITEMS = [
    { icon: "🎵", name: "432Hz Healing Bundle", desc: "7 sacred frequency tracks", price: "€19", cat: "Audio" },
    { icon: "📿", name: "Vedic Mantra Collection", desc: "108 mantras with pronunciation guide", price: "€29", cat: "Digital" },
    { icon: "🌿", name: "Ayurvedic Dosha Kit", desc: "Complete diagnostic + remedy guide", price: "€39", cat: "Guide" },
    { icon: "🔮", name: "Jyotish Birth Chart Reading", desc: "Personalised Vedic astrology report", price: "€55", cat: "Service" },
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", color: "rgba(212,175,55,0.4)", textTransform: "uppercase", marginBottom: 8 }}>
          SACRED HEALING
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.04em", margin: 0 }}>
          Creative Soul Store
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
          Tools, transmissions & sacred resources for your healing path
        </p>
      </div>

      {/* ★ THE BANNER */}
      <StoreBanner onViewProduct={onViewProduct} />

      {/* Store grid */}
      <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 16 }}>
        ALL PRODUCTS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {STORE_ITEMS.map((item, i) => (
          <div key={i} style={{
            background: GLASS, border: `1px solid ${GBORDER}`, borderRadius: 20,
            padding: "20px 18px", cursor: "pointer", transition: "all 0.3s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = GBORDER}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(212,175,55,0.4)", textTransform: "uppercase", marginBottom: 4 }}>{item.cat}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14, lineHeight: 1.4 }}>{item.desc}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: G }}>{item.price}</span>
              <button style={{
                background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 10, padding: "5px 12px", fontSize: 10, fontWeight: 700,
                color: G, fontFamily: "inherit", cursor: "pointer",
              }}>Add →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("store"); // "store" | "product"

  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      color: "rgba(255,255,255,0.85)",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes starFloat {
          0%,100%{transform:translateY(0) scale(1);opacity:var(--op,0.2)}
          50%{transform:translateY(-28px) scale(1.4);opacity:calc(var(--op,0.2)*2.5)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes bannerGlow {
          0%,100%{box-shadow:0 0 40px rgba(212,175,55,0.05)}
          50%{box-shadow:0 0 80px rgba(212,175,55,0.12)}
        }
        @keyframes scanLine {
          0%{top:0%;opacity:0}
          10%{opacity:1}
          90%{opacity:1}
          100%{top:100%;opacity:0}
        }
        @keyframes blip {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.4;transform:scale(0.7)}
        }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.3);border-radius:3px}
      `}</style>

      <StarField />

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,5,5,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: G, letterSpacing: "-0.04em" }}>
            SACRED HEALING
          </div>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Creative Soul Store</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: CYAN, textTransform: "uppercase" }}>
            Admin
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${G}, #F0D060)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#050505" }}>K</div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 80px" }}>
        {view === "store" && <StorePage onViewProduct={() => setView("product")} />}
        {view === "product" && <ProductPage onBack={() => setView("store")} />}
      </main>
    </div>
  );
}
