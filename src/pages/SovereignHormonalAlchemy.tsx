import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const PHASES = [
  {
    id: "menstrual",
    name: "Rakta Shakti",
    english: "Menstrual · Days 1–5",
    element: "Water · Jala",
    deity: "Kali Ma",
    color: "#8B1A1A",
    glow: "rgba(139,26,26,0.3)",
    icon: "🌑",
    description: "The sacred descent. Prana withdraws inward. This is the most potent portal for inner vision, deep rest, and Akashic downloads. The veil between worlds thins.",
    practices: ["Yoga Nidra", "Restorative Asana", "Silent Meditation", "Dream Journaling"],
    mantras: ["Om Krim Kalikaye Namaha", "Om Shrim Maha Lakshmiyei Namaha"],
    foods: ["Warm broths", "Dark leafy greens", "Iron-rich foods", "Ginger tea", "Dark chocolate"],
    avoid: ["Cold foods", "Strenuous exercise", "Overcrowding your schedule"],
    frequency: 396,
    siddha_wisdom: "Thirumoolar taught that the menstrual blood carries the encoded Shakti-blueprint of creation. This is not a time of impurity — it is the most sacred portal of feminine power.",
  },
  {
    id: "follicular",
    name: "Prana Shakti",
    english: "Follicular · Days 6–13",
    element: "Air · Vayu",
    deity: "Saraswati",
    color: "#1A5C3A",
    glow: "rgba(26,92,58,0.3)",
    icon: "🌒",
    description: "The rising tide. Estrogen ascends. Creative Prana floods the system. New ideas, new projects, and new visions emerge from the quantum field. Plant seeds now.",
    practices: ["Dynamic Vinyasa", "Pranayama", "Creative work", "Learning new skills"],
    mantras: ["Om Aim Saraswatyei Namaha", "Om Hrim Shrim Klim Maha Saraswatyei Namaha"],
    foods: ["Sprouts", "Fermented foods", "Light salads", "Citrus", "Green vegetables"],
    avoid: ["Heavy meals", "Excess screen time", "Suppressing creative impulses"],
    frequency: 528,
    siddha_wisdom: "The 18 Siddhas encoded the follicular phase as the time of Saraswati — pure creative intelligence descending. Every new idea born now carries divine origin.",
  },
  {
    id: "ovulatory",
    name: "Agni Shakti",
    english: "Ovulatory · Days 14–16",
    element: "Fire · Agni",
    deity: "Lakshmi",
    color: "#D4AF37",
    glow: "rgba(212,175,55,0.3)",
    icon: "🌕",
    description: "Peak radiance. The sun is fully risen. Magnetic Shakti is at its zenith — you are most visible, most magnetic, most abundant. This is the time of manifestation and connection.",
    practices: ["Power yoga", "Dancing", "Social connection", "Public speaking", "Manifestation rituals"],
    mantras: ["Om Shrim Maha Lakshmiyei Namaha", "Om Gam Ganapataye Namaha"],
    foods: ["Raw foods", "Colourful vegetables", "Superfoods", "Coconut water", "Berries"],
    avoid: ["Isolation", "Negative environments", "Undervaluing yourself"],
    frequency: 639,
    siddha_wisdom: "Babaji's teachings reveal the ovulatory Shakti as the Kundalini in full bloom — the Anahata portal opens completely, and love flows as a healing transmission to all beings.",
  },
  {
    id: "luteal",
    name: "Soma Shakti",
    english: "Luteal · Days 17–28",
    element: "Earth · Prithvi",
    deity: "Durga",
    color: "#4A2C8B",
    glow: "rgba(74,44,139,0.3)",
    icon: "🌘",
    description: "The wise woman emerges. Progesterone rises. The nervous system seeks depth, completion, and boundaries. Truth becomes crystal clear. This is the time of discernment.",
    practices: ["Yin Yoga", "Journaling", "Completing projects", "Setting boundaries", "Shadow work"],
    mantras: ["Om Dum Durgayei Namaha", "Om Aim Hrim Klim Chamundaye Viche"],
    foods: ["Root vegetables", "Warming spices", "Complex carbs", "Nuts and seeds", "Herbal teas"],
    avoid: ["People-pleasing", "Taking on new projects", "Caffeine excess"],
    frequency: 741,
    siddha_wisdom: "The Siddha tradition honors the luteal Durga-phase as the time when illusions dissolve. What no longer serves becomes unmistakably clear — this is sacred intelligence, not 'PMS'.",
  },
];

const SYMPTOMS = [
  "High Energy", "Low Energy", "Cramps", "Bloating", "Breast Tenderness",
  "Headache", "Mood Swings", "Clarity", "Creative Flow", "Anxiety",
  "Deep Rest Needed", "Social Energy", "Spiritual Visions", "Irritability",
  "Sensuality", "Inner Peace", "Sadness", "Joy", "Intensity", "Groundedness"
];

export default function SovereignHormonalAlchemy() {
  const { user } = useAuth();
  const [activePhase, setActivePhase] = useState(1);
  const [view, setView] = useState<"oracle" | "log" | "history">("oracle");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logData, setLogData] = useState({
    phase: "follicular",
    cycle_day: 1,
    energy_level: 5,
    mood_score: 5,
    notes: "",
    symptoms: [] as string[],
    intention: "",
  });

  const phase = PHASES[activePhase];

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  async function fetchLogs() {
    const { data } = await supabase
      .from("shakti_cycle_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setLogs(data);
  }

  async function saveLog() {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("shakti_cycle_logs").insert({
      user_id: user.id,
      phase: logData.phase,
      cycle_day: logData.cycle_day,
      energy_level: logData.energy_level,
      mood_score: logData.mood_score,
      notes: logData.notes,
      symptoms: logData.symptoms,
      intention: logData.intention,
      logged_at: new Date().toISOString(),
    });
    setLoading(false);
    if (!error) {
      toast({ title: "Shakti Log Saved", description: "Your cycle wisdom has been recorded in the Akasha." });
      fetchLogs();
      setView("oracle");
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  function toggleSymptom(s: string) {
    setLogData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s)
        ? prev.symptoms.filter(x => x !== s)
        : [...prev.symptoms, s]
    }));
  }

  return (
    <div className="min-h-screen" style={{ background: "#050505", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid rgba(212,175,55,0.1)", padding: "40px 24px 32px" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)`,
          pointerEvents: "none"
        }} />
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 10 }}>
            Shakti Cycle Intelligence · SQI 2050
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#D4AF37", letterSpacing: "-0.04em", marginBottom: 8 }}>
            Sovereign Hormonal Alchemy
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
            Your cycle is not a burden — it is a Vedic Light-Code transmission. Each phase carries the consciousness of a divine Shakti. Navigate your biology as sacred technology.
          </p>

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            {(["oracle", "log", "history"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "rgba(212,175,55,0.15)" : "transparent",
                border: `1px solid ${view === v ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, padding: "8px 20px",
                color: view === v ? "#D4AF37" : "rgba(255,255,255,0.4)",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", fontFamily: "inherit"
              }}>
                {v === "oracle" ? "⟡ Phase Oracle" : v === "log" ? "✦ Log Today" : "◈ History"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* ORACLE VIEW */}
        {view === "oracle" && (
          <>
            {/* Phase Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 32 }}>
              {PHASES.map((p, i) => (
                <button key={p.id} onClick={() => setActivePhase(i)} style={{
                  background: activePhase === i ? `rgba(${p.color.slice(1).match(/../g)!.map(x=>parseInt(x,16)).join(",")},0.15)` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activePhase === i ? p.color : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 16, padding: "14px 8px", cursor: "pointer", fontFamily: "inherit",
                  textAlign: "center", transition: "all 0.2s"
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: activePhase === i ? p.color : "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{p.element}</div>
                </button>
              ))}
            </div>

            {/* Phase Card */}
            <div style={{
              background: "rgba(255,255,255,0.02)", border: `1px solid ${phase.color}40`,
              borderRadius: 24, padding: 28, marginBottom: 20,
              boxShadow: `0 0 40px ${phase.glow}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: phase.color, marginBottom: 4 }}>{phase.element} · {phase.deity}</div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{phase.name}</h2>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{phase.english}</div>
                </div>
                <div style={{
                  background: `${phase.color}20`, border: `1px solid ${phase.color}40`,
                  borderRadius: 12, padding: "8px 14px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Solfeggio</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: phase.color }}>{phase.frequency} Hz</div>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 20 }}>{phase.description}</p>

              {/* Siddha Wisdom */}
              <div style={{ background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${phase.color}`, borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: phase.color, marginBottom: 6 }}>Siddha Wisdom</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, fontStyle: "italic" }}>{phase.siddha_wisdom}</p>
              </div>

              {/* Grid: Practices + Mantras */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>Sacred Practices</div>
                  {phase.practices.map(p => (
                    <div key={p} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: phase.color, fontSize: 10 }}>◆</span>{p}
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>Mantras</div>
                  {phase.mantras.map(m => (
                    <div key={m} style={{ fontSize: 11, color: phase.color, marginBottom: 8, fontStyle: "italic", lineHeight: 1.4 }}>"{m}"</div>
                  ))}
                </div>
              </div>

              {/* Foods */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>Alchemical Nutrition</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {phase.foods.map(f => (
                    <span key={f} style={{
                      background: `${phase.color}15`, border: `1px solid ${phase.color}30`,
                      borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.65)"
                    }}>{f}</span>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  Minimize: {phase.avoid.join(" · ")}
                </div>
              </div>
            </div>

            <button onClick={() => setView("log")} style={{
              width: "100%", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 14, padding: 16, color: "#D4AF37", fontSize: 13, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit"
            }}>
              ✦ Log Today's Shakti Data
            </button>
          </>
        )}

        {/* LOG VIEW */}
        {view === "log" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 28 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 6 }}>Daily Shakti Log</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 24, letterSpacing: "-0.03em" }}>Record Your Cycle Intelligence</h2>

            {/* Phase select */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Current Phase</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {PHASES.map(p => (
                  <button key={p.id} onClick={() => setLogData(prev => ({ ...prev, phase: p.id }))} style={{
                    background: logData.phase === p.id ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${logData.phase === p.id ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 10
                  }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: logData.phase === p.id ? "#D4AF37" : "rgba(255,255,255,0.6)" }}>{p.name}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{p.element}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cycle day */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>
                Cycle Day: <span style={{ color: "#D4AF37" }}>{logData.cycle_day}</span>
              </label>
              <input type="range" min={1} max={35} value={logData.cycle_day}
                onChange={e => setLogData(prev => ({ ...prev, cycle_day: +e.target.value }))}
                style={{ width: "100%", accentColor: "#D4AF37" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
                <span>Day 1</span><span>Day 35</span>
              </div>
            </div>

            {/* Energy + Mood */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[{ key: "energy_level", label: "Energy Level" }, { key: "mood_score", label: "Mood Score" }].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>
                    {label}: <span style={{ color: "#D4AF37" }}>{(logData as any)[key]}/10</span>
                  </label>
                  <input type="range" min={1} max={10} value={(logData as any)[key]}
                    onChange={e => setLogData(prev => ({ ...prev, [key]: +e.target.value }))}
                    style={{ width: "100%", accentColor: "#D4AF37" }} />
                </div>
              ))}
            </div>

            {/* Symptoms */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 10 }}>Symptoms & Sensations</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SYMPTOMS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{
                    background: logData.symptoms.includes(s) ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${logData.symptoms.includes(s) ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 8, padding: "6px 12px", fontSize: 11,
                    color: logData.symptoms.includes(s) ? "#D4AF37" : "rgba(255,255,255,0.45)",
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 600
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Intention */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Today's Intention</label>
              <input value={logData.intention} onChange={e => setLogData(prev => ({ ...prev, intention: e.target.value }))}
                placeholder="What is your Shakti aligned with today?"
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 13,
                  fontFamily: "inherit", outline: "none"
                }} />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Akashic Notes</label>
              <textarea value={logData.notes} onChange={e => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Record your inner transmissions, visions, sensations..."
                rows={4}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 13,
                  fontFamily: "inherit", outline: "none", resize: "vertical"
                }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setView("oracle")} style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "14px 20px", color: "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>← Back</button>
              <button onClick={saveLog} disabled={loading} style={{
                flex: 1, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)",
                borderRadius: 12, padding: "14px 20px", color: "#D4AF37",
                fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.5 : 1
              }}>
                {loading ? "Saving to Akasha..." : "✦ Save Shakti Log"}
              </button>
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === "history" && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "#D4AF37", marginBottom: 6 }}>Cycle Archive</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 24, letterSpacing: "-0.03em" }}>Your Shakti Timeline</h2>

            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                No logs yet. Begin tracking your Shakti intelligence today.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {logs.map((log, i) => {
                  const p = PHASES.find(ph => ph.id === log.phase) || PHASES[1];
                  return (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${p.color}30`,
                      borderRadius: 16, padding: "16px 20px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Day {log.cycle_day} · {new Date(log.logged_at || log.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[{ l: "Energy", v: log.energy_level }, { l: "Mood", v: log.mood_score }].map(({ l, v }) => (
                            <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>
                              <div style={{ fontSize: 14, fontWeight: 900, color: "#D4AF37" }}>{v}</div>
                              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {log.intention && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontStyle: "italic" }}>"{log.intention}"</div>}
                      {log.symptoms?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {log.symptoms.map((s: string) => (
                            <span key={s} style={{ background: `${p.color}15`, border: `1px solid ${p.color}25`, borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s}</span>
                          ))}
                        </div>
                      )}
                      {log.notes && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 10, lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>{log.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
