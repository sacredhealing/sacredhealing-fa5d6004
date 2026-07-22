// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GOLD = "#D4AF37";
const CYAN = "#22D3EE";

const TIERS = [
  { value: "free", label: "Atma-Seed (Free) — everyone" },
  { value: "prana-flow", label: "Prana-Flow and up" },
  { value: "siddha-quantum", label: "Siddha-Quantum and up" },
  { value: "akasha-infinity", label: "Akasha-Infinity only" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "sv", label: "Svenska" },
  { value: "no", label: "Norsk" },
  { value: "es", label: "Español" },
];

const TRANSMITTER_QUICK_PICKS = ["Shiva Siddhananda", "Karaveera Nivasini Dasi"];

// Same visual language as Quantum Apothecary: holy/Sanskrit/Vedic terms auto-highlighted in gold.
const HOLY_TERMS_REGEX = (() => {
  const terms = [
    'Chitta Vritti', 'Turiya', 'Kutastha Chaitanya', 'Manomaya Kosha', 'Pranamaya Kosha',
    'Annamaya Kosha', 'Vijnanamaya Kosha', 'Anandamaya Kosha', 'Nadi(?:s)?', '72,000 Nadi(?:s)?',
    'Sadhaka', 'Sadhana', 'Arjuna', 'Krishna', 'Bhagavan', 'Atma', 'Brahman', 'Purusha', 'Prakriti',
    'Sattva', 'Rajas', 'Tamas', 'Dharma', 'Karma', 'Moksha', 'Samadhi', 'Bhakti', 'Jnana', 'Kriya',
    'Prana', 'Kundalini', 'Sushumna', 'Ida', 'Pingala', 'Muladhara', 'Svadhishthana', 'Manipura',
    'Anahata', 'Vishuddha', 'Ajna', 'Sahasrara', 'Om|Aum', 'Maya', 'Avidya', 'Vairagya', 'Ahimsa',
    'Vishwananda', 'Mahavatar Babaji', 'Babaji', 'Paramahansa Yogananda', 'Yogananda',
    'Ramana Maharshi', 'Adi Shankara', 'Patanjali', 'Turiya state',
  ];
  return new RegExp(`(${terms.join('|')})`, 'g');
})();

function highlightHolyTerms(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(HOLY_TERMS_REGEX);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: GOLD, fontWeight: 600 }}>{part}</span>
    ) : (
      part
    )
  );
}

function tierLabel(t) {
  return TIERS.find((x) => x.value === t)?.label || t;
}
function tierBadgeColor(t) {
  if (t === "free") return "rgba(255,255,255,0.35)";
  if (t === "prana-flow") return "#8DD9C9";
  if (t === "siddha-quantum") return CYAN;
  return GOLD;
}
function languageLabel(l) {
  return LANGUAGES.find((x) => x.value === l)?.label || l;
}

interface Props {
  isAdmin: boolean;
  onBack: () => void;
}

const emptyForm = {
  chapter: "",
  verse_number: "",
  sanskrit: "",
  transliteration: "",
  translation: "",
  transmitted_by: "",
  language: "en",
  tier_required: "free",
};

export default function BhagavadGitaSpace({ isAdmin, onBack }: Props) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingSanskrit, setFetchingSanskrit] = useState(false);
  const [sanskritFetchStatus, setSanskritFetchStatus] = useState(null); // "ok" | "notfound" | null
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [readerLanguage, setReaderLanguage] = useState("en");

  const [form, setForm] = useState({ ...emptyForm });

  const loadVerses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bhagavad_gita_verses" as any)
      .select("*")
      .order("chapter", { ascending: true })
      .order("verse_number", { ascending: true });
    if (error) {
      console.error("Failed to load Gita verses:", error);
      setVerses([]);
    } else {
      setVerses((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  const resetForm = () => setForm({ ...emptyForm });

  // Auto-fetch the canonical Sanskrit + transliteration for a chapter/verse
  // from the free, open-source Vedic Scriptures Gita API — no key needed.
  // Admin can still hand-edit the fetched text before saving.
  const fetchSanskrit = useCallback(async (chapter: string, verseNum: string) => {
    const ch = parseInt(chapter, 10);
    const sl = parseInt(verseNum, 10);
    if (!ch || !sl || ch < 1 || ch > 18 || sl < 1) return;
    setFetchingSanskrit(true);
    setSanskritFetchStatus(null);
    try {
      const res = await fetch(`https://vedicscriptures.github.io/slok/${ch}/${sl}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      if (!data || !data.slok) throw new Error("not found");
      setForm((f) => ({
        ...f,
        sanskrit: data.slok.replace(/\n/g, " ").trim(),
        transliteration: (data.transliteration || "").replace(/\n/g, " ").trim(),
      }));
      setSanskritFetchStatus("ok");
    } catch (e) {
      setSanskritFetchStatus("notfound");
    } finally {
      setFetchingSanskrit(false);
    }
  }, []);

  const handleChapterVerseBlur = () => {
    fetchSanskrit(form.chapter, form.verse_number);
  };

  const submitVerse = async () => {
    if (!form.chapter || !form.verse_number || !form.translation.trim()) {
      toast.error("Chapter, verse number, and the teaching text are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from("bhagavad_gita_verses" as any).upsert(
        {
          chapter: parseInt(form.chapter, 10),
          verse_number: parseInt(form.verse_number, 10),
          sanskrit: form.sanskrit.trim() || null,
          transliteration: form.transliteration.trim() || null,
          translation: form.translation.trim(),
          transmitted_by: form.transmitted_by.trim() || null,
          language: form.language,
          tier_required: form.tier_required,
          is_published: true,
          created_by: authData?.user?.id || null,
        },
        { onConflict: "chapter,verse_number,language" }
      );
      if (error) throw error;
      toast.success(`Chapter ${form.chapter}, Verse ${form.verse_number} (${languageLabel(form.language)}) transmitted — ${tierLabel(form.tier_required)}`);
      // Keep transmitted_by + language + tier for the next verse — admin is usually posting a batch.
      setForm((f) => ({ ...emptyForm, transmitted_by: f.transmitted_by, language: f.language, tier_required: f.tier_required }));
      setSanskritFetchStatus(null);
      loadVerses();
    } catch (e: any) {
      toast.error(e.message || "Could not save this verse.");
    } finally {
      setSubmitting(false);
    }
  };

  const editVerse = (v: any) => {
    setForm({
      chapter: String(v.chapter),
      verse_number: String(v.verse_number),
      sanskrit: v.sanskrit || "",
      transliteration: v.transliteration || "",
      translation: v.translation || "",
      transmitted_by: v.transmitted_by || "",
      language: v.language || "en",
      tier_required: v.tier_required || "free",
    });
    setSanskritFetchStatus(v.sanskrit ? "ok" : null);
    setShowAddForm(true);
  };

  const deleteVerse = async (id: string) => {
    if (!confirm("Remove this verse?")) return;
    const { error } = await supabase.from("bhagavad_gita_verses" as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setVerses((prev) => prev.filter((v: any) => v.id !== id));
  };

  const visibleVerses = verses.filter((v: any) => (v.language || "en") === readerLanguage);
  const byChapter: Record<number, any[]> = {};
  visibleVerses.forEach((v: any) => {
    if (!byChapter[v.chapter]) byChapter[v.chapter] = [];
    byChapter[v.chapter].push(v);
  });
  const chapterNums = Object.keys(byChapter).map(Number).sort((a, b) => a - b);
  const languagesPresent = new Set(verses.map((v: any) => v.language || "en"));

  return (
    <div className="c-chat-view">
      <div className="c-chat-header">
        <button className="c-back-btn" onClick={onBack}>←</button>
        <div className="c-chat-icon">📜</div>
        <div className="c-chat-title">
          <div className="c-chat-name">Bhagavad Gita</div>
          <div className="c-chat-sub">Verse-by-verse wisdom — open to every tier</div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm((s) => !s)}
            style={{
              marginLeft: "auto",
              padding: "8px 14px",
              borderRadius: 14,
              background: showAddForm ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.1)",
              border: `1px solid ${GOLD}55`,
              color: GOLD,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {showAddForm ? "Close" : "+ Add Verse"}
          </button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <div
          style={{
            margin: "14px 16px 0",
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
            padding: 18,
            borderRadius: 24,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(30px)",
          }}
        >
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
            Transmit a verse
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <input
              type="number"
              min={1}
              max={18}
              placeholder="Chapter (1–18)"
              value={form.chapter}
              onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
              onBlur={handleChapterVerseBlur}
              style={inputStyle}
            />
            <input
              type="number"
              min={1}
              placeholder="Verse #"
              value={form.verse_number}
              onChange={(e) => setForm((f) => ({ ...f, verse_number: e.target.value }))}
              onBlur={handleChapterVerseBlur}
              style={inputStyle}
            />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, minHeight: 16 }}>
            {fetchingSanskrit
              ? "Fetching Sanskrit…"
              : sanskritFetchStatus === "ok"
                ? "✓ Sanskrit auto-filled below — edit if needed"
                : sanskritFetchStatus === "notfound"
                  ? "Couldn't auto-find this verse — paste Sanskrit manually below"
                  : "Enter chapter + verse, then tab out to auto-fill Sanskrit"}
          </div>

          <textarea
            placeholder="Sanskrit (auto-filled — editable)"
            value={form.sanskrit}
            onChange={(e) => setForm((f) => ({ ...f, sanskrit: e.target.value }))}
            style={{ ...inputStyle, width: "100%", minHeight: 50, marginBottom: 10, resize: "vertical" }}
          />
          <input
            type="text"
            placeholder="Transliteration (auto-filled — editable)"
            value={form.transliteration}
            onChange={(e) => setForm((f) => ({ ...f, transliteration: e.target.value }))}
            style={{ ...inputStyle, width: "100%", marginBottom: 14 }}
          />

          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            Language of this transmission
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => setForm((f) => ({ ...f, language: l.value }))}
                style={{
                  padding: "7px 14px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${form.language === l.value ? CYAN : "rgba(255,255,255,0.08)"}`,
                  background: form.language === l.value ? `${CYAN}22` : "rgba(255,255,255,0.02)",
                  color: form.language === l.value ? CYAN : "rgba(255,255,255,0.6)",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Your transmission — the deepening, the teaching (required)"
            value={form.translation}
            onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
            style={{ ...inputStyle, width: "100%", minHeight: 140, marginBottom: 10, resize: "vertical" }}
          />

          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            Transmitted by
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {TRANSMITTER_QUICK_PICKS.map((name) => (
              <button
                key={name}
                onClick={() => setForm((f) => ({ ...f, transmitted_by: name }))}
                style={{
                  padding: "6px 12px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${form.transmitted_by === name ? GOLD : "rgba(255,255,255,0.08)"}`,
                  background: form.transmitted_by === name ? `${GOLD}22` : "rgba(255,255,255,0.02)",
                  color: form.transmitted_by === name ? GOLD : "rgba(255,255,255,0.6)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type a name (e.g. a guest teacher)"
            value={form.transmitted_by}
            onChange={(e) => setForm((f) => ({ ...f, transmitted_by: e.target.value }))}
            style={{ ...inputStyle, width: "100%", marginBottom: 14 }}
          />

          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            Who receives this verse
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, tier_required: t.value }))}
                style={{
                  padding: "7px 12px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${form.tier_required === t.value ? tierBadgeColor(t.value) : "rgba(255,255,255,0.08)"}`,
                  background: form.tier_required === t.value ? `${tierBadgeColor(t.value)}22` : "rgba(255,255,255,0.02)",
                  color: form.tier_required === t.value ? tierBadgeColor(t.value) : "rgba(255,255,255,0.6)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={submitVerse}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 16,
              background: GOLD,
              color: "#050505",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Transmitting…" : "Transmit Verse"}
          </button>
        </div>
      )}

      {/* Reader language filter */}
      <div style={{ display: "flex", gap: 6, padding: "12px 16px 0", flexWrap: "wrap" }}>
        {LANGUAGES.filter((l) => languagesPresent.has(l.value) || l.value === "en").map((l) => (
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

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading the Gita…</div>
        ) : visibleVerses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {isAdmin ? "No verses yet in this language — tap + Add Verse to transmit the first one." : "No verses available for your tier in this language yet."}
          </div>
        ) : (
          chapterNums.map((ch) => {
            const collapsed = collapsedChapters[ch];
            return (
              <div key={ch} style={{ marginBottom: 18 }}>
                <button
                  onClick={() => setCollapsedChapters((s) => ({ ...s, [ch]: !s[ch] }))}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 4px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${GOLD}33`,
                    color: GOLD,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em" }}>Chapter {ch}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{byChapter[ch].length} verse{byChapter[ch].length === 1 ? "" : "s"} {collapsed ? "▸" : "▾"}</span>
                </button>
                {!collapsed &&
                  byChapter[ch].map((v: any) => (
                    <div
                      key={v.id}
                      style={{
                        marginTop: 12,
                        padding: 16,
                        borderRadius: 24,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        backdropFilter: "blur(30px)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)" }}>
                          {ch}.{v.verse_number}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "3px 8px",
                              borderRadius: 8,
                              color: tierBadgeColor(v.tier_required),
                              border: `1px solid ${tierBadgeColor(v.tier_required)}55`,
                            }}
                          >
                            {v.tier_required.replace("-", " ")}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => editVerse(v)}
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}
                              title="Edit verse"
                            >
                              ✎
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => deleteVerse(v.id)}
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}
                              title="Remove verse"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                      {v.sanskrit && (
                        <div style={{ fontSize: 15, lineHeight: 1.7, color: GOLD, marginBottom: 6, fontWeight: 600 }}>{v.sanskrit}</div>
                      )}
                      {v.transliteration && (
                        <div style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{v.transliteration}</div>
                      )}
                      <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap" }}>{highlightHolyTerms(v.translation)}</div>
                      {v.transmitted_by && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: `1px solid ${GOLD}22`,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            fontStyle: "italic",
                            color: GOLD,
                          }}
                        >
                          — transmitted by {v.transmitted_by}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  flex: 1,
};
