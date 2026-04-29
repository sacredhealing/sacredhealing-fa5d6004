// ============================================================
// akasha-codex-backfill
// ============================================================
// Retroactively processes existing Apothecary chat history into the Codex.
// Calls akasha-codex-curator for each historical message.
//
// Configurable via env vars (set in Supabase project secrets):
//   APOTHECARY_TABLE       — default "messages"
//   APOTHECARY_USER_COL    — default "user_id"
//   APOTHECARY_ROLE_COL    — default "role"  (filter to assistant/sqi)
//   APOTHECARY_ROLE_VALUE  — default "assistant"
//   APOTHECARY_CONTENT_COL — default "content"
//   APOTHECARY_PROMPT_COL  — default "user_prompt" (optional)
//   APOTHECARY_THREAD_COL  — default "chat_id"     (optional)
//   APOTHECARY_CREATED_COL — default "created_at"
//
// Body: { user_id, since?: ISO date, until?: ISO date, limit?: number }
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(SUPABASE_URL, SERVICE_ROLE);

    const TABLE = Deno.env.get("APOTHECARY_TABLE") ?? "messages";
    const USER_COL = Deno.env.get("APOTHECARY_USER_COL") ?? "user_id";
    const ROLE_COL = Deno.env.get("APOTHECARY_ROLE_COL") ?? "role";
    const ROLE_VAL = Deno.env.get("APOTHECARY_ROLE_VALUE") ?? "assistant";
    const CONTENT_COL = Deno.env.get("APOTHECARY_CONTENT_COL") ?? "content";
    const PROMPT_COL = Deno.env.get("APOTHECARY_PROMPT_COL") ?? "user_prompt";
    const THREAD_COL = Deno.env.get("APOTHECARY_THREAD_COL") ?? "chat_id";
    const CREATED_COL = Deno.env.get("APOTHECARY_CREATED_COL") ?? "created_at";

    const body = (await req.json().catch(() => ({}))) as {
      user_id: string;
      since?: string;
      until?: string;
      limit?: number;
    };

    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let q = db
      .from(TABLE)
      .select("*")
      .eq(USER_COL, body.user_id)
      .eq(ROLE_COL, ROLE_VAL)
      .order(CREATED_COL, { ascending: true })
      .limit(body.limit ?? 500);
    if (body.since) q = q.gte(CREATED_COL, body.since);
    if (body.until) q = q.lte(CREATED_COL, body.until);

    const { data: rows, error } = await q;
    if (error) throw error;

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Skip messages already curated (transmission_blocks.source_message_id)
    const ids = (rows ?? []).map((r) => r.id).filter(Boolean);
    const { data: already } = await db
      .from("transmission_blocks")
      .select("source_message_id")
      .in("source_message_id", ids);
    const seen = new Set((already ?? []).map((r) => r.source_message_id));

    for (const r of rows ?? []) {
      if (seen.has(r.id)) {
        skipped++;
        continue;
      }
      const payload = {
        source_type: "backfill" as const,
        user_id: body.user_id,
        raw_content: r[CONTENT_COL] ?? "",
        user_prompt: r[PROMPT_COL] ?? null,
        source_message_id: r.id,
        source_chat_id: r[THREAD_COL] ?? null,
        original_date: r[CREATED_COL] ?? null,
        source_metadata: { backfill_at: new Date().toISOString() },
      };
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/akasha-codex-curator`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_ROLE}`,
            },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) errors.push(`${r.id}: ${res.status}`);
        else processed++;
      } catch (e) {
        errors.push(`${r.id}: ${String(e)}`);
      }
      // gentle pacing — do not flood Gemini
      await new Promise((res) => setTimeout(res, 250));
    }

    await db
      .from("codex_settings")
      .upsert({ user_id: body.user_id, last_backfill_at: new Date().toISOString() });

    return new Response(
      JSON.stringify({
        ok: true,
        total: rows?.length ?? 0,
        processed,
        skipped,
        errors: errors.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[backfill] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
