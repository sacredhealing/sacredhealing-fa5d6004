// src/components/codex/StudentSelector.tsx
// v3 — Prominent exit-session UX. ✕ on trigger exits immediately.
// Panel header shows "End session" clearly when a student is active.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Search, ChevronDown, Users } from "lucide-react";
import {
  listStudents,
  getActiveStudentId,
  setActiveStudentId,
  createStudent,
  type Student,
} from "@/lib/codex/students";

interface AppUser {
  user_id: string;
  full_name: string;
  email: string;
  has_jyotish: boolean;
  has_ayurveda: boolean;
}

export function useActiveStudent(): Student | null {
  const [student, setStudent] = useState<Student | null>(null);
  useEffect(() => {
    const sync = async () => {
      const id = getActiveStudentId();
      if (!id) { setStudent(null); return; }
      try {
        const { data } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
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

export function StudentSelector() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [activeId, setActiveId] = useState<string | null>(getActiveStudentId());
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Search
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
  const [createError, setCreateError] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const gold = "#D4AF37";
  const cyan = "#22D3EE";
  const danger = "#f87171";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, open]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listStudents();
      setStudents(list);
      const id = getActiveStudentId();
      if (id) setActiveStudent(list.find((s) => s.id === id) ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Sync active student from localStorage changes
  useEffect(() => {
    const sync = () => {
      const id = getActiveStudentId();
      setActiveId(id);
      if (!id) {
        setActiveStudent(null);
      }
    };
    window.addEventListener("sqi:active-student-changed", sync);
    return () => window.removeEventListener("sqi:active-student-changed", sync);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (searchTerm.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data, error } = await supabase.rpc("search_app_users", { search_term: searchTerm });
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
    window.dispatchEvent(new CustomEvent("sqi:active-student-changed", { detail: { id } }));
    setOpen(false);
    setView("list");
  }, []);

  // EXIT — clear student session immediately, no panel needed
  const exitSession = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectStudent(null);
  }, [selectStudent]);

  const handleCreate = async () => {
    setCreateError("");
    if (!newName.trim()) { setCreateError("Name is required"); return; }
    setCreating(true);
    try {
      const payload: Parameters<typeof createStudent>[0] = {
        name: newName.trim(),
        birth_date: newDate || undefined,
        birth_time: newTime || undefined,
        birth_place: newPlace || undefined,
        notes: newNotes || undefined,
      };
      const created = await createStudent(payload);
      if (linkedUser && created?.id) {
        await supabase.from("students").update({
          linked_user_id: linkedUser.user_id,
          linked_user_email: linkedUser.email,
        }).eq("id", created.id);
        const { data } = await supabase.from("students").select("*").eq("id", created.id).maybeSingle();
        if (data) selectStudent(data as Student);
      } else if (created) {
        selectStudent(created as Student);
      }
      setNewName(""); setNewDate(""); setNewTime("");
      setNewPlace(""); setNewNotes(""); setLinkedUser(null);
      setSearchTerm(""); setSearchResults([]);
      setView("list");
      await loadStudents();
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create student");
    }
    setCreating(false);
  };

  const isActive = !!activeId;

  // ─── List content ─────────────────────────────────────────────
  const ListContent = () => (
    <div>
      {/* Return to personal session — always at top, prominent when student is active */}
      <div
        onClick={() => selectStudent(null)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", cursor: "pointer",
          background: !activeId ? "rgba(212,175,55,0.05)" : "rgba(241,87,87,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          transition: "background 0.12s",
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: activeId ? "rgba(241,87,87,0.08)" : "rgba(255,255,255,0.04)",
          border: activeId ? "1px solid rgba(241,87,87,0.25)" : "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0,
          color: activeId ? "rgba(241,87,87,0.8)" : "rgba(255,255,255,0.25)",
        }}>
          {activeId ? "✕" : "—"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: activeId ? "rgba(241,87,87,0.9)" : "rgba(255,255,255,0.4)",
          }}>
            {activeId ? "End student session" : "Personal session"}
          </div>
          {activeId && (
            <div style={{ fontSize: 10, color: "rgba(241,87,87,0.5)", marginTop: 2 }}>
              Return to your own reading
            </div>
          )}
        </div>
        {!activeId && <span style={{ width: 7, height: 7, borderRadius: "50%", background: gold }} />}
      </div>

      {loading && (
        <div style={{ padding: "16px", fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
          Loading seekers…
        </div>
      )}

      {!loading && students.length === 0 && (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>No students yet</div>
          <button
            type="button"
            onClick={() => setView("create")}
            style={{
              padding: "8px 16px", borderRadius: 8, cursor: "pointer",
              background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.15em",
              textTransform: "uppercase", color: gold,
            }}
          >
            + Add first student
          </button>
        </div>
      )}

      {students.map((s) => {
        const linked = !!(s as any).linked_user_id;
        const initials = s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
        const isSelected = activeId === s.id;
        return (
          <div
            key={s.id}
            onClick={() => selectStudent(s)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", cursor: "pointer",
              background: isSelected ? "rgba(212,175,55,0.06)" : "transparent",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              transition: "background 0.12s",
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: linked ? "rgba(34,211,238,0.07)" : "rgba(212,175,55,0.07)",
              border: `1px solid ${linked ? "rgba(34,211,238,0.25)" : "rgba(212,175,55,0.18)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800,
              color: linked ? "rgba(34,211,238,0.7)" : "rgba(212,175,55,0.65)",
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 700, color: "rgba(225,210,185,0.92)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{s.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {s.birth_date ?? "No birth date"}{s.birth_place ? ` · ${s.birth_place}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {linked && (
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "2px 6px", borderRadius: 4,
                  background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.18)",
                  color: "rgba(34,211,238,0.55)",
                }}>Chart ✓</span>
              )}
              {isSelected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: gold }} />}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── Create content ───────────────────────────────────────────
  const CreateContent = () => (
    <div style={{ padding: "16px" }}>
      <div style={{
        fontSize: 8, fontWeight: 800, letterSpacing: "0.25em",
        textTransform: "uppercase", color: "rgba(212,175,55,0.4)", marginBottom: 10,
      }}>
        Find in app — links jyotish + ayurveda automatically
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
        borderRadius: 8, border: "1px solid rgba(212,175,55,0.18)",
        background: "rgba(212,175,55,0.03)", marginBottom: 8,
      }}>
        <Search size={13} style={{ color: "rgba(212,175,55,0.4)", flexShrink: 0 }} />
        <input
          type="text" placeholder="Search by name or email…"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "inherit",
          }}
        />
        {searchLoading && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>…</span>}
      </div>

      {searchResults.length > 0 && (
        <div style={{
          borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden", marginBottom: 10, maxHeight: 200, overflowY: "auto",
        }}>
          {searchResults.map((u) => (
            <div
              key={u.user_id}
              onClick={() => {
                setLinkedUser(u);
                setNewName(u.full_name || "");
                setSearchTerm("");
                setSearchResults([]);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: linkedUser?.user_id === u.user_id ? "rgba(212,175,55,0.07)" : "transparent",
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", flexShrink: 0,
              }}>
                {u.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(225,210,185,0.85)" }}>{u.full_name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{u.email}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {u.has_jyotish && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.55)" }}>Jyotish</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {linkedUser && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 8, marginBottom: 10,
          background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.15)",
          fontSize: 11, color: "rgba(34,211,238,0.7)",
        }}>
          <span>◈</span>
          <span style={{ flex: 1 }}>Linked to {linkedUser.full_name}</span>
          <button
            type="button"
            onClick={() => setLinkedUser(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(34,211,238,0.4)", padding: 0 }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {[
        { label: "Name *", value: newName, onChange: setNewName, placeholder: "Full name" },
        { label: "Birth date", value: newDate, onChange: setNewDate, placeholder: "YYYY-MM-DD" },
        { label: "Birth time", value: newTime, onChange: setNewTime, placeholder: "HH:MM (24h)" },
        { label: "Birth place", value: newPlace, onChange: setNewPlace, placeholder: "City, Country" },
        { label: "Notes for SQI", value: newNotes, onChange: setNewNotes, placeholder: "Optional context" },
      ].map(({ label, value, onChange, placeholder }) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 5 }}>
            {label}
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              fontSize: 14, color: "rgba(255,255,255,0.85)",
              fontFamily: "inherit", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      ))}

      {createError && (
        <div style={{ fontSize: 11, color: "#f87171", marginBottom: 10, padding: "6px 10px", borderRadius: 6, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          {createError}
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!newName.trim() || creating}
        style={{
          width: "100%", padding: "12px",
          borderRadius: 10, cursor: newName.trim() && !creating ? "pointer" : "not-allowed",
          background: "linear-gradient(135deg,rgba(212,175,55,0.16),rgba(212,175,55,0.08))",
          border: "1px solid rgba(212,175,55,0.3)",
          fontSize: 10, fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: gold,
          opacity: !newName.trim() || creating ? 0.4 : 1,
          marginBottom: 8,
        }}
      >
        {creating ? "Creating…" : "Create student → activate"}
      </button>
    </div>
  );

  // ─── Panel header ─────────────────────────────────────────────
  const PanelHeader = () => (
    <div style={{
      padding: "14px 16px 12px",
      borderBottom: "1px solid rgba(212,175,55,0.1)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 2,
      background: "rgba(10,7,3,0.98)", backdropFilter: "blur(40px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {view === "create" && (
          <button
            type="button"
            onClick={() => setView("list")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(212,175,55,0.5)", padding: "0 4px 0 0", display: "flex", alignItems: "center" }}
          >
            <ChevronDown size={14} style={{ transform: "rotate(90deg)" }} />
          </button>
        )}
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: view === "create" ? gold : "rgba(212,175,55,0.5)" }}>
          {view === "create" ? "New student" : "Reading for"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {view === "list" && (
          <button
            type="button"
            onClick={() => setView("create")}
            style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase", padding: "5px 10px", borderRadius: 6,
              border: "1px solid rgba(212,175,55,0.22)",
              background: "rgba(212,175,55,0.09)", color: gold, cursor: "pointer",
            }}
          >
            + New
          </button>
        )}
        <button
          type="button"
          onClick={() => { setOpen(false); setView("list"); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 2, display: "flex", alignItems: "center" }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      {/* ── TRIGGER BUTTON ── */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setOpen((v) => !v); setView("list"); }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px 5px 8px", borderRadius: 8, cursor: "pointer",
          border: `1px solid ${isActive ? "rgba(34,211,238,0.3)" : "rgba(212,175,55,0.18)"}`,
          background: isActive ? "rgba(34,211,238,0.07)" : "rgba(212,175,55,0.06)",
          color: isActive ? cyan : gold,
          fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
          whiteSpace: "nowrap", transition: "all 0.15s",
        }}
      >
        <Users size={12} />
        <span>{isActive ? (activeStudent?.name?.split(" ")[0] ?? "Student") : "Students"}</span>
        {isActive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cyan, boxShadow: `0 0 5px ${cyan}` }} />}
        <ChevronDown size={10} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {/* ── EXIT BUTTON — only shows when a student is active ── */}
      {isActive && (
        <button
          type="button"
          onClick={exitSession}
          title="Exit student session — return to personal reading"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: 6, cursor: "pointer",
            border: "1px solid rgba(241,87,87,0.35)",
            background: "rgba(241,87,87,0.08)",
            color: "rgba(241,87,87,0.8)",
            flexShrink: 0, transition: "all 0.15s",
          }}
        >
          <X size={12} />
        </button>
      )}

      {/* ── MOBILE: BOTTOM SHEET ── */}
      {isMobile && open && (
        <>
          <div
            onClick={() => { setOpen(false); setView("list"); }}
            style={{
              position: "fixed", inset: 0, zIndex: 998,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            }}
          />
          <div
            ref={panelRef}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              zIndex: 999, maxHeight: "85vh",
              display: "flex", flexDirection: "column",
              background: "rgba(8,5,2,0.99)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderBottom: "none",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -12px 60px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
            </div>
            <PanelHeader />
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
              {view === "list" ? <ListContent /> : <CreateContent />}
            </div>
            {activeStudent && view === "list" && (
              <div style={{
                padding: "10px 16px 20px",
                borderTop: "1px solid rgba(212,175,55,0.08)",
                background: "rgba(212,175,55,0.02)",
              }}>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,175,55,0.3)", marginBottom: 6 }}>
                  Soul data loaded into SQI
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(activeStudent as any).linked_user_id && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.6)" }}>Jyotish ✓</span>
                  )}
                  {activeStudent.birth_date && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,184,154,0.6)" }}>Born {activeStudent.birth_date}</span>
                  )}
                  {activeStudent.birth_place && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,184,154,0.6)" }}>{activeStudent.birth_place}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── DESKTOP: DROPDOWN ── */}
      {!isMobile && open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300,
            width: 340, maxHeight: "75vh",
            display: "flex", flexDirection: "column",
            background: "rgba(10,7,3,0.98)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 14, backdropFilter: "blur(40px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
            overflow: "hidden",
          }}
        >
          <PanelHeader />
          <div style={{ flex: 1, overflowY: "auto" }}>
            {view === "list" ? <ListContent /> : <CreateContent />}
          </div>
          {activeStudent && view === "list" && (
            <div style={{ padding: "8px 14px 10px", borderTop: "1px solid rgba(212,175,55,0.07)", background: "rgba(212,175,55,0.02)" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,175,55,0.3)", marginBottom: 5 }}>Soul data loaded into SQI</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(activeStudent as any).linked_user_id && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", color: "rgba(34,211,238,0.6)" }}>Jyotish ✓</span>}
                {activeStudent.birth_date && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,184,154,0.6)" }}>Born {activeStudent.birth_date}</span>}
                {activeStudent.birth_place && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(200,184,154,0.6)" }}>{activeStudent.birth_place}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
