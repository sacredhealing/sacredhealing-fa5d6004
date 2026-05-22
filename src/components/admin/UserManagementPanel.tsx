// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TIER_LABELS: Record<string, string> = {
  free: "Free Seeker",
  "prana-flow": "Prana-Flow \u20ac19/mo",
  "siddha-quantum": "Siddha-Quantum \u20ac45/mo",
  "akasha-infinity": "Akasha-Infinity Lifetime",
};

const TIER_COLORS: Record<string, string> = {
  free: "rgba(255,255,255,0.3)",
  "prana-flow": "#22D3EE",
  "siddha-quantum": "#D4AF37",
  "akasha-infinity": "#fff8dc",
};

const gold = "#D4AF37";
const cyan = "#22D3EE";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 24,
};

export default function UserManagementPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [newTier, setNewTier] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Query profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, last_login_date, onboarding_completed")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Query admin granted access (how tiers work in this app)
      const { data: grants } = await supabase
        .from("admin_granted_access")
        .select("user_id, tier, access_id, is_active, granted_at")
        .eq("is_active", true)
        .eq("access_type", "membership");

      // Query user_memberships for Stripe data
      const { data: memberships } = await supabase
        .from("user_memberships")
        .select("user_id, tier_id, status, stripe_subscription_id, expires_at");

      const grantMap: Record<string, string> = {};
      (grants || []).forEach((g: any) => {
        if (!grantMap[g.user_id]) grantMap[g.user_id] = g.tier || g.access_id || "free";
      });

      const memberMap: Record<string, any> = {};
      (memberships || []).forEach((m: any) => { memberMap[m.user_id] = m; });

      const enriched = (profiles || []).map((p: any) => ({
        ...p,
        tier: grantMap[p.id] || memberMap[p.id]?.tier_id || "free",
        stripe_sub: memberMap[p.id]?.stripe_subscription_id || null,
        expires_at: memberMap[p.id]?.expires_at || null,
        membership_status: memberMap[p.id]?.status || null,
      }));

      setUsers(enriched);
    } catch (e: any) {
      toast({ title: "Load Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q);
    const matchTier = filterTier === "all" || u.tier === filterTier;
    return matchSearch && matchTier;
  });

  const stats = {
    total: users.length,
    prana: users.filter(u => u.tier === "prana-flow").length,
    siddha: users.filter(u => u.tier === "siddha-quantum").length,
    akasha: users.filter(u => u.tier === "akasha-infinity").length,
  };

  const handleGrantTier = async () => {
    if (!selectedUser || !newTier) return;
    setActionLoading(true);
    try {
      if (newTier === "free") {
        // Revoke all active grants
        await supabase
          .from("admin_granted_access")
          .update({ is_active: false })
          .eq("user_id", selectedUser.id)
          .eq("access_type", "membership");
      } else {
        // Revoke old
        await supabase
          .from("admin_granted_access")
          .update({ is_active: false })
          .eq("user_id", selectedUser.id)
          .eq("access_type", "membership");
        // Grant new
        const { error } = await supabase
          .from("admin_granted_access")
          .insert({
            user_id: selectedUser.id,
            access_type: "membership",
            tier: newTier,
            access_id: newTier,
            is_active: true,
            granted_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, tier: newTier } : u));
      toast({ title: "\u2728 Tier Transmission Complete", description: `${selectedUser.full_name || selectedUser.id} \u2192 ${TIER_LABELS[newTier] || newTier}` });
      setModalMode(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    setActionLoading(true);
    try {
      // Can only delete profile row (not auth user without service role)
      await supabase.from("admin_granted_access").update({ is_active: false }).eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDelete(null);
      setModalMode(null);
      toast({ title: "\u26a1 Profile Cleared", description: "Profile data removed. Auth account requires Supabase dashboard to fully delete." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openUser = (user: any, mode: "view" | "edit") => {
    setSelectedUser(user);
    setNewTier(user.tier || "free");
    setModalMode(mode);
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", color: "#fff", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
          AKASHA-NEURAL ARCHIVE \u00b7 ADMIN NEXUS
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: gold, textShadow: "0 0 20px rgba(212,175,55,0.4)", margin: 0 }}>
          Soul Registry
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>{users.length} seekers in the Quantum Field</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "TOTAL SOULS", value: stats.total, color: "rgba(255,255,255,0.7)" },
          { label: "PRANA-FLOW", value: stats.prana, color: cyan },
          { label: "SIDDHA-QUANTUM", value: stats.siddha, color: gold },
          { label: "AKASHA-INF", value: stats.akasha, color: "#fff8dc" },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 13, outline: "none" }} />
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="prana-flow">Prana-Flow</option>
          <option value="siddha-quantum">Siddha-Quantum</option>
          <option value="akasha-infinity">Akasha-Infinity</option>
        </select>
        <button onClick={loadUsers} style={{ background: "rgba(212,175,55,0.1)", border: `1px solid ${gold}`, borderRadius: 12, padding: "10px 20px", color: gold, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          \u21bb Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>Scanning Akasha-Neural Archive...</div>
      ) : (
        <div style={{ ...glass, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 12, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
            {["SOUL", "TIER", "JOINED", "ACTIONS"].map(h => (
              <div key={h} style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No seekers found in this field.</div>
          ) : filtered.map(user => {
            const tierColor = TIER_COLORS[user.tier] || "rgba(255,255,255,0.3)";
            const initials = user.full_name ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase() : "?";
            return (
              <div key={user.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: gold, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{user.full_name || "Unnamed Seeker"}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1, fontFamily: "monospace" }}>{user.id.slice(0,8)}...</div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: tierColor, background: tierColor + "20", border: `1px solid ${tierColor}40`, borderRadius: 8, padding: "3px 8px", display: "inline-block" }}>
                    {TIER_LABELS[user.tier] || user.tier || "Free Seeker"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  {new Date(user.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn label="\ud83d\udc41" title="View" onClick={() => openUser(user, "view")} />
                  <Btn label="\u270f\ufe0f" title="Edit Tier" onClick={() => openUser(user, "edit")} color={gold} />
                  <Btn label="\ud83d\uddd1" title="Delete" onClick={() => setConfirmDelete(user.id)} color="#ef4444" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View/Edit Modal */}
      {modalMode && selectedUser && (
        <SQIModal onClose={() => setModalMode(null)}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>
            {modalMode === "view" ? "SOUL PROFILE" : "TIER TRANSMISSION"}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 20px" }}>{selectedUser.full_name || "Unnamed Seeker"}</h3>
          {modalMode === "view" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["ID", selectedUser.id],
                ["Name", selectedUser.full_name || "\u2014"],
                ["Tier", TIER_LABELS[selectedUser.tier] || selectedUser.tier || "Free"],
                ["Joined", new Date(selectedUser.created_at).toLocaleString()],
                ["Last Login", selectedUser.last_login_date ? new Date(selectedUser.last_login_date).toLocaleString() : "Unknown"],
                ["Stripe Sub", selectedUser.stripe_sub || "\u2014"],
                ["Expires", selectedUser.expires_at ? new Date(selectedUser.expires_at).toLocaleDateString() : "\u2014"],
                ["Onboarding", selectedUser.onboarding_completed ? "Complete" : "Pending"],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{label}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{val as string}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <SQIBtn label="\u270f\ufe0f Edit Tier" onClick={() => setModalMode("edit")} color={gold} />
                <SQIBtn label="\ud83d\uddd1 Delete Profile" onClick={() => { setModalMode(null); setConfirmDelete(selectedUser.id); }} color="#ef4444" />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(TIER_LABELS).map(([value, label]) => (
                  <button key={value} onClick={() => setNewTier(value)}
                    style={{ background: newTier === value ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.02)", border: newTier === value ? `1px solid ${gold}` : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", color: newTier === value ? gold : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: newTier === value ? 700 : 400, textAlign: "left", cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <SQIBtn label={actionLoading ? "Transmitting..." : "\u2728 Apply"} onClick={handleGrantTier} loading={actionLoading} color={gold} />
                <SQIBtn label="Cancel" onClick={() => setModalMode(null)} />
              </div>
            </div>
          )}
        </SQIModal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <SQIModal onClose={() => setConfirmDelete(null)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#ef4444", marginBottom: 8 }}>IRREVERSIBLE ACTION</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>Delete Profile Record?</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
              This removes the profile and tier data. To fully delete the auth account, use the Supabase dashboard.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <SQIBtn label="Cancel" onClick={() => setConfirmDelete(null)} />
              <SQIBtn label={actionLoading ? "Deleting..." : "\ud83d\uddd1 Confirm"} onClick={() => handleDeleteProfile(confirmDelete)} color="#ef4444" loading={actionLoading} />
            </div>
          </div>
        </SQIModal>
      )}
    </div>
  );
}

function Btn({ label, title, onClick, color }: any) {
  return (
    <button title={title} onClick={onClick}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: color || "rgba(255,255,255,0.6)" }}>
      {label}
    </button>
  );
}

function SQIModal({ children, onClose }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 24, padding: 32, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 0 60px rgba(212,175,55,0.1)" }}>
        <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", marginTop: -8 }}>x</button>
        {children}
      </div>
    </div>
  );
}

function SQIBtn({ label, onClick, color, loading }: any) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background: color ? color + "15" : "rgba(255,255,255,0.04)", border: `1px solid ${(color || "rgba(255,255,255,0.2)")}40`, borderRadius: 12, padding: "10px 18px", color: color || "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
      {label}
    </button>
  );
}
