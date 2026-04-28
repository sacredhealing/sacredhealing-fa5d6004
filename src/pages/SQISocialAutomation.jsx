// @ts-nocheck
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const GOLD = "#D4AF37";
const BLACK = "#050505";
const CYAN = "#22D3EE";

const PROFILES = [
  { id: "kritagya", name: "Kritagya Das", handle: "@kritagya_das", role: "FOUNDER · VISIONARY NODE", avatar: "K", platforms: ["instagram", "tiktok", "youtube", "facebook"], color: GOLD },
  { id: "laila", name: "Laila", handle: "@laila_sqn", role: "CO-FOUNDER · SHAKTI NODE", avatar: "L", platforms: ["instagram", "tiktok"], color: "#E879A0" },
  { id: "nexus", name: "Siddha Quantum Nexus", handle: "@SiddhaQuantumNexus", role: "BUSINESS NODE · THE ASSET", avatar: "SQN", platforms: ["facebook", "instagram"], color: CYAN },
];

const PLATFORM_META = {
  instagram: { label: "Instagram", icon: "📸", color: "#E1306C" },
  tiktok: { label: "TikTok", icon: "🎵", color: "#FF0050" },
  youtube: { label: "YouTube", icon: "▶️", color: "#FF0000" },
  facebook: { label: "Facebook", icon: "📘", color: "#1877F2" },
};

const CONTENT_TYPES = [
  { id: "healing", label: "Healing Activation", emoji: "🔱" },
  { id: "mantra", label: "Mantra Transmission", emoji: "🕉️" },
  { id: "ayurveda", label: "Ayurvedic Wisdom", emoji: "🌿" },
  { id: "astrology", label: "Jyotish Light-Code", emoji: "⭐" },
  { id: "meditation", label: "Meditation Drop", emoji: "🧘" },
  { id: "testimonial", label: "Member Testimony", emoji: "💛" },
];

const glassCard = { background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: 20 };
const sectionLabel = { fontSize: 8, letterSpacing: "0.5em", textTransform: "uppercase", color: GOLD, fontWeight: 800, marginBottom: 14 };
function hexToRgb(hex) { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return r+","+g+","+b; }

export default function SQISocialAutomation() {
  const { user } = useAuth();
  const [activeProfile, setActiveProfile] = useState(PROFILES[0]);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram", "tiktok"]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState({ type: null, message: "" });
  const [postHistory, setPostHistory] = useState([]);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileRef = useRef(null);

  const togglePlatform = (p) => {
    if (!activeProfile.platforms.includes(p)) return;
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleProfileSwitch = (profile) => {
    setActiveProfile(profile);
    setSelectedPlatforms(profile.platforms.slice(0, 2));
    setPostStatus({ type: null, message: "" });
  };

  const handleMedia = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview(ev.target?.result);
    reader.readAsDataURL(file);
  };

  const generateCaption = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedCaption("");
    try {
      const prompt = "You are the SQI 2050 content oracle for " + activeProfile.name + ". Generate a powerful social media caption for " + contentType.label + " content about: \"" + topic + "\". Use Bhakti-Algorithm language (Prema-Pulse, Vedic Light-Codes). Open with a hook, add 3-5 emojis, CTA to sacredhealing.lovable.app, 15-20 hashtags. Under 300 words. Sound devotional and sovereign.";
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      setGeneratedCaption(data.content?.map(c => c.text || "").join("") || "");
    } catch (err) {
      setGeneratedCaption("⚠️ Generation failed. Please try again.");
    }
    setIsGenerating(false);
  };

  const handlePost = async () => {
    if (!generatedCaption.trim()) return;
    setIsPosting(true);
    try {
      await supabase.from("user_activity_log").insert({
        user_id: user?.id,
        activity_type: "social_post",
        metadata: { profile: activeProfile.id, platforms: selectedPlatforms, content_type: contentType.id, topic, caption: generatedCaption, posted_at: new Date().toISOString(), nexus_business_id: "1132282033301868" },
      });
      setPostHistory(prev => [{ id: Date.now(), profile: activeProfile, platforms: selectedPlatforms, caption: generatedCaption.slice(0, 100) + "...", time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      setPostStatus({ type: "success", message: "✓ Logged to Nexus Data Bridge. Platform APIs activate when tokens are live." });
    } catch (err) {
      setPostStatus({ type: "error", message: "Post logging failed." });
    }
    setIsPosting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 10%, rgba(212,175,55,0.06) 0%, transparent 50%), " + BLACK, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "24px 16px", color: "white" }}>
      <div style={{ maxWidth: 900, margin: "0 auto 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, " + GOLD + ", " + CYAN + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>⚡</div>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.5em", textTransform: "uppercase", color: GOLD, fontWeight: 800 }}>SQI 2050 · TRI-NODE SYSTEM</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.05em", margin: 0, background: "linear-gradient(90deg, " + GOLD + ", " + CYAN + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sovereign Content Publisher</h1>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>One transmission → All nodes activated simultaneously</p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={glassCard}>
            <div style={sectionLabel}>ACTIVE NODE</div>
            <div style={{ display: "flex", gap: 10 }}>
              {PROFILES.map(p => (
                <button key={p.id} onClick={() => handleProfileSwitch(p)} style={{ flex: 1, padding: "12px 8px", borderRadius: 16, border: "1px solid " + (activeProfile.id === p.id ? p.color : "rgba(255,255,255,0.05)"), background: activeProfile.id === p.id ? "rgba(" + hexToRgb(p.color) + ",0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px", background: p.color + "22", border: "1px solid " + p.color + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: p.avatar.length > 1 ? 8 : 14, fontWeight: 900, color: p.color }}>{p.avatar}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: activeProfile.id === p.id ? p.color : "rgba(255,255,255,0.6)" }}>{p.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 7, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{p.id === "nexus" ? "BUSINESS" : "PERSONAL"}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase", color: activeProfile.color, fontWeight: 800 }}>{activeProfile.role}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{activeProfile.handle}</div>
            </div>
          </div>

          <div style={glassCard}>
            <div style={sectionLabel}>TRANSMISSION CHANNELS</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {Object.entries(PLATFORM_META).map(([key, meta]) => {
                const available = activeProfile.platforms.includes(key);
                const selected = selectedPlatforms.includes(key);
                return <button key={key} onClick={() => togglePlatform(key)} style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid " + (selected ? meta.color : "rgba(255,255,255,0.08)"), background: selected ? meta.color + "18" : "rgba(255,255,255,0.02)", cursor: available ? "pointer" : "not-allowed", opacity: available ? 1 : 0.3, color: selected ? meta.color : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>{meta.icon} {meta.label}{!available && " 🔒"}</button>;
              })}
            </div>
          </div>

          <div style={glassCard}>
            <div style={sectionLabel}>BHAKTI-ALGORITHM GENERATOR</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {CONTENT_TYPES.map(ct => <button key={ct.id} onClick={() => setContentType(ct)} style={{ padding: "6px 12px", borderRadius: 12, border: "1px solid " + (contentType.id === ct.id ? GOLD : "rgba(255,255,255,0.06)"), background: contentType.id === ct.id ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)", color: contentType.id === ct.id ? GOLD : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>{ct.emoji} {ct.label}</button>)}
            </div>
            <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder={"Enter topic for " + contentType.label + "..."} style={{ width: "100%", minHeight: 80, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, color: "rgba(255,255,255,0.8)", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }} />
            <button onClick={generateCaption} disabled={!topic.trim() || isGenerating} style={{ width: "100%", padding: "13px", borderRadius: 14, background: topic.trim() && !isGenerating ? "linear-gradient(135deg, " + GOLD + ", #B8960C)" : "rgba(255,255,255,0.05)", border: "none", color: topic.trim() && !isGenerating ? BLACK : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 800, cursor: topic.trim() && !isGenerating ? "pointer" : "not-allowed" }}>
              {isGenerating ? "⚡ Channeling..." : "⚡ GENERATE CAPTION"}
            </button>
          </div>

          {(generatedCaption || isGenerating) && (
            <div style={glassCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={sectionLabel}>GENERATED TRANSMISSION</div>
                {generatedCaption && <button onClick={() => navigator.clipboard.writeText(generatedCaption)} style={{ fontSize: 10, color: GOLD, background: "none", border: "1px solid " + GOLD + "44", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>COPY</button>}
              </div>
              {isGenerating ? <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>🔱 Bhakti-Algorithms active...</div> :
                <textarea value={generatedCaption} onChange={e => setGeneratedCaption(e.target.value)} style={{ width: "100%", minHeight: 180, padding: "12px 14px", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 14, color: "rgba(255,255,255,0.85)", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} />}
            </div>
          )}

          <div style={glassCard}>
            <div style={sectionLabel}>MEDIA ATTACHMENT</div>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleMedia} style={{ display: "none" }} />
            {mediaPreview ? <div style={{ position: "relative" }}><img src={mediaPreview} alt="preview" style={{ width: "100%", borderRadius: 12, maxHeight: 200, objectFit: "cover" }} /><button onClick={() => setMediaPreview(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "white", borderRadius: "50%", width: 28, height: 28, cursor: "pointer" }}>✕</button></div> :
              <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: 24, borderRadius: 14, border: "1px dashed rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.03)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12, textAlign: "center" }}><div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>Upload image or video</button>}
          </div>

          <button onClick={handlePost} disabled={!generatedCaption.trim() || isPosting || selectedPlatforms.length === 0} style={{ width: "100%", padding: "16px", borderRadius: 20, background: generatedCaption.trim() && !isPosting ? "linear-gradient(135deg, " + activeProfile.color + ", " + activeProfile.color + "88)" : "rgba(255,255,255,0.05)", border: "none", color: generatedCaption.trim() && !isPosting ? BLACK : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", cursor: generatedCaption.trim() && !isPosting ? "pointer" : "not-allowed" }}>
            {isPosting ? "⚡ TRANSMITTING..." : "⚡ TRANSMIT TO " + selectedPlatforms.length + " PLATFORM" + (selectedPlatforms.length !== 1 ? "S" : "")}
          </button>

          {postStatus.type && <div style={{ padding: "12px 16px", borderRadius: 14, background: postStatus.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid " + (postStatus.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"), color: postStatus.type === "success" ? "#86efac" : "#fca5a5", fontSize: 12 }}>{postStatus.message}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={glassCard}>
            <div style={sectionLabel}>TRI-NODE STATUS</div>
            {PROFILES.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.id === activeProfile.id ? p.color : "rgba(255,255,255,0.2)", boxShadow: p.id === activeProfile.id ? "0 0 8px " + p.color : "none" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.id === activeProfile.id ? p.color : "rgba(255,255,255,0.5)" }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.3em", textTransform: "uppercase" }}>{p.platforms.length} channels</div>
                </div>
                <div style={{ fontSize: 9, color: p.id === activeProfile.id ? p.color : "rgba(255,255,255,0.2)", fontWeight: 700 }}>{p.id === activeProfile.id ? "ACTIVE" : "STANDBY"}</div>
              </div>
            ))}
          </div>

          <div style={glassCard}>
            <div style={sectionLabel}>API STATUS</div>
            {[
              { label: "YouTube API", status: "live" },
              { label: "Meta App", status: "live" },
              { label: "Facebook Page", status: "live" },
              { label: "Instagram", status: "pending" },
              { label: "TikTok", status: "review" },
            ].map(api => (
              <div key={api.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{api.label}</div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: api.status === "live" ? "#86efac" : api.status === "review" ? GOLD : "rgba(255,255,255,0.4)", padding: "3px 8px", borderRadius: 6, background: api.status === "live" ? "rgba(34,197,94,0.1)" : api.status === "review" ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.05)" }}>
                  {api.status === "live" ? "LIVE" : api.status === "review" ? "REVIEW" : "PENDING"}
                </div>
              </div>
            ))}
          </div>

          <div style={glassCard}>
            <div style={sectionLabel}>NEXUS DATA BRIDGE</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>All transmissions logged under Nexus Business ID. Sovereign audience database building.</div>
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.1)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: CYAN, fontWeight: 800 }}>NEXUS PAGE ID</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4, fontFamily: "monospace" }}>1132282033301868</div>
            </div>
          </div>

          {postHistory.length > 0 && (
            <div style={glassCard}>
              <div style={sectionLabel}>TRANSMISSION LOG</div>
              {postHistory.map(post => (
                <div key={post.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    {post.platforms.map(p => <span key={p} style={{ fontSize: 9, color: PLATFORM_META[p]?.color, background: PLATFORM_META[p]?.color + "18", padding: "2px 6px", borderRadius: 4 }}>{PLATFORM_META[p]?.label}</span>)}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{post.caption}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{post.time} · {post.profile.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
