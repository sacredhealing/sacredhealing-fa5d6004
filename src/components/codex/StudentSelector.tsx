// src/components/codex/StudentSelector.tsx
// Complete rewrite — button in header opens panel.
// Replaces the old <select> dropdown inside the chat body.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Search, ChevronDown, Users } from "lucide-react";
import {
  listStudents,
  getActiveStudentId,
  setActiveStudentId,
  createStudent,
  updateStudent,
  type Student,
} from "@/lib/codex/students";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AppUser {
  user_id: string;
  full_name: string;
  email: string;
  has_jyotish: boolean;
  has_ayurveda: boolean;
}

// ─── Hook: exposes active student to parent (QuantumApothecary) ───────────────
export function useActiveStudent(): Student | null {
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const sync = async () => {
      const id = getActiveStudentId();
      if (!id) { setStudent(null); return; }
      try {
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        setStudent(data ?? null);
      } catch { setStudent(null); }
    };
    sync();
    const handler = () => sync();
    window.addEventListener("sqi:active-student-changed", handler);
    return () => window.removeEventListener("sqi:active-student-changed", handler);
  }, []);

  return student;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function StudentSelector() {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeId, setActiveId] = useState<string | null>(getActiveStudentId());
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // Find-in-app search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [linkedUser, setLinkedUser] = useState<AppUser | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load student list
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listStudents();
      setStudents(list);
      const id = getActiveStudentId();
      if (id) {
        const found = list.find((s) => s.id === id) ?? null;
        setActiveStudent(found);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search app users (debounced)
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (searchTerm.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data, error } = await supabase.rpc("search_app_users", {
          search_term: searchTerm,
        });
        if (!error && data) setSearchResults(data as AppUser[]);
      } catch { /* ignore */ }
      setSearchLoading(false);
    }, 350);
  }, [searchTerm]);

  const selectStudent = useCallback((student: Student | null) => {
    const id = student?.id ?? null;
    setActiveId(id);
    setActiveStudent(student);
    setActiveStudentId(id);
    window.dispatchEvent(new Event("sqi:active-student-changed"));
    setOpen(false);
    setShowCreate(false);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const payload: Parameters<typeof createStudent>[0] = {
        name: newName.trim(),
        birth_date: newDate || undefined,
        birth_time: newTime || undefined,
        birth_place: newPlace || undefined,
        notes: newNotes || undefined,
      };

      // If an app user was linked — attach their user_id and email
      // and patch via updateStudent after creation
      const created = await createStudent(payload);

      if (linkedUser && created?.id) {
        await supabase
          .from("students")
          .update({
            linked_user_id: linkedUser.user_id,
            linked_user_email: linkedUser.email,
          })
          .eq("id", created.id);
        // Re-fetch with link
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("id", created.id)
          .maybeSingle();
        if (data) { selectStudent(data as Student); }
      } else if (created) {
        selectStudent(created as Student);
      }

      // Reset form
      setNewName(""); setNewDate(""); setNewTime("");
      setNewPlace(""); setNewNotes(""); setLinkedUser(null);
      setSearchTerm(""); setSearchResults([]);
      setShowCreate(false);
      await loadStudents();
    } catch (err) {
      console.error("Create student:", err);
    }
    setCreating(false);
  };

  const isActive = !!activeId;
  const gold = "#D4AF37";
  const cyan = "#22D3EE";

  return (
    <div style={{ position: "relative" }}>
      {/* ── TRIGGER BUTTON ── */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px 4px 8px", borderRadius: 8, cursor: "pointer",
          border: `1px solid ${isActive ? "rgba(34,211,238,0.3)" : "rgba(212,175,55,0.18)"}`,
          background: isActive ? "rgba(34,211,238,0.06)" : "rgba(212,175,55,0.06)",
          color: isActive ? cyan : gold,
          fontSize: 7, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
          whiteSpace: "nowrap", transition: "all 0.15s",
        }}
      >
        <Users size={11} />
        <span>{isActive ? activeStudent?.name?.split(" ")[0] ?? "Student" : "Students"}</span>
        {isActive && (
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: cyan, boxShadow: `0 0 5px ${cyan}` }} />
        )}
        <ChevronDown size={10} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {/* ── PANEL ── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300,
            width: "min(340px, 92vw)", maxHeight: "80vh", overflowY: "auto",
            background: "rgba(10,7,3,0.98)", border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 14, backdropFilter: "blur(40px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
          }}
        >
          {/* Panel header */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(212,175,55,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)" }}>Reading for</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setShowCreate((v) => !v)}
                style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.08)", color: gold, cursor: "pointer" }}
              >
                + New student
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "/students"; }}
                style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
              >
                Manage
              </button>
            </div>
          </div>

          {showCreate && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(212,175,55,0.08)" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)", marginBottom: 10 }}>
                Find in app — links jyotish + ayurveda automatically
              </div>

              {/* App user search */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(212,175,55,0.18)", background: "rgba(212,175,55,0.03)", marginBottom: 8 }}>
                <Search size={11} style={{ color: "rgba(212,175,55,0.4)", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit" }}
                />
                {searchLoading && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>…</span>}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div style={{ borderRadius: 7, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 8 }}>
                  {searchResults.map((u) => (
                    <div
                      key={u.user_id}
                      onClick={() => { setLinkedUser(u); setNewName(u.full_name || ""); setSearchTerm(""); setSearchResults([]); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: linkedUser?.user_id === u.user_id ? "rgba(212,175,55,0.07)" : "transparent",
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
                        {u.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(225,210,185,0.85)" }}>{u.full_name}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>{u.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {u.has_jyotish && <span style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3, background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.55)" }}>Jyotish</span>}
                        {u.has_ayurveda && <span style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3, background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.55)" }}>Ayurveda</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Linked user notice */}
              {linkedUser && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, marginBottom: 8, background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.13)", fontSize: 10, color: "rgba(34,211,238,0.65)" }}>
                  <span>◈</span>
                  <span>Linked to {linkedUser.full_name} — soul data loads into SQI automatically</span>
                  <button type="button" onClick={() => setLinkedUser(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(34,211,238,0.4)", padding: 0 }}><X size={10} /></button>
                </div>
              )}

              {/* Form fields */}
              <div style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>Name *</div>
                <input type="text" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 7 }}>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>Birth date</div>
                  <input type="text" placeholder="YYYY-MM-DD" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>Birth time</div>
                  <input type="text" placeholder="HH:MM" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }} />
                </div>
              </div>

              <div style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>Birth place</div>
                <input type="text" placeholder="City, Country" value={newPlace} onChange={(e) => setNewPlace(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>Notes for SQI</div>
                <input type="text" placeholder="Optional context" value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "inherit", outline: "none" }} />
              </div>

              <button type="button" onClick={handleCreate} disabled={!newName.trim() || creating}
                style={{
                  width: "100%", padding: "8px", borderRadius: 8, cursor: newName.trim() && !creating ? "pointer" : "not-allowed",
                  background: "linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.07))",
                  border: "1px solid rgba(212,175,55,0.28)", fontSize: 8, fontWeight: 800,
                  letterSpacing: "0.2em", textTransform: "uppercase", color: gold,
                  opacity: !newName.trim() || creating ? 0.4 : 1,
                }}>
                {creating ? "Creating…" : "Create student → activate"}
              </button>
            </div>
          )}

          {/* Student list */}
          <div>
            {/* Personal session option */}
            <div
              onClick={() => selectStudent(null)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer",
                background: !activeId ? "rgba(212,175,55,0.05)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>—</div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Personal session</span>
              {!activeId && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: gold }} />}
            </div>

            {loading && <div style={{ padding: "10px 14px", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Loading…</div>}

            {students.map((s) => {
              const linked = !!(s as any).linked_user_id;
              const initials = s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const isSelected = activeId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => selectStudent(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer",
                    background: isSelected ? "rgba(212,175,55,0.06)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    transition: "background 0.12s",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: linked ? "rgba(34,211,238,0.06)" : "rgba(212,175,55,0.06)",
                    border: `1px solid ${linked ? "rgba(34,211,238,0.25)" : "rgba(212,175,55,0.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800, color: linked ? "rgba(34,211,238,0.7)" : "rgba(212,175,55,0.6)",
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(225,210,185,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>
                      {s.birth_date ?? "No birth date"}{s.birth_place ? ` · ${s.birth_place}` : ""}
                    </div>
                  </div>
                  {linked && (
                    <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 5px", borderRadius: 4, background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.18)", color: "rgba(34,211,238,0.55)", flexShrink: 0 }}>
                      App ✓
                    </span>
                  )}
                  {isSelected && <span style={{ width: 5, height: 5, borderRadius: "50%", background: gold, flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>

          {/* Active student data strip */}
          {activeStudent && (
            <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(212,175,55,0.07)", background: "rgba(212,175,55,0.02)" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,175,55,0.3)", marginBottom: 5 }}>Soul data loaded into SQI</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(activeStudent as any).linked_user_id && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.6)" }}>Jyotish ✓</span>
                )}
                {(activeStudent as any).linked_user_id && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.6)" }}>Ayurveda ✓</span>
                )}
                {activeStudent.birth_date && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,184,154,0.6)" }}>Born {activeStudent.birth_date}</span>
                )}
                {activeStudent.birth_place && (
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,184,154,0.6)" }}>{activeStudent.birth_place}</span>
                )}
              </div>
            </div>
          )}


        </div>
      )}
    </div>
  );
}
