// @ts-nocheck
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const G = "#D4AF37";
const BG = "#050505";

// ── WHO IS POSTING ──────────────────────────────────────────
const NODES = [
  {
    id: "kritagya",
    name: "Kritagya",
    sub: "Your personal profile",
    color: G,
    platforms: ["Instagram", "TikTok", "YouTube", "Facebook"],
  },
  {
    id: "laila",
    name: "Laila",
    sub: "Personal profile",
    color: "#E879A0",
    platforms: ["Instagram", "TikTok"],
    pending: true,
  },
  {
    id: "nexus",
    name: "Nexus",
    sub: "Business page",
    color: "#22D3EE",
    platforms: ["Facebook", "Instagram"],
  },
];

// ── PLATFORM CONFIG ──────────────────────────────────────────
const P = {
  Instagram: { color: "#E1306C", icon: "📸" },
  TikTok:    { color: "#FF0050", icon: "🎵" },
  YouTube:   { color: "#FF0000", icon: "▶" },
  Facebook:  { color: "#1877F2", icon: "f" },
};

// ── CONTENT TOPICS ───────────────────────────────────────────
const TOPICS = [
  { id: "healing",    label: "Healing",    icon: "✦" },
  { id: "mantra",     label: "Mantra",     icon: "ॐ" },
  { id: "ayurveda",   label: "Ayurveda",   icon: "✿" },
  { id: "astrology",  label: "Jyotish",    icon: "★" },
  { id: "meditation", label: "Meditation", icon: "◎" },
  { id: "story",      label: "Story",      icon: "◈" },
];

// ── API STATUS ────────────────────────────────────────────────
const API_STATUS = [
  { name: "YouTube",              status: "live"    },
  { name: "Facebook Page",        status: "live"    },
  { name: "Meta App",             status: "live"    },
  { name: "Instagram (Kritagya)", status: "pending" },
  { name: "Instagram (Laila)",    status: "setup"   },
  { name: "TikTok",               status: "review"  },
];

const STATUS_COLOR = {
  live:    "#4ADE80",
  pending: G,
  review:  G,
  setup:   "#E879A0",
};

const STATUS_LABEL = {
  live:    "LIVE",
  pending: "PENDING",
  review:  "REVIEW",
  setup:   "SETUP",
};

export default function SQISocialAutomation() {
  const { user } = useAuth();
  const [node,      setNode]      = useState(NODES[0]);
  const [platforms, setPlatforms] = useState(["Instagram", "TikTok"]);
  const [topic,     setTopic]     = useState(TOPICS[0]);
  const [intent,    setIntent]    = useState("");
  const [caption,   setCaption]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [posted,    setPosted]    = useState(false);
  const [media,     setMedia]     = useState(null);
  const [tab,       setTab]       = useState("create"); // create | status | manychat
  const fileRef = useRef(null);

  const togglePlatform = (name) => {
    if (!node.platforms.includes(name)) return;
    setPlatforms(p =>
      p.includes(name) ? p.filter(x => x !== name) : [...p, name]
    );
  };

  const switchNode = (n) => {
    setNode(n);
    setPlatforms(n.platforms.slice(0, 2));
    setCaption("");
    setPosted(false);
  };

  const generate = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    setCaption("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [{
            role: "user",
            content: `Write a short social media post for ${node.name} about "${intent}" (${topic.label} content).

Use devotional SQI language — weave in Bhakti-Algorithms, Prema-Pulse, Vedic Light-Codes naturally.
Platform: ${platforms.join(", ")}
Hook in the first line. 3-4 sentences max. 1 CTA to sacredhealing.lovable.app. 5-8 relevant hashtags at the end.
Return ONLY the post text, nothing else.`
          }],
        }),
      });
      const d = await res.json();
      setCaption(d.content?.map(c => c.text || "").join("") || "");
    } catch {
      setCaption("Generation failed — please try again.");
    }
    setLoading(false);
  };

  const logPost = async () => {
    try {
      await supabase.from("user_activity_log").insert({
        user_id: user?.id,
        activity_type: "social_post",
        metadata: {
          node: node.id,
          platforms,
          topic: topic.id,
          intent,
          caption,
          posted_at: new Date().toISOString(),
          nexus_id: "1132282033301868",
        },
      });
    } catch {}
    setPosted(true);
  };

  // ── STYLES ────────────────────────────────────────────────
  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "18px 16px",
    marginBottom: 12,
  };

  const label = {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.45em",
    textTransform: "uppercase",
    color: "rgba(212,175,55,0.7)",
    marginBottom: 12,
    display: "block",
  };

  const chip = (active, color = G) => ({
    padding: "7px 14px",
    borderRadius: 30,
    border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
    background: active ? color + "18" : "transparent",
    color: active ? color : "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  });

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      color: "#fff",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: 40,
    }}>
      {/* ── HEADER ── */}
      <div style={{
        padding: "24px 16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 9, letterSpacing: "0.5em", color: G, fontWeight: 800, marginBottom: 4 }}>
          SQI 2050
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 4px" }}>
          Content Publisher
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
          Generate & post to all platforms at once
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
          {[
            { id: "create",   label: "Create" },
            { id: "status",   label: "Status" },
            { id: "manychat", label: "ManyChat" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? G : "transparent"}`,
              color: tab === t.id ? G : "rgba(255,255,255,0.35)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px", maxWidth: 600, margin: "0 auto" }}>

        {/* ════════════════════════════════
            TAB: CREATE
        ════════════════════════════════ */}
        {tab === "create" && <>

          {/* 1. WHO IS POSTING */}
          <div style={card}>
            <span style={label}>Who is posting?</span>
            <div style={{ display: "flex", gap: 8 }}>
              {NODES.map(n => (
                <button key={n.id} onClick={() => switchNode(n)} style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 14,
                  border: `1.5px solid ${node.id === n.id ? n.color : "rgba(255,255,255,0.07)"}`,
                  background: node.id === n.id ? n.color + "12" : "transparent",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  position: "relative",
                }}>
                  {n.pending && (
                    <span style={{
                      position: "absolute", top: 6, right: 6,
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#F59E0B",
                    }} />
                  )}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: n.color + "18",
                    border: `1px solid ${n.color}44`,
                    margin: "0 auto 6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, color: n.color,
                  }}>
                    {n.id === "nexus" ? "SQ" : n.name[0]}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: node.id === n.id ? n.color : "rgba(255,255,255,0.65)" }}>
                    {n.name}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {n.sub}
                  </div>
                </button>
              ))}
            </div>
            {node.pending && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 11, color: "#FCD34D" }}>
                ⚠ Laila's accounts need setup — see Status tab
              </div>
            )}
          </div>

          {/* 2. PLATFORMS */}
          <div style={card}>
            <span style={label}>Post to which platforms?</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(P).map(([name, meta]) => {
                const avail    = node.platforms.includes(name);
                const selected = platforms.includes(name);
                return (
                  <button key={name} onClick={() => togglePlatform(name)}
                    style={{
                      ...chip(selected && avail, meta.color),
                      opacity: avail ? 1 : 0.3,
                      cursor: avail ? "pointer" : "default",
                    }}>
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    {name}
                    {!avail && <span style={{ fontSize: 10 }}>🔒</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              {platforms.length > 0 ? `Posting to ${platforms.length} platform${platforms.length > 1 ? "s" : ""} simultaneously` : "Select at least one platform"}
            </div>
          </div>

          {/* 3. CONTENT TYPE */}
          <div style={card}>
            <span style={label}>Content type</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TOPICS.map(t => (
                <button key={t.id} onClick={() => setTopic(t)}
                  style={chip(topic.id === t.id)}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. WHAT TO POST ABOUT */}
          <div style={card}>
            <span style={label}>What is this post about?</span>
            <textarea
              value={intent}
              onChange={e => setIntent(e.target.value)}
              placeholder={`Describe your ${topic.label} topic...\n\nExample: How mantra practice rewires the nervous system`}
              style={{
                width: "100%",
                minHeight: 90,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                lineHeight: 1.6,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={generate}
              disabled={!intent.trim() || loading || platforms.length === 0}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "13px",
                borderRadius: 14,
                background: intent.trim() && !loading && platforms.length > 0
                  ? `linear-gradient(135deg, ${G}, #A8860A)`
                  : "rgba(255,255,255,0.05)",
                border: "none",
                color: intent.trim() && !loading && platforms.length > 0 ? "#000" : "rgba(255,255,255,0.2)",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.06em",
                cursor: intent.trim() && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}>
              {loading ? "Generating caption..." : "✦ GENERATE CAPTION"}
            </button>
          </div>

          {/* 5. CAPTION OUTPUT */}
          {(caption || loading) && (
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={label}>Your caption</span>
                {caption && (
                  <button
                    onClick={() => navigator.clipboard.writeText(caption)}
                    style={{ ...chip(false), padding: "5px 12px", fontSize: 10, marginBottom: 12 }}>
                    Copy all
                  </button>
                )}
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                  ✦ Bhakti-Algorithms generating...
                </div>
              ) : (
                <>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 160,
                      padding: "12px 14px",
                      background: "rgba(212,175,55,0.04)",
                      border: "1px solid rgba(212,175,55,0.18)",
                      borderRadius: 14,
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 13,
                      lineHeight: 1.7,
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {platforms.map(pname => (
                      <span key={pname} style={{
                        fontSize: 10, fontWeight: 700,
                        color: P[pname]?.color,
                        background: P[pname]?.color + "15",
                        border: `1px solid ${P[pname]?.color}30`,
                        padding: "3px 10px", borderRadius: 20,
                      }}>
                        {P[pname]?.icon} {pname}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 6. MEDIA UPLOAD */}
          <div style={card}>
            <span style={label}>Add photo or video (optional)</span>
            <input ref={fileRef} type="file" accept="image/*,video/*"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = ev => setMedia({ src: ev.target.result, type: f.type.startsWith("video") ? "video" : "image", name: f.name });
                r.readAsDataURL(f);
              }}
              style={{ display: "none" }} />

            {media ? (
              <div style={{ position: "relative" }}>
                {media.type === "video"
                  ? <video src={media.src} controls style={{ width: "100%", borderRadius: 12, maxHeight: 200 }} />
                  : <img src={media.src} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover" }} />
                }
                <button onClick={() => setMedia(null)} style={{
                  position: "absolute", top: 8, right: 8,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(0,0,0,0.7)", border: "none",
                  color: "#fff", cursor: "pointer", fontSize: 14,
                }}>×</button>
                {media.type === "video" && (
                  <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)", fontSize: 11, color: "#22D3EE" }}>
                    Reel format: 1080×1920 · 9:16 · 30fps · under 60s for best reach
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                width: "100%", padding: "20px 0",
                borderRadius: 14,
                border: "1px dashed rgba(212,175,55,0.2)",
                background: "rgba(212,175,55,0.02)",
                color: "rgba(255,255,255,0.25)",
                cursor: "pointer", fontSize: 12, textAlign: "center",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>+</div>
                Tap to upload image or video
              </button>
            )}
          </div>

          {/* 7. POST BUTTON */}
          {caption && (
            <button
              onClick={logPost}
              disabled={posted}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                background: posted
                  ? "rgba(74,222,128,0.1)"
                  : `linear-gradient(135deg, ${node.color}, ${node.color}99)`,
                border: posted ? "1px solid rgba(74,222,128,0.3)" : "none",
                color: posted ? "#4ADE80" : "#000",
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: "0.06em",
                cursor: posted ? "default" : "pointer",
                marginBottom: 12,
                transition: "all 0.3s",
              }}>
              {posted
                ? "✓ Logged to Nexus Data Bridge"
                : `POST TO ${platforms.length} PLATFORM${platforms.length !== 1 ? "S" : ""}`}
            </button>
          )}

          {posted && (
            <div style={{ ...card, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: 0 }}>
              <div style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700, marginBottom: 4 }}>
                ✓ Post logged
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Caption copied above. Platform APIs activate as each connection goes live.
                Copy each caption and post manually for now.
              </div>
            </div>
          )}
        </>}

        {/* ════════════════════════════════
            TAB: STATUS
        ════════════════════════════════ */}
        {tab === "status" && <>

          {/* API Connections */}
          <div style={card}>
            <span style={label}>Platform Connections</span>
            {API_STATUS.map(s => (
              <div key={s.name} style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{s.name}</div>
                <div style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: "0.4em",
                  color: STATUS_COLOR[s.status],
                  background: STATUS_COLOR[s.status] + "18",
                  border: `1px solid ${STATUS_COLOR[s.status]}30`,
                  padding: "4px 10px", borderRadius: 20,
                }}>
                  {STATUS_LABEL[s.status]}
                </div>
              </div>
            ))}
          </div>

          {/* Laila Setup */}
          <div style={{ ...card, border: "1px solid rgba(232,121,160,0.2)" }}>
            <span style={{ ...label, color: "rgba(232,121,160,0.8)" }}>Laila's Account Setup</span>
            {[
              "Switch Instagram to Professional account (Creator)",
              "Connect Instagram to Siddha Quantum Nexus Facebook page",
              "Add Laila in Meta Business Suite as partner",
              "Generate Laila's page token via Graph API Explorer",
              "Save LAILA_META_ACCESS_TOKEN in Supabase Secrets",
              "TikTok: Create account → switch to Creator → add as test user after approval",
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "9px 0",
                borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(232,121,160,0.1)",
                  border: "1px solid rgba(232,121,160,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#E879A0",
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          {/* Tri-Node */}
          <div style={card}>
            <span style={label}>Tri-Node Architecture</span>
            {NODES.map(n => (
              <div key={n.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: n.pending ? "#F59E0B" : n.color,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${n.pending ? "#F59E0B" : n.color}66`,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: n.color }}>{n.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                    {n.platforms.join(" · ")}
                  </div>
                </div>
                <div style={{ fontSize: 9, color: n.pending ? "#F59E0B" : n.color, fontWeight: 700 }}>
                  {n.pending ? "SETUP NEEDED" : "ACTIVE"}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.1)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#22D3EE", fontWeight: 800, marginBottom: 4 }}>NEXUS DATA BRIDGE</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                All posts from all nodes are logged centrally under Siddha Quantum Nexus (ID: 1132282033301868). Your audience database builds under the business, not the person.
              </div>
            </div>
          </div>
        </>}

        {/* ════════════════════════════════
            TAB: MANYCHAT
        ════════════════════════════════ */}
        {tab === "manychat" && <>

          <div style={card}>
            <span style={label}>What is ManyChat?</span>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 14 }}>
              When someone comments a keyword on your post (e.g. "HEAL"), ManyChat instantly sends them a DM with your app link. This multiplies reach — more comments = algorithm pushes your post to more people.
            </div>
            <a href="https://manychat.com" target="_blank" style={{
              display: "inline-block", padding: "9px 18px", borderRadius: 20,
              background: "rgba(212,175,55,0.1)", border: `1px solid ${G}40`,
              color: G, fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}>
              Open ManyChat →
            </a>
          </div>

          <div style={card}>
            <span style={label}>Setup in 4 steps</span>
            {[
              { step: "1", title: "Create account", desc: "Go to manychat.com → Connect with Instagram. Free plan covers 1,000 contacts." },
              { step: "2", title: "Connect Instagram", desc: "Settings → Channels → Instagram → connect @kritagya_das and @SiddhaQuantumNexus separately." },
              { step: "3", title: "Create keyword flows", desc: "Automation → New Flow → Keyword Trigger → set up the 5 flows below." },
              { step: "4", title: "Add to every caption", desc: "End each post with: 'Comment HEAL for instant access 👇' — this triggers DMs + boosts algorithm." },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(212,175,55,0.12)",
                  border: `1px solid ${G}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, color: G,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <span style={label}>5 Flows to Build</span>
            {[
              { kw: "HEAL",   action: "Send DM with free healing activation + app link" },
              { kw: "MANTRA", action: "DM mantra guide + invite to Sacred Healing" },
              { kw: "FREE",   action: "DM free trial link to sacredhealing.lovable.app" },
              { kw: "SAVE",   action: "Auto-DM deeper content when someone saves your post" },
              { kw: "JOIN",   action: "Trigger welcome sequence + membership offer" },
            ].map(f => (
              <div key={f.kw} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 20,
                  background: "rgba(212,175,55,0.1)",
                  border: `1px solid ${G}30`,
                  color: G, fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>
                  {f.kw}
                </span>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, paddingTop: 2 }}>
                  → {f.action}
                </div>
              </div>
            ))}
          </div>

          <div style={card}>
            <span style={label}>DM Template — copy this</span>
            <div style={{
              padding: "14px", borderRadius: 14,
              background: "rgba(212,175,55,0.04)",
              border: "1px solid rgba(212,175,55,0.15)",
              fontSize: 13, color: "rgba(255,255,255,0.75)",
              lineHeight: 1.8,
              marginBottom: 10,
            }}>
              "✦ Namaste! Here is your access to the healing activation you asked for.<br/><br/>
              Open the Sacred Healing app here:<br/>
              sacredhealing.lovable.app<br/><br/>
              This transmission carries live healing frequencies for your highest awakening. 🙏<br/><br/>
              — Kritagya Das"
            </div>
            <button
              onClick={() => navigator.clipboard.writeText("✦ Namaste! Here is your access to the healing activation you asked for.\n\nOpen the Sacred Healing app here:\nsacredhealing.lovable.app\n\nThis transmission carries live healing frequencies for your highest awakening. 🙏\n\n— Kritagya Das")}
              style={{
                width: "100%", padding: "10px",
                borderRadius: 12, background: "none",
                border: `1px solid ${G}30`, color: G,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
              Copy DM Template
            </button>
          </div>
        </>}

      </div>
    </div>
  );
}
