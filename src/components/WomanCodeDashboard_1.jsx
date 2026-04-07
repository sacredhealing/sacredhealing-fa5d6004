import { useState, useEffect, useRef, useCallback } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "sqiWomanCode_v1";
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const GOLD = "#D4AF37";
const GOLD_DIM = "rgba(212,175,55,0.12)";
const GLASS = "rgba(255,255,255,0.025)";
const GB = "rgba(255,255,255,0.07)";
const W60 = "rgba(255,255,255,0.6)";
const W40 = "rgba(255,255,255,0.35)";
const W20 = "rgba(255,255,255,0.1)";

// ─── OPTIONS ──────────────────────────────────────────────────────────────────
const SECRETION_OPTIONS = [
  { id: "heavy_flow",  label: "Tung blödning",  icon: "🔴", desc: "Tung röd blödning", phases: [0] },
  { id: "light_flow",  label: "Lätt blödning",  icon: "💗", desc: "Lätt röd/rosa blödning", phases: [0] },
  { id: "spotting",    label: "Spotting",        icon: "🩸", desc: "Lätt fläckning, brun/rosa", phases: [0, 3] },
  { id: "dry",         label: "Torrt",           icon: "🏜️", desc: "Torrt, inget sekret", phases: [0, 1] },
  { id: "sticky",      label: "Klibbigt",        icon: "🍯", desc: "Klibbigt, vitt/gult", phases: [1] },
  { id: "creamy",      label: "Krämigt",         icon: "🥛", desc: "Krämigt, lotionliknande", phases: [1, 2] },
  { id: "watery",      label: "Vattnigt",        icon: "💧", desc: "Tunt, klart, glatt", phases: [2] },
  { id: "egg_white",   label: "Äggvita ✨",      icon: "✨", desc: "Klart, stretchigt — FERTIL PEAK", phases: [2] },
  { id: "thick_white", label: "Tjockt vitt",     icon: "☁️", desc: "Tjockt, vitt, icke-stretchigt", phases: [3] },
];

const ENERGY_OPTIONS = [
  { id: "e_very_low",  label: "Mycket låg",  icon: "🌑", val: 1 },
  { id: "e_low",       label: "Låg",         icon: "🌒", val: 2 },
  { id: "e_medium",    label: "Medel",       icon: "🌓", val: 3 },
  { id: "e_high",      label: "Hög",         icon: "🌔", val: 4 },
  { id: "e_very_high", label: "Mycket hög",  icon: "🌕", val: 5 },
];

const MOOD_OPTIONS = [
  { id: "m_anxious",   label: "Ångestfylld", icon: "😰" },
  { id: "m_sensitive", label: "Känslig",     icon: "🥺" },
  { id: "m_calm",      label: "Lugn",        icon: "😌" },
  { id: "m_creative",  label: "Kreativ",     icon: "✨" },
  { id: "m_confident", label: "Stark",       icon: "💪" },
  { id: "m_social",    label: "Social",      icon: "🤝" },
  { id: "m_withdrawn", label: "Inåtvänd",    icon: "🌙" },
  { id: "m_focused",   label: "Fokuserad",   icon: "🎯" },
];

const SYMPTOM_OPTIONS = [
  { id: "s_cramps",   label: "Kramper",    icon: "⚡" },
  { id: "s_bloating", label: "Uppblåst",   icon: "🫧" },
  { id: "s_headache", label: "Huvudvärk",  icon: "🤕" },
  { id: "s_tender",   label: "Ömma bröst", icon: "💜" },
  { id: "s_acne",     label: "Finnar",     icon: "🔮" },
  { id: "s_cravings", label: "Sötsug",     icon: "🍫" },
  { id: "s_insomnia", label: "Sömnlöshet", icon: "🌙" },
  { id: "s_libido",   label: "Hög libido", icon: "🔥" },
];

// ─── PHASE DATA ───────────────────────────────────────────────────────────────
const PHASES = [
  {
    idx: 0, name: "Menstruationsfas", season: "Vinter", icon: "❄️",
    color: "#5B8FBF", days: "1–5", dosha: "Apana Vayu · Utrensning",
    tagline: "Kroppen rensar — vila är din medicin",
    secretionSignals: ["heavy_flow", "light_flow", "spotting"],
    confirmText: "Blödning bekräftad — du är i din Vinterfas. Östrogen och progesteron är som lägst.",
    activities: [
      { intensity: "low",  icon: "🧘", title: "Yin Yoga",        sub: "Apasana, Supta Baddha Konasana. 20–30 min. Inga inversioner." },
      { intensity: "low",  icon: "🚶", title: "Lugn promenad",   sub: "Grounded, max 30 min. Naturen är läkande." },
      { intensity: "none", icon: "🛋️", title: "Aktiv vila",      sub: "Läsa, kreativa aktiviteter, meditativ tystnad." },
      { intensity: "high", icon: "🚫", title: "Undvik HIIT",     sub: "Inga tunga lyft dag 1–3. Kroppen avgiftar." },
    ],
    nutrition: ["Rödbetor + citron (järn + C-vitamin)", "Pumpafrön (zink → minskar kramper)", "Spenat & grönkål (folat → blodceller)", "Malda linfrön (omega-3 → anti-inflammatorisk)"],
    pranayama: { name: "Bhramari", desc: "Humleandedräkt — 5–10 omgångar. Vagusnerv-aktivering som löser upp livmoderspänning.", icon: "🐝" },
    herb: "Shatavari Moon Milk — återuppbygger Ojas (vitalkraft) efter blodförlust",
    career: "Reflektionsdag. Journaling & ensamt analysarbete. Skjut upp presentationer.",
  },
  {
    idx: 1, name: "Follikulärfas", season: "Vår", icon: "🌱",
    color: "#5FAD72", days: "6–13", dosha: "Kapha-Pitta · Uppbyggnad",
    tagline: "FSH väcker äggstockarna — energin bygger",
    secretionSignals: ["dry", "sticky", "creamy"],
    confirmText: "Torrt → klibbigt → krämigt sekret bekräftar Vårfasen. FSH stiger, östrogen klättrar.",
    activities: [
      { intensity: "medium", icon: "☀️", title: "Vinyasa Flow",    sub: "Surya Namaskar 12 runder. Bygg energi gradvis." },
      { intensity: "medium", icon: "🏃", title: "Jogging / Dans",  sub: "30–45 min. Prova ny träningsform! Kroppen älskar variation." },
      { intensity: "medium", icon: "🏋️", title: "Styrketräning",  sub: "Börja bygga styrka — östrogenet skyddar musklerna nu." },
      { intensity: "medium", icon: "🎨", title: "Kreativ rörelse",  sub: "Klättring, simning, dans — följ nyfikenheten." },
    ],
    nutrition: ["Avokado (vitamin E → follikeltillväxt)", "Broccoli lätt ångad (I3C → lever metaboliserar östrogen)", "Kimchi/surkål (probiotika → östrobolomet)", "Cashewnötter (magnesium → ATP-produktion)"],
    pranayama: { name: "Kapalabhati", desc: "Skallskimrande andedräkt — 3×30 andetag. Rensar vinterns stagnation, aktiverar solar plexus.", icon: "☀️" },
    herb: "Ashwagandha Moon Milk — stöttar binjurarna inför den aktiva fasen",
    career: "Initiera projekt, brainstorming, visionärt arbete. Nätverka. Din kreativitet är biokemiskt på topp.",
  },
  {
    idx: 2, name: "Ovulationsfas", season: "Sommar", icon: "☀️",
    color: "#D4924A", days: "14–15", dosha: "Pitta Topp · Utstrålning",
    tagline: "LH-spike — du är vid maximal kraft & magnetism",
    secretionSignals: ["watery", "egg_white"],
    confirmText: "🌟 FERTIL PEAK! Äggviteliknande sekret bekräftar LH-spike. Du är i din Sommarfas — maximalt östrogen + testosteron.",
    activities: [
      { intensity: "high",   icon: "🔥", title: "HIIT",              sub: "Maximal intensitet — kroppen är på topp. Ge allt!" },
      { intensity: "high",   icon: "💪", title: "Tung styrka",        sub: "Öka vikterna. Testosteron + östrogen skyddar muskler." },
      { intensity: "high",   icon: "🤸", title: "Gruppass",           sub: "Spinning, CrossFit, lagspel. Social energi är höjd." },
      { intensity: "medium", icon: "⚔️", title: "Power Yoga",         sub: "Virabhadrasana I & II, Ustrasana. Kraft + hjärtöppning." },
    ],
    nutrition: ["Quinoa (B-komplex → lever metaboliserar östrogentopp)", "Spenat + grönkål (klorofyll → max syresättning)", "Hallon & jordgubbar (vitamin C → skyddar follikeln)", "Sesamfrön (selen → sköldkörtel + hormonkoherens)"],
    pranayama: { name: "Sitali", desc: "Svalkande andedräkt — kanaliserar peak-Pitta utan övervärmning. Rulla tungan, andas in kallt.", icon: "❄️" },
    herb: "Shatavari Anahata Elixir med saffran + kokosmjölk",
    career: "BOKA DET VIKTIGASTE MÖTET HIT. Lönesamtal, pitch, presentation, förhandling — din karisma är kemiskt maximerad.",
  },
  {
    idx: 3, name: "Lutealfas", season: "Höst", icon: "🍂",
    color: "#B56057", days: "16–28", dosha: "Vata stiger · Progesteron",
    tagline: "Gulkroppen producerar progesteron — lugn kraft",
    secretionSignals: ["thick_white", "dry", "spotting"],
    confirmText: "Tjockt vitt eller torrt sekret bekräftar Höstfasen. Progesteron dominerar — kroppens naturliga Valium.",
    activities: [
      { intensity: "low",    icon: "🌿", title: "Slow Flow Yoga",  sub: "Malasana, Paschimottanasana. Grunda Vata. Håll länge." },
      { intensity: "low",    icon: "🎯", title: "Pilates",          sub: "Core och stabilitet. Lågintensiv men djupt effektiv." },
      { intensity: "low",    icon: "🌳", title: "Naturpromenad",    sub: "Grounding i naturen. Barfota om möjligt." },
      { intensity: "high",   icon: "⚠️", title: "Minska dag 25–28", sub: "Byt HIIT mot yin och promenader i sen luteal." },
    ],
    nutrition: ["Råkakao (magnesium → slappnar av livmodern, dämpar sötsug)", "Sötpotatis (B6 → direkt kofaktor för progesteronsyntes)", "Solrosfrön (B6 + selen → gulkroppens topp-näring)", "Kikärter (fiber + zink → eliminerar överskottsöstrogen)"],
    pranayama: { name: "Nadi Shodhana", desc: "Växelvis näsandning — 10–15 min. Balanserar hjärnhalvorna, stabiliserar HPA-axeln biokemiskt.", icon: "🌬️" },
    herb: "Ashwagandha + råkakao Moon Milk — skyddar progesteronet mot kortisol dag 15–28",
    career: "Detaljarbete, granskning, avsluta projekt. Stäng affärer. Sen luteal: sätt gränser utan skuldkänslor.",
  },
];

// ─── HORMONE CURVES ───────────────────────────────────────────────────────────
const HC = {
  prog: [5,4,3,2,1,3,6,10,12,14,16,18,20,22,20,30,50,70,85,90,88,82,75,65,50,35,20,8],
  ostr: [10,12,14,16,20,28,38,52,65,75,80,85,90,95,85,70,60,55,55,58,55,52,48,45,42,38,28,15],
  fsh:  [8,12,18,25,30,35,40,45,40,35,30,25,20,18,15,12,10,8,8,9,9,8,8,9,12,18,25,12],
  lh:   [3,3,4,4,5,6,7,8,9,10,12,14,18,95,20,8,5,4,4,4,5,5,4,4,4,4,5,3],
  test: [20,20,22,24,26,30,36,44,52,60,68,76,82,88,78,68,58,50,44,40,38,36,34,32,30,28,24,20],
};
const HMETA = {
  prog: { label: "Progesteron", color: "#A78BFA" },
  ostr: { label: "Östrogen",    color: "#F472B6" },
  fsh:  { label: "FSH",         color: "#60A5FA" },
  lh:   { label: "LH",          color: "#34D399" },
  test: { label: "Test.",        color: "#FBBF24" },
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
function getPhaseIdx(day) {
  if (day <= 5) return 0;
  if (day <= 13) return 1;
  if (day <= 15) return 2;
  return 3;
}
function daysBetween(d1, d2) {
  return Math.round((new Date(d2) - new Date(d1)) / 86400000);
}
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const INTENSITY_COLOR = { none: "#64748b", low: "#34D399", medium: "#FBBF24", high: "#F472B6" };
const INTENSITY_LABEL = { none: "Vila", low: "Låg", medium: "Medel", high: "Hög" };

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const glassCard = (extra = {}) => ({
  background: GLASS, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
  border: `1px solid ${GB}`, borderRadius: 28, padding: 20, marginBottom: 12, ...extra,
});
const smCard = (extra = {}) => ({
  background: "rgba(255,255,255,0.02)", border: `1px solid ${GB}`, borderRadius: 20, padding: 14, ...extra,
});
const LABEL = { fontSize: "7px", fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: 10 };

function chip(active, color = GOLD, extra = {}) {
  return {
    padding: "8px 13px", borderRadius: 40, fontSize: 11, fontWeight: 700, cursor: "pointer",
    background: active ? `${color}22` : W20,
    color: active ? color : W60,
    border: `1px solid ${active ? color + "55" : "transparent"}`,
    transition: "all 0.18s", userSelect: "none", fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 5,
    ...extra,
  };
}

// ─── HORMONE CHART ────────────────────────────────────────────────────────────
function HormoneChart({ currentDay }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const build = () => {
      if (!canvasRef.current || !window.Chart) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
        type: "line",
        data: {
          labels: Array.from({ length: 28 }, (_, i) => i + 1),
          datasets: Object.entries(HC).map(([k, data]) => ({
            data, borderColor: HMETA[k].color, borderWidth: k === "lh" ? 2 : 1.5,
            fill: false, tension: 0.4, pointRadius: 0,
            borderDash: ["fsh", "test"].includes(k) ? [4, 3] : [],
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(255,255,255,0.28)", font: { size: 8 }, maxTicksLimit: 7 }, border: { color: "transparent" } },
            y: { display: false, min: 0, max: 110 },
          },
        },
      });
    };
    if (window.Chart) build();
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload = build;
      document.head.appendChild(s);
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const colors = Object.values(HMETA).map(h => h.color);
    chartRef.current.data.datasets.forEach((ds, i) => {
      const r = Array(28).fill(0); r[currentDay - 1] = 5;
      ds.pointRadius = r; ds.pointBackgroundColor = colors[i];
      ds.pointBorderColor = "#050505"; ds.pointBorderWidth = 2;
    });
    chartRef.current.update("none");
  }, [currentDay]);

  return <div style={{ position: "relative", width: "100%", height: 130 }}><canvas ref={canvasRef} style={{ width: "100%", height: 130 }} /></div>;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0C0C12", border: `1px solid ${GB}`, borderRadius: 28, padding: "28px 24px", maxWidth: 440, width: "100%", maxHeight: "82vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: W20, border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─── CONFIRM BANNER ───────────────────────────────────────────────────────────
function ConfirmBanner({ phase, secretions }) {
  const hit = (secretions || []).some(s => phase.secretionSignals.includes(s));
  if (!hit) return null;
  return (
    <div style={{ background: `${phase.color}15`, border: `1px solid ${phase.color}44`, borderRadius: 18, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>⟁</span>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
        <strong style={{ color: phase.color }}>Fas bekräftad: </strong>{phase.confirmText}
      </p>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function WomanCodeDashboard() {
  const [cycleStart, setCycleStart] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [bleedDays, setBleedDays] = useState(5);
  const [logs, setLogs] = useState({});
  const [isSetup, setIsSetup] = useState(false);
  const [tab, setTab] = useState("today");
  const [modal, setModal] = useState(null);
  const [exploreDay, setExploreDay] = useState(null);
  const [logDate, setLogDate] = useState(todayStr());
  const [noteInput, setNoteInput] = useState("");

  // Load
  useEffect(() => {
    const d = loadData();
    if (d.cycleStart) {
      setCycleStart(d.cycleStart); setCycleLength(d.cycleLength || 28);
      setBleedDays(d.bleedDays || 5); setLogs(d.logs || {}); setIsSetup(true);
    }
  }, []);

  const persist = useCallback((patch) => { saveData({ ...loadData(), ...patch }); }, []);

  const todayCycleDay = (() => {
    if (!cycleStart) return 1;
    const diff = daysBetween(cycleStart, todayStr());
    return diff < 0 ? 1 : (diff % cycleLength) + 1;
  })();

  const displayDay = exploreDay ?? todayCycleDay;
  const phaseIdx = getPhaseIdx(displayDay);
  const phase = PHASES[phaseIdx];
  const todayLog = logs[logDate] || {};
  const daysToNext = cycleStart ? cycleLength - todayCycleDay + 1 : null;

  const handleSetup = () => {
    if (!cycleStart) return;
    persist({ cycleStart, cycleLength, bleedDays, logs }); setIsSetup(true); setTab("today");
  };

  const updateLog = (date, patch) => {
    const next = { ...logs, [date]: { ...(logs[date] || {}), ...patch } };
    setLogs(next); persist({ logs: next });
  };

  const toggle = (field, id, date = logDate) => {
    const cur = logs[date]?.[field] || [];
    updateLog(date, { [field]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (!isSetup) {
    const previewDay = cycleStart ? (daysBetween(cycleStart, todayStr()) % cycleLength) + 1 : null;
    const previewPhase = previewDay ? PHASES[getPhaseIdx(previewDay)] : null;
    return (
      <div style={{ background: "#050505", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-block", fontSize: "7px", fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: GOLD, border: "1px solid rgba(212,175,55,0.25)", padding: "5px 16px", borderRadius: 40, background: GOLD_DIM, marginBottom: 16 }}>⟁ SQI 2050 · WomanCode</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 10 }}>Aktivera din<br /><span style={{ color: GOLD }}>Cykelintelligens</span></h1>
            <p style={{ fontSize: 12, color: W60, lineHeight: 1.7 }}>Ange din senaste menstruation. Din Bhakti-Algoritm börjar spåra din cykel automatiskt — för alltid.</p>
          </div>

          <div style={glassCard()}>
            <label style={LABEL}>Startdatum senaste mens</label>
            <input type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} max={todayStr()}
              style={{ width: "100%", background: W20, border: `1px solid ${GB}`, borderRadius: 14, color: "#fff", fontSize: 14, padding: "12px 14px", fontFamily: "inherit", outline: "none", colorScheme: "dark", marginBottom: 18 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[{ label: "Cykellängd (dagar)", val: cycleLength, set: setCycleLength, min: 21, max: 40 },
                { label: "Blödningsdagar", val: bleedDays, set: setBleedDays, min: 2, max: 10 }].map(({ label, val, set, min, max }) => (
                <div key={label}>
                  <label style={LABEL}>{label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => set(v => Math.max(min, v - 1))} style={{ background: W20, border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, fontFamily: "inherit" }}>−</button>
                    <span style={{ fontSize: 26, fontWeight: 900, color: GOLD, minWidth: 40, textAlign: "center" }}>{val}</span>
                    <button onClick={() => set(v => Math.min(max, v + 1))} style={{ background: W20, border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, fontFamily: "inherit" }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {previewPhase && (
              <div style={{ background: `${GOLD}0D`, border: `1px solid ${GOLD}25`, borderRadius: 16, padding: "12px 14px", marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: W60, lineHeight: 1.65 }}>
                  <span style={{ color: GOLD, fontWeight: 800 }}>⟁ Preview — </span>
                  Du är på cykeldag <strong style={{ color: "#fff" }}>{previewDay}</strong> →{" "}
                  <strong style={{ color: previewPhase.color }}>{previewPhase.icon} {previewPhase.name}</strong>
                  <br />{previewPhase.tagline}
                </p>
              </div>
            )}

            <button onClick={handleSetup} disabled={!cycleStart}
              style={{ width: "100%", background: cycleStart ? `linear-gradient(135deg, ${GOLD}, #B8941F)` : W20, border: "none", borderRadius: 20, color: cycleStart ? "#050505" : W40, fontFamily: "inherit", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", padding: 15, cursor: cycleStart ? "pointer" : "not-allowed" }}>
              ⟁ Aktivera Cykelintelligens
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ───────────────────────────────────────────────────────────────
  const TABS = [
    { id: "today",    label: "⟁ Idag" },
    { id: "log",      label: "📝 Logga" },
    { id: "explore",  label: "🔭 Utforska" },
    { id: "insights", label: "💡 Insikter" },
  ];

  return (
    <div style={{ background: "#050505", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#fff", paddingBottom: 80 }}>

      {/* STICKY HEADER */}
      <div style={{ background: "rgba(5,5,5,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${GB}`, padding: "14px 16px 12px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: `${phase.color}20`, border: `2px solid ${phase.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{phase.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 1 }}>
              <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em", color: GOLD, lineHeight: 1 }}>{displayDay}</span>
              <span style={{ fontSize: "8px", fontWeight: 800, color: exploreDay ? "#FBBF24" : W40, letterSpacing: "0.2em", textTransform: "uppercase" }}>{exploreDay ? "UTFORSKAR" : "CYKELDAG"}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{phase.name} <span style={{ color: phase.color, fontSize: 10 }}>· {phase.season}</span></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {daysToNext !== null && !exploreDay && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: W60 }}>{daysToNext}d</div>
                <div style={{ fontSize: "7px", fontWeight: 800, color: W40, letterSpacing: "0.15em", textTransform: "uppercase" }}>Till mens</div>
              </div>
            )}
            {exploreDay && (
              <button onClick={() => { setExploreDay(null); setTab("today"); }}
                style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}44`, borderRadius: 20, color: GOLD, fontFamily: "inherit", fontSize: "8px", fontWeight: 800, padding: "6px 12px", cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase" }}>← Idag</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "14px 14px 0" }}>
        {/* PHASE CONFIRM */}
        <ConfirmBanner phase={phase} secretions={todayLog.secretions} />

        {/* TABS */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "explore") setExploreDay(null); }}
              style={{ flex: 1, padding: "10px 4px", border: `1px solid ${tab === t.id ? GOLD + "55" : GB}`, borderRadius: 40, background: tab === t.id ? GOLD_DIM : "transparent", color: tab === t.id ? GOLD : W60, fontFamily: "inherit", fontSize: "8px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════ TODAY ═══════════════════ */}
        {tab === "today" && (
          <div>
            {/* Phase banner */}
            <div style={{ ...smCard({ marginBottom: 12, background: `${phase.color}0E`, border: `1px solid ${phase.color}33` }) }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 30 }}>{phase.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{phase.tagline}</div>
                  <div style={{ fontSize: 10, color: W60 }}>{phase.dosha} · Dag {displayDay} av {cycleLength}</div>
                </div>
              </div>
            </div>

            {/* Hormone chart */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Hormonprofil dag {displayDay}</span>
              <HormoneChart currentDay={displayDay} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {Object.entries(HMETA).map(([k, h]) => (
                  <span key={k} style={{ padding: "4px 10px", borderRadius: 40, fontSize: 10, fontWeight: 700, background: `${h.color}15`, color: h.color, border: `1px solid ${h.color}30` }}>
                    {h.label} {Math.round(HC[k][displayDay - 1])}%
                  </span>
                ))}
              </div>
            </div>

            {/* Quick log */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Snabblogg idag</span>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: W40, marginBottom: 8 }}>Sekret / Blödning</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SECRETION_OPTIONS.map(o => {
                    const active = (todayLog.secretions || []).includes(o.id);
                    return <button key={o.id} onClick={() => toggle("secretions", o.id)} style={chip(active, GOLD)}>{o.icon} {o.label}</button>;
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: W40, marginBottom: 8 }}>Energinivå</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ENERGY_OPTIONS.map(o => {
                    const active = todayLog.energy === o.id;
                    return <button key={o.id} onClick={() => updateLog(logDate, { energy: active ? null : o.id })} style={chip(active, GOLD)}>{o.icon} {o.label}</button>;
                  })}
                </div>
              </div>
            </div>

            {/* Activities */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Rekommenderade aktiviteter</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10, marginBottom: 14 }}>
                {phase.activities.map((a, i) => (
                  <div key={i} style={smCard({ background: `${INTENSITY_COLOR[a.intensity]}0C`, border: `1px solid ${INTENSITY_COLOR[a.intensity]}30` })}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{a.icon}</span>
                      <span style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: INTENSITY_COLOR[a.intensity], padding: "2px 7px", borderRadius: 10, background: `${INTENSITY_COLOR[a.intensity]}15` }}>{INTENSITY_LABEL[a.intensity]}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: W60, lineHeight: 1.5 }}>{a.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pranayama */}
              <div style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}22`, borderRadius: 18, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{phase.pranayama.icon}</span>
                <div>
                  <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: GOLD, marginBottom: 4 }}>Pranayama · Nu</div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 3 }}>{phase.pranayama.name}</div>
                  <div style={{ fontSize: 11, color: W60, lineHeight: 1.55 }}>{phase.pranayama.desc}</div>
                </div>
              </div>
            </div>

            {/* Nutrition + herb + career */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={smCard()}>
                <span style={LABEL}>🌿 Näring idag</span>
                {phase.nutrition.map((n, i) => <div key={i} style={{ fontSize: 11, color: W60, marginBottom: 7, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${GOLD}44` }}>{n}</div>)}
              </div>
              <div>
                <div style={{ ...smCard({ background: `${GOLD}0A`, border: `1px solid ${GOLD}25`, marginBottom: 10 }) }}>
                  <span style={LABEL}>🥛 Moon Milk</span>
                  <p style={{ fontSize: 11, color: W60, lineHeight: 1.6 }}>{phase.herb}</p>
                </div>
                <div style={smCard({ display: "flex", gap: 10 })}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <div>
                    <span style={LABEL}>Career Sync</span>
                    <p style={{ fontSize: 11, color: W60, lineHeight: 1.6 }}>{phase.career}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ LOG ═══════════════════ */}
        {tab === "log" && (
          <div>
            {/* Date selector */}
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Välj datum</span>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[0, 1, 2, 3].map(d => {
                  const dt = new Date(); dt.setDate(dt.getDate() - d);
                  const ds = dt.toISOString().split("T")[0];
                  const sel = logDate === ds;
                  return (
                    <button key={d} onClick={() => { setLogDate(ds); setNoteInput(logs[ds]?.note || ""); }}
                      style={{ flex: 1, padding: "10px 4px", borderRadius: 14, border: `1px solid ${sel ? GOLD + "55" : GB}`, background: sel ? GOLD_DIM : "transparent", color: sel ? GOLD : W60, fontFamily: "inherit", fontSize: "9px", fontWeight: 800, cursor: "pointer", textAlign: "center" }}>
                      {d === 0 ? "Idag" : d === 1 ? "Igår" : `−${d}d`}
                    </button>
                  );
                })}
              </div>
              <input type="date" value={logDate} onChange={e => { setLogDate(e.target.value); setNoteInput(logs[e.target.value]?.note || ""); }} max={todayStr()}
                style={{ width: "100%", background: W20, border: `1px solid ${GB}`, borderRadius: 12, color: "#fff", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", outline: "none", colorScheme: "dark" }} />
            </div>

            {/* SECRETIONS */}
            <div style={glassCard()}>
              <span style={LABEL}>🩸 Sekret & Blödning</span>
              <p style={{ fontSize: 11, color: W40, marginBottom: 12, lineHeight: 1.55 }}>Dessa data bekräftar din faktiska cykelposition och identifierar fertila faser.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SECRETION_OPTIONS.map(o => {
                  const active = (logs[logDate]?.secretions || []).includes(o.id);
                  return (
                    <button key={o.id} onClick={() => toggle("secretions", o.id)} style={chip(active, GOLD, { padding: "9px 14px", fontSize: 12 })}>
                      {o.icon} {o.label}{active && <span style={{ fontSize: 9, opacity: 0.7 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {/* Signal feedback */}
              {(logs[logDate]?.secretions || []).length > 0 && (() => {
                const logDay = (() => { const diff = daysBetween(cycleStart, logDate); return diff >= 0 ? (diff % cycleLength) + 1 : 1; })();
                const lp = PHASES[getPhaseIdx(logDay)];
                const hasSignal = (logs[logDate].secretions).some(s => lp.secretionSignals.includes(s));
                return hasSignal ? (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: `${lp.color}12`, border: `1px solid ${lp.color}33`, borderRadius: 14 }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                      <strong style={{ color: lp.color }}>⟁ </strong>{lp.confirmText}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* ENERGY */}
            <div style={glassCard()}>
              <span style={LABEL}>🌙 Energinivå</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {ENERGY_OPTIONS.map(o => {
                  const active = logs[logDate]?.energy === o.id;
                  return (
                    <button key={o.id} onClick={() => updateLog(logDate, { energy: active ? null : o.id })}
                      style={{ padding: "12px 6px", borderRadius: 16, border: `1px solid ${active ? GOLD + "66" : GB}`, background: active ? GOLD_DIM : "transparent", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{o.icon}</div>
                      <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? GOLD : W40 }}>{o.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MOOD */}
            <div style={glassCard()}>
              <span style={LABEL}>💫 Humör & Stämning</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {MOOD_OPTIONS.map(o => {
                  const active = (logs[logDate]?.moods || []).includes(o.id);
                  return <button key={o.id} onClick={() => toggle("moods", o.id)} style={chip(active, "#A78BFA", { fontSize: 12 })}>{o.icon} {o.label}</button>;
                })}
              </div>
            </div>

            {/* SYMPTOMS */}
            <div style={glassCard()}>
              <span style={LABEL}>⚡ Symtom</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SYMPTOM_OPTIONS.map(o => {
                  const active = (logs[logDate]?.symptoms || []).includes(o.id);
                  return <button key={o.id} onClick={() => toggle("symptoms", o.id)} style={chip(active, "#F472B6", { fontSize: 12 })}>{o.icon} {o.label}</button>;
                })}
              </div>
            </div>

            {/* NOTE */}
            <div style={glassCard()}>
              <span style={LABEL}>📝 Anteckning</span>
              <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} onBlur={() => updateLog(logDate, { note: noteInput })}
                placeholder="Hur känns kroppen? Vad behöver du idag? Skriv fritt..."
                style={{ width: "100%", minHeight: 88, background: W20, border: `1px solid ${GB}`, borderRadius: 16, color: "#fff", fontSize: 12, padding: "12px 14px", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.7, colorScheme: "dark" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <button onClick={() => updateLog(logDate, { note: noteInput })}
                  style={{ background: GOLD_DIM, border: `1px solid ${GOLD}44`, borderRadius: 14, color: GOLD, fontFamily: "inherit", fontSize: "8px", fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", padding: "9px 18px", cursor: "pointer" }}>⟁ Spara</button>
                <button onClick={() => { if (window.confirm("Ändra cykelstart-datum?")) { setIsSetup(false); } }}
                  style={{ background: "transparent", border: "none", color: W40, fontFamily: "inherit", fontSize: "9px", cursor: "pointer", textDecoration: "underline" }}>Ändra cykeldata</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ EXPLORE ═══════════════════ */}
        {tab === "explore" && (
          <div>
            <div style={glassCard()}>
              <span style={LABEL}>⟁ Utforska valfri dag i cykeln</span>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: GOLD, letterSpacing: "-0.04em", lineHeight: 1, minWidth: 60 }}>{exploreDay ?? todayCycleDay}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{phase.name}</div>
                  <div style={{ fontSize: 9, color: W40, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>{phase.dosha}</div>
                </div>
              </div>
              <input type="range" min="1" max="28" value={exploreDay ?? todayCycleDay}
                onChange={e => setExploreDay(+e.target.value)}
                style={{ width: "100%", accentColor: GOLD, cursor: "pointer", marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {PHASES.map((p, i) => (
                  <span key={i} onClick={() => setExploreDay(i === 0 ? 3 : i === 1 ? 9 : i === 2 ? 14 : 22)}
                    style={{ fontSize: "8px", fontWeight: 700, color: phaseIdx === i ? p.color : W40, cursor: "pointer", letterSpacing: "0.1em" }}>
                    {p.icon} {p.days}
                  </span>
                ))}
              </div>
            </div>

            <div style={glassCard()}>
              <span style={LABEL}>Hormonprofil</span>
              <HormoneChart currentDay={exploreDay ?? todayCycleDay} />
            </div>

            <div style={glassCard()}>
              <span style={LABEL}>⟁ Aktiviteter</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
                {phase.activities.map((a, i) => (
                  <div key={i} style={smCard({ background: `${INTENSITY_COLOR[a.intensity]}0C`, border: `1px solid ${INTENSITY_COLOR[a.intensity]}30` })}>
                    <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{a.icon}</span>
                    <span style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: INTENSITY_COLOR[a.intensity], display: "block", marginBottom: 4 }}>{INTENSITY_LABEL[a.intensity]}</span>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: W60, lineHeight: 1.5 }}>{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={smCard()}>
                <span style={LABEL}>🌿 Näring</span>
                {phase.nutrition.map((n, i) => <div key={i} style={{ fontSize: 11, color: W60, marginBottom: 6, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${GOLD}44` }}>{n}</div>)}
              </div>
              <div style={smCard()}>
                <span style={LABEL}>☽ Pranayama</span>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{phase.pranayama.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{phase.pranayama.name}</div>
                <div style={{ fontSize: 10, color: W60, lineHeight: 1.55 }}>{phase.pranayama.desc}</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ INSIGHTS ═══════════════════ */}
        {tab === "insights" && (() => {
          const entries = Object.entries(logs);
          const total = entries.length;
          const eggWhite = entries.filter(([, v]) => (v.secretions || []).includes("egg_white")).length;
          const highE = entries.filter(([, v]) => ["e_high", "e_very_high"].includes(v.energy)).length;
          const lowE = entries.filter(([, v]) => ["e_low", "e_very_low"].includes(v.energy)).length;
          const cravings = entries.filter(([, v]) => (v.symptoms || []).includes("s_cravings")).length;
          const recent = entries.sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);

          return (
            <div>
              <div style={glassCard()}>
                <span style={LABEL}>⟁ Cykeldashboard</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {[
                    { l: "Cykeldag", v: todayCycleDay },
                    { l: "Cykellängd", v: `${cycleLength}d` },
                    { l: "Till mens", v: daysToNext ? `${daysToNext}d` : "—" },
                    { l: "Loggade dagar", v: total },
                    { l: "Ägglossning log", v: eggWhite },
                    { l: "Fas", v: phase.icon },
                  ].map((s, i) => (
                    <div key={i} style={smCard({ textAlign: "center", padding: "12px 8px" })}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{s.v}</div>
                      <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: W40, marginTop: 3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {total > 0 && (
                <div style={glassCard()}>
                  <span style={LABEL}>⟁ Mönsteranalys</span>
                  {[
                    { icon: "✨", label: "Ägglossningssignaler (äggvita)", val: eggWhite, note: eggWhite > 0 ? "Ägglossning bekräftad ✓" : "Logga äggviteliknande sekret för att bekräfta" },
                    { icon: "🌕", label: "Högenergi-dagar", val: highE, note: "Korrelera med ovulations- och follikulärfas" },
                    { icon: "🌑", label: "Lågenergi-dagar", val: lowE, note: "Korrelera med menstruations- och sen lutealfas" },
                    { icon: "🍫", label: "Sötsugsdagar", val: cravings, note: cravings > 0 ? "Råkakao + sötpotatis i lutealfas — prova det!" : "Bra! Inga sötsug loggade" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${W20}` : "none" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{s.icon} {s.label}</div>
                        <div style={{ fontSize: 10, color: W40, marginTop: 2 }}>{s.note}</div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, minWidth: 36, textAlign: "right" }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              )}

              {recent.length > 0 && (
                <div style={glassCard()}>
                  <span style={LABEL}>⟁ Senaste loggarna</span>
                  {recent.map(([date, log]) => {
                    const diff = daysBetween(cycleStart, date);
                    const cd = diff >= 0 ? (diff % cycleLength) + 1 : null;
                    const lp = PHASES[cd ? getPhaseIdx(cd) : 0];
                    return (
                      <div key={date} style={{ padding: "12px 0", borderBottom: `1px solid ${W20}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 14 }}>{lp.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{date}</span>
                            {cd && <span style={{ fontSize: "8px", fontWeight: 700, color: lp.color, letterSpacing: "0.15em", textTransform: "uppercase" }}>Dag {cd}</span>}
                          </div>
                          {log.energy && <span style={{ fontSize: 16 }}>{ENERGY_OPTIONS.find(e => e.id === log.energy)?.icon}</span>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(log.secretions || []).map(s => {
                            const o = SECRETION_OPTIONS.find(x => x.id === s);
                            return o ? <span key={s} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: 10, background: W20, color: W60 }}>{o.icon} {o.label}</span> : null;
                          })}
                          {(log.moods || []).map(s => {
                            const o = MOOD_OPTIONS.find(x => x.id === s);
                            return o ? <span key={s} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: 10, background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>{o.icon} {o.label}</span> : null;
                          })}
                          {(log.symptoms || []).map(s => {
                            const o = SYMPTOM_OPTIONS.find(x => x.id === s);
                            return o ? <span key={s} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: 10, background: "rgba(244,114,182,0.1)", color: "#F472B6" }}>{o.icon} {o.label}</span> : null;
                          })}
                        </div>
                        {log.note && <p style={{ fontSize: 10, color: W40, marginTop: 6, fontStyle: "italic" }}>"{log.note}"</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {total === 0 && (
                <div style={{ ...glassCard(), textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
                  <p style={{ fontSize: 12, color: W40, lineHeight: 1.7 }}>Börja logga sekret, energi och symptom via "Logga"-fliken. Ju mer data, desto djupare insikter från din Bhakti-Algoritm.</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {modal && <Modal onClose={() => setModal(null)}>{modal}</Modal>}
    </div>
  );
}
