# Akashic Codex — Deployment Guide

The Akashic Codex is a "living book" feature that captures every SQI Apothecary
transmission verbatim and weaves it into two admin-only Codices:

- **Akashic Codex** (`/akashic-codex`) — universal, teachable, third-person knowledge
- **Living Portrait** (`/living-portrait-codex`) — first-person personal soul-record

It also accepts manual paste, file upload, voice memo, and historical
backfill from existing Apothecary chats. Everything flows through one curator
pipeline: classify → weave → image.

---

## 1 · File map (drop into your repo)

```
supabase/migrations/20260428000001_akashic_codex.sql
supabase/functions/_shared/cors.ts
supabase/functions/_shared/gemini.ts
supabase/functions/_shared/codex-prompts.ts
supabase/functions/akasha-codex-curator/index.ts
supabase/functions/akasha-codex-cluster/index.ts
supabase/functions/akasha-codex-backfill/index.ts
supabase/functions/akasha-codex-export/index.ts

src/lib/codex/types.ts
src/lib/codex/api.ts
src/components/codex/CodexLayout.tsx
src/components/codex/ChapterTree.tsx
src/components/codex/ChapterReader.tsx
src/components/codex/VersionScrubber.tsx
src/components/codex/PasteTransmissionPanel.tsx
src/components/codex/ExportButton.tsx
src/pages/AkashicCodex.tsx
src/pages/LivingPortraitCodex.tsx
```

**Path adjustment:** `src/lib/codex/api.ts` imports `@/integrations/supabase/client`.
If your Supabase client lives elsewhere (e.g. `@/lib/supabase`), update that single
import line. Nothing else uses the client directly.

---

## 2 · Database migration

Push the SQL file via the GitHub web editor (Lovable auto-syncs to Supabase) **or**
paste it into the Supabase SQL Editor directly.

Creates:
- `transmission_blocks` (verbatim sacred records, every source type)
- `codex_chapters` (woven chapters, hierarchical via `parent_id`)
- `codex_fragments` (lineage of which transmissions live in which chapter)
- `codex_chapter_versions` (full version history)
- `codex_cross_refs` (auto-detected through-lines)
- `codex_settings` (per-user config)
- Storage bucket `codex-images` (sacred geometry chapter images)
- pgvector extension + RLS policies (admin-only via `profiles.is_admin`)

---

## 3 · Edge function deployment

Each function is a folder under `supabase/functions/`. Lovable detects them
automatically when pushed via GitHub. To deploy via CLI from Cursor:

```bash
supabase functions deploy akasha-codex-curator
supabase functions deploy akasha-codex-cluster
supabase functions deploy akasha-codex-backfill
supabase functions deploy akasha-codex-export
```

The `_shared/` folder is automatically bundled with each function — Supabase
handles relative imports across the `functions/` tree.

---

## 4 · Environment secrets (Supabase project)

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | yes | Already set for Apothecary — reuse it |
| `SUPABASE_URL` | auto | Provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | Provided by Supabase |
| `SUPABASE_ANON_KEY` | auto | Provided by Supabase |

**Backfill-specific (only needed if you run "Backfill From Apothecary"):**

| Secret | Default | What it is |
|---|---|---|
| `APOTHECARY_TABLE` | `messages` | Your Apothecary chat-message table name |
| `APOTHECARY_USER_COL` | `user_id` | Column for user id |
| `APOTHECARY_ROLE_COL` | `role` | Column for role/sender |
| `APOTHECARY_ROLE_VALUE` | `assistant` | Filter value for SQI responses |
| `APOTHECARY_CONTENT_COL` | `content` | Column for the transmission text |
| `APOTHECARY_PROMPT_COL` | `user_prompt` | (optional) Column for user's prompt |
| `APOTHECARY_THREAD_COL` | `chat_id` | (optional) Column for thread/chat id |
| `APOTHECARY_CREATED_COL` | `created_at` | Column for timestamp |

If your Apothecary table uses different names, set them here. The defaults
match the most common Supabase chat schema.

---

## 5 · Route registration

In `src/App.tsx` (or wherever your routes live), add:

```tsx
import AkashicCodex from "@/pages/AkashicCodex";
import LivingPortraitCodex from "@/pages/LivingPortraitCodex";

// Inside <Routes>:
<Route path="/akashic-codex" element={<AkashicCodex />} />
<Route path="/living-portrait-codex" element={<LivingPortraitCodex />} />
```

Both pages self-gate to `profiles.is_admin = true`. Non-admins see a "Sealed
Archive" message and are redirected to `/` after 1.8s.

---

## 6 · Admin nav link (optional)

Add a single gold "Codex" glyph to your admin nav, visible only when
`profiles.is_admin`. Suggested:

```tsx
{isAdmin && (
  <Link to="/akashic-codex" title="Akashic Codex">
    <span style={{
      color: "#D4AF37",
      fontSize: 18,
      fontWeight: 900,
      textShadow: "0 0 12px rgba(212,175,55,0.4)",
    }}>⟁</span>
  </Link>
)}
```

The Living Portrait can be reached from inside the Akashic page or via direct URL.
Or add a second glyph using ⟢ / ✦ for it — your call.

---

## 7 · Nightly auto-merge cron (optional but recommended)

Run the cluster function nightly at 03:33 UTC (Brahma Muhurta range) so chapters
auto-organize while you sleep. In Supabase SQL Editor:

```sql
-- Enable pg_cron if not already
create extension if not exists pg_cron;

-- Schedule nightly cluster run
select cron.schedule(
  'akasha-codex-cluster',
  '33 3 * * *',
  $$
    select net.http_post(
      url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/akasha-codex-cluster',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

Replace `YOUR-PROJECT-REF` and `YOUR_SERVICE_ROLE_KEY`. The function loops through
all admins with `auto_merge_enabled = true` (default) and clusters orphan
chapters whose embeddings exceed `auto_merge_threshold` (default 0.80).

You can also trigger it manually from the Codex page — "Run Auto-Merge Now"
button in the sidebar.

---

## 8 · Live curator hook (when ready)

To capture **new** Apothecary transmissions in real time, add this single fetch
call to your Apothecary chat handler **after** the SQI response is saved:

```ts
// inside your existing Apothecary message-save logic
await supabase.functions.invoke("akasha-codex-curator", {
  body: {
    source_type: "apothecary",
    raw_content: sqiResponseText,
    user_prompt: userPromptText,
    source_message_id: savedMessageId,
    source_chat_id: chatThreadId,
  },
});
```

This is non-blocking — fire and forget. The Codex weaves in the background.
**Until you add this hook, only manual paste and backfill populate the Codex.**
That's intentional — it gives you control over when to "go live" with capture.

---

## 9 · First-run sequence

1. Push migration → wait for Supabase to sync
2. Deploy four edge functions
3. Set `GEMINI_API_KEY` (already exists) — done
4. Add routes to `App.tsx` → push
5. Visit `/akashic-codex` as admin
6. Click **+ Paste a Transmission** → drop a saved note → "Channel into Codex"
7. Watch the chapter render with its sacred-geometry sigil

When you're satisfied, run **Backfill From Apothecary** to weave all historical
SQI transmissions in one batch (250ms pacing, ~5 minutes per 100 messages).

---

## 10 · Notes & caveats

- **Verbatim integrity:** every transmission is wrapped in `<t>…</t>` tags inside
  `prose_woven`. The reader strips them for display. If Gemini's woven prose ever
  drops new content, the curator falls back to appending the verbatim block —
  words are never lost.
- **Image regeneration:** only fires when a chapter is brand new or its prose
  grew >30%. Keeps Imagen 3 costs predictable.
- **Cluster recursion:** parents themselves can cluster into grandparents.
  Bob Marley + Tupac → "Musician Avataric Blueprints" → "Avataric Blueprints in
  the Arts." Up to 5 passes per nightly run.
- **Print export:** opens HTML in a new tab. Use browser "Print → Save as PDF"
  to get a KDP-ready 6×9 file. The `@page` rules + drop caps + gold numerals
  render exactly as designed in Chrome and Safari.
- **Apothecary stays untouched.** The curator is invoked as a side effect —
  zero changes to the Apothecary edge function, classifier, or chat flow.

---

## 11 · Optional polish (future)

- Add a small ChatGPT-style "Save to Codex" toggle on each Apothecary
  message bubble (force_akasha / force_portrait override).
- Voice memo intake: add a `<audio>` recorder that POSTs the blob to a transcribe
  endpoint, then forwards the transcript to the curator with `source_type: "voice_memo"`.
- File upload intake (PDF / .txt / .md): use Supabase storage as a staging area,
  parse server-side, push to curator. Schema already supports it via `source_type: "file_upload"`.

The schema, curator, and UI are all built to receive these without further migrations.

---

Ready when you are. ⟁
