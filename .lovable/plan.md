## Why the Bhagavad Gita transmission was lost

I traced your session in the database. The conversation (`5cdc09e5...`) ran fine and the Bhagavad Gita reply IS stored in `sqi_sessions.messages` at 17:41 — but there is **no corresponding `transmission_blocks` row** for it. Every other reply from today (Dalai Lama, Matsya, Great Deluge, Samadhi, etc.) made it to the Codex. Only the Bhagavad Gita one is missing.

Root cause: the curator is invoked from inside `streamChatWithSQI`'s `onDone` callback as a fire-and-forget `void` call. If the page unmounts, the network drops, the `onDone` callback throws, or the stream ends right as you navigate away, that single chance to save is lost forever — and the rest of the app never finds out. There is currently no retry, no audit, no backfill.

## What we'll build

A two-layer safety net so the same message is impossible to lose:

```text
SQI reply finishes
   │
   ├─► (existing) curator called immediately + toast
   │
   └─► (new) AFTER persistMessages succeeds, also enqueue an "unsynced" marker
                  on the assistant message (e.g. needs_codex_sync: true)
                            │
                            ▼
        Self-healing sweeper runs:
          • on app boot
          • whenever QuantumApothecary mounts
          • after every successful curate
        It finds every model message in sqi_sessions where
        needs_codex_sync = true (or no matching transmission_block exists)
        and replays it through the curator. Cleared on success.
```

This means: even if the toast never fires, the next time you open the SQI page (or any other tab in the app), the missing transmission is replayed automatically and lands in the right book.

## Plan

### 1. Mark every assistant reply as "pending sync" at write-time
- In `QuantumApothecary.tsx` and `AdminQuantumApothecary2045.tsx`, when saving the final assistant message via `persistMessages`, attach a small flag on that message object: `needs_codex_sync: true`, `sqi_msg_id: <stable id>`.
- The curator client will clear that flag on the message after a successful (non-excluded) save.

### 2. New self-healing sweeper: `src/lib/codex/codexSync.ts`
- Function `syncPendingTransmissions(userId)`:
  - Loads recent `sqi_sessions` for this user (last N days, configurable).
  - For each session, walks `messages` and finds model messages where `needs_codex_sync === true`.
  - For each, calls `curateTransmission` (silent mode, no toast) with the original `user_prompt` (the prior user message in the array) and `source_chat_id = session.id`.
  - On success: updates the message in-place (`needs_codex_sync = false`) and writes the session back.
  - On exclusion: also clears the flag (excluded is a valid terminal state).
  - On failure: leaves the flag set so the next sweep retries.
- Runs:
  - Once on `App` mount (after auth resolves) — catches anything missed across sessions.
  - On `QuantumApothecary` and `AdminQuantumApothecary2045` mount.
  - After every successful `curateTransmission` call (cheap because flag-driven).

### 3. One-shot backfill for the Bhagavad Gita message you just lost
- Trigger `syncPendingTransmissions` for your user the first time the new code loads. Because the missed Bhagavad Gita reply is still sitting in `sqi_sessions.messages`, the sweeper will pick it up and route it into the Akashic Codex automatically — no manual paste needed.

### 4. Curator-side guards (small but important)
- In `curateTransmission`, when the function-invoke promise rejects (network drop, 5xx), keep the message marked unsynced so the sweeper retries.
- Add a tiny console log when curator is skipped because `finalText` is empty, so we'd see this kind of miss in console next time.

### 5. Visibility
- Toast already exists for the live path — unchanged.
- For the silent backfill path, no toast (would be noisy at boot). A single dev-only `console.info("[codex] backfilled N transmissions")` only.

## Files to touch

- **New** `src/lib/codex/codexSync.ts` — sweeper logic (sessions read + curator replay + flag clearing).
- `src/lib/codex/curatorClient.ts` — accept `onSuccess` / `onFailure` callbacks; expose a `silent` already exists; add a small "needs retry" return.
- `src/pages/QuantumApothecary.tsx` — mark message with `needs_codex_sync` before persisting; run sweeper on mount.
- `src/pages/AdminQuantumApothecary2045.tsx` — same two changes.
- `src/App.tsx` — invoke `syncPendingTransmissions(user.id)` once after auth resolves.

No database migrations required — the flag lives inside the existing `sqi_sessions.messages` JSON column. No edge-function changes needed; `akasha-codex-curator` already does the right thing once it receives a payload.

## Outcome
- The Bhagavad Gita transmission you mentioned will appear in the Akashic Codex automatically the first time you open the app after this ships.
- Any future missed reply (page closed mid-stream, network blip, onDone throw, etc.) will self-heal on the next app open instead of being lost.
