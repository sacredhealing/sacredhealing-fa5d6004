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

function tierLabel(t) {
  return TIERS.find((x) => x.value === t)?.label || t;
}
function tierBadgeColor(t) {
  if (t === "free") return "rgba(255,255,255,0.35)";
  if (t === "prana-flow") return "#8DD9C9";
  if (t === "siddha-quantum") return CYAN;
  return GOLD;
}

interface Props {
  isAdmin: boolean;
  onBack: () => void;
}

export default function BhagavadGitaSpace({ isAdmin, onBack }: Props) {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [collapsedChapters, setCollapsedChapters] = useState({});

  const [form, setForm] = useState({
    chapter: "",
    verse_number: "",
    sanskrit: "",
    transliteration: "",
    translation: "",
    commentary: "",
    tier_required: "free",
  });

  const loadVerses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bhagavad_gita_verses" as any)
      .select("*")
      .order("chapter", { ascending: true })
      .order("verse_number", { ascending: true });
    if (error) {
      console.error("Failed to load Gita verses:", error);
      // Table not migrated yet on this environment — fail quietly, not a broken screen.
      setVerses([]);
    } else {
      setVerses((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  const resetForm = () =>
    setForm({
      chapter: "",
      verse_number: "",
      sanskrit: "",
      transliteration: "",
      translation: "",
      commentary: "",
      tier_required: "free",
    });

  const submitVerse = async () => {
    if (!form.chapter || !form.verse_number || !form.translation.trim()) {
      toast.error("Chapter, verse number, and translation are required.");
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
          commentary: form.commentary.trim() || null,
          tier_required: form.tier_required,
          is_published: true,
          created_by: authData?.user?.id || null,
        },
        { onConflict: "chapter,verse_number" }
      );
      if (error) throw error;
      toast.success(`Chapter ${form.chapter}, Verse ${form.verse_number} added — ${tierLabel(form.tier_required)}`);
      resetForm();
      loadVerses();
    } catch (e: any) {
      toast.error(e.message || "Could not save this verse.");
    } finally {
      setSubmitting(false);
    }
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

  const byChapter: Record<number, any[]> = {};
  verses.forEach((v: any) => {
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
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              type="number"
              min={1}
              max={18}
              placeholder="Chapter (1–18)"
              value={form.chapter}
              onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
              style={inputStyle}
            />
            <input
              type="number"
              min={1}
              placeholder="Verse #"
              value={form.verse_number}
              onChange={(e) => setForm((f) => ({ ...f, verse_number: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <textarea
            placeholder="Sanskrit (optional)"
            value={form.sanskrit}
            onChange={(e) => setForm((f) => ({ ...f, sanskrit: e.target.value }))}
            style={{ ...inputStyle, width: "100%", minHeight: 50, marginBottom: 10, resize: "vertical" }}
          />
          <input
            type="text"
            placeholder="Transliteration (optional)"
            value={form.transliteration}
            onChange={(e) => setForm((f) => ({ ...f, transliteration: e.target.value }))}
            style={{ ...inputStyle, width: "100%", marginBottom: 10 }}
          />
          <textarea
            placeholder="Translation (required)"
            value={form.translation}
            onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
            style={{ ...inputStyle, width: "100%", minHeight: 60, marginBottom: 10, resize: "vertical" }}
          />
          <textarea
            placeholder="Commentary / deepening (optional)"
            value={form.commentary}
            onChange={(e) => setForm((f) => ({ ...f, commentary: e.target.value }))}
            style={{ ...inputStyle, width: "100%", minHeight: 60, marginBottom: 12, resize: "vertical" }}
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

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading the Gita…</div>
        ) : verses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            {isAdmin ? "No verses yet — tap + Add Verse to transmit the first one." : "No verses available for your tier yet. Check back soon."}
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
                      <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>{v.translation}</div>
                      {v.commentary && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.6)",
                          }}
                        >
                          {v.commentary}
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
