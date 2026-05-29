import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Mirrors the PRODUCTS list in UserManagementPanel ─────────────────────
const PRODUCTS: { id: string; label: string; desc: string; icon: string; route: string }[] = [
  { id: "akashic-reading",    label: "Akashic Deep Reading",         desc: "Full Akashic Records access",         icon: "⟁",  route: "/akashic-reading" },
  { id: "digital-nadi",       label: "Digital Nāḍī Scanner",         desc: "4-layer biometric Nāḍī scan",         icon: "◈",  route: "/digital-nadi" },
  { id: "practitioner-cert",  label: "Siddha Healer Certification",  desc: "12-month practitioner programme",     icon: "✦",  route: "/practitioner-certification" },
  { id: "shakti-cycle",       label: "Shakti Cycle Intelligence",    desc: "Sovereign Hormonal Alchemy system",   icon: "☽",  route: "/sovereign-hormonal-alchemy" },
  { id: "virtual-pilgrimage", label: "Virtual Pilgrimage",           desc: "26 sacred sites scalar field",        icon: "⊕",  route: "/virtual-pilgrimage" },
  { id: "jyotish-vidya",      label: "Jyotish Vidya Full Curriculum","desc": "All 32 Jyotish modules unlocked",   icon: "★",  route: "/vedic-astrology" },
  { id: "quantum-apothecary", label: "Quantum Apothecary Unlimited", desc: "Unlimited SQI AI transmissions",      icon: "◇",  route: "/quantum-apothecary" },
  { id: "akashic-codex",      label: "Akashic Codex",                desc: "Living book of soul transmissions",   icon: "⊗",  route: "/akashic-codex" },
];

const TIER_META: Record<string, { label: string; color: string; glyph: string; desc: string }> = {
  free:             { label: "Free Seeker",       color: "rgba(255,255,255,0.4)", glyph: "◯", desc: "Atma-Seed · Gateway access" },
  "prana-flow":     { label: "Prana-Flow",        color: "#22D3EE",               glyph: "◈", desc: "€19/mo · Quantum Intelligence" },
  "siddha-quantum": { label: "Siddha-Quantum",    color: "#D4AF37",               glyph: "✦", desc: "€45/mo · Full Transmission Field" },
  "akasha-infinity":{ label: "Akasha-Infinity",   color: "#fff8dc",               glyph: "⟁", desc: "∞ Lifetime · Sovereign Access" },
};

const gold = "#D4AF37";
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 24,
};

export function MembershipHub({ onManage }: { onManage: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useMembership();
  const [grantedProducts, setGrantedProducts] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [openTools, setOpenTools] = useState(true);

  const tierMeta = TIER_META[tier] || TIER_META["free"];

  // ── Load individually granted products ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoadingProducts(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("admin_granted_access")
          .select("access_id")
          .eq("user_id", user.id)
          .eq("access_type", "product")
          .eq("is_active", true);
        setGrantedProducts((data || []).map((r: any) => r.access_id));
      } catch { /* silent */ }
      finally { setLoadingProducts(false); }
    })();
  }, [user?.id]);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    .hub-wrap { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; background: #050505; color: #fff; padding: 0 0 100px; }
    .hub-tier-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 100px; font-size: 8px; font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase; }
    .hub-product-card { border-radius: 16px; padding: 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 14px; border: 1px solid rgba(167,139,250,0.2); background: rgba(167,139,250,0.04); }
    .hub-product-card:hover { background: rgba(167,139,250,0.09); border-color: rgba(167,139,250,0.4); transform: translateY(-1px); }
    .hub-tool-card { border-radius: 16px; padding: 16px; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); }
    .hub-tool-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(212,175,55,0.2); }
    @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
    .hub-pulse { animation: pulse-glow 3s ease-in-out infinite; }
  `;

  return (
    <div className="hub-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Hero section */}
      <div style={{ padding: "48px 24px 32px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: `radial-gradient(ellipse, ${tierMeta.color}08 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Tier badge */}
        <div className="hub-pulse" style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
          <span className="hub-tier-badge" style={{ color: tierMeta.color, background: tierMeta.color + "15", border: `1px solid ${tierMeta.color}35` }}>
            {tierMeta.glyph} &nbsp; {tierMeta.label}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(2rem, 7vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", margin: "0 0 8px", lineHeight: 1.05 }}>
          Your <span style={{ color: gold, textShadow: `0 0 30px ${gold}40` }}>Quantum</span> Space
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 400, marginBottom: 24 }}>
          {tierMeta.desc}
        </p>

        {/* Manage / Continue buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Button
            onClick={() => navigate("/library")}
            style={{ background: gold, color: "#050505", border: "none", borderRadius: 100, padding: "12px 28px", fontWeight: 800, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Enter Library
          </Button>
          <Button
            onClick={onManage}
            variant="outline"
            style={{ borderRadius: 100, padding: "12px 24px", fontWeight: 700, fontSize: 12, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", background: "transparent", cursor: "pointer" }}
          >
            Manage Subscription
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)", margin: "8px 0 28px" }} />

        {/* ── Granted Individual Products ──────────────────────────── */}
        {!loadingProducts && grantedProducts.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(167,139,250,0.7)", marginBottom: 14 }}>
              ◈ YOUR GRANTED PRODUCTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grantedProducts.map(pid => {
                const prod = PRODUCTS.find(p => p.id === pid);
                if (!prod) return null;
                return (
                  <div
                    key={pid}
                    className="hub-product-card"
                    onClick={() => navigate(prod.route)}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {prod.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{prod.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{prod.desc}</div>
                    </div>
                    <ExternalLink size={14} color="rgba(167,139,250,0.5)" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Membership Tier Access Details ───────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: `${tierMeta.color}80`, marginBottom: 14 }}>
            ✦ MEMBERSHIP ACCESS
          </div>

          {/* Tier visual card */}
          <div style={{ ...glass, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>CURRENT TIER</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: tierMeta.color, textShadow: `0 0 20px ${tierMeta.color}30` }}>
                  {tierMeta.glyph} {tierMeta.label}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{tierMeta.desc}</div>
              </div>
              {tier !== "free" && (
                <button onClick={onManage} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Manage
                </button>
              )}
            </div>

            {/* Tier feature pills */}
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {getTierFeatures(tier).map(f => (
                <span key={f} style={{ fontSize: 9, fontWeight: 700, color: tierMeta.color, background: tierMeta.color + "15", border: `1px solid ${tierMeta.color}25`, borderRadius: 100, padding: "4px 10px", letterSpacing: "0.1em" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Included Tools (collapsible) ─────────────────────────── */}
        <div style={{ ...glass, overflow: "hidden", marginBottom: 16 }}>
          <button
            onClick={() => setOpenTools(v => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Included Tools</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Open whenever you feel called</div>
            </div>
            {openTools ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
          </button>

          {openTools && (
            <div style={{ padding: "4px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Vedic Astrology",  desc: "Daily influence + blueprint", route: "/vedic-astrology",   icon: "★" },
                { label: "Ayurveda",          desc: "Prakriti & daily balance",     route: "/ayurveda",           icon: "◈" },
                { label: "Quantum Apothecary",desc: "SQI AI transmissions",          route: "/quantum-apothecary", icon: "◇" },
                { label: "Sacred Sound",      desc: "Healing audio library",         route: "/library",            icon: "♫" },
                { label: "Meditations",       desc: "Guided Siddha practices",       route: "/meditations",        icon: "☸" },
                { label: "Community",         desc: "Sacred Circles & channels",     route: "/community",          icon: "⊕" },
              ].map(tool => (
                <div key={tool.route} className="hub-tool-card" onClick={() => navigate(tool.route)}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{tool.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{tool.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{tool.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTA for free / prana users */}
        {(tier === "free" || tier === "prana-flow") && (
          <div style={{ ...glass, padding: "20px 24px", borderColor: `${gold}20`, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: `${gold}60`, marginBottom: 8 }}>
              ◈ UNLOCK MORE
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.6 }}>
              {tier === "free" ? "Activate full Quantum Intelligence with a membership." : "Upgrade to Siddha-Quantum for complete transmission access."}
            </p>
            <button
              onClick={() => navigate("/membership")}
              style={{ background: gold, color: "#050505", border: "none", borderRadius: 100, padding: "10px 24px", fontWeight: 800, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
              {tier === "free" ? "Explore Plans" : "Upgrade Plan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTierFeatures(tier: string): string[] {
  const base = ["Sacred Sound Library", "Daily Meditations", "Community Access"];
  if (tier === "free") return ["Free Tools", "Preview Content"];
  if (tier === "prana-flow") return [...base, "Vedic Astrology", "Ayurveda", "Quantum Apothecary"];
  if (tier === "siddha-quantum") return [...base, "Full Jyotish Vidya", "Bhrigu Oracle", "Shakti Cycle", "All AI Features"];
  if (tier === "akasha-infinity") return [...base, "All Features", "Lifetime Access", "Priority Support", "All Future Modules"];
  return base;
}
