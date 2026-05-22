import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserRecord {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  banned: boolean;
  profile: { full_name: string | null; avatar_url: string | null } | null;
  membership: {
    tier: string | null;
    stripe_customer_id: string | null;
    affiliate_id: string | null;
    expires_at: string | null;
  } | null;
}

const TIER_LABELS: Record<string, string> = {
  free: "Free Seeker",
  prana_flow: "Prana-Flow 19/mo",
  siddha_quantum: "Siddha-Quantum 45/mo",
  akasha_infinity: "Akasha-Infinity Lifetime",
};

async function invokeAdmin(action: string, payload: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-user-management", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  return data;
}

export default function UserManagementPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);
  const [newTier, setNewTier] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [sortField, setSortField] = useState<"created_at" | "email" | "tier">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterTier, setFilterTier] = useState("all");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users: data } = await invokeAdmin("list_users");
      setUsers(data || []);
    } catch (e: any) {
      toast({ title: "Akasha Access Denied", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.profile?.full_name?.toLowerCase().includes(q);
      const tier = u.membership?.tier || "free";
      const matchTier = filterTier === "all" || tier === filterTier;
      return matchSearch && matchTier;
    })
    .sort((a, b) => {
      let va = "", vb = "";
      if (sortField === "email") { va = a.email || ""; vb = b.email || ""; }
      else if (sortField === "tier") { va = a.membership?.tier || ""; vb = b.membership?.tier || ""; }
      else { va = a.created_at; vb = b.created_at; }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const handleDelete = async (userId: string) => {
    setActionLoading(true);
    try {
      await invokeAdmin("delete_user", { userId });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmDelete(null);
      setModalMode(null);
      toast({ title: "Akasha Record Cleared", description: "User has been dissolved from the matrix." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    if (!selectedUser || !newTier) return;
    setActionLoading(true);
    try {
      await invokeAdmin("update_membership", { userId: selectedUser.id, updates: { tier: newTier } });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, membership: { ...(u.membership || {}), tier: newTier } as any } : u
        )
      );
      toast({ title: "Tier Transmission Complete", description: selectedUser.email + " upgraded" });
      setModalMode(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(true);
    try {
      await invokeAdmin("ban_user", { userId, updates: { unban: currentlyBanned } });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, banned: !currentlyBanned } : u)));
      toast({ title: currentlyBanned ? "User Restored" : "User Suspended" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordReset = async (userId: string) => {
    setActionLoading(true);
    try {
      await invokeAdmin("reset_password", { userId });
      toast({ title: "Reset Transmission Sent", description: "Password reset email dispatched." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openUser = (user: UserRecord, mode: "view" | "edit") => {
    setSelectedUser(user);
    setNewTier(user.membership?.tier || "free");
    setModalMode(mode);
  };

  const stats = {
    total: users.length,
    prana: users.filter((u) => u.membership?.tier === "prana_flow").length,
    siddha: users.filter((u) => u.membership?.tier === "siddha_quantum").length,
    akasha: users.filter((u) => u.membership?.tier === "akasha_infinity").length,
  };

  const glass: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 24,
  };

  const gold = "#D4AF37";
  const cyan = "#22D3EE";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", color: "#fff", padding: "0 0 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
          AKASHA-NEURAL ARCHIVE - ADMIN NEXUS
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: gold, textShadow: "0 0 20px rgba(212,175,55,0.4)", margin: 0 }}>
          Soul Registry
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4, fontWeight: 400 }}>
          {users.length} seekers in the Quantum Field
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "TOTAL SOULS", value: stats.total, color: "rgba(255,255,255,0.6)" },
          { label: "PRANA-FLOW", value: stats.prana, color: cyan },
          { label: "SIDDHA-QUANTUM", value: stats.siddha, color: gold },
          { label: "AKASHA-INF", value: stats.akasha, color: "#fff8dc" },
        ].map((s) => (
          <div key={s.label} style={{ ...glass, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 13, outline: "none" }}
        />
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="prana_flow">Prana-Flow</option>
          <option value="siddha_quantum">Siddha-Quantum</option>
          <option value="akasha_infinity">Akasha-Infinity</option>
        </select>
        <select value={sortField + "_" + sortDir}
          onChange={(e) => { const [f, d] = e.target.value.split("_") as any; setSortField(f); setSortDir(d); }}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
          <option value="created_at_desc">Newest First</option>
          <option value="created_at_asc">Oldest First</option>
          <option value="email_asc">Email A-Z</option>
          <option value="tier_asc">Tier</option>
        </select>
        <button onClick={loadUsers}
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid #D4AF37", borderRadius: 12, padding: "10px 20px", color: gold, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
          Scanning Akasha-Neural Archive...
        </div>
      ) : (
        <div style={{ ...glass, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr", gap: 12, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
            {["SOUL", "EMAIL", "TIER", "JOINED", "ACTIONS"].map((h) => (
              <div key={h} style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No seekers found.</div>
          ) : (
            filtered.map((user) => {
              const tier = user.membership?.tier || "free";
              const tierColor = tier === "akasha_infinity" || tier === "siddha_quantum" ? gold : tier === "prana_flow" ? cyan : "rgba(255,255,255,0.3)";
              const initials = user.profile?.full_name
                ? user.profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                : user.email?.[0]?.toUpperCase() || "?";
              return (
                <div key={user.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center", opacity: user.banned ? 0.5 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: gold, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        {user.profile?.full_name || "—"}
                        {user.banned && <span style={{ marginLeft: 6, fontSize: 9, color: "#ef4444", fontWeight: 800 }}>SUSPENDED</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{user.email_confirmed ? "Verified" : "Unverified"}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: tierColor, background: tierColor + "15", border: "1px solid " + tierColor + "30", borderRadius: 8, padding: "3px 8px", display: "inline-block" }}>
                      {TIER_LABELS[tier] || tier}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    {new Date(user.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <ActionBtn label="View" title="View" onClick={() => openUser(user, "view")} />
                    <ActionBtn label="Edit" title="Edit Tier" onClick={() => openUser(user, "edit")} color={gold} />
                    <ActionBtn label={user.banned ? "Unban" : "Ban"} title={user.banned ? "Unban" : "Suspend"} onClick={() => handleBan(user.id, user.banned)} />
                    <ActionBtn label="Del" title="Delete" onClick={() => setConfirmDelete(user.id)} color="#ef4444" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {modalMode && selectedUser && (
        <SQIModal onClose={() => setModalMode(null)}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>
              {modalMode === "view" ? "SOUL PROFILE" : "TIER TRANSMISSION"}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", margin: "0 0 20px" }}>
              {selectedUser.profile?.full_name || selectedUser.email}
            </h3>
            {modalMode === "view" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["ID", selectedUser.id],
                  ["Email", selectedUser.email],
                  ["Verified", selectedUser.email_confirmed ? "Yes" : "No"],
                  ["Joined", new Date(selectedUser.created_at).toLocaleString()],
                  ["Last Login", selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : "Never"],
                  ["Tier", TIER_LABELS[selectedUser.membership?.tier || "free"] || "Free"],
                  ["Stripe ID", selectedUser.membership?.stripe_customer_id || "none"],
                  ["Affiliate ID", selectedUser.membership?.affiliate_id || "none"],
                  ["Expires", selectedUser.membership?.expires_at ? new Date(selectedUser.membership.expires_at).toLocaleDateString() : "none"],
                  ["Status", selectedUser.banned ? "SUSPENDED" : "Active"],
                ].map(([label, val]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{val as string}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <SQIBtn label="Edit Tier" onClick={() => setModalMode("edit")} color={gold} />
                  <SQIBtn label="Reset Password" onClick={() => handlePasswordReset(selectedUser.id)} loading={actionLoading} />
                  <SQIBtn label={selectedUser.banned ? "Restore" : "Suspend"} onClick={() => handleBan(selectedUser.id, selectedUser.banned)} loading={actionLoading} />
                  <SQIBtn label="Delete" onClick={() => { setModalMode(null); setConfirmDelete(selectedUser.id); }} color="#ef4444" />
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(TIER_LABELS).map(([value, label]) => (
                      <button key={value} onClick={() => setNewTier(value)}
                        style={{ background: newTier === value ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.02)", border: newTier === value ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", color: newTier === value ? gold : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: newTier === value ? 700 : 400, textAlign: "left", cursor: "pointer" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <SQIBtn label="Apply Transmission" onClick={handleUpdateTier} loading={actionLoading} color={gold} />
                  <SQIBtn label="Cancel" onClick={() => setModalMode(null)} />
                </div>
              </div>
            )}
          </div>
        </SQIModal>
      )}

      {confirmDelete && (
        <SQIModal onClose={() => setConfirmDelete(null)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#ef4444", marginBottom: 8 }}>IRREVERSIBLE ACTION</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>Delete this Soul Record?</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              This permanently removes auth, profile, and membership from the Akasha Archive.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <SQIBtn label="Cancel" onClick={() => setConfirmDelete(null)} />
              <SQIBtn label={actionLoading ? "Deleting..." : "Confirm Delete"} onClick={() => handleDelete(confirmDelete)} color="#ef4444" loading={actionLoading} />
            </div>
          </div>
        </SQIModal>
      )}
    </div>
  );
}

function ActionBtn({ label, title, onClick, color }: { label: string; title: string; onClick: () => void; color?: string }) {
  return (
    <button title={title} onClick={onClick}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", color: color || "rgba(255,255,255,0.6)" }}>
      {label}
    </button>
  );
}

function SQIModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 24, padding: 32, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 0 60px rgba(212,175,55,0.1)" }}>
        <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", marginTop: -8 }}>x</button>
        {children}
      </div>
    </div>
  );
}

function SQIBtn({ label, onClick, color, loading }: { label: string; onClick: () => void; color?: string; loading?: boolean }) {
  const active = color || "rgba(255,255,255,0.2)";
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background: color ? color + "15" : "rgba(255,255,255,0.04)", border: "1px solid " + active + "30", borderRadius: 12, padding: "10px 18px", color: color || "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
      {label}
    </button>
  );
}
