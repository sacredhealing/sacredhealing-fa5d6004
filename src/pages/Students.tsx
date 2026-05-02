// ============================================================
// /students — practitioner manages their seekers (students).
// Each student has their own evolving chapter accessible at
// /student-codex/:studentId. Active student is selected here or
// via the StudentSelector inside the Admin SQI 2045 chat.
// ============================================================

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CodexLayout } from "@/components/codex/CodexLayout";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  setActiveStudentId,
  getActiveStudentId,
  type Student,
  type StudentInput,
} from "@/lib/codex/students";

const emptyForm: Partial<StudentInput> & { name: string } = {
  name: "",
  birth_date: "",
  birth_time: "",
  birth_place: "",
  notes: "",
};

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<StudentInput> & { name: string }>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(getActiveStudentId());

  async function refresh() {
    setLoading(true);
    try {
      setStudents(await listStudents());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      name: s.name,
      birth_date: s.birth_date ?? "",
      birth_time: s.birth_time ?? "",
      birth_place: s.birth_place ?? "",
      notes: s.notes ?? "",
      avatar_url: s.avatar_url ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name?.trim()) return;
    setBusy(true);
    try {
      const payload: Partial<StudentInput> = {
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        birth_time: form.birth_time || null,
        birth_place: form.birth_place?.trim() || null,
        notes: form.notes?.trim() || null,
        avatar_url: form.avatar_url?.trim() || null,
      };
      if (editing) {
        await updateStudent(editing.id, payload);
      } else {
        await createStudent({ ...payload, name: payload.name! });
      }
      setShowForm(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: Student) {
    if (!confirm(`Delete ${s.name} and ALL their session readings? This cannot be undone.`)) return;
    await deleteStudent(s.id);
    if (activeId === s.id) {
      setActiveStudentId(null);
      setActiveId(null);
    }
    await refresh();
  }

  function activate(s: Student) {
    setActiveStudentId(s.id);
    setActiveId(s.id);
  }
  function deactivate() {
    setActiveStudentId(null);
    setActiveId(null);
  }

  return (
    <CodexLayout
      codexType="student"
      title="My Students"
      subtitle="Each seeker has a living book. Select one as the active session, then channel through SQI — every reply weaves into their chapter."
    >
      <div className="flex items-center justify-between mb-6">
        <div className="text-[10px] uppercase tracking-[0.4em]" style={{ color: "rgba(212,175,55,0.7)" }}>
          {students.length} {students.length === 1 ? "Seeker" : "Seekers"}
        </div>
        <div className="flex gap-2">
          {activeId && (
            <button onClick={deactivate} style={btnGhost}>End Active Session</button>
          )}
          <button onClick={openNew} style={btnGold}>+ New Student</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic", padding: 40, textAlign: "center" }}>
          Loading the soul-registry…
        </div>
      ) : students.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic", padding: 40, textAlign: "center" }}>
          No students yet. Add a seeker to begin their living portrait.
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {students.map((s) => {
            const isActive = activeId === s.id;
            return (
              <div
                key={s.id}
                style={{
                  borderRadius: 22,
                  border: isActive ? "1px solid rgba(34,211,238,0.5)" : "1px solid rgba(212,175,55,0.18)",
                  background: "rgba(255,255,255,0.02)",
                  padding: 18,
                  boxShadow: isActive ? "0 0 24px rgba(34,211,238,0.15)" : "none",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#D4AF37" }}>{s.name}</div>
                  {isActive && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: "#22D3EE",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  {s.birth_date && <div>🜂 {s.birth_date}{s.birth_time ? ` · ${s.birth_time}` : ""}</div>}
                  {s.birth_place && <div>📍 {s.birth_place}</div>}
                  {!s.birth_date && !s.birth_place && <div style={{ fontStyle: "italic" }}>No birth data</div>}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {!isActive && <button onClick={() => activate(s)} style={btnSmallGold}>Begin Session</button>}
                  <Link to={`/student-codex/${s.id}`} style={btnSmallGhost as any}>View Book</Link>
                  <button onClick={() => openEdit(s)} style={btnSmallGhost}>Edit</button>
                  <button onClick={() => remove(s)} style={btnSmallDanger}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 24,
              padding: 24, width: "100%", maxWidth: 460, boxShadow: "0 0 60px rgba(212,175,55,0.15)",
            }}
          >
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "#D4AF37" }}>
              {editing ? "Edit Student" : "Register New Seeker"}
            </div>
            <h2 style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#D4AF37" }}>
              {editing ? editing.name : "New Living Portrait"}
            </h2>

            <div className="flex flex-col gap-3 mt-4">
              <Field label="Name *">
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </Field>
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <Field label="Birth Date">
                  <input type="date" value={form.birth_date ?? ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Birth Time">
                  <input type="time" value={form.birth_time ?? ""} onChange={(e) => setForm({ ...form, birth_time: e.target.value })} style={inputStyle} />
                </Field>
              </div>
              <Field label="Birth Place">
                <input value={form.birth_place ?? ""} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} placeholder="City, Country" style={inputStyle} />
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                  placeholder="Lineage, intentions, any context…"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} style={btnGhost}>Cancel</button>
              <button onClick={save} disabled={busy || !form.name?.trim()} style={btnGold}>
                {busy ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CodexLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.7)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 14,
  background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)", fontSize: 13, outline: "none",
};

const btnGold: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 999, background: "#D4AF37", color: "#050505",
  border: "none", fontWeight: 900, fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37",
  fontWeight: 800, fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", cursor: "pointer",
};

const btnSmallGold: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 999, background: "#D4AF37", color: "#050505",
  border: "none", fontWeight: 900, fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
};

const btnSmallGhost: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 999, background: "transparent",
  border: "1px solid rgba(212,175,55,0.25)", color: "rgba(212,175,55,0.85)",
  fontWeight: 800, fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
  textDecoration: "none", display: "inline-block",
};

const btnSmallDanger: React.CSSProperties = {
  padding: "6px 12px", borderRadius: 999, background: "transparent",
  border: "1px solid rgba(220,80,80,0.4)", color: "rgba(220,120,120,0.9)",
  fontWeight: 800, fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer",
};
