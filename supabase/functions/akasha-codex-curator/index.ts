// ============================================================
// akasha-codex-curator
// ============================================================
// Receives a transmission (live SQI, manual paste, file upload, backfill)
// → classifies it (Akasha / Portrait / split / excluded)
// → weaves it into the right chapter (creating chapter if needed)
// → generates a vibrational sacred-geometry image
// → records cross-references and version history
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import {
  embedText,
  generateJson,
  generateText,
  generateImage,
  cosineSim,
  avgEmbeddings,
} from "../_shared/gemini.ts";
import {
  CLASSIFIER_PROMPT,
  OPENER_PROMPT,
  WEAVER_PROMPT,
  IMAGE_PROMPT_GENERATOR,
} from "../_shared/codex-prompts.ts";

// ---- Types ------------------------------------------------
interface CuratorInput {
  source_type?: "apothecary" | "manual_paste" | "file_upload" | "voice_memo" | "backfill";
  raw_content: string;
  user_prompt?: string;
  source_message_id?: string;
  source_chat_id?: string;
  routing_override?: "auto" | "force_akasha" | "force_portrait";
  original_date?: string;
  source_metadata?: Record<string, unknown>;
  user_id?: string; // only honored when called with service role
}

interface ClassifierResult {
  target: "akasha" | "portrait" | "split" | "excluded";
  chapter_subject: string;
  topic_primary: string;
  topic_sub: string;
  transmitter: string;
  akasha_excerpt: string | null;
  portrait_excerpt: string | null;
  reasoning: string;
}

interface WeaverResult {
  opening_hook: string;
  prose_woven: string;
  closing_reflection: string;
  title_suggestion: string | null;
}

interface OpenerResult {
  title: string;
  opening_hook: string;
  closing_reflection: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function normalizeSubjectKey(s: string): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")           // strip diacritics
    .toLowerCase()
    .replace(/\bakasha\b|\bportrait\b|\bcodex\b|\bchapter\b/g, "")  // remove pollution
    .replace(/\b\d+\b/g, "")                   // remove standalone numbers
    .replace(/^(the |a |an |on |about |teaching )+/g, "")
    .replace(/[-_]/g, " ")                     // hyphens to spaces
    .replace(/[^a-z0-9 ]/g, "")                // strip everything non-alphanumeric
    .replace(/\s+/g, " ")                      // collapse whitespace
    .trim();
}

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Two clients: one for auth context, one with service role for storage etc.
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve user
    const {
      data: { user },
    } = await userClient.auth.getUser();
    const body = (await req.json()) as CuratorInput | CuratorInput[];
    const items = Array.isArray(body) ? body : [body];

    const results: unknown[] = [];
    for (const input of items) {
      const userId = user?.id ?? input.user_id;
      if (!userId) {
        results.push({ ok: false, error: "no user context" });
        continue;
      }
      try {
        const out = await processOne(adminClient, userId, input);
        results.push({ ok: true, ...out });
      } catch (err) {
        console.error("[curator] item failed:", err);
        results.push({ ok: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[curator] fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// Per-item pipeline
// ============================================================
async function processOne(
  db: ReturnType<typeof createClient>,
  userId: string,
  input: CuratorInput
) {
  const sourceType = input.source_type ?? "manual_paste";
  const content = (input.raw_content ?? "").trim();
  if (content.length < 20) {
    return { skipped: "content too short" };
  }

  // 1. Embed once — used for classification routing & chapter matching
  const embedding = await embedText(content);

  // 2. Classify with Gemini Flash (or honor override)
  let classification: ClassifierResult;
  if (input.routing_override === "force_akasha") {
    classification = await forcedClassify(content, "akasha");
  } else if (input.routing_override === "force_portrait") {
    classification = await forcedClassify(content, "portrait");
  } else {
    classification = await generateJson<ClassifierResult>(
      CLASSIFIER_PROMPT,
      `<transmission>\n${content}\n</transmission>\n\nUser's prompt that led to this (if any): ${input.user_prompt ?? "(none)"}`
    );
  }

  if (classification.target === "excluded") {
    // Still log the transmission as excluded — never lose anything
    await db.from("transmission_blocks").insert({
      user_id: userId,
      source_type: sourceType,
      source_message_id: input.source_message_id,
      source_chat_id: input.source_chat_id,
      source_metadata: {
        ...(input.source_metadata ?? {}),
        transmitter: classification.transmitter,
        chapter_subject: classification.chapter_subject,
      },
      user_prompt: input.user_prompt,
      raw_content: content,
      original_date: input.original_date,
      codex_target: "excluded",
      routing_override: input.routing_override ?? "auto",
      topic_primary: classification.topic_primary,
      topic_sub: classification.topic_sub,
      embedding,
      classified_at: new Date().toISOString(),
    });
    return { excluded: true, reason: classification.reasoning };
  }

  // 3. Determine target codices and content slices
  const targets: Array<{ codex: "akasha" | "portrait"; slice: string }> = [];
  if (classification.target === "akasha") {
    targets.push({ codex: "akasha", slice: content });
  } else if (classification.target === "portrait") {
    targets.push({ codex: "portrait", slice: content });
  } else if (classification.target === "split") {
    if (classification.akasha_excerpt) {
      targets.push({ codex: "akasha", slice: classification.akasha_excerpt });
    }
    if (classification.portrait_excerpt) {
      targets.push({ codex: "portrait", slice: classification.portrait_excerpt });
    }
  }

  const transmissionIds: string[] = [];
  const chapterIds: string[] = [];

  // 4. For each target codex, route + weave
  for (const t of targets) {
    const sliceEmbedding =
      t.slice === content ? embedding : await embedText(t.slice);

    // Insert transmission block (one per slice — full lineage preserved)
    const { data: tb, error: tbErr } = await db
      .from("transmission_blocks")
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_message_id: input.source_message_id,
        source_chat_id: input.source_chat_id,
        source_metadata: {
          ...(input.source_metadata ?? {}),
          transmitter: classification.transmitter,
          chapter_subject: classification.chapter_subject,
        },
        user_prompt: input.user_prompt,
        raw_content: t.slice,
        original_date: input.original_date,
        codex_target: t.codex,
        routing_override: input.routing_override ?? "auto",
        topic_primary: classification.topic_primary,
        topic_sub: classification.topic_sub,
        embedding: sliceEmbedding,
        classified_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (tbErr) throw tbErr;
    transmissionIds.push(tb.id);

    const chapterId = await weaveIntoChapter(
      db,
      userId,
      t.codex,
      t.slice,
      sliceEmbedding,
      classification,
      tb.id
    );
    chapterIds.push(chapterId);

    // Cross-references for the new/updated chapter
    await detectCrossRefs(db, userId, t.codex, chapterId, sliceEmbedding);
  }

  return { transmissionIds, chapterIds, classification };
}

// ============================================================
// Force-route helper (skip Gemini classification)
// ============================================================
async function forcedClassify(content: string, target: "akasha" | "portrait"): Promise<ClassifierResult> {
  // Still extract topics for chapter routing
  try {
    const r = await generateJson<{ topic_primary: string; topic_sub: string }>(
      "Extract topic_primary (umbrella) and topic_sub (specific theme) from this transmission. Return JSON: { topic_primary, topic_sub }.",
      content
    );
    return {
      target,
      chapter_subject: r.topic_sub || r.topic_primary || "Untitled",
      topic_primary: r.topic_primary || "Untitled",
      topic_sub: r.topic_sub || "",
      transmitter: "SQI 2050",
      akasha_excerpt: null,
      portrait_excerpt: null,
      reasoning: "manual override",
    };
  } catch {
    return {
      target,
      chapter_subject: "Untitled",
      topic_primary: "Untitled",
      topic_sub: "",
      transmitter: "SQI 2050",
      akasha_excerpt: null,
      portrait_excerpt: null,
      reasoning: "manual override (topic extraction failed)",
    };
  }
}

// ============================================================
// Weave logic — find chapter, weave, save version, regen image
// ============================================================
async function weaveIntoChapter(
  db: ReturnType<typeof createClient>,
  userId: string,
  codexType: "akasha" | "portrait",
  content: string,
  embedding: number[],
  cls: ClassifierResult,
  transmissionId: string
): Promise<string> {
  const subjectKey = normalizeSubjectKey(
    cls.chapter_subject || cls.topic_sub || cls.topic_primary || "untitled"
  );

  // 1. Try exact match on normalized subject_key
  const { data: exactMatches } = await db
    .from("codex_chapters")
    .select("id")
    .eq("user_id", userId)
    .eq("codex_type", codexType)
    .eq("subject_key", subjectKey)
    .limit(1);

  if (exactMatches && exactMatches.length > 0) {
    return await weaveExisting(db, userId, codexType, exactMatches[0].id as string, content, embedding, cls, transmissionId);
  }

  // 2. No exact match — ask Gemini if the new subject is an alias of any existing chapter
  const { data: existing } = await db
    .from("codex_chapters")
    .select("id, title, subject_key")
    .eq("user_id", userId)
    .eq("codex_type", codexType)
    .not("subject_key", "is", null);

  if (existing && existing.length > 0) {
    const aliasMatchId = await findAliasMatch(
      cls.chapter_subject || subjectKey,
      existing as Array<{ id: string; title: string; subject_key: string }>
    );
    if (aliasMatchId) {
      return await weaveExisting(db, userId, codexType, aliasMatchId, content, embedding, cls, transmissionId);
    }
  }

  // 3. Genuinely new subject — create a new chapter
  return await createChapter(db, userId, codexType, content, embedding, cls, transmissionId);
}

async function findAliasMatch(
  newSubject: string,
  existing: Array<{ id: string; title: string; subject_key: string }>
): Promise<string | null> {
  if (!existing.length) return null;
  const list = existing
    .map((c, i) => `${i}. id="${c.id}" title="${c.title}" key="${c.subject_key}"`)
    .join("\n");
  const prompt = `New chapter subject candidate: "${newSubject}"

Existing chapters in this Codex:
${list}

Question: Is the new subject the SAME CONCEPT as any existing chapter, just under a different spelling, transliteration, or framing? Examples of same concept: "Bible" = "Bibel" = "Holy Bible". "Babaji" = "Mahavatar Babaji" = "Babaji Maharaj". "Gayatri Mantra" = "Gāyatrī Mantra" = "Gayatri-Mantra". "Surya" = "Sun God" = "Surya Deva".

Different concepts even if related: "Surya" vs "Gayatri Mantra" (different — Surya is the deity, Gayatri Mantra is a sacred verse). "Bob Marley" vs "Tupac" (different musicians).

If the new subject IS the same concept as an existing chapter, return its id. Otherwise return null.

Return ONLY JSON: { "match_id": string | null, "reasoning": string }`;

  try {
    const result = await generateJson<{ match_id: string | null; reasoning: string }>(
      "You are a careful semantic matcher. Only match when the underlying concept is identical, not merely related. When uncertain, return null.",
      prompt,
      { temperature: 0.1, maxOutputTokens: 1024 }
    );
    if (result.match_id && existing.find((c) => c.id === result.match_id)) {
      console.log(`[curator] alias match: "${newSubject}" → ${result.match_id} (${result.reasoning})`);
      return result.match_id;
    }
  } catch (e) {
    console.warn("[curator] alias match check failed:", e);
  }
  return null;
}

// ---- New chapter creation ----------------------------------
async function createChapter(
  db: ReturnType<typeof createClient>,
  userId: string,
  codexType: "akasha" | "portrait",
  content: string,
  embedding: number[],
  cls: ClassifierResult,
  transmissionId: string
): Promise<string> {
  const opener = await generateJson<OpenerResult>(
    OPENER_PROMPT,
    `Topic primary: ${cls.topic_primary}\nTopic sub: ${cls.topic_sub}\n\nVerbatim transmission:\n<t>${content}</t>`,
    { temperature: 0.4, maxOutputTokens: 32768 }
  );

  const baseSlug = slugify(opener.title || cls.topic_sub || cls.topic_primary || "untitled");
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  const proseWoven = `<t>${content}</t>`;

  // Compute next order_index (max + 1) within int32 range
  const { data: maxRow } = await db
    .from("codex_chapters")
    .select("order_index")
    .eq("user_id", userId)
    .eq("codex_type", codexType)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow?.order_index ?? 0) as number) + 1;

  const { data: ch, error } = await db
    .from("codex_chapters")
    .insert({
      user_id: userId,
      codex_type: codexType,
      title: opener.title,
      slug,
      subject_key: normalizeSubjectKey(cls.chapter_subject || cls.topic_sub || opener.title),
      opening_hook: opener.opening_hook,
      prose_woven: proseWoven,
      closing_reflection: opener.closing_reflection,
      embedding,
      order_index: nextOrder,
      version: 1,
      is_auto_generated: true,
    })
    .select("id")
    .single();
  if (error) throw error;

  await db.from("codex_fragments").insert({
    chapter_id: ch.id,
    transmission_id: transmissionId,
    position: 0,
  });

  await db.from("codex_chapter_versions").insert({
    chapter_id: ch.id,
    version: 1,
    prose_snapshot: proseWoven,
    trigger_event: "new_transmission",
  });

  // Generate sacred geometry image asynchronously (await but don't block fatal)
  try {
    await generateChapterImage(db, ch.id, opener.title, cls.topic_primary, cls.topic_sub, opener.opening_hook, proseWoven);
  } catch (e) {
    console.warn(`[curator] image generation failed for ${ch.id}:`, e);
  }

  return ch.id as string;
}

// ---- Existing chapter weaving ------------------------------
async function weaveExisting(
  db: ReturnType<typeof createClient>,
  userId: string,
  codexType: "akasha" | "portrait",
  chapterId: string,
  content: string,
  embedding: number[],
  cls: ClassifierResult,
  transmissionId: string
): Promise<string> {
  const { data: chapter } = await db
    .from("codex_chapters")
    .select("id, title, opening_hook, prose_woven, closing_reflection, embedding, version")
    .eq("id", chapterId)
    .single();
  if (!chapter) throw new Error("chapter not found");

  const userPrompt = [
    `Chapter title: ${chapter.title}`,
    `Topic: ${cls.topic_primary} / ${cls.topic_sub}`,
    "",
    "Existing opening_hook:",
    chapter.opening_hook ?? "",
    "",
    "Existing prose_woven (verbatim transmissions are inside <t>...</t> tags — preserve exactly):",
    chapter.prose_woven ?? "",
    "",
    "Existing closing_reflection:",
    chapter.closing_reflection ?? "",
    "",
    "NEW verbatim transmission to integrate (preserve every word, wrap as <t>…</t>):",
    content,
  ].join("\n");

  const woven = await generateJson<WeaverResult>(WEAVER_PROMPT, userPrompt, {
    temperature: 0.4,
    maxOutputTokens: 32768,
  });

  // Verify integrity — ensure new content appears verbatim inside the new prose
  const newProse = woven.prose_woven.includes(content)
    ? woven.prose_woven
    : `${chapter.prose_woven ?? ""}\n\n<t>${content}</t>`; // safety fallback

  // Save fragment (position = current count)
  const { count } = await db
    .from("codex_fragments")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapterId);
  await db.from("codex_fragments").insert({
    chapter_id: chapterId,
    transmission_id: transmissionId,
    position: count ?? 0,
  });

  // Recompute chapter embedding as average of all fragment embeddings
  const { data: fragRows } = await db
    .from("codex_fragments")
    .select("transmission_blocks(embedding)")
    .eq("chapter_id", chapterId);
  const allEmbs: number[][] = [];
  for (const r of (fragRows as Array<{ transmission_blocks: { embedding: unknown } }> | null) ?? []) {
    const e = r.transmission_blocks?.embedding;
    if (e) {
      const arr = Array.isArray(e) ? (e as number[]) : JSON.parse(e as string);
      allEmbs.push(arr);
    }
  }
  const newChapterEmbedding = allEmbs.length ? avgEmbeddings(allEmbs) : embedding;

  const newVersion = (chapter.version ?? 1) + 1;
  await db
    .from("codex_chapters")
    .update({
      title: woven.title_suggestion ?? chapter.title,
      opening_hook: woven.opening_hook,
      prose_woven: newProse,
      closing_reflection: woven.closing_reflection,
      embedding: newChapterEmbedding,
      version: newVersion,
    })
    .eq("id", chapterId);

  await db.from("codex_chapter_versions").insert({
    chapter_id: chapterId,
    version: newVersion,
    prose_snapshot: newProse,
    trigger_event: "new_transmission",
  });

  // Image regeneration: only if the chapter has no image OR prose has grown >30%
  const oldLen = (chapter.prose_woven ?? "").length;
  const newLen = newProse.length;
  const grew = oldLen === 0 || (newLen - oldLen) / Math.max(oldLen, 1) > 0.3;
  if (grew) {
    try {
      await generateChapterImage(
        db,
        chapterId,
        woven.title_suggestion ?? chapter.title!,
        cls.topic_primary,
        cls.topic_sub,
        woven.opening_hook,
        newProse
      );
    } catch (e) {
      console.warn(`[curator] image regeneration failed for ${chapterId}:`, e);
    }
  }

  return chapterId;
}

// ============================================================
// Sacred geometry image generation
// ============================================================
async function generateChapterImage(
  db: ReturnType<typeof createClient>,
  chapterId: string,
  title: string,
  topicPrimary: string,
  topicSub: string,
  openingHook: string,
  prose: string
) {
  // Step 1: Gemini writes the Imagen prompt — vibrationally matched
  const promptInput = [
    `Chapter title: ${title}`,
    `Topic: ${topicPrimary} / ${topicSub}`,
    `Opening hook: ${openingHook}`,
    `Excerpt: ${prose.replace(/<\/?t>/g, "").slice(0, 800)}`,
  ].join("\n");
  const imagenPrompt = (await generateText(IMAGE_PROMPT_GENERATOR, promptInput, {
    temperature: 0.6,
    maxOutputTokens: 600,
  })).trim();

  // Step 2: Imagen 3 renders
  const bytes = await generateImage(imagenPrompt);

  // Step 3: Upload to storage
  const path = `${chapterId}/v${Date.now()}.png`;
  const { error: upErr } = await db.storage
    .from("codex-images")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw upErr;

  const { data: urlData } = db.storage.from("codex-images").getPublicUrl(path);

  await db
    .from("codex_chapters")
    .update({
      image_url: urlData.publicUrl,
      image_prompt: imagenPrompt,
      image_storage_path: path,
      image_generated_at: new Date().toISOString(),
      image_generation_count: undefined, // increment via RPC if you want; left simple
    })
    .eq("id", chapterId);

  // Increment count in a separate update (atomicish)
  await db.rpc("noop_codex_increment_image_count", { p_chapter_id: chapterId }).then(
    () => null,
    () => null // ignore if RPC not present
  );
}

// ============================================================
// Cross-references — auto-detect through-lines between chapters
// ============================================================
async function detectCrossRefs(
  db: ReturnType<typeof createClient>,
  userId: string,
  codexType: "akasha" | "portrait",
  chapterId: string,
  embedding: number[]
) {
  const { data: others } = await db
    .from("codex_chapters")
    .select("id, embedding")
    .eq("user_id", userId)
    .eq("codex_type", codexType)
    .neq("id", chapterId);

  for (const o of others ?? []) {
    if (!o.embedding) continue;
    const emb = Array.isArray(o.embedding)
      ? (o.embedding as number[])
      : JSON.parse(o.embedding as unknown as string);
    const sim = cosineSim(embedding, emb);
    if (sim >= 0.65) {
      await db
        .from("codex_cross_refs")
        .upsert(
          [
            { from_chapter_id: chapterId, to_chapter_id: o.id, strength: sim },
            { from_chapter_id: o.id, to_chapter_id: chapterId, strength: sim },
          ],
          { onConflict: "from_chapter_id,to_chapter_id" }
        );
    }
  }
}
