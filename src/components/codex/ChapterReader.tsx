// ============================================================
// ChapterReader — book-quality page render
// ============================================================

import { useEffect, useState } from "react";
import { getChapterVersions, listCrossRefs, listChapterTransmitters } from "@/lib/codex/api";
import type { CodexChapter, CodexChapterVersion } from "@/lib/codex/types";
import { VersionScrubber } from "./VersionScrubber";

interface Props {
  chapter: CodexChapter;
  number: string;
  onJumpTo: (chapterId: string) => void;
}

export function ChapterReader({ chapter, number, onJumpTo }: Props) {
  const [versions, setVersions] = useState<CodexChapterVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<CodexChapterVersion | null>(null);
  const [crossRefs, setCrossRefs] = useState<Array<{
    to_chapter_id: string;
    strength: number | null;
    codex_chapters?: { id: string; title: string };
  }>>([]);
  const [transmitters, setTransmitters] = useState<string[]>([]);

  useEffect(() => {
    getChapterVersions(chapter.id).then(setVersions);
    listCrossRefs(chapter.id).then((rs) => setCrossRefs(rs as typeof crossRefs));
    listChapterTransmitters(chapter.id).then(setTransmitters);
    setActiveVersion(null);
  }, [chapter.id]);

  const proseSource = activeVersion?.prose_snapshot ?? chapter.prose_woven ?? "";
  const paragraphs = proseToParagraphs(proseSource);

  return (
    <article className="relative max-w-3xl mx-auto">
      {/* Chapter numeral */}
      <div
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: 900,
          color: "#D4AF37",
          fontSize: 84,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          textShadow: "0 0 28px rgba(212,175,55,0.25)",
          marginBottom: 14,
        }}
      >
        {number}
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          fontSize: 36,
          lineHeight: 1.1,
          color: "rgba(255,255,255,0.95)",
          marginBottom: 28,
        }}
      >
        {chapter.title}
      </h2>

      {/* Sacred geometry image */}
      {chapter.image_url && (
        <figure
          className="glass-card relative mx-auto mb-10"
          style={{
            width: "min(100%, 460px)",
            aspectRatio: "1 / 1",
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(212,175,55,0.18)",
            borderRadius: 40,
            padding: 14,
            boxShadow:
              "0 0 80px rgba(212,175,55,0.08), inset 0 0 40px rgba(212,175,55,0.04)",
          }}
        >
          <img
            src={chapter.image_url}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 28,
              filter: "contrast(1.06) saturate(1.05)",
            }}
          />
          <figcaption
            style={{
              position: "absolute",
              bottom: -22,
              left: "50%",
              transform: "translateX(-50%)",
              fontWeight: 800,
              fontSize: 8,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: "#D4AF37",
              opacity: 0.55,
              whiteSpace: "nowrap",
            }}
          >
            Vibrational Sigil · Prema-Pulse Encoded
          </figcaption>
        </figure>
      )}

      {/* Opening hook */}
      {chapter.opening_hook && (
        <blockquote
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: 19,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.78)",
            borderLeft: "1px solid #D4AF37",
            paddingLeft: 22,
            margin: "32px 0 36px 0",
          }}
        >
          {chapter.opening_hook}
        </blockquote>
      )}

      {/* Prose */}
      <div className="codex-prose">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={i === 0 ? "dropcap" : ""}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 17,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.82)",
              textAlign: "justify",
              textIndent: i === 0 ? 0 : "1.6em",
              margin: "0 0 0.65em 0",
            }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* Closing reflection */}
      {chapter.closing_reflection && (
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(212,175,55,0.25)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic",
            fontSize: 17,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {chapter.closing_reflection}
        </div>
      )}

      {/* Cross-references */}
      {crossRefs.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 8,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              color: "#D4AF37",
              opacity: 0.7,
              marginBottom: 14,
            }}
          >
            Through-Lines
          </div>
          <div className="flex flex-wrap gap-2">
            {crossRefs
              .sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
              .slice(0, 8)
              .map((r) =>
                r.codex_chapters ? (
                  <button
                    key={r.to_chapter_id}
                    onClick={() => onJumpTo(r.to_chapter_id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      color: "rgba(255,255,255,0.78)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {r.codex_chapters.title}
                  </button>
                ) : null
              )}
          </div>
        </div>
      )}

      {/* Version scrubber */}
      {versions.length > 1 && (
        <div style={{ marginTop: 64 }}>
          <VersionScrubber
            versions={versions}
            activeId={activeVersion?.id ?? null}
            onSelect={(v) => setActiveVersion(v)}
          />
        </div>
      )}

      {/* Drop cap CSS */}
      <style>{`
        .codex-prose p.dropcap::first-letter {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 900;
          color: #D4AF37;
          font-size: 4.4em;
          line-height: 0.85;
          float: left;
          padding: 0.06em 0.08em 0 0;
          text-shadow: 0 0 18px rgba(212,175,55,0.4);
        }
      `}</style>
    </article>
  );
}

// ----------------------------------------------------------------
// Strip <t>…</t> wrappers and split by blank-line into paragraphs.
// Verbatim content stays intact; this is purely cosmetic for reading.
// ----------------------------------------------------------------
function proseToParagraphs(prose: string): string[] {
  const cleaned = prose.replace(/<\/?t>/g, "").trim();
  return cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
