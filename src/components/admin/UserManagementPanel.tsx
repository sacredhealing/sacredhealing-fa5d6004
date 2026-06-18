// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Pencil, Trash2, RefreshCw, AlertTriangle, Key, Package, Crown, UserPlus, Mail } from "lucide-react";

const ADMIN_UUID = "bd0b21c9-577a-450b-bb1e-21c9d0423f17";

const TIER_LABELS: Record<string, string> = {
  free: "Free Seeker",
  "prana-flow": "Prana-Flow €19/mo",
  "siddha-quantum": "Siddha-Quantum €45/mo",
  "akasha-infinity": "Akasha-Infinity ∞",
};
const TIER_COLORS: Record<string, string> = {
  free: "rgba(255,255,255,0.3)",
  "prana-flow": "#22D3EE",
  "siddha-quantum": "#D4AF37",
  "akasha-infinity": "#fff8dc",
};

export const PRODUCTS: { id: string; label: string; desc: string; icon: string; route: string }[] = [
  { id: "akashic-reading",    label: "Akashic Deep Reading",         desc: "Full Akashic Records access",         icon: "⟁",  route: "/akashic-reading" },
  { id: "digital-nadi",       label: "Digital Nāḍī Scanner",         desc: "4-layer biometric Nāḍī scan",         icon: "◈",  route: "/digital-nadi" },
  { id: "practitioner-cert",  label: "Siddha Healer Certification",  desc: "12-month practitioner programme",     icon: "✦",  route: "/practitioner-certification" },
  { id: "shakti-cycle",       label: "Shakti Cycle Intelligence",    desc: "Sovereign Hormonal Alchemy system",   icon: "☽",  route: "/sovereign-hormonal-alchemy" },
  { id: "virtual-pilgrimage", label: "Virtual Pilgrimage",           desc: "26 sacred sites scalar field",        icon: "⊕",  route: "/virtual-pilgrimage" },
  { id: "jyotish-vidya",      label: "Jyotish Vidya Full Curriculum","desc": "All 32 Jyotish modules unlocked",   icon: "★",  route: "/vedic-astrology" },
  { id: "quantum-apothecary", label: "Quantum Apothecary Unlimited", desc: "Unlimited SQI transmissions",         icon: "◇",  route: "/quantum-apothecary" },
  { id: "akashic-codex",      label: "Akashic Codex",                desc: "Living book of soul transmissions",   icon: "⊗",  route: "/akashic-codex" },
];

const SLUG_MAP: Record<string, string> = {
  prana_flow:"prana-flow","prana-monthly":"prana-flow",prana_monthly:"prana-flow",
  premium_monthly:"prana-flow",prana_flow_monthly:"prana-flow",
  siddha_quantum:"siddha-quantum","siddha-quantum-monthly":"siddha-quantum",
  lifetime:"akasha-infinity",akasha_infinity:"akasha-infinity",
  akasha_infinity_lifetime:"akasha-infinity","akasha-infinity":"akasha-infinity",
  "siddha-quantum":"siddha-quantum","prana-flow":"prana-flow",free:"free",
};
function canonicalize(raw: string|null|undefined): string {
  if (!raw) return "free";
  const k = raw.trim();
  return SLUG_MAP[k] || SLUG_MAP[k.replace(/-/g,"_")] || SLUG_MAP[k.replace(/_/g,"-")] || k;
}

const gold = "#D4AF37";
const cyan = "#22D3EE";
const glass: React.CSSProperties = {
  background:"rgba(255,255,255,0.02)",backdropFilter:"blur(40px)",
  WebkitBackdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:24,
};

// ── Input style ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.04)",
  border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
  padding:"12px 16px", color:"#fff", fontSize:13, outline:"none",
  boxSizing:"border-box",
};

export default function UserManagementPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [showUnnamed, setShowUnnamed] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"view"|"edit-tier"|"edit-products"|"create-user"|null>(null);
  const [newTier, setNewTier] = useState("");
  const [pendingProducts, setPendingProducts] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetingId, setResetingId] = useState<string|null>(null);

  // ── Create user form state ───────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newUserTier, setNewUserTier] = useState("free");
  const [createResult, setCreateResult] = useState<{success:boolean; message:string; invite_link?:string}|null>(null);

  // ── Load users ──────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id,user_id,full_name,avatar_url,created_at,last_login_date,onboarding_completed,birth_date,birth_place")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: tiers } = await supabase.from("membership_tiers").select("id,slug");
      const tierSlugMap: Record<string,string> = {};
      (tiers||[]).forEach((t:any) => { tierSlugMap[t.id] = t.slug; });

      const { data: memberships } = await supabase
        .from("user_memberships").select("user_id,tier_id,status,stripe_subscription_id,expires_at").eq("status","active");

      const { data: grants } = await supabase
        .from("admin_granted_access").select("user_id,tier,access_id,access_type,is_active,granted_at")
        .eq("is_active",true);

      const membershipGrants: Record<string,string> = {};
      const productGrants: Record<string,string[]> = {};
      (grants||[]).forEach((g:any) => {
        if (g.access_type === "product") {
          if (!productGrants[g.user_id]) productGrants[g.user_id] = [];
          productGrants[g.user_id].push(g.access_id);
        } else {
          const slug = canonicalize(g.tier || g.access_id);
          if (!membershipGrants[g.user_id]) membershipGrants[g.user_id] = slug;
        }
      });

      const memberMap: Record<string,any> = {};
      (memberships||[]).forEach((m:any) => {
        const slug = canonicalize(tierSlugMap[m.tier_id] || m.tier_id);
        memberMap[m.user_id] = { ...m, tierSlug: slug };
      });

      const rankOf = (s:string) => s.includes("akasha")||s.includes("life")?3:s.includes("siddha")?2:s.includes("prana")||s.includes("premium")?1:0;

      // Fetch auth emails via admin edge function
      const emailMap: Record<string,string> = {};
      try {
        const { data: authData } = await supabase.functions.invoke("admin-user-management", {
          body: { action: "list_users" },
        });
        (authData?.users || []).forEach((u:any) => { if (u.id && u.email) emailMap[u.id] = u.email; });
      } catch (e) {
        console.warn("Failed to load auth emails", e);
      }

      setUsers((profiles||[]).map((p:any) => {
        // Use auth.users.id (profiles.user_id) as the canonical row id so
        // emailMap, memberships, grants, reset & delete all resolve correctly.
        const authId = p.user_id || p.id;
        const grant = membershipGrants[authId];
        const stripe = memberMap[authId]?.tierSlug;
        let tier = "free";
        if (grant && stripe) tier = rankOf(grant) >= rankOf(stripe) ? grant : stripe;
        else if (grant) tier = grant;
        else if (stripe) tier = stripe;
        return {
          ...p,
          id: authId,
          profile_id: p.id,
          email: emailMap[authId] || null,
          tier: canonicalize(tier),
          stripe_sub: memberMap[authId]?.stripe_subscription_id||null,
          expires_at: memberMap[authId]?.expires_at||null,
          grantedProducts: productGrants[authId] || [],
        };
      }));
    } catch (e: any) {
      toast({ title:"Load Failed", description:e.message, variant:"destructive" });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.id?.toLowerCase().includes(q);
    const matchTier = filterTier==="all" || u.tier===filterTier;
    const matchNamed = !showUnnamed || !u.full_name;
    return matchSearch && matchTier && matchNamed;
  });

  const stats = {
    total: users.length,
    unnamed: users.filter(u=>!u.full_name).length,
    prana: users.filter(u=>u.tier==="prana-flow").length,
    siddha: users.filter(u=>u.tier==="siddha-quantum").length,
    akasha: users.filter(u=>u.tier==="akasha-infinity").length,
    withProducts: users.filter(u=>u.grantedProducts?.length>0).length,
  };

  // ── CREATE USER ─────────────────────────────────────────────────────────
  const handleCreateUser = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ title:"Invalid Email", description:"Enter a valid email address.", variant:"destructive" });
      return;
    }
    setActionLoading(true);
    setCreateResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: {
          action: "create_user",
          email: newEmail.trim().toLowerCase(),
          full_name: newFullName.trim() || null,
          tier: newUserTier,
          send_invite: true,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreateResult({
        success: true,
        message: `✦ Soul ${newFullName || newEmail} initiated into the Quantum Field. Invite email transmitted.`,
        invite_link: data.invite_link,
      });
      toast({ title:"✦ Soul Created", description:`${newFullName || newEmail} — invite email sent.` });
      // Reset form
      setNewEmail("");
      setNewFullName("");
      setNewUserTier("free");
      // Reload users list
      await loadUsers();
    } catch (e:any) {
      setCreateResult({ success: false, message: e.message });
      toast({ title:"Creation Failed", description:e.message, variant:"destructive" });
    } finally { setActionLoading(false); }
  };

  // ── Grant tier ──────────────────────────────────────────────────────────
  const handleGrantTier = async () => {
    if (!selectedUser || !newTier) return;
    setActionLoading(true);
    try {
      await supabase.from("admin_granted_access")
        .update({ is_active:false })
        .eq("user_id", selectedUser.id)
        .eq("access_type","membership");

      if (newTier !== "free") {
        const { error } = await supabase.from("admin_granted_access").insert({
          user_id: selectedUser.id,
          access_type: "membership",
          tier: newTier,
          access_id: newTier,
          is_active: true,
          granted_by: ADMIN_UUID,
          granted_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      setUsers(prev => prev.map(u => u.id===selectedUser.id ? {...u, tier:newTier} : u));
      toast({ title:"✦ Quantum Access Granted", description:`${selectedUser.full_name||"Seeker"} → ${TIER_LABELS[newTier]||newTier}` });
      setModalMode(null);
    } catch (e:any) {
      toast({ title:"Error", description:e.message, variant:"destructive" });
    } finally { setActionLoading(false); }
  };

  const openProductModal = async (user: any) => {
    setSelectedUser(user);
    setPendingProducts([...(user.grantedProducts || [])]);
    setModalMode("edit-products");
  };

  const handleSaveProducts = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await supabase.from("admin_granted_access")
        .update({ is_active: false })
        .eq("user_id", selectedUser.id)
        .eq("access_type", "product");

      if (pendingProducts.length > 0) {
        const inserts = pendingProducts.map(pid => ({
          user_id: selectedUser.id,
          access_type: "product",
          access_id: pid,
          tier: null,
          is_active: true,
          granted_by: ADMIN_UUID,
          granted_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("admin_granted_access").insert(inserts);
        if (error) throw error;
      }

      setUsers(prev => prev.map(u =>
        u.id===selectedUser.id ? {...u, grantedProducts: pendingProducts} : u
      ));
      toast({ title:"◈ Products Transmitted", description: pendingProducts.length > 0 ? `${selectedUser.full_name||"Seeker"} → ${pendingProducts.length} products granted` : `All products revoked` });
      setModalMode(null);
    } catch (e:any) {
      toast({ title:"Error", description:e.message, variant:"destructive" });
    } finally { setActionLoading(false); }
  };

  const toggleProduct = (pid: string) => {
    setPendingProducts(prev =>
      prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]
    );
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    setResetingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "reset_password", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const sentTo = data?.email || users.find(u=>u.id===userId)?.email || userName || "seeker";
      toast({ title:"🔑 Reset Email Sent", description:`Password reset link sent to ${sentTo}` });
    } catch (e: any) {
      toast({ title:"Reset Failed", description:e.message, variant:"destructive" });
    } finally { setResetingId(null); }
  };

  const handleSetPassword = async (userId: string) => {
    const pwd = window.prompt("Set new password for this user (min 6 chars):");
    if (!pwd) return;
    if (pwd.length < 6) { toast({ title:"Too short", description:"Password must be ≥ 6 characters", variant:"destructive" }); return; }
    setResetingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "set_password", userId, password: pwd },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title:"🔐 Password Set", description:"The user can now sign in with the new password." });
    } catch (e: any) {
      toast({ title:"Set Password Failed", description:e.message, variant:"destructive" });
    } finally { setResetingId(null); }
  };

  const handleDelete = async (userId: string) => {
    const prev = users;
    setUsers(u => u.filter(x => x.id !== userId));
    setConfirmDelete(null); setModalMode(null); setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", { body:{ action:"delete_user", userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title:"Soul Dissolved", description:"Auth account and all data removed." });
    } catch (e:any) {
      setUsers(prev);
      toast({ title:"Delete Error", description:e.message, variant:"destructive" });
    } finally { setActionLoading(false); }
  };

  const openUser = (user:any, mode:"view"|"edit-tier") => {
    setSelectedUser(user); setNewTier(user.tier||"free"); setModalMode(mode);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',Inter,sans-serif", color:"#fff", paddingBottom:60 }}>

      {/* Header */}
      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:gold, marginBottom:6 }}>
            AKASHA-NEURAL ARCHIVE · ADMIN NEXUS
          </div>
          <h2 style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.04em", color:gold, textShadow:"0 0 20px rgba(212,175,55,0.4)", margin:0 }}>
            Soul Registry
          </h2>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginTop:4 }}>
            {users.length} seekers in the Quantum Field
            {stats.unnamed>0 && <span style={{ color:"#f59e0b", marginLeft:8 }}>· {stats.unnamed} incomplete profiles</span>}
          </p>
        </div>
        {/* ADD NEW USER button */}
        <button
          onClick={() => { setCreateResult(null); setModalMode("create-user"); }}
          style={{
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(212,175,55,0.12)", border:`1.5px solid ${gold}`,
            borderRadius:14, padding:"12px 20px", color:gold,
            fontSize:13, fontWeight:700, cursor:"pointer",
            boxShadow:"0 0 20px rgba(212,175,55,0.15)",
          }}>
          <UserPlus size={15} />
          Add New Soul
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"TOTAL",    value:stats.total,        color:"rgba(255,255,255,0.7)" },
          { label:"UNNAMED",  value:stats.unnamed,      color:"#f59e0b" },
          { label:"PRANA",    value:stats.prana,        color:cyan },
          { label:"SIDDHA",   value:stats.siddha,       color:gold },
          { label:"AKASHA",   value:stats.akasha,       color:"#fff8dc" },
          { label:"PRODUCTS", value:stats.withProducts, color:"#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {stats.unnamed>0 && (
        <div style={{ ...glass, borderColor:"rgba(245,158,11,0.2)", padding:"12px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <div>
            <span style={{ fontSize:12, fontWeight:700, color:"#f59e0b" }}>{stats.unnamed} users never completed profile setup</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginLeft:8 }}>— real accounts, just no name entered yet</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input type="text" placeholder="Search name or ID..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, minWidth:180, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 16px", color:"#fff", fontSize:13, outline:"none" }} />
        <select value={filterTier} onChange={e=>setFilterTier(e.target.value)}
          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 14px", color:"#fff", fontSize:13, cursor:"pointer" }}>
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="prana-flow">Prana-Flow</option>
          <option value="siddha-quantum">Siddha-Quantum</option>
          <option value="akasha-infinity">Akasha-Infinity</option>
        </select>
        <button onClick={()=>setShowUnnamed(v=>!v)}
          style={{ background:showUnnamed?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${showUnnamed?"#f59e0b":"rgba(255,255,255,0.08)"}`, borderRadius:12, padding:"10px 14px", color:showUnnamed?"#f59e0b":"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer", fontWeight:600 }}>
          Unnamed Only
        </button>
        <button onClick={loadUsers}
          style={{ background:"rgba(212,175,55,0.1)", border:`1px solid ${gold}`, borderRadius:12, padding:"10px 16px", color:gold, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.3)" }}>Scanning Akasha-Neural Archive...</div>
      ) : (
        <div style={{ ...glass, overflow:"hidden" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.4fr 0.8fr auto", gap:10, padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            {["SOUL","TIER","PRODUCTS","JOINED","ACTIONS"].map(h=>(
              <div key={h} style={{ fontSize:8, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{h}</div>
            ))}
          </div>
          {filtered.length===0 ? (
            <div style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>No seekers found.</div>
          ) : filtered.map(user => {
            const tierColor = TIER_COLORS[user.tier]||"rgba(255,255,255,0.3)";
            const initials = user.full_name ? user.full_name.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase() : "?";
            const isSendingReset = resetingId === user.id;
            const productCount = user.grantedProducts?.length || 0;
            return (
              <div key={user.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.4fr 0.8fr auto", gap:10, padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }}>

                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:user.full_name?"rgba(212,175,55,0.15)":"rgba(245,158,11,0.1)", border:`1px solid ${user.full_name?"rgba(212,175,55,0.3)":"rgba(245,158,11,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:user.full_name?gold:"#f59e0b", flexShrink:0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:user.full_name?"#fff":"#f59e0b" }}>{user.full_name||"No name"}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>{user.id.slice(0,8)}…</div>
                  </div>
                </div>

                <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:tierColor, background:tierColor+"20", border:`1px solid ${tierColor}40`, borderRadius:8, padding:"4px 8px", display:"inline-block" }}>
                  {user.tier==="free"?"FREE":user.tier==="prana-flow"?"PRANA":user.tier==="siddha-quantum"?"SIDDHA":"AKASHA"}
                </span>

                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {productCount === 0 ? (
                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>None granted</span>
                  ) : user.grantedProducts.slice(0,3).map((pid:string) => {
                    const prod = PRODUCTS.find(p=>p.id===pid);
                    return (
                      <span key={pid} style={{ fontSize:8, fontWeight:700, color:"#a78bfa", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:6, padding:"2px 6px" }}>
                        {prod?.icon} {prod?.label?.split(" ").slice(0,2).join(" ")||pid}
                      </span>
                    );
                  })}
                  {productCount > 3 && <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>+{productCount-3}</span>}
                </div>

                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                  {new Date(user.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}
                </div>

                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  <IconBtn icon={<Eye size={12}/>} title="View profile" onClick={()=>openUser(user,"view")} />
                  <IconBtn icon={<Crown size={12}/>} title="Change membership tier" onClick={()=>openUser(user,"edit-tier")} color={gold} />
                  <IconBtn icon={<Package size={12}/>} title="Manage individual products" onClick={()=>openProductModal(user)} color="#a78bfa" />
                  <IconBtn
                    icon={isSendingReset ? <span style={{fontSize:10}}>…</span> : <Key size={12}/>}
                    title="Send password reset email"
                    onClick={()=>handleResetPassword(user.id, user.full_name)}
                    color={cyan}
                    disabled={isSendingReset}
                  />
                  <IconBtn icon={<Trash2 size={12}/>} title="Delete" onClick={()=>setConfirmDelete(user.id)} color="#ef4444" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE USER MODAL ──────────────────────────────────────────────── */}
      {modalMode==="create-user" && (
        <SQIModal onClose={()=>{ setModalMode(null); setCreateResult(null); }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:gold, marginBottom:8 }}>
            SOUL INITIATION
          </div>
          <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Add New Soul</h3>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:24 }}>
            Creates auth account + profile. An invite email is sent so the soul can set their password.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", display:"block", marginBottom:6 }}>
                EMAIL ADDRESS *
              </label>
              <div style={{ position:"relative" }}>
                <Mail size={13} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)" }} />
                <input
                  type="email"
                  placeholder="soul@example.com"
                  value={newEmail}
                  onChange={e=>setNewEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft:36 }}
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", display:"block", marginBottom:6 }}>
                FULL NAME (optional)
              </label>
              <input
                type="text"
                placeholder="Soul's full name"
                value={newFullName}
                onChange={e=>setNewFullName(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Tier */}
            <div>
              <label style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", display:"block", marginBottom:8 }}>
                INITIAL TIER
              </label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {Object.entries(TIER_LABELS).map(([value,label]) => {
                  const tc = TIER_COLORS[value];
                  const isSelected = newUserTier === value;
                  return (
                    <button key={value} onClick={()=>setNewUserTier(value)}
                      style={{
                        background: isSelected ? tc+"18" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? tc+"80" : "rgba(255,255,255,0.08)"}`,
                        borderRadius:12, padding:"10px 14px",
                        color: isSelected ? tc : "rgba(255,255,255,0.5)",
                        fontSize:12, fontWeight: isSelected ? 700 : 400,
                        textAlign:"left", cursor:"pointer",
                        display:"flex", alignItems:"center", gap:8,
                      }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background: isSelected ? tc : "rgba(255,255,255,0.2)", flexShrink:0 }} />
                      {label as string}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Result feedback */}
          {createResult && (
            <div style={{
              padding:"12px 16px", borderRadius:12, marginBottom:16,
              background: createResult.success ? "rgba(212,175,55,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${createResult.success ? "rgba(212,175,55,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
              <div style={{ fontSize:12, color: createResult.success ? gold : "#ef4444", fontWeight:600 }}>
                {createResult.message}
              </div>
              {createResult.invite_link && (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:4 }}>
                    INVITE LINK (backup)
                  </div>
                  <div style={{ fontSize:10, color:"rgba(34,211,238,0.8)", wordBreak:"break-all", fontFamily:"monospace" }}>
                    {createResult.invite_link}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <SQIBtn
              label={actionLoading ? "Transmitting…" : "✦ Create & Send Invite"}
              onClick={handleCreateUser}
              loading={actionLoading}
              color={gold}
            />
            <SQIBtn label="Close" onClick={()=>{ setModalMode(null); setCreateResult(null); }} />
          </div>

          <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:16, lineHeight:1.6 }}>
            The soul will receive an invite email to set their password and access the platform.
            Tier access is granted immediately via Akashic records.
          </p>
        </SQIModal>
      )}

      {/* View Modal */}
      {modalMode==="view" && selectedUser && (
        <SQIModal onClose={()=>setModalMode(null)}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:gold, marginBottom:8 }}>SOUL PROFILE</div>
          <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 20px" }}>{selectedUser.full_name||"No name set"}</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {[
              ["Email", selectedUser.email || "— not found —"],
              ["ID", selectedUser.id],
              ["Current Tier", TIER_LABELS[selectedUser.tier]||"Free"],
              ["Joined", new Date(selectedUser.created_at).toLocaleString()],
              ["Last Login", selectedUser.last_login_date?new Date(selectedUser.last_login_date).toLocaleString():"Unknown"],
              ["Onboarding", selectedUser.onboarding_completed?"Complete":"Not completed"],
              ["Stripe Sub", selectedUser.stripe_sub||"None"],
            ].map(([label,val])=>(
              <div key={label as string} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{label}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)", maxWidth:"60%", textAlign:"right", wordBreak:"break-all" }}>{val as string}</span>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(167,139,250,0.6)", marginBottom:10 }}>GRANTED PRODUCTS</div>
            {selectedUser.grantedProducts?.length > 0 ? (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {selectedUser.grantedProducts.map((pid:string) => {
                  const prod = PRODUCTS.find(p=>p.id===pid);
                  return (
                    <span key={pid} style={{ fontSize:10, fontWeight:700, color:"#a78bfa", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:8, padding:"5px 10px" }}>
                      {prod?.icon} {prod?.label||pid}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>No individual products granted</span>
            )}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
            <SQIBtn label="Edit Tier" onClick={()=>setModalMode("edit-tier")} color={gold} />
            <SQIBtn label="Edit Products" onClick={()=>{ setModalMode(null); openProductModal(selectedUser); }} color="#a78bfa" />
            <SQIBtn
              label={resetingId===selectedUser.id?"Sending…":"🔑 Send Reset"}
              onClick={()=>handleResetPassword(selectedUser.id, selectedUser.full_name)}
              loading={resetingId===selectedUser.id}
              color={cyan}
            />
            <SQIBtn
              label="🔐 Set Password"
              onClick={()=>handleSetPassword(selectedUser.id)}
              loading={resetingId===selectedUser.id}
              color="#D4AF37"
            />
            <SQIBtn label="Delete" onClick={()=>{ setModalMode(null); setConfirmDelete(selectedUser.id); }} color="#ef4444" />
          </div>
        </SQIModal>
      )}

      {/* Edit Tier Modal */}
      {modalMode==="edit-tier" && selectedUser && (
        <SQIModal onClose={()=>setModalMode(null)}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:gold, marginBottom:8 }}>TIER TRANSMISSION</div>
          <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 6px" }}>{selectedUser.full_name||"No name set"}</h3>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:14 }}>
            Current: <strong style={{ color:TIER_COLORS[selectedUser.tier]||"#fff" }}>{TIER_LABELS[selectedUser.tier]||"Free"}</strong>
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {Object.entries(TIER_LABELS).map(([value,label])=>(
              <button key={value} onClick={()=>setNewTier(value)}
                style={{ background:newTier===value?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.02)", border:`1px solid ${newTier===value?gold:"rgba(255,255,255,0.08)"}`, borderRadius:12, padding:"12px 16px", color:newTier===value?gold:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:newTier===value?700:400, textAlign:"left", cursor:"pointer" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <SQIBtn label={actionLoading?"Saving…":"✦ Grant Tier"} onClick={handleGrantTier} loading={actionLoading} color={gold} />
            <SQIBtn label="Also Edit Products →" onClick={()=>{ setModalMode(null); openProductModal(selectedUser); }} color="#a78bfa" />
            <SQIBtn label="Cancel" onClick={()=>setModalMode(null)} />
          </div>
        </SQIModal>
      )}

      {/* Edit Products Modal */}
      {modalMode==="edit-products" && selectedUser && (
        <SQIModal onClose={()=>setModalMode(null)}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:"#a78bfa", marginBottom:8 }}>PRODUCT TRANSMISSIONS</div>
          <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>{selectedUser.full_name||"No name set"}</h3>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:18 }}>
            Toggle products on/off. Changes are saved together.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {PRODUCTS.map(product => {
              const isGranted = pendingProducts.includes(product.id);
              return (
                <button key={product.id} onClick={()=>toggleProduct(product.id)}
                  style={{
                    background: isGranted ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isGranted ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius:14, padding:"12px 16px", textAlign:"left", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:12, transition:"all 0.15s",
                  }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0, background: isGranted ? "#a78bfa" : "rgba(255,255,255,0.1)", border: `2px solid ${isGranted ? "#a78bfa" : "rgba(255,255,255,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isGranted && <span style={{ color:"#fff", fontSize:10, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:20, lineHeight:1 }}>{product.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: isGranted ? "#a78bfa" : "rgba(255,255,255,0.7)" }}>{product.label}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{product.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:12, marginBottom:16 }}>
            <span style={{ fontSize:10, color:"rgba(167,139,250,0.7)" }}>
              {pendingProducts.length === 0 ? "No products selected — all will be revoked" : `${pendingProducts.length} product${pendingProducts.length>1?"s":""} will be granted`}
            </span>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <SQIBtn label={actionLoading?"Saving…":"◈ Save Product Access"} onClick={handleSaveProducts} loading={actionLoading} color="#a78bfa" />
            <SQIBtn label="Cancel" onClick={()=>setModalMode(null)} />
          </div>
        </SQIModal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <SQIModal onClose={()=>setConfirmDelete(null)}>
          <div style={{ textAlign:"center" }}>
            <AlertTriangle size={36} color="#ef4444" style={{ margin:"0 auto 12px" }} />
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:"#ef4444", marginBottom:8 }}>PERMANENT DELETE</div>
            <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 12px" }}>Delete this soul record?</h3>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, lineHeight:1.6, marginBottom:20 }}>
              Removes auth account, profile, memberships, and all data. Cannot be undone.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <SQIBtn label="Cancel" onClick={()=>setConfirmDelete(null)} />
              <SQIBtn label="Yes, Delete Now" onClick={()=>handleDelete(confirmDelete)} color="#ef4444" loading={actionLoading} />
            </div>
          </div>
        </SQIModal>
      )}
    </div>
  );
}

function IconBtn({icon,title,onClick,color,disabled}:any) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${color?color+"30":"rgba(255,255,255,0.07)"}`, borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:disabled?"not-allowed":"pointer", color:color||"rgba(255,255,255,0.5)", flexShrink:0, opacity:disabled?0.5:1 }}>
      {icon}
    </button>
  );
}
function SQIModal({children,onClose}:any) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={(e:any)=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#0a0a0a", border:"1px solid rgba(212,175,55,0.2)", borderRadius:24, padding:32, maxWidth:540, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 60px rgba(212,175,55,0.1)" }}>
        <button onClick={onClose} style={{ float:"right", background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
        {children}
      </div>
    </div>
  );
}
function SQIBtn({label,onClick,color,loading}:any) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background:color?color+"18":"rgba(255,255,255,0.04)", border:`1px solid ${color?color+"40":"rgba(255,255,255,0.12)"}`, borderRadius:12, padding:"10px 18px", color:color||"rgba(255,255,255,0.6)", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.5:1 }}>
      {label}
    </button>
  );
}
