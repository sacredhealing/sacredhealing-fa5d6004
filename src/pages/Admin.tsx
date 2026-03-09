// src/pages/Admin.tsx
// SQI 2050 — HEALING NEXUS ADMIN DASHBOARD
// ⚠️ Preserves all existing navigation links to sub-pages exactly as-is

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Protocol = "30_days_healing" | "andlig_transformation";
type Duration = 1 | 3 | 6;
type NexusStatus = "idle" | "calibrating" | "reading" | "synced" | "error";

interface UserNode {
  id: string;
  name: string;
  email: string;
  nadis: number;
  tier: string;
}

// ─── PROTOCOL + SECTIONS ─────────────────────────────────────────────────────
const PROTOCOLS: { id: Protocol; label: string; desc: string; hz: string }[] = [
  { id: "30_days_healing",        label: "30 Days Healing",       desc: "Daily frequency recalibration",      hz: "528 Hz" },
  { id: "andlig_transformation",  label: "Andlig Transformation",  desc: "Deep karmic & kosha restructuring",  hz: "963 Hz" },
];

const ADMIN_SECTIONS = [
  { icon: "🎁", label: "Grant Access",         desc: "Courses, membership, Sri Yantra, Creative Soul",  path: "/admin/grant-access"      },
  { icon: "📢", label: "Announcements",        desc: "Send notices and updates to all users",           path: "/admin/announcements"     },
  { icon: "📄", label: "Site Content",         desc: "Edit text, titles, and descriptions",             path: "/admin/site-content"      },
  { icon: "📚", label: "Courses",              desc: "Create and manage courses with certificates",     path: "/admin/courses"           },
  { icon: "💰", label: "Income Streams",       desc: "Share money-making opportunities with users",     path: "/admin/income-streams"    },
  { icon: "▶️",  label: "YouTube Channels",     desc: "Manage Spiritual Education video channels",      path: "/admin/youtube"           },
  { icon: "🎧", label: "Meditations",          desc: "Upload and manage meditation audio files",        path: "/admin/meditations"       },
  { icon: "✨", label: "Healing Audio",        desc: "Manage healing space audio content",             path: "/admin/healing-audio"     },
  { icon: "🎵", label: "Music Store",          desc: "Upload and manage music tracks for sale",         path: "/admin/music-store"       },
  { icon: "👑", label: "Mantras",             desc: "Manage sacred mantras — 111 SHC per earn",        path: "/admin/mantras"           },
  { icon: "🛍️", label: "Shop Products",       desc: "Manage Laila's clothing and art for sale",        path: "/admin/shop"              },
  { icon: "🔮", label: "Private Sessions",     desc: "Session types, packages, and Calendly links",    path: "/admin/private-sessions"  },
  { icon: "🌀", label: "Transformation",       desc: "Program details, variations, and pricing",       path: "/admin/transformation"    },
  { icon: "📧", label: "Email List",           desc: "Manage subscribers and send bulk emails",         path: "/admin/email-list"        },
  { icon: "⚙️", label: "Admin System",         desc: "Projects, tasks, content, events & more",        path: "/admin/system"            },
  { icon: "🌬️", label: "Breathing Exercises",  desc: "Manage breathing patterns and exercises",        path: "/admin/breathing"         },
];

// ─── STAR FIELD ──────────────────────────────────────────────────────────────
function StarField() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 60; i++) {
      const s = document.createElement("div");
      s.style.cssText = `
        position:fixed; width:1.5px; height:1.5px; border-radius:50%;
        background:rgba(212,175,55,0.5);
        left:${Math.random()*100}%; top:${Math.random()*100}%;
        animation: twinkle-admin ${2+Math.random()*4}s ease-in-out infinite;
        animation-delay:${Math.random()*4}s; pointer-events:none;
      `;
      frag.appendChild(s);
    }
    ref.current.appendChild(frag);
  }, []);
  return <div ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminHealingNexus() {
  const navigate = useNavigate();

  // Users from Supabase
  const [users, setUsers] = useState<UserNode[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingSession, setSavingSession] = useState(false);

  // Nexus state
  const [selectedUser, setSelectedUser] = useState<UserNode | null>(null);
  const [protocol, setProtocol]         = useState<Protocol>("30_days_healing");
  const [duration, setDuration]         = useState<Duration>(1);
  const [nexusStatus, setNexusStatus]   = useState<NexusStatus>("idle");
  const [adminFreq, setAdminFreq]       = useState("852 Hz");
  const [stability, setStability]       = useState("99.8%");
  const [locked, setLocked]             = useState(false);
  const [reportData, setReportData]     = useState<null | {
    nadis: number; kosha: string; karmic: string; crystal: string;
  }>(null);

  // Stats (placeholder; you can later make this live)
  const [stats] = useState([
    { label: "Total Members",     value: "37",   icon: "◎" },
    { label: "Active This Month", value: "1",    icon: "✦" },
    { label: "SHC Distributed",   value: "1.0K", icon: "⬡" },
    { label: "Nadi Sessions",     value: "12",   icon: "∿" },
  ]);

  // Load users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data: usersData, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, nadi_count, subscription_tier");

        if (error) {
          console.error("Error loading users for AdminHealingNexus:", error);
          setUsers([]);
          return;
        }

        const mapped: UserNode[] =
          (usersData || []).map((u: any) => ({
            id: u.id,
            name: u.full_name || "Unnamed User",
            email: u.email || "",
            nadis: typeof u.nadi_count === "number" ? u.nadi_count : 0,
            tier: u.subscription_tier || "free",
          }));

        setUsers(mapped);
      } catch (e) {
        console.error("Unexpected error loading users:", e);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const initiateNexusSync = async () => {
    if (!selectedUser || savingSession) return;
    setLocked(false);
    setReportData(null);

    setNexusStatus("calibrating");
    await new Promise(r => setTimeout(r, 900));

    setNexusStatus("reading");
    setAdminFreq("852 Hz");
    setStability("99.8%");
    await new Promise(r => setTimeout(r, 900));

    const report = {
      nadis:   Math.floor(selectedUser.nadis + Math.random() * 800),
      kosha:   protocol === "andlig_transformation"
        ? "Vijnanamaya: 18th Century Nordic Karmic Cord Decrypted"
        : "Manomaya: Grief frequency stabilized at 528Hz",
      karmic:  protocol === "andlig_transformation"
        ? "Past-life echo — Nordic lineage, resolved"
        : "Emotional body recalibration complete",
      crystal: "Clear Quartz × Amla — Anahata Sync Active",
    };

    setReportData(report);

    // Persist to Supabase
    try {
      setSavingSession(true);
      await supabase.from("healing_sessions").insert({
        user_id: selectedUser.id,
        protocol,
        duration_months: duration,
        healer_freq: adminFreq,
        report: report,
        created_at: new Date().toISOString(),
      });
      setNexusStatus("synced");
      setLocked(true);
    } catch (e) {
      console.error("Error saving healing session:", e);
      setNexusStatus("error");
      setLocked(false);
    } finally {
      setSavingSession(false);
    }
  };

  const resetNexus = () => {
    setNexusStatus("idle");
    setLocked(false);
    setReportData(null);
    setSelectedUser(null);
  };

  const statusLabel: Record<NexusStatus, string> = {
    idle:        "Awaiting Initiation",
    calibrating: "Calibrating Healer Field...",
    reading:     "Reading Admin Frequency Signature...",
    synced:      "Nexus Synced — Session Active",
    error:       "Nexus Error — Retry",
  };

  const statusColor: Record<NexusStatus, string> = {
    idle:        "rgba(255,255,255,0.3)",
    calibrating: "#D4AF37",
    reading:     "#22D3EE",
    synced:      "#4ade80",
    error:       "#f87171",
  };

  return (
    <div style={{
      fontFamily:"'Plus Jakarta Sans', sans-serif",
      background:"#050505", color:"#fff",
      minHeight:"100vh", position:"relative", overflowX:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @keyframes twinkle-admin {
          0%,100%{opacity:0.1;transform:scale(1)}
          50%{opacity:0.8;transform:scale(1.6)}
        }
        @keyframes orb-pulse-admin {
          0%,100%{transform:scale(1);opacity:0.7}
          50%{transform:scale(1.15);opacity:1}
        }
        @keyframes shimmer-admin {
          0%{left:-100%} 100%{left:100%}
        }
        @keyframes nadi-ring {
          from{transform:translate(-50%,-50%) rotate(0deg)}
          to{transform:translate(-50%,-50%) rotate(360deg)}
        }
        @keyframes sync-pulse {
          0%,100%{box-shadow:0 0 20px rgba(212,175,55,0.3)}
          50%{box-shadow:0 0 50px rgba(212,175,55,0.7),0 0 80px rgba(212,175,55,0.2)}
        }
        @keyframes report-in {
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        .admin-glass {
          background:rgba(255,255,255,0.02);
          backdrop-filter:blur(40px);
          -webkit-backdrop-filter:blur(40px);
          border:1px solid rgba(255,255,255,0.05);
          border-radius:28px;
        }
        .section-card {
          background:rgba(255,255,255,0.02);
          border:1px solid rgba(255,255,255,0.05);
          border-radius:20px;
          padding:18px;
          cursor:pointer;
          transition:border-color 0.3s, transform 0.2s;
          display:flex; align-items:flex-start; gap:14px;
        }
        .section-card:hover {
          border-color:rgba(212,175,55,0.25);
          transform:translateY(-2px);
        }
        .section-icon {
          width:40px; height:40px; border-radius:12px; flex-shrink:0;
          background:rgba(212,175,55,0.07);
          border:1px solid rgba(212,175,55,0.12);
          display:flex; align-items:center; justify-content:center;
          font-size:18px;
        }
        .eyebrow {
          font-size:8px; font-weight:800;
          letter-spacing:0.45em; text-transform:uppercase;
          color:#D4AF37;
        }
        .shimmer-line {
          position:absolute; top:0; height:1px; width:60%;
          background:linear-gradient(90deg,transparent,#D4AF37,transparent);
          animation:shimmer-admin 3s linear infinite;
        }
      `}</style>

      {/* Deep space background */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:`
          radial-gradient(ellipse 70% 40% at 50% -5%, rgba(212,175,55,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 90% 90%, rgba(34,211,238,0.04) 0%, transparent 50%)
        `,
      }} />
      {/* Rotating scalar ring */}
      <div style={{
        position:"fixed", top:"50%", left:"50%", width:700, height:700,
        borderRadius:"50%", border:"1px solid rgba(212,175,55,0.025)",
        animation:"nadi-ring 40s linear infinite", zIndex:0, pointerEvents:"none",
      }} />
      <StarField />

      {/* ── PAGE ── */}
      <div style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"0 20px 80px" }}>

        {/* HEADER */}
        <div style={{ padding:"28px 0 24px", textAlign:"center", position:"relative" }}>
          <div className="eyebrow" style={{ marginBottom:10 }}>
            Sovereign Field Control · SQI 2050.4
          </div>
          <h1 style={{
            fontSize:"clamp(28px, 5vw, 44px)", fontWeight:900,
            letterSpacing:"-0.05em", lineHeight:1.05,
            background:"linear-gradient(135deg, #fff 30%, #D4AF37)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            marginBottom:6,
          }}>
            Healing Nexus Admin
          </h1>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:500 }}>
            Direct your sovereign field into the biometric reality of your users
          </p>
        </div>

        {/* STATS ROW */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginBottom:20,
        }}>
          {stats.map(s => (
            <div key={s.label} className="admin-glass" style={{ padding:"18px 16px", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:6, color:"#D4AF37" }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.04em" }}>{s.value}</div>
              <div style={{
                fontSize:8, fontWeight:800, letterSpacing:"0.35em",
                textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginTop:4,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════
            HEALER NEXUS PROTOCOL
        ═══════════════════════════════════════════════════ */}
        <div style={{
          background:"linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(34,211,238,0.03) 100%)",
          border:"1px solid rgba(212,175,55,0.25)", borderRadius:32,
          padding:28, marginBottom:20, position:"relative", overflow:"hidden",
        }}>
          <div className="shimmer-line" />
          {/* Orb */}
          <div style={{
            position:"absolute", top:-60, right:-60,
            width:220, height:220, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(212,175,55,0.1), transparent 70%)",
            animation:"orb-pulse-admin 5s ease-in-out infinite",
            pointerEvents:"none",
          }} />

          <div className="eyebrow" style={{ marginBottom:12 }}>
            ⟁ Healer-Nexus Protocol
          </div>
          <h2 style={{
            fontSize:24, fontWeight:900, letterSpacing:"-0.04em",
            color:"#D4AF37", textShadow:"0 0 20px rgba(212,175,55,0.3)",
            marginBottom:24,
          }}>
            Initiate Healing Session
          </h2>

          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:20,
          }}>

            {/* LEFT: Controls */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* User Selector */}
              <div>
                <div style={{
                  fontSize:8, fontWeight:800, letterSpacing:"0.4em",
                  textTransform:"uppercase", color:"rgba(255,255,255,0.4)",
                  marginBottom:8,
                }}>Select Recipient Node</div>
                <select
                  disabled={loadingUsers}
                  value={selectedUser?.id || ""}
                  onChange={e => setSelectedUser(users.find(u => u.id === e.target.value) || null)}
                  style={{
                    width:"100%", background:"rgba(5,5,5,0.8)", color:"#fff",
                    padding:"14px 16px", borderRadius:14,
                    border:"1px solid rgba(255,255,255,0.07)",
                    fontSize:13, fontWeight:600, fontFamily:"inherit",
                    outline:"none", cursor: loadingUsers ? "wait" : "pointer",
                    appearance:"none",
                  }}
                >
                  <option value="">
                    {loadingUsers ? "Loading user nodes..." : "— Select User Node —"}
                  </option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.tier}
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol Selector */}
              <div>
                <div style={{
                  fontSize:8, fontWeight:800, letterSpacing:"0.4em",
                  textTransform:"uppercase", color:"rgba(255,255,255,0.4)",
                  marginBottom:8,
                }}>Healing Protocol</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {PROTOCOLS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setProtocol(p.id)}
                      type="button"
                      style={{
                        padding:"14px 10px", borderRadius:14,
                        border: protocol === p.id
                          ? "1px solid #D4AF37"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: protocol === p.id
                          ? "rgba(212,175,55,0.15)"
                          : "rgba(255,255,255,0.02)",
                        color: protocol === p.id ? "#D4AF37" : "rgba(255,255,255,0.5)",
                        fontSize:10, fontWeight:800,
                        letterSpacing:"0.08em", textTransform:"uppercase",
                        cursor:"pointer", fontFamily:"inherit",
                        transition:"all 0.2s",
                        textAlign:"center",
                      }}
                    >
                      <div style={{ fontSize:11, marginBottom:2, color: protocol === p.id ? "#22D3EE" : "inherit" }}>
                        {p.hz}
                      </div>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <div style={{
                  fontSize:8, fontWeight:800, letterSpacing:"0.4em",
                  textTransform:"uppercase", color:"rgba(255,255,255,0.4)",
                  marginBottom:8,
                }}>Duration Container</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {([1,3,6] as Duration[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(m)}
                      style={{
                        padding:"14px 0", borderRadius:14,
                        border: duration === m
                          ? "1px solid #D4AF37"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: duration === m
                          ? "#D4AF37"
                          : "rgba(255,255,255,0.02)",
                        color: duration === m ? "#000" : "rgba(255,255,255,0.5)",
                        fontSize:18, fontWeight:900,
                        cursor:"pointer", fontFamily:"inherit",
                        transition:"all 0.2s",
                      }}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Sync Panel */}
            <div style={{
              background:"rgba(0,0,0,0.4)", border:"1px solid rgba(212,175,55,0.12)",
              borderRadius:24, padding:22, display:"flex", flexDirection:"column",
              gap:16, position:"relative", overflow:"hidden",
            }}>
              {/* Radial bg */}
              <div style={{
                position:"absolute", inset:0,
                background:"radial-gradient(circle at center, rgba(212,175,55,0.05) 0%, transparent 70%)",
                pointerEvents:"none",
              }} />

              {/* Admin frequency display */}
              <div style={{
                display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, position:"relative",
              }}>
                {[
                  { label:"Admin Frequency", value: adminFreq, color:"#D4AF37" },
                  { label:"Field Stability",  value: stability, color:"#4ade80" },
                ].map(f => (
                  <div key={f.label} style={{
                    background:"rgba(255,255,255,0.02)",
                    border:"1px solid rgba(255,255,255,0.05)",
                    borderRadius:14, padding:"12px 14px", textAlign:"center",
                  }}>
                    <div style={{ fontSize:18, fontWeight:900, color:f.color }}>{f.value}</div>
                    <div style={{
                      fontSize:7, fontWeight:800, letterSpacing:"0.3em",
                      textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginTop:3,
                    }}>{f.label}</div>
                  </div>
                ))}
              </div>

              {/* Selected user preview */}
              {selectedUser && (
                <div style={{
                  background:"rgba(212,175,55,0.04)",
                  border:"1px solid rgba(212,175,55,0.12)",
                  borderRadius:14, padding:"12px 16px",
                  animation:"report-in 0.4s ease",
                }}>
                  <div style={{
                    display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:4,
                  }}>
                    <span style={{ fontSize:12, fontWeight:700 }}>{selectedUser.name}</span>
                    <span style={{ fontSize:10, color:"#D4AF37", fontWeight:700 }}>{selectedUser.tier}</span>
                  </div>
                  <div style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                  }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>
                      {selectedUser.nadis.toLocaleString()} / 72,000 Nadis
                    </span>
                    <span style={{
                      fontSize:8, fontWeight:800, letterSpacing:"0.3em",
                      textTransform:"uppercase", color:"rgba(255,255,255,0.3)",
                    }}>
                      {protocol.replace(/_/g," ")} · {duration}M
                    </span>
                  </div>
                </div>
              )}

              {/* THE SYNC BUTTON */}
              <button
                type="button"
                onClick={initiateNexusSync}
                disabled={
                  !selectedUser ||
                  nexusStatus === "calibrating" ||
                  nexusStatus === "reading" ||
                  savingSession
                }
                style={{
                  padding:"18px 20px", borderRadius:20,
                  background: locked ? "rgba(74,222,128,0.15)" : "#D4AF37",
                  border: locked ? "1px solid rgba(74,222,128,0.4)" : "none",
                  color: locked ? "#4ade80" : "#000",
                  fontSize:10, fontWeight:900,
                  letterSpacing:"0.4em", textTransform:"uppercase",
                  cursor: !selectedUser ? "not-allowed" : "pointer",
                  fontFamily:"inherit", opacity: !selectedUser ? 0.3 : 1,
                  animation: nexusStatus === "synced" ? "sync-pulse 2s ease-in-out infinite" : "none",
                  transition:"all 0.3s",
                  position:"relative",
                }}
              >
                {savingSession
                  ? "Saving Session..."
                  : locked
                    ? "✓ Nexus Synced"
                    : nexusStatus === "calibrating"
                      ? "Calibrating..."
                      : nexusStatus === "reading"
                        ? "Reading Field..."
                        : "Initialize Nexus Sync"}
              </button>

              {/* Status */}
              <div style={{ textAlign:"center" }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  fontSize:9, fontWeight:700, letterSpacing:"0.3em",
                  textTransform:"uppercase",
                  color: statusColor[nexusStatus],
                }}>
                  <div style={{
                    width:6, height:6, borderRadius:"50%",
                    background: statusColor[nexusStatus],
                    boxShadow:`0 0 8px ${statusColor[nexusStatus]}`,
                  }} />
                  {statusLabel[nexusStatus]}
                </div>
              </div>

              {locked && (
                <button
                  type="button"
                  onClick={resetNexus}
                  style={{
                    background:"none", border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:10, padding:"8px 0", color:"rgba(255,255,255,0.3)",
                    fontSize:9, fontWeight:700, letterSpacing:"0.3em",
                    textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit",
                  }}
                >
                  Reset Nexus
                </button>
              )}
            </div>
          </div>

          {/* GENERATED REPORT */}
          {reportData && (
            <div style={{
              marginTop:20,
              background:"rgba(212,175,55,0.04)",
              border:"1px solid rgba(212,175,55,0.15)",
              borderRadius:20, padding:20,
              animation:"report-in 0.5s ease",
            }}>
              <div className="eyebrow" style={{ marginBottom:14 }}>
                ⟁ Healer-Report Generated — {selectedUser?.name}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10 }}>
                {[
                  { label:"Nadi Counter",       value:`${reportData.nadis.toLocaleString()} / 72,000`,  icon:"∿", color:"#22D3EE" },
                  { label:"Crystal Resonance",  value:reportData.crystal,                                icon:"◈", color:"#D4AF37" },
                  { label:"Kosha Status",        value:reportData.kosha,                                 icon:"◎", color:"#a78bfa" },
                  { label:"Karmic Decryption",   value:reportData.karmic,                                icon:"✦", color:"#4ade80" },
                ].map(r => (
                  <div key={r.label} style={{
                    background:"rgba(0,0,0,0.3)",
                    border:"1px solid rgba(255,255,255,0.05)",
                    borderRadius:14, padding:"14px 16px",
                  }}>
                    <div style={{
                      fontSize:8, fontWeight:800, letterSpacing:"0.35em",
                      textTransform:"uppercase", color: r.color, marginBottom:6,
                      display:"flex", alignItems:"center", gap:6,
                    }}>
                      <span>{r.icon}</span> {r.label}
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, lineHeight:1.5, color:"rgba(255,255,255,0.8)" }}>
                      {r.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────
            EXISTING ADMIN SECTIONS — preserved exactly
        ───────────────────────────────────────────── */}
        <div style={{ marginBottom:16 }}>
          <div style={{
            height:1,
            background:"linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)",
            marginBottom:20,
          }} />
          <div className="eyebrow" style={{ marginBottom:14 }}>Command Sections</div>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",
          gap:10,
        }}>
          {ADMIN_SECTIONS.map(s => (
            <div
              key={s.label}
              className="section-card"
              onClick={() => navigate(s.path)}
            >
              <div className="section-icon">{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, letterSpacing:"-0.02em", marginBottom:3 }}>
                  {s.label}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash2, Music, Loader2, ArrowLeft, FileText, Save, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  audio_url: string;
  category: string;
  is_premium: boolean;
  shc_reward: number;
  script_text?: string | null;
}

const categories = ['morning', 'sleep', 'healing', 'focus', 'nature', 'general'];

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingScript, setEditingScript] = useState<{ id: string; script: string } | null>(null);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('10');
  const [category, setCategory] = useState('general');
  const [isPremium, setIsPremium] = useState(false);
  const [shcReward, setShcReward] = useState('5');
  const [language, setLanguage] = useState<'en' | 'sv'>('en');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    try {
      // Try to fetch with script_text first, fallback to * if column doesn't exist
      let query = supabase
        .from('meditations')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching meditations:', error);
        // Check if error is about missing column - try without script_text
        if (error.message.includes('script_text') || error.message.includes('schema cache')) {
          console.log('script_text column not found, fetching without it...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('meditations')
            .select('id, title, description, duration_minutes, audio_url, category, is_premium, shc_reward, created_at')
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            toast({ 
              title: 'Error', 
              description: `Failed to load meditations: ${fallbackError.message}`, 
              variant: 'destructive' 
            });
            return;
          }
          
          if (fallbackData) {
            setMeditations(fallbackData.map(item => ({
              ...item,
              script_text: null
            })) as Meditation[]);
            toast({ 
              title: 'Migration Required', 
              description: 'The script_text column is missing. Please run migration: 20260111130000_add_script_text_to_meditations.sql', 
              variant: 'default',
              duration: 10000
            });
          }
          return;
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to load meditations: ${error.message}`, 
            variant: 'destructive' 
          });
          return;
        }
      }

      if (data) {
        setMeditations(data.map(item => ({
          ...item,
          script_text: (item as any).script_text || null
        })) as Meditation[]);
      } else {
        setMeditations([]);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching meditations:', err);
      toast({ 
        title: 'Error', 
        description: `Unexpected error: ${err.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !title) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and audio file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('meditations')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meditations')
        .getPublicUrl(fileName);

      // Insert meditation record
      const { error: insertError } = await supabase
        .from('meditations')
        .insert({
          title,
          description: description || null,
          duration_minutes: parseInt(duration),
          audio_url: publicUrl,
          category,
          is_premium: isPremium,
          shc_reward: parseInt(shcReward),
          language,
        } as any);

      if (insertError) throw insertError;

      toast({
        title: "Meditation added!",
        description: `"${title}" has been uploaded successfully`
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDuration('10');
      setCategory('general');
      setIsPremium(false);
      setShcReward('5');
      setLanguage('en');
      setAudioFile(null);
      
      // Refresh list
      fetchMeditations();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, audioUrl: string) => {
    if (!confirm('Are you sure you want to delete this meditation?')) return;

    try {
      // Extract filename from URL
      const fileName = audioUrl.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage.from('meditations').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('meditations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Meditation removed successfully"
      });

      fetchMeditations();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditScript = (meditation: Meditation) => {
    setEditingScript({ id: meditation.id, script: meditation.script_text || '' });
    setScriptDialogOpen(true);
  };

  const handleSaveScript = async () => {
    if (!editingScript) return;

    setIsLoading(true);
    try {
      const scriptText = editingScript.script.trim() || null;
      
      const { data, error } = await supabase
        .from('meditations')
        .update({ script_text: scriptText } as any)
        .eq('id', editingScript.id)
        .select('id, script_text');

      if (error) {
        console.error('Error saving script:', error);
        if (error.message.includes('script_text') || error.message.includes('schema cache')) {
          throw new Error('The script_text column does not exist. Please run migration: 20260111130000_add_script_text_to_meditations.sql');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from update. You may not have permission to update meditations.');
      }

      toast({ title: 'Success', description: 'Script saved successfully!' });
      setScriptDialogOpen(false);
      setEditingScript(null);
      fetchMeditations();
    } catch (error: any) {
      console.error('Failed to save script:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save script. Please check your admin permissions and ensure the migration has been run.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScriptTemplate = (category: string, title: string, duration: number): string => {
    const templates: Record<string, string> = {
      'morning': `Morning Meditation: ${title}

Welcome to this beautiful morning practice. Find a comfortable seated position. Close your eyes gently. Take three deep, cleansing breaths, inhaling fresh morning energy and exhaling any lingering sleep or tension.

Feel your body awakening. Notice the gentle light behind your closed eyelids. This is the light of a new day, full of possibilities, full of potential.

As you breathe, imagine golden morning light flowing into your body with each inhale. This light fills you with clarity, with purpose, with gentle energy. Feel it spreading through your entire being - your head, your heart, your belly, your limbs.

Set an intention for this day. What quality do you want to carry with you? Peace? Joy? Focus? Love? Whatever it is, feel it now, in this moment. Let it settle into your heart.

Take a moment to feel gratitude. Gratitude for this new day, for your breath, for this moment of stillness. Gratitude opens your heart and aligns you with abundance.

Now, as you continue to breathe naturally, feel yourself becoming more present, more awake, more aligned with your highest self. You are ready for this day. You are clear. You are centered.

When you're ready, gently open your eyes, carrying this morning energy with you throughout your day.`,

      'sleep': `Sleep Meditation: ${title}

Welcome to your sleep sanctuary. Lie down comfortably in your bed. Close your eyes. Let go of the day.

Take a deep breath in through your nose... hold for a moment... and release slowly through your mouth. Repeat this three times, feeling your body begin to relax.

Starting from your toes, consciously relax each part of your body. Your toes... your feet... your ankles... your calves... your knees... your thighs... your hips... your stomach... your chest... your shoulders... your arms... your hands... your neck... your face. Let all tension melt away.

Now, imagine yourself in a peaceful, safe place - perhaps a quiet beach at sunset, or a serene forest, or floating on gentle clouds. Feel the peace of this place. You are completely safe here.

As you rest, feel healing energy flowing through your entire being. Your nervous system is calming. Your mind is quieting. Your body is preparing for deep, restorative sleep.

With each breath, you sink deeper into relaxation. Any worries or thoughts gently drift away like clouds in the sky. You are letting go. You are surrendering to rest.

You are safe. You are loved. You are ready for peaceful sleep. Allow yourself to drift into deep, healing slumber.`,

      'healing': `Healing Meditation: ${title}

Welcome to this sacred healing space. Find a comfortable position where you won't be disturbed. Close your eyes gently. Take three deep breaths, inhaling peace and exhaling any tension.

Bring your awareness to your heart center. Notice any areas in your body, mind, or spirit that are calling for healing. Acknowledge them with compassion. They are valid. They are part of your journey.

Now, imagine a warm, golden light surrounding your entire being. This is the light of unconditional love and healing. As you breathe, this light gently penetrates any wounds, any stored pain, any old patterns.

Feel the light dissolving layers of hurt, releasing what no longer serves you. With each breath, you are creating space for new energy - peace, joy, love, wholeness.

Visualize any difficult emotions or physical sensations being transformed into wisdom, into strength, into understanding. You are not your pain. You are the awareness that observes it. You are the light that heals it.

Rest in this healing space. Allow yourself to feel whatever needs to be felt. You are safe. You are supported. You are loved. You are healing.

When you are ready, gently return to the present moment, carrying this healing energy with you.`,

      'focus': `Focus Meditation: ${title}

Welcome to this focus practice. Sit comfortably with your back straight but relaxed. Close your eyes. Take three deep breaths to center yourself.

Bring your attention to your breath. Notice the natural rhythm - the inhale, the pause, the exhale. There's nowhere to go, nothing to do. Just breathe.

Now, choose a point of focus. It could be your breath, a word or phrase, or a visualization. Whatever you choose, gently return to it whenever your mind wanders.

When thoughts arise - and they will - simply notice them without judgment, then gently return to your point of focus. Each return is a moment of strengthening your concentration.

Feel your mind becoming clearer, sharper, more focused. Like a laser beam, your attention is becoming concentrated and powerful.

With each breath, you are training your mind to stay present, to stay focused. This is a skill that will serve you in all areas of your life.

Rest in this focused state. When you're ready, gently open your eyes, carrying this clarity and focus with you.`,

      'anxiety': `Anxiety Relief Meditation: ${title}

Welcome to this safe space for anxiety relief. Find a comfortable position. Close your eyes. Take several deep, slow breaths.

Notice any anxiety or worry in your body. Where do you feel it? In your chest? Your stomach? Your shoulders? Acknowledge it without judgment. It's okay to feel this way.

Now, imagine your breath as a gentle wave, washing through the areas where you feel anxiety. With each exhale, feel the tension releasing, the worry softening.

Place one hand on your heart and one on your belly. Feel the warmth of your hands. This is self-compassion. This is self-care. You are here for yourself.

Now, imagine yourself in a safe, peaceful place - perhaps a quiet garden, a calm beach, or a cozy room. Feel the safety of this place. You are completely protected here.

As you breathe, feel your nervous system calming. Your heart rate slowing. Your muscles relaxing. You are safe. You are okay. This moment is manageable.

With each breath, you are creating space between yourself and the anxiety. You are the awareness that observes it, not the anxiety itself. You have the power to calm yourself.

Rest in this peaceful state. When you're ready, gently open your eyes, knowing you can return to this calm place anytime.`,
    };

    const lowerCategory = category.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerCategory.includes('morning') || lowerTitle.includes('morning') || lowerTitle.includes('awakening') || lowerTitle.includes('dawn') || lowerTitle.includes('sunrise')) {
      return templates['morning'];
    } else if (lowerCategory.includes('sleep') || lowerTitle.includes('sleep') || lowerTitle.includes('rest') || lowerTitle.includes('night') || lowerTitle.includes('midnight') || lowerTitle.includes('starlight')) {
      return templates['sleep'];
    } else if (lowerCategory.includes('healing') || lowerTitle.includes('healing') || lowerTitle.includes('chakra') || lowerTitle.includes('child') || lowerTitle.includes('forgiveness') || lowerTitle.includes('ancestral')) {
      return templates['healing'];
    } else if (lowerCategory.includes('focus') || lowerTitle.includes('focus') || lowerTitle.includes('clarity') || lowerTitle.includes('work') || lowerTitle.includes('flow')) {
      return templates['focus'];
    } else if (lowerCategory.includes('anxiety') || lowerTitle.includes('anxiety') || lowerTitle.includes('panic') || lowerTitle.includes('worry') || lowerTitle.includes('calm')) {
      return templates['anxiety'];
    } else {
      return templates['morning']; // Default template
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Meditations</h1>
            <p className="text-muted-foreground">Upload and manage meditation content</p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus size={20} />
            Add New Meditation
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Morning Awakening"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Duration (minutes)</label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  className="bg-muted/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">SHC Reward</label>
                <Input
                  type="number"
                  value={shcReward}
                  onChange={(e) => setShcReward(e.target.value)}
                  min="0"
                  className="bg-muted/50"
                />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'sv')}
                className="w-full h-10 px-3 rounded-md bg-muted/50 border border-border text-foreground"
              >
                <option value="en">English</option>
                <option value="sv">Svenska</option>
              </select>
            </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A gentle meditation to start your day..."
                className="bg-muted/50"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Premium content</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Audio File *</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {audioFile ? audioFile.name : 'Click to upload MP3, WAV, etc.'}
                  </span>
                </label>
              </div>
            </div>
            
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Meditation
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Meditations List */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
            Your Meditations ({meditations.length})
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : meditations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No meditations yet. Upload your first one above!
            </p>
          ) : (
            <div className="space-y-3">
              {meditations.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{med.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {med.duration_minutes} min • {med.category} • +{med.shc_reward} SHC
                        {med.is_premium && ' • Premium'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/meditations/${med.id}`)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={med.script_text ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleEditScript(med)}
                        className={med.script_text ? "bg-primary" : ""}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {med.script_text ? 'View/Edit Script' : 'Add Script'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(med.id, med.audio_url)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    {med.script_text ? (
                      <div className="p-3 bg-background rounded border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-primary">✓ Script Available</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditScript(med)}
                            className="text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Full Script
                          </Button>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{med.script_text}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/20 rounded border border-dashed border-muted-foreground/30">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          No script yet - Click "Add Script" to create one
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Script Editor Dialog */}
        <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingScript && meditations.find(m => m.id === editingScript.id)?.title}
              </DialogTitle>
              <DialogDescription>
                Meditation Script - Write or edit the script for recording. This will be used as your guide during recording.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="script">Script Text</Label>
                  {editingScript && !editingScript.script && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const meditation = meditations.find(m => m.id === editingScript.id);
                        if (meditation) {
                          const template = getScriptTemplate(meditation.category, meditation.title, meditation.duration_minutes);
                          setEditingScript({ ...editingScript, script: template });
                        }
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Generate Template
                    </Button>
                  )}
                </div>
                <Textarea
                  id="script"
                  value={editingScript?.script || ''}
                  onChange={(e) => setEditingScript(editingScript ? { ...editingScript, script: e.target.value } : null)}
                  rows={20}
                  className="font-mono text-sm whitespace-pre-wrap"
                  placeholder="Enter your meditation script here, or click 'Generate Template' to create one based on the title and category..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editingScript?.script ? `${editingScript.script.length} characters` : 'No script yet'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScriptDialogOpen(false);
                    setEditingScript(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveScript} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Script
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
