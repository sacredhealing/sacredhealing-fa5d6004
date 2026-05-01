import { useMemo } from "react";
import type { CodexChapter } from "@/lib/codex/types";

// KDP 6x9 page calibration. Roughly 280-320 words per page for a serif body.
const WORDS_PER_PAGE = 295;
const FRONT_MATTER_PAGES = 4;

function countWords(s: string | null | undefined): number {
  if (!s) return 0;
  return s.replace(/<\/?t>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

export function PageCount({ chapters }: { chapters: CodexChapter[] }) {
  const stats = useMemo(() => {
    let words = 0;
    for (const c of chapters) {
      words += countWords(c.opening_hook);
      words += countWords(c.prose_woven);
      words += countWords(c.closing_reflection);
    }
    const bodyPages = Math.ceil(words / WORDS_PER_PAGE);
    const chapterPages = chapters.length;
    const totalPages = FRONT_MATTER_PAGES + Math.max(bodyPages, chapterPages);
    return { words, totalPages, chapterCount: chapters.length };
  }, [chapters]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 22,
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(212,175,55,0.18)",
      }}
    >
      <Stat label="Pages" value={stats.totalPages} />
      <Stat label="Words" value={stats.words.toLocaleString()} />
      <Stat label="Chapters" value={stats.chapterCount} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontWeight: 900,
          fontSize: 18,
          color: "#D4AF37",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 7,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
