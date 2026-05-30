import React from "react";
/**
 * SQI 2050 — Landing Page
 * Mobile-first. Warm, clear, readable for all ages.
 * No mention of "AI". Large text. High contrast.
 * Primary CTA → /join (QR onboarding flow)
 */
import { useNavigate } from "react-router-dom";

const GOLD = "#D4AF37";
const BG = "#050505";

/* ── SVG helpers ── */
const YantraSvg = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" stroke={GOLD} strokeWidth="0.5" opacity="0.35"/>
    <polygon points="36,6 66,54 6,54" stroke={GOLD} strokeWidth="1.3" fill="none" opacity="0.9"/>
    <polygon points="36,66 6,18 66,18" stroke={GOLD} strokeWidth="1.3" fill="none" opacity="0.9"/>
    <polygon points="36,14 60,50 12,50" stroke={GOLD} strokeWidth="0.7" fill="none" opacity="0.5"/>
    <polygon points="36,58 12,22 60,22" stroke={GOLD} strokeWidth="0.7" fill="none" opacity="0.5"/>
    <circle cx="36" cy="36" r="2" fill={GOLD} opacity="0.95"/>
  </svg>
);

const features = [
  {
    svg: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <ellipse cx="22" cy="22" rx="4" ry="10" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.9"/>
        <ellipse cx="22" cy="22" rx="4" ry="10" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.9" transform="rotate(60 22 22)"/>
        <ellipse cx="22" cy="22" rx="4" ry="10" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.9" transform="rotate(120 22 22)"/>
        <ellipse cx="22" cy="22" rx="4" ry="10" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.55" transform="rotate(180 22 22)"/>
        <ellipse cx="22" cy="22" rx="4" ry="10" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.55" transform="rotate(240 22 22)"/>
        <ellipse cx="22" cy="22" rx="4" ry="10" stroke={GOLD} strokeWidth="1" fill="none" opacity="0.55" transform="rotate(300 22 22)"/>
        <circle cx="22" cy="22" r="2.5" fill={GOLD} opacity="0.95"/>
      </svg>
    ),
    title: "Sacred Meditations & Mantras",
    desc: "Guided sessions rooted in the Tamil Siddha lineage. Calm your mind, open your heart, and restore your body through the power of sacred sound.",
  },
  {
    svg: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <polygon points="22,4 40,36 4,36" stroke={GOLD} strokeWidth="1.1" fill="none" opacity="0.9"/>
        <polygon points="22,40 4,8 40,8" stroke={GOLD} strokeWidth="1.1" fill="none" opacity="0.9"/>
        <polygon points="22,11 36,32 8,32" stroke={GOLD} strokeWidth="0.6" fill="none" opacity="0.5"/>
        <polygon points="22,33 8,12 36,12" stroke={GOLD} strokeWidth="0.6" fill="none" opacity="0.5"/>
        <circle cx="22" cy="22" r="2.5" fill={GOLD} opacity="0.95"/>
      </svg>
    ),
    title: "Vedic Astrology & Jyotish",
    desc: "32 deep-study modules. Discover the cosmic map of your soul, your life purpose, and the sacred timing of your healing journey.",
  },
  {
    svg: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M22 6 C14 12 14 18 22 22 C30 26 30 32 22 38" stroke={GOLD} strokeWidth="1.3" fill="none" opacity="0.9" strokeLinecap="round"/>
        <path d="M16 8 C24 14 24 20 16 24 C8 28 8 34 16 40" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.5" strokeLinecap="round"/>
        <path d="M28 8 C20 14 20 20 28 24 C36 28 36 34 28 40" stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.5" strokeLinecap="round"/>
        <circle cx="22" cy="22" r="2.5" fill={GOLD} opacity="0.95"/>
      </svg>
    ),
    title: "Ayurveda & Body Intelligence",
    desc: "Learn your unique constitution (Dosha), track your wellbeing, and receive personalised wisdom from 5,000 years of Vedic healing science.",
  },
  {
    svg: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="17" stroke={GOLD} strokeWidth="0.6" fill="none" opacity="0.3"/>
        <path d="M6 22 Q12 14 18 22 Q24 30 30 22 Q36 14 38 22" stroke={GOLD} strokeWidth="1.3" fill="none" opacity="0.9" strokeLinecap="round"/>
        <path d="M6 28 Q12 20 18 28 Q24 36 30 28" stroke={GOLD} strokeWidth="0.7" fill="none" opacity="0.45" strokeLinecap="round"/>
        <circle cx="22" cy="22" r="2.5" fill={GOLD} opacity="0.95"/>
      </svg>
    ),
    title: "Healing Frequencies & Sound",
    desc: "Music and tones crafted to restore cellular harmony, reduce stress, and activate deep healing — simply press play and let the transmission work.",
  },
  {
    svg: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <path d="M22 34 C18 30 10 26 10 20 C10 15 13 12 17 12 C19.5 12 21.5 13.5 22 15 C22.5 13.5 24.5 12 27 12 C31 12 34 15 34 20 C34 26 26 30 22 34Z" stroke={GOLD} strokeWidth="1" fill="rgba(212,175,55,0.08)" opacity="0.9"/>
        <circle cx="22" cy="21" r="2" fill={GOLD} opacity="0.9"/>
      </svg>
    ),
    title: "Community & Live Sessions",
    desc: "Join a warm, global community of seekers. Share your journey, attend live healing circles, and connect with others on the same sovereign path.",
  },
  {
    svg: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <circle cx="22" cy="22" r="5" stroke={GOLD} strokeWidth="1.1" fill="none" opacity="0.9"/>
        <circle cx="22" cy="22" r="2" fill={GOLD} opacity="0.9"/>
        <line x1="22" y1="4" x2="22" y2="11" stroke={GOLD} strokeWidth="1" opacity="0.7" strokeLinecap="round"/>
        <line x1="22" y1="33" x2="22" y2="40" stroke={GOLD} strokeWidth="1" opacity="0.7" strokeLinecap="round"/>
        <line x1="4" y1="22" x2="11" y2="22" stroke={GOLD} strokeWidth="1" opacity="0.7" strokeLinecap="round"/>
        <line x1="33" y1="22" x2="40" y2="22" stroke={GOLD} strokeWidth="1" opacity="0.7" strokeLinecap="round"/>
        <circle cx="22" cy="4" r="1.2" fill={GOLD} opacity="0.6"/>
        <circle cx="22" cy="40" r="1.2" fill={GOLD} opacity="0.6"/>
        <circle cx="4" cy="22" r="1.2" fill={GOLD} opacity="0.6"/>
        <circle cx="40" cy="22" r="1.2" fill={GOLD} opacity="0.6"/>
      </svg>
    ),
    title: "Bhrigu Oracle & Soul Readings",
    desc: "Receive your personalised Vedic destiny reading. Understand your karmic path, your gifts, and the deeper purpose woven into your life.",
  },
];

const tiers = [
  {
    name: "Seeker",
    price: "Free",
    priceNote: "Always",
    desc: "Begin your journey. Access introductory meditations, the community, and weekly Siddha wisdom.",
    cta: "Start Free",
    featured: false,
    isFree: true,
  },
  {
    name: "Prana-Flow",
    price: "€19",
    priceNote: "per month",
    desc: "Core meditations, healing audios, Siddha teachings, and the sacred sound library.",
    cta: "Begin",
    featured: false,
    isFree: false,
  },
  {
    name: "Siddha-Quantum",
    price: "€45",
    priceNote: "per month",
    desc: "The full field — Bhrigu Oracle, Ayurveda scanner, Shakti Cycle, all transmissions, and every healing audio.",
    cta: "Activate",
    featured: true,
    isFree: false,
  },
  {
    name: "Akasha-Infinity",
    price: "€1,111",
    priceNote: "once, forever",
    desc: "Eternal access to everything. For those called to the sovereign path. One payment. Lifetime transmission.",
    cta: "Go Sovereign",
    featured: false,
    isFree: false,
  },
];

const testimonials = [
  {
    text: "I have tried so many apps and online programmes. Nothing has touched me like this. The healing audios alone changed my sleep within two weeks.",
    name: "Ingrid, 58",
    location: "Norway",
  },
  {
    text: "The Ayurveda scanner helped me understand why I had been struggling with energy for years. Simple, clear, and deeply accurate.",
    name: "Maria, 52",
    location: "Spain",
  },
  {
    text: "I was nervous about technology. But everything here is so easy to use. The community is warm and the meditations are truly healing.",
    name: "Eva, 61",
    location: "Sweden",
  },
];

const ss: Record<string, React.CSSProperties> = {
  page: { background: BG, color: "#fff", fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", overflowX: "hidden" },
  // NAV
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky" as const, top: 0, background: "rgba(5,5,5,0.95)", backdropFilter: "blur(20px)", zIndex: 100 },
  navLogo: { fontSize: 10, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase" as const, color: GOLD },
  navBtn: { background: GOLD, color: BG, fontSize: 10, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase" as const, padding: "10px 20px", borderRadius: 100, border: "none", cursor: "pointer" },
  // HERO
  hero: { padding: "64px 24px 72px", textAlign: "center" as const, maxWidth: 600, margin: "0 auto" },
  heroEye: { fontSize: 10, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase" as const, color: GOLD, opacity: 0.7, marginBottom: 20, display: "block" },
  heroTitle: { fontSize: "clamp(36px, 10vw, 64px)", fontWeight: 900, letterSpacing: "-0.04em", color: GOLD, lineHeight: 1.05, marginBottom: 20, fontFamily: "Georgia, serif" },
  heroSub: { fontSize: 19, lineHeight: 1.8, color: "rgba(255,255,255,0.65)", marginBottom: 36, fontWeight: 400 },
  heroCta: { background: GOLD, color: BG, fontSize: 13, fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase" as const, padding: "18px 40px", borderRadius: 100, border: "none", cursor: "pointer", display: "inline-block", boxShadow: "0 0 40px rgba(212,175,55,0.3)", marginBottom: 14 },
  heroSecondary: { display: "block", fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 10, letterSpacing: "0.05em" },
  // SECTION
  section: { padding: "64px 24px", maxWidth: 640, margin: "0 auto" },
  sectionHead: { fontSize: 10, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase" as const, color: GOLD, opacity: 0.7, marginBottom: 12, textAlign: "center" as const },
  sectionTitle: { fontSize: "clamp(26px, 7vw, 40px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.15, marginBottom: 16, textAlign: "center" as const },
  sectionSub: { fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.55)", textAlign: "center" as const, marginBottom: 0 },
  goldLine: { height: 1, background: "linear-gradient(to right,transparent,rgba(212,175,55,0.25),transparent)", margin: "0 24px" },
  // FEATURE CARDS
  featCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px", marginBottom: 14 },
  featTitle: { fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 10, marginTop: 14 },
  featDesc: { fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.6)", fontWeight: 400 },
  // TIERS
  tierCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 24px", marginBottom: 14 },
  tierCardFeatured: { background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 20, padding: "28px 24px", marginBottom: 14 },
  tierName: { fontSize: 11, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: GOLD, marginBottom: 6 },
  tierPrice: { fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1 },
  tierPriceSub: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 14, marginTop: 4 },
  tierDesc: { fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.6)", marginBottom: 22 },
  tierCta: { display: "block", width: "100%", textAlign: "center" as const, padding: "15px", borderRadius: 14, fontSize: 12, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase" as const, border: "none", cursor: "pointer" },
  tierCtaGold: { background: GOLD, color: BG },
  tierCtaOutline: { background: "transparent", color: GOLD, border: `1px solid rgba(212,175,55,0.3)` },
  // TESTIMONIALS
  testCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "28px 24px", marginBottom: 14 },
  testText: { fontSize: 18, lineHeight: 1.85, color: "rgba(255,255,255,0.72)", fontStyle: "italic" as const, fontFamily: "Georgia, serif", marginBottom: 18 },
  testName: { fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: "0.1em" },
  testLoc: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 },
  // QUOTE
  quoteWrap: { padding: "56px 24px", maxWidth: 560, margin: "0 auto", textAlign: "center" as const },
  quoteText: { fontSize: 20, lineHeight: 1.9, color: "rgba(255,255,255,0.6)", fontStyle: "italic" as const, fontFamily: "Georgia, serif", marginBottom: 18 },
  quoteSig: { fontSize: 11, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.5)" },
  // FOOTER
  footer: { padding: "40px 24px 48px", textAlign: "center" as const, borderTop: "1px solid rgba(255,255,255,0.05)" },
  footerName: { fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 10, lineHeight: 1.7 },
  footerLegal: { fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.3em", textTransform: "uppercase" as const },
};

export default function Landing() {
  const navigate = useNavigate();
  const go = () => navigate("/join");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes lp-pulse { 0%,100%{opacity:0.45;transform:scale(1)} 50%{opacity:0.9;transform:scale(1.08)} }
        .lp-sigil { animation: lp-pulse 4s ease-in-out infinite; }
        .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 0 56px rgba(212,175,55,0.45) !important; }
        .lp-cta { transition: all 0.25s ease; }
        .lp-tier:hover { border-color: rgba(212,175,55,0.35) !important; }
        .lp-tier { transition: border-color 0.2s; }
      `}</style>

      <div style={ss.page}>

        {/* NAV */}
        <nav style={ss.nav}>
          <span style={ss.navLogo}>✦ Sacred Healing</span>
          <button style={ss.navBtn} className="lp-cta" onClick={go}>Join Free</button>
        </nav>

        {/* HERO */}
        <div style={ss.hero}>
          <div style={{ marginBottom: 28 }} className="lp-sigil">
            <YantraSvg size={80} />
          </div>
          <span style={ss.heroEye}>Siddha Quantum Nexus</span>
          <h1 style={ss.heroTitle}>Ancient Wisdom.<br/>Modern Healing.</h1>
          <p style={ss.heroSub}>
            A sacred space for women and seekers ready to heal deeply — through Vedic teachings, healing sound, Ayurveda, and the living wisdom of the Siddha masters.
          </p>
          <button style={ss.heroCta} className="lp-cta" onClick={go}>
            Begin Your Journey — Free
          </button>
          <span style={ss.heroSecondary}>No credit card needed · Start in 60 seconds</span>
        </div>

        <div style={ss.goldLine}/>

        {/* TRUST BAR */}
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>
            Trusted by members in Sweden · Norway · Spain · UK · USA · India
          </p>
        </div>

        <div style={ss.goldLine}/>

        {/* WHAT IS THIS */}
        <div style={{ ...ss.section, paddingTop: 72, paddingBottom: 56 }}>
          <p style={ss.sectionHead}>What is Sacred Healing?</p>
          <h2 style={ss.sectionTitle}>A home for your healing — in your hands</h2>
          <p style={{ ...ss.sectionSub, fontSize: 18, lineHeight: 1.85 }}>
            Sacred Healing brings together the 5,000-year-old Siddha and Vedic tradition with modern wellness tools — all in one simple app. Meditations. Sound healing. Astrology. Ayurveda. Community. All in one place, on any device.
          </p>
        </div>

        <div style={ss.goldLine}/>

        {/* FEATURES */}
        <div style={{ ...ss.section, paddingTop: 64, paddingBottom: 40 }}>
          <p style={ss.sectionHead}>What's Inside</p>
          <h2 style={{ ...ss.sectionTitle, marginBottom: 32 }}>Everything you need to heal and grow</h2>
          {features.map((f, i) => (
            <div key={i} style={ss.featCard} className="lp-tier">
              {f.svg}
              <h3 style={ss.featTitle}>{f.title}</h3>
              <p style={ss.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={ss.goldLine}/>

        {/* TESTIMONIALS */}
        <div style={{ ...ss.section, paddingTop: 64, paddingBottom: 40 }}>
          <p style={ss.sectionHead}>From Our Members</p>
          <h2 style={{ ...ss.sectionTitle, marginBottom: 32 }}>Real healing. Real people.</h2>
          {testimonials.map((t, i) => (
            <div key={i} style={ss.testCard}>
              <p style={ss.testText}>"{t.text}"</p>
              <p style={ss.testName}>{t.name}</p>
              <p style={ss.testLoc}>{t.location}</p>
            </div>
          ))}
        </div>

        <div style={ss.goldLine}/>

        {/* TIERS */}
        <div style={{ ...ss.section, paddingTop: 64, paddingBottom: 40 }}>
          <p style={ss.sectionHead}>Membership</p>
          <h2 style={{ ...ss.sectionTitle, marginBottom: 8 }}>Start free. Go deeper when you're ready.</h2>
          <p style={{ ...ss.sectionSub, marginBottom: 36, fontSize: 17 }}>
            No pressure. Begin with a free Seeker account and upgrade when the field calls you deeper.
          </p>
          {tiers.map((t, i) => (
            <div key={i} style={t.featured ? ss.tierCardFeatured : ss.tierCard} className="lp-tier">
              {t.featured && (
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: GOLD, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", padding: "4px 10px", borderRadius: 6, display: "inline-block", marginBottom: 14 }}>
                  Most Popular
                </div>
              )}
              <p style={ss.tierName}>{t.name}</p>
              <p style={ss.tierPrice}>{t.price}</p>
              <p style={ss.tierPriceSub}>{t.priceNote}</p>
              <p style={ss.tierDesc}>{t.desc}</p>
              <button
                style={{ ...ss.tierCta, ...(t.featured ? ss.tierCtaGold : ss.tierCtaOutline) }}
                className="lp-cta"
                onClick={go}
              >
                {t.cta} →
              </button>
            </div>
          ))}
        </div>

        <div style={ss.goldLine}/>

        {/* QUOTE */}
        <div style={ss.quoteWrap}>
          <YantraSvg size={48}/>
          <p style={{ ...ss.quoteText, marginTop: 24 }}>
            "The wisdom of the Siddha masters is not locked in temples and books. It is alive, it is here, and it is waiting for you."
          </p>
          <p style={ss.quoteSig}>— Adam (Kritagya Das) · Sacred Healing</p>
        </div>

        <div style={ss.goldLine}/>

        {/* FINAL CTA */}
        <div style={{ ...ss.section, paddingTop: 72, paddingBottom: 72, textAlign: "center" as const }}>
          <YantraSvg size={56}/>
          <h2 style={{ ...ss.sectionTitle, marginTop: 24, marginBottom: 16 }}>Ready to begin?</h2>
          <p style={{ ...ss.sectionSub, marginBottom: 36, fontSize: 18 }}>
            Join thousands of seekers. Start completely free. No technology experience needed — just an open heart.
          </p>
          <button style={ss.heroCta} className="lp-cta" onClick={go}>
            Create Your Free Account
          </button>
          <br/>
          <span style={ss.heroSecondary}>Takes less than one minute</span>
        </div>

        <div style={ss.goldLine}/>

        {/* FOOTER */}
        <footer style={ss.footer}>
          <div style={{ marginBottom: 20 }}>
            <YantraSvg size={36}/>
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: GOLD, opacity: 0.6, marginBottom: 12 }}>Sacred Healing · Siddha Quantum Nexus</p>
          <p style={ss.footerName}>
            Founded by Adam (Kritagya Das) & Laila (Karaveera Nivasini Dasi)<br/>
            Sweden · siddhaquantumnexus.com
          </p>
          <p style={ss.footerLegal}>© 2026 Sacred Healing · For spiritual purposes</p>
        </footer>

      </div>
    </>
  );
}
