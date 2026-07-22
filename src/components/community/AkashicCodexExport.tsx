// @ts-nocheck
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GOLD = "#D4AF37";
const CYAN = "#22D3EE";

interface Props {
  onClose: () => void;
}

export default function AkashicCodexExport({ onClose }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "classifying" | "ready" | "error">("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const run = async () => {
    setPhase("loading");
    try {
      const { data: entries, error } = await supabase
        .from("book_entries" as any)
        .select("id,title,content,tags,book_type,created_at")
        .eq("book_type", "akashic_codex")
        .eq("is_archived", false)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      if (!entries || entries.length === 0) {
        setPhase("ready");
        setResults([]);
        return;
      }

      setPhase("classifying");
      setProgress({ done: 0, total: entries.length });

      const BATCH_SIZE = 8;
      const classified: any[] = [];

      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const batchPayload = batch.map((e: any) => ({
          id: e.id,
          title: e.title,
          content: (e.content || "").slice(0, 1200),
        }));

        try {
          const { data, error: fnError } = await supabase.functions.invoke("gemini-bridge", {
            body: {
              messages: [
                {
                  role: "user",
                  content: `You are identifying which entries below are teachings on specific Bhagavad Gita verses. For EACH entry, determine: is it a commentary/teaching tied to a specific Bhagavad Gita chapter and verse? If yes, give your best-guess chapter (1-18) and verse number. If it's general spiritual knowledge not tied to a specific Gita verse, mark is_gita false.

Respond ONLY with a JSON array, no markdown fences, no preamble, in this exact shape:
[{"id":"...", "is_gita": true, "chapter": 4, "verse": 26, "confidence": "high", "reason": "mentions BG 4.26 sense withdrawal"}, ...]

Entries:
${JSON.stringify(batchPayload)}`,
                },
              ],
            },
          });
          if (fnError) throw fnError;
          let raw = (data as any)?.response?.trim() || "[]";
          raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
          const parsed = JSON.parse(raw);
          const byId: Record<string, any> = {};
          parsed.forEach((p: any) => { byId[p.id] = p; });
          batch.forEach((e: any) => {
            const c = byId[e.id] || {};
            classified.push({
              id: e.id,
              title: e.title,
              content: e.content,
              tags: e.tags,
              is_gita: !!c.is_gita,
              chapter: c.chapter || null,
              verse: c.verse || null,
              confidence: c.confidence || "low",
              reason: c.reason || "",
            });
          });
        } catch (batchErr) {
          console.warn("Batch classification failed, keeping entries unclassified:", batchErr);
          batch.forEach((e: any) => {
            classified.push({
              id: e.id, title: e.title, content: e.content, tags: e.tags,
              is_gita: false, chapter: null, verse: null, confidence: "low", reason: "classification failed",
            });
          });
        }
        setProgress({ done: Math.min(i + BATCH_SIZE, entries.length), total: entries.length });
      }

      setResults(classified);
      setPhase("ready");
    } catch (e: any) {
      console.error("Export failed:", e);
      setErrorMsg(e?.message || "Unknown error");
      setPhase("error");
      toast.error(`Export failed: ${e?.message || "unknown error"}`);
    }
  };

  const gitaEntries = results
    .filter((r) => r.is_gita && r.chapter)
    .sort((a, b) => (a.chapter - b.chapter) || ((a.verse || 0) - (b.verse || 0)));
  const otherEntries = results.filter((r) => !(r.is_gita && r.chapter));

  if (phase === "ready" && results.length > 0) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#050505", zIndex: 60, overflowY: "auto", padding: "24px 20px" }}>
        <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => window.print()}
            style={{ flex: 1, padding: "12px", borderRadius: 14, background: GOLD, color: "#050505", fontWeight: 900, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", border: "none", cursor: "pointer" }}
          >
            Save as PDF (Print)
          </button>
          <button
            onClick={onClose}
            style={{ padding: "12px 18px", borderRadius: 14, background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, fontSize: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
          >
            Close
          </button>
        </div>

        <h1 style={{ color: GOLD, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Akashic Codex — Bhagavad Gita Extract</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 28 }}>
          {gitaEntries.length} entries matched to a Gita chapter/verse · {otherEntries.length} not tied to a specific verse · {results.length} total. Chapter/verse are Gemini's best guess — please review before transmitting.
        </p>

        {gitaEntries.length > 0 && (
          <>
            <h2 style={{ color: CYAN, fontSize: 15, fontWeight: 800, marginBottom: 14, borderBottom: `1px solid ${CYAN}33`, paddingBottom: 6 }}>
              Identified Gita Verses
            </h2>
            {gitaEntries.map((e) => (
              <div key={e.id} style={{ marginBottom: 22, pageBreakInside: "avoid" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ color: GOLD, fontWeight: 900, fontSize: 14 }}>BG {e.chapter}.{e.verse || "?"}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase" }}>{e.confidence} confidence</span>
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{e.title}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.content}</div>
                {e.reason && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontStyle: "italic", marginTop: 6 }}>Why: {e.reason}</div>}
              </div>
            ))}
          </>
        )}

        {otherEntries.length > 0 && (
          <>
            <h2 style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 800, margin: "24px 0 14px", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 6 }}>
              Other Sacred Knowledge (not tied to a specific Gita verse)
            </h2>
            {otherEntries.map((e) => (
              <div key={e.id} style={{ marginBottom: 22, pageBreakInside: "avoid" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{e.title}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.content}</div>
              </div>
            ))}
          </>
        )}

        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,5,0.95)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer" }}>✕</button>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
      <h2 style={{ color: GOLD, fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Export Akashic Codex → Gita PDF</h2>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24, maxWidth: 320 }}>
        Pulls every entry from your Akashic Codex, asks Gemini which Bhagavad Gita chapter and verse each one belongs to, and lays it out so you can review and copy into the Gita space.
      </p>

      {phase === "idle" && (
        <button
          onClick={run}
          style={{ padding: "14px 28px", borderRadius: 16, background: GOLD, color: "#050505", fontWeight: 900, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase", border: "none", cursor: "pointer" }}
        >
          Start
        </button>
      )}
      {phase === "loading" && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Loading your Codex…</div>}
      {phase === "classifying" && (
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          Identifying verses… {progress.done} / {progress.total}
        </div>
      )}
      {phase === "ready" && results.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>No Akashic Codex entries found.</div>
      )}
      {phase === "error" && (
        <div style={{ color: "#e07070", fontSize: 13 }}>
          Something went wrong: {errorMsg}
          <div style={{ marginTop: 12 }}>
            <button onClick={run} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
