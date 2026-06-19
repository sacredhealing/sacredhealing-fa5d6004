import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Zap, Users, TrendingUp, Crown, Shield, CheckCircle, ArrowRight, Infinity } from "lucide-react";

const GOLD = "#D4AF37";
const TIERS = [
  { id: "atma_seeds",      label: "Atma Seeds",      adminCut: 70, userKeep: 30, price: "Free",      icon: "🌱", desc: "Begin the transmission" },
  { id: "prana_flow",      label: "Prana Flow",      adminCut: 50, userKeep: 50, price: "€19/mo",    icon: "🌊", desc: "Equal sovereign share" },
  { id: "siddha_quantum",  label: "Siddha Quantum",  adminCut: 25, userKeep: 75, price: "€45/mo",    icon: "⚡", desc: "Quantum wealth gates open" },
  { id: "akasha_infinity", label: "Akasha Infinity", adminCut: 10, userKeep: 90, price: "€1,111",    icon: "♾️", desc: "Near-sovereign returns" },
  { id: "lifetime",        label: "Bot Lifetime",    adminCut: 0,  userKeep: 100, price: "€4,997",   icon: "👑", desc: "Zero sharing. Forever." },
];

const MLM_LEVELS = [
  { level: 1, pct: 20, label: "Direct Referral" },
  { level: 2, pct: 10, label: "Their Referral" },
  { level: 3, pct:  5, label: "3rd Degree" },
  { level: 4, pct:  3, label: "4th Degree" },
  { level: 5, pct:  2, label: "5th Degree" },
];

export default function ShreemBotActivation() {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet } = usePhantomWallet();
  const { toast } = useToast();
  const [member, setMember]       = useState<any>(null);
  const [mlmEarnings, setMlm]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [activating, setActivating] = useState(false);
  const [refCode, setRefCode]     = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [tab, setTab]             = useState<"activate"|"mlm"|"earnings">("activate");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: m }, { data: e }, { data: ap }] = await Promise.all([
      (supabase as any).from("shreem_bot_members").select("*").eq("user_id", user.id).maybeSingle(),
      (supabase as any).from("shreem_mlm_earnings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("affiliate_profiles").select("affiliate_code").eq("user_id", user.id).maybeSingle(),
    ]);

    setMember(m);
    setMlm(e);
    if (ap) setAffiliateLink(`${window.location.origin}/affiliate/${ap.affiliate_code}`);
    setLoading(false);
  }

  async function activateBot(tier: string) {
    if (!walletAddress) {
      toast({ title: "Connect Phantom First", description: "Your Phantom wallet is required to receive profits", variant: "destructive" });
      return;
    }
    setActivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cutMap: Record<string,number> = {
        atma_seeds: 70, prana_flow: 50, siddha_quantum: 25, akasha_infinity: 10, lifetime: 0
      };

      const { error } = await (supabase as any).from("shreem_bot_members").upsert({
        user_id: user.id,
        wallet_address: walletAddress,
        tier,
        admin_cut_pct: cutMap[tier],
        is_active: true,
        paper_mode: true,
        affiliate_code_used: refCode || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

      if (error) throw error;

      // Resolve MLM upline if referral code was used
      if (refCode) {
        await (supabase as any).rpc("shreem_resolve_upline", {
          p_user_id: user.id,
          p_referrer_code: refCode
        });
      }

      toast({ title: "🌟 Bot Activated!", description: `Shreem Brzee running on ${tier.replace(/_/g," ")} tier` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Activation failed", description: err.message, variant: "destructive" });
    }
    setActivating(false);
  }

  async function updateWallet() {
    if (!walletAddress || !member) return;
    await supabase.from("shreem_bot_members")
      .update({ wallet_address: walletAddress, updated_at: new Date().toISOString() })
      .eq("user_id", member.user_id);
    toast({ title: "Wallet updated", description: "Profits will now flow to your connected wallet" });
    await loadData();
  }

  const currentTier = TIERS.find(t => t.id === member?.tier);

  return (
    <div style={{ background: "#050505", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif", padding: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🕉️</div>
        <h1 style={{ color: GOLD, fontSize: 26, fontWeight: 900, letterSpacing: "-0.05em", margin: 0 }}>
          SHREEM BRZEE BOT
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.3em", marginTop: 4 }}>
          SOVEREIGN WEALTH ENGINE · 5-LEVEL TRANSMISSION NETWORK
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 4 }}>
        {[["activate","⚡ Activate"],["mlm","🌐 Network"],["earnings","💰 Earnings"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: tab === k ? `rgba(212,175,55,0.15)` : "transparent",
            color: tab === k ? GOLD : "rgba(255,255,255,0.5)",
            fontWeight: tab === k ? 700 : 400, fontSize: 13
          }}>{l}</button>
        ))}
      </div>

      {/* ── ACTIVATE TAB ── */}
      {tab === "activate" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Wallet Connect */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${walletAddress ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Wallet size={20} color={walletAddress ? GOLD : "rgba(255,255,255,0.4)"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: walletAddress ? GOLD : "#fff" }}>
                    {walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Phantom Wallet"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    {walletAddress ? "✓ Connected — profits flow here automatically" : "Required to receive trading profits"}
                  </div>
                </div>
              </div>
              <button onClick={walletAddress ? disconnectWallet : connectWallet}
                style={{ background: walletAddress ? "rgba(255,255,255,0.05)" : `rgba(212,175,55,0.15)`, border: `1px solid ${walletAddress ? "rgba(255,255,255,0.1)" : "rgba(212,175,55,0.3)"}`, borderRadius: 12, padding: "8px 16px", color: walletAddress ? "rgba(255,255,255,0.6)" : GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {isConnecting ? "..." : walletAddress ? "Disconnect" : "Connect"}
              </button>
            </div>
            {walletAddress && member?.wallet_address !== walletAddress && (
              <button onClick={updateWallet} style={{ marginTop: 12, width: "100%", background: `rgba(212,175,55,0.1)`, border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 12, padding: "8px 0", color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Save New Wallet Address
              </button>
            )}
          </div>

          {/* Current Status */}
          {member?.is_active && currentTier && (
            <div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CheckCircle size={18} color={GOLD} />
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>BOT ACTIVE — {currentTier.label.toUpperCase()}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  ["Your Share", `${currentTier.userKeep}%`],
                  ["Total Earned", `${(member.total_earned_sol || 0).toFixed(4)} SOL`],
                  ["Mode", member.paper_mode ? "Paper" : "Live"],
                ].map(([l,v]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referral Code Input */}
          {!member && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Referral Code (optional)</label>
              <input value={refCode} onChange={e => setRefCode(e.target.value)}
                placeholder="Enter affiliate code..."
                style={{ width: "100%", marginTop: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Tier Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIERS.map(tier => {
              const isActive = member?.tier === tier.id && member?.is_active;
              return (
                <div key={tier.id} style={{
                  background: isActive ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isActive ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 20, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 28 }}>{tier.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: isActive ? GOLD : "#fff" }}>{tier.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{tier.desc}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>You keep {tier.userKeep}%</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>·</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{tier.price}</span>
                      </div>
                    </div>
                  </div>
                  {isActive ? (
                    <CheckCircle size={22} color={GOLD} />
                  ) : (
                    <button onClick={() => activateBot(tier.id)} disabled={activating || !walletAddress}
                      style={{ background: `rgba(212,175,55,0.15)`, border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 12, padding: "8px 16px", color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: !walletAddress ? 0.4 : 1 }}>
                      {activating ? "..." : "Activate"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MLM NETWORK TAB ── */}
      {tab === "mlm" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Users size={18} color={GOLD} />
              <span style={{ color: GOLD, fontWeight: 800, fontSize: 14, letterSpacing: "0.1em" }}>5-LEVEL TRANSMISSION NETWORK</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Every person in your network activates the bot. Every trade they make automatically sends SOL to your Phantom wallet. Forever. No manual work.
            </p>
            {MLM_LEVELS.map(lvl => (
              <div key={lvl.level} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `rgba(212,175,55,${0.3 - lvl.level * 0.04})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: GOLD, fontWeight: 900, fontSize: 13 }}>L{lvl.level}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{lvl.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Earns from admin's profit share</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>{lvl.pct}%</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>of admin cut</div>
                </div>
              </div>
            ))}
          </div>

          {/* Affiliate Link */}
          {affiliateLink && (
            <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: 20 }}>
              <div style={{ fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Your Transmission Link</div>
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>
                {affiliateLink}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(affiliateLink); toast({ title: "Link copied!" }); }}
                style={{ marginTop: 12, width: "100%", background: `rgba(212,175,55,0.15)`, border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 12, padding: "10px 0", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Copy Link
              </button>
            </div>
          )}

          {/* Example earnings */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontSize: 12, color: GOLD, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 14 }}>EXAMPLE — 10 PEOPLE AT ATMA SEEDS</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.8 }}>
              10 users × 0.1 SOL avg profit/trade × 70% admin cut = <span style={{ color: "#10b981", fontWeight: 700 }}>0.7 SOL admin pool per trade</span><br/>
              Your L1 cut = 20% of 0.7 = <span style={{ color: GOLD, fontWeight: 800 }}>0.14 SOL per trade</span><br/>
              Bot fires ~5 trades/day = <span style={{ color: GOLD, fontWeight: 900 }}>0.7 SOL/day (~€85) from L1 alone</span>
            </div>
          </div>
        </div>
      )}

      {/* ── EARNINGS TAB ── */}
      {tab === "earnings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mlmEarnings ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["Total Earned", `${(mlmEarnings.total_earned || 0).toFixed(6)} SOL`, "#10b981"],
                  ["Pending", `${(mlmEarnings.pending || 0).toFixed(6)} SOL`, GOLD],
                  ["Paid Out", `${(mlmEarnings.total_paid || 0).toFixed(6)} SOL`, "rgba(255,255,255,0.6)"],
                  ["Wallet", mlmEarnings.wallet_address ? `${mlmEarnings.wallet_address.slice(0,6)}...${mlmEarnings.wallet_address.slice(-4)}` : "—", "rgba(255,255,255,0.5)"],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c as string, marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  SOL is distributed automatically to your Phantom wallet after every profitable trade in your network. No withdrawal needed — it arrives directly.
                </p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <TrendingUp size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No earnings yet. Share your affiliate link to begin the transmission.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
