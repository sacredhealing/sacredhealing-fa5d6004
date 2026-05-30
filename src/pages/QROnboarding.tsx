/**
 * SQI 2050 — Sovereign QR Onboarding Portal
 * Route: /join?ref=AFFILIATE_CODE
 *
 * Flow:
 * 1. User scans QR → lands here with optional ?ref= affiliate code
 * 2. Creates account via social OAuth or email (Supabase Auth)
 * 3. Chooses tier (Free Seeker or paid) → Stripe checkout
 * 4. Affiliate ref preserved throughout via sessionStorage
 *
 * CRITICAL: Does NOT touch AffiliateID tracking or Stripe checkout logic.
 * Uses existing createCheckoutSession() and navigateToStripeCheckout() unchanged.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession } from "@/config/tierCheckout";
import { navigateToStripeCheckout } from "@/lib/stripeCheckoutNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/* ─── tier display config ───────────────────────────────────────────── */
const TIERS = [
  {
    key: "ATMA_SEED" as const,
    name: "Seeker",
    price: "Always free",
    isFree: true,
    desc: "Intro meditations · Community access · Siddha wisdom feed",
    glyph: "✦",
    glowColor: "rgba(255,255,255,0.7)",
    iconBg: "rgba(255,255,255,0.05)",
    iconBorder: "rgba(255,255,255,0.1)",
    badge: "Free",
    badgeBg: "rgba(255,255,255,0.06)",
    badgeColor: "rgba(255,255,255,0.4)",
    badgeBorder: "rgba(255,255,255,0.1)",
  },
  {
    key: "PRANA_FLOW" as const,
    name: "Prana-Flow",
    price: "€19 / month",
    isFree: false,
    desc: "Core meditations · Siddha AI · Healing audios",
    glyph: "◈",
    glowColor: "rgba(34,211,238,0.9)",
    iconBg: "rgba(34,211,238,0.07)",
    iconBorder: "rgba(34,211,238,0.18)",
    badge: null,
    badgeBg: "",
    badgeColor: "",
    badgeBorder: "",
  },
  {
    key: "SIDDHA_QUANTUM" as const,
    name: "Siddha-Quantum",
    price: "€45 / month",
    isFree: false,
    desc: "Bhrigu Oracle · Ayurveda AI · Voice scanner",
    glyph: "⚡",
    glowColor: "rgba(212,175,55,0.9)",
    iconBg: "rgba(212,175,55,0.08)",
    iconBorder: "rgba(212,175,55,0.22)",
    badge: "Popular",
    badgeBg: "rgba(212,175,55,0.12)",
    badgeColor: "#D4AF37",
    badgeBorder: "rgba(212,175,55,0.28)",
    featured: true,
  },
  {
    key: "AKASHA_INFINITY" as const,
    name: "Akasha-Infinity",
    price: "€1,111 lifetime",
    isFree: false,
    desc: "All transmissions · Eternal field access",
    glyph: "♾",
    glowColor: "rgba(167,139,250,0.9)",
    iconBg: "rgba(167,139,250,0.07)",
    iconBorder: "rgba(167,139,250,0.18)",
    badge: null,
    badgeBg: "",
    badgeColor: "",
    badgeBorder: "",
  },
] as const;

type TierKey = (typeof TIERS)[number]["key"];

/* ─── SVG star field ─────────────────────────────────────────────────── */
const STARS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  top: `${(i * 37 + 11) % 100}%`,
  left: `${(i * 53 + 7) % 100}%`,
  size: ((i * 7 + 3) % 12) / 10 + 0.4,
  opacity: ((i * 11 + 5) % 45) / 100 + 0.1,
}));

/* ─── component ──────────────────────────────────────────────────────── */
export default function QROnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const refCode = searchParams.get("ref") || "direct";

  // Persist affiliate ref so it survives OAuth redirect
  useEffect(() => {
    if (refCode && refCode !== "direct") {
      sessionStorage.setItem("affiliate_ref", refCode);
      localStorage.setItem("sqi_affiliate_id", refCode);
    }
  }, [refCode]);

  // If already logged in, skip auth section
  const [authDone, setAuthDone] = useState(!!user);
  useEffect(() => {
    if (user) setAuthDone(true);
  }, [user]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<TierKey | null>(null);

  /* ── social OAuth ── */
  const signInWithProvider = async (provider: "google" | "apple" | "facebook") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/join?ref=${refCode}`,
      },
    });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  /* ── email sign-up / sign-in ── */
  const handleEmailAuth = async () => {
    if (!email || !password) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/join?ref=${refCode}` },
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "Confirm your account then return here to choose your path.",
      });
      // Fire welcome email — non-blocking
      supabase.functions.invoke("send-welcome-email", {
        body: { email, name: email.split("@")[0], language: navigator.language },
      }).catch(() => {/* best-effort */});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      // If already exists, try sign-in
      if (msg.includes("already registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          toast({ title: "Login failed", description: signInError.message, variant: "destructive" });
        } else {
          setAuthDone(true);
        }
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  /* ── tier checkout ── */
  const handleTierSelect = async (tier: (typeof TIERS)[number]) => {
    if (!authDone && !user) {
      toast({
        title: "Create your account first",
        description: "Sign up above to activate your transmission path.",
      });
      return;
    }

    if (tier.isFree) {
      // Free tier — go straight to dashboard
      navigate("/dashboard");
      return;
    }

    setCheckoutLoading(tier.key);
    try {
      const affiliateId =
        sessionStorage.getItem("affiliate_ref") ||
        localStorage.getItem("sqi_affiliate_id") ||
        refCode ||
        "direct";
      const url = await createCheckoutSession(tier.key, affiliateId);
      navigateToStripeCheckout(url);
    } catch (err: unknown) {
      toast({
        title: "Checkout error",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  /* ── styles (inline for zero Tailwind coupling) ── */
  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: "#050505",
      border: "1px solid rgba(212,175,55,0.18)",
      borderRadius: 28,
      overflow: "hidden",
    },
    hero: {
      position: "relative",
      padding: "36px 24px 26px",
      textAlign: "center",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      overflow: "hidden",
    },
    eyebrow: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.5em",
      textTransform: "uppercase",
      color: "rgba(212,175,55,0.5)",
      marginBottom: 10,
    },
    title: {
      fontSize: 30,
      fontWeight: 900,
      letterSpacing: "-0.04em",
      color: "#D4AF37",
      lineHeight: 1.1,
      textShadow: "0 0 32px rgba(212,175,55,0.25)",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 14,
      color: "rgba(255,255,255,0.45)",
      lineHeight: 1.7,
    },
    section: { padding: "20px 20px 0" },
    sectionLabel: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.4em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.2)",
      marginBottom: 12,
      textAlign: "center",
    },
    socialGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 9,
      marginBottom: 11,
    },
    socialBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      padding: "13px 10px",
      borderRadius: 13,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.025)",
      cursor: "pointer",
    },
    socialLabel: {
      fontSize: 13,
      fontWeight: 700,
      color: "rgba(255,255,255,0.7)",
    },
    dividerRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      margin: "13px 0",
    },
    dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.05)" },
    dividerText: {
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.3em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.18)",
    },
    input: {
      width: "100%",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 11,
      padding: "12px 14px",
      color: "rgba(255,255,255,0.8)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 14,
      outline: "none",
      marginBottom: 9,
    },
    ctaBtn: {
      width: "100%",
      background: "#D4AF37",
      border: "none",
      borderRadius: 13,
      padding: "15px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "#050505",
      cursor: "pointer",
      boxShadow: "0 0 24px rgba(212,175,55,0.22)",
      marginBottom: 16,
    },
    goldLine: { height: 1, background: "rgba(212,175,55,0.07)", margin: "18px 0" },
    tiersSection: { padding: "0 18px 18px" },
    tierHeading: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.4em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.18)",
      marginBottom: 12,
      textAlign: "center",
    },
    footerNote: {
      textAlign: "center",
      fontSize: 10,
      color: "rgba(255,255,255,0.12)",
      padding: "0 18px 20px",
      letterSpacing: "0.04em",
    },
  };

  /* ── social icon helpers ── */
  const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.5 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.2a3.59 3.59 0 01-1.56 2.36v1.96h2.52C14.7 12.7 15.5 10.62 15.5 8.18z" fill="rgba(66,133,244,0.9)" />
      <path d="M8 16c2.1 0 3.87-.7 5.16-1.88l-2.52-1.96c-.7.47-1.59.75-2.64.75-2.03 0-3.75-1.37-4.36-3.21H1.04v2.02A7.99 7.99 0 008 16z" fill="rgba(52,168,83,0.9)" />
      <path d="M3.64 9.7A4.8 4.8 0 013.39 8c0-.59.1-1.16.25-1.7V4.28H1.04A8.01 8.01 0 000 8c0 1.29.31 2.51.86 3.59l2.78-2.15z" fill="rgba(251,188,4,0.9)" />
      <path d="M8 3.18c1.14 0 2.17.39 2.98 1.16l2.24-2.24A7.96 7.96 0 008 0 7.99 7.99 0 001.04 4.28L3.64 6.3C4.25 4.55 5.97 3.18 8 3.18z" fill="rgba(234,67,53,0.9)" />
    </svg>
  );

  const AppleIcon = () => (
    <svg width="14" height="17" viewBox="0 0 15 18" fill="none">
      <path d="M12.44 9.47c-.02-2.04 1.67-3.03 1.75-3.08-.96-1.4-2.44-1.59-2.97-1.61-1.27-.13-2.48.75-3.12.75-.65 0-1.65-.73-2.72-.71-1.4.02-2.7.82-3.41 2.07C.51 9.2 1.53 13.24 3 15.2c.73 1.04 1.6 2.21 2.73 2.17 1.1-.04 1.52-.7 2.85-.7 1.33 0 1.7.7 2.86.68 1.18-.02 1.93-1.06 2.65-2.11.84-1.2 1.18-2.37 1.2-2.43-.03-.01-2.33-.89-2.35-3.34z" fill="rgba(255,255,255,0.8)" />
      <path d="M10.27 3.1c.6-.74 1.01-1.76.9-2.78-.87.04-1.94.58-2.57 1.31-.56.64-1.05 1.67-.92 2.65.97.07 1.96-.49 2.59-1.18z" fill="rgba(255,255,255,0.8)" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M16 8A8 8 0 100 8a8 8 0 0016 0z" fill="rgba(24,119,242,0.6)" />
      <path d="M11.1 10.24l.38-2.48H9.1V6.22c0-.68.33-1.34 1.4-1.34h1.08V2.77s-.98-.17-1.92-.17c-1.96 0-3.24 1.19-3.24 3.33v1.83H4.34v2.48h2.08V16c.42.07.85.1 1.28.1s.86-.03 1.28-.1v-5.76h1.8.32z" fill="rgba(255,255,255,0.95)" />
    </svg>
  );

  /* ── QR glyph ── */
  const QRGlyph = () => (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" style={{ display: "block" }}>
      <rect x="2" y="2" width="14" height="14" rx="2.5" stroke="rgba(212,175,55,0.55)" strokeWidth="1.5" fill="none" />
      <rect x="6" y="6" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.45)" />
      <rect x="26" y="2" width="14" height="14" rx="2.5" stroke="rgba(212,175,55,0.55)" strokeWidth="1.5" fill="none" />
      <rect x="30" y="6" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.45)" />
      <rect x="2" y="26" width="14" height="14" rx="2.5" stroke="rgba(212,175,55,0.55)" strokeWidth="1.5" fill="none" />
      <rect x="6" y="30" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.45)" />
      <rect x="26" y="26" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.32)" />
      <rect x="34" y="26" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.32)" />
      <rect x="26" y="34" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.32)" />
      <rect x="34" y="34" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.5)" />
      <rect x="18" y="2" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.18)" />
      <rect x="18" y="10" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.13)" />
      <rect x="2" y="18" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.18)" />
      <rect x="18" y="18" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.28)" />
      <rect x="18" y="26" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.18)" />
      <rect x="18" y="34" width="6" height="6" rx="1.5" fill="rgba(212,175,55,0.13)" />
    </svg>
  );

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes sqi-pulse { 0%{transform:scale(1);opacity:.45} 100%{transform:scale(1.32);opacity:0} }
        .sqi-pulse-ring { animation: sqi-pulse 3s ease-out infinite; }
        .sqi-social-btn:hover { border-color: rgba(212,175,55,0.3) !important; }
        .sqi-tier:hover { border-color: rgba(212,175,55,0.3) !important; }
        .sqi-input::placeholder { color: rgba(255,255,255,0.2); }
        .sqi-input:focus { border-color: rgba(212,175,55,0.35) !important; }
      `}</style>

      <div style={s.page}>
        <div style={s.card}>

          {/* ── HERO ── */}
          <div style={s.hero as React.CSSProperties}>
            {/* star field */}
            {STARS.map((st) => (
              <div
                key={st.id}
                style={{
                  position: "absolute",
                  top: st.top,
                  left: st.left,
                  width: st.size,
                  height: st.size,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.6)",
                  opacity: st.opacity,
                  pointerEvents: "none",
                }}
              />
            ))}
            {/* sacred sigil */}
            <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 16px" }}>
              <div
                className="sqi-pulse-ring"
                style={{
                  position: "absolute",
                  inset: -5,
                  borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.12)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.22)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 7,
                  borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.13)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 16,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.07)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    color: "#D4AF37",
                    textShadow:
                      "0 0 18px rgba(212,175,55,0.9), 0 0 36px rgba(212,175,55,0.4)",
                  }}
                >
                  ✦
                </span>
              </div>
            </div>

            <p style={s.eyebrow as React.CSSProperties}>Siddha Quantum Nexus</p>
            <h1 style={s.title as React.CSSProperties}>Enter the<br />Akasha Field</h1>
            <p style={s.subtitle as React.CSSProperties}>
              Create your sovereign account and choose your path.<br />
              Start free — upgrade anytime.
            </p>
          </div>

          {/* ── SOCIAL AUTH ── */}
          {!authDone && (
            <div style={s.section}>
              <p style={s.sectionLabel as React.CSSProperties}>Continue with</p>
              <div style={s.socialGrid}>
                {(
                  [
                    { provider: "google" as const, label: "Google", Icon: GoogleIcon, glow: "rgba(66,133,244,0.22)", bg: "rgba(66,133,244,0.12)" },
                    { provider: "apple" as const, label: "Apple", Icon: AppleIcon, glow: "rgba(255,255,255,0.12)", bg: "rgba(255,255,255,0.08)" },
                    { provider: "facebook" as const, label: "Facebook", Icon: FacebookIcon, glow: "rgba(24,119,242,0.22)", bg: "rgba(24,119,242,0.12)" },
                  ] as const
                ).map(({ provider, label, Icon, glow, bg }) => (
                  <button
                    key={provider}
                    className="sqi-social-btn"
                    style={s.socialBtn}
                    onClick={() => signInWithProvider(provider)}
                    type="button"
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: bg,
                        boxShadow: `0 0 12px ${glow}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon />
                    </div>
                    <span style={s.socialLabel}>{label}</span>
                  </button>
                ))}

                {/* Email takes full width */}
                <button
                  className="sqi-social-btn"
                  style={{ ...s.socialBtn, gridColumn: "1 / -1" }}
                  onClick={() => {
                    document.getElementById("sqi-email-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  type="button"
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: "rgba(212,175,55,0.1)",
                      boxShadow: "0 0 12px rgba(212,175,55,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <rect x="0.5" y="0.5" width="13" height="10" rx="2" stroke="rgba(212,175,55,0.7)" strokeWidth="1" fill="none" />
                      <path d="M1 1.5L7 6.5L13 1.5" stroke="rgba(212,175,55,0.7)" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={s.socialLabel}>Continue with Email</span>
                </button>
              </div>

              {/* Email form */}
              <div id="sqi-email-section">
                <div style={s.dividerRow as React.CSSProperties}>
                  <div style={s.dividerLine} />
                  <span style={s.dividerText as React.CSSProperties}>or email</span>
                  <div style={s.dividerLine} />
                </div>
                <input
                  className="sqi-input"
                  style={s.input}
                  type="email"
                  placeholder="Your sacred email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="sqi-input"
                  style={s.input}
                  type="password"
                  placeholder="Create a password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  style={s.ctaBtn as React.CSSProperties}
                  onClick={handleEmailAuth}
                  disabled={authLoading}
                  type="button"
                >
                  {authLoading ? "Activating..." : "Create Free Account →"}
                </button>
              </div>
            </div>
          )}

          {authDone && (
            <div style={{ padding: "18px 20px 0", textAlign: "center" }}>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(212,175,55,0.7)",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                ✦ Account active — choose your transmission path below
              </p>
            </div>
          )}

          <div style={s.goldLine} />

          {/* ── TIER SELECTION ── */}
          <div style={s.tiersSection as React.CSSProperties}>
            <p style={s.tierHeading as React.CSSProperties}>Choose your transmission path</p>

            {TIERS.map((tier) => {
              const isLoading = checkoutLoading === tier.key;
              const featured = "featured" in tier && tier.featured;
              return (
                <button
                  key={tier.key}
                  className="sqi-tier"
                  type="button"
                  onClick={() => handleTierSelect(tier)}
                  disabled={isLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: 16,
                    border: featured
                      ? "1px solid rgba(212,175,55,0.38)"
                      : "1px solid rgba(255,255,255,0.07)",
                    background: featured
                      ? "rgba(212,175,55,0.04)"
                      : "rgba(255,255,255,0.02)",
                    marginBottom: 9,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.2s",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {/* icon */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: tier.iconBg,
                      border: `1px solid ${tier.iconBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        textShadow: `0 0 14px ${tier.glowColor}, 0 0 28px ${tier.glowColor.replace("0.9", "0.4")}`,
                        lineHeight: 1,
                      }}
                    >
                      {tier.glyph}
                    </span>
                  </div>

                  {/* text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: "rgba(255,255,255,0.9)",
                        letterSpacing: "-0.01em",
                        margin: 0,
                      }}
                    >
                      {isLoading ? "Opening checkout..." : tier.name}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: tier.isFree ? "rgba(255,255,255,0.38)" : "#D4AF37",
                        margin: "2px 0",
                      }}
                    >
                      {tier.price}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {tier.desc}
                    </p>
                  </div>

                  {/* badge */}
                  {tier.badge && (
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        background: tier.badgeBg,
                        color: tier.badgeColor,
                        border: `1px solid ${tier.badgeBorder}`,
                        padding: "3px 8px",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      {tier.badge}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={s.goldLine} />

          {/* ── QR BANNER ── */}
          <div style={{ margin: "0 18px 18px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(212,175,55,0.18)",
                borderRadius: 16,
                padding: "16px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 58,
                  height: 58,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(212,175,55,0.12)",
                  boxShadow: "0 0 16px rgba(212,175,55,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QRGlyph />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(212,175,55,0.45)",
                    marginBottom: 5,
                  }}
                >
                  Your Sovereign QR
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Once your account is active, find your unique QR code in your Profile. Share it and earn 30% commission on every member you bring into the field.
                </p>
              </div>
            </div>
          </div>

          <p style={s.footerNote as React.CSSProperties}>
            Protected by Supabase Auth · Secure Stripe checkout · Sacred Healing Sweden
          </p>
        </div>
      </div>
    </>
  );
}
