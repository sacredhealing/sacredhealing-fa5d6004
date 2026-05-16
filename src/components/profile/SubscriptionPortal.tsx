import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StripeDetails {
  tier: string;
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

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  membership_tier: string;
  created_at: string;
  stripe_customer_id: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; glyph: string; color: string; glow: string; price: string; features: string[]; }> = {
  free:             { label: "Akasha Free",      glyph: "◈", color: "rgba(255,255,255,0.4)", glow: "rgba(255,255,255,0.1)",  price: "Free",           features: ["Basic transmissions", "Community access", "Free meditations"] },
  "prana-flow":     { label: "Prana-Flow",        glyph: "⟁", color: "#22D3EE",              glow: "rgba(34,211,238,0.25)",  price: "€19/mo",         features: ["All free features", "Siddha audio library", "Vedic astrology", "Jyotish curriculum"] },
  "siddha-quantum": { label: "Siddha-Quantum",    glyph: "⬡", color: "#D4AF37",              glow: "rgba(212,175,55,0.35)", price: "€45/mo",         features: ["All Prana-Flow features", "Quantum Apothecary", "Scalar transmissions", "Living Portrait"] },
  "akasha-infinity":{ label: "Akasha-Infinity",   glyph: "∞", color: "#D4AF37",              glow: "rgba(212,175,55,0.5)",  price: "€1,111 Lifetime", features: ["Everything, forever", "Sovereign lifetime access", "All future features", "1:1 Siddha field"] },
};

const TIER_ORDER = ["free", "prana-flow", "siddha-quantum", "akasha-infinity"];

const ADMIN_EMAILS = ["sacredhealingvibe@gmail.com", "laila.amrouche@gmail.com"];

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

  const [profile, setProfile]             = useState<any>(null);
  const [stripeData, setStripeData]       = useState<StripeDetails | null>(null);
  const [loading, setLoading]             = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [adminUsers, setAdminUsers]       = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading]   = useState(false);
  const [activeTab, setActiveTab]         = useState<"overview" | "change" | "receipts" | "admin">("overview");
  const [msg, setMsg]                     = useState<{ text: string; ok: boolean } | null>(null);

  const userEmail = user?.email ?? "";
  const isAdminUser = isAdmin || ADMIN_EMAILS.includes(userEmail);

  useEffect(() => {
    if (!isOpen || !user) return;
    setActiveTab("overview");
    setCancelConfirm(false);
    setMsg(null);
    setStripeData(null);
    loadProfile();
  }, [isOpen, user]);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier, created_at, full_name, stripe_customer_id")
        .eq("id", user!.id)
        .single();
      setProfile(data);
      // Also try to load live Stripe data
      loadStripeData();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

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

  async function loadAdminUsers() {
    setAdminLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, membership_tier, created_at, stripe_customer_id")
        .order("created_at", { ascending: false });
      setAdminUsers((data || []) as unknown as AdminUser[]);
    } catch (e) { console.error(e); }
    finally { setAdminLoading(false); }
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
    } catch (e: any) {
      setMsg({ text: e.message || "Could not reactivate.", ok: false });
    } finally { setCancelLoading(false); }
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
    } catch (e) { console.error(e); }
    finally { setPortalLoading(false); }
  }

  if (!isOpen) return null;

  const tier = stripeData?.tier ?? profile?.membership_tier ?? "free";
  const tc   = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const isPaid     = tier !== "free";
  const isLifetime = tier === "akasha-infinity";
  const memberSince = stripeData?.memberSince ?? profile?.created_at ?? null;
  const daysLeft    = stripeData?.daysRemaining ?? null;
  const periodEnd   = stripeData?.periodEnd ?? null;
  const cancelAtEnd = stripeData?.cancelAtPeriodEnd ?? false;
  const currentIdx  = TIER_ORDER.indexOf(tier);
  const upgrades    = TIER_ORDER.slice(currentIdx + 1).map(t => ({ key: t, ...TIER_CONFIG[t] }));
  const downgrades  = TIER_ORDER.slice(1, currentIdx).map(t => ({ key: t, ...TIER_CONFIG[t] }));

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const lbl: React.CSSProperties = { color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 };
  const card: React.CSSProperties = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" };
  const tabBtn = (t: string): React.CSSProperties => ({
    flex: 1, padding: "9px 0", borderRadius: 14, border: "none", cursor: "pointer",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    background: activeTab === t ? "rgba(212,175,55,0.15)" : "transparent",
    color: activeTab === t ? "#D4AF37" : "rgba(255,255,255,0.35)",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 9000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(94vw,700px)", maxHeight: "92vh", overflowY: "auto", background: "rgba(6,6,6,0.98)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 40, padding: "36px 40px", zIndex: 9001, boxShadow: "0 0 100px rgba(212,175,55,0.07), 0 40px 120px rgba(0,0,0,0.9)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <p style={{ ...lbl, marginBottom: 6 }}>SOVEREIGN BILLING SANCTUM</p>
            <h2 style={{ color: "#D4AF37", fontSize: 24, fontWeight: 900, letterSpacing: "-0.05em", margin: 0, textShadow: "0 0 20px rgba(212,175,55,0.3)" }}>Your Subscription</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 38, height: 38, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 18, padding: 4 }}>
          <button onClick={() => setActiveTab("overview")} style={tabBtn("overview")}>⬡ My Plan</button>
          <button onClick={() => setActiveTab("change")} style={tabBtn("change")}>⟁ Change</button>
          <button onClick={() => setActiveTab("receipts")} style={tabBtn("receipts")}>◈ Receipts</button>
          {isAdminUser && (
            <button onClick={() => { setActiveTab("admin"); loadAdminUsers(); }} style={{ ...tabBtn("admin"), color: activeTab === "admin" ? "#D4AF37" : "rgba(212,175,55,0.3)", background: activeTab === "admin" ? "rgba(212,175,55,0.15)" : "transparent" }}>
              ✦ Admin
            </button>
          )}
        </div>

        {/* Message banner */}
        {msg && (
          <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 14, background: msg.ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${msg.ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, color: msg.ok ? "#22c55e" : "#ef4444", fontSize: 13, lineHeight: 1.5 }}>
            {msg.text}
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.1)", borderTopColor: "#D4AF37", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Accessing Akasha records...</p>
          </div>

        ) : activeTab === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Tier hero card */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tc.glow}`, borderRadius: 26, padding: 26, boxShadow: `0 0 40px ${tc.glow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${tc.glow},rgba(0,0,0,0.5))`, border: `1px solid ${tc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: tc.color, flexShrink: 0 }}>{tc.glyph}</div>
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
                  <p style={lbl}>SUBSCRIBED</p>
                  <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>{fmt(memberSince)}</p>
                </div>
              )}
              <div style={card}>
                <p style={lbl}>STATUS</p>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: isPaid ? "#22c55e" : "rgba(255,255,255,0.25)", boxShadow: isPaid ? "0 0 7px #22c55e" : "none", flexShrink: 0 }} />
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                    {isLifetime ? "Eternal" : cancelAtEnd ? "Cancelling" : isPaid ? "Active" : "Free"}
                  </span>
                </div>
              </div>
            </div>

            {/* Days remaining bar */}
            {!isLifetime && daysLeft !== null && (
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

            {/* Action buttons */}
            {isPaid && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setActiveTab("change")} style={{ flex: 1, padding: "12px 0", background: "linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, color: "#D4AF37", fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
                  ⟁ Change Plan
                </button>
                <button onClick={openStripePortal} disabled={portalLoading} style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
                  {portalLoading ? "..." : "💳 Payment"}
                </button>
              </div>
            )}

            {/* Reactivate if cancelling */}
            {cancelAtEnd && (
              <button onClick={handleReactivate} disabled={cancelLoading} style={{ width: "100%", padding: "12px 0", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 16, color: "#22c55e", fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
                {cancelLoading ? "Reactivating..." : "↩ Reactivate Subscription"}
              </button>
            )}

            {/* Cancel zone */}
            {isPaid && !isLifetime && !cancelAtEnd && (
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
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>Your subscription won't renew. You keep full access until {periodEnd ? fmt(periodEnd) : "your billing period ends"}.</p>
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
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>You are in the free field. Activate a tier to unlock the full transmission stack.</p>
                <button onClick={() => setActiveTab("change")} style={{ padding: "12px 28px", background: "linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.07))", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 14, color: "#D4AF37", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>✦ See Plans →</button>
              </div>
            )}
          </div>

        ) : activeTab === "change" ? (
          /* ── CHANGE PLAN TAB ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.6 }}>Upgrades apply immediately with proration. Downgrades take effect next billing cycle.</p>

            {upgrades.length > 0 && (
              <>
                <p style={{ ...lbl, color: "rgba(34,197,94,0.7)" }}>⬆ UPGRADE</p>
                {upgrades.map(t => <PlanCard key={t.key} config={t} isUpgrade onOpenPortal={openStripePortal} />)}
              </>
            )}

            {downgrades.length > 0 && (
              <>
                <p style={{ ...lbl, marginTop: 6 }}>⬇ DOWNGRADE</p>
                {downgrades.map(t => <PlanCard key={t.key} config={t} isUpgrade={false} onOpenPortal={openStripePortal} />)}
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

        ) : activeTab === "receipts" ? (
          /* ── RECEIPTS TAB ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stripeLoading && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center" }}>Loading receipts...</p>}
            {stripeData?.invoices && stripeData.invoices.length > 0 ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 4 }}>Your {stripeData.invoices.length} most recent receipts</p>
                {stripeData.invoices.map(inv => (
                  <div key={inv.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 4 }}>{fmt(inv.date)}</p>
                      <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>{inv.amount.toFixed(2)} {inv.currency}</p>
                      {inv.number && <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{inv.number}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: inv.status === "paid" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${inv.status === "paid" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 7, padding: "3px 9px", fontSize: 9, fontWeight: 800, color: inv.status === "paid" ? "#22c55e" : "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>{inv.status}</span>
                      {inv.pdf && <a href={inv.pdf} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "5px 12px", color: "#D4AF37", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>PDF</a>}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <p style={{ fontSize: 28, marginBottom: 10 }}>◈</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 20 }}>
                  {!isPaid ? "No receipts yet. Activate a plan to begin." : "Loading your receipt history..."}
                </p>
              </div>
            )}
            {isPaid && (
              <button onClick={openStripePortal} disabled={portalLoading} style={{ width: "100%", marginTop: 6, padding: "12px 0", background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                {portalLoading ? "Opening..." : "View all in Stripe Portal →"}
              </button>
            )}
          </div>

        ) : activeTab === "admin" && isAdminUser ? (
          /* ── ADMIN TAB ── */
          <div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>
              {adminLoading ? "Loading all users..." : `${adminUsers.length} members in the field`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {adminUsers.map(u => {
                const utc = TIER_CONFIG[u.membership_tier] ?? TIER_CONFIG.free;
                return (
                  <div key={u.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18, color: utc.color, flexShrink: 0 }}>{utc.glyph}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.full_name || "—"}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>Joined {fmt(u.created_at)}</p>
                    </div>
                    <span style={{ background: `${utc.glow}`, border: `1px solid ${utc.color}`, borderRadius: 8, padding: "3px 10px", fontSize: 9, fontWeight: 800, color: utc.color, whiteSpace: "nowrap", letterSpacing: "0.06em" }}>
                      {utc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

      </div>
    </>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ config, isUpgrade, onOpenPortal }: { config: any; isUpgrade: boolean; onOpenPortal: () => void }) {
  const isInfinity = config.key === "akasha-infinity";
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
      <button onClick={onOpenPortal} style={{ display: "block", width: "100%", marginTop: 14, padding: "11px 0", background: isInfinity ? "linear-gradient(135deg,#D4AF37,#B8960C)" : isUpgrade ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${isInfinity ? "#D4AF37" : isUpgrade ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, color: isInfinity ? "#050505" : isUpgrade ? "#D4AF37" : "rgba(255,255,255,0.4)", fontWeight: 800, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", cursor: "pointer" }}>
        {isInfinity ? "∞ Claim Infinity" : isUpgrade ? `Upgrade to ${config.label}` : `Downgrade to ${config.label}`}
      </button>
    </div>
  );
}
