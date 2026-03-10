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
      await (supabase as any).from("healing_sessions").insert({
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


