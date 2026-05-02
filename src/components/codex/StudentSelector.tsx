// ============================================================
// StudentSelector — dropdown to pick the active student for SQI session.
// When a student is selected, every SQI chat reply will be woven into
// that student's chapter inside the Student Codex.
// ============================================================
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStudents, getActiveStudentId, setActiveStudentId, type Student } from "@/lib/codex/students";

export function StudentSelector() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeId, setActive] = useState<string | null>(getActiveStudentId());
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const rows = await listStudents();
      setStudents(rows);
    } catch (e) {
      console.warn("[StudentSelector] failed to load students:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string | null };
      setActive(detail?.id ?? null);
    };
    window.addEventListener("sqi:active-student-changed", onChange);
    return () => window.removeEventListener("sqi:active-student-changed", onChange);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value || null;
    setActive(v);
    setActiveStudentId(v);
  }

  const active = students.find((s) => s.id === activeId) ?? null;

  return (
    <div
      className="flex flex-col gap-1 rounded-2xl border px-3 py-2"
      style={{ borderColor: "rgba(212,175,55,0.25)", background: "rgba(0,0,0,0.4)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[8px] font-extrabold uppercase tracking-[0.4em]"
          style={{ color: "rgba(212,175,55,0.7)" }}
        >
          Active Student
        </span>
        {active && (
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22D3EE", boxShadow: "0 0 8px #22D3EE" }} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={activeId ?? ""}
          onChange={onChange}
          disabled={loading}
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          <option value="" style={{ background: "#050505" }}>
            — None (route to Akasha / Portrait) —
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id} style={{ background: "#050505" }}>
              {s.name}
            </option>
          ))}
        </select>
        <Link
          to="/students"
          className="text-[8px] font-extrabold uppercase tracking-[0.3em]"
          style={{ color: "#D4AF37" }}
        >
          Manage
        </Link>
      </div>
      {active && (
        <div className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          All SQI replies are saving to <span style={{ color: "#D4AF37" }}>{active.name}</span>'s book.
        </div>
      )}
    </div>
  );
}
