// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useMembership } from "@/hooks/useMembership";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StripeDetails {
  status: string;
  memberSince: string | null;
  periodEnd: number | null;
  daysRemaining: number | null;
  cancelAtPeriodEnd: boolean;
  isLifetime: boolean;
  invoices: {
    id: string; number: string | null; amount: number;
    currency: string; date: number; status: string | null; pdf: string | null;
  }[];
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, {
  label: string; glyph: string; color: string; glow: string; price: string; features: string[];
}> = {
  free:              { label: "Free Seeker",      glyph: "◯", color: "rgba(255,255,255,0.4)", glow: "rgba(255,255,255,0.08)",  price: "Free",            features: ["Basic transmissions", "Community access", "Free meditations"] },
  "prana-flow":      { label: "Prana-Flow",        glyph: "◈", color: "#22D3EE",              glow: "rgba(34,211,238,0.2)",    price: "€19/mo",          features: ["All free features", "Siddha audio library", "Vedic astrology", "Jyotish curriculum"] },
  "siddha-quantum":  { label: "Siddha-Quantum",    glyph: "✦", color: "#D4AF37",              glow: "rgba(212,175,55,0.25)",   price: "€45/mo",          features: ["All Prana-Flow features", "Quantum Apothecary", "Scalar transmissions", "Living Portrait"] },
  "akasha-infinity": { label: "Akasha-Infinity",   glyph: "∞", color: "#D4AF37",              glow: "rgba(212,175,55,0.4)",    price: "€1,111 Lifetime", features: ["Everything, forever", "Sovereign lifetime access", "All future features", "1:1 Siddha field"] },
};

const TIER_ORDER = ["free", "prana-flow", "siddha-quantum", "akasha-infinity"];

// ─── Checkout URLs — these go through existing Stripe checkout flow ───────────
const CHECKOUT_ROUTES: Record<string, string> = {
  "prana-flow":      "/prana-flow",
  "siddha-quantum":  "/siddha-quantum",
  "akasha-infinity": "/akasha-infinity",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(ts: string | number): string {
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("en-SE", { year: "numeric", month: "short", day: "numeric" });
}

function DaysBar({ days }: { days: number }) {
  const pct = Math.min(100, Math.round((days / 30) * 100));
  const color = days < 5 ? "#ef4444" : days < 10 ? "#f59e0b" : "#22c55e";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase" }}>DAYS REMAINING</span>
        <span style={{ color, fontSize: 13, fontWeight: 800 }}>{days} days</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, boxShadow: `0 0 8px ${color}`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { isOpen: boolean; onClose: () => void; }

export function SubscriptionPortal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  // ✦ THE FIX: use the same useMembership hook the entire app uses
  const { tier, subscriptionEnd, adminGranted, refresh: refreshMembership } = useMembership();

  const [stripeData, setStripeData] = useState<StripeDetails | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "change" | "receipts">("overview");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setActiveTab("overview");
    setCancelConfirm(false);
    setMsg(null);
    setStripeData(null);
    loadStripeData();
  }, [isOpen, user]);

  async function loadStripeData() {
    setStripeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("stripe-subscription-details", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data && !res.data.error) setStripeData(res.data as StripeDetails);
    } catch (e) { console.error(e); }
    finally { setStripeLoading(false); }
  }

  async function handleCancel() {
    setCancelLoading(true); setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-cancel-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "cancel" },
      });
      if (res.data?.error) throw new Error(res.data.error);
      setMsg({ text: "Subscription cancelled. You keep full access until your billing period ends.", ok: true });
      setCancelConfirm(false);
      loadStripeData();
      refreshMembership();
    } catch (e: any) {
      setMsg({ text: e.message || "Could not cancel. Please try again.", ok: false });
    } finally { setCancelLoading(false); }
  }

  async function handleReactivate() {
    setCancelLoading(true); setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-cancel-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "reactivate" },
      });
      if (res.data?.error) throw new Error(res.data.error);
      setMsg({ text: "Subscription reactivated. Your plan continues as normal.", ok: true });
      loadStripeData();
      refreshMembership();
    } catch (e: any) {
      setMsg({ text: e.message || "Could not reactivate.", ok: false });
    } finally { setCancelLoading(false); }
  }

  async function openStripePortal() {
    setPortalLoading(true); setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-subscription-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data?.portalUrl) {
        window.open(res.data.portalUrl, "_blank");
      } else {
        setActiveTab("change");
        setMsg({ text: "No billing portal found. Choose a plan below.", ok: true });
      }
    } catch (e: any) {
      setMsg({ text: "Could not open billing portal. Try again.", ok: false });
    } finally { setPortalLoading(false); }
  }

  if (!isOpen) return null;

  // ─── Derived state — tier comes from useMembership (same as rest of app) ──
  const tc = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const isPaid = tier !== "free";
  const isLifetime = tier === "akasha-infinity";

  // For date/timing info prefer Stripe data, fall back to subscriptionEnd from useMembership
  const daysLeft = stripeData?.daysRemaining ?? null;
  const periodEnd = stripeData?.periodEnd ?? null;
  const cancelAtEnd = stripeData?.cancelAtPeriodEnd ?? false;
  const memberSince = stripeData?.memberSince ?? null;

  const currentIdx = TIER_ORDER.indexOf(tier);
  const upgrades = TIER_ORDER.slice(currentIdx + 1).map(t => ({ key: t, ...TIER_CONFIG[t] }));
  const downgrades = TIER_ORDER.slice(1, currentIdx).map(t => ({ key: t, ...TIER_CONFIG[t] }));

  const lbl: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800,
    letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8,
  };
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 20, padding: "18px 20px",
  };
  const tabBtn = (t: string): React.CSSProperties => ({
    flex: 1, padding: "9px 0", borderRadius: 14, border: "none", cursor: "pointer",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    background: activeTab === t ? "rgba(212,175,55,0.15)" : "transparent",
    color: activeTab === t ? "#D4AF37" : "rgba(255,255,255,0.35)",
  });

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 9000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(94vw,640px)", maxHeight: "92vh", overflowY: "auto", background: "rgba(6,6,6,0.98)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 40, padding: "36px 36px", zIndex: 9001, boxShadow: "0 0 100px rgba(212,175,55,0.07), 0 40px 120px rgba(0,0,0,0.9)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ ...lbl, marginBottom: 6 }}>SOVEREIGN BILLING SANCTUM</p>
            <h2 style={{ color: "#D4AF37", fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em", margin: 0, textShadow: "0 0 20px rgba(212,175,55,0.3)" }}>
              Your Subscription
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 38, height: 38, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>

        {/* Admin-granted badge */}
        {adminGranted && (
          <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 14, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
            ✦ Admin-granted access · {tc.label}
          </div>
        )}

        {/* Tabs — 3 only, admin moved to UserManagementPanel */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 18, padding: 4 }}>
          <button onClick={() => setActiveTab("overview")} style={tabBtn("overview")}>◈ My Plan</button>
          <button onClick={() => setActiveTab("change")}   style={tabBtn("change")}>⟁ Change Plan</button>
          <button onClick={() => setActiveTab("receipts")} style={tabBtn("receipts")}>✦ Receipts</button>
        </div>

        {/* Message banner */}
        {msg && (
          <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 14, background: msg.ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${msg.ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, color: msg.ok ? "#22c55e" : "#ef4444", fontSize: 13, lineHeight: 1.5 }}>
            {msg.text}
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Tier hero card */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tc.glow}`, borderRadius: 26, padding: 26, boxShadow: `0 0 40px ${tc.glow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${tc.glow},rgba(0,0,0,0.5))`, border: `1px solid ${tc.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: tc.color, flexShrink: 0 }}>{tc.glyph}</div>
                <div style={{ flex: 1 }}>
                  <p style={lbl}>CURRENT PLAN</p>
                  <p style={{ color: tc.color, fontSize: 20, fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>{tc.label}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={lbl}>RATE</p>
                  <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>{tc.price}</p>
                </div>
              </div>
              {tc.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ color: tc.color, fontSize: 11 }}>✦</span>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {memberSince && (
                <div style={card}>
                  <p style={lbl}>MEMBER SINCE</p>
                  <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>{fmt(memberSince)}</p>
                </div>
              )}
              <div style={card}>
                <p style={lbl}>STATUS</p>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: isPaid ? "#22c55e" : "rgba(255,255,255,0.25)", boxShadow: isPaid ? "0 0 7px #22c55e" : "none", flexShrink: 0 }} />
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                    {isLifetime ? "Eternal" : adminGranted ? "Admin-Granted" : cancelAtEnd ? "Cancelling" : isPaid ? "Active" : "Free"}
                  </span>
                </div>
              </div>

              {/* Days bar */}
              {!isLifetime && !adminGranted && daysLeft !== null && (
                <div style={card}>
                  <DaysBar days={daysLeft} />
                  {periodEnd && (
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                      {cancelAtEnd ? "⚠ Access ends" : "Renews"} {fmt(periodEnd)}
                    </p>
                  )}
                </div>
              )}

              {/* Lifetime badge */}
              {isLifetime && (
                <div style={{ ...card, border: "1px solid rgba(212,175,55,0.25)", textAlign: "center", padding: 20 }}>
                  <p style={{ color: "#D4AF37", fontSize: 22, margin: "0 0 4px" }}>∞</p>
                  <p style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, margin: 0 }}>Eternal Sovereign Access</p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 4 }}>No renewals. No limits. No end.</p>
                </div>
              )}

              {/* Stripe loading shimmer */}
              {stripeLoading && !stripeData && !adminGranted && isPaid && (
                <div style={card}>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Loading billing info…</p>
                </div>
              )}
            </div>

            {/* Actions for paid Stripe users */}
            {isPaid && !adminGranted && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setActiveTab("change")} style={{ flex: 1, padding: "12px 0", background: "linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, color: "#D4AF37", fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
                  ⟁ Change Plan
                </button>
                <button onClick={openStripePortal} disabled={portalLoading} style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
                  {portalLoading ? "…" : "💳 Payment"}
                </button>
              </div>
            )}

            {/* Reactivate */}
            {cancelAtEnd && !adminGranted && (
              <button onClick={handleReactivate} disabled={cancelLoading} style={{ width: "100%", padding: "12px 0", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 16, color: "#22c55e", fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
                {cancelLoading ? "Reactivating..." : "↩ Reactivate Subscription"}
              </button>
            )}

            {/* Cancel zone */}
            {isPaid && !isLifetime && !cancelAtEnd && !adminGranted && (
              <div style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 18, padding: 18 }}>
                <p style={{ ...lbl, color: "rgba(239,68,68,0.4)" }}>CANCEL</p>
                {!cancelConfirm ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600, margin: 0 }}>Cancel Subscription</p>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 3 }}>Keep access until period ends</p>
                    </div>
                    <button onClick={() => setCancelConfirm(true)} style={{ padding: "8px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Cancel Plan
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Are you sure you want to cancel?</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
                      Your subscription won't renew. You keep full access until {periodEnd ? fmt(periodEnd) : "your billing period ends"}.
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleCancel} disabled={cancelLoading} style={{ flex: 1, padding: "11px 0", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                      </button>
                      <button onClick={() => setCancelConfirm(false)} style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Keep Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Free tier CTA */}
            {!isPaid && (
              <div style={{ background: "rgba(212,175,55,0.04)", border: "1px dashed rgba(212,175,55,0.2)", borderRadius: 22, padding: 22, textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
                  You are in the free field. Activate a tier to unlock the full transmission stack.
                </p>
                <button onClick={() => setActiveTab("change")} style={{ padding: "12px 28px", background: "linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.07))", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 14, color: "#D4AF37", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  ✦ See Plans →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CHANGE PLAN TAB ── */}
        {activeTab === "change" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.6 }}>
              Upgrades apply immediately. Downgrades take effect next billing cycle.
            </p>

            {upgrades.length > 0 && (
              <>
                <p style={{ ...lbl, color: "rgba(34,197,94,0.7)" }}>⬆ UPGRADE</p>
                {upgrades.map(t => (
                  <PlanCard key={t.key} config={t} isUpgrade currentTier={tier} onOpenPortal={openStripePortal} />
                ))}
              </>
            )}

            {downgrades.length > 0 && (
              <>
                <p style={{ ...lbl, marginTop: 6 }}>⬇ DOWNGRADE</p>
                {downgrades.map(t => (
                  <PlanCard key={t.key} config={t} isUpgrade={false} currentTier={tier} onOpenPortal={openStripePortal} />
                ))}
              </>
            )}

            {upgrades.length === 0 && downgrades.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: 38, color: "#D4AF37", marginBottom: 10 }}>∞</p>
                <p style={{ color: "#D4AF37", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>You are at the Apex</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Akasha-Infinity is the highest transmission.</p>
              </div>
            )}
          </div>
        )}

        {/* ── RECEIPTS TAB ── */}
        {activeTab === "receipts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stripeLoading && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.1)", borderTopColor: "#D4AF37", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Loading receipts...</p>
              </div>
            )}
            {stripeData?.invoices && stripeData.invoices.length > 0 ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 4 }}>Your {stripeData.invoices.length} most recent receipts</p>
                {stripeData.invoices.map(inv => (
                  <div key={inv.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 4 }}>{fmt(inv.date)}</p>
                      <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>{inv.amount.toFixed(2)} {inv.currency.toUpperCase()}</p>
                      {inv.number && <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{inv.number}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: inv.status === "paid" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${inv.status === "paid" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 7, padding: "3px 9px", fontSize: 9, fontWeight: 800, color: inv.status === "paid" ? "#22c55e" : "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>{inv.status}</span>
                      {inv.pdf && <a href={inv.pdf} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "5px 12px", color: "#D4AF37", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>PDF</a>}
                    </div>
                  </div>
                ))}
              </>
            ) : !stripeLoading && (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <p style={{ fontSize: 28, marginBottom: 10 }}>◈</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 20 }}>
                  {!isPaid ? "No receipts yet. Activate a plan to begin." : "No receipts found yet."}
                </p>
              </div>
            )}
            {isPaid && !adminGranted && (
              <button onClick={openStripePortal} disabled={portalLoading} style={{ width: "100%", marginTop: 6, padding: "12px 0", background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                {portalLoading ? "Opening..." : "View all in Stripe Portal →"}
              </button>
            )}
          </div>
        )}

      </div>
    </>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ config, isUpgrade, currentTier, onOpenPortal }: {
  config: any; isUpgrade: boolean; currentTier: string; onOpenPortal: () => void;
}) {
  const isInfinity = config.key === "akasha-infinity";
  const checkoutRoutes: Record<string, string> = {
    "prana-flow":      "/prana-flow",
    "siddha-quantum":  "/siddha-quantum",
    "akasha-infinity": "/akasha-infinity",
  };

  const handleClick = () => {
    // For upgrades on free tier, navigate to checkout page (same Stripe flow)
    // For existing subscribers, use Stripe portal to switch plan
    if (currentTier === "free") {
      window.location.href = checkoutRoutes[config.key] || "/membership";
    } else {
      onOpenPortal();
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${config.glow}`, borderRadius: 22, padding: 20, boxShadow: `0 0 20px ${config.glow}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24, color: config.color }}>{config.glyph}</span>
          <div>
            <p style={{ color: config.color, fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>{config.label}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{config.price}</p>
          </div>
        </div>
        <span style={{ background: isUpgrade ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isUpgrade ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`, borderRadius: 7, padding: "3px 9px", fontSize: 9, fontWeight: 800, color: isUpgrade ? "#22c55e" : "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
          {isUpgrade ? "UPGRADE" : "DOWNGRADE"}
        </span>
      </div>
      {config.features.slice(0, 3).map((f: string, i: number) => (
        <div key={i} style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: config.color, fontSize: 9 }}>✦</span>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{f}</span>
        </div>
      ))}
      <button
        onClick={handleClick}
        style={{ display: "block", width: "100%", marginTop: 14, padding: "11px 0", background: isInfinity ? "linear-gradient(135deg,#D4AF37,#B8960C)" : isUpgrade ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${isInfinity ? "#D4AF37" : isUpgrade ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, color: isInfinity ? "#050505" : isUpgrade ? "#D4AF37" : "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}
      >
        {isInfinity ? "∞ Claim Infinity" : isUpgrade ? `Upgrade to ${config.label}` : `Downgrade to ${config.label}`}
      </button>
    </div>
  );
}
