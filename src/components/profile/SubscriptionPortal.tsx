import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";

const TIER_CONFIG: Record<string, { label: string; glyph: string; color: string; glow: string; price: string; features: string[]; }> = {
  free: {
    label: "Akasha Free", glyph: "◈", color: "rgba(255,255,255,0.4)", glow: "rgba(255,255,255,0.1)", price: "Free",
    features: ["Daily meditation nudges", "3 free meditations", "Community access", "Basic breathing exercises", "Daily quotes"],
  },
  "prana-flow": {
    label: "Prana-Flow", glyph: "⟁", color: "#22D3EE", glow: "rgba(34,211,238,0.25)", price: "€19/mo",
    features: ["Full Vedic Jyotish + Guru Chat", "Full Ayurvedic Scan + Chat", "Vastu Guide for Home", "All Healing Music — Full Library", "Full Meditation & Mantra Library"],
  },
  "siddha-quantum": {
    label: "Siddha-Quantum", glyph: "⬡", color: "#D4AF37", glow: "rgba(212,175,55,0.35)", price: "€45/mo",
    features: ["Digital Nadi Scanner", "Practice Scantions", "Siddha Portal Access", "Full Healing Audios & Transmissions", "Sri Yantra Universal Shield", "Everything in Prana-Flow"],
  },
  "akasha-infinity": {
    label: "Akasha-Infinity", glyph: "∞", color: "#D4AF37", glow: "rgba(212,175,55,0.5)", price: "€1,111 (Lifetime)",
    features: ["Everything, forever", "Sovereign lifetime access", "All future features included", "VIP community badge", "Direct practitioner access", "Free coaching session"],
  },
};

const TIER_ORDER = ["free", "prana-flow", "siddha-quantum", "akasha-infinity"];

const UPGRADE_TIERS = [
  { key: "prana-flow", description: "Enter the field. Begin your Nada transmission journey." },
  { key: "siddha-quantum", description: "Activate the full Quantum Intelligence stack." },
  { key: "akasha-infinity", description: "Eternal access. One transmission. Infinite becoming." },
];

function formatDate(iso: string | number): string {
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
  return d.toLocaleDateString("en-SE", { year: "numeric", month: "long", day: "numeric" });
}

function daysBetween(from: string | Date): number {
  const start = typeof from === "string" ? new Date(from) : from;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

interface SubscriptionPortalProps { isOpen: boolean; onClose: () => void; }

export function SubscriptionPortal({ isOpen, onClose }: SubscriptionPortalProps) {
  const { user } = useAuth();
  const { tier, isAdmin, adminGranted, subscriptionEnd, loading: memLoading, refresh } = useMembership();
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [activeSince, setActiveSince] = useState<string | null>(null);
  const [stripeSubId, setStripeSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "receipts" | "upgrade">("overview");

  useEffect(() => {
    if (!isOpen || !user) return;
    void load();
  }, [isOpen, user]);

  async function load() {
    setLoading(true);
    try {
      const [{ data: profile }, { data: mem }] = await Promise.all([
        supabase.from("profiles").select("created_at").eq("user_id", user!.id).maybeSingle(),
        supabase
          .from("user_memberships")
          .select("starts_at, stripe_subscription_id, status")
          .eq("user_id", user!.id)
          .order("starts_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setMemberSince(profile?.created_at ?? null);
      setActiveSince(mem?.starts_at ?? profile?.created_at ?? null);
      setStripeSubId(mem?.stripe_subscription_id ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function openStripePortal() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-subscription-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data?.portalUrl) window.open(res.data.portalUrl, "_blank");
      else window.open("https://billing.stripe.com", "_blank");
    } catch (e) {
      console.error(e);
    } finally {
      setPortalLoading(false);
    }
  }

  async function cancelSubscription() {
    if (!confirm("Are you sure you want to cancel your subscription? You will keep access until the end of the current billing period.")) return;
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-cancel-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      alert("Your subscription has been scheduled for cancellation.");
      await refresh();
    } catch (e) {
      console.error(e);
      // Fallback: open Stripe portal so user can cancel manually
      await openStripePortal();
    } finally {
      setPortalLoading(false);
    }
  }

  if (!isOpen) return null;

  const tc = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const isPaid = tier !== "free";
  const isLifetime = tier === "akasha-infinity";
  const availableUpgrades = UPGRADE_TIERS.filter(t => TIER_ORDER.indexOf(t.key) > TIER_ORDER.indexOf(tier));
  const daysActive = activeSince ? daysBetween(activeSince) : 0;
  const isFullyLoading = memLoading || loading;

  const tabStyle = (t: string) => ({
    flex: 1, padding: "10px 0", borderRadius: 16, border: "none", cursor: "pointer",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const,
    transition: "all 0.2s",
    background: activeTab === t ? "rgba(212,175,55,0.15)" : "transparent",
    color: activeTab === t ? "#D4AF37" : "rgba(255,255,255,0.4)",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 9000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(92vw,680px)", maxHeight: "90vh", overflowY: "auto", background: "rgba(8,8,8,0.97)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 40, padding: 40, zIndex: 9001, boxShadow: "0 0 80px rgba(212,175,55,0.08)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ color: "#D4AF37", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>SOVEREIGN BILLING SANCTUM</p>
            <h2 style={{ color: "#D4AF37", fontSize: 26, fontWeight: 900, letterSpacing: "-0.05em", margin: 0, textShadow: "0 0 20px rgba(212,175,55,0.3)" }}>Your Subscription</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 40, height: 40, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {isAdmin && (
          <div style={{ background: "linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.06))", border: "1px solid rgba(212,175,55,0.5)", borderRadius: 18, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 0 24px rgba(212,175,55,0.18)" }}>
            <span style={{ fontSize: 22, color: "#D4AF37" }}>👑</span>
            <div>
              <p style={{ color: "#D4AF37", fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", margin: 0 }}>SOVEREIGN ADMIN</p>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: "2px 0 0" }}>Full access to every transmission · All tiers unlocked</p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 28, background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 4 }}>
          {(["overview","receipts","upgrade"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
              {t === "overview" ? "⬡ Plan" : t === "receipts" ? "◈ Receipts" : "∞ Upgrade"}
            </button>
          ))}
        </div>

        {isFullyLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.15)", borderTopColor: "#D4AF37", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading your field...</p>
          </div>
        ) : activeTab === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Tier card */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tc.glow}`, borderRadius: 28, padding: 28, boxShadow: `0 0 40px ${tc.glow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg,${tc.glow},rgba(0,0,0,0.5))`, border: `1px solid ${tc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: tc.color }}>{tc.glyph}</div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 4 }}>CURRENT PLAN</p>
                  <p style={{ color: tc.color, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>{tc.label}</p>
                  {adminGranted && !isAdmin && (
                    <p style={{ color: "rgba(212,175,55,0.7)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "4px 0 0" }}>✦ Granted by Sovereign</p>
                  )}
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 4 }}>RATE</p>
                  <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>{tc.price}</p>
                </div>
              </div>
              {tc.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ color: tc.color, fontSize: 12 }}>✦</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 8 }}>STATUS</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isPaid || isAdmin ? "#22c55e" : "rgba(255,255,255,0.3)", boxShadow: isPaid || isAdmin ? "0 0 8px #22c55e" : "none" }} />
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{isAdmin ? "Sovereign" : isLifetime ? "Eternal" : isPaid ? "Active" : "Free"}</span>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 8 }}>DAYS ACTIVE</p>
                <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0 }}>{daysActive}<span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, marginLeft: 4 }}>days</span></p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 8 }}>{isLifetime ? "RENEWS" : subscriptionEnd ? "RENEWS" : "MEMBER SINCE"}</p>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {isLifetime ? "Never · ∞" : subscriptionEnd ? formatDate(subscriptionEnd) : memberSince ? formatDate(memberSince) : "—"}
                </p>
              </div>
            </div>

            {/* CTAs */}
            {isAdmin ? (
              <div style={{ background: "rgba(212,175,55,0.04)", border: "1px dashed rgba(212,175,55,0.3)", borderRadius: 24, padding: 24, textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>You hold Sovereign Admin. No billing applies — all tiers are open to you.</p>
              </div>
            ) : isPaid && !isLifetime ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => setActiveTab("upgrade")} style={{ width: "100%", padding: "15px 0", background: "linear-gradient(135deg,#D4AF37,#B8960C)", border: "none", borderRadius: 20, color: "#050505", fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                  ∞ Upgrade Tier
                </button>
                <button onClick={openStripePortal} disabled={portalLoading} style={{ width: "100%", padding: "13px 0", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 20, color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                  {portalLoading ? "Opening Portal..." : "⬡ Manage · Update Payment"}
                </button>
                <button onClick={cancelSubscription} disabled={portalLoading} style={{ width: "100%", padding: "12px 0", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                  Cancel Subscription
                </button>
              </div>
            ) : isLifetime ? (
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 24, padding: 24, textAlign: "center" }}>
                <p style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, margin: 0 }}>∞ You hold lifetime sovereignty. Nothing to renew.</p>
              </div>
            ) : (
              <div style={{ background: "rgba(212,175,55,0.04)", border: "1px dashed rgba(212,175,55,0.2)", borderRadius: 24, padding: 24, textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>You are in the free field. Activate a tier to unlock the full transmission stack.</p>
                <button onClick={() => setActiveTab("upgrade")} style={{ display: "inline-block", padding: "13px 32px", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 16, color: "#D4AF37", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>✦ Activate Your Tier</button>
              </div>
            )}
          </div>

        ) : activeTab === "receipts" ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Your full invoice history lives in the Stripe billing portal.</p>
            {isPaid && !isAdmin ? (
              <button onClick={openStripePortal} disabled={portalLoading} style={{ padding: "13px 32px", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 16, color: "#D4AF37", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                {portalLoading ? "Opening..." : "Open Billing Portal →"}
              </button>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No invoices on this account.</p>
            )}
          </div>

        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {availableUpgrades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: 40, marginBottom: 12, color: "#D4AF37" }}>∞</p>
                <p style={{ color: "#D4AF37", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>You are at the Apex</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Akasha-Infinity is the highest transmission.</p>
              </div>
            ) : availableUpgrades.map(upTier => {
              const uc = TIER_CONFIG[upTier.key];
              return (
                <div key={upTier.key} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${uc.glow}`, borderRadius: 24, padding: 24, boxShadow: `0 0 30px ${uc.glow}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 28, color: uc.color }}>{uc.glyph}</span>
                      <div>
                        <p style={{ color: uc.color, fontSize: 18, fontWeight: 900, margin: 0 }}>{uc.label}</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{upTier.description}</p>
                      </div>
                    </div>
                    <p style={{ color: "#fff", fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>{uc.price}</p>
                  </div>
                  {uc.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ color: uc.color, fontSize: 10 }}>✦</span>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{f}</span>
                    </div>
                  ))}
                  <a href="/pricing" style={{ display: "block", textAlign: "center", background: upTier.key === "akasha-infinity" ? "linear-gradient(135deg,#D4AF37,#B8960C)" : "rgba(212,175,55,0.12)", border: `1px solid ${uc.color}`, borderRadius: 16, padding: "13px 0", color: upTier.key === "akasha-infinity" ? "#050505" : "#D4AF37", fontWeight: 800, fontSize: 13, textDecoration: "none", marginTop: 16 }}>
                    {upTier.key === "akasha-infinity" ? "∞ Claim Infinity" : `Activate ${uc.label}`}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
