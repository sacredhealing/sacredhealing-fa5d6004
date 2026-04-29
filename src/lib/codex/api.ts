// ============================================================
// SQI 2050 Codex — API wrappers around Supabase
// Adjust the supabase import path to your existing client.
// ============================================================

import { supabase as supabaseTyped } from "@/integrations/supabase/client";
import type {
  CodexChapter,
  CodexChapterVersion,
  CodexSettings,
  CodexType,
  PasteInput,
  TransmissionBlock,
} from "./types";

// Codex tables aren't yet in the generated Supabase types; cast to `any`
// to bypass deep type instantiation. Runtime behavior is unchanged.
const supabase = supabaseTyped as any;

// ---- Admin gate ------------------------------------------------
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (error) {
    console.error("[codex] isAdmin RPC failed:", error);
    return false;
  }
  return data === true;
}

// ---- Chapters --------------------------------------------------
export async function listChapters(codex: CodexType): Promise<CodexChapter[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("codex_chapters")
    .select("*")
    .eq("user_id", user.id)
    .eq("codex_type", codex)
    .order("depth", { ascending: true })
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CodexChapter[];
}

export async function getChapter(id: string): Promise<CodexChapter | null> {
  const { data, error } = await supabase
    .from("codex_chapters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as CodexChapter | null;
}

export async function getChapterVersions(
  chapterId: string
): Promise<CodexChapterVersion[]> {
  const { data, error } = await supabase
    .from("codex_chapter_versions")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("version", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CodexChapterVersion[];
}

export async function listChapterFragments(chapterId: string) {
  const { data, error } = await supabase
    .from("codex_fragments")
    .select("position, transmission_blocks(*)")
    .eq("chapter_id", chapterId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    position: number;
    transmission_blocks: TransmissionBlock;
  }>;
}

export async function listCrossRefs(chapterId: string) {
  const { data, error } = await supabase
    .from("codex_cross_refs")
    .select("to_chapter_id, strength, codex_chapters!codex_cross_refs_to_chapter_id_fkey(id, title, codex_type)")
    .eq("from_chapter_id", chapterId);
  if (error) throw error;
  return data ?? [];
}

// ---- Curator: paste / single-shot ingest -----------------------
export async function channelTransmission(
  codex: CodexType,
  input: PasteInput
) {
  const { data, error } = await supabase.functions.invoke(
    "akasha-codex-curator",
    {
      body: {
        ...input,
        source_type: input.source_type ?? "manual_paste",
        // routing_override defaults to "auto" — Gemini decides target codex
        routing_override:
          input.routing_override ??
          (codex === "akasha" ? "force_akasha" : "force_portrait"),
      },
    }
  );
  if (error) throw error;
  return data;
}

// ---- Bulk paste — splits on `---` separator ---------------------
export async function channelBulkPaste(
  codex: CodexType,
  raw: string,
  meta?: Partial<PasteInput>
) {
  const chunks = raw
    .split(/^\s*---\s*$/m)
    .map((c) => c.trim())
    .filter((c) => c.length >= 20);
  if (!chunks.length) return { processed: 0 };

  const payload = chunks.map((c) => ({
    ...meta,
    raw_content: c,
    source_type: meta?.source_type ?? "manual_paste",
    routing_override:
      meta?.routing_override ??
      (codex === "akasha" ? "force_akasha" : "force_portrait"),
  }));
  const { data, error } = await supabase.functions.invoke(
    "akasha-codex-curator",
    { body: payload }
  );
  if (error) throw error;
  return { processed: chunks.length, data };
}

// ---- Backfill --------------------------------------------------
export async function runBackfill(opts?: {
  since?: string;
  until?: string;
  limit?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const { data, error } = await supabase.functions.invoke(
    "akasha-codex-backfill",
    { body: { user_id: user.id, ...opts } }
  );
  if (error) throw error;
  return data;
}

// ---- Cluster (manual trigger; nightly cron also calls this) ----
export async function runClustering(codexType?: CodexType) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.functions.invoke(
    "akasha-codex-cluster",
    { body: { user_id: user?.id, codex_type: codexType } }
  );
  if (error) throw error;
  return data;
}

// ---- Export ---------------------------------------------------
export async function exportPrintHtml(
  codex: CodexType,
  meta?: { title?: string; subtitle?: string; author?: string }
): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke(
    "akasha-codex-export",
    { body: { codex_type: codex, format: "print_html", ...meta } }
  );
  if (error) throw error;
  return data as { url: string };
}

export async function exportEpub(
  codex: CodexType,
  meta?: { title?: string; subtitle?: string; author?: string }
): Promise<Blob> {
  // Use raw fetch so we can stream the binary back
  const session = (await supabase.auth.getSession()).data.session;
  const url = `${(supabase as any).functionsUrl ?? ""}/akasha-codex-export`.replace(/^\/+/, "https://");
  // Fallback: build from supabase URL env if functionsUrl missing
  const fnUrl =
    (supabase as any).functionsUrl ??
    `${(supabase as any).supabaseUrl ?? ""}/functions/v1/akasha-codex-export`;
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codex_type: codex, format: "epub", ...meta }),
  });
  if (!res.ok) throw new Error(`EPUB export failed: ${res.status}`);
  return await res.blob();
}

// ---- Settings -------------------------------------------------
export async function getSettings(): Promise<CodexSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("codex_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data ?? null) as CodexSettings | null;
}

export async function upsertSettings(patch: Partial<CodexSettings>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const { error } = await supabase
    .from("codex_settings")
    .upsert({ user_id: user.id, ...patch });
  if (error) throw error;
}

// ---- Tree builder (client-side) -------------------------------
export function buildTree(rows: CodexChapter[]): CodexChapter[] {
  const byId = new Map<string, CodexChapter>();
  for (const r of rows) byId.set(r.id, { ...r, children: [] });
  const roots: CodexChapter[] = [];
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.children!.push(c);
    } else {
      roots.push(c);
    }
  }
  // Stable sort children by order_index
  const sortRec = (arr: CodexChapter[]) => {
    arr.sort((a, b) => a.order_index - b.order_index);
    for (const c of arr) if (c.children?.length) sortRec(c.children);
  };
  sortRec(roots);
  return roots;
}
