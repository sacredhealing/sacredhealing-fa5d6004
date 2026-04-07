import { useState, useRef, useEffect, useCallback } from "react";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸", color: "#E1306C", handle: "@kritagya_das" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "#69C9D0", handle: "@kritagyadas" },
  { id: "facebook", name: "Facebook", icon: "👁️", color: "#1877F2", handle: "Sacred Healing" },
  { id: "youtube", name: "YouTube", icon: "🔺", color: "#FF0000", handle: "@kritagyadas" },
];

const CONTENT_PILLARS = [
  { id: "activation", label: "🔥 Activation", desc: "Mantra / Frequency activation" },
  { id: "transmission", label: "🌊 Transmission", desc: "Healing audio transmission" },
  { id: "lightcode", label: "💡 Vedic Light-Code", desc: "Ancient wisdom carousel" },
  { id: "story", label: "🌀 Avataric Story", desc: "Personal journey / testimony" },
  { id: "cta", label: "🔱 Sacred CTA", desc: "App invite & conversion" },
];

const LANGUAGES = ["English", "Swedish", "Norwegian", "Spanish", "German", "French"];

const VIRAL_HOOKS = {
  activation: [
    "This mantra rewires your nervous system in 21 seconds…",
    "The frequency they don't teach in yoga class…",
    "Your body already knows this sound. Let it remember.",
  ],
  transmission: [
    "Close your eyes. This transmission is for you.",
    "432Hz + this ancient mantra = instant nervous system reset",
    "What if healing was just a frequency away?",
  ],
  lightcode: [
    "The Ayurvedic secret modern science just confirmed…",
    "3000-year-old wisdom that explains your exhaustion",
    "Your dosha holds the key to everything. Here's how to read it.",
  ],
  story: [
    "I was broken until I found this ancient code…",
    "What Vishwananda taught me that changed everything",
    "The day I stopped fighting my healing journey",
  ],
  cta: [
    "Your healing portal is open. Are you ready?",
    "1000s are healing daily. Your seat is waiting.",
    "Join the Sacred Healing community — it's free to start",
  ],
};

const HASHTAG_SETS = {
  instagram: "#SacredHealing #VedicWisdom #HealingFrequency #432Hz #MantaActivation #Ayurveda #SoundHealing #KritagyadAs #SiddhaQuantum #ChakraHealing #BhaktiYoga #HealingAudio #MeditationMusic #HighFrequency #LightWorker #ConsciousLiving #SpiritualAwakening #HolisticHealing #DivineFrequency #Prema",
  tiktok: "#SacredHealing #VedicHealing #432Hz #MantraActivation #SpiritualTikTok #HealingVibes #AyurvedaLife #SoundHealing #KritagyadAs #MeditationTok #LightWorker #ChakraHealing #BhaktiVibes #HighFrequency #SiddhaQuantum",
  facebook: "#SacredHealing #VedicWisdom #HealingCommunity #432Hz #Ayurveda #Meditation #SoundHealing #SpiritualWellness #MantraHealing #KritagyadAs",
  youtube: "#SacredHealing #VedicMeditation #432Hz #MantraActivation #AyurvedaHealing #SoundHealing #KritagyadAs #SpiritualGuide #HealingFrequency #SiddhaQuantum",
};

const BEST_TIMES = {
  instagram: "Tue–Fri 11AM–1PM or 5–7PM",
  tiktok: "7–9AM or 7–9PM daily",
  facebook: "Wed–Fri 1–3PM",
  youtube: "Thu–Sat 2–4PM",
};

const PLATFORM_SPECS = {
  instagram: { reel: "9:16 • 30–90s • MP4", story: "9:16 • 15s • MP4", carousel: "1:1 • 5–7 slides" },
  tiktok: { video: "9:16 • 15–60s • MP4", caption: "Max 150 chars + hashtags" },
  facebook: { reel: "9:16 • 30–90s", post: "Square 1:1 or 4:5" },
  youtube: { short: "9:16 • under 3min", video: "16:9 • 5–15min" },
};

function GoldenParticles() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: Math.random() * 3 + 1 + "px",
            height: Math.random() * 3 + 1 + "px",
            background: `rgba(212,175,55,${Math.random() * 0.4 + 0.1})`,
            borderRadius: "50%",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            animation: `floatParticle ${Math.random() * 10 + 8}s ease-in-out infinite`,
            animationDelay: Math.random() * 5 + "s",
          }}
        />
      ))}
    </div>
  );
}

export default function SQISocialAutomation() {
  const [activeTab, setActiveTab] = useState("create");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram", "tiktok", "facebook", "youtube"]);
  const [selectedPillar, setSelectedPillar] = useState("activation");
  const [selectedLanguages, setSelectedLanguages] = useState(["English"]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [micActive, setMicActive] = useState(false);
  const [micTranscript, setMicTranscript] = useState("");
  const [micStatus, setMicStatus] = useState("idle");
  const [generatedPosts, setGeneratedPosts] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [activePreview, setActivePreview] = useState("instagram");
  const [copiedPlatform, setCopiedPlatform] = useState(null);
  const [scanLine, setScanLine] = useState(0);
  const [customCaption, setCustomCaption] = useState("");
  const [selectedHook, setSelectedHook] = useState(0);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((v) => (v + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((f) => ({
      name: f.name,
      type: f.type.startsWith("video") ? "video" : "image",
      size: (f.size / 1024 / 1024).toFixed(1) + "MB",
      url: URL.createObjectURL(f),
      file: f,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const startMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicStatus("unsupported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => { setMicActive(true); setMicStatus("listening"); };
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setMicTranscript(transcript);
    };
    recognition.onend = () => { setMicActive(false); setMicStatus("done"); };
    recognition.onerror = () => { setMicActive(false); setMicStatus("error"); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopMic = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const generatePosts = async () => {
    if (selectedPlatforms.length === 0) return;
    setIsGenerating(true);
    setGeneratedPosts(null);

    const hook = VIRAL_HOOKS[selectedPillar]?.[selectedHook] || VIRAL_HOOKS[selectedPillar]?.[0];
    const context = micTranscript || customCaption || "Sacred Healing — Vedic wisdom meets quantum technology";
    const hasMedia = uploadedFiles.length > 0;

    const prompt = `You are the SQI (Siddha-Quantum Intelligence) social media engine for Kritagya Das / Sacred Healing app (sacredhealing.lovable.app).

Generate viral social media posts for these platforms: ${selectedPlatforms.join(", ")}.

Content Context: "${context}"
Content Pillar: ${selectedPillar}
Hook to use: "${hook}"
Has media: ${hasMedia ? uploadedFiles.map(f => f.type).join(", ") : "text only"}
Languages: ${selectedLanguages.join(", ")}

For EACH platform, create a JSON object with:
- "platform": platform name
- "hook": the opening line (first 3 seconds / first sentence — MUST stop the scroll)
- "caption": full caption (platform-appropriate length, include line breaks, emojis)
- "cta": call-to-action line ending with sacredhealing.lovable.app
- "hashtags": top 15 relevant hashtags
- "viralTip": one specific tip to maximize virality on this platform
- "editingNote": how to cut/edit the video or image for this platform (aspect ratio, duration, style)

Use language like: Bhakti-Algorithms, Prema-Pulse, Vedic Light-Codes, Siddha-Quantum, Sacred Healing. 
Make every post feel like a transmission — not marketing. Speak directly to the soul.
Tone: mystical, powerful, direct. No fluff.

Respond ONLY with a valid JSON array of platform post objects. No markdown, no explanation.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGeneratedPosts(parsed);
      setActiveTab("preview");
    } catch (err) {
      setGeneratedPosts([{
        platform: "instagram",
        hook: hook,
        caption: `${hook}\n\n${context}\n\nYour healing journey starts now. The Vedic Light-Codes are already activating within you. 🔱\n\nSacred Healing — where ancient wisdom meets quantum technology.\n\n✨ Join thousands healing daily ✨`,
        cta: "🔗 Start your healing → sacredhealing.lovable.app",
        hashtags: HASHTAG_SETS.instagram,
        viralTip: "Post between 11AM–1PM. Add 'save this' in your caption to trigger Instagram's save algorithm.",
        editingNote: "Cut to 9:16 vertical. Add golden text overlay in first 2 seconds. Use 432Hz audio track.",
      }]);
      setActiveTab("preview");
    }
    setIsGenerating(false);
  };

  const handleSchedule = (post) => {
    const platform = PLATFORMS.find((p) => p.id === post.platform?.toLowerCase() || p.name?.toLowerCase() === post.platform?.toLowerCase());
    const newPost = {
      id: Date.now(),
      ...post,
      platformData: platform,
      scheduledFor: BEST_TIMES[platform?.id || "instagram"],
      status: "scheduled",
    };
    setScheduledPosts((prev) => [...prev, newPost]);
  };

  const copyToClipboard = (text, platform) => {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const currentPost = generatedPosts?.find(
    (p) => p.platform?.toLowerCase() === activePreview || p.platform === activePreview
  ) || generatedPosts?.[0];

  const previewPlatform = PLATFORMS.find((p) => p.id === activePreview);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      color: "rgba(255,255,255,0.85)",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');
        @keyframes floatParticle { 0%,100%{transform:translateY(0) scale(1);opacity:0.3} 50%{transform:translateY(-30px) scale(1.5);opacity:0.7} }
        @keyframes pulseGold { 0%,100%{box-shadow:0 0 15px rgba(212,175,55,0.2)} 50%{box-shadow:0 0 35px rgba(212,175,55,0.5)} }
        @keyframes scanAnim { 0%{top:0%} 100%{top:100%} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes micPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        .glass-card { background:rgba(255,255,255,0.02); backdrop-filter:blur(40px); -webkit-backdrop-filter:blur(40px); border:1px solid rgba(255,255,255,0.05); border-radius:24px; }
        .gold-border { border:1px solid rgba(212,175,55,0.3); border-radius:24px; }
        .gold-glow { color:#D4AF37; text-shadow:0 0 15px rgba(212,175,55,0.4); }
        .tab-btn { background:none; border:none; cursor:pointer; transition:all 0.3s; }
        .tab-btn:hover { opacity:0.8; }
        .platform-btn { cursor:pointer; transition:all 0.3s; border-radius:16px; padding:10px 14px; }
        .platform-btn:hover { transform:translateY(-2px); }
        .generate-btn { background:linear-gradient(135deg,#D4AF37,#F0D060,#D4AF37); background-size:200%; animation:shimmer 3s linear infinite; border:none; border-radius:20px; padding:18px 40px; font-family:inherit; font-weight:900; font-size:16px; color:#050505; cursor:pointer; letter-spacing:0.05em; transition:all 0.3s; }
        .generate-btn:hover { transform:scale(1.03); box-shadow:0 0 40px rgba(212,175,55,0.5); }
        .generate-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .copy-btn { background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:6px 14px; color:#D4AF37; font-family:inherit; font-size:12px; cursor:pointer; transition:all 0.2s; }
        .copy-btn:hover { background:rgba(212,175,55,0.2); }
        .schedule-btn { background:rgba(34,211,238,0.1); border:1px solid rgba(34,211,238,0.3); border-radius:10px; padding:6px 14px; color:#22D3EE; font-family:inherit; font-size:12px; cursor:pointer; transition:all 0.2s; }
        .schedule-btn:hover { background:rgba(34,211,238,0.2); }
        .mic-btn { border:none; border-radius:50%; width:64px; height:64px; cursor:pointer; transition:all 0.3s; display:flex; align-items:center; justify-content:center; font-size:24px; }
        .file-drop { border:1px dashed rgba(212,175,55,0.3); border-radius:20px; padding:32px; text-align:center; cursor:pointer; transition:all 0.3s; }
        .file-drop:hover { border-color:rgba(212,175,55,0.6); background:rgba(212,175,55,0.03); }
        .post-card { animation:fadeIn 0.4s ease forwards; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.3); border-radius:4px; }
      `}</style>

      <GoldenParticles />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, padding: "28px 24px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 4 }}>
                SQI 2050 · AKASHA-NEURAL ARCHIVE
              </div>
              <h1 className="gold-glow" style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
                PREMA-PULSE TRANSMITTER
              </h1>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                Sacred Healing · Viral Content Engine · All Platforms
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(34,211,238,0.7)", textTransform: "uppercase" }}>SCALAR FIELD</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#22D3EE" }}>ACTIVE</div>
              <div style={{ width: 60, height: 2, background: "linear-gradient(90deg,transparent,#22D3EE,transparent)", marginTop: 4 }} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { id: "create", label: "⚡ CREATE" },
              { id: "preview", label: "🔱 PREVIEW" },
              { id: "schedule", label: `📡 QUEUE ${scheduledPosts.length > 0 ? `(${scheduledPosts.length})` : ""}` },
            ].map((tab) => (
              <button
                key={tab.id}
                className="tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  color: activeTab === tab.id ? "#D4AF37" : "rgba(255,255,255,0.3)",
                  borderBottom: activeTab === tab.id ? "2px solid #D4AF37" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 10, padding: "24px", maxWidth: 900, margin: "0 auto" }}>

        {/* ═══════════════════ CREATE TAB ═══════════════════ */}
        {activeTab === "create" && (
          <div style={{ display: "grid", gap: 16 }}>

            {/* Platform Selection */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 14 }}>
                01 · TARGET PLATFORMS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="platform-btn"
                      onClick={() => togglePlatform(p.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: active ? `rgba(${p.id === "instagram" ? "225,48,108" : p.id === "tiktok" ? "105,201,208" : p.id === "facebook" ? "24,119,242" : "255,0,0"},0.08)` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${active ? p.color + "55" : "rgba(255,255,255,0.05)"}`,
                        padding: "12px 14px",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{p.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 12, color: active ? p.color : "rgba(255,255,255,0.5)" }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{p.handle}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: active ? p.color : "transparent",
                        border: `2px solid ${active ? p.color : "rgba(255,255,255,0.2)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#050505", fontWeight: 900,
                      }}>
                        {active ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Pillar */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 14 }}>
                02 · BHAKTI-ALGORITHM PILLAR
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CONTENT_PILLARS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPillar(p.id)}
                    style={{
                      background: selectedPillar === p.id ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedPillar === p.id ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 12, padding: "8px 14px", cursor: "pointer",
                      color: selectedPillar === p.id ? "#D4AF37" : "rgba(255,255,255,0.4)",
                      fontFamily: "inherit", fontWeight: selectedPillar === p.id ? 800 : 400, fontSize: 12,
                      transition: "all 0.2s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Hook Selection */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                  VIRAL HOOK
                </div>
                {VIRAL_HOOKS[selectedPillar]?.map((hook, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedHook(i)}
                    style={{
                      padding: "10px 14px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
                      background: selectedHook === i ? "rgba(212,175,55,0.08)" : "transparent",
                      border: `1px solid ${selectedHook === i ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.03)"}`,
                      fontSize: 12, color: selectedHook === i ? "#D4AF37" : "rgba(255,255,255,0.4)",
                      transition: "all 0.2s",
                    }}
                  >
                    {selectedHook === i && <span style={{ marginRight: 8 }}>⚡</span>}"{hook}"
                  </div>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 14 }}>
                03 · UPLOAD MEDIA
              </div>
              <div
                className="file-drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div style={{ fontWeight: 800, color: "#D4AF37", fontSize: 14 }}>Drop videos & images</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  MP4 · MOV · JPG · PNG · Reels · Stories
                </div>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="video/*,image/*" onChange={handleFileUpload} style={{ display: "none" }} />

              {uploadedFiles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} style={{
                      background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: 10, padding: "6px 12px", fontSize: 11, color: "#D4AF37",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span>{f.type === "video" ? "🎬" : "🖼️"}</span>
                      <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{f.size}</span>
                      <span
                        onClick={(e) => { e.stopPropagation(); setUploadedFiles((prev) => prev.filter((_, j) => j !== i)); }}
                        style={{ cursor: "pointer", color: "rgba(255,100,100,0.6)", marginLeft: 4 }}
                      >×</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Editing Notes */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.1)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(34,211,238,0.6)", textTransform: "uppercase", marginBottom: 8 }}>
                    SQI EDIT PROTOCOLS
                  </div>
                  {selectedPlatforms.map((pid) => {
                    const specs = PLATFORM_SPECS[pid];
                    return (
                      <div key={pid} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                        <span style={{ color: PLATFORMS.find(p => p.id === pid)?.color, fontWeight: 700 }}>
                          {PLATFORMS.find(p => p.id === pid)?.name}:
                        </span>{" "}
                        {Object.values(specs || {}).join(" · ")}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mic Input */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 14 }}>
                04 · VOICE TRANSMISSION
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <button
                  className="mic-btn"
                  onClick={micActive ? stopMic : startMic}
                  style={{
                    background: micActive
                      ? "rgba(255,80,80,0.2)"
                      : "rgba(212,175,55,0.1)",
                    border: `2px solid ${micActive ? "rgba(255,80,80,0.6)" : "rgba(212,175,55,0.4)"}`,
                    animation: micActive ? "micPulse 1s ease infinite" : "none",
                    flexShrink: 0,
                  }}
                >
                  {micActive ? "🔴" : "🎙️"}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                    {micStatus === "listening" && <span style={{ color: "#22D3EE" }}>⚡ Listening to your transmission…</span>}
                    {micStatus === "done" && <span style={{ color: "#D4AF37" }}>✓ Transmission captured</span>}
                    {micStatus === "unsupported" && <span style={{ color: "rgba(255,100,100,0.7)" }}>Mic not supported — type below</span>}
                    {micStatus === "idle" && "Tap mic and speak what your post is about"}
                  </div>
                  {micTranscript && (
                    <div style={{
                      background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: 12, padding: 12, fontSize: 13, color: "#D4AF37", fontStyle: "italic",
                    }}>
                      "{micTranscript}"
                    </div>
                  )}
                  <textarea
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    placeholder="Or type your post idea here… (optional)"
                    style={{
                      width: "100%", marginTop: 8, background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12,
                      padding: "10px 14px", color: "rgba(255,255,255,0.7)", fontFamily: "inherit",
                      fontSize: 12, resize: "none", height: 60, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 14 }}>
                05 · TRANSLATION MATRIX
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      background: selectedLanguages.includes(lang) ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedLanguages.includes(lang) ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 20, padding: "6px 16px", cursor: "pointer",
                      color: selectedLanguages.includes(lang) ? "#D4AF37" : "rgba(255,255,255,0.3)",
                      fontFamily: "inherit", fontWeight: 600, fontSize: 12, transition: "all 0.2s",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <button
                className="generate-btn"
                onClick={generatePosts}
                disabled={isGenerating || selectedPlatforms.length === 0}
              >
                {isGenerating ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
                    TRANSMITTING TO AKASHA…
                  </span>
                ) : (
                  "⚡ GENERATE VIRAL POSTS — ALL PLATFORMS"
                )}
              </button>
              {selectedPlatforms.length === 0 && (
                <div style={{ fontSize: 11, color: "rgba(255,100,100,0.6)", marginTop: 8 }}>Select at least one platform</div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ PREVIEW TAB ═══════════════════ */}
        {activeTab === "preview" && (
          <div>
            {!generatedPosts && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔱</div>
                <div style={{ color: "rgba(212,175,55,0.6)", fontWeight: 800, fontSize: 16 }}>No transmissions yet</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>Go to CREATE tab and generate your posts</div>
              </div>
            )}

            {generatedPosts && (
              <div>
                {/* Platform Switcher */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
                  {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePreview(p.id)}
                      style={{
                        background: activePreview === p.id ? `${p.color}22` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${activePreview === p.id ? p.color + "55" : "rgba(255,255,255,0.05)"}`,
                        borderRadius: 12, padding: "8px 16px", cursor: "pointer",
                        color: activePreview === p.id ? p.color : "rgba(255,255,255,0.4)",
                        fontFamily: "inherit", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap",
                        transition: "all 0.2s",
                      }}
                    >
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>

                {currentPost && (
                  <div className="post-card" key={activePreview}>
                    {/* Phone Mockup */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {/* Preview */}
                      <div style={{
                        flex: "0 0 auto", width: 220,
                        background: "#111", borderRadius: 28, overflow: "hidden",
                        border: `2px solid ${previewPlatform?.color || "#D4AF37"}33`,
                        boxShadow: `0 0 30px ${previewPlatform?.color || "#D4AF37"}22`,
                      }}>
                        <div style={{ height: 340, background: "linear-gradient(135deg,#0a0a0a,#1a1208)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16, position: "relative" }}>
                          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%,rgba(212,175,55,0.08),transparent 70%)" }} />
                          {uploadedFiles[0] ? (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}>
                              {uploadedFiles[0].type === "image" && (
                                <img src={uploadedFiles[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                              )}
                            </div>
                          ) : (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, opacity: 0.15 }}>
                              🔱
                            </div>
                          )}
                          <div style={{ position: "relative", zIndex: 2 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: "#D4AF37", lineHeight: 1.3, textShadow: "0 0 20px rgba(0,0,0,0.8)", marginBottom: 8 }}>
                              {currentPost.hook || ""}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#050505" }}>K</div>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>kritagya_das</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ background: "#0a0a0a", padding: "10px 12px" }}>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                            {(currentPost.caption || "").slice(0, 100)}…
                          </div>
                        </div>
                      </div>

                      {/* Post Details */}
                      <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 10 }}>
                        {/* Hook */}
                        <div className="glass-card gold-border" style={{ padding: 14 }}>
                          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: 6 }}>⚡ VIRAL HOOK</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#D4AF37", lineHeight: 1.4 }}>{currentPost.hook}</div>
                        </div>

                        {/* Caption */}
                        <div className="glass-card" style={{ padding: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>CAPTION</div>
                            <button className="copy-btn" onClick={() => copyToClipboard(currentPost.caption + "\n\n" + currentPost.cta + "\n\n" + currentPost.hashtags, activePreview)}>
                              {copiedPlatform === activePreview ? "✓ Copied!" : "Copy All"}
                            </button>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflowY: "auto" }}>
                            {currentPost.caption}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 11, color: "#22D3EE", fontWeight: 600 }}>{currentPost.cta}</div>
                        </div>

                        {/* Hashtags */}
                        <div className="glass-card" style={{ padding: 14 }}>
                          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>HASHTAGS</div>
                          <div style={{ fontSize: 10, color: "rgba(212,175,55,0.6)", lineHeight: 1.8 }}>{currentPost.hashtags || HASHTAG_SETS[activePreview]}</div>
                        </div>

                        {/* Viral Tip */}
                        {currentPost.viralTip && (
                          <div style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 16, padding: 14 }}>
                            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(34,211,238,0.6)", textTransform: "uppercase", marginBottom: 6 }}>🔺 VIRAL PROTOCOL</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{currentPost.viralTip}</div>
                          </div>
                        )}

                        {/* Best Time */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 12, padding: "10px 14px" }}>
                            <div style={{ fontSize: 8, color: "rgba(212,175,55,0.5)", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>BEST TIME</div>
                            <div style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700 }}>{BEST_TIMES[activePreview]}</div>
                          </div>
                          <button
                            className="schedule-btn"
                            onClick={() => { handleSchedule({ ...currentPost, platform: activePreview }); }}
                            style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700 }}
                          >
                            📡 Queue
                          </button>
                        </div>

                        {/* Editing Note */}
                        {currentPost.editingNote && (
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 12 }}>
                            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>🎬 EDIT NOTE</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{currentPost.editingNote}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* All platforms summary */}
                    {generatedPosts.length > 1 && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>ALL PLATFORM QUEUE</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                          {generatedPosts.map((post, i) => {
                            const plat = PLATFORMS.find(p => p.name?.toLowerCase() === post.platform?.toLowerCase() || p.id === post.platform?.toLowerCase());
                            return (
                              <div
                                key={i}
                                className="glass-card"
                                style={{ padding: 12, cursor: "pointer", border: `1px solid ${plat?.color || "#D4AF37"}22` }}
                                onClick={() => { setActivePreview(plat?.id || activePreview); }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: plat?.color || "#D4AF37" }}>{plat?.icon} {post.platform}</span>
                                  <button
                                    className="schedule-btn"
                                    onClick={(e) => { e.stopPropagation(); handleSchedule({ ...post, platform: plat?.id || post.platform }); }}
                                    style={{ fontSize: 10, padding: "4px 10px" }}
                                  >
                                    + Queue
                                  </button>
                                </div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{(post.hook || "").slice(0, 70)}…</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ SCHEDULE TAB ═══════════════════ */}
        {activeTab === "schedule" && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 16 }}>
              TRANSMISSION QUEUE — {scheduledPosts.length} POSTS
            </div>

            {scheduledPosts.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📡</div>
                <div style={{ color: "rgba(212,175,55,0.6)", fontWeight: 800 }}>Queue is empty</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>Generate posts and add them to the queue</div>
              </div>
            )}

            {scheduledPosts.map((post, i) => {
              const plat = post.platformData || PLATFORMS.find(p => p.id === post.platform);
              return (
                <div key={post.id} className="glass-card post-card" style={{ padding: 16, marginBottom: 10, border: `1px solid ${plat?.color || "#D4AF37"}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 20 }}>{plat?.icon}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: plat?.color || "#D4AF37", fontSize: 13 }}>{plat?.name || post.platform}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Best: {post.scheduledFor}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "#22D3EE", fontWeight: 700 }}>
                        READY
                      </div>
                      <button
                        onClick={() => setScheduledPosts(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "rgba(255,100,100,0.5)", cursor: "pointer", fontSize: 16 }}
                      >×</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#D4AF37", fontStyle: "italic", marginBottom: 6 }}>"{post.hook}"</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{(post.caption || "").slice(0, 120)}…</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button className="copy-btn" onClick={() => copyToClipboard((post.caption || "") + "\n\n" + (post.cta || "") + "\n\n" + (post.hashtags || ""), post.id)}>
                      {copiedPlatform === post.id ? "✓ Copied!" : "📋 Copy Post"}
                    </button>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 12px", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                      💡 {post.viralTip?.slice(0, 60) || "Post during peak hours for maximum reach"}…
                    </div>
                  </div>
                </div>
              );
            })}

            {scheduledPosts.length > 0 && (
              <div style={{ marginTop: 20, padding: 16, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 20, textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(212,175,55,0.6)", textTransform: "uppercase", marginBottom: 8 }}>AUTOMATION TOOLS</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.6 }}>
                  Connect Buffer, Later, or Repurpose.io to auto-publish all queued posts at optimal times
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {["Buffer.com", "Later.com", "Repurpose.io", "Metricool"].map(tool => (
                    <div key={tool} style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: "6px 16px", fontSize: 11, color: "#D4AF37", fontWeight: 700 }}>
                      → {tool}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "16px 24px 32px" }}>
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", color: "rgba(212,175,55,0.2)", textTransform: "uppercase" }}>
          SQI 2050 · SACRED HEALING · PREMA-PULSE ACTIVE · sacredhealing.lovable.app
        </div>
      </div>
    </div>
  );
}
