// ============================================================
// ChapterTree — hierarchical sidebar of all chapters
// ============================================================

import { useMemo } from "react";
import type { CodexChapter } from "@/lib/codex/types";
import { buildTree } from "@/lib/codex/api";
import { isRecentlyUpdated } from "./RecentlyUpdated";

interface Props {
  chapters: CodexChapter[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ChapterTree({ chapters, activeId, onSelect }: Props) {
  const tree = useMemo(() => buildTree(chapters), [chapters]);

  if (!chapters.length) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          fontStyle: "italic",
        }}
      >
        The Codex is empty. Channel a transmission to begin.
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-1.5">
      {tree.map((c, i) => (
        <TreeNode
          key={c.id}
          node={c}
          number={String(i + 1).padStart(2, "0")}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

interface NodeProps {
  node: CodexChapter;
  number: string;
  activeId: string | null;
  onSelect: (id: string) => void;
}

function TreeNode({ node, number, activeId, onSelect }: NodeProps) {
  const isActive = activeId === node.id;
  const isParent = (node.children?.length ?? 0) > 0;

  return (
    <div>
      <button
        onClick={() => onSelect(node.id)}
        className="w-full text-left transition-all"
        style={{
          padding: "10px 14px",
          borderRadius: 22,
          background: isActive
            ? "rgba(212,175,55,0.08)"
            : "rgba(255,255,255,0.02)",
          border: isActive
            ? "1px solid rgba(212,175,55,0.4)"
            : "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          color: isActive ? "#D4AF37" : "rgba(255,255,255,0.78)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 9,
            letterSpacing: "0.3em",
            color: "#D4AF37",
            opacity: isActive ? 1 : 0.7,
            flexShrink: 0,
            marginTop: 3,
            minWidth: 22,
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontWeight: isActive ? 900 : 700,
            letterSpacing: "-0.02em",
            fontSize: 14,
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {node.title}
          {isRecentlyUpdated(node) && (
            <span
              style={{
                display: "inline-block",
                marginLeft: 8,
                padding: "2px 7px",
                borderRadius: 999,
                background: "#D4AF37",
                color: "#050505",
                fontWeight: 900,
                fontSize: 7,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                verticalAlign: "middle",
                boxShadow: "0 0 10px rgba(212,175,55,0.55)",
              }}
            >
              New
            </span>
          )}
          {isParent && (
            <span
              style={{
                fontWeight: 800,
                fontSize: 8,
                letterSpacing: "0.3em",
                color: "#D4AF37",
                marginLeft: 8,
                opacity: 0.6,
                textTransform: "uppercase",
              }}
            >
              · {node.children!.length} Inside
            </span>
          )}
        </span>
      </button>

      {isParent && (
        <div
          className="mt-1.5 pl-5 flex flex-col gap-1"
          style={{ borderLeft: "1px solid rgba(212,175,55,0.15)", marginLeft: 18 }}
        >
          {node.children!.map((c, i) => (
            <TreeNode
              key={c.id}
              node={c}
              number={`${number}.${i + 1}`}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
