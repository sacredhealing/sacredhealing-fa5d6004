// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AkashicCodexExport from "./AkashicCodexExport";

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
    'Chitta Vritti', 'Turiya state', 'Turiya', 'Kutastha Chaitanya', 'Manomaya Kosha',
    'Pranamaya Kosha', 'Annamaya Kosha', 'Vijnanamaya Kosha', 'Anandamaya Kosha',
    '72,000 Nadis?', 'Nadis?', 'Sadhaka', 'Sadhana', 'Arjuna', 'Krishna', 'Bhagavan',
    'Atma', 'Brahman', 'Purusha', 'Prakriti', 'Sattva', 'Rajas', 'Tamas', 'Dharma', 'Karma',
    'Moksha', 'Samadhi', 'Bhakti', 'Jnana', 'Kriya Yoga', 'Kriya', 'Pranayama', 'Prana',
    'Kundalini', 'Sushumna', 'Ida', 'Pingala', 'Muladhara', 'Svadhishthana', 'Manipura',
    'Anahata', 'Vishuddha', 'Ajna', 'Sahasrara', 'Aum', 'Om', 'Maya', 'Avidya', 'Vairagya',
    'Ahimsa', 'Mahavatar Babaji', 'Babaji', 'Vishwananda', 'Paramahansa Yogananda', 'Yogananda',
    'Lahiri Mahasaya', 'Ramana Maharshi', 'Adi Shankara', 'Patanjali', 'Agni',
  ];
  // Longer/compound terms are listed before their shorter roots (e.g. "Kriya Yoga"
  // before "Kriya", "Pranayama" before "Prana") so they match as whole words first.
  // \b...\b prevents "Prana" from lighting up half of "Pranayama".
  return new RegExp(`\\b(${terms.join('|')})\\b`, 'g');
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

// Same lexicon as Siddha Lab, plus Arjuna and Krishna — the two names
// specific to Bhagavad Gita's own highlight list that don't appear
// elsewhere in the app.
const LEXICON = [
  { term: "Agni", def: "Fire — both the literal element and the inner transformative flame that burns away impurity." },
  { term: "Ahimsa", def: "Non-violence, in thought, word, and deed — the first ethical principle of yoga (the yamas)." },
  { term: "Ajna", def: "The third-eye chakra, between the eyebrows — seat of intuition and inner sight." },
  { term: "Anahata", def: "The heart chakra — seat of love, compassion, and connection." },
  { term: "Anandamaya Kosha", def: "The 'bliss sheath' — the subtlest of the five koshas (energetic bodies), closest to pure being." },
  { term: "Annamaya Kosha", def: "The 'food sheath' — the physical body, made of and sustained by matter." },
  { term: "Arjuna", def: "The warrior-prince and disciple to whom Krishna's teaching in the Bhagavad Gita is given — the reader's own stand-in, facing doubt on the battlefield of life." },
  { term: "Atma", def: "The individual soul, or true Self — distinct from the ego and the body." },
  { term: "Avidya", def: "Spiritual ignorance — the root misperception that we are separate from the Divine, said to be the source of all suffering." },
  { term: "Bhagavan", def: "'The Divine Lord' or 'Blessed One' — a title of deep reverence for God or a fully realized master." },
  { term: "Bhakti", def: "Devotion — the path of loving surrender and remembrance of the Divine." },
  { term: "Brahman", def: "The ultimate, formless reality underlying and pervading all existence." },
  { term: "Chitta Vritti", def: "The fluctuations, or waves, of the mind-stuff — the mental activity that meditation aims to still." },
  { term: "Dharma", def: "One's righteous duty or true path; also the cosmic order that upholds existence." },
  { term: "Ida", def: "The left, lunar subtle energy channel, running alongside the spine." },
  { term: "Jnana", def: "Knowledge — the path of wisdom and discernment toward liberation." },
  { term: "Karma", def: "The law of cause and effect through action — what is set in motion returns." },
  { term: "Krishna", def: "The divine charioteer and teacher who delivers the Gita's teaching to Arjuna — traditionally understood as an avatar, a direct descent of the Divine." },
  { term: "Kriya Yoga", def: "A specific technique of pranayama-based meditation for accelerated spiritual evolution, brought West by Lahiri Mahasaya and Paramahansa Yogananda." },
  { term: "Kundalini", def: "The dormant spiritual energy said to lie coiled at the base of the spine, awakened through advanced practice." },
  { term: "Kutastha Chaitanya", def: "The point of consciousness at the ajna center — in Kriya Yoga tradition, the seat of the 'single eye' referenced in scripture." },
  { term: "Manipura", def: "The solar plexus chakra — seat of willpower and personal power." },
  { term: "Manomaya Kosha", def: "The 'mental sheath' — one of the five koshas, governing thought and emotion." },
  { term: "Maya", def: "The cosmic illusion that veils ultimate reality, making the temporary appear permanent." },
  { term: "Moksha", def: "Liberation — freedom from the cycle of birth and death." },
  { term: "Muladhara", def: "The root chakra, at the base of the spine — seat of survival and grounding." },
  { term: "Nadis", def: "Subtle energy channels through which prana flows — traditionally said to number 72,000." },
  { term: "Om / Aum", def: "The primordial sound, said to be the vibration underlying all of creation." },
  { term: "Pingala", def: "The right, solar subtle energy channel, running alongside the spine." },
  { term: "Prakriti", def: "Primordial nature or matter — the active, creative principle, as distinct from pure consciousness." },
  { term: "Prana", def: "Life-force, or vital energy — that which animates breath and body." },
  { term: "Pranamaya Kosha", def: "The 'energy sheath' — governs the circulation of prana through the body." },
  { term: "Pranayama", def: "Yogic breath-control practices used to regulate and expand prana." },
  { term: "Purusha", def: "Pure consciousness, the witness — as distinct from Prakriti (matter/nature)." },
  { term: "Rajas", def: "The quality of passion, activity, and restlessness — one of the three gunas." },
  { term: "Sadhaka", def: "A spiritual practitioner or sincere seeker." },
  { term: "Sadhana", def: "Spiritual practice or discipline, undertaken consistently over time." },
  { term: "Sahasrara", def: "The crown chakra, at the top of the head — seat of union with the Divine." },
  { term: "Samadhi", def: "A state of meditative absorption — union of the meditator with the object of meditation." },
  { term: "Sattva", def: "The quality of purity, clarity, and balance — one of the three gunas." },
  { term: "Sushumna", def: "The central subtle energy channel, running along the spine, through which Kundalini is said to rise." },
  { term: "Svadhishthana", def: "The sacral chakra — seat of creativity, pleasure, and desire." },
  { term: "Tamas", def: "The quality of inertia, dullness, and darkness — one of the three gunas." },
  { term: "Turiya", def: "The 'fourth state' of consciousness, beyond waking, dreaming, and deep sleep — pure awareness itself." },
  { term: "Vairagya", def: "Dispassion, or non-attachment — freedom from being pulled by desire and aversion." },
  { term: "Vijnanamaya Kosha", def: "The 'wisdom sheath' — governs intellect, discernment, and higher understanding." },
  { term: "Vishuddha", def: "The throat chakra — seat of expression, communication, and truth." },
].sort((a, b) => a.term.localeCompare(b.term));

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
  const [showImportPicker, setShowImportPicker] = useState(false);
  const [showCodexExport, setShowCodexExport] = useState(false);
  const [bookEntries, setBookEntries] = useState<any[]>([]);
  const [loadingBookEntries, setLoadingBookEntries] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [fetchingSanskrit, setFetchingSanskrit] = useState(false);
  const [sanskritFetchStatus, setSanskritFetchStatus] = useState(null); // "ok" | "notfound" | null
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [readerLanguage, setReaderLanguage] = useState("en");
  const [showLexicon, setShowLexicon] = useState(false);
  const [lexiconSearch, setLexiconSearch] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingKeys, setTranslatingKeys] = useState<Set<string>>(new Set());
  const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});

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

  const translateVerse = useCallback(async (verse: any, targetLang: string) => {
    const key = `${verse.id}:${targetLang}`;
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
              content: `Translate the following spiritual teaching text into ${languageLabel(targetLang)}. Preserve paragraph breaks exactly as they are. Return ONLY the translated text — no preamble, no quotes, no notes.\n\n${verse.translation}`,
            },
          ],
          feature: "gita_translation",
        },
      });
      if (error) throw error;
      const translated = (data as any)?.response?.trim();
      if (translated) {
        setTranslations((prev) => ({ ...prev, [key]: translated }));
      } else {
        console.warn("Translation returned empty response:", data);
        setTranslationErrors((prev) => ({ ...prev, [key]: "empty response from translator" }));
        toast.error("Translation came back empty — check the gemini-bridge function logs in Supabase.");
      }
    } catch (e: any) {
      console.warn("Auto-translation failed:", e);
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

  const loadBookEntries = useCallback(async () => {
    setLoadingBookEntries(true);
    try {
      const { data, error } = await supabase
        .from("book_entries" as any)
        .select("id,title,content,tags,book_type,created_at")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setBookEntries((data as any[]) || []);
    } catch (e) {
      console.warn("Could not load book entries:", e);
      setBookEntries([]);
    } finally {
      setLoadingBookEntries(false);
    }
  }, []);

  const openImportPicker = () => {
    setShowImportPicker(true);
    if (bookEntries.length === 0) loadBookEntries();
  };

  const importEntry = (entry: any) => {
    setForm((f) => ({ ...f, translation: entry.content || "" }));
    setShowImportPicker(false);
    setShowAddForm(true);
    toast.success(`Imported "${entry.title}" — add chapter, verse, and tier, then Transmit`);
  };

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

  // Group by chapter+verse across all languages, preferring a native entry in the
  // reader's selected language. If none exists, fall back to English (or any
  // available language) and auto-translate the teaching text on the fly.
  const byKey: Record<string, any[]> = {};
  verses.forEach((v: any) => {
    const k = `${v.chapter}:${v.verse_number}`;
    if (!byKey[k]) byKey[k] = [];
    byKey[k].push(v);
  });
  const displayList = Object.values(byKey).map((group: any[]) => {
    const native = group.find((v) => (v.language || "en") === readerLanguage);
    if (native) return { ...native, isFallbackTranslation: false };
    const source = group.find((v) => (v.language || "en") === "en") || group[0];
    const key = `${source.id}:${readerLanguage}`;
    return {
      ...source,
      translation: translations[key] || source.translation,
      isFallbackTranslation: true,
      isTranslating: translatingKeys.has(key),
      translationError: translationErrors[key],
      sourceLanguage: source.language || "en",
      translationKey: key,
    };
  });

  useEffect(() => {
    if (readerLanguage === "en") return;
    displayList.forEach((v: any) => {
      if (v.isFallbackTranslation && !translations[v.translationKey] && !translatingKeys.has(v.translationKey)) {
        translateVerse(v, readerLanguage);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readerLanguage, verses]);

  const visibleVerses = displayList;
  const byChapter: Record<number, any[]> = {};
  visibleVerses.forEach((v: any) => {
    if (!byChapter[v.chapter]) byChapter[v.chapter] = [];
    byChapter[v.chapter].push(v);
  });
  const chapterNums = Object.keys(byChapter).map(Number).sort((a, b) => a - b);

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

          <button
            onClick={openImportPicker}
            style={{
              width: "100%",
              marginBottom: 10,
              padding: "9px 12px",
              borderRadius: 12,
              background: "rgba(34,211,238,0.08)",
              border: `1px solid ${CYAN}44`,
              color: CYAN,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            📖 Import from My Book
          </button>

          <button
            onClick={() => setShowCodexExport(true)}
            style={{
              width: "100%",
              marginBottom: 14,
              padding: "9px 12px",
              borderRadius: 12,
              background: "rgba(212,175,55,0.06)",
              border: `1px solid ${GOLD}33`,
              color: GOLD,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            📄 Export Akashic Codex → Gita PDF
          </button>

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

      <div style={{ padding: "12px 16px 0" }}>
        <button
          onClick={() => setShowLexicon((v) => !v)}
          style={{
            width: "100%", padding: "12px", borderRadius: 14,
            background: showLexicon ? "rgba(255,255,255,.05)" : "rgba(34,211,238,.08)",
            border: "1px solid rgba(34,211,238,.35)", color: "#22D3EE", fontWeight: 800, fontSize: 13, cursor: "pointer",
          }}
        >
          {showLexicon ? "✕ Close Lexicon" : "📖 Lexicon — Sanskrit & Deep Terms"}
        </button>

        {showLexicon && (
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(34,211,238,.2)", borderRadius: 16, padding: 16, marginTop: 12 }}>
            <input
              placeholder="Search a word…"
              value={lexiconSearch}
              onChange={(e) => setLexiconSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {LEXICON.filter((entry) =>
                !lexiconSearch.trim() || entry.term.toLowerCase().includes(lexiconSearch.trim().toLowerCase())
              ).map((entry) => (
                <div key={entry.term}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: GOLD }}>{entry.term}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5, marginTop: 2 }}>{entry.def}</div>
                </div>
              ))}
              {LEXICON.filter((entry) => entry.term.toLowerCase().includes(lexiconSearch.trim().toLowerCase())).length === 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>No match for "{lexiconSearch}".</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 48px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading the Gita…</div>
        ) : visibleVerses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {isAdmin ? "No verses yet — tap + Add Verse to transmit the first one." : "No verses available for your tier yet."}
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
                          {isAdmin && !v.isFallbackTranslation && (
                            <button
                              onClick={() => editVerse(v)}
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 13 }}
                              title="Edit verse"
                            >
                              ✎
                            </button>
                          )}
                          {isAdmin && !v.isFallbackTranslation && (
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
                      {v.isFallbackTranslation && (
                        <div style={{ fontSize: 10, color: v.translationError ? "#e07070" : "rgba(255,255,255,0.35)", fontStyle: "italic", marginBottom: 6 }}>
                          {v.isTranslating
                            ? "Translating…"
                            : v.translationError
                              ? `Translation failed (${v.translationError}) — showing ${languageLabel(v.sourceLanguage)} original`
                              : `Auto-translated from ${languageLabel(v.sourceLanguage)}`}
                        </div>
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

      {showImportPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,5,5,0.92)",
            backdropFilter: "blur(20px)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            padding: "20px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: GOLD }}>Import from My Book</div>
            <button
              onClick={() => setShowImportPicker(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="Search your Life Book & Akashic Codex entries…"
            value={importSearch}
            onChange={(e) => setImportSearch(e.target.value)}
            style={{ ...inputStyle, width: "100%", marginBottom: 14 }}
          />
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingBookEntries ? (
              <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading your book…</div>
            ) : (
              (() => {
                const filtered = bookEntries.filter((e: any) => {
                  if (!importSearch.trim()) return true;
                  const q = importSearch.toLowerCase();
                  return (
                    e.title?.toLowerCase().includes(q) ||
                    e.content?.toLowerCase().includes(q) ||
                    e.tags?.some((t: string) => t.toLowerCase().includes(q))
                  );
                });
                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                      No entries found{importSearch ? " for that search" : ""}.
                    </div>
                  );
                }
                return filtered.map((entry: any) => (
                  <button
                    key={entry.id}
                    onClick={() => importEntry(entry)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: 14,
                      marginBottom: 10,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{entry.title}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: entry.book_type === "akashic_codex" ? GOLD : CYAN, textTransform: "uppercase" }}>
                        {entry.book_type === "akashic_codex" ? "Akashic Codex" : "Life Book"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      {(entry.content || "").slice(0, 140)}{entry.content?.length > 140 ? "…" : ""}
                    </div>
                  </button>
                ));
              })()
            )}
          </div>
        </div>
      )}
      {showCodexExport && <AkashicCodexExport onClose={() => setShowCodexExport(false)} />}
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
