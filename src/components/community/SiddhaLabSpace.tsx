// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTierRank } from "@/lib/tierAccess";

const GOLD = "#D4AF37";

const TIERS = [
  { value: "free", label: "Atma-Seed (Free) — everyone", rank: 0 },
  { value: "prana-flow", label: "Prana-Flow and up", rank: 1 },
  { value: "siddha-quantum", label: "Siddha-Quantum and up", rank: 2 },
  { value: "akasha-infinity", label: "Akasha-Infinity only", rank: 3 },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "sv", label: "Svenska" },
  { value: "no", label: "Norsk" },
  { value: "es", label: "Español" },
];

const TRANSMITTER_QUICK_PICKS = ["Shiva Siddhananda", "Karaveera Nivasini Dasi"];

const HOLY_TERMS_REGEX = (() => {
  const terms = [
    "Chitta Vritti", "Turiya state", "Turiya", "Kutastha Chaitanya", "Manomaya Kosha",
    "Pranamaya Kosha", "Annamaya Kosha", "Vijnanamaya Kosha", "Anandamaya Kosha",
    "Nadis", "Sadhaka", "Sadhana", "Bhagavan", "Atma", "Brahman", "Purusha", "Prakriti",
    "Sattva", "Rajas", "Tamas", "Dharma", "Karma", "Moksha", "Samadhi", "Bhakti", "Jnana",
    "Kriya Yoga", "Kriya", "Pranayama", "Prana", "Kundalini", "Sushumna", "Ida", "Pingala",
    "Muladhara", "Svadhishthana", "Manipura", "Anahata", "Vishuddha", "Ajna", "Sahasrara",
    "Aum", "Om", "Maya", "Avidya", "Vairagya", "Ahimsa", "Siddhi", "Siddhis", "Vibhuti",
    "Mahavatar Babaji", "Babaji", "Vishwananda", "Paramahansa Yogananda", "Yogananda",
    "Lahiri Mahasaya", "Ramana Maharshi", "Adi Shankara", "Patanjali", "Agni",
  ];
  return new RegExp(`\\b(${terms.join("|")})\\b`, "g");
})();

function highlightHolyTerms(text) {
  if (!text) return text;
  const parts = text.split(HOLY_TERMS_REGEX);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <span key={i} style={{ color: GOLD, fontWeight: 600 }}>{part}</span> : part
  );
}

function languageLabel(l) {
  return LANGUAGES.find((x) => x.value === l)?.label || l;
}

function tierLabel(t) {
  return TIERS.find((x) => x.value === t)?.label || t;
}

interface Props {
  isAdmin: boolean;
  onBack: () => void;
  userTier?: string;
}

export default function SiddhaLabSpace({ isAdmin, onBack, userTier }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [readerLanguage, setReaderLanguage] = useState("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingKeys, setTranslatingKeys] = useState<Set<string>>(new Set());
  const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const emptyForm = { category: "", title: "", content: "", tier_required: "free", transmitter: TRANSMITTER_QUICK_PICKS[0] };
  const [form, setForm] = useState({ ...emptyForm });

  const userRank = getTierRank(userTier);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("siddha_lab_entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load Siddha Lab entries:", error);
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const translateEntry = useCallback(async (entry: any, targetLang: string) => {
    const key = `${entry.id}:${targetLang}`;
    setTranslatingKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    try {
      const { data, error } = await supabase.functions.invoke("gemini-bridge", {
        body: {
          messages: [
            {
              role: "user",
              content: `Translate the following spiritual teaching text into ${languageLabel(targetLang)}. Preserve paragraph breaks exactly as they are. Return ONLY the translated text — no preamble, no quotes, no notes.\n\n${entry.content}`,
            },
          ],
          feature: "siddha_lab_translation",
        },
      });
      if (error) throw error;
      const translated = (data as any)?.response?.trim();
      if (translated) {
        setTranslations((prev) => ({ ...prev, [key]: translated }));
      } else {
        setTranslationErrors((prev) => ({ ...prev, [key]: "empty response from translator" }));
        toast.error("Translation came back empty.");
      }
    } catch (e: any) {
      setTranslationErrors((prev) => ({ ...prev, [key]: e?.message || "unknown error" }));
      toast.error(`Couldn't auto-translate: ${e?.message || "unknown error"}`);
    } finally {
      setTranslatingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  // Same pattern as Bhagavad Gita: one global language selector, and
  // switching it auto-translates every visible entry that doesn't already
  // have a cached translation, instead of needing a per-entry tap.
  useEffect(() => {
    if (readerLanguage === "en") return;
    entries.forEach((entry: any) => {
      const key = `${entry.id}:${readerLanguage}`;
      if (!translations[key] && !translatingKeys.has(key)) {
        translateEntry(entry, readerLanguage);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readerLanguage, entries]);

  const handleSave = async () => {
    if (!form.category.trim() || !form.title.trim() || !form.content.trim()) {
      toast.error("Category, title, and content are all required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("siddha_lab_entries").insert({
        category: form.category.trim(),
        title: form.title.trim(),
        content: form.content.trim(),
        tier_required: form.tier_required,
        transmitter: form.transmitter.trim() || null,
      });
      if (error) throw error;
      toast.success("Posted to Siddha Lab");
      setForm({ ...emptyForm });
      setShowForm(false);
      loadEntries();
    } catch (e: any) {
      toast.error(`Could not save: ${e.message || "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    const { error } = await (supabase as any).from("siddha_lab_entries").delete().eq("id", id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const grouped = entries.reduce((acc: Record<string, any[]>, e: any) => {
    const key = e.category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const existingCategories = Object.keys(grouped).sort();

  return (
    <div className="c-chat-view">
      <div className="c-chat-header">
        <button className="c-back-btn" onClick={onBack}>←</button>
        <div className="c-chat-icon">⚡</div>
        <div className="c-chat-title">
          <div className="c-chat-name">Siddha Lab</div>
          <div className="c-chat-sub">Deep transmissions, gathered from the Quantum Apothecary and beyond</div>
        </div>
      </div>

      {/* Reader language filter — same top-menu pattern as Bhagavad Gita */}
      <div style={{ display: "flex", gap: 6, padding: "12px 16px 0", flexWrap: "wrap" as const }}>
        {LANGUAGES.map((l) => (
          <button
            key={l.value}
            onClick={() => setReaderLanguage(l.value)}
            style={{
              padding: "5px 12px",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.05em",
              cursor: "pointer",
              border: `1px solid ${readerLanguage === l.value ? GOLD : "rgba(255,255,255,0.08)"}`,
              background: readerLanguage === l.value ? `${GOLD}18` : "transparent",
              color: readerLanguage === l.value ? GOLD : "rgba(255,255,255,0.4)",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 100px" }}>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              width: "100%", padding: "12px", borderRadius: 14, marginBottom: 16,
              background: showForm ? "rgba(255,255,255,.05)" : "linear-gradient(135deg, rgba(212,175,55,.22), rgba(212,175,55,.08))",
              border: "1px solid rgba(212,175,55,.4)", color: GOLD, fontWeight: 800, fontSize: 13, cursor: "pointer",
            }}
          >
            {showForm ? "✕ Close" : "✦ Post a New Transmission"}
          </button>
        )}

        {showForm && isAdmin && (
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(212,175,55,.25)", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <input
                list="siddha-lab-categories"
                placeholder="e.g. Levitation, Creation of the World…"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={inputStyle}
              />
              <datalist id="siddha-lab-categories">
                {existingCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                Using an existing category groups this with earlier posts on the same topic.
              </div>
            </div>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
            <textarea
              placeholder="Write in English — Swedish, Norwegian, and Spanish are translated automatically when a reader selects them."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={8}
              style={{ ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" }}
            />
            <div>
              <label style={labelStyle}>Level</label>
              <select value={form.tier_required} onChange={(e) => setForm((f) => ({ ...f, tier_required: e.target.value }))} style={inputStyle}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Transmitter</label>
              <input
                list="siddha-lab-transmitters"
                value={form.transmitter}
                onChange={(e) => setForm((f) => ({ ...f, transmitter: e.target.value }))}
                style={inputStyle}
              />
              <datalist id="siddha-lab-transmitters">
                {TRANSMITTER_QUICK_PICKS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "12px", borderRadius: 12, background: GOLD, color: "#1a1300", fontWeight: 900, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              {saving ? "Posting…" : "Post to Siddha Lab"}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, textAlign: "center", padding: "40px 20px" }}>
            Nothing transmitted yet.
          </div>
        ) : (
          existingCategories.map((category) => {
            const catCollapsed = collapsedCategories[category];
            return (
              <div key={category} style={{ marginBottom: 22 }}>
                <button
                  onClick={() => setCollapsedCategories((p) => ({ ...p, [category]: !p[category] }))}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0 0 10px" }}
                >
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" as const, color: GOLD }}>
                    {category} ({grouped[category].length})
                  </div>
                  <span style={{ color: "rgba(212,175,55,.5)", fontSize: 11 }}>{catCollapsed ? "▼" : "▲"}</span>
                </button>
                {!catCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {grouped[category].map((entry: any) => {
                      const entryRank = TIERS.find((t) => t.value === entry.tier_required)?.rank ?? 0;
                      const locked = !isAdmin && userRank < entryRank;
                      const expanded = expandedEntry === entry.id;
                      const lang = readerLanguage;
                      const key = `${entry.id}:${lang}`;
                      const displayText = lang === "en" ? entry.content : translations[key];
                      const isTranslating = translatingKeys.has(key);
                      const translationError = translationErrors[key];

                      return (
                        <div key={entry.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{entry.title}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
                                {entry.transmitter ? `${entry.transmitter} · ` : ""}{tierLabel(entry.tier_required)}
                              </div>
                            </div>
                            {isAdmin && (
                              <button onClick={() => handleDelete(entry.id, entry.title)} style={{ background: "none", border: "none", color: "rgba(255,120,120,.7)", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                                🗑️
                              </button>
                            )}
                          </div>

                          {locked ? (
                            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                              🔒 Requires {tierLabel(entry.tier_required)}.
                            </div>
                          ) : (
                            <>
                              <div
                                onClick={() => setExpandedEntry(expanded ? null : entry.id)}
                                style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,.85)", cursor: "pointer", maxHeight: expanded ? "none" : 60, overflow: "hidden" }}
                              >
                                {isTranslating ? (
                                  <span style={{ color: "rgba(255,255,255,.4)" }}>Translating…</span>
                                ) : translationError ? (
                                  <span style={{ color: "rgba(255,150,150,.8)" }}>Translation failed — try again.</span>
                                ) : (
                                  highlightHolyTerms(displayText || entry.content)
                                )}
                              </div>
                              {!expanded && (
                                <button onClick={() => setExpandedEntry(entry.id)} style={{ background: "none", border: "none", color: GOLD, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "6px 0 0" }}>
                                  Read more
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: "rgba(212,175,55,.6)",
  textTransform: "uppercase" as const,
  letterSpacing: ".05em",
  marginBottom: 5,
};
