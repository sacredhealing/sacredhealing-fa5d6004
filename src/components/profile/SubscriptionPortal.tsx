import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  date: number;
  status: string | null;
  pdf: string | null;
  hostedUrl: string | null;
}

interface SubscriptionDetails {
  tier: string;
  status: string;
  memberSince: string | null;
  periodEnd: number | null;
  daysRemaining: number | null;
  cancelAtPeriodEnd: boolean;
  invoices: Invoice[];
  isLifetime: boolean;
}

const TIER_CONFIG: Record<string, { label: string; glyph: string; color: string; glow: string; price: string; features: string[]; }> = {
  free: { label: "Akasha Free", glyph: "◈", color: "rgba(255,255,255,0.4)", glow: "rgba(255,255,255,0.1)", price: "Free", features: ["Basic transmissions", "Community access", "Free meditations"] },
  "prana-flow": { label: "Prana-Flow", glyph: "⟁", color: "#22D3EE", glow: "rgba(34,211,238,0.25)", price: "€19/mo", features: ["All free features", "Siddha audio library", "Vedic astrology readings", "Jyotish curriculum"] },
  "siddha-quantum": { label: "Siddha-Quantum", glyph: "⬡", color: "#D4AF37", glow: "rgba(212,175,55,0.35)", price: "€45/mo", features: ["All Prana-Flow features", "AI Quantum Apothecary", "Scalar transmission sessions", "Living Portrait", "Priority support"] },
  "akasha-infinity": { label: "Akasha-Infinity", glyph: "∞", color: "#D4AF37", glow: "rgba(212,175,55,0.5)", price: "€1,111 (Lifetime)", features: ["Everything, forever", "Sovereign lifetime access", "All future features", "Inner Circle transmission", "1:1 Siddha field"] },
};

const UPGRADE_TIERS = [
  { key: "prana-flow", label: "Prana-Flow", price: "€19/mo", glyph: "⟁", color: "#22D3EE", description: "Enter the field. Begin your Nada transmission journey." },
  { key: "siddha-quantum", label: "Siddha-Quantum", price: "€45/mo", glyph: "⬡", color: "#D4AF37", description: "Activate the full Quantum Intelligence stack." },
  { key: "akasha-infinity", label: "Akasha-Infinity", price: "€1,111", glyph: "∞", color: "#D4AF37", description: "Eternal access. One transmission. Infinite becoming." },
];

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-SE", { year: "numeric", month: "long", day: "numeric" });
}
function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SE", { year: "numeric", month: "long", day: "numeric" });
}

interface SubscriptionPortalProps { isOpen: boolean; onClose: () => void; }

export function SubscriptionPortal({ isOpen, onClose }: SubscriptionPortalProps) {
  const { user } = useAuth();
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "receipts" | "upgrade">("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!isOpen || !user) return; fetchDetails(); }, [isOpen, user]);

  async function fetchDetails() {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-subscription-details", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.error) throw res.error;
      setDetails(res.data as SubscriptionDetails);
    } catch (e) { setError("Could not load subscription data. Please try again."); console.error(e); }
    finally { setLoading(false); }
  }

  async function openStripePortal() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const res = await supabase.functions.invoke("stripe-subscription-portal", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.error) throw res.error;
      if (res.data?.portalUrl) window.open(res.data.portalUrl, "_blank");
    } catch (e) { console.error(e); }
    finally { setPortalLoading(false); }
  }

  if (!isOpen) return null;
  const tierConfig = TIER_CONFIG[details?.tier ?? "free"] ?? TIER_CONFIG.free;
  const isPaid = details?.tier !== "free" && details?.tier != null;

  const tabStyle = (tab: string) => ({
    flex: 1, padding: "10px 0", borderRadius: 16, border: "none", cursor: "pointer",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const,
    background: activeTab === tab ? "rgba(212,175,55,0.15)" : "transparent",
    color: activeTab === tab ? "#D4AF37" : "rgba(255,255,255,0.4)",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 9000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(92vw,680px)", maxHeight: "90vh", overflowY: "auto", background: "rgba(8,8,8,0.97)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 40, padding: 40, zIndex: 9001, boxShadow: "0 0 80px rgba(212,175,55,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <p style={{ color: "#D4AF37", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>SOVEREIGN BILLING SANCTUM</p>
            <h2 style={{ color: "#D4AF37", fontSize: 26, fontWeight: 900, letterSpacing: "-0.05em", margin: 0, textShadow: "0 0 20px rgba(212,175,55,0.3)" }}>Your Subscription</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 40, height: 40, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 32, background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 4 }}>
          {(["overview","receipts","upgrade"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
              {tab === "overview" ? "⬡ Plan" : tab === "receipts" ? "◈ Receipts" : "∞ Upgrade"}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.1)", borderTopColor: "#D4AF37", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Accessing Akasha billing records...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 16 }}>{error}</p>
            <button onClick={fetchDetails} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Retry</button>
          </div>
        ) : activeTab === "overview" ? (
          <OverviewTab details={details!} tierConfig={tierConfig} isPaid={isPaid} onOpenPortal={openStripePortal} portalLoading={portalLoading} />
        ) : activeTab === "receipts" ? (
          <ReceiptsTab invoices={details?.invoices ?? []} onOpenPortal={openStripePortal} portalLoading={portalLoading} isPaid={isPaid} />
        ) : (
          <UpgradeTab currentTier={details?.tier ?? "free"} />
        )}
      </div>
    </>
  );
}

function OverviewTab({ details, tierConfig, isPaid, onOpenPortal, portalLoading }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tierConfig.glow}`, borderRadius: 28, padding: 28, boxShadow: `0 0 40px ${tierConfig.glow}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg,${tierConfig.glow},rgba(0,0,0,0.5))`, border: `1px solid ${tierConfig.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: tierConfig.color }}>{tierConfig.glyph}</div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 4 }}>CURRENT PLAN</p>
            <p style={{ color: tierConfig.color, fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>{tierConfig.label}</p>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 4 }}>RATE</p>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>{tierConfig.price}</p>
          </div>
        </div>
        {tierConfig.features.map((f: string, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ color: tierConfig.color, fontSize: 12 }}>✦</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{f}</span>
          </div>
        ))}
      </div>
      {isPaid && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {!details.isLifetime && details.daysRemaining !== null && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>DAYS REMAINING</p>
              <p style={{ color: details.daysRemaining < 7 ? "#ef4444" : "#D4AF37", fontSize: 24, fontWeight: 900, margin: 0 }}>{details.daysRemaining}</p>
              {details.cancelAtPeriodEnd && <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 600 }}>Cancels {details.periodEnd ? formatDate(details.periodEnd) : "soon"}</p>}
            </div>
          )}
          {!details.isLifetime && details.periodEnd && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>{details.cancelAtPeriodEnd ? "ACCESS ENDS" : "NEXT RENEWAL"}</p>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>{formatDate(details.periodEnd)}</p>
            </div>
          )}
          {details.isLifetime && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "18px 20px", gridColumn: "1/-1" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>TRANSMISSION STATUS</p>
              <p style={{ color: "#D4AF37", fontSize: 24, fontWeight: 900, margin: 0 }}>∞ Eternal Access</p>
            </div>
          )}
          {details.memberSince && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>MEMBER SINCE</p>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: 0 }}>{formatMemberSince(details.memberSince)}</p>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px 20px" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 8 }}>STATUS</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: details.status === "active" || details.status === "lifetime" ? "#22c55e" : "#ef4444" }} />
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, textTransform: "capitalize" }}>{details.status === "lifetime" ? "Eternal" : details.status}</span>
            </div>
          </div>
        </div>
      )}
      {!isPaid && (
        <div style={{ background: "rgba(212,175,55,0.04)", border: "1px dashed rgba(212,175,55,0.2)", borderRadius: 24, padding: 24, textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>You are in the free field. Activate a Siddha-Quantum tier to unlock the full transmission stack.</p>
          <a href="/pricing" style={{ display: "inline-block", padding: "13px 32px", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 16, color: "#D4AF37", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>✦ Activate Your Tier</a>
        </div>
      )}
      {isPaid && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onOpenPortal} disabled={portalLoading} style={{ width: "100%", padding: "15px 0", background: "linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.08))", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 20, color: "#D4AF37", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {portalLoading ? "Opening Portal..." : "⬡ Manage Subscription"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center" }}>Update payment method · Cancel · View all invoices in Stripe Portal</p>
        </div>
      )}
    </div>
  );
}

function ReceiptsTab({ invoices, onOpenPortal, portalLoading, isPaid }: any) {
  if (!isPaid || invoices.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{!isPaid ? "No invoices yet. Activate a plan to begin." : "No invoices found yet."}</p>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {invoices.map((inv: any) => (
        <div key={inv.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 4 }}>{formatDate(inv.date)}</p>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>{inv.amount.toFixed(2)} {inv.currency}</p>
            {inv.number && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{inv.number}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: inv.status === "paid" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${inv.status === "paid" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: inv.status === "paid" ? "#22c55e" : "#ef4444", textTransform: "uppercase" }}>{inv.status}</span>
            {inv.pdf && <a href={inv.pdf} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, padding: "6px 14px", color: "#D4AF37", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>PDF</a>}
          </div>
        </div>
      ))}
      <button onClick={onOpenPortal} disabled={portalLoading} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 8 }}>
        {portalLoading ? "Opening..." : "View all in Stripe Portal →"}
      </button>
    </div>
  );
}

function UpgradeTab({ currentTier }: { currentTier: string }) {
  const tierOrder = ["free","prana-flow","siddha-quantum","akasha-infinity"];
  const currentIndex = tierOrder.indexOf(currentTier);
  const availableUpgrades = UPGRADE_TIERS.filter(t => tierOrder.indexOf(t.key) > currentIndex);
  if (availableUpgrades.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <p style={{ fontSize: 40, marginBottom: 12, color: "#D4AF37" }}>∞</p>
      <p style={{ color: "#D4AF37", fontSize: 18, fontWeight: 700 }}>You are at the Apex</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Akasha-Infinity is the highest transmission.</p>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>Elevate your field. Each tier activates a deeper layer of the Siddha-Quantum Intelligence.</p>
      {availableUpgrades.map(tier => {
        const config = TIER_CONFIG[tier.key];
        return (
          <div key={tier.key} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${config.glow}`, borderRadius: 24, padding: 24, boxShadow: `0 0 30px ${config.glow}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 28, color: config.color }}>{config.glyph}</span>
                <div>
                  <p style={{ color: config.color, fontSize: 18, fontWeight: 900, margin: 0 }}>{config.label}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{tier.description}</p>
                </div>
              </div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>{config.price}</p>
            </div>
            {config.features.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: config.color, fontSize: 10 }}>✦</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{f}</span>
              </div>
            ))}
            <a href="/pricing" style={{ display: "block", textAlign: "center", background: tier.key === "akasha-infinity" ? "linear-gradient(135deg,#D4AF37,#B8960C)" : "rgba(212,175,55,0.12)", border: `1px solid ${config.color}`, borderRadius: 16, padding: "13px 0", color: tier.key === "akasha-infinity" ? "#050505" : "#D4AF37", fontWeight: 800, fontSize: 13, textDecoration: "none", marginTop: 16 }}>
              {tier.key === "akasha-infinity" ? "∞ Claim Infinity" : `Activate ${config.label}`}
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function SubscriptionBadge({ tier, onClick }: { tier: string | null; onClick: () => void }) {
  const t = tier ?? "free";
  const config = TIER_CONFIG[t] ?? TIER_CONFIG.free;
  return (
    <button onClick={onClick} title="View subscription" style={{ position: "absolute", bottom: -4, right: -4, width: 36, height: 36, borderRadius: "50%", background: "rgba(8,8,8,0.95)", border: `2px solid ${config.color}`, color: config.color, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 0 16px ${config.glow},0 2px 8px rgba(0,0,0,0.8)`, zIndex: 10 }}>
      {config.glyph}
    </button>
  );
}
