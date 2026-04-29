// ============================================================
// akasha-codex-cluster
// ============================================================
// Nightly auto-merge clustering. For each user / codex:
//  1. Find orphan chapters at the same depth
//  2. Pairwise cosine similarity (threshold from settings, default 0.80)
//  3. Group clusters of ≥2 chapters
//  4. Generate parent chapter via Gemini in SQI 2050 voice
//  5. Re-parent children, recompute parent embedding
// Recursion: orphan parents themselves can cluster into grandparents.
//
// Schedule via Supabase: every night at 03:33 UTC (Brahma Muhurta range).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { generateJson, cosineSim, avgEmbeddings } from "../_shared/gemini.ts";
import { PARENT_NAMER_PROMPT } from "../_shared/codex-prompts.ts";

interface NamerResult {
  title: string;
  opening_hook: string;
  closing_reflection: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Optional: { user_id?, codex_type?, threshold? } to scope a run
    const body = await req.json().catch(() => ({})) as {
      user_id?: string;
      codex_type?: "akasha" | "portrait";
      threshold?: number;
    };

    // For every user with codex_settings (or every distinct user with chapters)
    const { data: users } = await db
      .from("codex_chapters")
      .select("user_id")
      .then(({ data }) => ({
        data: Array.from(new Set((data ?? []).map((r) => r.user_id))),
      }));

    const targetUsers = body.user_id ? [body.user_id] : (users as string[]);
    const targetCodices: Array<"akasha" | "portrait"> =
      body.codex_type ? [body.codex_type] : ["akasha", "portrait"];

    const summary: unknown[] = [];
    for (const uid of targetUsers) {
      const settings = await getSettings(db, uid);
      if (!settings.auto_merge_enabled) continue;
      const threshold = body.threshold ?? settings.auto_merge_threshold ?? 0.80;
      for (const codex of targetCodices) {
        // Cluster recursively until no more merges happen
        let pass = 0;
        while (pass < 5) {
          const merges = await clusterPass(db, uid, codex, threshold);
          summary.push({ uid, codex, pass, merges });
          if (merges === 0) break;
          pass++;
        }
      }
      await db
        .from("codex_settings")
        .upsert({ user_id: uid, last_curator_run_at: new Date().toISOString() });
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[cluster] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ----------------------------------------------------------------
async function getSettings(db: ReturnType<typeof createClient>, uid: string) {
  const { data } = await db.from("codex_settings").select("*").eq("user_id", uid).maybeSingle();
  return {
    auto_merge_enabled: data?.auto_merge_enabled ?? true,
    auto_merge_threshold: data?.auto_merge_threshold ?? 0.80,
  };
}

// ----------------------------------------------------------------
// One clustering pass: find orphan-clusters at the same depth,
// create parents, return number of merges performed.
// ----------------------------------------------------------------
async function clusterPass(
  db: ReturnType<typeof createClient>,
  uid: string,
  codex: "akasha" | "portrait",
  threshold: number
): Promise<number> {
  const { data: orphans } = await db
    .from("codex_chapters")
    .select("id, title, slug, prose_woven, embedding, depth, parent_id")
    .eq("user_id", uid)
    .eq("codex_type", codex)
    .is("parent_id", null);
  if (!orphans || orphans.length < 2) return 0;

  // Embeddings to arrays
  const items = orphans
    .map((c) => ({
      id: c.id as string,
      title: c.title as string,
      depth: (c.depth as number) ?? 0,
      excerpt: ((c.prose_woven as string) ?? "").replace(/<\/?t>/g, "").slice(0, 400),
      emb: !c.embedding
        ? null
        : Array.isArray(c.embedding)
        ? (c.embedding as number[])
        : (JSON.parse(c.embedding as unknown as string) as number[]),
    }))
    .filter((c) => c.emb);

  if (items.length < 2) return 0;

  // Group by depth — only cluster siblings of same depth
  const byDepth = new Map<number, typeof items>();
  for (const it of items) {
    const arr = byDepth.get(it.depth) ?? [];
    arr.push(it);
    byDepth.set(it.depth, arr);
  }

  let merges = 0;

  for (const [depth, group] of byDepth.entries()) {
    if (group.length < 2) continue;

    // Greedy clustering: walk pairs above threshold, union-find
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      const p = parent.get(x);
      if (!p || p === x) return x;
      const r = find(p);
      parent.set(x, r);
      return r;
    };
    const union = (a: string, b: string) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };
    for (const it of group) parent.set(it.id, it.id);

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const sim = cosineSim(group[i].emb!, group[j].emb!);
        if (sim >= threshold) union(group[i].id, group[j].id);
      }
    }

    // Build clusters
    const clusters = new Map<string, typeof group>();
    for (const it of group) {
      const root = find(it.id);
      const arr = clusters.get(root) ?? [];
      arr.push(it);
      clusters.set(root, arr);
    }

    for (const cluster of clusters.values()) {
      if (cluster.length < 2) continue;

      // Generate parent in SQI 2050 voice
      const childSummary = cluster
        .map((c) => `• ${c.title}\n  ${c.excerpt}`)
        .join("\n\n");
      let named: NamerResult;
      try {
        named = await generateJson<NamerResult>(PARENT_NAMER_PROMPT, childSummary);
      } catch (e) {
        console.warn("[cluster] naming failed, using fallback", e);
        named = {
          title: `${cluster[0].title.split(" ")[0]} & Related`,
          opening_hook: "These chapters resonate as one field.",
          closing_reflection: "The thread continues across each.",
        };
      }

      const parentEmb = avgEmbeddings(cluster.map((c) => c.emb!));
      const slug = `${slugify(named.title)}-${Date.now().toString(36).slice(-4)}`;

      const { data: parentRow, error } = await db
        .from("codex_chapters")
        .insert({
          user_id: uid,
          codex_type: codex,
          parent_id: null,
          title: named.title,
          slug,
          opening_hook: named.opening_hook,
          prose_woven: "",
          closing_reflection: named.closing_reflection,
          embedding: parentEmb,
          depth: depth + 1,
          version: 1,
          is_auto_generated: true,
          cluster_strength: cluster.length,
          child_count: cluster.length,
        })
        .select("id")
        .single();
      if (error) {
        console.warn("[cluster] parent insert failed:", error);
        continue;
      }

      await db
        .from("codex_chapters")
        .update({ parent_id: parentRow.id })
        .in("id", cluster.map((c) => c.id));

      merges += cluster.length;
    }
  }

  return merges;
}
