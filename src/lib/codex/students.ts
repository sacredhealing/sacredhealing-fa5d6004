// ============================================================
// Students — practitioner's seekers, each with their own evolving
// chapter inside the Student Codex.
// ============================================================
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
import type { CodexChapter } from "./types";

const supabase = supabaseTyped as any;

export interface Student {
  id: string;
  practitioner_id: string;
  name: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  notes: string | null;
  avatar_url: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type StudentInput = Pick<
  Student,
  "name" | "birth_date" | "birth_time" | "birth_place" | "notes" | "avatar_url"
>;

const ACTIVE_STUDENT_KEY = "sqi_active_student_id";

export function getActiveStudentId(): string | null {
  try { return localStorage.getItem(ACTIVE_STUDENT_KEY); } catch { return null; }
}

export function setActiveStudentId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_STUDENT_KEY, id);
    else localStorage.removeItem(ACTIVE_STUDENT_KEY);
    window.dispatchEvent(new CustomEvent("sqi:active-student-changed", { detail: { id } }));
  } catch { /* ignore */ }
}

export async function listStudents(includeArchived = false): Promise<Student[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  let q = supabase
    .from("students")
    .select("*")
    .eq("practitioner_id", user.id)
    .order("name", { ascending: true });
  if (!includeArchived) q = q.eq("archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Student[];
}

export async function getStudent(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Student | null;
}

export async function createStudent(input: Partial<StudentInput> & { name: string }): Promise<Student> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const { data, error } = await supabase
    .from("students")
    .insert({
      practitioner_id: user.id,
      name: input.name,
      birth_date: input.birth_date ?? null,
      birth_time: input.birth_time ?? null,
      birth_place: input.birth_place ?? null,
      notes: input.notes ?? null,
      avatar_url: input.avatar_url ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Student;
}

export async function updateStudent(id: string, patch: Partial<StudentInput>): Promise<void> {
  const { error } = await supabase.from("students").update(patch).eq("id", id);
  if (error) throw error;
}

export async function archiveStudent(id: string): Promise<void> {
  const { error } = await supabase.from("students").update({ archived: true }).eq("id", id);
  if (error) throw error;
}

export async function deleteStudent(id: string): Promise<void> {
  // Cascade also wipes their chapters/transmissions via FK on delete cascade.
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

export async function listStudentChapters(studentId: string): Promise<CodexChapter[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("codex_chapters")
    .select("*")
    .eq("user_id", user.id)
    .eq("codex_type", "student")
    .eq("student_id", studentId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CodexChapter[];
}
