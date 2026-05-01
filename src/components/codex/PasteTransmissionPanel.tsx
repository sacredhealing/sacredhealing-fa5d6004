// ============================================================
// PasteTransmissionPanel — single & bulk manual intake
// ============================================================

import { useState } from "react";
import { channelTransmission, channelBulkPaste } from "@/lib/codex/api";
import type { CodexType, PasteInput } from "@/lib/codex/types";

interface Props {
  codexType: CodexType;
  onChanneled: () => void;
}

export function PasteTransmissionPanel({ codexType, onChanneled }: Props) {
  const [open, setOpen] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [originalDate, setOriginalDate] = useState("");
  const [routing, setRouting] = useState<"auto" | "force_akasha" | "force_portrait">(
    codexType === "akasha" ? "force_akasha" : "force_portrait"
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function channel() {
    if (content.trim().length < 20) {
      setStatus("Need at least 20 characters of transmission text.");
      return;
    }

    if (!bulk && content.length > 15000) {
      setStatus(
        `This transmission is very long (${content.length} characters). The classifier works best on focused 200–3000 word blocks. Consider splitting into multiple pastes using --- separators (Bulk mode), or proceed and the curator will weave the full text into one chapter.`
      );
    }

    setBusy(true);
    setStatus("Channeling into the Codex…");
    try {
      const meta: PasteInput = {
        raw_content: content,
        user_prompt: title || undefined,
        original_date: originalDate
          ? new Date(originalDate).toISOString()
          : undefined,
        routing_override: routing,
        source_type: "manual_paste",
        source_metadata: title ? { paste_title: title } : {},
      };

      let response: any;
      if (bulk) {
        response = await channelBulkPaste(codexType, content, meta);
      } else {
        response = await channelTransmission(codexType, meta);
      }

      const results =
        response?.results ??
        response?.data?.results ??
        (response && typeof response === "object" && "ok" in response ? [response] : []);
      const ok = results.filter((r: any) => r.ok && !r.excluded);
      const excluded = results.filter((r: any) => r.excluded);
      const failed = results.filter((r: any) => r.ok === false);

      if (failed.length > 0) {
        setStatus(
          `Curator failed: ${failed[0].error ?? "unknown error"}. Check edge function logs.`
        );
      } else if (excluded.length > 0 && ok.length === 0) {
        setStatus(
          `Classifier marked this as low-signal and skipped chapter creation. Reason: "${excluded[0].reason ?? "unspecified"}". Try forcing routing to Akashic or Portrait, or paste a richer block.`
        );
      } else if (ok.length > 0 || (results.length === 0 && response)) {
        const count = ok.length || 1;
        setStatus(
          `Channeled. ${count} chapter${count > 1 ? "s" : ""} woven. Refresh in 20s for the sigil.`
        );
        setContent("");
        setTitle("");
        setOriginalDate("");
        onChanneled();
        setTimeout(() => setOpen(false), 2500);
      } else {
        setStatus(
          "No response received. Check Supabase edge function logs for akasha-codex-curator."
        );
      }
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full"
        style={{
          padding: "14px 20px",
          borderRadius: 40,
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(212,175,55,0.25)",
          color: "#D4AF37",
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 900 }}>+</span>
        Paste a Transmission
      </button>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 40,
        padding: 24,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div
          style={{
            fontWeight: 800,
            fontSize: 9,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            color: "#D4AF37",
          }}
        >
          Channel a Transmission
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            letterSpacing: "0.3em",
            fontWeight: 800,
            textTransform: "uppercase",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <Toggle on={!bulk} onClick={() => setBulk(false)}>
          Single
        </Toggle>
        <Toggle on={bulk} onClick={() => setBulk(true)}>
          Bulk · split by ---
        </Toggle>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Optional title hint (e.g. 'Notes on Bob Marley')"
        style={inputStyle}
      />
      <input
        type="date"
        value={originalDate}
        onChange={(e) => setOriginalDate(e.target.value)}
        placeholder="Original date (optional)"
        style={{ ...inputStyle, colorScheme: "dark" }}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          bulk
            ? "Paste many entries separated by `---` on its own line. Each becomes a Transmission Block."
            : "Paste your transmission. Notes, journal entries, voice-memo transcripts, archived chats — anything already written."
        }
        rows={bulk ? 18 : 11}
        style={{ ...inputStyle, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 15, lineHeight: 1.6 }}
      />

      <div className="flex flex-wrap gap-2 mt-4 mb-4">
        <RoutingChip on={routing === "auto"} onClick={() => setRouting("auto")}>
          Auto-route
        </RoutingChip>
        <RoutingChip
          on={routing === "force_akasha"}
          onClick={() => setRouting("force_akasha")}
        >
          Force · Akashic
        </RoutingChip>
        <RoutingChip
          on={routing === "force_portrait"}
          onClick={() => setRouting("force_portrait")}
        >
          Force · Portrait
        </RoutingChip>
      </div>

      <button
        onClick={channel}
        disabled={busy}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: 40,
          background: busy ? "rgba(212,175,55,0.12)" : "#D4AF37",
          color: busy ? "#D4AF37" : "#050505",
          border: "none",
          fontWeight: 900,
          fontSize: 11,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          cursor: busy ? "wait" : "pointer",
          boxShadow: busy ? "none" : "0 0 30px rgba(212,175,55,0.35)",
        }}
      >
        {busy ? "Channeling…" : "Channel into Codex"}
      </button>

      {status && (
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  marginBottom: 10,
  borderRadius: 22,
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.9)",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  resize: "vertical",
};

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 999,
        background: on ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
        border: on
          ? "1px solid rgba(212,175,55,0.4)"
          : "1px solid rgba(255,255,255,0.05)",
        color: on ? "#D4AF37" : "rgba(255,255,255,0.6)",
        fontWeight: 800,
        fontSize: 8,
        letterSpacing: "0.4em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function RoutingChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        background: on ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
        border: on
          ? "1px solid rgba(212,175,55,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        color: on ? "#D4AF37" : "rgba(255,255,255,0.55)",
        fontWeight: 800,
        fontSize: 8,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
