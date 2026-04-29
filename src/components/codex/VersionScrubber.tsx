// ============================================================
// VersionScrubber — vertical golden timeline of chapter evolution
// ============================================================

import type { CodexChapterVersion } from "@/lib/codex/types";

interface Props {
  versions: CodexChapterVersion[];
  activeId: string | null;
  onSelect: (v: CodexChapterVersion | null) => void;
}

export function VersionScrubber({ versions, activeId, onSelect }: Props) {
  if (!versions.length) return null;
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  return (
    <div
      className="glass-card p-6"
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 40,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 8,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          color: "#D4AF37",
          opacity: 0.7,
          marginBottom: 18,
        }}
      >
        Time-Stream · {sorted.length} Versions
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelect(null)}
          style={btnStyle(activeId === null)}
          className="flex items-center justify-between"
        >
          <span style={{ fontWeight: 800 }}>Now</span>
          <span style={tagStyle}>Live</span>
        </button>

        {sorted
          .slice()
          .reverse()
          .map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              style={btnStyle(activeId === v.id)}
              className="flex items-center justify-between"
            >
              <span style={{ fontWeight: 700 }}>v{v.version}</span>
              <span style={tagStyle}>
                {v.trigger_event ?? "edit"} · {formatDate(v.created_at)}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 22,
  background: active ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.02)",
  border: active
    ? "1px solid rgba(212,175,55,0.4)"
    : "1px solid rgba(255,255,255,0.05)",
  color: active ? "#D4AF37" : "rgba(255,255,255,0.7)",
  display: "flex",
  width: "100%",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  textAlign: "left",
});

const tagStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 8,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "#D4AF37",
  opacity: 0.7,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
