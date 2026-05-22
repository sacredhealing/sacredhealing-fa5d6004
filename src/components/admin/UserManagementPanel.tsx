// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Pencil, Trash2, RefreshCw, AlertTriangle } from "lucide-react";

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

// Normalise any legacy slug variant to canonical
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

export default function UserManagementPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [showUnnamed, setShowUnnamed] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"view"|"edit"|null>(null);
  const [newTier, setNewTier] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. All profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,created_at,last_login_date,onboarding_completed,birth_date,birth_place")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // 2. membership_tiers — get id->slug map
      const { data: tiers } = await supabase
        .from("membership_tiers")
        .select("id,slug");
      const tierSlugMap: Record<string,string> = {};
      (tiers||[]).forEach((t:any) => { tierSlugMap[t.id] = t.slug; });

      // 3. user_memberships — resolve tier via tierSlugMap
      const { data: memberships } = await supabase
        .from("user_memberships")
        .select("user_id,tier_id,status,stripe_subscription_id,expires_at")
        .eq("status","active");

      // 4. admin_granted_access
      const { data: grants } = await supabase
        .from("admin_granted_access")
        .select("user_id,tier,access_id,is_active,granted_at")
        .eq("is_active",true)
        .eq("access_type","membership");

      // Build maps
      const grantMap: Record<string,string> = {};
      (grants||[]).forEach((g:any) => {
        const slug = canonicalize(g.tier || g.access_id);
        if (!grantMap[g.user_id]) grantMap[g.user_id] = slug;
      });

      const memberMap: Record<string,any> = {};
      (memberships||[]).forEach((m:any) => {
        const slug = canonicalize(tierSlugMap[m.tier_id] || m.tier_id);
        memberMap[m.user_id] = { ...m, tierSlug: slug };
      });

      // Merge: admin grant wins if higher
      const rankOf = (s:string) => s.includes("akasha")||s.includes("life")?3:s.includes("siddha")?2:s.includes("prana")||s.includes("premium")?1:0;

      setUsers((profiles||[]).map((p:any) => {
        const grant = grantMap[p.id];
        const stripe = memberMap[p.id]?.tierSlug;
        let tier = "free";
        if (grant && stripe) tier = rankOf(grant) >= rankOf(stripe) ? grant : stripe;
        else if (grant) tier = grant;
        else if (stripe) tier = stripe;
        return {
          ...p,
          tier: canonicalize(tier),
          stripe_sub: memberMap[p.id]?.stripe_subscription_id || null,
          expires_at: memberMap[p.id]?.expires_at || null,
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
  };

  // Grant tier via admin_granted_access (correct mechanism per check-membership-subscription)
  const handleGrantTier = async () => {
    if (!selectedUser || !newTier) return;
    setActionLoading(true);
    try {
      // Revoke existing grants
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
          granted_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      setUsers(prev => prev.map(u => u.id===selectedUser.id ? {...u, tier:newTier} : u));
      toast({ title:"Tier Updated", description:`${selectedUser.full_name||"User"} → ${TIER_LABELS[newTier]||newTier}` });
      setModalMode(null);
    } catch (e:any) {
      toast({ title:"Error", description:e.message, variant:"destructive" });
    } finally { setActionLoading(false); }
  };

  // Hard delete — call admin edge function (service role: deletes auth user + all data)
  const handleDelete = async (userId: string) => {
    const prevUsers = users;
    setUsers(prev => prev.filter(u => u.id !== userId));
    setConfirmDelete(null);
    setModalMode(null);
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "delete_user", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "User Deleted", description: "Auth account and all data removed." });
    } catch (e: any) {
      setUsers(prevUsers); // rollback
      toast({ title: "Delete Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openUser = (user:any, mode:"view"|"edit") => {
    setSelectedUser(user);
    setNewTier(user.tier||"free");
    setModalMode(mode);
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',Inter,sans-serif", color:"#fff", paddingBottom:60 }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
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

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"TOTAL", value:stats.total, color:"rgba(255,255,255,0.7)" },
          { label:"UNNAMED", value:stats.unnamed, color:"#f59e0b" },
          { label:"PRANA", value:stats.prana, color:cyan },
          { label:"SIDDHA", value:stats.siddha, color:gold },
          { label:"AKASHA", value:stats.akasha, color:"#fff8dc" },
        ].map(s => (
          <div key={s.label} style={{ ...glass, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:7, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Unnamed info */}
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
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.6fr 1fr auto", gap:16, padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            {["SOUL","TIER","JOINED","ACTIONS"].map(h=>(
              <div key={h} style={{ fontSize:8, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{h}</div>
            ))}
          </div>
          {filtered.length===0 ? (
            <div style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>No seekers found.</div>
          ) : filtered.map(user => {
            const tierColor = TIER_COLORS[user.tier]||"rgba(255,255,255,0.3)";
            const initials = user.full_name ? user.full_name.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase() : "?";
            return (
              <div key={user.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.6fr 1fr auto", gap:16, padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:user.full_name?"rgba(212,175,55,0.15)":"rgba(245,158,11,0.1)", border:`1px solid ${user.full_name?"rgba(212,175,55,0.3)":"rgba(245,158,11,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:user.full_name?gold:"#f59e0b", flexShrink:0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:user.full_name?"#fff":"#f59e0b" }}>{user.full_name||"No name set"}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontFamily:"monospace", marginTop:1 }}>{user.id.slice(0,10)}...</div>
                  </div>
                </div>
                <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.25em", textTransform:"uppercase", color:tierColor, background:tierColor+"20", border:`1px solid ${tierColor}40`, borderRadius:8, padding:"4px 10px", display:"inline-block" }}>
                  {TIER_LABELS[user.tier]||"Free Seeker"}
                </span>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                  {new Date(user.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <IconBtn icon={<Eye size={13}/>} title="View" onClick={()=>openUser(user,"view")} />
                  <IconBtn icon={<Pencil size={13}/>} title="Edit Tier" onClick={()=>openUser(user,"edit")} color={gold} />
                  <IconBtn icon={<Trash2 size={13}/>} title="Delete" onClick={()=>setConfirmDelete(user.id)} color="#ef4444" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View/Edit Modal */}
      {modalMode && selectedUser && (
        <SQIModal onClose={()=>setModalMode(null)}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:gold, marginBottom:8 }}>
            {modalMode==="view" ? "SOUL PROFILE" : "TIER TRANSMISSION"}
          </div>
          <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 20px" }}>{selectedUser.full_name||"No name set"}</h3>
          {modalMode==="view" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                ["ID", selectedUser.id],
                ["Name", selectedUser.full_name||"Not set"],
                ["Current Tier", TIER_LABELS[selectedUser.tier]||selectedUser.tier||"Free"],
                ["Joined", new Date(selectedUser.created_at).toLocaleString()],
                ["Last Login", selectedUser.last_login_date?new Date(selectedUser.last_login_date).toLocaleString():"Unknown"],
                ["Onboarding", selectedUser.onboarding_completed?"Complete":"Not completed"],
                ["Birth Date", selectedUser.birth_date||"Not set"],
                ["Stripe Sub", selectedUser.stripe_sub||"None"],
                ["Expires", selectedUser.expires_at?new Date(selectedUser.expires_at).toLocaleDateString():"—"],
              ].map(([label,val])=>(
                <div key={label as string} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>{label}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)", maxWidth:"65%", textAlign:"right", wordBreak:"break-all" }}>{val as string}</span>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
                <SQIBtn label="Edit Tier" onClick={()=>setModalMode("edit")} color={gold} />
                <SQIBtn label="Delete" onClick={()=>{ setModalMode(null); setConfirmDelete(selectedUser.id); }} color="#ef4444" />
              </div>
            </div>
          ) : (
            <div>
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
                <SQIBtn label={actionLoading?"Saving...":"Apply Tier"} onClick={handleGrantTier} loading={actionLoading} color={gold} />
                <SQIBtn label="Cancel" onClick={()=>setModalMode(null)} />
              </div>
            </div>
          )}
        </SQIModal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <SQIModal onClose={()=>setConfirmDelete(null)}>
          <div style={{ textAlign:"center" }}>
            <div style={{ marginBottom:12 }}><AlertTriangle size={36} color="#ef4444" style={{ margin:"0 auto" }} /></div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:"#ef4444", marginBottom:8 }}>PERMANENT DELETE</div>
            <h3 style={{ fontSize:20, fontWeight:900, color:"#fff", margin:"0 0 12px" }}>Delete this user completely?</h3>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, lineHeight:1.6, marginBottom:20 }}>
              Removes profile, memberships, balances, and access grants immediately. The user will vanish from this list and lose all app access.
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

function IconBtn({icon,title,onClick,color}:any) {
  return (
    <button title={title} onClick={onClick}
      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:color||"rgba(255,255,255,0.5)", flexShrink:0 }}>
      {icon}
    </button>
  );
}
function SQIModal({children,onClose}:any) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={(e:any)=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#0a0a0a", border:"1px solid rgba(212,175,55,0.2)", borderRadius:24, padding:32, maxWidth:520, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 60px rgba(212,175,55,0.1)" }}>
        <button onClick={onClose} style={{ float:"right", background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:18, cursor:"pointer", lineHeight:1 }}>x</button>
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
