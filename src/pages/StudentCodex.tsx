// ============================================================
// /student-codex/:studentId — the living book of one seeker.
// All SQI sessions opened with this student woven into one chapter.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CodexLayout } from "@/components/codex/CodexLayout";
import { ChapterReader } from "@/components/codex/ChapterReader";
import { getStudent, listStudentChapters, type Student } from "@/lib/codex/students";
import type { CodexChapter } from "@/lib/codex/types";

export default function StudentCodex() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [chapters, setChapters] = useState<CodexChapter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!studentId) return;
    setLoading(true);
    try {
      const [s, ch] = await Promise.all([getStudent(studentId), listStudentChapters(studentId)]);
      setStudent(s);
      setChapters(ch);
      if (!activeId && ch.length) setActiveId(ch[0].id);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [studentId]);

  const active = useMemo(
    () => chapters.find((c) => c.id === activeId) ?? null,
    [chapters, activeId],
  );

  const title = student?.name ? `${student.name} — Living Portrait` : "Student Portrait";
  const subtitle = student
    ? `${student.birth_date ?? "Birth date unknown"}${student.birth_place ? " · " + student.birth_place : ""}`
    : "Loading the seeker…";

  return (
    <CodexLayout codexType="student" title={title} subtitle={subtitle}>
      <div className="mb-4">
        <Link
          to="/students"
          style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase",
            color: "#D4AF37", textDecoration: "none",
          }}
        >
          ← All Students
        </Link>
      </div>

      {loading ? (
        <div style={msg}>Loading…</div>
      ) : !student ? (
        <div style={msg}>Student not found.</div>
      ) : chapters.length === 0 ? (
        <div style={msg}>
          No chapters yet for {student.name}.<br />
          Open SQI 2045, set <strong>{student.name}</strong> as the active student, and channel a session.
        </div>
      ) : active ? (
        <>
          {chapters.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {chapters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  style={{
                    padding: "6px 14px", borderRadius: 999,
                    background: c.id === activeId ? "#D4AF37" : "transparent",
                    color: c.id === activeId ? "#050505" : "rgba(212,175,55,0.85)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    fontWeight: 800, fontSize: 9, letterSpacing: "0.3em",
                    textTransform: "uppercase", cursor: "pointer",
                  }}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}
          <ChapterReader
            chapter={active}
            number={String(chapters.indexOf(active) + 1).padStart(2, "0")}
            onJumpTo={(id) => setActiveId(id)}
            onDeleted={() => { setActiveId(null); refresh(); }}
          />
        </>
      ) : null}
    </CodexLayout>
  );
}

const msg: React.CSSProperties = {
  padding: 60, textAlign: "center", color: "rgba(255,255,255,0.4)", fontStyle: "italic",
};
