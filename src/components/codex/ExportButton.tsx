// ============================================================
// ExportButton — KDP-print-ready HTML + EPUB download
// ============================================================

import { useState } from "react";
import { exportPrintHtml, exportEpub } from "@/lib/codex/api";
import type { CodexType } from "@/lib/codex/types";

interface Props {
  codexType: CodexType;
  meta?: { title?: string; subtitle?: string; author?: string };
}

export function ExportButton({ codexType, meta }: Props) {
  const [busy, setBusy] = useState<"none" | "html" | "epub">("none");
  const [open, setOpen] = useState(false);

  async function doPrint() {
    setBusy("html");
    try {
      const { url } = await exportPrintHtml(codexType, meta);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert("Print export failed: " + String(e));
    } finally {
      setBusy("none");
    }
  }

  async function doEpub() {
    setBusy("epub");
    try {
      const blob = await exportEpub(codexType, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(meta?.title ?? "codex").replace(/[^a-z0-9]/gi, "-")}.epub`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("EPUB export failed: " + String(e));
    } finally {
      setBusy("none");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "12px 22px",
          borderRadius: 40,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(212,175,55,0.3)",
          color: "#D4AF37",
          fontWeight: 800,
          fontSize: 9,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          cursor: "pointer",
          backdropFilter: "blur(40px)",
        }}
      >
        Export · Print or eBook
      </button>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: 40,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <button
        onClick={doPrint}
        disabled={busy !== "none"}
        style={exportItemStyle}
      >
        <span style={{ fontWeight: 900 }}>Print Edition</span>
        <span style={subStyle}>
          KDP 6×9 · Open in browser → Print to PDF
        </span>
      </button>
      <button
        onClick={doEpub}
        disabled={busy !== "none"}
        style={exportItemStyle}
      >
        <span style={{ fontWeight: 900 }}>EPUB 3</span>
        <span style={subStyle}>Kindle · Apple Books · Kobo</span>
      </button>
      <button
        onClick={() => setOpen(false)}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.45)",
          fontWeight: 800,
          fontSize: 9,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          cursor: "pointer",
          marginTop: 6,
        }}
      >
        Close
      </button>
      {busy !== "none" && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Channeling the {busy === "html" ? "print edition" : "EPUB"} from the Akasha…
        </div>
      )}
    </div>
  );
}

const exportItemStyle: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 22,
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(212,175,55,0.18)",
  color: "rgba(255,255,255,0.9)",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 4,
  cursor: "pointer",
  textAlign: "left",
};

const subStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "#D4AF37",
  opacity: 0.65,
  fontWeight: 800,
};
