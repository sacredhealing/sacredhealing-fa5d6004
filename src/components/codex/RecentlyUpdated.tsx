// ============================================================
// RecentlyUpdated — shows chapters that just received new content
// so user knows where their pasted/SQI transmissions landed.
// ============================================================

import { useMemo } from "react";
import type { CodexChapter } from "@/lib/codex/types";

interface Props {
  chapters: CodexChapter[];
  onSelect: (id: string) => void;
}

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export function RecentlyUpdated({ chapters, onSelect }: Props) {
  const recent = useMemo(() => {
    const now = Date.now();
    return [...chapters]
      .filter((c) => {
        const t = new Date(c.updated_at).getTime();
        return now - t < WINDOW_MS;
      })
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 4);
  }, [chapters]);

  if (!recent.length) return null;

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 22,
        background:
          "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,0,0,0.4))",
        border: "1px solid rgba(212,175,55,0.35)",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 8,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          color: "#D4AF37",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#D4AF37",
            boxShadow: "0 0 8px #D4AF37",
            animation: "codexPulse 1.6s ease-in-out infinite",
          }}
        />
        Recently Woven
      </div>
      <div className="flex flex-col gap-1.5">
        {recent.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: 14,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(212,175,55,0.15)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.title}
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.2em",
                color: "#D4AF37",
                opacity: 0.8,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {timeAgo(c.updated_at)}
            </span>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes codexPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

export function isRecentlyUpdated(c: CodexChapter): boolean {
  return Date.now() - new Date(c.updated_at).getTime() < WINDOW_MS;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
