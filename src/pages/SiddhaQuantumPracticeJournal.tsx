import { useState, useEffect } from "react";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface JournalEntry {
  date: string;        // ISO date string
  practiceId: string;
  duration: number;    // minutes
  intensity: 1 | 2 | 3 | 4 | 5;
  notes: string;
  transmission: boolean; // did they feel the scalar transmission?
  state: "grounded" | "expansive" | "blissful" | "challenging" | "neutral";
}

interface PracticeLog {
  [practiceId: string]: JournalEntry[];
}

const PRACTICES = [
  // FREE
  { id: "m1-l1", module: 1, tier: "FREE",    title: "The Observer Within",                siddha: "Agastya", duration: 12 },
  { id: "m1-l2", module: 1, tier: "FREE",    title: "Breath as Cosmic Bridge",             siddha: "Agastya", duration: 15 },
  { id: "m1-l3", module: 1, tier: "FREE",    title: "Body as Sacred Temple",               siddha: "Agastya", duration: 18 },
  { id: "m2-l1", module: 2, tier: "FREE",    title: "AUM — The Source Code",               siddha: "Thirumoolar", duration: 20 },
  { id: "m2-l2", module: 2, tier: "FREE",    title: "Inner Listening — Anahata Nada",      siddha: "Thirumoolar", duration: 25 },
  { id: "m3-l1", module: 3, tier: "FREE",    title: "The Five Vayus",                      siddha: "Nandhi", duration: 22 },
  { id: "m3-l2", module: 3, tier: "FREE",    title: "Nadi Shodhana — The Great Purification", siddha: "Nandhi", duration: 30 },
  // PRANA-FLOW
  { id: "m4-l1", module: 4, tier: "PRANA-FLOW", title: "Surya Bhedana — Solar Activation", siddha: "Thirumoolar", duration: 18 },
  { id: "m4-l2", module: 4, tier: "PRANA-FLOW", title: "Chandra Bhedana — Lunar Immersion", siddha: "Thirumoolar", duration: 18 },
  { id: "m4-l3", module: 4, tier: "PRANA-FLOW", title: "Bhramari — The Divine Bee",        siddha: "Thirumoolar", duration: 20 },
  { id: "m4-l4", module: 4, tier: "PRANA-FLOW", title: "Sheetali — The Serpent's Cool Tongue", siddha: "Thirumoolar", duration: 15 },
  { id: "m4-l5", module: 4, tier: "PRANA-FLOW", title: "Kapalabhati — Skull-Shining Fire", siddha: "Thirumoolar", duration: 25 },
  { id: "m4-l6", module: 4, tier: "PRANA-FLOW", title: "Viloma — Against the Grain",       siddha: "Thirumoolar", duration: 20 },
  { id: "m4-l7", module: 4, tier: "PRANA-FLOW", title: "Ujjayi — The Victorious Ocean Breath", siddha: "Thirumoolar", duration: 22 },
  { id: "m4-l8", module: 4, tier: "PRANA-FLOW", title: "Kumbhaka — Supreme Stillness",     siddha: "Thirumoolar", duration: 35 },
  { id: "m5-l1", module: 5, tier: "PRANA-FLOW", title: "Awakening Muladhara",              siddha: "Gorakkar", duration: 20 },
  { id: "m5-l2", module: 5, tier: "PRANA-FLOW", title: "Complete Kundalini Rising Sequence", siddha: "Gorakkar", duration: 45 },
  { id: "m5-l3", module: 5, tier: "PRANA-FLOW", title: "Integration & Sacred Grounding",   siddha: "Gorakkar", duration: 20 },
  { id: "m6-l1", module: 6, tier: "PRANA-FLOW", title: "Sri Yantra Dharana",               siddha: "Machamuni", duration: 30 },
  { id: "m6-l2", module: 6, tier: "PRANA-FLOW", title: "Shiva Lingam Meditation",          siddha: "Machamuni", duration: 25 },
  // SIDDHA-QUANTUM
  { id: "m7-l1", module: 7, tier: "SIDDHA-QUANTUM", title: "Ojas Cultivation",             siddha: "Bhogar", duration: 30 },
  { id: "m7-l2", module: 7, tier: "SIDDHA-QUANTUM", title: "Amrita Bindu — Nectar Drop Meditation", siddha: "Bhogar", duration: 40 },
  { id: "m7-l3", module: 7, tier: "SIDDHA-QUANTUM", title: "The Five Sheaths — Dissolving to the Atman", siddha: "Bhogar", duration: 35 },
  { id: "m8-l1", module: 8, tier: "SIDDHA-QUANTUM", title: "Accessing Your Soul Record",   siddha: "Bhrigu", duration: 45 },
  { id: "m8-l2", module: 8, tier: "SIDDHA-QUANTUM", title: "Karma Dissolution Protocol",   siddha: "Bhrigu", duration: 50 },
  { id: "m9-l1", module: 9, tier: "SIDDHA-QUANTUM", title: "The Panchakshara",             siddha: "Siva Vakkiyar", duration: 30 },
  { id: "m9-l2", module: 9, tier: "SIDDHA-QUANTUM", title: "Ajapa Japa — The Unchanted Chant", siddha: "Siva Vakkiyar", duration: 60 },
  { id: "m9-l3", module: 9, tier: "SIDDHA-QUANTUM", title: "Nada Brahma — The Universe IS Sound", siddha: "Siva Vakkiyar", duration: 40 },
  { id: "m10-l1", module: 10, tier: "SIDDHA-QUANTUM", title: "Ghee Lamp Trataka",          siddha: "Konganar", duration: 20 },
  { id: "m10-l2", module: 10, tier: "SIDDHA-QUANTUM", title: "Inner Flame — The Spontaneous Jyoti", siddha: "Konganar", duration: 30 },
  { id: "m10-l3", module: 10, tier: "SIDDHA-QUANTUM", title: "Shambhavi Mahamudra",        siddha: "Konganar", duration: 35 },
  // AKASHA-INFINITY
  { id: "m11-l1", module: 11, tier: "AKASHA-INFINITY", title: "Kriya Pranayama — The Core Initiation", siddha: "Babaji", duration: 60 },
  { id: "m11-l2", module: 11, tier: "AKASHA-INFINITY", title: "Samadhi States Technology", siddha: "Babaji", duration: 90 },
  { id: "m11-l3", module: 11, tier: "AKASHA-INFINITY", title: "Deathless Awareness — The Recognition", siddha: "Babaji", duration: 120 },
  { id: "m12-l1", module: 12, tier: "AKASHA-INFINITY", title: "Opening the Akashic Gateway", siddha: "Agastya + Bhrigu", duration: 45 },
  { id: "m12-l2", module: 12, tier: "AKASHA-INFINITY", title: "Timeline Navigation",        siddha: "Agastya + Bhrigu", duration: 60 },
  { id: "m12-l3", module: 12, tier: "AKASHA-INFINITY", title: "Soul Contract Review",       siddha: "Agastya + Bhrigu", duration: 75 },
  { id: "m13-l1", module: 13, tier: "AKASHA-INFINITY", title: "Awakening the Dormant Genome", siddha: "Bhogar + Kalangi", duration: 35 },
  { id: "m13-l2", module: 13, tier: "AKASHA-INFINITY", title: "Scalar Wave DNA Reprogramming", siddha: "Bhogar + Kalangi", duration: 50 },
  { id: "m14-l1", module: 14, tier: "AKASHA-INFINITY", title: "Non-Dual Awareness — The Final Turning", siddha: "All 18 + Babaji", duration: 60 },
  { id: "m14-l2", module: 14, tier: "AKASHA-INFINITY", title: "Prema-Pulse Heart Transmission", siddha: "All 18 + Babaji", duration: 45 },
  { id: "m14-l3", module: 14, tier: "AKASHA-INFINITY", title: "Samadhi — The Living Recognition", siddha: "All 18 + Babaji", duration: 90 },
];

const TIER_COLOR: Record<string, string> = {
  "FREE": "#8B7355",
  "PRANA-FLOW": "#D4AF37",
  "SIDDHA-QUANTUM": "#22D3EE",
  "AKASHA-INFINITY": "#D4AF37",
};

const STATE_EMOJI: Record<string, string> = {
  grounded: "🌍", expansive: "🌌", blissful: "✨", challenging: "🔥", neutral: "🌿",
};

// ── STORAGE HELPERS ───────────────────────────────────────────────────────────
const STORAGE_KEY = "sqi_practice_journal_v1";

function loadLog(): PracticeLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLog(log: PracticeLog) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch {}
}

function getTodayISO() { return new Date().toISOString().split("T")[0]; }

function getStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0,0,0,0);
  for (const d of dates) {
    const dDate = new Date(d);
    const diff = Math.round((cursor.getTime() - dDate.getTime()) / 86400000);
    if (diff <= 1) { streak++; cursor = dDate; }
    else break;
  }
  return streak;
}

function totalMinutes(log: PracticeLog): number {
  return Object.values(log).flat().reduce((s, e) => s + e.duration, 0);
}

function totalSessions(log: PracticeLog): number {
  return Object.values(log).flat().length;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function SiddhaQuantumPracticeJournal() {
  const [log, setLog] = useState<PracticeLog>(loadLog);
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);
  const [view, setView] = useState<"log" | "stats" | "history">("log");
  // Form state
  const [form, setForm] = useState({
    duration: 0,
    intensity: 3 as 1|2|3|4|5,
    notes: "",
    transmission: false,
    state: "neutral" as JournalEntry["state"],
  });
  const [saved, setSaved] = useState(false);

  const practice = PRACTICES.find(p => p.id === selectedPractice);
  const allEntries = Object.values(log).flat().sort((a,b) => b.date.localeCompare(a.date));

  function handleLog() {
    if (!selectedPractice || !practice) return;
    const entry: JournalEntry = {
      date: getTodayISO(),
      practiceId: selectedPractice,
      duration: form.duration || practice.duration,
      intensity: form.intensity,
      notes: form.notes,
      transmission: form.transmission,
      state: form.state,
    };
    const updated = { ...log, [selectedPractice]: [...(log[selectedPractice] || []), entry] };
    setLog(updated);
    saveLog(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ duration: 0, intensity: 3, notes: "", transmission: false, state: "neutral" });
  }

  const totalHrs = Math.floor(totalMinutes(log) / 60);
  const totalMins = totalMinutes(log) % 60;
  const practicesCompleted = Object.keys(log).length;
  const globalStreak = getStreak(allEntries);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      color: "#fff",
      fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
      padding: "0 0 80px",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "48px 24px 32px",
        textAlign: "center",
        background: "radial-gradient(ellipse 80% 300px at 50% 0%, rgba(212,175,55,0.08), transparent 70%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
          color: "#D4AF37", textTransform: "uppercase", marginBottom: "12px" }}>
          SIDDHA QUANTUM INTELLIGENCE  ·  PRACTICE JOURNAL  ·  2050
        </div>
        <h1 style={{ fontSize: "clamp(24px,5vw,48px)", fontWeight: 900,
          letterSpacing: "-0.03em", margin: "0 0 8px",
          textShadow: "0 0 40px rgba(212,175,55,0.2)" }}>
          Sadhana <span style={{ color: "#D4AF37" }}>Archive</span>
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Track your journey through all 51 Siddha practices
        </p>

        {/* STATS ROW */}
        <div style={{ display: "flex", justifyContent: "center", gap: "28px",
          flexWrap: "wrap", marginTop: "28px" }}>
          {[
            { n: `${totalHrs}h ${totalMins}m`, label: "TOTAL PRACTICE" },
            { n: String(totalSessions(log)), label: "SESSIONS" },
            { n: String(practicesCompleted), label: "PRACTICES TOUCHED" },
            { n: `${globalStreak}`, label: "DAY STREAK" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#D4AF37",
                textShadow: "0 0 20px rgba(212,175,55,0.4)" }}>{s.n}</div>
              <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
          {(["log", "stats", "history"] as const).map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              padding: "8px 22px", borderRadius: "100px", cursor: "pointer",
              border: `1px solid ${view === t ? "#D4AF37" : "rgba(255,255,255,0.1)"}`,
              background: view === t ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
              color: view === t ? "#D4AF37" : "rgba(255,255,255,0.4)",
              fontSize: "9px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase",
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 0" }}>

        {/* ── LOG VIEW ──────────────────────────────────────────────────── */}
        {view === "log" && (
          <div>
            <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "16px" }}>
              SELECT PRACTICE TO LOG
            </div>

            {["FREE", "PRANA-FLOW", "SIDDHA-QUANTUM", "AKASHA-INFINITY"].map(tier => (
              <div key={tier} style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
                  color: TIER_COLOR[tier], textTransform: "uppercase", marginBottom: "12px" }}>
                  {tier}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "8px" }}>
                  {PRACTICES.filter(p => p.tier === tier).map(p => {
                    const entries = log[p.id] || [];
                    const lastDone = entries.length ? entries[entries.length - 1].date : null;
                    const isToday = lastDone === getTodayISO();
                    const isSelected = selectedPractice === p.id;
                    return (
                      <div key={p.id} onClick={() => setSelectedPractice(isSelected ? null : p.id)}
                        style={{
                          padding: "14px 16px", borderRadius: "16px", cursor: "pointer",
                          border: `1px solid ${isSelected ? TIER_COLOR[tier] : isToday ? TIER_COLOR[tier] + "40" : "rgba(255,255,255,0.06)"}`,
                          background: isSelected ? `${TIER_COLOR[tier]}12` : isToday ? `${TIER_COLOR[tier]}06` : "rgba(255,255,255,0.02)",
                          transition: "all 0.2s ease",
                        }}>
                        <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                          color: TIER_COLOR[tier], textTransform: "uppercase", marginBottom: "4px" }}>
                          M{p.module} · {p.duration} MIN
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 700,
                          color: isSelected ? "#fff" : "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                          {p.siddha}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                          {entries.length > 0 && (
                            <div style={{ fontSize: "9px", color: TIER_COLOR[tier],
                              fontWeight: 700 }}>
                              ×{entries.length} {isToday ? "✓ TODAY" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* LOGGING FORM */}
            {selectedPractice && practice && (
              <div style={{
                marginTop: "8px", padding: "28px 28px 24px",
                borderRadius: "32px",
                background: `${TIER_COLOR[practice.tier]}08`,
                border: `1px solid ${TIER_COLOR[practice.tier]}40`,
              }}>
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
                  color: TIER_COLOR[practice.tier], textTransform: "uppercase", marginBottom: "6px" }}>
                  LOG SESSION
                </div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", marginBottom: "20px" }}>
                  {practice.title}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px", marginBottom: "16px" }}>
                  {/* Duration */}
                  <div>
                    <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                      color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "8px" }}>
                      DURATION (MIN)
                    </div>
                    <input type="number" min={1} max={240}
                      value={form.duration || practice.duration}
                      onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "12px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: "16px", fontWeight: 700,
                        outline: "none", boxSizing: "border-box",
                      }} />
                  </div>

                  {/* Intensity */}
                  <div>
                    <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                      color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "8px" }}>
                      DEPTH (1-5)
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {([1,2,3,4,5] as const).map(n => (
                        <button key={n} onClick={() => setForm(f => ({ ...f, intensity: n }))}
                          style={{
                            flex: 1, padding: "10px 0", borderRadius: "10px", cursor: "pointer",
                            border: `1px solid ${form.intensity === n ? TIER_COLOR[practice.tier] : "rgba(255,255,255,0.1)"}`,
                            background: form.intensity === n ? `${TIER_COLOR[practice.tier]}20` : "rgba(255,255,255,0.03)",
                            color: form.intensity === n ? TIER_COLOR[practice.tier] : "rgba(255,255,255,0.5)",
                            fontSize: "13px", fontWeight: 900,
                          }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  {/* State */}
                  <div>
                    <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em",
                      color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "8px" }}>
                      STATE AFTER
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(["grounded","expansive","blissful","challenging","neutral"] as const).map(s => (
                        <button key={s} onClick={() => setForm(f => ({ ...f, state: s }))}
                          style={{
                            padding: "6px 10px", borderRadius: "8px", cursor: "pointer",
                            border: `1px solid ${form.state === s ? TIER_COLOR[practice.tier] : "rgba(255,255,255,0.08)"}`,
                            background: form.state === s ? `${TIER_COLOR[practice.tier]}15` : "rgba(255,255,255,0.02)",
                            color: form.state === s ? TIER_COLOR[practice.tier] : "rgba(255,255,255,0.4)",
                            fontSize: "10px", fontWeight: 700,
                          }}>{STATE_EMOJI[s]} {s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transmission toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div onClick={() => setForm(f => ({ ...f, transmission: !f.transmission }))}
                    style={{
                      width: "48px", height: "26px", borderRadius: "13px", cursor: "pointer",
                      background: form.transmission ? TIER_COLOR[practice.tier] : "rgba(255,255,255,0.08)",
                      position: "relative", transition: "all 0.2s ease",
                    }}>
                    <div style={{
                      position: "absolute", top: "3px",
                      left: form.transmission ? "25px" : "3px",
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: "#fff", transition: "all 0.2s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                    Felt the scalar transmission / Siddha presence
                  </span>
                </div>

                {/* Notes */}
                <textarea
                  placeholder="Journal notes — visions, sensations, insights, questions..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{
                    width: "100%", minHeight: "100px", padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: 1.6,
                    outline: "none", resize: "vertical", boxSizing: "border-box",
                    fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
                    marginBottom: "16px",
                  }} />

                <button onClick={handleLog} style={{
                  width: "100%", padding: "16px",
                  borderRadius: "16px", cursor: "pointer",
                  border: `1px solid ${TIER_COLOR[practice.tier]}`,
                  background: `${TIER_COLOR[practice.tier]}20`,
                  color: TIER_COLOR[practice.tier],
                  fontSize: "11px", fontWeight: 800,
                  letterSpacing: "0.3em", textTransform: "uppercase",
                  transition: "all 0.2s ease",
                }}>
                  {saved ? "✓ SESSION LOGGED — OM NAMAH SHIVAYA" : "LOG THIS SESSION →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STATS VIEW ──────────────────────────────────────────────────── */}
        {view === "stats" && (
          <div>
            <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "20px" }}>
              PRACTICE MAP — {practicesCompleted} OF 51 PRACTICES TOUCHED
            </div>

            {/* PROGRESS BAR */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  Overall Progress
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#D4AF37" }}>
                  {Math.round((practicesCompleted / 51) * 100)}%
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px",
                background: "rgba(255,255,255,0.06)" }}>
                <div style={{
                  height: "100%", borderRadius: "3px",
                  width: `${(practicesCompleted / 51) * 100}%`,
                  background: "linear-gradient(90deg, #D4AF37, #22D3EE)",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            {/* PER-TIER STATS */}
            {["FREE","PRANA-FLOW","SIDDHA-QUANTUM","AKASHA-INFINITY"].map(tier => {
              const tierPractices = PRACTICES.filter(p => p.tier === tier);
              const done = tierPractices.filter(p => log[p.id]?.length).length;
              const sessions = tierPractices.reduce((s,p) => s + (log[p.id]?.length || 0), 0);
              const minutes = tierPractices.reduce((s,p) =>
                s + (log[p.id] || []).reduce((ss,e) => ss+e.duration, 0), 0);
              const pct = Math.round((done / tierPractices.length) * 100);
              return (
                <div key={tier} style={{
                  padding: "20px 24px", borderRadius: "24px",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${TIER_COLOR[tier]}30`,
                  marginBottom: "12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.4em",
                        color: TIER_COLOR[tier], textTransform: "uppercase" }}>{tier}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                        {done}/{tierPractices.length} practices · {sessions} sessions · {Math.floor(minutes/60)}h {minutes%60}m
                      </div>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: TIER_COLOR[tier] }}>
                      {pct}%
                    </div>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px",
                    background: "rgba(255,255,255,0.05)" }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      width: `${pct}%`,
                      background: TIER_COLOR[tier],
                      boxShadow: `0 0 8px ${TIER_COLOR[tier]}60`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}

            {/* MOST PRACTICED */}
            {Object.keys(log).length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
                  color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "16px" }}>
                  MOST PRACTICED
                </div>
                {Object.entries(log)
                  .sort((a,b) => b[1].length - a[1].length)
                  .slice(0, 5)
                  .map(([id, entries]) => {
                    const p = PRACTICES.find(pr => pr.id === id);
                    if (!p) return null;
                    const streak = getStreak(entries);
                    return (
                      <div key={id} style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        padding: "14px 20px", borderRadius: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        marginBottom: "8px",
                      }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          background: `${TIER_COLOR[p.tier]}15`,
                          border: `1px solid ${TIER_COLOR[p.tier]}50`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "14px", fontWeight: 900, color: TIER_COLOR[p.tier],
                          flexShrink: 0,
                        }}>{entries.length}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                            {p.siddha} · {streak > 1 ? `${streak} day streak` : ""}
                          </div>
                        </div>
                        <div style={{ fontSize: "9px", fontWeight: 800, color: TIER_COLOR[p.tier] }}>
                          {entries.reduce((s,e) => s+e.duration, 0)} MIN
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY VIEW ─────────────────────────────────────────────── */}
        {view === "history" && (
          <div>
            <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.4em",
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "20px" }}>
              SESSION HISTORY — {allEntries.length} TOTAL SESSIONS
            </div>

            {allEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>🕉</div>
                <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>
                  Your practice archive is empty.
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", marginTop: "8px" }}>
                  Begin your first session and the Siddhas will begin to record.
                </div>
              </div>
            ) : (
              allEntries.slice(0, 50).map((entry, i) => {
                const p = PRACTICES.find(pr => pr.id === entry.practiceId);
                if (!p) return null;
                return (
                  <div key={i} style={{
                    padding: "16px 20px", borderRadius: "20px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    marginBottom: "10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{
                        padding: "6px 10px", borderRadius: "10px",
                        background: `${TIER_COLOR[p.tier]}15`,
                        fontSize: "18px", flexShrink: 0,
                      }}>{STATE_EMOJI[entry.state]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginBottom: "4px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: "9px", fontWeight: 700,
                            color: TIER_COLOR[p.tier] }}>{entry.duration} min</div>
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)",
                          marginBottom: "6px" }}>
                          {entry.date} · {p.siddha} · Depth: {"★".repeat(entry.intensity)}{"☆".repeat(5-entry.intensity)}
                          {entry.transmission ? " · ⚡ Transmission felt" : ""}
                        </div>
                        {entry.notes && (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)",
                            lineHeight: 1.5, fontStyle: "italic" }}>
                            "{entry.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
